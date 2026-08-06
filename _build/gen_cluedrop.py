#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_cluedrop.py — builds core/data/cluedrop.js (window.AD_CLUEDROP).

The shipped file had no generator: the first 98 countries were hand-written
straight into the JS. That snapshot now lives in `_build/cluedrop_base.json`
(dumped verbatim from the shipped file), and this script merges it with the
authored expansion batches:

    _build/cluedrop_base.json    version, left, scripts, scriptBy, langs, money,
                                 and the original 98 `notes` entries
    _build/cluedrop_x*.json      {ISO2: [[TAG, sentence], ...]} — the expansion

Everything CLUEDROP says about a country apart from `notes` is DERIVED at
runtime from core/data/countries.js, so it cannot drift; `notes` is rung 6, the
hand-written one, and a country needs >= 2 of them to enter the daily pool.

VALIDATION (fatal — nothing is written if it fails), reusing
_build/check_cluedrop_notes.py verbatim: every ISO2 exists in countries.js, 2-3
notes each, tag uppercase and <= 12 chars, sentence <= 130 chars ending in a
full stop, no sentence naming its own country / capital / demonym / alt name,
and no duplicate sentence anywhere in the file.

    python3 _build/gen_cluedrop.py             # build + report
    python3 _build/gen_cluedrop.py --report    # validate only, write nothing

The output layout is load-bearing: _build/check_cluedrop_notes.py parses the
shipped file with a regex that expects `    XX: [` / `      ["TAG", "text"],` /
`    ],`. Do not reflow it. Stdlib only.
"""

import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "core", "data", "cluedrop.js")
BASE = os.path.join(HERE, "cluedrop_base.json")
sys.path.insert(0, HERE)

import check_cluedrop_notes as CN   # noqa: E402  (validator, reused verbatim)

HEADER = """/* core/data/cluedrop.js -- window.AD_CLUEDROP

   The AUTHORED layer for CLUEDROP. Everything else that cabinet says about a
   country (hemisphere, continent, script, currency, land borders, population
   band, capital initial) is DERIVED at runtime from core/data/countries.js, so
   it cannot drift out of date. This file holds the three things that dataset
   does not know:

     left     ISO2 codes with LEFT-HAND traffic (UN members). Everything not in
              this list drives on the right.
     scripts  language name (exactly as spelt in countries.js `lang`) -> the
              writing system you would actually see on a sign. Absent = Latin.
     scriptBy ISO2 -> script phrase, for the handful where walking the language
              list gives the wrong answer (Azerbaijan reads as Cyrillic because
              Russian is listed second; Israel reads as Arabic because Arabic
              sorts first; Singapore reads as Tamil).
     langs    ISO2 -> official-language list, where countries.js is thin or
              carries an odd label (Bolivia omits Spanish; Austria is labelled
              "Austro-Bavarian German"; New Zealand lists a sign language,
              which cannot be on a road sign).
     money    overrides for `cur` where countries.js is stale or clumsy once the
              national adjective is stripped off (e.g. Cuba's convertible peso,
              abolished 2021).
     notes    2-3 concrete, checkable details per country: the plug in the wall,
              what is printed on the banknotes, the trees by the road, the shop
              on the corner, the shape of the number plates, the national sport.

   RULES FOLLOWED WHILE AUTHORING `notes`
     * Only facts the author is confident of. Where a detail was uncertain,
       dated or disputed the country got a different detail or was left out
       entirely -- a wrong clue is worse than no clue, because a generated clue
       is always true and the player must be able to trust the whole ladder.
     * Physical, visible, roadside things: infrastructure, vegetation, retail,
       paperwork, sport. No claims about what people are like. No stereotypes.
     * Deliberately NOT the country's most famous monument -- this is the
       GeoGuessr meta written out, not a tourist board.
     * No note names its own country, capital, demonym or alternative names --
       machine-enforced against core/data/countries.js.

   Hand-authored, then assembled by _build/gen_cluedrop.py from
   _build/cluedrop_base.json + _build/cluedrop_x*.json. Do not hand-edit this
   file: edit a batch and re-run the script. Validate with
   _build/check_cluedrop.py and _build/check_cluedrop_notes.py --all. */
"""


def js(s):
    """A JS string literal. json.dumps is exactly right here: same escapes."""
    return json.dumps(s, ensure_ascii=False)


def load_batches():
    out = []
    for p in sorted(glob.glob(os.path.join(HERE, "cluedrop_x*.json"))):
        out.append((os.path.basename(p), json.load(open(p, encoding="utf-8"))))
    return out


def region_of(iso, by):
    c = by.get(iso) or {}
    return c.get("reg") or "Elsewhere"


def emit(base, notes, by):
    L = []
    L.append(HEADER)
    L.append("window.AD_CLUEDROP = {")
    L.append("  version: %d," % (base.get("version") or 1))

    L.append("")
    L.append("  /* ── left-hand traffic (UN members) "
             "─────────────────── */")
    left = sorted(base["left"])
    rows = [left[i:i + 12] for i in range(0, len(left), 12)]
    L.append("  left: [")
    for r in rows:
        L.append("    " + ", ".join(js(x) for x in r) + ("," if r is not rows[-1] else ""))
    L.append("  ],")

    for key, comment in [("scripts", "what the signs are written in"),
                         ("scriptBy", "per-country script override"),
                         ("langs", "official-language overrides"),
                         ("money", "currency overrides")]:
        L.append("")
        L.append("  /* ── %s ── */" % comment)
        L.append("  %s: {" % key)
        items = list(base[key].items())
        for n, (k, v) in enumerate(items):
            val = ("[" + ", ".join(js(x) for x in v) + "]") if isinstance(v, list) else js(v)
            L.append("    %s: %s%s" % (js(k), val, "," if n < len(items) - 1 else ""))
        L.append("  },")

    L.append("")
    L.append("  /* ── the authored details ── */")
    L.append("  notes: {")
    byreg = {}
    for iso in notes:
        byreg.setdefault(region_of(iso, by), []).append(iso)
    regions = [r for r in ["Europe", "Asia", "Africa", "Americas", "Oceania"] if r in byreg]
    regions += [r for r in sorted(byreg) if r not in regions]
    last_iso = [i for r in regions for i in sorted(byreg[r])][-1]
    for r in regions:
        L.append("")
        L.append("    /* ── %s ── */" % r)
        for iso in sorted(byreg[r]):
            L.append("    %s: [" % iso)
            ns = notes[iso]
            for n, (tag, txt) in enumerate(ns):
                L.append("      [%s, %s]%s" % (js(tag), js(txt), "," if n < len(ns) - 1 else ""))
            L.append("    ]%s" % ("" if iso == last_iso else ","))
    L.append("  }")
    L.append("};")
    body = "\n".join(L) + "\n"
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(body)
    return len(body.encode("utf-8"))


def main():
    base = json.load(open(BASE, encoding="utf-8"))
    countries = CN.load_countries()
    by = {c["i"]: c for c in countries}
    batches = load_batches()

    prior = {k: [tuple(n) for n in v] for k, v in base["notes"].items()}
    errs = CN.validate(batches, countries, prior)

    notes = {k: [list(n) for n in v] for k, v in prior.items()}
    for src, data in batches:
        for iso, ns in data.items():
            if iso in notes:
                continue                      # already reported as an error above
            notes[iso] = [list(n) for n in ns]

    pool = sorted(i for i, ns in notes.items()
                  if by.get(i, {}).get("un") == 1
                  and (by[i].get("capll") or by[i].get("ll")) and len(ns) >= 2)
    un_missing = sorted(c["i"] for c in countries
                        if c.get("un") == 1 and (c.get("capll") or c.get("ll"))
                        and c["i"] not in notes)

    print("=" * 74)
    print("CLUEDROP — %d countries with notes, daily pool %d of 194 UN members"
          % (len(notes), len(pool)))
    print("=" * 74)
    print("  base: %d   batches: %s"
          % (len(prior), ", ".join(s for s, _ in batches) or "(none)"))
    hist = {}
    for ns in notes.values():
        hist[len(ns)] = hist.get(len(ns), 0) + 1
    print("  notes per country: " + " ".join("%d:%d" % (k, hist[k]) for k in sorted(hist)))
    if un_missing:
        print("  UN members still without notes (%d): %s"
              % (len(un_missing), " ".join(un_missing)))

    if errs:
        print("\nERRORS (%d)" % len(errs))
        for e in errs[:80]:
            print("  X " + e)
        print("\nBUILD FAILED — output NOT written")
        return 1

    if "--report" not in sys.argv:
        size = emit(base, notes, by)
        print("\nwrote %s  (%d bytes, %.1f KB)" % (OUT, size, size / 1024.0))
    print("\nOK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
