#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_countries.py  —  builds core/data/countries.js  (window.AD_COUNTRIES)

MIDNIGHT ARCADE / DAILY WING data generator.  Deterministic, re-runnable, stdlib only.

SOURCES (all open, no auth)
  1. _build/countries-full.json
       mledoze/countries (root countries.json, ODbL) — names, ISO codes, region/subregion,
       capital NAMES, latlng (centroid), landlocked, borders (cca3), area, languages,
       currencies, demonyms, tld, unMember, independent, altSpellings.
       NOTE: this dataset has NO `capitalInfo` and NO `population` — verified by key scan.
  2. Wikidata Query Service (SPARQL, CC0)
       - capital coordinates: ?country wdt:P297 ?iso2 ; wdt:P36 ?capital . ?capital wdt:P625
       - population fallback: p:P1082 statements with pq:P585 point-in-time (>=2015)
       - surface area cross-check: wdt:P2046
  3. Natural Earth 10m populated places (public domain, via nvkelso/natural-earth-vector)
       - independent cross-check of every capital coordinate
       - primary coords for EH / HK / SJ (absent from the Wikidata P36 join)
  4. World Bank API v2 (CC BY 4.0), indicators over date=2018:2024, latest non-null per country
       - SP.POP.TOTL      population        -> pop / popYear
       - NY.GDP.PCAP.CD   GDP per capita    -> gdppc (current US$)
     World Bank AG.SRF.TOTL.K2 ("surface area") was evaluated and REJECTED as an area
     cross-check: it silently mixes land-only and marine figures (Canada 15,634,410 km2,
     Dominican Republic 146,839 km2, Faroe Islands 12,960 km2).  Area is cross-checked
     against Wikidata P2046 instead.

Network responses are reduced to slim caches in _build/cache/ so re-runs are offline and
byte-identical.  Delete _build/cache/ to force a refetch.

Run:  python3 _build/gen_countries.py            (uses cache when present)
      python3 _build/gen_countries.py --refetch  (ignore cache, hit the network)
"""

import json
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
CACHE = os.path.join(HERE, "cache")
OUT = os.path.join(REPO, "core", "data", "countries.js")
MLEDOZE = os.path.join(HERE, "countries-full.json")
BUDGET = 90 * 1024
REFETCH = "--refetch" in sys.argv
UA = "MidnightArcade-datagen/1.0 (static arcade build; misha@cbai.ai)"

WB_YEARS = "2018:2024"
WB_INDICATORS = ["SP.POP.TOTL", "NY.GDP.PCAP.CD"]

# World Bank uses a few non-ISO-3166 codes.
WB_ISO3_ALIAS = {"UNK": "XKX"}  # mledoze cca3 for Kosovo -> World Bank code

# ── aliases players actually type that no open dataset carries ─────────────────
# Historical / colloquial names, hand-authored, each one deliberately checked.
# (Anything derivable — Burma, Swaziland, Holland, UK, USA, UAE, East Timor,
#  Congo-Brazzaville, Macedonia, Cote d'Ivoire, Macao, Curacao, Aland, Reunion …
#  is pulled from mledoze altSpellings or from diacritic-folding, not typed here.)
ALIAS_AUTHORED = {
    "IR": ["Persia"],
    "GB": ["UK", "Britain"],
    "US": ["USA", "America"],
    "TR": ["Turkey"],                 # mledoze now names this country Turkiye
    "CZ": ["Czech Republic"],
    "BA": ["Bosnia"],
    "CV": ["Cabo Verde"],
    "VA": ["Holy See"],
    "LK": ["Ceylon"],
    "TH": ["Siam"],
    "MM": ["Burma"],
    "ZW": ["Rhodesia"],
    "CD": ["Zaire"],
    "ET": ["Abyssinia"],
    "IE": ["Eire"],
    "GR": ["Hellas"],
    "PG": ["PNG"],
    "CF": ["CAR"],
    "BF": ["Upper Volta"],
    "BJ": ["Dahomey"],
    "GH": ["Gold Coast"],
    "BW": ["Bechuanaland"],
    "LS": ["Basutoland"],
    "MW": ["Nyasaland"],
    "NA": ["South West Africa"],
    "BY": ["Byelorussia"],
    "BD": ["East Pakistan"],
    "KH": ["Kampuchea"],
    "IQ": ["Mesopotamia"],
    "JO": ["Transjordan"],
    "TW": ["Formosa"],
    "SR": ["Dutch Guiana"],
    "GM": ["The Gambia"],
    "BS": ["The Bahamas"],
    "FK": ["Malvinas"],
    "CI": ["Ivory Coast"],            # already the mledoze common name; harmless dedupe
    "TL": ["East Timor"],
    "SZ": ["Swaziland"],
    "MK": ["Macedonia"],
    "CG": ["Congo-Brazzaville"],
}

# Capital display names where mledoze is dated or uses a non-current form.
CAP_NAME_FIX = {
    "MN": "Ulaanbaatar",       # mledoze: "Ulan Bator" (dated transliteration)
    "SM": "San Marino",        # mledoze: "City of San Marino"
    "HK": "Hong Kong",         # mledoze: "City of Victoria" (colonial-era name)
}

# Capital coordinates for territories the automatic joins cannot reach.  Each value was
# looked up individually in the named source; nothing here is from memory.
CAP_LL_MANUAL = {
    # Absent from Wikidata's P297/P36 join AND from Natural Earth; coordinates are the
    # Wikidata P625 of the settlement itself.
    "BQ": (12.15, -68.28, "Kralendijk", "wikidata:Q331584"),
    "TK": (-9.37, -171.26, "Fakaofo", "wikidata:Q2140263"),
    # Natural Earth has this city as "Laayoune" (French form) under adm0_a3=MAR, so neither
    # the name join nor the country join fires.  mledoze names it "El Aaiun"; same city.
    "EH": (27.15, -13.20, "El Aaiun", "naturalearth:Laayoune adm0_a3=MAR"),
}

# An altSpelling is rejected if ANY of its words is a "form of state" word in any language.
# This is what separates a name a player types ("Burma", "Holland", "Nippon", "Aotearoa")
# from a constitutional title mledoze also lists ("Republika y'Uburundi", "Kongeriket
# Norge", "Dawlat al-Kuwait", "Bharat Ganrajya").
ALT_STATE_WORDS = set("""
republic republika republiek republica repubblica repubblika republique republiken republik repiblik
ripublik respublika respublikasy cumhuriyeti cumhuriyi jumhuriyah jumhuriyat jamhuri
jamhuriya vabariik tasavalta kingdom kongeriget kongeriket konungariket koninkrijk
principality principat principaute furstentum fyrstendommet sultanate emirate dawlat
daulah negara commonwealth federation federal federated confederation state states
estado etat territory territories collectivity collectivite department departement
nation country province union grand most special democratic socialist bolivarian
plurinational islamic peoples people cooperative independent bailiwick bailliage
udzima matanitu beluu ribaberiki muso lefatshe ummuuno mamallaqta ganrajya suyu
gonoprojatontri abode former
""".split())


# ── tiny helpers ──────────────────────────────────────────────────────────────
def fold(s):
    """Strip diacritics: 'Türkiye' -> 'Turkiye', 'Curaçao' -> 'Curacao'."""
    d = unicodedata.normalize("NFKD", s)
    return "".join(c for c in d if not unicodedata.combining(c))


def norm(s):
    s = fold(str(s)).lower().replace("-", " ").replace("'", "").replace("`", "")
    s = s.replace(".", "").replace("’", "")
    return re.sub(r"\s+", " ", s).strip()


def cached(name, build):
    path = os.path.join(CACHE, name)
    if os.path.exists(path) and not REFETCH:
        with open(path, "r") as f:
            return json.load(f)
    data = build()
    if not os.path.isdir(CACHE):
        os.makedirs(CACHE)
    with open(path, "w") as f:
        json.dump(data, f, sort_keys=True, separators=(",", ":"))
    return data


def get(url, accept=None):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    if accept:
        req.add_header("Accept", accept)
    with urllib.request.urlopen(req, timeout=240) as r:
        return r.read()


def sparql(query):
    url = "https://query.wikidata.org/sparql?" + urllib.parse.urlencode({"query": query})
    raw = get(url, accept="application/sparql-results+json")
    return json.loads(raw.decode("utf-8"))["results"]["bindings"]


POINT = re.compile(r"Point\(\s*(-?[\d.eE+]+)\s+(-?[\d.eE+]+)\s*\)")


def wkt_latlon(v):
    m = POINT.match(v)
    return (float(m.group(2)), float(m.group(1))) if m else None


# ── fetchers (each returns a slim, JSON-serialisable cache payload) ────────────
def fetch_wd_capitals():
    rows = sparql(
        "SELECT ?iso2 ?capLabel ?coord WHERE {"
        " ?c wdt:P297 ?iso2 . ?c wdt:P36 ?cap . ?cap wdt:P625 ?coord ."
        ' SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }'
    )
    out = {}
    for b in rows:
        ll = wkt_latlon(b["coord"]["value"])
        if not ll:
            continue
        out.setdefault(b["iso2"]["value"], []).append(
            [b.get("capLabel", {}).get("value", ""), ll[0], ll[1]]
        )
    for k in out:
        out[k].sort()
    return out


def fetch_wd_pop():
    rows = sparql(
        "SELECT ?iso2 ?pop ?date WHERE {"
        " ?c wdt:P297 ?iso2 . ?c p:P1082 ?st . ?st ps:P1082 ?pop ."
        " ?st pq:P585 ?date . FILTER(YEAR(?date) >= 2015) }"
    )
    out = {}
    for b in rows:
        out.setdefault(b["iso2"]["value"], []).append(
            [int(b["date"]["value"][:4]), int(float(b["pop"]["value"]))]
        )
    for k in out:
        out[k].sort(reverse=True)
    return out


def fetch_wd_area():
    rows = sparql("SELECT ?iso2 ?a WHERE { ?c wdt:P297 ?iso2 . ?c wdt:P2046 ?a . }")
    out = {}
    for b in rows:
        out.setdefault(b["iso2"]["value"], []).append(float(b["a"]["value"]))
    for k in out:
        out[k].sort()
    return out


def fetch_ne_capitals():
    """Slim extract of Natural Earth 10m populated places: national capitals only.

    Keeps featurecla 'Admin-0 capital', 'Admin-0 capital alt' (Laayoune) and
    'Admin-0 region capital' (Longyearbyen, Hong Kong).  Admin-1 (provincial) capitals
    are dropped: they can never outscore an Admin-0 row in ne_lookup and they are 90%
    of the file.
    """
    raw = get(
        "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/"
        "geojson/ne_10m_populated_places_simple.geojson"
    )
    feats = json.loads(raw.decode("utf-8"))["features"]
    out = []
    for f in feats:
        p = f["properties"]
        fc = str(p.get("featurecla") or "")
        if "admin-0" not in fc.lower():
            continue
        out.append(
            {
                "n": p.get("name"),
                "na": p.get("nameascii"),
                "alt": p.get("namealt"),
                "a3": p.get("adm0_a3"),
                "i2": p.get("iso_a2"),
                "s3": p.get("sov_a3"),
                "cap": p.get("adm0cap"),
                "fc": fc,
                "lat": round(float(p["latitude"]), 4),
                "lon": round(float(p["longitude"]), 4),
            }
        )
    out.sort(key=lambda d: (str(d["a3"]), str(d["n"])))
    return out


def fetch_wb():
    out = {}
    for ind in WB_INDICATORS:
        url = (
            "https://api.worldbank.org/v2/country/all/indicator/%s"
            "?format=json&per_page=3000&date=%s" % (ind, WB_YEARS)
        )
        payload = json.loads(get(url).decode("utf-8"))
        series = {}
        for r in payload[1]:
            if r["value"] is None:
                continue
            iso3 = r["countryiso3code"]
            if not iso3:
                continue
            series.setdefault(iso3, {})[r["date"]] = r["value"]
        out[ind] = series
    return out


def wb_latest(series, iso3):
    """(value, year) for the most recent non-null observation, or (None, None)."""
    iso3 = WB_ISO3_ALIAS.get(iso3, iso3)
    d = series.get(iso3)
    if not d:
        return None, None
    y = max(int(k) for k in d)
    return d[str(y)], y


# ── alias construction ────────────────────────────────────────────────────────
def alt_is_noise(s):
    """True for constitutional titles and other things nobody types into a guess box."""
    words = norm(s).split()
    if len(words) > 3:
        return True
    return any(w in ALT_STATE_WORDS for w in words)


def build_aliases(c):
    name = c["name"]["common"]
    # NOTE: neither cca3 nor the OFFICIAL name is seeded into `bad`.  cca3 would kill "USA",
    # the single most-typed alias in the file; the official name would kill "Czech Republic"
    # (CZ's official name, but an alias as far as a player is concerned, because only
    # `n` and `alt` are shipped).  Long constitutional titles are already excluded by the
    # length cap and ALT_STATE_WORDS.
    bad = {norm(name), norm(c["cca2"])}
    out = []

    def add(s):
        s = s.strip()
        if not s or norm(s) in bad:
            return
        bad.add(norm(s))
        out.append(s)

    for s in ALIAS_AUTHORED.get(c["cca2"], []):
        add(s)
    folded = fold(name)
    if folded != name:
        add(folded)
    # Only already-ASCII altSpellings: accented entries are native-language forms
    # ("Cumhuriyi Tocikiston", "Reino de Espana") that no English-typing player enters,
    # and mledoze already lists the anglicised form separately where one exists
    # ("Cote d'Ivoire", "Sao Tome and Principe", "Turkiye", "Curacao", "Aland").
    for s in c["altSpellings"]:
        if len(out) >= 3:
            break
        if not s.isascii() or len(s) > 20 or len(s) < 2:
            continue
        if "," in s or "(" in s or alt_is_noise(s):
            continue
        add(s)
    return out[:3]


# ── main build ────────────────────────────────────────────────────────────────
def main():
    with open(MLEDOZE, "r") as f:
        src = json.load(f)
    src.sort(key=lambda c: c["cca2"])

    wd_caps = cached("wd-capitals.json", fetch_wd_capitals)
    wd_pop = cached("wd-population.json", fetch_wd_pop)
    wd_area = cached("wd-area.json", fetch_wd_area)
    ne_caps = cached("ne-capitals.json", fetch_ne_capitals)
    wb = cached("worldbank.json", fetch_wb)
    pop_s = wb["SP.POP.TOTL"]
    gdp_s = wb["NY.GDP.PCAP.CD"]

    # Natural Earth name index
    ne_by_name = {}
    for p in ne_caps:
        for nm in (p["n"], p["na"], p["alt"]):
            if nm:
                for part in str(nm).split("|"):
                    ne_by_name.setdefault(norm(part), []).append(p)

    def ne_lookup(c, cap_names):
        best = (0, None)
        for cap in cap_names:
            for p in ne_by_name.get(norm(cap), []):
                s = 0
                if p["a3"] == c["cca3"]:
                    s += 4
                if p["i2"] == c["cca2"]:
                    s += 3
                if p["s3"] == c["cca3"]:
                    s += 2
                if p["cap"] == 1:
                    s += 1
                if "Admin-0 capital" in p["fc"]:
                    s += 1
                if s > best[0]:
                    best = (s, p)
        return best[1] if best[0] >= 3 else None

    # mledoze `borders` must be mutual.  Any one-way edge is a source error (it lists
    # IND as a border of LKA, which would make Sri Lanka a non-island).  Keep only
    # reciprocated edges and report what was dropped.
    raw_bord = {c["cca2"]: set(ISO3_TO_ISO2[b] for b in c["borders"] if b in ISO3_TO_ISO2)
                for c in src}
    dropped_edges = []
    for a in sorted(raw_bord):
        for b in sorted(raw_bord[a]):
            if a not in raw_bord.get(b, set()):
                dropped_edges.append((a, b))
    for a, b in dropped_edges:
        raw_bord[a].discard(b)

    recs = []
    stats = {
        "cap_wd": 0, "cap_ne": 0, "cap_manual": 0, "cap_none": [],
        "pop_wb": 0, "pop_wd": 0, "pop_none": [],
        "gdp_wb": 0, "gdp_none": [], "gdp_years": {},
        "area_mledoze": 0, "area_wd": 0, "area_none": [],
        "cap_disagree": [], "cap_label_swap": [], "area_disagree": [],
        "dropped_edges": dropped_edges,
    }

    for c in src:
        i2, c3 = c["cca2"], c["cca3"]
        cap_names = list(c["capital"])
        if i2 in CAP_NAME_FIX:
            cap_names = [CAP_NAME_FIX[i2]] + cap_names

        # ── capital coordinates: Wikidata first, Natural Earth second, manual last
        capll = None
        ne = ne_lookup(c, cap_names)
        wd_list = wd_caps.get(i2) or []
        wd_pick = None
        if wd_list:
            want = [norm(x) for x in cap_names]
            ranked = sorted(
                wd_list,
                key=lambda t: (want.index(norm(t[0])) if norm(t[0]) in want else 99, t[0]),
            )
            wd_pick = ranked[0]
        # Wikidata's P36 can name a DIFFERENT city than the dataset's capital field
        # (Equatorial Guinea -> "Ciudad de la Paz", the planned capital, not Malabo).
        # If the two sources disagree by more than 0.5 deg and Wikidata's label does not
        # match the capital we are about to print, trust Natural Earth instead, so `cap`
        # and `capll` always describe the same city.
        if wd_pick and ne:
            d = max(abs(wd_pick[1] - ne["lat"]), abs(wd_pick[2] - ne["lon"]))
            if d > 0.5:
                stats["cap_disagree"].append(
                    (i2, cap_names[0] if cap_names else "", round(d, 2),
                     wd_pick[0], [round(wd_pick[1], 3), round(wd_pick[2], 3)],
                     ne["n"], [ne["lat"], ne["lon"]])
                )
                if norm(wd_pick[0]) not in [norm(x) for x in cap_names]:
                    stats["cap_label_swap"].append((i2, wd_pick[0], ne["n"]))
                    wd_pick = None

        if wd_pick:
            capll = (wd_pick[1], wd_pick[2])
            stats["cap_wd"] += 1
        elif ne:
            capll = (ne["lat"], ne["lon"])
            stats["cap_ne"] += 1
        elif i2 in CAP_LL_MANUAL:
            capll = CAP_LL_MANUAL[i2][:2]
            stats["cap_manual"] += 1
        elif cap_names:
            stats["cap_none"].append((i2, c["name"]["common"], cap_names))

        # ── population: World Bank, else Wikidata
        pop, popy = wb_latest(pop_s, c3)
        if pop is not None:
            pop, popy = int(round(pop)), int(popy)
            stats["pop_wb"] += 1
        else:
            wp = wd_pop.get(i2)
            if wp:
                popy, pop = int(wp[0][0]), int(wp[0][1])
                stats["pop_wd"] += 1
            else:
                stats["pop_none"].append((i2, c["name"]["common"]))

        # ── GDP per capita (current US$), World Bank only
        gdp, gdpy = wb_latest(gdp_s, c3)
        if gdp is not None:
            gdp, gdpy = int(round(gdp)), int(gdpy)
            stats["gdp_wb"] += 1
            stats["gdp_years"][gdpy] = stats["gdp_years"].get(gdpy, 0) + 1
        else:
            stats["gdp_none"].append((i2, c["name"]["common"]))

        # ── area: mledoze km2 (-1 = unknown), Wikidata P2046 as fallback + cross-check.
        wda = wd_area.get(i2)
        wda = sorted(wda)[len(wda) // 2] if wda else None      # median if several
        area = c["area"]
        area = area if isinstance(area, (int, float)) and area > 0 else None
        if area is None and wda:
            area = wda
            stats["area_wd"] += 1
        elif area is not None:
            stats["area_mledoze"] += 1
            if wda and area > 100 and abs(area - wda) / float(area) > 0.05:
                stats["area_disagree"].append((i2, c["name"]["common"], area, wda))
        if area is None:
            stats["area_none"].append((i2, c["name"]["common"]))
        else:
            # keep 2 decimals for micro-states (Vatican 0.44 km2) so nothing rounds to 0
            area = round(area, 2) if area < 100 else int(round(area))

        locked = 1 if c["landlocked"] else 0
        bord = sorted(raw_bord[i2])
        lat_for_hemi = capll[0] if capll else c["latlng"][0]

        r = {
            "i": i2,
            "n": c["name"]["common"],
            "n3": c3,
            "num": int(c["ccn3"]) if c["ccn3"] else None,
            "reg": c["region"],
            "sub": c["subregion"] or c["region"],
            "ll": [round(c["latlng"][0], 2), round(c["latlng"][1], 2)],
            "locked": locked,
            "bord": bord,
            "island": 1 if (not bord and not locked) else 0,
            "hemi": "N" if lat_for_hemi >= 0 else "S",
            "un": 1 if c["unMember"] else 0,
            "ind": 1 if c["independent"] else 0,
            "lang": list(c["languages"].values())[:3],
            "cur": [v["name"] for v in c["currencies"].values()][:2],
            "tld": (c["tld"] or [""])[0],
            "demo": (c.get("demonyms", {}).get("eng") or {}).get("m") or None,
        }
        if cap_names:
            r["cap"] = cap_names[0]
        if capll:
            r["capll"] = [round(capll[0], 2), round(capll[1], 2)]
        if area is not None:
            r["area"] = area
        if pop is not None:
            r["pop"] = pop
            r["popYear"] = popy
        if gdp is not None:
            r["gdppc"] = gdp
        al = build_aliases(c)
        if al:
            r["alt"] = al
        if r["demo"] is None:
            del r["demo"]
        if r["num"] is None:
            del r["num"]
        # stable key order for a diffable file
        order = ["i", "n", "n3", "num", "cap", "capll", "ll", "reg", "sub", "pop",
                 "popYear", "gdppc", "area", "locked", "bord", "lang",
                 "cur", "un", "ind", "alt", "demo", "island", "hemi", "tld"]
        recs.append({k: r[k] for k in order if k in r})

    # ── emit ──────────────────────────────────────────────────────────────────
    body = "[\n" + ",\n".join(
        json.dumps(r, ensure_ascii=True, separators=(",", ":")) for r in recs
    ) + "\n]"
    gy = sorted(stats["gdp_years"].items(), reverse=True)
    header = (
        "/* core/data/countries.js -- window.AD_COUNTRIES (%d records, ISO2-keyed)\n"
        "\n"
        "   SOURCES\n"
        "     mledoze/countries (ODbL) via _build/countries-full.json -- names, ISO codes,\n"
        "       region/subregion, capital names, centroid latlng, landlocked, land borders,\n"
        "       area (km2), languages, currencies, demonyms, tld, UN + independence flags.\n"
        "     Wikidata (CC0) P36+P625 and Natural Earth 10m populated places (public domain)\n"
        "       -- capital coordinates `capll` [lat,lon]; Wikidata P2046 -- area fallback.\n"
        "     World Bank API v2 (CC BY 4.0) -- SP.POP.TOTL -> `pop`/`popYear`,\n"
        "       NY.GDP.PCAP.CD -> `gdppc` (GDP per capita, current US$). Latest non-null\n"
        "       observation in %s. Wikidata P1082 fills `pop` where the World Bank has no\n"
        "       series (territories, Taiwan, Vatican City); `popYear` is per country.\n"
        "       `gdppc` observation years: %s.\n"
        "\n"
        "   DERIVED (not copied from any source)\n"
        "     locked  1 if landlocked.\n"
        "     island  1 if the country has NO land border and is not landlocked.\n"
        "     hemi    'N'/'S' from capital latitude, falling back to centroid latitude.\n"
        "     bord    borders converted cca3 -> ISO2, and SYMMETRISED: mledoze's one-way\n"
        "             LKA->IND edge is dropped, so Sri Lanka is correctly island:1.\n"
        "\n"
        "   Optional fields are OMITTED when unknown rather than zero-filled:\n"
        "   cap, capll, area, pop, popYear, gdppc, alt, demo, num. Non-sovereign\n"
        "   territories are kept but carry ind:0 / un:0 -- most games should filter un===1.\n"
        "\n"
        "   Generated by _build/gen_countries.py -- do not hand-edit. */\n"
    ) % (len(recs), WB_YEARS, ", ".join("%d:%d" % t for t in gy))
    tail = (
        "\nwindow.AD_COUNTRIES_BY = (function (a, o) {\n"
        "  for (var k = 0; k < a.length; k++) { o[a[k].i] = a[k]; }\n"
        "  return o;\n"
        "})(window.AD_COUNTRIES, {});\n"
        "window.AD_C = function (iso2) {\n"
        "  return window.AD_COUNTRIES_BY[String(iso2 || '').toUpperCase()] || null;\n"
        "};\n"
    )
    js = header + "window.AD_COUNTRIES = " + body + ";\n" + tail
    outdir = os.path.dirname(OUT)
    if not os.path.isdir(outdir):
        os.makedirs(outdir)
    with open(OUT, "w") as f:
        f.write(js)

    report(recs, js, stats)


# ── self-check ────────────────────────────────────────────────────────────────
def report(recs, js, st):
    P = print
    P("=" * 78)
    P("countries.js SELF-CHECK")
    P("=" * 78)
    nbytes = len(js.encode("utf-8"))
    P("records                : %d" % len(recs))
    P("bytes                  : %d  (%.1f KB)  budget 90 KB -> %s"
      % (nbytes, nbytes / 1024.0, "OK" if nbytes <= BUDGET else "OVER"))

    by = {r["i"]: r for r in recs}
    P("unique ISO2 keys       : %d  (%s)"
      % (len(by), "OK" if len(by) == len(recs) else "DUPLICATES!"))

    # payload must be strict JSON
    m = re.search(r"window\.AD_COUNTRIES = (\[.*\n\]);\n", js, re.S)
    parsed = json.loads(m.group(1))
    P("payload strict-JSON     : OK (%d parsed)" % len(parsed))
    P("ASCII-only file         : %s" % ("yes" if js.isascii() else "NO"))

    ncap = sum(1 for r in recs if "cap" in r)
    ncapll = sum(1 for r in recs if "capll" in r)
    P("")
    P("capital NAMES           : %d / %d" % (ncap, len(recs)))
    P("capital COORDS          : %d / %d   (wikidata %d, natural-earth %d, manual %d)"
      % (ncapll, len(recs), st["cap_wd"], st["cap_ne"], st["cap_manual"]))
    nocap = [r["i"] for r in recs if "cap" not in r]
    P("  no capital at all     : %s" % nocap)
    P("  has capital, no coords: %s" % [x[0] for x in st["cap_none"]])
    P("  WD-vs-NaturalEarth deltas > 0.5 deg: %d" % len(st["cap_disagree"]))
    for d in sorted(st["cap_disagree"], key=lambda x: -x[2])[:8]:
        P("     %s cap=%-14s delta=%.2f deg  wd=%s %s  ne=%s %s"
          % (d[0], d[1], d[2], d[3], d[4], d[5], d[6]))
    P("  resolved by preferring Natural Earth: %s" % (st["cap_label_swap"] or "none"))

    npop = sum(1 for r in recs if "pop" in r)
    ngdp = sum(1 for r in recs if "gdppc" in r)
    narea = sum(1 for r in recs if "area" in r)
    P("")
    P("population              : %d / %d   (worldbank %d, wikidata %d)"
      % (npop, len(recs), st["pop_wb"], st["pop_wd"]))
    P("  missing               : %s" % [x[0] for x in st["pop_none"]])
    yrs = {}
    for r in recs:
        if "popYear" in r:
            yrs[r["popYear"]] = yrs.get(r["popYear"], 0) + 1
    P("  popYear histogram     : %s" % sorted(yrs.items(), reverse=True))
    P("gdp per capita          : %d / %d   years %s"
      % (ngdp, len(recs), sorted(st["gdp_years"].items(), reverse=True)))
    P("  missing (n=%d)         : %s" % (len(st["gdp_none"]), [x[0] for x in st["gdp_none"]]))
    P("area                    : %d / %d   (mledoze %d, wikidata-fallback %d)  missing %s"
      % (narea, len(recs), st["area_mledoze"], st["area_wd"],
         [x[0] for x in st["area_none"]] or "none"))
    P("  area disagreements >5%% vs Wikidata P2046: %d" % len(st["area_disagree"]))
    for d in st["area_disagree"][:12]:
        P("     %s %-30s mledoze=%s wikidata=%s" % (d[0], d[1], d[2], d[3]))

    P("")
    P("un=1                    : %d" % sum(1 for r in recs if r["un"] == 1))
    P("ind=1                   : %d" % sum(1 for r in recs if r["ind"] == 1))
    P("locked=1                : %d  %s"
      % (sum(1 for r in recs if r["locked"]), [r["i"] for r in recs if r["locked"]]))
    P("island=1                : %d" % sum(1 for r in recs if r["island"]))
    P("island=1 & un=1         : %d" % sum(1 for r in recs if r["island"] and r["un"]))
    P("hemi N / S              : %d / %d"
      % (sum(1 for r in recs if r["hemi"] == "N"), sum(1 for r in recs if r["hemi"] == "S")))
    P("with alt aliases        : %d" % sum(1 for r in recs if "alt" in r))
    P("with lang               : %d ; with cur: %d ; with demo: %d"
      % (sum(1 for r in recs if r["lang"]), sum(1 for r in recs if r["cur"]),
         sum(1 for r in recs if "demo" in r)))

    # borders resolve
    bad = []
    total_edges = 0
    for r in recs:
        for b in r["bord"]:
            total_edges += 1
            if b not in by:
                bad.append((r["i"], b))
    P("")
    P("border edges            : %d ; unresolved: %d %s"
      % (total_edges, len(bad), bad if bad else ""))
    # symmetry check (a real invariant: borders should be mutual)
    asym = []
    for r in recs:
        for b in r["bord"]:
            if b in by and r["i"] not in by[b]["bord"]:
                asym.append((r["i"], b))
    P("asymmetric border pairs : %d %s" % (len(asym), asym if asym else ""))
    P("one-way source edges dropped by symmetrisation: %s"
      % (st["dropped_edges"] or "none"))
    dropped = 0
    with open(MLEDOZE) as f:
        for c in json.load(f):
            dropped += sum(1 for b in c["borders"] if b not in ISO3_TO_ISO2)
    P("cca3 border codes with no ISO2 in file: %d" % dropped)

    # spot-check families
    P("")
    P("landlocked AND island   : %d (must be 0)"
      % sum(1 for r in recs if r["locked"] and r["island"]))
    P("has bord AND island     : %d (must be 0)"
      % sum(1 for r in recs if r["bord"] and r["island"]))

    ar = [r for r in recs if "area" in r]
    P("")
    P("10 LARGEST by area:")
    for r in sorted(ar, key=lambda r: -r["area"])[:10]:
        P("   %-3s %-26s %12s km2" % (r["i"], r["n"], r["area"]))
    P("10 SMALLEST by area:")
    for r in sorted(ar, key=lambda r: r["area"])[:10]:
        P("   %-3s %-26s %12s km2" % (r["i"], r["n"], r["area"]))
    P("10 LARGEST by population:")
    for r in sorted([x for x in recs if "pop" in x], key=lambda r: -r["pop"])[:10]:
        P("   %-3s %-26s %13d  (%d)" % (r["i"], r["n"], r["pop"], r["popYear"]))

    P("")
    P("FULL RECORDS (contract spot-check):")
    for k in ("IR", "GB", "US", "TJ"):
        P("   " + json.dumps(by[k], ensure_ascii=False, sort_keys=False))
    P("")
    js_ok = jsc_check()
    P("=" * 78)
    ok = (nbytes <= BUDGET and not bad and not asym and len(by) == len(recs)
          and len(parsed) == len(recs) and js_ok is not False and js.isascii())
    P("RESULT: %s" % ("PASS" if ok else "FAIL"))
    return ok


JSC = ("/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc")

HARNESS = r"""
var window = this;
load(%r);
var A = window.AD_COUNTRIES, BY = window.AD_COUNTRIES_BY, C = window.AD_C;
function req(label, cond) { print((cond ? "  ok   " : "  FAIL ") + label); if (!cond) fails++; }
var fails = 0;
req("AD_COUNTRIES is an Array of " + A.length, Array.isArray(A) && A.length > 0);
req("AD_COUNTRIES_BY has " + Object.keys(BY).length + " keys", Object.keys(BY).length === A.length);
req("AD_C is a function", typeof C === "function");
req("AD_C('ir') is case-insensitive -> " + (C('ir') && C('ir').n), C('ir') === BY.IR);
req("AD_C('IR') is identity-equal to BY.IR", C('IR') === BY.IR);
req("AD_C('ZZ') === null", C('ZZ') === null);
req("AD_C(null)/AD_C(undefined)/AD_C('') === null",
    C(null) === null && C(undefined) === null && C('') === null);
var bad = 0, i, j;
for (i = 0; i < A.length; i++) { for (j = 0; j < A[i].bord.length; j++) { if (!BY[A[i].bord[j]]) bad++; } }
req("every bord code resolves via AD_COUNTRIES_BY (" + bad + " misses)", bad === 0);
req("Vatican area survives rounding: " + BY.VA.area, BY.VA.area > 0);
req("Sri Lanka island=1 with no borders", BY.LK.island === 1 && BY.LK.bord.length === 0);
req("Iran/UK/USA/Tajikistan all present with capll",
    !!(BY.IR.capll && BY.GB.capll && BY.US.capll && BY.TJ.capll));
print(fails === 0 ? "JSC: ALL PASS" : ("JSC: " + fails + " FAILURES"));
"""


def jsc_check():
    """Actually execute the emitted file in JavaScriptCore (ships with macOS)."""
    import subprocess
    import tempfile
    if not os.path.exists(JSC):
        print("JS ENGINE CHECK        : skipped (no jsc on this machine)")
        return None
    fd, path = tempfile.mkstemp(suffix=".js")
    with os.fdopen(fd, "w") as f:
        f.write(HARNESS % OUT)
    try:
        p = subprocess.run([JSC, path], capture_output=True, text=True)
    finally:
        os.unlink(path)
    print("JS ENGINE CHECK (JavaScriptCore executes the real file):")
    print((p.stdout or "").rstrip())
    if p.returncode != 0 or p.stderr.strip():
        print("  jsc stderr: " + p.stderr.strip())
    return p.returncode == 0 and "ALL PASS" in (p.stdout or "")


# built after MLEDOZE is known to exist, used inside main()
with open(MLEDOZE, "r") as _f:
    ISO3_TO_ISO2 = {c["cca3"]: c["cca2"] for c in json.load(_f)}

if __name__ == "__main__":
    main()
