#!/usr/bin/env python3
"""Stage 1 of the flags dataset: download one raw SVG per ISO2 code.

Source: flagcdn.com (public domain SVG flags), fallback Wikimedia Commons.
Codes come from _build/countries-full.json (mledoze/countries, cca2).
Raw files are cached in _build/flags-raw/ so gen_flags.py is re-runnable offline.
Re-runnable + deterministic: only downloads what is missing/invalid.
"""
import json, os, sys, time
import urllib.request, urllib.error
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

BUILD = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(BUILD, "flags-raw")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0) midnight-arcade-flag-fetch/1.0"

# Wikimedia Commons "Special:FilePath" fallbacks, only for codes flagcdn lacks.
WIKI_FALLBACK = {}


def codes():
    with open(os.path.join(BUILD, "countries-full.json")) as f:
        data = json.load(f)
    return sorted({c["cca2"].upper() for c in data if c.get("cca2")})


def ok_svg(path):
    try:
        if os.path.getsize(path) < 60:
            return False
        with open(path, "rb") as f:
            blob = f.read()
        root = ET.fromstring(blob)
        return root.tag.endswith("svg")
    except Exception:
        return False


def get(url, tries=4):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=45) as r:
                return r.read()
        except Exception as e:  # noqa
            last = e
            time.sleep(1.2 * (i + 1))
    raise last


def fetch_one(code):
    dest = os.path.join(RAW, code + ".svg")
    if ok_svg(dest):
        return (code, "cached", os.path.getsize(dest))
    urls = ["https://flagcdn.com/%s.svg" % code.lower()]
    if code in WIKI_FALLBACK:
        urls.append("https://commons.wikimedia.org/wiki/Special:FilePath/" +
                    urllib.parse.quote(WIKI_FALLBACK[code]))
    for u in urls:
        try:
            blob = get(u)
        except Exception as e:
            print("  !! %s %s -> %s" % (code, u, e))
            continue
        tmp = dest + ".part"
        with open(tmp, "wb") as f:
            f.write(blob)
        if ok_svg(tmp):
            os.replace(tmp, dest)
            return (code, "fetched", len(blob))
        os.remove(tmp)
        print("  !! %s %s -> not valid svg (%d bytes)" % (code, u, len(blob)))
    return (code, "FAILED", 0)


def main():
    os.makedirs(RAW, exist_ok=True)
    cs = codes()
    print("codes: %d" % len(cs))
    res = []
    with ThreadPoolExecutor(max_workers=6) as ex:
        for r in ex.map(fetch_one, cs):
            res.append(r)
    fetched = [r for r in res if r[1] == "fetched"]
    cached = [r for r in res if r[1] == "cached"]
    failed = [r for r in res if r[1] == "FAILED"]
    print("fetched=%d cached=%d failed=%d" % (len(fetched), len(cached), len(failed)))
    if failed:
        print("FAILED:", ", ".join(r[0] for r in failed))
    tot = sum(r[2] for r in res)
    print("raw total: %.1f KB" % (tot / 1024.0))
    big = sorted(res, key=lambda r: -r[2])[:12]
    print("largest raw:", ", ".join("%s=%.0fKB" % (r[0], r[2] / 1024.0) for r in big))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
