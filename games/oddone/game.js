/* ============================================================================
   ODD ONE OUT — four share a thread, one is an impostor.
   ----------------------------------------------------------------------------
   Three rounds a morning. Each round is five words: four of them are cues that
   thousands of people in the Small World of Words norms answered with the same
   word, and that word is the thread's name. The fifth sits nearby and is not
   one of them. Call the impostor, then name the thread.

   Everything that decides whether a board is fair happened in
   _build/sem_gen_oddone.py and is finished before the page loads — this cabinet
   ships the verdict, not the 2.2 MB vector table LINXICON pulls down.

   ONE TAP, COMMITTED. There is no second guess at either question. A five-way
   choice you can retry until it goes green is not a question, it is a
   formality, and the whole cabinet lives or dies on the boards having exactly
   one defensible answer — so it has to be answered once.

   NORM (cross-game 0-100 currency, CONTRACT §3). Per round:
       impostor called      3
       thread named         1
       both, same round     1   (the sweep — naming a thread you mis-called
                                 proves less than naming one you called)
   so 5 a round, 15 a day, and norm = round(100 * points / 15).
       all three rounds swept .................. 100   (nothing given away)
       three impostors, two names .............. 87
       three impostors, one name ............... 73    <- a solid day
       two impostors, one name, one sweep ...... 53
       one impostor, one name, that same round . 33
   WON means every impostor called. Naming is the flourish; calling the impostor
   is the game, and a day where you missed one is not a day you won.
   ========================================================================== */
(function () {
  "use strict";

  /* ── constants ────────────────────────────────────────────────────────────
     Above every first use. `var` initialisers do NOT hoist, and A.setPar below
     runs whenever the core asks — which can be during another cabinet's boot. */

  var ID = "oddone";
  var PT_ODD = 3, PT_NAME = 1, PT_SWEEP = 1;
  var SQ_ODD = "🟩", SQ_NAME = "🟨", SQ_MISS = "⬛";
  var KEYS = ["1", "2", "3", "4", "5"];

  var HELP =
    "<p>Five words. <b>Four of them belong to one thread; one is an impostor</b> " +
    "that only sits nearby. Tap the impostor, then say what the other four are.</p>" +
    "<p>The threads are not invented. In a large word-association study, thousands " +
    "of people were given a word and wrote down the first thing it made them think " +
    "of. Turn that round: every word that made lots of people write SPORT is a sport, " +
    "and SPORT is already the name of that group. The four are theirs. The impostor " +
    "is a word measured to sit outside the thread — not merely one nobody happened to " +
    "mention.</p>" +
    "<ul>" +
    "<li><b>One tap, no take-backs</b>, on both questions. Read all five first.</li>" +
    "<li>Calling the impostor is worth <b>3</b>. Naming the thread is worth <b>1</b>. " +
    "Doing both in the same round is worth <b>1</b> more.</li>" +
    "<li>You win the day by calling <b>all three</b> impostors. The names are the " +
    "flourish.</li>" +
    "<li>Every board was checked so that only one of the five can be argued for. " +
    "If you can argue for two, we got one wrong — and we would want to know.</li>" +
    "</ul>";

  /* ── the data, defensively ───────────────────────────────────────────────
     A generated file and its reader drift apart; THE DECIDER shipped broken for
     days that way. Anything malformed is dropped here rather than thrown. */

  var DATA = window.AD_ODDONE || {};
  var ROUNDS = (DATA.rounds || []).filter(function (r) {
    return r && r.w && r.w.length === 5 && r.n && r.n.length === 5;
  });
  var DAYS = (DATA.days || []).filter(function (d) {
    if (!d || !d.length) return false;
    for (var i = 0; i < d.length; i++) if (!ROUNDS[d[i]]) return false;
    return true;
  });

  /* ── state ───────────────────────────────────────────────────────────── */

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var cards = [];              // this morning's rounds, already shuffled
  var at = 0;                  // which round
  var phase = "odd";           // "odd" | "name" | "between"
  var picks = [];              // per round: {odd: word|null, name: word|null}
  var over = false, t0 = Date.now();
  var main, topEl, progEl, askEl, stripEl, boardEl, verdictEl;

  /* ── scoring ─────────────────────────────────────────────────────────── */

  function clamp(n, lo, hi) { return n < lo ? lo : n > hi ? hi : n; }

  function oddRight(i) { return !!picks[i] && picks[i].odd === cards[i].odd; }
  function nameRight(i) { return !!picks[i] && picks[i].name === cards[i].name; }

  function points() {
    var p = 0;
    for (var i = 0; i < cards.length; i++) {
      var a = oddRight(i), b = nameRight(i);
      if (a) p += PT_ODD;
      if (b) p += PT_NAME;
      if (a && b) p += PT_SWEEP;
    }
    return p;
  }

  function maxPoints() { return cards.length * (PT_ODD + PT_NAME + PT_SWEEP); }

  function called() {
    var n = 0;
    for (var i = 0; i < cards.length; i++) if (oddRight(i)) n++;
    return n;
  }

  function named() {
    var n = 0;
    for (var i = 0; i < cards.length; i++) if (nameRight(i)) n++;
    return n;
  }

  /* THE NORM FORMULA. On the debug hook too, so a test can check the curve
     without playing three rounds through the buttons — and then the tests play
     it through the buttons anyway. */
  function normFor(pts, max) {
    return clamp(Math.round(100 * pts / Math.max(1, max)), 0, 100);
  }

  function liveNorm() { return normFor(points(), maxPoints()); }
  function won() { return cards.length > 0 && called() === cards.length; }

  /* ── which rounds today ──────────────────────────────────────────────── */

  function seedFor(k) {
    return practice ? String(Date.now()) + ":" + Math.random() + ":" + k
      : ID + ":" + day + ":" + k;
  }

  /* One day's worth, each board's five words and five names shuffled by a
     seeded RNG so both players see the same board in the same order. */
  function deal(dayIdx) {
    var out = [];
    var list = DAYS[dayIdx] || [];
    for (var k = 0; k < list.length; k++) {
      var r = ROUNDS[list[k]];
      var rand = A.rng(seedFor(k));
      out.push({
        words: A.shuffle(rand, r.w),
        names: A.shuffle(rand, r.n),
        odd: r.w[4],
        thread: r.w.slice(0, 4),
        name: r.n[0],
        hard: r.d || 0
      });
    }
    return out;
  }

  function dayIndex() {
    if (!DAYS.length) return -1;
    if (practice) return Math.floor(A.rng(String(Date.now()) + Math.random())() * DAYS.length);
    return A.dailyIndex(ID, day, DAYS.length);
  }

  A.setPar(ID, function (dayN) {
    if (!DAYS.length) return null;
    var list = DAYS[A.dailyIndex(ID, dayN, DAYS.length)];
    if (!list || !list.length) return null;
    var h = 0;
    for (var i = 0; i < list.length; i++) h += (ROUNDS[list[i]].d || 0);
    h /= list.length;
    // An easy morning is one where every impostor is plain, which is most of
    // the points; a hard one is where two of them argue back.
    return clamp(Math.round(90 - 0.42 * h), 58, 88);
  });

  /* ── boot ────────────────────────────────────────────────────────────── */

  function boot() {
    main = A.mount({ id: ID, dayN: day, help: HELP });

    var di = dayIndex();
    if (di < 0) {
      main.innerHTML = '<p class="center muted" style="padding:var(--sp-7) 0;line-height:1.8">' +
        "No boards loaded.<br>Check <b>core/data/oddone.js</b>.</p>";
      return;
    }
    cards = deal(di);
    for (var i = 0; i < cards.length; i++) picks.push({ odd: null, name: null });

    topEl = A.el("div", "oo-top ac-row");
    topEl.innerHTML =
      '<button class="ac-pill" id="oo-arch">ARCHIVE</button>' +
      '<span class="ac-pill" id="oo-count"></span>' +
      (practice ? '<a class="ac-pill" href="./">TODAY\'S BOARDS</a>'
        : '<a class="ac-pill" href="?practice=1">PRACTICE</a>');
    main.appendChild(topEl);
    topEl.querySelector("#oo-arch").onclick = function () { A.archiveModal(ID); };

    progEl = A.el("div", "oo-prog");
    main.appendChild(progEl);

    askEl = A.el("div", "oo-ask");
    main.appendChild(askEl);

    stripEl = A.el("div", "oo-strip");
    main.appendChild(stripEl);

    boardEl = A.el("div");
    boardEl.id = "oo-board";
    main.appendChild(boardEl);

    verdictEl = A.el("div", "oo-verdict");
    main.appendChild(verdictEl);

    document.addEventListener("keydown", onKey);

    restore();
  }

  function onKey(e) {
    if (over || document.querySelector(".ac-modal.show")) return;
    if (phase === "between") {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nextRound(); }
      return;
    }
    var k = KEYS.indexOf(e.key);
    if (k < 0) return;
    var btns = boardEl.querySelectorAll(".oo-opt");
    if (btns[k] && !btns[k].disabled) { e.preventDefault(); btns[k].click(); }
  }

  /* ── play ────────────────────────────────────────────────────────────── */

  function choose(value) {
    if (over || phase === "between") return;
    var c = cards[at];
    if (phase === "odd") {
      if (picks[at].odd !== null) return;
      picks[at].odd = value;
      A.sfx(value === c.odd ? "ok" : "miss");
      phase = "name";
      save();
      render();
      return;
    }
    if (picks[at].name !== null) return;
    picks[at].name = value;
    A.sfx(value === c.name ? "ok" : "miss");
    phase = "between";
    save();
    render();
  }

  function nextRound() {
    if (over) return;
    if (at >= cards.length - 1) return end();
    at++;
    phase = "odd";
    save();
    render();
  }

  /* ── rendering ───────────────────────────────────────────────────────── */

  function optionHTML(label, i, cls, tag) {
    return '<button class="oo-opt' + (cls ? " " + cls : "") + '" data-v="' +
      A.esc(label) + '" type="button">' +
      '<span class="oo-num">' + (i + 1) + "</span>" +
      '<span class="oo-word">' + A.esc(label.toUpperCase()) + "</span>" +
      (tag ? '<span class="oo-tag">' + A.esc(tag) + "</span>" : "") +
      "</button>";
  }

  function render() {
    var c = cards[at];

    /* progress */
    var ph = "";
    for (var i = 0; i < cards.length; i++) {
      var cls = i === at && !over ? "now" : "";
      if (picks[i].odd !== null) cls = oddRight(i) ? "hit" : "miss";
      ph += '<i class="' + cls + '"></i>';
    }
    progEl.innerHTML = ph;

    var countEl = topEl.querySelector("#oo-count");
    if (countEl) {
      countEl.innerHTML = "ROUND <b>" + Math.min(at + 1, cards.length) + "</b>/" +
        cards.length + " · <b>" + points() + "</b>/" + maxPoints();
    }

    /* the question, the recap strip and the five options */
    var h = "", k;
    if (phase === "odd") {
      askEl.innerHTML = "which one <b>doesn't belong?</b>";
      stripEl.innerHTML = "";
      stripEl.hidden = true;
      for (k = 0; k < c.words.length; k++) h += optionHTML(c.words[k], k, "", "");
    } else {
      askEl.innerHTML = "and what are <b>the other four?</b>";
      stripEl.hidden = false;
      var sh = "";
      for (k = 0; k < c.words.length; k++) {
        var isOdd = c.words[k] === c.odd;
        sh += '<span class="oo-chip' + (isOdd ? " out" : "") + '">' +
          A.esc(c.words[k].toUpperCase()) + "</span>";
      }
      stripEl.innerHTML = sh;
      for (k = 0; k < c.names.length; k++) {
        var nm = c.names[k], cls = "", tag = "";
        if (phase === "between") {
          if (nm === c.name) { cls = "right"; tag = "the thread"; }
          else if (nm === picks[at].name) { cls = "wrong"; tag = "you"; }
          else cls = "faded";
        }
        h += optionHTML(nm, k, cls, tag);
      }
    }
    boardEl.innerHTML = h;

    var btns = boardEl.querySelectorAll(".oo-opt");
    for (k = 0; k < btns.length; k++) {
      if (phase === "between") { btns[k].disabled = true; continue; }
      btns[k].onclick = function () { choose(this.getAttribute("data-v")); };
    }

    /* between rounds: say what happened, then a button to move on */
    if (phase === "between") {
      var a = oddRight(at), b = nameRight(at);
      var line = a
        ? (b ? "Called it and named it." : "Called it. The thread was " + c.name.toUpperCase() + ".")
        : ("The impostor was " + c.odd.toUpperCase() + "." + (b ? " You named the thread, though." : ""));
      verdictEl.innerHTML = '<p class="tiny muted">' + A.esc(line) + "</p>" +
        '<button class="ac-btn" id="oo-next" type="button">' +
        (at >= cards.length - 1 ? "SEE THE MORNING" : "NEXT ROUND") + "</button>";
      verdictEl.querySelector("#oo-next").onclick = nextRound;
    } else {
      verdictEl.innerHTML = "";
    }
  }

  /* ── persistence ─────────────────────────────────────────────────────── */

  function playState() {
    return {
      at: at, phase: phase,
      picks: picks.map(function (p) { return { odd: p.odd, name: p.name }; }),
      sig: cards.map(function (c) { return c.odd; }).join("|")
    };
  }

  function save() {
    if (practice || over) return;
    A.save(ID, day, playState());
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st && st.sig === cards.map(function (c) { return c.odd; }).join("|") && st.picks) {
      picks = st.picks.map(function (p) { return { odd: p.odd, name: p.name }; });
      while (picks.length < cards.length) picks.push({ odd: null, name: null });
      at = clamp(st.at || 0, 0, cards.length - 1);
      phase = st.phase || "odd";
      if (st.done) over = true;
    }
    render();
    if (over) {
      setTimeout(function () { sheet(liveNorm()); }, 240);
    }
  }

  /* ── ending ──────────────────────────────────────────────────────────── */

  function shareRows() {
    var rows = [];
    for (var i = 0; i < cards.length; i++) {
      rows.push((oddRight(i) ? SQ_ODD : SQ_MISS) + (nameRight(i) ? SQ_NAME : SQ_MISS));
    }
    return rows;
  }

  function end() {
    over = true;
    phase = "done";
    var norm = liveNorm();
    var w = won();
    var detail = called() + "/" + cards.length + " called · " + named() + " named";

    if (!practice) {
      A.finish(ID, day, {
        score: points(), norm: norm, won: w, detail: detail,
        bucket: String(called()), shareGrid: shareRows(),
        durationMs: Date.now() - t0
      });
    }

    render();
    if (w) {
      A.sfx(norm >= 100 ? "perfect" : "win");
      A.confetti(norm >= 100 ? 140 : 80);
    } else {
      A.sfx("lose");
    }
    setTimeout(function () { sheet(norm); }, w ? 700 : 420);
  }

  function shareText(norm) {
    var head = "ODD ONE OUT " + (practice ? "(practice)" : "#" + day) + " · " +
      norm + "/100";
    return [head].concat(shareRows(), [A.SITE]).join("\n");
  }

  function sheet(norm) {
    var html = '<div class="oo-sum">';
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      html += '<div class="oo-srow"><span>' +
        A.esc(c.thread.map(function (x) { return x.toUpperCase(); }).join(" · ")) +
        "</span><b>" + A.esc(c.name.toUpperCase()) + "</b><i>" +
        (oddRight(i) ? "called " : "missed ") + A.esc(c.odd.toUpperCase()) + "</i></div>";
    }
    html += "</div>";
    html += '<div class="ac-row" style="margin-top:var(--sp-3)">' +
      '<span class="ac-pill">CALLED <b>' + called() + "</b>/" + cards.length + "</span>" +
      '<span class="ac-pill">NAMED <b>' + named() + "</b>/" + cards.length + "</span>" +
      '<span class="ac-pill">POINTS <b>' + points() + "</b>/" + maxPoints() + "</span></div>";

    var m = A.results(ID, practice ? A.PRACTICE : day, {
      title: won() ? (norm >= 100 ? "CLEAN SWEEP" : norm >= 87 ? "SHARP" : "ALL CALLED")
        : (called() ? "ONE GOT PAST YOU" : "TOMORROW, THEN"),
      lines: [called() + " of " + cards.length + " impostors called · " +
        named() + " thread" + (named() === 1 ? "" : "s") + " named"],
      extraHTML: html,
      state: { norm: norm, shareGrid: shareRows(), won: won() },
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
    id: ID, name: "ODD ONE OUT", tagline: "four share a thread. one is an impostor.",
    icon: "🃏", accent: "--gold", family: "sem", parMs: 150000,
    hasArchive: true, hasPractice: true
  });

  // Enough to play a whole morning headlessly. Every one of these drives the
  // same code a finger drives, and the tests go through the buttons anyway.
  window.__OO = {
    round: function () {
      var c = cards[at];
      return c && {
        words: c.words.slice(), names: c.names.slice(), odd: c.odd,
        name: c.name, thread: c.thread.slice(), hard: c.hard
      };
    },
    state: function () {
      return {
        at: at, phase: phase, over: over, won: won(), day: day, practice: practice,
        rounds: cards.length, points: points(), max: maxPoints(), norm: liveNorm(),
        called: called(), named: named(),
        picks: picks.map(function (p) { return { odd: p.odd, name: p.name }; })
      };
    },
    cards: function () { return cards.slice(); },
    rounds: function () { return ROUNDS; },
    days: function () { return DAYS; },
    normFor: normFor,
    shareRows: shareRows,
    shareText: function () { return shareText(liveNorm()); }
  };

  boot();
})();
