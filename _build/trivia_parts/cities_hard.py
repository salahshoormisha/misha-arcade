# -*- coding: utf-8 -*-
"""
cities_hard.py -- the top of THEIR FOUR CITIES: Edinburgh, London, Houston,
Boston/Cambridge MA, written for people who have actually lived in them.

WHY THIS FILE EXISTS
    The players said the questions about their own cities were too easy. They
    were right: the original cities set asks a stranger's questions ("which US
    state is Houston in?"), and gen_trivia2.py now demotes that whole category
    by a pip to put those where they belong. That left the 4s and 5s empty.
    This file fills them, and is exempt from the demotion (see DEMOTE_EXEMPT in
    gen_trivia2.py -- the exemption keys off the "_hard" filename suffix).

THE BAR
    diff 4 = a proud local gets it, an outsider does not.
    diff 5 = a proud local has to stop and think, then says "of course".
    Not obscurity for its own sake: every note is the thing that makes the
    answer feel inevitable in hindsight. Anything whose answer moves --
    populations, tallest-in-the-world, current teams -- is not here.
"""


def Q(cat, diff, q, a, w1, w2, w3, note):
    return {"cat": cat, "diff": diff, "q": q, "a": a,
            "wrong": [w1, w2, w3], "note": note}


def N(cat, diff, q, a, unit, note):
    return {"cat": cat, "diff": diff, "q": q, "a": a, "unit": unit,
            "note": note, "numeric": True}


BANK = [

    # ══════════════════ EDINBURGH ══════════════════
    Q("cities", 5, "Edinburgh's Princes Street Gardens lie in the drained bed of what?",
      "The Nor Loch", "A branch of the Water of Leith", "A royal deer park", "The Burgh Muir",
      "It was the Old Town's northern defence and its open sewer at the same time, which tells you most of what you need to know about living up there."),
    Q("cities", 4, "Edinburgh Castle fires its gun at one o'clock rather than at noon. Why?",
      "One round is cheaper than twelve", "Noon belonged to the church bells",
      "The tide in the Forth turned at one", "Midday traffic drowned it out",
      "It started in 1861 as a time signal for ships in the Forth, working alongside the ball that drops on Nelson's Monument on Calton Hill."),
    Q("cities", 5, "The heart-shaped mosaic set into the setts of the Royal Mile marks the site of what?",
      "A prison", "A mercat cross", "A public well", "A plague pit",
      "The Old Tolbooth, where the hangings were staged -- which is why locals still spit on it in passing."),
    Q("cities", 4, "Greyfriars Bobby, the dog said to have kept watch at his master's grave, was which breed?",
      "A Skye terrier", "A West Highland white terrier", "A border collie", "A cairn terrier",
      "The statue's nose is rubbed so relentlessly by tourists that the council keeps having to re-blacken it."),
    Q("cities", 5, "Which Edinburgh surgeon, famed for diagnosing patients at a glance, was the model for Sherlock Holmes?",
      "Joseph Bell", "James Young Simpson", "Robert Knox", "James Syme",
      "Conan Doyle was his clerk at the Royal Infirmary and essentially wrote the method down as fiction."),
    Q("cities", 4, "The two clubs of the Edinburgh derby play at Tynecastle and Easter Road. Who plays at Easter Road?",
      "Hibernian", "Heart of Midlothian", "Edinburgh City", "Spartans",
      "Hibs were founded by Irish immigrants in the Cowgate, and the name is simply the Latin for Ireland."),
    Q("cities", 5, "Which Old Town thoroughfare is named for the drovers' route along which cattle were walked to market?",
      "The Cowgate", "The Grassmarket", "The Canongate", "The Lawnmarket",
      "The Grassmarket at the end of it is where the beasts were actually sold, and where the gallows stood."),
    Q("cities", 5, "Which crossing of the Forth opened in 2017, joining the 1964 road bridge and the 1890 rail bridge?",
      "The Queensferry Crossing", "The Kincardine Bridge", "The Clackmannanshire Bridge", "The Jamestown Viaduct",
      "Three bridges, three centuries of engineering, all in a single photograph from South Queensferry."),
    Q("cities", 4, "Trams returned to Edinburgh's streets in which year?",
      "2014", "2008", "2011", "2019",
      "The original network closed in 1956, so the gap was fifty-eight years -- and the new line still opened three years late."),
    Q("cities", 5, "Which building at the top of the Royal Mile houses Edinburgh's Camera Obscura?",
      "The Outlook Tower", "The Tolbooth Kirk", "Gladstone's Land", "The Signet Library",
      "It has been throwing a live image of the city onto a dished white table since the 1850s, decades before cinema existed."),
    Q("cities", 5, "Where was the Stone of Destiny put on display after its return to Scotland in 1996?",
      "Edinburgh Castle", "Holyrood Abbey", "St Giles' Cathedral", "The National Museum of Scotland",
      "It sat in the Crown Room beside the Honours of Scotland for the better part of thirty years."),
    Q("cities", 5, "Edinburgh's Old Town sits on a ridge left where a glacier scraped past a plug of hard volcanic rock. What is that landform called?",
      "A crag and tail", "A drumlin", "An esker", "A terminal moraine",
      "The Castle stands on the crag and the Royal Mile runs down the tail, which is why the whole Old Town tilts one way."),
    Q("cities", 4, "Which Edinburgh-born man was granted the United States patent for the telephone in 1876?",
      "Alexander Graham Bell", "John Logie Baird", "James Clerk Maxwell", "Alexander Fleming",
      "He was born on South Charlotte Street; Maxwell, born a few streets away, has the better claim to having changed physics."),
    N("cities", 4, "How many steps take you to the top viewing platform of Edinburgh's Scott Monument?",
      287, "steps",
      "Two hundred feet of soot-blackened Victorian Gothic, and the final staircase is narrow enough to make broad shoulders think twice."),

    # ══════════════════ LONDON ══════════════════
    Q("cities", 5, "Which is the only London Underground station whose name contains none of the letters in the word 'mackerel'?",
      "St John's Wood", "Elephant & Castle", "Tooting Bec", "Turnpike Lane",
      "Every one of the other 270-odd station names borrows at least one letter from a fish."),
    Q("cities", 5, "Which London Underground line serves the most stations?",
      "The District line", "The Central line", "The Piccadilly line", "The Northern line",
      "Sixty of them, a legacy of it swallowing several separate Victorian railways on its way out to the western suburbs."),
    Q("cities", 5, "Two compass-point London postal districts were scrapped within a decade of being introduced. Which pair?",
      "NE and S", "NW and SE", "EC and WC", "SW and W",
      "NE was folded into E in 1866 and S was split between SE and SW in 1868, which is why the modern set looks lopsided."),
    Q("cities", 4, "Being born within earshot of which church's bells traditionally makes a Londoner a Cockney?",
      "St Mary-le-Bow", "St Martin-in-the-Fields", "St Bride's", "Southwark Cathedral",
      "Bow Bells hang on Cheapside in the City -- nothing whatever to do with the district of Bow, three miles east."),
    Q("cities", 4, "Which police force covers barely more than a square mile of London and is entirely separate from the Met?",
      "The City of London Police", "The Westminster Constabulary", "The Thames Division", "The Royal Parks Police",
      "It is why officers in the Square Mile wear red-and-white chequerbands instead of the Met's black and white."),
    Q("cities", 5, "Which London terminus has the most platforms?",
      "Waterloo", "Clapham Junction", "King's Cross", "Victoria",
      "Twenty-four, including the five reclaimed in 2018 from the old Eurostar terminal that had sat empty for a decade."),
    Q("cities", 5, "Which of London's buried rivers surfaces into the Thames beneath Blackfriars Bridge and gave a famous street its name?",
      "The Fleet", "The Tyburn", "The Westbourne", "The Effra",
      "It runs in a sewer under Farringdon Road now; the valley it cut is the reason that road dips so sharply."),
    Q("cities", 5, "Which pair of adjacent Underground stations is the shortest hop on the network, at roughly 260 metres?",
      "Leicester Square and Covent Garden", "Embankment and Charing Cross",
      "Bank and Monument", "Temple and Blackfriars",
      "The walk takes about four minutes and the fare costs more than it is worth, and tourists do it in their thousands anyway."),
    Q("cities", 5, "From which mound in Richmond Park is there a legally protected ten-mile sightline to St Paul's Cathedral?",
      "King Henry's Mound", "Pembroke Lodge Rise", "Sawyer's Hill", "White Lodge Knoll",
      "The keyhole gap in the trees was planted in the early 1700s, and a Stratford tower block appearing in the frame caused a proper planning row."),
    Q("cities", 4, "Which of London's Royal Parks is the largest?",
      "Richmond Park", "Hyde Park", "Regent's Park", "Bushy Park",
      "Charles I walled it in as a deer park during the plague years, and the deer are still wandering about loose in it."),
    Q("cities", 5, "Which nightly ceremony has locked up the Tower of London for more than seven hundred years?",
      "The Ceremony of the Keys", "The Beating of the Bounds", "The Watch of the Ravens", "The Sounding of the Retreat",
      "It runs to the same script every single night, and famously carried on through the Blitz -- half an hour late, once, after a bomb."),
    Q("cities", 4, "The clock tower at the Palace of Westminster was given what official name in 2012?",
      "The Elizabeth Tower", "The Victoria Tower", "The Jubilee Tower", "The Westminster Tower",
      "Big Ben was only ever the bell inside it; before 2012 the tower itself was called nothing grander than the Clock Tower."),
    Q("cities", 5, "Which London Underground station was the first to be fitted with an escalator, in 1911?",
      "Earl's Court", "Baker Street", "Oxford Circus", "Holborn",
      "A one-legged man named Bumper Harris was supposedly hired to ride it and reassure the public, a story nobody has ever quite pinned down."),
    N("cities", 4, "How many feet tall is the Monument to the Great Fire of London?",
      202, "feet",
      "Exactly its own distance from the Pudding Lane bakery where the fire started -- tip it over and it would land on the spot."),
]
