#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Stage 2 of the flags dataset: minify every raw SVG and build core/data/flags.js.

Input   : _build/flags-raw/XX.svg   (downloaded by _build/fetch_flags.py from flagcdn.com)
Output  : core/data/flags/XX.svg    (minified, viewBox-normalised, id-namespaced)
          core/data/flags.js        (window.AD_FLAGS index)

Deterministic + re-runnable: no network access, pure function of flags-raw/.

MINIFIER — only transformations that cannot change rendering:
  * strips XML declaration / DOCTYPE / comments / <metadata> / <title> / <desc>,
    version=, xml:space= and font-* (font-* only when the file has no text element)
  * collapses inter-tag and intra-attribute whitespace
  * rounds numbers inside d="" and points="" to the LOWEST precision that keeps every
    re-computed path endpoint within DRIFT_TOL of its original position (relative path
    commands accumulate rounding error, so the drift is measured, not assumed)
  * compacts path separators with unambiguous rules only
  * lowercases hex colours, shortens #aabbcc -> #abc when the pairs repeat
  * namespaces every id / url(#id) / href="#id" with the ISO2 code and scopes <style>
    rules under the root's own id, so many flags can be inlined into one DOM safely
  * guarantees a viewBox and removes root width/height so the flag scales freely
  Every output is re-parsed as XML and checked against the input for element count,
  paint-colour multiset and reference integrity.

COLOURS are measured, not guessed. The minified SVG is parsed, transforms composed,
each path split into subpaths; axis-aligned rectangles and circles form a painter-order
stack that is sampled on a 96x64 grid for visible area, other shapes contribute their
shoelace area and strokes their polyline length x width. Each paint is snapped to the
nearest of red/white/blue/green/yellow/black/orange/maroon/cyan/purple; near-equal
weights are ordered hoist-to-fly / top-to-bottom.

FEATURES are a curated table (flag vocabulary is knowledge, not geometry). Every stripe
claim is cross-checked against the sampled band structure; disagreements are either in
the REVIEWED list below (with the reason) or reported as errors.
Vocabulary: horizontal-tricolour vertical-tricolour tricolour bicolour cross saltire
canton crescent star stars sun emblem coat-of-arms animal plant text triangle chevron
diagonal bordered unique-shape.
"""
import json, math, os, re, sys
import xml.etree.ElementTree as ET

BUILD = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BUILD)
RAW = os.path.join(BUILD, "flags-raw")
OUT_DIR = os.path.join(ROOT, "core", "data", "flags")
OUT_JS = os.path.join(ROOT, "core", "data", "flags.js")
HARD_BYTES = 40 * 1024
DRIFT_TOL = 0.0004          # max path-endpoint drift, as a fraction of the flag's long side
GRID_X, GRID_Y = 96, 64     # colour sampling grid

# ─────────────────────────────────────────────────────────────── feature table ──
SH = {
    "ht": "horizontal-tricolour", "vt": "vertical-tricolour", "bi": "bicolour",
    "cr": "cross", "sa": "saltire", "ca": "canton", "cre": "crescent",
    "st": "star", "sts": "stars", "sun": "sun", "em": "emblem",
    "coa": "coat-of-arms", "an": "animal", "pl": "plant", "tx": "text",
    "tri": "triangle", "chv": "chevron", "dia": "diagonal", "bd": "bordered",
    "uq": "unique-shape",
}
# ht/vt mean "the field is three parallel bands of three different colours" — extra
# charges (star, emblem, hoist band or triangle) do not disqualify, extra STRIPES do,
# so fimbriated five-stripe flags (GM, KE, SS, UZ) are deliberately not tricolours.
FEAT = {
    "AD": "vt coa",            "AE": "ht",                "AF": "vt coa pl tx",
    "AG": "sun tri",           "AI": "ca coa an",         "AL": "an em",
    "AM": "ht",                "AO": "bi em st",          "AQ": "em",
    "AR": "sun",               "AS": "tri an em",         "AT": "",
    "AU": "ca sts",            "AW": "st",                "AX": "cr",
    "AZ": "ht cre st",         "BA": "tri sts",           "BB": "em",
    "BD": "sun",               "BE": "vt",                "BF": "bi st",
    "BG": "ht",                "BH": "bi tri",            "BI": "sa sts",
    "BJ": "",                  "BL": "coa",               "BM": "ca coa an",
    "BN": "dia cre em tx",     "BO": "ht coa",            "BQ": "tri st em",
    "BR": "sts em tx",         "BS": "tri",               "BT": "dia an em",
    "BV": "cr",                "BW": "",                  "BY": "bi em",
    "BZ": "coa pl tx",         "CA": "pl em",             "CC": "pl cre sts",
    "CD": "dia st",            "CF": "st",                "CG": "dia",
    "CH": "cr",                "CI": "vt",                "CK": "ca sts",
    "CL": "ca st",             "CM": "vt st",             "CN": "sts",
    "CO": "ht",                "CR": "coa",               "CU": "tri st",
    "CV": "sts",               "CW": "sts",               "CX": "dia sts an em",
    "CY": "em pl",             "CZ": "bi tri",            "DE": "ht",
    "DJ": "tri st",            "DK": "cr",                "DM": "cr an sts",
    "DO": "cr coa pl",         "DZ": "bi cre st",         "EC": "ht coa an",
    "EE": "ht",                "EG": "ht an em",          "EH": "ht tri cre st",
    "ER": "tri pl em",         "ES": "coa",               "ET": "ht st em",
    "FI": "cr",                "FJ": "ca coa",            "FK": "ca coa an",
    "FM": "sts",               "FO": "cr",                "FR": "vt",
    "GA": "ht",                "GB": "cr sa",             "GD": "bd sts tri pl",
    "GE": "cr",                "GF": "dia st",            "GG": "cr",
    "GH": "ht st",             "GI": "bi coa",            "GL": "bi em",
    "GM": "",                  "GN": "vt",                "GP": "pl sun em",
    "GQ": "ht tri coa pl sts", "GR": "cr ca",             "GS": "ca coa an",
    "GT": "coa an pl",         "GU": "bd em tx pl",       "GW": "st",
    "GY": "tri",               "HK": "pl em",             "HM": "ca sts",
    "HN": "sts",               "HR": "ht coa",            "HT": "bi coa pl tx",
    "HU": "ht",                "ID": "bi",                "IE": "vt",
    "IL": "st em",             "IM": "em",                "IN": "ht em",
    "IO": "ca pl em",          "IQ": "ht tx",             "IR": "ht em tx",
    "IS": "cr",                "IT": "vt",                "JE": "sa coa",
    "JM": "sa",                "JO": "ht tri st",         "JP": "sun",
    "KE": "em",                "KG": "sun em",            "KH": "em",
    "KI": "an sun",            "KM": "tri cre sts",       "KN": "dia sts",
    "KP": "st",                "KR": "em",                "KW": "ht",
    "KY": "ca coa an",         "KZ": "sun an em",         "LA": "em",
    "LB": "pl em",             "LC": "tri",               "LI": "bi em",
    "LK": "an pl bd em",       "LR": "ca st",             "LS": "ht em",
    "LT": "ht",                "LU": "ht",                "LV": "",
    "LY": "ht cre st",         "MA": "st em",             "MC": "bi",
    "MD": "vt coa an",         "ME": "bd coa an",         "MF": "vt",
    "MG": "",                  "MH": "dia st",            "MK": "sun",
    "ML": "vt",                "MM": "ht st",             "MN": "em",
    "MO": "pl sts em",         "MP": "st em pl",          "MQ": "tri",
    "MR": "cre st",            "MS": "ca coa",            "MT": "bi em",
    "MU": "",                  "MV": "cre",               "MW": "ht sun",
    "MX": "vt coa an pl",      "MY": "ca cre st",         "MZ": "tri st em",
    "NA": "dia sun",           "NC": "ht em",             "NE": "ht sun",
    "NF": "pl",                "NG": "",                  "NI": "coa",
    "NL": "ht",                "NO": "cr",                "NP": "uq bd sun cre",
    "NR": "st",                "NU": "ca sts",            "NZ": "ca sts",
    "OM": "ht em",             "PA": "sts",               "PE": "",
    "PF": "em",                "PG": "dia sts an",        "PH": "tri sun sts",
    "PK": "cre st",            "PL": "bi",                "PM": "coa em",
    "PN": "ca coa",            "PR": "tri st",            "PS": "ht tri",
    "PT": "bi coa em",         "PW": "em",                "PY": "ht coa",
    "QA": "bi tri",            "RE": "tri sun",           "RO": "vt",
    "RS": "ht coa an",         "RU": "ht",                "RW": "ht sun",
    "SA": "tx em",             "SB": "dia sts",           "SC": "dia",
    "SD": "ht tri",            "SE": "cr",                "SG": "bi cre sts",
    "SH": "ca coa an",         "SI": "ht coa",            "SJ": "cr",
    "SK": "ht coa cr",         "SL": "ht",                "SM": "bi coa",
    "SN": "vt st",             "SO": "st",                "SR": "st",
    "SS": "tri st",            "ST": "tri sts",           "SV": "coa",
    "SX": "tri coa",           "SY": "ht sts",            "SZ": "em",
    "TC": "ca coa pl an",      "TD": "vt",                "TF": "ca tx",
    "TG": "ca st",             "TH": "",                  "TJ": "ht sts em",
    "TK": "sts em",            "TL": "tri st",            "TM": "cre sts em pl",
    "TN": "cre st",            "TO": "ca cr",             "TR": "cre st",
    "TT": "dia",               "TV": "ca sts",            "TW": "ca sun",
    "TZ": "dia",               "UA": "bi",                "UG": "an em",
    "UM": "ca sts",            "US": "ca sts",            "UY": "ca sun",
    "UZ": "cre sts",           "VA": "bi coa em",         "VC": "vt em",
    "VE": "ht sts",            "VG": "ca coa",            "VI": "an em tx",
    "VN": "st",                "VU": "tri em pl",         "WF": "ca em",
    "WS": "ca sts",            "XK": "em sts",            "YE": "ht",
    "YT": "coa",               "ZA": "tri",               "ZM": "an",
    "ZW": "tri st an",
}
# Stripe claims the band sampler cannot confirm, each checked by eye against the
# rendered flag. Keeping them is a judgement call, so it is recorded here.
REVIEWED = {
    "BH": "two colours divided by a five-point zigzag, not a straight line",
    "QA": "two colours divided by a nine-point zigzag, not a straight line",
    "GL": "half/half but the counterchanged disc covers the sampling column",
    "HT": "blue/red halves with a central white panel the sampler reads as a band",
    "CO": "three bands of three colours, top band is half the height",
    "EC": "three bands of three colours, top band is half the height",
    "VE": "three bands of three colours, unequal, plus an arc of stars",
    "VC": "three vertical bands of three colours, centre band double width",
    "CZ": "white/red halves with a blue triangle over the hoist half",
    "SG": "red/white halves, crescent and stars sit in the sampled column",
    "LS": "three bands of three colours, centre band double height",
    "TJ": "three bands of three colours, centre band wider",
    "MW": "three equal bands, rising sun sits in the sampled column",
    "AG": "not a stripe claim — sun and triangles only",
}

# ──────────────────────────────────────────────────────────────────── palette ──
PALETTE = [
    ("red",    [(255, 0, 0), (206, 17, 38), (218, 41, 28), (200, 16, 46),
                (213, 0, 50), (239, 25, 35), (220, 0, 0), (237, 65, 53),
                (198, 54, 60), (188, 0, 45)]),
    ("maroon", [(128, 0, 0), (139, 0, 0), (141, 27, 61), (158, 48, 57),
                (122, 20, 40), (102, 0, 0), (113, 63, 42)]),
    ("white",  [(255, 255, 255), (248, 248, 248), (238, 238, 238), (204, 204, 204)]),
    ("black",  [(0, 0, 0), (35, 31, 30), (16, 24, 32), (33, 35, 30), (57, 57, 57)]),
    ("blue",   [(0, 0, 255), (0, 38, 100), (0, 82, 165), (0, 114, 206),
                (0, 158, 219), (135, 206, 235), (23, 23, 150), (0, 53, 173),
                (0, 36, 136), (43, 93, 242), (117, 170, 219)]),
    ("cyan",   [(0, 255, 255), (0, 150, 160), (0, 119, 139), (64, 224, 208)]),
    ("green",  [(0, 128, 0), (0, 155, 58), (0, 106, 78), (30, 181, 58),
                (0, 122, 61), (35, 159, 64), (7, 137, 48), (0, 158, 96)]),
    ("yellow", [(255, 255, 0), (255, 205, 0), (252, 209, 22), (255, 216, 0),
                (254, 221, 0), (234, 206, 36), (246, 228, 190)]),
    ("orange", [(255, 140, 0), (255, 103, 0), (247, 127, 0), (255, 153, 51),
                (243, 112, 33), (239, 145, 0)]),
    ("purple", [(128, 0, 128), (102, 45, 145), (75, 0, 130), (153, 17, 153)]),
]
CSS_NAMED = {
    "red": (255, 0, 0), "gold": (255, 215, 0), "green": (0, 128, 0),
    "maroon": (128, 0, 0), "olive": (128, 128, 0), "purple": (128, 0, 128),
    "white": (255, 255, 255), "black": (0, 0, 0), "blue": (0, 0, 255),
    "yellow": (255, 255, 0), "orange": (255, 165, 0), "silver": (192, 192, 192),
    "gray": (128, 128, 128), "grey": (128, 128, 128), "navy": (0, 0, 128),
    "teal": (0, 128, 128), "aqua": (0, 255, 255), "cyan": (0, 255, 255),
    "lime": (0, 255, 0), "fuchsia": (255, 0, 255), "magenta": (255, 0, 255),
    "crimson": (220, 20, 60), "darkgreen": (0, 100, 0), "darkred": (139, 0, 0),
    "darkblue": (0, 0, 139), "firebrick": (178, 34, 34), "indigo": (75, 0, 130),
    "orangered": (255, 69, 0), "saddlebrown": (139, 69, 19), "sienna": (160, 82, 45),
    "tan": (210, 180, 140), "wheat": (245, 222, 179), "ivory": (255, 255, 240),
    "snow": (255, 250, 250), "azure": (240, 255, 255), "beige": (245, 245, 220),
    "khaki": (240, 230, 140), "brown": (165, 42, 42),
}


def parse_colour(v):
    if v is None:
        return None
    v = v.strip().lower()
    if not v or v in ("none", "transparent", "inherit", "currentcolor"):
        return None
    if v.startswith("#"):
        h = v[1:]
        if len(h) in (3, 4):
            return tuple(int(c * 2, 16) for c in h[:3])
        if len(h) in (6, 8):
            return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
        return None
    m = re.match(r'rgba?\(([^)]*)\)', v)
    if m:
        parts = [p.strip() for p in m.group(1).replace("/", ",").split(",")]
        try:
            out = []
            for p in parts[:3]:
                out.append(int(round(float(p[:-1]) * 2.55)) if p.endswith("%") else int(round(float(p))))
            return tuple(max(0, min(255, c)) for c in out)
        except Exception:
            return None
    return CSS_NAMED.get(v)


def colour_name(rgb):
    best, bestd = None, None
    for name, refs in PALETTE:
        for r in refs:
            d = 2 * (rgb[0] - r[0]) ** 2 + 4 * (rgb[1] - r[1]) ** 2 + 3 * (rgb[2] - r[2]) ** 2
            if bestd is None or d < bestd:
                best, bestd = name, d
    return best


# ────────────────────────────────────────────────────────────── path geometry ──
TOKEN = re.compile(r'([MmZzLlHhVvCcSsQqTtAa])|([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)')
NARGS = {"M": 2, "L": 2, "T": 2, "H": 1, "V": 1, "C": 6, "S": 4, "Q": 4, "A": 7, "Z": 0}


def parse_path(d):
    """-> list of subpaths; each is (points, only_straight_axis_commands)."""
    toks = []
    for m in TOKEN.finditer(d or ""):
        if m.group(1):
            toks.append(m.group(1))
        else:
            try:
                toks.append(float(m.group(2)))
            except ValueError:
                pass
    subs = []
    pts, simple = [], True
    cx = cy = sx = sy = 0.0
    cmd = None
    i, n = 0, len(toks)
    while i < n:
        t = toks[i]
        if isinstance(t, str):
            cmd = t
            i += 1
            if cmd.upper() == "M" and pts:
                subs.append((pts, simple))
                pts, simple = [], True
            if cmd.upper() not in ("M", "L", "H", "V", "Z"):
                simple = False
            if cmd in ("Z", "z"):
                cx, cy = sx, sy
                continue
        if cmd is None:
            i += 1
            continue
        up = cmd.upper()
        k = NARGS[up]
        if k == 0:
            continue
        args = []
        while len(args) < k and i < n and not isinstance(toks[i], str):
            args.append(toks[i]); i += 1
        if len(args) < k:
            break
        rel = cmd.islower()
        if up == "H":
            cx = (cx + args[0]) if rel else args[0]
        elif up == "V":
            cy = (cy + args[0]) if rel else args[0]
        elif up == "A":
            cx = (cx + args[5]) if rel else args[5]
            cy = (cy + args[6]) if rel else args[6]
        else:
            ex, ey = args[k - 2], args[k - 1]
            cx = (cx + ex) if rel else ex
            cy = (cy + ey) if rel else ey
        if up == "M":
            sx, sy = cx, cy
            cmd = "L" if cmd == "M" else "l"
        pts.append((cx, cy))
    if pts:
        subs.append((pts, simple))
    return subs


def is_rect(pts, simple):
    """True only for a single closed axis-aligned rectangle."""
    if not simple or not (4 <= len(pts) <= 6):
        return False
    q = [(round(p[0], 4), round(p[1], 4)) for p in pts]
    while len(q) > 4 and q[-1] == q[0]:
        q.pop()
    if len(q) != 4:
        return False
    if len({p[0] for p in q}) != 2 or len({p[1] for p in q}) != 2:
        return False
    for a, b in zip(q, q[1:] + q[:1]):
        if not (abs(a[0] - b[0]) < 1e-9 or abs(a[1] - b[1]) < 1e-9):
            return False   # a diagonal edge: not a rectangle
        if a == b:
            return False
    return True


def shoelace(pts):
    a = 0.0
    for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]):
        a += x1 * y2 - x2 * y1
    return abs(a) / 2.0


def polylen(pts):
    return sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, pts[1:]))


# ───────────────────────────────────────────────────────────────── transforms ──
IDENT = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def mat_mul(a, b):
    return (a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
            a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
            a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5])


def parse_transform(s):
    m = IDENT
    if not s:
        return m
    for name, argstr in re.findall(r'(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)', s):
        a = [float(x) for x in re.findall(r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?', argstr)]
        if name == "matrix" and len(a) >= 6:
            t = tuple(a[:6])
        elif name == "translate":
            t = (1, 0, 0, 1, a[0] if a else 0, a[1] if len(a) > 1 else 0)
        elif name == "scale":
            sxx = a[0] if a else 1
            t = (sxx, 0, 0, a[1] if len(a) > 1 else sxx, 0, 0)
        elif name == "rotate":
            ang = math.radians(a[0] if a else 0)
            c, s2 = math.cos(ang), math.sin(ang)
            t = (c, s2, -s2, c, 0, 0)
            if len(a) >= 3:
                t = mat_mul(mat_mul((1, 0, 0, 1, a[1], a[2]), t), (1, 0, 0, 1, -a[1], -a[2]))
        elif name == "skewX":
            t = (1, 0, math.tan(math.radians(a[0] if a else 0)), 1, 0, 0)
        else:
            t = (1, math.tan(math.radians(a[0] if a else 0)), 0, 1, 0, 0)
        m = mat_mul(m, t)
    return m


def apply(m, p):
    return (m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5])


# ─────────────────────────────────────────────────────────────────── minifier ──
CMDCHARS = "MmZzLlHhVvCcSsQqTtAa"
NUMRE = re.compile(r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?')


def num_fmt(v, dec):
    s = "%.*f" % (dec, v)
    if "." in s:
        s = s.rstrip("0").rstrip(".")
    if s in ("-0", "", "+"):
        s = "0"
    if s.startswith("0."):
        s = s[1:]
    elif s.startswith("-0."):
        s = "-" + s[2:]
    return s


def compact_pathdata(d, dec):
    out = NUMRE.sub(lambda m: num_fmt(float(m.group(0)), dec), d)
    out = re.sub(r'[\s,]+', ' ', out).strip()
    out = re.sub(r'\s*([' + CMDCHARS + r'])\s*', r'\1', out)
    out = re.sub(r'(\d|\.)\s+-', r'\1-', out)
    return out


def endpoints(d):
    return [p for pts, _ in parse_path(d) for p in pts]


def split_root(svg):
    i, n, q = 1, len(svg), None
    while i < n:
        c = svg[i]
        if q:
            if c == q:
                q = None
        elif c in "\"'":
            q = c
        elif c == ">":
            break
        i += 1
    head, rest = svg[:i], svg[i + 1:]
    attrs = []
    for m in re.finditer(r'([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"'
                         r'|([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*\'([^\']*)\'', head[4:]):
        attrs.append((m.group(1), m.group(2)) if m.group(1) else (m.group(3), m.group(4)))
    return attrs, rest


def hexfix(m):
    h = m.group(1).lower()
    if len(h) == 6 and h[0] == h[1] and h[2] == h[3] and h[4] == h[5]:
        h = h[0] + h[2] + h[4]
    return "#" + h


HEXRE = re.compile(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')
PAINTRE = re.compile(r'(?:fill|stroke|stop-color)\s*[=:]\s*["\']?\s*([^"\';>}]+)')


def paint_multiset(s):
    out = {}
    for v in PAINTRE.findall(s):
        v = v.strip().lower()
        c = parse_colour(v)
        if c:
            out[c] = out.get(c, 0) + 1
    return out


def minify(code, s):
    warn = []
    orig = s
    s = re.sub(r'<\?xml[^>]*\?>', '', s)
    s = re.sub(r'<!DOCTYPE.*?>', '', s, flags=re.S | re.I)
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    for tag in ("metadata", "title", "desc"):
        s = re.sub(r'<%s\b[^>]*/>' % tag, '', s, flags=re.I)
        s = re.sub(r'<%s\b.*?</%s\s*>' % (tag, tag), '', s, flags=re.S | re.I)
    has_text = bool(re.search(r'<(text|tspan|textPath|flowRoot)\b', s))

    styles = []

    def grab(m):
        styles.append(m.group(1))
        return '<style>\x00%d\x00</style>' % (len(styles) - 1)
    s = re.sub(r'<style[^>]*>(.*?)</style\s*>', grab, s, flags=re.S)

    s = re.sub(r'>\s+<', '><', s)
    s = re.sub(r'\s*\n\s*', ' ', s)
    s = re.sub(r'\s{2,}', ' ', s)
    s = re.sub(r'\s+(/?>)', r'\1', s)
    s = re.sub(r'\s(?:version|xml:space|xmlns:svg|xmlns:dc|xmlns:cc|xmlns:rdf)="[^"]*"', '', s)
    if not has_text:
        s = re.sub(r'\s(?:font-family|font-weight|font-size|font-style|letter-spacing'
                   r'|word-spacing|text-anchor)="[^"]*"', '', s)

    attrs, rest = split_root(s)
    amap = {k: v for k, v in attrs}

    vb, nums = amap.get("viewBox"), None
    if vb:
        nums = [float(x) for x in NUMRE.findall(vb)]
        if len(nums) != 4 or nums[2] <= 0 or nums[3] <= 0:
            warn.append("bad viewBox %r" % vb)
            vb = None
    if not vb:
        def dim(k):
            m = re.match(r'\s*([-+]?[\d.]+)\s*(px)?\s*$', amap.get(k, ""))
            return float(m.group(1)) if m else None
        w, h = dim("width"), dim("height")
        if not (w and h and w > 0 and h > 0):
            return None, None, ["no viewBox and no usable width/height"], {}
        nums = [0.0, 0.0, w, h]
        vb = "0 0 %s %s" % (num_fmt(w, 3), num_fmt(h, 3))
    vbw, vbh = nums[2], nums[3]

    # ── choose the coarsest numeric precision whose measured drift is invisible ──
    fields = re.findall(r'\s(?:d|points)="([^"]*)"', rest)
    tol = DRIFT_TOL * max(vbw, vbh)
    base = [(f, endpoints(f)) for f in fields]
    dec, drift = 4, 0.0
    for cand in range(0, 5):
        worst, ok = 0.0, True
        for f, eps in base:
            got = endpoints(compact_pathdata(f, cand))
            if len(got) != len(eps):
                ok = False
                break
            for a, b in zip(eps, got):
                dd = math.hypot(a[0] - b[0], a[1] - b[1])
                if dd > worst:
                    worst = dd
            if worst > tol:
                ok = False
                break
        if ok:
            dec, drift = cand, worst
            break
    rest = re.sub(r'\s(d|points)="([^"]*)"',
                  lambda m: ' %s="%s"' % (m.group(1), compact_pathdata(m.group(2), dec)), rest)

    rest = HEXRE.sub(hexfix, rest)
    styles = [HEXRE.sub(hexfix, st) for st in styles]

    # ── namespace ids, scope css ──
    pfx = code.lower() + "-"
    ids = set(re.findall(r'\sid="([^"]+)"', rest))
    refs_before = len(re.findall(r'url\(\s*#([^)\s]+)\s*\)', rest)) + \
        len(re.findall(r'(?:xlink:)?href="#([^"]+)"', rest))
    if ids:
        rest = re.sub(r'\sid="([^"]+)"', lambda m: ' id="%s%s"' % (pfx, m.group(1)), rest)
        rest = re.sub(r'url\(\s*#([^)\s]+)\s*\)',
                      lambda m: "url(#%s%s)" % (pfx, m.group(1)) if m.group(1) in ids else m.group(0), rest)
        rest = re.sub(r'(xlink:)?href="#([^"]+)"',
                      lambda m: '%shref="#%s%s"' % (m.group(1) or "", pfx, m.group(2))
                      if m.group(2) in ids else m.group(0), rest)
        styles = [re.sub(r'url\(\s*#([^)\s]+)\s*\)',
                         lambda m: "url(#%s%s)" % (pfx, m.group(1)) if m.group(1) in ids else m.group(0), st)
                  for st in styles]
    rootid = "fl-" + code.lower()
    if styles:
        scoped = []
        for st in styles:
            st = re.sub(r'\s+', ' ', st).strip()
            st = re.sub(r'([^{}]+)\{', lambda m: ",".join(
                "#%s %s" % (rootid, sel.strip()) for sel in m.group(1).split(",") if sel.strip()) + "{", st)
            scoped.append(st)
        styles = scoped

    head = '<svg xmlns="http://www.w3.org/2000/svg"'
    if "xlink:" in rest:
        head += ' xmlns:xlink="http://www.w3.org/1999/xlink"'
    if styles:
        head += ' id="%s"' % rootid
    seen = set()
    for k, v in attrs:
        if k in ("width", "height", "viewBox", "id", "xmlns", "xmlns:xlink") or k in seen:
            continue
        seen.add(k)
        head += ' %s="%s"' % (k, v)
    doc = head + ' viewBox="%s">' % re.sub(r'\s+', ' ', vb.strip()) + rest
    doc = re.sub(r'\x00(\d+)\x00', lambda m: styles[int(m.group(1))], doc)
    doc = doc.replace("<style></style>", "")

    # ── validation against the input ──
    try:
        troot = ET.fromstring(doc)
    except Exception as e:
        return None, None, ["minified output does not parse: %s" % e], {}
    ids_after = set(re.findall(r'\sid="([^"]+)"', doc))
    refs = set(re.findall(r'url\(\s*#([^)\s]+)\s*\)', doc)) | \
        set(re.findall(r'(?:xlink:)?href="#([^"]+)"', doc))
    dangling = sorted(r for r in refs if r not in ids_after)
    if dangling:
        warn.append("dangling id refs: %s" % ",".join(dangling[:5]))
    if len(re.findall(r'url\(\s*#([^)\s]+)\s*\)', doc)) + \
            len(re.findall(r'(?:xlink:)?href="#([^"]+)"', doc)) != refs_before:
        warn.append("reference count changed")
    if troot.get("width") or troot.get("height"):
        warn.append("root still has width/height")
    if not troot.get("viewBox"):
        warn.append("root lost viewBox")
    try:
        oroot = ET.fromstring(orig)
        oc, nc = {}, {}
        for el in oroot.iter():
            t = el.tag.split("}")[-1]
            if t not in ("metadata", "title", "desc"):
                oc[t] = oc.get(t, 0) + 1
        for el in troot.iter():
            t = el.tag.split("}")[-1]
            nc[t] = nc.get(t, 0) + 1
        if oc != nc:
            warn.append("element census changed: %s -> %s" % (oc, nc))
    except Exception as e:
        warn.append("original will not parse: %s" % e)
    a, b = paint_multiset(orig), paint_multiset(doc)
    if a != b:
        diff = {k: (a.get(k), b.get(k)) for k in set(a) | set(b) if a.get(k) != b.get(k)}
        warn.append("paint multiset changed: %s" % diff)
    return doc, (vbw, vbh, nums[0], nums[1]), warn, {"dec": dec, "drift": drift, "tol": tol}


# ───────────────────────────────────────────────── colour + band measurement ──
SHAPES = ("path", "rect", "circle", "ellipse", "polygon", "polyline", "line")
SKIP = ("defs", "clippath", "mask", "symbol", "marker", "pattern",
        "lineargradient", "radialgradient", "filter", "style", "metadata")
PROPS = ("fill", "stroke", "stroke-width", "opacity", "fill-opacity",
         "stroke-opacity", "color")


def ln(tag):
    return tag.split("}")[-1]


def css_rules(root):
    rules = {}
    for el in root.iter():
        if ln(el.tag) != "style":
            continue
        for m in re.finditer(r'([^{}]+)\{([^}]*)\}', "".join(el.itertext())):
            decls = {}
            for dm in re.finditer(r'([-a-zA-Z]+)\s*:\s*([^;]+)', m.group(2)):
                decls[dm.group(1).strip()] = dm.group(2).strip()
            for sel in m.group(1).split(","):
                cm = re.search(r'\.([A-Za-z0-9_-]+)\s*$', sel.strip())
                if cm:
                    rules.setdefault(cm.group(1), {}).update(decls)
    return rules


def resolve_props(el, inherited, rules):
    p = dict(inherited)
    for c in (el.get("class") or "").split():
        p.update({k: v for k, v in rules.get(c, {}).items() if k in PROPS})
    for k in PROPS:
        v = el.get(k)
        if v is not None:
            p[k] = v
    st = el.get("style")
    if st:
        for dm in re.finditer(r'([-a-zA-Z]+)\s*:\s*([^;]+)', st):
            if dm.group(1) in PROPS:
                p[dm.group(1)] = dm.group(2).strip()
    return p


def fnum(v, dflt=0.0):
    try:
        return float(re.match(r'\s*([-+]?[\d.eE+-]+)', str(v)).group(1))
    except Exception:
        return dflt


def measure(doc, vbw, vbh, vbx, vby):
    root = ET.fromstring(doc)
    rules = css_rules(root)
    byid = {el.get("id"): el for el in root.iter() if el.get("id")}
    items, blobs = [], []          # painter stack / non-flat paint contributions
    flag_area = vbw * vbh

    def parts_of(el, m):
        """-> list of (bbox, kind, area, length); kind in 'rect'|'disc'|'blob'"""
        name = ln(el.tag)
        raw = []
        if name == "path":
            for pts, simple in parse_path(el.get("d")):
                raw.append((pts, is_rect(pts, simple), None))
        elif name == "rect":
            x, y = fnum(el.get("x", 0)), fnum(el.get("y", 0))
            w, h = fnum(el.get("width", 0)), fnum(el.get("height", 0))
            raw.append(([(x, y), (x + w, y), (x + w, y + h), (x, y + h)],
                        not (el.get("rx") or el.get("ry")), None))
        elif name in ("circle", "ellipse"):
            cx, cy = fnum(el.get("cx", 0)), fnum(el.get("cy", 0))
            rx = ry = fnum(el.get("r", 0))
            if name == "ellipse":
                rx, ry = fnum(el.get("rx", 0)), fnum(el.get("ry", 0))
            raw.append(([(cx - rx, cy - ry), (cx + rx, cy - ry), (cx + rx, cy + ry), (cx - rx, cy + ry)],
                        False, "ell"))
        elif name in ("polygon", "polyline"):
            nn = [float(x) for x in NUMRE.findall(el.get("points", ""))]
            raw.append((list(zip(nn[0::2], nn[1::2])), False, None))
        elif name == "line":
            raw.append(([(fnum(el.get("x1", 0)), fnum(el.get("y1", 0))),
                         (fnum(el.get("x2", 0)), fnum(el.get("y2", 0)))], False, None))
        axis = abs(m[1]) < 1e-6 and abs(m[2]) < 1e-6
        out = []
        for pts, rectish, special in raw:
            if not pts:
                continue
            tp = [apply(m, p) for p in pts]
            x0 = min(q[0] for q in tp); x1 = max(q[0] for q in tp)
            y0 = min(q[1] for q in tp); y1 = max(q[1] for q in tp)
            bb = (x0, y0, x1, y1)
            if special == "ell" and axis:
                kind = "disc" if abs((x1 - x0) - (y1 - y0)) < 1e-6 else "blob"
                area = math.pi * (x1 - x0) * (y1 - y0) / 4.0
            elif rectish and axis:
                kind, area = "rect", (x1 - x0) * (y1 - y0)
            else:
                kind = "blob"
                area = min(shoelace(tp) * 1.12, (x1 - x0) * (y1 - y0))
            out.append((bb, kind, area, polylen(tp)))
        return out

    def emit(el, props, m):
        op = fnum(props.get("opacity", 1), 1.0)
        fo = fnum(props.get("fill-opacity", 1), 1.0) * op
        so = fnum(props.get("stroke-opacity", 1), 1.0) * op
        fill = props.get("fill")
        rgb = (0, 0, 0) if fill is None else parse_colour(fill)
        if fill is not None and fill.strip().lower() == "currentcolor":
            rgb = parse_colour(props.get("color"))
        srgb = parse_colour(props.get("stroke"))
        if not rgb and not srgb:
            return
        sw = fnum(props.get("stroke-width", 1), 1.0) * math.sqrt(abs(m[0] * m[3] - m[1] * m[2]) or 1.0)
        for (x0, y0, x1, y1), kind, area, length in parts_of(el, m):
            if rgb and fo >= 0.35:
                if kind == "rect" and x1 > x0 and y1 > y0:
                    items.append(("rect", x0, y0, x1, y1, rgb))
                elif kind == "disc":
                    items.append(("disc", (x0 + x1) / 2.0, (y0 + y1) / 2.0, (x1 - x0) / 2.0, rgb))
                elif area > 0:
                    blobs.append((rgb, min(area, flag_area), (x0 + x1) / 2.0, (y0 + y1) / 2.0))
            if srgb and so >= 0.35 and length > 0:
                blobs.append((srgb, min(length * sw, 0.9 * flag_area), (x0 + x1) / 2.0, (y0 + y1) / 2.0))

    def walk(el, inh, m, depth):
        if depth > 40:
            return
        for ch in el:
            nm = ln(ch.tag).lower()
            if nm in SKIP:
                continue
            props = resolve_props(ch, inh, rules)
            mm = mat_mul(m, parse_transform(ch.get("transform")))
            if nm in ("g", "a", "svg"):
                walk(ch, props, mm, depth + 1)
            elif nm == "use":
                href = ch.get("{http://www.w3.org/1999/xlink}href") or ch.get("href") or ""
                tgt = byid.get(href[1:]) if href.startswith("#") else None
                if tgt is None:
                    continue
                mm2 = mat_mul(mm, (1, 0, 0, 1, fnum(ch.get("x", 0)), fnum(ch.get("y", 0))))
                mm2 = mat_mul(mm2, parse_transform(tgt.get("transform")))
                if ln(tgt.tag).lower() in ("g", "svg", "symbol"):
                    walk(tgt, props, mm2, depth + 1)
                else:
                    emit(tgt, resolve_props(tgt, props, rules), mm2)
            elif nm in SHAPES:
                emit(ch, props, mm)
            else:
                walk(ch, props, mm, depth + 1)

    walk(root, {}, parse_transform(root.get("transform")), 0)

    counts, first = {}, {}
    grid = []
    for j in range(GRID_Y):
        y = vby + vbh * (j + 0.5) / GRID_Y
        row = []
        for i in range(GRID_X):
            x = vbx + vbw * (i + 0.5) / GRID_X
            top = None
            for it in items:
                if it[0] == "rect":
                    if it[1] <= x <= it[3] and it[2] <= y <= it[4]:
                        top = it[5]
                elif (x - it[1]) ** 2 + (y - it[2]) ** 2 <= it[3] ** 2:
                    top = it[4]
            row.append(top)
            if top:
                counts[top] = counts.get(top, 0) + 1
                if top not in first:
                    first[top] = j * GRID_X + i
        grid.append(row)
    cell = flag_area / float(GRID_X * GRID_Y)
    weights = {rgb: c * cell for rgb, c in counts.items()}
    for rgb, w, cx, cy in blobs:
        weights[rgb] = weights.get(rgb, 0.0) + w
        pos = int(min(GRID_Y - 1, max(0, (cy - vby) / vbh * GRID_Y))) * GRID_X + \
            int(min(GRID_X - 1, max(0, (cx - vbx) / vbw * GRID_X)))
        first[rgb] = min(first.get(rgb, 10 ** 9), pos)
    return weights, first, grid, flag_area


def rank_colours(weights, first, area):
    """names ordered by weight, near-equal weights ordered hoist->fly / top->bottom."""
    named, pos = {}, {}
    for rgb, w in weights.items():
        n = colour_name(rgb)
        named[n] = named.get(n, 0.0) + w
        pos[n] = min(pos.get(n, 10 ** 9), first.get(rgb, 10 ** 9))
    ordered = sorted(named.items(), key=lambda kv: -kv[1])
    out, group = [], []
    for name, w in ordered:
        if group and group[0][1] <= w * 1.28:
            group.append((name, w))
        else:
            out.extend(sorted(group, key=lambda t: pos[t[0]]))
            group = [(name, w)]
    out.extend(sorted(group, key=lambda t: pos[t[0]]))
    keep = [n for n, w in out if w >= 0.02 * area][:5]
    if len(keep) < 2:
        keep = [n for n, _ in out[:2]]
    return keep


def bands(grid, axis):
    NY, NX = len(grid), len(grid[0])
    if axis == "h":
        lines = [[grid[j][int(NX * f)] for j in range(NY)] for f in (0.45, 0.9)]
    else:
        lines = [[grid[int(NY * f)][i] for i in range(NX)] for f in (0.45, 0.9)]
    runs = []
    for line in lines:
        r = []
        for v in line:
            if r and r[-1][0] == v:
                r[-1][1] += 1
            else:
                r.append([v, 1])
        runs.append([(v, n / float(len(line))) for v, n in r])
    return runs[0] if runs[0] == runs[1] else None


def structure(grid):
    out = set()
    for key, b in (("ht", bands(grid, "h")), ("vt", bands(grid, "v"))):
        if not b or any(c is None for c, _ in b):
            continue
        if len(b) == 3 and len({c for c, _ in b}) == 3 and all(f >= 0.15 for _, f in b):
            out.add(key)
        if len(b) == 2 and len({c for c, _ in b}) == 2 and all(f >= 0.25 for _, f in b):
            out.add("bi")
    return out


# ──────────────────────────────────────────────────────────────────────  main ──
def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    codes = sorted(f[:-4] for f in os.listdir(RAW) if f.endswith(".svg"))
    index, problems, mismatch, noted, total, rawtotal = {}, [], [], [], 0, 0
    decs, drifts = {}, []
    for code in codes:
        raw = open(os.path.join(RAW, code + ".svg"), "r", encoding="utf-8").read()
        doc, vbinfo, warn, info = minify(code, raw)
        if doc is None:
            problems.append((code, "; ".join(warn)))
            continue
        vbw, vbh, vbx, vby = vbinfo
        decs[code] = info["dec"]
        if info["tol"]:
            drifts.append(info["drift"] / info["tol"])
        try:
            weights, first, grid, area = measure(doc, vbw, vbh, vbx, vby)
        except Exception as e:
            problems.append((code, "measure failed: %s" % e))
            weights, first, grid, area = {}, {}, [[None]], vbw * vbh
        colours = rank_colours(weights, first, area)

        tags = []
        for sh in (FEAT.get(code, "") or "").split():
            if sh not in SH:
                problems.append((code, "unknown feature shorthand %r" % sh))
                continue
            tags.append(SH[sh])
        if "horizontal-tricolour" in tags or "vertical-tricolour" in tags:
            tags.append("tricolour")
        seen, feats = set(), []
        for t in tags:
            if t not in seen:
                seen.add(t); feats.append(t)

        st = structure(grid)
        cmap = {"horizontal-tricolour": "ht", "vertical-tricolour": "vt", "bicolour": "bi"}
        for c, k in cmap.items():
            if c in feats and k not in st:
                (noted if code in REVIEWED else mismatch).append(
                    "%s claims %s, sampler sees %s%s" % (code, c, sorted(st) or "no clean bands",
                                                         " — " + REVIEWED[code] if code in REVIEWED else ""))
            if k in st and c not in feats and not (k == "bi" and {"ht", "vt"} & {cmap[f] for f in feats if f in cmap}):
                (noted if code in REVIEWED else mismatch).append(
                    "%s sampler sees %s, table omits it" % (code, c))

        with open(os.path.join(OUT_DIR, code + ".svg"), "w", encoding="utf-8") as f:
            f.write(doc)
        nbytes = len(doc.encode("utf-8"))
        total += nbytes
        rawtotal += len(raw.encode("utf-8"))
        index[code] = {"file": code + ".svg", "ar": round(vbw / vbh, 4), "bytes": nbytes,
                       "hard": 1 if nbytes > HARD_BYTES else 0,
                       "colours": colours, "features": feats}
        if warn:
            problems.append((code, "; ".join(warn)))

    lines = ['  "%s": %s' % (c, json.dumps(index[c], separators=(",", ":"))) for c in sorted(index)]
    js = (
        "// core/data/flags.js — flag index for MIDNIGHT ARCADE.\n"
        "// Source: flagcdn.com SVG flags (public domain), one file per ISO 3166-1 alpha-2\n"
        "// code listed in _build/countries-full.json (mledoze/countries).\n"
        "// Generated by _build/fetch_flags.py + _build/gen_flags.py — do not hand-edit.\n"
        "// Per country: file (lives in core/data/flags/), ar = viewBox aspect ratio (w/h),\n"
        "// bytes = minified SVG size, hard = 1 when the file is over 40 KB (a busy seal or\n"
        "// emblem whose detail is lost at small sizes), colours = dominant colour names\n"
        "// measured from the SVG paint stack, most prominent first, features = curated\n"
        "// design tags. Feature vocabulary: horizontal-tricolour, vertical-tricolour,\n"
        "// tricolour, bicolour, cross, saltire, canton, crescent, star, stars, sun,\n"
        "// emblem, coat-of-arms, animal, plant, text, triangle, chevron, diagonal,\n"
        "// bordered, unique-shape. Tags are deliberately incomplete where the reading is\n"
        "// arguable — a missing tag never means \"definitely not\".\n"
        "// Each SVG has its ids namespaced (XX-) and its <style> rules scoped to the root\n"
        "// id (#fl-xx), so several flags can be inlined into one document safely.\n"
        "window.AD_FLAGS = {\n" + ",\n".join(lines) + "\n};\n"
    )
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write(js)

    # ───────────────────────────────────────────────────────────── self check ──
    print("=" * 78)
    print("flags written : %d / %d codes" % (len(index), len(codes)))
    print("flags.js      : %d bytes" % len(js.encode("utf-8")))
    print("svg total     : %.1f KB (raw %.1f KB -> %.1f%%), avg %.1f KB"
          % (total / 1024.0, rawtotal / 1024.0, 100.0 * total / rawtotal, total / 1024.0 / max(1, len(index))))
    big = sorted(index.items(), key=lambda kv: -kv[1]["bytes"])[:10]
    print("10 largest    : " + ", ".join("%s %.0fKB" % (c, d["bytes"] / 1024.0) for c, d in big))
    hard = sorted(c for c, d in index.items() if d["hard"])
    print("hard=1 (>40KB): %d -> %s" % (len(hard), ",".join(hard)))
    print("over 300KB    : %s" % ([c for c, d in index.items() if d["bytes"] > 300 * 1024] or "none"))
    print("precision     : dec histogram %s, worst drift %.1f%% of tolerance"
          % (sorted({d: list(decs.values()).count(d) for d in set(decs.values())}.items()),
             100.0 * max(drifts or [0])))
    bad = []
    for c in sorted(index):
        p = os.path.join(OUT_DIR, c + ".svg")
        try:
            if os.path.getsize(p) < 40:
                bad.append(c + ":tiny")
            r = ET.parse(p).getroot()
            if not r.tag.endswith("svg") or not r.get("viewBox") or r.get("width") or r.get("height"):
                bad.append(c + ":root")
        except Exception as e:
            bad.append("%s:%s" % (c, e))
    print("xml re-parse  : %d/%d ok%s" % (len(index) - len(bad), len(index),
                                          "" if not bad else "  BAD: " + ",".join(bad)))
    files = os.listdir(OUT_DIR)
    print("flags/ dir    : %d files, %.1f KB"
          % (len(files), sum(os.path.getsize(os.path.join(OUT_DIR, f)) for f in files) / 1024.0))
    print("no features   : %s" % ",".join(sorted(c for c, d in index.items() if not d["features"])))
    print("colour counts : %s" % sorted(
        {n: sum(1 for d in index.values() if n in d["colours"]) for d in index.values()
         for n in d["colours"]}.items(), key=lambda kv: -kv[1]))
    print("feature counts: %s" % sorted(
        {n: sum(1 for d in index.values() if n in d["features"]) for d in index.values()
         for n in d["features"]}.items(), key=lambda kv: -kv[1]))
    print("spot checks   :")
    for c in ("IR", "GB", "US", "NP", "CH", "VA", "FR", "JP", "BR", "MX", "ZA", "TJ", "GM", "KE"):
        if c in index:
            d = index[c]
            print("   %-3s ar=%-7s %7s  %-38s %s"
                  % (c, d["ar"], "%.1fKB" % (d["bytes"] / 1024.0),
                     ",".join(d["colours"]), ",".join(d["features"])))
    if noted:
        print("stripe cross-check, reviewed exceptions (%d):" % len(noted))
        for m in noted:
            print("   . " + m)
    if mismatch:
        print("stripe cross-check, UNRESOLVED (%d):" % len(mismatch))
        for m in mismatch:
            print("   ! " + m)
    else:
        print("stripe cross-check: no unresolved disagreements")
    if problems:
        print("problems (%d):" % len(problems))
        for c, w in problems:
            print("   ? %s: %s" % (c, w))
    else:
        print("problems: none")
    print("=" * 78)
    return 0


if __name__ == "__main__":
    sys.exit(main())
