# Misha's Midnight Arcade — working rules

Live at **https://salahshoormisha.github.io/misha-arcade/** (GitHub Pages, repo
`salahshoormisha/misha-arcade`). Static site: no build step, no dependencies, no
asset files — everything is HTML/canvas/WebAudio, generated at runtime.

## ⚠️ Several Claude sessions work in this repo AT THE SAME TIME

Misha runs parallel sessions on different cabinets. So:

**Never run `git add -A`, `git add .`, or `git commit -a` here.** It will sweep up
whatever another session is halfway through writing and commit their broken
intermediate state. This has already happened once. Always name your paths.

**Never `git push --force`.** Another session's work is probably on the branch.

**Deploy with the script — it handles all of this:**

```bash
./deploy.sh "your commit message" tetrisha/ index.html   # commit these paths, then deploy
./deploy.sh                                              # just redeploy what's committed
```

`deploy.sh` refuses to commit without explicit paths, rebases on `origin/main`
before pushing (so concurrent pushes merge instead of being rejected), retries a
racing push, waits for the Pages deployment, and clears a stuck one if it finds
one. You do not need to ask Misha to run anything — just run it yourself.

## Layout — stay in your own lane

| Path | What |
|---|---|
| `index.html` | the arcade hub — **the only shared file**; expect merges here |
| `mishaman/` | MISHA-MAN (Pac-Man homage) |
| `tetrisha/` | TETRISHA (modern Tetris) |
| `mishanameh/` | MISHANAMEH (Persian deck-building roguelike) |

Each game owns its `game.js` + `audio.js` and is fully self-contained, so adding a
cabinet never requires touching another one.

## Two things that will bite you

**1. Cache-bust after editing any game file.** The `<script>` tags carry `?v=N`.
Bump N in that game's `index.html` whenever you change its `game.js`/`audio.js`,
or browsers keep serving the old file and your change appears to do nothing.

**2. Pages deployments can jam.** GitHub sometimes leaves a deployment stuck
"in progress", which silently blocks every later one and reports only
"Page build failed". `deploy.sh` clears it automatically. By hand:

```bash
gh api -X POST repos/salahshoormisha/misha-arcade/pages/deployments/<FULL_COMMIT_SHA>/cancel
```

The **full commit SHA** is the deployment id — the numeric id from the deployments
API returns 404. The workflow uses `cancel-in-progress: false` so simultaneous
pushes queue rather than killing each other mid-deploy; don't change that back.

## Audio note

Both MISHA-MAN and TETRISHA play **real recorded voices** (`say -v Samantha -r 165`,
base64-embedded in their `audio.js`). Two hard-won details if you touch them:

- Spell it **"Meesha"** when recording — "Misha" makes macOS say MISH-uh.
- Decode on **page load** via a *suspended* AudioContext (`build()` vs `ensure()`),
  and throttle on `performance.now()`, never `ctx.currentTime` — a suspended
  context freezes that clock and silently swallows every sound.

## Testing

Both games expose debug hooks — `window.__MM` and `window.__TT` (`start`, `step`,
`spawn`, `hardDrop`, …) — so you can drive them headlessly from the browser tools.
`__TT.step()`/`__MM.step()` advance *game* time synchronously; if you're testing
anything throttled on real time, busy-wait alongside it or the throttle eats
everything.
