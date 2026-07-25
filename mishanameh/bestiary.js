/* MISHANAMEH — BESTIARY ART.
   Every creature in this game is drawn, at runtime, by this file. There are no
   image assets anywhere.

   The house style is the Sasanian silver plate (4th–7th c.): a shallow gilt
   dish, a dark oxidised ground, a beast in profile raised in repoussé and
   chased with a graver, and a rim of beaded "pearls" — the pearl roundel being
   one of the most distinctive pre-Islamic Persian ornaments there is. It went
   out of Iran on silk and turned up woven into vestments in Belgian churches.

   Heroes get the other treatment: Achaemenid low relief, the Persepolis
   limestone panel, figures in strict profile with the square beard and the
   pleated robe, lit from the upper left the way the real stone is at noon.

   Everything is deterministic: same id in, same beast out, forever.          */

const PLATE = (()=>{

const TAU = Math.PI*2;
const cache = new Map();

/* ── deterministic hash → rng, so a creature always looks like itself ── */
function hash(s){ let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function rngFrom(seed){ let a=seed>>>0; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

/* ═══════════════  PALETTES  ═══════════════ */
const HUES = {
  silver:  { hi:'#fbf7ec', mid:'#ddd6c4', lo:'#8f8a7c', line:'#16171c' },
  gilt:    { hi:'#fff2c8', mid:'#e0a92e', lo:'#8a6415', line:'#1a1206' },
  sand:    { hi:'#f6e3bd', mid:'#cfa76b', lo:'#7d6136', line:'#1b1408' },
  bone:    { hi:'#fffaf0', mid:'#e2dccb', lo:'#918b78', line:'#14141a' },
  blood:   { hi:'#ffc9b0', mid:'#c9412b', lo:'#6d1c14', line:'#1a0806' },
  verdi:   { hi:'#cdf3e6', mid:'#2e9c9c', lo:'#16544f', line:'#04140f' },
  rose:    { hi:'#ffd8ea', mid:'#c4577f', lo:'#6b2340', line:'#170610' },
  night:   { hi:'#c9cff0', mid:'#4a4f86', lo:'#22243f', line:'#05060f' },
  flame:   { hi:'#ffe0a0', mid:'#e8722a', lo:'#8a3410', line:'#1a0a03' },
  ash:     { hi:'#dcdce4', mid:'#8b8b98', lo:'#43434e', line:'#0c0c10' },
  ivy:     { hi:'#dbf0b4', mid:'#7aa93f', lo:'#3d5a1e', line:'#0a1204' },
  lapis:   { hi:'#bcd4ff', mid:'#3a5bbf', lo:'#1b2a63', line:'#050a1c' },
  void:    { hi:'#6f7490', mid:'#26293c', lo:'#101220', line:'#000000' },
};

/* the dish itself */
const GROUND = { rim:'#e0a92e', rimDark:'#7a5510', dish0:'#2b2f3a', dish1:'#14161d', dish2:'#0a0b10' };

/* ═══════════════  GEOMETRY HELPERS  ═══════════════ */

/* Catmull-Rom through points → smooth closed or open path. The workhorse:
   almost every organic silhouette in here is a spine plus a width function. */
function curve(g, pts, closed){
  if(pts.length<2) return;
  const p = closed ? [pts[pts.length-1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length-1]];
  g.moveTo(pts[0][0], pts[0][1]);
  for(let i=1;i<p.length-2;i++){
    const [x0,y0]=p[i-1], [x1,y1]=p[i], [x2,y2]=p[i+1], [x3,y3]=p[i+2];
    g.bezierCurveTo(x1+(x2-x0)/6, y1+(y2-y0)/6, x2-(x3-x1)/6, y2-(y3-y1)/6, x2, y2);
  }
  if(closed) g.closePath();
}

/* A tapered ribbon along a spine — necks, tails, serpents, limbs, wings.
   w is either a number or a function of t (0..1 along the spine). */
function ribbon(spine, w){
  const L=[], Rt=[];
  const wf = typeof w==='function' ? w : ()=>w;
  for(let i=0;i<spine.length;i++){
    const p = spine[i];
    const a = spine[Math.max(0,i-1)], b = spine[Math.min(spine.length-1,i+1)];
    let dx=b[0]-a[0], dy=b[1]-a[1];
    const len=Math.hypot(dx,dy)||1; dx/=len; dy/=len;
    const t=i/(spine.length-1), ww=wf(t)/2;
    L.push([p[0]-dy*ww, p[1]+dx*ww]);
    Rt.push([p[0]+dy*ww, p[1]-dx*ww]);
  }
  return L.concat(Rt.reverse());
}

/* bezier-ish spine sampler */
function spine(pts, n=14){
  const out=[];
  for(let i=0;i<=n;i++){
    const t=i/n, seg=t*(pts.length-1), k=Math.min(pts.length-2, Math.floor(seg)), f=seg-k;
    const p0=pts[Math.max(0,k-1)], p1=pts[k], p2=pts[k+1], p3=pts[Math.min(pts.length-1,k+2)];
    const h=(a,b,c,d)=>0.5*((2*b)+(-a+c)*f+(2*a-5*b+4*c-d)*f*f+(-a+3*b-3*c+d)*f*f*f);
    out.push([h(p0[0],p1[0],p2[0],p3[0]), h(p0[1],p1[1],p2[1],p3[1])]);
  }
  return out;
}

function ell(cx,cy,rx,ry,rot=0,n=16){
  const o=[]; for(let i=0;i<n;i++){ const a=i/n*TAU; o.push([cx+Math.cos(a)*rx*Math.cos(rot)-Math.sin(a)*ry*Math.sin(rot),
    cy+Math.cos(a)*rx*Math.sin(rot)+Math.sin(a)*ry*Math.cos(rot)]); } return o;
}

/* ═══════════════  THE METAL LOOK  ═══════════════
   Repoussé: raised from behind, so the top edge catches light and the bottom
   edge pools shadow. We fake it with a vertical gradient fill, a dark contour,
   and a light "lift" line inside the upper contour. */
function figure(g, pts, P, opt={}){
  g.save();
  g.beginPath(); curve(g, pts, true);
  const bb = bbox(pts);
  const gr = g.createLinearGradient(0, bb.y0, 0, bb.y1);
  gr.addColorStop(0,   opt.flat? P.mid : P.hi);
  gr.addColorStop(0.45, P.mid);
  gr.addColorStop(1,   P.lo);
  g.fillStyle = gr; g.fill();
  g.lineJoin='round'; g.lineCap='round';
  g.strokeStyle = P.line; g.lineWidth = opt.lw || 2.1; g.stroke();
  g.restore();
}
function bbox(pts){ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; pts.forEach(([x,y])=>{ x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y); }); return {x0,y0,x1,y1}; }

/* Chasing: an incised line is a dark groove with a bright lip below it. */
function chase(g, pts, P, w=1.3, closed=false){
  g.save(); g.lineCap='round'; g.lineJoin='round';
  g.beginPath(); curve(g, pts, closed);
  g.strokeStyle = P.line; g.globalAlpha=.85; g.lineWidth=w; g.stroke();
  g.translate(0, w*0.85);
  g.beginPath(); curve(g, pts, closed);
  g.strokeStyle = P.hi; g.globalAlpha=.30; g.lineWidth=w*0.8; g.stroke();
  g.restore();
}

/* ═══════════════  THE DISH  ═══════════════ */
function dish(g, S, P, opt={}){
  const c=S/2, r=S*0.475;
  // outer shadow
  g.save();
  g.beginPath(); g.arc(c,c,r,0,TAU);
  const gr=g.createRadialGradient(c-r*0.3, c-r*0.35, r*0.05, c, c, r);
  gr.addColorStop(0, GROUND.dish0); gr.addColorStop(0.62, GROUND.dish1); gr.addColorStop(1, GROUND.dish2);
  g.fillStyle=gr; g.fill();

  // faint radial burnishing, the way a spun dish is scratched
  g.clip();
  g.globalAlpha=.06; g.strokeStyle='#ffffff'; g.lineWidth=.7;
  for(let i=0;i<44;i++){ const a=i/44*TAU; g.beginPath(); g.moveTo(c+Math.cos(a)*r*0.15, c+Math.sin(a)*r*0.15);
    g.lineTo(c+Math.cos(a)*r, c+Math.sin(a)*r); g.stroke(); }
  g.globalAlpha=1;

  // a low horizon inside the dish so the beast has ground to stand on
  if(!opt.noGround){
    g.beginPath(); g.moveTo(c-r, c+r*0.52);
    g.bezierCurveTo(c-r*0.3, c+r*0.42, c+r*0.3, c+r*0.46, c+r, c+r*0.5);
    g.lineTo(c+r, c+r); g.lineTo(c-r, c+r); g.closePath();
    g.fillStyle='rgba(0,0,0,.34)'; g.fill();
  }
  g.restore();

  // gilt rim + beaded pearls
  g.save();
  g.beginPath(); g.arc(c,c,r,0,TAU);
  const rg=g.createLinearGradient(0,0,S,S);
  rg.addColorStop(0,'#fff0c0'); rg.addColorStop(.35,GROUND.rim); rg.addColorStop(.7,GROUND.rimDark); rg.addColorStop(1,'#f0d78a');
  g.strokeStyle=rg; g.lineWidth=Math.max(2, S*0.018); g.stroke();

  const beads = opt.beads===false ? 0 : Math.max(26, Math.round(S*0.30));
  const br = r - S*0.030;
  for(let i=0;i<beads;i++){
    const a=i/beads*TAU;
    const x=c+Math.cos(a)*br, y=c+Math.sin(a)*br, rr=S*0.0115;
    const bg=g.createRadialGradient(x-rr*0.35,y-rr*0.4,rr*0.1,x,y,rr);
    bg.addColorStop(0,'#fff6d8'); bg.addColorStop(.6,GROUND.rim); bg.addColorStop(1,GROUND.rimDark);
    g.beginPath(); g.arc(x,y,rr,0,TAU); g.fillStyle=bg; g.fill();
  }
  g.restore();
}

/* rays behind a boss — the Sasanian royal nimbus */
function nimbus(g, S, P){
  const c=S/2;
  g.save(); g.translate(c,c);
  g.globalAlpha=.20;
  for(let i=0;i<24;i++){
    g.rotate(TAU/24);
    g.beginPath(); g.moveTo(0,0); g.lineTo(S*0.46, -S*0.018); g.lineTo(S*0.46, S*0.018); g.closePath();
    g.fillStyle = i%2 ? P.hi : P.mid; g.fill();
  }
  g.restore();
}

/* ═══════════════  BODY PARTS  ═══════════════ */

/* Every head in this game faces right, in strict profile. That is the
   Achaemenid and Sasanian convention — nobody in Persepolis is drawn looking at
   you — and it also happens to make a far stronger silhouette than three-
   quarter view, which is why the convention lasted twelve hundred years. */
const HEAD_SHAPES = {
  human:  { p:[[-0.95,-0.20],[-0.82,-0.82],[-0.15,-1.10],[0.50,-0.90],[0.78,-0.36],
               [0.70,-0.16],[1.20,0.02],[0.74,0.18],[0.92,0.34],[0.68,0.56],
               [0.05,0.76],[-0.70,0.60],[-1.02,0.22]], eye:[0.30,-0.40], brow:[[-0.30,-0.66],[0.36,-0.62],[0.74,-0.40]] },
  canine: { p:[[-1.00,-0.28],[-0.72,-0.90],[0.00,-0.92],[0.62,-0.66],[1.34,-0.50],[1.82,-0.30],
               [1.86,-0.02],[1.34,0.12],[1.16,0.40],[0.56,0.48],[-0.12,0.62],[-0.88,0.42]],
            eye:[0.26,-0.44], brow:[[-0.34,-0.62],[0.34,-0.60],[0.92,-0.46]] },
  feline: { p:[[-1.02,-0.30],[-0.78,-0.92],[-0.02,-1.00],[0.66,-0.78],[1.16,-0.52],[1.44,-0.24],
               [1.40,0.08],[1.02,0.26],[0.86,0.50],[0.20,0.62],[-0.56,0.58],[-0.96,0.28]],
            eye:[0.34,-0.42], brow:[[-0.36,-0.68],[0.38,-0.68],[0.98,-0.48]] },
  reptile:{ p:[[-0.98,-0.32],[-0.70,-0.86],[0.10,-0.84],[0.96,-0.62],[1.80,-0.42],[2.28,-0.20],
               [2.30,0.04],[1.72,0.20],[1.02,0.34],[0.30,0.50],[-0.52,0.52],[-0.94,0.26]],
            eye:[0.24,-0.44], brow:[[-0.40,-0.60],[0.42,-0.58],[1.20,-0.48]] },
  bird:   { p:[[-0.92,-0.24],[-0.72,-0.84],[-0.04,-1.02],[0.62,-0.80],[0.94,-0.36],
               [0.92,0.06],[0.56,0.42],[-0.10,0.58],[-0.76,0.44]], eye:[0.28,-0.38], brow:null },
  horned: { p:[[-1.00,-0.34],[-0.76,-0.96],[0.04,-1.02],[0.78,-0.80],[1.32,-0.50],[1.52,-0.16],
               [1.34,0.18],[0.84,0.38],[0.72,0.62],[0.06,0.70],[-0.66,0.60],[-1.00,0.26]],
            eye:[0.30,-0.48], brow:[[-0.40,-0.74],[0.44,-0.76],[1.06,-0.54]] },
  blob:   { p:null, eye:[0.24,-0.20], brow:null },
};

function head(g, P, x, y, s, kind, rot=0, rng){
  g.save(); g.translate(x,y); g.rotate(rot);
  const H = HEAD_SHAPES[kind] || HEAD_SHAPES.blob;
  const pts = H.p ? H.p.map(([a,b])=>[a*s, b*s]) : ell(s*.15, 0, s*.98, s*.80);
  figure(g, pts, P);

  // brow ridge, incised — this one line does most of the characterisation
  if(H.brow) chase(g, H.brow.map(([a,b])=>[a*s,b*s]), P, s*.11);

  // muzzle / lip line
  if(kind==='canine'||kind==='reptile'||kind==='feline'||kind==='horned'){
    const L = kind==='reptile'? 2.0 : kind==='canine'? 1.6 : 1.2;
    chase(g, [[-s*.1,s*.10],[s*L*.5,s*.06],[s*L,-s*.06]], P, s*.085);
    g.beginPath(); g.arc(s*(L-0.18), -s*.16, s*.07, 0, TAU); g.fillStyle=P.line; g.globalAlpha=.75; g.fill(); g.globalAlpha=1;
  }

  // the almond eye of the plates — always slightly too large, always alert
  const [ex,ey] = H.eye.map(v=>v*s);
  g.beginPath(); curve(g, [[ex-s*.30,ey],[ex,ey-s*.21],[ex+s*.30,ey],[ex,ey+s*.18]], true);
  g.fillStyle=P.hi; g.fill(); g.strokeStyle=P.line; g.lineWidth=s*.08; g.stroke();
  g.beginPath(); g.arc(ex+s*.05, ey, s*.115, 0, TAU); g.fillStyle=P.line; g.fill();

  // ear, set back
  if(kind==='human'||kind==='horned'){
    g.beginPath(); curve(g, ell(-s*.42, -s*.02, s*.17, s*.24), true);
    g.strokeStyle=P.line; g.lineWidth=s*.075; g.globalAlpha=.8; g.stroke(); g.globalAlpha=1;
  }
  g.restore();
}

/* Old Persian cuneiform: wedges, not chevrons. Each sign is a small cluster of
   filled triangles — vertical, horizontal and angled — which is what the real
   thing looks like at arm's length on the rock at Bīsotūn. */
function wedges(g, x, y, s, rng, col){
  const n = 2 + Math.floor(rng()*3);
  g.fillStyle = col;
  for(let i=0;i<n;i++){
    const k = rng();
    const ox = (rng()-0.5)*s*0.7, oy = (rng()-0.5)*s*1.1;
    g.beginPath();
    if(k<0.45){        // vertical wedge
      g.moveTo(x+ox-s*.16, y+oy-s*.42); g.lineTo(x+ox+s*.16, y+oy-s*.42); g.lineTo(x+ox, y+oy+s*.42);
    } else if(k<0.8){  // horizontal wedge
      g.moveTo(x+ox-s*.42, y+oy-s*.16); g.lineTo(x+ox-s*.42, y+oy+s*.16); g.lineTo(x+ox+s*.42, y+oy);
    } else {           // angle wedge
      g.moveTo(x+ox-s*.34, y+oy-s*.30); g.lineTo(x+ox-s*.10, y+oy-s*.44); g.lineTo(x+ox+s*.30, y+oy+s*.26);
    }
    g.closePath(); g.fill();
  }
}

function ear(g,P,x,y,s,kind,rot){
  g.save(); g.translate(x,y); g.rotate(rot);
  const pts = kind==='tall' ? [[0,0],[-s*.34,-s*1.5],[s*.30,-s*1.35],[s*.36,0]]
            : kind==='round'? [[0,0],[-s*.42,-s*.7],[s*.2,-s*.92],[s*.5,-s*.2]]
            :                 [[0,0],[-s*.3,-s*.85],[s*.36,-s*.75],[s*.34,0]];
  figure(g,pts,P);
  g.restore();
}

function horn(g,P,x,y,s,kind,rot){
  g.save(); g.translate(x,y); g.rotate(rot);
  let sp;
  if(kind==='curl')  sp=spine([[0,0],[s*.55,-s*.9],[s*1.5,-s*1.05],[s*1.9,-s*.35],[s*1.4,s*.15]],16);
  else if(kind==='ram') sp=spine([[0,0],[s*.9,-s*.55],[s*1.4,s*.15],[s*.85,s*.75],[s*.15,s*.45]],16);
  else if(kind==='spike') sp=spine([[0,0],[s*.35,-s*1.2],[s*.55,-s*2.3]],12);
  else sp=spine([[0,0],[s*.4,-s*1.0],[s*1.1,-s*1.7]],12);
  figure(g, ribbon(sp, t=>s*(0.44*(1-t)+0.05)), P);
  // ridging
  for(let i=1;i<5;i++){ const p=sp[Math.floor(sp.length*i/5)];
    g.beginPath(); g.arc(p[0],p[1], s*0.16*(1-i/6), 0, TAU); g.strokeStyle=P.line; g.globalAlpha=.5; g.lineWidth=s*.06; g.stroke(); g.globalAlpha=1; }
  g.restore();
}

function leg(g,P,x,y,s,dir,bend,thick=1){
  const sp=spine([[x,y],[x+dir*s*.18,y+s*.55],[x-dir*s*.10*bend,y+s*1.05],[x+dir*s*.22,y+s*1.5]],12);
  figure(g, ribbon(sp, t=>s*(0.30-0.16*t)*thick), P);
  // hoof/paw
  g.beginPath(); curve(g, ell(x+dir*s*.24, y+s*1.55, s*.24, s*.12), true);
  g.fillStyle=P.lo; g.fill(); g.strokeStyle=P.line; g.lineWidth=1.6; g.stroke();
}

function tail(g,P,x,y,s,kind,rng){
  let sp, w;
  if(kind==='brush'){ sp=spine([[x,y],[x-s*.7,y-s*.25],[x-s*1.5,y-s*.9]],14); w=t=>s*(0.16+0.34*t*t); }
  else if(kind==='whip'){ sp=spine([[x,y],[x-s*.9,y+s*.1],[x-s*1.7,y-s*.6],[x-s*1.9,y-s*1.4]],16); w=t=>s*(0.22*(1-t)+0.03); }
  else if(kind==='sting'){ sp=spine([[x,y],[x-s*.5,y-s*.9],[x+s*.25,y-s*1.8],[x+s*1.0,y-s*1.5]],16); w=t=>s*(0.26*(1-t*0.7)+0.04); }
  else if(kind==='tuft'){ sp=spine([[x,y],[x-s*.8,y-s*.1],[x-s*1.4,y-s*.55]],12); w=t=>s*(0.13+0.20*t*t*t); }
  else return;
  figure(g, ribbon(sp,w), P);
  if(kind==='sting'){ const e=sp[sp.length-1];
    figure(g,[[e[0],e[1]-s*.2],[e[0]+s*.55,e[1]+s*.02],[e[0],e[1]+s*.22]],P); }
}

function wing(g,P,x,y,s,kind,dir=1,rng){
  g.save(); g.translate(x,y); g.scale(dir,1);
  if(kind==='feather'){
    for(let i=0;i<5;i++){
      const a=-0.95+i*0.30, L=s*(1.75-i*0.14);
      const sp=spine([[0,0],[Math.cos(a)*L*.55, Math.sin(a)*L*.55-s*.25],[Math.cos(a)*L, Math.sin(a)*L]],12);
      figure(g, ribbon(sp, t=>s*(0.30-0.20*t)), P, {lw:1.5});
    }
    // covert scallops
    for(let i=0;i<4;i++){ g.beginPath(); g.arc(s*(0.16+i*0.24), -s*0.16, s*0.20, Math.PI, TAU);
      g.strokeStyle=P.line; g.globalAlpha=.55; g.lineWidth=1.5; g.stroke(); g.globalAlpha=1; }
  } else if(kind==='bat'){
    const tips=[[s*1.9,-s*.7],[s*1.75,s*.15],[s*1.25,s*.85],[s*.55,s*1.1]];
    let prev=[0,0];
    tips.forEach((t,i)=>{
      const sp=spine([[0,0],[t[0]*.55,t[1]*.55-s*.4],t],10);
      figure(g, ribbon(sp, u=>s*(0.16-0.11*u)), P, {lw:1.4});
      if(i){ g.beginPath(); curve(g,[prev,[(prev[0]+t[0])/2*0.9,(prev[1]+t[1])/2+s*.3],t],false);
        g.strokeStyle=P.line; g.lineWidth=1.5; g.globalAlpha=.7; g.stroke(); g.globalAlpha=1; }
      prev=t;
    });
    g.beginPath(); curve(g,[[0,0],[s*1.9,-s*.7],[s*1.75,s*.15],[s*1.25,s*.85],[s*.55,s*1.1]],true);
    g.fillStyle=P.lo; g.globalAlpha=.45; g.fill(); g.globalAlpha=1;
  } else if(kind==='insect'){
    [[-0.35,1.6],[0.15,1.35]].forEach(([a,L])=>{
      g.beginPath(); curve(g, ell(Math.cos(a)*s*L*.5, Math.sin(a)*s*L*.5, s*L*.5, s*.30, a), true);
      g.fillStyle=P.hi; g.globalAlpha=.30; g.fill(); g.globalAlpha=1;
      g.strokeStyle=P.line; g.lineWidth=1.4; g.stroke();
    });
  }
  g.restore();
}

/* ═══════════════  FORMS  ═══════════════ */

/* A leg only reads as a leg if it zigzags. Shoulder, elbow, knee, fetlock,
   hoof — four joints, alternating direction. Straight tapered sticks read as
   furniture, which is what the first version of this looked like. */
function legJ(g,P,joints,w0,w1){
  const sp = spine(joints, 16);
  figure(g, ribbon(sp, t=>w0*(1-t)+w1*t), P, {lw:1.7});
  const toe = joints[joints.length-1];
  figure(g, [[toe[0]-5,toe[1]-4],[toe[0]+11,toe[1]-5],[toe[0]+13,toe[1]+4],[toe[0]-6,toe[1]+5]], P, {lw:1.5});
}

const FORMS = {

quad(g,P,D,rng){
  const lean=D.build||1, dark={...P, hi:P.mid, mid:P.lo, lo:P.line};

  // far pair, pushed back and darkened so the near pair reads in front
  legJ(g,dark,[[26,-4],[31,20],[23,44],[31,64],[35,74]],13,7);
  legJ(g,dark,[[-42,-2],[-33,22],[-49,44],[-39,64],[-35,74]],15,7);

  tail(g,P,-56,-10,26,D.tail||'brush',rng);

  // body: topline over the withers, belly tucked, chest deep
  const body=[[-58,-6],[-42,-24*lean],[-10,-31*lean],[22,-29*lean],[46,-18*lean],
              [52,2],[42,16],[8,23],[-26,21],[-54,10]];
  figure(g,body,P);
  // the plates always chase the shoulder and haunch as two spirals
  chase(g, ell(-34,-2,17,15), P, 1.7, true);
  chase(g, ell(-34,-2,8,7), P, 1.3, true);
  chase(g, ell(32,-6,14,13), P, 1.6, true);
  chase(g, [[-6,-24],[-2,6],[-8,18]], P, 1.3);

  if(D.mane){
    for(let i=0;i<9;i++){
      const a=-2.35+i*0.30, L=30+Math.sin(i*0.9)*9;
      figure(g,[[52,-26],[52+Math.cos(a)*L, -26+Math.sin(a)*L],
                [52+Math.cos(a+0.24)*L*0.82, -26+Math.sin(a+0.24)*L*0.82]],P,{lw:1.3});
    }
  }
  // neck — short and thick; the long version read as a llama
  figure(g, ribbon(spine([[42,-18],[54,-32],[62,-44]],12), t=>26*(0.80-0.24*t)), P);
  if(D.mane) for(let i=0;i<5;i++) chase(g,[[46+i*4,-24-i*4],[56+i*4,-36-i*4]],P,1.3);

  // near pair, in front and full-value
  legJ(g,P,[[34,-6],[40,20],[31,45],[40,65],[45,75]],15,8);
  legJ(g,P,[[-34,-4],[-24,22],[-41,45],[-30,65],[-26,75]],17,8);

  head(g,P,66,-52,21,D.head||'canine',D.headRot||-0.22,rng);
  if(D.ears){ ear(g,P,57,-68,10,D.ears,-0.28); }
  if(D.horn){ horn(g,P,63,-70,11,D.horn,-0.62); if(D.horn2!==false) horn(g,P,71,-67,10.4,D.horn,-0.26); }
  if(D.wings) wing(g,P,4,-28,26,D.wings,1,rng);
},

serpent(g,P,D,rng){
  const s=24;
  const sp=spine([[-66,34],[-34,4],[-46,-26],[-6,-40],[30,-24],[42,4],[64,-18]],26);
  figure(g, ribbon(sp, t=>s*(0.30+0.42*Math.sin(Math.PI*Math.min(1,t*1.15)))), P);
  // scales
  g.save();
  for(let i=3;i<sp.length-3;i+=2){
    const p=sp[i];
    g.beginPath(); g.arc(p[0],p[1], 5.2, 0.9, 0.9+Math.PI);
    g.strokeStyle=P.line; g.globalAlpha=.42; g.lineWidth=1.3; g.stroke();
  }
  g.globalAlpha=1; g.restore();
  const e=sp[sp.length-1];
  head(g,P,e[0],e[1],s*.62,'reptile',-0.5,rng);
  if(D.hood){
    g.save(); g.translate(e[0]-16,e[1]+6);
    figure(g,[[-22,6],[-16,-24],[0,-34],[16,-24],[22,6],[0,16]],{...P,hi:P.mid,mid:P.lo,lo:P.line},{lw:1.7});
    g.restore();
  }
  if(D.heads===3){
    head(g,P,e[0]-30,e[1]-24,s*.5,'reptile',-1.0,rng);
    head(g,P,e[0]-4,e[1]-40,s*.5,'reptile',-0.75,rng);
  }
  if(D.horn) horn(g,P,e[0]+2,e[1]-14,s*.42,D.horn,-0.7);
},

/* A figure in profile, striding right, built the way the reliefs are built:
   hips at 0, shoulders at −38, head at −74, ground at +88. */
humanoid(g,P,D,rng){
  const dark={...P, hi:P.mid, mid:P.lo, lo:P.line};
  const hy = -76, hs = 21;

  if(D.wings){ wing(g,dark,-14,-44,26,D.wings,-1,rng); }

  // far arm, behind the body
  figure(g, ribbon(spine([[-6,-36],[-26,-12],[-22,16]],12), t=>13-4*t), dark, {lw:1.6});

  // far leg
  if(!D.half) legJ(g,dark,[[-8,10],[-18,44],[-14,78],[-12,86]],15,9);

  // near leg
  legJ(g,P,[[10,12],[22,44],[26,78],[30,86]],17,10);

  // dress: a Persian court robe falls in a bell with strong vertical pleats;
  // a warrior gets a belted tunic to mid-thigh and keeps the legs visible
  if(D.robe){
    figure(g,[[-24,-40],[10,-44],[26,-36],[38,20],[46,86],[-2,92],[-44,86],[-32,20]],P);
    for(let i=-4;i<=4;i++) chase(g,[[i*7,-24],[i*8.6,26],[i*10.4,80]],P,1.25);
    chase(g,[[-30,4],[-2,10],[34,4]],P,1.5);
  } else {
    figure(g,[[-22,-42],[6,-48],[24,-38],[28,-6],[24,26],[-4,32],[-26,24],[-26,-8]],P);
    // belt
    figure(g,[[-27,-2],[29,-6],[30,8],[-26,12]],dark,{lw:1.5});
    chase(g,[[-10,-34],[6,-26],[20,-32]],P,1.5);
    chase(g,[[2,-24],[2,-4]],P,1.3);
  }

  // near arm — raised if it is holding something up, forward otherwise
  const raised = D.weapon==='mace'||D.weapon==='sword';
  const arm = raised ? [[14,-38],[46,-22],[50,-54]] : [[14,-38],[38,-14],[52,10]];
  figure(g, ribbon(spine(arm,12), t=>14-5*t), P, {lw:1.7});
  if(D.extraArms){
    figure(g, ribbon(spine([[-2,-30],[-34,-6],[-44,26]],12), t=>11-4*t), dark, {lw:1.5});
    figure(g, ribbon(spine([[8,-28],[44,-2],[58,28]],12), t=>11-4*t), P, {lw:1.5});
  }

  // hair, one step darker than the skin so it reads as hair and not as a hole
  const hairP = {hi:P.mid, mid:P.mid, lo:P.lo, line:P.line};
  if(D.hair==='long'){
    figure(g,[[2,hy-hs*1.05],[-hs*1.3,hy-hs*.8],[-hs*1.8,hy+hs*.6],[-hs*1.5,hy+hs*2.2],
              [-hs*.4,hy+hs*2.4],[-hs*.2,hy+hs*.4]],hairP,{lw:1.6});
    for(let i=0;i<4;i++) chase(g,[[-hs*(1.5-i*0.28),hy-hs*.4],[-hs*(1.3-i*0.26),hy+hs*2.0]],P,1.2);
  }

  // the veil (chādor) hangs BEHIND the face — it frames, it does not cover
  if(D.veil){
    figure(g,[[hs*.55,hy-hs*1.30],[hs*.30,hy-hs*.30],[hs*.10,hy+hs*1.1],[-hs*.6,hy+hs*2.9],
              [-hs*2.1,hy+hs*2.5],[-hs*2.0,hy+hs*.2],[-hs*1.2,hy-hs*1.15]],dark,{lw:1.6});
    for(let i=0;i<4;i++) chase(g,[[-hs*(1.75-i*.42),hy-hs*.5],[-hs*(1.35-i*.44),hy+hs*2.2]],P,1.15);
  }

  head(g,P,6,hy,hs,D.head||'human',0,rng);

  // the square Assyro-Persian beard: a block, not a wisp. Its top edge follows
  // the jaw, so the mouth and nose stay above it and the face still reads.
  if(D.beard){
    figure(g,[[-hs*.78,hy+hs*.46],[hs*.20,hy+hs*.74],[hs*.86,hy+hs*.56],
              [hs*1.06,hy+hs*1.32],[hs*.82,hy+hs*2.06],[hs*.06,hy+hs*2.28],[-hs*.74,hy+hs*1.92]],hairP,{lw:1.6});
    for(let i=0;i<3;i++) chase(g,[[-hs*.62,hy+hs*(1.02+i*.38)],[hs*.34,hy+hs*(1.16+i*.38)],[hs*.94,hy+hs*(1.02+i*.38)]],P,1.15);
  }
  if(D.horn){ horn(g,P,-2,hy-hs*.85,9,D.horn,-1.9); horn(g,P,hs*.55,hy-hs*.9,9.4,D.horn,-0.75); }

  // the crenellated crown — Achaemenid kings wear a city wall on their heads
  if(D.crown){
    const G={hi:'#fff2c8',mid:'#e0a92e',lo:'#8a6415',line:'#1a1206'};
    figure(g,[[-hs*1.15,hy-hs*.72],[hs*1.05,hy-hs*.86],[hs*1.05,hy-hs*1.20],[-hs*1.15,hy-hs*1.06]],G,{lw:1.5});
    for(let i=0;i<4;i++){ const x=-hs*1.0+i*hs*.56;
      figure(g,[[x,hy-hs*1.14],[x+hs*.34,hy-hs*1.16],[x+hs*.34,hy-hs*1.55],[x+hs*.20,hy-hs*1.55],
                [x+hs*.20,hy-hs*1.38],[x,hy-hs*1.38]],G,{lw:1.2}); }
  }
  if(D.helm){
    figure(g,[[-hs*1.2,hy-hs*.3],[-hs*1.0,hy-hs*1.2],[0,hy-hs*1.55],[hs*.95,hy-hs*1.1],[hs*1.0,hy-hs*.55],[hs*.2,hy-hs*.7]],dark,{lw:1.6});
  }

  // weapons, held in the near hand
  const steel={hi:'#fffdf5',mid:'#cfd6e0',lo:'#6b7280',line:'#0b0d12'};
  if(D.weapon==='sword'){ g.save(); g.translate(50,-54); g.rotate(-0.30);
    figure(g,[[-4,4],[-5,-56],[0,-72],[5,-56],[4,4]],steel,{lw:1.5});
    figure(g,[[-15,4],[15,4],[15,11],[-15,11]],P,{lw:1.5});
    figure(g,[[-4,11],[4,11],[3,26],[-3,26]],P,{lw:1.4}); g.restore(); }
  if(D.weapon==='mace'){ g.save(); g.translate(50,-54); g.rotate(-0.22);
    figure(g,ribbon(spine([[0,14],[0,-18],[0,-40]],8),6.5),P,{lw:1.5});
    for(let i=0;i<7;i++){ const a=i/7*TAU;
      figure(g,[[Math.cos(a)*11,-52+Math.sin(a)*11],[Math.cos(a)*23,-52+Math.sin(a)*23],
                [Math.cos(a+0.42)*12,-52+Math.sin(a+0.42)*12]],P,{lw:1.2}); }
    figure(g,ell(0,-52,13,13),P); g.restore(); }
  if(D.weapon==='spear'){ g.save(); g.translate(50,8); g.rotate(0.16);
    figure(g,ribbon(spine([[0,-96],[0,-10],[0,80]],10),4.6),P,{lw:1.3});
    figure(g,[[0,-124],[8,-96],[0,-88],[-8,-96]],steel,{lw:1.4}); g.restore(); }
  if(D.weapon==='bow'){ g.save(); g.translate(52,-14);
    g.beginPath(); g.arc(0,0,46,-1.30,1.30); g.strokeStyle=P.line; g.lineWidth=6; g.stroke();
    g.strokeStyle=P.mid; g.lineWidth=3; g.stroke();
    g.beginPath(); g.moveTo(13,-44); g.lineTo(-6,0); g.lineTo(13,44);
    g.strokeStyle=P.hi; g.globalAlpha=.75; g.lineWidth=1.5; g.stroke(); g.globalAlpha=1;
    figure(g,[[-4,0],[-46,-3],[-46,3]],steel,{lw:1.2}); g.restore(); }
  if(D.shield){ g.save(); g.translate(-30,4);
    figure(g,ell(0,0,20,27),dark);
    g.beginPath(); g.arc(0,0,8,0,TAU); g.strokeStyle=P.line; g.lineWidth=2; g.stroke();
    for(let i=0;i<8;i++){ const a=i/8*TAU; g.beginPath(); g.moveTo(Math.cos(a)*10,Math.sin(a)*13);
      g.lineTo(Math.cos(a)*17,Math.sin(a)*23); g.strokeStyle=P.line; g.globalAlpha=.6; g.lineWidth=1.4; g.stroke(); g.globalAlpha=1; }
    g.restore(); }

  if(D.wings){ wing(g,P,10,-44,26,D.wings,1,rng); }
},

bird(g,P,D,rng){
  const s=26;
  wing(g,P,-14,-22,s*1.25,'feather',-1,rng);
  const body=[[-30,10],[-16,-28],[10,-40],[34,-20],[36,20],[10,44],[-20,40]];
  figure(g,body,P);
  // breast scallops
  for(let r=0;r<3;r++) for(let i=0;i<4;i++){
    g.beginPath(); g.arc(-12+i*14, 2+r*13, 7.5, Math.PI, TAU);
    g.strokeStyle=P.line; g.globalAlpha=.4; g.lineWidth=1.3; g.stroke(); g.globalAlpha=1; }
  // tail plumes — the Simurgh's peacock tail
  for(let i=0;i<5;i++){
    const a=2.2+i*0.20, L=s*(2.4-Math.abs(i-2)*0.22);
    const sp=spine([[-22,26],[-22+Math.cos(a)*L*.5,26+Math.sin(a)*L*.5],[-22+Math.cos(a)*L,26+Math.sin(a)*L]],12);
    figure(g,ribbon(sp,t=>s*(0.26-0.16*t)),P,{lw:1.4});
  }
  // legs
  figure(g,ribbon(spine([[6,40],[8,56],[4,68]],8),5),P,{lw:1.4});
  figure(g,[[-6,68],[16,66],[16,72],[-8,74]],P,{lw:1.3});
  const nk=spine([[26,-24],[40,-44],[46,-60]],10);
  figure(g,ribbon(nk,t=>s*(0.5-0.16*t)),P);
  head(g,P,50,-66,s*.52,'bird',-0.3,rng);
  // beak
  figure(g,[[62,-70],[86,-62],[62,-56]],{...P,hi:'#fff2c8',mid:'#e0a92e',lo:'#8a6415',line:'#1a1206'},{lw:1.5});
  if(D.crest) for(let i=0;i<3;i++){
    const a=-1.5+i*0.3; figure(g,[[46,-78],[46+Math.cos(a)*30,-78+Math.sin(a)*30],[42+Math.cos(a+0.25)*24,-78+Math.sin(a+0.25)*24]],P,{lw:1.3}); }
  wing(g,P,14,-24,s*1.35,'feather',1,rng);
},

insect(g,P,D,rng){
  const s=22;
  const segs=D.segs||3;
  wing(g,P,-4,-26,s*1.1,'insect',1,rng);
  for(let i=0;i<segs;i++){
    const x=-46+i*30, r=20-i*1.5;
    figure(g,ell(x,6,r,r*0.82,0.1),P);
    chase(g,ell(x,6,r*0.6,r*0.5,0.1),P,1.3,true);
  }
  for(let i=0;i<3;i++){
    const bx=-30+i*26;
    figure(g,ribbon(spine([[bx,18],[bx-12,40],[bx-26,54]],9),t=>s*(0.16-0.09*t)),P,{lw:1.4});
    figure(g,ribbon(spine([[bx,14],[bx+4,36],[bx-8,50]],9),t=>s*(0.14-0.08*t)),P,{lw:1.3});
  }
  head(g,P,44,-2,s*.62,'blob',0,rng);
  // antennae
  figure(g,ribbon(spine([[48,-18],[62,-40],[84,-46]],9),2.6),P,{lw:1.2});
  figure(g,ribbon(spine([[44,-20],[52,-44],[70,-58]],9),2.6),P,{lw:1.2});
  if(D.sting) tail(g,P,-58,4,s,'sting',rng);
  if(D.pincers){
    figure(g,ribbon(spine([[52,10],[74,18],[88,4]],9),5),P,{lw:1.4});
    figure(g,ribbon(spine([[52,-4],[76,-2],[86,-16]],9),5),P,{lw:1.4});
  }
},

amorph(g,P,D,rng){
  const n=D.lobes||9, pts=[];
  for(let i=0;i<n;i++){
    const a=i/n*TAU, r=36+rng()*26 + Math.sin(a*3)*8;
    pts.push([Math.cos(a)*r, Math.sin(a)*r*0.86+6]);
  }
  figure(g,pts,P);
  // inner voids
  const eyes=D.eyes||2;
  for(let i=0;i<eyes;i++){
    const a=(i/eyes)*TAU+0.6, r=(eyes===1?0:20);
    const x=Math.cos(a)*r, y=Math.sin(a)*r-4, rr=eyes===1?22:9;
    g.beginPath(); curve(g,[[x-rr,y],[x,y-rr*0.72],[x+rr,y],[x,y+rr*0.72]],true);
    g.fillStyle=P.hi; g.fill(); g.strokeStyle=P.line; g.lineWidth=2; g.stroke();
    g.beginPath(); g.arc(x,y,rr*0.42,0,TAU); g.fillStyle=P.line; g.fill();
  }
  for(let i=0;i<12;i++){ const a=rng()*TAU, r=20+rng()*26;
    chase(g,[[Math.cos(a)*r,Math.sin(a)*r*0.8],[Math.cos(a)*(r+16),Math.sin(a)*(r+14)*0.8]],P,1.2); }
},

stone(g,P,D,rng){
  const facets=[];
  const n=7;
  for(let i=0;i<n;i++){ const a=i/n*TAU-0.3, r=42+rng()*20; facets.push([Math.cos(a)*r, Math.sin(a)*r*0.95+8]); }
  figure(g,facets,P,{flat:true,lw:2.4});
  // cut planes
  for(let i=0;i<n;i+=2){
    const p=facets[i], q=facets[(i+3)%n];
    g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q[0]*0.3,q[1]*0.3); g.lineTo(q[0],q[1]);
    g.fillStyle=P.lo; g.globalAlpha=.45; g.fill(); g.globalAlpha=1;
    g.strokeStyle=P.line; g.lineWidth=1.6; g.stroke();
  }
  // cuneiform, because Bīsotūn is covered in it
  g.save(); g.globalAlpha=.6;
  for(let r=0;r<3;r++) for(let i=0;i<5;i++) wedges(g, -26+i*13, -12+r*16, 8, rng, P.line);
  g.restore();
  if(D.eyes){ for(let i=0;i<2;i++){ const x=-14+i*28;
    g.beginPath(); g.arc(x,-22,5,0,TAU); g.fillStyle=P.hi; g.fill(); g.strokeStyle=P.line; g.lineWidth=1.8; g.stroke(); } }
},

waste(g,P,D,rng){
  // the desert: not a creature. Dunes, a bleached skull, a sun that means it.
  const c=0;
  g.save();
  const sun=g.createRadialGradient(10,-46,2,10,-46,54);
  sun.addColorStop(0,'#fff6d0'); sun.addColorStop(.5,'rgba(255,200,90,.55)'); sun.addColorStop(1,'rgba(255,180,60,0)');
  g.fillStyle=sun; g.beginPath(); g.arc(10,-46,54,0,TAU); g.fill();
  g.beginPath(); g.arc(10,-46,20,0,TAU); g.fillStyle='#ffeaa8'; g.fill();
  for(let i=0;i<3;i++){
    const y=6+i*22;
    g.beginPath(); g.moveTo(-92,y+30);
    g.bezierCurveTo(-40,y-14+i*4, 20,y+16, 92,y-6+i*5);
    g.lineTo(92,96); g.lineTo(-92,96); g.closePath();
    const gg=g.createLinearGradient(0,y-20,0,y+40);
    gg.addColorStop(0,['#e9c98a','#cfa259','#a97f3d'][i]); gg.addColorStop(1,['#b98f4e','#96682f','#6d4620'][i]);
    g.fillStyle=gg; g.fill();
    g.strokeStyle='rgba(0,0,0,.35)'; g.lineWidth=1.4; g.stroke();
  }
  // skull
  g.translate(-30,42); g.rotate(-0.2); g.scale(0.85,0.85);
  const B={hi:'#fffaf0',mid:'#ded6c0',lo:'#948b73',line:'#1a1710'};
  figure(g,[[-22,-16],[-8,-28],[12,-26],[22,-8],[16,12],[0,20],[-16,12]],B,{lw:1.7});
  figure(g,[[-12,14],[10,14],[8,26],[-10,26]],B,{lw:1.4});
  [[-10,-6],[8,-6]].forEach(([x,y])=>{ g.beginPath(); curve(g,[[x-7,y],[x,y-6],[x+7,y],[x,y+7]],true); g.fillStyle='#16140d'; g.fill(); });
  horn(g,B,-20,-20,10,'ram',-2.2); horn(g,B,18,-20,10,'ram',-0.9);
  g.restore();
},

};

/* ═══════════════  THE CAST  ═══════════════
   Short descriptors; the forms above do the drawing.                         */
const CREATURES = {
  /* ── road I, tier A ── */
  jackal:    {form:'quad', hue:'sand',  head:'canine', ears:'tall', tail:'brush', build:0.88},
  wasp:      {form:'insect', hue:'gilt', segs:3, sting:true},
  bandit:    {form:'humanoid', hue:'ash', weapon:'sword', beard:true, hair:'long'},
  saltwraith:{form:'amorph', hue:'bone', lobes:11, eyes:2},
  scorpion:  {form:'insect', hue:'void', segs:4, sting:true, pincers:true},

  /* ── tier B ── */
  firesnake: {form:'serpent', hue:'flame', horn:'spike'},
  ghoul:     {form:'humanoid', hue:'ivy', head:'blob', horn:'plain', extraArms:true},
  peri:      {form:'humanoid', hue:'rose', wings:'feather', robe:true, veil:true, hair:'long'},
  marchguard:{form:'humanoid', hue:'lapis', weapon:'spear', shield:true, beard:true},
  mirage:    {form:'amorph', hue:'silver', lobes:13, eyes:1},

  /* ── tier C ── */
  divwhelp:  {form:'humanoid', hue:'blood', head:'horned', horn:'curl', weapon:'mace'},
  shadow:    {form:'amorph', hue:'void', lobes:8, eyes:3},
  serpent:   {form:'serpent', hue:'ivy', hood:true},
  sorcerer:  {form:'humanoid', hue:'night', robe:true, beard:true, armOut:true, crown:true},

  /* ── elites ── */
  karkadann: {form:'quad', hue:'ash', head:'horned', horn:'spike', horn2:false, tail:'tuft', build:1.15},
  manticore: {form:'quad', hue:'blood', head:'human', mane:true, tail:'sting', build:1.05},
  nasnas:    {form:'humanoid', hue:'bone', head:'human', half:true},
  golem:     {form:'stone', hue:'ash', eyes:true},

  /* ── road I bosses ── */
  lion:      {form:'quad', hue:'gilt', head:'feline', mane:true, tail:'tuft', build:1.1, boss:true},
  thirst:    {form:'waste', hue:'sand', boss:true, noGround:true},
  dragon:    {form:'serpent', hue:'verdi', horn:'curl', heads:1, boss:true, wings:'bat'},
  witch:     {form:'humanoid', hue:'rose', robe:true, hair:'long', veil:true, boss:true},
  ulad:      {form:'humanoid', hue:'lapis', weapon:'sword', beard:true, crown:true, boss:true},
  guard:     {form:'humanoid', hue:'ash', weapon:'spear', shield:true},
  arzhang:   {form:'humanoid', hue:'flame', head:'horned', horn:'ram', weapon:'mace', extraArms:true, boss:true},
  lesserdiv: {form:'humanoid', hue:'blood', head:'horned', horn:'plain'},
  sepid:     {form:'humanoid', hue:'bone', head:'horned', horn:'curl', weapon:'mace', beard:true, boss:true},
  watcher:   {form:'amorph', hue:'flame', lobes:14, eyes:1, boss:true},
};

/* ── heroes: Achaemenid relief, not silver plate ── */
const HEROES_ART = {
  // Rostam in the tiger-skin coat with the ox-headed mace, helmeted
  rostam: {hue:'blood',  weapon:'mace',  beard:true, hair:'long', helm:true},
  // Gordāfarid at the moment the story turns: helmet on, hair already loose
  gord:   {hue:'verdi',  weapon:'bow',   hair:'long', helm:true},
  // Zāl, white-haired, robed, no weapon — he wins arguments instead
  zal:    {hue:'silver', robe:true,      beard:true, hair:'long'},
};

/* ═══════════════  RELIEF PANEL (heroes)  ═══════════════ */
/* The winged disc — the Faravahar. Carved above every Achaemenid king at
   Persepolis and Naqsh-e Rostam. What it actually depicts is argued about to
   this day: Ahura Mazda, the royal khvarenah (the Farr this whole game runs
   on), or a fravashi, the guardian soul. Nobody has settled it in 2,500 years. */
function faravahar(g, cx, cy, s, col, rng){
  g.save(); g.translate(cx,cy);
  const P = {hi:'#efe6d0', mid:col||'#c9bda1', lo:'#877c66', line:'#33301f'};
  for(const dir of [-1,1]){
    g.save(); g.scale(dir,1);
    for(let i=0;i<4;i++){
      const y=-s*0.10+i*s*0.15;
      figure(g,[[s*0.22,y],[s*(1.5-i*0.14),y-s*0.05],[s*(1.5-i*0.14),y+s*0.10],[s*0.22,y+s*0.12]],P,{lw:1.1});
    }
    g.restore();
  }
  // tail feathers
  figure(g,[[-s*0.24,s*0.30],[s*0.24,s*0.30],[s*0.18,s*0.86],[-s*0.18,s*0.86]],P,{lw:1.2});
  for(let i=-1;i<=1;i++) chase(g,[[i*s*0.14,s*0.36],[i*s*0.15,s*0.82]],P,1.1);
  // ring
  g.beginPath(); g.arc(0,-s*0.06,s*0.30,0,TAU);
  g.strokeStyle=P.line; g.lineWidth=s*0.10; g.stroke();
  g.strokeStyle=P.hi; g.lineWidth=s*0.05; g.globalAlpha=.7; g.stroke(); g.globalAlpha=1;
  // the small figure in the ring, hand raised
  figure(g,[[-s*0.10,-s*0.30],[s*0.10,-s*0.30],[s*0.12,s*0.04],[-s*0.12,s*0.04]],P,{lw:1.0});
  head(g,P,s*0.02,-s*0.40,s*0.13,'human',0,rng);
  g.restore();
}

function relief(g,S,D,rng){
  // limestone, lit from the upper left the way the real stone is at noon
  const gr=g.createLinearGradient(0,0,S*0.55,S);
  gr.addColorStop(0,'#c3b69a'); gr.addColorStop(.40,'#a2957b'); gr.addColorStop(.78,'#7c7159'); gr.addColorStop(1,'#5d5442');
  g.fillStyle=gr; g.fillRect(0,0,S,S);

  // bedding planes and tool chatter
  g.save();
  g.globalAlpha=.10; g.strokeStyle='#4a4232'; g.lineWidth=1;
  for(let i=0;i<7;i++){ const y=rng()*S; g.beginPath(); g.moveTo(0,y);
    g.bezierCurveTo(S*.3,y+rng()*8-4,S*.7,y+rng()*8-4,S,y+rng()*6-3); g.stroke(); }
  for(let i=0;i<260;i++){ const x=rng()*S,y=rng()*S,r=rng()*2.4;
    g.globalAlpha=0.03+rng()*0.07; g.fillStyle=rng()<0.5?'#2a2418':'#e6dcc4';
    g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
  g.globalAlpha=1; g.restore();

  // a corner broken off, because they always are
  g.save(); g.fillStyle='#3f3928'; g.globalAlpha=.55;
  g.beginPath(); g.moveTo(S,0); g.lineTo(S,S*0.24); g.lineTo(S*0.88,S*0.11); g.lineTo(S*0.94,0); g.closePath(); g.fill();
  g.restore();

  faravahar(g, S*0.52, S*0.13, S*0.20, '#b8ab8e', rngFrom(7));

  // the figure, carved: a dark undercut shadow down-right, then the lit stone
  const stone  = {hi:'#efe6d0', mid:'#c2b599', lo:'#8b8069', line:'#312c1f'};
  const shadow = {hi:'#2e2a1d', mid:'#2e2a1d', lo:'#2e2a1d', line:'#2e2a1d'};
  const F = {...D, head:'human'};
  g.save(); g.translate(S*0.46, S*0.545); g.scale(S/272, S/272);
  g.save(); g.translate(6,7); g.globalAlpha=.40; FORMS.humanoid(g,shadow,F,rngFrom(1)); g.restore();
  FORMS.humanoid(g,stone,F,rngFrom(1));
  g.restore();

  // a band of Old Persian cuneiform along the bottom, as at Bīsotūn
  g.save(); g.globalAlpha=.55;
  const w=rngFrom(31), y=S*0.955, step=S*0.052;
  for(let x=step*0.6; x<S-step*0.3; x+=step) wedges(g, x, y, S*0.030, w, '#3d3627');
  g.restore();

  g.strokeStyle='rgba(224,169,46,.5)'; g.lineWidth=Math.max(2,S*0.012);
  g.strokeRect(g.lineWidth/2,g.lineWidth/2,S-g.lineWidth,S-g.lineWidth);
}

/* how much of the dish each form wants — derived from its drawn extent */
const FIT = { humanoid:0.78, quad:0.88, serpent:1.15, bird:1.02, insect:1.02,
              amorph:1.20, stone:1.28, waste:1.00 };

/* ═══════════════  PUBLIC  ═══════════════ */

function descriptorFor(id){
  if(CREATURES[id]) return CREATURES[id];
  // unknown id — derive something plausible and stable rather than breaking
  const r = rngFrom(hash(id));
  const forms=['quad','humanoid','serpent','amorph','insect','bird'];
  const hues=Object.keys(HUES);
  return { form: forms[Math.floor(r()*forms.length)], hue: hues[Math.floor(r()*hues.length)],
           lobes:8+Math.floor(r()*6), eyes:1+Math.floor(r()*3), beard:r()<.5, tail:'brush' };
}

function render(id, S, kind){
  const key = id+'|'+S+'|'+kind;
  if(cache.has(key)) return cache.get(key);
  const dpr = Math.min(2, window.devicePixelRatio||1);
  const c = document.createElement('canvas');
  c.width = S*dpr; c.height = S*dpr; c.style.width=S+'px'; c.style.height=S+'px';
  const g = c.getContext('2d');
  g.scale(dpr,dpr);
  const rng = rngFrom(hash(id));

  if(kind==='hero'){
    relief(g,S,HEROES_ART[id]||{hue:'sand',beard:true},rng);
  } else {
    const D = descriptorFor(id);
    const P = HUES[D.hue] || HUES.sand;
    dish(g,S,P,{noGround:!!D.noGround});
    if(D.boss) nimbus(g,S,P);
    g.save();
    g.translate(S/2, S*(D.form==='humanoid'?0.56:0.54));
    // each form has its own natural extent; fit it to the dish rather than
    // leaving tall figures marooned in the middle of a lot of empty metal
    const k = (S/200) * (FIT[D.form]||1) * (D.boss?1.02:0.97);
    g.scale(k,k);
    (FORMS[D.form]||FORMS.amorph)(g,P,D,rng);
    g.restore();
    // a last pass of light across the whole dish, like a photograph of metal
    g.save();
    const sh=g.createLinearGradient(0,0,S*0.8,S);
    sh.addColorStop(0,'rgba(255,255,255,.13)'); sh.addColorStop(.4,'rgba(255,255,255,0)');
    sh.addColorStop(.75,'rgba(0,0,0,.14)'); sh.addColorStop(1,'rgba(0,0,0,.30)');
    g.globalCompositeOperation='overlay';
    g.beginPath(); g.arc(S/2,S/2,S*0.475,0,TAU); g.fillStyle=sh; g.fill();
    g.restore();
  }
  cache.set(key,c);
  return c;
}

/* returns a fresh <canvas> node (cached bitmap blitted in, so it is cheap) */
function node(id, S, kind){
  const src = render(id, S, kind||'foe');
  const dpr = Math.min(2, window.devicePixelRatio||1);
  const c = document.createElement('canvas');
  c.width=S*dpr; c.height=S*dpr; c.style.width=S+'px'; c.style.height=S+'px';
  c.className = 'plate' + (kind==='hero'?' relief':'');
  c.getContext('2d').drawImage(src,0,0);
  return c;
}

function dataURL(id, S, kind){ return render(id,S,kind||'foe').toDataURL(); }

function clear(){ cache.clear(); }

return { node, dataURL, render, HUES, FORMS, CREATURES, HEROES_ART, descriptorFor,
         _helpers:{curve,ribbon,spine,ell,figure,chase,head,horn,wing,dish,rngFrom,hash} };
})();
