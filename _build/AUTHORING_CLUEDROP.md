# CLUEDROP notes authoring spec

CLUEDROP is GeoGuessr's reasoning half written out in words: a country described
one concrete detail at a time, no photograph. Five of the six clues are GENERATED
at runtime from `core/data/countries.js` (hemisphere, continent, traffic side,
script, currency, land borders, population band, capital initial), so they are
always true. **Rung 6 is the hand-authored one, and that is what you are writing.**

A country only enters the daily pool if it has **at least 2 authored notes**. The
pool is currently 98 countries; you are taking it to every UN member (194).

## Output — write a JSON file, incrementally

Write to the exact path you were given, e.g. `_build/cluedrop_x1.json`:

```json
{
 "ZW": [["ROADSIDE", "Granite boulders balanced in piles beside the highways, and jacaranda avenues in the capital."],
        ["MONEY", "The currency has been replaced so many times that shops quote prices in US dollars."],
        ["SPORT", "Cricket and football share the sports pages, unusually for the region."]],
 "AD": [["ROADS", "..."], ["SHOPS", "..."]]
}
```

**Write the file after every 8–10 countries and keep overwriting it with the
longer version.** Never hold the batch to the end — if you are interrupted,
anything not on disk is lost. The file must be valid JSON on every write.

## Hard rules

1. Every country gets **2 or 3** notes. Three is better; two is the minimum.
2. Each note is `[TAG, sentence]`. `TAG` is a short uppercase label, ≤ 12 chars,
   naming the *kind* of detail: `ROADSIDE` `ROADS` `MONEY` `PLUGS` `SHOPS`
   `SPORT` `DRINK` `FOOD` `LANGUAGE` `SIGNS` `PLATES` `TREES` `RAIL` `POST`
   `PHONES` `MUSIC` `BUILDINGS` `WEATHER` `WILDLIFE` `FARMING`.
3. Sentence is **≤ 130 characters**, one sentence, ends with a full stop.
4. **The note must never name the country, its capital, its demonym, any of its
   own alternative names, or a name that contains them.** A validator checks this
   against every name/capital/demonym in `countries.js` and will reject the note.
   Naming a *neighbour* is fine and often the best clue.
5. Do not duplicate a note sentence across countries.
6. Only ISO2 codes you were assigned. Do not touch a country another batch owns.

## What makes a good note

- **Physical, visible, roadside things**: what is in the wall socket, what is
  printed on the banknotes, the trees along the road, the shape and colour of the
  number plates, the shop on the corner, the gauge of the railway, the postboxes,
  the phone network's name, the national sport, the roofing material, the bus
  type, what the police cars look like.
- **Deliberately NOT the country's most famous monument.** This is the GeoGuessr
  meta written out, not a tourist board. "A canal cuts the country in two and
  ships queue at both ends of it" is on the line and acceptable; "home of the
  pyramids" is not.
- **No claims about what people are like. No stereotypes.** Nothing about
  temperament, beauty, work ethic, hospitality, honesty, or intelligence.
- **Only facts you are confident of.** Where a detail is uncertain, dated or
  disputed, give the country a different detail. A wrong clue is worse than no
  clue, because every generated clue is true and the player has to be able to
  trust the whole ladder. Currency reforms, plug types and driving side change —
  check anything you are shaky on with WebSearch/WebFetch.
- Aim for one note that a knowledgeable player could crack cold, and one that
  narrows it to two or three candidates.
- Neutral on politics. Contested territory, wars and sanctions may be mentioned
  factually if genuinely roadside-visible (e.g. a divided capital, a closed land
  border), never as a judgement or a joke.

## Read first

`/Users/mishasalahshoor/cbai-ops/misha-arcade/core/data/cluedrop.js` — the
existing `notes` block for the 98 countries already done. Match that voice
exactly, and do not reuse its sentences.

## Validate

From the repo root:

```bash
python3 _build/check_cluedrop_notes.py _build/<your_file>.json
```

It must print `OK`. Fix everything it reports and re-run until clean.
