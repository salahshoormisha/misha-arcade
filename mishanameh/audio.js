/* MISHANAMEH — synthesised sound. No audio files.
   The scales are real Persian dastgāh, quarter-tones and all: intervals are given
   in cents and converted exactly, so the "koron" (half-flat) second you hear in
   Shur is the actual interval, not a piano approximation of it. */

const AUDIO = (()=>{
let AC=null, master=null, bus=null, started=false, ambient=null;

/* cents → ratio */
const c2r = (cents)=>Math.pow(2, cents/1200);
const SHUR      = [0,150,300,500,700,800,1000,1200];        // the everyday Persian mode
const CHAHARGAH = [0,100,400,500,700,800,1100,1200];         // dramatic, augmented 2nd
const deg = (scale, i, base=220)=>base*c2r(scale[((i%scale.length)+scale.length)%scale.length] + 1200*Math.floor(i/scale.length));

function ensure(){
  if(AC) return AC;
  try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; }
  master = AC.createGain(); master.gain.value = 0.30; master.connect(AC.destination);
  const rev = makeReverb(2.1, 2.6);
  bus = AC.createGain(); bus.gain.value = 1; bus.connect(master);
  const send = AC.createGain(); send.gain.value = 0.26; bus.connect(send); send.connect(rev); rev.connect(master);
  return AC;
}
function makeReverb(sec, decay){
  const conv = AC.createConvolver();
  const len = Math.floor(AC.sampleRate*sec);
  const buf = AC.createBuffer(2, len, AC.sampleRate);
  for(let ch=0; ch<2; ch++){
    const d = buf.getChannelData(ch);
    for(let i=0;i<len;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, decay);
  }
  conv.buffer = buf; return conv;
}
function on(){ return !SAVE.mute; }
function now(){ return AC.currentTime; }

/* a plucked string — santur / tār */
function pluck(freq, t, dur=0.9, gain=0.22, type='triangle'){
  const o=AC.createOscillator(), g=AC.createGain(), f=AC.createBiquadFilter();
  o.type=type; o.frequency.setValueAtTime(freq, t);
  f.type='lowpass'; f.frequency.setValueAtTime(freq*7, t); f.frequency.exponentialRampToValueAtTime(Math.max(220,freq*1.6), t+dur*0.7);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(gain, t+0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
  o.connect(f); f.connect(g); g.connect(bus); o.start(t); o.stop(t+dur+0.05);
  // sympathetic octave, quieter — santur has doubled courses
  const o2=AC.createOscillator(), g2=AC.createGain();
  o2.type='sine'; o2.frequency.setValueAtTime(freq*2.01, t);
  g2.gain.setValueAtTime(0.0001,t); g2.gain.exponentialRampToValueAtTime(gain*0.3,t+0.01);
  g2.gain.exponentialRampToValueAtTime(0.0001,t+dur*0.6);
  o2.connect(g2); g2.connect(bus); o2.start(t); o2.stop(t+dur);
}

/* frame drum — tombak */
function drum(t, freq=140, gain=0.4, dur=0.28, noiseAmt=0.5){
  const o=AC.createOscillator(), g=AC.createGain();
  o.type='sine'; o.frequency.setValueAtTime(freq*2.4,t); o.frequency.exponentialRampToValueAtTime(freq*0.6, t+dur*0.5);
  g.gain.setValueAtTime(gain,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t+dur+0.02);
  if(noiseAmt>0){
    const n = noise(0.13), ng=AC.createGain(), nf=AC.createBiquadFilter();
    nf.type='bandpass'; nf.frequency.value=1500; nf.Q.value=0.8;
    ng.gain.setValueAtTime(gain*noiseAmt,t); ng.gain.exponentialRampToValueAtTime(0.0001,t+0.12);
    n.connect(nf); nf.connect(ng); ng.connect(bus); n.start(t); n.stop(t+0.15);
  }
}
function noise(sec){
  const b=AC.createBuffer(1, Math.max(1,Math.floor(AC.sampleRate*sec)), AC.sampleRate);
  const d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  const s=AC.createBufferSource(); s.buffer=b; return s;
}
/* breath — ney */
function ney(freq, t, dur=1.1, gain=0.14){
  const o=AC.createOscillator(), g=AC.createGain(), f=AC.createBiquadFilter();
  o.type='sine'; o.frequency.setValueAtTime(freq*0.99,t); o.frequency.linearRampToValueAtTime(freq, t+0.12);
  f.type='bandpass'; f.frequency.value=freq*2.2; f.Q.value=3;
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(gain,t+0.16);
  g.gain.setValueAtTime(gain,t+dur*0.6); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t+dur+0.05);
  const n=noise(dur), nf=AC.createBiquadFilter(), ng=AC.createGain();
  nf.type='bandpass'; nf.frequency.value=freq*3.1; nf.Q.value=6;
  ng.gain.setValueAtTime(0.0001,t); ng.gain.exponentialRampToValueAtTime(gain*0.4,t+0.14);
  ng.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  n.connect(nf); nf.connect(ng); ng.connect(bus); n.start(t); n.stop(t+dur);
}
function swell(t, from, to, dur, gain=0.2){
  const o=AC.createOscillator(), g=AC.createGain();
  o.type='sawtooth'; o.frequency.setValueAtTime(from,t); o.frequency.exponentialRampToValueAtTime(to,t+dur);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(gain,t+dur*0.7);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur+0.25);
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(700,t); f.frequency.exponentialRampToValueAtTime(4200,t+dur);
  o.connect(f); f.connect(g); g.connect(bus); o.start(t); o.stop(t+dur+0.3);
}

const SFX = {
  click:  ()=>{ pluck(deg(SHUR,4,330), now(), 0.28, 0.14); },
  skill:  ()=>{ const t=now(); pluck(deg(SHUR,2,330),t,0.5,0.15); pluck(deg(SHUR,5,330),t+0.05,0.6,0.11); },
  atk:    ()=>{ const t=now(); drum(t,110,0.42,0.24); pluck(deg(SHUR,0,165),t+0.01,0.34,0.17,'sawtooth'); },
  power:  ()=>{ const t=now(); [0,2,4,7].forEach((d,i)=>pluck(deg(SHUR,d,220),t+i*0.055,1.0,0.14)); },
  nope:   ()=>{ const t=now(); pluck(220*c2r(-100),t,0.2,0.12,'square'); },
  turn:   ()=>{ const t=now(); drum(t,90,0.32,0.3,0.35); drum(t+0.13,120,0.18,0.2,0.2); },
  get:    ()=>{ const t=now(); [0,3,5].forEach((d,i)=>pluck(deg(SHUR,d,440),t+i*0.06,0.7,0.14)); },
  buy:    ()=>{ const t=now(); pluck(deg(SHUR,5,440),t,0.4,0.13); pluck(deg(SHUR,7,440),t+0.07,0.6,0.12); },
  forge:  ()=>{ const t=now(); drum(t,180,0.34,0.16,0.9); drum(t+0.12,220,0.26,0.14,0.9); pluck(deg(SHUR,7,440),t+0.2,0.8,0.13); },
  rest:   ()=>{ const t=now(); ney(deg(SHUR,0,220),t,1.4,0.11); ney(deg(SHUR,4,220),t+0.35,1.3,0.08); },
  event:  ()=>{ const t=now(); pluck(deg(SHUR,1,330),t,0.7,0.13); pluck(deg(SHUR,4,330),t+0.1,0.8,0.10); },
  boss:   ()=>{ const t=now(); drum(t,62,0.55,0.7,0.25); drum(t+0.34,62,0.45,0.7,0.2);
                ney(deg(CHAHARGAH,0,110),t+0.1,1.8,0.13); swell(t+0.2, 70, 300, 1.4, 0.1); },
  invoke: ()=>{ const t=now();
                [0,2,4,5,7,9,11,12].forEach((d,i)=>pluck(deg(CHAHARGAH,d,330),t+i*0.045,1.5,0.15));
                ney(deg(CHAHARGAH,7,660),t+0.2,1.9,0.13); swell(t,180,1400,0.9,0.13); drum(t,70,0.5,0.6,0.2); },
  secret: ()=>{ const t=now(); ney(deg(SHUR,0,110),t,2.4,0.13); swell(t+0.3,60,240,2.0,0.1);
                [0,1,3,4].forEach((d,i)=>pluck(deg(SHUR,d,165),t+0.5+i*0.28,1.6,0.11)); },
  win:    ()=>{ const t=now(); [0,2,4,7,9,7,4,7,12].forEach((d,i)=>pluck(deg(SHUR,d,330),t+i*0.135,1.3,0.16));
                drum(t,80,0.4,0.5,0.2); drum(t+0.54,80,0.32,0.4,0.2); drum(t+1.08,80,0.32,0.4,0.2);
                ney(deg(SHUR,7,330),t+1.2,2.2,0.11); },
  lose:   ()=>{ const t=now(); [7,4,2,0].forEach((d,i)=>pluck(deg(SHUR,d,165),t+i*0.3,1.8,0.15));
                ney(deg(SHUR,0,110),t+0.4,2.6,0.10); },
  hurt:   ()=>{ const t=now(); drum(t,70,0.36,0.22,0.7); },
};

/* very cheap ambient bed: two detuned sines + slow filter LFO */
function startAmbient(){
  if(ambient || !AC || ART.reduced) return;
  const g = AC.createGain(); g.gain.value = 0; g.connect(master);
  const f = AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=520; f.Q.value=1.4; f.connect(g);
  const a = AC.createOscillator(), b = AC.createOscillator();
  a.type='sine'; b.type='sine';
  a.frequency.value = 110; b.frequency.value = 110*c2r(702);
  a.connect(f); b.connect(f); a.start(); b.start();
  const lfo = AC.createOscillator(), lg = AC.createGain();
  lfo.frequency.value = 0.055; lg.gain.value = 190; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
  g.gain.linearRampToValueAtTime(0.075, AC.currentTime+3.5);
  ambient = {g,a,b,lfo,f};
}
function stopAmbient(){ if(!ambient) return; const {g}=ambient; g.gain.linearRampToValueAtTime(0.0001, AC.currentTime+1.2);
  setTimeout(()=>{ try{ambient.a.stop();ambient.b.stop();ambient.lfo.stop();}catch(e){} ambient=null; }, 1400); }

function play(name){
  if(!on()) return;
  const ac = ensure(); if(!ac) return;
  if(ac.state==='suspended') ac.resume();
  const f = SFX[name]; if(f){ try{ f(); }catch(e){} }
}
function kick(){
  if(started) return; started = true;
  const ac = ensure(); if(!ac) return;
  if(ac.state==='suspended') ac.resume();
  if(on()) startAmbient();
}
return { play, kick, startAmbient, stopAmbient, get ctx(){ return AC; } };
})();

function sfx(n){ AUDIO.play(n); }
window.addEventListener('pointerdown', ()=>AUDIO.kick(), {once:true});
window.addEventListener('keydown',     ()=>AUDIO.kick(), {once:true});
