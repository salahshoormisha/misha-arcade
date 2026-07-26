# -*- coding: utf-8 -*-
"""PLACES pack — 16 boards, four per city, the in-joke pack.

THEIR FOUR CITIES (CONTRACT §7):
  · CAMBRIDGE / BOSTON, MA — where they live now          (boards 1-4)
  · LONDON — David's home town, and where they plan to go  (boards 5-8)
  · EDINBURGH — where they met and lived six years         (boards 9-12)
  · HOUSTON — where Misha is from                          (boards 13-16)

This replaces the old 6-board `cambridge` pack. Sixteen of its twenty-four
authored groups survive here, re-cut into four boards: the Red Line, the Yard,
02138 and the Charles. Retired with the pack: Harvard traditions, student
institutions, presidents, residents, university mottoes, nearby colleges,
Cambridge companies and the MBTA line colours.

Nothing here is a tourist brochure: the test for every group was whether it is
something you only know from living there — the frontage road called a feeder,
the close that isn't on the map, the bread that arrives with pebbles in it.
"""

BOARDS = [

# ─────────────────────────────── CAMBRIDGE / BOSTON ──────────────────────────

{
 "title": "The Red Line",
 "diff": 2,
 "groups": [
   {"name": "STOPS ON THE RED LINE", "tiles": ["ALEWIFE", "DAVIS", "ASHMONT", "BRAINTREE"],
    "note": "Alewife at the north end, and the line splits after JFK/UMass into the Ashmont and Braintree branches — which is why the sign matters."},
   {"name": "BRIDGES OVER THE CHARLES", "tiles": ["LONGFELLOW", "WEEKS", "ELIOT", "ANDERSON"],
    "note": "The Longfellow is the salt-and-pepper one that carries the Red Line; Weeks is the footbridge everyone photographs; Anderson takes JFK Street across to the stadium."},
   {"name": "HARVARD SQUARE INSTITUTIONS", "tiles": ["THE COOP", "CLUB PASSIM", "OUT OF TOWN", "THE PIT"],
    "note": "Club Passim is where Joan Baez played as a teenager. The Out of Town News kiosk sold papers from everywhere until 2019 and the shell is still there."},
   {"name": "___ SQUARE", "tiles": ["HARVARD", "CENTRAL", "INMAN", "UNION"],
    "note": "Cambridge is organised entirely into squares, almost none of which are square."},
 ],
 "traps": [
   ["DAVIS", 3, "Davis Square is a very real square with a very real T stop — it is just over the line in Somerville, which is the only reason it sits with the stations."],
 ],
 "epilogue": "PORTER and KENDALL would each have fitted both the station group and the square group, so neither is on this board — that is how a puzzle stays solvable. DAVIS is the one that got in, and ALEWIFE, ASHMONT and BRAINTREE keep it honest.",
},

{
 "title": "The Yard",
 "diff": 2,
 "groups": [
   {"name": "HARVARD HOUSES", "tiles": ["ADAMS", "LOWELL", "ELIOT", "KIRKLAND"],
    "note": "Twelve upperclass houses, assigned by lottery on Housing Day, and residents will argue about the ranking until they die."},
   {"name": "HARVARD GRADUATE SCHOOLS", "tiles": ["LAW", "DESIGN", "DIVINITY", "KENNEDY"],
    "note": "The Divinity School is the oldest non-sectarian divinity school in the United States; the Kennedy School is across the river and knows it."},
   {"name": "IN HARVARD YARD", "tiles": ["WIDENER", "JOHN HARVARD", "MASS HALL", "SEVER"],
    "note": "The statue is called the Statue of Three Lies: it isn't John Harvard, he didn't found the college, and the date is wrong."},
   {"name": "___ YARD", "tiles": ["SCOTLAND", "JUNK", "BACK", "GRAVE"],
    "note": "Scotland Yard, junkyard, backyard, graveyard. Only one of them has a tourist problem."},
 ],
 "traps": [
   ["KENNEDY", 0, "Every other graduate school here is a plain noun and every house is a surname — KENNEDY is a surname, which is exactly the wrong signal."],
 ],
 "epilogue": "The difficulty is knowing that Massachusetts Hall is a building and not a school, and that Sever is a lecture hall and not a house. KENNEDY reads like a house because the houses are all named after men; the four houses were already full. Widener holds about 3.5 million volumes and is named for a man who died on the Titanic.",
},

{
 "title": "02138",
 "diff": 3,
 "groups": [
   {"name": "CAMBRIDGE STREETS", "tiles": ["BRATTLE", "MASS AVE", "GARDEN", "DUNSTER"],
    "note": "Brattle Street was Tory Row before the Revolution; the loyalists' houses are still standing and now hold seminars."},
   {"name": "MIT THINGS", "tiles": ["THE DOME", "THE INFINITE", "HACKS", "STATA CENTER"],
    "note": "The Infinite Corridor is 251 m long and twice a year the sun lines up down the whole thing — MIThenge. The hacks have put a police car and a fire truck on the Dome."},
   {"name": "CAMBRIDGE FOOD LANDMARKS", "tiles": ["MR BARTLEY'S", "TOSCANINI'S", "DARWIN'S", "FLOUR"],
    "note": "Bartley's has named a burger after every politician since the 1960s; Toscanini's ice cream was called the best in the world by the New York Times."},
   {"name": "BOSTON ___", "tiles": ["CREAM PIE", "TERRIER", "MARATHON", "TEA PARTY"],
    "note": "Boston cream pie is a cake, the Boston terrier is the state dog, and the marathon has been run on Patriots' Day since 1897."},
 ],
 "traps": [
   ["MASS AVE", 1, "MIT's address is literally 77 Massachusetts Avenue, and the Dome sits on it. Mass Ave has a real claim on the MIT group."],
   ["GARDEN", 3, "The Boston Garden is where the Celtics and the Bruins play, so GARDEN is a Boston ___ before it is a Cambridge street — unless you live on it."],
 ],
 "epilogue": "Two tiles are pointing at the wrong group and neither can move: THE DOME, THE INFINITE, HACKS and STATA CENTER are one campus with no vacancies, and CREAM PIE, TERRIER, MARATHON and TEA PARTY are a full set of Bostons. Mass Ave merely goes past MIT, and the Garden is spelt the same as a street off Cambridge Common.",
},

{
 "title": "Head of the Charles",
 "diff": 4,
 "groups": [
   {"name": "ROWING WORDS", "tiles": ["COXSWAIN", "ERG", "REGATTA", "SHELL"],
    "note": "The Head of the Charles is the largest three-day regatta in the world, about 11,000 athletes every October, and the Weeks Bridge turn is where races are won and lost."},
   {"name": "STREETS OFF HARVARD SQUARE", "tiles": ["JFK STREET", "BOW STREET", "PLYMPTON", "HOLYOKE"],
    "note": "JFK Street was Boylston Street until 1981. Plympton holds the Grolier Poetry Book Shop, open since 1927 and selling nothing but poetry."},
   {"name": "VERY MASSACHUSETTS NOUNS", "tiles": ["PACKIE", "ROTARY", "JIMMIES", "FRAPPE"],
    "note": "Liquor store, roundabout, sprinkles, and a milkshake with ice cream in it — order a 'milkshake' here and you get milk shaken with syrup."},
   {"name": "PLACE NAMES FROM ALGONQUIAN LANGUAGES", "tiles": ["NANTUCKET", "SWAMPSCOTT", "MATTAPAN", "SAUGUS"],
    "note": "Massachusetts itself is Algonquian — roughly 'at the great hill' — as are Mystic, Neponset, Cochituate and about half the map."},
 ],
 "traps": [
   ["BOW STREET", 0, "The bow is the front of a rowing shell and the name of the seat in it, which makes BOW STREET look like it belongs on the water."],
   ["HOLYOKE", 3, "Holyoke is a Massachusetts city as well as a Harvard Square street, and it sounds every bit as Algonquian as Saugus. It isn't — it is named after a 17th-century Englishman."],
 ],
 "epilogue": "Sixteen tiles that are mostly either an odd noun or a place name, which is the whole difficulty. COXSWAIN, ERG, REGATTA and SHELL are already a full crew and NANTUCKET, SWAMPSCOTT, MATTAPAN and SAUGUS are already a full map, so the bow stays on land and Holyoke stays English.",
},

# ─────────────────────────────────── LONDON ──────────────────────────────────

{
 "title": "Zone 1",
 "diff": 2,
 "groups": [
   {"name": "LINES ON THE UNDERGROUND", "tiles": ["BAKERLOO", "JUBILEE", "CENTRAL", "DISTRICT"],
    "note": "Bakerloo is a 1906 newspaper contraction of Baker Street & Waterloo, and the Metropolitan's proprietor called it a piece of gutter journalism."},
   {"name": "LONDON BOROUGHS", "tiles": ["HACKNEY", "ISLINGTON", "LAMBETH", "SOUTHWARK"],
    "note": "Thirty-two boroughs plus the City, which is not one. Southwark was London's disreputable overflow for centuries because it sat outside the City's jurisdiction."},
   {"name": "LONDON MARKETS", "tiles": ["BOROUGH", "BRICK LANE", "PORTOBELLO", "COLUMBIA ROAD"],
    "note": "Borough has been trading in some form since the 12th century; Columbia Road is flowers only, on Sundays only, and shouted at you from 8 a.m."},
   {"name": "___ CROSS", "tiles": ["KING'S", "CHARING", "RED", "DOUBLE"],
    "note": "King's Cross, Charing Cross, Red Cross, double-cross. Charing Cross is the point every road sign in Britain measures 'London' from."},
 ],
 "traps": [
   ["BOROUGH", 1, "A borough is the actual unit four of these tiles are examples of, and Borough is a place in Southwark with its own tube station. It is here because it is also the market."],
 ],
 "epilogue": "The joke is that BOROUGH is the generic word for the group above it, a neighbourhood, a station and a market — four jobs, one tile. HACKNEY, ISLINGTON, LAMBETH and SOUTHWARK are already four boroughs, so the market keeps its fourth stall.",
},

{
 "title": "Mind the Gap",
 "diff": 3,
 "groups": [
   {"name": "HEARD ON THE UNDERGROUND", "tiles": ["MIND THE GAP", "STAND CLEAR", "TOUCH IN", "SEE IT SAY IT"],
    "note": "'Mind the gap' was recorded in 1968 because the curve at Embankment left a genuinely dangerous space. The original voice was restored to that platform in 2013 at the request of the announcer's widow."},
   {"name": "LONDON PUB NAMES", "tiles": ["RED LION", "ROYAL OAK", "THE CROWN", "THE SHIP"],
    "note": "Red Lion is the commonest pub name in the country and Royal Oak commemorates a king hiding in a tree, which is a very British reason to name a building."},
   {"name": "LONDON GREEN SPACES", "tiles": ["THE HEATH", "CLAPHAM COMMON", "KEW GARDENS", "VICTORIA PARK"],
    "note": "Hampstead Heath is 320 hectares of deliberately unmown London; Victoria Park in the East End was the first park built specifically for the public, in 1845."},
   {"name": "COCKNEY RHYMING SLANG", "tiles": ["DOG AND BONE", "PLATES OF MEAT", "BOAT RACE", "PORKIES"],
    "note": "Phone, feet, face, and lies — porkies from pork pies. The good ones drop the rhyming half entirely, which is why nobody can follow them."},
 ],
 "traps": [
   ["BOAT RACE", 2, "The Boat Race is a fixture of the London river and the towpath it is watched from, so on a board with green spaces it reads as a place you stand rather than a word for your face."],
   ["THE CROWN", 0, "'The Crown' sounds like something an announcer would say and is the name of about four hundred pubs. Only one of those is a group here."],
 ],
 "epilogue": "Two of the four groups are things you hear rather than see, which is the board's real trick. THE HEATH, CLAPHAM COMMON, KEW GARDENS and VICTORIA PARK cannot be anything else, and neither can MIND THE GAP, STAND CLEAR, TOUCH IN and SEE IT SAY IT — so the pub keeps its crown and the boat race stays a face.",
},

{
 "title": "The Knowledge",
 "diff": 4,
 "groups": [
   {"name": "LONDON RAIL TERMINI", "tiles": ["PADDINGTON", "EUSTON", "WATERLOO", "ST PANCRAS"],
    "note": "Fourteen terminus stations, more than any city on earth, because the Victorian railway companies were forbidden from tunnelling into the middle and all stopped at the edge."},
   {"name": "BRIDGES OVER THE THAMES", "tiles": ["TOWER", "MILLENNIUM", "ALBERT", "CHELSEA"],
    "note": "The Millennium wobbled so badly on its opening weekend in 2000 that it shut for two years; Albert Bridge still carries a sign asking troops to break step."},
   {"name": "LONDON FOOD, PROPERLY LONDON", "tiles": ["PIE AND MASH", "JELLIED EELS", "FULL ENGLISH", "BEIGEL"],
    "note": "Eels were the cheap protein of the tidal Thames, and the Brick Lane beigel shops — spelt that way, boiled not baked — have not shut since the 1970s."},
   {"name": "___ GARDEN", "tiles": ["COVENT", "KITCHEN", "BEER", "WINTER"],
    "note": "Covent Garden was a convent garden. The other three are places to grow food, drink beer and keep plants alive through February."},
 ],
 "traps": [
   ["WATERLOO", 1, "Waterloo Bridge is a real Thames crossing, built by a mostly female workforce during the war and nicknamed the Ladies' Bridge. It is also the busiest station in Britain."],
 ],
 "epilogue": "WATERLOO is the double agent and it loses on arithmetic: TOWER, MILLENNIUM, ALBERT and CHELSEA are already four bridges and cannot spare a place. If you tried to make a station group out of BEIGEL, that is a Brick Lane problem, not a puzzle problem.",
},

{
 "title": "The Great",
 "diff": 5,
 "groups": [
   {"name": "LOST RIVERS OF LONDON", "tiles": ["FLEET", "TYBURN", "WESTBOURNE", "EFFRA"],
    "note": "All four still run, in pipes: the Fleet under Farringdon Road, the Westbourne through a metal tube above the platforms at Sloane Square, where you can watch it go by."},
   {"name": "STREETS IN THE SQUARE MILE", "tiles": ["THREADNEEDLE", "CHEAPSIDE", "POULTRY", "BREAD STREET"],
    "note": "The City's streets are a medieval shopping list — Poultry, Bread Street, Milk Street, Honey Lane — and Cheapside is from 'ceap', to barter, not from cheap."},
   {"name": "LONDON'S OLD PRISONS", "tiles": ["NEWGATE", "MARSHALSEA", "THE CLINK", "BRIDEWELL"],
    "note": "Dickens's father was in the Marshalsea for debt, which is most of Little Dorrit. The Clink gave English 'in the clink' and Bridewell gave it a word for a whole class of prison."},
   {"name": "PRECEDED BY 'THE GREAT'", "tiles": ["FIRE", "PLAGUE", "STINK", "SMOG"],
    "note": "1666, 1665, 1858 and 1952. The Great Stink got the Thames embanked and sewered; the Great Smog killed thousands in five days and produced the Clean Air Act."},
 ],
 "traps": [
   ["FLEET", 2, "The Fleet Prison stood on the bank of the Fleet for six hundred years and gave its name to the clandestine 'Fleet marriages'. The river came first."],
   ["TYBURN", 2, "Tyburn is where London hanged people for six centuries and the phrase 'Tyburn tree' meant the gallows. It is also a river, which is why Marble Arch smells faintly of it."],
   ["NEWGATE", 1, "Newgate Street is a real City street on the line of a real Roman gate, and every other tile in the street group is a plain trade noun. The prison is the famous one."],
 ],
 "epilogue": "The hardest board in the pack: three tiles are pointing at the punishment group and the punishment group is full. FLEET and TYBURN are water before they are gallows, and NEWGATE is a prison before it is a postcode — the rivers only resolve because a river group of two is not a group.",
},

# ────────────────────────────────── EDINBURGH ────────────────────────────────

{
 "title": "Auld Reekie",
 "diff": 2,
 "groups": [
   {"name": "HILLS IN EDINBURGH", "tiles": ["ARTHUR'S SEAT", "CALTON HILL", "BLACKFORD HILL", "CORSTORPHINE"],
    "note": "Arthur's Seat is the plug of a volcano that stopped erupting about 340 million years ago and is now climbed by people in office shoes on their lunch break."},
   {"name": "CLOSES OFF THE ROYAL MILE", "tiles": ["MARY KING'S", "ADVOCATE'S", "ANCHOR", "WORLD'S END"],
    "note": "Mary King's Close was built over, not demolished, so it is still down there under the City Chambers. World's End sat at the old city wall — beyond it you were nobody's problem."},
   {"name": "EDINBURGH FESTIVALS", "tiles": ["FRINGE", "HOGMANAY", "BELTANE", "THE TATTOO"],
    "note": "The Fringe began in 1947 as eight companies who were not invited to the official festival and turned up anyway. Beltane is a fire ceremony revived in 1988 on Calton Hill."},
   {"name": "SCOTS WORDS FOR A LANE", "tiles": ["WYND", "BRAE", "PEND", "VENNEL"],
    "note": "A wynd is a narrow through-route, a brae is a slope, a pend is an arched passage under a building, and a vennel runs between two buildings."},
 ],
 "traps": [
   ["CALTON HILL", 2, "Beltane happens on Calton Hill and the Hogmanay torchlight procession ends there — two of the festivals in the blue group are literally held on this tile."],
 ],
 "epilogue": "CLOSE is deliberately not on this board: it is both a Royal Mile close and the fifth Scots word for a lane, and one tile cannot sit in two groups. FRINGE, HOGMANAY, BELTANE and THE TATTOO are already four festivals, so Calton Hill stays geology.",
},

{
 "title": "The Shore",
 "diff": 3,
 "groups": [
   {"name": "LEITH LANDMARKS", "tiles": ["THE SHORE", "LEITH WALK", "OCEAN TERMINAL", "BRITANNIA"],
    "note": "The royal yacht has been moored at Ocean Terminal since 1998, which means Leith's biggest tourist attraction is a decommissioned boat with the Queen's writing desk on it."},
   {"name": "WATER IN EDINBURGH", "tiles": ["WATER OF LEITH", "UNION CANAL", "THE FORTH", "DUDDINGSTON"],
    "note": "The Water of Leith runs 35 km from the Pentlands to the docks; the Union Canal ends in the middle of Fountainbridge and once carried coal to Glasgow."},
   {"name": "TRAINSPOTTING CHARACTERS", "tiles": ["RENTON", "SICK BOY", "SPUD", "BEGBIE"],
    "note": "Irvine Welsh set it in Leith when Leith was the poorest part of the city. The opening monologue was filmed on Princes Street and the rest mostly in Glasgow."},
   {"name": "SCOTS WEATHER WORDS", "tiles": ["DREICH", "HAAR", "SMIRR", "SNELL"],
    "note": "Dreich is grey and endless, haar is the cold sea fog that swallows the city from the east, smirr is rain too fine to bother with a hood for, and snell is a wind with an edge."},
 ],
 "traps": [
   ["WATER OF LEITH", 0, "The Water of Leith gives Leith its name and runs through everything in the yellow group. It is a Leith landmark by any reasonable reading."],
   ["HAAR", 1, "The haar comes off the Forth and is made of it — sea fog is water, and this board has a water group."],
 ],
 "epilogue": "Both double-fits lose to the same arithmetic: THE SHORE, LEITH WALK, OCEAN TERMINAL and BRITANNIA are four Leith landmarks with no vacancy, and DREICH, SMIRR and SNELL need a fourth kind of weather. The haar is the most Edinburgh thing on the board and it still has to stay in its box.",
},

{
 "title": "Marchmont",
 "diff": 3,
 "groups": [
   {"name": "EDINBURGH STUDENT DISTRICTS", "tiles": ["MARCHMONT", "TOLLCROSS", "NEWINGTON", "BRUNTSFIELD"],
    "note": "Marchmont is four storeys of Victorian tenement flats let almost entirely to twenty-two-year-olds, and its bins are a reliable September indicator of the academic calendar."},
   {"name": "FEATURES OF A TENEMENT FLAT", "tiles": ["THE STAIR", "DRYING GREEN", "BOX ROOM", "BAY WINDOW"],
    "note": "The stair is the shared stone staircase and also the social unit — a stair has a rota, a smell, and opinions. The drying green is the communal grass nobody's washing ever dries on."},
   {"name": "EDINBURGH PUBS AND VENUES", "tiles": ["SANDY BELL'S", "THE PEAR TREE", "SNEAKY PETE'S", "BONGO CLUB"],
    "note": "Sandy Bell's has had live traditional music nightly since the 1940s; Sneaky Pete's holds about a hundred people and books bands two years before anyone has heard of them."},
   {"name": "SCOTS FOR EVERYDAY THINGS", "tiles": ["MESSAGES", "BAIRN", "KEN", "GREET"],
    "note": "Messages are the groceries, a bairn is a child, ken is know, and to greet is to cry — which is why 'the bairn's greeting' is a sentence and not a riddle."},
 ],
 "traps": [
   ["TOLLCROSS", 2, "Tollcross is the theatre district — the King's, the Cameo, the Traverse round the corner — so on a board with venues it reads as somewhere you go out rather than somewhere you live."],
   ["THE PEAR TREE", 1, "The Pear Tree's whole reputation is its beer garden, which is the closest thing central Edinburgh has to a drying green with a licence."],
 ],
 "epilogue": "This is the six-years board: a flat, a bin rota, a walk to the pub and four words you only started using because everyone around you did. SANDY BELL'S, SNEAKY PETE'S and BONGO CLUB are three venues that need a fourth, and MARCHMONT, NEWINGTON and BRUNTSFIELD are three addresses that need one too — TOLLCROSS is an address, and the Pear Tree pours pints.",
},

{
 "title": "The Athens of the North",
 "diff": 5,
 "groups": [
   {"name": "WRITERS FROM EDINBURGH", "tiles": ["STEVENSON", "MURIEL SPARK", "IAN RANKIN", "CONAN DOYLE"],
    "note": "Conan Doyle built Sherlock Holmes out of Joseph Bell, an Edinburgh surgeon who diagnosed strangers for teaching purposes. Rankin's Rebus drinks in the Oxford Bar, which is a real pub."},
   {"name": "THE SCOTTISH ENLIGHTENMENT", "tiles": ["HUME", "ADAM SMITH", "JOSEPH BLACK", "HUTTON"],
    "note": "Hume, Smith, Black and Hutton all knew each other, drank in the same Old Town taverns, and between them produced modern philosophy, economics, chemistry and geology in about forty years."},
   {"name": "MONUMENTS ON THE SKYLINE", "tiles": ["NELSON", "DUGALD STEWART", "THE DISGRACE", "SCOTT MONUMENT"],
    "note": "The Dugald Stewart is the little colonnade in every photograph of the city. The National Monument was left unfinished for lack of money and has been called Edinburgh's Disgrace ever since."},
   {"name": "WORDS FROM SCOTS LAW", "tiles": ["PROCURATOR", "SHERIFF", "ADVOCATE", "NOT PROVEN"],
    "note": "Scotland kept its own legal system in 1707. It has three verdicts, not two, and 'not proven' has the same effect as an acquittal and a completely different flavour."},
 ],
 "traps": [
   ["DUGALD STEWART", 1, "Dugald Stewart was a professor of moral philosophy and the man who taught the Enlightenment to the next century. The monument is on Calton Hill; the philosopher belongs in the group above."],
   ["SCOTT MONUMENT", 0, "It is a two-hundred-foot Gothic rocket built for a novelist, on a board with a group of Edinburgh novelists. It is still a monument."],
   ["HUME", 2, "There is a statue of Hume on the Royal Mile with a shiny toe, and a tower named after him. The man came first."],
 ],
 "epilogue": "The hardest board in the pack, and every trap points the same way: three tiles are monuments to the people in another group. STEVENSON, MURIEL SPARK, IAN RANKIN and CONAN DOYLE are four writers with no room for a spire, and PROCURATOR, SHERIFF, ADVOCATE and NOT PROVEN are four legal words that cannot be anything else — so start at the law and work backwards.",
},

# ─────────────────────────────────── HOUSTON ─────────────────────────────────

{
 "title": "Inside the Loop",
 "diff": 2,
 "groups": [
   {"name": "HOUSTON BAYOUS", "tiles": ["BUFFALO", "BRAYS", "WHITE OAK", "SIMS"],
    "note": "The city was founded at the head of navigation on Buffalo Bayou, which is the only reason it is where it is. There are about 2,500 miles of the things inside the county."},
   {"name": "HOUSTON NEIGHBOURHOODS", "tiles": ["MONTROSE", "THE HEIGHTS", "THIRD WARD", "RIVER OAKS"],
    "note": "The wards were the original political divisions and the Third Ward is the historic heart of Black Houston. The Heights was a separate city until 1918 and is still dry in places."},
   {"name": "HOUSTON FREEWAYS", "tiles": ["KATY FREEWAY", "BELTWAY 8", "THE 610 LOOP", "GULF FREEWAY"],
    "note": "The Katy Freeway is up to 26 lanes wide, which makes it the widest motorway in the world and, according to every study of it, no faster than before."},
   {"name": "NICKNAMES FOR HOUSTON", "tiles": ["SPACE CITY", "H-TOWN", "CLUTCH CITY", "BAYOU CITY"],
    "note": "Clutch City was a newspaper's apology: the paper had run 'Choke City' during the 1994 play-offs and the Rockets went on to win the title."},
 ],
 "traps": [
   ["BAYOU CITY", 0, "The nickname is built out of the yellow group. Buffalo, Brays, White Oak and Sims are why anybody calls it that."],
   ["THE 610 LOOP", 3, "'Inside the Loop' and 'outside the Loop' are how Houstonians describe people, not roads — the 610 is a piece of identity with a number on it."],
 ],
 "epilogue": "Every group here is a way of saying where you are from. BUFFALO, BRAYS, WHITE OAK and SIMS are four bayous and cannot spare one for the nickname, and SPACE CITY, H-TOWN and CLUTCH CITY need a fourth — so the Loop stays tarmac and Bayou City stays a nickname.",
},

{
 "title": "Y'all Means All",
 "diff": 3,
 "groups": [
   {"name": "TEX-MEX ON THE TABLE", "tiles": ["QUESO", "FAJITAS", "MIGAS", "BREAKFAST TACO"],
    "note": "Fajitas were popularised at Ninfa's on Navigation in 1973 from a cut nobody wanted, and the breakfast taco is a load-bearing part of the Houston working day."},
   {"name": "HOUSTON FOOD INSTITUTIONS", "tiles": ["WHATABURGER", "SHIPLEY'S", "FRENCHY'S", "NINFA'S"],
    "note": "Frenchy's Creole fried chicken has fed the Third Ward since 1969 and the Astros' clubhouse for most of that; Shipley's does not glaze a doughnut, it lacquers one."},
   {"name": "THE VOCABULARY OF BRISKET", "tiles": ["THE BARK", "SMOKE RING", "MOIST OR LEAN", "BUTCHER PAPER"],
    "note": "You are asked moist or lean, never fatty or dry. The pink smoke ring is a chemical reaction about a centimetre deep and proves nothing, which does not stop anyone measuring it."},
   {"name": "BOUGHT AT A TEXAS GAS STATION", "tiles": ["KOLACHE", "BUC-EE'S", "BIG RED", "BEEF JERKY"],
    "note": "The kolache is Czech, brought by 19th-century settlers to central Texas, and has been quietly filled with sausage. Big Red tastes like liquid bubblegum and is beloved without apology."},
 ],
 "traps": [
   ["BUC-EE'S", 1, "Buc-ee's is as Texan an institution as anything in the green group and people plan drives around it. It is still, technically, a petrol station."],
   ["KOLACHE", 0, "A sausage kolache is a breakfast handheld sold three feet from the breakfast tacos, and half of Houston treats the two as interchangeable."],
 ],
 "epilogue": "Two tiles are trying to get into the institutions group and it is full: WHATABURGER, SHIPLEY'S, FRENCHY'S and NINFA'S are four places with names on the door. The Viet-Cajun crawfish boil is the one great Houston hybrid this board could not fit, which is what an epilogue is for.",
},

{
 "title": "Mission Control",
 "diff": 3,
 "groups": [
   {"name": "HOUSTON SPORTING LEGENDS", "tiles": ["HAKEEM", "BIGGIO", "EARL CAMPBELL", "SIMONE BILES"],
    "note": "Hakeem Olajuwon arrived from Lagos via the University of Houston and never left; Biles trains north of the city and is the most decorated gymnast in history."},
   {"name": "HOUSTON RAP", "tiles": ["DJ SCREW", "UGK", "GETO BOYS", "PAUL WALL"],
    "note": "DJ Screw slowed records to a crawl on mixtapes sold out of a house in South Park, and thirty years later half of American rap is still moving at his tempo."},
   {"name": "MISSION CONTROL VOCABULARY", "tiles": ["NOMINAL", "GO/NO-GO", "THE TRENCH", "CAPCOM"],
    "note": "'Nominal' means exactly as predicted. The Trench is the front row of consoles that flies the vehicle, and CAPCOM is the one astronaut allowed to talk to the crew."},
   {"name": "HOUSTON CAR CULTURE", "tiles": ["SLAB", "SWANGAS", "CANDY PAINT", "CHOPPED"],
    "note": "SLAB is Slow, Loud And Bangin'. Swangas are the wire rims that stick out a foot, candy paint is the deep lacquer, and the boot is open so you can hear what is in it."},
 ],
 "traps": [
   ["THE TRENCH", 0, "American football calls the line of scrimmage the trench, and this board opens with a Houston sports group. In Building 30 it means the front row of flight controllers."],
   ["CHOPPED", 1, "'Chopped and screwed' is DJ Screw's technique and his name is in the phrase — the word belongs to the music as much as to the cars it is played in."],
 ],
 "epilogue": "Four completely different Houstons on one board — the arena, the mixtape, the console and the parking lot — and they overlap because the city does. HAKEEM, BIGGIO, EARL CAMPBELL and SIMONE BILES are four people, DJ SCREW, UGK, GETO BOYS and PAUL WALL are four acts, and that closes both doors.",
},

{
 "title": "No Zoning",
 "diff": 4,
 "groups": [
   {"name": "HOUSTON ART AND ODDITIES", "tiles": ["THE MENIL", "ROTHKO CHAPEL", "BEER CAN HOUSE", "ORANGE SHOW"],
    "note": "The Menil is free, always has been, and Renzo Piano lit it with the roof. The Beer Can House is clad in about 50,000 flattened cans by a retired upholsterer with time on his hands."},
   {"name": "HURRICANES AND STORMS THAT HIT", "tiles": ["HARVEY", "IKE", "ALLISON", "RITA"],
    "note": "Harvey dropped more than 60 inches of rain in 2017, the most from any storm in US history. Allison was only a tropical storm and still flooded the Medical Center's basements."},
   {"name": "HOUSTON SUBURBS", "tiles": ["KATY", "SUGAR LAND", "PEARLAND", "THE WOODLANDS"],
    "note": "Sugar Land was a company town for Imperial Sugar and The Woodlands is a master-planned forest with 120,000 people in it. Katy is where the freeway got its name."},
   {"name": "SAID ONLY IN HOUSTON", "tiles": ["FEEDER ROAD", "THE LOOP", "ICEHOUSE", "OZONE DAY"],
    "note": "A feeder road is the frontage road, an icehouse is an open-air bar that started as somewhere selling cold beer, and an ozone action day is the city asking you not to mow the lawn."},
 ],
 "traps": [
   ["ORANGE SHOW", 3, "The Orange Show is a folk-art monument built over 25 years by a postman who wanted people to eat more oranges. It also sounds exactly like a phrase you would only hear here."],
   ["KATY", 3, "Nobody in Houston says Katy without meaning the freeway, and 'the Katy' is as local a piece of speech as the feeder road that runs beside it."],
 ],
 "epilogue": "A city with no zoning code puts a chapel next to a car park and a suburb inside a hurricane track, which is why this board refuses to sort by type. FEEDER ROAD, THE LOOP, ICEHOUSE and OZONE DAY are already four things nobody says anywhere else, so the Orange Show stays art and Katy stays a suburb.",
},

]
