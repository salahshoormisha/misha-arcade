# DAILY WING — RESUME SHEET

If a session ended mid-build (usage limit, crash, closed laptop), start here.
Everything needed to continue is on disk and in git. Nothing lives only in a
model's head.

**Last updated:** 2026-07-25, during the initial build.

---

## 1. What this is

A new wing of ~20 daily puzzle games being added to Misha's Midnight Arcade,
alongside the four existing cabinets. Misha and David play NYT/OEC/geo daily
games together; this rebuilds their whole lineup with an archive, practice
modes, a shared daily card, a serverless head-to-head league, and a
cross-game country passport.

Binding spec: **`_build/CONTRACT.md`** — read it first, it is the interface
between the shared core and every game.
Researched mechanics for all 21 source games: **`_build/RESEARCH.md`**
(339 KB, one section per game: exact rules, scoring formulas, share formats,
weaknesses, improvement ideas). Machine-readable: `_build/RESEARCH.json`.

---

## 2. State of play

### DONE and committed
| Thing | Path | Notes |
|---|---|---|
| Core engine | `core/arcade.js` | daily seeding, stats, streaks, 0-100 norm, share, duel links, passport, backup |
| UI kit | `core/ui.js` | header, modal, toast, keyboard, result sheet, settings, archive |
| Design system | `core/style.css` | Y2K neon tokens + `.ac-*` components |
| Sound | `core/audio.js` | WebAudio only, reuses the arcade's note motifs |
| Map/globe | `core/worldmap.js` | equirect + orthographic, click-to-guess, silhouettes, heat |
| Flags | `core/flagart.js` | loads + draws the real SVGs |
| Registry | `core/registry.js` | the 20-cabinet lineup — **single source of truth for game ids** |
| Daily Run | `daily/index.html` | verified working in browser |
| League | `league/index.html` | verified working |
| Passport | `passport/index.html` | verified working, map renders correctly |
| WORDISHA | `games/wordish/` | **reference implementation — copy its shape** |

### Data files
| File | Status |
|---|---|
| `core/data/countries.js` | ✅ 250 countries, pop/GDP/capital coords/borders/languages |
| `core/data/world.js` | ✅ 246 countries of Natural Earth geometry; all centroids verified inside their country |
| `core/data/flags.js` + `flags/*.svg` | ✅ 250 real vector flags |
| `core/data/words.js` | ⏳ in flight |
| `core/data/crosswords.js` | ⏳ in flight (mini + midi built separately into `_build/crosswords-*.json`, then merged) |
| `core/data/connections.js` | ⏳ in flight |
| `core/data/trade.js` | ⏳ in flight |
| `core/data/food.js` | ⏳ in flight |
| `core/data/lingua.js` | ⏳ in flight |
| `core/data/photos.js` | ⏳ in flight (halves land in `_build/photos-time.json` + `_build/photos-place.json`, then merge) |
| `core/data/geogrid.js` | ⏳ in flight |

### Games still to build
Everything in `core/registry.js` except `wordish`. See §4.

---

## 3. How to resume the data build

**The durable artifact is `_build/*.py`** — every dataset was built by a
re-runnable, deterministic Python script (stdlib only, no pip). If a data file
is missing, run its script rather than regenerating data by hand:

```bash
cd /Users/mishasalahshoor/cbai-ops/misha-arcade && python3 _build/<script>.py
```

| Script | Produces |
|---|---|
| `gen_countries.py` | `core/data/countries.js` |
| `gen_world.py` | `core/data/world.js` |
| `gen_flags.py` / `fetch_flags.py` | `core/data/flags.js` + `flags/*.svg` |
| `words_authored.py`, `xw_words.py` | word lists |
| `xw_fill.py`, `xw_mini_build.py`, `xw_midi_fill.py` | crossword grids |

Raw inputs are gitignored (they are large and re-downloadable):
`_build/countries-110m.json`, `countries-50m.json` (unpkg world-atlas 2.0.2),
`countries-full.json` (raw.githubusercontent.com/mledoze/countries).

> **Note on workflow resume:** `Workflow({resumeFromRunId})` is **same-session
> only**. In a fresh session it will not work — re-invoke the script instead:
> `Workflow({scriptPath: "<path below>"})`, first deleting the JOBS entries whose
> output files already exist so they don't redo finished work.
>
> Data workflow script:
> `~/.claude/projects/-Users-mishasalahshoor-cbai-ops-misha-arcade/94c0cfc1-e07b-4090-a957-ef69abdd367f/workflows/scripts/arcade-data-foundation-wf_5d8835eb-ef8.js`
> (run id `wf_5d8835eb-ef8`; per-agent transcripts and returned values are in
> `~/.claude/projects/-Users-mishasalahshoor/94c0cfc1-e07b-4090-a957-ef69abdd367f/subagents/workflows/wf_5d8835eb-ef8/journal.jsonl`)

---

## 4. How to build a remaining game

1. Read `_build/CONTRACT.md` (§2 core API, §3 the 0-100 `norm`, §4 design
   tokens, §5 registration, §6 the data shape you consume).
2. Read your game's section in `_build/RESEARCH.md` for exact rules/scoring.
3. Copy the structure of `games/wordish/game.js` — it is commented as the
   reference implementation.
4. Files go in `games/<id>/index.html` + `game.js`, where `<id>` matches
   `core/registry.js` exactly.
5. Expose a debug hook (`window.__XX`) so the game can be driven headlessly
   from the browser tools, like `__WD` in wordish and `__MM`/`__TT` in the
   older cabinets.
6. Verify in the browser before claiming done (see §5).

---

## 5. Local testing

A static server is already running on **http://localhost:4173** serving the
repo root (`python3 -m http.server 4173`). Launch config `misha-arcade` in
`~/.claude/launch.json` does the same.

Key pages: `/daily/`, `/league/`, `/passport/`, `/games/wordish/`.
Useful query params every game supports: `?d=<n>` (archive day), `?practice=1`.

Two traps already hit and fixed — don't reintroduce them:
- **Never reveal a modal inside `requestAnimationFrame`.** rAF is paused in a
  backgrounded tab, so the result sheet silently never appears.
- **Fill map countries as separate paths.** One combined path is evaluated
  under a single nonzero winding rule and floods the canvas.
- Bump `?v=N` on script tags after editing a core file, or the browser serves
  the old one (see the repo's `CLAUDE.md`).

---

## 6. Repo rules that bite

`CLAUDE.md` at the repo root is binding. The important ones:

- **Several Claude sessions work in this repo at once.** Never `git add -A`,
  never `git add .`, never `git commit -a`, never force-push. Name your paths.
  (This build already swept up another session's MISHANAMEH work once and had
  to rewrite the commit.)
- Deploy with `./deploy.sh "message" path/ path/` — it rebases, retries a
  racing push, waits for Pages, and clears a jammed deployment.
- A background checkpoint loop may be committing `core/data/` every ~100 s
  while a build is running. Check for it before assuming a commit is yours.
