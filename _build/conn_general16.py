# -*- coding: utf-8 -*-
"""GENERAL pack, batch 16: games and play. Chess, cards, darts, dice, cricket
and the playground. Scoring words turn out to be ordinary English, four
European capitals turn out to be openings, and several innocent words are
quietly hiding a smaller game inside."""

BOARDS = [

{
 "title": "Your Go",
 "diff": 2,
 "groups": [
   {"name": "IN THE PLAYGROUND AT BREAK", "tiles": ["HOPSCOTCH", "LEAPFROG", "CONKERS", "MARBLES"],
    "note": "Conkers has a world championship, held in Northamptonshire in October."},
   {"name": "___ PLAY", "tiles": ["HORSE", "ROLE", "SWORD", "FOUL"],
    "note": "Horseplay, role play, swordplay, foul play. Only one of them is a crime."},
   {"name": "WHAT YOU MOVE ROUND A BOARD", "tiles": ["COUNTER", "TOKEN", "MEEPLE", "PEG"],
    "note": "Meeple is a squash of 'my people', coined at a Carcassonne table."},
   {"name": "A GAME IS HIDING IN THERE", "tiles": ["WHISTLER", "DUCHESS", "BRISKET", "BLOTTO"],
    "note": "WHIST-ler, du-CHESS, b-RISK-et, b-LOTTO. Nobody here is playing."},
 ],
 "traps": [
   ["HORSE", 0, "HORSE is a real playground game, spelled out one letter per missed shot"],
   ["COUNTER", 1, "Counterplay is a word, and a chess one, so COUNTER takes PLAY happily"],
 ],
 "epilogue": "HORSE is a playground game and COUNTERPLAY is a word. Only one split leaves four fours.",
},

{
 "title": "Deal Me In",
 "diff": 3,
 "groups": [
   {"name": "WHAT THE DEALER DOES", "tiles": ["SHUFFLE", "CUT", "DEAL", "BURN"],
    "note": "The burn card goes face down first so nobody can read its back."},
   {"name": "PHRASES POKER GAVE ENGLISH", "tiles": ["BLUE CHIP", "WILD CARD", "ABOVE BOARD", "PASS THE BUCK"],
    "note": "The buck was a marker that travelled round the table with the deal."},
   {"name": "AT THE BRIDGE TABLE", "tiles": ["DUMMY", "RUBBER", "FINESSE", "RUFF"],
    "note": "The dummy lays their hand face up and then has nothing left to do."},
   {"name": "SLEIGHT-OF-HAND MOVES", "tiles": ["PALM", "FORCE", "PASS", "STEAL"],
    "note": "A force is when the magician picks the card and you believe you did."},
 ],
 "traps": [
   ["PASS", 2, "Pass is what you say at the bridge table when the hand is not worth a bid"],
   ["CUT", 3, "The false cut is a sleight-of-hand staple, and it cuts nothing at all"],
   ["ABOVE BOARD", 3, "Hands above the table is a rule written against exactly these moves"],
 ],
 "epilogue": "PASS is a bridge bid, CUT is a cheat's favourite, ABOVE BOARD is a rule about hands.",
},

{
 "title": "Opening Moves",
 "diff": 4,
 "groups": [
   {"name": "PHRASES CHESS GAVE ENGLISH", "tiles": ["STALEMATE", "GAMBIT", "ENDGAME", "CHECKMATE"],
    "note": "Checkmate is from shah mat, Persian for 'the king is helpless'."},
   {"name": "TACTICS ON A CHESSBOARD", "tiles": ["FORK", "PIN", "SKEWER", "BATTERY"],
    "note": "A skewer is a pin run backwards: the valuable piece is in front."},
   {"name": "TIME CONTROLS, FASTEST FIRST", "tiles": ["BULLET", "BLITZ", "RAPID", "CLASSICAL"],
    "note": "Bullet gives you a minute for the whole game, and people play it for fun."},
   {"name": "ALSO A NAMED CHESS OPENING", "tiles": ["LONDON", "VIENNA", "BERLIN", "BUDAPEST"],
    "note": "London System, Vienna Game, Berlin Defence, Budapest Gambit. All real."},
 ],
 "traps": [
   ["GAMBIT", 3, "A gambit is an opening by definition, and the Budapest one ends in the word"],
   ["CLASSICAL", 3, "The Classical is a named variation in the Sicilian, the French and more"],
   ["BLITZ", 0, "Blitz is plain English for a sudden onslaught and has been since 1940"],
 ],
 "epilogue": "GAMBIT is an opening, CLASSICAL is a variation, BLITZ is plain English. The capitals need four.",
},

{
 "title": "Double Top",
 "diff": 3,
 "groups": [
   {"name": "GAMES IN AN ENGLISH PUB", "tiles": ["DOMINOES", "SKITTLES", "CRIBBAGE", "BAR BILLIARDS"],
    "note": "Bar billiards is played into holes in the table, against a timer."},
   {"name": "DARTS SLANG", "tiles": ["OCHE", "TON", "MADHOUSE", "SHANGHAI"],
    "note": "The oche is the line you stand behind. The madhouse is double one."},
   {"name": "ON A SNOOKER TABLE", "tiles": ["BAULK", "CUSHION", "SPIDER", "PLANT"],
    "note": "The spider is the rest with the arched head, for reaching over a ball."},
   {"name": "KINDS OF PATIENCE", "tiles": ["KLONDIKE", "PYRAMID", "FREECELL", "ACCORDION"],
    "note": "Windows shipped Klondike in 1990 to teach people to drag with a mouse."},
 ],
 "traps": [
   ["SPIDER", 3, "Spider is the patience that came with every computer, two suits or four"],
   ["SHANGHAI", 0, "Shanghai is a pub darts game in its own right, not only a scoring shout"],
 ],
 "epilogue": "SPIDER is a rest before it is a card game, and SHANGHAI is a game before it is a finish.",
},

]
