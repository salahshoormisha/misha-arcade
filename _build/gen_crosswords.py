#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_crosswords.py -- assemble, validate and emit core/data/crosswords.js.

Pipeline
    xw_words.py       -> _build/xw_pool.json      frequency-ranked, dictionary-validated pool
    xw_fill.py        -> _build/xw_mini_fills.json  40 5x5 fills (backtracking search)
    xw_midi_fill.py   -> _build/midi_fills.json     7x7 fills, 180-degree symmetric patterns
    xw_clues.py       -> the hand-authored clue bank, keyed by ANSWER
    THIS FILE         -> numbers the grids, attaches clues, sets par, validates every
                         invariant in CONTRACT.md section 6, writes core/data/crosswords.js

Checkpoint behaviour: a puzzle is emitted only when EVERY one of its entries has a
clue.  Partly-clued puzzles are skipped and listed, so this script can be re-run after
each batch of authored clues and the shipped file is always valid and loadable.

Run:  python3 _build/gen_crosswords.py
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'core', 'data', 'crosswords.js')
sys.path.insert(0, HERE)

import xw_clues                                                   # noqa: E402
import xw_words                                                   # noqa: E402


# --------------------------------------------------------------------- clues ---
def clue_bank():
    """ANSWER -> [clue, ...].  A word reused across puzzles gets its next clue from the
    list, so repeats do not read as copy-paste; a one-clue word just repeats it."""
    bank = {}
    for k, v in xw_clues.CLUES.items():
        bank[k.upper()] = [v] if isinstance(v, str) else list(v)
    return bank


# ---------------------------------------------------------------- numbering ---
def entries_of(grid):
    """Standard crossword numbering, recomputed from the grid alone."""
    n = len(grid)
    white = lambda r, c: 0 <= r < n and 0 <= c < n and grid[r][c] != '#'
    num = 0
    across, down = [], []
    for r in range(n):
        for c in range(n):
            if not white(r, c):
                continue
            sa = (not white(r, c - 1)) and white(r, c + 1)
            sd = (not white(r - 1, c)) and white(r + 1, c)
            if not (sa or sd):
                continue
            num += 1
            if sa:
                c2 = c
                while white(r, c2):
                    c2 += 1
                across.append({'n': num, 'r': r, 'c': c, 'len': c2 - c,
                               'ans': grid[r][c:c2]})
            if sd:
                r2 = r
                while white(r2, c):
                    r2 += 1
                down.append({'n': num, 'r': r, 'c': c, 'len': r2 - r,
                             'ans': ''.join(grid[x][c] for x in range(r, r2))})
    return across, down


# ---------------------------------------------------------------------- par ---
def par_mini(ranks, grid):
    """Target seconds for a strong solver.  Commoner fill -> faster; more blocks ->
    fewer squares -> faster.  Clamped to the 45-120 s band the contract asks for."""
    mean = sum(ranks) / float(len(ranks))
    worst = max(ranks)
    blocks = sum(row.count('#') for row in grid)
    p = 52 + mean * 0.0042 + worst * 0.0013 - blocks * 2.0
    return int(max(45, min(120, round(p / 5.0) * 5)))


def par_midi(ranks, grid, themed):
    """150-360 s band.  A theme gives a foothold, so themed midis get a small discount."""
    mean = sum(ranks) / float(len(ranks))
    worst = max(ranks)
    blocks = sum(row.count('#') for row in grid)
    p = 165 + mean * 0.030 + worst * 0.011 - blocks * 3.0
    if themed:
        p -= 15
    return int(max(150, min(360, round(p / 10.0) * 10)))


# ----------------------------------------------------------------- assembly ---
def rank_map():
    pool = xw_words.load()
    rank = {}
    for L in (3, 4, 5):
        for w, r in pool[L].items():
            rank[w.upper()] = r
    return rank


def assemble(fills, kind, bank, used_count, rank, meta=None):
    """fills: list of {'grid': [...]}.  Returns (puzzles, skipped)."""
    puzzles, skipped = [], []
    size = 5 if kind == 'mini' else 7
    prefix = 'm' if kind == 'mini' else 'd'
    for i, p in enumerate(fills):
        pid = '%s%03d' % (prefix, i + 1)
        grid = [row.upper() for row in p['grid']]
        across, down = entries_of(grid)
        missing = [e['ans'] for e in across + down if e['ans'] not in bank]
        if missing:
            skipped.append((pid, sorted(set(missing))))
            continue
        for e in across + down:
            opts = bank[e['ans']]
            e['clue'] = opts[used_count.get(e['ans'], 0) % len(opts)]
            used_count[e['ans']] = used_count.get(e['ans'], 0) + 1
        ranks = [rank.get(e['ans'], 4000) for e in across + down]
        m = (meta or {}).get(pid, {})
        rec = {'id': pid, 'size': size, 'grid': grid,
               'across': across, 'down': down}
        if kind == 'mini':
            rec['par'] = par_mini(ranks, grid)
            rec['theme'] = None
            rec['title'] = None
        else:
            rec['par'] = par_midi(ranks, grid, bool(m.get('theme')))
            rec['theme'] = m.get('theme')
            rec['title'] = m.get('title')
        puzzles.append(rec)
    return puzzles, skipped


# --------------------------------------------------------------- validation ---
def dictionary():
    """Every answer must be a real word.  web2 headword, a regular inflection of one,
    or an entry of the curated crossword pool (which is itself dictionary-gated)."""
    w2 = set()
    for path in ('/usr/share/dict/words', '/usr/share/dict/connectives'):
        try:
            with open(path) as f:
                for line in f:
                    s = line.strip()
                    if s.isalpha() and s.islower():
                        w2.add(s)
        except IOError:
            pass
    pool = xw_words.load()
    for L in pool:
        w2 |= set(pool[L])
    try:
        with open(os.path.join(HERE, 'words_alpha.txt')) as f:
            extra = set(x.strip() for x in f if x.strip().isalpha())
    except IOError:
        extra = set()
    return w2, extra


def in_dict(word, w2, extra):
    w = word.lower()
    if w in w2 or w in extra:
        return True
    cands = []
    if w.endswith('s'):
        cands += [w[:-1], w[:-2], w[:-3] + 'y']
    if w.endswith('ed'):
        cands += [w[:-2], w[:-1], w[:-3]]
    if w.endswith('ing'):
        cands += [w[:-3], w[:-3] + 'e', w[:-4]]
    if w.endswith('er') or w.endswith('ly'):
        cands += [w[:-2], w[:-1]]
    if w.endswith('est'):
        cands += [w[:-3], w[:-2]]
    return any(len(c) >= 3 and c in w2 for c in cands)


STOP = set('a an and the of or in on at to for is it its with as by from that this '
           'not no you your i he she they we but if so'.split())


def validate(puzzles, size, w2, extra, symmetric, par_lo, par_hi, label):
    errs = []

    def bad(m):
        errs.append('%s %s' % (label, m))

    grids_seen = {}
    for p in puzzles:
        pid = p['id']
        g = p['grid']
        if len(g) != size or any(len(r) != size for r in g):
            bad('%s: grid is not %dx%d' % (pid, size, size))
            continue
        if any(ch != '#' and not ('A' <= ch <= 'Z') for row in g for ch in row):
            bad('%s: grid has a non A-Z, non-# character' % pid)
        white = [(r, c) for r in range(size) for c in range(size) if g[r][c] != '#']
        if not white:
            bad('%s: no white squares' % pid)
            continue

        # 1. connected
        seen = {white[0]}
        st = [white[0]]
        while st:
            r, c = st.pop()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < size and 0 <= nc < size and (nr, nc) not in seen \
                        and g[nr][nc] != '#':
                    seen.add((nr, nc))
                    st.append((nr, nc))
        if len(seen) != len(white):
            bad('%s: white squares not connected (%d of %d)' % (pid, len(seen), len(white)))

        # 2. numbering recomputed independently of the generator
        ea, ed = entries_of(g)
        key = lambda lst: [(e['n'], e['r'], e['c'], e['len'], e['ans']) for e in lst]
        if key(ea) != key(p['across']):
            bad('%s: across numbering/answers do not match the grid' % pid)
        if key(ed) != key(p['down']):
            bad('%s: down numbering/answers do not match the grid' % pid)

        # 3. every white square in exactly one across AND one down entry
        cov_a, cov_d = {}, {}
        for e in p['across']:
            for k in range(e['len']):
                sq = (e['r'], e['c'] + k)
                cov_a[sq] = cov_a.get(sq, 0) + 1
        for e in p['down']:
            for k in range(e['len']):
                sq = (e['r'] + k, e['c'])
                cov_d[sq] = cov_d.get(sq, 0) + 1
        for sq in white:
            if cov_a.get(sq) != 1:
                bad('%s: square %s is in %d across entries' % (pid, sq, cov_a.get(sq, 0)))
            if cov_d.get(sq) != 1:
                bad('%s: square %s is in %d down entries' % (pid, sq, cov_d.get(sq, 0)))
        if set(cov_a) != set(white) or set(cov_d) != set(white):
            bad('%s: entries cover squares that are not white' % pid)

        # 4. answers
        answers = []
        for e in p['across'] + p['down']:
            ans = e['ans']
            answers.append(ans)
            if e['len'] < 3:
                bad('%s %s: entry shorter than 3' % (pid, ans))
            if len(ans) != e['len']:
                bad('%s %s: len field disagrees with the answer' % (pid, ans))
            if not in_dict(ans, w2, extra):
                bad('%s %s: not in the dictionary' % (pid, ans))
            cl = (e.get('clue') or '').strip()
            if not cl:
                bad('%s %s: empty clue' % (pid, ans))
                continue
            flat = re.sub(r'[^a-z]', '', cl.lower())
            if ans.lower() in flat:
                bad('%s %s: clue contains its own answer (%r)' % (pid, ans, cl))
            # ... and no other answer in the same puzzle is given away either
            if len(cl) > 90:
                bad('%s %s: clue is too long (%d chars)' % (pid, ans, len(cl)))
        if len(set(answers)) != len(answers):
            dup = sorted(set(a for a in answers if answers.count(a) > 1))
            bad('%s: duplicate answers within the puzzle %s' % (pid, dup))

        # 5. grid letters agree with the answers
        for e in p['across']:
            if g[e['r']][e['c']:e['c'] + e['len']] != e['ans']:
                bad('%s A%d: grid letters disagree with the answer' % (pid, e['n']))
        for e in p['down']:
            if ''.join(g[e['r'] + k][e['c']] for k in range(e['len'])) != e['ans']:
                bad('%s D%d: grid letters disagree with the answer' % (pid, e['n']))

        # 6. duplicate grids across the set
        gk = tuple(g)
        if gk in grids_seen:
            bad('%s: duplicate grid (identical to %s)' % (pid, grids_seen[gk]))
        grids_seen[gk] = pid

        # 7. 180-degree rotational symmetry of the block pattern
        if symmetric:
            for r in range(size):
                for c in range(size):
                    if (g[r][c] == '#') != (g[size - 1 - r][size - 1 - c] == '#'):
                        bad('%s: block pattern is not 180-degree symmetric' % pid)
                        break
                else:
                    continue
                break

        # 8. par band
        if not (par_lo <= p['par'] <= par_hi):
            bad('%s: par %s outside %d-%d' % (pid, p['par'], par_lo, par_hi))

    ids = [p['id'] for p in puzzles]
    if len(set(ids)) != len(ids):
        errs.append('%s: duplicate puzzle ids' % label)
    return errs


def cross_checks(puzzles, label):
    """A clue must not hand over a different answer in the same puzzle either."""
    errs = []
    for p in puzzles:
        answers = set(e['ans'] for e in p['across'] + p['down'])
        for e in p['across'] + p['down']:
            flat = re.sub(r'[^a-z]', '', e['clue'].lower())
            for other in answers:
                if other == e['ans'] or len(other) < 4:
                    continue
                if other.lower() in flat:
                    errs.append('%s %s %s: clue gives away %s (%r)'
                                % (label, p['id'], e['ans'], other, e['clue']))
    return errs


# ----------------------------------------------------------------- emission ---
def emit(mini, midi):
    payload = {'mini': mini, 'midi': midi}
    body = json.dumps(payload, ensure_ascii=True, separators=(',', ':'), sort_keys=False)
    js = (
        '// core/data/crosswords.js -- 5x5 minis + 7x7 midis for the Midnight Arcade.\n'
        '// Grids: backtracking fill (_build/xw_fill.py, _build/xw_midi_fill.py) over a\n'
        '// frequency-ranked, dictionary-validated pool (_build/xw_words.py, sources:\n'
        '// /usr/share/dict/words web2 + first20hours/google-10000-english 20k +\n'
        '// hermitdave OpenSubtitles en_50k + dwyl/english-words).\n'
        '// Clues: hand-authored, _build/xw_clues.py.  Assembled + validated by\n'
        '// _build/gen_crosswords.py.  "#" = block.  Do not edit by hand.\n'
        'window.AD_CROSSWORDS = %s;\n' % body
    )
    with open(OUT, 'w') as f:
        f.write(js)
    # prove the payload is strict JSON and the file is parseable the way a browser sees it
    with open(OUT) as f:
        txt = f.read()
    inner = txt.split('window.AD_CROSSWORDS = ', 1)[1].rstrip()
    assert inner.endswith(';'), 'emitted file does not end with a semicolon'
    json.loads(inner[:-1])
    return len(js.encode('utf-8'))


def main():
    bank = clue_bank()
    rank = rank_map()
    used = {}

    with open(os.path.join(HERE, 'xw_mini_fills.json')) as f:
        mini_fills = json.load(f)['puzzles']
    try:
        with open(os.path.join(HERE, 'midi_fills.json')) as f:
            midi_fills = json.load(f)
    except IOError:
        midi_fills = []
    midi_fills = [m for m in midi_fills if m.get('use', True)]

    mini, mini_skip = assemble(mini_fills, 'mini', bank, used, rank)
    midi, midi_skip = assemble(midi_fills, 'midi', bank, used, rank,
                               meta=getattr(xw_clues, 'MIDI_META', {}))
    mini = mini[:40]
    midi = midi[:24]

    w2, extra = dictionary()
    errs = (validate(mini, 5, w2, extra, False, 45, 120, 'MINI')
            + validate(midi, 7, w2, extra, True, 150, 360, 'MIDI')
            + cross_checks(mini, 'MINI') + cross_checks(midi, 'MIDI'))

    print('=== crosswords.js self-check ===')
    for label, ps, tgt in (('mini', mini, 40), ('midi', midi, 24)):
        if not ps:
            print('%-5s: none built yet' % label)
            continue
        ent = [e for p in ps for e in p['across'] + p['down']]
        ans = [e['ans'] for e in ent]
        print('%-5s: %d/%d puzzles   %d entries (avg %.1f)   %d distinct answers   '
              'par %d-%d (mean %d)'
              % (label, len(ps), tgt, len(ent), len(ent) / float(len(ps)),
                 len(set(ans)), min(p['par'] for p in ps), max(p['par'] for p in ps),
                 sum(p['par'] for p in ps) / len(ps)))
        print('       distinct grids %d   clue length min %d max %d mean %.1f'
              % (len(set(tuple(p['grid']) for p in ps)),
                 min(len(e['clue']) for e in ent), max(len(e['clue']) for e in ent),
                 sum(len(e['clue']) for e in ent) / float(len(ent))))
    themed = [p for p in midi if p['theme']]
    print('themed midis            : %d  %s'
          % (len(themed), ', '.join('%s "%s"' % (p['id'], p['title']) for p in themed)))

    need = set()
    for pid, ms in mini_skip + midi_skip:
        need |= set(ms)
    if mini_skip or midi_skip:
        print('unclued puzzles         : %d mini, %d midi  (%d distinct words still needed)'
              % (len(mini_skip), len(midi_skip), len(need)))
        with open(os.path.join(HERE, 'xw_need_clues.txt'), 'w') as f:
            for w in sorted(need):
                f.write(w + '\n')
        print('                          -> _build/xw_need_clues.txt')

    if errs:
        print('\nVALIDATION FAILURES: %d' % len(errs))
        for e in errs[:80]:
            print('   ', e)
        sys.exit(1)
    print('validation              : ALL CHECKS PASSED')

    size = emit(mini, midi)
    print('wrote %s (%d bytes)' % (OUT, size))


if __name__ == '__main__':
    main()
