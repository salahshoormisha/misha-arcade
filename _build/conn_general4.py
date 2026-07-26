# -*- coding: utf-8 -*-
"""GENERAL pack, boards 31-40 (difficulty 4-5) — the hard end of the archive."""

BOARDS = [

{
 "title": "Change of Address",
 "diff": 5,
 "groups": [
   {"name": "GREETINGS AROUND THE WORLD", "tiles": ["ALOHA", "CIAO", "SALAAM", "NAMASTE"],
    "note": "Aloha and ciao both mean hello AND goodbye; salaam and namaste are both blessings that got shortened into doorway small talk."},
   {"name": "EUROPEAN CAPITALS", "tiles": ["LISBON", "TALLINN", "ZAGREB", "VILNIUS"],
    "note": "Lisbon is older than Rome; Tallinn's old town survived the twentieth century almost intact, which almost nothing in the Baltics did."},
   {"name": "FOUR-LETTER COUNTRIES", "tiles": ["CHAD", "PERU", "IRAN", "LAOS"],
    "note": "There are seven or eight depending on how you count Cuba, Fiji, Mali and Togo. These four are the ones that fit."},
   {"name": "ANAGRAMS OF EUROPEAN CAPITALS", "tiles": ["MORE", "SOLO", "PAIRS", "HASTEN"],
    "note": "Rome, Oslo, Paris, Athens. Four ordinary English words hiding four capitals, none of which are the four capitals in the second group."},
 ],
 "traps": [
   ["LAOS", 3, "LAOS is an anagram of OSLO. It is also, unhelpfully, a four-letter country on a board that has a four-letter-country group."],
 ],
 "epilogue": "LAOS and SOLO are anagrams of the same capital, which is the trick: only one of them can sit in the purple, and LAOS has a day job. CHAD, PERU and IRAN aren't anagrams of anything European, so the countries need their fourth.",
},

{
 "title": "Elementary",
 "diff": 4,
 "groups": [
   {"name": "SHERLOCK HOLMES THINGS", "tiles": ["BAKER STREET", "DEERSTALKER", "MORIARTY", "WATSON"],
    "note": "Conan Doyle never wrote 'elementary, my dear Watson' and never described a deerstalker — the hat was Sidney Paget's idea in The Strand."},
   {"name": "FICTIONAL DETECTIVES", "tiles": ["POIROT", "MARPLE", "MAIGRET", "WIMSEY"],
    "note": "Christie got so tired of Poirot she called him a detestable little creature in her diary and kept writing him for another forty years."},
   {"name": "FAMOUS COMPUTERS", "tiles": ["DEEP BLUE", "HAL", "ALPHAGO", "ENIAC"],
    "note": "ENIAC in 1945 filled a room and weighed 27 tonnes; Deep Blue beat Kasparov in 1997; AlphaGo beat Lee Sedol in 2016 with a move no human would have played."},
   {"name": "___ HOUND", "tiles": ["GREY", "NEWS", "FOX", "WOLF"],
    "note": "Greyhound, newshound, foxhound, wolfhound. The Baskerville one is not on the list and you should be grateful."},
 ],
 "traps": [
   ["WATSON", 2, "IBM's Watson won Jeopardy! in 2011 and is one of the most famous computers ever built. It is named after IBM's first president, not the doctor."],
 ],
 "epilogue": "WATSON is a doctor and a computer, and both are famous enough to earn a seat. DEEP BLUE, HAL, ALPHAGO and ENIAC are already four machines, so the doctor goes back to Baker Street — which is where the deerstalker, incidentally, never actually was.",
},

{
 "title": "Kitchen Chemistry",
 "diff": 4,
 "groups": [
   {"name": "THINGS THAT RISE", "tiles": ["SOUFFLÉ", "TIDE", "SUN", "CURTAIN"],
    "note": "A soufflé rises because trapped water turns to steam, not because of anything magical. The curtain rises because someone pulls a rope."},
   {"name": "LEAVENING AGENTS", "tiles": ["YEAST", "BAKING SODA", "BAKING POWDER", "EGG WHITE"],
    "note": "Yeast is alive, baking soda needs an acid to react with, baking powder brings its own acid, and egg white just traps air and holds on."},
   {"name": "___ PROOF", "tiles": ["FOOL", "WATER", "BULLET", "FIRE"],
    "note": "Foolproof, waterproof, bulletproof, fireproof. In a bakery, 'proof' means letting the dough rise, which is a different word entirely."},
   {"name": "FRENCH COOKING TECHNIQUES", "tiles": ["SAUTÉ", "BLANCH", "FLAMBÉ", "JULIENNE"],
    "note": "Sauté means 'jumped', blanchir means 'to whiten', flamber means 'to flame'. Julienne is somebody's name and nobody is sure whose."},
 ],
 "traps": [
   ["YEAST", 0, "Yeast is the reason bread rises, so on a board with a things-that-rise group it is the first tile everybody reaches for."],
 ],
 "epilogue": "The joke is buried in the purple: to 'proof' dough is to let it rise, so the ___ PROOF group is thematically perfect and grammatically irrelevant. YEAST makes things rise rather than rising itself, and SOUFFLÉ, TIDE, SUN and CURTAIN do the rising in person.",
},

{
 "title": "Sound Alike",
 "diff": 5,
 "groups": [
   {"name": "HOMOPHONES OF NUMBERS", "tiles": ["WON", "TOO", "FOR", "ATE"],
    "note": "One, two, four, eight. English numbers collide with English grammar words more than any other language has the decency to allow."},
   {"name": "HOMOPHONES OF ANIMALS", "tiles": ["BARE", "DEAR", "HAIR", "YEW"],
    "note": "Bear, deer, hare, ewe. Three of them are things you'd find in an English wood and one is a churchyard tree that sounds like a sheep."},
   {"name": "HOMOPHONES OF WEATHER", "tiles": ["REIGN", "HALE", "SON", "DUE"],
    "note": "Rain, hail, sun, dew. 'Hale' as in hale and hearty — from the same root as 'whole', nothing to do with the ice."},
   {"name": "HOMOPHONES OF MUSICAL NOTES", "tiles": ["DOUGH", "RAY", "ME", "TEA"],
    "note": "Do, re, mi, ti. The solfège syllables come from the first lines of a Latin hymn to John the Baptist, which is a long way to go for a scale."},
 ],
 "traps": [
   ["RAY", 1, "A ray is an actual animal — it swims. This board's animal group wants homophones rather than the real thing, which is a very fine distinction at 11pm."],
 ],
 "epilogue": "Every tile is a homophone of something, so the categories are four different somethings — and the trap is that RAY is genuinely a fish, not merely a word that sounds like one. BARE, DEAR, HAIR and YEW are all one letter away from a mammal, and none of them is an animal itself.",
},

{
 "title": "State of Play",
 "diff": 5,
 "groups": [
   {"name": "US STATE CAPITALS", "tiles": ["ALBANY", "PIERRE", "SALEM", "AUSTIN"],
    "note": "Pierre, South Dakota has about 14,000 people and is the second-smallest state capital in the country."},
   {"name": "SHAKESPEARE'S ITALIAN SETTINGS", "tiles": ["VERONA", "VENICE", "PADUA", "MESSINA"],
    "note": "Verona for Romeo and Juliet, Venice for the Merchant and Othello, Padua for the Shrew, Messina for Much Ado. He never went to any of them."},
   {"name": "___ CITY", "tiles": ["KANSAS", "CARSON", "ATLANTIC", "SIOUX"],
    "note": "Kansas City is mostly in Missouri, Atlantic City is on an island, and Sioux City and Sioux Falls are in different states."},
   {"name": "___ ROCK", "tiles": ["PUNK", "PLYMOUTH", "BED", "SHAM"],
    "note": "Punk rock, Plymouth Rock, bedrock, shamrock. Only one of them is a plant and it isn't even a rock."},
 ],
 "traps": [
   ["CARSON", 0, "Carson City is the capital of Nevada. The tile just doesn't say 'City' out loud, which is the entire mechanism of this board."],
 ],
 "epilogue": "CARSON is a state capital wearing a compound word's clothes, and the only reason it can't be one here is that ALBANY, PIERRE, SALEM and AUSTIN already are four. KANSAS, ATLANTIC and SIOUX need a fourth city and Carson is the only one going.",
},

{
 "title": "Well Suited",
 "diff": 4,
 "groups": [
   {"name": "PARTS OF A SUIT JACKET", "tiles": ["LAPEL", "CUFF", "VENT", "LINING"],
    "note": "The vent is the slit at the back: none is Italian, one is American, two is English. Tailors will fight you about this."},
   {"name": "TYPES OF COLLAR", "tiles": ["MANDARIN", "PETER PAN", "BUTTON-DOWN", "SHAWL"],
    "note": "The button-down was invented for polo players so the collar wouldn't flap in their faces at a gallop."},
   {"name": "SUITS IN A TAROT DECK", "tiles": ["WANDS", "CUPS", "SWORDS", "PENTACLES"],
    "note": "Wands, cups, swords and pentacles map onto clubs, hearts, spades and diamonds — the tarot came first and the playing deck simplified it."},
   {"name": "___ LINK", "tiles": ["MISSING", "WEAK", "SAUSAGE", "CHAIN"],
    "note": "Missing link, weak link, sausage link, chain link. Two are metaphors, one is a fence, one is breakfast."},
 ],
 "traps": [
   ["CUFF", 3, "CUFFLINK is one word and one of the most obvious ___ LINK compounds there is. It is here as part of the jacket instead."],
 ],
 "epilogue": "Two different meanings of 'suit' share a board, which is the misdirection, and CUFF is the tile that actually moves. MISSING, WEAK, SAUSAGE and CHAIN are four links already, so the cuff stays sewn to the sleeve.",
},

{
 "title": "No Rhyme",
 "diff": 4,
 "groups": [
   {"name": "WORDS WITH NO PERFECT RHYME", "tiles": ["ORANGE", "SILVER", "PURPLE", "MONTH"],
    "note": "There is a hill in Wales called Blorenge and a Scrabble-legal word 'chilver', which is how determined people get about this."},
   {"name": "KINDS OF PUZZLE", "tiles": ["SUDOKU", "ANAGRAM", "REBUS", "ACROSTIC"],
    "note": "Sudoku is Japanese for 'the digits are limited to one occurrence', which is less catchy and more accurate."},
   {"name": "SPELLED ONLY WITH ROMAN NUMERALS", "tiles": ["MIX", "DIM", "MILD", "CIVIL"],
    "note": "Every letter is I, V, X, L, C, D or M. MIX is genuinely 1009 and DIM is genuinely 1499, which is a coincidence English did not plan."},
   {"name": "COUNTRIES HIDING INSIDE", "tiles": ["PIRANHA", "INCUBATE", "NORMALITY", "ROMANCE"],
    "note": "p-IRAN-ha, in-CUBA-te, nor-MALI-ty, r-OMAN-ce. Four countries in four words that have nothing to do with them."},
 ],
 "traps": [],
 "epilogue": "No double agents — this board is hard because two of the four categories are properties of the spelling rather than the meaning, and your brain keeps trying to sort by topic. MIX and DIM look like they belong with the puzzles until you notice what letters they are made of.",
},

{
 "title": "Crossed Wires",
 "diff": 5,
 "groups": [
   {"name": "TYPES OF CURRENT", "tiles": ["ALTERNATING", "DIRECT", "RIP", "EDDY"],
    "note": "Two are electrical and two are water. Eddy currents are actually both — loops of electricity induced in metal, named after the whirl in a river."},
   {"name": "PARTS OF A CIRCUIT", "tiles": ["RESISTOR", "CAPACITOR", "DIODE", "FUSE"],
    "note": "A fuse is a component designed to destroy itself, which is a rare and honourable job description."},
   {"name": "THINGS YOU BLOW", "tiles": ["WHISTLE", "KISS", "BUBBLE", "GASKET"],
    "note": "Blow a whistle, a kiss, a bubble, a gasket. Only one of them costs money to fix."},
   {"name": "___ WIRE", "tiles": ["HAY", "HIGH", "LIVE", "TRIP"],
    "note": "Haywire, high wire, live wire, tripwire. 'Haywire' comes from farm equipment repaired with baling wire until it stopped working entirely."},
 ],
 "traps": [
   ["FUSE", 2, "You blow a fuse — it's the original meaning of the phrase, and 'things you blow' is a group on this board."],
   ["LIVE", 0, "A live wire is carrying current, so LIVE reads as electrical rather than as half of a compound word."],
   ["TRIP", 1, "Circuit breakers trip. TRIP is as much a piece of electrical vocabulary as anything in the component group."],
 ],
 "epilogue": "Three tiles are pulling toward the mains and none of them can go: RESISTOR, CAPACITOR and DIODE need a fourth component, and WHISTLE, KISS and BUBBLE need a fourth thing to blow, and there is exactly one tile that can satisfy either. Blow a gasket, blow a fuse — only one of those is a component.",
},

{
 "title": "Full Circle",
 "diff": 5,
 "groups": [
   {"name": "PARTS OF A CIRCLE", "tiles": ["RADIUS", "CHORD", "ARC", "TANGENT"],
    "note": "A chord joins two points on the circle, an arc is the bit between them, a tangent touches at exactly one point and then leaves forever."},
   {"name": "MUSIC THEORY TERMS", "tiles": ["TRIAD", "CADENCE", "OCTAVE", "INTERVAL"],
    "note": "A triad is three notes stacked in thirds, a cadence is how a phrase lands, an octave is the interval so consonant we gave both notes the same name."},
   {"name": "TRIGONOMETRIC FUNCTIONS", "tiles": ["SINE", "COSINE", "COSECANT", "COTANGENT"],
    "note": "'Sine' is a mistranslation: Sanskrit jya became Arabic jiba, was misread as jaib meaning 'bay', and was rendered into Latin as sinus. The word means 'fold' by accident."},
   {"name": "___ POINT", "tiles": ["TURNING", "BOILING", "PIN", "VIEW"],
    "note": "Turning point, boiling point, pinpoint, viewpoint. Only one of them has a temperature."},
 ],
 "traps": [
   ["CHORD", 1, "A chord in music is three or more notes at once, and there is a music theory group on this board. Same spelling, unrelated word — the geometric one comes from Latin chorda, a string."],
   ["TANGENT", 2, "A tangent is a trigonometric function AND a line that touches a circle, and the function is named after the line. Both readings are correct."],
 ],
 "epilogue": "CHORD and TANGENT both have a completely legitimate second home, and both are trapped by counting: TRIAD, CADENCE, OCTAVE and INTERVAL are already four, and SINE, COSINE, COSECANT and COTANGENT are already four. RADIUS and ARC would be a very lonely group of two.",
},

{
 "title": "The Last Word",
 "diff": 5,
 "groups": [
   {"name": "SYNONYMS FOR 'END'", "tiles": ["FINALE", "CONCLUSION", "TERMINUS", "CLOSE"],
    "note": "Four different registers of the same idea: theatrical, logical, geographical and plain."},
   {"name": "AT A RAILWAY STATION", "tiles": ["PLATFORM", "SIGNAL BOX", "BUFFERS", "SLEEPER"],
    "note": "The buffers are the shock absorbers at the end of the line, which is why 'hit the buffers' means what it means."},
   {"name": "PARTS OF A PLAY", "tiles": ["ACT", "SCENE", "PROLOGUE", "EPILOGUE"],
    "note": "The prologue tells you what you're about to see and the epilogue tells you what it meant. Everything worth watching is in between."},
   {"name": "___ CURTAIN", "tiles": ["IRON", "SHOWER", "LACE", "FINAL"],
    "note": "Iron curtain, shower curtain, lace curtain, final curtain. The iron one in a theatre is a real fire barrier, which is where Churchill got the phrase."},
 ],
 "traps": [
   ["TERMINUS", 1, "A terminus is the end of a railway line and the word on the front of the station. It is a railway noun before it is a synonym."],
 ],
 "epilogue": "The last board in the archive and it is entirely about endings, which felt like the right note. TERMINUS is the tile that could go either way, and PLATFORM, SIGNAL BOX, BUFFERS and SLEEPER settle it by being four already. Final curtain.",
},

]
