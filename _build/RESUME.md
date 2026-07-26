# DAILY WING — RESUME SHEET

If a session ended mid-build (usage limit, crash, closed laptop), start here.
Everything needed to continue is on disk and in git.

**Last updated:** 2026-07-26, after the weekly-limit stop.

---

## 1. What this is

A wing of ~21 daily puzzle games added to Misha's Midnight Arcade, alongside the
three original cabinets. Misha and David play NYT/OEC/geo daily games together
every morning; this rebuilds their whole line-up with archives, practice modes,
a shared daily card, a serverless head-to-head league, a co-op records board and
a cross-game country passport.

- **Binding spec:** `_build/CONTRACT.md`. §2 core API, §3 the 0–100 `norm`,
  §4 design tokens, §5 registration, §6 data shapes,
  **§7 PERSONAL FLAVOUR — confirmed by the players, follow exactly.**
- **Researched mechanics** for all 21 source games: `_build/RESEARCH.md` (339 KB,
  one section per game — exact rules, scoring formulas, share formats, known
  weaknesses). Machine-readable: `_build/RESEARCH.json`.
- **Live:** https://salahshoormisha.github.io/misha-arcade/

---

## 2. State of play

### Core (all done, all committed)
| Path | What |
|---|---|
| `core/arcade.js` | daily seeding, stats, streaks, the 0–100 norm, `A.par()`, records, share, duel links, passport, backup |
| `core/ui.js` | header, modals, toasts, keyboard, result sheet, settings, archive |
| `core/style.css` | **the design system** — rebuilt 2026-07-26, see §4 |
| `core/picker.js` | the country type-ahead used by 8 cabinets |
| `core/worldmap.js` | equirect + globe renderer, click-to-guess, silhouettes |
| `core/flagart.js` | real vector flag loading/drawing |
| `core/audio.js` | WebAudio SFX, no files |
| `core/registry.js` | **the cabinet list — single source of truth for ids.** An entry with `soon: true` is not built yet and renders as a dead row |

### Data (`core/data/`)
| File | Status |
|---|---|
| `countries.js` | ✅ 250 countries — pop, GDP/capita, capital coords, borders, languages |
| `world.js` | ✅ Natural Earth geometry for 246; every centroid verified inside its country |
| `flags.js` + `flags/*.svg` | ✅ 250 real vector flags, with colour + feature index |
| `words.js` | ✅ 1,318 answers / 11,024 valid / 23,568 Letter-Boxed / 56 Persian etymologies |
| `crosswords.js` | ✅ mini + midi grids with hand-written clues |
| `connections.js` | ✅ packs (see §5 — packs were corrected after the players' feedback) |
| `trade.js` | ✅ export composition + per-product top exporters + RCA |
| `food.js` | ✅ 50 cuisines, 238 dishes, 236 with verified photo URLs |
| `lingua.js` | ✅ 50+ languages, real sourced text, script-tell hints |
| `trivia.js` | ✅ question bank for THE DECIDER (149 KB, validated) |
| `photos.js` | ⚠️ `place` done (185 photos, 84 countries, real coords + clues); `time` only 1850–1899 (48) — see §7.2 |
| `geogrid.js` | ✅ criteria + rarity + pairs matrix + obviousness prior + buildGrid() |

### Cabinets
Check reality, not this table: a cabinet is built when
`games/<id>/index.html` > 300 bytes **and** `games/<id>/game.js` > 3 KB.

```bash
cd /Users/mishasalahshoor/cbai-ops/misha-arcade
for g in games/*/; do n=$(basename $g); \
  h=$(stat -f%z $g/index.html 2>/dev/null||echo 0); \
  j=$(stat -f%z $g/game.js 2>/dev/null||echo 0); \
  [ "$h" -gt 300 ] && [ "$j" -gt 3000 ] && echo "$n ok" || echo "$n PENDING"; done
```

Built and live (18): wordish, thirdle, mini, midi, quartets, boxed, tradle,
pick5, connectrade, flagle, globle, outline, atlas, foodguessr, lingua, chrono,
cluedrop, decider.
Not yet built (3): geogrid, timeguessr, placeguessr.

**After building a cabinet, remove its `soon: true` from `core/registry.js`.**

---

## 3. How to build a remaining cabinet

1. Read `_build/CONTRACT.md` (all of it).
2. Read your game's section in `_build/RESEARCH.md`.
3. Copy the shape of `games/wordish/game.js` — it is commented as the reference
   implementation. `games/flagle/game.js` shows `A.picker` + passport stamps;
   `games/foodguessr/game.js` shows a multi-round game; `games/mini/game.js`
   shows a complex custom grid with its own keyboard behaviour.
4. Files at `games/<id>/index.html` + `game.js`, `<id>` matching the registry.
5. Expose `window.__XX` debug hooks so it can be driven headlessly.
6. Verify in the browser before claiming done, at 1280px **and** 375px.

### Traps this build actually hit — do not reintroduce
- **`var` initialisers do not hoist.** A function that runs at boot and reads a
  `var` declared further down the file gets `undefined`. Cost us two cabinets.
- **Never reveal UI inside `requestAnimationFrame`** — rAF is paused in a
  background tab, so the result sheet silently never appears.
- **Fill map countries as separate paths.** One combined path is evaluated under
  a single nonzero winding rule and floods the canvas.
- **Bump `?v=N`** on script tags after editing a core file, or the browser
  serves the old one and your change appears to do nothing.
- `A.geo` and `A.normName` live in `arcade.js`; `A.picker` in `picker.js`;
  `A.map`/`A.silhouette` in `worldmap.js`.
- The browser pane has a **tab cap**. If several agents drive it at once they
  fight over the active tab. Give browser QA to one agent at a time.

---

## 4. The design system (rebuilt 2026-07-26)

The player's verdict on the first version: *"too visually vibecoded"*, *"too many
visual bugs"*, and that this made her *"doubt the smoothness and flawlessness of
the gameplay — which is essential"*. So `core/style.css` was rewritten:

- One accent per screen. No glowing text, no gradient headlines, no starfield,
  no emoji as UI chrome. Depth from layered surfaces + hairlines + soft shadows.
- Type does the work: tight heavy sans for display, tracked small caps for
  labels, mono **only** where functional (grid letters, timers, scores).
- A 4px spacing scale, a fixed type scale, one easing curve, tabular numerals.
- **Every old CSS variable is aliased**, so cabinets written against the old
  names still work. Use `var(--ink)`, `var(--s1)`, `var(--hair)`, `var(--sp-3)`,
  `var(--t-sm)`, `var(--r-md)`, `var(--ease)` — never a literal hex outside
  canvas drawing code.
- The sticky header's backdrop is a full-bleed pseudo-element; do not put the
  background back on `.ac-header` itself or it clips to 880px.

---

## 5. Content decisions the players confirmed

- **Difficulty:** between "solid daily players" and "genuinely strong". A good
  day should score ≈70–75, an excellent one ≈90. Do not patronise them; do not
  make 100 routine.
- **QUARTETS packs:** `general`, `persia` (Persian culture broadly — **light on
  Shāhnāmeh**, they don't know that lore and it has its own cabinet), `united`
  (grown to ~20 boards; FOURMATIONS is retired and its football folds in here,
  minus the boards they found too niche or too obviously four-of-a-kind),
  `places` (**Cambridge/Boston, London, Edinburgh, Houston** — their four
  cities), `ai` (AI safety/governance/policy), `jewish` (Jewish culture &
  Israel). **No office/CBAI pack — they declined it.** Never name real colleagues.
- **FOURMATIONS is retired** and removed from the hub.
- They play the dailies **together as a team** far more than against each other,
  but they are competitive and like knowing how a score compares. Hence both
  `league/` sections: THE SEASON (head-to-head) and THE TEAM (co-op records,
  week-on-week form, per-game personal bests) — plus `A.par()` on every result
  sheet, which is honest that it is a computed prior, not a crowd.
- **THE DECIDER** exists because they asked for a 1v1 general-knowledge game.

---

## 6. Local testing & deploy

A static server runs at **http://localhost:4173** (launch config `misha-arcade`).
Key pages: `/`, `/daily/`, `/league/`, `/passport/`, `/games/<id>/`.
Every cabinet supports `?d=<n>` (archive) and `?practice=1`.

Deploy with the script — never by hand:

```bash
./deploy.sh "message" core/ games/foo/ index.html
```

`CLAUDE.md` at the repo root is binding. The big one: **several Claude sessions
work in this repo at once, so never `git add -A`, never `git add .`, never
force-push.** Name your paths. This build already swept up another session's
in-progress MISHANAMEH work once and had to rewrite the commit.

A background checkpoint loop may be committing `core/data/` and `games/` every
~60 s while a build runs. Check `git log` before assuming a commit is yours.

---

## 7. Known open items — EXACTLY what is left

A weekly usage limit stopped the last wave. Everything below is the remaining work,
in priority order. Relaunch the saved workflow scripts rather than rewriting the briefs.

### 1. Three cabinets not yet built
`geogrid`, `timeguessr`, `placeguessr` — all still carry `soon: true` in
`core/registry.js`, so the Daily Run shows them as pending rather than 404ing.
**Their data is already done and committed** (`core/data/geogrid.js` 138 KB,
`core/data/photos.js` 138 KB), so this is game code only.

Relaunch:
```
Workflow({scriptPath: "~/.claude/projects/-Users-mishasalahshoor-cbai-ops-misha-arcade/94c0cfc1-e07b-4090-a957-ef69abdd367f/workflows/scripts/arcade-last-three-wf_566379ce-f16.js"})
```
**After building each one, delete its `soon: true` from `core/registry.js`.**

### 2. The historical photo set is only half-harvested
`AD_PHOTOS.place` is finished: 185 photos, 84 countries, every one with real
geosearch coordinates and visual `clues`. **`AD_PHOTOS.time` only reached
1850–1899 (48 photos)** — the harvester was cut off. It needs extending to
1900–2015 at ≥8 per decade. The brief is the `photos-time` job in the workflow
above; the previous harvester's script is in `_build/`.

TIMEGUESSR is written to read the array's real min/max year at runtime, so it
works with whatever is present — the set just gets better as it grows.

### 3. The visual QA sweep never ran
All three polish agents died on the limit. Relaunch:
```
Workflow({scriptPath: "~/.claude/projects/-Users-mishasalahshoor-cbai-ops-misha-arcade/94c0cfc1-e07b-4090-a957-ef69abdd367f/workflows/scripts/arcade-packs-and-polish-wf_e4161526-133.js"})
```
The `packs` job in it is **already done** (110 boards landed) — delete that job
from the JOBS array before re-running, or it will redo finished work.
The two QA jobs sweep every cabinet at 1280px and 375px for horizontal scroll,
clipped text, blurry canvases, picker suggestions clipped by a parent overflow,
long country names wrapping badly, and leftover emoji in button labels.

### 4. Smaller things
- Cache-busters are at `?v=11` everywhere. Bump on any core edit.
- `games/_shared/` is an empty directory left by an agent; delete it.
- Some cabinets still carry emoji in their own control labels (the QA sweep in
  §3 covers this). Emoji in *share grids* is intentional and should stay.

---

## 8. Raw inputs (gitignored, re-downloadable)

`_build/countries-110m.json`, `countries-50m.json` — unpkg world-atlas 2.0.2.
`_build/countries-full.json` — raw.githubusercontent.com/mledoze/countries.
`_build/RESEARCH.json` — the research corpus in machine-readable form.
