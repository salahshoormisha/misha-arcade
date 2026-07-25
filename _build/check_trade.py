#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
_build/check_trade.py -- independent validator for core/data/trade.js

Re-parses the SHIPPED file (not the in-memory build) exactly the way a browser
would see it: strip the leading comment, require `window.AD_TRADE = <json>;`,
and json.loads the payload. Then asserts every invariant the assignment and
CONTRACT.md §6 ask for, and prints Iran's and the UK's full records.

    python3 _build/check_trade.py
"""

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PATH = os.path.join(ROOT, "core", "data", "trade.js")

MUST_HAVE = ["IR", "GB", "US", "TJ",
             "AR", "AU", "BR", "CA", "CN", "FR", "DE", "IN", "ID",
             "IT", "JP", "KR", "MX", "RU", "SA", "ZA", "TR"]
G20_NOTE = "G20 = 19 member states (EU + AU are blocs, not countries)"


def money(v):
    a = abs(v)
    if a >= 1e12:
        return "$%.2fT" % (v / 1e12)
    if a >= 1e9:
        return "$%.2fB" % (v / 1e9)
    if a >= 1e6:
        return "$%.1fM" % (v / 1e6)
    return "$%d" % v


def main():
    raw = open(PATH, "r").read()
    m = re.search(r"window\.AD_TRADE\s*=\s*(\{.*\})\s*;\s*$", raw, re.S)
    if not m:
        print("FAIL: file does not match `window.AD_TRADE = {...};`")
        return 1
    d = json.loads(m.group(1))          # STRICT json -- proves the payload parses

    fails, warns = [], []

    def ck(name, cond, detail=""):
        print("  [%s] %-34s %s" % ("ok" if cond else "FAIL", name, detail))
        if not cond:
            fails.append(name)

    size = os.path.getsize(PATH)
    print("core/data/trade.js  %d bytes (%.1f KB)" % (size, size / 1024.0))
    print("  year %s   cube %s" % (d.get("year"), d.get("cube")))
    print("")

    cs = d["countries"]
    have = {c["i"] for c in cs}

    # ---- structure -----------------------------------------------------
    ck("file under 300 KB", size <= 300 * 1024, "%.1f KB" % (size / 1024.0))
    ck("year recorded", isinstance(d.get("year"), int), str(d.get("year")))
    ck("source recorded", bool(d.get("source")), (d.get("source") or "")[:52] + "...")
    ck("countries >= 100", len(cs) >= 100, "%d countries" % len(cs))
    ck("unique ISO2 keys", len(have) == len(cs), "%d unique" % len(have))

    # ---- items ---------------------------------------------------------
    bad_items, over, under8, badshare, badcolour = [], [], [], [], []
    secs = d["sections"]
    for c in cs:
        it = c["items"]
        named = [x for x in it if x["name"] != "Other"]
        if len(named) < 8:
            under8.append((c["i"], len(named)))
        s = sum(x["share"] for x in it)
        if s > 1.02:
            over.append((c["i"], round(s, 4)))
        if abs(s - 1.0) > 0.02:
            badshare.append((c["i"], round(s, 4)))
        for x in it:
            if not all(k in x for k in ("name", "hs", "share", "colour")):
                bad_items.append(c["i"])
            if x["colour"] not in secs:
                badcolour.append((c["i"], x["colour"]))
            if x["share"] < 0:
                bad_items.append(c["i"])
        if not c.get("hint") or "\n" in c["hint"]:
            bad_items.append(c["i"] + ":hint")

    ck(">= 8 named items each", not under8, "worst: %s" % (under8[:4] or "none"))
    ck("shares sum <= 1.02", not over, "%d over: %s" % (len(over), over[:6]))
    ck("shares sum ~= 1.00", not badshare, "%d off: %s" % (len(badshare), badshare[:4]))
    ck("item schema + hint", not bad_items, "%d bad" % len(bad_items))
    ck("colour keys resolve", not badcolour, "%d unknown" % len(badcolour))
    ck("sections legend = 21+Other", len(secs) == 22, "%d keys" % len(secs))

    # ---- required countries -------------------------------------------
    miss = [x for x in MUST_HAVE if x not in have]
    ck("Iran/UK/USA/Tajikistan+G20", not miss, (", ".join(miss) if miss
                                                else "all %d present (%s)"
                                                % (len(MUST_HAVE), G20_NOTE)))

    # ---- top5 ----------------------------------------------------------
    t5 = d["top5"]
    bad5 = [p["hs4"] for p in t5 if len(p["top"]) != 5]
    unsorted5 = [p["hs4"] for p in t5
                 if any(p["top"][i][1] < p["top"][i + 1][1] for i in range(4))]
    nsmall = [p["hs4"] for p in t5 if p["n"] < 5]
    unknown = [p["hs4"] for p in t5 for cc, _ in p["top"] if cc not in have]
    dupe = [p["hs4"] for p in t5 if len({cc for cc, _ in p["top"]}) != 5]
    ck("top5 products >= 100", len(t5) >= 100, "%d products" % len(t5))
    ck("exactly 5 exporters each", not bad5, "%d bad" % len(bad5))
    ck("ranked descending", not unsorted5, "%d bad" % len(unsorted5))
    ck("no duplicate exporters", not dupe, "%d bad" % len(dupe))
    ck("exporter-list length n", not nsmall,
       "n ranges %d..%d" % (min(p["n"] for p in t5), max(p["n"] for p in t5)))
    ck("top5 ISO2 in countries[]", not unknown, "%d dangling" % len(set(unknown)))
    ck("unique HS4 codes", len({p["hs4"] for p in t5}) == len(t5), "%d unique"
       % len({p["hs4"] for p in t5}))

    # top5 must never exceed world trade for that product
    overworld = [p["hs4"] for p in t5 if sum(v for _, v in p["top"]) > p["world"] * 1.001]
    ck("top5 sum <= world total", not overworld, "%d bad" % len(overworld))

    # ---- rca -----------------------------------------------------------
    rca = d["rca"]
    short = [k for k, v in rca.items() if len(v) < 6]
    orphan = [k for k in rca if k not in have]
    unsorted_r = [k for k, v in rca.items()
                  if any(v[i]["rca"] < v[i + 1]["rca"] for i in range(len(v) - 1))]
    badrca = [k for k, v in rca.items()
              if any(("name" not in x or "rca" not in x or x["rca"] <= 0)
                     for x in v)]
    # RCA > 1 is the definition of a revealed comparative advantage; a country's
    # single most distinctive export failing that would mean the maths is wrong.
    noadv = [k for k, v in rca.items() if v[0]["rca"] <= 1.0]
    ck("rca countries >= 100", len(rca) >= 100, "%d countries" % len(rca))
    ck("rca >= 6 products each", not short, "%d short" % len(short))
    ck("rca RCA-descending", not unsorted_r, "%d bad" % len(unsorted_r))
    ck("rca entries well-formed", not badrca, "%d bad" % len(badrca))
    ck("every top RCA > 1.0", not noadv, "%d bad" % len(noadv))
    ck("rca keys in countries[]", not orphan, "%d orphan" % len(orphan))
    covered = [x for x in MUST_HAVE if x in rca]
    ck("rca covers required set", len(covered) == len(MUST_HAVE),
       "%d/%d" % (len(covered), len(MUST_HAVE)))

    # Connectrade playability: can we build a 4-country board where all 16
    # products are distinct after the "first country keeps it" rule?
    # Deterministic random sample across the WHOLE country set, not the first N
    # alphabetically -- the collisions live between similar economies.
    import random
    ks = sorted(rca)
    tries = 20000

    def board_rate(order):
        rnd_ = random.Random(20260725)
        ok, bad = 0, []
        for _ in range(tries):
            combo = order(rnd_.sample(ks, 4))
            used, good = set(), True
            for cc in combo:
                picks = [p["name"] for p in rca[cc] if p["name"] not in used][:4]
                if len(picks) < 4:
                    good = False
                    break
                used.update(picks)
            if good:
                ok += 1
            elif len(bad) < 3:
                bad.append("/".join(combo))
        return ok, bad

    raw_ok, _ = board_rate(lambda c: c)
    thin_ok, thin_bad = board_rate(lambda c: sorted(c, key=lambda k: len(rca[k])))
    # A board generator is expected to validate and redraw; what must hold is
    # that redraws are rare enough to be invisible.
    ck("connectrade boards solvable", thin_ok >= tries * 0.999,
       "%.3f%% thinnest-first (%.2f%% in draw order) of %d boards; residue %s"
       % (100.0 * thin_ok / tries, 100.0 * raw_ok / tries, tries,
          thin_bad[0] if thin_bad else "none"))
    # Every country must be usable in SOME board, else it is dead weight.
    dead = [k for k in ks if len({p["name"] for p in rca[k]}) < 4]
    ck("every rca country usable", not dead, "%d dead" % len(dead))

    # ---- pick-5 scoreability -------------------------------------------
    conc = sorted((sum(v for _, v in p["top"]) / max(p["world"], 1), p["name"])
                  for p in t5)
    print("")
    print("  PICK 5 spread (top-5 share of world trade for that product):")
    print("     flattest: %s %.0f%%   |   %s %.0f%%"
          % (conc[0][1], conc[0][0] * 100, conc[1][1], conc[1][0] * 100))
    print("     tightest: %s %.0f%%   |   %s %.0f%%"
          % (conc[-1][1], conc[-1][0] * 100, conc[-2][1], conc[-2][0] * 100))

    # ---- the two records the brief asks to print ------------------------
    byi = {c["i"]: c for c in cs}
    for iso in ("IR", "GB"):
        c = byi.get(iso)
        print("")
        print("=" * 78)
        print("%s  total exports %s   (%s, %s)" % (iso, money(c["total"]),
                                                   d["year"], d["cube"]))
        print("  hint: %s" % c["hint"])
        print("  items:")
        for x in c["items"]:
            print("    %-52s hs%-3s %6.2f%%  %s"
                  % (x["name"][:52], x["hs"], 100 * x["share"],
                     secs[x["colour"]]["name"]))
        print("  sum of shares: %.4f" % sum(x["share"] for x in c["items"]))
        if c.get("cov") is not None:
            print("  cov:  %.2f  (basket / World Bank merchandise exports)" % c["cov"])
        if c.get("note"):
            print("  NOTE: %s" % c["note"])
        print("  rca (top exports by revealed comparative advantage):")
        for x in rca.get(iso, []):
            print("    %-52s RCA %7.1f x world-average share"
                  % (x["name"][:52], x["rca"]))
        appears = [(p["name"], [cc for cc, _ in p["top"]].index(iso) + 1)
                   for p in t5 if iso in [cc for cc, _ in p["top"]]]
        print("  appears in top5 of %d sampled products%s"
              % (len(appears), (": " + ", ".join("%s #%d" % a for a in appears[:6]))
                 if appears else ""))
    print("=" * 78)

    print("")
    if fails:
        print("RESULT: %d INVARIANT(S) FAILED -> %s" % (len(fails), ", ".join(fails)))
        return 1
    print("RESULT: all invariants passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
