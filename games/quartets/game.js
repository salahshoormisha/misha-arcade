/* ============================================================================
   QUARTETS — the arcade's Connections. Sixteen tiles, four hidden groups.
   ----------------------------------------------------------------------------
   Built on the shape of games/wordish/game.js (the reference implementation):
     requestedDay → dailyIndex → load → save on every move → finish once → results

   Four things the real one doesn't do:
     · every solved group shows its NOTE — the fun fact behind the category
     · the END shows the board's EPILOGUE, which names the traps you fell for
     · signature PACKS, each with its own independent daily rotation
     · one optional NUDGE that greys out two tiles, at a price

   Faithful to NYT Connections (see _build/RESEARCH.md): four mistake bubbles and
   the FOURTH mistake ends the game (so a win carries at most three); "One away!"
   only when exactly three of the four submitted tiles share a true group;
   re-submitting a set you already tried costs nothing; the last group is never
   auto-awarded; colours y<g<b<p ascend in difficulty; one share row per guess.

   NORM (cross-game 0-100 currency, CONTRACT §3):
     won  → max(25, 100 − 15 × mistakes − 15 if the nudge was used)
     lost → 10
   So a clean sweep is 100, one slip 85, two 70, three 55, and a nudge costs
   exactly what a mistake costs. (The formula returns 40 for a 4-mistake win and
   floors at 25; with the faithful mistake rule a win can only carry three.)
   ========================================================================== */
(function () {
  "use strict";

  /* ── constants ────────────────────────────────────────────────────────────
     Declared above every first use: `var` initialisers do NOT hoist, so a
     constant referenced by a function called during boot would be undefined. */

  var ID = "quartets";
  var MAX_MISTAKES = 4;          // the 4th mistake ends the game
  var NUDGE_COST = 15;
  var ORDER = ["y", "g", "b", "p"];
  var C = {
    y: { tok: "--gold", sq: "🟨", label: "yellow", pips: "●" },
    g: { tok: "--mint", sq: "🟩", label: "green", pips: "●●" },
    b: { tok: "--cool", sq: "🟦", label: "blue", pips: "●●●" },
    p: { tok: "--violet", sq: "🟪", label: "purple", pips: "●●●●" }
  };
  var RANK = ["PERFECT", "GREAT", "SOLID", "PHEW", "NEXT TIME"];
  var DIFF_PAR = [0, 88, 80, 72, 64, 56];   // board.diff 1..5 → expected norm
  var SCAN_DAYS = 120;                      // how far back the pack menu counts

  var HELP =
    "<p>Sixteen tiles hide <b>four groups of four</b>. Tap four you think belong together, " +
    "then <b>SUBMIT</b>. Four mistakes and the board wins.</p>" +
    "<ul><li>Get exactly three of a real group and you'll be told <b>“One away!”</b> — but never which one.</li>" +
    "<li>Groups run <b>yellow → green → blue → purple</b>, easiest to nastiest. Purple is always a trick.</li>" +
    "<li>Submitting a set you've already tried is free. <b>SHUFFLE</b> and <b>DESELECT</b> are free too.</li>" +
    "<li>Every group you crack tells you <b>why</b> it's a group. At the end you get the <b>epilogue</b>: " +
    "the traps that were laid for you, spelled out. The real game never does this.</li>" +
    "<li><b>NUDGE</b> greys out two tiles that are <i>not</i> in the easiest group left. Costs 15 points, once only.</li>" +
    "<li><b>PACKS</b> are house boards — Persian, United, and whatever else is in the archive — " +
    "each with its own board of the day. They don't touch your daily stats.</li></ul>";

  /* ── the data, defensively ───────────────────────────────────────────── */

  function cleanBoard(b) {
    if (!b || !b.groups || b.groups.length !== 4) return null;
    var seen = {}, gs = [], i, j, g, t;
    for (i = 0; i < 4; i++) {
      g = b.groups[i];
      if (!g || !g.tiles || g.tiles.length !== 4 || !C[g.colour]) return null;
      var tiles = [];
      for (j = 0; j < 4; j++) {
        t = String(g.tiles[j] === undefined ? "" : g.tiles[j]).trim();
        if (!t || seen[t.toUpperCase()]) return null;      // blank or duplicate tile
        seen[t.toUpperCase()] = 1;
        tiles.push(t);
      }
      gs.push({ name: String(g.name || "?"), colour: g.colour, tiles: tiles, note: String(g.note || "") });
    }
    gs.sort(function (a, b2) { return ORDER.indexOf(a.colour) - ORDER.indexOf(b2.colour); });
    for (i = 0; i < 4; i++) if (gs[i].colour !== ORDER[i]) return null;   // one of each colour
    return {
      id: b.id === undefined ? 0 : b.id, title: String(b.title || ""),
      diff: Math.max(1, Math.min(5, +b.diff || 3)), groups: gs,
      epilogue: String(b.epilogue || "")
    };
  }

  var PACKS = (((window.AD_CONNECTIONS || {}).packs) || []).map(function (p) {
    return {
      id: String(p.id || ""), name: String(p.name || p.id || "PACK"),
      blurb: String(p.blurb || ""),
      boards: (p.boards || []).map(cleanBoard).filter(Boolean)
    };
  }).filter(function (p) { return p.id && p.boards.length; });

  var DAILY_PACK = (function () {
    for (var i = 0; i < PACKS.length; i++) if (PACKS[i].id === "general") return "general";
    return PACKS.length ? PACKS[0].id : "";
  })();

  /* ── state ───────────────────────────────────────────────────────────── */

  var q = new URLSearchParams(location.search);
  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var pack = null, board = null, ranked = false, stateId = ID;
  var order = [], sel = [], guesses = [], solved = [], nudge = null;
  var over = false, won = false, mistakes = 0, t0 = Date.now();
  var main, bandHost, grid, mistHost, hintEl, subBtn, nudgeBtn, tileEl = {};

  function key(t) { return String(t).toUpperCase(); }
  function esc(s) { return A.esc(s === undefined || s === null ? "" : s); }

  function groupOf(t) {
    var k = key(t);
    for (var i = 0; i < board.groups.length; i++) {
      var g = board.groups[i];
      for (var j = 0; j < 4; j++) if (key(g.tiles[j]) === k) return g;
    }
    return null;
  }
  function byColour(c) {
    for (var i = 0; i < board.groups.length; i++) if (board.groups[i].colour === c) return board.groups[i];
    return null;
  }
  function isSolved(c) { return solved.indexOf(c) >= 0; }
  function isLive(t) { var g = groupOf(t); return !!g && !isSolved(g.colour); }
  function liveTiles() { return order.filter(isLive); }
  function unsolved() {
    return board.groups.filter(function (g) { return !isSolved(g.colour); });
  }

  /* THE NORM FORMULA — exposed on the debug hook so it can be checked directly. */
  function normFor(m, w, usedNudge) {
    if (!w) return 10;
    return Math.max(25, 100 - 15 * m - (usedNudge ? NUDGE_COST : 0));
  }

  /* ── boot ────────────────────────────────────────────────────────────── */

  function boot() {
    main = A.mount({ id: ID, dayN: day, help: HELP });

    if (!PACKS.length) {
      main.innerHTML = '<p class="center muted" style="padding:44px 0;line-height:1.8">' +
        "No boards loaded.<br>Check <b>core/data/connections.js</b> — it should set " +
        "<code>window.AD_CONNECTIONS.packs</code>.</p>";
      return;
    }

    var want = String(q.get("pack") || "").toLowerCase();
    pack = packById(want) || packById(DAILY_PACK) || PACKS[0];
    if (want && pack.id !== want) A.toast("No pack called “" + want + "” — playing " + pack.name, true);
    ranked = pack.id === DAILY_PACK && !practice;
    stateId = pack.id === DAILY_PACK ? ID : ID + ":" + pack.id;

    board = pickBoard();
    order = A.shuffle(A.rng(ID + ":lay:" + pack.id + ":" + board.id + ":" + (practice ? Math.random() : day)),
      board.groups.reduce(function (acc, g) { return acc.concat(g.tiles); }, []));

    if (pack.id !== DAILY_PACK || practice) {
      A.setSub(esc(pack.name) + " · " + (practice ? "PRACTICE" : "DAY " + day));
    }

    /* top row: packs, difficulty, par, practice/today */
    var top = A.el("div", "qtop ac-row");
    top.innerHTML =
      '<button class="ac-pill" id="qpacks">PACKS</button>' +
      '<span class="ac-pill" id="qdiff"></span>' +
      (practice ? '<a class="ac-pill" href="' + hrefFor(pack.id, false) + '">TODAY\'S BOARD</a>'
        : '<a class="ac-pill" href="' + hrefFor(pack.id, true) + '">PRACTICE</a>');
    main.appendChild(top);
    top.querySelector("#qpacks").onclick = packModal;

    var dp = top.querySelector("#qdiff");
    var par = A.par(ID, practice ? A.dayNumber() : day);
    dp.innerHTML = "DIFFICULTY " + "●".repeat(board.diff) + "○".repeat(5 - board.diff) +
      " · PAR <b>" + par.par + "</b>";
    dp.title = "par is " + par.source;

    bandHost = A.el("div"); bandHost.id = "qbands";
    main.appendChild(bandHost);

    grid = A.el("div"); grid.id = "qgrid";
    main.appendChild(grid);

    mistHost = A.el("div", "qmist");
    main.appendChild(mistHost);

    var ctl = A.el("div", "ac-row qctl");
    ctl.innerHTML =
      '<button class="ac-pill" id="qshuf">SHUFFLE</button>' +
      '<button class="ac-pill" id="qdesel">DESELECT ALL</button>' +
      '<button class="ac-pill" id="qnudge">NUDGE</button>';
    main.appendChild(ctl);

    var ctl2 = A.el("div", "ac-row qctl2");
    ctl2.innerHTML = '<button class="ac-btn" id="qsubmit" disabled>SUBMIT</button>';
    main.appendChild(ctl2);

    hintEl = A.el("div", "qhint");
    main.appendChild(hintEl);

    subBtn = ctl2.querySelector("#qsubmit");
    nudgeBtn = ctl.querySelector("#qnudge");
    subBtn.onclick = submit;
    nudgeBtn.onclick = doNudge;
    ctl.querySelector("#qshuf").onclick = doShuffle;
    ctl.querySelector("#qdesel").onclick = function () { if (over) return; sel = []; A.sfx("tick"); render(); save(); };

    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector(".ac-modal.show")) return;
      if (e.key === "Enter" && sel.length === 4 && !over) { e.preventDefault(); submit(); }
      else if (e.key === "Escape" && sel.length) { e.preventDefault(); sel = []; render(); }
    });

    window.addEventListener("resize", function () {
      clearTimeout(render._t);
      render._t = setTimeout(render, 160);
    });

    restore();
  }

  function packById(id) {
    for (var i = 0; i < PACKS.length; i++) if (PACKS[i].id === id) return PACKS[i];
    return null;
  }

  function hrefFor(packId, prac) {
    var bits = [];
    if (packId && packId !== DAILY_PACK) bits.push("pack=" + encodeURIComponent(packId));
    if (prac) bits.push("practice=1");
    else if (!practice && day !== A.dayNumber()) bits.push("d=" + day);
    return bits.length ? "?" + bits.join("&") : "./";
  }

  function pickBoard() {
    if (practice) return A.pick(A.rng(String(Date.now()) + ":" + Math.random()), pack.boards);
    return pack.boards[A.dailyIndex(ID + ":" + pack.id, day, pack.boards.length)];
  }

  /* Today's difficulty, so the Daily Run can quote a par instead of a guess. */
  A.setPar(ID, function (dayN) {
    var p = packById(DAILY_PACK);
    if (!p || dayN === A.PRACTICE) return null;
    var b = p.boards[A.dailyIndex(ID + ":" + p.id, dayN, p.boards.length)];
    return b ? DIFF_PAR[b.diff] : null;
  });

  /* ── rendering ───────────────────────────────────────────────────────── */

  function render() {
    renderBands();
    renderGrid();
    renderStatus();
  }

  function bandEl(g, revealed) {
    var b = A.el("div", "qband" + (revealed ? " rev" : ""));
    b.style.setProperty("--qc", "var(" + C[g.colour].tok + ")");
    b.innerHTML =
      '<span class="qbn"><span class="qbp">' + C[g.colour].pips + "</span> " + esc(g.name) + "</span>" +
      '<span class="qbt">' + g.tiles.map(esc).join(" · ") + "</span>" +
      (g.note ? '<span class="qbz">' + esc(g.note) + "</span>" : "");
    return b;
  }

  function renderBands() {
    bandHost.innerHTML = "";
    solved.forEach(function (c) { bandHost.appendChild(bandEl(byColour(c), false)); });
    if (over && !won) {
      unsolved().forEach(function (g) { bandHost.appendChild(bandEl(g, true)); });
    }
  }

  // Deterministic type sizing — no measure-and-retry loop, no rAF (which is
  // paused in a background tab and would leave tiles unreadable).
  function tileFont(text, w) {
    var words = String(text).split(/\s+/), longest = 1, i;
    for (i = 0; i < words.length; i++) longest = Math.max(longest, words[i].length);
    var per = 0.64;                                        // monospace advance, em
    var byWord = (w - 10) / (longest * per);               // longest word on one line
    var byAll = (w - 10) * 3 / (String(text).length * per); // whole thing in ≤3 lines
    return Math.max(7.4, Math.round(Math.min(byWord, byAll, 16) * 10) / 10);
  }

  function renderGrid() {
    var live = liveTiles();
    grid.innerHTML = "";
    tileEl = {};
    grid.classList.toggle("off", over);
    if (!live.length) return;
    var gw = grid.clientWidth || 344;
    var tw = Math.max(46, (gw - 18) / 4);
    live.forEach(function (t) {
      var b = A.el("button", "qt", esc(t));
      b.type = "button";
      b.style.fontSize = tileFont(t, tw) + "px";
      if (sel.indexOf(t) >= 0) b.classList.add("sel");
      if (nudge && nudge.tiles.indexOf(t) >= 0) b.classList.add("out");
      b.setAttribute("aria-pressed", sel.indexOf(t) >= 0 ? "true" : "false");
      b.onclick = function () { tap(t); };
      tileEl[key(t)] = b;
      grid.appendChild(b);
    });
  }

  function renderStatus() {
    var html = "MISTAKES ";
    for (var i = 0; i < MAX_MISTAKES; i++) html += '<i class="' + (i < mistakes ? "gone" : "") + '"></i>';
    mistHost.innerHTML = html;
    if (subBtn) {
      subBtn.disabled = over || sel.length !== 4;
      subBtn.textContent = over ? "DONE" : sel.length === 4 ? "SUBMIT"
        : sel.length === 0 ? "SELECT FOUR" : "SELECT " + (4 - sel.length) + " MORE";
    }
    if (nudgeBtn) {
      nudgeBtn.disabled = over || !!nudge || unsolved().length < 2;
      nudgeBtn.innerHTML = nudge ? "NUDGE USED" : "NUDGE";
    }
    if (hintEl && nudge && !over) {
      hintEl.innerHTML = "Greyed out: neither belongs to the <b>easiest group left</b> when you asked.";
    }
  }

  /* ── play ────────────────────────────────────────────────────────────── */

  function tap(t) {
    if (over) return;
    var i = sel.indexOf(t);
    if (i >= 0) { sel.splice(i, 1); A.sfx("tick"); }
    else if (sel.length >= 4) { A.toast("Four at a time"); return; }
    else { sel.push(t); A.sfx("key"); }
    render();
    save();
  }

  function guessKey(list) {
    return list.map(key).sort().join("|");
  }

  function submit() {
    if (over || sel.length !== 4) return;
    var k = guessKey(sel);
    for (var i = 0; i < guesses.length; i++) {
      if (guessKey(guesses[i]) === k) {
        A.toast("Already guessed!");
        A.sfx("bad");
        shake(sel);
        return;                                   // free — costs no mistake
      }
    }

    var picked = sel.slice();
    guesses.push(picked);

    var hit = null, best = 0;
    board.groups.forEach(function (g) {
      var n = 0;
      picked.forEach(function (t) { if (groupOf(t) === g) n++; });
      if (n > best) best = n;
      if (n === 4) hit = g;
    });

    if (hit) {
      solved.push(hit.colour);
      sel = [];
      save();
      bounce(picked);
      A.sfx("ok", solved.length - 1);
      setTimeout(function () {
        render();
        if (solved.length === 4) end(true);
      }, 560);
      return;
    }

    mistakes++;
    save();
    shake(picked);
    A.sfx(mistakes >= MAX_MISTAKES ? "lose" : "miss");
    if (best === 3) A.toast("One away!");
    else if (mistakes === MAX_MISTAKES - 1) A.toast("One mistake left", true);

    setTimeout(function () {
      sel = [];
      render();
      if (mistakes >= MAX_MISTAKES) end(false);
    }, 480);
  }

  function shake(list) {
    list.forEach(function (t) {
      var e = tileEl[key(t)];
      if (!e) return;
      e.classList.add("ac-shake");
      setTimeout(function () { e.classList.remove("ac-shake"); }, 440);
    });
  }

  function bounce(list) {
    list.forEach(function (t, i) {
      var e = tileEl[key(t)];
      if (!e) return;
      setTimeout(function () {
        e.classList.add("ac-bounce");
        setTimeout(function () { e.classList.remove("ac-bounce"); }, 520);
      }, i * 90);
    });
  }

  function doShuffle() {
    if (over) return;
    var live = liveTiles();
    if (live.length < 2) return;
    var next = live, tries = 0;
    while (tries++ < 24) {
      next = A.shuffle(A.rng(Date.now() + ":" + Math.random() + ":" + tries), live);
      var same = false;
      for (var i = 0; i < live.length; i++) if (next[i] === live[i]) { same = true; break; }
      if (!same) break;                            // no tile keeps its place
    }
    var out = order.slice(), n = 0;
    for (var j = 0; j < out.length; j++) if (isLive(out[j])) out[j] = next[n++];
    order = out;
    A.sfx("tick");
    render();
    save();
  }

  function doNudge() {
    if (over || nudge) return;
    var left = unsolved();
    if (left.length < 2) return;
    var target = left[0];                          // the easiest group still hiding
    var pool = liveTiles().filter(function (t) { return groupOf(t) !== target; });
    if (pool.length < 2) return;
    var two = A.sample(A.rng(ID + ":nudge:" + pack.id + ":" + board.id + ":" + day), pool, 2);
    nudge = { colour: target.colour, tiles: two };
    A.sfx("reveal");
    A.toast("Two out: neither is in the easiest group left");
    render();
    save();
  }

  /* ── persistence ─────────────────────────────────────────────────────── */

  function playState() {
    return {
      v: 1, pack: pack.id, board: board.id, order: order, sel: sel,
      guesses: guesses, solved: solved, nudge: nudge
    };
  }

  function save() {
    if (practice) return;
    A.save(stateId, day, playState());
  }

  function restore() {
    var st = practice ? null : A.load(stateId, day);
    if (st && (st.pack !== pack.id || st.board !== board.id)) st = null;   // board rotated
    if (st) {
      if (st.order && st.order.length === order.length) order = st.order.slice();
      guesses = (st.guesses || []).slice();
      solved = (st.solved || []).filter(function (c) { return !!C[c]; });
      nudge = st.nudge || null;
      sel = (st.sel || []).filter(isLive);
      mistakes = guesses.filter(function (gg) {
        var g0 = groupOf(gg[0]);
        return !(g0 && gg.every(function (t) { return groupOf(t) === g0; }));
      }).length;
      if (st.done) { over = true; won = !!st.won; }
      else if (mistakes >= MAX_MISTAKES) { over = true; won = false; }
      else if (solved.length === 4) { over = true; won = true; }
    }
    render();
    if (over) setTimeout(function () { sheet(won, st && st.norm !== undefined ? st.norm : normFor(mistakes, won, !!nudge)); }, 260);
  }

  /* ── ending ──────────────────────────────────────────────────────────── */

  function shareRows() {
    return guesses.map(function (gg) {
      return gg.map(function (t) {
        var g = groupOf(t);
        return g ? C[g.colour].sq : "⬜";
      }).join("");
    });
  }

  function end(w) {
    over = true;
    won = w;
    var norm = normFor(mistakes, won, !!nudge);
    var rows = shareRows();
    var detail = won ? (mistakes ? mistakes + " wrong" : "clean sweep") : "lost " + solved.length + "/4";

    if (!practice) {
      if (ranked) {
        A.finish(ID, day, {
          score: norm, norm: norm, won: won, detail: detail, bucket: String(mistakes),
          shareGrid: rows, durationMs: Date.now() - t0
        });
      } else {
        // Pack boards are tracked but unranked: their own key, nobody else's stats.
        A.save(stateId, day, Object.assign(playState(), {
          done: true, won: won, norm: norm, score: norm, detail: detail,
          bucket: String(mistakes), shareGrid: rows, durationMs: Date.now() - t0
        }));
      }
    }

    render();                                     // reveals the rest on a loss
    if (won) {
      A.sfx(mistakes === 0 && !nudge ? "perfect" : "win");
      A.confetti(mistakes === 0 ? 150 : 85);
    } else {
      A.sfx("lose");
    }
    setTimeout(function () { sheet(won, norm); }, won ? 900 : 1150);
  }

  function shareText(norm) {
    var head = "QUARTETS " + (practice ? "(practice)" : "#" + day) +
      (pack.id === DAILY_PACK ? "" : " · " + pack.name) + " · " + norm + "/100";
    return head + "\n" + shareRows().join("\n") + "\n" + A.SITE;
  }

  function sheet(w, norm) {
    var html = "";

    html += '<div class="qsum">';
    board.groups.forEach(function (g) {
      html += '<div class="qsrow" style="--qc:var(' + C[g.colour].tok + ')">' +
        "<b>" + C[g.colour].pips + " " + esc(g.name) + "</b>" +
        "<span>" + g.tiles.map(esc).join(" · ") + "</span>" +
        (g.note ? "<i>" + esc(g.note) + "</i>" : "") + "</div>";
    });
    html += "</div>";

    if (board.epilogue) {
      html += '<div class="qepi"><h3>THE TRAPS</h3><p>' + esc(board.epilogue) + "</p></div>";
    }
    html += '<p class="qmeta">' + esc(pack.name) + " · BOARD " + esc(board.id) +
      (board.title ? " · " + esc(board.title.toUpperCase()) : "") +
      (w && solved[0] === "p" ? " · PURPLE FIRST" : "") + "</p>";
    if (!ranked && !practice) {
      html += '<p class="tiny dim center" style="margin-top:6px">Pack board — kept, but it doesn\'t ' +
        "touch your QUARTETS stats.</p>";
    }

    var m = A.results(stateId, practice ? A.PRACTICE : day, {
      title: w ? RANK[Math.min(mistakes, 4)] : "NEXT TIME",
      lines: [w ? (mistakes ? mistakes + (mistakes === 1 ? " mistake" : " mistakes") : "no mistakes")
        : "you got " + solved.length + " of 4"],
      extraHTML: html,
      state: { norm: norm, shareGrid: shareRows(), won: w },
      shareText: shareText(norm),
      onReplay: function () { location.reload(); }
    });

    // Own the share text everywhere (the core only uses opts.shareText in practice)
    // and keep the sheet's PRACTICE link inside the pack you're playing.
    var sb = m.body.querySelector("#ac-share");
    if (sb) sb.onclick = function () { A.share(shareText(norm)); };
    var pl = m.body.querySelector('a[href="?practice=1"]');
    if (pl) pl.href = hrefFor(pack.id, true);
    return m;
  }

  /* ── the pack menu ───────────────────────────────────────────────────── */

  function packProgress(p) {
    var sid = p.id === DAILY_PACK ? ID : ID + ":" + p.id;
    var today = A.dayNumber(), done = 0, wins = 0;
    for (var d = today; d >= 0 && d > today - SCAN_DAYS; d--) {
      var st = A.load(sid, d);
      if (st && st.done) { done++; if (st.won) wins++; }
    }
    return { done: done, wins: wins };
  }

  function packModal() {
    var h = '<p class="tiny muted center" style="margin-bottom:12px">The daily board comes from ' +
      esc((packById(DAILY_PACK) || {}).name || "the archive") +
      ". Every other pack has its own board of the day — same rules, no effect on your stats.</p>";
    PACKS.forEach(function (p) {
      var pr = packProgress(p);
      h += '<button class="qpack' + (p.id === pack.id ? " on" : "") + '" data-p="' + esc(p.id) + '">' +
        "<b>" + esc(p.name) + (p.id === DAILY_PACK ? " · TODAY" : "") + "</b>" +
        (p.blurb ? "<span>" + esc(p.blurb) + "</span>" : "") +
        "<i>" + p.boards.length + " board" + (p.boards.length === 1 ? "" : "s") +
        " · " + pr.wins + " won" + (pr.done > pr.wins ? " · " + (pr.done - pr.wins) + " lost" : "") +
        "</i></button>";
    });
    var m = A.modal("PACKS", h);
    A.$$(".qpack", m.body).forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute("data-p");
        if (id === pack.id && !practice) { m.close(); return; }
        location.href = hrefFor(id, false);
      };
    });
    return m;
  }

  /* ── register + debug hook ───────────────────────────────────────────── */

  A.register({
    id: ID, name: "QUARTETS", tagline: "sixteen tiles, four groups, four mistakes",
    icon: "🟪", accent: "--mint", family: "word", parMs: 200000,
    hasArchive: true, hasPractice: true
  });

  // Enough to play a whole game headlessly from the console.
  window.__QT = {
    board: function () {
      return {
        pack: pack && pack.id, packName: pack && pack.name, id: board && board.id,
        title: board && board.title, diff: board && board.diff, ranked: ranked,
        stateId: stateId, day: day, practice: practice
      };
    },
    packs: function () {
      return PACKS.map(function (p) { return { id: p.id, name: p.name, boards: p.boards.length }; });
    },
    groups: function () {
      return board.groups.map(function (g) { return { colour: g.colour, name: g.name, tiles: g.tiles.slice() }; });
    },
    tiles: function () { return liveTiles(); },
    select: function (list) { sel = list.slice(0, 4); render(); return sel; },
    deselect: function () { sel = []; render(); },
    shuffle: doShuffle,
    submit: submit,
    guess: function (list) { sel = list.slice(0, 4); render(); submit(); return this.state(); },
    solve: function (colour) { return this.guess(byColour(colour).tiles.slice()); },
    // A deliberate wrong guess: three from one group plus a ringer from another.
    wrong: function () {
      var left = unsolved();
      if (left.length < 2) return null;
      return this.guess(left[0].tiles.slice(0, 3).concat([left[1].tiles[0]]));
    },
    nudge: doNudge,
    state: function () {
      return {
        mistakes: mistakes, solved: solved.slice(), guesses: guesses.length,
        over: over, won: won, nudged: !!nudge, selected: sel.slice(),
        norm: normFor(mistakes, won, !!nudge), share: shareRows()
      };
    },
    normFor: normFor
  };

  boot();
})();
