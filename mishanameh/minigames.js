/* MISHANAMEH — THE CHINVAT BRIDGE.

   A set-piece that is not a card game. Nothing here uses the deck, the hand or
   the energy; it is a canvas, a bridge and your own conscience coming the
   other way.

   The Zoroastrian afterlife is a walk. On the fourth day after death the soul
   comes to the Činwad puhl — the Bridge of the Separator — over the abyss.
   Halfway across it meets its own daēnā: everything it thought and said and
   did, grown into a person. For the just she is a young woman of astonishing
   beauty and the bridge is nine spear-lengths broad. For the unjust she wears
   the same face at a different angle, and the bridge turns edge-on, thin as a
   razor's edge, and does not widen again.

   So the mini-game is a balancing walk. Good thoughts, good words, good deeds
   — the three-part Zoroastrian formula — appear as three lights you can catch
   on the way over, and each one you take widens the plank under you. The wind
   is not fair and does not intend to be.                                     */

const MINIGAME = (()=>{

const TAU = Math.PI*2;
let cv, g, W, H, DPR=1, raf=null, st=null, onDone=null;

/* ═══════════  the walk  ═══════════ */
function reset(diff){
  st = {
    t:0, x:0.5, vx:0, prog:0, dead:false, won:false,
    width: 1.0,                 // multiplier on the plank's half-width
    deeds: 0, caught:[],
    lights: [],
    wind: 0, windT: 0,
    diff: diff||1,
    shake: 0, flash: 0,
    started: false,
  };
  // three lights: good thoughts, good words, good deeds
  const names = [
    {k:'thought', fa:'اندیشهٔ نیک', en:'GOOD THOUGHT', col:'#9fd8f0'},
    {k:'word',    fa:'گفتار نیک',  en:'GOOD WORD',    col:'#ffe0a0'},
    {k:'deed',    fa:'کردار نیک',  en:'GOOD DEED',    col:'#8fe07a'},
  ];
  names.forEach((n,i)=>{
    st.lights.push({ ...n, at: 0.20 + i*0.24 + Math.random()*0.06,
      off: (Math.random()*2-1)*0.62, got:false });
  });
}

/* the plank half-width at a given point along the crossing, 0..1.
   It narrows to a razor in the middle and opens again at the far end — but
   only for someone who has been collecting. */
function halfWidth(p){
  const pinch = 1 - Math.pow(Math.sin(Math.PI*p), 1.5)*0.92;
  return (0.045 + 0.30*pinch) * st.width;
}

function step(dt){
  if(!st.started) return;
  st.t += dt;

  // the wind changes its mind on its own schedule
  st.windT -= dt;
  if(st.windT<=0){ st.windT = 0.8+Math.random()*1.4; st.wind = (Math.random()*2-1)*0.55*st.diff; }

  const speed = 0.085 * (1 + 0.16*st.diff);
  st.prog = Math.min(1, st.prog + speed*dt);

  st.vx += st.wind*dt*1.5;
  st.vx *= 0.94;
  st.x += st.vx*dt;

  // lights
  st.lights.forEach(L=>{
    if(L.got) return;
    const lx = 0.5 + L.off*halfWidth(L.at)*2.4;
    if(Math.abs(st.prog-L.at)<0.022 && Math.abs(st.x-lx)<0.075){
      L.got = true; st.deeds++; st.caught.push(L);
      st.width += 0.42; st.flash = 0.45;
      if(typeof sfx==='function') sfx('get');
    }
  });

  const hw = halfWidth(st.prog);
  if(Math.abs(st.x-0.5) > hw){
    st.dead = true; st.started=false;
    if(typeof sfx==='function') sfx('lose');
    setTimeout(()=>finish(false), 1100);
  }
  if(st.prog>=1 && !st.dead){
    st.won = true; st.started=false;
    if(typeof sfx==='function') sfx('win');
    setTimeout(()=>finish(true), 1400);
  }
  if(st.shake>0) st.shake = Math.max(0, st.shake-dt*3);
  if(st.flash>0) st.flash = Math.max(0, st.flash-dt*2);
}

/* ═══════════  drawing  ═══════════ */
function draw(){
  const p = st.prog, hw = halfWidth(p);
  g.setTransform(DPR,0,0,DPR,0,0);
  g.clearRect(0,0,W,H);

  // the abyss: a vertical gradient that gets no better the longer you look
  const sky = g.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#0a0d22'); sky.addColorStop(0.42,'#141033');
  sky.addColorStop(0.72,'#0a0714'); sky.addColorStop(1,'#000000');
  g.fillStyle=sky; g.fillRect(0,0,W,H);

  // stars, and a few of them are not stars
  for(let i=0;i<70;i++){
    const sx=(i*97.3)%W, sy=((i*57.7)%(H*0.55));
    const tw = 0.35+0.65*Math.abs(Math.sin(st.t*0.7+i));
    g.globalAlpha = 0.10+0.42*tw;
    g.fillStyle = i%13===0 ? '#ffb0a0' : '#dfe6ff';
    g.fillRect(sx, sy, 1.6, 1.6);
  }
  g.globalAlpha=1;

  const cx = W/2, horizon = H*0.42;
  g.save();
  if(st.shake>0) g.translate((Math.random()-.5)*st.shake*16,(Math.random()-.5)*st.shake*16);

  // the bridge, in one-point perspective: near edge wide at the bottom,
  // vanishing at the horizon
  const nearW = W*0.5*hw*2.2, farW = Math.max(2, nearW*0.10);
  const drift = (st.x-0.5)*W*0.55;
  g.beginPath();
  g.moveTo(cx-nearW-drift, H);
  g.lineTo(cx-farW-drift*0.16, horizon);
  g.lineTo(cx+farW-drift*0.16, horizon);
  g.lineTo(cx+nearW-drift, H);
  g.closePath();
  const bg = g.createLinearGradient(0,H,0,horizon);
  bg.addColorStop(0,'#e8dfc8'); bg.addColorStop(0.45,'#b9ad93'); bg.addColorStop(1,'#4a4436');
  g.fillStyle=bg; g.fill();
  g.strokeStyle='rgba(224,169,46,.75)'; g.lineWidth=2; g.stroke();

  // planks running away from you
  g.save(); g.clip();
  for(let i=0;i<26;i++){
    const t = i/26, yy = H - Math.pow(t,1.9)*(H-horizon);
    g.globalAlpha = 0.28*(1-t);
    g.strokeStyle='#2e2a1d'; g.lineWidth=1.4;
    g.beginPath(); g.moveTo(0,yy); g.lineTo(W,yy); g.stroke();
  }
  g.restore(); g.globalAlpha=1;

  // the light of the lights, still to come
  st.lights.forEach(L=>{
    if(L.got || L.at < p-0.02) return;
    const rel = (L.at - p);
    if(rel>0.55) return;
    const t = 1 - rel/0.55;
    const yy = horizon + Math.pow(t,1.9)*(H-horizon);
    const lw = (0.5 + L.off*halfWidth(L.at)*2.4);
    const xx = cx + (lw-0.5)*W*Math.pow(t,1.6)*1.15 - drift*Math.pow(t,1.6);
    const r = 5+22*t;
    const gr = g.createRadialGradient(xx,yy,0,xx,yy,r*2.2);
    gr.addColorStop(0, L.col); gr.addColorStop(0.35, L.col+'aa'); gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gr; g.beginPath(); g.arc(xx,yy,r*2.2,0,TAU); g.fill();
    g.fillStyle='#fff'; g.globalAlpha=.85;
    g.beginPath(); g.arc(xx,yy,r*0.30,0,TAU); g.fill(); g.globalAlpha=1;
    if(t>0.55){
      g.font='600 11px ui-sans-serif,system-ui'; g.textAlign='center';
      g.fillStyle=L.col; g.globalAlpha=(t-0.55)/0.45;
      g.fillText(L.en, xx, yy-r*1.5); g.globalAlpha=1;
    }
  });

  // the far end: the daēnā, waiting, becoming visible as you get close
  if(p>0.55){
    const a = Math.min(1,(p-0.55)/0.45);
    const scale = 0.4+1.5*a;
    g.save();
    g.translate(cx - drift*0.16, horizon - 6);
    g.globalAlpha = a;
    const kind = st.deeds>=2 ? 'fair' : st.deeds===1 ? 'plain' : 'grim';
    daena(g, scale*38, kind, st.t);
    g.restore();
  }

  g.restore();

  // vignette + the flash when you take a light
  const vg = g.createRadialGradient(W/2,H*0.5,H*0.22,W/2,H*0.5,H*0.85);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.72)');
  g.fillStyle=vg; g.fillRect(0,0,W,H);
  if(st.flash>0){ g.fillStyle=`rgba(255,246,216,${st.flash*0.5})`; g.fillRect(0,0,W,H); }

  // how far across, and how close to the edge
  const near = 1 - Math.min(1, Math.abs(st.x-0.5)/hw);
  g.fillStyle='rgba(0,0,0,.45)'; g.fillRect(0,0,W,26);
  g.fillStyle = near<0.28 ? '#ff7a5a' : '#e0a92e';
  g.fillRect(0,0,W*p,3);
  g.font='600 11px ui-monospace,monospace'; g.textAlign='left';
  g.fillStyle='#cfc6ae';
  g.fillText(`ACROSS ${Math.round(p*100)}%`, 10, 17);
  g.textAlign='right';
  g.fillText(st.deeds+'/3 TAKEN', W-10, 17);
  g.textAlign='center';
  g.fillStyle = near<0.28 ? '#ff7a5a' : '#8b8398';
  g.fillText(near<0.28 ? 'THE EDGE' : 'STEADY', W/2, 17);

  if(!st.started && !st.dead && !st.won){
    g.fillStyle='rgba(0,0,0,.62)'; g.fillRect(0,0,W,H);
    g.textAlign='center'; g.fillStyle='#fff3d4';
    g.font='700 22px ui-sans-serif,system-ui';
    g.fillText('THE BRIDGE OF THE SEPARATOR', W/2, H*0.40);
    g.font='400 13px ui-sans-serif,system-ui'; g.fillStyle='#cfc6ae';
    g.fillText('Hold ← and → (or drag) to keep your balance.', W/2, H*0.48);
    g.fillText('Take the three lights. Each one widens the plank.', W/2, H*0.535);
    g.font='600 13px ui-sans-serif,system-ui'; g.fillStyle='#e0a92e';
    g.fillText('CLICK TO STEP ON', W/2, H*0.62);
  }
  if(st.dead){
    g.fillStyle='rgba(30,0,0,.55)'; g.fillRect(0,0,W,H);
    g.textAlign='center'; g.fillStyle='#ffb9a4'; g.font='700 22px ui-sans-serif,system-ui';
    g.fillText('THE BRIDGE TURNS EDGE‑ON', W/2, H*0.5);
  }
  if(st.won){
    g.fillStyle='rgba(255,246,216,.14)'; g.fillRect(0,0,W,H);
    g.textAlign='center'; g.fillStyle='#fff3d4'; g.font='700 22px ui-sans-serif,system-ui';
    g.fillText('NINE SPEARS WIDE', W/2, H*0.5);
  }
}

/* the daēnā — the same figure either way, which is the point */
function daena(g, s, kind, t){
  const P = kind==='fair'  ? {hi:'#fffaf0',mid:'#e6d9b8',lo:'#9c8f6f',line:'#2a2418'}
          : kind==='plain' ? {hi:'#dcdce4',mid:'#9a9aa8',lo:'#55555f',line:'#17171d'}
          :                  {hi:'#8e8496',mid:'#4a4352',lo:'#241f28',line:'#000000'};
  const H_ = PLATE._helpers;
  g.save(); g.scale(s/40, s/40);
  const sway = Math.sin(t*1.1)*2.2;
  g.translate(sway, 0);
  // halo, only for the ones who earned it
  if(kind==='fair'){
    const gr=g.createRadialGradient(0,-52,2,0,-52,54);
    gr.addColorStop(0,'rgba(255,246,216,.65)'); gr.addColorStop(1,'rgba(255,246,216,0)');
    g.fillStyle=gr; g.beginPath(); g.arc(0,-52,54,0,TAU); g.fill();
  }
  H_.figure(g,[[-15,-42],[0,-48],[15,-42],[22,10],[26,60],[0,66],[-26,60],[-22,10]],P,{lw:1.6});
  for(let i=-3;i<=3;i++) H_.chase(g,[[i*5,-28],[i*6,14],[i*7,56]],P,1.1);
  // arms, held out — she is meeting you
  H_.figure(g, H_.ribbon(H_.spine([[-12,-38],[-30,-18],[-38,4]],10), t2=>9-3*t2), P, {lw:1.4});
  H_.figure(g, H_.ribbon(H_.spine([[12,-38],[30,-18],[38,4]],10), t2=>9-3*t2), P, {lw:1.4});
  // hair
  H_.figure(g,[[-13,-56],[-26,-40],[-22,-4],[-12,-30]],{...P,hi:P.mid,mid:P.lo,lo:P.line},{lw:1.4});
  H_.figure(g,[[13,-56],[26,-40],[22,-4],[12,-30]],{...P,hi:P.mid,mid:P.lo,lo:P.line},{lw:1.4});
  H_.head(g,P,0,-56,13,'human',0,()=>0.5);
  g.restore();
}

/* ═══════════  loop & input  ═══════════ */
let keys={}, dragging=false;
/* Size the backing store to the CSS box at device resolution. Called at setup
   and re-checked every frame: a canvas that loses its dimensions renders into
   a 300×150 default and the whole scene ends up in the top-left corner, which
   is exactly what happened the first time. */
function sizeCanvas(){
  if(!cv) return;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = Math.max(280, Math.min(760, (window.innerWidth||800) - 20));
  H = Math.max(220, Math.min(520, (window.innerHeight||600) - 90));
  const wantW = Math.round(W*DPR), wantH = Math.round(H*DPR);
  if(cv.width !== wantW || cv.height !== wantH){
    cv.width = wantW; cv.height = wantH;
  }
  cv.style.width = W+'px'; cv.style.height = H+'px';
  g = cv.getContext('2d');
  g.setTransform(DPR,0,0,DPR,0,0);
}

function loop(ts){
  if(!st) return;
  raf = requestAnimationFrame(loop);
  if(!cv || !cv.isConnected){ return; }
  if(cv.width !== Math.round(W*DPR) || cv.height !== Math.round(H*DPR)) sizeCanvas();
  const now = ts/1000;
  const dt = Math.min(0.05, now - (st.last||now)); st.last = now;
  if(st.started){
    const k = (keys.ArrowLeft?-1:0) + (keys.ArrowRight?1:0);
    st.vx += k*dt*1.05;
  }
  step(dt);
  draw();
}

function finish(won){
  cleanup();
  if(onDone) onDone({won, deeds: st.deeds, caught: st.caught.map(c=>c.en)});
}
function cleanup(){
  cancelAnimationFrame(raf); raf=null;
  window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
  const host = document.getElementById('mg');
  if(host) host.remove();
}
function kd(e){ if(/Arrow/.test(e.key)){ e.preventDefault(); keys[e.key]=true; } }
function ku(e){ keys[e.key]=false; }

/* ═══════════  public  ═══════════ */
function chinvat(diff, done){
  onDone = done;
  reset(diff);
  const host = document.createElement('div');
  host.id='mg'; host.className='mghost';
  cv = document.createElement('canvas');
  host.appendChild(cv);
  document.body.appendChild(host);
  sizeCanvas();

  cv.addEventListener('pointerdown', (e)=>{
    if(!st.started && !st.dead && !st.won){ st.started=true; return; }
    dragging=true; cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', (e)=>{
    if(!dragging || !st.started) return;
    const r = cv.getBoundingClientRect();
    const want = (e.clientX-r.left)/r.width;
    st.vx += (want - st.x)*0.09;
  });
  cv.addEventListener('pointerup', ()=>{ dragging=false; });
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  keys={};
  raf = requestAnimationFrame(loop);
}

return { chinvat, cleanup };
})();
