#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""xwx_batches.py -- curated word batches handed to the clue writers."""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import xwx_lib as X          # noqa: E402
import xw_clues              # noqa: E402

HAVE = set(xw_clues.CLUES)

JUNK = set("""
devel const needn doesn wouldn couldn shouldn didn isn aren hasn haven weren
wasn mustn shan oughtn thats theyre youre whats hasnt didnt isnt dont cant
wont arent werent doesnt couldnt wouldnt shouldnt gonna wanna gotta kinda
dildo prick busty ebony horny porn pussy penis dick cock boobs booty naked
nude sexy erotic bdsm fetish milf anal orgy nigger negro whore slut bitch
damn hell crap piss fart butt anus rectum vagina condom viagra casino poker
betting gambling lotto weed cannabis cocaine heroin meth
lol omg btw asap faq url html http www jpg gif png pdf doc xls ppt exe dll
cgi php asp aspx xml rss ftp smtp pop imap dns tcp udp ssl tls vpn lan wan
usb ram rom cpu gpu ssd hdd gb mb kb tb ghz mhz khz dpi ppi
blog blogs blogger vlog vlogs podcast admin login logout signup signin
username password userid userpic avatar emoticon smiley
inc llc ltd corp corps org orgs gov govt edu mil biz info net com
etc viz ibid op cit et al ie eg
morons moron sucks sux noob newbie lame lamer
""".split())

BAD_SUB = ("fuck", "shit", "cunt", "nigg", "rape", "whore", "slut", "spic",
           "kike", "retard", "faggot", "chink", "porn", "sex", "boob", "tits")


def dullness(w):
    d = 0
    if w.endswith("s") and not w.endswith("ss") and not w.endswith("us"):
        d += 1
    if w.endswith("ed"):
        d += 1
    if w.endswith("ing"):
        d += 1
    if w.endswith("ly"):
        d += 1
    if w.endswith("er") or w.endswith("est"):
        d += 1
    if w.endswith("ies") or w.endswith("ers") or w.endswith("ings"):
        d += 2
    return d


def candidates(L, cap_rank=30000):
    freq = candidates.freq
    web2 = candidates.web2
    rows = []
    for w, r in freq.items():
        if len(w) != L or not w.isalpha() or not w.islower():
            continue
        if r > cap_rank or w not in web2:
            continue
        if w.upper() in HAVE or w in JUNK:
            continue
        if w in X.HARD_BAN or w in X.CROSSWORDESE:
            continue
        if any(b in w for b in BAD_SUB):
            continue
        rows.append((r + 3500 * dullness(w), w))
    rows.sort()
    return [w.upper() for _, w in rows]


def main():
    candidates.freq = X.load_freq()
    candidates.web2 = X.load_web2()
    d = os.path.join(HERE, "xwx_need")
    if not os.path.isdir(d):
        os.makedirs(d)
    plan = {5: 1000, 6: 950, 7: 900, 4: 420, 3: 200}
    for L, want in plan.items():
        ws = candidates(L)[:want]
        per = (len(ws) + 1) // 2 if L in (5, 6, 7) else len(ws)
        n = 0
        for i in range(0, len(ws), per):
            with open(os.path.join(d, "batch_%d_%d.txt" % (L, n)), "w") as f:
                f.write("\n".join(ws[i:i + per]) + "\n")
            print("batch_%d_%d.txt" % (L, n), len(ws[i:i + per]))
            n += 1


if __name__ == "__main__":
    main()
