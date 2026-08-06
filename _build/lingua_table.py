# -*- coding: utf-8 -*-
"""
lingua_table.py — the authored metadata behind the LINGUAGUESSR expansion.

Consumed by _build/gen_lingua2.py. Nothing here is a text sample: every passage
in the shipped file comes verbatim from the UDHR corpus. What is authored here is
the metadata a player is shown *after* the reveal, plus the three escalating
hints:

    hint 0  the SCRIPT tell     — computed from the characters actually present
    hint 1  the FAMILY + REGION — derived from `family` and countries.js
    hint 2  the NEAR-GIVEAWAY   — authored per language, one clause

    LANGS[key] = (display name, family, [ISO2 answers], speakers, near-hint
                  [, hint1 override])

`key` is ISO 639-3, with a script suffix where one language appears in two
scripts. FILE maps a key to its UDHR corpus file code where the two differ.

RULES FOLLOWED
  * `countries` lists everywhere the language is official, co-official, or the
    majority everyday language of a substantial population. Any of them counts as
    a correct answer and gets a passport stamp, so a wrong entry is a bug.
  * Speaker counts are order-of-magnitude estimates (L1, or L1+L2 for
    standardised lects). They only drive the difficulty par, never the answer.
  * No hint may name any country, capital or demonym — gen_lingua2.py enforces
    this against countries.js and drops any language that breaks it.
  * Where a language's own status is contested or its speaker base uncertain, the
    hint is written to avoid the claim rather than guess.
"""

# ---------------------------------------------------------------------------
# SCRIPTS: ISO 15924 code -> (label shown after the reveal, default script tell)
# ---------------------------------------------------------------------------

SCRIPTS = {
    'Latn': ('Latin', 'The Latin alphabet.'),
    'Cyrl': ('Cyrillic', 'Cyrillic — but not the commonest inventory: watch for letters the biggest Cyrillic language does not have.'),
    'Arab': ('Arabic', 'Arabic script, right to left.'),
    'Deva': ('Devanagari', 'Devanagari: a horizontal head-line runs across the top of every word and the letters hang beneath it.'),
    'Beng': ('Bengali-Assamese', 'Bengali-Assamese script: a head-line like Devanagari, but the letters are rounder and end in hooks.'),
    'Guru': ('Gurmukhi', 'Gurmukhi: a head-line, and squarer, sparser letters than Devanagari.'),
    'Gujr': ('Gujarati', 'Gujarati: Devanagari with the head-line cut off, so the letters float free.'),
    'Orya': ('Odia', 'Odia: almost every letter is topped with a fat umbrella-like curve.'),
    'Taml': ('Tamil', 'Tamil: wide, looping, sparse letters with very few conjuncts and no head-line.'),
    'Telu': ('Telugu', 'Telugu: round letters, each with a tick or check-mark on top.'),
    'Knda': ('Kannada', 'Kannada: like Telugu but the top-marks are flatter and the bowls more angular.'),
    'Mlym': ('Malayalam', 'Malayalam: dense loops and curls, the most circular of the Indic scripts.'),
    'Sinh': ('Sinhala', 'Sinhala: very round, spiral-heavy letters with long ascending tails.'),
    'Thai': ('Thai', 'Thai: no spaces between words, loops on the letters, and vowel marks above and below.'),
    'Laoo': ('Lao', 'Lao: like Thai but rounder and with a smaller letter inventory, and no spaces between words.'),
    'Khmr': ('Khmer', 'Khmer: tall, spiky letters with subscript consonants tucked underneath, and no spaces between words.'),
    'Mymr': ('Myanmar', 'Myanmar script: circles and part-circles, as if written with a compass.'),
    'Tibt': ('Tibetan', 'Tibetan: a head-line, stacked consonants, and a vertical stroke ། ending each phrase.'),
    'Lana': ('Tai Tham', 'Tai Tham, an old Southeast Asian script: rounded letters stacked vertically, unlike the Thai you see on signs.'),
    'Tavt': ('Tai Viet', 'Tai Viet: a small, angular Southeast Asian alphabet, nothing like the Thai or Lao you see on signs.'),
    'Cakm': ('Chakma', 'Chakma: a Brahmic script of the eastern hills, with rounded letters and a slanting head-line.'),
    'Java': ('Javanese', 'Javanese script: rounded letters hanging from a line, with tails dropping below.'),
    'Hebr': ('Hebrew', 'Hebrew square script, right to left, with no written vowels in ordinary print.'),
    'Syrc': ('Syriac', 'Syriac: a flowing right-to-left cursive, older than Arabic and joined differently.'),
    'Thaa': ('Thaana', 'Thaana: right to left, but the consonants look invented rather than inherited and every one carries a vowel mark.'),
    'Adlm': ('Adlam', 'Adlam: a right-to-left alphabet invented in the twentieth century for a West African language.'),
    'Nkoo': ('N’Ko', 'N’Ko: a right-to-left West African alphabet with tone marks over every vowel.'),
    'Ethi': ('Ethiopic', 'Ethiopic syllabary: each character is a consonant plus a vowel, marked by little legs and loops.'),
    'Tfng': ('Tifinagh', 'Tifinagh: circles, dots, crosses and lines — it looks more like a code than an alphabet.'),
    'Vaii': ('Vai', 'Vai: a West African syllabary of a couple of hundred distinct signs, invented locally.'),
    'Grek': ('Greek', 'The Greek alphabet.'),
    'Armn': ('Armenian', 'Armenian: hooks and loops all of a similar height, with its own full stop ։.'),
    'Geor': ('Georgian', 'Georgian Mkhedruli: rounded letters with no capitals at all and long descenders.'),
    'Hans': ('Han (Simplified)', 'Simplified Chinese characters: no alphabet at all, and the forms are reduced rather than traditional.'),
    'Hant': ('Han (Traditional)', 'Traditional Chinese characters, with the full unreduced forms.'),
    'Hani': ('Han', 'Chinese characters, written with the traditional unreduced forms.'),
    'Jpan': ('Japanese', 'Chinese characters interleaved with two syllabaries — one angular, one cursive.'),
    'Kore': ('Hangul', 'Hangul: syllable blocks built from a few simple strokes, with circles and squares.'),
    'Hang': ('Hangul', 'Hangul: syllable blocks built from a few simple strokes, with circles and squares.'),
    'Mong': ('Mongolian', 'Written top to bottom in columns running left to right, a vertical spine with teeth.'),
    'Cans': ('Canadian Aboriginal syllabics', 'Canadian syllabics: triangles, hooks and chevrons that rotate to change the vowel.'),
    'Cher': ('Cherokee', 'Cherokee syllabary: letters that look borrowed from the Latin and Greek alphabets but sound nothing like them.'),
    'Yiii': ('Yi', 'Yi syllabary: over a thousand angular signs, each a whole syllable, all the same size.'),
    'Gran': ('Grantha', 'Grantha, a South Indian liturgical script: rounded letters with a head-line, used for a classical language.'),
    'Div': ('Thaana', 'Thaana, right to left, with a vowel mark on every consonant.'),
}

# per-language override of the human script label
SCRIPT_OVERRIDE = {
    'prs': 'Arabic (Perso-Arabic)',
    'zlm_arab': 'Arabic (Jawi)',
    'pnb': 'Arabic (Shahmukhi)',
    'skr': 'Arabic (Shahmukhi)',
    'lad': 'Latin (Judaeo-Spanish)',
    'san_gran': 'Grantha',
}

# key -> UDHR corpus file code, where they differ
FILE = {
    'gsw': 'gsw1', 'rup': 'rmy', 'bjn': '049', 'bum': 'btb', 'cri': '007',
    'pov': 'pov', 'dbr': '064', 'gex': '065', 'jii': '066', 'ymm': '057',
    'gej': 'hna', 'guk': '027', 'kbr': '028', 'sid': '029', 'kab': '071',
    'jam': '055', 'acf': '056', 'mfe': '052', 'mwl': '044', 'smn': '060',
    'sms': '061', 'mas': '045', 'abs': '047', 'pmy': '046', 'dje': '043',
    'zyb': 'ccx', 'hnj': 'blu', 'duu': '020', 'azb': '032', 'lvs': '041',
    'fry': 'fri', 'oci': 'prv', 'frp': 'oci_1', 'rgn': 'eml', 'cfm': 'flm',
    'twi': 'aka_asante', 'fat': 'aka_fante', 'zlm_latn': 'mly_latn',
    'zlm_arab': 'mly_arab', 'bos_latn': 'bos_latn', 'bos_cyrl': 'bos_cyrl',
    'tuk_latn': 'tuk_latn', 'tuk_cyrl': 'tuk_cyrl', 'uzn_latn': 'uzn_latn',
    'uzn_cyrl': 'uzn_cyrl', 'gaz': 'gax', 'quh': 'qxa', 'que': 'qud',
    'tso': 'tso_MZ', 'nya': 'nya_chechewa', 'tzo': 'tzc', 'hus': 'hus',
    'san_gran': 'san_gran', 'lat': 'lat', 'ktu': 'ktu', 'kng': 'kng',
    'cjk': 'cjk', 'kmb': 'kmb', 'umb': 'umb', 'min': 'min', 'cat': 'cat',
    'hau': 'hau_3', 'mri': 'mri', 'sme': 'sme', 'ven': 'ven', 'acu': 'acu',
}

# ---------------------------------------------------------------------------
# the Latin-script tell, computed from what is actually on the screen
# ---------------------------------------------------------------------------
# Ordered rules: the first whose characters appear in the passage wins. This is
# the honest version of a script hint for a 300-language Latin pool — telling a
# player "it's the Latin alphabet" 300 times is not a hint, but telling them
# "ɛ ɔ ŋ, the African reference alphabet" is.

LATIN_RULES = [
    ('ǃǀǂǁ', 'Latin plus click letters — ǃ ǀ ǂ — used for sounds no European language has.'),
    ('ɛɔŋɖƴɓɗƐƆŊ', 'Latin extended with the African reference alphabet: open vowels ɛ ɔ and the eng ŋ.'),
    ('ẹọịụṣ', 'Latin with dots UNDER the vowels, marking a second set of vowel qualities.'),
    ('ăâîșț', 'Latin with a breve, a circumflex and comma-below letters ș ț.'),
    ('ąęłżśćń', 'Latin with a hook-below (ogonek), a slashed l and an acute on the consonants.'),
    ('ěščřžůťďň', 'Latin with the háček wedge ˇ on the consonants and a ring above the u.'),
    ('őűäöü', 'Latin with umlauts and, where you see them, long-double acutes ő ű.'),
    ('åæøéð', 'Latin with a ring-above å and the crossed d or slashed o of the north.'),
    ('þð', 'Latin still carrying the two Old English letters þ and ð.'),
    ('ãõçâê', 'Latin with tildes on the vowels and a cedilla under the c.'),
    ('ıİğş', 'Latin with a dotless ı, a breve g and a cedilla s.'),
    ('ơưăđ', 'Latin with horned vowels ơ ư and a barred d, and tone marks stacked on top.'),
    ('ʻ‘’', 'Latin with a glottal-stop mark written as a raised comma between vowels.'),
    ('āēīōū', 'Latin with macrons — long bars over the vowels — and no other diacritics.'),
    ('ñ', 'Latin with an ñ and acute accents, and nothing more exotic.'),
    ('ʼ', 'Latin with an apostrophe used as a consonant, not as punctuation.'),
]

LATIN_PLAIN = 'The plain Latin alphabet, with no letter English does not have.'


def script_tell(key, sc, chars, family, default):
    """hint 0. For Latin the tell is which non-English letters are on the screen;
    for everything else the script itself is the tell."""
    if sc != 'Latn':
        return default
    hit = None
    for cs, tell in LATIN_RULES:
        if any(ch in chars for ch in cs):
            hit = tell
            break
    if hit is None:
        hit = LATIN_PLAIN
    seen = [ch for ch in chars if ch.isalpha() or ch in 'ʻʼ']
    if seen:
        hit += ' Here: ' + ' '.join(seen[:12]) + '.'
    return hit


# ---------------------------------------------------------------------------
# THE LANGUAGE TABLE
# ---------------------------------------------------------------------------

LANGS = {}

# ── Romance near-neighbours ────────────────────────────────────────────────
# The discrimination IS the game, so the pool leans hard on languages that look
# like each other. No hint may name a country, so the geography is written in
# rivers, mountains and coastlines.
LANGS.update({
    'cat': ('Catalan', 'Indo-European > Romance', ['AD', 'ES'], 10000000,
            'The only official language of a tiny Pyrenean principality, and co-official along a stretch of Mediterranean coast to its south.'),
    'glg': ('Galician', 'Indo-European > Romance', ['ES'], 2400000,
            'The rainy Atlantic corner north of a Portuguese-speaking neighbour, and much closer to that neighbour than to the state language.'),
    'ast': ('Asturian', 'Indo-European > Romance', ['ES'], 500000,
            'A coal-and-cider region on the Bay of Biscay; the plural -es and the definite article "el" survive from before the standard language flattened them.'),
    'oci': ('Occitan', 'Indo-European > Romance', ['FR'], 500000,
            'The language of the troubadours, spoken across the whole southern third of a large republic north of the Pyrenees.'),
    'frp': ('Francoprovençal', 'Indo-European > Romance', ['CH', 'FR', 'IT'], 200000,
            'A mountain language of the western Alps, split between three states and called Arpitan by its revivalists.'),
    'cos': ('Corsican', 'Indo-European > Romance', ['FR'], 150000,
            'A Mediterranean island governed from the north but linguistically Tuscan, so it reads almost like the language across the water.'),
    'src': ('Sardinian (Logudorese)', 'Indo-European > Romance', ['IT'], 1000000,
            'The most conservative Romance language alive: on this island Latin\'s hard c survived, so "centum" is still said with a k.'),
    'fur': ('Friulian', 'Indo-European > Romance', ['IT'], 600000,
            'The north-eastern corner above the Adriatic, where Romance meets Slavic and German; not a dialect of the state language but a separate Rhaeto-Romance branch.'),
    'lld': ('Ladin', 'Indo-European > Romance', ['IT'], 30000,
            'Five Dolomite valleys, each with its own spelling of the same language, in a province that is otherwise German-speaking.'),
    'roh': ('Romansh', 'Indo-European > Romance', ['CH'], 40000,
            'The fourth national language of an Alpine federation, spoken in one south-eastern canton and standardised only in the twentieth century.'),
    'vec': ('Venetian', 'Indo-European > Romance', ['IT'], 4000000,
            'The lagoon city\'s old trading language, which once ran the eastern Adriatic and still drops final vowels everywhere.'),
    'lij': ('Ligurian', 'Indo-European > Romance', ['IT'], 500000,
            'The narrow strip of Riviera behind a great medieval port; its x is pronounced like a French j.'),
    'rgn': ('Romagnol', 'Indo-European > Romance', ['IT'], 400000,
            'The Adriatic flank of the Po valley, with vowels so reduced that words shrink to almost nothing.'),
    'mwl': ('Mirandese', 'Indo-European > Romance', ['PT'], 15000,
            'Three villages on a high plateau on the eastern border, whose language is officially recognised and is closer to Asturian than to the state language.'),
    'pcd': ('Picard', 'Indo-European > Romance', ['FR', 'BE'], 700000,
            'The coalfield and beet country between the Somme and the Scheldt; ch where the standard has c, so "chien" becomes "kien".'),
    'wln': ('Walloon', 'Indo-European > Romance', ['BE'], 600000,
            'The southern half of a small bilingual kingdom, where the Romance side is not the standard Paris language at all.'),
    'lat': ('Latin', 'Indo-European > Italic', ['VA'], 1000,
            'Still the official language of the smallest sovereign state on earth, and the ancestor of every other language in this branch.'),
    'lad': ('Ladino (Judaeo-Spanish)', 'Indo-European > Romance', ['TR', 'IL'], 100000,
            'Fifteenth-century Iberian Romance carried east by expelled Sephardic Jews and preserved in Ottoman port cities.'),
    'rup': ('Aromanian', 'Indo-European > Romance', ['MK', 'AL', 'GR'], 250000,
            'A Romance language stranded deep in the Balkans among Slavic and Greek speakers, and the closest living relative of Romanian.'),
    'kea': ('Kabuverdianu', 'Creole > Portuguese-based', ['CV'], 900000,
            'A creole spoken by everyone on a dry Atlantic archipelago off the westernmost cape of Africa.'),
    'pov': ('Guinea-Bissau Creole', 'Creole > Portuguese-based', ['GW', 'SN'], 1500000,
            'The lingua franca of a small coastal country of rivers and mangroves, whose official language nobody speaks at home.'),
    'cri': ('Sãotomense', 'Creole > Portuguese-based', ['ST'], 70000,
            'A creole of two equatorial cocoa islands in the Gulf of Guinea.'),
    'pap': ('Papiamento', 'Creole > Iberian-based', ['AW', 'CW'], 300000,
            'A creole of three dry Caribbean islands off the Venezuelan coast, blending Iberian, Dutch and African, and written with k and s where Spanish uses c.'),
    'mfe': ('Mauritian Creole', 'Creole > French-based', ['MU'], 1200000,
            'A French-based creole spoken by almost everyone on a sugar island in the western Indian Ocean.'),
    'crs': ('Seychellois Creole', 'Creole > French-based', ['SC'], 100000,
            'A French-based creole and one of three official languages on a granite archipelago north of the sugar islands.'),
    'acf': ('Saint Lucian Creole', 'Creole > French-based', ['LC', 'DM'], 400000,
            'A French-based creole spoken on two mountainous Windward islands whose official language is English.'),
    'gcr': ('Guianese Creole', 'Creole > French-based', ['GF'], 250000,
            'A French-based creole of the South American mainland, in a territory that is legally part of a European state.'),
})

# ── Germanic near-neighbours ───────────────────────────────────────────────
LANGS.update({
    'swe': ('Swedish', 'Indo-European > Germanic', ['SE', 'FI'], 13000000,
            'Two official languages, one of them here: a long Baltic kingdom, plus minority status in the country to its east.'),
    'nob': ('Norwegian (Bokmål)', 'Indo-European > Germanic', ['NO'], 5000000,
            'The majority written standard of a fjord country that has two of them, and the one closest to Danish.'),
    'nno': ('Norwegian (Nynorsk)', 'Indo-European > Germanic', ['NO'], 600000,
            'The minority written standard of the same fjord country, built in the nineteenth century out of rural western dialects.'),
    'fao': ('Faroese', 'Indo-European > Germanic', ['FO'], 70000,
            'Eighteen windy North Atlantic islands halfway to Iceland, self-governing under a Nordic kingdom.'),
    'fry': ('West Frisian', 'Indo-European > Germanic', ['NL'], 500000,
            'The northern province of a low-lying kingdom; the closest living relative of English, though it does not look it.'),
    'nds': ('Low Saxon', 'Indo-European > Germanic', ['DE', 'NL'], 5000000,
            'The old Hanseatic trade language of the north German plain, which never went through the High German consonant shift.'),
    'ltz': ('Luxembourgish', 'Indo-European > Germanic', ['LU'], 400000,
            'The national language of a grand duchy that also runs its government in French and German.'),
    'gsw': ('Alsatian (Alemannic)', 'Indo-European > Germanic', ['FR', 'CH', 'DE'], 1000000,
            'An Alemannic dialect of the upper Rhine plain, in a region that has changed states four times in a century.'),
    'sco': ('Scots', 'Indo-European > Germanic', ['GB'], 1500000,
            'A Germanic language of the northern half of a large island, with "ken" for know and "bairn" for child.'),
    'eng': ('English', 'Indo-European > Germanic', ['GB', 'US', 'AU', 'NZ', 'CA', 'IE'], 1500000000,
            'You are reading it.'),
})

# ── Celtic ─────────────────────────────────────────────────────────────────
LANGS.update({
    'gla': ('Scottish Gaelic', 'Indo-European > Celtic', ['GB'], 60000,
            'A Goidelic language of north-western islands and highlands, with "bh" and "mh" doing the work of a v.'),
    'bre': ('Breton', 'Indo-European > Celtic', ['FR'], 200000,
            'A Brittonic language carried back across the Channel to a granite peninsula, so it is a cousin of Welsh, not of Irish.'),
    'glv': ('Manx', 'Indo-European > Celtic', ['IM'], 2000,
            'A Goidelic language of one small island in the middle of the Irish Sea, declared extinct and then revived.'),
})

# ── Slavic and Baltic near-neighbours ──────────────────────────────────────
LANGS.update({
    'slv': ('Slovenian', 'Indo-European > Slavic', ['SI'], 2500000,
            'A small Alpine-to-Adriatic state; the language kept the dual number, so it has a separate form for exactly two of anything.'),
    'hsb': ('Upper Sorbian', 'Indo-European > Slavic', ['DE'], 20000,
            'A Slavic island surrounded by German speakers in the east of a large federal republic, Catholic and still bilingually signposted.'),
    'bos_latn': ('Bosnian (Latin)', 'Indo-European > Slavic', ['BA'], 3000000,
            'A Balkan state whose language is written in both alphabets; this is the Latin one.'),
    'bos_cyrl': ('Bosnian (Cyrillic)', 'Indo-European > Slavic', ['BA'], 3000000,
            'The same Balkan language as its Latin twin, in the other alphabet it is officially written in.'),
    'cnr': ('Montenegrin', 'Indo-European > Slavic', ['ME'], 250000,
            'The smallest of the four standards of one Balkan language, in a mountainous state on the Adriatic that uses the euro without permission.'),
    'lvs': ('Latvian', 'Indo-European > Baltic', ['LV'], 1500000,
            'One of only two surviving Baltic languages, in the middle of the three states on that sea, with long marks over the vowels.'),
})

# ── Uralic ─────────────────────────────────────────────────────────────────
LANGS.update({
    'krl': ('Karelian', 'Uralic > Finnic', ['RU', 'FI'], 30000,
            'A Finnic language of the lake-and-forest belt east of the border, where the folk epic was collected.'),
    'vep': ('Veps', 'Uralic > Finnic', ['RU'], 3000,
            'A tiny Finnic language spoken between three great lakes north-east of the Baltic.'),
    'fkv': ('Kven', 'Uralic > Finnic', ['NO'], 3000,
            'A Finnic language of the far Arctic coast, recognised as a minority language by the kingdom it sits in.'),
    'smn': ('Inari Saami', 'Uralic > Saami', ['FI'], 400,
            'One of nine Saami languages, spoken around a single large lake above the Arctic Circle.'),
    'sms': ('Skolt Saami', 'Uralic > Saami', ['FI', 'RU'], 300,
            'A Saami language whose speakers were resettled after the war; it uses the wedge letters č ǧ ǩ ž.'),
    'sme': ('North Saami', 'Uralic > Saami', ['NO', 'SE', 'FI'], 25000,
            'The largest Saami language, spoken across the top of three Nordic states with reindeer herding vocabulary nobody else needs.'),
})

# ── other Europe and the Caucasus ──────────────────────────────────────────
LANGS.update({
    'gag': ('Gagauz', 'Turkic > Oghuz', ['MD'], 150000,
            'A Turkic language whose speakers are Orthodox Christians, in an autonomous region of a small landlocked wine country.'),
    'crh': ('Crimean Tatar', 'Turkic > Kipchak', ['UA'], 500000,
            'A Turkic language of a Black Sea peninsula, whose speakers were deported en masse in 1944 and returned decades later.'),
    'rmn': ('Balkan Romani', 'Indo-European > Indo-Aryan', ['MK', 'RS', 'BG'], 700000,
            'An Indo-Aryan language spoken across the Balkans by people who left north-west India a thousand years ago.'),
    'tly': ('Talysh', 'Indo-European > Iranian', ['AZ', 'IR'], 900000,
            'An Iranian language of the humid Caspian lowlands, split by a border between two states.'),
    'abk': ('Abkhaz', 'Northwest Caucasian', ['GE'], 100000,
            'A Caucasian language with dozens of consonants and only two basic vowels, in a breakaway Black Sea region.'),
    'oss': ('Ossetian', 'Indo-European > Iranian', ['GE', 'RU'], 500000,
            'The last language of the Scythian-Sarmatian branch, spoken on both slopes of the central Caucasus.'),
    'ady': ('Adyghe', 'Northwest Caucasian', ['RU'], 500000,
            'A Circassian language of the north-west Caucasus, with a huge consonant inventory and a large diaspora in Turkey and Jordan.'),
    'kbd': ('Kabardian', 'Northwest Caucasian', ['RU'], 500000,
            'The eastern Circassian language, in a republic named after two peoples, on the northern slopes of the highest peak in Europe.'),
})
