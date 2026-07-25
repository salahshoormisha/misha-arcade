#!/usr/bin/env python3
"""
_build/food_harvest.py -- stage 1 of the core/data/food.js build.

Harvests TheMealDB (free, keyless, https://www.themealdb.com/api/json/v1/1/)
into _build/cache/mealdb.json:

    list.php?a=list        -> every cuisine "Area"
    filter.php?a=<Area>    -> dishes in that area (id, name, thumbnail URL)
    lookup.php?i=<id>      -> ingredients, measures, instructions, category, tags

Also verifies every image URL with a HEAD/ranged GET and records the HTTP status
in _build/cache/food_img_status.json so the emitter can drop anything that is not
a hard 200.

Idempotent + resumable: everything is cached on disk, re-runs only fetch what is
missing.  Run with --refresh to force a re-fetch of the area/dish index.
"""
import json, os, sys, time, urllib.request, urllib.error, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "_build", "cache")
MEALDB = os.path.join(CACHE, "mealdb.json")
IMGSTATUS = os.path.join(CACHE, "food_img_status.json")
API = "https://www.themealdb.com/api/json/v1/1/"
UA = "misha-arcade-databuild/1.0 (static puzzle game; contact misha@cbai.ai)"


def get_json(url, tries=3):
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8", "replace"))
        except Exception as e:
            if k == tries - 1:
                print("  ! fail %s (%s)" % (url, e))
                return None
            time.sleep(1.0 + k)
    return None


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


# ---------------------------------------------------------------- image check
def img_status(url, timeout=25):
    """Return an int HTTP status for url (0 = network failure)."""
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Range": "bytes=0-64"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read(64)
            code = r.getcode()
            # 206 Partial Content is a healthy 200-class answer to a ranged GET
            if code == 206:
                code = 200
            if not body:
                return 0
            return code
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def verify_images(urls, store):
    """urls: iterable of image URLs. store: dict url->status. Mutates + returns store."""
    todo = [u for u in dict.fromkeys(urls) if store.get(u) != 200]
    print("verifying %d image URLs (%d already 200)" % (len(todo), len(urls) - len(todo)))
    for n, u in enumerate(todo, 1):
        st = img_status(u)
        if st == 0:  # one retry for transient network noise
            time.sleep(1.0)
            st = img_status(u)
        store[u] = st
        if n % 25 == 0:
            print("  %d/%d checked" % (n, len(todo)))
            save(IMGSTATUS, store)
    save(IMGSTATUS, store)
    bad = sorted(u for u, s in store.items() if s != 200)
    print("verified: %d ok, %d bad" % (len(store) - len(bad), len(bad)))
    return store


# ---------------------------------------------------------------- main harvest
def harvest(refresh=False):
    db = load(MEALDB, {"areas": [], "dishes": {}})
    if refresh or not db["areas"]:
        j = get_json(API + "list.php?a=list") or {}
        db["areas"] = sorted({m["strArea"] for m in (j.get("meals") or [])})
        save(MEALDB, db)
    print("%d areas" % len(db["areas"]))

    index = db.setdefault("index", {})
    for area in db["areas"]:
        if area in index and not refresh:
            continue
        j = get_json(API + "filter.php?a=" + urllib.parse.quote(area)) or {}
        meals = j.get("meals") or []
        index[area] = [
            {"id": m["idMeal"], "name": m["strMeal"], "img": m["strMealThumb"]}
            for m in meals
        ]
        print("  %-24s %3d dishes" % (area, len(index[area])))
        save(MEALDB, db)

    total = sum(len(v) for v in index.values())
    print("index: %d dishes across %d areas" % (total, len(index)))

    # detail lookups
    dishes = db.setdefault("dishes", {})
    want = [d["id"] for v in index.values() for d in v]
    todo = [i for i in want if i not in dishes]
    print("looking up %d dish details (%d cached)" % (len(todo), len(want) - len(todo)))
    for n, mid in enumerate(todo, 1):
        j = get_json(API + "lookup.php?i=" + mid) or {}
        meals = j.get("meals") or []
        if not meals:
            dishes[mid] = None
            continue
        m = meals[0]
        ing = []
        for k in range(1, 21):
            name = (m.get("strIngredient%d" % k) or "").strip()
            meas = (m.get("strMeasure%d" % k) or "").strip()
            if name:
                ing.append({"n": name, "m": meas})
        dishes[mid] = {
            "id": mid,
            "name": m.get("strMeal"),
            "area": m.get("strArea"),
            "country": m.get("strCountry"),
            "cat": m.get("strCategory"),
            "img": m.get("strMealThumb"),
            "tags": m.get("strTags"),
            "src": m.get("strSource"),
            "ing": ing,
            "instr": (m.get("strInstructions") or "").strip(),
        }
        if n % 20 == 0:
            print("  %d/%d looked up" % (n, len(todo)))
            save(MEALDB, db)
    save(MEALDB, db)
    print("dish details cached: %d" % len([d for d in dishes.values() if d]))

    # image verification
    store = load(IMGSTATUS, {})
    urls = [d["img"] for d in dishes.values() if d and d.get("img")]
    verify_images(urls, store)
    return db


if __name__ == "__main__":
    harvest(refresh="--refresh" in sys.argv)
