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
// THE TWIST: waka() is a REAL RECORDED VOICE saying her name. The word is
// split at the /ʃ/ into "MEE" and "sha" and one syllable fires per pellet, at
// natural speed — so eating chants "MEE-sha-MEE-sha" and mish() says the whole
// "MEE-sha!" on game start. The clip is base64-embedded (below), decoded once
// in unlock(); waka() then only fires AudioBufferSourceNodes with start/offset
// windows, so it costs nothing at 8–10 pellets/sec. Formant-synthesized
// syllables remain as a fallback if decoding ever fails.
// ===========================================================================
(function () {
  "use strict";
  var ctx = null, master = null, wakaOut = null;
  var muted = false;
  try { muted = localStorage.getItem("mm_mute") === "1"; } catch (e) {}
  var sir = null, fri = null;          // managed loops (never stack)
  var mishBuf = [null, null];          // [MI, SHA] synth syllables (fallback)
  var voiceBuf = null;                 // the real thing: a spoken "MEE-sha"
  var mishTried = false, wakaHi = false, lastWaka = 0;
  // The voice is a real recording, embedded so it can never 404 or arrive late:
  // macOS `say -v Samantha -r 165 "Meesha"` — spelled phonetically because
  // "Misha" makes the synthesizer say MISH-uh (clipped ɪ) instead of MEE-sha.
  // Boundaries measured from the DECODED buffer (AAC adds ~30 ms of priming
  // silence, so we skip it or the chomp feels laggy). Envelope readings:
  //   0.028–0.218  RMS .36 / ZCR .01  → "MEE"  (sustained voiced vowel)
  //   0.218–0.330  RMS .14 / ZCR .21  → "sh"   (fricative — ZCR jumps 20x)
  //   0.330–0.500  RMS .30 / ZCR .02  → "uh"   (schwa)
  // Cutting at VOICE_SHEND (before the schwa) yields a clipped "MEESH" — used
  // for the faster, hungrier chant while she's chasing the blue ghosts.
  var VOICE_A = 0.028, VOICE_SH = 0.218, VOICE_SHEND = 0.325, VOICE_B = 0.500;
  var frightOn = false;             // set by fright()/stopFright()
  var VOICE_B64 = "AAAAHGZ0eXBNNEEgAAAAAE00QSBtcDQyaXNvbQAAA3ptb292AAAAbG12aGQAAAAA5op1FeaKdRUAAFYiAAA4AAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACDHRyYWsAAABcdGtoZAAAAAfminUV5op1FQAAAAEAAAAAAAA4AAAAAAAAAAAAAAAAAAEAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAahtZGlhAAAAIG1kaGQAAAAA5op1FeaKdRUAAFYiAAA4AAAAAAAAAAAiaGRscgAAAAAAAAAAc291bgAAAAAAAAAAAAAAAAAAAAABXm1pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAABInN0YmwAAAB2c3RzZAAAAAAAAAABAAAAZm1wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAABWIgAAAAAAM2VzZHMAAAAAA4CAgCIAAAAEgICAFEAUABgAAAAfwAAAu4AFgICAAhOIBoCAgAECAAAAD3NidGQAAAAASTE2AAAAGHN0dHMAAAAAAAAAAQAAAA4AAAQAAAAAKHN0c2MAAAAAAAAAAgAAAAEAAAALAAAAAQAAAAIAAAADAAAAAQAAAExzdHN6AAAAAAAAAAAAAAAOAAAABAAAAXQAAAKAAAABWwAAARYAAAEVAAABRgAAAQ8AAAFpAAABWwAAAQ4AAAENAAAA6gAAAJIAAAAYc3RjbwAAAAAAAAACAAAQAAAAHaUAAAD6dWR0YQAAAPJtZXRhAAAAAAAAACJoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAADEaWxzdAAAALwtLS0tAAAAHG1lYW4AAAAAY29tLmFwcGxlLmlUdW5lcwAAABRuYW1lAAAAAGlUdW5TTVBCAAAAhGRhdGEAAAABAAAAACAwMDAwMDAwMCAwMDAwMDg0MCAwMDAwMDI1QyAwMDAwMDAwMDAwMDAyRDY0IDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwAAAMYmZyZWUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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";
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
  function renderSyl(kind, f0) {
    return new Promise(function (resolve, reject) {
      var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!OAC || !ctx) { reject(0); return; }
      var sr = ctx.sampleRate, oc = new OAC(1, Math.ceil(sr * 0.24), sr);
      // dual detuned saws + vibrato through parallel formant bands = a voice
      function vowel(t0, t1, F, fStart, fEnd, peak) {
        var vg = oc.createGain();
        vg.gain.setValueAtTime(0, t0);
        vg.gain.linearRampToValueAtTime(peak, t0 + 0.012);
        vg.gain.setValueAtTime(peak, t1 - 0.02);
        vg.gain.linearRampToValueAtTime(0, t1);
        [1, 1.007].forEach(function (det) {
          var o = oc.createOscillator(); o.type = "sawtooth";
          o.frequency.setValueAtTime(fStart * det, t0);
          o.frequency.linearRampToValueAtTime(fEnd * det, t1);
          var lfo = oc.createOscillator(), lg = oc.createGain();
          lfo.type = "sine"; lfo.frequency.value = 5.5; lg.gain.value = fStart * 0.02;
          lfo.connect(lg); lg.connect(o.frequency);
          F.forEach(function (f) {
            var bp = oc.createBiquadFilter(); bp.type = "bandpass";
            bp.frequency.value = f[0]; bp.Q.value = f[1];
            var fg = oc.createGain(); fg.gain.value = f[2];
            o.connect(bp); bp.connect(fg); fg.connect(vg);
          });
          o.start(t0); o.stop(t1 + 0.005);
          lfo.start(t0); lfo.stop(t1 + 0.005);
        });
        vg.connect(oc.destination);
      }
      if (kind === "mi") {
        // "MI" — nasal m murmur into the ɪ of "mish" (F1 430, F2 2000)
        var mo = oc.createOscillator(); mo.type = "triangle"; mo.frequency.value = f0;
        var mf = oc.createBiquadFilter(); mf.type = "lowpass"; mf.frequency.value = 400;
        var mg = oc.createGain();
        mg.gain.setValueAtTime(0, 0);
        mg.gain.linearRampToValueAtTime(0.35, 0.03);
        mg.gain.linearRampToValueAtTime(0, 0.05);
        link(mo, mf, mg, oc.destination);
        mo.start(0); mo.stop(0.052);
        vowel(0.04, 0.2, [[430, 8, 1.3], [2000, 9, 1.0], [2900, 11, 0.4]], f0, f0 * 0.97, 0.9);
      } else {
        // "SHA" — big bright ʃ burst into an open "ah", word-final fall
        var ns = oc.createBufferSource(); ns.buffer = noiseBuf(oc, 0.1);
        var nf = oc.createBiquadFilter(); nf.type = "bandpass";
        nf.frequency.value = 3100; nf.Q.value = 0.7;
        var ng = oc.createGain();
        ng.gain.setValueAtTime(0.9, 0);
        ng.gain.exponentialRampToValueAtTime(0.05, 0.09);
        link(ns, nf, ng, oc.destination);
        ns.start(0); ns.stop(0.1);
        var n2 = oc.createBufferSource(); n2.buffer = noiseBuf(oc, 0.08);
        var f2 = oc.createBiquadFilter(); f2.type = "highpass"; f2.frequency.value = 4500;
        var g2 = oc.createGain();
        g2.gain.setValueAtTime(0.35, 0);
        g2.gain.exponentialRampToValueAtTime(0.02, 0.08);
        link(n2, f2, g2, oc.destination);
        n2.start(0); n2.stop(0.085);
        vowel(0.075, 0.225, [[760, 7, 1.3], [1150, 8, 0.9], [2600, 12, 0.3]], f0 * 0.92, f0 * 0.8, 0.85);
      }
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
      try { // decode the embedded recording (no network, no cache, no 404)
        var bin = atob(VOICE_B64), len = bin.length, bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
        var dec = ctx.decodeAudioData(bytes.buffer,
          function (b) { voiceBuf = b; }, function () {});
        if (dec && dec.then) dec.then(function (b) { voiceBuf = b; }, function () {});
      } catch (e) {}
      try { // synth syllable pair as fallback — waka alternates MI / SHA
        renderSyl("mi", 215).then(function (b) { mishBuf[0] = b; }, function () {});
        renderSyl("sha", 205).then(function (b) { mishBuf[1] = b; }, function () {});
      } catch (e) {} // and plain blips cover us if everything else fails
    },

    toggleMute: function () {
      muted = !muted;
      try { localStorage.setItem("mm_mute", muted ? "1" : "0"); } catch (e) {}
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    isMuted: function () { return muted; },

    // the chomp — a real spoken "Misha!" chattering hi/lo like the waka;
    // falls back to synth MI/SHA syllables, then plain blips
    waka: function () {
      var c = ensure(); if (!c) return;
      // 0.17 lets MEE flow straight into sha (one continuous "MEE-sha"); the
      // fright chant needs 0.245 or the clipped MEESHes smear into one vowel
      var gap = voiceBuf ? (frightOn ? 0.245 : 0.17) : 0.1;
      // Throttle on the monotonic clock, NOT ctx.currentTime: a suspended
      // context freezes currentTime, so that comparison silently swallows
      // every single chomp until the context happens to resume.
      var now = (window.performance && performance.now ? performance.now() : Date.now()) / 1000;
      if (now - lastWaka < gap) return;
      lastWaka = now;
      wakaHi = !wakaHi;
      if (voiceBuf) {
        var vs = c.createBufferSource(); vs.buffer = voiceBuf;
        if (frightOn) {
          // POWER-UP CHANT: every pellet is a whole clipped "MEESH", a touch
          // faster — so hunting the blue ghosts goes meesh-meesh-meesh-meesh
          var fg = c.createGain(), dur = (VOICE_SHEND - VOICE_A) / 1.35;
          vs.playbackRate.value = 1.35;   // a shade higher = excited, not chipmunk
          fg.gain.setValueAtTime(1, c.currentTime);
          fg.gain.setValueAtTime(1, c.currentTime + dur - 0.025);
          fg.gain.linearRampToValueAtTime(0.0001, c.currentTime + dur); // no click
          link(vs, fg, wakaOut);
          vs.start(0, VOICE_A, VOICE_SHEND - VOICE_A);
          return;
        }
        // one syllable per pellet at NATURAL speed, so eating chants
        // "MEE-sha-MEE-sha" in her actual voice instead of a chipmunk blur
        vs.connect(wakaOut);
        if (wakaHi) vs.start(0, VOICE_A, VOICE_SH - VOICE_A);    // "MEE"
        else vs.start(0, VOICE_SH, VOICE_B - VOICE_SH);          // "sha"
        return;
      }
      var b = mishBuf[wakaHi ? 0 : 1];
      if (b) {
        var s = c.createBufferSource(); s.buffer = b;
        s.connect(wakaOut);
        s.start(); s.stop(c.currentTime + 0.24);
        return;
      } // graceful fallback: plain alternating square blips
      tone({ type: "square", f0: wakaHi ? 380 : 300, dur: 0.06, peak: 0.12, pluck: true });
    },

    // one loud, clear "Misha!" — fired the moment a game starts
    mish: function () {
      var c = ensure(); if (!c) return;
      if (voiceBuf) { // the whole word, front and centre: "MEE-sha!"
        var s0 = c.createBufferSource(), g0 = c.createGain();
        s0.buffer = voiceBuf; g0.gain.value = 1.0;
        link(s0, g0, master);
        s0.start(0, VOICE_A, VOICE_B - VOICE_A);
        return;
      }
      if (!mishBuf[0] || !mishBuf[1]) { // still decoding on the 1st gesture
        setTimeout(function () { if (voiceBuf || (mishBuf[0] && mishBuf[1])) API.mish(); }, 320);
        return;
      }
      [[mishBuf[0], 0], [mishBuf[1], 0.19]].forEach(function (bt) {
        var s = c.createBufferSource(), g = c.createGain();
        s.buffer = bt[0]; g.gain.value = 0.65;
        link(s, g, master);
        s.start(c.currentTime + bt[1]); s.stop(c.currentTime + bt[1] + 0.26);
      });
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
      frightOn = true;               // waka switches to the "MEESH" chant
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
      frightOn = false;
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
