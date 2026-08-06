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

    # ══════════════════ HOUSTON ══════════════════
    Q("cities", 4, "Houston is the largest city in the United States without which ordinary piece of municipal regulation?",
      "Zoning", "A property tax", "An elected city council", "Building permits",
      "It has been put to the voters in 1948, 1962 and 1993 and beaten every time, which is how a taqueria ends up next door to a refinery."),
    Q("cities", 5, "Houston lies some fifty miles inland yet ranks among the busiest ports in the United States. What makes that possible?",
      "The Houston Ship Channel", "The Trinity River locks", "The Galveston Causeway", "The Brazos Canal",
      "Buffalo Bayou was dredged deep enough for ocean-going vessels after the 1900 hurricane wiped out Galveston, the rival port down the coast."),
    Q("cities", 4, "The artificial playing surface AstroTurf takes its name from which building?",
      "The Astrodome", "The Superdome", "The Alamodome", "The Los Angeles Coliseum",
      "The real grass inside died once the roof panels were painted to cut the glare, so they carpeted the floor and named the carpet after the room."),
    Q("cities", 5, "The Houston Astros played their first three seasons, from 1962, under what name?",
      "The Colt .45s", "The Buffaloes", "The Wildcatters", "The Oilers",
      "The Buffaloes had been the city's minor-league club and the Oilers were the football team, so both names were already spoken for."),
    Q("cities", 4, "Houston is named for the general who commanded the winning side at which battle of 1836?",
      "San Jacinto", "The Alamo", "Goliad", "Gonzales",
      "The fighting lasted about eighteen minutes and won Texas its independence; the column marking the site is taller than the Washington Monument."),
    Q("cities", 5, "Buckminsterfullerene, the football-shaped carbon molecule, was discovered in 1985 at which Houston university?",
      "Rice University", "The University of Houston", "Baylor College of Medicine", "Texas Southern University",
      "Curl and Smalley shared the 1996 Nobel for it, and the name salutes the geodesic domes the molecule so obviously resembles."),
    Q("cities", 5, "Which of Houston's ring roads do locals simply call 'the Loop'?",
      "Interstate 610", "Beltway 8", "State Highway 99", "Interstate 45",
      "Beltway 8 is the next ring out and Highway 99 the one beyond that -- three concentric rings, and only the innermost gets the definite article."),
    Q("cities", 4, "Which Houston skyscraper, completed in 1981 as the Texas Commerce Tower, became the tallest building in Texas?",
      "The JPMorgan Chase Tower", "The Williams Tower", "The Wells Fargo Plaza", "The Heritage Plaza",
      "I. M. Pei's practice drew it for eighty floors, but the FAA objected on account of the approach into Hobby Airport, so it stopped at seventy-five."),
    Q("cities", 5, "Which Houston chapel, opened in 1971, holds fourteen near-black canvases and has a Barnett Newman obelisk in the pool outside?",
      "The Rothko Chapel", "The Chapel of St Basil", "The Byzantine Fresco Chapel", "The Menil Oratory",
      "The sculpture out front is dedicated to Martin Luther King Jr, and Rothko himself died a year before the doors opened."),
    Q("cities", 5, "Which waterway, now a landscaped park through downtown Houston, was the city's original harbour?",
      "Buffalo Bayou", "White Oak Creek", "Brays Slough", "The San Jacinto Cut",
      "The Allen brothers sold lots along it in 1836 by advertising a port that did not yet exist, and the city grew up around the bluff."),

    # ══════════════════ BOSTON & CAMBRIDGE, MASSACHUSETTS ══════════════════
    Q("cities", 5, "Boston's Orange Line takes its name from what?",
      "An old name for part of Washington Street", "The colour of the original rolling stock",
      "The Dutch House of Orange", "An orange grove at Forest Hills",
      "Every colour was assigned a meaning in 1965: red for Harvard's crimson, blue for the harbour, green for the Emerald Necklace of parks."),
    Q("cities", 5, "The Harvard Bridge between Boston and Cambridge is marked out along its length in units called what?",
      "Smoots", "Rods", "Chains", "Furlongs",
      "Oliver Smoot was rolled end over end across it by his fraternity in 1958, and the police now use the marks to locate incidents."),
    Q("cities", 5, "The Battle of Bunker Hill was mostly fought on which neighbouring hill?",
      "Breed's Hill", "Copp's Hill", "Beacon Hill", "Prospect Hill",
      "The monument stands on Breed's, the wrong hill, and two and a half centuries of pedantry have failed to get the name corrected."),
    Q("cities", 4, "In which town does the Boston Marathon start?",
      "Hopkinton", "Framingham", "Natick", "Wellesley",
      "The other three are all further along the course; the finish is on Boylston Street, twenty-six miles east."),
    Q("cities", 5, "The first subway tunnel in the United States opened in Boston in 1897 beneath which street?",
      "Tremont Street", "Washington Street", "Boylston Street", "Beacon Street",
      "Park Street and Boylston stations are still down there, which makes them the oldest working subway stations in the country."),
    Q("cities", 4, "Which square is dominated by the Citgo sign that television cameras catch above Fenway's left-field wall?",
      "Kenmore Square", "Copley Square", "Coolidge Corner", "Packard's Corner",
      "Preservationists saw off an attempt to remove it in 1983, and the sign has been LEDs rather than neon since 2010."),
    Q("cities", 5, "Which Cambridge, Massachusetts burial ground, opened in 1831, was the first garden cemetery in the United States?",
      "Mount Auburn Cemetery", "Forest Hills Cemetery", "Copp's Hill Burying Ground", "The Granary Burying Ground",
      "It was laid out as an arboretum you could be buried in, and it effectively started the American public-park movement."),
    Q("cities", 5, "The dome of the Massachusetts State House was originally covered in what, before copper and then gold leaf?",
      "Wooden shingles", "Slate", "Lead sheet", "Painted canvas",
      "Paul Revere's company laid the copper in 1802 -- he spent far more of his life as a metalworker than as a messenger."),
    Q("cities", 4, "Which Cambridge, Massachusetts square shares its name with a cut of steak?",
      "Porter Square", "Inman Square", "Union Square", "Davis Square",
      "Zachariah Porter's cattle-fair hotel stood there and served the cut, though New York has never accepted Cambridge's claim to have invented it."),
    Q("cities", 5, "The Boston skyscraper known for forty years as the John Hancock Tower was renamed in 2015 to what?",
      "200 Clarendon Street", "One Federal Street", "The Prudential Tower", "111 Huntington Avenue",
      "It is the one whose window panes kept falling into the street in the 1970s, until every last one of the ten thousand was replaced."),
    Q("cities", 5, "The Longfellow Bridge over the Charles is universally nicknamed after what its towers resemble?",
      "Salt and pepper shakers", "Chess rooks", "Milk churns", "Lighthouses",
      "The Red Line runs down the middle of it, which makes the ride between Charles/MGH and Kendall the best free view in the city."),
    N("cities", 4, "How many official sites are there on Boston's Freedom Trail?",
      16, "sites",
      "The red line linking them runs two and a half miles and is real brick wherever the pavement allowed it, painted only where it did not."),
    N("cities", 5, "How many feet tall is the Green Monster, the left-field wall at Fenway Park?",
      37, "feet",
      "It turns towering drives into singles and lazy fly balls into doubles, which has warped how the Red Sox scout hitters for a century."),
]
