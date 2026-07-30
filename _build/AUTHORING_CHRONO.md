# CHRONO clue-bank authoring spec

CHRONO is the offline answer to TimeGuessr: no photographs. One **year** per day,
five clues about that year revealed one at a time, each worth less than the last.
The player moves a slider/number field to a year and guesses.

The pool is being grown from 30 days to 400+. The playable range is widening to
**1800–2025**.

## Output — write a JSON file, incrementally

Write to the exact path you were given, e.g. `_build/chrono_x3.json`. It is a JSON
array of entries:

```json
[
 {"y": 1934,
  "n": "one-line note naming the year's headline, shown after the round",
  "c": ["hardest clue", "clue 2", "clue 3", "clue 4", "most obvious clue"]}
]
```

**Write the file after every 8–10 entries and keep overwriting it with the longer
version.** Do not hold your whole batch until the end — if you are interrupted,
everything not yet on disk is lost. The file must be valid JSON every time you
write it.

## Hard rules (a validator enforces all of these; violations are dropped)

1. Exactly **5 clues**, all non-empty, each **≤ 190 characters** (it has to fit a
   375 px phone).
2. **No four-digit number between 1700 and 2100 anywhere in any clue or note.**
   Not the answer year, not a nearby year, not an unrelated year. Spell it
   differently or cut the fact. This is the single most common failure.
3. Clues run **hardest first, most obvious last**. Clue 1 should be gettable only
   by someone who really knows the period; clue 5 should be the thing everyone
   remembers about that year.
4. **No duplicate clue text anywhere in the bank**, across all batches. Do not
   reuse a sentence with a word changed.
5. `y` inside the range you were assigned. **At most 2 entries for any one year**,
   and if you write two for the same year they must share **no** clue and no
   subject matter.
6. `n` is one sentence, ≤ 150 chars, and *may* name the events but still must not
   contain a four-digit year.

## Quality bar

The two players are strong daily solvers: Misha (Persian-American, from Houston)
and David (from London). Six years in Edinburgh, now Cambridge Massachusetts.
Calibrate so a good day scores ~70–75 out of 100 and an excellent one ~90 — i.e.
a well-informed player should typically land the year from clue 2 or 3.

- **Mix domains inside every year**: science, technology, world events, culture,
  music, sport, everyday life, business. Never five political events.
- **Genuinely global.** Do not write five decades of Anglo-American history. Each
  batch should carry Asia, Africa, Latin America and the Middle East throughout,
  not as tokens.
- **Concrete and visual, not abstract.** "A pendulum hung under the dome of the
  Panthéon swung slowly off course all day" beats "a physicist demonstrated
  Earth's rotation."
- **Never name the answer.** Also avoid naming a thing whose own name contains the
  year (no "the Revolution of ..."), and avoid "the first ... ever" phrasing when
  the date is disputed.
- **Every clue must be a dated, checkable fact.** Where a thing was invented in
  one year and patented the next, word the clue to match the year you filed it
  under, or drop it. **If you are not certain of the year, cut the clue.** A wrong
  clue is worse than a missing one because the player must be able to trust the
  ladder. Use WebSearch / WebFetch to check anything you are shaky on — especially
  1800–1849 and anything post-2015.
- Dry, specific voice. No "Did you know", no exclamation marks, no addressing the
  players.
- Nothing about a living private individual's personal life. Wars and atrocities
  may be stated plainly and neutrally; never as a quip.

## Read first

`/Users/mishasalahshoor/cbai-ops/misha-arcade/_build/chrono_bank_a.py` — the 30
existing entries (1851–1899). Match that voice, and **do not reuse any of its
clue sentences or its subject matter for the same year.**

## Validate

From the repo root:

```bash
python3 _build/check_chrono.py _build/<your_file>.json
```

It must print `OK`. Fix everything it reports and re-run until clean.
