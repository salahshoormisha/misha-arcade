#!/usr/bin/env python3
# =============================================================================
# SEMANTIC WING · STEP 5 — the LINK graph LINXICON is judged against.
#
# A link between two words counts as "meaningful" if EITHER
#   (a) a human in the Small World of Words norms answered one with the other
#       (association edge, count >= 2), or
#   (b) their Numberbatch cosine is at or above TAU.
# TAU is calibrated here, not guessed: it is the cosine at which an average word
# has about NEIGHBOURS partners, so every word has a comparable number of legal
# moves. Both tests ship, so the runtime check is exactly this rule.
#
# For PUZZLE GENERATION we need the graph in memory to run BFS. Building the
# cosine half over the whole 11.6k vocabulary is 16 minutes of pure Python, so
# generation uses a CORE of the CORE commonest words (2 minutes) — puzzle
# endpoints and their expected stepping stones should be common words anyway.
# At runtime the cosine test applies to the full vocabulary, which can only make
# a player's path shorter than the one we quote. Hence "shortest KNOWN path".
#
# Output: sem/tau.txt, sem/core_edges.bin  (u16 pairs, undirected, i<j)
# =============================================================================
import os, struct, sys
from array import array
from operator import mul

HERE = os.path.dirname(os.path.abspath(__file__))
SEM = os.path.join(HERE, "sem")
DIMS = 300
CORE = 4200
NEIGHBOURS = 50


def main():
    vocab = open(os.path.join(SEM, "ship_vocab.txt"), encoding="utf-8").read().split()
    v = array("f")
    with open(os.path.join(SEM, "ship_vecs.f32"), "rb") as f:
        v.frombytes(f.read())
    n = len(vocab)
    sys.stdout.write("vocab %d\n" % n)

    # ---- calibrate TAU ---------------------------------------------------
    taus = []
    for i in range(30, 4000, 97):
        q = v[i * DIMS:(i + 1) * DIMS]
        sims = sorted((sum(map(mul, q, v[j * DIMS:(j + 1) * DIMS])) for j in range(n)),
                      reverse=True)
        taus.append(sims[NEIGHBOURS])
    tau = sum(taus) / len(taus)
    with open(os.path.join(SEM, "tau.txt"), "w") as f:
        f.write("%.6f\n" % tau)
    sys.stdout.write("TAU = %.4f (mean cosine of the %dth neighbour over %d probes)\n"
                     % (tau, NEIGHBOURS, len(taus)))
    sys.stdout.flush()

    # ---- core cosine edges ----------------------------------------------
    m = min(CORE, n)
    edges = array("H")
    for i in range(m):
        q = v[i * DIMS:(i + 1) * DIMS]
        for j in range(i + 1, m):
            if sum(map(mul, q, v[j * DIMS:(j + 1) * DIMS])) >= tau:
                edges.append(i)
                edges.append(j)
        if i % 500 == 499:
            sys.stdout.write("  %d/%d rows, %d edges\n" % (i + 1, m, len(edges) // 2))
            sys.stdout.flush()
    with open(os.path.join(SEM, "core_edges.bin"), "wb") as f:
        f.write(edges.tobytes())
    sys.stdout.write("core cosine edges: %d over %d nodes\n" % (len(edges) // 2, m))


if __name__ == "__main__":
    main()
