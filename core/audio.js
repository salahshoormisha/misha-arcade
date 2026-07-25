/* ============================================================================
   MIDNIGHT ARCADE · DAILY WING — shared sound
   Pure WebAudio, zero files. Follows the arcade's existing SOUND_SPEC voice:
   letters map to notes (A–G cycling), MISHA's motif is F–A–B–D–E, DAVID's is
   D–A–A–B–D, and everything is short, bright and slightly Y2K.
   ========================================================================== */
(function (A) {
  "use strict";
  var ctx = null, master = null;

  function ensure() {
    if (!A.settings().sound) return null;
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // note name → frequency (equal temperament, A4 = 440)
  var SEMI = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  function freq(note) {
    var m = /^([A-G])(#|b)?(-?\d)$/.exec(note);
    if (!m) return 440;
    var s = SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + (+m[3] - 4) * 12;
    return 440 * Math.pow(2, s / 12);
  }
  A.noteFreq = freq;

  function blip(o) {
    var c = ensure(); if (!c) return;
    o = o || {};
    var t = c.currentTime + (o.at || 0);
    var osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || "triangle";
    var f = typeof o.note === "string" ? freq(o.note) : (o.f || 660);
    osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + (o.dur || .12));
    var vol = (o.vol === undefined ? .5 : o.vol);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (o.dur || .12));
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + (o.dur || .12) + .02);
  }

  function noise(o) {
    var c = ensure(); if (!c) return;
    o = o || {};
    var len = Math.floor(c.sampleRate * (o.dur || .08));
    var buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource(); src.buffer = buf;
    var bp = c.createBiquadFilter(); bp.type = "bandpass";
    bp.frequency.value = o.f || 1800; bp.Q.value = o.q || 1.2;
    var g = c.createGain(); g.gain.value = o.vol === undefined ? .35 : o.vol;
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(c.currentTime + (o.at || 0));
  }

  var S = {
    key:    function () { blip({ note: "A4", dur: .045, vol: .18, type: "square" }); },
    type:   function () { blip({ f: 520, dur: .035, vol: .14, type: "square" }); },
    ok:     function (i) { blip({ note: ["C5", "E5", "G5", "B5", "D6"][(i || 0) % 5], dur: .16, vol: .4 }); },
    near:   function () { blip({ note: "F4", dur: .14, vol: .3, type: "sine" }); },
    miss:   function () { blip({ f: 180, to: 120, dur: .16, vol: .28, type: "sawtooth" }); },
    bad:    function () { blip({ f: 200, to: 90, dur: .3, vol: .3, type: "sawtooth" }); noise({ f: 400, dur: .18, vol: .15 }); },
    reveal: function () { noise({ f: 2600, dur: .12, vol: .22 }); blip({ note: "E5", dur: .1, vol: .18 }); },
    tick:   function () { blip({ f: 1400, dur: .025, vol: .1, type: "square" }); },
    stamp:  function () { noise({ f: 900, dur: .1, vol: .4, q: .6 }); blip({ f: 300, to: 140, dur: .12, vol: .3, type: "triangle" }); },
    // MISHA's motif — the arcade's win sting.
    win:    function () {
      ["F4", "A4", "B4", "D5", "E5"].forEach(function (n, i) {
        blip({ note: n, dur: .18, vol: .42, at: i * .09, type: "triangle" });
      });
      blip({ note: "A5", dur: .5, vol: .3, at: .48, type: "sine" });
    },
    // DAVID's motif — used when the league says he beat her, or vice versa.
    david:  function () {
      ["D4", "A4", "A4", "B4", "D5"].forEach(function (n, i) {
        blip({ note: n, dur: .16, vol: .36, at: i * .1, type: "sine" });
      });
    },
    lose:   function () { ["D4", "C4", "A3"].forEach(function (n, i) { blip({ note: n, dur: .26, vol: .3, at: i * .13, type: "sine" }); }); },
    perfect: function () {
      [0, 1, 2, 3, 4, 5].forEach(function (i) {
        blip({ note: ["F4", "A4", "C5", "E5", "A5", "C6"][i], dur: .3, vol: .3, at: i * .06, type: "triangle" });
      });
      noise({ f: 5200, dur: .5, vol: .1, at: .1, q: .4 });
    },
  };

  A.sfx = function (name, arg) { try { (S[name] || function () {})(arg); } catch (e) {} };
  A.sfxReady = function () { ensure(); };

  // Unlock audio on the first gesture (iOS/Safari requirement).
  ["pointerdown", "keydown"].forEach(function (ev) {
    document.addEventListener(ev, function once() {
      ensure();
      document.removeEventListener(ev, once);
    }, { once: true });
  });

})(window.A);
