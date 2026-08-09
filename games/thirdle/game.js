/* ============================================================================
   THIRDLE — three five-letter words, chained at shared letters, six tries.

   The real thirdle.org, not the 3-letter reskin that aggregators confuse it
   with. Verified mechanics:
     · three 5-letter words; word 1 crosses word 2, word 2 crosses word 3
       (a chain, not a three-way star) → 15 slots, 13 distinct cells
     · the two crossing letters are revealed at the start and are immutable
     · every attempt submits all three words at once and burns one of six tries
     · FOUR tile states, and the fourth is the whole game:
         GREEN     right letter, right place, right word
         YELLOW    in this word, wrong place
         PURPLE    not in this word — but it IS in one of the other two
         BLACK     nowhere, or you've already found every copy of it
   The purple state is what makes you reason across words instead of within one.

   NORM: solved in 1..6 → 100, 95, 85, 72, 58, 45; lost → 12.
   ========================================================================== */
(function () {
  "use strict";

  var ID = "thirdle", LEN = 5, TRIES = 6;
  var NORM = [0, 100, 95, 85, 72, 58, 45];

  var W = window.AD_WORDS || {};
  var ANS = (W.answers5 || []).map(up);
  var VALID = {};
  (W.valid5 || []).forEach(function (w) { VALID[up(w)] = 1; });
  ANS.forEach(function (w) { VALID[w] = 1; });
  function up(s) { return String(s).toUpperCase(); }

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var P = null;                 // the puzzle: {w:[3 words], cross:[{...},{...}], cells, cols, rows}
  var cur = [], guesses = [], over = false, won = false, t0 = Date.now();
  // Declared here, not beside paintKeys: paint() runs at boot and `var`
  // initialisers do not hoist, so a later declaration is still undefined.
  var RANK = { ok: 4, near: 3, elsewhere: 2, miss: 1 };
  var focus = 0;                // index into the free (unlocked) slots
  var justTyped = false;        // last input wrote a letter (see back())
  var gridEl, kbd, keyState = {}, triesEl;
  // The grid is built ONCE and then repainted in place. Rebuilding it per
  // keystroke re-ran core's `pop` keyframe on all thirteen squares at once, so
  // the whole board flinched every time she pressed a key.
  var cellEls = null, gridCols = 0, gridSize = 0;

  /* ── puzzle construction ──────────────────────────────────────────────
     Lay it out as a real little crossword: word 2 runs DOWN, words 1 and 3
     run ACROSS through it at two different rows. */

  // Same word, or one letter off it in the same places (SCARE/SCARF).
  function alike(x, y) {
    var same = 0;
    for (var i = 0; i < LEN; i++) if (x[i] === y[i]) same++;
    return same >= LEN - 1;
  }

  function buildPuzzle(rand) {
    // letter+position index so we can find crossing words instantly
    var byLP = {};
    ANS.forEach(function (w) {
      for (var i = 0; i < LEN; i++) {
        var k = w[i] + i;
        (byLP[k] || (byLP[k] = [])).push(w);
      }
    });

    for (var attempt = 0; attempt < 4000; attempt++) {
      var w2 = A.pick(rand, ANS);
      var a = Math.floor(rand() * LEN), b = Math.floor(rand() * LEN);
      var p = Math.floor(rand() * LEN), q = Math.floor(rand() * LEN);
      // THE SHAPE HAS TO READ AS THREE WORDS. Rejecting only a === b let the
      // two across words land on touching rows; rejecting only touching rows
      // still allowed two rows apart with the same column offset, which draws
      // a solid five-wide slab with a single square between — it looks like a
      // two-word puzzle, which is exactly what she reported. So: never
      // touching, and when they are only two rows apart they must be at least
      // three columns offset, so the shape is a staircase and not a block.
      var dRow = Math.abs(a - b), dCol = Math.abs(p - q);
      if (dRow < 2 || (dRow === 2 && dCol < 3)) continue;
      var c1 = byLP[w2[a] + p], c3 = byLP[w2[b] + q];
      if (!c1 || !c3) continue;
      var w1 = A.pick(rand, c1), w3 = A.pick(rand, c3);
      // …and as three DIFFERENT words. SCARE/SCARF or DAISY/DAILY in one
      // puzzle reads as a typo, or as a word list too thin to fill a grid.
      if (alike(w1, w2) || alike(w2, w3) || alike(w1, w3)) continue;

      // WORD ORDER FOLLOWS THE BOARD. `a` and `b` are independent, so on about
      // half of all days the first word was the LOWER of the two across words:
      // you pressed a key at the start of your turn and the letter appeared at
      // the bottom of the grid, then the cursor jumped up to the down word.
      // Normalising here makes typing order = reading order everywhere, and
      // makes the answers on the result sheet list top, down, bottom.
      if (a > b) {
        var sw = w1; w1 = w3; w3 = sw;
        var sa = a; a = b; b = sa;
        var sp = p; p = q; q = sp;
      }

      // geometry: w2 down at column C, rows 0..4; w1 across at row a; w3 at row b
      var C = Math.max(p, q);
      var cells = {}, minC = C, maxC = C;
      function put(r, c, wi, idx) {
        var key = r + "," + c;
        if (!cells[key]) cells[key] = { r: r, c: c, slots: [] };
        cells[key].slots.push({ w: wi, i: idx });
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
      for (var i = 0; i < LEN; i++) put(i, C, 1, i);
      for (var j = 0; j < LEN; j++) put(a, C - p + j, 0, j);
      for (var k = 0; k < LEN; k++) put(b, C - q + k, 2, k);

      // reject if w1 and w3 overlap each other anywhere (they must only meet w2)
      var bad = false;
      Object.keys(cells).forEach(function (key) {
        var ws = {};
        cells[key].slots.forEach(function (s) { ws[s.w] = 1; });
        if (ws[0] && ws[2]) bad = true;
        if (cells[key].slots.length > 2) bad = true;
      });
      if (bad) continue;

      return {
        w: [w1, w2, w3],
        cells: cells, minC: minC, maxC: maxC,
        cross: [{ w: 0, i: p, w2i: a }, { w: 2, i: q, w2i: b }],
      };
    }
    return null;
  }

  /* ── boot ────────────────────────────────────────────────────────────── */

  var main = A.mount({
    id: ID, dayN: day,
    help: "<p>Three five-letter words, joined where they share a letter. Every guess must be " +
      "<b>three real words at once</b>, and you only get six.</p>" +
      "<ul><li><b style='color:var(--ok)'>Green</b> — right letter, right place, right word.</li>" +
      "<li><b style='color:var(--near)'>Yellow</b> — in this word, wrong place.</li>" +
      "<li><b style='color:var(--purple)'>Purple</b> — not in this word, but it <i>is</i> in one of " +
      "the other two. This is the one that wins you the puzzle.</li>" +
      "<li>Grey — nowhere, or you've already found every copy of it.</li></ul>" +
      "<p>The two crossing letters are given to you and can't be changed. Your attempt stays on " +
      "the board — <b>tap any square</b> to move there and edit it into your next guess.</p>" +
      "<p>Typing fills the words in order — the top word across, then the word running down, " +
      "then the bottom word across — and the squares of the word you're in are shaded so you " +
      "can see where you are.</p>" +
      "<p>Delete works the way you'd expect either way: straight after typing, it takes back the " +
      "letter you just typed; after tapping a square, it empties that square. <b>CLEAR</b> wipes " +
      "the lot and starts you at the first square.</p>",
  });

  if (ANS.length < 200) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">Word list hasn\'t loaded yet.</p>';
    return;
  }

  P = buildPuzzle(practice ? A.rng(String(Date.now()) + Math.random()) : A.rngFor(ID, day));
  if (!P) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">Couldn\'t build today\'s puzzle.</p>';
    return;
  }

  // Which of the 15 slots are locked (the two crossings), and the free order.
  var locked = {};
  P.cross.forEach(function (x) {
    locked[x.w * LEN + x.i] = 1;
    locked[1 * LEN + x.w2i] = 1;
  });
  var freeSlots = [];
  for (var s = 0; s < LEN * 3; s++) if (!locked[s]) freeSlots.push(s);

  cur = new Array(LEN * 3).fill("");
  Object.keys(locked).forEach(function (s) {
    s = +s; cur[s] = P.w[Math.floor(s / LEN)][s % LEN];
  });

  gridEl = A.el("div"); gridEl.id = "grid"; main.appendChild(gridEl);
  triesEl = A.el("div", "tries"); main.appendChild(triesEl);

  // The swatches are classed, not inline-styled, so they resolve to the very
  // same tokens the tiles use. Inline hexes had drifted off the palette and the
  // key was describing colours the board no longer painted.
  var key = A.el("div", "key");
  key.innerHTML = "<span><i class='k-ok'></i>RIGHT SPOT</span>" +
    "<span><i class='k-near'></i>WRONG SPOT</span>" +
    "<span><i class='k-else'></i>ANOTHER WORD</span>" +
    "<span><i class='k-miss'></i>NOWHERE</span>";
  main.appendChild(key);

  var row = A.el("div", "ac-row th-modes");
  row.innerHTML = '<button class="ac-pill" id="th-clear" type="button">CLEAR</button>' +
    (practice ? '<a class="ac-pill" href="./">TODAY\'S THREE</a>'
      : '<a class="ac-pill" href="?practice=1">PRACTICE</a>');
  main.appendChild(row);
  row.querySelector("#th-clear").onclick = clearAll;

  kbd = A.keyboard({ onKey: type, onEnter: submit, onBack: back, host: main });

  // The two given letters are known from the first second, so the keyboard
  // says so — the original does the same, and a key that stays blank while its
  // letter sits on the board looks like the keyboard has lost track.
  P.cross.forEach(function (x) { keyState[P.w[x.w][x.i]] = "ok"; });

  restore();

  /* ── input ───────────────────────────────────────────────────────────── */

  function type(ch) {
    if (over) return;
    if (focus >= freeSlots.length) return;
    cur[freeSlots[focus]] = ch;
    focus++;
    justTyped = true;
    A.sfx("type");
    paint();
  }

  function wipe(f) {
    if (f < 0 || f >= freeSlots.length) return false;
    if (!cur[freeSlots[f]]) return false;
    cur[freeSlots[f]] = "";
    return true;
  }

  /* DELETING. The board keeps the last attempt, so the square the cursor
     lands on after you type is usually NOT empty — which means "is the next
     square empty?" cannot tell us what the player meant, and using it is what
     made deleting feel broken. Both earlier rules had a bad half:

       always step back first  → tap a square, hit delete, and it ate the
                                 letter BEFORE the one you tapped.
       always clear in place   → type a letter, hit delete, and it ate the
                                 stale letter AHEAD of it while your own
                                 letter sat there needing a second press.

     What actually disambiguates them is what the player did last. After
     TYPING, backspace undoes that letter. After TAPPING (or after a
     submission, or a reload), backspace clears the square you are looking at
     and leaves the cursor on it, ready to retype. */
  function back() {
    if (over) return;
    if (!justTyped && focus < freeSlots.length && cur[freeSlots[focus]]) {
      wipe(focus);
      A.sfx("tick");
      paint();
      return;
    }
    if (focus <= 0) {
      // Nothing to the left; clear where we stand if anything is there.
      if (wipe(focus)) { A.sfx("tick"); paint(); }
      return;
    }
    focus--;
    wipe(focus);
    justTyped = false;
    A.sfx("tick");
    paint();
  }

  // The way out of a full board: backspace walks left and stops at the first
  // square, so with the last attempt still sitting there you could otherwise
  // be left picking letters off one tap at a time.
  function clearAll() {
    if (over) return;
    if (!freeSlots.some(function (s) { return cur[s]; })) return;
    freeSlots.forEach(function (s) { cur[s] = ""; });
    focus = 0;
    justTyped = false;
    A.sfx("bad");
    paint();
  }

  function words() {
    return [0, 1, 2].map(function (w) { return cur.slice(w * LEN, w * LEN + LEN).join(""); });
  }

  function submit() {
    if (over) return;
    var ws = words();
    for (var i = 0; i < 3; i++) {
      if (!/^[A-Z]{5}$/.test(ws[i])) return nope("Fill all three words");
      if (!VALID[ws[i]]) return nope('"' + ws[i] + '" isn\'t a word');
    }
    // The last attempt is still sitting on the board, so ENTER twice is one
    // slip of the thumb — and it would burn a try on three words you have
    // already had the answer to. It can never be worth anything, so refuse it.
    var line = ws.join(" ");
    if (guesses.some(function (g) { return g.join(" ") === line; })) {
      return nope("Same three words — change one");
    }
    guesses.push(ws.slice());
    var st = states(ws);
    paintKeys(ws, st);
    var didWin = ws[0] === P.w[0] && ws[1] === P.w[1] && ws[2] === P.w[2];
    // There is only one board, so the attempt STAYS on it, coloured, and you
    // edit it into your next attempt. A square keeps its colour for exactly as
    // long as it still holds the letter that was scored there — colours belong
    // to letters, not to squares, and not to "has this square been touched".
    focus = 0;
    justTyped = false;
    paint();
    save();
    if (didWin) { A.sfx("win"); end(true); }
    else if (guesses.length >= TRIES) { A.sfx("lose"); end(false); }
    else {
      var greens = st.reduce(function (n, r) { return n + r.filter(function (x) { return x === "ok"; }).length; }, 0);
      A.sfx(greens > 6 ? "ok" : "near");
    }
  }

  function nope(msg) {
    A.toast(msg, true); A.sfx("bad");
    gridEl.classList.add("ac-shake");
    setTimeout(function () { gridEl.classList.remove("ac-shake"); }, 420);
  }

  /* ── scoring ─────────────────────────────────────────────────────────── */

  // Wordle's two-pass rule inside each word, then the cross-word purple pass.
  function states(ws) {
    var out = [];
    for (var w = 0; w < 3; w++) {
      var g = ws[w], ans = P.w[w];
      var res = new Array(LEN).fill("miss"), pool = {};
      for (var i = 0; i < LEN; i++) {
        if (g[i] === ans[i]) res[i] = "ok";
        else pool[ans[i]] = (pool[ans[i]] || 0) + 1;
      }
      for (var j = 0; j < LEN; j++) {
        if (res[j] === "ok") continue;
        if (pool[g[j]] > 0) { res[j] = "near"; pool[g[j]]--; }
      }
      out.push(res);
    }
    // purple: black here, but the letter lives in one of the other two answers
    for (var w2 = 0; w2 < 3; w2++) {
      var others = P.w.filter(function (_, k) { return k !== w2; }).join("");
      for (var k2 = 0; k2 < LEN; k2++) {
        if (out[w2][k2] === "miss" && others.indexOf(ws[w2][k2]) >= 0) out[w2][k2] = "elsewhere";
      }
    }
    return out;
  }

  function paintKeys(ws, st) {
    for (var w = 0; w < 3; w++) {
      for (var i = 0; i < LEN; i++) {
        var ch = ws[w][i], s = st[w][i];
        if (!keyState[ch] || RANK[s] > RANK[keyState[ch]]) keyState[ch] = s;
      }
    }
    kbd.paint(keyState);
  }

  /* ── rendering ───────────────────────────────────────────────────────── */

  /* Two halves, deliberately:

       layout()  builds the thirteen squares, ONCE, and again only if the
                 window resize actually changes the tile size.
       paint()   writes text and classes onto the squares that already exist.

     It used to be one function that did `gridEl.innerHTML = ""` and rebuilt
     every square on every keystroke. Fresh nodes carrying `.filled` re-run
     core's `pop` keyframe, so the entire board jumped 7% larger and back on
     every single key press — and every tap handler was thrown away and rebuilt
     underneath the finger that had just tapped it. */

  function tileSize(cols) {
    // Bounded by the width AND by the height left once the tries bar, the key,
    // the mode pill and the on-screen keyboard have taken theirs — otherwise a
    // 667px phone loses the bottom keyboard row below the fold.
    var byW = Math.floor((Math.min(360, (window.innerWidth || 375) - 40)) / cols) - 4;
    var byH = Math.floor(((window.innerHeight || 667) - 400) / LEN);
    return Math.max(22, Math.min(46, byW, byH));
  }

  function layout() {
    var cols = P.maxC - P.minC + 1, size = tileSize(cols);
    if (cellEls && cols === gridCols && size === gridSize) return;
    gridCols = cols; gridSize = size;
    gridEl.style.gridTemplateColumns = "repeat(" + cols + ", " + size + "px)";
    gridEl.style.setProperty("--cs", size + "px");
    gridEl.innerHTML = "";
    cellEls = [];
    for (var r = 0; r < LEN; r++) {
      for (var c = P.minC; c <= P.maxC; c++) {
        var cell = P.cells[r + "," + c];
        var d = A.el("div", "cell");
        gridEl.appendChild(d);
        if (!cell) { d.className = "cell gap"; cellEls.push(null); continue; }
        var slot = cell.slots[0];
        var idx = slot.w * LEN + slot.i;
        d.className = "ac-tile cell" + (locked[idx] ? " lock" : "");
        bindCell(d, idx);
        cellEls.push({ el: d, cell: cell, idx: idx, w: slot.w, i: slot.i, cls: d.className, txt: "" });
      }
    }
  }

  /* Tap a square to type there. The board persists between attempts, so
     without this the only way to change the 8th letter was to retype the seven
     before it. Bound once, and it reads `over`/`locked` when it FIRES, so it
     stays correct for the life of the square. */
  function bindCell(d, idx) {
    d.onclick = function () {
      if (over) return;
      if (locked[idx]) {
        // Tapping a given letter did nothing at all, which reads as a dead
        // square. Say why instead.
        A.toast("The crossing letters are given");
        return;
      }
      var f = freeSlots.indexOf(idx);
      if (f < 0) return;
      focus = f;
      // The cursor is now sitting ON a square the player chose, not after a
      // letter they typed — which is what tells back() to clear this square
      // rather than the one before it.
      justTyped = false;
      A.sfx("tick");
      paint();
    };
  }

  function cellHasWord(cell, w) {
    for (var i = 0; i < cell.slots.length; i++) if (cell.slots[i].w === w) return true;
    return false;
  }

  function paint() {
    if (!cellEls) layout();

    // latest feedback, if any
    var last = guesses.length ? states(guesses[guesses.length - 1]) : null;
    var lastWords = guesses.length ? guesses[guesses.length - 1] : null;
    var curSlot = (!over && focus < freeSlots.length) ? freeSlots[focus] : -1;
    var curWord = curSlot >= 0 ? Math.floor(curSlot / LEN) : -1;
    // A finished board takes no taps, so it must not look like it does.
    if (over !== gridEl.classList.contains("done")) gridEl.classList.toggle("done", over);

    for (var n = 0; n < cellEls.length; n++) {
      var e = cellEls[n];
      if (!e) continue;
      var ch = cur[e.idx] || "";
      var cls = "ac-tile cell";
      if (locked[e.idx]) cls += " lock";
      // A finished grid shows the three answers: green ONLY if you actually
      // won it. Painting a loss all-green read as a win you never had.
      if (over) {
        cls += won ? " ok" : " reveal";
      } else {
        if (ch) cls += " filled";
        // Colour from the most recent submission — kept for exactly as long as
        // the square still holds the letter that was scored there. (The old
        // rule dropped the colour off any square you had touched, so retyping
        // a word identically wiped its feedback.)
        if (last && ch) {
          var best = null;
          for (var k = 0; k < e.cell.slots.length; k++) {
            var sl = e.cell.slots[k], si = sl.w * LEN + sl.i;
            if (lastWords[sl.w][sl.i] !== cur[si]) continue;
            var s2 = last[sl.w][sl.i];
            if (!best || RANK[s2] > RANK[best]) best = s2;
          }
          if (best) cls += " " + best;
        }
        if (curWord >= 0 && cellHasWord(e.cell, curWord)) cls += " inword";
        if (curSlot === e.idx) cls += " cur";
      }
      var txt = over ? P.w[e.w][e.i] : ch;
      // Only touch the DOM when something actually changed: re-assigning the
      // same className is what restarts a CSS animation.
      if (cls !== e.cls) { e.el.className = cls; e.cls = cls; }
      if (txt !== e.txt) { e.el.textContent = txt; e.txt = txt; }
    }

    while (triesEl.children.length < TRIES) triesEl.appendChild(A.el("i"));
    for (var t = 0; t < TRIES; t++) {
      var tc = "";
      if (t < guesses.length) {
        var g = guesses[t];
        tc = (g[0] === P.w[0] && g[1] === P.w[1] && g[2] === P.w[2]) ? "won" : "used";
      }
      if (triesEl.children[t].className !== tc) triesEl.children[t].className = tc;
    }
  }

  function render() { layout(); paint(); }

  /* ── persistence ─────────────────────────────────────────────────────── */

  // `sig` stamps the saved board with the puzzle it belongs to. A restored
  // `cur` is a flat 15-slot array whose meaning depends entirely on which word
  // is which, so if the generator ever lays a day out differently the old array
  // would drop letters into the wrong squares — including the two given ones.
  function sig() { return P.w.join("|"); }

  function save() {
    if (practice) return;
    A.save(ID, day, { guesses: guesses, cur: cur, keyState: keyState, sig: sig() });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st && st.sig && st.sig !== sig()) st = null;   // a different puzzle wrote that
    if (st && st.guesses) {
      guesses = st.guesses;
      // Merged by rank, not overwritten, so the two given letters stay green.
      var saved = st.keyState || {};
      Object.keys(saved).forEach(function (ch) {
        if (!keyState[ch] || RANK[saved[ch]] > RANK[keyState[ch]]) keyState[ch] = saved[ch];
      });
      if (st.cur && st.cur.length === LEN * 3) cur = st.cur;
      // Land on the first empty square — but a board reloaded between attempts
      // is FULL, and parking the cursor past the last square left the keyboard
      // dead: typing did nothing until you happened to press backspace. A full
      // board reopens at the start, exactly as it does after a submission.
      focus = 0;
      for (var f = 0; f < freeSlots.length; f++) {
        if (!cur[freeSlots[f]]) { focus = f; break; }
      }
      justTyped = false;
    }
    kbd.paint(keyState);
    render();
    if (st && st.done) {
      over = true; won = !!st.won; shutInput(); render();
      setTimeout(function () { sheet(won, st.norm, st.shareGrid); }, 240);
    }
  }

  /* ── ending ──────────────────────────────────────────────────────────── */

  // Everything that takes input goes quiet together: the keyboard was already
  // dimmed at the end, but CLEAR stayed live and lit next to a finished board.
  function shutInput() {
    kbd.disable(true);
    var cb = main.querySelector("#th-clear");
    if (cb) { cb.disabled = true; cb.style.opacity = ".45"; }
  }

  function end(w) {
    over = true; won = w; shutInput(); render();
    var n = guesses.length;
    var norm = won ? NORM[n] : 12;

    // High-contrast mode recolours the board blue/orange, so the share card
    // follows it — the same swap WORDISHA makes. Purple is already unlike both.
    var cb = A.settings().colourblind;
    var GLYPH = { ok: cb ? "🟦" : "🟩", near: cb ? "🟧" : "🟨", elsewhere: "🟪", miss: "⬛" };
    var grid = guesses.map(function (g) {
      var st = states(g);
      return st.map(function (r) { return r.map(function (x) { return GLYPH[x]; }).join(""); }).join(" ");
    });

    if (!practice) {
      A.finish(ID, day, {
        score: norm, norm: norm, won: won, detail: won ? n + "/" + TRIES : "X/" + TRIES,
        bucket: won ? n : "X", shareGrid: grid, durationMs: Date.now() - t0,
      });
    }
    if (won) A.confetti(n <= 3 ? 140 : 80);
    sheet(won, norm, grid);
  }

  function shareLine(grid) {
    return "THIRDLE " + (practice ? "(practice)" : "#" + day) +
      "\n" + (grid || []).join("\n") + "\n" + A.SITE;
  }

  function sheet(w, norm, grid) {
    var extra = '<p class="center th-words">' + P.w.map(A.esc).join(" · ") + "</p>";
    var m = A.results(ID, practice ? A.PRACTICE : day, {
      title: w ? (guesses.length <= 3 ? "CROSS-REFERENCED" : "ALL THREE") : "SO CLOSE",
      extraHTML: extra,
      state: { norm: norm, shareGrid: grid, won: w },
      shareText: shareLine(grid),
      onReplay: function () { location.reload(); },
    });
    var sb = m.body.querySelector("#ac-share");
    if (sb) sb.onclick = function () { A.share(practice ? shareLine(grid) : A.shareCard(ID, day)); };
    return m;
  }

  window.addEventListener("resize", function () { clearTimeout(render._t); render._t = setTimeout(render, 140); });

  window.__TH = {
    answer: function () { return P.w; },
    puzzle: function () { return { w: P.w, cross: P.cross, cells: Object.keys(P.cells).length }; },
    // The generator, on the same seed the day itself uses — so a test can scan
    // every future day for a layout that reads badly without loading 400 pages.
    build: function (n) { return buildPuzzle(A.rngFor(ID, n)); },
    guess: function (a, b, c) {
      var ws = [up(a), up(b), up(c)];
      freeSlots.forEach(function (slot) {
        var w = Math.floor(slot / LEN), i = slot % LEN;
        cur[slot] = ws[w][i];
      });
      submit();
    },
    // A copy: handing back the live `guesses` array made an early snapshot keep
    // mutating, so a reading looked like moves had already been played.
    state: function () {
      return {
        guesses: guesses.map(function (g) { return g.slice(); }),
        over: over, won: won, day: day, focus: focus,
      };
    },
  };
})();
