#!/usr/bin/env python3
# =============================================================================
# SEMANTIC WING · STEP 2c — keep all 300 dims, quantise the values.
#
# Why: measured, not guessed.
#   dimension SELECTION (sem_reduce.py) K=128 -> Spearman 0.803
#   real PCA         (sem_pca.py)       K=128 -> Spearman 0.882
#                                       K=192 -> Spearman 0.948
#   Numberbatch holds only 84.8% of its energy in the top 192 of 300
#   components, i.e. it is nearly isotropic and does not compress by rotation.
# So the honest move is to keep the full basis and spend the byte budget on
# quantisation instead, which loses far less per byte.
#
# Usage: sem_quant.py <bits> [<bits> ...]
# Output per B: sem/q<B>.u8  (one code per dim per word, packed later),
#               sem/q<B>_cb.txt, and a line in sem/fidelity_quant.txt
# =============================================================================
import math, os, sys
from array import array
from operator import mul

HERE = os.path.dirname(os.path.abspath(__file__))
SEM = os.path.join(HERE, "sem")
DIMS = 300


def load():
    vocab = open(os.path.join(SEM, "vocab.txt"), encoding="utf-8").read().split()
    raw = array("f")
    with open(os.path.join(SEM, "vecs.f32"), "rb") as f:
        raw.frombytes(f.read())
    return vocab, raw, len(raw) // DIMS


def lloyd_max(sample, levels, iters=80):
    sample = sorted(sample)
    m = len(sample)
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
        if moved < 1e-9:
            break
    return cent


def quantise(vec, cent):
    bnd = [(cent[k] + cent[k + 1]) / 2.0 for k in range(len(cent) - 1)]
    L = len(cent)
    codes = bytearray(len(vec))
    for i, v in enumerate(vec):
        lo, hi = 0, L - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if v <= bnd[mid]:
                hi = mid
            else:
                lo = mid + 1
        codes[i] = lo
    return codes


def unitise(vec, n, K):
    for i in range(n):
        o = i * K
        acc = 0.0
        for j in range(K):
            acc += vec[o + j] * vec[o + j]
        inv = 1.0 / math.sqrt(acc) if acc > 0 else 0.0
        for j in range(K):
            vec[o + j] *= inv
    return vec


def rank_all(vecs, n, D, i):
    q = vecs[i * D:(i + 1) * D]
    sims = [0.0] * n
    for j in range(n):
        sims[j] = sum(map(mul, q, vecs[j * D:(j + 1) * D]))
    return sorted(range(n), key=lambda j: -sims[j])


def spearman(a, b):
    m = len(a)
    d2 = 0
    for i in range(m):
        d = a[i] - b[i]
        d2 += d * d
    return 1.0 - (6.0 * d2) / (m * (m * m - 1.0))


def main():
    bitlist = [int(x) for x in sys.argv[1:]] or [4]
    vocab, raw, n = load()
    sys.stdout.write("vocab %d x %d\n" % (n, DIMS))

    SAMPLE = [i for i in range(40, 4000, 320)]
    full = {}
    for i in SAMPLE:
        order = rank_all(raw, n, DIMS, i)
        rk = [0] * n
        for pos, j in enumerate(order):
            rk[j] = pos
        full[i] = (order, rk)

    samp = [raw[i] for i in range(0, n * DIMS, 29)]
    lines = []
    for B in bitlist:
        cent = lloyd_max(samp, 1 << B)
        codes = quantise(raw, cent)
        deq = unitise(array("f", [cent[c] for c in codes]), n, DIMS)

        rhos, ov, worst = [], [], []
        for i in SAMPLE:
            order, rk = full[i]
            o2 = rank_all(deq, n, DIMS, i)
            rk2 = [0] * n
            for pos, j in enumerate(o2):
                rk2[j] = pos
            rhos.append(spearman(rk, rk2))
            ov.append(len(set(order[:100]) & set(o2[:100])))
            worst.append(max(rk2[j] for j in order[:50]))

        with open(os.path.join(SEM, "q%d.u8" % B), "wb") as f:
            f.write(bytes(codes))
        with open(os.path.join(SEM, "q%d_cb.txt" % B), "w") as f:
            f.write(" ".join("%.6f" % c for c in cent) + "\n")

        packed = n * DIMS * B // 8
        lines.append("bits=%d  packed %d  b64 %d  spearman %.5f  "
                     "top100 overlap %.1f/100  worst-rank-of-true-top50 %d"
                     % (B, packed, int(packed * 4 / 3) + 4, sum(rhos) / len(rhos),
                        sum(ov) / float(len(ov)), max(worst)))
        sys.stdout.write(lines[-1] + "\n")
        sys.stdout.flush()

    with open(os.path.join(SEM, "fidelity_quant.txt"), "w") as f:
        f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
