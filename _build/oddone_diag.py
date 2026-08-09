#!/usr/bin/env python3
# Diagnostic: for the boards currently shipped in core/data/oddone.js, print the
# numbers that might separate the boards a human called GOOD from the ones a
# human called BROKEN. Throwaway analysis tool for tuning sem_gen_oddone.py.
import json
import os
import re
import sys
from array import array
from collections import defaultdict
from operator import mul

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SEM = os.path.join(HERE, "sem")
DIMS = 300

vocab = open(os.path.join(SEM, "ship_vocab.txt"), encoding="utf-8").read().split()
n = len(vocab)
idx = {w: i for i, w in enumerate(vocab)}
v = array("f")
with open(os.path.join(SEM, "ship_vecs.f32"), "rb") as f:
    v.frombytes(f.read())
V = [v[i * DIMS:(i + 1) * DIMS] for i in range(n)]


def cos(i, j):
    return sum(map(mul, V[i], V[j]))


cue_of = defaultdict(dict)
resp_of = defaultdict(dict)
with open(os.path.join(SEM, "assoc.tsv"), encoding="utf-8") as f:
    for line in f:
        a, b, c = (int(x) for x in line.split())
        cue_of[b][a] = c
        resp_of[a][b] = c

# the shipped boards
src = open(os.path.join(ROOT, "core", "data", "oddone.js"), encoding="utf-8").read()
rows = [json.loads(m) for m in re.findall(r'\{"d":.*?\}', src)]

# Hand verdicts from playing them (1 = clean, 0 = a second answer is arguable)
VERDICT = {
    "bird": 1, "cash": 0, "bus": 0, "mouth": 0, "car": 0, "noise": 0, "bug": 1,
    "soup": None, "accident": 0, "news": 0, "fruit": 1, "sweet": 0,
    "breakfast": 1, "sport": 1, "hat": 0, "church": 0, "fix": 1, "change": 1,
    "gas": 0, "drink": 0, "student": 0, "pie": 0, "lots": 0,
}

NAMESCAN = 6000
print("%-10s %-4s | pairMin pairMean | cueMin rank | hubMin  bestOther (%s) win" %
      ("hub", "ok", "name"))
for r in rows:
    hub = r["n"][0]
    words = r["w"]
    mem = words[:4]
    dec = words[4]
    h = idx[hub]
    ids = [idx[w] for w in mem]
    d = idx[dec]

    ps = [cos(ids[a], ids[b]) for a in range(4) for b in range(a + 1, 4)]
    cues = []
    ranks = []
    for i in ids:
        cues.append(cue_of[h].get(i, 0))
        order = sorted(resp_of.get(i, {}).items(), key=lambda kv: -kv[1])
        rk = next((k for k, (rr, _) in enumerate(order) if rr == h), 99)
        ranks.append(rk)

    minhub = min(cos(i, h) for i in ids)
    five = set(ids) | {d, h}
    best = (-2.0, -1)
    for t in range(min(NAMESCAN, n)):
        if t in five:
            continue
        m = 2.0
        for i in ids:
            x = cos(i, t)
            if x < m:
                m = x
                if m <= best[0]:
                    break
        if m > best[0]:
            best = (m, t)
    tag = VERDICT.get(hub)
    print("%-10s %-4s | %6.3f %7.3f | %5d %5d | %6.3f  %6.3f (%s) %+.3f" % (
        hub, "GOOD" if tag == 1 else ("?" if tag is None else "bad"),
        min(ps), sum(ps) / len(ps), min(cues), max(ranks),
        minhub, best[0], vocab[best[1]], minhub - best[0]))
