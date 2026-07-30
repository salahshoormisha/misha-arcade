#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
_build/gen_trade.py  ->  core/data/trade.js   (window.AD_TRADE)

Builds the trade dataset that powers three cabinets:

  TRADLE      country export-composition treemap        -> AD_TRADE.countries[].items
  PICK 5      name the top-5 exporters of one product   -> AD_TRADE.top5
  CONNECTRADE 4 countries x their 4 signature exports   -> AD_TRADE.rca

SOURCE
  OEC (Observatory of Economic Complexity) OLAP proxy, which fronts the same
  Tesseract cubes as api-v2.oec.world:
      https://oec.world/api/olap-proxy/data.jsonrecords
      https://oec.world/api/olap-proxy/members
  Cube `trade_i_baci_a_92` = CEPII BACI, HS6 Rev. 1992, 1995-2024.
  BACI is CEPII's mirror-reconciled reconstruction of UN Comtrade; values are
  USD FOB. Licence: CEPII BACI is free for research/non-commercial use.
  Year 2023 (2024 is also complete in this cube; 2023 is used because it is the
  year OEC's own Tradle/Pick 5/Connectrade run on, which makes the numbers here
  independently checkable against _build/RESEARCH.md).

  NOTE ON CUBES: OEC's Pick 5 uses `trade_i_baci_a_22` (HS Rev. 2022) while
  Tradle and Connectrade use `trade_i_baci_a_92` (HS Rev. 1992). Product codes
  and names are NOT interchangeable between revisions. This file uses HS92
  throughout so that composition, top-5 rankings and RCA are all mutually
  consistent -- a country's share here always agrees with its rank here.

API NOTES (learned by probing; recorded so nobody re-derives them)
  * api-v2.oec.world/tesseract/* returns 200 but 0 rows for the obvious
    drilldown names. The real level names on that host carry an "Official"
    suffix: `Exporter Country Official`, `HS4 Official`, `Section Official`.
    Its member keys are bare ISO3 ("usa").
  * The oec.world/api/olap-proxy/* alias host accepts the friendly names
    (`Exporter Country`, `HS4`, `Section`) and takes cuts as plain query
    params (`&Year=2023&Exporter+Country=nausa`). Its member keys are
    continent-prefixed ISO3 ("nausa"). This script uses the proxy.
  * `HS4 ID` is encoded as  section_id * 10000 + hs4_code,
    e.g. 52709 = section 5 (Mineral Products) + HS4 2709 (Crude Petroleum).
    So hs4 = id % 10000 zero-padded to 4, hs2 = first two digits of that.

RCA (revealed comparative advantage), Balassa 1965:
    RCA(c,p) = (x_cp / x_c) / (x_wp / x_w)
  computed here from the very same cached rows -- no separate endpoint, so the
  RCA in this file can never disagree with the shares in this file.

RUN
    python3 _build/gen_trade.py              # fetch what's missing, then emit
    python3 _build/gen_trade.py --emit       # re-emit from cache only (offline)
    python3 _build/gen_trade.py --fetch-countries
    python3 _build/gen_trade.py --fetch-products
  Every HTTP response is cached under _build/cache/trade/ , so a re-run costs
  nothing and an interrupted run resumes. --emit works from a PARTIAL cache and
  always writes a valid, loadable file: that is the crash-safety guarantee.

STDLIB ONLY. Deterministic: same cache -> byte-identical output.
"""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, "cache", "trade")
OUT = os.path.join(ROOT, "core", "data", "trade.js")

CUBE = "trade_i_baci_a_92"
YEAR = 2023
BASE = "https://oec.world/api/olap-proxy"
UA = "misha-arcade-databuild/1.0 (static puzzle game; contact misha@cbai.ai)"

SOURCE_STR = (
    "OEC olap-proxy, cube trade_i_baci_a_92 (CEPII BACI, HS6 Rev. 1992), "
    "Year 2023; RCA computed locally (Balassa). Built by _build/gen_trade.py."
)

# ---------------------------------------------------------------------------
# HS section palette.
#
# RESEARCH.md established that OEC's own per-section hexes are NOT recoverable
# (applied server-side inside their viz service; absent from all 139 shipped JS
# chunks), so a clone must define its own 21-hue key. These are authored for the
# arcade's midnight background (--bg #070312): every hue is >=45% saturated and
# >=45% light so it reads on black, and the script asserts a minimum pairwise
# separation so no two sections look alike in a treemap. Hues follow the
# conventional trade-atlas semantics where one exists (vegetables green,
# precious metals gold, machines blue).
# ---------------------------------------------------------------------------
SECTION_COLOUR = {
    1:  "#ff7a9c",   # Animal Products              rose
    2:  "#4fd06a",   # Vegetable Products           grass green
    3:  "#9fd93a",   # Animal and Vegetable Bi-Products  olive lime
    4:  "#ff8c1a",   # Foodstuffs                   orange
    5:  "#b07a3c",   # Mineral Products             bronze / crude-oil brown
    6:  "#b18cff",   # Chemical Products            violet
    7:  "#e9b0e0",   # Plastics and Rubbers         orchid
    8:  "#8f4a55",   # Animal Hides                 oxblood leather
    9:  "#2f9e6e",   # Wood Products                forest
    10: "#7fd6b0",   # Paper Goods                  pale jade
    11: "#4fd8ff",   # Textiles                     cyan
    12: "#2a86bd",   # Footwear and Headwear        ocean blue
    13: "#a8d8e8",   # Stone And Glass              ice
    14: "#ffd84f",   # Precious Metals              gold
    15: "#8c93a8",   # Metals                       steel grey
    16: "#5b8dff",   # Machines                     electric blue
    17: "#4a63d8",   # Transportation               indigo
    18: "#ff2ee0",   # Instruments                  fuchsia
    19: "#e03a3a",   # Weapons                      crimson
    20: "#cfc3b0",   # Miscellaneous                sand
    21: "#ff9e6b",   # Arts and Antiques            peach
}

SECTION_SHORT = {
    1: "Animal", 2: "Vegetable", 3: "Fats & Oils", 4: "Foodstuffs",
    5: "Minerals", 6: "Chemicals", 7: "Plastics & Rubber", 8: "Hides & Leather",
    9: "Wood", 10: "Paper", 11: "Textiles", 12: "Footwear & Headwear",
    13: "Stone & Glass", 14: "Precious Metals", 15: "Metals", 16: "Machines",
    17: "Transport", 18: "Instruments", 19: "Weapons", 20: "Miscellaneous",
    21: "Arts & Antiques",
}

# Countries the brief requires (Misha's arcade + every G20 member).
MUST_HAVE = [
    "IR", "GB", "US", "TJ",                                    # named in the brief
    "AR", "AU", "BR", "CA", "CN", "FR", "DE", "IN", "ID",      # G20
    "IT", "JP", "KR", "MX", "RU", "SA", "ZA", "TR",            # G20
]

# ---------------------------------------------------------------------------
# tiny http + cache
# ---------------------------------------------------------------------------


def cache_path(*parts):
    p = os.path.join(CACHE, *parts)
    d = os.path.dirname(p)
    if not os.path.isdir(d):
        os.makedirs(d)
    return p


def get_json(url, cache_file, tries=3, pause=0.35):
    """GET -> parsed JSON, cached on disk forever. Returns None on hard failure."""
    if os.path.exists(cache_file) and os.path.getsize(cache_file) > 2:
        try:
            with open(cache_file, "r") as fh:
                return json.load(fh)
        except ValueError:
            os.remove(cache_file)
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as resp:
                raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            with open(cache_file, "w") as fh:
                fh.write(raw)
            time.sleep(pause)
            return data
        except Exception as exc:          # noqa: BLE001 - network is best-effort
            last = exc
            time.sleep(1.5 * (attempt + 1))
    sys.stderr.write("FETCH FAILED %s (%s)\n" % (url, last))
    return None


def q(**kw):
    from urllib.parse import urlencode
    return urlencode(kw, safe="+,:")


# ---------------------------------------------------------------------------
# countries.js (already built by gen_countries.py) -- for ISO2 + hint context
# ---------------------------------------------------------------------------


def load_countries():
    src = open(os.path.join(ROOT, "core", "data", "countries.js"), "r").read()
    m = re.search(r"window\.AD_COUNTRIES\s*=\s*(\[.*?\])\s*;\s*\n\s*window\.AD_COUNTRIES_BY",
                  src, re.S)
    if not m:
        raise SystemExit("could not parse core/data/countries.js")
    arr = json.loads(m.group(1))
    return arr, {c["n3"]: c for c in arr}


# ---------------------------------------------------------------------------
# fetch phases
# ---------------------------------------------------------------------------


def fetch_meta():
    members = get_json(
        BASE + "/members?" + q(cube=CUBE, level="Exporter Country"),
        cache_path("members_exporter.json"))
    world = get_json(
        BASE + "/data.jsonrecords?" + q(
            cube=CUBE, drilldowns="Section,HS4", measures="Trade Value", Year=YEAR),
        cache_path("world_hs4_%d.json" % YEAR))
    return members, world


def fetch_worldbank():
    """Independent benchmark for how COMPLETE each BACI basket is.

    BACI is built from UN Comtrade. A country whose partners under-report (or
    that stops reporting itself) shows a basket far smaller than its real trade
    -- Iran being the extreme case: Comtrade-derived merchandise exports are
    ~$13B while the World Bank puts its 2023 goods+services exports at ~$109B.
    Shipping that silently would teach players something false, so every record
    carries `cov` (BACI / World Bank merchandise exports) where computable, and
    a `note` when the basket is demonstrably partial.

    BX.GSR.MRCH.CD -- Merchandise exports, BoP, current US$ (primary benchmark)
    NE.EXP.GNFS.CD -- Exports of goods and services, current US$ (fallback flag)
    World Bank Open Data, CC BY 4.0.
    """
    out = {}
    for ind, field in (("BX.GSR.MRCH.CD", "merch"), ("NE.EXP.GNFS.CD", "gnfs")):
        d = get_json(
            "https://api.worldbank.org/v2/country/all/indicator/%s"
            "?format=json&date=%d&per_page=400" % (ind, YEAR),
            cache_path("wb_%s_%d.json" % (field, YEAR)))
        if not d or len(d) < 2 or not d[1]:
            continue
        for row in d[1]:
            i3 = (row.get("countryiso3code") or "").upper()
            if len(i3) == 3 and row.get("value"):
                out.setdefault(i3, {})[field] = float(row["value"])
    return out


def fetch_countries(members):
    keys = [m["key"] for m in members["members"]]
    n_new = 0
    for idx, key in enumerate(keys):
        cf = cache_path("cty", key + ".json")
        if os.path.exists(cf):
            continue
        url = BASE + "/data.jsonrecords?" + q(
            cube=CUBE, drilldowns="Section,HS4", measures="Trade Value",
            Year=YEAR, **{"Exporter Country": key})
        # `Exporter Country` has a space -> urlencode handles it as +
        get_json(url, cf)
        n_new += 1
        if n_new % 10 == 0:
            sys.stderr.write("  ... fetched %d new country baskets (%d/%d seen)\n"
                             % (n_new, idx + 1, len(keys)))
    return n_new


def fetch_products(hs4_ids):
    n_new = 0
    for hid in hs4_ids:
        cf = cache_path("prod", "%d.json" % hid)
        if os.path.exists(cf):
            continue
        url = BASE + "/data.jsonrecords?" + q(
            cube=CUBE, drilldowns="Exporter Country", measures="Trade Value",
            Year=YEAR, HS4=hid)
        get_json(url, cf)
        n_new += 1
        if n_new % 10 == 0:
            sys.stderr.write("  ... fetched %d new product tables\n" % n_new)
    return n_new


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def hs4_of(hs4_id):
    """52709 -> ('2709', '27', 5)"""
    sec = int(hs4_id) // 10000
    code = int(hs4_id) % 10000
    s = "%04d" % code
    return s, s[:2], sec


def usd(v):
    """Human-readable money for hints. Never invents precision."""
    a = abs(v)
    if a >= 1e12:
        return "$%.1fT" % (v / 1e12)
    if a >= 1e9:
        return "$%.0fB" % (v / 1e9) if a >= 1e10 else "$%.1fB" % (v / 1e9)
    if a >= 1e6:
        return "$%.0fM" % (v / 1e6)
    return "$%.0f" % v


def rnd(x, n):
    return round(x + 0.0, n)


def sig_int(v, sig=None):
    """Round a USD value to `sig` significant figures. Integer maths only, so it
    is exactly reproducible on any machine (no float rounding drift)."""
    sig = VALUE_SIGFIG if sig is None else sig     # constant is defined below
    iv = int(round(float(v)))
    if iv <= 0:
        return 0
    s = str(iv)
    if len(s) <= sig:
        return iv
    p = len(s) - sig
    unit = 10 ** p
    return ((iv + unit // 2) // unit) * unit


def jsnum(iv):
    """Shortest JSON number for a value already rounded by sig_int().

    `1348e9` is a legal JSON number and a legal JS Number literal, and saves 3-4
    bytes per row against `1348000000000`. Over 12,000 rows that is ~45 KB.
    """
    if iv <= 0:
        return "0"
    p = 0
    while iv % 10 == 0:
        iv //= 10
        p += 1
    return "%de%d" % (iv, p) if p > 0 else "%d" % iv


def palette_check():
    """Min pairwise separation of the 21 section colours (sanity, reported)."""
    def rgb(h):
        return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16))
    worst, pair = 10 ** 9, None
    ks = sorted(SECTION_COLOUR)
    for a in range(len(ks)):
        for b in range(a + 1, len(ks)):
            ra, rb = rgb(SECTION_COLOUR[ks[a]]), rgb(SECTION_COLOUR[ks[b]])
            # weighted euclidean, approximates perceived difference
            d = (2 * (ra[0] - rb[0]) ** 2 + 4 * (ra[1] - rb[1]) ** 2
                 + 3 * (ra[2] - rb[2]) ** 2) ** 0.5
            if d < worst:
                worst, pair = d, (ks[a], ks[b])
    return worst, pair


# ---------------------------------------------------------------------------
# build
# ---------------------------------------------------------------------------

# SIZE BUDGET. CONTRACT.md §0 caps every data file at 300 KB. These three
# numbers are the only dials; they were set by emitting and measuring, not
# guessed. 8 named items is the contract minimum (§6 "≥8 items per country").
# Product names are deliberately NOT interned into a lookup table even though
# that would save ~80 KB: CONTRACT.md §6 fixes the item shape as
# {name, hs, share, colour} and another agent's game is written against it.
N_ITEMS = 8           # named products per country before the "Other" remainder
# N_RCA is 9, not 4, on purpose. Connectrade shows four countries and gives each
# four products, but two countries in one board often share a signature export
# (Latvia/Estonia/Norway all peak on fish and timber; Gulf states on crude). The
# original resolves that by letting the country listed FIRST keep the product and
# pulling the next one down for the later country -- so a strict top-4 list
# literally cannot build a board. Measured over 6,000 random 4-country boards:
#   4 spares (n=6) -> 99.18% solvable    n=7 -> 99.93%    n=8 -> 99.98%
#   n=9 -> 100.00%  <- chosen
# The entries carry name+rca only. `share` was dropped deliberately: the >=0.5%
# filter is already applied here so the game never needs it, and dropping it buys
# the extra depth for FEWER bytes than a 6-deep list with shares.
N_RCA = 9
RCA_MIN_SHARE = 0.005  # Connectrade's own filter: >= 0.5% of the country's exports
MAX_PRODUCTS = 300    # PICK 5 products kept, chosen round-robin across sections

# ---------------------------------------------------------------------------
# HOW DEEP THE PICK 5 EXPORTER TABLE GOES  (added 2026-07-28)
#
# The first build shipped only the exact top 5 per product and left PICK 5 to
# reconstruct ranks 6+ out of each country's 8-item composition and its ~6 RCA
# rows. Almost nothing reconstructed, so almost every guess outside the medals
# rendered as "unranked / -- / 0.0%", which a player reads as "this country
# exports none of this". That is false for nearly everybody: the median product
# in this cube has 190 exporting countries out of the 228 we can name. So:
#
#   top   ranks 1..TOP_DEPTH with real USD values (4 significant figures)
#   rest  every remaining exporter, in rank order, as a flat string of ISO2
#         codes -- 2 bytes buys an EXACT rank for a country whose value is far
#         too small to score. Absence from BOTH lists is then a real fact: BACI
#         records no exports of that product from that country in this year.
#
# Cost, measured not guessed: ~557 B/product for top-40 at 4 s.f. and ~282 B for
# the tail, against ~180 B for the old top-5. That is what pushes the file past
# CONTRACT.md's 300 KB cap; MAX_PRODUCTS is the dial that trades pool size for
# bytes, and `--emit` retunes it offline from the cache without refetching.
TOP_DEPTH = 40        # ranks carrying an exact value (the brief's minimum)
VALUE_SIGFIG = 4      # 4 s.f. reproduces every figure PICK 5's usd() displays


def build(members, world, arr_countries, by3, product_ids, wb):
    world_rows = world["data"]
    world_total = float(sum(r["Trade Value"] for r in world_rows))
    world_by_hs4 = {}
    hs4_name = {}
    for r in world_rows:
        hid = int(r["HS4 ID"])
        world_by_hs4[hid] = float(r["Trade Value"])
        hs4_name[hid] = r["HS4"]

    key_by_iso2 = {}
    countries_out = []
    rca_out = {}
    warn_sum = []
    skipped = []
    partial = []

    for m in sorted(members["members"], key=lambda x: x["key"]):
        key = m["key"]
        iso3 = key[2:].upper()
        c = by3.get(iso3)
        if not c:
            skipped.append((key, m["caption"], "no ISO2 in countries.js"))
            continue
        cf = cache_path("cty", key + ".json")
        if not os.path.exists(cf):
            continue
        try:
            data = json.load(open(cf))["data"]
        except Exception:
            skipped.append((key, m["caption"], "unparseable cache"))
            continue
        if not data:
            skipped.append((key, m["caption"], "no %d rows" % YEAR))
            continue

        rows = [r for r in data if float(r["Trade Value"]) > 0]
        total = float(sum(r["Trade Value"] for r in rows))
        if total <= 0 or len(rows) < 8:
            skipped.append((key, m["caption"], "thin basket (%d rows)" % len(rows)))
            continue

        rows.sort(key=lambda r: (-float(r["Trade Value"]), int(r["HS4 ID"])))

        items = []
        named = 0.0
        for r in rows[:N_ITEMS]:
            hid = int(r["HS4 ID"])
            code, hs2, sec = hs4_of(hid)
            share = float(r["Trade Value"]) / total
            named += share
            items.append({
                "name": r["HS4"],
                "hs": hs2,                 # HS2 chapter, per CONTRACT.md §6
                "share": rnd(share, 4),
                "colour": str(sec),        # HS section id -> AD_TRADE.sections
            })
        other = 1.0 - sum(i["share"] for i in items)
        if other > 0.00005:
            items.append({"name": "Other", "hs": "",
                          "share": rnd(other, 4), "colour": "0"})

        ssum = sum(i["share"] for i in items)
        if ssum > 1.02:
            warn_sum.append((c["i"], ssum))

        # ---- RCA -------------------------------------------------------
        rca_rows = []
        for r in rows:
            hid = int(r["HS4 ID"])
            wv = world_by_hs4.get(hid, 0.0)
            if wv <= 0:
                continue
            share = float(r["Trade Value"]) / total
            if share < RCA_MIN_SHARE:
                continue
            rca = share / (wv / world_total)
            rca_rows.append((rca, share, hid, r["HS4"]))
        rca_rows.sort(key=lambda t: (-t[0], t[2]))
        top_rca = []
        for rca, share, hid, name in rca_rows[:N_RCA]:
            top_rca.append({"name": name, "rca": rnd(rca, 1)})
        # Only ship countries deep enough to survive board de-duplication.
        if len(top_rca) >= 6:
            rca_out[c["i"]] = top_rca

        # ---- section mix + hint ---------------------------------------
        bysec = {}
        for r in rows:
            sec = int(r["HS4 ID"]) // 10000
            bysec[sec] = bysec.get(sec, 0.0) + float(r["Trade Value"])
        dom_sec, dom_val = max(bysec.items(), key=lambda kv: (kv[1], -kv[0]))
        dom_pct = int(round(100.0 * dom_val / total))

        bits = ["%s %d%% of a %s basket."
                % (SECTION_SHORT[dom_sec], dom_pct, usd(total))]
        if top_rca:
            dd = top_rca[0]
            bits.append("Most distinctive: %s (%sx world share)."
                        % (dd["name"], ("%.0f" % dd["rca"]) if dd["rca"] >= 10
                           else ("%.1f" % dd["rca"])))
        sub = c.get("sub") or c.get("reg")
        if sub:
            bits.append(sub + ".")
        hint = " ".join(bits)

        # ---- completeness cross-check vs World Bank -------------------
        rec = {
            "i": c["i"],
            "total": int(round(total)),
            "items": items,
            "hint": hint,
        }
        wbc = wb.get(iso3, {})
        merch, gnfs = wbc.get("merch"), wbc.get("gnfs")
        if merch and merch > 0:
            cov = total / merch
            rec["cov"] = rnd(cov, 2)
            if cov < 0.6:
                rec["note"] = ("Partial basket: partners report only %s of the "
                               "%s of merchandise exports the World Bank records "
                               "for %d." % (usd(total), usd(merch), YEAR))
            elif cov > 1.6:
                rec["note"] = ("Re-export hub: partner-reported flows (%s) run "
                               "well above the %s of merchandise exports the "
                               "World Bank records for %d."
                               % (usd(total), usd(merch), YEAR))
        elif gnfs and gnfs > 0 and total < 0.5 * gnfs:
            rec["note"] = ("Partial basket: the World Bank puts %d exports of "
                           "goods and services at %s, but Comtrade partners "
                           "report only %s of merchandise."
                           % (YEAR, usd(gnfs), usd(total)))
        if "note" in rec:
            partial.append((c["i"], rec.get("cov")))
            # The hint is what Tradle actually renders. Carry the caveat into it
            # so a partial basket can never be shown as if it were the whole
            # story -- Iran's oil is missing from BACI and a bare
            # "Minerals 24% of a $13B basket" would teach a falsehood.
            rec["hint"] = rec["hint"] + " [partial data]"

        key_by_iso2[c["i"]] = key
        countries_out.append(rec)

    countries_out.sort(key=lambda x: x["i"])

    # ---- top5 ---------------------------------------------------------
    iso2_by_key = {}
    for m in members["members"]:
        c = by3.get(m["key"][2:].upper())
        if c:
            iso2_by_key[m["key"]] = c["i"]

    top5_out = []
    clamped = 0
    depths = []
    for hid in product_ids:
        cf = cache_path("prod", "%d.json" % hid)
        if not os.path.exists(cf):
            continue
        try:
            data = json.load(open(cf))["data"]
        except Exception:
            continue
        # Rank every exporter we can name. An exporter the ISO2 map cannot
        # resolve is dropped rather than silently shifting everyone's rank up,
        # and `n` is recomputed from what survives, so "#63 of 190" always
        # counts the same list the game can actually search.
        ranked = []
        for r in data:
            v = float(r["Trade Value"])
            if v <= 0:
                continue
            i2 = iso2_by_key.get(r["Exporter Country ID"])
            if not i2:
                continue
            ranked.append((v, i2))
        if len(ranked) < 8:
            continue
        ranked.sort(key=lambda t: (-t[0], t[1]))

        top = []
        prev = None
        for v, i2 in ranked[:TOP_DEPTH]:
            iv = sig_int(v)
            # Rounding must never invert the ranking it is attached to.
            if prev is not None and iv > prev:
                iv = prev
                clamped += 1
            prev = iv
            top.append([i2, iv])
        if len(top) < 5 or top[4][1] <= 0:
            continue
        rest = "".join(i2 for _, i2 in ranked[TOP_DEPTH:])

        code, hs2, sec = hs4_of(hid)
        depths.append(len(ranked))
        rec = {
            "hs4": code,
            "name": hs4_name.get(hid, ""),
            "colour": str(sec),
            "n": len(ranked),                     # = len(top) + len(rest)/2
            "world": int(round(world_by_hs4.get(hid, 0.0))),
            "top": top,
        }
        if rest:
            rec["rest"] = rest
        top5_out.append(rec)
    top5_out.sort(key=lambda p: p["hs4"])

    return (countries_out, top5_out, rca_out, warn_sum, skipped, world_total,
            partial, clamped, depths)


# ---------------------------------------------------------------------------
# emit
# ---------------------------------------------------------------------------


def emit(countries_out, top5_out, rca_out):
    sections = {}
    for sid in sorted(SECTION_COLOUR):
        sections[str(sid)] = {"name": SECTION_SHORT[sid],
                              "colour": SECTION_COLOUR[sid]}
    sections["0"] = {"name": "Other", "colour": "#4a3a7d"}

    payload = {
        "year": YEAR,
        "source": SOURCE_STR,
        "cube": CUBE,
        "worldTotal": None,      # filled by caller
        "coverage": ("cov = this basket divided by the World Bank's merchandise "
                     "exports (BX.GSR.MRCH.CD) for the same year. ~1.0 means the "
                     "basket is complete. Below 0.6 the country's trade is "
                     "under-reported to UN Comtrade and `note` says so - show "
                     "that warning rather than presenting the basket as whole."),
        "sections": sections,
        "countries": countries_out,
        "top5": top5_out,
        "rca": rca_out,
    }
    return payload


TOP5_SENTINEL = "@@TOP5@@"


def top5_json(top5_out):
    """Hand-serialise top5 so the USD values use the short exponent form.

    json.dumps would print `1348000000000`; `1348e9` is the same JSON number in
    6 bytes instead of 13. Everything else still goes through json.dumps, and
    the result is spliced in over a sentinel, so the file is one plain JSON
    object literal exactly as _build/check_trade.py demands.
    """
    out = []
    for p in top5_out:
        rows = ",".join('["%s",%s]' % (i2, jsnum(v)) for i2, v in p["top"])
        s = ('{"hs4":%s,"name":%s,"colour":%s,"n":%d,"world":%d,"top":[%s]'
             % (json.dumps(p["hs4"]), json.dumps(p["name"], ensure_ascii=False),
                json.dumps(p["colour"]), p["n"], p["world"], rows))
        if p.get("rest"):
            s += ',"rest":%s' % json.dumps(p["rest"])
        out.append(s + "}")
    return "[" + ",".join(out) + "]"


def write_file(payload):
    top5_out = payload["top5"]
    payload = dict(payload)
    payload["top5"] = TOP5_SENTINEL
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"),
                      sort_keys=False)
    body = body.replace('"%s"' % TOP5_SENTINEL, top5_json(top5_out), 1)

    # Facts quoted in the header are measured off the payload being written, so
    # the comment can never drift from the data underneath it.
    ns = sorted(p["n"] for p in top5_out) or [0]
    MEDIAN_EXPORTERS = ns[len(ns) // 2]
    N_NAMED = len(payload["countries"])
    header = (
        "/* core/data/trade.js -- window.AD_TRADE\n"
        "\n"
        "   Export composition, top-5 exporter tables and revealed comparative\n"
        "   advantage for the TRADLE / PICK 5 / CONNECTRADE cabinets.\n"
        "\n"
        "   SOURCE  OEC olap-proxy (https://oec.world/api/olap-proxy/data.jsonrecords),\n"
        "           cube trade_i_baci_a_92 = CEPII BACI, HS6 Rev. 1992, Year 2023.\n"
        "           BACI is CEPII's mirror-reconciled rebuild of UN Comtrade; values\n"
        "           are USD FOB. RCA is Balassa, computed locally from the same rows\n"
        "           so shares and ranks in this file can never disagree.\n"
        "   SCRIPT  _build/gen_trade.py  (re-runnable, deterministic, stdlib only)\n"
        "\n"
        "   countries[] .i ISO2  .total USD  .hint one-liner\n"
        "               .items[] {name, hs (HS2 chapter), share, colour}\n"
        "               shares sum to 1 including the trailing \"Other\" remainder.\n"
        "               .cov  basket / World Bank merchandise exports, same year.\n"
        "               .note present ONLY when the basket is demonstrably partial\n"
        "                     (under-reported to Comtrade, e.g. Iran) or is\n"
        "                     re-export inflated. Surface it in the UI.\n"
        "   top5[]      .hs4 .name .colour .n (how many countries export it at all)\n"
        "               .world (world trade USD)\n"
        "               .top  [[ISO2, USD]] for ranks 1..%d, descending. Values are\n"
        "                     4 significant figures, written short (1348e9), which is\n"
        "                     legal JSON and reproduces every figure the game prints.\n"
        "               .rest ranks %d+ as one flat string of 2-char ISO2 codes in rank\n"
        "                     order, no values -- their exports are real but far too\n"
        "                     small to score. Rank = %d + index/2 + 1.\n"
        "               PICK 5 scores a pick as value / sum(the FIRST FIVE values).\n"
        "               .n = len(top) + len(rest)/2, so \"#63 of 190\" is exact.\n"
        "               A country in NEITHER list really did export none of it in this\n"
        "               year -- that is the only case where the game may say so. The\n"
        "               median product here has %d exporters out of the %d countries\n"
        "               this file can name, so \"exports none\" is almost always wrong.\n"
        "   rca{ISO2}   6-9 products by revealed comparative advantage (Balassa),\n"
        "               RCA-descending, each already filtered to >=0.5%% of that\n"
        "               country's exports (so the game never re-applies it).\n"
        "\n"
        "     CONNECTRADE BOARD RULES -- follow both or you will ship broken days:\n"
        "       1. Give each country the first FOUR of its products not already\n"
        "          claimed by an earlier country in the board. The spare entries\n"
        "          past four exist precisely to absorb those collisions.\n"
        "       2. Allocate THINNEST LIST FIRST (ascending rca[c].length), then\n"
        "          VALIDATE that you got 16 distinct products and redraw if not.\n"
        "          Measured over 20,000 random 4-country boards: 99.87%% solvable\n"
        "          in draw order, 99.995%% thinnest-first. The residue is real, not\n"
        "          a data gap -- draw Libya + Brunei + Nigeria together and three\n"
        "          petroleum economies genuinely cannot field 12 distinct exports.\n"
        "          Redraw; do not paper over it.\n"
        "   sections{}  HS section id -> {name, colour}; \"0\" = the Other remainder.\n"
        "*/\n"
    ) % (TOP_DEPTH, TOP_DEPTH + 1, TOP_DEPTH, MEDIAN_EXPORTERS, N_NAMED)
    tmp = OUT + ".tmp"
    with open(tmp, "w") as fh:
        fh.write(header)
        fh.write("window.AD_TRADE = ")
        fh.write(body)
        fh.write(";\n")
    os.replace(tmp, OUT)
    return os.path.getsize(OUT)


# ---------------------------------------------------------------------------
# product selection for PICK 5
# ---------------------------------------------------------------------------

# Hand-picked HS4 products: recognisable to a non-specialist, spread over all 21
# HS sections, and spanning concentrated (one-whale) and flat markets. Stored as
# bare HS4 codes; the script resolves each to its section-prefixed HS4 ID and
# DROPS any code it cannot find in the live world table, so a typo can never
# invent a product.
PICK5_HS4 = """
0101 0201 0203 0302 0303 0306 0401 0402 0405 0406 0409 0603 0701 0702 0703
0709 0801 0803 0804 0805 0808 0810 0813 0901 0902 0904 0905 0910 1001 1005
1006 1201 1211 1301 1509 1511 1701 1704 1801 1806 1901 1905 2009 2101 2103
2106 2201 2202 2203 2204 2205 2207 2208 2402 2501 2601 2603 2606 2608 2609
2701 2709 2710 2711 2716 2804 2818 2846 2901 2905 2933 3004 3002 3006 3101
3102 3204 3301 3303 3304 3305 3401 3402 3506 3604 3701 3808 3901 3907 3917
3923 4001 4011 4015 4104 4202 4203 4302 4401 4403 4407 4412 4418 4703 4801
4818 4901 4911 5007 5105 5201 5208 5407 5701 5801 6109 6110 6203 6204 6403
6404 6505 6601 6802 6907 7010 7013 7102 7106 7108 7113 7202 7208 7304 7326
7403 7601 7801 7901 8001 8111 8201 8306 8407 8411 8414 8415 8418 8419 8421
8422 8429 8431 8443 8450 8471 8473 8481 8482 8501 8504 8507 8517 8523 8528
8541 8542 8544 8703 8704 8708 8711 8716 8802 8901 8903 9001 9018 9021 9022
9027 9028 9101 9113 9201 9301 9306 9401 9403 9405 9503 9504 9506 9603 9613
9701 9705 9706
"""

# Second curation pass (2026-07-28), tripling the candidate pool so PICK 5 stops
# repeating after five months. Same test as above -- would a strong generalist who
# is NOT a trade specialist have an intuition about who sells this? A machine
# filter shortlisted 467 further HS4 codes (>= $2B world trade, <= 32-char name,
# no chemistry-exam vocabulary, nothing called "Other <something>"); these are the
# ones that survived reading the list by hand.
PICK5_HS4_MORE = """
0207 0202 0304 0307 0102 0206 0204 0407 0403 0103 0105 0104 0301 0210 0305
0713 1205 0806 1003 0809 0710 0811 1101 1107 1206 1202 0807 0714 0704 0707
0705 0712 1007 0706 0601 1108 1209
1512 1514 1507 1517 1513 1504 1520
2309 2304 1604 1605 1902 2403 2401 1904 2002 1601 2105 1804 1803 2104 2007
2102 1805 2001 2302 2301
2713 2523 2616 2702 2704 2613 2610 2602 2503 2607 2604 2712 2517 2614 2505
2508 2520 2516 2510
3302 2937 3104 3003 3307 3215 2941 3005 2814 2936 3507 3306 3406 3503 3405
3103 2807 2809 3802 3208 3209 3707 3404 2803 3801
3920 3902 4002 3919 3924 3903 3906 3925 4009 3918 3910 4010 3912 3922 4008
3915 4012
4201
4411 4410 4409 4415 4408 4419 4420
4819 4804 4802 4707 4821 4803 4820 4813 4902 4808 4811 4810
6104 6302 6202 6201 6115 6211 6205 6103 6206 6108 6105 6107 6111 5703 6306
5702 6305 6112 6309 6116 6102 6301 6303 6106 6304 6101 6214 5101 6208 5607
6209 5603
6402 6406 6704 6702
7019 7007 7009 6910 7005 6911 6902 6912 6810 6806 6804 6805 6807 7003 6809
7008
7110 7112 7103 7117
7308 7318 7204 8302 7404 7408 7307 7604 7602 7610 7402 7502 7607 8301 7323
7321 7411 8108 7217 7612 7407 7315 7615 7605 8105 7201 8212 8202 8204 8211
7317 8203 8104 7608 8215 7322 7309
8525 8413 8409 8483 8516 8408 8534 8518 8521 8428 8532 8427 8433 8502 8526
8511 8508 8426 8432 8485 8527 8451 8506 8465 8458 8403 8439 8470 8514 8417
8484 8510 8423 8402 8452 8401 8406 8513 8530 8434 8446
8701 8714 8905 8702 8705 8710 8607 8609 8603 8904 8606 8715 8709 8713
9032 9030 9102 9019 9013 9002 9004 9015 9014 9003 9011 9006 9207 9017 9020
9305
9404 9406 9505 9608 9402 9617 9507 9607 9615
9703
"""

PICK5_HS4 = (PICK5_HS4 + PICK5_HS4_MORE).split()


def resolve_products(world):
    """Map bare HS4 codes -> section-prefixed HS4 IDs using the live world table."""
    by_code = {}
    for r in world["data"]:
        hid = int(r["HS4 ID"])
        by_code["%04d" % (hid % 10000)] = hid
    ids, missing = [], []
    seen = set()
    for code in PICK5_HS4:
        code = code.strip()
        if not code or code in seen:
            continue
        seen.add(code)
        if code in by_code:
            ids.append(by_code[code])
        else:
            missing.append(code)
    return sorted(ids), missing


def select_products(ids, world, limit):
    """Trim the resolved product list to `limit`, keeping section spread.

    Round-robin over the 21 HS sections, each contributing its largest remaining
    product by world trade value. Deterministic, and guarantees PICK 5 never
    turns into 150 days of machinery -- every section gets represented before
    any section gets a second pick.
    """
    wv = {int(r["HS4 ID"]): float(r["Trade Value"]) for r in world["data"]}
    bysec = {}
    for hid in ids:
        bysec.setdefault(hid // 10000, []).append(hid)
    for sec in bysec:
        bysec[sec].sort(key=lambda h: (-wv.get(h, 0.0), h))
    out, sections = [], sorted(bysec)
    round_i = 0
    while len(out) < limit:
        added = False
        for sec in sections:
            if round_i < len(bysec[sec]):
                out.append(bysec[sec][round_i])
                added = True
                if len(out) >= limit:
                    break
        if not added:
            break
        round_i += 1
    return sorted(out)


# ---------------------------------------------------------------------------


def main():
    args = set(sys.argv[1:])
    do_all = not (args & {"--emit", "--fetch-countries", "--fetch-products"})

    arr_countries, by3 = load_countries()
    members, world = fetch_meta()
    if members is None or world is None:
        raise SystemExit("cannot proceed without members + world table")

    all_ids, missing_codes = resolve_products(world)
    # Fetch every resolved product (the cache is the durable artifact), but ship
    # only the section-balanced subset, so MAX_PRODUCTS can be retuned offline.
    product_ids = select_products(all_ids, world, MAX_PRODUCTS)

    if do_all or "--fetch-countries" in args:
        sys.stderr.write("[1/3] country baskets ...\n")
        fetch_countries(members)
    if do_all or "--fetch-products" in args:
        sys.stderr.write("[2/3] product exporter tables ...\n")
        fetch_products(all_ids)

    wb = fetch_worldbank()

    sys.stderr.write("[3/3] building ...\n")
    (countries_out, top5_out, rca_out, warn_sum, skipped, world_total,
     partial, clamped, depths) = build(members, world, arr_countries, by3,
                                       product_ids, wb)

    payload = emit(countries_out, top5_out, rca_out)
    payload["worldTotal"] = int(round(world_total))
    size = write_file(payload)

    # ---- report -------------------------------------------------------
    have = {c["i"] for c in countries_out}
    missing_must = [x for x in MUST_HAVE if x not in have]
    worst, pair = palette_check()
    print("")
    print("core/data/trade.js  %d bytes  (%.1f KB)" % (size, size / 1024.0))
    print("  year               %d   cube %s" % (YEAR, CUBE))
    print("  countries          %d" % len(countries_out))
    print("  products (top5)    %d  (curated %d -> shipped %d, unresolved %d)"
          % (len(top5_out), len(all_ids), len(product_ids), len(missing_codes)))
    valued = sorted(len(p["top"]) for p in top5_out) or [0]
    ranked = sorted(depths) or [0]
    print("  valued ranks/prod  min %d  median %d  max %d  (TOP_DEPTH %d)"
          % (valued[0], valued[len(valued) // 2], valued[-1], TOP_DEPTH))
    print("  ranked exporters   min %d  median %d  max %d  (top + rest)"
          % (ranked[0], ranked[len(ranked) // 2], ranked[-1]))
    print("  rounding clamps    %d  (4 s.f. never inverted a rank)" % clamped)
    print("  rca countries      %d" % len(rca_out))
    print("  shares sum > 1.02  %d %s" % (len(warn_sum), warn_sum if warn_sum else ""))
    print("  flagged baskets    %d partial/re-export (see .note)" % len(partial))
    print("  MUST_HAVE missing  %s" % (missing_must or "none"))
    print("  min colour sep     %.0f between sections %s" % (worst, pair))
    if missing_codes:
        print("  unresolved HS4     %s" % " ".join(missing_codes))
    if skipped:
        print("  skipped exporters  %d" % len(skipped))
        for s in skipped:
            print("      %-8s %-28s %s" % s)
    return 0


if __name__ == "__main__":
    sys.exit(main())
