# -*- coding: utf-8 -*-
"""GENERAL pack, boards 11-20 (difficulty 3). Consumed by gen_connections.py."""

BOARDS = [

{
 "title": "Full English",
 "diff": 3,
 "groups": [
   {"name": "ON A FULL ENGLISH PLATE", "tiles": ["BACON", "BLACK PUDDING", "BAKED BEANS", "HASH BROWN"],
    "note": "The immovable four, plus egg, sausage, mushrooms, grilled tomato and whatever your café thinks it's doing."},
   {"name": "BRITISH FOR 'EXCELLENT'", "tiles": ["CRACKING", "SMASHING", "BRILLIANT", "TOP-NOTCH"],
    "note": "Three of them describe breaking something. English praise has always had a violent streak."},
   {"name": "COCKNEY RHYMING SLANG FOR BODY PARTS", "tiles": ["PLATES OF MEAT", "BOAT RACE", "MINCE PIES", "LOAF OF BREAD"],
    "note": "Feet, face, eyes, head — and 'use your loaf' is the only one that escaped into general English."},
   {"name": "___ FAST", "tiles": ["BREAK", "HOLD", "STEAD", "BEL"],
    "note": "Breakfast, holdfast, steadfast — and Belfast, which sneaks in on sound alone."},
 ],
 "traps": [
   ["LOAF OF BREAD", 0, "A loaf of bread is food, sitting next to a plate of food. It is a head."],
 ],
 "epilogue": "Two food groups and one of them isn't food. LOAF OF BREAD is the pivot: put it on the plate and the rhyming slang is a body part short, which is a sentence with an unfortunate double meaning.",
},

{
 "title": "Elements of Style",
 "diff": 3,
 "groups": [
   {"name": "NOBLE GASES", "tiles": ["HELIUM", "NEON", "ARGON", "XENON"],
    "note": "Argon means 'lazy', xenon means 'stranger', neon means 'new'. Ramsay named most of them and was clearly having fun."},
   {"name": "SUPERMAN LORE", "tiles": ["KRYPTONITE", "METROPOLIS", "LOIS LANE", "DAILY PLANET"],
    "note": "Krypton the planet is named after krypton the noble gas, discovered in 1898 and meaning 'hidden'."},
   {"name": "ELEMENTS NAMED AFTER PLACES", "tiles": ["POLONIUM", "FRANCIUM", "GERMANIUM", "AMERICIUM"],
    "note": "Marie Curie named polonium for a Poland that did not exist on any map in 1898. It was a political act with a chemistry paper attached."},
   {"name": "___ SIGN", "tiles": ["PLUS", "PEACE", "STOP", "DOLLAR"],
    "note": "Plus sign, peace sign, stop sign, dollar sign — a maths symbol, a hand shape, an octagon and a currency."},
 ],
 "traps": [
   ["NEON", 3, "A neon sign is the most famous thing neon has ever done, and this arcade is lit by them."],
 ],
 "epilogue": "The noble gases and the place-name elements are both periodic-table groups, which is the misdirection — but no noble gas here is named for a place, and nothing in the other four is a gas. NEON is the only tile with a foot in two worlds.",
},

{
 "title": "Star Turn",
 "diff": 3,
 "groups": [
   {"name": "ZODIAC SIGNS", "tiles": ["LIBRA", "VIRGO", "ARIES", "GEMINI"],
    "note": "Libra is the only zodiac sign that isn't an animal or a person — it's a set of scales."},
   {"name": "CONSTELLATIONS OUTSIDE THE ZODIAC", "tiles": ["ORION", "CASSIOPEIA", "URSA MAJOR", "LYRA"],
    "note": "Cassiopeia was chained to her throne upside down as a punishment for vanity, which is the most Greek sentence available."},
   {"name": "GALILEAN MOONS OF JUPITER", "tiles": ["IO", "EUROPA", "GANYMEDE", "CALLISTO"],
    "note": "Galileo spotted all four in January 1610 and proved not everything orbits us. Ganymede is bigger than Mercury."},
   {"name": "___ STRUCK", "tiles": ["STAR", "THUNDER", "MOON", "AWE"],
    "note": "Starstruck, thunderstruck, moonstruck, awestruck. Every one of them is a way of saying you stopped thinking."},
 ],
 "traps": [
   ["MOON", 2, "MOON in a board with a moons-of-Jupiter group is the most obvious bait on offer. It is a compound word here, nothing more."],
 ],
 "epilogue": "Every zodiac sign is also a constellation, which is why the second group had to say 'outside the zodiac' out loud. The only genuinely loose tile is MOON, and IO, EUROPA, GANYMEDE and CALLISTO were never going to make room.",
},

{
 "title": "Green Room",
 "diff": 3,
 "groups": [
   {"name": "SHADES OF GREEN", "tiles": ["OLIVE", "EMERALD", "JADE", "SAGE"],
    "note": "Three of them are named after a stone, a fruit and a herb. Colour naming has never had an original idea."},
   {"name": "HERBS", "tiles": ["BASIL", "THYME", "OREGANO", "TARRAGON"],
    "note": "Oregano and marjoram are the same genus; tarragon is a relative of wormwood, which explains a lot about tarragon."},
   {"name": "GEMSTONES", "tiles": ["GARNET", "TOPAZ", "OPAL", "AMETHYST"],
    "note": "Amethyst means 'not drunk' — the Greeks believed the stone would keep you sober. It does not."},
   {"name": "___ HOUSE", "tiles": ["GREEN", "LIGHT", "FARM", "WARE"],
    "note": "Greenhouse, lighthouse, farmhouse, warehouse. One grows things, one saves lives, two store things."},
 ],
 "traps": [
   ["SAGE", 1, "Sage is a herb first and a colour second, and the herb group is right there."],
   ["EMERALD", 2, "An emerald is a gemstone before it is a shade, and the gemstone group is right there too."],
   ["JADE", 2, "Same problem as emerald: jade is a mineral you can hold."],
   ["GREEN", 0, "GREEN in a board with a shades-of-green group is almost rude."],
 ],
 "epilogue": "Four separate tiles want to defect and none of them can, because BASIL, THYME, OREGANO, GARNET, TOPAZ, OPAL and AMETHYST have no second passport at all. Fill the groups that have no choices first and the colours are whatever survives.",
},

{
 "title": "Small Talk",
 "diff": 3,
 "groups": [
   {"name": "WORDS MEANING TINY", "tiles": ["PETITE", "SLIGHT", "WEE", "MINUTE"],
    "note": "MY-newt, not MIN-it. Same spelling, different word, different Latin root — and the whole reason this board exists."},
   {"name": "UNITS OF TIME", "tiles": ["SECOND", "FORTNIGHT", "DECADE", "MILLENNIUM"],
    "note": "Fortnight is 'fourteen nights' worn down by seven centuries of use, and Americans have never adopted it."},
   {"name": "A BRIEF MOMENT, INFORMALLY", "tiles": ["JIFFY", "TICK", "FLASH", "HEARTBEAT"],
    "note": "A jiffy is genuinely a unit in physics and electronics — anywhere from a millisecond to the time light takes to cross a fermi."},
   {"name": "___ GLASS", "tiles": ["HOUR", "SPY", "PLEXI", "LOOKING"],
    "note": "Hourglass, spyglass, plexiglass, looking glass. Two for seeing far, one for seeing yourself, one for seeing time run out."},
 ],
 "traps": [
   ["MINUTE", 1, "A minute is the second-most obvious unit of time in the English language, and it is spelled exactly like the word for tiny."],
   ["HOUR", 1, "HOUR is a unit of time sitting in a board with a units-of-time group. It's here for the glass."],
 ],
 "epilogue": "MINUTE and HOUR both look like clock parts and neither one is. Notice that SECOND, FORTNIGHT, DECADE and MILLENNIUM already make four, and the rest of the board unlocks in about a second.",
},

{
 "title": "Say That Again",
 "diff": 3,
 "groups": [
   {"name": "PALINDROMES", "tiles": ["CIVIC", "RADAR", "MADAM", "KAYAK"],
    "note": "Radar is an acronym that happens to read the same both ways, which its inventors did not plan and have never stopped being asked about."},
   {"name": "NO VOWEL LETTERS", "tiles": ["RHYTHM", "CRYPT", "LYNX", "GYPSY"],
    "note": "Y is doing all the work in three of these and none of it in the fourth."},
   {"name": "CONTAIN ALL FIVE VOWELS", "tiles": ["SEQUOIA", "FACETIOUS", "EDUCATION", "DIALOGUE"],
    "note": "FACETIOUS has them in order, A-E-I-O-U, which is the only reason anybody remembers the word."},
   {"name": "THEIR OWN OPPOSITE", "tiles": ["CLEAVE", "SANCTION", "DUST", "OVERSIGHT"],
    "note": "Cleave together or apart, sanction it or ban it, dust a cake or a shelf, oversight as care or as failure. Contronyms — English arguing with itself."},
 ],
 "traps": [],
 "epilogue": "A rare board with no double agents: every tile qualifies for exactly one group and the difficulty is entirely in noticing what the groups are. If the purple took you a while, that's the intended shape — the connection is a property of the word, not of the thing.",
},

{
 "title": "Menu Reading",
 "diff": 3,
 "groups": [
   {"name": "WAYS TO SERVE EGGS", "tiles": ["POACHED", "SCRAMBLED", "CODDLED", "OVER EASY"],
    "note": "Coddled means barely set in a lidded pot in gentle water — the technique that gave us the verb for spoiling someone."},
   {"name": "FRENCH MOTHER SAUCES", "tiles": ["BÉCHAMEL", "VELOUTÉ", "ESPAGNOLE", "HOLLANDAISE"],
    "note": "Carême named four; Escoffier added tomate and made it five. Every classical French sauce is a child of one of them."},
   {"name": "PROTECTED-ORIGIN CHEESES", "tiles": ["ROQUEFORT", "MANCHEGO", "STILTON", "GRUYÈRE"],
    "note": "Stilton's protection is famously strict — it cannot legally be made in the village of Stilton, which is in the wrong county."},
   {"name": "___ WHITE", "tiles": ["EGG", "SNOW", "OFF", "BONE"],
    "note": "Egg white, snow white, off-white, bone white. Two are colours on a paint chart, one is a fairy tale, one is breakfast."},
 ],
 "traps": [
   ["EGG", 0, "There is an egg group on this board. EGG is not in it, and the temptation is enormous."],
 ],
 "epilogue": "The egg group is about methods, not ingredients — POACHED, SCRAMBLED, CODDLED and OVER EASY are all things you do, and EGG is a thing you have. Hollandaise, incidentally, is made of egg and belongs to France instead.",
},

{
 "title": "Island Life",
 "diff": 3,
 "groups": [
   {"name": "ISLAND COUNTRIES", "tiles": ["CYPRUS", "ICELAND", "FIJI", "JAMAICA"],
    "note": "Fiji is about 330 islands; Iceland is essentially one; Cyprus is one island and, unhappily, two administrations."},
   {"name": "GREEK ISLANDS", "tiles": ["CRETE", "RHODES", "NAXOS", "SANTORINI"],
    "note": "Santorini is the rim of a volcano that blew its own middle out around 1600 BC and possibly took Minoan Crete with it."},
   {"name": "FICTIONAL ISLANDS", "tiles": ["LILLIPUT", "ATLANTIS", "NEVERLAND", "AMITY"],
    "note": "Amity is the beach town in Jaws, whose mayor kept it open. Atlantis is Plato's, invented for an argument about hubris."},
   {"name": "ADD 'LAND' FOR A COUNTRY", "tiles": ["FIN", "IRE", "POL", "THAI"],
    "note": "Finland, Ireland, Poland, Thailand. ICE would have worked too, which is exactly why it's already spoken for."},
 ],
 "traps": [
   ["CYPRUS", 1, "Cyprus is Greek-speaking, Greek-cultured and in the eastern Mediterranean. It is also its own country, which the Greek islands are not."],
 ],
 "epilogue": "ICELAND is the joke: it is a genuine island country and it is also, letter for letter, ICE plus LAND. It sits in the group that needs it, and the purple has to make do with FIN, IRE, POL and THAI.",
},

{
 "title": "Money Talks",
 "diff": 3,
 "groups": [
   {"name": "CURRENCIES", "tiles": ["PESO", "DINAR", "RUPEE", "KRONA"],
    "note": "Dinar comes from the Roman denarius and rupee from Sanskrit rupya, 'wrought silver'. Money words travel further than money."},
   {"name": "SLANG FOR MONEY", "tiles": ["DOUGH", "BREAD", "QUID", "LOOT"],
    "note": "Dough and bread say the same thing twice: money is what you eat with."},
   {"name": "SQUARES ON A UK MONOPOLY BOARD", "tiles": ["MAYFAIR", "OLD KENT ROAD", "FREE PARKING", "WATER WORKS"],
    "note": "Mayfair costs £400 and Old Kent Road £60, a ratio London property has spent a century trying to beat."},
   {"name": "___ BANK", "tiles": ["BLOOD", "RIVER", "PIGGY", "DATA"],
    "note": "Blood bank, river bank, piggy bank, data bank. Only one of them holds money, and it's the pig."},
 ],
 "traps": [
   ["QUID", 0, "A quid IS a pound sterling, so it reads as a currency rather than as slang for one."],
 ],
 "epilogue": "QUID is the honest ambiguity here — it names a real currency the way 'buck' names the dollar. PESO, DINAR, RUPEE and KRONA are the four that appear on actual banknotes, and slang gets what's left.",
},

{
 "title": "Get a Grip",
 "diff": 3,
 "groups": [
   {"name": "KNOTS", "tiles": ["REEF", "BOWLINE", "CLOVE HITCH", "SHEEPSHANK"],
    "note": "The bowline is the one you can untie after it's been loaded; the reef knot is the one everybody ties and half of them tie as a granny."},
   {"name": "MARTIAL ARTS", "tiles": ["JUDO", "AIKIDO", "KARATE", "CAPOEIRA"],
    "note": "Capoeira was developed by enslaved Africans in Brazil and disguised as dance, which is why it is fought to music."},
   {"name": "YOGA POSES", "tiles": ["COBRA", "WARRIOR", "CHILD'S POSE", "DOWNWARD DOG"],
    "note": "Downward dog is adho mukha svanasana; the warrior is virabhadrasana, named for a rather angry avatar of Shiva."},
   {"name": "___ HOLD", "tiles": ["HOUSE", "STRONG", "FREE", "THRESH"],
    "note": "Household, stronghold, freehold, threshold. Three kinds of property and one doorway."},
 ],
 "traps": [
   ["WARRIOR", 1, "A pose called 'warrior' on a board with a martial-arts group is bait with a mat under it."],
 ],
 "epilogue": "Every group here is about grip, stance or holding on, so the categories blur by design. WARRIOR is the tile that reads as combat and isn't — JUDO, AIKIDO, KARATE and CAPOEIRA are the four that actually hit back.",
},

]
