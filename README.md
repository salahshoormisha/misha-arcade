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
  through Persian myth and Achaemenid history. **Two campaigns**: the *Haft Khān*,
  Rostam's Seven Trials out of Ferdowsī's Shāhnāmeh; and the *Royal Road*, which runs
  from Kāveh the blacksmith's leather apron to Angra Mainyu himself by way of
  Zahhāk, the Chinvat Bridge, Esther at Susa and the writing on Belshazzar's wall.
  Five heroes, 113 cards, 46 monsters, 48 talismans, 24 branching omens, and **Farr** —
  a divine-glory meter that summons the Simurgh when it fills. Play it alone, or
  **together on two different machines** with a four-letter room code.

## MISHANAMEH, technically

No build step, no dependencies, no image or audio files — the whole thing is generated:

- **Every creature is drawn at runtime.** `bestiary.js` renders each monster as a
  Sasanian silver plate — a gilt dish, a beaded pearl roundel, a beast in strict
  profile raised in repoussé — from a parameterised vector creature generator.
  Heroes get Achaemenid limestone relief instead, with a winged Faravahar overhead
  and Old Persian cuneiform along the bottom. There are no emoji left in the game.
- **The background is real geometry.** `art.js` draws an authentic 8-fold *khatam*
  girih tiling from the {8/3} star polygon, tiles it seamlessly, and parallaxes it
  over summed-sine ridgelines with a per-Trial sky palette.
- **The score is generated, in tune.** `music.js` is a four-piece ensemble —
  santur, ney, tanbur drone, tombak — improvising inside a Persian *dastgāh* over a
  6/8 cycle, picking *gushe* figures and leaning on the mode's *shāhed*. Intervals
  are specified in **cents**, so the koron second of Shur is a true quarter-tone.
  Bosses switch mode. `voice.js` is a naqqāl narrator over speech synthesis.
- **Two people, two machines, no server.** `net.js` is a hand-rolled MQTT 3.1.1
  client over WebSocket that races three public brokers and fails over between
  them; `coop.js` is host-authoritative, so there is one simulation and nothing to
  de-sync. The wire format is the existing save file. In combat everybody acts at
  once and the enemies move when the last person is done.
- **The Chinvat Bridge is not a card game.** `minigames.js` is a balancing walk
  across an abyss on a plank that narrows to a razor, with your own conscience
  waiting at the far end wearing a face that depends on how you crossed.
- **State is plain JSON**, so a run autosaves mid-combat and restores exactly.
- `_fuzz.js` (dev only) is the test harness: static audit, a random-play fuzzer with
  invariant checks and save/restore round-trips, a full-road path fuzzer, and a
  heuristic bot used to tune the difficulty curve. `_plates.html` is a contact sheet
  of every drawn creature.

Everything else: pure HTML/canvas/WebAudio.
