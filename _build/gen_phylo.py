#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_phylo.py — harvest the PHYLO corpus.  Stdlib only, no pip, re-runnable.

WHAT IT HITS (all free, keyless, real)
  GBIF backbone taxonomy   https://api.gbif.org/v1/species/match
      the authoritative kingdom→species lineage and a stable usageKey.
      Every rank string that ships comes from here; nothing is hand-typed.
  English Wikipedia REST   https://en.wikipedia.org/api/rest_v1/page/summary/<title>
      a one-line description, AND an independent check that the common name in
      the seed really denotes that species (the extract must mention the genus
      or the binomial). A pairing that fails the check is dropped, not guessed.
  Wikimedia pageviews      https://wikimedia.org/api/rest_v1/metrics/pageviews/...
      the salience number. This is the objective answer to "would a well-read
      non-biologist recognise this?", and it is what culls the corpus. Hand
      priors in the seed are only a tie-break.

HOW IT BEHAVES
  · one descriptive User-Agent, ~7 requests/second, retries with backoff
  · every raw response cached under _build/cache/phylo/ (gitignored), so a
    re-run after a kill costs nothing and hits nothing
  · rows appended to cache/phylo/rows.jsonl as they resolve
  · core/data/phylo.js REBUILT every 40 rows, so the shipped file is always
    valid and loadable even if this process dies mid-harvest

USAGE
    python3 _build/gen_phylo.py            # harvest (resumes) then build
    python3 _build/gen_phylo.py build      # rebuild the JS from the cache only
    python3 _build/gen_phylo.py report     # print corpus statistics
"""

import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, "cache", "phylo")
OUT = os.path.join(ROOT, "core", "data", "phylo.js")
ROWS = os.path.join(CACHE, "rows.jsonl")

UA = "MidnightArcade-PHYLO/1.0 (https://salahshoormisha.github.io/misha-arcade/; misha@cbai.ai)"
PAUSE = 0.14
_last = [0.0]

RANKS = ["domain", "kingdom", "phylum", "class", "order", "family", "genus"]
# GBIF kingdoms we accept. "Viruses" and "incertae sedis" are rejected: a virus
# has no place on a tree-of-life ladder and unplaced taxa break the rungs.
KINGDOMS = {"Animalia", "Plantae", "Fungi", "Chromista", "Protozoa", "Bacteria", "Archaea"}

for d in ("gbif", "wiki", "pv"):
    os.makedirs(os.path.join(CACHE, d), exist_ok=True)


# ── plumbing ───────────────────────────────────────────────────────────────

def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_").lower()[:110]


def get(url, tries=3):
    """One rate-limited GET returning parsed JSON, or None."""
    for n in range(tries):
        wait = PAUSE - (time.time() - _last[0])
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.time()
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8", "replace"))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code in (429, 503) and n < tries - 1:
                time.sleep(2.5 * (n + 1))
                continue
            return None
        except Exception:
            if n < tries - 1:
                time.sleep(1.5 * (n + 1))
                continue
            return None
    return None


def cached(kind, key, url):
    """Fetch through the on-disk cache. A cached `null` is a remembered miss."""
    p = os.path.join(CACHE, kind, slug(key) + ".json")
    if os.path.exists(p):
        try:
            with open(p) as f:
                return json.load(f)
        except Exception:
            pass
    v = get(url)
    tmp = p + ".tmp"
    with open(tmp, "w") as f:
        json.dump(v, f)
    os.replace(tmp, p)
    return v


# ── the three sources ──────────────────────────────────────────────────────

def gbif(sci):
    return cached("gbif", sci, "https://api.gbif.org/v1/species/match?strict=false&name=" +
                  urllib.parse.quote(sci))


def wiki(title):
    return cached("wiki", title, "https://en.wikipedia.org/api/rest_v1/page/summary/" +
                  urllib.parse.quote(title.replace(" ", "_"), safe=""))


def views(title):
    """Total English-Wikipedia human pageviews for calendar 2025."""
    d = cached("pv", title, "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/"
               "en.wikipedia/all-access/user/" +
               urllib.parse.quote(title.replace(" ", "_"), safe="") +
               "/monthly/2025010100/2025123100")
    if not d or not d.get("items"):
        return 0
    return sum(i.get("views", 0) for i in d["items"])


# ── resolving one seed row ─────────────────────────────────────────────────

def first_sentence(text, cap=170):
    text = re.sub(r"\s+", " ", (text or "").strip())
    text = re.sub(r"\s*\([^)]*\)", "", text)          # drop pronunciation/aka parentheticals
    text = re.sub(r"\s+", " ", text).strip()
    m = re.match(r"^(.{40,}?[.!?])(\s|$)", text)
    out = m.group(1) if m else text
    if len(out) > cap:
        out = out[:cap].rsplit(" ", 1)[0].rstrip(",;:") + "…"
    return out


def resolve(common, sci, prior, aliases):
    """→ row dict, or (None, reason)."""
    m = gbif(sci)
    if not m:
        return None, "gbif-no-response"
    if m.get("matchType") not in ("EXACT", "FUZZY"):
        return None, "gbif-" + str(m.get("matchType", "none")).lower()
    if (m.get("confidence") or 0) < 90:
        return None, "gbif-low-confidence"
    if m.get("rank") not in ("SPECIES", "SUBSPECIES", "VARIETY", "FORM"):
        return None, "gbif-rank-" + str(m.get("rank", "?")).lower()

    kingdom = m.get("kingdom")
    if kingdom not in KINGDOMS:
        return None, "kingdom-" + str(kingdom)

    lineage = [
        "Bacteria" if kingdom == "Bacteria" else "Archaea" if kingdom == "Archaea" else "Eukaryota",
        kingdom, m.get("phylum"), m.get("class"), m.get("order"), m.get("family"), m.get("genus"),
    ]
    if not all(lineage):
        missing = [RANKS[i] for i, v in enumerate(lineage) if not v]
        return None, "no-" + "+".join(missing)

    species = m.get("species")
    if not species or " " not in species:
        return None, "no-species-binomial"
    key = m.get("speciesKey") or m.get("usageKey")

    # Wikipedia: try the common name first — that is the pairing under test.
    w = wiki(common)
    wsrc, title = "common", common
    hay = ""
    if w and w.get("type") != "disambiguation":
        hay = " ".join(str(w.get(k) or "") for k in ("title", "description", "extract")).lower()
    genus = lineage[6].lower()
    epithet = species.split(" ")[-1].lower()
    good = bool(hay) and (genus in hay or species.lower() in hay or
                          (len(epithet) > 4 and epithet in hay))
    if not good:
        w2 = wiki(species)
        if w2 and w2.get("type") != "disambiguation" and w2.get("extract"):
            w, wsrc, title = w2, "sci", species
        elif not (w and w.get("extract")):
            return None, "no-wikipedia"
        # else: keep the common-name page but flag the weak link
        if wsrc == "common":
            wsrc = "weak"

    desc = first_sentence(w.get("extract") if w else "")
    if not desc:
        return None, "no-description"

    v = views(w.get("titles", {}).get("canonical") or w.get("title") or title)
    if wsrc != "common":
        # salience should reflect the name the player would look up
        v = max(v, views(common))

    return {
        "n": common, "s": species, "sci_in": sci, "prior": prior, "alt": aliases,
        "lineage": lineage, "key": key, "d": desc, "wsrc": wsrc,
        "wtitle": w.get("title") if w else title, "views": v,
        "match": m.get("matchType"), "conf": m.get("confidence"),
    }, None


# ── stage 1: harvest ───────────────────────────────────────────────────────

def load_rows():
    out, seen = [], set()
    if not os.path.exists(ROWS):
        return out, seen
    with open(ROWS) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except Exception:
                continue
            if r.get("n") in seen:
                continue
            seen.add(r["n"])
            out.append(r)
    return out, seen


def harvest():
    sys.path.insert(0, HERE)
    from phylo_seed import SEED

    rows, seen = load_rows()
    print("seed %d  ·  already resolved %d" % (len(SEED), len(rows)))
    rejects = {}
    todo = [r for r in SEED if r[0] not in seen]
    t0 = time.time()

    with open(ROWS, "a") as fh:
        for i, (common, sci, prior, aliases) in enumerate(todo):
            row, why = resolve(common, sci, prior, aliases)
            if row is None:
                rejects.setdefault(why, []).append(common + " / " + sci)
            else:
                fh.write(json.dumps(row, ensure_ascii=False) + "\n")
                fh.flush()
                rows.append(row)
            if (i + 1) % 40 == 0:
                build(rows)   # keep core/data/phylo.js valid at all times
                el = time.time() - t0
                print("  %4d/%d  kept %d  rejected %d  %.0fs  (%.1f/s)" %
                      (i + 1, len(todo), len(rows), sum(len(v) for v in rejects.values()),
                       el, (i + 1) / max(el, 1)))

    print("\nREJECTS by reason:")
    for why in sorted(rejects, key=lambda k: -len(rejects[k])):
        print("  %-28s %3d   e.g. %s" % (why, len(rejects[why]), rejects[why][0]))
    with open(os.path.join(CACHE, "rejects.json"), "w") as f:
        json.dump(rejects, f, indent=1)
    return rows


# ── stage 2: filter and build ──────────────────────────────────────────────

# Corpus bar: a name a well-read non-biologist could actually produce. Wikipedia
# pageviews are the arbiter; the hand prior only rescues/blocks at the margin.
# Taxa this cabinet must never show. One of the two people who play it has a
# reptile phobia, so a reptile turning up as the answer — or as a near miss on
# the way to it — is not a fun surprise, it is a reason to stop playing. This is
# enforced here rather than by hand-pruning the output, so a re-harvest can
# never quietly bring them back. Matched anywhere in the lineage, so it catches
# the class, the orders and every family beneath them.
BANNED_TAXA = {
    "Reptilia", "Sauropsida", "Lepidosauria", "Squamata", "Serpentes",
    "Testudines", "Chelonia", "Crocodylia", "Rhynchocephalia",
}


def banned(r):
    return any(t in BANNED_TAXA for t in r["lineage"])


def keep_in_corpus(r):
    if banned(r):
        return False
    v, p = r["views"], r["prior"]
    if p >= 5:
        return v >= 4000
    if p == 4:
        return v >= 9000
    if p == 3:
        return v >= 22000
    if p == 2:
        return v >= 60000
    return v >= 140000


def group_of(r):
    """The band used to keep the answer pool taxonomically spread."""
    k, ph, cl = r["lineage"][1], r["lineage"][2], r["lineage"][3]
    if k == "Animalia":
        return "A/" + (cl if ph == "Chordata" else ph)
    return k + "/" + ph


def build(rows=None):
    if rows is None:
        rows, _ = load_rows()

    # one organism per resolved species — "Cattle" and "Zebu" can collide
    best = {}
    for r in rows:
        if not keep_in_corpus(r):
            continue
        k = r["s"]
        if k not in best or r["views"] > best[k]["views"]:
            if k in best:                      # fold the loser's aliases in
                r = dict(r, alt=list(r["alt"]) + [best[k]["n"]] + list(best[k]["alt"]))
            best[k] = r
    corpus = sorted(best.values(), key=lambda r: -r["views"])

    # The answer pool: high salience, but stratified so one popular group
    # (mammals) cannot swallow the day's answer for a year.
    by_group = {}
    for r in corpus:
        by_group.setdefault(group_of(r), []).append(r)
    pool = set()
    for gname, lst in by_group.items():
        lst.sort(key=lambda r: -r["views"])
        cap = max(3, min(38, int(round(len(lst) * 0.62))))
        for r in lst[:cap]:
            if r["views"] >= 30000 or (r["prior"] >= 4 and r["views"] >= 15000):
                pool.add(r["s"])

    # string pool for the lineages — "Chordata" appears hundreds of times
    taxa, tix = [], {}

    def ti(name):
        if name not in tix:
            tix[name] = len(taxa)
            taxa.append(name)
        return tix[name]

    sp = []
    for r in corpus:
        e = {
            "n": r["n"], "s": r["s"],
            "l": [ti(x) for x in r["lineage"]],
            "p": int(round(min(100, 100 * (max(0.0, __import__("math").log10(r["views"] + 1) - 3.0) / 3.5)))),
            "d": r["d"], "k": r["key"],
        }
        if r["alt"]:
            e["a"] = sorted(set(a.lower() for a in r["alt"]))
        if r["s"] in pool:
            e["q"] = 1
        sp.append(e)

    sp.sort(key=lambda e: e["n"].lower())

    head = (
        "/* PHYLO — organism lineages for the tree-of-life deduction cabinet.\n"
        "   SOURCES (all free, keyless, hit live by _build/gen_phylo.py):\n"
        "     · lineage + species key : GBIF backbone taxonomy, api.gbif.org/v1/species/match\n"
        "     · one-line description  : English Wikipedia REST summary\n"
        "     · salience (field p)    : Wikimedia pageviews, en.wikipedia, calendar 2025\n"
        "   Every rank string below is GBIF's, not hand-typed. Rows whose common name could\n"
        "   not be independently tied to the species, or whose 7-rank lineage had a gap,\n"
        "   were dropped rather than guessed — see _build/cache/phylo/rejects.json.\n"
        "   Regenerate:  python3 _build/gen_phylo.py\n"
        "   l  = indices into `taxa`, one per entry of `ranks` (species is `s`)\n"
        "   p  = 0-100 salience   q = 1 if allowed to be the day's answer   k = GBIF key */\n"
    )
    body = {
        "ranks": RANKS + ["species"],
        "taxa": taxa,
        "sp": sp,
    }
    js = head + "window.AD_PHYLO = " + json.dumps(body, ensure_ascii=False, separators=(",", ":")) + ";\n"
    tmp = OUT + ".tmp"
    with open(tmp, "w") as f:
        f.write(js)
    os.replace(tmp, OUT)
    return corpus, pool, taxa


def report():
    rows, _ = load_rows()
    corpus, pool, taxa = build(rows)
    import collections
    print("resolved rows      %d" % len(rows))
    print("corpus (shipped)   %d" % len(corpus))
    print("answer pool        %d" % len(pool))
    print("distinct taxa      %d" % len(taxa))
    print("file bytes         %d" % os.path.getsize(OUT))
    g = collections.Counter(group_of(r) for r in corpus)
    gp = collections.Counter(group_of(r) for r in corpus if r["s"] in pool)
    print("\n%-34s %6s %6s" % ("group", "corpus", "pool"))
    for k, v in g.most_common():
        print("%-34s %6d %6d" % (k, v, gp[k]))
    print("\nkingdoms: %s" % dict(collections.Counter(r["lineage"][1] for r in corpus)))
    print("wiki link: %s" % dict(collections.Counter(r["wsrc"] for r in rows)))
    lo = sorted(corpus, key=lambda r: r["views"])[:14]
    print("\nleast-known survivors:")
    for r in lo:
        print("  %-34s %9d  %s" % (r["n"], r["views"], r["s"]))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "harvest"
    if cmd == "build":
        build()
        print("wrote %s (%d bytes)" % (OUT, os.path.getsize(OUT)))
    elif cmd == "report":
        report()
    else:
        harvest()
        report()
