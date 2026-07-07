// MISHA-MAN audio — everything synthesized live with WebAudio, no assets.
(function () {
  let ctx = null, master = null;
  let muted = localStorage.getItem("mm_mute") === "1";
  let sirenNodes = null, frightNodes = null;
  let wakaHigh = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // one enveloped oscillator: type, freq from f0→f1 over dur, gain g
  function blip(type, f0, f1, dur, g, when) {
    if (!ensure()) return;
    const t = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator(), env = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(g, t + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(env); env.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  const N = { C4:262, D4:294, E4:330, F4:349, G4:392, A4:440, B4:494,
              C5:523, D5:587, E5:659, F5:698, G5:784, A5:880, B5:988,
              C6:1047, D6:1175, E6:1319, G6:1568 };

  function seq(notes, step, type, g) {
    notes.forEach((n, i) => { if (n) blip(type || "square", N[n] || n, 0, step * 0.9, g || 0.16, i * step); });
  }

  const A = {
    unlock() { ensure(); },
    toggleMute() {
      muted = !muted;
      localStorage.setItem("mm_mute", muted ? "1" : "0");
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    isMuted() { return muted; },

    waka() { wakaHigh = !wakaHigh; blip("square", wakaHigh ? 520 : 340, wakaHigh ? 340 : 520, 0.07, 0.12); },
    ready() { seq(["E5","G5","B5","A5","G5","E5","G5","A5","B5",0,"E6"], 0.13, "square", 0.14); },
    fruit() { seq(["A5","E6"], 0.09, "triangle", 0.22); },
    eatGhost(chain) { blip("square", 220, 880 + chain * 220, 0.28, 0.2); },
    letterLit() { seq(["C5","E5","G5","C6"], 0.07, "triangle", 0.2); },
    extraLife() { seq(["C5","E5","G5","C6","E6","G6"], 0.09, "square", 0.16); },
    death() {
      blip("sawtooth", 620, 60, 1.0, 0.2);
      seq([0, 0, 0, 0, "E4", "C4"], 0.16, "triangle", 0.18);
    },
    levelClear() { seq(["C5","D5","E5","G5","A5","C6","D6","E6"], 0.09, "square", 0.16); },
    heartbeat() { blip("sine", 90, 60, 0.15, 0.3); },

    siren(rate) { // rate 0..1 rises as pellets deplete
      if (!ensure() || muted) return;
      if (!sirenNodes) {
        const o = ctx.createOscillator(), lfo = ctx.createOscillator(),
              lg = ctx.createGain(), env = ctx.createGain();
        o.type = "triangle"; o.frequency.value = 300;
        lfo.type = "sine"; lfo.frequency.value = 2.2;
        lg.gain.value = 60; lfo.connect(lg); lg.connect(o.frequency);
        env.gain.value = 0.035;
        o.connect(env); env.connect(master);
        o.start(); lfo.start();
        sirenNodes = { o, lfo, env };
      }
      sirenNodes.o.frequency.value = 300 + rate * 240;
      sirenNodes.lfo.frequency.value = 2.2 + rate * 3.5;
    },
    stopSiren() { if (sirenNodes) { try { sirenNodes.o.stop(); sirenNodes.lfo.stop(); } catch (e) {} sirenNodes = null; } },

    fright() {
      if (!ensure() || muted) return;
      this.stopSiren();
      if (!frightNodes) {
        const o = ctx.createOscillator(), lfo = ctx.createOscillator(),
              lg = ctx.createGain(), env = ctx.createGain();
        o.type = "square"; o.frequency.value = 180;
        lfo.type = "sine"; lfo.frequency.value = 9;
        lg.gain.value = 90; lfo.connect(lg); lg.connect(o.frequency);
        env.gain.value = 0.03;
        o.connect(env); env.connect(master);
        o.start(); lfo.start();
        frightNodes = { o, lfo };
      }
    },
    stopFright() { if (frightNodes) { try { frightNodes.o.stop(); frightNodes.lfo.stop(); } catch (e) {} frightNodes = null; } },
    stopLoops() { this.stopSiren(); this.stopFright(); },
  };
  window.MM_AUDIO = A;
})();
