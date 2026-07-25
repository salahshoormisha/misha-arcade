/* MISHANAMEH — the impact layer.
   ────────────────────────────────────────────────────────────────────────
   What separates a game that feels expensive from one that does not is almost
   never the art. It is the quarter-second after you press the button: the
   freeze, the flash, the shake, the number that punches out and arcs away,
   the dust that keeps moving after everything else has stopped.

   One canvas over everything, one particle pool, one rAF that sleeps when
   there is nothing to draw. Additive blending throughout, because gold leaf
   on lapis is a light effect, not a paint effect.

   Vocabulary is Persian rather than generic: sparks are gold leaf, blood is
   pomegranate, block is turquoise glaze, Farr is a halo of chased silver. */

const GFX = (function(){

let cv, g, W=0, H=0, DPR=1, running=false, last=0;
let shakeMag = 0, shakeDecay = 0, hitstop = 0;
const P  = [];             // particles
const FX = [];             // rings, slashes, numbers, flashes
const MAXP = 520;          // this runs on an 8 GB laptop; keep the pool honest

/* ── palettes ─────────────────────────────────────────────────────────── */
const GOLD  = ['#fff4cf','#ffd980','#e0a92e','#b8801a'];
const POM   = ['#ffd0c4','#ff7a58','#c9412b','#7d1f18'];
const TURQ  = ['#d9fffb','#7fe6e0','#2e9c9c','#14595e'];
const LAPIS = ['#cdd8ff','#7f96ff','#2f46c9','#131a4a'];
const BONE  = ['#ffffff','#f3e6cd','#c9b48a','#8a7a5c'];
const VEN   = ['#e8ffd0','#a8e878','#4fae3a','#215c1c'];
const pick  = a => a[(Math.random()*a.length)|0];

/* ── easings ──────────────────────────────────────────────────────────── */
const outCubic = t => 1-Math.pow(1-t,3);
const outQuint = t => 1-Math.pow(1-t,5);
const outBack  = t => { const c=1.9; return 1 + (c+1)*Math.pow(t-1,3) + c*Math.pow(t-1,2); };
const inQuad   = t => t*t;

/* ── the canvas ───────────────────────────────────────────────────────── */
function ensure(){
  if(cv) return true;
  cv = document.createElement('canvas');
  cv.id = 'gfxcanvas';
  cv.setAttribute('aria-hidden','true');
  document.body.appendChild(cv);
  size();
  addEventListener('resize', size);
  return true;
}
function size(){
  if(!cv) return;
  DPR = Math.min(2, devicePixelRatio||1);
  W = innerWidth; H = innerHeight;
  cv.width = Math.round(W*DPR); cv.height = Math.round(H*DPR);
  cv.style.width = W+'px'; cv.style.height = H+'px';
  g = cv.getContext('2d');
  g.setTransform(DPR,0,0,DPR,0,0);
}
function on(){ return !(typeof ART!=='undefined' && ART.reduced) && !(typeof SAVE!=='undefined' && SAVE.noFx); }

/* ── geometry helpers ─────────────────────────────────────────────────── */
function centre(elm){
  if(!elm) return {x:W/2, y:H/2, w:80, h:80};
  const r = (elm.getBoundingClientRect ? elm.getBoundingClientRect() : elm);
  return { x:r.left+r.width/2, y:r.top+r.height/2, w:r.width, h:r.height };
}
const node = sel => (typeof sel==='string' ? document.querySelector(sel) : sel);

/* ── the pool ─────────────────────────────────────────────────────────── */
function spawn(o){
  if(P.length >= MAXP) P.shift();
  P.push(Object.assign({
    x:0,y:0,vx:0,vy:0, life:0, max:1, r:2, col:'#fff',
    grav:0, drag:0.985, spin:0, rot:0, kind:'spark', glow:1, w:1
  }, o));
  wake();
}
function effect(o){ FX.push(Object.assign({life:0,max:1}, o)); wake(); }

function wake(){
  if(running) return;
  running = true; last = performance.now();
  requestAnimationFrame(tick);
}

/* ══════════════════  THE PUBLIC LANGUAGE  ══════════════════ */

/* A hit. Everything a hit should be, in one call. */
function impact(target, opts){
  if(!on()) return;
  ensure();
  const o = Object.assign({ dmg:0, kind:'physical', from:null, big:false }, opts||{});
  const c = centre(node(target));
  const heavy = Math.min(1, o.dmg/30);
  const pal = o.kind==='venom' ? VEN : o.kind==='fire' ? POM : o.kind==='holy' ? GOLD : POM;

  // 1 — the freeze. 40 ms of nothing is what makes a hit land.
  hitstop = Math.max(hitstop, 40 + heavy*70);

  // 2 — the flash, tight and short
  effect({ t:'flash', x:c.x, y:c.y, r:26+heavy*54, max:190, col:'#fff6de' });

  // 3 — the shockwave ring, chased-silver thin
  effect({ t:'ring', x:c.x, y:c.y, r0:8, r1:52+heavy*90, max:420, col:pal[1], w:2.4 });
  if(heavy>0.45) effect({ t:'ring', x:c.x, y:c.y, r0:4, r1:34+heavy*60, max:620, col:'#ffe9b8', w:1.1, delay:70 });

  // 4 — the spray
  const n = 12 + Math.round(heavy*26);
  for(let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2, s = 1.4 + Math.random()*(4+heavy*7);
    spawn({ kind:'spark', x:c.x, y:c.y, vx:Math.cos(a)*s, vy:Math.sin(a)*s-1.1,
            max:420+Math.random()*520, r:1+Math.random()*2.4, col:pick(pal), grav:0.13, drag:0.94 });
  }
  // gold leaf, always a little of it — this is a silver plate being struck
  for(let i=0;i<4+Math.round(heavy*7);i++){
    const a = Math.random()*Math.PI*2, s = 0.8+Math.random()*3;
    spawn({ kind:'leaf', x:c.x, y:c.y, vx:Math.cos(a)*s, vy:Math.sin(a)*s-1.6,
            max:900+Math.random()*700, r:1.6+Math.random()*2.6, col:pick(GOLD),
            grav:0.07, drag:0.975, spin:(Math.random()-.5)*0.3 });
  }

  // 5 — the shake, proportional and short
  shake(2.5 + heavy*9, 190 + heavy*120);

  // 6 — the number
  if(o.dmg>0) num(c, '−'+o.dmg, { col: o.dmg>=20?'#ffd980':'#ffb9a2', size: 21+heavy*20, weight: heavy });
}

/* A blow that lands on you rather than on them. */
function selfHit(dmg){
  if(!on()) return; ensure();
  const heavy = Math.min(1, dmg/25);
  hitstop = Math.max(hitstop, 30+heavy*50);
  shake(3+heavy*8, 220);
  effect({ t:'vignette', max:520, col:'rgba(190,40,26,', peak:0.34+heavy*0.3 });
  for(let i=0;i<10+heavy*12;i++){
    const a = -Math.PI/2 + (Math.random()-.5)*2.4, s=2+Math.random()*5;
    spawn({ kind:'spark', x:W/2+(Math.random()-.5)*180, y:H*0.78, vx:Math.cos(a)*s, vy:Math.sin(a)*s,
            max:520, r:1+Math.random()*2, col:pick(POM), grav:0.16, drag:0.95 });
  }
}

/* Block: turquoise glaze, a hexagon of it. */
function blockGain(target, n){
  if(!on()) return; ensure();
  const c = centre(node(target) || document.querySelector('.blockpip'));
  effect({ t:'ring', x:c.x, y:c.y, r0:6, r1:44, max:520, col:TURQ[1], w:2 });
  effect({ t:'shield', x:c.x, y:c.y, max:640 });
  for(let i=0;i<10;i++){
    const a = -Math.PI/2 + (Math.random()-.5)*1.8;
    spawn({ kind:'spark', x:c.x+(Math.random()-.5)*36, y:c.y+18, vx:Math.cos(a)*1.4, vy:-1.2-Math.random()*2.2,
            max:700, r:1+Math.random()*1.8, col:pick(TURQ), grav:-0.02, drag:0.98 });
  }
  if(n) num(c, '+'+n, { col:TURQ[1], size:19 });
}

/* Farr: the halo tightening. Gold motes rising, always upward, never random. */
function farrGain(n){
  if(!on()) return; ensure();
  const m = document.querySelector('.farrmeter');
  if(!m) return;
  const r = m.getBoundingClientRect();
  for(let i=0;i<6*Math.max(1,n);i++){
    spawn({ kind:'mote', x:r.left+Math.random()*r.width, y:r.top+r.height*0.5,
            vx:(Math.random()-.5)*0.5, vy:-0.5-Math.random()*1.1,
            max:1100+Math.random()*700, r:1+Math.random()*1.6, col:pick(GOLD), drag:0.995, grav:-0.006 });
  }
}

function heal(target, n){
  if(!on()) return; ensure();
  const c = centre(node(target) || document.querySelector('.rb-hp'));
  for(let i=0;i<14;i++){
    spawn({ kind:'mote', x:c.x+(Math.random()-.5)*c.w*0.8, y:c.y+c.h*0.4,
            vx:(Math.random()-.5)*0.6, vy:-0.8-Math.random()*1.5,
            max:900, r:1.2+Math.random()*1.8, col:pick(['#d8ffd0','#8fe07a','#4fae3a']), drag:0.99 });
  }
  if(n) num(c, '+'+n, { col:'#8fe07a', size:19 });
}

/* Something dies. The plate shatters into leaf and goes dark. */
function death(target){
  if(!on()) return; ensure();
  const c = centre(node(target));
  hitstop = Math.max(hitstop, 90);
  shake(9, 340);
  effect({ t:'ring', x:c.x, y:c.y, r0:10, r1:150, max:820, col:'#ffe9b8', w:2.6 });
  effect({ t:'flash', x:c.x, y:c.y, r:90, max:300, col:'#fff2d4' });
  for(let i=0;i<46;i++){
    const a = Math.random()*Math.PI*2, s=1+Math.random()*6;
    spawn({ kind:'leaf', x:c.x+(Math.random()-.5)*c.w*0.5, y:c.y+(Math.random()-.5)*c.h*0.5,
            vx:Math.cos(a)*s, vy:Math.sin(a)*s-2.4, max:1500+Math.random()*900,
            r:1.6+Math.random()*3.4, col:pick(i%3?GOLD:BONE), grav:0.11, drag:0.982,
            spin:(Math.random()-.5)*0.34 });
  }
}

/* INVOKE. The one moment in a fight that should stop the room. */
function invoke(){
  if(!on()) return; ensure();
  hitstop = Math.max(hitstop, 200);
  shake(14, 900);
  effect({ t:'godray', max:1500 });
  effect({ t:'flash', x:W/2, y:H*0.42, r:Math.max(W,H)*0.7, max:760, col:'#fff6de' });
  effect({ t:'ring', x:W/2, y:H*0.42, r0:20, r1:Math.max(W,H)*0.62, max:1150, col:'#ffd980', w:3.4 });
  effect({ t:'ring', x:W/2, y:H*0.42, r0:10, r1:Math.max(W,H)*0.45, max:1400, col:'#fff4cf', w:1.6, delay:140 });
  for(let i=0;i<110;i++){
    const a = Math.random()*Math.PI*2, s = 2+Math.random()*9;
    spawn({ kind:'leaf', x:W/2, y:H*0.42, vx:Math.cos(a)*s, vy:Math.sin(a)*s,
            max:1700+Math.random()*1100, r:1.4+Math.random()*3.2, col:pick(GOLD),
            grav:0.045, drag:0.985, spin:(Math.random()-.5)*0.4 });
  }
  // feathers, drifting down long after the noise has stopped
  for(let i=0;i<16;i++){
    spawn({ kind:'feather', x:Math.random()*W, y:-30-Math.random()*260,
            vx:(Math.random()-.5)*0.7, vy:0.5+Math.random()*0.8,
            max:5200, r:8+Math.random()*10, col:pick(['#ffd980','#fff4cf','#e0a92e']),
            drag:1, spin:(Math.random()-.5)*0.02, phase:Math.random()*6.28 });
  }
}

/* A card leaves your hand and goes somewhere. */
function cast(fromEl, toEl, kind){
  if(!on()) return; ensure();
  const a = centre(node(fromEl)), b = centre(node(toEl));
  const pal = kind==='attack' ? POM : kind==='power' ? GOLD : TURQ;
  effect({ t:'bolt', x0:a.x, y0:a.y, x1:b.x, y1:b.y, max:280, col:pal[1] });
  for(let i=0;i<14;i++){
    const t = Math.random();
    spawn({ kind:'spark', x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t,
            vx:(Math.random()-.5)*1.6, vy:(Math.random()-.5)*1.6,
            max:420, r:1+Math.random()*1.6, col:pick(pal), drag:0.95 });
  }
}

/* A number that punches out and arcs away. */
function num(cOrEl, txt, opts){
  if(!on()) return; ensure();
  const c = cOrEl && cOrEl.x!=null ? cOrEl : centre(node(cOrEl));
  const o = Object.assign({col:'#ffd980', size:20, weight:0}, opts||{});
  effect({ t:'num', x:c.x+(Math.random()-.5)*22, y:c.y-c.h*0.18, txt:String(txt),
           col:o.col, size:o.size, vy:-1.5-o.weight*1.2, vx:(Math.random()-.5)*0.9, max:1150 });
}

function shake(mag, ms){
  if(!on()) return;
  shakeMag = Math.max(shakeMag, mag);
  shakeDecay = mag / Math.max(60, ms||300);
  wake();
}

/* dust that always exists, so the screen is never dead */
function ambient(n){
  if(!on()) return; ensure();
  for(let i=0;i<(n||1);i++)
    spawn({ kind:'dust', x:Math.random()*W, y:H+8, vx:(Math.random()-.5)*0.16, vy:-0.06-Math.random()*0.14,
            max:16000, r:0.5+Math.random()*1.2, col:'rgba(224,169,46,0.5)', drag:1, glow:0.5 });
}

/* ══════════════════  THE LOOP  ══════════════════ */
function tick(now){
  const raw = Math.min(48, now-last); last = now;
  // hitstop freezes the simulation but not the clock, so it reads as weight
  let dt = raw;
  if(hitstop>0){ hitstop -= raw; dt = raw*0.08; }

  g.clearRect(0,0,W,H);
  g.save();

  // screen shake — applied to the canvas AND to the DOM, so they move together
  if(shakeMag>0.05){
    const sx=(Math.random()-.5)*shakeMag, sy=(Math.random()-.5)*shakeMag;
    g.translate(sx,sy);
    const app=document.getElementById('app');
    if(app) app.style.transform = `translate(${sx.toFixed(2)}px,${sy.toFixed(2)}px)`;
    shakeMag -= shakeDecay*raw;
    if(shakeMag<=0.05){ shakeMag=0; if(app) app.style.transform=''; }
  }

  g.globalCompositeOperation = 'lighter';

  /* particles */
  for(let i=P.length-1;i>=0;i--){
    const p = P[i];
    p.life += dt;
    if(p.life>=p.max){ P.splice(i,1); continue; }
    const t = p.life/p.max;
    p.vy += p.grav*(dt/16.7);
    p.vx *= Math.pow(p.drag, dt/16.7);
    p.vy *= Math.pow(p.drag, dt/16.7);
    p.x += p.vx*(dt/16.7); p.y += p.vy*(dt/16.7);
    p.rot += p.spin*(dt/16.7);
    const a = (1-t)*(p.glow==null?1:p.glow);

    if(p.kind==='leaf'){
      g.save(); g.globalAlpha=a; g.translate(p.x,p.y); g.rotate(p.rot);
      g.fillStyle=p.col; g.fillRect(-p.r, -p.r*0.34, p.r*2, p.r*0.68);
      g.restore();
    } else if(p.kind==='feather'){
      p.phase += 0.018*(dt/16.7);
      const sway = Math.sin(p.phase)*0.9;
      p.x += sway*(dt/16.7);
      g.save(); g.globalAlpha=a*0.8; g.translate(p.x,p.y); g.rotate(p.rot+sway*0.22);
      g.fillStyle=p.col; g.beginPath();
      g.ellipse(0,0,p.r*0.32,p.r,0,0,6.2832); g.fill();
      g.strokeStyle='rgba(255,255,255,.5)'; g.lineWidth=0.6;
      g.beginPath(); g.moveTo(0,-p.r); g.lineTo(0,p.r); g.stroke();
      g.restore();
    } else if(p.kind==='mote' || p.kind==='dust'){
      g.globalAlpha=a*0.9;
      g.fillStyle=p.col;
      g.beginPath(); g.arc(p.x,p.y,p.r,0,6.2832); g.fill();
    } else {
      // spark — a short streak in its direction of travel, which reads faster
      const sp = Math.hypot(p.vx,p.vy);
      g.globalAlpha=a;
      g.strokeStyle=p.col; g.lineWidth=p.r; g.lineCap='round';
      g.beginPath(); g.moveTo(p.x,p.y);
      g.lineTo(p.x-p.vx*Math.min(3.4, 1+sp*0.4), p.y-p.vy*Math.min(3.4, 1+sp*0.4));
      g.stroke();
    }
  }

  /* one-off effects */
  for(let i=FX.length-1;i>=0;i--){
    const f = FX[i];
    if(f.delay>0){ f.delay -= dt; continue; }
    f.life += dt;
    if(f.life>=f.max){ FX.splice(i,1); continue; }
    const t = f.life/f.max;

    if(f.t==='ring'){
      const r = f.r0 + (f.r1-f.r0)*outQuint(t);
      g.globalAlpha=(1-t)*0.85; g.strokeStyle=f.col; g.lineWidth=f.w*(1-t*0.7);
      g.beginPath(); g.arc(f.x,f.y,r,0,6.2832); g.stroke();
    }
    else if(f.t==='flash'){
      const r = f.r*(0.4+outCubic(t)*0.6);
      const grd = g.createRadialGradient(f.x,f.y,0,f.x,f.y,r);
      grd.addColorStop(0, f.col); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha=(1-t)*(1-t); g.fillStyle=grd;
      g.beginPath(); g.arc(f.x,f.y,r,0,6.2832); g.fill();
    }
    else if(f.t==='shield'){
      // a hexagon of glaze, drawn once and dissolving
      g.globalAlpha=(1-t)*0.55; g.strokeStyle=TURQ[0]; g.lineWidth=1.6;
      const R = 26+outCubic(t)*16;
      g.beginPath();
      for(let k=0;k<=6;k++){ const a=k/6*6.2832-Math.PI/2; const px=f.x+Math.cos(a)*R, py=f.y+Math.sin(a)*R;
        k?g.lineTo(px,py):g.moveTo(px,py); }
      g.closePath(); g.stroke();
    }
    else if(f.t==='bolt'){
      const p = outCubic(t);
      const hx = f.x0+(f.x1-f.x0)*p, hy = f.y0+(f.y1-f.y0)*p;
      const tx = f.x0+(f.x1-f.x0)*Math.max(0,p-0.28), ty = f.y0+(f.y1-f.y0)*Math.max(0,p-0.28);
      g.globalAlpha=(1-t*t)*0.95; g.strokeStyle=f.col; g.lineWidth=3.2*(1-t*0.5); g.lineCap='round';
      g.beginPath(); g.moveTo(tx,ty); g.lineTo(hx,hy); g.stroke();
      g.globalAlpha=(1-t)*0.7; g.fillStyle='#fff6de';
      g.beginPath(); g.arc(hx,hy,3.4*(1-t*0.4),0,6.2832); g.fill();
    }
    else if(f.t==='num'){
      const pop = t<0.16 ? outBack(t/0.16) : 1;
      const y = f.y + f.vy*(f.life/16.7) + 0.0016*Math.pow(f.life,1.35);
      const x = f.x + f.vx*(f.life/16.7);
      g.save();
      g.globalCompositeOperation='source-over';
      g.globalAlpha = t<0.7 ? 1 : 1-(t-0.7)/0.3;
      g.translate(x,y); g.scale(pop,pop);
      g.font = `700 ${f.size}px ${getComputedStyle(document.documentElement).getPropertyValue('--serif')||'Georgia,serif'}`;
      g.textAlign='center'; g.textBaseline='middle';
      g.lineWidth=4; g.strokeStyle='rgba(6,8,26,.85)'; g.strokeText(f.txt,0,0);
      g.fillStyle=f.col; g.fillText(f.txt,0,0);
      g.restore();
    }
    else if(f.t==='vignette'){
      g.save(); g.globalCompositeOperation='source-over';
      const grd = g.createRadialGradient(W/2,H/2,Math.min(W,H)*0.22, W/2,H/2,Math.max(W,H)*0.72);
      const a = f.peak*(1-t);
      grd.addColorStop(0,'rgba(0,0,0,0)'); grd.addColorStop(1, f.col+a.toFixed(3)+')');
      g.fillStyle=grd; g.fillRect(0,0,W,H); g.restore();
    }
    else if(f.t==='godray'){
      // shafts from above, rotating slowly — the Simurgh arriving
      const a = (1-t);
      g.save(); g.translate(W/2, -H*0.16); g.globalAlpha = a*0.3;
      for(let k=0;k<11;k++){
        const ang = (k/11)*6.2832 + t*0.5;
        g.save(); g.rotate(ang);
        const grd = g.createLinearGradient(0,0,0,H*1.5);
        grd.addColorStop(0,'rgba(255,232,170,.85)'); grd.addColorStop(1,'rgba(255,232,170,0)');
        g.fillStyle=grd;
        g.beginPath(); g.moveTo(0,0); g.lineTo(-34,H*1.5); g.lineTo(34,H*1.5); g.closePath(); g.fill();
        g.restore();
      }
      g.restore();
    }
  }

  g.restore();

  if(P.length || FX.length || shakeMag>0.05 || hitstop>0) requestAnimationFrame(tick);
  else { running=false; g.clearRect(0,0,W,H); }
}

/* a backgrounded tab freezes rAF mid-frame and leaves half an explosion
   painted on the glass; wipe it when we go away and start clean coming back */
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState !== 'visible'){
    P.length = 0; FX.length = 0; shakeMag = 0; hitstop = 0;
    const app = document.getElementById('app'); if(app) app.style.transform='';
    if(g) g.clearRect(0,0,W,H);
    running = false;
  }
});

/* a slow trickle of dust so a still screen still breathes */
setInterval(()=>{ if(document.visibilityState==='visible' && on() && cv && P.length<90) ambient(1); }, 900);

return { impact, selfHit, blockGain, farrGain, heal, death, invoke, cast, num, shake, ambient,
         ensure, get busy(){ return running; } };
})();
