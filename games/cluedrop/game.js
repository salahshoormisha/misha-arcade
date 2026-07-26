/* ============================================================================
   CLUEDROP — the offline answer to GeoGuessr. No photographs: a country is
   described one concrete detail at a time and you guess as soon as you dare.
   The clues ARE the GeoGuessr meta, written out in words.

   Built on the shape of games/wordish/game.js (the reference implementation),
   and matching games/flagle/game.js for the guess rows and passport stamps so
   the geo cabinets feel like one machine.

   WHERE THE CLUES COME FROM
     Five of the six are DERIVED at runtime from core/data/countries.js —
     hemisphere and continent, which side they drive on, the writing system,
     the currency, the land borders and the population band. A generated clue
     cannot drift out of date and cannot be wrong, which is the whole point:
     the player has to be able to trust the ladder.
     The sixth is AUTHORED, from core/data/cluedrop.js — the plug in the wall,
     what is printed on the banknotes, the trees by the road, the shop on the
     corner. Those are the ones you actually recognise a country by.

   THE LADDER — fixed order, escalating, six rungs:
     1 WHERE      hemisphere + continent            (broad; ~30 countries)
     2 THE ROAD   left-hand or right-hand traffic
     3 THE SIGNS  the script, or the official languages if it is Latin
     4 THE MONEY  what the currency is called
     5 THE SHAPE  coast / landlocked, neighbour count, population band
     6 UP CLOSE   the authored detail + the capital's first letter

   NORM (cross-game 0-100 currency, _build/CONTRACT.md §3):
     right after 1..6 clues → 100, 88, 76, 64, 52, 40   (modal win 3-4 → ~70)
     lost                   → 10
   No hints and no spendable extras: the clue ladder IS the hint system, and it
   already costs you 12 points a rung.
   ========================================================================== */
(function () {
  "use strict";

  /* ── constants ─────────────────────────────────────────────────────────
     Declared above everything, because `var` initialisers do NOT hoist and
     this file builds its clue ladder during boot. */
  var ID = "cluedrop", TRIES = 6;
  var NORM = [0, 100, 88, 76, 64, 52, 40];

  var ONES = ["no", "one", "two", "three", "four", "five", "six", "seven",
    "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
    "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];

  var REGION = {
    "Europe": "Europe", "Asia": "Asia", "Africa": "Africa",
    "Americas": "the Americas", "Oceania": "Oceania",
  };

  // Population bands, read as prose. Deliberately coarse: an exact figure
  // would hand over the answer, a band narrows the field honestly.
  var BANDS = [
    [1e6, "Fewer than a million people live there."],
    [3e6, "Somewhere between one and three million people live there."],
    [1e7, "Between three and ten million people live there."],
    [2.5e7, "Between ten and twenty-five million people live there."],
    [6e7, "Between twenty-five and sixty million people live there."],
    [1.5e8, "Between sixty and a hundred and fifty million people live there."],
    [4e8, "Between a hundred and fifty and four hundred million people live there."],
  ];
  var BAND_TOP = "More than four hundred million people live there.";

  /* ── data ──────────────────────────────────────────────────────────────── */
  var D = window.AD_CLUEDROP || {};
  var NOTES = D.notes || {};
  var SCRIPTS = D.scripts || {};
  var SCRIPT_BY = D.scriptBy || {};
  var LANGS = D.langs || {};
  var MONEY = D.money || {};
  var LEFT = {};
  (D.left || []).forEach(function (i) { LEFT[i] = 1; });

  var ALL = window.AD_COUNTRIES || [];
  var byIso = {};
  ALL.forEach(function (c) { byIso[c.i] = c; });

  // The answer pool is the CURATED set: UN members with a location and at
  // least two authored details, so rung 6 is always a real clue and never a
  // shrug. Sorted, so both players walk the same permutation on the same day.
  var POOL = Object.keys(NOTES).filter(function (i) {
    var c = byIso[i];
    return c && c.un === 1 && (c.capll || c.ll) && (NOTES[i] || []).length >= 2;
  }).sort();

  /* ── state ─────────────────────────────────────────────────────────────── */
  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var answer = null, guesses = [], over = false, t0 = Date.now();
  var CLUES = [];
  var picker = null, tape = null, meterBar = null, meterLb = null;
  var shown = 0;          // clue cards on the tape
  var tail = null;        // the "rest of the ladder" heading, once added

  /* ── boot ──────────────────────────────────────────────────────────────── */
  var main = A.mount({
    id: ID, dayN: day,
    help: "<p>A country, described <b>one concrete detail at a time</b>. No photograph — " +
      "this is the reasoning half of GeoGuessr written out in words: which side they drive on, " +
      "what the signs are written in, what the money is called, what is in the wall socket.</p>" +
      "<p>You start with one clue. <b>Every wrong guess buys the next one</b>, and every rung " +
      "costs you 12 points, so guess as soon as you dare.</p>" +
      "<ul><li>Six clues, six guesses.</li>" +
      "<li>A miss tells you <b>how far away</b> you are, <b>which way</b> to go and how warm " +
      "you're getting — the same feedback as FLAGLE.</li>" +
      "<li>Five clues are generated from the country database, so they are always true. " +
      "The last one is hand-written.</li>" +
      "<li>Every country you get right is <b>stamped in your passport</b>.</li>" +
      "<li>Type freely — <i>USA</i>, <i>Holland</i>, <i>Persia</i> and <i>Burma</i> all work.</li>" +
      "<li><b>Practice</b> is unlimited and never touches your stats.</li></ul>",
  });

  if (POOL.length < 10) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">Clue data hasn\'t loaded. ' +
      "Check core/data/cluedrop.js and countries.js.</p>";
    return;
  }

  answer = pickAnswer(day);
  CLUES = buildClues(answer);

  var meter = A.el("div", "meter",
    '<div class="lb"></div><div class="bar"></div>');
  main.appendChild(meter);
  meterLb = meter.querySelector(".lb");
  meterBar = meter.querySelector(".bar");
  for (var p = 0; p < TRIES; p++) meterBar.appendChild(A.el("i"));

  var pickHost = A.el("div", "pickhost");
  main.appendChild(pickHost);
  picker = A.picker(pickHost, { pool: POOL, onPick: guess, placeholder: "which country?" });

  var row = A.el("div", "ac-row pillrow");
  row.innerHTML = practice
    ? '<a class="ac-pill" href="./">← TODAY\'S COUNTRY</a>'
    : '<a class="ac-pill" href="?practice=1">∞ PRACTICE</a>';
  main.appendChild(row);

  tape = A.el("div", "tape");
  main.appendChild(tape);

  // Today's difficulty, for the par line on the result sheet: a country a
  // billion people live in is a gift, one with half a million is not.
  A.setPar(ID, function (dayN) {
    var c = byIso[pickAnswer(dayN)];
    if (!c || !c.pop) return null;
    var lp = Math.log(Math.max(1e5, c.pop)) / Math.LN10;
    return A.clamp(Math.round(24 + 5.5 * lp), 45, 80);
  });

  restore();

  /* ── the day's country ─────────────────────────────────────────────────── */

  function pickAnswer(dayN) {
    if (dayN === A.PRACTICE) return A.pick(A.rng(String(Date.now()) + Math.random()), POOL);
    return POOL[A.dailyIndex(ID, dayN, POOL.length)];
  }

  function at(c) { return c.capll || c.ll; }          // [lat, lon]

  /* ── the clue ladder ────────────────────────────────────────────────────
     Every rung is a plain sentence. Five are generated from countries.js and
     are therefore true by construction; the sixth is authored. */

  function num(n) { return ONES[n] !== undefined ? ONES[n] : String(n); }

  // The authored layer is written ASCII-clean and spells an em dash "--".
  function pretty(s) { return String(s).replace(/\s--\s/g, " \u2014 "); }

  function listOf(a) {
    if (a.length < 2) return a[0] || "";
    return a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  }

  function whereClue(c) {
    return "Somewhere in " + (REGION[c.reg] || c.reg) + ", " +
      (c.hemi === "S" ? "south" : "north") + " of the equator.";
  }

  function roadClue(c) {
    return "Traffic drives on the " + (LEFT[c.i] ? "left" : "right") + ".";
  }

  // Script first: if any of the country's languages is written in something
  // other than Latin letters, that is the clue. Otherwise name the languages,
  // because "the Latin alphabet" on its own tells you almost nothing.
  function signsClue(c) {
    if (SCRIPT_BY[c.i]) return "The writing on the signs is " + SCRIPT_BY[c.i] + ".";
    var langs = (LANGS[c.i] || c.lang || []).filter(function (l) {
      return l && !/sign language/i.test(l);
    });
    for (var k = 0; k < langs.length; k++) {
      if (SCRIPTS[langs[k]]) return "The writing on the signs is " + SCRIPTS[langs[k]] + ".";
    }
    if (!langs.length) return "The signs are in the Latin alphabet.";
    if (langs.length === 1) {
      return "Latin alphabet, and the official language is " + langs[0] + ".";
    }
    return "Latin alphabet. Official languages: " + listOf(langs.slice(0, 3)) + ".";
  }

  // countries.js stores currencies with the national adjective attached
  // ("Iranian rial"). Strip it — "the rial" is the clue; "the Iranian rial"
  // is the answer. `money` in cluedrop.js overrides the awkward ones.
  function currencyName(c) {
    if (MONEY[c.i]) return MONEY[c.i];
    var cur = (c.cur && c.cur[0]) || "";
    if (!cur) return "";
    var cands = [];
    if (c.demo) {
      c.demo.split(",").forEach(function (d) { if (d.trim()) cands.push(d.trim()); });
    }
    cands.push(c.n);
    cands.sort(function (a, b) { return b.length - a.length; });
    for (var k = 0; k < cands.length; k++) {
      var pre = cands[k].toLowerCase() + " ";
      if (cur.toLowerCase().indexOf(pre) === 0) { cur = cur.slice(pre.length); break; }
    }
    return cur === "Euro" ? "euro" : cur;
  }

  function moneyClue(c) {
    var m = currencyName(c);
    return m ? "The money in your pocket is the " + m + "." : "";
  }

  function bordersClue(c) {
    var n = (c.bord || []).length;
    if (!n) return "No land borders at all.";
    if (c.locked === 1) {
      return "Landlocked, with " + num(n) + " neighbour" + (n === 1 ? "" : "s") + " around it.";
    }
    return "It has a coastline, and " + num(n) + " land neighbour" + (n === 1 ? "" : "s") + ".";
  }

  function popBand(pop) {
    if (!pop) return "";
    for (var k = 0; k < BANDS.length; k++) if (pop < BANDS[k][0]) return BANDS[k][1];
    return BAND_TOP;
  }

  function capInitial(c) {
    var s = String(c.cap || "").replace(/^(the|el|la)\s+/i, "");
    return s ? s.charAt(0).toUpperCase() : "";
  }

  function buildClues(iso) {
    var c = byIso[iso], out = [];
    var note = (NOTES[iso] || [])[0] || ["UP CLOSE", ""];
    var ini = capInitial(c);

    out.push({ lb: "WHERE", tx: whereClue(c) });
    out.push({ lb: "THE ROAD", tx: roadClue(c) });
    out.push({ lb: "THE SIGNS", tx: signsClue(c) });
    out.push({ lb: "THE MONEY", tx: moneyClue(c) });
    out.push({
      lb: "THE SHAPE OF IT",
      tx: [bordersClue(c), popBand(c.pop)].filter(Boolean).join(" "),
    });
    out.push({
      lb: note[0], tx: note[1],
      ex: ini ? "And its capital city begins with " + ini + "." : "",
    });

    // A rung that came back empty would be a dead clue. Nothing in the pool
    // hits this, but fall back rather than show a blank card.
    return out.map(function (cl, i) {
      if (!cl.tx) cl.tx = whereClue(c);
      cl.n = i + 1;
      return cl;
    });
  }

  /* ── the tape ──────────────────────────────────────────────────────────
     Append-only: a clue card, then the guess it bought, then the next clue.
     Nothing above the newest element ever moves, which is why the picker sits
     above the tape rather than below it. */

  function addClue(i, animate, spentClass) {
    var cl = CLUES[i];
    if (!cl) return null;
    var el = A.el("div", "cl" + (animate ? " fresh" : "") + (spentClass ? " spent" : ""));
    el.innerHTML =
      '<div class="n">' + cl.n + "</div>" +
      '<div class="bd"><div class="lb">' + A.esc(cl.lb) + "</div>" +
      '<div class="tx">' + A.esc(pretty(cl.tx)) + "</div>" +
      (cl.ex ? '<div class="ex">' + A.esc(pretty(cl.ex)) + "</div>" : "") +
      "</div>";
    tape.appendChild(el);
    return el;
  }

  function addGuess(iso, animate) {
    var c = byIso[iso], won = iso === answer;
    var el = A.el("div", "gr" + (won ? " win" : ""));
    if (!animate) el.style.animation = "none";
    el.innerHTML =
      '<img alt="" src="' + A.rootPath() + "core/data/flags/" + iso + '.svg" ' +
      "onerror=\"this.style.visibility='hidden'\">" +
      '<span class="nm">' + A.esc(c.n) + "</span>" +
      (won
        ? '<span class="ar">✓</span><span class="pc">100%</span>'
        : '<span class="km">' + A.geo.km(distTo(iso)) + "</span>" +
          '<span class="ar">' + A.arrow(bearTo(iso)) + "</span>" +
          '<span class="pc">' + proxPct(iso) + "%</span>");
    tape.appendChild(el);
    return el;
  }

  function paintMeter() {
    var n = A.clamp(shown, 0, TRIES);
    meterLb.textContent = over
      ? (guesses[guesses.length - 1] === answer
        ? "SOLVED ON CLUE " + guesses.length + " OF " + TRIES
        : "OUT OF CLUES")
      : "CLUE " + n + " OF " + TRIES + " · " + (TRIES - guesses.length) + " GUESSES LEFT";
    var bars = A.$$("i", meterBar);
    for (var k = 0; k < bars.length; k++) {
      var cls = "";
      if (k < n) cls = "on";
      if (over && k < n) cls = guesses[guesses.length - 1] === answer ? "won" : "out";
      bars[k].className = cls;
    }
  }

  // Only nudge if the new card is actually below the fold — a scroll that was
  // not needed reads as a glitch.
  function nudge(el) {
    if (!el || !el.getBoundingClientRect) return;
    setTimeout(function () {
      try {
        var r = el.getBoundingClientRect();
        if (r.bottom <= (window.innerHeight || 800) - 8) return;
        el.scrollIntoView({
          block: "end",
          behavior: A.settings().reduceMotion ? "auto" : "smooth",
        });
      } catch (e) { /* older Safari: no options object — leave the page alone */ }
    }, 30);
  }

  /* ── feedback ──────────────────────────────────────────────────────────── */

  function distTo(iso) {
    var a = at(byIso[iso]), b = at(byIso[answer]);
    return A.haversine(a[0], a[1], b[0], b[1]);
  }
  function bearTo(iso) {
    var a = at(byIso[iso]), b = at(byIso[answer]);
    return A.bearing(a[0], a[1], b[0], b[1]);
  }
  function proxPct(iso) {
    if (iso === answer) return 100;
    return Math.min(99, Math.round(A.geo.prox(distTo(iso)) * 100));   // a miss never shows 100%
  }
  // The *-dle five-square proximity meter: each full square is 20 points, a
  // half-square is a leftover of 10 or more.
  function squares(pc) {
    var cb = A.settings().colourblind;
    var gr = Math.min(5, Math.floor(pc / 20));
    var ye = (pc - 20 * gr) >= 10 && gr < 5 ? 1 : 0;
    return rep(cb ? "🟦" : "🟩", gr) + rep(cb ? "🟧" : "🟨", ye) + rep("⬜", 5 - gr - ye);
  }
  function rep(s, n) { var o = ""; for (var i = 0; i < n; i++) o += s; return o; }

  /* ── play ──────────────────────────────────────────────────────────────── */

  function guess(iso) {
    if (over) return;
    if (guesses.indexOf(iso) >= 0) return A.toast("Already guessed that one", true);
    if (!byIso[iso]) return;

    guesses.push(iso);
    picker.setExclude(guesses);
    var row = addGuess(iso, true);
    var won = iso === answer;

    if (won) { A.sfx("win"); save(); end(true); return; }
    if (guesses.length >= TRIES) { A.sfx("lose"); save(); end(false); return; }

    A.sfx("miss");
    shown = guesses.length + 1;
    var card = addClue(shown - 1, true, false);
    setTimeout(function () { A.sfx("reveal"); }, 180);
    paintMeter();
    save();
    nudge(card || row);
    // Desktop only: keep the caret in the box so the next guess is just typing.
    // On a phone that would re-open the keyboard over the clue you just earned.
    try {
      if (window.matchMedia && window.matchMedia("(hover: hover)").matches) picker.focus();
    } catch (e) { /* no matchMedia: leave focus alone */ }
  }

  /* ── persistence ───────────────────────────────────────────────────────── */

  function save() {
    if (practice) return;
    A.save(ID, day, { guesses: guesses });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st && st.guesses) guesses = st.guesses.slice(0, TRIES);

    var done = !!(st && st.done);
    shown = Math.min(TRIES, guesses.length + (done ? 0 : 1));
    if (done && !shown) shown = 1;

    // Replay the tape without animation: on a reload it should look like it has
    // always been there, not like the round is being played back at you.
    for (var k = 0; k < shown || k < guesses.length; k++) {
      if (k < shown) addClue(k, false, false);
      if (k < guesses.length) addGuess(guesses[k], false);
    }

    picker.setExclude(guesses);
    over = done;
    paintMeter();

    if (done) {
      picker.disable(true);
      revealRest();
      setTimeout(function () { sheet(!!st.won, st.shareGrid, st.norm); }, 240);
    }
  }

  /* ── ending ────────────────────────────────────────────────────────────── */

  // Show the rungs the player never reached, dimmed. Losing without ever
  // learning what the rest of the ladder said is the one genuinely annoying
  // way to end a guessing game.
  function revealRest() {
    if (tail || shown >= TRIES) return;
    tail = A.el("div", "tapehd", "THE REST OF THE LADDER");
    tape.appendChild(tail);
    for (var k = shown; k < TRIES; k++) addClue(k, false, true);
  }

  function end(won) {
    over = true;
    picker.disable(true);
    var n = guesses.length;
    var norm = won ? NORM[n] : 10;

    var grid = guesses.map(function (iso) { return squares(proxPct(iso)); });

    if (!practice) {
      A.finish(ID, day, {
        score: norm, norm: norm, won: won,
        detail: won ? n + "/" + TRIES : "X/" + TRIES,
        bucket: won ? n : "X",
        shareGrid: grid,
        durationMs: Date.now() - t0,
        stamps: won ? [answer] : [],
      });
    } else if (won) { A.stamp(answer, ID); }

    paintMeter();
    revealRest();
    if (won) { A.sfx("stamp"); A.confetti(n <= 2 ? 130 : 70); }
    sheet(won, grid, norm);
  }

  function sheet(won, grid, norm) {
    var c = byIso[answer];
    var also = (NOTES[answer] || []).slice(1);

    var extra =
      '<p class="center" style="margin:var(--sp-3) 0 0">' +
      '<img alt="" style="width:34px;height:22px;object-fit:cover;border-radius:2px;' +
      'vertical-align:-5px;margin-right:8px" src="' + A.rootPath() + "core/data/flags/" +
      answer + '.svg" onerror="this.style.display=\'none\'">' +
      '<span class="rv-name">' + A.esc(c.n) + "</span></p>" +
      '<p class="rv-meta">' +
      A.esc([c.cap, c.sub || c.reg].filter(Boolean).join(" · ")) + "</p>";

    if (also.length) {
      extra += '<div class="rv-hd">Also true of ' + A.esc(c.n) + "</div>" +
        '<div class="rv-also">' + also.map(function (nt) {
          return "<div><b>" + A.esc(nt[0]) + "</b>" + A.esc(pretty(nt[1])) + "</div>";
        }).join("") + "</div>";
    }
    if (won) {
      extra += '<p class="center tiny" style="color:var(--green);margin-top:var(--sp-3)">' +
        A.esc(c.n) + " stamped in your passport</p>";
    }

    A.results(ID, practice ? A.PRACTICE : day, {
      title: won
        ? (guesses.length <= 1 ? "ON ONE CLUE" : guesses.length <= 2 ? "SHARP" : "GOT IT")
        : "NOT THIS TIME",
      extraHTML: extra,
      state: { norm: norm, shareGrid: grid, won: won },
      shareText: "CLUEDROP (practice) · " +
        (won ? guesses.length + "/" + TRIES : "X/" + TRIES) + "\n" +
        (grid || []).join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  /* ── debug hook — drives a whole game headlessly ───────────────────────── */
  window.__CD = {
    answer: function () { return answer; },
    guess: guess,
    pool: function () { return POOL.slice(); },
    clues: function (iso) { return buildClues(iso || answer); },
    // every clue for every country in the pool, for auditing the generators
    audit: function () {
      return POOL.map(function (i) {
        return { i: i, n: byIso[i].n, clues: buildClues(i) };
      });
    },
    // walk the ladder to the end without knowing the answer
    exhaust: function () {
      var others = POOL.filter(function (i) { return i !== answer; });
      while (!over && guesses.length < TRIES) guess(others[guesses.length]);
      return { over: over, guesses: guesses.slice() };
    },
    state: function () {
      return {
        day: day, practice: practice, answer: answer, guesses: guesses.slice(),
        over: over, shown: shown, pool: POOL.length, clues: CLUES.length,
      };
    },
  };
})();
