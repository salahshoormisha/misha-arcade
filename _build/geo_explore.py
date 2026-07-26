#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Scratch exploration of core/data/countries.js for the GeoGrid build.
Not part of the shipped pipeline; gen_geogrid.py is."""
import json, os, re, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_countries():
    src = open(os.path.join(ROOT, 'core', 'data', 'countries.js'), encoding='utf-8').read()
    i = src.index('window.AD_COUNTRIES = ')
    j = src.index('\n];', i)
    payload = src[i + len('window.AD_COUNTRIES = '): j + 2]
    return json.loads(payload)

C = load_countries()
print('total', len(C))
un = [c for c in C if c.get('un') == 1]
print('un members', len(un))
print('has pop', sum(1 for c in un if 'pop' in c))
print('has gdppc', sum(1 for c in un if 'gdppc' in c))
print('has area', sum(1 for c in un if 'area' in c))
print('has capll', sum(1 for c in un if 'capll' in c))
print('has cap', sum(1 for c in un if 'cap' in c))
print()
print('regions', collections.Counter(c['reg'] for c in un))
print()
subs = collections.Counter(c['sub'] for c in un)
for k, v in sorted(subs.items(), key=lambda x: -x[1]):
    print('  sub %-30s %d' % (k, v))
print()
print('landlocked', sum(1 for c in un if c['locked'] == 1))
print('island', sum(1 for c in un if c['island'] == 1))
print('hemi S', sum(1 for c in un if c['hemi'] == 'S'))
print()
langs = collections.Counter()
for c in un:
    for l in c.get('lang', []):
        langs[l] += 1
print('top langs:', langs.most_common(30))
print()
curs = collections.Counter()
for c in un:
    for l in c.get('cur', []):
        curs[l] += 1
print('top curs:', curs.most_common(20))
print()
bc = collections.Counter(len(c.get('bord', [])) for c in un)
print('border counts:', sorted(bc.items()))
print()
# missing gdppc among UN
print('UN missing gdppc:', [c['i'] for c in un if 'gdppc' not in c])
print('UN missing pop:', [c['i'] for c in un if 'pop' not in c])
print('UN missing area:', [c['i'] for c in un if 'area' not in c])
print('UN missing capll:', [c['i'] for c in un if 'capll' not in c])
print()
print('non-UN codes:', sorted(c['i'] for c in C if c.get('un') != 1))
