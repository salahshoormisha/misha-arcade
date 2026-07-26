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

]
