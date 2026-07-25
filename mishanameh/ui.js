/* MISHANAMEH — screens, rendering, input */

const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
function el(tag, props={}, kids=[]){
  const n = document.createElement(tag);
  for(const k in props){
    if(k==='class') n.className = props[k];
    else if(k==='html') n.innerHTML = props[k];
    else if(k==='text') n.textContent = props[k];
    else if(k.startsWith('on')) n.addEventListener(k.slice(2).toLowerCase(), props[k]);
    else if(k==='style') n.setAttribute('style', props[k]);
    else n.setAttribute(k, props[k]);
  }
  (Array.isArray(kids)?kids:[kids]).forEach(c=>{ if(c==null) return; n.appendChild(typeof c==='string'?document.createTextNode(c):c); });
  return n;
}
const APP = ()=>$('#app');
const esc = (s)=>String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const UI = {
  screen:'title', targeting:null, choiceQ:[], afterChoice:null, tipEl:null,
};

/* ═══════════  TOAST / TOOLTIP  ═══════════ */
let toastT;
function toast(msg, cls=''){
  const t = $('#toast'); t.textContent = msg; t.className = 'toast show '+cls;
  clearTimeout(toastT); toastT = setTimeout(()=>t.className='toast', 1900);
}
function tip(html, x, y){
  const t = $('#tip'); t.innerHTML = html; t.classList.add('show');
  const w = t.offsetWidth, h = t.offsetHeight;
  t.style.left = Math.max(8, Math.min(window.innerWidth-w-8, x-w/2))+'px';
  t.style.top  = Math.max(8, y-h-14)+'px';
}
function untip(){ $('#tip').classList.remove('show'); }

/* ═══════════  MODAL  ═══════════ */
function modal(node, opts={}){
  const root = $('#modal');
  const box = el('div',{class:'mbox '+(opts.wide?'wide':'')},[node]);
  const back = el('div',{class:'mback', onclick:(e)=>{ if(e.target===back && !opts.sticky) closeModal(); }},[box]);
  root.innerHTML=''; root.appendChild(back);
  requestAnimationFrame(()=>back.classList.add('in'));
  return back;
}
function closeModal(){ const r=$('#modal'); const b=r.firstChild; if(b){ b.classList.remove('in'); setTimeout(()=>{ if(r.firstChild===b) r.innerHTML=''; },180); } }

/* ═══════════  CARD ELEMENT  ═══════════ */
function cardEl(c, opts={}){
  const d = CARDS[c.id];
  const cost = cardCost(c);
  const n = el('div',{class:`card t-${d.type} r-${d.rarity} ${c.up?'up':''} ${opts.mini?'mini':''}`, 'data-uid':c.uid||''});
  n.appendChild(el('div',{class:'cost', text: cost<0 ? '—' : cost}));
  n.appendChild(el('div',{class:'cname', text: cardName(c)}));
  n.appendChild(el('div',{class:'cfa', text: d.fa||''}));
  n.appendChild(el('div',{class:'cline'}));
  n.appendChild(el('div',{class:'ctext', html: markup(cardText(c))}));
  if(d.flavor && !opts.mini) n.appendChild(el('div',{class:'cflav', text:d.flavor}));
  n.appendChild(el('div',{class:'ctype', text:(d.type==='status'||d.type==='curse')?d.type.toUpperCase():d.type.toUpperCase()}));
  return n;
}
function markup(s){
  return esc(s)
    .replace(/\b(\d+)\b/g,'<b>$1</b>')
    .replace(/(Block|Strength|Agility|Weak|Frail|Vulnerable|Venom|Ember|Regen|Ward|Companion|Farr|Energy|Exhaust|Stun|Retained|Invoke|Invoking)/g,'<u>$1</u>');
}

/* ═══════════  TITLE  ═══════════ */
function screenTitle(){
  UI.screen='title';
  ART.setMood('title');
  const hasRun = !!SAVE.run;
  const wrap = el('div',{class:'scr title'});
  wrap.appendChild(el('div',{class:'orn top'}));
  wrap.appendChild(el('h1',{class:'logo', html:'MISHA<span>NAMEH</span>'}));
  wrap.appendChild(el('div',{class:'logo-fa', text:'میشانامه'}));
  wrap.appendChild(el('div',{class:'tagline', text:'THE BOOK OF MISHA — a deck‑builder through the Seven Trials of Rostam'}));

  const btns = el('div',{class:'tbtns'});
  if(hasRun) btns.appendChild(el('button',{class:'btn gold big', onclick:continueRun},'⟳  CONTINUE THE ROAD'));
  btns.appendChild(el('button',{class:hasRun?'btn':'btn gold big', onclick:screenHeroSelect}, hasRun?'✦  NEW RUN':'✦  BEGIN'));
  btns.appendChild(el('button',{class:'btn', onclick:()=>screenCodex()},'📖  THE CODEX'));
  btns.appendChild(el('button',{class:'btn', onclick:screenStats},'🏺  RECORDS'));
  wrap.appendChild(btns);

  const s = SAVE.stats;
  wrap.appendChild(el('div',{class:'tstats', html:
    `${s.wins} victor${s.wins===1?'y':'ies'} · ${s.runs} run${s.runs===1?'':'s'} · furthest: Trial ${['—','I','II','III','IV','V','VI','VII','VIII'][Math.min(8,s.bestTrial)]}` +
    (SAVE.khanMax>1?` · Khān ${SAVE.khanMax} unlocked`:'') }));
  wrap.appendChild(el('div',{class:'orn bot'}));
  wrap.appendChild(el('div',{class:'foot', html:
    'Cabinet no. 4 at <a href="../">Misha’s Midnight Arcade 🕹️</a> · built for Misha & David'}));
  APP().innerHTML=''; APP().appendChild(wrap);
  if(!SAVE.seenIntro){ SAVE.seenIntro=true; persist(); setTimeout(showIntro, 500); }
}

function showIntro(){
  const b = el('div',{class:'lore-modal'},[
    el('h2',{text:'WHAT THIS IS'}),
    el('p',{html:`Around the year 1000, a Persian poet named <b>Ferdowsī</b> spent thirty years and his entire fortune writing the <b>Shāhnāmeh</b> — the “Book of Kings.” Roughly fifty thousand couplets. It is the longest epic ever written by one person, and it is the reason the Persian language survived the century it was written in.`}),
    el('p',{html:`Its greatest hero is <b>Rostam</b>, and the most famous thing Rostam does is the <b>Haft Khān</b> — the Seven Trials. A lion, a desert, a dragon, a sorceress, a captain, a demon, and finally the White Demon in the dark.`}),
    el('p',{html:`This game is those seven trials, as a deck‑builder. Everything in it — every card name, every monster, every event — is real Persian myth, and the <b>Codex</b> will tell you exactly which bit and why.`}),
    el('p',{class:'dim', html:`(And because Tolkien was drinking from the same very old well, a few things here will look oddly familiar. That is on purpose. There is a road you are not told about.)`}),
    el('button',{class:'btn gold', onclick:closeModal},'GOOD'),
  ]);
  modal(b);
}

/* ═══════════  HERO SELECT  ═══════════ */
function screenHeroSelect(){
  UI.screen='select'; ART.setMood('title');
  const wrap = el('div',{class:'scr select'});
  wrap.appendChild(el('h2',{class:'sh', text:'CHOOSE YOUR CHAMPION'}));
  const row = el('div',{class:'heroes'});
  for(const id of ['rostam','gord','zal']){
    const H = HEROES[id];
    const locked = H.locked && !SAVE.unlocked.zal;
    const c = el('div',{class:'hero '+(locked?'locked':''), onclick:()=>{ if(locked){ toast(H.unlockHint); return; } chooseKhan(id); }});
    c.appendChild(el('div',{class:'hart', text:H.art}));
    c.appendChild(el('div',{class:'hname', text:H.name}));
    c.appendChild(el('div',{class:'hfa', text:H.fa}));
    c.appendChild(el('div',{class:'hep', text:H.epithet}));
    c.appendChild(el('div',{class:'hstat', html:`<b>${H.hp}</b> HP · <b>${H.energy}</b> Energy`}));
    c.appendChild(el('div',{class:'hkey', text:H.keyword}));
    c.appendChild(el('div',{class:'hblurb', text:H.blurb}));
    c.appendChild(el('div',{class:'hinv', html:`<span>✦ INVOKE — ${H.invoke.name}</span><br>${esc(H.invoke.text)}`}));
    if(locked) c.appendChild(el('div',{class:'lock', html:'🔒<br>'+esc(H.unlockHint)}));
    row.appendChild(c);
  }
  wrap.appendChild(row);
  wrap.appendChild(el('button',{class:'btn', onclick:screenTitle},'← back'));
  APP().innerHTML=''; APP().appendChild(wrap);
}

function chooseKhan(heroId){
  if(SAVE.khanMax<=1){ startRun(heroId,1); return; }
  const box = el('div',{class:'lore-modal'},[el('h2',{text:'WHICH KHĀN?'}),
    el('p',{class:'dim',text:'Each Khān makes the road longer and the enemies heavier. Clear one to unlock the next.'})]);
  const g = el('div',{class:'khans'});
  for(let k=1;k<=SAVE.khanMax;k++){
    g.appendChild(el('button',{class:'btn khan'+(k===SAVE.khanMax?' gold':''), onclick:()=>{ closeModal(); startRun(heroId,k); }},
      `KHĀN ${['I','II','III','IV','V','VI','VII'][k-1]}`));
  }
  box.appendChild(g);
  box.appendChild(el('div',{class:'dim small', html:KHAN_NOTES}));
  modal(box);
}
const KHAN_NOTES = `Every Khān adds about <b>10%</b> to every enemy's health.<br>III — you start with 6 less HP.<br>V — 6 less again, and you start poor.`;

function startRun(heroId, khan){
  newRun(heroId, khan);
  saveRun(false);
  screenMap();
}
function continueRun(){
  const where = restoreRun();
  if(where==='combat'){ UI.screen='combat'; renderCombat(); }
  else screenMap();
}

/* ═══════════  RUN BAR  ═══════════ */
function runBar(){
  const b = el('div',{class:'runbar'});
  const H = HEROES[R.hero];
  const hpPct = Math.max(0, R.hp/R.maxHp*100);
  b.appendChild(el('div',{class:'rb-hero', html:`<span>${H.art}</span> ${H.name}<i>Khān ${['I','II','III','IV','V','VI','VII'][R.khan-1]}</i>`}));
  b.appendChild(el('div',{class:'rb-hp', html:`<div class="hpbar"><div style="width:${hpPct}%"></div><span>${R.hp} / ${R.maxHp}</span></div>`}));
  b.appendChild(el('div',{class:'rb-gold', text:`🪙 ${R.gold}`}));
  const tals = el('div',{class:'rb-tals'});
  R.talismans.forEach(id=>{
    const t = TALISMANS[id];
    tals.appendChild(el('span',{class:'tal '+(t.glow?'glow':''), text:t.art,
      onmouseenter:(e)=>tip(`<b>${esc(t.name)}</b> <i>${esc(t.fa)}</i><br>${esc(t.text)}`, e.clientX, e.clientY),
      onmouseleave:untip, onclick:(e)=>tip(`<b>${esc(t.name)}</b> <i>${esc(t.fa)}</i><br>${esc(t.text)}`, e.clientX, e.clientY)}));
  });
  b.appendChild(tals);
  b.appendChild(el('button',{class:'rb-btn', onclick:()=>showDeck(R.deck,'YOUR DECK')},`🂠 ${R.deck.length}`));
  b.appendChild(el('button',{class:'rb-btn', onclick:()=>screenCodex()},'📖'));
  b.appendChild(el('button',{class:'rb-btn', onclick:menuModal},'☰'));
  return b;
}

function menuModal(){
  const box = el('div',{class:'lore-modal'},[
    el('h2',{text:'PAUSED'}),
    el('p',{class:'dim',text:'Your run is saved automatically — you can close the tab mid‑fight and pick it up here.'}),
    el('button',{class:'btn', onclick:()=>{ SAVE.mute=!SAVE.mute; persist(); closeModal(); toast(SAVE.mute?'Sound off':'Sound on'); }}, SAVE.mute?'🔇 Sound is OFF':'🔊 Sound is ON'),
    el('button',{class:'btn', onclick:()=>{ closeModal(); screenCodex(); }},'📖 The Codex'),
    el('button',{class:'btn', onclick:closeModal},'↩ Back to the road'),
    el('button',{class:'btn danger', onclick:()=>{ if(confirm('Abandon this run? The road resets.')){ SAVE.run=null; persist(); R=null; closeModal(); screenTitle(); } }},'✕ Abandon run'),
  ]);
  modal(box);
}

/* ═══════════  MAP  ═══════════ */
function screenMap(){
  UI.screen='map';
  ART.setMood('t'+Math.min(8, R.trial+1));
  saveRun(false);
  const t = trialDef(R.trial);
  const wrap = el('div',{class:'scr map'});
  wrap.appendChild(runBar());

  const head = el('div',{class:'trialhead '+(R.trial>=7?'secret':'')});
  head.appendChild(el('div',{class:'tnum', text:'TRIAL '+t.roman}));
  head.appendChild(el('h2',{class:'tname', text:t.name}));
  head.appendChild(el('div',{class:'tfa', text:t.fa}));
  head.appendChild(el('div',{class:'tsub', text:t.sub}));
  head.appendChild(el('p',{class:'ttext', text:t.text}));
  wrap.appendChild(head);

  const prog = el('div',{class:'prog'});
  for(let i=0;i<R.map.length;i++) prog.appendChild(el('span',{class:'pd '+(i<R.step?'done':i===R.step?'now':'')}));
  wrap.appendChild(prog);

  const row = R.map[R.step] || ['boss'];
  const nodes = el('div',{class:'nodes'});
  row.forEach((type,i)=>{
    const info = NODE_INFO[type];
    const n = el('div',{class:'node n-'+type, onclick:()=>enterNode(type)});
    n.appendChild(el('div',{class:'nart', text:type==='boss'?FOES[t.boss].art:info.art}));
    n.appendChild(el('div',{class:'nname', text:type==='boss'?FOES[t.boss].name:info.name}));
    n.appendChild(el('div',{class:'ndesc', text:type==='boss'?t.sub:info.desc}));
    nodes.appendChild(n);
  });
  wrap.appendChild(nodes);
  APP().innerHTML=''; APP().appendChild(wrap);
}

const NODE_INFO = {
  battle:{art:'⚔️', name:'A FIGHT ON THE ROAD', desc:'Something is in the way. Card and coin if you win.'},
  elite:{art:'💀', name:'SOMETHING WORSE', desc:'A hard fight. It is carrying a talisman.'},
  camp:{art:'🔥', name:'A CAMP', desc:'Rest and heal, or work at the fire and sharpen a card.'},
  bazaar:{art:'🏺', name:'A BAZAAR', desc:'Cards, talismans, and someone who will burn a card out of your deck.'},
  omen:{art:'🜲', name:'AN OMEN', desc:'A choice. Some of them are traps and some of them are gifts.'},
  boss:{art:'👑', name:'THE TRIAL', desc:'The trial itself.'},
};

function enterNode(type){
  sfx('click');
  if(type==='battle'||type==='elite'||type==='boss') startNodeCombat(type);
  else if(type==='camp') screenCamp();
  else if(type==='bazaar') screenBazaar();
  else if(type==='omen') screenOmen();
}

function advance(){
  R.step++;
  saveRun(false);
  screenMap();
}

/* ═══════════  COMBAT SETUP  ═══════════ */
function startNodeCombat(kind){
  const t = trialDef(R.trial);
  let foes;
  if(kind==='boss'){ foes = [t.boss].concat(FOES[t.boss].minions||[]); }
  else if(kind==='elite'){ foes = [pick(ENCOUNTERS.elite[t.tier])]; }
  else { foes = pick(ENCOUNTERS[t.tier]).slice(); }
  startCombat(kind, foes);
  UI.screen='combat';
  saveRun(true);
  renderCombat();
  if(kind==='boss'){ setTimeout(()=>bossIntro(t), 260); }
  else if(kind==='elite'){ const d=FOES[foes[0]]; if(d.intro) setTimeout(()=>eliteIntro(d), 260); }
}
function bossIntro(t){
  const f = FOES[t.boss];
  const box = el('div',{class:'lore-modal boss'},[
    el('div',{class:'bart', text:f.art}),
    el('h2',{text:f.name}), el('div',{class:'bfa', text:f.fa}),
    el('p',{text:f.intro}),
    f.mech? el('div',{class:'mech', text:f.mech}) : null,
    el('button',{class:'btn gold', onclick:closeModal},'FACE IT'),
  ]);
  modal(box,{sticky:true}); sfx('boss');
}
function eliteIntro(d){
  const box = el('div',{class:'lore-modal boss'},[
    el('div',{class:'bart', text:d.art}), el('h2',{text:d.name}), el('div',{class:'bfa', text:d.fa}),
    el('p',{text:d.intro}), el('button',{class:'btn gold', onclick:closeModal},'GOOD'),
  ]);
  modal(box);
}

/* ═══════════  COMBAT RENDER  ═══════════ */
function renderCombat(){
  const wrap = el('div',{class:'scr combat'});
  wrap.appendChild(runBar());
  wrap.appendChild(el('div',{class:'foes', id:'foes'}));
  wrap.appendChild(el('div',{class:'mid', id:'mid'}));
  wrap.appendChild(el('div',{class:'handzone'},[
    el('div',{class:'piles left'},[
      el('button',{class:'pile', id:'drawPile', onclick:()=>showDeck(G.draw,'DRAW PILE (shuffled)',true)}),
      el('button',{class:'pile', id:'exhPile', onclick:()=>showDeck(G.exhaust,'EXHAUSTED')}),
    ]),
    el('div',{class:'hand', id:'hand'}),
    el('div',{class:'piles right'},[
      el('button',{class:'endturn', id:'endTurn', html:'END<br>TURN', onclick:doEndTurn}),
      el('button',{class:'pile', id:'discPile', onclick:()=>showDeck(G.discard,'DISCARD PILE')}),
    ]),
  ]));
  APP().innerHTML=''; APP().appendChild(wrap);
  paint();
}

function paint(){
  if(UI.screen!=='combat' || !G) return;
  paintFoes(); paintMid(); paintHand(); paintPiles();
  flushAnims();
  const hpb = $('.rb-hp .hpbar');
  if(hpb){ hpb.firstChild.style.width = Math.max(0,G.p.hp/G.p.maxHp*100)+'%'; hpb.lastChild.textContent = `${Math.max(0,G.p.hp)} / ${G.p.maxHp}`; }
}

function buffChips(buffs, forPlayer){
  const wrap = el('div',{class:'buffs'});
  for(const k in buffs){
    const v = buffs[k]; if(!v || k==='whetN' || k==='firstTurnEnergy') continue;
    const info = BUFF_INFO[k]; if(!info) continue;
    const bad = ['weak','frail','vuln','venom','ember','stun','drowsy','tempstr'].includes(k);
    const show = (k==='constellation'||k==='barricade'||k==='halfguard'||k==='farrguard') ? '' : v;
    wrap.appendChild(el('span',{class:'chip '+(bad?'bad':'good'),
      html:`${info.i}${show!==''?'<b>'+show+'</b>':''}`,
      onmouseenter:(e)=>tip(`<b>${info.n}</b> ${show!==''?show:''}<br>${info.d}`, e.clientX, e.clientY),
      onmouseleave:untip,
      onclick:(e)=>tip(`<b>${info.n}</b> ${show!==''?show:''}<br>${info.d}`, e.clientX, e.clientY)}));
  }
  return wrap;
}

function paintFoes(){
  const host = $('#foes'); if(!host) return;
  host.innerHTML='';
  G.foes.forEach((f,i)=>{
    if(f.hp<=0){ host.appendChild(el('div',{class:'foe dead'},[el('div',{class:'fart', text:'✕'})])); return; }
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
    intent.title = it.n + (it.txt?' — '+it.txt:'');
    intent.addEventListener('mouseenter',(e)=>tip(`<b>${esc(it.n)}</b><br>${esc(it.txt|| (it.k==='attack'?`Attacks for ${it.dmg}${it.hits>1?' ×'+it.hits:''}`:it.k==='block'?`Gains ${it.blk} Block`:''))}`+
      (mod('foresight')?`<br><span class="dim">then: ${esc(nextIntentOf(f))}</span>`:''), e.clientX, e.clientY));
    intent.addEventListener('mouseleave', untip);
    n.appendChild(intent);
    n.appendChild(el('div',{class:'fart', text:f.art}));
    n.appendChild(el('div',{class:'fname', text:f.name}));
    const bar = el('div',{class:'fhp'},[el('div',{class:'fhpf', style:`width:${Math.max(0,f.hp/f.maxHp*100)}%`}), el('span',{text:`${f.hp}/${f.maxHp}`})]);
    n.appendChild(bar);
    if(f.block>0) n.appendChild(el('div',{class:'fblock', html:`🛡️<b>${f.block}</b>`}));
    n.appendChild(buffChips(f.buffs,false));
    host.appendChild(n);
  });
}

function paintMid(){
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
  inv.addEventListener('mouseenter',(e)=>tip(`<b>${esc(HEROES[R.hero].invoke.name)}</b> <i>${esc(HEROES[R.hero].invoke.fa)}</i><br>${esc(HEROES[R.hero].invoke.text)}<br><span class="dim">Fill the halo to ${mf} Farr and the Simurgh answers. It can be filled again.</span>`, e.clientX, e.clientY));
  inv.addEventListener('mouseleave', untip);
  farr.appendChild(inv);
  host.appendChild(farr);

  const pl = el('div',{class:'playerbox'});
  pl.appendChild(el('div',{class:'energy', html:`<b>${G.p.energy}</b><span>ENERGY</span>`}));
  const blk = el('div',{class:'blockpip '+(G.p.block>0?'on':'')});
  blk.innerHTML = `🛡️<b>${G.p.block}</b>`;
  pl.appendChild(blk);
  pl.appendChild(buffChips(G.p.buffs,true));
  host.appendChild(pl);
}

function paintHand(){
  const host = $('#hand'); if(!host) return;
  host.innerHTML='';
  const n = G.hand.length;
  const maxOff = (n-1)/2;
  const stepDeg = Math.min(2.8, 15/Math.max(1,n));   // fan angle per card
  const lift    = Math.min(15, 62/Math.max(1,n));    // arc height, centre highest
  // overlap only as much as the track actually demands, so text stays readable
  const cardW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-w')) || 136;
  const avail = Math.max(240, host.clientWidth - 8);
  const overlap = n<2 ? 0 : Math.max(4, Math.min(46, (n*cardW - avail)/(n-1) + 6));
  G.hand.forEach((c,i)=>{
    const e = cardEl(c);
    const playable = canPlay(c) && !G.pending && !G.over;
    e.className += playable? ' playable' : ' unplayable';
    const off = i - maxOff;
    // edges sit at y=0 so the fan can never spill out of the hand track
    const y = (Math.abs(off) - maxOff) * lift * 0.5;
    e.style.margin = `0 -${overlap/2}px`;
    e.style.zIndex = 10 + i;
    e.style.transform = `rotate(${(off*stepDeg).toFixed(2)}deg) translateY(${y.toFixed(1)}px)`;
    let downX=0, downY=0, moved=false;
    e.addEventListener('pointerdown', (ev)=>{ downX=ev.clientX; downY=ev.clientY; moved=false; });
    e.addEventListener('pointermove', (ev)=>{ if(Math.abs(ev.clientX-downX)>9 || Math.abs(ev.clientY-downY)>9) moved=true; });
    e.addEventListener('click', ()=>{ if(moved){ moved=false; return; } onCardClick(c); });
    e.addEventListener('mouseenter', ()=>{ e.classList.add('hov'); });
    e.addEventListener('mouseleave', ()=>{ e.classList.remove('hov','tilt'); e.style.removeProperty('--rx'); e.style.removeProperty('--ry'); });
    if(!ART.reduced) e.addEventListener('mousemove', (ev)=>{
      const r = e.getBoundingClientRect();
      const px = (ev.clientX - r.left)/r.width - .5, py = (ev.clientY - r.top)/r.height - .5;
      e.classList.add('tilt');
      e.style.setProperty('--rx', (-py*13).toFixed(2)+'deg');
      e.style.setProperty('--ry', (px*15).toFixed(2)+'deg');
      e.style.setProperty('--gx', ((px+.5)*100).toFixed(1)+'%');
      e.style.setProperty('--gy', ((py+.5)*100).toFixed(1)+'%');
    });
    if(UI.choiceMode) e.className += ' choosable';
    host.appendChild(e);
  });
}

function paintPiles(){
  const d=$('#drawPile'), x=$('#exhPile'), s=$('#discPile');
  if(d) d.innerHTML = `<b>${G.draw.length}</b><span>draw</span>`;
  if(x) x.innerHTML = `<b>${G.exhaust.length}</b><span>burnt</span>`;
  if(s) s.innerHTML = `<b>${G.discard.length}</b><span>discard</span>`;
  const et = $('#endTurn'); if(et) et.disabled = (G.over||G.pending)?'disabled':null;
}

/* ═══════════  COMBAT INPUT  ═══════════ */
function onCardClick(c){
  if(G.over) return;
  if(UI.choiceMode){ UI.choiceMode(c); return; }
  if(G.pending) return;
  if(!canPlay(c)){
    const d=CARDS[c.id];
    if(d.unplayable) toast(d.type==='curse'?'A curse. It just sits there.':'Unplayable.');
    else if(d.playable && !d.playable(G.api)) toast('Not enough Farr.');
    else toast('Not enough Energy.');
    sfx('nope'); return;
  }
  const d = CARDS[c.id];
  const alive = G.foes.filter(f=>f.hp>0);
  if(d.targeted && alive.length>1){
    UI.targeting = c; toast('Choose a target'); paintFoes();
    return;
  }
  doPlay(c, alive[0]);
}
function resolveTarget(f){ const c = UI.targeting; UI.targeting=null; if(c) doPlay(c,f); }

function doPlay(c, target){
  const d = CARDS[c.id];
  sfx(d.type==='attack'?'atk':d.type==='power'?'power':'skill');
  playCard(c, target);
  handlePending();
  paint();
  saveRun(true);
  if(G.over) setTimeout(combatOver, 620);
}

function doInvoke(){
  if(G.p.farr<maxFarr() || G.over || G.pending) return;
  sfx('invoke');
  document.body.classList.add('flash'); setTimeout(()=>document.body.classList.remove('flash'), 700);
  const bird = el('div',{class:'simurgh', html:ART.simurgh(Math.min(420, window.innerWidth*0.72))});
  document.body.appendChild(bird); setTimeout(()=>bird.remove(), 1600);
  ART.feathers(20);
  ART.burst(window.innerWidth/2, window.innerHeight*0.4, {n:34, spread:210, lift:40,
    colors:['#fff6d8','#e0a92e','#5fd0cc','#c9412b']});
  invoke(); paint(); saveRun(true);
  if(G.over) setTimeout(combatOver, 900);
}

function doEndTurn(){
  if(G.over || G.pending) return;
  UI.targeting=null;
  sfx('turn');
  endTurn();
  paint(); saveRun(true);
  if(G.over) setTimeout(combatOver, 620);
}

/* pending in-combat choices (discard / upgrade) */
function handlePending(){
  if(!G.pending) return;
  const p = G.pending;
  if(p.kind==='discard'){
    let left = p.n;
    toast(`Discard ${left} card${left>1?'s':''}`);
    UI.choiceMode = (c)=>{
      const i = G.hand.indexOf(c); if(i<0) return;
      G.hand.splice(i,1); G.discard.push(c); left--;
      if(left<=0){ UI.choiceMode=null; G.pending=null; }
      paint();
    };
  } else if(p.kind==='upgradeCombat'){
    toast('Choose a card to sharpen');
    UI.choiceMode = (c)=>{
      if(c.up || CARDS[c.id].cost<0){ toast('Not that one.'); return; }
      c.up = true; UI.choiceMode=null; G.pending=null; sfx('forge'); paint();
    };
  }
  paint();
}

/* ═══════════  COMBAT END  ═══════════ */
function combatOver(){
  if(G.won){ sfx('win'); finishCombat(); rewardScreen(); }
  else { sfx('lose'); deathScreen(); }
}

function rewardScreen(){
  UI.screen='reward';
  const kind = G.kind;
  const t = trialDef(R.trial);
  const isBoss = kind==='boss';
  if(isBoss){
    R.cleared++;
    SAVE.stats.bestTrial = Math.max(SAVE.stats.bestTrial, R.trial+1);
    if(R.trial+1>=5) { if(!SAVE.unlocked.zal){ SAVE.unlocked.zal=true; toast('ZĀL UNLOCKED — the white‑haired one will ride with you.'); } }
    talHook('trialEnd', RunAPI);
    persist();
  }
  const gold = isBoss? ri(95,130) : kind==='elite'? ri(58,88) : ri(24,46);
  R.gold += gold;

  const wrap = el('div',{class:'scr reward'});
  wrap.appendChild(runBar());
  wrap.appendChild(el('h2',{class:'sh', text: isBoss? `TRIAL ${t.roman} — CLEARED` : 'THE ROAD IS CLEAR'}));
  if(isBoss) wrap.appendChild(el('p',{class:'dim center', text: t.text.split('\n')[0]}));
  wrap.appendChild(el('div',{class:'goldline', text:`🪙 +${gold} dirhams`}));

  const pending = [];
  if(isBoss) pending.push('bosstal');
  if(kind==='elite') pending.push('tal');
  pending.push('card');

  const zone = el('div',{class:'rewardzone'});
  wrap.appendChild(zone);
  APP().innerHTML=''; APP().appendChild(wrap);
  nextReward(pending, zone, wrap, isBoss);
}

function nextReward(queue, zone, wrap, isBoss){
  zone.innerHTML='';
  if(!queue.length){
    const b = el('button',{class:'btn gold big', onclick:()=>afterReward(isBoss)}, isBoss? (R.trial>=(R.secret?7:6) ? 'ONWARD ▸' : 'THE NEXT TRIAL ▸') : 'BACK TO THE ROAD ▸');
    zone.appendChild(b); return;
  }
  const step = queue.shift();
  if(step==='card'){
    zone.appendChild(el('div',{class:'rlab', text:'TAKE A CARD'}));
    const n = 3 + mod('rewardCards');
    const opts = cardRewards(n, isBoss?'boss':G.kind);
    const row = el('div',{class:'cardrow'});
    opts.forEach(c=>{
      const e = cardEl(c);
      e.addEventListener('click', ()=>{ R.deck.push(c); sfx('get'); toast(`${cardName(c)} joins the deck`); nextReward(queue,zone,wrap,isBoss); });
      row.appendChild(e);
    });
    zone.appendChild(row);
    zone.appendChild(el('button',{class:'btn', onclick:()=>nextReward(queue,zone,wrap,isBoss)},'skip'));
  } else if(step==='tal'){
    zone.appendChild(el('div',{class:'rlab', text:'IT WAS CARRYING SOMETHING'}));
    const name = grantTalisman(rnd()<0.3?'rare':'uncommon');
    const id = R.talismans[R.talismans.length-1]; const tt = TALISMANS[id];
    zone.appendChild(talismanCard(tt));
    zone.appendChild(el('button',{class:'btn gold', onclick:()=>nextReward(queue,zone,wrap,isBoss)},'TAKE IT'));
  } else if(step==='bosstal'){
    zone.appendChild(el('div',{class:'rlab', text:'THE TRIAL LEAVES YOU SOMETHING'}));
    const avail = BOSS_TALISMANS.filter(id=>!R.talismans.includes(id));
    const two = shuffleIn(avail.slice()).slice(0,2).map(id=>TALISMANS[id]);
    const row = el('div',{class:'talrow'});
    (two.length?two:[TALISMANS[pick(BOSS_TALISMANS)]]).forEach(tt=>{
      const c = talismanCard(tt);
      c.classList.add('pick');
      c.addEventListener('click', ()=>{ grantTalismanById(tt.id); sfx('get'); nextReward(queue,zone,wrap,isBoss); });
      row.appendChild(c);
    });
    zone.appendChild(row);
  }
}

function talismanCard(t){
  return el('div',{class:'talcard r-'+t.rarity},[
    el('div',{class:'tart', text:t.art}),
    el('div',{class:'tname', text:t.name}),
    el('div',{class:'tfa2', text:t.fa}),
    el('div',{class:'ttext', html:markup(t.text)}),
    el('div',{class:'trar', text:t.rarity}),
  ]);
}

function cardRewards(n, kind){
  const pool = poolFor(R.hero);
  const w = kind==='boss'? {common:20,uncommon:45,rare:35} : kind==='elite'? {common:45,uncommon:40,rare:15} : {common:62,uncommon:31,rare:7};
  const out=[]; const used=new Set();
  let guard=0;
  while(out.length<n && guard++<200){
    const roll = rnd()*100; const rar = roll<w.common?'common':roll<w.common+w.uncommon?'uncommon':'rare';
    const cands = pool.filter(c=>c.rarity===rar && !used.has(c.id));
    if(!cands.length) continue;
    const c = pick(cands); used.add(c.id); out.push(inst(c.id));
  }
  return out;
}

function afterReward(isBoss){
  if(!isBoss){ advance(); return; }
  // trial complete
  R.hp = Math.min(R.maxHp, R.hp + Math.round(R.maxHp*0.18));
  const last = R.secret ? 8 : 7;
  R.trial++;
  if(R.trial>=7 && !R.secret && hasTal('hilt')){
    R.secret = true; SAVE.stats.secretSeen=true; persist();
    secretGate(); return;
  }
  if(R.trial>=last){ victory(); return; }
  buildTrialMap(); saveRun(false); screenMap();
}

function secretGate(){
  const box = el('div',{class:'lore-modal secret'},[
    el('div',{class:'bart', text:'🗡️'}),
    el('h2',{text:'THE HILT GOES WARM'}),
    el('p',{html:`The White Demon is dead. The road should end here — Ferdowsī wrote seven trials and no more.<br><br>But the broken hilt in your pack has gone warm, and there is a gate in the rock that was not in the rock an hour ago, and beyond it a plain of grey ash under a sky the colour of an old bruise.<br><br>Somebody has been walking this road a very long time, in a story further west than yours, and left it open on their way through.`}),
    el('div',{class:'mech', text:'TRIAL VIII — THE GREY ROAD. Not in the book. Considerably worse than the book.'}),
    el('button',{class:'btn gold', onclick:()=>{ closeModal(); buildTrialMap(); saveRun(false); screenMap(); }},'GO ON'),
    el('button',{class:'btn', onclick:()=>{ closeModal(); R.secret=false; R.trial=8; victory(); }},'Go home instead'),
  ]);
  modal(box,{sticky:true}); sfx('secret');
}

/* ═══════════  CAMP / BAZAAR / OMEN  ═══════════ */
function screenCamp(){
  UI.screen='node';
  const wrap = el('div',{class:'scr node-scr'});
  wrap.appendChild(runBar());
  wrap.appendChild(el('div',{class:'nodehead'},[
    el('div',{class:'nbig', text:'🔥'}), el('h2',{class:'sh', text:'A CAMP'}),
    el('p',{class:'dim center', text:'A fire someone else built and left burning. There is wood stacked for you. Persian roads are like this in the poems and, occasionally, in life.'})]));
  const row = el('div',{class:'choices'});
  const healN = Math.round(R.maxHp*0.36) + mod('restBonus');
  row.appendChild(choiceCard('🛌','SLEEP', `Heal ${healN} HP`, ()=>{ RunAPI.heal(healN); sfx('rest'); toast(`+${healN} HP`); advance(); }));
  row.appendChild(choiceCard('🔨','WORK AT THE FIRE','Permanently sharpen one card', ()=>{ pickFromDeck('SHARPEN A CARD', c=>!c.up && CARDS[c.id].cost>=0, c=>{ c.up=true; sfx('forge'); toast(cardName(c)+' sharpened'); advance(); }); }));
  if(R.talismans.length) row.appendChild(choiceCard('🪶','SIT WITH IT','Heal 12 · draw the road ahead (see the next trial)', ()=>{ RunAPI.heal(12); peekAhead(); }));
  wrap.appendChild(row);
  APP().innerHTML=''; APP().appendChild(wrap);
}
function peekAhead(){
  const t = trialDef(Math.min(R.trial+1, 7));
  const box = el('div',{class:'lore-modal'},[el('h2',{text:'WHAT IS COMING'}),
    el('div',{class:'bart', text:FOES[t.boss].art}),
    el('h3',{text:`TRIAL ${t.roman} — ${t.name}`}), el('p',{text:t.text}),
    el('button',{class:'btn gold', onclick:()=>{ closeModal(); advance(); }},'ONWARD')]);
  modal(box,{sticky:true});
}
function choiceCard(art,name,desc,fn){
  return el('div',{class:'node', onclick:fn},[el('div',{class:'nart',text:art}),el('div',{class:'nname',text:name}),el('div',{class:'ndesc',text:desc})]);
}

function pickFromDeck(title, filter, fn){
  const usable = R.deck.filter(filter);
  const grid = el('div',{class:'deckgrid'});
  if(!usable.length) grid.appendChild(el('p',{class:'dim',text:'Nothing here qualifies.'}));
  usable.forEach(c=>{ const e=cardEl(c); e.classList.add('choosable'); e.addEventListener('click',()=>{ closeModal(); fn(c); }); grid.appendChild(e); });
  modal(el('div',{class:'lore-modal wide'},[el('h2',{text:title}), grid,
    el('button',{class:'btn', onclick:closeModal},'cancel')]),{wide:true});
}

function screenBazaar(){
  UI.screen='node';
  const wrap = el('div',{class:'scr node-scr'});
  wrap.appendChild(runBar());
  wrap.appendChild(el('div',{class:'nodehead'},[
    el('div',{class:'nbig', text:'🏺'}), el('h2',{class:'sh', text:'A BAZAAR'}),
    el('p',{class:'dim center', text:'Six stalls, four of them selling the same thing, and one man in the corner who will burn a card out of your deck for money and does not want to discuss how.'})]));

  if(!R._shop || R._shop.node !== R.trial+'-'+R.step){
    const disc = 1 - mod('shopDiscount');
    const pool = poolFor(R.hero);
    const cards = shuffleIn(pool.slice()).slice(0, 5 + mod('shopExtra')).map(d=>({c:inst(d.id), price:Math.round((d.rarity==='rare'?175:d.rarity==='uncommon'?115:70)*disc*(0.9+rnd()*0.25))}));
    const tals = shuffleIn(Object.values(TALISMANS).filter(t=>!R.talismans.includes(t.id) && ['common','uncommon','rare'].includes(t.rarity)))
      .slice(0,3).map(t=>({t, price:Math.round((t.rarity==='rare'?310:t.rarity==='uncommon'?210:130)*disc)}));
    R._shop = { node:R.trial+'-'+R.step, cards, tals, removePrice:Math.round(85*disc), removed:false };
  }
  const S = R._shop;

  const cr = el('div',{class:'shoprow'});
  S.cards.forEach(o=>{
    if(o.sold) return;
    const box = el('div',{class:'buy'});
    box.appendChild(cardEl(o.c));
    box.appendChild(el('button',{class:'btn small'+(R.gold>=o.price?' gold':' poor'), onclick:()=>{
      if(R.gold<o.price){ toast('Not enough dirhams.'); sfx('nope'); return; }
      R.gold-=o.price; o.sold=true; R.deck.push(o.c); sfx('buy'); toast(`${cardName(o.c)} bought`); screenBazaar();
    }},`🪙 ${o.price}`));
    cr.appendChild(box);
  });
  wrap.appendChild(el('div',{class:'rlab', text:'CARDS'}));
  wrap.appendChild(cr);

  const tr = el('div',{class:'shoprow'});
  S.tals.forEach(o=>{
    if(o.sold) return;
    const box = el('div',{class:'buy'});
    box.appendChild(talismanCard(o.t));
    box.appendChild(el('button',{class:'btn small'+(R.gold>=o.price?' gold':' poor'), onclick:()=>{
      if(R.gold<o.price){ toast('Not enough dirhams.'); sfx('nope'); return; }
      R.gold-=o.price; o.sold=true; grantTalismanById(o.t.id); sfx('buy'); toast(`${o.t.name} is yours`); screenBazaar();
    }},`🪙 ${o.price}`));
    tr.appendChild(box);
  });
  wrap.appendChild(el('div',{class:'rlab', text:'TALISMANS'}));
  wrap.appendChild(tr);

  const svc = el('div',{class:'shoprow'});
  if(!S.removed) svc.appendChild(el('button',{class:'btn'+(R.gold>=S.removePrice?' gold':' poor'), onclick:()=>{
    if(R.gold<S.removePrice){ toast('Not enough dirhams.'); return; }
    pickFromDeck('BURN A CARD', ()=>true, c=>{ const i=R.deck.indexOf(c); R.deck.splice(i,1); R.gold-=S.removePrice; S.removed=true; sfx('forge'); toast(cardName(c)+' burnt'); screenBazaar(); });
  }},`🔥 Burn a card from your deck — 🪙 ${S.removePrice}`));
  wrap.appendChild(svc);
  wrap.appendChild(el('button',{class:'btn big', onclick:()=>{ R._shop=null; advance(); }},'LEAVE THE BAZAAR ▸'));
  APP().innerHTML=''; APP().appendChild(wrap);
}

function screenOmen(){
  UI.screen='node';
  const done = R.log || [];
  let pool = EVENTS.filter(e=>(!e.once || !done.includes(e.id)) && (!e.minTrial || R.trial+1>=e.minTrial));
  if(!pool.length) pool = EVENTS;
  const ev = pick(pool);
  R.log = done.concat([ev.id]);

  const wrap = el('div',{class:'scr node-scr'});
  wrap.appendChild(runBar());
  const head = el('div',{class:'nodehead'});
  head.appendChild(el('div',{class:'nbig', text:ev.art}));
  head.appendChild(el('h2',{class:'sh', text:ev.name}));
  head.appendChild(el('div',{class:'tfa', text:ev.fa}));
  ev.text.split('\n\n').forEach(p=>head.appendChild(el('p',{class:'evtext', html:p.replace(/\*(.+?)\*/g,'<i>$1</i>')})));
  wrap.appendChild(head);

  const row = el('div',{class:'choices'});
  ev.choices.forEach(ch=>{
    const ok = !ch.req || ch.req(RunAPI);
    const n = el('div',{class:'node ev '+(ok?'':'no'), onclick:()=>{
      if(!ok){ toast('You cannot afford that.'); return; }
      const res = ch.fx(RunAPI); sfx('event');
      showOutcome(res);
    }});
    n.appendChild(el('div',{class:'nname', text:ch.label}));
    n.appendChild(el('div',{class:'ndesc', text:ch.sub}));
    row.appendChild(n);
  });
  wrap.appendChild(row);
  APP().innerHTML=''; APP().appendChild(wrap);
}

function showOutcome(text){
  const box = el('div',{class:'lore-modal'},[
    el('h2',{text:'AND SO'}), el('p',{html:esc(text).replace(/\n/g,'<br>')}),
    el('button',{class:'btn gold', onclick:()=>{ closeModal(); if(UI.choiceQ.length){ runQueuedChoice(); } else advance(); }},'ONWARD'),
  ]);
  modal(box,{sticky:true});
}

UI.queueChoice = function(c){ UI.choiceQ.push(c); };
function runQueuedChoice(){
  const c = UI.choiceQ.shift(); if(!c){ advance(); return; }
  if(c.kind==='remove') pickFromDeck('CHOOSE A CARD TO LET GO', ()=>true, card=>{ const i=R.deck.indexOf(card); R.deck.splice(i,1); toast(cardName(card)+' released'); if(UI.choiceQ.length) runQueuedChoice(); else advance(); });
  else if(c.kind==='upgrade') pickFromDeck('CHOOSE A CARD TO SHARPEN', card=>!card.up && CARDS[card.id].cost>=0, card=>{ card.up=true; toast(cardName(card)+' sharpened'); if(UI.choiceQ.length) runQueuedChoice(); else advance(); });
}

/* ═══════════  DECK VIEWER  ═══════════ */
function showDeck(list, title, shuffled){
  const sorted = shuffled ? shuffleIn(list.slice()) : list.slice().sort((a,b)=>{
    const A=CARDS[a.id],B=CARDS[b.id];
    return (A.type>B.type?1:A.type<B.type?-1:0) || (cardCost(a)-cardCost(b)) || (A.name>B.name?1:-1);
  });
  const grid = el('div',{class:'deckgrid'});
  if(!sorted.length) grid.appendChild(el('p',{class:'dim',text:'Empty.'}));
  sorted.forEach(c=>grid.appendChild(cardEl(c)));
  modal(el('div',{class:'lore-modal wide'},[
    el('h2',{text:title}), el('div',{class:'dim center', text:`${list.length} cards`}), grid,
    el('button',{class:'btn', onclick:closeModal},'close')]),{wide:true});
}

/* ═══════════  END SCREENS  ═══════════ */
function deathScreen(){
  UI.screen='end'; R.hp = 0; SAVE.run=null; persist(); ART.setMood('death');
  const t = trialDef(R.trial);
  const wrap = el('div',{class:'scr end lose'});
  wrap.appendChild(el('div',{class:'endart', text:'☾'}));
  wrap.appendChild(el('h2',{class:'endtitle', text:'THE ROAD ENDS HERE'}));
  wrap.appendChild(el('p',{class:'endline', html:`You fell in <b>TRIAL ${t.roman} — ${esc(t.name)}</b>.`}));
  wrap.appendChild(el('p',{class:'dim center', text:pick([
    'Ferdowsī would have made this scene four hundred lines long and everyone would have cried.',
    'In the book, heroes who die badly still get a name and a horse and two thousand words of grief. So will you.',
    'The Simurgh does not come for everyone. That is what makes it mean something when she does.',
    'Rostam himself dies in a pit dug by his own brother. Nobody in this story gets out clean.',
  ])}));
  wrap.appendChild(el('div',{class:'endstats', html:
    `Trials cleared: <b>${R.cleared}</b> · Deck: <b>${R.deck.length}</b> cards · Talismans: <b>${R.talismans.length}</b> · Dirhams: <b>${R.gold}</b>`}));
  wrap.appendChild(el('div',{class:'endbtns'},[
    el('button',{class:'btn gold big', onclick:screenHeroSelect},'RIDE AGAIN'),
    el('button',{class:'btn', onclick:()=>showDeck(R.deck,'THE DECK YOU DIED WITH')},'see your deck'),
    el('button',{class:'btn', onclick:screenTitle},'to the title'),
  ]));
  APP().innerHTML=''; APP().appendChild(wrap);
}

function victory(){
  UI.screen='end'; ART.setMood('victory'); ART.feathers(30);
  SAVE.stats.wins++;
  if(R.secret) SAVE.stats.secretWin = true;
  SAVE.khanMax = Math.min(7, Math.max(SAVE.khanMax, R.khan+1));
  SAVE.unlocked.zal = true;
  SAVE.run=null; persist();
  confettiBurst();
  const H = HEROES[R.hero];
  const wrap = el('div',{class:'scr end win'});
  wrap.appendChild(el('div',{class:'endart', text:'✦'}));
  wrap.appendChild(el('h2',{class:'endtitle', text: R.secret? 'THE GREY ROAD ENDS' : 'THE SEVEN TRIALS ARE DONE'}));
  wrap.appendChild(el('p',{class:'endline', html: R.secret
    ? `The tower comes down, and the watchfulness goes out like a lamp, and the ash begins — very slowly — to grow something.`
    : `${H.name} cuts the White Demon down in the dark, and carries its blood back to a king who will not deserve it, and gives the sight back to an army who will forget.`}));
  wrap.appendChild(el('div',{class:'couplet', html:
    `<div class="fa-couplet">بسی رنج بردم در این سال سی<br>عجم زنده کردم بدین پارسی</div>` +
    `<i>“I have laboured hard these thirty years —<br>I gave the Persians new life with this Persian.”</i>` +
    `<span>— Ferdowsī, at the end of the Shāhnāmeh, c. 1010</span>`}));
  wrap.appendChild(el('p',{class:'dim center', html:
    `And into the book, at the end, somebody has added a line that is not in any manuscript:<br><b class="mishaline">“…and the one who rode the whole road was called MISHA, and she did it in one sitting.”</b>`}));
  wrap.appendChild(el('div',{class:'endstats', html:
    `${H.name} · Khān ${['I','II','III','IV','V','VI','VII'][R.khan-1]} · Deck: <b>${R.deck.length}</b> · Talismans: <b>${R.talismans.length}</b>` +
    (SAVE.khanMax>R.khan? `<br><b class="unlock">KHĀN ${['I','II','III','IV','V','VI','VII'][R.khan]} UNLOCKED</b>`:'') +
    (!R.secret && !SAVE.stats.secretSeen? `<br><span class="dim">There is a road you have not found. It starts with something broken, in a cairn of grey stones.</span>`:'')}));
  wrap.appendChild(el('div',{class:'endbtns'},[
    el('button',{class:'btn gold big', onclick:screenHeroSelect},'RIDE AGAIN'),
    el('button',{class:'btn', onclick:()=>showDeck(R.deck,'THE WINNING DECK')},'see your deck'),
    el('button',{class:'btn', onclick:screenTitle},'to the title'),
  ]));
  APP().innerHTML=''; APP().appendChild(wrap);
}

/* ═══════════  STATS  ═══════════ */
function screenStats(){
  UI.screen='stats'; ART.setMood('title');
  const s = SAVE.stats;
  const wrap = el('div',{class:'scr node-scr'});
  wrap.appendChild(el('h2',{class:'sh', text:'RECORDS'}));
  const g = el('div',{class:'statgrid'});
  const add=(k,v)=>g.appendChild(el('div',{class:'stat'},[el('b',{text:String(v)}),el('span',{text:k})]));
  add('runs', s.runs); add('victories', s.wins);
  add('furthest trial', ['—','I','II','III','IV','V','VI','VII','VIII'][Math.min(8,s.bestTrial)]);
  add('things killed', s.kills);
  add('khāns unlocked', SAVE.khanMax);
  add('the grey road', s.secretWin?'walked':s.secretSeen?'found':'—');
  wrap.appendChild(g);
  wrap.appendChild(el('button',{class:'btn', onclick:screenTitle},'← back'));
  APP().innerHTML=''; APP().appendChild(wrap);
}

/* ═══════════  ANIMATION  ═══════════ */
function flushAnims(){
  if(!G || !G.anims.length) return;
  const anims = G.anims.splice(0);
  const msgs = G.msg.splice(0);
  anims.forEach(a=>{
    if(a.t==='hit' && a.foe){
      const i = G.foes.indexOf(a.foe); const node = $(`.foe[data-i="${i}"]`);
      if(node){ node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake');
        if(a.n>0) float(node, '−'+a.n, 'dmg'); else if(a.venom) float(node,'venom','ven'); else if(a.ember) float(node,'burn','emb'); }
    } else if(a.t==='phit'){
      const pb=$('.playerbox'); if(pb){ pb.classList.remove('shake'); void pb.offsetWidth; pb.classList.add('shake'); }
      document.body.classList.add('hurt'); setTimeout(()=>document.body.classList.remove('hurt'),200);
    } else if(a.t==='feather'){ toast('THE FEATHER BURNS — she comes','big'); sfx('invoke'); }
  });
  msgs.forEach(m=>toast(m));
}
function float(node, txt, cls){
  const r = node.getBoundingClientRect();
  const f = el('div',{class:'floater '+cls, text:txt});
  const x = r.left+r.width/2, y = r.top+r.height*0.3;
  f.style.left = x+'px'; f.style.top = y+'px';
  document.body.appendChild(f); setTimeout(()=>f.remove(), 900);
  if(cls==='dmg') ART.burst(x, y, {n:11, spread:64, colors:['#ff8a5a','#ffd08a','#fff0c0']});
  else if(cls==='ven') ART.burst(x, y, {n:8, spread:46, colors:['#8fe07a','#4fae3a']});
  else if(cls==='emb') ART.burst(x, y, {n:8, spread:46, colors:['#ffab3c','#ff6a2a']});
}

function confettiBurst(){
  const c = $('#confetti'); const ctx=c.getContext('2d');
  c.width=innerWidth; c.height=innerHeight; c.style.display='block';
  const cols=['#e0a92e','#2e9c9c','#9e2b3a','#f3e6cd','#c9a227'];
  const ps=[...Array(160)].map(()=>({x:innerWidth/2+(Math.random()-.5)*240, y:innerHeight*0.34,
    vx:(Math.random()-.5)*11, vy:Math.random()*-13-3, r:Math.random()*5+2, c:cols[(Math.random()*cols.length)|0], a:1, rot:Math.random()*6}));
  let t=0;
  (function loop(){ ctx.clearRect(0,0,c.width,c.height); t++;
    ps.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.32; p.rot+=0.1; p.a-=0.007;
      ctx.save(); ctx.globalAlpha=Math.max(0,p.a); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillStyle=p.c; ctx.fillRect(-p.r,-p.r,p.r*2,p.r*2.6); ctx.restore(); });
    if(t<150) requestAnimationFrame(loop); else { ctx.clearRect(0,0,c.width,c.height); c.style.display='none'; }
  })();
}

/* ═══════════  BOOT  ═══════════ */
window.addEventListener('DOMContentLoaded', ()=>{
  screenTitle();
  document.addEventListener('click', (e)=>{ if(!e.target.closest('.chip,.tal,.intent,.invoke')) untip(); });
  window.addEventListener('keydown', (e)=>{
    if(UI.screen!=='combat'||!G||G.over) return;
    if(e.key==='e'||e.key==='E'||e.key===' '){ e.preventDefault(); doEndTurn(); }
    if(e.key==='f'||e.key==='F'){ doInvoke(); }
    if(e.key==='Escape'){ UI.targeting=null; paintFoes(); }
    const n = parseInt(e.key,10);
    if(n>=1 && n<=9 && G.hand[n-1]) onCardClick(G.hand[n-1]);
  });
  window.addEventListener('beforeunload', ()=>{ if(R && UI.screen==='combat') saveRun(true); });
});
