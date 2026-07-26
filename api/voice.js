/* Misha's Midnight Arcade — the naqqāl's voice, server side.
   Same idea as api/naqqal.js. Set ELEVENLABS_API_KEY on the deployment and
   then, in the browser:

       ELEVEN.proxy = '/api/voice';

   The game already caches every generated line in IndexedDB under a hash of
   (voice, text), so each of the ~74 narration lines is paid for once per
   browser and then never again.                                            */

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'onwK4e9ZLuTAKqWW03F9';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return res.status(500).json({ error: 'ELEVENLABS_API_KEY is not set on this deployment' });

  const { text, model_id, voice_settings } = req.body || {};
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });
  if (text.length > 600) return res.status(400).json({ error: 'line too long' });

  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'xi-api-key': key },
        body: JSON.stringify({
          text,
          model_id: model_id || 'eleven_turbo_v2_5',
          voice_settings: voice_settings || {
            stability: 0.42, similarity_boost: 0.78, style: 0.28, use_speaker_boost: true,
          },
        }),
      }
    );
    if (!r.ok) return res.status(r.status).json({ error: await r.text() });
    const buf = Buffer.from(await r.arrayBuffer());
    res.status(200)
       .setHeader('content-type', 'audio/mpeg')
       .setHeader('cache-control', 'public, max-age=31536000, immutable')
       .send(buf);
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
}
