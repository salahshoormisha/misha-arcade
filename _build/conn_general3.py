# -*- coding: utf-8 -*-
"""GENERAL pack, boards 21-30 (difficulty 3-4). Consumed by gen_connections.py."""

BOARDS = [

{
 "title": "Table for Two",
 "diff": 3,
 "groups": [
   {"name": "COFFEE ORDERS", "tiles": ["LATTE", "CORTADO", "MACCHIATO", "FLAT WHITE"],
    "note": "A cortado is equal parts espresso and warm milk; a macchiato is espresso 'stained' with a spoonful. The flat white is an antipodean argument that never ended."},
   {"name": "TEAS AND INFUSIONS", "tiles": ["OOLONG", "ROOIBOS", "MATCHA", "DARJEELING"],
    "note": "Rooibos is not tea at all — it's a South African bush — and matcha is the whole leaf ground up rather than steeped and thrown away."},
   {"name": "COCKTAILS NAMED AFTER PLACES", "tiles": ["MANHATTAN", "MOSCOW MULE", "LONG ISLAND", "BRONX"],
    "note": "The Bronx is a 1900s gin, vermouth and orange juice cocktail that was once as famous as the Martini and is now ordered by nobody."},
   {"name": "___ PRESS", "tiles": ["FRENCH", "BENCH", "CIDER", "PRINTING"],
    "note": "French press, bench press, cider press, printing press. All four squeeze something out of something else."},
 ],
 "traps": [
   ["FRENCH", 0, "A French press is a coffee maker, so FRENCH looks like a coffee order on a board that has one."],
 ],
 "epilogue": "FRENCH is the only tile with a foot in the café. LATTE, CORTADO, MACCHIATO and FLAT WHITE are drinks you order by name, and a French press is a piece of equipment — which is the distinction the board is testing.",
},

{
 "title": "Loose Change",
 "diff": 3,
 "groups": [
   {"name": "US COINS", "tiles": ["PENNY", "NICKEL", "DIME", "QUARTER"],
    "note": "The dime is the smallest US coin by size and the only one that doesn't say what it's worth anywhere on it."},
   {"name": "METALS", "tiles": ["TITANIUM", "TIN", "ZINC", "LEAD"],
    "note": "Titanium is as strong as steel and 45% lighter; lead is soft enough to scratch with a fingernail."},
   {"name": "BRITISH SLANG FOR PRISON", "tiles": ["CLINK", "NICK", "SLAMMER", "POKEY"],
    "note": "The Clink was a real gaol in Southwark from the 12th century until a mob burned it down in 1780. The name outlived the building by 250 years."},
   {"name": "___ MINE", "tiles": ["GOLD", "LAND", "COAL", "DIAMOND"],
    "note": "Gold mine, landmine, coal mine, diamond mine. Only one of them you'd rather not find."},
 ],
 "traps": [
   ["NICKEL", 1, "Nickel is a metal with an atomic number and everything. The five-cent piece is only about 25% nickel, which makes the coin the borrowed meaning."],
 ],
 "epilogue": "NICKEL is a metal that got a coin named after it, and NICK is a prison that sounds like the metal. TITANIUM, TIN, ZINC and LEAD have never been legal tender in America, so the metal shelf fills without it.",
},

{
 "title": "Strike Anywhere",
 "diff": 4,
 "groups": [
   {"name": "THINGS YOU STRIKE", "tiles": ["MATCH", "DEAL", "POSE", "BALANCE"],
    "note": "You strike a match, a deal, a pose and a balance — four completely unrelated verbs wearing the same coat."},
   {"name": "OLYMPIC ATHLETICS EVENTS", "tiles": ["HURDLES", "JAVELIN", "SHOT PUT", "STEEPLECHASE"],
    "note": "The steeplechase has a water jump because it descends from a horse race across country between two church steeples."},
   {"name": "PARTS OF A DRUM KIT", "tiles": ["SNARE", "HI-HAT", "CYMBAL", "TOM"],
    "note": "The snare is named for the wires stretched under the bottom head; without them it's just a very disappointed tom."},
   {"name": "___ STICK", "tiles": ["CHAP", "YARD", "DRUM", "LIP"],
    "note": "Chapstick, yardstick, drumstick, lipstick. Two of them go on your face."},
 ],
 "traps": [
   ["DRUM", 2, "A drum is unambiguously part of a drum kit, and there is a drum kit on this board. It is here to be hit by the last group instead."],
   ["CYMBAL", 0, "You strike a cymbal more literally than you strike a pose, a deal or a balance. It is the most strikable object in the grid."],
 ],
 "traps_note": "",
 "epilogue": "Two tiles argue about the same kit: DRUM wants to join the drums and CYMBAL wants to join the things you strike, and they cancel out. SNARE, HI-HAT and TOM cannot be anything else, and MATCH, DEAL and POSE cannot be anything else, so the leftovers sort themselves.",
},

{
 "title": "Alphabet Soup",
 "diff": 4,
 "groups": [
   {"name": "GREEK LETTERS", "tiles": ["SIGMA", "DELTA", "OMEGA", "LAMBDA"],
    "note": "Sigma became the summation sign, delta the symbol for change, lambda the wavelength, and omega the end of everything."},
   {"name": "NATO ALPHABET WORDS", "tiles": ["TANGO", "FOXTROT", "WHISKEY", "ROMEO"],
    "note": "The 1956 alphabet was tested across accents and radio static; the words were chosen because they survive being half-heard, not because they're pretty."},
   {"name": "BALLROOM DANCES", "tiles": ["WALTZ", "QUICKSTEP", "RUMBA", "SAMBA"],
    "note": "The quickstep came out of the 1920s when bands played the foxtrot too fast and the dancers simply kept up."},
   {"name": "___ FORCE", "tiles": ["AIR", "TASK", "BRUTE", "WORK"],
    "note": "Air force, task force, brute force, workforce. Only one of them is a solution to a maths problem."},
 ],
 "traps": [
   ["DELTA", 1, "Delta is a NATO alphabet word as well as a Greek letter — D is Delta, and the alphabet borrowed most of its Greek."],
   ["TANGO", 2, "The tango is a ballroom dance before it is a radio codeword, and there is a ballroom group sitting right there."],
   ["FOXTROT", 2, "Same problem, worse: the foxtrot is one of the five standard ballroom dances and the quickstep is literally descended from it."],
 ],
 "epilogue": "Two of the NATO words are dances and one of the Greek letters is a NATO word, so three tiles are pulling sideways at once. The anchor is that SIGMA, OMEGA and LAMBDA are Greek and nothing else — DELTA has to stay to make four, and once it does, TANGO and FOXTROT have to stay too.",
},

{
 "title": "Silent Treatment",
 "diff": 4,
 "groups": [
   {"name": "SILENT B", "tiles": ["DEBT", "SUBTLE", "PLUMBER", "DOUBT"],
    "note": "Debt and doubt never had a B in English — 16th-century scholars inserted them to show off the Latin, and we've been silently paying for it since."},
   {"name": "SILENT K", "tiles": ["KNEEL", "KNUCKLE", "KNACK", "KNOLL"],
    "note": "The K was pronounced until about 1600. Chaucer's knight was a k-nicht."},
   {"name": "SILENT P", "tiles": ["PSALM", "PNEUMONIA", "RECEIPT", "CORPS"],
    "note": "Greek gave us the ps- and pn- pairs and English refused to say either. Corps is French and drops the P and the S together."},
   {"name": "SILENT L", "tiles": ["SALMON", "CALM", "YOLK", "WOULD"],
    "note": "Salmon had no L at all until Latin-minded spellers put one in, and nobody has ever pronounced it."},
 ],
 "traps": [
   ["PSALM", 3, "PSALM has a silent P AND a silent L. It is the only tile on the board that genuinely qualifies for two of these groups."],
 ],
 "epilogue": "PSALM is the double agent and the resolution is arithmetic, not phonetics: SALMON, CALM, YOLK and WOULD already make four silent Ls, and PNEUMONIA, RECEIPT and CORPS need a fourth silent P. There is only one word that can do the job.",
},

{
 "title": "Two of a Kind",
 "diff": 4,
 "groups": [
   {"name": "THINGS THAT COME IN PAIRS", "tiles": ["SCISSORS", "TROUSERS", "BINOCULARS", "TWEEZERS"],
    "note": "All four are grammatically plural and physically singular, which is why you buy 'a pair' of each."},
   {"name": "___ SOME", "tiles": ["HAND", "AWE", "TIRE", "LONE"],
    "note": "Handsome, awesome, tiresome, lonesome. 'Handsome' originally meant easy to handle."},
   {"name": "COLLECTIVE NOUNS FOR BIRDS", "tiles": ["MURDER", "PARLIAMENT", "CHARM", "MURMURATION"],
    "note": "A murder of crows, a parliament of owls, a charm of finches, a murmuration of starlings. Most were invented in a 15th-century hunting manual by people showing off."},
   {"name": "QUARK FLAVOURS", "tiles": ["UP", "DOWN", "STRANGE", "BOTTOM"],
    "note": "Six flavours: up, down, strange, charm, top and bottom. Gell-Mann took 'quark' from a line in Finnegans Wake and the naming has been unserious ever since."},
 ],
 "traps": [
   ["CHARM", 3, "Charm is one of the six quark flavours as well as the collective noun for finches. Physics and falconry, same word."],
 ],
 "epilogue": "CHARM is a quark and a flock, and both readings are completely legitimate — which is why UP, DOWN, STRANGE and BOTTOM had to be four on their own. MURDER, PARLIAMENT and MURMURATION have no subatomic ambitions.",
},

{
 "title": "Shades of Meaning",
 "diff": 4,
 "groups": [
   {"name": "WORDS MEANING FAKE", "tiles": ["BOGUS", "PHONY", "SHAM", "ERSATZ"],
    "note": "Ersatz is German for 'replacement' and entered English through wartime coffee made of acorns."},
   {"name": "WORDS MEANING STUBBORN", "tiles": ["DOGGED", "MULISH", "OBSTINATE", "PIGHEADED"],
    "note": "Three of these blame an animal for a human failing, which is the most human thing about them."},
   {"name": "ADJECTIVES FROM ANIMALS", "tiles": ["BOVINE", "FELINE", "ASININE", "VULPINE"],
    "note": "Cow, cat, ass, fox. Only asinine has drifted so far from the donkey that people forget it was ever about one."},
   {"name": "___ FACED", "tiles": ["TWO", "BARE", "POKER", "STONE"],
    "note": "Two-faced, barefaced, poker-faced, stone-faced. Three are expressions and one is a character judgement."},
 ],
 "traps": [
   ["DOGGED", 2, "Dogged is an adjective made out of an animal. It means persistent, which is what dogs are famous for."],
   ["MULISH", 2, "Mulish is even more obviously an animal adjective — the mule is doing all the work in the word."],
   ["PIGHEADED", 2, "And pigheaded has the animal right there in the middle of it. Three of the four stubborn words are animals."],
 ],
 "epilogue": "Three tiles in the stubborn group are literally adjectives made from animals, which looks like a fatal ambiguity and isn't: BOVINE, FELINE, ASININE and VULPINE are already four, and none of them means stubborn. The animal group is full before the argument starts.",
},

{
 "title": "Take Your Pick",
 "diff": 4,
 "groups": [
   {"name": "PARTS OF A GUITAR", "tiles": ["FRET", "NUT", "TUNING PEG", "SOUNDHOLE"],
    "note": "The nut is the slotted strip at the top of the neck that sets the string spacing and the open-string height. Get it wrong and nothing else can be right."},
   {"name": "NUTS", "tiles": ["CASHEW", "PECAN", "MACADAMIA", "WALNUT"],
    "note": "Botanically almost none of these is a nut — the cashew is a seed hanging off a fruit, the pecan and walnut are drupes."},
   {"name": "SCREWDRIVER HEADS", "tiles": ["PHILLIPS", "FLATHEAD", "TORX", "HEX"],
    "note": "Phillips was designed to cam out on purpose so an assembly-line driver couldn't overtighten. Every stripped screw since is a feature."},
   {"name": "___ PICK", "tiles": ["ICE", "TOOTH", "NIT", "HAND"],
    "note": "Ice pick, toothpick, nitpick, handpick. Two are objects, two are habits."},
 ],
 "traps": [
   ["NUT", 1, "There is a NUTS group and a tile that says NUT. On a guitar it is a piece of bone or bone-substitute at the top of the neck."],
 ],
 "epilogue": "NUT is the whole board. CASHEW, PECAN, MACADAMIA and WALNUT are four already, and FRET, TUNING PEG and SOUNDHOLE are three looking for a fourth — which is exactly the sort of counting that makes a purple collapse.",
},

{
 "title": "Long Story Short",
 "diff": 4,
 "groups": [
   {"name": "ACRONYMS THAT BECAME ORDINARY WORDS", "tiles": ["LASER", "SCUBA", "TASER", "SONAR"],
    "note": "Light Amplification by Stimulated Emission of Radiation; Self-Contained Underwater Breathing Apparatus; Sound Navigation and Ranging. Nobody has expanded any of them out loud since 1975."},
   {"name": "PORTMANTEAU WORDS", "tiles": ["BRUNCH", "SMOG", "MOTEL", "PODCAST"],
    "note": "Smog is smoke plus fog and was coined in 1905 about London. Podcast is iPod plus broadcast, which now outlives the iPod."},
   {"name": "WORDS FROM A PERSON'S NAME", "tiles": ["SANDWICH", "BOYCOTT", "CARDIGAN", "SILHOUETTE"],
    "note": "The Earl of Sandwich, Captain Boycott who was frozen out by his tenants, the Earl of Cardigan of Light Brigade fame, and Étienne de Silhouette, a finance minister so stingy his name meant 'done on the cheap'."},
   {"name": "THEIR OWN PLURAL", "tiles": ["SHEEP", "DEER", "SERIES", "AIRCRAFT"],
    "note": "One sheep, two sheep. English gave up on these and never came back."},
 ],
 "traps": [
   ["TASER", 2, "TASER stands for 'Thomas A. Swift's Electric Rifle' — its inventor named it after a boys' adventure novel. It is an acronym built out of a person's name, so it qualifies twice over."],
 ],
 "epilogue": "TASER is genuinely both: an acronym and a word from somebody's name, because the acronym IS somebody's name. SANDWICH, BOYCOTT, CARDIGAN and SILHOUETTE are already four earls and a civil servant, so the acronyms keep their stun gun.",
},

{
 "title": "Hidden Depths",
 "diff": 4,
 "groups": [
   {"name": "SEAS", "tiles": ["CORAL", "BALTIC", "ARAL", "TASMAN"],
    "note": "The Aral is the cautionary one — it was the fourth-largest lake on earth in 1960 and is now mostly desert with rusting trawlers in it."},
   {"name": "SHADES OF RED", "tiles": ["CRIMSON", "SCARLET", "VERMILION", "CARMINE"],
    "note": "Carmine and crimson both come from the kermes insect, crushed for dye since antiquity. Vermilion is ground cinnabar, which is mercury ore, which is why old painters died young."},
   {"name": "MUSIC GENRES", "tiles": ["SKA", "GRIME", "DRILL", "GARAGE"],
    "note": "Ska came first in Jamaica, garage out of New York and then very differently out of London, and grime and drill out of that. Four genres, one family tree."},
   {"name": "___ BAND", "tiles": ["ARM", "HEAD", "WAIST", "BROAD"],
    "note": "Armband, headband, waistband, broadband. Three of them hold something up."},
 ],
 "traps": [
   ["CORAL", 1, "Coral is a perfectly standard shade — pinkish orange, on every paint chart — as well as a sea north-east of Australia."],
 ],
 "epilogue": "CORAL is a colour that got a sea named after it, which is the reverse of how these usually go. CRIMSON, SCARLET, VERMILION and CARMINE are four reds already, and BALTIC, ARAL and TASMAN are three seas short of a set.",
},

]
