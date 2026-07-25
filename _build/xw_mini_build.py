#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
xw_mini_build.py -- assemble + validate + emit the 40 5x5 minis.

  xw_words.py   builds the frequency-ranked, dictionary-validated fill pool
  xw_fill.py    fills the grids (backtracking search) and freezes them into
                _build/xw_mini_fills.json
  xw_clues.py   hand-authored clue bank, one clue per distinct answer
  THIS FILE     numbers the grids, attaches clues, sets par, validates every
                invariant and writes _build/crosswords-mini.json

Run:  python3 xw_words.py && python3 xw_fill.py && python3 xw_mini_build.py
"""
import json
import os
import sys

import xw_fill
import xw_words

B = os.path.dirname(os.path.abspath(__file__))


def par_for(ranks, grid):
    """Target seconds for a good solver.  Commoner fill -> faster."""
    mean = sum(ranks) / float(len(ranks))
    worst = max(ranks)
    blocks = sum(row.count('#') for row in grid)
    p = 46 + mean * 0.0034 + worst * 0.0011 - blocks * 1.5
    p = int(round(p / 5.0) * 5)
    return max(45, min(120, p))


def build():
    with open(os.path.join(B, 'xw_mini_fills.json')) as f:
        fills = json.load(f)
    try:
        import xw_clues
    except ImportError:
        print('xw_clues.py not present yet -- run after authoring clues')
        return None
    CLUES = xw_clues.CLUES
    OVERRIDE = getattr(xw_clues, 'OVERRIDE', {})
    THEMES = getattr(xw_clues, 'THEMES', {})

    pool = xw_words.load()
    rank = {}
    for L in (3, 4, 5):
        rank.update(pool[L])

    puzzles = []
    missing = []
    for i, p in enumerate(fills['puzzles']):
        pid = 'm%03d' % (i + 1)
        blocks = [tuple(b) for b in p['blocks']]
        grid = p['grid']
        a, d = xw_fill.entries_of(grid, blocks)
        ent = {'across': [], 'down': []}
        for key, lst in (('across', a), ('down', d)):
            for (n, r, c, ln, ans) in lst:
                ck = (pid, key[0].upper(), n)
                clue = OVERRIDE.get(ck) or CLUES.get(ans)
                if not clue:
                    missing.append((pid, key, n, ans))
                    clue = ''
                ent[key].append({'n': n, 'r': r, 'c': c, 'len': ln,
                                 'ans': ans.upper(), 'clue': clue})
        ranks = [rank.get(e[4], 9000) for e in a + d]
        puzzles.append({
            'id': pid,
            'size': 5,
            'grid': [row.upper() for row in grid],
            'across': ent['across'],
            'down': ent['down'],
            'par': par_for(ranks, grid),
            'theme': THEMES.get(pid),
        })

    if missing:
        print('MISSING CLUES: %d' % len(missing))
        for m in missing[:40]:
            print('   ', m)
        return None
    return puzzles


# ----------------------------------------------------------------- validation
def validate(puzzles):
    ok = True
    errs = []
    pool = xw_words.load()
    dictwords = set()
    for L in (3, 4, 5):
        dictwords |= set(pool[L])

    def bad(msg):
        errs.append(msg)

    grids_seen = {}
    for p in puzzles:
        g = p['grid']
        pid = p['id']
        if len(g) != 5 or any(len(r) != 5 for r in g):
            bad('%s: grid is not 5x5' % pid)
            continue
        white = [(r, c) for r in range(5) for c in range(5) if g[r][c] != '#']
        # connected
        seen = {white[0]}
        st = [white[0]]
        while st:
            r, c = st.pop()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (r + dr, c + dc)
                if 0 <= n[0] < 5 and 0 <= n[1] < 5 and n not in seen and g[n[0]][n[1]] != '#':
                    seen.add(n)
                    st.append(n)
        if len(seen) != len(white):
            bad('%s: grid not connected' % pid)
        # recompute numbering independently of the generator
        blocks = [(r, c) for r in range(5) for c in range(5) if g[r][c] == '#']
        a, d = xw_fill.entries_of([row for row in g], blocks)
        exp_a = [(n, r, c, ln, ans) for (n, r, c, ln, ans) in a]
        got_a = [(e['n'], e['r'], e['c'], e['len'], e['ans']) for e in p['across']]
        exp_d = [(n, r, c, ln, ans) for (n, r, c, ln, ans) in d]
        got_d = [(e['n'], e['r'], e['c'], e['len'], e['ans']) for e in p['down']]
        if exp_a != got_a:
            bad('%s: across numbering/answers mismatch' % pid)
        if exp_d != got_d:
            bad('%s: down numbering/answers mismatch' % pid)
        # every white square in exactly one across and one down entry
        cov_a, cov_d = {}, {}
        for e in p['across']:
            for k in range(e['len']):
                cov_a[(e['r'], e['c'] + k)] = cov_a.get((e['r'], e['c'] + k), 0) + 1
        for e in p['down']:
            for k in range(e['len']):
                cov_d[(e['r'] + k, e['c'])] = cov_d.get((e['r'] + k, e['c']), 0) + 1
        for sq in white:
            if cov_a.get(sq) != 1:
                bad('%s: square %s not in exactly one across' % (pid, sq))
            if cov_d.get(sq) != 1:
                bad('%s: square %s not in exactly one down' % (pid, sq))
        if len(cov_a) != len(white) or len(cov_d) != len(white):
            bad('%s: entry coverage exceeds white squares' % pid)
        # answers
        answers = []
        for e in p['across'] + p['down']:
            ans = e['ans']
            answers.append(ans)
            if len(ans) != e['len']:
                bad('%s %s: length mismatch' % (pid, ans))
            if e['len'] < 3:
                bad('%s %s: entry shorter than 3' % (pid, ans))
            if ans.lower() not in dictwords:
                bad('%s %s: not in fill dictionary' % (pid, ans))
            # letters must match the grid
            for k in range(e['len']):
                rr = e['r'] + (k if e in p['down'] else 0)
                cc = e['c'] + (0 if e in p['down'] else k)
            if not e['clue'] or not e['clue'].strip():
                bad('%s %s: empty clue' % (pid, ans))
            cl = e['clue'].lower().replace('-', ' ')
            if ans.lower() in cl.replace(' ', '') or ans.lower() in cl:
                bad('%s %s: clue contains its own answer (%r)' % (pid, ans, e['clue']))
        if len(set(answers)) != len(answers):
            dup = [x for x in set(answers) if answers.count(x) > 1]
            bad('%s: duplicate answers %s' % (pid, dup))
        key = tuple(g)
        if key in grids_seen:
            bad('%s: duplicate grid (same as %s)' % (pid, grids_seen[key]))
        grids_seen[key] = pid
        if not (45 <= p['par'] <= 120):
            bad('%s: par out of range (%s)' % (pid, p['par']))
    return errs


def letters_consistent(puzzles):
    """Across/down answers must agree with the grid letters."""
    errs = []
    for p in puzzles:
        g = p['grid']
        for e in p['across']:
            got = g[e['r']][e['c']:e['c'] + e['len']]
            if got != e['ans']:
                errs.append('%s A%d: grid %r vs ans %r' % (p['id'], e['n'], got, e['ans']))
        for e in p['down']:
            got = ''.join(g[e['r'] + k][e['c']] for k in range(e['len']))
            if got != e['ans']:
                errs.append('%s D%d: grid %r vs ans %r' % (p['id'], e['n'], got, e['ans']))
    return errs


def main():
    puzzles = build()
    if puzzles is None:
        sys.exit(1)
    errs = validate(puzzles) + letters_consistent(puzzles)
    allans = []
    for p in puzzles:
        allans += [e['ans'] for e in p['across'] + p['down']]
    uniq = sorted(set(allans))
    reuse = {}
    for a in allans:
        reuse[a] = reuse.get(a, 0) + 1
    pool = xw_words.load()
    rank = {}
    for L in (3, 4, 5):
        rank.update(pool[L])

    print('=== crosswords-mini self-check ===')
    print('puzzles                 : %d' % len(puzzles))
    print('entries                 : %d  (avg %.1f/puzzle)'
          % (len(allans), len(allans) / float(len(puzzles))))
    print('distinct answers        : %d' % len(uniq))
    print('answers used twice      : %d   (max reuse %d)'
          % (sum(1 for v in reuse.values() if v == 2), max(reuse.values())))
    print('distinct grids          : %d' % len(set(tuple(p['grid']) for p in puzzles)))
    print('distinct block patterns : %d'
          % len(set(tuple(sorted((r, c) for r in range(5) for c in range(5)
                                 if p['grid'][r][c] == '#')) for p in puzzles)))
    print('par range               : %d-%d (mean %.1f)'
          % (min(p['par'] for p in puzzles), max(p['par'] for p in puzzles),
             sum(p['par'] for p in puzzles) / float(len(puzzles))))
    print('worst freq rank in set  : %d (%s)'
          % (max(rank.get(a.lower(), 99999) for a in uniq),
             max(uniq, key=lambda a: rank.get(a.lower(), 99999))))
    print('clue length             : min %d, max %d, mean %.1f'
          % (min(len(e['clue']) for p in puzzles for e in p['across'] + p['down']),
             max(len(e['clue']) for p in puzzles for e in p['across'] + p['down']),
             sum(len(e['clue']) for p in puzzles for e in p['across'] + p['down'])
             / float(len(allans))))
    if errs:
        print('\nVALIDATION FAILURES: %d' % len(errs))
        for e in errs[:60]:
            print('   ', e)
        sys.exit(1)
    print('validation              : ALL CHECKS PASSED')

    out = {'mini': puzzles}
    path = os.path.join(B, 'crosswords-mini.json')
    with open(path, 'w') as f:
        json.dump(out, f, ensure_ascii=True, separators=(',', ':'), sort_keys=False)
    print('wrote %s (%d bytes)' % (path, os.path.getsize(path)))
    # round-trip
    with open(path) as f:
        json.load(f)
    print('round-trip json.load    : OK')


if __name__ == '__main__':
    main()
