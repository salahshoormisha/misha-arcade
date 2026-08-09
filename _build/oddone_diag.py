#!/usr/bin/env python3
# Diagnostic: for the boards currently shipped in core/data/oddone.js, print the
# numbers that might separate the boards a human called GOOD from the ones a
# human called BROKEN. Throwaway analysis tool for tuning sem_gen_oddone.py.
#
# Every broken board in the last pass broke the same way: one of the FOUR was
# itself arguable (AMOUNT among deposit/credit/paycheck, DRIVEWAY among
# jeep/limo/van, BEAK among lip/jaw/chin). So the features here are all about
# how evenly the four hold together, in both currencies.
import json
import os
import re
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


cue_of = defaultdict(dict)
resp_of = defaultdict(dict)
with open(os.path.join(SEM, "assoc.tsv"), encoding="utf-8") as f:
    for line in f:
        a, b, c = (int(x) for x in line.split())
        cue_of[b][a] = c
        resp_of[a][b] = c
tot = {a: float(sum(d.values())) or 1.0 for a, d in resp_of.items()}
hubset = {w: frozenset(d.keys()) for w, d in resp_of.items()}
EMPTY = frozenset()

src = open(os.path.join(ROOT, "core", "data", "oddone.js"), encoding="utf-8").read()
rows = [json.loads(m) for m in re.findall(r'\{"d":.*?\}', src)]

# Hand verdicts from playing all 24. 1 = one defensible answer; 0 = a second
# word on the board can be argued for, which is the only failure that matters.
VERDICT = {
    "bird": 1, "cash": 0, "bus": 0, "mouth": 0, "car": 0, "noise": 0, "bug": 1,
    "accident": 0, "news": 0, "fruit": 1, "sweet": 0,
    "breakfast": 1, "sport": 1, "hat": 0, "church": 0, "fix": 1, "change": 1,
    "gas": 0, "drink": 0, "student": 0, "pie": 0, "lots": 0,
}
SOUP = {"tomato": 0, "stew": 1}     # two boards share the SOUP hub

print("%-10s %-4s | pMin  pMean | kin | pHub  rank | fit4  outGap | win" % ("hub", "ok"))
print("-" * 74)
out = []
for r in rows:
    hub, words = r["n"][0], r["w"]
    mem, dec = words[:4], words[4]
    h, d = idx[hub], idx[dec]
    ids = [idx[w] for w in mem]

    ps = [cos(ids[a], ids[b]) for a in range(4) for b in range(a + 1, 4)]
    kin = sum(1 for a in range(4) for b in range(a + 1, 4)
              if bool((hubset.get(ids[a], EMPTY) & hubset.get(ids[b], EMPTY)) - {h})
              or ids[b] in hubset.get(ids[a], EMPTY) or ids[a] in hubset.get(ids[b], EMPTY))
    phub, ranks = [], []
    for i in ids:
        phub.append(resp_of[i].get(h, 0) / tot.get(i, 1.0))
        order = sorted(resp_of.get(i, {}).items(), key=lambda kv: -kv[1])
        ranks.append(next((k for k, (rr, _) in enumerate(order) if rr == h), 99))

    # leave-one-out fit WITHIN THE FOUR: does any member already stick out?
    f4 = [dot(unit([x for x in ids if x != i]), i) for i in ids]
    # ...and within the five, which is what the player sees
    f5 = [dot(unit([x for x in ids + [d] if x != i]), i) for i in ids]
    fd = dot(unit(ids), d)

    minhub = min(cos(i, h) for i in ids)
    five = set(ids) | {d, h}
    best = (-2.0, -1)
    for t in range(min(6000, n)):
        # a plural or a near-synonym of the hub is the SAME name, not a rival
        if t in five or cos(t, h) > 0.55 or vocab[t][:5] == vocab[h][:5]:
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

    tag = SOUP.get(mem[0], VERDICT.get(hub))
    out.append((tag, min(ps)))
    print("%-10s %-4s | %.3f %.3f |  %d  | %.3f %2d | %.3f %+.3f | %+.3f %s" % (
        hub, "GOOD" if tag == 1 else "bad", min(ps), sum(ps) / len(ps), kin,
        min(phub), max(ranks), max(f4) - min(f4), min(f5) - fd,
        minhub - best[0], vocab[best[1]]))
