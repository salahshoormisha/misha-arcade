/* MISHANAMEH — the naqqāl, done properly.
   ────────────────────────────────────────────────────────────────────────
   A naqqāl performs the Shāhnāmeh standing up, in a coffee house, with a
   painted cloth behind them — the *pardeh* — and a stick, and no book. The
   first version of this game outsourced that to a browser speech synthesiser,
   which is slow and sounds like a lift announcement, and turned it off left
   you with nothing at all.

   So the performance is now visual and the voice is optional:

     · a pardeh unrolls at the foot of the screen
     · the line writes itself out, at reading speed, one glyph at a time
     · a santur note falls on each phrase
     · tap to finish the line, tap again to send it away

   The synthesiser can still speak over the top for anyone who wants it, but
   it is off by default and it no longer drawls.                            */

const NAQQAL = (function(){

let q = [], live = null, timer = null;

function host(){
  let h = document.getElementById('pardeh');
  if(!h){
    h = document.createElement('div');
    h.id = 'pardeh';
    h.innerHTML =
      '<div class="pd-rod"></div>' +
      '<div class="pd-cloth">' +
        '<div class="pd-mark">◈</div>' +
        '<div class="pd-line"></div>' +
        '<div class="pd-fa"></div>' +
        '<div class="pd-more">tap to go on</div>' +
      '</div>';
    document.body.appendChild(h);
    h.addEventListener('click', ()=>{ live && live.done ? dismiss() : finishLine(); });
  }
  return h;
}

/* ── the performance ──────────────────────────────────────────────────── */
function tell(text, opt){
  if(!text) return;
  q.push(Object.assign({ text:String(text), fa:'', hold:2400 }, opt||{}));
  if(!live) next();
}

function next(){
  const m = q.shift();
  if(!m){ dismiss(); return; }
  live = m; live.done = false;
  const h = host();
  const lineEl = h.querySelector('.pd-line');
  const faEl   = h.querySelector('.pd-fa');
  const more   = h.querySelector('.pd-more');
  lineEl.textContent = '';
  faEl.textContent = m.fa || '';
  faEl.style.opacity = 0;
  more.style.opacity = 0;
  h.classList.add('in');
  if(m.tone !== false) sting();

  // let the speech synthesiser ride along if it has been asked for
  if(typeof VOICE!=='undefined' && VOICE.on) VOICE.say(m.text);

  const chars = [...m.text];
  let i = 0;
  clearInterval(timer);
  const SPEED = 17;                                     // ms per glyph — reading pace
  timer = setInterval(()=>{
    if(i >= chars.length){ finishLine(); return; }
    // write in small bursts so it reads as writing, not as a ticker
    const burst = 1 + (Math.random()<0.35 ? 1 : 0);
    for(let k=0;k<burst && i<chars.length;k++){
      lineEl.textContent += chars[i];
      if(/[.,;:—?!]/.test(chars[i]) && Math.random()<0.6) sting(0.35);
      i++;
    }
  }, SPEED);
}

function finishLine(){
  if(!live) return;
  clearInterval(timer);
  const h = host();
  h.querySelector('.pd-line').textContent = live.text;
  h.querySelector('.pd-fa').style.opacity = 1;
  h.querySelector('.pd-more').style.opacity = 1;
  live.done = true;
  clearTimeout(live._t);
  live._t = setTimeout(()=>{ if(live && live.done) (q.length ? next() : dismiss()); }, live.hold);
}

function dismiss(){
  clearInterval(timer);
  if(live){ clearTimeout(live._t); }
  live = null;
  const h = document.getElementById('pardeh');
  if(h) h.classList.remove('in');
  if(q.length) setTimeout(next, 380);
}

function shush(){ q = []; dismiss(); if(typeof VOICE!=='undefined') VOICE.shush(); }

/* ── a santur note, so the writing has a sound ────────────────────────── */
function sting(vol){
  try{
    if(typeof SAVE!=='undefined' && SAVE.mute) return;
    if(typeof MUSIC==='undefined' || !MUSIC.pluck) return fallbackPluck(vol);
    MUSIC.pluck(vol==null?0.7:vol);
  }catch(e){}
}
let actx = null;
function fallbackPluck(vol){
  try{
    if(typeof SAVE!=='undefined' && SAVE.mute) return;
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    if(actx.state==='suspended') return;
    const t = actx.currentTime;
    // santur strings are struck in pairs, slightly detuned — that is the shimmer
    const base = 523.25 * Math.pow(2, ((Math.random()*4|0)*2)/12);
    [0, 1.004].forEach((det,i)=>{
      const o = actx.createOscillator(), g = actx.createGain();
      o.type='triangle'; o.frequency.value = base*det;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime((vol==null?0.05:0.05*vol)*(i?0.7:1), t+0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t+0.9);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t+0.95);
    });
  }catch(e){}
}

return { tell, shush, dismiss, get busy(){ return !!live || q.length>0; } };
})();

/* ═══════════════  WHERE THE NAQQĀL SPEAKS  ═══════════════
   Every narration point in the game, re-pointed at the pardeh and re-written.
   The old lines were long, unbroken and — Misha's word — incomprehensible.
   The rule now: one idea per line, under thirty words, and a Persian tag
   underneath rather than Persian words buried in the English. */

/* the opening */
const _showIntro_nq = showIntro;
showIntro = function(){
  _showIntro_nq();
  NAQQAL.tell('Around the year 1000, a poet spent thirty years and every coin he had writing the old stories down in Persian.',
              { fa:'شاهنامه', hold:3000 });
  NAQQAL.tell('It is the reason there is still a Persian language. This is a small piece of it.', { hold:2800 });
};

/* the start of a trial */
const _screenMap_nq = screenMap;
screenMap = function(){
  _screenMap_nq();
  if(R && R.step===0 && !R._toldTrial){
    R._toldTrial = R.trial;
    const t = trialDef(R.trial);
    NAQQAL.tell(`Trial ${t.roman} — ${t.name}.`, { fa:t.fa||'', hold:1700 });
    if(t.sub) NAQQAL.tell(t.sub.replace(/^in which /,'In which ') + '.', { hold:2600 });
  } else if(R && R.step!==0){ R._toldTrial = null; }
};

/* a boss */
const _bossIntro_nq = bossIntro;
bossIntro = function(t){
  _bossIntro_nq(t);
  const f = FOES[t.boss];
  if(f) NAQQAL.tell(f.name + '.', { fa:f.fa||'', hold:1600, tone:true });
};

/* the two endings */
const _victory_nq = victory;
victory = function(){
  _victory_nq();
  NAQQAL.tell('“I have suffered much these thirty years — I revived the Persians with this Persian.”', { fa:'فردوسی', hold:4200 });
};
const _deathScreen_nq = deathScreen;
deathScreen = function(){
  _deathScreen_nq();
  NAQQAL.tell('The road ends here. It does not end for good — that is the point of a road.', { hold:2600 });
};

/* the bridge */
if(typeof screenBridge !== 'undefined'){
  const _screenBridge_nq = screenBridge;
  screenBridge = function(){
    _screenBridge_nq();
    NAQQAL.tell('Every soul crosses on the fourth day after death.', { fa:'چینوت پل', hold:2200 });
    NAQQAL.tell('Halfway over you meet your own conscience, walking the other way, in the shape of a woman.', { hold:3000 });
    NAQQAL.tell('Whether she is beautiful is not up to her.', { hold:2600 });
  };
}

/* first sight of a creature that carries the argument */
if(typeof RESIST_LINES !== 'undefined'){ /* resist.js speaks these itself */ }

/* nothing should talk over the pardeh */
const _menuModal_nq = menuModal;
menuModal = function(){ NAQQAL.shush(); _menuModal_nq(); };
