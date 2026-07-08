// MISHA-MAN — a loving Pac-Man homage where the maze spells M·I·S·H·A.
// Ghosts are the four horsemen of ops: DEADLINE (chases), INBOX (cuts you off),
// MEETINGS (unpredictable), BUDGET (gets close, then runs away).
(function () {
  "use strict";
  const { MAZE_ROWS, LETTER_SPANS, LETTER_COLORS, MAZE_META } = window.MM_MAZE;
  const sfx = (name, ...a) => {
    const A = window.MM_AUDIO;
    if (A && typeof A[name] === "function") { try { return A[name](...a); } catch (e) {} }
  };

  // ---------- grid ----------
  const T = 22, W = MAZE_ROWS[0].length, H = MAZE_ROWS.length;
  const LW = W * T, LH = H * T;                       // logical canvas size
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const cvs = document.getElementById("game");
  cvs.width = LW * DPR; cvs.height = LH * DPR;        // retina-sharp bitmap
  cvs.style.aspectRatio = LW + " / " + LH;
  const ctx = cvs.getContext("2d");
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const LETTERS = ["M", "I", "S", "H", "A"];

  const grid = [];
  for (let r = 0; r < H; r++) {
    grid[r] = [];
    for (let c = 0; c < W; c++) {
      const ch = MAZE_ROWS[r][c];
      grid[r][c] = {
        wall: "#MISHAV".includes(ch),
        void: ch === "V",
        letter: "MISHA".includes(ch) ? ch : null,
        door: ch === "=",
        house: ch === "g",
      };
    }
  }
  const wrapC = (c) => ((c % W) + W) % W;
  const cellAt = (r, c) => (r < 0 || r >= H) ? null : grid[r][wrapC(c)];
  const walkPac = (r, c) => { const g = cellAt(r, c); return !!g && !g.wall && !g.door && !g.house; };
  const walkGhost = (r, c, throughDoor) => {
    const g = cellAt(r, c); if (!g || g.wall) return false;
    if ((g.door || g.house) && !throughDoor) return false;
    return true;
  };
  const cx = (c) => c * T + T / 2, cy = (r) => r * T + T / 2;

  // ---------- pellets ----------
  let pellets, powers, totalPellets, eatenCount, litLetters, stripeLeft;
  function resetPellets() {
    pellets = new Set(); powers = new Set();
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      if (MAZE_ROWS[r][c] === ".") pellets.add(r * W + c);
      if (MAZE_ROWS[r][c] === "o") powers.add(r * W + c);
    }
    totalPellets = pellets.size + powers.size; eatenCount = 0;
    litLetters = { M: false, I: false, S: false, H: false, A: false };
    stripeLeft = {};
    for (const L of LETTERS) {
      const [a, b] = LETTER_SPANS[L]; let n = 0;
      pellets.forEach((i) => { const c = i % W; if (c >= a && c <= b) n++; });
      powers.forEach((i) => { const c = i % W; if (c >= a && c <= b) n++; });
      stripeLeft[L] = n;
    }
  }

  // ---------- state ----------
  const HI_KEY = "mm_hi";
  const game = {
    state: "title", // title|ready|play|dying|levelclear|gameover
    level: 1, score: 0, lives: 3,
    hi: +(localStorage.getItem(HI_KEY) || 0),
    duo: false, paused: false,
    frightT: 0, chain: 0, freezeT: 0, stateT: 0,
    modeIdx: 0, modeT: 0, extraLifeGiven: false,
    fruit: null, fruitSeen: 0,
    players: [], ghosts: [], particles: [], popups: [],
  };
  window.__MM = {
    game, step: (ms) => { for (let i = 0; i < Math.round(ms / (1000 / 120)); i++) sim(1 / 120); render(); },
    start: (duo) => startGame(!!duo), god: false,
    forceFright: () => startFright(), setPellets: (n) => { // leave n pellets for quick level-clear tests
      const keep = [...pellets].slice(0, n); pellets = new Set(keep); powers.clear();
    },
  };

  const FRUITS = ["🦋", "💄", "📱", "👠", "🪩", "🍡", "💗"];
  const fruitPts = () => 300 + 200 * Math.min(game.level - 1, 5);

  // ---------- entities ----------
  function makePlayer(id) {
    const col = id === 0 ? 19 : 20;
    return {
      kind: "pac", id, x: cx(col), y: cy(22), dir: { x: id === 0 ? -1 : 1, y: 0 },
      nextDir: null, moving: true, speed: Math.min(11, 9.6 + (game.level - 1) * 0.15),
      anim: 0, dead: false, color: id === 0 ? "#ff4fa3" : "#33e6c8",
    };
  }
  const GHOST_DEFS = [
    { name: "DEADLINE", color: "#ff3355", scatter: [1, 38], release: -1 },
    { name: "INBOX",    color: "#29d9ff", scatter: [1, 1],  release: 1.2 },
    { name: "MEETINGS", color: "#ffb347", scatter: [24, 38], release: 4.5 },
    { name: "BUDGET",   color: "#c77dff", scatter: [24, 1], release: 8 },
  ];
  function makeGhost(i) {
    const d = GHOST_DEFS[i];
    const slots = [429, 429, 407, 473]; // x for deadline(unused), inbox, meetings, budget
    return {
      kind: "ghost", idx: i, name: d.name, color: d.color, scatter: d.scatter,
      x: i === 0 ? cx(19) : slots[i], y: i === 0 ? cy(17) : 20 * T,
      dir: i === 0 ? { x: -1, y: 0 } : { x: 0, y: -1 },
      mode: i === 0 ? "field" : "inhouse", // inhouse|leaving|field|eyes|entering
      moving: true,
      releaseAt: d.release, bob: Math.random() * Math.PI * 2,
      fright: false, lastTile: null,
    };
  }
  function elroy() { // Deadline heats up as the maze empties (Cruise Elroy)
    const left = pellets.size + powers.size;
    if (left < totalPellets * 0.15) return 2;
    if (left < totalPellets * 0.35) return 1;
    return 0;
  }
  function ghostSpeed(g) {
    const inTunnel = Math.floor(g.y / T) === MAZE_META.tunnelRow &&
      (g.x < 6 * T || g.x > (W - 6) * T);
    if (g.mode === "eyes" || g.mode === "entering") return 16;
    if (g.mode === "inhouse" || g.mode === "leaving") return 5;
    if (g.fright) return 6.0;
    if (inTunnel) return 5.6;
    let v = Math.min(10.6, 8.9 + (game.level - 1) * 0.25);
    if (g.idx === 0) { const e = elroy(); if (e === 2) v *= 1.16; else if (e === 1) v *= 1.08; }
    return v;
  }

  // ---------- movement core ----------
  function tryTurn(e, ndir, isGhost) {
    // instant reversal allowed for players
    if (!isGhost && e.dir && ndir.x === -e.dir.x && ndir.y === -e.dir.y && e.moving) {
      e.dir = ndir; return true;
    }
    return false;
  }
  function advance(e, dt, isGhost, throughDoor) {
    if (!e.moving) return;
    let dist = ghostOrPacSpeed(e) * T * dt;
    let guard = 8;
    while (dist > 1e-9 && guard-- > 0) {
      const tc = Math.floor(e.x / T), tr = Math.floor(e.y / T);
      const ccx = cx(tc), ccy = cy(tr);
      const toCenter = e.dir.x !== 0 ? (ccx - e.x) * e.dir.x : (ccy - e.y) * e.dir.y;
      let targetD;
      if (toCenter > 1e-6) targetD = toCenter;           // approach this tile's center
      else targetD = T + toCenter;                        // next tile's center
      const step = Math.min(dist, targetD);
      e.x += e.dir.x * step; e.y += e.dir.y * step; dist -= step;
      e.x = ((e.x % (W * T)) + W * T) % (W * T);          // tunnel wrap
      if (step >= targetD - 1e-9) {                       // we are AT a center
        e.x = cx(Math.floor(e.x / T)); e.y = cy(Math.floor(e.y / T));
        if (isGhost) ghostDecide(e, throughDoor); else pacDecide(e);
        if (!e.moving) break;
      }
    }
  }
  function ghostOrPacSpeed(e) { return e.kind === "ghost" ? ghostSpeed(e) : e.speed; }

  function pacDecide(p) {
    const r = Math.floor(p.y / T), c = Math.floor(p.x / T);
    if (p.nextDir && walkPac(r + p.nextDir.y, c + p.nextDir.x)) { p.dir = p.nextDir; p.nextDir = null; }
    if (!walkPac(r + p.dir.y, c + p.dir.x)) p.moving = false;
  }
  const DIRS = [{ x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }]; // up,left,down,right priority
  function ghostDecide(g, throughDoor) {
    const r = Math.floor(g.y / T), c = Math.floor(g.x / T);
    const opts = DIRS.filter((d) => {
      if (d.x === -g.dir.x && d.y === -g.dir.y) return false; // no reversing
      return walkGhost(r + d.y, c + d.x, throughDoor);
    });
    if (opts.length === 0) { g.dir = { x: -g.dir.x, y: -g.dir.y }; return; }
    if (g.fright && g.mode === "field") {
      g.dir = opts[(Math.random() * opts.length) | 0]; return;
    }
    const t = ghostTarget(g);
    let best = opts[0], bd = Infinity;
    for (const d of opts) {
      const nr = r + d.y, nc = c + d.x;
      const dd = (nr - t.r) * (nr - t.r) + (nc - t.c) * (nc - t.c);
      if (dd < bd) { bd = dd; best = d; }
    }
    g.dir = best;
  }
  function nearestPlayer(g) {
    const alive = game.players.filter((p) => !p.dead);
    if (!alive.length) return game.players[0];
    return alive.reduce((a, b) =>
      ((a.x - g.x) ** 2 + (a.y - g.y) ** 2 <= (b.x - g.x) ** 2 + (b.y - g.y) ** 2) ? a : b);
  }
  function ghostTarget(g) {
    if (g.mode === "eyes") return { r: MAZE_META.door.row - 1, c: 19 };
    const scatterNow = currentMode() === "scatter";
    if (scatterNow && !g.fright && !(g.idx === 0 && elroy() > 0)) return { r: g.scatter[0], c: g.scatter[1] };
    const p0 = game.players.find((p) => !p.dead) || game.players[0];
    const pr = Math.floor(p0.y / T), pc = Math.floor(p0.x / T);
    switch (g.idx) {
      case 0: { const p = nearestPlayer(g); return { r: Math.floor(p.y / T), c: Math.floor(p.x / T) }; }
      case 1: return { r: pr + p0.dir.y * 4, c: pc + p0.dir.x * 4 };
      case 2: {
        const dl = game.ghosts[0];
        const ar = pr + p0.dir.y * 2, ac = pc + p0.dir.x * 2;
        return { r: ar * 2 - Math.floor(dl.y / T), c: ac * 2 - Math.floor(dl.x / T) };
      }
      case 3: {
        const p = nearestPlayer(g);
        const dr = Math.floor(p.y / T) - Math.floor(g.y / T), dc = Math.floor(p.x / T) - Math.floor(g.x / T);
        if (dr * dr + dc * dc > 64) return { r: Math.floor(p.y / T), c: Math.floor(p.x / T) };
        return { r: g.scatter[0], c: g.scatter[1] };
      }
    }
  }

  // ---------- modes ----------
  function modeSchedule() {
    const s = Math.max(2.5, 5 - (game.level - 1) * 0.5);
    return [s, 20, s, 20, Math.max(2, s - 2), 20, Math.max(2, s - 2), Infinity];
  }
  function currentMode() { return game.modeIdx % 2 === 0 ? "scatter" : "chase"; }
  function tickModes(dt) {
    if (game.frightT > 0) {
      game.frightT -= dt;
      if (game.frightT <= 0) endFright();
      return; // classic: schedule pauses during fright
    }
    game.modeT += dt;
    const sched = modeSchedule();
    if (game.modeT >= sched[game.modeIdx]) {
      game.modeT = 0; game.modeIdx = Math.min(game.modeIdx + 1, sched.length - 1);
      reverseAllGhosts();
    }
  }
  function reverseAllGhosts() {
    for (const g of game.ghosts) if (g.mode === "field") {
      const r = Math.floor(g.y / T), c = Math.floor(g.x / T);
      if (walkGhost(r - g.dir.y, c - g.dir.x, false)) g.dir = { x: -g.dir.x, y: -g.dir.y };
    }
  }
  function startFright() {
    game.frightT = Math.max(2, 7 - (game.level - 1) * 0.7); game.chain = 0;
    for (const g of game.ghosts) if (g.mode === "field") g.fright = true;
    reverseAllGhosts(); sfx("fright");
  }
  function endFright() {
    game.frightT = 0;
    for (const g of game.ghosts) g.fright = false;
    sfx("stopFright");
  }

  // ---------- flow ----------
  function startGame(duo) {
    game.duo = duo; game.level = 1; game.score = 0; game.lives = 3;
    game.extraLifeGiven = false; game.fruitSeen = 0; game.fruit = null;
    resetPellets(); resetRound(); redrawStatic();
    setState("ready"); sfx("mish"); setTimeout(() => sfx("ready"), 300); updateHud();
  }
  function nextLevel() {
    game.level++; game.fruitSeen = 0; game.fruit = null;
    resetPellets(); resetRound(); redrawStatic();
    setState("ready"); sfx("ready");
  }
  function resetRound() {
    game.players = game.duo ? [makePlayer(0), makePlayer(1)] : [makePlayer(0)];
    game.ghosts = [0, 1, 2, 3].map(makeGhost);
    let t = 0;
    for (const g of game.ghosts) g.releaseAt = GHOST_DEFS[g.idx].release < 0 ? -1 :
      Math.max(0.5, GHOST_DEFS[g.idx].release - (game.level - 1) * 0.4);
    game.frightT = 0; game.chain = 0; game.modeIdx = 0; game.modeT = 0;
    game.freezeT = 0; game.roundClock = 0; game.fruit = null;
    endFright();
  }
  function setState(s) {
    game.state = s; game.stateT = 0;
    const ov = document.getElementById("overlay");
    ov.className = "show";
    if (s === "title") ov.innerHTML = titleHTML();
    else if (s === "ready") ov.innerHTML = `<div class="big ready-flash">READY!</div>`;
    else if (s === "levelclear") ov.innerHTML =
      `<div class="big" style="color:#7dffa8">M·I·S·H·A ✨</div><div class="sub">level ${game.level} cleared, gorgeous</div>`;
    else if (s === "gameover") {
      const best = game.score >= game.hi;
      ov.innerHTML = `<div class="big" style="color:#ff4fa3">GAME OVER</div>
        <div class="sub">${best ? "💅 NEW HIGH SCORE: " + game.score.toLocaleString() :
          "score " + game.score.toLocaleString() + " · best " + game.hi.toLocaleString()}</div>
        <div class="sub dim">${["the deadline got you. relatable.", "budget said no.", "that meeting could've been an email.",
          "inbox zero… inbox HERO next time."][(Math.random() * 4) | 0]}</div>
        <button class="btn" onclick="__MM.start(false)">PLAY AGAIN</button>
        <button class="btn alt" onclick="__MM.start(true)">DUO DATE MODE 💑</button>`;
    } else ov.className = "";
    if (s === "gameover" || s === "title") sfx("stopLoops");
  }
  function titleHTML() {
    const rc = GHOST_DEFS.map((g, i) => `
      <div class="ghostcard"><div class="gsprite" style="--gc:${g.color}">${ghostSVG(g.color)}</div>
      <div class="gname" style="color:${g.color}">${g.name}</div>
      <div class="gtag">${["always chasing you", "always one step ahead", "could've been an email · erratic", "gets close, then ghosts you"][i]}</div></div>`).join("");
    return `<div class="logo">MISHA-MAN</div>
      <div class="sub">the maze spells your name · eat every pellet to light it up</div>
      <div class="rollcall-title">MEET THE OFFICE GHOSTS</div>
      <div class="rollcall">${rc}</div>
      <button class="btn" onclick="__MM.start(false)">▶ PLAY</button>
      <button class="btn alt" onclick="__MM.start(true)">💑 DUO DATE MODE <span class="tiny">(P2: David on WASD)</span></button>
      <div class="sub dim">click anywhere or press ENTER to start<br>arrows / WASD / swipe · P pause · M mute</div>`;
  }
  function ghostSVG(color) {
    return `<svg viewBox="0 0 28 28" width="44" height="44"><path d="M2 26 V13 a12 12 0 0 1 24 0 V26 l-4-3-4 3-4-3-4 3-4-3z" fill="${color}"/>
      <circle cx="10" cy="12" r="4" fill="#fff"/><circle cx="19" cy="12" r="4" fill="#fff"/>
      <circle cx="11.5" cy="12" r="2" fill="#1b1464"/><circle cx="20.5" cy="12" r="2" fill="#1b1464"/></svg>`;
  }

  // ---------- sim ----------
  function shake(mag, dur) { game.shakeMag = mag; game.shakeT = dur; game.shakeDur = dur; }
  function sim(dt) {
    game.stateT += dt;
    if (game.flash > 0) game.flash -= dt;
    if (game.shakeT > 0) game.shakeT -= dt;
    if (game.state === "ready") { if (game.stateT > 2.1) { setState("play"); } return; }
    if (game.state === "dying") {
      if (game.stateT > 1.6) {
        game.lives--;
        if (game.lives < 0) { gameOver(); } else { resetRound(); setState("ready"); sfx("ready"); updateHud(); }
      }
      return;
    }
    if (game.state === "levelclear") { if (game.stateT > 2.6) nextLevel(); return; }
    if (game.state !== "play" || game.paused) return;
    if (game.freezeT > 0) { game.freezeT -= dt; return; }

    game.roundClock = (game.roundClock || 0) + dt;
    tickModes(dt);

    // players
    for (const p of game.players) {
      if (p.dead) continue;
      if (!p.moving && p.nextDir) {
        const r = Math.floor(p.y / T), c = Math.floor(p.x / T);
        if (walkPac(r + p.nextDir.y, c + p.nextDir.x)) { p.dir = p.nextDir; p.nextDir = null; p.moving = true; }
      }
      advance(p, dt, false, false);
      p.anim += dt * (p.moving ? 10 : 0);
      if (game.frightT > 0 && p.moving && Math.random() < 0.35) { // glam trail
        game.particles.push({
          x: p.x - p.dir.x * 10 + (Math.random() - 0.5) * 6,
          y: p.y - p.dir.y * 10 + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 20, vy: -20 - Math.random() * 30,
          ttl: 0.4, color: Math.random() < 0.5 ? "#ffd1ec" : "#fff", r: 1 + Math.random() * 1.5,
        });
      }
      eatAt(p);
    }
    // ghosts
    for (const g of game.ghosts) {
      if (g.mode === "inhouse") {
        g.bob += dt * 5; g.y = 20 * T + Math.sin(g.bob) * 4;
        if (g.releaseAt >= 0 && game.roundClock >= g.releaseAt) { g.mode = "leaving"; }
        continue;
      }
      if (g.mode === "leaving") {
        const dx = cx(19) - g.x;
        if (Math.abs(dx) > 1) { g.x += Math.sign(dx) * Math.min(Math.abs(dx), ghostSpeed(g) * T * dt); }
        else { g.x = cx(19); g.y -= ghostSpeed(g) * T * dt;
          if (g.y <= cy(17)) { g.y = cy(17); g.mode = "field"; g.dir = { x: Math.random() < 0.5 ? -1 : 1, y: 0 }; g.fright = game.frightT > 0 && false; } }
        continue;
      }
      if (g.mode === "entering") {
        g.y += ghostSpeed(g) * T * dt;
        if (g.y >= 20 * T) { g.y = 20 * T; g.mode = "inhouse"; g.releaseAt = game.roundClock + 0.7; g.fright = false; }
        continue;
      }
      // field / eyes
      const throughDoor = g.mode === "eyes";
      advance(g, dt, true, throughDoor);
      if (g.mode === "eyes") {
        const r = Math.floor(g.y / T), c = Math.floor(g.x / T);
        if (r === 17 && (c === 19 || c === 20)) { g.x = cx(19); g.mode = "entering"; }
      }
    }
    // collisions
    for (const p of game.players) {
      if (p.dead) continue;
      for (const g of game.ghosts) {
        if (g.mode !== "field") continue;
        const dd = (p.x - g.x) ** 2 + (p.y - g.y) ** 2;
        if (dd < (T * 0.62) ** 2) {
          if (g.fright) {
            const pts = 200 * Math.pow(2, Math.min(game.chain, 3));
            game.chain++; addScore(pts);
            popup(g.x, g.y, pts, "#9ff");
            g.mode = "eyes"; g.fright = false; game.freezeT = 0.35;
            shake(3, 0.15);
            burst(g.x, g.y, "#9ff", 14); sfx("eatGhost", game.chain);
          } else if (!window.__MM.god) { die(p); return; }
        }
      }
    }
    // fruit
    if (!game.fruit) {
      const marks = [Math.floor(totalPellets * 0.25), Math.floor(totalPellets * 0.6)];
      if (game.fruitSeen < marks.length && eatenCount >= marks[game.fruitSeen]) {
        game.fruit = { x: 20 * T, y: cy(15), ttl: 10, icon: FRUITS[(game.level - 1) % FRUITS.length] };
        game.fruitSeen++;
        burst(20 * T, cy(15), "#ffd84f", 10);
      }
    } else {
      game.fruit.ttl -= dt;
      if (game.fruit.ttl <= 0) game.fruit = null;
      else for (const p of game.players) {
        if (p.dead) continue;
        if ((p.x - game.fruit.x) ** 2 + (p.y - game.fruit.y) ** 2 < (T * 0.7) ** 2) {
          addScore(fruitPts()); popup(game.fruit.x, game.fruit.y, fruitPts(), "#ffd84f");
          burst(game.fruit.x, game.fruit.y, "#ffd84f", 12); sfx("fruit"); game.fruit = null; break;
        }
      }
    }
    // siren pitch rises as maze empties
    if (game.frightT > 0) sfx("fright"); else sfx("siren", eatenCount / totalPellets);
    // particles / popups
    game.particles = game.particles.filter((q) => (q.ttl -= dt) > 0);
    for (const q of game.particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 60 * dt; }
    game.popups = game.popups.filter((q) => (q.ttl -= dt) > 0);
  }

  function eatAt(p) {
    const r = Math.floor(p.y / T), c = Math.floor(p.x / T);
    const dxc = Math.abs(p.x - cx(c)), dyc = Math.abs(p.y - cy(r));
    if (dxc > T * 0.45 || dyc > T * 0.45) return;
    const key = r * W + c;
    if (pellets.has(key)) {
      pellets.delete(key); eatenCount++; addScore(10); sfx("waka"); stripeEat(c);
    } else if (powers.has(key)) {
      powers.delete(key); eatenCount++; addScore(50); stripeEat(c); startFright();
      game.freezeT = Math.max(game.freezeT, 0.16); game.flash = 0.3; // hit-stop!
      burst(p.x, p.y, "#ff4fa3", 20);
    } else return;
    if (pellets.size + powers.size === 0) {
      sfx("stopLoops"); sfx("levelClear"); setState("levelclear");
    }
  }
  function stripeEat(c) {
    for (let i = 0; i < LETTERS.length; i++) {
      const L = LETTERS[i], [a, b] = LETTER_SPANS[L];
      if (c >= a && c <= b && !litLetters[L]) {
        if (--stripeLeft[L] <= 0) {
          litLetters[L] = true; addScore(500); sfx("letterLit", i);
          const mx = ((a + b) / 2 + 0.5) * T;
          popup(mx, cy(9), "✨ " + L + " +500", LETTER_COLORS[L]);
          for (let k = 0; k < 24; k++) burst(mx + (Math.random() - 0.5) * (b - a) * T, cy(4 + Math.random() * 10), LETTER_COLORS[L], 1);
          redrawStatic(); updateMeter();
        }
      }
    }
  }
  function addScore(n) {
    game.score += n;
    if (!game.extraLifeGiven && game.score >= 10000) {
      game.extraLifeGiven = true; game.lives++; sfx("extraLife");
      popup(LW / 2, cy(15), "EXTRA LIFE 💖", "#ff4fa3");
    }
    if (game.score > game.hi) { game.hi = game.score; try { localStorage.setItem(HI_KEY, String(game.hi)); } catch (e) {} }
    updateHud();
  }
  function die(p) {
    sfx("stopLoops"); sfx("death");
    shake(7, 0.5); burst(p.x, p.y, "#ff4fa3", 26);
    setState("dying"); p.dying = true;
  }
  function gameOver() {
    setState("gameover"); updateHud();
  }
  function popup(x, y, text, color) { game.popups.push({ x, y, text: String(text), color, ttl: 1.4 }); }
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 90;
      game.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, ttl: 0.5 + Math.random() * 0.5, color, r: 1.5 + Math.random() * 2 });
    }
  }

  // ---------- render ----------
  const staticCvs = document.createElement("canvas");
  staticCvs.width = LW * DPR; staticCvs.height = LH * DPR;
  const sctx = staticCvs.getContext("2d");
  sctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  function redrawStatic() { drawWalls(sctx, null); }
  function drawWalls(g, colorFn) {
    g.clearRect(0, 0, LW, LH);
    g.fillStyle = "#0b0620"; g.fillRect(0, 0, LW, LH);
    g.lineWidth = 2.6; g.lineCap = "round";
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const cell = grid[r][c];
      if (!cell.wall) continue;
      if (cell.void) { g.fillStyle = LETTER_COLORS.void; g.fillRect(c * T, r * T, T, T); }
      let col = cell.letter ? LETTER_COLORS[cell.letter] : LETTER_COLORS.wall;
      if (colorFn) col = colorFn(cell, r, c) || col;
      const lit = cell.letter && litLetters && litLetters[cell.letter];
      g.strokeStyle = col;
      g.shadowColor = col; g.shadowBlur = lit ? 14 : (cell.letter ? 7 : 4);
      if (lit) g.lineWidth = 3.4; else g.lineWidth = 2.6;
      const x = c * T, y = r * T;
      // stroke edges facing corridors — and, for letter strokes, edges facing
      // void counters too, so enclosed holes (like the A's) read as letterform
      const open = (rr, cc) => {
        const q = cellAt(rr, cc);
        if (!q) return true;
        if (!q.wall) return true;
        return !cell.void && q.void;
      };
      g.beginPath();
      if (open(r - 1, c)) { g.moveTo(x + 1, y + 1); g.lineTo(x + T - 1, y + 1); }
      if (open(r + 1, c)) { g.moveTo(x + 1, y + T - 1); g.lineTo(x + T - 1, y + T - 1); }
      if (open(r, c - 1) && c > 0) { g.moveTo(x + 1, y + 1); g.lineTo(x + 1, y + T - 1); }
      if (open(r, c + 1) && c < W - 1) { g.moveTo(x + T - 1, y + 1); g.lineTo(x + T - 1, y + T - 1); }
      g.stroke();
    }
    g.shadowBlur = 0;
    // ghost-house door
    g.strokeStyle = "#ffb3de"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(19 * T + 2, 18 * T + T / 2); g.lineTo(21 * T - 2, 18 * T + T / 2); g.stroke();
  }

  let flashHue = 0;
  function render() {
    ctx.save();
    if (game.shakeT > 0) {
      const m = game.shakeMag * (game.shakeT / (game.shakeDur || 1));
      ctx.translate((Math.random() * 2 - 1) * m, (Math.random() * 2 - 1) * m);
    }
    if (game.state === "levelclear") {
      flashHue += 12;
      drawWalls(ctx, (cell) => cell.letter ? `hsl(${(flashHue + "MISHA".indexOf(cell.letter) * 40) % 360} 100% 70%)` : null);
    } else {
      ctx.drawImage(staticCvs, 0, 0, LW, LH);
    }
    // pellets
    ctx.fillStyle = "#ffd9ec";
    pellets.forEach((i) => {
      const r = (i / W) | 0, c = i % W;
      ctx.beginPath(); ctx.arc(cx(c), cy(r), 2.4, 0, 7); ctx.fill();
    });
    // power pellets = lip-gloss kisses
    const pulse = 1 + Math.sin(performance.now() / 180) * 0.18;
    powers.forEach((i) => {
      const r = (i / W) | 0, c = i % W;
      ctx.font = `${Math.round(13 * pulse) + 4}px serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("💋", cx(c), cy(r) + 1);
    });
    // fruit
    if (game.fruit) {
      ctx.font = "20px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.globalAlpha = game.fruit.ttl < 2 ? (Math.sin(performance.now() / 90) > 0 ? 1 : 0.35) : 1;
      ctx.fillText(game.fruit.icon, game.fruit.x, game.fruit.y + Math.sin(performance.now() / 280) * 3);
      ctx.globalAlpha = 1;
    }
    // players
    for (const p of game.players) if (!p.dead) drawPac(p);
    // ghosts
    if (game.state !== "dying" || game.stateT < 0.1)
      for (const g of game.ghosts) drawGhost(g);
    // particles & popups
    for (const q of game.particles) {
      ctx.globalAlpha = Math.min(1, q.ttl * 2); ctx.fillStyle = q.color;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "center"; ctx.font = "bold 13px Menlo, monospace";
    for (const q of game.popups) {
      ctx.globalAlpha = Math.min(1, q.ttl * 1.5); ctx.fillStyle = q.color;
      ctx.fillText(q.text, q.x, q.y - (1.4 - q.ttl) * 26);
    }
    ctx.globalAlpha = 1;
    if (game.flash > 0) { // power-pellet white pop
      ctx.globalAlpha = Math.min(0.5, game.flash * 1.6);
      ctx.fillStyle = "#fff"; ctx.fillRect(-10, -10, LW + 20, LH + 20);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  function drawPac(p) {
    const dying = game.state === "dying" && p.dying;
    const t = dying ? Math.min(1, game.stateT / 1.3) : 0;
    const mouth = dying ? 0.1 + t * Math.PI * 0.95 : (0.25 + 0.3 * Math.abs(Math.sin(p.anim)));
    const ang = Math.atan2(p.dir.y, p.dir.x);
    const R = T * 0.72 * (dying ? 1 - t * 0.8 : 1);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(dying ? ang + t * 6 : ang);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, mouth, Math.PI * 2 - mouth); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    if (!dying) { // accessory: P1 gold bow, P2 tiny cap — drawn upright above head
      ctx.save(); ctx.translate(p.x, p.y - R * 0.95);
      if (p.id === 0) {
        ctx.fillStyle = "#ffd84f";
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-7, -4); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, -4); ctx.lineTo(7, 4); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = "#1b2a5e"; ctx.fillRect(-6, -3, 12, 4);
        ctx.fillRect(-2, -6, 8, 4);
      }
      ctx.restore();
    }
  }
  function drawGhost(g) {
    const r = T * 0.74;
    const flash = g.fright && game.frightT < 2 && Math.floor(performance.now() / 220) % 2 === 0;
    const body = g.mode === "eyes" || g.mode === "entering" ? null : (g.fright ? (flash ? "#f4f4ff" : "#2233dd") : g.color);
    ctx.save(); ctx.translate(g.x, g.y);
    if (body) {
      ctx.fillStyle = body; ctx.shadowColor = body; ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-r, r);
      ctx.lineTo(-r, -r * 0.1);
      ctx.arc(0, -r * 0.1, r, Math.PI, 0);
      ctx.lineTo(r, r);
      for (let i = 0; i < 3; i++) ctx.lineTo(r - (i * 2 + 1) * (r / 3), r - ((i % 2) === 0 ? r * 0.35 : 0));
      ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    }
    // eyes
    const ex = g.dir.x * 2.4, ey = g.dir.y * 2.4;
    if (g.fright && body) {
      ctx.fillStyle = flash ? "#dd3355" : "#ffc7e8";
      ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.15, 2.4, 0, 7); ctx.arc(r * 0.35, -r * 0.15, 2.4, 0, 7); ctx.fill();
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let i = -3; i <= 3; i++) ctx.lineTo(i * r * 0.22, r * 0.35 + ((i % 2) ? 2 : -2));
      ctx.stroke();
    } else {
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(-r * 0.35 + ex * 0.5, -r * 0.2 + ey * 0.5, r * 0.3, 0, 7);
      ctx.arc(r * 0.35 + ex * 0.5, -r * 0.2 + ey * 0.5, r * 0.3, 0, 7); ctx.fill();
      ctx.fillStyle = "#1b1464";
      ctx.beginPath(); ctx.arc(-r * 0.35 + ex, -r * 0.2 + ey, r * 0.15, 0, 7);
      ctx.arc(r * 0.35 + ex, -r * 0.2 + ey, r * 0.15, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- HUD ----------
  function updateHud() {
    document.getElementById("score").textContent = game.score.toLocaleString();
    document.getElementById("hiscore").textContent = game.hi.toLocaleString();
    document.getElementById("level").textContent = game.level;
    const lv = document.getElementById("lives");
    lv.innerHTML = "";
    for (let i = 0; i < Math.max(0, game.lives); i++) {
      const s = document.createElement("span"); s.className = "life"; lv.appendChild(s);
    }
    updateMeter();
  }
  function updateMeter() {
    for (const L of LETTERS) {
      const el = document.getElementById("meter-" + L);
      if (!el) continue;
      el.classList.toggle("lit", !!(litLetters && litLetters[L]));
      el.style.setProperty("--lc", LETTER_COLORS[L]);
    }
  }

  // ---------- input ----------
  const KEYMAP = {
    ArrowUp: [0, { x: 0, y: -1 }], ArrowDown: [0, { x: 0, y: 1 }],
    ArrowLeft: [0, { x: -1, y: 0 }], ArrowRight: [0, { x: 1, y: 0 }],
    w: [1, { x: 0, y: -1 }], s: [1, { x: 0, y: 1 }], a: [1, { x: -1, y: 0 }], d: [1, { x: 1, y: 0 }],
  };
  window.addEventListener("keydown", (e) => {
    sfx("unlock");
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    if (k === "m") { const m = sfx("toggleMute"); const b = document.getElementById("mute"); if (b) b.textContent = m ? "🔇" : "🔊"; return; }
    if (game.state === "title" || game.state === "gameover") {
      if (e.key === "Enter" || e.key === " ") startGame(false);
      if (k === "d") startGame(true);
      return;
    }
    if (game.paused) { resumeGame(); return; } // any key resumes
    if (k === "p" || e.key === "Escape") { pauseGame(); return; }
    const m = KEYMAP[k];
    if (m) {
      const [pi, dir] = m;
      const p = game.players[game.duo ? pi : 0];
      if (p && !p.dead) {
        if (!tryTurn(p, dir, false)) p.nextDir = dir;
        if (!p.moving) {
          const r = Math.floor(p.y / T), c = Math.floor(p.x / T);
          if (walkPac(r + dir.y, c + dir.x)) { p.dir = dir; p.nextDir = null; p.moving = true; }
        }
      }
    }
  }, { passive: false });

  // swipe
  let touchStart = null;
  cvs.addEventListener("touchstart", (e) => { sfx("unlock"); touchStart = [e.touches[0].clientX, e.touches[0].clientY]; e.preventDefault(); }, { passive: false });
  cvs.addEventListener("touchmove", (e) => {
    if (!touchStart) return;
    const dx = e.touches[0].clientX - touchStart[0], dy = e.touches[0].clientY - touchStart[1];
    if (dx * dx + dy * dy > 24 * 24) {
      const dir = Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
      const p = game.players[0];
      if (p && !p.dead) { if (!tryTurn(p, dir, false)) p.nextDir = dir; if (!p.moving) { const r = Math.floor(p.y / T), c = Math.floor(p.x / T); if (walkPac(r + dir.y, c + dir.x)) { p.dir = dir; p.nextDir = null; p.moving = true; } } }
      touchStart = [e.touches[0].clientX, e.touches[0].clientY];
    }
    e.preventDefault();
  }, { passive: false });
  cvs.addEventListener("touchend", (e) => {
    if (game.state === "title" || game.state === "gameover") startGame(false);
    touchStart = null;
  });
  document.addEventListener("pointerdown", () => sfx("unlock"), { once: true });
  document.getElementById("mute").addEventListener("click", () => {
    sfx("unlock"); const m = sfx("toggleMute");
    document.getElementById("mute").textContent = m ? "🔇" : "🔊";
  });
  function pauseGame() {
    if (game.state !== "play" || game.paused) return;
    game.paused = true; document.getElementById("paused").style.display = "grid"; sfx("stopLoops");
  }
  function resumeGame() {
    game.paused = false; document.getElementById("paused").style.display = "none";
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden) pauseGame(); });
  document.getElementById("paused").addEventListener("click", () => { sfx("unlock"); resumeGame(); });
  document.getElementById("overlay").addEventListener("click", (e) => {
    if (e.target.closest(".btn")) return; // buttons keep their own actions
    if (game.state === "title" || game.state === "gameover") { sfx("unlock"); startGame(false); }
  });

  // ---------- main loop ----------
  let last = performance.now(), acc = 0;
  const STEP = 1 / 120;
  function frame(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    while (acc >= STEP) { sim(STEP); acc -= STEP; }
    render();
    requestAnimationFrame(frame);
  }

  // boot
  resetPellets(); redrawStatic(); updateHud(); setState("title");
  const mb = document.getElementById("mute");
  if (mb && window.MM_AUDIO && MM_AUDIO.isMuted()) mb.textContent = "🔇";
  requestAnimationFrame(frame);
})();
