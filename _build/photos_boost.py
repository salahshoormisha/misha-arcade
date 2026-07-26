#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
photos_boost.py -- FAST harvester for the two photo sets behind core/data/photos.js

Replaces the per-seed cost of photos_time.py / photos_place.py (1 list call +
10 hydrate calls + 1 HEAD per image) with ONE fully-hydrated API call per seed:

    action=query&generator=categorymembers&gcmlimit=50 ...&prop=imageinfo|coordinates|categories
    action=query&generator=geosearch&ggslimit=50        ...&prop=imageinfo|coordinates|categories

50 is the hard ceiling: MediaWiki silently DROPS extmetadata past 50 pages behind
a generator (verified: at ggslimit=150 only the first 50 pages carry it), and
geosearch's gsradius maxes out at 10000 m (anything larger -> error "outofrange").

Two corrections to the earlier harvests, both shipped-data bugs:

  * imageinfo's thumbwidth/thumbheight LIE. Ask for iiurlwidth=1000 and the API
    reports 1000x703 while handing you a URL for the 1280px thumbnail bucket,
    which really serves 1280x899 bytes. And you cannot fix it by rewriting the
    URL to 1000px -- upload.wikimedia.org now answers non-bucket widths with
    HTTP 400 "Use thumbnail sizes listed on ...". So: ship the bucket URL the
    API gives, and record w/h MEASURED FROM THE ACTUAL BYTES (img_probe below,
    which parses the JPEG SOF / PNG IHDR out of the first 64 KB). One request
    per image verifies status + content-type + true dimensions at once.

  * A photo whose only date is a scan/upload date is not dated. resolve_year()
    in photos_lib handles that; we never fall back to the upload timestamp.

Reuses photos_lib (API cache, licence/credit parsing, scene filters),
photos_time.CITIES + the cached "YYYY in <city>" category probe, and
photos_place.SEEDS + build_clues.

Checkpoint discipline: both output files are rewritten after EVERY seed, so an
interrupted run always leaves valid, loadable JSON on disk.

    python3 _build/photos_boost.py place [--limit N]
    python3 _build/photos_boost.py time  [--limit N]
    python3 _build/photos_boost.py dims          # re-measure w/h of both files
"""

import collections
import json
import os
import re
import ssl
import struct
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import photos_lib as L          # noqa: E402
import photos_place as P        # noqa: E402
import photos_time as T         # noqa: E402

TIME_OUT = os.path.join(L.BUILD, "photos-time.json")
PLACE_OUT = os.path.join(L.BUILD, "photos-place.json")
PROBE_CACHE = os.path.join(L.CACHE, "_time_cats.json")
DIMS_CACHE = os.path.join(L.CACHE, "_dims_cache.json")

EXT_OK = re.compile(r"\.(jpe?g|png)$", re.I)
_SSL = ssl.create_default_context()


# ─────────────────── image verification + true dimensions ────────────────────

_dims = {}
if os.path.exists(DIMS_CACHE):
    try:
        _dims = json.load(open(DIMS_CACHE, encoding="utf-8"))
    except Exception:
        _dims = {}


def save_dims():
    merged = {}
    if os.path.exists(DIMS_CACHE):
        try:
            merged = json.load(open(DIMS_CACHE, encoding="utf-8"))
        except Exception:
            merged = {}
    merged.update(_dims)
    _dims.update(merged)
    tmp = DIMS_CACHE + ".%d.tmp" % os.getpid()
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(merged, fh)
    os.replace(tmp, DIMS_CACHE)


def _jpeg_dims(b):
    i = 2
    n = len(b)
    while i < n - 9:
        if b[i] != 0xFF:
            i += 1
            continue
        m = b[i + 1]
        if m in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            h, w = struct.unpack(">HH", b[i + 5:i + 9])
            return w, h
        if m in (0xD8, 0xD9) or 0xD0 <= m <= 0xD7:
            i += 2
            continue
        if i + 4 > n:
            break
        i += 2 + struct.unpack(">H", b[i + 2:i + 4])[0]
    return 0, 0


def img_probe(url, retries=3):
    """Ranged GET of an image URL -> (status, content_type, w, h).

    Verifies the URL really serves an image AND measures its true pixel size
    from the bytes, so `w`/`h` in the shipped data cannot disagree with the file.
    """
    if url in _dims:
        v = _dims[url]
        return v[0], v[1], v[2], v[3]
    res = (0, "", 0, 0)
    time.sleep(0.12)                       # be polite to upload.wikimedia.org
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": L.UA, "Range": "bytes=0-65535"})
            with urllib.request.urlopen(req, timeout=45, context=_SSL) as r:
                b = r.read()
                st = 200 if r.status in (200, 206) else r.status
                ct = (r.headers.get("Content-Type") or "").split(";")[0].strip()
            w = h = 0
            if b[:2] == b"\xff\xd8":
                w, h = _jpeg_dims(b)
            elif b[:8] == b"\x89PNG\r\n\x1a\n" and len(b) >= 24:
                w, h = struct.unpack(">II", b[16:24])
            res = (st, ct, int(w), int(h))
            break
        except urllib.error.HTTPError as e:
            res = (e.code, "", 0, 0)
            if e.code in (429, 503):
                time.sleep(3.0 * (attempt + 1))
                continue
            break
        except Exception:
            time.sleep(1.0 * (attempt + 1))
            res = (0, "", 0, 0)
    # NEVER cache a transient failure: a cached 429 would permanently blacklist a
    # perfectly good photo (this already cost the first run three entries).
    if res[0] not in (0, 429, 503, 500, 502, 504):
        _dims[url] = list(res)
    return res


MIN_W = 800          # below this a photo looks soft in a full-width frame
MAX_TALL = 1.25      # h/w -- taller than this letterboxes badly on a phone
MAX_WIDE = 2.40      # w/h -- a 1280x429 panorama is a slit, not a scene


def verified(e):
    """Attach measured w/h + content type. -> '' if good, else a reject reason.

    The shape guard runs on the MEASURED dimensions, not on imageinfo's
    (which reports the width you asked for, not the bucket it serves).
    """
    st, ct, w, h = img_probe(e["url"])
    if st != 200:
        return "http-%s" % st
    if not ct.startswith("image/"):
        return "content-type-%s" % (ct or "none")
    if not w or not h:
        return "undecodable"
    if w < MIN_W:
        return "low-res-%dpx" % w
    if h > w * MAX_TALL:
        return "too-tall"
    if w > h * MAX_WIDE:
        return "too-wide"
    e["w"], e["h"] = w, h
    e["ct"] = ct
    return ""


# ───────────────────────── one hydrated API call ─────────────────────────────

FULL_PROPS = {
    "prop": "imageinfo|coordinates|categories",
    "iiprop": "url|extmetadata|size", "iiurlwidth": "1000",
    "colimit": "max", "cllimit": "max", "clshow": "!hidden",
}


def cat_page(category, limit=50, prefix="bcat"):
    p = {"action": "query", "generator": "categorymembers",
         "gcmtitle": category, "gcmtype": "file", "gcmlimit": str(limit)}
    p.update(FULL_PROPS)
    d = L.api(p, prefix=prefix)
    return (d.get("query") or {}).get("pages") or []


def geo_page(lat, lon, radius=10000, limit=50, prefix="bgeo"):
    p = {"action": "query", "generator": "geosearch",
         "ggscoord": "%s|%s" % (lat, lon), "ggsradius": str(int(radius)),
         "ggslimit": str(int(limit)), "ggsnamespace": "6"}
    p.update(FULL_PROPS)
    d = L.api(p, prefix=prefix)
    return (d.get("query") or {}).get("pages") or []


def basics(p):
    """Common per-page extraction. -> (title, ii, url, cats, desc, near, blob) or None."""
    title = L.title_of(p)
    if not EXT_OK.search(title):
        return None
    ii = (p.get("imageinfo") or [{}])[0]
    if not ii or not ii.get("extmetadata"):
        return None
    url = ii.get("thumburl") or ii.get("url")
    if not url:
        return None
    cats = " | ".join(c.get("title", "").replace("Category:", "")
                      for c in (p.get("categories") or []))
    desc = P.clean_caption(L.clean(L.em(ii, "ImageDescription"), 220))
    near = title.replace("_", " ").rsplit(".", 1)[0] + " . " + desc
    return title, ii, url, cats, desc, near, " ".join([near, cats])


MONUMENT = re.compile(r"\b(museum|monument|memorial|statue|sculpture|palace|"
                      r"cathedral|basilica|mausoleum|temple of|shrine)\b", re.I)
CHATTER = re.compile(r"\b(I |I'|my |we |our |me\b|don't|didn't|forgot)")

# Objects that slip past the scene filter because their description happens to
# mention a place word ("Manual typewriter used in Railway Offices" matched
# "railway"). A geography round needs the OUTDOORS, not a museum piece.
OBJECT = re.compile(r"\b(typewriter|sewing machine|cash register|telephone|"
                    r"gramophone|radio set|television set|refrigerator|"
                    r"furniture|cutlery|crockery|pottery|basketry|"
                    r"banknote|coin|ticket|timetable|noticeboard|"
                    r"press conference|exhibition stand|trade fair booth|"
                    r"portrait of|bust of|award|trophy|certificate)\b", re.I)

# A caption in a non-Latin script is unreadable to the players AND gives the
# answer away on sight (a Cyrillic caption means Russia and nowhere else).
_LATIN = re.compile(r"[A-Za-z]")
_LETTER = re.compile(r"[^\W\d_]", re.U)
# Flickr / 500px / Panoramio bulk-import titles carry a numeric id and no meaning.
IMPORT_JUNK = re.compile(r"\(?\b\d{6,}\b\)?|\b(500px|panoramio|flickr|geograph)\b"
                         r"|\bphoto(graph)? \(?\d+\)?", re.I)


def make_caption(desc, title):
    """A short, readable, Latin-script caption -- or '' to let gen_photos supply
    a neutral fallback built from the clues."""
    cap = "" if CHATTER.search(desc) else desc
    if len(cap) < 12:
        cap = title.replace("_", " ").rsplit(".", 1)[0]
    # Commons structured-data captions append the other-language labels inline:
    #   'View from the Royal mills ... label QS:Lde,"Aussicht von den ..."'
    cap = re.split(r"\blabel\s+QS:", cap)[0]
    cap = IMPORT_JUNK.sub(" ", cap)
    cap = re.sub(r"[\[\]{}|]+", " ", cap)
    cap = re.sub(r"\s+", " ", cap).strip(" .,;:-|\"'")[:150]
    letters = _LETTER.findall(cap)
    if len(letters) < 8:
        return ""
    # majority-Latin, or it is not a caption these players can read
    if len(_LATIN.findall(cap)) < 0.7 * len(letters):
        return ""
    return cap


def build_clues_strict(iso2, near, blob, tag):
    """`clues` name things ACTUALLY VISIBLE, so their evidence matters.

    photos_place.build_clues matched the whole blob, categories included, which
    let a broad city category invent a clue: a photo of a hotel seen from the
    water sat in "Carnival in Belize City" and came out claiming "a street
    celebration". So: at least ONE clue must be justified by the file's own
    title/description, and categories may only top the list up (they are decent
    evidence -- a file in "Category:Markets in Harar" does show a market -- just
    not decent enough to stand alone).
    """
    own = P.build_clues(iso2, near, tag)
    if not own:
        return []
    clues = list(own)
    for c in P.build_clues(iso2, blob, tag):
        if len(clues) >= 4:
            break
        if c not in clues:
            clues.append(c)
    return clues[:4]


# ────────────────────────────── place harvest ────────────────────────────────

def harvest_place():
    iso = L.by_iso()
    limit = None
    for i, a in enumerate(sys.argv):
        if a == "--limit":
            limit = int(sys.argv[i + 1])

    seeds = P.SEEDS[:limit] if limit else list(P.SEEDS)
    print("resolving %d seed coordinates…" % len(seeds))
    coords = L.resolve_places([s[0] for s in seeds])
    print("  %d resolved, %d unresolved" % (len(coords), len(seeds) - len(coords)))

    out = {}
    if os.path.exists(PLACE_OUT):
        try:
            out = {e["id"]: e for e in json.load(open(PLACE_OUT, encoding="utf-8"))}
        except Exception:
            out = {}
    print("resuming with %d entries" % len(out))

    # Two budgets, because the landmark seeds ("L") sit in countries the ordinary
    # seeds have already filled -- Paris, Rome, London, Giza, Agra, Sydney. Under a
    # single per-country cap every single one is skipped and `easy:1` stays at ~0,
    # so the 15% landmark share is unreachable. Count them separately.
    per_country = collections.Counter(e["iso2"] for e in out.values()
                                     if not e.get("easy"))
    per_lm = collections.Counter(e["iso2"] for e in out.values() if e.get("easy"))
    rej = collections.Counter()
    n_seed = 0

    for wp, label, iso2, tag in seeds:
        if wp not in coords:
            continue
        room = (per_lm if tag == "L" else per_country)
        cap_n = 2 if tag == "L" else 4        # spread wide, not deep
        if room[iso2] >= cap_n:
            continue
        n_seed += 1
        lat0, lon0, _t = coords[wp]
        cn = (iso.get(iso2) or {}).get("n") or iso2
        place = label if label.endswith(cn) else "%s, %s" % (label, cn)

        pages = geo_page(lat0, lon0)
        scored = []
        for p in pages:
            b = basics(p)
            if not b:
                rej["no-metadata"] += 1
                continue
            title, ii, url, cats, desc, near, blob = b
            lic = L.licence_of(ii)
            if not lic:
                rej["licence"] += 1
                continue
            cred = L.credit_of(ii)
            if not cred:
                rej["no-credit"] += 1
                continue
            ow, oh = ii.get("width") or 0, ii.get("height") or 0
            if ow and oh and oh / float(ow) > 1.30:
                rej["portrait"] += 1
                continue
            r = L.rejected(blob)
            if r:
                rej["scene:" + r] += 1
                continue
            if L.has_burned_place(title, place):
                rej["place-in-frame"] += 1
                continue
            if not L.STRONG_RE.search(blob):
                rej["no-outdoor-word"] += 1
                continue
            co = (p.get("coordinates") or [{}])[0]
            if not co.get("lat"):
                rej["no-coords"] += 1
                continue
            lat, lon = round(float(co["lat"]), 5), round(float(co["lon"]), 5)
            if L.haversine((lat, lon), (lat0, lon0)) > 12:
                rej["outside-seed"] += 1
                continue
            if OBJECT.search(near):
                rej["object-not-a-view"] += 1
                continue
            clues = build_clues_strict(iso2, near, blob, tag)
            if len(clues) < 2:
                rej["under-2-clues"] += 1
                continue
            sc = 3 * min(6, len(set(m.lower() for m in L.STRONG_RE.findall(blob))))
            sc += 2 * len(clues)
            sc += 2 if (ow and oh and 1.2 <= ow / float(oh) <= 2.0) else 0
            sc += 5 if L.STRONG_RE.search(near) else 0
            sc += 4 if re.search(r"\b(street|road|village|countryside|rural|town|"
                                 r"market|view of|panorama|houses|streetscape|"
                                 r"everyday)\b", blob, re.I) else 0
            sc += 2 if len(desc) >= 25 else 0
            sc -= 5 if MONUMENT.search(blob) else 0
            sc -= 3 if re.search(r"\b(aerial|from the air|satellite|drone)\b", blob, re.I) else 0
            scored.append((sc, {
                "id": "p_" + L.slug(title.rsplit(".", 1)[0], 46),
                "url": url, "w": 0, "h": 0, "lat": lat, "lon": lon,
                "iso2": iso2, "place": place,
                "caption": make_caption(desc, title),
                "credit": cred, "licence": lic, "page": L.page_url(title),
                "clues": clues, "easy": 1 if tag == "L" else 0,
            }))

        scored.sort(key=lambda t: (-t[0], t[1]["id"]))
        want = 3 if tag == "o" else 2
        picked, sigs = 0, set()
        for sc, e in scored:
            if picked >= want or room[iso2] >= cap_n:
                break
            if e["id"] in out:
                continue
            sig = re.sub(r"[^a-z]+", "", e["caption"].lower())[:26]
            if sig and sig in sigs:
                rej["dupe-caption"] += 1
                continue
            if any(L.haversine((e["lat"], e["lon"]), (o["lat"], o["lon"])) < 0.12
                   for o in out.values() if o["iso2"] == iso2):
                rej["near-duplicate"] += 1
                continue
            sigs.add(sig)
            why = verified(e)
            if why:
                rej[why] += 1
                continue
            out[e["id"]] = e
            room[iso2] += 1
            picked += 1
        print("  %-28s %-3s %s cand=%-3d kept=%d  (total %d, %d countries, %d landmarks)" %
              (label[:28], iso2, tag, len(pages), picked, len(out),
               len({e["iso2"] for e in out.values()}),
               sum(1 for e in out.values() if e.get("easy"))))
        L.write_json(PLACE_OUT, sorted(out.values(), key=lambda e: e["id"]))
        save_dims()
        L.save_head_cache()

    report_place(out, rej, n_seed)


def report_place(out, rej, n_seed):
    cont = collections.Counter(L.continent_of(e["iso2"]) for e in out.values())
    print("\nplace: seeds=%d total=%d countries=%d easy=%d" %
          (n_seed, len(out), len({e["iso2"] for e in out.values()}),
           sum(1 for e in out.values() if e.get("easy"))))
    print("  continents: " + "  ".join("%s:%d" % kv for kv in sorted(cont.items())))
    print("  top rejects: " + "  ".join("%s=%d" % kv for kv in rej.most_common(12)))


# ─────────────────────────────── time harvest ────────────────────────────────

# Pre-1900 photography is thin and city-bound; from 1900 the spec wants >=8 a decade.
DECADE_TARGET = {d: 6 for d in range(1850, 1900, 10)}
DECADE_TARGET.update({d: 13 for d in range(1900, 2020, 10)})


def dec(y):
    return (y // 10) * 10


def harvest_time():
    limit = None
    for i, a in enumerate(sys.argv):
        if a == "--limit":
            limit = int(sys.argv[i + 1])

    cats = json.load(open(PROBE_CACHE, encoding="utf-8"))["cats"]
    print("%d live 'YYYY in <city>' categories cached" % len(cats))

    print("resolving %d city coordinates…" % len(T.CITIES))
    xy = L.resolve_places([c[0] for c in T.CITIES])
    city = {}
    for idx, (wp, label, iso2) in enumerate(T.CITIES):
        if wp in xy:
            city[idx] = (label, iso2, xy[wp][0], xy[wp][1])
    print("  %d/%d cities have coordinates" % (len(city), len(T.CITIES)))

    out = {}
    if os.path.exists(TIME_OUT):
        try:
            out = {e["id"]: e for e in json.load(open(TIME_OUT, encoding="utf-8"))}
        except Exception:
            out = {}
    print("resuming with %d entries" % len(out))

    have = collections.Counter(dec(e["year"]) for e in out.values())
    per_country = collections.Counter(e["iso2"] for e in out.values())
    per_city = collections.Counter(e["place"] for e in out.values())
    rej = collections.Counter()

    # Bucket the categories by decade, then order each bucket so that countries
    # we have least of come first -- that is what makes the 35-country floor.
    buckets = collections.defaultdict(list)
    for k, v in cats.items():
        ci, yr, n = v
        if ci not in city or not (1850 <= yr <= 2015):
            continue
        if n < 6:                       # too few files to be worth a call
            continue
        buckets[dec(yr)].append((k, ci, yr, n))

    n_cat = 0
    for d in sorted(DECADE_TARGET):
        target = DECADE_TARGET[d]
        pool = buckets.get(d) or []
        # deterministic: sort by (country deficit, city deficit, -files, name)
        while have[d] < target:
            pool.sort(key=lambda t: (per_country[city[t[1]][1]],
                                     per_city.get("%s, ?" % city[t[1]][0], 0),
                                     -min(t[3], 90), t[0]))
            nxt = None
            for cand in pool:
                lab, iso2, _la, _lo = city[cand[1]]
                if per_country[iso2] >= 7 or per_city[lab] >= 3:
                    continue
                nxt = cand
                break
            if nxt is None:
                break
            pool.remove(nxt)
            if limit and n_cat >= limit:
                break
            n_cat += 1
            got = harvest_time_cat(nxt, city, out, per_country, per_city, rej)
            have[d] += got
            print("  %-34s +%d  (%ds %d/%d, total %d, %d countries)" %
                  (nxt[0].replace("Category:", "")[:34], got, d,
                   have[d], target, len(out), len(per_country)))
            L.write_json(TIME_OUT, sorted(out.values(), key=lambda e: e["id"]))
            save_dims()
        if limit and n_cat >= limit:
            break

    report_time(out, rej, n_cat)


def harvest_time_cat(cand, city, out, per_country, per_city, rej):
    catname, ci, cyear, _n = cand
    label, iso2, clat, clon = city[ci]
    cn = (L.by_iso().get(iso2) or {}).get("n") or iso2
    place = label if label.endswith(cn) else "%s, %s" % (label, cn)

    scored = []
    for p in cat_page(catname):
        b = basics(p)
        if not b:
            rej["no-metadata"] += 1
            continue
        title, ii, url, cats_s, desc, near, blob = b
        lic = L.licence_of(ii)
        if not lic:
            rej["licence"] += 1
            continue
        cred = L.credit_of(ii)
        if not cred:
            rej["no-credit"] += 1
            continue
        ow, oh = ii.get("width") or 0, ii.get("height") or 0
        if ow and oh and oh / float(ow) > 1.35:
            rej["portrait"] += 1
            continue
        year, src = L.resolve_year(cyear, ii)
        if year is None or not (1850 <= year <= 2015):
            rej["date:" + (src or "none")] += 1
            continue
        r = L.rejected(blob)
        if r:
            rej["scene:" + r] += 1
            continue
        if L.has_burned_place(title, place):
            rej["place-in-frame"] += 1
            continue
        if not L.STRONG_RE.search(blob) and not T.ERA_BONUS.search(blob):
            rej["no-scene-word"] += 1
            continue
        if OBJECT.search(near):
            rej["object-not-a-view"] += 1
            continue
        # the file's own coordinate wins, if it is plausibly in the same city
        lat, lon, gps = clat, clon, 0
        co = (p.get("coordinates") or [{}])[0]
        if co.get("lat") is not None:
            fl, fo = round(float(co["lat"]), 5), round(float(co["lon"]), 5)
            if L.haversine((fl, fo), (clat, clon)) <= 60:
                lat, lon, gps = fl, fo, 1
        sc = 4 if src == "exif" else 0
        sc += 3 * min(5, len(set(m.lower() for m in T.ERA_BONUS.findall(blob))))
        sc += 2 * min(4, len(set(m.lower() for m in L.STRONG_RE.findall(blob))))
        sc += 3 if gps else 0
        sc += 2 if len(desc) >= 25 else 0
        sc += 2 if (ow and oh and 1.2 <= ow / float(oh) <= 2.0) else 0
        sc -= 4 if MONUMENT.search(blob) else 0
        sc -= 3 if re.search(r"\b(aerial|from the air|balloon view)\b", blob, re.I) else 0
        scored.append((sc, {
            "id": "t_" + L.slug(title.rsplit(".", 1)[0], 46),
            "url": url, "w": 0, "h": 0, "year": year,
            "lat": lat, "lon": lon, "gps": gps,
            "place": place, "iso2": iso2,
            "caption": make_caption(desc, title),
            "credit": cred, "licence": lic, "page": L.page_url(title),
        }))

    scored.sort(key=lambda t: (-t[0], t[1]["id"]))
    picked, sigs = 0, set()
    for sc, e in scored:
        if picked >= 2:
            break
        if e["id"] in out:
            continue
        sig = re.sub(r"[^a-z]+", "", e["caption"].lower())[:26]
        if sig and sig in sigs:
            rej["dupe-caption"] += 1
            continue
        if any(o["year"] == e["year"] and o["place"] == e["place"]
               for o in out.values()):
            rej["same-city-year"] += 1
            continue
        sigs.add(sig)
        why = verified(e)
        if why:
            rej[why] += 1
            continue
        out[e["id"]] = e
        per_country[e["iso2"]] += 1
        per_city[label] += 1
        picked += 1
    return picked


def report_time(out, rej, n_cat):
    d = collections.Counter(dec(e["year"]) for e in out.values())
    cont = collections.Counter(L.continent_of(e["iso2"]) for e in out.values())
    print("\ntime: categories=%d total=%d countries=%d" %
          (n_cat, len(out), len({e["iso2"] for e in out.values()})))
    print("  decades: " + "  ".join("%ds:%d" % (k, d[k]) for k in sorted(d)))
    print("  continents: " + "  ".join("%s:%d" % kv for kv in sorted(cont.items())))
    print("  top rejects: " + "  ".join("%s=%d" % kv for kv in rej.most_common(12)))


# ─────────────────────────── dimension repair pass ───────────────────────────

def fix_dims():
    """Re-measure w/h for everything already on disk (the earlier runs trusted
    imageinfo's thumbwidth, which does not match the bytes)."""
    for path in (TIME_OUT, PLACE_OUT):
        if not os.path.exists(path):
            continue
        rows = json.load(open(path, encoding="utf-8"))
        keep, bad, fixed = [], 0, 0
        for e in rows:
            before = (e.get("w"), e.get("h"))
            why = verified(e)
            if why:
                bad += 1
                print("  DROP %-46s %s" % (e["id"][:46], why))
                continue
            if (e["w"], e["h"]) != before:
                fixed += 1
            keep.append(e)
        L.write_json(path, keep)
        save_dims()
        print("%s: %d kept, %d w/h corrected, %d dropped" %
              (os.path.basename(path), len(keep), fixed, bad))


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if mode == "place":
        harvest_place()
    elif mode == "time":
        harvest_time()
    elif mode == "dims":
        fix_dims()
    else:
        print(__doc__)
        sys.exit(1)
