/* ============================================================================
   GEOGRID — nine cells, ten guesses, no repeats.
   ----------------------------------------------------------------------------
   Three criteria down the side, three across the top. Name a country that
   satisfies both for each of the nine intersections. A country may be used
   only once on the board, and you get ten guesses for nine cells — so exactly
   one miss is affordable.

   RARITY, HONESTLY
   The original scores every pick by the share of the world's players who chose
   the same country in the same cell today. That needs a server counting live
   guesses, we have none, and it is also the original's worst structural flaw:
   the percentages drift all day, so the same pick scores differently depending
   on when you play and two people who play hours apart are not measured on the
   same denominator.

   So this cabinet scores against the OBVIOUSNESS PRIOR shipped in
   core/data/geogrid.js — a computed guess at which country you would think of
   first, from log(population) and log(GDP per capita), softmaxed across that
   cell's valid answers and divided by the cell's most obvious answer. It is a
   model, not a crowd, and the help text says so out loud. What it buys is that
   Misha and David get IDENTICAL scores on the same board no matter when they
   sit down, and the game works on a plane.

   SCORING
     cell points = AD_GEOGRID.points(row, col, iso) = 10..100
                   100 = a country nobody would think of, 10 = the obvious one,
                   0   = left blank.
     board score = the nine cells summed (0..900).

   NORM (cross-game 0-100 currency, CONTRACT §3)
   900 is unreachable — in a cell like "in Africa × landlocked" even the deepest
   cut is a country people know — so each board publishes its own anchors,
   computed from its own answer lists:
     SOLID      the answer 35% of the way down each cell's obscurity ranking,
                in all nine cells                                    → norm 72
     EXCELLENT  the answer 82% of the way down, in all nine          → norm 92
     CEILING    the least obvious valid answer in all nine           → norm 100
   norm is piecewise linear through (0,0) → SOLID → EXCELLENT → CEILING, so a
   blank cell costs about a ninth of the day and 100 stays rare.
   ========================================================================== */
(function () {
  "use strict";

  var ID = "geogrid";
  var GUESSES = 10, CELLS = 9;
  var G = window.AD_GEOGRID;

  /* ── state ─────────────────────────────────────────────────────────────── */
  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var grid = null;                 // { rows:[3], cols:[3], counts, minCell }
  var board = [null, null, null, null, null, null, null, null, null];  // iso per cell
  var pts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  var wrong = [];                  // {iso, cell, row:bool, col:bool}
  var left = GUESSES, over = false, revealed = false, armedCell = -1;
  var t0 = Date.now();
  var anchors = null;              // { solid, great, ceil, cells:[9] }
  var main, gridEl, armedEl, pick, strip;

  /* ── the board for a day ───────────────────────────────────────────────── */

  // Deterministic, and re-tried on a derived seed until the board sits in the
  // band the research calls "Standard": every cell has at least 6 valid answers
  // and the board averages 10–30. Wider than that and rarity becomes a lottery
  // (the original shipped cells with 106 valid answers, where even the modal
  // answer was 4.8% and a well-reasoned pick scored the same as a half-
  // remembered one). Tighter and a single cell can end the run.
  function buildFor(seedBase) {
    var g = null, best = -1;
    for (var k = 0; k < 10; k++) {
      var cand = G.buildGrid(A.rng(seedBase + ":" + k), { minCell: 6, groupCap: 2, mix: true });
      if (!cand) continue;
      if (cand.minCell >= 6 && cand.meanCell >= 10 && cand.meanCell <= 30) return cand;
      // keep the nearest miss rather than the last one
      var d = -Math.abs(cand.meanCell - 18) - (cand.minCell < 6 ? 40 : 0);
      if (d > best) { best = d; g = cand; }
    }
    return g || G.buildGrid(A.rng(seedBase), { minCell: 3, groupCap: 3, mix: false });
  }

  function gridFor(dayN) {
    return buildFor(ID + ":" + dayN);
  }

  /* ── scoring anchors ───────────────────────────────────────────────────── */

  // Each cell's valid answers, most obvious first.
  function ranked(r, c) {
    var list = G.cell(grid.rows[r], grid.cols[c]).slice();
    list.sort(function (a, b) {
      var d = G.salienceOf(b) - G.salienceOf(a);
      return d || (a < b ? -1 : 1);
    });
    return list;
  }

  function computeAnchors() {
    var solid = 0, great = 0, ceil = 0, per = [];
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var list = ranked(r, c), n = list.length;
        var a = list[Math.min(n - 1, Math.round(0.35 * (n - 1)))];
        var b = list[Math.min(n - 1, Math.round(0.82 * (n - 1)))];
        var z = list[n - 1];
        var pa = G.points(grid.rows[r], grid.cols[c], a);
        var pb = G.points(grid.rows[r], grid.cols[c], b);
        var pz = G.points(grid.rows[r], grid.cols[c], z);
        solid += pa; great += Math.max(pa, pb); ceil += pz;
        per.push({ n: n, best: z, bestPts: pz });
      }
    }
    // Guard the degenerate case where a board's cells are so small that the
    // three anchors collapse onto each other and norm becomes a step function.
    ceil = Math.max(ceil, solid + 45);
    great = A.clamp(great, solid + 25, ceil - 15);
    return { solid: solid, great: great, ceil: ceil, cells: per };
  }

  function normFor(score) {
    var a = anchors;
    if (score <= 0) return 0;
    if (score <= a.solid) return Math.round(72 * score / a.solid);
    if (score <= a.great) return Math.round(72 + 20 * (score - a.solid) / (a.great - a.solid));
    if (score <= a.ceil) return Math.round(92 + 8 * (score - a.great) / (a.ceil - a.great));
    return 100;
  }

  function total() {
    var s = 0;
    for (var i = 0; i < CELLS; i++) s += pts[i];
    return s;
  }
  function filled() {
    var n = 0;
    for (var i = 0; i < CELLS; i++) if (board[i]) n++;
    return n;
  }

  /* ── how hard is today's board? (feeds A.par, which is honest that it is a
        computed prior and not a crowd) ────────────────────────────────────── */
  A.setPar(ID, function (dayN) {
    try {
      var g = gridFor(dayN);
      if (!g) return null;
      // Broad boards are easier: there is always something you can name.
      var breadth = A.clamp((g.meanCell - 6) / 24, 0, 1);
      return Math.round(62 + 16 * breadth);
    } catch (e) { return null; }
  });

  /* ── boot ──────────────────────────────────────────────────────────────── */

  main = A.mount({
    id: ID, dayN: day,
    help:
      "<p>Three criteria down the side, three across the top. Name a country " +
      "that satisfies <b>both</b> for each of the nine squares.</p>" +
      "<ul>" +
      "<li><b>Ten guesses for nine squares</b> — right or wrong, every guess is spent. " +
      "Exactly one miss is affordable.</li>" +
      "<li>A country can be used <b>once per board</b>. Re-entering one you've already " +
      "placed costs you nothing — it's just refused.</li>" +
      "<li>Get one wrong and the two headers flash: <b class='ok'>green</b> for the " +
      "criterion you did satisfy, red for the one you didn't. That's real information.</li>" +
      "<li><b>Tap any header</b> to read exactly what it means and how many countries qualify.</li>" +
      "</ul>" +
      "<p><b>The scoring is upside down.</b> An obvious answer is worth about 10; a country " +
      "nobody would think of is worth up to 100. Filling a square is always better than " +
      "leaving it blank, but filling it with France is barely better.</p>" +
      "<p class='tiny muted'>The real GeoGrid scores you against the share of players " +
      "worldwide who picked the same country in the same square today. That needs a server, " +
      "and it means your score depends on what time you played. This one uses a " +
      "<b>computed obviousness prior</b> instead — log population × log GDP per capita, " +
      "softmaxed across that square's valid answers. It is a model of what people reach for " +
      "first, not a crowd, and it never drifts: you and David get the same number for the " +
      "same pick whenever you play.</p>",
  });

  if (!G || !window.AD_COUNTRIES) {
    main.appendChild(A.el("p", "center muted", "Grid data didn't load. Reload the page?"));
    return;
  }

  grid = practice ? buildFor(ID + ":p:" + Date.now() + ":" + Math.random()) : gridFor(day);
  if (!grid) {
    main.appendChild(A.el("p", "center muted", "Couldn't build a board today. Try the archive."));
    return;
  }
  anchors = computeAnchors();

  strip = A.el("div", "strip");
  main.appendChild(strip);

  gridEl = A.el("div", null);
  gridEl.id = "gg";
  main.appendChild(gridEl);

  armedEl = A.el("div", null, "");
  armedEl.id = "armed";
  main.appendChild(armedEl);

  var pickHost = A.el("div", null);
  pickHost.id = "pick";
  main.appendChild(pickHost);

  pick = A.picker(pickHost, {
    placeholder: "name a country…",
    pool: G.pool,
    onPick: function (iso, rec) { guess(iso, rec); },
  });

  var legend = A.el("div", "legend");
  legend.innerHTML = G.obvTiers.slice().reverse().map(function (t) {
    return '<span class="t-' + t.key + '"><i></i>' + t.label + "</span>";
  }).join("");
  main.appendChild(legend);

  var acts = A.el("div", "ac-row acts");
  acts.innerHTML =
    '<button class="ac-btn ghost sm" id="gg-give">Finish &amp; reveal</button>' +
    (practice ? '<a class="ac-btn ghost sm" href="./">Today\'s board</a>'
      : '<a class="ac-btn ghost sm" href="?practice=1">Practice</a>');
  main.appendChild(acts);
  acts.querySelector("#gg-give").onclick = giveUp;

  var reviewEl = A.el("div", null, "");
  main.appendChild(reviewEl);

  buildBoard();
  restore();
  paint();

  /* ── DOM ───────────────────────────────────────────────────────────────── */

  function buildBoard() {
    gridEl.innerHTML = "";
    var cnr = A.el("div", "cnr", (practice ? "Practice" : "Board") +
      "<b>" + (practice ? "∞" : "#" + day) + "</b>");
    gridEl.appendChild(cnr);

    grid.cols.forEach(function (id, c) {
      var b = A.el("button", "gh", A.esc(G.byId(id).label));
      b.type = "button";
      b.id = "ch" + c;
      b.onclick = function () { atlas(id); };
      gridEl.appendChild(b);
    });

    for (var r = 0; r < 3; r++) {
      (function (r) {
        var rh = A.el("button", "gh", A.esc(G.byId(grid.rows[r]).label));
        rh.type = "button";
        rh.id = "rh" + r;
        rh.onclick = function () { atlas(grid.rows[r]); };
        gridEl.appendChild(rh);
        for (var c = 0; c < 3; c++) {
          (function (c) {
            var i = r * 3 + c;
            var cell = A.el("button", "gc");
            cell.type = "button";
            cell.id = "gc" + i;
            cell.onclick = function () { arm(i); };
            gridEl.appendChild(cell);
          })(c);
        }
      })(r);
    }
  }

  function cellEl(i) { return document.getElementById("gc" + i); }

  function paint() {
    strip.innerHTML =
      "<span>Score <b>" + total() + "</b></span>" +
      "<span>" + filled() + "/9 filled</span>" +
      '<span class="' + (left <= 2 && !over ? "low" : "") + '">Guesses <b>' + Math.max(0, left) + "</b></span>";

    for (var i = 0; i < CELLS; i++) {
      var el = cellEl(i), iso = board[i];
      el.className = "gc" + (iso ? " done" : "") + (i === armedCell ? " arm" : "");
      if (iso) {
        var rec = byIso(iso);
        var obv = G.obviousness(grid.rows[(i / 3) | 0], grid.cols[i % 3], iso);
        var tier = G.tierOfObv(obv);
        el.innerHTML =
          '<img alt="" src="' + A.rootPath() + "core/data/flags/" + iso +
          '.svg" onerror="this.style.visibility=\'hidden\'">' +
          '<span class="nm">' + A.esc(rec ? rec.n : iso) + "</span>" +
          '<span class="pts t-' + tier.key + '">' + pts[i] + "</span>";
        el.title = (rec ? rec.n : iso) + " — " + tier.label + ", " + pts[i] + " points";
      } else if (revealed) {
        var best = anchors.cells[i];
        var brec = byIso(best.best);
        el.className += " rev";
        el.innerHTML = '<span class="n">Best was</span>' +
          '<span class="nm">' + A.esc(brec ? brec.n : best.best) + "</span>" +
          '<span class="pts t-mythical">' + best.bestPts + "</span>";
      } else {
        el.innerHTML = '<span class="plus">+</span><span class="n">' +
          G.both(grid.rows[(i / 3) | 0], grid.cols[i % 3]) + " fit</span>";
      }
    }

    if (over) {
      armedEl.innerHTML = '<span class="idle">' +
        (filled() === CELLS ? "Board complete" : "Board closed") + "</span>";
      pick.disable(true);
    } else if (armedCell < 0) {
      armedEl.innerHTML = '<span class="idle">Tap a square to aim at it</span>';
      pick.disable(true);
    } else {
      var r = (armedCell / 3) | 0, c = armedCell % 3;
      armedEl.innerHTML = "<b>" + A.esc(G.byId(grid.rows[r]).label) + "</b>" +
        '<span class="x">×</span><b>' + A.esc(G.byId(grid.cols[c]).label) + "</b>";
      pick.disable(false);
    }
    // Deliberately NOT pick.setExclude(placed): excluding them makes the picker
    // answer "no country like that" for a country that plainly exists, which is
    // a lie. Letting it through to guess() gets the honest message instead —
    // "already on the board, that one's free" — and no guess is charged.
  }

  function byIso(iso) {
    var all = window.AD_COUNTRIES || [];
    for (var i = 0; i < all.length; i++) if (all[i].i === iso) return all[i];
    return null;
  }

  /* ── play ──────────────────────────────────────────────────────────────── */

  function arm(i) {
    if (over || board[i]) return;
    armedCell = i;
    paint();
    pick.focus();
    A.sfx("key");
  }

  function guess(iso, rec) {
    if (over) return;
    if (armedCell < 0) return A.toast("Pick a square first", true);
    if (board.indexOf(iso) >= 0) return A.toast("Already on the board — that one's free", true);

    var i = armedCell, r = (i / 3) | 0, c = i % 3;
    var rowId = grid.rows[r], colId = grid.cols[c];
    var okRow = G.test(rowId, rec), okCol = G.test(colId, rec);

    left--;
    if (okRow && okCol) {
      board[i] = iso;
      pts[i] = G.points(rowId, colId, iso);
      var tier = G.tierOfObv(G.obviousness(rowId, colId, iso));
      armedCell = -1;
      A.sfx(pts[i] >= 80 ? "stamp" : "ok", 0);
      A.toast((rec.n) + " — " + tier.label + " · " + pts[i]);
      if (pts[i] >= 88) A.confetti(40, { hearts: 0 });
      paint();
      save();
      if (filled() === CELLS) return setTimeout(function () { end(); }, 420);
      if (left <= 0) return setTimeout(function () { end(); }, 420);
    } else {
      wrong.push({ iso: iso, cell: i, row: okRow, col: okCol });
      A.sfx("bad");
      flash(r, c, okRow, okCol);
      var el = cellEl(i);
      el.classList.add("ac-shake");
      setTimeout(function () { el.classList.remove("ac-shake"); }, 420);
      A.toast(rec.n + " — " + (okRow || okCol
        ? "half right: " + G.byId(okRow ? rowId : colId).label.toLowerCase() + ", but not the other"
        : "neither criterion"), true);
      paint();
      save();
      if (left <= 0) return setTimeout(function () { end(); }, 520);
      if (left === 1) A.toast("One guess left", true);
    }
    pick.clear();
  }

  // The partial-credit flash: which of the two criteria did that country meet?
  function flash(r, c, okRow, okCol) {
    var rh = document.getElementById("rh" + r), ch = document.getElementById("ch" + c);
    if (rh) rh.classList.add(okRow ? "yes" : "no");
    if (ch) ch.classList.add(okCol ? "yes" : "no");
    setTimeout(function () {
      if (rh) rh.classList.remove("yes", "no");
      if (ch) ch.classList.remove("yes", "no");
    }, 1400);
  }

  function atlas(id) {
    var cr = G.byId(id);
    if (!cr) return;
    var n = (G.valid(id) || []).length;
    var html = "<p>" + A.esc(cr.label) + ".</p>";
    if (cr.note) html += '<p class="tiny muted">' + A.esc(cr.note) + "</p>";
    html += '<p class="critn"><b>' + n + "</b> of the 194 countries in the pool qualify — " +
      Math.round(1000 * n / 194) / 10 + "% of them.</p>";
    html += '<p class="critn">Tested straight off <code>core/data/countries.js</code>, so ' +
      "there are no data holes and no free misses: every country either qualifies or it doesn't.</p>";
    A.modal("Criterion", html);
  }

  /* ── persistence ───────────────────────────────────────────────────────── */

  function save() {
    if (practice) return;
    A.save(ID, day, {
      board: board.slice(), pts: pts.slice(), left: left,
      wrong: wrong.slice(), rows: grid.rows, cols: grid.cols,
    });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (!st) return;
    // A board built by an older seed would put saved answers in the wrong cells.
    if (String(st.rows) !== String(grid.rows) || String(st.cols) !== String(grid.cols)) return;
    board = (st.board || board).slice();
    pts = (st.pts || pts).slice();
    wrong = (st.wrong || []).slice();
    left = st.left === undefined ? GUESSES : st.left;
    if (st.done) {
      over = true;
      revealed = !!st.revealed;
      setTimeout(function () { sheet(); }, 260);
    }
  }

  /* ── ending ────────────────────────────────────────────────────────────── */

  function giveUp() {
    if (over) {
      revealed = true;
      paint();
      review();
      return;
    }
    var m = A.modal("Give up?", "<p>You'll see the best answer in every square, but the board " +
      "closes where it is.</p><div class='ac-row' style='margin-top:14px'>" +
      "<button class='ac-btn' id='gg-yes'>Finish &amp; reveal</button>" +
      "<button class='ac-btn ghost' id='gg-no'>Keep playing</button></div>");
    m.body.querySelector("#gg-yes").onclick = function () { m.close(); revealed = true; end(); };
    m.body.querySelector("#gg-no").onclick = function () { m.close(); };
  }

  function shareGrid() {
    var out = [];
    for (var r = 0; r < 3; r++) {
      var line = "";
      for (var c = 0; c < 3; c++) {
        var i = r * 3 + c, iso = board[i];
        if (!iso) { line += "❌"; continue; }
        line += G.tierOfObv(G.obviousness(grid.rows[r], grid.cols[c], iso)).emoji;
      }
      out.push(line);
    }
    return out;
  }

  function end() {
    if (over) return;
    over = true;
    armedCell = -1;
    var score = total(), n = filled();
    var norm = A.clamp(normFor(score), 0, 100);
    var won = n === CELLS;
    var detail = n + "/9 · " + score;

    var stamps = board.filter(Boolean);

    if (!practice) {
      A.finish(ID, day, {
        score: score, norm: norm, won: won, detail: detail, bucket: n,
        shareGrid: shareGrid(), stamps: stamps, durationMs: Date.now() - t0,
      });
      A.save(ID, day, { revealed: revealed });
    }
    if (won) { A.sfx(norm >= 92 ? "perfect" : "win"); A.confetti(norm >= 92 ? 160 : 90, { hearts: 0 }); }
    else A.sfx("lose");
    paint();
    review();
    sheet();
  }

  /* ── the learning pane: what you missed, and what was in there ─────────── */

  function review() {
    var h = '<div class="rvh">Every square</div><ul class="rvlist">';
    for (var i = 0; i < CELLS; i++) {
      var r = (i / 3) | 0, c = i % 3;
      var rowId = grid.rows[r], colId = grid.cols[c];
      var list = ranked(r, c);
      var best = list[list.length - 1], bestPts = G.points(rowId, colId, best);
      var brec = byIso(best);
      var iso = board[i], rec = iso ? byIso(iso) : null;
      var tier = iso ? G.tierOfObv(G.obviousness(rowId, colId, iso)) : null;
      h += "<li><div class='top'><span class='cx'>" +
        A.esc(G.byId(rowId).label) + " × " + A.esc(G.byId(colId).label) +
        "</span><span class='pt " + (iso ? "t-" + tier.key : "") + "'>" +
        (iso ? pts[i] : "—") + "</span></div>";
      h += "<div class='yours'>" + (rec ? A.esc(rec.n) : "<span class='muted'>left blank</span>") + "</div>";
      h += "<div class='miss'>" + list.length + " countries fit. Deepest cut: <b>" +
        A.esc(brec ? brec.n : best) + "</b> (" + bestPts + ")";
      if (list.length > 1) {
        var obvRec = byIso(list[0]);
        h += " · most obvious: " + A.esc(obvRec ? obvRec.n : list[0]);
      }
      h += "</div><div class='miss'><a href='#' data-cell='" + i + "'>Show all " +
        list.length + "</a></div></li>";
    }
    h += "</ul>";
    if (wrong.length) {
      h += '<div class="rvh">Your misses</div><ul class="rvlist">';
      wrong.forEach(function (w) {
        var wr = byIso(w.iso), r = (w.cell / 3) | 0, c = w.cell % 3;
        h += "<li><div class='yours'>" + A.esc(wr ? wr.n : w.iso) + "</div><div class='miss'>" +
          (w.row ? "✓ " : "✗ ") + A.esc(G.byId(grid.rows[r]).label) + " &nbsp;·&nbsp; " +
          (w.col ? "✓ " : "✗ ") + A.esc(G.byId(grid.cols[c]).label) + "</div></li>";
      });
      h += "</ul>";
    }
    reviewEl.innerHTML = h;
    A.$$("a[data-cell]", reviewEl).forEach(function (a) {
      a.onclick = function (e) {
        e.preventDefault();
        var i = +a.getAttribute("data-cell"), r = (i / 3) | 0, c = i % 3;
        var list = ranked(r, c);
        var body = list.map(function (iso) {
          var rec = byIso(iso), p = G.points(grid.rows[r], grid.cols[c], iso);
          var t = G.tierOfObv(G.obviousness(grid.rows[r], grid.cols[c], iso));
          return "<div class='sum'><span>" + A.esc(rec ? rec.n : iso) +
            "</span> <b class='t-" + t.key + "'>" + p + "</b></div>";
        }).join("");
        A.modal(G.byId(grid.rows[r]).label + " × " + G.byId(grid.cols[c]).label,
          "<p class='tiny muted'>" + list.length + " countries qualify, most obvious first. " +
          "The number is what that pick would have been worth.</p>" +
          "<div style='font-size:var(--t-sm);line-height:2'>" + body + "</div>");
      };
    });
  }

  function shareText() {
    var head = "GEOGRID " + (practice ? "(practice)" : "#" + day) + " " + filled() + "/9 · " + total();
    return head + "\n" + shareGrid().join("\n") + "\n" + A.SITE;
  }

  function sheet() {
    var score = total(), n = filled();
    var norm = A.clamp(normFor(score), 0, 100);
    var extra = "<p class='center tiny muted' style='margin-top:6px'>" +
      "<b>" + score + "</b> points from " + n + " square" + (n === 1 ? "" : "s") +
      " · a solid board here is <b>" + anchors.solid + "</b>, an excellent one <b>" +
      anchors.great + "</b>, and the perfect one <b>" + anchors.ceil + "</b>.</p>" +
      "<p class='center tiny dim'>Rarity is a computed prior, not a crowd — same number for " +
      "both of you, whenever you play.</p>";

    var m = A.results(ID, practice ? A.PRACTICE : day, {
      title: n === CELLS ? (norm >= 92 ? "IMMACULATE" : "ALL NINE") : n >= 7 ? "NEARLY" : "NEXT TIME",
      extraHTML: extra,
      state: { norm: norm, shareGrid: shareGrid(), won: n === CELLS },
      shareText: shareText(),
      onReplay: function () { location.reload(); },
    });
    var sb = m.body.querySelector("#ac-share");
    if (sb) sb.onclick = function () { A.share(practice ? shareText() : A.shareCard(ID, day)); };
    return m;
  }

  /* ── debug hook — drives the REAL handlers, not the maths underneath ───── */
  window.__GG = {
    state: function () {
      return {
        day: day, practice: practice, rows: grid.rows.slice(), cols: grid.cols.slice(),
        counts: grid.counts, minCell: grid.minCell, meanCell: grid.meanCell,
        board: board.slice(), pts: pts.slice(), left: left, over: over,
        score: total(), filled: filled(), norm: normFor(total()), anchors: anchors,
      };
    },
    // click the cell, then click a suggestion — the same path a thumb takes
    tap: function (i) { cellEl(i).click(); },
    type: function (s) { pick.input.value = s; pick.input.dispatchEvent(new Event("input")); },
    enter: function () {
      pick.input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    },
    play: function (i, name) { this.tap(i); this.type(name); this.enter(); },
    cell: function (i) { return ranked((i / 3) | 0, i % 3); },
    give: giveUp,
    // pick the answer at fraction f down each cell's obscurity ranking
    autoplay: function (f) {
      for (var i = 0; i < CELLS; i++) {
        if (board[i] || over) continue;
        var list = ranked((i / 3) | 0, i % 3);
        var iso = list[Math.min(list.length - 1, Math.round((f === undefined ? 0.35 : f) * (list.length - 1)))];
        if (board.indexOf(iso) >= 0) iso = list.filter(function (x) { return board.indexOf(x) < 0; })[0];
        if (!iso) continue;
        var rec = byIso(iso);
        this.play(i, rec.n);
      }
      return this.state();
    },
    // what does a board actually pay? used to calibrate the norm anchors
    calib: function (days) {
      var out = [];
      for (var d = 0; d < (days || 20); d++) {
        var g = gridFor(d), save = grid;
        grid = g;
        var a = computeAnchors();
        out.push({ day: d, mean: Math.round(g.meanCell), min: g.minCell,
          solid: a.solid, great: a.great, ceil: a.ceil,
          rows: g.rows, cols: g.cols });
        grid = save;
      }
      return out;
    },
  };
})();
