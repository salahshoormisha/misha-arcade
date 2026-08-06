#!/usr/bin/env python3
# =============================================================================
# SEMANTIC WING · LINXICON generator.
#
# THE GAME. Two words that feel unrelated. Build a chain between them where every
# consecutive pair is a real link — the rule sem_linkgraph.py documents:
#     u–v is a link  IFF  a human in SWOW answered one with the other (count>=2)
#                   OR    cos(u, v) >= TAU.
# Bolder steps score better, so the puzzle we want is one where the endpoints are
# genuinely far apart and there IS a route, but the route is not obvious.
#
# WHAT A DAY NEEDS, and what is asserted before it ships:
#   · both endpoints are real, recognisable, unloaded content words
#   · cos(a, b) is LOW — they must actually feel unrelated
#   · a–b is NOT itself a link (that would be a zero-move puzzle)
#   · a path exists. Not "BFS said so" — the path is re-checked edge by edge
#     against the rule above before the puzzle is written out.
#   · every word on the path is distinct
#
# "SHORTEST KNOWN PATH", not shortest. BFS runs over the CORE (the commonest
# CORE words), because that is the half of the cosine graph that exists
# precomputed — building it over all 11.6k words is ~20 billion pure-Python
# multiplications. At runtime the cosine test applies to the WHOLE vocabulary,
# which can only ever make a player's route shorter than the one we quote. The
# cabinet says "shortest we know of" and means it.
#
# BOLDNESS must match games/linxicon/game.js exactly:
#     bold(c) = clamp(round(100 * (0.75 - c) / 0.55), 0, 100)
#   c = 0.75 (near-synonym) -> 0;  c = TAU (the loosest legal vector step) -> 78;
#   c = 0.20 (a human association the vectors cannot even see) -> 100.
#
# Output: core/data/linxicon.js  -> window.AD_LINXICON   (written INCREMENTALLY)
#         _build/sem/linxicon_report.txt
# =============================================================================
import json
import os
import sys
from array import array
from collections import defaultdict, deque
from operator import mul

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SEM = os.path.join(HERE, "sem")
OUT = os.path.join(ROOT, "core", "data", "linxicon.js")

DIMS = 300
CORE = 4200            # BFS universe — matches sem_linkgraph.py's CORE
TARGET = 520           # days of puzzles (the brief asks for >= 400)
MAX_FAR = 0.050        # endpoints must be this unrelated or less
MIN_HOPS = 3           # shortest known path, in links
MAX_HOPS = 5
ENDPOINT_REUSE = 2     # how often one word may be an endpoint across the archive

# Function and discourse words. The shipped vocabulary is frequency-ordered over
# a spoken corpus, so its head is "yeah / okay / gonna" rather than nouns. None
# of these make a puzzle; all of them are still legal to PLAY through.
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
they thing things think this those thou though thought thoughts three thru thus till to together too
took toward towards two u um un unless unlike until unto up upon us use used using usually ve very via
want wants was wasn way ways we well went were weren what whatever when whenever where whereas wherever
whether which while whilst who whoever whole whom whose why will with within without won wonder would
wouldn ya yeah yep yes yet you your yours yourself yourselves yup
sir ma mr mrs ms dr guy guys folks anyhow ok alright uh huh whoa oops hmmm mmm nah nope
""".split())

# Nobody wants to open a morning puzzle and be handed a pair of these. Legal to
# play through, never an endpoint.
GRIM = set("""
abuse addict addiction aids alcoholic amputate autopsy bleed bleeding blood bomb bombing bullet
cancer casket cemetery chemo coffin corpse crash cremate crime dead deadly death deceased
depressed depression die died dies disease diseases drown drowning drugs dying euthanasia execute
execution famine fatal funeral gore grave graveyard grief gun guns gunshot hearse heroin hitler holocaust
homicide hospice hostage illness incest injury insane insanity kill killed killer killing knife lynch
massacre miscarriage molest morgue mortuary murder murderer nazi nuke obituary overdose pandemic
paralysed paralyzed plague poison poisoned prison rape rapist refugee scalpel seizure sick sickness slain
slaughter slave slavery starve starving stillborn strangle stroke suffering suicide surgery terminal
terror terrorism terrorist torture toxic trauma tumor tumour undertaker victim violence violent virus war
weapon widow wound wounded
""".split())

# CONTRACT §7, kept light: words that quietly smell of Edinburgh rain, a London
# bridge, a Houston highway, a Cambridge winter, a Persian kitchen and a football
# Saturday. Used ONLY to nudge which endpoints get picked first — never to force
# a pair, and never announced anywhere in the game.
SEASON = set("""
football goal pitch team league match striker keeper stadium supporter
tea kettle rain drizzle fog snow frost wind storm umbrella
castle hill cliff bridge tower cathedral abbey close cobbles
subway platform ticket taxi bus train tram highway freeway traffic
market bazaar spice saffron rice bread pomegranate walnut almond
sugar lemon honey cheese soup lamb chicken rose garden courtyard
poetry poem verse music dance river coast harbor harbour brick
university library museum lecture campus student bookshop
autumn winter summer heat cold kitchen dinner supper breakfast
""".split())


def main():
    vocab = open(os.path.join(SEM, "ship_vocab.txt"), encoding="utf-8").read().split()
    freq = [int(x) for x in open(os.path.join(SEM, "ship_freq.txt"), encoding="utf-8").read().split()]
    tau = float(open(os.path.join(SEM, "tau.txt")).read().strip())
    v = array("f")
    with open(os.path.join(SEM, "ship_vecs.f32"), "rb") as f:
        v.frombytes(f.read())
    n = len(vocab)
    idx = {w: i for i, w in enumerate(vocab)}

    def vec(i):
        return v[i * DIMS:(i + 1) * DIMS]

    def cos(i, j):
        return sum(map(mul, vec(i), vec(j)))

    # ---- the LINK graph, exactly as sem_linkgraph.py defines it ------------
    assoc = set()                       # undirected, canonical (min, max)
    cue_deg = defaultdict(int)
    resp_deg = defaultdict(int)
    with open(os.path.join(SEM, "assoc.tsv"), encoding="utf-8") as f:
        for line in f:
            a, b, c = line.split()
            a, b = int(a), int(b)
            cue_deg[a] += 1
            resp_deg[b] += 1
            if a != b:
                assoc.add((a, b) if a < b else (b, a))

    cosedge = set()
    e = array("H")
    with open(os.path.join(SEM, "core_edges.bin"), "rb") as f:
        e.frombytes(f.read())
    for k in range(0, len(e), 2):
        cosedge.add((e[k], e[k + 1]))

    adj = [[] for _ in range(CORE)]
    for (i, j) in cosedge:
        adj[i].append(j)
        adj[j].append(i)
    core_assoc = 0
    for (i, j) in assoc:
        if i < CORE and j < CORE and (i, j) not in cosedge:
            adj[i].append(j)
            adj[j].append(i)
            core_assoc += 1
    sys.stdout.write("link graph: %d cosine + %d association edges over %d nodes\n"
                     % (len(cosedge), core_assoc, CORE))

    def is_link(i, j):
        """The rule, evaluated the same way the browser will evaluate it."""
        if i == j:
            return False
        key = (i, j) if i < j else (j, i)
        if key in assoc:
            return True
        return cos(i, j) >= tau

    def bold(c):
        b = int(round(100.0 * (0.75 - c) / 0.55))
        return 0 if b < 0 else (100 if b > 100 else b)

    # ---- endpoint pool ----------------------------------------------------
    def endpoint_ok(i):
        w = vocab[i]
        if len(w) < 3 or not w.isalpha():
            return False
        if w in STOP or w in GRIM:
            return False
        if w.endswith("ing") or w.endswith("ly") or w.endswith("n't"):
            return False
        if cue_deg.get(i, 0) < 10 or resp_deg.get(i, 0) < 4:
            return False
        return len(adj[i]) >= 6

    def stem(w):
        """Light singular/gerund fold, so RIVER→NAIL and RIVER→NAILS cannot both
        ship as if they were two different days."""
        for suf in ("ies", "es", "s"):
            if len(w) > 4 and w.endswith(suf):
                base = w[:-len(suf)] + ("y" if suf == "ies" else "")
                if base in idx:
                    return base
        return w

    pool = [i for i in range(CORE) if endpoint_ok(i)]
    # Seasoned words first, then commonest first: the archive opens on words
    # anybody would recognise and drifts outward.
    pool.sort(key=lambda i: (0 if vocab[i] in SEASON else 1, i))
    sys.stdout.write("endpoint pool: %d words (%d seasoned)\n"
                     % (len(pool), sum(1 for i in pool if vocab[i] in SEASON)))
    poolset = set(pool)

    # ---- generate ---------------------------------------------------------
    puzzles = []
    used_pair = set()
    used_end = defaultdict(int)
    raw = open(os.path.join(SEM, "linxicon_raw.tsv"), "w", encoding="utf-8")
    band_count = defaultdict(int)

    for a in pool:
        if len(puzzles) >= TARGET:
            break
        sa = stem(vocab[a])
        if used_end[sa] >= ENDPOINT_REUSE:
            continue

        # BFS out to MAX_HOPS, remembering one parent per node
        dist = {a: 0}
        par = {a: -1}
        dq = deque([a])
        while dq:
            u = dq.popleft()
            if dist[u] >= MAX_HOPS:
                continue
            for w in adj[u]:
                if w not in dist:
                    dist[w] = dist[u] + 1
                    par[w] = u
                    dq.append(w)

        va = vec(a)
        made_here = 0
        # Candidate partners: far in meaning, reachable, and still fresh.
        cands = []
        for b, d in dist.items():
            if d < MIN_HOPS or b not in poolset:
                continue
            sb = stem(vocab[b])
            if sb == sa or used_end[sb] >= ENDPOINT_REUSE:
                continue
            key = (sa, sb) if sa < sb else (sb, sa)
            if key in used_pair:
                continue
            if ((a, b) if a < b else (b, a)) in assoc:
                continue
            c = sum(map(mul, va, vec(b)))
            if c > MAX_FAR:
                continue
            cands.append((-d, c, b))
        # Longest chain first, then the most distant pair — the long ones are
        # scarce and worth more. But take the SECOND puzzle from this word out of
        # the shortest band available, so the archive gets both lengths instead
        # of 500 identical 4-link days.
        cands.sort()
        if cands:
            shortest = -max(k[0] for k in cands)
            longest = -min(k[0] for k in cands)
            if shortest != longest:
                alt = [k for k in cands if -k[0] == shortest]
                cands = [cands[0]] + alt + cands[1:]

        for negd, c_ab, b in cands:
            d = -negd
            if len(puzzles) >= TARGET or made_here >= 2:
                break
            # rebuild the path
            path, u = [], b
            while u != -1:
                path.append(u)
                u = par[u]
            path.reverse()

            # ---- VALIDATE, against the rule, not against the search --------
            if path[0] != a or path[-1] != b:
                continue
            if len(set(path)) != len(path):
                continue
            if len(path) - 1 != d or not (MIN_HOPS <= d <= MAX_HOPS):
                continue
            steps = []
            good = True
            for k in range(len(path) - 1):
                if not is_link(path[k], path[k + 1]):
                    good = False
                    break
                steps.append(cos(path[k], path[k + 1]))
            if not good:
                continue
            if is_link(a, b):          # a one-move puzzle is not a puzzle
                continue

            rb = int(round(sum(bold(s) for s in steps) / float(len(steps))))
            sb = stem(vocab[b])
            used_pair.add((sa, sb) if sa < sb else (sb, sa))
            used_end[sa] += 1
            used_end[sb] += 1
            made_here += 1
            band_count[d] += 1
            puzzles.append({
                "a": vocab[a], "b": vocab[b], "n": d,
                "rb": rb, "far": round(c_ab, 3),
                "path": [vocab[x] for x in path],
            })
            raw.write("%s\t%s\t%d\t%d\t%.4f\t%s\n"
                      % (vocab[a], vocab[b], d, rb, c_ab, " ".join(vocab[x] for x in path)))
            raw.flush()
            if len(puzzles) % 40 == 0:
                write_out(puzzles, tau)          # a killed run still leaves a file
                sys.stdout.write("  %d puzzles\n" % len(puzzles))
                sys.stdout.flush()

    raw.close()

    # ---- deal into days ---------------------------------------------------
    # Not a difficulty ramp and not a shuffle: a deterministic weave that keeps
    # the same band from landing three days running, and opens the archive on
    # the gentler ones so day 0 is not a wall.
    by_band = {k: [p for p in puzzles if p["n"] == k] for k in (3, 4, 5)}
    order, last, run = [], None, 0
    while any(by_band.values()):
        pref = sorted((k for k in (3, 4, 5) if by_band[k]),
                      key=lambda k: (-len(by_band[k]),))
        pickk = None
        for k in pref:
            if k != last or run < 2:
                pickk = k
                break
        if pickk is None:
            pickk = pref[0]
        run = run + 1 if pickk == last else 1
        last = pickk
        order.append(by_band[pickk].pop(0))
    # first week: gentlest available, so the cabinet opens kindly
    head = sorted(order[:24], key=lambda p: (p["n"], -p["rb"]))
    order = head + order[24:]

    write_out(order, tau)

    ns = [p["n"] for p in order]
    rbs = [p["rb"] for p in order]
    fars = [p["far"] for p in order]
    rep = [
        "tau                        : %.6f" % tau,
        "endpoint pool              : %d" % len(pool),
        "puzzles shipped            : %d" % len(order),
        "  3-link days              : %d" % band_count[3],
        "  4-link days              : %d" % band_count[4],
        "  5-link days              : %d" % band_count[5],
        "distinct endpoint words    : %d" % len(set([p["a"] for p in order] + [p["b"] for p in order])),
        "duplicate pairs            : %d" % (len(order) - len(set((p["a"], p["b"]) for p in order))),
        "endpoint cosine min/med/max: %.3f / %.3f / %.3f"
        % (min(fars), sorted(fars)[len(fars) // 2], max(fars)),
        "canonical-path boldness    : %d / %d / %d (min/median/max)"
        % (min(rbs), sorted(rbs)[len(rbs) // 2], max(rbs)),
        "mean links per day         : %.2f" % (sum(ns) / float(len(ns))),
        "linxicon.js bytes          : %d" % os.path.getsize(OUT),
    ]
    txt = "\n".join(rep) + "\n"
    open(os.path.join(SEM, "linxicon_report.txt"), "w").write(txt)
    sys.stdout.write(txt)


def write_out(puzzles, tau):
    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write("/* ===========================================================================\n"
                "   AD_LINXICON — the daily chains.\n"
                "   Generated by _build/sem_gen_linxicon.py from ConceptNet Numberbatch 19.08\n"
                "   and the Small World of Words English association norms. Do not hand-edit.\n"
                "     a, b   the two endpoints, in the order they are shown\n"
                "     n      links in the SHORTEST KNOWN path (see the script's header)\n"
                "     rb     mean boldness of that path, 0-100 — what par is computed from\n"
                "     far    cos(a, b): how unrelated the endpoints actually are\n"
                "     path   one route that works; every edge re-checked against the link\n"
                "            rule before shipping. It is the hint source and the reveal,\n"
                "            never the only answer.\n"
                "   =========================================================================== */\n")
        f.write("window.AD_LINXICON = { tau: %.6f, puzzles: [\n" % tau)
        for p in puzzles:
            f.write(json.dumps(p, separators=(",", ":"), sort_keys=True) + ",\n")
        f.write("] };\n")
    os.replace(tmp, OUT)


if __name__ == "__main__":
    main()
