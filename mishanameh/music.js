/* MISHANAMEH — the score.

   There is no music file in this game. Every note is generated a fraction of a
   second before you hear it, by an ensemble of four synthesised instruments
   improvising inside a Persian dastgāh.

   Two things make this sound Persian rather than merely minor-key:

   1. TUNING. The intervals are specified in cents, not in semitones, because
      the second degree of Dastgāh-e Shur is a *koron* — roughly a quarter-tone
      flat — and there is no key on a piano for it. Play Shur on equal
      temperament and you get something that sounds like Spanish guitar. Play
      it at 150 cents and it sounds like home.

   2. RADIF. Persian classical music is not a chord progression; it is a
      sequence of gushe — small melodic figures — explored over a fixed drone,
      wandering up to a shāhed (the "witness" note the mode keeps returning to)
      and eventually descending to rest. So the generator here does not pick
      random notes in a scale. It picks a figure, transposes it into the mode,
      leans on the shāhed, and comes home.

   The ensemble: a santur (hammered dulcimer — struck, so plucked triangles
   with a fast decay and a detuned octave for the doubled courses), a ney
   (end-blown reed — a sine with a lot of breath noise, which is most of what
   a ney actually is), a tanbur drone, and a tombak (goblet drum: "tom" is the
   deep centre stroke, "bak" the sharp rim one).                              */

const MUSIC = (()=>{

let ctx=null, master=null, bus={}, running=false, timer=null;
let mode='shur', intensity=0, targetGain=0.0, curGain=0;
let nextNote=0, beat=0, bar=0, tonic=146.83;      // D3-ish
let enabled=true;

const c2r = c => Math.pow(2, c/1200);

/* ── the modes, in cents ── */
const DASTGAH = {
  // the great melancholy mode; that 150 is the koron second
  shur:      { steps:[0,150,300,500,700,800,1000,1200], shahed:3, rest:0,  bpm:92  },
  // heroic, martial, used here for the demon marches
  chahargah: { steps:[0,100,400,500,700,800,1100,1200], shahed:4, rest:0,  bpm:104 },
  // bright — the closest thing Persian music has to major
  mahur:     { steps:[0,200,400,500,700,900,1100,1200], shahed:4, rest:0,  bpm:100 },
  // the "place of three": a koron third, warm and a little bruised
  segah:     { steps:[0,150,350,500,650,850,1000,1200], shahed:2, rest:2,  bpm:88  },
  // veiled, inward, for night and for sorcery
  homayoun:  { steps:[0,90,400,500,700,790,1100,1200],  shahed:4, rest:0,  bpm:84  },
  // Ābu‑Atā, a derivative of Shur that sounds like a long road
  abuata:    { steps:[0,150,300,500,700,850,1000,1200], shahed:4, rest:3,  bpm:96  },
};

/* gushe: little melodic cells as scale-degree offsets from the shāhed */
const GUSHE = [
  [0,1,0,-1,0], [0,-1,-2,-1,0], [0,1,2,1,0], [2,1,0,-1,-2],
  [0,0,1,2,1,0], [-2,-1,0,1,0], [0,2,1,0,-1,0], [1,0,-1,0,1,2],
];

/* which mode belongs to which stretch of road */
const MOOD_MODE = {
  title:'shur', t1:'shur', t2:'abuata', t3:'chahargah', t4:'homayoun',
  t5:'segah', t6:'chahargah', t7:'homayoun', t8:'segah',
  victory:'mahur', death:'segah',
};

/* ═══════════  plumbing  ═══════════ */
function init(){
  if(ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return false;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0;
  // a little room, so it does not sound like it is happening inside a phone
  const conv = ctx.createConvolver();
  conv.buffer = impulse(2.4, 2.6);
  const wet = ctx.createGain(); wet.gain.value = 0.26;
  const dry = ctx.createGain(); dry.gain.value = 0.82;
  master.connect(dry).connect(ctx.destination);
  master.connect(conv).connect(wet).connect(ctx.destination);
  bus.main = master;
  return true;
}
function impulse(sec, decay){
  const n = Math.floor(ctx.sampleRate*sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
  for(let ch=0; ch<2; ch++){
    const d = b.getChannelData(ch);
    for(let i=0;i<n;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/n, decay);
  }
  return b;
}
function freq(deg, oct=0){
  const M = DASTGAH[mode], st = M.steps;
  let d = deg, o = oct;
  while(d < 0){ d += 7; o--; }
  while(d >= 7){ d -= 7; o++; }
  return tonic * c2r(st[d]) * Math.pow(2, o);
}

/* ═══════════  instruments  ═══════════ */

/* santur — struck strings, doubled courses slightly out of tune with each
   other, which is exactly where the shimmer comes from */
function santur(f, t, vel=1, dur=0.9){
  [0, 1.0].forEach((oct,i)=>{
    [-3.5, 3.5].forEach(cents=>{                       // the doubled course
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f * Math.pow(2,oct) * c2r(cents);
      const peak = vel * (i? 0.055 : 0.13);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t+0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t+dur*(i?0.6:1));
      const lp = ctx.createBiquadFilter(); lp.type='lowpass';
      lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(900, t+dur);
      o.connect(g).connect(lp).connect(master);
      o.start(t); o.stop(t+dur+0.05);
    });
  });
}

/* ney — a sine plus a great deal of breath */
function ney(f, t, dur=1.4, vel=0.6){
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type='sine'; o.frequency.setValueAtTime(f*0.996, t);
  o.frequency.linearRampToValueAtTime(f, t+0.09);          // the scoop into the note
  g.gain.setValueAtTime(0,t);
  g.gain.linearRampToValueAtTime(vel*0.085, t+0.16);
  g.gain.setValueAtTime(vel*0.085, t+dur*0.62);
  g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
  // vibrato, late and shallow, the way a player leans on a long note
  const lfo=ctx.createOscillator(), la=ctx.createGain();
  lfo.frequency.value=5.1; la.gain.value=f*0.006;
  lfo.connect(la).connect(o.frequency); lfo.start(t+dur*0.3); lfo.stop(t+dur);
  o.connect(g).connect(master); o.start(t); o.stop(t+dur+0.05);

  const nz = ctx.createBufferSource(); nz.buffer = noiseBuf();
  const bp = ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=f*2.1; bp.Q.value=1.6;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0,t);
  ng.gain.linearRampToValueAtTime(vel*0.030, t+0.10);
  ng.gain.exponentialRampToValueAtTime(0.0001, t+dur);
  nz.connect(bp).connect(ng).connect(master); nz.start(t); nz.stop(t+dur+0.05);
}

let _nb=null;
function noiseBuf(){
  if(_nb) return _nb;
  const n = ctx.sampleRate*2, b = ctx.createBuffer(1,n,ctx.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
  _nb=b; return b;
}

/* tanbur drone — tonic and fifth, bowed-ish, always there */
let droneNodes=[];
function drone(on){
  droneNodes.forEach(n=>{ try{ n.stop(); }catch(e){} });
  droneNodes=[];
  if(!on) return;
  [[freq(0,-1), 0.050], [freq(4,-1), 0.030], [freq(0,0), 0.022]].forEach(([f,v])=>{
    const o=ctx.createOscillator(), g=ctx.createGain(), lp=ctx.createBiquadFilter();
    o.type='sawtooth'; o.frequency.value=f;
    lp.type='lowpass'; lp.frequency.value=520;
    g.gain.value=0;
    g.gain.setTargetAtTime(v, ctx.currentTime, 1.6);
    const lfo=ctx.createOscillator(), la=ctx.createGain();
    lfo.frequency.value=0.12; la.gain.value=v*0.35;
    lfo.connect(la).connect(g.gain); lfo.start();
    o.connect(lp).connect(g).connect(master); o.start();
    droneNodes.push(o, lfo);
  });
}

/* tombak — tom (deep, centre) and bak (sharp, rim) */
function tom(t, vel=1){
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.type='sine';
  o.frequency.setValueAtTime(168,t); o.frequency.exponentialRampToValueAtTime(52,t+0.16);
  g.gain.setValueAtTime(vel*0.30,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.26);
  o.connect(g).connect(master); o.start(t); o.stop(t+0.3);
}
function bak(t, vel=1){
  const nz=ctx.createBufferSource(); nz.buffer=noiseBuf();
  const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=2100; bp.Q.value=1.1;
  const g=ctx.createGain();
  g.gain.setValueAtTime(vel*0.13,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.075);
  nz.connect(bp).connect(g).connect(master); nz.start(t); nz.stop(t+0.1);
}

/* ═══════════  the arrangement  ═══════════
   6/8 — the شش‌وهشت that every Persian dance is built on. */
const PATTERNS = {
  0: [['tom',1],[,],[ 'bak',.5],[,],['bak',.6],[,]],
  1: [['tom',1],[,],['bak',.7],['tom',.7],['bak',.8],['bak',.5]],
  2: [['tom',1],['bak',.5],['bak',.8],['tom',.9],['bak',.9],['bak',.7]],
};

let phrase=[], phraseIx=0, phraseOct=0;
function newPhrase(){
  const M = DASTGAH[mode];
  const g = GUSHE[Math.floor(Math.random()*GUSHE.length)];
  phrase = g.map(d => M.shahed + d);
  // one phrase in four descends all the way home, which is how a dastgāh ends
  if(Math.random()<0.28) phrase = phrase.concat([M.shahed-1, M.rest+1, M.rest]);
  phraseIx = 0;
  phraseOct = Math.random()<0.22 ? 1 : 0;
}

function tick(){
  if(!running) return;
  const M = DASTGAH[mode];
  const spb = 60 / (M.bpm * (intensity===2?1.12:intensity===1?1.04:1)) / 2;   // eighth notes
  const ahead = ctx.currentTime + 0.35;

  while(nextNote < ahead){
    const step = beat % 6;
    const pat = PATTERNS[intensity] || PATTERNS[0];
    const hit = pat[step];
    if(hit && hit[0] && intensity>0 || (hit && hit[0] && bar%2===0)){
      (hit[0]==='tom'?tom:bak)(nextNote, hit[1] * (0.65+0.35*(intensity/2)));
    }

    // santur carries the line
    const density = intensity===2 ? 1 : intensity===1 ? 2 : 3;
    if(step % density === 0){
      if(!phrase.length || phraseIx>=phrase.length) newPhrase();
      const deg = phrase[phraseIx++];
      santur(freq(deg, phraseOct), nextNote, 0.7+Math.random()*0.3, 0.75+Math.random()*0.5);
      // the mezrab tremolo: two fast strikes, very idiomatic
      if(Math.random()<0.22) santur(freq(deg, phraseOct), nextNote+spb*0.42, 0.45, 0.4);
    }

    // ney enters at the top of a phrase, sparingly
    if(step===0 && bar%4===0 && Math.random()<(intensity===0?0.55:0.34)){
      ney(freq(M.shahed + (Math.random()<0.4?2:0), 0), nextNote, spb*7, intensity===2?0.8:0.6);
    }

    nextNote += spb;
    beat++;
    if(beat%6===0) bar++;
  }
  // glide the volume rather than jumping it
  curGain += (targetGain - curGain) * 0.06;
  if(master) master.gain.setTargetAtTime(curGain, ctx.currentTime, 0.15);
}

/* ═══════════  public  ═══════════ */
function start(){
  if(!enabled) return;
  if(!init()) return;
  if(ctx.state==='suspended') ctx.resume();
  if(running) return;
  running = true;
  nextNote = ctx.currentTime + 0.1; beat=0; bar=0;
  newPhrase(); drone(true);
  timer = setInterval(tick, 60);
  setLevel(intensity);
}
function stop(){
  running=false; clearInterval(timer); timer=null;
  drone(false);
  targetGain=0; curGain=0;
  if(master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
}
function setLevel(n){
  intensity = Math.max(0, Math.min(2, n|0));
  targetGain = !enabled ? 0 : [0.34, 0.42, 0.52][intensity];
}
function setMood(key){
  const m = MOOD_MODE[key] || 'shur';
  if(m===mode) return;
  mode = m; phrase=[]; phraseIx=0;
  if(running){ drone(true); }
}
function setEnabled(on){
  enabled = !!on;
  if(!enabled){ stop(); } else { start(); }
}
function duck(ms){                       // get out of the way of a big moment
  if(!master || !ctx) return;
  const t=ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setTargetAtTime(curGain*0.25, t, 0.05);
  setTimeout(()=>{ if(master) master.gain.setTargetAtTime(curGain, ctx.currentTime, 0.6); }, ms||900);
}

return { start, stop, setLevel, setMood, setEnabled, duck,
         get on(){ return enabled; }, get running(){ return running; }, DASTGAH };
})();
