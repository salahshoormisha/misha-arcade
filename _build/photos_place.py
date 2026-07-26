#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
photos_place.py -- harvest the GeoGuessr-style half of core/data/photos.js

Method
  1. A curated seed list of ORDINARY places (secondary towns, villages, rural
     districts, coastlines) plus a small set of famous landmarks for `easy:1`.
     Only the place NAME + ISO2 are authored by hand; coordinates come from
     en.wikipedia `prop=coordinates` so nothing is guessed.
  2. Commons `list=geosearch` (gsradius 10 km) around each seed. Geosearch only
     returns files that CARRY THEIR OWN COORDINATES, so every lat/lon shipped
     here is the file's real recorded position, not a derived one.
  3. Reject non-photos, interiors, close-ups, studio work and anything
     distressing (photos_lib.REJECT); require an outdoor scene word.
  4. Derive `clues` from the file's own title / description / categories.
  5. Verify every thumbnail URL is HTTP 200 with an image content-type.

Writes `_build/photos-place.json` after EVERY seed, so an interrupted run
always leaves a loadable file behind.  Re-runnable and deterministic
(all API responses are cached under _build/cache/photos/).

    python3 _build/photos_place.py [--limit N] [--only ISO2,ISO2]
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import photos_lib as L  # noqa: E402

OUT = os.path.join(L.BUILD, "photos-place.json")

# ── seeds ──────────────────────────────────────────────────────────────────
# (wikipedia article title, display label, ISO2, tag)
#   tag "o" = ordinary view wanted, "L" = landmark (candidate for easy:1)
# Deliberately weighted towards secondary towns and countryside: a landmark is
# trivia, ordinary ground is geography.
SEEDS = [
    # ── Africa ────────────────────────────────────────────────────────────
    ("Kumasi", "Kumasi", "GH", "o"), ("Cape Coast", "Cape Coast", "GH", "o"),
    ("Tamale, Ghana", "Tamale", "GH", "o"),
    ("Abeokuta", "Abeokuta", "NG", "o"), ("Jos", "Jos", "NG", "o"),
    ("Calabar", "Calabar", "NG", "o"),
    ("Nakuru", "Nakuru", "KE", "o"), ("Malindi", "Malindi", "KE", "o"),
    ("Naivasha", "Naivasha", "KE", "o"),
    ("Arusha", "Arusha", "TZ", "o"), ("Bagamoyo", "Bagamoyo", "TZ", "o"),
    ("Stone Town", "Stone Town, Zanzibar", "TZ", "o"),
    ("Jinja, Uganda", "Jinja", "UG", "o"), ("Fort Portal", "Fort Portal", "UG", "o"),
    ("Gondar", "Gondar", "ET", "o"), ("Bahir Dar", "Bahir Dar", "ET", "o"),
    ("Harar", "Harar", "ET", "o"),
    ("Essaouira", "Essaouira", "MA", "o"), ("Chefchaouen", "Chefchaouen", "MA", "o"),
    ("Ouarzazate", "Ouarzazate", "MA", "o"),
    ("Sidi Bou Said", "Sidi Bou Said", "TN", "o"), ("Sousse", "Sousse", "TN", "o"),
    ("Ghardaïa", "Ghardaia", "DZ", "o"), ("Tlemcen", "Tlemcen", "DZ", "o"),
    ("Aswan", "Aswan", "EG", "o"), ("Siwa Oasis", "Siwa Oasis", "EG", "o"),
    ("Stellenbosch", "Stellenbosch", "ZA", "o"), ("Knysna", "Knysna", "ZA", "o"),
    ("Graaff-Reinet", "Graaff-Reinet", "ZA", "o"),
    ("Swakopmund", "Swakopmund", "NA", "o"), ("Lüderitz", "Luderitz", "NA", "o"),
    ("Maun", "Maun", "BW", "o"), ("Kasane", "Kasane", "BW", "o"),
    ("Livingstone, Zambia", "Livingstone", "ZM", "o"),
    ("Bulawayo", "Bulawayo", "ZW", "o"), ("Mutare", "Mutare", "ZW", "o"),
    ("Blantyre, Malawi", "Blantyre", "MW", "o"), ("Nkhata Bay", "Nkhata Bay", "MW", "o"),
    ("Nampula", "Nampula", "MZ", "o"), ("Inhambane", "Inhambane", "MZ", "o"),
    ("Antsirabe", "Antsirabe", "MG", "o"), ("Toliara", "Toliara", "MG", "o"),
    ("Saint-Louis, Senegal", "Saint-Louis", "SN", "o"), ("Ziguinchor", "Ziguinchor", "SN", "o"),
    ("Djenné", "Djenne", "ML", "o"), ("Ségou", "Segou", "ML", "o"),
    ("Bobo-Dioulasso", "Bobo-Dioulasso", "BF", "o"), ("Ouagadougou", "Ouagadougou", "BF", "o"),
    ("Zinder", "Zinder", "NE", "o"), ("Agadez", "Agadez", "NE", "o"),
    ("Grand-Bassam", "Grand-Bassam", "CI", "o"), ("Yamoussoukro", "Yamoussoukro", "CI", "o"),
    ("Kribi", "Kribi", "CM", "o"), ("Bamenda", "Bamenda", "CM", "o"),
    ("Ouidah", "Ouidah", "BJ", "o"), ("Ganvie", "Ganvie", "BJ", "o"),
    ("Kpalimé", "Kpalime", "TG", "o"),
    ("Gitega", "Gitega", "BI", "o"),
    ("Musanze", "Musanze", "RW", "o"), ("Huye, Rwanda", "Huye", "RW", "o"),
    ("Kassala", "Kassala", "SD", "o"),
    ("Massawa", "Massawa", "ER", "o"),
    ("Berbera", "Berbera", "SO", "o"),
    ("Praia", "Praia", "CV", "o"), ("Mindelo", "Mindelo", "CV", "o"),
    ("Lobito", "Lobito", "AO", "o"), ("Lubango", "Lubango", "AO", "o"),
    ("Ghadames", "Ghadames", "LY", "o"),
    ("Chinguetti", "Chinguetti", "MR", "o"),
    ("Bissau", "Bissau", "GW", "o"),
    ("Kenema", "Kenema", "SL", "o"),
    ("Harper, Liberia", "Harper", "LR", "o"),
    ("Franceville", "Franceville", "GA", "o"),
    ("Moroni, Comoros", "Moroni", "KM", "o"),
    ("Victoria, Seychelles", "Victoria", "SC", "o"),
    ("Curepipe", "Curepipe", "MU", "o"),
    ("Maseru", "Maseru", "LS", "o"),
    ("Mbabane", "Mbabane", "SZ", "o"),

    # ── Asia ──────────────────────────────────────────────────────────────
    ("Kashan", "Kashan", "IR", "o"), ("Yazd", "Yazd", "IR", "o"),
    ("Masuleh", "Masuleh", "IR", "o"), ("Persepolis", "Persepolis", "IR", "L"),
    ("Bukhara", "Bukhara", "UZ", "o"), ("Khiva", "Khiva", "UZ", "o"),
    ("Fergana", "Fergana", "UZ", "o"),
    ("Khujand", "Khujand", "TJ", "o"), ("Khorog", "Khorog", "TJ", "o"),
    ("Karakol", "Karakol", "KG", "o"), ("Osh", "Osh", "KG", "o"),
    ("Shymkent", "Shymkent", "KZ", "o"), ("Turkistan, Kazakhstan", "Turkistan", "KZ", "o"),
    ("Kharkhorin", "Kharkhorin", "MN", "o"), ("Ulaanbaatar", "Ulaanbaatar", "MN", "o"),
    ("Kaifeng", "Kaifeng", "CN", "o"), ("Lijiang", "Lijiang", "CN", "o"),
    ("Yangshuo", "Yangshuo County", "CN", "o"), ("Harbin", "Harbin", "CN", "o"),
    ("Kanazawa", "Kanazawa", "JP", "o"), ("Takayama, Gifu", "Takayama", "JP", "o"),
    ("Otaru", "Otaru", "JP", "o"), ("Onomichi", "Onomichi", "JP", "o"),
    ("Gyeongju", "Gyeongju", "KR", "o"), ("Jeonju", "Jeonju", "KR", "o"),
    ("Hualien City", "Hualien", "TW", "o"), ("Tainan", "Tainan", "TW", "o"),
    ("Hội An", "Hoi An", "VN", "o"), ("Sa Pa", "Sa Pa", "VN", "o"),
    ("Can Tho", "Can Tho", "VN", "o"),
    ("Luang Prabang", "Luang Prabang", "LA", "o"), ("Vang Vieng", "Vang Vieng", "LA", "o"),
    ("Battambang", "Battambang", "KH", "o"), ("Kampot", "Kampot", "KH", "o"),
    ("Chiang Rai", "Chiang Rai", "TH", "o"), ("Ayutthaya (city)", "Ayutthaya", "TH", "o"),
    ("Bagan", "Bagan", "MM", "o"), ("Hpa-An", "Hpa-An", "MM", "o"),
    ("Malacca City", "Malacca City", "MY", "o"), ("Kuching", "Kuching", "MY", "o"),
    ("Yogyakarta", "Yogyakarta", "ID", "o"), ("Ubud", "Ubud", "ID", "o"),
    ("Bukittinggi", "Bukittinggi", "ID", "o"),
    ("Vigan", "Vigan", "PH", "o"), ("Banaue", "Banaue", "PH", "o"),
    ("Kandy", "Kandy", "LK", "o"), ("Galle", "Galle", "LK", "o"),
    ("Ella, Sri Lanka", "Ella", "LK", "o"),
    ("Udaipur", "Udaipur", "IN", "o"), ("Varanasi", "Varanasi", "IN", "o"),
    ("Kochi", "Kochi", "IN", "o"), ("Shillong", "Shillong", "IN", "o"),
    ("Pokhara", "Pokhara", "NP", "o"), ("Bhaktapur", "Bhaktapur", "NP", "o"),
    ("Paro, Bhutan", "Paro", "BT", "o"), ("Punakha", "Punakha", "BT", "o"),
    ("Sylhet", "Sylhet", "BD", "o"), ("Sundarbans", "Sundarbans", "BD", "o"),
    ("Hunza Valley", "Hunza Valley", "PK", "o"), ("Multan", "Multan", "PK", "o"),
    ("Bamyan", "Bamyan", "AF", "o"), ("Herat", "Herat", "AF", "o"),
    ("Safranbolu", "Safranbolu", "TR", "o"), ("Mardin", "Mardin", "TR", "o"),
    ("Trabzon", "Trabzon", "TR", "o"),
    ("Sighnaghi", "Sighnaghi", "GE", "o"), ("Mestia", "Mestia", "GE", "o"),
    ("Dilijan", "Dilijan", "AM", "o"), ("Goris", "Goris", "AM", "o"),
    ("Sheki, Azerbaijan", "Sheki", "AZ", "o"), ("Lahic", "Lahic", "AZ", "o"),
    ("Byblos", "Byblos", "LB", "o"), ("Baalbek", "Baalbek", "LB", "o"),
    ("Jerash", "Jerash", "JO", "o"), ("Madaba", "Madaba", "JO", "o"),
    ("Petra", "Petra", "JO", "L"),
    ("Nizwa", "Nizwa", "OM", "o"), ("Sur, Oman", "Sur", "OM", "o"),
    ("Al Ain", "Al Ain", "AE", "o"),
    ("Taif", "Taif", "SA", "o"), ("Al-'Ula", "AlUla", "SA", "o"),
    ("Shibam", "Shibam", "YE", "o"),
    ("Erbil", "Erbil", "IQ", "o"), ("Sulaymaniyah", "Sulaymaniyah", "IQ", "o"),
    ("Aleppo", "Aleppo", "SY", "o"),
    ("Haifa", "Haifa", "IL", "o"), ("Safed", "Safed", "IL", "o"),
    ("Bethlehem", "Bethlehem", "PS", "o"),
    ("Muharraq", "Muharraq", "BH", "o"),
    ("Al Wakrah", "Al Wakrah", "QA", "o"),
    ("Salmiya", "Salmiya", "KW", "o"),
    ("Dili", "Dili", "TL", "o"),
    ("Bandar Seri Begawan", "Bandar Seri Begawan", "BN", "o"),
    ("Malé", "Male", "MV", "o"),

    # ── Europe ────────────────────────────────────────────────────────────
    ("Hallstatt", "Hallstatt", "AT", "o"), ("Graz", "Graz", "AT", "o"),
    ("Bruges", "Bruges", "BE", "o"), ("Dinant", "Dinant", "BE", "o"),
    ("Plovdiv", "Plovdiv", "BG", "o"), ("Veliko Tarnovo", "Veliko Tarnovo", "BG", "o"),
    ("Rovinj", "Rovinj", "HR", "o"), ("Zadar", "Zadar", "HR", "o"),
    ("Český Krumlov", "Cesky Krumlov", "CZ", "o"), ("Olomouc", "Olomouc", "CZ", "o"),
    ("Ribe", "Ribe", "DK", "o"), ("Aarhus", "Aarhus", "DK", "o"),
    ("Tartu", "Tartu", "EE", "o"), ("Saaremaa", "Saaremaa", "EE", "o"),
    ("Porvoo", "Porvoo", "FI", "o"), ("Rovaniemi", "Rovaniemi", "FI", "o"),
    ("Colmar", "Colmar", "FR", "o"), ("Annecy", "Annecy", "FR", "o"),
    ("Saint-Malo", "Saint-Malo", "FR", "o"), ("Sarlat-la-Canéda", "Sarlat", "FR", "o"),
    ("Bamberg", "Bamberg", "DE", "o"), ("Quedlinburg", "Quedlinburg", "DE", "o"),
    ("Rothenburg ob der Tauber", "Rothenburg", "DE", "o"), ("Görlitz", "Gorlitz", "DE", "o"),
    ("Nafplio", "Nafplio", "GR", "o"), ("Meteora", "Meteora", "GR", "o"),
    ("Chania", "Chania", "GR", "o"),
    ("Eger, Hungary", "Eger", "HU", "o"), ("Szentendre", "Szentendre", "HU", "o"),
    ("Akureyri", "Akureyri", "IS", "o"), ("Vík í Mýrdal", "Vik", "IS", "o"),
    ("Galway", "Galway", "IE", "o"), ("Dingle", "Dingle", "IE", "o"),
    ("Siena", "Siena", "IT", "o"), ("Matera", "Matera", "IT", "o"),
    ("Bolzano", "Bolzano", "IT", "o"), ("Lecce", "Lecce", "IT", "o"),
    ("Cēsis", "Cesis", "LV", "o"), ("Kuldīga", "Kuldiga", "LV", "o"),
    ("Trakai", "Trakai", "LT", "o"), ("Kaunas", "Kaunas", "LT", "o"),
    ("Vianden", "Vianden", "LU", "o"),
    ("Ohrid", "Ohrid", "MK", "o"), ("Bitola", "Bitola", "MK", "o"),
    ("Mdina", "Mdina", "MT", "o"), ("Marsaxlokk", "Marsaxlokk", "MT", "o"),
    ("Delft", "Delft", "NL", "o"), ("Giethoorn", "Giethoorn", "NL", "o"),
    ("Ålesund", "Alesund", "NO", "o"), ("Røros", "Roros", "NO", "o"),
    ("Kraków", "Krakow", "PL", "o"), ("Zakopane", "Zakopane", "PL", "o"),
    ("Toruń", "Torun", "PL", "o"),
    ("Sintra", "Sintra", "PT", "o"), ("Óbidos, Portugal", "Obidos", "PT", "o"),
    ("Sighișoara", "Sighisoara", "RO", "o"), ("Brașov", "Brasov", "RO", "o"),
    ("Suzdal", "Suzdal", "RU", "o"), ("Kazan", "Kazan", "RU", "o"),
    ("Irkutsk", "Irkutsk", "RU", "o"), ("Vyborg", "Vyborg", "RU", "o"),
    ("Novi Sad", "Novi Sad", "RS", "o"), ("Subotica", "Subotica", "RS", "o"),
    ("Banská Štiavnica", "Banska Stiavnica", "SK", "o"), ("Košice", "Kosice", "SK", "o"),
    ("Bled", "Bled", "SI", "o"), ("Piran", "Piran", "SI", "o"),
    ("Ronda", "Ronda", "ES", "o"), ("Cuenca, Spain", "Cuenca", "ES", "o"),
    ("Santiago de Compostela", "Santiago de Compostela", "ES", "o"),
    ("Visby", "Visby", "SE", "o"), ("Gothenburg", "Gothenburg", "SE", "o"),
    ("Lucerne", "Lucerne", "CH", "o"), ("Zermatt", "Zermatt", "CH", "o"),
    ("Lviv", "Lviv", "UA", "o"), ("Chernivtsi", "Chernivtsi", "UA", "o"),
    ("York", "York", "GB", "o"), ("Portmeirion", "Portmeirion", "GB", "o"),
    ("Stirling", "Stirling", "GB", "o"), ("Whitby", "Whitby", "GB", "o"),
    ("Mostar", "Mostar", "BA", "o"), ("Jajce", "Jajce", "BA", "o"),
    ("Kotor", "Kotor", "ME", "o"), ("Berat", "Berat", "AL", "o"),
    ("Gjirokastër", "Gjirokaster", "AL", "o"),
    ("Prizren", "Prizren", "XK", "o"),
    ("Orhei", "Orhei", "MD", "o"),
    ("Hrodna", "Hrodna", "BY", "o"), ("Mir, Belarus", "Mir", "BY", "o"),
    ("Vaduz", "Vaduz", "LI", "o"), ("Andorra la Vella", "Andorra la Vella", "AD", "o"),
    ("San Marino", "San Marino", "SM", "o"), ("Monaco", "Monaco", "MC", "o"),
    ("Tórshavn", "Torshavn", "FO", "o"), ("Nuuk", "Nuuk", "GL", "o"),
    ("Gibraltar", "Gibraltar", "GI", "o"),

    # ── North & Central America, Caribbean ────────────────────────────────
    ("Savannah, Georgia", "Savannah, Georgia", "US", "o"),
    ("Taos, New Mexico", "Taos, New Mexico", "US", "o"),
    ("Bar Harbor, Maine", "Bar Harbor, Maine", "US", "o"),
    ("Moab, Utah", "Moab, Utah", "US", "o"),
    ("Galena, Illinois", "Galena, Illinois", "US", "o"),
    ("Lunenburg, Nova Scotia", "Lunenburg, Nova Scotia", "CA", "o"),
    ("Banff, Alberta", "Banff, Alberta", "CA", "o"),
    ("Quebec City", "Quebec City", "CA", "o"),
    ("Yellowknife", "Yellowknife", "CA", "o"),
    ("Guanajuato City", "Guanajuato", "MX", "o"), ("Oaxaca City", "Oaxaca", "MX", "o"),
    ("San Cristóbal de las Casas", "San Cristobal de las Casas", "MX", "o"),
    ("Antigua Guatemala", "Antigua Guatemala", "GT", "o"), ("Panajachel", "Panajachel", "GT", "o"),
    ("Suchitoto", "Suchitoto", "SV", "o"),
    ("Copán Ruinas", "Copan Ruinas", "HN", "o"), ("Roatán", "Roatan", "HN", "o"),
    ("Granada, Nicaragua", "Granada", "NI", "o"), ("León, Nicaragua", "Leon", "NI", "o"),
    ("Monteverde", "Monteverde", "CR", "o"), ("Puerto Viejo de Talamanca", "Puerto Viejo", "CR", "o"),
    ("Bocas del Toro", "Bocas del Toro", "PA", "o"), ("Boquete", "Boquete", "PA", "o"),
    ("Belize City", "Belize City", "BZ", "o"), ("San Ignacio, Belize", "San Ignacio", "BZ", "o"),
    ("Trinidad, Cuba", "Trinidad", "CU", "o"), ("Viñales", "Vinales", "CU", "o"),
    ("Cap-Haïtien", "Cap-Haitien", "HT", "o"),
    ("Puerto Plata, Dominican Republic", "Puerto Plata", "DO", "o"),
    ("Port Antonio", "Port Antonio", "JM", "o"), ("Falmouth, Jamaica", "Falmouth", "JM", "o"),
    ("Speightstown", "Speightstown", "BB", "o"),
    ("Scarborough, Trinidad and Tobago", "Scarborough, Tobago", "TT", "o"),
    ("Willemstad", "Willemstad", "CW", "o"), ("Oranjestad, Aruba", "Oranjestad", "AW", "o"),
    ("Basseterre", "Basseterre", "KN", "o"), ("Castries", "Castries", "LC", "o"),
    ("St. George's, Grenada", "St. George's", "GD", "o"),
    ("Roseau", "Roseau", "DM", "o"), ("Kingstown", "Kingstown", "VC", "o"),
    ("St. John's, Antigua and Barbuda", "St. John's", "AG", "o"),
    ("Nassau, Bahamas", "Nassau", "BS", "o"), ("Hamilton, Bermuda", "Hamilton", "BM", "o"),
    ("San Juan, Puerto Rico", "San Juan", "PR", "o"),
    ("Gustavia, Saint Barthélemy", "Gustavia", "BL", "o"),

    # ── South America ─────────────────────────────────────────────────────
    ("Salta", "Salta", "AR", "o"), ("Ushuaia", "Ushuaia", "AR", "o"),
    ("Mendoza, Argentina", "Mendoza", "AR", "o"),
    ("Sucre, Bolivia", "Sucre", "BO", "o"), ("Potosí", "Potosi", "BO", "o"),
    ("Copacabana, Bolivia", "Copacabana", "BO", "o"),
    ("Ouro Preto", "Ouro Preto", "BR", "o"), ("Olinda", "Olinda", "BR", "o"),
    ("Paraty", "Paraty", "BR", "o"), ("Manaus", "Manaus", "BR", "o"),
    ("Valparaíso", "Valparaiso", "CL", "o"), ("Puerto Varas", "Puerto Varas", "CL", "o"),
    ("San Pedro de Atacama", "San Pedro de Atacama", "CL", "o"),
    ("Cartagena, Colombia", "Cartagena", "CO", "o"), ("Salento, Quindío", "Salento", "CO", "o"),
    ("Villa de Leyva", "Villa de Leyva", "CO", "o"),
    ("Cuenca, Ecuador", "Cuenca", "EC", "o"), ("Otavalo", "Otavalo", "EC", "o"),
    ("Baños, Ecuador", "Banos", "EC", "o"),
    ("Arequipa", "Arequipa", "PE", "o"), ("Cusco", "Cusco", "PE", "o"),
    ("Puno", "Puno", "PE", "o"), ("Machu Picchu", "Machu Picchu", "PE", "L"),
    ("Colonia del Sacramento", "Colonia del Sacramento", "UY", "o"),
    ("Punta del Este", "Punta del Este", "UY", "o"),
    ("Encarnación", "Encarnacion", "PY", "o"), ("Ciudad del Este", "Ciudad del Este", "PY", "o"),
    ("Mérida, Mérida", "Merida", "VE", "o"), ("Ciudad Bolívar", "Ciudad Bolivar", "VE", "o"),
    ("Georgetown, Guyana", "Georgetown", "GY", "o"),
    ("Paramaribo", "Paramaribo", "SR", "o"),
    ("Cayenne", "Cayenne", "GF", "o"),

    # ── Oceania ───────────────────────────────────────────────────────────
    ("Hobart", "Hobart", "AU", "o"), ("Broome, Western Australia", "Broome", "AU", "o"),
    ("Ballarat", "Ballarat", "AU", "o"), ("Coober Pedy", "Coober Pedy", "AU", "o"),
    ("Uluru", "Uluru", "AU", "L"),
    ("Queenstown, New Zealand", "Queenstown", "NZ", "o"),
    ("Napier, New Zealand", "Napier", "NZ", "o"),
    ("Dunedin", "Dunedin", "NZ", "o"),
    ("Suva", "Suva", "FJ", "o"), ("Levuka", "Levuka", "FJ", "o"),
    ("Apia", "Apia", "WS", "o"), ("Nukuʻalofa", "Nuku'alofa", "TO", "o"),
    ("Port Vila", "Port Vila", "VU", "o"), ("Honiara", "Honiara", "SB", "o"),
    ("Nouméa", "Noumea", "NC", "o"), ("Papeete", "Papeete", "PF", "o"),
    ("Rarotonga", "Rarotonga", "CK", "o"), ("Koror", "Koror", "PW", "o"),
    ("Hagåtña, Guam", "Hagatna", "GU", "o"), ("Pago Pago", "Pago Pago", "AS", "o"),
    ("Goroka", "Goroka", "PG", "o"), ("Madang", "Madang", "PG", "o"),
    ("Tarawa", "Tarawa", "KI", "o"), ("Funafuti", "Funafuti", "TV", "o"),
    ("Weno", "Weno", "FM", "o"), ("Majuro", "Majuro", "MH", "o"),
    ("Easter Island", "Easter Island", "CL", "L"),

    # ── a handful of instantly-recognisable landmarks for `easy:1` ────────
    ("Eiffel Tower", "Paris", "FR", "L"),
    ("Colosseum", "Rome", "IT", "L"),
    ("Tower Bridge", "London", "GB", "L"),
    ("Brandenburg Gate", "Berlin", "DE", "L"),
    ("Charles Bridge", "Prague", "CZ", "L"),
    ("Saint Basil's Cathedral", "Moscow", "RU", "L"),
    ("Hagia Sophia", "Istanbul", "TR", "L"),
    ("Great Pyramid of Giza", "Giza", "EG", "L"),
    ("Taj Mahal", "Agra", "IN", "L"),
    ("Angkor Wat", "Angkor", "KH", "L"),
    ("Sydney Opera House", "Sydney", "AU", "L"),
    ("Golden Gate Bridge", "San Francisco", "US", "L"),
    ("Christ the Redeemer (statue)", "Rio de Janeiro", "BR", "L"),
    ("Table Mountain", "Cape Town", "ZA", "L"),
    ("Neuschwanstein Castle", "Schwangau", "DE", "L"),
    ("Matterhorn", "Zermatt", "CH", "L"),
    ("Victoria Falls", "Victoria Falls", "ZW", "L"),
    ("Mount Fuji", "Mount Fuji", "JP", "L"),
    ("Chichen Itza", "Chichen Itza", "MX", "L"),
    ("Acropolis of Athens", "Athens", "GR", "L"),
    ("Sagrada Família", "Barcelona", "ES", "L"),
    ("Burj Khalifa", "Dubai", "AE", "L"),
    ("Marina Bay Sands", "Singapore", "SG", "L"),
    ("Atomium", "Brussels", "BE", "L"),
    ("Little Mermaid (statue)", "Copenhagen", "DK", "L"),
]

# ── clue vocabulary: regex over (title + description + categories) → clue ──
# Every clue here names something the source metadata literally says is there.
CLUE_RULES = [
    (r"\btram(way|s|car)?\b|straßenbahn", "tram tracks in the road"),
    (r"\btrolleybus|trolleybuses\b", "trolleybus wires overhead"),
    (r"\brickshaw|tuk[- ]?tuk|tricycle taxi", "auto-rickshaws"),
    (r"\bmatatu\b", "minibus taxis"),
    (r"\bjeepney", "jeepneys"),
    (r"\bdhow\b", "lateen-rigged dhows"),
    (r"\bpirogue|dugout canoe", "dugout canoes"),
    (r"\bgondola\b", "gondolas"),
    (r"\bsampan|junk boat", "wooden sampans"),
    (r"\bfishing (boat|vessel|village)|trawler", "fishing boats"),
    (r"\brailway|railroad|train station|locomotive\b", "railway track"),
    (r"\bbicycl|cycling|bike\b", "bicycles"),
    (r"\bmotorcycl|scooter|moped", "motorcycles"),
    (r"\bbus(es|station|stop)\b|\bbuses\b", "public buses"),
    (r"\bminaret|mosque|masjid|jami\b", "a minaret"),
    (r"\bpagoda\b", "a pagoda roofline"),
    (r"\bstupa|chorten\b", "a Buddhist stupa"),
    (r"\bonion dome", "onion domes"),
    (r"\bchurch(es)?|cathedral|basilica|chapel|kirche|iglesia\b", "a church tower"),
    (r"\btemple(s)?\b|\bwat\b|\bshrine\b|torii", "temple architecture"),
    (r"\bsynagogue\b", "a synagogue"),
    (r"\bthatch", "thatched roofs"),
    (r"\bcorrugated|tin roof|zinc roof", "corrugated-iron roofs"),
    (r"\badobe|mud[- ]brick|mudbrick|pisé|rammed earth", "earth-brick walls"),
    (r"\bwhitewash|whitewashed", "whitewashed walls"),
    (r"\bhalf[- ]timber|fachwerk", "half-timbered houses"),
    (r"\blog (cabin|house)|wooden hous|timber hous|izba\b", "timber houses"),
    (r"\bpanelák|khrushchyovka|plattenbau|panel building|prefabricated hous", "prefab concrete blocks"),
    (r"\bskyscraper|high[- ]rise", "high-rise towers"),
    (r"\bcobble(stone)?|setts\b|pavé", "cobbled paving"),
    (r"\bterracotta roof|red[- ]tiled|tiled roof|roof tiles", "terracotta roof tiles"),
    (r"\bbalcon(y|ies)\b", "balconies"),
    (r"\barcade(s)?\b|colonnade|portico", "arcaded shopfronts"),
    (r"\bmarket|bazaar|bazar|souk|stall", "open-air market stalls"),
    (r"\bcafé|cafe\b|restaurant|teahouse|chaikhana", "street cafés"),
    (r"\brice (paddy|paddies|field|terrace)|paddy field", "rice paddies"),
    (r"\bterrac(ed|es) (field|farm|agricultur)", "terraced fields"),
    (r"\bvineyard|wine region", "vineyards"),
    (r"\bolive (grove|tree)", "olive groves"),
    (r"\btea (plantation|estate|garden)", "tea plantations"),
    (r"\bbanana|plantain plantation", "banana plants"),
    (r"\bcoconut|palm (tree|grove)|palmier|palmen", "palm trees"),
    (r"\bbaobab", "baobab trees"),
    (r"\beucalyptus|gum tree", "eucalyptus"),
    (r"\bbirch\b", "birch trees"),
    (r"\bconifer|spruce|pine forest|taiga|fir forest", "conifer forest"),
    (r"\bcact(us|i)|saguaro", "cactus"),
    (r"\bbamboo", "bamboo"),
    (r"\bsavanna|savannah|bushveld", "savanna grassland"),
    (r"\bsteppe|prairie|pampas", "open grassland"),
    (r"\bdesert|dune|erg\b|sahara|sand sea", "desert sand"),
    (r"\brainforest|jungle|tropical forest", "dense tropical forest"),
    (r"\btundra|permafrost", "treeless tundra"),
    (r"\bglacier|icecap|ice cap|iceberg", "glacial ice"),
    (r"\bfjord", "a fjord"),
    (r"\bvolcano|volcanic|caldera|crater lake", "a volcanic cone"),
    (r"\bsnow(y|-covered)?\b|schnee|neige", "snow on the ground"),
    (r"\bmountain|alps|andes|himalaya|highland|sierra\b|massif", "mountains on the skyline"),
    (r"\bbeach|seaside|coastline|shoreline|seafront|playa", "a coastline"),
    (r"\bharbou?r|port of|quay|wharf|jetty|marina", "a working harbour"),
    (r"\bcanal\b|gracht", "a canal"),
    (r"\briver|riverbank|rivière|rio\b", "a river"),
    (r"\blake\b|lac\b|lago\b|see\b", "a lake"),
    (r"\bwaterfall|falls\b|cascade", "a waterfall"),
    (r"\bbridge\b|brücke|pont\b|puente", "a bridge"),
    (r"\bcamel|dromedary", "camels"),
    (r"\bcattle|cows\b|zebu|oxen|bullock", "cattle"),
    (r"\bsheep|goats?\b|llama|alpaca|yak\b", "grazing livestock"),
    (r"\bhors(e|es)|donkey|mule|ox[- ]?cart|horse[- ]?cart", "working animals"),
    (r"\bwindmill|molen", "a windmill"),
    (r"\bwind turbine|wind farm", "wind turbines"),
    (r"\bpower line|pylon|utility pole|telephone pole", "overhead power lines"),
    (r"\bmural|street art", "painted wall murals"),
    (r"\bflag\b", "a national flag flying"),
    (r"\bfestival|parade|procession|carnival|fair\b", "a street celebration"),
    (r"\bstadium|football pitch|sports ground", "a sports ground"),
    (r"\bschool\b|university|campus", "school buildings"),
    (r"\bfort(ress)?|castle|citadel|kremlin|kasbah|qasr", "a fortified wall"),
    (r"\bruins?\b|archaeological", "stone ruins"),
    (r"\blighthouse", "a lighthouse"),
    (r"\bmonsoon|rainy season|flood", "wet-season conditions"),
]
CLUE_RULES = [(re.compile(p, re.I), c) for p, c in CLUE_RULES]

# Country-level cues, added ONLY when the metadata shows the relevant context
# (a road/vehicle for driving side; a sign/shop/market for script).
LEFT_HAND = set("""GB IE MT CY IN PK BD LK NP TH MY SG ID BN JP AU NZ PG FJ
ZA KE TZ UG ZM ZW MW MZ BW NA LS SZ MU SC JM TT BB BS GY SR HK MO TL WS TO
SB KI NR AG DM GD KN LC VC BM AI MS VG KY TC GI""".split())

SCRIPT = {
    "RU": "Cyrillic", "UA": "Cyrillic", "BY": "Cyrillic", "BG": "Cyrillic",
    "RS": "Cyrillic", "MK": "Cyrillic", "MN": "Cyrillic", "KZ": "Cyrillic",
    "KG": "Cyrillic", "TJ": "Cyrillic",
    "SA": "Arabic", "EG": "Arabic", "MA": "Arabic", "DZ": "Arabic", "TN": "Arabic",
    "LY": "Arabic", "IQ": "Arabic", "SY": "Arabic", "JO": "Arabic", "LB": "Arabic",
    "YE": "Arabic", "OM": "Arabic", "AE": "Arabic", "QA": "Arabic", "KW": "Arabic",
    "BH": "Arabic", "SD": "Arabic", "MR": "Arabic", "PS": "Arabic",
    "IR": "Persian (Perso-Arabic)", "AF": "Perso-Arabic", "PK": "Urdu (Nastaliq)",
    "GR": "Greek", "IL": "Hebrew", "IN": "Devanagari", "NP": "Devanagari",
    "TH": "Thai", "LA": "Lao", "KH": "Khmer", "MM": "Burmese", "LK": "Sinhala",
    "GE": "Georgian", "AM": "Armenian", "ET": "Ge'ez", "ER": "Ge'ez",
    "CN": "Chinese", "TW": "Chinese", "HK": "Chinese", "MO": "Chinese",
    "JP": "Japanese", "KR": "Korean", "BD": "Bengali", "MV": "Thaana", "BT": "Tibetan",
}
SIGN_CTX = re.compile(r"\b(sign|signage|shop|store|storefront|market|bazaar|souk|"
                      r"street|road|advert|billboard|kiosk|stall|station)\b", re.I)
ROAD_CTX = re.compile(r"\b(road|street|traffic|highway|car|cars|bus|buses|lorry|truck|"
                      r"motorway|junction|roundabout|driving|vehicle)\b", re.I)


def build_clues(iso2, blob, tag):
    clues, seen = [], set()
    for rx, c in CLUE_RULES:
        if len(clues) >= 3:
            break
        if c in seen:
            continue
        if rx.search(blob):
            clues.append(c)
            seen.add(c)
    if len(clues) < 4 and iso2 in LEFT_HAND and ROAD_CTX.search(blob):
        clues.append("left-hand traffic")
    if len(clues) < 4 and iso2 in SCRIPT and SIGN_CTX.search(blob):
        clues.append("%s script on signs" % SCRIPT[iso2])
    return clues[:4]


# ── harvest ────────────────────────────────────────────────────────────────
EXT_OK = re.compile(r"\.(jpe?g|png)$", re.I)


def harvest():
    iso = L.by_iso()
    only = None
    limit = None
    for i, a in enumerate(sys.argv):
        if a == "--only":
            only = set(sys.argv[i + 1].split(","))
        if a == "--limit":
            limit = int(sys.argv[i + 1])

    seeds = [s for s in SEEDS if not only or s[2] in only]
    if limit:
        seeds = seeds[:limit]

    print("resolving %d seed coordinates from en.wikipedia…" % len(seeds))
    coords = L.resolve_places([s[0] for s in seeds])
    missing = [s[0] for s in seeds if s[0] not in coords]
    if missing:
        print("  ! no coordinates for: %s" % ", ".join(missing))

    out = {}
    if os.path.exists(OUT):
        import json
        try:
            out = {e["id"]: e for e in json.load(open(OUT, encoding="utf-8"))}
            print("resuming with %d entries already on disk" % len(out))
        except Exception:
            out = {}

    stats = {"seeds": 0, "cand": 0, "rej": {}, "kept": 0, "http": 0}

    def bump(k):
        stats["rej"][k] = stats["rej"].get(k, 0) + 1

    for wp, label, iso2, tag in seeds:
        if wp not in coords:
            continue
        stats["seeds"] += 1
        lat0, lon0, _t = coords[wp]
        cn = (iso.get(iso2) or {}).get("n") or iso2
        place = "%s, %s" % (label, cn) if not label.endswith(cn) else label

        pages = L.geo_files(lat0, lon0, radius=10000, limit=250)
        picked = 0
        want = 3 if tag == "o" else 2
        scored = []
        for p in pages:
            stats["cand"] += 1
            title = L.title_of(p)
            if not EXT_OK.search(title):
                bump("not-a-photo-file")
                continue
            ii = (p.get("imageinfo") or [{}])[0]
            if not ii:
                bump("no-imageinfo")
                continue
            url, w, h = L.thumb_url(ii)
            if not url or w < 640:
                bump("too-small")
                continue
            if h and w and h / float(w) > 1.30:
                bump("portrait-orientation")
                continue
            lic = L.licence_of(ii)
            if not lic:
                bump("licence-not-shippable")
                continue
            cred = L.credit_of(ii)
            if not cred:
                bump("no-credit")
                continue
            cats = " | ".join(c.get("title", "").replace("Category:", "")
                              for c in (p.get("categories") or []))
            desc = L.clean(L.em(ii, "ImageDescription"), 200)
            blob = " ".join([title.replace("_", " "), desc, cats])
            r = L.rejected(blob)
            if r:
                bump("scene:" + r)
                continue
            if L.has_burned_place(title, place):
                bump("place-name-in-frame")
                continue
            if not L.SCENE_RE.search(blob):
                bump("no-outdoor-scene-word")
                continue
            co = (p.get("coordinates") or [{}])[0]
            if not co.get("lat"):
                bump("no-coordinates")
                continue
            lat, lon = round(float(co["lat"]), 5), round(float(co["lon"]), 5)
            if L.haversine((lat, lon), (lat0, lon0)) > 12:
                bump("coord-outside-seed")
                continue
            clues = build_clues(iso2, blob, tag)
            if len(clues) < 2:
                bump("under-2-clues")
                continue
            # prefer wide, well-described, ordinary scenes
            sc = 0
            sc += 3 * len(L.SCENE_RE.findall(blob)[:6])
            sc += 2 * len(clues)
            sc += 2 if w >= 1000 else 0
            sc += 2 if (h and w and 1.2 <= w / float(h) <= 2.0) else 0
            sc += 3 if re.search(r"\b(street|road|village|market|countryside|"
                                 r"town|view of|panorama|houses)\b", blob, re.I) else 0
            sc -= 4 if re.search(r"\b(museum|monument|memorial|statue|tower of|"
                                 r"palace|cathedral)\b", blob, re.I) else 0
            scored.append((sc, {
                "id": "p_" + L.slug(title.rsplit(".", 1)[0], 46),
                "url": url, "w": w, "h": h, "lat": lat, "lon": lon,
                "iso2": iso2, "place": place,
                "caption": desc[:150] if desc else title.replace("_", " ").rsplit(".", 1)[0],
                "credit": cred, "licence": lic,
                "page": "https://commons.wikimedia.org/wiki/" +
                        L.urllib.parse.quote("File:" + title.replace(" ", "_")),
                "clues": clues,
                "easy": 1 if tag == "L" else 0,
            }))
        scored.sort(key=lambda t: (-t[0], t[1]["id"]))
        for sc, e in scored:
            if picked >= want:
                break
            if e["id"] in out:
                continue
            st, ct = L.verify_url(e["url"])
            stats["http"] += 1
            if st != 200 or not ct.startswith("image/"):
                bump("http-%s" % st)
                continue
            e["ct"] = ct
            out[e["id"]] = e
            picked += 1
            stats["kept"] += 1
        print("  %-26s %-3s  cand=%-4d kept=%d  (total %d)" %
              (label[:26], iso2, len(pages), picked, len(out)))
        # ── CHECKPOINT: valid JSON on disk after every seed ──
        L.write_json(OUT, sorted(out.values(), key=lambda e: e["id"]))
        L.save_head_cache()

    L.write_json(OUT, sorted(out.values(), key=lambda e: e["id"]))
    L.save_head_cache()
    print("\nseeds=%d candidates=%d kept=%d  countries=%d" %
          (stats["seeds"], stats["cand"], stats["kept"],
           len({e["iso2"] for e in out.values()})))
    print("top rejects:")
    for k, v in sorted(stats["rej"].items(), key=lambda t: -t[1])[:22]:
        print("   %-28s %d" % (k, v))


if __name__ == "__main__":
    harvest()
