/* ============================================================================
   MINI — the arcade's 5x5 crossword.
   ----------------------------------------------------------------------------
   Built on the shape of games/wordish/game.js (the reference implementation):
     requestedDay → dailyIndex → load → save on every keystroke → finish once
     → results sheet.

   The whole game is the typing feel, so that is where the code goes:
     · two levels of highlight — active ENTRY (blue) and active SQUARE (gold)
     · auto-advance that skips squares already KNOWN correct (revealed, or
       confirmed by CHECK), jumps back to the first blank in the entry, walks
       through a full entry so you can overwrite it, and only then hops to the
       next clue that still has a blank — the cursor never dies on you
     · Space / the A⇄D key / a perpendicular arrow / re-tapping the cursor all
       flip Across↔Down; a parallel arrow moves one white square
     · Tab / Shift-Tab step clue to clue; Backspace clears then steps back
     · a clue bar pinned above the keyboard: tap it (or swipe it) to step clues
     · a pausable clock that also pauses when the tab goes away, and glows mint
       while you are still under par
     · CHECK and REVEAL, each in three scopes, behind one small TOOLS sheet
     · no submit button: the grid auto-validates the instant it is all correct

   NORM (cross-game 0-100 currency, see _build/CONTRACT.md §3) — time based:
     norm = clamp(round(100 * par / seconds), 0, 100)
   so matching par exactly = 100, 1.4x par ≈ 71 (a solid morning), 2x par = 50.
   REVEAL is the only thing that costs: any reveal caps the score at 60, and
   each reveal after the first drops that cap by 5 more (floor 10), so revealing
   the whole grid lands near 10 rather than 60. CHECK is free — it hands you no
   letters — but it is counted and printed on the result sheet. The cap and the
   reveal count both show there; a time is never silently inflated by help.
   ========================================================================== */
(function () {
  "use strict";

  /* ── constants ────────────────────────────────────────────────────────────
     Declared above every function that boots with them: `var` initialisers do
     NOT hoist, so a constant read during boot would otherwise be undefined. */

  var ID = "mini";
  var SIZE = 5;
  var ACROSS = "A", DOWN = "D";
  var REVEAL_CAP = 60;          // any reveal caps norm here …
  var REVEAL_STEP = 5;          // … and every reveal after the first drops it
  var REVEAL_FLOOR = 10;
  var PAR_K = 5.7;              // sec/white-square a solid solve takes (Daily Run par)
  var TICK_MS = 250;
  var SAVE_MS = 5000;
  var BANDS = [30, 60, 90, 120, 150, 180, 210, 240];   // solve-time histogram

  // Survivable fallback so the cabinet still plays if the data file is missing.
  var FALLBACK = {
    id: "fb01", size: 5, par: 95, grid: ["BOARD", "ERROR", "ABOVE", "TIMES", "STARS"],
    across: [
      { n: 1, r: 0, c: 0, len: 5, ans: "BOARD", clue: "Chess surface" },
      { n: 6, r: 1, c: 0, len: 5, ans: "ERROR", clue: "Boo-boo" },
      { n: 7, r: 2, c: 0, len: 5, ans: "ABOVE", clue: "Higher than" },
      { n: 8, r: 3, c: 0, len: 5, ans: "TIMES", clue: "Multiplied by" },
      { n: 9, r: 4, c: 0, len: 5, ans: "STARS", clue: "Night sky dots" }
    ],
    down: [
      { n: 1, r: 0, c: 0, len: 5, ans: "BEATS", clue: "Rhythms in a bar" },
      { n: 2, r: 0, c: 1, len: 5, ans: "ORBIT", clue: "Path around a planet" },
      { n: 3, r: 0, c: 2, len: 5, ans: "AROMA", clue: "Smell of fresh bread" },
      { n: 4, r: 0, c: 3, len: 5, ans: "ROVER", clue: "Machine exploring a planet" },
      { n: 5, r: 0, c: 4, len: 5, ans: "DRESS", clue: "Frock" }
    ]
  };

  var HELP =
    "<p>Fill every white square. There's no submit button and nothing to lose — " +
    "the grid <b>validates itself</b> the moment the last letter is right. The only " +
    "score is the clock.</p>" +
    "<ul>" +
    "<li>Tap a square or a clue to move the cursor. The <b>square</b> you're on is gold, " +
    "the rest of the <b>entry</b> is blue.</li>" +
    "<li><b>Space</b>, the <b>A⇄D</b> key, a perpendicular arrow, or tapping the square " +
    "you're already on flips Across↔Down.</li>" +
    "<li><b>Tab / Shift-Tab</b> jump to the next / previous clue. Arrows move. " +
    "<b>Backspace</b> clears the letter, then steps back.</li>" +
    "<li>Typing skips squares already known to be right, then hops to the next " +
    "unfinished clue.</li>" +
    "<li>The clue bar above the keyboard is tappable (and swipeable) — it steps clues.</li>" +
    "<li><b>Tap the clock</b> to pause. It pauses itself if you leave the tab, and it " +
    "glows mint while you're still under par.</li>" +
    "<li><b>TOOLS</b> holds <b>CHECK</b> (square / word / puzzle — right letters go green, " +
    "wrong ones get a slash) and <b>REVEAL</b> (square / word / puzzle). Check is free. " +
    "Any reveal caps your score at " + REVEAL_CAP + ", and each extra reveal costs more — " +
    "it's always printed on the result sheet, so a time is never quietly inflated.</li>" +
    "<li>Match <b>par</b> and you score 100. Par is printed under the grid.</li>" +
    "</ul>";

  /* ── the data, defensively ───────────────────────────────────────────────
     A generator produced these; trust nothing. Any puzzle that doesn't
     self-verify (letters matching the grid, entries in range, every white
     square reachable) is dropped rather than allowed to render half a game. */

  function prep(raw) {
    if (!raw || !raw.grid || raw.grid.length !== SIZE) return null;
    var g = [], r, c, i;
    for (r = 0; r < SIZE; r++) {
      var row = String(raw.grid[r] === undefined ? "" : raw.grid[r]).toUpperCase();
      if (row.length !== SIZE) return null;
      g.push(row);
    }
    var p = {
      id: String(raw.id === undefined ? "?" : raw.id),
      par: Math.max(20, Math.round(+raw.par || 90)),
      grid: g, whites: 0, num: {}, entries: [], at: {},
      title: raw.title || null, theme: raw.theme || null
    };
    for (r = 0; r < SIZE; r++) for (c = 0; c < SIZE; c++) if (g[r].charAt(c) !== "#") p.whites++;
    if (!p.whites) return null;

    var lists = [[raw.across, ACROSS], [raw.down, DOWN]], ok = true;
    lists.forEach(function (L) {
      (L[0] || []).forEach(function (e) {
        if (!ok || !e) return;
        var len = +e.len, er = +e.r, ec = +e.c, ans = String(e.ans || "").toUpperCase();
        if (!(len >= 2) || ans.length !== len) { ok = false; return; }
        var cells = [];
        for (var k = 0; k < len; k++) {
          var rr = L[1] === ACROSS ? er : er + k;
          var kc = L[1] === ACROSS ? ec + k : ec;
          if (!(rr >= 0 && rr < SIZE && kc >= 0 && kc < SIZE)) { ok = false; return; }
          if (g[rr].charAt(kc) !== ans.charAt(k)) { ok = false; return; }
          cells.push([rr, kc]);
        }
        p.entries.push({
          dir: L[1], n: +e.n || 0, r: er, c: ec, len: len, ans: ans,
          clue: String(e.clue || "?"), cells: cells
        });
      });
    });
    if (!ok || !p.entries.length) return null;

    // Across first then Down, each by clue number — the Tab order solvers expect.
    p.entries.sort(function (a, b) {
      if (a.dir !== b.dir) return a.dir === ACROSS ? -1 : 1;
      return a.n - b.n;
    });
    for (i = 0; i < p.entries.length; i++) {
      var e2 = p.entries[i];
      for (var j = 0; j < e2.cells.length; j++) {
        var key = e2.cells[j][0] + "," + e2.cells[j][1];
        var slot = p.at[key] || (p.at[key] = {});
        if (slot[e2.dir] === undefined) slot[e2.dir] = i;
      }
      var nk = e2.r + "," + e2.c;
      if (p.num[nk] === undefined && e2.n) p.num[nk] = e2.n;
    }
    for (r = 0; r < SIZE; r++) {
      for (c = 0; c < SIZE; c++) {
        if (g[r].charAt(c) === "#") continue;
        if (!p.at[r + "," + c]) return null;      // an unreachable white square
      }
    }
    return p;
  }

  var POOL = (function () {
    var src = ((window.AD_CROSSWORDS || {}).mini) || [];
    var out = [], i;
    for (i = 0; i < src.length; i++) {
      var p = prep(src[i]);
      if (p) out.push(p);
    }
    if (!out.length) { var fb = prep(FALLBACK); if (fb) out.push(fb); }
    return out;
  })();

  // A.dailyIndex walks the real length, so a short pool is fine — it just cycles
  // sooner, and never repeats until it has been all the way round.
  function puzzleFor(dayN) {
    if (!POOL.length) return null;
    return POOL[A.dailyIndex(ID, dayN, POOL.length)];
  }

  /* ── state — all of it, before anything that closes over it runs ───────── */

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var P = null;                                     // today's prepared puzzle
  var fill = [], good = [], wrong = [], rev = [];   // 25 long, indexed r*5+c
  var cr = 0, cc = 0, dir = ACROSS;
  var elapsed = 0, running = false, runFrom = 0, paused = false;
  var over = false, finished = false, checks = 0, reveals = 0, nagged = false;
  var main, mtop, clockEl, gwrap, gridEl, pzEl, parEl, cbar, labEl, clEl, kbd;
  var sqEl = [], letEl = [], clueLists = [];
  var ticker = null, saver = null;
  var sx = 0, sy = 0, swiped = false;

  function ix(r, c) { return r * SIZE + c; }
  function blocked(r, c) {
    if (!P || isNaN(r) || isNaN(c) || r < 0 || c < 0 || r >= SIZE || c >= SIZE) return true;
    return P.grid[r].charAt(c) === "#";
  }
  function sol(r, c) { return P.grid[r].charAt(c); }
  function locked(i) { return !!(rev[i] || good[i]); }
  function fmt(sec) { return A.fmtTime(Math.max(0, Math.round(sec)) * 1000); }

  /* ── par for the Daily Run: what norm should a solid solve expect? ───────
     norm already divides by the puzzle's own par, so difficulty is baked in;
     what varies between puzzles is how stingy that par is for the number of
     squares you have to fill. Median over the shipped 40 lands ≈72. */
  A.setPar(ID, function (dayN) {
    var p = (dayN === A.PRACTICE) ? P : puzzleFor(dayN);
    if (!p) return null;
    return A.clamp(Math.round(100 * p.par / (PAR_K * p.whites)), 45, 88);
  });

  /* ── the clock ───────────────────────────────────────────────────────── */

  function ms() { return elapsed + (running ? Date.now() - runFrom : 0); }
  function startClock() { if (running || over || paused) return; runFrom = Date.now(); running = true; }
  function stopClock() { if (!running) return; elapsed += Date.now() - runFrom; running = false; }

  function paintClock() {
    if (!clockEl) return;
    var t = ms();
    clockEl.firstChild.nodeValue = A.fmtTime(Math.floor(t / 1000) * 1000);
    clockEl.classList.toggle("off", paused);
    clockEl.classList.toggle("beat", !paused && !over && t < P.par * 1000);
    clockEl.setAttribute("aria-label", "clock " + clockEl.firstChild.nodeValue +
      (paused ? ", paused, tap to resume" : ", tap to pause"));
  }

  function setPaused(on) {
    if (over) return;
    on = !!on;
    if (on === paused) return;
    paused = on;
    if (paused) { stopClock(); save(); } else { startClock(); }
    pzEl.classList.toggle("on", paused);
    if (kbd) kbd.disable(paused);
    render();
  }

  /* ── boot ────────────────────────────────────────────────────────────── */

  main = A.mount({ id: ID, dayN: day, help: HELP });

  if (!POOL.length) {
    main.appendChild(A.el("div", "ac-card center",
      "<p>No puzzles loaded — <b>core/data/crosswords.js</b> didn't arrive.</p>"));
    return;
  }

  P = practice ? A.pick(A.rng(String(Date.now()) + Math.random()), POOL) : puzzleFor(day);
  for (var z = 0; z < SIZE * SIZE; z++) { fill[z] = ""; good[z] = 0; wrong[z] = 0; rev[z] = 0; }

  // Start on the first clue, NOT on (0,0) — nine of the shipped grids open with
  // a block there, and a cursor parked on a block has no entry and no clue.
  cr = P.entries[0].cells[0][0];
  cc = P.entries[0].cells[0][1];
  dir = P.entries[0].dir;

  /* toolbar: clock · clues · tools */
  mtop = A.el("div", null, "");
  mtop.id = "mtop";
  main.appendChild(mtop);

  clockEl = A.el("span", "ac-pill clk", "");
  clockEl.appendChild(document.createTextNode("0:00"));
  clockEl.setAttribute("role", "button");
  clockEl.tabIndex = 0;
  clockEl.title = "pause / resume the clock";
  clockEl.addEventListener("click", function () { setPaused(!paused); });
  clockEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setPaused(!paused); }
  });
  mtop.appendChild(clockEl);

  var cluesBtn = A.el("button", "ac-pill", "CLUES");
  cluesBtn.type = "button";
  cluesBtn.onclick = cluesModal;
  mtop.appendChild(cluesBtn);

  var toolsBtn = A.el("button", "ac-pill", "TOOLS");
  toolsBtn.type = "button";
  toolsBtn.onclick = toolsModal;
  mtop.appendChild(toolsBtn);

  /* the grid */
  gwrap = A.el("div", null, "");
  gwrap.id = "gwrap";
  gridEl = A.el("div", null, "");
  gridEl.id = "grid";
  gridEl.setAttribute("role", "grid");
  gridEl.setAttribute("aria-label", "crossword grid, 5 by 5");
  gridEl.tabIndex = 0;
  for (var r0 = 0; r0 < SIZE; r0++) {
    for (var c0 = 0; c0 < SIZE; c0++) {
      var i0 = ix(r0, c0), bl = P.grid[r0].charAt(c0) === "#";
      var sq = A.el("div", "sq" + (bl ? " block" : ""), "");
      sq.setAttribute("role", "gridcell");
      if (bl) {
        sq.setAttribute("aria-hidden", "true");
      } else {
        sq.setAttribute("data-r", r0);
        sq.setAttribute("data-c", c0);
        var n0 = P.num[r0 + "," + c0];
        if (n0) sq.appendChild(A.el("i", "n", String(n0)));
        var lt = A.el("span", "l", "");
        sq.appendChild(lt);
        letEl[i0] = lt;
        sq.setAttribute("aria-label", "row " + (r0 + 1) + " column " + (c0 + 1) +
          (n0 ? ", clue " + n0 : ""));
      }
      sqEl[i0] = sq;
      gridEl.appendChild(sq);
    }
  }
  gwrap.appendChild(gridEl);

  pzEl = A.el("div", null, "<b>PAUSED</b>");
  pzEl.id = "pz";
  var contBtn = A.el("button", "ac-btn", "▶ CONTINUE");
  contBtn.type = "button";
  contBtn.onclick = function () { setPaused(false); };
  pzEl.appendChild(contBtn);
  gwrap.appendChild(pzEl);
  main.appendChild(gwrap);

  parEl = A.el("div", "mpar", "");
  main.appendChild(parEl);

  /* the clue list — inline from 720px up, in a modal on phones */
  var cluesEl = A.el("div", "cluelist", "");
  cluesEl.id = "clues";
  buildClueList(cluesEl);
  main.appendChild(cluesEl);

  /* the clue bar, directly above the keyboard */
  cbar = A.el("div", null, "");
  cbar.id = "cbar";
  var prevB = A.el("button", null, "‹");
  prevB.type = "button";
  prevB.title = "previous clue";
  prevB.setAttribute("aria-label", "previous clue");
  var txt = A.el("div", "txt", "");
  txt.setAttribute("role", "button");
  txt.tabIndex = 0;
  txt.title = "next clue";
  labEl = A.el("div", "lab", "");
  clEl = A.el("div", "cl", "");
  txt.appendChild(labEl);
  txt.appendChild(clEl);
  var nextB = A.el("button", null, "›");
  nextB.type = "button";
  nextB.title = "next clue";
  nextB.setAttribute("aria-label", "next clue");
  cbar.appendChild(prevB);
  cbar.appendChild(txt);
  cbar.appendChild(nextB);
  main.appendChild(cbar);

  prevB.onclick = function () { stepClue(-1); };
  nextB.onclick = function () { stepClue(1); };
  txt.addEventListener("click", function () { if (!swiped) stepClue(1); });
  txt.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); stepClue(1); }
  });

  // Horizontal swipe on the clue bar steps clues (its CSS asks for pan-y).
  cbar.addEventListener("touchstart", function (e) {
    var t = e.touches[0];
    sx = t.clientX; sy = t.clientY; swiped = false;
  }, { passive: true });
  cbar.addEventListener("touchend", function (e) {
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swiped = true;
      stepClue(dx < 0 ? 1 : -1);
      setTimeout(function () { swiped = false; }, 350);
    }
  }, { passive: true });

  /* the keyboard — ENTER repurposed as the Across/Down toggle, and labelled */
  kbd = A.keyboard({
    host: main, noPhysical: true, enter: "A⇄D",
    onKey: function (ch) { type(ch); },
    onEnter: function () { flip(); },
    onBack: back
  });

  /* one delegated listener for all 25 squares */
  gridEl.addEventListener("click", function (e) {
    var t = e.target;
    while (t && t !== gridEl && !t.hasAttribute("data-r")) t = t.parentNode;
    if (!t || t === gridEl) return;
    var rr = +t.getAttribute("data-r"), kc = +t.getAttribute("data-c");
    if (blocked(rr, kc)) return;
    try { gridEl.focus({ preventScroll: true }); } catch (err) { gridEl.focus(); }
    if (paused || over) return;
    if (rr === cr && kc === cc) flip();
    else { setCursor(rr, kc, dir); A.sfx("key"); }
  });

  document.addEventListener("keydown", onKey);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && !over && !paused) setPaused(true);
  });
  window.addEventListener("pagehide", function () { stopClock(); save(); });

  restore();
  render();
  if (!over) settle();          // a restored grid might already be complete

  if (!over) {
    startClock();
    ticker = setInterval(paintClock, TICK_MS);
    saver = setInterval(function () { if (!over && !paused) save(); }, SAVE_MS);
    try { gridEl.focus({ preventScroll: true }); } catch (e2) { /* fine without */ }
  }

  /* ── cursor ──────────────────────────────────────────────────────────── */

  function entryAt(r, c, d) {
    var slot = P.at[r + "," + c];
    if (!slot) return -1;
    if (slot[d] !== undefined) return slot[d];
    var other = d === ACROSS ? DOWN : ACROSS;
    return slot[other] === undefined ? -1 : slot[other];
  }
  function curIdx() { return entryAt(cr, cc, dir); }
  function curEntry() { var i = curIdx(); return i < 0 ? null : P.entries[i]; }

  function setCursor(r, c, d, quiet) {
    if (blocked(r, c)) return;
    var slot = P.at[r + "," + c];
    if (!slot) return;
    cr = r; cc = c;
    if (d && slot[d] !== undefined) dir = d;
    else if (slot[dir] === undefined) dir = (dir === ACROSS ? DOWN : ACROSS);
    if (!quiet) render();
  }

  function flip() {
    if (paused || over) return;
    var slot = P.at[cr + "," + cc], other = dir === ACROSS ? DOWN : ACROSS;
    if (!slot || slot[other] === undefined) { A.sfx("miss"); return; }
    dir = other;
    A.sfx("key");
    render();
  }

  function open(cell) {
    var i = ix(cell[0], cell[1]);
    return !fill[i] && !locked(i);
  }
  function posIn(e, r, c) {
    for (var k = 0; k < e.cells.length; k++) if (e.cells[k][0] === r && e.cells[k][1] === c) return k;
    return 0;
  }

  /* Where the cursor goes after a letter lands. In order:
       1. the next blank further along this entry
       2. the first blank anywhere in this entry (jump back)
       3. this entry is full → the next editable square along it, so you can
          retype a word you got wrong without fighting the cursor
       4. …and at the end of a full entry → the next clue that still has a blank
       5. nothing left anywhere → stay put                                     */
  function advance() {
    var e = curEntry();
    if (!e) return;
    var pos = posIn(e, cr, cc), k, cell;
    for (k = pos + 1; k < e.cells.length; k++) {
      if (open(e.cells[k])) return setCursor(e.cells[k][0], e.cells[k][1], e.dir, true);
    }
    for (k = 0; k < e.cells.length; k++) {
      if (open(e.cells[k])) return setCursor(e.cells[k][0], e.cells[k][1], e.dir, true);
    }
    for (k = pos + 1; k < e.cells.length; k++) {
      cell = e.cells[k];
      if (!locked(ix(cell[0], cell[1]))) return setCursor(cell[0], cell[1], e.dir, true);
    }
    var start = curIdx();
    for (k = 1; k <= P.entries.length; k++) {
      var e2 = P.entries[(start + k) % P.entries.length];
      for (var j = 0; j < e2.cells.length; j++) {
        if (open(e2.cells[j])) return setCursor(e2.cells[j][0], e2.cells[j][1], e2.dir, true);
      }
    }
  }

  function stepClue(delta) {
    if (paused || over) return;
    var n = P.entries.length, start = curIdx();
    if (start < 0) start = 0;
    var t = ((start + delta) % n + n) % n;
    selectEntry(t);
  }

  function selectEntry(i) {
    if (paused || over) return;
    var e = P.entries[i];
    if (!e) return;
    var cell = e.cells[0];
    for (var k = 0; k < e.cells.length; k++) if (open(e.cells[k])) { cell = e.cells[k]; break; }
    setCursor(cell[0], cell[1], e.dir);
    A.sfx("key");
  }

  function moveBy(dr, dc) {
    var r = cr, c = cc;
    for (var step = 0; step < SIZE; step++) {
      r += dr; c += dc;
      if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return;
      if (!blocked(r, c)) { setCursor(r, c, dir); return; }
    }
  }

  /* ── typing ──────────────────────────────────────────────────────────── */

  function type(ch) {
    if (over || paused || !P || blocked(cr, cc)) return;
    var i = ix(cr, cc);
    if (locked(i)) {                       // known-correct: step past, don't clobber
      advance();
      i = ix(cr, cc);
      if (locked(i)) { render(); return; }
    }
    fill[i] = String(ch).toUpperCase().charAt(0);
    wrong[i] = 0;
    A.sfx("type");
    advance();
    render();
    save();
    settle();
  }

  function back() {
    if (over || paused || !P) return;
    var i = ix(cr, cc);
    if (fill[i] && !locked(i)) {           // letter here → delete it, stay
      fill[i] = ""; wrong[i] = 0;
      A.sfx("key");
      render(); save();
      return;
    }
    var e = curEntry();                    // empty → step back and delete that
    if (!e) return;
    var pos = posIn(e, cr, cc);
    for (var k = pos - 1; k >= 0; k--) {
      var cell = e.cells[k], j = ix(cell[0], cell[1]);
      if (locked(j)) continue;             // skip confirmed letters
      setCursor(cell[0], cell[1], e.dir, true);
      fill[j] = ""; wrong[j] = 0;
      A.sfx("key");
      render(); save();
      return;
    }
    A.sfx("miss");
  }

  function onKey(e) {
    if (!P || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector(".ac-modal.show")) return;
    var ae = document.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
    var onCtl = !!(ae && ae !== gridEl && (ae.tagName === "BUTTON" || ae.tagName === "A" ||
      (ae.getAttribute && ae.getAttribute("role") === "button")));
    var k = e.key;

    if (k === "Tab") {
      if (ae !== gridEl || over) return;   // leave real Tab navigation alone
      e.preventDefault();
      stepClue(e.shiftKey ? -1 : 1);
      return;
    }
    if (k === "Escape") { if (ae === gridEl) gridEl.blur(); return; }
    if (over) return;
    if (k === " ") {
      if (onCtl) return;
      e.preventDefault();
      if (paused) setPaused(false); else flip();
      return;
    }
    if (paused) return;
    if (k === "Enter") { if (onCtl) return; e.preventDefault(); flip(); return; }
    if (k === "Backspace" || k === "Delete") { e.preventDefault(); back(); return; }
    if (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown") {
      e.preventDefault();
      var horiz = (k === "ArrowLeft" || k === "ArrowRight");
      if (horiz !== (dir === ACROSS)) { flip(); return; }   // perpendicular → flip in place
      if (k === "ArrowLeft") moveBy(0, -1);
      else if (k === "ArrowRight") moveBy(0, 1);
      else if (k === "ArrowUp") moveBy(-1, 0);
      else moveBy(1, 0);
      return;
    }
    if (/^[a-zA-Z]$/.test(k)) { e.preventDefault(); type(k); }
  }

  /* ── check / reveal ──────────────────────────────────────────────────── */

  function scopeCells(scope) {
    var out = [], r, c;
    if (scope === "square") { if (!blocked(cr, cc)) out.push([cr, cc]); return out; }
    if (scope === "word") { var e = curEntry(); return e ? e.cells.slice() : out; }
    for (r = 0; r < SIZE; r++) for (c = 0; c < SIZE; c++) if (!blocked(r, c)) out.push([r, c]);
    return out;
  }

  function doCheck(scope) {
    if (over || paused) return;
    var nb = 0, nw = 0;
    scopeCells(scope).forEach(function (cell) {
      var i = ix(cell[0], cell[1]);
      if (!fill[i]) return;
      if (fill[i] === sol(cell[0], cell[1])) { good[i] = 1; wrong[i] = 0; nb++; }
      else { wrong[i] = 1; good[i] = 0; nw++; }
    });
    checks++;
    A.sfx(nw ? "miss" : "ok");
    A.toast(nw ? nw + (nw === 1 ? " letter is wrong" : " letters are wrong")
      : nb ? (nb === 1 ? "That one's right" : "All " + nb + " right so far")
        : "Nothing filled in to check", !!nw);
    render(); save(); settle();
  }

  function doReveal(scope, skipConfirm) {
    if (over || paused) return;
    if (scope === "puzzle" && !skipConfirm) {
      var m = A.modal("REVEAL THE WHOLE PUZZLE?",
        "<p>That fills in every square and ends the puzzle. Your score will be capped " +
        "well below par.</p><div class=\"ac-row\" style=\"margin-top:14px\">" +
        '<button class="ac-btn" id="rv-yes">YES, REVEAL</button>' +
        '<button class="ac-btn ghost" id="rv-no">NO, KEEP GOING</button></div>');
      m.body.querySelector("#rv-yes").onclick = function () { m.close(); doReveal("puzzle", true); };
      m.body.querySelector("#rv-no").onclick = function () { m.close(); };
      return;
    }
    var n = 0;
    scopeCells(scope).forEach(function (cell) {
      var i = ix(cell[0], cell[1]), want = sol(cell[0], cell[1]);
      if (fill[i] === want) { good[i] = 1; wrong[i] = 0; return; }   // they had it already
      fill[i] = want; rev[i] = 1; wrong[i] = 0; good[i] = 0;
      reveals++; n++;
    });
    if (!n) { A.toast("Already right — nothing to reveal"); render(); save(); settle(); return; }
    A.sfx("reveal");
    A.toast(n === 1 ? "Revealed one square" : "Revealed " + n + " squares");
    advance();
    render(); save(); settle();
  }

  /* ── completion ──────────────────────────────────────────────────────── */

  function filledCount() {
    var n = 0, r, c;
    for (r = 0; r < SIZE; r++) for (c = 0; c < SIZE; c++) if (!blocked(r, c) && fill[ix(r, c)]) n++;
    return n;
  }
  function allRight() {
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (blocked(r, c)) continue;
        if (fill[ix(r, c)] !== sol(r, c)) return false;
      }
    }
    return true;
  }

  // Auto-validate: the grid checks itself the moment it is complete. No submit
  // button, and no nagging while it is merely unfinished.
  function settle() {
    if (over) return;
    if (filledCount() < P.whites) { nagged = false; return; }
    if (allRight()) return win();
    if (!nagged) {
      nagged = true;
      A.toast("Grid's full, but something's off — try CHECK", true);
    }
  }

  function capFor() {
    return Math.max(REVEAL_FLOOR, REVEAL_CAP - REVEAL_STEP * Math.max(0, reveals - 1));
  }
  function normFor(sec) {
    var n = A.clamp(Math.round(100 * P.par / Math.max(1, sec)), 0, 100);
    if (reveals) n = A.clamp(Math.min(n, capFor()), REVEAL_FLOOR, 100);
    return n;
  }
  function bucketFor(sec) {
    for (var i = 0; i < BANDS.length; i++) if (sec <= BANDS[i]) return fmt(BANDS[i]);
    return fmt(BANDS[BANDS.length - 1]) + "+";
  }

  // Share: solve time against par as a ten-cell block. Under par, the filled
  // cells are the fraction of par you used (fewer = faster). Over par, the
  // trailing cells turn to show how far over you went. Always ten cells, so it
  // can never overflow a phone-width share sheet.
  function shareRows(sec) {
    var cb = A.settings().colourblind;
    var under = cb ? "🟦" : "🟩", overC = cb ? "🟧" : "🟨", empty = "⬜";
    var ratio = sec / P.par, cells = [], i;
    if (ratio <= 1) {
      var f = A.clamp(Math.round(ratio * 10), 1, 10);
      for (i = 0; i < 10; i++) cells.push(i < f ? under : empty);
    } else {
      var ov = A.clamp(Math.round((ratio - 1) * 10), 1, 10);
      for (i = 0; i < 10; i++) cells.push(i < 10 - ov ? under : overC);
    }
    var rows = ["⏱ " + fmt(sec) + "  ⛳ " + fmt(P.par), cells.join("")];
    if (reveals) rows.push("🚩 " + reveals + " revealed");
    return rows;
  }

  function win() {
    if (over) return;
    over = true;
    stopClock();
    if (ticker) { clearInterval(ticker); ticker = null; }
    if (saver) { clearInterval(saver); saver = null; }
    if (kbd) kbd.disable(true);
    paused = false;
    pzEl.classList.remove("on");

    var sec = Math.max(1, Math.round(ms() / 1000));
    var norm = normFor(sec);
    var rows = shareRows(sec);
    var detail = fmt(sec) + (reveals ? " 🚩" : "");

    if (!finished) {
      finished = true;
      A.finish(ID, practice ? A.PRACTICE : day, {
        score: sec, norm: norm, won: true, detail: detail,
        bucket: bucketFor(sec), shareGrid: rows, durationMs: ms()
      });
    }
    render();
    A.sfx(norm >= 95 ? "perfect" : "win");
    A.confetti(norm >= 95 ? 140 : 80);
    // setTimeout, never requestAnimationFrame: rAF is paused in a background
    // tab and the sheet would never arrive.
    setTimeout(function () { sheet(sec, norm, rows, detail); }, 520);
  }

  function sheet(sec, norm, rows, detail) {
    var extra = '<div class="mpar">YOUR TIME <b>' + A.esc(fmt(sec)) + "</b> · PAR " + A.esc(fmt(P.par)) +
      " · " + (sec <= P.par ? "UNDER PAR" : "+" + A.esc(fmt(sec - P.par)) + " OVER") + "</div>";
    if (reveals) {
      extra += '<div class="mbadge">' + reveals + (reveals === 1 ? " REVEAL" : " REVEALS") +
        " — SCORE CAPPED AT " + capFor() + "</div>";
    }
    if (checks) {
      extra += '<div class="mpar">' + checks + (checks === 1 ? " check" : " checks") + " used</div>";
    }
    A.results(ID, practice ? A.PRACTICE : day, {
      title: reveals ? "SOLVED, WITH HELP"
        : sec <= P.par ? "UNDER PAR" : norm >= 70 ? "SOLVED" : "GOT THERE",
      extraHTML: extra,
      state: { norm: norm, shareGrid: rows, won: true },
      shareText: "MINI (practice) " + detail + "\n" + rows.join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); }
    });
  }

  /* ── rendering ───────────────────────────────────────────────────────── */

  function render() {
    var e = over ? null : curEntry(), inEntry = {}, k;
    if (e) for (k = 0; k < e.cells.length; k++) inEntry[ix(e.cells[k][0], e.cells[k][1])] = 1;

    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var i = ix(r, c), sq = sqEl[i];
        if (blocked(r, c)) { if (sq.className !== "sq block") sq.className = "sq block"; continue; }
        var cls = "sq";
        if (over) cls += " done";
        else {
          if (inEntry[i]) cls += " ent";
          if (r === cr && c === cc) cls += " cur";
        }
        if (good[i]) cls += " good";
        if (wrong[i]) cls += " wrong";
        if (rev[i]) cls += " rev";
        if (sq.className !== cls) sq.className = cls;
        if (letEl[i] && letEl[i].textContent !== fill[i]) letEl[i].textContent = fill[i];
      }
    }

    if (over) {
      labEl.textContent = "SOLVED";
      clEl.textContent = "Every square is right — " + fmt(Math.round(ms() / 1000)) + " on the clock.";
    } else if (paused) {
      labEl.textContent = "PAUSED";
      clEl.textContent = "Clock stopped. Hit CONTINUE on the grid to carry on.";
    } else if (e) {
      labEl.textContent = e.n + (e.dir === ACROSS ? "-ACROSS" : "-DOWN");
      clEl.textContent = e.clue;
    } else {
      labEl.textContent = "CLUE";
      clEl.textContent = "Tap a square to start.";
    }
    parEl.textContent = over
      ? "PAR " + fmt(P.par) + " · YOU " + fmt(Math.round(ms() / 1000))
      : "PAR " + fmt(P.par) + " — match it and you score 100";
    paintClueLists();
    paintClock();
  }

  function buildClueList(host) {
    var rec = { host: host, els: [] };
    [[ACROSS, "ACROSS"], [DOWN, "DOWN"]].forEach(function (D) {
      var col = A.el("div", null, "");
      col.appendChild(A.el("h3", null, D[1]));
      P.entries.forEach(function (e, i) {
        if (e.dir !== D[0]) return;
        var ci = A.el("div", "ci", "<b>" + e.n + "</b><span>" + A.esc(e.clue) + "</span>");
        ci.setAttribute("role", "button");
        ci.onclick = function () {
          selectEntry(i);
          if (rec.onPick) rec.onPick();
          else { try { gridEl.focus({ preventScroll: true }); } catch (err) { /* fine */ } }
        };
        rec.els[i] = ci;
        col.appendChild(ci);
      });
      host.appendChild(col);
    });
    clueLists.push(rec);
    return rec;
  }

  function paintClueLists() {
    var cur = over ? -1 : curIdx();
    clueLists.forEach(function (rec) {
      P.entries.forEach(function (e, i) {
        var el = rec.els[i];
        if (!el) return;
        var done = true;
        for (var k = 0; k < e.cells.length; k++) {
          if (!fill[ix(e.cells[k][0], e.cells[k][1])]) { done = false; break; }
        }
        var cls = "ci" + (i === cur ? " on" : "") + (done ? " filled" : "");
        if (el.className !== cls) el.className = cls;
      });
    });
  }

  /* ── modals ──────────────────────────────────────────────────────────── */

  function cluesModal() {
    var rec = null;
    var m = A.modal("CLUES", "", {
      onClose: function () {
        var at = clueLists.indexOf(rec);
        if (at >= 0) clueLists.splice(at, 1);
      }
    });
    var host = A.el("div", "cluelist", "");
    m.body.appendChild(host);
    rec = buildClueList(host);
    rec.onPick = function () { m.close(); };
    paintClueLists();
    return m;
  }

  function toolsModal() {
    var h =
      '<div class="tools-lab">CHECK — right letters go green, wrong ones get a slash. Free.</div>' +
      '<div class="tools-grid">' +
      '<button class="ac-btn ghost sm" data-ck="square">SQUARE</button>' +
      '<button class="ac-btn ghost sm" data-ck="word">WORD</button>' +
      '<button class="ac-btn ghost sm" data-ck="puzzle">PUZZLE</button></div>' +
      '<div class="tools-lab">REVEAL — fills the letters in. Caps your score at ' + REVEAL_CAP +
      ', minus ' + REVEAL_STEP + ' for every reveal after the first.</div>' +
      '<div class="tools-grid">' +
      '<button class="ac-btn ghost sm" data-rv="square">SQUARE</button>' +
      '<button class="ac-btn ghost sm" data-rv="word">WORD</button>' +
      '<button class="ac-btn ghost sm" data-rv="puzzle">PUZZLE</button></div>' +
      '<p class="tiny dim center">' +
      (reveals ? reveals + " revealed · capped at " + capFor()
        : "No reveals yet — full marks still on the table") +
      (checks ? " · " + checks + (checks === 1 ? " check" : " checks") : "") + "</p>" +
      '<div class="ac-row" style="margin-top:12px">' +
      '<button class="ac-btn ghost" id="tl-pause">' + (paused ? "RESUME" : "PAUSE") + "</button>" +
      '<a class="ac-btn ghost" href="' + (practice ? "./" : "?practice=1") +
      '" style="text-decoration:none">' + (practice ? "← TODAY'S MINI" : "PRACTICE") + "</a></div>";
    var m = A.modal("TOOLS", h);
    A.$$("[data-ck]", m.body).forEach(function (b) {
      b.onclick = function () { m.close(); doCheck(b.getAttribute("data-ck")); };
    });
    A.$$("[data-rv]", m.body).forEach(function (b) {
      b.onclick = function () { m.close(); doReveal(b.getAttribute("data-rv")); };
    });
    m.body.querySelector("#tl-pause").onclick = function () { m.close(); setPaused(!paused); };
    return m;
  }

  /* ── persistence — every keystroke, and the clock with it ─────────────── */

  function save() {
    if (practice || over) return;
    A.save(ID, day, {
      pid: P.id, fill: fill.join("|"), good: good.join(""), wrong: wrong.join(""),
      rev: rev.join(""), cr: cr, cc: cc, dir: dir, elapsed: ms(),
      checks: checks, reveals: reveals
    });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (!st) return;
    if (st.pid && st.pid !== P.id) return;            // the pool moved under us
    if (typeof st.fill === "string") {
      var f = st.fill.split("|");
      for (var i = 0; i < SIZE * SIZE; i++) {
        fill[i] = String(f[i] || "").toUpperCase().charAt(0) || "";
        good[i] = String(st.good || "").charAt(i) === "1" ? 1 : 0;
        wrong[i] = String(st.wrong || "").charAt(i) === "1" ? 1 : 0;
        rev[i] = String(st.rev || "").charAt(i) === "1" ? 1 : 0;
        if (blocked(Math.floor(i / SIZE), i % SIZE)) { fill[i] = ""; good[i] = 0; wrong[i] = 0; rev[i] = 0; }
      }
    }
    elapsed = Math.max(0, +st.elapsed || 0);
    checks = Math.max(0, +st.checks || 0);
    reveals = Math.max(0, +st.reveals || 0);
    var scr = +st.cr, scc = +st.cc;
    if (!blocked(scr, scc)) { cr = scr; cc = scc; }
    if (st.dir === ACROSS || st.dir === DOWN) dir = st.dir;
    setCursor(cr, cc, dir, true);

    if (st.done) {
      over = true; finished = true;
      running = false;
      if (kbd) kbd.disable(true);
      var sec = Math.max(1, Math.round((st.durationMs || elapsed) / 1000));
      elapsed = sec * 1000;
      var rows = (st.shareGrid && st.shareGrid.length) ? st.shareGrid : shareRows(sec);
      setTimeout(function () { sheet(sec, st.norm || 0, rows, st.detail || fmt(sec)); }, 260);
    }
  }

  /* ── registration + debug hooks ──────────────────────────────────────── */

  A.register({
    id: ID, name: "MINI", tagline: "a 5×5 crossword against the clock",
    icon: "▦", accent: "--cool", family: "word", parMs: 90000,
    hasArchive: true, hasPractice: false, distLabel: "solve time"
  });

  // Enough to play a whole puzzle headlessly from the console.
  window.__MN = {
    puzzle: function () {
      return {
        id: P.id, par: P.par, whites: P.whites, entries: P.entries.length,
        pool: POOL.length, day: day, practice: practice
      };
    },
    grid: function () { return P.grid.slice(); },
    clues: function () {
      return P.entries.map(function (e) {
        return e.n + e.dir + " " + e.clue + " = " + e.ans;
      });
    },
    state: function () {
      var g = [], r, c;
      for (r = 0; r < SIZE; r++) {
        var row = "";
        for (c = 0; c < SIZE; c++) row += blocked(r, c) ? "#" : (fill[ix(r, c)] || ".");
        g.push(row);
      }
      var e = over ? null : curEntry();
      return {
        fill: g, cursor: [cr, cc], dir: dir, entry: e ? e.n + e.dir : null,
        clue: e ? e.clue : null, filled: filledCount(), whites: P.whites,
        sec: Math.round(ms() / 1000), paused: paused, over: over,
        checks: checks, reveals: reveals,
        norm: over ? normFor(Math.max(1, Math.round(ms() / 1000))) : null
      };
    },
    sel: function (r, c, d) { setCursor(r, c, d || dir); return this.state(); },
    type: function (s) {
      String(s).split("").forEach(function (ch) { if (/[a-zA-Z]/.test(ch)) type(ch); });
      return this.state();
    },
    key: function (k, shift) {
      onKey({
        key: k, shiftKey: !!shift, metaKey: false, ctrlKey: false, altKey: false,
        preventDefault: function () {}
      });
      return this.state();
    },
    flip: function () { flip(); return this.state(); },
    next: function () { stepClue(1); return this.state(); },
    prev: function () { stepClue(-1); return this.state(); },
    check: function (scope) { doCheck(scope || "puzzle"); return this.state(); },
    reveal: function (scope) { doReveal(scope || "square", true); return this.state(); },
    pause: function (on) { setPaused(on === undefined ? true : !!on); return this.state(); },
    setElapsed: function (v) {
      elapsed = Math.max(0, +v || 0);
      runFrom = Date.now();
      render();
      return this.state();
    },
    // Fill the grid the honest way — one letter at a time, through type().
    solve: function () {
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          if (over || blocked(r, c)) continue;
          if (fill[ix(r, c)] === sol(r, c)) continue;
          setCursor(r, c, dir, true);
          type(sol(r, c));
        }
      }
      return this.state();
    },
    tools: toolsModal,
    cluesModal: cluesModal
  };
})();
