#!/usr/bin/env python3
"""
_build/gen_food.py -- builds core/data/food.js  (window.AD_FOOD)

INPUTS
  _build/food_authored.py     hand-authored dish table (the content; ~100 countries)
  _build/cache/mealdb.json    TheMealDB harvest      (see _build/food_harvest.py)
  _build/cache/food_img_status.json   HTTP status per image URL
  core/data/countries.js      ISO2 validation + region grouping

IMAGES  (both hosts are whitelisted by CONTRACT.md sec.0)
  1. dish["mdb"]  -> exact TheMealDB dish name -> its themealdb.com thumbnail
  2. dish["wiki"] -> en.wikipedia.org REST summary lead image on upload.wikimedia.org
  Every URL is verified HTTP 200 by this script before it is written out; failures
  are dropped (the dish still ships, text-only) and reported.

OUTPUT SHAPE (CONTRACT.md sec.6)
  window.AD_FOOD = { countries:[{i, dishes:[{name, desc, why, img?}, ...]}, ...],
                     byRegion:{Region:[iso2,...]}, sources:[...] };
  Dishes are ordered hardest-to-guess first so the game can drip clues.

Re-runnable and deterministic: network results are cached under _build/cache/,
and with a warm cache the script does no network I/O at all.
Run:  python3 _build/gen_food.py            (use --refresh-img to re-resolve images)
"""
import json, os, re, sys, time, unicodedata, urllib.parse, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(ROOT, "_build")
CACHE = os.path.join(BUILD, "cache")
OUT = os.path.join(ROOT, "core", "data", "food.js")
WIKI_CACHE = os.path.join(CACHE, "food_wiki_img.json")
IMG_STATUS = os.path.join(CACHE, "food_img_status.json")
MEALDB = os.path.join(CACHE, "mealdb.json")
UA = "misha-arcade-databuild/1.0 (static puzzle game; misha@cbai.ai)"

sys.path.insert(0, BUILD)
import food_authored  # noqa: E402

IMG_W = 500          # upload.wikimedia.org thumbnail width we ask for
BAD_FILE_HINT = re.compile(
    r"(locator|_map|map_|flag_|coat_of_arms|\.svg$|logo|icon|blank)", re.I)


# ───────────────────────────────────────────────────────────── small utilities
def load(path, default):
    if os.path.exists(path):
        try:
            with open(path) as f:
                return json.load(f)
        except Exception:
            return default
    return default


def save(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1, sort_keys=True)
    os.replace(tmp, path)


def http_json(url, tries=5):
    """-> (json|None, status). status 404 = the article really is absent (cacheable);
    anything else falsy is transient and must NOT be cached as a negative."""
    last = 0
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8", "replace")), 200
        except urllib.error.HTTPError as e:
            last = e.code
            if e.code in (400, 404):
                return None, e.code
            if e.code == 429:              # Wikimedia rate limit -- back right off
                time.sleep(8.0 * (k + 1))
                continue
        except Exception:
            last = 0
        if k < tries - 1:
            time.sleep(1.5 * (k + 1))
    return None, last


def http_status(url, timeout=25, tries=4):
    """HTTP status for url. 429 and network errors are retried with backoff, so a
    rate limit is never mistaken for a dead image."""
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Range": "bytes=0-64"})
    code = 0
    for k in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                body = r.read(64)
                code = r.getcode()
                if code == 206:
                    code = 200
                return code if body else 0
        except urllib.error.HTTPError as e:
            code = e.code
            if e.code != 429:
                return e.code
            time.sleep(8.0 * (k + 1))
        except Exception:
            code = 0
            time.sleep(1.5 * (k + 1))
    return code


def transient_status(st):
    """True if `st` means 'ask again later' rather than 'this image is no good'."""
    return st == 0 or st == 429 or 500 <= st < 600


# ────────────────────────────────────────────────────────── country reference
def countries():
    src = open(os.path.join(ROOT, "core", "data", "countries.js")).read()
    m = re.search(r"window\.AD_COUNTRIES\s*=\s*(\[.*?\])\s*;", src, re.S)
    return json.loads(m.group(1))


COUNTRIES = countries()
BY_ISO = {c["i"]: c for c in COUNTRIES}

# Words a `desc` may never contain: it must be guessable, not answerable.
# Built from every country name / alt name / demonym plus the adjectival forms
# countries.js does not carry.
EXTRA_ADJ = """
persian farsi iranian britain british english scotland scottish wales welsh
american yankee dutch flemish castilian catalan basque galician bavarian sicilian
tuscan neapolitan roman venetian andalusian provencal breton norman alsatian
cantonese sichuan szechuan hunan shandong fujian hakka taiwanese tibetan uyghur
okinawan hokkaido kansai kyoto tokyo osaka nagoya sapporo
punjabi bengali gujarati tamil kerala keralan goan kashmiri hyderabadi mughal
mughlai maharashtrian rajasthani awadhi chettinad malayali sindhi
levantine maghrebi anatolian ottoman aegean balkan nordic scandinavian iberian
andean amazonian patagonian caribbean creole cajun acadian quebecois
yoruba igbo hausa ashanti akan zulu xhosa swahili amhara amharic tigray oromo
berber amazigh bedouin kurdish assyrian armenian georgian circassian
korean japanese chinese thai vietnamese burmese cambodian khmer laotian lao
malay indonesian javanese balinese sundanese filipino tagalog visayan ilocano
mexican tex-mex oaxacan yucatan yucatec poblano peruvian limean brazilian
bahian carioca paulista argentine argentinian chilean colombian venezuelan
ecuadorian bolivian paraguayan uruguayan cuban puerto rican jamaican haitian
trinidadian bajan guyanese surinamese belizean panamanian nicaraguan honduran
salvadoran guatemalan costa rican dominican
russian ukrainian polish czech bohemian slovak hungarian magyar romanian
moldovan bulgarian serbian croatian dalmatian bosnian slovenian macedonian
albanian montenegrin kosovar greek cypriot maltese turkish azerbaijani
kazakh uzbek tajik turkmen kyrgyz mongolian afghan pashtun tajiki
pakistani bangladeshi nepali nepalese bhutanese sinhalese tamilian maldivian
lebanese syrian jordanian palestinian israeli iraqi kuwaiti emirati qatari
bahraini omani yemeni saudi hejazi najdi
egyptian libyan tunisian algerian moroccan sudanese eritrean ethiopian somali
djiboutian kenyan tanzanian zanzibari ugandan rwandan burundian congolese
angolan mozambican zambian zimbabwean malawian botswanan namibian
senegalese gambian malian burkinabe nigerien nigerian ghanaian togolese
beninese ivorian guinean liberian sierra leonean cameroonian gabonese chadian
mauritanian mauritian seychellois malagasy comorian cape verdean
german austrian swiss belgian luxembourgish danish swedish norwegian finnish
icelandic estonian latvian lithuanian belarusian irish scots portuguese spanish
italian french canadian australian aussie kiwi zealander fijian samoan tongan
papuan hawaiian polynesian melanesian micronesian
"""
STOP = set()
for c in COUNTRIES:
    for s in [c.get("n"), c.get("demo")] + list(c.get("alt") or []):
        if s:
            STOP.add(s.lower())
for w in EXTRA_ADJ.split():
    STOP.add(w)
# Words that are also ordinary English / food vocabulary -- these are allowed in
# a `desc` because they do not give the answer away in context.  Anything a desc
# might legitimately say.
STOP -= {"turkey", "china", "chile", "chad", "jordan", "georgia", "guinea",
         "curacao", "malta", "grenada", "jersey", "mali", "niger", "togo",
         "roman", "lao", "akan", "oman", "corn", "chili"}
STOP = {s for s in STOP if len(s) > 2}
STOP_RE = re.compile(r"\b(" + "|".join(sorted((re.escape(s) for s in STOP),
                                              key=len, reverse=True)) + r")\b", re.I)


def strip_accents(s):
    return "".join(ch for ch in unicodedata.normalize("NFD", s)
                   if unicodedata.category(ch) != "Mn")


# ──────────────────────────────────────────────────────────────── image lookup
MDB = load(MEALDB, {"dishes": {}})
IMGST = load(IMG_STATUS, {})
MDB_BY_NAME = {}
for d in (MDB.get("dishes") or {}).values():
    if d and d.get("name") and d.get("img"):
        MDB_BY_NAME.setdefault(d["name"].strip().lower(), d)

WIKI = load(WIKI_CACHE, {})
DROPPED = []          # (iso, dish, url, reason) -- permanent, image not shipped
TRANSIENT = []        # (wiki title, status) -- rate limit / network; retry next run
NET_CALLS = [0]


def norm_title(s):
    s = strip_accents(s or "").lower().replace("_", " ")
    return re.sub(r"[^a-z0-9 ]", "", s).strip()


def wiki_key(title, expect=None, lang="en"):
    """Cache key. The APPROVED redirect target is part of the key, so approving a
    redirect after the fact invalidates the old rejection instead of sticking."""
    k = title if lang == "en" else "%s:%s" % (lang, title)
    if expect and norm_title(expect) != norm_title(title):
        k += " |as| " + expect
    return k


def commons_image(filetitle, offline=False):
    """Resolve an exact Commons 'File:...' title -> a verified 500px thumbnail."""
    key = "commons:" + filetitle
    rec = WIKI.get(key)
    if rec is None and not offline:
        NET_CALLS[0] += 1
        time.sleep(0.3)
        j, st = http_json(
            "https://commons.wikimedia.org/w/api.php?action=query&format=json"
            "&prop=imageinfo&iiprop=url|size&iiurlwidth=%d&titles=%s"
            % (IMG_W, urllib.parse.quote(filetitle, safe="")))
        if j:
            pages = (j.get("query") or {}).get("pages") or {}
            info = None
            for p in pages.values():
                if p.get("imageinfo"):
                    info = p["imageinfo"][0]
            if info and info.get("thumburl"):
                url = info["thumburl"]
                ist = http_status(url)
                if ist == 200:
                    rec = {"url": url, "page": info.get("descriptionurl")}
                elif transient_status(ist):
                    TRANSIENT.append((filetitle, ist))
                    return None
                else:
                    rec = {"url": None, "status": "commons thumb %s" % ist}
            else:
                rec = {"url": None, "status": "no such Commons file"}
        else:
            TRANSIENT.append((filetitle, st))
            return None
        WIKI[key] = rec
    return (rec or {}).get("url")


def wiki_image(title, expect=None, lang="en", offline=False):
    """Resolve a Wikipedia article title -> a verified upload.wikimedia.org URL.

    Guards against redirects landing on a different subject: en.wikipedia's
    'Causa' is a genus of SNAILS, and 'Tibs' redirects to a general cuisine
    article.  If the article that answers is not the one we asked for, the image
    is refused unless the authored entry named the redirect target explicitly.

    Only PERMANENT outcomes are cached; a rate limit or a network blip is retried
    on the next run rather than being frozen in as a missing image."""
    key = wiki_key(title, expect, lang)
    rec = WIKI.get(key)
    if rec is None and not offline:
        NET_CALLS[0] += 1
        time.sleep(0.4)                       # be polite to the Wikimedia API
        j, st = http_json("https://%s.wikipedia.org/api/rest_v1/page/summary/"
                          % lang
                          + urllib.parse.quote(title.replace(" ", "_"), safe=""))
        if j and norm_title(j.get("title")) != norm_title(expect or title):
            rec = {"url": None,
                   "status": "redirected to %r" % (j.get("title"),)}
        elif j:
            thumb = (j.get("thumbnail") or {}).get("source")
            orig = j.get("originalimage") or {}
            if thumb and not BAD_FILE_HINT.search(thumb):
                w = min(IMG_W, int(orig.get("width") or IMG_W))
                url = re.sub(r"/\d+px-", "/%dpx-" % w, thumb)
                ist = http_status(url)
                if ist != 200:                # fall back to the API's own thumb width
                    if http_status(thumb) == 200:
                        url, ist = thumb, 200
                if ist == 200:
                    rec = {"url": url, "title": j.get("title"),
                           "page": (j.get("content_urls") or {}).get("desktop", {}).get("page")}
                elif transient_status(ist):
                    TRANSIENT.append((title, ist))
                    return None
                else:
                    rec = {"url": None, "status": "image %s" % ist}
            else:
                rec = {"url": None,
                       "status": "no-usable-thumb" if not thumb else "thumb-looks-nonfood",
                       "thumb": thumb}
        elif st in (400, 404):
            rec = {"url": None, "status": "no-article"}
        else:
            TRANSIENT.append((title, st))     # do NOT cache -- retry next run
            return None
        WIKI[key] = rec
        if NET_CALLS[0] % 10 == 0:
            save(WIKI_CACHE, WIKI)
    if rec and rec.get("url"):
        return rec["url"]
    return None


def resolve_img(dish, iso, offline=False):
    """Return a verified-200 image URL for a dish, or None."""
    mdb = dish.get("mdb")
    if mdb:
        rec = MDB_BY_NAME.get(mdb.strip().lower())
        if rec:
            url = rec["img"]
            if IMGST.get(url) == 200:
                return url
            st = IMGST.get(url)
            if st is None and not offline:
                st = http_status(url)
                IMGST[url] = st
                if st == 200:
                    return url
            DROPPED.append((iso, dish["name"], url, "themealdb status %s" % st))
        else:
            DROPPED.append((iso, dish["name"], mdb, "no such TheMealDB dish"))
    if dish.get("commons"):
        u = commons_image(dish["commons"], offline=offline)
        if u:
            return u
        rec = WIKI.get("commons:" + dish["commons"]) or {}
        DROPPED.append((iso, dish["name"], dish["commons"],
                        "commons %s" % rec.get("status", "unresolved")))
    if dish.get("wiki"):
        lang = dish.get("wl", "en")
        u = wiki_image(dish["wiki"], expect=dish.get("wikias"), lang=lang,
                       offline=offline)
        if u:
            return u
        rec = WIKI.get(wiki_key(dish["wiki"], dish.get("wikias"), lang)) or {}
        DROPPED.append((iso, dish["name"], dish["wiki"],
                        "%s.wikipedia %s" % (lang, rec.get("status", "unresolved"))))
    return None


# ──────────────────────────────────────────────────────────────────── the build
def build(offline=False):
    problems, warnings = [], []
    out_countries, seen_iso = [], set()
    total_dishes = with_img = 0
    all_names = {}

    for iso, dishes in food_authored.DISHES:
        if iso in seen_iso:
            problems.append("duplicate country block %s" % iso)
            continue
        seen_iso.add(iso)
        if iso not in BY_ISO:
            problems.append("%s is not an ISO2 code in countries.js" % iso)
            continue
        rows, names = [], set()
        for d in dishes:
            name = d["name"].strip()
            desc = " ".join(d["desc"].split())
            why = " ".join(d["why"].split())
            low = name.lower()
            if low in names:
                problems.append("%s duplicate dish name %r" % (iso, name))
                continue
            names.add(low)
            all_names.setdefault(low, []).append(iso)
            # desc must not name the country or a demonym
            hit = STOP_RE.search(strip_accents(desc))
            if hit:
                problems.append("%s %r desc leaks %r" % (iso, name, hit.group(0)))
            if not desc.endswith("."):
                problems.append("%s %r desc not a sentence" % (iso, name))
            if desc.count(".") > 1:
                warnings.append("%s %r desc has >1 sentence" % (iso, name))
            if len(desc) < 45:
                warnings.append("%s %r desc very short (%d)" % (iso, name, len(desc)))
            if not why.endswith((".", "!", "?")):
                problems.append("%s %r why not a sentence" % (iso, name))
            row = {"name": name, "desc": desc, "why": why}
            img = resolve_img(d, iso, offline=offline)
            if img:
                row["img"] = img
                with_img += 1
            rows.append(row)
            total_dishes += 1
        if len(rows) < 3:
            problems.append("%s has only %d dishes (need 3+)" % (iso, len(rows)))
        out_countries.append({"i": iso, "dishes": rows})

    save(WIKI_CACHE, WIKI)
    save(IMG_STATUS, IMGST)

    out_countries.sort(key=lambda c: c["i"])
    by_region = {}
    for c in out_countries:
        by_region.setdefault(BY_ISO[c["i"]]["reg"], []).append(c["i"])
    for v in by_region.values():
        v.sort()

    payload = {
        "countries": out_countries,
        "byRegion": {k: by_region[k] for k in sorted(by_region)},
        "sources": [
            "TheMealDB v1 public API (themealdb.com) -- dish photographs",
            "Wikipedia REST summary lead images on upload.wikimedia.org "
            "(Wikimedia Commons, CC BY-SA / public domain)",
            "Dish names, descriptions and notes authored for this build "
            "(_build/food_authored.py)",
        ],
    }
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"),
                      sort_keys=False)
    header = (
        "/* core/data/food.js -- window.AD_FOOD : national dishes for FOODGUESSR\n"
        "\n"
        "   SOURCES\n"
        "     TheMealDB v1 public API (themealdb.com) -- dish photographs, harvested and\n"
        "       HTTP-200-verified by _build/food_harvest.py.\n"
        "     Wikipedia REST summary lead images, served from upload.wikimedia.org\n"
        "       (Wikimedia Commons: CC BY-SA or public domain). Every URL below returned\n"
        "       HTTP 200 at generation time; failures were dropped, not guessed.\n"
        "     Dish selection, `desc` and `why` are hand-authored (_build/food_authored.py).\n"
        "\n"
        "   SHAPE  { countries:[{ i:ISO2, dishes:[{name,desc,why,img?}, ...] }],\n"
        "            byRegion:{ region:[ISO2,...] }, sources:[...] }\n"
        "   `desc` is one sentence a player can reason from and never names the country\n"
        "   or a demonym (machine-checked). `why` is revealed after the round.\n"
        "   Dishes are ordered HARDEST-TO-GUESS FIRST so the game can drip clues.\n"
        "\n"
        "   %d countries, %d dishes, %d with a verified image.\n"
        "   GENERATED by _build/gen_food.py -- do not hand-edit; edit the script.\n"
        "*/\n" % (len(out_countries), total_dishes, with_img)
    )
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        f.write(header)
        f.write("window.AD_FOOD = " + body + ";\n")

    # ── self-check ──────────────────────────────────────────────────────────
    txt = open(OUT).read()
    m = re.search(r"window\.AD_FOOD\s*=\s*(\{.*\})\s*;\s*$", txt, re.S)
    reread = json.loads(m.group(1))
    assert len(reread["countries"]) == len(out_countries)

    thin = [(c["i"], len(c["dishes"])) for c in out_countries if len(c["dishes"]) < 3]
    dupes = {n: v for n, v in all_names.items() if len(v) > 1}

    print("=" * 72)
    print("core/data/food.js  %.1f KB" % (os.path.getsize(OUT) / 1024.0))
    print("countries: %d   dishes: %d   with verified image: %d (%.0f%%)"
          % (len(out_countries), total_dishes, with_img,
             100.0 * with_img / max(1, total_dishes)))
    print("dishes/country: min %d  max %d  mean %.1f"
          % (min(len(c["dishes"]) for c in out_countries),
             max(len(c["dishes"]) for c in out_countries),
             total_dishes / float(len(out_countries))))
    print("byRegion: " + ", ".join("%s %d" % (k, len(v))
                                   for k, v in payload["byRegion"].items()))
    print("countries with <3 dishes: %s" % (thin or "none"))
    print("dish names used by >1 country: %d %s"
          % (len(dupes), sorted(dupes.items())[:12] if dupes else ""))
    print("images dropped (not 200 / unresolved): %d" % len(DROPPED))
    for row in DROPPED[:40]:
        print("   - %s %s <- %s (%s)" % row)
    if len(DROPPED) > 40:
        print("   ... and %d more" % (len(DROPPED) - 40))
    if TRANSIENT:
        print("TRANSIENT image failures (not cached, re-run to retry): %d"
              % len(TRANSIENT))
        for t in TRANSIENT[:15]:
            print("   ? %s (http %s)" % t)
    print("PROBLEMS: %d" % len(problems))
    for p in problems:
        print("   ! " + p)
    print("warnings: %d" % len(warnings))
    for w in warnings[:30]:
        print("   ~ " + w)
    print("=" * 72)
    return len(problems)


if __name__ == "__main__":
    sys.exit(1 if build(offline="--offline" in sys.argv) else 0)
