#!/usr/bin/env python3
# =============================================================================
# SEMANTIC WING · STEP 2b — real PCA, then 4-bit quantisation.
#
# Step 2 (sem_reduce.py) tried the cheap thing: keep the highest-variance of
# Numberbatch's 300 dimensions. Measured Spearman against the full-300 ranking
# was only 0.80 at K=128 and a word that should sit at rank 40 could show up at
# rank 949 — a visibly broken Contexto. Numberbatch's variance is spread almost
# evenly across its axes, so no subset of axes is a good summary. A ROTATION is
# required, i.e. actual PCA.
#
# The expensive-looking part isn't: the second-moment matrix is only 300x300.
#   M = X^T X            (UNCENTERED on purpose: centering would change the
#                         inner product, and it's the inner product we're
#                         trying to preserve. Truncated SVD of the uncentered
#                         matrix is exactly the rank-K minimiser of dot-product
#                         error.)
#   top-K eigenvectors   by block power iteration (orthogonal iteration) with
#                        Gram-Schmidt reorthonormalisation.
#   y = V_K^T x          then renormalise to unit, then quantise to 4 bits with
#                        a Lloyd-Max codebook.
#
# Everything is a C-level map/mul over an array('f') slice, which is what makes
# pure Python fast enough here.
#
# Input : sem/vecs.f32, sem/vocab.txt
# Output: sem/pca_basis.f32     (KMAX x 300 float32, eigenvectors, rows)
#         sem/pca_proj.f32      (n x KMAX float32, projected + unit-normalised)
#         sem/pca_K<k>.i8       one byte (0..15) per kept dim per word
#         sem/pca_cb_K<k>.txt   16 reconstruction levels
#         sem/fidelity_pca.txt  measured rank agreement vs the full 300 dims
# =============================================================================
import math, os, sys
from array import array
from operator import mul

HERE = os.path.dirname(os.path.abspath(__file__))
SEM = os.path.join(HERE, "sem")
DIMS = 300
KMAX = 192
ITERS = 60
LEVELS = 16


def load():
    vocab = open(os.path.join(SEM, "vocab.txt"), encoding="utf-8").read().split()
    raw = array("f")
    with open(os.path.join(SEM, "vecs.f32"), "rb") as f:
        raw.frombytes(f.read())
    n = len(raw) // DIMS
    assert n == len(vocab)
    return vocab, raw, n


def second_moment(raw, n):
    """M[a][b] = sum_i x_i[a] x_i[b].  Built from transposed columns so each
    entry is one C-level map/mul over n floats."""
    cols = []
    for d in range(DIMS):
        cols.append(array("f", [raw[i * DIMS + d] for i in range(n)]))
    M = [[0.0] * DIMS for _ in range(DIMS)]
    for a in range(DIMS):
        ca = cols[a]
        Ma = M[a]
        for b in range(a, DIMS):
            v = sum(map(mul, ca, cols[b]))
            Ma[b] = v
            M[b][a] = v
    return M, cols


def matmul_block(M, Q):
    """M (300x300) times Q (300xK) -> 300xK, column-major Q as list of arrays."""
    out = []
    Mrows = M
    for q in Q:
        col = array("f", bytes(4 * DIMS))
        for a in range(DIMS):
            col[a] = sum(map(mul, Mrows[a], q))
        out.append(col)
    return out


def gram_schmidt(Q):
    out = []
    for q in Q:
        v = array("f", q)
        for u in out:
            d = sum(map(mul, v, u))
            if d:
                for i in range(DIMS):
                    v[i] -= d * u[i]
        nrm = math.sqrt(sum(map(mul, v, v)))
        if nrm < 1e-9:
            continue
        inv = 1.0 / nrm
        for i in range(DIMS):
            v[i] *= inv
        out.append(v)
    return out


def eigen_block(M, K, iters):
    # deterministic seeded init (mulberry-ish LCG), no Math.random equivalent
    st = 12345
    Q = []
    for k in range(K):
        v = array("f", bytes(4 * DIMS))
        for i in range(DIMS):
            st = (1103515245 * st + 12345) & 0x7FFFFFFF
            v[i] = (st / 1073741824.0) - 1.0
        Q.append(v)
    Q = gram_schmidt(Q)
    for it in range(iters):
        Q = gram_schmidt(matmul_block(M, Q))
        if it % 10 == 9:
            sys.stdout.write("  power iteration %d/%d\n" % (it + 1, iters))
            sys.stdout.flush()
    # order by Rayleigh quotient
    lam = []
    MQ = matmul_block(M, Q)
    for k in range(len(Q)):
        lam.append(sum(map(mul, Q[k], MQ[k])))
    order = sorted(range(len(Q)), key=lambda k: -lam[k])
    return [Q[k] for k in order], [lam[k] for k in order]


def project(raw, n, basis):
    K = len(basis)
    out = array("f", bytes(4 * n * K))
    for i in range(n):
        v = raw[i * DIMS:(i + 1) * DIMS]
        o = i * K
        for k in range(K):
            out[o + k] = sum(map(mul, v, basis[k]))
    return out


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


def slice_K(proj, n, kmax, K):
    out = array("f", bytes(4 * n * K))
    for i in range(n):
        s = i * kmax
        o = i * K
        for j in range(K):
            out[o + j] = proj[s + j]
    return unitise(out, n, K)


def lloyd_max(sample, levels=LEVELS, iters=60):
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
        if moved < 1e-8:
            break
    return cent


def quantise(vec, cent):
    bnd = [(cent[k] + cent[k + 1]) / 2.0 for k in range(len(cent) - 1)]
    codes = bytearray(len(vec))
    for i, v in enumerate(vec):
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
    out = array("f", [cent[c] for c in codes])
    return unitise(out, n, K)


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
    Ks = [int(x) for x in sys.argv[1:]] or [128]
    vocab, raw, n = load()
    sys.stdout.write("vocab %d x %d\n" % (n, DIMS))

    bp = os.path.join(SEM, "pca_proj.f32")
    if os.path.exists(bp) and os.path.getsize(bp) == 4 * n * KMAX:
        proj = array("f")
        with open(bp, "rb") as f:
            proj.frombytes(f.read())
        sys.stdout.write("reusing cached projection\n")
    else:
        sys.stdout.write("building 300x300 second-moment matrix...\n")
        M, cols = second_moment(raw, n)
        del cols
        sys.stdout.write("block power iteration for %d components...\n" % KMAX)
        basis, lam = eigen_block(M, KMAX, ITERS)
        tot = sum(M[d][d] for d in range(DIMS))
        sys.stdout.write("energy in top %d components: %.4f\n" % (KMAX, sum(lam) / tot))
        with open(os.path.join(SEM, "pca_basis.f32"), "wb") as f:
            for b in basis:
                f.write(b.tobytes())
        with open(os.path.join(SEM, "pca_eigs.txt"), "w") as f:
            f.write(" ".join("%.8f" % (l / tot) for l in lam) + "\n")
        sys.stdout.write("projecting %d words...\n" % n)
        proj = project(raw, n, basis)
        with open(bp, "wb") as f:
            f.write(proj.tobytes())

    SAMPLE = [i for i in range(40, 4000, 320)]
    full = {}
    for i in SAMPLE:
        order = rank_all(raw, n, DIMS, i)
        rk = [0] * n
        for pos, j in enumerate(order):
            rk[j] = pos
        full[i] = (order, rk)
    sys.stdout.write("reference rankings for %d sample words\n" % len(SAMPLE))

    lines = []
    for K in Ks:
        vec = slice_K(proj, n, KMAX, K)
        samp = [vec[i] for i in range(0, n * K, 37)]
        cent = lloyd_max(samp)
        codes = quantise(vec, cent)
        deq = dequant(codes, n, K, cent)

        rhos, ov, worst = [], [], []
        for i in SAMPLE:
            order, rk = full[i]
            o2 = rank_all(deq, n, K, i)
            rk2 = [0] * n
            for pos, j in enumerate(o2):
                rk2[j] = pos
            rhos.append(spearman(rk, rk2))
            ov.append(len(set(order[:100]) & set(o2[:100])))
            worst.append(max(rk2[j] for j in order[:50]))

        with open(os.path.join(SEM, "pca_K%d.i8" % K), "wb") as f:
            f.write(bytes(codes))
        with open(os.path.join(SEM, "pca_cb_K%d.txt" % K), "w") as f:
            f.write(" ".join("%.6f" % c for c in cent) + "\n")

        nib = n * K // 2
        lines.append("K=%3d  bytes(4bit) %d  b64 %d  spearman %.5f  "
                     "top100 overlap %.1f/100  worst-rank-of-true-top50 %d"
                     % (K, nib, int(nib * 4 / 3) + 4, sum(rhos) / len(rhos),
                        sum(ov) / float(len(ov)), max(worst)))
        sys.stdout.write(lines[-1] + "\n")
        sys.stdout.flush()

    with open(os.path.join(SEM, "fidelity_pca.txt"), "w") as f:
        f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
