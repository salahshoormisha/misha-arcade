/* ============================================================================
   LINXICON — chain two far-apart words through meaning.
   ----------------------------------------------------------------------------
   Two words with nothing in common. Build a chain between them where every
   consecutive pair is a real link. The rule is the one _build/sem_linkgraph.py
   documents, evaluated live in the browser by games/linxicon/sem.js:

       u–v is a LINK  IFF  at least two people in the Small World of Words norms
                           answered one of these words with the other
                     OR    cos(u, v) >= TAU.

   THE TENSION THE WHOLE GAME RUNS ON. The warm move is the timid move. Stepping
   to a near-synonym always gets you closer and always scores badly; the leap
   that barely counts as a link is the one worth points. A player chasing the
   warmth bar will finish and score 55.

   BOLDNESS of one step, from its cosine — matches _build/sem_gen_linxicon.py:
       bold(c) = clamp(round(100 * (0.75 - c) / 0.55), 0, 100)
     c = 0.75 near-synonym → 0 · c = TAU, the loosest legal vector step → 78
     c = 0.20, a human association the vectors cannot even see → 100

   NORM (cross-game 0-100 currency, CONTRACT §3):
       E = clamp(round(100 * knownBest / linksUsed), 0, 100)   efficiency
       B = mean boldness over the steps you actually played
       won  → clamp(round(0.55 E + 0.45 B) − 18 per hint − wobbles, 10, 100)
       lost → clamp(round(15 × how far you got), 0, 15)
     wobbles = rejected words + undos; the first 3 are free, then 2 each, −20 max.
   Matching the known route with ordinary steps is ~90. Taking one link more
   than the book with middling steps is ~74. A 100 needs the shortest chain AND
   a maximal leap every single time, which is not a thing you do by accident.

   PAR is computed from the shipped route's own boldness, so a day whose only
   known route is timid does not quietly demand a 90.
   ========================================================================== */
(function () {
  "use strict";

  /* ── constants ────────────────────────────────────────────────────────────
     All of them above every first use: `var` initialisers do NOT hoist, and a
     constant read by a function that runs during boot would be undefined. */

  var ID = "linxicon";
  var BOLD_HI = 0.75;            // cosine at which a step scores 0 boldness
  var BOLD_LO = 0.20;            // cosine at which it scores 100
  var W_EFF = 0.55, W_BOLD = 0.45;
  var HINT_COST = 18, MAX_HINTS = 2;
  var FREE_WOBBLES = 3, WOBBLE_COST = 2, WOBBLE_MAX = 20;
  var SLACK = 4;                 // links you may spend beyond the known route
  var SCAN = 4200;               // hint search universe (the commonest words)
  var BANDS = [
    { at: 85, sq: "🟦", name: "leap" },
    { at: 65, sq: "🟩", name: "stride" },
    { at: 45, sq: "🟨", name: "step" },
    { at: 0, sq: "⬜", name: "shuffle" }
  ];

  var HELP =
    "<p>Two words that have nothing to do with each other. Get from one to the " +
    "other by typing words, where <b>every consecutive pair really is linked</b>.</p>" +
    "<p>A pair counts as linked if people in a large word-association study answered " +
    "one with the other, or if the two words sit close enough together in a model of " +
    "meaning. Both tests are running in your browser — nothing is being made up on " +
    "the spot, and nothing is phoning home.</p>" +
    "<ul>" +
    "<li><b>Bold steps score. Timid ones don't.</b> Stepping to a near-synonym is worth " +
    "almost nothing. The leap that <i>only just</i> counts as a link is worth the most.</li>" +
    "<li>The <b>CLOSING IN</b> bar says how near you are to the far word — which is useful, " +
    "and also a trap: the warm move is nearly always the timid one.</li>" +
    "<li>Fewer links is better. You get a few spare ones, then the chain snaps.</li>" +
    "<li>A word that isn't in the dictionary, or that doesn't link, is a <b>wobble</b>. " +
    "So is an undo. Your first three are free; after that they cost a couple of points each.</li>" +
    "<li><b>STEPPING STONE</b> plays a link for you. It costs 18 points and you can have two.</li>" +
    "<li>The chain length we quote is the shortest route <i>we</i> know of. Beat it and " +
    "we'll say so.</li></ul>";

  /* ── the data, defensively ───────────────────────────────────────────── */

  var DATA = window.AD_LINXICON || {};
  var PUZZLES = (DATA.puzzles || []).filter(function (p) {
    return p && p.a && p.b && p.n >= 2 && p.path && p.path.length === p.n + 1;
  });

  /* ── state ───────────────────────────────────────────────────────────── */

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var puz = null, startId = -1, targetId = -1, farStart = 0;
  var chain = [], edges = [], wobbles = 0, hints = 0;
  var over = false, won = false, t0 = Date.now();
  var main, gameEl, loadEl, barEl, msgEl, chainEl, warmEl, warmBar, input, addBtn;
  var hintBtn, undoBtn, giveBtn, capEl;

  /* ── scoring ─────────────────────────────────────────────────────────── */

  function clamp(n, lo, hi) { return n < lo ? lo : n > hi ? hi : n; }

  function bold(c) {
    return clamp(Math.round(100 * (BOLD_HI - c) / (BOLD_HI - BOLD_LO)), 0, 100);
  }

  function bandOf(b) {
    for (var i = 0; i < BANDS.length; i++) if (b >= BANDS[i].at) return BANDS[i];
    return BANDS[BANDS.length - 1];
  }

  function meanBold(list) {
    if (!list.length) return 0;
    var s = 0;
    for (var i = 0; i < list.length; i++) s += list[i].bold;
    return s / list.length;
  }

  function wobblePenalty(w) {
    return clamp((w - FREE_WOBBLES) * WOBBLE_COST, 0, WOBBLE_MAX);
  }

  /* THE NORM FORMULA. Exposed on the debug hook so a test can check it without
     playing a whole game — and played through the real buttons as well. */
  function normFor(links, meanB, nHints, nWobbles, w, warmth) {
    if (!w) return clamp(Math.round(15 * warmth), 0, 15);
    var e = clamp(Math.round(100 * puz.n / Math.max(1, links)), 0, 100);
    var raw = Math.round(W_EFF * e + W_BOLD * meanB)
      - HINT_COST * nHints - wobblePenalty(nWobbles);
    return clamp(raw, 10, 100);
  }

  function liveNorm() {
    return normFor(edges.length, meanBold(edges), hints, wobbles, won, warmth());
  }

  // How much of the gap between the two endpoints you have closed. 0 at the
  // start word; 1 once you are standing somewhere a link to the far word is
  // plausible. It is a guide, not a promise — an association link can fire from
  // a cold word, which is exactly the sort of move that scores.
  function warmth() {
    if (!SEM.ready || !chain.length) return 0;
    var here = SEM.cos(SEM.id(chain[chain.length - 1]), targetId);
    var span = SEM.tau - farStart;
    if (span <= 0) return 1;
    return clamp((here - farStart) / span, 0, 1);
  }

  function cap() { return puz.n + SLACK; }

  /* ── puzzle selection ────────────────────────────────────────────────── */

  function pickPuzzle() {
    if (!PUZZLES.length) return null;
    if (practice) return A.pick(A.rng(String(Date.now()) + Math.random()), PUZZLES);
    return PUZZLES[A.dailyIndex(ID, day, PUZZLES.length)];
  }

  A.setPar(ID, function (dayN) {
    if (!PUZZLES.length) return null;
    var p = PUZZLES[A.dailyIndex(ID, dayN, PUZZLES.length)];
    if (!p) return null;
    // What the shipped route itself would score, discounted: nobody matches the
    // book every day, and a day whose known route is timid must not demand 90.
    return clamp(Math.round((W_EFF * 100 + W_BOLD * (p.rb || 70)) * 0.80), 55, 82);
  });

  /* ── boot ────────────────────────────────────────────────────────────── */

  function boot() {
    main = A.mount({ id: ID, dayN: day, help: HELP });

    if (!PUZZLES.length || !window.SEM || !SEM.n) {
      main.innerHTML = '<p class="center muted" style="padding:var(--sp-7) 0;line-height:1.8">' +
        "No chains loaded.<br>Check <b>core/data/linxicon.js</b> and " +
        "<b>core/data/semantic.js</b>.</p>";
      return;
    }

    puz = pickPuzzle();
    startId = SEM.id(puz.a);
    targetId = SEM.id(puz.b);
    chain = [puz.a];

    var top = A.el("div", "lx-top ac-row");
    top.innerHTML =
      '<button class="ac-pill" id="lx-arch">ARCHIVE</button>' +
      '<span class="ac-pill" id="lx-cap"></span>' +
      (practice ? '<a class="ac-pill" href="./">TODAY\'S PAIR</a>'
        : '<a class="ac-pill" href="?practice=1">PRACTICE</a>');
    main.appendChild(top);
    top.querySelector("#lx-arch").onclick = function () { A.archiveModal(ID); };
    capEl = top.querySelector("#lx-cap");

    /* The pair goes up straight away — you can start thinking while the
       dictionary downloads. */
    chainEl = A.el("div"); chainEl.id = "lx-chain";
    main.appendChild(chainEl);

    loadEl = A.el("div", "lx-load");
    loadEl.innerHTML =
      '<p class="tiny muted center">Fetching the model of meaning — 2 MB, once. ' +
      "Your browser keeps it after this.</p>" +
      '<div class="ac-bar"><i id="lx-bar" style="width:4%"></i></div>' +
      '<p class="tiny dim center" id="lx-msg">starting</p>';
    main.appendChild(loadEl);
    barEl = loadEl.querySelector("#lx-bar");
    msgEl = loadEl.querySelector("#lx-msg");

    gameEl = A.el("div", "lx-game");
    gameEl.hidden = true;
    gameEl.innerHTML =
      '<div class="lx-warm"><div class="ac-bar"><i id="lx-warmbar" style="width:0%"></i></div>' +
      '<p class="tiny dim center" id="lx-warmtxt">closing in 0%</p></div>' +
      '<form class="lx-form" id="lx-form" autocomplete="off">' +
      '<input id="lx-word" type="text" inputmode="text" autocapitalize="off" ' +
      'autocorrect="off" spellcheck="false" maxlength="24" ' +
      'aria-label="Your next word" placeholder="next word">' +
      '<button class="ac-btn" id="lx-add" type="submit">LINK</button></form>' +
      '<div class="lx-tools ac-row">' +
      '<button class="ac-pill" id="lx-hint" type="button">STEPPING STONE</button>' +
      '<button class="ac-pill" id="lx-undo" type="button">UNDO</button>' +
      '<button class="ac-pill" id="lx-give" type="button">GIVE UP</button></div>';
    main.appendChild(gameEl);

    warmBar = gameEl.querySelector("#lx-warmbar");
    warmEl = gameEl.querySelector("#lx-warmtxt");
    input = gameEl.querySelector("#lx-word");
    addBtn = gameEl.querySelector("#lx-add");
    hintBtn = gameEl.querySelector("#lx-hint");
    undoBtn = gameEl.querySelector("#lx-undo");
    giveBtn = gameEl.querySelector("#lx-give");

    gameEl.querySelector("#lx-form").addEventListener("submit", function (e) {
      e.preventDefault();
      submit();
    });
    hintBtn.onclick = doHint;
    undoBtn.onclick = doUndo;
    giveBtn.onclick = function () {
      if (over) return;
      A.modal("Give up?", '<p>The chain stays where it is and the day is scored on how ' +
        "far you got.</p>" +
        '<div class="ac-row" style="margin-top:var(--sp-4)">' +
        '<button class="ac-btn" id="lx-yes">Give up</button>' +
        '<button class="ac-btn ghost" id="lx-no">Keep going</button></div>',
        { onOpen: function (m) {
          m.body.querySelector("#lx-yes").onclick = function () { m.close(); end(false); };
          m.body.querySelector("#lx-no").onclick = function () { m.close(); };
        } });
    };

    render();

    SEM.load(function (n, total) {
      barEl.style.width = Math.round(100 * n / total) + "%";
      msgEl.textContent = n + " of " + total;
    }, function (ok) {
      if (!ok) {
        loadEl.innerHTML = '<p class="center muted">Couldn\'t load the dictionary. ' +
          "It's a big file — check your connection.</p>" +
          '<div class="ac-row" style="margin-top:var(--sp-3)">' +
          '<button class="ac-btn" id="lx-retry">Try again</button></div>';
        loadEl.querySelector("#lx-retry").onclick = function () { location.reload(); };
        return;
      }
      farStart = SEM.cos(startId, targetId);
      loadEl.remove();
      // Reveal synchronously after a forced reflow — NEVER inside rAF, which a
      // background tab pauses, and this is exactly the moment the player is
      // most likely to have switched away to something else.
      gameEl.hidden = false;
      void gameEl.offsetHeight;
      gameEl.classList.add("in");
      restore();
    });
  }

  /* ── play ────────────────────────────────────────────────────────────── */

  function last() { return chain[chain.length - 1]; }

  function used(w) {
    for (var i = 0; i < chain.length; i++) if (chain[i] === w) return true;
    return false;
  }

  function wobble(msg) {
    wobbles++;
    A.toast(msg, true);
    A.sfx("bad");
    if (input) {
      input.classList.add("ac-shake");
      setTimeout(function () { input.classList.remove("ac-shake"); }, 420);
    }
    render();
    save();
  }

  function submit() {
    if (over || !SEM.ready) return;
    var w = String(input.value || "").trim().toLowerCase().replace(/[^a-z'-]/g, "");
    input.value = "";
    if (!w) return;
    var id = SEM.id(w);
    if (id < 0) return wobble("“" + w.toUpperCase() + "” isn't in this dictionary");
    if (used(w)) return wobble("Already in the chain");
    var from = SEM.id(last());
    if (!SEM.link(from, id)) {
      return wobble("No link from " + last().toUpperCase() + " to " + w.toUpperCase());
    }
    addStep(id, false);
  }

  /* One accepted link. The only place the chain grows. */
  function addStep(id, viaHint) {
    var from = SEM.id(last());
    var c = SEM.cos(from, id);
    edges.push({ a: last(), b: SEM.word(id), c: c, bold: bold(c), why: SEM.why(from, id), hint: !!viaHint });
    chain.push(SEM.word(id));
    A.sfx(bold(c) >= 65 ? "ok" : "near");

    if (id === targetId) { render(); save(); return end(true); }

    // The far word joins itself the moment it is reachable — you never have to
    // type it, and the closing link counts for boldness like any other.
    if (SEM.link(id, targetId)) {
      var cc = SEM.cos(id, targetId);
      edges.push({ a: SEM.word(id), b: puz.b, c: cc, bold: bold(cc), why: SEM.why(id, targetId), hint: false });
      chain.push(puz.b);
      render(); save();
      return end(true);
    }

    render();
    save();
    if (edges.length >= cap()) end(false);
  }

  function doUndo() {
    if (over || !SEM.ready || chain.length < 2) return;
    chain.pop();
    edges.pop();
    wobbles++;
    A.sfx("type");
    render();
    save();
  }

  /* STEPPING STONE — a real search, not a peek at the shipped route. Scan the
     commonest words for something that links from where you are; prefer one
     that also reaches the far word, and among those take the boldest bridge, so
     the hint costs you points but does not hand you a limp chain. */
  function doHint() {
    if (over || !SEM.ready || hints >= MAX_HINTS) return;
    var from = SEM.id(last());
    var bestClose = null, bestCloseScore = -1;
    var bestWarm = null, bestWarmScore = -2;
    var lim = Math.min(SCAN, SEM.n);
    for (var i = 0; i < lim; i++) {
      if (i === from || i === targetId || used(SEM.word(i))) continue;
      if (!SEM.link(from, i)) continue;
      var c1 = SEM.cos(from, i);
      if (SEM.link(i, targetId)) {
        var s = bold(c1) + bold(SEM.cos(i, targetId));
        if (s > bestCloseScore) { bestCloseScore = s; bestClose = i; }
      } else {
        var t = SEM.cos(i, targetId);
        if (t > bestWarmScore) { bestWarmScore = t; bestWarm = i; }
      }
    }
    var pickId = bestClose !== null ? bestClose : bestWarm;
    if (pickId === null || pickId === undefined) {
      A.toast("Nothing to offer from here — try an undo", true);
      return;
    }
    hints++;
    A.sfx("reveal");
    A.toast("Stepping stone: " + SEM.word(pickId).toUpperCase() + " (−" + HINT_COST + ")");
    addStep(pickId, true);
  }

  /* ── rendering ───────────────────────────────────────────────────────── */

  function render() {
    var h = "";
    for (var i = 0; i < chain.length; i++) {
      if (i > 0) {
        var e = edges[i - 1];
        h += '<div class="lx-edge' + (e.hint ? " hinted" : "") + '">' +
          '<span class="lx-rail"></span>' +
          '<span class="lx-meter"><i style="width:' + e.bold + '%"></i></span>' +
          "<b>" + e.bold + "</b>" +
          '<em>' + (e.why === "assoc" ? "people say so" : "close in meaning") +
          (e.hint ? " · stone" : "") + "</em></div>";
      }
      var cls = i === 0 ? "lx-node start" : "lx-node";
      if (over && i === chain.length - 1 && chain[i] === puz.b) cls = "lx-node target done";
      h += '<div class="' + cls + '">' + A.esc(chain[i].toUpperCase()) + "</div>";
    }
    if (!over || chain[chain.length - 1] !== puz.b) {
      h += '<div class="lx-edge open"><span class="lx-rail"></span><em>' +
        (edges.length >= cap() ? "chain snapped" : "still no link") + "</em></div>";
      h += '<div class="lx-node target">' + A.esc(puz.b.toUpperCase()) + "</div>";
    }
    chainEl.innerHTML = h;

    if (capEl) {
      capEl.innerHTML = "<b>" + edges.length + "</b>/" + cap() + " LINKS · BOOK <b>" +
        puz.n + "</b>";
    }
    if (warmBar) {
      var w = warmth();
      warmBar.style.width = Math.round(100 * w) + "%";
      warmEl.textContent = over ? (won ? "linked" : "no link") : "closing in " + Math.round(100 * w) + "%";
    }
    if (hintBtn) {
      hintBtn.disabled = over || hints >= MAX_HINTS;
      hintBtn.textContent = hints ? "STEPPING STONE (" + (MAX_HINTS - hints) + ")" : "STEPPING STONE";
      undoBtn.disabled = over || chain.length < 2;
      giveBtn.disabled = over;
      addBtn.disabled = over;
      input.disabled = over;
    }
  }

  /* ── persistence ─────────────────────────────────────────────────────── */

  function playState() {
    return {
      chain: chain.slice(),
      edges: edges.map(function (e) { return { a: e.a, b: e.b, c: e.c, bold: e.bold, why: e.why, hint: e.hint }; }),
      wobbles: wobbles, hints: hints, pa: puz.a, pb: puz.b
    };
  }

  function save() {
    if (practice || over) return;
    A.save(ID, day, playState());
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st && st.pa === puz.a && st.pb === puz.b && st.chain && st.chain.length) {
      chain = st.chain.slice();
      edges = (st.edges || []).slice();
      wobbles = st.wobbles || 0;
      hints = st.hints || 0;
      if (st.done) { over = true; won = !!st.won; }
    }
    render();
    if (over) {
      setTimeout(function () { sheet(won, st && st.norm !== undefined ? st.norm : liveNorm()); }, 240);
    } else if (input) {
      input.focus();
    }
  }

  /* ── ending ──────────────────────────────────────────────────────────── */

  function shareRows() {
    var rows = [edges.map(function (e) { return bandOf(e.bold).sq; }).join("")];
    if (hints) rows.push("💡".repeat(hints));
    return rows;
  }

  function end(w) {
    over = true;
    won = w;
    var norm = liveNorm();
    var rows = shareRows();
    var detail = w ? edges.length + " link" + (edges.length === 1 ? "" : "s") : "no chain";

    if (!practice) {
      A.finish(ID, day, {
        score: norm, norm: norm, won: w, detail: detail,
        bucket: w ? String(edges.length) : "X",
        shareGrid: rows, durationMs: Date.now() - t0
      });
    }

    render();
    if (w) {
      A.sfx(edges.length <= puz.n ? "perfect" : "win");
      A.confetti(edges.length <= puz.n ? 140 : 80);
    } else {
      A.sfx("lose");
    }
    setTimeout(function () { sheet(w, norm); }, w ? 700 : 420);
  }

  function shareText(norm) {
    var head = "LINXICON " + (practice ? "(practice)" : "#" + day) + " · " +
      puz.a.toUpperCase() + " → " + puz.b.toUpperCase() + " · " + norm + "/100";
    return head + "\n" + shareRows().join("\n") + "\n" + A.SITE;
  }

  function sheet(w, norm) {
    var mb = Math.round(meanBold(edges));
    var eff = clamp(Math.round(100 * puz.n / Math.max(1, edges.length)), 0, 100);
    var html = "";

    html += '<div class="lx-sum">';
    edges.forEach(function (e) {
      html += '<div class="lx-srow"><span>' + A.esc(e.a.toUpperCase()) + " → " +
        A.esc(e.b.toUpperCase()) + "</span><b>" + e.bold + "</b><i>" +
        bandOf(e.bold).name + "</i></div>";
    });
    if (!edges.length) html += '<div class="lx-srow"><span>no links made</span></div>';
    html += "</div>";

    if (w) {
      html += '<div class="ac-row" style="margin-top:var(--sp-3)">' +
        '<span class="ac-pill">BOLDNESS <b>' + mb + "</b></span>" +
        '<span class="ac-pill">EFFICIENCY <b>' + eff + "</b></span>" +
        (hints ? '<span class="ac-pill">' + hints + " STONE" + (hints > 1 ? "S" : "") + "</span>" : "") +
        (wobbles > FREE_WOBBLES ? '<span class="ac-pill">−' + wobblePenalty(wobbles) + " WOBBLES</span>" : "") +
        "</div>";
    }
    if (w && edges.length < puz.n) {
      html += '<p class="lx-beat">You beat the book — the shortest route we knew was ' +
        puz.n + " links.</p>";
    }
    html += '<p class="lx-route"><b>One route that works</b><br>' +
      puz.path.map(function (x) { return A.esc(x.toUpperCase()); }).join(" → ") + "</p>";
    if (w && mb < 55) {
      html += '<p class="tiny dim center">Every link legal, every link tame. ' +
        "The points are in the leaps.</p>";
    }

    var m = A.results(ID, practice ? A.PRACTICE : day, {
      title: w ? (norm >= 90 ? "SPECTACULAR" : norm >= 78 ? "STRONG" : norm >= 62 ? "SOLID" : "GOT THERE")
        : "NO CHAIN",
      lines: [w ? (edges.length + " link" + (edges.length === 1 ? "" : "s") + " · book says " + puz.n)
        : "you closed " + Math.round(100 * warmth()) + "% of the gap"],
      extraHTML: html,
      state: { norm: norm, shareGrid: shareRows(), won: w },
      shareText: shareText(norm),
      onReplay: function () { location.reload(); }
    });

    // Own the share text in every mode — the core only reads opts.shareText
    // when dayN is PRACTICE.
    var sb = m.body.querySelector("#ac-share");
    if (sb) sb.onclick = function () { A.share(shareText(norm)); };
    return m;
  }

  /* ── register + debug hook ───────────────────────────────────────────── */

  A.register({
    id: ID, name: "LINXICON", tagline: "chain two far-apart words through meaning",
    icon: "🔗", accent: "--cool", family: "sem", parMs: 240000,
    hasArchive: true, hasPractice: true
  });

  // Enough to play a whole day headlessly — but every one of these drives the
  // same code the buttons drive, and the tests use the buttons.
  window.__LX = {
    puzzle: function () {
      return puz && { a: puz.a, b: puz.b, n: puz.n, rb: puz.rb, path: puz.path.slice(), cap: cap() };
    },
    state: function () {
      return {
        chain: chain.slice(), links: edges.length, bolds: edges.map(function (e) { return e.bold; }),
        wobbles: wobbles, hints: hints, over: over, won: won, day: day, practice: practice,
        norm: liveNorm(), warmth: warmth(), ready: !!(window.SEM && SEM.ready)
      };
    },
    play: function (w) { input.value = w; submit(); return this.state(); },
    bold: bold, normFor: normFor, wobblePenalty: wobblePenalty,
    link: function (a, b) { return SEM.link(SEM.id(a), SEM.id(b)); },
    solve: function () {                      // walk the shipped route, no hints
      for (var i = 1; i < puz.path.length && !over; i++) this.play(puz.path[i]);
      return this.state();
    }
  };

  boot();
})();
