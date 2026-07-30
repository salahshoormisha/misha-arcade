#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
xwx_cands.py -- pick the words that still need a hand-written clue.

Emits _build/xwx_need/<len>_<batch>.txt, each a plain list of UPPERCASE words,
frequency-ordered, dictionary-validated, not already in the clue bank, with the
crosswordese and the ugly inflections filtered out.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import xwx_lib as X          # noqa: E402
import xw_clues              # noqa: E402

HAVE = set(xw_clues.CLUES)
try:
    import xwx_clues_extra
    HAVE |= set(xwx_clues_extra.CLUES)
except Exception:
    pass

BAD_SUBSTR = ("fuck", "shit", "cunt", "nigg", "rape", "whore", "slut", "spic",
              "kike", "wetback", "retard", "faggot", "nazi", "chink")

# inflection endings that make dull fill; keep a few but mostly drop
def dullness(w):
    d = 0
    if w.endswith("s") and not w.endswith("ss") and not w.endswith("us"):
        d += 1
    if w.endswith("ed"):
        d += 1
    if w.endswith("ing"):
        d += 1
    if w.endswith("ly"):
        d += 1
    if w.endswith("er") or w.endswith("est"):
        d += 1
    return d


def main():
    freq = X.load_freq()
    web2 = X.load_web2()
    out = {}
    for L in (3, 4, 5, 6, 7):
        rows = []
        for w, r in freq.items():
            if len(w) != L or not w.isalpha() or not w.islower():
                continue
            if r > 26000:
                continue
            if w not in web2:
                continue
            if w.upper() in HAVE:
                continue
            if w in X.HARD_BAN or w in X.CROSSWORDESE:
                continue
            if any(b in w for b in BAD_SUBSTR):
                continue
            rows.append((r + 4000 * dullness(w), w))
        rows.sort()
        out[L] = [w.upper() for _, w in rows]
    d = os.path.join(HERE, "xwx_need")
    if not os.path.isdir(d):
        os.makedirs(d)
    for L, ws in out.items():
        print("len", L, "candidates", len(ws))
        n = 0
        for i in range(0, len(ws), 200):
            chunk = ws[i:i + 200]
            with open(os.path.join(d, "%d_%02d.txt" % (L, n)), "w") as f:
                f.write("\n".join(chunk) + "\n")
            n += 1


if __name__ == "__main__":
    main()
