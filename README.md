# MISHA'S MIDNIGHT ARCADE 🕹️

Four cabinets, one name — built overnight, with love, by Claude.

**Play it: https://salahshoormisha.github.io/misha-arcade/**

- **MISHA-MAN** — a Pac-Man homage where the maze walls spell M·I·S·H·A in neon.
  Light up every letter, outrun the office ghosts (DEADLINE, INBOX, MEETINGS, BUDGET),
  and yes — the chomp says *mish mish mish*. Duo Date Mode: player 2 is David, on WASD.
- **TETRISHA** — modern Tetris (SRS kicks, hold, 7-bag) where every line clear lights a
  letter of M·I·S·H·A. Spell it all and DAVID sends a heart piece that detonates.
  His name is a melody (D·A·V·I·D); so is hers.
- **FOURMATIONS** — football Connections with the archive The Athletic never built.
  36 hand-authored boards of Premier League, Man United, Champions League and World Cup
  lore, plus wordplay puzzles and a ⚔️ duel mode that keeps a running Misha-v-David score.
  Lives in its own repo: [salahshoormisha/fourmations](https://github.com/salahshoormisha/fourmations).
- **MISHANAMEH** (میشانامه, "the Book of Misha") — a full **deck-building roguelike**
  through the **Haft Khān**, the Seven Trials of Rostam from Ferdowsī's *Shāhnāmeh*.
  Three heroes (Rostam, Gordāfarid, Zāl), 81 cards, 37 talismans, 30 monsters out of
  Persian myth, 16 branching omens, and **Farr** — a divine-glory meter that summons the
  Simurgh when it fills. Seven difficulty Khāns, a hidden eighth trial, and a **Codex**
  that explains the real history behind every single card, monster and word in it.

## MISHANAMEH, technically

No build step, no dependencies, no image or audio files — the whole thing is generated:

- **The background is real geometry.** `art.js` draws an authentic 8-fold *khatam*
  star-and-cross girih tiling from the {8/3} star polygon, tiles it seamlessly, and
  parallaxes two layers of it over summed-sine ridgelines with a per-Trial sky palette.
- **The sound is real Persian modal music.** `audio.js` synthesises santur, tombak and
  ney from oscillators and filtered noise, tuned in **cents** — so the *koron* (half-flat)
  second of Dastgāh-e Shur is the actual quarter-tone interval, not a piano approximation.
  Boss fights switch to Chahārgāh.
- **State is plain JSON**, so the run autosaves mid-combat and restores exactly —
  close the tab in the middle of a boss fight and pick it up later.
- `_fuzz.js` (dev only, not loaded by the page) is the test harness: a static audit,
  a random-play fuzzer with invariant checks and save/restore round-trips, a full-road
  path fuzzer, and a heuristic bot used to tune the difficulty curve.

Everything else: pure HTML/canvas/WebAudio.
