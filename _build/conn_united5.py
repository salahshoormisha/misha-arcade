# -*- coding: utf-8 -*-
"""UNITED pack, batch 5: football beyond England. European nights, the World Cup
and the Euros as tournaments rather than statistics, Scottish football with the
weight it deserves, the continental leagues, South America, the women's game,
the laws' odd corners, and the words the game has traded between languages.

Built to the two rules the players set after FOURMATIONS: nothing here needs a
record book, and no board sorts itself by surface type — at least two groups on
every board look like the same kind of thing, and the fourth steals from them."""

BOARDS = [

{
 "title": "Easter Road",
 "diff": 2,
 "groups": [
   {"name": "EACH ONE TAKES ROAD", "tiles": ["EASTER", "RING", "SILK", "ABBEY"],
    "note": "Hibs play at Easter Road. The rest carry traffic, trade and the Beatles."},
   {"name": "GLASGOW GROUNDS", "tiles": ["IBROX", "PARKHEAD", "HAMPDEN", "FIRHILL"],
    "note": "Firhill is Partick Thistle's. Hampden has been Scotland's since 1903."},
   {"name": "WHAT THE FANS CALL THEM", "tiles": ["JAMBOS", "HIBEES", "GERS", "HOOPS"],
    "note": "Hearts, Hibs, Rangers, Celtic, in the order you would hear them in a pub."},
   {"name": "ALSO MEANS IRISH", "tiles": ["HIBERNIAN", "CELTIC", "ERIN", "GAEL"],
    "note": "Hibs and Celtic were both founded by Irish communities in Scotland."},
 ],
 "traps": [
   ["CELTIC", 1, "Celtic Park is a Glasgow ground, and half of Glasgow calls the ground Celtic"],
   ["EASTER", 1, "Easter Road is a ground too, just one at the wrong end of the M8"],
 ],
 "epilogue": "CELTIC is a ground and a word for Irish. IBROX, PARKHEAD, HAMPDEN and FIRHILL are four without it.",
},

{
 "title": "Ask the Referee",
 "diff": 3,
 "groups": [
   {"name": "IN A REFEREE'S POCKET", "tiles": ["WHISTLE", "COIN", "NOTEBOOK", "SPRAY"],
    "note": "The foam spray came out of South America and reached the World Cup in 2014."},
   {"name": "OFFENCES THE LAWS ACTUALLY NAME", "tiles": ["SIMULATION", "DISSENT", "ENCROACHMENT", "HANDBALL"],
    "note": "Simulation is the official word for a dive, and it is worth a yellow."},
   {"name": "HOW PLAY RESTARTS", "tiles": ["DROP BALL", "THROW-IN", "CORNER", "GOAL KICK"],
    "note": "You cannot be offside from a throw-in, which is the one law everybody knows."},
   {"name": "ALSO HAPPENS IN A COURTROOM", "tiles": ["BOOKED", "CHARGED", "SUSPENDED", "DISMISSED"],
    "note": "Football borrowed the entire vocabulary of being in trouble."},
 ],
 "traps": [
   ["CHARGED", 1, "Charging an opponent is a named offence: shoulder to shoulder is legal, the rest is not"],
   ["COIN", 2, "The coin toss decides ends and who kicks off, which is how a match starts"],
 ],
 "epilogue": "CHARGED is an offence and a verdict. SIMULATION, DISSENT, ENCROACHMENT and HANDBALL are already four.",
},

{
 "title": "French Exchange",
 "diff": 4,
 "groups": [
   {"name": "FRENCH WORDS ENGLISH USES DAILY", "tiles": ["DÉJÀ VU", "RENDEZVOUS", "CLICHÉ", "ENTOURAGE"],
    "note": "Cliché was a printer's word for a plate that stamped the same line forever."},
   {"name": "FRANCE THOUGHT OF IT FIRST", "tiles": ["WORLD CUP", "EUROPEAN CUP", "BALLON D'OR", "FIFA"],
    "note": "FIFA was founded in Paris in 1904. England joined the year after."},
   {"name": "FRANCE'S 1998 WORLD CUP WINNERS", "tiles": ["ZIDANE", "DESCHAMPS", "THURAM", "BLANC"],
    "note": "Blanc missed the final through suspension; Deschamps lifted it as captain."},
   {"name": "FRENCH CLUBS, ALSO ENGLISH WORDS", "tiles": ["NICE", "LENS", "ANGERS", "SEDAN"],
    "note": "Three of them have played in Ligue 1 this decade. Sedan won two French cups."},
 ],
 "traps": [
   ["BALLON D'OR", 0, "Ballon d'Or is French, unchanged, and English speakers say it constantly"],
   ["SEDAN", 0, "Sedan looks exactly like the loanwords beside it, and English does use it daily"],
 ],
 "epilogue": "BALLON D'OR is French and everyday, but DÉJÀ VU, RENDEZVOUS, CLICHÉ and ENTOURAGE are already four.",
},

{
 "title": "The Sticker Album",
 "diff": 3,
 "groups": [
   {"name": "ITALIAN WORDS THE GAME EXPORTED", "tiles": ["CATENACCIO", "SCUDETTO", "TIFOSI", "ULTRAS"],
    "note": "Catenaccio means door-bolt; a scudetto is a small shield sewn on the shirt."},
   {"name": "ITALIAN WORDS ENGLISH USES DAILY", "tiles": ["ESPRESSO", "AL DENTE", "GRAFFITI", "PANINI"],
    "note": "Graffiti is a plural, which makes a single one of them a graffito."},
   {"name": "ITALY'S IMMORTALS", "tiles": ["BUFFON", "MALDINI", "BAGGIO", "PIRLO"],
    "note": "Baggio put the 1994 final over the bar and apologised for thirty years."},
   {"name": "A EUROPEAN CLUB IS HIDING IN THERE", "tiles": ["AROMA", "WINTER", "PORTOBELLO", "REUNION"],
    "note": "a-ROMA, w-INTER, PORTO-bello, re-UNION. Rome, Milan, Porto and Berlin."},
 ],
 "traps": [
   ["PANINI", 0, "Panini stickers are as much a part of the game as catenaccio, and Panini is from Modena"],
   ["PORTOBELLO", 1, "Portobello is a mushroom in every supermarket and sounds thoroughly Italian"],
 ],
 "epilogue": "PANINI is a sandwich and a sticker album. CATENACCIO, SCUDETTO, TIFOSI and ULTRAS are four without it.",
},

]
