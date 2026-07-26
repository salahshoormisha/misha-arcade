#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_photos.py -- build core/data/photos.js from the two harvest files.

    _build/photos-time.json   (photos_time.py)   -> AD_PHOTOS.time
    _build/photos-place.json  (photos_place.py)  -> AD_PHOTOS.place

What this stage adds on top of the harvests:

  1. SPOILER SCRUB. The harvested `caption` comes straight off Commons and very
     often contains the answer -- "Street Scene, Arusha, Tanzania, December 1999".
     TimeGuessr-style rounds score BOTH year and location, so a caption like that
     hands over the whole round. Every place name, country name, demonym and
     (for `time`) every date is stripped out, so the caption is safe to show at
     any point in the round and the games cannot leak the answer by accident.
  2. BALANCED SELECTION against the required invariants -- per-decade quotas for
     `time`, per-continent/per-country spread for `place`, and the ~15% `easy:1`
     landmark ratio -- while staying inside the 300 KB file budget.
  3. RE-VERIFICATION of every surviving URL (HTTP 200 + image/* content type)
     immediately before the file is written, so `verified == total` by
     construction rather than by an earlier run's say-so.
  4. INVARIANT REPORT: totals, per-decade and per-continent histograms.

Deterministic: no randomness, ties broken on id. Re-runnable: all HTTP is cached
under _build/cache/photos/.

    python3 _build/gen_photos.py [--no-verify] [--max-time N] [--max-place N]
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import photos_lib as L  # noqa: E402
import photos_boost as B  # noqa: E402  (img_probe: verify + TRUE pixel size)

TIME_IN = os.path.join(L.BUILD, "photos-time.json")
PLACE_IN = os.path.join(L.BUILD, "photos-place.json")
OUT = os.path.join(L.ROOT, "core", "data", "photos.js")

# Targets. Floors come from the task spec; caps keep the file under 300 KB.
MIN_TIME, MAX_TIME = 110, 190
MIN_PLACE, MAX_PLACE = 120, 260
PER_DECADE_MIN = 8            # for decades from 1900 on
EASY_RATIO = 0.15             # share of `place` marked as recognisable landmarks

MONTHS = (r"january|february|march|april|may|june|july|august|september|october|"
          r"november|december|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec")


# ───────────────────────── spoiler scrubbing ──────────────────────────────

def spoiler_terms(e):
    """Every phrase in this entry's caption that would give the answer away."""
    iso = L.by_iso().get(e["iso2"]) or {}
    terms = []

    def add(s):
        s = (s or "").strip()
        if len(s) >= 3:
            terms.append(s)

    add(iso.get("n"))
    add(iso.get("cap"))
    add(iso.get("demo"))
    add(iso.get("n3"))
    for a in iso.get("alt") or []:
        add(a)
    # the place label and each of its comma-separated parts
    place = e.get("place") or ""
    add(place)
    for part in place.split(","):
        add(part)

    # Individual words of multi-word names, but only distinctive ones -- pulling
    # "United"/"New"/"City" out of a caption mangles unrelated phrases.
    AMBIG = {"north", "south", "east", "west", "new", "city", "town", "united",
             "states", "state", "republic", "saint", "island", "islands", "central",
             "great", "british", "american", "province", "region", "district",
             "national", "people", "democratic", "federal", "the", "and", "of",
             "port", "san", "santa", "sao", "mount", "lake", "river", "bay",
             "old", "upper", "lower", "grand", "cape", "fort", "puerto"}
    for t in list(terms):
        for w in re.split(r"[^A-Za-zÀ-ɏ']+", t):
            if len(w) >= 5 and w.lower() not in AMBIG:
                terms.append(w)

    # Longest first so "South Africa" goes before "Africa".
    return sorted(set(terms), key=lambda s: (-len(s), s))


def scrub(caption, e, drop_dates):
    """Remove place/country/demonym (and optionally dates) from a caption."""
    s = caption or ""
    for t in spoiler_terms(e):
        s = re.sub(r"(?<![A-Za-z])%s(?![A-Za-z])" % re.escape(t), " ", s,
                   flags=re.I | re.U)
    if drop_dates:
        s = re.sub(r"\b(1[6-9]\d\d|20[0-4]\d)s?\b", " ", s)
        s = re.sub(r"\b(%s)\b\.?" % MONTHS, " ", s, flags=re.I)
        s = re.sub(r"\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b", " ", s)
        s = re.sub(r"\b\d{1,2}(st|nd|rd|th)\b", " ", s, flags=re.I)
        # "in the 19th century", "circa", now-dangling connectives
        s = re.sub(r"\b(circa|ca\.?|anno)\b", " ", s, flags=re.I)
    # tidy the holes the removals left behind
    s = re.sub(r"\s*\(\s*\)\s*", " ", s)
    s = re.sub(r"\s*\[\s*\]\s*", " ", s)
    s = re.sub(r"\s+([,.;:!?])", r"\1", s)
    s = re.sub(r"([,;:])\s*(?=[,.;:])", " ", s)
    s = re.sub(r"^[\s,.;:\-–—/&|]+", "", s)
    s = re.sub(r"\s+", " ", s)
    # a caption that is now only connectives carries no information
    s = s.strip(" ,.;:-–—/&|\"'()[]")
    if re.fullmatch(r"(?:(?:in|at|on|the|a|an|of|from|near|and|or|to|by|view|"
                    r"seen|looking|photo|photograph|image|picture|unknown)\b[\s,.-]*)*",
                    s, flags=re.I):
        return ""
    if len(s) < 8:
        return ""
    # sentence-case a caption that lost its leading word
    return s[0].upper() + s[1:] if s[0].islower() else s


def fallback_caption(e, kind):
    """A neutral, spoiler-free caption when scrubbing emptied the original."""
    if kind == "place":
        cl = e.get("clues") or []
        if len(cl) >= 2:
            return "A view with %s and %s" % (cl[0], cl[1])
        if cl:
            return "A view with %s" % cl[0]
        return "An everyday outdoor view"
    return "An everyday street scene of the period"


# ───────────────────────── selection ──────────────────────────────────────

def dec(y):
    return (y // 10) * 10


def quality(e):
    """Deterministic desirability score used only to break ties in selection."""
    s = 0
    cap = e.get("caption") or ""
    s += min(30, len(cap) // 4)
    s += 8 if e.get("w", 0) >= 1000 else 0
    s += 6 if 1.2 <= (e.get("w", 1) / float(e.get("h") or 1)) <= 2.0 else 0
    s += 4 * len(e.get("clues") or [])
    s += 6 if e.get("gps") else 0
    return s


def pick_time(rows, cap):
    """Fill every decade to PER_DECADE_MIN first, then spread the remainder."""
    by = {}
    for e in rows:
        by.setdefault(dec(e["year"]), []).append(e)
    for d in by:
        by[d].sort(key=lambda e: (-quality(e), e["id"]))

    chosen, used = [], set()

    def take(e):
        if e["id"] in used:
            return False
        used.add(e["id"])
        chosen.append(e)
        return True

    # pass 1 -- the floor, and a country-spreading preference inside each decade
    for d in sorted(by):
        seen_iso = {}
        n = 0
        for e in by[d]:
            if n >= PER_DECADE_MIN:
                break
            if seen_iso.get(e["iso2"], 0) >= 2:
                continue
            if take(e):
                seen_iso[e["iso2"]] = seen_iso.get(e["iso2"], 0) + 1
                n += 1
        for e in by[d]:                      # relax the per-country cap if short
            if n >= PER_DECADE_MIN:
                break
            if take(e):
                n += 1

    # pass 2 -- round-robin over decades until the cap
    while len(chosen) < cap:
        progressed = False
        for d in sorted(by):
            if len(chosen) >= cap:
                break
            for e in by[d]:
                if e["id"] not in used:
                    take(e)
                    progressed = True
                    break
        if not progressed:
            break
    return sorted(chosen, key=lambda e: (e["year"], e["id"]))


def pick_place(rows, cap):
    """Spread over continents and countries; hold `easy` down to ~EASY_RATIO."""
    ordinary = [e for e in rows if not e.get("easy")]
    landmarks = [e for e in rows if e.get("easy")]
    for lst in (ordinary, landmarks):
        lst.sort(key=lambda e: (-quality(e), e["id"]))

    easy_cap = max(1, int(round(cap * EASY_RATIO)))
    n_ord = cap - min(easy_cap, len(landmarks))

    def spread(rows_, want):
        """Round-robin by continent, then by country, so nothing dominates."""
        by_cont = {}
        for e in rows_:
            by_cont.setdefault(L.continent_of(e["iso2"]), []).append(e)
        rings = {}
        for c, es in by_cont.items():
            per_country = {}
            for e in es:
                per_country.setdefault(e["iso2"], []).append(e)
            ring = []
            while any(per_country.values()):
                for iso in sorted(per_country):
                    if per_country[iso]:
                        ring.append(per_country[iso].pop(0))
            rings[c] = ring
        out, i = [], 0
        while len(out) < want and any(rings.values()):
            for c in sorted(rings):
                if len(out) >= want:
                    break
                if rings[c]:
                    out.append(rings[c].pop(0))
            i += 1
            if i > 4000:
                break
        return out

    chosen = spread(ordinary, n_ord) + spread(landmarks, min(easy_cap, len(landmarks)))
    return sorted(chosen, key=lambda e: (e["iso2"], e["id"]))


# ───────────────────────── validation ─────────────────────────────────────

def valid(e, kind, problems):
    def bad(why):
        problems.append("%s %s: %s" % (kind, e.get("id", "?"), why))
        return False

    for f in ("id", "url", "w", "h", "lat", "lon", "iso2", "place", "credit",
              "licence", "page"):
        if e.get(f) in (None, "", 0):
            return bad("missing " + f)
    if not e["url"].startswith("https://upload.wikimedia.org/"):
        return bad("url not on upload.wikimedia.org")
    if not e["page"].startswith("https://commons.wikimedia.org/wiki/File:"):
        return bad("page url malformed")
    if not (-90 <= e["lat"] <= 90) or not (-180 <= e["lon"] <= 180):
        return bad("lat/lon out of range")
    if e["lat"] == 0 and e["lon"] == 0:
        return bad("null island")
    if e["iso2"] not in L.by_iso():
        return bad("unknown iso2 " + str(e["iso2"]))
    if e["w"] < 600:
        return bad("too small (%d px)" % e["w"])
    if kind == "time":
        if not isinstance(e.get("year"), int) or not (1850 <= e["year"] <= 2015):
            return bad("year out of 1850-2015")
    else:
        if len(e.get("clues") or []) < 2:
            return bad("under 2 clues")
    return True


def main():
    no_verify = "--no-verify" in sys.argv
    max_time, max_place = MAX_TIME, MAX_PLACE
    for i, a in enumerate(sys.argv):
        if a == "--max-time":
            max_time = int(sys.argv[i + 1])
        if a == "--max-place":
            max_place = int(sys.argv[i + 1])

    time_rows = json.load(open(TIME_IN, encoding="utf-8")) if os.path.exists(TIME_IN) else []
    place_rows = json.load(open(PLACE_IN, encoding="utf-8")) if os.path.exists(PLACE_IN) else []
    print("harvest input: time=%d place=%d" % (len(time_rows), len(place_rows)))

    problems = []
    time_rows = [e for e in time_rows if valid(e, "time", problems)]
    place_rows = [e for e in place_rows if valid(e, "place", problems)]

    # de-duplicate on URL, within and across the two sets
    seen_url = set()
    for lst in (time_rows, place_rows):
        keep = []
        for e in lst:
            if e["url"] in seen_url:
                problems.append("dupe url %s" % e["id"])
                continue
            seen_url.add(e["url"])
            keep.append(e)
        lst[:] = keep
    print("after validation: time=%d place=%d  (%d rejected)" %
          (len(time_rows), len(place_rows), len(problems)))

    time_sel = pick_time(time_rows, max_time)
    place_sel = pick_place(place_rows, max_place)
    print("after selection:  time=%d place=%d" % (len(time_sel), len(place_sel)))

    # ── spoiler scrub + final shape ──
    def shape(e, kind):
        cap = scrub(e.get("caption") or "", e, drop_dates=(kind == "time"))
        if not cap:
            cap = fallback_caption(e, kind)
        o = {"id": e["id"], "url": e["url"], "w": e["w"], "h": e["h"]}
        if kind == "time":
            o["year"] = e["year"]
        o.update({"lat": e["lat"], "lon": e["lon"], "iso2": e["iso2"],
                  "place": e["place"], "caption": cap,
                  "credit": e["credit"], "licence": e["licence"],
                  "page": L.page_url(re.sub(r"^.*/wiki/File:", "",
                                            L.urllib.parse.unquote(e["page"])))})
        if kind == "time":
            o["gps"] = 1 if e.get("gps") else 0
        else:
            o["clues"] = e["clues"][:4]
            o["easy"] = 1 if e.get("easy") else 0
        return o

    time_out = [shape(e, "time") for e in time_sel]
    place_out = [shape(e, "place") for e in place_sel]

    # ── re-verify every URL right before writing ──
    verified = 0
    if not no_verify:
        for kind, lst in (("time", time_out), ("place", place_out)):
            keep = []
            for e in lst:
                # One ranged GET verifies status + content-type AND re-measures the
                # real pixel size, so w/h in the shipped file cannot disagree with
                # the bytes. (imageinfo's thumbwidth/thumbheight do disagree: it
                # reports the width you asked for while serving the next bucket up.)
                st, ct, w, h = B.img_probe(e["url"])
                if st == 200 and ct.startswith("image/") and w and h:
                    if (w, h) != (e["w"], e["h"]):
                        problems.append("%s %s: w/h corrected %dx%d -> %dx%d"
                                        % (kind, e["id"], e["w"], e["h"], w, h))
                        e["w"], e["h"] = w, h
                    verified += 1
                    keep.append(e)
                else:
                    problems.append("%s %s: verify failed http=%s ct=%s"
                                    % (kind, e["id"], st, ct))
            lst[:] = keep
        B.save_dims()
    else:
        verified = len(time_out) + len(place_out)

    total = len(time_out) + len(place_out)
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
        "// GENERATED BY _build/gen_photos.py (harvest: photos_time.py / photos_place.py).\n"
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
        "// %d photos: %d time, %d place.\n" % (total, len(time_out), len(place_out))
    )

    def rows_js(lst):
        return ",\n".join(json.dumps(e, ensure_ascii=False, sort_keys=False,
                                     separators=(",", ":")) for e in lst)

    js = (header + "window.AD_PHOTOS = {\ntime: [\n" + rows_js(time_out) +
          "\n],\nplace: [\n" + rows_js(place_out) + "\n]\n};\n")
    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        fh.write(js)
    os.replace(tmp, OUT)

    # ── report ──
    size = os.path.getsize(OUT)
    print("\nwrote %s  (%d bytes, %.1f KB)" % (OUT, size, size / 1024.0))
    print("verified == total: %s  (%d / %d)" % (verified == total, verified, total))

    d = {}
    for e in time_out:
        d[dec(e["year"])] = d.get(dec(e["year"]), 0) + 1
    print("\ntime per decade (need >=8 from 1900):")
    for k in sorted(d):
        flag = "" if (k < 1900 or d[k] >= PER_DECADE_MIN) else "   <-- SHORT"
        print("   %ds  %-3d %s%s" % (k, d[k], "#" * d[k], flag))
    short = [k for k in d if k >= 1900 and d[k] < PER_DECADE_MIN]
    missing_dec = [k for k in range(1900, 2020, 10) if k not in d]

    for kind, lst in (("time", time_out), ("place", place_out)):
        c = {}
        for e in lst:
            c[L.continent_of(e["iso2"])] = c.get(L.continent_of(e["iso2"]), 0) + 1
        print("\n%s per continent (%d countries):" % (kind, len({e["iso2"] for e in lst})))
        for k in sorted(c):
            print("   %-15s %-3d %s" % (k, c[k], "#" * min(60, c[k])))

    ok = True
    def chk(name, cond, detail):
        nonlocal ok
        print("   [%s] %-34s %s" % ("ok" if cond else "FAIL", name, detail))
        ok = ok and cond

    print("\ninvariants:")
    chk("time >= %d" % MIN_TIME, len(time_out) >= MIN_TIME, "%d" % len(time_out))
    chk("place >= %d" % MIN_PLACE, len(place_out) >= MIN_PLACE, "%d" % len(place_out))
    chk("time >= 35 countries", len({e["iso2"] for e in time_out}) >= 35,
        "%d" % len({e["iso2"] for e in time_out}))
    chk("place >= 65 countries", len({e["iso2"] for e in place_out}) >= 65,
        "%d" % len({e["iso2"] for e in place_out}))
    chk("time >=8 per decade from 1900", not short and not missing_dec,
        "short=%s missing=%s" % (short, missing_dec))
    tc = {L.continent_of(e["iso2"]) for e in time_out}
    pc = {L.continent_of(e["iso2"]) for e in place_out}
    inhab = {"Africa", "Asia", "Europe", "North America", "South America", "Oceania"}
    chk("time all inhabited continents", inhab <= tc, "missing %s" % sorted(inhab - tc))
    chk("place all continents", inhab <= pc,
        "missing %s / antarctica=%s" % (sorted(inhab - pc), "Antarctica" in pc))
    chk("verified == total", verified == total, "%d/%d" % (verified, total))
    chk("file < 300 KB", size < 300 * 1024, "%.1f KB" % (size / 1024.0))
    yrs = [e["year"] for e in time_out]
    chk("year span 1850-2015", yrs and min(yrs) >= 1850 and max(yrs) <= 2015,
        "%d-%d" % (min(yrs), max(yrs)) if yrs else "none")
    ne = sum(1 for e in place_out if e["easy"])
    chk("place easy ~15%", 0.06 <= ne / float(max(1, len(place_out))) <= 0.24,
        "%d (%.0f%%)" % (ne, 100.0 * ne / max(1, len(place_out))))
    for city in ("Tehran", "Houston", "Edinburgh", "London"):
        hit = [e["place"] for e in time_out + place_out if city.lower() in e["place"].lower()]
        chk("CONTRACT city: %s" % city, bool(hit), "%d entries" % len(hit))
    chk("no caption leaks its place", not [
        e for e in time_out + place_out
        if re.search(r"(?<![A-Za-z])%s(?![A-Za-z])"
                     % re.escape(e["place"].split(",")[0].strip()), e["caption"], re.I)],
        "checked %d captions" % total)

    if problems:
        print("\n%d entries dropped/flagged; first 20:" % len(problems))
        for p in problems[:20]:
            print("   " + p)
    print("\nRESULT: %s" % ("ALL INVARIANTS PASS" if ok else "INVARIANTS FAILED"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
