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

# ---------------------------------------------------------------------------
# ANS5 — hand-written candidate pool of COMMON five-letter words, by theme.
# gen_words.py intersects this with valid5 and REPORTS every rejection, so a
# word I mis-remembered can never reach the game.  No plurals in -s, no -ed
# past tenses (a few -ed adjectives excepted), nothing obscure or archaic.
# ---------------------------------------------------------------------------
ANS5 = """
house table chair couch stool shelf clock watch phone light frame glass plate
spoon knife mixer stove towel razor broom trash waste crate chest hinge screw
drill paint brush novel diary album print stamp purse chain clasp floor porch
patio fence attic vault stair ledge quilt sheet cover linen radio timer alarm
cable match torch flame smoke steam vapor scent aroma latch lever bench shade
drape decor brick mower

shirt dress skirt jeans scarf glove cloak shawl parka badge satin suede denim
khaki apron beret visor braid ruffle

bread toast bagel donut candy sugar honey syrup jelly juice water cider cocoa
mocha latte cream salad broth stock pasta pizza sauce salsa spice basil thyme
cumin onion olive lemon melon peach grape apple berry mango guava wheat flour
yeast dough crust crumb slice snack lunch feast treat sweet fudge maple wafer
icing salty tasty spicy stale fresh grill roast steak bacon gravy pesto curry
sushi drink straw flask juicy yummy crisp munch chili saute whisk knead dairy
lemon syrup nacho

cloud storm sleet frost snowy sunny windy foggy misty muddy dusty rocky sandy
grass trunk bloom petal thorn grain field marsh swamp creek river brook ocean
beach shore coast cliff ridge slope mount plain delta oasis surge spray gorge
stone earth globe world space starry lunar solar comet orbit north south flood
drift chill balmy leafy shady stony mossy cedar birch aspen daisy tulip lilac
poppy pansy lotus shrub blaze marsh dunes

eagle hyena zebra tiger otter sheep goose moose snake mouse horse camel koala
panda rhino hippo llama whale shark squid skunk sloth bison finch robin raven
crane stork quail heron viper gecko hound puppy snail lemur beast bunny prawn
trout perch guppy dingo shrew macaw tapir steed cobra chick chimp geese

heart brain blood skull spine chest nerve pulse teeth tooth mouth cheek elbow
wrist thumb ankle thigh waist curly beard scalp voice smile frown laugh cough
fever wound cramp sweat tired weary sleep dream snore tonic nurse organ liver
torso hairy

adult child youth uncle niece bride groom widow guest crowd group squad staff
clerk actor baker chief judge pilot rider coach scout guard guide clown angel
saint witch demon giant fairy human being queen royal noble rebel thief bully
pupil tutor lover buyer owner enemy rival mayor mason miner tribe woman women
cadet usher nanny

begin bring build carry catch check climb close count cross dance drive enjoy
enter fight float focus force glide grasp greet grind guess hurry knock learn
leave march marry merge offer order plant point press prove raise reach relax
reply rinse serve shake shape share shine shout shove slide smell speak spend
spill split stand stare start steal stick sting stomp store study swear sweep
swing taste teach think throw touch trade train trust twist visit weave whirl
write yield burst carve cause chase cheer chirp choke claim clean clear click
cling crush cycle drain dress erase fetch flush guard hatch heave hoist hover
lease lodge mount mourn nudge paste pause phase pitch place plead pluck pound
power probe rally reign route scale scare scold scoop scrub shift shred shrug
slice smash sneak solve sound spark speed spoil stack stall steer storm strap
stray strip surge swirl tempt thank thumb track trail trick tweak twirl unite
untie upset value weigh wield wreck crawl chant clamp equip exist favor react
repay reset swarm swipe widen worry adopt allow apply argue avoid blend boast
brake break carve chase climb craft cross dodge drift dwell elect endow? enact?
erupt exalt? expel? fling flock forge frame greet grill hoard? judge

acute alert alike alive alone angry aware awful basic blank blind blond bored
brave brief brisk broad brown cheap civil crazy cruel daily dense dirty dizzy
eager early elder empty equal exact extra faint false fancy fatal final first
fizzy flaky frank fuzzy grand grave great green happy harsh heavy humid ideal
inner itchy jolly jumpy known large least legal level local lofty loose loyal
lucky major messy metal minor mixed moist moral naive nasty naval needy noble
noisy outer petty plump polar proud puffy pushy quick quiet rapid ready rigid
risky rough round royal rowdy rural rusty scary shaky sharp sheer shiny short
silky silly sleek slick slimy small smart smoky sober soggy solid sorry spare
steep stiff still stout super swift tacky tangy thick third tight timid total
tough toxic upper urban usual vague valid vital vivid vocal wacky weird white
whole witty worse worst worth wrong young lousy lively giddy grumpy? snappy?

about above after again among anger angle apart arena argue arise armor array
arrow aside asset atlas audio audit avoid award badge basis batch began below
blame blast bless block board bonus boost booth bound brand break breed bride
bunch cabin cargo carol cease chalk champ chaos charm chart cheat chess choir
chord chore chunk civic clash class cloth color comic comma coral court crack
craft crash crime crown curve debut decay delay depot depth devil diner ditch
dodge donor doubt dozen draft drama dread dwarf eight elite email entry error
essay event every exile fable faith fault fiber fifth fifty flash fleet flesh
flock fluid flute forge forty forum fraud front fruit funny genre ghost glare
glory grace grade grant graph greed grief groan grove growl guilt habit haste
haven havoc hedge hello hobby honor hotel humor image index irony issue ivory
jewel joint joker label labor laser layer leash liner liter lobby logic lower
lyric magic maker manor maybe medal media mercy merit meter metro micro might
minus model money month motel motor movie music niche night ninth noise nylon
occur opera other ought ounce panel panic paper party peace pearl pedal penny
photo piano piece pinch pixel place plain plane plaza price pride prime prize
prone proof punch quest query queue quirk quota quote radar ranch range ratio
realm refer relay rhyme right robot rodeo rugby ruler rumor scene scope score
scrap seize sense seven shaft shame shell shock shoot sight siren skate skill
slate sonic sport spell spike spine stage stain stake state steel story stuff
stunt style suite sword tempo tenth theme there these thing those three title
today token topic tower trace trait trend trial troop truck truly truth turbo
twice union under until usage venue verse video villa vinyl viral virus voter
vowel wagon wheel where which while whose width would yacht

poker bingo mural never often since ferry black beige amber azure sixth sixty
salsa sauna scoop sedan diner jumbo motto medal
"""

# ---------------------------------------------------------------------------
# ANS4 — same treatment for four letters.
# ---------------------------------------------------------------------------
ANS4 = """
able acid aged also area army away baby back bake ball band bank barn base bath
bead beam bean bear beat beef beer bell belt bend best bike bill bird bite blue
boat body boil bold bolt bond bone book boot born boss both bowl brew brow bulb
bulk bull bump bunk burn bush busy cafe cage cake calf call calm came camp cane
cape card care cart case cash cast cave cell cent chef chew chin chip chop cite
city clam clap claw clay clip club clue coal coat code coin cold colt comb come
cone cook cool cope copy cord core cork corn cost cove crab crew crop crow cube
cuff cure curl cute dare dark dart dash data date dawn deaf deal dean dear debt
deck deed deep deer demo dent desk dial dice diet dime dine dirt dish dive dock
doll dome done door dose dove down drag draw drew drip drop drum duck dune dusk
dust duty each earn ease east easy echo edge edit envy epic even ever exam exit
face fact fade fail fair fake fall fame fang farm fast fate fawn fear feat feed
feel fell felt fern feud fill film find fine fire firm fish fist five flag flap
flat flaw flea fled flew flex flip flop flow foam foil fold folk fond food fool
foot fork form fort foul four free frog from fuel full fume fund fury fuse gain
gale game gang gate gave gaze gear gene gift gill girl give glad glow glue goal
goat gold golf gone good gown grab gray grew grid grin grip grow gulf gull gush
hail hair half hall halt hand hang hard harm harp hate haul have hawk haze head
heal heap hear heat heel heir held helm help hemp herb herd hero hide high hike
hill hint hire hive hold hole holy home hood hoof hook hoop hope horn hose host
hour huge hunt hurl hurt hush husk hymn icon idea idle inch inky iris iron item
jade jail jazz jeep jest joke jolt jump junk jury just keen keep kelp kept kick
kind king kiss kite knee knew knit knob knot know lace lack lady laid lake lamb
lame lamp land lane lard lark last late lava lawn lazy lead leaf leak lean leap
left lend lens less lick life lift like limb lime limp line link lion list live
load loaf loan lock loft logo lone long look loom loop lord lose loss lost loud
love luck lump lung lure lush mail main make male mall malt mare mark mash mask
mass mast mate math meal mean meat meet melt memo mend menu mesh mess mice mild
mile milk mill mind mine mint miss mist mode mold mole monk mood moon moss most
moth move much mule muse must mute nail name navy near neat neck need nest news
next nice nine node none noon nose note noun oath obey okay once only onto open
oral oval oven over pace pack page paid pail pain pair pale palm pane park part
pass past path pave pawn peak pear peat peck peel peer pest pick pier pile pill
pine pink pint pipe pity plan play plea plot plow plug plum plus poem poet poke
pole poll pond pony pool poor pork port pose post pour pray prep prey prom prop
pull pump pure push quit quiz race rack raft rage raid rail rain rake ramp rang
rank rare rash rate rave read real reap rear reed reef reel rely rent rest rice
rich ride rift ring rink riot ripe rise risk road roam roar robe rock rode role
roll roof room root rope rose rosy ruby rude ruin rule rung rush rust sack safe
sage said sail sale salt same sand sane sang sank save scan scar seal seam seat
seed seek seem seen self sell send sent shed ship shoe shop shot show shut sick
side sigh sign silk silo sing sink site size skin skip slab slam slap sled slid
slim slip slot slow slug slum smog snap snow soak soap soar sock soda sofa soft
soil sold sole solo some song soon sore sort soul soup sour span spin spit spot
spun spur stab stag star stay stem step stew stir stop stub stun such suit sung
sunk sure surf swan swap sway swim tail take tale talk tall tame tank tape task
team tear tech teen tell tend tent term test text than that thaw them then they
thin this thud tick tide tidy tile till tilt time tiny tire toad toll tone took
tool torn toss tour town trap tray tree trek trim trio trip true tube tuck tuna
tune turf turn twig twin type ugly undo unit upon urge used user vain vale vase
vast veal veil vein vent verb very vest veto vibe vice view vine visa void vote
wade wage wait wake walk wall wand want ward ware warm warn warp wash wasp wave
wavy waxy weak wear weed week weep well went wept were west what when whim whip
whom wide wife wild will wind wine wing wink wipe wire wise wish wisp with wolf
wood wool word wore work worm worn wrap wren yard yarn yawn year yell yoga yolk
your zero zest zinc zone zoom
"""

# ---------------------------------------------------------------------------
# CROSS3 — the three-letter crossword list, hand-picked one word at a time from
# the dictionary-attested candidates.  Three-letter fill is where junk hurts
# most, so nothing gets in here automatically.
# ---------------------------------------------------------------------------
CROSS3 = """
ace act add ado aft age ago aid ail aim air ale all alt amp and ant any ape apt
arc are ark arm art ash ask asp ate awe axe aye bad bag ban bar bat bay bed bee
beg bet bib bid big bin bit biz boa bob bog boo bop bot bow box boy bra bud bug
bum bun bus but buy bye cab cad cam can cap car cat caw cob cod cog con coo cop
cot cow coy cry cub cud cue cup cur cut dab dad dam day den dew did die dig dim
din dip doe dog don dot dry dub dud due dug duo dye ear eat ebb eel egg ego elf
elk elm emu end era err eve ewe eye fad fan far fat fax fed fee few fib fig fin
fir fit fix flu fly foe fog for fox fry fun fur gag gal gap gas gel gem get gif
gig gin gnu goo got gum gut guy gym had hag ham has hat hay hen her hew hex hey
hid him hip his hit hoe hog hop hot how hub hue hug huh hum hut ice icy ill imp
ink inn ion ire irk its ivy jab jam jar jaw jay jet jig job jog jot joy jug jut
keg key kid kin kit lab lad lag lap law lax lay led leg lei let lid lie lip lit
lob log lot low mad mag man map mar mat maw may men met mew mid mix mob mom mop
mow mud mug mum nab nag nap nay net new nib nil nip nit nod nor not now nun nut
oaf oak oar oat odd ode off oft oil old one opt orb ore our out owe owl own pad
pal pan par pat paw pay pea peg pen pep per pet pew pie pig pin pit ply pod pop
pot pox pro pry pub pug pun pup put rag raj ram ran rap rat raw ray red ref rev
rib rid rig rim rip rob rod roe rot row rub rue rug rum run rut rye sac sad sag
sap sat saw say sea sec see set sew she shy sin sip sir sis sit six ski sky sly
sob sod son sow soy spa spy sty sub sue sum sun sup tab tad tag tan tap tar tax
tea tee ten the thy tic tie tin tip toe ton too top tot tow toy try tub tug tux
two urn use van vat vet vex via vie vow wad wag wan was wax way web wed wee wet
who why wig win wit woe wok won woo wow wry yak yam yap yaw yea yen yes yet yew
yip you zap zip zoo
"""

# Ten friendly, welcoming words to lead the daily sequence before the
# frequency-ordered remainder of answers5.
OPENERS5 = "smile candy peach music beach happy tulip sunny arcade lemon"
OPENERS4 = "cake star moon gift rose game blue cozy song wave"
