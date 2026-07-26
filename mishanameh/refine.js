/* MISHANAMEH — the refinement pass.
   ────────────────────────────────────────────────────────────────────────
   Loaded last. Everything here is a smoothing: the last emoji swapped for
   drawn work, screens that used to swap instantly given a beat, the combat
   stage composed rather than stacked, and the small physical courtesies —
   a card that lifts when you can afford it and greys when you cannot,
   a pile that flicks when it takes a card.

   No rules change anywhere in this file.                                   */

/* ═══════════ 1. TALISMANS GET THEIR GIRIH ═══════════ */
talismanCard = function(t){
  const n = el('div',{class:'talcard r-'+t.rarity});
  const art = el('div',{class:'tart'});
  art.appendChild(SIGIL.talisman(t.id, 78, t.rarity));
  n.appendChild(art);
  n.appendChild(el('div',{class:'tname', text:t.name}));
  n.appendChild(el('div',{class:'tfa2', text:t.fa}));
  n.appendChild(el('div',{class:'ttext', html:markup(t.text)}));
  n.appendChild(el('div',{class:'trar', text:t.rarity}));
  return n;
};

/* the codex list, and anywhere else the emoji leaked */
if(typeof screenCodex === 'function'){
  const _screenCodex_ref = screenCodex;
  screenCodex = function(tab){
    _screenCodex_ref(tab);
    document.querySelectorAll('.cx-item').forEach(item=>{
      const h = item.querySelector('.cx-h, h3, b');
      if(!h) return;
      const m = h.textContent.match(/^(\S+)\s\s(.+)$/);
      if(!m) return;
      const name = m[2].trim();
      const t = Object.values(TALISMANS).find(x=>x.name===name);
      if(!t) return;
      h.textContent = name;
      const art = SIGIL.talisman(t.id, 30, t.rarity);
      art.className = 'cx-sig';
      h.insertBefore(art, h.firstChild);
    });
  };
}

/* the run bar tooltip should show them too */
const _runBar_ref = runBar;
runBar = function(){
  const b = _runBar_ref();
  const tals = b.querySelector('.rb-tals');
  if(tals && R.talismans.length){
    const held = R.talismans.map(id=>TALISMANS[id]).filter(Boolean);
    tals.addEventListener('mouseenter', ()=>{}, {once:true});
    tals.title = held.length + ' talisman' + (held.length===1?'':'s');
  }
  return b;
};

/* ═══════════ 2. THE LAST EMOJI ═══════════ */
/* declared here, hoisted, used by both passes below */
const EMOJI_SIGIL = [
  [/🏺/g, 'bazaar'], [/⚖️?/g, 'bazaar'], [/🔥/g, 'camp'], [/⛺/g, 'camp'],
  [/⚔️?/g, 'battle'], [/💀/g, 'elite'], [/👑/g, 'boss'], [/🌉/g, 'bridge'],
  [/🏹/g, 'arash'], [/🜲/g, 'omen'], [/✦/g, 'omen'],
];
function deEmoji(root){
  if(!root) return;
  root.querySelectorAll('.nart, .bart, .sart, .oart, .nbig').forEach(n=>{
    const txt = (n.textContent||'').trim();
    if(!txt || n.querySelector('canvas')) return;
    for(const [re, kind] of EMOJI_SIGIL){
      if(re.test(txt)){ n.innerHTML=''; n.appendChild(SIGIL.node(kind, 88)); return; }
    }
  });
  // every price, wherever it is printed
  root.querySelectorAll('button, .price, .cost-gold').forEach(n=>{
    if(n.querySelector('canvas')) return;
    if(!/[🌍🪙💰🜚]/.test(n.textContent||'')) return;
    const m = (n.textContent||'').match(/(\d+)/);
    if(!m) return;
    n.innerHTML='';
    n.appendChild(SIGIL.node('gold', 15, {flat:true}));
    n.appendChild(el('span',{class:'rbnum', text:m[1]}));
    n.classList.add('rb-sig');
  });
}

/* every one of these is a top-level function declaration, so it is a real
   property of the global object and can be wrapped by name without eval */
function wrapGlobal(name, after){
  const orig = window[name];
  if(typeof orig !== 'function') return false;
  window[name] = function(){
    const r = orig.apply(this, arguments);
    try{ after(r, arguments); }catch(e){}
    return r;
  };
  return true;
}

['screenBazaar','screenCamp','screenOmen','rewardScreen','screenMap','victory','deathScreen']
  .forEach(fn=> wrapGlobal(fn, ()=>setTimeout(()=>deEmoji(document.querySelector('#app')), 0)));

/* ═══════════ 3. SCREENS ARRIVE INSTEAD OF APPEARING ═══════════
   Every screen was an innerHTML swap. One shared 220 ms is the difference
   between a game and a form. */
const _APP = APP;
let lastScreen = null;
function transition(){
  const app = _APP();
  if(!app) return;
  app.classList.remove('screen-in');
  void app.offsetWidth;
  app.classList.add('screen-in');
}
['screenMap','screenBazaar','screenCamp','screenOmen','rewardScreen','screenTitle',
 'screenHeroSelect','renderCombat','victory','deathScreen','screenCodex','screenStats']
  .forEach(fn=> wrapGlobal(fn, ()=>transition()));

/* ═══════════ 4. THE COMBAT STAGE ═══════════
   The enemies sat in a thin band at the top with a third of the screen empty
   under them. Give the fight a floor, and put the creatures on it. */
const _renderCombat_ref = renderCombat;
renderCombat = function(){
  _renderCombat_ref();
  const wrap = document.querySelector('#app > .scr.combat');
  if(!wrap) return;
  const foes = wrap.querySelector('#foes');
  if(foes && !wrap.querySelector('.stage')){
    const stage = el('div',{class:'stage'});
    foes.parentNode.insertBefore(stage, foes);
    stage.appendChild(foes);
  }
};

/* ═══════════ 5. SMALL PHYSICAL COURTESIES ═══════════ */
const _paintHand_ref = paintHand;
paintHand = function(){
  _paintHand_ref();
  const host = document.querySelector('#hand'); if(!host) return;
  [...host.children].forEach((e,i)=>{
    const c = G.hand[i]; if(!c) return;
    const d = CARDS[c.id];
    // the cost pip turns red when you cannot pay for it, which is the single
    // most-asked "why can't I play this"
    const pip = e.querySelector('.cost');
    if(pip && d && !d.unplayable){
      const cost = cardCost(c);
      if(cost > G.p.energy) pip.classList.add('cant'); else pip.classList.remove('cant');
    }
    if(d && d.unplayable) e.classList.add('inert');
  });
};

const _paintPiles_ref = paintPiles;
let lastPiles = {};
paintPiles = function(){
  _paintPiles_ref();
  const now = { draw:G.draw.length, discard:G.discard.length, exhaust:G.exhaust.length };
  const flick = (sel, key)=>{
    const n = document.querySelector(sel);
    if(!n || lastPiles[key] == null) return;
    if(now[key] !== lastPiles[key]){
      n.classList.remove('flick'); void n.offsetWidth; n.classList.add('flick');
    }
  };
  flick('#drawPile','draw'); flick('#discPile','discard'); flick('#exhPile','exhaust');
  lastPiles = now;
};

/* ═══════════ 6. THE CHAT DOCK ONLY BELONGS IN COMPANY ═══════════ */
function hideSoloChat(){
  const dock = document.querySelector('.chatdock, .chatbub, #chatdock');
  if(dock) dock.style.display = (CO && CO.mode && CO.mode !== 'solo') ? '' : 'none';
}
const _paint_ref = paint;
paint = function(){ _paint_ref(); hideSoloChat(); };
document.addEventListener('DOMContentLoaded', ()=>setTimeout(hideSoloChat, 400));
setInterval(hideSoloChat, 1500);

/* ═══════════ 7. THE INTENT CHIP, DRAWN ═══════════ */
const _paintFoes_ref = paintFoes;
paintFoes = function(){
  _paintFoes_ref();
  document.querySelectorAll('#foes .intent').forEach(chip=>{
    const ii = chip.querySelector('.ii');
    if(!ii || ii.querySelector('canvas')) return;
    const kind = chip.classList.contains('atk') ? 'atk'
               : chip.classList.contains('def') ? 'def'
               : chip.classList.contains('buf') ? 'buf'
               : chip.classList.contains('deb') ? 'deb' : 'spc';
    ii.innerHTML = '';
    ii.appendChild(SIGIL.mark(kind, 15));
  });
};
