#!/usr/bin/env python3
# =============================================================================
# SEMANTIC WING · STEP 3 — the shipped vector table.
#
# DECISION LOG (all three options were measured, see sem/fidelity*.txt):
#   dim selection K=128            Spearman 0.803   -> rejected, visibly broken
#   real PCA      K=128 / K=192    0.882 / 0.948    -> rejected, Numberbatch is
#                                                     near-isotropic (only 84.8%
#                                                     of its energy sits in 192
#                                                     of 300 components)
#   all 300 dims, 4-bit codes      0.986            -> SHIPPED
# So: keep Numberbatch's full basis, spend the bytes on quantisation, and pay
# for the size by trimming the vocabulary instead of the dimensions.
#
# Vocabulary rule: every word of the clean Google-10k base, plus every Small
# World of Words cue that survives the blocklist (those are the words humans
# demonstrably have associations for, which is exactly the right guessing
# vocabulary for a Contexto), capped at CAP and re-sorted by corpus frequency
# so word id 0 is the commonest word.
#
# Packing: 2 codes per byte, base64, split into chunk files under 285 KB
# (CONTRACT §0: no data file over 300 KB).
#
# Output:
#   core/data/semantic.js         AD_SEM   vocab + codebook + shape
#   core/data/semantic-v<k>.js    AD_SEMV[k]  base64 chunks of the code table
#   sem/ship_vocab.txt            shipped vocabulary, one word per line
#   sem/ship_vecs.f32             full-precision vectors for the shipped vocab
#                                 (offline puzzle generation reads these)
# =============================================================================
import base64, math, os, sys
from array import array
from operator import mul

HERE = os.path.dirname(os.path.abspath(__file__))
SEM = os.path.join(HERE, "sem")
OUT = os.path.abspath(os.path.join(HERE, "..", "core", "data"))
DIMS = 300
BITS = 4
LEVELS = 1 << BITS
CAP = 11600
CHUNK = 280000          # base64 chars per chunk file


def lloyd_max(sample, levels, iters=80):
    sample = sorted(sample)
    m = len(sample)
    cent = [sample[min(m - 1, int((k + 0.5) * m / levels))] for k in range(levels)]
    for _ in range(iters):
        bnd = [(cent[k] + cent[k + 1]) / 2.0 for k in range(levels - 1)]
        sums = [0.0] * levels
        cnts = [0] * levels
        for v in sample:
            lo, hi = 0, levels - 1
            while lo < hi:
                mid = (lo + hi) // 2
                if v <= bnd[mid]:
                    hi = mid
                else:
                    lo = mid + 1
            sums[lo] += v
            cnts[lo] += 1
        moved = 0.0
        for k in range(levels):
            if cnts[k]:
                nc = sums[k] / cnts[k]
                moved = max(moved, abs(nc - cent[k]))
                cent[k] = nc
        if moved < 1e-9:
            break
    return cent


def main():
    vocab = open(os.path.join(SEM, "vocab.txt"), encoding="utf-8").read().split()
    tiers = open(os.path.join(SEM, "tiers.txt"), encoding="utf-8").read().split()
    freqs = [int(x) for x in open(os.path.join(SEM, "freq.txt"), encoding="utf-8").read().split()]
    raw = array("f")
    with open(os.path.join(SEM, "vecs.f32"), "rb") as f:
        raw.frombytes(f.read())
    n0 = len(raw) // DIMS
    assert n0 == len(vocab) == len(tiers) == len(freqs)

    # ---- pick the shipped vocabulary -------------------------------------
    keep = []
    for i, w in enumerate(vocab):
        if tiers[i] == "C":
            continue                       # subtitle-frequency filler: not needed
        if tiers[i] == "B" and len(w) > 12:
            continue
        keep.append(i)
    # cap by dropping the rarest first
    keep.sort(key=lambda i: freqs[i])
    keep = keep[:CAP]
    keep.sort(key=lambda i: (freqs[i], vocab[i]))    # id 0 = commonest

    ship = [vocab[i] for i in keep]
    n = len(ship)
    sv = array("f", bytes(4 * n * DIMS))
    for newi, oldi in enumerate(keep):
        sv[newi * DIMS:(newi + 1) * DIMS] = raw[oldi * DIMS:(oldi + 1) * DIMS]

    with open(os.path.join(SEM, "ship_vocab.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(ship) + "\n")
    with open(os.path.join(SEM, "ship_vecs.f32"), "wb") as f:
        f.write(sv.tobytes())
    with open(os.path.join(SEM, "ship_freq.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(str(freqs[i]) for i in keep) + "\n")
    with open(os.path.join(SEM, "ship_tier.txt"), "w", encoding="utf-8") as f:
        f.write("".join(tiers[i] for i in keep) + "\n")

    # ---- quantise --------------------------------------------------------
    samp = [sv[i] for i in range(0, n * DIMS, 29)]
    cent = lloyd_max(samp, LEVELS)
    bnd = [(cent[k] + cent[k + 1]) / 2.0 for k in range(LEVELS - 1)]

    packed = bytearray(n * DIMS // 2)
    p = 0
    for i in range(0, n * DIMS, 2):
        c = []
        for v in (sv[i], sv[i + 1]):
            lo, hi = 0, LEVELS - 1
            while lo < hi:
                mid = (lo + hi) // 2
                if v <= bnd[mid]:
                    hi = mid
                else:
                    lo = mid + 1
            c.append(lo)
        packed[p] = (c[0] << 4) | c[1]
        p += 1

    b64 = base64.b64encode(bytes(packed)).decode("ascii")
    chunks = [b64[i:i + CHUNK] for i in range(0, len(b64), CHUNK)]

    # ---- write the JS ----------------------------------------------------
    hdr = ("/* ===========================================================================\n"
           "   AD_SEM — the arcade's model of word meaning.\n"
           "   Source: ConceptNet Numberbatch 19.08 (English), CC BY-SA 4.0,\n"
           "     https://github.com/commonsense/conceptnet-numberbatch\n"
           "   Vocabulary: the clean Google-10k frequency list plus the cue set of the\n"
           "     Small World of Words English association norms (De Deyne et al. 2019),\n"
           "     filtered through a mechanically derived obscenity/proper-name blocklist.\n"
           "   Generated by _build/sem_build.py. Do not hand-edit.\n"
           "   words  : space-separated, index = word id, id 0 = commonest\n"
           "   cb     : 16 reconstruction levels for the 4-bit codes\n"
           "   dims   : 300. Codes live in AD_SEMV, 2 per byte, hi nibble first.\n"
           "   Vectors are unit-length, so a dot product IS a cosine.\n"
           "   Measured fidelity vs full float32: Spearman 0.986 on whole-vocabulary\n"
           "   rankings, 95.5/100 top-100 overlap (_build/sem/fidelity_quant.txt).\n"
           "   =========================================================================== */\n")
    js = [hdr, "window.AD_SEM = {\n",
          "  dims: %d, bits: %d, n: %d, chunks: %d, chunkLen: %d,\n" % (DIMS, BITS, n, len(chunks), CHUNK),
          "  cb: [" + ",".join("%.6f" % c for c in cent) + "],\n",
          '  words: "' + " ".join(ship) + '"\n', "};\n"]
    with open(os.path.join(OUT, "semantic.js"), "w", encoding="utf-8") as f:
        f.write("".join(js))

    for k, ch in enumerate(chunks):
        with open(os.path.join(OUT, "semantic-v%d.js" % k), "w", encoding="utf-8") as f:
            f.write("/* AD_SEM code table, chunk %d/%d. Generated by _build/sem_build.py. */\n"
                    % (k + 1, len(chunks)))
            f.write("window.AD_SEMV=window.AD_SEMV||[];window.AD_SEMV[%d]=\n\"%s\";\n" % (k, ch))

    sizes = [os.path.getsize(os.path.join(OUT, "semantic.js"))]
    for k in range(len(chunks)):
        sizes.append(os.path.getsize(os.path.join(OUT, "semantic-v%d.js" % k)))

    rep = ["shipped vocabulary        : %d words" % n,
           "codes packed bytes        : %d" % len(packed),
           "base64 chars              : %d" % len(b64),
           "chunk files               : %d" % len(chunks),
           "semantic.js bytes         : %d" % sizes[0],
           "largest chunk file bytes  : %d" % max(sizes[1:]),
           "total shipped bytes       : %d" % sum(sizes)]
    txt = "\n".join(rep) + "\n"
    with open(os.path.join(SEM, "build_report.txt"), "w") as f:
        f.write(txt)
    sys.stdout.write(txt)


if __name__ == "__main__":
    main()
