#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check_cluedrop_notes.py — validate an authored CLUEDROP notes batch.

    python3 _build/check_cluedrop_notes.py _build/cluedrop_x1.json
    python3 _build/check_cluedrop_notes.py --all        # every batch + the shipped file

Rules (see _build/AUTHORING_CLUEDROP.md): every ISO2 exists in countries.js,
2..3 notes each, tag <= 12 chars uppercase, sentence <= 130 chars, and the
sentence never names its own country / capital / demonym / alternative names.
Stdlib only.
"""

import glob
import json
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MAX_NOTE = 130
MAX_TAG = 12


def load_countries():
    src = open(os.path.join(ROOT, 'core', 'data', 'countries.js'), encoding='utf-8').read()
    m = re.search(r'window\.AD_COUNTRIES\s*=\s*(\[.*?\n\]);', src, re.S)
    return json.loads(m.group(1))


def fold(s):
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z ]+', ' ', s.lower())


def own_terms(c):
    """Every string that would give this country away."""
    out = set()
    for s in [c.get('n'), c.get('cap'), c.get('demo'), c.get('n3')] + list(c.get('alt') or []):
        if s and len(s) >= 4:
            out.add(fold(s).strip())
    # a couple of obvious adjective forms the DB does not carry
    n = fold(c.get('n') or '').strip()
    for suf in ('n', 'an', 'ian', 'ese', 'ish'):
        if len(n) > 4:
            out.add(n + suf)
    return {t for t in out if len(t) >= 4}


def shipped_notes():
    src = open(os.path.join(ROOT, 'core', 'data', 'cluedrop.js'), encoding='utf-8').read()
    i = src.index('notes:')
    out = {}
    for iso, body in re.findall(r'\n    ([A-Z]{2}): \[(.*?)\n    \]', src[i:], re.S):
        out[iso] = re.findall(r'\["([A-Z ]+)",\s*"(.*?)"\]', body, re.S)
    return out


def validate(batches, countries, prior):
    by = {c['i']: c for c in countries}
    errs = []
    seen_text = {}
    for iso, notes in prior.items():
        for tag, txt in notes:
            seen_text[fold(txt).strip()] = 'shipped:' + iso
    for src, data in batches:
        for iso, notes in data.items():
            tag0 = '%s %s' % (src, iso)
            c = by.get(iso)
            if not c:
                errs.append('%s: not an ISO2 in countries.js' % tag0)
                continue
            if iso in prior:
                errs.append('%s: already has notes in the shipped file' % tag0)
            if not (2 <= len(notes) <= 3):
                errs.append('%s: %d notes (need 2 or 3)' % (tag0, len(notes)))
            bad = own_terms(c)
            for n in notes:
                if not (isinstance(n, list) and len(n) == 2):
                    errs.append('%s: note is not [TAG, text]: %r' % (tag0, n))
                    continue
                tag, txt = n
                if not re.match(r'^[A-Z][A-Z ]{1,%d}$' % (MAX_TAG - 1), tag):
                    errs.append('%s: bad tag %r' % (tag0, tag))
                if not txt or len(txt) > MAX_NOTE:
                    errs.append('%s: note %d chars (max %d): %r'
                                % (tag0, len(txt or ''), MAX_NOTE, (txt or '')[:50]))
                if txt and not txt.rstrip().endswith('.'):
                    errs.append('%s: note does not end in a full stop: %r' % (tag0, txt[:50]))
                f = ' ' + fold(txt or '').strip() + ' '
                for t in sorted(bad):
                    if ' ' + t + ' ' in f or f.strip().startswith(t + ' ') or f.strip() == t:
                        errs.append('%s: note gives the answer away (%r): %r' % (tag0, t, txt[:60]))
                        break
                k = fold(txt or '').strip()
                if k in seen_text:
                    errs.append('%s: note text duplicates %s' % (tag0, seen_text[k]))
                else:
                    seen_text[k] = tag0
    return errs


def main():
    args = sys.argv[1:]
    countries = load_countries()
    prior = shipped_notes()
    if '--all' in args:
        paths = sorted(glob.glob(os.path.join(HERE, 'cluedrop_x*.json')))
    elif args:
        paths = [args[0]]
    else:
        print(__doc__)
        return 2
    batches = [(os.path.basename(p), json.load(open(p, encoding='utf-8'))) for p in paths]
    errs = validate(batches, countries, prior)
    n = sum(len(d) for _, d in batches)
    by = {c['i']: c for c in countries}
    un_new = sum(1 for _, d in batches for i in d if by.get(i, {}).get('un') == 1)
    print('%d countries in %d batch(es); %d are UN members (the CLUEDROP pool)'
          % (n, len(batches), un_new))
    print('pool after merge: %d' % (len([i for i in prior if by.get(i, {}).get('un') == 1]) + un_new))
    for e in errs[:80]:
        print('  X ' + e)
    print('OK' if not errs else 'FAILED (%d errors)' % len(errs))
    return 0 if not errs else 1


if __name__ == '__main__':
    sys.exit(main())
