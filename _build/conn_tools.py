#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""conn_tools.py — read-only helpers for authoring QUARTETS batches in parallel.

Several authoring sessions write `_build/conn_*.py` at once, so every command
here TOLERATES a half-written module (it is skipped, and named in the footer)
instead of crashing the way the real generator would.

    python3 _build/conn_tools.py freq LEAD SPRING ORANGE   # dataset-wide tile use
    python3 _build/conn_tools.py cats [pack]               # category names in use
    python3 _build/conn_tools.py titles [pack]             # board titles in use
    python3 _build/conn_tools.py hot [n]                   # tiles at/near the cap
    python3 _build/conn_tools.py counts                    # boards per pack

The cap that matters: a tile string may appear in at most MAX_REUSE boards
dataset-wide (see gen_connections2.py). `freq` tells you the headroom BEFORE you
spend an hour on a board the full build will reject.
"""

import glob
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
MAX_REUSE = 6


def norm(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9 ]+", " ", s.lower())
    return " ".join(s.split())


def pack_of(module):
    m = re.match(r"conn_([a-z]+?)\d*$", module)
    return m.group(1) if m else module


def scan():
    """-> (records, broken_module_names). record = (pack, module, board)."""
    recs, broken = [], []
    for path in sorted(glob.glob(os.path.join(HERE, "conn_*.py"))):
        module = os.path.splitext(os.path.basename(path))[0]
        if module == "conn_tools":
            continue
        ns = {}
        try:
            with open(path, "r", encoding="utf-8") as fh:
                exec(compile(fh.read(), path, "exec"), ns)  # noqa: S102 — our own data
        except Exception as exc:                            # noqa: BLE001
            broken.append("%s (%s)" % (module, type(exc).__name__))
            continue
        for board in ns.get("BOARDS", []):
            recs.append((pack_of(module), module, board))
    return recs, broken


def footer(broken):
    if broken:
        print("\n(skipped, currently unparseable: %s)" % ", ".join(broken))


def cmd_freq(args):
    recs, broken = scan()
    where = {}
    for pack, module, board in recs:
        for group in board.get("groups", []):
            for tile in group.get("tiles", []):
                where.setdefault(tile.upper(), []).append("%s/%s" % (pack, board.get("title", "?")))
    if not args:
        print("usage: conn_tools.py freq TILE [TILE ...]")
        return 1
    for tile in args:
        hits = where.get(tile.upper(), [])
        left = MAX_REUSE - len(hits)
        print("%-16s %d used, %d left%s" % (tile.upper(), len(hits), left,
                                            ("   " + "; ".join(hits)) if hits else ""))
    footer(broken)
    return 0


def cmd_cats(args):
    recs, broken = scan()
    want = args[0] if args else None
    seen = {}
    for pack, module, board in recs:
        if want and pack != want:
            continue
        for group in board.get("groups", []):
            seen.setdefault(norm(group["name"]), group["name"])
    for key in sorted(seen):
        print(seen[key])
    print("\n%d distinct category names%s" % (len(seen), (" in " + want) if want else ""))
    footer(broken)
    return 0


def cmd_titles(args):
    recs, broken = scan()
    want = args[0] if args else None
    out = sorted({b.get("title", "?") for p, m, b in recs if not want or p == want})
    for t in out:
        print(t)
    print("\n%d distinct titles%s" % (len(out), (" in " + want) if want else ""))
    footer(broken)
    return 0


def cmd_hot(args):
    floor = int(args[0]) if args else 3
    recs, broken = scan()
    count = {}
    for pack, module, board in recs:
        for group in board.get("groups", []):
            for tile in group.get("tiles", []):
                count[tile.upper()] = count.get(tile.upper(), 0) + 1
    hot = sorted(((c, t) for t, c in count.items() if c >= floor), reverse=True)
    for c, t in hot:
        print("%d  %s%s" % (c, t, "   AT CAP" if c >= MAX_REUSE else ""))
    print("\n%d tiles used %d+ times (cap %d)" % (len(hot), floor, MAX_REUSE))
    footer(broken)
    return 0


def cmd_counts(args):
    recs, broken = scan()
    per = {}
    for pack, module, board in recs:
        per.setdefault(pack, {}).setdefault(module, 0)
        per[pack][module] += 1
    total = 0
    for pack in sorted(per):
        n = sum(per[pack].values())
        total += n
        print("%-9s %3d   %s" % (pack, n, " ".join("%s:%d" % (m.replace("conn_", ""), c)
                                                   for m, c in sorted(per[pack].items()))))
    print("%-9s %3d" % ("TOTAL", total))
    footer(broken)
    return 0


CMDS = {"freq": cmd_freq, "cats": cmd_cats, "titles": cmd_titles,
        "hot": cmd_hot, "counts": cmd_counts}


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in CMDS:
        print(__doc__)
        return 1
    return CMDS[sys.argv[1]](sys.argv[2:])


if __name__ == "__main__":
    sys.exit(main())
