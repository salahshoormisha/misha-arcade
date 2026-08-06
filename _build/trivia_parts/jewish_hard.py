# -*- coding: utf-8 -*-
"""
jewish_hard.py -- the top of JEWISH LIFE: the mechanics rather than the labels.

WHY THIS FILE EXISTS
    The players said the questions about their own religion and background were
    too easy. gen_trivia2.py now demotes this category by a pip so the
    everybody-knows-it questions sit on the low rungs, which left the 4s and 5s
    empty. This file fills them, and is exempt from the demotion (the exemption
    keys off the "_hard" filename suffix).

THE BAR
    Not "which festival has candles" but "what is done with the middle matzah".
    diff 4 = someone who keeps the calendar gets it.
    diff 5 = someone who keeps the calendar has to stop and think.

    Politics is never the punchline here. History and geography are fair
    ground; a modern political dispute is not a trivia answer.
"""


def Q(cat, diff, q, a, w1, w2, w3, note):
    return {"cat": cat, "diff": diff, "q": q, "a": a,
            "wrong": [w1, w2, w3], "note": note}


def N(cat, diff, q, a, unit, note):
    return {"cat": cat, "diff": diff, "q": q, "a": a, "unit": unit,
            "note": note, "numeric": True}


BANK = [

    # ══════════════════ HOLIDAY MECHANICS ══════════════════
    Q("jewish", 4, "What is the ninth candle on a Hanukkah menorah, the one used to light the others, called?",
      "The shamash", "The ner tamid", "The havdalah candle", "The yahrzeit candle",
      "Shamash means servant: the eight lights are for looking at and nothing else, so a working candle has to do the actual lighting."),
    Q("jewish", 5, "During the Seder, what happens to the middle matzah of the three on the plate?",
      "It is broken and half of it hidden", "It is dipped in salt water",
      "It is eaten by the youngest child", "It is burned before the meal starts",
      "The hidden half is the afikoman, and the meal cannot finish until a child produces it and is paid off -- the entire mechanism for keeping children awake."),
    Q("jewish", 4, "Which festival is kept by staying up all night studying and by eating dairy?",
      "Shavuot", "Simchat Torah", "Tu BiShvat", "Lag BaOmer",
      "Cheesecake and blintzes on the anniversary of receiving the Torah, and the all-night session has its own name, a tikkun."),
    Q("jewish", 5, "Which festival's central act is dancing with the Torah scrolls as the annual reading cycle ends and restarts?",
      "Simchat Torah", "Shavuot", "Purim", "Sukkot",
      "The last verses of Deuteronomy and the first of Genesis are read one after the other so the cycle never has a seam in it."),
    Q("jewish", 5, "What are the four species bound together and waved during Sukkot?",
      "Palm, myrtle, willow and citron", "Olive, fig, date and vine",
      "Wheat, barley, grape and olive", "Cedar, hyssop, myrtle and palm",
      "The lulav is the bundle and the etrog the citron held beside it; the waving goes out to all six directions, including up and down."),
    Q("jewish", 5, "Which fast day mourns the destruction of both Temples, held to have fallen on the same date centuries apart?",
      "Tisha B'Av", "The Fast of Gedaliah", "The Tenth of Tevet", "The Fast of Esther",
      "The ninth of Av, kept sitting on the floor in low light reading Lamentations, and traditionally blamed for a long list of later catastrophes too."),
    Q("jewish", 5, "Which minor festival is a new year for trees?",
      "Tu BiShvat", "Lag BaOmer", "Tu B'Av", "Rosh Chodesh",
      "It began as an accounting date for tithing fruit and was reinvented in modern Israel as a tree-planting day."),
    Q("jewish", 5, "The Jewish marriage contract, read aloud under the canopy and often beautifully illustrated, is called what?",
      "The ketubah", "The get", "The tena'im", "The kiddushin",
      "A get is the opposite document, a bill of divorce; the ketubah is essentially an itemised list of the husband's obligations."),

    # ══════════════════ HEBREW ══════════════════
    Q("jewish", 4, "Modern Hebrew's revival is credited above all to which lexicographer, who raised his son as the first native speaker in centuries?",
      "Eliezer Ben-Yehuda", "Ahad Ha'am", "Chaim Nachman Bialik", "Theodor Herzl",
      "He had to coin words for everything the language had never needed -- ice cream, newspaper, bicycle -- and his son reportedly did not speak at all until he was four."),
    Q("jewish", 5, "Hebrew script leaves out most vowels. What are the dots and dashes that supply them called?",
      "Nikkud", "Trope", "Cantillation marks", "Ashuri",
      "Children's books, poetry and prayer books carry them; a newspaper does not, so fluent reading is partly working out which word the consonants must make."),
    Q("jewish", 5, "Charitable gifts are often made in multiples of eighteen because that number spells which Hebrew word?",
      "Chai, meaning life", "Shalom, meaning peace", "Or, meaning light", "Tov, meaning good",
      "Chet is eight and yud is ten, so a cheque for a hundred and eighty is a small legible blessing as well as a donation."),
    Q("jewish", 5, "Which typeface, named after a medieval commentator, is used to print rabbinic commentary beside the main text?",
      "Rashi script", "Solitreo", "Cursive Hebrew", "Block Ashuri",
      "Rashi never wrote a word in it -- it was a printer's choice, a Sephardi semi-cursive picked to keep commentary visually apart from scripture."),
    Q("jewish", 5, "Most of the Talmud's argument is written in which language?",
      "Aramaic", "Greek", "Judeo-Arabic", "Ladino",
      "The Mishnah is Hebrew, but the Gemara that argues with it runs in Aramaic, which is why learning Gemara means learning a second language first."),
    Q("jewish", 5, "Which Jewish language is a form of Arabic written in Hebrew letters?",
      "Judeo-Arabic", "Ladino", "Yevanic", "Aramaic",
      "Maimonides wrote the Guide for the Perplexed in it, for readers who spoke Arabic perfectly well but read only the Hebrew alphabet."),

    # ══════════════════ FOOD ══════════════════
    Q("jewish", 4, "Which stew goes into a low oven before sundown on Friday and is eaten hot at lunch the next day?",
      "Cholent", "Kugel", "Tzimmes", "Kishke",
      "The dish exists entirely to get round the ban on cooking on Shabbat: you may not light a fire, but you may leave one banked."),
    Q("jewish", 5, "What is the Sephardi and Mizrahi counterpart of cholent, browned overnight with whole eggs in the pot?",
      "Hamin", "Sabich", "Malawach", "Jachnun",
      "The eggs come out beige and creamy and have their own name, huevos haminados; Yemenite jachnun is a separate overnight tradition altogether."),
    Q("jewish", 4, "Which Israeli street food, brought by Iraqi Jews, is a pitta of fried aubergine, hard-boiled egg, salad and amba?",
      "Sabich", "Shakshuka", "Malawach", "Laffa",
      "Amba is the pickled-mango sauce that makes it work, and the whole thing is a Shabbat breakfast that emigrated into a sandwich."),
    Q("jewish", 5, "Which flaky coiled Yemenite-Israeli bread is pan-fried and eaten with grated tomato and zhug?",
      "Malawach", "Lachuch", "Laffa", "Pita",
      "Zhug is the coriander-and-chilli paste alongside it; lachuch is the spongy Yemenite pancake it gets confused with."),
    Q("jewish", 5, "Which verse is the root of the kosher rule that keeps meat and dairy apart?",
      "A ban on cooking a kid in its mother's milk", "A ban on eating blood",
      "A rule about the method of slaughter", "A prohibition on mixing fabrics",
      "It appears three times in the Torah, and the rabbis read the repetition as three separate prohibitions: cooking it, eating it, and profiting from it."),

    # ══════════════════ HISTORY, PLACES AND IDEAS ══════════════════
    Q("jewish", 4, "The Dead Sea Scrolls were found in caves beside which site?",
      "Qumran", "Masada", "Megiddo", "Beit She'an",
      "A shepherd threw a stone into a cave in 1947 and heard pottery break; the find pushed the oldest known Hebrew biblical text back by roughly a thousand years."),
    Q("jewish", 5, "Which fortress above the Dead Sea was the final holdout of the Jewish revolt against Rome?",
      "Masada", "Gamla", "Herodium", "Yodfat",
      "Herod built it as a bolthole palace and never once needed it; Israeli army units were for years sworn in on the summit at dawn."),
    Q("jewish", 5, "Which 1917 document expressed British support for a Jewish national home in Palestine?",
      "The Balfour Declaration", "The Sykes-Picot Agreement", "The Peel Report", "The Churchill White Paper",
      "Sixty-seven words in a letter to Lord Rothschild, and every one of them has been picked over ever since."),
    Q("jewish", 5, "Which Hebrew phrase meaning 'repair of the world' became shorthand for social-justice work?",
      "Tikkun olam", "Tzedakah", "Gemilut chasadim", "Pikuach nefesh",
      "It started as a technical term in Lurianic Kabbalah about gathering up scattered divine sparks, and was repurposed wholesale in the twentieth century."),
    Q("jewish", 5, "Which principle permits almost any Jewish law to be broken in order to save a life?",
      "Pikuach nefesh", "Kal vachomer", "Lashon hara", "Hiddur mitzvah",
      "It overrides Shabbat, Yom Kippur and very nearly everything else, and the rabbis were emphatic that you act first and ask afterwards."),
    Q("jewish", 5, "The commandment behind the prayer shawl actually concerns which part of it?",
      "The knotted fringes at the corners", "The blue stripes", "The neckband", "The wool it is woven from",
      "The tzitzit are the point; the shawl exists to provide four corners to tie them to, which is why the small undershirt version does the same job."),
    Q("jewish", 5, "Which Israeli port city has a famous terraced garden climbing Mount Carmel?",
      "Haifa", "Akko", "Netanya", "Ashdod",
      "The shrine of the Bab sits halfway up the slope, and the gardens are a UNESCO World Heritage site -- the city is the Baha'i faith's world centre."),

    # ══════════════════ NUMERIC (wager) ══════════════════
    N("jewish", 4, "How many candles does a household burn in total across the eight nights of Hanukkah, counting the shamash each night?",
      44, "candles",
      "Thirty-six for the count, one to eight, plus eight servers -- which is exactly why the boxes are sold in forty-fours."),
    N("jewish", 4, "How many cups of wine does each person drink at a Passover Seder?",
      4, "cups",
      "One for each of the four promises of redemption; a fifth is poured for Elijah and deliberately left standing."),
    N("jewish", 5, "How many days are counted in the Omer, between Passover and Shavuot?",
      49, "days",
      "Seven weeks of seven, counted out loud every night, with the festival landing on the fiftieth day -- which is precisely what 'Pentecost' means."),
]
