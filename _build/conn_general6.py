# -*- coding: utf-8 -*-
"""GENERAL pack, batch 6: travel, transport and the road. Vehicles hide inside
ordinary words, departure boards and road signs get quoted verbatim, and several
innocent nouns turn out to be map furniture, car parts or somewhere to stand."""

BOARDS = [

{
 "title": "Excess Baggage",
 "diff": 3,
 "groups": [
   {"name": "___ CLASS", "tiles": ["FIRST", "ECONOMY", "MASTER", "WORKING"],
    "note": "First class, economy class, masterclass, working class. Only two get you a seat."},
   {"name": "WHAT THE DEPARTURE SCREEN SAYS", "tiles": ["BOARDING", "DELAYED", "FINAL CALL", "ON TIME"],
    "note": "Four states of an orange dot-matrix. Only one of them means go."},
   {"name": "INSIDE AN AIRLINER", "tiles": ["CABIN", "GALLEY", "AISLE", "CARGO HOLD"],
    "note": "The galley is the kitchen, a ship word long before it was a plane word."},
   {"name": "HIDING A VEHICLE", "tiles": ["PLANET", "STRAINED", "VANDAL", "SCARLET"],
    "note": "PLANE-t, s-TRAIN-ed, VAN-dal, s-CAR-let. Four ways out of town."},
 ],
 "traps": [
   ["CABIN", 3, "CABIN opens with a CAB, which is exactly the trick the last group is running"],
   ["CARGO HOLD", 3, "CARGO HOLD starts with a CAR and hides it about as well as CABIN hides the cab"],
 ],
 "epilogue": "CABIN carries a CAB and CARGO HOLD carries a CAR. The vehicles only had four seats.",
},

{
 "title": "Give Way",
 "diff": 3,
 "groups": [
   {"name": "___ WAY", "tiles": ["HIGH", "DRIVE", "SUB", "RUN"],
    "note": "Highway, driveway, subway, runway. Four ways out, none of them level."},
   {"name": "ON A BICYCLE", "tiles": ["PANNIER", "SPOKE", "DERAILLEUR", "MUDGUARD"],
    "note": "The derailleur derails the chain on purpose, which is the whole idea."},
   {"name": "WORDS ON A UK ROAD SIGN", "tiles": ["KEEP CLEAR", "NO ENTRY", "HUMPS", "PEDAL CYCLES"],
    "note": "Keep clear, no entry, humps, pedal cycles. Britain signs bluntly."},
   {"name": "BRITISH NAME FOR A CAR PART", "tiles": ["BONNET", "BOOT", "WING", "SILENCER"],
    "note": "Americans say hood, trunk, fender and muffler. Same four bits of car."},
 ],
 "traps": [
   ["MUDGUARD", 3, "Mudguard is a perfectly British word for the panel over a car wheel too"],
   ["PEDAL CYCLES", 1, "PEDAL is the first thing anybody names on a bicycle, and it is right there"],
 ],
 "epilogue": "MUDGUARD fits a car and PEDAL CYCLES starts on a bicycle. Neither group had a spare seat.",
},

{
 "title": "Signal Failure",
 "diff": 4,
 "groups": [
   {"name": "___ TRAIN", "tiles": ["GRAVY", "GHOST", "WAGON", "BULLET"],
    "note": "Gravy train, ghost train, wagon train, bullet train. One of them is real."},
   {"name": "WHY A BRITISH TRAIN IS LATE", "tiles": ["LEAVES", "FLOODING", "LANDSLIP", "LIVESTOCK"],
    "note": "Crushed leaves leave a black film on the rail. It is genuinely like ice."},
   {"name": "ON A RAILWAY TRACK", "tiles": ["BALLAST", "SLEEPER", "POINTS", "THIRD RAIL"],
    "note": "Ballast is the stone that stops the whole line wandering off in summer."},
   {"name": "___ STATION", "tiles": ["PETROL", "POLICE", "SPACE", "FIRE"],
    "note": "Petrol, police, space, fire. Not a platform among them."},
 ],
 "traps": [
   ["SLEEPER", 0, "The sleeper is a train in its own right, the overnight one up to Fort William"],
   ["GHOST", 3, "Disused Underground stops are known to everybody as ghost stations"],
 ],
 "epilogue": "SLEEPER is also a train and GHOST is also a station. The line only stops four times.",
},

{
 "title": "You Are Here",
 "diff": 3,
 "groups": [
   {"name": "WORDS MEANING TO WANDER", "tiles": ["ROAM", "STRAY", "RAMBLE", "MEANDER"],
    "note": "The Meander is a river in Turkey that never once tried a straight line."},
   {"name": "HOMOPHONES OF PLACES", "tiles": ["CHILLY", "GREASE", "HUNGRY", "WAILS"],
    "note": "Chile, Greece, Hungary, Wales. Not one of them spelled right."},
   {"name": "RIGHTS OF WAY IN BRITAIN", "tiles": ["BRIDLEWAY", "TOWPATH", "BYWAY", "FOOTPATH"],
    "note": "A towpath is where the horse walked while the barge did the floating."},
   {"name": "IN THE CORNER OF A MAP", "tiles": ["LEGEND", "SCALE", "KEY", "INSET"],
    "note": "Legend, scale, key, inset. Everything a map says about itself."},
 ],
 "traps": [
   ["ROAM", 1, "ROAM is Rome said out loud, and Rome is as much a place as the other four"],
 ],
 "epilogue": "ROAM is Rome out loud, but the places already have four. The wandering keeps it.",
},

]
