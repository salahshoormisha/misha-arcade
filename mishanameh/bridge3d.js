/* MISHANAMEH — THE CHINVAT BRIDGE, in three dimensions.
   ────────────────────────────────────────────────────────────────────────
   چینوت پل — the Bridge of the Separator. Every soul crosses it on the fourth
   day after death. For the just it is broad as nine spears laid end to end,
   and halfway over they are met by a woman who is their own daēnā — their
   conscience, grown into a shape out of what they actually did. For the rest
   it turns edge-on, thin as a razor, and they go into the dark.

   That is not a metaphor the game has to invent. It is a width that changes
   according to your conduct, which is already a mechanic. So:

     · you walk a narrow span over nothing
     · it rolls under you, and you counter-lean to stay on it
     · three lights drift above it — Humata, Hūxta, Huvarshta:
       good thoughts, good words, good deeds
     · every one you take makes the bridge measurably wider
     · at the far side, someone is waiting, and what she looks like is
       decided by the arithmetic and not by her

   Same WebGL foundation as Ārash's Shot, same contract as the 2D version it
   replaces, so the node wiring above it does not change.                    */

const BRIDGE3D = (function(){

/* ═══════════ matrices (same shapes as arash.js, kept local) ═══════════ */
function perspective(fov, aspect, near, far){
  const f = 1/Math.tan(fov/2), nf = 1/(near-far);
  return new Float32Array([ f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0 ]);
}
function lookAt(eye, at, up){
  const z0=eye[0]-at[0], z1=eye[1]-at[1], z2=eye[2]-at[2];
  const zl=Math.hypot(z0,z1,z2)||1; const zx=z0/zl, zy=z1/zl, zz=z2/zl;
  let xx=up[1]*zz-up[2]*zy, xy=up[2]*zx-up[0]*zz, xz=up[0]*zy-up[1]*zx;
  const xl=Math.hypot(xx,xy,xz)||1; xx/=xl; xy/=xl; xz/=xl;
  const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
  return new Float32Array([
    xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0,
    -(xx*eye[0]+xy*eye[1]+xz*eye[2]),
    -(yx*eye[0]+yy*eye[1]+yz*eye[2]),
    -(zx*eye[0]+zy*eye[1]+zz*eye[2]), 1 ]);
}
function mulm(a,b){
  const o = new Float32Array(16);
  for(let i=0;i<4;i++) for(let j=0;j<4;j++){
    let s=0; for(let k=0;k<4;k++) s += a[k*4+j]*b[i*4+k];
    o[i*4+j]=s;
  }
  return o;
}

/* ═══════════ shaders ═══════════ */
const DECK_VS = `
attribute vec3 aPos;
attribute vec2 aUV;
uniform mat4 uMVP;
uniform float uRoll;
varying vec2 vUV;
varying float vZ;
void main(){
  // the whole span rolls about its own axis; that is the razor turning
  float c = cos(uRoll * (0.4 + aPos.z*0.0016)), s = sin(uRoll * (0.4 + aPos.z*0.0016));
  vec3 p = vec3(aPos.x*c, aPos.x*s + aPos.y, aPos.z);
  vUV = aUV; vZ = aPos.z;
  gl_Position = uMVP * vec4(p, 1.0);
}`;
const DECK_FS = `
precision mediump float;
varying vec2 vUV;
varying float vZ;
uniform float uWalk;
void main(){
  // gold plank work with a chased centre line
  float across = abs(vUV.x - 0.5) * 2.0;
  float plank  = smoothstep(0.46, 0.5, fract(vZ * 0.14));
  vec3 gold = mix(vec3(0.55,0.38,0.12), vec3(0.90,0.72,0.34), 1.0 - across);
  gold = mix(gold, vec3(1.0,0.94,0.76), (1.0 - smoothstep(0.0, 0.10, across)) * 0.55);
  gold *= 1.0 - plank*0.22;
  // the edges glow, so you can see exactly where the span stops
  float edge = smoothstep(0.86, 1.0, across);
  gold += vec3(1.0, 0.86, 0.5) * edge * 0.9;
  // it fades out ahead of you into the dark
  float far = 1.0 - clamp((vZ - uWalk - 30.0)/120.0, 0.0, 1.0);
  gl_FragColor = vec4(gold * far, 1.0);
}`;

const PT_VS = `
attribute vec3 aPos;
attribute float aKind;
uniform mat4 uMVP;
uniform float uT;
varying float vKind;
void main(){
  vKind = aKind;
  vec3 p = aPos;
  p.y += sin(uT*0.0016 + aPos.z*0.3)*0.5;
  vec4 cp = uMVP * vec4(p, 1.0);
  gl_Position = cp;
  gl_PointSize = clamp(220.0 / max(1.0, cp.w), 3.0, 46.0);
}`;
const PT_FS = `
precision mediump float;
varying float vKind;
void main(){
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  if(r > 0.5) discard;
  float core = smoothstep(0.5, 0.0, r);
  vec3 col = vKind < 0.5 ? vec3(1.0,0.95,0.75)      // a light to be taken
           : vKind < 1.5 ? vec3(0.42,0.86,0.84)      // a soul, far below
           :               vec3(0.55,0.58,0.95);     // stars
  gl_FragColor = vec4(col * core, core * (vKind < 0.5 ? 1.0 : 0.66));
}`;

const VOID_VS = `attribute vec2 aXY; varying vec2 vUV;
void main(){ vUV = aXY*0.5+0.5; gl_Position = vec4(aXY, 0.999, 1.0); }`;
const VOID_FS = `
precision mediump float;
varying vec2 vUV;
uniform float uT;
void main(){
  // not black — a cold depth with something moving very slowly in it
  float y = vUV.y;
  vec3 col = mix(vec3(0.015,0.02,0.06), vec3(0.06,0.05,0.14), smoothstep(0.0,0.8,y));
  float band = sin(vUV.x*7.0 + uT*0.0002) * sin(y*11.0 - uT*0.00013);
  col += vec3(0.03,0.05,0.10) * band * 0.35;
  gl_FragColor = vec4(col, 1.0);
}`;

/* ═══════════ boilerplate ═══════════ */
function sh(gl, t, src){
  const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
  if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function prog(gl, v, f){
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl, gl.VERTEX_SHADER, v));
  gl.attachShader(p, sh(gl, gl.FRAGMENT_SHADER, f));
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

/* ═══════════ the walk ═══════════ */
const LEN = 220;                       // world units end to end
const LIGHTS = [
  { z: LEN*0.22, fa:'هومت', en:'Good Thoughts', tr:'Humata' },
  { z: LEN*0.48, fa:'هوخت', en:'Good Words',    tr:'Hūxta'  },
  { z: LEN*0.74, fa:'هورشت',en:'Good Deeds',    tr:'Huvarshta' },
];

let gl, cv, host, raf=0, running=false, last=0, onDone=null;
let pDeck, pPt, pVoid, deckVBO, deckUVO, deckIBO, deckCount, ptVBO, ptKBO, voidVBO;
let S = null;

function reset(diff){
  S = {
    walk: 0, lean: 0, vlean: 0, roll: 0, wobble: 0, phase: Math.random()*6.28,
    deeds: 0, caught: [], lights: LIGHTS.map(l=>({...l, got:false})),
    dead: false, won: false, started: false,
    diff: Math.max(1, Math.min(4, diff||1)),
    t: 0,
  };
}
/* the bridge is narrow, and every light you take widens it — which is the myth */
function halfWidth(){
  const base = 1.5 - (S.diff-1)*0.16;
  return base + S.deeds * 0.95;
}

function buildDeck(){
  // a long ribbon, segmented so it can be rolled in the vertex shader
  const SEG = 160, pos=[], uv=[], idx=[];
  for(let i=0;i<=SEG;i++){
    const z = (i/SEG)*LEN;
    pos.push(-1, 0, z,  1, 0, z);
    uv.push(0,0, 1,0);
  }
  for(let i=0;i<SEG;i++){
    const a=i*2, b=a+1, c=a+2, d=a+3;
    idx.push(a,c,b, b,c,d);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, deckVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, deckUVO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, deckIBO);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
  deckCount = idx.length;
}

function step(input, dt){
  if(!S || S.dead || S.won || !S.started) return;
  const k = dt/16.7;
  S.t += dt;

  /* The tuning here matters more than anything else in the file. The drift
     has to be something you can always beat — about 1.7× — or the walk is not
     a balance, it is a coin toss. Terminal velocities, per frame:
        correction  0.0030 / (1-0.92) = 0.0375
        drift  max  0.0018 / (1-0.92) = 0.0225
     which gives roughly a second of ignoring it before you are off. */
  S.phase += 0.010*k*(0.75 + S.diff*0.12);
  const push = (Math.sin(S.phase)*0.0012 + Math.sin(S.phase*2.31)*0.0006)
             * (0.85 + S.diff*0.15);
  S.vlean += push*k;

  if(input.left)  S.vlean -= 0.0030*k;
  if(input.right) S.vlean += 0.0030*k;
  S.vlean *= Math.pow(0.92, k);
  S.lean  += S.vlean*k;

  S.roll += ((S.lean*0.10) - S.roll)*0.09*k;

  const hw = halfWidth();
  if(Math.abs(S.lean) > hw){ S.dead = true; return; }

  S.walk += (0.30 + 0.045*S.diff)*k;

  // a light is taken by being close to it in both axes as you pass
  S.lights.forEach(L=>{
    if(L.got) return;
    if(Math.abs(S.walk - L.z) < 2.2 && Math.abs(S.lean - lightX(L)) < 1.35){
      L.got = true; S.deeds++; S.caught.push(L);
      if(typeof GFX!=='undefined'){ GFX.shake(4, 260); }
      if(typeof sfx!=='undefined') sfx('secret');
      say(L.tr + ' — ' + L.en.toLowerCase() + '. The span widens.');
    }
  });

  if(S.walk >= LEN-4){ S.won = true; }
}

/* lights drift off the centre line, so taking one costs you your balance */
function lightX(L){ return Math.sin(L.z*0.37)*0.9; }

/* ═══════════ render ═══════════ */
function frame(now){
  if(!running) return;
  raf = requestAnimationFrame(frame);
  const dt = Math.min(40, now - (last||now)); last = now;
  step(HELD, dt);

  if(!cv.width || !cv.height) size();
  gl.viewport(0,0,cv.width,cv.height);
  gl.clearColor(0.015,0.02,0.06,1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // the void behind everything
  gl.disable(gl.DEPTH_TEST);
  gl.useProgram(pVoid);
  gl.uniform1f(gl.getUniformLocation(pVoid,'uT'), S.t);
  const vxy = gl.getAttribLocation(pVoid,'aXY');
  gl.bindBuffer(gl.ARRAY_BUFFER, voidVBO);
  gl.enableVertexAttribArray(vxy); gl.vertexAttribPointer(vxy,2,gl.FLOAT,false,0,0);
  gl.drawArrays(gl.TRIANGLES,0,3);
  gl.disableVertexAttribArray(vxy);
  gl.enable(gl.DEPTH_TEST);

  const hw = halfWidth();
  // further back and higher, so the span reads as something you could fall off
  const eye = [ S.lean*0.52, 4.6, S.walk - 15 ];
  const at  = [ S.lean*0.26, 1.9, S.walk + 34 ];
  const P = perspective(0.95, cv.width/cv.height, 0.4, 400);
  const V = lookAt(eye, at, [0,1,0]);
  const MVP = mulm(P, V);

  // the span
  gl.useProgram(pDeck);
  gl.uniformMatrix4fv(gl.getUniformLocation(pDeck,'uMVP'), false, MVP);
  gl.uniform1f(gl.getUniformLocation(pDeck,'uRoll'), S.roll);
  gl.uniform1f(gl.getUniformLocation(pDeck,'uWalk'), S.walk);
  const dp = gl.getAttribLocation(pDeck,'aPos'), du = gl.getAttribLocation(pDeck,'aUV');
  // width is a uniform scale on x, applied by rewriting the buffer's x each frame
  gl.bindBuffer(gl.ARRAY_BUFFER, deckVBO);
  gl.enableVertexAttribArray(dp); gl.vertexAttribPointer(dp,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER, deckUVO);
  gl.enableVertexAttribArray(du); gl.vertexAttribPointer(du,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, deckIBO);
  // scale x by the current half-width via the model baked into uRoll's cos/sin —
  // simpler to scale here with a second uniform-free trick: pre-scaled buffer
  scaleDeck(hw);
  gl.drawElements(gl.TRIANGLES, deckCount, gl.UNSIGNED_SHORT, 0);

  // lights, souls below, stars above
  drawPoints(MVP);

  hud(hw);

  if(S.dead || S.won){ running = false; setTimeout(finish, 700); }
}

let deckScaled = -1;
function scaleDeck(hw){
  if(Math.abs(deckScaled - hw) < 0.001) return;
  deckScaled = hw;
  const SEG = 160, pos=[];
  for(let i=0;i<=SEG;i++){
    const z = (i/SEG)*LEN;
    pos.push(-hw, 0, z,  hw, 0, z);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, deckVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(gl.getAttribLocation(pDeck,'aPos'),3,gl.FLOAT,false,0,0);
}

function drawPoints(MVP){
  const pos=[], kind=[];
  S.lights.forEach(L=>{ if(L.got) return; pos.push(lightX(L), 2.0, L.z); kind.push(0); });
  // souls, drifting far below and behind
  for(let i=0;i<70;i++){
    const z = ((i*37.7 + S.t*0.004) % LEN);
    pos.push(Math.sin(i*2.7)*26, -14 - (i%9)*3.2, z); kind.push(1);
  }
  // and something like stars, very far off
  for(let i=0;i<90;i++){
    pos.push(Math.sin(i*4.1)*160, 20 + (i%17)*4.5, (i*23.3)%LEN); kind.push(2);
  }
  gl.useProgram(pPt);
  gl.uniformMatrix4fv(gl.getUniformLocation(pPt,'uMVP'), false, MVP);
  gl.uniform1f(gl.getUniformLocation(pPt,'uT'), S.t);
  const a = gl.getAttribLocation(pPt,'aPos'), b = gl.getAttribLocation(pPt,'aKind');
  gl.bindBuffer(gl.ARRAY_BUFFER, ptVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER, ptKBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(kind), gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(b); gl.vertexAttribPointer(b,1,gl.FLOAT,false,0,0);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
  gl.drawArrays(gl.POINTS, 0, kind.length);
  gl.depthMask(true); gl.disable(gl.BLEND);
}

/* ═══════════ HUD ═══════════ */
function hud(hw){
  const d = host.querySelector('.br-hud'); if(!d) return;
  d.querySelector('.br-prog b').textContent = Math.round(S.walk/LEN*100);
  d.querySelector('.br-deeds').textContent = S.deeds + ' / 3';
  const tilt = d.querySelector('.br-tiltf');
  const pct = Math.max(-1, Math.min(1, S.lean/hw));
  tilt.style.transform = `translateX(${(pct*50).toFixed(1)}%)`;
  tilt.style.background = Math.abs(pct)>0.78 ? 'linear-gradient(90deg,#ff6a4a,#c9412b)'
                        : Math.abs(pct)>0.5  ? 'linear-gradient(90deg,#ffab3c,#e0a92e)'
                                             : 'linear-gradient(90deg,#7fe6e0,#2e9c9c)';
  const w = d.querySelector('.br-width');
  w.textContent = S.deeds===0 ? 'a razor' : S.deeds===1 ? 'a hand’s breadth'
                : S.deeds===2 ? 'a road' : 'nine spears, end to end';
}
function say(t){ if(typeof NAQQAL!=='undefined') NAQQAL.tell(t, {hold:2200}); }

/* ═══════════ input ═══════════ */
const HELD = { left:false, right:false };
let unbind = null;
function bindInput(){
  const dn = e=>{
    if(!S.started){ S.started = true; }
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){ HELD.left=true; e.preventDefault(); }
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){ HELD.right=true; e.preventDefault(); }
  };
  const up = e=>{
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') HELD.left=false;
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') HELD.right=false;
  };
  addEventListener('keydown', dn); addEventListener('keyup', up);
  const pt = (e, on)=>{
    const t = e.touches ? e.touches[0] : e;
    if(!t || !on){ HELD.left=HELD.right=false; return; }
    if(!S.started) S.started = true;
    const x = t.clientX / innerWidth;
    HELD.left  = x < 0.5;
    HELD.right = x >= 0.5;
  };
  cv.addEventListener('pointerdown', e=>pt(e,true));
  cv.addEventListener('pointermove', e=>{ if(HELD.left||HELD.right) pt(e,true); });
  addEventListener('pointerup', ()=>{ HELD.left=HELD.right=false; });
  unbind = ()=>{ removeEventListener('keydown',dn); removeEventListener('keyup',up); };
}

/* ═══════════ open / close ═══════════ */
function size(){
  if(!cv) return;
  const dpr = Math.min(1.8, devicePixelRatio||1);
  const hr = host ? host.getBoundingClientRect() : null;
  const w = Math.max(320, innerWidth || (hr&&hr.width) || 900);
  const h = Math.max(240, innerHeight || (hr&&hr.height) || 600);
  cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr);
  cv.style.width = w+'px'; cv.style.height = h+'px';
}

function play(diff, done){
  onDone = done;
  host = document.createElement('div');
  host.className = 'bridge3d';
  host.innerHTML = `
    <canvas class="br-cv"></canvas>
    <div class="br-hud">
      <div class="br-top">
        <div class="br-prog">THE CROSSING · <b>0</b>%</div>
        <div class="br-w">THE SPAN IS <span class="br-width">a razor</span></div>
        <div class="br-d">TAKEN <span class="br-deeds">0 / 3</span></div>
      </div>
      <div class="br-tilt"><div class="br-tiltf"></div></div>
      <div class="br-help">LEAN with A / D — or hold the left or right half of the screen</div>
    </div>
    <div class="br-open">
      <h2>THE CHINVAT BRIDGE</h2>
      <div class="br-fa">پل چینوت</div>
      <p>Every soul crosses on the fourth day. For the just it is <b>broad as nine spears laid end to end</b>. For the rest it turns edge-on, thin as a razor.</p>
      <p>Three lights drift over it — <b>Humata, Hūxta, Huvarshta</b>: good thoughts, good words, good deeds. Every one you take makes the span measurably wider. Reaching for one costs you your balance.</p>
      <p class="br-rule"><b>A / D</b>, or the left and right halves of the screen, to lean against the roll. Do not step off.</p>
      <button class="btn gold">CROSS</button>
    </div>`;
  document.body.appendChild(host);
  cv = host.querySelector('.br-cv');

  gl = cv.getContext('webgl', {antialias:true, alpha:false}) || cv.getContext('experimental-webgl');
  if(!gl){ host.remove(); return fallback(diff, done); }
  try{
    pDeck = prog(gl, DECK_VS, DECK_FS);
    pPt   = prog(gl, PT_VS,  PT_FS);
    pVoid = prog(gl, VOID_VS, VOID_FS);
  }catch(e){ host.remove(); return fallback(diff, done); }

  deckVBO=gl.createBuffer(); deckUVO=gl.createBuffer(); deckIBO=gl.createBuffer();
  ptVBO=gl.createBuffer(); ptKBO=gl.createBuffer(); voidVBO=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, voidVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);

  reset(diff);
  size(); addEventListener('resize', size);
  buildDeck(); deckScaled = -1;
  bindInput();

  host.querySelector('.br-open .btn').addEventListener('click', ()=>{
    host.querySelector('.br-open').classList.add('gone');
    host.classList.add('walking');
    running = true; last = 0;
    if(typeof MUSIC!=='undefined'){ MUSIC.setMood('t7'); MUSIC.setLevel(1); }
    raf = requestAnimationFrame(frame);
  });
}

/* if a machine will not do WebGL, the old 2D walk is still there */
function fallback(diff, done){
  if(typeof MINIGAME!=='undefined' && MINIGAME._chinvat2d) return MINIGAME._chinvat2d(diff, done);
  done && done({won:true, deeds:0, caught:[]});
}

function finish(){
  running = false; cancelAnimationFrame(raf);
  const won = S.won;
  const card = document.createElement('div');
  card.className = 'br-end';
  const face = S.deeds>=3 ? ['SHE IS RADIANT',
      'A woman meets you halfway, fifteen years old and shining, and you ask who she is. She says: <i>I am your own good thoughts, your own good words, your own good deeds.</i> She is not a stranger. She is the arithmetic.']
    : S.deeds===2 ? ['SHE IS KIND ENOUGH',
      'Someone is waiting who has your face and is glad to see you. The span held. It was closer than it should have been.']
    : won ? ['YOU GET ACROSS',
      'Barely, and nobody is waiting at the other end. The bridge does not care how it felt — only how wide it was.']
    : ['IT TURNS EDGE-ON',
      'Thin as a razor, exactly as promised. You are pulled back to this side by something you decide not to look at directly.'];
  card.innerHTML = `<h2>${face[0]}</h2>
    <div class="br-big">${S.deeds} <i>of three</i></div>
    <p>${face[1]}</p>
    ${S.caught.length ? `<p class="dim">You carried ${S.caught.map(c=>c.tr).join(' and ')} across.</p>` : ''}
    <button class="btn gold">GO ON</button>`;
  host.appendChild(card);
  requestAnimationFrame(()=>card.classList.add('in'));
  card.querySelector('.btn').addEventListener('click', ()=>{
    close();
    onDone && onDone({ won, deeds:S.deeds, caught:S.caught.map(c=>c.en) });
  });
}

function close(){
  running=false; cancelAnimationFrame(raf);
  removeEventListener('resize', size);
  if(unbind) unbind();
  if(host){ const h=host; h.classList.add('out'); setTimeout(()=>h.remove(), 340); host=null; }
  if(typeof MUSIC!=='undefined') MUSIC.setLevel(0);
}

/* headless hook, same as the arcade's other cabinets */
function _tick(n, input){
  Object.assign(HELD, input||{});
  if(S) S.started = true;
  for(let i=0;i<(n||1);i++){ if(!S || S.dead || S.won) break; step(HELD, 16.7); }
  last = performance.now() - 16.7;
  running = true; frame(performance.now());
  return S ? { walk:S.walk, lean:+S.lean.toFixed(3), hw:+halfWidth().toFixed(2),
               deeds:S.deeds, dead:S.dead, won:S.won, pct:Math.round(S.walk/LEN*100) } : null;
}

return { play, close, _tick, get state(){ return S; } };
})();

/* ═══════════ replace the 2D walk, keeping it as the fallback ═══════════ */
if(typeof MINIGAME !== 'undefined'){
  MINIGAME._chinvat2d = MINIGAME.chinvat;
  MINIGAME.chinvat = function(diff, done){ BRIDGE3D.play(diff, done); };
}
