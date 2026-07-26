# -*- coding: utf-8 -*-
"""CAMBRIDGE pack — 6 boards. Harvard Square, the Red Line, the Charles,
and the parts of 02138 that only make sense if you live here."""

BOARDS = [

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
 "traps": [],
 "epilogue": "No double agents here — the difficulty is knowing that Massachusetts Hall is a building and not a school, and that Sever is a lecture hall and not a house. Widener holds about 3.5 million volumes and is named for a man who died on the Titanic.",
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
   {"name": "COLLEGES WITHIN A BIKE RIDE", "tiles": ["TUFTS", "LESLEY", "BU", "BERKLEE"],
    "note": "Lesley is in Cambridge, Tufts straddles Medford and Somerville, and Berklee has produced more Grammy winners than most countries."},
 ],
 "traps": [
   ["MASS AVE", 1, "MIT's address is literally 77 Massachusetts Avenue, and the Dome sits on it. Mass Ave has a real claim on the MIT group."],
 ],
 "epilogue": "MASS AVE runs from Harvard Square past MIT to Boston, which is exactly why it looks like it belongs in two places. THE DOME, THE INFINITE, HACKS and STATA CENTER are all inside one campus; Mass Ave merely goes past it.",
},

{
 "title": "Town and Gown",
 "diff": 3,
 "groups": [
   {"name": "HARVARD TRADITIONS", "tiles": ["PRIMAL SCREAM", "HOUSING DAY", "COMMENCEMENT", "THE GAME"],
    "note": "Primal Scream is a naked lap of the Yard at midnight before finals. The Game is Harvard–Yale, played since 1875, and 'The Game' is all anybody calls it."},
   {"name": "HARVARD STUDENT INSTITUTIONS", "tiles": ["THE CRIMSON", "HASTY PUDDING", "LAMPOON", "GLEE CLUB"],
    "note": "The Lampoon is the oldest continuously published humour magazine in the world and its castle has a stolen ibis on the roof."},
   {"name": "VERY MASSACHUSETTS NOUNS", "tiles": ["PACKIE", "ROTARY", "JIMMIES", "FRAPPE"],
    "note": "Liquor store, roundabout, sprinkles, and a milkshake with ice cream in it — order a 'milkshake' here and you get milk shaken with syrup."},
   {"name": "BOSTON ___", "tiles": ["CREAM PIE", "TERRIER", "MARATHON", "TEA PARTY"],
    "note": "Boston cream pie is a cake, the Boston terrier is the state dog, and the marathon has been run on Patriots' Day since 1897."},
 ],
 "traps": [
   ["TEA PARTY", 2, "The Boston Tea Party is about as Massachusetts as a noun can get, so it reads perfectly well as local vocabulary rather than as a compound."],
 ],
 "epilogue": "TEA PARTY is the tile with two passports: a genuine Boston ___ compound and a genuinely Massachusetts thing. PACKIE, ROTARY, JIMMIES and FRAPPE are words you'd only hear said out loud, and that is the line that settles it.",
},

{
 "title": "Head of the Charles",
 "diff": 4,
 "groups": [
   {"name": "ROWING WORDS", "tiles": ["COXSWAIN", "ERG", "REGATTA", "SHELL"],
    "note": "The Head of the Charles is the largest three-day regatta in the world, about 11,000 athletes every October, and the Weeks Bridge turn is where races are won and lost."},
   {"name": "COMPANIES BASED IN CAMBRIDGE", "tiles": ["MODERNA", "AKAMAI", "HUBSPOT", "BIOGEN"],
    "note": "Kendall Square is routinely called the most innovative square mile on earth, which is a marketing line that happens to be defensible."},
   {"name": "STREETS OFF HARVARD SQUARE", "tiles": ["JFK STREET", "BOW STREET", "PLYMPTON", "HOLYOKE"],
    "note": "JFK Street was Boylston Street until 1981. Plympton holds the Grolier Poetry Book Shop, open since 1927 and selling nothing but poetry."},
   {"name": "PLACE NAMES FROM ALGONQUIAN LANGUAGES", "tiles": ["NANTUCKET", "SWAMPSCOTT", "MATTAPAN", "SAUGUS"],
    "note": "Massachusetts itself is Algonquian — roughly 'at the great hill' — as are Mystic, Neponset, Cochituate and about half the map."},
 ],
 "traps": [
   ["BOW STREET", 0, "The bow is the front of a rowing shell and the name of the seat in it, which makes BOW STREET look like it belongs on the water."],
 ],
 "epilogue": "BOW STREET is a rowing word with a street sign on it, and this board has both. COXSWAIN, ERG, REGATTA and SHELL are already a full crew, so the bow stays on land — where, in fairness, it runs past a very good bookshop.",
},

{
 "title": "Commencement",
 "diff": 5,
 "groups": [
   {"name": "PRESIDENTS OF HARVARD", "tiles": ["CONANT", "PUSEY", "BOK", "SUMMERS"],
    "note": "Conant ran the place from 1933 to 1953 and helped build the atomic bomb in the middle of it; Bok served twice, twenty years apart."},
   {"name": "LIVED IN CAMBRIDGE", "tiles": ["JULIA CHILD", "E E CUMMINGS", "LONGFELLOW", "ROBERT FROST"],
    "note": "Julia Child's kitchen on Irving Street was disassembled and rebuilt inside the Smithsonian. Longfellow's house on Brattle Street was Washington's headquarters first."},
   {"name": "LOCAL UNIVERSITY MOTTOES", "tiles": ["VERITAS", "MENS ET MANUS", "LUX ET VERITAS", "PAX ET LUX"],
    "note": "Truth (Harvard), mind and hand (MIT), light and truth (Yale), peace and light (Tufts). Everybody wanted truth and only one of them got it unqualified."},
   {"name": "MBTA LINES", "tiles": ["RED", "ORANGE", "BLUE", "SILVER"],
    "note": "Plus the Green Line. The colours were assigned in 1965: red for Harvard's crimson, green for the Emerald Necklace, blue for the harbour, orange for Orange Street."},
 ],
 "traps": [],
 "epilogue": "The purple is four colours that aren't about colour, and the red one is named after the university in the group above it — the Red Line got its colour because it ends at Harvard. If you spent a while looking for a fifth motto, that's the board doing its job.",
},

]
