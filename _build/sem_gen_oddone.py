#!/usr/bin/env python3
# =============================================================================
# SEMANTIC WING · ODD ONE OUT generator.
#
# THE IDEA. A thread needs a NAME, and naming clusters is the thing a machine is
# worst at. So don't name them — harvest the name. In the Small World of Words
# norms, thousands of people answered each cue word with free associations. Turn
# that round: for a response word H, the set of cues that produced H is a
# human-made category, and H is already its label.
#     H = "music"  <- piano, guitar, drum, song, dance, ...
# Four members of that set that are also mutually close in Numberbatch space are
# a tight, nameable thread. The decoy is the word that sits closest to those four
# WITHOUT any human ever having answered H for it.
#
# UNIQUENESS (the Connections lesson). A puzzle is only fair if exactly one
# foursome works. Enforced: no hub other than H may cover 4 of the 5 words.
#
# DIFFICULTY = margin = min pairwise cosine inside the four
#                       - max cosine between the decoy and the four.
# Small margin = the decoy is nearly as close to the four as they are to each
# other = hard. Rounds are dealt into days as an easy -> hard ladder.
#
# Output: sem/oddone.tsv  one round per line, tab separated:
#           m0 m1 m2 m3 decoy hub wrong0 wrong1 wrong2 margin
#         (word ids into sem/ship_vocab.txt)
#         sem/oddone_report.txt
# Nothing lexical is printed.
# =============================================================================
import os, sys, math
from array import array
from collections import defaultdict
from operator import mul

HERE = os.path.dirname(os.path.abspath(__file__))
SEM = os.path.join(HERE, "sem")
DIMS = 300

MIN_CUE_COUNT = 3        # a member must have been answered H by >=3 people
MIN_MEMBERS = 7
MAX_MEMBERS = 36
DECOY_SCAN = 6500        # decoys come from the commonest words
MIN_MARGIN = 0.010
MAX_MARGIN = 0.240
DECOY_FLOOR = 0.13       # a decoy must still be plausibly related
TARGET = 3200

# Light seasoning (CONTRACT §7): hubs that nod at their four cities, football,
# Persian/Jewish food and weather without needing any inside knowledge. Only
# used to bias the ORDER of hubs, never to force a puzzle.
SEASON = ("football goal pitch team league match tea rain snow castle hill bridge "
          "subway taxi train market spice rice bread garden museum university library "
          "poetry music dance river coast heat cold summer winter kitchen dinner "
          "sugar lemon honey almond walnut cheese soup lamb chicken safety risk "
          "policy law power energy oil").split()


def samestem(a, b):
    if a == b:
        return True
    lo, hi = (a, b) if len(a) <= len(b) else (b, a)
    if hi.startswith(lo) and len(hi) - len(lo) <= 3:
        return True
    k = 5
    if len(a) >= k and len(b) >= k and a[:k] == b[:k]:
        return True
    return False


def main():
    vocab = open(os.path.join(SEM, "ship_vocab.txt"), encoding="utf-8").read().split()
    freq = [int(x) for x in open(os.path.join(SEM, "ship_freq.txt"), encoding="utf-8").read().split()]
    v = array("f")
    with open(os.path.join(SEM, "ship_vecs.f32"), "rb") as f:
        v.frombytes(f.read())
    n = len(vocab)

    cue_of = defaultdict(dict)     # hub -> {cue: count}
    hubs_of = defaultdict(dict)    # cue -> {hub: count}
    with open(os.path.join(SEM, "assoc.tsv"), encoding="utf-8") as f:
        for line in f:
            a, b, c = line.split()
            a, b, c = int(a), int(b), int(c)
            cue_of[b][a] = c
            hubs_of[a][b] = c

    def vec(i):
        return v[i * DIMS:(i + 1) * DIMS]

    def cos(i, j):
        return sum(map(mul, vec(i), vec(j)))

    hubs = [h for h, cs in cue_of.items()
            if sum(1 for c, k in cs.items() if k >= MIN_CUE_COUNT) >= MIN_MEMBERS]
    # bias order: seasoned hubs first, then by how many strong members they have
    seas = set()
    for w in SEASON:
        try:
            seas.add(vocab.index(w))
        except ValueError:
            pass
    hubs.sort(key=lambda h: (0 if h in seas else 1,
                             -sum(1 for c, k in cue_of[h].items() if k >= MIN_CUE_COUNT)))

    rounds = []
    seen_sets = set()
    scanned_hubs = 0

    for h in hubs:
        if len(rounds) >= TARGET:
            break
        scanned_hubs += 1
        mem = sorted((c for c, k in cue_of[h].items() if k >= MIN_CUE_COUNT),
                     key=lambda c: -cue_of[h][c])[:MAX_MEMBERS]
        mem = [c for c in mem if not samestem(vocab[c], vocab[h])]
        if len(mem) < MIN_MEMBERS:
            continue

        # pairwise cosines inside the member set
        pc = {}
        for a in range(len(mem)):
            for b in range(a + 1, len(mem)):
                pc[(a, b)] = cos(mem[a], mem[b])

        def pw(a, b):
            return pc[(a, b)] if a < b else pc[(b, a)]

        # candidate quadruples: each member plus its three closest co-members
        quads = set()
        for a in range(len(mem)):
            near = sorted((b for b in range(len(mem)) if b != a),
                          key=lambda b: -pw(a, b))[:5]
            for x in range(len(near)):
                for y in range(x + 1, len(near)):
                    for z in range(y + 1, len(near)):
                        quads.add(tuple(sorted((a, near[x], near[y], near[z]))))

        used_here = 0
        for q in sorted(quads):
            if len(rounds) >= TARGET or used_here >= 4:
                break
            ids = [mem[i] for i in q]
            words = [vocab[i] for i in ids]
            bad = False
            for a in range(4):
                for b in range(a + 1, 4):
                    if samestem(words[a], words[b]):
                        bad = True
            if bad:
                continue
            key = tuple(sorted(ids))
            if key in seen_sets:
                continue
            minpair = min(pw(q[a], q[b]) for a in range(4) for b in range(a + 1, 4))
            if minpair < 0.16:
                continue

            cent = array("f", bytes(4 * DIMS))
            for i in ids:
                vi = vec(i)
                for d in range(DIMS):
                    cent[d] += vi[d]
            nn = math.sqrt(sum(map(mul, cent, cent))) or 1.0
            for d in range(DIMS):
                cent[d] /= nn

            banned = set(cue_of[h].keys()) | {h} | set(ids)
            # also ban anything a member itself strongly evokes as a hub-mate
            best = None
            for cand in range(min(DECOY_SCAN, n)):
                if cand in banned:
                    continue
                cw = vocab[cand]
                if any(samestem(cw, w) for w in words) or samestem(cw, vocab[h]):
                    continue
                if h in hubs_of.get(cand, {}):
                    continue
                if not hubs_of.get(cand):
                    continue
                cc = sum(map(mul, cent, vec(cand)))
                if cc < DECOY_FLOOR:
                    continue
                mx = max(cos(cand, i) for i in ids)
                margin = minpair - mx
                if margin < MIN_MARGIN or margin > MAX_MARGIN:
                    continue
                if best is None or margin < best[0]:
                    best = (margin, cand)
            if best is None:
                continue
            margin, dec = best
            five = ids + [dec]

            # ---- uniqueness: no other hub may cover 4 of the 5 -------------
            cover = defaultdict(int)
            for w5 in five:
                for hh in hubs_of.get(w5, {}):
                    cover[hh] += 1
            alt = [hh for hh, c in cover.items() if c >= 4 and hh != h]
            if alt:
                continue

            # ---- three plausible wrong threads -----------------------------
            wrong = []
            for hh, c in sorted(cover.items(), key=lambda kv: -kv[1]):
                if len(wrong) >= 3:
                    break
                if hh == h or c < 1 or c > 3:
                    continue
                if hh in five or samestem(vocab[hh], vocab[h]):
                    continue
                if not cue_of.get(hh) or len(cue_of[hh]) < 5:
                    continue
                if cos(hh, h) > 0.58:
                    continue
                if any(samestem(vocab[hh], vocab[x]) for x in five):
                    continue
                wrong.append(hh)
            if len(wrong) < 3:
                continue

            seen_sets.add(key)
            used_here += 1
            rounds.append((ids, dec, h, wrong, margin))

        if scanned_hubs % 200 == 0:
            sys.stdout.write("  hubs %d/%d, rounds %d\n" % (scanned_hubs, len(hubs), len(rounds)))
            sys.stdout.flush()

    # ---- deal into days: four rounds, easy -> hard ------------------------
    rounds.sort(key=lambda r: -r[4])          # big margin = easy first
    with open(os.path.join(SEM, "oddone.tsv"), "w", encoding="utf-8") as f:
        for ids, dec, h, wrong, margin in rounds:
            f.write("%d\t%d\t%d\t%d\t%d\t%d\t%d\t%d\t%d\t%.4f\n"
                    % (ids[0], ids[1], ids[2], ids[3], dec, h,
                       wrong[0], wrong[1], wrong[2], margin))

    ms = [r[4] for r in rounds]
    rep = ["hubs considered            : %d" % len(hubs),
           "hubs scanned               : %d" % scanned_hubs,
           "rounds generated           : %d" % len(rounds),
           "days available (4/round)   : %d" % (len(rounds) // 4),
           "margin min/median/max      : %.3f / %.3f / %.3f"
           % (min(ms), sorted(ms)[len(ms) // 2], max(ms)) if ms else "no rounds",
           "distinct hubs used         : %d" % len(set(r[2] for r in rounds))]
    txt = "\n".join(rep) + "\n"
    with open(os.path.join(SEM, "oddone_report.txt"), "w") as f:
        f.write(txt)
    sys.stdout.write(txt)


if __name__ == "__main__":
    main()
