#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
xw_midi_fill.py — derive 7x7 midi crossword GRIDS + FILLS for Misha's Midnight Arcade.

Deterministic, re-runnable, stdlib only (Python 3.9). Writes midi_fills.json.
The shipped data file is written by gen_crosswords_midi.py, which adds the
hand-authored clues to these fills and validates every invariant.

Inputs (all local; the three lists were fetched once with curl and are kept here):
  /usr/share/dict/words   web2. Legitimacy source. Only STRICTLY-LOWERCASE entries are
                          used, which is what filters proper nouns out.
  words_alpha.txt         dwyl/english-words — supplies the regular inflections web2
                          lacks (PHONES, MAKES, CARS ...).
  count_1w.txt            Norvig / Google Web Trillion Word Corpus unigram counts.
  en_50k.txt              hermitdave/FrequencyWords OpenSubtitles-2018 top 50k.
                          Spoken-English frequency: this is what keeps long entries
                          lively (KITCHEN, WEDDING) instead of web sludge (BROWSE, FORUMS).

Vocabulary rule — every answer satisfies ALL of:
  * in BOTH frequency lists (common in writing AND in speech)
  * in dwyl words_alpha
  * a strictly-lowercase web2 entry, OR a regular inflection (+S/+ES/+IES/+ED/+ING/
    +ER/+EST/+LY/+Y, incl. consonant doubling) of one
  * not in BLOCK below (slurs, profanity, sexual terms, tokenizer artifacts,
    given names, place names that sneak through as lowercase web2 words)
Words are ranked by blended (web, speech) frequency; the filler always prefers the
top of that ranking, and long slots are filled from the liveliest tier that solves.

Grid rule: 7x7, 180-degree rotational symmetry, 6..12 blocks (6-10 typical),
no entry shorter than 3, fully connected, so every white square sits in exactly one
across and one down entry.
"""
import json, os, random, sys, time
from itertools import combinations

HERE = os.path.dirname(os.path.abspath(__file__))
N = 7
CELLS = N * N

# --- excluded: slurs, profanity, sexual/crude, drugs, violence-adjacent unpleasantness,
# --- tokenizer artifacts, and lowercase-in-web2 words that are really names/places.
BLOCK = set("""
sex sexy sexes gay gays lesbian lesbians nude nudes nudist nudity naked porn porno teens
ass asses arse arses damn damned hell shit shits crap craps crappy fuck fucks fucked
fucking bitch bitches bastard bastards whore whores slut sluts pussy pussies dick dicks
cock cocks cocky penis penises vagina boobs boob tits titty tit butts booty anal anus
horny orgasm condom condoms erotic erection sperm semen nipple nipples cum
pissed pissing piss puke puked screwed screwing horniest bugger buggery
darkies darkie polack polacks kraut krauts spic spics chink chinks gook gooks jap japs
kike kikes dago dagos coon coons gypped retard retards retarded queer queers tranny
fag fags faggot fatso midget spastic wop wops nigger niggers
heroin cocaine junkie junkies brothel hooker hookers pimp pimps dope
rape raped rapes raping rapist suicide molest molested molester
don dont cant wont isnt didnt doesnt ive youre theyre thats whats lets aint yer
etc inc ltd vol pron prep abbr misc dept govt approx aka aint
foo bar baz str obj var func init tmp url urls http https html xml css php sql
faq faqs blog blogs blogger bloggers webcam webcams blah
mrs mister madam sirs thy thee thou thine hath doth ist
sec secs mins hrs yrs deg
las los des sur dele une deux mais avec sie und ich nicht das ein una eine
lol omg wtf btw fyi asap pst grr shh psst hmm hah heh huh wha tha yah naw yer
amy ann ava alf abu bob ben cal che cho dan dee deb dev dom fei gal goa han ist
jed joe kai kat kay ken kim lai lan lin mae mal mao mel mir mon nam nan nat pam
poe reg rio roy sai sam san shi sri tae tai tad ted til wah yan zac zak jud gio
aly ako oki ana ama abe abr abd ada eli eva liz gus ike ito iva ida hal lou lew
lev leu meg ned nye pau ric sid stu syd tod uri wes cee wen dae hei koa noa sao
""".split())

# Second pass, added after eyeballing a real generated answer list: proper nouns and
# transliterations that reach web2 as lowercase headwords, plus crosswordese with no
# honest clue.  (Kept separate from BLOCK above so the provenance stays readable.)
BLOCK |= set("""
amar angeles angels bast berg bergs capulet cass dian dis ere eros gee harish molly
ness oliver pandora russia ganges sen tao snog thou didst prithee
sarah david peter james john mary paul mark luke simon jacob aaron adam alex
brian bruce craig derek eddie frank gavin henry irene jason julia karen kevin
linda maria nancy oscar paula quinn ralph susan tammy terry tracy wendy
london paris tokyo berlin madrid moscow vienna dublin boston austin denver
china japan india korea kenya egypt spain italy chile texas ohio iowa utah
asia africa europe america canada mexico brazil france german
latin greek roman norse celtic aryan
tsarist czar czars kaiser sultan
oleo olio esne etui adze ewer ogee anoa unau smee epee erne stoa asea alee
apse nave apses naves
sic viz ibid idem circa passim
lorem ipsum dolor
alison bridger colley geneva shastri spanky lander orgasms opiates inbred hetero
heteros bisexual erotica arousal
hereto herein thereto whereto thereof herewith
abbas abby brett carey carina cora eddy eyre faro henna malo miro shastri teng
thar tula abbot abbess cyrus dario enzo fabio garcia gupta hanna ibsen jung
aft ave cos doe rob rot sew tor trey lien slag snot moo rad lim ing gore
sutra tantric thong polio moron morons opium opiate
hiss hisses bra bras eve eves vice vices
""".split())

# how many words to admit per length, best-first by blended frequency
CAPS = {3: 430, 4: 2400, 5: 3700, 6: 4800, 7: 5200}
# vocabulary tiers tried for the long (>=6) slots, liveliest first
LONG_TIERS = [700, 1400, 2600, 4200, 5200]


def build_vocab():
    w2 = set()
    with open("/usr/share/dict/words") as f:
        for line in f:
            s = line.strip()
            if s.isalpha() and s.islower():
                w2.add(s)
    dwyl = set()
    with open(os.path.join(HERE, "words_alpha.txt")) as f:
        for line in f:
            s = line.strip()
            if s.isalpha() and s.islower():
                dwyl.add(s)
    rn = {}
    with open(os.path.join(HERE, "count_1w.txt")) as f:
        for i, line in enumerate(f):
            w = line.split("\t")[0].strip().lower()
            if w.isalpha() and w not in rn:
                rn[w] = i
    rs = {}
    with open(os.path.join(HERE, "en_50k.txt")) as f:
        for i, line in enumerate(f):
            w = line.split(" ")[0].strip().lower()
            if w.isalpha() and w not in rs:
                rs[w] = i

    def bases(w):
        out = []

        def add(b):
            if len(b) >= 3:
                out.append(b)
        if w.endswith("s"):
            add(w[:-1])
            if w.endswith("es"):
                add(w[:-2])
            if w.endswith("ies"):
                add(w[:-3] + "y")
        if w.endswith("ed"):
            add(w[:-2]); add(w[:-1])
            if w.endswith("ied"):
                add(w[:-3] + "y")
            if len(w) > 4 and w[-3] == w[-4]:
                add(w[:-3])
        if w.endswith("ing"):
            add(w[:-3]); add(w[:-3] + "e")
            if len(w) > 5 and w[-4] == w[-5]:
                add(w[:-4])
        for suf in ("er", "est"):
            if w.endswith(suf):
                k = len(suf)
                add(w[:-k]); add(w[:-k] + "e")
                if w.endswith("i" + suf):
                    add(w[:-k - 1] + "y")
                if len(w) > k + 2 and w[-k - 1] == w[-k - 2]:
                    add(w[:-k - 1])
        if w.endswith("ly"):
            add(w[:-2])
        if w.endswith("y"):
            add(w[:-1]); add(w[:-1] + "e")
        return out

    def legit(w):
        if w in w2:
            return True
        for b in bases(w):
            if b in w2:
                return True
        return False

    # Personal first names.  web2 carries a lot of them as lowercase headwords
    # (ABBY, CORA, EDDY ...), which is exactly how they sneak into a fill.
    pnames = set()
    try:
        with open("/usr/share/dict/propernames") as fh:
            for line in fh:
                s = line.strip().lower()
                if s.isalpha():
                    pnames.add(s)
    except IOError:
        pass
    pnames -= set("""rose hope grace mark bill will page dawn faith jack frank sandy
                     wade amber ruby herb chuck curt penny sunny mercy joy art guy don
                     pat may june dean rich""".split())

    # Three-letter entries are where crosswordese lives, so they come from the same
    # hand-picked allowlist the 5x5 minis use rather than from a frequency cut.
    try:
        sys.path.insert(0, HERE)
        import xw_fill
        good3 = set(w.lower() for w in xw_fill.GOOD3)
        ban = set(w.lower() for w in xw_fill.BAN)
    except ImportError:
        good3, ban = None, set()

    scored = []
    for w in rn:
        if w not in rs:
            continue
        L = len(w)
        if not (3 <= L <= 7):
            continue
        if w in BLOCK or w in ban or w not in dwyl or not legit(w):
            continue
        if L == 3 and good3 is not None and w not in good3:
            continue
        if L >= 4 and w in pnames:
            continue
        s = 0.5 * min(rn[w] / 333333.0, 1.0) + 0.5 * min(rs[w] / 50000.0, 1.0)
        scored.append((s, w))
    scored.sort()
    words = {L: [] for L in CAPS}
    for s, w in scored:
        L = len(w)
        if L in words and len(words[L]) < CAPS[L]:
            words[L].append(w.upper())
    return words


# ------------------------------------------------------------------- patterns ---
def runs_ok(blocks):
    for r in range(N):
        run = 0
        for c in range(N):
            if r * N + c in blocks:
                if 0 < run < 3:
                    return False
                run = 0
            else:
                run += 1
        if 0 < run < 3:
            return False
    for c in range(N):
        run = 0
        for r in range(N):
            if r * N + c in blocks:
                if 0 < run < 3:
                    return False
                run = 0
            else:
                run += 1
        if 0 < run < 3:
            return False
    return True


def connected(blocks):
    whites = [i for i in range(CELLS) if i not in blocks]
    if not whites:
        return False
    seen = {whites[0]}
    stack = [whites[0]]
    while stack:
        i = stack.pop()
        r, c = divmod(i, N)
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            rr, cc = r + dr, c + dc
            if 0 <= rr < N and 0 <= cc < N:
                j = rr * N + cc
                if j not in blocks and j not in seen:
                    seen.add(j)
                    stack.append(j)
    return len(seen) == len(whites)


def slots_of(blocks):
    out = []
    for r in range(N):
        c = 0
        while c < N:
            if r * N + c in blocks:
                c += 1
                continue
            cells = []
            while c < N and r * N + c not in blocks:
                cells.append(r * N + c)
                c += 1
            out.append(("A", cells))
    for c in range(N):
        r = 0
        while r < N:
            if r * N + c in blocks:
                r += 1
                continue
            cells = []
            while r < N and r * N + c not in blocks:
                cells.append(r * N + c)
                r += 1
            out.append(("D", cells))
    return out


def canon(blocks):
    best = None
    pts = [divmod(i, N) for i in blocks]
    for t in range(8):
        cur = []
        for r, c in pts:
            rr, cc = (c, r) if t & 1 else (r, c)
            if t & 2:
                rr = N - 1 - rr
            if t & 4:
                cc = N - 1 - cc
            cur.append(rr * N + cc)
        key = tuple(sorted(cur))
        if best is None or key < best:
            best = key
    return best


def orient(blocks, t):
    cur = set()
    for i in blocks:
        r, c = divmod(i, N)
        rr, cc = (c, r) if t & 1 else (r, c)
        if t & 2:
            rr = N - 1 - rr
        if t & 4:
            cc = N - 1 - cc
        cur.add(rr * N + cc)
    return frozenset(cur)


def gen_patterns(maxblocks=14):
    """all legal symmetric patterns, deduped up to the 8 dihedral symmetries."""
    pairs = [(i, CELLS - 1 - i) for i in range(24)]
    out = []
    seen = set()
    for k in (3, 4, 5, 6, 7):
        for combo in combinations(range(24), k):
            base = set()
            for i in combo:
                base.add(pairs[i][0]); base.add(pairs[i][1])
            for center in (False, True):
                b = set(base)
                if center:
                    b.add(24)
                if not (6 <= len(b) <= maxblocks):
                    continue
                if not runs_ok(b) or not connected(b):
                    continue
                cc = canon(b)
                if cc in seen:
                    continue
                seen.add(cc)
                out.append(frozenset(b))
    def key(b):
        sl = slots_of(b)
        lens = sorted(len(s[1]) for s in sl)
        return (lens.count(7), lens.count(3), len(sl), len(b), tuple(sorted(b)))
    out.sort(key=key)
    return out


def shape_ok(blocks):
    """reject grids that would not read as a midi: too many 3s, too many entries."""
    sl = slots_of(blocks)
    lens = sorted(len(s[1]) for s in sl)
    return lens.count(3) <= 7 and 12 <= len(sl) <= 20 and lens.count(7) <= 4


# --------------------------------------------------------------------- filler ---
class Filler:
    def __init__(self, words):
        self.words = words
        self.masks = {}
        self.all = {}
        for L, ws in words.items():
            n = len(ws)
            self.all[L] = (1 << n) - 1
            m = [[0] * 26 for _ in range(L)]
            for i, w in enumerate(ws):
                bit = 1 << i
                for p, ch in enumerate(w):
                    m[p][ord(ch) - 65] |= bit
            self.masks[L] = m
        self.prefix = {}

    def pref(self, L, cap):
        key = (L, cap)
        p = self.prefix.get(key)
        if p is None:
            p = (1 << min(cap, len(self.words[L]))) - 1
            self.prefix[key] = p
        return p

    def fill(self, blocks, seed, caps, node_budget=60000, banned=(), jitter=8, force=None):
        """caps: {length: max word index usable}.  force: {slot index: WORD}, used to
        plant a themed entry before the search starts.  Returns (letters|None, nodes)."""
        slots = [(len(cells), cells) for _d, cells in slots_of(blocks)]
        univ = [self.pref(L, caps.get(L, 10 ** 9)) for L, _ in slots]
        cell_slots = {}
        for si, (L, cells) in enumerate(slots):
            for p, cell in enumerate(cells):
                cell_slots.setdefault(cell, []).append(si)
        letters = [None] * CELLS
        used = set()
        rnd = random.Random(seed)
        nodes = [0]
        banned = set(banned)
        for si, w in (force or {}).items():
            L, cells = slots[si]
            if len(w) != L or w not in self.words.get(L, ()):
                return None, 0
            for p, cell in enumerate(cells):
                if letters[cell] is not None and letters[cell] != w[p]:
                    return None, 0
                letters[cell] = w[p]
            used.add(w)

        def cand_mask(si):
            L, cells = slots[si]
            m = univ[si]
            mk = self.masks[L]
            for p, cell in enumerate(cells):
                ch = letters[cell]
                if ch is not None:
                    m &= mk[p][ord(ch) - 65]
                    if not m:
                        return 0
            return m

        def rec():
            nodes[0] += 1
            if nodes[0] > node_budget:
                raise TimeoutError
            best = bestcount = bestmask = None
            for si, (L, cells) in enumerate(slots):
                done = True
                for c in cells:
                    if letters[c] is None:
                        done = False
                        break
                if done:
                    continue
                m = cand_mask(si)
                cnt = bin(m).count("1")
                if cnt == 0:
                    return None
                if bestcount is None or cnt < bestcount or (cnt == bestcount and L > slots[best][0]):
                    best, bestcount, bestmask = si, cnt, m
            if best is None:
                return [letters[i] for i in range(CELLS)]
            L, cells = slots[best]
            idxs = []
            m = bestmask
            while m:
                b = m & -m
                idxs.append(b.bit_length() - 1)
                m ^= b
            head = idxs[:jitter]
            rnd.shuffle(head)
            idxs = head + idxs[jitter:]
            for i in idxs[:80]:
                w = self.words[L][i]
                if w in used or w in banned:
                    continue
                saved = [letters[c] for c in cells]
                ok = True
                for p, c in enumerate(cells):
                    if letters[c] is None:
                        letters[c] = w[p]
                    elif letters[c] != w[p]:
                        ok = False
                        break
                if ok:
                    for c in cells:
                        for sj in cell_slots[c]:
                            if sj != best and cand_mask(sj) == 0:
                                ok = False
                                break
                        if not ok:
                            break
                if ok:
                    used.add(w)
                    r = rec()
                    if r is not None:
                        return r
                    used.discard(w)
                for p, c in enumerate(cells):
                    letters[c] = saved[p]
            return None

        try:
            return rec(), nodes[0]
        except TimeoutError:
            return None, nodes[0]


# ------------------------------------------------------------------ numbering ---
def number_grid(blocks, letters):
    grid = []
    for r in range(N):
        row = ""
        for c in range(N):
            row += "#" if r * N + c in blocks else letters[r * N + c]
        grid.append(row)
    n = 0
    across, down = [], []
    for r in range(N):
        for c in range(N):
            i = r * N + c
            if i in blocks:
                continue
            sa = (c == 0 or (r * N + c - 1) in blocks)
            sd = (r == 0 or ((r - 1) * N + c) in blocks)
            if sa or sd:
                n += 1
            if sa:
                s, cc = "", c
                while cc < N and (r * N + cc) not in blocks:
                    s += letters[r * N + cc]
                    cc += 1
                across.append({"n": n, "r": r, "c": c, "len": len(s), "ans": s})
            if sd:
                s, rr = "", r
                while rr < N and (rr * N + c) not in blocks:
                    s += letters[rr * N + c]
                    rr += 1
                down.append({"n": n, "r": r, "c": c, "len": len(s), "ans": s})
    return grid, across, down


# ----------------------------------------------------------- themed construction ---
# A midi carries a title, so a few of them are built around a shared idea: the theme
# words are PLANTED in the long slots and the filler completes the rest of the grid.
# Every set is plain vocabulary -- nothing that needs outside knowledge to enjoy.
THEMES = [
    ("FOUR OF A KIND", "Every long answer is a season",
     ["SUMMER", "WINTER", "SPRING", "AUTUMN"]),
    ("CREATURE FEATURE", "The long answers are all animals",
     ["MONKEY", "RABBIT", "TURTLE", "PIGEON", "SPIDER"]),
    ("GETTING DRESSED", "The long answers are all things you put on",
     ["JACKET", "POCKET", "BUTTON", "COTTON", "ATTIRE"]),
    ("BAND PRACTICE", "The long answers all belong in a music room",
     ["GUITAR", "VIOLIN", "RECORD", "SINGER", "ENCORE"]),
    ("SUNDAY LUNCH", "Everything long is something you eat",
     ["POTATO", "TOMATO", "BUTTER", "CHEESE", "WALNUT"]),
    ("HOUSE TOUR", "The long answers are all parts of a house",
     ["GARDEN", "WINDOW", "CELLAR", "KITCHEN", "CLOSET"]),
    ("WEATHER REPORT", "The long answers all come out of the sky",
     ["THUNDER", "SUNSHINE", "SHOWERS", "BREEZE", "FROZEN"]),
    ("PAPER ROUND", "The long answers all belong on a desk",
     ["PENCIL", "LETTER", "RIBBON", "FOLDER", "ERASER"]),
]


def themed_fills(f, pats, caps, rankof, seen_grid, want, verbose=True):
    """Try to build one grid per theme.  A theme succeeds when at least two of its
    words land in the grid's long slots and the rest of the grid still fills."""
    out = []
    vocab = set()
    for ws in f.words.values():
        vocab |= set(ws)
    for title, note, words in THEMES:
        avail = [w for w in words if w in vocab]
        if len(avail) < 2:
            if verbose:
                print("  theme %-16s SKIP (only %d of its words are in the vocabulary)"
                      % (title, len(avail)))
            continue
        done = False
        for pi, base in enumerate(pats):
            if done:
                break
            for t in (0, 3):
                blocks = orient(base, t)
                if t and canon(blocks) != canon(base):
                    continue
                slots = slots_of(blocks)
                longs = [(si, len(cells)) for si, (_d, cells) in enumerate(slots)
                         if len(cells) >= 6]
                if len(longs) < 2:
                    continue
                # try every ordered pair of long slots for every ordered pair of words
                for si_a, la in longs:
                    for si_b, lb in longs:
                        if si_b <= si_a:
                            continue
                        for wa in avail:
                            if len(wa) != la:
                                continue
                            for wb in avail:
                                if wb == wa or len(wb) != lb:
                                    continue
                                letters, _n = f.fill(blocks, seed=7 * pi + t,
                                                     caps=caps, node_budget=30000,
                                                     force={si_a: wa, si_b: wb})
                                if not letters:
                                    continue
                                grid, across, down = number_grid(blocks, letters)
                                if tuple(grid) in seen_grid:
                                    continue
                                answers = [e["ans"] for e in across + down]
                                if len(set(answers)) != len(answers):
                                    continue
                                rec = {
                                    "pattern": sorted(blocks), "blocks": len(blocks),
                                    "grid": grid, "across": across, "down": down,
                                    "seed": 7 * pi + t, "orient": t,
                                    "title": title, "theme": note,
                                    "themewords": sorted(set(answers) & set(words)),
                                    "quality": round(fill_score(answers, rankof), 1),
                                    "avgrank": round(sum(rankof[a] for a in answers)
                                                     / float(len(answers)), 1),
                                    "maxrank": max(rankof[a] for a in answers),
                                    "longs": [a for a in answers if len(a) >= 6],
                                }
                                out.append(rec)
                                seen_grid.add(tuple(grid))
                                done = True
                                if verbose:
                                    print("  theme %-16s %s | %s"
                                          % (title, " ".join(rec["themewords"]),
                                             " ".join(rec["longs"])))
                                    sys.stdout.flush()
                                break
                            if done:
                                break
                        if done:
                            break
                    if done:
                        break
                if done:
                    break
        if not done and verbose:
            print("  theme %-16s NO GRID" % title)
            sys.stdout.flush()
        if len(out) >= want:
            break
    return out


# ----------------------------------------------------------------------- main ---
DULL_SUFFIX = ("ed", "ing", "ies", "est", "ers")


def fill_score(answers, rankof):
    """Lower is better.  Rewards common, uninflected, singular fill."""
    ranks = [rankof[a] for a in answers]
    pen = 0.0
    for a in answers:
        w = a.lower()
        if len(w) > 3 and w.endswith("s"):
            pen += 180
        if w.endswith(DULL_SUFFIX):
            pen += 260
        if rankof[a] > 3200:
            pen += 500
    return 0.55 * (sum(ranks) / float(len(ranks))) + 0.45 * max(ranks) + pen


def main():
    """python3 xw_midi_fill.py [want] [per_shape]

    RESUMABLE.  Any midi_fills.json already on disk is loaded first; puzzles whose
    answers are all still legal are kept, and only the shapes not yet represented are
    searched.  So adding a word to BLOCK and re-running throws away just the puzzles
    that used it and refills those shapes -- it does not redo the whole (slow) search."""
    want = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    per_shape = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    t0 = time.time()
    words = build_vocab()
    rankof = {}
    for L, ws in words.items():
        for i, w in enumerate(ws):
            rankof[w] = i
    legal = set(rankof)
    print("vocab:", {L: len(v) for L, v in sorted(words.items())}, "(%.1fs)" % (time.time() - t0))
    pats = [p for p in gen_patterns() if shape_ok(p)]
    print("legal symmetric patterns after shape filter:", len(pats))
    sys.stdout.flush()
    f = Filler(words)
    caps = {3: CAPS[3], 4: CAPS[4], 5: min(2400, CAPS[5]), 6: CAPS[6], 7: CAPS[7]}
    out = []
    seen_answers = {}
    seen_grid = set()
    kept_shapes = {}
    try:
        with open(os.path.join(HERE, "midi_fills.json")) as fh:
            prev = json.load(fh)
    except (IOError, ValueError):
        prev = []
    for rec in prev:
        answers = [e["ans"] for e in rec["across"] + rec["down"]]
        dirty = [a for a in answers if a not in legal]
        if dirty:
            print("  drop %s -- no longer legal: %s"
                  % ("".join(rec["grid"][0]), " ".join(sorted(set(dirty)))))
            continue
        key = canon(frozenset(rec["pattern"]))
        out.append(rec)
        seen_grid.add(tuple(rec["grid"]))
        kept_shapes[key] = kept_shapes.get(key, 0) + 1
        for a in answers:
            seen_answers[a] = seen_answers.get(a, 0) + 1
    if prev:
        print("resumed: kept %d of %d puzzles from midi_fills.json" % (len(out), len(prev)))
        sys.stdout.flush()

    have_titles = set(r.get("title") for r in out if r.get("title"))
    if len(have_titles) < 5:
        global THEMES
        THEMES = [t for t in THEMES if t[0] not in have_titles]
        themed = themed_fills(f, pats, caps, rankof, seen_grid, want=5 - len(have_titles))
        for rec in themed:
            out.append(rec)
            kept_shapes[canon(frozenset(rec["pattern"]))] = per_shape
            for e in rec["across"] + rec["down"]:
                seen_answers[e["ans"]] = seen_answers.get(e["ans"], 0) + 1

    for pi, base in enumerate(pats):
        if kept_shapes.get(canon(base), 0) >= per_shape:
            continue
        # each canonical shape is tried in a couple of orientations so that reused
        # shapes still produce visibly different grids
        got = 0
        for t in (0, 3, 1):
            if got >= per_shape:
                break
            blocks = orient(base, t)
            if t and canon(blocks) != canon(base):
                continue
            found = []
            for seed in range(5):
                banned = set(w for w, c in seen_answers.items() if c >= 2)
                letters, nodes = f.fill(blocks, seed=977 * pi + 31 * t + seed,
                                        caps=caps, banned=banned, node_budget=45000)
                if not letters:
                    continue
                grid, across, down = number_grid(blocks, letters)
                if tuple(grid) in seen_grid:
                    continue
                answers = [e["ans"] for e in across + down]
                if len(set(answers)) != len(answers):
                    continue
                longs = [a for a in answers if len(a) >= 6]
                found.append({
                    "pattern": sorted(blocks),
                    "blocks": len(blocks),
                    "grid": grid,
                    "across": across,
                    "down": down,
                    "seed": seed,
                    "orient": t,
                    "quality": round(fill_score(answers, rankof), 1),
                    "avgrank": round(sum(rankof[a] for a in answers) / float(len(answers)), 1),
                    "maxrank": max(rankof[a] for a in answers),
                    "longmax": max([rankof[a] for a in longs] or [0]),
                    "longs": longs,
                })
                if len(found) >= per_shape + 2:
                    break
            found.sort(key=lambda r: r["quality"])
            for rec in found[:per_shape - got]:
                out.append(rec)
                seen_grid.add(tuple(rec["grid"]))
                for e in rec["across"] + rec["down"]:
                    seen_answers[e["ans"]] = seen_answers.get(e["ans"], 0) + 1
                got += 1
                print("  shape %2d/o%d blocks=%2d ents=%2d q=%7.1f avg=%6.1f max=%4d | %s"
                      % (pi, rec["orient"], rec["blocks"],
                         len(rec["across"]) + len(rec["down"]), rec["quality"],
                         rec["avgrank"], rec["maxrank"], " ".join(rec["longs"])))
                sys.stdout.flush()
        if not got:
            print("  shape %2d  blocks=%d  NO FILL" % (pi, len(base)))
            sys.stdout.flush()
        if len(out) >= want:
            break
    with open(os.path.join(HERE, "midi_fills.json"), "w") as fh:
        json.dump(out, fh, indent=1, sort_keys=True)
    print("wrote midi_fills.json  puzzles=%d  (%.1fs total)" % (len(out), time.time() - t0))


if __name__ == "__main__":
    main()
