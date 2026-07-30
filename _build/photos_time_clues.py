#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
photos_time_clues.py -- derive `clues` for every row of _build/photos-time.json.

AD_PHOTOS.place ships 2-4 `clues` per photo (things actually visible in the
frame) and the cabinets use them for the hint ladder and for the offline
text-only fallback. The `time` harvest never built any, because photos_time.py
predates the clue machinery in photos_place.py.

This adds them WITHOUT re-harvesting: every row already records its Commons
file page, so the file's own title + description + category list is re-fetched
through photos_lib.hydrate (which is cache-first -- a re-run after the harvest
is almost entirely local) and fed through the same rule table.

Two rule sets are applied, in order:

  ERA_RULES    period tells that help you DATE a photograph -- horse-drawn
               traffic, trams, biplanes, steam, crinolines, a Model-T-shaped
               car, neon, satellite dishes. This is the half that `place`
               does not need and the year game lives on.
  CLUE_RULES   photos_place.build_clues, unchanged -- terrain, architecture,
               script on signs, driving side. Useful for the location half.

Clues are only ever asserted from the file's OWN metadata; nothing is inferred
from the year (that would leak the answer) and nothing is invented. A row that
yields fewer than 2 clues keeps whatever it got -- the cabinet degrades to
"no clues on this one" rather than showing a guess.

    python3 _build/photos_time_clues.py [--limit N] [--dry]
"""

import collections
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import photos_lib as L      # noqa: E402
import photos_place as P    # noqa: E402

TIME_IN = os.path.join(L.BUILD, "photos-time.json")

# Period tells. Order matters: the first three that fire are the ones shown, so
# the strongest dating signals come first.
ERA_RULES = [
    (r"\b(?:horse[- ]?drawn|horse[- ]?cart|hansom|carriage|coachman|ox[- ]?cart|"
     r"bullock cart|donkey cart|cart horse)\b", "horse-drawn traffic"),
    (r"\b(?:tram(?:way|car)?s?|streetcars?|trolleybus(?:es)?|cable car)\b", "tram or trolley wires"),
    (r"\b(?:steam (?:locomotive|engine|train|ship|tug|ferry)|paddle steamer|funnel)\b", "a steam engine"),
    (r"\b(?:steam )?locomotives?|railway station|train station|goods yard|marshalling yard\b",
     "a railway"),
    (r"\b(?:biplanes?|airships?|zeppelins?|dirigibles?|balloons?)\b", "an early aircraft"),
    (r"\b(?:propeller|piston[- ]engined|airliner|aerodrome|airfield)\b", "propeller aviation"),
    (r"\b(?:gas ?lamps?|gas lighting|gaslight|lamplighter)\b", "gas street lighting"),
    (r"\b(?:neon|illuminated sign|advertising hoarding|billboards?)\b", "lit advertising"),
    (r"\b(?:telegraph|telephone) (?:poles?|wires?|lines?)\b", "telegraph wires"),
    (r"\b(?:television aerials?|tv aerials?|rooftop aerials?)\b", "rooftop TV aerials"),
    (r"\b(?:satellite dish(?:es)?|air conditioning units?|air[- ]?con)\b", "satellite dishes or AC units"),
    (r"\b(?:mobile phones?|smartphones?|laptops?|selfie)\b", "handheld electronics"),
    (r"\b(?:crinolines?|top hats?|bowler hats?|parasols?|frock coats?)\b", "period dress"),
    (r"\b(?:headscarves|headscarf|chador|hijab|saris?|kimonos?|turbans?)\b", "traditional dress"),
    (r"\b(?:bomb damage|air raid|rubble|ruined buildings?|reconstruction|rebuilding)\b",
     "war damage or rebuilding"),
    (r"\b(?:scaffolding|cranes?|building site|construction site|under construction)\b",
     "construction in progress"),
    (r"\b(?:cobbles?|cobbled|setts?|unpaved|dirt road|dusty road)\b", "an unpaved or cobbled road"),
    (r"\b(?:tarmac|asphalt|road markings?|zebra crossing|pedestrian crossing|traffic lights?)\b",
     "modern road markings"),
    (r"\b(?:parked cars?|motor ?cars?|automobiles?|saloon car|lorr(?:y|ies)|trucks?|buses|bus\b)\b",
     "motor vehicles"),
    (r"\b(?:bicycles?|cyclists?|rickshaws?|tuk[- ]?tuks?|scooters?|mopeds?|motorcycles?)\b",
     "two- and three-wheelers"),
    (r"\b(?:market|bazaar|souk|stalls?|vendors?|hawkers?)\b", "a street market"),
    (r"\b(?:crowds?|procession|parade|demonstration|rally|festival)\b", "a crowd in the street"),
    (r"\b(?:sailing ships?|masts?|rigging|schooner|barque|junks?|dhows?)\b", "sailing rigs in port"),
    (r"\b(?:tower blocks?|high[- ]rise|skyscrapers?|concrete slab|prefab)\b", "post-war high-rise"),
    (r"\b(?:thatch(?:ed)?|mud brick|adobe|wattle)\b", "vernacular building"),
    # Commons category vocabulary. These phrases are how the archive labels a
    # scene ("Streets in Dakar", "Automobiles photographed in 1969"), and they
    # are far more reliable than the free-text description, which is often not
    # in English at all.
    (r"\b(?:automobiles?|motor vehicles?|road vehicles?|taxis?)\b", "motor vehicles"),
    (r"\b(?:tramways|trams in|trolleybuses in)\b", "tram or trolley wires"),
    (r"\b(?:railway stations?|railroad stations?|railways? in|railroads? in|"
     r"rail transport|trains? in)\b", "a railway"),
    (r"\b(?:aircraft|aviation|airports?|airlines?|aeroplanes?|airplanes?)\b", "aviation"),
    (r"\b(?:streets? in|streets? of|roads? in|avenues?|boulevards?|thoroughfare)\b",
     "a city street"),
    (r"\b(?:squares? in|plazas?|piazzas?|city square|main square)\b", "a public square"),
    (r"\b(?:shops?|storefronts?|department stores?|shopfronts?|retail)\b", "shopfronts"),
    (r"\b(?:hotels?|restaurants?|bars? in|pubs?)\b", "hospitality frontage"),
    (r"\b(?:churches?|cathedrals?|chapels?|basilicas?)\b", "a church"),
    (r"\b(?:mosques?|minarets?|madrasas?|madrassahs?)\b", "a mosque"),
    (r"\b(?:synagogues?)\b", "a synagogue"),
    (r"\b(?:temples?|pagodas?|stupas?|shrines?)\b", "a temple or pagoda"),
    (r"\b(?:parks? in|gardens? in|public gardens?|promenades?)\b", "a public park"),
    (r"\b(?:soldiers?|troops?|military|army|regiments?|uniforms?|parade ground)\b",
     "people in uniform"),
    (r"\b(?:ships?|boats?|ferries|ferry|barges?|canoes?|fishing vessels?)\b", "boats on the water"),
    (r"\b(?:factor(?:y|ies)|industrial|mills?|refiner(?:y|ies)|chimneys?|smokestacks?|"
     r"warehouses?)\b", "industrial buildings"),
    (r"\b(?:schools?|universit(?:y|ies)|colleges?|classrooms?)\b", "a school or campus"),
    (r"\b(?:hospitals?|clinics?)\b", "a hospital"),
    (r"\b(?:bird'?s[- ]eye|panoramas?|panoramic views?|views? from|skylines?|"
     r"cityscapes?|rooftops?)\b", "a view over the rooftops"),
    (r"\b(?:children|schoolchildren|women in|men in|pedestrians?|passers[- ]by|"
     r"people of|people in)\b", "people going about their day"),
]
ERA_RULES = [(re.compile(p, re.I), c) for p, c in ERA_RULES]


def build_clues(iso2, blob):
    """<=3 clues: era tells first, then photos_place's place tells."""
    out, seen = [], set()
    for rx, c in ERA_RULES:
        if len(out) >= 2:
            break
        if c in seen:
            continue
        if rx.search(blob):
            out.append(c)
            seen.add(c)
    for c in P.build_clues(iso2, blob, ""):
        if len(out) >= 3:
            break
        if c not in seen:
            out.append(c)
            seen.add(c)
    return out[:3]


def title_from_page(page):
    """https://commons.wikimedia.org/wiki/File:Foo_bar.jpg -> 'File:Foo bar.jpg'"""
    raw = re.sub(r"^.*/wiki/", "", page or "")
    return L.urllib.parse.unquote(raw).replace("_", " ")


def main():
    dry = "--dry" in sys.argv
    limit = None
    for i, a in enumerate(sys.argv):
        if a == "--limit":
            limit = int(sys.argv[i + 1])

    rows = json.load(open(TIME_IN, encoding="utf-8"))
    todo = [e for e in rows if not e.get("clues")]
    if limit:
        todo = todo[:limit]
    print("rows=%d  needing clues=%d" % (len(rows), len(todo)))

    by_title = {}
    titles = [title_from_page(e["page"]) for e in todo]
    for i in range(0, len(titles), 20):
        part = titles[i:i + 20]
        by_title.update(L.hydrate(part, chunk=20, prefix="tclue"))
        sys.stdout.write("\r  hydrated %d/%d" % (min(i + 20, len(titles)), len(titles)))
        sys.stdout.flush()
    print()

    hist = collections.Counter()
    got = 0
    for e in todo:
        p = by_title.get(title_from_page(e["page"]))
        if not p:
            hist["no-page"] += 1
            continue
        ii = (p.get("imageinfo") or [{}])[0]
        cats = " | ".join(c.get("title", "").replace("Category:", "")
                          for c in (p.get("categories") or []))
        desc = P.clean_caption(L.clean(L.em(ii, "ImageDescription"), 260))
        title = L.title_of(p).replace("_", " ").rsplit(".", 1)[0]
        blob = " ".join([title, desc, cats])
        cl = build_clues(e["iso2"], blob)
        hist[len(cl)] += 1
        if cl:
            e["clues"] = cl
            got += 1

    print("clue counts: " + "  ".join("%s=%d" % kv for kv in sorted(hist.items(), key=str)))
    print("rows with clues now: %d/%d" %
          (sum(1 for e in rows if e.get("clues")), len(rows)))
    if dry:
        print("--dry: not written")
        return
    L.write_json(TIME_IN, rows)
    print("wrote %s" % TIME_IN)


if __name__ == "__main__":
    main()
