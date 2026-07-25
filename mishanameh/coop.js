/* MISHANAMEH — CO-OP.

   Three ways to ride out:
     solo    — as before
     local   — two riders, one screen, tap between them (this is the Houston
               kitchen-table mode: pass the laptop, or don't, and just both
               lean in)
     online  — two to four riders on different machines, joined by a four-letter
               room code, talking over net.js

   Online is host-authoritative. The host owns the one true R and G; guests are
   mirrors that send intents and render whatever comes back. That means there
   is exactly one simulation in the world and therefore nothing to de-sync.
   The snapshot format is just the existing save file — the same serialiser
   that already survives being closed mid-boss — so the sync path and the
   save path are the same tested code.

   In combat everybody acts at once and the enemies move when the last person
   says they are done, so nobody sits watching somebody else think. Out of
   combat the host steers the road; guests still pick their own card rewards. */

const CO = (()=>{

const S = {
  mode:'solo',           // solo | local | online
  role:'host',           // host | guest
  seat:0,                // which seat this machine drives
  riders:[],             // [{hero,name,peerId,seat}]
  peerSeat:{},           // peerId → seat
  pending:null,          // guest: reward options awaiting a pick
  lastSnap:0,
  chat:[],
};

const PHRASES = [
  {k:'go',    t:'Go!',                fa:'برو!'},
  {k:'wait',  t:'Wait for me',        fa:'صبر کن'},
  {k:'block', t:'Block this one',     fa:'سپر بگیر'},
  {k:'kill',  t:'Kill the small one', fa:'اون کوچیکه رو بزن'},
  {k:'help',  t:'I need help',        fa:'کمک'},
  {k:'inv',   t:'Save your Farr',     fa:'فرّت رو نگه دار'},
  {k:'nice',  t:'Beautiful',          fa:'آفرین'},
  {k:'sorry', t:'That was my fault',  fa:'ببخشید'},
  {k:'ready', t:'Ready',              fa:'آماده‌ام'},
];

/* ═══════════  STATE HELPERS  ═══════════ */
const isOnline = ()=> S.mode==='online';
const isGuest  = ()=> S.mode==='online' && S.role==='guest';
const isHost   = ()=> S.mode!=='online' || S.role==='host';
const active   = ()=> S.mode==='solo' ? 0 : S.seat;
/* in local mode you drive every seat; online, only your own */
const drives   = (i)=> S.mode==='local' ? true : (i===S.seat);

/* ═══════════  SNAPSHOT (reuses the save serialiser)  ═══════════ */
function snapshot(){
  saveRun(UI.screen==='combat');
  return { run: SAVE.run, screen: UI.screen, riders: S.riders,
           over: G ? {over:G.over, won:G.won} : null };
}
function applySnapshot(msg){
  if(!msg.run) return;
  SAVE.run = msg.run;
  const where = restoreRun();
  S.riders = msg.riders || S.riders;
  // restoreRun leaves R's live fields holding whichever seat the host had
  // swapped in when it serialised. Swap ours in properly — activate() moves
  // both the run fields and the combat piles together.
  if(R && R.party){
    const seat = Math.min(S.seat, R.party.length-1);
    R.active = msg.run.combat ? (msg.run.combat.active||0) : (R.active||0);
    activate(seat);
    S.seat = seat;
  }
  return msg.screen || where;
}

let pushT=null;
function push(){
  if(!isOnline() || !isHost()) return;
  clearTimeout(pushT);
  // coalesce: a card play can touch state a dozen times in one tick
  pushT = setTimeout(()=>{ NET.say(Object.assign({t:'snap'}, snapshot())); }, 30);
}

/* ═══════════  INTENTS  ═══════════
   Guests never mutate. They ask; the host does it and the answer arrives as
   the next snapshot. */
function act(a, data){
  if(isGuest()){ NET.say(Object.assign({t:'act', a, seat:S.seat}, data||{})); return false; }
  return true;                     // host: caller proceeds locally
}

function applyAct(m){
  if(!isHost() || !R) return;
  const seat = m.seat|0;
  try{
    if(m.a==='play'){
      withSeat(seat, ()=>{
        const c = G.hand.find(x=>x.uid===m.uid);
        if(c && canPlay(c)) playCard(c, m.foe!=null ? G.foes[m.foe] : G.foes.find(f=>f.hp>0));
      });
      afterHostChange();
    }
    else if(m.a==='end'){ endTurnSeat(seat); afterHostChange(); }
    else if(m.a==='invoke'){ withSeat(seat, ()=>{ if(G.p.farr>=maxFarr()) invoke(); }); afterHostChange(); }
    else if(m.a==='raise'){ raiseAlly(seat, m.target|0); afterHostChange(); }
    else if(m.a==='pass'){ passCard(seat, m.uid, m.to|0); afterHostChange(); }
    else if(m.a==='reward'){ hostGrantReward(seat, m.id, m.up); }
    else if(m.a==='chat'){ showChat(seat, m.k); NET.say({t:'chat2', seat, k:m.k}); }
  }catch(e){ console.warn('act failed', m, e); }
}

function afterHostChange(){
  if(typeof paint==='function') paint();
  push();
  if(G && G.over && typeof combatOver==='function' && UI.screen==='combat'){
    UI.screen='reward-wait'; setTimeout(()=>combatOver(), 620);
  }
}

/* ═══════════  REWARDS (each rider picks their own)  ═══════════ */
function offerRewards(){
  // host builds a private three-card offer per seat and ships it out
  if(!isOnline() || !isHost() || !R.party) return;
  for(let i=1;i<R.party.length;i++){
    const opts = withSeat(i, ()=>cardRewards(3 + mod('rewardCards'), G ? G.kind : 'battle'));
    const peer = Object.keys(S.peerSeat).find(p=>S.peerSeat[p]===i);
    NET.say({t:'offer', seat:i, cards:opts.map(c=>({id:c.id, up:!!c.up})) });
  }
}
function hostGrantReward(seat, id, up){
  if(!R.party || !CARDS[id]) return;
  withSeat(seat, ()=>{ R.deck.push(inst(id, !!up)); });
  stashActive(); push();
}

/* ═══════════  CHAT  ═══════════ */
function showChat(seat, k){
  const p = PHRASES.find(x=>x.k===k); if(!p) return;
  S.chat.push({seat, p, at:Date.now()});
  if(typeof coopBubble==='function') coopBubble(seat, p);
}
function sendChat(k){
  if(isOnline()) NET.say({t:'chat', seat:S.seat, k});
  showChat(S.seat, k);
}

/* ═══════════  WIRING  ═══════════ */
function wireNet(){
  NET.on('snap', (m)=>{
    if(isHost()) return;
    const where = applySnapshot(m);
    routeGuest(where, m);
  });
  NET.on('act', applyAct);
  NET.on('offer', (m)=>{ if(m.seat===S.seat){ S.pending = m.cards; if(typeof guestRewardScreen==='function') guestRewardScreen(m.cards); } });
  NET.on('chat', (m)=>showChat(m.seat, m.k));
  NET.on('chat2',(m)=>{ if(m.seat!==S.seat) showChat(m.seat, m.k); });
  NET.on('start', (m)=>{
    if(isHost()) return;
    S.riders = m.riders; S.seat = S.peerSeat[NET.me.id] != null ? S.peerSeat[NET.me.id] : m.yours[NET.me.id];
    applySnapshot(m); routeGuest(m.screen, m);
  });
  NET.on('seats', (m)=>{ S.peerSeat = m.map; S.riders = m.riders;
    if(!isHost() && m.map[NET.me.id]!=null) S.seat = m.map[NET.me.id];
    if(typeof lobbyRefresh==='function') lobbyRefresh(); });
  NET.on('join', ()=>{ if(isHost()) { assignSeats(); if(R) push(); } });
  NET.on('leave', ()=>{ if(isHost()) assignSeats(); if(typeof lobbyRefresh==='function') lobbyRefresh(); });
  NET.on('status', ()=>{ if(typeof netPip==='function') netPip(); });
}

function assignSeats(){
  if(!isHost() || !isOnline()) return;
  const ps = NET.peers();
  S.peerSeat = { [NET.me.id]: 0 };
  ps.forEach((p,i)=>{ S.peerSeat[p.id] = i+1; });
  S.riders = [{hero:S.riders[0] ? S.riders[0].hero : 'rostam', name:NET.me.name, seat:0}]
    .concat(ps.map((p,i)=>({hero:p.hero||'gord', name:p.name, seat:i+1})));
  NET.say({t:'seats', map:S.peerSeat, riders:S.riders});
  if(typeof lobbyRefresh==='function') lobbyRefresh();
}

function routeGuest(where, m){
  if(typeof UI==='undefined') return;
  if(m && m.over && m.over.over){ /* host is resolving the end of the fight */ }
  if(where==='combat' || (SAVE.run && SAVE.run.combat)){ UI.screen='combat'; renderCombat(); }
  else if(where==='map' || where==='node'){ UI.screen='map'; screenMap(); }
  else if(typeof paint==='function'){ paint(); }
}

/* ═══════════  PUBLIC  ═══════════ */
/* Any fresh run must drop whatever combat is still sitting in memory, or the
   first snapshot ships a dead G stapled to a live R. */
function resetBoard(){ G = null; if(typeof UI!=='undefined') UI.screen='map'; }

function beginLocal(riders, khan){
  S.mode='local'; S.role='host'; S.seat=0; S.riders=riders;
  resetBoard();
  newCoopRun(riders, khan||1);
  saveRun(false);
}
async function beginOnlineHost(myHero, myName, khan){
  S.mode='online'; S.role='host'; S.seat=0;
  S.riders=[{hero:myHero, name:myName, seat:0}];
  const code = await NET.open(NET.newCode(), myName, myHero, true);
  if(code) assignSeats();
  return code;
}
async function joinOnline(code, myHero, myName){
  S.mode='online'; S.role='guest'; S.seat=1;
  S.riders=[];
  return await NET.open(code, myName, myHero, false);
}
function launchOnline(khan){
  if(!isHost()) return false;
  assignSeats();
  if(S.riders.length<2) return false;
  resetBoard();
  newCoopRun(S.riders.map(r=>({hero:r.hero, name:r.name})), khan||1);
  saveRun(false);
  NET.say(Object.assign({t:'start', riders:S.riders, yours:S.peerSeat}, snapshot()));
  return true;
}
function leave(){
  if(isOnline()) NET.close();
  S.mode='solo'; S.role='host'; S.seat=0; S.riders=[]; S.peerSeat={};
}
function setHero(h){
  if(isOnline()){ NET.me.hero = h; NET.say({t:'beat', name:NET.me.name, hero:h, host:isHost()}); }
  if(S.riders[S.seat]) S.riders[S.seat].hero = h;
  if(isHost()) assignSeats();
}

return {
  get mode(){ return S.mode; }, get role(){ return S.role; },
  get seat(){ return S.seat; }, set seat(v){ S.seat=v; },
  get riders(){ return S.riders; }, get pending(){ return S.pending; },
  set pending(v){ S.pending=v; },
  PHRASES, isOnline, isGuest, isHost, active, drives,
  push, act, snapshot, applySnapshot, offerRewards, sendChat, wireNet,
  beginLocal, beginOnlineHost, joinOnline, launchOnline, leave, setHero, assignSeats,
};
})();
