#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
photos_lib.py -- shared helpers for building core/data/photos.js

Wikimedia Commons MediaWiki API access (no key), on-disk response cache,
scene/quality filtering heuristics, and HTTP-200 image verification.

Used by:  photos_time.py, photos_place.py, gen_photos.py
STDLIB ONLY (python 3.9).
"""

import hashlib
import html
import json
import os
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(ROOT, "_build")
CACHE = os.path.join(BUILD, "cache", "photos")
os.makedirs(CACHE, exist_ok=True)

API = "https://commons.wikimedia.org/w/api.php"
UA = "MidnightArcade-DataBuild/1.0 (static puzzle game; contact misha@cbai.ai)"

_SSL = ssl.create_default_context()


# ───────────────────────────── HTTP + cache ──────────────────────────────

def _ckey(prefix, s):
    return os.path.join(CACHE, "%s_%s.json" % (prefix, hashlib.sha1(s.encode("utf-8")).hexdigest()[:20]))


def api(params, prefix="api", ttl=None, retries=3, endpoint=API):
    """GET a MediaWiki API with an on-disk cache keyed by the query string."""
    p = dict(params)
    p.setdefault("format", "json")
    p.setdefault("formatversion", "2")
    qs = urllib.parse.urlencode(sorted(p.items()), doseq=True)
    path = _ckey(prefix, endpoint + "|" + qs)
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as fh:
                return json.load(fh)
        except Exception:
            pass
    url = endpoint + "?" + qs
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=60, context=_SSL) as r:
                data = json.loads(r.read().decode("utf-8"))
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(data, fh)
            time.sleep(0.08)
            return data
        except Exception as e:  # noqa
            last = e
            time.sleep(1.2 * (attempt + 1))
    print("  ! api fail: %s -- %s" % (qs[:110], last))
    return {}


WPAPI = "https://en.wikipedia.org/w/api.php"


def resolve_places(names):
    """['Kumasi, Ghana', ...] -> {name: (lat, lon, resolved_title)} via en.wikipedia coordinates.

    Authoring place NAMES is far safer than authoring coordinates; this turns the
    names into verified coordinates from Wikipedia (CC BY-SA) in batches of 40.
    """
    out = {}
    names = list(dict.fromkeys(names))
    for i in range(0, len(names), 40):
        chunk = names[i:i + 40]
        d = api({"action": "query", "titles": "|".join(chunk),
                 "prop": "coordinates", "coprop": "type|name", "colimit": "max",
                 "redirects": "1"}, prefix="wpcoord", endpoint=WPAPI)
        q = d.get("query") or {}
        # map redirects/normalisations back to what we asked for
        alias = {}
        for kind in ("normalized", "redirects"):
            for r in q.get(kind) or []:
                alias[r.get("to")] = r.get("from")
        for p in q.get("pages") or []:
            co = (p.get("coordinates") or [{}])[0]
            if not co.get("lat"):
                continue
            title = p.get("title")
            asked = title
            seen = set()
            while asked in alias and asked not in seen:
                seen.add(asked)
                asked = alias[asked]
            out[asked] = (round(float(co["lat"]), 5), round(float(co["lon"]), 5), title)
    return out


_HEAD_CACHE_PATH = os.path.join(CACHE, "_head_cache.json")
_head_cache = {}
if os.path.exists(_HEAD_CACHE_PATH):
    try:
        with open(_HEAD_CACHE_PATH, "r", encoding="utf-8") as fh:
            _head_cache = json.load(fh)
    except Exception:
        _head_cache = {}


def save_head_cache():
    tmp = _HEAD_CACHE_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(_head_cache, fh)
    os.replace(tmp, _HEAD_CACHE_PATH)


def verify_url(url, retries=2):
    """HEAD (fallback GET-range) an image URL. -> (status:int, content_type:str)."""
    if url in _head_cache:
        v = _head_cache[url]
        return v[0], v[1]
    res = (0, "")
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=45, context=_SSL) as r:
                res = (r.status, (r.headers.get("Content-Type") or "").split(";")[0].strip())
            break
        except urllib.error.HTTPError as e:
            res = (e.code, (e.headers.get("Content-Type") or "").split(";")[0].strip() if e.headers else "")
            if e.code in (429, 503):
                time.sleep(2.0 * (attempt + 1))
                continue
            break
        except Exception:
            time.sleep(1.0 * (attempt + 1))
            res = (0, "")
    _head_cache[url] = [res[0], res[1]]
    return res


# ───────────────────────────── metadata helpers ───────────────────────────

_TAG = re.compile(r"<[^>]+>")
_WS = re.compile(r"\s+")


def clean(s, limit=None):
    """Strip HTML, entities and control junk out of an extmetadata value."""
    if not s:
        return ""
    s = str(s)
    s = re.sub(r"<br\s*/?>", " ", s, flags=re.I)
    s = _TAG.sub(" ", s)
    s = html.unescape(s)
    s = s.replace(" ", " ").replace("‎", "").replace("‏", "")
    s = _WS.sub(" ", s).strip(" \t\n\r,;:-")
    if limit and len(s) > limit:
        cut = s[:limit]
        if " " in cut:
            cut = cut[:cut.rfind(" ")]
        s = cut.rstrip(" ,;:-") + "…"
    return s


def em(info, key):
    """Read one extmetadata field."""
    x = (info.get("extmetadata") or {}).get(key) or {}
    return x.get("value") or ""


LICENCE_MAP = {
    "cc0": "CC0", "cc-zero": "CC0",
    "pd": "Public domain", "public domain": "Public domain",
    "cc by 4.0": "CC BY 4.0", "cc by 3.0": "CC BY 3.0", "cc by 2.5": "CC BY 2.5",
    "cc by 2.0": "CC BY 2.0", "cc by 1.0": "CC BY 1.0",
    "cc by-sa 4.0": "CC BY-SA 4.0", "cc by-sa 3.0": "CC BY-SA 3.0",
    "cc by-sa 2.5": "CC BY-SA 2.5", "cc by-sa 2.0": "CC BY-SA 2.0",
    "cc by-sa 1.0": "CC BY-SA 1.0",
}

# Licences we are willing to ship (free for reuse with attribution).
LICENCE_OK = re.compile(
    r"^(cc0|cc[- ]zero|pd|public\s*domain|cc[- ]by([- ]sa)?[- ]?\d(\.\d)?|"
    r"attribution|fal|gfdl)", re.I)

LICENCE_BAD = re.compile(r"(non[- ]?commercial|noncommercial|\bnc\b|\bnd\b|no[- ]?deriv|fair\s*use|"
                         r"unknown|copyrighted\s*free|with\s*permission)", re.I)


def licence_of(info):
    """Return a short, human licence string, or '' if not shippable."""
    short = clean(em(info, "LicenseShortName"))
    name = clean(em(info, "LicenseName"))
    code = clean(em(info, "License"))
    cand = short or name or code
    if not cand:
        return ""
    low = cand.lower()
    if LICENCE_BAD.search(low) and not low.startswith("public domain"):
        return ""
    norm = LICENCE_MAP.get(low)
    if norm:
        return norm
    if LICENCE_OK.match(low) or LICENCE_OK.match(code.lower()):
        return cand[:34]
    return ""


_CREDIT_JUNK = re.compile(r"^(own work|unknown( author| photographer)?|anonymous|see below|"
                          r"not (stated|given)|n/a|\?+)$", re.I)


def credit_of(info):
    """Best-effort attribution string: Artist, else Credit/Source, else ''. """
    art = clean(em(info, "Artist"), 90)
    if art and not _CREDIT_JUNK.match(art):
        return art
    cred = clean(em(info, "Credit"), 90)
    if cred and not _CREDIT_JUNK.match(cred):
        return cred
    att = clean(em(info, "Attribution"), 90)
    if att and not _CREDIT_JUNK.match(att):
        return att
    if art:
        return art  # "Unknown author" is still a legitimate credit line
    return ""


_YEAR_RE = re.compile(r"\b(1[78]\d\d|19\d\d|20[0-2]\d)\b")


def year_from_meta(info):
    """Year the photo was TAKEN, from DateTimeOriginal / DateTime (never upload date)."""
    for key in ("DateTimeOriginal", "DateTime"):
        raw = clean(em(info, key))
        if not raw:
            continue
        # Explicit ranges / circa are too fuzzy for a year-guessing game.
        if re.search(r"(circa|\bca\.?\b|between|or\s+\d{4}|\d{4}\s*[-–/]\s*\d{4}|\?)", raw, re.I):
            continue
        m = _YEAR_RE.search(raw)
        if m:
            y = int(m.group(1))
            if 1820 <= y <= 2025:
                return y, raw[:40]
    return None, ""


def thumb_url(info, width=1000):
    """upload.wikimedia.org thumbnail at `width` px, with true w/h after scaling."""
    tu = info.get("thumburl")
    tw, th = info.get("thumbwidth"), info.get("thumbheight")
    if tu and tw and th:
        return tu, int(tw), int(th)
    u, w, h = info.get("url"), info.get("width"), info.get("height")
    if u and w and h:
        return u, int(w), int(h)
    return None, 0, 0


# ───────────────────────────── scene filtering ────────────────────────────

# Hard rejects: not a photo, or not a scene, or distressing.
REJECT = [
    # not a photograph
    r"\.(svg|pdf|djvu|tif|tiff|gif|webm|ogv|mid|xcf|stl)$",
    r"\b(map|karte|mapa|carte|plan|planta|blueprint|diagram|chart|graph|schema|"
    r"drawing|sketch|engraving|etching|lithograph|woodcut|painting|gemälde|"
    r"portrait|portret|painting|illustration|poster|affiche|cartoon|caricature|"
    r"logo|emblem|coat[ _]of[ _]arms|wappen|escudo|seal[ _]of|flag[ _]of|banner|"
    r"stamp|briefmarke|postcard|carte[ _]postale|banknote|coin|medal|"
    r"manuscript|document|letter[ _]from|certificate|newspaper|magazine|"
    r"titlepage|title[ _]page|cover[ _]of|book|page[ _]\d|folio|"
    r"screenshot|scan[ _]of|facsimile|graffiti[ _]art|mural)\b",
    # studio / people-centric
    r"\b(studio|posed|sitting[ _]for|headshot|mugshot|passport[ _]photo|"
    r"class[ _]photo|team[ _]photo|group[ _]portrait|family[ _]portrait|"
    r"wedding[ _]photo|self[ _-]?portrait|selfie)\b",
    # interiors / close-ups / objects
    r"\b(interior|inside|indoor|inneres|innenraum|intérieur|interieur|"
    r"close[ _-]?up|closeup|detail[ _]of|macro|specimen|holotype|"
    r"microscope|x[ _-]?ray|cross[ _-]?section)\b",
    # distressing
    r"\b(corpse|corpses|dead[ _]body|bodies[ _]of|casualt|massacre|atrocit|"
    r"execution|executed|hanging[ _]of|lynch|famine|starv|victim|wounded|"
    r"injured|autopsy|morgue|funeral|coffin|burial|cemetery[ _]of[ _]war|"
    r"war[ _]crime|holocaust|concentration[ _]camp|mass[ _]grave|"
    r"amputat|leprosy|disease|epidemic|slaughter|carcass|"
    r"lynching|torture|refugee[ _]camp|bomb[ _]victim)\b",
    # nudity / sensitive
    r"\b(nude|naked|nudity|topless|erotic|sex)\b",
    # objects, not places
    r"\b(gravestone|tombstone|headstone|inscription|plaque|memorial[ _]tablet|"
    r"coats[ _]of[ _]arms|heraldry|chandelier|altar|pulpit|stained[ _]glass|"
    r"fresco|mosaic[ _]of|icon[ _]of|statue[ _]of[ _]liberty[ _]replica)\b",
    # merchandise / food / product shots (very common on Commons, useless here)
    r"\b(displayed[ _]for[ _]sale|for[ _]sale[ _]in|food[ _]and[ _]drink|"
    r"cuisine[ _]of|dishes[ _]of|menu|packaging|bottles[ _]of|cans[ _]of|"
    r"souvenirs?|merchandise|price[ _]tag|vending[ _]machine|"
    r"licence[ _]plates[ _]of|number[ _]plates|"
    r"clothing[ _]of|costumes[ _]of|textiles[ _]of|jewell?ery)\b",
    # military hardware / regalia, not places
    r"\b(battalion|regiment|brigade|squadron|armed[ _]forces|soldiers?|troops|"
    r"tank[s]?[ _]of|warship|aircraft[ _]carrier|fighter[ _]jet|artillery|"
    r"colours?[ _]of[ _]the|standard[ _]of[ _]the|military[ _]parade)\b",
    # a shop/store interior described as such
    r"\b(in[ _]a[ _][a-z]{2,14}[ _](store|shop)|inside[ _]the[ _](store|shop)|"
    r"shop[ _]interior|store[ _]interior|shelves)\b",
    # heavy subject matter — this is a light daily game
    r"\b(slave|slavery|apartheid[ _]museum|genocide|prison|jail|"
    r"detention|deportation|riot|protest[ _]against|demolition|ruins[ _]after|"
    r"earthquake[ _]damage|after[ _]the[ _]bombing|air[ _]raid|shelling|"
    r"destroyed[ _]by|burnt[ _]out|wreck(age)?[ _]of|crash[ _]site|"
    r"military[ _]cemetery|war[ _]memorial)\b",
]
REJECT_RE = [re.compile(p, re.I) for p in REJECT]

# Words that make a file *good* for a geography/era game: outdoor human scenes.
SCENE_WORDS = [
    "street", "straat", "rue", "calle", "strada", "strasse", "straße", "road", "highway",
    "avenue", "boulevard", "lane", "alley", "crossroads", "junction", "roundabout",
    "village", "hamlet", "town", "township", "settlement", "suburb", "neighbourhood",
    "neighborhood", "quarter", "district", "old town", "downtown", "city centre",
    "city center", "main street", "high street",
    "market", "marketplace", "bazaar", "bazar", "souk", "stall", "vendor", "shop",
    "shops", "storefront", "shopfront", "kiosk", "stand",
    "square", "plaza", "piazza", "place", "platz", "park", "garden", "promenade",
    "waterfront", "quay", "wharf", "pier", "harbour", "harbor", "port", "marina",
    "beach", "coast", "coastline", "shore", "cliff", "bay", "lagoon", "island",
    "countryside", "landscape", "farmland", "farm", "field", "fields", "paddy",
    "pasture", "meadow", "orchard", "vineyard", "plantation", "terrace",
    "valley", "hills", "hillside", "mountains", "mountain", "plateau", "steppe",
    "desert", "dunes", "savanna", "forest", "woodland", "jungle", "river", "riverbank",
    "lake", "canal", "waterfall", "gorge", "canyon", "glacier", "fjord",
    "railway", "railroad", "station", "tram", "tramway", "bus", "ferry", "bridge",
    "traffic", "parking", "roadside", "crossing", "level crossing", "signpost",
    "houses", "housing", "buildings", "rooftops", "skyline", "panorama", "view of",
    "view from", "general view", "overview", "aerial view", "streetscape",
    "waiting", "walking", "cycling", "riding", "working", "harvest", "fishing",
    "festival", "parade", "procession", "celebration", "fair", "carnival",
    "school", "playground", "stadium", "sports", "children playing",
    "cattle", "sheep", "goats", "camels", "livestock", "herd",
]
SCENE_RE = re.compile(r"(%s)" % "|".join(re.escape(w) for w in SCENE_WORDS), re.I)

# A *strong* scene word means the metadata is describing an outdoor VIEW, not an
# object that merely happens to live outdoors. At least one of these is required.
STRONG_SCENE = [
    "street", "streets", "straat", "rue ", "calle", "strasse", "straße", "road",
    "roads", "highway", "avenue", "boulevard", "lane", "alley", "crossroads",
    "village", "villages", "hamlet", "town", "township", "settlement", "suburb",
    "old town", "downtown", "city centre", "city center", "main street",
    "high street", "market", "marketplace", "bazaar", "souk",
    "square", "plaza", "piazza", "platz", "promenade", "waterfront",
    "quay", "wharf", "pier", "harbour", "harbor", "port of", "seafront",
    "beach", "coast", "coastline", "shore", "cliff", "bay",
    "countryside", "landscape", "landscapes", "farmland", "farm", "fields",
    "pasture", "meadow", "orchard", "vineyard", "plantation", "rice terrace",
    "valley", "hills", "hillside", "mountains", "mountain", "plateau", "steppe",
    "desert", "dunes", "savanna", "forest", "woodland", "jungle", "river",
    "riverbank", "lake", "canal", "waterfall", "gorge", "canyon", "glacier",
    "fjord", "railway", "railroad", "railway station", "tram", "tramway",
    "bridge", "traffic", "roadside", "level crossing",
    "houses", "housing", "buildings", "rooftops", "skyline", "panorama",
    "view of", "view from", "views of", "general view", "overview",
    "aerial view", "streetscape", "cityscape", "parade", "procession",
    "festival", "market stall", "park", "gardens", "farmhouse", "barn",
    "field", "harvest", "fishing", "boats", "island",
]
STRONG_RE = re.compile(r"(?:%s)" % "|".join(re.escape(w) for w in STRONG_SCENE), re.I)


def rejected(text):
    """-> reason string if the text trips a hard reject, else ''. """
    for rx in REJECT_RE:
        m = rx.search(text)
        if m:
            return m.group(0).lower()[:28]
    return ""


def has_burned_place(title, place):
    """Crude guard against images whose filename says the answer is written on the frame."""
    t = title.lower()
    return bool(re.search(r"\b(welcome[ _]to|city[ _]limit|town[ _]sign|ortsschild|"
                          r"place[ _]name[ _]sign|border[ _]sign|entrance[ _]sign|"
                          r"boundary[ _]sign|name[ _]board)\b", t))


def title_of(page):
    t = page.get("title", "")
    return re.sub(r"^File:", "", t)


def slug(s, n=40):
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower()
    return s[:n]


# ───────────────────────────── country lookup ─────────────────────────────

_COUNTRIES = None


def countries():
    """Load core/data/countries.js -> list of dicts."""
    global _COUNTRIES
    if _COUNTRIES is None:
        p = os.path.join(ROOT, "core", "data", "countries.js")
        s = open(p, "r", encoding="utf-8").read()
        m = re.search(r"window\.AD_COUNTRIES\s*=\s*(\[.*?\]);", s, re.S)
        _COUNTRIES = json.loads(m.group(1))
    return _COUNTRIES


_BY_ISO = None


def by_iso():
    global _BY_ISO
    if _BY_ISO is None:
        _BY_ISO = {c["i"]: c for c in countries()}
    return _BY_ISO


CONTINENT = {
    "Africa": "Africa", "Americas": "Americas", "Asia": "Asia",
    "Europe": "Europe", "Oceania": "Oceania", "Antarctic": "Antarctica",
}


def continent_of(iso2):
    c = by_iso().get(iso2)
    if not c:
        return "?"
    reg = c.get("reg") or "?"
    sub = c.get("sub") or ""
    if reg == "Americas":
        return "South America" if sub in ("South America",) else "North America"
    return CONTINENT.get(reg, reg)


def haversine(a, b):
    import math
    lat1, lon1 = a
    lat2, lon2 = b
    p = math.pi / 180
    x = (0.5 - math.cos((lat2 - lat1) * p) / 2 +
         math.cos(lat1 * p) * math.cos(lat2 * p) * (1 - math.cos((lon2 - lon1) * p)) / 2)
    return 12742 * math.asin(min(1.0, math.sqrt(max(0.0, x))))


# ───────────────────────────── file writing ───────────────────────────────

def hydrate(titles, chunk=25, prefix="hyd"):
    """Fetch imageinfo(+extmetadata) + full category list for File: titles.

    `prop=imageinfo` with extmetadata is an expensive prop: MediaWiki silently
    drops it for most pages if you ask for 100 at a time behind a generator.
    So hydrate in small explicit batches instead.
    """
    got = {}
    titles = list(dict.fromkeys(titles))
    for i in range(0, len(titles), chunk):
        part = titles[i:i + chunk]
        d = api({"action": "query", "titles": "|".join(part),
                 "prop": "imageinfo|categories|coordinates",
                 "iiprop": "url|extmetadata|size", "iiurlwidth": "1000",
                 "cllimit": "max", "clshow": "!hidden", "colimit": "max"},
                prefix=prefix)
        for p in (d.get("query") or {}).get("pages") or []:
            got[p.get("title")] = p
    return got


def geo_files(lat, lon, radius=10000, limit=250):
    """Commons files within `radius` m of (lat,lon), hydrated with metadata.

    Uses list=geosearch, so every page returned carries its OWN recorded
    coordinates (camera or object location) — never a derived position.
    """
    d = api({"action": "query", "list": "geosearch", "gscoord": "%s|%s" % (lat, lon),
             "gsradius": str(int(radius)), "gslimit": str(int(limit)),
             "gsnamespace": "6", "gsprop": "type|name|dim|globe"}, prefix="geolist")
    rows = (d.get("query") or {}).get("geosearch") or []
    keep = [r for r in rows if re.search(r"\.(jpe?g|png)$", r.get("title", ""), re.I)]
    pages = hydrate([r["title"] for r in keep], prefix="geohyd")
    out = []
    for r in keep:
        p = pages.get(r["title"])
        if not p:
            continue
        if not p.get("coordinates"):
            p["coordinates"] = [{"lat": r.get("lat"), "lon": r.get("lon")}]
        out.append(p)
    return out


def cat_files(category, limit=200, prefix="cat"):
    """All File: members of a Commons category, hydrated with metadata."""
    title = category if category.startswith("Category:") else "Category:" + category
    titles, cont = [], {}
    while True:
        p = {"action": "query", "list": "categorymembers", "cmtitle": title,
             "cmtype": "file", "cmlimit": "500"}
        p.update(cont)
        d = api(p, prefix=prefix + "mem")
        for m in (d.get("query") or {}).get("categorymembers") or []:
            if re.search(r"\.(jpe?g|png)$", m.get("title", ""), re.I):
                titles.append(m["title"])
        cont = d.get("continue") or {}
        if not cont or len(titles) >= limit:
            break
    titles = titles[:limit]
    pages = hydrate(titles, prefix=prefix + "hyd")
    return [pages[t] for t in titles if t in pages]


def cat_counts(names, prefix="catinfo"):
    """{category title: file count} for categories that exist. Batches of 50."""
    out = {}
    names = list(dict.fromkeys(names))
    for i in range(0, len(names), 50):
        d = api({"action": "query", "titles": "|".join(names[i:i + 50]),
                 "prop": "categoryinfo"}, prefix=prefix)
        for p in (d.get("query") or {}).get("pages") or []:
            ci = p.get("categoryinfo") or {}
            if ci.get("files"):
                out[p["title"]] = ci["files"]
    return out


def write_json(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=1)
    os.replace(tmp, path)
