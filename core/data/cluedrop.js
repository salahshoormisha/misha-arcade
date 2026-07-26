/* core/data/cluedrop.js -- window.AD_CLUEDROP

   The AUTHORED layer for CLUEDROP. Everything else that cabinet says about a
   country (hemisphere, continent, script, currency, land borders, population
   band, capital initial) is DERIVED at runtime from core/data/countries.js, so
   it cannot drift out of date. This file holds the three things that dataset
   does not know:

     left     ISO2 codes with LEFT-HAND traffic (UN members). Everything not in
              this list drives on the right.
     scripts  language name (exactly as spelt in countries.js `lang`) -> the
              writing system you would actually see on a sign. Absent = Latin.
     scriptBy ISO2 -> script phrase, for the handful where walking the language
              list gives the wrong answer (Azerbaijan reads as Cyrillic because
              Russian is listed second; Israel reads as Arabic because Arabic
              sorts first; Singapore reads as Tamil).
     langs    ISO2 -> official-language list, where countries.js is thin or
              carries an odd label (Bolivia omits Spanish; Austria is labelled
              "Austro-Bavarian German"; New Zealand lists a sign language,
              which cannot be on a road sign).
     money    overrides for `cur` where countries.js is stale or clumsy once the
              national adjective is stripped off (e.g. Cuba's convertible peso,
              abolished 2021).
     notes    2-3 concrete, checkable details per country: the plug in the wall,
              what is printed on the banknotes, the trees by the road, the shop
              on the corner, the shape of the number plates, the national sport.

   RULES FOLLOWED WHILE AUTHORING `notes`
     · Only facts the author is confident of. Where a detail was uncertain,
       dated or disputed the country got a different detail or was left out
       entirely -- a wrong clue is worse than no clue, because a generated clue
       is always true and the player must be able to trust the whole ladder.
     · Physical, visible, roadside things: infrastructure, vegetation, retail,
       paperwork, sport. No claims about what people are like. No stereotypes.
     · Deliberately NOT the country's most famous monument -- this is the
       GeoGuessr meta written out, not a tourist board.

   Hand-authored, not machine-generated. Validate with
   _build/check_cluedrop.py (checks every ISO2 exists in countries.js, every
   country has >=2 notes, every script key is a real language string, and
   reports the answer-pool size). */
window.AD_CLUEDROP = {
  version: 1,

  /* ── left-hand traffic (UN members) ───────────────────────────────────── */
  left: [
    "AG", "AU", "BB", "BD", "BN", "BS", "BT", "BW", "CY", "DM", "FJ", "GB",
    "GD", "GY", "ID", "IE", "IN", "JM", "JP", "KE", "KI", "KN", "LC", "LK",
    "LS", "MT", "MU", "MV", "MW", "MY", "MZ", "NA", "NP", "NR", "NZ", "PG",
    "PK", "SB", "SC", "SG", "SR", "SZ", "TH", "TL", "TO", "TT", "TV", "TZ",
    "UG", "VC", "WS", "ZA", "ZM", "ZW"
  ],

  /* ── what the signs are written in ────────────────────────────────────── */
  scripts: {
    "Persian (Farsi)": "the Perso-Arabic alphabet",
    "Arabic": "the Arabic alphabet",
    "Hebrew": "the Hebrew alphabet",
    "Greek": "the Greek alphabet",
    "Russian": "Cyrillic",
    "Ukrainian": "Cyrillic",
    "Serbian": "Cyrillic",
    "Bulgarian": "Cyrillic",
    "Kazakh": "Cyrillic",
    "Mongolian": "Cyrillic",
    "Tajik": "Cyrillic",
    "Armenian": "the Armenian alphabet",
    "Georgian": "the Georgian alphabet",
    "Japanese": "Chinese characters mixed with two home-grown syllabaries",
    "Chinese": "Chinese characters",
    "Korean": "hangul, an alphabet stacked into syllable blocks",
    "Hindi": "Devanagari",
    "Nepali": "Devanagari",
    "Bengali": "the Bengali script",
    "Urdu": "Perso-Arabic, written in the sloping nastaliq style",
    "Tamil": "the Tamil script",
    "Sinhala": "the rounded Sinhala script",
    "Thai": "the Thai script, which leaves no gaps between words",
    "Dzongkha": "the Tibetan script",
    "Amharic": "the Ethiopic syllabary",
    "Berber": "Tifinagh, alongside Arabic"
  },

  /* ── script overrides, keyed by country ───────────────────────────────── */
  scriptBy: {
    AZ: "the Latin alphabet, swapped in for Cyrillic in the 1990s",
    IL: "the Hebrew alphabet",
    SG: "the Latin alphabet, with Chinese characters and Tamil beside it",
    UZ: "Latin and Cyrillic both, often on the same street",
    MA: "the Arabic alphabet, with Tifinagh beside it on official signs"
  },

  /* ── official-language overrides ──────────────────────────────────────── */
  langs: {
    AT: ["German"],
    NO: ["Norwegian"],
    NZ: ["English", "M\u0101ori"],
    BO: ["Spanish", "Quechua", "Aymara", "Guaran\u00ed"]
  },

  /* ── currency wording overrides ───────────────────────────────────────── */
  money: {
    CU: "peso",
    VE: "bolivar",
    PA: "balboa -- though the notes in your hand are US dollars",
    EC: "US dollar; it has no currency of its own",
    BT: "ngultrum",
    NA: "dollar, pegged to a bigger neighbour's",
    NO: "krone",
    CH: "franc",
    GE: "lari",
    IS: "kr\u00f3na",
    PH: "peso",
    SA: "riyal",
    TJ: "somoni",
    UZ: "so'm",
    MN: "togrog"
  },

  /* ── the authored details ─────────────────────────────────────────────── */
  notes: {

    /* ── Europe ──────────────────────────────────────────────────────── */
    GB: [
      ["SOCKETS", "Three fat rectangular pins in every socket, and a switch beside most of them."],
      ["PLATES", "Number plates are white at the front and yellow at the back."],
      ["SHOPS", "A Greggs on the high street, a Boots next door, a Tesco Express between them."]
    ],
    IE: [
      ["PLATES", "Plates open with the year and a county letter, so a 2024 car from the capital reads 241-D."],
      ["SPORT", "The biggest crowds of the year are for two amateur games: hurling and Gaelic football."],
      ["SHOPS", "A Centra or a SuperValu in every small town, usually with a deli counter."]
    ],
    FR: [
      ["TREES", "Plane trees planted in ranks along the older roads, for shade."],
      ["SHOPS", "A red diamond sign hangs outside the tabac; the boulangerie has a queue at eight."],
      ["PLATES", "Plates end with a two-digit department number and the region's logo beside it."]
    ],
    DE: [
      ["PLATES", "Plates start with a town code -- B, M, HH -- then two round registration seals."],
      ["SHOPS", "Aldi and Lidl on the ring road, a dm for everything else, and the shops shut on Sunday."],
      ["ROADS", "Wind turbines to the horizon, and stretches of motorway with no posted limit."]
    ],
    NL: [
      ["PLATES", "Number plates are yellow, front and back."],
      ["ROADSIDE", "Red asphalt cycle tracks run beside the road, with traffic lights of their own."],
      ["SHOPS", "Albert Heijn for the food, HEMA for everything else."]
    ],
    BE: [
      ["PLATES", "Plate characters are dark red on white, and the plate belongs to you, not the car."],
      ["FOOD", "Chips come out of a friture in a paper cone with a little fork stuck in the top."],
      ["ROADSIDE", "Three languages on the road signs, and which one depends on which side of a line."]
    ],
    CH: [
      ["SOCKETS", "The sockets take a slim three-pin plug of a design almost nobody else uses."],
      ["SHOPS", "Migros or Coop, and in a lot of towns nothing else."],
      ["PLATES", "One plate at the back, one at the front, each with a two-letter canton shield on it."]
    ],
    AT: [
      ["ROADS", "A motorway sticker in the corner of the windscreen, bought by the year."],
      ["PLATES", "Plates carry a district code and a thin red-white-red band."]
    ],
    IT: [
      ["ROADS", "The toll motorway is signed in green and the ordinary roads in blue -- the opposite of its neighbours."],
      ["SHOPS", "A big white T on a dark blue sign marks the tobacconist, which also sells bus tickets."],
      ["TREES", "Umbrella pines along the coast roads and cypresses up the drives."]
    ],
    ES: [
      ["ROADSIDE", "Olive groves in ranks in the south, and a huge black bull on a hoarding by the road."],
      ["SHOPS", "Mercadona for the shopping; a bar doing a fixed-price lunch in every street."],
      ["PLATES", "Plates are plain white with no province code -- they stopped that in 2000."]
    ],
    PT: [
      ["ROADSIDE", "Pavements laid as black-and-white patterned cobble in every town centre."],
      ["PLATES", "Plates carry a small yellow strip at the right-hand end with the registration date."]
    ],
    GR: [
      ["ROADSIDE", "Olive terraces, cypresses, and little shrines on the bends where the road drops away."],
      ["SHOPS", "A kiosk on the corner of the square selling papers, water and phone credit."]
    ],
    SE: [
      ["MONEY", "Cash has nearly vanished -- a phone number does the paying, even at the market stall."],
      ["ROADSIDE", "Birch and pine to the horizon, and warning triangles for moose."],
      ["SHOPS", "ICA for the food; anything strong comes from the state-run bottle shop."]
    ],
    NO: [
      ["ROADS", "Tunnels everywhere, and toll gantries that read your plate as you drive under them."],
      ["CARS", "An extraordinary share of the new cars are electric."],
      ["SHOPS", "Rema 1000 and Kiwi for food; spirits only from the state monopoly shop."]
    ],
    DK: [
      ["PLATES", "Vans wear yellow plates and cars white ones -- the tax rate is the difference."],
      ["ROADSIDE", "Flat, windswept, and a separated cycle track along nearly every road."]
    ],
    FI: [
      ["SPORT", "The summer game is pesapallo: baseball, but the ball is pitched straight up."],
      ["ROADSIDE", "Pine, birch and lakes, and reindeer warning signs once you are far enough north."]
    ],
    IS: [
      ["ROADSIDE", "Almost no trees, and purple lupins spreading across the lava in June."],
      ["ROADS", "One numbered road goes all the way round, with single-lane bridges on it."]
    ],
    PL: [
      ["SHOPS", "A little green frog on the shop sign, open when nothing else is."],
      ["ROADSIDE", "Roadside shrines to the Virgin, and stork nests built on the poles."]
    ],
    CZ: [
      ["DRINK", "More beer drunk per head than anywhere else, and it arrives in half-litre glasses."],
      ["FOOD", "Dumplings come sliced like a loaf of bread, to mop up the sauce."]
    ],
    HU: [
      ["LANGUAGE", "The language is related to nothing nearby; its closest big relative is Finnish."],
      ["FOOD", "Paprika in everything, sold in tins by the half-kilo."]
    ],
    RO: [
      ["ROADSIDE", "Haystacks built up around a central pole, and horse carts on the country lanes."],
      ["LANGUAGE", "A Romance language completely surrounded by Slavic ones."]
    ],
    RU: [
      ["ROADSIDE", "Birch forest, and a dashcam in nearly every windscreen."],
      ["PLATES", "Plates end in a region number; 77 or 99 means the capital."]
    ],
    UA: [
      ["ROADSIDE", "Black soil and sunflower fields running to the horizon."],
      ["SHOPS", "ATB and Silpo do most of the country's grocery shopping."]
    ],
    TR: [
      ["SHOPS", "Discount chains -- BIM, A101, Sok -- on every other corner."],
      ["DRINK", "Tea arrives in a little tulip-shaped glass with two sugar lumps on the saucer."]
    ],
    RS: [
      ["LANGUAGE", "Two alphabets at once: the shop sign in Cyrillic, the receipt in Latin letters."],
      ["DRINK", "Homemade fruit brandy offered at any hour of the day."]
    ],
    GE: [
      ["FOOD", "Bread baked stuck to the wall of a clay oven; wine fermented in jars buried in the ground."],
      ["ALPHABET", "It has an alphabet of its own, all curves, used for nothing else."]
    ],
    AM: [
      ["SCHOOL", "Chess is a timetabled school subject."],
      ["ROADSIDE", "Apricot orchards, and a snow-capped mountain on the skyline that belongs to the neighbours."]
    ],
    HR: [
      ["COAST", "Over a thousand islands, and a coast road cut into the cliff above the sea."],
      ["CLOTHES", "The necktie is named after this country's soldiers."]
    ],
    BG: [
      ["ALPHABET", "The alphabet used here was developed here, and there is a public holiday for it in May."],
      ["FIELDS", "Fields of roses grown for the oil, picked before the sun is properly up."]
    ],
    LT: [
      ["SPORT", "Basketball is the second religion; the national team is the thing people plan around."],
      ["ROADSIDE", "A hill outside one town has been covered with something like a hundred thousand crosses."]
    ],
    EE: [
      ["PAPERWORK", "You can vote in a national election from your laptop."],
      ["ROADSIDE", "Forest covers about half the country, and bogs most of the rest."]
    ],
    MT: [
      ["SOCKETS", "The sockets take the big British three-pin plug, a long way from Britain."],
      ["BUILDINGS", "Everything is built from the same honey-coloured limestone, and the capital is the smallest in the EU."]
    ],
    CY: [
      ["ROOFS", "A solar water tank on nearly every roof -- more per person than anywhere."],
      ["ROADS", "Distances in kilometres, but the traffic and the plugs are British."]
    ],
    SI: [
      ["BEES", "More beekeepers per head than anywhere, and the hive fronts are painted like picture books."],
      ["FIELDS", "A wooden hay rack stands in the corner of half the fields."]
    ],
    LU: [
      ["TRANSPORT", "All public transport is free, for everyone, everywhere in the country."],
      ["LANGUAGE", "Three languages share the road signs and the paperwork."]
    ],

    /* ── Middle East & North Africa ──────────────────────────────────── */
    IR: [
      ["MONEY", "Prices are quoted in a unit worth ten of the official one, so every price sheds a zero."],
      ["TREES", "Plane trees along the old avenues, with water running down open channels in the gutters."],
      ["BANKNOTES", "The same bearded face, the founder of the Republic, is on every banknote."]
    ],
    IL: [
      ["SOCKETS", "The sockets take a three-pin plug shaped like a wide V, used essentially nowhere else."],
      ["BANKNOTES", "The banknotes carry four poets instead of politicians or generals."],
      ["SPORT", "On any beach, the sound is two wooden paddles knocking a small rubber ball."]
    ],
    EG: [
      ["ROADSIDE", "Date palms, and a strip of green a few kilometres wide either side of one river."],
      ["PLATES", "Number plates carry Arabic-Indic numerals as well as the Western ones."]
    ],
    MA: [
      ["TREES", "Argan trees in the south-west, grown for the oil, and olives everywhere else."],
      ["SHOPS", "A tiny corner shop every fifty metres, and mint tea poured from a great height."]
    ],
    AE: [
      ["PEOPLE", "Most of the people living here were born somewhere else."],
      ["ROADS", "A dozen lanes of motorway, imported palms in rows down the middle, sand either side."]
    ],
    SA: [
      ["DRIVING", "Women have only been allowed to drive since 2018."],
      ["FUEL", "Petrol is among the cheapest in the world, and the cars are enormous."]
    ],
    LB: [
      ["POWER", "Private generators hum in every street, because the state grid runs a few hours a day."],
      ["CALENDAR", "Christian and Muslim holidays are all public holidays, on the same calendar."]
    ],
    JO: [
      ["COAST", "It has one seaside town and about 26 km of coast; the rest is desert and one river valley."],
      ["ROADSIDE", "Black basalt desert in the east, and the lowest dry land on earth on the western border."]
    ],
    OM: [
      ["TREES", "Frankincense trees in the south, and date palms in the wadis."],
      ["BUILDINGS", "A restored fort on nearly every hill, and building rules that keep the towns low and white."]
    ],

    /* ── Sub-Saharan Africa ─────────────────────────────────────────── */
    ZA: [
      ["SOCKETS", "The wall sockets take a very large round three-pin plug shared with almost nobody."],
      ["POWER", "When supply runs short the grid is switched off by rota, neighbourhood by neighbourhood."],
      ["PLATES", "Plates carry a province code -- GP is the one with the biggest city in it."]
    ],
    KE: [
      ["ROADS", "Painted minibuses with sound systems do the work of the buses."],
      ["MONEY", "You pay for nearly everything by phone, down to the vegetable stall."]
    ],
    NG: [
      ["POWER", "A small petrol generator outside nearly every shop."],
      ["FILM", "Its film industry releases more titles a year than Hollywood does."]
    ],
    ET: [
      ["CALENDAR", "The calendar is seven or eight years behind yours and the new year falls in September."],
      ["DRINK", "Coffee is roasted in front of you and poured from a round clay pot."]
    ],
    BW: [
      ["WILDLIFE", "More elephants than any other country."],
      ["ROADSIDE", "Salt pans big enough to see from orbit, and cattle fences that run for hundreds of kilometres."]
    ],
    NA: [
      ["ROADSIDE", "German street names, gravel roads, and an hour between one car and the next."],
      ["COAST", "The desert runs into the sea, and the coast is littered with wrecks."]
    ],
    MG: [
      ["TREES", "Baobabs standing in a line along a red dirt road."],
      ["WILDLIFE", "Its lemurs live nowhere else on earth, and most of the rest of the wildlife doesn't either."]
    ],
    MU: [
      ["CROPS", "Sugar cane over most of the flat land, and volcanic peaks behind it."],
      ["WILDLIFE", "The extinct bird on the coat of arms lived here and only here."]
    ],
    GH: [
      ["CUSTOM", "Coffins are made to order in the shape of what the person loved -- a fish, a Bible, a car."],
      ["CROPS", "Cocoa drying on mats by the roadside, and a chop bar for lunch."]
    ],
    SN: [
      ["SPORT", "Traditional wrestling draws bigger crowds and bigger purses than football."],
      ["TREES", "Baobabs on flat scrub, and horse carts sharing the road out of the capital."]
    ],
    TZ: [
      ["LANGUAGE", "Swahili does the work of the colonial language: the signs, the radio, the primary school."],
      ["ROADSIDE", "Minibuses called dala dala, and a snow-capped volcano on the northern border."]
    ],

    /* ── Asia ───────────────────────────────────────────────────────── */
    JP: [
      ["SOCKETS", "Two flat pins, and the mains runs at 100 volts -- the lowest in the world."],
      ["PLATES", "The smallest class of car wears yellow plates; everyone else's are white."],
      ["SHOPS", "A vending machine in every street and three rival convenience chains on the corner."]
    ],
    KR: [
      ["SHOPS", "A convenience store every hundred metres, and delivery scooters at all hours."],
      ["SPORT", "Taekwondo is the national sport; the national game of thought is played with black and white stones."],
      ["ROADSIDE", "Mountains over most of it, so the flats are stacked with numbered apartment towers."]
    ],
    CN: [
      ["MONEY", "Everything is paid by scanning a QR code; cash confuses the till."],
      ["PLATES", "Plates open with a character for the province, and green plates mean electric."]
    ],
    IN: [
      ["SOCKETS", "Sockets take two round pins, or a big three-pin plug of the old British colonial pattern."],
      ["PLATES", "Private cars have white plates with black letters; taxis and lorries are yellow."],
      ["ROADS", "Lorries ask you in painted letters to sound your horn before overtaking."]
    ],
    PK: [
      ["ROADS", "Lorries painted top to bottom and hung with chains that jingle as they move."],
      ["SPORT", "Field hockey is the official national sport, though cricket is what the country watches."]
    ],
    BD: [
      ["ROADS", "Cycle rickshaws in their thousands, and a river or a channel every few hundred metres."],
      ["SPORT", "The national sport is kabaddi -- a tag game played on a clay court."]
    ],
    LK: [
      ["CROPS", "Tea terraces in the hill country, and orange king coconuts sold by the road for the water."],
      ["SPORT", "Volleyball is the official national sport; cricket is the one that stops the country."]
    ],
    NP: [
      ["FLAG", "Its flag is the only one in the world that isn't a rectangle."],
      ["CLOCKS", "The clocks are 45 minutes off the hour, which no other country's are."]
    ],
    BT: [
      ["SPORT", "Archery is the national sport and every village has a range."],
      ["TELEVISION", "There was no television at all until 1999."]
    ],
    TH: [
      ["SHOPS", "A 7-Eleven within sight of the last 7-Eleven -- thousands of them."],
      ["SPORT", "The national sport is fought with elbows and knees as well as fists."],
      ["ROADSIDE", "Portraits of the king on hoardings above the road, and spirit houses outside the shops."]
    ],
    VN: [
      ["ROADS", "A river of scooters, and plastic stools on the pavement for coffee."],
      ["DRINK", "Coffee is dripped through a little metal filter onto condensed milk."]
    ],
    ID: [
      ["SHOPS", "An Indomaret opposite an Alfamart, in that combination, everywhere."],
      ["SPORT", "Badminton is the sport the country expects to win."],
      ["ROADSIDE", "More active volcanoes than any other country, and motorbike taxis waiting on the corner."]
    ],
    MY: [
      ["CROPS", "Oil palm in ranks for hours at a time, either side of the road."],
      ["FOOD", "A mamak stall open all night doing roti and pulled tea."]
    ],
    SG: [
      ["CARS", "To own a car you must first buy a certificate at auction, and it costs more than the car."],
      ["SHOPS", "Chewing gum isn't sold in the shops."],
      ["HOUSING", "Numbered public-housing towers with a hawker centre and a wet market underneath."]
    ],
    PH: [
      ["ROADS", "Jeepneys -- stretched, chromed and painted -- and a sari-sari shop in every street."],
      ["SPORT", "A basketball hoop in every neighbourhood; the official national sport is a stick-fighting art."]
    ],
    MN: [
      ["HOUSING", "Round felt tents pitched right up to the edge of the capital."],
      ["SPORT", "Wrestling, archery and horse racing: the three games of one summer festival."]
    ],
    KZ: [
      ["ROADSIDE", "Steppe with nothing on it for hours, and camels beside the railway."],
      ["SPACE", "The oldest and largest rocket launch site on earth sits on its steppe, leased to a neighbour."]
    ],
    UZ: [
      ["BUILDINGS", "Blue-tiled domes and madrasas in the old cities, cotton fields between them."],
      ["FOOD", "Round bread baked against the wall of a clay oven, stamped in the middle."]
    ],
    TJ: [
      ["ROADSIDE", "Mountains over nine-tenths of the country; one road out of the capital climbs past 4,000 m."],
      ["MONEY", "Its money is named after a medieval emir, and much of the country's income is sent home from abroad."]
    ],
    AZ: [
      ["ROADSIDE", "Oil derricks standing in the sea off the capital, and semi-desert behind it."],
      ["DRINK", "Tea in a pear-shaped glass, taken with a spoonful of jam rather than sugar."]
    ],

    /* ── Oceania ────────────────────────────────────────────────────── */
    AU: [
      ["SOCKETS", "Two flat pins angled into a V with an earth pin below."],
      ["ROADSIDE", "Eucalyptus, red dirt, and signs warning of kangaroos for the next 20 km."],
      ["SHOPS", "Woolworths or Coles for food, and a sausage sizzle outside the hardware warehouse."]
    ],
    NZ: [
      ["ROADSIDE", "One-lane bridges, cabbage trees, and pine plantations planted in blocks."],
      ["FARMING", "Sheep outnumber people about five to one."],
      ["SPORT", "Rugby union is the national sport and the team plays in black."]
    ],
    FJ: [
      ["CROPS", "Sugar cane, and a narrow-gauge cane railway that crosses the road."],
      ["CUSTOM", "One word does hello, goodbye and cheers, and it is painted on everything."]
    ],
    PG: [
      ["LANGUAGE", "More than eight hundred languages are spoken here -- more than in any other country."],
      ["ROADSIDE", "Red betel stains on the pavements, and no road at all between the capital and most of the country."]
    ],

    /* ── Americas ───────────────────────────────────────────────────── */
    US: [
      ["SOCKETS", "Two flat pins on 120 volts, and light switches that go up for on."],
      ["PLATES", "Every state prints its own plate, most of them with a slogan on it."],
      ["ROADS", "Yellow lines divide oncoming traffic, and there's a stop sign on every corner of the grid."]
    ],
    CA: [
      ["SHOPS", "Bilingual labels on everything, and a doughnut chain at every motorway exit."],
      ["SPORT", "Two official national sports, by statute: one for summer, one for winter."]
    ],
    MX: [
      ["SHOPS", "An OXXO on the corner, and a street market that appears one day a week."],
      ["ROADS", "Speed bumps through every village, and tyre-repair shacks between them."],
      ["SPORT", "The national sport is done on horseback in a ring; the arenas are full for masked wrestling."]
    ],
    BR: [
      ["PLATES", "Plates carry a blue band across the top with the trade bloc's name on it."],
      ["FUEL", "Most cars will run on petrol or sugarcane ethanol, whichever is cheaper that week."],
      ["FOOD", "Plastic chairs on the pavement outside the bar, and cheese bread at the bus station."]
    ],
    AR: [
      ["DRINK", "A gourd of bitter tea and a thermos of hot water carried under the arm."],
      ["SPORT", "Football is the religion, but the official national sport is played on horseback."]
    ],
    CL: [
      ["SHAPE", "Over 4,000 km long and never more than about 350 km wide."],
      ["SPORT", "The official national sport is a rodeo, ridden in pairs against a padded wall."]
    ],
    PE: [
      ["CROPS", "More varieties of potato than anywhere on earth, sold by colour in the market."],
      ["DRINK", "A bright yellow soft drink of its own outsells the imported colas."]
    ],
    CO: [
      ["SPORT", "The national sport involves throwing a metal disc at small packets of gunpowder."],
      ["CROPS", "Coffee on the steep slopes, picked by hand because a machine cannot stand up there."]
    ],
    CU: [
      ["CARS", "American cars from the 1950s kept running as shared taxis."],
      ["SPORT", "Baseball in every park, and an argument about it on the corner of the main square."]
    ],
    JM: [
      ["FOOD", "Patties in a paper bag, and jerk cooked in a split oil drum by the road."],
      ["SPORT", "The whole island stops for the sprinting."]
    ],
    CR: [
      ["ARMY", "It has had no army since 1948."],
      ["CUSTOM", "Two words serve as hello, goodbye and everything's fine."]
    ],
    UY: [
      ["LAW", "Cannabis is sold legally, at the pharmacy, on a register."],
      ["FARMING", "Cattle outnumber people about three to one."]
    ],
    BO: [
      ["CAPITALS", "It has two capitals: the courts in one city, the government in another at 3,600 m."],
      ["ROADSIDE", "A salt flat so level it is used to calibrate satellites."]
    ],
    EC: [
      ["EQUATOR", "The equator crosses it, with a monument standing on the line."],
      ["HATS", "The straw hats named after a different country are made here."],
      ["ISLANDS", "An archipelago 900 km offshore, with finches on it that changed biology."]
    ],
    PA: [
      ["CANAL", "A canal cuts the country in two and ships queue at both ends of it."],
      ["MONEY", "The local currency exists mostly as coins; the notes in circulation are US dollars."]
    ],
    VE: [
      ["SPORT", "Baseball, not football, is the national game."],
      ["ROADSIDE", "The tallest waterfall on earth drops off a flat-topped mountain in its south-east."]
    ],
    PY: [
      ["DRINK", "The same bitter tea as its neighbours, but drunk ice-cold from a flask."],
      ["LANGUAGE", "Two official languages, and the indigenous one is spoken by most of the country."]
    ],
    DO: [
      ["SPORT", "Baseball academies in the old sugar towns, feeding the American leagues."],
      ["ROADS", "Motorbike taxis instead of buses, and merengue from a speaker on the pavement."]
    ],
    TT: [
      ["MUSIC", "The steel drum was invented here, beaten out of an oil barrel."],
      ["ROADSIDE", "A natural lake of asphalt that is dug up and exported for road surfacing."]
    ]
  }
};
