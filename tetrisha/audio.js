// TETRISHA audio — defines exactly one global: window.TT_AUDIO.
// Every sound is synthesized live with WebAudio. Zero asset files.
//
// ── THE CRYPTOGRAM ──────────────────────────────────────────────────────────
// Letters become pitches by walking the musical alphabet A–G and wrapping
// (H wraps to A, I to B, … V wraps to A):
//
//   M→F   I→B   S→E   H→A   A→A        D→D   A→A   V→A   I→B   D→D
//
// MISHA motif (bright, 150 bpm):  F4 A4 B4 D5 | E5 · A4 A5
//   — the letters land on notes 1,3,5,6,7; A4/D5 are passing ornaments.
// DAVID motif (warm, tender):     D4 A4 | A4 B4 D5
// Letter-meter ladder (M I S H A): F4 B4 E5 A5 A6 — stacked fourths, so the
//   filling meter accumulates a glowing Fmaj7#11.
// KEY WORLD: everything lives in A minor; the 4-line "MISHA!" fanfare ends on
//   an A-MAJOR (Picardy) chord. Music = Korobeiniki (public-domain folk tune)
//   as an original square-wave chiptune arrangement with a driving bass.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  "use strict";

  let ctx = null, master = null, noiseBuf = null;
  let muted = false;
  try { muted = localStorage.getItem("tt_mute") === "1"; } catch (e) {}

  // ── THE REAL VOICES ────────────────────────────────────────────────────────
  // Recorded with macOS `say -v Samantha -r 165`, base64-embedded so they can
  // never 404 and are ready before the first click. "Meesha" is deliberately
  // misspelled: "Misha" makes the synthesizer say MISH-uh (clipped ɪ) instead
  // of MEE-sha. Segment bounds are measured on the DECODED buffer — AAC adds
  // ~30 ms of priming silence at the head.
  //   MISHA  0.028–0.500  (the /ʃ/ lands at 0.218)
  //   DAVID  0.028–0.452
  // A quad clear says her name; his heart says his.
  let vMisha = null, vDavid = null, vTried = false;
  const V_A = 0.028, V_MISHA_B = 0.500, V_DAVID_B = 0.452;
  const B64_MISHA = "AAAAHGZ0eXBNNEEgAAAAAE00QSBtcDQyaXNvbQAAA3ptb292AAAAbG12aGQAAAAA5op1FeaKdRUAAFYiAAA4AAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACDHRyYWsAAABcdGtoZAAAAAfminUV5op1FQAAAAEAAAAAAAA4AAAAAAAAAAAAAAAAAAEAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAahtZGlhAAAAIG1kaGQAAAAA5op1FeaKdRUAAFYiAAA4AAAAAAAAAAAiaGRscgAAAAAAAAAAc291bgAAAAAAAAAAAAAAAAAAAAABXm1pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAABInN0YmwAAAB2c3RzZAAAAAAAAAABAAAAZm1wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAABWIgAAAAAAM2VzZHMAAAAAA4CAgCIAAAAEgICAFEAUABgAAAAfwAAAu4AFgICAAhOIBoCAgAECAAAAD3NidGQAAAAASTE2AAAAGHN0dHMAAAAAAAAAAQAAAA4AAAQAAAAAKHN0c2MAAAAAAAAAAgAAAAEAAAALAAAAAQAAAAIAAAADAAAAAQAAAExzdHN6AAAAAAAAAAAAAAAOAAAABAAAAXQAAAKAAAABWwAAARYAAAEVAAABRgAAAQ8AAAFpAAABWwAAAQ4AAAENAAAA6gAAAJIAAAAYc3RjbwAAAAAAAAACAAAQAAAAHaUAAAD6dWR0YQAAAPJtZXRhAAAAAAAAACJoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAADEaWxzdAAAALwtLS0tAAAAHG1lYW4AAAAAY29tLmFwcGxlLmlUdW5lcwAAABRuYW1lAAAAAGlUdW5TTVBCAAAAhGRhdGEAAAABAAAAACAwMDAwMDAwMCAwMDAwMDg0MCAwMDAwMDI1QyAwMDAwMDAwMDAwMDAyRDY0IDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwAAAMYmZyZWUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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";
  const B64_DAVID = "AAAAHGZ0eXBNNEEgAAAAAE00QSBtcDQyaXNvbQAAA3Jtb292AAAAbG12aGQAAAAA5oqtceaKrXEAAFYiAAAwAAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACBHRyYWsAAABcdGtoZAAAAAfmiq1x5oqtcQAAAAEAAAAAAAAwAAAAAAAAAAAAAAAAAAEAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAaBtZGlhAAAAIG1kaGQAAAAA5oqtceaKrXEAAFYiAAAwAAAAAAAAAAAiaGRscgAAAAAAAAAAc291bgAAAAAAAAAAAAAAAAAAAAABVm1pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAABGnN0YmwAAAB2c3RzZAAAAAAAAAABAAAAZm1wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAABWIgAAAAAAM2VzZHMAAAAAA4CAgCIAAAAEgICAFEAUABgAAAAAIAAAu4AFgICAAhOIBoCAgAECAAAAD3NidGQAAAAASTE2AAAAGHN0dHMAAAAAAAAAAQAAAAwAAAQAAAAAKHN0c2MAAAAAAAAAAgAAAAEAAAALAAAAAQAAAAIAAAABAAAAAQAAAERzdHN6AAAAAAAAAAAAAAAMAAAABAAAALQAAAGLAAABBgAAARcAAAEMAAABdQAAAT8AAAECAAABAgAAAUoAAACyAAAAGHN0Y28AAAAAAAAAAgAAEAAAABtuAAAA+nVkdGEAAADybWV0YQAAAAAAAAAiaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAAxGlsc3QAAAC8LS0tLQAAABxtZWFuAAAAAGNvbS5hcHBsZS5pVHVuZXMAAAAUbmFtZQAAAABpVHVuU01QQgAAAIRkYXRhAAAAAQAAAAAgMDAwMDAwMDAgMDAwMDA4NDAgMDAwMDAwRDEgMDAwMDAwMDAwMDAwMjZFRiAwMDAwMDAwMCAwMDAwMDAwMCAwMDAwMDAwMCAwMDAwMDAwMCAwMDAwMDAwMCAwMDAwMDAwMCAwMDAwMDAwMCAwMDAwMDAwMAAADGpmcmVlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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";

  function decodeVoice(b64, set) {
    try {
      const bin = atob(b64), n = bin.length, by = new Uint8Array(n);
      for (let i = 0; i < n; i++) by[i] = bin.charCodeAt(i);
      const p = ctx.decodeAudioData(by.buffer, set, () => {});
      if (p && p.then) p.then(set, () => {});
    } catch (e) {}
  }
  // Speak a name. rate/gain let callers make it triumphant or tender.
  function say(buf, end, rate, gain, at) {
    if (!ctx || !buf) return false;
    try {
      const t = ctx.currentTime + (at || 0);
      const s = ctx.createBufferSource(), g = ctx.createGain();
      s.buffer = buf; s.playbackRate.value = rate || 1;
      g.gain.value = gain == null ? 1 : gain;
      s.connect(g); g.connect(master);
      s.start(t, V_A, end - V_A);
      return true;
    } catch (e) { return false; }
  }

  // ---------- note helpers ----------
  const SEMI = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  function nf(name) { // "G#2" -> Hz (A4 = 440)
    const m = /^([A-G])([#b]?)(\d)$/.exec(name);
    if (!m) return 0;
    const st = SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    return 440 * Math.pow(2, (+m[3] - 4) + st / 12);
  }
  const tr = (f, semis) => f * Math.pow(2, semis / 12);

  // ---------- score data ----------
  const TEMPO = 150; // bpm — one beat = 0.4 s
  const MISHA = [["F4", .5], ["A4", .5], ["B4", .5], ["D5", .5], ["E5", 1], ["A4", .5], ["A5", 1]];
  const DAVID = [["D4", 1], ["A4", 1], ["A4", .5], ["B4", .5], ["D5", 2]];
  const LETTER = ["F4", "B4", "E5", "A5", "A6"]; // meter ladder M·I·S·H·A
  // Korobeiniki, 32 beats: lead line...
  const LEAD = ("E5 1,B4 .5,C5 .5,D5 1,C5 .5,B4 .5,A4 1,A4 .5,C5 .5,E5 1,D5 .5,C5 .5," +
    "B4 1.5,C5 .5,D5 1,E5 1,C5 1,A4 1,A4 1.5,R .5," +
    "D5 1.5,F5 .5,A5 1,G5 .5,F5 .5,E5 1.5,C5 .5,E5 1,D5 .5,C5 .5," +
    "B4 1.5,C5 .5,D5 1,E5 1,C5 1,A4 1,A4 1.5,R .5")
    .split(",").map(s => { const p = s.split(" "); return [p[0], +p[1]]; });
  // ...and an oom-pah eighth-note bass under it (i–v–i–iv–i–v–i in A minor).
  const BASS = [];
  (function () {
    const P = (a, b, n) => { for (let i = 0; i < n; i++) BASS.push([a, .5], [b, .5]); };
    P("A2", "E3", 8); P("E2", "B2", 3); BASS.push(["E2", .5], ["G#2", .5]);
    P("A2", "E3", 4); P("D3", "A2", 4); P("A2", "E3", 4);
    P("E2", "B2", 3); BASS.push(["E2", .5], ["G#2", .5]); P("A2", "E3", 4);
  })();

  // ---------- core synth ----------
  // One enveloped oscillator. at = seconds from now, filt = [type, Hz, Q],
  // atk = attack seconds. Gain floors are 0.0001 — never ramp to true zero.
  function beep(type, f0, f1, dur, g, at, filt, atk) {
    const t = ctx.currentTime + (at || 0);
    const a = Math.min(atk || 0.006, dur * 0.5);
    const o = ctx.createOscillator(), env = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, f0), t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(g, t + a);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let head = o;
    if (filt) {
      const bq = ctx.createBiquadFilter();
      bq.type = filt[0]; bq.frequency.value = filt[1]; bq.Q.value = filt[2] || 1;
      o.connect(bq); head = bq;
    }
    head.connect(env); env.connect(master);
    o.start(t); o.stop(t + dur + 0.06);
  }

  // Filtered burst from the pre-rendered noise bed. Returns false when the
  // buffer isn't ready so callers can degrade to a plain blip.
  function noiseThru(at, dur, g, type, f0, f1, q) {
    if (!noiseBuf) return false;
    const t = ctx.currentTime + (at || 0);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const bq = ctx.createBiquadFilter();
    bq.type = type; bq.Q.value = q || 1;
    bq.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) bq.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(g, t + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bq); bq.connect(env); env.connect(master);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.03);
    return true;
  }

  // ---------- pre-render (inside unlock) ----------
  function directNoise() {
    const sr = ctx.sampleRate, b = ctx.createBuffer(1, sr, sr), d = b.getChannelData(0);
    for (let i = 0; i < sr; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  // TETRISHA's only complex "voice" texture is the shared 1 s noise bed used by
  // whoosh/swish/crash/bloom (the MISH formant chomp itself lives in
  // mishaman/audio.js). Pre-render it once via OfflineAudioContext at unlock so
  // every hit is pure BufferSource playback; gracefully fall back to a direct
  // buffer fill — and if even that fails, noise SFX degrade to plain blips.
  function preRender() {
    try {
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!OAC) { noiseBuf = directNoise(); return; }
      const sr = ctx.sampleRate, oc = new OAC(1, sr, sr);
      const b = oc.createBuffer(1, sr, sr), d = b.getChannelData(0);
      for (let i = 0; i < sr; i++) d[i] = Math.random() * 2 - 1;
      const s = oc.createBufferSource(); s.buffer = b; s.connect(oc.destination); s.start(0);
      oc.oncomplete = ev => { if (!noiseBuf && ev.renderedBuffer) noiseBuf = ev.renderedBuffer; };
      const p = oc.startRendering();
      if (p && p.then) p.then(r => { noiseBuf = r; }, () => { try { noiseBuf = directNoise(); } catch (e) {} });
    } catch (e) { try { noiseBuf = directNoise(); } catch (e2) {} }
  }

  // build() creates the (suspended) context without resuming — legal with no
  // user gesture, so the voices can decode during page load. unlockI() adds the
  // resume and is what the first real gesture calls. Without this split the
  // first spoken name would still be decoding when it was needed.
  function build() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5; // single master bus, hard-capped at 0.5
    master.connect(ctx.destination);
    preRender();
    return ctx;
  }
  function warm() {
    if (vTried) return;
    if (!build()) return;
    vTried = true;
    decodeVoice(B64_MISHA, b => { vMisha = b; });
    decodeVoice(B64_DAVID, b => { vDavid = b; });
  }
  function unlockI() { // wire to the first user gesture; iOS-safe lazy create + resume
    if (!build()) return;
    warm();
    if (ctx.state === "suspended") { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); }
  }

  // ---------- piece SFX (dry little clicks, gain ~.03) ----------
  function moveI() { beep("square", 1200, 0, 0.018, 0.03, 0, null, 0.003); }
  function rotateI() { // two-step chirp 880 -> 1320
    beep("square", 880, 0, 0.016, 0.03, 0, null, 0.003);
    beep("square", 1320, 0, 0.016, 0.03, 0.016, null, 0.003);
  }
  function softDropI() { beep("triangle", 440, 0, 0.022, 0.03, 0, null, 0.003); }
  function hardDropI() { // falling air whoosh + floor thud
    if (!noiseThru(0, 0.11, 0.05, "highpass", 2000, 300, 0.7))
      beep("sawtooth", 1800, 300, 0.1, 0.035);
    beep("sine", 90, 0, 0.07, 0.12, 0.01, null, 0.004);
  }
  function lockI() { beep("square", 220, 0, 0.055, 0.05, 0, ["lowpass", 700, 1], 0.004); }
  function holdI() { // soft swap swish
    if (!noiseThru(0, 0.11, 0.035, "bandpass", 900, 900, 1.4))
      beep("triangle", 900, 0, 0.09, 0.025);
  }

  // ---------- clears, meter, hearts ----------
  function fanfare() { // n=4: "M I S H A !" — the motif at double time (~0.9 s)
    const beat = 0.2; let off = 0.02;
    noiseThru(off, 0.22, 0.09, "highpass", 1200, 1200, 0.7); // crash on the downbeat
    for (let k = 0; k < MISHA.length; k++) {
      const f = nf(MISHA[k][0]), d = MISHA[k][1] * beat;
      if (k < MISHA.length - 1) {
        beep("square", f, 0, d * 0.92, 0.085, off);
        beep("square", tr(f, -9), 0, d * 0.92, 0.05, off); // parallel major 6th below
      } else { // final A5 blooms into the held A-MAJOR Picardy chord — "MISHA!"
        ["A4", "C#5", "E5", "A5"].forEach(n => beep("triangle", nf(n), 0, 0.6, 0.06, off, null, 0.012));
        for (let s = 0; s < 5; s++) // descending glitter
          beep("sine", 4000 - s * 625, 0, 0.07, 0.045, off + 0.04 + s * 0.08);
      }
      off += d;
    }
  }
  function lineClearI(n) {
    n = Math.max(1, Math.min(4, n | 0 || 1));
    // A quad isn't a "tetris" here — it's a MISHA!!!, so she says it herself,
    // riding in just after the fanfare's downbeat.
    if (n === 4) { fanfare(); say(vMisha, V_MISHA_B, 1, 1.0, 0.06); return; }
    const scale = ["A4", "C5", "E5", "A5", "C6", "E6", "A6"]; // A-minor sparkle ladder
    for (let k = 0; k < 3 + n; k++) // more pings, starting higher, per line
      beep("triangle", nf(scale[Math.min(k + n - 1, 6)]), 0, 0.06, 0.07 + 0.015 * n, k * 0.045);
    noiseThru(0, 0.14 + 0.06 * n, 0.02 + 0.01 * n, "bandpass", 900, 3200 + 600 * n, 1);
  }
  function meterLetterI(i) {
    i = Math.max(0, Math.min(4, i | 0));
    const f = nf(LETTER[i]);
    beep("triangle", f, 0, 0.09, 0.16);            // the letter's ladder note
    beep("triangle", tr(f, 7), 0, 0.04, 0.09, 0.05);  // sparkle arp +7
    beep("triangle", tr(f, 12), 0, 0.04, 0.09, 0.09); // sparkle arp +12
    if (i === 4) { // the final A crowns the word: whole ladder + octave-doubled A6
      LETTER.forEach((n, k) => beep("triangle", nf(n), 0, 0.06, 0.11, 0.14 + k * 0.05));
      beep("triangle", nf("A5"), 0, 0.3, 0.08, 0.4);
      beep("triangle", nf("A6"), 0, 0.3, 0.1, 0.4);
    }
  }
  function heartIncomingI() { // two soft heartbeats under a slow shimmer gliss
    [0, 0.7].forEach(base => {
      beep("sine", 58, 0, 0.09, 0.12, base, ["lowpass", 200, 1], 0.008);
      beep("sine", 50, 0, 0.11, 0.12, base + 0.14, ["lowpass", 200, 1], 0.008);
    });
    beep("triangle", nf("A5"), nf("E6"), 1.1, 0.02, 0, null, 0.45);
  }
  function duet(f, dur, at) { // DAVID's voice: two triangles ±6 cents, 5 Hz vibrato ±10 cents
    const t = ctx.currentTime + at;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(0.06, t + 0.02);
    env.gain.setValueAtTime(0.06, Math.max(t + 0.02, t + dur - 0.06));
    env.gain.linearRampToValueAtTime(0.0001, t + dur);
    lp.connect(env); env.connect(master);
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 5; lg.gain.value = 10; lfo.connect(lg);
    [6, -6].forEach(dt => {
      const o = ctx.createOscillator();
      o.type = "triangle"; o.frequency.value = f; o.detune.value = dt;
      lg.connect(o.detune); o.connect(lp);
      o.start(t); o.stop(t + dur + 0.05);
    });
    lfo.start(t); lfo.stop(t + dur + 0.05);
  }
  // T-spin: a sly, twisting whoop — pitch bends up then resolves, unmistakably
  // different from a plain line clear so the trick announces itself.
  function tspinI() {
    beep("triangle", nf("A4"), nf("E5"), 0.16, 0.09, 0, null, 0.01);
    beep("square", nf("E5"), nf("A5"), 0.12, 0.05, 0.13, null, 0.008);
    noiseThru(0, 0.22, 0.025, "bandpass", 700, 2600, 2);
    ["A4", "C5", "E5"].forEach((n, k) => beep("sine", nf(n) * 2, 0, 0.07, 0.05, 0.2 + k * 0.05));
  }
  // Perfect clear — the board is completely empty. Rare, so make it shimmer.
  function perfectClearI() {
    ["A4", "C5", "E5", "A5", "C6", "E6", "A6"].forEach((n, k) =>
      beep("sine", nf(n), 0, 0.5, 0.06, k * 0.06, null, 0.02));
    noiseThru(0, 0.8, 0.03, "highpass", 3000, 8000, 0.8);
  }

  function heartBurstI() { // the heart detonates: DAVID motif + sparkle explosion
    const beat = 60 / TEMPO; let off = 0.02;
    say(vDavid, V_DAVID_B, 1, 0.95, 0.02);       // …and he says his own name
    say(vMisha, V_MISHA_B, 1, 0.85, 0.62);       // she answers — David 💗 Misha
    DAVID.forEach((nb, k) => {
      const d = nb[1] * beat;
      duet(nf(nb[0]), d * 0.95, off);
      if (k === DAVID.length - 1) { // on the final D5:
        for (let s = 0; s < 7; s++) // 7 random sine pings 2–5 kHz across 450 ms
          beep("sine", 2000 + Math.random() * 3000, 0, 0.04 + Math.random() * 0.05, 0.05, off + Math.random() * 0.45);
        noiseThru(off, 0.3, 0.04, "bandpass", 4000, 4000, 1.2); // bright bloom
        ["D3", "A3", "D4"].forEach(n => beep("sine", nf(n), 0, 0.8, 0.045, off + 0.25, null, 0.18)); // warm close
      }
      off += d;
    });
  }
  function gameOverI() { // tender, not mean: first three DAVID notes at half tempo
    const beat = 0.8; let off = 0.05; // "he still loves you"
    DAVID.slice(0, 3).forEach(nb => {
      const d = nb[1] * beat;
      beep("sine", nf(nb[0]), 0, d * 0.95, 0.09, off, ["lowpass", 1500, 1], 0.03);
      off += d;
    });
    ["D3", "A3"].forEach(n => beep("sine", nf(n), 0, 2.4, 0.035, 0.05, null, 0.6)); // fading pad
  }
  function levelUpI() {
    ["A4", "B4", "C#5", "E5"].forEach((n, k) => beep("square", nf(n), 0, 0.05, 0.08, k * 0.055));
  }
  function uiSelectI() { beep("square", 990, 0, 0.03, 0.06); }

  // ---------- music: Korobeiniki loop (one lookahead scheduler, never stacks) ----------
  let mus = null, musGen = 0, musBus = null;
  function mnote(t, f, dur, type, g, det) { // 20 ms attack, 30 ms release, chiptune articulation
    const o = ctx.createOscillator(), env = ctx.createGain();
    o.type = type; o.frequency.value = f; if (det) o.detune.value = det;
    const a = Math.min(0.02, dur * 0.3);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(g, t + a);
    env.gain.setValueAtTime(g, Math.max(t + a, t + dur - 0.03));
    env.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(env); env.connect(musBus);
    o.start(t); o.stop(t + dur + 0.03);
  }
  function musicStartI(level) {
    const lv = Math.max(1, level | 0 || 1);
    const beat = 60 / (TEMPO * Math.min(1 + 0.02 * lv, 1.25));
    if (mus) { mus.beat = beat; mus.dbl = lv >= 5; return; } // live tempo/layer update — no restart, no stack
    if (!musBus) { musBus = ctx.createGain(); musBus.connect(master); }
    musBus.gain.cancelScheduledValues(ctx.currentTime);
    musBus.gain.setValueAtTime(1, ctx.currentTime);
    const m = mus = { gen: ++musGen, beat: beat, dbl: lv >= 5, li: 0, bi: 0,
                      lt: ctx.currentTime + 0.08, bt: ctx.currentTime + 0.08, timer: 0 };
    const pump = () => { // schedule ~1.4 s ahead; generation flag guards stale ticks
      if (m.gen !== musGen || !ctx) return;
      const horizon = ctx.currentTime + 1.4;
      while (m.lt < horizon) {
        const n = LEAD[m.li], d = n[1] * m.beat;
        if (n[0] !== "R") {
          mnote(m.lt, nf(n[0]), d * 0.9, "square", 0.06, 0);
          if (m.dbl) mnote(m.lt, nf(n[0]), d * 0.9, "triangle", 0.035, 8); // level 5+ doubling
        }
        m.lt += d; m.li = (m.li + 1) % LEAD.length;
      }
      while (m.bt < horizon) {
        const n = BASS[m.bi], d = n[1] * m.beat;
        mnote(m.bt, nf(n[0]), d * 0.9, "square", 0.05, 0);
        m.bt += d; m.bi = (m.bi + 1) % BASS.length;
      }
    };
    pump();
    m.timer = setInterval(pump, 300);
  }
  function musicStopI() { // instant: kill the scheduler, duck the music bus
    musGen++;
    if (mus) { clearInterval(mus.timer); mus = null; }
    if (musBus) {
      const t = ctx.currentTime;
      musBus.gain.cancelScheduledValues(t);
      musBus.gain.setValueAtTime(musBus.gain.value, t);
      musBus.gain.linearRampToValueAtTime(0.0001, t + 0.05);
    }
  }

  // ---------- public API ----------
  // Every SFX no-ops before unlock() / without WebAudio, and can never throw.
  const G = f => function () {
    if (!ctx || !master) return;
    try { return f.apply(null, arguments); } catch (e) {}
  };

  window.TT_AUDIO = {
    unlock() { try { unlockI(); } catch (e) {} },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem("tt_mute", muted ? "1" : "0"); } catch (e) {}
      try { if (master) master.gain.value = muted ? 0 : 0.5; } catch (e) {}
      return muted;
    },
    isMuted() { return muted; },
    musicStart: G(musicStartI),
    musicStop: G(musicStopI),
    move: G(moveI),
    rotate: G(rotateI),
    softDrop: G(softDropI),
    hardDrop: G(hardDropI),
    lock: G(lockI),
    hold: G(holdI),
    lineClear: G(lineClearI),
    meterLetter: G(meterLetterI),
    misha: G(() => say(vMisha, V_MISHA_B, 1, 1.0, 0)),
    david: G(() => say(vDavid, V_DAVID_B, 1, 0.95, 0)),
    tspin: G(() => tspinI()),
    perfectClear: G(() => perfectClearI()),
    heartIncoming: G(heartIncomingI),
    heartBurst: G(heartBurstI),
    levelUp: G(levelUpI),
    gameOver: G(gameOverI),
    uiSelect: G(uiSelectI),
  };

  // Warm up as early as the browser allows: a suspended context needs no
  // gesture, so both names are decoded long before they're needed.
  try { warm(); } catch (e) {}
})();
