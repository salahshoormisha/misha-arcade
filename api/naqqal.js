/* Misha's Midnight Arcade — the naqqāl's brain, server side.
   ────────────────────────────────────────────────────────────────────────
   The arcade is a static site, so MISHANAMEH's "Ask the Naqqāl" button asks
   the player to paste their own Anthropic key. That is fine for Misha and
   David and completely unreasonable for Baba.

   Deploy the repo to Vercel with ANTHROPIC_API_KEY set, and this function
   holds the key instead. Then in the browser console (or baked into
   index.html) set:

       ASK.proxy = '/api/naqqal';

   and the key field disappears from the game.                              */

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set on this deployment' });

  // only ever forward the shape the game sends; never proxy arbitrary bodies
  const { model, max_tokens, system, messages } = req.body || {};
  if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages[] required' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-5',
        max_tokens: Math.min(1200, max_tokens || 700),
        system,
        messages,
      }),
    });
    const body = await r.text();
    res.status(r.status).setHeader('content-type', 'application/json').send(body);
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
}
