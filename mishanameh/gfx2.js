/* MISHANAMEH — where the impact layer plugs into the game.
   Kept separate from gfx.js so the effect vocabulary and the wiring can be
   read independently. Loaded after teach.js, so this is the last word. */

/* ═══════════ 1. HITS ═══════════
   flushAnims() is the engine's one channel for "something happened". Every
   hit already comes through here; it just used to arrive as a CSS class. */
const _flushAnims_gfx = flushAnims;
flushAnims = function(){
  if(!G || !G.anims.length){ _flushAnims_gfx(); return; }
  // read the queue before the original drains it
  const queued = G.anims.slice();
  _flushAnims_gfx();
  queued.forEach(a=>{
    if(a.t==='hit' && a.foe){
      const i = G.foes.indexOf(a.foe);
      const nd = document.querySelector(`.foe[data-i="${i}"]`);
      if(!nd) return;
      if(a.venom)      GFX.impact(nd, {dmg:0, kind:'venom'});
      else if(a.ember) GFX.impact(nd, {dmg:0, kind:'fire'});
      else if(a.n>0)   GFX.impact(nd, {dmg:a.n});
      if(a.foe.hp<=0)  setTimeout(()=>GFX.death(nd), 90);
    } else if(a.t==='phit'){
      GFX.selfHit(a.n||10);
    } else if(a.t==='down'){
      GFX.shake(12, 500);
    }
  });
};

/* the engine's own floaters are now redundant — GFX draws better ones */
float = function(node, txt, cls){
  if(cls==='ven')      GFX.num(node, 'venom', {col:'#8fe07a', size:16});
  else if(cls==='emb') GFX.num(node, 'burn',  {col:'#ffab3c', size:16});
};

/* ═══════════ 2. WHAT YOU DO ═══════════ */
const _doPlay_gfx = doPlay;
doPlay = function(c, target){
  const d = CARDS[c.id];
  const src = document.querySelector(`.hand .card[data-uid="${c.uid}"]`) || document.querySelector('.hand');
  const dst = target ? document.querySelector(`.foe[data-i="${G.foes.indexOf(target)}"]`) : document.querySelector('.playerbox');
  const blockBefore = G.p.block, farrBefore = G.p.farr, hpBefore = G.p.hp;
  if(src && dst) GFX.cast(src, dst, d ? d.type : 'skill');
  _doPlay_gfx(c, target);
  if(!G) return;
  if(G.p.block > blockBefore) GFX.blockGain('.blockpip', G.p.block-blockBefore);
  if(G.p.farr  > farrBefore)  GFX.farrGain(G.p.farr-farrBefore);
  if(G.p.hp    > hpBefore)    GFX.heal('.rb-hp', G.p.hp-hpBefore);
};

const _doInvoke_gfx = doInvoke;
doInvoke = function(){
  const was = G && G.p.farr;
  _doInvoke_gfx();
  if(G && G.p.farr < was) GFX.invoke();
};

/* ═══════════ 3. NUMBERS THAT MOVE ═══════════
   A bar that jumps is a spreadsheet. A bar that travels is a game. */
const _paint_gfx = paint;
paint = function(){
  const before = {};
  if(G){
    document.querySelectorAll('.foe').forEach(n=>{ const b=n.querySelector('.fhpf'); if(b) before[n.dataset.i]=parseFloat(b.style.width)||0; });
  }
  _paint_gfx();
  // hp bars ease to their new width instead of snapping (the CSS does the work;
  // this only has to make sure the transition property is on them)
  document.querySelectorAll('.fhpf, .hpbar > :first-child, .allyhpf').forEach(b=>{ b.style.transition = 'width .42s cubic-bezier(.22,.9,.3,1)'; });
};

/* ═══════════ 4. THE HAND ═══════════
   Cards used to overlap so hard the text was unreadable. Scale the whole fan
   down when it is crowded rather than sliding cards on top of each other. */
const _paintHand_gfx = paintHand;
paintHand = function(){
  _paintHand_gfx();
  const host = document.querySelector('#hand'); if(!host) return;
  const n = G.hand.length; if(!n) return;
  // below 700 px the stylesheet turns the hand into a horizontal scroll-snap
  // strip, which is the better design on a phone — leave it entirely alone
  if((innerWidth||900) < 700){ dealIn(host); return; }
  const cardW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-w')) || 136;
  // measure the track we are actually allowed, not the one the cards claim
  const track = Math.min(host.clientWidth || 0, (innerWidth||900)) ;
  const avail = Math.max(220, track - 12);
  // on a phone the fan has to give more, or five cards simply will not fit
  const tight = (innerWidth||900) < 700;
  const overlap = tight ? 24 : 14;
  const want = n*cardW - (n-1)*overlap;
  const scale = Math.max(tight ? 0.46 : 0.62, Math.min(1, avail/want));
  host.style.setProperty('--fan-scale', scale.toFixed(3));
  [...host.children].forEach((e,i)=>{
    const off = i-(n-1)/2;
    const stepDeg = Math.min(2.6, 13/Math.max(1,n));
    const lift = Math.min(13, 54/Math.max(1,n));
    const y = (Math.abs(off)-(n-1)/2)*lift*0.5;
    // scale() is visual only — the card still occupies its full width in the
    // layout, so the margin has to swallow both the overlap AND the shrinkage,
    // or the fan lays out 576 px wide on a 375 px phone and runs off both edges
    const eat = (cardW*(1-scale) + overlap) / 2;
    e.style.margin = `0 -${eat.toFixed(2)}px`;
    e.style.setProperty('--base-tf', `rotate(${(off*stepDeg).toFixed(2)}deg) translateY(${y.toFixed(1)}px) scale(${scale.toFixed(3)})`);
    e.style.transform = e.style.getPropertyValue('--base-tf');
  });
  dealIn(host);
};

/* a new hand should deal, not appear */
function dealIn(host){
  if(host.dataset.turn === String(G.turn)) return;
  host.dataset.turn = String(G.turn);
  [...host.children].forEach((e,i)=>{
    e.classList.add('dealing');
    e.style.animationDelay = (i*52)+'ms';
    setTimeout(()=>e.classList.remove('dealing'), 700+i*52);
  });
}

/* ═══════════ 5. LIVING BACKGROUND ═══════════
   A still screen reads as a mockup. */
document.addEventListener('DOMContentLoaded', ()=>{ GFX.ensure(); GFX.ambient(28); });
