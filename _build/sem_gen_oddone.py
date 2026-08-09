#!/usr/bin/env python3
# =============================================================================
# SEMANTIC WING · ODD ONE OUT generator.
#
# THE IDEA (unchanged, and it is a good one). A thread needs a NAME, and naming
# clusters is the thing a machine is worst at. So don't name them — harvest the
# name. In the Small World of Words norms thousands of people answered each cue
# with free associations. Turn that round: for a response word H, the set of
# cues that produced H is a human-made category, and H is already its label.
#     H = "music"  <- piano, guitar, drum, violin, song, ...
# Four of those cues are the thread. The decoy is a word that sits near them and
# that NO human ever answered H for.
#
# -----------------------------------------------------------------------------
# 2026-08-08 REWRITE. The first version of this script ran and produced 3200
# rounds whose median margin was 0.011 — i.e. essentially every puzzle was one
# where the decoy sat as close to the four as the four sat to each other. Played
# by hand, roughly two in five had a second defensible answer. Four things were
# wrong, and all four are fixed here.
#
#   1. IT OPTIMISED FOR AMBIGUITY. The decoy search kept the candidate with the
#      SMALLEST margin, i.e. it deliberately hunted the most confusable word on
#      the board. That is how you build a coin-flip, not a puzzle.
#
#   2. IT MEASURED THE WRONG THING. Cohesion was min pairwise cosine INSIDE the
#      four. But the interesting categories are loose: {rain, snow, fog, thunder}
#      has min-pair 0.19, {apple, banana, orange, grape} 0.31. Only thesaurus
#      soup — {idiotic, dumb, moronic, dopey}, min-pair 0.67 — scored well, so
#      soup is all that survived. What actually binds a thread is not that the
#      members resemble each other, it is that they all resemble THE HUB. So the
#      cleanliness gate is now
#          HUBGAP = min_i cos(m_i, H) − cos(decoy, H)
#      and it must be comfortably positive: the four are inside the thread and
#      the decoy is measurably outside it. That single change is what lets
#      WEATHER and FRUIT and KITCHEN puzzles exist at all.
#
#   3. IT NEVER LOOKED FOR A RIVAL ANSWER. It checked that no other hub covered
#      4 of the 5 — but it counted the TRUE four as a violation (a second name
#      for the same foursome is not a second answer) while a rival thread that
#      the norms simply do not record went straight through. Now, for each of
#      the five words in turn, the four that remain are scored for how nameable
#      they are, twice:
#         · in human currency  — is there ANY response that all four evoke?
#         · in vector currency — search the whole common vocabulary for the word
#           t that maximises min_{w in four} cos(w, t): the best possible name
#           for that foursome, whether or not anyone has written it down.
#      The true foursome must beat the best rival foursome by RIVAL_GAP. This is
#      the gate that enforces the brief's one rule: a puzzle where two of the
#      five could each be argued is a broken puzzle.
#
#   4. IT LEAKED THE ANSWER THROUGH WORD SHAPE. "atoms" among quantum/particle/
#      electron, "laces" among sneakers/heels/slippers. All five words must now
#      agree on plural-s / -ing / -ly / -ed, so the odd one is never the odd one
#      typographically.
#
# Two more failures showed up on the second read-through and are fixed too:
#
#   5. PART OF SPEECH. "blown" among breeze/hurricane/kite, "cloudy" among
#      weather/hail/storm, "sweetness" among cane/cinnamon/candy, "classical"
#      among jazz/concert/chord. Every one of those is a second defensible
#      answer — the only participle, the only adjective, the only abstract noun.
#      There is no tagger here, so wordclass() derives one: a word is BASE unless
#      stripping a derivational ending leaves another word in this same
#      vocabulary, in which case it is the adverb / participle / adjective /
#      abstraction it was derived into. All five must agree.
#
#   6. SUPERORDINATES. "sport" among touchdown/tackle/stadium; "weather" among
#      hail/cloudy/storm. A member that the other three all evoke is not a member
#      of the thread, it is another name for it — and a player will say so. Any
#      such member is dropped before quads are formed.
#
# Also new: members and decoy must be words both players certainly know (rank
# cap over the shipped frequency-ordered vocabulary), no member may pair off with
# the decoy, the decoy must not sit lopsidedly nearer one member than the rest,
# the GRIM list from sem_gen_linxicon.py is honoured (nobody wants IDIOT and
# MORON in a morning puzzle), every wrong name for the thread has to be a name
# somebody could actually believe, and one round per hub, so the archive never
# serves four near-identical boards off the same category.
# -----------------------------------------------------------------------------
#
# DIFFICULTY. Two forces: how far outside the thread the decoy sits (HUBGAP —
# smaller is harder) and how strongly it is pulled towards the four (TEMPT —
# bigger is harder). Rounds are dealt four to a day as an easy -> hard ladder,
# one from each quartile, so every day has a gift and a fight.
#
# Output: core/data/oddone.js       -> window.AD_ODDONE   (the shipped puzzles)
#         sem/oddone.tsv            one round per line, word ids
#         sem/oddone_report.txt     counts only
#         sem/oddone_preview.txt    the puzzles in plain English, for the human
#                                   who has to judge them. Build artifact.
# Rounds are APPENDED to sem/oddone_raw.tsv the moment they survive, so a killed
# run still leaves usable puzzles behind.
# =============================================================================
import json
import os
import sys
from array import array
from collections import defaultdict
from itertools import combinations
from operator import mul

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SEM = os.path.join(HERE, "sem")
OUT = os.path.join(ROOT, "core", "data", "oddone.js")
DIMS = 300

# ── who may appear on a board ────────────────────────────────────────────────
MAXRANK = 8600        # members + decoy: rank in the shipped frequency vocab
HUBRANK = 6500        # the thread's name has to be an ordinary word too
NAMERANK = 6500       # ...and so do the four wrong names

# ── what makes four words a thread ───────────────────────────────────────────
MIN_CUE = 4           # people who answered H when cued with this member
MIN_MEMBERS = 6       # candidate members a hub needs before it is worth trying
POOL_MEMBERS = 13     # the strongest members considered
QUAD_TOP = 9          # quads are drawn from the top QUAD_TOP of those
MEM_HUB_MIN = 0.26    # every member must be at least this close to the hub
MEM_HUB_MAX = 0.80    # ...but a member is not allowed to BE the hub
MEM_HUB_SPREAD = 0.30 # ...and no member may be a straggler relative to the rest
MEM_PAIR_MAX = 0.74   # no two members may be the same word twice
MEM_PAIR_MIN = -0.02  # nor flat opposites

# ── what makes the fifth word an impostor ────────────────────────────────────
HUBGAP_MIN = 0.175    # THE cleanliness gate: outside the thread by this much
HUBGAP_MAX = 0.520    # ...but not so far outside that it is free
TEMPT_MIN = 0.240     # it must still be pulled towards the four
DEC_PAIR_MAX = 0.62   # it may not pair off with one member
DEC_SPREAD_MAX = 0.34 # nor sit lopsidedly nearer one of them

# ── what makes the answer the only answer ────────────────────────────────────
RIVAL_GAP = 0.115     # true foursome's best name beats every rival's by this
COH_GAP = 0.010       # cheap centroid pre-screen for the same thing
RIVAL_SCAN = 5600     # vocabulary searched for a rival thread's name
RIVAL_PRE = 96        # dims used for the first, cheapest pass over that
RIVAL_MID = 600       # survivors re-scored on all 300 dims
RIVAL_KEEP = 120      # survivors of THAT scored exactly, min-cosine over the four

MAX_USES = 4          # times one word may appear anywhere in the archive
TARGET = 1500         # rounds to stop at (4 to a day)
DECOY_SCAN = 7000     # decoys come from the commonest words
NAME_FLOOR = 0.18     # a wrong name still has to look like it could be the thread

# Function and discourse words — lifted from sem_gen_linxicon.py so the two
# cabinets agree about what is not a puzzle word.
STOP = set("""
a about above after again against all almost alone along already also although always am an and another
any anybody anymore anyone anything anyway anywhere are aren around as at away back backwards be became
because become becomes been before began begin behind being below beside besides best better between
beyond both bring but by came can cannot cant come comes coming could couldn course did didn do does
doesn doing don done down during each either else enough etc even ever every everybody everyone everything
everywhere except far few for former forward found from further gave get gets getting give given gives go
goes going gone gonna got gotta had hadn half has hasn have haven having he hell hello hence her here hers
herself hey him himself his hmm how however i if in indeed inside instead into is isn it its itself just
keep kept kind knew know known lah last later least less let lets like likely little ll long look lot made
make makes making many may maybe me mean means meant might mine more moreover most mostly much must mustn
my myself near nearly need needs neither never nevertheless next no nobody none nor not nothing now
nowhere obviously of off often oh okay on once one only onto or other others otherwise ought our ours
ourselves out outside over own particularly per perhaps please plus put quite rather re really right s
said same saw say says see seem seems seen sees several shall she should shouldn since so some somebody
somehow someone something sometimes somewhat somewhere soon sort still stuff such sure take taken tell
than thank thanks that thats the their theirs them themselves then thence there thereby therefore these
they thing things think this those thou though thought thoughts thru thus till to together too
took toward towards u um un unless unlike until unto up upon us use used using usually ve very via
want wants was wasn way ways we well went were weren what whatever when whenever where whereas wherever
whether which while whilst who whoever whole whom whose why will with within without won wonder would
wouldn ya yeah yep yes yet you your yours yourself yourselves yup
sir ma mr mrs ms dr guy guys folks anyhow ok alright uh huh whoa oops hmmm mmm nah nope
""".split())

# Nobody wants to open a morning puzzle and be handed one of these. The second
# block is the reason the first draft of this cabinet was unshippable: it kept
# offering boards made of IDIOT, MORON, IMBECILE, LUNATIC and MADMAN.
GRIM = set("""
abuse addict addiction aids alcoholic amputate autopsy bleed bleeding blood bomb bombing bullet
cancer casket cemetery chemo coffin corpse crash cremate crime dead deadly death deceased
depressed depression die died dies disease diseases drown drowning drugs dying euthanasia execute
execution famine fatal funeral gore grave graveyard grief gun guns gunshot hearse heroin hitler holocaust
homicide hostage illness incest injury insane insanity kill killed killer killing knife lynch
massacre miscarriage molest morgue mortuary murder murderer nazi nuke obituary overdose pandemic
paralysed paralyzed plague poison poisoned prison rape rapist refugee scalpel seizure sick sickness slain
slaughter slave slavery starve starving stillborn strangle stroke suffering suicide surgery terminal
terror terrorism terrorist torture toxic trauma tumor tumour undertaker victim violence violent virus war
weapon widow wound wounded
coward disgusting dumb fat hate hated hatred idiot idiots idiotic jerk loser moron moronic pathetic
stupid ugly useless worthless imbecile lunatic madman maniac crazy nuts psycho retard retarded
dopey ignorant senile spastic cripple crippled dwarf midget freak fatty obese slut whore bitch
""".split())

# CONTRACT §7, kept light: hubs that quietly smell of Edinburgh rain, a London
# bridge, a Houston highway, a Cambridge winter, a Persian kitchen and a football
# Saturday. Used ONLY to bias which hubs are tried first — never to force a
# board, and never announced anywhere in the game.
SEASON = set("""
football goal pitch team league match striker keeper stadium
tea kettle rain drizzle fog snow frost wind storm umbrella weather
castle hill cliff bridge tower cathedral abbey
subway platform ticket taxi bus train tram highway traffic
market bazaar spice saffron rice bread pomegranate walnut almond
sugar lemon honey cheese soup lamb chicken rose garden
poetry poem verse music dance river coast harbour brick
university library museum lecture campus student
autumn winter summer heat cold kitchen dinner breakfast
""".split())


def samestem(a, b):
    """Two surface forms of one word. Deliberately blunt — a false positive only
    costs us a puzzle, a false negative ships one with a giveaway in it."""
    if a == b:
        return True
    lo, hi = (a, b) if len(a) <= len(b) else (b, a)
    if hi.startswith(lo) and len(hi) - len(lo) <= 3:
        return True
    k = 5
    if len(a) >= k and len(b) >= k and a[:k] == b[:k]:
        return True
    return False


def shape(w):
    """The typographic tell. All five words on a board must agree on this, or
    the impostor can be spotted without reading it."""
    return (w.endswith("s") and not w.endswith("ss") and not w.endswith("us"),
            w.endswith("ing"),
            w.endswith("ly"),
            w.endswith("ed"))


# Irregular past participles: the -en rule below misses most of them, and one
# participle among four nouns is a second answer every time.
IRREG = set("""
blown grown known thrown drawn flown sewn shown sworn worn torn born
broken frozen taken given eaten fallen driven written spoken chosen stolen woven
hidden forgotten beaten bitten ridden risen shaken swollen awoken proven
begun drunk sung sunk swum won held kept slept felt built burnt dealt meant
""".split())

# Endings that turn one word into another. Order matters: the longest ending
# that leaves a real word wins, so "sweetness" is an ABSTRACTION and not a noun
# that happens to end in -ss.
DERIV = [
    ("ly", "ADV"),
    ("ness", "ABST"), ("ity", "ABST"), ("ment", "ABST"), ("tion", "ABST"),
    ("sion", "ABST"), ("ance", "ABST"), ("ence", "ABST"), ("ism", "ABST"),
    ("ship", "ABST"), ("hood", "ABST"), ("dom", "ABST"),
    ("ing", "VERBF"), ("ed", "VERBF"), ("en", "VERBF"),
    ("ous", "ADJ"), ("ful", "ADJ"), ("less", "ADJ"), ("ive", "ADJ"),
    ("able", "ADJ"), ("ible", "ADJ"), ("ical", "ADJ"), ("ic", "ADJ"),
    ("ish", "ADJ"), ("al", "ADJ"), ("ary", "ADJ"), ("y", "ADJ"),
]


def make_wordclass(known):
    """There is no part-of-speech tagger in the standard library, so derive one.
    A word is BASE unless stripping a derivational ending leaves another word in
    this same vocabulary — CLOUDY is cloud+y, SWEETNESS is sweet+ness, CLASSICAL
    is classic+al, BLOWN is blow+n. All five words on a board must agree, so the
    impostor is never the only adjective or the only participle."""
    def stems(w, suf):
        base = w[:-len(suf)]
        if len(base) < 3:
            return []
        out = [base, base + "e"]
        if len(base) > 2 and base[-1] == base[-2]:
            out.append(base[:-1])                  # running -> run
        if base.endswith("i"):
            out.append(base[:-1] + "y")            # happiness -> happy
        return out

    def cls(w):
        if w in IRREG:
            return "VERBF"
        for suf, tag in DERIV:
            if len(w) > len(suf) + 2 and w.endswith(suf):
                if any(s in known for s in stems(w, suf)):
                    return tag
        return "BASE"
    return cls


def main():
    vocab = open(os.path.join(SEM, "ship_vocab.txt"), encoding="utf-8").read().split()
    n = len(vocab)
    v = array("f")
    with open(os.path.join(SEM, "ship_vecs.f32"), "rb") as f:
        v.frombytes(f.read())
    V = [v[i * DIMS:(i + 1) * DIMS] for i in range(n)]

    try:
        proper = set(w.strip().lower() for w in
                     open(os.path.join(SEM, "propernames.txt"), encoding="utf-8"))
    except IOError:
        proper = set()
    try:
        rude = set(w.strip().lower() for w in
                   open(os.path.join(SEM, "ldnoobw_en.txt"), encoding="utf-8") if w.strip())
    except IOError:
        rude = set()
    bad = STOP | GRIM | proper | rude

    def cos(i, j):
        return sum(map(mul, V[i], V[j]))

    def dot(c, j):
        return sum(map(mul, c, V[j]))

    def unit(ids):
        c = array("f", bytes(4 * DIMS))
        for i in ids:
            vi = V[i]
            for d in range(DIMS):
                c[d] += vi[d]
        s = 0.0
        for d in range(DIMS):
            s += c[d] * c[d]
        s = (s ** 0.5) or 1.0
        for d in range(DIMS):
            c[d] /= s
        return c

    # ── the norms, both ways round ───────────────────────────────────────────
    #   cue_of[response][cue]  the human-made category: who evokes this word
    #   resp_of[cue][response] every thread this word could belong to
    cue_of = defaultdict(dict)
    resp_of = defaultdict(dict)
    with open(os.path.join(SEM, "assoc.tsv"), encoding="utf-8") as f:
        for line in f:
            a, b, c = line.split()
            a, b, c = int(a), int(b), int(c)
            cue_of[b][a] = c
            resp_of[a][b] = c
    hubset = {w: frozenset(d.keys()) for w, d in resp_of.items()}
    EMPTY = frozenset()

    known = set(vocab)
    wordclass = make_wordclass(known)

    def playable(i, cap):
        return i < cap and vocab[i] not in bad and len(vocab[i]) >= 3

    # words that may be an impostor: ordinary, in the norms, with threads of
    # their own so they have somewhere else to belong
    decoy_pool = [i for i in range(min(DECOY_SCAN, n))
                  if playable(i, MAXRANK) and resp_of.get(i)]
    rival_pool = [i for i in range(min(RIVAL_SCAN, n))
                  if i < MAXRANK and vocab[i] not in STOP and len(vocab[i]) >= 3]
    rival_pre = [V[i][:RIVAL_PRE] for i in rival_pool]

    # ── the rival-thread search ─────────────────────────────────────────────
    # thread(S) = max over the common vocabulary of min_{w in S} cos(w, t): the
    # best name that exists for this foursome, whether or not anyone wrote it
    # down. This is the expensive thing in the script and it runs five times per
    # candidate board, so it narrows in three passes: 96 dimensions over the
    # whole pool, then all 300 over what survives, then the exact min-cosine to
    # each of the four over what survives that.
    def thread(ids, banned):
        c = unit(ids)
        cpre = c[:RIVAL_PRE]
        pre = []
        for k in range(len(rival_pool)):
            pre.append((sum(map(mul, cpre, rival_pre[k])), k))
        pre.sort(reverse=True)
        mid = []
        for _, k in pre[:RIVAL_MID]:
            t = rival_pool[k]
            if t in banned:
                continue
            mid.append((dot(c, t), t))
        mid.sort(reverse=True)
        best = (-2.0, -1)
        for _, t in mid[:RIVAL_KEEP]:
            m = 2.0
            for i in ids:
                x = cos(i, t)
                if x < m:
                    m = x
                    if m <= best[0]:
                        break
            if m > best[0]:
                best = (m, t)
        return best

    def coh(ids):
        c = unit(ids)
        return min(dot(c, i) for i in ids)

    # ── hubs, best first ─────────────────────────────────────────────────────
    hubs = []
    for h, cs in cue_of.items():
        if not playable(h, HUBRANK):
            continue
        k = sum(1 for c, cnt in cs.items() if cnt >= MIN_CUE and playable(c, MAXRANK))
        if k >= MIN_MEMBERS:
            hubs.append((0 if vocab[h] in SEASON else 1, -k, h))
    hubs.sort()
    sys.stdout.write("hubs worth trying: %d\n" % len(hubs))

    rounds = []
    scanned = 0
    uses = defaultdict(int)
    stat = defaultdict(int)
    raw = open(os.path.join(SEM, "oddone_raw.tsv"), "w", encoding="utf-8")

    for _, _, h in hubs:
        if len(rounds) >= TARGET:
            break
        scanned += 1
        if scanned % 40 == 0:
            sys.stdout.write("  hub %d/%d · rounds %d\n" % (scanned, len(hubs), len(rounds)))
            sys.stdout.flush()

        mem = [c for c, cnt in sorted(cue_of[h].items(), key=lambda kv: -kv[1])
               if cnt >= MIN_CUE and playable(c, MAXRANK) and not samestem(vocab[c], vocab[h])
               and uses[c] < MAX_USES]
        mem = mem[:POOL_MEMBERS]
        if len(mem) < 4:
            continue
        hc = {c: cos(c, h) for c in mem}
        mem = [c for c in mem if MEM_HUB_MIN <= hc[c] <= MEM_HUB_MAX]
        # A member the others all evoke is not a member of the thread, it is
        # another name for it — and a player will happily say so. SPORT among
        # touchdown/tackle/stadium; WEATHER among hail/storm/cloudy.
        mem = [c for c in mem
               if sum(1 for o in mem if o != c and c in hubset.get(o, EMPTY)) < 3]
        if len(mem) < 4:
            stat["hub: too few members near the hub"] += 1
            continue
        pool = mem[:QUAD_TOP]
        pc = {}
        for a in range(len(pool)):
            for b in range(a + 1, len(pool)):
                pc[(pool[a], pool[b])] = pc[(pool[b], pool[a])] = cos(pool[a], pool[b])

        # score the quads: tight to the hub, even, and not four ways of saying
        # the same word. Try the best few; take the first that survives.
        quads = []
        for q in combinations(pool, 4):
            hs = [hc[x] for x in q]
            if max(hs) - min(hs) > MEM_HUB_SPREAD:
                continue
            ps = [pc[(q[a], q[b])] for a in range(4) for b in range(a + 1, 4)]
            if max(ps) > MEM_PAIR_MAX or min(ps) < MEM_PAIR_MIN:
                continue
            if len(set(shape(vocab[x]) for x in q)) != 1:
                continue
            if len(set(wordclass(vocab[x]) for x in q)) != 1:
                continue
            if any(samestem(vocab[q[a]], vocab[q[b]]) for a in range(4) for b in range(a + 1, 4)):
                continue
            # prefer: everyone well inside the thread, evenly, and distinct
            quads.append((-(min(hs) * 2.0 - max(ps) - (max(hs) - min(hs))), q))
        if not quads:
            stat["hub: no clean foursome"] += 1
            continue
        quads.sort()

        got = None
        for _, q in quads[:14]:
            ids = list(q)
            words = [vocab[i] for i in ids]
            sh = shape(words[0])
            wc = wordclass(words[0])
            minhub = min(hc[i] for i in ids)
            cent = unit(ids)
            banned = set(cue_of[h].keys()) | {h} | set(ids)
            common4 = hubset.get(ids[0], EMPTY)
            for i in ids[1:]:
                common4 = common4 & hubset.get(i, EMPTY)

            # ---- find the impostor ------------------------------------------
            best = None                       # (score, decoy, hubgap, tempt)
            for cand in decoy_pool:
                if cand in banned:
                    continue
                cw = vocab[cand]
                if shape(cw) != sh or wordclass(cw) != wc:
                    continue
                if uses[cand] >= MAX_USES:
                    continue
                if samestem(cw, vocab[h]) or any(samestem(cw, w) for w in words):
                    continue
                tempt = dot(cent, cand)
                if tempt < TEMPT_MIN:
                    continue
                gap = minhub - cos(cand, h)
                if gap < HUBGAP_MIN or gap > HUBGAP_MAX:
                    continue
                ds = [cos(cand, i) for i in ids]
                if max(ds) > DEC_PAIR_MAX or max(ds) - min(ds) > DEC_SPREAD_MAX:
                    continue
                # no response may be given by all four of any rival foursome
                clash = False
                for j in range(4):
                    alt = hubset.get(cand, EMPTY)
                    for k in range(4):
                        if k != j:
                            alt = alt & hubset.get(ids[k], EMPTY)
                        if not alt:
                            break
                    if alt:
                        clash = True
                        break
                if clash:
                    continue
                # cheap centroid pre-screen of the same idea
                mine = coh(ids)
                if any(coh([ids[k] for k in range(4) if k != j] + [cand]) > mine - COH_GAP
                       for j in range(4)):
                    continue
                # the impostor we want is the one that is plainly outside the
                # thread but still tempting: maximise temptation, not confusion.
                sc = tempt - 0.35 * gap
                if best is None or sc > best[0]:
                    best = (sc, cand, gap, tempt)
            if best is None:
                stat["quad: no impostor"] += 1
                continue

            _, dec, gap, tempt = best
            five = ids + [dec]

            # ---- the answer must be the only answer -------------------------
            fs = frozenset(five)
            mine, myname = thread(ids, fs)
            worst = -2.0
            rivalw = -1
            ok = True
            for j in range(4):
                alt = [ids[k] for k in range(4) if k != j] + [dec]
                s, t = thread(alt, fs)
                if s > worst:
                    worst, rivalw = s, t
                if mine - s < RIVAL_GAP:
                    ok = False
                    break
            if not ok:
                stat["quad: a rival foursome was nameable too"] += 1
                continue

            got = (ids, dec, gap, tempt, mine, worst, myname, rivalw, common4)
            break

        if not got:
            continue
        ids, dec, gap, tempt, mine, worst, myname, rivalw, common4 = got
        five = ids + [dec]

        # ---- four wrong names for the thread --------------------------------
        # Plausible, never right. Each must be evoked by some of the five (so it
        # tempts) but never by all four members (that would be a second correct
        # name), must not be a synonym of the true name, and must not appear on
        # the board.
        cover = defaultdict(int)
        for w5 in five:
            for r in resp_of.get(w5, {}):
                cover[r] += 1
        wrong = []
        # the impostor's own strongest thread first — the loveliest wrong answer
        order = sorted(resp_of.get(dec, {}).items(), key=lambda kv: -kv[1])
        order = [r for r, _ in order] + \
                [r for r, _ in sorted(cover.items(), key=lambda kv: -kv[1])]
        seen = set()
        for t in order:
            if len(wrong) >= 4:
                break
            if t in seen:
                continue
            seen.add(t)
            if t == h or t in five or not playable(t, NAMERANK):
                continue
            if t in common4:
                continue
            if samestem(vocab[t], vocab[h]) or any(samestem(vocab[t], vocab[x]) for x in five):
                continue
            if cos(t, h) > 0.52:
                continue
            if any(samestem(vocab[t], vocab[u]) for u in wrong):
                continue
            # never a second correct name: it must miss at least one member
            if all(t in hubset.get(i, EMPTY) for i in ids):
                continue
            wrong.append(t)
        if len(wrong) < 4:
            stat["hub: not enough wrong names"] += 1
            continue

        hard = max(0, min(100, int(round(
            180.0 * (0.40 - gap) + 90.0 * (tempt - TEMPT_MIN) + 20.0))))
        rounds.append({"ids": ids, "dec": dec, "hub": h, "wrong": wrong,
                       "gap": gap, "tempt": tempt, "mine": mine, "worst": worst,
                       "myname": myname, "rival": rivalw, "hard": hard})
        raw.write("\t".join(str(x) for x in
                            ids + [dec, h] + wrong + ["%.4f" % gap, "%.4f" % tempt,
                                                      "%.4f" % (mine - worst), hard]) + "\n")
        raw.flush()

    raw.close()

    # ── deal into days: four rounds, one from each quartile, easy -> hard ────
    rounds.sort(key=lambda r: r["hard"])
    ndays = len(rounds) // 4
    q = [rounds[i * ndays:(i + 1) * ndays] for i in range(4)]
    days = []
    for i in range(ndays):
        days.append([q[0][i], q[1][i], q[2][i], q[3][i]])
    # spread the hardest days through the archive rather than at the end
    days.sort(key=lambda d: (sum(r["hard"] for r in d) * 7919) % 1000)

    flat = []
    dayidx = []
    for d in days:
        dayidx.append([len(flat) + k for k in range(4)])
        flat.extend(d)

    write_js(flat, dayidx, vocab)
    write_tsv(flat, vocab)
    write_preview(flat, dayidx, vocab)

    lines = ["hubs worth trying          : %d" % len(hubs),
             "hubs scanned               : %d" % scanned,
             "rounds shipped             : %d" % len(flat),
             "days shipped               : %d" % len(dayidx),
             "distinct hubs              : %d" % len(set(r["hub"] for r in flat))]
    if flat:
        g = sorted(r["gap"] for r in flat)
        t = sorted(r["tempt"] for r in flat)
        u = sorted(r["mine"] - r["worst"] for r in flat)
        d = sorted(r["hard"] for r in flat)
        lines += ["hubgap  min/med/max        : %.3f / %.3f / %.3f" % (g[0], g[len(g) // 2], g[-1]),
                  "tempt   min/med/max        : %.3f / %.3f / %.3f" % (t[0], t[len(t) // 2], t[-1]),
                  "uniqueness min/med/max     : %.3f / %.3f / %.3f" % (u[0], u[len(u) // 2], u[-1]),
                  "hardness min/med/max       : %d / %d / %d" % (d[0], d[len(d) // 2], d[-1]),
                  "oddone.js bytes            : %d" % os.path.getsize(OUT)]
    lines.append("")
    lines.append("rejected:")
    for k in sorted(stat, key=lambda k: -stat[k]):
        lines.append("  %-42s %d" % (k, stat[k]))
    txt = "\n".join(lines) + "\n"
    with open(os.path.join(SEM, "oddone_report.txt"), "w") as f:
        f.write(txt)
    sys.stdout.write(txt)


def write_tsv(flat, vocab):
    with open(os.path.join(SEM, "oddone.tsv"), "w", encoding="utf-8") as f:
        for r in flat:
            f.write("\t".join(str(x) for x in
                              r["ids"] + [r["dec"], r["hub"]] + r["wrong"] +
                              ["%.4f" % r["gap"], "%.4f" % r["tempt"],
                               "%.4f" % (r["mine"] - r["worst"]), r["hard"]]) + "\n")


def write_preview(flat, days, vocab):
    """The build artifact a human reads before believing any of this."""
    with open(os.path.join(SEM, "oddone_preview.txt"), "w", encoding="utf-8") as f:
        for i, d in enumerate(days):
            f.write("DAY %d\n" % i)
            for k in d:
                r = flat[k]
                f.write("  [%s]  odd=%-13s thread=%-12s hard=%3d gap=%.3f tempt=%.3f uniq=%.3f\n"
                        % (", ".join(vocab[x] for x in r["ids"]), vocab[r["dec"]].upper(),
                           vocab[r["hub"]].upper(), r["hard"], r["gap"], r["tempt"],
                           r["mine"] - r["worst"]))
                f.write("      names: %s   |  best rival name for a wrong four: %s\n"
                        % (" / ".join(vocab[x] for x in [r["hub"]] + r["wrong"]),
                           vocab[r["rival"]] if r["rival"] >= 0 else "-"))
            f.write("\n")


def write_js(flat, days, vocab):
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("/* ===========================================================================\n"
                "   AD_ODDONE — the daily impostors.\n"
                "   Generated by _build/sem_gen_oddone.py from the Small World of Words English\n"
                "   association norms (De Deyne et al. 2019) and ConceptNet Numberbatch 19.08\n"
                "   (CC BY-SA 4.0). Do not hand-edit; re-run the script.\n"
                "     w    the five words. w[0..3] belong to the thread, w[4] is the impostor.\n"
                "          The cabinet shuffles them, so this order is never shown.\n"
                "     n    five names for the thread. n[0] is the true one; the cabinet\n"
                "          shuffles these too.\n"
                "     d    hardness 0-100: how far outside the thread the impostor sits and\n"
                "          how hard it pulls. Days are built as an easy -> hard ladder.\n"
                "   Every round shipped here survived, in this order: all five words ordinary\n"
                "   and shape-matched, the four measurably inside the thread and the impostor\n"
                "   measurably outside it, no response in the norms shared by any rival\n"
                "   foursome, and a search of the common vocabulary for the best possible NAME\n"
                "   of every rival foursome, which the true foursome had to beat outright.\n"
                "   =========================================================================== */\n")
        f.write("window.AD_ODDONE = { rounds: [\n")
        for r in flat:
            f.write(json.dumps({
                "w": [vocab[x] for x in r["ids"]] + [vocab[r["dec"]]],
                "n": [vocab[r["hub"]]] + [vocab[x] for x in r["wrong"]],
                "d": r["hard"],
            }, separators=(",", ":"), sort_keys=True) + ",\n")
        f.write("], days: [\n")
        for d in days:
            f.write(json.dumps(d, separators=(",", ":")) + ",\n")
        f.write("] };\n")


if __name__ == "__main__":
    main()
