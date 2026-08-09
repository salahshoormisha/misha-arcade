# -*- coding: utf-8 -*-
"""GENERAL pack, boards 1-10 (difficulty 1-2). Consumed by gen_connections.py.
Groups are listed EASIEST FIRST — the generator paints them y, g, b, p in that order.
`traps` declares every tile that plausibly reads as a second group on the same board;
the generator proves the board still has exactly one legal partition."""

BOARDS = [

{
 "title": "Warm-Up",
 "diff": 1,
 "groups": [
   {"name": "CITRUS FRUITS", "tiles": ["LEMON", "LIME", "ORANGE", "POMELO"],
    "note": "The pomelo is the big one — grapefruit is its child, a pomelo crossed with a sweet orange."},
   {"name": "SHADES OF PURPLE", "tiles": ["VIOLET", "MAUVE", "LILAC", "AMETHYST"],
    "note": "Mauve was the first synthetic dye, mixed by accident in 1856 by an 18-year-old chasing a cure for malaria."},
   {"name": "___ BALL", "tiles": ["CRYSTAL", "ODD", "MEAT", "SNOW"],
    "note": "Crystal ball, oddball, meatball, snowball. Four very different evenings."},
   {"name": "ANIMALS HIDING INSIDE", "tiles": ["POTTERY", "CRATER", "SHAPELY", "PROWLER"],
    "note": "p-OTTER-y, c-RAT-er, sh-APE-ly, pr-OWL-er. You will never read them normally again."},
 ],
 "traps": [],
 "epilogue": "A gentle one to calibrate on. If you spent a while looking for a fifth citrus, that's the shape of every board from here: the trick is never the words you know, it's the ones you're sure about.",
},

{
 "title": "Kitchen Sink",
 "diff": 1,
 "groups": [
   {"name": "PASTA SHAPES", "tiles": ["PENNE", "FUSILLI", "RIGATONI", "ORZO"],
    "note": "Penne means 'quills', fusilli 'little spindles', rigatoni 'ridged'. Orzo means 'barley', which it isn't."},
   {"name": "KITCHEN UTENSILS", "tiles": ["SPATULA", "WHISK", "LADLE", "TONGS"],
    "note": "The four things every drawer has three of and you can never find one."},
   {"name": "___ PAPER", "tiles": ["WALL", "NEWS", "SAND", "WASTE"],
    "note": "Wallpaper, newspaper, sandpaper, wastepaper. Two of them are basically extinct."},
   {"name": "READ THEM BACKWARDS", "tiles": ["DIAPER", "LAGER", "STRAW", "DESSERTS"],
    "note": "Repaid, regal, warts, stressed. DESSERTS/STRESSED is the most quoted word pair in English and the most emotionally accurate."},
 ],
 "traps": [],
 "epilogue": "Three groups of things you can hold and one group of things you have to squint at. That ratio is roughly the house style.",
},

{
 "title": "Board Games Night",
 "diff": 1,
 "groups": [
   {"name": "CLASSIC BOARD GAMES", "tiles": ["MONOPOLY", "SCRABBLE", "CLUEDO", "RISK"],
    "note": "Cluedo outside North America, Clue inside it — same lead pipe, same conservatory."},
   {"name": "CHESS PIECES", "tiles": ["PAWN", "ROOK", "BISHOP", "KNIGHT"],
    "note": "The rook is a castle everywhere except in English chess notation, where it stubbornly stays a bird."},
   {"name": "CARD GAMES", "tiles": ["BRIDGE", "RUMMY", "HEARTS", "WHIST"],
    "note": "Bridge grew out of whist, hearts is a trick-avoidance game, and rummy is the ancestor of half your phone's card apps."},
   {"name": "___ MATE", "tiles": ["CHECK", "ROOM", "SOUL", "CLASS"],
    "note": "Checkmate, roommate, soulmate, classmate — and if you're unlucky, all four at once."},
 ],
 "traps": [
   ["CHECK", 1, "CHECK is the most chess-flavoured word on the board and sits one square from the chess pieces — but check is a state, not a piece."],
 ],
 "epilogue": "CHECK is bait and it is meant to be: it is the only tile that belongs to chess in feeling and to nothing in chess by definition. Count the pieces — there are exactly four without it.",
},

{
 "title": "Weather Report",
 "diff": 2,
 "groups": [
   {"name": "PRECIPITATION", "tiles": ["SLEET", "HAIL", "DRIZZLE", "FLURRY"],
    "note": "Sleet is the argument between rain and snow; a flurry is snow that isn't committing."},
   {"name": "CLOUD TYPES", "tiles": ["CIRRUS", "CUMULUS", "STRATUS", "NIMBUS"],
    "note": "Luke Howard named them in 1802 in Latin so the whole world could use the same sky."},
   {"name": "WINDS", "tiles": ["GALE", "ZEPHYR", "SQUALL", "GUST"],
    "note": "Zephyrus was the Greek west wind, the mild one. A squall is the opposite temperament."},
   {"name": "___ STORM", "tiles": ["BRAIN", "SAND", "FIRE", "THUNDER"],
    "note": "Brainstorm, sandstorm, firestorm, thunderstorm. Only one of them is scheduled in a calendar."},
 ],
 "traps": [
   ["HAIL", 3, "HAILSTORM is a perfectly good word, so HAIL reads as a ___ STORM tile — but then precipitation is a man short."],
 ],
 "epilogue": "HAIL is the whole puzzle. It is real precipitation and a real storm, and the only way to settle it is to notice that SLEET, DRIZZLE and FLURRY have nowhere else on earth to go.",
},

{
 "title": "Anatomy Lesson",
 "diff": 2,
 "groups": [
   {"name": "FLOWERS", "tiles": ["DAHLIA", "PEONY", "ASTER", "ZINNIA"],
    "note": "All four are late-summer bloomers, and all four are named after botanists except the aster, which is just Greek for 'star'."},
   {"name": "BONES", "tiles": ["FEMUR", "TIBIA", "ULNA", "SCAPULA"],
    "note": "Thigh, shin, forearm, shoulder blade. The femur is the longest bone you own."},
   {"name": "PARTS OF THE EYE", "tiles": ["IRIS", "RETINA", "CORNEA", "PUPIL"],
    "note": "The pupil is not a thing at all — it is the hole the iris makes."},
   {"name": "HOMOPHONES OF BODY PARTS", "tiles": ["MUSSEL", "NAVAL", "HEAL", "LUMBER"],
    "note": "Muscle, navel, heel, lumbar. Say them out loud and the board rearranges itself."},
 ],
 "traps": [
   ["IRIS", 0, "IRIS is a genuinely famous flower AND the coloured ring of the eye — the oldest trap in the deck."],
 ],
 "epilogue": "IRIS is a flower. It is also, inconveniently, the only eye part left once RETINA, CORNEA and PUPIL have taken their seats. The flowers already have four; arithmetic beats botany.",
},

{
 "title": "Screen Time",
 "diff": 2,
 "groups": [
   {"name": "COMPUTER PERIPHERALS", "tiles": ["KEYBOARD", "MONITOR", "MOUSE", "PRINTER"],
    "note": "The four boxes that came with every beige desktop, three of which still work."},
   {"name": "RODENTS", "tiles": ["HAMSTER", "GERBIL", "CAPYBARA", "CHINCHILLA"],
    "note": "The capybara is the largest rodent alive and, by universal agreement, the most relaxed animal on the planet."},
   {"name": "WEB BROWSERS", "tiles": ["SAFARI", "CHROME", "FIREFOX", "EDGE"],
    "note": "Firefox is a red panda, which is not a fox, which is not a rodent either. The naming committee had a night."},
   {"name": "___ TRACK", "tiles": ["SOUND", "RACE", "BACK", "SIDE"],
    "note": "Soundtrack, racetrack, backtrack, sidetrack. The last two are what this board wants you to do."},
 ],
 "traps": [
   ["MOUSE", 1, "MOUSE is the rodent everyone thinks of first and the peripheral you are holding right now."],
 ],
 "epilogue": "MOUSE is the rodent you were looking for and the rodent you can't have — HAMSTER, GERBIL, CAPYBARA and CHINCHILLA fill the cage without it, and KEYBOARD, MONITOR and PRINTER are three legs of a four-legged desk.",
},

{
 "title": "Going Places",
 "diff": 2,
 "groups": [
   {"name": "WAYS TO CROSS WATER", "tiles": ["FERRY", "BRIDGE", "TUNNEL", "CAUSEWAY"],
    "note": "A causeway is the cheat: you don't cross the water, you fill it in."},
   {"name": "AIRPORT FEATURES", "tiles": ["TERMINAL", "CAROUSEL", "RUNWAY", "CONCOURSE"],
    "note": "Everything here is a place you stand still, except the one thing that spins."},
   {"name": "FAIRGROUND ATTRACTIONS", "tiles": ["WALTZER", "DODGEMS", "COCONUT SHY", "GHOST TRAIN"],
    "note": "The waltzer spins you, the dodgems dent you, the coconut shy has never in recorded history given up a coconut."},
   {"name": "___ PORT", "tiles": ["PASS", "CAR", "TRANS", "SUP"],
    "note": "Passport, carport, transport, support. Only the first one gets you through the airport."},
 ],
 "traps": [
   ["CAROUSEL", 2, "A carousel is a fairground ride before it is anything else — it just happens to also be where your suitcase appears."],
 ],
 "epilogue": "CAROUSEL wants to go to the fairground and the fairground is full. Somebody has to stand at baggage claim.",
},

{
 "title": "Fully Booked",
 "diff": 2,
 "groups": [
   {"name": "FINGERS", "tiles": ["THUMB", "RING", "PINKY", "MIDDLE"],
    "note": "Anatomists will tell you the thumb is not a finger. Anatomists are not invited to game night."},
   {"name": "PARTS OF A BOOK", "tiles": ["SPINE", "INDEX", "CHAPTER", "GLOSSARY"],
    "note": "The index is the part nobody writes and everybody uses."},
   {"name": "ONE-WORD SHAKESPEARE PLAYS", "tiles": ["OTHELLO", "MACBETH", "CYMBELINE", "CORIOLANUS"],
    "note": "Othello and Macbeth get revived every season; Cymbeline and Coriolanus get revived when a theatre feels brave."},
   {"name": "___ WORM", "tiles": ["BOOK", "EARTH", "SILK", "TAPE"],
    "note": "Bookworm, earthworm, silkworm, tapeworm — in descending order of how much you'd like to be one."},
 ],
 "traps": [
   ["INDEX", 0, "The index finger is the most-used finger there is, and INDEX is sitting in a book instead."],
   ["RING", 3, "RINGWORM is real, unpleasant, and not even a worm — so RING has a second home in the last group."],
 ],
 "epilogue": "Two tiles pull double duty in opposite directions: INDEX is a finger stuck in a book, RING is a finger stuck in a parasite. Follow the ones with no options — SPINE, CHAPTER and GLOSSARY need a fourth, and THUMB, PINKY and MIDDLE need a fourth, and there is exactly one way to feed them both.",
},

{
 "title": "Music Lesson",
 "diff": 2,
 "groups": [
   {"name": "WOODWIND INSTRUMENTS", "tiles": ["OBOE", "CLARINET", "BASSOON", "FLUTE"],
    "note": "The modern flute is made of metal and is still woodwind, because the family is about how you make the noise, not what out of."},
   {"name": "ITALIAN MUSICAL DIRECTIONS", "tiles": ["FORTE", "LEGATO", "STACCATO", "ANDANTE"],
    "note": "Loud, smooth, detached, walking pace. Andante literally means 'going', which is the most Italian tempo marking possible."},
   {"name": "TYPES OF SCALE", "tiles": ["MAJOR", "MINOR", "CHROMATIC", "PENTATONIC"],
    "note": "The pentatonic scale turns up independently in Chinese, Celtic, West African and blues music — five notes that everybody found on their own."},
   {"name": "___ NOTE", "tiles": ["KEY", "FOOT", "BANK", "SIDE"],
    "note": "Keynote, footnote, banknote, sidenote. Only one of them is ever delivered from a stage."},
 ],
 "traps": [
   ["KEY", 2, "A key and a scale are close cousins in music theory, so KEY looks like it belongs with MAJOR and MINOR — which, being keys as well as scales, is the whole problem."],
 ],
 "epilogue": "MAJOR and MINOR are keys and scales at once, and KEY is neither — it's a compound word waiting for NOTE. When two tiles could join a group and only one seat is free, take the tile that can't go anywhere else.",
},

{
 "title": "The Sporting Life",
 "diff": 2,
 "groups": [
   {"name": "TENNIS SCORING TERMS", "tiles": ["DEUCE", "LOVE", "ACE", "LET"],
    "note": "Love for zero probably comes from l'oeuf, the French egg. Deuce from 'à deux', two points to go."},
   {"name": "IN A DECK OF CARDS", "tiles": ["JOKER", "JACK", "CLUBS", "SPADES"],
    "note": "The joker is a 19th-century American invention, added so euchre could have a top trump."},
   {"name": "GOLF SCORES", "tiles": ["BIRDIE", "EAGLE", "BOGEY", "ALBATROSS"],
    "note": "Bogey came first and used to mean par; when standards rose it slid a shot backwards and the birds moved in."},
   {"name": "___ SHOT", "tiles": ["LONG", "SLAP", "BUCK", "MUG"],
    "note": "Longshot, slapshot, buckshot, mugshot. Two sports, one weapon, one bad night."},
 ],
 "traps": [
   ["ACE", 1, "The ace is the most famous card in the deck and also the unreturnable serve."],
   ["CLUBS", 2, "You hit a golf ball with clubs, which makes CLUBS look like the golf tile until you count the birds."],
 ],
 "epilogue": "ACE belongs to the cards in every ordinary sense and to tennis in this one; CLUBS belongs to golf in every ordinary sense and to the deck in this one. They swap places in your head and cancel out — the fixed points are DEUCE, LOVE, LET and three birds and a bogey.",
},

]
