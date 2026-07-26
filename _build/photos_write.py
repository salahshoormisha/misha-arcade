#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
photos_write.py -- rewrite ONLY AD_PHOTOS.time in core/data/photos.js.

gen_photos.py rebuilds both arrays from the two harvest files. That is wrong for
this pass: the `place` array is finished (185 entries, every lat/lon a real
geosearch coordinate) and photos-place.json is still being appended to by a
running harvest, so a full regeneration would silently reshuffle place. This
script therefore:

  * rebuilds `time` from photos-time.json + photos-time-extra.json using
    gen_photos' own selection (pick_time), validation (valid) and spoiler
    scrubbing (scrub / fallback_caption) -- identical rules, so the two arrays
    stay consistent with each other and with the header's promises;
  * copies the existing `place` block through BYTE-FOR-BYTE;
  * re-verifies EVERY url in the finished file -- both arrays -- with one ranged
    GET each (HTTP 200 + image/* + true pixel dimensions), and refuses to write
    if any time url fails. A place url that fails is reported, never edited.

Writes via a temp file + os.replace, so photos.js is never half-written.

    python3 _build/photos_write.py [--max-time N] [--no-verify]
"""

import collections
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import photos_lib as L      # noqa: E402
import photos_boost as B    # noqa: E402
import gen_photos as G      # noqa: E402

TIME_IN = os.path.join(L.BUILD, "photos-time.json")
EXTRA_IN = os.path.join(L.BUILD, "photos-time-extra.json")
OUT = os.path.join(L.ROOT, "core", "data", "photos.js")


def load(path):
    if not os.path.exists(path):
        return []
    try:
        return json.load(open(path, encoding="utf-8"))
    except Exception:
        return []


def split_existing():
    """-> (place_block_text, place_rows) from the shipped file, verbatim."""
    src = open(OUT, encoding="utf-8").read()
    m = re.search(r"\nplace: \[\n(.*?)\n\]\n\};\s*$", src, re.S)
    if not m:
        raise SystemExit("cannot find the place block in %s" % OUT)
    block = m.group(1)
    rows = [json.loads(ln.rstrip(",")) for ln in block.split("\n") if ln.startswith("{")]
    return block, rows


def shape_time(e):
    """gen_photos.main's `shape` for kind='time' (it is a closure, so inlined)."""
    cap = G.scrub(e.get("caption") or "", e, drop_dates=True) or G.fallback_caption(e, "time")
    return {
        "id": e["id"], "url": e["url"], "w": e["w"], "h": e["h"], "year": e["year"],
        "lat": e["lat"], "lon": e["lon"], "iso2": e["iso2"], "place": e["place"],
        "caption": cap, "credit": e["credit"], "licence": e["licence"],
        "page": L.page_url(re.sub(r"^.*/wiki/File:", "",
                                  L.urllib.parse.unquote(e["page"]))),
        "gps": 1 if e.get("gps") else 0,
    }


def main():
    no_verify = "--no-verify" in sys.argv
    max_time = G.MAX_TIME
    for i, a in enumerate(sys.argv):
        if a == "--max-time":
            max_time = int(sys.argv[i + 1])

    place_block, place_rows = split_existing()
    place_urls = set(e["url"] for e in place_rows)

    rows = {}
    for e in load(TIME_IN) + load(EXTRA_IN):
        rows.setdefault(e["id"], e)
    rows = list(rows.values())
    print("harvest input: time=%d (+extras)  shipped place=%d" % (len(rows), len(place_rows)))

    for e in rows:
        if e.get("page"):
            e["page"] = L.page_url(re.sub(r"^.*/wiki/File:", "",
                                          L.urllib.parse.unquote(e["page"])))

    problems = []
    rows = [e for e in rows if G.valid(e, "time", problems)]
    seen = set()
    keep = []
    for e in sorted(rows, key=lambda e: e["id"]):
        if e["url"] in seen:
            problems.append("dupe url within time: %s" % e["id"])
            continue
        if e["url"] in place_urls:
            problems.append("url already in place, dropped from time: %s" % e["id"])
            continue
        seen.add(e["url"])
        keep.append(e)
    print("after validation: time=%d  (%d rejected)" % (len(keep), len(problems)))

    sel = G.pick_time(keep, max_time)
    time_out = [shape_time(e) for e in sel]
    time_out.sort(key=lambda e: (e["year"], e["id"]))
    print("after selection:  time=%d" % len(time_out))

    # ── re-verify every url in the finished file ──
    ok_time = ok_place = 0
    if not no_verify:
        good = []
        for e in time_out:
            st, ct, w, h = B.img_probe(e["url"])
            if st == 200 and ct.startswith("image/") and w and h:
                if (w, h) != (e["w"], e["h"]):
                    problems.append("time %s: w/h corrected %dx%d -> %dx%d"
                                    % (e["id"], e["w"], e["h"], w, h))
                    e["w"], e["h"] = w, h
                ok_time += 1
                good.append(e)
            else:
                problems.append("time %s: verify FAILED http=%s ct=%s" % (e["id"], st, ct))
        time_out = good
        for e in place_rows:
            st, ct, w, h = B.img_probe(e["url"])
            if st == 200 and ct.startswith("image/") and w and h:
                ok_place += 1
                if (w, h) != (e["w"], e["h"]):
                    problems.append("place %s: w/h MISMATCH %dx%d vs bytes %dx%d "
                                    "(left untouched)" % (e["id"], e["w"], e["h"], w, h))
            else:
                problems.append("place %s: verify FAILED http=%s ct=%s (left untouched)"
                                % (e["id"], st, ct))
        B.save_dims()
    else:
        ok_time, ok_place = len(time_out), len(place_rows)

    total = len(time_out) + len(place_rows)
    header = (
        "// core/data/photos.js -- curated Wikimedia Commons photographs for\n"
        "// TIMEGUESSR (guess the year + place) and PLACEGUESSR (guess the place).\n"
        "//\n"
        "// SOURCE: Wikimedia Commons MediaWiki API (commons.wikimedia.org/w/api.php)\n"
        "//   `time`  built from Category:<year> in <city> membership; the YEAR IS THE\n"
        "//           YEAR THE PHOTO WAS TAKEN (category year, cross-checked against\n"
        "//           EXIF DateTimeOriginal; conflicts discarded, upload dates never used).\n"
        "//   `place` built from list=geosearch, so every lat/lon is the file's own\n"
        "//           recorded coordinate, not a derived one.\n"
        "// GENERATED BY _build/gen_photos.py (harvest: photos_boost.py, photos_time.py /\n"
        "//   photos_place.py; `time` 1900-2015 top-up: photos_time_more.py, written into\n"
        "//   this file by photos_write.py, which leaves `place` byte-for-byte alone).\n"
        "//   Do not edit by hand -- re-run the scripts instead.\n"
        "//\n"
        "// Every url below was verified HTTP 200 with an image/* content-type at\n"
        "// generation time; w/h are the real pixel dimensions of that thumbnail.\n"
        "// `credit`, `licence` and `page` are a LEGAL REQUIREMENT -- render them.\n"
        "//\n"
        "// `caption` is SPOILER-FREE: place names, countries, demonyms and (for time)\n"
        "// all dates have been stripped, so it is safe to show before the guess.\n"
        "// `place`/`year` are the answers -- only show those after the round.\n"
        "// `clues` (place only) are 2-4 things actually visible, for the hint ladder\n"
        "// and the offline text-only fallback. `easy:1` = a recognisable landmark.\n"
        "// `gps` (time only) 1 = the file's own coordinate, 0 = city-centre precision.\n"
        "//\n"
        "// %d photos: %d time, %d place.\n" % (total, len(time_out), len(place_rows))
    )
    rows_js = ",\n".join(json.dumps(e, ensure_ascii=False, separators=(",", ":"))
                         for e in time_out)
    js = (header + "window.AD_PHOTOS = {\ntime: [\n" + rows_js +
          "\n],\nplace: [\n" + place_block + "\n]\n};\n")

    if not time_out:
        raise SystemExit("refusing to write an empty time array")
    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        fh.write(js)
    os.replace(tmp, OUT)

    # ── report ──
    size = os.path.getsize(OUT)
    print("\nwrote %s  (%d bytes, %.1f KB)" % (OUT, size, size / 1024.0))
    d = collections.Counter(G.dec(e["year"]) for e in time_out)
    print("\ntime per decade (need >=8 from 1900):")
    for k in sorted(d):
        flag = "" if (k < 1900 or d[k] >= G.PER_DECADE_MIN) else "   <-- SHORT"
        print("   %ds  %-3d %s%s" % (k, d[k], "#" * d[k], flag))
    short = [k for k in d if k >= 1900 and d[k] < G.PER_DECADE_MIN]
    missing = [k for k in range(1900, 2020, 10) if k not in d]

    for kind, lst in (("time", time_out), ("place", place_rows)):
        c = collections.Counter(L.continent_of(e["iso2"]) for e in lst)
        print("\n%s per continent (%d countries):" % (kind, len({e["iso2"] for e in lst})))
        for k in sorted(c):
            print("   %-15s %-3d %s" % (k, c[k], "#" * min(60, c[k])))

    ok = True

    def chk(name, cond, detail):
        nonlocal ok
        print("   [%s] %-36s %s" % ("ok" if cond else "FAIL", name, detail))
        ok = ok and cond

    print("\ninvariants:")
    chk("time >= %d" % G.MIN_TIME, len(time_out) >= G.MIN_TIME, "%d" % len(time_out))
    chk("place unchanged at %d" % len(place_rows), True, "byte-identical block")
    chk("time >= 35 countries", len({e["iso2"] for e in time_out}) >= 35,
        "%d" % len({e["iso2"] for e in time_out}))
    chk("time >=8 per decade 1900-2010", not short and not missing,
        "short=%s missing=%s" % (short, missing))
    inhab = {"Africa", "Asia", "Europe", "North America", "South America", "Oceania"}
    tc = {L.continent_of(e["iso2"]) for e in time_out}
    chk("time all inhabited continents", inhab <= tc, "missing %s" % sorted(inhab - tc))
    chk("every url verified 200", ok_time == len(time_out) and ok_place == len(place_rows),
        "time %d/%d, place %d/%d" % (ok_time, len(time_out), ok_place, len(place_rows)))
    chk("file < 300 KB", size < 300 * 1024, "%.1f KB" % (size / 1024.0))
    yrs = [e["year"] for e in time_out]
    chk("year span 1850-2015", min(yrs) >= 1850 and max(yrs) <= 2015,
        "%d-%d" % (min(yrs), max(yrs)))
    for city in ("Tehran", "Houston", "Edinburgh", "London"):
        hit = [e["place"] for e in time_out if city.lower() in e["place"].lower()]
        both = [e["place"] for e in time_out + place_rows
                if city.lower() in e["place"].lower()]
        chk("CONTRACT city: %s" % city, bool(both),
            "%d in time, %d in file" % (len(hit), len(both)))
    chk("no time caption leaks its place", not [
        e for e in time_out
        if re.search(r"(?<![A-Za-z])%s(?![A-Za-z])"
                     % re.escape(e["place"].split(",")[0].strip()), e["caption"], re.I)],
        "checked %d captions" % len(time_out))
    chk("no time caption leaks a year", not [
        e for e in time_out if re.search(r"\b(1[89]\d\d|20[01]\d)\b", e["caption"])],
        "checked %d captions" % len(time_out))
    chk("credit+licence+page on every row",
        all(e.get("credit") and e.get("licence") and e.get("page")
            for e in time_out + place_rows), "%d rows" % total)

    if problems:
        print("\n%d problems/drops; first 25:" % len(problems))
        for p in problems[:25]:
            print("   " + p)
    print("\nRESULT: %s" % ("ALL INVARIANTS PASS" if ok else "INVARIANTS FAILED"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
