#!/usr/bin/env python3
"""Exploratory: how many common 3/4/5-letter words survive filtering?"""
import re, os, collections

B = os.path.dirname(os.path.abspath(__file__))

def load_web2():
    lower = set()
    allw = set()
    with open('/usr/share/dict/words') as f:
        for line in f:
            w = line.strip()
            if not w:
                continue
            allw.add(w)
            if w.islower() and w.isalpha():
                lower.add(w)
    return lower, allw

WEB2, WEB2ALL = load_web2()
print('web2 lowercase alpha entries:', len(WEB2))
for t in ['cats', 'dogs', 'runs', 'baked', 'baking', 'taxes', 'oreo', 'radar', 'email', 'pizza', 'video', 'photo', 'ideas', 'items']:
    print('  ', t, t in WEB2)

VOWELS = set('aeiou')

def morph_ok(w):
    """Is w a regular inflection of a web2 word?"""
    if w in WEB2:
        return 'base'
    # plural / 3rd person -s
    if w.endswith('s'):
        s = w[:-1]
        if s in WEB2:
            return '-s'
        if w.endswith('es') and w[:-2] in WEB2:
            return '-es'
        if w.endswith('ies') and w[:-3] + 'y' in WEB2:
            return '-ies'
    if w.endswith('ed'):
        if w[:-2] in WEB2:
            return '-ed'
        if w[:-1] in WEB2:
            return '-d'
        if len(w) > 4 and w[-3] == w[-4] and w[:-3] in WEB2:
            return '-ded'
        if w.endswith('ied') and w[:-3] + 'y' in WEB2:
            return '-ied'
    if w.endswith('ing'):
        if w[:-3] in WEB2:
            return '-ing'
        if w[:-3] + 'e' in WEB2:
            return '-eing'
        if len(w) > 5 and w[-4] == w[-5] and w[:-4] in WEB2:
            return '-ding'
    if w.endswith('er') or w.endswith('est'):
        st = w[:-2] if w.endswith('er') else w[:-3]
        if st in WEB2 or st + 'e' in WEB2:
            return '-er/est'
    if w.endswith('ly') and w[:-2] in WEB2:
        return '-ly'
    return None

ranks = {}
with open(os.path.join(B, '20k.txt')) as f:
    for i, line in enumerate(f):
        w = line.strip().lower()
        if w and w not in ranks:
            ranks[w] = i

byl = collections.defaultdict(list)
notin = collections.defaultdict(list)
for w, r in sorted(ranks.items(), key=lambda kv: kv[1]):
    if len(w) < 3 or len(w) > 5 or not w.isalpha():
        continue
    m = morph_ok(w)
    if m:
        byl[len(w)].append((w, r, m))
    else:
        notin[len(w)].append((w, r))

for L in (3, 4, 5):
    print('len', L, 'kept', len(byl[L]), 'rejected', len(notin[L]))
    print('   rejected sample:', [w for w, r in notin[L][:40]])

# how many at various rank cutoffs
for cut in (3000, 5000, 8000, 12000, 20000):
    print('cutoff', cut, {L: sum(1 for w, r, m in byl[L] if r < cut) for L in (3, 4, 5)})

# dump for inspection
with open(os.path.join(B, 'xw_pool_raw.txt'), 'w') as f:
    for L in (3, 4, 5):
        for w, r, m in byl[L]:
            f.write('%d\t%s\t%d\t%s\n' % (L, w, r, m))
print('wrote xw_pool_raw.txt')
