# -*- coding: utf-8 -*-
"""GENERAL pack, batch 18: letters, type and school. The Greek alphabet turns up
in the fridge, punctuation marks admit to proper names, printers and typesetters
turn out to have named half the language, and several ordinary words are only
two letters said out loud."""

BOARDS = [

{
 "title": "Full Marks",
 "diff": 2,
 "groups": [
   {"name": "IN A PENCIL CASE", "tiles": ["RUBBER", "SHARPENER", "PROTRACTOR", "HIGHLIGHTER"],
    "note": "In Britain a rubber rubs out pencil, which alarms every American once."},
   {"name": "___ BOOK", "tiles": ["EXERCISE", "TEXT", "SCRAP", "YEAR"],
    "note": "Exercise book, textbook, scrapbook, yearbook. Only one gets signed."},
   {"name": "KINDS OF EXAM", "tiles": ["MOCK", "VIVA", "ORAL", "PRACTICAL"],
    "note": "Viva voce is Latin for 'with the living voice', so you have to speak."},
   {"name": "SAY TWO LETTERS OUT LOUD", "tiles": ["ESSAY", "EMPTY", "ENVY", "EXCEL"],
    "note": "S.A., M.T., N.V., X.L. Four words that are only ever two letters."},
 ],
 "traps": [
   ["ESSAY", 2, "An essay paper is the exam most subjects set, sat in the same silent hall"],
   ["EXERCISE", 2, "A written exercise is precisely what a question paper puts in front of you"],
 ],
 "epilogue": "ESSAY and EXERCISE both look like things you sit. The exam group fills up without either.",
},

{
 "title": "Hash and Bang",
 "diff": 3,
 "groups": [
   {"name": "THE SENTENCE WITH EVERY LETTER", "tiles": ["QUICK", "BROWN", "JUMPS", "LAZY"],
    "note": "The quick brown fox jumps over the lazy dog. Fox and dog stayed home."},
   {"name": "___ MARK", "tiles": ["BIRTH", "HALL", "EAR", "QUESTION"],
    "note": "Birthmark, hallmark, earmark, question mark. Only one is punctuation."},
   {"name": "THE PROPER NAME FOR A SYMBOL", "tiles": ["PILCROW", "INTERROBANG", "OCTOTHORPE", "OBELUS"],
    "note": "The bang in interrobang is printer's slang for the exclamation mark."},
   {"name": "BEGINS WITH A GREEK LETTER", "tiles": ["CHICKEN", "NUGGET", "MUSTARD", "PIGEON"],
    "note": "CHI-cken, NU-gget, MU-stard, PI-geon. The alphabet got in the fridge."},
 ],
 "traps": [
   ["QUESTION", 2, "A question mark is a punctuation mark, and the group next door is nothing else"],
   ["PILCROW", 3, "PILCROW opens with PI, which is precisely what the last group is doing"],
 ],
 "epilogue": "QUESTION is punctuation and PILCROW starts with PI. Both are already spoken for.",
},

{
 "title": "Set in Lead",
 "diff": 4,
 "groups": [
   {"name": "ALSO THE NAME OF A TYPEFACE", "tiles": ["IMPACT", "COURIER", "PAPYRUS", "TREBUCHET"],
    "note": "A trebuchet is a siege engine and papyrus is a reed. Both got a menu."},
   {"name": "PAGE FAULTS A TYPESETTER FIXES", "tiles": ["WIDOW", "ORPHAN", "RIVER", "LADDER"],
    "note": "An orphan has no past and a widow has no future. That is the mnemonic."},
   {"name": "ADJUSTMENTS TO WHITE SPACE", "tiles": ["KERNING", "LEADING", "TRACKING", "INDENT"],
    "note": "Leading is named for the strips of lead slid in between the lines."},
   {"name": "WHAT A LETTERFORM HAS", "tiles": ["SPINE", "SHOULDER", "TAIL", "LEG"],
    "note": "Type has a spine, a shoulder, a tail and a leg, plus an ear and an arm."},
 ],
 "traps": [
   ["SHOULDER", 2, "In metal type the shoulder is the blank space around the letter, which is spacing"],
   ["RIVER", 2, "A river is made entirely of white space, running down through justified text"],
 ],
 "epilogue": "SHOULDER is blank metal and a RIVER is pure white space. The spacing group still seats four.",
},

{
 "title": "Ye Olde",
 "diff": 4,
 "groups": [
   {"name": "WHAT A FIRE LEAVES BEHIND", "tiles": ["EMBER", "SOOT", "CINDER", "CLINKER"],
    "note": "A clinker is the fused lump left in the grate that will not burn again."},
   {"name": "SPELLED A LETTER BEFORE 1956", "tiles": ["ABLE", "EASY", "SUGAR", "OBOE"],
    "note": "Able Baker Charlie Dog ran the US military alphabet from 1941 to 1956."},
   {"name": "SHORT FOR A LATIN PHRASE", "tiles": ["VIZ.", "CF.", "IBID.", "N.B."],
    "note": "Viz. is videlicet, cf. is confer, ibid. is ibidem, N.B. is nota bene."},
   {"name": "LETTERS ENGLISH THREW AWAY", "tiles": ["THORN", "ASH", "WYNN", "YOGH"],
    "note": "Printers had no thorn, so they set a Y. That is the whole of 'ye olde'."},
 ],
 "traps": [
   ["ASH", 0, "Ash is the first word anybody reaches for when the fire has gone out"],
 ],
 "epilogue": "ASH is what a fire leaves and also a letter English dropped. The grate is full without it.",
},

]
