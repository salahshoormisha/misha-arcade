#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_world.py -- builds  core/data/world.js  (window.AD_WORLD)

SOURCES (both already in _build/, both public domain / MIT):
  * countries-50m.json  -- Natural Earth 1:50m admin-0 countries, TopoJSON
                           (world-atlas), 241 geometries, quantized ints + transform.
  * countries-110m.json -- Natural Earth 1:110m, used only as a cross-check.
  * countries-full.json -- mledoze/countries (MIT), 250 records; used for
                           ccn3 (ISO numeric) -> cca2 (ISO2), area, latlng.

WHAT IT DOES
  1. Decodes the TopoJSON by hand: arcs are delta-encoded quantized integers,
     absolute = running sum, lon/lat = v*scale + translate.  Negative arc index
     ~i means arc i traversed backwards.  Rings are stitched from arcs.
  2. Numeric id -> ISO2 through ccn3.  Un-coded Natural Earth geometries
     (Kosovo / Somaliland / N. Cyprus / ...) are resolved explicitly.
  3. Splits far-flung polygon clusters off to their own ISO2 when
     countries-full.json puts a code there (French Guiana, Reunion, ...), and
     drops distant clusters that are both tiny and a negligible share of the
     country's area (Easter I. off Chile, the Azores off Portugal, ...).
  4. Simplifies with Douglas-Peucker AT THE ARC LEVEL, epsilon tuned per country
     from the size of its largest ring, an arc taking the min epsilon of every
     country that shares it.  Simplifying arcs (not rings) keeps the topology:
     neighbours still share identical vertices, so a filled map has no slivers.
  5. Quantizes to a 1/Q degree grid and emits base64-alphabet zig-zag varint
     delta strings, with the decoder inlined in world.js.

Deterministic and re-runnable.  Prints a full self-check at the end.
"""

import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'core', 'data', 'world.js')

# ---------------------------------------------------------------- parameters
SRC = 'countries-50m.json'   # primary geometry source
Q = 256                      # quantization: integer units per degree (~0.43 km)
EPS_DIV = 320.0              # eps = size_of_largest_ring / EPS_DIV  (~1px at 320px wide)
EPS_MIN = 0.0035             # degrees
EPS_MAX = 0.17               # degrees
LAND_EPS = 0.25              # coarse eps for the world backdrop
LAND_MIN_AREA = 700.0        # km^2 -- backdrop skips islands smaller than this
RING_REL = 0.0025            # keep a ring if area >= 0.25% of the largest ring
RING_ABS = 600.0             # ...or >= 600 km2 outright, whatever the country
RING_MAX = 70                # hard cap on rings per country (largest kept)
CLUSTER_GAP = 2.5            # degrees: single-link distance for polygon clusters
FAR_GAP = 12.0               # degrees from the main cluster to count as far-flung
FAR_KM2 = 5000.0             # a far cluster smaller than this may be dropped
FAR_SHARE = 0.03             # ...but only if it is <3% of the country's land area

ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

# Natural Earth geometries with no ISO numeric id, resolved by name.
# 'XK' = Kosovo (user-assigned ISO2, what mledoze/countries uses).
# Somaliland and N. Cyprus have no ISO code at all: Natural Earth draws them
# separately, ISO 3166 does not, so their polygons are merged into the country
# that owns them under ISO (SO, CY) as extra outer rings.
NO_ID = {
    'Kosovo': 'XK',
    'Somaliland': 'SO',
    'N. Cyprus': 'CY',
    'Indian Ocean Ter.': None,   # Christmas + Cocos; re-homed by the latlng pass
    'Siachen Glacier': None,     # disputed, no ISO code, drop
}

log_lines = []
fallbacks = []      # countries whose area centroid fell outside -> interior point
unfixable = []      # ...and where even that failed


def log(*a):
    s = ' '.join(str(x) for x in a)
    log_lines.append(s)
    print(s)


# ---------------------------------------------------------------- topojson
def decode_arcs(topo):
    """-> list of arcs, each a list of (lon, lat) floats."""
    sx, sy = topo['transform']['scale']
    tx, ty = topo['transform']['translate']
    out = []
    for arc in topo['arcs']:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        out.append(pts)
    return out


def polys_of(geom):
    """Normalise Polygon/MultiPolygon to [[ring_arcrefs, hole_arcrefs...], ...]."""
    if geom['type'] == 'Polygon':
        return [geom['arcs']]
    if geom['type'] == 'MultiPolygon':
        return list(geom['arcs'])
    return []


def normalize_poly(arcs, poly):
    """(outer_refs, [hole_refs...]), largest ring first, degenerate rings dropped.

    Natural Earth stores Antarctica as a polygon whose FIRST ring is the
    zero-area seam along latitude -90 and whose second ring is the actual
    continent, so 'ring 0 is the exterior' is not safe -- rank by |area|.
    """
    out = []
    for r in poly:
        pts = stitch(arcs, r)
        if len(pts) < 4:
            continue
        a = abs(shoelace(pts))
        if a <= 0.0:
            continue
        out.append((a, r, pts))
    if not out:
        return None
    out.sort(key=lambda t: -t[0])
    return ([t[1] for t in out], out[0][2])


def stitch(arcs, refs):
    """Build a point list from signed arc indices."""
    pts = []
    for r in refs:
        a = arcs[r] if r >= 0 else arcs[~r][::-1]
        if pts and a and pts[-1] == a[0]:
            pts.extend(a[1:])
        else:
            pts.extend(a)
    return pts


# ---------------------------------------------------------------- geometry
def shoelace(pts):
    s = 0.0
    n = len(pts)
    if n < 3:
        return 0.0
    for i in range(n):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % n]
        s += x1 * y2 - x2 * y1
    return s / 2.0


def bbox_of(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return (min(xs), min(ys), max(xs), max(ys))


def km2(pts):
    """Approximate area in km^2 (equirectangular, cos-latitude corrected)."""
    a = abs(shoelace(pts))
    if a == 0:
        return 0.0
    ys = [p[1] for p in pts]
    lat = (min(ys) + max(ys)) / 2.0
    return a * 12392.0 * max(0.02, math.cos(math.radians(lat)))


def lon_gap(a0, a1, b0, b1):
    """Smallest wrap-aware gap between longitude intervals [a0,a1] and [b0,b1]."""
    best = 1e9
    for shift in (-360.0, 0.0, 360.0):
        g = max(b0 + shift - a1, a0 - (b1 + shift), 0.0)
        best = min(best, g)
    return best


def box_gap(A, B):
    dx = lon_gap(A[0], A[2], B[0], B[2])
    dy = max(B[1] - A[3], A[1] - B[3], 0.0)
    return math.hypot(dx, dy)


def point_in_ring(p, ring):
    x, y = p
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > y) != (yj > y):
            xint = xi + (y - yi) * (xj - xi) / (yj - yi)
            if x < xint:
                inside = not inside
        j = i
    return inside


def seg_dist(p, a, b):
    px, py = p
    ax, ay = a
    bx, by = b
    dx = bx - ax
    dy = by - ay
    if dx == 0.0 and dy == 0.0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = 0.0 if t < 0.0 else (1.0 if t > 1.0 else t)
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def ring_dist(p, ring):
    best = 1e9
    n = len(ring)
    for i in range(n):
        d = seg_dist(p, ring[i], ring[(i + 1) % n])
        if d < best:
            best = d
    return best


def area_centroid(ring):
    """Area-weighted (true polygon) centroid."""
    a = 0.0
    cx = 0.0
    cy = 0.0
    n = len(ring)
    for i in range(n):
        x1, y1 = ring[i]
        x2, y2 = ring[(i + 1) % n]
        f = x1 * y2 - x2 * y1
        a += f
        cx += (x1 + x2) * f
        cy += (y1 + y2) * f
    if abs(a) < 1e-12:
        xs = [p[0] for p in ring]
        ys = [p[1] for p in ring]
        return (sum(xs) / n, sum(ys) / n)
    a *= 0.5
    return (cx / (6.0 * a), cy / (6.0 * a))


def interior_point(ring):
    """Approximate pole of inaccessibility: the inside point furthest from the edge."""
    x0, y0, x1, y1 = bbox_of(ring)
    best = None
    bestd = -1.0
    n = 48
    for gx in range(n):
        for gy in range(n):
            p = (x0 + (x1 - x0) * (gx + 0.5) / n, y0 + (y1 - y0) * (gy + 0.5) / n)
            if not point_in_ring(p, ring):
                continue
            d = ring_dist(p, ring)
            if d > bestd:
                bestd = d
                best = p
    if best is None:
        return None
    stepx = (x1 - x0) / n
    stepy = (y1 - y0) / n
    for _ in range(3):
        cx, cy = best
        stepx /= 3.0
        stepy /= 3.0
        for gx in range(-4, 5):
            for gy in range(-4, 5):
                p = (cx + stepx * gx, cy + stepy * gy)
                if not point_in_ring(p, ring):
                    continue
                d = ring_dist(p, ring)
                if d > bestd:
                    bestd = d
                    best = p
    return best


# ---------------------------------------------------------------- Douglas-Peucker
def dp_indices(pts, eps):
    """Douglas-Peucker over an open polyline; returns sorted kept indices."""
    n = len(pts)
    if n <= 2:
        return list(range(n))
    keep = [False] * n
    keep[0] = keep[n - 1] = True
    stack = [(0, n - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        ax, ay = pts[i]
        bx, by = pts[j]
        dx = bx - ax
        dy = by - ay
        l2 = dx * dx + dy * dy
        worst = -1.0
        widx = -1
        if l2 == 0.0:
            for k in range(i + 1, j):
                d = math.hypot(pts[k][0] - ax, pts[k][1] - ay)
                if d > worst:
                    worst = d
                    widx = k
        else:
            # distance to the SEGMENT, not to the infinite line: the line variant
            # lets long spikes and hooks slip through under eps.
            for k in range(i + 1, j):
                px, py = pts[k]
                t = ((px - ax) * dx + (py - ay) * dy) / l2
                if t < 0.0:
                    t = 0.0
                elif t > 1.0:
                    t = 1.0
                d = math.hypot(px - (ax + t * dx), py - (ay + t * dy))
                if d > worst:
                    worst = d
                    widx = k
        if worst > eps:
            keep[widx] = True
            stack.append((i, widx))
            stack.append((widx, j))
    return [i for i in range(n) if keep[i]]


def simplify_arc(pts, eps):
    """DP an arc. Closed arcs (island loops) are split so they cannot collapse."""
    n = len(pts)
    if n <= 2:
        return list(range(n))
    closed = pts[0] == pts[-1]
    if not closed:
        return dp_indices(pts, eps)
    # farthest point from the shared endpoint -> split into two open halves
    ax, ay = pts[0]
    far = max(range(1, n - 1), key=lambda k: (pts[k][0] - ax) ** 2 + (pts[k][1] - ay) ** 2)
    a = dp_indices(pts[:far + 1], eps)
    b = dp_indices(pts[far:], eps)
    idx = a + [far + i for i in b[1:]]
    if len(idx) < 4:                       # keep a loop drawable
        step = max(1, (n - 1) // 3)
        idx = sorted(set([0] + list(range(step, n - 1, step)) + [n - 1]))
    return idx


# ---------------------------------------------------------------- encoding
def enc_int(v, out):
    u = (v << 1) if v >= 0 else ((-v << 1) - 1)   # zig-zag
    while u >= 32:
        out.append(ALPHA[(u & 31) | 32])
        u >>= 5
    out.append(ALPHA[u])


def enc_ring(qpts):
    out = []
    px = py = 0
    for x, y in qpts:
        enc_int(x - px, out)
        enc_int(y - py, out)
        px, py = x, y
    return ''.join(out)


def dec_ring(s):
    """Python mirror of the JS decoder -- used only for self-checking."""
    V = {c: i for i, c in enumerate(ALPHA)}
    pts = []
    i = 0
    n = len(s)
    x = y = 0
    while i < n:
        vals = []
        for _ in range(2):
            r = 0
            sh = 0
            while True:
                b = V[s[i]]
                i += 1
                r |= (b & 31) << sh
                sh += 5
                if b < 32:
                    break
            vals.append(-(r >> 1) - 1 if (r & 1) else (r >> 1))
        x += vals[0]
        y += vals[1]
        pts.append((x, y))
    return pts


# ---------------------------------------------------------------- main
def main():
    topo = json.load(open(os.path.join(HERE, SRC)))
    full = json.load(open(os.path.join(HERE, 'countries-full.json')))
    bynum = {c['ccn3']: c for c in full if c.get('ccn3')}
    byiso = {c['cca2']: c for c in full}

    arcs = decode_arcs(topo)
    geoms = topo['objects']['countries']['geometries']

    # ---- 1. group polygons by ISO2 -------------------------------------
    # poly = {'refs': [outer_refs, hole_refs...], 'pts': outer point list}
    polys_by_iso = {}
    dropped_named = []
    for g in geoms:
        name = g.get('properties', {}).get('name', '?')
        if 'id' in g and g['id'] in bynum:
            iso = bynum[g['id']]['cca2']
        elif name in NO_ID:
            iso = NO_ID[name]
            if iso is None and name == 'Indian Ocean Ter.':
                iso = '??IOT'          # re-homed below by latlng, else dropped
            if iso is None:
                dropped_named.append((name, 'no ISO 3166 code'))
                continue
        else:
            dropped_named.append((name, 'unmapped id %r' % g.get('id')))
            continue
        for p in polys_of(g):
            nz = normalize_poly(arcs, p)
            if nz is None:
                continue
            polys_by_iso.setdefault(iso, []).append({'refs': nz[0], 'pts': nz[1]})

    log('ISO2 groups from %s: %d' % (SRC, len(polys_by_iso)))
    if dropped_named:
        for n, why in dropped_named:
            log('  dropped un-coded geometry: %-20s (%s)' % (n, why))
    for n, iso in sorted(NO_ID.items()):
        if iso and iso != '??IOT':
            log('  un-coded geometry %-18s -> %s' % (n, iso))

    # ---- 2. cluster polygons, re-home + drop far-flung -----------------
    def cluster(ps):
        boxes = [bbox_of(p['pts']) for p in ps]
        parent = list(range(len(ps)))

        def find(i):
            while parent[i] != i:
                parent[i] = parent[parent[i]]
                i = parent[i]
            return i
        for i in range(len(ps)):
            for j in range(i + 1, len(ps)):
                if box_gap(boxes[i], boxes[j]) <= CLUSTER_GAP:
                    a, b = find(i), find(j)
                    if a != b:
                        parent[a] = b
        groups = {}
        for i in range(len(ps)):
            groups.setdefault(find(i), []).append(i)
        return list(groups.values())

    have_iso = set(polys_by_iso)
    need_home = {}
    for k, c in byiso.items():
        if k not in have_iso and c.get('latlng') and len(c['latlng']) == 2:
            need_home[k] = (c['latlng'][1], c['latlng'][0])   # (lon, lat)

    rehomed = []
    dropped_clusters = []
    new_groups = {}
    for iso in sorted(polys_by_iso):
        ps = polys_by_iso[iso]
        cl = cluster(ps)
        areas = [km2(p['pts']) for p in ps]
        total = sum(areas) or 1.0
        pseudo = iso.startswith('??')      # NE geometry with no ISO code at all
        if pseudo:
            main, mainbox = [], None
        else:
            # main cluster = the one holding the single largest polygon
            bigi = max(range(len(ps)), key=lambda i: areas[i])
            main = [c for c in cl if bigi in c][0]
            mainbox = bbox_of([pt for i in main for pt in ps[i]['pts']])
        keep = list(main)
        for c in cl:
            if main and c is main:
                continue
            cbox = bbox_of([pt for i in c for pt in ps[i]['pts']])
            carea = sum(areas[i] for i in c)
            gap = box_gap(mainbox, cbox) if mainbox else 999.0
            # does an ISO2 with no geometry of its own sit inside this cluster?
            homes = [k for k, (lon, lat) in sorted(need_home.items())
                     if cbox[0] - 1.5 <= lon <= cbox[2] + 1.5
                     and cbox[1] - 1.5 <= lat <= cbox[3] + 1.5]
            if homes and gap > 3.0:
                if len(homes) == 1:
                    take = {homes[0]: list(c)}
                else:                       # e.g. Guadeloupe + Martinique together
                    take = {}
                    for i in c:
                        pc = area_centroid(ps[i]['pts'])
                        k = min(homes, key=lambda h: math.hypot(
                            pc[0] - need_home[h][0], pc[1] - need_home[h][1]))
                        take.setdefault(k, []).append(i)
                for k in sorted(take):
                    new_groups.setdefault(k, []).extend(ps[i] for i in take[k])
                    rehomed.append((iso, k, byiso[k]['name']['common'],
                                    round(sum(areas[i] for i in take[k])),
                                    round(gap, 1)))
                    del need_home[k]
                continue
            if pseudo or (gap > FAR_GAP and carea < FAR_KM2
                          and carea < FAR_SHARE * total):
                dropped_clusters.append((iso, round(carea, 1), round(gap, 1),
                                         round(cbox[0], 1), round(cbox[1], 1)))
                continue
            keep.extend(c)
        if keep:
            new_groups.setdefault(iso, []).extend(ps[i] for i in keep)

    polys_by_iso = {k: v for k, v in new_groups.items() if v and not k.startswith('??')}
    log('\nre-homed far clusters -> their own ISO2 (%d):' % len(rehomed))
    for a, b, n, ar, gp in rehomed:
        log('  %s -> %-3s %-22s ~%6d km2, %5.1f deg from mainland' % (a, b, n, ar, gp))
    log('dropped far-flung micro clusters (%d): distant, <%.0f km2 and <%.0f%% of area'
        % (len(dropped_clusters), FAR_KM2, FAR_SHARE * 100))
    for iso, ar, gp, lo, la in dropped_clusters:
        log('  %s  ~%8.1f km2  %5.1f deg away  at lon %7.1f lat %6.1f'
            % (iso, ar, gp, lo, la))

    # ---- 3. ring selection + epsilon per country -----------------------
    kept = {}      # iso -> list of (outer_refs, [hole_refs...])
    eps_of = {}
    dropped_rings = {}
    for iso, ps in polys_by_iso.items():
        ps = sorted(ps, key=lambda p: -km2(p['pts']))
        big = km2(ps[0]['pts'])
        # relative threshold, but never throw away a real island: anything at or
        # above RING_ABS km2 is kept whatever country it belongs to (Hawaii is
        # only 0.2% of the USA, Severnaya Zemlya 0.2% of Russia).
        thresh = min(RING_ABS, max(RING_REL * big, min(20.0, 0.05 * big)))
        sel = [ps[0]]
        for p in ps[1:]:
            if km2(p['pts']) >= thresh:
                sel.append(p)
        if len(sel) > RING_MAX:
            sel = sel[:RING_MAX]
        if len(ps) - len(sel):
            dropped_rings[iso] = len(ps) - len(sel)
        kept[iso] = sel
        size = math.sqrt(abs(shoelace(ps[0]['pts'])))     # degrees
        eps_of[iso] = min(EPS_MAX, max(EPS_MIN, size / EPS_DIV))

    # ---- 4. arc epsilon = min over the countries sharing it ------------
    arc_eps = {}
    for iso, sel in kept.items():
        e = eps_of[iso]
        for p in sel:
            for ring in p['refs']:
                for r in ring:
                    i = r if r >= 0 else ~r
                    if i not in arc_eps or e < arc_eps[i]:
                        arc_eps[i] = e

    qarc = {}
    arc_err = {}
    for i, e in arc_eps.items():
        pts = arcs[i]
        idx = simplify_arc(pts, e)
        qp = []
        for k in idx:
            lon, lat = pts[k]
            qp.append((int(round((lon + 180.0) * Q)), int(round((lat + 90.0) * Q))))
        # drop consecutive duplicates but never the endpoints
        ded = [qp[0]]
        for p in qp[1:]:
            if p != ded[-1]:
                ded.append(p)
        if len(ded) == 1 and len(qp) > 1 and qp[-1] != qp[0]:
            ded.append(qp[-1])
        qarc[i] = ded
        # true error of the shipped geometry vs the original arc, in degrees
        dq = [((x / float(Q)) - 180.0, (y / float(Q)) - 90.0) for x, y in qp]
        worst = 0.0
        for s in range(len(idx) - 1):
            a, b = dq[s], dq[s + 1]
            for k in range(idx[s], idx[s + 1] + 1):
                d = seg_dist(pts[k], a, b)
                if d > worst:
                    worst = d
        if len(idx) == 1:
            for k in range(len(pts)):
                d = math.hypot(pts[k][0] - dq[0][0], pts[k][1] - dq[0][1])
                worst = max(worst, d)
        arc_err[i] = worst

    def qstitch(refs):
        pts = []
        for r in refs:
            a = qarc[r] if r >= 0 else qarc[~r][::-1]
            if pts and pts[-1] == a[0]:
                pts.extend(a[1:])
            else:
                pts.extend(a)
        ded = [pts[0]]
        for p in pts[1:]:
            if p != ded[-1]:
                ded.append(p)
        if len(ded) > 1 and ded[0] == ded[-1]:
            ded.pop()
        return ded

    # ---- 5. build final rings ------------------------------------------
    G = {}
    META = {}
    stats = {'rings': 0, 'pts': 0, 'holes': 0}
    err_of = {}
    tiny_fix = []
    for iso in sorted(kept):
        rings = []
        for p in kept[iso]:
            outer = qstitch(p['refs'][0])
            if len(outer) < 3:
                continue
            if shoelace(outer) < 0:
                outer = outer[::-1]
            rings.append(outer)
            for hole in p['refs'][1:]:
                h = qstitch(hole)
                if len(h) < 3:
                    continue
                if shoelace(h) > 0:
                    h = h[::-1]
                rings.append(h)
                stats['holes'] += 1
        if not rings:
            # tiny country wiped out by quantization -> keep its bbox as a quad
            src = max(kept[iso], key=lambda p: km2(p['pts']))['pts']
            x0, y0, x1, y1 = bbox_of(src)
            qx0, qy0 = int(round((x0 + 180) * Q)), int(round((y0 + 90) * Q))
            qx1, qy1 = max(qx0 + 1, int(round((x1 + 180) * Q))), \
                max(qy0 + 1, int(round((y1 + 90) * Q)))
            rings = [[(qx0, qy0), (qx1, qy0), (qx1, qy1), (qx0, qy1)]]
            tiny_fix.append(iso)
        G[iso] = ','.join(enc_ring(r) for r in rings)
        stats['rings'] += len(rings)
        stats['pts'] += sum(len(r) for r in rings)
        err_of[iso] = max(arc_err[r if r >= 0 else ~r]
                          for p in kept[iso] for ring in p['refs'] for r in ring)

        # -- meta: bbox + centroid, in an antimeridian-safe frame --
        deg = [[((x / float(Q)) - 180.0, (y / float(Q)) - 90.0) for x, y in r]
               for r in rings]
        outers = [r for r in deg if shoelace(r) > 0]
        allpts = [p for r in deg for p in r]
        nb = bbox_of(allpts)
        frame = 0.0
        if nb[2] - nb[0] > 180.0:
            sh = [(p[0] + 360.0 if p[0] < 0 else p[0], p[1]) for p in allpts]
            sb = bbox_of(sh)
            if sb[2] - sb[0] < nb[2] - nb[0]:
                nb = sb
                frame = 1.0
        bb = nb
        big = max(outers, key=lambda r: abs(shoelace(r)))
        if frame:
            big = [(p[0] + 360.0 if p[0] < bb[0] - 1e-9 else p[0], p[1]) for p in big]
        c = area_centroid(big)
        if not point_in_ring(c, big):
            ip = interior_point(big)
            if ip:
                c = ip
                fallbacks.append(iso)
            else:
                unfixable.append(iso)
        META[iso] = [int(round((c[0] + 180) * Q)), int(round((c[1] + 90) * Q)),
                     int(round((bb[0] + 180) * Q)), int(round((bb[1] + 90) * Q)),
                     int(round((bb[2] + 180) * Q)), int(round((bb[3] + 90) * Q))]

    # ---- 6. land backdrop ---------------------------------------------
    land = topo['objects']['land']
    lrings = []
    for geo in land.get('geometries', [land]):
        for p in polys_of(geo):
            nz = normalize_poly(arcs, p)
            if nz is None or km2(nz[1]) < LAND_MIN_AREA:
                continue
            for gi, rr in enumerate(nz[0]):
                pts = stitch(arcs, rr)
                if len(pts) < 4:
                    continue
                src = pts if pts[0] == pts[-1] else (pts + [pts[0]])
                idx = simplify_arc(src, LAND_EPS)
                qp = []
                for k in idx:
                    lon, lat = src[k]
                    qp.append((int(round((lon + 180.0) * Q)),
                               int(round((lat + 90.0) * Q))))
                ded = [qp[0]]
                for pt in qp[1:]:
                    if pt != ded[-1]:
                        ded.append(pt)
                if len(ded) > 1 and ded[0] == ded[-1]:
                    ded.pop()
                if len(ded) < 3:
                    continue
                s = shoelace(ded)
                if (gi == 0) != (s > 0):
                    ded = ded[::-1]
                lrings.append(ded)
    L = ','.join(enc_ring(r) for r in lrings)
    log('\nland backdrop: %d rings, %d points, %.1f KB encoded'
        % (len(lrings), sum(len(r) for r in lrings), len(L) / 1024.0))

    # ---- 7. write the file --------------------------------------------
    payload = {'q': Q, 'g': G, 'm': META, 'l': L}
    blob = json.dumps(payload, separators=(',', ':'), sort_keys=True, ensure_ascii=True)

    js = HEADER % (SRC, EPS_DIV, EPS_MIN, EPS_MAX, Q, 1.0 / Q, LAND_EPS)
    js += 'window.AD_WORLD=(function(){\nvar P=/*DATA*/' + blob + '/*ENDDATA*/;\n'
    js += DECODER
    open(OUT, 'w').write(js)
    size = os.path.getsize(OUT)

    # ---- 8. self-check -------------------------------------------------
    log('\n=== SELF-CHECK ==========================================')
    log('file            %s' % OUT)
    log('bytes           %d  (%.1f KB of 300 KB budget)' % (size, size / 1024.0))
    log('countries       %d with geometry' % len(G))
    log('rings           %d  (%d enclave holes)' % (stats['rings'], stats['holes']))
    log('points          %d  (source arcs held %d)'
        % (stats['pts'], sum(len(a) for a in arcs)))
    log('quantization    1/%d deg = %.4f deg (max %.4f deg snap error)'
        % (Q, 1.0 / Q, 0.5 / Q * math.sqrt(2)))

    json.loads(blob)      # strict-JSON payload parses
    log('payload         strict JSON, %d bytes, json.loads OK' % len(blob))

    # decode round-trip through the python mirror of the JS decoder
    maxerr = 0.0
    worst_iso = None
    for iso, s in G.items():
        for rs in s.split(','):
            dec_ring(rs)
        if err_of.get(iso, 0) > maxerr:
            maxerr = err_of[iso]
            worst_iso = iso
    log('decoder         %d country strings re-decoded with no error' % len(G))
    log('max shape error %.4f deg (%s) -- max distance from any original vertex'
        % (maxerr, worst_iso))
    top = sorted(err_of.items(), key=lambda kv: -kv[1])[:8]
    log('  worst 8: ' + ', '.join('%s %.3f' % (k, v) for k, v in top))
    med = sorted(err_of.values())[len(err_of) // 2]
    log('  median country shape error %.4f deg' % med)

    if tiny_fix:
        log('bbox-quad fallback (too small to survive quantization): %s'
            % ', '.join(tiny_fix))
    if dropped_rings:
        tot = sum(dropped_rings.values())
        log('skipped %d speck islands (<%.1f%% of the country largest ring) across %d countries'
            % (tot, RING_REL * 100, len(dropped_rings)))

    # coverage vs countries-full
    missing = sorted([(byiso[k].get('area') or 0, k, byiso[k]['name']['common'])
                      for k in byiso if k not in G and (byiso[k].get('area') or 0) > 5000],
                     reverse=True)
    log('\nAREA > 5000 km2 WITH NO GEOMETRY: %d' % len(missing))
    for a, k, n in missing:
        log('   %9.0f km2  %s %s' % (a, k, n))
    nogeo = sorted([k for k in byiso if k not in G])
    log('no geometry at all (%d): %s' % (len(nogeo), ' '.join(nogeo)))
    extra = sorted([k for k in G if k not in byiso])
    log('geometry for codes not in countries-full: %s' % (extra or 'none'))

    # centroid-inside checks
    log('\nCENTROID INSIDE COUNTRY (contract list):')
    checks = ['ID', 'PH', 'JP', 'GR', 'NO', 'CL', 'US', 'RU', 'FR']
    allok = True
    for iso in checks + sorted(k for k in G if k not in checks):
        m = META[iso]
        c = (m[0] / float(Q) - 180.0, m[1] / float(Q) - 90.0)
        rings = [[(x / float(Q) - 180.0, y / float(Q) - 90.0) for x, y in dec_ring(r)]
                 for r in G[iso].split(',')]
        outers = [r for r in rings if shoelace(r) > 0]
        big = max(outers, key=lambda r: abs(shoelace(r)))
        if m[4] > 360 * Q:                       # antimeridian frame
            lo = m[2] / float(Q) - 180.0
            big = [(p[0] + 360 if p[0] < lo else p[0], p[1]) for p in big]
        ok = point_in_ring(c, big)
        if iso in checks:
            log('  %s %-3s centroid [%8.3f, %7.3f] %s largest polygon'
                % ('OK  ' if ok else 'FAIL', iso, c[0], c[1],
                   'inside' if ok else 'OUTSIDE'))
        if not ok:
            allok = False
            if iso not in checks:
                log('  FAIL %-3s centroid outside largest polygon' % iso)
    log('centroid-inside: %s for all %d countries'
        % ('PASS' if allok else 'FAIL', len(G)))
    log('area-weighted centroid needed an interior-point fallback for %d countries: %s'
        % (len(fallbacks), ' '.join(sorted(fallbacks))))
    if unfixable:
        log('NO interior point found for: %s' % ' '.join(sorted(unfixable)))

    # bbox consistency with rings
    bad = []
    for iso in G:
        m = META[iso]
        rings = [[(x, y) for x, y in dec_ring(r)] for r in G[iso].split(',')]
        pts = [p for r in rings for p in r]
        shift = (m[4] > 360 * Q)
        if shift:
            pts = [((x + 360 * Q) if x < m[2] else x, y) for x, y in pts]
        bb = bbox_of(pts)
        if [bb[0], bb[1], bb[2], bb[3]] != [m[2], m[3], m[4], m[5]]:
            bad.append(iso)
    log('bbox == bbox(rings) for %d/%d countries%s'
        % (len(G) - len(bad), len(G), '' if not bad else ' -- MISMATCH: ' + str(bad)))

    am = [k for k in G if META[k][4] > 360 * Q]
    log('antimeridian frame (bbox maxLon > 180): %s' % ' '.join(sorted(am)))

    log('\nsize breakdown: geometry %.1f KB, meta %.1f KB, land %.1f KB, code %.1f KB'
        % (sum(len(v) + len(k) + 6 for k, v in G.items()) / 1024.0,
           len(json.dumps(META, separators=(',', ':'))) / 1024.0,
           len(L) / 1024.0,
           (size - len(blob)) / 1024.0))
    open(os.path.join(HERE, 'world_selfcheck.txt'), 'w').write('\n'.join(log_lines) + '\n')
    return 0


HEADER = '''/* core/data/world.js  --  window.AD_WORLD
 * Country outline geometry for map rendering, click-to-guess maps, silhouette
 * quizzes and the world backdrop.
 *
 * SOURCE : Natural Earth 1:50m admin-0 countries (public domain) as TopoJSON,
 *          _build/%s ; ISO numeric -> ISO2 and land areas from
 *          mledoze/countries (_build/countries-full.json, MIT).
 * BUILT  : _build/gen_world.py  (re-runnable, deterministic).  Do not hand-edit.
 *
 * Douglas-Peucker simplified at the ARC level (so neighbouring countries keep
 * sharing identical vertices and a filled map has no gaps), epsilon per country
 * = sqrt(area of largest ring)/%.0f clamped to [%.3f, %.2f] degrees.
 * Coordinates are quantized to 1/%d degree (%.5f deg, ~0.9 km) and stored as
 * zig-zag varint deltas in a base64 alphabet; rings are separated by ",".
 * The world backdrop is a coarser pass (eps %.2f deg) over the merged land
 * outline -- it is NOT vertex-identical to the country rings.
 *
 * API
 *   AD_WORLD.rings("IR")    -> [ [[lon,lat],...], ... ]  closed rings, degrees.
 *                              Exterior rings wind CCW (positive shoelace);
 *                              the few enclave holes (Lesotho in ZA, San Marino
 *                              and the Vatican in IT, the Fergana enclaves, ...)
 *                              follow their parent wound CW, so filling every
 *                              ring in one path is correct under both the
 *                              nonzero and even-odd rules.
 *   AD_WORLD.all()          -> sorted array of every ISO2 with geometry.
 *   AD_WORLD.centroid("IR") -> [lon,lat], area-weighted over the LARGEST polygon
 *                              (so it lands on land, not in the sea).
 *   AD_WORLD.bbox("IR")     -> [minLon,minLat,maxLon,maxLat].
 *   AD_WORLD.land()         -> rings for all land, for a cheap world backdrop.
 *
 * ANTIMERIDIAN: rings() longitudes are always in [-180,180]. For the handful of
 * countries that straddle 180 degrees, bbox()/centroid() are given in a
 * continuous frame where maxLon may exceed 180; to draw in that frame add 360
 * to any ring longitude smaller than bbox()[0].
 *
 * Geometry is decoded lazily on first use and cached; centroid/bbox are
 * precomputed, so loading this file costs only the JSON parse.
 */
'''

DECODER = r'''var AL="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
var VAL={},i=0;for(;i<64;i++)VAL[AL.charAt(i)]=i;
var Q=P.q,G=P.g,M=P.m,cache={},landCache=null,codes=null;
function ring(t){
  var pts=[],n=t.length,j=0,x=0,y=0,k,r,sh,b;
  while(j<n){
    for(k=0;k<2;k++){
      r=0;sh=0;
      do{b=VAL[t.charAt(j++)];r+=(b&31)<<sh;sh+=5;}while(b>=32);
      r=(r&1)?-((r>>1)+1):(r>>1);
      if(k===0)x+=r;else y+=r;
    }
    pts.push([x/Q-180,y/Q-90]);
  }
  if(pts.length>2)pts.push([pts[0][0],pts[0][1]]);
  return pts;
}
function rings(iso){
  if(!iso)return null;
  iso=String(iso).toUpperCase();
  if(cache[iso])return cache[iso];
  var s=G[iso];if(s===undefined)return null;
  var parts=s.split(","),out=[],k;
  for(k=0;k<parts.length;k++)out.push(ring(parts[k]));
  cache[iso]=out;return out;
}
return{
  rings:rings,
  all:function(){if(!codes){codes=[];for(var k in G)if(G.hasOwnProperty(k))codes.push(k);codes.sort();}return codes.slice();},
  has:function(iso){return !!(iso&&G[String(iso).toUpperCase()]);},
  centroid:function(iso){var m=M[String(iso||"").toUpperCase()];return m?[m[0]/Q-180,m[1]/Q-90]:null;},
  bbox:function(iso){var m=M[String(iso||"").toUpperCase()];return m?[m[2]/Q-180,m[3]/Q-90,m[4]/Q-180,m[5]/Q-90]:null;},
  land:function(){
    if(!landCache){var p=P.l.split(","),o=[],k;for(k=0;k<p.length;k++)o.push(ring(p[k]));landCache=o;}
    return landCache;
  }
};
})();
'''

if __name__ == '__main__':
    sys.exit(main())
