#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
xw_fill.py -- 5x5 mini-crossword grid filler.

Backtracking search with MRV slot ordering + forward checking over the frequency-ranked
pool from xw_words.py.  Deterministic: every fill is produced from an explicit integer
seed, so re-running reproduces byte-identical output.

Run directly to (re)generate _build/xw_mini_fills.json -- the frozen set of 40 fills that
the clue bank in xw_clues.py is written against.
"""
import json
import os
import random
import sys

import xw_words

B = os.path.dirname(os.path.abspath(__file__))
N = 5

# ---------------------------------------------------------------------------
# Three-letter entries are where crosswordese lives, so they are an explicit
# hand-picked allowlist rather than a frequency cut.  Every one of these is a
# word a newspaper would happily clue.
GOOD3 = """
ace act add ads age aid aim air all and ant any apt arc arm art ash ask ate
bad bag bat bay bee bet bid big bin bit boy bow box bug bus but buy bye
cab can cap car cat cod cow cry cup cut
dad dam day did dig dog dot dry due duo
ear eat egg end era eye
fan far fat fed fee few fig fit fix fly fog for fox fun fur
gap gas gel gem get gig god got guy gym
had ham has hat her him hip his hit hop hot how hub
ice ill ink inn its
jam jar jet job joy
key kid kit
lab lap law lay led leg let lip log lot low
mad mag man map mat may men met mid min mix mom
new nor not nut
oak odd off oil old one opt our out own
pad pal pan par pat pay pen per pet pic pie pig pin pit pop pot pro pub put
ran rap rat raw ray red rid rim rip rod row rug run
sad sap sat saw say sea see set she shy sin sir sit six ski sky son spa spy sub sum sun
tab tag tan tap tar tax tea tee ten the tie tin tip toe ton too top toy try tub two
use van wax way web wed wet who why win wow yes yet you zip zoo
""".split()

# ---------------------------------------------------------------------------
# BAN -- words the pool still lets through that must never reach a grid.
# Every one of these was caught by eyeballing a real generated answer list:
# slurs and dated racial terms, crude anatomy, corpus artifacts that are not
# English words, transliterations and proper nouns, and crosswordese that has
# no honest clue.  Filtering happens here (not in xw_words.py) so the shared
# pool file stays untouched for the other word games.
BAN = set("""
negro negros negroes coloured asses ass arse boobs bitch damned
param ther tele thier ther teh todo init args func regex http href utf ascii
plat parm proc calc alloc dealloc struct printf substr
reese ricky bobby wendy kelly kevin karen debbie nancy nikki jimmy tammy susan
kathy cathy bobbi becky terry jerry larry harry barry gerry marty monty rusty
alamo texas tulsa vegas boise omaha aztec inca maori zulu bantu farsi hindi
hebrew latin greek roman norse aryan aryans
alfa largo lento forte tempo adagio
avian renal aorta uveal ileum tibia femur pelvic
nitro ortho meta para poly mono
theta omega sigma delta gamma kappa lambda alpha beta zeta iota
circa versus ergo ibid idem
assay assays essay assai
nanny mammy granny
cess sess tion ings ests iest eous ance ence ible
apse nave apsis ogee ewer adze oleo olio esne etui smee anoa unau okapi
ogre orcs elven gnome troll
gonna wanna gotta kinda sorta dunno yeah yep nope nah huh hmm ugh
xxx xml sql php htm jpeg mpeg wifi ipod ipad imac linux ubuntu
juan jose luis maria pablo pedro diego mario rosa lucia
pussy dildo sluts slut dicks cocks booty butts butt orgy babes babe ebony hairy
sucks suck bras thong chick chicks gays escort escorts nude nudes naughty
paris wales cisco honda yahoo smith chile japan china york dell visa mars chad
hong ford lucy rita joey jake beck hart dans alto costa vista excel korea kenya
india italy spain egypt tokyo miami vegas nokia sony intel lexus volvo mazda
santa cass chico hanna hogan aries baht torah islam koran bible jesus allah
basal renal ileal ulnar
mens olds outs lows fest sans gage lite temp corp inter nulls nokia dept
colley collie chevy buick dodge acura scion isuzu
""".split())


def _en50k():
    """Spoken-English frequency list (OpenSubtitles).  Requiring a word to appear in
    BOTH this and the written-web list kills corpus artifacts like PARAM and THER."""
    out = set()
    try:
        with open(os.path.join(B, 'en_50k.txt')) as f:
            for line in f:
                w = line.split(' ')[0].strip().lower()
                if w.isalpha():
                    out.add(w)
    except IOError:
        pass
    return out


# ------------------------------------------------------------------- patterns
def _row_options():
    """A 5-wide row is legal iff its blocks sit only at the ends and the white run
    left over is >= 3.  So a row is fully described by (prefix blocks, suffix blocks)."""
    return [(p, s) for p in range(3) for s in range(3) if p + s <= 2]


def _canon(blocks):
    best = None
    for t in range(8):
        cur = []
        for r, c in blocks:
            rr, cc = (c, r) if t & 1 else (r, c)
            if t & 2:
                rr = N - 1 - rr
            if t & 4:
                cc = N - 1 - cc
            cur.append((rr, cc))
        k = tuple(sorted(cur))
        if best is None or k < best:
            best = k
    return best


def gen_patterns(max_blocks=6):
    """Every legal 5x5 mini block pattern with <= max_blocks blocks, in ALL
    orientations (a rotated pattern is a visually different puzzle), ordered so
    the light patterns come first.  Deterministic."""
    import itertools
    opts = _row_options()
    out = []
    seen = set()
    for rows in itertools.product(opts, repeat=N):
        b = set()
        for r, (p, s) in enumerate(rows):
            for c in range(p):
                b.add((r, c))
            for c in range(N - s, N):
                b.add((r, c))
        if len(b) > max_blocks:
            continue
        if not pattern_ok(b):
            continue
        key = tuple(sorted(b))
        if key in seen:
            continue
        seen.add(key)
        out.append(key)
    # interleave by canonical family so consecutive patterns look different
    fam = {}
    for k in out:
        fam.setdefault(_canon(k), []).append(k)
    order = sorted(fam, key=lambda f: (len(f), f))
    mixed = []
    i = 0
    while True:
        added = False
        for f in order:
            if i < len(fam[f]):
                mixed.append(fam[f][i])
                added = True
        if not added:
            break
        i += 1
    return [tuple(p) for p in mixed]


# --------------------------------------------------------------------- slots
def slots_for(blocks):
    blocks = set(blocks)
    out = []
    for r in range(N):
        c = 0
        while c < N:
            if (r, c) in blocks:
                c += 1
                continue
            c2 = c
            while c2 < N and (r, c2) not in blocks:
                c2 += 1
            if c2 - c >= 3:
                out.append(('A', r, c, c2 - c, [(r, x) for x in range(c, c2)]))
            c = c2
    for c in range(N):
        r = 0
        while r < N:
            if (r, c) in blocks:
                r += 1
                continue
            r2 = r
            while r2 < N and (r2, c) not in blocks:
                r2 += 1
            if r2 - r >= 3:
                out.append(('D', r, c, r2 - r, [(x, c) for x in range(r, r2)]))
            r = r2
    return out


def pattern_ok(blocks):
    """Valid mini pattern: no run of length 1-2 anywhere, every row/col has a run,
    white squares connected."""
    blocks = set(blocks)
    for r in range(N):
        run = 0
        runs = []
        for c in range(N):
            if (r, c) in blocks:
                if run:
                    runs.append(run)
                run = 0
            else:
                run += 1
        if run:
            runs.append(run)
        if not runs or any(x < 3 for x in runs):
            return False
    for c in range(N):
        run = 0
        runs = []
        for r in range(N):
            if (r, c) in blocks:
                if run:
                    runs.append(run)
                run = 0
            else:
                run += 1
        if run:
            runs.append(run)
        if not runs or any(x < 3 for x in runs):
            return False
    white = [(r, c) for r in range(N) for c in range(N) if (r, c) not in blocks]
    seen = {white[0]}
    st = [white[0]]
    while st:
        r, c = st.pop()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (r + dr, c + dc)
            if n in seen or n in blocks:
                continue
            if 0 <= n[0] < N and 0 <= n[1] < N:
                seen.add(n)
                st.append(n)
    return len(seen) == len(white)


# -------------------------------------------------------------------- filler
class Filler(object):
    """Bitmask-indexed backtracking filler.  For each (length, position, letter) we keep an
    integer whose set bits are the matching word indices; candidate sets are then plain
    integer ANDs, which is ~20x faster than Python set intersection here."""

    def __init__(self, caps=None):
        caps = caps or {3: 99999, 4: 11000, 5: 13000}
        pool = xw_words.load()
        good3 = set(GOOD3)
        spoken = _en50k()
        self.words = {}
        self.rank = {}
        self.wid = {}
        for L in (3, 4, 5):
            ws = []
            for w, r in sorted(pool[L].items()):
                if L == 3 and w not in good3:
                    continue
                if w in BAN:
                    continue
                if L >= 4 and spoken and w not in spoken:
                    continue
                if r > caps[L]:
                    continue
                ws.append(w)
                self.rank[w] = r
            self.words[L] = ws
            self.full = getattr(self, 'full', {})
            self.full[L] = (1 << len(ws)) - 1
            for i, w in enumerate(ws):
                self.wid[w] = i
        self.bits = {}
        for L in (3, 4, 5):
            for i, w in enumerate(self.words[L]):
                for p, ch in enumerate(w):
                    k = (L, p, ch)
                    self.bits[k] = self.bits.get(k, 0) | (1 << i)
        self.nodes = 0

    def sizes(self):
        return {L: len(self.words[L]) for L in (3, 4, 5)}

    def _mask(self, slot, grid, usedmask):
        L = slot[3]
        m = self.full[L]
        for p, (r, c) in enumerate(slot[4]):
            ch = grid[r][c]
            if ch:
                m &= self.bits.get((L, p, ch), 0)
                if not m:
                    return 0
        return m & ~usedmask[L]

    @staticmethod
    def _iter(mask):
        while mask:
            b = mask & -mask
            yield b.bit_length() - 1
            mask ^= b

    def fill(self, blocks, seed, noise=2500.0, node_limit=40000):
        slots = slots_for(blocks)
        grid = [[None] * N for _ in range(N)]
        for r, c in blocks:
            grid[r][c] = '#'
        rng = random.Random(seed)
        self.nodes = 0
        usedmask = {3: 0, 4: 0, 5: 0}
        ok = self._solve(slots, [None] * len(slots), grid, usedmask, rng, noise, node_limit)
        if not ok:
            return None
        return [''.join(ch if ch else '?' for ch in row) for row in grid]

    def _solve(self, slots, assign, grid, usedmask, rng, noise, node_limit):
        self.nodes += 1
        if self.nodes > node_limit:
            return False
        best = -1
        best_m = None
        best_n = 1 << 30
        for i, s in enumerate(slots):
            if assign[i] is not None:
                continue
            m = self._mask(s, grid, usedmask)
            if not m:
                return False
            n = bin(m).count('1')
            if n < best_n:
                best, best_m, best_n = i, m, n
                if n == 1:
                    break
        if best_m is None:
            return True
        slot = slots[best]
        L = slot[3]
        cands = [self.words[L][i] for i in self._iter(best_m)]
        # multiplicative jitter: strongly prefers common words but still explores
        cands.sort(key=lambda w: self.rank[w] * (0.5 + noise * rng.random()))
        for w in cands:
            saved = []
            bad = False
            for p, (r, c) in enumerate(slot[4]):
                if grid[r][c] is None:
                    saved.append((r, c))
                    grid[r][c] = w[p]
                elif grid[r][c] != w[p]:
                    bad = True
                    break
            if not bad:
                assign[best] = w
                bit = 1 << self.wid[w]
                usedmask[L] |= bit
                if self._solve(slots, assign, grid, usedmask, rng, noise, node_limit):
                    return True
                usedmask[L] &= ~bit
                assign[best] = None
            for r, c in saved:
                grid[r][c] = None
            if self.nodes > node_limit:
                return False
        return False


# ------------------------------------------------------------------- scoring
def entries_of(grid, blocks):
    """Return (across, down) lists of (n, r, c, len, ans) with standard numbering."""
    blocks = set(blocks)
    white = lambda r, c: 0 <= r < N and 0 <= c < N and (r, c) not in blocks
    num = 0
    across, down = [], []
    for r in range(N):
        for c in range(N):
            if not white(r, c):
                continue
            sa = (not white(r, c - 1)) and white(r, c + 1)
            sd = (not white(r - 1, c)) and white(r + 1, c)
            if sa or sd:
                num += 1
                if sa:
                    c2 = c
                    while white(r, c2):
                        c2 += 1
                    across.append((num, r, c, c2 - c, grid[r][c:c2]))
                if sd:
                    r2 = r
                    while white(r2, c):
                        r2 += 1
                    down.append((num, r, c, r2 - r, ''.join(grid[x][c] for x in range(r, r2))))
    return across, down


UGLY_SUFFIX = ('ed', 'ing', 'ies', 'est')


def score(grid, blocks, rankmap):
    a, d = entries_of(grid, blocks)
    words = [e[4] for e in a + d]
    ranks = [rankmap[w] for w in words]
    mean = sum(ranks) / float(len(ranks))
    worst = max(ranks)
    pen = 0.0
    for w in words:
        if w.endswith('s') and len(w) > 3:
            pen += 250          # plurals / verb -s : legal but flat
        if w.endswith(UGLY_SUFFIX):
            pen += 400          # inflected forms are duller fill
        if rankmap[w] > 9000:
            pen += 900          # anything this rare needs a very good reason
    return -(0.55 * worst + 0.45 * mean + pen), mean, worst


def generate(patterns, per_pattern=14, node_limit=60000, verbose=True):
    f = Filler(caps={3: 99999, 4: 99999, 5: 99999})
    if verbose:
        print('filler word counts: %s' % f.sizes())
        sys.stdout.flush()
    cands = []
    seen_fills = set()
    for pi, blocks in enumerate(patterns):
        assert pattern_ok(blocks), blocks
        got = 0
        for s in range(per_pattern * 3):
            if got >= per_pattern:
                break
            g = f.fill(blocks, seed=pi * 100003 + s,
                       noise=1.0 + (s % 7) * 0.9, node_limit=node_limit)
            if not g:
                continue
            key = tuple(g)
            if key in seen_fills:
                continue
            seen_fills.add(key)
            sc, mean, worst = score(g, blocks, f.rank)
            cands.append({'pi': pi, 'blocks': [list(b) for b in blocks], 'grid': g,
                          'score': sc, 'mean': mean, 'worst': worst, 'seed': s})
            got += 1
        if verbose:
            print('  pattern %2d %-40s fills=%d' % (pi, str(blocks), got))
            sys.stdout.flush()
    return f, cands


def _pick(cands, want, max_uses, max_overlap):
    cands = sorted(cands, key=lambda c: -c['score'])
    by_pat = {}
    for c in cands:
        by_pat.setdefault(c['pi'], []).append(c)
    chosen = []
    uses = {}
    chosen_sets = []
    seen_grid = set()
    pats = sorted(by_pat)
    ptr = {p: 0 for p in pats}
    while len(chosen) < want:
        progress = False
        for p in pats:
            if len(chosen) >= want:
                break
            lst = by_pat[p]
            while ptr[p] < len(lst):
                c = lst[ptr[p]]
                ptr[p] += 1
                if tuple(c['grid']) in seen_grid:
                    continue
                a, d = entries_of(c['grid'], [tuple(b) for b in c['blocks']])
                ws = set(e[4] for e in a + d)
                if any(uses.get(w, 0) >= max_uses for w in ws):
                    continue
                if any(len(ws & s) > max_overlap for s in chosen_sets):
                    continue
                for w in ws:
                    uses[w] = uses.get(w, 0) + 1
                chosen.append(c)
                chosen_sets.append(ws)
                seen_grid.add(tuple(c['grid']))
                progress = True
                break
        if not progress:
            break
    return chosen


def select(cands, f, want=40):
    """Greedy: best score first; a word may appear in at most `max_uses` puzzles and two
    chosen puzzles may share at most `max_overlap` words.  Round-robin over patterns so
    the set is visually varied.  Constraints relax in fixed steps until `want` is met, so
    the result is still deterministic."""
    for max_uses, max_overlap in ((2, 1), (2, 2), (3, 2), (3, 3), (4, 3)):
        chosen = _pick(cands, want, max_uses, max_overlap)
        if len(chosen) >= want:
            print('  select: max_uses=%d max_overlap=%d -> %d' % (max_uses, max_overlap, len(chosen)))
            return chosen
        best = chosen
    print('  select: exhausted relaxations -> %d' % len(best))
    return best


CACHE = 'xw_mini_cands.json'


def main():
    """python3 xw_fill.py [want]            full search, caches every candidate fill
       python3 xw_fill.py [want] reselect   re-run selection only, from the cache

    `reselect` is the fast path used while cleaning the answer list: add a word to BAN,
    re-select, and every candidate fill containing it disappears in a second or two."""
    want = int(sys.argv[1]) if len(sys.argv) > 1 else 40
    reselect = 'reselect' in sys.argv
    patterns = gen_patterns()
    print('legal 5x5 block patterns (all orientations, <=6 blocks): %d' % len(patterns))
    if reselect:
        f = Filler(caps={3: 99999, 4: 99999, 5: 99999})
        with open(os.path.join(B, CACHE)) as fh:
            cands = json.load(fh)
        print('cached candidate fills: %d' % len(cands))
        keep = []
        for c in cands:
            a, d = entries_of(c['grid'], [tuple(b) for b in c['blocks']])
            ws = [e[4] for e in a + d]
            if any(w in BAN or w not in f.rank for w in ws):
                continue
            keep.append(c)
        print('after BAN filter          : %d' % len(keep))
        cands = keep
    else:
        f, cands = generate(patterns)
        with open(os.path.join(B, CACHE), 'w') as fh:
            json.dump(cands, fh, sort_keys=True)
        print('total candidate fills: %d  (cached in %s)' % (len(cands), CACHE))
    chosen = select(cands, f, want=want)
    print('selected: %d' % len(chosen))
    if len(chosen) < want:
        print('!! WARNING: fewer than %d fills selected' % want)
    allwords = []
    for c in chosen:
        a, d = entries_of(c['grid'], [tuple(b) for b in c['blocks']])
        c['across'] = [list(e) for e in a]
        c['down'] = [list(e) for e in d]
        allwords += [e[4] for e in a + d]
    uniq = sorted(set(allwords))
    print('entries: %d   distinct words: %d   worst rank in set: %d'
          % (len(allwords), len(uniq), max(f.rank[w] for w in uniq)))
    out = {'patterns': [[list(b) for b in p] for p in patterns], 'puzzles': chosen}
    path = os.path.join(B, 'xw_mini_fills.json')
    with open(path, 'w') as fh:
        json.dump(out, fh, indent=1, sort_keys=True)
    print('wrote %s (%d bytes)' % (path, os.path.getsize(path)))
    with open(os.path.join(B, 'xw_mini_words.txt'), 'w') as fh:
        for w in uniq:
            fh.write('%s\t%d\t%d\n' % (w, len(w), f.rank[w]))
    print('wrote xw_mini_words.txt (%d words)' % len(uniq))


if __name__ == '__main__':
    main()
