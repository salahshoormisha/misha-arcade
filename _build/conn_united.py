# -*- coding: utf-8 -*-
"""UNITED pack — 20 boards. Manchester United and the Premier League at large.

The sibling project /Users/mishasalahshoor/fourmations/puzzles.js (36 boards,
144 groups) is being RETIRED, so its best football material is rehoused here.
Boards 9-20 adapt it rather than copy it: where a FOURMATIONS category was
worth keeping, the framing is reworded and at least one tile is changed, so no
group in this pack is identical to one of those 144 by tile set or by name
(gen_connections.py checks both and reports any that are).

Two notes from the players about FOURMATIONS, which boards 9-20 are built to fix:

  1. It was "a little too niche and a little too hard" — pitched at a
     statistician. So: no group that needs a record book. Every group here is
     something a fan who watches the football would know or could reason to.
  2. It was "spiky" — some boards were trivially easy because each group was an
     obvious four-of-a-kind (four stadiums, four countries, four managers), so
     the tiles sorted themselves on sight. So: on every board here at least two
     groups share a surface type — usually two or three sets of surnames, or two
     sets of club names — and the fourth is wordplay that steals from them. Type
     never partitions the board; knowledge does.
"""

BOARDS = [

{
 "title": "Home Ground",
 "diff": 1,
 "groups": [
   {"name": "MANCHESTER BANDS", "tiles": ["OASIS", "THE SMITHS", "JOY DIVISION", "NEW ORDER"],
    "note": "Joy Division became New Order after Ian Curtis died in 1980 — technically half a group, and the only reason both fit."},
   {"name": "SIR ALEX FERGUSON MANAGED THEM", "tiles": ["EAST STIRLING", "ST MIRREN", "ABERDEEN", "SCOTLAND"],
    "note": "East Stirlingshire in 1974 with eight players and no goalkeeper. Aberdeen broke the Old Firm and beat Real Madrid. Scotland he took to Mexico '86 after Jock Stein died at Ninian Park."},
   {"name": "UNITED'S HOME GROUNDS", "tiles": ["NORTH ROAD", "BANK STREET", "OLD TRAFFORD", "MAINE ROAD"],
    "note": "North Road 1878, Bank Street 1893, Old Trafford 1910 — and Maine Road from 1946 to 1949, because the Luftwaffe had flattened Old Trafford and City lent them the ground."},
   {"name": "MANCHESTER PLACES", "tiles": ["CURRY MILE", "CANAL STREET", "THE HACIENDA", "DEANSGATE"],
    "note": "The Haçienda was funded by New Order's record sales and lost money on every pint it ever sold. FAC 51, 1982 to 1997."},
 ],
 "traps": [
   ["OLD TRAFFORD", 3, "Old Trafford is the most famous place in Manchester and would sit very comfortably in the last group — though pedantically it is in the Borough of Trafford, not the city."],
   ["MAINE ROAD", 3, "Maine Road really is a Manchester place — Moss Side, to be exact. It is also, for three post-war seasons, a United home ground."],
 ],
 "epilogue": "The gentlest board in the pack and it still has a sting: two of the grounds are also just places in Manchester, and one of them belonged to City. Count the venues United actually played home matches at — there are exactly four, and the Haçienda is not one of them.",
},

{
 "title": "Numbers Up",
 "diff": 2,
 "groups": [
   {"name": "UNITED'S RECORD APPEARANCE MAKERS", "tiles": ["GIGGS", "CHARLTON", "SCHOLES", "FOULKES"],
    "note": "963, 758, 718, 688. Giggs's total is not going to be beaten by anybody, ever, in any sport, in this country."},
   {"name": "WORE UNITED'S NO. 10", "tiles": ["ROONEY", "SHERINGHAM", "VAN NISTELROOY", "RASHFORD"],
    "note": "Squad numbers only arrived in 1993–94. Since then the 10 has been a striker's shirt without exception."},
   {"name": "PLAYED IN THE 1968 EUROPEAN CUP FINAL", "tiles": ["STILES", "CRERAND", "ASTON", "DUNNE"],
    "note": "Wembley, 4–1 after extra time, ten years and three months after Munich. John Aston had the game of his life on the left wing and nobody remembers."},
   {"name": "___ CARD", "tiles": ["RED", "WILD", "POST", "FLASH"],
    "note": "Red card, wildcard, postcard, flashcard. Only one of them gets you an early bath."},
 ],
 "traps": [
   ["CHARLTON", 2, "Bobby Charlton scored twice in the 1968 final. He is also United's second-highest appearance maker, and only one of those facts gets a seat."],
   ["FOULKES", 2, "Bill Foulkes played centre-half in that same 1968 final AND is fourth on the all-time appearance list. A genuinely two-homed tile."],
 ],
 "epilogue": "Two men played in 1968 and are also in the all-time top four, which is not a coincidence — that is what a career at one club looks like. STILES, CRERAND, ASTON and DUNNE have only one qualification between them, so the final fills itself and the appearance list takes the leftovers.",
},

{
 "title": "The Caretakers",
 "diff": 2,
 "groups": [
   {"name": "UNITED'S KIT MANUFACTURERS", "tiles": ["ADMIRAL", "ADIDAS", "UMBRO", "NIKE"],
    "note": "Admiral 1975, Adidas 1980, Umbro 1992, Nike 2002, Adidas again from 2015. The 1992 Umbro deal outfitted the first Premier League title in 26 years."},
   {"name": "TOOK CHARGE OF UNITED IN A CARETAKER OR INTERIM SPELL", "tiles": ["GIGGS", "CARRICK", "RANGNICK", "VAN NISTELROOY"],
    "note": "Giggs after Moyes in 2014, Carrick after Solskjær in 2021, Rangnick for the rest of that season, Van Nistelrooy for four games in 2024. Carrick won two and drew one and left."},
   {"name": "BEAT UNITED IN AN FA CUP FINAL", "tiles": ["SOUTHAMPTON", "EVERTON", "CHELSEA", "MAN CITY"],
    "note": "Southampton 1976 (Bobby Stokes, second division), Everton 1995, Chelsea twice, City in 2023 — the first all-Manchester final in the competition's history."},
   {"name": "UNITED NICKNAMES", "tiles": ["SPARKY", "CHOCCY", "THE GUV'NOR", "WAZZA"],
    "note": "Mark Hughes, Brian McClair, Paul Ince and Wayne Rooney. Ince gave himself his; that is the entire personality of Paul Ince."},
 ],
 "traps": [],
 "epilogue": "No double agents on this one — the difficulty is entirely in knowing that Rangnick's title was 'interim manager' and Carrick's lasted three matches. If the nicknames went last, that is the correct order of operations.",
},

{
 "title": "Bloodlines",
 "diff": 3,
 "groups": [
   {"name": "UNITED'S DUTCHMEN", "tiles": ["BLIND", "DE LIGT", "WEGHORST", "DEPAY"],
    "note": "Daley Blind's father Danny won the European Cup with Ajax; Daley won the Europa League with United in 2017."},
   {"name": "SCOTS AT OLD TRAFFORD", "tiles": ["MCCLAIR", "MCTOMINAY", "DENIS LAW", "FLETCHER"],
    "note": "McClair scored 24 in his first season, the first United player past 20 since Best. Law is still the only Scot to win the Ballon d'Or."},
   {"name": "CAME THROUGH UNITED'S ACADEMY", "tiles": ["RASHFORD", "MAINOO", "WELBECK", "WES BROWN"],
    "note": "United have named an academy graduate in every matchday squad since October 1937 — the longest unbroken run in English football."},
   {"name": "OLD ___", "tiles": ["TRAFFORD", "FIRM", "MASTER", "TIMER"],
    "note": "Old Trafford, Old Firm, old master, old timer. Only one of them is a ground, and it isn't the one in Glasgow."},
 ],
 "traps": [
   ["FLETCHER", 2, "Darren Fletcher is Scottish AND a United academy graduate — he joined at 11 and later ran the academy. Both groups have a legitimate claim."],
   ["MCTOMINAY", 2, "Scott McTominay came through the same academy, having declared for Scotland through his grandmother. Same double claim as Fletcher."],
 ],
 "epilogue": "Two Scots are also academy boys, which is what happens when a club scouts north of the border for a hundred years. RASHFORD, MAINOO, WELBECK and WES BROWN can only be one thing, so the academy is full before the Scots even sit down.",
},

{
 "title": "Those Other Nights in Europe",
 "diff": 3,
 "groups": [
   {"name": "UNITED'S EUROPEAN CUP FINAL OPPONENTS", "tiles": ["BENFICA", "BAYERN", "CHELSEA", "BARCELONA"],
    "note": "Benfica 1968, Bayern 1999, Chelsea 2008, Barcelona 2009 and 2011. Two won, three lost — and Barcelona did it twice, which still stings."},
   {"name": "SCORED FOR UNITED IN A EUROPEAN FINAL", "tiles": ["BEST", "KIDD", "SHERINGHAM", "RONALDO"],
    "note": "Best and Kidd in extra time at Wembley in '68 — Kidd on his 19th birthday. Sheringham in Barcelona, Ronaldo with a header in the Moscow rain."},
   {"name": "IN UNITED'S EUROPEAN TROPHY CABINET", "tiles": ["EUROPEAN CUP", "EUROPA LEAGUE", "UEFA SUPER CUP", "CLUB WORLD CUP"],
    "note": "Three European Cups, the 1991 Cup Winners' Cup and Super Cup, the 1999 Intercontinental, the 2008 Club World Cup, and Mourinho's Europa League in 2017."},
   {"name": "___ CUP", "tiles": ["BUTTER", "HIC", "TEA", "EGG"],
    "note": "Buttercup, hiccup, teacup, egg cup. None of them has ever been paraded round Deansgate on an open-top bus."},
 ],
 "traps": [],
 "epilogue": "Four groups, three of them about silverware, and the last one about a flower and a spasm of the diaphragm. The purple is a relief valve — after three rows of European history, the answer is that CUP was never the point.",
},

{
 "title": "Word on the Shirt",
 "diff": 4,
 "groups": [
   {"name": "UNITED MEN WITH A WORLD CUP WINNER'S MEDAL", "tiles": ["STILES", "SCHWEINSTEIGER", "POGBA", "L. MARTÍNEZ"],
    "note": "Stiles won his at United in 1966; Schweinsteiger arrived with his in 2015; Pogba won his as a United player in 2018; Lisandro Martínez had been at the club four months when Argentina won in 2022."},
   {"name": "COLOURS IN THE SURNAME", "tiles": ["BLACKMORE", "WHITESIDE", "GREENHOFF", "BROWN"],
    "note": "Clayton Blackmore, Norman Whiteside, the Greenhoff brothers and Wes Brown — a full paint chart, all of them genuinely United."},
   {"name": "UNITED SURNAMES THAT ARE ORDINARY WORDS", "tiles": ["BUTT", "PARK", "BLIND", "MAY"],
    "note": "Nicky Butt, Park Ji-sung, Daley Blind, David May. Read the team sheet as a sentence and it nearly works."},
   {"name": "ON THE MANCHESTER UNITED CREST", "tiles": ["SHIP", "TRIDENT", "RED DEVIL", "FOOTBALLS"],
    "note": "The ship comes from Manchester's city arms and the Ship Canal; the devil arrived in the 1960s from the rugby league nickname Busby borrowed."},
 ],
 "traps": [
   ["BROWN", 2, "BROWN is a colour in a surname and also, flatly, an ordinary English word. It qualifies for two groups on pure logic."],
 ],
 "epilogue": "BROWN is the honest double-fit: a colour AND a word you'd find in a dictionary. The resolution is that BLACKMORE, WHITESIDE and GREENHOFF are not words, so the colour group needs BROWN more than the word group does — and BUTT, PARK and BLIND make four on their own.",
},

{
 "title": "Crossing the Line",
 "diff": 4,
 "groups": [
   {"name": "PLAYED FOR UNITED AND LIVERPOOL", "tiles": ["MICHAEL OWEN", "PAUL INCE", "BEARDSLEY", "CHISNALL"],
    "note": "Phil Chisnall in 1964 is still the last player transferred directly between the two clubs. Beardsley played one match for United, in a League Cup tie in 1982, and was sold."},
   {"name": "UNITED OLD BOYS IN THE PUNDIT'S CHAIR", "tiles": ["KEANE", "SCHOLES", "RIO FERDINAND", "G. NEVILLE"],
    "note": "Keane's job is to be appalled, Neville's is to explain why, Ferdinand's is to laugh, and Scholes's is to say four words and leave."},
   {"name": "SURVIVED MUNICH AND PLAYED FOR UNITED AGAIN", "tiles": ["BOBBY CHARLTON", "BILL FOULKES", "HARRY GREGG", "DENNIS VIOLLET"],
    "note": "6 February 1958. Gregg went back into the burning aircraft twice and pulled out a baby and her mother. Viollet came back and scored 32 league goals in 1959–60, still a club record."},
   {"name": "___ FORD", "tiles": ["TRAF", "OX", "BED", "SAL"],
    "note": "Trafford, Oxford, Bedford, Salford — and Salford City is the one the Class of '92 bought."},
 ],
 "traps": [
   ["MICHAEL OWEN", 1, "Michael Owen is on television more often than most of the pundit group, and has been for years. He is here because of the other thing on his CV."],
 ],
 "epilogue": "MICHAEL OWEN is a pundit and a man who played for both, and the pundit chair only seats four. KEANE, SCHOLES, RIO FERDINAND and G. NEVILLE never wore red and Liverpool red, so they get the studio and Owen gets the awkward CV.",
},

{
 "title": "Full Time",
 "diff": 5,
 "groups": [
   {"name": "BEATEN BY UNITED IN A LEAGUE CUP FINAL", "tiles": ["NOTTM FOREST", "WIGAN", "SPURS", "NEWCASTLE"],
    "note": "1992, 2006, 2009, 2023. The 1992 win over Forest was United's first League Cup and Brian Clough's last final."},
   {"name": "UNITED'S ARGENTINES", "tiles": ["VERÓN", "HEINZE", "GARNACHO", "ROJO"],
    "note": "Verón cost £28.1m in 2001 and confused everybody including himself. Rojo scored maybe three goals and one of them was a 93rd-minute winner in the Champions League."},
   {"name": "WON THE BALLON D'OR AS A UNITED PLAYER", "tiles": ["LAW", "CHARLTON", "BEST", "RONALDO"],
    "note": "1964, 1966, 1968 — three in five years, the Holy Trinity in order — and then a gap of forty years until Ronaldo in 2008."},
   {"name": "___ RED", "tiles": ["CODE", "INFRA", "SEEING", "BLOOD"],
    "note": "Code red, infrared, seeing red, blood red. Four kinds of alarm and not one of them a football club."},
 ],
 "traps": [
   ["CHARLTON", 0, "Charlton Athletic is a real club with a real cup history, and this board is full of clubs United have beaten."],
   ["ROJO", 3, "Rojo is literally the Spanish word for red, on a board with a ___ RED group. Marcos Rojo, red devil, red shirt, red card collection."],
 ],
 "epilogue": "The hardest board in the pack, and both traps are language rather than football: CHARLTON reads as a club and ROJO reads as a colour. Neither can move, because NOTTM FOREST, WIGAN, SPURS and NEWCASTLE are already four, and so are CODE, INFRA, SEEING and BLOOD. Verón would have been proud of the misdirection and baffled by the execution.",
},

]
