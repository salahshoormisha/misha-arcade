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

{
 "title": "Middle Ground",
 "diff": 3,
 "groups": [
   {"name": "SMALL-MINDED AND NASTY", "tiles": ["PETTY", "SNIDE", "CATTY", "SPITEFUL"],
    "note": "Snide once meant counterfeit, which is a fair description of the tone."},
   {"name": "FASHION WORDS FROM FRENCH", "tiles": ["CHIC", "ATELIER", "COUTURE", "BOUTIQUE"],
    "note": "Atelier is only 'workshop' and couture is only 'sewing'."},
   {"name": "WHERE A SPORT IS PLAYED", "tiles": ["COURT", "PITCH", "RINK", "LANE"],
    "note": "Court, pitch, rink, lane. Only one of them is ever made of ice."},
   {"name": "AVERAGES AND SPREADS", "tiles": ["MEAN", "MEDIAN", "MODE", "RANGE"],
    "note": "In America the median is also the grass between the carriageways."},
 ],
 "traps": [
   ["MEAN", 0, "Mean is the plainest word on the board for someone being unpleasant"],
   ["MODE", 1, "A la mode is French for in fashion, which is where the word came from"],
   ["RANGE", 2, "A driving range and a shooting range are both places you go to practise"],
 ],
 "epilogue": "MEAN, MODE and RANGE all lead double lives. MEDIAN quietly holds the middle on its own.",
},

{
 "title": "Off By Two",
 "diff": 3,
 "groups": [
   {"name": "MONTHS WITH THIRTY DAYS", "tiles": ["APRIL", "JUNE", "SEPTEMBER", "NOVEMBER"],
    "note": "Thirty days hath September, April, June and November. The rhyme holds."},
   {"name": "___ HOUR", "tiles": ["RUSH", "HAPPY", "ZERO", "ELEVENTH"],
    "note": "Rush, happy, zero, eleventh. Only one of them you would choose to be in."},
   {"name": "COMES ROUND EVERY FOUR YEARS", "tiles": ["LEAP YEAR", "WORLD CUP", "OLYMPICS", "EUROS"],
    "note": "Euro 2020 was played in 2021 and kept the old name on the trophy anyway."},
   {"name": "THE NUMBER IN IT MOVED", "tiles": ["QUARANTINE", "DECIMATE", "SIESTA", "NOON"],
    "note": "Forty days, one man in ten, the sixth hour, the ninth. None of it still true."},
 ],
 "traps": [
   ["SEPTEMBER", 3, "September means the seventh month and has not been the seventh since Rome"],
   ["NOVEMBER", 3, "November means the ninth, and is off by exactly the same two months"],
 ],
 "epilogue": "SEPTEMBER means seven and NOVEMBER means nine, and neither has for two thousand years. Both still have thirty days.",
},

{
 "title": "Bad Batch",
 "diff": 5,
 "groups": [
   {"name": "WORDS MEANING GONE OFF", "tiles": ["RANK", "RANCID", "PUTRID", "FETID"],
    "note": "Rancid is fat that has turned and putrid is flesh. Fetid is only the smell."},
   {"name": "WAYS TO MEND", "tiles": ["DARN", "PATCH", "SOLDER", "SPLICE"],
    "note": "Darning weaves new thread across the hole; splicing is only ever for rope."},
   {"name": "KINDS OF VINEGAR", "tiles": ["MALT", "BALSAMIC", "CIDER", "RICE"],
    "note": "Balsamic is cooked grape must aged in wood and is barely vinegar at all."},
   {"name": "ONE LETTER FROM A NUMBER", "tiles": ["FOUL", "FIX", "TEA", "WINE"],
    "note": "Change a single letter in each and you have four, six, ten and nine."},
 ],
 "traps": [
   ["FOUL", 0, "A foul smell is the first thing anyone says about something that has gone off"],
   ["FIX", 1, "Fix is the plainest word in English for mending a thing that broke"],
   ["WINE", 2, "Wine vinegar is the one every kitchen actually has, next to the malt"],
 ],
 "epilogue": "FOUL smells, FIX mends, WINE turns. Swap one letter each and they stop being words at all.",
},

{
 "title": "Pocket Money",
 "diff": 2,
 "groups": [
   {"name": "WORDS MEANING HONOURABLE", "tiles": ["DECENT", "WORTHY", "UPRIGHT", "PRINCIPLED"],
    "note": "Upright is the only one you can also do with your spine."},
   {"name": "PARTS OF A TOOTH", "tiles": ["ENAMEL", "ROOT", "PULP", "DENTINE"],
    "note": "Dentine is most of the tooth. Enamel is only the coat, and it never grows back."},
   {"name": "ON THE CHRISTMAS TREE", "tiles": ["TINSEL", "BAUBLE", "STAR", "LIGHTS"],
    "note": "The thing on top is either a star or an angel, and families do not switch."},
   {"name": "ONCE A COIN OF THE REALM", "tiles": ["CROWN", "SOVEREIGN", "ANGEL", "NOBLE"],
    "note": "A sovereign was a pound in gold; the angel carried Michael and his dragon."},
 ],
 "traps": [
   ["NOBLE", 0, "Noble is the most honourable-sounding word on the board, which is the trouble"],
   ["CROWN", 1, "The crown is the part of the tooth you can see, and the part a dentist caps"],
   ["ANGEL", 2, "An angel goes on top of the tree in about half of all households"],
 ],
 "epilogue": "CROWN caps a tooth, ANGEL tops a tree, NOBLE is a compliment. All four were once spendable.",
},

{
 "title": "Ticking Over",
 "diff": 1,
 "groups": [
   {"name": "WORDS MEANING EXPENSIVE", "tiles": ["PRICEY", "STEEP", "DEAR", "COSTLY"],
    "note": "Dear is the oldest of them and the only one you can also call a person."},
   {"name": "___ MARKET", "tiles": ["FLEA", "STOCK", "FARMERS", "MEAT"],
    "note": "Flea, stock, farmers, meat. Only one of them has ever had fleas."},
   {"name": "WHAT A CLOCK DOES", "tiles": ["TICK", "CHIME", "STRIKE", "GAIN"],
    "note": "A clock that gains is running fast, which is the polite way to say it lies."},
   {"name": "PENNY ___", "tiles": ["FARTHING", "DREADFUL", "WHISTLE", "ARCADE"],
    "note": "Penny farthing, penny dreadful, penny whistle, penny arcade. No change given."},
 ],
 "traps": [
   ["STOCK", 3, "Penny stock is a real term for a share worth almost nothing, and traders use it daily"],
   ["WHISTLE", 2, "A whistle and a chime are both things that go off to tell you the time"],
 ],
 "epilogue": "Penny stock is a real thing, which gives STOCK two homes. The market still needs four of them.",
},

{
 "title": "Straight Up",
 "diff": 3,
 "groups": [
   {"name": "WORDS MEANING BEST", "tiles": ["CHOICE", "TOP", "PICK", "PREMIUM"],
    "note": "Three of them go on a label and one of them goes on a cut of meat."},
   {"name": "WORDS MEANING FLAT", "tiles": ["LEVEL", "PLANE", "SMOOTH", "HORIZONTAL"],
    "note": "A plane is flat by definition, which is the entirety of its job."},
   {"name": "___ FOOD", "tiles": ["SOUL", "FAST", "JUNK", "COMFORT"],
    "note": "Soul, fast, junk, comfort. Only the last one is a mood rather than a menu."},
   {"name": "KINDS OF NUMBER", "tiles": ["PRIME", "EVEN", "WHOLE", "SQUARE"],
    "note": "Prime, even, whole, square. Only one of them is also a shape."},
 ],
 "traps": [
   ["PRIME", 0, "Prime beef, prime location, prime time — the word means best almost everywhere"],
   ["EVEN", 1, "An even surface is a flat one, and the two words are near-synonyms"],
   ["WHOLE", 2, "Wholefood sits on the same shelf of the language as fast food and junk food"],
 ],
 "epilogue": "PRIME cuts, EVEN levels, WHOLE feeds. All four are also things a number is allowed to be.",
},

{
 "title": "Something in the Air",
 "diff": 4,
 "groups": [
   {"name": "GEOLOGICAL TIME SPANS", "tiles": ["EPOCH", "ERA", "PERIOD", "AGE"],
    "note": "An era holds periods, a period holds epochs, an epoch holds ages."},
   {"name": "___ TRUCK", "tiles": ["FIRE", "MONSTER", "PICKUP", "DUMP"],
    "note": "Fire truck, monster truck, pickup truck, dump truck. In Britain, one is an engine."},
   {"name": "VICTORIAN MEDICINE CABINET", "tiles": ["LAUDANUM", "CHLOROFORM", "ARSENIC", "CARBOLIC"],
    "note": "Laudanum was opium in alcohol and was sold over the counter for toothache."},
   {"name": "ANAGRAMS OF NUMBERS", "tiles": ["EON", "TOW", "ETHER", "EVENS"],
    "note": "Shuffle each of them and you get one, two, three and seven."},
 ],
 "traps": [
   ["EON", 0, "An eon is the largest span of geological time there is, sitting above the era"],
   ["TOW", 1, "A tow truck is the one that turns up when none of the others will help"],
   ["ETHER", 2, "Ether was the anaesthetic before chloroform and belongs in that cabinet"],
 ],
 "epilogue": "EON is deep time, TOW is a truck, ETHER is an anaesthetic. Shuffled, they are 1, 2 and 3.",
},

]
