// TETRISHA — modern Tetris with a love story:
// every line clear lights a letter of M·I·S·H·A; light all five and
// DAVID sends a heart piece 💗 that detonates and tidies your stack.
(function () {
  "use strict";
  const sfx = (name, ...a) => {
    const A = window.TT_AUDIO;
    if (A && typeof A[name] === "function") { try { return A[name](...a); } catch (e) {} }
  };

  // ---------- constants ----------
  const COLS = 10, ROWS = 22, HIDDEN = 2, CELL = 26;
  const cvs = document.getElementById("board");
  cvs.width = COLS * CELL; cvs.height = (ROWS - HIDDEN) * CELL;
  const ctx = cvs.getContext("2d");
  const holdCvs = document.getElementById("hold"), holdCtx = holdCvs.getContext("2d");
  const nextCvs = document.getElementById("next"), nextCtx = nextCvs.getContext("2d");
  const LETTERS = ["M", "I", "S", "H", "A"];
  const LETTER_COLORS = { M: "#ff4fd8", I: "#b18cff", S: "#4fd8ff", H: "#ffd84f", A: "#7dffa8" };

  const SHAPES = {
    I: { c: "#4fd8ff", size: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
    J: { c: "#5e8aff", size: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
    L: { c: "#ffb347", size: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
    O: { c: "#ffd84f", size: 4, cells: [[1, 0], [2, 0], [1, 1], [2, 1]] },
    S: { c: "#7dffa8", size: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
    T: { c: "#c77dff", size: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
    Z: { c: "#ff5e7a", size: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
    "♥": { c: "#ff4fa3", size: 3, cells: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [1, 2]] },
  };
  // SRS kick tables, published (x, y-up) convention — y is negated when applied.
  const KICKS_JLSTZ = {
    "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  };
  const KICKS_I = {
    "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  };
  function rotatedCells(type, rot) {
    const { size, cells } = SHAPES[type];
    let cs = cells.map(([x, y]) => [x, y]);
    for (let i = 0; i < ((rot % 4) + 4) % 4; i++) cs = cs.map(([x, y]) => [size - 1 - y, x]);
    return cs;
  }

  // ---------- state ----------
  const HI_KEY = "tt_hi";
  const game = {
    state: "title", // title|play|clearing|heartburst|gameover
    board: [], piece: null, hold: null, holdUsed: false,
    queue: [], bag: [],
    score: 0, lines: 0, level: 1, hi: +(localStorage.getItem(HI_KEY) || 0),
    meter: 0, heartQueued: false, b2b: false, combo: -1,
    gravT: 0, lockT: 0, lockResets: 0, grounded: false,
    clearingRows: [], clearT: 0, stateT: 0, paused: false,
    particles: [], flair: null, burstAt: null,
  };
  window.__TT = {
    game,
    step: (ms) => { for (let i = 0; i < Math.round(ms / (1000 / 120)); i++) sim(1 / 120); render(); },
    start: () => start(),
    spawn: (t) => spawn(t),
    fillRow: (r, gap) => { for (let c = 0; c < COLS; c++) game.board[r][c] = c === gap ? null : "Z"; },
    forceMeter: (n) => { game.meter = n; updateMeter(); },
    hardDrop: () => hardDrop(),
    move: (dx) => tryMove(dx, 0),
    rotate: (d) => rotate(d),
  };

  function emptyBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
  function refillBag() {
    const b = ["I", "J", "L", "O", "S", "T", "Z"];
    for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; }
    game.bag.push(...b);
  }
  function nextType() {
    while (game.queue.length < 6) { if (!game.bag.length) refillBag(); game.queue.push(game.bag.shift()); }
    return game.queue.shift();
  }

  function start() {
    game.board = emptyBoard(); game.queue = []; game.bag = [];
    game.score = 0; game.lines = 0; game.level = 1; game.meter = 0;
    game.heartQueued = false; game.b2b = false; game.combo = -1;
    game.hold = null; game.holdUsed = false; game.particles = []; game.flair = null;
    game.state = "play"; game.paused = false;
    spawn(); updateHud(); updateMeter(); overlay(null);
    sfx("musicStart", game.level); sfx("uiSelect");
  }

  function spawn(forceType) {
    let type = forceType;
    if (!type) {
      if (game.heartQueued) { type = "♥"; game.heartQueued = false; game.meter = 0; updateMeter(); }
      else type = nextType();
    }
    game.piece = { type, rot: 0, x: 3, y: type === "I" ? 0 : 0, isHeart: type === "♥" };
    game.gravT = 0; game.lockT = 0; game.lockResets = 0; game.grounded = false;
    game.holdUsed = false;
    if (collides(game.piece, 0, 0, game.piece.rot)) {
      // one mercy shift up
      game.piece.y--;
      if (collides(game.piece, 0, 0, game.piece.rot)) { gameOver(); return; }
    }
    renderNext(); renderHold();
  }

  function cellsOf(p, dx = 0, dy = 0, rot = p.rot) {
    return rotatedCells(p.type, rot).map(([x, y]) => [p.x + x + dx, p.y + y + dy]);
  }
  function collides(p, dx, dy, rot) {
    for (const [x, y] of cellsOf(p, dx, dy, rot)) {
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && game.board[y][x]) return true;
    }
    return false;
  }
  function tryMove(dx, dy) {
    if (!game.piece || game.state !== "play") return false;
    if (!collides(game.piece, dx, dy, game.piece.rot)) {
      game.piece.x += dx; game.piece.y += dy;
      if (dx !== 0) { sfx("move"); lockReset(); }
      return true;
    }
    return false;
  }
  function rotate(dir) { // dir = 1 CW, -1 CCW
    const p = game.piece;
    if (!p || game.state !== "play") return;
    if (p.type === "O") { sfx("rotate"); return; }
    if (p.isHeart) { sfx("rotate"); wiggle(); return; } // hearts don't rotate, they wobble
    const from = p.rot, to = (p.rot + (dir === 1 ? 1 : 3)) % 4;
    const table = p.type === "I" ? KICKS_I : KICKS_JLSTZ;
    const kicks = table[from + ">" + to] || [[0, 0]];
    for (const [kx, kyUp] of kicks) {
      const ky = -kyUp;
      if (!collides(p, kx, ky, to)) {
        p.x += kx; p.y += ky; p.rot = to;
        sfx("rotate"); lockReset();
        return;
      }
    }
  }
  let wiggleT = 0;
  function wiggle() { wiggleT = 0.25; }
  function lockReset() {
    if (game.grounded && game.lockResets < 15) { game.lockT = 0; game.lockResets++; }
  }
  function holdSwap() {
    const p = game.piece;
    if (!p || game.holdUsed || game.state !== "play") return;
    if (p.isHeart) { wiggle(); return; } // you can't put a heart on hold 💗
    sfx("hold");
    const prev = game.hold; game.hold = p.type;
    if (prev) spawn(prev); else spawn();
    game.holdUsed = true;
    renderHold();
  }
  function gravitySeconds() {
    const l = game.level;
    return Math.max(0.03, Math.pow(0.8 - (l - 1) * 0.007, l - 1));
  }
  function hardDrop() {
    const p = game.piece;
    if (!p || game.state !== "play") return;
    let d = 0;
    while (!collides(p, 0, d + 1, p.rot)) d++;
    p.y += d; game.score += d * 2;
    sfx("hardDrop"); lockPiece();
  }

  function lockPiece() {
    const p = game.piece;
    for (const [x, y] of cellsOf(p)) if (y >= 0) game.board[y][x] = p.isHeart ? "♥" : p.type;
    if (p.isHeart) { detonateHeart(p); return; }
    sfx("lock");
    game.piece = null;
    resolveClears(false);
  }

  function detonateHeart(p) {
    const cs = cellsOf(p);
    const cx = p.x + 1, cy = p.y + 1;
    let cleared = 0;
    for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) {
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS && game.board[y][x]) { game.board[y][x] = null; cleared++; }
    }
    // column-local collapse inside the blast so David actually tidies up
    for (let x = Math.max(0, cx - 2); x <= Math.min(COLS - 1, cx + 2); x++) {
      const col = [];
      for (let y = ROWS - 1; y >= 0; y--) if (game.board[y][x]) col.push(game.board[y][x]);
      for (let y = ROWS - 1; y >= 0; y--) game.board[y][x] = col[ROWS - 1 - y] ?? null;
    }
    game.score += cleared * 100 + 1000;
    game.burstAt = { x: cx, y: cy, t: 0 };
    game.state = "heartburst"; game.stateT = 0;
    flair("DAVID 💗 MISHA", "#ff4fa3");
    for (let i = 0; i < 60; i++) particle((cx + 0.5) * CELL, (cy + 0.5 - HIDDEN) * CELL, ["#ff4fa3", "#ff8fc6", "#ffd1ec", "#fff"][i % 4]);
    sfx("heartBurst");
    game.piece = null;
    updateHud();
  }

  function resolveClears(afterHeart) {
    const full = [];
    for (let y = 0; y < ROWS; y++) if (game.board[y].every((v) => v)) full.push(y);
    if (full.length) {
      game.clearingRows = full; game.clearT = 0; game.state = "clearing";
      const n = full.length;
      const base = [0, 100, 300, 500, 800][n] * game.level;
      const b2bBonus = n === 4 && game.b2b ? base * 0.5 : 0;
      game.b2b = n === 4 ? true : (n > 0 ? false : game.b2b);
      game.combo++;
      game.score += base + b2bBonus + (game.combo > 0 ? 50 * game.combo * game.level : 0);
      // MISHA meter — each cleared line lights the next letter
      const before = game.meter;
      game.meter = Math.min(5, game.meter + n);
      for (let i = before; i < game.meter; i++) setTimeout(() => sfx("meterLetter", i), (i - before) * 140);
      if (game.meter >= 5 && !game.heartQueued) {
        game.heartQueued = true;
        setTimeout(() => { flair("💌 INCOMING FROM DAVID", "#ff8fc6"); sfx("heartIncoming"); }, 500);
      }
      if (n === 4) { flair("M I S H A !!!", "#ff4fd8"); sfx("lineClear", 4); }
      else { flair(["nice ✨", "cute!! 💅", "slayyy 🔥"][n - 1], ["#b18cff", "#4fd8ff", "#ffd84f"][n - 1]); sfx("lineClear", n); }
      for (const y of full) for (let c = 0; c < COLS; c++)
        particle((c + 0.5) * CELL, (y + 0.5 - HIDDEN) * CELL, n === 4 ? "#ff4fd8" : "#fff", 0.5);
      updateMeter();
    } else {
      game.combo = -1;
      if (!afterHeart) spawn();
    }
    updateHud();
  }
  function finishClearing() {
    const rows = game.clearingRows;
    for (const y of rows) { game.board.splice(y, 1); game.board.unshift(Array(COLS).fill(null)); }
    game.lines += rows.length;
    const newLevel = 1 + Math.floor(game.lines / 10);
    if (newLevel > game.level) { game.level = newLevel; sfx("levelUp"); sfx("musicStart", game.level); flair("LEVEL " + game.level + " 💫", "#7dffa8"); }
    game.clearingRows = [];
    game.state = "play";
    spawn(); updateHud();
  }

  function gameOver() {
    game.state = "gameover"; game.piece = null;
    sfx("musicStop"); sfx("gameOver");
    if (game.score > game.hi) { game.hi = game.score; localStorage.setItem(HI_KEY, String(game.hi)); }
    overlay(`<div class="big" style="color:#ff5e7a">TOP OUT 💔</div>
      <div class="sub">score ${game.score.toLocaleString()} · lines ${game.lines} · best ${game.hi.toLocaleString()}</div>
      <div class="sub dim">David says: you'll get 'em next time.</div>
      <button class="btn" onclick="__TT.start()">ONE MORE GAME</button>`);
    updateHud();
  }

  function particle(x, y, color, ttl) {
    const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 140;
    game.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, ttl: ttl || (0.6 + Math.random() * 0.6), color, r: 1.5 + Math.random() * 2.5 });
  }
  function flair(text, color) { game.flair = { text, color, ttl: 1.6 }; }

  // ---------- sim ----------
  function sim(dt) {
    game.stateT += dt;
    if (wiggleT > 0) wiggleT -= dt;
    game.particles = game.particles.filter((q) => (q.ttl -= dt) > 0);
    for (const q of game.particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 220 * dt; }
    if (game.flair && (game.flair.ttl -= dt) <= 0) game.flair = null;

    if (game.state === "clearing") {
      game.clearT += dt;
      if (game.clearT > 0.38) finishClearing();
      return;
    }
    if (game.state === "heartburst") {
      if (game.burstAt) game.burstAt.t += dt;
      if (game.stateT > 0.9) { game.burstAt = null; game.state = "play"; resolveClears(true); if (!game.piece && game.state === "play") spawn(); }
      return;
    }
    if (game.state !== "play" || game.paused || !game.piece) return;

    // DAS/ARR horizontal
    tickInput(dt);

    // gravity
    const soft = keys.soft;
    const g = soft ? Math.min(0.04, gravitySeconds() / 20) : gravitySeconds();
    game.gravT += dt;
    while (game.gravT >= g) {
      game.gravT -= g;
      if (!collides(game.piece, 0, 1, game.piece.rot)) {
        game.piece.y++;
        if (soft) { game.score += 1; sfx("softDrop"); }
      }
    }
    // grounded / lock delay
    if (collides(game.piece, 0, 1, game.piece.rot)) {
      if (!game.grounded) { game.grounded = true; game.lockT = 0; }
      game.lockT += dt;
      if (game.lockT >= 0.5) lockPiece();
    } else {
      game.grounded = false; game.lockT = 0;
    }
  }

  // ---------- input ----------
  const keys = { left: false, right: false, soft: false, dasT: 0, arrT: 0, dir: 0 };
  function tickInput(dt) {
    const dir = keys.left && !keys.right ? -1 : keys.right && !keys.left ? 1 : 0;
    if (dir !== keys.dir) { keys.dir = dir; keys.dasT = 0; keys.arrT = 0; if (dir) tryMove(dir, 0); }
    else if (dir) {
      keys.dasT += dt;
      if (keys.dasT >= 0.16) {
        keys.arrT += dt;
        while (keys.arrT >= 0.04) { keys.arrT -= 0.04; if (!tryMove(dir, 0)) break; }
      }
    }
  }
  window.addEventListener("keydown", (e) => {
    sfx("unlock");
    if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "m") { const m = sfx("toggleMute"); const b = document.getElementById("mute"); if (b) b.textContent = m ? "🔇" : "🔊"; return; }
    if (game.state === "title" || game.state === "gameover") { if (e.key === "Enter" || e.key === " ") start(); return; }
    if (k === "p" || e.key === "Escape") {
      game.paused = !game.paused;
      document.getElementById("paused").style.display = game.paused ? "grid" : "none";
      if (game.paused) sfx("musicStop"); else sfx("musicStart", game.level);
      return;
    }
    if (game.paused) return;
    if (e.repeat) return;
    switch (k) {
      case "ArrowLeft": keys.left = true; break;
      case "ArrowRight": keys.right = true; break;
      case "ArrowDown": keys.soft = true; break;
      case "ArrowUp": case "x": rotate(1); break;
      case "z": rotate(-1); break;
      case " ": hardDrop(); break;
      case "c": case "Shift": holdSwap(); break;
    }
  }, { passive: false });
  window.addEventListener("keyup", (e) => {
    switch (e.key) {
      case "ArrowLeft": keys.left = false; break;
      case "ArrowRight": keys.right = false; break;
      case "ArrowDown": keys.soft = false; break;
    }
  });
  // touch buttons
  function bindBtn(id, down, up) {
    const el = document.getElementById(id);
    if (!el) return;
    const d = (e) => { e.preventDefault(); sfx("unlock"); down(); };
    const u = (e) => { e.preventDefault(); if (up) up(); };
    el.addEventListener("touchstart", d, { passive: false });
    el.addEventListener("touchend", u, { passive: false });
    el.addEventListener("mousedown", d);
    el.addEventListener("mouseup", u);
    el.addEventListener("mouseleave", () => up && up());
  }
  bindBtn("t-left", () => { keys.left = true; }, () => { keys.left = false; });
  bindBtn("t-right", () => { keys.right = true; }, () => { keys.right = false; });
  bindBtn("t-soft", () => { keys.soft = true; }, () => { keys.soft = false; });
  bindBtn("t-rot", () => rotate(1));
  bindBtn("t-hard", () => hardDrop());
  bindBtn("t-hold", () => holdSwap());
  document.getElementById("mute").addEventListener("click", () => {
    sfx("unlock"); const m = sfx("toggleMute");
    document.getElementById("mute").textContent = m ? "🔇" : "🔊";
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && game.state === "play" && !game.paused) {
      game.paused = true; document.getElementById("paused").style.display = "grid"; sfx("musicStop");
    }
  });

  // ---------- render ----------
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function drawCell(g, x, y, color, size, ghost, heart) {
    const s = size || CELL, pad = 1.5;
    if (ghost) {
      g.strokeStyle = color; g.globalAlpha = 0.35; g.lineWidth = 1.6;
      roundRect(g, x + pad, y + pad, s - pad * 2, s - pad * 2, 4); g.stroke(); g.globalAlpha = 1;
      return;
    }
    const grad = g.createLinearGradient(x, y, x, y + s);
    grad.addColorStop(0, shade(color, 30)); grad.addColorStop(0.5, color); grad.addColorStop(1, shade(color, -28));
    g.fillStyle = grad;
    roundRect(g, x + pad, y + pad, s - pad * 2, s - pad * 2, heart ? 7 : 4); g.fill();
    g.fillStyle = "rgba(255,255,255,.28)";
    roundRect(g, x + pad + 2, y + pad + 2, s - pad * 2 - 4, (s - pad * 2) * 0.32, 3); g.fill();
    if (heart) {
      g.fillStyle = "rgba(255,255,255,.9)"; g.font = `${Math.round(s * 0.5)}px serif`;
      g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("💗", x + s / 2, y + s / 2 + 1);
    }
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amt)),
      g2 = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt)),
      b = Math.max(0, Math.min(255, (n & 255) + amt));
    return `rgb(${r},${g2},${b})`;
  }
  function render() {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    // faint grid
    ctx.strokeStyle = "rgba(140,110,255,.07)"; ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, cvs.height); ctx.stroke(); }
    for (let y = 1; y < ROWS - HIDDEN; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(cvs.width, y * CELL); ctx.stroke(); }
    // locked cells
    for (let y = HIDDEN; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const v = game.board[y][x];
      if (!v) continue;
      const flash = game.state === "clearing" && game.clearingRows.includes(y);
      drawCell(ctx, x * CELL, (y - HIDDEN) * CELL, flash ? "#ffffff" : SHAPES[v].c, CELL, false, v === "♥");
      if (flash) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(game.clearT * 40); ctx.fillStyle = "#fff"; ctx.fillRect(x * CELL, (y - HIDDEN) * CELL, CELL, CELL); ctx.globalAlpha = 1; }
    }
    // ghost + active piece
    if (game.piece && game.state === "play") {
      const p = game.piece;
      let d = 0; while (!collides(p, 0, d + 1, p.rot)) d++;
      for (const [x, y] of cellsOf(p, 0, d)) if (y >= HIDDEN) drawCell(ctx, x * CELL, (y - HIDDEN) * CELL, SHAPES[p.type].c, CELL, true);
      const wob = p.isHeart && wiggleT > 0 ? Math.sin(wiggleT * 60) * 2 : 0;
      ctx.save(); ctx.translate(wob, 0);
      if (p.isHeart) { ctx.shadowColor = "#ff4fa3"; ctx.shadowBlur = 16; }
      for (const [x, y] of cellsOf(p)) if (y >= HIDDEN) drawCell(ctx, x * CELL, (y - HIDDEN) * CELL, SHAPES[p.type].c, CELL, false, p.isHeart);
      ctx.restore(); ctx.shadowBlur = 0;
    }
    // heart burst ring
    if (game.burstAt) {
      const t = game.burstAt.t;
      ctx.strokeStyle = "#ff4fa3"; ctx.lineWidth = 4 * (1 - t); ctx.globalAlpha = Math.max(0, 1 - t);
      ctx.beginPath(); ctx.arc((game.burstAt.x + 0.5) * CELL, (game.burstAt.y + 0.5 - HIDDEN) * CELL, t * CELL * 6, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // particles
    for (const q of game.particles) {
      ctx.globalAlpha = Math.min(1, q.ttl * 2); ctx.fillStyle = q.color;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // flair text
    if (game.flair) {
      ctx.textAlign = "center";
      let size = 26;
      ctx.font = `900 ${size}px Menlo, monospace`;
      const w = ctx.measureText(game.flair.text).width;
      if (w > cvs.width * 0.92) { size = Math.max(11, Math.floor(size * cvs.width * 0.92 / w)); ctx.font = `900 ${size}px Menlo, monospace`; }
      ctx.globalAlpha = Math.min(1, game.flair.ttl);
      ctx.fillStyle = game.flair.color; ctx.shadowColor = game.flair.color; ctx.shadowBlur = 18;
      ctx.fillText(game.flair.text, cvs.width / 2, cvs.height * 0.32 - (1.6 - game.flair.ttl) * 20);
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
  }
  function renderMini(g, c, type) {
    if (!type) { g.clearRect(0, 0, c.width, c.height); return; }
    g.clearRect(0, 0, c.width, c.height);
    const cs = rotatedCells(type, 0);
    const xs = cs.map((p) => p[0]), ys = cs.map((p) => p[1]);
    const w = Math.max(...xs) - Math.min(...xs) + 1, h = Math.max(...ys) - Math.min(...ys) + 1;
    const s = 16;
    const ox = (c.width - w * s) / 2 - Math.min(...xs) * s, oy = (c.height - h * s) / 2 - Math.min(...ys) * s;
    for (const [x, y] of cs) drawCell(g, ox + x * s, oy + y * s, SHAPES[type].c, s, false, type === "♥");
  }
  function renderHold() { renderMini(holdCtx, holdCvs, game.hold); }
  function renderNext() {
    nextCtx.clearRect(0, 0, nextCvs.width, nextCvs.height);
    const items = (game.heartQueued ? ["♥"] : []).concat(game.queue).slice(0, 5);
    items.forEach((t, i) => {
      const cs = rotatedCells(t, 0);
      const xs = cs.map((p) => p[0]), ys = cs.map((p) => p[1]);
      const w = Math.max(...xs) - Math.min(...xs) + 1;
      const s = 14, ox = (nextCvs.width - w * s) / 2 - Math.min(...xs) * s, oy = i * 52 + 10 - Math.min(...ys) * s;
      for (const [x, y] of cs) drawCell(nextCtx, ox + x * s, oy + y * s, SHAPES[t].c, s, false, t === "♥");
    });
  }

  // ---------- HUD ----------
  function updateHud() {
    if (game.score > game.hi) { game.hi = game.score; localStorage.setItem(HI_KEY, String(game.hi)); }
    document.getElementById("score").textContent = game.score.toLocaleString();
    document.getElementById("hiscore").textContent = game.hi.toLocaleString();
    document.getElementById("lines").textContent = game.lines;
    document.getElementById("level").textContent = game.level;
    renderNext();
  }
  function updateMeter() {
    LETTERS.forEach((L, i) => {
      const el = document.getElementById("meter-" + L);
      el.classList.toggle("lit", i < game.meter);
      el.style.setProperty("--lc", LETTER_COLORS[L]);
    });
    document.getElementById("meter-heart").classList.toggle("lit", game.heartQueued);
  }
  function overlay(html) {
    const ov = document.getElementById("overlay");
    if (!html) { ov.className = ""; ov.innerHTML = ""; return; }
    ov.className = "show"; ov.innerHTML = html;
  }

  // ---------- boot ----------
  overlay(`<div class="logo">TETRISHA</div>
    <div class="sub">clear lines to spell <b style="color:#ff4fd8">M·I·S·H·A</b> —<br>complete it and <b style="color:#ff8fc6">DAVID</b> sends a heart 💗 that detonates</div>
    <button class="btn" onclick="__TT.start()">▶ PLAY</button>
    <div class="sub dim">←→ move · ↑/X · Z rotate · ↓ soft · space hard drop · C hold · P pause · M mute</div>`);
  updateHud(); updateMeter();
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
  requestAnimationFrame(frame);
})();
