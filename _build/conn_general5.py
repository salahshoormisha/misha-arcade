# -*- coding: utf-8 -*-
"""GENERAL pack, batch 5: language, wordplay mechanics, literature, film and
television, music, theatre. Hidden words, homophones, anagrams and compounds do
most of the work; the knowledge groups are there to be counted against."""

BOARDS = [

{
 "title": "Read All About It",
 "diff": 1,
 "groups": [
   {"name": "PUNCTUATION MARKS", "tiles": ["SEMICOLON", "HYPHEN", "ELLIPSIS", "ASTERISK"],
    "note": "The asterisk was a little star before it was ever a footnote."},
   {"name": "___ WRITER", "tiles": ["TYPE", "GHOST", "SCREEN", "SPORTS"],
    "note": "Typewriter, ghostwriter, screenwriter, sportswriter. One is a machine."},
   {"name": "PARTS OF A NEWSPAPER", "tiles": ["HEADLINE", "BYLINE", "EDITORIAL", "OBITUARY"],
    "note": "The byline is the credit; the obituary is the one written early."},
   {"name": "PUNCTUATION HIDING INSIDE", "tiles": ["COMMANDO", "HABERDASHER", "COLONEL", "CARETAKER"],
    "note": "COMMA-ndo, haber-DASH-er, COLON-el, CARET-aker. The caret is the ^."},
 ],
 "traps": [
   ["SEMICOLON", 3, "SEMICOLON has a whole COLON inside it, which is exactly the joke"],
   ["SPORTS", 2, "Every paper has a sports section, so SPORTS reads as a part of one"],
 ],
 "epilogue": "SEMICOLON hides a COLON and SPORTS hides in the back pages. Neither moves; count who cannot.",
},

{
 "title": "Boxed Sets",
 "diff": 2,
 "groups": [
   {"name": "LONG-RUNNING SITCOMS", "tiles": ["FRIENDS", "FRASIER", "SEINFELD", "CHEERS"],
    "note": "Frasier walked out of Cheers and into eleven seasons of his own."},
   {"name": "___ BOX", "tiles": ["IDIOT", "SOAP", "CHATTER", "JUKE"],
    "note": "Idiot box, soapbox, chatterbox, jukebox. Only one still takes coins."},
   {"name": "TELEVISION JARGON", "tiles": ["PILOT", "FINALE", "RERUN", "SPINOFF"],
    "note": "A pilot is a job interview that occasionally becomes a decade."},
   {"name": "HOMOPHONES OF LETTERS", "tiles": ["CUE", "EWE", "WHY", "JAY"],
    "note": "Q, U, Y, J. Four letters of the alphabet wearing coats."},
 ],
 "traps": [
   ["SOAP", 2, "A soap is television jargon long before it is a bar of anything"],
   ["CUE", 2, "A cue is what the floor manager gives, which is studio jargon of the purest kind"],
 ],
 "epilogue": "SOAP and CUE both sound like studio talk. The studio has four seats and they are taken.",
},

{
 "title": "Sharp Practice",
 "diff": 3,
 "groups": [
   {"name": "BRASS INSTRUMENTS", "tiles": ["TRUMPET", "TROMBONE", "TUBA", "CORNET"],
    "note": "The cornet is a trumpet that joined a brass band and never left."},
   {"name": "___ HORN", "tiles": ["FRENCH", "LONG", "SHOE", "FOG"],
    "note": "French horn, longhorn, shoehorn, foghorn. Only one of them is played."},
   {"name": "VOICE TYPES", "tiles": ["SOPRANO", "ALTO", "TENOR", "BASS"],
    "note": "All four double as saxophone sizes, which is how the sax joined the choir."},
   {"name": "HIDING AN INSTRUMENT", "tiles": ["SHARPEN", "CONUNDRUM", "ABSOLUTE", "SAXON"],
    "note": "s-HARP-en, conun-DRUM, abso-LUTE, SAX-on."},
 ],
 "traps": [
   ["TENOR", 1, "The tenor horn is a real brass-band instrument, so TENOR reads as ___ HORN"],
   ["ALTO", 1, "The alto horn is the same instrument under an American name"],
 ],
 "epilogue": "TENOR and ALTO are both horns you can buy. They are also two of four voices, and the voices need them.",
},

{
 "title": "Front Matter",
 "diff": 3,
 "groups": [
   {"name": "BEFORE CHAPTER ONE", "tiles": ["PROLOGUE", "PREFACE", "FOREWORD", "EPIGRAPH"],
    "note": "A foreword is written by someone else; a preface is the author's own."},
   {"name": "___ STORY", "tiles": ["LOVE", "SHORT", "GHOST", "COVER"],
    "note": "Love story, short story, ghost story, cover story. One is a lie."},
   {"name": "FICTION GENRES", "tiles": ["DYSTOPIA", "GOTHIC", "PICARESQUE", "EPISTOLARY"],
    "note": "Picaresque follows a likeable rogue; epistolary is told in letters."},
   {"name": "WRITERS HIDING INSIDE", "tiles": ["SHAWL", "FOOLHARDY", "BEWILDER", "POETIC"],
    "note": "SHAW-l, fool-HARDY, be-WILDE-r, POE-tic."},
 ],
 "traps": [
   ["GHOST", 2, "The ghost story is a genre in its own right, and Gothic's nearest neighbour"],
   ["SHORT", 2, "The short story is a form, and forms sit on the same shelf as genres"],
 ],
 "epilogue": "GHOST and SHORT are genres if you squint, but DYSTOPIA, GOTHIC, PICARESQUE and EPISTOLARY got there first.",
},

]
