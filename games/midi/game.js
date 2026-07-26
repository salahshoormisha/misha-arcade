/* ============================================================================
   MIDI — the arcade's bigger crossword. A titled 7×7 against the clock.
   Built on the shape of games/wordish/game.js (the reference implementation):
     requestedDay → dailyIndex → load → save on every move → finish once → results

   Faithful to the real NYT Midi in the ways that matter:
     · it is TITLED and THEMED — when a puzzle has a title it sits above the
       grid from the very start, because the title is a hint, not decoration
     · Monday/Tuesday difficulty, flat, every day
     · no submit button: the grid auto-validates the moment the last square
       is right, and the only score is the clock
     · CHECK AND REVEAL END THE STREAK. That is the real Midi's rule ("Using
       Check or Reveal will result in your Midi Crossword Streak being reset"),
       and we kept it: you still keep the solve and you still get a score, but
       it is recorded won:false — NYT's blue star instead of a gold one. The
       result sheet says so in plain words rather than hiding it.

   NORM (cross-game 0-100 currency, CONTRACT §3 — the time formula MINI uses):
     clean solve   → norm = clamp(round(100 * par / seconds), 0, 100)
                     par exactly = 100, twice par = 50, four times par = 25
     check/reveal  → the same number, then capped at 55, and won:false
   ========================================================================== */
(function () {
  "use strict";

  /* ── constants ───────────────────────────────────────────────────────────
     Declared above first use on purpose: `var` initialisers do not hoist, so
     anything a boot-time function reads must already be assigned up here. */
  var ID = "midi";
  var ASSIST_CAP = 55;                 // a helped solve can never beat this
  var GAP = 4, MIN_CELL = 26, MAX_CELL = 54;
  var CB_OK = "🟦", CB_HELP = "🟧", OK_SQ = "🟩", HELP_SQ = "🟨", BLOCK_SQ = "⬛";

  var DATA = window.AD_CROSSWORDS || {};
  var POOL = (DATA.midi || []).filter(function (p) {
    return p && p.grid && p.grid.length && p.across && p.across.length && p.down && p.down.length;
  });

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;

  /* puzzle + geometry */
  var P = null, N = 7, PAR = 300;
  var sol = [];        // solution letter per cell index; "" for a block
  var num = [];        // clue number per cell index; 0 for none
  var entries = [];    // {dir,n,r,c,len,ans,clue,cells:[idx],has:{idx:1}}
  var entryAt = [];    // per cell: {a: entryIndex, d: entryIndex}
  var cellNodes = [];

  /* play state */
  var letters = [], pencil = {}, wrong = {}, sure = {}, shown = {};
  var usedCheck = false, usedReveal = false, pencilMode = false;
  var cur = 0, dir = "across";
  var elapsed = 0, running = false, since = 0, paused = false, over = false;
  var lastNorm = 0;

  /* dom */
  var main, gridEl, gridWrap, clueBar, clueTxt, sideList, kbd;
  var timerPill, pencilPill;

  /* ── pick the puzzle before anything renders ─────────────────────────── */

  if (POOL.length) {
    P = practice
      ? A.pick(A.rng(String(Date.now()) + Math.random()), POOL)
      : POOL[A.dailyIndex(ID, day, POOL.length)];
    N = P.size || P.grid.length;
    PAR = P.par || 300;
  }

  /* ── chrome ──────────────────────────────────────────────────────────── */

  main = A.mount({
    id: ID, dayN: day, wide: true,
    help: "<p>A 7×7 crossword with a clock. There is no submit button — get the last square " +
      "right and it solves itself.</p><ul>" +
      "<li>Tap a square to put the cursor there; tap it again — or press <b>space</b> — to swap " +
      "between Across and Down.</li>" +
      "<li>Arrow keys move you. An arrow <i>across</i> your direction flips the direction instead. " +
      "<b>Tab</b> jumps to the next clue. <b>⌫</b> clears the square, then steps back.</li>" +
      "<li>Par for this grid is <b>" + A.fmtTime(PAR * 1000) + "</b>. Solve it in par and you score " +
      "100; take twice as long and you score 50.</li>" +
      "<li><b>Check and Reveal are there when you're stuck — and they end the streak.</b> You keep " +
      "the solve and you keep a score (capped at " + ASSIST_CAP + "), but it goes down as " +
      "solved-with-help, not a win. That is exactly the real Midi's rule, and we didn't soften it.</li>" +
      "<li>The clock pauses when you leave the tab or hit the timer, and the grid is saved after " +
      "every single letter.</li>" +
      "<li>When a puzzle is <b>titled</b>, the title sits above the grid from the start. It's a hint.</li>" +
      "</ul>",
  });

  if (!P) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">No 7×7 puzzles in ' +
      "core/data/crosswords.js yet — check <code>AD_CROSSWORDS.midi</code>.</p>";
    return;
  }

  buildModel();
  buildDOM();

  kbd = A.keyboard({
    onKey: typeCh,
    onEnter: flip,
    onBack: backspace,
    enter: "⇄ DIR",
    host: main,
  });

  buildFooter();

  document.addEventListener("keydown", onPhysical);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", function () { stopClock(); save(); });
  window.addEventListener("resize", function () {
    clearTimeout(sizeGrid._t);
    sizeGrid._t = setTimeout(sizeGrid, 140);
  });
  setInterval(paintClock, 500);        // one loop, never rAF (paused in bg tabs)

  restore();

  /* ── model ───────────────────────────────────────────────────────────── */

  function buildModel() {
    var i, r, c;
    for (r = 0; r < N; r++) {
      for (c = 0; c < N; c++) {
        i = r * N + c;
        var ch = (P.grid[r] || "")[c] || "#";
        sol[i] = ch === "#" ? "" : ch;
        num[i] = 0;
        letters[i] = "";
        entryAt[i] = { a: -1, d: -1 };
      }
    }
    [["across", P.across], ["down", P.down]].forEach(function (pair) {
      var d = pair[0];
      (pair[1] || []).forEach(function (raw) {
        var e = {
          dir: d, n: raw.n, r: raw.r, c: raw.c, len: raw.len,
          ans: String(raw.ans || "").toUpperCase(), clue: raw.clue || "",
          cells: [], has: {},
        };
        for (var k = 0; k < e.len; k++) {
          var rr = d === "across" ? e.r : e.r + k;
          var cc = d === "across" ? e.c + k : e.c;
          var ix = rr * N + cc;
          e.cells.push(ix);
          e.has[ix] = 1;
          entryAt[ix][d === "across" ? "a" : "d"] = entries.length;
        }
        num[e.cells[0]] = e.n;
        entries.push(e);
      });
    });
    cur = firstWhite();
  }

  function firstWhite() {
    for (var i = 0; i < N * N; i++) if (sol[i]) return i;
    return 0;
  }

  function themeTitle() {
    if (P.title) return String(P.title);
    var t = P.theme;
    if (!t) return "";
    if (typeof t === "string") return t;
    return String(t.title || t.name || "");
  }

  function themeHint() {
    var t = P.theme;
    if (!t || typeof t === "string") return "";
    return String(t.hint || t.note || t.desc || "");
  }

  /* ── dom ─────────────────────────────────────────────────────────────── */

  function buildDOM() {
    var title = themeTitle();
    if (title) {
      var tb = A.el("div", null,
        "<b>" + A.esc(title.toUpperCase()) + "</b>" +
        "<span>" + A.esc(themeHint() || "the title is a hint") + "</span>");
      tb.id = "midi-title";
      main.appendChild(tb);
    }

    var bar = A.el("div");
    bar.id = "midibar";
    bar.innerHTML =
      '<button class="ac-pill" id="mi-timer" title="pause the clock">0:00</button>' +
      '<span class="ac-pill flat">PAR ' + A.fmtTime(PAR * 1000) + "</span>" +
      '<button class="ac-pill" id="mi-pen" title="pencil mode">PEN</button>' +
      '<button class="ac-pill" id="mi-help">CHECK</button>' +
      '<button class="ac-pill" id="mi-list">CLUES</button>';
    main.appendChild(bar);

    var cols = A.el("div", "midi-cols");
    var left = A.el("div", "midi-main");
    gridWrap = A.el("div");
    gridWrap.id = "gridwrap";
    gridEl = A.el("div");
    gridEl.id = "grid";
    gridWrap.appendChild(gridEl);
    var mask = A.el("div", null, "<b>PAUSED</b><small>tap to carry on</small>");
    mask.id = "pausemask";
    mask.onclick = function () { setPaused(false); };
    gridWrap.appendChild(mask);
    left.appendChild(gridWrap);

    clueBar = A.el("div");
    clueBar.id = "cluebar";
    clueBar.innerHTML = '<button class="nav" id="mi-prev" aria-label="previous clue">‹</button>' +
      '<div class="txt" id="mi-clue"></div>' +
      '<button class="nav" id="mi-next" aria-label="next clue">›</button>';
    left.appendChild(clueBar);
    clueTxt = clueBar.querySelector("#mi-clue");

    var side = A.el("div", "midi-side");
    sideList = A.el("div");
    sideList.id = "clues";
    side.appendChild(sideList);

    cols.appendChild(left);
    cols.appendChild(side);
    main.appendChild(cols);

    for (var i = 0; i < N * N; i++) {
      var d = A.el("div", "cell");
      if (!sol[i]) {
        d.className = "cell blk";
      } else {
        if (num[i]) d.appendChild(A.el("i", "num", String(num[i])));
        d.appendChild(A.el("b", "ch", ""));
        d.setAttribute("role", "button");
        bindCell(d, i);
      }
      gridEl.appendChild(d);
      cellNodes.push(d);
    }
    sizeGrid();

    bar.querySelector("#mi-timer").onclick = function () { setPaused(!paused); };
    pencilPill = bar.querySelector("#mi-pen");
    pencilPill.onclick = togglePencil;
    bar.querySelector("#mi-help").onclick = helpDeskModal;
    bar.querySelector("#mi-list").onclick = clueListModal;
    clueBar.querySelector("#mi-prev").onclick = function () { hopClue(-1); };
    clueBar.querySelector("#mi-next").onclick = function () { hopClue(1); };
    timerPill = bar.querySelector("#mi-timer");

    wireList(sideList);
  }

  /* The footer pill is appended AFTER the keyboard exists, so the clue bar
     stays glued to the top of the keyboard the way the Mini's does. */
  function buildFooter() {
    var extra = A.el("div", "ac-row");
    extra.id = "mi-extra";
    extra.innerHTML = practice
      ? '<a class="ac-pill" href="./">← TODAY\'S MIDI</a>'
      : '<a class="ac-pill" href="?practice=1">RANDOM ONE</a>';
    main.appendChild(extra);
  }

  function bindCell(node, i) {
    node.addEventListener("click", function () { onCellClick(i); });
  }

  function sizeGrid() {
    /* The chrome BELOW the grid that has to stay on screen with it:
       clue bar (12 margin + 70) + keyboard (16 margin + 144) + 8 slack. The
       footer pill is deliberately NOT counted — it is a link, not a control you
       need mid-solve, so it may sit below the fold. Declared in here, not at
       module scope: buildDOM() calls sizeGrid() before a module-scope `var`
       further down the file has run, and an undefined operand would make the
       whole cell size NaN. */
    var BELOW_GRID = 250;

    var avail = Math.min(430, Math.min(window.innerWidth, 620) - 34);
    var cs = A.clamp(Math.floor((avail - (N - 1) * GAP) / N), MIN_CELL, MAX_CELL);

    /* Bound by HEIGHT as well as width. Sized on width alone, a 7×7 grid pushes
       the on-screen keyboard 130px off a 375×667 phone: you cannot type without
       scrolling the board out of sight. Measure the grid's own document offset
       (so the toolbar wrapping to two rows is accounted for) and keep MIN_CELL
       as the floor, so a very short window gets a small grid rather than a
       sliver. On a tall phone this changes nothing.

       Only below the 900px breakpoint, where the clue list sits UNDER the grid
       rather than beside it. Above it the taller clue column decides where the
       keyboard lands, so bounding the grid would shrink it and fix nothing. */
    if (window.innerWidth < 900) {
      var top = gridWrap.getBoundingClientRect().top + (window.scrollY || 0);
      var byHeight = Math.floor((window.innerHeight - top - BELOW_GRID - (N - 1) * GAP) / N);
      if (isFinite(byHeight)) cs = A.clamp(Math.min(cs, byHeight), MIN_CELL, MAX_CELL);
    }

    gridEl.style.gridTemplateColumns = "repeat(" + N + ", " + cs + "px)";
    gridEl.style.setProperty("--cs", cs + "px");
    // Publish the grid's exact width so the clue bar can line up with it to the
    // pixel at every viewport instead of guessing with a percentage.
    main.style.setProperty("--gw", (N * cs + (N - 1) * GAP) + "px");
  }

  /* ── navigation ──────────────────────────────────────────────────────── */

  function curEntry() {
    var at = entryAt[cur];
    if (!at) return null;
    var ix = dir === "across" ? at.a : at.d;
    if (ix < 0) ix = dir === "across" ? at.d : at.a;
    return ix >= 0 ? entries[ix] : null;
  }

  function flip() {
    if (over || paused) return;
    dir = dir === "across" ? "down" : "across";
    paint();
  }

  function onCellClick(i) {
    if (over || paused || !sol[i]) return;
    if (i === cur) dir = dir === "across" ? "down" : "across";
    else cur = i;
    paint();
  }

  function move(dr, dc) {
    if (over || paused) return;
    var want = dc !== 0 ? "across" : "down";
    if (want !== dir) { dir = want; paint(); return; }   // perpendicular arrow flips
    var r = Math.floor(cur / N), c = cur % N;
    for (var s = 1; s <= N; s++) {
      var rr = r + dr * s, cc = c + dc * s;
      if (rr < 0 || cc < 0 || rr >= N || cc >= N) break;
      if (sol[rr * N + cc]) { cur = rr * N + cc; break; }
    }
    paint();
  }

  // Tab order: every ACROSS clue in number order, then every DOWN clue.
  function hopClue(step) {
    if (over || paused) return;
    var e = curEntry();
    var at = entries.indexOf(e);
    if (at < 0) at = 0;
    var next = entries[(at + step + entries.length) % entries.length];
    goTo(next);
  }

  function goTo(e) {
    if (!e) return;
    dir = e.dir;
    cur = firstBlank(e);
    paint();
  }

  function firstBlank(e) {
    for (var i = 0; i < e.cells.length; i++) if (!letters[e.cells[i]]) return e.cells[i];
    return e.cells[0];
  }

  function nextBlankEntry(from) {
    var at = entries.indexOf(from);
    for (var k = 1; k <= entries.length; k++) {
      var e = entries[(at + k + entries.length) % entries.length];
      for (var j = 0; j < e.cells.length; j++) if (!letters[e.cells[j]]) return e;
    }
    return null;
  }

  /* ── typing ──────────────────────────────────────────────────────────── */

  function typeCh(ch) {
    if (over || paused || !sol[cur]) return;
    letters[cur] = ch;
    if (pencilMode) pencil[cur] = 1; else delete pencil[cur];
    delete wrong[cur]; delete sure[cur]; delete shown[cur];
    A.sfx("type");
    advance();
    paint();
    save();
    checkDone();
  }

  function advance() {
    var e = curEntry();
    if (!e) return;
    var k = e.cells.indexOf(cur), j;
    for (j = k + 1; j < e.cells.length; j++) {
      if (!letters[e.cells[j]]) { cur = e.cells[j]; return; }
    }
    for (j = 0; j < k; j++) {
      if (!letters[e.cells[j]]) { cur = e.cells[j]; return; }
    }
    var nx = nextBlankEntry(e);
    if (nx) { dir = nx.dir; cur = firstBlank(nx); return; }
    if (k + 1 < e.cells.length) cur = e.cells[k + 1];
  }

  function backspace() {
    if (over || paused) return;
    if (letters[cur]) {
      letters[cur] = "";
      delete pencil[cur]; delete wrong[cur]; delete sure[cur]; delete shown[cur];
    } else {
      stepBack();
      letters[cur] = "";
      delete pencil[cur]; delete wrong[cur]; delete sure[cur]; delete shown[cur];
    }
    paint();
    save();
  }

  function stepBack() {
    var e = curEntry();
    if (!e) return;
    var k = e.cells.indexOf(cur);
    if (k > 0) { cur = e.cells[k - 1]; return; }
    var at = entries.indexOf(e);
    var prev = entries[(at - 1 + entries.length) % entries.length];
    dir = prev.dir;
    cur = prev.cells[prev.cells.length - 1];
  }

  function onPhysical(ev) {
    if (document.querySelector(".ac-modal.show")) return;
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var k = ev.key;
    if (k === "ArrowLeft") { ev.preventDefault(); move(0, -1); }
    else if (k === "ArrowRight") { ev.preventDefault(); move(0, 1); }
    else if (k === "ArrowUp") { ev.preventDefault(); move(-1, 0); }
    else if (k === "ArrowDown") { ev.preventDefault(); move(1, 0); }
    else if (k === " " || k === "Spacebar") { ev.preventDefault(); flip(); }
    else if (k === "Tab") { ev.preventDefault(); hopClue(ev.shiftKey ? -1 : 1); }
    else if (k === "Delete") { ev.preventDefault(); backspace(); }
  }

  /* ── pencil, pause ───────────────────────────────────────────────────── */

  function togglePencil() {
    pencilMode = !pencilMode;
    pencilPill.classList.toggle("on", pencilMode);
    pencilPill.textContent = pencilMode ? "PENCIL" : "PEN";
    A.toast(pencilMode ? "Pencil: letters go in grey" : "Pen");
  }

  function setPaused(on) {
    if (over) return;
    paused = !!on;
    gridWrap.classList.toggle("paused", paused);
    if (paused) { stopClock(); save(); } else startClock();
    paintClock();
  }

  /* ── the clock ───────────────────────────────────────────────────────── */

  function nowMs() { return elapsed + (running ? Date.now() - since : 0); }

  function startClock() {
    if (over || paused || running) return;
    running = true;
    since = Date.now();
  }

  function stopClock() {
    if (!running) return;
    elapsed += Date.now() - since;
    running = false;
  }

  function paintClock() {
    if (!timerPill) return;
    timerPill.textContent = A.fmtTime(nowMs()) + (paused ? " · PAUSED" : "");
    if (!over && !paused && running && nowMs() - (paintClock._saved || 0) > 10000) {
      paintClock._saved = nowMs();
      save();
    }
  }

  function onVisibility() {
    if (document.hidden) { stopClock(); save(); }
    else if (!paused && !over) startClock();
  }

  /* ── check / reveal — the streak-killers ─────────────────────────────── */

  function helpDeskModal() {
    if (over) return;
    var assisted = usedCheck || usedReveal;
    var h = '<p class="tiny" style="color:var(--gold)">' + (assisted
      ? "You've already used help on this one — it's a <b>blue star</b>: solved, scored, but it " +
        "won't extend your streak."
      : "The real Midi resets your streak the moment you check or reveal <b>one square</b>. " +
        "So does this one. You keep the solve and you keep a score, capped at " + ASSIST_CAP +
        ", but it won't count as a win.") + "</p>" +
      '<h3 class="mi-h">CHECK — marks what\'s wrong</h3>' +
      '<div class="ac-row"><button class="ac-btn ghost sm" data-a="c1">SQUARE</button>' +
      '<button class="ac-btn ghost sm" data-a="cw">WORD</button>' +
      '<button class="ac-btn ghost sm" data-a="cp">PUZZLE</button></div>' +
      '<h3 class="mi-h">REVEAL — fills in the answer</h3>' +
      '<div class="ac-row"><button class="ac-btn ghost sm" data-a="r1">SQUARE</button>' +
      '<button class="ac-btn ghost sm" data-a="rw">WORD</button>' +
      '<button class="ac-btn ghost sm" data-a="rp">PUZZLE</button></div>' +
      '<h3 class="mi-h">FREE</h3>' +
      '<div class="ac-row"><button class="ac-btn ghost sm" data-a="x">CLEAR GRID</button></div>' +
      '<p class="tiny dim center" style="margin-top:10px">Clearing costs nothing — but the clock ' +
      "keeps running, so it isn't a way back to a better time.</p>";
    var m = A.modal("STUCK?", h);
    m.body.addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("[data-a]") : null;
      if (!b) return;
      var a = b.getAttribute("data-a");
      m.close();
      if (a === "x") return clearGrid();
      var isCheck = a.charAt(0) === "c";
      var scope = a.charAt(1) === "1" ? "square" : a.charAt(1) === "w" ? "word" : "puzzle";
      confirmAssist(function () { isCheck ? doCheck(scope) : doReveal(scope); });
    });
  }

  function confirmAssist(fn) {
    if (usedCheck || usedReveal) return fn();
    var m = A.modal("THAT ENDS THE STREAK",
      '<p>Checking or revealing anything on a Midi resets the streak — that\'s the real rule, ' +
      "and we kept it.</p><p class=\"tiny muted\">You'll still finish, you'll still be scored " +
      "(capped at " + ASSIST_CAP + "), and it'll show as <b>solved with help</b> on the sheet. " +
      "It just won't count as a win.</p>" +
      '<div class="ac-row" style="margin-top:14px">' +
      '<button class="ac-btn" id="mi-yes">DO IT</button>' +
      '<button class="ac-btn ghost" id="mi-no">NO, I\'VE GOT THIS</button></div>');
    m.body.querySelector("#mi-yes").onclick = function () { m.close(); fn(); };
    m.body.querySelector("#mi-no").onclick = function () { m.close(); };
  }

  function scopeCells(scope) {
    if (scope === "square") return [cur];
    if (scope === "word") { var e = curEntry(); return e ? e.cells.slice() : [cur]; }
    var all = [];
    for (var i = 0; i < N * N; i++) if (sol[i]) all.push(i);
    return all;
  }

  function doCheck(scope) {
    if (over) return;
    usedCheck = true;
    var cells = scopeCells(scope), bad = 0, good = 0;
    cells.forEach(function (i) {
      if (!letters[i]) return;
      if (letters[i] === sol[i]) { sure[i] = 1; delete wrong[i]; good++; }
      else { wrong[i] = 1; delete sure[i]; bad++; }
    });
    A.sfx(bad ? "bad" : "ok");
    A.toast(bad ? bad + " wrong " + (bad === 1 ? "letter" : "letters") + " marked"
      : good ? "All correct so far" : "Nothing filled in to check");
    paint();
    save();
  }

  function doReveal(scope) {
    if (over) return;
    usedReveal = true;
    var cells = scopeCells(scope), n = 0;
    cells.forEach(function (i) {
      if (letters[i] === sol[i]) return;
      letters[i] = sol[i];
      shown[i] = 1;
      delete wrong[i]; delete sure[i]; delete pencil[i];
      n++;
    });
    A.sfx("reveal");
    if (n) A.toast(n + " square" + (n === 1 ? "" : "s") + " revealed");
    paint();
    save();
    checkDone();
  }

  function clearGrid() {
    if (over) return;
    for (var i = 0; i < N * N; i++) {
      if (!sol[i]) continue;
      letters[i] = "";
      delete pencil[i]; delete wrong[i]; delete sure[i]; delete shown[i];
    }
    cur = firstWhite();
    dir = "across";
    A.toast("Grid cleared — clock still running");
    paint();
    save();
  }

  /* ── painting ────────────────────────────────────────────────────────── */

  function paint() {
    var e = curEntry();
    for (var i = 0; i < N * N; i++) {
      var node = cellNodes[i];
      if (!sol[i]) continue;
      var cls = "cell";
      if (i === cur && !over) cls += " cur";
      else if (e && e.has[i] && !over) cls += " inword";
      if (pencil[i]) cls += " pencil";
      if (sure[i]) cls += " sure";
      if (shown[i]) cls += " shown";
      if (wrong[i]) cls += " wrong";
      node.className = cls;
      var ch = node.querySelector(".ch");
      if (ch && ch.textContent !== letters[i]) ch.textContent = letters[i];
    }
    if (e) {
      clueTxt.innerHTML = "<b>" + e.n + "-" + e.dir.toUpperCase() + "</b>" + A.esc(e.clue);
    }
    renderList(sideList);
  }

  function listHTML() {
    var active = curEntry();
    var h = "";
    ["across", "down"].forEach(function (d) {
      h += '<div class="cl-col"><h3>' + (d === "across" ? "ACROSS" : "DOWN") + "</h3>";
      entries.forEach(function (e, i) {
        if (e.dir !== d) return;
        var full = true;
        for (var k = 0; k < e.cells.length; k++) if (!letters[e.cells[k]]) { full = false; break; }
        h += '<div class="clue' + (e === active ? " on" : "") + (full ? " done" : "") +
          '" data-e="' + i + '"><b>' + e.n + "</b><span>" + A.esc(e.clue) + "</span></div>";
      });
      h += "</div>";
    });
    return h;
  }

  function renderList(host) {
    if (!host) return;
    host.innerHTML = listHTML();
  }

  function wireList(host) {
    host.addEventListener("click", function (ev) {
      var t = ev.target;
      while (t && t !== host && !t.getAttribute("data-e")) t = t.parentNode;
      if (!t || t === host) return;
      goTo(entries[+t.getAttribute("data-e")]);
    });
  }

  function clueListModal() {
    var m = A.modal("ALL CLUES", '<div id="mi-modal-clues">' + listHTML() + "</div>");
    var host = m.body.querySelector("#mi-modal-clues");
    host.addEventListener("click", function (ev) {
      var t = ev.target;
      while (t && t !== host && !t.getAttribute("data-e")) t = t.parentNode;
      if (!t || t === host) return;
      m.close();
      goTo(entries[+t.getAttribute("data-e")]);
    });
  }

  /* ── persistence ─────────────────────────────────────────────────────── */

  function encode() {
    var out = "";
    for (var i = 0; i < N * N; i++) out += !sol[i] ? "#" : (letters[i] || ".");
    return out;
  }

  function keysOf(o) { return Object.keys(o).map(Number); }

  function save() {
    if (practice || over) return;
    A.save(ID, day, {
      pid: P.id,
      cells: encode(),
      pencil: keysOf(pencil), shown: keysOf(shown), sure: keysOf(sure), wrong: keysOf(wrong),
      usedCheck: usedCheck, usedReveal: usedReveal,
      ms: nowMs(), cur: cur, dir: dir,
    });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st && st.pid && st.pid !== P.id) st = null;    // the data changed under us
    if (st) {
      var s = String(st.cells || "");
      for (var i = 0; i < N * N; i++) {
        var ch = s.charAt(i);
        if (sol[i] && ch && ch !== "." && ch !== "#") letters[i] = ch;
      }
      (st.pencil || []).forEach(function (i) { pencil[i] = 1; });
      (st.shown || []).forEach(function (i) { shown[i] = 1; });
      (st.sure || []).forEach(function (i) { sure[i] = 1; });
      (st.wrong || []).forEach(function (i) { wrong[i] = 1; });
      usedCheck = !!st.usedCheck;
      usedReveal = !!st.usedReveal;
      elapsed = st.ms || 0;
      if (typeof st.cur === "number" && sol[st.cur]) cur = st.cur;
      if (st.dir === "down" || st.dir === "across") dir = st.dir;
      lastNorm = st.norm || 0;
    }
    paint();
    paintClock();

    if (st && st.done) {
      over = true;
      if (kbd) kbd.disable(true);
      gridWrap.classList.add("done");
      paint();                        // repaint with over=true: drop the cursor highlight
      setTimeout(function () {
        sheet(!!st.won, st.norm || 0, st.shareGrid || [], st.durationMs || elapsed);
      }, 240);
      return;
    }
    startClock();
  }

  /* ── ending ──────────────────────────────────────────────────────────── */

  function isSolved() {
    for (var i = 0; i < N * N; i++) if (sol[i] && letters[i] !== sol[i]) return false;
    return true;
  }

  function checkDone() {
    if (over || !isSolved()) return;
    finishUp();
  }

  function finishUp() {
    over = true;
    stopClock();
    if (kbd) kbd.disable(true);
    gridWrap.classList.remove("paused");
    gridWrap.classList.add("done");
    paint();

    var ms = Math.max(1000, elapsed);
    var secs = Math.max(1, Math.round(ms / 1000));
    var assisted = usedCheck || usedReveal;
    var base = A.clamp(Math.round(100 * PAR / secs), 0, 100);
    var norm = assisted ? Math.min(ASSIST_CAP, base) : base;
    lastNorm = norm;

    var cb = A.settings().colourblind;
    var grid = [];
    for (var r = 0; r < N; r++) {
      var row = "";
      for (var c = 0; c < N; c++) {
        var i = r * N + c;
        row += !sol[i] ? BLOCK_SQ : shown[i] ? (cb ? CB_HELP : HELP_SQ) : (cb ? CB_OK : OK_SQ);
      }
      grid.push(row);
    }
    var nShown = Object.keys(shown).length;
    if (nShown) grid.push("💡 " + nShown + " revealed");
    if (usedCheck) grid.push("🔍 checked");

    var detail = A.fmtTime(ms) + (assisted ? " ✚" : "");

    if (!practice) {
      A.finish(ID, day, {
        score: norm, norm: norm, won: !assisted, detail: detail,
        bucket: Math.min(12, Math.floor(secs / 60)),
        shareGrid: grid, durationMs: ms,
      });
    }

    if (assisted) { A.sfx("ok"); }
    else { A.sfx("win"); A.confetti(base >= 90 ? 150 : 90); }

    sheet(!assisted, norm, grid, ms);
  }

  function sheet(won, norm, grid, ms) {
    var assisted = usedCheck || usedReveal;
    var title = themeTitle();
    var extra = "";
    if (title) {
      extra += '<p class="center mi-theme">' + A.esc(title.toUpperCase()) + "</p>";
    }
    extra += '<p class="center tiny muted mi-time">YOUR TIME <b>' +
      A.fmtTime(ms) + "</b> · par " + A.fmtTime(PAR * 1000) + " · " +
      (ms <= PAR * 1000 ? "under par" : "over par by " + A.fmtTime(ms - PAR * 1000)) + "</p>";

    extra += assisted
      ? '<p class="mi-star blue">☆ BLUE STAR — you used ' +
        (usedReveal && usedCheck ? "check and reveal" : usedReveal ? "reveal" : "check") +
        ", so this counts as <b>solved with help</b>: it's played and scored (capped at " +
        ASSIST_CAP + "), but it does <b>not</b> extend your streak. Same rule as the real Midi.</p>"
      : '<p class="mi-star gold">★ GOLD STAR — solved clean, no checks, no reveals. ' +
        "The streak stands.</p>";

    A.results(ID, practice ? A.PRACTICE : day, {
      title: assisted ? "SOLVED, WITH HELP"
        : ms <= PAR * 750 ? "FLYING"
          : ms <= PAR * 1000 ? "UNDER PAR" : "SOLVED",
      extraHTML: extra,
      state: { norm: norm, shareGrid: grid, won: won },
      shareText: "MIDI (random) " + A.fmtTime(ms) + "\n" + (grid || []).join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  /* ── debug hook: enough to play the whole thing headlessly ───────────── */

  function findEntry(d, n) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].dir === d && entries[i].n === +n) return entries[i];
    }
    return null;
  }

  function fillEntry(e) {
    if (!e) return null;
    e.cells.forEach(function (ix, k) {
      if (over) return;
      cur = ix; dir = e.dir;
      typeCh(e.ans.charAt(k));
    });
    return e.ans;
  }

  window.__MD = {
    puzzle: function () {
      return {
        id: P.id, size: N, par: PAR, title: themeTitle(), day: day, practice: practice,
        across: P.across.map(function (e) { return e.n + ": " + e.clue + " (" + e.len + ")"; }),
        down: P.down.map(function (e) { return e.n + ": " + e.clue + " (" + e.len + ")"; }),
      };
    },
    state: function () {
      var blanks = 0;
      for (var i = 0; i < N * N; i++) if (sol[i] && !letters[i]) blanks++;
      return {
        cur: [Math.floor(cur / N), cur % N], dir: dir, ms: nowMs(), paused: paused,
        blanks: blanks, solved: isSolved(), over: over, norm: lastNorm,
        usedCheck: usedCheck, usedReveal: usedReveal, pencil: pencilMode,
      };
    },
    grid: function () {
      var out = [];
      for (var r = 0; r < N; r++) {
        var row = "";
        for (var c = 0; c < N; c++) row += sol[r * N + c] ? (letters[r * N + c] || "·") : "#";
        out.push(row);
      }
      return out;
    },
    click: function (r, c) { onCellClick(r * N + c); return this.state(); },
    type: function (s) {
      String(s).toUpperCase().split("").forEach(function (ch) {
        if (/[A-Z]/.test(ch)) typeCh(ch);
        else if (ch === " ") flip();
      });
      return this.state();
    },
    back: function () { backspace(); return this.state(); },
    flip: function () { flip(); return dir; },
    tab: function (backwards) { hopClue(backwards ? -1 : 1); return this.state(); },
    arrow: function (k) {
      var m = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] }[String(k)];
      if (m) move(m[0], m[1]);
      return this.state();
    },
    go: function (d, n) { goTo(findEntry(d, n)); return this.state(); },
    fill: function (d, n) { return fillEntry(findEntry(d, n)); },
    solve: function () {
      entries.forEach(function (e) { if (!over) fillEntry(e); });
      return this.state();
    },
    check: function (scope) { doCheck(scope || "puzzle"); return this.state(); },
    reveal: function (scope) { doReveal(scope || "puzzle"); return this.state(); },
    clear: function () { clearGrid(); return this.state(); },
    pause: function (on) { setPaused(on === undefined ? !paused : !!on); return this.state(); },
    pencilMode: function (on) { if (!!on !== pencilMode) togglePencil(); return pencilMode; },
    setElapsed: function (ms) { elapsed = +ms || 0; if (running) since = Date.now(); paintClock(); return nowMs(); },
    entries: function () {
      return entries.map(function (e) { return e.n + "-" + e.dir + " " + e.ans; });
    },
  };
})();
