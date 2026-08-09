# -*- coding: utf-8 -*-
"""GENERAL pack, batch 11: the body, medicine, the mind and sleep. Four ordinary
objects turn out to be one ear, four mood words turn out to be one abandoned
medical system, and several perfectly innocent nouns are quietly anaesthetics."""

BOARDS = [

{
 "title": "In One Ear",
 "diff": 3,
 "groups": [
   {"name": "___ AID", "tiles": ["HEARING", "FIRST", "LEGAL", "BAND"],
    "note": "Earle Dickson invented the Band-Aid for his accident-prone wife."},
   {"name": "WORDS MEANING DIZZY", "tiles": ["GIDDY", "WOOZY", "REELING", "SWIMMING"],
    "note": "Giddy first meant possessed by a god, which is a stronger claim."},
   {"name": "___ HEAD", "tiles": ["EGG", "HOT", "FIGURE", "SPEAR"],
    "note": "Egghead, hothead, figurehead, spearhead. Only one actually leads."},
   {"name": "IN THE EAR", "tiles": ["HAMMER", "ANVIL", "STIRRUP", "DRUM"],
    "note": "Malleus, incus and stapes translate as hammer, anvil and stirrup."},
 ],
 "traps": [
   ["HAMMER", 2, "A hammerhead is the shark everyone can draw, and the word is right there"],
   ["DRUM", 2, "A drumhead is the skin you hit, and a drumhead trial is the fast kind"],
 ],
 "epilogue": "HAMMER and DRUM both take HEAD. Hammer, anvil and stirrup are the three smallest bones you own.",
},

{
 "title": "Sleeping On It",
 "diff": 2,
 "groups": [
   {"name": "WORDS FOR A SHORT SLEEP", "tiles": ["NAP", "KIP", "DOZE", "SNOOZE"],
    "note": "Kip is British and began as a word for a cheap lodging house."},
   {"name": "NIGHT ___", "tiles": ["MARE", "OWL", "CAP", "TIME"],
    "note": "The mare in nightmare is a crushing spirit, not a horse."},
   {"name": "ON THE WARD", "tiles": ["CHART", "DRIP", "BUZZER", "TRAY"],
    "note": "Three of them are for the patient. The chart is for everybody else."},
   {"name": "BED ___", "tiles": ["ROCK", "LAM", "PAN", "SIDE"],
    "note": "Bedrock, bedlam, bedpan, bedside. Bedlam was a real London hospital."},
 ],
 "traps": [
   ["TIME", 3, "Bedtime is as ordinary a word as nighttime and sits in exactly the same slot"],
   ["PAN", 2, "A bedpan is ward equipment before it is anything else, and it belongs there"],
 ],
 "epilogue": "NIGHTTIME and BEDTIME are both words, and a PAN is ward kit either way. Only one split leaves four fours.",
},

{
 "title": "Out of Balance",
 "diff": 4,
 "groups": [
   {"name": "___ PRESSURE", "tiles": ["BLOOD", "PEER", "AIR", "WATER"],
    "note": "Only one of the four is measured in millimetres of mercury."},
   {"name": "WORDS MEANING BAD-TEMPERED", "tiles": ["TESTY", "CRABBY", "SHIRTY", "PRICKLY"],
    "note": "Testy meant headstrong first: teste is Old French for head."},
   {"name": "ORGANS HIDING INSIDE", "tiles": ["SLIVER", "PLUNGER", "COLONEL", "HEARTH"],
    "note": "s-LIVER, p-LUNG-er, COLON-el, HEART-h. Four organs, four innocent words."},
   {"name": "ONE FOR EACH OF THE FOUR HUMOURS", "tiles": ["SANGUINE", "PHLEGMATIC", "CHOLERIC", "MELANCHOLIC"],
    "note": "Blood, phlegm, yellow bile, black bile. The moods outlived the medicine."},
 ],
 "traps": [
   ["BLOOD", 3, "Blood is not merely near the humours, it is one of the four of them"],
   ["CHOLERIC", 1, "Choleric means quick to anger, which is the entire job of the second group"],
 ],
 "epilogue": "BLOOD is a humour and CHOLERIC is bad-tempered. The system wants its four adjectives, not its ingredients.",
},

{
 "title": "Show of Hands",
 "diff": 3,
 "groups": [
   {"name": "KINDS OF ELECTION", "tiles": ["SNAP", "PRIMARY", "MIDTERM", "RUNOFF"],
    "note": "A snap election is called early on purpose. A runoff is called again."},
   {"name": "WORDS MEANING NUMB", "tiles": ["DEAD", "ASLEEP", "WOODEN", "DULL"],
    "note": "A leg that has gone to sleep is asleep, dead and wooden all at once."},
   {"name": "ANAGRAMS OF BODY PARTS", "tiles": ["EARTH", "VINE", "SNIPE", "ROOTS"],
    "note": "Shuffle them and you get heart, vein, spine and torso."},
   {"name": "KINDS OF ANAESTHETIC", "tiles": ["GENERAL", "LOCAL", "SPINAL", "EPIDURAL"],
    "note": "General, local, spinal, epidural. Only one of them puts you out."},
 ],
 "traps": [
   ["GENERAL", 0, "A general election is the one everybody means when they say the election"],
   ["LOCAL", 0, "Local elections are a fixture of the calendar in Britain and America both"],
 ],
 "epilogue": "GENERAL and LOCAL are elections before they are anaesthetics. SNAP, PRIMARY, MIDTERM and RUNOFF got there first.",
},

]
