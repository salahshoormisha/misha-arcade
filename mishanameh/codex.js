/* MISHANAMEH — THE CODEX. Everything the game is made of, and where it came from. */

const CX_TABS = [
  {id:'book',    label:'The Book'},
  {id:'haft',    label:'Seven Trials'},
  {id:'farr',    label:'Farr'},
  {id:'simurgh', label:'The Simurgh'},
  {id:'tolkien', label:'The Other Book'},
  {id:'music',   label:'The Sound'},
  {id:'words',   label:'The Words'},
  {id:'cards',   label:'Cards'},
  {id:'foes',    label:'Bestiary'},
  {id:'tals',    label:'Talismans'},
  {id:'how',     label:'How to Play'},
];

let cxTab = 'book', cxReturn = null;

function screenCodex(tab){
  cxReturn = cxReturn || UI.screen;
  UI.screen = 'codex';
  cxTab = tab || cxTab;
  const wrap = el('div',{class:'scr codex'});
  wrap.appendChild(el('h2',{class:'sh', text:'THE CODEX'}));
  wrap.appendChild(el('div',{class:'dim center', text:'Everything in this game is from somewhere. Here is where.'}));

  const tabs = el('div',{class:'cx-tabs'});
  CX_TABS.forEach(t=>tabs.appendChild(el('div',{class:'cx-tab '+(t.id===cxTab?'on':''),
    onclick:()=>{ sfx('click'); screenCodex(t.id); }}, t.label)));
  wrap.appendChild(tabs);

  const body = el('div',{class:'cx-body'});
  if(LORE.essays[cxTab]) body.appendChild(el('div',{class:'cx-essay', html:LORE.essays[cxTab].body}));
  else if(cxTab==='cards') body.appendChild(cxCards());
  else if(cxTab==='foes')  body.appendChild(cxFoes());
  else if(cxTab==='tals')  body.appendChild(cxTals());
  else if(cxTab==='how')   body.appendChild(el('div',{class:'cx-essay', html:HOWTO}));
  wrap.appendChild(body);

  wrap.appendChild(el('div',{class:'center', style:'margin-top:28px'},[
    el('button',{class:'btn', onclick:()=>{ const back=cxReturn; cxReturn=null;
      if(back==='combat' && G && !G.over){ UI.screen='combat'; renderCombat(); }
      else if(back==='map' && R){ screenMap(); }
      else screenTitle(); }},'← back')]));
  APP().innerHTML=''; APP().appendChild(wrap);
  window.scrollTo(0,0);
}

function cxItem(name, fa, tagText, bodyHtml, extra, tagCls){
  const n = el('div',{class:'cx-item'});
  const h = el('div',{class:'cx-h'});
  h.appendChild(el('b',{text:name}));
  if(fa) h.appendChild(el('i',{text:fa}));
  if(tagText) h.appendChild(el('em',{text:tagText}));
  n.appendChild(h);
  if(extra) n.appendChild(el('div',{class:'mech2', html:extra}));
  n.appendChild(el('p',{html:bodyHtml}));
  return n;
}

function cxCards(){
  const list = el('div');
  const groups = [
    ['ROSTAM', c=>c.hero==='rostam'],
    ['GORDĀFARID', c=>c.hero==='gord'],
    ['ZĀL', c=>c.hero==='zal'],
    ['FOUND ON THE ROAD', c=>c.hero==='any'],
    ['STATUSES & CURSES', c=>c.hero==='status'],
  ];
  groups.forEach(([title,f])=>{
    list.appendChild(el('div',{class:'rlab', text:title}));
    const grid = el('div',{class:'cx-list'});
    Object.values(CARDS).filter(f).forEach(d=>{
      const note = LORE.cards[d.id];
      const body = note || (d.flavor? `<i>${esc(d.flavor)}</i>` : '<span class="dim">A card. Sometimes a card is just a card.</span>');
      const it = cxItem(d.name, d.fa, d.rarity==='basic'?'starter':d.rarity, body, `<b>${esc(d.t(false))}</b>` );
      if(['n_pilgrim','n_eagles','n_reforged','c_doubt'].includes(d.id))
        it.appendChild(el('span',{class:'cx-tag lotr', text:'the other book'}));
      else if(note) it.appendChild(el('span',{class:'cx-tag', text:'shāhnāmeh'}));
      grid.appendChild(it);
    });
    list.appendChild(grid);
  });
  return list;
}

function cxFoes(){
  const list = el('div');
  const groups = [
    ['THE SEVEN TRIALS', f=>f.tier==='boss' && f.id!=='watcher'],
    ['ELITES', f=>f.tier==='elite'],
    ['ON THE ROAD', f=>f.tier==='A'||f.tier==='B'||f.tier==='C'||f.tier==='minion'],
    ['ELSEWHERE', f=>f.id==='watcher'],
  ];
  groups.forEach(([title,f])=>{
    const items = Object.values(FOES).filter(f);
    if(!items.length) return;
    list.appendChild(el('div',{class:'rlab', text:title}));
    const grid = el('div',{class:'cx-list'});
    items.forEach(d=>{
      const seen = SAVE.codexSeen[d.id];
      const body = LORE.foes[d.id] || '<span class="dim">—</span>';
      const it = cxItem(`${d.art}  ${d.name}`, d.fa, d.tier==='boss'?'trial':d.tier,
        body, d.mech? `<b>${esc(d.mech)}</b>` : (d.intro? `<span class="dim">${esc(d.intro)}</span>`:null));
      if(d.id==='watcher') it.appendChild(el('span',{class:'cx-tag lotr', text:'the other book'}));
      grid.appendChild(it);
    });
    list.appendChild(grid);
  });
  return list;
}

function cxTals(){
  const list = el('div');
  [['COMMON','common'],['UNCOMMON','uncommon'],['RARE','rare'],['FROM THE TRIALS','boss'],['ELSEWHERE','secret']].forEach(([title,rar])=>{
    const items = Object.values(TALISMANS).filter(t=>t.rarity===rar);
    if(!items.length) return;
    list.appendChild(el('div',{class:'rlab', text:title}));
    const grid = el('div',{class:'cx-list'});
    items.forEach(t=>{
      const it = cxItem(`${t.art}  ${t.name}`, t.fa, t.rarity, LORE.tals[t.id]||'<span class="dim">—</span>', `<b>${esc(t.text)}</b>`);
      if(rar==='secret') it.appendChild(el('span',{class:'cx-tag lotr', text:'the other book'}));
      grid.appendChild(it);
    });
    list.appendChild(grid);
  });
  return list;
}

const HOWTO = `
<h3>The loop</h3>
<p>You have a <b>deck of cards</b>. Each combat you draw five a turn and spend <b>Energy</b> (usually 3) to play them. Attacks deal damage; skills give <b>Block</b>, which soaks damage and — unless something says otherwise — <b>vanishes at the start of your next turn</b>, so it is worth spending, not hoarding.</p>
<p>Every enemy <b>tells you what it is about to do</b>. The badge above its head is its intent: 🗡️ with a number is an attack for exactly that much (already adjusted for every buff and debuff in play), 🛡️ is Block, ⬆️ is a buff, ☠️ is a debuff, ❔ is something else. Hover it to read the move. Play around the number.</p>
<h3>Farr and the bird</h3>
<p>The gold meter is <b>Farr</b>. Fill it — some cards give it, some talismans give it every turn — and the <b>INVOKE</b> button lights up. Invoking spends the whole meter for a very large hero‑specific effect, and then you can fill it again in the same fight. Building a deck that fills the halo twice in one boss is a real strategy.</p>
<h3>The road</h3>
<p>Each Trial is <b>three choices then the trial boss</b> — twenty‑eight stops over the seven. Fights give a card and coin; <b>elites</b> (💀) give a talisman; <b>camps</b> (🔥) heal or sharpen a card; <b>bazaars</b> (🏺) sell cards and talismans and will burn a card out of your deck for money; <b>omens</b> (🜲) are a choice with consequences.</p>
<p><b>A smaller deck is a better deck.</b> Every card you add makes the good ones rarer. Burning a starter card at a bazaar is almost always worth 85 dirhams.</p>
<h3>Keys</h3>
<p><b>1–9</b> play a card · <b>E</b> or <b>Space</b> end turn · <b>F</b> invoke · <b>Esc</b> cancel targeting.</p>
<h3>Dying</h3>
<p>You will. That is the genre. Beating the seven trials unlocks the next <b>Khān</b> — a harder version of the whole road, up to seven of them. Clearing Trial V with anybody unlocks <b>Zāl</b>.</p>
<p>Your run is <b>saved continuously</b>, including mid‑fight. Close the tab whenever you like.</p>`;
