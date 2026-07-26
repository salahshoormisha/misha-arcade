#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
photos_time.py -- harvest the TimeGuessr-style half of core/data/photos.js

Method
  1. A curated seed list of CITIES (name + ISO2 only; coordinates come from
     en.wikipedia `prop=coordinates`, nothing is guessed).
  2. Probe `Category:<year> in <city>` for every (city, year) in 1850-2015 with
     `prop=categoryinfo` in batches of 50 — cheap, and it tells us the file
     count before we fetch anything.
  3. Walk the surviving categories decade by decade (quota per decade, cap per
     city) and pull their file members.
  4. YEAR = the category year, cross-checked against DateTimeOriginal.
     Conflicts are discarded; a post-1995 EXIF date on a pre-1990 category is
     treated as the scan date (photos_lib.resolve_year).
  5. LAT/LON = the file's own recorded coordinates when it has them, otherwise
     the seed city's coordinates (city-level precision, which is the resolution
     the game scores at). Anything that cannot be placed to a city is dropped.
  6. Verify every thumbnail URL is HTTP 200 with an image content-type.

Writes `_build/photos-time.json` after EVERY category, so an interrupted run
always leaves a loadable file behind. Deterministic + re-runnable (cached).

    python3 _build/photos_time.py [--probe] [--per-decade N]
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import photos_lib as L  # noqa: E402

OUT = os.path.join(L.BUILD, "photos-time.json")
PROBE_CACHE = os.path.join(L.BUILD, "cache", "photos", "_time_cats.json")

# (wikipedia title, display label, ISO2) — cities with deep dated Commons cover.
CITIES = [
    # Europe
    ("London", "London", "GB"), ("Paris", "Paris", "FR"), ("Berlin", "Berlin", "DE"),
    ("Vienna", "Vienna", "AT"), ("Amsterdam", "Amsterdam", "NL"), ("Rome", "Rome", "IT"),
    ("Madrid", "Madrid", "ES"), ("Lisbon", "Lisbon", "PT"), ("Stockholm", "Stockholm", "SE"),
    ("Copenhagen", "Copenhagen", "DK"), ("Oslo", "Oslo", "NO"), ("Helsinki", "Helsinki", "FI"),
    ("Warsaw", "Warsaw", "PL"), ("Prague", "Prague", "CZ"), ("Budapest", "Budapest", "HU"),
    ("Moscow", "Moscow", "RU"), ("Saint Petersburg", "Saint Petersburg", "RU"),
    ("Athens", "Athens", "GR"), ("Dublin", "Dublin", "IE"), ("Brussels", "Brussels", "BE"),
    ("Zurich", "Zurich", "CH"), ("Munich", "Munich", "DE"), ("Hamburg", "Hamburg", "DE"),
    ("Barcelona", "Barcelona", "ES"), ("Naples", "Naples", "IT"), ("Venice", "Venice", "IT"),
    ("Kyiv", "Kyiv", "UA"), ("Bucharest", "Bucharest", "RO"), ("Belgrade", "Belgrade", "RS"),
    ("Sofia", "Sofia", "BG"), ("Glasgow", "Glasgow", "GB"), ("Manchester", "Manchester", "GB"),
    ("Edinburgh", "Edinburgh", "GB"), ("Milan", "Milan", "IT"), ("Rotterdam", "Rotterdam", "NL"),
    ("Antwerp", "Antwerp", "BE"), ("Gothenburg", "Gothenburg", "SE"),
    ("Bergen", "Bergen", "NO"), ("Tallinn", "Tallinn", "EE"), ("Riga", "Riga", "LV"),
    ("Vilnius", "Vilnius", "LT"), ("Zagreb", "Zagreb", "HR"), ("Ljubljana", "Ljubljana", "SI"),
    ("Bratislava", "Bratislava", "SK"), ("Reykjavík", "Reykjavik", "IS"),
    ("Valletta", "Valletta", "MT"), ("Sarajevo", "Sarajevo", "BA"),
    ("Porto", "Porto", "PT"), ("Seville", "Seville", "ES"), ("Florence", "Florence", "IT"),
    ("Lyon", "Lyon", "FR"), ("Marseille", "Marseille", "FR"), ("Cologne", "Cologne", "DE"),
    ("Frankfurt", "Frankfurt", "DE"), ("Dresden", "Dresden", "DE"),
    ("Geneva", "Geneva", "CH"), ("Liverpool", "Liverpool", "GB"),
    # Asia
    ("Tokyo", "Tokyo", "JP"), ("Kyoto", "Kyoto", "JP"), ("Osaka", "Osaka", "JP"),
    ("Yokohama", "Yokohama", "JP"), ("Nagasaki", "Nagasaki", "JP"),
    ("Seoul", "Seoul", "KR"), ("Busan", "Busan", "KR"),
    ("Beijing", "Beijing", "CN"), ("Shanghai", "Shanghai", "CN"),
    ("Guangzhou", "Guangzhou", "CN"), ("Hong Kong", "Hong Kong", "HK"),
    ("Taipei", "Taipei", "TW"), ("Singapore", "Singapore", "SG"),
    ("Bangkok", "Bangkok", "TH"), ("Manila", "Manila", "PH"),
    ("Jakarta", "Jakarta", "ID"), ("Surabaya", "Surabaya", "ID"),
    ("Hanoi", "Hanoi", "VN"), ("Ho Chi Minh City", "Ho Chi Minh City", "VN"),
    ("Kuala Lumpur", "Kuala Lumpur", "MY"), ("Phnom Penh", "Phnom Penh", "KH"),
    ("Yangon", "Yangon", "MM"), ("Delhi", "Delhi", "IN"), ("Mumbai", "Mumbai", "IN"),
    ("Kolkata", "Kolkata", "IN"), ("Chennai", "Chennai", "IN"),
    ("Bangalore", "Bangalore", "IN"), ("Karachi", "Karachi", "PK"),
    ("Lahore", "Lahore", "PK"), ("Dhaka", "Dhaka", "BD"), ("Colombo", "Colombo", "LK"),
    ("Kathmandu", "Kathmandu", "NP"), ("Tehran", "Tehran", "IR"),
    ("Isfahan", "Isfahan", "IR"), ("Shiraz", "Shiraz", "IR"),
    ("Istanbul", "Istanbul", "TR"), ("Ankara", "Ankara", "TR"), ("Izmir", "Izmir", "TR"),
    ("Jerusalem", "Jerusalem", "IL"), ("Tel Aviv", "Tel Aviv", "IL"),
    ("Damascus", "Damascus", "SY"), ("Beirut", "Beirut", "LB"),
    ("Baghdad", "Baghdad", "IQ"), ("Amman", "Amman", "JO"), ("Kabul", "Kabul", "AF"),
    ("Tashkent", "Tashkent", "UZ"), ("Samarkand", "Samarkand", "UZ"),
    ("Yerevan", "Yerevan", "AM"), ("Tbilisi", "Tbilisi", "GE"), ("Baku", "Baku", "AZ"),
    ("Ulaanbaatar", "Ulaanbaatar", "MN"), ("Almaty", "Almaty", "KZ"),
    ("Dubai", "Dubai", "AE"), ("Riyadh", "Riyadh", "SA"), ("Jeddah", "Jeddah", "SA"),
    # Africa
    ("Cairo", "Cairo", "EG"), ("Alexandria", "Alexandria", "EG"),
    ("Algiers", "Algiers", "DZ"), ("Tunis", "Tunis", "TN"),
    ("Casablanca", "Casablanca", "MA"), ("Marrakesh", "Marrakesh", "MA"),
    ("Tripoli, Libya", "Tripoli", "LY"), ("Nairobi", "Nairobi", "KE"),
    ("Mombasa", "Mombasa", "KE"), ("Addis Ababa", "Addis Ababa", "ET"),
    ("Lagos", "Lagos", "NG"), ("Accra", "Accra", "GH"), ("Dakar", "Dakar", "SN"),
    ("Johannesburg", "Johannesburg", "ZA"), ("Cape Town", "Cape Town", "ZA"),
    ("Durban", "Durban", "ZA"), ("Pretoria", "Pretoria", "ZA"),
    ("Zanzibar City", "Zanzibar City", "TZ"), ("Dar es Salaam", "Dar es Salaam", "TZ"),
    ("Khartoum", "Khartoum", "SD"), ("Kinshasa", "Kinshasa", "CD"),
    ("Luanda", "Luanda", "AO"), ("Harare", "Harare", "ZW"), ("Kampala", "Kampala", "UG"),
    ("Lusaka", "Lusaka", "ZM"), ("Abidjan", "Abidjan", "CI"),
    ("Windhoek", "Windhoek", "NA"), ("Maputo", "Maputo", "MZ"),
    ("Antananarivo", "Antananarivo", "MG"), ("Freetown", "Freetown", "SL"),
    ("Bamako", "Bamako", "ML"), ("Asmara", "Asmara", "ER"),
    # Americas
    ("New York City", "New York City", "US"), ("Chicago", "Chicago", "US"),
    ("San Francisco", "San Francisco", "US"), ("Boston", "Boston", "US"),
    ("Washington, D.C.", "Washington, D.C.", "US"), ("Los Angeles", "Los Angeles", "US"),
    ("New Orleans", "New Orleans", "US"), ("Philadelphia", "Philadelphia", "US"),
    ("Seattle", "Seattle", "US"), ("Detroit", "Detroit", "US"),
    ("Baltimore", "Baltimore", "US"), ("St. Louis", "St. Louis", "US"),
    ("Toronto", "Toronto", "CA"), ("Montreal", "Montreal", "CA"),
    ("Vancouver", "Vancouver", "CA"), ("Ottawa", "Ottawa", "CA"),
    ("Mexico City", "Mexico City", "MX"), ("Guadalajara", "Guadalajara", "MX"),
    ("Havana", "Havana", "CU"), ("San Juan, Puerto Rico", "San Juan", "PR"),
    ("Panama City", "Panama City", "PA"), ("Guatemala City", "Guatemala City", "GT"),
    ("Kingston, Jamaica", "Kingston", "JM"),
    ("Buenos Aires", "Buenos Aires", "AR"), ("Rio de Janeiro", "Rio de Janeiro", "BR"),
    ("São Paulo", "Sao Paulo", "BR"), ("Salvador, Bahia", "Salvador", "BR"),
    ("Santiago", "Santiago", "CL"), ("Valparaíso", "Valparaiso", "CL"),
    ("Lima", "Lima", "PE"), ("Bogotá", "Bogota", "CO"), ("Medellín", "Medellin", "CO"),
    ("Caracas", "Caracas", "VE"), ("Montevideo", "Montevideo", "UY"),
    ("Quito", "Quito", "EC"), ("La Paz", "La Paz", "BO"), ("Asunción", "Asuncion", "PY"),
    # Oceania
    ("Sydney", "Sydney", "AU"), ("Melbourne", "Melbourne", "AU"),
    ("Brisbane", "Brisbane", "AU"), ("Adelaide", "Adelaide", "AU"),
    ("Perth", "Perth", "AU"), ("Hobart", "Hobart", "AU"),
    ("Auckland", "Auckland", "NZ"), ("Wellington", "Wellington", "NZ"),
    ("Christchurch", "Christchurch", "NZ"), ("Dunedin", "Dunedin", "NZ"),
    ("Honolulu", "Honolulu", "US"), ("Suva", "Suva", "FJ"),
    ("Port Moresby", "Port Moresby", "PG"), ("Nouméa", "Noumea", "NC"),
    ("Papeete", "Papeete", "PF"), ("Apia", "Apia", "WS"),
]

YEARS = list(range(1850, 2016))
EXT_OK = re.compile(r"\.(jpe?g|png)$", re.I)

# Era cues: what makes a good TimeGuessr photo — visible, datable everyday life.
ERA_BONUS = re.compile(
    r"\b(street|streets|road|traffic|tram|trolley|omnibus|automobile|motor car|"
    r"shop|shops|storefront|market|crowd|parade|procession|festival|fair|"
    r"station|railway|platform|harbour|harbor|docks?|construction|building site|"
    r"pedestrian|passers|children|workers|queue|café|cafe|restaurant|"
    r"advertis|billboard|poster|neon|shopfront|bus|bicycle|horse|carriage|"
    r"square|plaza|boulevard|promenade|beach|park|schoolyard|playground|"
    r"everyday|daily life|scene|view of|panorama|skyline|rooftops|"
    r"fashion|dress|uniform|hat|petrol|filling station|garage|airport|airfield)\b",
    re.I)


def decade(y):
    return (y // 10) * 10


def probe(cities_xy):
    """{category title: (city_idx, year, files)} for every category that exists."""
    if os.path.exists(PROBE_CACHE):
        try:
            with open(PROBE_CACHE, encoding="utf-8") as fh:
                cached = json.load(fh)
            if cached.get("n_cities") == len(CITIES):
                print("probe: using cached category index (%d categories)" %
                      len(cached["cats"]))
                return {k: tuple(v) for k, v in cached["cats"].items()}
        except Exception:
            pass
    # Pass 1 — Commons spells city names its own way ("São Paulo", "Tripoli",
    # "Kyiv"). Try a few variants on sample years and keep whichever hits.
    SAMPLE = (1900, 1925, 1945, 1955, 1965, 1980, 1995, 2005, 2012)
    variants, probe1 = {}, []
    for ci, (wp, label, iso2) in enumerate(CITIES):
        if wp not in cities_xy:
            continue
        wt = cities_xy[wp][2]
        vs = []
        for v in (wt, label, wt.split(",")[0].strip(), label.split(",")[0].strip()):
            if v and v not in vs:
                vs.append(v)
        variants[ci] = vs
        for v in vs:
            for y in SAMPLE:
                probe1.append(("Category:%d in %s" % (y, v), ci, v))
    print("probe pass 1: %d name-variant tests…" % len(probe1))
    hits = {}
    seenn = list(dict.fromkeys(n for n, _, _ in probe1))
    counts1 = {}
    for i in range(0, len(seenn), 50):
        counts1.update(L.cat_counts(seenn[i:i + 50], prefix="tcat"))
    for n, ci, v in probe1:
        if n in counts1:
            hits[(ci, v)] = hits.get((ci, v), 0) + counts1[n]
    best = {}
    for ci, vs in variants.items():
        scored = sorted(((hits.get((ci, v), 0), -j, v) for j, v in enumerate(vs)),
                        reverse=True)
        if scored and scored[0][0] > 0:
            best[ci] = scored[0][2]
    print("probe pass 1: %d/%d cities have a live category name" %
          (len(best), len(variants)))

    names, meta = [], {}
    for ci, v in best.items():
        for y in YEARS:
            t = "Category:%d in %s" % (y, v)
            names.append(t)
            meta[t] = (ci, y)
    print("probe pass 2: testing %d candidate categories in %d batches…" %
          (len(names), (len(names) + 49) // 50))
    counts, done = {}, 0
    for i in range(0, len(names), 50):
        got = L.cat_counts(names[i:i + 50], prefix="tcat")
        counts.update(got)
        done += 1
        if done % 40 == 0:
            print("   …%d/%d batches, %d live categories" %
                  (done, (len(names) + 49) // 50, len(counts)))
    cats = {t: (meta[t][0], meta[t][1], n) for t, n in counts.items() if t in meta}
    with open(PROBE_CACHE, "w", encoding="utf-8") as fh:
        json.dump({"n_cities": len(CITIES),
                   "cats": {k: list(v) for k, v in cats.items()}}, fh)
    print("probe: %d live categories" % len(cats))
    return cats


def harvest():
    per_decade = 16
    for i, a in enumerate(sys.argv):
        if a == "--per-decade":
            per_decade = int(sys.argv[i + 1])
    iso = L.by_iso()

    print("resolving %d city coordinates from en.wikipedia…" % len(CITIES))
    xy = L.resolve_places([c[0] for c in CITIES])
    cities_xy = {}
    for wp, label, iso2 in CITIES:
        if wp in xy:
            cities_xy[wp] = (xy[wp][0], xy[wp][1], xy[wp][2])
    missing = [c[0] for c in CITIES if c[0] not in cities_xy]
    if missing:
        print("  ! no coordinates for: %s" % ", ".join(missing))

    cats = probe(cities_xy)
    if "--probe" in sys.argv:
        by_dec = {}
        for t, (ci, y, n) in cats.items():
            by_dec.setdefault(decade(y), [0, 0])
            by_dec[decade(y)][0] += 1
            by_dec[decade(y)][1] += n
        for d in sorted(by_dec):
            print("  %ds  categories=%-5d files=%d" % (d, by_dec[d][0], by_dec[d][1]))
        return

    out = {}
    if os.path.exists(OUT):
        try:
            out = {e["id"]: e for e in json.load(open(OUT, encoding="utf-8"))}
            print("resuming with %d entries already on disk" % len(out))
        except Exception:
            out = {}

    # Order categories so each decade draws from many cities/continents:
    # richest-first within a decade, but round-robin over cities.
    buckets = {}
    for t, (ci, y, n) in cats.items():
        if n < 2:
            continue
        buckets.setdefault(decade(y), []).append((ci, y, n, t))
    order = {}
    for d, rows in buckets.items():
        rows.sort(key=lambda r: (-r[2], r[3]))
        seen, ring = {}, []
        for r in rows:
            seen.setdefault(r[0], []).append(r)
        # interleave: one category per city per pass
        while any(seen.values()):
            for ci in sorted(seen):
                if seen[ci]:
                    ring.append(seen[ci].pop(0))
        order[d] = ring

    stats = {"cats": 0, "cand": 0, "rej": {}, "kept": 0, "gps": 0, "derived": 0}

    def bump(k):
        stats["rej"][k] = stats["rej"].get(k, 0) + 1

    def n_in(d):
        return sum(1 for e in out.values() if decade(e["year"]) == d)

    for d in sorted(order):
        percity = {}
        for ci, y, n, t in order[d]:
            if n_in(d) >= per_decade:
                break
            wp, label, iso2 = CITIES[ci]
            if percity.get(ci, 0) >= (3 if d < 1900 else 2):
                continue
            if wp not in cities_xy:
                continue
            clat, clon, _ = cities_xy[wp]
            cn = (iso.get(iso2) or {}).get("n") or iso2
            place = "%s, %s" % (label, cn)
            stats["cats"] += 1
            pages = L.cat_files(t, limit=90, prefix="tc")
            scored = []
            for p in pages:
                stats["cand"] += 1
                title = L.title_of(p)
                if not EXT_OK.search(title):
                    bump("not-a-photo-file")
                    continue
                ii = (p.get("imageinfo") or [{}])[0]
                if not ii:
                    bump("no-imageinfo")
                    continue
                url, w, h = L.thumb_url(ii)
                if not url or w < 600:
                    bump("too-small")
                    continue
                if h and w and h / float(w) > 1.35:
                    bump("portrait-orientation")
                    continue
                lic = L.licence_of(ii)
                if not lic:
                    bump("licence-not-shippable")
                    continue
                cred = L.credit_of(ii)
                if not cred:
                    bump("no-credit")
                    continue
                year, ysrc = L.resolve_year(y, ii)
                if year is None:
                    bump(ysrc)
                    continue
                if not (1850 <= year <= 2015):
                    bump("year-out-of-range")
                    continue
                cats_s = " | ".join(c.get("title", "").replace("Category:", "")
                                    for c in (p.get("categories") or []))
                desc = L.clean(L.em(ii, "ImageDescription"), 220)
                obj = L.clean(L.em(ii, "ObjectName"), 120)
                near = title.replace("_", " ").rsplit(".", 1)[0] + " . " + desc + " . " + obj
                blob = " ".join([near, cats_s])
                r = L.rejected(blob)
                if r:
                    bump("scene:" + r)
                    continue
                if L.has_burned_place(title, place):
                    bump("place-name-in-frame")
                    continue
                if not L.STRONG_RE.search(blob):
                    bump("no-outdoor-scene-word")
                    continue
                co = (p.get("coordinates") or [{}])[0]
                if co.get("lat") is not None:
                    lat, lon = round(float(co["lat"]), 5), round(float(co["lon"]), 5)
                    gps = 1
                    if L.haversine((lat, lon), (clat, clon)) > 60:
                        bump("coords-far-from-city")
                        continue
                else:
                    lat, lon, gps = clat, clon, 0
                cap = desc if len(desc) >= 14 else (obj or title.replace("_", " ").rsplit(".", 1)[0])
                cap = re.sub(r"\s+", " ", cap).strip(" .,;:-|\"'")[:150]
                sc = 0
                sc += 3 * min(6, len(set(m.lower() for m in ERA_BONUS.findall(blob))))
                sc += 3 * min(4, len(set(m.lower() for m in L.STRONG_RE.findall(blob))))
                sc += 4 if L.STRONG_RE.search(near) else 0
                sc += 3 if gps else 0
                sc += 2 if w >= 900 else 0
                sc += 2 if len(cap) >= 30 else 0
                sc += 2 if ysrc == "exif" else 0
                sc -= 4 if re.search(r"\b(museum|monument|memorial|statue|"
                                     r"aerial|from the air)\b", blob, re.I) else 0
                scored.append((sc, {
                    "id": "t_" + L.slug(title.rsplit(".", 1)[0], 46),
                    "url": url, "w": w, "h": h, "year": year,
                    "lat": lat, "lon": lon, "gps": gps,
                    "place": place, "iso2": iso2, "caption": cap,
                    "credit": cred, "licence": lic,
                    "page": "https://commons.wikimedia.org/wiki/" +
                            L.urllib.parse.quote("File:" + title.replace(" ", "_")),
                }))
            scored.sort(key=lambda t2: (-t2[0], t2[1]["id"]))
            picked, sigs = 0, set()
            for sc, e in scored:
                if picked >= 2 or n_in(d) >= per_decade:
                    break
                if e["id"] in out:
                    continue
                sig = re.sub(r"[^a-z]+", "", e["caption"].lower())[:26]
                if sig in sigs:
                    bump("near-duplicate")
                    continue
                st, ct = L.verify_url(e["url"])
                if st != 200 or not ct.startswith("image/"):
                    bump("http-%s" % st)
                    continue
                e["ct"] = ct
                sigs.add(sig)
                out[e["id"]] = e
                picked += 1
                stats["kept"] += 1
                stats["gps" if e["gps"] else "derived"] += 1
            percity[ci] = percity.get(ci, 0) + 1
            if picked:
                print("  %-34s +%d  (%ds now %d, total %d)" %
                      (t.replace("Category:", "")[:34], picked, d, n_in(d), len(out)))
            # ── CHECKPOINT after every category ──
            L.write_json(OUT, sorted(out.values(), key=lambda e: (e["year"], e["id"])))
            L.save_head_cache()

    L.write_json(OUT, sorted(out.values(), key=lambda e: (e["year"], e["id"])))
    L.save_head_cache()
    print("\ncategories=%d candidates=%d kept=%d  gps=%d derived=%d  countries=%d" %
          (stats["cats"], stats["cand"], stats["kept"], stats["gps"], stats["derived"],
           len({e["iso2"] for e in out.values()})))
    dec = {}
    for e in out.values():
        dec[decade(e["year"])] = dec.get(decade(e["year"]), 0) + 1
    print("per decade: " + "  ".join("%ds:%d" % (d, dec[d]) for d in sorted(dec)))
    print("top rejects:")
    for k, v in sorted(stats["rej"].items(), key=lambda t: -t[1])[:22]:
        print("   %-28s %d" % (k, v))


if __name__ == "__main__":
    harvest()
