#!/usr/bin/env python3
"""Integrity check for core/data/cluedrop.js (the CLUEDROP authored layer).

core/data/cluedrop.js is HAND-AUTHORED, not generated -- there is no upstream
dataset for "what is in the wall socket". So this script is the re-runnable
artefact instead of a generator: it proves the hand-written file still lines up
with core/data/countries.js, which IS generated and does move.

What it checks
  1. every ISO2 mentioned anywhere (notes, left, money, scriptBy, langs) exists
     in countries.js, is a UN member, and has coordinates to measure from
  2. every `scripts` key is a language string that countries.js actually uses
     (a typo there silently downgrades a country to "Latin alphabet")
  3. every country in `notes` has >= 2 details, each a [LABEL, sentence] pair
  4. no detail text is reused between two countries
  5. `left` has no duplicates, and every entry is a real UN member
  6. the answer pool -- countries with >= 2 details -- and its region spread
  7. the five countries _build/CONTRACT.md 7 requires in the pool are in it

What it does NOT check: the wording of the six generated clues. Those are
produced by games/cluedrop/game.js at runtime and are audited in the browser
with `__CD.audit()`, so the prose has exactly one source of truth.

    python3 _build/check_cluedrop.py        # exits 1 on any failure
"""

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COUNTRIES = os.path.join(ROOT, "core", "data", "countries.js")
CLUEDROP = os.path.join(ROOT, "core", "data", "cluedrop.js")

# CONTRACT.md 7: these must be reachable in the geo cabinets.
REQUIRED = ["IR", "GB", "US", "IL", "TJ"]

fails = []
warns = []


def fail(msg):
    fails.append(msg)


def warn(msg):
    warns.append(msg)


def load_countries():
    src = open(COUNTRIES, encoding="utf-8").read()
    i = src.index("window.AD_COUNTRIES = [")
    j = src.index("\n];", i)
    arr = json.loads(src[i + len("window.AD_COUNTRIES = "):j + 2])
    return {c["i"]: c for c in arr}


def load_cluedrop():
    """Read the JS object without executing it.

    The file is plain data in a fixed shape, so each block is pulled out with a
    narrow regex rather than by pretending to be a JS parser.
    """
    src = open(CLUEDROP, encoding="utf-8").read()
    if "window.AD_CLUEDROP" not in src:
        fail("cluedrop.js does not assign window.AD_CLUEDROP")
        sys.exit(1)

    def block(name, opener, closer):
        m = re.search(re.escape(name) + r":\s*" + re.escape(opener), src)
        if not m:
            return ""
        start = m.end()
        depth = 1
        k = start
        while k < len(src) and depth:
            if src[k] == opener:
                depth += 1
            elif src[k] == closer:
                depth -= 1
            k += 1
        return src[start:k - 1]

    out = {}
    out["left"] = re.findall(r'"([A-Z]{2})"', block("left", "[", "]"))
    out["scripts"] = dict(re.findall(r'"([^"]+)":\s*"((?:[^"\\]|\\.)*)"',
                                     block("scripts", "{", "}")))
    out["scriptBy"] = dict(re.findall(r'([A-Z]{2}):\s*"((?:[^"\\]|\\.)*)"',
                                      block("scriptBy", "{", "}")))
    out["money"] = dict(re.findall(r'([A-Z]{2}):\s*"((?:[^"\\]|\\.)*)"',
                                   block("money", "{", "}")))

    langs_src = block("langs", "{", "}")
    out["langs"] = {}
    for iso, body in re.findall(r"([A-Z]{2}):\s*\[([^\]]*)\]", langs_src):
        out["langs"][iso] = re.findall(r'"((?:[^"\\]|\\.)*)"', body)

    notes_src = block("notes", "{", "}")
    out["notes"] = {}
    # one country per "XX: [ ... ]" run; each detail is ["LABEL", "text"]
    for iso, body in re.findall(r"^\s{4}([A-Z]{2}):\s*\[(.*?)^\s{4}\],?\s*$",
                               notes_src, re.M | re.S):
        pairs = re.findall(r'\[\s*"((?:[^"\\]|\\.)*)",\s*"((?:[^"\\]|\\.)*)"\s*\]', body)
        out["notes"][iso] = pairs
    return out


def main():
    by = load_countries()
    D = load_cluedrop()
    notes, left = D["notes"], D["left"]

    print("countries.js       %d records (%d UN members)"
          % (len(by), sum(1 for c in by.values() if c["un"] == 1)))
    print("cluedrop.js        %d countries with details, %d left-hand-traffic codes,"
          " %d script keys, %d money overrides, %d script overrides, %d language overrides"
          % (len(notes), len(left), len(D["scripts"]), len(D["money"]),
             len(D["scriptBy"]), len(D["langs"])))

    # 1. every ISO2 referenced is a real, playable country
    for name in ("notes", "money", "scriptBy", "langs"):
        for iso in D[name]:
            if iso not in by:
                fail("%s: %s is not in countries.js" % (name, iso))
            elif by[iso]["un"] != 1:
                fail("%s: %s is not a UN member" % (name, iso))
            elif not (by[iso].get("capll") or by[iso].get("ll")):
                fail("%s: %s has no coordinates" % (name, iso))

    # 2. script keys must be language strings countries.js really uses
    used = set()
    for c in by.values():
        used.update(c.get("lang") or [])
    for k in D["scripts"]:
        if k not in used:
            fail("scripts: %r is not a language in countries.js" % k)

    # 3. shape of each authored detail
    for iso, pairs in sorted(notes.items()):
        if len(pairs) < 2:
            fail("notes[%s]: %d detail(s), need at least 2" % (iso, len(pairs)))
        for lb, tx in pairs:
            if not re.match(r"^[A-Z][A-Z ]*$", lb):
                fail("notes[%s]: label %r is not upper case" % (iso, lb))
            if not tx.endswith("."):
                fail("notes[%s]: %r does not end in a full stop" % (iso, tx[:40]))
            if len(tx) < 25:
                fail("notes[%s]: %r is too short to be a clue" % (iso, tx))
            if len(tx) > 125:
                warn("notes[%s]: %d chars, will wrap to 3+ lines on a phone"
                     % (iso, len(tx)))

    # 4. no reused text
    seen = {}
    for iso, pairs in notes.items():
        for _, tx in pairs:
            if tx in seen:
                fail("notes: %s and %s share a detail: %r" % (seen[tx], iso, tx[:50]))
            seen[tx] = iso

    # 5. left-hand traffic list
    if len(set(left)) != len(left):
        dupes = sorted({x for x in left if left.count(x) > 1})
        fail("left: duplicate codes %s" % dupes)
    for iso in left:
        if iso not in by:
            fail("left: %s is not in countries.js" % iso)
        elif by[iso]["un"] != 1:
            fail("left: %s is not a UN member" % iso)

    # 6/7. the answer pool
    pool = sorted(i for i, p in notes.items()
                  if len(p) >= 2 and i in by and by[i]["un"] == 1
                  and (by[i].get("capll") or by[i].get("ll")))
    print("answer pool        %d countries (%d days before a repeat)"
          % (len(pool), len(pool)))
    spread = {}
    for i in pool:
        spread[by[i]["reg"]] = spread.get(by[i]["reg"], 0) + 1
    print("region spread      " +
          ", ".join("%s %d" % kv for kv in sorted(spread.items())))
    print("left-hand in pool  %d of %d"
          % (sum(1 for i in pool if i in left), len(pool)))
    print("non-Latin script   %d of %d"
          % (sum(1 for i in pool
                 if i in D["scriptBy"]
                 or any(l in D["scripts"] for l in (by[i].get("lang") or []))),
             len(pool)))

    if len(pool) < 60:
        fail("answer pool is only %d countries; the archive needs more" % len(pool))
    for iso in REQUIRED:
        if iso not in pool:
            fail("CONTRACT 7 requires %s in the pool" % iso)

    for w in warns:
        print("  warn  " + w)
    for f in fails:
        print("  FAIL  " + f)
    print("\n%s -- %d failure(s), %d warning(s)"
          % ("FAILED" if fails else "OK", len(fails), len(warns)))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
