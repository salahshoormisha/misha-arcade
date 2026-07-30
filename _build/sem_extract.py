#!/usr/bin/env python3
# =============================================================================
# SEMANTIC WING · STEP 1 — build a CLEAN vocabulary and pull its vectors.
#
# Sources (all downloaded to _build/sem/ by hand; see sem_fetch.sh):
#   sem/numberbatch-en.txt.gz   ConceptNet Numberbatch 19.08, English only.
#                               CC-BY-SA 4.0. 516,782 terms x 300 dims.
#   sem/swow.csv.zip            Small World of Words EN (responseR12Chaining),
#                               human free-association norms. De Deyne et al.
#   sem/ldnoobw_en.txt          LDNOOBW obscenity list (blocklist input).
#   sem/propernames.txt         SWOWEN-2018 EnglishProperNames (blocklist input).
#   ../google-10000-english-no-swears.txt   clean frequency-ordered base list.
#   ../google10k.txt            the SAME list WITH swears -> the set difference
#                               is a free, mechanically-derived swear list.
#   ../en_50k.txt               OpenSubtitles frequency (rank source).
#
# NOTHING from these files is ever printed. Counts only. The whole point of this
# script is that raw lexical data goes file -> file and never through a console.
#
# Output (all under _build/sem/):
#   vocab.txt     one clean word per line, ordered by frequency rank
#   vecs.f32      float32 little-endian, len(vocab) x 300, same order
#   freq.txt      integer frequency rank per vocab word (same order)
#   tiers.txt     "A"/"B" per vocab word: A = in the clean google-10k base
#   report.txt    counts (also echoed to stdout)
#
# Re-runnable and deterministic: no randomness, no network.
# =============================================================================
import gzip, os, re, struct, sys, zipfile
from array import array

HERE = os.path.dirname(os.path.abspath(__file__))
SEM = os.path.join(HERE, "sem")
DIMS = 300
MAXLEN = 13
MINLEN = 3
TARGET = 15000          # hard cap on shipped vocabulary size

WORD_RE = re.compile(r"^[a-z]+$")


def read_lines(path):
    out = []
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if line:
                out.append(line)
    return out


# ---------------------------------------------------------------- blocklist ---
def build_blocklist():
    """Mechanically derived. Never printed, never inlined in source."""
    block = set()

    dirty = set(w.split()[0].lower() for w in read_lines(os.path.join(HERE, "google10k.txt")))
    clean = set(w.split()[0].lower() for w in
                read_lines(os.path.join(HERE, "google-10000-english-no-swears.txt")))
    derived = dirty - clean          # the swears they removed
    block |= derived

    p = os.path.join(SEM, "ldnoobw_en.txt")
    if os.path.exists(p):
        for line in read_lines(p):
            for tok in line.lower().replace("-", " ").split():
                if WORD_RE.match(tok):
                    block.add(tok)

    # inflections of anything blocked
    extra = set()
    for w in block:
        for suf in ("s", "es", "ed", "ing", "er", "ers", "y", "ies"):
            extra.add(w + suf)
    block |= extra
    return block, derived, clean


def build_propernames():
    p = os.path.join(SEM, "propernames.txt")
    if not os.path.exists(p):
        return set()
    out = set()
    for line in read_lines(p):
        low = line.strip().lower()
        if WORD_RE.match(low):
            out.add(low)
    return out


def swow_cues():
    """Distinct cue words from the SWOW-EN chaining table. File -> memory only."""
    p = os.path.join(SEM, "swow.csv.zip")
    if not os.path.exists(p):
        return set()
    cues = set()
    z = zipfile.ZipFile(p)
    name = [n for n in z.namelist() if n.endswith(".csv")][0]
    with z.open(name) as f:
        f.readline()
        for raw in f:
            # "n","cue","R1","R2",...
            parts = raw.decode("utf-8", "replace").split('","')
            if len(parts) < 3:
                continue
            cue = parts[1].strip().lower()
            if WORD_RE.match(cue):
                cues.add(cue)
    return cues


def main():
    block, derived, clean_base = build_blocklist()
    proper = build_propernames()
    cues = swow_cues()

    # frequency ranks from OpenSubtitles 50k (lower = more common)
    rank = {}
    for i, line in enumerate(read_lines(os.path.join(HERE, "en_50k.txt"))):
        w = line.split()[0].lower()
        if w not in rank:
            rank[w] = i

    # system dictionary, as a "is this a real English word" gate for tier B
    sysdict = set()
    for p in ("/usr/share/dict/words",):
        if os.path.exists(p):
            for line in read_lines(p):
                low = line.strip().lower()
                if WORD_RE.match(low):
                    sysdict.add(low)

    def ok(w):
        if not WORD_RE.match(w):
            return False
        if not (MINLEN <= len(w) <= MAXLEN):
            return False
        if w in block or w in proper:
            return False
        return True

    # tier A: the clean google 10k, in its own frequency order
    tierA, seen = [], set()
    for line in read_lines(os.path.join(HERE, "google-10000-english-no-swears.txt")):
        w = line.split()[0].lower()
        if ok(w) and w not in seen:
            seen.add(w)
            tierA.append(w)

    # tier B: SWOW cues (human-curated, concrete, association-rich) that are
    # real dictionary words and reasonably common.
    tierB = []
    for w in sorted(cues):
        if w in seen or not ok(w):
            continue
        if w not in sysdict and rank.get(w, 10 ** 9) > 30000:
            continue
        seen.add(w)
        tierB.append(w)

    # tier C: fill toward TARGET from OpenSubtitles frequency order.
    tierC = []
    for line in read_lines(os.path.join(HERE, "en_50k.txt")):
        if len(tierA) + len(tierB) + len(tierC) >= TARGET:
            break
        w = line.split()[0].lower()
        if w in seen or not ok(w):
            continue
        if w not in sysdict:
            continue
        seen.add(w)
        tierC.append(w)

    want = {}
    for w in tierA:
        want[w] = "A"
    for w in tierB:
        want[w] = "B"
    for w in tierC:
        want[w] = "C"

    # ------------------------------------------------------- pull vectors ----
    gzp = os.path.join(SEM, "numberbatch-en.txt.gz")
    vecs = {}
    scanned = 0
    with gzip.open(gzp, "rt", encoding="utf-8", errors="replace") as f:
        f.readline()                      # "516782 300"
        for line in f:
            scanned += 1
            sp = line.find(" ")
            if sp <= 0:
                continue
            term = line[:sp]
            if term not in want:
                continue
            vals = line[sp + 1:].split(" ")
            if len(vals) != DIMS:
                continue
            vecs[term] = array("f", [float(v) for v in vals])

    # keep frequency order, drop anything Numberbatch does not know
    order = [w for w in tierA if w in vecs] + \
            [w for w in tierB if w in vecs] + \
            [w for w in tierC if w in vecs]

    with open(os.path.join(SEM, "vocab.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(order) + "\n")
    with open(os.path.join(SEM, "tiers.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(want[w] for w in order) + "\n")
    with open(os.path.join(SEM, "freq.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(str(rank.get(w, 999999)) for w in order) + "\n")
    with open(os.path.join(SEM, "vecs.f32"), "wb") as f:
        for w in order:
            f.write(vecs[w].tobytes())

    rep = [
        "blocklist derived from google10k diff : %d" % len(derived),
        "blocklist total (with inflections)   : %d" % len(block),
        "proper names excluded                : %d" % len(proper),
        "SWOW distinct single-word cues        : %d" % len(cues),
        "tier A candidates (clean google 10k)  : %d" % len(tierA),
        "tier B candidates (SWOW cues)         : %d" % len(tierB),
        "tier C candidates (subtitle freq)     : %d" % len(tierC),
        "numberbatch lines scanned             : %d" % scanned,
        "vectors found                         : %d" % len(vecs),
        "VOCAB SHIPPED                         : %d" % len(order),
        "vecs.f32 bytes                        : %d" % (len(order) * DIMS * 4),
    ]
    txt = "\n".join(rep) + "\n"
    with open(os.path.join(SEM, "report.txt"), "w", encoding="utf-8") as f:
        f.write(txt)
    sys.stdout.write(txt)


if __name__ == "__main__":
    main()
