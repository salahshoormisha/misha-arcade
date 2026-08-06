/* ============================================================================
   PHYLO — GLOBLE's proximity mechanic, played on the tree of life.

   There is a secret organism. Name any organism and you are not told hot or
   cold; you are told WHERE THE TWO OF YOU PART. "You and it share Class
   Mammalia. You diverge at Order." Every guess pins one more rung of the
   answer's real lineage, and rules out one branch at the rung below it — so
   the board fills in as a ladder you can actually reason down.

   All taxonomy is GBIF's backbone (core/data/phylo.js, harvested by
   _build/gen_phylo.py). Nothing here invents a rank.

   Why the ladder rather than a heat colour: shared depth is not a distance,
   it is a *fact about the answer*. Painting it as warmth throws away the one
   thing that makes this deduction instead of guess-and-check. So the centre of
   the screen is the confirmed lineage, and under the frontier rung sit the
   branches you have eliminated.

   NORM: a win at n guesses → 112 − 5.2n, floored at 8. So 2 ≈ 100, 4 ≈ 91,
   8 ≈ 70, 12 ≈ 50, 20 ≈ 8; revealing the answer scores 0. The pool is ~400
   with roughly 2 bits of information a guess, which puts a strong player at
   4–6 and a solid one at 7–9 — i.e. a good day lands ≈70 and an excellent one
   ≈90, and 100 needs real luck. Verified against a simulated player in
   _build/t_phylo.js, which prints the distribution.
   ========================================================================== */
(function () {
  "use strict";

  var ID = "phylo";
  var D = window.AD_PHYLO || null;

  /* ── every `var` this file reads at boot is declared before anything runs.
        A function that fires during setup and reaches a `var` further down
        gets undefined; that trap has already cost this build two cabinets. ── */

  var RANKS = D ? D.ranks : [];            // domain…species, 8 rungs
  var NR = 8;
  var TAXA = D ? D.taxa : [];
  var GLOSS = (D && D.gloss) || {};
  var ALL = D ? D.sp : [];

  // Guess pool = everything shipped. Answer pool = the salient band, which the
  // harvester marks with q:1 after culling by Wikipedia pageviews. An answer
  // nobody can name is a broken puzzle, not a hard one.
  var POOL = ALL.filter(function (e) { return e.q === 1; });

  var byId = {};
  ALL.forEach(function (e, i) { e.i = i; byId[i] = e; });

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;

  var answer = null;
  var guesses = [];          // array of indices into ALL
  var over = false, finished = false, revealed = false;
  var t0 = Date.now();

  var picker = null, ladderEl = null, statusEl = null, listEl = null, rowEl = null;

  var WIN_BASE = 112, WIN_STEP = 5.2, WIN_FLOOR = 8;

  /* ── page shell ──────────────────────────────────────────────────────── */

  var main = A.mount({
    id: ID, dayN: day,
    help:
      "<p>One secret organism. Name any organism you like — you are not told warm or cold, " +
      "you are told <b>where the two of you part</b>.</p>" +
      "<ul>" +
      "<li>Guess a lion against a mystery bat and the answer is: you share <b>Class Mammalia</b>, " +
      "you diverge at <b>Order</b>. So the ladder now knows four rungs of the truth.</li>" +
      "<li>The branch your guess took at the parting rung is <b>ruled out</b> and listed under it. " +
      "That is the whole game: climb down the ladder, cross branches off.</li>" +
      "<li>Everything is fair game — mushrooms, wheat, kelp, gut bacteria. Opening with something " +
      "far from an animal is a real strategy, not a joke.</li>" +
      "<li>No guess limit, but the score falls with every one.</li>" +
      "</ul>",
  });

  if (!D || !ALL.length || !POOL.length) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">' +
      "The tree of life hasn't loaded yet.</p>";
    return;
  }

  answer = pickAnswer();

  var board = A.el("div", "board");
  board.innerHTML = '<div class="lad-head"><span>THE LINEAGE SO FAR</span><em id="lad-count"></em></div>' +
    '<div class="ladder" id="ladder"></div>';
  main.appendChild(board);
  ladderEl = board.querySelector("#ladder");

  statusEl = A.el("div", "status");
  main.appendChild(statusEl);

  var pickHost = A.el("div", "pick-host");
  main.appendChild(pickHost);

  rowEl = A.el("div", "ac-row");
  rowEl.style.marginTop = "var(--sp-3)";
  rowEl.innerHTML = (practice
    ? '<a class="ac-pill" href="./">TODAY\'S ORGANISM</a>'
    : '<a class="ac-pill" href="?practice=1">PRACTICE</a>') +
    '<button class="ac-pill" id="reveal" type="button">GIVE UP</button>';
  main.appendChild(rowEl);

  listEl = A.el("div", "guesses");
  main.appendChild(listEl);

  picker = A.picker(pickHost, {
    items: ALL.map(function (e) {
      return { i: e.i, n: e.n, alt: (e.a || []).concat([e.s]), sub: e.s, pop: e.p || 0 };
    }),
    onPick: guess,
    placeholder: "name any organism…",
    label: "Guess an organism",
    noMatch: "Nothing in the tree by that name",
    max: 7,
  });

  rowEl.querySelector("#reveal").onclick = function () {
    if (over) return;
    if (guesses.length < 4) return A.toast("Have a few more goes first", true);
    revealed = true;
    end(false);
  };

  restore();

  /* ── the mechanic ────────────────────────────────────────────────────── */

  function pickAnswer() {
    if (practice) return A.pick(A.rng(String(Date.now()) + Math.random()), POOL);
    return POOL[A.dailyIndex(ID, day, POOL.length)];
  }

  /** How many rungs two organisms share: 0 (nothing) … 7 (same genus), 8 = same
      species. Index i of `l` is rank i; species is compared on the binomial. */
  function shared(a, b) {
    for (var i = 0; i < 7; i++) if (a.l[i] !== b.l[i]) return i;
    return a.s === b.s ? 8 : 7;
  }

  /** The taxon name a guess carries at rung i — for i<7 from the pool, i=7 the
      binomial. Used both for the confirmed rungs and for the ruled-out chips. */
  function taxonAt(e, i) { return i < 7 ? TAXA[e.l[i]] : e.s; }

  /** Everything the player has established: the deepest shared prefix, and the
      branches eliminated at the rung immediately below it. */
  function knowledge() {
    var known = 0;
    guesses.forEach(function (gi) {
      var d = shared(ALL[gi], answer);
      if (d > known) known = d;
    });
    if (known > 7) known = 7;                  // 8 only happens on the win
    var out = [], seen = {};
    guesses.forEach(function (gi) {
      var e = ALL[gi];
      if (shared(e, answer) !== known) return;
      var t = taxonAt(e, known);
      if (!seen[t]) { seen[t] = 1; out.push(t); }
    });
    return { known: known, ruledOut: out };
  }

  function guess(id) {
    if (over) return;
    var e = byId[id];
    if (!e) return;
    if (guesses.indexOf(e.i) >= 0) return A.toast("Already guessed " + e.n, true);
    guesses.push(e.i);
    var d = shared(e, answer);
    paint();
    save();
    if (d === 8) { A.sfx("win"); end(true); return; }
    A.sfx(d >= 5 ? "ok" : d >= 3 ? "near" : "miss");
  }

  /* ── painting ────────────────────────────────────────────────────────── */

  var RANK_LABEL = ["DOMAIN", "KINGDOM", "PHYLUM", "CLASS", "ORDER", "FAMILY", "GENUS", "SPECIES"];

  function paint() {
    var k = knowledge();
    paintLadder(k);
    paintStatus(k);
    paintList();
  }

  function paintLadder(k) {
    var best = bestGuess();
    var html = "";
    for (var i = 0; i < NR; i++) {
      var state = over && i >= k.known ? "found"
        : i < k.known ? "on"
          : i === k.known ? "edge" : "off";
      var name = "";
      if (i < k.known && best) name = taxonAt(best, i);
      else if (over) name = taxonAt(answer, i);

      var gl = name && GLOSS[name] ? GLOSS[name] : "";
      html += '<div class="rung ' + state + '">' +
        '<span class="rk">' + RANK_LABEL[i] + "</span>" +
        '<span class="tx">' + (name ? A.esc(name) : "&middot;") +
        (gl ? ' <i class="gl">' + A.esc(gl) + "</i>" : "") + "</span>" +
        "</div>";
      if (i === k.known && !over && k.ruledOut.length) {
        html += '<div class="ruled"><span class="rk">NOT</span><span class="chips">' +
          k.ruledOut.map(function (t) {
            return '<b>' + A.esc(t) + "</b>";
          }).join("") + "</span></div>";
      }
    }
    ladderEl.innerHTML = html;
    var c = board.querySelector("#lad-count");
    if (c) c.textContent = over ? "solved" : k.known + " of 8 rungs";
  }

  function bestGuess() {
    var b = null, bd = -1;
    guesses.forEach(function (gi) {
      var d = shared(ALL[gi], answer);
      if (d > bd) { bd = d; b = ALL[gi]; }
    });
    return b;
  }

  function paintStatus(k) {
    if (over) {
      statusEl.innerHTML = "";
      return;
    }
    if (!guesses.length) {
      statusEl.innerHTML = "Name anything alive. Something far from an animal tells you " +
        "as much as something near one.";
      return;
    }
    var b = bestGuess();
    statusEl.innerHTML = "closest so far <b>" + A.esc(b.n) + "</b> &middot; shared down to <b>" +
      RANK_LABEL[k.known - 1].toLowerCase() + "</b>" +
      (k.known ? " (" + A.esc(taxonAt(b, k.known - 1)) + ")" : "");
    if (!k.known) statusEl.innerHTML = "closest so far <b>" + A.esc(b.n) +
      "</b> &middot; not even the same domain of life";
  }

  function paintList() {
    var sorted = guesses.slice().sort(function (x, y) {
      return shared(ALL[y], answer) - shared(ALL[x], answer);
    });
    listEl.innerHTML = "";
    sorted.forEach(function (gi) {
      var e = ALL[gi], d = shared(e, answer), win = d === 8;
      var row = A.el("div", "gr" + (win ? " win" : ""));
      var bars = "";
      for (var i = 0; i < NR; i++) bars += '<i class="' + (i < d ? "f" : "") + '"></i>';
      row.innerHTML = '<span class="bars">' + bars + "</span>" +
        '<span class="nm">' + A.esc(e.n) + "</span>" +
        '<span class="dv">' + (win ? "FOUND"
          : d === 0 ? "different domain" : "parts at " + RANK_LABEL[d].toLowerCase()) + "</span>";
      listEl.appendChild(row);
    });
  }

  /* ── persistence ─────────────────────────────────────────────────────── */

  function save() {
    if (practice) return;
    A.save(ID, day, { guesses: guesses, answer: answer.s });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st && st.guesses) {
      // A pool change would otherwise resurrect indices that mean something
      // else entirely; drop anything out of range rather than mislead.
      guesses = st.guesses.filter(function (i) { return byId[i] !== undefined; });
    }
    paint();
    if (st && st.done) {
      over = true; finished = true; revealed = !st.won;
      picker.disable(true);
      paint();
      setTimeout(function () { sheet(st.won, st.norm || 0, st.shareGrid || []); }, 240);
    }
  }

  /* ── ending ──────────────────────────────────────────────────────────── */

  /* Share grid: the SHAPE of the descent. One row per guess, one cell per rung
     reached. Blue is ground you already held, green is ground this guess won.
     A guess that taught you nothing draws a flat blue line; the row that
     suddenly runs long is the moment you cracked it. */
  function buildGrid() {
    var rows = [], held = 0;
    guesses.forEach(function (gi) {
      var d = shared(ALL[gi], answer);
      var line = "";
      for (var i = 0; i < d; i++) line += i < held ? "🟦" : "🟩";
      if (!line) line = "⬛";
      rows.push(line);
      if (d > held) held = d;
    });
    if (rows.length > 15) {
      rows = rows.slice(0, 2).concat(["⋯ " + (rows.length - 12) + " more"], rows.slice(-10));
    }
    return rows;
  }

  function end(won) {
    if (finished) return;          // A.finish() exactly once, ever
    finished = true;
    over = true;
    picker.disable(true);
    paint();

    var n = guesses.length;
    var norm = won ? A.clamp(Math.round(WIN_BASE - WIN_STEP * n), WIN_FLOOR, 100) : 0;
    var grid = buildGrid();
    var detail = won ? n + (n === 1 ? " guess" : " guesses") : "gave up";

    if (!practice) {
      A.finish(ID, day, {
        score: won ? n : 0, norm: norm, won: won, detail: detail,
        bucket: !won ? "x" : n <= 3 ? "1-3" : n <= 5 ? "4-5" : n <= 8 ? "6-8"
          : n <= 12 ? "9-12" : "13+",
        shareGrid: grid, durationMs: Date.now() - t0,
      });
    }
    if (won) A.confetti(n <= 5 ? 130 : 70);

    // Never inside requestAnimationFrame: a background tab pauses rAF and the
    // sheet then silently never appears.
    sheet(won, norm, grid);
  }

  function sheet(won, norm, grid) {
    var lin = [];
    for (var i = 0; i < NR; i++) lin.push(taxonAt(answer, i));
    var extra =
      '<p class="center" style="margin:var(--sp-3) 0 2px">' +
      '<b style="font-size:var(--t-lg);letter-spacing:.04em">' + A.esc(answer.n) + "</b></p>" +
      '<p class="center tiny" style="font-style:italic;color:var(--ink-3)">' + A.esc(answer.s) + "</p>" +
      '<p class="center tiny muted" style="margin-top:var(--sp-2);line-height:1.55">' +
      A.esc(answer.d) + "</p>" +
      '<p class="center tiny" style="margin-top:var(--sp-3);color:var(--ink-4);' +
      'letter-spacing:.06em;line-height:1.8">' + lin.map(A.esc).join(" &rsaquo; ") + "</p>";

    A.results(ID, practice ? A.PRACTICE : day, {
      title: !won ? "NEXT TIME"
        : guesses.length <= 3 ? "UNCANNY"
          : guesses.length <= 6 ? "CLEAN DESCENT"
            : guesses.length <= 10 ? "GOT THERE" : "THE LONG WAY DOWN",
      extraHTML: extra,
      state: { norm: norm, shareGrid: grid, won: won },
      shareText: "PHYLO (practice) — " + (won ? guesses.length + " guesses" : "gave up") +
        "\n" + grid.join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  /* ── debug hooks: drive the real handlers, never a private copy ───────── */
  window.__PH = {
    answer: function () { return answer; },
    pool: function () { return { all: ALL.length, answers: POOL.length }; },
    shared: shared,
    guessByName: function (name) {
      var q = A.normName(name), hit = null;
      ALL.forEach(function (e) {
        if (hit) return;
        if (A.normName(e.n) === q || A.normName(e.s) === q) hit = e;
      });
      if (!hit) throw new Error("no organism called " + name);
      return hit;
    },
    state: function () {
      return {
        guesses: guesses.map(function (i) { return ALL[i].n; }),
        known: knowledge().known, ruledOut: knowledge().ruledOut,
        over: over, finished: finished, revealed: revealed,
      };
    },
  };
})();
