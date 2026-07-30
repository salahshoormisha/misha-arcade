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
  var dirty = {};               // slots retyped since the last submission
  // Declared here, not beside paintKeys: render() runs at boot and `var`
  // initialisers do not hoist, so a later declaration is still undefined.
  var RANK = { ok: 4, near: 3, elsewhere: 2, miss: 1 };
  var focus = 0;                // index into the free (unlocked) slots
  var gridEl, kbd, keyState = {}, triesEl;

  /* ── puzzle construction ──────────────────────────────────────────────
     Lay it out as a real little crossword: word 2 runs DOWN, words 1 and 3
     run ACROSS through it at two different rows. */

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
      // The two ACROSS words must be at least one clear row apart. Merely
      // rejecting a === b let them land on touching rows, which reads as a
      // solid block of letters — it looks like the puzzle is missing a word.
      if (Math.abs(a - b) < 2) continue;
      var p = Math.floor(rand() * LEN), q = Math.floor(rand() * LEN);
      var c1 = byLP[w2[a] + p], c3 = byLP[w2[b] + q];
      if (!c1 || !c3) continue;
      var w1 = A.pick(rand, c1), w3 = A.pick(rand, c3);
      if (w1 === w2 || w3 === w2 || w1 === w3) continue;

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
      "the board — <b>tap any square</b> to move there and edit it into your next guess.</p>",
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
  row.innerHTML = practice ? '<a class="ac-pill" href="./">TODAY\'S THREE</a>'
    : '<a class="ac-pill" href="?practice=1">PRACTICE</a>';
  main.appendChild(row);

  kbd = A.keyboard({ onKey: type, onEnter: submit, onBack: back, host: main });

  restore();

  /* ── input ───────────────────────────────────────────────────────────── */

  function type(ch) {
    if (over) return;
    if (focus >= freeSlots.length) return;
    cur[freeSlots[focus]] = ch;
    dirty[freeSlots[focus]] = 1;
    focus++;
    A.sfx("type");
    render();
  }

  function back() {
    if (over) return;
    // Tapping a square moves the cursor ONTO it, and the board stays full
    // between attempts — so backspace has to mean "clear the square I'm
    // looking at" whenever that square holds a letter. Always stepping back
    // first deleted the letter *before* the one you tapped, which is why
    // deleting felt broken.
    if (focus < freeSlots.length && cur[freeSlots[focus]]) {
      cur[freeSlots[focus]] = "";
      dirty[freeSlots[focus]] = 1;
      render();
      return;
    }
    if (focus <= 0) return;
    focus--;
    cur[freeSlots[focus]] = "";
    dirty[freeSlots[focus]] = 1;
    render();
  }

  function words() {
    return [0, 1, 2].map(function (w) { return cur.slice(w * LEN, w * LEN + LEN).join(""); });
  }

  function submit() {
    if (over) return;
    var ws = words();
    if (ws.some(function (w) { return w.length < LEN || /\s|^$/.test(w) || w.indexOf("") >= 0 && w.length !== LEN; })) {
      return nope("Fill all three words");
    }
    for (var i = 0; i < 3; i++) {
      if (ws[i].length !== LEN || !/^[A-Z]{5}$/.test(ws[i])) return nope("Fill all three words");
      if (!VALID[ws[i]]) return nope('"' + ws[i] + '" isn\'t a word');
    }
    guesses.push(ws.slice());
    var st = states(ws);
    paintKeys(ws, st);
    var didWin = ws[0] === P.w[0] && ws[1] === P.w[1] && ws[2] === P.w[2];
    // There is only one board, so the attempt STAYS on it, coloured, and you
    // edit it into your next attempt. A cell loses its colour the moment you
    // retype it — colours belong to letters, not to squares.
    dirty = {};
    focus = 0;
    render();
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

  function render() {
    var cols = P.maxC - P.minC + 1;
    // Bounded by the width AND by the height left once the tries bar, the key,
    // the mode pill and the on-screen keyboard have taken theirs — otherwise a
    // 667px phone loses the bottom keyboard row below the fold.
    var byW = Math.floor((Math.min(360, innerWidth - 40)) / cols) - 4;
    var byH = Math.floor(((window.innerHeight || 667) - 400) / LEN);
    var size = Math.max(22, Math.min(46, byW, byH));
    gridEl.style.gridTemplateColumns = "repeat(" + cols + ", " + size + "px)";
    gridEl.style.setProperty("--cs", size + "px");
    gridEl.innerHTML = "";

    // latest feedback, if any
    var last = guesses.length ? states(guesses[guesses.length - 1]) : null;
    var lastWords = guesses.length ? guesses[guesses.length - 1] : null;

    for (var r = 0; r < LEN; r++) {
      for (var c = P.minC; c <= P.maxC; c++) {
        var cell = P.cells[r + "," + c];
        var d = A.el("div", "cell");
        if (!cell) { d.className = "cell gap"; gridEl.appendChild(d); continue; }
        var slot = cell.slots[0];
        var idx = slot.w * LEN + slot.i;
        var ch = cur[idx] || "";
        var cls = "ac-tile cell";
        if (locked[idx]) cls += " lock";
        if (ch) cls += " filled";
        // Colour from the most recent submission — but only while the cell
        // still holds the letter that was scored, and only if it isn't empty.
        // A finished grid shows the three answers: green ONLY if you actually
        // won it. Painting a loss all-green read as a win you never had.
        if (over) {
          cls += won ? " ok" : " reveal";
        } else if (last && lastWords && ch && !dirty[idx]) {
          var best = null;
          cell.slots.forEach(function (sl) {
            var si = sl.w * LEN + sl.i;
            if (dirty[si]) return;
            if (lastWords[sl.w][sl.i] !== cur[si]) return;
            var s2 = last[sl.w][sl.i];
            if (!best || RANK[s2] > RANK[best]) best = s2;
          });
          if (best) cls += " " + best;
        }
        if (!over && freeSlots[focus] === idx) cls += " cur";
        d.className = cls;
        d.textContent = over ? P.w[slot.w][slot.i] : ch;
        // Tap a square to type there. The board persists between attempts, so
        // without this the only way to change the 8th letter was to retype the
        // seven before it.
        if (!over && !locked[idx]) {
          d.onclick = (function (i) {
            return function () {
              var f = freeSlots.indexOf(i);
              if (f < 0) return;
              focus = f;
              A.sfx("tick");
              render();
            };
          })(idx);
        }
        gridEl.appendChild(d);
      }
    }

    triesEl.innerHTML = "";
    for (var t = 0; t < TRIES; t++) {
      var i2 = A.el("i");
      if (t < guesses.length) {
        var g = guesses[t];
        i2.className = (g[0] === P.w[0] && g[1] === P.w[1] && g[2] === P.w[2]) ? "won" : "used";
      }
      triesEl.appendChild(i2);
    }
  }

  /* ── persistence ─────────────────────────────────────────────────────── */

  function save() { if (!practice) A.save(ID, day, { guesses: guesses, cur: cur, keyState: keyState }); }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st && st.guesses) {
      guesses = st.guesses;
      keyState = st.keyState || {};
      if (st.cur && st.cur.length === LEN * 3) cur = st.cur;
      focus = 0;
      for (var f = 0; f < freeSlots.length; f++) {
        if (!cur[freeSlots[f]]) { focus = f; break; }
        focus = f + 1;
      }
      kbd.paint(keyState);
    }
    render();
    if (st && st.done) {
      over = true; won = !!st.won; kbd.disable(true); render();
      setTimeout(function () { sheet(won, st.norm, st.shareGrid); }, 240);
    }
  }

  /* ── ending ──────────────────────────────────────────────────────────── */

  function end(w) {
    over = true; won = w; kbd.disable(true); render();
    var n = guesses.length;
    var norm = won ? NORM[n] : 12;

    var GLYPH = { ok: "🟩", near: "🟨", elsewhere: "🟪", miss: "⬛" };
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
