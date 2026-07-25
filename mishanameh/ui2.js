/* MISHANAMEH — UI, second layer.
   Loaded after ui.js and overrides parts of it in place. Three jobs:
     1. put the drawn plates in wherever an emoji used to be
     2. co-op: seat rail, raise, pass, quick-chat, lobby, network pip
     3. teach the game inside the game — every keyword is tappable, every
        creature explains itself the first time you meet it, and the incoming
        damage is added up for you instead of left as homework            */

/* ═══════════════  1. THE GLOSSARY  ═══════════════
   Every mechanical word anywhere in the game — on a card, in a tooltip, in the
   Codex — is tappable and explains itself where you are standing. */
const GLOSS = {
  'Block':      ['Soaks damage, then vanishes at the start of your next turn. It is meant to be spent, not hoarded.'],
  'Strength':   ['Every attack you play deals this much more. It lasts the whole fight.'],
  'Agility':    ['Every Block card gives this much more. It lasts the whole fight.'],
  'Weak':       ['Deals 25% less attack damage. Wears off by 1 each turn.'],
  'Frail':      ['Gains 25% less Block. Wears off by 1 each turn.'],
  'Vulnerable': ['Takes 50% more attack damage. Wears off by 1 each turn.'],
  'Venom':      ['Loses this much HP at the start of its turn, then drops by 1. It ignores Block entirely.'],
  'Ember':      ['Loses this much HP at the end of its turn. Unlike Venom it does not fade.'],
  'Regen':      ['Heals this much at the start of its turn, then drops by 1.'],
  'Ward':       ['Eats one incoming debuff per point, then is spent.'],
  'Companion':  ['Rakhsh. Strikes a random enemy for this much at the end of your turn.'],
  'Farr':       ['فرّ — divine glory. The gold meter. Fill it and you can INVOKE. It empties and can be filled again in the same fight.'],
  'Energy':     ['What playing cards costs. You get it back, fully, every turn.'],
  'Exhaust':    ['The card leaves the fight entirely — not to the discard, and it will not come round again.'],
  'Stun':       ['It does nothing at all on its next turn.'],
  'Retained':   ['Stays in your hand at end of turn instead of being discarded.'],
  'Invoke':     ['Spend a full Farr meter to call your hero’s one enormous thing. It refills.'],
  'Invoking':   ['Spending a full Farr meter.'],
  'Down':       ['At 0 HP in company you are not dead — you are down, and an ally can spend 1 Energy to haul you up.'],
  'Khān':       ['خان — a difficulty step. Each one makes everything heavier. Clear one to unlock the next.'],
};
const GLOSS_KEYS = Object.keys(GLOSS).sort((a,b)=>b.length-a.length);
const GLOSS_RE = new RegExp('\\b(' + GLOSS_KEYS.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|') + ')\\b','g');

markup = function(s){
  return esc(s)
    .replace(/\b(\d+)\b/g,'<b>$1</b>')
    .replace(GLOSS_RE, '<u class="kw" data-k="$1">$1</u>');
};

function glossTip(k, x, y){
  const g = GLOSS[k]; if(!g) return;
  tip(`<b>${esc(k)}</b><br>${esc(g[0])}`, x, y);
}
document.addEventListener('click', (e)=>{
  const kw = e.target.closest('.kw');
  if(kw){ e.stopPropagation(); glossTip(kw.dataset.k, e.clientX, e.clientY); }
}, true);
document.addEventListener('mouseover', (e)=>{
  const kw = e.target.closest('.kw');
  if(kw) glossTip(kw.dataset.k, e.clientX, e.clientY);
});

/* ═══════════════  2. FIRST SIGHT — lore where you are standing  ═══════════════
   The Codex is still there, but you should never have to open it. The first
   time a creature, a card or a talisman appears, its note comes to you. */
function firstSight(kind, id, name, fa, node){
  SAVE.codexSeen = SAVE.codexSeen || {};
  const key = kind+':'+id;
  if(SAVE.codexSeen[key]) return;
  const src = (typeof LORE!=='undefined') ? (LORE[kind]||{}) : {};
  const text = src[id];
  if(!text) { SAVE.codexSeen[key]=true; return; }
  SAVE.codexSeen[key]=true; persist();
  marginalia(name, fa, text, kind, id);
}

/* the Codex text carries a little <i>/<b> markup of its own; keep those two
   and escape everything else rather than printing tags at people */
function loreHtml(s){
  return esc(String(s))
    .replace(/&lt;(\/?)(i|b|em|strong)&gt;/g, '<$1$2>')
    .replace(/\n/g,'<br>');
}

let margQ = [], margOn = false;
function marginalia(name, fa, text, kind, id){
  margQ.push({name, fa, text, kind, id});
  if(!margOn) nextMarginalia();
}
function nextMarginalia(){
  const m = margQ.shift();
  if(!m){ margOn=false; return; }
  margOn = true;
  const box = el('div',{class:'marg'});
  if(kindHasArt(m.kind, m.id)) box.appendChild(PLATE.node(m.id, 72, m.kind==='heroes'?'hero':'foe'));
  box.appendChild(el('div',{class:'margtx'},[
    el('div',{class:'marglab', text:'IN THE MARGIN'}),
    el('b',{text:m.name + (m.fa?'  '+m.fa:'')}),
    el('p',{html:loreHtml(m.text)}),
  ]));
  box.appendChild(el('button',{class:'margx', html:'&times;', onclick:()=>closeMarg(box)}));
  document.body.appendChild(box);
  requestAnimationFrame(()=>box.classList.add('in'));
  setTimeout(()=>box.classList.add('in'), 60);
  const t = setTimeout(()=>closeMarg(box), 11000);
  box._t = t;
}
function closeMarg(box){
  clearTimeout(box._t);
  box.classList.remove('in');
  setTimeout(()=>{ box.remove(); nextMarginalia(); }, 320);
}
function kindHasArt(kind, id){
  return (kind==='foes' && PLATE.CREATURES[id]) || (kind==='heroes' && PLATE.HEROES_ART[id]);
}

/* ═══════════════  3. PLATES EVERYWHERE  ═══════════════ */
function foeArt(f, size){
  const c = PLATE.node(f.id, size||118, 'foe');
  c.classList.add('fart');
  return c;
}
function heroArt(id, size){
  const c = PLATE.node(id, size||150, 'hero');
  c.classList.add('hart');
  return c;
}

/* how much is actually coming at you next turn, added up */
function incomingTotal(){
  if(!G) return 0;
  let n=0;
  G.foes.forEach(f=>{ if(f.hp<=0) return; const it=intentOf(f);
    if(it.k==='attack') n += it.dmg*(it.hits||1); });
  return n;
}

paintFoes = function(){
  const host = $('#foes'); if(!host) return;
  host.innerHTML='';
  const many = G.foes.length;
  const size = many>=4 ? 92 : many===3 ? 106 : 124;
  G.foes.forEach((f,i)=>{
    if(f.hp<=0){ host.appendChild(el('div',{class:'foe dead'},[el('div',{class:'fart gone', text:'✕'})])); return; }
    const n = el('div',{class:'foe f-'+f.id+' '+(f.tier==='boss'?'boss':'')+(UI.targeting?' targetable':''), 'data-i':i});
    if(UI.targeting) n.addEventListener('click', ()=>resolveTarget(f));
    const it = intentOf(f);
    const intent = el('div',{class:'intent'});
    if(it.k==='attack'){ intent.className='intent atk';
      intent.innerHTML = `<span class="ii">🗡️</span><b>${it.dmg}</b>${it.hits>1?`<i>×${it.hits}</i>`:''}`; }
    else if(it.k==='block'){ intent.className='intent def'; intent.innerHTML=`<span class="ii">🛡️</span><b>${it.blk}</b>`; }
    else if(it.k==='buff'){ intent.className='intent buf'; intent.innerHTML=`<span class="ii">⬆️</span>`; }
    else if(it.k==='debuff'){ intent.className='intent deb'; intent.innerHTML=`<span class="ii">☠️</span>`; }
    else { intent.className='intent spc'; intent.innerHTML=`<span class="ii">❔</span>`; }
    const tipHtml = `<b>${esc(it.n)}</b><br>${it.txt? markup(it.txt) : (it.k==='attack'?`Attacks for <b>${it.dmg}</b>${it.hits>1?' ×'+it.hits:''}`:it.k==='block'?`Gains <b>${it.blk}</b> ${markup('Block')}`:'')}`
      + (mod('foresight')?`<br><span class="dim">then: ${esc(nextIntentOf(f))}</span>`:'');
    intent.addEventListener('mouseenter',(e)=>tip(tipHtml, e.clientX, e.clientY));
    intent.addEventListener('mouseleave', untip);
    intent.addEventListener('click',(e)=>{ e.stopPropagation(); tip(tipHtml, e.clientX, e.clientY); });
    n.appendChild(intent);
    n.appendChild(foeArt(f, size));
    n.appendChild(el('div',{class:'fname', text:f.name}));
    const bar = el('div',{class:'fhp'},[el('div',{class:'fhpf', style:`width:${Math.max(0,f.hp/f.maxHp*100)}%`}), el('span',{text:`${f.hp}/${f.maxHp}`})]);
    n.appendChild(bar);
    if(f.block>0) n.appendChild(el('div',{class:'fblock', html:`🛡️<b>${f.block}</b>`}));
    n.appendChild(buffChips(f.buffs,false));
    host.appendChild(n);
    firstSight('foes', f.id, f.name, f.fa);
  });
};

/* ═══════════════  4. THE MIDDLE: Farr, you, and everyone with you  ═══════════════ */
paintMid = function(){
  const host = $('#mid'); if(!host) return;
  host.innerHTML='';
  const mf = maxFarr(), ready = G.p.farr>=mf;
  const farr = el('div',{class:'farrbox '+(ready?'ready':'')});
  farr.appendChild(el('div',{class:'farrlab', html:`FARR <i>فرّ</i>`}));
  const meter = el('div',{class:'farrmeter'});
  for(let i=0;i<mf;i++) meter.appendChild(el('i',{class:i<G.p.farr?'on':''}));
  farr.appendChild(meter);
  const inv = el('button',{class:'invoke '+(ready?'lit':''), onclick:doInvoke, disabled: ready?null:'disabled'},
    ready? '✦ INVOKE — '+HEROES[R.hero].invoke.name : `${G.p.farr}/${mf}`);
  const invTip = `<b>${esc(HEROES[R.hero].invoke.name)}</b> <i>${esc(HEROES[R.hero].invoke.fa)}</i><br>${markup(HEROES[R.hero].invoke.text)}<br><span class="dim">Fill the halo to ${mf} ${markup('Farr')} and the Simurgh answers. It can be filled again.</span>`;
  inv.addEventListener('mouseenter',(e)=>tip(invTip, e.clientX, e.clientY));
  inv.addEventListener('mouseleave', untip);
  farr.appendChild(inv);
  host.appendChild(farr);

  const pl = el('div',{class:'playerbox'});
  pl.appendChild(el('div',{class:'energy', html:`<b>${G.p.energy}</b><span>ENERGY</span>`}));
  const blk = el('div',{class:'blockpip '+(G.p.block>0?'on':'')});
  blk.innerHTML = `🛡️<b>${G.p.block}</b>`;
  blk.addEventListener('mouseenter',(e)=>tip(markup('Block')+` — you have <b>${G.p.block}</b>.`, e.clientX, e.clientY));
  blk.addEventListener('mouseleave', untip);
  pl.appendChild(blk);
  // the single most useful number in the game, and it was homework before
  const inc = incomingTotal();
  if(inc>0){
    const net = Math.max(0, inc - G.p.block);
    const ip = el('div',{class:'incoming '+(net>0?'hurt':'safe')});
    ip.innerHTML = `<span>INCOMING</span><b>${inc}</b>${net>0?`<i>${net} gets through</i>`:'<i>all blocked</i>'}`;
    ip.addEventListener('mouseenter',(e)=>tip(`Everything on the board adds up to <b>${inc}</b> next turn.<br>Your ${markup('Block')} stops <b>${Math.min(inc,G.p.block)}</b> of it.`, e.clientX, e.clientY));
    ip.addEventListener('mouseleave', untip);
    pl.appendChild(ip);
  }
  pl.appendChild(buffChips(G.p.buffs,true));
  host.appendChild(pl);

  if(G.seats && G.seats.length>1) host.appendChild(allyRail());
};

function allyRail(){
  const rail = el('div',{class:'allyrail'});
  G.seats.forEach((s,i)=>{
    if(i===R.active) return;
    const box = el('div',{class:'ally '+(s.down?'down':'')+(s.ended?' ended':'')});
    box.appendChild(PLATE.node(s.hero, 46, 'hero'));
    box.appendChild(el('div',{class:'allyname', text:s.name}));
    box.appendChild(el('div',{class:'allyhp'},[
      el('div',{class:'allyhpf', style:`width:${Math.max(0,s.p.hp/s.p.maxHp*100)}%`}),
      el('span',{text:`${Math.max(0,s.p.hp)}/${s.p.maxHp}`})]));
    const meta = el('div',{class:'allymeta'});
    if(s.p.block>0) meta.appendChild(el('span',{html:`🛡️${s.p.block}`}));
    meta.appendChild(el('span',{html:`⚡${s.p.energy}`}));
    meta.appendChild(el('span',{class:'far', html:`✦${s.p.farr}`}));
    box.appendChild(meta);
    box.appendChild(el('div',{class:'allystate', text: s.down? 'DOWN' : s.ended? 'done' : 'thinking…'}));

    if(s.down && !G.seats[R.active].down && !G.seats[R.active].raised){
      box.appendChild(el('button',{class:'btn tiny gold', onclick:()=>doRaise(i)},'⤒ REACH FOR THEM (1⚡)'));
    }
    if(!s.down && !G.seats[R.active].gave){
      box.appendChild(el('button',{class:'btn tiny', onclick:()=>startPass(i)},'🫖 PASS A CARD'));
    }
    if(CO.mode==='local'){
      box.appendChild(el('button',{class:'btn tiny', onclick:()=>switchSeat(i)},'↹ PLAY AS ' + s.name.toUpperCase()));
    }
    rail.appendChild(box);
  });
  return rail;
}

function switchSeat(i){
  if(CO.mode!=='local') return;
  CO.seat = i; activate(i);
  UI.targeting=null; UI.passMode=null;
  sfx('click'); paint();
}

function doRaise(i){
  if(!CO.act('raise', {target:i})) return;
  raiseAlly(R.active, i); sfx('invoke'); paint(); CO.push(); saveRun(true);
}
function startPass(i){
  UI.passMode = i;
  toast('Tap a card to hand it over');
  paint();
}

/* ═══════════════  5. INPUT — routed through the host when online  ═══════════════ */
const _onCardClick = onCardClick;
onCardClick = function(c){
  if(UI.passMode!=null){
    const to = UI.passMode; UI.passMode = null;
    if(!CO.act('pass', {uid:c.uid, to})) { paint(); return; }
    passCard(R.active, c.uid, to); sfx('get'); paint(); CO.push(); saveRun(true);
    return;
  }
  if(CO.isGuest()){
    if(G.over || G.pending) return;
    if(!canPlay(c)){ sfx('nope'); toast('Not enough Energy.'); return; }
    const d = CARDS[c.id], alive = G.foes.filter(f=>f.hp>0);
    if(d.targeted && alive.length>1){ UI.targeting=c; toast('Choose a target'); paintFoes(); return; }
    CO.act('play', {uid:c.uid, foe: G.foes.indexOf(alive[0])});
    return;
  }
  _onCardClick(c);
};

resolveTarget = function(f){
  const c = UI.targeting; UI.targeting=null;
  if(!c) return;
  if(CO.isGuest()){ CO.act('play', {uid:c.uid, foe:G.foes.indexOf(f)}); return; }
  doPlay(c,f);
};

const _doEndTurn = doEndTurn;
doEndTurn = function(){
  if(G.over || G.pending) return;
  if(CO.isGuest()){ CO.act('end'); toast('Waiting for the others…'); return; }
  UI.targeting=null; sfx('turn');
  endTurnSeat(R.active); paint(); saveRun(true); CO.push();
  if(G.over) setTimeout(combatOver, 620);
};

const _doInvoke = doInvoke;
doInvoke = function(){
  if(G.p.farr<maxFarr() || G.over || G.pending) return;
  if(CO.isGuest()){ CO.act('invoke'); return; }
  _doInvoke();
  CO.push();
};

const _doPlay = doPlay;
doPlay = function(c, target){ _doPlay(c, target); CO.push(); };

/* ═══════════════  6. COMBAT FRAME  ═══════════════ */
const _renderCombat = renderCombat;
renderCombat = function(){
  _renderCombat();
  if(G && G.seats && G.seats.length>1){
    const wrap = $('.scr.combat');
    if(wrap) wrap.classList.add('coop');
    mountChat();
  }
  netPip();
};

/* The phrase bar floats rather than sitting in the flow — combat is a fixed
   100dvh layout and anything added to it eats the hand. */
function mountChat(){
  if($('#chatdock')) return;
  const dock = el('div',{id:'chatdock', class:'chatdock'});
  const pop = el('div',{class:'chatpop'});
  CO.PHRASES.forEach(p=>{
    pop.appendChild(el('button',{class:'ph', title:p.fa, onclick:()=>{ CO.sendChat(p.k); dock.classList.remove('open'); }}, p.t));
  });
  dock.appendChild(pop);
  dock.appendChild(el('button',{class:'chattog', html:'💬', title:'Say something',
    onclick:()=>dock.classList.toggle('open')}));
  document.body.appendChild(dock);
}
function unmountChat(){ const d=$('#chatdock'); if(d) d.remove(); }
function chatBar(){ mountChat(); return el('span'); }

function coopBubble(seat, p){
  const host = $('#fx') || document.body;
  const b = el('div',{class:'bubble', html:`<b>${esc((G&&G.seats&&G.seats[seat]?G.seats[seat].name:'Someone'))}</b>${esc(p.t)} <i>${esc(p.fa)}</i>`});
  host.appendChild(b);
  requestAnimationFrame(()=>b.classList.add('in'));
  setTimeout(()=>b.classList.add('in'),50);
  setTimeout(()=>{ b.classList.remove('in'); setTimeout(()=>b.remove(),300); }, 3400);
}

function netPip(){
  let pip = $('#netpip');
  if(!CO.isOnline()){ if(pip) pip.remove(); return; }
  if(!pip){ pip = el('div',{id:'netpip', class:'netpip'}); document.body.appendChild(pip); }
  const st = NET.status;
  pip.className = 'netpip '+st;
  pip.innerHTML = `<i></i>${st==='live'?'connected':st}<span>${NET.code||''}</span>`;
}

/* ═══════════════  7. GUEST REWARD PICK  ═══════════════ */
function guestRewardScreen(cards){
  const grid = el('div',{class:'cardrow'});
  cards.forEach(c=>{
    const e = cardEl({uid:0, id:c.id, up:c.up});
    e.classList.add('choosable');
    e.addEventListener('click', ()=>{ NET.say({t:'act', a:'reward', seat:CO.seat, id:c.id, up:c.up});
      sfx('get'); closeModal(); toast(CARDS[c.id].name+' joins your deck'); });
    grid.appendChild(e);
  });
  modal(el('div',{class:'lore-modal wide'},[
    el('h2',{text:'TAKE A CARD'}),
    el('p',{class:'dim center', text:'Your own reward — your ally is picking theirs.'}),
    grid ]),{sticky:true, wide:true});
}

/* ═══════════════  8. HERO SELECT with the reliefs  ═══════════════ */
screenHeroSelect = function(){
  UI.screen='select'; ART.setMood('title');
  const wrap = el('div',{class:'scr select'});
  wrap.appendChild(el('h2',{class:'sh', text:'CHOOSE YOUR CHAMPION'}));
  const row = el('div',{class:'heroes'});
  for(const id of HERO_ORDER()){
    const H = HEROES[id];
    const locked = H.locked && !(SAVE.unlocked[id]);
    const c = el('div',{class:'hero '+(locked?'locked':''), onclick:()=>{ if(locked){ toast(H.unlockHint); return; } chooseKhan(id); }});
    c.appendChild(heroArt(id, 132));
    c.appendChild(el('div',{class:'hname', text:H.name}));
    c.appendChild(el('div',{class:'hfa', text:H.fa}));
    c.appendChild(el('div',{class:'hep', text:H.epithet}));
    c.appendChild(el('div',{class:'hstat', html:`<b>${H.hp}</b> HP · <b>${H.energy}</b> Energy`}));
    c.appendChild(el('div',{class:'hkey', text:H.keyword}));
    c.appendChild(el('div',{class:'hblurb', text:H.blurb}));
    c.appendChild(el('div',{class:'hinv', html:`<span>✦ INVOKE — ${esc(H.invoke.name)}</span><br>${markup(H.invoke.text)}`}));
    if(locked) c.appendChild(el('div',{class:'lock', html:'🔒<br>'+esc(H.unlockHint)}));
    row.appendChild(c);
  }
  wrap.appendChild(row);
  wrap.appendChild(el('button',{class:'btn', onclick:screenTitle},'← back'));
  APP().innerHTML=''; APP().appendChild(wrap);
};
function HERO_ORDER(){ return Object.keys(HEROES); }

/* boss + elite intros get their plate */
bossIntro = function(t){
  const f = FOES[t.boss];
  const box = el('div',{class:'lore-modal boss'});
  box.appendChild(PLATE.node(t.boss, 190, 'foe'));
  box.appendChild(el('h2',{text:f.name}));
  box.appendChild(el('div',{class:'bfa', text:f.fa}));
  box.appendChild(el('p',{text:f.intro}));
  if(f.mech) box.appendChild(el('div',{class:'mech', html:markup(f.mech)}));
  box.appendChild(el('button',{class:'btn gold', onclick:closeModal},'FACE IT'));
  modal(box,{sticky:true}); sfx('boss');
  if(typeof VOICE!=='undefined') VOICE.say(f.name + '. ' + f.intro);
};
eliteIntro = function(d){
  const box = el('div',{class:'lore-modal boss'});
  box.appendChild(PLATE.node(d.id, 160, 'foe'));
  box.appendChild(el('h2',{text:d.name}));
  box.appendChild(el('div',{class:'bfa', text:d.fa}));
  box.appendChild(el('p',{text:d.intro}));
  box.appendChild(el('button',{class:'btn gold', onclick:closeModal},'GOOD'));
  modal(box);
};

/* ═══════════════  9. THE LOBBY  ═══════════════ */
function screenCoop(){
  UI.screen='coop'; ART.setMood('title');
  const wrap = el('div',{class:'scr node-scr lobby'});
  wrap.appendChild(el('h2',{class:'sh', text:'RIDE TOGETHER'}));
  wrap.appendChild(el('p',{class:'dim center', text:'Two riders, one road. Each of you keeps your own deck, your own hand, your own Farr — the enemies are shared, and so is the trouble.'}));
  const row = el('div',{class:'choices'});
  row.appendChild(choiceCard('🛋️','ONE SCREEN','Both of you here, on this machine. Tap between riders. Best for a kitchen table.', ()=>lobbyLocal()));
  row.appendChild(choiceCard('🌍','TWO SCREENS','Different machines, different cities. You get a four‑letter room code to read down the phone.', ()=>lobbyOnline(true)));
  row.appendChild(choiceCard('🔑','JOIN A ROOM','Somebody has already sent you four letters.', ()=>lobbyOnline(false)));
  wrap.appendChild(row);
  wrap.appendChild(el('button',{class:'btn', onclick:screenTitle},'← back'));
  APP().innerHTML=''; APP().appendChild(wrap);
}

function heroPickRow(current, onPick){
  const row = el('div',{class:'heropick'});
  for(const id of HERO_ORDER()){
    const H = HEROES[id];
    if(H.locked && !SAVE.unlocked[id]) continue;
    const c = el('div',{class:'hp1 '+(current===id?'on':''), onclick:()=>onPick(id)});
    c.appendChild(PLATE.node(id, 74, 'hero'));
    c.appendChild(el('span',{text:H.name}));
    row.appendChild(c);
  }
  return row;
}

function lobbyLocal(){
  let a='rostam', b='gord';
  const box = el('div',{class:'lore-modal wide'});
  const render=()=>{
    box.innerHTML='';
    box.appendChild(el('h2',{text:'TWO RIDERS, ONE SCREEN'}));
    box.appendChild(el('div',{class:'rlab', text:'RIDER ONE'}));
    box.appendChild(heroPickRow(a,(h)=>{ a=h; render(); }));
    box.appendChild(el('div',{class:'rlab', text:'RIDER TWO'}));
    box.appendChild(heroPickRow(b,(h)=>{ b=h; render(); }));
    box.appendChild(el('p',{class:'dim center', text:'You will both act in the same turn, in whatever order you like. The enemies move once you have both finished.'}));
    box.appendChild(el('button',{class:'btn gold big', onclick:()=>{
      closeModal();
      CO.beginLocal([{hero:a,name:HEROES[a].name},{hero:b,name:HEROES[b].name}], 1);
      screenMap();
    }},'RIDE OUT ▸'));
    box.appendChild(el('button',{class:'btn', onclick:closeModal},'cancel'));
  };
  render(); modal(box,{wide:true});
}

let _lobbyBox=null, _lobbyHero='rostam';
function lobbyOnline(asHost){
  if(!NET.supported()){ toast('This browser cannot do the network part.'); return; }
  _lobbyBox = el('div',{class:'lore-modal wide lobbybox'});
  _lobbyHero = 'rostam';
  if(asHost){
    modal(_lobbyBox,{sticky:true});
    lobbyRenderHost('…');
    CO.wireNet();
    CO.beginOnlineHost(_lobbyHero, myName(), 1).then(code=>{
      if(!code){ lobbyFail(); return; }
      lobbyRenderHost(code);
    });
  } else {
    lobbyRenderJoinForm();
    modal(_lobbyBox,{sticky:true});
  }
}
function myName(){
  let n = localStorage.getItem('mishanameh.name');
  if(!n){ n = 'Rider'; }
  return n;
}
function setMyName(n){ localStorage.setItem('mishanameh.name', n||'Rider'); }

function lobbyFail(){
  _lobbyBox.innerHTML='';
  _lobbyBox.appendChild(el('h2',{text:'NO ANSWER'}));
  _lobbyBox.appendChild(el('p',{class:'dim center', text:'None of the public relays answered. That is usually a firewall or a captive wifi. One‑screen mode needs no network at all and works right now.'}));
  _lobbyBox.appendChild(el('button',{class:'btn gold', onclick:()=>{ closeModal(); lobbyLocal(); }},'ONE SCREEN INSTEAD'));
  _lobbyBox.appendChild(el('button',{class:'btn', onclick:()=>{ CO.leave(); closeModal(); }},'close'));
}

function lobbyRenderHost(code){
  _lobbyBox.innerHTML='';
  _lobbyBox.appendChild(el('h2',{text:'YOUR ROOM'}));
  _lobbyBox.appendChild(el('div',{class:'roomcode', text:code}));
  _lobbyBox.appendChild(el('p',{class:'dim center', html:'Read those four letters to whoever is riding with you. They choose <b>JOIN A ROOM</b> and type them in.'}));
  const nm = el('input',{class:'nameinput', value:myName(), maxlength:14, placeholder:'your name'});
  nm.addEventListener('input',()=>{ setMyName(nm.value); });
  _lobbyBox.appendChild(nm);
  _lobbyBox.appendChild(el('div',{class:'rlab', text:'YOUR CHAMPION'}));
  _lobbyBox.appendChild(heroPickRow(_lobbyHero,(h)=>{ _lobbyHero=h; CO.setHero(h); lobbyRenderHost(code); }));
  _lobbyBox.appendChild(el('div',{class:'rlab', text:'IN THE ROOM'}));
  _lobbyBox.appendChild(lobbyPeers());
  const go = el('button',{class:'btn gold big', onclick:()=>{
    if(NET.peers().length<1){ toast('Nobody has joined yet.'); return; }
    closeModal();
    if(CO.launchOnline(1)) screenMap();
  }},'RIDE OUT ▸');
  _lobbyBox.appendChild(go);
  _lobbyBox.appendChild(el('button',{class:'btn', onclick:()=>{ CO.leave(); closeModal(); }},'cancel'));
}

function lobbyRenderJoinForm(){
  _lobbyBox.innerHTML='';
  _lobbyBox.appendChild(el('h2',{text:'JOIN A ROOM'}));
  const nm = el('input',{class:'nameinput', value:myName(), maxlength:14, placeholder:'your name'});
  nm.addEventListener('input',()=>setMyName(nm.value));
  _lobbyBox.appendChild(nm);
  const inp = el('input',{class:'codeinput', maxlength:4, placeholder:'CODE', autocapitalize:'characters'});
  inp.addEventListener('input',()=>{ inp.value = NET.cleanCode(inp.value); });
  _lobbyBox.appendChild(inp);
  _lobbyBox.appendChild(el('div',{class:'rlab', text:'YOUR CHAMPION'}));
  _lobbyBox.appendChild(heroPickRow(_lobbyHero,(h)=>{ _lobbyHero=h; lobbyRenderJoinForm(); setTimeout(()=>{ const i=$('.codeinput'); if(i) i.value=inp.value; },0); }));
  _lobbyBox.appendChild(el('button',{class:'btn gold big', onclick:()=>{
    const code = NET.cleanCode(inp.value);
    if(code.length<4){ toast('Four letters.'); return; }
    CO.wireNet();
    lobbyWaiting(code);
    CO.joinOnline(code, _lobbyHero, myName()).then(ok=>{ if(!ok) lobbyFail(); });
  }},'JOIN ▸'));
  _lobbyBox.appendChild(el('button',{class:'btn', onclick:()=>{ CO.leave(); closeModal(); }},'cancel'));
  setTimeout(()=>inp.focus(), 120);
}

function lobbyWaiting(code){
  _lobbyBox.innerHTML='';
  _lobbyBox.appendChild(el('h2',{text:'IN THE ROOM'}));
  _lobbyBox.appendChild(el('div',{class:'roomcode', text:code}));
  _lobbyBox.appendChild(el('p',{class:'dim center', text:'Waiting for the host to ride out. Do not close this.'}));
  _lobbyBox.appendChild(lobbyPeers());
  _lobbyBox.appendChild(el('button',{class:'btn', onclick:()=>{ CO.leave(); closeModal(); }},'leave'));
}

function lobbyPeers(){
  const box = el('div',{class:'peers'});
  const all = [{name:myName()+' (you)', hero:_lobbyHero}].concat(NET.peers().map(p=>({name:p.name, hero:p.hero})));
  all.forEach(p=>{
    const c = el('div',{class:'peer'});
    if(p.hero && HEROES[p.hero]) c.appendChild(PLATE.node(p.hero,44,'hero'));
    c.appendChild(el('span',{text:p.name}));
    box.appendChild(c);
  });
  if(all.length<2) box.appendChild(el('div',{class:'peer waiting', text:'waiting…'}));
  return box;
}

function lobbyRefresh(){
  if(!_lobbyBox || !_lobbyBox.isConnected) return;
  const h2 = _lobbyBox.querySelector('h2');
  if(!h2) return;
  const old = _lobbyBox.querySelector('.peers');
  if(old) old.replaceWith(lobbyPeers());
}

/* ═══════════════  9b. THE RUN BAR  ═══════════════ */
const _runBar = runBar;
runBar = function(){
  const b = _runBar();
  const slot = b.querySelector('.rb-hero');
  if(slot){
    slot.innerHTML = '';
    const c = PLATE.node(R.hero, 30, 'hero'); c.className='rb-plate';
    slot.appendChild(c);
    const nm = (R.party && R.party[R.active] && R.party[R.active].name) || HEROES[R.hero].name;
    slot.appendChild(el('span',{class:'rb-nm', text:nm}));
    slot.appendChild(el('i',{text:'Khān '+['I','II','III','IV','V','VI','VII'][R.khan-1]}));
    if(R.party && R.party.length>1)
      slot.appendChild(el('em',{class:'rb-seat', text:`rider ${R.active+1} of ${R.party.length}`}));
  }
  return b;
};

/* ═══════════════  10. TITLE  ═══════════════ */
const _screenTitle = screenTitle;
screenTitle = function(){
  CO.leave(); unmountChat();
  _screenTitle();
  const btns = $('.tbtns');
  if(btns){
    const co = el('button',{class:'btn', onclick:screenCoop},'👥  RIDE TOGETHER');
    btns.insertBefore(co, btns.children[SAVE.run?2:1] || null);
  }
  netPip();
};

/* keep the map honest about who is steering */
const _screenMap = screenMap;
screenMap = function(){
  _screenMap();
  netPip();
  if(CO.isGuest()){
    const wrap = $('.scr.map');
    if(wrap){
      wrap.classList.add('guest');
      wrap.appendChild(el('div',{class:'guestnote', html:'Your ally is steering the road. You will fight beside them, and you pick your own cards.'}));
      $$('.node').forEach(n=>{ n.classList.add('locked'); n.onclick=null; });
      wrap.appendChild(chatBar());
    }
  }
};

/* host: after a fight, hand the other riders their own reward */
const _rewardScreen = rewardScreen;
rewardScreen = function(){
  if(CO.isOnline() && CO.isHost()) CO.offerRewards();
  _rewardScreen();
};

window.addEventListener('DOMContentLoaded', ()=>{ CO.wireNet(); });

/* ═══════════════  11. SOUND — the score and the storyteller  ═══════════════
   Browsers will not let a page make noise until the person has touched it, so
   the ensemble waits for the first click and then comes in under the title. */
SAVE.music = SAVE.music !== false;
SAVE.voice = SAVE.voice !== false;

let _soundArmed = false;
function armSound(){
  if(_soundArmed) return;
  _soundArmed = true;
  if(typeof MUSIC!=='undefined'){
    MUSIC.setEnabled(SAVE.music);
    if(SAVE.music){ MUSIC.start(); MUSIC.setLevel(UI.screen==='combat'?1:0); }
  }
  if(typeof VOICE!=='undefined') VOICE.setEnabled(SAVE.voice);
}
['pointerdown','keydown'].forEach(ev=>window.addEventListener(ev, armSound, {once:false, passive:true}));

/* the backdrop already knows where we are; let the music follow it */
const _setMood = ART.setMood;
ART.setMood = function(key){
  _setMood.call(ART, key);
  if(typeof MUSIC!=='undefined') MUSIC.setMood(key);
};

/* intensity follows the situation */
const _startNodeCombat = startNodeCombat;
startNodeCombat = function(kind){
  if(typeof MUSIC!=='undefined') MUSIC.setLevel(kind==='boss'?2:kind==='elite'?2:1);
  _startNodeCombat(kind);
};
const _combatOver = combatOver;
combatOver = function(){ if(typeof MUSIC!=='undefined') MUSIC.setLevel(0); _combatOver(); };
const _screenMap2 = screenMap;
screenMap = function(){ if(typeof MUSIC!=='undefined') MUSIC.setLevel(0); _screenMap2(); };

/* INVOKE should part the music for a second */
const _doInvoke2 = doInvoke;
doInvoke = function(){
  const was = G && G.p.farr>=maxFarr();
  if(was && typeof MUSIC!=='undefined') MUSIC.duck(1500);
  _doInvoke2();
};

/* ═══════════════  12. SETTINGS  ═══════════════ */
menuModal = function(){
  const row = (label, get, set) => {
    const b = el('button',{class:'btn', onclick:()=>{ set(!get()); persist(); b.textContent = label(get()); }},
      label(get()));
    return b;
  };
  const box = el('div',{class:'lore-modal'},[
    el('h2',{text:'PAUSED'}),
    el('p',{class:'dim',text:'Your run saves itself — you can close the tab mid‑fight and pick it up here.'}),
    row(v=>v?'🔊 Sound effects ON':'🔇 Sound effects OFF', ()=>!SAVE.mute, v=>{ SAVE.mute=!v; }),
    row(v=>v?'🎼 Music ON':'🎼 Music OFF', ()=>SAVE.music, v=>{ SAVE.music=v;
      if(typeof MUSIC!=='undefined'){ MUSIC.setEnabled(v); if(v) MUSIC.setLevel(UI.screen==='combat'?1:0); } }),
    row(v=>v?'🗣️ Narration ON':'🗣️ Narration OFF', ()=>SAVE.voice, v=>{ SAVE.voice=v;
      if(typeof VOICE!=='undefined') VOICE.setEnabled(v); }),
    el('button',{class:'btn', onclick:()=>{ closeModal(); screenCodex(); }},'📖 The Codex'),
    el('button',{class:'btn', onclick:closeModal},'↩ Back to the road'),
    el('button',{class:'btn danger', onclick:()=>{
      if(confirm('Abandon this run? The road resets.')){ SAVE.run=null; persist(); R=null;
        CO.leave(); unmountChat(); closeModal(); screenTitle(); } }},'✕ Abandon run'),
  ]);
  modal(box);
};

/* ═══════════════  13. NARRATION AT THE RIGHT MOMENTS  ═══════════════ */
const _showIntro = showIntro;
showIntro = function(){
  _showIntro();
  if(typeof VOICE!=='undefined') VOICE.say(
    'Around the year one thousand, a Persian poet named Ferdowsī spent thirty years, and his entire fortune, writing the Shāhnāmeh: the Book of Kings. It is the reason the Persian language survived the century it was written in.');
};
const _screenMap3 = screenMap;
screenMap = function(){
  const before = R ? R.trial : -1;
  _screenMap3();
  if(typeof VOICE!=='undefined' && R && R.step===0){
    const t = trialDef(R.trial);
    VOICE.say(`Trial ${t.roman}. ${t.name}. ${t.text}`);
  }
};
const _victory = victory, _deathScreen = deathScreen;
victory = function(){ if(typeof MUSIC!=='undefined') MUSIC.setLevel(0); _victory();
  if(typeof VOICE!=='undefined') VOICE.say('I have laboured hard these thirty years. I gave the Persians new life with this Persian.'); };
deathScreen = function(){ if(typeof MUSIC!=='undefined') MUSIC.setLevel(0); _deathScreen();
  if(typeof VOICE!=='undefined') VOICE.say('The road ends here.'); };

/* ═══════════════  14. TWO ROADS  ═══════════════ */
let CHOSEN_ROAD = 'haft';

const _newRun = newRun;
newRun = function(h,k){ const out = _newRun(h,k); R.road = CHOSEN_ROAD; return out; };

function screenRoad(){
  UI.screen='road'; ART.setMood('title');
  const wrap = el('div',{class:'scr node-scr roadpick'});
  wrap.appendChild(el('h2',{class:'sh', text:'WHICH ROAD?'}));
  wrap.appendChild(el('p',{class:'dim center', text:'Two campaigns, seven trials each, entirely different bestiaries. Both end somewhere worth getting to.'}));
  const row = el('div',{class:'choices'});
  ['haft','royal'].forEach(id=>{
    const RD = ROADS[id];
    const n = el('div',{class:'node road r-'+id, onclick:()=>{ CHOSEN_ROAD=id; sfx('click'); screenHeroSelect(); }});
    n.appendChild(PLATE.node(RD.trials[RD.trials.length-1].boss, 118, 'foe'));
    n.appendChild(el('div',{class:'nname', text:RD.name}));
    n.appendChild(el('div',{class:'tfa', text:RD.fa}));
    n.appendChild(el('div',{class:'ndesc', text:RD.sub}));
    n.appendChild(el('div',{class:'roadbosses', text: RD.trials.map(t=>t.name).join(' · ')}));
    row.appendChild(n);
  });
  wrap.appendChild(row);
  wrap.appendChild(el('button',{class:'btn', onclick:screenTitle},'← back'));
  APP().innerHTML=''; APP().appendChild(wrap);
}

/* BEGIN and RIDE TOGETHER both go through the road picker first */
const _screenTitle2 = screenTitle;
screenTitle = function(){
  _screenTitle2();
  const btns = $('.tbtns');
  if(btns) [...btns.children].forEach(b=>{
    if(/BEGIN|NEW RUN/.test(b.textContent)) b.onclick = screenRoad;
  });
};

/* the backdrop should know which road it is on */
const _screenMap4 = screenMap;
screenMap = function(){
  _screenMap4();
  if(R && ROADS[R.road||'haft']) ART.setMood(ROADS[R.road||'haft'].mood(R.trial));
};

/* Esther is earned on her own road */
const _afterReward = afterReward;
afterReward = function(isBoss){
  if(isBoss && R && R.road==='royal' && (R.trial+1)>=3 && !SAVE.unlocked.esther){
    SAVE.unlocked.esther = true; persist();
    toast('ESTHER UNLOCKED — the queen at Shushan will ride with you.','big');
  }
  _afterReward(isBoss);
};

/* the lobby's road choice too */
const _lobbyLocal = lobbyLocal;
lobbyLocal = function(){ _lobbyLocal(); };

/* ═══════════════  15. CODEX — the new chapters  ═══════════════ */
(function(){
  const add = (id,label,after)=>{
    if(CX_TABS.some(t=>t.id===id)) return;
    const i = CX_TABS.findIndex(t=>t.id===after);
    CX_TABS.splice(i<0?CX_TABS.length-4:i+1, 0, {id, label});
  };
  add('royal',   'The Royal Road', 'haft');
  add('erasure', 'Not Being Erased', 'royal');
  add('girih',   'The Patterns', 'music');
})();

/* ═══════════════  16. THE BRIDGE — a node that is not a card game  ═══════════════ */
NODE_INFO.bridge = { art:'🌉', name:'THE BRIDGE OF THE SEPARATOR',
  desc:'A walk, not a fight. Cross it and you are met by your own conscience.' };

/* it belongs on the Royal Road; put one somewhere in the back half of a trial */
const _buildTrialMap = buildTrialMap;
buildTrialMap = function(){
  _buildTrialMap();
  if(R && R.road==='royal' && R.trial>=1 && R.map.length>2){
    const row = R.map[1 + Math.floor(rnd()*(R.map.length-2))];
    row[rnd()<0.5?0:1] = 'bridge';
  }
};

const _enterNode = enterNode;
enterNode = function(type){
  if(type==='bridge'){ sfx('click'); screenBridge(); return; }
  _enterNode(type);
};

function screenBridge(){
  UI.screen='node';
  if(typeof MUSIC!=='undefined'){ MUSIC.setMood('t7'); MUSIC.setLevel(1); }
  if(typeof VOICE!=='undefined') VOICE.say(
    'Every soul crosses on the fourth day. Halfway over you meet your own conscience, in the shape of a woman. Whether she is beautiful is not up to her.');
  MINIGAME.chinvat(Math.min(3, R.khan), (res)=>{
    if(typeof MUSIC!=='undefined') MUSIC.setLevel(0);
    let text, extra='';
    if(res.won){
      const heal = 10 + res.deeds*10;
      RunAPI.heal(heal);
      R.gold += 30 + res.deeds*30;
      if(res.deeds>=3){ const n = RunAPI.giveTalisman('rare');
        extra = `\n\nShe is not a stranger. She says: *I am your own good thoughts, your own good words, your own good deeds.* She gives you ${n}.`; }
      else if(res.deeds>0) extra = `\n\nYou carried ${res.caught.join(' and ')} across.`;
      text = `The bridge holds. It widens as you go — nine spear‑lengths at the far side — and someone is waiting who has your face and is glad to see you.\n\n+${heal} HP, +${30+res.deeds*30} dirhams.` + extra;
      sfx('secret');
    } else {
      const hurt = Math.max(6, Math.round(R.maxHp*0.12) - res.deeds*3);
      RunAPI.damage(hurt);
      text = `It turns edge‑on under you — thin as a razor, exactly as promised — and the crossing ends early.\n\nYou are pulled back to this side by something you do not look at directly. −${hurt} HP.`;
    }
    showOutcome(text);
  });
}
