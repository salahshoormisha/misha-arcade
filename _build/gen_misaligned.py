#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_misaligned.py — harvester/validator/writer for MISALIGNED (games/misaligned).

Reads the hand-curated banks in this directory:
    mi_bank_spec.py    SPEC   — specification-gaming incidents with 4-way options
    mi_bank_extra.py   BITS   — one-line real incidents (for REAL OR INVENTED)
                       FAKES  — invented incidents, each with its tell
                       BENCH  — machine-vs-human-baseline data points
                       MILE   — dated AI / AI-governance milestones

and writes  core/data/misaligned.js  ->  window.AD_MISALIGNED.

Re-runnable and deterministic: no network, stdlib only, no pip.

WHAT IT ENFORCES (a failure here is a hard stop, not a warning):
  * every SPEC / BITS / BENCH / MILE entry has a non-empty http(s) source URL
  * every year is in [1950, THIS_YEAR + 1]
  * every SPEC entry ends up with >= 3 distinct decoys, none equal to the truth
  * every borrowed decoy names the incident it was borrowed from, and that id exists
  * every FAKES entry has a non-empty `tell`
  * every BENCH entry's `band` matches the numbers in `score` / `human`
  * every MILE date parses, and the precomputed ordering sets are unambiguous
It also prints a table of anything incomplete, and the pool depth arithmetic.

Sources: Victoria Krakovna's specification-gaming examples list (the canonical
public collection, https://tinyurl.com/specification-gaming) plus the primary
paper / blog post / report behind each case, recorded per entry. Nothing ships
without a URL.
"""
import datetime
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "core", "data", "misaligned.js")
THIS_YEAR = 2026

sys.path.insert(0, HERE)
from mi_bank_spec import SPEC                      # noqa: E402
from mi_bank_extra import BITS, FAKES, BENCH, MILE  # noqa: E402

ERR = []
WARN = []


def bad(msg):
    ERR.append(msg)


def warn(msg):
    WARN.append(msg)


def check_url(u, where):
    if not u or not isinstance(u, str):
        return bad("%s: missing source URL" % where)
    if not re.match(r"^https?://\S+$", u):
        return bad("%s: source URL looks wrong: %r" % (where, u))
    if " " in u:
        return bad("%s: whitespace in URL" % where)


def check_year(y, where):
    if not isinstance(y, int):
        return bad("%s: year is not an int: %r" % (where, y))
    if y < 1950 or y > THIS_YEAR + 1:
        return bad("%s: implausible year %r" % (where, y))


# ── SPEC ────────────────────────────────────────────────────────────────────
BY_ID = {}
for s in SPEC:
    if s["id"] in BY_ID:
        bad("duplicate spec id %s" % s["id"])
    BY_ID[s["id"]] = s

FAMS = {}
for s in SPEC:
    FAMS.setdefault(s.get("fam", "misc"), []).append(s)

for s in SPEC:
    w = "spec:" + s["id"]
    for k in ("id", "ctx", "given", "real", "story", "who", "year", "url", "fam"):
        if not s.get(k):
            bad("%s: empty field %s" % (w, k))
    check_url(s.get("url"), w)
    check_year(s.get("year"), w)
    if len(s.get("real", "")) < 40:
        warn("%s: `real` is very short" % w)
    if s.get("real", "").strip()[-1] not in ".!\"'":
        warn("%s: `real` does not end in a full stop" % w)
    for d in s.get("decoys", []):
        if d.strip() == s["real"].strip():
            bad("%s: a hand-written decoy equals the truth" % w)


def borrowables(s):
    """Real outcomes of OTHER incidents in the same family, phrased so they can
    stand in as a wrong answer here. `alt` is that neutral phrasing."""
    out = []
    for o in FAMS.get(s.get("fam", "misc"), []):
        if o["id"] == s["id"]:
            continue
        if o.get("alt"):
            out.append((o["id"], o["alt"]))
    out.sort(key=lambda t: t[0])
    return out


def options_for(s):
    """Build the decoy list: hand-written first, then borrowed real outcomes
    from the same family, in a stable order. Returns (decoys, origins)."""
    ds, orig = [], []
    for d in s.get("decoys", []):
        ds.append(d)
        orig.append("")
    for oid, alt in borrowables(s):
        if len(ds) >= max(3, len(s.get("decoys", []))):
            break
        if alt in ds or alt.strip() == s["real"].strip():
            continue
        ds.append(alt)
        orig.append(oid)
    return ds, orig


SPEC_OUT = []
for s in SPEC:
    ds, orig = options_for(s)
    w = "spec:" + s["id"]
    if len(ds) < 3:
        bad("%s: only %d decoys (need 3) — family %s is too small, "
            "write more by hand or add an `alt`" % (w, len(ds), s.get("fam")))
    seen = set()
    for d in ds + [s["real"]]:
        k = re.sub(r"\W+", " ", d.lower()).strip()
        if k in seen:
            bad("%s: duplicate option text" % w)
        seen.add(k)
    for o in orig:
        if o and o not in BY_ID:
            bad("%s: borrowed decoy names unknown incident %s" % (w, o))
    SPEC_OUT.append(dict(s, decoys=ds, orig=orig))

# ── BITS ────────────────────────────────────────────────────────────────────
for b in BITS:
    w = "bit:" + b.get("id", "?")
    for k in ("id", "txt", "who", "year", "url"):
        if not b.get(k):
            bad("%s: empty field %s" % (w, k))
    check_url(b.get("url"), w)
    check_year(b.get("year"), w)
    if len(b.get("txt", "")) > 260:
        warn("%s: one-liner is %d chars — too long for the round"
             % (w, len(b.get("txt", ""))))

# ── FAKES ───────────────────────────────────────────────────────────────────
for f in FAKES:
    w = "fake:" + f.get("id", "?")
    for k in ("id", "txt", "tell"):
        if not f.get(k):
            bad("%s: empty field %s" % (w, k))
    if len(f.get("txt", "")) > 260:
        warn("%s: one-liner is %d chars" % (w, len(f.get("txt", ""))))
    if f.get("url"):
        check_url(f["url"], w)

# ── BENCH ───────────────────────────────────────────────────────────────────
# band 0 = nowhere near (>20 points below the human baseline)
#      1 = below it, but in the same league (3-20 points below)
#      2 = level pegging (within 3 points either way)
#      3 = above it
for b in BENCH:
    w = "bench:" + b.get("id", "?")
    for k in ("id", "sys", "bench", "year", "score", "human", "story", "url"):
        if b.get(k) in (None, "", []):
            bad("%s: empty field %s" % (w, k))
    check_url(b.get("url"), w)
    check_year(b.get("year"), w)
    if b.get("band") not in (0, 1, 2, 3):
        bad("%s: band must be 0..3" % w)
    sv, hv = b.get("sv"), b.get("hv")
    if not isinstance(sv, (int, float)) or not isinstance(hv, (int, float)):
        bad("%s: sv/hv must be numbers (the comparable figures)" % w)
    else:
        d = sv - hv
        want = 3 if d > 3 else 2 if d >= -3 else 1 if d >= -20 else 0
        if want != b.get("band"):
            bad("%s: band %r disagrees with the numbers (%s vs %s -> %d)"
                % (w, b.get("band"), sv, hv, want))
    # The question screen shows sys, bench, year and the human baseline, above a
    # round strip that reads "ROUND n/5 … <total>/100". If `score` is a substring
    # of any of that, the round answers itself and does not look broken — it
    # looks easy. t_misaligned.js checks the same thing on every draw; catching
    # it here means it never reaches a draw.
    shown = re.sub(r"\s+", " ", " ".join([
        str(b.get("sys", "")), str(b.get("bench", "")), str(b.get("year", "")),
        str(b.get("human", "")),
    ])).strip()
    strip = " ".join("ROUND %d/5 %d/100" % (n, t)
                     for n in range(1, 6) for t in range(0, 101))
    sc = re.sub(r"\s+", " ", str(b.get("score", ""))).strip()
    if sc and (sc in shown or sc in strip):
        bad("%s: `score` is readable off the question screen — reword it" % w)

# ── MILE ────────────────────────────────────────────────────────────────────
def parse_d(s):
    return datetime.date(int(s[0:4]), int(s[5:7]), int(s[8:10]))


for m in MILE:
    w = "mile:" + m.get("id", "?")
    for k in ("id", "lab", "d", "url"):
        if not m.get(k):
            bad("%s: empty field %s" % (w, k))
    check_url(m.get("url"), w)
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", m.get("d", "")):
        bad("%s: date must be YYYY-MM-DD, got %r" % (w, m.get("d")))
        continue
    try:
        parse_d(m["d"])
    except ValueError:
        bad("%s: date does not exist: %s" % (w, m["d"]))
    check_year(int(m["d"][:4]), w)
    if m.get("prec") not in ("day", "month", "year"):
        bad("%s: prec must be day|month|year" % w)
    if len(m.get("lab", "")) > 110:
        warn("%s: label is %d chars — will wrap badly" % (w, len(m["lab"])))

if ERR:
    print("VALIDATION FAILED — nothing written.\n")
    for e in ERR:
        print("  ✗", e)
    print("\n%d error(s), %d warning(s)" % (len(ERR), len(WARN)))
    for x in WARN:
        print("  !", x)
    sys.exit(1)

# ── precompute the ordering sets ─────────────────────────────────────────────
# Four milestones a player has to put in order. A set only ships if every pair
# is far enough apart that the answer is unambiguous at the precision we know
# the dates to — otherwise a "wrong" answer might be our fault, not theirs.
MINGAP = {"day": 45, "month": 70, "year": 400}


def gap_ok(a, b):
    need = max(MINGAP[a["prec"]], MINGAP[b["prec"]])
    return abs((parse_d(a["d"]) - parse_d(b["d"])).days) >= need


def rng(seed):
    """mulberry32, so the sets are reproducible and match nothing by accident."""
    st = [seed & 0xFFFFFFFF]

    def nxt():
        st[0] = (st[0] + 0x6D2B79F5) & 0xFFFFFFFF
        t = st[0]
        t = (t ^ (t >> 15)) * ((t | 1) & 0xFFFFFFFF) & 0xFFFFFFFF
        t = (t ^ (t + ((t ^ (t >> 7)) * ((t | 61) & 0xFFFFFFFF) & 0xFFFFFFFF))) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0
    return nxt


ORDERS = []
seen_sets = set()
r = rng(20260729)
used = [0] * len(MILE)
tries = 0
TARGET = 520
while len(ORDERS) < TARGET and tries < 400000:
    tries += 1
    # Prefer the least-used milestones so the whole bank gets an airing.
    pool = sorted(range(len(MILE)), key=lambda i: (used[i], r()))[:max(8, len(MILE) // 2)]
    pick = []
    for _ in range(4):
        if not pool:
            break
        j = int(r() * len(pool)) % len(pool)
        cand = pool.pop(j)
        if all(gap_ok(MILE[cand], MILE[p]) for p in pick):
            pick.append(cand)
    if len(pick) != 4:
        continue
    key = tuple(sorted(pick))
    if key in seen_sets:
        continue
    seen_sets.add(key)
    for p in pick:
        used[p] += 1
    ORDERS.append(sorted(pick, key=lambda i: MILE[i]["d"]))

if len(ORDERS) < 200:
    print("VALIDATION FAILED: only %d ordering sets could be built from %d "
          "milestones" % (len(ORDERS), len(MILE)))
    sys.exit(1)

# ── write ────────────────────────────────────────────────────────────────────
def js(s):
    if isinstance(s, (int, float)):
        return str(s)
    s = str(s)
    s = s.replace("\\", "\\\\").replace('"', '\\"')
    s = s.replace("\n", " ").replace("\r", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return '"%s"' % s


def arr(xs):
    return "[" + ",".join(js(x) for x in xs) + "]"


L = []
L.append("/* " + "=" * 74)
L.append("   core/data/misaligned.js  ->  window.AD_MISALIGNED")
L.append("   " + "-" * 74)
L.append("   The bank behind MISALIGNED (games/misaligned): documented cases of AI")
L.append("   systems doing exactly what they were told and nothing like what was")
L.append("   wanted, plus dated milestones and machine-vs-human benchmark results.")
L.append("")
L.append("   GENERATED by _build/gen_misaligned.py from _build/mi_bank_spec.py and")
L.append("   _build/mi_bank_extra.py. Do not hand-edit — edit the banks and re-run.")
L.append("")
L.append("   EVERY real entry carries the URL of a primary source (paper, lab blog")
L.append("   post, eval report, or the report of record). The backbone is Victoria")
L.append("   Krakovna's specification-gaming examples list, the canonical public")
L.append("   collection: https://tinyurl.com/specification-gaming")
L.append("   Anything that could not be sourced was dropped rather than guessed.")
L.append("   Entries marked `contested` say so in their own reveal text.")
L.append("")
L.append("   Built %s · %d incidents (%d with full option sets, %d one-liners),"
         % (datetime.date.today().isoformat(), len(SPEC) + len(BITS), len(SPEC), len(BITS)))
L.append("   %d invented decoy incidents, %d benchmark points, %d milestones,"
         % (len(FAKES), len(BENCH), len(MILE)))
L.append("   %d ordering sets." % len(ORDERS))
L.append("   " + "=" * 74 + " */")
L.append("window.AD_MISALIGNED = {")
L.append('  built: "%s",' % datetime.date.today().isoformat())
L.append('  list: "https://tinyurl.com/specification-gaming",')

L.append("  spec: [")
for s in SPEC_OUT:
    L.append("{id:%s,fam:%s,ctx:%s,given:%s,real:%s,decoys:%s,orig:%s,story:%s,who:%s,year:%d,url:%s%s},"
             % (js(s["id"]), js(s["fam"]), js(s["ctx"]), js(s["given"]), js(s["real"]),
                arr(s["decoys"]), arr(s["orig"]), js(s["story"]), js(s["who"]),
                s["year"], js(s["url"]),
                ",contested:1" if s.get("contested") else ""))
L.append("  ],")

L.append("  bits: [")
for b in BITS:
    L.append("{id:%s,txt:%s,who:%s,year:%d,url:%s%s},"
             % (js(b["id"]), js(b["txt"]), js(b["who"]), b["year"], js(b["url"]),
                ",contested:1" if b.get("contested") else ""))
L.append("  ],")

L.append("  fakes: [")
for f in FAKES:
    L.append("{id:%s,txt:%s,tell:%s%s},"
             % (js(f["id"]), js(f["txt"]), js(f["tell"]),
                (",url:" + js(f["url"])) if f.get("url") else ""))
L.append("  ],")

L.append("  bench: [")
for b in BENCH:
    L.append("{id:%s,sys:%s,bench:%s,year:%d,score:%s,human:%s,band:%d,story:%s,url:%s},"
             % (js(b["id"]), js(b["sys"]), js(b["bench"]), b["year"], js(b["score"]),
                js(b["human"]), b["band"], js(b["story"]), js(b["url"])))
L.append("  ],")

L.append("  mile: [")
for m in MILE:
    L.append("{id:%s,lab:%s,d:%s,prec:%s,url:%s%s},"
             % (js(m["id"]), js(m["lab"]), js(m["d"]), js(m["prec"]), js(m["url"]),
                (",note:" + js(m["note"])) if m.get("note") else ""))
L.append("  ],")

L.append("  orders: [")
for o in ORDERS:
    L.append("[%d,%d,%d,%d]," % tuple(o))
L.append("  ]")
L.append("};")

txt = "\n".join(L) + "\n"
with open(OUT, "w") as fh:
    fh.write(txt)

# ── report ───────────────────────────────────────────────────────────────────
hand = sum(len(s.get("decoys", [])) for s in SPEC)
borrowed = sum(1 for s in SPEC_OUT for o in s["orig"] if o)
print("WROTE %s  (%.1f KB)" % (OUT, len(txt) / 1024.0))
print("")
print("  spec incidents        %4d   (%d hand-written decoys, %d borrowed from"
      " other real cases)" % (len(SPEC), hand, borrowed))
print("  one-line incidents    %4d" % len(BITS))
print("  DISTINCT REAL INCIDENTS %4d" % (len(SPEC) + len(BITS)))
print("  invented incidents    %4d" % len(FAKES))
print("  benchmark points      %4d" % len(BENCH))
print("  milestones            %4d   -> %d ordering sets" % (len(MILE), len(ORDERS)))
print("")
print("  families: " + ", ".join("%s=%d" % (k, len(v)) for k, v in sorted(FAMS.items())))
print("")
print("  a day uses 2 spec + 1 order + 1 real-or-invented + 1 benchmark")
print("  -> a spec incident recurs about every %d days" % (len(SPEC) // 2))
print("  -> an invented one every %d days, a benchmark every %d days"
      % (len(FAKES), len(BENCH)))
print("  -> ordering sets last %d days" % len(ORDERS))
print("  -> days before the whole five-round combination could repeat: >%d"
      % min(len(ORDERS), len(FAKES) * len(BENCH)))
if WARN:
    print("")
    print("  %d warning(s):" % len(WARN))
    for x in WARN:
        print("   !", x)
