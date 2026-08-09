# -*- coding: utf-8 -*-
"""GENERAL pack, batch 10: myth, folklore and superstition. Gods hide inside
ordinary words, fairy tales turn out to have been edited, the tarot and the
tea leaves argue about who saw it first, and several perfectly dull nouns are
one shuffle away from something with teeth."""

BOARDS = [

{
 "title": "Touch Wood",
 "diff": 2,
 "groups": [
   {"name": "WITCH ___", "tiles": ["HAZEL", "HUNT", "DOCTOR", "CRAFT"],
    "note": "Witch hazel, witch hunt, witch doctor, witchcraft. One is a shrub."},
   {"name": "SAID TO BRING BAD LUCK", "tiles": ["LADDER", "MIRROR", "MAGPIE", "UMBRELLA"],
    "note": "Walk under it, break it, see one alone, open one indoors."},
   {"name": "SUPPOSED TO KEEP EVIL OUT", "tiles": ["SALT", "IRON", "SILVER", "GARLIC"],
    "note": "Iron for fairies, silver for wolves, salt for ghosts, garlic for vampires."},
   {"name": "HOMOPHONES OF FOLKLORE FIGURES", "tiles": ["FERRY", "WHICH", "FAWN", "SEAR"],
    "note": "Fairy, witch, faun, seer. Say them aloud and the grid changes."},
 ],
 "traps": [
   ["HAZEL", 2, "Hazel is the protective wood in British folklore: wands, dowsing rods, charms over the door"],
   ["MIRROR", 2, "Mirrors were covered at a death so the soul could not be caught in one"],
   ["WHICH", 0, "WHICH sounds exactly like the word the whole first group is built on"],
 ],
 "epilogue": "HAZEL guards a doorway and a MIRROR gets covered at a death. WHICH only sounds like the first group.",
},

{
 "title": "Household Gods",
 "diff": 3,
 "groups": [
   {"name": "GREEK MONSTERS", "tiles": ["MINOTAUR", "CYCLOPS", "GORGON", "CHIMERA"],
    "note": "Lion at the front, goat in the middle, snake for a tail: the Chimera."},
   {"name": "A GOD BURIED IN THE WORD", "tiles": ["IODINE", "AUTHOR", "SHELTER", "COMPANION"],
    "note": "i-ODIN-e, au-THOR, s-HEL-ter, com-PAN-ion. None of them meant to."},
   {"name": "ONCE A NAME, NOW A WORD", "tiles": ["PANIC", "MENTOR", "CEREAL", "MORPHINE"],
    "note": "Pan, the old tutor in the Odyssey, Ceres, and the god of dreams."},
   {"name": "ANAGRAMS OF GREEK GODS", "tiles": ["HARE", "EARS", "ROSE", "SHADE"],
    "note": "Shuffle each of them and you get Hera, Ares, Eros and Hades."},
 ],
 "traps": [
   ["PANIC", 1, "PANIC has Pan sitting at the front of it, god and all, which is the buried-god trick"],
   ["CHIMERA", 2, "A chimera is an ordinary English word now, and a real thing in genetics"],
   ["SHADE", 0, "The shades are the Greek dead, which reads as a mythical being before it reads as a shuffle"],
 ],
 "epilogue": "PANIC really is Pan, CHIMERA really is a word you can use, and SHADE is what the Greek dead were called.",
},

{
 "title": "Once Upon a Time",
 "diff": 1,
 "groups": [
   {"name": "___ TALE", "tiles": ["FAIRY", "TALL", "FOLK", "CAUTIONARY"],
    "note": "Fairy tale, tall tale, folk tale, cautionary tale. All four are warnings."},
   {"name": "WHO THE HERO IS UP AGAINST", "tiles": ["STEPMOTHER", "WOLF", "OGRE", "GIANT"],
    "note": "The Grimms rewrote several real mothers into stepmothers between editions."},
   {"name": "WHAT MOVES THE PLOT ALONG", "tiles": ["SPINDLE", "APPLE", "SLIPPER", "BREADCRUMBS"],
    "note": "A spindle, a poisoned apple, a lost slipper, and a trail the birds ate."},
   {"name": "A MONSTER HIDING INSIDE", "tiles": ["SHELF", "STROLL", "SNAPDRAGON", "GLIMPSE"],
    "note": "sh-ELF, s-TROLL, snap-DRAGON, gl-IMP-se. Four beasts, four dull words."},
 ],
 "traps": [
   ["APPLE", 1, "The poisoned apple does more damage than the giant does, which makes it the villain"],
   ["FAIRY", 1, "In the older versions the fairy is the danger, not the help"],
 ],
 "epilogue": "FAIRY looks like trouble and the APPLE does the actual harm. The real monsters are inside four dull words.",
},

{
 "title": "Reading the Signs",
 "diff": 3,
 "groups": [
   {"name": "WAYS TO TELL THE FUTURE", "tiles": ["TAROT", "PALMISTRY", "TEA LEAVES", "RUNES"],
    "note": "Cards, hands, dregs and carved stones. Four methods, no track record."},
   {"name": "MAJOR ARCANA CARDS", "tiles": ["HERMIT", "CHARIOT", "TOWER", "JUDGEMENT"],
    "note": "The Tower is the one nobody wants. The Hermit is a man with a lamp."},
   {"name": "BIRDS THAT ARE OMENS", "tiles": ["RAVEN", "OWL", "ALBATROSS", "ROBIN"],
    "note": "A robin at the window, an owl in daylight, and never the albatross."},
   {"name": "AN OMEN, SPELLED OUT INSIDE", "tiles": ["MOMENT", "WOMEN", "ABDOMEN", "PHENOMENON"],
    "note": "m-OMEN-t, w-OMEN, abd-OMEN, phen-OMEN-on. Four sightings, one word."},
 ],
 "traps": [
   ["TAROT", 1, "The Major Arcana is a tarot thing, so TAROT wants to sit with the cards it deals"],
   ["RAVEN", 0, "Reading the flight of birds is augury, and it is older than any of the other three"],
 ],
 "epilogue": "TAROT deals the Major Arcana and RAVENS were read long before it. The last four merely contain the word.",
},

]
