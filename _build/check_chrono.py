#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check_chrono.py — validate one authored CHRONO batch, or the whole merged bank.

    python3 _build/check_chrono.py _build/chrono_x3.json      # one batch
    python3 _build/check_chrono.py --all                      # every batch + the
                                                              # existing python bank

Rules (see _build/AUTHORING_CHRONO.md): 5 clues per entry, clue <= 190 chars, no
four-digit 1700..2100 anywhere in a clue or note, no duplicate clue text across
the whole bank, year inside 1800..2025, at most 2 entries per year.
Stdlib only.
"""

import glob
import json
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
YEAR_LO, YEAR_HI = 1800, 2025
MAX_CLUE = 190
MAX_NOTE = 150
CLUES = 5
YEAR_RE = re.compile(r'\b(1[789]\d\d|20\d\d|2100)\b')


def norm(s):
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r'[^a-z0-9 ]+', ' ', s.lower())
    return ' '.join(s.split())


def load_existing():
    """The 30 entries already shipped, from the original python bank."""
    out = []
    for mod in ['chrono_bank_a', 'chrono_bank_b', 'chrono_bank_c',
                'chrono_bank_d', 'chrono_bank_e']:
        p = os.path.join(HERE, mod + '.py')
        if not os.path.exists(p):
            continue
        ns = {}
        exec(compile(open(p, encoding='utf-8').read(), p, 'exec'), ns)  # noqa: S102
        for y, v in (ns.get('BANK') or {}).items():
            note, clues = v
            out.append({'y': y, 'n': note, 'c': list(clues), '_src': mod})
    return out


def load_json(path):
    data = json.load(open(path, encoding='utf-8'))
    if not isinstance(data, list):
        raise SystemExit('%s: top level must be a JSON array' % path)
    for e in data:
        e['_src'] = os.path.basename(path)
    return data


def validate(entries, strict_years=True):
    errs, warns = [], []
    seen_clue = {}
    per_year = {}
    for e in entries:
        tag = '%s %s' % (e.get('_src', '?'), e.get('y'))
        y = e.get('y')
        if not isinstance(y, int):
            errs.append('%s: y is not an int' % tag)
            continue
        if strict_years and not (YEAR_LO <= y <= YEAR_HI):
            errs.append('%s: year out of range %d..%d' % (tag, YEAR_LO, YEAR_HI))
        per_year.setdefault(y, []).append(e)
        c = e.get('c') or []
        if len(c) != CLUES:
            errs.append('%s: %d clues (need %d)' % (tag, len(c), CLUES))
        n = e.get('n') or ''
        if not n:
            errs.append('%s: no note' % tag)
        if len(n) > MAX_NOTE:
            errs.append('%s: note %d chars (max %d)' % (tag, len(n), MAX_NOTE))
        if YEAR_RE.search(n):
            errs.append('%s: note names a year: %r' % (tag, YEAR_RE.search(n).group(0)))
        for i, t in enumerate(c):
            if not isinstance(t, str) or not t.strip():
                errs.append('%s: clue %d empty' % (tag, i + 1))
                continue
            if len(t) > MAX_CLUE:
                errs.append('%s: clue %d is %d chars (max %d)' % (tag, i + 1, len(t), MAX_CLUE))
            m = YEAR_RE.search(t)
            if m:
                errs.append('%s: clue %d names a year (%s): %r'
                            % (tag, i + 1, m.group(0), t[:70]))
            k = norm(t)
            if k in seen_clue:
                errs.append('%s: clue %d duplicates %s' % (tag, i + 1, seen_clue[k]))
            else:
                seen_clue[k] = tag
    for y, es in sorted(per_year.items()):
        if len(es) > 2:
            errs.append('year %d has %d entries (max 2)' % (y, len(es)))
        if len(es) == 2:
            a = {norm(x) for x in es[0].get('c') or []}
            b = {norm(x) for x in es[1].get('c') or []}
            if a & b:
                errs.append('year %d: the two entries share a clue' % y)
    return errs, warns, per_year


def main():
    args = sys.argv[1:]
    if '--all' in args:
        entries = load_existing()
        for p in sorted(glob.glob(os.path.join(HERE, 'chrono_x*.json'))):
            entries += load_json(p)
    elif args:
        entries = load_existing() + load_json(args[0])
        only = os.path.basename(args[0])
        # report only on the batch under test, but dedupe against everything
        errs, warns, per_year = validate(entries)
        errs = [e for e in errs if only in e or e.startswith('year ')]
        mine = [e for e in entries if e['_src'] == only]
        print('%s: %d entries, years %s..%s'
              % (only, len(mine),
                 min(e['y'] for e in mine) if mine else '-',
                 max(e['y'] for e in mine) if mine else '-'))
        for e in errs[:60]:
            print('  X ' + e)
        print('OK' if not errs else 'FAILED (%d errors)' % len(errs))
        return 0 if not errs else 1
    else:
        print(__doc__)
        return 2

    errs, warns, per_year = validate(entries)
    print('CHRONO bank: %d entries over %d distinct years (%d..%d)'
          % (len(entries), len(per_year), min(per_year), max(per_year)))
    dec = {}
    for y in per_year:
        dec[y // 10 * 10] = dec.get(y // 10 * 10, 0) + len(per_year[y])
    print('  per decade: ' + ' '.join('%ds:%d' % (k, dec[k]) for k in sorted(dec)))
    gaps = [d for d in range(1800, 2030, 10) if d not in dec]
    if gaps:
        print('  decades with NO entries: ' + ' '.join(str(g) for g in gaps))
    for e in errs[:80]:
        print('  X ' + e)
    print('OK' if not errs else 'FAILED (%d errors)' % len(errs))
    return 0 if not errs else 1


if __name__ == '__main__':
    sys.exit(main())
