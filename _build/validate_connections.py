#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
validate_connections.py — independent audit of the SHIPPED core/data/connections.js

    python3 _build/validate_connections.py            # full report, exit 1 on any error
    python3 _build/validate_connections.py --quiet     # invariants + failures only

Why this exists separately from gen_connections.py: the generator validates the
AUTHORED modules and trusts the author's declared `traps` list for uniqueness.
This script reads only the emitted JS (plus a dictionary for the compound-word
test) and re-derives the double-fit set from scratch, so a trap the author
forgot to declare cannot hide a second solution.

CHECKS (all hard failures unless marked ADVISORY)
  1  file parses as `window.AD_CONNECTIONS = <strict JSON>;` and is under budget
  2  pack set is exactly the confirmed list (CONTRACT §7); no `office`, no
     `cambridge`; no real colleague names anywhere in the file
  3  every board: exactly 4 groups, exactly 4 tiles each, 16 DISTINCT tiles
  4  no tile in two groups of the same board (case-insensitive)
  5  tiles uppercase, 1..14 chars, from the allowed character set
  6  colours are exactly y,g,b,p once each, in ascending difficulty order
  7  every group has a non-empty `note`; every board a non-empty `epilogue`
  8  no tile echoed inside its own category name (the giveaway construction)
  9  cross-pack tile reuse <= 3 boards for any one tile string
 10  board ids are 1..N and unique inside their pack; diff in 1..5
 11  DOUBLE-FIT REPORT + UNIQUENESS: every tile that plausibly fits a second
     group of its own board is found by three independent detectors, and each
     board is then re-checked by exact cover under the union of those fits. The
     count must be exactly 1 — i.e. the board stays uniquely solvable even when
     every plausible misreading is granted.
 12  ADVISORY: sibling categories inside one board (two group names sharing a
     content word), listed for human review.

SOURCES of double-fits used by check 11 (the union of all four is granted)
  D  DECLARED: the `traps` the author wrote in _build/conn_*.py, matched to the
     shipped board by its 16-tile signature (so the mapping cannot drift).
  A  COMPOUND: for a wordplay group named "___ X" or "X ___", any other tile T
     on the board where T+X (or X+T) is an English word — that tile really can
     be read into the wordplay group.
  B  ELSEWHERE: tile T sits in board Y under a category whose wording shares a
     DISTINCTIVE word (one used by <= DF_MAX category names dataset-wide) with a
     *different* category on this board — i.e. the dataset itself files T under
     that other kind of thing too. The distinctiveness filter is what stops
     "united" or "london" matching half a pack to itself.
  C  IN-NAME: tile T appears as a word inside another group's category name on
     the same board.
"""

import json
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TARGET = os.path.join(ROOT, "core", "data", "connections.js")
WORDLIST = os.path.join(HERE, "words_alpha.txt")

MAX_TILE = 14
MAX_REUSE = 3
SIZE_BUDGET = 300 * 1024
COLOURS = ["y", "g", "b", "p"]
DF_MAX = 8              # a word in more category names than this is not distinctive

EXPECTED_PACKS = ["general", "persia", "united", "places", "ai", "jewish"]
BANNED_PACKS = ["office", "cambridge"]
# CONTRACT §7: "Do not name real colleagues anywhere." Checked as whole words so
# that Longfellow Bridge and David Moyes do not trip it.
BANNED_WORDS = ["cbai", "kathryn", "thifault", "asana board", "all-hands", "standup",
                "summer fellow", "one-on-one", "ooo"]

STOP = set("""a an and the of in on at to for from with without into onto by as is are was were
be been being this that these those it its they them their there here you your we our us i
one two three four five six seven eight nine ten also but or nor not no so if then than
who whom whose which what when where why how all any both each few more most other some such
only own same too very can will just don should now says say said says there's who's
name names word words thing things kind kinds type types sort sorts group groups
also still yet even ever never always about after before during over under again once
actually literally properly really genuinely mostly usually often sometimes
call called calls calling means meaning meant read reads reading sit sits sitting""".split())


def die(msg):
    print("FATAL: " + msg)
    sys.exit(2)


# ---------------------------------------------------------------------------
# load


def load_target():
    if not os.path.exists(TARGET):
        die("missing %s" % TARGET)
    raw = open(TARGET, "r", encoding="utf-8").read()
    m = re.search(r"window\.AD_CONNECTIONS\s*=\s*", raw)
    if not m:
        die("no `window.AD_CONNECTIONS =` assignment")
    payload = raw[m.end():].strip()
    if not payload.endswith(";"):
        die("assignment does not end in a semicolon")
    try:
        data = json.loads(payload[:-1])
    except ValueError as e:
        die("payload is not strict JSON: %s" % e)
    if not isinstance(data.get("packs"), list):
        die("no packs array")
    return raw, data


def load_words():
    """Big English word list, for detector A. Optional; detector A is skipped
    without it and the report says so."""
    if not os.path.exists(WORDLIST):
        return None
    ws = set()
    for line in open(WORDLIST, "r", encoding="utf-8", errors="ignore"):
        w = line.strip().lower()
        if w:
            ws.add(w)
    # compounds and phrases a general dictionary misses but every English
    # speaker knows; each is a real double-fit risk, so they are listed here
    # rather than silently dropped.
    ws.update(["worldie", "beatnik", "sputnik", "refusenik", "kibbutznik",
               "flatwhite", "boxroom", "baywindow", "shopwindow", "rearwindow",
               "transferwindow", "estateagent", "secretagent", "freeagent",
               "doubleagent", "modelcard", "redteam", "redline", "redtape",
               "redflag", "fullenglish", "fullhouse", "fulltime", "fullmoon",
               "parttime", "extratime", "bigtime", "fergietime", "hairnet",
               "safetynet", "subnet", "internet", "kosher salt", "tablesalt",
               "rocksalt", "seasalt", "arrowhead", "letterhead", "figurehead",
               "hothead", "bicyclekick", "freekick", "dropkick", "placekick",
               "featherweight", "paperweight", "heavyweight", "overweight",
               "stoneage", "iceage", "newage", "oldage", "bronzeage",
               "foreststgreen", "raithrovers", "navyblue", "royalblue",
               "trueblue", "babyblue", "tshirt", "nightshirt", "sweatshirt",
               "hairshirt", "backfour", "fourthround"])
    return ws


def norm(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower()


def words_of(s):
    return [w for w in re.split(r"[^a-z0-9]+", norm(s)) if w and w not in STOP and len(w) > 2]


def tile_key(t):
    return re.sub(r"[^a-z0-9]", "", norm(t))


# ---------------------------------------------------------------------------
# structural checks


def tile_ok(t):
    if not t or len(t) > MAX_TILE:
        return "length %d" % len(t)
    if t != t.upper():
        return "not uppercase"
    for ch in t:
        if ch in " '-.&/,:!?" or ch.isdigit():
            continue
        if unicodedata.category(ch) in ("Lu", "Lo"):
            continue
        return "bad char %r" % ch
    return None


def structure(data, raw, errs, info):
    ids = [p.get("id") for p in data["packs"]]
    if ids != EXPECTED_PACKS:
        errs.append("pack list is %s, expected %s" % (ids, EXPECTED_PACKS))
    for b in BANNED_PACKS:
        if b in ids:
            errs.append("pack %r must be deleted (players declined it)" % b)
    low = norm(raw)
    for w in BANNED_WORDS:
        if re.search(r"(?<![a-z])" + re.escape(w) + r"(?![a-z])", low):
            errs.append("banned string %r appears in the shipped file" % w)
    size = len(raw.encode("utf-8"))
    info["bytes"] = size
    if size > SIZE_BUDGET:
        errs.append("file is %d bytes, over the %d budget" % (size, SIZE_BUDGET))

    seen_global = {}
    boards = []
    for p in data["packs"]:
        if not p.get("name") or not p.get("blurb"):
            errs.append("pack %r has no name/blurb" % p.get("id"))
        want = 1
        for b in p.get("boards", []):
            tag = "%s#%s" % (p["id"], b.get("id"))
            if b.get("id") != want:
                errs.append("%s: board ids must run 1..N (expected %d)" % (tag, want))
            want += 1
            if not (isinstance(b.get("diff"), int) and 1 <= b["diff"] <= 5):
                errs.append("%s: diff %r out of range" % (tag, b.get("diff")))
            if not b.get("epilogue"):
                errs.append("%s: no epilogue" % tag)
            gs = b.get("groups") or []
            if len(gs) != 4:
                errs.append("%s: %d groups (need 4)" % (tag, len(gs)))
                continue
            if [g.get("colour") for g in gs] != COLOURS:
                errs.append("%s: colours are %s, need %s ascending"
                            % (tag, [g.get("colour") for g in gs], COLOURS))
            flat, keys = [], []
            for g in gs:
                ts = g.get("tiles") or []
                if len(ts) != 4:
                    errs.append("%s: group %r has %d tiles (need 4)" % (tag, g.get("name"), len(ts)))
                if not g.get("note"):
                    errs.append("%s: group %r has no note" % (tag, g.get("name")))
                if not g.get("name"):
                    errs.append("%s: a group has no name" % tag)
                nn = " " + " ".join(words_of(g.get("name", ""))) + " "
                for t in ts:
                    bad = tile_ok(t)
                    if bad:
                        errs.append("%s: bad tile %r (%s)" % (tag, t, bad))
                    if " " + " ".join(words_of(t)) + " " in nn and words_of(t):
                        errs.append("%s: tile %r is echoed inside its own category name %r"
                                    % (tag, t, g["name"]))
                    flat.append(t)
                    keys.append(tile_key(t))
                    seen_global.setdefault(t, []).append(tag)
            if len(flat) != 16:
                errs.append("%s: %d tiles (need 16)" % (tag, len(flat)))
            if len(set(keys)) != len(keys):
                dupes = sorted({k for k in keys if keys.count(k) > 1})
                errs.append("%s: same tile in two groups: %s" % (tag, dupes))
            boards.append((p["id"], tag, b, gs))

    over = {t: v for t, v in seen_global.items() if len(v) > MAX_REUSE}
    for t, v in sorted(over.items(), key=lambda kv: -len(kv[1])):
        errs.append("tile %r appears in %d boards (max %d): %s"
                    % (t, len(v), MAX_REUSE, ", ".join(v)))
    hist = {}
    for v in seen_global.values():
        hist[len(v)] = hist.get(len(v), 0) + 1
    info["reuse_hist"] = hist
    info["distinct"] = len(seen_global)
    info["boards"] = boards
    return boards


# ---------------------------------------------------------------------------
# detectors + uniqueness


WILD = re.compile(r"^(?:(.*?)\s*___\s*(.*?))$")


def wildcard_parts(name):
    """'___ CARD' -> ('', 'CARD');  'OLD ___' -> ('OLD', '');  else None."""
    n = name.strip().strip("'\"").replace("’", "'")
    if "___" not in n:
        return None
    m = WILD.match(n)
    if not m:
        return None
    pre, post = m.group(1).strip(), m.group(2).strip()
    pre = re.sub(r"[^A-Za-z]", "", pre)
    post = re.sub(r"[^A-Za-z]", "", post)
    return pre, post


def load_declared():
    """Authored `traps` from _build/conn_*.py, keyed by the board's 16-tile
    signature so no pack/board mapping has to be trusted. Missing modules are
    fine — the detectors carry the check on their own."""
    out = {}
    for fn in sorted(os.listdir(HERE)):
        if not (fn.startswith("conn_") and fn.endswith(".py")):
            continue
        ns = {}
        try:
            exec(compile(open(os.path.join(HERE, fn), encoding="utf-8").read(),
                         fn, "exec"), ns)                      # noqa: S102 — our own data
        except Exception as e:                                  # pragma: no cover
            print("  ! could not read %s (%s)" % (fn, e))
            continue
        for b in ns.get("BOARDS", []):
            sig = frozenset(tile_key(t) for g in b["groups"] for t in g["tiles"])
            out[sig] = (fn, b.get("traps", []))
    return out


def detect(boards, words, declared):
    """-> {board_tag: {tile: set(alt_group_index)}}, plus a flat report list."""
    # index for detector B: tile key -> list of (tag, group name)
    elsewhere = {}
    df = {}
    for pid, tag, b, gs in boards:
        for g in gs:
            for w in set(words_of(g["name"])):
                df[w] = df.get(w, 0) + 1
            for t in g["tiles"]:
                elsewhere.setdefault(tile_key(t), []).append((tag, g["name"]))

    fits, report = {}, []
    for pid, tag, b, gs in boards:
        fits[tag] = {}
        gnames = [g["name"] for g in gs]
        gwords = [set(words_of(n)) for n in gnames]

        # D — what the author declared
        sig = frozenset(tile_key(t) for g in gs for t in g["tiles"])
        src, traps = declared.get(sig, (None, []))
        by_key = {}
        for gi, g in enumerate(gs):
            for t in g["tiles"]:
                by_key[tile_key(t)] = (t, gi)
        for tr in traps:
            t, alt = tr[0], tr[1]
            hit = by_key.get(tile_key(t))
            if hit and 0 <= alt <= 3 and hit[1] != alt:
                fits[tag].setdefault(hit[0], set()).add(alt)
                report.append({"board": tag, "title": b.get("title", ""),
                               "tile": hit[0], "true": gnames[hit[1]],
                               "true_colour": COLOURS[hit[1]], "also": gnames[alt],
                               "why": "D:declared in %s — %s" % (src, tr[2] if len(tr) > 2 else "")})

        for gi, g in enumerate(gs):
            for gj, other in enumerate(gs):
                if gi == gj:
                    continue
                parts = wildcard_parts(other["name"])
                for t in g["tiles"]:
                    why = None
                    # A — compound with the wildcard group
                    if parts and words:
                        pre, post = parts
                        stem = re.sub(r"[^a-z]", "", norm(t))
                        cand = []
                        if post:
                            cand.append(stem + post.lower())
                        if pre:
                            cand.append(pre.lower() + stem)
                        for c in cand:
                            if len(c) > 3 and c in words:
                                why = "A:compound %r is an English word" % c
                                break
                    # C — tile named inside the other category
                    if not why:
                        tw = words_of(t)
                        if tw and set(tw) <= gwords[gj]:
                            why = "C:tile appears inside category %r" % other["name"]
                    # B — the dataset files this tile under a similar category elsewhere.
                    # Only DISTINCTIVE shared words count: 'united' is in 30 category
                    # names and would otherwise match a whole pack to itself.
                    if not why:
                        for (otag, oname) in elsewhere.get(tile_key(t), []):
                            if otag == tag:
                                continue
                            shared = {w for w in set(words_of(oname)) & gwords[gj]
                                      if df.get(w, 99) <= DF_MAX}
                            if shared:
                                why = ("B:same tile in %s under %r (shares %s)"
                                       % (otag, oname, "/".join(sorted(shared))))
                                break
                    if why and gj in fits[tag].get(t, ()):
                        why = None            # already recorded (declared wins the label)
                    if why:
                        fits[tag].setdefault(t, set()).add(gj)
                        report.append({"board": tag, "title": b.get("title", ""),
                                       "tile": t, "true": gnames[gi],
                                       "true_colour": COLOURS[gi],
                                       "also": gnames[gj], "why": why})
    return fits, report


def count_solutions(gs, fits, cap=6):
    tiles, allowed = [], {}
    for gi, g in enumerate(gs):
        for t in g["tiles"]:
            tiles.append(t)
            allowed[t] = {gi} | set(fits.get(t, ()))
    tiles.sort(key=lambda t: len(allowed[t]))
    counts = [0, 0, 0, 0]
    found = [0]

    def rec(i):
        if found[0] >= cap:
            return
        if i == len(tiles):
            found[0] += 1
            return
        for gi in sorted(allowed[tiles[i]]):
            if counts[gi] < 4:
                counts[gi] += 1
                rec(i + 1)
                counts[gi] -= 1
    rec(0)
    return found[0]


def siblings(boards):
    out = []
    for pid, tag, b, gs in boards:
        ws = [set(words_of(g["name"])) for g in gs]
        for i in range(4):
            for j in range(i + 1, 4):
                sh = ws[i] & ws[j]
                if sh:
                    out.append((tag, gs[i]["name"], gs[j]["name"], "/".join(sorted(sh))))
    return out


# ---------------------------------------------------------------------------


def main():
    quiet = "--quiet" in sys.argv
    raw, data = load_target()
    words = load_words()
    errs, info = [], {}
    boards = structure(data, raw, errs, info)
    declared = load_declared()
    fits, report = detect(boards, words, declared)

    nonunique = []
    for pid, tag, b, gs in boards:
        n = count_solutions(gs, fits[tag])
        if n != 1:
            nonunique.append((tag, b.get("title"), n))
            errs.append("%s (%s): %d legal partitions once every detected double-fit is "
                        "granted — not uniquely solvable" % (tag, b.get("title"), n))

    nb = len(boards)
    ng = sum(len(gs) for _, _, _, gs in boards)
    print("=" * 76)
    print("VALIDATE core/data/connections.js — %d bytes, %d packs, %d boards, %d groups"
          % (info["bytes"], len(data["packs"]), nb, ng))
    print("=" * 76)
    for p in data["packs"]:
        dd = {}
        for b in p["boards"]:
            dd[b["diff"]] = dd.get(b["diff"], 0) + 1
        print("  %-9s %-14s %2d boards   diff %s"
              % (p["id"], p["name"], len(p["boards"]),
                 " ".join("%d:%d" % (k, dd[k]) for k in sorted(dd))))

    def ok(pred):
        return "PASS" if pred else "FAIL"

    has = lambda frag: any(frag in e for e in errs)
    print("\nINVARIANTS")
    print("  1  parses as window.AD_CONNECTIONS = <JSON>; under 300 KB . %s"
          % ok(not has("budget")))
    print("  2  pack set exactly %s ......... %s" % (",".join(EXPECTED_PACKS),
                                                    ok(not has("pack list") and not has("must be deleted"))))
    print("     no office/cambridge pack, no colleague names ........... %s"
          % ok(not has("banned string") and not has("must be deleted")))
    print("  3  4 groups x 4 tiles, 16 tiles per board ................. %s  (%d/%d)"
          % (ok(not has("need 4") and not has("need 16")), nb, nb))
    print("  4  no tile in two groups of one board .................... %s" % ok(not has("two groups")))
    print("  5  tiles uppercase, <= %d chars, allowed charset .......... %s"
          % (MAX_TILE, ok(not has("bad tile"))))
    print("  6  colours y<g<b<p, one each, ascending .................. %s" % ok(not has("colours are")))
    print("  7  note on every group, epilogue on every board .......... %s"
          % ok(not has("no note") and not has("no epilogue")))
    print("  8  no tile echoed in its own category name ............... %s" % ok(not has("echoed inside")))
    print("  9  cross-pack tile reuse <= %d boards .................... %s"
          % (MAX_REUSE, ok(not has("appears in"))))
    print("     %d distinct tile strings; reuse %s" % (
        info["distinct"], " ".join("%dx:%d" % (k, info["reuse_hist"][k])
                                   for k in sorted(info["reuse_hist"]))))
    print(" 10  board ids 1..N per pack, diff 1..5 .................... %s"
          % ok(not has("1..N") and not has("diff")))
    print(" 11  unique solution granting every detected double-fit .... %s  (%d/%d boards)"
          % (ok(not nonunique), nb - len(nonunique), nb))
    nd = sum(1 for r in report if r["why"].startswith("D:"))
    print("     sources: D declared %d · A compound %d · B elsewhere %d · C in-name %d"
          % (nd,
             sum(1 for r in report if r["why"].startswith("A:")),
             sum(1 for r in report if r["why"].startswith("B:")),
             sum(1 for r in report if r["why"].startswith("C:"))))
    print("     detector A dictionary %s; %d/%d boards matched to an authored module"
          % ("live, %d words" % len(words) if words else "SKIPPED — no words_alpha.txt",
             sum(1 for _, _, _, gs in boards
                 if frozenset(tile_key(t) for g in gs for t in g["tiles"]) in declared), nb))

    if not quiet:
        print("\nDOUBLE-FIT REPORT — %d tiles found by an independent detector to plausibly\n"
              "fit a second group of their own board. Each board above is still exact-cover\n"
              "unique with ALL of these granted at once." % len(report))
        cur = None
        for r in report:
            if r["board"] != cur:
                cur = r["board"]
                print("  %s  %s" % (cur, r["title"]))
            print("     %-14s %s [%s] also reads as: %s"
                  % (r["tile"], r["true_colour"], r["true"], r["also"]))
            print("        %s" % r["why"])

        sib = siblings(boards)
        print("\nADVISORY — %d sibling category pairs inside one board (share a content word).\n"
              "These are intentional near-misses; listed so a human can eyeball them." % len(sib))
        for tag, a, b2, sh in sib:
            print("  %-12s %r  vs  %r   [%s]" % (tag, a, b2, sh))

    if errs:
        print("\nERRORS (%d)" % len(errs))
        for e in errs:
            print("  X " + e)
        print("\nVALIDATION FAILED")
        return 1
    print("\nALL CHECKS PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
