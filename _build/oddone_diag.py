#!/usr/bin/env python3
# Diagnostic over whatever sem_gen_oddone.py last wrote to sem/oddone_raw.tsv.
# Prints, per board, the numbers that might separate the boards a human called
# GOOD from the ones a human called BROKEN. Throwaway tuning tool.
#
# Row format (from the generator): m0 m1 m2 m3 decoy hub w0 w1 w2 w3 gap tempt uniq hard
import os
import sys
from array import array
from collections import defaultdict
from operator import mul

HERE = os.path.dirname(os.path.abspath(__file__))
SEM = os.path.join(HERE, "sem")
DIMS = 300

vocab = open(os.path.join(SEM, "ship_vocab.txt"), encoding="utf-8").read().split()
n = len(vocab)
v = array("f")
with open(os.path.join(SEM, "ship_vecs.f32"), "rb") as f:
    v.frombytes(f.read())
V = [v[i * DIMS:(i + 1) * DIMS] for i in range(n)]


def cos(i, j):
    return sum(map(mul, V[i], V[j]))


def unit(ids):
    c = array("f", bytes(4 * DIMS))
    for i in ids:
        vi = V[i]
        for d in range(DIMS):
            c[d] += vi[d]
    s = (sum(map(mul, c, c)) ** 0.5) or 1.0
    for d in range(DIMS):
        c[d] /= s
    return c


def dot(c, j):
    return sum(map(mul, c, V[j]))


resp_of = defaultdict(dict)
with open(os.path.join(SEM, "assoc.tsv"), encoding="utf-8") as f:
    for line in f:
        a, b, c = (int(x) for x in line.split())
        resp_of[a][b] = c
tot = {a: float(sum(d.values())) or 1.0 for a, d in resp_of.items()}

BAD = set(sys.argv[1:])          # words naming a board a human judged broken

print("%-11s %-4s | pMin  | friend | rank pHub  | minhub | %s" % ("hub", "ok", "board"))
print("-" * 96)
for line in open(os.path.join(SEM, "oddone_raw.tsv"), encoding="utf-8"):
    f = line.split()
    ids = [int(x) for x in f[:4]]
    d, h = int(f[4]), int(f[5])
    ps = {}
    for a in range(4):
        for b in range(4):
            if a != b:
                ps[(a, b)] = cos(ids[a], ids[b])
    pmin = min(ps.values())
    # Is the impostor somebody's best friend on the board? If it is closer to a
    # member than that member's own fellows are, that member is arguable too.
    friend = max(cos(d, ids[a]) - min(ps[(a, b)] for b in range(4) if b != a)
                 for a in range(4))
    ranks, phub = [], []
    for i in ids:
        order = sorted(resp_of.get(i, {}).items(), key=lambda kv: -kv[1])
        ranks.append(next((k for k, (rr, _) in enumerate(order) if rr == h), 99))
        phub.append(resp_of[i].get(h, 0) / tot.get(i, 1.0))
    tag = "bad" if vocab[h] in BAD else "GOOD"
    print("%-11s %-4s | %.3f | %+.3f | %2d  %.3f | %.3f  | %s + %s" % (
        vocab[h], tag, pmin, friend, max(ranks), min(phub),
        min(cos(i, h) for i in ids),
        "/".join(vocab[i] for i in ids), vocab[d].upper()))
