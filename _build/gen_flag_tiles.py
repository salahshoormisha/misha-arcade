#!/usr/bin/env python3
"""
gen_flag_tiles.py — measure, for every shipped flag, how much information each
of FLAGLE's six tiles actually carries, and write the ranking into
core/data/flags.js as a `t` field.

WHY THIS EXISTS
  FLAGLE hides a flag behind a 3x2 grid and opens one tile per guess. The
  original (flagle.io) opens them in a blind seeded shuffle, and _build/
  RESEARCH.md flags that as its worst design bug: "Random tile order makes daily
  difficulty wildly uneven. On a flag like Panama, drawing the tile containing
  the star effectively ends the puzzle; drawing three tiles of flat colour tells
  you nothing." Its own IMPROVEMENT IDEA is the fix implemented here: "score
  each tile offline by unique-colour count, edge density and whether it contains
  an emblem/charge, then reveal least-informative first so the difficulty curve
  is monotonic."

  The game shipped a hand-written table of guesses ("charges sit in the middle
  column, cantons sit top-left"). That is a judgement, not a measurement, and it
  is wrong often enough to matter — Nepal, South Africa, Kiribati, the Marshall
  Islands, every flag with a diagonal. This script replaces it with a real
  measurement off the real vector artwork.

HOW
  1. Rasterise each core/data/flags/XX.svg with macOS Quick Look (`qlmanage`),
     which is on every Mac and needs no install. It letterboxes into a square,
     so the flag's true rectangle inside that square is found by rendering one
     solid-black calibration SVG per distinct viewBox aspect and taking its
     bounding box. Exact, and ~15 extra renders rather than 250.
  2. Decode the PNG with zlib + numpy only (read_png below is a complete
     non-interlaced 8-bit PNG reader — no Pillow, no cairo).
  3. Split the flag rectangle into the same 3x2 the game draws and score each
     tile on three axes, all measured WITHIN the flag:
       detail  — mean gradient magnitude. Emblems, text, coats of arms, stars.
       palette — how many quantised colours cover >=3% of the tile. Bands and
                 boundaries; a tile of one flat colour scores 1.
       odd     — how far the tile's mean colour sits from the whole flag's mean
                 colour. A tile that looks like the rest of the flag adds
                 nothing you didn't already have.
     An earlier draft scored a fourth axis, "how few OTHER flags have a similar
     tile in this position". It reads well but measures badly: Indonesia is a
     plain red-over-white bicolour whose six tiles are pairwise identical, and
     positional corpus rarity gave them six DIFFERENT ranks (plain red at
     top-left had 6 look-alikes, plain red at top-centre had 2 — an artefact of
     which flags happen to be red where, not a fact about Indonesia). Dropped.
  4. Rank the six tiles ascending, merging ties on an ABSOLUTE threshold, and
     store the ranks. Ties matter and the threshold has to be absolute: a plain
     tricolour has to come out all-zeros so the game falls back to the day's
     seeded shuffle — i.e. degrade exactly to flagle.io's behaviour on the flags
     where there is genuinely nothing to rank. A relative threshold instead
     amplifies antialiasing noise into a confident, meaningless ordering.

OUTPUT
  Rewrites core/data/flags.js in place, adding `"t":[r0..r5]` to every entry
  that could be measured. Every other field is preserved byte-for-byte (each
  entry is parsed as JSON, extended, and re-serialised with the same key order).
  Re-runnable and deterministic.

    python3 _build/gen_flag_tiles.py            # measure + write
    python3 _build/gen_flag_tiles.py --dry      # measure + report, write nothing
    python3 _build/gen_flag_tiles.py --rerender # ignore the raster cache
    python3 _build/gen_flag_tiles.py --probe US,FR,JP   # show the raw components

Rasterising 250 SVGs takes ~2 minutes, so the raw measurements are cached in
_build/cache/flagtiles.npz (gitignored, rebuilt with --rerender). Tuning the
weights below is then instant.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zlib

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FLAGS_JS = os.path.join(ROOT, "core", "data", "flags.js")
SVG_DIR = os.path.join(ROOT, "core", "data", "flags")

BOX = 512          # qlmanage thumbnail box, px
COLS, ROWS = 3, 2  # FLAGLE's tile grid
SIG = 12           # tile signature is SIG x SIG RGB
TIE = 0.060        # two tiles share a rank when their info differs by less
W_DETAIL, W_PALETTE, W_ODD = 0.55, 0.20, 0.25     # how the three axes combine
P_DETAIL, P_ODD = 90, 88                          # percentile that saturates each


# ── PNG: a complete 8-bit non-interlaced reader, stdlib + numpy ──────────────
def read_png(path):
    data = open(path, "rb").read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a png")
    i, idat, hdr, plte, trns = 8, [], None, None, None
    while i < len(data):
        ln = int.from_bytes(data[i:i + 4], "big")
        typ = data[i + 4:i + 8]
        body = data[i + 8:i + 8 + ln]
        if typ == b"IHDR":
            hdr = dict(w=int.from_bytes(body[0:4], "big"),
                       h=int.from_bytes(body[4:8], "big"),
                       depth=body[8], colour=body[9], interlace=body[12])
        elif typ == b"IDAT":
            idat.append(body)
        elif typ == b"PLTE":
            plte = body
        elif typ == b"tRNS":
            trns = body
        elif typ == b"IEND":
            break
        i += 12 + ln
    if hdr["depth"] != 8 or hdr["interlace"] != 0:
        raise ValueError("depth %s interlace %s" % (hdr["depth"], hdr["interlace"]))
    chans = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[hdr["colour"]]
    w, h = hdr["w"], hdr["h"]
    raw = zlib.decompress(b"".join(idat))
    stride = w * chans
    out = np.zeros((h, stride), dtype=np.uint8)
    prev = np.zeros(stride, dtype=np.int64)
    p = 0
    for y in range(h):
        ft = raw[p]
        p += 1
        line = np.frombuffer(raw[p:p + stride], dtype=np.uint8).astype(np.int64).copy()
        p += stride
        if ft == 0:
            pass
        elif ft == 1:
            for x in range(chans, stride):
                line[x] = (line[x] + line[x - chans]) & 255
        elif ft == 2:
            line = (line + prev) & 255
        elif ft == 3:
            for x in range(stride):
                a = line[x - chans] if x >= chans else 0
                line[x] = (line[x] + ((a + prev[x]) >> 1)) & 255
        elif ft == 4:
            for x in range(stride):
                a = line[x - chans] if x >= chans else 0
                b = prev[x]
                c = prev[x - chans] if x >= chans else 0
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        else:
            raise ValueError("filter %s" % ft)
        out[y] = line
        prev = line
    px = out.reshape(h, w, chans)
    if hdr["colour"] == 3:
        pal = np.frombuffer(plte, dtype=np.uint8).reshape(-1, 3)
        return pal[px[:, :, 0]].astype(np.float64)
    if chans == 1:
        return np.repeat(px, 3, axis=2).astype(np.float64)
    if chans == 2:
        return np.repeat(px[:, :, :1], 3, axis=2).astype(np.float64)
    if chans == 3:
        return px.astype(np.float64)
    # RGBA — composite over white, which is what a viewer sees
    a = px[:, :, 3:4].astype(np.float64) / 255.0
    return px[:, :, :3].astype(np.float64) * a + 255.0 * (1 - a)


def render(svg_path, outdir):
    """Rasterise one SVG. Returns an HxWx3 float array, or None."""
    subprocess.run(["qlmanage", "-t", "-s", str(BOX), "-o", outdir, svg_path],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
    png = os.path.join(outdir, os.path.basename(svg_path) + ".png")
    if not os.path.exists(png):
        return None
    try:
        return read_png(png)
    finally:
        os.remove(png)


# ── where inside the square thumbnail the flag actually sits ─────────────────
_CALIB = {}


def content_box(view_box, tmp):
    """Bounding box (y0,y1,x0,x1) of a solid rect drawn in this viewBox."""
    key = view_box
    if key in _CALIB:
        return _CALIB[key]
    path = os.path.join(tmp, "calib.svg")
    vb = [float(v) for v in re.split(r"[\s,]+", view_box.strip())]
    with open(path, "w") as fh:
        fh.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s">'
                 '<rect x="%r" y="%r" width="%r" height="%r" fill="#000"/></svg>'
                 % (view_box, vb[0], vb[1], vb[2], vb[3]))
    im = render(path, tmp)
    os.remove(path)
    if im is None:
        _CALIB[key] = None
        return None
    dark = im.mean(axis=2) < 128
    ys, xs = np.where(dark)
    if not len(ys):
        _CALIB[key] = None
        return None
    # erode by 1px so antialiased edges don't leak the white surround in
    box = (ys.min() + 1, ys.max(), xs.min() + 1, xs.max())
    _CALIB[key] = box
    return box


# ── the three measurements ──────────────────────────────────────────────────
def sobel_energy(lum):
    gx = np.abs(np.diff(lum, axis=1)).mean() if lum.shape[1] > 1 else 0.0
    gy = np.abs(np.diff(lum, axis=0)).mean() if lum.shape[0] > 1 else 0.0
    return float(gx + gy)


def palette_count(tile):
    q = (tile // 48).astype(np.int64)               # 6 levels per channel
    key = q[:, :, 0] * 36 + q[:, :, 1] * 6 + q[:, :, 2]
    _, counts = np.unique(key, return_counts=True)
    frac = counts / float(key.size)
    return int((frac >= 0.03).sum())


def signature(tile):
    """SIG x SIG box-filtered RGB, flattened and scaled to 0..1."""
    h, w, _ = tile.shape
    ys = np.linspace(0, h, SIG + 1).astype(int)
    xs = np.linspace(0, w, SIG + 1).astype(int)
    out = np.zeros((SIG, SIG, 3))
    for r in range(SIG):
        for c in range(SIG):
            blk = tile[max(ys[r], 0):max(ys[r + 1], ys[r] + 1),
                       max(xs[c], 0):max(xs[c + 1], xs[c] + 1)]
            out[r, c] = blk.reshape(-1, 3).mean(axis=0) if blk.size else 255.0
    return (out / 255.0).reshape(-1)


def measure(im, box):
    """Six tiles -> (detail, palette, signature) each."""
    y0, y1, x0, x1 = box
    flag = im[y0:y1, x0:x1]
    h, w, _ = flag.shape
    if h < ROWS * 8 or w < COLS * 8:
        return None
    tiles = []
    for r in range(ROWS):
        for c in range(COLS):
            t = flag[int(r * h / ROWS):int((r + 1) * h / ROWS),
                     int(c * w / COLS):int((c + 1) * w / COLS)]
            lum = t[:, :, 0] * .299 + t[:, :, 1] * .587 + t[:, :, 2] * .114
            tiles.append((sobel_energy(lum), palette_count(t), signature(t)))
    return tiles


def rank(vals):
    """Ascending ranks 0..5, values within TIE of each other sharing a rank.

    The threshold is absolute, deliberately — see the module docstring. A flag
    whose six tiles all measure within TIE comes out [0,0,0,0,0,0], which is the
    signal FLAGLE reads as "nothing to rank here, use the seeded shuffle"."""
    order = sorted(range(len(vals)), key=lambda k: vals[k])
    out = [0] * len(vals)
    r = 0
    for n, k in enumerate(order):
        if n and (vals[k] - vals[order[n - 1]]) > TIE:
            r += 1
        out[k] = r
    return out


CACHE = os.path.join(ROOT, "_build", "cache", "flagtiles.npz")


def raster_pass(entries):
    """Render + measure every flag. Returns (order, detail, palette, sigs)."""
    tmp = tempfile.mkdtemp(prefix="flagtiles-")
    detail, palette, sigs, order, missed = {}, {}, {}, [], []
    try:
        for n, iso in enumerate(entries):
            svg = os.path.join(SVG_DIR, iso + ".svg")
            if not os.path.exists(svg):
                missed.append(iso + ":nosvg")
                continue
            head = open(svg, encoding="utf-8", errors="replace").read(600)
            m = re.search(r'viewBox="([^"]+)"', head)
            if not m:
                missed.append(iso + ":noviewbox")
                continue
            box = content_box(m.group(1), tmp)
            im = render(svg, tmp)
            if im is None or box is None:
                missed.append(iso + ":norender")
                continue
            t = measure(im, box)
            if t is None:
                missed.append(iso + ":tiny")
                continue
            detail[iso] = [x[0] for x in t]
            palette[iso] = [x[1] for x in t]
            sigs[iso] = [x[2] for x in t]
            order.append(iso)
            if (n + 1) % 25 == 0:
                print("  rendered %d/%d" % (n + 1, len(entries)))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print("measured %d flags, missed %d %s" % (len(order), len(missed), missed[:12]))
    return order, detail, palette, sigs


def load_or_raster(entries, force):
    if not force and os.path.exists(CACHE):
        z = np.load(CACHE, allow_pickle=False)
        order = [str(s) for s in z["order"]]
        if order == entries:
            print("using cached rasters (%s)" % os.path.basename(CACHE))
            return (order,
                    {i: list(z["detail"][n]) for n, i in enumerate(order)},
                    {i: list(z["palette"][n]) for n, i in enumerate(order)},
                    {i: list(z["sigs"][n]) for n, i in enumerate(order)})
        print("cache is stale (%d entries vs %d) — re-rendering" % (len(order), len(entries)))
    order, detail, palette, sigs = raster_pass(entries)
    if order:
        os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        np.savez_compressed(CACHE, order=np.array(order),
                            detail=np.array([detail[i] for i in order]),
                            palette=np.array([palette[i] for i in order]),
                            sigs=np.array([sigs[i] for i in order]))
    return order, detail, palette, sigs


def main():
    dry = "--dry" in sys.argv
    probe = ""
    for a in sys.argv[1:]:
        if a.startswith("--probe"):
            probe = a.split("=", 1)[1] if "=" in a else \
                (sys.argv[sys.argv.index(a) + 1] if len(sys.argv) > sys.argv.index(a) + 1 else "")
    src = open(FLAGS_JS, encoding="utf-8").read()
    entries = [m[0] for m in re.findall(r'^\s*"([A-Z]{2})":\s*(\{.*?\}),?\s*$', src, re.M)]
    print("flags.js entries: %d" % len(entries))

    order, detail, palette, sigs = load_or_raster(entries, "--rerender" in sys.argv)
    if not order:
        sys.exit("nothing rendered — is qlmanage available?")

    # odd: how far each tile's mean colour is from the flag's own mean colour,
    # as a fraction of the RGB cube's diagonal. Computed off the cached tile
    # signatures, so tuning it needs no re-render.
    N = COLS * ROWS
    odd = {}
    for i in order:
        means = [np.asarray(sigs[i][k]).reshape(SIG, SIG, 3).mean(axis=(0, 1)) for k in range(N)]
        whole = np.mean(means, axis=0)
        odd[i] = [float(np.linalg.norm(m - whole) / np.sqrt(3.0)) for m in means]

    dscale = float(np.percentile([v for i in order for v in detail[i]], P_DETAIL)) or 1.0
    oscale = float(np.percentile([v for i in order for v in odd[i]], P_ODD)) or 1.0
    print("saturation points: detail p%d=%.3f  odd p%d=%.3f" % (P_DETAIL, dscale, P_ODD, oscale))

    ranks, flat, info_of = {}, 0, {}
    for i in order:
        info = []
        for k in range(N):
            d = min(1.0, detail[i][k] / dscale)
            p = min(1.0, (palette[i][k] - 1) / 4.0)
            o = min(1.0, odd[i][k] / oscale)
            info.append(W_DETAIL * d + W_PALETTE * p + W_ODD * o)
        info_of[i] = info
        r = rank(info)
        ranks[i] = r
        if max(r) == 0:
            flat += 1

    print("flat flags (no rankable tile, seeded shuffle stands): %d" % flat)
    print("ranked flags: %d" % (len(order) - flat))
    bands = {}
    for i in order:
        bands[max(ranks[i])] = bands.get(max(ranks[i]), 0) + 1
    print("distinct ranks per flag: %s" % {k + 1: v for k, v in sorted(bands.items())})
    for iso in ("JP", "BR", "US", "CA", "PA", "FR", "NP", "ZA", "IR", "GB", "ID", "MC", "TR", "SA"):
        if iso in ranks:
            print("  %s %s" % (iso, ranks[iso]))

    if probe:
        for iso in [s.strip().upper() for s in probe.split(",") if s.strip()]:
            if iso not in ranks:
                print("%s: not measured" % iso)
                continue
            print("\n%s  rank=%s" % (iso, ranks[iso]))
            for k in range(N):
                print("   tile %d  detail %7.3f  palette %d  odd %.3f  info %.3f"
                      % (k, detail[iso][k], palette[iso][k], odd[iso][k], info_of[iso][k]))

    if dry or probe:
        return

    out, changed = [], 0
    for line in src.split("\n"):
        m = re.match(r'^(\s*)"([A-Z]{2})":\s*(\{.*?\})(,?)\s*$', line)
        if not m or m.group(2) not in ranks:
            out.append(line)
            continue
        pad, iso, body, comma = m.groups()
        rec = json.loads(body)
        rec.pop("t", None)
        rec["t"] = ranks[iso]
        out.append('%s"%s": %s%s' % (pad, iso, json.dumps(rec, separators=(",", ":")), comma))
        changed += 1
    text = "\n".join(out)
    # keep the header honest about the new field
    if '// t = FLAGLE tile' not in text:
        text = text.replace(
            "window.AD_FLAGS = {",
            "// t = FLAGLE tile information rank, one per tile of the 3x2 grid\n"
            "// (0,1,2 top row left-to-right; 3,4,5 bottom row), ascending: 0 is the\n"
            "// tile that gives away least. MEASURED off the rendered SVG by\n"
            "// _build/gen_flag_tiles.py (edge energy + colour count + how few other\n"
            "// flags look like it there). Equal ranks mean genuinely equal tiles, and\n"
            "// FLAGLE breaks those with the day's seeded shuffle.\n"
            "window.AD_FLAGS = {", 1)
    open(FLAGS_JS, "w", encoding="utf-8").write(text)
    print("wrote %s (%d entries, %d bytes)" % (FLAGS_JS, changed, len(text)))


if __name__ == "__main__":
    main()
