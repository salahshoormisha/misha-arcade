// ===========================================================================
// MISHA-MAN audio — window.MM_AUDIO. Everything synthesized live via WebAudio
// (zero assets). Vanilla IIFE; nothing here may throw, even without WebAudio.
//
// THE CRYPTOGRAM — letters map to notes through the repeating A–G cycle
// (H wraps to A, I to B, ... P to B, S to E, ...):
//   M→F   I→B   S→E   H→A   A→A
//   MISHA motif  : F4 A4 B4 D5 E5 A4 A5   (~1.8 s at 150 BPM). The letters
//                  land on notes 1,3,5,6,7 (F=M, B=I, E=S, A=H, A=A);
//                  notes 2 & 4 (A4, D5) are passing ornaments.
//   Letter ladder: M=F4  I=B4  S=E5  H=A5  A=A6 — stacked fourths, so the
//                  maze letters lighting 0→4 spell a cumulative Fmaj7#11.
//   DAVID motif  : D4 A4 A4 B4 D5 (D=D A=A V=A I=B D=D) lives in TETRISHA;
//                  here the death tail sighs F→E (Am b6→5), quietly quoting
//                  letters M and S.
// KEY WORLD: everything A minor; MISHA fanfares end Picardy (A major).
// THE TWIST: waka() is a tiny formant-synthesized voice — m(25ms) → ee(45ms)
// → sh(50ms) — so every pellet literally says "MISH", alternating hi/lo
// pitch variants exactly like the classic waka. Both variants are pre-rendered
// into AudioBuffers via OfflineAudioContext inside unlock(); waka() then only
// fires AudioBufferSourceNodes (survives 8–10 calls/sec with zero graph churn).
// ===========================================================================
(function () {
  "use strict";
  var ctx = null, master = null, wakaOut = null;
  var muted = false;
  try { muted = localStorage.getItem("mm_mute") === "1"; } catch (e) {}
  var sir = null, fri = null;          // managed loops (never stack)
  var mishBuf = [null, null];          // [hi, lo] pre-rendered "MISH" chomps
  var mishTried = false, wakaHi = false, lastWaka = 0;
  var BEAT = 60 / 150;                 // tempoBpm 150
  var LETTER_NOTES = ["F4", "B4", "E5", "A5", "A6"];              // M I S H A
  var MISHA = [["F4", 0.5], ["A4", 0.5], ["B4", 0.5], ["D5", 0.5],
               ["E5", 1], ["A4", 0.5], ["A5", 1]];                // the motif

  // ---- tiny music theory: "C#5" -> Hz ------------------------------------
  function noteHz(n) {
    var m = /^([A-G])([#b]?)(\d)$/.exec(n || "");
    if (!m) return 0;
    var s = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] +
            (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    return 440 * Math.pow(2, (12 * (+m[3] + 1) + s - 69) / 12);
  }

  // ---- lazy, iOS-safe context (created on demand, resumed on gesture) ----
  function ensure() {
    try {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();               // single master, hard cap 0.5
        master.gain.value = muted ? 0 : 0.5;
        master.connect(ctx.destination);
        wakaOut = ctx.createGain();              // persistent chomp bus
        wakaOut.gain.value = 0.34;               // loud & proud — she must hear MISH
        wakaOut.connect(master);
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }

  function link() { // connect(a,b,c,...) without relying on chainable connect
    for (var i = 0; i + 1 < arguments.length; i++) arguments[i].connect(arguments[i + 1]);
  }

  // ---- one-shot enveloped oscillator --------------------------------------
  // o = {type,f0,f1,exp,at,dur,peak,a,r,pluck,lp}; every source gets .stop()
  function tone(o) {
    var c = ensure(); if (!c) return;
    var t = c.currentTime + (o.at || 0), d = o.dur;
    var osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || "square";
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1 && o.f1 !== o.f0) {
      if (o.exp) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + d);
      else osc.frequency.linearRampToValueAtTime(o.f1, t + d);
    }
    var a = Math.min(o.a != null ? o.a : 0.008, d * 0.5);
    var r = Math.min(o.r != null ? o.r : 0.03, d * 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.peak, t + a);
    if (o.pluck) g.gain.exponentialRampToValueAtTime(0.0001, t + d); // 0.0001 floor
    else {
      g.gain.setValueAtTime(o.peak, t + d - r);
      g.gain.linearRampToValueAtTime(0.0001, t + d);
    }
    if (o.lp) {
      var f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lp;
      link(osc, f, g, master);
    } else link(osc, g, master);
    osc.start(t); osc.stop(t + d + 0.03);
  }

  function noiseBuf(c, dur) { // white-noise buffer in any (incl. offline) ctx
    var b = c.createBuffer(1, Math.max(1, Math.round(c.sampleRate * dur)), c.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  // ---- one-shot filtered noise: o = {at,dur,peak,type,f0,q} ---------------
  function noiseHit(o) {
    var c = ensure(); if (!c) return;
    var t = c.currentTime + (o.at || 0);
    var s = c.createBufferSource(); s.buffer = noiseBuf(c, o.dur);
    var f = c.createBiquadFilter(); f.type = o.type || "bandpass";
    f.frequency.value = o.f0; if (o.q) f.Q.value = o.q;
    var g = c.createGain();
    g.gain.setValueAtTime(o.peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    link(s, f, g, master);
    s.start(t); s.stop(t + o.dur + 0.02);
  }

  // ---- the "MISH" chomp, rendered offline once per variant ----------------
  // m(25ms nasal hum) → ee(45ms formant vowel) → sh(50ms fricative) = 120 ms,
  // ~5 ms crossfades so it reads as one vocal gesture. Formant frequencies
  // stay FIXED across hi/lo (only f0 transposes) — that keeps it a "voice".
  function renderMish(f0, shHz) {
    return new Promise(function (resolve, reject) {
      var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!OAC || !ctx) { reject(0); return; }
      var sr = ctx.sampleRate, oc = new OAC(1, Math.ceil(sr * 0.21), sr);
      // m — closed-lips hum: triangle @ f0, lowpass 450 — a real "M" onset
      var mo = oc.createOscillator(); mo.type = "triangle"; mo.frequency.value = f0;
      var mf = oc.createBiquadFilter(); mf.type = "lowpass"; mf.frequency.value = 450;
      var mg = oc.createGain();
      mg.gain.setValueAtTime(0, 0);
      mg.gain.linearRampToValueAtTime(0.5, 0.03);
      mg.gain.linearRampToValueAtTime(0, 0.04);           // xfade into the vowel
      link(mo, mf, mg, oc.destination);
      mo.start(0); mo.stop(0.042);
      // ee — long bright vowel: saw f0→f0*1.05 through THREE parallel formants
      var eo = oc.createOscillator(); eo.type = "sawtooth";
      eo.frequency.setValueAtTime(f0, 0.028);
      eo.frequency.linearRampToValueAtTime(f0 * 1.05, 0.108);
      var eg = oc.createGain();
      eg.gain.setValueAtTime(0, 0.028);
      eg.gain.linearRampToValueAtTime(0.9, 0.036);
      eg.gain.setValueAtTime(0.9, 0.102);
      eg.gain.linearRampToValueAtTime(0, 0.112);
      [[320, 7, 1.2], [2400, 9, 1.0], [3100, 11, 0.45]].forEach(function (F) {
        var bp = oc.createBiquadFilter(); bp.type = "bandpass";
        bp.frequency.value = F[0]; bp.Q.value = F[1];
        var fg = oc.createGain(); fg.gain.value = F[2];
        link(eo, bp, fg, eg);
      });
      eg.connect(oc.destination);
      eo.start(0.028); eo.stop(0.115);
      // sh — the signature: wide bandpassed noise, big attack, long tail
      var ns = oc.createBufferSource(); ns.buffer = noiseBuf(oc, 0.105);
      var nf = oc.createBiquadFilter(); nf.type = "bandpass";
      nf.frequency.value = shHz; nf.Q.value = 0.8;
      var ng = oc.createGain();
      ng.gain.setValueAtTime(0.85, 0.1);
      ng.gain.exponentialRampToValueAtTime(0.0001, 0.205);
      link(ns, nf, ng, oc.destination);
      ns.start(0.1); ns.stop(0.208);
      var done = function (buf) { // normalize → playback peak == wakaOut 0.18
        var d = buf.getChannelData(0), p = 0, i;
        for (i = 0; i < d.length; i++) p = Math.max(p, Math.abs(d[i]));
        if (p > 0) for (i = 0; i < d.length; i++) d[i] /= p;
        resolve(buf);
      };
      var pr = oc.startRendering();
      if (pr && pr.then) pr.then(done, reject);
      else oc.oncomplete = function (e) { done(e.renderedBuffer); };
    });
  }

  // ---- motif player: chiptune articulation (20 ms attack, 30 ms release,
  // notes sound for 90% of their slot); returns total scheduled length ------
  function motif(seq, o) {
    if (!ensure()) return 0;
    var at = o.at || 0;
    seq.forEach(function (ev) {
      var dur = ev[1] * BEAT, hz = noteHz(ev[0]);
      if (hz) {
        tone({ type: o.type || "square", f0: hz, at: at, dur: dur * 0.9,
               peak: o.peak, a: 0.02, r: 0.03 });
        if (o.oct) tone({ type: "triangle", f0: hz * 2, at: at, dur: dur * 0.9,
                          peak: o.peak * 0.5, a: 0.02, r: 0.03 });
      }
      at += dur;
    });
    return at;
  }

  // ======================== public API =====================================
  var API = {
    // first user gesture: create/resume ctx + pre-render both chomp variants
    unlock: function () {
      if (!ensure()) return;
      if (mishTried) return;
      mishTried = true;
      try { // hi/lo alternate like the classic waka; femme register reads as voice
        renderMish(205, 3400).then(function (b) { mishBuf[0] = b; }, function () {});
        renderMish(160, 3000).then(function (b) { mishBuf[1] = b; }, function () {});
      } catch (e) {} // fallback blips cover us if offline rendering fails
    },

    toggleMute: function () {
      muted = !muted;
      try { localStorage.setItem("mm_mute", muted ? "1" : "0"); } catch (e) {}
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    isMuted: function () { return muted; },

    // the MISH chomp — buffer playback only; alternates hi/lo, throttled so
    // fast eating stays a crisp "mish mish mish" instead of a smear
    waka: function () {
      var c = ensure(); if (!c) return;
      if (c.currentTime - lastWaka < 0.1) return;
      lastWaka = c.currentTime;
      wakaHi = !wakaHi;
      var b = mishBuf[wakaHi ? 0 : 1];
      if (b) {
        var s = c.createBufferSource(); s.buffer = b;
        s.connect(wakaOut);
        s.start(); s.stop(c.currentTime + 0.24);
        return;
      } // graceful fallback: plain alternating square blips
      tone({ type: "square", f0: wakaHi ? 380 : 300, dur: 0.06, peak: 0.12, pluck: true });
    },

    // one loud, clear "MISH!" — fired the moment a game starts
    mish: function () {
      var c = ensure(); if (!c) return;
      var b = mishBuf[0];
      if (!b) { API.waka(); return; }
      var s = c.createBufferSource(), g = c.createGain();
      s.buffer = b; g.gain.value = 0.6;
      link(s, g, master);
      s.start(); s.stop(c.currentTime + 0.24);
    },

    ready: function () { motif(MISHA, { peak: 0.13 }); }, // MISHA jingle, 1.8 s

    // classic rising drone; update-safe every frame, single persistent pair
    siren: function (rate) {
      var c = ensure(); if (!c) return;
      var r = Math.max(0, Math.min(1, +rate || 0));
      if (!sir) {
        var o = c.createOscillator(), l = c.createOscillator(),
            lg = c.createGain(), g = c.createGain();
        o.type = "triangle"; o.frequency.value = 300 + 240 * r;
        l.type = "sine"; l.frequency.value = 2.2 + 2.4 * r;
        lg.gain.value = 60 + 110 * r;
        link(l, lg); lg.connect(o.frequency);
        g.gain.value = 0.05;
        link(o, g, master);
        o.start(); l.start();                       // managed loop: no .stop()
        sir = { o: o, l: l, lg: lg, g: g };
      }
      var t = c.currentTime;                        // lerp params, tau 50 ms
      sir.o.frequency.setTargetAtTime(300 + 240 * r, t, 0.05);
      sir.l.frequency.setTargetAtTime(2.2 + 2.4 * r, t, 0.05);
      sir.lg.gain.setTargetAtTime(60 + 110 * r, t, 0.05);
    },
    stopSiren: function () {
      if (!sir) return;
      try { sir.o.stop(); sir.l.stop(); sir.g.disconnect(); } catch (e) {}
      sir = null;
    },

    // bubbling warble while ghosts are frightened (called every frame)
    fright: function () {
      var c = ensure(); if (!c) return;
      API.stopSiren();               // fright replaces the drone, never layers
      if (fri) return;               // non-stacking
      var o = c.createOscillator(), l = c.createOscillator(),
          lg = c.createGain(), f = c.createBiquadFilter(), g = c.createGain();
      o.type = "square";
      o.frequency.value = 410;       // square 260 Hz + unipolar 7 Hz LFO,
      l.type = "sine";               // depth 150 → wobbles ~260↔560
      l.frequency.value = 7;
      lg.gain.value = 150;
      link(l, lg); lg.connect(o.frequency);
      f.type = "lowpass"; f.frequency.value = 1500;
      g.gain.value = 0.045;
      link(o, f, g, master);
      o.start(); l.start();                         // managed loop
      fri = { o: o, l: l, g: g };
    },
    stopFright: function () {
      if (!fri) return;
      try { fri.o.stop(); fri.l.stop(); fri.g.disconnect(); } catch (e) {}
      fri = null;
    },

    // rising zip, higher per chain; +fifth blip; chain 3 adds an octave ping
    eatGhost: function (chain) {
      if (!ensure()) return;
      var ch = Math.max(0, Math.min(3, chain | 0)), f1 = 900 + 350 * ch;
      tone({ type: "square", f0: 180 * Math.pow(2, ch / 6), f1: f1, exp: true,
             dur: 0.16, peak: 0.07 });
      tone({ type: "square", f0: f1 * 1.5, at: 0.16, dur: 0.03, peak: 0.06, pluck: true });
      if (ch === 3) tone({ type: "sine", f0: f1 * 2, at: 0.19, dur: 0.06, peak: 0.06, pluck: true });
    },

    // ~1.4 s original death: deflating stair-glide + F→E sigh + poof
    death: function () {
      var c = ensure(); if (!c) return;
      var t = c.currentTime + 0.02, a5 = noteHz("A5");
      var o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
      o.type = "triangle"; f.type = "lowpass";
      f.frequency.setValueAtTime(4000, t);                  // filter tracks down
      f.frequency.exponentialRampToValueAtTime(500, t + 0.84);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.02);
      g.gain.setValueAtTime(0.14, t + 0.8);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.86);
      for (var i = 0; i < 12; i++) {  // A5→A3: 12 × 70 ms steps of 2 semitones,
        var st = t + i * 0.07;        // each with a −15% dip (deflating balloon)
        var hz = a5 * Math.pow(2, -i / 6);
        o.frequency.setValueAtTime(hz, st);
        o.frequency.linearRampToValueAtTime(hz * 0.85, st + 0.065);
      }
      link(o, f, g, master);
      o.start(t); o.stop(t + 0.88);
      // tail: sine sigh F4 (180 ms) → E4 (320 ms) — Am b6→5, quotes M and S
      var s = c.createOscillator(), sg = c.createGain();
      s.type = "sine";
      s.frequency.setValueAtTime(noteHz("F4"), t + 0.86);
      s.frequency.setValueAtTime(noteHz("F4"), t + 1.01);
      s.frequency.linearRampToValueAtTime(noteHz("E4"), t + 1.06);
      sg.gain.setValueAtTime(0.0001, t + 0.86);
      sg.gain.linearRampToValueAtTime(0.11, t + 0.9);
      sg.gain.setValueAtTime(0.11, t + 1.16);
      sg.gain.linearRampToValueAtTime(0.0001, t + 1.38);
      link(s, sg, master);
      s.start(t + 0.86); s.stop(t + 1.4);
      // pink-ish noise poof, ~200 ms at −18 dB (0.126)
      noiseHit({ at: 0.88, dur: 0.2, peak: 0.126, type: "lowpass", f0: 700 });
    },

    fruit: function () { // two-note pluck E5 → A5, 80 ms each
      tone({ type: "triangle", f0: noteHz("E5"), dur: 0.08, peak: 0.16, pluck: true });
      tone({ type: "triangle", f0: noteHz("A5"), at: 0.08, dur: 0.08, peak: 0.16, pluck: true });
    },

    // letter i (0=M..4=A) cleared: its ladder note + sparkle; i=4 is grander
    letterLit: function (i) {
      if (!ensure()) return;
      i = Math.max(0, Math.min(4, i | 0));
      var hz = noteHz(LETTER_NOTES[i]);
      tone({ type: "triangle", f0: hz, dur: 0.09, peak: 0.16, a: 0.005, r: 0.04 });
      if (i < 4) { // sparkle arp +7 / +12 semitones, 40 ms each
        tone({ type: "sine", f0: hz * Math.pow(2, 7 / 12), at: 0.05, dur: 0.04, peak: 0.09, pluck: true });
        tone({ type: "sine", f0: hz * 2, at: 0.09, dur: 0.04, peak: 0.09, pluck: true });
      } else {     // octave-doubled crown + full 5-note ladder arp up to A6
        tone({ type: "triangle", f0: hz / 2, dur: 0.09, peak: 0.12, a: 0.005, r: 0.04 });
        LETTER_NOTES.forEach(function (n, k) {
          tone({ type: "sine", f0: noteHz(n), at: 0.06 + k * 0.04, dur: 0.05, peak: 0.1, pluck: true });
        });
      }
    },

    // triumphant full MISHA motif: crash + octave doubling + Picardy close
    levelClear: function () {
      if (!ensure()) return;
      noiseHit({ dur: 0.3, peak: 0.09, type: "highpass", f0: 4000 }); // downbeat crash
      var end = motif(MISHA, { peak: 0.13, oct: true });
      // A-major chord under the held final A5 — "MISHA fanfares end Picardy"
      ["A4", "C#5", "E5"].forEach(function (n) {
        tone({ type: "triangle", f0: noteHz(n), at: end - BEAT, dur: 0.55,
               peak: 0.05, a: 0.02, r: 0.2 });
      });
    },

    extraLife: function () { // happy A-major up-arp, 60 ms per note
      ["A4", "C#5", "E5", "A5"].forEach(function (n, k) {
        tone({ type: "square", f0: noteHz(n), at: k * 0.06, dur: 0.055, peak: 0.11, pluck: true });
      });
    },

    uiSelect: function () { tone({ type: "square", f0: 990, dur: 0.03, peak: 0.08, pluck: true }); },

    stopLoops: function () { API.stopSiren(); API.stopFright(); },
  };

  window.MM_AUDIO = API;
})();
