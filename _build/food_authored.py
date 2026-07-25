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
          "for a shin-of-beef broth that the fishermen replaced with smoked fish."),
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
          wiki="Pide"),
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
          wiki="Tibs"),
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
          wiki="Causa"),
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
]
