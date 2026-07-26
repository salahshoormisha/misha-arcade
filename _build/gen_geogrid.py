#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_geogrid.py -- builds core/data/geogrid.js  (window.AD_GEOGRID)

The criteria system behind GEOGRID, the 3x3 immaculate-grid geography cabinet.

WHY THIS SCRIPT IS SHAPED THE WAY IT IS
---------------------------------------
Every criterion ships as a JS *expression string* over a countries.js record `c`
(plus `G`, a bag of authored membership sets).  The rarity numbers, the answer
lists and the pair-intersection table therefore have to agree EXACTLY with what
the browser will compute at runtime.  Rather than re-implement the predicates in
Python (and risk drift), this script evaluates the real JS expressions in a real
JS engine: macOS ships JavaScriptCore behind `osascript -l JavaScript`, which is
present on every Mac and needs no install.  Same strings, same engine family,
no transpiler.

The emitted file is then re-loaded in that same engine and self-tested:
buildGrid() is run over 500 seeds and every one of the 9 cells of every grid is
checked for >= 2 valid answers.

Deterministic: no network, no randomness, no clock.  Re-runnable.

Usage
    python3 _build/gen_geogrid.py           # tune-report, emit, self-test
    python3 _build/gen_geogrid.py --probe   # tune-report only, do not emit
"""

import json
import math
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH = os.path.join(ROOT, "core", "data", "geogrid.js")

# ═══════════════════════════════════════════════════════════════════════════
# 1.  AUTHORED MEMBERSHIP SETS
#     Hand-checked ISO2 lists.  These are the facts the data file cannot
#     derive.  Every list carries the count I verified it against.
# ═══════════════════════════════════════════════════════════════════════════

SETS = {}
SRC = {}


def S(key, codes, count, source):
    codes = sorted(set(codes))
    assert len(codes) == count, "%s: expected %d, authored %d" % (key, count, len(codes))
    SETS[key] = codes
    SRC[key] = source


# ── supranational / political ──────────────────────────────────────────────
S("EU", """AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO
           SK SI ES SE""".split(), 27,
  "European Union, 27 members (post-Brexit; Croatia joined 2013).")

S("NATO", """AL BE BG CA HR CZ DK EE FI FR DE GR HU IS IT LV LT LU ME NL MK NO
             PL PT RO SK SI ES SE TR GB US""".split(), 32,
  "NATO, 32 members (Finland Apr 2023, Sweden Mar 2024).")

S("COMMONWEALTH", """AG AU BS BD BB BZ BW BN CM CA CY DM SZ FJ GA GM GH GD GY IN
                     JM KE KI LS MW MY MV MT MU MZ NA NR NZ NG PK PG RW KN LC VC
                     WS SC SL SG SB ZA LK TZ TG TO TT TV UG GB VU ZM""".split(), 56,
  "Commonwealth of Nations, 56 members (Gabon + Togo joined 2022; Zimbabwe is "
  "NOT a member, it withdrew in 2003).")

S("OPEC", "DZ CG GQ GA IR IQ KW LY NG SA AE VE".split(), 12,
  "OPEC, 12 members (Angola left Jan 2024; Ecuador 2020; Qatar 2019; "
  "Indonesia suspended 2016).")

S("ASEAN", "BN KH ID LA MY MM PH SG TH VN TL".split(), 11,
  "ASEAN, 11 members (Timor-Leste admitted at the 47th summit, Oct 2025).")

S("AU", """DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH
           GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA
           SS SD TZ TG TN UG ZM ZW""".split(), 54,
  "African Union: 55 members; the 54 here are the UN member states. The 55th, "
  "the Sahrawi Republic (Western Sahara), is not a UN member.")

S("ARAB_LEAGUE", """DZ BH KM DJ EG IQ JO KW LB LY MR MA OM QA SA SO SD SY TN AE
                    YE""".split(), 21,
  "Arab League: 22 members; the 22nd, Palestine, is un:0 in countries.js. "
  "Syria was suspended 2011 and readmitted May 2023.")

S("OECD", """AU AT BE CA CL CO CR CZ DK EE FI FR DE GR HU IS IE IL IT JP KR LV LT
             LU MX NL NZ NO PL PT SK SI ES SE CH TR GB US""".split(), 38,
  "OECD, 38 members (Costa Rica joined 2021).")

S("G20", "AR AU BR CA CN FR DE IN ID IT JP MX RU SA ZA KR TR GB US".split(), 19,
  "G20: the 19 member COUNTRIES (the EU and the African Union are the other "
  "two members and are not countries).")

S("NUCLEAR", "US RU GB FR CN IN PK KP IL".split(), 9,
  "The nine states possessing nuclear weapons (five NPT-recognised plus India, "
  "Pakistan, North Korea and Israel, which has never confirmed its arsenal).")

S("USSR", "AM AZ BY EE GE KZ KG LV LT MD RU TJ TM UA UZ".split(), 15,
  "The 15 successor states of the Soviet Union.")

S("MONARCHY", """AG AU BS BZ CA GD JM NZ PG KN LC VC SB TV GB
                 AD BE DK LI LU MC NL NO ES SE VA
                 BH BT BN KH JP JO KW MY OM QA SA TH AE
                 SZ LS MA TO""".split(), 43,
  "43 sovereign monarchies: 15 Commonwealth realms incl. the UK, 11 in Europe "
  "(Vatican City is an elective absolute monarchy), 13 in Asia, 3 in Africa, "
  "Tonga in Oceania. Barbados is NOT here -- it became a republic in 2021.")

S("DRIVES_LEFT", """BW SZ KE LS MW MU MZ NA SC ZA TZ UG ZM ZW
                    BD BT BN TL IN ID JP MY MV NP PK SG LK TH
                    CY IE MT GB
                    AU FJ KI NR NZ PG WS SB TO TV
                    AG BS BB DM GD GY JM KN LC VC SR TT""".split(), 54,
  "54 UN member states that drive on the left (Samoa switched to the left in "
  "2009). Guyana and Suriname are the only two in mainland South America.")

S("OLYMPIC_HOST", "GR FR US GB SE BE NL DE FI AU IT JP MX CA RU KR ES CN BR".split(), 19,
  "Countries that have hosted a Summer Olympic Games, 1896-2024. Russia is "
  "here for Moscow 1980 (as the USSR).")

S("WC_WINNERS", "BR DE IT AR FR UY ES GB".split(), 8,
  "The 8 winners of the men's FIFA World Cup. The UK appears for England 1966 "
  "-- England is not a separate ISO 3166-1 country.")

# ── physical geography that countries.js cannot derive ─────────────────────
S("MEDITERRANEAN", """ES FR MC IT SI HR BA ME AL GR TR CY SY LB IL EG LY TN DZ MA
                      MT""".split(), 21,
  "The 21 UN member states with a Mediterranean Sea coastline (Bosnia has "
  "~20 km at Neum). Portugal is Atlantic-only and is not here.")

S("EQUATOR", "ST GA CG CD UG KE SO ID EC CO BR".split(), 11,
  "The 11 countries the Equator crosses on LAND. It also runs through the "
  "territorial waters of the Maldives and Kiribati, which are excluded.")

# ── language: official status, authored because countries.js truncates ─────
# countries.js keeps only the first THREE languages per country, so its `lang`
# field silently drops Spanish from Bolivia, English from Burundi, etc.  These
# lists are authored instead.
S("LANG_EN", """BW BI CM SZ GM GH KE LS LR MW MU NA NG RW SC SL ZA SS SD TZ UG
                ZM ZW
                IN PK PH SG
                IE MT GB
                AG BS BB BZ CA DM GD GY JM KN LC VC TT US
                AU FJ KI MH FM NR NZ PW PG WS SB TO TV VU""".split(), 58,
  "English has official or co-official status (de jure, or de facto and "
  "universally listed as such: Australia, the UK). Malaysia and Sri Lanka are "
  "excluded -- English is not official in either.")

S("LANG_FR", """BE BJ BF BI CM CA CF TD KM CG CD CI DJ GQ FR GA GN HT LU MG ML MC
                NE RW SN SC CH TG VU""".split(), 29,
  "French is an official OR working language. The 'working' hedge matters: "
  "Mali (2023), Burkina Faso (2023) and Niger (2025) demoted French from "
  "official to working language.")

S("LANG_ES", """AR BO CL CO CR CU DO EC SV GQ GT HN MX NI PA PY PE ES UY VE""".split(), 20,
  "The 20 countries with Spanish as an official language. Belize is NOT here "
  "-- English is its sole official language.")

S("LANG_AR", """DZ BH KM DJ EG IQ JO KW LB LY MR MA OM QA SA SO SD SY TN AE YE
                TD""".split(), 22,
  "Arabic is an official language: the 21 UN-member Arab League states plus "
  "Chad. Israel is excluded -- Arabic lost official status there in 2018.")

S("LANG_PT", "AO BR CV GW GQ MZ PT ST TL".split(), 9,
  "The 9 sovereign Portuguese-speaking countries (the CPLP minus its "
  "non-Lusophone associates).")

S("LANG_SLAVIC", "BY BA BG HR CZ ME MK PL RU RS SK SI UA".split(), 13,
  "A Slavic language is the state language. Kazakhstan and Kyrgyzstan, where "
  "Russian is co-official but the state language is Turkic, are excluded.")

# Romance = the Spanish/Portuguese/French sets plus the Italian, Romanian and
# Catalan states.  Derived here so it can never drift from its parts.
SETS["LANG_ROMANCE"] = sorted(set(
    SETS["LANG_ES"] + SETS["LANG_PT"] + SETS["LANG_FR"] +
    ["IT", "SM", "VA", "RO", "MD", "AD"]))
SRC["LANG_ROMANCE"] = ("Union of the Spanish, Portuguese and French sets plus "
                       "Italy, San Marino, Vatican City (Italian), Romania and "
                       "Moldova (Romanian) and Andorra (Catalan).")


# ═══════════════════════════════════════════════════════════════════════════
# 2.  CRITERIA
#     `test` is a JS expression over `c` (a countries.js record) and `G`
#     (SETS, turned into {ISO2:1} lookup maps at load).
# ═══════════════════════════════════════════════════════════════════════════

def K(cid, label, group, test, note=None, hint=None):
    d = {"id": cid, "label": label, "group": group, "test": test}
    if note:
        d["note"] = note
    if hint:
        d["hint"] = hint
    return d


CRITERIA = [
    # ── region ────────────────────────────────────────────────────────────
    K("reg_africa",   "In Africa",          "region", "c.reg==='Africa'"),
    K("reg_asia",     "In Asia",            "region", "c.reg==='Asia'"),
    K("reg_europe",   "In Europe",          "region", "c.reg==='Europe'"),
    K("reg_americas", "In the Americas",    "region", "c.reg==='Americas'"),
    K("reg_oceania",  "In Oceania",         "region", "c.reg==='Oceania'"),

    # ── subregion ─────────────────────────────────────────────────────────
    K("sub_carib",   "In the Caribbean",      "subregion", "c.sub==='Caribbean'"),
    K("sub_samerica", "In South America",     "subregion", "c.sub==='South America'"),
    K("sub_wafrica", "In West Africa",        "subregion", "c.sub==='Western Africa'"),
    K("sub_eafrica", "In East Africa",        "subregion", "c.sub==='Eastern Africa'"),
    K("sub_wasia",   "In Western Asia",       "subregion", "c.sub==='Western Asia'",
      note="The UN's 'Western Asia' -- the Middle East plus the South Caucasus."),
    K("sub_seasia",  "In Southeast Asia",     "subregion", "c.sub==='South-Eastern Asia'"),
    K("sub_neurope", "In Northern Europe",    "subregion", "c.sub==='Northern Europe'"),
    K("sub_balkans", "In Southeast Europe",   "subregion", "c.sub==='Southeast Europe'"),
    K("sub_sasia",   "In Southern or Central Asia", "subregion",
      "c.sub==='Southern Asia'||c.sub==='Central Asia'"),

    # ── land & water ──────────────────────────────────────────────────────
    K("landlocked", "Landlocked", "water", "c.locked===1"),
    K("island",     "Island nation (no land borders)", "water", "c.island===1"),
    K("coastal_mainland", "Has a coastline AND a land border", "water",
      "c.locked===0&&c.island===0"),
    K("mediterranean", "Has a Mediterranean coastline", "water", "!!G.MEDITERRANEAN[c.i]"),
    K("equator", "The Equator crosses it", "water", "!!G.EQUATOR[c.i]"),

    # ── hemisphere & capital position ─────────────────────────────────────
    K("hemi_s", "In the Southern Hemisphere", "hemi", "c.hemi==='S'",
      note="Hemisphere is taken from the capital's latitude."),
    K("cap_tropics", "Capital inside the tropics", "caplat",
      "!!c.capll&&Math.abs(c.capll[0])<23.44",
      note="Capital latitude within 23.44 degrees of the Equator."),
    K("cap_n45", "Capital north of 45°N", "caplat", "!!c.capll&&c.capll[0]>=45"),
    K("cap_n35", "Capital north of 35°N", "caplat", "!!c.capll&&c.capll[0]>=35"),
    K("cap_west", "Capital west of the Prime Meridian", "caplon",
      "!!c.capll&&c.capll[1]<0"),
    K("cap_east90", "Capital east of 90°E", "caplon", "!!c.capll&&c.capll[1]>=90"),

    # ── population ────────────────────────────────────────────────────────
    K("pop_100m", "Population over 100 million", "pop", "c.pop>1e8"),
    K("pop_25m",  "Population over 25 million",  "pop", "c.pop>2.5e7"),
    K("pop_u5m",  "Population under 5 million",  "pop", "c.pop<5e6"),
    K("pop_u1m",  "Population under 1 million",  "pop", "c.pop<1e6"),

    # ── area ──────────────────────────────────────────────────────────────
    K("area_1m",  "Bigger than 1,000,000 km²", "area", "c.area>1e6"),
    K("area_250k", "Bigger than 250,000 km²",  "area", "c.area>2.5e5"),
    K("area_u25k", "Smaller than 25,000 km²",  "area", "c.area<2.5e4"),

    # ── borders ───────────────────────────────────────────────────────────
    K("bord_5", "Borders 5 or more countries", "border", "(c.bord||[]).length>=5"),
    K("bord_7", "Borders 7 or more countries", "border", "(c.bord||[]).length>=7"),
    K("bord_1", "Borders exactly one country", "border", "(c.bord||[]).length===1"),
    K("bord_24", "Borders 2, 3 or 4 countries", "border",
      "(c.bord||[]).length>=2&&(c.bord||[]).length<=4"),

    # ── economy ───────────────────────────────────────────────────────────
    K("gdp_30k", "GDP per capita over $30,000", "gdp", "c.gdppc>30000",
      note="World Bank NY.GDP.PCAP.CD, current US$, latest year 2018-2024."),
    K("gdp_12k", "GDP per capita over $12,000", "gdp", "c.gdppc>12000"),
    K("gdp_u2k", "GDP per capita under $2,000", "gdp", "!!c.gdppc&&c.gdppc<2000"),
    K("gdp_u6k", "GDP per capita under $6,000", "gdp", "!!c.gdppc&&c.gdppc<6000"),

    # ── language ──────────────────────────────────────────────────────────
    K("lang_en", "English is an official language", "lang", "!!G.LANG_EN[c.i]"),
    K("lang_fr", "French is an official or working language", "lang", "!!G.LANG_FR[c.i]"),
    K("lang_es", "Spanish is an official language", "lang", "!!G.LANG_ES[c.i]"),
    K("lang_ar", "Arabic is an official language", "lang", "!!G.LANG_AR[c.i]"),
    K("lang_pt", "Portuguese is an official language", "lang", "!!G.LANG_PT[c.i]"),
    K("lang_romance", "A Romance language is official", "lang", "!!G.LANG_ROMANCE[c.i]"),
    K("lang_slavic", "A Slavic language is official", "lang", "!!G.LANG_SLAVIC[c.i]"),

    # ── currency ──────────────────────────────────────────────────────────
    K("cur_euro", "Uses the euro", "cur", "(c.cur||[]).indexOf('Euro')>=0"),
    K("cur_dollar", "Its currency is called a dollar", "cur",
      "(c.cur||[]).join('|').toLowerCase().indexOf('dollar')>=0"),
    K("cur_franc", "Its currency is called a franc", "cur",
      "(c.cur||[]).join('|').toLowerCase().indexOf('franc')>=0"),
    K("cur_usd", "Uses the US dollar", "cur",
      "(c.cur||[]).indexOf('United States dollar')>=0"),

    # ── organisations & politics ──────────────────────────────────────────
    K("org_eu", "European Union member", "org", "!!G.EU[c.i]"),
    K("org_nato", "NATO member", "org", "!!G.NATO[c.i]"),
    K("org_commonwealth", "Commonwealth of Nations member", "org", "!!G.COMMONWEALTH[c.i]"),
    K("org_opec", "OPEC member", "org", "!!G.OPEC[c.i]"),
    K("org_asean", "ASEAN member", "org", "!!G.ASEAN[c.i]"),
    K("org_au", "African Union member", "org", "!!G.AU[c.i]"),
    K("org_arab", "Arab League member", "org", "!!G.ARAB_LEAGUE[c.i]"),
    K("org_oecd", "OECD member", "org", "!!G.OECD[c.i]"),
    K("org_g20", "G20 member", "org", "!!G.G20[c.i]"),
    K("pol_monarchy", "Has a monarch as head of state", "pol", "!!G.MONARCHY[c.i]"),
    K("pol_left", "Drives on the left", "pol", "!!G.DRIVES_LEFT[c.i]"),
    K("pol_nuclear", "Has nuclear weapons", "pol", "!!G.NUCLEAR[c.i]"),
    K("pol_ussr", "Was part of the Soviet Union", "pol", "!!G.USSR[c.i]"),
    K("pol_olympics", "Has hosted a Summer Olympics", "pol", "!!G.OLYMPIC_HOST[c.i]"),
    K("pol_worldcup", "Has won the men's World Cup", "pol", "!!G.WC_WINNERS[c.i]"),

    # ── name shape ────────────────────────────────────────────────────────
    # "Name is a single word" is the obvious way round, but 161 of 194 countries
    # satisfy it (rarity 0.83) and a cell that 83% of the world can fill teaches
    # nothing. Its complement is the same fact, in band, and much better to play.
    K("nm_multiword", "Name is more than one word", "name", "c.n.indexOf(' ')>=0",
      note="Two or more words: South Africa yes, Botswana no. Stated this way "
           "round because a single-word name is true of 83% of countries -- far "
           "too common to make a cell mean anything."),
    K("nm_3words", "Name is three or more words", "name", "c.n.split(' ').length>=3"),
    K("nm_double", "Name contains a double letter", "name",
      "/([A-Za-z])\\1/.test(c.n)",
      note="Two identical letters side by side, e.g. GreEce, FinLLand-style."),
    K("nm_bookend", "Name starts and ends with the same letter", "name",
      "c.n.charAt(0).toLowerCase()===c.n.charAt(c.n.length-1).toLowerCase()"),
    K("nm_long", "Name has 10 or more letters", "name",
      "c.n.replace(/[^A-Za-z]/g,'').length>=10"),
    K("nm_vowel", "Name starts with a vowel", "name",
      "'AEIOU'.indexOf(c.n.charAt(0).toUpperCase())>=0"),
    K("nm_ends_a", "Name ends in the letter A", "name",
      "c.n.charAt(c.n.length-1).toLowerCase()==='a'"),
    K("nm_cap_same", "Capital starts with the same letter as the country", "name",
      "!!c.cap&&c.cap.charAt(0).toLowerCase()===c.n.charAt(0).toLowerCase()"),
    K("nm_cap_multiword", "Capital's name is more than one word", "name",
      "!!c.cap&&c.cap.indexOf(' ')>=0",
      note="Mexico City, Buenos Aires, Kuala Lumpur, Port Moresby. Stated this "
           "way round for the same reason as the country-name one: 87% of "
           "capitals are a single word."),
]


# ═══════════════════════════════════════════════════════════════════════════
# 3.  LOAD countries.js
# ═══════════════════════════════════════════════════════════════════════════

def load_countries():
    src = open(os.path.join(ROOT, "core", "data", "countries.js"), encoding="utf-8").read()
    marker = "window.AD_COUNTRIES = "
    i = src.index(marker)
    j = src.index("\n];", i)
    return json.loads(src[i + len(marker):j + 2])


# ═══════════════════════════════════════════════════════════════════════════
# 4.  JS EVALUATION BRIDGE  (JavaScriptCore via osascript -l JavaScript)
# ═══════════════════════════════════════════════════════════════════════════

JS_PRELUDE = r"""
ObjC.import('Foundation');
function __write(path, txt) {
  var s = $.NSString.alloc.initWithUTF8String(txt);
  s.writeToFileAtomicallyEncodingError(path, true, $.NSUTF8StringEncoding, $());
}
function __outPath() {
  return ObjC.unwrap($.NSProcessInfo.processInfo.environment.objectForKey('GEOGRID_OUT'));
}
"""


def run_js(body, payload_files=None):
    """Run `body` in JavaScriptCore. `body` must call __write(__outPath(), json)."""
    tmpdir = tempfile.mkdtemp(prefix="geogrid_")
    js_path = os.path.join(tmpdir, "run.js")
    out_path = os.path.join(tmpdir, "out.json")
    with open(js_path, "w", encoding="utf-8") as fh:
        fh.write(JS_PRELUDE)
        for p in (payload_files or []):
            fh.write(open(p, encoding="utf-8").read())
            fh.write("\n")
        fh.write(body)
    env = dict(os.environ)
    env["GEOGRID_OUT"] = out_path
    proc = subprocess.run(["osascript", "-l", "JavaScript", js_path],
                          capture_output=True, env=env, text=True)
    if proc.returncode != 0 or not os.path.exists(out_path):
        sys.stderr.write("--- JS stdout ---\n%s\n--- JS stderr ---\n%s\n"
                         % (proc.stdout, proc.stderr))
        raise SystemExit("JS evaluation failed")
    return json.loads(open(out_path, encoding="utf-8").read())


def evaluate_criteria(pool, criteria, sets):
    """Return {criterion_id: [iso2, ...]} by running the real JS expressions."""
    body = """
var POOL = %s;
var SETSRC = %s;
var CRIT = %s;
var G = {};
for (var k in SETSRC) {
  var m = {};
  for (var q = 0; q < SETSRC[k].length; q++) { m[SETSRC[k][q]] = 1; }
  G[k] = m;
}
var out = {}, errs = {};
for (var t = 0; t < CRIT.length; t++) {
  var id = CRIT[t].id, hits = [];
  try {
    var fn = new Function('c', 'G', 'return !!(' + CRIT[t].test + ');');
    for (var p = 0; p < POOL.length; p++) {
      if (fn(POOL[p], G)) { hits.push(POOL[p].i); }
    }
  } catch (e) { errs[id] = String(e); }
  out[id] = hits;
}
__write(__outPath(), JSON.stringify({hits: out, errors: errs}));
'ok'
""" % (json.dumps(pool), json.dumps(sets), json.dumps(criteria))
    res = run_js(body)
    if res["errors"]:
        raise SystemExit("criteria failed to compile: %s" % json.dumps(res["errors"], indent=2))
    return res["hits"]


# ═══════════════════════════════════════════════════════════════════════════
# 5.  SALIENCE  ->  OBVIOUSNESS
# ═══════════════════════════════════════════════════════════════════════════
#
# The original GeoGrid scores a pick by how few OTHER PLAYERS made it, which
# needs a server counting live guesses.  We have no server, so we replace the
# crowd with a computable prior for "how likely is a player to think of this
# country", and score against that.  It is deterministic, so two people playing
# the same board hours apart get identical scores -- which the original, scoring
# against a drifting mid-day snapshot, does not manage.
#
#   raw(c)  = log10(pop) + 0.5 * log10(gdppc)          [= log10(pop * sqrt(gdppc))]
#   sal(c)  = (raw(c) - rawMin) / (rawMax - rawMin)     in [0, 1]
#
# The brief's suggested proxy is population x GDP per capita, i.e. total GDP.
# The GDP term is square-rooted here because pure total GDP ranks Switzerland
# above Nigeria and Luxembourg above Ethiopia -- badly wrong as a model of what
# a player thinks of first.  Halving its weight keeps wealth in the ranking
# (Norway stays ahead of Niger) without letting it swamp sheer size.
#
# Then for a cell whose valid-answer set is S:
#   w(c)     = exp(K * sal(c)),  K = 6
#   share(c) = w(c) / sum over S of w(x)        -- a softmax "pick probability",
#                                                  sums to 1 across the cell
#   obv(c)   = share(c) / max share in S        -- 0..1, the most obvious = 1.0
#
# share() is the GeoGrid-comparable number (their rarity % is literally the
# share of players who picked it), so scoring keeps their shape:
#   cellScore = 100 * share,  empty cell = 100,  board = sum of 9,  lower better.
#
GDP_WEIGHT = 0.5
SOFTMAX_K = 6.0

# The exponent the cabinet uses to turn 0-900 points into the arcade's 0-100
# `norm` (CONTRACT §3). Chosen against the calibration table the self-test
# prints, not by feel: it has to put a solid all-nine board near 70 and leave
# 100 genuinely hard. games/geogrid/game.js must use the same number.
NORM_EXP = 1.25


def compute_salience(pool):
    gdps = sorted(c["gdppc"] for c in pool if c.get("gdppc"))
    med = float(gdps[len(gdps) // 2])
    raw = {}
    for c in pool:
        pop = max(float(c.get("pop") or 1), 1.0)
        gdppc = float(c.get("gdppc") or med)
        raw[c["i"]] = math.log10(pop) + GDP_WEIGHT * math.log10(max(gdppc, 1.0))
    lo, hi = min(raw.values()), max(raw.values())
    sal = dict((k, (v - lo) / (hi - lo)) for k, v in raw.items())
    return sal, med, [c["i"] for c in pool if not c.get("gdppc")]


def obviousness_within(codes, sal):
    """0..1 obviousness for each code inside the given answer set."""
    if not codes:
        return {}
    top = max(sal[x] for x in codes)
    return dict((x, math.exp(SOFTMAX_K * (sal[x] - top))) for x in codes)


# ═══════════════════════════════════════════════════════════════════════════
# 6.  BUILD
# ═══════════════════════════════════════════════════════════════════════════

def tier_of(rarity):
    if rarity >= 0.18:
        return 1          # broad -- easy to fill
    if rarity >= 0.08:
        return 2          # medium
    return 3              # narrow -- the hard cells


def main():
    probe_only = "--probe" in sys.argv

    countries = load_countries()
    pool = [c for c in countries if c.get("un") == 1]
    pool.sort(key=lambda c: c["i"])
    N = len(pool)
    codes = set(c["i"] for c in pool)

    # every authored set must reference real, in-pool ISO2 codes
    bad = {}
    for k, v in SETS.items():
        miss = [x for x in v if x not in codes]
        if miss:
            bad[k] = miss
    if bad:
        raise SystemExit("authored sets reference codes outside the pool: %s" % bad)

    hits = evaluate_criteria(pool, CRITERIA, SETS)

    rows = []
    for cr in CRITERIA:
        h = sorted(hits[cr["id"]])
        rows.append((cr, h, len(h) / float(N)))

    # ── tuning report ─────────────────────────────────────────────────────
    print("pool: %d UN-flagged countries (countries.js un===1)" % N)
    print()
    print("%-18s %-46s %6s %7s %s" % ("id", "label", "n", "rarity", "flag"))
    dropped = []
    for cr, h, r in sorted(rows, key=lambda x: -x[2]):
        flag = ""
        if r < 0.03:
            flag = "TOO RARE"
        elif r > 0.60:
            flag = "TOO COMMON"
        if flag:
            dropped.append((cr["id"], len(h), r, flag))
        print("%-18s %-46s %6d %7.3f %s" % (cr["id"], cr["label"], len(h), r, flag))
    print()

    if probe_only:
        for k in sorted(SETS):
            print("%-16s %d" % (k, len(SETS[k])))
        return

    if dropped:
        print("!! criteria outside the 0.03-0.60 rarity band:")
        for d in dropped:
            print("   %s n=%d rarity=%.3f %s" % d)
        print()

    keep = [(cr, h, r) for cr, h, r in rows]

    sal, med_gdp, no_gdp = compute_salience(pool)

    # ── pairs, incompatible, avoid ────────────────────────────────────────
    setmap = dict((cr["id"], set(h)) for cr, h, _ in keep)
    ids = [cr["id"] for cr, _, _ in keep]
    pairs = {}
    incompatible = []
    avoid = []
    for a in range(len(ids)):
        for b in range(a + 1, len(ids)):
            ia, ib = ids[a], ids[b]
            inter = setmap[ia] & setmap[ib]
            n = len(inter)
            # Only non-zero pairs are stored -- D.both() reads a missing key as 0,
            # so the empty ones cost nothing but a lookup, and `incompatible`
            # names them explicitly anyway.
            if n:
                pairs["%s|%s" % (ia, ib)] = n
            if n < 2:
                incompatible.append([ia, ib])
            else:
                union = len(setmap[ia] | setmap[ib])
                jac = n / float(union) if union else 0.0
                cont = n / float(min(len(setmap[ia]), len(setmap[ib])))
                if jac >= 0.80 or cont >= 0.92:
                    avoid.append([ia, ib])

    # ── assemble payload ──────────────────────────────────────────────────
    crit_out = []
    answers = {}
    obv_out = {}
    for cr, h, r in keep:
        o = dict(cr)
        o["kind"] = "bool"
        o["rarity"] = round(r, 4)
        o["n"] = len(h)
        o["tier"] = tier_of(r)
        crit_out.append(o)
        answers[cr["id"]] = h
        ob = obviousness_within(h, sal)
        obv_out[cr["id"]] = [int(round(ob[x] * 1000)) for x in h]

    payload = {
        "version": 1,
        "pool": [c["i"] for c in pool],
        "poolNote": ("countries.js records with un===1: the 193 UN member states "
                     "plus Vatican City, which countries.js flags un:1 although it "
                     "is a UN permanent observer, not a member."),
        "raritySource": "computed from core/data/countries.js over the 194-country pool",
        "salienceFormula": ("sal = norm(log10(pop) + %g*log10(gdppc)); "
                            "share = softmax(%g*sal) over a cell's valid answers; "
                            "obviousness = share / maxShare in that cell"
                            % (GDP_WEIGHT, SOFTMAX_K)),
        "softmaxK": SOFTMAX_K,
        "gdpWeight": GDP_WEIGHT,
        "criteria": crit_out,
        "sets": SETS,
        "setSources": SRC,
        "answers": answers,
        "obv": obv_out,
        "salience": dict((k, int(round(v * 1000))) for k, v in sal.items()),
        "pairs": pairs,
        "incompatible": incompatible,
        "avoid": avoid,
    }

    js = render(payload)
    with open(OUT_PATH, "w", encoding="utf-8") as fh:
        fh.write(js)
    print("wrote %s  (%d bytes)" % (OUT_PATH, len(js.encode("utf-8"))))

    # ── validate: strict-JSON payload + JS self-test ──────────────────────
    verify_json(OUT_PATH)
    report = selftest(OUT_PATH, seeds=500)
    print()
    print("SELF-TEST over %d seeds" % report["seeds"])
    print("  grid failures        : %d" % report["failures"])
    print("  mean answers per cell: %.1f" % report["meanCell"])
    print("  min answers in a cell: %d" % report["minCell"])
    print("  distinct criteria used: %d / %d" % (report["distinct"], len(ids)))
    print("  mean tier spread     : %s" % json.dumps(report["tiers"]))
    print("  obviousness sanity   : %s" % json.dumps(report["obvSample"]))
    cal = report["calibration"]
    print()
    print("CALIBRATION over %d boards (norm exponent %.2f)" % (cal["boards"], cal["exponent"]))
    for who, blurb in (("first", "names the most obvious answer, 9/9"),
                       ("third", "names the 3rd most obvious, 9/9"),
                       ("eight", "the same player, one cell short"),
                       ("mid", "names the median answer, 9/9"),
                       ("deep", "names the deepest cut, 9/9")):
        print("  %-6s %-38s %6.1f pts -> norm %3d"
              % (who, blurb, cal["mean"][who], cal["norm"][who]))
    if no_gdp:
        print("  gdppc missing (median %.0f substituted): %s" % (med_gdp, ",".join(no_gdp)))


# ═══════════════════════════════════════════════════════════════════════════
# 7.  RENDER
# ═══════════════════════════════════════════════════════════════════════════

RUNTIME = r"""
(function (D) {
  'use strict';
  var G = {}, k, q, m;
  for (k in D.sets) {
    m = {};
    for (q = 0; q < D.sets[k].length; q++) { m[D.sets[k][q]] = 1; }
    G[k] = m;
  }
  var BY = {}, FN = {}, i;
  for (i = 0; i < D.criteria.length; i++) {
    var cr = D.criteria[i];
    BY[cr.id] = cr;
    /* the test expression is compiled ONCE, here, at load */
    FN[cr.id] = new Function('c', 'G', 'return !!(' + cr.test + ');');
  }
  var ANS = D.answers, SAL = D.salience, PAIRS = D.pairs;
  var AVOID = {}, INCOMP = {};
  function pk(a, b) { return a < b ? a + '|' + b : b + '|' + a; }
  for (i = 0; i < D.avoid.length; i++) { AVOID[pk(D.avoid[i][0], D.avoid[i][1])] = 1; }
  for (i = 0; i < D.incompatible.length; i++) { INCOMP[pk(D.incompatible[i][0], D.incompatible[i][1])] = 1; }

  D.sets_ = G;
  D.byId = function (id) { return BY[id] || null; };
  D.ids = function () { var r = [], j; for (j = 0; j < D.criteria.length; j++) { r.push(D.criteria[j].id); } return r; };
  D.test = function (id, c) { var f = FN[id]; return f ? f(c, G) : false; };
  D.valid = function (id) { return ANS[id] || []; };

  /* count of countries satisfying BOTH criteria (symmetric, O(1)) */
  D.both = function (a, b) {
    if (a === b) { return (ANS[a] || []).length; }
    var v = PAIRS[pk(a, b)];
    return v === undefined ? 0 : v;
  };
  /* the actual answer list for a cell */
  D.cell = function (a, b) {
    var A = ANS[a] || [], B = {}, r = [], j;
    for (j = 0; j < (ANS[b] || []).length; j++) { B[ANS[b][j]] = 1; }
    for (j = 0; j < A.length; j++) { if (B[A[j]]) { r.push(A[j]); } }
    return r;
  };
  D.isAvoid = function (a, b) { return !!AVOID[pk(a, b)]; };
  D.isIncompatible = function (a, b) { return !!INCOMP[pk(a, b)]; };

  /* ── obviousness ────────────────────────────────────────────────────────
     sal   : normalised log10(pop) + 0.5*log10(gdppc), 0..1, shipped x1000
     share : softmax(K*sal) across the cell's valid answers -- reads as
             "probability a player names this one"; sums to 1 over the cell
     obv   : share / (largest share in the cell) -- 0..1, most obvious = 1
     Lower obviousness = better pick. cellScore mirrors GeoGrid's rarity
     points: 100 * share, an unfilled cell costs a flat 100, lower is better. */
  function salOf(iso) { var v = SAL[iso]; return v === undefined ? 0 : v / 1000; }
  D.salienceOf = salOf;

  function weights(list) {
    var w = [], top = -1e9, j;
    for (j = 0; j < list.length; j++) { if (salOf(list[j]) > top) { top = salOf(list[j]); } }
    var sum = 0;
    for (j = 0; j < list.length; j++) {
      var e = Math.exp(D.softmaxK * (salOf(list[j]) - top));
      w.push(e); sum += e;
    }
    return { w: w, sum: sum, top: top };
  }
  D.share = function (a, b, iso) {
    var list = (b === null || b === undefined || b === a) ? (ANS[a] || []) : D.cell(a, b);
    var at = -1, j;
    for (j = 0; j < list.length; j++) { if (list[j] === iso) { at = j; break; } }
    if (at < 0) { return 0; }
    var W = weights(list);
    return W.sum > 0 ? W.w[at] / W.sum : 0;
  };
  /* obviousness = this country's softmax weight divided by the LARGEST weight in
     the cell, so the country a player thinks of first scores exactly 1 and
     everything else falls away from it. Dividing by the max rather than by the
     sum is what makes a 3-answer cell and a 60-answer cell comparable: a pure
     share collapses towards zero as a cell gets broad, which is precisely the
     flaw that makes the original's rarity a lottery on its widest boards. */
  D.obviousness = function (a, b, iso) {
    var list = (b === null || b === undefined || b === a) ? (ANS[a] || []) : D.cell(a, b);
    var j, ok = false;
    for (j = 0; j < list.length; j++) { if (list[j] === iso) { ok = true; break; } }
    if (!ok) { return 1; }
    var top = -1e9;
    for (j = 0; j < list.length; j++) { if (salOf(list[j]) > top) { top = salOf(list[j]); } }
    return Math.min(1, Math.exp(D.softmaxK * (salOf(iso) - top)));
  };
  D.cellScore = function (a, b, iso) { return Math.round(1000 * D.share(a, b, iso)) / 10; };

  /* POINTS -- what the cabinet actually scores.
       points = round(FILL + (100 - FILL) * (1 - obviousness))
     100 for a country nobody would think of, FILL(=10) for the single most
     obvious valid answer, 0 for an empty cell. Nine cells, so 900 is the
     ceiling -- the same shape as the original's 900, mirrored so that higher is
     better, which is the direction the rest of this arcade scores in. The 10
     point floor exists so that filling a cell is always strictly better than
     leaving it blank, even when the only country you could think of was France. */
  D.FILL = 10;
  D.pointsFor = function (obv) { return Math.round(D.FILL + (100 - D.FILL) * (1 - obv)); };
  D.points = function (a, b, iso) { return D.pointsFor(D.obviousness(a, b, iso)); };

  /* The best points a cell can pay -- its least obvious valid answer. 900 is the
     theoretical ceiling but it is never reachable: in a cell like "in Africa x
     landlocked" even the deepest cut (Lesotho) is a country people know, so the
     cell caps out around 85. So every board publishes its OWN ceiling, and the
     cabinet's 0-100 norm is measured against that rather than against 900.
     CONTRACT §3: use the game's realistic ceiling, not the theoretical one. */
  D.bestFor = function (a, b) {
    var list = D.cell(a, b), best = 0;
    for (var j = 0; j < list.length; j++) {
      best = Math.max(best, D.points(a, b, list[j]));
    }
    return best;
  };
  /* ceiling(grid) -> { cells:[9], total } */
  D.ceiling = function (grid) {
    var cells = [], tot = 0;
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var v = D.bestFor(grid.rows[r], grid.cols[c]);
        cells.push(v); tot += v;
      }
    }
    return { cells: cells, total: tot };
  };

  /* Tier of a pick, keyed on obviousness rather than on a crowd percentage --
     same six-rung vocabulary as the original, honestly re-based. */
  var OTIERS = [
    { max: 1.01, key: 'common',    label: 'Common',    emoji: '🟩' },
    { max: 0.75, key: 'uncommon',  label: 'Uncommon',  emoji: '🔷' },
    { max: 0.45, key: 'rare',      label: 'Rare',      emoji: '⚡' },
    { max: 0.22, key: 'epic',      label: 'Epic',      emoji: '🌈' },
    { max: 0.09, key: 'legendary', label: 'Legendary', emoji: '💎' },
    { max: 0.03, key: 'mythical',  label: 'Mythical',  emoji: '🦄' }
  ];
  D.obvTiers = OTIERS;
  D.tierOfObv = function (obv) {
    var hit = OTIERS[0];
    for (var j = 0; j < OTIERS.length; j++) { if (obv < OTIERS[j].max) { hit = OTIERS[j]; } }
    return hit;
  };

  var TIERS = [
    { min: 25, key: 'common',    label: 'Common',    emoji: '🟩' },
    { min: 10, key: 'uncommon',  label: 'Uncommon',  emoji: '🔷' },
    { min: 5,  key: 'rare',      label: 'Rare',      emoji: '⚡' },
    { min: 2,  key: 'epic',      label: 'Epic',      emoji: '🌈' },
    { min: 0.5, key: 'legendary', label: 'Legendary', emoji: '💎' },
    { min: -1, key: 'mythical',  label: 'Mythical',  emoji: '🦄' }
  ];
  D.tiers = TIERS;
  D.tierOf = function (pct) {
    for (var j = 0; j < TIERS.length; j++) { if (pct >= TIERS[j].min) { return TIERS[j]; } }
    return TIERS[TIERS.length - 1];
  };

  /* ── grid construction ──────────────────────────────────────────────────
     Depth-first over [r0,r1,r2,c0,c1,c2] with the constraints checked as
     each slot is filled, so a dead branch is abandoned early:
       - the six criteria are distinct
       - no near-duplicate pair anywhere in the six (D.avoid)
       - at most `groupCap` criteria from the same family among the six
       - every row x column intersection has >= minCell valid answers
     `rand` is the core's seeded RNG, so the same seed always yields the
     same board. Returns null only if the search budget is exhausted. */
  function shuffled(rand, arr) {
    var a = arr.slice(), j, t, r;
    for (j = a.length - 1; j > 0; j--) {
      r = Math.floor(rand() * (j + 1)); t = a[j]; a[j] = a[r]; a[r] = t;
    }
    return a;
  }
  D.buildGrid = function (rand, opts) {
    opts = opts || {};
    var minCell = opts.minCell === undefined ? 2 : opts.minCell;
    var groupCap = opts.groupCap === undefined ? 2 : opts.groupCap;
    var wantMix = opts.mix === undefined ? true : opts.mix;
    var pool = opts.only || D.ids();
    var best = null;

    for (var attempt = 0; attempt < 24; attempt++) {
      var order = shuffled(rand, pool);
      var chosen = [], groups = {}, budget = { n: 20000 };

      var fits = function (id, slot) {
        var j;
        for (j = 0; j < chosen.length; j++) {
          if (chosen[j] === id) { return false; }
          if (D.isAvoid(chosen[j], id)) { return false; }
        }
        var g = BY[id].group;
        if ((groups[g] || 0) >= groupCap) { return false; }
        if (slot >= 3) {
          for (j = 0; j < 3; j++) { if (D.both(chosen[j], id) < minCell) { return false; } }
        }
        return true;
      };
      var dfs = function (slot) {
        if (budget.n-- <= 0) { return false; }
        if (slot === 6) { return true; }
        for (var j = 0; j < order.length; j++) {
          var id = order[j];
          if (!fits(id, slot)) { continue; }
          chosen.push(id); groups[BY[id].group] = (groups[BY[id].group] || 0) + 1;
          if (dfs(slot + 1)) { return true; }
          chosen.pop(); groups[BY[id].group]--;
        }
        return false;
      };
      if (!dfs(0)) { continue; }

      var grid = { rows: chosen.slice(0, 3), cols: chosen.slice(3, 6) };
      grid.counts = [];
      var lo = 1e9, tot = 0, r2, c2;
      for (r2 = 0; r2 < 3; r2++) {
        var line = [];
        for (c2 = 0; c2 < 3; c2++) {
          var n = D.both(grid.rows[r2], grid.cols[c2]);
          line.push(n); tot += n; if (n < lo) { lo = n; }
        }
        grid.counts.push(line);
      }
      grid.minCell = lo;
      grid.meanCell = tot / 9;
      var t1 = 0, t3 = 0, all = grid.rows.concat(grid.cols);
      for (r2 = 0; r2 < 6; r2++) {
        if (BY[all[r2]].tier === 1) { t1++; }
        if (BY[all[r2]].tier === 3) { t3++; }
      }
      grid.tierMix = [t1, 6 - t1 - t3, t3];
      /* a good board has at least one broad criterion to get started on and
         at least one narrow one to make the last cells cost something */
      if (!wantMix || (t1 >= 1 && t3 >= 1 && t1 <= 3 && t3 <= 3)) { return grid; }
      if (!best) { best = grid; }
    }
    return best;
  };

  /* run buildGrid over n seeds and report; used by _build/gen_geogrid.py */
  D.selfTest = function (rngFactory, n) {
    var fails = 0, tot = 0, lo = 1e9, used = {}, mix = [0, 0, 0], j, r, c;
    for (var s = 0; s < n; s++) {
      var g = D.buildGrid(rngFactory('seed-' + s));
      if (!g) { fails++; continue; }
      for (r = 0; r < 3; r++) {
        for (c = 0; c < 3; c++) {
          var v = g.counts[r][c];
          tot += v; if (v < lo) { lo = v; }
          if (v < 2) { fails++; }
        }
      }
      var all = g.rows.concat(g.cols);
      for (j = 0; j < 6; j++) { used[all[j]] = 1; mix[BY[all[j]].tier - 1]++; }
    }
    return {
      seeds: n, failures: fails, meanCell: tot / (9 * n), minCell: lo,
      distinct: Object.keys(used).length,
      tiers: [mix[0] / n, mix[1] / n, mix[2] / n]
    };
  };
}(window.AD_GEOGRID));
"""


def render(payload):
    head = """/* core/data/geogrid.js -- window.AD_GEOGRID
   Criteria system for GEOGRID, the 3x3 immaculate-grid geography cabinet.

   SOURCE
     core/data/countries.js (the 194 records flagged un===1) for every derived
     criterion -- region, population, area, borders, GDP per capita, landlocked,
     island, hemisphere, capital coordinates, currency, name shape.
     Hand-authored ISO2 membership lists for everything countries.js cannot
     derive -- EU, NATO, Commonwealth, OPEC, ASEAN, African Union, Arab League,
     OECD, G20, monarchies, drives-on-the-left, nuclear states, ex-USSR, Olympic
     hosts, World Cup winners, Mediterranean coastline, the Equator, and
     official-language sets. Each list's provenance is in `setSources`.

   RARITY is measured over that same 194-country pool and is exact: the numbers
   below were produced by compiling these very `test` strings with new Function
   and running them, in JavaScriptCore, against countries.js.

   OBVIOUSNESS replaces the original game's crowd-sourced rarity, which needs a
   server counting live guesses. See `salienceFormula` and AD_GEOGRID.obviousness.

   API
     AD_GEOGRID.ids()                 -> [criterionId, ...]
     AD_GEOGRID.byId(id)              -> criterion record
     AD_GEOGRID.test(id, c)           -> bool, the compiled predicate
     AD_GEOGRID.valid(id)             -> [ISO2, ...] sorted
     AD_GEOGRID.both(a, b)            -> how many countries satisfy both (O(1))
     AD_GEOGRID.cell(a, b)            -> [ISO2, ...] valid in that cell
     AD_GEOGRID.share(a, b, iso)      -> 0..1 modelled pick probability
     AD_GEOGRID.obviousness(a,b,iso)  -> 0..1, 1 = the country everyone names
     AD_GEOGRID.points(a, b, iso)     -> 10..100 for that cell; 900 = a perfect board
     AD_GEOGRID.cellScore(a,b,iso)    -> 100*share, one decimal; lower is better
     AD_GEOGRID.tierOf(pct)           -> Common/Uncommon/Rare/Epic/Legendary/Mythical
     AD_GEOGRID.buildGrid(rand, opts) -> {rows, cols, counts, minCell, ...}
     AD_GEOGRID.selfTest(rngFactory, n)

   Generated by _build/gen_geogrid.py -- do not hand-edit. */
"""
    return head + "window.AD_GEOGRID = " + compact_json(payload) + ";\n" + RUNTIME


def compact_json(payload):
    """Strict JSON, but with line breaks in the big maps so the file is greppable."""
    def d(o):
        return json.dumps(o, ensure_ascii=False, separators=(",", ":"), sort_keys=False)

    parts = []
    for key in ("version", "poolNote", "raritySource", "salienceFormula",
                "softmaxK", "gdpWeight"):
        parts.append('%s:%s' % (d(key), d(payload[key])))
    parts.append('"pool":' + d(payload["pool"]))
    parts.append('"criteria":[\n' + ",\n".join(d(x) for x in payload["criteria"]) + "\n]")
    parts.append('"sets":{\n' + ",\n".join('%s:%s' % (d(k), d(payload["sets"][k]))
                                           for k in sorted(payload["sets"])) + "\n}")
    parts.append('"setSources":{\n' + ",\n".join('%s:%s' % (d(k), d(payload["setSources"][k]))
                                                 for k in sorted(payload["setSources"])) + "\n}")
    parts.append('"answers":{\n' + ",\n".join('%s:%s' % (d(k), d(payload["answers"][k]))
                                              for k in payload["answers"]) + "\n}")
    parts.append('"obv":{\n' + ",\n".join('%s:%s' % (d(k), d(payload["obv"][k]))
                                          for k in payload["obv"]) + "\n}")
    parts.append('"salience":' + d(payload["salience"]))
    pk = list(payload["pairs"].items())
    chunks, cur = [], []
    for i, (k, v) in enumerate(pk):
        cur.append('%s:%d' % (d(k), v))
        if len(cur) == 12:
            chunks.append(",".join(cur)); cur = []
    if cur:
        chunks.append(",".join(cur))
    parts.append('"pairs":{\n' + ",\n".join(chunks) + "\n}")
    parts.append('"incompatible":[\n' + ",\n".join(d(x) for x in payload["incompatible"]) + "\n]")
    parts.append('"avoid":[' + ",".join(d(x) for x in payload["avoid"]) + "]")
    return "{\n" + ",\n".join(parts) + "\n}"


# ═══════════════════════════════════════════════════════════════════════════
# 8.  VALIDATION
# ═══════════════════════════════════════════════════════════════════════════

def verify_json(path):
    src = open(path, encoding="utf-8").read()
    marker = "window.AD_GEOGRID = "
    i = src.index(marker)
    j = src.index("\n};", i)
    obj = json.loads(src[i + len(marker):j + 2])
    print("strict-JSON payload parses: %d criteria, %d pairs, %d answers lists"
          % (len(obj["criteria"]), len(obj["pairs"]), len(obj["answers"])))
    return obj


def selftest(path, seeds=500):
    """Load the emitted file for real and hammer buildGrid."""
    body = """
var rngFactory = function (seedStr) {
  /* FNV-1a + mulberry32, the same shape as core/arcade.js A.rng */
  var h = 2166136261, i;
  for (i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619);
  }
  var a = h >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};
var rep = window.AD_GEOGRID.selfTest(rngFactory, %d);
var g = window.AD_GEOGRID;
var s = [];
var probe = [['reg_africa','landlocked'], ['reg_europe','org_eu'], ['island','lang_en']];
for (var p = 0; p < probe.length; p++) {
  var list = g.cell(probe[p][0], probe[p][1]);
  var rank = list.slice().sort(function (x, y) { return g.salienceOf(y) - g.salienceOf(x); });
  s.push({
    cell: probe[p].join(' x '), n: list.length,
    mostObvious: rank[0], mostObviousScore: g.cellScore(probe[p][0], probe[p][1], rank[0]),
    deepCut: rank[rank.length - 1],
    deepCutScore: g.cellScore(probe[p][0], probe[p][1], rank[rank.length - 1]),
    deepCutObv: Math.round(1000 * g.obviousness(probe[p][0], probe[p][1], rank[rank.length - 1])) / 1000
  });
}
rep.obvSample = s;

/* ── CALIBRATION ─────────────────────────────────────────────────────────────
   Four reference players over the same boards, each filling all nine cells:
     first : always names the most salient valid country  (the lazy answer)
     third : names the 3rd most salient                   (a solid daily player)
     mid   : names the median-salience valid country       (a strong player)
     deep  : names the least salient valid country         (perfect play)
   Reported as raw points out of 900 and as norm under norm = 100*(pts/900)^E,
   so the exponent can be chosen against real boards rather than by feel. */
var EXP = %f;
function normOf(pts) { return Math.round(100 * Math.pow(pts / 900, EXP)); }
var players = { first: 0, third: 0, mid: 0, deep: 0, eight: 0 };
var pcount = 0;
for (var s2 = 0; s2 < %d; s2++) {
  var gg = g.buildGrid(rngFactory('seed-' + s2));
  if (!gg) { continue; }
  pcount++;
  var tot = { first: 0, third: 0, mid: 0, deep: 0 };
  var cellPts = [];
  for (var r3 = 0; r3 < 3; r3++) {
    for (var c3 = 0; c3 < 3; c3++) {
      var a3 = gg.rows[r3], b3 = gg.cols[c3];
      var list3 = g.cell(a3, b3).slice().sort(function (x, y) {
        return g.salienceOf(y) - g.salienceOf(x);
      });
      var idx = {
        first: 0,
        third: Math.min(2, list3.length - 1),
        mid: Math.floor((list3.length - 1) / 2),
        deep: list3.length - 1
      };
      for (var kk in idx) { tot[kk] += g.points(a3, b3, list3[idx[kk]]); }
      cellPts.push(g.points(a3, b3, list3[idx.third]));
    }
  }
  for (var k2 in tot) { players[k2] += tot[k2]; }
  /* the same solid player, but one cell short */
  cellPts.sort(function (x, y) { return x - y; });
  players.eight += tot.third - cellPts[0];
}
rep.calibration = { boards: pcount, exponent: EXP, mean: {}, norm: {} };
for (var k3 in players) {
  var mp = players[k3] / pcount;
  rep.calibration.mean[k3] = Math.round(mp * 10) / 10;
  rep.calibration.norm[k3] = normOf(mp);
}

__write(__outPath(), JSON.stringify(rep));
'ok'
""" % (seeds, NORM_EXP, seeds)
    shim = "var window = this;\n"
    tmp = tempfile.mkdtemp(prefix="geogrid_st_")
    shim_path = os.path.join(tmp, "shim.js")
    open(shim_path, "w", encoding="utf-8").write(shim)
    return run_js(body, payload_files=[shim_path, path])


if __name__ == "__main__":
    main()
