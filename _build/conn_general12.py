# -*- coding: utf-8 -*-
"""GENERAL pack, batch 12: the two Englishes. Words that mean different things
either side of the Atlantic, understatement that means the opposite, Scots that
stayed local, spellings that hide a smaller word, and idioms that do not travel."""

BOARDS = [

{
 "title": "Cheers, Then",
 "diff": 2,
 "groups": [
   {"name": "BRITISH FOR THANK YOU", "tiles": ["TA", "CHEERS", "LOVELY", "NICE ONE"],
    "note": "Cheers covers thanks, goodbye and a toast, sometimes all at once."},
   {"name": "___ ENGLISH", "tiles": ["QUEEN'S", "PLAIN", "PIDGIN", "BROKEN"],
    "note": "The Queen's English quietly became the King's again in 2022."},
   {"name": "BRITISH FOR EXHAUSTED", "tiles": ["KNACKERED", "SHATTERED", "WHACKED", "DONE IN"],
    "note": "Knackered comes from the knacker's yard, where old horses ended up."},
   {"name": "FLIPS MEANING IN AMERICA", "tiles": ["TABLE", "QUITE", "BOMB", "MOMENTARILY"],
    "note": "Table it, quite good, it bombed. Each one reverses mid-Atlantic."},
 ],
 "traps": [
   ["CHEERS", 3, "In America cheers is only a toast; the thank-you and the goodbye never crossed"],
   ["SHATTERED", 3, "Shattered in America means devastated, not simply in need of a lie-down"],
   ["WHACKED", 3, "Whacked in America is what the mob does to you, which is a considerable flip"],
 ],
 "epilogue": "CHEERS, SHATTERED and WHACKED all shift in America. Only four shift into the opposite.",
},

{
 "title": "The Extra Letter",
 "diff": 4,
 "groups": [
   {"name": "___ WALK", "tiles": ["SIDE", "BOARD", "CAT", "JAY"],
    "note": "Jaywalking is an American invention. Britain never made it an offence."},
   {"name": "BRITISH PAST TENSES", "tiles": ["BURNT", "LEARNT", "DREAMT", "SPOILT"],
    "note": "America burned, learned, dreamed and spoiled. Britain stops short."},
   {"name": "BRITAIN KEEPS THE U", "tiles": ["ARMOUR", "RUMOUR", "VIGOUR", "CLAMOUR"],
    "note": "Webster dropped the U in 1806 and America never picked it back up."},
   {"name": "THE SECOND L MAKES A WORD", "tiles": ["CANCELLED", "LABELLED", "JEWELLERY", "COUNSELLOR"],
    "note": "Cancelled hides CELL, labelled BELL, jewellery WELL, counsellor SELL."},
 ],
 "traps": [
   ["BURNT", 3, "BURNT hides an URN, and hunting hidden words is what the last group rewards"],
   ["SPOILT", 3, "SPOILT hides OIL, so it looks like one more word carrying a passenger"],
 ],
 "epilogue": "BURNT hides an URN and SPOILT an OIL. Neither needed a second L to manage it.",
},

{
 "title": "Naff Off",
 "diff": 4,
 "groups": [
   {"name": "___ OFF, MEANING GO AWAY", "tiles": ["PUSH", "CLEAR", "BOG", "NAFF"],
    "note": "Four ways to dismiss somebody without once resorting to the short one."},
   {"name": "SCOTS WORDS ENGLAND NEVER TOOK", "tiles": ["GLAIKIT", "SHOOGLE", "STOOSHIE", "CRABBIT"],
    "note": "Glaikit is gormless, shoogle is wobble, crabbit is bad-tempered."},
   {"name": "WORDS FOR A FUSS", "tiles": ["KERFUFFLE", "PALAVER", "TO-DO", "CARRY-ON"],
    "note": "Palaver reached English from Portuguese traders on the West African coast."},
   {"name": "PLAIN WORD, SCOTTISH MEANING", "tiles": ["STAY", "PIECE", "CHAP", "MIND"],
    "note": "To stay is to live there, a piece is a sandwich, to chap is to knock."},
 ],
 "traps": [
   ["STOOSHIE", 2, "A stooshie is a fuss and a row, which is the whole of that group's job"],
   ["STAY", 1, "Stay for 'live somewhere' is a Scots usage England never took either"],
 ],
 "epilogue": "STOOSHIE is a fuss on merit and STAY is Scots to the bone. Count four before committing.",
},

{
 "title": "Alright, Duck",
 "diff": 3,
 "groups": [
   {"name": "HOW BRITAIN SAYS HELLO", "tiles": ["ALRIGHT", "HIYA", "EY UP", "NOW THEN"],
    "note": "Alright? is a greeting, and the correct answer to it is 'alright?'"},
   {"name": "WHAT A BOXER DOES", "tiles": ["JAB", "FEINT", "BOB", "CLINCH"],
    "note": "A clinch is a hug the referee has to come and break up."},
   {"name": "REGIONAL BRITISH ENDEARMENTS", "tiles": ["PET", "DUCK", "HEN", "BAB"],
    "note": "Newcastle says pet, Nottingham duck, Glasgow hen, Birmingham bab."},
   {"name": "HOMOPHONES IF YOU DROP THE R", "tiles": ["TORQUE", "SPAR", "SOAR", "COURT"],
    "note": "In London torque is talk, spar is spa, soar is saw, court is caught."},
 ],
 "traps": [
   ["SPAR", 1, "Sparring is the first thing any boxer does, and SPAR is sitting right there"],
   ["DUCK", 1, "Ducking is what a boxer does when the jab arrives, and it beats bobbing"],
 ],
 "epilogue": "SPAR and DUCK are both things a boxer does. Neither of them is doing it here.",
},

{
 "title": "Faint Praise",
 "diff": 3,
 "groups": [
   {"name": "WAYS TO SAY VERY PLEASED", "tiles": ["CHUFFED", "MADE UP", "BUZZING", "OVER THE MOON"],
    "note": "Four ways to say pleased without ever once saying pleased."},
   {"name": "___ ENOUGH", "tiles": ["FAIR", "GOOD", "SURE", "WELL"],
    "note": "Fair enough ends more British arguments than any actual argument."},
   {"name": "PRAISE THAT MEANS THE OPPOSITE", "tiles": ["BRAVE", "BOLD", "AMBITIOUS", "INTERESTING"],
    "note": "If a Briton calls your plan brave, the plan is already dead."},
   {"name": "AMERICANISMS ONCE DENOUNCED", "tiles": ["BELITTLE", "LENGTHY", "RELIABLE", "TALENTED"],
    "note": "Jefferson coined belittle, and British reviewers were appalled by it."},
 ],
 "traps": [
   ["RELIABLE", 2, "Reliable, said of somebody's work, is British for 'not actually very good'"],
   ["FAIR", 2, "'Fair' on a school report is a mark, and a poor one — praise that is not"],
 ],
 "epilogue": "RELIABLE and FAIR are both faint praise. Only four were once denounced as American.",
},

{
 "title": "Not Cricket",
 "diff": 3,
 "groups": [
   {"name": "FROM BASEBALL", "tiles": ["BALLPARK", "RAIN CHECK", "LEFT FIELD", "TOUCH BASE"],
    "note": "A rain check was a real ticket stub, handed out for a washed-out game."},
   {"name": "___ GAME", "tiles": ["BALL", "END", "WAITING", "BLAME"],
    "note": "Ball game, endgame, waiting game, blame game. Only one is ever played."},
   {"name": "FROM CRICKET", "tiles": ["STICKY WICKET", "HIT FOR SIX", "CAUGHT OUT", "STUMPED"],
    "note": "A sticky wicket was a pitch drying out after rain, and unplayable."},
   {"name": "MEANS 'IT ALL WENT WRONG'", "tiles": ["PEAR-SHAPED", "DAMP SQUIB", "GONE WEST", "UP THE SPOUT"],
    "note": "A squib is a small firework, and a damp one does nothing whatsoever."},
 ],
 "traps": [
   ["HIT FOR SIX", 3, "Being hit for six is unambiguously the moment it has all gone wrong"],
   ["CAUGHT OUT", 3, "Caught out is exactly what you are when the whole thing has gone wrong"],
   ["BALL", 0, "Ballpark, ball game, whole new ball game — BALL is doing baseball work here"],
 ],
 "epilogue": "HIT FOR SIX and CAUGHT OUT are both disasters and BALL looks like baseball. Count, do not feel.",
},

{
 "title": "Borrowed Twice",
 "diff": 4,
 "groups": [
   {"name": "WORDS FOR A QUICK LOOK", "tiles": ["GLANCE", "PEEK", "GANDER", "SQUINT"],
    "note": "A gander is the goose, and the neck it stretches to see over things."},
   {"name": "AMERICAN WORDS FROM DUTCH", "tiles": ["BOSS", "STOOP", "SNOOP", "SLEIGH"],
    "note": "New Amsterdam left behind the boss, the stoop and the sleigh."},
   {"name": "BRITISH ARMY SLANG FROM INDIA", "tiles": ["PUKKA", "CUSHY", "BLIGHTY", "DEKKO"],
    "note": "Pukka is 'ripe', cushy is 'pleasant', blighty is 'foreign'."},
   {"name": "BORROWED FROM FRENCH TWICE", "tiles": ["CHEF", "HOTEL", "GUARANTEE", "FRAGILE"],
    "note": "English already had chief, hostel, warranty and frail. It took them again."},
 ],
 "traps": [
   ["SNOOP", 0, "A snoop is a nosy look at somebody's things, which is a look all the same"],
   ["DEKKO", 0, "A dekko is literally a quick look — 'have a dekko at this' means just that"],
 ],
 "epilogue": "SNOOP and DEKKO both mean a look. That group is full before either of them arrives.",
},

{
 "title": "Two Wardrobes",
 "diff": 2,
 "groups": [
   {"name": "___ SUIT", "tiles": ["SWIM", "TRACK", "LAW", "BOILER"],
    "note": "A boiler suit in Britain is a pair of coveralls in America."},
   {"name": "___ TOP", "tiles": ["TANK", "LAP", "ROOF", "HILL"],
    "note": "Tank top, laptop, rooftop, hilltop. Only one of them is knitwear in Britain."},
   {"name": "MEANS 'NOT VERY GOOD'", "tiles": ["NAFF", "DIRE", "GRIM", "RUBBISH"],
    "note": "Four verdicts, all of them delivered in the same flat tone of voice."},
   {"name": "TWO DIFFERENT GARMENTS", "tiles": ["PANTS", "VEST", "JUMPER", "SUSPENDERS"],
    "note": "A British vest is an undershirt; an American vest is a waistcoat."},
 ],
 "traps": [
   ["PANTS", 2, "Pants is British for disappointing before it is anything anybody wears"],
   ["TANK", 3, "A tank top is a sleeveless jumper in Britain and a sleeveless shirt in America"],
 ],
 "epilogue": "PANTS is British for rubbish and a TANK TOP changes garment at the border. Only four are two things at once.",
},

]
