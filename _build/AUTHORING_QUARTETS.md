# QUARTETS board authoring spec (read this whole file before writing a line)

You are writing one Python module under `_build/` that defines a single list called
`BOARDS`. Nothing else. It is `exec`'d by `_build/gen_connections2.py`, which validates
every board and emits `core/data/connections.js`.

## The players

Two strong daily solvers who play together every morning: **Misha** (she/her,
Persian-American, from Houston) and **David** (from London). Six years together in
**Edinburgh**, now in **Cambridge, Massachusetts**, planning London eventually. Both
Man United fans.

They rejected an earlier cabinet as **"too niche, too hard, and spiky."** That is the
bar you are clearing. Warm and funny, never cloying. No romance clichés, no "aww you
two" voice. **Never name a real colleague or build office/work content — they
explicitly declined it.**

## The file

```python
# -*- coding: utf-8 -*-
"""One-paragraph docstring: what this batch is."""

BOARDS = [

{
 "title": "Short Flavour Title",          # shown above the grid, Title Case, <= 22 chars
 "diff": 2,                               # 1..5, authored difficulty
 "groups": [                              # EXACTLY 4, ORDERED EASIEST -> HARDEST
   {"name": "CATEGORY NAME",              # UPPERCASE, <= 34 chars
    "tiles": ["ALPHA", "BRAVO", "CHARLIE", "DELTA"],
    "note": "One tight line of colour."}, # <= 75 chars. HARD LIMIT.
   {...}, {...}, {...},
 ],
 "traps": [                               # 1..3 declared double-fits. See below.
   ["CHARLIE", 2, "why it also reads as group index 2"],   # why <= 90 chars
 ],
 "epilogue": "The traps, named. <= 115 chars. HARD LIMIT.",
},

]
```

Group order **is** the colour: index 0 = yellow (easiest), 1 = green, 2 = blue,
3 = purple (hardest). You never write a colour.

## Hard validator rules — a violation fails the build

1. Exactly 4 groups, exactly 4 tiles each, 16 **distinct** tiles per board.
2. Tiles are **UPPERCASE**, `<= 14` characters, and may contain only letters
   (accents fine), digits, space, and `' - . & / , : ! ?`.
3. Every group has a non-empty `note`; every board has a non-empty `epilogue`.
4. `diff` is 1..5.
5. A tile must **never** appear as a whole word inside its own category name.
   (`PASTA SHAPES` containing tile `PASTA` = failure.)
6. **`note` <= 75 chars, `epilogue` <= 115 chars, trap reason <= 90 chars.** These are
   byte-budget limits — the shipped file is already large. Be punchy, not thorough.
7. Every board must be **uniquely solvable**. See traps.
8. Do not reuse a category name that another board in your batch already uses.
9. Prefer fresh tile strings. A tile string may appear in at most 6 boards across the
   whole 400-board dataset, so avoid obvious repeats like `RED` or `PARK`.

## Traps and unique solvability (the one subtle rule)

Declare, in `traps`, every tile you deliberately made ambiguous:
`["TILE", other_group_index, "one line on why it also fits there"]`.

The validator enumerates every way to partition the 16 tiles into four groups of four
where each tile sits in its true group **or** any group you declared for it, and
requires exactly **one** legal partition.

A single trap can never break uniqueness (moving one tile leaves one group with 3 and
another with 5). Uniqueness only breaks on a **cycle**. So:

- SAFE: `["ORANGE", 2, ...]` and `["MERCURY", 3, ...]` — different directions.
- SAFE: two tiles from group 0 that both also read as group 1.
- **FAILS**: a tile whose true group is 0 that also fits 1, *plus* a tile whose true
  group is 1 that also fits 0. They swap. Never declare a 2-cycle.
- **FAILS**: a 3-cycle (0→1, 1→2, 2→0).

Every board **must** declare at least one trap. A board with no double-fit is not a
Connections board, it is a quiz.

## Quality bar — this is most of the job

- **One genuinely accessible group and one genuinely tricky group per board.** The
  yellow should be gettable in five seconds; the purple should make them stop.
- **Never build a board out of four clean taxonomies.** Four stadiums / four countries /
  four elements gives itself away instantly — the *kind* of thing labels the group
  before any thought happens. Mix registers: one wordplay group, one "___ WORD"
  compound group, one hidden-word or homophone group, one knowledge group.
- **The overlap must be real.** At least one tile that a smart player will confidently
  put in the wrong group, and the resolution must come from counting, not trivia.
- Recurring shapes that work: `___ SUFFIX` / `PREFIX ___` compounds; words hiding a
  smaller word; homophones of something else; anagrams; "words that become other words
  when you add a letter"; things that share a hidden numeric or alphabetic property;
  famous namesakes; things preceded by the same word.
- **Difficulty spread must be even.** Across your batch: roughly 15% diff 1, 25% diff 2,
  30% diff 3, 20% diff 4, 10% diff 5. Day 300 must not be harder than day 5.
  Calibrate so a good day scores ~70-75 out of 100 and an excellent one ~90.
- Facts in notes must be **true**. If you are not certain, cut it or rewrite the group.
  Do not invent etymologies.
- No slurs, no punching down, no content that turns a living conflict into a punchline.

## Voice for `note` and `epilogue`

Dry, specific, one beat of surprise. Examples that hit the length budget:

```
"note": "p-OTTER-y, c-RAT-er, sh-APE-ly, pr-OWL-er. You cannot unsee them."
"note": "Orzo means 'barley', which it very much is not."
"epilogue": "SANGAK, BARBARI and TAFTOON are three breads hunting a fourth. The fourth was never there."
```

Do not write "Did you know?", do not address the players as a couple, do not use
exclamation marks in notes.

## Before you finish

Run this from the repo root — it is the real validator, and it must print `OK`:

```bash
python3 _build/gen_connections2.py --check-module <your_module_name>
```

Fix everything it reports. Then report: module path, board count, difficulty spread,
and any board you were unsure about.
