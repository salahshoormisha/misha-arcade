# -*- coding: utf-8 -*-
"""
_build/food_authored.py -- the hand-authored dish table behind core/data/food.js

Consumed by _build/gen_food.py.  Nothing here is scraped: every dish was chosen
because it is genuinely characteristic of the country (not merely eaten there),
and every `desc` / `why` is written for this build.

    DISHES = [ (iso2, [ d(name, desc, why, wiki=..., mdb=...), ... ]), ... ]

    name  the dish, spelled properly with its diacritics
    desc  ONE sentence a player can reason from -- key ingredients and technique.
          It must NEVER contain the country's name or any demonym; gen_food.py
          machine-checks this against every country name/demonym in countries.js.
    why   revealed after the round: why this dish belongs to this country.
    wiki  exact en.wikipedia.org article title -> its lead photo (Commons)
    mdb   exact TheMealDB dish name -> its photo   (used where wiki has none)

Dishes within a country are listed HARDEST-TO-GUESS FIRST, so the game can drip
clues: round shows dish 1, then falls back to more famous ones.
"""


def d(name, desc, why, wiki=None, mdb=None, commons=None, wikias=None, wl=None):
    """wiki    en.wikipedia article title (its lead photo is used)
       wikias  the title the article ANSWERS with, when it is a known redirect --
               gen_food.py refuses any image whose article title it did not expect,
               because 'Causa' is a snail genus and 'Tibs' redirects to a general
               cuisine page.  Only set this after checking the target by hand.
       wl      wikipedia language code, default 'en'
       commons exact 'File:...' title on Wikimedia Commons
       mdb     exact TheMealDB dish name"""
    r = {"name": name, "desc": desc, "why": why}
    for k, v in (("wiki", wiki), ("mdb", mdb), ("commons", commons),
                 ("wikias", wikias), ("wl", wl)):
        if v:
            r[k] = v
    return r


DISHES = [

    # ══ IRAN ══════════════════════════════════════════════════════════════
    ("IR", [
        d("Halim",
          "A thick breakfast porridge of wheat berries cooked down with shredded lamb or "
          "turkey and beaten for hours until it turns smooth and stringy, served under "
          "cinnamon, sugar and melted butter.",
          "A winter dawn food, ladled from vast copper vats before sunrise; the long "
          "beating is what pulls grain and meat into one ropy mass."),
        d("Ash-e reshteh",
          "A dense green soup of noodles, chickpeas, lentils and enormous quantities of "
          "herbs, finished with fried mint oil, caramelised onion and a swirl of sour "
          "whey.",
          "Cooked for Nowruz and for votive vows: the tangled noodles stand for the "
          "strands of fate you are asking to have untangled in the year ahead.",
          wiki="Aush reshteh"),
        d("Tahchin",
          "A saffron-and-yoghurt rice cake pressed into a mould and baked until the base "
          "sets into a solid crimson crust, with shredded chicken or lamb hidden inside.",
          "The grandest form of tahdig, the crisp bottom-of-the-pot rice that gets "
          "fought over at every table.",
          wiki="Tahchin"),
        d("Faloodeh",
          "Thin frozen starch noodles set in a rose water and sugar syrup, scraped icy "
          "into a bowl and eaten with lime juice or sour cherry syrup.",
          "Shiraz claims it, and it is one of the oldest frozen desserts anyone still "
          "eats -- described in texts well over a thousand years old.",
          wiki="Faloodeh"),
        d("Sabzi polo ba mahi",
          "Rice steamed with heaps of chopped dill, coriander, parsley, chives and "
          "fenugreek, served alongside a whole fish fried until the skin blisters.",
          "The meal of the spring equinox: green herbs for renewal, fish for life, eaten "
          "the moment the new year turns.",
          wiki="Sabzi polo"),
        d("Fesenjan",
          "A dark, glossy braise of ground walnuts and pomegranate molasses cooked for "
          "hours with duck or chicken until the oil rises and the sauce turns almost "
          "black.",
          "A dish of the Caspian north and of the old royal kitchens; it must cook long "
          "enough for the walnut oil to separate out on top.",
          wiki="Fesenjan"),
        d("Ghormeh sabzi",
          "A deep green stew of parsley, coriander, fenugreek and leek fried until nearly "
          "black, then simmered with lamb, kidney beans and whole sun-dried limes.",
          "Widely called the national dish. The sourness is limoo omani -- limes dried "
          "whole in the sun, pierced before they go into the pot.",
          wiki="Ghormeh sabzi"),
        d("Kabab koobideh",
          "Minced lamb and beef kneaded with grated onion until sticky, pressed by hand "
          "onto wide flat skewers and grilled over charcoal with tomatoes.",
          "The everyday grill of every roadside restaurant; the meat is worked until it "
          "clings to the flat skewer and does not slide off over the coals.",
          wiki="Kabab koobideh"),
    ]),

    # ══ UNITED KINGDOM ════════════════════════════════════════════════════
    ("GB", [
        d("Cullen skink",
          "A thick soup of smoked haddock poached in milk with potato and onion, left "
          "chunky and eaten with bread.",
          "From the fishing town of Cullen on the Moray Firth; 'skink' is an old word "
          "for a shin-of-beef broth that the fishermen replaced with smoked fish.",
          wiki="Cullen skink"),
        d("Toad in the hole",
          "Sausages baked inside a loose egg-and-flour batter that puffs up and crisps "
          "around them, served with onion gravy.",
          "The batter is the same one that goes with a roast; the name has been in "
          "print since the 1700s and nobody has explained it convincingly.",
          wiki="Toad in the hole"),
        d("Welsh rarebit",
          "A thick savoury sauce of sharp cheese melted with ale, mustard and "
          "Worcestershire sauce, poured over toast and grilled until it blisters.",
          "Not cheese on toast: the cheese is cooked into a mustardy sauce first, then "
          "browned under the grill.",
          wiki="Welsh rarebit"),
        d("Sticky toffee pudding",
          "A dark sponge made with chopped dates and treacle, drowned in hot toffee "
          "sauce and served with cream.",
          "A Lake District hotel invention of the 1970s that colonised every pub menu "
          "in the country within a decade.",
          wiki="Sticky toffee pudding"),
        d("Cornish pasty",
          "A hand-held pastry parcel crimped along one curved side, filled with raw beef "
          "skirt, potato, swede and onion that cook in their own steam.",
          "Legally protected: made in Cornwall, D-shaped, crimped at the side so a tin "
          "miner could hold it by the thick edge and throw that bit away.",
          wiki="Cornish pasty"),
        d("Shepherd's pie",
          "Minced lamb stewed with onion, carrot and gravy under a thick mashed-potato "
          "lid, baked until the top is forked and browned.",
          "Lamb makes it a shepherd's pie, beef makes it a cottage pie -- both began as "
          "a way of using up Sunday's roast.",
          wiki="Shepherd's pie"),
        d("Fish and chips",
          "White fish in a beer batter, deep-fried and served with thick-cut fried "
          "potatoes, mushy peas and malt vinegar.",
          "Sold from dedicated shops since the 1860s and never rationed during the "
          "Second World War, on the grounds that morale depended on it.",
          wiki="Fish and chips"),
    ]),

    # ══ ITALY ═════════════════════════════════════════════════════════════
    ("IT", [
        d("Bagna cauda",
          "A hot dip of anchovies and garlic melted into olive oil and butter, kept warm "
          "over a flame at the table for dunking raw and cooked vegetables.",
          "A Piedmontese autumn ritual eaten communally from one terracotta pot, "
          "traditionally after the grape harvest.",
          wiki="Bagna càuda"),
        d("Ribollita",
          "A peasant soup of white beans, black cabbage and stale bread, boiled again "
          "the next day until it collapses into a thick spoonable mass.",
          "The name means 'reboiled': the bread is what turns yesterday's bean and "
          "cabbage soup into today's dinner.",
          wiki="Ribollita"),
        d("Ossobuco",
          "Cross-cut veal shanks braised slowly in white wine and broth until the marrow "
          "softens, finished with a raw parsley, lemon zest and garlic gremolata.",
          "A Milanese dish, usually served on the saffron risotto from the same city; "
          "the hollow bone the name refers to is the point of it.",
          wiki="Ossobuco"),
        d("Risotto alla milanese",
          "Short-grain rice toasted in butter and stirred with hot broth and saffron "
          "until it turns creamy, then beaten with grated hard cheese.",
          "Milan's yellow rice; the story ties it to a 16th-century glassworker who "
          "used saffron as a pigment for the cathedral windows.",
          wiki="Risotto alla milanese"),
        d("Cacio e pepe",
          "Pasta tossed with nothing but sheep's-milk cheese, cracked black pepper and "
          "starchy cooking water, worked into a glossy sauce.",
          "Shepherds' food from Lazio: three ingredients that travel well, and a sauce "
          "that splits into a lumpy mess if the pan is too hot.",
          wiki="Cacio e pepe"),
        d("Tiramisu",
          "Sponge fingers soaked in coffee, layered with whipped mascarpone and egg, "
          "dusted with cocoa and chilled.",
          "A surprisingly young dessert -- the evidence points to a restaurant in "
          "Treviso between the 1960s and 1970s.",
          wiki="Tiramisu"),
        d("Pizza margherita",
          "A thin wheat base blistered in seconds in a wood-fired oven under tomato, "
          "buffalo mozzarella and a few basil leaves.",
          "Named for Queen Margherita in 1889; the red, white and green were read as a "
          "nod to the flag of the newly unified kingdom.",
          wiki="Neapolitan pizza"),
    ]),

    # ══ JAPAN ═════════════════════════════════════════════════════════════
    ("JP", [
        d("Chawanmushi",
          "A savoury egg custard steamed in a lidded cup with kelp-and-bonito stock, "
          "hiding prawn, mushroom and gingko nuts, and eaten with a spoon.",
          "One of very few dishes in this cuisine eaten with a spoon; steam it too hard "
          "and the custard goes porous instead of silky.",
          wiki="Chawanmushi"),
        d("Oden",
          "Fish cakes, daikon, boiled eggs and konjac simmered for hours in a pale "
          "kelp-and-soy broth and ladled out compartment by compartment.",
          "Winter convenience-store food, kept bubbling in a divided tray beside the "
          "till from October onwards.",
          wiki="Oden"),
        d("Okonomiyaki",
          "A thick cabbage-packed batter pancake griddled with pork belly, then painted "
          "with sweet brown sauce and mayonnaise and topped with dried fish flakes that "
          "curl in the heat.",
          "The name means 'grill what you like'. Osaka mixes everything into the batter; "
          "Hiroshima layers it and slips fried noodles underneath.",
          wiki="Okonomiyaki"),
        d("Tonkatsu",
          "A pork loin cutlet coated in coarse dry breadcrumbs, deep-fried, sliced into "
          "strips and served with shredded raw cabbage and a fruity brown sauce.",
          "A late-19th-century western import naturalised so thoroughly that the sauce, "
          "the cabbage and the rice alongside are now fixed.",
          wiki="Tonkatsu"),
        d("Ramen",
          "Alkaline wheat noodles in a long-boiled pork-bone or soy broth, topped with "
          "rolled braised pork belly, a marinated soft-yolk egg and spring onion.",
          "Chinese in origin, remade region by region -- pork-bone in Fukuoka, miso in "
          "Sapporo, soy in Tokyo.",
          wiki="Ramen"),
        d("Sushi",
          "Vinegared short-grain rice pressed by hand into small blocks and draped with "
          "raw fish, or rolled with it inside a sheet of dried seaweed.",
          "Began as a fast street food in 19th-century Edo, when the fermented original "
          "was replaced by rice seasoned with vinegar.",
          wiki="Sushi"),
    ]),

    # ══ INDIA ═════════════════════════════════════════════════════════════
    ("IN", [
        d("Dhokla",
          "A savoury steamed cake of fermented chickpea batter, spongy and faintly sour, "
          "tempered with mustard seed, curry leaf and green chilli.",
          "A Gujarati breakfast and tiffin staple; the batter ferments overnight before "
          "it is steamed in shallow trays and cut into diamonds.",
          wiki="Dhokla"),
        d("Rogan josh",
          "Lamb braised in a brick-red gravy coloured by mild dried chillies and "
          "cockscomb flower, spiced with fennel and dried ginger and made without onion "
          "or garlic.",
          "A Kashmiri dish carried in by the Mughals; the colour comes from ratan jot "
          "and chilli, not from tomato.",
          wiki="Rogan josh"),
        d("Pani puri",
          "Hollow crisp spheres cracked open at the top, packed with potato and "
          "chickpea, flooded with iced mint-tamarind water and eaten whole in one bite.",
          "Street food with a dozen regional names -- golgappa, puchka, gup chup -- and "
          "a vendor who hands them over one at a time until you say stop.",
          wiki="Panipuri"),
        d("Idli",
          "Soft steamed discs of fermented rice-and-lentil batter, faintly sour, eaten "
          "with a tamarind-lentil vegetable broth and coconut chutney.",
          "A southern breakfast; the fermentation is wild, driven by the lentil skins, "
          "and the batter is ground on stone.",
          wiki="Idli"),
        d("Masala dosa",
          "An enormous thin crepe of fermented rice-and-lentil batter crisped on a "
          "griddle and folded around spiced turmeric-yellow potato.",
          "From Karnataka and now the country's most exported breakfast; the batter is "
          "the same as idli, ground finer and spread paper-thin.",
          wiki="Masala dosa"),
        d("Biryani",
          "Long-grain rice layered raw over yoghurt-marinated meat and fried onions, "
          "sealed under a lid of dough and cooked so the grains steam in the meat's "
          "own vapour.",
          "The sealed-pot method arrived with Persian cooks; Hyderabad, Lucknow, "
          "Kolkata and Malabar each defend a different version.",
          wiki="Biryani"),
        d("Butter chicken",
          "Clay-oven-charred chicken finished in a gravy of tomato, butter and cream "
          "scented with dried fenugreek leaf, mopped up with leavened flatbread.",
          "Invented in Delhi in the 1950s by cooks who needed something to do with "
          "yesterday's unsold tandoori chicken.",
          wiki="Butter chicken"),
    ]),

    # ══ MEXICO ════════════════════════════════════════════════════════════
    ("MX", [
        d("Cochinita pibil",
          "Pork marinated in sour orange juice and ground annatto seed, wrapped in "
          "banana leaves and roasted for hours in a covered earth pit until it shreds, "
          "served with pickled red onion.",
          "A Yucatan pit-roast: pib is the earth oven, and the orange-red colour is "
          "achiote seed rather than chilli.",
          wiki="Cochinita pibil"),
        d("Chiles en nogada",
          "Roasted green peppers stuffed with a sweet-savoury minced meat and fruit "
          "filling, cloaked in a cold walnut cream and scattered with pomegranate seeds "
          "and parsley.",
          "Green, white and red -- the national colours -- and eaten in the weeks around "
          "independence in September, when walnuts and pomegranates are both in.",
          wiki="Chiles en nogada"),
        d("Mole poblano",
          "A near-black sauce of several kinds of dried chilli with nuts, seeds, spices, "
          "stale bread and a little chocolate, all toasted, ground and fried before the "
          "broth goes in, served over turkey.",
          "Puebla's convent sauce, with more than twenty ingredients, each toasted "
          "separately; chocolate is a seasoning here, not a sweetener.",
          wiki="Mole poblano"),
        d("Pozole",
          "A soup of dried field corn treated with lime until the kernels bloom open, "
          "simmered with pork and dressed at the table with shredded cabbage, radish, "
          "oregano and lime.",
          "A weekend and holiday soup that comes in red, white or green depending on the "
          "region; the bloomed corn is the whole point.",
          wiki="Pozole"),
        d("Tamales",
          "Corn dough beaten with fat until it floats, spread on a soaked husk around a "
          "chilli-braised filling, folded and steamed until it sets.",
          "Pre-Columbian and made everywhere from Sonora to Oaxaca; families steam "
          "hundreds at a time for Candlemas on 2 February.",
          wiki="Tamale"),
        d("Tacos al pastor",
          "Pork marinated in dried chilli and annatto, stacked on a vertical spit under "
          "a pineapple, shaved onto small maize tortillas with onion and coriander.",
          "Lebanese immigrants brought the vertical shawarma spit in the early 20th "
          "century; the lamb became pork and the pineapple stayed.",
          wiki="Al pastor"),
    ]),

    # ══ THAILAND ══════════════════════════════════════════════════════════
    ("TH", [
        d("Khao soi",
          "A curried coconut noodle soup crowned with a nest of deep-fried crisp egg "
          "noodles, served with pickled mustard greens, shallot and lime alongside.",
          "The noodle bowl of Chiang Mai and the north, carried down the old caravan "
          "routes from Yunnan by Muslim traders.",
          wiki="Khao soi"),
        d("Massaman curry",
          "A mild, fragrant curry of beef or chicken with potato and peanuts, scented "
          "with cardamom, cinnamon, clove and star anise in coconut milk.",
          "A Muslim-influenced southern curry whose warm dry spices arrived by sea with "
          "Persian and Indian traders in the 17th century.",
          wiki="Massaman curry"),
        d("Som tam",
          "Shredded unripe papaya bruised in a tall clay mortar with garlic, chillies, "
          "lime, fish sauce, palm sugar, tomato and long beans.",
          "Isan food from the north-east, eaten with sticky rice; vendors are recognised "
          "by the rhythm of the pestle.",
          wiki="Green papaya salad"),
        d("Tom yum goong",
          "A clear, fiery-sour prawn soup sharpened with lemongrass, galangal, makrut "
          "lime leaf, bird's eye chilli and lime juice.",
          "The sourness is lime and the heat is fresh chilli -- no vinegar and no "
          "sweetness; the creamy version adds evaporated milk.",
          wiki="Tom yum"),
        d("Mango sticky rice",
          "Glutinous rice steamed and soaked in sweetened coconut cream, served with "
          "slices of ripe mango and a salted coconut drizzle.",
          "A hot-season dessert tied to the April mango harvest, sold from carts with "
          "the rice kept warm under cloth.",
          wiki="Mango sticky rice"),
        d("Pad thai",
          "Thin rice noodles stir-fried hard with tamarind, fish sauce and palm sugar, "
          "with egg, prawns, pressed tofu, bean sprouts and garlic chives, finished with "
          "crushed peanuts.",
          "Promoted by the government in the 1930s and 40s as a national noodle dish, to "
          "cut wheat imports and forge a modern identity.",
          wiki="Pad thai"),
    ]),

    # ══ TURKEY ════════════════════════════════════════════════════════════
    ("TR", [
        d("Manti",
          "Minute hand-pinched dumplings of spiced minced lamb, boiled and served under "
          "garlic yoghurt and butter reddened with pepper flakes and dried mint.",
          "Kayseri's version is the prestige one -- folded so small that forty are "
          "supposed to fit on a single spoon.",
          wiki="Manti (food)"),
        d("Menemen",
          "Eggs stirred loosely into softened green peppers and tomato with plenty of "
          "oil and left runny, scooped straight from the pan with bread.",
          "The breakfast standard; the argument is whether onion belongs in it, and "
          "the answer depends on which coast you are from.",
          wiki="Menemen (food)"),
        d("Pide",
          "A long boat-shaped flatbread baked with minced meat, cheese or egg inside, "
          "its edges folded up to hold the filling in.",
          "Baked in a stone oven and cut across into strips; the Black Sea version "
          "closes over cheese and butter and gets an egg on top.",
          wiki="Turkish pide", wikias="İçli pide"),
        d("Iskender kebab",
          "Sliced spit-roasted lamb laid over cubes of flatbread, doused in hot tomato "
          "sauce and foaming melted butter, with thick yoghurt on the side.",
          "Named after the Bursa butcher who, in the 1860s, turned the horizontal kebab "
          "spit upright -- the ancestor of every doner since.",
          wiki="İskender kebap"),
        d("Lahmacun",
          "A paper-thin round of dough spread with minced lamb, tomato, pepper and "
          "parsley, baked for barely two minutes, then squeezed with lemon and rolled "
          "around salad.",
          "A south-eastern speciality from around Gaziantep and Sanliurfa, sold by "
          "bakeries by the piece.",
          wiki="Lahmacun"),
        d("Baklava",
          "Dozens of sheets of stretched pastry brushed with clarified butter, packed "
          "with ground pistachios and soaked in sugar syrup the moment it leaves the "
          "oven.",
          "Shared across the whole former Ottoman world, but Gaziantep's pistachio "
          "version carries a protected designation; the dough is stretched until you "
          "can read through it.",
          wiki="Baklava"),
    ]),

    # ══ LEBANON ═══════════════════════════════════════════════════════════
    ("LB", [
        d("Shish barak",
          "Small meat dumplings simmered in warm garlicky yoghurt stabilised so it does "
          "not split, finished with fried pine nuts and dried mint.",
          "A winter dish of the mountain villages; the yoghurt is cooked with starch and "
          "stirred one way only, or it curdles.",
          wiki="Shish barak"),
        d("Kibbeh nayyeh",
          "Very lean raw lamb pounded with fine cracked wheat, grated onion and spices, "
          "spread flat on a plate and eaten with olive oil, mint and flatbread.",
          "The Sunday-lunch centrepiece of the mountains, pounded in a stone mortar; "
          "the cooked version is shaped into torpedoes and deep-fried.",
          wiki="Kibbeh"),
        d("Mujaddara",
          "Lentils and rice cooked together and buried under onions fried to the edge of "
          "burnt, eaten warm or cold with yoghurt.",
          "Medieval cookbooks record it as the food of the poor; the whole flavour comes "
          "from how far you dare take the onions.",
          wiki="Mujaddara"),
        d("Manakish",
          "Flatbread baked with a paste of dried wild thyme, sesame and sour red sumac "
          "loosened with olive oil, eaten hot for breakfast.",
          "Taken to the neighbourhood oven on a tray in the morning; the herb blend is "
          "za'atar, mixed differently by every household.",
          wiki="Manakish"),
        d("Fattoush",
          "A salad of tomato, cucumber, radish, purslane and herbs tossed with torn "
          "toasted flatbread and dressed with lemon, olive oil and sour red sumac.",
          "A peasant salad built to use up stale bread, and one of the two that anchor "
          "a mezze table.",
          wiki="Fattoush"),
        d("Tabbouleh",
          "A salad that is overwhelmingly finely chopped parsley and mint with only a "
          "little soaked cracked wheat, plus tomato, lemon and olive oil.",
          "Here it is a herb salad with a hint of grain -- the reverse of the grain "
          "salads sold under the name abroad.",
          wiki="Tabbouleh"),
    ]),

    # ══ ETHIOPIA ══════════════════════════════════════════════════════════
    ("ET", [
        d("Shiro",
          "A smooth stew of ground chickpea or broad-bean flour cooked with onion, "
          "garlic and a fiery red spice blend until it thickens like porridge.",
          "Fasting food for the Orthodox calendar's many meat-free days; the powder "
          "keeps for months, which is why it is everywhere.",
          wiki="Shiro (food)"),
        d("Kitfo",
          "Raw minced beef warmed through in spiced clarified butter and chilli powder, "
          "served with a crumbly fresh cheese and cooked greens.",
          "A Gurage speciality; leb leb means barely warmed, and it is properly eaten "
          "with kocho, a bread made from the false-banana plant.",
          wiki="Kitfo"),
        d("Tibs",
          "Cubes of beef or lamb seared fast with onion, rosemary, green chilli and "
          "spiced clarified butter, brought to the table still spitting in a clay dish.",
          "The celebration cut, often carved from an animal slaughtered that morning "
          "and cooked over a charcoal brazier set into the serving pot.",
          commons="File:Siga Tibs.jpg"),
        d("Doro wat",
          "Chicken stewed for hours with onions cooked dry until they collapse, a red "
          "chilli-and-spice blend and clarified butter, served with a whole hard-boiled "
          "egg.",
          "The feast dish for Christmas and Easter; the onions go in with no fat at all "
          "and can take an hour before anything else is added.",
          wiki="Doro wat"),
        d("Injera",
          "A wide, soft, sour flatbread of fermented teff batter poured in a spiral onto "
          "a clay griddle, its top riddled with holes, used as plate, cutlery and food.",
          "Teff is a tiny indigenous grain; the batter ferments for days, which is where "
          "the sourness and the bubbles come from.",
          wiki="Injera"),
    ]),

    # ══ GEORGIA ═══════════════════════════════════════════════════════════
    ("GE", [
        d("Chakapuli",
          "Lamb or veal stewed with masses of tarragon, unripe sour plums, spring onion "
          "and dry white wine until sharply sour and grassy.",
          "A spring dish, cooked in the few weeks when tarragon and sour plums are both "
          "available, often outdoors for Easter.",
          wiki="Chakapuli"),
        d("Pkhali",
          "Chopped spinach, beetroot or beans pounded with ground walnuts, garlic, "
          "coriander and vinegar into cold pates, shaped into balls and dotted with "
          "pomegranate seeds.",
          "Served in a row of different colours at the start of a supra, the ritual "
          "feast run by a toastmaster.",
          wiki="Pkhali"),
        d("Satsivi",
          "Poached chicken or turkey served cold under a thick, pale sauce of ground "
          "walnuts, garlic, coriander seed and dried marigold petals.",
          "The New Year dish; the yellow comes from dried marigold, used locally the way "
          "saffron is used elsewhere.",
          wiki="Satsivi"),
        d("Lobio",
          "Kidney beans stewed with coriander, blue fenugreek and walnut and served in "
          "the clay pot they cooked in, with cornbread and pickles.",
          "Everyday food, and the reason the local blue fenugreek and dried marigold "
          "spice mix exists.",
          wiki="Lobio"),
        d("Khinkali",
          "Pleated dumplings with a twisted knot on top, filled with spiced minced meat "
          "and broth, boiled and eaten by hand -- the knot is left uneaten on the plate.",
          "Count the discarded knots to see who ate most; the soup inside comes from "
          "broth kneaded into the raw filling, not poured in.",
          wiki="Khinkali"),
        d("Khachapuri",
          "A boat of yeasted dough filled with brined stretchy cheese, baked, then "
          "finished with a raw egg yolk and butter stirred into the molten middle.",
          "The Adjaran boat-shaped version from the Black Sea coast; inland versions are "
          "round and sealed, with the cheese hidden inside.",
          wiki="Khachapuri"),
    ]),

    # ══ SOUTH KOREA ═══════════════════════════════════════════════════════
    ("KR", [
        d("Samgyetang",
          "A whole young chicken stuffed with sticky rice, ginseng root, garlic and "
          "jujube, boiled until the broth turns milky, and eaten scalding hot in "
          "midsummer.",
          "Eaten on the three hottest days of the year, on the principle of fighting "
          "heat with heat.",
          wiki="Samgyetang"),
        d("Sundubu jjigae",
          "A furiously bubbling red stew of soft unpressed curdled soybean with "
          "fermented chilli paste, seafood or pork, and a raw egg cracked in at the "
          "table.",
          "Served in a stone pot straight off the flame; the curd is so soft it is "
          "spooned in rather than cut.",
          wiki="Sundubu-jjigae"),
        d("Japchae",
          "Chewy translucent sweet-potato starch noodles tossed in sesame oil and soy "
          "with separately fried vegetables and thin strips of beef, served warm or "
          "cool.",
          "A royal court dish from the 17th century that had no noodles in it at all "
          "until the 20th.",
          wiki="Japchae"),
        d("Tteokbokki",
          "Chewy cylinders of pounded rice cake simmered in a sweet-hot fermented chilli "
          "sauce with fish cake, boiled egg and spring onion.",
          "Street-stall food since the 1950s, when wheat aid and a fiery gochujang sauce "
          "turned a mild court dish red.",
          wiki="Tteokbokki"),
        d("Bibimbap",
          "A bowl of rice topped with separate mounds of seasoned vegetables, minced "
          "beef and a fried egg, stirred together with fermented chilli paste before "
          "eating.",
          "Jeonju's version is the famous one; the stone-bowl variant keeps sizzling so "
          "a crust forms on the bottom.",
          wiki="Bibimbap"),
        d("Kimchi",
          "Cabbage salted overnight, then coated in a paste of chilli powder, garlic, "
          "ginger and salted shrimp and left to ferment until sour and fizzing.",
          "Made communally in late autumn and buried in jars; there are hundreds of "
          "regional and seasonal versions besides the cabbage one.",
          wiki="Kimchi"),
    ]),

    # ══ VIETNAM ═══════════════════════════════════════════════════════════
    ("VN", [
        d("Cao lau",
          "Thick chewy noodles said to require water from one particular well, served "
          "with slices of roast pork, crisp fried croutons, herbs and barely any broth.",
          "Made only in Hoi An; the noodles are treated with lye water from the ash of "
          "a specific island's wood.",
          wiki="Cao lầu"),
        d("Bun cha",
          "Charcoal-grilled pork patties and belly slices floating in a sweet-sour "
          "fish-sauce broth, with cold rice vermicelli and a basket of raw herbs to dip.",
          "Hanoi's lunch, eaten on plastic stools in the smoke of the grill -- and the "
          "meal Obama and Anthony Bourdain shared in 2016.",
          wiki="Bún chả"),
        d("Banh xeo",
          "A large crisp turmeric-yellow rice-flour crepe folded over pork, prawns and "
          "bean sprouts, then torn up and wrapped in lettuce and herbs before dipping.",
          "The name means 'sizzling cake', after the noise the batter makes hitting the "
          "hot pan; the south makes them huge, the centre makes them small.",
          wiki="Bánh xèo"),
        d("Banh mi",
          "A light, crackly rice-and-wheat baguette split and filled with pate, cold "
          "pork, pickled carrot and daikon, coriander, chilli and mayonnaise.",
          "A colonial French loaf lightened with rice flour and refilled with local "
          "pickles and herbs -- the empire's bread, comprehensively repurposed.",
          wiki="Bánh mì"),
        d("Pho",
          "A clear beef broth simmered for hours with charred ginger and onion, star "
          "anise and cinnamon, poured boiling over flat rice noodles and raw sliced "
          "beef.",
          "Born in the north around Hanoi in the early 20th century and carried south, "
          "then worldwide, by two waves of migration.",
          wiki="Pho"),
    ]),

    # ══ NIGERIA ═══════════════════════════════════════════════════════════
    ("NG", [
        d("Ogbono soup",
          "A deliberately slippery, drawing soup thickened with ground wild-mango "
          "kernels, cooked with red palm oil, meat, dried fish and leafy greens.",
          "The texture is the point: it should pull into long threads off the spoon, "
          "which is what tells you the kernels were ground fresh.",
          wiki="Ogbono soup"),
        d("Moin moin",
          "A savoury steamed pudding of blended peeled beans with peppers, onion and "
          "oil, set in leaf wraps or tins, often with boiled egg or fish buried inside.",
          "The skins have to be rubbed off the beans by hand before blending, which is "
          "why it is party food rather than weeknight food.",
          wiki="Moin moin"),
        d("Pepper soup",
          "A thin, ferociously hot broth of goat, catfish or offal scented with a "
          "blend of aromatic bark and seeds, drunk from a bowl.",
          "Ordered at bars and after childbirth alike; the spice blend leans on grains "
          "of selim and calabash nutmeg rather than chilli alone.",
          wiki="Pepper soup"),
        d("Egusi soup",
          "A thick stew of ground melon seeds that set into soft curds as they cook, "
          "with red palm oil, bitter leaf or spinach, and assorted meat and fish.",
          "Eaten with a 'swallow' -- pounded yam or cassava fufu, pinched into a ball, "
          "dipped and swallowed without chewing.",
          wiki="Egusi"),
        d("Suya",
          "Thin strips of beef rubbed with a dry blend of ground peanut, chilli, ginger "
          "and spices, grilled over wood and served with raw onion and more of the "
          "spice mix.",
          "A Hausa grill from the north, sold from smoky roadside stands after dark and "
          "wrapped in newspaper.",
          wiki="Suya"),
        d("Jollof rice",
          "Long-grain rice cooked in a blended stew of tomato, red pepper, onion and "
          "spices until every grain is orange and the bottom of the pot catches.",
          "The centre of a long-running rivalry with Ghana and Senegal; cooked over "
          "firewood at parties so the smoke gets into it.",
          wiki="Jollof rice"),
    ]),

    # ══ PERU ══════════════════════════════════════════════════════════════
    ("PE", [
        d("Papa a la huancaina",
          "Slices of boiled potato under a smooth cold sauce of fresh cheese, milk, "
          "crackers and yellow chilli, garnished with black olives and boiled egg.",
          "Named for Huancayo and said to have been invented for railway workers; the "
          "yellow chilli is aji amarillo, the backbone of the whole cuisine.",
          wiki="Papa a la Huancaína"),
        d("Causa",
          "Cold mashed yellow potato whipped with lime juice and yellow chilli paste, "
          "layered like a terrine with chicken or crab salad and avocado, and served "
          "chilled.",
          "Built on the yellow potato of the highlands -- one of thousands of native "
          "varieties -- and eaten cold, in neat layers, like a savoury cake.",
          wiki="Causa limeña", wikias="Causa a la limeña", wl="es"),
        d("Aji de gallina",
          "Shredded hen in a thick sauce of yellow chilli, bread soaked in milk, walnuts "
          "and cheese, spooned over boiled potato and white rice.",
          "A colonial adaptation of a medieval almond-and-bread dish, rebuilt around the "
          "local yellow chilli.",
          wiki="Ají de gallina"),
        d("Anticuchos",
          "Marinated beef hearts threaded onto skewers and grilled hard over coals with "
          "dried red chilli, cumin, garlic and vinegar.",
          "Offal cuts given to enslaved and indentured workers in the colonial era, now "
          "the smell of every evening street corner.",
          wiki="Anticucho"),
        d("Lomo saltado",
          "Strips of beef seared in a scorching wok with red onion, tomato and soy "
          "sauce, tossed with fried potatoes and served with rice.",
          "Chifa cooking: Cantonese wok technique brought by 19th-century migrants, "
          "applied to beef, potatoes and soy all on one plate.",
          wiki="Lomo saltado"),
        d("Ceviche",
          "Raw white fish cured in minutes in lime juice with red onion, chilli and "
          "coriander, served with sweet potato and large-kernel boiled corn.",
          "Declared national cultural heritage; the milky lime marinade left in the bowl "
          "is drunk separately as leche de tigre.",
          wiki="Ceviche"),
    ]),

    # ══ BRAZIL ════════════════════════════════════════════════════════════
    ("BR", [
        d("Acaraje",
          "Peeled black-eyed pea batter whipped until airy and deep-fried in red palm "
          "oil, then split and stuffed with dried shrimp, cashew paste and hot pepper "
          "sauce.",
          "Sold in Salvador by women in white lace; the dish crossed from West Africa "
          "and doubles as an offering in Candomble.",
          wiki="Acarajé"),
        d("Moqueca",
          "A slow stew of fish and prawns cooked in a lidded clay pot with coconut milk, "
          "red palm oil, tomato, onion, lime and coriander.",
          "Bahia's version is orange with dende palm oil; Espirito Santo's leaves it out "
          "and cooks in a black clay pot made by hand.",
          wiki="Moqueca"),
        d("Coxinha",
          "A teardrop-shaped croquette of dough enriched with chicken broth, wrapped "
          "around shredded chicken and cream cheese, breaded and deep-fried.",
          "Shaped to look like a drumstick -- the name means 'little thigh' -- and sold "
          "in every bakery by the counter.",
          wiki="Coxinha"),
        d("Pao de queijo",
          "Small hollow rolls of sour cassava starch and cheese, baked until they puff "
          "up, crisp outside and stay chewy and elastic inside.",
          "From Minas Gerais, where cassava starch replaced wheat flour; naturally "
          "gluten-free, and eaten hot for breakfast.",
          wiki="Pão de queijo"),
        d("Brigadeiro",
          "Condensed milk cooked down with cocoa powder and butter until it pulls away "
          "from the pan, rolled into balls and coated in chocolate sprinkles.",
          "Named for a 1940s presidential candidate, an air force brigadier whose "
          "supporters sold them at campaign events.",
          wiki="Brigadeiro"),
        d("Feijoada",
          "Black beans stewed for hours with salted and smoked pork cuts, served with "
          "rice, toasted cassava flour, sauteed collard greens and orange slices.",
          "The Saturday lunch that stops the afternoon; the orange and the greens are "
          "there to cut a very heavy pot of pork and beans.",
          wiki="Feijoada"),
    ]),

    # ══ FRANCE ════════════════════════════════════════════════════════════
    ("FR", [
        d("Cassoulet",
          "A slow-baked casserole of white beans with preserved duck leg, pork and "
          "garlic sausage, its browned crust broken back down into the pot as it cooks.",
          "Toulouse, Castelnaudary and Carcassonne each claim the original recipe; the "
          "crust is supposed to be pushed under seven times.",
          wiki="Cassoulet"),
        d("Bouillabaisse",
          "A fishermen's stew of several kinds of bony rockfish poached in a saffron and "
          "fennel broth, served with a rust-coloured garlic mayonnaise on toast.",
          "Marseille's harbour dish, built from the ugly rockfish nobody would buy; a "
          "1980s charter set out which species may legitimately go in.",
          wiki="Bouillabaisse"),
        d("Coq au vin",
          "An old bird jointed and braised in red wine with salt pork, button mushrooms "
          "and small onions, the sauce finished with blood or liver.",
          "Burgundy's way with a bird too tough to roast; the long soak in wine is what "
          "makes it tender.",
          wiki="Coq au vin"),
        d("Ratatouille",
          "Aubergine, courgette, sweet pepper, tomato and onion cooked separately in "
          "olive oil with thyme and bay, then brought together and stewed down.",
          "A Nicoise summer dish; cooking each vegetable apart is what stops it "
          "collapsing into a single mush.",
          wiki="Ratatouille"),
        d("Tarte Tatin",
          "An upside-down tart in which apples caramelise in butter and sugar under a "
          "pastry lid, then are turned out fruit-side up.",
          "Named for two sisters running a hotel near Orleans, who supposedly rescued a "
          "tart they had started to make the wrong way round.",
          wiki="Tarte Tatin"),
    ]),

    # ══ SPAIN ═════════════════════════════════════════════════════════════
    ("ES", [
        d("Fabada",
          "A heavy stew of large flat white beans with blood sausage, smoked paprika "
          "sausage and cured pork shoulder, simmered until the broth turns orange.",
          "Asturias in a pot: the beans are a specific local variety, and the three "
          "cured meats are known collectively as the compango.",
          wiki="Fabada asturiana"),
        d("Salmorejo",
          "A thick, cold, orange cream of raw tomato and bread emulsified with olive oil "
          "and garlic, topped with chopped boiled egg and cured ham.",
          "Cordoba's answer to the thinner cold soups of the same region -- more bread, "
          "more oil, thick enough to eat with a spoon.",
          wiki="Salmorejo"),
        d("Pulpo a la gallega",
          "Octopus boiled in a copper pot, snipped into coins over sliced potato and "
          "finished with coarse salt, sweet paprika and a flood of olive oil.",
          "Galicia's fair-day dish, cooked in copper by travelling pulpeiras and served "
          "on a wooden plate with a toothpick.",
          wiki="Polbo á feira", wikias="Polbo á feira"),
        d("Tortilla de patatas",
          "A thick set omelette of egg with potato and onion poached soft in olive oil, "
          "flipped in the pan and cut into wedges, eaten warm or cold.",
          "The one dish in every bar in the country; whether onion belongs in it is a "
          "genuinely divisive national argument.",
          wiki="Spanish omelette", wikias="Spanish omelette"),
        d("Gazpacho",
          "A cold raw soup of blended tomato, cucumber, pepper, garlic, bread, vinegar "
          "and olive oil, often drunk from a glass.",
          "Andalusian field food that predates tomatoes -- it was bread, oil, vinegar "
          "and garlic long before the New World arrived.",
          wiki="Gazpacho"),
        d("Paella valenciana",
          "Short-grain rice cooked flat and uncovered in a wide shallow pan with "
          "saffron, rabbit, chicken and flat green beans until a toasted crust forms "
          "underneath.",
          "A field lunch from the rice paddies around the Albufera lagoon; the crust "
          "stuck to the pan, the socarrat, is the prize.",
          wiki="Paella"),
    ]),

    # ══ PORTUGAL ══════════════════════════════════════════════════════════
    ("PT", [
        d("Bacalhau à Brás",
          "Salt cod soaked back to life and shredded, tossed with matchstick fried "
          "potatoes and softened onion, then bound with beaten egg and scattered with "
          "black olives.",
          "One of a claimed several hundred ways with salt cod, the fish this country "
          "has been drying and trading since the age of the cod banks.",
          wiki="Bacalhau à Brás"),
        d("Francesinha",
          "A sandwich stacked with steak, sausage and ham, blanketed in melted cheese "
          "and flooded with a hot beer-and-tomato sauce, with a fried egg and chips.",
          "Invented in Porto in the 1950s by a returning emigrant trying to rebuild the "
          "croque-monsieur he had eaten in France.",
          wiki="Francesinha"),
        d("Caldo verde",
          "A soup of pureed potato and onion carrying paper-thin shreds of dark green "
          "cabbage and a slice of smoked sausage, finished with olive oil.",
          "From the Minho in the north and served at every festival and wedding; the "
          "cabbage is sliced so finely it is almost thread.",
          wiki="Caldo verde"),
        d("Pastel de nata",
          "A small cup of shatteringly flaky laminated pastry filled with cinnamon-"
          "scented egg custard and blistered black on top in a ferociously hot oven.",
          "Made by monks at the Jeronimos monastery in Belem before 1834, using the egg "
          "yolks left over from starching habits with the whites.",
          wiki="Pastel de nata"),
    ]),

    # ══ GERMANY ═══════════════════════════════════════════════════════════
    ("DE", [
        d("Königsberger Klopse",
          "Poached veal meatballs in a pale sauce sharpened with capers and lemon, "
          "served with boiled potatoes and beetroot.",
          "Named for a city that is now Kaliningrad; the East refused the name for "
          "decades and sold them as 'meatballs in caper sauce'.",
          wiki="Königsberger Klopse"),
        d("Maultaschen",
          "Large pasta pockets stuffed with minced meat, spinach, breadcrumbs and "
          "onion, either floated in clear broth or sliced and fried.",
          "A Swabian speciality nicknamed 'God's little cheaters' -- monks are said to "
          "have hidden meat inside the pasta during Lent.",
          wiki="Maultasche"),
        d("Sauerbraten",
          "Beef marinated for days in vinegar and spices, then braised and served in a "
          "sweet-sour gravy thickened with crushed spice biscuits and raisins.",
          "The Rhineland version uses gingerbread in the sauce; the long acid soak was "
          "originally a way of preserving the meat.",
          wiki="Sauerbraten"),
        d("Spätzle",
          "Soft, irregular egg noodles scraped from a wet dough straight into boiling "
          "water, then tossed in butter and often layered with grated cheese and fried "
          "onion.",
          "The staple starch of Swabia, protected as a regional speciality, and "
          "traditionally scraped off a wooden board with a knife.",
          wiki="Spätzle"),
        d("Currywurst",
          "A fried pork sausage cut into coins and buried under a spiced tomato sauce "
          "dusted with curry powder, eaten from a paper tray with a tiny fork.",
          "Invented in Berlin in 1949 by Herta Heuwer, who got the curry powder and "
          "ketchup from British soldiers.",
          wiki="Currywurst"),
    ]),

    # ══ AUSTRIA ═══════════════════════════════════════════════════════════
    ("AT", [
        d("Tafelspitz",
          "Beef rump simmered slowly in broth with root vegetables and served in its "
          "own soup, with an apple-horseradish sauce and a chive cream alongside.",
          "The emperor Franz Joseph is said to have eaten it almost daily; the cut, the "
          "broth and the two sauces are all fixed by tradition.",
          wiki="Tafelspitz"),
        d("Kaiserschmarrn",
          "A thick sweet pancake torn into ragged pieces in the pan as it cooks, "
          "caramelised with sugar and butter and served with plum compote.",
          "A mountain-hut lunch as much as a dessert; the name means 'the emperor's "
          "mess'.",
          wiki="Kaiserschmarrn"),
        d("Sachertorte",
          "A dense, dryish chocolate sponge split and spread with apricot jam under a "
          "hard glossy dark chocolate glaze, served with unsweetened whipped cream.",
          "Created for Prince Metternich's kitchen in 1832; a hotel and a bakery fought "
          "a seven-year court case over who could call theirs the original.",
          wiki="Sachertorte"),
        d("Wiener Schnitzel",
          "A veal escalope beaten paper-thin, floured, egged and crumbed, then fried "
          "in so much fat that the coating puffs away from the meat, served with lemon.",
          "Legally the name applies only to veal; the pork version has to be sold under "
          "a different name.",
          wiki="Wiener schnitzel"),
    ]),

    # ══ SWITZERLAND ═══════════════════════════════════════════════════════
    ("CH", [
        d("Älplermagronen",
          "Macaroni and diced potato boiled in the same pot, layered with melted "
          "mountain cheese and fried onion, and eaten with stewed apple on the side.",
          "Herders' food from the high summer pastures, using the four things a "
          "mountain hut kept: pasta, potato, cheese and cream.",
          wiki="Älplermagronen"),
        d("Raclette",
          "A half-wheel of cheese heated at the cut face and scraped molten onto boiled "
          "potatoes, eaten with pickled onions and gherkins.",
          "A Valais herders' supper; the name comes from the verb for scraping the "
          "melted face off the wheel.",
          wiki="Raclette"),
        d("Rösti",
          "Coarsely grated potato pressed into a pan and fried in butter until it sets "
          "into one solid golden cake, crisp on both sides.",
          "Originally a farmers' breakfast in Bern; the linguistic border between the "
          "German- and French-speaking halves is nicknamed the rosti ditch.",
          wiki="Rösti"),
        d("Fondue",
          "Two cheeses melted with white wine, garlic and a little starch in a communal "
          "pot kept warm over a flame, for dipping cubes of stale bread on long forks.",
          "Promoted hard by a cheese cartel in the 1930s and by the army, which is a "
          "large part of why it became a national symbol.",
          wiki="Fondue"),
    ]),

    # ══ BELGIUM ═══════════════════════════════════════════════════════════
    ("BE", [
        d("Waterzooi",
          "A pale stew of chicken or freshwater fish with julienned root vegetables in "
          "a broth enriched at the end with cream and egg yolk.",
          "Ghent's dish; the fish version came first, and moved to chicken as the "
          "river's fish stocks collapsed.",
          wiki="Waterzooi"),
        d("Carbonnade flamande",
          "Beef braised slowly in dark ale with onions, a spoon of brown sugar and a "
          "slice of mustard-spread bread stirred in at the end to thicken it.",
          "The beer does what wine does further south, and the mustardy bread is the "
          "traditional thickener instead of flour.",
          wiki="Carbonade flamande", wikias="Flemish stew"),
        d("Gaufre de Liège",
          "A dense, chewy yeasted waffle studded with pearl sugar that melts and "
          "caramelises against the hot iron, eaten warm in the hand.",
          "Heavier and sweeter than the light rectangular waffle from Brussels, and "
          "sold from vans and street stands rather than plated.",
          wiki="Liège waffle"),
        d("Moules-frites",
          "Mussels steamed open in a covered pot with celery, onion and white wine or "
          "beer, tipped out with a cone of twice-fried potatoes.",
          "Effectively the national dish; the chips are fried twice, in beef fat, which "
          "is the whole argument for where they were invented.",
          wiki="Moules-frites"),
    ]),

    # ══ NETHERLANDS ═══════════════════════════════════════════════════════
    ("NL", [
        d("Haring",
          "Raw young herring cured briefly in light brine, served with chopped raw "
          "onion and pickles and eaten from a stall by holding it up by the tail.",
          "The first barrel of the new season's catch is auctioned for charity; the "
          "enzymes in the fish's own pancreas do the curing.",
          wiki="Soused herring", wikias="Soused herring"),
        d("Stamppot",
          "Potatoes mashed together with kale, endive or sauerkraut and served with a "
          "smoked sausage laid on top and a well of gravy in the middle.",
          "Winter food, and the reason a specific curly kale variety is grown here; it "
          "is supposed to be picked after the first frost.",
          wiki="Stamppot"),
        d("Bitterballen",
          "Crumbed, deep-fried spheres of a chilled beef ragout that turn molten inside, "
          "eaten with mustard alongside a beer.",
          "The standard bar snack, served in a basket with a small bowl of mustard; "
          "biting one straight from the fryer is a rite of passage.",
          wiki="Bitterballen"),
        d("Stroopwafel",
          "Two wafer-thin waffle discs sliced apart and glued back together with a "
          "caramel syrup, meant to be warmed over the mouth of a hot drink.",
          "Invented in Gouda around 1800 from bakery offcuts and syrup; the market "
          "version is cut from a hot iron and filled while still soft.",
          wiki="Stroopwafel"),
    ]),

    # ══ DENMARK ═══════════════════════════════════════════════════════════
    ("DK", [
        d("Stegt flæsk med persillesovs",
          "Thick slices of pork belly fried until the fat crisps, served with boiled "
          "potatoes and a white sauce heavy with chopped parsley.",
          "Voted the national dish in a public poll in 2014, beating a long list of "
          "more elegant candidates.",
          wiki="Stegt flæsk"),
        d("Rødgrød med fløde",
          "A pudding of red summer berries cooked with sugar and thickened with starch "
          "into a wobble, served cold under a pour of cream.",
          "Its name is the classic pronunciation test for foreigners -- a string of "
          "soft d's that almost nobody gets right.",
          wiki="Rødgrød"),
        d("Frikadeller",
          "Flat pan-fried patties of minced pork and veal bound with egg, flour, milk "
          "and grated onion, served with potatoes and pickled red cabbage.",
          "Weeknight food, shaped with a spoon rather than by hand, and eaten cold on "
          "rye bread the next day.",
          wiki="Frikadeller", wikias="Frikadelle"),
        d("Smørrebrød",
          "A single slice of dense sour rye bread buttered and built up with cured "
          "fish or cold meat and an elaborate garnish, eaten with a knife and fork.",
          "An open sandwich with rules: there is a correct order to eat them in, and "
          "herring comes first.",
          wiki="Smørrebrød"),
    ]),

    # ══ SWEDEN ════════════════════════════════════════════════════════════
    ("SE", [
        d("Surströmming",
          "Baltic herring fermented in the tin until the can bulges, opened outdoors "
          "and eaten in thin flatbread with almond potato and onion.",
          "Fermented since at least the 16th century as a way of preserving fish with "
          "very little salt, which was expensive and taxed.",
          wiki="Surströmming"),
        d("Toast Skagen",
          "Chopped prawns folded through mayonnaise, dill and a little mustard, piled "
          "on fried bread and topped with roe.",
          "Invented by restaurateur Tore Wretman in the 1950s and named after a Danish "
          "fishing port, which has never stopped anyone claiming it.",
          wiki="Toast Skagen"),
        d("Gravlax",
          "Salmon buried for a couple of days in salt, sugar and dill, then sliced thin "
          "and served with a sweet mustard-and-dill sauce.",
          "The name means 'buried salmon' -- it really was buried in the sand above the "
          "tideline to ferment before curing replaced that.",
          wiki="Gravlax"),
        d("Köttbullar",
          "Small meatballs of minced pork and beef bound with milk-soaked breadcrumb "
          "and grated onion, fried and served with cream gravy, potatoes and a tart "
          "red berry jam.",
          "King Charles XII is credited with bringing the idea back from Constantinople "
          "in the 18th century; the lingonberry is non-negotiable.",
          commons="File:Köttbullar och potatismos från Cronwalls gatukök i Falköping 8579.jpg"),
    ]),

    # ══ NORWAY ════════════════════════════════════════════════════════════
    ("NO", [
        d("Lutefisk",
          "Dried whitefish soaked in lye until it swells into a translucent jelly, then "
          "rinsed for days, baked and served with bacon, peas and potato.",
          "A Christmas dish of the Lutheran west coast; the lye has to be washed out "
          "completely or the fish is inedible.",
          wiki="Lutefisk"),
        d("Lefse",
          "A soft, very thin potato flatbread cooked on a dry griddle and rolled up "
          "with butter, sugar and cinnamon.",
          "Rolled with a grooved pin and turned with a flat stick; every valley has its "
          "own thickness and sweetening.",
          wiki="Lefse"),
        d("Fårikål",
          "Mutton on the bone layered with whole wedges of cabbage and black "
          "peppercorns and simmered for hours with almost nothing else.",
          "Has its own national day on the last Thursday in September, and four "
          "ingredients that a 1970s campaign tried and failed to change.",
          wiki="Fårikål"),
        d("Brunost",
          "A caramel-brown cheese made by boiling whey down until the milk sugars "
          "caramelise, sliced paper-thin with a plane onto bread or waffles.",
          "Not really a cheese at all but concentrated whey; a lorry-load of it once "
          "burned for four days inside a tunnel.",
          wiki="Brunost"),
    ]),

    # ══ FINLAND ═══════════════════════════════════════════════════════════
    ("FI", [
        d("Kalakukko",
          "Small freshwater fish and fatty pork sealed inside a rye loaf and baked for "
          "hours until the bones soften and the crust turns waterproof.",
          "A Savonian dish from around Kuopio with protected status; the sealed rye "
          "crust was the lunchbox before lunchboxes.",
          wiki="Kalakukko"),
        d("Leipäjuusto",
          "A squeaky fresh curd cheese pressed into a flat disc and grilled until it is "
          "brown-spotted, served warm with cloudberry jam.",
          "Northern 'bread cheese', once made with the first milk after a cow calved; "
          "it squeaks against the teeth.",
          wiki="Leipäjuusto", wikias="Bread cheese"),
        d("Karjalanpiirakka",
          "An open oval pastry with a thin rye crust crimped around a filling of rice "
          "porridge, eaten spread with a mash of butter and chopped boiled egg.",
          "From Karelia, carried west by evacuees after the war; the butter-and-egg "
          "spread on top is munavoi.",
          wiki="Karelian pasty"),
        d("Salmiakki",
          "A hard black sweet flavoured with ammonium chloride, tasting salty and "
          "sharply bitter rather than sugary.",
          "A national addiction that flavours everything from ice cream to vodka, and "
          "that almost no visitor enjoys on the first try.",
          wiki="Salty liquorice", wikias="Salty liquorice"),
    ]),

    # ══ ICELAND ═══════════════════════════════════════════════════════════
    ("IS", [
        d("Hákarl",
          "Shark buried and pressed for weeks and then hung to dry for months until the "
          "ammonia in its flesh mellows, cut into cubes and eaten with a shot of "
          "caraway spirit.",
          "The shark is poisonous fresh -- it has no kidneys and excretes through its "
          "skin -- so fermenting it was the only way to eat it.",
          wiki="Hákarl"),
        d("Plokkfiskur",
          "Boiled white fish flaked into mashed potato with onion and a white sauce, "
          "browned in the oven and eaten with dark rye bread and butter.",
          "Leftovers food that became a canteen staple; the rye bread it is eaten with "
          "is steam-baked in the ground near hot springs.",
          commons="File:Plokkfiskur.jpg"),
        d("Skyr",
          "A very thick, almost fat-free strained fresh cheese set with rennet and "
          "eaten like a yoghurt with milk and berries.",
          "Made here since settlement over a thousand years ago; technically a cheese, "
          "which is why it survived a dairy-free Viking sea voyage.",
          wiki="Skyr"),
        d("Pylsur",
          "A hot dog of lamb, pork and beef in a small bun with both raw and crisp "
          "fried onion, ketchup, a sweet brown mustard and a creamy remoulade.",
          "The lamb is the giveaway; one stand in the capital has been selling them "
          "since 1937 and is the closest thing to a national restaurant.",
          commons="File:Hot dog from Bæjarins Beztu Pylsur.jpg"),
    ]),

    # ══ IRELAND ═══════════════════════════════════════════════════════════
    ("IE", [
        d("Coddle",
          "Sausages and rashers of bacon layered with sliced potato and onion and "
          "simmered slowly in stock until everything is pale and soft.",
          "A Dublin dish built to use up whatever was left before the Friday fast; "
          "browning the meat first is considered cheating.",
          wiki="Coddle"),
        d("Boxty",
          "A potato pancake made with both grated raw and mashed cooked potato bound "
          "with flour and buttermilk, fried on a griddle.",
          "From the northern midlands, with its own rhyme: if you can't make boxty you "
          "will never get a man.",
          wiki="Boxty"),
        d("Colcannon",
          "Mashed potato beaten with butter and milk and shot through with finely "
          "shredded cooked kale or cabbage, with a well of melted butter in the middle.",
          "Eaten at Halloween with charms hidden inside -- a ring for marriage, a coin "
          "for wealth.",
          wiki="Colcannon"),
        d("Soda bread",
          "A dense round loaf raised with bicarbonate of soda and buttermilk instead of "
          "yeast, scored with a deep cross before it goes into the oven.",
          "The soft local wheat will not make a good yeasted loaf, which is why "
          "chemical raising took hold here in the 1830s.",
          wiki="Soda bread"),
        d("Irish stew",
          "Mutton or lamb on the bone layered with potato and onion and simmered in "
          "water until the top layer of potato breaks down and thickens it.",
          "Carrots and barley are late arrivals and still contested; the original was "
          "mutton, potato, onion and water, and nothing else.",
          wiki="Irish stew"),
    ]),

    # ══ POLAND ════════════════════════════════════════════════════════════
    ("PL", [
        d("Żurek",
          "A sour soup based on a fermented rye-flour starter, with white sausage, "
          "boiled egg and marjoram, sometimes served inside a hollowed loaf.",
          "The Easter breakfast soup; the sour starter is left to ferment for days and "
          "sold in bottles in every shop before the holiday.",
          commons="File:Żurek w chlebku.JPG"),
        d("Bigos",
          "Sauerkraut and fresh cabbage stewed for days with several meats, dried wild "
          "mushrooms and prunes, improving each time it is cooled and reheated.",
          "The hunter's stew of the old nobility, taken on hunts in a barrel and "
          "reheated over a fire; it is supposed to be better on day three.",
          wiki="Bigos"),
        d("Gołąbki",
          "Blanched cabbage leaves rolled around minced meat and rice into parcels and "
          "baked under a tomato or mushroom sauce.",
          "The name means 'little pigeons', and the parcels turn up right across the "
          "region -- but this is where they are a Sunday centrepiece.",
          mdb="Braised stuffed cabbage"),
        d("Pierogi",
          "Half-moon dumplings of soft dough filled with curd cheese and potato, or "
          "mushroom and sauerkraut, boiled and then fried in butter with onion.",
          "The cheese-and-potato filling is called ruskie, which refers to a historic "
          "region and not to Russia.",
          wiki="Pierogi"),
    ]),

    # ══ CZECHIA ═══════════════════════════════════════════════════════════
    ("CZ", [
        d("Kulajda",
          "A creamy dill and wild mushroom soup soured with vinegar, with diced potato "
          "and a poached egg floating in it.",
          "A Bohemian country soup; the combination of dill, sour cream and vinegar is "
          "the local flavour signature.",
          wiki="Kulajda"),
        d("Svíčková",
          "Larded beef sirloin roasted and served in a smooth sauce of pureed root "
          "vegetables and cream, with sliced bread dumplings, cranberry and lemon.",
          "The Sunday dish, and the reason a whole genre of bread dumplings exists to "
          "mop up the sauce.",
          wiki="Svíčková"),
        d("Smažený sýr",
          "A thick slab of semi-hard cheese breaded and deep-fried until it just starts "
          "to run, served with tartare sauce and chips.",
          "Communist-era pub food that never left; sold from hatches and eaten in a "
          "bread roll.",
          wiki="Smažený sýr"),
        d("Vepřo knedlo zelo",
          "Roast pork with slices of steamed bread dumpling cut off a log with thread, "
          "and stewed cabbage on the side.",
          "The three-word national dish -- pork, dumpling, cabbage -- and the standard "
          "measure of a pub kitchen.",
          wiki="Vepřo knedlo zelo"),
    ]),

    # ══ HUNGARY ═══════════════════════════════════════════════════════════
    ("HU", [
        d("Halászlé",
          "A fiery river-fish soup coloured deep red with sweet ground pepper, cooked "
          "in a kettle hung over an open fire.",
          "A fishermen's soup of the Danube and Tisza; Szeged strains it and Baja "
          "serves it over noodles, and the two do not agree.",
          wiki="Fisherman's soup", wikias="Fisherman's soup"),
        d("Lecsó",
          "Sliced sweet yellow peppers and tomato cooked down slowly in lard with onion "
          "and ground red pepper, often with sausage or a beaten egg stirred in.",
          "Late-summer food made when the pepper glut arrives, and preserved in jars "
          "for winter.",
          wiki="Lecsó"),
        d("Dobos torte",
          "A cake of five thin sponge layers with chocolate buttercream, capped with a "
          "disc of hard caramel scored into wedges.",
          "Created by Jozsef Dobos in 1885; the caramel top was there to stop the cake "
          "drying out before refrigeration existed.",
          wiki="Dobos torte"),
        d("Gulyás",
          "A soup of beef and potato in a thin broth loaded with sweet ground red "
          "pepper, caraway and onion, cooked in a kettle over a fire.",
          "A herdsmen's soup -- the word means 'cowherd' -- and abroad it got thickened "
          "into a stew it never was at home.",
          wiki="Goulash"),
    ]),

    # ══ GREECE ════════════════════════════════════════════════════════════
    ("GR", [
        d("Fasolada",
          "A soup-stew of white beans with carrot, celery and tomato and a very large "
          "quantity of olive oil, eaten with olives and bread.",
          "Often called the real national dish rather than the restaurant ones -- "
          "cheap, meatless and eaten through the Orthodox fasts.",
          wiki="Fasolada"),
        d("Pastitsio",
          "Long tubular pasta layered with minced meat spiced with cinnamon and clove, "
          "under a thick baked white sauce.",
          "The cinnamon in the meat is the tell; it comes from the same Ottoman-era "
          "spicing as the aubergine bake it sits beside on every menu.",
          wiki="Pastitsio"),
        d("Spanakopita",
          "Layers of paper-thin pastry brushed with oil around a filling of spinach, "
          "wild greens, dill and salty white cheese, baked in a tray and cut in squares.",
          "One of a whole family of savoury pies; the filling changes with whatever "
          "greens are growing on the hillside.",
          wiki="Spanakopita", wikias="Savory spinach pie"),
        d("Moussaka",
          "Layers of fried aubergine and spiced minced lamb under a thick white sauce "
          "that puffs and browns in the oven.",
          "The custard-like top layer was added by Nikolaos Tselementes in the 1920s, "
          "which is why older versions elsewhere in the region have none.",
          wiki="Moussaka"),
        d("Souvlaki",
          "Small cubes of pork grilled on wooden skewers over coals and wrapped in "
          "flatbread with tomato, onion, chips and a thick garlic-yoghurt sauce.",
          "Skewered meat cooked exactly this way has been dug up here from the Bronze "
          "Age -- portable clay firedogs and all.",
          wiki="Souvlaki"),
    ]),

    # ══ ROMANIA ═══════════════════════════════════════════════════════════
    ("RO", [
        d("Ciorbă de burtă",
          "A sour tripe soup soured with fermented wheat bran and thickened at the end "
          "with egg yolk and soured cream, served with crushed garlic and hot peppers.",
          "The classic morning-after soup, ordered at dawn; the sour agent is bors, a "
          "fermented bran liquid kept going in a jar.",
          commons="File:Ciorba de burta 2.jpg"),
        d("Papanași",
          "Fried rings of sweet curd-cheese dough with a small dough ball perched on "
          "top, buried under soured cream and sour cherry jam.",
          "Every restaurant's dessert, and the small ball on top is what tells you it "
          "was made properly rather than bought in.",
          wiki="Papanași"),
        d("Sarmale",
          "Pickled cabbage leaves rolled around minced pork and rice and stewed for "
          "hours with smoked pork and tomato, eaten with soured cream and a stiff "
          "cornmeal porridge.",
          "The Christmas and wedding dish; the cabbage is whole heads soured in brine "
          "in autumn, and the pot is supposed to be reheated at least twice.",
          commons="File:Sarmale with mamaligă.jpg"),
        d("Mămăligă",
          "A stiff cornmeal porridge boiled thick, turned out as a loaf and cut with a "
          "thread, eaten with soured cream and salty sheep's cheese.",
          "Corn arrived in the 17th century and displaced millet; this was the peasant "
          "staple that replaced bread for centuries.",
          wiki="Mămăligă"),
        d("Mititei",
          "Skinless grilled sausages of minced beef and lamb with garlic, stock and "
          "bicarbonate, grilled over coals and eaten with mustard and bread.",
          "The name means 'little ones'; the bicarbonate and the stock are what make "
          "them springy rather than dense.",
          wiki="Mititei"),
    ]),

    # ══ BULGARIA ══════════════════════════════════════════════════════════
    ("BG", [
        d("Lyutenitsa",
          "A thick relish of roasted red peppers and tomato cooked down for hours with "
          "aubergine, carrot and garlic, then jarred for the winter and spread on bread.",
          "Made outdoors in huge copper pans every autumn; every family swears their "
          "grandmother's ratio of pepper to tomato is the correct one.",
          wiki="Lyutenitsa"),
        d("Tarator",
          "A cold soup of yoghurt let down with water, with diced cucumber, garlic, "
          "dill, crushed walnuts and oil, served with ice in it.",
          "Summer food, drunk as much as eaten; the yoghurt's bacterium was first "
          "isolated here in 1905 and named after the country.",
          commons="File:Tarator (Bulgarian cold soup).jpg"),
        d("Banitsa",
          "Sheets of thin pastry layered with crumbled brined white cheese beaten into "
          "egg and yoghurt, coiled into a spiral and baked.",
          "For New Year, fortunes on slips of paper are baked inside, along with a "
          "coin for whoever gets the lucky slice.",
          wiki="Banitsa"),
        d("Shopska salad",
          "Chopped tomato, cucumber, raw onion and roasted pepper under a heavy blanket "
          "of grated white brined cheese.",
          "Devised in the 1960s by the state tourism agency, in the colours of the "
          "national flag -- and now genuinely ubiquitous.",
          wiki="Shopska salad"),
    ]),

    # ══ SERBIA ════════════════════════════════════════════════════════════
    ("RS", [
        d("Karađorđeva šnicla",
          "A veal or pork escalope beaten flat, rolled around thick soured cream "
          "cheese, breaded and deep-fried, served with tartare sauce.",
          "Invented in a Belgrade hotel in 1956 for a visiting delegation, and "
          "nicknamed the maidens' dream for reasons of shape.",
          wiki="Karađorđeva šnicla"),
        d("Gibanica",
          "A pie of many thin pastry sheets soaked in beaten egg, soured cream and "
          "salty fresh cheese, baked until it puffs and sets.",
          "The festive pie, and the standard test of a cook: too little egg and it is "
          "dry, too much and it never sets.",
          wiki="Gibanica"),
        d("Ajvar",
          "A relish of roasted red peppers peeled by hand and cooked down slowly in oil "
          "until it darkens and thickens enough to stand on a spoon.",
          "Made communally in autumn from the long red pepper harvest and jarred for "
          "the year; the whole street smells of roasting peppers.",
          wiki="Ajvar"),
        d("Pljeskavica",
          "A large, flat patty of mixed minced meats grilled over coals and served in a "
          "soft flatbread with raw onion, soured cream cheese and pepper relish.",
          "The grill-house standard, sized up to a dinner plate in Leskovac, which "
          "holds a festival for it every autumn.",
          wiki="Pljeskavica"),
    ]),

    # ══ CROATIA ═══════════════════════════════════════════════════════════
    ("HR", [
        d("Štrukli",
          "Sheets of thin stretched dough rolled or folded around fresh curd cheese and "
          "soured cream, then either boiled or baked in more cream.",
          "From the Zagorje hills north of Zagreb, protected as intangible heritage, "
          "and served as a starter, a main or a dessert.",
          wiki="Štrukli", wikias="Zagorski štrukli"),
        d("Pašticada",
          "Beef larded with bacon, marinated for a day in vinegar and wine, then braised "
          "for hours with prunes and dried figs and served with gnocchi.",
          "Dalmatia's wedding dish; the sweetness comes from dried fruit and prošek "
          "wine, and it takes two days from start to table.",
          wiki="Pašticada"),
        d("Crni rižot",
          "A risotto stained black with cuttlefish ink, cooked with squid, garlic, "
          "parsley and a little red wine.",
          "An Adriatic coastal dish; the ink sac is squeezed in at the end, and it "
          "stains everyone's teeth at the table.",
          commons="File:Black Risotto.jpg"),
        d("Peka",
          "Meat and potatoes cooked under a bell-shaped iron lid heaped with embers, so "
          "the heat comes from above and below at once.",
          "The lid is the dish: a cast-iron bell buried in the coals of a stone "
          "hearth, ordered hours ahead at coastal restaurants.",
          mdb="Croatian lamb peka"),
    ]),

    # ══ BOSNIA AND HERZEGOVINA ════════════════════════════════════════════
    ("BA", [
        d("Begova čorba",
          "A thick, pale soup of chicken and okra bound with a roux and soured cream, "
          "barely spiced beyond pepper.",
          "The 'bey's soup', from the Ottoman gentry of Sarajevo -- rich, white and "
          "deliberately unspiced to show off the meat.",
          wiki="Begova čorba", wikias="Bey's soup"),
        d("Bosanski lonac",
          "Layers of meat and whole vegetables stacked upright in a tall earthenware pot "
          "with a little water and cooked for hours without ever being stirred.",
          "The pot's shape does the work; stirring it is considered to ruin it, and it "
          "was traditionally left at the baker's oven all day.",
          wiki="Bosanski lonac", wikias="Bosnian pot"),
        d("Burek",
          "A rope of hand-stretched pastry filled with minced beef and onion, coiled "
          "into a spiral and baked under a metal lid covered in embers.",
          "Here the word means the meat one specifically; with cheese, spinach or "
          "potato it gets a different name entirely.",
          mdb="Burek"),
        d("Ćevapi",
          "Small skinless fingers of minced beef and lamb grilled over charcoal and "
          "served ten at a time in a soft flatbread with raw onion and soured cream.",
          "Sarajevo serves them in a puffy somun bread with kajmak; the count and the "
          "bread are both regional signatures.",
          wiki="Ćevapi"),
    ]),

    # ══ ALBANIA ═══════════════════════════════════════════════════════════
    ("AL", [
        d("Fërgesë",
          "Peppers and tomato cooked down with garlic and folded through crumbled fresh "
          "curd cheese, then baked in an earthenware dish until it sets.",
          "A Tirana dish, sometimes made with liver instead of peppers, and served "
          "bubbling in the small clay dish it baked in.",
          commons="File:Fërgesë me speca dhe gjizë.jpg"),
        d("Tavë kosi",
          "Lamb and rice baked under a thick custard of yoghurt and egg until the top "
          "sets and browns.",
          "Associated with Elbasan, and effectively the national dish -- yoghurt used "
          "as a baking custard rather than a sauce.",
          wiki="Tavë kosi"),
        d("Byrek",
          "A pie of hand-stretched pastry layered with spinach, curd cheese or minced "
          "meat, baked in a round tray and cut into wedges.",
          "Sold by the slice from bakeries all day; the dough is stretched over the "
          "backs of the hands until it is translucent.",
          commons="File:Byrek me spinaq.jpg"),
        d("Petulla",
          "Small pieces of yeasted dough fried until they puff, eaten hot with jam, "
          "honey or salty white cheese.",
          "Breakfast and street food, and traditionally the first thing cooked in a "
          "new house to bring luck.",
          commons="File:Petulla dhe reçel.jpg"),
    ]),

    # ══ UKRAINE ═══════════════════════════════════════════════════════════
    ("UA", [
        d("Salo",
          "Slabs of cured pork back fat, salted with garlic and pepper, sliced thin and "
          "eaten cold on dark bread with a shot of spirits.",
          "A national symbol and a running joke about itself; it is also whipped with "
          "garlic into a spread, and occasionally dipped in chocolate.",
          wiki="Salo (food)"),
        d("Deruny",
          "Pancakes of finely grated raw potato with onion and egg, fried until the "
          "edges go lacy and crisp, served with soured cream.",
          "Everyday food across the north, with a whole festival devoted to them in "
          "Korosten every autumn.",
          commons="File:Deruny.jpg"),
        d("Varenyky",
          "Boiled dumplings of thin dough filled with potato, curd cheese, cabbage or "
          "sour cherries, served with fried onion or soured cream.",
          "The sour cherry filling in summer is the one that marks them out; they are "
          "pinched shut with a rope-like edge.",
          wiki="Varenyky"),
        d("Borsch",
          "A deep red beetroot soup with cabbage, root vegetables and meat, soured and "
          "served with soured cream and small garlic rolls.",
          "Listed by UNESCO in 2022 as intangible cultural heritage in need of urgent "
          "safeguarding; the garlic rolls alongside are pampushky.",
          wiki="Borscht"),
    ]),

    # ══ RUSSIA ════════════════════════════════════════════════════════════
    ("RU", [
        d("Okroshka",
          "A cold summer soup of chopped raw cucumber, radish, boiled egg, potato and "
          "sausage, flooded with a fizzy fermented bread drink or with soured milk.",
          "The bread-drink version divides people from the soured-milk version about as "
          "sharply as anything in the cuisine.",
          wiki="Okroshka"),
        d("Blini",
          "Thin yeast-raised pancakes served in stacks with soured cream, melted butter, "
          "cured fish or caviar.",
          "Eaten by the dozen during Maslenitsa, the pancake week before Lent; the "
          "round golden shape stands for the returning sun.",
          wiki="Blini"),
        d("Pelmeni",
          "Small dumplings of thin unleavened dough around raw minced meat, made in "
          "batches, frozen outdoors and boiled as needed, eaten with soured cream and "
          "vinegar.",
          "A Siberian and Urals invention -- frozen in sacks on the porch and taken on "
          "journeys as a kind of instant meal.",
          wiki="Pelmeni"),
        d("Beef Stroganoff",
          "Strips of beef seared fast and finished in a sauce of soured cream, mustard "
          "and onion, served with fried potato straws.",
          "Named for the Stroganov family in the 19th century; the potato straws, not "
          "rice or pasta, are the original accompaniment.",
          wiki="Beef Stroganoff"),
    ]),

    # ══ SLOVAKIA ══════════════════════════════════════════════════════════
    ("SK", [
        d("Kapustnica",
          "A sour cabbage soup with smoked sausage, dried wild mushrooms and prunes, "
          "sometimes finished with cream.",
          "The Christmas Eve soup, made from sauerkraut soured at home and eaten before "
          "the fish course.",
          commons="File:Kapustnica slovakia.jpg"),
        d("Lokše",
          "Thin flatbreads of mashed potato and flour cooked dry on a griddle, then "
          "brushed with goose fat or spread with ground poppy seed.",
          "Autumn goose-feast food from the west; the potato dough makes them soft and "
          "pliable rather than crisp.",
          wiki="Lokše", wikias="Lokša"),
        d("Bryndzové halušky",
          "Small soft dumplings of grated potato dough boiled and stirred through a "
          "sharp, salty sheep's-milk cheese, then buried under fried bacon.",
          "The national dish, built on bryndza, a soft ewe's cheese with protected "
          "status; there is an annual eating competition for it.",
          wiki="Bryndzové halušky"),
    ]),

    # ══ SLOVENIA ══════════════════════════════════════════════════════════
    ("SI", [
        d("Jota",
          "A thick soup of sauerkraut or soured turnip with beans, potato and smoked "
          "pork, cooked until everything falls apart.",
          "A Karst and coastal dish shared with the neighbouring Italian border towns; "
          "the soured turnip version is the older one.",
          wiki="Jota (food)"),
        d("Štruklji",
          "Rolled parcels of thin dough filled with curd cheese, tarragon or walnuts, "
          "boiled or baked and served either savoury or sweet.",
          "Over a hundred recorded fillings; the tarragon-and-curd version is the one "
          "that says most about where you are.",
          wiki="Štruklji"),
        d("Kranjska klobasa",
          "A coarse pork sausage with bacon and garlic, lightly smoked, poached rather "
          "than fried, and eaten with mustard and grated soured turnip.",
          "Protected by EU designation and defined by law down to the permitted "
          "percentage of bacon and the wooden pin holding the pair together.",
          wiki="Carniolan sausage"),
        d("Potica",
          "A yeasted dough rolled out thin, spread with a ground walnut and honey "
          "filling, coiled up and baked in a fluted ring mould.",
          "The Easter and Christmas cake; the dough has to be rolled thin enough that "
          "the finished spiral shows many distinct turns.",
          wiki="Potica"),
    ]),

    # ══ ESTONIA ═══════════════════════════════════════════════════════════
    ("EE", [
        d("Mulgipuder",
          "Barley and potato boiled and mashed together into a coarse porridge, served "
          "with fried pork belly and onion.",
          "From the Mulgi region in the south, where barley grew better than rye; it "
          "has protected regional status.",
          wiki="Mulgipuder"),
        d("Kama",
          "A ready-milled flour of roasted barley, rye, oats and peas, stirred into "
          "buttermilk or yoghurt until thick and eaten with a spoon.",
          "A pre-industrial travel food -- roasted grain keeps for months and needs "
          "only liquid -- now sold in every supermarket as a dessert base.",
          wiki="Kama (food)"),
        d("Verivorst",
          "Blood sausage stuffed with pearl barley and onion, baked until the skin "
          "splits, and eaten with lingonberry jam.",
          "The Christmas dish, made at the winter slaughter so nothing from the pig "
          "was wasted.",
          wiki="Verivorst"),
        d("Kiluvõileib",
          "An open sandwich of dark sour rye bread with butter, salt-cured sprat "
          "fillets, boiled egg and spring onion.",
          "The sprats come from the Baltic and are cured in a spiced brine; the "
          "sandwich is the standard party snack.",
          commons="File:Kiluvõileib.IMG 4378.JPG"),
    ]),

    # ══ LATVIA ════════════════════════════════════════════════════════════
    ("LV", [
        d("Sklandrausis",
          "An open tart with a rye crust filled with a layer of mashed potato and a "
          "layer of sweetened carrot, spiced with caraway.",
          "A Livonian speciality from the Courland coast, and the country's first food "
          "with EU protected status.",
          wiki="Sklandrausis"),
        d("Pelēkie zirņi ar speķi",
          "Grey field peas boiled until soft and served with fried fatty bacon and "
          "onion, with soured milk to drink.",
          "The winter solstice and Christmas dish; every pea on the plate is supposed "
          "to be eaten or you carry the tears into the new year.",
          commons="File:Grey peas at restaurant Milda in Riga.jpg"),
        d("Rupjmaizes kārtojums",
          "Grated dark sour rye bread crumbs toasted with sugar and layered in a glass "
          "with whipped cream and cranberry or lingonberry jam.",
          "A dessert built entirely around the country's dense sour rye bread, which is "
          "treated with something close to reverence.",
          wiki="Rupjmaizes kārtojums", wikias="Layered rye bread"),
    ]),

    # ══ LITHUANIA ═════════════════════════════════════════════════════════
    ("LT", [
        d("Kibinai",
          "Half-moon pastries with a short, flaky crust filled with chopped mutton and "
          "onion, baked until the pastry lifts away from the filling.",
          "Brought by the Karaim community settled in Trakai since the 14th century, "
          "and now sold along the lakeside there by the bagful.",
          wiki="Kibinai"),
        d("Šakotis",
          "A hollow, spiked, tree-shaped cake built up layer by layer by dripping "
          "batter onto a spit rotating over an open fire.",
          "Baked on a horizontal spit for hours; the spikes are drips of batter frozen "
          "in place by the heat.",
          wiki="Šakotis"),
        d("Cepelinai",
          "Large zeppelin-shaped dumplings of grated raw and boiled potato moulded "
          "around minced meat, boiled, and served under bacon, onion and soured cream.",
          "Named after the airships they resemble; the raw potato has to be squeezed "
          "nearly dry or they disintegrate in the pot.",
          wiki="Cepelinai"),
        d("Šaltibarščiai",
          "A shocking pink cold soup of soured milk and grated cooked beetroot with "
          "cucumber, dill and boiled egg, served with hot boiled potatoes on the side.",
          "Summer food; the colour is entirely natural, and the hot potatoes served "
          "beside the cold soup are compulsory.",
          wiki="Šaltibarščiai", wikias="Cold beet soup"),
    ]),

    # ══ BELARUS ═══════════════════════════════════════════════════════════
    ("BY", [
        d("Machanka",
          "A thick gravy of pork ribs, sausage and onion loosened with soured cream, "
          "served in a bowl for dipping thick pancakes into.",
          "The name comes from the verb 'to dunk' -- the pancakes are the cutlery.",
          commons="File:Machanka.jpg"),
        d("Draniki",
          "Pancakes of finely grated raw potato fried in oil until crisp at the edges "
          "and served with soured cream.",
          "Potatoes arrived in the 18th century and took over completely; there are "
          "hundreds of potato dishes and this is the emblem.",
          commons="File:Dranik-Biełaruś.jpg"),
        d("Babka",
          "A grated-potato pudding baked slowly with bacon, onion and egg until it sets "
          "under a dark crust.",
          "Baked in a heavy dish in a wood oven; the crust is the point, and it is cut "
          "in wedges like a cake.",
          commons="File:Babka Potato Dish-1.jpg"),
    ]),

    # ══ MALTA ═════════════════════════════════════════════════════════════
    ("MT", [
        d("Stuffat tal-fenek",
          "Rabbit marinated overnight in red wine and bay, then browned and stewed "
          "slowly with garlic, tomato and peas.",
          "Eaten as a communal two-course meal -- the pasta is dressed with the "
          "cooking juices first, the rabbit follows -- and it doubled as a symbol of "
          "defiance against a hunting ban imposed by the Knights.",
          commons="File:The national dish of Malta – Stuffat tal-Fenek (rabbit stew).jpg"),
        d("Ftira",
          "A flat ring of sourdough bread split and packed with tuna, capers, olives, "
          "tomato paste, butter beans and oil.",
          "The bread itself is UNESCO-listed; the filled version is the standard "
          "workman's lunch, wrapped in paper.",
          wiki="Ftira"),
        d("Pastizzi",
          "Diamond-shaped parcels of very flaky pastry filled with ricotta or a mushy "
          "pea paste, eaten scalding from a hole-in-the-wall shop.",
          "Sold for small change from pastizzerias; the two fillings are so fixed that "
          "you order simply by saying which.",
          wiki="Pastizz"),
    ]),

    # ══ CYPRUS ════════════════════════════════════════════════════════════
    ("CY", [
        d("Sheftalia",
          "Minced pork and lamb with onion and parsley wrapped in caul fat into small "
          "parcels and grilled over coals until the fat melts away.",
          "The caul membrane bastes the meat as it renders, then crisps -- there is no "
          "skin or casing involved.",
          wiki="Sheftalia"),
        d("Souvla",
          "Large chunks of pork or lamb threaded onto a long metal skewer and turned "
          "slowly over charcoal in an open rotisserie box for hours.",
          "The Sunday and Easter cook-out; the point is the size of the chunks and the "
          "slowness, which separates it from small kebab skewers.",
          wiki="Souvla"),
        d("Kleftiko",
          "Lamb rubbed with lemon, garlic and herbs, sealed into a clay oven and cooked "
          "overnight until it falls off the bone.",
          "The name means 'stolen' -- bandits are said to have sealed the pit so no "
          "smoke escaped to give them away.",
          wiki="Kleftiko"),
        d("Halloumi",
          "A firm, salty cheese of sheep and goat milk folded around mint, which squeaks "
          "against the teeth and holds its shape on a grill.",
          "Cooked in its own whey and folded in half with mint before brining; it has "
          "protected designation of origin status.",
          wiki="Halloumi"),
    ]),

    # ══ CHINA ═════════════════════════════════════════════════════════════
    ("CN", [
        d("Zongzi",
          "Glutinous rice packed around pork belly, salted egg yolk or sweet bean "
          "paste, wrapped tightly in bamboo leaves into a pyramid and boiled for hours.",
          "Eaten at the Dragon Boat Festival, thrown into the river to keep the fish "
          "away from the drowned poet Qu Yuan; the sweet-versus-savoury split runs "
          "north to south.",
          wiki="Zongzi"),
        d("Mapo doufu",
          "Silken bean curd simmered in a fierce red sauce of fermented broad-bean "
          "paste and minced beef, dusted with a ground peppercorn that leaves the mouth "
          "buzzing and numb.",
          "From Chengdu, named after the pockmarked wife of the cook who is said to "
          "have made it; the numbness comes from the local prickly ash.",
          wiki="Mapo doufu", wikias="Mapo tofu"),
        d("Dan dan noodles",
          "Wheat noodles served under a spoonful of chilli oil, sesame paste, preserved "
          "mustard stem and minced pork, tossed together at the table.",
          "Named for the shoulder pole a hawker carried the pots on; the original was "
          "nearly dry, and the soupy version is a later export.",
          wiki="Dan dan noodles", wikias="Dandan noodles"),
        d("Xiaolongbao",
          "Small pleated steamed dumplings holding pork and a set meat jelly that melts "
          "into a mouthful of soup inside the wrapper.",
          "From Nanxiang near Shanghai; the soup gets in as cold aspic, which is the "
          "whole trick, and the pleat count is a point of pride.",
          wiki="Xiaolongbao"),
        d("Peking duck",
          "A duck inflated away from its skin, glazed with malt sugar, air-dried and "
          "roasted until the skin is glassy, then carved and rolled into thin pancakes "
          "with spring onion and sweet bean sauce.",
          "An imperial court dish from the Ming era; restaurants still carve it at the "
          "table and count the slices.",
          wiki="Peking duck"),
    ]),

    # ══ INDONESIA ═════════════════════════════════════════════════════════
    ("ID", [
        d("Rawon",
          "A jet-black beef soup coloured and soured by ground keluak nuts, served with "
          "bean sprouts, salted egg and a chilli relish.",
          "From East Java; the keluak nut is toxic raw and has to be buried and "
          "fermented for weeks before it can be used at all.",
          wiki="Rawon"),
        d("Gado-gado",
          "Blanched vegetables, fried bean curd, fermented soybean cake and boiled egg "
          "under a thick peanut sauce sharpened with tamarind and palm sugar.",
          "The name means 'mix-mix'; the sauce is ground fresh in a stone mortar to "
          "order at street stalls.",
          wiki="Gado-gado"),
        d("Rendang",
          "Beef simmered for hours in coconut milk with lemongrass, galangal, turmeric "
          "leaf and chilli until the liquid dries away and the meat fries in its own "
          "released oil.",
          "A Minangkabau ceremonial dish from West Sumatra; cooking it to dryness was "
          "originally a way to make meat keep for a long journey.",
          wiki="Rendang"),
        d("Satay",
          "Small skewers of marinated chicken or mutton grilled over coconut-shell "
          "charcoal and served with a peanut or sweet soy sauce.",
          "Sold from carts with a hand fan going over the coals; the sweet thick soy "
          "sauce, kecap manis, is the local signature.",
          wiki="Satay"),
        d("Nasi goreng",
          "Rice fried with sweet thick soy sauce, shallot, garlic and a chilli paste, "
          "topped with a fried egg and crisp crackers.",
          "Built to use up yesterday's rice, and named the national dish in a 2018 "
          "government list.",
          wiki="Nasi goreng"),
    ]),

    # ══ MALAYSIA ══════════════════════════════════════════════════════════
    ("MY", [
        d("Asam laksa",
          "A sour fish noodle soup thickened with flaked mackerel and soured with "
          "tamarind, topped with shredded pineapple, mint, raw onion and a spoon of "
          "black shrimp paste.",
          "Penang's version; the shrimp paste stirred in at the end is what separates "
          "it from the creamy coconut laksas further south.",
          commons="File:Asam Laksa.jpg"),
        d("Char kway teow",
          "Flat rice noodles fried over a roaring flame with prawns, cockles, egg, "
          "chives, bean sprouts and dark soy until they pick up a smoky char.",
          "The prized quality is wok hei, the 'breath of the wok' -- a smokiness you "
          "only get from a burner hot enough to be dangerous.",
          wiki="Char kway teow"),
        d("Roti canai",
          "A flatbread of enriched dough slapped and spun until translucent, folded "
          "into layers and griddled, served with a lentil or fish curry to dip.",
          "Brought by South Indian Muslim migrants; the spinning is a piece of theatre "
          "performed at the front of the shop.",
          wiki="Roti canai"),
        d("Nasi lemak",
          "Rice steamed in coconut milk with a pandan leaf, served with a sweet-hot "
          "chilli relish, fried anchovies, peanuts, cucumber and boiled egg.",
          "Breakfast wrapped in a banana-leaf parcel; effectively the national dish, "
          "and the relish is what people judge it on.",
          mdb="Nasi lemak"),
    ]),

    # ══ SINGAPORE ═════════════════════════════════════════════════════════
    ("SG", [
        d("Bak kut teh",
          "Pork ribs simmered in a broth loaded with white pepper and whole garlic, "
          "served with dough fritters, rice and dark soy for dipping.",
          "A dockworkers' breakfast; the peppery clear version here contrasts with the "
          "darker herbal one across the causeway.",
          wiki="Bak kut teh"),
        d("Kaya toast",
          "Thin toast with a cold slab of butter and a jam of coconut, egg and pandan, "
          "served with two soft-boiled eggs and dark soy sauce.",
          "The standard coffee-shop breakfast; the eggs are cracked into a saucer, "
          "seasoned with soy and white pepper, and drunk.",
          wiki="Kaya toast"),
        d("Chilli crab",
          "Whole crab stir-fried in a thick sweet-savoury tomato and chilli gravy "
          "loosened with beaten egg, mopped up with fried buns.",
          "Invented in the 1950s from a pushcart on the East Coast; the fried mantou "
          "buns exist purely to get the gravy off the plate.",
          wiki="Chilli crab"),
        d("Hainanese chicken rice",
          "A whole chicken poached gently and plunged into ice so the skin sets to a "
          "jelly, served with rice cooked in the poaching fat and a ginger-chilli "
          "sauce.",
          "Adapted from a Wenchang dish by migrants; the rice, not the bird, is what "
          "separates a good stall from a bad one.",
          wiki="Hainanese chicken rice"),
    ]),

    # ══ PHILIPPINES ═══════════════════════════════════════════════════════
    ("PH", [
        d("Kare-kare",
          "Oxtail and tripe stewed in a thick sauce of ground peanuts and toasted rice, "
          "coloured orange with annatto, served with a pungent fermented shrimp paste "
          "on the side.",
          "The salty shrimp paste is not optional -- the stew itself is deliberately "
          "bland so that you season each mouthful yourself.",
          wiki="Kare-kare"),
        d("Sinigang",
          "A clear sour soup soured with tamarind or unripe fruit, with pork or prawns, "
          "water spinach, radish and long beans.",
          "The souring agent changes with what is ripe -- tamarind, guava, calamansi, "
          "even unripe mango -- and each version has its partisans.",
          wiki="Sinigang"),
        d("Halo-halo",
          "Shaved ice layered over sweetened beans, jellies and preserved fruit, "
          "flooded with evaporated milk and topped with purple yam and ice cream.",
          "The name means 'mix-mix'; it descends from a Japanese shaved-ice dessert "
          "brought over before the war.",
          wiki="Halo-halo"),
        d("Lechon",
          "A whole pig skewered on a bamboo pole and turned over coals for hours until "
          "the skin turns to glass and the meat falls apart.",
          "The centre of every fiesta; Cebu's version is stuffed with lemongrass and "
          "spring onion and needs no sauce at all.",
          commons="File:Lechon sa Cebu.jpg"),
        d("Adobo",
          "Meat braised in vinegar, soy sauce, crushed garlic, bay leaf and whole black "
          "peppercorns until the sauce reduces and the fat begins to fry.",
          "The vinegar braise predates the Spanish, who gave it the name; every family "
          "insists their ratio is the correct one.",
          wiki="Philippine adobo"),
    ]),

    # ══ MYANMAR ═══════════════════════════════════════════════════════════
    ("MM", [
        d("Lahpet thoke",
          "Fermented tea leaves tossed with fried broad beans, peanuts, sesame seeds, "
          "garlic, tomato and shredded cabbage into a crunchy, bitter salad.",
          "One of the very few cuisines that eats tea rather than drinking it; the "
          "leaves are pressed and fermented underground.",
          wiki="Lahpet"),
        d("Shan noodles",
          "Flat rice noodles with a marinated tomato and chicken or pork sauce, "
          "pickled mustard greens and crushed peanuts, served wet or dry.",
          "From the Shan hills in the east, and now the standard breakfast noodle in "
          "the cities.",
          commons="File:Shan Noodle.jpg"),
        d("Mohinga",
          "A catfish and lemongrass broth thickened with toasted rice and chickpea "
          "flour, poured over thin rice noodles and topped with crisp fritters, "
          "coriander and boiled egg.",
          "The national breakfast, sold from shoulder-pole vendors from dawn; the "
          "broth is thickened with banana stem as well as rice.",
          wiki="Mohinga"),
    ]),

    # ══ CAMBODIA ══════════════════════════════════════════════════════════
    ("KH", [
        d("Nom banh chok",
          "Fermented rice noodles served cold under a green fish gravy of lemongrass, "
          "turmeric and kaffir lime root, piled with raw banana flower, cucumber and "
          "long beans.",
          "Sold from baskets carried on a shoulder pole in the morning; the noodles are "
          "pressed by hand from fermented rice dough.",
          wiki="Nom banh chok", wikias="Num banhchok"),
        d("Amok trey",
          "Fish fillets folded through a coconut curry paste of lemongrass, galangal "
          "and turmeric, then steamed in a banana-leaf cup until it sets like a savoury "
          "custard.",
          "The custard texture comes from egg beaten into the coconut cream; it is "
          "steamed, never simmered, which is what distinguishes it from a curry.",
          wiki="Amok trey", wikias="Fish amok"),
        d("Kuy teav",
          "A clear pork-bone breakfast noodle soup with rice noodles, minced pork, "
          "fried garlic, bean sprouts and a squeeze of lime.",
          "Eaten before work from roadside stalls; the broth is simmered overnight and "
          "kept deliberately clear.",
          wiki="Kuy teav", wikias="Kuyteav"),
        d("Lok lak",
          "Cubes of beef seared hard and piled over lettuce and tomato with a dipping "
          "sauce of lime juice, black pepper and salt, topped with a fried egg.",
          "The lime-and-pepper dipping sauce is the local signature, and the fried egg "
          "on top is effectively compulsory.",
          commons="File:Cambodian Lok Lak.jpg"),
    ]),

    # ══ LAOS ══════════════════════════════════════════════════════════════
    ("LA", [
        d("Or lam",
          "A thick stew of buffalo or beef with aubergine, long beans and mushrooms, "
          "given a numbing peppery heat by a length of chewed woody bark.",
          "A Luang Prabang dish; the sakhan wood vine is simmered whole in the pot to "
          "release its tingle, then fished back out.",
          wiki="Or lam"),
        d("Khao poon",
          "Round rice noodles in a coconut and chilli broth with shredded chicken or "
          "fish, herbs and shaved banana blossom.",
          "The dish served at weddings, funerals and festivals -- cooked in a vat and "
          "assembled by each guest from a table of toppings.",
          wiki="Khao poon"),
        d("Laap",
          "Minced meat or fish tossed with toasted ground rice, lime, fish sauce, "
          "chilli and huge quantities of mint and coriander, eaten with sticky rice.",
          "The toasted rice powder is what makes it; the word also means 'luck', which "
          "is why it is served at new year.",
          wiki="Larb"),
    ]),

    # ══ BANGLADESH ════════════════════════════════════════════════════════
    ("BD", [
        d("Panta bhat",
          "Cooked rice left overnight under water until it ferments slightly, eaten "
          "cold in its sour liquid with fried dried fish, green chilli and raw onion.",
          "A farmer's breakfast that became the ritual meal of the new year in April, "
          "eaten in the morning by everyone.",
          wiki="Panta bhat"),
        d("Shorshe ilish",
          "Hilsa fish steamed in a pungent paste of ground mustard seed, green chilli "
          "and raw mustard oil.",
          "The hilsa is the national fish, full of fine bones and eaten anyway; the "
          "mustard is ground with green chilli to stop it turning bitter.",
          wiki="Shorshe Ilish"),
        d("Bhuna khichuri",
          "Rice and lentils fried with whole spices before the water goes in, cooked "
          "down into a thick savoury mash and eaten with fried aubergine and beef.",
          "Monsoon food, cooked when the rain sets in; the dry, fried version is the "
          "festive one.",
          wiki="Khichdi"),
    ]),

    # ══ PAKISTAN ══════════════════════════════════════════════════════════
    ("PK", [
        d("Sajji",
          "A whole lamb or chicken salted, skewered on a stake and set beside an open "
          "fire to roast slowly, served with rice cooked in the drippings.",
          "A Baloch dish, traditionally cooked barely past rare and seasoned with "
          "nothing but salt.",
          wiki="Sajji"),
        d("Chapli kebab",
          "A wide flat patty of minced beef bound with maize flour, coriander seed, "
          "tomato and pomegranate seed, shallow-fried in fat with a tomato slice "
          "pressed on top.",
          "From Peshawar; the name comes from the word for sandal, after the flat "
          "shape.",
          wiki="Chapli kebab"),
        d("Nihari",
          "Shank and marrow bones simmered overnight into a thick, oily, "
          "flour-thickened gravy heavy with long pepper and ginger, eaten at first "
          "light with flatbread.",
          "A breakfast for labourers before the day's work; some Karachi shops claim "
          "an unbroken 'starter' pot going back decades.",
          wiki="Nihari"),
        d("Haleem",
          "Wheat, barley and lentils pounded together with slow-cooked mutton into a "
          "smooth grey paste, finished with fried onion, ginger and lemon.",
          "Cooked in vast quantities for Ramadan and distributed from the mosque; the "
          "pounding goes on for hours until no grain is distinguishable.",
          wiki="Haleem"),
    ]),

    # ══ SRI LANKA ═════════════════════════════════════════════════════════
    ("LK", [
        d("Lamprais",
          "Rice cooked in stock with a mixed-meat curry, a fried aubergine relish, a "
          "fish cutlet and a sweet onion sambol, all wrapped in a banana leaf and baked "
          "together.",
          "A Dutch Burgher dish from the colonial era; the name is a corruption of "
          "'lump rice', and every component is cooked separately first.",
          wiki="Lamprais"),
        d("Pol sambol",
          "Freshly scraped coconut pounded with dried chilli, lime, red onion and "
          "flakes of dried fish into a coarse red relish.",
          "Eaten with everything, at every meal; the coconut must be scraped that day "
          "or it turns.",
          wiki="Pol sambol"),
        d("Appam",
          "A bowl-shaped pancake of fermented rice flour and coconut milk cooked in a "
          "small curved pan so it is lacy and crisp at the rim and spongy in the "
          "middle, often with an egg dropped into the centre.",
          "Breakfast and late supper; the batter ferments overnight with toddy or "
          "yeast, which is where the sourness comes from.",
          wiki="Appam"),
        d("Kottu roti",
          "Shredded flatbread chopped on a hot griddle with two blunt metal blades "
          "together with egg, vegetables and curry, in a clatter you can hear from the "
          "end of the street.",
          "An evening street food invented to use up yesterday's godamba roti; the "
          "rhythm of the blades is the advertisement.",
          wiki="Kottu"),
    ]),

    # ══ NEPAL ═════════════════════════════════════════════════════════════
    ("NP", [
        d("Gundruk",
          "Leafy greens packed into a jar to ferment, then dried in the sun and later "
          "boiled into a sour soup with potato and beans.",
          "A way of keeping green vegetables through a Himalayan winter without salt "
          "or refrigeration.",
          wiki="Gundruk"),
        d("Sel roti",
          "A hoop of sweet fermented rice-flour batter poured by hand in a circle into "
          "hot oil, fried crisp outside and chewy within.",
          "Made for the autumn festivals; the batter is poured freehand and the size of "
          "the ring is a matter of skill.",
          wiki="Sel roti"),
        d("Dal bhat",
          "Lentil soup poured over rice with a vegetable curry, pickle and sauteed "
          "greens, refilled from the pot until you say stop.",
          "Eaten twice a day by much of the country; the refill is the point, which is "
          "why trekkers live on it.",
          commons="File:Dal Bhat Tarkari 4.jpg"),
        d("Momo",
          "Pleated steamed dumplings of minced buffalo or chicken with onion, ginger "
          "and coriander, served with a tomato and sesame dipping sauce.",
          "Carried down from Tibet by Newar traders in the Kathmandu valley; the "
          "tomato-sesame dip is the local addition.",
          wiki="Momo (food)"),
    ]),

    # ══ AFGHANISTAN ═══════════════════════════════════════════════════════
    ("AF", [
        d("Ashak",
          "Thin dumplings filled with garlic chives, boiled and then topped with a "
          "spiced meat sauce, garlic yoghurt and a heavy dusting of dried mint.",
          "A Kabul dish; the leek-and-chive filling makes it distinct from the meat "
          "dumplings served beside it.",
          wiki="Ashak", wikias="Aushak"),
        d("Bolani",
          "A thin flatbread folded around a filling of potato, leek or pumpkin and "
          "pan-fried in a little oil, served with yoghurt.",
          "Street and Ramadan food, sold by the half-moon from carts and eaten warm.",
          wiki="Bolani"),
        d("Mantu",
          "Steamed dumplings of minced beef and onion topped with a split-pea and "
          "tomato sauce, garlic yoghurt and dried mint.",
          "Part of a dumpling family that runs from the Turkic steppe to the "
          "Mediterranean; here they are large, open-topped and yoghurt-drenched.",
          wiki="Mantu (food)", wikias="Manti (food)"),
        d("Kabuli pulao",
          "Long-grain rice steamed over lamb and its stock, then heaped with "
          "caramelised julienned carrot, raisins and slivered almonds or pistachios.",
          "The national dish and the centrepiece of any celebration; the carrots and "
          "raisins are fried separately in sugar before they go on.",
          wiki="Kabuli palaw", wikias="Kabuli pulao"),
    ]),

    # ══ UZBEKISTAN ════════════════════════════════════════════════════════
    ("UZ", [
        d("Samsa",
          "Triangular parcels of layered dough filled with minced lamb, fat and onion, "
          "slapped onto the inside wall of a clay oven to bake.",
          "Sold hot from the tandoor at every bazaar; the pastry is layered with tail "
          "fat rather than butter.",
          wiki="Samsa (food)"),
        d("Lagman",
          "Hand-pulled wheat noodles under a stew of mutton, peppers, tomato and "
          "radish, served either as a soup or fried dry with the sauce.",
          "Brought along the Silk Road by Dungan and Uyghur cooks; the noodles are "
          "swung and doubled by hand, never cut.",
          commons="File:Lagman.jpg"),
        d("Obi non",
          "A round flatbread with a thick rim and a thin middle stamped with a "
          "nail-studded seal, baked against the wall of a clay oven.",
          "Never cut with a knife and never laid face down; each city's bread has a "
          "recognisably different stamp.",
          wiki="Obi non", wikias="Tandyr nan"),
        d("Palov",
          "Rice cooked in a wide cast-iron pot over layered lamb, yellow carrot, onion, "
          "cumin and whole heads of garlic, and never stirred until it is served.",
          "Cooked in enormous pots by men at weddings; UNESCO lists the culture around "
          "it as intangible heritage.",
          commons="File:Samarkand Palov.jpg"),
    ]),

    # ══ KAZAKHSTAN ════════════════════════════════════════════════════════
    ("KZ", [
        d("Kazy",
          "A cured sausage made from horse rib meat and fat packed into the intestine, "
          "boiled and sliced into rounds.",
          "The prestige dish at any celebration, and the ribs are counted -- more ribs "
          "in the sausage means a more generous host.",
          wiki="Kazy"),
        d("Kumis",
          "Mare's milk fermented in a hide bag until it is fizzy, sour and slightly "
          "alcoholic, drunk from a bowl.",
          "Herodotus described the Scythians making it; it is still drunk by the litre "
          "in early summer when the mares are milked.",
          wiki="Kumis"),
        d("Baursak",
          "Small squares or spheres of yeasted dough deep-fried until they puff, piled "
          "in a mound on the table with tea.",
          "Made for every gathering; the smell of the frying fat is said to carry a "
          "greeting to the ancestors.",
          wiki="Baursaki", wikias="Boortsog"),
        d("Beshbarmak",
          "Boiled horsemeat or lamb served over wide sheets of boiled dough with an "
          "onion broth, eaten with the hands from a communal platter.",
          "The name means 'five fingers'; the head of the sheep goes to the most "
          "honoured guest, who distributes the parts.",
          commons="File:Beshbarmak, national dish (3991850909).jpg"),
    ]),

    # ══ MONGOLIA ══════════════════════════════════════════════════════════
    ("MN", [
        d("Khorkhog",
          "Mutton sealed into a milk churn with potatoes and fire-heated stones packed "
          "in among the meat, and cooked from the inside out.",
          "Made outdoors at gatherings; the hot stones are passed round afterwards to "
          "hold, because they are supposed to be good for you.",
          wiki="Khorkhog"),
        d("Suutei tsai",
          "Tea boiled with milk and salt rather than sugar, sometimes enriched with a "
          "spoon of fat or a handful of toasted millet.",
          "Offered to every visitor within moments of arrival; refusing the bowl is a "
          "real discourtesy.",
          wiki="Suutei tsai"),
        d("Tsuivan",
          "Hand-cut sheets of noodle steamed over a mutton and vegetable stew, then "
          "stirred through it so the noodles finish in the fat.",
          "Cooked in one pot on a stove in a felt tent -- steaming the noodles above "
          "the meat saves both water and fuel.",
          wiki="Tsuivan"),
        d("Buuz",
          "Steamed dumplings pinched shut around minced mutton, onion and garlic, eaten "
          "by the dozen and drained of their juice first.",
          "Made in the hundreds and frozen outdoors for the lunar new year, when "
          "households compete on how many they can offer.",
          wiki="Buuz"),
    ]),

    # ══ ARMENIA ═══════════════════════════════════════════════════════════
    ("AM", [
        d("Harisa",
          "Cracked wheat and chicken beaten together over many hours into a thick, "
          "smooth, savoury porridge, served under melted butter.",
          "Cooked communally in huge cauldrons on feast days and tied to the memory of "
          "the 1915 defence of Musa Dagh.",
          commons="File:Armenian Harisa.JPG"),
        d("Ghapama",
          "A whole pumpkin hollowed out, filled with rice, dried fruit, nuts and honey, "
          "and baked whole until the shell is soft enough to spoon.",
          "A new year and Christmas dish, brought to the table whole and opened in "
          "front of the guests, with a song of its own.",
          wiki="Ghapama"),
        d("Khorovats",
          "Large chunks of pork or lamb skewered and grilled over vine cuttings, with "
          "whole aubergines, peppers and tomatoes charred alongside and peeled.",
          "The charred vegetables are mashed into a separate dish; grilling over vine "
          "wood rather than charcoal is the point.",
          wiki="Khorovats"),
        d("Lavash",
          "A very thin unleavened flatbread slapped onto the wall of a buried clay "
          "oven and peeled off in sheets, then stacked and dried for storage.",
          "UNESCO-listed; the dried sheets keep for months and are sprinkled with water "
          "to soften them again.",
          wiki="Lavash"),
    ]),

    # ══ AZERBAIJAN ════════════════════════════════════════════════════════
    ("AZ", [
        d("Piti",
          "Mutton, chickpeas, chestnuts and fat-tail suet baked overnight in an "
          "individual clay crock, eaten in two courses: the broth poured over torn "
          "bread first, then the meat mashed on the plate.",
          "From Sheki, and served in the narrow clay pot it cooked in; eating it in one "
          "course rather than two is considered getting it wrong.",
          wiki="Piti (food)"),
        d("Qutab",
          "A very thin folded flatbread griddled dry with a filling of greens, pumpkin "
          "or minced meat, then brushed with butter.",
          "Cooked on a domed iron plate over a fire, folded in half like a turnover and "
          "eaten with yoghurt and sumac.",
          wiki="Qutab"),
        d("Shah plov",
          "Saffron rice and lamb with dried fruit steamed inside a crust of thin bread, "
          "then turned out as a golden drum and cut open at the table.",
          "The 'king's pilaf', sealed in lavash so the crust bakes crisp; the theatre "
          "of cutting it open is half the dish.",
          commons="File:Şah plov 1.jpg"),
        d("Dolma",
          "Vine leaves rolled tightly around minced lamb, rice and herbs and simmered "
          "in a covered pot, served with garlic yoghurt.",
          "UNESCO lists the making and sharing of it as intangible heritage here; the "
          "leaves are picked young in spring and brined for the year.",
          wiki="Dolma"),
    ]),
]
