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


# ══════════════════════════════════════════════════════════════════════════════
# PLANTS — one captured cyanobacterium, and then everything green
# ══════════════════════════════════════════════════════════════════════════════

GRASSES = C(
    "Grasses", "Poaceae", 80,
    C("BOP grasses", "BOP clade", 55,
      T("Rice", "Oryza sativa", tier=1, clue="grown in standing water; feeds half the planet"),
      T("Bamboo", "Phyllostachys edulis", tier=1, clue="a grass that can grow a metre in a day"),
      C("Wheat and barley", "Triticeae", 13,
        T("Wheat", "Triticum aestivum", tier=1, clue="six copies of the genome; bread depends on its gluten"),
        T("Barley", "Hordeum vulgare", tier=2, clue="malted for beer and whisky before it is ever eaten"))),
    C("PACMAD grasses", "PACMAD clade", 60,
      T("Maize", "Zea mays", tier=1, alt=("corn", "sweetcorn"),
        clue="bred out of a scrappy Mexican grass called teosinte"),
      T("Sugarcane", "Saccharum officinarum", tier=2,
        clue="a grass so full of sugar the stem is pressed like fruit")),
    rank="family",
    gloss="the family that feeds the world and covers a quarter of its land")

MONOCOTS = C(
    "Monocots", "Monocotyledons", 150,
    C("Alismatales", "Alismatales", 130,
      T("Duckweed", "Lemna minor", tier=2, clue="the smallest flowering plant; a green film on a still pond"),
      T("Eelgrass", "Zostera marina", tier=3, alt=("seagrass",),
        clue="a flowering plant that went back into the sea and pollinates underwater")),
    C("Lily-like monocots", "Lilianae", 130,
      C("Liliales", "Liliales", 115,
        T("Tulip", "Tulipa gesneriana", tier=1, clue="crashed the Dutch economy in 1637"),
        T("Lily", "Lilium candidum", tier=2, clue="six tepals, and pollen that stains everything")),
      C("Asparagales", "Asparagales", 120,
        T("Vanilla orchid", "Vanilla planifolia", tier=2, alt=("orchid", "vanilla"),
          clue="a climbing orchid whose pod is the world's second-costliest spice"),
        T("Onion", "Allium cepa", tier=1, clue="cutting it releases a gas that makes you cry"),
        T("Garlic", "Allium sativum", tier=1, clue="crushing the clove is what creates the smell"),
        T("Daffodil", "Narcissus pseudonarcissus", tier=2, clue="a trumpet inside a ring of petals, first out in spring"),
        T("Saffron crocus", "Crocus sativus", tier=2, alt=("saffron",),
          clue="three red threads per flower, picked by hand at dawn"))),
    C("Commelinids", "Commelinids", 125,
      C("Palms", "Arecaceae", 100,
        T("Coconut palm", "Cocos nucifera", tier=1, alt=("coconut",),
          clue="its seed floats across oceans and arrives ready to drink"),
        T("Date palm", "Phoenix dactylifera", tier=2, alt=("dates",),
          clue="cultivated in Mesopotamia for six thousand years"),
        rank="family"),
      C("Zingiberales", "Zingiberales", 90,
        T("Banana", "Musa acuminata", tier=1, clue="a giant herb, not a tree; the fruit is seedless and cloned"),
        T("Ginger", "Zingiber officinale", tier=2, clue="the part you cook with is an underground stem")),
      C("Poales", "Poales", 110,
        T("Pineapple", "Ananas comosus", tier=2, clue="a hundred small fruits fused into one"),
        T("Papyrus", "Cyperus papyrus", tier=3, alt=("sedge",),
          clue="a Nile sedge sliced and pressed into the first paper"),
        GRASSES)),
    gloss="one seed leaf, parallel veins — grasses, palms, orchids, lilies")

ROSIDS = C(
    "Rosids", "Rosids", 120,
    T("Grapevine", "Vitis vinifera", tier=1, alt=("grape", "vine"),
      clue="domesticated in the Caucasus; the same vine makes every wine"),
    C("Fabids", "Fabids", 110,
      C("Legumes", "Fabaceae", 90,
        T("Pea", "Pisum sativum", tier=1, clue="Mendel counted its wrinkled and round seeds"),
        T("Soybean", "Glycine max", tier=2, clue="fixes its own nitrogen; feeds more livestock than people"),
        T("Peanut", "Arachis hypogaea", tier=2, clue="flowers above ground, then buries its own fruit"),
        T("Acacia", "Vachellia tortilis", tier=2, alt=("thorn tree",),
          clue="the flat-topped tree on every savannah horizon"),
        rank="family"),
      C("Rosales", "Rosales", 95,
        C("Rose family", "Rosaceae", 60,
          T("Rose", "Rosa gallica", tier=1, clue="the petals are distilled for the perfume of Kashan"),
          T("Apple", "Malus domestica", tier=1, clue="came out of the wild forests of Kazakhstan"),
          T("Strawberry", "Fragaria ananassa", tier=1, clue="the red part is swollen stem; the seeds are the real fruit"),
          T("Cherry", "Prunus avium", tier=2, clue="Japan tracks a front of its blossom moving north each spring"),
          rank="family"),
        C("Fig family", "Moraceae", 70,
          T("Fig", "Ficus carica", tier=1, clue="the flowers are inside the fruit, pollinated by one wasp"),
          T("Mulberry", "Morus alba", tier=2, clue="silkworms eat nothing else")),
        C("Hemp family", "Cannabaceae", 65,
          T("Hops", "Humulus lupulus", tier=2, clue="the cone that makes beer bitter"),
          T("Cannabis", "Cannabis sativa", tier=2, alt=("hemp", "marijuana"),
            clue="grown for rope and sail for millennia before anything else"))),
      C("Fagales", "Fagales", 95,
        T("Oak", "Quercus robur", tier=1, clue="drops acorns; can stand for eight hundred years"),
        T("Beech", "Fagus sylvatica", tier=2, clue="smooth grey bark, and a floor too dark for anything else"),
        T("Walnut", "Juglans regia", tier=2, clue="poisons the soil around itself so rivals cannot grow"),
        T("Birch", "Betula pendula", tier=2, clue="peeling white bark; the first tree back after the ice")),
      C("Cucurbitales", "Cucurbitales", 95,
        T("Pumpkin", "Cucurbita pepo", tier=1, alt=("squash", "courgette", "zucchini"),
          clue="one of the three sisters, planted with maize and beans"),
        T("Cucumber", "Cucumis sativus", tier=1, clue="ninety-six per cent water, and technically a berry"),
        T("Watermelon", "Citrullus lanatus", tier=1, clue="came out of Africa; painted on Egyptian tomb walls")),
      C("Malpighiales", "Malpighiales", 100,
        T("Willow", "Salix alba", tier=2, clue="its bark gave the world aspirin"),
        T("Poplar", "Populus tremula", tier=3, alt=("aspen",),
          clue="flat leaf stalks make the whole tree shiver in no wind"),
        T("Cassava", "Manihot esculenta", tier=2, alt=("manioc", "tapioca"),
          clue="a root that must be soaked and cooked or it releases cyanide"),
        T("Rubber tree", "Hevea brasiliensis", tier=2, clue="smuggled out of Brazil in a crate of seeds"),
        T("Flax", "Linum usitatissimum", tier=3, alt=("linseed",),
          clue="the stem becomes linen, the seed becomes oil"))),
    C("Malvids", "Malvids", 110,
      C("Myrtales", "Myrtales", 100,
        T("Eucalyptus", "Eucalyptus globulus", tier=2, alt=("gum tree",),
          clue="oily leaves that invite the fire it needs to reseed"),
        T("Clove", "Syzygium aromaticum", tier=3, clue="the spice is an unopened flower bud, dried"),
        T("Pomegranate", "Punica granatum", tier=1, clue="the fruit of Persian gardens; hundreds of seeds in a leathery skin")),
      C("Sapindales", "Sapindales", 95,
        T("Orange", "Citrus sinensis", tier=1, alt=("citrus",),
          clue="every commercial one is a graft of the same few trees"),
        T("Mango", "Mangifera indica", tier=1, clue="grown in India for four thousand years; related to poison ivy"),
        T("Maple", "Acer saccharum", tier=1, clue="winged seeds that spin, and sap boiled forty to one"),
        T("Pistachio", "Pistacia vera", tier=2, clue="Iran and California argue over who grows the best")),
      C("Malvales", "Malvales", 95,
        T("Cotton", "Gossypium hirsutum", tier=1, clue="the fibre is a single hugely elongated seed hair"),
        T("Cacao", "Theobroma cacao", tier=1, alt=("cocoa", "chocolate"),
          clue="pods grow straight out of the trunk; the beans must ferment"),
        T("Baobab", "Adansonia digitata", tier=2, clue="stores water in a trunk you could park a car in")),
      C("Brassicales", "Brassicales", 95,
        T("Cabbage", "Brassica oleracea", tier=1, alt=("kale", "broccoli", "cauliflower"),
          clue="one species bred into broccoli, kale, sprouts and cauliflower"),
        T("Thale cress", "Arabidopsis thaliana", tier=3, alt=("arabidopsis",),
          clue="a roadside weed with a tiny genome; the lab rat of botany"),
        T("Mustard", "Sinapis alba", tier=2, clue="the heat only appears when the crushed seed meets water"),
        T("Papaya", "Carica papaya", tier=2, clue="its enzyme tenderises meat"))),
    gloss="roses, beans, oaks, cotton, citrus — most of the trees you can name")

ASTERIDS = C(
    "Asterids", "Asterids", 120,
    C("Ericales", "Ericales", 110,
      T("Blueberry", "Vaccinium corymbosum", tier=2, clue="needs soil acid enough to kill most crops"),
      T("Tea plant", "Camellia sinensis", tier=1, alt=("tea",),
        clue="green, oolong and black are the same leaf, oxidised differently"),
      T("Brazil nut", "Bertholletia excelsa", tier=3, clue="cannot be farmed; the tree needs wild bees and one rodent")),
    C("Lamiids", "Lamiids", 105,
      C("Solanales", "Solanales", 90,
        T("Tomato", "Solanum lycopersicum", tier=1, clue="Europe grew it as an ornament for two centuries, fearing it was poison"),
        T("Potato", "Solanum tuberosum", tier=1, clue="carried out of the Andes; the tuber is a swollen stem"),
        T("Chilli", "Capsicum annuum", tier=1, alt=("chili", "pepper", "capsicum"),
          clue="the heat is a chemical that birds cannot taste"),
        T("Tobacco", "Nicotiana tabacum", tier=2, clue="the alkaloid is an insecticide the plant makes for itself")),
      C("Lamiales", "Lamiales", 95,
        T("Olive", "Olea europaea", tier=1, clue="inedible off the tree; it must be cured in brine or lye"),
        T("Lavender", "Lavandula angustifolia", tier=2, clue="square stems, and an oil that calms bees and people"),
        T("Mint", "Mentha spicata", tier=1, clue="spreads by runners until it owns the whole bed"),
        T("Basil", "Ocimum basilicum", tier=2, clue="sacred in India, and the whole point of pesto"),
        T("Sesame", "Sesamum indicum", tier=2, clue="the pod springs open — hence the phrase")),
      C("Gentianales", "Gentianales", 95,
        T("Coffee", "Coffea arabica", tier=1, clue="first brewed in Yemen from a bean that is really a seed"),
        T("Oleander", "Nerium oleander", tier=3, clue="every part of this roadside shrub can stop a heart"))),
    C("Campanulids", "Campanulids", 105,
      C("Daisy family", "Asteraceae", 90,
        T("Sunflower", "Helianthus annuus", tier=1, clue="what looks like one flower is more than a thousand"),
        T("Lettuce", "Lactuca sativa", tier=1, clue="bolts to a bitter milky stalk the moment it gets hot"),
        T("Dandelion", "Taraxacum officinale", tier=2, clue="sets seed without pollination, so every one is a clone"),
        T("Chamomile", "Matricaria chamomilla", tier=2, clue="dried heads steeped for a tea that smells of apples"),
        rank="family"),
      C("Apiales", "Apiales", 90,
        T("Carrot", "Daucus carota", tier=1, clue="wild it is white and woody; orange was a Dutch selection"),
        T("Celery", "Apium graveolens", tier=2, clue="grown in trenches and blanched to take the bitterness out"),
        T("Parsley", "Petroselinum crispum", tier=2, clue="flat or curled, and the seed takes a month to germinate"))),
    gloss="fused petals — coffee, mint, tomatoes, sunflowers")

EUDICOTS = C(
    "Eudicots", "Eudicotyledons", 145,
    C("Ranunculales", "Ranunculales", 130,
      T("Poppy", "Papaver somniferum", tier=1, clue="the scored seed pod weeps the latex that becomes opium"),
      T("Buttercup", "Ranunculus acris", tier=2, clue="glossy petals that reflect yellow light under your chin")),
    C("Proteales", "Proteales", 125,
      T("Sacred lotus", "Nelumbo nucifera", tier=2, alt=("lotus",),
        clue="leaves so water-repellent that engineers copied the surface"),
      T("Plane tree", "Platanus orientalis", tier=2, alt=("sycamore", "chenar"),
        clue="peels its own bark in plates; the shade tree of Isfahan")),
    C("Core eudicots", "Gunneridae", 125,
      C("Caryophyllales", "Caryophyllales", 110,
        T("Saguaro cactus", "Carnegiea gigantea", tier=1, alt=("cactus", "saguaro"),
          clue="pleated to swell after rain; takes seventy years to grow an arm"),
        T("Spinach", "Spinacia oleracea", tier=2, clue="its iron content was famously exaggerated by a decimal point"),
        T("Quinoa", "Chenopodium quinoa", tier=2, clue="the seed must be rinsed of its bitter soapy coat"),
        T("Venus flytrap", "Dionaea muscipula", tier=1, clue="counts touches on its trigger hairs before it shuts"),
        T("Rhubarb", "Rheum rhabarbarum", tier=2, clue="the stalk is a pudding; the leaf is poison")),
      ASTERIDS,
      ROSIDS),
    gloss="three pollen pores — four fifths of all flowering plants")

ANGIOSPERMS = C(
    "Flowering plants", "Angiospermae", 190,
    T("Amborella", "Amborella trichopoda", tier=3,
      clue="a shrub on one Pacific island, sister to every other flower on earth"),
    C("Water lilies", "Nymphaeales", 175,
      T("Water lily", "Nymphaea alba", tier=2, clue="roots in the mud, leaves floating, flower open only by day")),
    C("Mesangiosperms", "Mesangiospermae", 170,
      C("Magnoliids", "Magnoliids", 160,
        T("Magnolia", "Magnolia grandiflora", tier=2,
          clue="older than bees, so it is built to be pollinated by beetles"),
        T("Avocado", "Persea americana", tier=1,
          clue="its fruit was built for a giant sloth that no longer exists"),
        T("Black pepper", "Piper nigrum", tier=2, alt=("pepper", "peppercorn"),
          clue="a climbing vine whose dried berry once cost more than gold"),
        T("Cinnamon", "Cinnamomum verum", tier=2, clue="the spice is the inner bark, rolled as it dries")),
      MONOCOTS,
      EUDICOTS),
    gloss="the flower, the fruit and the double fertilisation — 300,000 species in 150 million years")

GYMNOSPERMS = C(
    "Gymnosperms", "Acrogymnospermae", 330,
    C("Cycads and ginkgo", "Cycadophyta and Ginkgophyta", 310,
      T("Sago cycad", "Cycas revoluta", tier=2, alt=("cycad", "sago palm"),
        clue="looks like a palm, but its ancestors fed the dinosaurs"),
      T("Ginkgo", "Ginkgo biloba", tier=1, alt=("maidenhair tree",),
        clue="the last of its kind; four trees survived Hiroshima")),
    C("Conifers and gnetophytes", "Conifers and Gnetophyta", 310,
      T("Welwitschia", "Welwitschia mirabilis", tier=3,
        clue="two leaves, growing for a thousand years in the Namib"),
      C("Conifers", "Pinophyta", 300,
        C("Pine family", "Pinaceae", 200,
          T("Scots pine", "Pinus sylvestris", tier=2, alt=("pine",),
            clue="orange bark up top; the tree that came back after the glaciers"),
          T("Spruce", "Picea abies", tier=2, clue="the tree in the corner of the room every December"),
          T("Cedar of Lebanon", "Cedrus libani", tier=2, alt=("cedar",),
            clue="on a flag, and in the timbers of Solomon's temple"),
          rank="family"),
        C("Cypress line", "Cupressophyta", 220,
          T("Coast redwood", "Sequoia sempervirens", tier=1, alt=("redwood", "sequoia"),
            clue="the tallest living thing; drinks fog through its leaves"),
          T("Yew", "Taxus baccata", tier=2, clue="every part is poison except the red flesh; longbows were cut from it"),
          T("Monkey puzzle", "Araucaria araucana", tier=3, clue="spiral spikes and a Chilean accent"))),
      gloss="cones, needles and resin — the forests that came before flowers"),
    gloss="naked seeds, no flowers, no fruit")

LAND_PLANTS = C(
    "Land plants", "Embryophyta", 500,
    C("Bryophytes", "Bryophyta and relatives", 480,
      T("Sphagnum moss", "Sphagnum palustre", tier=2, alt=("moss", "peat moss"),
        clue="acidifies the bog it builds, and preserves whatever falls in"),
      T("Haircap moss", "Polytrichum commune", tier=3, clue="taller than a moss has any business being"),
      T("Liverwort", "Marchantia polymorpha", tier=3, clue="a flat green ribbon with cups of clones on its back"),
      gloss="no plumbing — they must stay small and stay damp"),
    C("Vascular plants", "Tracheophyta", 430,
      C("Clubmosses", "Lycopodiopsida", 400,
        T("Clubmoss", "Lycopodium clavatum", tier=3, alt=("club moss",),
          clue="a survivor of the coal forests, now ankle-high")),
      C("Euphyllophytes", "Euphyllophyta", 410,
        C("Ferns and horsetails", "Polypodiopsida", 380,
          T("Bracken", "Pteridium aquilinum", tier=2, alt=("fern", "bracken fern"),
            clue="unrolls a fiddlehead; one clone can cover a whole hillside"),
          T("Horsetail", "Equisetum arvense", tier=3, clue="jointed, gritty with silica, and unchanged since the Devonian"),
          gloss="spores, not seeds — the green understorey of the coal age"),
        C("Seed plants", "Spermatophyta", 350,
          GYMNOSPERMS,
          ANGIOSPERMS,
          gloss="the seed: an embryo packed with food and posted into the future")),
      gloss="tubes for water and stiffening for height — the invention of the tree"),
    rank="kingdom",
    gloss="the move onto dry land, about half a billion years ago")

PLANTS = C(
    "Plants and their relatives", "Archaeplastida", 1600,
    C("Red algae", "Rhodophyta", 1200,
      T("Nori", "Pyropia yezoensis", tier=2, alt=("laver", "seaweed"),
        clue="dried in sheets and wrapped around rice"),
      T("Coralline alga", "Corallina officinalis", tier=3, alt=("coralline algae",),
        clue="a seaweed that builds itself a skeleton of chalk"),
      gloss="the first lineage to keep a captured cyanobacterium and never let go"),
    C("Green plants", "Viridiplantae", 1100,
      C("Green algae", "Chlorophyta", 900,
        T("Sea lettuce", "Ulva lactuca", tier=3, alt=("ulva",),
          clue="bright green sheets two cells thick, in every rock pool"),
        T("Chlamydomonas", "Chlamydomonas reinhardtii", tier=3,
          clue="a green cell with two whips and an eyespot; a lab favourite"),
        T("Volvox", "Volvox carteri", tier=3,
          clue="a hollow rolling ball of cells — one of life's first colonies")),
      C("Streptophytes", "Streptophyta", 850,
        T("Stonewort", "Chara vulgaris", tier=3, clue="a pond alga that is closer to an oak than to seaweed"),
        LAND_PLANTS)),
    gloss="everything descended from the cell that swallowed a cyanobacterium")
