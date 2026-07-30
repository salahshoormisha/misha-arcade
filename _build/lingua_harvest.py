#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lingua_harvest.py — pull the whole UDHR translation corpus so LINGUAGUESSR can
be widened from 93 samples to 400+.

Every passage this produces is VERBATIM published text: the Universal
Declaration of Human Rights, from the corpus at
https://github.com/eric-muller/udhr (data/udhr/udhr_<code>.xml), which is the
continuation of the Unicode Consortium's retired "UDHR in Unicode".  Nothing is
composed, machine-translated or transliterated.

    python3 _build/lingua_harvest.py            # fetch + cache + write the candidate index
    python3 _build/lingua_harvest.py --offline  # use only what is already cached

Output: _build/cache/lingua_candidates.json
  [ { "f": file code, "iso": iso639-3, "sc": ISO15924, "name": corpus name,
      "loc": [lat,lon] or null, "art": article, "para": index,
      "text": passage, "gloss": the English of the SAME article+paragraph,
      "chars": sorted distinctive non-ASCII letters present } ]

Stdlib only. Deterministic: same cache -> byte-identical output.
"""

import json
import os
import re
import sys
import time
import unicodedata
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import gen_lingua as GL   # noqa: E402  fetching/cleaning/selection helpers, reused verbatim

OUT = os.path.join(GL.CACHE, 'lingua_candidates.json')
OFFLINE = '--offline' in sys.argv

# Length windows by script, mirroring gen_lingua's reasoning: one character
# carries a whole morpheme in a logographic or syllabic script, so a shorter
# string is still a generous visual sample.
DENSE = {'Hans', 'Hant', 'Hani', 'Jpan', 'Kore', 'Yiii', 'Ethi', 'Cans', 'Cher', 'Tibt', 'Dzo'}


def index_rows():
    p = GL.cached(os.path.join(GL.CACHE, 'udhr_index.xml'), GL.UDHR_INDEX_URL, 10000)
    rows = []
    for u in ET.parse(p).getroot():
        f = u.get('f')
        if not f:
            continue
        loc = None
        if u.get('loc'):
            try:
                lat, lon = [float(x) for x in u.get('loc').split(',')]
                loc = [lat, lon]
            except ValueError:
                loc = None
        rows.append({
            'f': f,
            'iso': u.get('iso639-3') or '',
            'sc': u.get('iso15924') or '',
            'bcp47': u.get('bcp47') or '',
            'dir': u.get('dir') or 'ltr',
            'stage': u.get('stage') or '',
            'name': (u.get('n') or '').strip(),
            'loc': loc,
        })
    return rows


def distinctive(text):
    """Non-ASCII letters actually present, so a script hint can be honest about
    what the player is looking at rather than generic."""
    seen = []
    for ch in text:
        if ord(ch) < 128:
            continue
        if unicodedata.category(ch)[0] != 'L' and not unicodedata.combining(ch):
            continue
        if ch not in seen:
            seen.append(ch)
    return ''.join(sorted(seen))


def main():
    rows = [r for r in index_rows() if r['stage'] == '4']
    print('index: %d stage-4 translations' % len(rows))

    # English, for the gloss. Same document, same article, same paragraph.
    if not OFFLINE:
        GL.fetch_udhr('eng')
    eng = {}
    for n, i, t in GL.udhr_paragraphs('eng'):
        eng[(n, i)] = t

    got, failed = [], []
    for k, r in enumerate(rows):
        path = GL.udhr_path(r['f'])
        if not os.path.exists(path):
            if OFFLINE:
                failed.append((r['f'], 'not cached'))
                continue
            try:
                GL.fetch_udhr(r['f'])
                time.sleep(0.05)
            except Exception as e:                       # noqa: BLE001
                failed.append((r['f'], str(e)[:60]))
                continue
        try:
            paras = GL.udhr_paragraphs(r['f'])
        except Exception as e:                           # noqa: BLE001
            failed.append((r['f'], 'parse: %s' % str(e)[:50]))
            continue
        if not paras:
            failed.append((r['f'], 'no article paragraphs'))
            continue
        r['paras'] = [(n, i, t) for n, i, t in paras if (n, i) in eng]
        if not r['paras']:
            failed.append((r['f'], 'no paragraph with an English counterpart'))
            continue
        got.append(r)
        if (k + 1) % 50 == 0:
            print('  ... %d/%d' % (k + 1, len(rows)))

    print('fetched+parsed: %d   failed: %d' % (len(got), len(failed)))
    for f, why in failed[:20]:
        print('   ! %-16s %s' % (f, why))

    out = []
    for r in got:
        # A COMPACT window on purpose. 15-20 words is already plenty to identify a
        # language, and the shipped file has to stay loadable on a phone: every
        # sample carries its English gloss too, so a 230-char passage costs nearly
        # 500 bytes before any metadata. Dense scripts get a lower floor because
        # one character there carries a whole morpheme.
        lo, hi = (45, 105) if r['sc'] in DENSE else (95, 155)
        best = None
        for n, i, t in r['paras']:
            for a, b, passage in GL.passages(t, lo, hi):
                # closest to the middle of the window, then the shortest English
                # counterpart, then the lowest article number so the pool is not
                # 400 copies of Article 1
                mid = (lo + hi) / 2.0
                score = (-abs(len(passage) - mid), -len(eng[(n, i)]), -n)
                if best is None or score > best[0]:
                    best = (score, n, i, passage)
        if best is None:
            # fall back to the single longest paragraph, truncated at a sentence
            n, i, t = max(r['paras'], key=lambda x: len(x[2]))
            ss = GL.sentences(t)
            passage = ss[0] if ss else t
            best = ((len(passage), -n), n, i, passage[:240])
        _, art, para, text = best
        out.append({
            'f': r['f'], 'iso': r['iso'], 'sc': r['sc'], 'bcp47': r['bcp47'],
            'dir': r['dir'], 'name': r['name'], 'loc': r['loc'],
            'art': art, 'para': para, 'text': text,
            'gloss': eng[(art, para)],
            'chars': distinctive(text),
        })

    out.sort(key=lambda d: (d['sc'], d['f']))
    with open(OUT, 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    print('wrote %s  (%d candidates, %d scripts)'
          % (OUT, len(out), len({d['sc'] for d in out})))
    return 0


if __name__ == '__main__':
    sys.exit(main())
