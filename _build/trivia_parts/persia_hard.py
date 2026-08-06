# -*- coding: utf-8 -*-
"""
persia_hard.py -- the top of IRAN & PERSIA, written to test someone who grew
up inside the culture rather than someone reading about it.

WHY THIS FILE EXISTS
    Same reason as cities_hard.py: the players said the questions about their
    own heritage were too easy, gen_trivia2.py now demotes the category by a
    pip to move the by-osmosis questions down where they belong, and that left
    the 4s and 5s empty. This file fills them and is exempt from the demotion
    (the exemption keys off the "_hard" filename suffix).

DELIBERATELY LIGHT ON THE SHAHNAMEH
    They have said they do not know the epic well, and it has a whole cabinet
    of its own. So the ground here is food, cinema, music, Nowruz and Yalda
    custom, the language, geography, the science-history names, and diaspora
    life -- the things you either live or you don't.

THE BAR
    diff 4 = an Iranian household gets it, an outsider does not.
    diff 5 = an Iranian household has to stop and think, then says "of course".
"""


def Q(cat, diff, q, a, w1, w2, w3, note):
    return {"cat": cat, "diff": diff, "q": q, "a": a,
            "wrong": [w1, w2, w3], "note": note}


def N(cat, diff, q, a, unit, note):
    return {"cat": cat, "diff": diff, "q": q, "a": a, "unit": unit,
            "note": note, "numeric": True}


BANK = [

    # ══════════════════ FOOD ══════════════════
    Q("persia", 5, "What is a 'yakhchal'?",
      "An ancient ice house", "A heavy copper cooking pot", "A courtyard fountain", "A hand spice grinder",
      "The mud-brick domes made and kept ice through a desert summer by radiating heat to the night sky -- and the word is now simply modern Persian for a fridge."),
    Q("persia", 4, "Which tart red berry, bloomed in butter and scattered over rice, is called zereshk?",
      "Barberry", "Sumac", "Cranberry", "Rosehip",
      "Zereshk polo with chicken is the default order at an Iranian wedding, and the berries need about thirty seconds in the pan before they turn bitter."),
    Q("persia", 4, "The stew kashk-e bademjan pairs aubergine, or eggplant, with what?",
      "Fermented dried whey", "Thick yoghurt", "Tahini", "Soured cream",
      "The kashk is dried into hard lumps and reconstituted, and its sourness is the only thing stopping the dish from being simply very rich aubergine."),
    Q("persia", 5, "Faloodeh, the frozen dessert associated with Shiraz, is built from what suspended in rosewater syrup?",
      "Thin rice noodles", "Shredded coconut", "Soaked basil seeds", "Slivered almonds",
      "Lime juice over the top is compulsory, and the yakhchals of the plateau are why a frozen dessert existed here centuries before refrigeration."),
    Q("persia", 4, "Which two flavourings define bastani, the traditional Persian ice cream?",
      "Saffron and rosewater", "Cardamom and pistachio", "Orange blossom and honey", "Mastic and vanilla",
      "It is stretched with mastic so it pulls rather than melts, and slabs of frozen clotted cream are folded through it."),
    Q("persia", 5, "Which platter of raw herbs, eaten by the fistful alongside bread and feta, has a name meaning simply 'greens for eating'?",
      "Sabzi khordan", "Mast-o khiar", "Salad shirazi", "Torshi",
      "Tarragon, basil, mint and radish as the baseline; torshi is the pickle jar that sits next to it and mast-o khiar the yoghurt."),

    # ══════════════════ CINEMA ══════════════════
    Q("persia", 4, "Which Iranian director's Taste of Cherry took the Palme d'Or at Cannes in 1997?",
      "Abbas Kiarostami", "Asghar Farhadi", "Jafar Panahi", "Mohsen Makhmalbaf",
      "He shared the prize with Shohei Imamura, and shot most of the film with only one actor in the car at a time, sitting in the other seat himself."),
    Q("persia", 5, "In Close-Up, the man on trial had been impersonating which Iranian director?",
      "Mohsen Makhmalbaf", "Dariush Mehrjui", "Bahram Beyzai", "Amir Naderi",
      "Everyone in the film plays themselves, including the impostor and the family he fooled, and the real director turns up at the end on the back of a motorbike."),
    Q("persia", 5, "Which Iranian film-maker won a second Academy Award in 2017, for The Salesman?",
      "Asghar Farhadi", "Jafar Panahi", "Majid Majidi", "Bahman Ghobadi",
      "He stayed away from the ceremony in protest at the US travel ban, and had his statement read out by an Iranian-American engineer instead."),
    Q("persia", 5, "Which 1969 film is generally credited with starting the Iranian New Wave?",
      "The Cow", "The Deer", "Downpour", "The Runner",
      "Dariush Mehrjui's story of a villager who becomes his own dead cow was banned, then reportedly admired at the top, which is roughly how art cinema survived the revolution."),
    Q("persia", 4, "The animated film Persepolis was adapted from a graphic memoir by whom?",
      "Marjane Satrapi", "Shirin Neshat", "Azar Nafisi", "Firoozeh Dumas",
      "She co-directed it herself, in flat black and white, and it shared the Jury Prize at Cannes in 2007."),

    # ══════════════════ MUSIC ══════════════════
    Q("persia", 5, "In Persian classical music, what is the 'radif'?",
      "The canonical repertoire a musician must memorise", "A four-string lute",
      "A rhythmic cycle of seven beats", "The standard tuning of the strings",
      "Over 250 melodic units learned by ear from a master over a decade or more; UNESCO put it on the intangible heritage list in 2009."),
    Q("persia", 4, "The Persian long-necked lute called the tar takes its name from a word meaning what?",
      "String", "Wood", "Voice", "Moon",
      "Which makes setar 'three strings', and the sitar of North India carries the same Persian root across with it."),
    Q("persia", 5, "Which Persian instrument is a spike fiddle, held upright on a foot and rotated against the bow?",
      "The kamancheh", "The rebab", "The ney", "The tanbur",
      "The player turns the instrument rather than the wrist, and the whole spike-fiddle family from the Caucasus to China descends from it."),

    # ══════════════════ NOWRUZ, YALDA AND CUSTOM ══════════════════
    Q("persia", 4, "On Chaharshanbe Suri, the last Tuesday night before Nowruz, what do people leap over?",
      "Bonfires", "A basin of water", "A line of lit candles", "A rope of woven herbs",
      "The chant is a straight trade with the fire: my sickly yellow to you, your healthy red to me."),
    Q("persia", 5, "On Sizdah Bedar, what happens to the sprouted greens from the Nowruz table?",
      "They are thrown into running water", "They are eaten in a soup",
      "They are burned on a brazier", "They are replanted in the garden",
      "The sabzeh is held to have soaked up the household's bad luck over the fortnight, so it goes downstream while everyone picnics."),
    Q("persia", 5, "Unmarried women at Sizdah Bedar traditionally knot what, while making a wish?",
      "Blades of grass", "Red thread around a branch", "A coin into a handkerchief", "Ribbons on a fountain",
      "The knot is a wish to be married by next Nowruz, and untying somebody else's is regarded as a small and enjoyable act of sabotage."),
    Q("persia", 4, "Which two red fruits dominate the Yalda night table?",
      "Pomegranate and watermelon", "Pomegranate and quince", "Watermelon and persimmon", "Cherries and figs",
      "Red is the colour of the dawn -- eating it through the longest night of the year is a wager on the sun coming back."),
    Q("persia", 5, "What is the custom of telling fortunes by opening a book of poetry at random called?",
      "Fal-e Hafez", "Estekhareh", "Rammal", "Nazar",
      "Estekhareh is the same trick done with the Qur'an; the Hafez version is what actually happens at Yalda, with the youngest in the room turning the page."),

    # ══════════════════ LANGUAGE ══════════════════
    Q("persia", 5, "Which of these does Persian grammar lack entirely?",
      "Grammatical gender", "Plural nouns", "A past tense", "Adjectives",
      "One pronoun covers he, she and it, which is precisely why Persian speakers can mix up he and she in English for decades."),
    Q("persia", 5, "Which English word for a covered market reached English from Persian by way of Turkish?",
      "Bazaar", "Arcade", "Emporium", "Souk",
      "Souk is the Arabic equivalent and never came through Persian at all; caravan, divan, khaki and pyjama all took the same road."),
    Q("persia", 4, "The English word 'khaki' comes from a Persian word meaning what?",
      "Dusty", "Sun-bleached", "Woven", "Hidden",
      "From khak, earth -- British regiments in India dyed their white uniforms with mud and tea to stop being quite so easy to shoot."),

    # ══════════════════ GEOGRAPHY ══════════════════
    Q("persia", 5, "Which mountain range runs down Iran's western side, separating the plateau from Mesopotamia?",
      "The Zagros", "The Alborz", "The Kopet Dag", "The Hindu Kush",
      "The Alborz is the northern one, pinning Tehran against the Caspian; the Zagros is where the Bakhtiari still drive their flocks up every spring."),
    Q("persia", 5, "What is a 'qanat'?",
      "A gently sloping underground water channel", "A domed desert caravanserai",
      "A carved cliff relief", "A walled orchard",
      "Gravity does all of the work: a tunnel dug for miles at a hair's slope, tapping an aquifer under the mountains and surfacing in the middle of a desert."),
    Q("persia", 4, "Which strait links the Persian Gulf to the open sea, separating Iran from the Arabian Peninsula?",
      "The Strait of Hormuz", "Bab-el-Mandeb", "The Bosphorus", "The Strait of Malacca",
      "About twenty-one nautical miles across at its narrowest, and the usable shipping lanes inside it are very much narrower still."),

    # ══════════════════ SCIENCE AND SCHOLARSHIP ══════════════════
    Q("persia", 4, "Which Persian polymath wrote The Canon of Medicine, a European university set text for centuries?",
      "Avicenna", "Al-Razi", "Al-Biruni", "Averroes",
      "Ibn Sina at home, Avicenna in Latin -- and Averroes is the trap in that list, being Andalusian rather than Persian."),
    Q("persia", 5, "Which Persian physician first set out the clinical difference between smallpox and measles?",
      "Al-Razi", "Avicenna", "Al-Biruni", "Ibn al-Nafis",
      "Rhazes in Latin; he is also said to have sited a Baghdad hospital by hanging meat around the city and building where it rotted slowest."),
    Q("persia", 5, "Omar Khayyam's calendar reform is the ancestor of which calendar still in official use in Iran?",
      "The Solar Hijri calendar", "The Islamic lunar calendar", "The Yazdegerdi calendar", "The Seleucid calendar",
      "It is astronomical rather than arithmetical, which is why Nowruz lands on the equinox every single year with no leap-year fudge required."),

    # ══════════════════ DIASPORA ══════════════════
    Q("persia", 5, "Which Los Angeles neighbourhood is the heart of the community nicknamed Tehrangeles?",
      "Westwood", "Glendale", "Encino", "Silver Lake",
      "The run of bookshops, groceries and kabab houses along Westwood Boulevard is signposted by the city as Persian Square."),
    Q("persia", 4, "Whose memoir Reading Lolita in Tehran describes a secret book club held in the author's living room?",
      "Azar Nafisi", "Marjane Satrapi", "Firoozeh Dumas", "Porochista Khakpour",
      "Firoozeh Dumas wrote Funny in Farsi, the comic counterpart, and for a while in the 2000s American book clubs were reading little else."),

    # ══════════════════ NUMERIC (wager) ══════════════════
    N("persia", 4, "How many letters are there in the Persian alphabet?",
      32, "letters",
      "Arabic's twenty-eight, plus four invented for the P, CH, ZH and G sounds Arabic has no use for -- which is why Arabic calls Pars 'Fars'."),
    N("persia", 4, "How many days after Nowruz does Sizdah Bedar fall?",
      13, "days",
      "Thirteen is unlucky enough that the entire country turns out of doors for the day rather than sit indoors with it."),
    N("persia", 5, "In which year did Reza Shah ask foreign governments to call the country Iran rather than Persia?",
      1935, "the year",
      "He made the request on Nowruz itself, 21 March; the country had been calling itself Iran at home the whole time."),
]
