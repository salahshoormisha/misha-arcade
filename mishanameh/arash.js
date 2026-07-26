/* MISHANAMEH — ĀRASH-E KAMĀNGĪR, in three dimensions.
   ────────────────────────────────────────────────────────────────────────
   The story. Iran has lost a war to Tūrān and the peace terms are that the
   border will be set wherever a single arrow lands. Ārash the Archer climbs
   Mount Damāvand at dawn, puts every particle of his strength and his life
   into one shot, and looses it. The arrow flies from dawn until noon and
   comes down on a walnut tree on the bank of the Oxus, hundreds of miles
   east, and that is the border. Ārash is not found. He put himself into the
   arrow.

   It is the only story in Persian myth where the hero's whole life is spent
   in a single act of drawing a bow, and it is about a border — which is to
   say about where a country is allowed to be. Siâvash Kasrâi wrote the modern
   version of it in 1959 and Iranians have been reciting it at each other ever
   since. Bahman Mohasses, Ahmad Shamlou, everyone.

   So: raw WebGL, no libraries. A procedurally generated mountain range you
   fly over at low altitude for as long as you can keep the arrow up, drawing
   the border behind you as a line of fire.

   Three matrices, two shaders, one index buffer. It runs on an 8 GB Air.   */

const ARASH = (function(){

/* ═══════════ small linear algebra ═══════════ */
function mat4(){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
function perspective(fov, aspect, near, far){
  const f = 1/Math.tan(fov/2), nf = 1/(near-far);
  return new Float32Array([ f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0 ]);
}
function lookAt(eye, at, up){
  const z0=eye[0]-at[0], z1=eye[1]-at[1], z2=eye[2]-at[2];
  let zl=Math.hypot(z0,z1,z2)||1; const zx=z0/zl, zy=z1/zl, zz=z2/zl;
  let xx=up[1]*zz-up[2]*zy, xy=up[2]*zx-up[0]*zz, xz=up[0]*zy-up[1]*zx;
  const xl=Math.hypot(xx,xy,xz)||1; xx/=xl; xy/=xl; xz/=xl;
  const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
  return new Float32Array([
    xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0,
    -(xx*eye[0]+xy*eye[1]+xz*eye[2]),
    -(yx*eye[0]+yy*eye[1]+yz*eye[2]),
    -(zx*eye[0]+zy*eye[1]+zz*eye[2]), 1 ]);
}
function mul(a,b){
  const o = mat4();
  for(let i=0;i<4;i++) for(let j=0;j<4;j++){
    let s=0; for(let k=0;k<4;k++) s += a[k*4+j]*b[i*4+k];
    o[i*4+j]=s;
  }
  return o;
}

/* ═══════════ the land ═══════════
   Value noise with four octaves, seeded, so the same run gets the same range.
   Ridged at the top so the peaks read as the Alborz rather than as dunes. */
function mkNoise(seed){
  const p = new Uint8Array(512);
  let s = seed>>>0;
  const rnd = ()=>{ s = (s*1664525 + 1013904223)>>>0; return s/4294967296; };
  const perm = [...Array(256).keys()];
  for(let i=255;i>0;i--){ const j=(rnd()*(i+1))|0; [perm[i],perm[j]]=[perm[j],perm[i]]; }
  for(let i=0;i<512;i++) p[i]=perm[i&255];
  const fade = t=>t*t*t*(t*(t*6-15)+10);
  const lerp = (a,b,t)=>a+(b-a)*t;
  const grad = (h,x,y)=>{ const u = h&1?x:-x, v = h&2?y:-y; return u+v; };
  return function(x,y){
    const X=Math.floor(x)&255, Y=Math.floor(y)&255;
    x-=Math.floor(x); y-=Math.floor(y);
    const u=fade(x), v=fade(y);
    const A=p[X]+Y, B=p[X+1]+Y;
    return lerp(lerp(grad(p[A],x,y), grad(p[B],x-1,y), u),
                lerp(grad(p[A+1],x,y-1), grad(p[B+1],x-1,y-1), u), v);
  };
}

let noise = null;
function height(x, z){
  let h = 0, amp = 1, frq = 0.0052;
  for(let o=0;o<5;o++){
    let n = noise(x*frq, z*frq);
    if(o<2) n = 1 - Math.abs(n);            // ridged on the two big octaves — crests, not dunes
    h += n*amp; amp *= 0.52; frq *= 2.07;
  }
  h = Math.pow(Math.max(0, h*0.5), 1.55) * 2;   // exaggerate the tall ground, flatten the low
  // a great valley down the middle of the run, so there is somewhere to fly
  const valley = Math.exp(-Math.pow(x/230, 2)) * 46;
  return h*62 - valley;
}

/* ═══════════ shaders ═══════════ */
const VS = `
attribute vec3 aPos;
attribute vec3 aNorm;
uniform mat4 uMVP;
uniform vec3 uEye;
varying float vFog;
varying float vLight;
varying float vH;
void main(){
  vec4 p = uMVP * vec4(aPos, 1.0);
  gl_Position = p;
  vec3 L = normalize(vec3(0.42, 0.78, 0.32));       // low dawn sun, from behind the shot
  vLight = max(dot(normalize(aNorm), L), 0.0);
  float d = length(aPos - uEye);
  vFog = clamp((d - 420.0) / 1250.0, 0.0, 1.0);
  vH = aPos.y;
}`;

const FS = `
precision mediump float;
varying float vFog;
varying float vLight;
varying float vH;
uniform vec3 uFog;
void main(){
  // Persian miniature palette: lapis shadow, saffron light, snow on the crests
  vec3 rock  = mix(vec3(0.09,0.11,0.26), vec3(0.42,0.30,0.20), vLight);
  vec3 lit   = mix(rock, vec3(0.88,0.68,0.30), vLight*vLight*0.75);
  float snow = smoothstep(78.0, 132.0, vH) * smoothstep(0.24, 0.8, vLight);
  vec3 col   = mix(lit, vec3(0.95,0.93,0.86), snow);
  // a faint contour banding, like a hand-drawn map
  float band = smoothstep(0.42, 0.5, fract(vH*0.09));
  col *= 1.0 - band*0.06;
  gl_FragColor = vec4(mix(col, uFog, vFog), 1.0);
}`;

const LVS = `
attribute vec3 aPos;
attribute float aAge;
uniform mat4 uMVP;
varying float vAge;
void main(){ vAge = aAge; gl_Position = uMVP * vec4(aPos,1.0); gl_PointSize = 2.5 + 11.0*(1.0-aAge)*(1.0-aAge); }`;
const LFS = `
precision mediump float;
varying float vAge;
void main(){
  vec3 hot = mix(vec3(1.0,0.96,0.82), vec3(0.88,0.36,0.13), vAge);
  gl_FragColor = vec4(hot, 1.0 - vAge*0.92);
}`;

/* ═══════════ boilerplate ═══════════ */
function shader(gl, type, src){
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function program(gl, vs, fs){
  const p = gl.createProgram();
  gl.attachShader(p, shader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, shader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

/* ═══════════ the game ═══════════ */
let gl, cv, prog, lprog, host, raf = 0, running = false;
let terrainVBO, terrainNBO, terrainIBO, terrainCount = 0, tileZ = 0;
let trailVBO, trailABO;
const TILE = 760;          // world units per generated strip
const GRID = 96;           // vertices per side — 96×96 keeps the crests sharp at this draw distance

function buildStrip(z0){
  const pos = new Float32Array(GRID*GRID*3);
  const nrm = new Float32Array(GRID*GRID*3);
  const idx = new Uint16Array((GRID-1)*(GRID-1)*6);
  const span = TILE, half = span/2;
  const step = span/(GRID-1);
  for(let j=0;j<GRID;j++) for(let i=0;i<GRID;i++){
    const x = -half + i*step, z = z0 + j*step;
    const y = height(x, z);
    const k = (j*GRID+i)*3;
    pos[k]=x; pos[k+1]=y; pos[k+2]=z;
    // central difference normal
    const e = step;
    const hL = height(x-e,z), hR = height(x+e,z), hD = height(x,z-e), hU = height(x,z+e);
    let nx = hL-hR, ny = 2*e, nz = hD-hU;
    const l = Math.hypot(nx,ny,nz)||1;
    nrm[k]=nx/l; nrm[k+1]=ny/l; nrm[k+2]=nz/l;
  }
  let o = 0;
  for(let j=0;j<GRID-1;j++) for(let i=0;i<GRID-1;i++){
    const a = j*GRID+i, b = a+1, c = a+GRID, d = c+1;
    idx[o++]=a; idx[o++]=c; idx[o++]=b;
    idx[o++]=b; idx[o++]=c; idx[o++]=d;
  }
  return {pos, nrm, idx};
}

function uploadStrip(z0){
  const s = buildStrip(z0);
  gl.bindBuffer(gl.ARRAY_BUFFER, terrainVBO);
  gl.bufferData(gl.ARRAY_BUFFER, s.pos, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, terrainNBO);
  gl.bufferData(gl.ARRAY_BUFFER, s.nrm, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrainIBO);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, s.idx, gl.STATIC_DRAW);
  terrainCount = s.idx.length;
}

/* the arrow */
let A = null;
const TRAIL_MAX = 420;
let trail = [], onDone = null, best = 0;

function reset(khan){
  A = {
    x: 0, y: 210, z: 0,
    vy: 0, vx: 0,
    speed: 2.5,                 // world units per frame, climbs as you go
    life: 1,                    // Ārash's own life, spent to stay up
    dist: 0,
    dead: false,
    landed: false,
    khan: khan||1,
  };
  trail = [];
  tileZ = -TILE*0.25;
}

function step(input, dt){
  if(!A || A.dead) return;
  const k = dt/16.7;

  // steering: hold to pull up, which costs life. Let go and gravity takes it.
  if(input.up){ A.vy += 0.085*k; A.life -= 0.00185*k*(1 + 0.22*(A.khan-1)); }
  else         { A.vy -= 0.052*k; A.life -= 0.00016*k; }
  A.vy *= Math.pow(0.985, k);
  A.vy = Math.max(-3.4, Math.min(2.6, A.vy));

  A.vx += (input.left ? -0.06 : input.right ? 0.06 : -A.vx*0.09)*k;
  A.vx = Math.max(-1.8, Math.min(1.8, A.vx));

  A.y += A.vy*k;
  A.x += A.vx*k;
  A.x = Math.max(-190, Math.min(190, A.x));
  A.speed = Math.min(5.6, A.speed + 0.0016*k);
  A.z += A.speed*k;
  A.dist += A.speed*k;

  trail.push({ x:A.x, y:A.y, z:A.z, gy:height(A.x,A.z)+5.5, t:0 });
  if(trail.length > TRAIL_MAX) trail.shift();
  trail.forEach(p=>p.t += 0.0032*k);

  const ground = height(A.x, A.z);
  if(A.y <= ground + 2.2){ A.y = ground + 2.2; A.dead = true; A.landed = true; }
  if(A.life <= 0){ A.life = 0; A.dead = true; A.landed = true; }
  if(A.y > 300) { A.y = 300; A.vy = Math.min(A.vy, 0); }
}

/* ═══════════ render ═══════════ */
function frame(now){
  if(!running) return;
  raf = requestAnimationFrame(frame);
  const dt = Math.min(40, now - (frame.last||now)); frame.last = now;

  if(!A.dead) step(HELD, dt);

  // keep a strip of land under and ahead of the arrow
  if(A.z > tileZ + TILE*0.42){ tileZ += TILE*0.5; uploadStrip(tileZ - TILE*0.15); }

  if(!cv.width || !cv.height) size();
  const w = cv.width, h = cv.height;
  gl.viewport(0,0,w,h);
  const dawn = [0.13, 0.10, 0.30];
  gl.clearColor(dawn[0], dawn[1], dawn[2], 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  const eye = [A.x*0.70, A.y + 26, A.z - 132];
  const at  = [A.x*0.92, A.y - 12,  A.z + 130];
  const P = perspective(1.02, w/h, 1, 2000);
  const V = lookAt(eye, at, [0,1,0]);
  const MVP = mul(P, V);

  gl.useProgram(prog);
  gl.uniformMatrix4fv(gl.getUniformLocation(prog,'uMVP'), false, MVP);
  gl.uniform3fv(gl.getUniformLocation(prog,'uEye'), new Float32Array(eye));
  gl.uniform3fv(gl.getUniformLocation(prog,'uFog'), new Float32Array(dawn));
  const aPos = gl.getAttribLocation(prog,'aPos'), aNorm = gl.getAttribLocation(prog,'aNorm');
  gl.bindBuffer(gl.ARRAY_BUFFER, terrainVBO);
  gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER, terrainNBO);
  gl.enableVertexAttribArray(aNorm); gl.vertexAttribPointer(aNorm,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrainIBO);
  gl.drawElements(gl.TRIANGLES, terrainCount, gl.UNSIGNED_SHORT, 0);

  // the border, drawn in fire behind you — and the arrow at the head of it
  if(trail.length>1){
    const n = trail.length;
    // two strands: the arrow's own path through the air, and the border it is
    // burning into the ground underneath it — the second is the one that matters
    const tp = new Float32Array(n*6), ta = new Float32Array(n*2);
    trail.forEach((p,i)=>{
      tp[i*3]=p.x; tp[i*3+1]=p.y; tp[i*3+2]=p.z; ta[i]=Math.min(1,p.t);
      const j = n+i;
      tp[j*3]=p.x; tp[j*3+1]=p.gy!=null?p.gy:p.y; tp[j*3+2]=p.z;
      ta[j]=Math.min(1, p.t*0.45);          // the scar on the ground fades much slower
    });
    gl.useProgram(lprog);
    gl.uniformMatrix4fv(gl.getUniformLocation(lprog,'uMVP'), false, MVP);
    const lp = gl.getAttribLocation(lprog,'aPos'), la = gl.getAttribLocation(lprog,'aAge');
    gl.bindBuffer(gl.ARRAY_BUFFER, trailVBO);
    gl.bufferData(gl.ARRAY_BUFFER, tp, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER, trailABO);
    gl.bufferData(gl.ARRAY_BUFFER, ta, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(la); gl.vertexAttribPointer(la,1,gl.FLOAT,false,0,0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.depthMask(false);
    gl.drawArrays(gl.LINE_STRIP, 0, n);       // through the air — occluded by the peaks
    gl.drawArrays(gl.POINTS, 0, n);
    // the border is a mark on the map, so it reads through the mountains
    gl.disable(gl.DEPTH_TEST);
    gl.drawArrays(gl.LINE_STRIP, n, n);
    gl.drawArrays(gl.POINTS, n, n);
    gl.enable(gl.DEPTH_TEST);

    // the arrow: a bright head with a short shaft, drawn hot and unfogged
    const ax = A.x, ay = A.y, az = A.z;
    const back = 7.5;
    const head = new Float32Array([ ax, ay, az,  ax - A.vx*back*0.4, ay - A.vy*back*0.4, az - back ]);
    const hage = new Float32Array([0, 0.45]);
    gl.bindBuffer(gl.ARRAY_BUFFER, trailVBO); gl.bufferData(gl.ARRAY_BUFFER, head, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(lp,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER, trailABO); gl.bufferData(gl.ARRAY_BUFFER, hage, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(la,1,gl.FLOAT,false,0,0);
    gl.lineWidth(3);
    gl.drawArrays(gl.LINES, 0, 2);
    gl.drawArrays(gl.POINTS, 0, 2);

    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  hud();

  if(A.dead && !A._ended){ A._ended = true; setTimeout(land, 900); }
}

/* ═══════════ the HUD, over the top in DOM ═══════════ */
function hud(){
  const d = host.querySelector('.ar-hud'); if(!d) return;
  const farsang = Math.round(A.dist/12);
  d.querySelector('.ar-dist b').textContent = farsang;
  const lifeBar = d.querySelector('.ar-lifef');
  lifeBar.style.width = Math.max(0, A.life*100)+'%';
  lifeBar.style.background = A.life>0.5 ? 'linear-gradient(90deg,#f7d97a,#e0a92e)'
                          : A.life>0.22 ? 'linear-gradient(90deg,#ffab3c,#c9412b)'
                                        : 'linear-gradient(90deg,#ff6a4a,#7d1f18)';
  const alt = d.querySelector('.ar-alt');
  const clear = A.y - height(A.x, A.z);
  alt.textContent = clear < 26 ? 'PULL UP' : '';
  alt.className = 'ar-alt' + (clear<26 ? ' warn' : '');
}

/* ═══════════ input ═══════════ */
const HELD = { up:false, left:false, right:false };
function bindInput(){
  const down = e=>{
    if(e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W'){ HELD.up=true; e.preventDefault(); }
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') HELD.left=true;
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') HELD.right=true;
  };
  const up = e=>{
    if(e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W') HELD.up=false;
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') HELD.left=false;
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') HELD.right=false;
  };
  addEventListener('keydown', down); addEventListener('keyup', up);
  // touch / mouse: left half steers left, right half right, anywhere pulls up
  const pt = (e, on)=>{
    const t = e.touches ? e.touches[0] : e;
    if(!t){ HELD.up=HELD.left=HELD.right=false; return; }
    HELD.up = on;
    const x = t.clientX / innerWidth;
    HELD.left  = on && x < 0.33;
    HELD.right = on && x > 0.67;
  };
  cv.addEventListener('pointerdown', e=>pt(e,true));
  cv.addEventListener('pointermove', e=>{ if(HELD.up) pt(e,true); });
  addEventListener('pointerup', ()=>{ HELD.up=HELD.left=HELD.right=false; });
  ARASH._unbind = ()=>{ removeEventListener('keydown',down); removeEventListener('keyup',up); };
}

/* ═══════════ open / close ═══════════ */
function play(khan, done){
  onDone = done;
  host = document.createElement('div');
  host.className = 'arash';
  host.innerHTML = `
    <canvas class="ar-cv"></canvas>
    <div class="ar-hud">
      <div class="ar-top">
        <div class="ar-dist">ĀRASH'S SHOT · <b>0</b> <i>farsang</i></div>
        <div class="ar-life"><span>HIS LIFE</span><div class="ar-lifebar"><div class="ar-lifef"></div></div></div>
      </div>
      <div class="ar-alt"></div>
      <div class="ar-help">HOLD to climb — it spends his life · A / D to steer · let go to fall</div>
    </div>
    <div class="ar-open">
      <h2>ĀRASH THE ARCHER</h2>
      <div class="ar-fa">آرش کمانگیر</div>
      <p>Iran has lost the war. The peace is that the border will be set wherever one arrow lands.</p>
      <p>Ārash climbs Damāvand at dawn, puts <b>every particle of his strength and his life</b> into the bow, and looses. The arrow flies from dawn until noon. He is never found — he put himself into it.</p>
      <p class="ar-rule"><b>HOLD</b> anywhere, or SPACE, to keep the arrow up. It burns his life. Let go and it falls. The further it flies, the more of the country stays.</p>
      <button class="btn gold">LOOSE IT</button>
    </div>`;
  document.body.appendChild(host);
  cv = host.querySelector('.ar-cv');

  gl = cv.getContext('webgl', {antialias:true, alpha:false, powerPreference:'low-power'})
    || cv.getContext('experimental-webgl');
  if(!gl){ // no WebGL — hand the node back rather than trapping anyone
    host.remove();
    if(typeof toast!=='undefined') toast('This browser will not do 3D. Skipping.');
    return done && done({dist:0, farsang:0, skipped:true});
  }

  try{
    prog  = program(gl, VS, FS);
    lprog = program(gl, LVS, LFS);
  }catch(e){
    host.remove();
    if(typeof toast!=='undefined') toast('3D failed to start. Skipping.');
    return done && done({dist:0, farsang:0, skipped:true});
  }

  terrainVBO = gl.createBuffer(); terrainNBO = gl.createBuffer(); terrainIBO = gl.createBuffer();
  trailVBO = gl.createBuffer(); trailABO = gl.createBuffer();

  noise = mkNoise((R && R.seed) ? (R.seed & 0xffff) : 1387);
  reset(khan);
  size(); addEventListener('resize', size);
  uploadStrip(tileZ - TILE*0.15);
  bindInput();

  host.querySelector('.ar-open .btn').addEventListener('click', ()=>{
    host.querySelector('.ar-open').classList.add('gone');
    host.classList.add('flying');
    running = true; frame.last = 0;
    if(typeof MUSIC!=='undefined'){ MUSIC.setMood('t6'); MUSIC.setLevel(1); }
    raf = requestAnimationFrame(frame);
  });
}

function size(){
  if(!cv) return;
  const dpr = Math.min(1.8, devicePixelRatio||1);
  // innerWidth is 0 in a backgrounded/headless view, and a 0-wide canvas puts
  // NaN straight into the projection matrix. Fall back to the host's own box.
  const hr = host ? host.getBoundingClientRect() : null;
  const w = Math.max(320, innerWidth || (hr && hr.width) || 960);
  const h = Math.max(240, innerHeight || (hr && hr.height) || 600);
  cv.width  = Math.round(w*dpr);
  cv.height = Math.round(h*dpr);
  cv.style.width = w+'px'; cv.style.height = h+'px';
}

function land(){
  running = false; cancelAnimationFrame(raf);
  const farsang = Math.round(A.dist/12);
  best = Math.max(best, farsang);
  const tier = farsang >= 420 ? 3 : farsang >= 240 ? 2 : farsang >= 110 ? 1 : 0;
  const verdict = [
    ['THE ARROW FALLS SHORT', 'The border is drawn close to the mountain. There is less of the country than there was.'],
    ['IT CARRIES', 'Far enough that Tūrān argues about it. The border holds where it fell.'],
    ['THE OXUS', 'It comes down on the far bank, in a walnut tree, and the river is the border. That is the version everybody tells.'],
    ['BEYOND THE STORY', 'Further than the poem allows. Somebody will have to rewrite the poem.'],
  ][tier];

  const card = document.createElement('div');
  card.className = 'ar-end';
  card.innerHTML = `
    <h2>${verdict[0]}</h2>
    <div class="ar-big">${farsang} <i>farsang</i></div>
    <p>${verdict[1]}</p>
    <p class="dim">A farsang is about six kilometres — the distance a loaded caravan covers in an hour. The Achaemenids measured the Royal Road in them.</p>
    <button class="btn gold">GO ON</button>`;
  host.appendChild(card);
  requestAnimationFrame(()=>card.classList.add('in'));
  card.querySelector('.btn').addEventListener('click', ()=>{
    close();
    onDone && onDone({ dist:A.dist, farsang, tier });
  });
}

function close(){
  running = false; cancelAnimationFrame(raf);
  removeEventListener('resize', size);
  if(ARASH._unbind) ARASH._unbind();
  if(host){ host.classList.add('out'); const h=host; setTimeout(()=>h.remove(), 340); host = null; }
  if(typeof MUSIC!=='undefined') MUSIC.setLevel(0);
}

/* the arcade convention: every cabinet exposes a hook you can drive headlessly,
   because requestAnimationFrame does not fire in a backgrounded tab and a 3D
   scene you cannot step is a 3D scene you cannot test */
function _tick(n, input){
  Object.assign(HELD, input||{});
  for(let i=0;i<(n||1);i++){ if(!A || A.dead) break; step(HELD, 16.7); }
  frame.last = performance.now() - 16.7;
  running = true; frame(performance.now());
  return A ? { x:A.x, y:A.y, z:A.z, dist:A.dist, life:A.life, dead:A.dead,
               clearance: A.y - height(A.x, A.z) } : null;
}

const API = { play, close, _tick, get best(){ return best; },
              get state(){ return A ? Object.assign({}, A, { clearance: A.y - height(A.x, A.z) }) : null; } };
return API;
})();

/* ═══════════════  ĀRASH ON THE ROAD  ═══════════════
   The story is about where a country is allowed to be, so it belongs on the
   Royal Road — and it is good enough that it should also be playable from the
   title without committing to a run. */

NODE_INFO.arash = { art:'🏹', name:'THE ARCHER ON DAMĀVAND',
  desc:'Not a fight. One arrow, and the border of the country goes wherever it lands.' };

const _buildTrialMap_ar = buildTrialMap;
buildTrialMap = function(){
  _buildTrialMap_ar();
  // one shot per road, in the back half, and never on the same row as the bridge
  if(R && R.trial>=2 && R.map.length>2 && !R._arashPlaced){
    for(let tries=0; tries<6; tries++){
      const ri = 1 + Math.floor(rnd()*(R.map.length-2));
      const row = R.map[ri];
      if(row.includes('bridge')) continue;
      row[rnd()<0.5?0:1] = 'arash';
      R._arashPlaced = true;
      break;
    }
  }
};

const _enterNode_ar = enterNode;
enterNode = function(type){
  if(type==='arash'){ sfx('click'); screenArash(); return; }
  _enterNode_ar(type);
};

function screenArash(){
  UI.screen = 'node';
  if(typeof NAQQAL!=='undefined'){
    NAQQAL.tell('The war is lost. The peace is that the border goes wherever one arrow lands.', {fa:'آرش کمانگیر', hold:3000});
  }
  ARASH.play(Math.min(4, R.khan), (res)=>{
    if(res.skipped){ showOutcome('The mountain is in cloud. You go around it.'); return; }
    const f = res.farsang;
    const gold = Math.round(f*0.9);
    R.gold += gold;
    let text, extra = '';
    if(res.tier>=2){
      const heal = 14 + res.tier*6;
      RunAPI.heal(heal);
      if(res.tier>=3){ const n = RunAPI.giveTalisman('rare');
        extra = `\n\nThey find the arrow in a walnut tree on the far bank and nobody can pull it out. Somebody presses ${n} into your hand and will not say where they got it.`; }
      text = `The arrow comes down ${f} farsang east, and the border is drawn there.\n\nĀrash is not found. He is not in the story after this line — he put himself into the shot, which is the whole point of him.\n\n+${gold} dirhams, +${heal} HP.` + extra;
      sfx('secret');
    } else if(res.tier===1){
      RunAPI.heal(8);
      text = `${f} farsang. Far enough that the other side argues about it, which is as much as most borders ever manage.\n\n+${gold} dirhams, +8 HP.`;
    } else {
      text = `${f} farsang. The arrow falls inside the mountains and the line is drawn close.\n\nThere is less country than there was this morning. +${gold} dirhams.`;
    }
    showOutcome(text);
  });
}

/* and from the title, standalone */
const _screenTitle_ar = screenTitle;
screenTitle = function(){
  _screenTitle_ar();
  const btns = $('.tbtns'); if(!btns) return;
  const b = el('button',{class:'btn', onclick:()=>{
    ARASH.play(1, (res)=>{
      screenTitle();
      if(!res.skipped) toast(`${res.farsang} farsang — ` +
        (res.tier>=3?'further than the poem allows.':res.tier>=2?'the Oxus. That is the version everybody tells.':res.tier>=1?'it carries.':'short of the river.'), 'big');
    });
  }},'🏹  ĀRASH’S SHOT');
  const codex = [...btns.children].find(n=>/CODEX/.test(n.textContent));
  btns.insertBefore(b, codex || null);
};
