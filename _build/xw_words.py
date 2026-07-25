#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
xw_words.py -- build the crossword-fill wordlist for the 5x5 minis.

Sources (both fetched by hand into _build/, see xw_README below):
  * /usr/share/dict/words          -> web2 (Webster's 2nd, public domain) + connectives
  * _build/20k.txt                 -> first20hours/google-10000-english 20k frequency list
                                      (public domain, ranked by frequency in Google's
                                      trillion-word corpus)

A word enters the pool iff:
  1. length 3-5, pure a-z, appears in the frequency list (so it is a COMMON word), AND
  2. it is dictionary-validated: present in web2/connectives, or a regular inflection of a
     web2 headword (-s/-es/-ies/-ed/-ing/-er/-est/-ly), OR present in ALLOW below --
     an explicit curated allowlist of everyday words web2 (1934) simply lacks, AND
  3. it is not in BLOCK below (abbreviations, brands, proper nouns, crudities, and words
     nobody wants to see in a Monday mini).

Output: _build/xw_pool.json  ->  {"3": {"ace": 1234, ...}, "4": {...}, "5": {...}}
        rank = index in the frequency list (lower = more common).
"""
import json
import os
import sys

B = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- dictionaries
def load_web2():
    words = set()
    for path in ('/usr/share/dict/words', '/usr/share/dict/connectives'):
        try:
            with open(path) as f:
                for line in f:
                    w = line.strip()
                    if w and w.isalpha() and w.islower():
                        words.add(w)
        except IOError:
            pass
    return words


WEB2 = load_web2()


def dict_reason(w):
    """Return a short tag for how w is dictionary-validated, or None."""
    if w in WEB2:
        return 'web2'
    if w.endswith('s'):
        if w[:-1] in WEB2:
            return 'web2+s'
        if w.endswith('es') and w[:-2] in WEB2:
            return 'web2+es'
        if w.endswith('ies') and w[:-3] + 'y' in WEB2:
            return 'web2+ies'
    if w.endswith('ed'):
        if w[:-2] in WEB2 or w[:-1] in WEB2:
            return 'web2+ed'
        if len(w) > 4 and w[-3] == w[-4] and w[:-3] in WEB2:
            return 'web2+ed'
        if w.endswith('ied') and w[:-3] + 'y' in WEB2:
            return 'web2+ied'
    if w.endswith('ing'):
        if w[:-3] in WEB2 or w[:-3] + 'e' in WEB2:
            return 'web2+ing'
        if len(w) > 5 and w[-4] == w[-5] and w[:-4] in WEB2:
            return 'web2+ing'
    if w.endswith('er') and (w[:-2] in WEB2 or w[:-1] in WEB2):
        return 'web2+er'
    if w.endswith('est') and (w[:-3] in WEB2 or w[:-2] in WEB2):
        return 'web2+est'
    if w.endswith('ly') and w[:-2] in WEB2:
        return 'web2+ly'
    return None


# --------------------------------------------------- curated allowlist (web2 gaps)
# Everyday modern English that the 1934 Webster's 2nd does not contain as a headword.
# Each of these is a word any newspaper solver knows; hand-checked one by one.
ALLOW = """
box kid mom
near held paid feet kids info mini euro demo okay cafe hang byte apps expo oops blog
logo spam mama amps taco judo tofu jeep moms yoga chef
email women heard began boxes bytes proud metro intro combo promo condo retro disco
pasta inbox boxed blond decor rehab scuba pixel ninja euros salsa sushi karma vodka
mango bagel donut robot laser video radio jumbo tempo turbo cargo comic manga
""".split()

# ------------------------------------------------------------------- blocklist
# Frequency-list entries that pass the dictionary test but must never appear in a grid:
# abbreviation-shaped, crude, morbid, or too obscure/ugly to clue in a Monday mini.
BLOCK = """
ass anal anus cock dick cunt shit piss fuck damn hell slut porn rape whore semen sperm
bra sexy nude naked penis vagina boob boobs teen teens tits horny bdsm milf gay fag
kill kills killed killing dead death dying die dies died murder blood corpse tumor
cancer suicide drunk drug drugs coke crack heroin gun guns rifle bomb bombs war wars
nazi jew jews rape sick vomit pus feces urine
qty pcs pct dept assoc misc incl intl univ approx
inc ltd llc etc via vol viii vii iii num prev conf proc biol phys chem stat stats
eur usd gbp aud gst vat vhs dvd cds rom ram cpu gpu usb dsl isp url www com org net
htm php sql xml css div src img len obj var val exp seq dir str tmp lib def
ing ion ions ers ees ness tion tions ment ally
thru alot foto fotos filme diffs devel utils msgid sbjct
oclc pmid isbn issn asin urls
zum und une una von der die das ist eau ile casa vitro
loc rec adv nav fwd blk mfg mst cst edt pdt gmt utc
lol btw omg diy faq
""".split()

# Never fill with these letter strings even though they are technically words:
# very high crosswordese / hard-to-clue / archaic.
BLOCK += """
ere yon nigh oft anon thy thee thou hath doth shalt unto whilst
aer aal aam abb ait alb alp ana ani ars ays bal
""".split()

# Place names, brands, transliterations and apostrophe-less contractions that slipped the
# dictionary test (many are technically common nouns in Webster's 2nd -- a "tonga" is a
# carriage -- but they read as proper nouns in a grid).
BLOCK += """
leeds kodak niger tonga timor turks welsh irish bali fuji mali yale troy napa bosch
sears singh ascii chang tulsa reno maui oman laos togo cuba peru rica rome asia
mesa dover monte aspen twain jenna hayes blake burke lance colin allan brent brett
drake homer stein pedro marco chevy buffy riley molly jenny sally betty holly donna
tommy perry blair randy maya tara vera coca acer wang bach khan lynch usher abbey
thats whats didnt dont cant wont isnt arent theyre youre couldnt wasnt
cest bool coli duff keno soma gras scat wong bios cams sept spec docs prof pros
demos autos memo intl univ mgmt admin ment tion nano macro micro mono poly proto
reged msie zope suse ipaq treo muze vaio sega nero pogo digg trac
""".split()

BLOCKSET = set(BLOCK)

# Personal first names: /usr/share/dict/propernames.  Applied to 4- and 5-letter fill
# only (3-letter fill is governed by the explicit GOOD3 allowlist in xw_fill.py).
# EXEMPT are entries that are also perfectly ordinary common words.
EXEMPT = set("""
rose hope grace mark bill will page dawn faith jack frank sandy wade amber ruby herb
chuck curt penny sunny mercy joy art guy don pat may june dean rich
""".split())


def proper_names():
    out = set()
    try:
        with open('/usr/share/dict/propernames') as f:
            for line in f:
                w = line.strip().lower()
                if w and w.isalpha():
                    out.add(w)
    except IOError:
        pass
    return out - EXEMPT


def build():
    ranks = {}
    with open(os.path.join(B, '20k.txt')) as f:
        for i, line in enumerate(f):
            w = line.strip().lower()
            if w and w not in ranks:
                ranks[w] = i
    nfreq = len(ranks)

    allow = set(ALLOW)
    pnames = proper_names()
    pool = {3: {}, 4: {}, 5: {}}
    stats = {'web2': 0, 'allow': 0, 'blocked': 0, 'nodict': 0, 'pname': 0}
    for w, r in ranks.items():
        if not (3 <= len(w) <= 5) or not w.isalpha():
            continue
        if w in BLOCKSET:
            stats['blocked'] += 1
            continue
        if len(w) >= 4 and w in pnames:
            stats['pname'] += 1
            continue
        why = dict_reason(w)
        if why:
            stats['web2'] += 1
        elif w in allow:
            why = 'allow'
            stats['allow'] += 1
        else:
            stats['nodict'] += 1
            continue
        pool[len(w)][w] = r

    # allowlist words that are not in the frequency list at all still deserve a slot,
    # ranked as "moderately common" (rank 9000) so the scorer treats them fairly.
    for w in allow:
        if 3 <= len(w) <= 5 and w not in pool[len(w)] and w not in BLOCKSET:
            pool[len(w)][w] = 9000

    out = {str(k): dict(sorted(v.items())) for k, v in pool.items()}
    path = os.path.join(B, 'xw_pool.json')
    with open(path, 'w') as f:
        json.dump(out, f, indent=0, sort_keys=True)

    print('xw_words.py self-check')
    print('  web2+connectives lowercase headwords : %d' % len(WEB2))
    print('  frequency-list entries               : %d' % nfreq)
    print('  dictionary-validated (web2/morph)    : %d' % stats['web2'])
    print('  curated allowlist hits               : %d' % stats['allow'])
    print('  blocked (blocklist)                  : %d' % stats['blocked'])
    print('  blocked (first names, len>=4)        : %d' % stats['pname'])
    print('  rejected (no dictionary support)     : %d' % stats['nodict'])
    for L in (3, 4, 5):
        rs = sorted(pool[L].values())
        print('  len %d pool: %4d   (rank<3000: %3d  <6000: %3d  <9000: %3d)'
              % (L, len(rs), sum(1 for r in rs if r < 3000),
                 sum(1 for r in rs if r < 6000), sum(1 for r in rs if r < 9000)))
    print('  wrote %s (%d bytes)' % (path, os.path.getsize(path)))
    return pool


def load():
    with open(os.path.join(B, 'xw_pool.json')) as f:
        d = json.load(f)
    return {int(k): v for k, v in d.items()}


if __name__ == '__main__':
    build()
