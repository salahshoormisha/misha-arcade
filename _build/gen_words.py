#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_words.py -- build core/data/words.js  (window.AD_WORDS), CONTRACT.md §6.

    python3 _build/gen_words.py            # write the file + print the self-check
    python3 _build/gen_words.py --tails    # also print the low-frequency tail of
                                           # every generated list (junk-hunting)

DETERMINISTIC: every list is sorted (or frequency-ordered with an alphabetical
tiebreak) before it is written, so re-running produces a byte-identical file.
STDLIB ONLY.  No network.  Nothing is generated at page load.

------------------------------------------------------------------ the sources
  /usr/share/dict/words + /usr/share/dict/connectives
        Webster's Second (1934), public domain.  The primary dictionary gate: it
        lists proper nouns capitalised, so requiring a LOWERCASE headword (or a
        regular inflection of one) throws out place names and given names for
        free, and the capitalised-only entries give a second, independent
        proper-noun screen.  8,498 five-letter lowercase headwords.
        CAVEAT, verified here: the BSD web2 file has holes in exactly the place
        you would least expect — it has BOXBERRY, BOXBOARD and BOXCAR but not
        BOX; NEARABLE and NEAP but not NEAR; no HELD, PAID, PROUD, WOMEN,
        GEESE.  So web2 alone cannot be the only gate, which is why route (c)
        below exists.
  _build/src/words_alpha.txt        dwyl/words_alpha (Unlicense), 370k words.
        A superset of web2 (verified: web2-lowercase minus words_alpha = 0).
        Used to enumerate candidates and, together with corpus frequency, to
        fill web2's holes.
  _build/count_1w.txt               Norvig / Google Web Trillion Word Corpus
        (333,333 words with counts).  The commonness signal.
  _build/en_50k.txt                 hermitdave FrequencyWords, English subtitle
        corpus, 50k ranked -- a second, speech-weighted commonness signal.
  _build/20k.txt                    first20hours/google-10000-english (20k).
  _build/xw_pool.json               the crossword pool built by _build/xw_words.py
        (frequency-ranked, dictionary-validated, blocklisted, name-filtered).
  _build/words_authored.py          the hand-authored input lists (ANS5, ANS4,
        CROSS3, MODERN, PERSIAN, RESCUE, JUNK, BLOCK_HARD, BLOCK_SOFT).
  _build/src/ldnoobw_en.txt         LDNOOBW "bad words" list -- profanity screen.
  /usr/share/dict/propernames, _build/src/firstnames.txt,
  _build/src/surnames.csv (US Census top surnames) -- the name screen.

------------------------------------------------------------ what counts as a word
  A candidate is ATTESTED if any of:
    (a) it is a lowercase web2 headword;
    (b) it is a regular inflection of one (-s/-es/-ies/-ed/-ing/-er/-est/-ly,
        xw_words.dict_reason);
    (c) it is in words_alpha AND has real corpus frequency AND is not a
        capitalised-only web2 entry and not a personal name -- this is what
        rescues BOX, NEAR, HELD, PAID, PROUD, WOMEN, GEESE;
    (d) it is on an explicit curated allowlist (words_authored.MODERN,
        xw_words.ALLOW, EXTRA_VALID below), each hand-checked.

------------------------------------------------------------------ the gates
  HARD BLOCK  (LDNOOBW + words_authored.BLOCK_HARD, plus -s/-es plurals of any
              blocked string that is not itself an ordinary word) -- removed
              from EVERY list, including the "is this a word" guess lists.
  SOFT BLOCK  (words_authored.BLOCK_SOFT: kill/death/war/drugs...) -- ordinary
              English, so it stays LEGAL AS A GUESS (valid4/valid5/boxed) but
              never appears as an answer, a crossword entry or a hint.
  NAMES       -- a candidate that is not a lowercase web2 headword and is a
              given name / top-2000 US surname is dropped.  Words that ARE web2
              headwords (mark, bill, frank, brown) are kept: they are words.
  JUNK        -- hand-collected lowercased proper nouns, foreign words and
              abbreviations that survive the other gates.  Applied to the
              curated lists (answers/cross/boxed/common), not to the guess
              lists, where being permissive only ever helps the player.

------------------------------------------------------------------ the output
  window.AD_WORDS = { ...STRICT JSON... };   then a 6-line IIFE that splits the
  space-separated strings into arrays.  Storing "aback abase abate" instead of
  ["aback","abase","abate"] saves ~40% of the file.  The RUNTIME shape is
  exactly CONTRACT §6:
      answers5[] valid5[] answers4[] valid4[] boxed[] cross{3..7}[] persian[{w,from}]
  plus common5[] (the ~300 most frequent answers, for easy mode and hints).
"""
from __future__ import print_function

import json
import os
import random
import re
import sys

B = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(B)
OUT = os.path.join(ROOT, 'core', 'data', 'words.js')
sys.path.insert(0, B)

import words_authored as WA          # noqa: E402  (hand-authored inputs)
import xw_words as XW                # noqa: E402  (web2 + inflection validator)

SEED = 20260725                      # fixed: the report's "random" samples are stable


# ─────────────────────────────────────────────────────────────── tiny helpers
def tok(s):
    """Hand-authored blocks -> word list.  Tolerates stray punctuation ('exalt?')."""
    return re.findall(r'[a-z]+', s.lower()) if isinstance(s, str) else []


def rd(path):
    return open(path, 'r', encoding='utf-8', errors='ignore')


# ────────────────────────────────────────────────────────────────── the corpus
WEB2 = XW.WEB2                                   # lowercase headwords (web2 + connectives)

# Capitalised-only web2 entries = proper nouns (Allah, Asian, Bible, Russia...).
# A second, independent proper-noun screen that costs nothing.
PROPER = set()
with rd('/usr/share/dict/words') as f:
    for line in f:
        w = line.strip()
        if w and w[0].isupper() and w.isalpha():
            PROPER.add(w.lower())
PROPER -= WEB2

ALPHA = set()
with rd(os.path.join(B, 'src', 'words_alpha.txt')) as f:
    for line in f:
        w = line.strip()
        if w and w.isalpha() and w.islower():
            ALPHA.add(w)

FREQ = {}                                        # Norvig count_1w -> raw count
with rd(os.path.join(B, 'count_1w.txt')) as f:
    for line in f:
        p = line.rstrip('\n').split('\t')
        if len(p) == 2 and p[0].isalpha() and p[0].islower():
            try:
                FREQ[p[0]] = int(p[1])
            except ValueError:
                pass

SUB = {}                                         # en_50k subtitle rank (1 = commonest)
with rd(os.path.join(B, 'en_50k.txt')) as f:
    r = 0
    for line in f:
        p = line.split()
        if len(p) == 2 and p[0].isalpha() and p[0].islower():
            r += 1
            SUB.setdefault(p[0], r)

G20 = {}                                         # google-20k rank
with rd(os.path.join(B, '20k.txt')) as f:
    for i, line in enumerate(f):
        w = line.strip().lower()
        if w and w.isalpha():
            G20.setdefault(w, i)


def freq(w):
    return FREQ.get(w, 0)


def subrank(w):
    return SUB.get(w, 10 ** 9)


def sortkey(w):
    """Frequency-descending, alphabetical tiebreak -> deterministic."""
    return (-freq(w), subrank(w), w)


# ──────────────────────────────────────────────────────────────── the screens
def _expand(block):
    return set(tok(block))


HARD = _expand(WA.BLOCK_HARD)
with rd(os.path.join(B, 'src', 'ldnoobw_en.txt')) as f:
    for line in f:
        t = line.strip().lower()
        if t and re.fullmatch(r'[a-z]+', t):
            HARD.add(t)
# Inflections of a slur are slurs too: block the regular forms of every blocked
# string, then hand back the ordinary English words the walk swallows on the way
# (SPIC -> SPICY/SPICED, BUTT -> BUTTER, MONG -> MONGER, TAIG -> TAIGA, TIT ->
# TITER).  The reclaim list was built by printing every generated form that is a
# web2 headword or has real corpus frequency, and reading all 96 of them.
HARD_RECLAIM = set("""
assess assessed assessing butter butting butty cripes dicker dicky dickies
spiced spicer spicing spicy spica spices sucker sucked sucking snatched
snatcher snatching pricked pricking monger taiga titer skeeter spunky beanery
""".split())
SUF = ('s', 'es', 'ed', 'd', 'ing', 'er', 'r', 'ers', 'rs', 'est', 'st',
       'y', 'ies', 'a', 'ish')
for w in list(HARD):
    for suf in SUF:
        HARD.add(w + suf)
    if w.endswith('e'):                  # rape -> raped/raping/raper, nude -> nuder
        for suf in ('ed', 'ing', 'er', 'ers', 'est', 'y', 'ies'):
            HARD.add(w[:-1] + suf)
HARD -= HARD_RECLAIM

# Leaks found by the substring screen in the self-check below, added by hand.
# The sexual-anatomy / sexual-orientation entries are excluded as adult-content
# vocabulary, symmetrically (HETEROSEXUAL is out for the same reason as
# HOMOSEXUAL) -- they are simply not daily-puzzle words.
HARD |= set("""
kikes redskins coony nazim nazir fagot fagots booby boobies bimbo bimbos hussy
hussies slag slags butch homo homos erotica dildos pantyhose gimps shags scats
japs wench wenches strumpet massa
homosexual homosexuals homosexuality heterosexual heterosexuals bisexual
bisexuals vaginal genital genitals genitalia penile intercourse
""".split())

# Ordinary words, legal as GUESSES, that a cosy daily arcade should never serve
# as an answer, a crossword entry or a Letter Boxed solution.  Added to the
# hand-authored BLOCK_SOFT list.
EXTRA_SOFT = """
abortion abortions homicide slavery slave slaves slavers racist racism racial
racially terror terrorism terrorist terrorists oriental lynch lynched lynching
noose massacre genocide torture tortured hostage hostages fascist fascism
jihad abort aborted
"""

SOFT = _expand(WA.BLOCK_SOFT) | _expand(EXTRA_SOFT)
# ...and their regular inflections (TUMORS, CANCERS, BOMBER, KILLERS): the soft
# list is checked by exact match, so without this the plural walks straight in.
# All 26 collisions with ordinary words were read; only the SUCK- family is
# reclaimed (it is only on the list at all as mild profanity).
for w in list(SOFT):
    for suf in ('s', 'es', 'ed', 'ing', 'er', 'ers'):
        SOFT.add(w + suf)
SOFT -= HARD_RECLAIM
# JUNK: lowercased proper nouns, foreign words, abbreviations -- not words.
# XW.BLOCK is the CROSSWORD-specific blocklist (crosswordese, abbreviations,
# and grid-unfriendly vocabulary); it also contains ordinary words like BLOOD,
# DELTA and CRACK, so it is applied to the crossword lists ONLY.
JUNK = _expand(WA.JUNK)
JUNK_CROSS_ONLY = _expand('\n'.join(XW.BLOCK))
RESCUE = _expand(WA.RESCUE) | set(XW.EXEMPT)

NAMES = set()
for p in ('/usr/share/dict/propernames', os.path.join(B, 'src', 'firstnames.txt')):
    if os.path.exists(p):
        with rd(p) as f:
            for line in f:
                w = line.strip().lower()
                if w.isalpha():
                    NAMES.add(w)
SURNAME_RANK_MAX = 2000                          # US Census top-2000 surnames only
with rd(os.path.join(B, 'src', 'surnames.csv')) as f:
    next(f, None)
    for line in f:
        p = line.split(',')
        if len(p) > 2 and p[0].isalpha():
            try:
                if int(p[1]) <= SURNAME_RANK_MAX:
                    NAMES.add(p[0].lower())
            except ValueError:
                pass
NAMES -= RESCUE

MODERN = set(tok(WA.MODERN))
MODERN_VOUCHED = set(tok(WA.MODERN_VOUCHED))

VOWELS = set('aeiouy')


def hard_blocked(w):
    return w in HARD


CURATED = set()                                  # filled in below, after EXTRA_VALID
ATTEST_FREQ = 4.0e5                              # route (c): real corpus usage
ATTEST_SUB = 30000                               # ...or it is spoken often enough


def is_name(w):
    """Proper-noun screen.  Never bites a web2 headword or a curated word (MARK,
    BILL, FRANK, BROWN and RUGBY are words), and does bite the plural of a
    proper noun (AFRICANS, GERMANS), which the frequency route would otherwise
    wave through."""
    if w in WEB2 or w in CURATED:
        return False
    if w in NAMES or w in PROPER:
        return True
    if w.endswith('s') and (w[:-1] in NAMES or w[:-1] in PROPER):
        return True
    if w.endswith('es') and (w[:-2] in NAMES or w[:-2] in PROPER):
        return True
    return False


def attested(w):
    """Is w a real English word?  See "what counts as a word" in the docstring."""
    if w in WEB2:
        return 'web2'
    if w in CURATED:
        return 'curated'
    r = XW.dict_reason(w)
    if r:
        return r
    if w in ALPHA and not is_name(w) and (freq(w) >= ATTEST_FREQ or
                                          subrank(w) <= ATTEST_SUB):
        return 'alpha+freq'
    return None


def sane(w):
    """Shape sanity: has a vowel, no 3-in-a-row repeats, plausible as English."""
    if not (w and w.isalpha() and w.islower()):
        return False
    if not (set(w) & VOWELS):
        return False
    for i in range(len(w) - 2):
        if w[i] == w[i + 1] == w[i + 2]:
            return False
    return True


# ────────────────────────────────────────────── curated additions (this script)
# Words the automatic gates would drop but that any solver knows, and words the
# automatic gates would ADD but that no one wants to meet in a daily puzzle.
# Every entry here was eyeballed one at a time against the generated tails.
EXTRA_ANS5 = """
alien amber ankle apron badly bland blaze blitz bloom blush brand brass bread
brick bride broom brush buddy budge bumpy cabin cameo canoe cargo chunk clamp
cliff cloak clove clump comet cough couch crane crate creek creep crisp crumb
crust daisy dairy debit denim depth diner dodge dough drape dress dryer
eager easel ebony elbow elite ember enact endow ferry fetch flair flame
fleet flint flour fluff flush focal forge frost fudge gauge ghost glide gloss
glove grasp gravy grill groom grove gruff habit haste hedge hinge hobby honey
hound humor ivory jelly jetty jewel jolly kayak kneel knelt knife knock koala
ladle lapse latch leash ledge lemon lever lilac linen llama lodge lunch magma
maple marsh medal melon mercy mirth moist motto mound mouse mural nacho
niece noble nudge oasis olive onion opera otter ozone paddy panda pansy pasta
patch pearl pedal penny perch pilot pinch pitch plaid plank plaza plumb poppy
porch prawn prism prize prong prune quail quart quilt quirk quota rabbi
ranch rebel relic rhino ridge rinse risky robin rodeo rouge royal rugby
salsa satin sauna scarf scoop scout scrap shark shawl sheep sheet shelf shine
shore shrub siren skate skirt slate sleek slice slime slope slush smock snack
snail snore socks solar spark spice spine spoon sprig squid stack stale
stark stump surge swirl syrup tacky talon tango taper tempo thorn tiara tidal
tiger toast tonic torch towel trout tulip tunic tutor twine ulcer usher vault
venue vigil villa vinyl vivid vodka wafer wagon waltz whale wharf wheat whisk
widow wince wharf woven wrist yacht yeast yodel yummy zebra zesty
"""

# NOT WORDS: lowercased place names, brands, given names, foreign words and
# abbreviations that clear the dictionary + frequency gates.  Collected by
# eyeballing the generated tails (`--tails`).  Nothing here is an ordinary
# English common noun -- ordinary words that merely READ as proper nouns
# (delta, china, turkey, polish) are left in the guess lists.
EXTRA_JUNK = """
aaron acura aires ajax alexa allah altos amiga amigo andes angus anton armani
asian aussie aztec azusa bhutan bilbo boise brazil briton buddha burma cairo
carib celts chile chios cisco congo corel corfu cuban czech dakar dalai danish
dawson delhi denver diablo dixie dorset dubai dutch eddie egypt elvis essex
eurasia evite fiji fresno gabon gaelic gambia gaza genoa ghana gucci haiti
hawaii hebrew hindi hindu honda hyundai ibiza inca indies indus intel irish
islam italy iowa japan jesus jewish jonah judaism julio kansas kenya korea
kuwait kyoto laos latino latvia libya lima linux london lycos macau madrid
malawi malta manila maori mecca mexico miami milan mongol mumbai munich muslim
nepal nevada nike nikon nokia notre norway nubian ohio omaha oregon oxford
panama papua paris polska prague punjab qatar quebec quran renault reuters
rwanda salem samoa saudi seoul serbia seville shiva siberia sicily sinai slavic
slovak somali soviet spain sudan sweden swiss sydney syria taiwan tampa texas
tibet tokyo tunis turk turkish tuscan uganda ukraine urdu utah vegas venice
verde vienna vietnam viking wales warsaw welsh yahoo yemen yiddish yoruba yukon
zaire zambia zionist zulu buick clive dante franz claus mardi trump satan
nigeria mongolia pakistan siberia bavaria bohemia arabia persia anatolia
punta boing reits bayer huron wigan argos ching weezer qantas
abbr admin advil aspx blvd ceos cfos cgi ciao cmos corp crm ctrl dhcp dsl eval
exec faq faqs ffff fyi gnu gpa gui href html http https iirc imho inet ipo irc
iso isp jpeg jpg lan lcd lite mailto mfg mhz mpeg mph msg mysql nbsp nntp nsw
oled pdf perl php pkg png pref pubs pwd qty rdf regex repl req rfc rpm rss sdk
sgml sku smtp sql ssl subj svc tbsp tcp tif tiff tmp tsp txt uid usr utf uuid
vhs vlan vpn wap wav xhtml xml xsl
bbs bios cvs dns dvd exe gif gnome img jsp kde lisp msdos ncr novell nvidia oem
oracle pentium pgp posix ppc qbasic rpc sas sco sgi shockwave sms solaris sparc
spss ssh svga sybase sysop tcl telnet tftp tty unix uucp vax vga vlsi vms wais
wysiwyg xerox xmas xterm yacc zilog const multi supra lemma
"""

# Real words, but never as an ANSWER or a hint: informal/dialect spellings,
# apostrophe-less contractions, crudities, and words whose everyday sense is
# unpleasant.  They stay legal as guesses.
ANS_JUNK = """
dunno gonna gotta wanna gimme momma mamma mommy daddy piggy kiddo aunty fella
bloke howdy snuck takin doesn weren needn hadn wasn couldn shouldn ain aint
spank thong booty butch moron idiot filth curse loser tramp swine phony freak
whack bleep sarge honks thuds mafia agony wrath stink drown haunt medic sniff
psych bawdy hooch hokey dorky gooey icky yucky dweeb
dummy dopey grody scuzzy skank weirdo bimbo klutz
adobe excel vista canon login remix ascii toner urine vomit didnt june
china morse blogs babe anti nuke
whoo whew ahem gosh ouch whoa blah nope darn poop scum dope dumb brat lust
jerk kung dong ling quid nova jake char null hist para hulk coma sire ding
"""

# Ordinary English words that the CROSSWORD blocklist (xw_words.BLOCK) removes
# for grid reasons but that make perfectly good answers.  Put back by hand.
RECLAIM_ANS = """
delta aspen blood usher dodge crack flash metro micro rugby dial memo sick teen
"""

# Curated allowlist: everyday words the 1934 dictionary predates and the
# frequency lists rank too low, but which belong in a modern word game.
EXTRA_VALID = """
blog blogs vlog vlogs emoji emojis meme memes selfie selfies wifi
podcast podcasts hashtag hashtags avatar avatars webcam laptop laptops
taco tacos burrito nacho nachos sushi ramen tofu bagel bagels donut donuts
latte lattes mocha panini pesto salsa pasta pizza pizzas quinoa hummus
falafel kebab kebabs baklava naan pilaf samosa tandoori biryani
vegan vegans paleo detox yoga pilates zumba
scuba snorkel kayak kayaks hoodie hoodies denim jeans leggings sneaker sneakers
retro combo condo promo intro demo memo metro
robot robots drone drones laser lasers pixel pixels modem router
email emails inbox online offline website websites browser browsers
karaoke playlist mixtape smoothie granola oatmeal ketchup yogurt
"""


# ───────────────────────────────────────────────────────── candidate assembly
# ── the Persian pack.  words_authored.PERSIAN, re-checked entry by entry
#    against OED / Merriam-Webster / etymonline senses.  Anything whose Persian
#    link is only "perhaps" was dropped; where Persian is an intermediary rather
#    than the origin, the gloss says so.  These are an explicit curated
#    allowlist: MAGUS and MOGUL, for instance, are ordinary dictionary words
#    that the 1934 web2 file happens to list only capitalised.
PERSIAN_DROP = {
    # M-W and the OED trace satin to Arabic zaytūnī, from Zaytūn = Quanzhou in
    # China -- the Persian step is speculative, so it does not ship.
    'SATIN',
}
PERSIAN_ADD = [
    # Greek arsenikon <- Syriac zarnīkā <- Middle Persian zarnīk, "orpiment",
    # from zar "gold" (Merriam-Webster).  As solid as the rest of the list.
    ('ARSENIC', u'zarnīk (Middle Persian), yellow orpiment, from zar, gold'),
]
PERSIAN_REGLOSS = {
    'CANDY': u'qand, cane sugar — Persian into Arabic qandī, then French',
    'SUGAR': u'shakar, sugar — Persian into Arabic sukkar, then Old French',
    'ORANGE': u'nārang, orange — Persian into Arabic nāranj, then Old French',
    'SHERBET': u'sharbat, a sweet drink — Persian into Turkish şerbet',
    'LACQUER': u'lāk, lac resin — Persian into Arabic lakk, then Portuguese',
    'PEACH': u'named for Persia — Old Persian Pārsa, via Latin persica, "Persian apple"',
    'NAPHTHA': u'naft, petroleum — Persian into Greek naphtha',
    'TANDOOR': u'tanūr, clay oven — Persian into Urdu tandūr',
    'ALGORITHM': u'from al-Khwārizmī, the Persian mathematician of Khwārazm',
    'PARADISE': u'pairi-daēza (Old Iranian), a walled garden — into Greek paradeisos',
}

EXTRA_VALID_SET = set(tok(EXTRA_VALID))
EXTRA_JUNK_SET = set(tok(EXTRA_JUNK))
JUNK |= EXTRA_JUNK_SET
# The answer/hint screen reuses the crossword blocklist -- it is a good hand-made
# catalogue of lowercased place names and brands (KODAK, TONGA, TWAIN, CHEVY,
# DOVER, MONTE are all real web2 headwords, and all read as proper nouns) --
# minus the ordinary words reclaimed above.
ANS_JUNK_SET = (set(tok(ANS_JUNK)) | JUNK_CROSS_ONLY) - set(tok(RECLAIM_ANS))
CURATED |= MODERN | EXTRA_VALID_SET | set(XW.ALLOW) | set(tok(RECLAIM_ANS)) | set(
    p[0].lower() for p in list(WA.PERSIAN) + PERSIAN_ADD)

UNIVERSE = ALPHA | WEB2 | CURATED | set(tok(WA.ANS5)) | set(tok(WA.ANS4)) \
    | set(tok(EXTRA_ANS5)) | set(tok(WA.CROSS3))


def by_len(maxlen=12):
    out = dict((L, set()) for L in range(3, maxlen + 1))
    for w in UNIVERSE:
        L = len(w)
        if 3 <= L <= maxlen and w.isalpha() and w.islower():
            out[L].add(w)
    return out


BYLEN = by_len(12)


# ── the guess lists: permissive on purpose.  A player must never be told that a
#    real word "is not a word".  Gates: dictionary-attested (any of the four
#    routes), not a proper noun, not a slur.
def build_valid(L):
    out = set()
    for w in BYLEN[L]:
        if hard_blocked(w) or not sane(w) or is_name(w):
            continue
        if w in JUNK and w not in WEB2:
            continue          # lowercased place names and abbreviations: not words
        if attested(w):
            out.add(w)
    return out


VALID5 = build_valid(5)
VALID4 = build_valid(4)


# ── the answer lists: every word must be one a player recognises instantly.
STEM_FREQ = 1.0e6                      # a stem this common makes the word an inflection


def is_stem(s):
    return len(s) >= 3 and s in ALPHA and freq(s) >= STEM_FREQ


def inflected(w):
    """Plural / past / present-participle of a common word?  Stems are checked
    against words_alpha + frequency, not web2, because web2 is missing BOX."""
    if w.endswith('s') and not w.endswith('ss'):
        if is_stem(w[:-1]) or (w.endswith('es') and is_stem(w[:-2])) or \
           (w.endswith('ies') and is_stem(w[:-3] + 'y')):
            return True
    if w.endswith('ed') and (is_stem(w[:-2]) or is_stem(w[:-1]) or
                             (w.endswith('ied') and is_stem(w[:-3] + 'y'))):
        return True
    if w.endswith('ing') and (is_stem(w[:-3]) or is_stem(w[:-3] + 'e')):
        return True
    return False


def answer_ok(w, hand):
    """Shape/quality gate for an AUTOMATIC answer-list addition.  Deliberately
    much stricter than the guess list: an automatic addition must be a real
    dictionary HEADWORD (or curated), so slang, apostrophe-less contractions
    (DOESN, WEREN) and lowercased place names cannot reach the answer list."""
    if w in hand:
        return True
    if hard_blocked(w) or w in SOFT or w in JUNK or w in ANS_JUNK_SET:
        return False
    if w in NAMES or is_name(w) or w in PROPER:
        return False
    if attested(w) not in ('web2', 'curated'):
        return False
    if inflected(w):
        return False                       # no plurals, no -ed, no -ing as answers
    return True


def build_answers(L, hand_block, extra_block, target, freq_floor, sub_max):
    hand = set()
    rejected = []
    for w in tok(hand_block) + tok(extra_block):
        if len(w) != L:
            rejected.append((w, 'wrong length'))
            continue
        if hard_blocked(w):
            rejected.append((w, 'blocked'))
            continue
        if w in SOFT:
            rejected.append((w, 'soft-blocked'))
            continue
        if w in JUNK or w in ANS_JUNK_SET:
            rejected.append((w, 'junk'))
            continue
        if w not in (VALID5 if L == 5 else VALID4):
            rejected.append((w, 'not in valid%d' % L))
            continue
        hand.add(w)

    auto = []
    for w in (VALID5 if L == 5 else VALID4):
        if w in hand:
            continue
        if freq(w) < freq_floor and subrank(w) > sub_max:
            continue
        if answer_ok(w, hand):
            auto.append(w)
    auto.sort(key=sortkey)

    out = sorted(hand, key=sortkey)
    for w in auto:
        if len(out) >= target:
            break
        out.append(w)
    seen, uniq = set(), []
    for w in out:
        if w not in seen:
            seen.add(w)
            uniq.append(w)
    return uniq, rejected


ANSWERS5, REJ5 = build_answers(5, WA.ANS5, EXTRA_ANS5, 1800, 4.0e6, 9000)
ANSWERS4, REJ4 = build_answers(4, WA.ANS4, '', 1300, 6.0e6, 7000)

# openers first (a friendly first week), frequency order after
OPEN5 = [w for w in tok(WA.OPENERS5) if w in set(ANSWERS5)]
OPEN4 = [w for w in tok(WA.OPENERS4) if w in set(ANSWERS4)]
ANSWERS5 = OPEN5 + [w for w in ANSWERS5 if w not in set(OPEN5)]
ANSWERS4 = OPEN4 + [w for w in ANSWERS4 if w not in set(OPEN4)]

VALID5 |= set(ANSWERS5)
VALID4 |= set(ANSWERS4)

COMMON5 = [w for w in sorted(ANSWERS5, key=sortkey) if freq(w) > 0][:300]


# ── Letter Boxed.  Two rules make most of the dictionary unusable, so they are
#    applied here instead of shipping words the game can never accept:
#      * consecutive letters must come from different sides, and a letter is on
#        the same side as itself -> NO WORD WITH A DOUBLED LETTER can ever be
#        played (verified against a live NYT puzzle dictionary: 0 such words);
#      * the board has exactly 12 distinct letters -> a word using more than 12
#        distinct letters can never be played.
#    Everything else is a straight commonness gate, loosened for longer words
#    because long words are rarer but are exactly what the game is played with.
#    The list is FREQUENCY-ORDERED, commonest first: the game validates against
#    the whole list but can take a prefix when it wants an elegant two-word
#    solution to show the player.
#    The floors fall with length (long words are rarer but are what the game is
#    played with) and then rise again at 11-12: a word that long has to cover
#    almost the whole board, so it is nearly unplayable and not worth the bytes.
BOXED_FLOOR = {3: 3.0e6, 4: 3.0e6, 5: 2.5e6, 6: 2.0e6, 7: 1.6e6,
               8: 1.2e6, 9: 9.0e5, 10: 1.3e6, 11: 2.2e6, 12: 2.2e6}


def has_double(w):
    for i in range(len(w) - 1):
        if w[i] == w[i + 1]:
            return True
    return False


def build_boxed():
    out = set()
    for L in range(3, 13):
        floor = BOXED_FLOOR[L]
        for w in BYLEN[L]:
            if has_double(w) or len(set(w)) > 12:
                continue
            if hard_blocked(w) or w in JUNK or w in SOFT or not sane(w):
                continue
            if is_name(w) or w in NAMES or w in PROPER:
                continue
            if attested(w) is None:
                continue
            if freq(w) >= floor:
                out.add(w)
    return out


BOXED = build_boxed()


# ── crossword fill.  3/4/5 come straight from the pool xw_words.py already
#    built (frequency-ranked, hand-blocklisted); 6/7 are built here with the
#    same recipe.  Nothing enters that is not a lowercase web2 headword or a
#    regular inflection of one, so proper nouns cannot leak in.
CROSS_LONG_RANK = 12000        # 6/7-letter fill comes from the top 12k words only


def good3():
    """The hand-picked 3-letter fill: words_authored.CROSS3 plus the (stricter,
    smaller) GOOD3 list _build/xw_fill.py uses.  The xw_pool 3-letter bucket is
    deliberately NOT used -- it is frequency-filtered but not hand-read, and
    three-letter fill is exactly where junk (AES, AMT, ORS, YRS) hurts most."""
    words = set(tok(WA.CROSS3))
    try:
        with rd(os.path.join(B, 'xw_fill.py')) as f:
            m = re.search(r'GOOD3\s*=\s*"""(.*?)"""', f.read(), re.S)
        if m:
            words |= set(tok(m.group(1)))
    except IOError:
        pass
    return words


def build_cross():
    pool = XW.load()
    cross = {}
    cross[3] = good3()
    cross[4] = set(pool[4].keys())
    cross[5] = set(pool[5].keys())
    for L in (6, 7):
        s = set()
        for w, r in G20.items():
            if len(w) != L or not sane(w) or r >= CROSS_LONG_RANK:
                continue
            if w in JUNK or w in JUNK_CROSS_ONLY or hard_blocked(w) or w in SOFT:
                continue
            if is_name(w) or w in NAMES or w in PROPER:
                continue
            if XW.dict_reason(w) is None and w not in CURATED:
                continue
            s.add(w)
        cross[L] = s
    for L in cross:
        cross[L] = set(w for w in cross[L]
                       if not hard_blocked(w) and w not in SOFT
                       and w not in JUNK and w not in JUNK_CROSS_ONLY
                       and not is_name(w) and w not in PROPER
                       and sane(w) and len(w) == L)
    return {L: sorted(v) for L, v in cross.items()}


CROSS = build_cross()


def build_persian():
    out = []
    seen = set()
    for w, src in list(WA.PERSIAN) + PERSIAN_ADD:
        w = w.upper()
        if w in PERSIAN_DROP or w in seen:
            continue
        lw = w.lower()
        if lw not in ALPHA and lw not in WEB2:
            continue                       # must be an English word in a dictionary
        seen.add(w)
        out.append({'w': w, 'from': PERSIAN_REGLOSS.get(w, src)})
    out.sort(key=lambda d: (len(d['w']), d['w']))
    return out


PERSIAN = build_persian()
# a signature pack is only playable if its 5-letter words are legal guesses
for p in PERSIAN:
    lw = p['w'].lower()
    if len(lw) == 5:
        VALID5.add(lw)
    if len(lw) == 4:
        VALID4.add(lw)
    if 3 <= len(lw) <= 12 and not has_double(lw) and len(set(lw)) <= 12:
        BOXED.add(lw)


# ───────────────────────────────────────────────────────────────────── output
HEADER = u"""/* core/data/words.js — window.AD_WORDS   (CONTRACT.md §6)

   The arcade's word lists: Wordish/Thirdle answers and legal guesses, the
   Letter Boxed dictionary, the crossword fill list, and the Persian-loanword
   signature pack.

   SOURCES
     Webster's Second (1934) via /usr/share/dict/words + connectives — public
       domain — is the dictionary gate.  It lists proper nouns capitalised, so
       requiring a lowercase headword (or a regular inflection of one) keeps
       place names and given names out by construction.
     dwyl/words_alpha (Unlicense) enumerates candidate strings.
     Norvig's count_1w (Google Web Trillion Word Corpus) and hermitdave's
       en_50k subtitle frequency list supply commonness.
     first20hours/google-10000-english (20k) ranks the crossword fill.
     LDNOOBW + a hand blocklist screen profanity and slurs; /usr/share/dict/
       propernames, a given-name list and the US Census top-2000 surnames
       screen proper nouns.
     Hand-authored lists live in _build/words_authored.py; the crossword pool
       in _build/xw_pool.json (built by _build/xw_words.py).

   BUILT BY  _build/gen_words.py — re-runnable, deterministic.  Do not hand-edit.

   SHAPE     Each list is stored as ONE space-separated string and split into an
             array by the loader at the bottom of this file (saves ~40%% of the
             bytes).  After load:
               AD_WORDS.answers5[]  common 5-letter answers (all also in valid5)
               AD_WORDS.valid5[]    every legal 5-letter guess
               AD_WORDS.answers4[]  common 4-letter answers (all also in valid4)
               AD_WORDS.valid4[]    every legal 4-letter guess
               AD_WORDS.boxed[]     Letter Boxed dictionary, 3–12 letters.  No
                                    word here has a doubled letter or more than
                                    12 distinct letters — neither can ever be
                                    played on a 12-letter board.
               AD_WORDS.cross[3..7][] crossword fill, strictly clueable
               AD_WORDS.common5[]   the %d commonest answers, for easy mode/hints
               AD_WORDS.persian[]   [{w,from}] — English words borrowed from
                                    Persian, with the source word.  Etymologies
                                    cross-checked against OED / Merriam-Webster /
                                    etymonline; anything merely "perhaps" Persian
                                    was dropped.
   COUNTS    valid5 %d · answers5 %d · valid4 %d · answers4 %d · boxed %d ·
             cross 3:%d 4:%d 5:%d 6:%d 7:%d · persian %d · common5 %d
*/
"""


def payload():
    d = []
    d.append(('answers5', ' '.join(ANSWERS5)))
    d.append(('valid5', ' '.join(sorted(VALID5))))
    d.append(('answers4', ' '.join(ANSWERS4)))
    d.append(('valid4', ' '.join(sorted(VALID4))))
    d.append(('boxed', ' '.join(sorted(BOXED, key=sortkey))))
    d.append(('common5', ' '.join(COMMON5)))
    return d


LOADER = u"""
/* split-at-load: the strings above become the arrays CONTRACT §6 specifies. */
(function (W) {
  var i, k, S = ["answers5", "valid5", "answers4", "valid4", "boxed", "common5"];
  for (i = 0; i < S.length; i++) { W[S[i]] = W[S[i]] ? W[S[i]].split(" ") : []; }
  for (k in W.cross) { if (W.cross.hasOwnProperty(k)) { W.cross[k] = W.cross[k].split(" "); } }
})(window.AD_WORDS);
"""


def write():
    parts = []
    for k, v in payload():
        parts.append('%s: %s' % (json.dumps(k), json.dumps(v)))
    cross_json = '{%s}' % ', '.join(
        '%s: %s' % (json.dumps(str(L)), json.dumps(' '.join(CROSS[L])))
        for L in sorted(CROSS))
    parts.append('%s: %s' % (json.dumps('cross'), cross_json))
    per = ',\n  '.join(json.dumps(p, sort_keys=True) for p in PERSIAN)
    parts.append('%s: [\n  %s\n]' % (json.dumps('persian'), per))

    head = HEADER % (len(COMMON5), len(VALID5), len(ANSWERS5), len(VALID4),
                     len(ANSWERS4), len(BOXED), len(CROSS[3]), len(CROSS[4]),
                     len(CROSS[5]), len(CROSS[6]), len(CROSS[7]), len(PERSIAN),
                     len(COMMON5))
    body = 'window.AD_WORDS = {\n' + ',\n'.join(parts) + '\n};\n'
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(head + body + LOADER)
    return head + body + LOADER


# ────────────────────────────────────────────────────────────────── self-check
def selfcheck(text, tails=False):
    ok = True
    m = re.search(r'window\.AD_WORDS = (\{.*?\n\});\n', text, re.S)
    if not m:
        print('FAIL: could not locate the JSON payload')
        return False
    try:
        data = json.loads(m.group(1))
    except ValueError as e:
        print('FAIL: payload is not strict JSON: %s' % e)
        return False

    lists = {k: (v.split(' ') if isinstance(v, str) else v) for k, v in data.items()
             if k not in ('cross', 'persian')}
    lists.update({'cross.%s' % k: v.split(' ') for k, v in data['cross'].items()})

    print('\n=== gen_words.py self-check ===')
    print('  file: %s  (%d bytes, budget 260 KB)' % (OUT, os.path.getsize(OUT)))
    for k in ('answers5', 'valid5', 'answers4', 'valid4', 'boxed', 'common5',
              'cross.3', 'cross.4', 'cross.5', 'cross.6', 'cross.7'):
        v = lists[k]
        print('  %-9s %6d words   %7d bytes' % (k, len(v), len(' '.join(v))))
    print('  %-9s %6d entries' % ('persian', len(data['persian'])))

    v5 = set(lists['valid5'])
    v4 = set(lists['valid4'])
    checks = []
    checks.append(('answers5 all in valid5',
                   sum(1 for w in lists['answers5'] if w not in v5) == 0,
                   '%d missing' % sum(1 for w in lists['answers5'] if w not in v5)))
    checks.append(('answers4 all in valid4',
                   sum(1 for w in lists['answers4'] if w not in v4) == 0,
                   '%d missing' % sum(1 for w in lists['answers4'] if w not in v4)))
    checks.append(('common5 all in answers5',
                   set(lists['common5']) <= set(lists['answers5']), ''))
    for k, v in sorted(lists.items()):
        bad = [w for w in v if not re.fullmatch(r'[a-z]+', w)]
        if bad:
            checks.append(('%s is pure a-z' % k, False, str(bad[:5])))
        if len(set(v)) != len(v):
            checks.append(('%s has no duplicates' % k, False,
                           '%d dupes' % (len(v) - len(set(v)))))
    checks.append(('every list pure a-z + duplicate-free',
                   all(c[1] for c in checks), ''))
    for L in (3, 4, 5, 6, 7):
        v = lists['cross.%d' % L]
        checks.append(('cross.%d all length %d' % (L, L),
                       all(len(w) == L for w in v), ''))
    checks.append(('answers5 length', all(len(w) == 5 for w in lists['answers5']), ''))
    checks.append(('valid5 length', all(len(w) == 5 for w in lists['valid5']), ''))
    checks.append(('answers4 length', all(len(w) == 4 for w in lists['answers4']), ''))
    checks.append(('valid4 length', all(len(w) == 4 for w in lists['valid4']), ''))
    checks.append(('boxed length 3-12',
                   all(3 <= len(w) <= 12 for w in lists['boxed']), ''))
    checks.append(('boxed: no doubled letters',
                   not any(has_double(w) for w in lists['boxed']), ''))
    checks.append(('boxed: <=12 distinct letters',
                   all(len(set(w)) <= 12 for w in lists['boxed']), ''))
    blocked = sorted(set(w for k, v in lists.items() for w in v if hard_blocked(w)))
    checks.append(('profanity screen (all lists)', not blocked,
                   '%d hits' % len(blocked)))
    # Second, independent screen: anything BUILT ON a slur stem, whatever its
    # inflection.  Prints for review; fails only on an exact-match slur.
    # anchored at the start: GRAPE, DRAPE, THERAPEUTIC, PEDAGOGY and SCOON are
    # not slurs, they just contain the letters.
    slur = re.compile(r'^(nigg|kike|spick|spics|chink|wetback|dago|gook|coon|'
                      r'paki|negro|retard|cripple|faggot|tranny|squaw|shemale|'
                      r'slut|whore|rape|molest|lesbo|homos?$|homosex|homoerot)')
    stemhits = sorted(set(w for v in lists.values() for w in v if slur.search(w)))
    checks.append(('slur-stem screen (all lists)', not stemhits, str(stemhits[:10])))
    soft = sorted(set(w for k in ('answers5', 'answers4', 'common5', 'cross.3',
                                  'cross.4', 'cross.5', 'cross.6', 'cross.7')
                      for w in lists[k] if w in SOFT))
    checks.append(('soft-block screen (answers/cross)', not soft, str(soft[:8])))
    und = [w for w in lists['answers5'] if attested(w) is None]
    checks.append(('answers5 dictionary-attested', not und, str(und[:8])))
    und4 = [w for w in lists['answers4'] if attested(w) is None]
    checks.append(('answers4 dictionary-attested', not und4, str(und4[:8])))
    undv = [w for w in lists['valid5'] if attested(w) is None and
            w not in EXTRA_VALID_SET]
    checks.append(('valid5 dictionary-attested', not undv, str(undv[:8])))
    p5 = [p['w'] for p in data['persian'] if len(p['w']) == 5]
    checks.append(('persian 5-letter words all legal guesses',
                   all(w.lower() in v5 for w in p5), '%d of them' % len(p5)))
    checks.append(('persian 30-60 entries', 30 <= len(data['persian']) <= 60, ''))
    checks.append(('answers5 1200-2000', 1200 <= len(lists['answers5']) <= 2000, ''))
    checks.append(('file under 260 KB', os.path.getsize(OUT) <= 260 * 1024,
                   '%.1f KB' % (os.path.getsize(OUT) / 1024.0)))

    print()
    for name, good, detail in checks:
        print('  [%s] %-42s %s' % ('OK' if good else 'FAIL', name, detail))
        ok = ok and good

    rnd = random.Random(SEED)
    print('\n  20 random answers5: %s' %
          ' '.join(sorted(rnd.sample(lists['answers5'], 20))))
    print('  20 random cross.5 : %s' %
          ' '.join(sorted(rnd.sample(lists['cross.5'], 20))))
    print('  20 random cross.7 : %s' %
          ' '.join(sorted(rnd.sample(lists['cross.7'], 20))))
    print('  20 random boxed   : %s' %
          ' '.join(sorted(rnd.sample(lists['boxed'], 20))))

    if REJ5 or REJ4:
        print('\n  hand-authored words rejected (5): %s' %
              ', '.join('%s(%s)' % r for r in REJ5[:40]))
        print('  hand-authored words rejected (4): %s' %
              ', '.join('%s(%s)' % r for r in REJ4[:40]))
    if tails:
        for k in ('answers5', 'answers4', 'cross.5', 'cross.6', 'cross.7', 'boxed'):
            v = lists[k]
            tail = sorted(v, key=sortkey)[-120:]
            print('\n  --- %s tail (least common 120) ---\n  %s' % (k, ' '.join(tail)))
    return ok


if __name__ == '__main__':
    txt = write()
    good = selfcheck(txt, '--tails' in sys.argv)
    print('\n  RESULT: %s' % ('all invariants pass' if good else 'INVARIANTS FAILED'))
    sys.exit(0 if good else 1)
