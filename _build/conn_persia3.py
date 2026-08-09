# -*- coding: utf-8 -*-
"""PERSIA pack, batch 3: craft, art, music and screen. Tilework and the
geometry under it, calligraphy scripts and what their names literally mean,
the radif and the instruments, pigments ground for a miniature, weaving words
that escaped the loom, and Iranian cinema seen through the vocabulary of
cinema.

Deliberately light on the Shahnameh, per the players: the epic has its own
cabinet and they do not know the lore. Nothing here rewards knowing it.
Transliteration is the plain everyday Latin spelling, no diacritics.

Ground already taken by conn_persia and avoided here: PERSIAN MUSICAL
INSTRUMENTS (tar, santur, kamancheh, tombak), CARPET-WEAVING CITIES, PERSIAN
CRAFTS, MOTIFS IN A PERSIAN CARPET, the dastgah, the classical poets and their
books and forms, and the four famous directors by surname."""

BOARDS = [

{
 "title": "Seven Colours",
 "diff": 3,
 "groups": [
   {"name": "SHADES OF BLUE", "tiles": ["COBALT", "TURQUOISE", "INDIGO", "TEAL"],
    "note": "Turquoise means Turkish, though the stone came out of a mine near Nishapur."},
   {"name": "___ WARE", "tiles": ["EARTHEN", "STONE", "SILVER", "SOFT"],
    "note": "Earthenware, stoneware, silverware, software. One never went near a kiln."},
   {"name": "HOW ISFAHAN IS DECORATED", "tiles": ["KASHI", "GIRIH", "MUQARNAS", "HAFT RANG"],
    "note": "Haft rang means seven colours and was the fast way to tile a whole mosque."},
   {"name": "A POTTER'S ORDINARY WORDS", "tiles": ["SLIP", "BISCUIT", "GLAZE", "BODY"],
    "note": "Biscuit is fired once and left bare; slip is clay thinned down to cream."},
 ],
 "traps": [
   ["SLIP", 1, "Slipware is a real category of pottery and sits on the shelf beside stoneware"],
   ["COBALT", 2, "Cobalt is the pigment that makes Isfahan blue. No cobalt, no tilework at all"],
 ],
 "epilogue": "SLIP really does make slipware and COBALT really does make the tiles. Both other groups are already full.",
},

{
 "title": "The Broken Hand",
 "diff": 4,
 "groups": [
   {"name": "WHAT A FONT CAN BE", "tiles": ["BOLD", "ITALIC", "CONDENSED", "DISPLAY"],
    "note": "Condensed is squeezed narrow; display is meant to be looked at, not read."},
   {"name": "___ HAND", "tiles": ["FREE", "SHORT", "LONG", "SECOND"],
    "note": "Freehand, shorthand, longhand, secondhand. Only one of them is a shop."},
   {"name": "SCRIPTS A CALLIGRAPHER LEARNS", "tiles": ["NASTALIQ", "SHEKASTEH", "NASKH", "THULUTH"],
    "note": "Nastaliq is the Persian one, hung from an invisible line and leaning right."},
   {"name": "WHAT THOSE SCRIPT NAMES MEAN", "tiles": ["BROKEN", "HANGING", "COPYING", "ONE THIRD"],
    "note": "Shekasteh is broken, taliq hanging, naskh copying, thuluth one third."},
 ],
 "traps": [
   ["BOLD", 1, "A bold hand is what confident handwriting has been called for centuries"],
   ["ITALIC", 2, "Italic is a calligraphic hand in its own right and is still taught as one"],
 ],
 "epilogue": "BOLD and ITALIC both have a second life next door. The four literal meanings are the honest way in.",
},

{
 "title": "Hidden Strings",
 "diff": 4,
 "groups": [
   {"name": "HOW YOU GET A NOTE OUT OF IT", "tiles": ["PLUCK", "BOW", "STRUM", "HAMMER"],
    "note": "A santur is hammered with two small mallets. Only one of these needs horsehair."},
   {"name": "PLAYED IN A PERSIAN ENSEMBLE", "tiles": ["SETAR", "DOTAR", "SANTUR", "DAYEREH"],
    "note": "Setar means three strings and has four; dotar means two and has two."},
   {"name": "WORDS FROM THE RADIF", "tiles": ["GUSHEH", "DARAMAD", "TAHRIR", "FORUD"],
    "note": "Gusheh are the short pieces. Daramad opens, forud lands, tahrir ornaments."},
   {"name": "INSTRUMENTS HIDING INSIDE", "tiles": ["GUITAR", "CHUTNEY", "DAFFODIL", "EXCHANGE"],
    "note": "gui-TAR, chut-NEY, DAF-fodil, ex-CHANG-e. The chang is the Persian harp."},
 ],
 "traps": [
   ["TAHRIR", 0, "Tahrir is something a singer does to a note, so it reads as a technique"],
   ["FORUD", 0, "Forud is the descent back to the home note, and a descent is an action"],
 ],
 "epilogue": "TAHRIR and FORUD are things you do as much as things you play. The four hidden ones are the way in.",
},

{
 "title": "Second Feature",
 "diff": 3,
 "groups": [
   {"name": "KINDS OF CAMERA SHOT", "tiles": ["WIDE", "TRACKING", "REACTION", "ESTABLISHING"],
    "note": "An establishing shot tells you where you are before anybody speaks."},
   {"name": "GOLDEN ___", "tiles": ["BEAR", "LION", "GLOBE", "HOUR"],
    "note": "Panahi has the Bear, the Lion, and since 2025 the Palme d'Or as well."},
   {"name": "IRANIAN FILMS", "tiles": ["CLOSE-UP", "OFFSIDE", "THE COW", "GABBEH"],
    "note": "Offside follows girls who dress as boys to get into a World Cup qualifier."},
   {"name": "JOBS IN THE FILM CREDITS", "tiles": ["GRIP", "GAFFER", "BEST BOY", "FOLEY"],
    "note": "The gaffer runs the lights and the grip runs everything the lights sit on."},
 ],
 "traps": [
   ["CLOSE-UP", 0, "A close-up is the plainest kind of shot there is and belongs beside the wide"],
 ],
 "epilogue": "CLOSE-UP is a shot before it is a Kiarostami film, and that is the whole board. Count the other three.",
},

]
