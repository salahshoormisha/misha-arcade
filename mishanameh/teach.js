/* MISHANAMEH — the teaching layer.
   ────────────────────────────────────────────────────────────────────────
   The first version of this game explained itself with a wall of text and a
   Codex, which is the same as not explaining itself. Two people sat down,
   read the wall, and still had no idea what was happening. So:

     1. TUTOR   — a scripted first fight that will not let you press the wrong
                  thing. Fixed deck, fixed enemy, one idea per step.
     2. COACH   — a live line above your hand that says, in English, what is
                  about to happen to you and what you might do about it.
     3. INTENTS — enemies say what they are going to do in words, not icons.
     4. HELP    — a "?" on every screen that explains that screen.

   Nothing here changes a rule. It is all reading the state out loud.        */

const TEACH = (function(){

/* ═══════════════  1. THE COACH  ═══════════════
   Recomputed on every paint. Three registers, in order of urgency:
   about to die → will be hurt → safe, here is the useful thing to notice. */

function coachLine(){
  if(!G || G.over) return null;
  const inc  = incomingTotal();
  const blk  = G.p.block;
  const net  = Math.max(0, inc - blk);
  const hp   = G.p.hp;
  const nrg  = G.p.energy;
  const mf   = maxFarr();

  // can anything in hand still be played?
  const playable = G.hand.filter(c=>canPlay(c));
  const anyBlock = playable.some(c=>{ const d=CARDS[c.id]; return d && /Block/.test(d.text||''); });
  const anyAtk   = playable.some(c=>{ const d=CARDS[c.id]; return d && d.type==='attack'; });

  if(G.p.farr>=mf) return {
    t:'good', s:`✦ INVOKE is lit — ${HEROES[R.hero].invoke.name}.`,
    d:`Press the gold bar. It empties the meter and you can fill it again.` };

  if(net >= hp) return {
    t:'dire', s:`⚠ This will kill you. ${inc} incoming, ${blk} Block, ${hp} HP.`,
    d: anyBlock ? `Play something that gives Block, or kill whatever is swinging.`
                : `Nothing in hand blocks — you have to kill something, or Invoke.` };

  if(net > hp*0.4) return {
    t:'warn', s:`Heavy turn: ${net} of the ${inc} incoming gets through. You have ${hp}.`,
    d: anyBlock ? `Block is worth more than damage this turn.` : `Kill the biggest threat first.` };

  if(inc > 0 && net === 0) return {
    t:'good', s:`All ${inc} incoming is blocked.`,
    d:`Block vanishes at the start of your next turn, so anything left over is wasted — spend the rest on damage.` };

  if(nrg === 0) return {
    t:'flat', s:`Out of Energy. Press END TURN.`,
    d:`Your hand is discarded and you draw five fresh cards. Nothing is saved by holding it.` };

  if(inc > 0) return {
    t:'flat', s:`${inc} incoming next turn. Your Block stops ${Math.min(inc,blk)} of it.`,
    d: nrg>0 ? `${nrg} Energy left.` : `` };

  return { t:'flat', s:`Nothing is coming at you this turn.`, d:`Free hit — spend everything.` };
}

function paintCoach(){
  if(!G) return;
  let host = document.querySelector('#coachbar');
  if(!host){
    const mid = document.querySelector('#mid');
    if(!mid) return;
    host = el('div',{id:'coachbar', class:'coachbar'});
    mid.parentNode.insertBefore(host, mid.nextSibling);
  }
  const c = coachLine();
  if(!c){ host.style.display='none'; return; }
  host.style.display='';
  host.className = 'coachbar t-'+c.t;
  host.innerHTML = `<span class="cs">${markup(c.s)}</span>` + (c.d?`<span class="cd">${markup(c.d)}</span>`:'');
}

/* ═══════════════  2. INTENTS, IN WORDS  ═══════════════
   "🗡️9" assumes you already know the game. "Bites you for 9" does not. */

function intentWords(f){
  const it = intentOf(f);
  const nm = f.name;
  if(it.k==='attack'){
    const total = it.dmg * (it.hits||1);
    return (it.hits>1)
      ? { txt:`Strikes you ${it.hits}× for ${it.dmg} — ${total} in all`, big:total, k:'atk' }
      : { txt:`Strikes you for ${it.dmg}`, big:it.dmg, k:'atk' };
  }
  if(it.k==='block')  return { txt:`Braces — gains ${it.blk} Block`, big:it.blk, k:'def' };
  // a bare "2 Frail" is a stat line, not a sentence. Say who it lands on.
  if(it.k==='buff')   return { txt: it.txt ? `Strengthens itself: ${it.txt}` : `Makes itself stronger`, k:'buf' };
  if(it.k==='debuff') return { txt: it.txt ? `Puts ${it.txt} on you` : `Weakens you`, k:'deb' };
  if(it.txt)          return { txt: it.n ? `${it.n} — ${it.txt}` : it.txt, k:'spc' };
  return { txt: it.n || `Something else`, k:'spc' };
}

/* ═══════════════  3. THE TUTOR  ═══════════════
   A real scripted fight. Every step names one element, points at it, and
   refuses every other click until you do the thing. No reading required. */

let T = null;               // live tutorial state

const STEPS = [
  { sel:'.rb-hp', at:'below',
    h:'THIS IS YOU',
    p:'Rostam, and his health. When it reaches zero the run is over and you start again — that is the genre, not a failure. You keep everything you have learned.',
    next:'ok' },

  { sel:'.foe', at:'below',
    h:'THESE ARE JACKALS',
    p:'Two of them, each with its own health bar. Kill them before they kill you. That is the whole of it.',
    next:'ok' },

  { sel:'.foe .intentline', at:'below',
    h:'IT TELLS YOU WHAT IT WILL DO',
    p:'This line is not a guess. It is exactly what this jackal does at the end of the turn, already adjusted for everything in play. You are never ambushed in this game — you always know what is coming. The whole game is what you do about it.',
    next:'ok' },

  { sel:'.energy', at:'above',
    h:'ENERGY',
    p:'You get three of these every turn and they come back in full — unspent Energy is not saved. The red circle in the corner of a card is what that card costs.',
    next:'ok' },

  { sel:'.hand', at:'above',
    h:'YOUR HAND',
    p:'Five cards, drawn from your deck. Whatever you do not play is thrown away at the end of the turn — so there is no reason to save anything.',
    next:'ok' },

  { sel:'.hand .card[data-tut="r_strike"]', at:'above',
    h:'PLAY THIS ONE',
    p:'SHAMSHIR — the sword. It costs 1 Energy and deals 7 damage. Tap it.',
    need:'click-card', card:'r_strike', arrow:true },

  { sel:'.foe', at:'below',
    h:'NOW PICK WHO GETS IT',
    p:'When there is more than one enemy, an attack asks you who it is for. Tap either jackal.',
    need:'click-foe', arrow:true },

  { sel:'.farrbox', at:'above',
    h:'THE GOLD METER — FARR',
    p:'فرّ, divine glory: the light that settles on a rightful king and leaves a tyrant. It fills as you fight. Fill it completely and you can INVOKE — your hero\'s one enormous thing. It empties, and it fills again.',
    next:'ok' },

  { sel:'.hand .card[data-tut="r_guard"]', at:'above',
    h:'NOW BLOCK',
    p:'SIPAR — the shield. 1 Energy for 5 Block. Block soaks damage and then vanishes at the start of your next turn, so it is meant to be spent, never hoarded.',
    need:'click-card', card:'r_guard', arrow:true },

  { sel:'#coachbar', at:'below',
    h:'THIS LINE IS ON YOUR SIDE',
    p:'It adds the whole board up for you: what is coming, what your Block stops, and what gets through. If it turns red, you are about to die.',
    next:'ok' },

  { sel:'#endTurn', at:'left',
    h:'END THE TURN',
    p:'Now both jackals swing — into your Block. Press it and watch what the shield eats.',
    need:'endturn', arrow:true },

  { sel:'.rb-hp', at:'below',
    h:'THAT IS THE GAME',
    p:'Read what is coming, spend three Energy to change it, end the turn. Everything else — the talismans, the omens, the Simurgh, the second road — is decoration on those three sentences.',
    next:'done' },
];

function begin(replay){
  SAVE.taught = true; persist();
  // a fixed, honest little fight: known deck, known enemy, no randomness
  newRun('rostam', 1);
  R.deck = ['r_strike','r_strike','r_guard','r_guard','r_strike'].map(id=>inst(id));
  UI.screen = 'combat';
  startCombat('normal', ['jackal','jackal']);   // two, so choosing a target is a real step
  // hand the player exactly the cards the script talks about
  G.hand = [inst('r_strike'), inst('r_guard'), inst('r_strike'), inst('r_guard'), inst('r_strike')];
  G.draw = [inst('r_strike'), inst('r_guard')];
  G.p.energy = 3; G.p.baseEnergy = 3;
  G.foes.forEach(f=>{ f.hp = f.maxHp = 22; });
  T = { i:0, replay:!!replay };
  renderCombat();
  document.body.classList.add('tutoring');
  setTimeout(()=>step(0), 420);
}

function step(i){
  T.i = i;
  if(i >= STEPS.length) return finish();
  const s = STEPS[i];
  paintCoach();
  showSpot(s);
}

function advanceTut(kind, payload){
  if(!T) return false;
  const s = STEPS[T.i];
  if(!s || !s.need) return false;
  // a card that auto-resolves its own target satisfies the targeting step too
  if(kind==='click-card' && s.need==='click-foe'){ clearSpot(); setTimeout(()=>step(T.i+1), 500); return true; }
  if(s.need !== kind) return true;                       // eat the click, wrong thing
  if(kind==='click-card' && payload && payload.id !== s.card) return true;
  clearSpot();
  setTimeout(()=>step(T.i+1), kind==='endturn' ? 1500 : 620);
  return false;                                          // let it through
}

function finish(){
  clearSpot();
  T = null;
  document.body.classList.remove('tutoring');
  const box = el('div',{class:'lore-modal coach'},[
    el('h2',{text:'YOU CAN PLAY NOW'}),
    el('p',{class:'center', html:'Everything else explains itself when you meet it — the first time a creature, a card or a talisman appears, its note comes to you in the margin. The <b>?</b> in the top corner explains whatever screen you are looking at.'}),
    el('p',{class:'center dim', html:'You are meant to lose the first few runs. Each one you start knowing more, and the game unlocks as you go.'}),
    el('button',{class:'btn gold', onclick:()=>{ closeModal(); screenTitle(); }},'TO THE ROAD'),
  ]);
  modal(box,{sticky:true});
}

/* ── the spotlight ──────────────────────────────────────────────────────
   A dark overlay with a hole cut in it, using four panels rather than a
   clip-path, so the hole is genuinely click-through and everything else is
   genuinely not. */
let spot = null;
function showSpot(s){
  clearSpot();
  const t = document.querySelector(s.sel);
  if(!t){                                     // element missing — never trap the player
    if(s.need) return step(T.i+1);
    return step(T.i+1);
  }
  const r = t.getBoundingClientRect();
  const pad = 10;
  const box = { x:r.left-pad, y:r.top-pad, w:r.width+pad*2, h:r.height+pad*2 };

  spot = el('div',{class:'tutspot'});
  const mk = (x,y,w,h)=>{ const d=el('div',{class:'tutmask'}); Object.assign(d.style,{left:x+'px',top:y+'px',width:Math.max(0,w)+'px',height:Math.max(0,h)+'px'}); return d; };
  const W = innerWidth, H = innerHeight;
  spot.appendChild(mk(0,0,W,box.y));
  spot.appendChild(mk(0,box.y+box.h,W,H-(box.y+box.h)));
  spot.appendChild(mk(0,box.y,box.x,box.h));
  spot.appendChild(mk(box.x+box.w,box.y,W-(box.x+box.w),box.h));

  const ring = el('div',{class:'tutring'});
  Object.assign(ring.style,{left:box.x+'px',top:box.y+'px',width:box.w+'px',height:box.h+'px'});
  spot.appendChild(ring);

  const card = el('div',{class:'tutcard'});
  card.appendChild(el('div',{class:'tutstep', text:`${T.i+1} / ${STEPS.length}`}));
  card.appendChild(el('h3',{text:s.h}));
  card.appendChild(el('p',{html:markup(s.p)}));
  if(s.next) card.appendChild(el('button',{class:'btn gold sm', onclick:()=>{ clearSpot(); step(T.i+1); }}, s.next==='done'?'FINISH':'GOT IT'));
  else card.appendChild(el('div',{class:'tuthint', text:'↑ do the thing'}));
  card.appendChild(el('button',{class:'tutskip', text:'skip the lesson', onclick:()=>{ if(confirm('Skip the tutorial? You can start it again from the title screen.')) finish(); }}));
  spot.appendChild(card);
  document.body.appendChild(spot);

  // place the caption where it does not cover the thing it points at
  requestAnimationFrame(()=>{
    const cr = card.getBoundingClientRect();
    let cx = Math.min(Math.max(12, box.x + box.w/2 - cr.width/2), W - cr.width - 12);
    let cy;
    if(s.at==='above')      cy = box.y - cr.height - 18;
    else if(s.at==='left')  { cx = Math.max(12, box.x - cr.width - 18); cy = box.y; }
    else                    cy = box.y + box.h + 18;
    if(cy < 8) cy = box.y + box.h + 18;
    if(cy + cr.height > H - 8) cy = Math.max(8, box.y - cr.height - 18);
    card.style.left = cx+'px'; card.style.top = cy+'px';
    card.classList.add('in');
    if(s.arrow){
      const a = el('div',{class:'tutarrow'});
      a.style.left = (box.x + box.w/2 - 11)+'px';
      a.style.top  = (s.at==='above' ? box.y - 34 : box.y + box.h + 6)+'px';
      a.textContent = s.at==='above' ? '▼' : '▲';
      if(s.at==='left'){ a.style.left=(box.x-30)+'px'; a.style.top=(box.y+box.h/2-12)+'px'; a.textContent='▶'; }
      spot.appendChild(a);
    }
  });
}
function clearSpot(){ if(spot){ spot.remove(); spot=null; } }
addEventListener('resize', ()=>{ if(T && spot) showSpot(STEPS[T.i]); });

/* ═══════════════  4. PER-SCREEN HELP  ═══════════════ */
const HELP = {
  combat: ['THE FIGHT',
    `<b>Energy</b> (the number in the middle) is what cards cost; it refills every turn.
     <b>Block</b> soaks damage and then vanishes at the start of your next turn — spend it, don't save it.
     Every enemy prints exactly what it will do next, in words, under its name.
     The line above your hand adds it all up for you.
     Fill the gold <b>Farr</b> meter and <b>INVOKE</b> lights up.
     Whatever you don't play is discarded, so play it.`],
  map: ['THE ROAD',
    `Each trial is three rows of two choices, then a boss. You pick one of each pair, so you can never see the whole trial in one run.
     ⚔ a fight · ☠ a hard fight with a guaranteed talisman · ✦ an omen (a choice, usually a good one) · ⛺ a camp (heal or upgrade a card) · ⚖ a bazaar.
     There is no way back, so pick the row you want, not the row that looks safe.`],
  reward: ['AFTER A FIGHT',
    `Pick <b>one</b> of the three cards, or take none — a small deck is a strong deck, because every card you add is a card you might draw instead of the one you wanted.
     Talismans are permanent and always worth taking.`],
  camp: ['THE CAMP',
    `Rest to heal, or forge to make one card permanently better for the rest of the run. Upgrading a card you draw often beats healing.`],
  bazaar: ['THE BAZAAR',
    `Gold buys cards, talismans, and the removal of a card you regret. Removing your worst starting cards is usually the best money you will spend.`],
  omen: ['AN OMEN',
    `A choice. Most are good; a few have a price. The Codex remembers every one you have met.`],
  select: ['THE CHAMPIONS',
    `Each hero is a different way of winning. Rostam hits and takes it. Gordāfarid is fast and precise. Zāl plays the long game. Kāveh and Esther ride the second road.
     Their <b>INVOKE</b> is the thing they do that nobody else can.`],
  title: ['MISHANAMEH',
    `A deck-builder: you start with ten plain cards, and every fight lets you add one. By the end of a run your deck is a machine, or it is a mess.
     Two roads. Five heroes. You can play alone, side by side on one screen, or on two devices with a four-letter code.`],
};
function helpFor(screen){
  const h = HELP[screen] || HELP.combat;
  const box = el('div',{class:'lore-modal help'},[
    el('h2',{text:h[0]}),
    el('p',{html:h[1]}),
    el('p',{class:'dim center small', html:'Every underlined word anywhere in the game can be tapped for what it means.'}),
    el('button',{class:'btn gold', onclick:closeModal},'BACK'),
  ]);
  modal(box);
}

function skipIfTargeting(){
  if(T && STEPS[T.i] && STEPS[T.i].need==='click-foe'){ clearSpot(); step(T.i+1); }
}

return { paintCoach, intentWords, begin, advanceTut, helpFor, coachLine, skipIfTargeting,
         get live(){ return !!T; } };
})();

/* ═══════════════  5. WIRING IT INTO THE GAME  ═══════════════
   teach.js loads last, so everything below is the final word. */

/* the coaching level: 2 full · 1 hints only · 0 off */
function coachLevel(){ return SAVE.coach == null ? 2 : SAVE.coach; }

/* ── foes explain themselves in words ───────────────────────────────── */
const _paintFoes_teach = paintFoes;
paintFoes = function(){
  _paintFoes_teach();
  if(coachLevel() < 1) return;
  const host = $('#foes'); if(!host) return;
  let vi = 0;
  G.foes.forEach((f)=>{
    if(f.hp<=0){ vi++; return; }
    const node = host.children[vi++]; if(!node) return;
    const w = TEACH.intentWords(f);
    const line = el('div',{class:'intentline k-'+w.k, text:w.txt});
    const bar = node.querySelector('.fhp');
    if(bar) node.insertBefore(line, bar.nextSibling); else node.appendChild(line);
  });
};

/* ── the coach bar under the middle ─────────────────────────────────── */
const _paint_teach = paint;
paint = function(){
  _paint_teach();
  if(UI.screen!=='combat' || !G) return;
  if(coachLevel() >= 2) TEACH.paintCoach();
  else { const c = document.querySelector('#coachbar'); if(c) c.remove(); }
};

/* ── the tutorial gate: swallow every click that is not the scripted one ── */
const _onCardClick_teach = onCardClick;
onCardClick = function(c){
  if(TEACH.live && TEACH.advanceTut('click-card', c)) return;
  _onCardClick_teach(c);
  // if the engine resolved the target itself (one enemy left), the targeting
  // step has nothing left to teach — skip past it rather than stranding anyone
  if(TEACH.live && !UI.targeting) setTimeout(()=>TEACH.skipIfTargeting(), 260);
};
const _resolveTarget_teach = resolveTarget;
resolveTarget = function(f){
  if(TEACH.live && TEACH.advanceTut('click-foe', f)) return;
  _resolveTarget_teach(f);
};
const _doEndTurn_teach = doEndTurn;
doEndTurn = function(){
  if(TEACH.live && TEACH.advanceTut('endturn')) return;
  _doEndTurn_teach();
};

/* ── a ? on every screen ─────────────────────────────────────────────── */
function helpButton(){
  return el('button',{class:'helpbtn', title:'What am I looking at?',
    onclick:()=>TEACH.helpFor(UI.screen), html:'?'});
}
const _runBar_teach = runBar;
runBar = function(){
  const b = _runBar_teach();
  b.appendChild(helpButton());
  return b;
};

/* ── the title screen learns to teach ───────────────────────────────── */
const _screenTitle_teach = screenTitle;
screenTitle = function(){
  _screenTitle_teach();
  const btns = $('.tbtns'); if(!btns) return;
  const learn = el('button',{class:'btn '+(SAVE.taught?'':'gold big pulse'),
    onclick:()=>TEACH.begin(true)}, (SAVE.taught?'🎓  LEARN TO PLAY AGAIN':'🎓  LEARN TO PLAY — 2 MINUTES'));
  btns.insertBefore(learn, btns.firstChild);
  if(!SAVE.taught){
    const t = $('.tagline');
    if(t) t.innerHTML = 'THE BOOK OF MISHA — a deck-builder through Persian myth.<br><b style="color:var(--gold-l)">Never played one? Start with the two-minute lesson.</b>';
  }
};

/* the tutorial addresses cards by name, so cards have to answer to one */
const _cardEl_teach = cardEl;
cardEl = function(c, opts){
  const n = _cardEl_teach(c, opts);
  n.setAttribute('data-tut', c.id);
  return n;
};

/* ═══════════════  6. THE DIAL  ═══════════════
   Two people who have played forty runs should not be lectured on Block. */
function coachSettings(){
  const wrap = el('div',{class:'coachset'});
  wrap.appendChild(el('div',{class:'setlab', text:'GUIDANCE'}));
  const row = el('div',{class:'setrow'});
  [[2,'FULL','every number explained, enemies speak in sentences'],
   [1,'HINTS','enemies still speak; the advisor line goes away'],
   [0,'OFF','icons only, the way a veteran wants it']].forEach(([v,n,d])=>{
    const b = el('button',{class:'btn sm '+(coachLevel()===v?'gold':''), onclick:()=>{
      SAVE.coach = v; persist();
      [...row.children].forEach(x=>x.classList.remove('gold'));
      b.classList.add('gold');
      if(UI.screen==='combat'){ renderCombat(); }
    }}, n);
    b.title = d;
    row.appendChild(b);
  });
  wrap.appendChild(row);
  wrap.appendChild(el('div',{class:'dim small', text:'Start on FULL. Turn it down when the numbers stop needing translating.'}));
  return wrap;
}
TEACH.coachSettings = coachSettings;
TEACH.coachLevel = coachLevel;

/* the pause menu gains the dial and a way back into the lesson */
const _menuModal_teach = menuModal;
menuModal = function(){
  _menuModal_teach();
  const box = document.querySelector('#modal .lore-modal');
  if(!box) return;
  const anchor = [...box.children].find(n=>/Codex/.test(n.textContent||''));
  box.insertBefore(coachSettings(), anchor || null);
  box.insertBefore(el('button',{class:'btn', onclick:()=>{ closeModal(); TEACH.begin(true); }},'🎓 Replay the lesson'), anchor || null);
};
