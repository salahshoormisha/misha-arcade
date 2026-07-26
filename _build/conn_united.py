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

# ── boards 9-20: the rehoused FOURMATIONS material ────────────────────────────

{
 "title": "Fergie Time",
 "diff": 2,
 "groups": [
   {"name": "PHRASES SIR ALEX GAVE THE LANGUAGE", "tiles": ["HAIRDRYER", "SQUEAKY BUM", "THEIR PERCH", "BLOODY HELL"],
    "note": "The hairdryer was delivered from about six inches away; 'squeaky bum time' arrived in 2003; the perch was Liverpool's, and knocking them off it was his stated life's work; 'Football, bloody hell' was all he could manage in Barcelona in 1999."},
   {"name": "MANAGED UNITED BEFORE FERGUSON", "tiles": ["BUSBY", "DOCHERTY", "SEXTON", "ATKINSON"],
    "note": "Busby to 1969, Docherty to 1977 — sacked for the relationship, not the results — Sexton to 1981, Atkinson to 1986. Four men in the seventeen years before the twenty-six."},
   {"name": "UNITED'S FIRST PREMIER LEAGUE CHAMPIONS, 1993", "tiles": ["BRUCE", "PALLISTER", "KANCHELSKIS", "SHARPE"],
    "note": "Twenty-six years without a league title ended in May 1993, in a season where Bruce and Pallister played nearly every minute and Ferguson had just paid Leeds £1.2m for Cantona."},
   {"name": "___ TIME", "tiles": ["FERGIE", "EXTRA", "PART", "BIG"],
    "note": "Fergie time, extra time, part time, big time. Only one of them was measured by a stopwatch that was allegedly running slow."},
 ],
 "traps": [
   ["BRUCE", 1, "Steve Bruce has managed more clubs than most men on this board played for, so he reads as a manager on sight — he simply never managed United."],
   ["FERGIE", 0, "FERGIE on a board of Ferguson's own phrases is bait. It is here for the compound noun the fourth official made famous."],
 ],
 "epilogue": "A calibration board with one nasty little idea in it: two groups are surnames and the surnames look interchangeable, so the question is who held a clipboard and who wore a shirt. BUSBY, DOCHERTY, SEXTON and ATKINSON are four managers already, which is what keeps Steve Bruce in the 1993 side where he belongs.",
},

{
 "title": "Passport Photos",
 "diff": 3,
 "groups": [
   {"name": "UNITED'S BRAZILIANS", "tiles": ["KLEBERSON", "ANDERSON", "FRED", "CASEMIRO"],
    "note": "Kleberson arrived a world champion in 2003 and left in 2005; Anderson cost more than Nani and is remembered mainly for laughing; Casemiro arrived with five Champions Leagues in his suitcase."},
   {"name": "UNITED'S FRENCHMEN", "tiles": ["EVRA", "MARTIAL", "VARANE", "POGBA"],
    "note": "Evra played 379 games and never stopped talking; Martial was 19 and cost £36m and scored on his debut against Liverpool, which bought him about four years of patience."},
   {"name": "KEPT GOAL FOR UNITED", "tiles": ["BARTHEZ", "HOWARD", "ROMERO", "LINDEGAARD"],
    "note": "Barthez won a World Cup and a Champions League before he arrived and still spent two years being described as eccentric; Romero played 61 games in six seasons and lost none of the finals he was allowed near."},
   {"name": "DE ___", "tiles": ["GEA", "LIGT", "BOER", "JONG"],
    "note": "De Gea, De Ligt, De Boer, De Jong. Dutch prefixes and one Spanish one, all of them a goalkeeper or a defender or a midfielder United have owned or wanted."},
 ],
 "traps": [
   ["BARTHEZ", 1, "Fabien Barthez is as French as anyone in the green group and won the 1998 World Cup in goal. He is filed by his job, not his passport."],
   ["GEA", 2, "GEA is two-thirds of the best goalkeeper United have had since Schmeichel, on a board with a goalkeeping group. It is a fragment, not a man."],
 ],
 "epilogue": "Three groups of surnames and one group of prefixes, so the tell is length: GEA, LIGT, BOER and JONG are all too short to be anybody. BARTHEZ is the real double-fit — French AND a United keeper — and the four-man French group has no room for him, which is the only reason he ends up filed under gloves.",
},

{
 "title": "The Ninety-Two",
 "diff": 3,
 "groups": [
   {"name": "HAVE WON THE PREMIER LEAGUE", "tiles": ["BLACKBURN", "LEICESTER", "ARSENAL", "MAN CITY"],
    "note": "Seven clubs have won it in total. Blackburn spent Jack Walker's money in 1995, Leicester spent nothing in 2016, and nobody has since done anything as unlikely as either."},
   {"name": "HAVE NEVER PLAYED A PREMIER LEAGUE SEASON", "tiles": ["MILLWALL", "PRESTON", "PLYMOUTH", "WREXHAM"],
    "note": "Preston were English football's first champions in 1889 and have not been in the top flight since 1961. Wrexham are the third-oldest professional club in the world and have never been higher than the second tier."},
   {"name": "THE CLUB'S ORIGINAL NAME", "tiles": ["NEWTON HEATH", "DIAL SQUARE", "SMALL HEATH", "ST DOMINGO"],
    "note": "Newton Heath became United in 1902, Dial Square became Arsenal, Small Heath became Birmingham City, and St Domingo — a church football team — became Everton."},
   {"name": "___ ROVERS", "tiles": ["TRANMERE", "DONCASTER", "RAITH", "FOREST GREEN"],
    "note": "Tranmere, Doncaster, Raith in Kirkcaldy and Forest Green in Gloucestershire, who are vegan and play on an organic pitch."},
 ],
 "traps": [
   ["BLACKBURN", 3, "Blackburn Rovers. The full name is right there in the purple group and the club has genuinely won the thing, which is what makes it the best tile on the board."],
   ["PRESTON", 0, "Preston North End won the very first English league title without losing a match. 'Won the league' and 'won the Premier League' are a century apart."],
 ],
 "epilogue": "Every tile is a football club, so nothing sorts itself and everything has to be known. BLACKBURN is the double-fit worth admiring — champion and Rover — and it is pinned by counting: TRANMERE, DONCASTER, RAITH and FOREST GREEN are four Rovers already, so the 1995 champions keep their man.",
},

{
 "title": "Theatre of Dreams",
 "diff": 3,
 "groups": [
   {"name": "YOU WALK PAST THESE AT OLD TRAFFORD", "tiles": ["THE TRINITY", "MUNICH CLOCK", "BUSBY WAY", "SIR ALEX STAND"],
    "note": "The Trinity is Best, Law and Charlton in bronze, facing the stand named after the man who came after them. The Munich clock has read 6 February 1958, 3.04pm, since the year it happened."},
   {"name": "SUNG AT OLD TRAFFORD", "tiles": ["GLORY GLORY", "VIVA RONALDO", "TEAR YOU APART", "TWELVE DAYS"],
    "note": "'Giggs will tear you apart again' is Joy Division, borrowed from a band that played four miles away; the Twelve Days of Cantona is a Christmas carol with one gift in it."},
   {"name": "PARTS OF AN OLD ENGLISH GROUND", "tiles": ["TERRACE", "TUNNEL", "DUGOUT", "PADDOCK"],
    "note": "The paddock was the standing strip in front of the main stand, and the terraces went after Hillsborough and the Taylor Report — which is why the singing moved and got quieter."},
   {"name": "___ END", "tiles": ["STRETFORD", "WEEK", "BOOK", "DEAD"],
    "note": "Stretford End, weekend, bookend, dead end. The first one is where the noise came from and, for about thirty years, where you stood if you meant it."},
 ],
 "traps": [
   ["STRETFORD", 0, "The Stretford End is the most famous thing at Old Trafford and belongs in the yellow group in every sense except the grammatical one."],
   ["TERRACE", 3, "A terrace is a row of houses as readily as a bank of standing supporters, and it is sitting one square away from a group of ordinary compound words."],
 ],
 "epilogue": "Two groups about one stadium, one about all stadiums, and one about none of them. STRETFORD is the trap the board is built on: it is Old Trafford furniture AND a compound-word stem, and it goes purple because THE TRINITY, MUNICH CLOCK, BUSBY WAY and SIR ALEX STAND are already four things you can stand in front of.",
},

{
 "title": "Women in Red",
 "diff": 3,
 "groups": [
   {"name": "PLAYED FOR MANCHESTER UNITED WOMEN", "tiles": ["EARPS", "TOONE", "ZELEM", "GALTON"],
    "note": "United only founded a women's team in 2018, which makes Katie Zelem — captain from almost the start — the closest thing the side has to a Foulkes."},
   {"name": "ENGLAND'S EURO 2022 WINNERS", "tiles": ["BRONZE", "WILLIAMSON", "HEMP", "STANWAY"],
    "note": "Wembley, 87,192 people, extra time, Chloe Kelly's shirt over her head. It remains the only major tournament any England senior side has won on home soil since 1966."},
   {"name": "ENGLAND WOMEN'S HEAD COACHES", "tiles": ["POWELL", "SAMPSON", "P. NEVILLE", "WIEGMAN"],
    "note": "Hope Powell had the job for fifteen years and built the professional era; Wiegman won the Euros with two different countries, back to back."},
   {"name": "___ AGE", "tiles": ["STONE", "ICE", "NEW", "OLD"],
    "note": "Stone age, ice age, new age, old age. Four eras and not one of them as short as the one this England team started."},
 ],
 "traps": [
   ["TOONE", 1, "Ella Toone scored the opening goal of the Euro 2022 final, from the halfway line's worth of vision, while a Manchester United player."],
   ["EARPS", 1, "Mary Earps kept goal in that final and was a United player at the time. Both of these tiles are true twice and can only be filed once."],
   ["BRONZE", 3, "BRONZE AGE. Lucy Bronze is a surname that is also a metal that is also an era, on a board with an ___ AGE group."],
 ],
 "epilogue": "Three of these tiles are double-agents and the resolution is arithmetic in both directions. BRONZE, WILLIAMSON, HEMP and STANWAY never played for United, so they are a complete Euro-winning group without EARPS or TOONE — and STONE, ICE, NEW and OLD are a complete set of ages without Lucy Bronze.",
},

{
 "title": "The Interview",
 "diff": 3,
 "groups": [
   {"name": "PLAYED FOR UNITED, LATER MANAGED IN THE PREMIER LEAGUE", "tiles": ["HUGHES", "INCE", "STRACHAN", "SOLSKJÆR"],
    "note": "Hughes managed five Premier League clubs, Ince took Blackburn, Strachan had Coventry and Southampton, and Solskjær kept Cardiff up for exactly no seasons before going home."},
   {"name": "MANAGED UNITED IN THE PREMIER LEAGUE ERA", "tiles": ["VAN GAAL", "MOURINHO", "TEN HAG", "AMORIM"],
    "note": "Ferguson, Moyes, Van Gaal, Mourinho, Solskjær, Rangnick, Ten Hag, Amorim. Eight men since 1992 and five of them since 2013."},
   {"name": "'THE ___ ONE'", "tiles": ["SPECIAL", "NORMAL", "CHOSEN", "HAPPY"],
    "note": "Mourinho called himself the Special One in 2004 and the Happy One in 2013; Klopp answered with the Normal One in 2015; the Stretford End hung a banner calling David Moyes the Chosen One and then took it down."},
   {"name": "HOW A MANAGER ACTUALLY LEAVES", "tiles": ["MUTUAL CONSENT", "GARDEN LEAVE", "P45", "THE BULLET"],
    "note": "'Mutual consent' means the compensation was agreed; 'garden leave' means you are still being paid not to speak; a P45 is the actual British tax form, which is why the phrase stings."},
 ],
 "traps": [
   ["SOLSKJÆR", 1, "Ole Gunnar Solskjær managed United for three years and took them to a European final. He is in yellow because he also managed Cardiff, which is the narrower fact."],
   ["CHOSEN", 1, "The Chosen One was a specific United manager with a specific banner. The tile is an adjective, not David Moyes."],
 ],
 "epilogue": "Two groups of surnames, one of adjectives, one of euphemisms. SOLSKJÆR is the honest double-fit — he did both things — and VAN GAAL, MOURINHO, TEN HAG and AMORIM are four United managers without him, which is the whole resolution. If you tried the nicknames first you had the right idea and the wrong four.",
},

{
 "title": "Deadline Day",
 "diff": 4,
 "groups": [
   {"name": "UNITED SIGNED THEM FROM ANOTHER PREMIER LEAGUE CLUB", "tiles": ["MAGUIRE", "ERIKSEN", "CUNHA", "MBEUMO"],
    "note": "Maguire from Leicester in 2019 for £80m, Eriksen from Brentford on a free in 2022, Cunha from Wolves and Mbeumo from Brentford in the summer of 2025. Two of the four cost nothing but a wage."},
   {"name": "UNITED BUYS THE TERRACES STILL WINCE AT", "tiles": ["BEBÉ", "TAIBI", "DJEMBA-DJEMBA", "KLEBERSON"],
    "note": "Bebé was signed for £7.4m having reportedly never been watched play; Taibi let a Le Tissier shot through his legs and hands in the same movement; Djemba-Djemba was so good they named him twice, in Ferguson's own joke."},
   {"name": "HELD THE WORLD TRANSFER RECORD", "tiles": ["FIGO", "ZIDANE", "POGBA", "NEYMAR"],
    "note": "Figo 2000, Zidane 2001, Pogba 2016, Neymar 2017. Pogba's £89m was the highest fee ever paid by anyone at the time, for a player United had let leave for nothing four years earlier."},
   {"name": "___ WINDOW", "tiles": ["TRANSFER", "BAY", "SHOP", "REAR"],
    "note": "Transfer window, bay window, shop window, Rear Window. The first one only exists because FIFA agreed in 2002 to stop clubs buying players in April."},
 ],
 "traps": [
   ["POGBA", 1, "Pogba's second spell at United is the most argued-about signing of the era, so a group called 'buys the terraces wince at' has a genuine claim on him."],
   ["MAGUIRE", 2, "Harry Maguire was the most expensive defender in the world when he signed, which is a world record of a kind — and the wincing group would also take him."],
 ],
 "epilogue": "Three groups of players, one of compound nouns, and two tiles that could sit in either of the first two groups depending on how you feel about 2019. BEBÉ, TAIBI, DJEMBA-DJEMBA and KLEBERSON are four undisputed answers, and that closes the argument: POGBA is a record fee and MAGUIRE is a Premier League purchase, and the wincing is left as an exercise for the reader.",
},

{
 "title": "Sponsored By",
 "diff": 3,
 "groups": [
   {"name": "HAS BEEN ON THE FRONT OF A UNITED SHIRT", "tiles": ["SHARP", "AON", "TEAMVIEWER", "SNAPDRAGON"],
    "note": "Sharp for eighteen years, then Vodafone, AIG, Aon, Chevrolet, TeamViewer and Snapdragon — the shirt has become a rolling advertisement for whichever industry is having a moment."},
   {"name": "ON SOMEBODY ELSE'S SHIRT IN THE EIGHTIES", "tiles": ["JVC", "HOLSTEN", "CANDY", "CROWN PAINTS"],
    "note": "JVC on Arsenal, Holsten on Tottenham, Candy and then Crown Paints on Liverpool. Shirt sponsors were banned on television until 1983, which is why the older ones look so shy."},
   {"name": "AN ANIMAL ON THE BADGE", "tiles": ["LEICESTER", "WOLVES", "NORWICH", "BRIGHTON"],
    "note": "A fox, a wolf's head, a canary and a seagull. Brighton's seagull arrived because the crowd started chanting 'Seagulls' back at Crystal Palace's 'Eagles' in the 1970s."},
   {"name": "___ SHIRT", "tiles": ["T", "NIGHT", "SWEAT", "HAIR"],
    "note": "T-shirt, nightshirt, sweatshirt, hairshirt. Three garments and one medieval penance, which is also a fair description of some replica kits."},
 ],
 "traps": [
   ["JVC", 0, "JVC is exactly the right vintage and exactly the right kind of electronics company to have sponsored United. It was Arsenal, for eighteen years."],
   ["CANDY", 0, "Candy made washing machines and sponsored Liverpool. On a board about United's shirt it is the most plausible wrong answer available."],
 ],
 "epilogue": "The joke is that two groups are brand names from the same drawer and the only difference is which chest they were printed on. SHARP, AON, TEAMVIEWER and SNAPDRAGON are the four United ones, so JVC and CANDY stay where they were sewn — and if you had the animals early, the badge group is the one part of this board that does not require a memory of the eighties.",
},

{
 "title": "The Anthem",
 "diff": 4,
 "groups": [
   {"name": "ENGLISH CLUBS THAT HAVE WON THE EUROPEAN CUP", "tiles": ["LIVERPOOL", "NOTTM FOREST", "ASTON VILLA", "MAN CITY"],
    "note": "Six English clubs in total. Forest won it twice with a squad assembled for less than the fee for one modern full-back, and Villa's 1982 win was their last trophy of any real size for forty years."},
   {"name": "ITALIAN CLUBS UNITED HAVE MET IN EUROPE", "tiles": ["JUVENTUS", "MILAN", "ROMA", "ATALANTA"],
    "note": "United beat Roma 7-1 in 2007 and lost 3-0 to Milan in the same competition a month later, which tells you most of what you need to know about that team."},
   {"name": "THE CHAMPIONS LEAGUE ANTHEM, LINE BY LINE", "tiles": ["DIE MEISTER", "DIE BESTEN", "LES GRANDES", "THE CHAMPIONS"],
    "note": "Written in 1992 by Tony Britten on a Handel coronation anthem, in German, French and English at once, so that no country could claim it — and so nobody knows more than four words of it."},
   {"name": "___ NET", "tiles": ["INTER", "HAIR", "SAFETY", "SUB"],
    "note": "Internet, hairnet, safety net, subnet. Only one of them has a Champions League pedigree, and it is not the one you can wear."},
 ],
 "traps": [
   ["INTER", 1, "Inter are Italian, United have played them, and INTER is sitting on a board with a group of Italian clubs United have played. It is here for the network."],
   ["MAN CITY", 1, "City have played Italian clubs in Europe repeatedly, and 'club United would rather not discuss' is not one of the four categories."],
 ],
 "epilogue": "INTER is the best trap in the pack: correct in every way except the one that counts. JUVENTUS, MILAN, ROMA and ATALANTA are four Italian opponents already, so Inter goes to the purple — and once you see that HAIR, SAFETY and SUB are all waiting for the same three letters, the whole board unlocks backwards.",
},

{
 "title": "Derby Day",
 "diff": 4,
 "groups": [
   {"name": "MANCHESTER DERBY FOLKLORE", "tiles": ["WHY ALWAYS ME", "THE 6-1", "THE OVERHEAD", "TYPICAL CITY"],
    "note": "Balotelli's shirt in 2011, the 6-1 at Old Trafford six weeks later, Rooney's overhead kick in 2011 that even City fans replay, and 'typical City' — a phrase City fans coined about themselves and then retired."},
   {"name": "WORE BOTH MANCHESTER SHIRTS", "tiles": ["SCHMEICHEL", "BRIAN KIDD", "TEVEZ", "ANDY COLE"],
    "note": "Schmeichel played a season for City in 2002-03, which United fans have decided not to remember. Kidd played for both and coached both, and won the European Cup for one of them on his 19th birthday."},
   {"name": "ENGLISH DERBIES NAMED AFTER THE MAP", "tiles": ["TYNE-WEAR", "EAST ANGLIAN", "M69", "SEVERNSIDE"],
    "note": "Two rivers, a region, a motorway between Leicester and Coventry, and an estuary. When two clubs share nothing else, geography has to do the work."},
   {"name": "___ BLUE", "tiles": ["TRUE", "BABY", "NAVY", "ROYAL"],
    "note": "True blue, baby blue, navy blue, royal blue. City play in sky, which is not on the list, which is the sort of detail this pack considers a joke."},
 ],
 "traps": [
   ["TEVEZ", 0, "Tevez IS derby folklore: the 'Welcome to Manchester' billboard was his face, and it went up on a hoarding United fans drove past."],
   ["ROYAL", 2, "Royal reads like the first half of a derby name — plenty of clubs are Royals — on a board where three groups are proper nouns."],
 ],
 "epilogue": "TEVEZ is the tile that belongs in two places, and folklore loses because WHY ALWAYS ME, THE 6-1, THE OVERHEAD and TYPICAL CITY are already four moments. Everything else is a question of whether a proper noun is a person, a fixture or half a colour — and if you got the blues first, the rest is a Manchester history lesson.",
},

{
 "title": "Feed the Big Man",
 "diff": 4,
 "groups": [
   {"name": "SLANG FOR A SPECTACULAR GOAL", "tiles": ["SCREAMER", "WORLDIE", "ROCKET", "PILEDRIVER"],
    "note": "'Worldie' is the newest of the four and the only one that started on the internet; a piledriver is specifically a low one hit so hard the keeper hears it late."},
   {"name": "SKILL MOVES WITH A NAME", "tiles": ["NUTMEG", "RABONA", "PANENKA", "ELASTICO"],
    "note": "The rabona is named after an Argentine magazine cartoon about playing truant; the panenka after the man who chipped a European Championship final penalty down the middle in 1976."},
   {"name": "WAYS OF SAYING 'HIT IT LONG'", "tiles": ["HOOF", "PUNT", "LAUNCH", "LUMP"],
    "note": "Four verbs a commentator uses when a team has run out of ideas, and one of them — 'lump it' — is the only technical term in English football that is also an insult."},
   {"name": "___ KICK", "tiles": ["FREE", "DROP", "PLACE", "BICYCLE"],
    "note": "Free kick, drop kick, place kick, bicycle kick. Three of them are in the laws of the game and one is in the highlights reel."},
 ],
 "traps": [
   ["BICYCLE", 1, "A bicycle kick is a named skill move — it belongs with the rabona on every logical reading, and with FREE, DROP and PLACE on the grammatical one."],
   ["PUNT", 3, "A punt is a kick, plainly, and PUNT KICK is a phrase in two other sports. It stays in the group of things a centre-half does under pressure."],
 ],
 "epilogue": "Three groups of football slang and one of compound nouns, which is why this board reads as blurry: everything is a kick of some kind. BICYCLE is the honest double-fit and it goes purple because NUTMEG, RABONA, PANENKA and ELASTICO are four named moves already — and because FREE, DROP and PLACE are three-quarters of a rulebook.",
},

{
 "title": "After the Whistle",
 "diff": 5,
 "groups": [
   {"name": "2026 WORLD CUP HOST CITIES", "tiles": ["HOUSTON", "BOSTON", "TORONTO", "MONTERREY"],
    "note": "Sixteen cities across three countries. Boston's matches are in Foxborough, forty minutes out of town, and Houston's are indoors with the roof shut and the air conditioning on."},
   {"name": "FICTIONAL FOOTBALL CLUBS", "tiles": ["AFC RICHMOND", "MELCHESTER", "HARCHESTER", "HOUNSLOW"],
    "note": "Ted Lasso's Richmond, Roy of the Rovers' Melchester, Dream Team's Harchester, and the Hounslow Harriers of Bend It Like Beckham — three of them have won more than United did in the 2010s."},
   {"name": "FOOTBALL COUNTS THESE IN FOURS", "tiles": ["BACK FOUR", "FOUR-FOUR-TWO", "QUADRUPLE", "FOURTH ROUND"],
    "note": "The flat back four was English orthodoxy for forty years; nobody has ever won a quadruple in England; and the FA Cup fourth round is the one where the giant-killing usually happens."},
   {"name": "FULL ___", "tiles": ["TIME", "ENGLISH", "MOON", "HOUSE"],
    "note": "Full time, full English, full moon, full house. One of them is how this pack ends and one of them is what you eat before an eleven o'clock kick-off."},
 ],
 "traps": [
   ["HOUNSLOW", 0, "Hounslow is a real London borough with a real football pitch in it, sitting on a board that opens with four real cities."],
   ["BOSTON", 1, "Boston United are an actual English club, from Lincolnshire, which puts BOSTON one letter away from the fictional group and one flight from the World Cup."],
 ],
 "epilogue": "The last board, and it is built out of places that may or may not exist. HOUNSLOW and BOSTON both have a foot in two groups, and the fix is that HOUSTON, TORONTO and MONTERREY are unarguably hosting matches in 2026 — which leaves Boston with them and Hounslow with the Harriers. Two of those host cities are the players' own, which is the only reason this board exists.",
},

]
