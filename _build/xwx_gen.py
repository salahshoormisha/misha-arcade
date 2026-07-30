#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
xwx_gen.py -- build core/data/crosswords.js: 400+ 5x5 minis and 400+ 7x7 midis.

Pipeline
  1. clue bank   = xw_clues.CLUES  +  every _build/xwx_clues_*.py  +  FLAVOUR
  2. fill pool   = ONLY answers that have a clue, scored so the fill is
                   known-but-not-crosswordese (see xwx_lib.build_pool)
  3. patterns    = _build/xwx_patterns.json (legal, fully checked, min run 3;
                   midis 180-degree symmetric)
  4. fill        = xwx_lib.Filler, seeded, with a global usage penalty so the
                   same words do not turn up in every grid
  5. clues       = rotated per answer so a repeated answer gets a different
                   clue; a clue is rejected if it contains its own answer or any
                   other answer in the same grid; personal flavour capped at
                   ~1 entry in 15
  6. par         = difficulty percentile mapped onto the target solve window
                   (mini 58-92 s, midi 135-235 s), then the pool is interleaved
                   so difficulty is even across the index
  7. validate    = xwx_validate.check_all; anything that fails is DELETED

Re-runnable and deterministic (fixed seeds).  Usage:
    python3 xwx_gen.py [--mini N] [--midi N]
"""
import glob
import json
import math
import os
import random
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "core", "data", "crosswords.js")
sys.path.insert(0, HERE)

import xwx_lib as X                     # noqa: E402
import xwx_validate as V                # noqa: E402

HEADER = """// core/data/crosswords.js -- 5x5 minis + 7x7 midis for the Midnight Arcade.
// Grids: exhaustive legal-pattern enumeration (_build/xwx_patterns.py) filled by a
// bitmask backtracker (_build/xwx_lib.py) over a frequency-ranked,
// dictionary-validated pool that contains ONLY answers with a hand-written clue.
// Sources: /usr/share/dict/words web2 + dwyl words_alpha + google-10000-english 20k
// + hermitdave OpenSubtitles en_50k + Norvig count_1w.
// Clues: hand-authored -- _build/xw_clues.py and _build/xwx_clues_*.py
// (personal seasoning in _build/xwx_clues_flavour.py, capped near 1 entry in 15).
// Every grid is machine-verified by _build/xwx_validate.py: dimensions, 180-degree
// symmetry (midis), every run >= 3, no unchecked squares, connectivity, no repeated
// answer in a grid, clue count == entry count, every clue non-empty and never
// containing an answer from its own grid.
// Assembled by _build/xwx_gen.py.  "#" = block.  Do not edit by hand.
window.AD_CROSSWORDS = """


# ---------------------------------------------------------------- the clue bank

def load_bank():
    """{ANSWER: [clue, ...]} plus the flavour overlay kept separate."""
    bank = {}

    def add(d):
        for k, v in d.items():
            if not isinstance(k, str):
                continue
            k = k.strip().upper()
            if not k.isalpha() or not (3 <= len(k) <= 7):
                continue
            cl = [v] if isinstance(v, str) else list(v)
            cl = [re.sub(r"\s+", " ", str(c)).strip() for c in cl]
            cl = [c for c in cl if c]
            if not cl:
                continue
            got = bank.setdefault(k, [])
            for c in cl:
                if c not in got:
                    got.append(c)

    import xw_clues
    add(xw_clues.CLUES)
    for path in sorted(glob.glob(os.path.join(HERE, "xwx_clues_*.py"))):
        mod = os.path.basename(path)[:-3]
        try:
            m = __import__(mod)
        except Exception as exc:            # a half-written chunk must not kill the run
            sys.stderr.write("  ! skipping %s: %s\n" % (mod, exc))
            continue
        if hasattr(m, "CLUES"):
            add(m.CLUES)

    flav = {}
    try:
        import xwx_clues_flavour as F
        for k, v in F.FLAVOUR.items():
            k = k.strip().upper()
            if k.isalpha() and 3 <= len(k) <= 7:
                cl = [v] if isinstance(v, str) else list(v)
                flav[k] = [str(c).strip() for c in cl if str(c).strip()]
    except Exception as exc:
        sys.stderr.write("  ! no flavour bank: %s\n" % exc)

    # a flavour-only word is still usable -- its clue stands on its own
    for k, v in flav.items():
        if k not in bank:
            bank[k] = list(v)
    return bank, flav


# ------------------------------------------------------------------- difficulty

def rarity_map():
    freq = X.load_freq()
    return freq


def grid_difficulty(answers, freq):
    vals = []
    for w in answers:
        r = freq.get(w.lower())
        r = 70000 if r is None else max(r, 30)
        vals.append(math.log10(r))
    vals.sort()
    # the two rarest entries drive the felt difficulty more than the mean does
    core = sum(vals) / len(vals)
    tail = sum(vals[-2:]) / 2.0
    return 0.55 * core + 0.45 * tail


# ------------------------------------------------------------------ clue picking

class ClueDesk(object):
    def __init__(self, bank, flav, seed=99, flavour_every=15):
        self.bank = bank
        self.flav = flav
        self.rot = {}
        self.frot = {}
        self.rnd = random.Random(seed)
        self.flavour_every = flavour_every
        self.entries_done = 0
        self.flavour_used = 0

    def _clean(self, clue, ans, answers):
        return not V.clue_conflict(clue, ans, answers)

    def pick(self, ans, answers):
        """A clue for ans that mentions no answer in this grid, or None."""
        want_flavour = (self.flavour_used * self.flavour_every <= self.entries_done
                        and ans in self.flav)
        pools = []
        if want_flavour:
            pools.append(("f", self.flav[ans]))
        pools.append(("m", self.bank.get(ans, [])))
        if not want_flavour and ans in self.flav:
            pools.append(("f", self.flav[ans]))
        for tag, cl in pools:
            if not cl:
                continue
            rot = self.frot if tag == "f" else self.rot
            start = rot.get(ans, 0)
            for k in range(len(cl)):
                c = cl[(start + k) % len(cl)]
                if self._clean(c, ans, answers):
                    rot[ans] = (start + k + 1) % len(cl)
                    self.entries_done += 1
                    if tag == "f":
                        self.flavour_used += 1
                    return c
        return None


# --------------------------------------------------------------------- assembly

def build_puzzles(kind, patterns, pool, bank, flav, want, seed, size,
                  par_lo, par_hi, freq, desk, idprefix, idstart, taken_grids):
    filler = X.Filler(pool, seed=seed, cap=1600)
    rnd = random.Random(seed + 7)
    order = list(patterns)
    rnd.shuffle(order)
    made = []
    seen_fill = set(taken_grids)
    pat_i = 0
    attempts = 0
    max_attempts = want * 26 + 4000
    while len(made) < want and attempts < max_attempts:
        attempts += 1
        pat = order[pat_i % len(order)]
        pat_i += 1
        sol = filler.fill(pat, tries=1, node_budget=14000)
        if not sol:
            continue
        rows = filler.rows_from(pat, sol)
        key = "".join(rows)
        if key in seen_fill:
            continue
        across, down = X.number_grid(rows)
        answers = [e["ans"] for e in across + down]
        if len(set(answers)) != len(answers):
            continue
        if min(len(a) for a in answers) < 3:
            continue
        ok = True
        for e in across + down:
            c = desk.pick(e["ans"], answers)
            if c is None:
                ok = False
                break
            e["clue"] = c
        if not ok:
            continue
        clues = [e["clue"] for e in across + down]
        if len(set(clues)) != len(clues):
            continue
        seen_fill.add(key)
        made.append({
            "size": size, "grid": rows, "across": across, "down": down,
            "_diff": grid_difficulty(answers, freq),
        })
    # difficulty -> par, spread evenly across the pool index
    made.sort(key=lambda p: p["_diff"])
    n = len(made)
    for i, p in enumerate(made):
        frac = 0.0 if n < 2 else i / float(n - 1)
        p["par"] = int(round(par_lo + frac * (par_hi - par_lo)))
    # interleave: walk the difficulty-sorted list with a stride so any window of
    # the shipped pool holds a mix of easy and hard
    stride = 7
    inter = []
    for s in range(stride):
        inter.extend(made[s::stride])
    out = []
    for i, p in enumerate(inter):
        out.append({
            "id": "%s%03d" % (idprefix, idstart + i),
            "size": p["size"],
            "grid": p["grid"],
            "across": [{"n": e["n"], "r": e["r"], "c": e["c"], "len": e["len"],
                        "ans": e["ans"], "clue": e["clue"]} for e in p["across"]],
            "down": [{"n": e["n"], "r": e["r"], "c": e["c"], "len": e["len"],
                      "ans": e["ans"], "clue": e["clue"]} for e in p["down"]],
            "par": p["par"], "theme": None, "title": None,
        })
    return out


def load_legacy():
    """The 40 minis + 6 midis that shipped before this expansion -- they are
    good puzzles with hand-written clues, so they are kept and prepended.
    Read from the frozen snapshot, never from the live file, so re-running the
    generator is idempotent instead of compounding."""
    try:
        d = json.load(open(os.path.join(HERE, "xwx_legacy.json")))
        return d.get("mini", []), d.get("midi", [])
    except Exception as exc:
        sys.stderr.write("  ! no legacy snapshot (%s)\n" % exc)
        return [], []


def emit(mini, midi):
    body = json.dumps({"mini": mini, "midi": midi},
                      separators=(",", ":"), ensure_ascii=False)
    with open(OUT, "w") as f:
        f.write(HEADER + body + ";\n")
    return len(HEADER) + len(body) + 2


def main():
    want_mini = 400
    want_midi = 400
    for i, a in enumerate(sys.argv):
        if a == "--mini":
            want_mini = int(sys.argv[i + 1])
        if a == "--midi":
            want_midi = int(sys.argv[i + 1])

    bank, flav = load_bank()
    print("clue bank: %d answers, %d clues (+%d flavour answers)" %
          (len(bank), sum(len(v) for v in bank.values()), len(flav)))
    freq = rarity_map()
    web2 = X.load_web2()
    pool = X.build_pool(list(bank), freq, web2)
    print("fill pool:", {L: len(v) for L, v in sorted(pool.items())})

    pats = json.load(open(os.path.join(HERE, "xwx_patterns.json")))
    legacy_mini, legacy_midi = load_legacy()
    print("legacy: %d mini, %d midi" % (len(legacy_mini), len(legacy_midi)))

    desk = ClueDesk(bank, flav, seed=99, flavour_every=15)
    taken = set("".join(p["grid"]) for p in legacy_mini + legacy_midi)

    new_midi = build_puzzles("midi", pats["midi"], pool, bank, flav, want_midi,
                             seed=2026, size=7, par_lo=135, par_hi=235,
                             freq=freq, desk=desk, idprefix="d", idstart=20,
                             taken_grids=taken)
    print("new midi:", len(new_midi))
    new_mini = build_puzzles("mini", pats["mini"], pool, bank, flav, want_mini,
                             seed=777, size=5, par_lo=58, par_hi=92,
                             freq=freq, desk=desk, idprefix="m", idstart=41,
                             taken_grids=taken)
    print("new mini:", len(new_mini))
    print("flavour clues placed: %d of %d entries (1 in %.1f)" %
          (desk.flavour_used, desk.entries_done,
           desk.entries_done / max(1.0, float(desk.flavour_used))))

    mini = legacy_mini + new_mini
    midi = legacy_midi + new_midi

    mini, mrep = V.filter_valid(mini, 5, require_symmetry=False)
    midi, drep = V.filter_valid(midi, 7, require_symmetry=True)
    print("validator dropped: %d mini, %d midi" % (len(mrep), len(drep)))
    for r in (mrep + drep)[:20]:
        print("   drop", r)

    size = emit(mini, midi)
    print("WROTE %s  mini=%d midi=%d  %.1f KB" %
          (OUT, len(mini), len(midi), size / 1024.0))


if __name__ == "__main__":
    main()
