#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
photos_time_more.py -- supplementary harvester for AD_PHOTOS.time (1900-2015).

photos_boost.py `time` fills the per-decade quota with a deliberately blunt
spreading policy: it skips any city once its COUNTRY has 7 entries, so the
countries that matter to these two players (CONTRACT §7: Tehran, Houston,
Edinburgh, London) are starved by whichever GB/US/IR city the sort reached
first. It also stops at DECADE_TARGET, which leaves nothing to lose when a
later verification pass drops a file.

This script harvests the SAME source family ("Category:<year> in <city>",
from the cached probe in cache/photos/_time_cats.json) through the SAME
filters -- photos_lib.rejected / STRONG_RE / has_burned_place, licence + credit
required, L.resolve_year against EXIF so the year is the year the shutter
fired, and photos_boost.verified (ranged GET: HTTP 200 + image/* + true pixel
size) -- but with a caps policy driven by what the set is actually missing:

    cities   the four CONTRACT §7 cities, one photo per decade each
    fill     named decades, preferring under-represented continents/countries

Output goes to its own file, `_build/photos-time-extra.json`, so it can run
while `photos_boost.py time` still owns photos-time.json (the boost rewrites
that file wholesale after every category and would clobber a merge). Merge with
`--merge` once the boost has exited.

    python3 _build/photos_time_more.py cities [--per-city N]
    python3 _build/photos_time_more.py fill --decades 1940,1950 [--n 4]
    python3 _build/photos_time_more.py merge
"""

import collections
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import photos_lib as L      # noqa: E402
import photos_boost as B    # noqa: E402
import photos_time as T     # noqa: E402

TIME_OUT = os.path.join(L.BUILD, "photos-time.json")
EXTRA_OUT = os.path.join(L.BUILD, "photos-time-extra.json")
PROBE_CACHE = os.path.join(L.CACHE, "_time_cats.json")
PHOTOS_JS = os.path.join(L.ROOT, "core", "data", "photos.js")

CONTRACT_CITIES = ["Tehran", "Houston", "Edinburgh", "London"]


def dec(y):
    return (y // 10) * 10


# ─────────────────────────── existing-state loading ──────────────────────────

def load_rows(path):
    if not os.path.exists(path):
        return []
    try:
        return json.load(open(path, encoding="utf-8"))
    except Exception:
        return []


def place_urls():
    """URLs already used by AD_PHOTOS.place.

    gen_photos de-duplicates on url with `time` first, so a time entry that
    reuses a place photo's url would silently delete that place entry -- and the
    place array is finished and must not change. Cheaper to never harvest one.
    """
    urls = set()
    if not os.path.exists(PHOTOS_JS):
        return urls
    for m in re.finditer(r'"url":"([^"]+)"', open(PHOTOS_JS, encoding="utf-8").read()):
        urls.add(m.group(1))
    return urls


def state():
    """-> (rows_by_id, taken_urls, city_year_pairs) over harvest + extras + shipped."""
    rows = {}
    for e in load_rows(TIME_OUT) + load_rows(EXTRA_OUT):
        rows[e["id"]] = e
    urls = set(e["url"] for e in rows.values()) | place_urls()
    pairs = set((e["year"], e["place"]) for e in rows.values())
    return rows, urls, pairs


def save_extra(extra):
    L.write_json(EXTRA_OUT, sorted(extra.values(), key=lambda e: e["id"]))
    B.save_dims()


# ───────────────────────────── category harvest ──────────────────────────────

def harvest_cat(catname, cyear, label, iso2, clat, clon, want,
                rows, urls, pairs, extra, rej):
    """Harvest up to `want` entries from one '<year> in <city>' category."""
    cn = (L.by_iso().get(iso2) or {}).get("n") or iso2
    place = label if label.endswith(cn) else "%s, %s" % (label, cn)

    scored = []
    for p in B.cat_page(catname, prefix="mcat"):
        b = B.basics(p)
        if not b:
            rej["no-metadata"] += 1
            continue
        title, ii, url, cats_s, desc, near, blob = b
        if url in urls:
            rej["already-have-url"] += 1
            continue
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
        if year is None or not (1900 <= year <= 2015):
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
        if B.OBJECT.search(near):
            rej["object-not-a-view"] += 1
            continue
        cap = B.make_caption(desc, title)
        # the file's own coordinate wins when it is plausibly the same city
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
        sc += 2 if cap else 0
        sc -= 4 if B.MONUMENT.search(blob) else 0
        sc -= 3 if re.search(r"\b(aerial|from the air|balloon view)\b", blob, re.I) else 0
        scored.append((sc, {
            "id": "t_" + L.slug(title.rsplit(".", 1)[0], 46),
            "url": url, "w": 0, "h": 0, "year": year,
            "lat": lat, "lon": lon, "gps": gps,
            "place": place, "iso2": iso2, "caption": cap,
            "credit": cred, "licence": lic, "page": L.page_url(title),
        }))

    scored.sort(key=lambda t: (-t[0], t[1]["id"]))
    got = 0
    for sc, e in scored:
        if got >= want:
            break
        if e["id"] in rows or e["id"] in extra:
            continue
        if e["url"] in urls:
            rej["already-have-url"] += 1
            continue
        if (e["year"], e["place"]) in pairs:
            rej["same-city-year"] += 1
            continue
        why = B.verified(e)
        if why:
            rej[why] += 1
            continue
        extra[e["id"]] = e
        urls.add(e["url"])
        pairs.add((e["year"], e["place"]))
        got += 1
    return got


# ─────────────────────────────── probe access ────────────────────────────────

def load_probe():
    """-> {city_label: [(year, files, category)], ...} plus city coordinates."""
    cats = json.load(open(PROBE_CACHE, encoding="utf-8"))["cats"]
    xy = L.resolve_places([c[0] for c in T.CITIES])
    city = {}
    for idx, (wp, label, iso2) in enumerate(T.CITIES):
        if wp in xy:
            city[idx] = (label, iso2, xy[wp][0], xy[wp][1])
    by_city = collections.defaultdict(list)
    for k, v in cats.items():
        ci, yr, n = v
        if ci in city and 1900 <= yr <= 2015 and n >= 5:
            by_city[ci].append((yr, n, k))
    return city, by_city


# ──────────────────────────────── mode: cities ───────────────────────────────

def mode_cities():
    per_city = 6
    for i, a in enumerate(sys.argv):
        if a == "--per-city":
            per_city = int(sys.argv[i + 1])

    rows, urls, pairs = state()
    extra = {e["id"]: e for e in load_rows(EXTRA_OUT)}
    rej = collections.Counter()
    city, by_city = load_probe()
    idx_of = {city[i][0]: i for i in city}

    for name in CONTRACT_CITIES:
        if name not in idx_of:
            print("  %-12s no coordinates -- skipped" % name)
            continue
        ci = idx_of[name]
        label, iso2, clat, clon = city[ci]
        have_here = sum(1 for e in list(rows.values()) + list(extra.values())
                        if e["place"].startswith(label + ","))
        # one per decade, richest category first inside each decade, so a city
        # contributes era spread rather than six photos of the same year
        want_dec = collections.defaultdict(list)
        for yr, n, k in by_city.get(ci, []):
            want_dec[dec(yr)].append((-n, yr, k))
        got_total = 0
        for d in sorted(want_dec):
            if got_total >= per_city:
                break
            if any(dec(e["year"]) == d and e["place"].startswith(label + ",")
                   for e in list(rows.values()) + list(extra.values())):
                continue
            for _n, yr, k in sorted(want_dec[d])[:3]:
                g = harvest_cat(k, yr, label, iso2, clat, clon, 1,
                                rows, urls, pairs, extra, rej)
                got_total += g
                print("  %-34s +%d  (%s total %d)" %
                      (k.replace("Category:", "")[:34], g, label, have_here + got_total))
                save_extra(extra)
                if g:
                    break
        print("%-12s +%d (had %d)" % (label, got_total, have_here))

    report(extra, rej)


# ──────────────────────────────── mode: fill ─────────────────────────────────

def mode_fill():
    decades, n_want = [], 4
    for i, a in enumerate(sys.argv):
        if a == "--decades":
            decades = [int(x) for x in sys.argv[i + 1].split(",")]
        if a == "--n":
            n_want = int(sys.argv[i + 1])
    if not decades:
        print("need --decades 1940,1950")
        return

    rows, urls, pairs = state()
    extra = {e["id"]: e for e in load_rows(EXTRA_OUT)}
    rej = collections.Counter()
    city, by_city = load_probe()

    allrows = list(rows.values()) + list(extra.values())
    per_country = collections.Counter(e["iso2"] for e in allrows)
    per_cont = collections.Counter(L.continent_of(e["iso2"]) for e in allrows)
    per_city_n = collections.Counter(e["place"].split(",")[0] for e in allrows)

    # candidates for a decade, ordered so the thinnest continent goes first
    for d in decades:
        pool = []
        for ci, lst in by_city.items():
            label, iso2, clat, clon = city[ci]
            for yr, n, k in lst:
                if dec(yr) == d:
                    pool.append((k, ci, yr, n))
        got = 0
        while got < n_want and pool:
            pool.sort(key=lambda t: (per_cont[L.continent_of(city[t[1]][1])],
                                     per_country[city[t[1]][1]],
                                     per_city_n[city[t[1]][0]],
                                     -min(t[3], 90), t[0]))
            nxt = None
            for cand in pool:
                label, iso2, _a, _b = city[cand[1]]
                if per_city_n[label] >= 4 or per_country[iso2] >= 9:
                    continue
                nxt = cand
                break
            if nxt is None:
                break
            pool.remove(nxt)
            k, ci, yr, _n = nxt
            label, iso2, clat, clon = city[ci]
            g = harvest_cat(k, yr, label, iso2, clat, clon, 1,
                            rows, urls, pairs, extra, rej)
            if g:
                per_country[iso2] += g
                per_cont[L.continent_of(iso2)] += g
                per_city_n[label] += g
                got += g
            print("  %-34s +%d  (%ds %d/%d, extra %d)" %
                  (k.replace("Category:", "")[:34], g, d, got, n_want, len(extra)))
            save_extra(extra)

    report(extra, rej)


# ─────────────────────────────── mode: merge ─────────────────────────────────

def mode_merge():
    """Fold the extras into photos-time.json (only safe once the boost has exited)."""
    import subprocess
    ps = subprocess.run(["ps", "-Ao", "args="], capture_output=True, text=True).stdout
    if re.search(r"photos_boost\.py\s+time", ps):
        print("REFUSING: photos_boost.py time is still running and owns %s" % TIME_OUT)
        return 1
    base = {e["id"]: e for e in load_rows(TIME_OUT)}
    extra = load_rows(EXTRA_OUT)
    before = len(base)
    added = 0
    for e in extra:
        if e["id"] not in base:
            base[e["id"]] = e
            added += 1
    L.write_json(TIME_OUT, sorted(base.values(), key=lambda e: e["id"]))
    print("merged: %d + %d extras -> %d (%d were already present)"
          % (before, len(extra), len(base), len(extra) - added))
    c = collections.Counter(dec(e["year"]) for e in base.values())
    print("  decades: " + "  ".join("%ds:%d" % (k, c[k]) for k in sorted(c)))
    return 0


def report(extra, rej):
    c = collections.Counter(dec(e["year"]) for e in extra.values())
    print("\nextras: %d" % len(extra))
    print("  decades: " + "  ".join("%ds:%d" % (k, c[k]) for k in sorted(c)))
    print("  rejects: " + "  ".join("%s=%d" % kv for kv in rej.most_common(14)))


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if mode == "cities":
        mode_cities()
    elif mode == "fill":
        mode_fill()
    elif mode == "merge":
        sys.exit(mode_merge() or 0)
    else:
        print(__doc__)
        sys.exit(1)
