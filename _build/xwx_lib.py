#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
xwx_lib.py -- grid patterns, wordlist, backtracking filler and the structural
validator for the BIG crossword pool expansion (40 mini -> 400+, 6 midi -> 400+).

Nothing here writes core/data/crosswords.js; that is xwx_gen.py.
Nothing here invents clues; the clue bank is xw_clues.py + xwx_clues*.py.

The filler only ever uses words that HAVE a clue, so a shipped grid can never
contain an entry nobody wrote a clue for.
"""
import json
import os
import random
import re
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- dictionaries

def _load_lines(path):
    out = []
    try:
        with open(path) as f:
            for line in f:
                w = line.split()[0].strip().lower() if line.split() else ""
                if w:
                    out.append(w)
    except IOError:
        pass
    return out


def load_web2():
    words = set()
    for path in ("/usr/share/dict/words", "/usr/share/dict/connectives",
                 os.path.join(HERE, "words_alpha.txt")):
        try:
            with open(path) as f:
                for line in f:
                    w = line.strip().lower()
                    if w and w.isalpha():
                        words.add(w)
        except IOError:
            pass
    return words


def load_freq():
    """word -> rank (0 = most common). Union of the three frequency lists."""
    rank = {}
    for name in ("20k.txt", "en_50k.txt", "count_1w.txt"):
        p = os.path.join(HERE, name)
        for i, w in enumerate(_load_lines(p)):
            if w.isalpha() and w not in rank:
                rank[w] = i
        if name == "count_1w.txt":
            break
    return rank


# ------------------------------------------------------------------ crosswordese
# Deliberately starved: the players said the puzzles were slightly too easy, and
# these are the freebies a daily solver types without reading the clue.
CROSSWORDESE = set("""
era eras oreo oreos aloe aloes etui etuis esne olio oleo obi obis anoa ainu
ort orts erne ernes epee epees adit alee anil arar aria arils asea avers
ecru edda eely eger elan eloi emeu emir enol epha ergo esse etas etat
inia irae ires isle ism iso ita iter ixia
oast obia odea odes ogee ogle oleos omer onus oont opah oped orle osar otic
ourie ousel oyer oyes stoa stoae stye suq swat teg tegs tsar ulu ulus unau
upas urd urds uta utas vae vug vugs wadi waes writ yad yin yod ait ale ales
ane anes ani ard arf ars ary asp aves awl awn axe axel bel bema bene bize
cee cel cere cess cete cine cire clew cly cru cwm dee deil dele dero dhow
ecad eddo eft efts eke eked ekes eld elhi elk elks ell ells elm elms ems
emu emus ene enes ens eon eons erg ergs ern erns eth ette ewe ewer ewes
gam gams gar gars gest geste gid gie gied ghi hae haed haen haes hao hin
ide ides ilk ilka imu ing ings ka kaas kae kaes kea keas keir kex khi kip
lah lea leal leas lei leis lev leva ley leys lin lings lino lins lira lire
mho mhos mib mig mils mim mina mir mna moc moe moil mor mora more morn
nae nan naoi naos nay nays ne ned nee neif nek nema neth nid nim nisi nit
oba obe obes oca ocas och ocher odea oe oes oka okas oke okes olpe ond
psi pst pud puds pul pule puli puls pya pyas qaid qat qats qua quai quey
rai raia raias raj rale rales ramee ranee rasa rax rec recs redd ree reed
reh rei reis rem rep reps res ret rets rex rho rhos ria rial rias riel
roc rocs roe roes roi rom roms rota rote roti rotl rotte roue roum rya ryas
sab sae sal sar sau sax sec sei sel sen sepoy ser sese seta seth sett sh
sib sic sika sil sim sind sinh sith sitz ska skat skeg skep skua slae smew
snit sny sod soke sol soli solum soma sone soph sora sord sori sorn sou
sox spa spae spait sri stet stey stoat stoic stope stopt stot stoup stour
sud suds sue suer sui suk sulu summa sup sur surah surra sus swab swage
tae tael taj tala talus tam tamis tan tanh tao tapa tarn taro tarok tas
tat tath taut tav taw tax tea teal teat tec ted tee teel teen teer teff
tegg tela telia tell telt tema tepa terai teres terga term tern terne
tet teth tew thae thar thaw the thee then thew thio thir tho thob thole
thon thorp thou thro thru thud thug thuja thurl thus tice tich tick
tid tidy tie tier tiff tige tike til tile till tilt time tin tine ting
tirl tiro tirr tit titi tiu tiver tiza toby tod tody toea toff toft tog
toit toke tola tolan told tole toll tolt tolu tom toman tomb tome ton
tonk tonus too took tool toom toon toot top tope toph topi topos tor
tora torc tore tori torn torr tors tort torus tosh toss tost tot tote
""".split())
# Only the genuinely stale short stuff is fatal; the long tail above is filtered
# again by the frequency gate anyway.
HARD_BAN = set("""
era eras oreo oreos aloe aloes etui etuis esne olio oleo anoa ort orts erne
ernes epee epees adit alee anil arar asea ecru eely elan emeu emir enol epha
esse etas etat inia irae ires ita iter ixia oast obia odea ogee olpe omer
oont opah oped orle osar otic ourie ousel oyer oyes stoa stoae suq teg tegs
ulu ulus unau upas urd urds uta utas vug vugs yad yin yod ait ane anes ani
ard arf ars ary aves awn bel bema bene cee cel cere cess cete cine cire clew
cru cwm dee deil dele dero dhow ecad eddo eft efts eld elhi ems ene enes ens
eon eons erg ergs ern erns eth ewer gam gams gar gars gest gid gie ghi hae
hao hin ide ides ilka imu ing ings kaas kae kea keas keir kex khi lah lea
leal leas lei leis lev leva ley leys lin lino lins lira lire mho mhos mig
mils mim mina mna moc moe moil mor mora morn nae naoi naos nay nays nee neif
nek nema nid nim nisi nit oba obe obes oca ocas och odea oe oes oka okas oke
okes ond psi pst pud puds pul pule puli puls pya pyas qat qats qua quai quey
rai raia raj rale rales ranee rasa rax rec recs redd ree reh rei reis rem
rep reps res ret rets rho rhos ria rial rias riel roc rocs roe roes roi rom
roms rota rote roti rotl roue rya ryas sae sal sar sau sax sec sei sel sen
ser seta seth sett sib sic sika sil sim sind sinh sith sitz ska skat skeg
skep skua slae smew sny sod soke sol soli soma sone soph sora sord sori sorn
sou sox spa spae sri stet stey stot stoup stour sud suer sui suk sulu sup
sur surah surra sus swage tae tael taj tala tam tamis tanh tao tapa tarn
taro tas tath tav taw tec ted tee teel teer teff tegg tela telia telt tema
tepa terai teres terga terne tet teth tew thae thar thee thew thio thir tho
thob thole thon thorp thro thru thuja thurl tice tich tid tige tike til tirl
tiro tirr titi tiu tiver tiza toby tod tody toea toff toft tog toit toke
tola tolan tole tolt tolu toman tome tonk tonus toom toon toph topi topos
tor tora torc tori torr tors tortube torus tosh tost tote yeh yeas ait
""".split())

_ABBR_OK = None


def build_pool(clued_words, freq=None, web2=None):
    """clued_words: iterable of UPPERCASE answers that have a clue.

    Returns {length: [(WORD, score), ...]} sorted best-first.  score is a
    difficulty-aware desirability: common enough to be fair, not crosswordese.
    """
    freq = freq if freq is not None else load_freq()
    web2 = web2 if web2 is not None else load_web2()
    out = defaultdict(list)
    for w in clued_words:
        lw = w.lower()
        if not (3 <= len(w) <= 7) or not w.isalpha() or w != w.upper():
            continue
        if lw in HARD_BAN:
            continue
        r = freq.get(lw)
        if r is None:
            r = 90000                      # unranked: proper nouns, allowlist words
        # desirability: peak interest around ranks 800-9000 (known but not a gimme)
        if r < 300:
            s = 55.0                       # the/and/you tier -- fine as glue, dull
        elif r < 1200:
            s = 78.0
        elif r < 5000:
            s = 100.0
        elif r < 12000:
            s = 95.0
        elif r < 30000:
            s = 78.0
        elif r < 60000:
            s = 60.0
        else:
            s = 46.0
        if lw in CROSSWORDESE:
            s *= 0.35
        out[len(w)].append((w, s))
    for L in out:
        out[L].sort(key=lambda t: -t[1])
    return dict(out)


# ------------------------------------------------------------------- grid shapes

def pattern_slots(pat):
    """pat: list of strings of '.' and '#'. -> (across, down) lists of
    (r, c, length); runs of length 1 are reported too so callers can reject."""
    n = len(pat)
    across, down = [], []
    for r in range(n):
        c = 0
        while c < n:
            if pat[r][c] == "#":
                c += 1
                continue
            c0 = c
            while c < n and pat[r][c] != "#":
                c += 1
            across.append((r, c0, c - c0))
    for c in range(n):
        r = 0
        while r < n:
            if pat[r][c] == "#":
                r += 1
                continue
            r0 = r
            while r < n and pat[r][c] != "#":
                r += 1
            down.append((r0, c, r - r0))
    return across, down


def pattern_ok(pat, minlen=3, max_block_frac=0.30):
    """180-degree symmetry is NOT checked here (callers decide).  Checks:
    every run >= minlen, every white cell in both an across and a down run,
    white area connected, block count sane."""
    n = len(pat)
    whites = [(r, c) for r in range(n) for c in range(n) if pat[r][c] != "#"]
    if not whites:
        return False
    if (n * n - len(whites)) > max_block_frac * n * n:
        return False
    across, down = pattern_slots(pat)
    for _, _, L in across + down:
        if L < minlen:
            return False
    # every white cell is in one across and one down run of length >= minlen:
    # guaranteed by the run check above, since every white cell lies in exactly
    # one across run and one down run.
    # connectivity
    seen = set()
    stack = [whites[0]]
    seen.add(whites[0])
    while stack:
        r, c = stack.pop()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            rr, cc = r + dr, c + dc
            if 0 <= rr < n and 0 <= cc < n and pat[rr][cc] != "#" and (rr, cc) not in seen:
                seen.add((rr, cc))
                stack.append((rr, cc))
    return len(seen) == len(whites)


def is_symmetric(pat):
    n = len(pat)
    return all((pat[r][c] == "#") == (pat[n - 1 - r][n - 1 - c] == "#")
               for r in range(n) for c in range(n))


def enumerate_patterns(n, minlen=3, symmetric=True, max_blocks=None, limit=400):
    """Exhaustive-ish search over block sets for an n x n grid."""
    max_blocks = max_blocks if max_blocks is not None else (n * n) // 4
    cells = [(r, c) for r in range(n) for c in range(n)]
    found = []
    seen = set()

    def render(blocks):
        return ["".join("#" if (r, c) in blocks else "." for c in range(n))
                for r in range(n)]

    def rec(idx, blocks):
        if len(found) >= limit:
            return
        pat = render(blocks)
        key = tuple(pat)
        if key not in seen:
            seen.add(key)
            if pattern_ok(pat, minlen) and (not symmetric or is_symmetric(pat)):
                found.append(pat)
        if len(blocks) >= max_blocks:
            return
        for i in range(idx, len(cells)):
            r, c = cells[i]
            if (r, c) in blocks:
                continue
            mate = (n - 1 - r, n - 1 - c)
            nb = set(blocks)
            nb.add((r, c))
            if symmetric:
                nb.add(mate)
            if len(nb) > max_blocks:
                continue
            rec(i + 1, nb)

    rec(0, set())
    return found


# ---------------------------------------------------------------------- filler

class Filler(object):
    """Backtracking grid filler over a CLUED wordlist only.

    Every candidate comes from the clue bank, so a filled grid can never contain
    an entry that has no clue.  Bitmask candidate sets + minimum-remaining-values
    slot ordering + forward checking limited to crossing slots.
    """

    def __init__(self, pool, seed=0, cap=1500):
        self.words = {}
        self.score = {}
        for L, v in pool.items():
            v = v[:cap]
            self.words[L] = [w for w, _ in v]
            self.score[L] = [s for _, s in v]
        self.masks = {}
        self.full = {}
        for L, ws in self.words.items():
            m = defaultdict(int)
            for i, w in enumerate(ws):
                bit = 1 << i
                for p, ch in enumerate(w):
                    m[(p, ch)] |= bit
            self.masks[L] = dict(m)
            self.full[L] = (1 << len(ws)) - 1
        self.rnd = random.Random(seed)
        self.used = defaultdict(int)           # global usage, for an even spread
        self._cache = {}

    def _cands(self, L, pat):
        key = (L, pat)
        got = self._cache.get(key)
        if got is not None:
            return got
        m = self.full.get(L, 0)
        mm = self.masks.get(L, {})
        for p, ch in enumerate(pat):
            if ch == ".":
                continue
            m &= mm.get((p, ch), 0)
            if not m:
                break
        if len(self._cache) < 400000:
            self._cache[key] = m
        return m

    @staticmethod
    def _bits(m):
        while m:
            b = m & -m
            yield b.bit_length() - 1
            m ^= b

    def fill(self, pat, tries=4, node_budget=30000, cap_branch=22):
        """Return {(dir,r,c,len): WORD} for every slot, or None."""
        across, down = pattern_slots(pat)
        slots = [("A", r, c, L) for r, c, L in across] + \
                [("D", r, c, L) for r, c, L in down]
        # longest first is a much better static tiebreak than grid order
        slots.sort(key=lambda s: -s[3])
        cellsof = {}
        for s in slots:
            d, r, c, L = s
            cellsof[s] = [(r, c + k) if d == "A" else (r + k, c) for k in range(L)]
        neigh = {}
        for s in slots:
            cs = set(cellsof[s])
            neigh[s] = [t for t in slots if t is not s and cs & set(cellsof[t])]
        nslots = len(slots)

        for _ in range(tries):
            grid = {}
            assigned = {}
            usedwords = set()
            budget = [node_budget]

            def slotpat(s):
                return "".join(grid.get(cell, ".") for cell in cellsof[s])

            def rec(depth):
                if budget[0] <= 0:
                    return False
                if depth == nslots:
                    return True
                best, bestm, bestn = None, 0, None
                for s in slots:
                    if s in assigned:
                        continue
                    m = self._cands(s[3], slotpat(s))
                    if not m:
                        return False
                    cnt = bin(m).count("1")
                    if bestn is None or cnt < bestn:
                        best, bestm, bestn = s, m, cnt
                        if cnt == 1:
                            break
                s = best
                L = s[3]
                ws = self.words[L]
                sc = self.score[L]
                rnd = self.rnd
                weighted = []
                for i in self._bits(bestm):
                    w = ws[i]
                    if w in usedwords:
                        continue
                    weighted.append((sc[i] - 11.0 * self.used[w] +
                                     rnd.random() * 36.0, i))
                weighted.sort(reverse=True)
                cells = cellsof[s]
                for _v, i in weighted[:cap_branch]:
                    budget[0] -= 1
                    if budget[0] <= 0:
                        return False
                    w = ws[i]
                    old = [grid.get(cell) for cell in cells]
                    ok = True
                    for k in range(L):
                        o = old[k]
                        if o is not None and o != w[k]:
                            ok = False
                            break
                    if not ok:
                        continue
                    for k in range(L):
                        grid[cells[k]] = w[k]
                    assigned[s] = w
                    usedwords.add(w)
                    good = True
                    for s2 in neigh[s]:
                        if s2 in assigned:
                            continue
                        if not self._cands(s2[3], slotpat(s2)):
                            good = False
                            break
                    if good and rec(depth + 1):
                        return True
                    del assigned[s]
                    usedwords.discard(w)
                    for k in range(L):
                        if old[k] is None:
                            grid.pop(cells[k], None)
                        else:
                            grid[cells[k]] = old[k]
                return False

            if rec(0):
                for w in assigned.values():
                    self.used[w] += 1
                return dict(assigned)
        return None

    def rows_from(self, pat, sol):
        """sol: the dict fill() returned -> list of grid row strings."""
        n = len(pat)
        g = [["#"] * n for _ in range(n)]
        for (d, r, c, L), w in sol.items():
            for k in range(L):
                if d == "A":
                    g[r][c + k] = w[k]
                else:
                    g[r + k][c] = w[k]
        return ["".join(row) for row in g]


# ------------------------------------------------------------------- numbering

def number_grid(rows):
    """rows: list of strings, '#' = block.  Returns (across, down) lists of
    dicts {n,r,c,len,ans} using standard crossword numbering."""
    n = len(rows)
    num = {}
    k = 0
    for r in range(n):
        for c in range(n):
            if rows[r][c] == "#":
                continue
            starts_a = (c == 0 or rows[r][c - 1] == "#") and \
                       (c + 1 < n and rows[r][c + 1] != "#")
            starts_d = (r == 0 or rows[r - 1][c] == "#") and \
                       (r + 1 < n and rows[r + 1][c] != "#")
            if starts_a or starts_d:
                k += 1
                num[(r, c)] = k
    across, down = [], []
    pa, pd = pattern_slots([row.replace("#", "#") for row in rows])
    for r, c, L in pa:
        if L < 2:
            continue
        across.append({"n": num[(r, c)], "r": r, "c": c, "len": L,
                       "ans": rows[r][c:c + L]})
    for r, c, L in pd:
        if L < 2:
            continue
        down.append({"n": num[(r, c)], "r": r, "c": c, "len": L,
                     "ans": "".join(rows[r + k][c] for k in range(L))})
    across.sort(key=lambda e: e["n"])
    down.sort(key=lambda e: e["n"])
    return across, down
