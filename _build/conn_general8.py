# -*- coding: utf-8 -*-
"""GENERAL pack, batch 8: crime, law and the detective story. Courtrooms,
evidence, prison slang, pirates and cons — plus a steady supply of ordinary
words that turn out to be a felony, a boat, or a weapon in disguise."""

BOARDS = [

{
 "title": "The Beat",
 "diff": 1,
 "groups": [
   {"name": "ON AN OFFICER'S BELT", "tiles": ["BATON", "CUFFS", "RADIO", "TORCH"],
    "note": "In Britain it is a torch, in America a flashlight, and both hang there."},
   {"name": "WORDS MEANING TO ARREST", "tiles": ["COLLAR", "BUST", "PINCH", "NAB"],
    "note": "Collar, bust, pinch, nab. Three of them are things you do with a hand."},
   {"name": "___ SHEET", "tiles": ["RAP", "CHARGE", "CHEAT", "BALANCE"],
    "note": "Rap, charge, cheat, balance. Only one of these sheets is your whole past."},
   {"name": "RADIO PROCEDURE", "tiles": ["ROGER", "WILCO", "OVER", "COPY"],
    "note": "Wilco is 'will comply'. Nobody who means it says 'over and out'."},
 ],
 "traps": [
   ["RADIO", 3, "Every word in the last group exists in order to be said into one"],
   ["CHARGE", 1, "To charge someone is the paperwork after the collar, and it reads as arrest"],
 ],
 "epilogue": "RADIO is on the belt, not in the procedure. CHARGE is a sheet before it is an arrest.",
},

{
 "title": "Open and Shut",
 "diff": 2,
 "groups": [
   {"name": "IN A CROWN COURT", "tiles": ["BENCH", "DOCK", "GALLERY", "JURY BOX"],
    "note": "The dock is where Britain stands you up. America seats you at a table."},
   {"name": "___ CASE", "tiles": ["BRIEF", "STAIR", "SHOW", "PILLOW"],
    "note": "Brief, stair, show, pillow. Not one of these cases ever went to court."},
   {"name": "WORDS MEANING TO STEAL", "tiles": ["SWIPE", "PALM", "POCKET", "FILCH"],
    "note": "Three of them you do with a hand. Filch has been thieves' slang since 1560."},
   {"name": "ANAGRAMS OF CRIME WORDS", "tiles": ["TRAIL", "LEAP", "SONAR", "GOAL"],
    "note": "Shuffle each one and you get trial, plea, arson and gaol."},
 ],
 "traps": [
   ["BRIEF", 0, "In Britain your brief is your barrister, and the barrister is very much in court"],
   ["DOCK", 2, "To dock someone's pay is to take money off them that they never agreed to"],
 ],
 "epilogue": "Your BRIEF is your barrister and to DOCK is to take. Both still hold down the day job.",
},

{
 "title": "Blunt Instruments",
 "diff": 3,
 "groups": [
   {"name": "IN A TOOLBOX", "tiles": ["SPANNER", "CHISEL", "MALLET", "PLIERS"],
    "note": "Spanner in Britain, wrench in America. The tool is identical."},
   {"name": "___ WITNESS", "tiles": ["EXPERT", "EYE", "CHARACTER", "HOSTILE"],
    "note": "A hostile witness is one your own side called and now regrets."},
   {"name": "WEAPONS IN THE CLUEDO BOX", "tiles": ["CANDLESTICK", "LEAD PIPE", "REVOLVER", "DAGGER"],
    "note": "Six weapons in the box. Here are four; you have already placed a fifth."},
   {"name": "WEAPONS HIDING INSIDE", "tiles": ["CROSSWORD", "GRIMACE", "TRIFLE", "EPISTOLARY"],
    "note": "cross-SWORD, gri-MACE, t-RIFLE, e-PISTOL-ary. Nobody here is armed."},
 ],
 "traps": [
   ["SPANNER", 2, "The spanner really is a Cluedo weapon in the British box; the US swaps in a wrench"],
   ["MALLET", 2, "A mallet is a blunt instrument and looks exactly like something from that box"],
 ],
 "epilogue": "SPANNER genuinely is a Cluedo weapon. MALLET genuinely is not. The toolbox still needs both.",
},

{
 "title": "Contraband",
 "diff": 3,
 "groups": [
   {"name": "WORDS FOR STOLEN GOODS", "tiles": ["SWAG", "BOOTY", "HAUL", "PLUNDER"],
    "note": "Swag was a burglar's bundle for a century before it meant free merchandise."},
   {"name": "___ RUNNER", "tiles": ["RUM", "GUN", "BLOCKADE", "FRONT"],
    "note": "Rum, gun, blockade, front. Three of them get shot at."},
   {"name": "WORDS FOR A PIRATE", "tiles": ["CORSAIR", "BUCCANEER", "PRIVATEER", "FREEBOOTER"],
    "note": "A privateer held a government licence. The others were freelancing."},
   {"name": "SHIPS HIDING INSIDE", "tiles": ["SKETCH", "SKIFFLE", "BRIGAND", "JUNKET"],
    "note": "s-KETCH, s-KIFF-le, BRIG-and, JUNK-et. Four boats and no water."},
 ],
 "traps": [
   ["BRIGAND", 2, "A brigand is a robber in a gang; the only thing he lacks is a ship"],
   ["FREEBOOTER", 0, "Freebooter is Dutch vrijbuiter, free plus booty, so half the word is loot"],
 ],
 "epilogue": "BRIGAND would pass for a pirate anywhere. He is a boat in disguise instead.",
},

]
