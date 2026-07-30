#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_trivia2.py -- build core/data/trivia.js (window.AD_TRIVIA) for THE DECIDER.

    python3 _build/gen_trivia2.py

Sources, in order:
  1. _build/trivia_bank.py           the original hand-authored 611
  2. _build/trivia_parts/*.py        the expansion batches, one file per author

What this script does that the first generator did not:

  * REBALANCES. The players said the art / literature / older-cultural-history
    questions are not their ground and they want less of it, and that the
    questions about their own cities, heritage and religion are too easy.
    So: an explicit DROP list removes the specialist end of art, literature and
    pre-1850 history, and DEMOTE re-rates whole categories by a pip --
    downwards for art/lit/history (they want these gentler) and downwards for
    cities/persia/jewish too, because a question they know by osmosis IS a
    difficulty 1 and calling it a 4 is what made those rounds feel like gimmes.
    The hard end of those three categories is then supplied by new material
    written specifically to test people who live this stuff.

  * EMITS A COMPACT ENCODING. One row per question instead of a six-key object,
    with the answer stored once rather than twice (the four options are shuffled
    at load time from a seed derived from the question text, so the order is
    still identical on every device). At this bank size the old verbose JSON
    would have been about 700 KB; rows bring that down by roughly a third and
    parse into far fewer objects on a phone.

  * WRITES THE CATEGORY WEIGHTS the game uses to decide how often a category
    comes up. This is the actual lever for "less art and literature": the
    picker walks categories, so shrinking a category in the bank does nothing.

Deterministic and re-runnable: no clock, no PYTHONHASHSEED dependence, no
network. Validate the result with _build/validate_trivia.py.
"""
import glob
import hashlib
import importlib.util
import json
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "core", "data", "trivia.js")
PARTS = os.path.join(HERE, "trivia_parts")

sys.path.insert(0, HERE)
import trivia_bank as BASE  # noqa: E402

CATS = BASE.CATS

# ── how often each category should come up, relative to the others ──────────
# Read by games/decider/game.js. art, lit and history are deliberately damped:
# before this the picker walked all fifteen categories uniformly, which made
# art and literature the two MOST-served categories of the fifteen.
WEIGHTS = {
    "general": 1.0, "geo": 1.0, "science": 1.0, "ai": 1.0, "food": 1.0,
    "sport": 1.0, "film": 1.0, "cities": 1.0, "persia": 1.0,
    "jewish": 0.95, "music": 0.9, "words": 0.9,
    "history": 0.55, "lit": 0.3, "art": 0.22,
}

# ── categories re-rated by one pip, downwards ───────────────────────────────
# art/lit/history: the players asked for these to be easier.
# cities/persia/jewish: these were rated as though the player were a stranger
# to the material. They are not. Re-rating pushes the by-osmosis questions down
# to the low rungs where they belong and leaves the 4s and 5s to be filled by
# material written to test an insider.
DEMOTE = {"art": 1, "lit": 1, "history": 1, "cities": 1, "persia": 1, "jewish": 1}

# ── dropped outright: the specialist end of exactly what they complained about ─
# Matched on a distinctive fragment of the question text.
DROP = [
    # art: painters and movements that need an art-history degree to enjoy
    "Merzbau",
    "1909 manifesto, glorified speed",
    "Yves Klein patented",
    "Arnolfini Portrait",
    # lit: pre-20th-century novelists, publication minutiae, canon-only names
    "Six Characters in Search of an Author",
    "Season of Migration to the North",
    "Giuseppe Tomasi di Lampedusa",
    "cantos are there in Dante",
    "plays are collected in Shakespeare's First Folio",
    "Who wrote the Aeneid",
    "pen name Currer Bell",
    "Nobel Prize in Literature in 1998",
    # history: the older cultural end
    "Byzantine emperor had Roman law codified",
    "Battle of Lepanto",
    "Mansa Musa",
    "Edict of Milan",
    "island of Pharos",
    "Which language does the Greek section record",
    "Champollion announce",
    "Defenestration of Prague",
    "Treaty of Tordesillas",
]


def norm_key(s):
    return re.sub(r"[^a-z0-9]+", " ", str(s).lower()).strip()


def words(s):
    return set(re.findall(r"[a-z0-9]+", str(s).lower()))


def stable_rand(seed_text):
    """Deterministic PRNG seeded from text: same output on every machine."""
    h = hashlib.sha256(seed_text.encode("utf-8")).digest()
    state = [int.from_bytes(h[i:i + 4], "big") for i in range(0, 32, 4)]
    idx = [0]

    def nxt():
        v = state[idx[0] % len(state)]
        idx[0] += 1
        state[(idx[0] - 1) % len(state)] = ((v ^ (v << 13)) ^ (v >> 17)) & 0xFFFFFFFF
        return v / 0x100000000
    return nxt


def load_parts():
    out = []
    for path in sorted(glob.glob(os.path.join(PARTS, "*.py"))):
        name = os.path.basename(path)[:-3]
        spec = importlib.util.spec_from_file_location("part_" + name, path)
        mod = importlib.util.module_from_spec(spec)
        try:
            spec.loader.exec_module(mod)
        except Exception as exc:                       # a half-written batch
            print("  !! %-24s SKIPPED (%s)" % (name, exc))
            continue
        bank = getattr(mod, "BANK", None)
        if not bank:
            print("  !! %-24s SKIPPED (no BANK)" % name)
            continue
        for rec in bank:
            rec = dict(rec)
            rec["src"] = name
            out.append(rec)
        print("  %-24s %4d" % (name, len(bank)))
    return out


def normalise(rec, src):
    """One record from either source into a single shape, or None."""
    out = {
        "cat": rec.get("cat"), "diff": rec.get("diff"), "q": rec.get("q"),
        "a": rec.get("a"), "note": rec.get("note", ""), "src": src,
        "numeric": bool(rec.get("numeric")),
    }
    if out["numeric"]:
        out["unit"] = rec.get("unit", "")
    else:
        # the base bank names them w1/w2/w3 positionally via Q(); the batches
        # hand back a list. Accept either.
        wrong = rec.get("wrong")
        if wrong is None:
            wrong = [rec.get("w1"), rec.get("w2"), rec.get("w3")]
        out["wrong"] = [w for w in wrong if w is not None]
    return out


def build():
    print("sources")
    base = [normalise(r, "trivia_bank") for r in BASE.BANK]
    print("  %-24s %4d" % ("trivia_bank", len(base)))
    parts = [normalise(r, r.get("src", "part")) for r in load_parts()]

    rows, problems, dropped = [], [], Counter()
    seen_q, seen_ans = {}, defaultdict(list)

    for rec in base + parts:
        cat, q, a, note = rec["cat"], rec["q"], rec["a"], rec["note"]
        where = "%s/%s [%s]" % (cat, str(q)[:46], rec["src"])

        # ── structural gates: anything that fails is dropped, not shipped ──
        if cat not in CATS:
            problems.append("unknown category %r  (%s)" % (cat, where))
            continue
        if not isinstance(q, str) or not q.strip():
            problems.append("empty question  (%s)" % where)
            continue
        if not isinstance(rec["diff"], int) or not (1 <= rec["diff"] <= 5):
            problems.append("difficulty %r out of range  (%s)" % (rec["diff"], where))
            continue
        if not note or not str(note).strip():
            problems.append("missing note  (%s)" % where)
            continue

        if any(frag.lower() in q.lower() for frag in DROP):
            dropped["on the DROP list"] += 1
            continue

        key = norm_key(q)
        if key in seen_q:
            dropped["duplicate question"] += 1
            continue
        seen_q[key] = 1

        diff = rec["diff"]
        if cat in DEMOTE:
            diff = max(1, diff - DEMOTE[cat])

        if rec["numeric"]:
            if not isinstance(a, (int, float)) or isinstance(a, bool):
                problems.append("numeric answer is not a number  (%s)" % where)
                continue
            if not rec.get("unit"):
                problems.append("numeric question with no unit  (%s)" % where)
                continue
            rows.append({"cat": cat, "diff": diff, "q": q.strip(), "a": a,
                         "unit": str(rec["unit"]).strip(), "note": str(note).strip(),
                         "numeric": True, "src": rec["src"]})
            continue

        if not isinstance(a, str) or not a.strip():
            problems.append("empty answer  (%s)" % where)
            continue
        wrong = [str(w).strip() for w in rec["wrong"] if str(w).strip()]
        if len(wrong) != 3:
            problems.append("needs exactly 3 wrong options, got %d  (%s)" % (len(wrong), where))
            continue
        opts = [a.strip()] + wrong
        if len(set(o.lower() for o in opts)) != 4:
            problems.append("an option repeats  (%s)" % where)
            continue
        # An answer whose words are all already in the question gives itself away.
        aw = words(a)
        if aw and aw <= words(q):
            problems.append("answer leaks into the question  (%s)" % where)
            continue

        # Two questions in one category with the same answer are effectively the
        # same question asked twice. Keep the first.
        ak = (cat, norm_key(a))
        if seen_ans[ak]:
            dropped["same answer already used in this category"] += 1
            continue
        seen_ans[ak].append(key)

        rows.append({"cat": cat, "diff": diff, "q": q.strip(), "a": a.strip(),
                     "wrong": wrong, "note": str(note).strip(), "numeric": False,
                     "src": rec["src"]})

    return rows, problems, dropped


def report(rows):
    mc = [r for r in rows if not r["numeric"]]
    nu = [r for r in rows if r["numeric"]]
    n = len(rows)
    print("\nBANK: %d questions  (%d multiple-choice, %d numeric)" % (n, len(mc), len(nu)))

    print("\ndifficulty")
    dh = Counter(r["diff"] for r in rows)
    target = {1: 10, 2: 20, 3: 30, 4: 25, 5: 15}
    for d in range(1, 6):
        got = 100.0 * dh[d] / n
        print("  %d %-30s %4d  %5.1f%%   (target %d%%)"
              % (d, "#" * int(got), dh[d], got, target[d]))

    print("\ncategories                          count  share  weight   difficulty spread")
    ch = Counter(r["cat"] for r in rows)
    for c in sorted(CATS, key=lambda k: -ch[k]):
        spread = " ".join("%d:%-3d" % (d, sum(1 for r in rows if r["cat"] == c and r["diff"] == d))
                          for d in range(1, 6))
        print("  %-8s %-22s %4d  %4.1f%%  %5.2f   %s"
              % (c, CATS[c]["label"], ch[c], 100.0 * ch[c] / n, WEIGHTS.get(c, 1), spread))

    thin = [(c, d) for c in CATS for d in range(1, 6)
            if sum(1 for r in mc if r["cat"] == c and r["diff"] == d) < 2]
    print("\n(cat,diff) buckets that cannot pair two players: %d of %d" % (len(thin), len(CATS) * 5))
    if thin:
        print("  " + ", ".join("%s/%d" % t for t in thin))
    print("numeric by difficulty: " +
          " ".join("%d:%d" % (d, sum(1 for r in nu if r["diff"] == d)) for d in range(1, 6)))
    print("wager pool (numeric, diff>=3): %d" % sum(1 for r in nu if r["diff"] >= 3))


def emit(rows):
    """
    Compact rows, not objects. games/decider/game.js decodes both shapes.
        multiple choice : [q, answer, wrong1, wrong2, wrong3, catIndex, diff, note]
        numeric         : [q, number, unit, catIndex, diff, note]
    The discriminator is `typeof row[1]`: a number means a wager question.
    """
    cat_list = list(CATS.keys())
    ci = {c: i for i, c in enumerate(cat_list)}
    packed = []
    for r in sorted(rows, key=lambda x: (x["cat"], x["diff"], norm_key(x["q"]))):
        if r["numeric"]:
            packed.append([r["q"], r["a"], r["unit"], ci[r["cat"]], r["diff"], r["note"]])
        else:
            packed.append([r["q"], r["a"], r["wrong"][0], r["wrong"][1], r["wrong"][2],
                           ci[r["cat"]], r["diff"], r["note"]])

    mc = sum(1 for r in rows if not r["numeric"])
    head = [
        "/* core/data/trivia.js -- window.AD_TRIVIA : the question bank for THE DECIDER",
        "",
        "   %d questions (%d multiple-choice, %d numeric wager questions)." % (
            len(rows), mc, len(rows) - mc),
        "   GENERATED by _build/gen_trivia2.py from _build/trivia_bank.py plus the",
        "   batches in _build/trivia_parts/. Do not hand-edit this file -- edit a bank",
        "   and re-run the script. Validate with: python3 _build/validate_trivia.py",
        "",
        "   Every answer is a settled, checkable fact; anything whose answer moves",
        "   (incumbents, current champions, live records, populations) was deliberately",
        "   left out. Wrong options are plausible but unambiguously wrong. `note` is",
        "   shown after the reveal.",
        "",
        "   `diff` is calibrated to the two people who play this cabinet, not to a",
        "   stranger: 1 = they will both get it instantly, 5 = genuinely hard for strong",
        "   generalists but still fair. So a Persian food question or a London tube",
        "   question can be a 1 here and still be obscure to everybody else.",
        "",
        "   `weights` is how often a category should come up, relative to the others.",
        "   The picker walks categories rather than questions, so this -- not the",
        "   number of questions in a category -- is what controls the mix.",
        "",
        "   ROWS, not objects, to keep the file parseable on a phone:",
        "     multiple choice : [q, answer, wrong, wrong, wrong, catIndex, diff, note]",
        "     numeric (wager) : [q, number, unit, catIndex, diff, note]",
        "   A number in slot 1 means it is a wager question. `c` indexes the rows'",
        "   category slot into the category keys.",
        "*/",
        "window.AD_TRIVIA = {",
        '"cats": ' + json.dumps(CATS, ensure_ascii=False) + ",",
        '"weights": ' + json.dumps(WEIGHTS, ensure_ascii=False) + ",",
        '"c": ' + json.dumps(cat_list, ensure_ascii=False) + ",",
        '"q": [',
    ]
    body = ",\n".join(json.dumps(p, ensure_ascii=False, separators=(",", ":")) for p in packed)
    txt = "\n".join(head) + "\n" + body + "\n]};\n"
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(txt)
    kb = len(txt.encode("utf-8")) / 1024.0
    print("\nwrote %s" % OUT)
    print("  %.1f KB raw" % kb)
    return kb


if __name__ == "__main__":
    rows, problems, dropped = build()
    if dropped:
        print("\ndropped deliberately")
        for k, v in dropped.most_common():
            print("  %-42s %4d" % (k, v))
    if problems:
        print("\n!! %d entr%s REJECTED as malformed (not shipped)"
              % (len(problems), "y" if len(problems) == 1 else "ies"))
        for p in problems[:60]:
            print("   " + p)
        if len(problems) > 60:
            print("   ... and %d more" % (len(problems) - 60))
    report(rows)
    emit(rows)
