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

  function unlockI() { // wire to the first user gesture; iOS-safe lazy create + resume
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5; // single master bus, hard-capped at 0.5
      master.connect(ctx.destination);
      preRender();
    }
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
    if (n === 4) return fanfare();
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
  function heartBurstI() { // the heart detonates: DAVID motif + sparkle explosion
    const beat = 60 / TEMPO; let off = 0.02;
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
    heartIncoming: G(heartIncomingI),
    heartBurst: G(heartBurstI),
    levelUp: G(levelUpI),
    gameOver: G(gameOverI),
    uiSelect: G(uiSelectI),
  };
})();
