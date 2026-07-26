# -*- coding: utf-8 -*-
"""JEWISH pack — 10 boards. Jewish culture and Israel: holidays, food, the
Yiddish and Hebrew that English quietly absorbed, texts, music, history, the
diaspora map, and modern Hebrew.

House rule, same as the PERSIA pack: this is a culture, not a quiz about a
conflict. There is NO politics-as-punchline board and no board that rewards
knowing a casualty figure or a party name. Israel appears the way Iran appears
in `persia` — through breakfast, slang, a map and a revived language.

Deliberately not only Ashkenazi: Sephardi, Mizrahi and Romaniote lines run
through boards 5 and 9, and board 5's Mizrahi group ends in Tehran, which is
where the other signature pack starts.

Transliteration is the everyday Latin spelling an English-speaking household
writes (CHALLAH, not ḥallah), and the plain forms people say out loud.
"""

BOARDS = [

{
 "title": "Friday Night",
 "diff": 2,
 "groups": [
   {"name": "SHABBAT, START TO FINISH", "tiles": ["CANDLES", "KIDDUSH", "CHALLAH", "HAVDALAH"],
    "note": "Two candles to open it, wine and the blessing over it, the braided loaf under its cover — and havdalah, the spice-and-candle ceremony that hands you back to Tuesday."},
   {"name": "ON AN ASHKENAZI FRIDAY-NIGHT TABLE", "tiles": ["GEFILTE FISH", "CHICKEN SOUP", "CHOLENT", "KUGEL"],
    "note": "Cholent is the point: a stew left on a low flame from before sundown, invented entirely so that a hot meal could be eaten on a day when you cannot cook."},
   {"name": "AMONG THE 39 FORBIDDEN LABOURS", "tiles": ["KINDLING", "WRITING", "CARRYING", "REAPING"],
    "note": "The 39 melachot are derived from the building of the Tabernacle, which is why 'reaping' is on a list that also governs whether you may switch on a light."},
   {"name": "___ TOV", "tiles": ["MAZEL", "SHAVUA", "YOM", "SIMAN"],
    "note": "Mazel tov (good luck, said as congratulations), shavua tov (good week, said after havdalah), yom tov (a festival day), siman tov (a good sign — the wedding song)."},
 ],
 "traps": [
   ["CHALLAH", 1, "Challah is food on a table full of food, and it is the first thing anybody eats — it has a completely honest claim on the menu group."],
   ["KINDLING", 0, "Lighting the candles is the last kindling anyone does before the rest starts, so the word sits in both halves of the same evening."],
 ],
 "epilogue": "The whole board is one evening in a house, which is why two tiles look like they are in the wrong room. Both are pinned by arithmetic: GEFILTE FISH, CHICKEN SOUP, CHOLENT and KUGEL are already four courses, and CANDLES, KIDDUSH and HAVDALAH need a fourth that is part of the ritual rather than the meal.",
},

{
 "title": "The Autumn",
 "diff": 3,
 "groups": [
   {"name": "THE AUTUMN HOLIDAYS, IN ORDER", "tiles": ["ROSH HASHANAH", "YOM KIPPUR", "SUKKOT", "SIMCHAT TORAH"],
    "note": "New year, the day of atonement ten days later, the week in a hut with a roof you can see stars through, and then the dancing when the Torah is rolled back to the beginning."},
   {"name": "EATEN ON ONE PARTICULAR HOLIDAY", "tiles": ["HONEY CAKE", "LATKES", "HAMANTASCHEN", "MATZAH"],
    "note": "Honey cake for a sweet new year, latkes fried in oil for Hanukkah, hamantaschen shaped like a villain's hat for Purim, matzah for the week you own no bread."},
   {"name": "MONTHS OF THE HEBREW CALENDAR", "tiles": ["TISHREI", "NISAN", "ELUL", "ADAR"],
    "note": "A lunar year with a leap month bolted on seven times every nineteen years, which is how Passover stays in spring while the months keep moving."},
   {"name": "THE MISHNAH SAYS THERE IS A NEW YEAR FOR THESE", "tiles": ["YEARS", "KINGS", "CATTLE", "TREES"],
    "note": "Four new years, opening line of Mishnah Rosh Hashanah: the first of Nisan for kings, the first of Elul for tithing animals, the first of Tishrei for years, and Tu BiShvat for trees."},
 ],
 "traps": [
   ["NISAN", 3, "Nisan IS one of the four new years — the one for kings — so the month reads as an answer to the purple rather than as a month."],
 ],
 "epilogue": "The purple is the oldest joke in the calendar: the rabbis counted four separate new years and put them in the first sentence of the tractate about the new year. NISAN is named in that sentence, which is exactly why it cannot leave the month group — TISHREI, ELUL and ADAR need a fourth, and YEARS, KINGS, CATTLE and TREES are already a full set of birthdays.",
},

{
 "title": "Words You Already Use",
 "diff": 3,
 "groups": [
   {"name": "YIDDISH VERBS ENGLISH ADOPTED", "tiles": ["SCHLEP", "KVETCH", "SCHMOOZE", "NOSH"],
    "note": "Schlepn (to drag), kvetshn (to squeeze — hence to complain), shmuesn (to chat), nashn (to nibble). English took the verbs and left the grammar."},
   {"name": "YIDDISH FOR A TYPE OF PERSON", "tiles": ["MENSCH", "SCHLEMIEL", "NUDNIK", "YENTA"],
    "note": "A mensch is a person you can rely on; a schlemiel spills the soup and a schlimazel is who it lands on; a nudnik asks the schlemiel how the soup was."},
   {"name": "HEBREW WORDS ENGLISH TOOK, USUALLY VIA THE BIBLE", "tiles": ["AMEN", "JUBILEE", "BEHEMOTH", "SABBATICAL"],
    "note": "Amen ('so be it'), yovel (the ram's-horn year of release) into jubilee, b'hemot (beasts) into behemoth, and shabbat into the year off that professors get."},
   {"name": "___ NIK", "tiles": ["BEAT", "SPUT", "REFUSE", "KIBBUTZ"],
    "note": "The -nik suffix arrived in English through Yiddish and Russian together: beatnik and sputnik made it a joke ending, refusenik and kibbutznik made it a political one."},
 ],
 "traps": [
   ["KIBBUTZ", 2, "Kibbutz is a Hebrew word sitting in every English dictionary, which is precisely the blue category's definition — it is here for the suffix instead."],
   ["NOSH", 1, "'A nosh' is a thing and 'a nosher' is a person, and the tile is short enough to look like it belongs with the character studies."],
 ],
 "epilogue": "Three groups of borrowed words and one group of suffixes, so the sorting question is grammatical: is the tile a verb, a person, or a stem waiting for -NIK? KIBBUTZ is the honest double-fit and it loses because AMEN, JUBILEE, BEHEMOTH and SABBATICAL are four Hebrew imports already, while BEAT, SPUT and REFUSE are three fragments that mean nothing on their own.",
},

{
 "title": "The Appetizing Store",
 "diff": 2,
 "groups": [
   {"name": "FROM THE APPETIZING COUNTER", "tiles": ["LOX", "WHITEFISH", "SABLE", "SCHMEAR"],
    "note": "An appetizing store sells the things you put on a bagel and a delicatessen sells meat, because kosher rules keep fish and flesh in separate shops — a dietary law that became a retail category."},
   {"name": "FROM THE DELI COUNTER", "tiles": ["PASTRAMI", "CORNED BEEF", "BRISKET", "TONGUE"],
    "note": "Pastrami came to New York with Romanian Jews, corned beef with Irish and Jewish New York at once, and both are the same cut argued about in two accents."},
   {"name": "FROM THE JEWISH BAKERY", "tiles": ["BABKA", "RUGELACH", "BIALY", "BAGEL"],
    "note": "A bialy is a bagel's flatter cousin from Bialystok with onion in the dimple and no boiling step, which is why it goes stale by lunchtime."},
   {"name": "___ SALT", "tiles": ["SEA", "ROCK", "TABLE", "KOSHER"],
    "note": "Kosher salt is not kosher salt — it is koshering salt, the coarse grain used to draw blood out of meat, and the name stuck to the box."},
 ],
 "traps": [
   ["BAGEL", 0, "The bagel arrives with the lox and the schmear already on it, and nobody thinks of it as a bakery item until the bakery group is short."],
   ["BRISKET", 2, "Brisket is the holiday centrepiece as often as it is a deli meat, and this board's third group is where the holiday food would live if there were one."],
 ],
 "epilogue": "Three counters and a box of salt. BAGEL is the tile everyone puts in the wrong shop, and the fix is the one fact this board is built on: fish and meat are sold in different premises, so LOX, WHITEFISH, SABLE and SCHMEAR are a complete counter without it, and BABKA, RUGELACH and BIALY are three-quarters of a bakery waiting.",
},

{
 "title": "The Map of Everywhere Else",
 "diff": 4,
 "groups": [
   {"name": "CAPITALS OF THE YIDDISH-SPEAKING WORLD", "tiles": ["VILNA", "WARSAW", "ODESSA", "LODZ"],
    "note": "Vilna was called the Jerusalem of Lithuania for its scholars and its printing presses; Odessa was the joke-telling, opera-going, gloriously secular one."},
   {"name": "SEPHARDI CITIES BEFORE AND AFTER 1492", "tiles": ["TOLEDO", "SALONICA", "FEZ", "IZMIR"],
    "note": "Toledo emptied in 1492 and Salonica filled up: by the 19th century the port of Salonica was so Jewish that it closed on Saturdays."},
   {"name": "WHERE THE MIZRAHI COMMUNITIES CAME FROM", "tiles": ["BAGHDAD", "ALEPPO", "SANA'A", "TEHRAN"],
    "note": "Baghdad was roughly a quarter Jewish in the 1920s. Almost all of these communities left between 1948 and 1979, and Tehran's is the largest one still there."},
   {"name": "NEIGHBOURHOODS WITH A KOSHER HIGH STREET", "tiles": ["GOLDERS GREEN", "STAMFORD HILL", "BOROUGH PARK", "BROOKLINE"],
    "note": "Golders Green and Stamford Hill for London, Borough Park for Brooklyn, Brookline for Boston — four places where the bakeries shut early on Friday."},
 ],
 "traps": [
   ["IZMIR", 2, "Izmir was Ottoman, Ladino-speaking and eastern all at once — the Sephardi/Mizrahi line runs straight through it, which is why it reads as either."],
   ["BROOKLINE", 1, "Brookline is a place name that sounds like a Massachusetts suburb because it is one, and the only group it obviously is not in is the one about 1492."],
 ],
 "epilogue": "Every tile is somewhere people lived, so type tells you nothing and only history sorts it. IZMIR is the genuine double-fit — the labels Sephardi and Mizrahi were invented later and do not cut cleanly through the Ottoman Aegean. It stays put because BAGHDAD, ALEPPO, SANA'A and TEHRAN are four already, and because TOLEDO, SALONICA and FEZ need a fourth port.",
},

{
 "title": "The Bookshelf",
 "diff": 4,
 "groups": [
   {"name": "BOOKS OF THE TORAH, IN HEBREW", "tiles": ["BERESHIT", "SHEMOT", "VAYIKRA", "BAMIDBAR"],
    "note": "In the beginning, Names, And He Called, In the Wilderness — each book is named for one of its own first few words, then Devarim makes five."},
   {"name": "THE RABBINIC SHELF", "tiles": ["MISHNAH", "GEMARA", "MIDRASH", "SHULCHAN ARUCH"],
    "note": "Mishnah plus Gemara equals Talmud; midrash is the storytelling around the edges; the Shulchan Aruch is Joseph Karo's 16th-century one-volume answer to 'but what do I actually do?'"},
   {"name": "MEDIEVAL GIANTS", "tiles": ["RASHI", "MAIMONIDES", "IBN EZRA", "JUDAH HALEVI"],
    "note": "Rashi in Champagne, Maimonides in Cordoba and then Cairo, Ibn Ezra everywhere, Judah Halevi writing love poems to a city he died trying to reach."},
   {"name": "THERE ARE TEN OF THESE", "tiles": ["COMMANDMENTS", "PLAGUES", "SEFIROT", "LOST TRIBES"],
    "note": "Ten utterances at Sinai, ten plagues in Egypt, ten sefirot in the kabbalistic diagram of everything, and ten tribes that walked off the map after 722 BCE."},
 ],
 "traps": [
   ["RASHI", 1, "Rashi's commentary is printed on the same page as the Gemara in every standard edition — the man and the shelf are physically inseparable."],
   ["MIDRASH", 0, "Midrash is mostly commentary on the Torah's own text, so it reads as part of the Torah group until you notice nobody calls it a book of the Torah."],
 ],
 "epilogue": "Two groups of titles, one of authors, one of numbers, and the difficulty is that the authors ARE titles in Jewish shorthand — you say 'the Rashi' meaning the commentary. BERESHIT, SHEMOT, VAYIKRA and BAMIDBAR are four fixed points, so MIDRASH stays on the rabbinic shelf and RASHI stays a person.",
},

{
 "title": "Klezmer",
 "diff": 4,
 "groups": [
   {"name": "IN A KLEZMER BAND", "tiles": ["CLARINET", "TSIMBL", "ACCORDION", "TROMBONE"],
    "note": "The clarinet does the laughing and crying because it can bend a note the way a voice does; the tsimbl is a hammered dulcimer you carry on a strap."},
   {"name": "SUNG FROM MEMORY, NO SHEET MUSIC", "tiles": ["HAVA NAGILA", "ADON OLAM", "OSEH SHALOM", "DAYENU"],
    "note": "Adon Olam is famously sung to any tune that fits, up to and including football chants, which is how you can hear it at four completely different tempos in one week."},
   {"name": "JEWISH SONGWRITERS", "tiles": ["GERSHWIN", "LEONARD COHEN", "BOB DYLAN", "CAROLE KING"],
    "note": "Gershwin's parents were from Odessa, Cohen came from a rabbinical family in Montreal, Dylan was Zimmerman from Hibbing, and Carole King was Klein from Brooklyn."},
   {"name": "KLEZMER TUNE FORMS", "tiles": ["FREYLEKHS", "BULGAR", "SHER", "HORA"],
    "note": "A freylekhs is the fast happy one, a bulgar the Bessarabian dance that became the standard wedding tempo, a sher a figure dance, a hora the slow limping three-beat — not the Israeli circle dance of the same name."},
 ],
 "traps": [
   ["HORA", 1, "Everybody knows the hora as the thing you dance to Hava Nagila, which makes it read as a song rather than as the older, slower Yiddish tune form."],
   ["CLARINET", 3, "The clarinet is so completely the sound of klezmer that it reads as a genre rather than an instrument."],
 ],
 "epilogue": "Two groups made of Yiddish words and two made of English, and the trap is the one word that appears in both worlds: HORA is a klezmer tune form here, not the wedding circle. It stays because HAVA NAGILA, ADON OLAM, OSEH SHALOM and DAYENU are four songs already — and because FREYLEKHS, BULGAR and SHER are three forms with a hole in them.",
},

{
 "title": "Tel Aviv Breakfast",
 "diff": 3,
 "groups": [
   {"name": "ISRAELI STREET FOOD", "tiles": ["FALAFEL", "SABICH", "SHAKSHUKA", "MALABI"],
    "note": "Sabich is fried aubergine, egg and amba in a pita — Iraqi-Jewish home cooking that got out of the house. Malabi is rose-water milk pudding in a plastic cup."},
   {"name": "ON AN ISRAELI MAP", "tiles": ["NEGEV", "GALILEE", "KINNERET", "DEAD SEA"],
    "note": "The Kinneret is the lake everyone else calls Galilee, the Negev is half the country's land and a fraction of its people, and the Dead Sea shoreline drops about a metre a year."},
   {"name": "HEBREW SLANG", "tiles": ["SABABA", "BALAGAN", "YALLA", "STAM"],
    "note": "Sababa (great) and yalla (let's go) are Arabic; balagan (chaos) came through Russian from the Persian balakhaneh, an upper room; stam means 'no reason, just because'."},
   {"name": "COINED FOR MODERN HEBREW", "tiles": ["GLIDA", "RAKEVET", "ITON", "MACHSHEV"],
    "note": "Ice cream, train, newspaper, computer — a revived language needs a word for everything, so a committee built them from biblical roots: machshev is 'thinker', from the root for thought."},
 ],
 "traps": [
   ["SABABA", 3, "Sababa feels like a modern Hebrew invention because it is modern and it is Hebrew — but it walked in from Arabic, not out of a committee."],
   ["MALABI", 2, "Malabi is a word you would only ever hear in slangy street Hebrew, which is exactly the register of the blue group."],
 ],
 "epilogue": "Two food-and-place groups and two language groups, and the language groups are the fight: modern Hebrew borrowed as hungrily as it invented. SABABA is the tile that could plausibly be either, and it resolves because GLIDA, RAKEVET, ITON and MACHSHEV are four manufactured words with no street in them.",
},

{
 "title": "1492 and After",
 "diff": 4,
 "groups": [
   {"name": "NAMES FOR THE COMMUNITIES", "tiles": ["ASHKENAZI", "SEPHARDI", "MIZRAHI", "ROMANIOTE"],
    "note": "Ashkenaz is the Rhineland, Sepharad is Spain, mizrach is east — and the Romaniotes were in Greece before any of those labels existed, praying in Greek."},
   {"name": "JEWISH LANGUAGES", "tiles": ["YIDDISH", "LADINO", "JUDEO-ARABIC", "JUDEO-PERSIAN"],
    "note": "The pattern is the same every time: local grammar, Hebrew script, and a layer of Hebrew and Aramaic vocabulary on top. Yiddish is German that way, Ladino is Castilian."},
   {"name": "WHERE THEY LANDED", "tiles": ["ELLIS ISLAND", "WHITECHAPEL", "BUENOS AIRES", "JAFFA PORT"],
    "note": "Two and a half million people left the Russian Empire after 1881; the East End, the Lower East Side, Argentina and the Jaffa quayside were the four doors most of them came through."},
   {"name": "___ QUARTER", "tiles": ["JEWISH", "ARMENIAN", "LATIN", "FRENCH"],
    "note": "Two of these are quarters of Jerusalem's Old City — with the Christian and Muslim quarters making four — and two are neighbourhoods in Paris and New Orleans."},
 ],
 "traps": [
   ["ROMANIOTE", 1, "Romaniote names both the community and its language, Yevanic — Judeo-Greek — so it satisfies the green category on its own terms."],
   ["LADINO", 0, "Ladino is so bound to Sephardi identity that the two words are used almost interchangeably in conversation."],
 ],
 "epilogue": "A community, a language, a port, a quarter — four ways of answering 'where are you from?' ROMANIOTE genuinely is both a people and a tongue, and the only thing that pins it is counting: YIDDISH, LADINO, JUDEO-ARABIC and JUDEO-PERSIAN are four languages, and ASHKENAZI, SEPHARDI and MIZRAHI are three labels short of a set.",
},

{
 "title": "A Whole Life",
 "diff": 5,
 "groups": [
   {"name": "ONE LIFE, IN FOUR CEREMONIES", "tiles": ["BRIT MILAH", "BAT MITZVAH", "CHUPPAH", "SHIVA"],
    "note": "Eight days old, twelve or thirteen years old, the wedding canopy, and the week the family sits on low chairs — birth, adulthood, marriage, death, in that order."},
   {"name": "AT THE WEDDING ITSELF", "tiles": ["KETUBAH", "BADEKEN", "THE GLASS", "YICHUD"],
    "note": "The ketubah is the contract, badeken the veiling, the glass is broken so that no joy is ever quite complete, and yichud is the few minutes the couple spend alone afterwards, traditionally to eat."},
   {"name": "WORDS OF MOURNING", "tiles": ["KADDISH", "YAHRZEIT", "SHLOSHIM", "UNVEILING"],
    "note": "Kaddish barely mentions death; yahrzeit is the annual candle; shloshim is the thirty days; the unveiling is when the stone is set, up to a year later."},
   {"name": "HEBREW LETTERS THAT ARE ALSO 1, 2, 3, 4", "tiles": ["ALEPH", "BET", "GIMEL", "DALET"],
    "note": "Every Hebrew letter is a number, which is why the year is written in letters and why gematria is possible at all — and why a Hebrew page number can be read as a word."},
 ],
 "traps": [
   ["CHUPPAH", 1, "The chuppah is a literal object at the wedding, standing next to the ketubah and the glass. It is in the life-stages group only because it is standing in for the whole day."],
   ["SHIVA", 2, "Shiva is the mourning week, and every single word in the blue group is about that same fortnight."],
 ],
 "epilogue": "The hardest board in the pack, because the yellow group is not a category so much as a biography: BRIT MILAH, BAT MITZVAH, CHUPPAH and SHIVA are one person's whole life, and two of those four tiles are also technical terms belonging to the groups either side of them. The purple is the way in — ALEPH, BET, GIMEL and DALET are the only tiles here that are not about an event at all.",
},

]
