# -*- coding: utf-8 -*-
"""PERSIA pack — 12 boards. Nowruz, the Shahnameh, poets, food, carpets,
the loanwords English quietly took, and the diaspora kitchen table.
Transliteration is the plain everyday Latin spelling a Persian-American
household actually writes, not a scholarly scheme with diacritics."""

BOARDS = [

{
 "title": "Haft-Sin",
 "diff": 1,
 "groups": [
   {"name": "THE SEVEN S's OF THE HAFT-SIN", "tiles": ["SABZEH", "SAMANU", "SENJED", "SERKEH"],
    "note": "Sprouted wheat, wheat pudding, oleaster berries, vinegar — plus seeb (apple), seer (garlic) and somaq to make seven, all beginning with the letter sin."},
   {"name": "NOWRUZ CUSTOMS", "tiles": ["SIZDAH BEDAR", "FIRE JUMPING", "KHANE TAKANI", "EIDI"],
    "note": "Thirteenth-day picnic, the last-Wednesday bonfires of Chaharshanbe Suri, the deep spring clean, and the crisp new banknotes the elders hand out."},
   {"name": "MONTHS OF THE PERSIAN CALENDAR", "tiles": ["FARVARDIN", "ORDIBEHESHT", "KHORDAD", "ESFAND"],
    "note": "The year starts at the spring equinox with Farvardin and ends with Esfand. Iran's calendar is solar and, in astronomical terms, more accurate than the Gregorian one."},
   {"name": "ALSO ON THE NOWRUZ TABLE, BUT NOT AN 'S'", "tiles": ["GOLDFISH", "MIRROR", "CANDLES", "DIVAN OF HAFEZ"],
    "note": "The mirror for light, the candles for fire, the goldfish for life — and Hafez, opened at random on the night, to tell you how your year will go."},
 ],
 "traps": [],
 "epilogue": "The whole board sits on one table, which is the joke: eight of these things are laid out together every March and the only thing separating them is a letter of the alphabet. Say each word out loud and the sin group announces itself.",
},

{
 "title": "The Seven Trials",
 "diff": 2,
 "groups": [
   {"name": "HEROES OF THE SHAHNAMEH", "tiles": ["ROSTAM", "SOHRAB", "ESFANDIYAR", "ZAL"],
    "note": "Zal was born white-haired, abandoned, and raised by the Simorgh. His son Rostam holds the epic together for a third of its length."},
   {"name": "SHAHNAMEH VILLAINS", "tiles": ["ZAHHAK", "AFRASIYAB", "SUDABEH", "GARSIVAZ"],
    "note": "Zahhak grew serpents from his shoulders that had to be fed on human brains, which is a thousand years old and still the best villain design in the business."},
   {"name": "OBSTACLES OF ROSTAM'S HAFT KHAN", "tiles": ["LION", "DRAGON", "SORCERESS", "WHITE DEMON"],
    "note": "Seven trials on the road to Mazandaran: the lion Rakhsh kills alone, the thirst, the dragon, the sorceress, Ulad, Arzhang, and finally Div-e Sepid."},
   {"name": "ROSTAM'S HORSE, COAT AND WEAPONS", "tiles": ["RAKHSH", "BABR-E BAYAN", "GORZ", "KAMAND"],
    "note": "Rakhsh the stallion, the babr-e bayan that no weapon could pierce, the ox-headed mace and the lasso. He is the only hero whose horse gets its own reputation."},
 ],
 "traps": [
   ["WHITE DEMON", 1, "Div-e Sepid is unambiguously a villain — he blinds Kay Kavus and his whole army. He is here as the seventh trial, not as a character."],
   ["RAKHSH", 0, "Rakhsh kills a lion while Rostam sleeps and is more heroic than most of the humans in the poem. He is still a horse."],
 ],
 "epilogue": "Two tiles argue about which shelf they belong on and both lose: ZAHHAK, AFRASIYAB, SUDABEH and GARSIVAZ are already four villains, and ROSTAM, SOHRAB, ESFANDIYAR and ZAL are already four heroes. Rakhsh gets filed with the tack.",
},

{
 "title": "The Poets",
 "diff": 3,
 "groups": [
   {"name": "CLASSICAL PERSIAN POETS", "tiles": ["HAFEZ", "SAADI", "RUMI", "FERDOWSI"],
    "note": "Ferdowsi spent about thirty years on the Shahnameh and is credited with saving the Persian language from being written out of existence."},
   {"name": "THE BOOKS THEY WROTE", "tiles": ["DIVAN", "GOLESTAN", "MASNAVI", "SHAHNAMEH"],
    "note": "Hafez's Divan, Saadi's Golestan ('rose garden'), Rumi's Masnavi, Ferdowsi's Shahnameh ('book of kings'). Four books, one shelf, most Iranian homes."},
   {"name": "PERSIAN POETIC FORMS", "tiles": ["GHAZAL", "RUBAI", "QASIDA", "DOBEYTI"],
    "note": "The ghazal is the love lyric, the rubai the four-line epigram Khayyam made famous in English, the qasida the long formal ode, the dobeyti the folk couplet."},
   {"name": "CITIES WITH A POET'S TOMB", "tiles": ["SHIRAZ", "TUS", "KONYA", "NISHAPUR"],
    "note": "Hafez AND Saadi in Shiraz, Ferdowsi at Tus, Rumi at Konya in Turkey, Khayyam at Nishapur. Iranians visit these the way other countries visit battlefields."},
 ],
 "traps": [
   ["MASNAVI", 2, "The masnavi is a verse form — rhyming couplets — before it is Rumi's book. Both readings are completely correct."],
   ["DIVAN", 2, "A divan is any poet's collected works, which makes it look like a category of writing rather than one specific volume."],
 ],
 "epilogue": "Rumi's book is called The Masnavi because it is written in masnavi form, and Hafez's book is called The Divan because a divan is what a collection is called. The titles ARE the forms. GHAZAL, RUBAI, QASIDA and DOBEYTI have no such double life, so let them fill the form group first.",
},

{
 "title": "At the Sofreh",
 "diff": 2,
 "groups": [
   {"name": "KEBABS", "tiles": ["KOOBIDEH", "BARG", "JOOJEH", "SOLTANI"],
    "note": "Koobideh is minced and pounded, barg is a thin fillet, joojeh is chicken in saffron and lemon, and soltani is one skewer of each because you couldn't decide."},
   {"name": "PERSIAN STEWS", "tiles": ["GHORMEH SABZI", "FESENJAN", "GHEYMEH", "KHORESH-E BEH"],
    "note": "Ghormeh sabzi is the national dish and the one every family swears their mother makes best. Fesenjan is walnut and pomegranate, sweet and sour and dark as ink."},
   {"name": "RICE DISHES", "tiles": ["TAHCHIN", "ZERESHK POLO", "BAGHALI POLO", "ADAS POLO"],
    "note": "Polo means the rice is cooked with something in it; the real prize is tahdig, the crust at the bottom, over which families have genuinely fallen out."},
   {"name": "PERSIAN SWEETS", "tiles": ["GAZ", "SOHAN", "BAMIEH", "ZOOLBIA"],
    "note": "Gaz is Isfahan's nougat, sohan is Qom's saffron brittle, and zoolbia and bamieh are the syrup-soaked pair that appear in every Ramadan window."},
 ],
 "traps": [
   ["BAMIEH", 1, "Bamieh is also the Persian word for okra, and khoresh-e bamieh is a real stew. The pastry got the name because it is shaped like the vegetable."],
 ],
 "epilogue": "BAMIEH is a sweet named after a vegetable that names a stew, which is the most Persian sentence on this board. GAZ, SOHAN and ZOOLBIA have no such ambiguity, and the stew group is full before you get there.",
},

{
 "title": "The Map",
 "diff": 2,
 "groups": [
   {"name": "IRANIAN CITIES", "tiles": ["ISFAHAN", "SHIRAZ", "TABRIZ", "MASHHAD"],
    "note": "'Isfahan is half the world' was a 17th-century boast and, standing in Naqsh-e Jahan square, still a defensible one."},
   {"name": "IRAN'S NEIGHBOURS", "tiles": ["IRAQ", "ARMENIA", "PAKISTAN", "TURKMENISTAN"],
    "note": "Seven land borders in all: Iraq, Turkey, Armenia, Azerbaijan, Turkmenistan, Afghanistan and Pakistan."},
   {"name": "PERSIAN DYNASTIES", "tiles": ["ACHAEMENID", "SASSANID", "SAFAVID", "QAJAR"],
    "note": "Achaemenid from Cyrus, Sassanid until the Arab conquest, Safavid who made Iran Shia and built Isfahan, Qajar who lost the Caucasus and invented Iranian photography."},
   {"name": "IRAN'S WATERS AND DESERTS", "tiles": ["CASPIAN", "DASHT-E KAVIR", "LUT", "PERSIAN GULF"],
    "note": "The Lut recorded a land-surface temperature of about 70°C by satellite, among the hottest ever measured anywhere on Earth."},
 ],
 "traps": [],
 "epilogue": "Four flat categories and no tricks — this one is a geography lesson wearing a puzzle's clothes. If you know that Armenia and Iran share a short mountain border, everything else falls out.",
},

{
 "title": "Words You Already Use",
 "diff": 4,
 "groups": [
   {"name": "PERSIAN LOANWORDS YOU WEAR", "tiles": ["PYJAMAS", "SHAWL", "KHAKI", "TURBAN"],
    "note": "Pay-jama, 'leg garment'. Shal. Khak, 'dust'. Dulband, the cloth you wind round a head."},
   {"name": "PERSIAN LOANWORDS YOU EAT OR DRINK", "tiles": ["JULEP", "SPINACH", "PISTACHIO", "CANDY"],
    "note": "Golab (rosewater) became julep; esfanaj became spinach; pesteh became pistachio; qand, a lump of crystallised sugar, became candy."},
   {"name": "PERSIAN LOANWORDS THAT GROW OR GLOW", "tiles": ["LILAC", "TULIP", "JASMINE", "AZURE"],
    "note": "Nilak the bluish one, yasmin the flower, lazhward the lapis stone that gave Europe both azure and ultramarine — and tulip, from dulband again, because the flower looks like a turban."},
   {"name": "PERSIAN LOANWORDS NOBODY EXPECTS", "tiles": ["PARADISE", "CHECKMATE", "MAGIC", "MUMMY"],
    "note": "Pairidaeza, a walled garden. Shah mat, 'the king is helpless'. Magush, the Zoroastrian priest-caste the Greeks called magoi. And mum, wax — what Persian embalming used."},
 ],
 "traps": [
   ["KHAKI", 2, "Khak means dust, and khaki is a colour before it is a trouser. It has a genuine claim on the third group."],
 ],
 "epilogue": "Every tile on this board is an English word that came from Persian, so the categories are four different reasons for the same fact. TULIP and TURBAN are the same Persian word arriving twice, six hundred years apart, which is the sort of thing that happens when a language is old enough.",
},

{
 "title": "Knots and Strings",
 "diff": 3,
 "groups": [
   {"name": "PERSIAN MUSICAL INSTRUMENTS", "tiles": ["TAR", "SANTUR", "KAMANCHEH", "TOMBAK"],
    "note": "The tar's body is two joined bowls covered in lambskin; the santur is struck with tiny wooden hammers; the kamancheh is bowed and stands on a spike."},
   {"name": "CARPET-WEAVING CITIES", "tiles": ["TABRIZ", "KASHAN", "KERMAN", "NAIN"],
    "note": "You can date and place a Persian carpet from its knot count and palette alone — Nain is famously fine, Tabriz famously dense."},
   {"name": "PERSIAN CRAFTS", "tiles": ["KHATAM", "MINAKARI", "GHALAMZANI", "TERMEH"],
    "note": "Khatam is micro-mosaic marquetry, minakari is enamel on copper, ghalamzani is hammer-and-chisel engraving, termeh is the woven wool that predates paisley."},
   {"name": "MOTIFS IN A PERSIAN CARPET", "tiles": ["BOTEH", "GOL", "MEDALLION", "TREE OF LIFE"],
    "note": "The boteh is the teardrop the Scottish town of Paisley copied and got the credit for. The central medallion is the toranj."},
 ],
 "traps": [],
 "epilogue": "Two of these groups are made by hand in the same workshops and one of them is played in the next room, which is why the board feels blurrier than it is. Nothing here fits twice — the difficulty is purely in knowing which craft is which.",
},

{
 "title": "Two Thousand Years",
 "diff": 3,
 "groups": [
   {"name": "PERSIAN KINGS", "tiles": ["CYRUS", "DARIUS", "XERXES", "SHAPUR"],
    "note": "Cyrus's cylinder is often called the first charter of its kind; Shapur I captured a Roman emperor alive and carved it into a cliff at Naqsh-e Rostam."},
   {"name": "CAPITALS OF PERSIAN EMPIRES", "tiles": ["PERSEPOLIS", "CTESIPHON", "PASARGADAE", "SUSA"],
    "note": "Pasargadae was Cyrus's, Persepolis the ceremonial one Alexander burned, Susa the administrative workhorse, Ctesiphon the Parthian and Sasanian seat on the Tigris."},
   {"name": "ANCIENT PERSIAN ENGINEERING", "tiles": ["QANAT", "YAKHCHAL", "BADGIR", "CHAHAR BAGH"],
    "note": "A qanat carries groundwater tens of kilometres underground by gravity alone; a yakhchal made and kept ice in the desert; a badgir is a tower that air-conditions a house with no power at all."},
   {"name": "ZOROASTRIAN WORDS", "tiles": ["AHURA MAZDA", "AVESTA", "FARAVAHAR", "ATASHKADEH"],
    "note": "Ahura Mazda the wise lord, the Avesta the scripture, the faravahar the winged figure now worn as a necklace by half the diaspora, and the atashkadeh where the fire is kept."},
 ],
 "traps": [
   ["ATASHKADEH", 2, "A fire temple is a building with a very specific engineering problem — keeping a flame alive for centuries — so it reads as architecture as easily as religion."],
 ],
 "epilogue": "The engineering group is the one modern Iran is proudest of and the one outsiders know least: QANAT, YAKHCHAL and BADGIR are all climate technology a thousand years early. ATASHKADEH is a building too, but it belongs to the faith that built it.",
},

{
 "title": "Tehran",
 "diff": 4,
 "groups": [
   {"name": "TEHRAN LANDMARKS", "tiles": ["AZADI TOWER", "MILAD TOWER", "TABIAT BRIDGE", "GRAND BAZAAR"],
    "note": "Azadi was built in 1971 and has been the backdrop to every side of every argument since. Tabiat is a three-level pedestrian bridge designed by Leila Araghian, who was 26."},
   {"name": "MOUNTAINS ABOVE THE CITY", "tiles": ["DAMAVAND", "ALBORZ", "TOCHAL", "DARBAND"],
    "note": "Damavand is 5,610 m, the highest peak in the Middle East, and in the Shahnameh it is where Fereydun chains Zahhak."},
   {"name": "IRANIAN FILMMAKERS", "tiles": ["KIAROSTAMI", "FARHADI", "PANAHI", "MAKHMALBAF"],
    "note": "Kiarostami took the Palme d'Or in 1997, Farhadi has two foreign-language Oscars, and Panahi has made several films while banned from making films."},
   {"name": "PERSIAN FAMILY WORDS", "tiles": ["MADAR", "PEDAR", "KHAHAR", "BARADAR"],
    "note": "Mother, father, sister, brother — and if you look at them long enough you can see the Indo-European family resemblance to the English ones."},
 ],
 "traps": [
   ["TOCHAL", 0, "Tochal has a gondola, a ski resort and a complex at the top of it. Plenty of Tehranis would call it a landmark before they called it a mountain."],
 ],
 "epilogue": "TOCHAL is the argument: it is a peak with a tourist attraction bolted to it. DAMAVAND, ALBORZ and DARBAND are unarguably geology, and AZADI TOWER, MILAD TOWER, TABIAT BRIDGE and GRAND BAZAAR are unarguably built, so the mountain keeps its rock.",
},

{
 "title": "Rose and Nightingale",
 "diff": 4,
 "groups": [
   {"name": "DASTGAH — THE PERSIAN MUSICAL MODES", "tiles": ["SHUR", "MAHUR", "HOMAYUN", "SEGAH"],
    "note": "Seven dastgah and five avaz between them cover the whole classical repertoire. Shur is the melancholy one and by far the most used."},
   {"name": "GREAT IRANIAN SINGERS", "tiles": ["SHAJARIAN", "GOOGOOSH", "BANAN", "DELKASH"],
    "note": "Shajarian's 'Rabbana' is played every Ramadan; Googoosh was the pop star of a whole era and then did not sing in public for twenty-one years."},
   {"name": "SUFI WORDS YOU'D HEAR IN PERSIAN", "tiles": ["SAMA", "FANA", "ISHQ", "DERVISH"],
    "note": "Sama is the listening-and-turning ceremony, fana the annihilation of the self, ishq the love that causes it, dervish the one who has given up owning things."},
   {"name": "THE STOCK IMAGES OF A GHAZAL", "tiles": ["ROSE", "NIGHTINGALE", "WINE", "MOTH"],
    "note": "Gol and bolbol, the rose and the nightingale who loves her hopelessly; the wine that may or may not be actual wine; the moth who flies into the candle on purpose."},
 ],
 "traps": [
   ["WINE", 2, "Wine is the central Sufi metaphor for divine intoxication — Hafez's whole reputation rests on the ambiguity. It has a real claim on the Sufi group."],
 ],
 "epilogue": "Persian poetry and Persian mysticism use the same words on purpose, so WINE genuinely belongs to two worlds — that ambiguity is the art form, not a bug in the puzzle. The clean line is language: SAMA, FANA, ISHQ and DERVISH are Persian words carried into English, and ROSE, NIGHTINGALE, WINE and MOTH are plain English nouns doing symbolic work.",
},

{
 "title": "The Kitchen Table",
 "diff": 4,
 "groups": [
   {"name": "PERSIAN INGREDIENTS ON AN AMERICAN SHELF", "tiles": ["SAFFRON", "BARBERRIES", "ROSEWATER", "POMEGRANATE"],
    "note": "Saffron is bloomed in hot water first, never sprinkled dry; barberries are fried in butter for thirty seconds and no longer or they turn black."},
   {"name": "PERSIAN NAMES THAT MEAN A FLOWER", "tiles": ["YASMIN", "NILOOFAR", "LALEH", "GOLNAR"],
    "note": "Jasmine, water lily, tulip, and pomegranate blossom. Persian first names are frequently just the nicest noun available."},
   {"name": "ON THE SOFREH AQD", "tiles": ["MIRROR", "CANDELABRA", "ESFAND", "HONEY"],
    "note": "The bride sees her groom first in the mirror; esfand seeds burn against the evil eye; the couple feed each other honey so the marriage starts sweet."},
   {"name": "WHAT THEY ACTUALLY SAY TO YOU", "tiles": ["GHORBOONET", "JOON", "AZIZAM", "TAAROF"],
    "note": "'May I be sacrificed for you' as a casual goodbye; 'joon' after your name as affection; 'azizam' for my dear; and taarof, the ritual refusal that everybody performs and nobody means."},
 ],
 "traps": [
   ["ROSEWATER", 2, "Golab is sprinkled over guests at a wedding as often as it is poured into a dessert. It is a sofreh item with a receipt from the grocery store."],
   ["ESFAND", 3, "Esfand is also the last month of the Persian year, and the word turns up in conversation constantly — but here it is the seed you burn."],
 ],
 "epilogue": "This board is somebody's actual house. ROSEWATER and ESFAND live in two rooms of it at once, which is why the resolution has to come from the tiles that don't: SAFFRON, BARBERRIES and POMEGRANATE are groceries, MIRROR, CANDELABRA and HONEY are wedding, and the rest sorts itself.",
},

{
 "title": "Count to Four",
 "diff": 5,
 "groups": [
   {"name": "PRINCES OF THE SHAHNAMEH WHO DIE YOUNG", "tiles": ["IRAJ", "SIYAVASH", "SOHRAB", "ESFANDIYAR"],
    "note": "Iraj murdered by his brothers, Siyavash beheaded in exile, Sohrab killed by a father who didn't know him, Esfandiyar shot through both eyes by Rostam on Simorgh's advice. The epic is mostly a book about fathers and sons going wrong."},
   {"name": "PERSIAN WORDS FOR POWER", "tiles": ["SHAH", "SHAHANSHAH", "VIZIER", "SATRAP"],
    "note": "King, king of kings, the minister who runs everything, and the provincial governor whose title the Greeks borrowed and never gave back."},
   {"name": "CREATURES OF PERSIAN MYTH", "tiles": ["SIMORGH", "DIV", "PERI", "HOMA"],
    "note": "The Simorgh is a benevolent giant bird; a div is a demon; a peri is where the word 'fairy' partly comes from; the homa never lands and whoever its shadow falls on becomes king."},
   {"name": "COUNT TO FOUR IN PERSIAN", "tiles": ["YEK", "DO", "SE", "CHAHAR"],
    "note": "Yek, do, se, chahar. 'Do' is two, which is why Chaharshanbe is the fourth day and the bonfire night is the last one of the year."},
 ],
 "traps": [
   ["ESFANDIYAR", 2, "Esfandiyar was made invulnerable by Zoroaster and could only be killed by a very particular arrow. On a board with a mythical-creatures group, he reads as more-than-human."],
 ],
 "epilogue": "The hardest board in the pack, and the way in is the smallest tiles: YEK, DO, SE and CHAHAR are two and three letters long and mean nothing in English, which is exactly the shape of a purple. Solve those four first and the epic sorts itself out behind them.",
},

]
