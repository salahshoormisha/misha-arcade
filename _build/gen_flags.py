#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Stage 2 of the flags dataset: minify every raw SVG and build core/data/flags.js.

Input   : _build/flags-raw/XX.svg   (downloaded by _build/fetch_flags.py from flagcdn.com)
Output  : core/data/flags/XX.svg    (minified, viewBox-normalised, id-namespaced)
          core/data/flags.js        (window.AD_FLAGS index)

Deterministic + re-runnable: no network access, pure function of flags-raw/.

WHAT THE MINIFIER DOES (never anything that can change rendering):
  * strips XML declaration / DOCTYPE / comments / <metadata> / <title> / <desc>
  * strips version=, xml:space= and font-* (only when the file has no <text>/<tspan>)
  * collapses inter-tag and intra-attribute whitespace
  * rounds numbers inside d="" and points="" to a precision scaled to the viewBox
    (absolute error <= viewBox width / 20000, i.e. far below one device pixel)
  * compacts path separators using only unambiguous rules
  * lowercases hex colours and shortens #aabbcc -> #abc when the pairs repeat
  * namespaces every id / url(#id) / href="#id" with the ISO2 code, and scopes any
    <style> rules under the root's own id, so several flags can be inlined into one
    DOM without id or class collisions
  * guarantees a viewBox and removes root width/height so the flag scales freely

COLOURS are measured, not guessed: the minified SVG is parsed, transforms are
composed, then a 64x48 grid is sampled through the painter-order stack of
axis-aligned rectangles and discs to get visible area per colour; emblem paths add
bbox-derived weight and strokes add perimeter*width. Each hex is snapped to the
nearest of red/white/blue/green/yellow/black/orange/maroon/cyan/purple.

FEATURES are a curated table (flag vocabulary is knowledge, not geometry), but every
stripe claim -- horizontal-tricolour / vertical-tricolour / bicolour -- is
cross-checked against the sampled band structure and mismatches are reported.
Vocabulary: horizontal-tricolour vertical-tricolour tricolour bicolour cross saltire
canton crescent star stars sun emblem coat-of-arms animal plant text triangle chevron
diagonal bordered unique-shape.  ("tricolour" is emitted alongside the specific
horizontal-/vertical- tag so consumers can match either.)
"""
import json, math, os, re, sys
import xml.etree.ElementTree as ET

BUILD = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BUILD)
RAW = os.path.join(BUILD, "flags-raw")
OUT_DIR = os.path.join(ROOT, "core", "data", "flags")
OUT_JS = os.path.join(ROOT, "core", "data", "flags.js")
HARD_BYTES = 40 * 1024

# ─────────────────────────────────────────────────────────────── feature table ──
# shorthand -> contract vocabulary
SH = {
    "ht": "horizontal-tricolour", "vt": "vertical-tricolour", "bi": "bicolour",
    "cr": "cross", "sa": "saltire", "ca": "canton", "cre": "crescent",
    "st": "star", "sts": "stars", "sun": "sun", "em": "emblem",
    "coa": "coat-of-arms", "an": "animal", "pl": "plant", "tx": "text",
    "tri": "triangle", "chv": "chevron", "dia": "diagonal", "bd": "bordered",
    "uq": "unique-shape",
}
# One line per country. Deliberately incomplete where a feature is arguable:
# accuracy beats completeness (these strings drive hints and quiz filters).
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
    "GM": "ht",                "GN": "vt",                "GP": "pl sun em",
    "GQ": "ht tri coa pl sts", "GR": "cr ca",             "GS": "ca coa an",
    "GT": "coa an pl",         "GU": "bd em tx pl",       "GW": "st",
    "GY": "tri",               "HK": "pl em",             "HM": "ca sts",
    "HN": "sts",               "HR": "ht coa",            "HT": "bi coa pl tx",
    "HU": "ht",                "ID": "bi",                "IE": "vt",
    "IL": "st em",             "IM": "em",                "IN": "ht em",
    "IO": "ca pl em",          "IQ": "ht tx",             "IR": "ht em tx",
    "IS": "cr",                "IT": "vt",                "JE": "sa coa",
    "JM": "sa",                "JO": "ht tri st",         "JP": "sun",
    "KE": "ht em",             "KG": "sun em",            "KH": "em",
    "KI": "an sun",            "KM": "tri cre sts",       "KN": "dia sts",
    "KP": "st",                "KR": "em",                "KW": "ht",
    "KY": "ca coa an",         "KZ": "sun an em",         "LA": "em",
    "LB": "pl em",             "LC": "tri",               "LI": "bi em",
    "LK": "an pl bd em",       "LR": "ca st",             "LS": "em",
    "LT": "ht",                "LU": "ht",                "LV": "",
    "LY": "cre st",            "MA": "st em",             "MC": "bi",
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
    "RS": "ht coa an",         "RU": "ht",                "RW": "sun",
    "SA": "tx em",             "SB": "dia sts",           "SC": "dia",
    "SD": "ht tri",            "SE": "cr",                "SG": "bi cre sts",
    "SH": "ca coa an",         "SI": "ht coa",            "SJ": "cr",
    "SK": "ht coa cr",         "SL": "ht",                "SM": "bi coa",
    "SN": "vt st",             "SO": "st",                "SR": "st",
    "SS": "ht tri st",         "ST": "tri sts",           "SV": "coa",
    "SX": "tri coa",           "SY": "ht sts",            "SZ": "em",
    "TC": "ca coa pl an",      "TD": "vt",                "TF": "ca tx",
    "TG": "ca st",             "TH": "",                  "TJ": "ht sts em",
    "TK": "sts em",            "TL": "tri st",            "TM": "cre sts em pl",
    "TN": "cre st",            "TO": "ca cr",             "TR": "cre st",
    "TT": "dia",               "TV": "ca sts",            "TW": "ca sun",
    "TZ": "dia",               "UA": "bi",                "UG": "an em",
    "UM": "ca sts",            "US": "ca sts",            "UY": "ca sun",
    "UZ": "ht cre sts",        "VA": "bi coa em",         "VC": "vt em",
    "VE": "ht sts",            "VG": "ca coa",            "VI": "an em tx",
    "VN": "st",                "VU": "tri em pl",         "WF": "ca em",
    "WS": "ca sts",            "XK": "em sts",            "YE": "ht",
    "YT": "coa",               "ZA": "tri",               "ZM": "an",
    "ZW": "tri st an",
}

# ──────────────────────────────────────────────────────────────────── palette ──
# reference points per canonical name; nearest wins (weighted RGB distance)
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
    "orangered": (255, 69, 0), "saddlebrown": (139, 69, 19),
    "sienna": (160, 82, 45), "tan": (210, 180, 140), "wheat": (245, 222, 179),
    "ivory": (255, 255, 240), "snow": (255, 250, 250), "azure": (240, 255, 255),
    "beige": (245, 245, 220), "khaki": (240, 230, 140), "brown": (165, 42, 42),
}


def parse_colour(v):
    """'#abc' / '#aabbcc' / css name / rgb() -> (r,g,b) or None."""
    if v is None:
        return None
    v = v.strip().lower()
    if not v or v in ("none", "transparent", "inherit", "currentcolor"):
        return None
    if v.startswith("#"):
        h = v[1:]
        if len(h) == 3:
            return tuple(int(c * 2, 16) for c in h)
        if len(h) == 4:
            return tuple(int(c * 2, 16) for c in h[:3])
        if len(h) == 6:
            return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
        if len(h) == 8:
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
    """-> (list of endpoint (x,y), only_straight_axis_cmds)"""
    toks = []
    for m in TOKEN.finditer(d or ""):
        if m.group(1):
            toks.append(m.group(1))
        else:
            try:
                toks.append(float(m.group(2)))
            except ValueError:
                pass
    pts, cx, cy, sx, sy = [], 0.0, 0.0, 0.0, 0.0
    cmd = None
    simple = True
    i, n = 0, len(toks)
    while i < n:
        t = toks[i]
        if isinstance(t, str):
            cmd = t
            i += 1
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
    return pts, simple


def is_rect(pts, simple):
    if not simple or not (4 <= len(pts) <= 6):
        return False
    xs = sorted({round(p[0], 4) for p in pts})
    ys = sorted({round(p[1], 4) for p in pts})
    if len(xs) != 2 or len(ys) != 2:
        return False
    corners = {(x, y) for x in xs for y in ys}
    got = {(round(p[0], 4), round(p[1], 4)) for p in pts}
    return corners == got


# ───────────────────────────────────────────────────────────────── transforms ──
def mat_mul(a, b):
    return (a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
            a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
            a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5])


IDENT = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


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
            syy = a[1] if len(a) > 1 else sxx
            t = (sxx, 0, 0, syy, 0, 0)
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
def num_fmt(v, dec):
    s = ("%.*f" % (dec, v))
    if "." in s:
        s = s.rstrip("0").rstrip(".")
    if s in ("-0", ""):
        s = "0"
    if s.startswith("0."):
        s = s[1:]
    elif s.startswith("-0."):
        s = "-" + s[2:]
    return s


CMDCHARS = "MmZzLlHhVvCcSsQqTtAa"


def compact_pathdata(d, dec):
    d = re.sub(r'([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)',
               lambda m: num_fmt(float(m.group(1)), dec) if _isnum(m.group(1)) else m.group(1), d)
    d = re.sub(r'[\s,]+', ' ', d).strip()
    d = re.sub(r'\s*([' + CMDCHARS + r'])\s*', r'\1', d)          # no space around commands
    d = re.sub(r'(\d|\.)\s+-', r'\1-', d)                          # 10 -5 -> 10-5
    return d


def _isnum(s):
    try:
        float(s)
        return True
    except ValueError:
        return False


def split_root(svg):
    """-> (attrs dict in order, rest_of_document)"""
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
    head = svg[:i]
    rest = svg[i + 1:]
    attrs = []
    for m in re.finditer(r'([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"|([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*\'([^\']*)\'',
                         head[4:]):
        if m.group(1):
            attrs.append((m.group(1), m.group(2)))
        else:
            attrs.append((m.group(3), m.group(4)))
    return attrs, rest


def minify(code, s):
    warn = []
    s = re.sub(r'<\?xml[^>]*\?>', '', s)
    s = re.sub(r'<!DOCTYPE.*?>', '', s, flags=re.S | re.I)
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    for tag in ("metadata", "title", "desc"):
        s = re.sub(r'<%s\b[^>]*/>' % tag, '', s, flags=re.I)
        s = re.sub(r'<%s\b.*?</%s\s*>' % (tag, tag), '', s, flags=re.S | re.I)
    has_text = bool(re.search(r'<(text|tspan|textPath|flowRoot)\b', s))

    # protect <style> bodies
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
        s = re.sub(r'\s(?:font-family|font-weight|font-size|font-style|letter-spacing|word-spacing|text-anchor)="[^"]*"', '', s)

    attrs, rest = split_root(s)
    amap = {k: v for k, v in attrs}

    # ── viewBox / sizing ──
    vb = amap.get("viewBox")
    if vb:
        nums = [float(x) for x in re.findall(r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?', vb)]
        if len(nums) != 4 or nums[2] <= 0 or nums[3] <= 0:
            warn.append("bad viewBox %r" % vb)
            vb = None
    if not vb:
        def dim(k):
            v = amap.get(k, "")
            m = re.match(r'\s*([-+]?[\d.]+)\s*(px)?\s*$', v)
            return float(m.group(1)) if m else None
        w, h = dim("width"), dim("height")
        if w and h and w > 0 and h > 0:
            nums = [0.0, 0.0, w, h]
            vb = "0 0 %s %s" % (num_fmt(w, 3), num_fmt(h, 3))
        else:
            return None, None, ["no viewBox and no usable width/height"]
    vbw, vbh = nums[2], nums[3]

    # ── numeric precision, scaled to the viewBox ──
    dec = int(math.ceil(math.log10(20000.0 / max(vbw, vbh)))) if max(vbw, vbh) > 0 else 3
    dec = max(1, min(4, dec))

    def redo_attr(m):
        name, val = m.group(1), m.group(2)
        return ' %s="%s"' % (name, compact_pathdata(val, dec))
    rest = re.sub(r'\s(d|points)="([^"]*)"', redo_attr, rest)

    # ── hex colour shortening (safe, value-preserving) ──
    def hexfix(m):
        h = m.group(1).lower()
        if len(h) == 6 and h[0] == h[1] and h[2] == h[3] and h[4] == h[5]:
            h = h[0] + h[2] + h[4]
        return "#" + h
    rest = re.sub(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b', hexfix, rest)
    styles = [re.sub(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b', hexfix, st) for st in styles]

    # ── namespace ids so many flags can be inlined side by side ──
    pfx = code.lower() + "-"
    ids = set(re.findall(r'\sid="([^"]+)"', rest))
    refs_before = len(re.findall(r'url\(\s*#([^)\s]+)\s*\)', rest)) + \
        len(re.findall(r'(?:xlink:)?href="#([^"]+)"', rest))
    if ids:
        def rid(m):
            return ' id="%s%s"' % (pfx, m.group(1))
        rest = re.sub(r'\sid="([^"]+)"', rid, rest)

        def rurl(m):
            t = m.group(1)
            return "url(#%s%s)" % (pfx, t) if t in ids else m.group(0)
        rest = re.sub(r'url\(\s*#([^)\s]+)\s*\)', rurl, rest)

        def rhref(m):
            t = m.group(2)
            return '%shref="#%s%s"' % (m.group(1) or "", pfx, t) if t in ids else m.group(0)
        rest = re.sub(r'(xlink:)?href="#([^"]+)"', rhref, rest)
        styles = [re.sub(r'url\(\s*#([^)\s]+)\s*\)',
                         lambda m: "url(#%s%s)" % (pfx, m.group(1)) if m.group(1) in ids else m.group(0), st)
                  for st in styles]

    # ── scope <style> rules under the root id so classes cannot leak ──
    rootid = "fl-" + code.lower()
    if styles:
        scoped = []
        for st in styles:
            st = re.sub(r'\s*([\r\n])\s*', ' ', st).strip()
            st = re.sub(r'([^{}]+)\{', lambda m: ",".join(
                ("#%s %s" % (rootid, sel.strip())) for sel in m.group(1).split(",") if sel.strip()) + "{", st)
            scoped.append(st)
        styles = scoped

    out_attrs = []
    seen = set()
    for k, v in attrs:
        if k in ("width", "height", "viewBox", "id"):
            continue
        if k in seen:
            continue
        seen.add(k)
        out_attrs.append((k, v))
    head = '<svg xmlns="http://www.w3.org/2000/svg"'
    if "xlink:" in rest:
        head += ' xmlns:xlink="http://www.w3.org/1999/xlink"'
    if styles:
        head += ' id="%s"' % rootid
    for k, v in out_attrs:
        if k in ("xmlns", "xmlns:xlink"):
            continue
        head += ' %s="%s"' % (k, v)
    head += ' viewBox="%s">' % re.sub(r'\s+', ' ', vb.strip())
    doc = head + rest

    # restore styles
    def put(m):
        return styles[int(m.group(1))]
    doc = re.sub(r'\x00(\d+)\x00', put, doc)
    doc = doc.replace("<style></style>", "")

    # ── validation ──
    try:
        troot = ET.fromstring(doc)
    except Exception as e:
        return None, None, ["minified output does not parse: %s" % e]
    ids_after = set(re.findall(r'\sid="([^"]+)"', doc))
    refs = set(re.findall(r'url\(\s*#([^)\s]+)\s*\)', doc)) | \
        set(re.findall(r'(?:xlink:)?href="#([^"]+)"', doc))
    dangling = sorted(r for r in refs if r not in ids_after)
    if dangling:
        warn.append("dangling id refs: %s" % ",".join(dangling[:5]))
    refs_after = len(re.findall(r'url\(\s*#([^)\s]+)\s*\)', doc)) + \
        len(re.findall(r'(?:xlink:)?href="#([^"]+)"', doc))
    if refs_after != refs_before:
        warn.append("reference count changed %d->%d" % (refs_before, refs_after))
    if troot.get("width") or troot.get("height"):
        warn.append("root still has width/height")
    if not troot.get("viewBox"):
        warn.append("root lost viewBox")
    return doc, (vbw, vbh, nums[0], nums[1]), warn


# ───────────────────────────────────────────────── colour + band measurement ──
SHAPES = ("path", "rect", "circle", "ellipse", "polygon", "polyline", "line")
SKIP = ("defs", "clippath", "mask", "symbol", "marker", "pattern",
        "lineargradient", "radialgradient", "filter", "style", "metadata")


def ln(tag):
    return tag.split("}")[-1]


def css_rules(root):
    rules = {}
    for el in root.iter():
        if ln(el.tag) != "style":
            continue
        txt = "".join(el.itertext())
        for m in re.finditer(r'([^{}]+)\{([^}]*)\}', txt):
            decls = {}
            for dm in re.finditer(r'([-a-zA-Z]+)\s*:\s*([^;]+)', m.group(2)):
                decls[dm.group(1).strip()] = dm.group(2).strip()
            for sel in m.group(1).split(","):
                sel = sel.strip()
                cm = re.search(r'\.([A-Za-z0-9_-]+)\s*$', sel)
                if cm:
                    rules.setdefault(cm.group(1), {}).update(decls)
    return rules


PROPS = ("fill", "stroke", "stroke-width", "opacity", "fill-opacity",
         "stroke-opacity", "color")


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
    """-> (weights {name: weight}, coverage sampler items, raw hex weights)"""
    root = ET.fromstring(doc)
    rules = css_rules(root)
    byid = {}
    for el in root.iter():
        i = el.get("id")
        if i:
            byid[i] = el
    items = []      # painter order: ('rect',x0,y0,x1,y1,rgb) / ('disc',cx,cy,r,rgb)
    emblem = []     # (rgb, weight)
    flag_area = vbw * vbh

    def shape_geom(el, m):
        name = ln(el.tag)
        pts, simple, rectish, area = [], False, False, 0.0
        if name == "path":
            pts, simple = parse_path(el.get("d"))
            rectish = is_rect(pts, simple)
        elif name == "rect":
            x, y = fnum(el.get("x", 0)), fnum(el.get("y", 0))
            w, h = fnum(el.get("width", 0)), fnum(el.get("height", 0))
            pts = [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]
            rectish = not (el.get("rx") or el.get("ry"))
        elif name in ("circle", "ellipse"):
            cx, cy = fnum(el.get("cx", 0)), fnum(el.get("cy", 0))
            if name == "circle":
                rx = ry = fnum(el.get("r", 0))
            else:
                rx, ry = fnum(el.get("rx", 0)), fnum(el.get("ry", 0))
            pts = [(cx - rx, cy - ry), (cx + rx, cy - ry), (cx + rx, cy + ry), (cx - rx, cy + ry)]
        elif name in ("polygon", "polyline"):
            nn = [float(x) for x in re.findall(r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?', el.get("points", ""))]
            pts = list(zip(nn[0::2], nn[1::2]))
        elif name == "line":
            pts = [(fnum(el.get("x1", 0)), fnum(el.get("y1", 0))),
                   (fnum(el.get("x2", 0)), fnum(el.get("y2", 0)))]
        if not pts:
            return None
        tp = [apply(m, p) for p in pts]
        x0 = min(q[0] for q in tp); x1 = max(q[0] for q in tp)
        y0 = min(q[1] for q in tp); y1 = max(q[1] for q in tp)
        axis = abs(m[1]) < 1e-6 and abs(m[2]) < 1e-6
        disc = name == "circle" and abs(abs(m[0]) - abs(m[3])) < 1e-6 and axis
        return (x0, y0, x1, y1, rectish and axis, disc, tp)

    def walk(el, inh, m, depth):
        if depth > 40:
            return
        for ch in el:
            nm = ln(ch.tag).lower()
            if nm in SKIP:
                continue
            props = resolve_props(ch, inh, rules)
            mm = mat_mul(m, parse_transform(ch.get("transform")))
            if nm == "g" or nm == "a" or nm == "svg":
                walk(ch, props, mm, depth + 1)
                continue
            if nm == "use":
                href = ch.get("{http://www.w3.org/1999/xlink}href") or ch.get("href") or ""
                tgt = byid.get(href[1:]) if href.startswith("#") else None
                if tgt is None:
                    continue
                mm2 = mat_mul(mm, (1, 0, 0, 1, fnum(ch.get("x", 0)), fnum(ch.get("y", 0))))
                if ln(tgt.tag).lower() in ("g", "svg", "symbol"):
                    walk(tgt, props, mat_mul(mm2, parse_transform(tgt.get("transform"))), depth + 1)
                else:
                    emit(tgt, resolve_props(tgt, props, rules),
                         mat_mul(mm2, parse_transform(tgt.get("transform"))))
                continue
            if nm in SHAPES:
                emit(ch, props, mm)
            else:
                walk(ch, props, mm, depth + 1)

    def emit(el, props, m):
        g = shape_geom(el, m)
        if not g:
            return
        x0, y0, x1, y1, axisrect, disc, tp = g
        op = fnum(props.get("opacity", 1), 1.0)
        fo = fnum(props.get("fill-opacity", 1), 1.0) * op
        so = fnum(props.get("stroke-opacity", 1), 1.0) * op
        fill = props.get("fill")
        rgb = parse_colour(fill) if fill is not None else (0, 0, 0)
        if fill is not None and fill.strip().lower() == "currentcolor":
            rgb = parse_colour(props.get("color"))
        bw, bh = max(0.0, x1 - x0), max(0.0, y1 - y0)
        if rgb and fo >= 0.35:
            if axisrect and bw > 0 and bh > 0:
                items.append(("rect", x0, y0, x1, y1, rgb))
            elif disc:
                items.append(("disc", (x0 + x1) / 2.0, (y0 + y1) / 2.0, (x1 - x0) / 2.0, rgb))
            else:
                emblem.append((rgb, 0.35 * bw * bh))
        srgb = parse_colour(props.get("stroke"))
        if srgb and so >= 0.35:
            sw = fnum(props.get("stroke-width", 1), 1.0) * math.sqrt(abs(m[0] * m[3] - m[1] * m[2]) or 1.0)
            per = 2 * (bw + bh) if (bw or bh) else 0.0
            emblem.append((srgb, min(per * sw, 0.9 * flag_area)))

    walk(root, {}, parse_transform(root.get("transform")), 0)

    # sampled visible coverage of the flat (rect/disc) stack
    NX, NY = 64, 48
    counts = {}
    grid = []
    for j in range(NY):
        y = vby + vbh * (j + 0.5) / NY
        row = []
        for i in range(NX):
            x = vbx + vbw * (i + 0.5) / NX
            top = None
            for it in items:
                if it[0] == "rect":
                    if it[1] <= x <= it[3] and it[2] <= y <= it[4]:
                        top = it[5]
                else:
                    if (x - it[1]) ** 2 + (y - it[2]) ** 2 <= it[3] ** 2:
                        top = it[4]
            row.append(top)
            if top:
                counts[top] = counts.get(top, 0) + 1
        grid.append(row)
    weights = {}
    cell = flag_area / float(NX * NY)
    for rgb, c in counts.items():
        weights[rgb] = weights.get(rgb, 0.0) + c * cell
    for rgb, w in emblem:
        weights[rgb] = weights.get(rgb, 0.0) + w
    return weights, grid, flag_area


def bands(grid, axis):
    """axis 'h': runs down a column. 'v': runs across a row. Sampled twice, must agree."""
    NY = len(grid); NX = len(grid[0])
    if axis == "h":
        lines = [[grid[j][int(NX * 0.08)] for j in range(NY)],
                 [grid[j][int(NX * 0.92)] for j in range(NY)]]
    else:
        lines = [[grid[int(NY * 0.08)][i] for i in range(NX)],
                 [grid[int(NY * 0.92)][i] for i in range(NX)]]
    runs = []
    for line in lines:
        r = []
        for v in line:
            if r and r[-1][0] == v:
                r[-1][1] += 1
            else:
                r.append([v, 1])
        runs.append([(v, n / float(len(line))) for v, n in r])
    if runs[0] != runs[1]:
        return None
    return runs[0]


def structure(grid):
    """-> set of {'ht','vt','bi'} that the geometry actually supports."""
    out = set()
    h, v = bands(grid, "h"), bands(grid, "v")
    for key, b in (("ht", h), ("vt", v)):
        if not b or any(c is None for c, _ in b):
            continue
        if len(b) == 3 and len({c for c, _ in b}) == 3 and all(0.2 <= f <= 0.46 for _, f in b):
            out.add(key)
        if len(b) == 2 and len({c for c, _ in b}) == 2 and all(0.3 <= f <= 0.7 for _, f in b):
            out.add("bi")
    return out


# ──────────────────────────────────────────────────────────────────────  main ──
def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    codes = sorted(f[:-4] for f in os.listdir(RAW) if f.endswith(".svg"))
    index, problems, mismatch, total = {}, [], [], 0
    spot = {}
    for code in codes:
        raw = open(os.path.join(RAW, code + ".svg"), "r", encoding="utf-8").read()
        doc, vbinfo, warn = minify(code, raw)
        if doc is None:
            problems.append((code, "; ".join(warn)))
            continue
        vbw, vbh, vbx, vby = vbinfo
        try:
            weights, grid, area = measure(doc, vbw, vbh, vbx, vby)
        except Exception as e:
            problems.append((code, "measure failed: %s" % e))
            weights, grid, area = {}, [[None]], vbw * vbh
        # colour names, ordered by measured prominence
        named = {}
        for rgb, w in weights.items():
            n = colour_name(rgb)
            named[n] = named.get(n, 0.0) + w
        order = sorted(named.items(), key=lambda kv: -kv[1])
        colours = [n for n, w in order if w >= 0.02 * area][:5]
        if len(colours) < 2:
            colours = [n for n, _ in order[:2]]
        # features
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
        # cross-check stripe claims against geometry
        st = structure(grid)
        claimed = {t for t in ("horizontal-tricolour", "vertical-tricolour", "bicolour") if t in feats}
        cmap = {"horizontal-tricolour": "ht", "vertical-tricolour": "vt", "bicolour": "bi"}
        for c in claimed:
            if cmap[c] not in st:
                mismatch.append("%s claims %s, geometry says %s" % (code, c, sorted(st) or "none"))
        for k, name in (("ht", "horizontal-tricolour"), ("vt", "vertical-tricolour")):
            if k in st and name not in feats and "bicolour" not in feats:
                mismatch.append("%s geometry shows %s, table omits it" % (code, name))

        path = os.path.join(OUT_DIR, code + ".svg")
        with open(path, "w", encoding="utf-8") as f:
            f.write(doc)
        nbytes = len(doc.encode("utf-8"))
        total += nbytes
        ar = round(vbw / vbh, 4)
        index[code] = {"file": code + ".svg", "ar": ar, "bytes": nbytes,
                       "hard": 1 if nbytes > HARD_BYTES else 0,
                       "colours": colours, "features": feats}
        if warn:
            problems.append((code, "; ".join(warn)))
        spot[code] = (len(raw), nbytes, ar)

    # ── write flags.js ──
    lines = []
    for code in sorted(index):
        lines.append('  "%s": %s' % (code, json.dumps(index[code], sort_keys=False, separators=(",", ":"))))
    payload = "{\n" + ",\n".join(lines) + "\n}"
    js = (
        "// core/data/flags.js — flag index for MIDNIGHT ARCADE.\n"
        "// Source: flagcdn.com SVG flags (public domain), one file per ISO 3166-1 alpha-2\n"
        "// code taken from _build/countries-full.json (mledoze/countries).\n"
        "// Generated by _build/fetch_flags.py + _build/gen_flags.py — do not hand-edit.\n"
        "// Per country: file (inside core/data/flags/), ar = viewBox aspect ratio (w/h),\n"
        "// bytes = minified SVG size, hard = 1 when the file is >40 KB (busy seal/emblem\n"
        "// whose detail is lost when scaled small), colours = dominant colour names\n"
        "// measured from the SVG paint stack, most prominent first, features = curated\n"
        "// design tags. Feature vocabulary: horizontal-tricolour, vertical-tricolour,\n"
        "// tricolour, bicolour, cross, saltire, canton, crescent, star, stars, sun,\n"
        "// emblem, coat-of-arms, animal, plant, text, triangle, chevron, diagonal,\n"
        "// bordered, unique-shape. Tags are deliberately incomplete where a reading is\n"
        "// arguable — an absent tag never means \"definitely not\".\n"
        "// Each SVG has its ids namespaced and its <style> rules scoped to the root id,\n"
        "// so several flags can be inlined into one document safely.\n"
        "window.AD_FLAGS = " + payload + ";\n"
    )
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write(js)

    # ── self check ──
    print("=" * 74)
    print("flags written : %d" % len(index))
    print("flags.js      : %d bytes" % len(js.encode("utf-8")))
    print("svg total     : %.1f KB (avg %.1f KB)" % (total / 1024.0, total / 1024.0 / max(1, len(index))))
    big = sorted(index.items(), key=lambda kv: -kv[1]["bytes"])[:10]
    print("10 largest    : " + ", ".join("%s %.1fKB" % (c, d["bytes"] / 1024.0) for c, d in big))
    print("hard=1 (>40KB): %d -> %s" % (sum(1 for d in index.values() if d["hard"]),
                                        ",".join(sorted(c for c, d in index.items() if d["hard"]))))
    over300 = [c for c, d in index.items() if d["bytes"] > 300 * 1024]
    print("over 300KB    : %s" % (over300 or "none"))
    shrink = [(spot[c][1] / float(spot[c][0])) for c in spot if spot[c][0]]
    print("minify ratio  : mean %.1f%% of raw" % (100.0 * sum(shrink) / len(shrink)))
    # xml parse + non-empty check on the written files
    bad = []
    for c in sorted(index):
        p = os.path.join(OUT_DIR, c + ".svg")
        try:
            if os.path.getsize(p) < 40:
                bad.append(c + ":tiny")
            r = ET.parse(p).getroot()
            if not r.tag.endswith("svg") or not r.get("viewBox"):
                bad.append(c + ":root")
        except Exception as e:
            bad.append("%s:%s" % (c, e))
    print("xml re-parse  : %d/%d ok%s" % (len(index) - len(bad), len(index),
                                          "" if not bad else "  BAD: " + ",".join(bad)))
    dirbytes = sum(os.path.getsize(os.path.join(OUT_DIR, f)) for f in os.listdir(OUT_DIR))
    print("flags/ dir    : %d files, %.1f KB" % (len(os.listdir(OUT_DIR)), dirbytes / 1024.0))
    print("no features   : %s" % ",".join(sorted(c for c, d in index.items() if not d["features"])))
    print("spot checks   :")
    for c in ("IR", "GB", "US", "NP", "CH", "VA", "FR", "JP", "BR", "MX", "ZA", "TJ"):
        if c in index:
            d = index[c]
            print("   %-3s ar=%-7s %-6s colours=%-42s features=%s"
                  % (c, d["ar"], "%.1fKB" % (d["bytes"] / 1024.0),
                     ",".join(d["colours"]), ",".join(d["features"])))
    if mismatch:
        print("stripe cross-check mismatches (%d):" % len(mismatch))
        for m in mismatch:
            print("   ! " + m)
    else:
        print("stripe cross-check: all claims agree with geometry")
    if problems:
        print("problems (%d):" % len(problems))
        for c, w in problems:
            print("   ? %s: %s" % (c, w))
    else:
        print("problems: none")
    print("=" * 74)
    return 0


if __name__ == "__main__":
    sys.exit(main())
