# -*- coding: utf-8 -*-
"""UNITED pack, batch 3: Manchester United itself — the treble, the armband,
the No. 7 shirt, the academy, the away kit, Cantona's trawler. Built against the
two complaints that retired FOURMATIONS: nothing here needs a record book, and no
board lets type do the sorting. Every board runs at least two groups of the same
surface — usually surnames — and the fourth group steals a tile off one of them."""

BOARDS = [

{
 "title": "The Treble",
 "diff": 4,
 "groups": [
   {"name": "PLAYED IN THE 1999 EUROPEAN FINAL", "tiles": ["SCHMEICHEL", "BECKHAM", "GIGGS", "SOLSKJÆR"],
    "note": "Two goals in stoppage time, both from corners Beckham took."},
   {"name": "CLUBS WHO HAVE ALSO DONE A TREBLE", "tiles": ["CELTIC", "BARCELONA", "INTER", "MAN CITY"],
    "note": "Celtic 1967, Barcelona 2009, Inter 2010, City 2023. A short list."},
   {"name": "WORDS MEANING UPROAR", "tiles": ["BEDLAM", "HAVOC", "FRACAS", "RUCKUS"],
    "note": "Bedlam was a London hospital long before it was a noise."},
   {"name": "A 1999 TREBLE WINNER IS HIDING", "tiles": ["COLESLAW", "STAMPEDE", "MAYHEM", "BUTTON"],
    "note": "COLE-slaw, STAM-pede, MAY-hem, BUTT-on. Four men from one squad."},
 ],
 "traps": [
   ["STAMPEDE", 2, "A stampede is uproar with hooves, and it sits two squares from bedlam and havoc."],
   ["MAYHEM", 2, "Mayhem is the plainest word for uproar on the board and is not doing that job here."],
 ],
 "epilogue": "STAMPEDE and MAYHEM are honest uproar too. BEDLAM, HAVOC, FRACAS and RUCKUS make four without them.",
},

{
 "title": "The Armband",
 "diff": 3,
 "groups": [
   {"name": "___ BAND", "tiles": ["ARM", "RUBBER", "BROAD", "WAIST"],
    "note": "Armband, rubber band, broadband, waistband. One confers authority."},
   {"name": "CAPTAINED MANCHESTER UNITED", "tiles": ["BRUCE", "KEANE", "VIDIĆ", "FERNANDES"],
    "note": "Bruce, Keane, Vidić, Fernandes. Four skippers across thirty years."},
   {"name": "CAPTAINED ENGLAND", "tiles": ["ROBSON", "BECKHAM", "ROONEY", "FERDINAND"],
    "note": "All four wore the England armband and all four spent years in red."},
   {"name": "CAPTAIN ___", "tiles": ["MORGAN", "HOOK", "SCARLET", "MARVEL"],
    "note": "A rum, a pirate, a puppet — and the nickname Bryan Robson carried."},
 ],
 "traps": [
   ["ROONEY", 1, "Rooney was United's club captain from 2014 until he left in 2017."],
   ["MORGAN", 1, "Willie Morgan captained United in the seventies, which makes this the meanest tile here."],
 ],
 "epilogue": "ROONEY led both sides and MORGAN led one. BRUCE, KEANE, VIDIĆ and FERNANDES fill the armband without either.",
},

{
 "title": "Squad Rotation",
 "diff": 5,
 "groups": [
   {"name": "HAD TWO SPELLS AT UNITED", "tiles": ["RONALDO", "POGBA", "HUGHES", "EVANS"],
    "note": "Hughes came back in 1988, Pogba in 2016, Ronaldo in 2021, Evans in 2023."},
   {"name": "___ ROOM", "tiles": ["BOOT", "CHANGING", "ENGINE", "ELBOW"],
    "note": "Boot room, changing room, engine room, elbow room. One belongs to Liverpool."},
   {"name": "PLAYED FOR UNITED AND REAL MADRID", "tiles": ["BECKHAM", "VARANE", "CASEMIRO", "HEINZE"],
    "note": "Beckham went one way in 2003. The other three came back the other."},
   {"name": "ANAGRAM OF A UNITED PLAYER", "tiles": ["WASH", "ISLETS", "PHRASE", "MARITAL"],
    "note": "Shuffle them and you get Shaw, Stiles, Sharpe and Martial."},
 ],
 "traps": [
   ["WASH", 1, "Washroom is a room, and it is sitting beside boot room and changing room."],
   ["RONALDO", 2, "Ronaldo left United for Madrid in 2009 and won four Champions Leagues there."],
 ],
 "epilogue": "WASH is a room and RONALDO is a Madrid man. Neither moves: BOOT, CHANGING, ENGINE and ELBOW are already four.",
},

{
 "title": "Matchday",
 "diff": 1,
 "groups": [
   {"name": "SOLD ROUND AN ENGLISH GROUND", "tiles": ["PROGRAMME", "SCARF", "BOVRIL", "PIE"],
    "note": "Bovril is beef extract in hot water and tastes mainly of February."},
   {"name": "___ TICKET", "tiles": ["SEASON", "GOLDEN", "MEAL", "BIG"],
    "note": "Season ticket, golden ticket, meal ticket, big ticket. One gets you in."},
   {"name": "HOW MANY CAME THROUGH THE DOOR", "tiles": ["GATE", "HOUSE", "CROWD", "TURNOUT"],
    "note": "The gate is the money and the crowd is the people. Clubs quote both."},
   {"name": "HALF ___", "tiles": ["WAY", "BACK", "PINT", "TERM"],
    "note": "Halfway, halfback, half-pint, half-term. Only one is served at a bar."},
 ],
 "traps": [
   ["PINT", 0, "A pint outsells everything else at an English ground, with Bovril a distant second."],
 ],
 "epilogue": "PINT is sold round every ground in England. It stays put because PROGRAMME, SCARF, BOVRIL and PIE are four.",
},

]
