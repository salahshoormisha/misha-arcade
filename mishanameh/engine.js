/* MISHANAMEH — engine: run state, map, combat resolution, persistence.
   No frameworks. State is plain data so the whole thing can be JSON'd mid‑fight. */

/* ═══════════  RNG (seeded, mulberry32)  ═══════════ */
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
let RNG = mulberry32(1);
const rnd  = ()=>RNG();
const ri   = (a,b)=>a+Math.floor(RNG()*(b-a+1));
const pick = (arr)=>arr[Math.floor(RNG()*arr.length)];
function shuffleIn(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(RNG()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

/* ═══════════  PERSISTENCE  ═══════════ */
const SAVE_KEY = 'mishanameh.v1';
const defaultSave = ()=>({
  unlocked:{ zal:false }, khan:1, khanMax:1,
  stats:{ runs:0, wins:0, bestTrial:0, kills:0, byHero:{}, secretSeen:false, secretWin:false },
  codexSeen:{}, mute:false, run:null, seenIntro:false, seenCoach:false,
});
let SAVE = defaultSave();
function loadSave(){
  try{ const raw = localStorage.getItem(SAVE_KEY); if(raw){ const o=JSON.parse(raw); SAVE = Object.assign(defaultSave(), o);
    SAVE.unlocked = Object.assign({zal:false}, o.unlocked||{});
    SAVE.stats = Object.assign(defaultSave().stats, o.stats||{}); } }catch(e){ SAVE = defaultSave(); }
}
function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); }catch(e){} }

/* ═══════════  CARD INSTANCES  ═══════════ */
let UID = 1;
const inst = (id, up=false)=>({ uid:UID++, id, up:!!up });
const def  = (c)=>CARDS[c.id];
const cardCost = (c)=>{ const d=def(c); if(d.cost<0) return -1; return (c.up && d.upCost!==undefined) ? d.upCost : d.cost; };
const cardName = (c)=>def(c).name + (c.up ? '+' : '');
const cardText = (c)=>def(c).t(c.up);

/* ═══════════  RUN  ═══════════ */
let R = null;

function newRun(heroId, khan){
  RNG = mulberry32((Date.now()^(Math.random()*1e9))>>>0);
  const H = HEROES[heroId];
  R = {
    hero:heroId, khan:khan||1, active:0,   // seat index — 0 in solo, so every seat-aware
                                           // call site is safe whether or not R.party exists
    hp:H.hp, maxHp:H.hp, gold:120,
    deck: STARTERS[heroId].map(id=>inst(id)),
    talismans:[], trial:0, step:0, map:[], cleared:0,
    featherUsed:false, secret:false, log:[], seed:Date.now(),
  };
  if(R.khan>=3){ R.maxHp -= 6; R.hp -= 6; }
  if(R.khan>=5){ R.maxHp -= 6; R.hp -= 6; R.gold = 70; }
  grantTalismanById(STARTING_TALISMAN[heroId]);
  buildTrialMap();
  SAVE.stats.runs++; SAVE.run = null; persist();
  return R;
}

/* riders: [{hero, name}] — one road, two or more decks */
function newCoopRun(riders, khan){
  newRun(riders[0].hero, khan);
  R.party = riders.map((rd,i)=>{
    const H = HEROES[rd.hero];
    const q = { hero:rd.hero, name:rd.name || H.name,
      hp:H.hp, maxHp:H.hp, deck:STARTERS[rd.hero].map(id=>inst(id)),
      talismans:[], featherUsed:false };
    if(khan>=3){ q.maxHp-=6; q.hp-=6; }
    if(khan>=5){ q.maxHp-=6; q.hp-=6; }
    return q;
  });
  // load seat 0 into the live fields, so R and party[0] are the same thing
  R.active = 0;
  const q0 = R.party[0];
  R.hero=q0.hero; R.deck=q0.deck; R.talismans=q0.talismans;
  R.hp=q0.hp; R.maxHp=q0.maxHp; R.featherUsed=false;
  // each rider gets their own hero's starting talisman
  for(let i=0;i<R.party.length;i++) withSeat(i, ()=>grantTalismanById(STARTING_TALISMAN[R.hero]));
  activate(0); stashActive();
  R.gold = Math.round(R.gold * (1 + 0.45*(R.party.length-1)));
  return R;
}

function trialDef(i){ return i<7 ? TRIALS[i] : SECRET_TRIAL; }

/* ═══════════  THE PARTY  ═══════════
   Solo play never touches any of this: R.hero / R.deck / R.hp are the run, the
   way they always were. Co-op adds R.party — a list of {hero, deck, talismans,
   hp, maxHp} — and activate(i) swaps one of them into those same fields. Every
   line of combat code below therefore works unchanged for one rider or four;
   it simply operates on whoever is currently swapped in. Same trick for the
   combat piles via G.seats. */
function partyLen(){ return R && R.party ? R.party.length : 1; }
function isCoop(){ return partyLen() > 1; }

function stashActive(){
  if(!R || !R.party) return;
  const q = R.party[R.active];
  q.hero=R.hero; q.deck=R.deck; q.talismans=R.talismans;
  q.hp=R.hp; q.maxHp=R.maxHp; q.featherUsed=R.featherUsed;
  if(G && G.seats && G.seats[R.active]){
    const s = G.seats[R.active];
    s.p=G.p; s.draw=G.draw; s.hand=G.hand; s.discard=G.discard; s.exhaust=G.exhaust;
  }
}
function activate(i){
  if(!R || !R.party || i==null || i===R.active) return;
  stashActive();
  R.active = i;
  const q = R.party[i];
  R.hero=q.hero; R.deck=q.deck; R.talismans=q.talismans;
  R.hp=q.hp; R.maxHp=q.maxHp; R.featherUsed=q.featherUsed;
  if(G && G.seats && G.seats[i]){
    const s = G.seats[i];
    G.p=s.p; G.draw=s.draw; G.hand=s.hand; G.discard=s.discard; G.exhaust=s.exhaust;
  }
}
/* run fn with seat i swapped in, then put things back where they were */
function withSeat(i, fn){
  const was = R ? R.active : 0;
  activate(i); const out = fn();
  activate(was); return out;
}
const seatOf = (i)=> (G && G.seats) ? G.seats[i] : null;
function livingSeats(){ return G.seats ? G.seats.filter(s=>!s.down) : [{}]; }

/* Each hero rides out with one thing of their own. */
const STARTING_TALISMAN = { rostam:'bridle', gord:'whetstone_t', zal:'nightfeather' };

/* A trial is 3 rows of 2 choices, then the boss — 28 nodes over the seven,
   which is enough road to actually build a deck before the White Demon. */
function buildTrialMap(){
  const rows = 3;
  const opts = [];
  for(let step=0; step<rows; step++){
    const row = [];
    const pool = ['battle','battle','battle','elite','camp','bazaar','omen','omen'];
    for(let k=0;k<2;k++){
      let type = pick(pool);
      if(R.trial===0 && step===0) type = k===0 ? 'battle' : 'omen';   // gentle opening
      if(type==='elite' && R.trial<1) type='battle';                   // no elites in Trial I
      if(row.includes(type) && type!=='battle') type='battle';
      row.push(type);
    }
    // guarantee a breather in the row before every boss
    if(step===rows-1 && !row.includes('camp') && !row.includes('bazaar')) row[rnd()<0.5?0:1] = rnd()<0.62?'camp':'bazaar';
    opts.push(row);
  }
  opts.push(['boss']);
  R.map = opts; R.step = 0; R._shop = null;
}
const bossStep = ()=> R.map.length-1;

/* ── run-level API used by events / talismans ── */
const RunAPI = {
  get gold_(){ return R.gold; },
  get maxHp(){ return R.maxHp; },
  get hp_(){ return R.hp; }, set hp_(v){ R.hp = Math.min(R.maxHp, v); },
  rng:()=>rnd(),
  heal(n){ R.hp = Math.min(R.maxHp, R.hp + n); },
  damage(n){ R.hp = Math.max(1, R.hp - n); },
  gold(n){ R.gold = Math.max(0, R.gold + n); },
  addMaxHp(n){ R.maxHp += n; R.hp = Math.max(1, Math.min(R.maxHp, R.hp + Math.max(0,n))); },
  addCard(id){ R.deck.push(inst(id)); return CARDS[id].name; },
  addCardToDeck(id){ R.deck.push(inst(id)); return CARDS[id].name; },
  addRareCard(){ const pool = poolFor(R.hero).filter(c=>c.rarity==='rare'); const c = pick(pool); R.deck.push(inst(c.id)); return c.name; },
  grantRandomRare(){ const pool = poolFor(R.hero).filter(c=>c.rarity==='rare'); const c = pick(pool); R.deck.push(inst(c.id)); return c.name; },
  upgradeRandom(){ const cands = R.deck.filter(c=>!c.up && CARDS[c.id].cost>=0); if(!cands.length) return 'nothing'; const c = pick(cands); c.up = true; return CARDS[c.id].name+'+'; },
  removeCard(){ UI.queueChoice({kind:'remove'}); },
  upgradeChoose(){ UI.queueChoice({kind:'upgrade'}); },
  giveTalisman(rarity){ return grantTalisman(rarity); },
  giveTalismanById(id){ return grantTalismanById(id); },
};

function grantTalismanById(id){
  const t = TALISMANS[id];
  if(!t) return grantTalisman('uncommon');          // never crash on a bad id
  if(R.talismans.includes(id)) return grantTalisman('uncommon');
  R.talismans.push(id);
  if(t.pickup) t.pickup(R);
  return t.name;
}
function grantTalisman(rarity){
  let pool = talismanPool(rarity).filter(t=>!R.talismans.includes(t.id));
  if(!pool.length) pool = Object.values(TALISMANS).filter(t=>!R.talismans.includes(t.id) && t.rarity!=='secret' && t.rarity!=='boss');
  if(!pool.length) return 'nothing (you own them all)';
  const t = pick(pool); R.talismans.push(t.id); if(t.pickup) t.pickup(R);
  return t.name;
}
function hasTal(id){ return R && R.talismans.includes(id); }
function mod(key, base=0){ let v = base; for(const id of (R?R.talismans:[])){ const m = TALISMANS[id].mods; if(m && m[key]!==undefined) v += m[key]; } return v; }
function talHook(name, ...args){ for(const id of (R?R.talismans:[])){ const t=TALISMANS[id]; if(t[name]) t[name](...args, t); } }

/* ═══════════  COMBAT  ═══════════ */
let G = null;

const BUFF_INFO = {
  str:{n:'Strength', i:'💪', d:'Attacks deal this much more damage.'},
  agi:{n:'Agility', i:'🌀', d:'Block cards give this much more Block.'},
  weak:{n:'Weak', i:'🥀', d:'Deals 25% less attack damage. −1 per turn.'},
  frail:{n:'Frail', i:'🪶', d:'Gains 25% less Block. −1 per turn.'},
  vuln:{n:'Vulnerable', i:'🎯', d:'Takes 50% more attack damage. −1 per turn.'},
  venom:{n:'Venom', i:'🧪', d:'Loses this much HP at the start of its turn, then −1.'},
  ember:{n:'Ember', i:'🔥', d:'Loses this much HP at the end of its turn. Does not fade.'},
  regen:{n:'Regen', i:'🌿', d:'Heals this much at the start of its turn, then −1.'},
  ward:{n:'Ward', i:'🛡️', d:'Eats one incoming debuff per point.'},
  companion:{n:'Companion', i:'🐎', d:'Strikes a random enemy for this much at the end of your turn.'},
  stun:{n:'Stunned', i:'💫', d:'Does nothing on its next turn.'},
  barricade:{n:'Unyielding', i:'🧱', d:'Your Block is never removed.'},
  halfguard:{n:'Unyielding', i:'🧱', d:'You keep half your Block between turns.'},
  whet:{n:'Whetted', i:'⚡', d:'Your next attacks deal more damage.'},
  quiver:{n:'Quiver', i:'🏹', d:'Your 3rd card each turn strikes a random enemy.'},
  nightfall:{n:'Nightfall', i:'🌙', d:'Empty hand at end of turn: draw and gain Farr.'},
  whitehair:{n:'White Hair', i:'🕊️', d:'Gain Farr at the start of your turn.'},
  banner:{n:'Banner', i:'🚩', d:'Farr and Block at the start of your turn.'},
  constellation:{n:'Constellation', i:'✨', d:'Block equal to your Farr at the start of your turn.'},
  nest:{n:'Nest', i:'🥚', d:'Invoking also heals you and draws cards.'},
  moon:{n:'Moon', i:'🌙', d:'Invoking also gives Energy.'},
  longroad:{n:'Long Road', i:'🛤️', d:'0‑cost cards give Farr.'},
  ironlungs:{n:'Iron Lungs', i:'🫁', d:'Losing HP to your own cards gives Strength.'},
  farrguard:{n:'Tahamtan', i:'🛡️', d:'Gaining Farr also gives Block.'},
  drowsy:{n:'Drowsy', i:'😴', d:'You will draw fewer cards next turn.'},
  tempstr:{n:'Sapped', i:'📉', d:'Strength lost for this turn only.'},
  hidden:{n:'Hidden', i:'🌫️', d:'You can barely touch it.'},
};

function makeFoe(id, khanScale){
  const d = FOES[id];
  let hp = d.hp[0]===d.hp[1] ? d.hp[0] : ri(d.hp[0], d.hp[1]);
  hp = Math.round(hp * khanScale);
  if((d.tier==='elite'||d.tier==='minion') && hasTal('rope')) hp = Math.round(hp*(1-mod('eliteCut')));
  return { id, name:d.name, fa:d.fa, art:d.art, tier:d.tier, hp, maxHp:hp, block:0,
           buffs:{}, turn:0, intentIdx:0, esc:3, phase:undefined, flip:false };
}

function khanScale(){ const k = R?R.khan:1; return 0.92 + (k-1)*0.095; }

/* Two riders means twice the cards and twice the energy, so the thing in the
   road has to be correspondingly larger or it dies before it acts. */
function coopScale(){ const n=partyLen(); return n<=1 ? 1 : 1 + 0.52*(n-1); }

function startCombat(kind, foeIds){
  const n = partyLen();
  const scale = khanScale() * coopScale();
  G = {
    kind, turn:0, round:0, over:false, won:false, playedThisTurn:0, reforged:0, pending:null,
    foes: foeIds.map(id=>makeFoe(id, scale)),
    invoked:0, anims:[], msg:[], seats:[],
  };
  G.foes.forEach(f=>f._G=G);

  for(let i=0;i<n;i++){
    const q = n>1 ? R.party[i] : R;
    const H = HEROES[q.hero];
    G.seats.push({
      i, hero:q.hero, name:q.name || HEROES[q.hero].name,
      p:{ hp:q.hp, maxHp:q.maxHp, block:0, energy:0, baseEnergy:H.energy, farr:0, buffs:{}, firstTurnEnergy:0 },
      draw:[], hand:[], discard:[], exhaust:[],
      ended:false, down:false, raised:false, gave:false,
    });
  }
  if(n>1) R.active = 0;
  const s0 = G.seats[0];
  G.p=s0.p; G.draw=s0.draw; G.hand=s0.hand; G.discard=s0.discard; G.exhaust=s0.exhaust;
  bindCombatAPI();

  for(let i=0;i<n;i++) withSeat(i, ()=>{
    G.draw = shuffleIn(R.deck.map(c=>inst(c.id, c.up)));
    talHook('combatStart', G.api);
  });

  turnStartAll(true);
  return G;
}

function maxFarr(){ return Math.max(4, 10 + mod('maxFarr')); }

function bindCombatAPI(){
  const A = {
    get p(){ return G.p; }, get foes(){ return G.foes; }, get hand(){ return G.hand; },
    get playedThisTurn(){ return G.playedThisTurn; },
    get reforged(){ return G.reforged; }, set reforged(v){ G.reforged=v; },
    trialsCleared: ()=>R.cleared,
    say:(t)=>{ G.msg.push(t); },

    dmg(foe, n, opt={}){
      if(!foe || foe.hp<=0) return false;
      let dmg = n;
      if(!opt.raw) dmg += (G.p.buffs.str||0);
      if(G.p.buffs.whetN>0 && !opt.noWhet){ dmg += (G.p.buffs.whet||0); G.p.buffs.whetN--; if(G.p.buffs.whetN<=0){ G.p.buffs.whet=0; } }
      if(G.p.buffs.weak>0) dmg = Math.floor(dmg*0.75);
      if(foe.hp===foe.maxHp && mod('openerPlus')>0) dmg = Math.floor(dmg*(1+mod('openerPlus')));
      if(foe.buffs.vuln>0) dmg = Math.floor(dmg*1.5);
      dmg = Math.max(0, dmg);
      const absorbed = Math.min(foe.block, dmg);
      foe.block -= absorbed; const real = dmg - absorbed;
      foe.hp -= real;
      G.anims.push({t:'hit', foe:foe, n:dmg});
      if(foe.hp<=0){ foe.hp=0; onFoeDeath(foe); return true; }
      return false;
    },
    dmgAll(n, opt={}){ const bonus = mod('aoePlus'); G.foes.slice().forEach(f=>{ if(f.hp>0) A.dmg(f, n+bonus, opt); }); },
    blk(n, opt={}){
      let b = n;
      if(!opt.raw){ b += (G.p.buffs.agi||0); if(G.p.buffs.frail>0) b = Math.floor(b*0.75); }
      G.p.block += Math.max(0,b); G.anims.push({t:'block', n:b});
    },
    loseHp(n){ G.p.hp -= n; G.anims.push({t:'selfhurt', n});
      if(G.p.buffs.ironlungs) A.buffP('str', G.p.buffs.ironlungs);
      if(G.p.hp<=0) checkDeath(); },
    heal(n){ G.p.hp = Math.min(G.p.maxHp, G.p.hp+n); G.anims.push({t:'heal', n}); },
    healRun(n){ R.hp = Math.min(R.maxHp, R.hp+n); },
    energy(n){ G.p.energy += n; },
    gold(n){ R.gold += n; },
    farr(n){
      if(n>0 && G.hand.some(c=>c.id==='c_shackle')){ G.msg.push('The shackle drinks it.'); return; }
      const before = G.p.farr;
      G.p.farr = Math.max(0, Math.min(maxFarr(), G.p.farr+n));
      const gained = G.p.farr - before;
      if(gained>0 && G.p.buffs.farrguard) A.blk(gained,{raw:true});
      if(gained>0) G.anims.push({t:'farr', n:gained});
    },
    buffP(k,n){ G.p.buffs[k] = (G.p.buffs[k]||0)+n; if(G.p.buffs[k]<=0 && k!=='str' && k!=='agi') delete G.p.buffs[k]; },
    debuffP(k,n){
      if(G.p.buffs.ward>0){ G.p.buffs.ward--; if(!G.p.buffs.ward) delete G.p.buffs.ward; G.msg.push('Warded.'); return; }
      A.buffP(k,n);
    },
    venomP(n){ A.debuffP('venom', n); },
    emberP(n){ A.debuffP('ember', n); },
    halveBlockP(){ G.p.block = Math.floor(G.p.block/2); },
    buffF(foe,k,n){ if(!foe||foe.hp<=0) return; let v=n; if(k==='venom'&&n>0) v += mod('venomPlus'); foe.buffs[k]=(foe.buffs[k]||0)+v; if(foe.buffs[k]<=0 && k!=='str') delete foe.buffs[k]; },
    buffAll(k,n){ G.foes.forEach(f=>{ if(f.hp>0) A.buffF(f,k,n); }); },
    blkF(foe,n){ foe.block += n; },
    healF(foe,n){ foe.hp = Math.min(foe.maxHp, foe.hp+n); },
    draw(n){ for(let i=0;i<n;i++) drawOne(); },
    discardChoose(n){ if(G.hand.length) G.pending = {kind:'discard', n:Math.min(n,G.hand.length)}; },
    discardHand(){ while(G.hand.length){ G.discard.push(G.hand.pop()); } },
    upgradeInHand(){ if(G.hand.some(c=>!c.up && CARDS[c.id].cost>=0)) G.pending = {kind:'upgradeCombat'}; },
    addCard(id, where, n){ for(let i=0;i<n;i++){ const c=inst(id);
        if(where==='hand'&&G.hand.length<10) G.hand.push(c);
        else if(where==='draw'){ G.draw.splice(Math.floor(rnd()*(G.draw.length+1)),0,c); }
        else G.discard.push(c); } },
    addRandomRareToHand(){ const pool=poolFor(R.hero).filter(c=>c.rarity==='rare'); const c=pick(pool);
      if(G.hand.length<10){ const it=inst(c.id); it.tempExhaust=true; G.hand.push(it); } },
    summon(id){ if(G.foes.filter(f=>f.hp>0).length>=4) return; const f=makeFoe(id, khanScale()); f._G=G; G.foes.push(f); setIntent(f); },
  };
  G.api = A; window.GA = A;
}

function drawOne(){
  if(G.hand.length>=10) return;
  if(!G.draw.length){
    if(!G.discard.length) return;
    G.draw = shuffleIn(G.discard); G.discard = [];
  }
  G.hand.push(G.draw.pop());
}

function onFoeDeath(foe){
  SAVE.stats.kills++;
  talHook('kill', G.api, foe);
}

function checkDeath(){
  if(G.p.hp>0) return false;
  if(hasTal('feather') && !R.featherUsed){
    R.featherUsed = true;
    G.p.hp = Math.round(G.p.maxHp*0.45);
    G.msg.push('THE FEATHER BURNS. She comes.');
    G.anims.push({t:'feather'});
    return false;
  }
  // in company, falling is not the end — it is a job for the other one
  if(partyLen()>1 && G.seats){
    const s = G.seats[R.active];
    if(!s.down){
      s.down = true; s.ended = true; G.p.hp = 0; G.p.block = 0;
      G.msg.push((s.name||'Your ally') + ' is down.');
      G.anims.push({t:'down', seat:R.active});
    }
    if(G.seats.every(x=>x.down)){ G.over = true; G.won = false; return true; }
    return false;
  }
  G.over = true; G.won = false; return true;
}

/* One rider hauls the other back onto their feet. Once each, per fight. */
function raiseAlly(byIx, targetIx){
  if(!G.seats || G.over) return false;
  const by = G.seats[byIx], tg = G.seats[targetIx];
  if(!by || !tg || by.down || !tg.down || by.raised) return false;
  let ok = false;
  withSeat(byIx, ()=>{ if(G.p.energy >= 1){ G.p.energy -= 1; ok = true; } });
  if(!ok){ G.msg.push('You need 1 Energy to reach them.'); return false; }
  by.raised = true;
  tg.down = false; tg.ended = true;
  tg.p.hp = Math.max(1, Math.round(tg.p.maxHp*0.30));
  tg.p.block = 0;
  G.msg.push((tg.name||'They') + ' is back up.');
  G.anims.push({t:'raise', seat:targetIx});
  return true;
}

/* Persian hospitality, as a game mechanic: hand a card across. */
function passCard(fromIx, uid, toIx){
  if(!G.seats || G.over) return false;
  const from = G.seats[fromIx], to = G.seats[toIx];
  if(!from || !to || from.gave || to.down) return false;
  const i = from.hand.findIndex(c=>c.uid===uid);
  if(i<0 || to.hand.length>=10) return false;
  to.hand.push(from.hand.splice(i,1)[0]);
  from.gave = true;
  G.anims.push({t:'pass', from:fromIx, to:toIx});
  return true;
}

/* ── playing cards ── */
function canPlay(c){
  const d = def(c);
  if(d.unplayable) return false;
  if(cardCost(c) > G.p.energy) return false;
  if(d.playable && !d.playable(G.api)) return false;
  return true;
}

function playCard(c, target){
  if(G.over || G.pending) return false;
  if(!canPlay(c)) return false;
  const d = def(c);
  const idx = G.hand.indexOf(c); if(idx<0) return false;
  G.p.energy -= Math.max(0, cardCost(c));
  G.hand.splice(idx,1);
  G.playedThisTurn++;

  if(cardCost(c)===0 && G.p.buffs.longroad) G.api.farr(G.p.buffs.longroad);

  d.fx(G.api, {up:c.up, target: target || G.foes.find(f=>f.hp>0)});

  if(d.type==='power') G.exhaust.push(c);
  else if(d.exhaust && !(c.up && d.upNoExhaust)) G.exhaust.push(c);
  else if(c.tempExhaust) G.exhaust.push(c);
  else G.discard.push(c);

  if(G.p.buffs.quiver && G.playedThisTurn===3){
    const alive = G.foes.filter(f=>f.hp>0); if(alive.length) G.api.dmg(pick(alive), G.p.buffs.quiver, {raw:true});
  }
  talHook('play', G.api, c);
  checkWin();
  return true;
}

function invoke(){
  if(G.p.farr < maxFarr() || G.over) return false;
  G.p.farr = 0; G.invoked++;
  G.anims.push({t:'invoke'});
  // the light burns away blindness
  ['hand','draw','discard'].forEach(k=>{ G[k] = G[k].filter(c=>c.id!=='s_blind'); });
  HEROES[R.hero].invoke.fx(G.api);
  if(G.p.buffs.nest){ G.api.heal(G.p.buffs.nest); G.api.draw(2); }
  if(G.p.buffs.moon) G.api.energy(G.p.buffs.moon);
  talHook('invoke', G.api);
  // the glory is not a private possession — when it lands, everyone feels it
  if(partyLen()>1){
    const me = R.active;
    for(let i=0;i<partyLen();i++) if(i!==me && !G.seats[i].down) withSeat(i, ()=>G.api.farr(2));
    G.msg.push('The Farr spills over — allies +2.');
  }
  checkWin();
  return true;
}

function checkWin(){
  if(G.foes.every(f=>f.hp<=0) && !G.over){ G.over = true; G.won = true; }
  return G.over;
}

/* ── turn flow ──
   In company everyone's turn runs at once: all seats refresh, all seats act in
   whatever order they like, and the enemies only move once every seat has said
   it is finished. Nobody sits watching somebody else think. */
function turnStartAll(first){
  G.turn++; G.round++;
  for(let i=0;i<partyLen();i++){
    const s = G.seats[i];
    if(s.down){ s.ended = true; continue; }
    s.ended = false; s.raised = false; s.gave = false;
    withSeat(i, ()=>playerTurnStart(first));
    if(G.over) return;
  }
}

function playerTurnStart(first){
  // block carry
  if(G.p.buffs.barricade){ /* keep */ }
  else if(G.p.buffs.halfguard) G.p.block = Math.floor(G.p.block/2);
  else G.p.block = 0;

  if(G.p.buffs.venom>0){ G.api.loseHp(G.p.buffs.venom); G.p.buffs.venom--; if(!G.p.buffs.venom) delete G.p.buffs.venom; }
  if(G.p.buffs.regen>0){ G.api.heal(G.p.buffs.regen); G.p.buffs.regen--; if(!G.p.buffs.regen) delete G.p.buffs.regen; }
  if(G.over) return;

  talHook('turnStart', G.api);
  if(G.p.buffs.whitehair) G.api.farr(G.p.buffs.whitehair);
  if(G.p.buffs.banner){ G.api.farr(G.p.buffs.banner); G.api.blk(G.p.buffs.banner>=2?5:4,{raw:true}); }
  if(G.p.buffs.constellation!==undefined) G.api.blk(G.p.farr + (G.p.buffs.constellation>=1?3:0), {raw:true});

  G.p.energy = G.p.baseEnergy + mod('energyPlus');
  if(first) G.p.energy += (G.p.firstTurnEnergy||0);

  const blinded = G.hand.filter(c=>c.id==='s_blind').length;
  let n = 5 + mod('drawPlus') - (G.p.buffs.drowsy||0) - blinded;
  delete G.p.buffs.drowsy;
  G.api.draw(Math.max(0,n));
  G.playedThisTurn = 0;
  if(G.p.hp<=0) checkDeath();
}

function endTurnSeat(ix){
  if(G.over || G.pending) return;
  if(ix == null) ix = (R && R.active) || 0;   // never index G.seats with undefined
  const seat = G.seats[ix];
  if(!seat || seat.ended || seat.down) return;

  withSeat(ix, ()=>{
    // statuses in hand that punish
    G.hand.forEach(c=>{ const d=def(c); if(d.endTurn) d.endTurn(G.api); });
    if(G.p.buffs.ember>0) G.api.loseHp(G.p.buffs.ember);
    if(G.p.buffs.companion){ const alive=G.foes.filter(f=>f.hp>0); if(alive.length) G.api.dmg(pick(alive), G.p.buffs.companion, {raw:true, noWhet:true}); }
    if(G.p.buffs.nightfall && G.hand.length===0){ G.api.draw(G.p.buffs.nightfall); G.api.farr(1); }
    if(G.over) return;

    // discard hand (keep retained)
    const keep = [];
    G.hand.forEach(c=>{ const d=def(c); if(d.retain) keep.push(c); else G.discard.push(c); });
    G.hand = keep;

    ['weak','frail','vuln'].forEach(k=>{ if(G.p.buffs[k]>0){ G.p.buffs[k]--; if(!G.p.buffs[k]) delete G.p.buffs[k]; } });
    G.p.buffs.whetN = G.p.buffs.whetN||0;
  });
  seat.ended = true;
  if(checkWin() || G.over) return;
  if(G.seats.every(s=>s.ended || s.down)) enemyTurn();
}

/* the name the rest of the game already calls */
function endTurn(){ endTurnSeat(R && R.party ? R.active : 0); }

/* who the thing in front of you decides to hit */
function pickTargetSeat(){
  const up = G.seats.map((s,i)=>i).filter(i=>!G.seats[i].down);
  if(!up.length) return R.active||0;
  return up[Math.floor(rnd()*up.length)];
}

function enemyTurn(){
  for(const f of G.foes){
    if(partyLen()>1 && f.hp>0) activate(pickTargetSeat());
    if(f.hp<=0) continue;
    f.block = 0;
    if(f.buffs.venom>0){ f.hp -= f.buffs.venom; f.buffs.venom--; if(!f.buffs.venom) delete f.buffs.venom;
      G.anims.push({t:'hit', foe:f, n:0, venom:true});
      if(f.hp<=0){ f.hp=0; onFoeDeath(f); continue; } }
    if(f.buffs.ember>0){ f.hp -= f.buffs.ember; G.anims.push({t:'hit', foe:f, n:0, ember:true});
      if(f.hp<=0){ f.hp=0; onFoeDeath(f); continue; } }
    if(f.buffs.stun>0){ f.buffs.stun--; if(!f.buffs.stun) delete f.buffs.stun; f.turn++; continue; }

    const d = FOES[f.id];
    const mv = d.moves[f.intentIdx] || d.moves[0];
    if(mv.k==='attack'){
      const hits = mv.hits||1;
      for(let i=0;i<hits;i++) foeHit(f, mv.dmg);
      if(mv.fx) mv.fx(G.api, f);
    } else if(mv.k==='block'){ f.block += mv.blk; if(mv.fx) mv.fx(G.api,f); }
    else { if(mv.fx) mv.fx(G.api, f); }

    f.turn++;
    ['weak','frail','vuln'].forEach(k=>{ if(f.buffs[k]>0){ f.buffs[k]--; if(!f.buffs[k]) delete f.buffs[k]; } });
    delete f.buffs.tempstr;
    if(G.over) return;
  }
  if(checkWin() || G.over) return;
  G.foes.forEach(f=>{ if(f.hp>0) setIntent(f); });
  turnStartAll(false);
}

function foeHit(f, base){
  let dmg = base + (f.buffs.str||0) + (f.buffs.tempstr||0);
  if(f.buffs.weak>0) dmg = Math.floor(dmg*0.75);
  if(G.p.buffs.vuln>0) dmg = Math.floor(dmg*1.5);
  dmg = Math.max(0, dmg);
  const absorbed = Math.min(G.p.block, dmg);
  G.p.block -= absorbed;
  const real = dmg - absorbed;
  if(real>0){ G.p.hp -= real; talHook('hurt', G.api, real); }
  G.anims.push({t:'phit', n:dmg, blocked:absorbed});
  if(G.p.hp<=0) checkDeath();
}

function setIntent(f){
  const d = FOES[f.id];
  f.intentIdx = d.ai(f, G) % d.moves.length;
}

function intentOf(f){
  const d = FOES[f.id];
  if(d.intentOverride) return d.intentOverride(f);
  const mv = d.moves[f.intentIdx] || d.moves[0];
  if(mv.k==='attack'){
    let dmg = mv.dmg + (f.buffs.str||0) + (f.buffs.tempstr||0);
    if(f.buffs.weak>0) dmg = Math.floor(dmg*0.75);
    if(G && G.p.buffs.vuln>0) dmg = Math.floor(dmg*1.5);
    return {k:'attack', n:mv.n, dmg:Math.max(0,dmg), hits:mv.hits||1};
  }
  return {k:mv.k, n:mv.n, txt:mv.txt, blk:mv.blk};
}
function nextIntentOf(f){
  const d = FOES[f.id];
  const clone = { ...f, buffs:{...f.buffs}, turn:f.turn+1 };
  try{ const i = d.ai(clone, G) % d.moves.length; const mv = d.moves[i];
    return mv.k==='attack' ? `${mv.n} · ${mv.dmg}${mv.hits>1?'×'+mv.hits:''}` : mv.n; }
  catch(e){ return '?'; }
}

/* ═══════════  END OF COMBAT  ═══════════ */
function finishCombat(){
  if(partyLen()>1){
    const was = R.active;
    for(let i=0;i<partyLen();i++){
      activate(i);
      // anyone who went down gets up at a quarter, bruised but breathing
      R.hp = G.seats[i].down ? Math.max(1, Math.round(R.maxHp*0.25)) : Math.max(0, G.p.hp);
      talHook('combatEnd', R, G.api);
      stashActive();
    }
    activate(was); stashActive();
    return;
  }
  R.hp = Math.max(0, G.p.hp);
  talHook('combatEnd', R, G.api);
}

/* ═══════════  MID-RUN SAVE  ═══════════ */
function saveRun(inCombat){
  if(!R){ SAVE.run=null; persist(); return; }
  stashActive();
  const snap = { R: JSON.parse(JSON.stringify({...R, log:R.log||[]})), combat:null };
  if(inCombat && G && !G.over){
    snap.combat = {
      kind:G.kind, turn:G.turn, round:G.round, playedThisTurn:G.playedThisTurn,
      reforged:G.reforged, invoked:G.invoked, active:R.active||0,
      foes:G.foes.map(f=>({id:f.id,name:f.name,art:f.art,hp:f.hp,maxHp:f.maxHp,block:f.block,
        buffs:{...f.buffs},turn:f.turn,intentIdx:f.intentIdx,esc:f.esc,phase:f.phase,flip:f.flip,tier:f.tier,fa:f.fa})),
      seats: G.seats.map(s=>({ i:s.i, hero:s.hero, name:s.name, ended:s.ended, down:s.down,
        raised:s.raised, gave:s.gave, p:JSON.parse(JSON.stringify(s.p)),
        draw:s.draw, hand:s.hand, discard:s.discard, exhaust:s.exhaust })),
    };
  }
  SAVE.run = snap; persist();
}

function restoreRun(){
  const s = SAVE.run; if(!s) return false;
  R = s.R; R.log = R.log||[];
  RNG = mulberry32((Date.now()^0x9e3779b9)>>>0);
  // Keep the uids that came in and move the counter past them. They are how a
  // guest names a card to the host ("play 4127"), so renumbering here would
  // silently break every remote card play — and did, once.
  UID = 1;
  const bump = (arr)=>{ if(!arr) return; arr.forEach(c=>{ if(!c) return;
    if(!c.uid) c.uid = UID++; else if(c.uid >= UID) UID = c.uid+1; }); };
  (R.party ? R.party.map(q=>q.deck) : [R.deck]).forEach(bump);
  if(s.combat && s.combat.seats)
    s.combat.seats.forEach(st=>{ bump(st.draw); bump(st.hand); bump(st.discard); bump(st.exhaust); });
  if(s.combat){
    const c = s.combat;
    G = { kind:c.kind, turn:c.turn, round:c.round||0, over:false, won:false,
      playedThisTurn:c.playedThisTurn, reforged:c.reforged, pending:null, invoked:c.invoked,
      foes:c.foes, seats:c.seats, anims:[], msg:[] };
    G.foes.forEach(f=>f._G=G);
    if(R.party) R.active = c.active||0;
    const s0 = G.seats[R.party ? (c.active||0) : 0];
    G.p=s0.p; G.draw=s0.draw; G.hand=s0.hand; G.discard=s0.discard; G.exhaust=s0.exhaust;
    bindCombatAPI();
    return 'combat';
  }
  return 'map';
}

loadSave();
