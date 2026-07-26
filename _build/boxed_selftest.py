#!/usr/bin/env python3
"""_build/boxed_selftest.py — independent cross-check of the BOXED IN generator.

games/boxed/game.js builds each day's square AT RUNTIME (there is no generated
data file to commit): it finds a two-word solution first, then derives the square
by 4-colouring that pair's letter-adjacency graph, three letters per side.

This script re-implements the same algorithm in Python — including A.rng
(FNV-1a + mulberry32) and A.shuffle bit-for-bit — so the boards it prints must
match the browser exactly.  Run it after touching the generator.

    python3 _build/boxed_selftest.py 60

Cross-checked 2026-07-26 against window.__BX.probe(59) in Chrome; both agree on
every day.  Expected for days 0..59:
    par split       4 x18   5 x26   6 x16
    playable words  min 230   median 461   max 843
    day 0  CHECKOUT+TRANSPORT par 6      day 41  SALE+EDINBURGH par 6
    day 5  NUMEROUS+SPECIALS  par 4      day 59  BUILDINGS+SUPERIOR par 6
(game.js caps its two-word-solution count at 40 for speed; this script counts
them all, so s2 can read higher there.  The par formula clamps at 30 either way.)
"""
import re, sys
from collections import defaultdict, Counter

SRC = "/Users/mishasalahshoor/cbai-ops/misha-arcade/core/data/words.js"
M32 = 0xFFFFFFFF
def fnv1a(s):
    h = 0x811c9dc5
    for ch in s:
        h ^= ord(ch); h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) & M32
    return h
def imul(a, b): return (a * b) & M32
def rng(seed):
    a = [fnv1a(seed)]
    def r():
        a[0] = (a[0] + 0x6D2B79F5) & M32
        t = a[0]
        t = imul(t ^ (t >> 15), t | 1)
        t = (t ^ ((t + imul(t ^ (t >> 7), t | 61)) & M32)) & M32
        return ((t ^ (t >> 14)) & M32) / 4294967296
    return r
def shuffle(r, arr):
    a = list(arr)
    for i in range(len(a) - 1, 0, -1):
        j = int(r() * (i + 1)); a[i], a[j] = a[j], a[i]
    return a

words = [w.upper() for w in re.search(r'"boxed":\s*"([^"]*)"', open(SRC).read()).group(1).split(" ")]
def mask(w):
    m = 0
    for c in w: m |= 1 << (ord(c) - 65)
    return m
MASK = [mask(w) for w in words]
POP = [bin(m).count("1") for m in MASK]
BLOCK = set("MISC BREAST BREASTS NAKED LINGERIE SEXY NUDE PORN EROTIC VIAGRA".split())
VOW = set("AEIOUY")

nice = [i for i in range(min(3200, len(words)))
        if 4 <= len(words[i]) <= 9 and 4 <= POP[i] <= 9 and words[i] not in BLOCK]
byFirst = defaultdict(list)
for i in nice: byFirst[words[i][0]].append(i)

def edges_of(w):
    return {(min(w[i], w[i+1]), max(w[i], w[i+1])) for i in range(len(w) - 1)}

def colour(letters, edges, r):
    letters = shuffle(r, letters)
    adj = defaultdict(set)
    for a, b in edges: adj[a].add(b); adj[b].add(a)
    letters.sort(key=lambda L: -len(adj[L]))
    side, cap = {}, [3, 3, 3, 3]
    def dfs(k):
        if k == len(letters): return True
        L = letters[k]
        for s in range(4):
            if cap[s] == 0: continue
            if any(side.get(n) == s for n in adj[L]): continue
            side[L] = s; cap[s] -= 1
            if dfs(k + 1): return True
            del side[L]; cap[s] += 1
        return False
    if not dfs(0): return None
    out = [[], [], [], []]
    for L, s in side.items(): out[s].append(L)
    return out

def profile(sides):
    sideOf, bmask = {}, 0
    for si, s in enumerate(sides):
        for L in s: sideOf[L] = si; bmask |= 1 << (ord(L) - 65)
    pl = []
    for k, w in enumerate(words):
        if MASK[k] & ~bmask: continue
        ok = True
        for i in range(len(w) - 1):
            if sideOf[w[i]] == sideOf[w[i+1]]: ok = False; break
        if ok: pl.append(w)
    bf = defaultdict(list)
    for w in pl: bf[w[0]].append(w)
    n2 = 0
    for w in pl:
        mw = mask(w)
        for x in bf[w[-1]]:
            if bin(mw | mask(x)).count("1") == 12: n2 += 1
    return len(pl), n2

def score(pl, n2, sides, a, b):
    if pl < 220 or n2 < 3: return -1
    band = 1 - abs(pl - 430) / 430.0          # peak at ~430 playable words
    q = band * 0.7 + min(n2, 24) / 24.0 * 0.3
    if len(set(a)) > 8: q -= 0.07
    if len(set(b)) > 8: q -= 0.07
    if max(sum(1 for L in s if L in VOW) for s in sides) >= 3: q -= 0.25
    return q

def build(day, K=6, TRIES=1200):
    r = rng("boxed:%d" % day)
    cands, tried = [], 0
    for i in shuffle(r, nice):
        tried += 1
        if tried > TRIES or len(cands) >= K: break
        A = words[i]
        opts = [j for j in byFirst[A[-1]] if j != i and bin(MASK[i] | MASK[j]).count("1") == 12]
        if not opts: continue
        for j in shuffle(r, opts)[:3]:
            u = MASK[i] | MASK[j]
            letters = [chr(65 + k) for k in range(26) if u >> k & 1]
            sides = colour(letters, edges_of(A) | edges_of(words[j]), r)
            if sides:
                cands.append((A, words[j], sides)); break
    best, rows = None, []
    for c in cands:
        pl, n2 = profile(c[2])
        q = score(pl, n2, c[2], c[0], c[1])
        rows.append((q, pl, n2, c))
    rows.sort(key=lambda x: -x[0])
    return rows, tried

def par_of(pl, n2):
    S = pl + 10 * min(n2, 30)
    return 4 if S >= 720 else (5 if S >= 480 else 6)

allw = Counter(); pars = Counter(); pls = []
N = int(sys.argv[1]) if len(sys.argv) > 1 else 60
for day in range(N):
    rows, tried = build(day)
    if rows[0][0] < 0:
        print("day %2d  NO GOOD BOARD (fallback %s+%s pl=%d s2=%d)" % (day, rows[0][3][0], rows[0][3][1], rows[0][1], rows[0][2]))
    q, pl, n2, c = rows[0]
    p = par_of(pl, n2)
    pars[p] += 1; pls.append(pl); allw[c[0]] += 1; allw[c[1]] += 1
    print("day %2d  %-11s + %-11s pl=%4d s2=%3d par=%d q=%.2f (tried %2d, cands %d)  %s" %
          (day, c[0], c[1], pl, n2, p, q, tried, len(rows),
           " ".join("".join(sorted(s)) for s in c[2])))
print(pars, "pl med", sorted(pls)[len(pls)//2], "range", min(pls), max(pls))
print("most reused solution words:", allw.most_common(6))
