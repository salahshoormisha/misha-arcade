# -*- coding: utf-8 -*-
"""UNITED pack, batch 4: the English game everywhere except Old Trafford. The
other ninety-one clubs and the language that grew up around them — nicknames
that are ordinary trades, grounds named after the street outside, towns that
ended up inside idioms, the suffixes that separate a United from a City. Built
to the pack's two rules: nothing here needs a record book, and no board lets the
TYPE of a tile do the sorting — most boards run two or three sets of club names
side by side, and the fourth group steals from them."""

BOARDS = [

{
 "title": "Trade Secrets",
 "diff": 3,
 "groups": [
   {"name": "NICKNAMED AFTER THE LOCAL TRADE", "tiles": ["SADDLERS", "POTTERS", "HATTERS", "MILLERS"],
    "note": "Walsall made saddles, Stoke pots, Luton hats, Rotherham flour."},
   {"name": "___ COUNTY", "tiles": ["DERBY", "NOTTS", "STOCKPORT", "NEWPORT"],
    "note": "Nobody calls them the Counties. Everybody calls them County."},
   {"name": "SLANG FOR UTTER NONSENSE", "tiles": ["COBBLERS", "TRIPE", "GUFF", "CODSWALLOP"],
    "note": "Tripe is the lining of a cow's stomach before it is ever an insult."},
   {"name": "A CLUB HIDING INSIDE", "tiles": ["BLEEDS", "VILLAIN", "FORESTALL", "SPREADING"],
    "note": "b-LEEDS, VILLA-in, FOREST-all, s-p-READING. Four of them, unannounced."},
 ],
 "traps": [
   ["COBBLERS", 0, "Northampton Town are the Cobblers, and the town made boots for the army."],
 ],
 "epilogue": "COBBLERS is Northampton's nickname and a word for rubbish. SADDLERS, POTTERS, HATTERS and MILLERS are four already.",
},

{
 "title": "Sent to Coventry",
 "diff": 3,
 "groups": [
   {"name": "CLUBS CALLED UNITED", "tiles": ["LEEDS", "SHEFFIELD", "WEST HAM", "SCUNTHORPE"],
    "note": "Ninety-two clubs, and not one of these four is anywhere near Manchester."},
   {"name": "THEIR TOWN IS ALSO A BRITISH IDIOM", "tiles": ["COVENTRY", "BURTON", "BRISTOL", "BARNET"],
    "note": "Sent to Coventry, gone for a Burton, Bristol fashion — and a Barnet is hair."},
   {"name": "CLUBS CALLED CITY", "tiles": ["NORWICH", "LEICESTER", "HULL", "BRADFORD"],
    "note": "Hull City tried to rename themselves Hull Tigers in 2013. The FA said no."},
   {"name": "CLUB NAMES THAT ARE ORDINARY NOUNS", "tiles": ["ARSENAL", "FOREST", "PALACE", "ORIENT"],
    "note": "An armoury, a wood, a grand house and the East. None of them a town."},
 ],
 "traps": [
   ["COVENTRY", 2, "Coventry City are a real club, sitting one row from a group of exactly those."],
   ["BRISTOL", 2, "Bristol City exist. So do Bristol Rovers. That city is spoilt for suffixes."],
   ["HULL", 3, "A hull is the body of a ship — as ordinary a noun as anything in the purple."],
 ],
 "epilogue": "COVENTRY and BRISTOL are Cities too, and HULL is a plain noun. Counting settles all three: the idioms need four.",
},

{
 "title": "Street Names",
 "diff": 2,
 "groups": [
   {"name": "___ ROAD", "tiles": ["ELLAND", "CARROW", "VICARAGE", "LOFTUS"],
    "note": "Leeds, Norwich, Watford, QPR. Four grounds named after the street outside."},
   {"name": "___ PARK", "tiles": ["SELHURST", "FRATTON", "EWOOD", "GOODISON"],
    "note": "Goodison held Everton for 133 years. The men's team left it in 2025."},
   {"name": "KINDS OF HOUSE", "tiles": ["VILLA", "SEMI", "BUNGALOW", "MAISONETTE"],
    "note": "A maisonette is a flat with its own front door, which is the entire point."},
   {"name": "___ LANE", "tiles": ["BRAMALL", "PENNY", "MEMORY", "FAST"],
    "note": "Bramall, Penny, memory, fast. Only one of them sells a match ticket."},
 ],
 "traps": [
   ["VILLA", 1, "Villa Park is a ground and a villa is a house. Both readings are entirely fair."],
 ],
 "epilogue": "VILLA is a house and half a ground. The Park is full without it: SELHURST, FRATTON, EWOOD and GOODISON.",
},

{
 "title": "The Tractor Boys",
 "diff": 4,
 "groups": [
   {"name": "NICKNAMES THAT NAME A KIND OF PERSON", "tiles": ["PILGRIMS", "MARINERS", "QUAKERS", "TRACTOR BOYS"],
    "note": "Plymouth sailed, Grimsby fished, Darlington prayed, Ipswich farmed."},
   {"name": "NICKNAMES BORROWED FROM ANIMALS", "tiles": ["FOXES", "HORNETS", "BEES", "TERRIERS"],
    "note": "A fox, a hornet, a bee and a small dog with a grievance."},
   {"name": "WORDS FOR A MISCHIEVOUS CHILD", "tiles": ["IMPS", "SCAMPS", "RASCALS", "MONKEYS"],
    "note": "Every one of these is said fondly, which is the whole trick of them."},
   {"name": "NICKNAMES NOBODY CAN AGREE ON", "tiles": ["ADDICKS", "BAGGIES", "POSH", "TOFFEES"],
    "note": "Charlton, West Brom, Peterborough, Everton. Four origin stories, four shrugs."},
 ],
 "traps": [
   ["MONKEYS", 1, "A monkey is an animal, and Hartlepool United's mascot has been one for years."],
   ["ADDICKS", 1, "Addicks is most likely Cockney for haddock, which is a fish, which is an animal."],
   ["IMPS", 3, "Lincoln City are the Imps, and it takes a cathedral legend to explain why."],
 ],
 "epilogue": "MONKEYS, ADDICKS and IMPS all have a second address. FOXES, HORNETS, BEES and TERRIERS have only the one.",
},

]
