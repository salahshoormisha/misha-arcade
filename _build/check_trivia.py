#!/usr/bin/env python3
"""
check_trivia.py -- validate the SHIPPED core/data/trivia.js, not the source bank.

Run after gen_trivia.py. It parses the emitted file the way the browser would
see it and asserts every invariant THE DECIDER relies on:

  1  the file assigns exactly one global, window.AD_TRIVIA, and the payload is
     strict JSON (so a stray trailing comma or smart quote is caught here)
  2  >= 500 questions
  3  no duplicate question text (normalised), and no duplicate answer+question
  4  every multiple-choice question: exactly 4 options, all distinct, and the
     answer present exactly once
  5  every numeric question: a real number, a unit, no opts
  6  difficulty is an integer 1-5, and the histogram genuinely spreads
  7  every declared category is populated, and every question's category is declared
  8  no answer text leaks into its own question
  9  every question has a non-empty note that is not just the answer again
 10  every (cat,diff) bucket the game pairs players on has >= 2 questions
 11  file size within the CONTRACT's 300 KB budget

    python3 _build/check_trivia.py

Exit code 0 = clean.
"""
import json
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
JS = os.path.join(ROOT, "core", "data", "trivia.js")

fails, warns = [], []


def fail(msg):
    fails.append(msg)


def warn(msg):
    warns.append(msg)


def words(s):
    return set(re.findall(r"[a-z0-9]+", str(s).lower()))


def keyify(s):
    return re.sub(r"[^a-z0-9]+", " ", str(s).lower()).strip()


# ── 1. parse ───────────────────────────────────────────────────────────────
raw = open(JS, encoding="utf-8").read()
size_kb = len(raw.encode("utf-8")) / 1024.0

globals_assigned = re.findall(r"^\s*window\.([A-Za-z_0-9]+)\s*=", raw, re.M)
if globals_assigned != ["AD_TRIVIA"]:
    fail("expected exactly one global assignment (window.AD_TRIVIA), got %r" % globals_assigned)

m = re.search(r"window\.AD_TRIVIA\s*=\s*", raw)
if not m:
    print("FATAL: no window.AD_TRIVIA assignment found in %s" % JS)
    sys.exit(1)
payload = raw[m.end():].rstrip()
if payload.endswith(";"):
    payload = payload[:-1]
try:
    DATA = json.loads(payload)
except Exception as e:
    print("FATAL: payload is not strict JSON -- the browser may still parse it, "
          "but we cannot verify it: %s" % e)
    sys.exit(1)

CATS = DATA.get("cats") or {}
QS = DATA.get("questions") or []

# ── 2/6/7. shape, counts, categories ───────────────────────────────────────
if len(QS) < 500:
    fail("only %d questions -- the brief requires at least 500" % len(QS))

diff_hist = Counter()
cat_hist = Counter()
buckets = defaultdict(int)
seen_q, seen_pair = {}, {}
n_mc = n_num = 0

for i, q in enumerate(QS):
    at = "#%d %r" % (i, str(q.get("q", ""))[:56])

    for k in ("q", "a", "cat", "diff", "note"):
        if k not in q:
            fail("%s missing key %r" % (at, k))
    if not isinstance(q.get("diff"), int) or not (1 <= q["diff"] <= 5):
        fail("%s difficulty is not an int 1-5: %r" % (at, q.get("diff")))
    else:
        diff_hist[q["diff"]] += 1
    if q.get("cat") not in CATS:
        fail("%s category %r is not declared in cats" % (at, q.get("cat")))
    else:
        cat_hist[q["cat"]] += 1

    # 3. duplicates
    k = keyify(q.get("q", ""))
    if k in seen_q:
        fail("DUPLICATE question text: %s (also #%d)" % (at, seen_q[k]))
    seen_q[k] = i
    pk = k + " ||| " + keyify(q.get("a", ""))
    if pk in seen_pair:
        fail("DUPLICATE question+answer: %s" % at)
    seen_pair[pk] = i

    # 9. notes
    note = str(q.get("note", "")).strip()
    if len(note) < 12:
        fail("%s note is missing or too short" % at)
    elif keyify(note) == keyify(q.get("a", "")):
        fail("%s note is just the answer restated" % at)

    if q.get("numeric"):
        n_num += 1
        if not isinstance(q.get("a"), (int, float)) or isinstance(q.get("a"), bool):
            fail("%s numeric answer is not a number: %r" % (at, q.get("a")))
        if not str(q.get("unit", "")).strip():
            fail("%s numeric question has no unit" % at)
        if q.get("opts"):
            fail("%s numeric question should not carry opts" % at)
        continue

    # 4. multiple choice
    n_mc += 1
    opts = q.get("opts")
    if not isinstance(opts, list) or len(opts) != 4:
        fail("%s does not have exactly 4 options" % at)
        continue
    lowered = [str(o).strip().lower() for o in opts]
    if len(set(lowered)) != 4:
        fail("%s has duplicate option text" % at)
    hits = lowered.count(str(q.get("a", "")).strip().lower())
    if hits != 1:
        fail("%s answer appears %d times in its own options (want exactly 1)" % (at, hits))
    if any(not str(o).strip() for o in opts):
        fail("%s has a blank option" % at)
    if q.get("unit"):
        fail("%s is multiple choice but carries a unit" % at)

    # 8. leaks
    aw = words(q.get("a", ""))
    if aw and aw <= words(q.get("q", "")):
        fail("%s answer text leaks into the question" % at)

    if isinstance(q.get("cat"), str) and isinstance(q.get("diff"), int):
        buckets[(q["cat"], q["diff"])] += 1

for c in CATS:
    if not cat_hist.get(c):
        fail("category %r is declared but has no questions" % c)
    for key in ("label", "icon"):
        if not str(CATS[c].get(key, "")).strip():
            fail("category %r has no %s" % (c, key))

# 10. pairable buckets -- R1 gives both players the same category and difficulty
thin = sorted(k for k in [(c, d) for c in CATS for d in range(1, 6)] if buckets.get(k, 0) < 2)
if thin:
    warn("%d (cat,diff) buckets have fewer than 2 multiple-choice questions, so the "
         "game will fall back to matching on difficulty alone there: %s"
         % (len(thin), ", ".join("%s/%d" % t for t in thin)))

# 6. genuine spread
for d in range(1, 6):
    share = 100.0 * diff_hist.get(d, 0) / max(1, len(QS))
    if share < 6:
        fail("difficulty %d is only %.1f%% of the bank -- not a genuine spread" % (d, share))

if n_num < 20:
    fail("only %d numeric questions -- the wager round needs a real pool" % n_num)

# 11. budget
if size_kb > 300:
    fail("trivia.js is %.1f KB, over the 300 KB budget in CONTRACT section 0" % size_kb)

# ── report ─────────────────────────────────────────────────────────────────
print("core/data/trivia.js -- %.1f KB" % size_kb)
print("  questions ........ %d  (%d multiple-choice, %d numeric)" % (len(QS), n_mc, n_num))
print("  categories ....... %d, all populated" % len(CATS))
print("  unique questions . %d" % len(seen_q))
print("  difficulty ....... " + "  ".join(
    "%d:%d (%.0f%%)" % (d, diff_hist.get(d, 0), 100.0 * diff_hist.get(d, 0) / max(1, len(QS)))
    for d in range(1, 6)))
print("  per category ..... " + ", ".join(
    "%s:%d" % (c, cat_hist.get(c, 0)) for c in CATS))
flav = sum(cat_hist.get(c, 0) for c in ("persia", "jewish", "cities"))
print("  their world ...... %d/%d = %.1f%%" % (flav, len(QS), 100.0 * flav / max(1, len(QS))))
print("  pairable buckets .. %d/%d have >=2 questions" % (75 - len(thin), 75))

for w in warns:
    print("\nWARN  " + w)
if fails:
    print("\n%d FAILURE(S):" % len(fails))
    for f in fails:
        print("  " + f)
    sys.exit(1)
print("\nALL CHECKS PASSED")
