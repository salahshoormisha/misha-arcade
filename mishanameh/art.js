/* MISHANAMEH — procedural art.
   Everything here is generated: the girih tiling is real 8-fold Islamic geometry
   (khatam — the "seal" star), the ridgelines are summed sines, the illumination
   corners are hand-plotted arabesque. No image files anywhere in this game. */

const ART = (()=>{

const TAU = Math.PI*2;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 1. GIRIH: the khatam (8-point star) star-and-cross tiling ──
   Points of an {8/3} star polygon alternate between radius R and R·0.4142.
   Corner stars are drawn at all four corners so the tile repeats seamlessly. */
function starPath(ctx, cx, cy, R, points, rot=0){
  const inner = R * (points===8 ? 0.4142 : 0.42);
  ctx.beginPath();
  for(let i=0;i<points*2;i++){
    const rad = i%2 ? inner : R;
    const a = rot + i*Math.PI/points;
    const x = cx + Math.cos(a)*rad, y = cy + Math.sin(a)*rad;
    i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
  }
  ctx.closePath();
}

function girihTile(S=190, stroke='rgba(224,169,46,0.30)', lw=1.15){
  const c = document.createElement('canvas'); c.width=c.height=S;
  const g = c.getContext('2d');
  g.strokeStyle = stroke; g.lineWidth = lw; g.lineJoin='round';

  const R = S*0.245;
  // central khatam
  starPath(g, S/2, S/2, R, 8, Math.PI/8); g.stroke();
  starPath(g, S/2, S/2, R*0.52, 8, 0); g.stroke();
  // corner khatams (wrap seamlessly)
  [[0,0],[S,0],[0,S],[S,S]].forEach(([x,y])=>{ starPath(g,x,y,R,8,Math.PI/8); g.stroke(); });
  // edge crosses
  [[S/2,0],[S/2,S],[0,S/2],[S,S/2]].forEach(([x,y])=>{ starPath(g,x,y,R*0.44,4,Math.PI/4); g.stroke(); });
  // strapwork: rays from each star point toward its neighbour
  g.globalAlpha = 0.55;
  for(let i=0;i<8;i++){
    const a = Math.PI/8 + i*Math.PI/4;
    g.beginPath();
    g.moveTo(S/2+Math.cos(a)*R, S/2+Math.sin(a)*R);
    g.lineTo(S/2+Math.cos(a)*R*1.62, S/2+Math.sin(a)*R*1.62);
    g.stroke();
  }
  g.globalAlpha = 1;
  return c;
}

/* ── 2. RIDGELINES: summed sines, cached per width ── */
function ridge(w, h, amp, seed, base){
  const pts=[];
  for(let x=0;x<=w;x+=4){
    const t = x/w;
    const y = base
      + Math.sin(t*7.1+seed)*amp*0.42
      + Math.sin(t*17.3+seed*2.3)*amp*0.22
      + Math.sin(t*3.1+seed*0.7)*amp*0.5
      + Math.sin(t*41+seed*5)*amp*0.06;
    pts.push([x,y]);
  }
  return pts;
}

/* ── 3. MOODS — one palette per Trial ── */
const MOODS = {
  title:   { sky:['#080d28','#131a4a','#2a2160'], ink:'#e0a92e', ridge:'#0a0f2e', haze:'rgba(224,169,46,.07)' },
  t1:      { sky:['#0a1226','#1b2f3a','#3d5a3a'], ink:'#d8b24a', ridge:'#08101c', haze:'rgba(216,178,74,.07)' },
  t2:      { sky:['#2a1a0c','#7a4b18','#d99a3c'], ink:'#ffe0a0', ridge:'#3a2410', haze:'rgba(255,220,150,.10)' },
  t3:      { sky:['#180509','#5c1114','#b8341c'], ink:'#ffb765', ridge:'#1a0508', haze:'rgba(255,120,50,.10)' },
  t4:      { sky:['#180a25','#4a1442','#9c2f6b'], ink:'#ffb8d8', ridge:'#150720', haze:'rgba(255,150,200,.09)' },
  t5:      { sky:['#07101f','#123049','#2e5f7a'], ink:'#9fd8f0', ridge:'#050c18', haze:'rgba(150,210,240,.08)' },
  t6:      { sky:['#0d0a04','#3a3208','#6b5c12'], ink:'#e8d24a', ridge:'#0a0803', haze:'rgba(230,210,70,.09)' },
  t7:      { sky:['#03040c','#0a0d22','#1b2044'], ink:'#dfe6ff', ridge:'#02030a', haze:'rgba(220,230,255,.08)' },
  t8:      { sky:['#0a0a0c','#241f1c','#4a3a30'], ink:'#ff8a3c', ridge:'#08080a', haze:'rgba(255,120,50,.09)' },
  victory: { sky:['#0b1030','#3a2a5e','#c9a227'], ink:'#fff0c0', ridge:'#0a0d24', haze:'rgba(255,240,190,.12)' },
  death:   { sky:['#06060a','#12121c','#242433'], ink:'#8a8aa0', ridge:'#040406', haze:'rgba(140,140,170,.05)' },
};

/* ── 4. BACKDROP ── */
let cv, ctx, W, H, DPR, pattern, patCanvas, ridgeCache={}, mood=MOODS.title, target=MOODS.title, blend=1;
let motes=[], t0=0, running=false, lastFrame=0;

function lerpHex(a,b,k){
  const pa=parseInt(a.slice(1),16), pb=parseInt(b.slice(1),16);
  const r=Math.round(((pa>>16)&255)*(1-k)+((pb>>16)&255)*k);
  const g=Math.round(((pa>>8)&255)*(1-k)+((pb>>8)&255)*k);
  const bl=Math.round((pa&255)*(1-k)+(pb&255)*k);
  return `rgb(${r},${g},${bl})`;
}
function curSky(i){ return blend>=1 ? mood.sky[i] : lerpHex(target.sky[i], mood.sky[i], blend); }

function resize(){
  DPR = Math.min(2, window.devicePixelRatio||1);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = W*DPR; cv.height = H*DPR; cv.style.width=W+'px'; cv.style.height=H+'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ridgeCache = {};
  motes = [...Array(reduced?0:34)].map(()=>newMote(true));
}
function newMote(any){
  return { x:Math.random()*W, y: any? Math.random()*H : H+10,
           r: Math.random()*1.7+0.5, v: Math.random()*0.26+0.06,
           d: Math.random()*TAU, a: Math.random()*0.5+0.15 };
}

function drawRidges(){
  const key = W+'x'+H;
  if(!ridgeCache[key]){
    ridgeCache[key] = [
      ridge(W,H, H*0.10, 1.7, H*0.74),
      ridge(W,H, H*0.16, 4.2, H*0.84),
    ];
  }
  const layers = ridgeCache[key];
  layers.forEach((pts,i)=>{
    ctx.beginPath(); ctx.moveTo(0,H);
    pts.forEach(([x,y])=>ctx.lineTo(x, y + (i? 0 : -6)));
    ctx.lineTo(W,H); ctx.closePath();
    ctx.fillStyle = i ? mood.ridge : lerpHex(mood.ridge.slice(0,7), '#000000', 0.35);
    ctx.globalAlpha = i? 1 : 0.85;
    ctx.fill(); ctx.globalAlpha=1;
  });
}

function frame(ts){
  if(!running) return;
  requestAnimationFrame(frame);
  if(ts - lastFrame < 32) return;          // ~30fps cap: kind to small laptops
  const dt = Math.min(64, ts-lastFrame); lastFrame = ts;
  t0 += dt*0.001;
  if(blend<1) blend = Math.min(1, blend + dt*0.0011);

  // sky
  const gr = ctx.createLinearGradient(0,0,0,H);
  gr.addColorStop(0, curSky(0)); gr.addColorStop(0.55, curSky(1)); gr.addColorStop(1, curSky(2));
  ctx.fillStyle = gr; ctx.fillRect(0,0,W,H);

  // girih, two parallax layers
  if(pattern){
    ctx.save();
    ctx.globalAlpha = 0.30;
    ctx.translate(-(t0*3.6)%190, -(t0*2.1)%190);
    ctx.fillStyle = pattern; ctx.fillRect(0,0,W+220,H+220);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.translate(W*0.5 - (t0*1.4)%285, H*0.5 - (t0*0.8)%285);
    ctx.scale(1.5,1.5);
    ctx.fillStyle = pattern; ctx.fillRect(-W,-H,(W+300)*1.4,(H+300)*1.4);
    ctx.restore();
  }

  // haze glow behind the action
  const hz = ctx.createRadialGradient(W/2, H*0.42, 0, W/2, H*0.42, Math.max(W,H)*0.55);
  hz.addColorStop(0, mood.haze); hz.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hz; ctx.fillRect(0,0,W,H);

  drawRidges();

  // dust motes
  ctx.fillStyle = mood.ink;
  motes.forEach(m=>{
    m.y -= m.v; m.d += 0.01; m.x += Math.sin(m.d)*0.28;
    if(m.y < -10) Object.assign(m, newMote(false));
    ctx.globalAlpha = m.a * (0.45+0.55*Math.sin(t0*1.5+m.d));
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function init(){
  cv = document.getElementById('bgcanvas'); if(!cv) return;
  ctx = cv.getContext('2d', {alpha:false});
  patCanvas = girihTile(190);
  pattern = ctx.createPattern(patCanvas, 'repeat');
  resize(); window.addEventListener('resize', debounce(resize, 180));
  running = true; lastFrame = performance.now(); requestAnimationFrame(frame);
}
function debounce(f,ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>f(...a),ms); }; }

function setMood(key){
  const m = MOODS[key] || MOODS.title;
  if(m===mood) return;
  target = mood; mood = m; blend = 0;
  document.documentElement.style.setProperty('--mood-ink', m.ink);
}

/* ── 5. ILLUMINATION: arabesque corner ornament (SVG path, plotted by hand) ── */
function orn(size=92, color='var(--gold)'){
  return `<svg class="orn-svg" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
    <g fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round">
      <path d="M2 2 H40 M2 2 V40"/>
      <path d="M8 8 H32 M8 8 V32"/>
      <path d="M8 32 C8 20 20 8 32 8"/>
      <path d="M14 44 C14 26 26 14 44 14" stroke-width="1.1" opacity=".8"/>
      <path d="M32 8 C40 8 44 4 46 2" stroke-width="1.1"/>
      <path d="M8 32 C8 40 4 44 2 46" stroke-width="1.1"/>
      <circle cx="20" cy="20" r="3.4"/>
      <path d="M20 12 L23 20 L20 28 L17 20 Z" opacity=".9"/>
      <path d="M12 20 L20 17 L28 20 L20 23 Z" opacity=".9"/>
      <path d="M36 36 C30 30 34 24 40 26 C46 28 44 36 38 38" stroke-width="1" opacity=".65"/>
    </g></svg>`;
}

/* ── 6. THE SIMURGH — drawn as SVG so she can be animated ── */
function simurgh(size=340){
  return `<svg class="bird" viewBox="0 0 400 260" width="${size}" aria-hidden="true">
    <defs>
      <linearGradient id="plume" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fff6d8"/><stop offset="38%" stop-color="#e0a92e"/>
        <stop offset="68%" stop-color="#c9412b"/><stop offset="100%" stop-color="#2e9c9c"/>
      </linearGradient>
      <filter id="soft"><feGaussianBlur stdDeviation="3.4" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <g filter="url(#soft)" fill="none" stroke="url(#plume)" stroke-width="2.4" stroke-linecap="round">
      <path d="M200 150 C186 120 150 96 96 88 C58 82 26 92 8 112 C44 108 70 114 92 128 C64 130 42 142 30 160 C60 148 86 148 108 156 C88 164 74 178 68 194 C96 176 124 170 152 174"/>
      <path d="M200 150 C214 120 250 96 304 88 C342 82 374 92 392 112 C356 108 330 114 308 128 C336 130 358 142 370 160 C340 148 314 148 292 156 C312 164 326 178 332 194 C304 176 276 170 248 174"/>
      <path d="M200 150 C196 178 198 206 206 232 C214 208 216 180 212 152"/>
      <path d="M206 232 C196 240 186 244 176 244 M206 232 C220 242 234 246 248 244"/>
      <path d="M200 150 C192 138 190 124 196 112 C202 100 216 96 226 102 C236 108 238 122 232 132 C228 140 216 148 206 150"/>
      <path d="M226 102 C232 92 230 80 222 74 C238 74 248 86 244 100"/>
      <circle cx="212" cy="116" r="3.2" fill="#fff6d8" stroke="none"/>
      <path d="M232 126 L252 130 L232 134" />
      <path d="M150 174 C160 194 178 206 200 208 C222 206 240 194 250 174" stroke-width="1.5" opacity=".75"/>
    </g></svg>`;
}

/* ── 7. PARTICLE BURSTS in DOM (cheap, GPU-composited) ── */
function burst(x, y, opts={}){
  if(reduced) return;
  const host = document.getElementById('fx'); if(!host) return;
  const n = opts.n||14, colors = opts.colors||['#e0a92e','#fff0c0','#c9412b'];
  for(let i=0;i<n;i++){
    const p = document.createElement('i');
    p.className = 'spark';
    const a = Math.random()*TAU, d = (opts.spread||70)*(0.4+Math.random());
    p.style.cssText = `left:${x}px;top:${y}px;background:${colors[(Math.random()*colors.length)|0]};
      --dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d - (opts.lift||18)}px;
      --s:${(Math.random()*0.7+0.5).toFixed(2)};--ms:${(420+Math.random()*420)|0}ms`;
    host.appendChild(p);
    setTimeout(()=>p.remove(), 900);
  }
}

/* ── 8. FEATHER FALL — for the Simurgh invoke ── */
function feathers(n=18){
  if(reduced) return;
  const host = document.getElementById('fx'); if(!host) return;
  for(let i=0;i<n;i++){
    const f = document.createElement('i');
    f.className='feather'; f.textContent='🪶';
    f.style.cssText = `left:${Math.random()*100}vw;--dur:${(2400+Math.random()*2200)|0}ms;
      --delay:${(Math.random()*700)|0}ms;--sway:${(Math.random()*90-45)|0}px;
      --rot:${(Math.random()*720-360)|0}deg;font-size:${(12+Math.random()*16)|0}px`;
    host.appendChild(f);
    setTimeout(()=>f.remove(), 5200);
  }
}

return { init, setMood, orn, simurgh, burst, feathers, girihTile, reduced };
})();

document.addEventListener('DOMContentLoaded', ()=>ART.init());
