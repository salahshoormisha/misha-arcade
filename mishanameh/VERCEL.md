# Putting the arcade on Vercel

The arcade works exactly as it is on GitHub Pages. This is only needed to make
the two AI features **keyless**, so Baba (or anyone) can use them without
pasting an API key.

## What it buys you

| Feature | On GitHub Pages | On Vercel |
|---|---|---|
| Ask the Naqqāl (Claude rules coach) | player pastes their own Anthropic key | just works |
| The naqqāl's spoken voice (ElevenLabs) | player pastes their own key | just works |
| Everything else | identical | identical |

## Doing it

1. **Import the repo** at vercel.com → New Project → `salahshoormisha/misha-arcade`.
   Framework preset: **Other**. No build command, no output directory — it is a
   static site with two functions.

2. **Set two environment variables** in the project settings:

   ```
   ANTHROPIC_API_KEY    = sk-ant-…
   ELEVENLABS_API_KEY   = …
   ELEVENLABS_VOICE_ID  = onwK4e9ZLuTAKqWW03F9   (optional — this is the default)
   ```

   Set them yourself in Vercel's dashboard; they never go in the repo.

3. **Point the game at the proxies.** Add one line to
   `mishanameh/index.html`, just before `</body>`:

   ```html
   <script>ASK.proxy = '/api/naqqal'; ELEVEN.proxy = '/api/voice';</script>
   ```

   With `proxy` set, both features stop asking for a key and the key fields
   disappear from the settings panels on their own.

4. Deploy. `api/naqqal.js` and `api/voice.js` become serverless functions
   automatically; there is nothing to configure.

## Notes

- The two functions only forward the exact shape the game sends. They are not
  general-purpose proxies, so nobody can point them at something else.
- Voice responses are served `immutable` with a year's cache, and the game
  also caches every generated line in the browser's IndexedDB under a hash of
  (voice, text) — so the ~74 narration lines are generated once and then never
  cost anything again.
- GitHub Pages keeps working; the two deployments can coexist. The Pages build
  simply ignores `api/` and `vercel.json`.

## If you want a single Mac app later

Wrap the deployed URL. The whole arcade is one origin with no native
dependencies, so a thin shell around it is enough — the game state is already
in `localStorage`, and co-op already works across two devices over MQTT.
