# -*- coding: utf-8 -*-
"""
phylo_bank.py — the hand-authored tree of life behind PHYLO (games/phylo).

The whole cabinet is one data structure: a rooted tree whose internal nodes are
CLADES with an age in millions of years (Ma), and whose leaves are ORGANISMS.
Everything the game says is derived from it — the distance between two
organisms is simply the age of their most recent common ancestor.

    C(name, sci, age, *children, gloss=, rank=)   a clade
    T(name, sci, tier=, clue=, alt=, ext=)        an organism (leaf)

AGES
  Node ages are median divergence-time estimates, rounded, from TimeTree v5
  (Kumar et al. 2022, timetree.org) and the standard primary literature behind
  it. They are estimates and the game says so out loud — it prints "≈".
  Rounding is deliberate: a game that prints 96.4 Ma implies a precision that
  molecular clocks do not have. The rule the validator enforces is that a child
  is always strictly younger than its parent, because that is what makes the
  puzzle's logic sound.

  Deep nodes (>1 Ga) are the least certain and are given as round numbers.
  Very recent nodes are given in fractions of a Ma (0.03 = 30,000 years).

TOPOLOGY
  Standard consensus. Places that are genuinely unresolved are left as
  polytomies rather than faked into a resolution — the base of the animals
  (sponge-sister vs ctenophore-sister is still argued) is the loudest example.
  A polytomy is honest: it means "these separated at about the same time, and
  nobody can order them yet".

TIERS
  1  famous — anyone would name it. Fair game as the day's answer.
  2  known — a reader of natural history would place it. Fair game.
  3  guess-only — real and typable, never the day's answer (obscure, or a
     laboratory organism, or a fossil taxon whose placement carries caveats).

Nothing here is generated. Every organism was chosen because a person could
plausibly type it, and every scientific name is one I could vouch for.
"""


def C(name, sci, age, *kids, **kw):
    """A clade: named group, age of its most recent common ancestor, children."""
    return {
        "k": "c", "name": name, "sci": sci, "age": float(age), "kids": list(kids),
        "gloss": kw.get("gloss"), "rank": kw.get("rank"), "id": kw.get("id"),
    }


def T(name, sci, **kw):
    """An organism at the tip of a branch."""
    return {
        "k": "t", "name": name, "sci": sci, "tier": kw.get("tier", 2),
        "clue": kw.get("clue"), "alt": tuple(kw.get("alt", ())),
        "ext": 1 if kw.get("ext") else 0, "id": kw.get("id"),
    }


# ══════════════════════════════════════════════════════════════════════════════
# BACTERIA + ARCHAEA — the two-thirds of life nobody draws
# ══════════════════════════════════════════════════════════════════════════════

BACTERIA = C(
    "Bacteria", "Bacteria", 3400,
    C("Cyanobacteria", "Cyanobacteriota", 2600,
      T("Cyanobacterium", "Synechococcus sp.", tier=3,
        alt=("blue-green algae", "cyanobacteria"),
        clue="its ancestors put the oxygen in the air, then moved into plants"),
      T("Spirulina", "Arthrospira platensis", tier=3,
        clue="skimmed off alkaline lakes and sold as a green powder"),
      gloss="the bacteria that invented oxygen photosynthesis and rusted the sky"),
    C("Gram-positive bacteria", "Bacillota and Actinomycetota", 3000,
      T("Lactobacillus", "Lactobacillus delbrueckii", tier=3,
        alt=("lactobacillus", "yoghurt bacterium"),
        clue="turns milk into yoghurt by souring it with lactic acid"),
      T("Tuberculosis bacterium", "Mycobacterium tuberculosis", tier=3,
        alt=("tb", "tuberculosis"),
        clue="a waxy coat lets it live inside the very cells sent to kill it"),
      T("Anthrax bacterium", "Bacillus anthracis", tier=3, alt=("anthrax",),
        clue="waits out decades in dry soil as a spore")),
    C("Proteobacteria", "Pseudomonadota", 2800,
      T("Escherichia coli", "Escherichia coli", tier=2,
        alt=("e coli", "ecoli", "e. coli"),
        clue="the workhorse of every molecular biology lab — and of your gut"),
      T("Salmonella", "Salmonella enterica", tier=3,
        clue="the reason nobody eats raw chicken"),
      T("Cholera bacterium", "Vibrio cholerae", tier=3, alt=("cholera",),
        clue="John Snow traced it to one water pump on Broad Street")),
    T("Thermus aquaticus", "Thermus aquaticus", tier=3, alt=("taq", "taq polymerase"),
      clue="lifted from a Yellowstone hot spring; its enzyme made PCR possible"),
    rank="domain",
    gloss="single cells with no nucleus — the oldest and most numerous life there is")

ARCHAEA = C(
    "Archaea", "Archaea", 3200,
    T("Methanogen", "Methanobrevibacter smithii", tier=3, alt=("methanogen",),
      clue="breathes out methane; lives in swamps, in cows and in you"),
    T("Halobacterium", "Halobacterium salinarum", tier=3, alt=("halophile",),
      clue="dyes salt lakes pink and needs brine to hold itself together"),
    T("Sulfolobus", "Saccharolobus solfataricus", tier=3,
      clue="lives in boiling acid around volcanic vents"),
    rank="domain",
    gloss="a third domain of single cells — and the lineage our own cells came out of")


# ══════════════════════════════════════════════════════════════════════════════
# THE OTHER EUKARYOTES — algae, amoebae, and the things that cause plagues
# ══════════════════════════════════════════════════════════════════════════════

SAR = C(
    "SAR clade", "Sar", 1450,
    C("Stramenopiles", "Stramenopiles", 1100,
      C("Brown algae", "Phaeophyceae", 200,
        T("Giant kelp", "Macrocystis pyrifera", tier=2, alt=("kelp",),
          clue="grows half a metre a day into an underwater forest"),
        T("Bladderwrack", "Fucus vesiculosus", tier=3, alt=("wrack", "seaweed"),
          clue="the popping bladders underfoot on a Scottish shore"),
        gloss="seaweed that built a forest without ever becoming a plant"),
      T("Diatom", "Thalassiosira pseudonana", tier=2, alt=("diatoms",),
        clue="a single cell in a glass box; makes a fifth of the world's oxygen"),
      T("Potato blight", "Phytophthora infestans", tier=3, alt=("blight", "late blight"),
        clue="emptied Ireland in the 1840s — and it is not a fungus")),
    C("Alveolates", "Alveolata", 1000,
      T("Malaria parasite", "Plasmodium falciparum", tier=2, alt=("malaria", "plasmodium"),
        clue="spends half its life in a mosquito and half in your red blood cells"),
      T("Paramecium", "Paramecium caudatum", tier=2,
        clue="a slipper-shaped cell that swims with thousands of tiny oars"),
      T("Dinoflagellate", "Karenia brevis", tier=3, alt=("dinoflagellate", "red tide"),
        clue="makes the sea glow at night, and sometimes makes it lethal")),
    T("Foraminiferan", "Globigerina bulloides", tier=3, alt=("foraminifera", "foram"),
      clue="a cell in a chalk shell; trillions of them are the White Cliffs"),
    gloss="kelp, diatoms, malaria and half the plankton in the sea — not one of them a plant")

AMOEBOZOA = C(
    "Amoebozoa", "Amoebozoa", 1100,
    T("Amoeba", "Amoeba proteus", tier=2, alt=("amoeba", "ameba"),
      clue="has no fixed shape at all; flows around its food and swallows it"),
    T("Slime mould", "Physarum polycephalum", tier=2, alt=("slime mold",),
      clue="one enormous cell with many nuclei; solves mazes with no brain"),
    gloss="cells that move by pouring themselves forwards")
