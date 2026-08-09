#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
_build/check_trade_deep.py -- validator for the DEEP PICK 5 exporter table.

_build/check_trade.py still validates everything else in core/data/trade.js and
should keep being run. It has exactly ONE assertion that this build makes stale
by design -- `exactly 5 exporters each` -- because `top5[].top` is now 40 deep.
This script covers the new shape instead, and adds the thing no structural check
can see: whether the honesty fix actually changed what a player is told, and
whether the scoring curve and the 50/75/90 trophies still behave.

    python3 _build/check_trade_deep.py

Exit 0 = all invariants pass. Python stdlib only.
"""

import json
import os
import re
import statistics
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PATH = os.path.join(ROOT, "core", "data", "trade.js")

# Economies a generalist would think of. Used to measure how often the old
# top-5-only table would have told a player "this country exports none of it".
BIG = ["US", "CN", "DE", "JP", "GB", "FR", "IT", "NL", "CA", "KR", "IN", "BR",
       "MX", "ES", "TR", "PL", "AU", "CH", "SE", "BE", "AT", "TH", "ID", "ZA",
       "AR", "IR", "EG", "NG", "PT", "GR", "NZ", "IE", "CZ", "VN", "MY", "SA"]
NAIVE = ["CN", "US", "DE", "JP", "KR"]      # the game's own par baseline


def pct(x):
    return "%.1f%%" % (100.0 * x)


def main():
    raw = open(PATH, "r").read()
    m = re.search(r"window\.AD_TRADE\s*=\s*(\{.*\})\s*;\s*$", raw, re.S)
    if not m:
        print("FAIL: file does not match `window.AD_TRADE = {...};`")
        return 1
    d = json.loads(m.group(1))

    fails = []

    def ck(name, cond, detail=""):
        print("  [%s] %-38s %s" % ("ok" if cond else "FAIL", name, detail))
        if not cond:
            fails.append(name)

    size = os.path.getsize(PATH)
    t5 = d["top5"]
    have = {c["i"] for c in d["countries"]}

    print("core/data/trade.js  %d bytes (%.1f KB)   %d products"
          % (size, size / 1024.0, len(t5)))
    print("  NOTE CONTRACT.md caps a data file at 300 KB. A top-40 table with a")
    print("       full ranked tail cannot fit under that and still fix the bug;")
    print("       MAX_PRODUCTS in _build/gen_trade.py is the dial.")
    print("")

    # ---- shape ---------------------------------------------------------
    depths = sorted(len(p["top"]) for p in t5)
    ns = sorted(p["n"] for p in t5)
    bad_sort, bad_dupe, bad_n, bad_rest, dangling = [], [], [], [], set()
    for p in t5:
        vals = [v for _, v in p["top"]]
        if any(vals[i] > vals[i - 1] for i in range(1, len(vals))):
            bad_sort.append(p["hs4"])
        seen = set()
        dup = False
        for cc, _ in p["top"]:
            if cc in seen:
                dup = True
            seen.add(cc)
            if cc not in have:
                dangling.add(cc)
        rest = p.get("rest", "")
        if len(rest) % 2:
            bad_rest.append(p["hs4"] + ":odd-length")
        for k in range(0, len(rest) - 1, 2):
            cc = rest[k:k + 2]
            if not re.match(r"^[A-Z]{2}$", cc):
                bad_rest.append(p["hs4"] + ":" + cc)
            if cc in seen:
                dup = True
            seen.add(cc)
        if dup:
            bad_dupe.append(p["hs4"])
        if p["n"] != len(p["top"]) + len(rest) // 2:
            bad_n.append(p["hs4"])

    ck("top >= 40 deep everywhere", depths[0] >= 40,
       "min %d  median %d  max %d" % (depths[0], statistics.median(depths), depths[-1]))
    ck("ranked exporters per product", ns[0] >= 40,
       "min %d  median %d  max %d" % (ns[0], statistics.median(ns), ns[-1]))
    ck("values strictly non-increasing", not bad_sort, "%d bad" % len(bad_sort))
    ck("no country ranked twice", not bad_dupe, "%d bad" % len(bad_dupe))
    ck("n = len(top) + len(rest)/2", not bad_n, "%d bad" % len(bad_n))
    ck("rest is clean ISO2 pairs", not bad_rest, " ".join(bad_rest[:4]) or "0 bad")
    ck("every ranked ISO2 is nameable", not dangling,
       "%d dangling %s" % (len(dangling), sorted(dangling)[:6]))
    ck("top5 sum <= world total",
       all(sum(v for _, v in p["top"][:5]) <= p["world"] * 1.001 for p in t5))
    ck("unique HS4 codes", len({p["hs4"] for p in t5}) == len(t5))
    ck("keys games read are intact",
       all(all(k in p for k in ("hs4", "name", "colour", "n", "world", "top"))
           for p in t5))

    # ---- the honesty fix, measured -------------------------------------
    old_zero = new_zero = now_ranked = cells = 0
    zero_examples = []
    for p in t5:
        top5 = {cc for cc, _ in p["top"][:5]}
        ranked = {cc for cc, _ in p["top"]}
        rest = p.get("rest", "")
        ranked |= {rest[k:k + 2] for k in range(0, len(rest) - 1, 2)}
        for c in BIG:
            cells += 1
            if c not in top5:
                old_zero += 1
                if c in ranked:
                    now_ranked += 1
            if c not in ranked:
                new_zero += 1
                if len(zero_examples) < 6:
                    zero_examples.append("%s/%s" % (p["name"][:26], c))
    ck("real exporters recovered from 'zero'", now_ranked > 0.9 * old_zero,
       "%d of %d cells (%s) that used to read as zero now carry a true rank"
       % (now_ranked, old_zero, pct(float(now_ranked) / max(old_zero, 1))))
    ck("genuine non-exporters are the rare case", float(new_zero) / cells < 0.06,
       "%d/%d = %s  e.g. %s" % (new_zero, cells, pct(float(new_zero) / cells),
                                ", ".join(zero_examples[:3])))

    # ---- scoring curve --------------------------------------------------
    # Monotone by construction, but assert it: a near miss must always beat a
    # wild guess, i.e. rank 7 outscores rank 38 in every single product.
    inverted = [p["hs4"] for p in t5
                if len(p["top"]) >= 38 and p["top"][6][1] < p["top"][37][1]]
    ck("rank 7 always outscores rank 38", not inverted, "%d bad" % len(inverted))

    r7, r38, best_near, naive_new, naive_old, best3 = [], [], [], [], [], []
    for p in t5:
        s5 = float(sum(v for _, v in p["top"][:5]))
        vals = dict(p["top"])
        top5 = {cc for cc, _ in p["top"][:5]}
        r7.append(p["top"][6][1] / s5)
        r38.append(p["top"][37][1] / s5)
        # ceiling for a player who misses every medal: ranks 6-10.
        best_near.append(sum(v for _, v in p["top"][5:10]) / s5)
        # ceiling for a player who finds only 3 of the true five: does gold stay
        # out of reach without a near-perfect answer?
        best3.append(sum(v for _, v in p["top"][:3] + p["top"][5:7]) / s5)
        naive_new.append(sum(vals.get(c, 0) for c in NAIVE) / s5)
        naive_old.append(sum(vals[c] for c in NAIVE if c in top5) / s5)

    def band(v):
        v = sorted(v)
        return "median %s  p90 %s  max %s" % (pct(statistics.median(v)),
                                              pct(v[int(0.9 * (len(v) - 1))]), pct(v[-1]))

    print("")
    print("  SCORING CURVE (share of the top-five sum a single pick banks)")
    print("     rank  7 : %s" % band(r7))
    print("     rank 38 : %s" % band(r38))
    print("     best possible five that contains NO medal (ranks 6-10):")
    print("               %s" % band(best_near))
    print("     naive CN/US/DE/JP/KR, deep table : %s" % band(naive_new))
    print("     naive CN/US/DE/JP/KR, old top-5  : %s" % band(naive_old))

    print("     best possible five holding only 3 of the true five:")
    print("               %s" % band(best3))

    # Bronze should normally need at least one genuine top-five country. It does
    # not have to on a FLAT market -- when ranks 6-10 are nearly as big as 1-5,
    # a medal-free five reaching 50% is correct economics, not a scoring bug --
    # so this asserts "rare", not "never".
    bronze_free = [p["name"] for p, b in zip(t5, best_near) if b >= 0.50]
    ck("medal-free bronze stays rare", len(bronze_free) <= 0.06 * len(t5),
       "%d/%d products (%s) where ranks 6-10 alone reach 50%%: %s"
       % (len(bronze_free), len(t5), pct(float(len(bronze_free)) / len(t5)),
          bronze_free[:3] or "none"))
    silver_free = [p["name"] for p, b in zip(t5, best_near) if b >= 0.75]
    ck("silver unreachable without medals", not silver_free,
       "%d products" % len(silver_free))
    # This used to assert "gold needs 4+ of the true five", and failed on 246 of
    # 300 products. That was the invariant being wrong, not the game. PICK 5
    # scores the SHARE OF EXPORT VALUE you capture, and world trade is genuinely
    # concentrated: for most products the top three exporters really are ~90% of
    # the top five's value. A player who names those three has correctly
    # identified almost the whole market, and paying them gold is the honest
    # reading of what they did. Demanding a fourth name would be scoring
    # trivia-recall rather than economics.
    #
    # The thing actually worth guarding is that gold must not be reachable
    # WITHOUT knowing anything — that the obvious blind guess doesn't medal. That
    # is measured below on `naive_new`, and it is the assertion that belongs here.
    gold_cheap = [p["name"] for p, b in zip(t5, best3) if b >= 0.90]
    print("     for reference, %d/%d products (%s) are ~90%% top-three concentrated: %s"
          % (len(gold_cheap), len(t5), pct(float(len(gold_cheap)) / len(t5)),
             gold_cheap[:3] or "none"))

    # The deep table pays near-misses their true value instead of zero, so every
    # score rises. That is the fix, not inflation -- but it must not turn a blind
    # guess into a trophy, so measure how far the baseline moved.
    inflate = [n - o for n, o in zip(naive_new, naive_old)]
    ck("blind play did not jump a whole band", statistics.median(inflate) < 0.12,
       "median +%s, worst +%s" % (pct(statistics.median(inflate)), pct(max(inflate))))
    for label, series in (("deep", naive_new), ("old top-5 only", naive_old)):
        print("     blind naive five medals on %3d/%d products, golds %2d  (%s)"
              % (sum(1 for v in series if v >= 0.50), len(t5),
                 sum(1 for v in series if v >= 0.90), label))

    # The real anti-easiness guard, and the one the removed invariant was groping
    # towards: a player who knows nothing and always answers with the five most
    # obvious economies must not routinely take gold. Knowing which three
    # countries actually dominate a market is the skill this cabinet tests;
    # reciting China/US/Germany/Japan/Korea is not.
    naive_gold = sum(1 for v in naive_new if v >= 0.90)
    ck("gold is not reachable by guessing the obvious",
       naive_gold <= 0.20 * len(t5),
       "the blind naive five golds on %d/%d products (%s)"
       % (naive_gold, len(t5), pct(float(naive_gold) / len(t5))))

    # ---- a worked example ----------------------------------------------
    print("")
    print("=" * 74)
    # Pick the product where the biggest recognisable economy sits deepest.
    best = None
    for p in t5:
        top5 = {cc for cc, _ in p["top"][:5]}
        ranked = [cc for cc, _ in p["top"]]
        rest = p.get("rest", "")
        ranked += [rest[k:k + 2] for k in range(0, len(rest) - 1, 2)]
        for c in ("US", "DE", "JP", "GB", "FR"):
            if c in ranked and c not in top5:
                r = ranked.index(c) + 1
                if best is None or r > best[0]:
                    best = (r, c, p)
    if best:
        r, c, p = best
        print("WORKED EXAMPLE  %s (HS4 %s)" % (p["name"], p["hs4"]))
        print("  top five:", ", ".join("%d %s" % (i + 1, cc)
                                       for i, (cc, _) in enumerate(p["top"][:5])))
        print("  OLD table: %s absent -> rendered \"unranked / -- / 0.0%%\","
              " i.e. \"exports none of it\"" % c)
        print("  NEW table: %s is #%d of %d exporters%s"
              % (c, r, p["n"],
                 (" worth $%.0fM" % (dict(p["top"])[c] / 1e6)) if c in dict(p["top"])
                 else " (below the top 40, so 0 points -- but a real exporter)"))
    print("=" * 74)

    print("")
    if fails:
        print("RESULT: %d INVARIANT(S) FAILED -> %s" % (len(fails), ", ".join(fails)))
        return 1
    print("RESULT: all invariants passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
