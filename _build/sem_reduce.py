#!/usr/bin/env python3
# =============================================================================
# SEMANTIC WING · STEP 2 — shrink the vector table so it can ship.
#
# Input : sem/vecs.f32 (14,888 x 300 float32), sem/vocab.txt
# Output: sem/red_K<k>.i8   one signed byte per kept dim, per word (code index)
#         sem/codebook_K<k>.txt   the 16 reconstruction levels
#         sem/fidelity.txt        measured rank agreement vs the full 300 dims
#
# Method
#   1. Keep the K dimensions with the highest variance across the vocabulary
#      (a diagonal approximation of PCA — cheap, deterministic, no numpy).
#   2. Renormalise each truncated vector to unit length, so a dot product is
#      still a cosine.
#   3. Quantise to 4 bits with a Lloyd-Max (1-D k-means) codebook fitted to the
#      pooled value distribution. 16 levels, one nibble per dimension.
#
# Fidelity is MEASURED, not assumed: for a sample of secret words we rank the
# whole vocabulary with the full 300-dim vectors and with the compressed table,
# and report Spearman rho, top-100 set overlap, and the worst rank displacement
# inside the true top 50. Those are the numbers that decide K.
#
# stdlib only. Deterministic (sample words are chosen by fixed stride).
# =============================================================================
import os, struct, sys, math
from array import array
from operator import mul

HERE = os.path.dirname(os.path.abspath(__file__))
SEM = os.path.join(HERE, "sem")
DIMS = 300
LEVELS = 16


def load():
    vocab = open(os.path.join(SEM, "vocab.txt"), encoding="utf-8").read().split()
    raw = array("f")
    with open(os.path.join(SEM, "vecs.f32"), "rb") as f:
        raw.frombytes(f.read())
    n = len(raw) // DIMS
    assert n == len(vocab), (n, len(vocab))
    return vocab, raw, n


def pick_dims(raw, n, K):
    """Top-K dimensions by variance across the vocabulary."""
    s = [0.0] * DIMS
    ss = [0.0] * DIMS
    for i in range(n):
        base = i * DIMS
        for d in range(DIMS):
            v = raw[base + d]
            s[d] += v
            ss[d] += v * v
    var = [(ss[d] / n) - (s[d] / n) ** 2 for d in range(DIMS)]
    idx = sorted(range(DIMS), key=lambda d: -var[d])[:K]
    return sorted(idx), var


def truncate(raw, n, dims):
    """Truncate to the kept dims and renormalise to unit length."""
    K = len(dims)
    out = array("f", bytes(4 * n * K))
    for i in range(n):
        base = i * DIMS
        o = i * K
        acc = 0.0
        for j, d in enumerate(dims):
            v = raw[base + d]
            out[o + j] = v
            acc += v * v
        inv = 1.0 / math.sqrt(acc) if acc > 0 else 0.0
        for j in range(K):
            out[o + j] *= inv
    return out


def lloyd_max(sample, levels=LEVELS, iters=40):
    """1-D k-means on the pooled value distribution. Symmetric init."""
    sample = sorted(sample)
    m = len(sample)
    # init: equal-count quantiles
    cent = [sample[min(m - 1, int((k + 0.5) * m / levels))] for k in range(levels)]
    for _ in range(iters):
        bnd = [(cent[k] + cent[k + 1]) / 2.0 for k in range(levels - 1)]
        sums = [0.0] * levels
        cnts = [0] * levels
        for v in sample:
            lo, hi = 0, levels - 1
            while lo < hi:
                mid = (lo + hi) // 2
                if v <= bnd[mid]:
                    hi = mid
                else:
                    lo = mid + 1
            sums[lo] += v
            cnts[lo] += 1
        moved = 0.0
        for k in range(levels):
            if cnts[k]:
                nc = sums[k] / cnts[k]
                moved = max(moved, abs(nc - cent[k]))
                cent[k] = nc
        if moved < 1e-7:
            break
    return cent


def quantise(trunc, n, K, cent):
    bnd = [(cent[k] + cent[k + 1]) / 2.0 for k in range(len(cent) - 1)]
    codes = bytearray(n * K)
    for i in range(n * K):
        v = trunc[i]
        lo, hi = 0, len(cent) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if v <= bnd[mid]:
                hi = mid
            else:
                lo = mid + 1
        codes[i] = lo
    return codes


def dequant(codes, n, K, cent):
    out = array("f", bytes(4 * n * K))
    for i in range(n * K):
        out[i] = cent[codes[i]]
    # renormalise again after quantisation
    for i in range(n):
        o = i * K
        acc = 0.0
        for j in range(K):
            acc += out[o + j] * out[o + j]
        inv = 1.0 / math.sqrt(acc) if acc > 0 else 0.0
        for j in range(K):
            out[o + j] *= inv
    return out


def rank_all(vecs, n, D, i):
    """Indices of every word, ordered by descending cosine with word i."""
    base = i * D
    q = vecs[base:base + D]
    sims = [0.0] * n
    for j in range(n):
        o = j * D
        sims[j] = sum(map(mul, q, vecs[o:o + D]))
    return sorted(range(n), key=lambda j: -sims[j])


def spearman(a, b):
    """a, b: rank arrays over the same items."""
    m = len(a)
    d2 = 0
    for i in range(m):
        d = a[i] - b[i]
        d2 += d * d
    return 1.0 - (6.0 * d2) / (m * (m * m - 1.0))


def main():
    Ks = [int(x) for x in sys.argv[1:]] or [128]
    vocab, raw, n = load()
    sys.stdout.write("vocab %d x %d dims\n" % (n, DIMS))

    # sample secrets: fixed stride over the most common 4,000 words
    SAMPLE = [i for i in range(40, 4000, 320)]

    full_ranks = {}
    for i in SAMPLE:
        order = rank_all(raw, n, DIMS, i)
        rk = [0] * n
        for pos, j in enumerate(order):
            rk[j] = pos
        full_ranks[i] = (order, rk)
    sys.stdout.write("reference rankings computed for %d sample words\n" % len(SAMPLE))

    lines = []
    for K in Ks:
        dims, var = pick_dims(raw, n, K)
        kept = sum(var[d] for d in dims)
        tot = sum(var)
        trunc = truncate(raw, n, dims)

        samp = [trunc[i] for i in range(0, n * K, 37)]
        cent = lloyd_max(samp)
        codes = quantise(trunc, n, K, cent)
        deq = dequant(codes, n, K, cent)

        rhos, overlaps, worst = [], [], []
        for i in SAMPLE:
            order, rk = full_ranks[i]
            order2 = rank_all(deq, n, K, i)
            rk2 = [0] * n
            for pos, j in enumerate(order2):
                rk2[j] = pos
            rhos.append(spearman(rk, rk2))
            t1 = set(order[:100]); t2 = set(order2[:100])
            overlaps.append(len(t1 & t2))
            worst.append(max(rk2[j] for j in order[:50]))

        with open(os.path.join(SEM, "red_K%d.i8" % K), "wb") as f:
            f.write(bytes(codes))
        with open(os.path.join(SEM, "dims_K%d.txt" % K), "w") as f:
            f.write(" ".join(str(d) for d in dims) + "\n")
        with open(os.path.join(SEM, "codebook_K%d.txt" % K), "w") as f:
            f.write(" ".join("%.6f" % c for c in cent) + "\n")

        nib = n * K // 2
        lines.append(
            "K=%3d  variance kept %.3f  bytes(4bit) %d  b64 %d  "
            "spearman %.5f  top100 overlap %.1f/100  worst-rank-of-true-top50 %d"
            % (K, kept / tot, nib, int(nib * 4 / 3) + 4,
               sum(rhos) / len(rhos), sum(overlaps) / float(len(overlaps)), max(worst)))
        sys.stdout.write(lines[-1] + "\n")
        sys.stdout.flush()

    with open(os.path.join(SEM, "fidelity.txt"), "w") as f:
        f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
