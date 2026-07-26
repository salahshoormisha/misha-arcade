#!/usr/bin/env python3
"""
gen_chrono.py — builds core/data/chrono.js for the CHRONO cabinet.

CHRONO is the offline answer to TimeGuessr: no photographs, so it works on a
plane. One YEAR per day, five clues about that year revealed one at a time,
each worth less than the last.

The clue bank lives in _build/chrono_bank_[a-e].py, one dict per file, keyed by
year. Every entry is:

    YEAR: ("note — one sentence naming the year's headline",
           ["hardest clue", "...", "...", "...", "most obvious clue"])

VALIDATION (all of it fatal — the file is not written if anything fails):
  1. every year has exactly 5 clues, all non-empty, all one sentence-ish
  2. NO YEAR-NAME LEAKAGE: no four-digit number in 1700..2100 may appear in
     any clue of its own year (the strict rule), and separately no clue may
     contain the answer year or any year within +/-5 of it, spelled out as
     digits, anywhere in the file
  3. no duplicate clues, anywhere in the bank (exact and normalised)
  4. years are in range, unique, and the pool is >= 120 entries
  5. spread: every decade from 1850 to 2010 has at least one year
  6. no clue longer than 190 chars (it has to fit a 375px phone)

Run:  python3 _build/gen_chrono.py
      python3 _build/gen_chrono.py --draft   # same checks, but allows a
                                             # part-written bank through so the
                                             # cabinet can be loaded mid-build.
                                             # --draft relaxes ONLY the pool
                                             # size and the decade spread; every
                                             # per-clue check stays fatal.
"""

import os
import re
import sys
import json
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "core", "data", "chrono.js")

BANK_MODULES = ["chrono_bank_a", "chrono_bank_b", "chrono_bank_c",
                "chrono_bank_d", "chrono_bank_e"]

MIN_YEARS = 120
YEAR_LO, YEAR_HI = 1850, 2020
MAX_CLUE = 190
NEAR = 5          # a clue may not name any year within +/- NEAR of its answer

sys.path.insert(0, HERE)


def load_bank():
    bank = {}
    dupe_years = []
    for mod in BANK_MODULES:
        try:
            m = __import__(mod)
        except ImportError:
            print("  (no %s yet — skipping)" % mod)
            continue
        part = getattr(m, "BANK")
        for y, v in part.items():
            if y in bank:
                dupe_years.append(y)
            bank[y] = v
    if dupe_years:
        fail("year defined in two bank files: %s" % sorted(dupe_years))
    return bank


ERRORS = []


def fail(msg):
    ERRORS.append(msg)


def norm_clue(s):
    """Normalise for duplicate detection: fold case, strip punctuation/space."""
    s = unicodedata.normalize("NFKD", s)
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return " ".join(s.split())


YEAR_RE = re.compile(r"\b(1[789]\d\d|20\d\d|21\d\d)\b")


def validate(bank, draft=False):
    years = sorted(bank.keys())

    if len(years) < MIN_YEARS:
        (print if draft else fail)(
            "only %d years in the bank, need >= %d" % (len(years), MIN_YEARS))

    for y in years:
        if not isinstance(y, int) or y < YEAR_LO or y > YEAR_HI:
            fail("year %r out of range %d..%d" % (y, YEAR_LO, YEAR_HI))

    # 5. decade spread
    for dec in range(1850, 2020, 10):
        if not any(dec <= y < dec + 10 for y in years):
            (print if draft else fail)("no year in the %ds" % dec)

    seen = {}          # normalised clue -> year that used it
    leaks = []
    for y in years:
        entry = bank[y]
        if not (isinstance(entry, tuple) and len(entry) == 2):
            fail("%d: entry must be (note, [clues])" % y)
            continue
        note, clues = entry

        if not isinstance(note, str) or len(note.strip()) < 12:
            fail("%d: note missing or too short" % y)

        if not isinstance(clues, list) or len(clues) != 5:
            fail("%d: needs exactly 5 clues, has %s" %
                 (y, len(clues) if isinstance(clues, list) else type(clues)))
            continue

        for i, c in enumerate(clues):
            tag = "%d clue %d" % (y, i + 1)
            if not isinstance(c, str) or not c.strip():
                fail("%s: empty" % tag)
                continue
            if len(c) > MAX_CLUE:
                fail("%s: %d chars, over the %d limit" % (tag, len(c), MAX_CLUE))
            if not c.strip().endswith((".", "!", "?")):
                fail("%s: no full stop" % tag)
            if c != c.strip():
                fail("%s: leading/trailing whitespace" % tag)
            if "  " in c:
                fail("%s: double space" % tag)

            # --- the leakage rule ---
            for m in YEAR_RE.finditer(c):
                found = int(m.group(1))
                if abs(found - y) <= NEAR:
                    leaks.append("%s names %d (answer %d)" % (tag, found, y))
                else:
                    # strict: no four-digit years in clues at all, so a player
                    # can never anchor off one. Reported separately.
                    leaks.append("%s contains a four-digit year %d" % (tag, found))

            k = norm_clue(c)
            if k in seen:
                fail("%s duplicates a clue already used for %d" % (tag, seen[k]))
            seen[k] = y

        # the note is allowed to name nothing either — it is shown only after
        # the round, but it must not be the giveaway if it leaks into a build
        # by mistake, so hold it to the same rule.
        for m in YEAR_RE.finditer(note):
            leaks.append("%d note contains a four-digit year %s" % (y, m.group(1)))

    for l in leaks:
        fail("LEAK: " + l)

    return years


def emit(bank, years):
    rows = []
    for y in years:
        note, clues = bank[y]
        rows.append("{y:%d,c:%s,n:%s}" % (
            y,
            json.dumps(clues, ensure_ascii=False),
            json.dumps(note, ensure_ascii=False),
        ))
    body = ",\n".join(rows)
    js = (
        "/* ============================================================================\n"
        "   core/data/chrono.js  ->  window.AD_CHRONO\n"
        "   CHRONO's clue bank: %d years between %d and %d, five clues each,\n"
        "   ordered HARDEST first and most obvious last, plus a one-line note shown\n"
        "   after the round.\n"
        "\n"
        "   GENERATED by _build/gen_chrono.py from _build/chrono_bank_[a-e].py.\n"
        "   Do not hand-edit: edit the bank and re-run the script, which also\n"
        "   enforces five clues per year, no year-name leakage inside a year's own\n"
        "   clues, and no duplicate clues anywhere.\n"
        "\n"
        "   Sources: general-reference history, cross-checked entry by entry. Anything\n"
        "   that could not be dated with confidence was dropped rather than guessed.\n"
        "   ========================================================================== */\n"
        "window.AD_CHRONO = {\n"
        "  lo: %d, hi: %d,\n"
        "  years: [\n%s\n  ]\n"
        "};\n"
    ) % (len(years), years[0], years[-1], YEAR_LO, YEAR_HI, body)
    with open(OUT, "w") as f:
        f.write(js)
    return len(js.encode("utf-8"))


def main():
    draft = "--draft" in sys.argv
    bank = load_bank()
    years = validate(bank, draft)
    if ERRORS:
        print("FAILED — %d problem(s):" % len(ERRORS))
        for e in ERRORS[:80]:
            print("  ·", e)
        if len(ERRORS) > 80:
            print("  … and %d more" % (len(ERRORS) - 80))
        sys.exit(1)

    size = emit(bank, years)
    clues = sum(len(bank[y][1]) for y in years)
    decades = {}
    for y in years:
        decades[y // 10 * 10] = decades.get(y // 10 * 10, 0) + 1
    print("OK  %s" % OUT)
    print("    years   : %d  (%d..%d)" % (len(years), years[0], years[-1]))
    print("    clues   : %d  (5 per year, all unique)" % clues)
    print("    bytes   : %d  (%.1f KB)" % (size, size / 1024.0))
    print("    leakage : none — no four-digit year appears in any clue")
    print("    decades : %s" % " ".join(
        "%ds:%d" % (d, decades[d]) for d in sorted(decades)))
    longest = max(len(c) for y in years for c in bank[y][1])
    print("    longest clue: %d chars (limit %d)" % (longest, MAX_CLUE))


if __name__ == "__main__":
    main()
