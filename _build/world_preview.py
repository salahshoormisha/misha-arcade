#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
world_preview.py -- visual QA for core/data/world.js.

Decodes the shipped file with an independent implementation of the encoding
(so it also proves the payload is self-consistent) and rasterises PNGs with a
hand-rolled scanline filler + PNG writer -- stdlib only, no PIL.

  python3 world_preview.py sheet  OUT.png  IR US JP ...   # 320px silhouettes
  python3 world_preview.py world  OUT.png                 # filled world map
  python3 world_preview.py land   OUT.png                 # backdrop only
"""

import json
import os
import re
import struct
import sys
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
JS = os.path.join(os.path.dirname(HERE), 'core', 'data', 'world.js')
ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
VAL = {c: i for i, c in enumerate(ALPHA)}


def load():
    src = open(JS).read()
    blob = src.split('/*DATA*/', 1)[1].split('/*ENDDATA*/', 1)[0]
    return json.loads(blob)


def dec_ring(s, q):
    pts = []
    i = 0
    n = len(s)
    x = y = 0
    while i < n:
        d = []
        for _ in range(2):
            r = 0
            sh = 0
            while True:
                b = VAL[s[i]]
                i += 1
                r += (b & 31) << sh
                sh += 5
                if b < 32:
                    break
            d.append(-((r >> 1) + 1) if (r & 1) else (r >> 1))
        x += d[0]
        y += d[1]
        pts.append((x / float(q) - 180.0, y / float(q) - 90.0))
    if len(pts) > 2:
        pts.append(pts[0])
    return pts


def rings(P, iso):
    return [dec_ring(s, P['q']) for s in P['g'][iso].split(',')]


# ------------------------------------------------------------------ raster
class Img(object):
    def __init__(self, w, h, bg=(7, 3, 18)):
        self.w = w
        self.h = h
        self.px = bytearray(bg * (w * h))

    def fill(self, polys, col):
        """Even-odd scanline fill; polys = list of point lists in pixel space."""
        edges = []
        ymin = 1e18
        ymax = -1e18
        for ring in polys:
            n = len(ring)
            for i in range(n):
                x0, y0 = ring[i]
                x1, y1 = ring[(i + 1) % n]
                if y0 == y1:
                    continue
                edges.append((y0, y1, x0, x1))
                ymin = min(ymin, y0, y1)
                ymax = max(ymax, y0, y1)
        if not edges:
            return
        y0i = max(0, int(ymin))
        y1i = min(self.h - 1, int(ymax) + 1)
        r, g, b = col
        for yi in range(y0i, y1i + 1):
            yc = yi + 0.5
            xs = []
            for (ay, by, ax, bx) in edges:
                if (ay > yc) != (by > yc):
                    xs.append(ax + (yc - ay) * (bx - ax) / (by - ay))
            if not xs:
                continue
            xs.sort()
            row = yi * self.w * 3
            for k in range(0, len(xs) - 1, 2):
                a = max(0, int(xs[k] + 0.5))
                bnd = min(self.w, int(xs[k + 1] + 0.5))
                for xi in range(a, bnd):
                    o = row + xi * 3
                    self.px[o] = r
                    self.px[o + 1] = g
                    self.px[o + 2] = b

    def stroke(self, polys, col):
        r, g, b = col
        for ring in polys:
            n = len(ring)
            for i in range(n):
                x0, y0 = ring[i]
                x1, y1 = ring[(i + 1) % n]
                steps = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
                for s in range(steps + 1):
                    t = s / float(steps)
                    xi = int(x0 + (x1 - x0) * t)
                    yi = int(y0 + (y1 - y0) * t)
                    if 0 <= xi < self.w and 0 <= yi < self.h:
                        o = (yi * self.w + xi) * 3
                        self.px[o] = r
                        self.px[o + 1] = g
                        self.px[o + 2] = b

    def dot(self, x, y, col, rad=3):
        r, g, b = col
        for yi in range(int(y - rad), int(y + rad) + 1):
            for xi in range(int(x - rad), int(x + rad) + 1):
                if 0 <= xi < self.w and 0 <= yi < self.h:
                    if (xi - x) ** 2 + (yi - y) ** 2 <= rad * rad:
                        o = (yi * self.w + xi) * 3
                        self.px[o] = r
                        self.px[o + 1] = g
                        self.px[o + 2] = b

    def save(self, path):
        raw = b''.join(b'\x00' + bytes(self.px[y * self.w * 3:(y + 1) * self.w * 3])
                       for y in range(self.h))
        def chunk(tag, data):
            return (struct.pack('>I', len(data)) + tag + data
                    + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))
        png = (b'\x89PNG\r\n\x1a\n'
               + chunk(b'IHDR', struct.pack('>IIBBBBB', self.w, self.h, 8, 2, 0, 0, 0))
               + chunk(b'IDAT', zlib.compress(raw, 9))
               + chunk(b'IEND', b''))
        open(path, 'wb').write(png)


# ------------------------------------------------------------------ modes
def sheet(P, out, codes, tile=320, cols=4):
    pad = 10
    rows = (len(codes) + cols - 1) // cols
    img = Img(cols * tile, rows * tile)
    for n, iso in enumerate(codes):
        if iso not in P['g']:
            print('  no geometry:', iso)
            continue
        cx = (n % cols) * tile
        cy = (n // cols) * tile
        m = P['m'][iso]
        q = float(P['q'])
        x0, y0, x1, y1 = m[2] / q - 180, m[3] / q - 90, m[4] / q - 180, m[5] / q - 90
        sc = min((tile - 2 * pad) / max(1e-9, x1 - x0), (tile - 2 * pad) / max(1e-9, y1 - y0))
        ox = cx + (tile - (x1 - x0) * sc) / 2
        oy = cy + (tile - (y1 - y0) * sc) / 2

        def proj(p):
            lon = p[0] + 360 if p[0] < x0 - 1e-9 else p[0]
            return (ox + (lon - x0) * sc, oy + (y1 - p[1]) * sc)
        polys = [[proj(p) for p in r] for r in rings(P, iso)]
        img.fill(polys, (255, 79, 163))
        img.stroke(polys, (255, 227, 243))
        c = (m[0] / q - 180, m[1] / q - 90)
        img.dot(proj(c)[0], proj(c)[1], (79, 216, 255), 4)
    img.save(out)
    print('wrote', out, img.w, 'x', img.h)


def world(P, out, w=1400, backdrop=False):
    h = w // 2
    img = Img(w, h)
    q = float(P['q'])

    def proj(p):
        return ((p[0] + 180) * w / 360.0, (90 - p[1]) * h / 180.0)
    if backdrop:
        polys = [[proj(p) for p in dec_ring(s, P['q'])] for s in P['l'].split(',')]
        img.fill(polys, (61, 224, 138))
    else:
        cols = [(255, 79, 163), (79, 216, 255), (255, 216, 79), (61, 224, 138),
                (177, 140, 255)]
        for n, iso in enumerate(sorted(P['g'])):
            polys = [[proj(p) for p in r] for r in rings(P, iso)]
            img.fill(polys, cols[n % len(cols)])
        for iso in sorted(P['g']):
            m = P['m'][iso]
            img.dot(*(list(proj((m[0] / q - 180 if m[0] / q - 180 <= 180 else
                                 m[0] / q - 540, m[1] / q - 90))) + [(7, 3, 18), 2]))
    img.save(out)
    print('wrote', out, w, 'x', h)


if __name__ == '__main__':
    P = load()
    mode = sys.argv[1]
    out = sys.argv[2]
    if mode == 'sheet':
        sheet(P, out, [c.upper() for c in sys.argv[3:]])
    elif mode == 'world':
        world(P, out)
    elif mode == 'land':
        world(P, out, backdrop=True)
