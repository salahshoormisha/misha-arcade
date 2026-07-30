#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lingua_geo.py — annotate the UDHR candidate list with the country each language's
recorded location actually falls in.

The corpus index carries a `loc="lat,lon"` for every translation. Turning that
into an ISO2 answer set by nearest-centroid is wrong near borders and inside big
countries, so this does real point-in-polygon against the Natural Earth
TopoJSON already cached at _build/countries-110m.json, and falls back to nearest
centroid (reported as such) only when the point lands in the sea.

    python3 _build/lingua_geo.py            # rewrites cache/lingua_candidates.json in place
    python3 _build/lingua_geo.py --list     # print the table

The suggestion is a STARTING POINT for a human author, never the final answer:
a language's `countries` set should list everywhere it is actually spoken.
Stdlib only.
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TOPO = os.path.join(HERE, 'countries-110m.json')
CANDS = os.path.join(HERE, 'cache', 'lingua_candidates.json')


def load_countries():
    import re
    src = open(os.path.join(ROOT, 'core', 'data', 'countries.js'), encoding='utf-8').read()
    m = re.search(r'window\.AD_COUNTRIES\s*=\s*(\[.*?\n\]);', src, re.S)
    return json.loads(m.group(1))


def decode_topology(topo):
    """TopoJSON -> {numeric_id: [ring, ...]} in degrees. Outer rings only."""
    tx = topo['transform']
    sx, sy = tx['scale']
    dx, dy = tx['translate']

    arcs = []
    for arc in topo['arcs']:
        x = y = 0
        pts = []
        for ax, ay in arc:
            x += ax
            y += ay
            pts.append((x * sx + dx, y * sy + dy))
        arcs.append(pts)

    def ring(idxs):
        out = []
        for i in idxs:
            a = arcs[~i][::-1] if i < 0 else arcs[i]
            out.extend(a if not out else a[1:])
        return out

    out = {}
    for g in topo['objects']['countries']['geometries']:
        gid = g.get('id')
        if gid is None:
            continue
        polys = []
        if g['type'] == 'Polygon':
            polys = [g['arcs']]
        elif g['type'] == 'MultiPolygon':
            polys = [p for p in g['arcs']]
        rings = []
        for p in polys:
            if p:
                rings.append(ring(p[0]))          # outer ring of each part
        out[int(gid)] = rings
    return out


def in_ring(lon, lat, ring):
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > lat) != (yj > lat):
            xint = (xj - xi) * (lat - yi) / (yj - yi) + xi
            if lon < xint:
                inside = not inside
        j = i
    return inside


def main():
    topo = json.load(open(TOPO, encoding='utf-8'))
    geo = decode_topology(topo)
    countries = load_countries()
    by_num = {}
    for c in countries:
        if c.get('num'):
            by_num[int(c['num'])] = c['i']

    cands = json.load(open(CANDS, encoding='utf-8'))
    hit = miss = 0
    for cd in cands:
        loc = cd.get('loc')
        cd['geo'] = None
        cd['geo_how'] = 'no location in the corpus index'
        if not loc:
            miss += 1
            continue
        lat, lon = loc
        found = None
        for num, rings in geo.items():
            for r in rings:
                if in_ring(lon, lat, r):
                    found = by_num.get(num)
                    break
            if found:
                break
        if found:
            cd['geo'] = found
            cd['geo_how'] = 'point-in-polygon'
            hit += 1
        else:
            best, bd = None, 1e9
            for c in countries:
                ll = c.get('ll') or c.get('capll')
                if not ll:
                    continue
                d = (ll[0] - lat) ** 2 + ((ll[1] - lon) * 0.7) ** 2
                if d < bd:
                    bd, best = d, c['i']
            cd['geo'] = best
            cd['geo_how'] = 'nearest centroid (point fell in water)'
            miss += 1

    json.dump(cands, open(CANDS, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('annotated %d candidates: %d point-in-polygon, %d fallback/none'
          % (len(cands), hit, miss))
    if '--list' in sys.argv:
        for cd in sorted(cands, key=lambda d: (d['sc'], d['name'])):
            print('%-14s %-6s %-5s %-38s %s'
                  % (cd['f'], cd['iso'], cd['sc'], cd['name'][:38], cd['geo']))
    return 0


if __name__ == '__main__':
    sys.exit(main())
