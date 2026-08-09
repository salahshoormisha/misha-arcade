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
# 2026-08-09 — THE TWO SYSTEMIC FAULTS, AND FIVE MORE FOUND WHILE FIXING THEM.
#
# The previous pass shipped twenty rounds. Played by hand, three were good. Two
# faults were named at the time and are fixed here; hand-play found five more,
# and every one of them has the same shape — A SECOND DEFENSIBLE ANSWER. That is
# the only failure that matters. A player who can argue for two of the five
# stops trusting the cabinet, and rightly.
#
#   1. ANTONYM MEMBERS.  `bad` sat inside the GOOD thread; `valley` inside HILL.
#      Free association is full of opposites — BAD is a top answer for GOOD —
#      and the vectors cannot see it either: cos(good, bad) = 0.603, cos(valley,
#      hill) = 0.447, well inside the "these belong together" band. Three
#      defences, in order of bluntness:
#        · EVAL — hubs that are a QUALITY rather than a THING are refused
#          outright, as hub, member, decoy or name. They only ever produced
#          thesaurus soup, and they are where associative antonymy lives.
#        · ANTONYM — a hand-written opposition list, since there is no antonym
#          lexicon in the standard library and this is the whole failure mode.
#        · morphological negation, derived: un-/in-/im-/ir-/il-/dis-/non-/mis-
#          prefixes and -less against -ful, wherever both forms are real words
#          in this same vocabulary. HAPPY/UNHAPPY, CAREFUL/CARELESS.
#      No member may be the opposite of the hub, of another member, or of the
#      decoy.
#
#   2. DECOYS THAT GENUINELY BELONG.  CLOUD offered as the odd one out of
#      forecast / climate / temperature / storm, named WEATHER. Unanswerable.
#      The old test was "no human in the norms ever answered WEATHER when cued
#      with CLOUD" — but the norms keep only first responses seen twice or more,
#      about ten per cue, so ABSENCE THERE IS NOT EVIDENCE OF ABSENCE. Three
#      real tests replace it:
#        · the norms, BOTH WAYS. The hub must never evoke the decoy either.
#        · RANK. Sort the ordinary vocabulary by closeness to the hub; the decoy
#          may not be inside the nearest DEC_HUB_RANK words. CLOUD is the 55th
#          nearest word to WEATHER — of course it is weather. The good decoys
#          from the same run sit at 375 (BLANKET/rain), 465 (PIGEON/soup), 469
#          (SERVANT/student). This one number separates them cleanly, and it is
#          scale-free, which a raw cosine cap is not.
#        · a cosine ceiling as a backstop, for hubs with a thin neighbourhood.
#
#   3. MIXED KINDS.  creature / zoo / raccoon / fur, named ANIMAL: a synonym, a
#      PLACE, an instance and a body part. A player picks ZOO and is right.
#      There is no part-of-speech tagger here, so five axes are derived the way
#      the abstractness axis already was — a seed set minus a common set of
#      plain concrete nouns, normalised, dotted against all 11.6k words:
#          ABST · VERB · ADJ · PERSON · PLACE
#      All five words on a board must agree on every axis, within AXIS_SPREAD.
#      Checked against the previous run's twenty boards, this alone kills the
#      person among the objects (author/hacker), the place among the things
#      (zoo, stadium, garage, ballroom), the verb among the nouns (read, burn),
#      the adjective among the nouns (steep, edible) and the object among the
#      phenomena (umbrella) — fourteen of sixteen — while keeping both of the
#      two boards that a human had independently marked good.
#
#   4. FOUR THINGS THAT MERELY SHARE ONE LABEL.  grub / buffet / pantry /
#      edible all evoke FOOD and have nothing else whatever in common. A real
#      category leaves more than one trace in the norms, so KINSHIP: of the six
#      member pairs, at least KIN_MIN must share a response other than the hub,
#      or evoke each other directly. The two good boards scored 3 and 4; the
#      FOOD board scored 0.
#
#   5. SUPERORDINATE MEMBERS.  A member the other three all evoke is not a
#      member of the thread, it is another name for it, and a player will say
#      so. Dropped before quads are formed (tightened from three to two).
#
#   6. WORD SHAPE AND WORD CLASS.  All five must agree on plural-s / -ing / -ly
#      / -ed, and on derivational class, so the impostor is never the odd one
#      typographically or the only participle.
#
#   7. RIVAL NAMES.  For each of the five in turn, the four that remain are
#      scored for how nameable they are, in both currencies: is there ANY
#      response in the norms that all four evoke, and — searching the whole
#      common vocabulary — what is the best possible NAME for that foursome,
#      whether or not anyone ever wrote it down. The true foursome must beat
#      every rival by RIVAL_GAP. This is the gate that enforces the one rule.
#
# Also: members and decoy must be words both players certainly know, no member
# may pair off with the decoy, the decoy must not sit lopsidedly nearer one
# member than the rest, the GRIM list from sem_gen_linxicon.py is honoured, and
# one round per hub, so the archive never serves four near-identical boards off
# the same category.
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
#
# Run:  python3 _build/sem_gen_oddone.py            (the whole thing, ~40 min)
#       python3 _build/sem_gen_oddone.py 150        (a pilot over 150 hubs)
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
HUBRANK = 7000        # the thread's name has to be an ordinary word too
HUB_ABST_MAX = 0.030  # ...and A THREAD HAS TO BE SOMETHING YOU COULD POINT AT.
                      # Measured on the abstractness axis: SOUP −0.151, FRUIT
                      # −0.128, BUG −0.080, COLLEGE −0.027 all pass; TEST 0.089,
                      # DANGER 0.045, SPY 0.047, RELIGION 0.160, METHOD 0.184 do
                      # not. Every murky board in the last pass had an abstract
                      # or an action hub, and every clean one had a thing.
NAMERANK = 6500       # ...and so do the four wrong names

# ── what makes four words a thread ───────────────────────────────────────────
MIN_CUE = 2           # people who answered H when cued with this member
MIN_MEMBERS = 5       # candidate members a hub needs before it is worth trying
POOL_MEMBERS = 22     # the strongest members considered
QUAD_TOP = 15         # quads are drawn from the top QUAD_TOP of those
MEM_HUB_MIN = 0.26    # every member must be at least this close to the hub
MEM_HUB_MAX = 0.80    # ...but a member is not allowed to BE the hub
MEM_HUB_SPREAD = 0.33 # ...and no member may be a straggler relative to the rest
MEM_PAIR_MAX = 0.74   # no two members may be the same word twice
MEM_PAIR_MIN = -0.02  # nor flat opposites
KIN_MIN = 3           # of the six member pairs, how many must be kin (§4 above)

# ── everyone on the board must be the same KIND of word ──────────────────────
AXIS_SPREAD = 0.145   # max spread across the five, on every derived axis
ADJ_MAX = 0.115       # ...and ODD ONE OUT is a game about THINGS: no word on the
VERB_MAX = 0.130      # board may lean adjective or verb in absolute terms. This
                      # is the thing a derivational tagger cannot see — SUPREME
                      # among testimony/justice/appeal, ACADEMIC among publisher/
                      # reader, EVALUATION among experiment/sample. Each is the
                      # only quality among four things, and a player will say so
                      # before they have finished reading the card.
HUB_ROUNDS = 3        # rounds one hub may contribute, on disjoint words
QUAD_TRY = 60         # foursomes tried per hub before moving on

# ── what makes the fifth word an impostor ────────────────────────────────────
HUBGAP_MIN = 0.175    # outside the thread by this much, relative to the members
HUBGAP_MAX = 0.600    # ...but not so far outside that it is free
DEC_HUB_RANK = 320    # ...and not among the hub's nearest DEC_HUB_RANK words
DEC_HUB_MAX = 0.300   # ...with an absolute ceiling too, for thin neighbourhoods
TEMPT_MIN = 0.225     # it must still be pulled towards the four
DEC_PAIR_MAX = 0.62   # it may not pair off with one member
DEC_PAIR_MIN = 0.30   # ...but it must hook onto at least one of them
DEC_SPREAD_MAX = 0.34 # nor sit lopsidedly nearer one of them
DEC_HOME_CUE = 5      # people who put the impostor in ITS thread
DEC_HOME_FAR = 0.42   # ...which has to be a different thread from this one
DEC_TWOSTEP = 2       # ...and no two words the hub strongly evokes may evoke it
                      # in turn. WEATHER -> rain -> CLOUD and WEATHER -> storm ->
                      # CLOUD is how a decoy that plainly belongs slips past a
                      # one-step test on norms this sparse.

# ── what makes the answer the only answer ────────────────────────────────────
OUT_GAP = 0.050       # the impostor must be the leave-one-out outlier, by this
MEM_FIT_SPREAD = 0.13 # ...and no member may be halfway to being one itself
RIVAL_GAP = 0.115     # true foursome's best name beats every rival's by this
RIVAL_SCAN = 5600     # vocabulary searched for a rival thread's name
RIVAL_PRE = 96        # dims used for the first, cheapest pass over that
RIVAL_MID = 600       # survivors re-scored on all 300 dims
RIVAL_KEEP = 120      # survivors of THAT scored exactly, min-cosine over the four

MAX_USES = 3          # times one word may appear anywhere in the archive
BOARD_OVERLAP = 1     # words two shipped boards may have in common
HUB_APART = 0.62      # ...and no two threads may be this close: BUG and INSECT
                      # ran the same board twice with two words changed.
TARGET = 1500         # rounds to stop at (4 to a day)
DECOY_SCAN = 8600     # decoys come from the commonest words
NAME_FLOOR = 0.18     # a wrong name still has to look like it could be the thread
NAME_COVER = 2        # ...but may be evoked by at most this many of the four

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
gypsy gypsies savage savages tribe heathen infidel pagan bastard sinner witch
cocaine crack dope heroin marijuana meth cannabis weed opium morphine ecstasy
narcotic narcotics junkie stoned drunk drunken booze whiskey vodka tequila bourbon
""".split())

# FAULT 1a. Threads that are a QUALITY rather than a THING. Two reasons to
# refuse them, and they compound. They only ever produce thesaurus soup — GOOD
# gave {satisfactory, decent, great} and nothing else — and free association is
# full of opposites, so the norms cheerfully list BAD as a top answer for GOOD
# and the board ships with its own second answer inside it. A thread has to be
# something you could point at. Refused as hub, member, decoy and name.
EVAL = set("""
good bad nice great awful terrible best worst better worse fine okay poor lovely horrible
right wrong true false correct real fake easy hard difficult simple tough
happy sad angry upset glad calm tired bored excited scared afraid proud lonely
big small large little huge tiny short tall long wide narrow thick thin deep
hot cold warm cool new old young fresh fast slow quick early late
rich strong weak heavy light soft loud quiet clean dirty smart clever dull
funny boring weird normal strange odd pretty beautiful cute mean kind ugly
love like want feel look sound seem become need able sure
much many more less most least enough plenty
""".split())

# FAULT 1b. Free association is full of opposites and the vectors cannot see
# them: cos(good, bad) = 0.603, cos(valley, hill) = 0.447 — both comfortably
# inside the band that says "these belong together". Hand-listed, because there
# is no antonym lexicon in the standard library. Morphological negation is
# derived on top of this at run time (un-, in-, dis-, -less…).
ANTONYM = [p.split("/") for p in """
good/bad hot/cold big/small large/small high/low up/down top/bottom
hill/valley mountain/valley peak/valley left/right north/south east/west
day/night light/dark sun/moon summer/winter fire/ice hot/cool warm/cool
happy/sad love/hate like/hate war/peace friend/enemy win/lose winner/loser
open/close open/shut push/pull give/take buy/sell start/stop begin/end
young/old new/old rich/poor fast/slow early/late long/short tall/short
wet/dry hard/soft heavy/light loud/quiet clean/dirty full/empty
true/false right/wrong yes/no more/less many/few all/none always/never
front/back in/out on/off over/under above/below inside/outside
land/sea sky/ground heaven/hell life/death birth/death alive/dead
male/female man/woman boy/girl king/queen brother/sister husband/wife
son/daughter uncle/aunt nephew/niece father/mother dad/mum
question/answer problem/solution cause/effect supply/demand
teacher/student doctor/patient master/servant
summer/winter spring/autumn morning/evening morning/night dawn/dusk
sweet/sour sweet/bitter thick/thin rough/smooth sharp/blunt
strong/weak brave/coward wide/narrow deep/shallow near/far
first/last best/worst most/least major/minor
work/play work/rest awake/asleep sleep/wake laugh/cry
attack/defend build/destroy remember/forget find/lose
inhale/exhale import/export income/expense profit/loss
city/country urban/rural rural/urban indoor/outdoor
guilty/innocent legal/illegal public/private major/minor
gain/loss cheap/expensive expensive/cheap
""".split()]

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

# FAULT 3. The axes. Every one is a seed set minus THE SAME set of plain
# concrete nouns, so the five spreads are measured on one comparable scale.
CONCRETE = ("table dog hammer apple chair brick spoon river shoe bottle window bucket "
            "ladder pencil carrot bridge shirt candle basket knife bowl lamp door wheel")
AXES = {
    "ABST": "idea concept freedom justice quality process system notion theory principle "
            "honesty loyalty wisdom pride courage patience truth belief purpose meaning",
    "VERB": "run jump eat sleep write walk throw break carry push pull sing drink climb "
            "laugh cook drive swim dance shout build catch wash ride",
    # both kinds of adjective: the concrete properties AND the classifying ones,
    # which the first set misses entirely and which is where SUPREME and
    # ACADEMIC live.
    "ADJ": "red tall quick heavy bright empty sharp smooth loud narrow soft rough clean "
           "sour steep bitter shallow damp brave calm plain thick pale fierce "
           "national international legal political social economic public federal general "
           "official medical academic supreme royal civil military financial industrial "
           "commercial personal central formal annual",
    "PERSON": "teacher doctor farmer driver nurse soldier singer painter lawyer pilot chef "
              "dancer writer artist worker student neighbour uncle nephew waiter butcher "
              "sailor tailor priest",
    "PLACE": "city village harbour airport hospital library museum station market factory "
             "castle kitchen garden forest desert island valley beach prison stadium bakery "
             "cinema",
}

INFL = ("ings", "ing", "ies", "ers", "er", "est", "ed", "es", "ly", "s", "y")

# Negation prefixes that reliably make an opposite when what is left is itself a
# word. There are false positives (INDOOR/DOOR, INCOME/COME) and they cost a
# puzzle each — which is the right way round.
NEGPRE = ("un", "in", "im", "ir", "il", "dis", "non", "mis")


def root(w):
    """Crudest possible stemmer, and it has to handle the e-dropping the blunt
    prefix test below misses: DANCE and DANCING share no five-letter prefix, and
    the first draft of this script duly offered both as answers on one card."""
    b = w
    for suf in INFL:
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            b = w[:-len(suf)]
            break
    if b.endswith("e"):
        b = b[:-1]
    if len(b) > 2 and b[-1] == b[-2]:
        b = b[:-1]
    if b.endswith("i"):
        b = b[:-1]
    return b


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
    return root(a) == root(b)


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
flew grew threw drew blew knew wrote rode drove spoke broke chose stole froze
ate fell rose shook swore tore wore bore came ran sat stood took gave saw went
sang sank swam began drank rang bought brought caught fought taught sought
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
    cache = {}

    def stems(w, suf):
        base = w[:-len(suf)]
        if len(base) < 2:
            return []
        out = [base, base + "e"]
        if len(base) > 2 and base[-1] == base[-2]:
            out.append(base[:-1])                  # running -> run
        if base.endswith("i"):
            out.append(base[:-1] + "y")            # happiness -> happy
        return out

    def cls(w):
        if w in cache:
            return cache[w]
        r = "BASE"
        if w in IRREG:
            r = "VERBF"
        else:
            for suf, tag in DERIV:
                if len(w) > len(suf) + 1 and w.endswith(suf):
                    if any(s in known for s in stems(w, suf)):
                        r = tag
                        break
        cache[w] = r
        return r
    return cls


def build_opposites(known):
    """FAULT 1b. The hand list, closed both ways, plus every morphological
    negation this vocabulary actually contains."""
    opp = defaultdict(set)

    def add(a, b):
        if a != b:
            opp[a].add(b)
            opp[b].add(a)

    for pair in ANTONYM:
        if len(pair) == 2:
            add(pair[0], pair[1])
    for w in known:
        for p in NEGPRE:
            if w.startswith(p) and len(w) - len(p) >= 4:
                base = w[len(p):]
                if base in known:
                    add(w, base)
                if base and base[0] == base[1:2] and base[1:] in known:
                    add(w, base[1:])               # illegal -> legal
        if w.endswith("less") and len(w) > 6:
            stem = w[:-4]
            for other in (stem, stem + "ful", stem + "y", stem + "e", stem + "eful"):
                if other in known:
                    add(w, other)
    return opp


def main():
    limit_hubs = int(sys.argv[1]) if len(sys.argv) > 1 else 0

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
    bad = STOP | GRIM | EVAL | proper | rude

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
    idx = {w: i for i, w in enumerate(vocab)}
    wordclass = make_wordclass(known)
    oppw = build_opposites(known)
    # the same relation over word ids, which is what the inner loops speak
    opp = {}
    for w, s in oppw.items():
        if w in idx:
            got = frozenset(idx[x] for x in s if x in idx)
            if got:
                opp[idx[w]] = got
    sys.stdout.write("opposite pairs: %d\n" % (sum(len(s) for s in opp.values()) // 2))

    def opposed(a, b):
        return b in opp.get(a, EMPTY)

    # ── the axes ─────────────────────────────────────────────────────────────
    # FAULT 3. One number per word per axis: how far it sits towards PERSON, or
    # PLACE, or IDEA, and away from a plain concrete noun. An idea among four
    # objects — or a place among four things — is a board a player solves
    # without reading the words, so the five have to agree on every one of them.
    def seeded(ws):
        return unit([idx[w] for w in ws.split() if w in idx])

    conc = seeded(CONCRETE)
    AX = {}
    for name, seeds in AXES.items():
        a = seeded(seeds)
        ax = array("f", [a[d] - conc[d] for d in range(DIMS)])
        s = (sum(map(mul, ax, ax)) ** 0.5) or 1.0
        for d in range(DIMS):
            ax[d] /= s
        AX[name] = [sum(map(mul, ax, V[i])) for i in range(n)]
    AXL = [AX[k] for k in sorted(AX)]
    ADJA, VERBA = AX["ADJ"], AX["VERB"]
    sys.stdout.write("axes built: %s\n" % ", ".join(sorted(AX)))

    def thingy(i):
        """Is this word a THING rather than a quality or an action? The
        derivational tagger cannot see a bare adjective (SUPREME, ACADEMIC) or a
        bare verb (READ, DESCRIBE), and one of those among four nouns is a second
        defensible answer every single time."""
        return ADJA[i] <= ADJ_MAX and VERBA[i] <= VERB_MAX

    def axis_ok(ids):
        for a in AXL:
            lo = hi = a[ids[0]]
            for i in ids[1:]:
                x = a[i]
                if x < lo:
                    lo = x
                elif x > hi:
                    hi = x
            if hi - lo > AXIS_SPREAD:
                return False
        return True

    def playable(i, cap):
        return i < cap and vocab[i] not in bad and len(vocab[i]) >= 3

    # words that may be an impostor: ordinary, in the norms, with threads of
    # their own so they have somewhere else to belong
    decoy_pool = [i for i in range(min(DECOY_SCAN, n))
                  if playable(i, MAXRANK) and resp_of.get(i)]
    # shape and word class of every candidate, once. These used to be recomputed
    # for all 6000 candidates of every quad of every hub — the hottest loop in
    # the script by two orders of magnitude.
    dshape = {}
    dclass = {}
    for c in decoy_pool:
        dshape[c] = shape(vocab[c])
        dclass[c] = wordclass(vocab[c])
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

    # ── hubs, best first ─────────────────────────────────────────────────────
    hubs = []
    for h, cs in cue_of.items():
        if not playable(h, HUBRANK) or wordclass(vocab[h]) != "BASE" or not thingy(h):
            continue
        if AX["ABST"][h] > HUB_ABST_MAX:
            continue
        k = sum(1 for c, cnt in cs.items() if cnt >= MIN_CUE and playable(c, MAXRANK))
        if k >= MIN_MEMBERS:
            hubs.append((0 if vocab[h] in SEASON else 1, -k, h))
    hubs.sort()
    sys.stdout.write("hubs worth trying: %d\n" % len(hubs))

    rounds = []
    seenfive = []          # every shipped foursome, for the overlap rule
    usedhubs = []          # every shipped hub, for the apartness rule
    scanned = 0
    uses = defaultdict(int)
    stat = defaultdict(int)
    why = defaultdict(int)
    raw = open(os.path.join(SEM, "oddone_raw.tsv"), "w", encoding="utf-8")

    for _, _, h in hubs:
        if len(rounds) >= TARGET:
            break
        if limit_hubs and scanned >= limit_hubs:
            break
        scanned += 1
        if scanned % 40 == 0:
            sys.stdout.write("  hub %d/%d · rounds %d\n" % (scanned, len(hubs), len(rounds)))
            sys.stdout.flush()

        if any(cos(h, u) > HUB_APART for u in usedhubs):
            stat["hub: too close to a thread already shipped"] += 1
            continue
        # every word the hub itself strongly evokes — the middle of the two-step
        # test below, computed once per hub
        via = [r for r, c in resp_of.get(h, {}).items() if c >= 4]

        mem = [c for c, cnt in sorted(cue_of[h].items(), key=lambda kv: -kv[1])
               if cnt >= MIN_CUE and playable(c, MAXRANK) and not samestem(vocab[c], vocab[h])
               and not opposed(c, h) and uses[c] < MAX_USES]
        mem = mem[:POOL_MEMBERS]
        if len(mem) < 4:
            continue
        hc = {c: cos(c, h) for c in mem}
        mem = [c for c in mem if MEM_HUB_MIN <= hc[c] <= MEM_HUB_MAX and thingy(c)]
        # FAULT 5. A member the others all evoke is not a member of the thread,
        # it is another name for it — and a player will happily say so. SPORT
        # among touchdown/tackle/stadium; WEATHER among hail/storm/cloudy.
        mem = [c for c in mem
               if sum(1 for o in mem if o != c and c in hubset.get(o, EMPTY)) < 2]
        if len(mem) < 4:
            stat["hub: too few members near the hub"] += 1
            continue
        pool = mem[:QUAD_TOP]
        pc = {}
        for a in range(len(pool)):
            for b in range(a + 1, len(pool)):
                pc[(pool[a], pool[b])] = pc[(pool[b], pool[a])] = cos(pool[a], pool[b])
        # FAULT 4. Kin: two members are kin if the norms give them a shared
        # response other than the hub, or if either evokes the other.
        kin = {}
        for a in range(len(pool)):
            for b in range(a + 1, len(pool)):
                x, y = pool[a], pool[b]
                k = bool((hubset.get(x, EMPTY) & hubset.get(y, EMPTY)) - {h}) \
                    or y in hubset.get(x, EMPTY) or x in hubset.get(y, EMPTY)
                kin[(x, y)] = kin[(y, x)] = k

        # score the quads: tight to the hub, even, and not four ways of saying
        # the same word. Try the best few; take the first that survives.
        quads = []
        for q in combinations(pool, 4):
            hs = [hc[x] for x in q]
            if max(hs) - min(hs) > MEM_HUB_SPREAD:
                why["q.hubspread"] += 1
                continue
            ps = [pc[(q[a], q[b])] for a in range(4) for b in range(a + 1, 4)]
            if max(ps) > MEM_PAIR_MAX or min(ps) < MEM_PAIR_MIN:
                why["q.pair"] += 1
                continue
            if any(opposed(q[a], q[b]) for a in range(4) for b in range(a + 1, 4)):
                why["q.opposed"] += 1
                continue
            if sum(1 for a in range(4) for b in range(a + 1, 4) if kin[(q[a], q[b])]) < KIN_MIN:
                why["q.kin"] += 1
                continue
            if len(set(shape(vocab[x]) for x in q)) != 1:
                why["q.shape"] += 1
                continue
            if len(set(wordclass(vocab[x]) for x in q)) != 1:
                why["q.class"] += 1
                continue
            if not axis_ok(list(q)):
                why["q.axis"] += 1
                continue
            if any(samestem(vocab[q[a]], vocab[q[b]]) for a in range(4) for b in range(a + 1, 4)):
                why["q.stem"] += 1
                continue
            # prefer: everyone well inside the thread, evenly, and distinct
            quads.append((-(min(hs) * 2.0 - max(ps) - (max(hs) - min(hs))), q))
        if not quads:
            stat["hub: no clean foursome"] += 1
            continue
        quads.sort()

        # THE HUB'S OWN NEIGHBOURHOOD, once per hub and only once a foursome is
        # in hand. FAULT 2: a decoy inside it belongs to the thread however the
        # norms happen to have been sampled.
        hcos = [(cos(c, h), c) for c in decoy_pool]
        hcos.sort(reverse=True)
        nearh = set(c for _, c in hcos[:DEC_HUB_RANK])
        hcosd = {}
        for s, c in hcos:
            hcosd[c] = s

        # ONE HUB, UP TO HUB_ROUNDS BOARDS, on words that never overlap. The
        # big categories — SCHOOL has 106 members in the norms, MUSIC 109 —
        # comfortably hold two disjoint foursomes, and refusing the second was
        # throwing away good puzzles for no reason. Two boards off one hub can
        # never land on the same day (see the deal below).
        made = 0
        usedhere = set()
        for _, q in quads[:QUAD_TRY]:
            if made >= HUB_ROUNDS:
                break
            if set(q) & usedhere:
                continue
            ids = list(q)
            words = [vocab[i] for i in ids]
            sh = shape(words[0])
            wc = wordclass(words[0])
            minhub = min(hc[i] for i in ids)
            cent = unit(ids)
            # For the leave-one-out test below. Sm is the members' raw sum, so
            # every quantity the test needs falls out of scalars we already have.
            Sm = array("f", bytes(4 * DIMS))
            for i in ids:
                vi = V[i]
                for d in range(DIMS):
                    Sm[d] += vi[d]
            nSm = (sum(map(mul, Sm, Sm))) ** 0.5 or 1.0
            dmS = [sum(map(mul, V[i], Sm)) for i in ids]
            banned = set(cue_of[h].keys()) | set(resp_of.get(h, {}).keys()) | {h} | set(ids)
            common4 = hubset.get(ids[0], EMPTY)
            for i in ids[1:]:
                common4 = common4 & hubset.get(i, EMPTY)

            # ---- find the impostor ------------------------------------------
            best = None                       # (score, decoy, hubgap, tempt)
            for cand in decoy_pool:
                if cand in banned or cand in usedhere:
                    why["d.norms"] += 1
                    continue
                if cand in nearh:
                    why["d.rank"] += 1
                    continue
                if dshape[cand] != sh or dclass[cand] != wc:
                    why["d.shape/class"] += 1
                    continue
                if uses[cand] >= MAX_USES:
                    continue
                cw = vocab[cand]
                if not thingy(cand):
                    why["d.thing"] += 1
                    continue
                if not axis_ok(ids + [cand]):
                    why["d.axis"] += 1
                    continue
                if samestem(cw, vocab[h]) or any(samestem(cw, w) for w in words):
                    continue
                if opposed(cand, h) or any(opposed(cand, i) for i in ids):
                    why["d.opposed"] += 1
                    continue
                # a word the members themselves name is not an impostor, it is
                # their container: BOWL/CONTAINER, SHOE/FOOTWEAR. And a word the
                # members are named BY is a member.
                if any(cand in hubset.get(i, EMPTY) for i in ids):
                    why["d.named-by-member"] += 1
                    continue
                if sum(1 for i in ids if i in hubset.get(cand, EMPTY)) > 1:
                    continue
                # ...nor may it share the thread's other human labels
                if hubset.get(cand, EMPTY) & common4:
                    why["d.common4"] += 1
                    continue
                if sum(1 for r in via
                       if cand in hubset.get(r, EMPTY) or r in hubset.get(cand, EMPTY)
                       ) >= DEC_TWOSTEP:
                    why["d.twostep"] += 1
                    continue
                hcH = hcosd[cand]
                if hcH > DEC_HUB_MAX:
                    why["d.hubcos"] += 1
                    continue
                gap = minhub - hcH
                if gap < HUBGAP_MIN or gap > HUBGAP_MAX:
                    why["d.gap"] += 1
                    continue
                tempt = dot(cent, cand)
                if tempt < TEMPT_MIN:
                    why["d.tempt"] += 1
                    continue
                ds = [cos(cand, i) for i in ids]
                if max(ds) > DEC_PAIR_MAX or max(ds) < DEC_PAIR_MIN \
                        or max(ds) - min(ds) > DEC_SPREAD_MAX:
                    why["d.decpair"] += 1
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
                    why["d.clash"] += 1
                    continue
                # THE LEAVE-ONE-OUT TEST — the statistic a player actually uses.
                # For each of the five, how well does it fit the other four? The
                # impostor has to be the worst fit, and by a clear margin, or
                # somebody can point at a different word and be right. This is
                # what rules out UMBRELLA among hail/storm/mist, or BOWL among
                # chicken/cabbage/noodle: the object among the phenomena is a
                # bigger outlier than the impostor we chose.
                #   S = Sm + v_cand,  fit(x) = cos(x, unit(S − v_x))
                # and every term of that is a scalar we already have.
                dS = tempt * nSm
                S2 = nSm * nSm + 2.0 * dS + 1.0
                fits = []
                for k in range(4):
                    xS = dmS[k] + ds[k]
                    fits.append((xS - 1.0) / ((S2 - 2.0 * xS + 1.0) ** 0.5 or 1.0))
                worstfit = min(fits)
                if max(fits) - worstfit > MEM_FIT_SPREAD:
                    why["d.memberfit"] += 1
                    continue                      # a member is half an outlier
                xS = dS + 1.0
                fitd = (xS - 1.0) / ((S2 - 2.0 * xS + 1.0) ** 0.5 or 1.0)
                if fitd > worstfit - OUT_GAP:
                    why["d.notoutlier"] += 1
                    continue
                # IT HAS TO COME FROM SOMEWHERE. An impostor with no thread of
                # its own is just a stray word; the good ones are visitors from
                # the next category along, and that category is the best wrong
                # answer on the naming card.
                home = -1
                for g, cnt in sorted(resp_of.get(cand, {}).items(), key=lambda kv: -kv[1]):
                    if cnt < DEC_HOME_CUE or not playable(g, NAMERANK):
                        continue
                    if g == h or g in ids or samestem(vocab[g], vocab[h]) or opposed(g, h):
                        continue
                    if sum(1 for i in ids if g in hubset.get(i, EMPTY)) > 1:
                        continue
                    if cos(g, h) < DEC_HOME_FAR:
                        home = g
                        break
                if home < 0:
                    why["d.nohome"] += 1
                    continue
                # the impostor we want is the one that is plainly outside the
                # thread but still tempting: maximise temptation, not confusion.
                sc = tempt - 0.35 * gap
                if best is None or sc > best[0]:
                    best = (sc, cand, gap, tempt, home)
            if best is None:
                stat["quad: no impostor"] += 1
                continue

            _, dec, gap, tempt, home = best
            five = ids + [dec]

            # ---- the answer must be the only answer ----------------------
            # For each of the five in turn, take it out, put the impostor in,
            # and ask how nameable the foursome that leaves is — searching the
            # whole common vocabulary for the best name it could possibly have,
            # whether or not anybody ever wrote that name down. The true
            # foursome has to beat every rival outright. This is the gate that
            # enforces the one rule: a board where two of the five could each be
            # argued is a broken board.
            fs = frozenset(five)
            mine, myname = thread(ids, fs)
            worst = -2.0
            rivalw = -1
            ok = True
            for j in range(4):
                alt = [ids[k] for k in range(4) if k != j] + [dec]
                sv, tv = thread(alt, fs)
                if sv > worst:
                    worst, rivalw = sv, tv
                if mine - sv < RIVAL_GAP:
                    ok = False
                    break
            if not ok:
                stat["quad: a rival foursome was nameable too"] += 1
                continue

            # ---- four wrong names for the thread -------------------------
            # Plausible, never right. A name has to be one somebody could
            # believe — evoked by some of the five AND sitting near them — but
            # it may never be evoked by more than NAME_COVER of the four
            # members, which would make it a second correct answer. The
            # impostor's own strongest thread goes first: the nicest wrong name
            # on the card is the one the impostor came from.
            cent5 = unit(five)
            cover = defaultdict(int)
            for w5 in five:
                for r in resp_of.get(w5, {}):
                    cover[r] += 1
            order = [home] + [r for r, _ in
                              sorted(resp_of.get(dec, {}).items(), key=lambda kv: -kv[1])]
            order += [r for r, _ in
                      sorted(cover.items(), key=lambda kv: (-kv[1], -dot(cent5, kv[0])))]
            wrong = []
            seen = set()
            for t in order:
                if len(wrong) >= 4:
                    break
                if t in seen:
                    continue
                seen.add(t)
                if t == h or t in five or not playable(t, NAMERANK):
                    continue
                if t in common4 or opposed(t, h):
                    continue
                if samestem(vocab[t], vocab[h]) or any(samestem(vocab[t], vocab[x]) for x in five):
                    continue
                if any(samestem(vocab[t], vocab[u]) for u in wrong):
                    continue
                if cos(t, h) > 0.52:                 # a synonym of the right answer
                    continue
                if dot(cent5, t) < NAME_FLOOR:       # nobody would ever pick it
                    continue
                # never a second correct name: it must miss at least two members
                if sum(1 for i in ids if t in hubset.get(i, EMPTY)) > NAME_COVER:
                    continue
                wrong.append(t)
            if len(wrong) < 4:
                stat["quad: not enough believable wrong names"] += 1
                continue

            fs4 = frozenset(ids)
            if any(len(fs4 & prev) > BOARD_OVERLAP for prev in seenfive):
                stat["quad: too like a board already shipped"] += 1
                continue
            seenfive.append(fs4)
            if h not in usedhubs:
                usedhubs.append(h)

            hard = max(0, min(100, int(round(
                180.0 * (0.40 - gap) + 90.0 * (tempt - TEMPT_MIN) + 20.0))))
            for x in five:
                uses[x] += 1
            usedhere |= set(five)
            rounds.append({"ids": ids, "dec": dec, "hub": h, "wrong": wrong,
                           "gap": gap, "tempt": tempt, "mine": mine, "worst": worst,
                           "myname": myname, "rival": rivalw, "hard": hard})
            raw.write("\t".join(str(x) for x in
                                ids + [dec, h] + wrong + ["%.4f" % gap, "%.4f" % tempt,
                                                          "%.4f" % (mine - worst), hard]) + "\n")
            raw.flush()
            made += 1

    raw.close()

    # ── deal into days: four rounds, one from each quartile, easy -> hard ────
    rounds.sort(key=lambda r: r["hard"])
    ndays = len(rounds) // 4
    q = [rounds[i * ndays:(i + 1) * ndays] for i in range(4)]
    days = []
    for i in range(ndays):
        days.append([q[0][i], q[1][i], q[2][i], q[3][i]])
    # One hub may now contribute two boards, and two boards off SCHOOL on the
    # same morning would read as a mistake. Swap within the quartile until no
    # day names the same thread twice.
    for lane in range(4):
        for i in range(ndays):
            hubs_here = set(days[i][k]["hub"] for k in range(4) if k != lane)
            if days[i][lane]["hub"] not in hubs_here:
                continue
            for j in range(ndays):
                if j == i:
                    continue
                other = set(days[j][k]["hub"] for k in range(4) if k != lane)
                if days[i][lane]["hub"] in other or days[j][lane]["hub"] in hubs_here:
                    continue
                days[i][lane], days[j][lane] = days[j][lane], days[i][lane]
                break
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
    for k in sorted(why, key=lambda k: -why[k]):
        lines.append("  %-42s %d" % (k, why[k]))
    lines.append("")
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
                "   Every round here survived, in this order: all five words ordinary, shape-\n"
                "   matched, class-matched and agreeing on five derived axes (abstract, verb,\n"
                "   adjective, person, place) so the impostor is never the only one of its\n"
                "   KIND; no opposites anywhere on the board; the four kin to each other in the\n"
                "   norms beyond merely sharing the hub; the impostor outside the thread by a\n"
                "   measured margin AND outside the hub's 320 nearest words AND never linked to\n"
                "   the hub by a single person in either direction; and a search of the common\n"
                "   vocabulary for the best possible NAME of every rival foursome, which the\n"
                "   true foursome had to beat outright.\n"
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
