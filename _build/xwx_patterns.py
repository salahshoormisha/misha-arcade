#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""xwx_patterns.py -- enumerate every legal block pattern, then keep the ones a
curated lexicon can actually fill.

Method: a pattern is legal iff every row AND every column has all its white runs
>= 3 (that is what makes the grid fully checked with no two-letter entries), the
white area is connected, and -- for the midis -- the block set is 180-degree
rotationally symmetric.  So enumerate the legal ROW masks once (there are only a
few dozen), then assemble grids from them.  Symmetry means row r is the reverse
of row n-1-r, so only the top half is free and the middle row must be a
palindrome mask.

5x5 (mini): symmetric AND asymmetric kept -- the 40 existing minis are mostly
            asymmetric, as real NYT Minis are.
7x7 (midi): symmetric only, as the CONTRACT requires and all six existing
            midis are.

Written to _build/xwx_patterns.json.
"""
import json
import os
import sys
from itertools import product

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import xwx_lib as X  # noqa: E402


def legal_row_masks(n, minlen=3):
    """Every subset of blocked columns whose white runs are all >= minlen."""
    out = []
    for m in range(1 << n):
        row = ["#" if (m >> i) & 1 else "." for i in range(n)]
        ok = True
        i = 0
        while i < n:
            if row[i] == "#":
                i += 1
                continue
            j = i
            while j < n and row[j] != "#":
                j += 1
            if j - i < minlen:
                ok = False
                break
            i = j
        if ok:
            out.append("".join(row))
    return out


def rev(s):
    return s[::-1]


def assemble(n, symmetric, minlen=3, blocks_range=(0, 99)):
    masks = legal_row_masks(n, minlen)
    half = n // 2
    out = []
    seen = set()
    if symmetric:
        mid = [m for m in masks if m == rev(m)] if n % 2 else [None]
        for top in product(masks, repeat=half):
            base = list(top)
            for mrow in mid:
                rows = base + ([mrow] if n % 2 else []) + \
                    [rev(x) for x in reversed(base)]
                nb = sum(r.count("#") for r in rows)
                if not (blocks_range[0] <= nb <= blocks_range[1]):
                    continue
                key = tuple(rows)
                if key in seen:
                    continue
                seen.add(key)
                if X.pattern_ok(rows, minlen, 0.42) and X.is_symmetric(rows):
                    out.append(rows)
    else:
        for rows in product(masks, repeat=n):
            rows = list(rows)
            nb = sum(r.count("#") for r in rows)
            if not (blocks_range[0] <= nb <= blocks_range[1]):
                continue
            key = tuple(rows)
            if key in seen:
                continue
            seen.add(key)
            if X.pattern_ok(rows, minlen, 0.42):
                out.append(rows)
    return out


def profile(pat):
    a, d = X.pattern_slots(pat)
    lens = sorted((L for _, _, L in a + d), reverse=True)
    return lens


def main():
    mini = assemble(5, symmetric=False, minlen=3, blocks_range=(0, 8))
    print("mini legal patterns:", len(mini))

    midi_all = assemble(7, symmetric=True, minlen=3, blocks_range=(6, 20))
    print("midi legal symmetric patterns:", len(midi_all))

    # Keep midis a curated lexicon can fill without junk: cap the long entries.
    midi = []
    for p in midi_all:
        lens = profile(p)
        if len(lens) < 12 or len(lens) > 22:
            continue
        if sum(1 for L in lens if L == 7) > 3:
            continue
        if sum(1 for L in lens if L >= 6) > 7:
            continue
        midi.append(p)
    print("midi patterns kept:", len(midi))

    with open(os.path.join(HERE, "xwx_patterns.json"), "w") as f:
        json.dump({"mini": mini, "midi": midi}, f)


if __name__ == "__main__":
    main()
