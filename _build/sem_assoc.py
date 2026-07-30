#!/usr/bin/env python3
# =============================================================================
# SEMANTIC WING · STEP 4 — the human association graph.
#
# Small World of Words (SWOW-EN, De Deyne, Navarro, Perfors, Brysbaert & Storms
# 2019, Behavior Research Methods). ~12k cue words, ~100 people per cue, three
# free associations each. This is what people ACTUALLY say when they hear a word,
# which is a better test of "do these two words meaningfully connect?" than
# distributional cosine — cosine thinks HOT and COLD are nearly the same word.
#
# Input : sem/swow.csv.zip  (output/responseR12ChainingSWOW-EN.csv)
#           columns: "", cue, R1, R2, fR2R1, fR2nR1, fnR2R1, fnR2nR1, BF
#           For a given (cue, R1): times R1 was given  = fR2R1 + fnR2R1
#                                  participants for cue = all four counts
# Output: sem/assoc.tsv     cueId <TAB> respId <TAB> count   (both in ship_vocab)
#         sem/assoc_report.txt
#
# Nothing lexical is printed. Counts only.
# =============================================================================
import os, sys, zipfile
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
SEM = os.path.join(HERE, "sem")
MINCOUNT = 2          # drop one-off responses: pure noise at ~100 participants


def main():
    vocab = open(os.path.join(SEM, "ship_vocab.txt"), encoding="utf-8").read().split()
    idx = {w: i for i, w in enumerate(vocab)}

    pair = {}                       # (cue, r1) -> count
    total = defaultdict(int)        # cue -> participants
    rows = 0
    cues_seen = set()

    z = zipfile.ZipFile(os.path.join(SEM, "swow.csv.zip"))
    name = [x for x in z.namelist() if x.endswith(".csv")][0]
    with z.open(name) as f:
        f.readline()
        for raw in f:
            rows += 1
            s = raw.decode("utf-8", "replace").rstrip("\n").rstrip("\r")
            # fields are quoted; split on '","' after stripping the outer quotes
            if not s.startswith('"'):
                continue
            parts = s[1:].split('","')
            if len(parts) < 8:
                continue
            cue = parts[1].strip().lower()
            r1 = parts[2].strip().lower()
            try:
                a = int(parts[4]); b = int(parts[5]); c = int(parts[6])
                d = int(parts[7].split('"')[0])
            except ValueError:
                continue
            cues_seen.add(cue)
            t = a + b + c + d
            if t > total[cue]:
                total[cue] = t
            cnt = a + c
            k = (cue, r1)
            if cnt > pair.get(k, 0):
                pair[k] = cnt

    kept = []
    for (cue, r1), cnt in pair.items():
        if cnt < MINCOUNT or cue == r1:
            continue
        i = idx.get(cue)
        j = idx.get(r1)
        if i is None or j is None:
            continue
        kept.append((i, j, cnt))
    kept.sort()

    with open(os.path.join(SEM, "assoc.tsv"), "w", encoding="utf-8") as f:
        for i, j, c in kept:
            f.write("%d\t%d\t%d\n" % (i, j, c))

    deg = defaultdict(int)
    for i, j, c in kept:
        deg[i] += 1
    rep = ["csv rows read                 : %d" % rows,
           "distinct cues in file         : %d" % len(cues_seen),
           "raw (cue,R1) pairs            : %d" % len(pair),
           "edges kept (count>=%d, both in vocab) : %d" % (MINCOUNT, len(kept)),
           "cues with >=1 kept edge       : %d" % len(deg),
           "median out-degree             : %d" % (sorted(deg.values())[len(deg) // 2] if deg else 0)]
    txt = "\n".join(rep) + "\n"
    with open(os.path.join(SEM, "assoc_report.txt"), "w") as f:
        f.write(txt)
    sys.stdout.write(txt)


if __name__ == "__main__":
    main()
