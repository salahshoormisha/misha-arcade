# MISHA'S MIDNIGHT ARCADE — Sound Design Spec (contract)

Two browser games, all audio synthesized live with WebAudio (zero asset files).
Games: **MISHA-MAN** (`mishaman/`) and **TETRISHA** (`tetrisha/`).

## The concept — three layers

1. **Authentic arcade skeleton.** SFX must *feel* like the real Pac-Man cabinet:
   an alternating two-tone chomp on every pellet, a droning siren that rises as
   the maze empties, a bubbling warble while ghosts are frightened, a dramatic
   descending death sweep, a zip when you eat a ghost. All ORIGINAL synthesis —
   evoke the idiom, never reproduce Namco's intro melody or samples.
2. **THE TWIST — the chomp says "MISH".** The waka-waka is a tiny formant-
   synthesized voice so eating pellets literally sounds like *"MISH MISH MISH"*:
   nasal `m` hum (~110–150 Hz, ~25 ms) → `ee` vowel (formants ≈300 Hz + ≈2300 Hz,
   ~45 ms) → `sh` fricative (bandpassed noise 2–5 kHz, ~50 ms). Two pitch
   variants alternating hi/lo exactly like the classic waka. Total ≤130 ms,
   must tolerate 8–10 calls/sec (pre-render with OfflineAudioContext into
   AudioBuffers at unlock; graceful fallback to plain square blips).
3. **Musical cryptograms.** Letters → notes via the A–G cycle:
   `M=F, I=B, S=E, H=A (or B-natural, composer's call), A=A` →
   **MISHA motif** (bright, catchy, ≤2 s). `D=D, A=A, V=A, I=B, D=D` →
   **DAVID motif** (warm, tender). Each letter also gets a single pitched
   "letter note" used by meters, chosen so 0→4 ascends satisfyingly.
   TETRISHA's music is **Korobeiniki** (public-domain folk melody) as an
   original square-wave chiptune arrangement with a simple driving bass.

## API contract — `window.MM_AUDIO` (file: `mishaman/audio.js`)

| fn | fires when | feel |
|---|---|---|
| `unlock()` | first user gesture | create/resume ctx, pre-render buffers |
| `toggleMute() -> bool` / `isMuted() -> bool` | M key / 🔊 button | persist `localStorage 'mm_mute'` |
| `waka()` | every pellet | the MISH chomp, alternating hi/lo |
| `ready()` | round start | MISHA-motif jingle, ≤2 s |
| `siren(rate)` / `stopSiren()` | during play, rate 0..1 as pellets deplete | classic rising drone; update-safe every frame |
| `fright()` / `stopFright()` | power pellet active | bubbling warble loop |
| `eatGhost(chain)` | ghost eaten, chain 0..3 | rising zip, higher each chain |
| `death()` | caught | ~1.2–1.6 s descending sweep + sad tail (original) |
| `fruit()` | bonus item eaten | two-note pluck |
| `letterLit(i)` | a maze letter (0=M..4=A) fully cleared | that letter's cryptogram note + sparkle arp; i=4 slightly grander |
| `levelClear()` | maze finished | full MISHA motif, triumphant |
| `extraLife()` | 10,000 pts | happy arp |
| `uiSelect()` | menu/title interactions | short blip |
| `stopLoops()` | death/pause/level end | kill siren+fright cleanly |

## API contract — `window.TT_AUDIO` (file: `tetrisha/audio.js`)

| fn | fires when | feel |
|---|---|---|
| `unlock()`, `toggleMute()`, `isMuted()` | as above, key `'tt_mute'` | |
| `musicStart(level)` / `musicStop()` | play/pause/gameover | Korobeiniki chiptune loop; intensity/tempo may scale gently with level; restart-safe, never stacks |
| `move()` / `rotate()` / `softDrop()` | piece control | tiny dry clicks/blips, ≤40 ms |
| `hardDrop()` | slam | whoosh + thud |
| `lock()` | piece settles | soft thud |
| `hold()` | hold swap | subtle swish |
| `lineClear(n)` | n=1..3 sparkle sweeps, grander per n | n=4 = **"MISHA!"** — big fanfare quoting the MISHA motif |
| `meterLetter(i)` | meter letter i (0=M..4=A) lights | that letter's ascending note |
| `heartIncoming()` | MISHA meter complete, heart piece queued | two soft heartbeats + shimmer |
| `heartBurst()` | heart piece detonates | DAVID motif + sparkle explosion |
| `levelUp()` | every 10 lines | quick rising arp |
| `gameOver()` | top out | tender, not mean — a slow, warm DAVID-motif fragment ("he still loves you") |
| `uiSelect()` | menus | short blip |

## Hard technical constraints (both files)

- Vanilla JS **IIFE**, defines exactly one global (`MM_AUDIO` / `TT_AUDIO`). No modules, no imports, no external files, no console spam.
- **Nothing may throw** before `unlock()` or in browsers without WebAudio — every fn no-ops gracefully.
- Never `exponentialRampToValueAtTime(0, …)` — use 0.0001 floors.
- Every oscillator/noise source gets a scheduled `.stop()` **except** managed loops (siren/fright/music), which must be stoppable, restartable, and non-stacking.
- Master gain ≤0.5 through a single master GainNode (mute = gain 0, persisted).
- iOS-safe: lazy ctx creation + `resume()` inside `unlock()` (wired to a gesture).
- Keep each file ≤ ~450 lines. Comment the cryptogram mapping at the top.
- A first-pass `mishaman/audio.js` exists as reference — free to reuse or replace.
