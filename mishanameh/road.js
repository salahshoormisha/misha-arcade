/* MISHANAMEH — the road, drawn.
   ────────────────────────────────────────────────────────────────────────
   Between every fight you look at this screen, and until now it was two flat
   rectangles with Apple emoji in them, floating in the top third of an empty
   page. It is the connective tissue of the whole game and it looked like a
   settings menu.

   A trial is three rows of two choices and then the boss — so there is a real
   shape to draw: a path with four stations on it, branching and rejoining, the
   ones behind you spent, the boss at the end of it. Persian manuscripts draw
   journeys as a winding gold band across the page with the stations marked as
   roundels, so that is what this is.                                        */

/* ═══════════ 1. THE PATH ═══════════ */
function roadCanvas(w, h){
  const dpr = Math.min(2, devicePixelRatio||1);
  const cv = document.createElement('canvas');
  cv.className = 'roadcv';
  cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr);
  cv.style.width = w+'px'; cv.style.height = h+'px';
  const g = cv.getContext('2d');
  g.setTransform(dpr,0,0,dpr,0,0);
  return {cv, g};
}

/* the stations, left→right across the strip: rows behind, now, ahead, boss.
   R.map already ends with a [boss] row, so the count is just its length. */
function roadStations(w, h, rows, step, bossAt){
  const n = rows;
  const pad = w * 0.075;
  const span = w - pad*2;
  const pts = [];
  for(let i=0;i<n;i++){
    const t = n===1 ? 0.5 : i/(n-1);
    pts.push({
      x: pad + span*t,
      y: h*0.5 + Math.sin(t*Math.PI*1.6 + 0.4)*h*0.17,
      i, boss: i === (bossAt==null ? n-1 : bossAt),
      done: i < step, now: i === step,
    });
  }
  return pts;
}

function drawRoad(g, w, h, pts){
  // the road itself, a smooth curve through the stations
  const curve = (widen, col, alpha)=>{
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for(let i=0;i<pts.length-1;i++){
      const a = pts[i], b = pts[i+1];
      const mx = (a.x+b.x)/2;
      g.bezierCurveTo(mx, a.y, mx, b.y, b.x, b.y);
    }
    g.strokeStyle = col; g.globalAlpha = alpha;
    g.lineWidth = widen; g.lineCap='round'; g.lineJoin='round';
    g.stroke(); g.globalAlpha = 1;
  };
  curve(13, 'rgba(6,8,26,.55)', 1);
  curve(9,  '#9a6f14', 0.85);
  curve(3.2,'#e0a92e', 0.95);
  // a dashed inner line, like a route inked over a painted band
  g.save();
  g.setLineDash([5, 7]);
  curve(1.2, '#f7d97a', 0.85);
  g.restore();
}

/* ═══════════ 2. THE SCREEN ═══════════ */
const _screenMap_road = screenMap;
screenMap = function(){
  _screenMap_road();
  const wrap = document.querySelector('#app > .scr.map');
  if(!wrap || !R) return;

  const t = trialDef(R.trial);
  const rows = R.map.length;
  const step = R.step;

  /* --- replace the dot strip with a drawn road --- */
  const prog = wrap.querySelector('.prog');
  const w = Math.min(1080, Math.max(300, (innerWidth || 900) - 96));
  const h = 150;
  const {cv, g} = roadCanvas(w, h);
  const bossAt = R.map.findIndex(r=>r.indexOf('boss')>=0);
  const pts = roadStations(w, h, rows, step, bossAt<0 ? rows-1 : bossAt);
  drawRoad(g, w, h, pts);

  const strip = el('div',{class:'roadstrip'});
  strip.appendChild(cv);

  // a marker on every station, positioned over the canvas
  pts.forEach(p=>{
    const kind = p.boss ? 'boss' : (R.map[p.i] ? null : null);
    const m = el('div',{class:'station'
      + (p.done?' done':'') + (p.now?' now':'') + (p.boss?' bossst':'')});
    m.style.left = p.x+'px'; m.style.top = p.y+'px';
    if(p.boss){
      m.appendChild(SIGIL.node('boss', 54));
      m.appendChild(el('span',{class:'stlab', text: FOES[t.boss] ? FOES[t.boss].name : 'THE TRIAL'}));
    } else if(p.done){
      m.appendChild(el('div',{class:'stdone', html:'✓'}));
      m.appendChild(el('span',{class:'stlab', text:'passed'}));
    } else if(p.now){
      const ring = el('div',{class:'stme'});
      ring.appendChild(PLATE.node(R.hero, 46, 'hero'));
      m.appendChild(ring);
      m.appendChild(el('span',{class:'stlab', text:'you are here'}));
    } else {
      m.appendChild(el('div',{class:'stdot'}));
      m.appendChild(el('span',{class:'stlab', text:'ahead'}));
    }
    strip.appendChild(m);
  });
  if(prog) prog.replaceWith(strip); else wrap.appendChild(strip);

  /* --- give the two choices drawn sigils instead of emoji --- */
  const row = R.map[R.step] || ['boss'];
  wrap.querySelectorAll('.nodes .node').forEach((n, i)=>{
    const type = row[i] || 'boss';
    const art = n.querySelector('.nart');
    if(!art) return;
    art.innerHTML = '';
    if(type==='boss'){
      art.appendChild(PLATE.node(t.boss, 104, 'foe'));
    } else {
      art.appendChild(SIGIL.node(type, 92));
    }
    // the description says what it is; the hint says what you get, in numbers
    const hint = HINTS[type];
    if(hint) n.appendChild(el('div',{class:'nhint', html:hint}));
  });

  /* --- the trial text is long; make it collapsible so the choices are above the fold --- */
  const txt = wrap.querySelector('.ttext');
  if(txt && txt.textContent.length > 150){
    const full = txt.textContent;
    const short = full.slice(0, 118).replace(/\s+\S*$/,'') + '…';
    txt.textContent = short;
    txt.classList.add('clipped');
    const more = el('button',{class:'ttmore', text:'read on', onclick:()=>{
      if(txt.classList.contains('clipped')){ txt.textContent = full; txt.classList.remove('clipped'); more.textContent='less'; }
      else { txt.textContent = short; txt.classList.add('clipped'); more.textContent='read on'; }
    }});
    txt.parentNode.appendChild(more);
  }
};

const HINTS = {
  battle: '<b>pick 1 of 3</b> cards · gold',
  elite:  '<b>talisman guaranteed</b> · pick 1 of 3 cards · more gold',
  camp:   '<b>heal 30%</b> &nbsp;or&nbsp; <b>upgrade a card</b> for the rest of the run',
  bazaar: 'buy cards &amp; talismans · <b>pay to delete a card</b>',
  omen:   'one choice, resolved on the spot',
  bridge: '<b>no cards</b> — a balancing walk',
  arash:  '<b>no cards</b> — one arrow, in 3D',
  boss:   'the end of the trial · a talisman and a rare card',
};

/* ═══════════ 3. SIGILS EVERYWHERE ELSE ═══════════ */
const _runBar_road = runBar;
runBar = function(){
  const b = _runBar_road();

  // the coin was an emoji
  const gold = b.querySelector('.rb-gold');
  if(gold){
    const amount = gold.textContent.replace(/[^\d]/g,'');
    gold.innerHTML = '';
    gold.appendChild(SIGIL.node('gold', 17, {flat:true}));
    gold.appendChild(el('span',{class:'rbnum', text:amount}));
    gold.classList.add('rb-sig');
  }

  // and so was every talisman — collapse them to one drawn amulet with a count,
  // because six emoji in a row was the single most cluttered thing on the screen
  const tals = b.querySelector('.rb-tals');
  if(tals && R.talismans.length){
    const held = R.talismans.map(id=>TALISMANS[id]).filter(Boolean);
    tals.innerHTML = '';
    tals.classList.add('rb-sig','rb-talsig');
    tals.appendChild(SIGIL.node('tal', 19, {flat:true}));
    tals.appendChild(el('span',{class:'rbnum', text:String(held.length)}));
    const body = held.map(t=>`<b>${esc(t.name)}</b> <i>${esc(t.fa||'')}</i><br><span class="dim">${esc(t.text)}</span>`).join('<hr>');
    const show = (e)=>tip(body, e.clientX, e.clientY);
    tals.addEventListener('mouseenter', show);
    tals.addEventListener('mouseleave', untip);
    tals.addEventListener('click', show);
    tals.title = held.map(t=>t.name).join(' · ');
  }

  // the deck button had a playing-card emoji that renders as a box on some machines
  const deckBtn = [...b.querySelectorAll('.rb-btn')].find(n=>/🂠/.test(n.textContent));
  if(deckBtn){
    const n = deckBtn.textContent.replace(/[^\d]/g,'');
    deckBtn.innerHTML = `<span class="rbdeck"></span><span class="rbnum">${n}</span>`;
    deckBtn.classList.add('rb-sig');
  }
  return b;
};

/* the node-type icons in the codex and anywhere else NODE_INFO leaks through */
if(typeof NODE_INFO !== 'undefined'){
  NODE_INFO.battle.desc = 'Something is in the way. A card and some coin if you win.';
  NODE_INFO.elite.desc  = 'A hard fight, and it is carrying a talisman.';
  NODE_INFO.camp.desc   = 'Rest and heal, or work at the fire and sharpen one card for the rest of the run.';
  NODE_INFO.bazaar.desc = 'Cards, talismans, and someone who will burn a card out of your deck for money.';
  NODE_INFO.omen.desc   = 'A choice. Most of them are gifts; a few have a price.';
}
