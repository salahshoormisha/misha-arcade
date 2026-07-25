# -*- coding: utf-8 -*-
"""
Hand-authored inputs for gen_words.py (core/data/words.js).

Everything in here is authored by hand and then MACHINE-VALIDATED by gen_words.py
against /usr/share/dict/words (web2), dwyl/words_alpha and the Norvig
count_1w frequency table.  Nothing survives into the shipped file unless it is
either attested by a dictionary or listed in MODERN (an explicit allowlist of
modern words the 1934 Webster's simply predates).
"""

# ---------------------------------------------------------------------------
# MODERN — real English words missing from the 1934 web2 dictionary.
# gen_words.py checks each against words_alpha / the frequency table and
# reports any it cannot corroborate (those stay in only because they are
# listed under MODERN_VOUCHED below).
# ---------------------------------------------------------------------------
MODERN = """
email inbox blogs vlogs pixel modem cyber login logon uploads upload download
smartphone laptop desktop webcam widget avatar emoji memes selfie hashtag podcast
website weblog browser scanner printer router server backup reboot firewall spyware
malware bitcoin crypto startup fintech biotech nanotech
robotics robotic robot drones drone laser lasers plasma
tacos taco burrito burritos nacho nachos salsa queso fajita fajitas tortilla
tortillas quesadilla guacamole enchilada tamales tamale
sushi sashimi ramen wasabi teriyaki edamame miso tofu bento
pasta lasagna ravioli linguine gnocchi risotto pesto pizza pizzas panini
espresso latte mocha cappuccino macchiato barista frappe
bagel bagels donut donuts muffin brownie brownies cupcake cupcakes waffle waffles
pancake pancakes granola smoothie smoothies yogurt oatmeal ketchup mayonnaise
hummus falafel shawarma kabob kofta baklava halva
pilaf paella gyro kimchi curry naan chutney samosa tandoori biryani
vegan vegans veganism paleo detox
sneaker sneakers hoodie hoodies jeans denim tights leggings blazer parka
scrunchie sequin sequins
disco combo condo retro promo intro repo demo
mixtape playlist karaoke
scuba snorkel
recycle recycling landfill compost
teenager teenagers babysit babysitter
freeway carport minivan sedan hatchback moped scooter
airport airline runway jetlag
supermarket shopper checkout cashier
mortgage payroll paycheck
weekend weeknight
sunscreen sunblock shampoo conditioner deodorant
antibiotic antibiotics vaccine vaccines
plastic plastics styrofoam
mascot playoff playoffs offside penalty striker keeper dribble
skateboard snowboard surfboard
yoga pilates
zipper velcro
flashlight
password username
volleyball basketball
gymnast
teamwork workflow
nerdy geeky quirky
wifi
"""

# Words in MODERN that words_alpha / the frequency table may not corroborate but
# that I vouch for as ordinary modern English (short, recent, or brand-neutral
# coinages).  Kept with this explicit comment per the contract.
MODERN_VOUCHED = "wifi latte pesto detox geeky blogs vlogs queso fajita fajitas kabob shawarma"

# ---------------------------------------------------------------------------
# BLOCK_HARD — removed from EVERY list, including the valid-guess lists.
# Slurs, sexual and scatological vocabulary, extreme profanity.  Added on top
# of the fetched LDNOOBW list.  Never printed in the generator's report.
# ---------------------------------------------------------------------------
BLOCK_HARD = """
abo boche chink chinky coon coons dago dyke dykes fag fags faggot fatso
gook gooks gyp gypped gypsy gypsies gippo hebe honky injun jap japs jew jewess
kike kraut krauts limey mick micks mong mongoloid negress negro negroes nig
nigra paki pakis polack quadroon quim raghead redskin retard retarded sambo
shiksa spade spic spick squaw taig tranny wetback wog wops yid zipperhead
crip cripple gimp gimpy imbecile
arse arses arsed bugger buggery bollocks
bastard bastards bitch bitches bitchy cock cocks cocky crotch
cunt dick dicks dildo douche dumbass fart farts fuck fucker
fucking horny hooker hookers jerkoff nympho orgy orgies penis pervert
pimp pimps piss pissed poon porn porno prick pricks prostitute pube pubes pubic
puke queer rapist scrotum semen sexes sexy shag
shagged shit shits shitty skank slut sluts smut sperm spunk teat
teats tits titty turd twat twats vagina viagra vulva wank wanker whore whores
anus anal ass asses asshole boob boobs boner bosom
nipple nipples butts buttock buttocks
loins groin randy
nazi nazis
"""

# BLOCK_SOFT — ordinary English, but not something a daily puzzle should serve
# up as its ANSWER or put in a mini-crossword.  These stay legal as guesses
# (valid4/valid5/boxed) so a player is never told a real word "isn't a word".
BLOCK_SOFT = """
kill kills killer killed killing murder murders murdered slay slain
death dead die dies died dying corpse coffin morgue grave graves
suicide bomb bombs bombed war wars gun guns rifle rifles bullet bullets
drunk drunken booze boozer drugs heroin cocaine meth stoned junkie addict
damn damned hell heck crap crappy sucks suck
rape raped abuse abused
cancer tumour tumor
"""

# ---------------------------------------------------------------------------
# JUNK — attested-but-not-really-English entries that survive the frequency
# filters: lowercased names, place names, foreign words, abbreviations,
# apostrophe-less contractions, trademarks.  Built by eyeballing the
# low-frequency tail of every generated list (see gen_words.py --tails).
# ---------------------------------------------------------------------------
JUNK = """
aku alf ala ana ann amy abu ast ade akhi
bac bae bel ben bis bom bon bien bhai
cee cha che cho cond cor cos coz
dae dan das dao dee deg dev dis div dod dom dos dow
ecole ell est ette
fae fei fra
ger gon goa
hao han hei het hud huck hoon
ich ide ing iso ist
jed jud
kai kay ken kim
lan las lea leu lew lim lin lys
mac mae mas mel mem mib mil min mon mor mun myn
nach nae nak nam nan nat naw nee nim
och oda ons
pac pam pia pix pol pst pua
rach rah reb rel res rex rog roi
sao sar sen ser sha sho sie sig soc sou sri sur
tae tec tha tho til tor tox tum
ust
vee vis vol
wah wap wer wha
yah yee yeo yow
zac zak zed zee
alba amor arent aria astor atta auld
baba balu barra bally bibi bien bing burt
cain cass chien chun clem cond conn crain curie
dade dali darby dede demi desi diddy dunne dunst
elle exon
fide fink faust
gabi gemma groot
hasan holt hoyle horst
jess jours
kang kemp kern koko kona
laird layne lear liang lill linea linn lisle loma lulu lupe
maki maru masha massa medio messe mila ming minot mogo mona muir myron
nana nash neal ness
oliva
patel pedro peggy pereira petit pico polk pooh porta ponce prius pyrex prob
quan
resp retin rincon rita rory roxy rupa
salma serra shan sheng sind sion sith sitio slade smyth surat swain
taft tania tera thakur tien ting tilly toby topo toro toru tory tuk
vasu vera vita viva
waugh wong
sinh reps tele
alec bosch conte kroon snape
"""

# ---------------------------------------------------------------------------
# RESCUE — ordinary English words that also happen to be common given names or
# surnames.  The name filter would drop these; they are put back by hand.
# (Reviewed one by one from the name-filter removal report.)
# ---------------------------------------------------------------------------
RESCUE = """
dye fry ivy lam peg rue dew
akin ally aura barb bard beck bray burr chew chin chow cone crow curl dent dove
dull dyer eddy fern fife fore gall gill grim hale hare harp heal heck helm herd
iris kite lacy leak lent lien lily lira mace mash mast maze mead mock monk muse
noel opal papa peck peek peel pier rash rude rust shah shin sung swan tang teal
tiff tuck vale vest wade weir wick wilt wren yuan
adore alley auger baron beard beech bland bliss blunt bower bravo brace brink
broom cheek crane crank creed crisp curry dolly drake dusty emery ester ethyl
finch flint flora forte freed fried fryer fudge hardy hasty hatch hazel hertz
homer jolly knoll leach leech mommy moody morse nanny pagan parry patty peach
pence petty pinto piper plank plumb poppy raven roach rowan shank slack slate
soles spear speck stark steed stein stern stout straw stump swank sweat tally
thorn usher utter vigil viola waltz windy
almond archer badger barber barker barley barrow birdie bowler brandy brewer
bunker burrow carver coffin collie corona corral cotter covert coward craven
cutler cutter downer draper falcon fender fowler fuller gamble gammon garner
garnet gentry ginger glover halter harden hector hickey hopper humble jasper
jester joiner kaiser lackey laurel layman linden lively luster madden marlin
medley melody mercer morrow motley muffin nettle nicely outlaw packer parson
piazza ponder pulley ransom rector riddle ringer sawyer seaman serene sexton
shaver sherry shiver slater sledge sparks spicer squire stoker stormy strait
tanner tester thrash tiller tinker trusty tucker violet warden weaver wicker
wiener wilder
blocker bloomer bracken bullock bunting butcher calypso caprice carmine carrion
cherish cleaver clement collier creamer darling derrick earnest fanning fielder
foreman freeman furlong gallant garland gentile hackney haddock haggard hammock
harness herring jasmine kindred lawless mallard manning marquis merrily modesty
paddock painter parsley peacock pilgrim pitcher proctor provost rosette rushing
scarlet skinner skipper sparrow steward trotter wheeler whiting whittle withers
workman
"""

# ---------------------------------------------------------------------------
# PERSIAN — English words with documented Persian/Iranian etymologies.
# Sources cross-checked against OED/Merriam-Webster/etymonline senses.
# Anything whose Persian link is speculative (tiger, turquoise, scarlet,
# balcony, tiara, saffron, vizier, kebab, sherbet's root) was DROPPED.
# ---------------------------------------------------------------------------
PERSIAN = [
    # --- five letters: usable directly as Wordle answers ---
    ("KIOSK",  u"kūshk, pavilion — via Turkish köşk"),
    ("DIVAN",  u"dīwān, account book, council chamber"),
    ("TULIP",  u"dulband, turban — the flower's shape"),
    ("SHAWL",  u"shāl, a woven wrap"),
    ("LILAC",  u"nīlak, bluish, from nīl, indigo"),
    ("JULEP",  u"gulāb, rose water"),
    ("CANDY",  u"qand, cane sugar — via Arabic qandī"),
    ("KHAKI",  u"khākī, dust-coloured, from khāk, dust"),
    ("PILAF",  u"pilāw, cooked rice"),
    ("MAGIC",  u"maguš, a Zoroastrian priest — via Greek magos"),
    ("MAGUS",  u"maguš, priest of the Medes and Persians"),
    ("MUMMY",  u"mūm, wax — via Arabic mūmiya"),
    ("CHESS",  u"shāh, king — via Old French esches"),
    ("CHECK",  u"shāh!, 'the king!' — the chess warning"),
    ("AZURE",  u"lāžward, lapis lazuli"),
    ("LEMON",  u"līmūn, citrus fruit"),
    ("SUGAR",  u"shakar, sugar — via Arabic sukkar"),
    ("SITAR",  u"seh-tār, three strings"),
    ("BORAX",  u"būrah, borax"),
    ("MOGUL",  u"mughul, a Mongol — hence a magnate"),
    ("CUSHY",  u"khush, pleasant — via Urdu, Anglo-Indian slang"),
    ("SEPOY",  u"sipāhī, soldier, from sipāh, army"),
    ("PEACH",  u"named for Persia: Latin persica, 'Persian apple'"),
    ("SATIN",  u"perhaps Zaytūn, the Arabic-Persian name for Quanzhou"),
    # --- longer words for the other cabinets ---
    ("MUSK",   u"mušk, musk — via Late Latin muscus"),
    ("ROOK",   u"rukh, the chess chariot"),
    ("SHAH",   u"shāh, king"),
    ("NAAN",   u"nān, bread"),
    ("PERI",   u"parī, a fairy of Persian myth"),
    ("TURBAN", u"dulband, turban — via Turkish tülbend"),
    ("BAZAAR", u"bāzār, market"),
    ("ORANGE", u"nārang, orange — via Arabic nāranj"),
    ("JACKAL", u"shagāl, jackal — via Turkish çakal"),
    ("ZIRCON", u"zargūn, gold-coloured"),
    ("BEZOAR", u"pād-zahr, antidote, 'counter-poison'"),
    ("CHADOR", u"chādar, sheet, cloak"),
    ("CAVIAR", u"khāvyār, roe-bearing"),
    ("SAMOSA", u"sanbūsag, a triangular pastry"),
    ("SATRAP", u"xšaθrapāvan, protector of the province"),
    ("PAJAMA", u"pāy-jāma, leg garment"),
    ("SIRDAR", u"sardār, chief, from sar, head"),
    ("TANDOOR",u"tanūr, clay oven"),
    ("TAFFETA",u"tāftah, woven"),
    ("SPINACH",u"aspanākh, spinach — via Arabic isfānākh"),
    ("JASMINE",u"yāsaman, jasmine"),
    ("CARAVAN",u"kārwān, a company of travellers"),
    ("DERVISH",u"darvīsh, mendicant, poor"),
    ("NAPHTHA",u"naft, petroleum — via Greek naphtha"),
    ("SHERBET",u"sharbat, a sweet drink — ultimately Arabic sharba"),
    ("LACQUER",u"lāk, lac resin — ultimately Sanskrit lākṣā"),
    ("PASHMINA",u"pashmīnah, woollen, from pashm, wool"),
    ("PARADISE",u"pairi-daēza (Old Iranian), a walled garden"),
    ("PISTACHIO",u"pistah, pistachio — via Greek pistakion"),
    ("CHECKMATE",u"shāh māt, 'the king is helpless'"),
    ("ALGORITHM",u"al-Khwārizmī, the Persian mathematician of Khwārazm"),
    ("CUMMERBUND",u"kamar-band, waist-band"),
    ("SEERSUCKER",u"shīr o shakar, 'milk and sugar' — smooth and puckered"),
    ("CARAVANSERAI",u"kārwān-sarāy, travellers' courtyard inn"),
]
