/* MISHANAMEH — the sigils.
   ────────────────────────────────────────────────────────────────────────
   Every creature in this game is drawn at runtime as a Sasanian silver plate,
   and then the map screen — the screen you see more than any other except the
   fight itself — put ⚔️ and 💀 and 🏺 next to them. Apple's emoji, at whatever
   size the OS felt like, in a completely different visual language.

   So: the same roundel, the same beading, the same chased line, for every
   thing that is not a creature. Node types, the gold, the talisman count, the
   piles. Drawn once and cached.                                             */

const SIGIL = (function(){

const cache = new Map();

/* the shared plate: a gilt dish with a pearl border, the way PLATE does it */
function dish(g, S, opt){
  const o = Object.assign({rim:'#e0a92e', field:'#141a3c', pearls:true, glow:0}, opt||{});
  const R = S*0.46;
  // field
  const grd = g.createRadialGradient(S*0.38, S*0.34, S*0.05, S*0.5, S*0.5, R);
  grd.addColorStop(0, o.field2 || '#1d2550');
  grd.addColorStop(1, o.field);
  g.fillStyle = grd;
  g.beginPath(); g.arc(S/2, S/2, R, 0, 6.2832); g.fill();
  // rim
  g.strokeStyle = o.rim; g.lineWidth = Math.max(1.4, S*0.018);
  g.beginPath(); g.arc(S/2, S/2, R, 0, 6.2832); g.stroke();
  g.strokeStyle = 'rgba(224,169,46,.42)'; g.lineWidth = Math.max(1, S*0.009);
  g.beginPath(); g.arc(S/2, S/2, R*0.9, 0, 6.2832); g.stroke();
  // pearl roundel
  if(o.pearls){
    const n = Math.max(22, Math.round(S*0.42));
    g.fillStyle = o.rim;
    for(let i=0;i<n;i++){
      const a = i/n*6.2832 - 1.57;
      g.beginPath();
      g.arc(S/2 + Math.cos(a)*R*0.955, S/2 + Math.sin(a)*R*0.955, Math.max(0.8, S*0.011), 0, 6.2832);
      g.fill();
    }
  }
}

/* chased line work — everything inside a sigil is drawn with this */
function line(g, pts, w, col, close){
  g.strokeStyle = col || '#f7d97a';
  g.lineWidth = w || 2; g.lineJoin='round'; g.lineCap='round';
  g.beginPath();
  pts.forEach((p,i)=> i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]));
  if(close) g.closePath();
  g.stroke();
}
function fill(g, pts, col, close){
  g.fillStyle = col;
  g.beginPath();
  pts.forEach((p,i)=> i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]));
  g.closePath(); g.fill();
}

/* an eight-point star — the single most Persian mark there is */
function star8(g, cx, cy, R, r, col, w){
  const pts = [];
  for(let i=0;i<16;i++){
    const a = i/16*6.2832 - 1.5708;
    const rad = i%2 ? r : R;
    pts.push([cx+Math.cos(a)*rad, cy+Math.sin(a)*rad]);
  }
  line(g, pts, w||2, col, true);
  return pts;
}

/* ═══════════════  THE MARKS  ═══════════════ */
const MARKS = {

  /* two crossed shamshirs — curved, because a shamshir is */
  battle(g, S){
    const c = S/2, k = S*0.20;
    [[-1,1],[1,1]].forEach(([sx])=>{
      const pts = [];
      for(let t=0;t<=1.001;t+=0.1){
        const a = -0.5 + t*1.15;
        pts.push([ c + sx*(Math.sin(a)*k*1.5), c + (t-0.5)*k*2.5 - Math.cos(a)*k*0.28 ]);
      }
      line(g, pts, S*0.030, '#e8ddc4');
      // hilt
      const h = pts[pts.length-1];
      line(g, [[h[0]-sx*k*0.32, h[1]+k*0.10],[h[0]+sx*k*0.24, h[1]-k*0.02]], S*0.036, '#e0a92e');
      line(g, [[h[0], h[1]+k*0.08],[h[0]+sx*k*0.06, h[1]+k*0.44]], S*0.030, '#e0a92e');
    });
  },

  /* a dīv's skull: horns, a heavy brow, one eye socket in profile */
  elite(g, S){
    const c = S/2;
    fill(g, [[c-S*0.13,c-S*0.10],[c+S*0.13,c-S*0.10],[c+S*0.15,c+S*0.05],
             [c+S*0.06,c+S*0.17],[c-S*0.06,c+S*0.17],[c-S*0.15,c+S*0.05]], '#e8ddc4');
    // horns
    line(g, [[c-S*0.12,c-S*0.10],[c-S*0.20,c-S*0.20],[c-S*0.14,c-S*0.26]], S*0.028, '#c9412b');
    line(g, [[c+S*0.12,c-S*0.10],[c+S*0.20,c-S*0.20],[c+S*0.14,c-S*0.26]], S*0.028, '#c9412b');
    // sockets and teeth
    g.fillStyle='#141a3c';
    g.beginPath(); g.ellipse(c-S*0.06,c-S*0.01,S*0.036,S*0.045,0,0,6.2832); g.fill();
    g.beginPath(); g.ellipse(c+S*0.06,c-S*0.01,S*0.036,S*0.045,0,0,6.2832); g.fill();
    line(g, [[c-S*0.06,c+S*0.10],[c+S*0.06,c+S*0.10]], S*0.016, '#141a3c');
    for(let i=-2;i<=2;i++) line(g, [[c+i*S*0.028,c+S*0.10],[c+i*S*0.028,c+S*0.16]], S*0.011, '#141a3c');
  },

  /* a fire in a stone hearth — the atash, not a campfire */
  camp(g, S){
    const c = S/2;
    // hearth
    fill(g, [[c-S*0.17,c+S*0.17],[c+S*0.17,c+S*0.17],[c+S*0.12,c+S*0.09],[c-S*0.12,c+S*0.09]], '#7d5a2a');
    line(g, [[c-S*0.17,c+S*0.17],[c+S*0.17,c+S*0.17]], S*0.02, '#e0a92e');
    // flame — three tongues, the middle tallest
    const flame = (dx, h, col)=>{
      fill(g, [[c+dx, c+S*0.09],
               [c+dx-S*0.055, c+S*0.01],
               [c+dx-S*0.018, c-S*0.02],
               [c+dx, c-h],
               [c+dx+S*0.018, c-S*0.02],
               [c+dx+S*0.055, c+S*0.01]], col);
    };
    flame(-S*0.075, S*0.10, 'rgba(201,65,43,.9)');
    flame( S*0.075, S*0.10, 'rgba(201,65,43,.9)');
    flame(0, S*0.19, '#e0a92e');
    flame(0, S*0.12, '#fff4cf');
  },

  /* a two-pan balance — the bazaar is arithmetic */
  bazaar(g, S){
    const c = S/2, top = c - S*0.16;
    line(g, [[c, top],[c, c+S*0.15]], S*0.022, '#e0a92e');
    line(g, [[c-S*0.19, top],[c+S*0.19, top]], S*0.022, '#e0a92e');
    line(g, [[c-S*0.11, c+S*0.15],[c+S*0.11, c+S*0.15]], S*0.022, '#e0a92e');
    [-1,1].forEach(s=>{
      const x = c + s*S*0.19;
      line(g, [[x, top],[x, top+S*0.07]], S*0.012, '#e0a92e');
      const pan = [[x-S*0.075, top+S*0.07],[x+S*0.075, top+S*0.07],[x+S*0.05, top+S*0.13],[x-S*0.05, top+S*0.13]];
      fill(g, pan, 'rgba(224,169,46,.28)');
      line(g, pan, S*0.014, '#f7d97a', true);
    });
    g.fillStyle='#e0a92e';
    g.beginPath(); g.arc(c, top, S*0.026, 0, 6.2832); g.fill();
  },

  /* an omen: the eight-point star with a smaller one inside it */
  omen(g, S){
    const c = S/2;
    star8(g, c, c, S*0.24, S*0.10, '#f7d97a', S*0.020);
    star8(g, c, c, S*0.13, S*0.055, 'rgba(95,208,204,.9)', S*0.014);
    g.fillStyle='#fff4cf';
    g.beginPath(); g.arc(c, c, S*0.026, 0, 6.2832); g.fill();
  },

  /* the boss: a crenellated Achaemenid crown */
  boss(g, S){
    const c = S/2, w = S*0.21, top = c - S*0.13;
    const pts = [[c-w, c+S*0.13],[c-w, top]];
    for(let i=0;i<5;i++){
      const x0 = c-w + (i*2)*(w/5), x1 = c-w + (i*2+1)*(w/5);
      pts.push([x0, top - (i%2?0:S*0.075)], [x1, top - (i%2?0:S*0.075)]);
    }
    pts.push([c+w, top],[c+w, c+S*0.13]);
    fill(g, pts, 'rgba(224,169,46,.32)');
    line(g, pts, S*0.020, '#f7d97a', true);
    line(g, [[c-w, c+S*0.04],[c+w, c+S*0.04]], S*0.014, '#e0a92e');
    g.fillStyle='#c9412b';
    g.beginPath(); g.arc(c, c+S*0.085, S*0.032, 0, 6.2832); g.fill();
  },

  /* the Chinvat bridge: a span narrowing to a razor */
  bridge(g, S){
    const c = S/2;
    line(g, [[c-S*0.24, c+S*0.10],[c-S*0.06, c-S*0.06],[c+S*0.06,c-S*0.06],[c+S*0.24, c+S*0.10]], S*0.024, '#e8ddc4');
    line(g, [[c-S*0.24, c+S*0.10],[c-S*0.24, c+S*0.18]], S*0.018, '#7d5a2a');
    line(g, [[c+S*0.24, c+S*0.10],[c+S*0.24, c+S*0.18]], S*0.018, '#7d5a2a');
    for(let i=-2;i<=2;i++){
      const t = (i+2)/4;
      const x = c - S*0.24 + t*S*0.48;
      const y = c + S*0.10 - Math.sin(t*Math.PI)*S*0.16;
      line(g, [[x, y],[x, y+S*0.055]], S*0.010, 'rgba(95,208,204,.8)');
    }
    g.fillStyle='rgba(95,208,204,.7)';
    g.beginPath(); g.arc(c, c-S*0.11, S*0.022, 0, 6.2832); g.fill();
  },

  /* Ārash: a drawn bow with the arrow still on the string */
  arash(g, S){
    const c = S/2;
    const bow = [];
    for(let t=0;t<=1.001;t+=0.08){
      const a = -1.15 + t*2.30;
      bow.push([ c - S*0.05 + Math.cos(a)*S*0.235, c + Math.sin(a)*S*0.235 ]);
    }
    line(g, bow, S*0.026, '#7d5a2a');
    line(g, [bow[0], bow[bow.length-1]], S*0.010, '#e8ddc4');
    // the arrow, drawn back
    line(g, [[c-S*0.20, c],[c+S*0.22, c]], S*0.018, '#f7d97a');
    fill(g, [[c+S*0.22,c],[c+S*0.14,c-S*0.045],[c+S*0.14,c+S*0.045]], '#fff4cf');
    line(g, [[c-S*0.20,c],[c-S*0.26,c-S*0.05]], S*0.012, '#e8ddc4');
    line(g, [[c-S*0.20,c],[c-S*0.26,c+S*0.05]], S*0.012, '#e8ddc4');
  },

  /* dirhams — a struck coin with a Sasanian bust reduced to a mark */
  gold(g, S){
    const c = S/2;
    g.fillStyle='#e0a92e';
    g.beginPath(); g.arc(c,c,S*0.30,0,6.2832); g.fill();
    g.strokeStyle='#9a6f14'; g.lineWidth=S*0.03;
    g.beginPath(); g.arc(c,c,S*0.30,0,6.2832); g.stroke();
    g.strokeStyle='#7d5a2a'; g.lineWidth=S*0.035;
    g.beginPath(); g.arc(c,c-S*0.03,S*0.10,3.6,6.0); g.stroke();
    line(g, [[c-S*0.09,c+S*0.13],[c+S*0.09,c+S*0.13]], S*0.030, '#7d5a2a');
  },

  /* a talisman — a pierced amulet on a cord */
  tal(g, S){
    const c = S/2;
    const pts = [[c,c-S*0.24],[c+S*0.19,c-S*0.05],[c+S*0.12,c+S*0.22],[c-S*0.12,c+S*0.22],[c-S*0.19,c-S*0.05]];
    fill(g, pts, 'rgba(46,156,156,.5)');
    line(g, pts, S*0.024, '#5fd0cc', true);
    g.fillStyle='#141a3c';
    g.beginPath(); g.arc(c,c-S*0.09,S*0.035,0,6.2832); g.fill();
    star8(g, c, c+S*0.06, S*0.085, S*0.036, '#f7d97a', S*0.013);
  },
};

/* ═══════════════  PUBLIC  ═══════════════ */
function node(kind, size, opt){
  size = size || 96;
  const key = kind+'@'+size+'@'+(opt&&opt.flat?'f':'d');
  if(cache.has(key)) return cache.get(key).cloneNode ? clone(cache.get(key)) : cache.get(key);
  const dpr = Math.min(2, devicePixelRatio||1);
  const cv = document.createElement('canvas');
  cv.width = Math.round(size*dpr); cv.height = Math.round(size*dpr);
  cv.style.width = size+'px'; cv.style.height = size+'px';
  const g = cv.getContext('2d');
  g.setTransform(dpr,0,0,dpr,0,0);
  const mk = MARKS[kind];
  if(!(opt && opt.flat)) dish(g, size, opt);
  if(mk) mk(g, size);
  cache.set(key, cv);
  return clone(cv);
}
/* canvases cannot be reused in two places at once, so hand out copies */
function clone(src){
  const cv = document.createElement('canvas');
  cv.width = src.width; cv.height = src.height;
  cv.style.width = src.style.width; cv.style.height = src.style.height;
  cv.getContext('2d').drawImage(src, 0, 0);
  return cv;
}


/* ═══════════════  THE TALISMANS  ═══════════════
   There are forty-eight of them and they were all emoji — "Holy Devotion, who
   is the earth" was illustrated with the photographic Earth emoji, next to a
   hand-drawn Sasanian plate. Drawing forty-eight amulets by hand is not the
   answer either; the answer is the one Persian craftsmen already used.

   Girih is a construction, not a picture: a rosette of n points, struck by
   compass and straightedge, with the strapwork woven through it. Change the
   point count, the ring depth, the strap rhythm and the palette and you get an
   unlimited family of devices that are all unmistakably from the same
   workshop. So each talisman's id is hashed into one of those constructions.
   Forty-eight distinct amulets, no two alike, all correct.                  */

function hash32(s){
  let h = 2166136261>>>0;
  for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619)>>>0; }
  return h>>>0;
}

const RARITY_PAL = {
  common:   { rim:'#5fd0cc', ink:'#9fe8e4', field:'#0d2b34', field2:'#16414c', accent:'#d9fffb' },
  uncommon: { rim:'#e0a92e', ink:'#f7d97a', field:'#2a2008', field2:'#453313', accent:'#fff4cf' },
  rare:     { rim:'#e8734f', ink:'#ffb9a2', field:'#33100c', field2:'#521c14', accent:'#ffd0c4' },
  boss:     { rim:'#f3e6cd', ink:'#ffffff', field:'#241d3f', field2:'#3a2f66', accent:'#ffffff' },
};

/* one girih rosette, struck at n points */
function rosette(g, cx, cy, R, n, phase, pal, depth){
  // the outer polygon
  const poly = (rad, off, k)=>{
    const pts=[];
    for(let i=0;i<k;i++){
      const a = phase + off + i/k*6.2832;
      pts.push([cx+Math.cos(a)*rad, cy+Math.sin(a)*rad]);
    }
    return pts;
  };
  // interlaced strapwork: two rotated polygons plus the star that joins them
  line(g, poly(R, 0, n), Math.max(1.1, R*0.055), pal.ink, true);
  line(g, poly(R*0.78, 3.1416/n, n), Math.max(1, R*0.045), pal.rim, true);

  // the star itself
  const st=[];
  for(let i=0;i<n*2;i++){
    const a = phase + i/(n*2)*6.2832;
    const rad = i%2 ? R*depth : R*0.97;
    st.push([cx+Math.cos(a)*rad, cy+Math.sin(a)*rad]);
  }
  g.fillStyle = 'rgba(255,255,255,.07)';
  g.beginPath(); st.forEach((p,i)=> i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); g.fill();
  line(g, st, Math.max(1, R*0.05), pal.accent, true);

  // spokes out to the rim, the way strapwork leaves a rosette
  for(let i=0;i<n;i++){
    const a = phase + i/n*6.2832;
    line(g, [[cx+Math.cos(a)*R*0.97, cy+Math.sin(a)*R*0.97],
             [cx+Math.cos(a)*R*1.30, cy+Math.sin(a)*R*1.30]], Math.max(0.9, R*0.038), pal.rim);
  }
}

function talismanArt(id, size, rarity){
  size = size || 82;
  const key = 'tal:'+id+'@'+size;
  if(cache.has(key)) return clone(cache.get(key));

  const h = hash32(id);
  const pal = RARITY_PAL[rarity] || RARITY_PAL.common;
  const n     = [6,8,8,10,12,5][h % 6];
  const phase = ((h>>>3) % 360) * Math.PI/180;
  const depth = 0.34 + ((h>>>9) % 5) * 0.06;
  const rings = 1 + ((h>>>13) % 3);

  const dpr = Math.min(2, devicePixelRatio||1);
  const cv = document.createElement('canvas');
  cv.width = Math.round(size*dpr); cv.height = Math.round(size*dpr);
  cv.style.width = size+'px'; cv.style.height = size+'px';
  const g = cv.getContext('2d');
  g.setTransform(dpr,0,0,dpr,0,0);

  dish(g, size, { rim:pal.rim, field:pal.field, field2:pal.field2 });

  const c = size/2;
  rosette(g, c, c, size*0.20, n, phase, pal, depth);

  // concentric struck rings, the number of them another dimension of variation
  for(let r=0;r<rings;r++){
    g.strokeStyle = pal.rim;
    g.globalAlpha = 0.30 - r*0.07;
    g.lineWidth = Math.max(0.8, size*0.010);
    g.beginPath(); g.arc(c, c, size*(0.335 + r*0.032), 0, 6.2832); g.stroke();
    g.globalAlpha = 1;
  }

  // and a small counter-rosette at the top, so they are not radially symmetric
  if((h>>>17)&1) rosette(g, c, c - size*0.30, size*0.055, n>8?6:8, -phase, pal, 0.4);

  cache.set(key, cv);
  return clone(cv);
}



return { node, MARKS, dish, star8, talisman: talismanArt, hash32 };
})();

/* small marks for the intent chips — the last OS emoji in the fight */
SIGIL.mark = function(kind, size){
  size = size || 15;
  const key = 'mark:'+kind+'@'+size;
  const dpr = Math.min(2, devicePixelRatio||1);
  const cv = document.createElement('canvas');
  cv.width = Math.round(size*dpr); cv.height = Math.round(size*dpr);
  cv.style.width = size+'px'; cv.style.height = size+'px';
  const g = cv.getContext('2d');
  g.setTransform(dpr,0,0,dpr,0,0);
  const S = size, c = S/2;
  const ln = (pts,w,col)=>{ g.strokeStyle=col; g.lineWidth=w; g.lineCap='round'; g.lineJoin='round';
    g.beginPath(); pts.forEach((p,i)=> i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.stroke(); };
  const fl = (pts,col)=>{ g.fillStyle=col; g.beginPath();
    pts.forEach((p,i)=> i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); g.fill(); };

  if(kind==='atk'){                       // a sword, point down — grip, guard, blade
    ln([[c, S*0.04],[c, S*0.22]], S*0.13, '#ffe8c4');
    ln([[c-S*0.28, S*0.24],[c+S*0.28, S*0.24]], S*0.12, '#ffe8c4');
    fl([[c-S*0.17, S*0.28],[c+S*0.17, S*0.28],[c, S*0.96]], '#ffd4c2');
  } else if(kind==='def'){                // a shield
    fl([[c,S*0.10],[c+S*0.30,S*0.26],[c+S*0.24,S*0.66],[c,S*0.90],[c-S*0.24,S*0.66],[c-S*0.30,S*0.26]], 'rgba(185,236,234,.9)');
  } else if(kind==='buf'){                // an ascending chevron
    ln([[c-S*0.26,S*0.60],[c,S*0.26],[c+S*0.26,S*0.60]], S*0.13, '#ffe6a8');
    ln([[c-S*0.26,S*0.86],[c,S*0.52],[c+S*0.26,S*0.86]], S*0.11, 'rgba(255,230,168,.55)');
  } else if(kind==='deb'){                // a descending chevron
    ln([[c-S*0.26,S*0.34],[c,S*0.68],[c+S*0.26,S*0.34]], S*0.13, '#dfc4ff');
    ln([[c-S*0.26,S*0.14],[c,S*0.48],[c+S*0.26,S*0.14]], S*0.11, 'rgba(223,196,255,.5)');
  } else {                                // unknown — a small eight-point star
    for(let i=0;i<8;i++){
      const a=i/8*6.2832;
      ln([[c,c],[c+Math.cos(a)*S*0.36, c+Math.sin(a)*S*0.36]], S*0.09, '#f3e6cd');
    }
  }
  return cv;
};
