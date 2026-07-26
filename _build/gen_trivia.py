#!/usr/bin/env python3
"""
gen_trivia.py -- build core/data/trivia.js  (window.AD_TRIVIA) for THE DECIDER.

The question bank itself lives in _build/trivia_bank.py, hand-authored.
This script only: validates, deterministically shuffles each question's options,
and emits the JS. Re-runnable and deterministic (no Math.random, no clock).

    python3 _build/gen_trivia.py

Shape emitted (see _build/CONTRACT.md; trivia.js is THE DECIDER's own data file):

  window.AD_TRIVIA = {
    cats: { general: {label:"GENERAL KNOWLEDGE", icon:"..."} , ... },
    questions: [
      {q, a, opts:[4, including a exactly once], cat, diff:1-5, note},
      {q, a:<number>, unit, cat, diff, note, numeric:true},
      ...
    ]
  }
"""
import hashlib
import json
import os
import re
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "core", "data", "trivia.js")

sys.path.insert(0, HERE)
import trivia_bank as BANK  # noqa: E402

CATS = BANK.CATS


def stable_rand(seed_text):
    """A tiny deterministic PRNG seeded from text -- same output on every run,
    on every machine, regardless of PYTHONHASHSEED."""
    h = hashlib.sha256(seed_text.encode("utf-8")).digest()
    state = [int.from_bytes(h[i:i + 4], "big") for i in range(0, 32, 4)]
    idx = [0]

    def nxt():
        v = state[idx[0] % len(state)]
        idx[0] += 1
        # xorshift the slot so we can draw more numbers than we have seed words
        state[(idx[0] - 1) % len(state)] = ((v ^ (v << 13)) ^ (v >> 17)) & 0xFFFFFFFF
        return v / 0x100000000
    return nxt


def shuffled(items, seed_text):
    r = stable_rand(seed_text)
    a = list(items)
    for i in range(len(a) - 1, 0, -1):
        j = int(r() * (i + 1))
        a[i], a[j] = a[j], a[i]
    return a


def norm_words(s):
    return set(re.findall(r"[a-z0-9]+", str(s).lower()))


def build():
    out, problems, seen_q = [], [], {}

    for rec in BANK.BANK:
        cat, diff, q, a = rec["cat"], rec["diff"], rec["q"], rec["a"]
        note = rec.get("note", "")
        where = "%s/%s" % (cat, q[:52])

        if cat not in CATS:
            problems.append("unknown category %r  (%s)" % (cat, where))
        if not (1 <= diff <= 5):
            problems.append("difficulty out of range: %r  (%s)" % (diff, where))
        if not q.endswith("?") and not q.endswith(".") and ":" not in q:
            problems.append("question has no terminal punctuation: %s" % where)
        if not note:
            problems.append("missing note: %s" % where)

        key = re.sub(r"[^a-z0-9]+", " ", q.lower()).strip()
        if key in seen_q:
            problems.append("DUPLICATE question: %s" % where)
        seen_q[key] = 1

        if rec.get("numeric"):
            if not isinstance(a, (int, float)):
                problems.append("numeric answer is not a number: %s" % where)
            if not rec.get("unit"):
                problems.append("numeric question with no unit: %s" % where)
            out.append({
                "q": q, "a": a, "unit": rec["unit"], "cat": cat,
                "diff": diff, "note": note, "numeric": True,
            })
            continue

        opts = [a] + list(rec["wrong"])
        if len(opts) != 4:
            problems.append("not 4 options (%d): %s" % (len(opts), where))
        if len(set(o.lower() for o in opts)) != len(opts):
            problems.append("duplicate option text: %s" % where)
        # An answer that appears verbatim in its own question is a giveaway.
        aw = norm_words(a)
        if aw and aw <= norm_words(q):
            problems.append("answer leaks into the question: %s" % where)

        out.append({
            "q": q, "a": a, "opts": shuffled(opts, q + "|" + a),
            "cat": cat, "diff": diff, "note": note,
        })

    return out, problems


def report(qs):
    mc = [q for q in qs if not q.get("numeric")]
    nu = [q for q in qs if q.get("numeric")]
    print("questions: %d  (%d multiple-choice, %d numeric)" % (len(qs), len(mc), len(nu)))

    print("\ndifficulty histogram")
    dh = Counter(q["diff"] for q in qs)
    for d in range(1, 6):
        n = dh.get(d, 0)
        print("  %d %-40s %3d  %4.1f%%" % (d, "#" * min(40, n // 3), n, 100.0 * n / len(qs)))

    print("\ncategories")
    ch = Counter(q["cat"] for q in qs)
    flavour = {"persia", "jewish", "cities"}
    for c in CATS:
        n = ch.get(c, 0)
        print("  %-9s %-22s %3d   diff " % (c, CATS[c]["label"], n) +
              " ".join("%d:%d" % (d, sum(1 for q in qs if q["cat"] == c and q["diff"] == d))
                       for d in range(1, 6)))
    fl = sum(ch.get(c, 0) for c in flavour)
    print("\n  their-world share: %d/%d = %.1f%%" % (fl, len(qs), 100.0 * fl / len(qs)))

    # THE DECIDER pairs two players on the same (cat,diff) when it can.
    print("\n(cat,diff) buckets with >=2 questions (pairable): %d of %d populated" % (
        sum(1 for c in CATS for d in range(1, 6)
            if sum(1 for q in mc if q["cat"] == c and q["diff"] == d) >= 2),
        len(CATS) * 5))
    thin = [(c, d) for c in CATS for d in range(1, 6)
            if sum(1 for q in mc if q["cat"] == c and q["diff"] == d) == 0]
    if thin:
        print("  empty buckets: " + ", ".join("%s/%d" % t for t in thin))
    print("\nnumeric by difficulty: " +
          " ".join("%d:%d" % (d, sum(1 for q in nu if q["diff"] == d)) for d in range(1, 6)))


def emit(qs):
    lines = []
    lines.append("/* core/data/trivia.js -- window.AD_TRIVIA : the question bank for THE DECIDER")
    lines.append("")
    lines.append("   %d questions (%d multiple-choice, %d numeric wager questions)."
                 % (len(qs), len([q for q in qs if not q.get("numeric")]),
                    len([q for q in qs if q.get("numeric")])))
    lines.append("   Hand-authored in _build/trivia_bank.py; GENERATED by _build/gen_trivia.py.")
    lines.append("   Do not hand-edit this file -- edit the bank and re-run the script.")
    lines.append("")
    lines.append("   Every answer is a settled, checkable fact that was still true in January")
    lines.append("   2026; anything whose answer moves (incumbents, current champions, live")
    lines.append("   records, populations) was deliberately left out. Wrong options are")
    lines.append("   plausible but unambiguously wrong. `note` is shown after the reveal.")
    lines.append("   `diff` 1 = most people know it, 5 = genuinely hard for strong players.")
    lines.append("")
    lines.append("   Validate with:  python3 _build/check_trivia.py")
    lines.append("*/")
    body = {"cats": CATS, "questions": qs}
    lines.append("window.AD_TRIVIA = {")
    lines.append('"cats": ' + json.dumps(body["cats"], ensure_ascii=False) + ",")
    lines.append('"questions": [')
    lines.append(",\n".join(json.dumps(q, ensure_ascii=False, sort_keys=True) for q in qs))
    lines.append("]};")
    txt = "\n".join(lines) + "\n"
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(txt)
    print("\nwrote %s  (%.1f KB)" % (OUT, len(txt.encode("utf-8")) / 1024.0))


if __name__ == "__main__":
    qs, problems = build()
    if problems:
        print("!! %d PROBLEM(S) -- nothing written" % len(problems))
        for p in problems:
            print("   " + p)
        sys.exit(1)
    report(qs)
    emit(qs)
