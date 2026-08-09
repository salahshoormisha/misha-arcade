# -*- coding: utf-8 -*-
"""PERSIA pack, batch 2: the table and the garden. The tea ritual and the
teahouse, the sweet trolley, the herb plate, torshi, the crust at the bottom
of the rice pot, ajil, the street cart, breakfast, the walled garden and the
longest night of the year.

Deliberately light on Shahnameh lore (players' instruction) — the epic has its
own cabinet. Every board carries English wordplay alongside the Persian
knowledge, so a solver who has never eaten a sabzi plate still has a way in.
Transliteration is the plain everyday Latin spelling a Persian-American
household writes, not a scholarly scheme."""

BOARDS = [

{
 "title": "Sabzi Khordan",
 "diff": 3,
 "groups": [
   {"name": "___ POT", "tiles": ["JACK", "FLOWER", "MELTING", "STOCK"],
    "note": "Jackpot, flowerpot, melting pot, stockpot. Only one of them has ever held soup."},
   {"name": "ALSO ON THE SABZI PLATE", "tiles": ["RADISH", "FETA", "WALNUTS", "SCALLIONS"],
    "note": "The plate is not only herbs. Salt cheese and walnuts do the heavy lifting."},
   {"name": "PERSIAN HERB NAMES", "tiles": ["TARKHOON", "REYHAN", "SHEVID", "TAREH"],
    "note": "Tarragon, basil, dill, chives. Shevid is the one that turns the rice green."},
   {"name": "A HERB HIDING IN THE WORD", "tiles": ["ARMADILLO", "BASILICA", "ARCHIVE", "MESSAGE"],
    "note": "arma-DILL-o, BASIL-ica, ar-CHIVE, mes-SAGE. Four herbs, no cooking."},
 ],
 "traps": [
   ["TAREH", 1, "Tareh is laid out on the sabzi plate next to the radishes, so it is on it"],
   ["REYHAN", 1, "Basil is the herb the whole plate is built around, and it is served whole"],
 ],
 "epilogue": "Every Persian herb here is on the plate as well. The plate group is already full of things that are not herbs.",
},

{
 "title": "How You Take It",
 "diff": 4,
 "groups": [
   {"name": "WHAT A KETTLE DOES", "tiles": ["BOIL", "WHISTLE", "STEAM", "SING"],
    "note": "A kettle sings before it whistles, which is the only warning you get."},
   {"name": "SERVED WITH THE TEA", "tiles": ["NABAT", "KHORMA", "NOGHL", "GAZ"],
    "note": "Saffron rock sugar, dates, sugared almond slivers, Isfahan nougat."},
   {"name": "IN A PERSIAN TEAHOUSE", "tiles": ["TAKHT", "NARD", "DIZI", "GHALYAN"],
    "note": "A takht is the raised carpeted platform you climb onto and do not leave."},
   {"name": "TEA HIDING IN THE WORD", "tiles": ["CHATEAU", "INSTEAD", "PROTEAN", "STEALTH"],
    "note": "cha-TEA-u, ins-TEA-d, pro-TEA-n, s-TEA-lth. The chateau hides both words."},
 ],
 "traps": [
   ["STEAM", 3, "s-TEA-m hides the drink in plain sight exactly the way the other four do"],
   ["NABAT", 2, "A nabat stick arrives with the glass in every teahouse in the country"],
 ],
 "epilogue": "STEAM hides a TEA and NABAT is a teahouse fixture. Both of those groups were full before either turned up.",
},

{
 "title": "The Sweet Trolley",
 "diff": 2,
 "groups": [
   {"name": "WORDS MEANING SICKLY SWEET", "tiles": ["CLOYING", "SYRUPY", "TREACLY", "HONEYED"],
    "note": "All four describe a pudding you regret about four spoons in."},
   {"name": "SUGAR ___", "tiles": ["CUBE", "CANE", "RUSH", "LOAF"],
    "note": "Sugar cube, cane, rush, loaf. The loaf was a cone you chipped at."},
   {"name": "SWEETS NAMED AFTER SOMETHING ELSE", "tiles": ["BAMIEH", "PASHMAK", "GOOSH-E FIL", "ZABAN"],
    "note": "Okra, wool, an elephant's ear and a tongue. None of them is any of those."},
   {"name": "ONE LETTER FROM A PUDDING", "tiles": ["MOUSE", "SUNDAY", "RIFLE", "HALVE"],
    "note": "Mousse, sundae, trifle, halva. One letter each and dessert is served."},
 ],
 "traps": [
   ["TREACLY", 3, "TREACLY is one letter off TREACLE, and treacle sponge is a pudding"],
   ["CANE", 3, "Swap the N for a K and CANE is CAKE, which is as pudding as it gets"],
 ],
 "epilogue": "TREACLY and CANE are both one letter from a pudding. The pudding group filled up without either of them.",
},

{
 "title": "The Fruit Bowl",
 "diff": 3,
 "groups": [
   {"name": "___ TREE", "tiles": ["PEACH", "FAMILY", "SHOE", "PALM"],
    "note": "Peach, family, shoe, palm. Only one of them ever needs watering."},
   {"name": "PERSIAN FOR A FRUIT", "tiles": ["ANAR", "ANGOOR", "HOLU", "ALBALOO"],
    "note": "Pomegranate, grape, peach, sour cherry. Albaloo is the jam and the syrup."},
   {"name": "FRUIT NAMED AFTER A PLACE", "tiles": ["DAMSON", "CURRANT", "TANGERINE", "CANTALOUPE"],
    "note": "Damascus, Corinth, Tangier, and an estate outside Rome called Cantalupo."},
   {"name": "WATER ___", "tiles": ["MELON", "CRESS", "FALL", "MARK"],
    "note": "Watermelon, watercress, waterfall, watermark. Two of them are salad."},
 ],
 "traps": [
   ["PEACH", 2, "Peach is from persicum, the Persian apple — the most place-named fruit going"],
 ],
 "epilogue": "PEACH is Latin for the Persian apple, which makes it place-named too. The tree group wants it back.",
},

]
