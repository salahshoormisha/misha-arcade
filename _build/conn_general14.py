# -*- coding: utf-8 -*-
"""GENERAL pack, batch 14: number, money and measure. Currencies and units go
hunting inside ordinary words, market language turns out to be physical
language, and several perfectly good nouns are quietly units of something."""

BOARDS = [

{
 "title": "Hard Currency",
 "diff": 3,
 "groups": [
   {"name": "PRINTED ON A BANKNOTE", "tiles": ["PORTRAIT", "WATERMARK", "SIGNATURE", "SERIAL"],
    "note": "Three of them exist to stop you copying it. One is just a face."},
   {"name": "KINDS OF INTEREST", "tiles": ["SIMPLE", "COMPOUND", "VESTED", "SELF"],
    "note": "Only one of the four ever paid anybody anything."},
   {"name": "WORDS FOR A SUDDEN FALL", "tiles": ["CRASH", "SLUMP", "PLUNGE", "DIVE"],
    "note": "Market language that started out physical and never stopped being."},
   {"name": "CURRENCIES TUCKED INSIDE", "tiles": ["NEURON", "HYENA", "ORDINARY", "GRANDEUR"],
    "note": "n-EURO-n, h-YEN-a, or-DINAR-y, g-RAND-eur. Four hiding places."},
 ],
 "traps": [
   ["COMPOUND", 3, "COMPOUND carries a whole POUND, which is exactly the last group's trick"],
   ["WATERMARK", 3, "WATERMARK ends in the MARK, what Germany spent before the euro"],
   ["SERIAL", 3, "SERIAL hides the RIAL, and Iran spends those in millions"],
 ],
 "epilogue": "COMPOUND, WATERMARK and SERIAL all hide money too. Three into a group of four does not go.",
},

{
 "title": "All Hands",
 "diff": 4,
 "groups": [
   {"name": "___ DROP", "tiles": ["DEAD", "EAVES", "RAIN", "TEAR"],
    "note": "Dead drop, eavesdrop, raindrop, teardrop. Only one is deliberate."},
   {"name": "SAILING TERMS", "tiles": ["TACK", "JIB", "LEEWARD", "BOOM"],
    "note": "Leeward is the sheltered side, and is pronounced 'loo-ard' by anyone serious."},
   {"name": "SPY TRADECRAFT", "tiles": ["ASSET", "HANDLER", "LEGEND", "CUT-OUT"],
    "note": "A legend is the invented life; a cut-out is the person who never knows why."},
   {"name": "ALSO A UNIT OF MEASURE", "tiles": ["MOLE", "KNOT", "HAND", "GRAIN"],
    "note": "A mole counts atoms, a hand is four inches of horse, a grain weighs 65 mg."},
 ],
 "traps": [
   ["KNOT", 1, "A knot is a sailing word twice over — one nautical mile an hour, and the thing in the rope"],
   ["MOLE", 2, "The mole is the most famous noun in the whole spy vocabulary"],
   ["HAND", 1, "All hands on deck: a hand is a member of the crew before it is anything else"],
 ],
 "epilogue": "KNOT, MOLE and HAND all belong somewhere else first. That is the point — they are measuring things.",
},

{
 "title": "Measure Twice",
 "diff": 2,
 "groups": [
   {"name": "METRIC PREFIXES", "tiles": ["KILO", "MEGA", "NANO", "MICRO"],
    "note": "Nano is a billionth, from the Greek for dwarf. Mega just means great."},
   {"name": "BIG NUMBERS, INFORMALLY", "tiles": ["ZILLION", "SQUILLION", "UMPTEEN", "LOADS"],
    "note": "None of them is a number, and all of them are understood exactly."},
   {"name": "UNITS THAT SURVIVED THE METRE", "tiles": ["FURLONG", "FATHOM", "CARAT", "ACRE"],
    "note": "An acre was as much as one man and one ox could plough before dark."},
   {"name": "UNITS BURIED IN A WORD", "tiles": ["SMILE", "GRAMMAR", "FLINCH", "BOUNCE"],
    "note": "s-MILE, GRAM-mar, fl-INCH, b-OUNCE. Four units, four unrelated words."},
 ],
 "traps": [
   ["KILO", 2, "Nobody says kilogram. A kilo is a unit in its own right, standing next to the acre"],
   ["MEGA", 1, "MEGA on its own is precisely how a person says 'an enormous amount' out loud"],
 ],
 "epilogue": "KILO and MEGA both moonlight. The prefixes still need four, and only NANO and MICRO cannot leave.",
},

]
