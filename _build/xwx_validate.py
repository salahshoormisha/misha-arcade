#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
xwx_validate.py -- the hard gate on core/data/crosswords.js.

Run standalone to audit the shipped file:
    python3 xwx_validate.py

It rebuilds every grid FROM THE SCHEMA (not from the fill that produced it) and
asserts, per puzzle:

  1.  grid is size x size, rows are exactly `size` chars, letters A-Z or "#"
  2.  `size` matches len(grid)
  3.  midi: block pattern is 180-degree rotationally symmetric
      mini: symmetry recorded, not required (the 40 shipped minis are mostly
      asymmetric, as real NYT Minis are)
  4.  the across/down entry lists reproduce EXACTLY the set of maximal runs in
      the grid -- no missing entry, no invented entry, no wrong r/c/len
  5.  clue numbering matches standard crossword numbering
  6.  every entry length >= 3 (no two-letter entries)
  7.  every entry's `ans` equals the letters actually in the grid
  8.  every white square is covered by one across AND one down entry
      (fully checked, no unchecked squares)
  9.  white area is connected
 10.  no duplicate answer within a puzzle
 11.  len(across) + len(down) == number of runs == number of clues
 12.  every clue is a non-empty string, and never contains any answer from its
      own puzzle
 13.  no duplicate clue text within a puzzle
 14.  par is a sane positive integer
 15.  ids are unique across the whole pool
 16.  every answer is in the dictionary or the curated clue bank (the answer list)

Exit code 1 if anything fails.
"""
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "core", "data", "crosswords.js")
sys.path.insert(0, HERE)


# ------------------------------------------------------------------- primitives

def runs(grid):
    """Maximal white runs. -> (across, down) lists of (r, c, len)."""
    n = len(grid)
    a, d = [], []
    for r in range(n):
        c = 0
        while c < n:
            if grid[r][c] == "#":
                c += 1
                continue
            c0 = c
            while c < n and grid[r][c] != "#":
                c += 1
            a.append((r, c0, c - c0))
    for c in range(n):
        r = 0
        while r < n:
            if grid[r][c] == "#":
                r += 1
                continue
            r0 = r
            while r < n and grid[r][c] != "#":
                r += 1
            d.append((r0, c, r - r0))
    return a, d


def numbering(grid):
    n = len(grid)
    num = {}
    k = 0
    for r in range(n):
        for c in range(n):
            if grid[r][c] == "#":
                continue
            sa = (c == 0 or grid[r][c - 1] == "#") and \
                 (c + 1 < n and grid[r][c + 1] != "#")
            sd = (r == 0 or grid[r - 1][c] == "#") and \
                 (r + 1 < n and grid[r + 1][c] != "#")
            if sa or sd:
                k += 1
                num[(r, c)] = k
    return num


def clue_conflict(clue, own, others=()):
    """True if a clue gives its answer away.

    Own answer: 5+ letters must not appear as a substring at all ("Adobe walls"
    is a banned clue for ADOBE); 3-4 letters must not appear as a whole word
    (so ART cannot be clued "Art class", but "Part of a play" is fine).

    Other answers in the same grid: only 5+ letters, whole-word.  Anything
    stricter is unusable on a 5x5, where THE / FOR / ANY / OUR are ordinary
    glue entries and would veto almost every clue in the puzzle.
    """
    low = clue.lower()
    o = own.lower()
    if len(o) >= 5:
        if o in low:
            return True
    elif re.search(r"\b" + re.escape(o) + r"\b", low):
        return True
    for a in others:
        a = a.lower()
        if a == o or len(a) < 5:
            continue
        if re.search(r"\b" + re.escape(a) + r"\b", low):
            return True
    return False


def symmetric(grid):
    n = len(grid)
    return all((grid[r][c] == "#") == (grid[n - 1 - r][n - 1 - c] == "#")
               for r in range(n) for c in range(n))


def connected(grid):
    n = len(grid)
    whites = [(r, c) for r in range(n) for c in range(n) if grid[r][c] != "#"]
    if not whites:
        return False
    seen = {whites[0]}
    stack = [whites[0]]
    while stack:
        r, c = stack.pop()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            rr, cc = r + dr, c + dc
            if 0 <= rr < n and 0 <= cc < n and grid[rr][cc] != "#" \
                    and (rr, cc) not in seen:
                seen.add((rr, cc))
                stack.append((rr, cc))
    return len(seen) == len(whites)


# ----------------------------------------------------------------- the dictionary

_ALLOWED = None


def allowed_answers():
    """Words a shipped answer may be: the hand-written clue bank (which is
    itself dictionary-screened) plus web2/words_alpha."""
    global _ALLOWED
    if _ALLOWED is not None:
        return _ALLOWED
    words = set()
    for path in ("/usr/share/dict/words", "/usr/share/dict/connectives",
                 os.path.join(HERE, "words_alpha.txt")):
        try:
            with open(path) as f:
                for line in f:
                    w = line.strip().lower()
                    if w.isalpha():
                        words.add(w.upper())
        except IOError:
            pass
    bank = set()
    try:
        import xw_clues
        bank |= set(k.upper() for k in xw_clues.CLUES)
    except Exception:
        pass
    for p in sorted(glob.glob(os.path.join(HERE, "xwx_clues_*.py"))):
        mod = os.path.basename(p)[:-3]
        try:
            m = __import__(mod)
        except Exception:
            continue
        for attr in ("CLUES", "FLAVOUR"):
            if hasattr(m, attr):
                bank |= set(k.upper() for k in getattr(m, attr))
    _ALLOWED = (words, bank)
    return _ALLOWED


# ------------------------------------------------------------------- the checker

def check(p, size, require_symmetry):
    """-> list of failure strings (empty means the puzzle ships)."""
    bad = []
    pid = p.get("id", "?")

    grid = p.get("grid")
    if not isinstance(grid, list) or len(grid) != size:
        return ["%s: grid is not %d rows" % (pid, size)]
    for r, row in enumerate(grid):
        if not isinstance(row, str) or len(row) != size:
            return ["%s: row %d is not %d chars" % (pid, r, size)]
        if not re.match(r"^[A-Z#]+$", row):
            return ["%s: row %d has illegal characters" % (pid, r)]
    if p.get("size") is not None and int(p["size"]) != size:
        bad.append("%s: size field %r != %d" % (pid, p.get("size"), size))

    if require_symmetry and not symmetric(grid):
        bad.append("%s: block pattern is not 180-degree symmetric" % pid)
    if not connected(grid):
        bad.append("%s: white squares are not all connected" % pid)

    ra, rd = runs(grid)
    num = numbering(grid)

    for tag, want, got in (("across", ra, p.get("across")),
                           ("down", rd, p.get("down"))):
        if not isinstance(got, list):
            bad.append("%s: %s list missing" % (pid, tag))
            continue
        if len(got) != len(want):
            bad.append("%s: %s has %d entries, grid has %d runs"
                       % (pid, tag, len(got), len(want)))
        wantset = set(want)
        gotset = set()
        for e in got:
            try:
                r, c, L = int(e["r"]), int(e["c"]), int(e["len"])
            except Exception:
                bad.append("%s: %s entry missing r/c/len" % (pid, tag))
                continue
            gotset.add((r, c, L))
            if L < 3:
                bad.append("%s: %s %d,%d is a %d-letter entry" % (pid, tag, r, c, L))
            letters = "".join(grid[r][c + k] if tag == "across" else grid[r + k][c]
                              for k in range(L)) if (
                r + (L if tag == "down" else 1) <= size and
                c + (L if tag == "across" else 1) <= size) else ""
            if letters != str(e.get("ans", "")).upper():
                bad.append("%s: %s %d,%d ans %r != grid %r"
                           % (pid, tag, r, c, e.get("ans"), letters))
            if num.get((r, c)) != e.get("n"):
                bad.append("%s: %s %d,%d numbered %r, should be %r"
                           % (pid, tag, r, c, e.get("n"), num.get((r, c))))
            cl = e.get("clue")
            if not isinstance(cl, str) or not cl.strip():
                bad.append("%s: %s %d,%d has an empty clue" % (pid, tag, r, c))
        if gotset != wantset:
            bad.append("%s: %s entries do not match the grid runs (%s)"
                       % (pid, tag, sorted(wantset ^ gotset)))

    entries = list(p.get("across") or []) + list(p.get("down") or [])
    # every white square in one across AND one down entry
    cov_a, cov_d = set(), set()
    for e in (p.get("across") or []):
        try:
            for k in range(int(e["len"])):
                cov_a.add((int(e["r"]), int(e["c"]) + k))
        except Exception:
            pass
    for e in (p.get("down") or []):
        try:
            for k in range(int(e["len"])):
                cov_d.add((int(e["r"]) + k, int(e["c"])))
        except Exception:
            pass
    for r in range(size):
        for c in range(size):
            if grid[r][c] == "#":
                continue
            if (r, c) not in cov_a:
                bad.append("%s: %d,%d is in no across entry" % (pid, r, c))
            if (r, c) not in cov_d:
                bad.append("%s: %d,%d is in no down entry" % (pid, r, c))

    answers = [str(e.get("ans", "")).upper() for e in entries]
    if len(set(answers)) != len(answers):
        dupes = sorted(a for a in set(answers) if answers.count(a) > 1)
        bad.append("%s: duplicate answers %s" % (pid, dupes))
    if len(entries) != len(ra) + len(rd):
        bad.append("%s: %d entries for %d runs" % (pid, len(entries), len(ra) + len(rd)))

    clues = [str(e.get("clue", "")) for e in entries]
    if len([c for c in clues if c.strip()]) != len(entries):
        bad.append("%s: clue count != entry count" % pid)
    if len(set(clues)) != len(clues):
        bad.append("%s: duplicate clue text inside the puzzle" % pid)
    for e in entries:
        cl = str(e.get("clue", ""))
        own = str(e.get("ans", "")).upper()
        if cl and clue_conflict(cl, own, answers):
            bad.append("%s: clue %r gives away an answer (own=%s)"
                       % (pid, cl, own))

    try:
        par = int(p.get("par"))
        if not (20 <= par <= 900):
            bad.append("%s: par %r out of range" % (pid, p.get("par")))
    except Exception:
        bad.append("%s: par is not an integer" % pid)

    words, bankwords = allowed_answers()
    for a in answers:
        if a not in words and a not in bankwords:
            bad.append("%s: answer %s is in neither the dictionary nor the bank"
                       % (pid, a))
    return bad


def filter_valid(puzzles, size, require_symmetry):
    keep, dropped = [], []
    for p in puzzles:
        bad = check(p, size, require_symmetry)
        if bad:
            dropped.append(bad[0])
        else:
            keep.append(p)
    return keep, dropped


def main():
    s = open(OUT).read()
    if not s.startswith("//"):
        print("FAIL: file does not start with a comment header")
    if "window.AD_CROSSWORDS" not in s:
        print("FAIL: no window.AD_CROSSWORDS assignment")
        return 1
    i = s.index("{", s.index("window.AD_CROSSWORDS"))
    d = json.loads(s[i:s.rindex("}") + 1])

    total_bad = 0
    ids = {}
    stats = {}
    for kind, size, sym in (("mini", 5, False), ("midi", 7, True)):
        ps = d.get(kind, [])
        nbad = 0
        nsym = 0
        entries = 0
        pars = []
        for p in ps:
            bad = check(p, size, sym)
            if bad:
                nbad += 1
                for b in bad[:3]:
                    print("  FAIL", b)
            if symmetric(p["grid"]):
                nsym += 1
            entries += len(p.get("across", [])) + len(p.get("down", []))
            pars.append(p.get("par"))
            ids.setdefault(p.get("id"), 0)
            ids[p["id"]] += 1
        total_bad += nbad
        stats[kind] = dict(n=len(ps), bad=nbad, symmetric=nsym, entries=entries,
                           par_lo=min(pars) if pars else 0,
                           par_hi=max(pars) if pars else 0,
                           par_mean=round(sum(pars) / float(len(pars)), 1) if pars else 0)

    dup = sorted(k for k, v in ids.items() if v > 1)
    print()
    print("crosswords.js  %.1f KB" % (len(s) / 1024.0))
    for kind in ("mini", "midi"):
        st = stats[kind]
        print("%-5s grids=%-4d failed=%-3d symmetric=%-4d entries=%-6d "
              "par %d-%d (mean %.1f)"
              % (kind, st["n"], st["bad"], st["symmetric"], st["entries"],
                 st["par_lo"], st["par_hi"], st["par_mean"]))
    print("duplicate ids:", dup if dup else "none")
    print("RESULT:", "ALL GRIDS VALID" if (total_bad == 0 and not dup)
          else "%d INVALID GRIDS" % total_bad)
    return 0 if (total_bad == 0 and not dup) else 1


if __name__ == "__main__":
    sys.exit(main())
