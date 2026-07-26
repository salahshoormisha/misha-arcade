#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_connections.py — build core/data/connections.js (window.AD_CONNECTIONS)

Deterministic, stdlib-only, re-runnable:

    python3 _build/gen_connections.py           # build + validate + report
    python3 _build/gen_connections.py --report  # validate only, print the full report

Authored content lives in sibling modules so the build is incremental and
crash-safe — whatever batches exist on disk get emitted, and the output file is
always valid JS:

    _build/conn_general1.py .. conn_general4.py   (10 boards each -> pack "general")
    _build/conn_persia.py                          (pack "persia")
    _build/conn_united.py                          (pack "united")
    _build/conn_office.py                          (pack "office")
    _build/conn_cambridge.py                       (pack "cambridge")

Each module defines  BOARDS = [ board, ... ]  where a board is:

    {
      "title": "Board title",              # flavour, shown above the grid
      "diff": 1..5,                        # authored difficulty
      "groups": [                          # EXACTLY 4, EASIEST FIRST
         {"name": "CATEGORY NAME",
          "tiles": ["A","B","C","D"],      # uppercase, <= 14 chars
          "note": "one line of colour/explanation"},
         ...
      ],
      "traps": [ ["TILE", altGroupIndex, "why it also looks like group N"], ... ],
      "epilogue": "the after-the-fact note for the whole board"
    }

Colours y/g/b/p are assigned from group ORDER (index 0..3 == ascending
difficulty), so authors never hand-write a colour and can never mis-order one.

UNIQUENESS MODEL
----------------
"Unique solution" is enforced as an exact-cover count over a declared
plausibility matrix: every tile may legally sit in its true group plus any group
named in `traps`. The validator enumerates every partition of the 16 tiles into
four 4-tile groups that respects that matrix and requires the count to be
exactly 1. A trap that could actually be swapped with a second trap (a 2-cycle)
therefore FAILS the build rather than shipping an ambiguous board.
"""

import json
import os
import re
import sys
import unicodedata
from itertools import combinations

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "core", "data", "connections.js")

COLOURS = ["y", "g", "b", "p"]
MAX_TILE = 14
MAX_REUSE = 3          # a tile string may appear in at most this many boards, dataset-wide

# pack id -> (display name, blurb, which authored modules feed it, in order)
PACKS = [
    ("general", "MIXED BAG",
     "The main archive. Wordplay, general knowledge, and a purple that bites.",
     ["conn_general1", "conn_general2", "conn_general3", "conn_general4"]),
    ("persia", "PERSIAN BLUE",
     "Nowruz, poets, food, carpets, and the words English quietly borrowed.",
     ["conn_persia"]),
    ("united", "RED DEVILS",
     "Old Trafford and the Premier League. The FOURMATIONS archive, rehoused.",
     ["conn_united"]),
    ("places", "FOUR CITIES",
     "Cambridge, London, Edinburgh, Houston. Squares, closes, bayous, feeder roads.",
     ["conn_places"]),
    ("ai", "THE ALIGNMENT",
     "Alignment, evals, compute governance, the labs, the papers, the acronyms.",
     ["conn_ai"]),
    ("jewish", "DIASPORA",
     "Holidays, food, Yiddish and Hebrew in English, texts, music, and Israel.",
     ["conn_jewish"]),
]

# ---------------------------------------------------------------------------
# loading


def load_module(name):
    """Import an authored batch module by name; return [] if it is not on disk."""
    path = os.path.join(HERE, name + ".py")
    if not os.path.exists(path):
        return None
    ns = {}
    with open(path, "r", encoding="utf-8") as fh:
        src = fh.read()
    exec(compile(src, path, "exec"), ns)  # noqa: S102 - our own authored data
    return ns.get("BOARDS", [])


def collect():
    """-> (packs_payload, flat_board_list, problems_loading)"""
    packs = []
    flat = []
    missing = []
    for pid, pname, blurb, modules in PACKS:
        boards = []
        for m in modules:
            got = load_module(m)
            if got is None:
                missing.append(m)
                continue
            boards.extend(got)
        out_boards = []
        for n, b in enumerate(boards, 1):
            ob = {
                "id": n,
                "title": b["title"],
                "diff": b["diff"],
                "groups": [
                    {
                        "name": g["name"],
                        "colour": COLOURS[i],
                        "tiles": list(g["tiles"]),
                        "note": g["note"],
                    }
                    for i, g in enumerate(b["groups"])
                ],
                "epilogue": b["epilogue"],
            }
            out_boards.append(ob)
            flat.append((pid, n, b, ob))
        packs.append({"id": pid, "name": pname, "blurb": blurb, "boards": out_boards})
    return packs, flat, missing


# ---------------------------------------------------------------------------
# validation


def tile_ok(t):
    if not t or len(t) > MAX_TILE:
        return False, "length %d" % len(t)
    if t != t.upper():
        return False, "not uppercase"
    # allow letters (incl. accented), digits, space and a small punctuation set
    for ch in t:
        if ch in " '-.&/,:!?":
            continue
        if ch.isdigit():
            continue
        cat = unicodedata.category(ch)
        if cat in ("Lu", "Lo"):
            continue
        return False, "bad char %r" % ch
    return True, ""


def count_solutions(board_groups, traps, cap=8):
    """
    Exact-cover count. board_groups: list of 4 tile-lists (the truth).
    traps: list of (tile, alt_group_index). Returns number of legal partitions.
    """
    tiles = []
    allowed = {}
    for gi, g in enumerate(board_groups):
        for t in g:
            tiles.append(t)
            allowed[t] = {gi}
    for t, alt in traps:
        if t in allowed:
            allowed[t].add(alt)
    # order tiles by fewest options first (pure speed)
    tiles.sort(key=lambda t: len(allowed[t]))
    counts = [0, 0, 0, 0]
    found = [0]

    def rec(i):
        if found[0] >= cap:
            return
        if i == len(tiles):
            found[0] += 1
            return
        t = tiles[i]
        for gi in sorted(allowed[t]):
            if counts[gi] < 4:
                counts[gi] += 1
                rec(i + 1)
                counts[gi] -= 1

    rec(0)
    return found[0]


def norm_name(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9 ]+", " ", s.lower())
    return " ".join(s.split())


def load_fourmations():
    """-> (set_of_frozenset_itemsets, set_of_normalised_group_names) or (None, None)"""
    p = "/Users/mishasalahshoor/fourmations/puzzles.js"
    if not os.path.exists(p):
        return None, None
    src = open(p, encoding="utf-8").read()
    data = json.loads(src[src.index("["): src.rindex("]") + 1])
    sets, names = set(), set()
    for b in data:
        for g in b["groups"]:
            sets.add(frozenset(norm_name(x) for x in g["items"]))
            names.add(norm_name(g["name"]))
    return sets, names


def validate(packs, flat):
    errs, warns, info = [], [], {}

    # ---- per board -------------------------------------------------------
    seen_global = {}          # tile -> [ "pack#id", ... ]
    trap_report = []
    group_name_seen = {}
    for pid, bid, raw, ob in flat:
        tag = "%s#%d" % (pid, bid)
        gts = [g["tiles"] for g in ob["groups"]]
        allt = [t for g in gts for t in g]

        if len(ob["groups"]) != 4:
            errs.append("%s: %d groups (need 4)" % (tag, len(ob["groups"])))
        for g in ob["groups"]:
            if len(g["tiles"]) != 4:
                errs.append("%s: group %r has %d tiles" % (tag, g["name"], len(g["tiles"])))
            if not g.get("note"):
                errs.append("%s: group %r has no note" % (tag, g["name"]))
            key = norm_name(g["name"])
            group_name_seen.setdefault(key, []).append(tag)
            # NYT's most-hated construction: a tile echoed inside its own category name
            nn = " " + norm_name(g["name"]) + " "
            for t in g["tiles"]:
                if " " + norm_name(t) + " " in nn:
                    warns.append("%s: tile %r appears inside its own category name %r"
                                 % (tag, t, g["name"]))
        if not ob.get("epilogue"):
            errs.append("%s: no epilogue" % tag)
        if not (1 <= ob["diff"] <= 5):
            errs.append("%s: diff %r out of range" % (tag, ob["diff"]))

        if len(allt) != 16:
            errs.append("%s: %d tiles (need 16)" % (tag, len(allt)))
        if len(set(allt)) != len(allt):
            dupes = sorted({t for t in allt if allt.count(t) > 1})
            errs.append("%s: repeated tile(s) across groups: %s" % (tag, dupes))

        for t in allt:
            ok, why = tile_ok(t)
            if not ok:
                errs.append("%s: bad tile %r (%s)" % (tag, t, why))
            seen_global.setdefault(t, []).append(tag)

        # uniqueness
        traps = [(x[0], x[1]) for x in raw.get("traps", [])]
        for t, alt in traps:
            if t not in allt:
                errs.append("%s: trap names unknown tile %r" % (tag, t))
            if not (0 <= alt <= 3):
                errs.append("%s: trap %r has bad alt index %r" % (tag, t, alt))
        n = count_solutions(gts, traps)
        if n != 1:
            errs.append("%s: NOT UNIQUELY SOLVABLE — %d legal partitions under the "
                        "declared double-fits" % (tag, n))
        for x in raw.get("traps", []):
            true_gi = next(i for i, g in enumerate(gts) if x[0] in g)
            trap_report.append({
                "board": tag,
                "title": ob["title"],
                "tile": x[0],
                "true": ob["groups"][true_gi]["name"],
                "true_colour": COLOURS[true_gi],
                "also_fits": ob["groups"][x[1]]["name"],
                "why": x[2] if len(x) > 2 else "",
            })

    # ---- cross-board reuse ----------------------------------------------
    over = {t: v for t, v in seen_global.items() if len(v) > MAX_REUSE}
    for t, v in sorted(over.items(), key=lambda kv: -len(kv[1])):
        errs.append("tile %r reused in %d boards (max %d): %s"
                    % (t, len(v), MAX_REUSE, ", ".join(v)))

    dupname = {k: v for k, v in group_name_seen.items() if len(v) > 1}
    for k, v in sorted(dupname.items()):
        warns.append("category name reused: %r in %s" % (k, ", ".join(v)))

    # ---- united pack vs FOURMATIONS -------------------------------------
    fm_sets, fm_names = load_fourmations()
    if fm_sets is None:
        info["fourmations"] = "NOT FOUND — could not check for duplicated groups"
    else:
        # FOURMATIONS is being retired and its best football content now lives in
        # the `united` pack, so an identical group is ADAPTED, not a bug. Outside
        # `united` an overlap is still suspicious, so it stays an error there.
        adapted = []
        for pid, bid, raw, ob in flat:
            for g in ob["groups"]:
                s = frozenset(norm_name(t) for t in g["tiles"])
                same_set = s in fm_sets
                same_name = norm_name(g["name"]) in fm_names
                if not (same_set or same_name):
                    continue
                how = "tile set" if same_set else "category name"
                msg = "%s#%d %r — identical %s to a FOURMATIONS group" % (pid, bid, g["name"], how)
                if pid == "united":
                    adapted.append(msg + " (adapted on purpose)")
                else:
                    errs.append(msg)
        info["adapted"] = adapted
        info["fourmations"] = ("checked against %d groups from "
                              "/Users/mishasalahshoor/fourmations/puzzles.js; %d adapted into "
                              "`united` on purpose" % (len(fm_sets), len(adapted)))

    info["reuse_hist"] = {}
    for t, v in seen_global.items():
        info["reuse_hist"][len(v)] = info["reuse_hist"].get(len(v), 0) + 1
    info["distinct_tiles"] = len(seen_global)
    info["total_tiles"] = sum(len(v) for v in seen_global.values())
    info["traps"] = trap_report
    return errs, warns, info


# ---------------------------------------------------------------------------
# emit


def dumps_board(b):
    return json.dumps(b, ensure_ascii=False, separators=(",", ":"), sort_keys=False)


def emit(packs):
    lines = []
    lines.append("// core/data/connections.js — grouping puzzles for QUARTETS "
                 "(window.AD_CONNECTIONS).")
    lines.append("// Source: hand-authored for this arcade (_build/conn_*.py). "
                 "Generated by _build/gen_connections.py — do not edit by hand.")
    lines.append("// Colours y<g<b<p ascend in difficulty. Every board is verified "
                 "uniquely solvable; see the trap table in the generator's report.")
    lines.append("window.AD_CONNECTIONS = {")
    lines.append('"packs":[')
    for pi, p in enumerate(packs):
        lines.append("{" + '"id":%s,"name":%s,"blurb":%s,"boards":[' % (
            json.dumps(p["id"]), json.dumps(p["name"], ensure_ascii=False),
            json.dumps(p["blurb"], ensure_ascii=False)))
        for bi, b in enumerate(p["boards"]):
            lines.append(dumps_board(b) + ("," if bi < len(p["boards"]) - 1 else ""))
        lines.append("]}" + ("," if pi < len(packs) - 1 else ""))
    lines.append("]")
    lines.append("};")
    return "\n".join(lines) + "\n"


def main():
    packs, flat, missing = collect()
    errs, warns, info = validate(packs, flat)
    js = emit(packs)

    # the payload between the first "= " and the trailing ";" must be strict JSON
    payload = js[js.index("window.AD_CONNECTIONS = ") + len("window.AD_CONNECTIONS = "):].rstrip()
    assert payload.endswith(";")
    parsed = json.loads(payload[:-1])

    if "--report" not in sys.argv:
        with open(OUT, "w", encoding="utf-8") as fh:
            fh.write(js)

    # ---- report ----------------------------------------------------------
    print("=" * 74)
    print("connections.js  —  %d bytes  (%d packs, %d boards, %d groups, %d tiles)" % (
        len(js.encode("utf-8")), len(parsed["packs"]),
        sum(len(p["boards"]) for p in parsed["packs"]),
        sum(len(b["groups"]) for p in parsed["packs"] for b in p["boards"]),
        info["total_tiles"]))
    print("=" * 74)
    for p in parsed["packs"]:
        dd = {}
        for b in p["boards"]:
            dd[b["diff"]] = dd.get(b["diff"], 0) + 1
        print("  %-10s %-14s %2d boards   diff spread %s"
              % (p["id"], p["name"], len(p["boards"]),
                 " ".join("%d:%d" % (k, dd[k]) for k in sorted(dd))))
    if missing:
        print("\n  batches not yet authored: " + ", ".join(missing))
    print("\nINVARIANTS")
    nb = sum(len(p["boards"]) for p in parsed["packs"])
    print("  16 distinct tiles per board .............. %s" % (
        "PASS (%d/%d)" % (nb, nb) if not any("tiles (need 16)" in e or "repeated tile" in e for e in errs) else "FAIL"))
    print("  no tile in two groups of one board ....... %s" % (
        "PASS" if not any("repeated tile" in e for e in errs) else "FAIL"))
    print("  tiles uppercase and <= %d chars ........... %s" % (
        MAX_TILE, "PASS" if not any("bad tile" in e for e in errs) else "FAIL"))
    print("  cross-board tile reuse <= %d .............. %s" % (
        MAX_REUSE, "PASS" if not any("reused in" in e for e in errs) else "FAIL"))
    print("     distinct tile strings %d, reuse histogram %s"
          % (info["distinct_tiles"],
             " ".join("%dx:%d" % (k, info["reuse_hist"][k]) for k in sorted(info["reuse_hist"]))))
    print("  unique solution per board ................ %s" % (
        "PASS (%d boards, exact-cover count == 1)" % nb
        if not any("UNIQUELY" in e for e in errs) else "FAIL"))
    print("  no FOURMATIONS group outside `united` .... %s" % (
        "PASS" if not any("FOURMATIONS" in e for e in errs) else "FAIL"))
    print("     %s" % info["fourmations"])
    for a in info.get("adapted", []):
        print("     ~ " + a)
    print("  strict-JSON payload parses ............... PASS")

    print("\nDECLARED DOUBLE-FITS (%d) — each verified still uniquely solvable"
          % len(info["traps"]))
    for t in info["traps"]:
        print("  %-14s %-11s  %s  [%s]  also reads as: %s"
              % (t["board"], t["tile"], t["true_colour"], t["true"], t["also_fits"]))
        if t["why"]:
            print("      %s" % t["why"])

    if warns:
        print("\nWARNINGS (%d)" % len(warns))
        for w in warns:
            print("  ! " + w)
    if errs:
        print("\nERRORS (%d)" % len(errs))
        for e in errs:
            print("  X " + e)
        print("\nBUILD FAILED")
        return 1
    print("\nOK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
