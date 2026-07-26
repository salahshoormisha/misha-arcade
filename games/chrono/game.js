/* ============================================================================
   CHRONO — one year a day, five clues, falling in value.
   ----------------------------------------------------------------------------
   TimeGuessr's idea without its dependency: no photographs, no network, no
   licence problem. Five facts about a single year are revealed one at a time,
   hardest first, and every clue you take makes the year cheaper. Guess with a
   slider and a number field kept in sync — the slider alone is imprecise, the
   field alone is tedious.

   Built on the shape of games/wordish/game.js (the reference cabinet):
     day → A.requestedDay()  ·  puzzle → A.dailyIndex  ·  restore → A.load
     autosave → A.save        ·  finish once → A.finish  ·  sheet → A.results

   NORM (cross-game 0-100 currency, _build/CONTRACT.md §3):
     exact year on clue 1..5      → 100, 85, 70, 55, 40
     within 2 years on clue 1..5  → half of that: 50, 43, 35, 28, 20
     never within 2 years         → 10
     The best guess of the round counts, so nailing it late still beats a near
     miss early. A modal win (clue 3) is 70; 100 needs the hardest clue alone.

   WHY THE FEEDBACK IS BANDED: "too early by 3-5 years" keeps the ladder alive.
   An exact gap would turn guess two into arithmetic and every day into 85.
   ========================================================================== */
(function () {
  "use strict";

  /* ── constants ─────────────────────────────────────────────────────────
     Declared above everything that boots with them: `var` initialisers do
     NOT hoist, and this file renders before it reaches the bottom. */
  var ID = "chrono", TRIES = 5, CLOSE = 2, LOSS_NORM = 10;
  var PTS = [0, 100, 85, 70, 55, 40];      // index = clues showing when you guessed

  // Warmth ladder. `lab` is all a wrong guess ever learns about the distance.
  var BANDS = [
    { max: 0, lab: "EXACT", word: "BANG ON" },
    { max: 2, lab: "1–2 YRS", word: "SO CLOSE" },
    { max: 5, lab: "3–5 YRS", word: "WARM" },
    { max: 10, lab: "6–10 YRS", word: "COOL" },
    { max: 20, lab: "11–20 YRS", word: "COLD" },
    { max: 45, lab: "21–45 YRS", word: "ICE COLD" },
    { max: 9999, lab: "46+ YRS", word: "NOWHERE NEAR" },
  ];
  var VCLASS = ["close", "close", "hot", "cool", "cold", "far", "far"];

  /* ── data ──────────────────────────────────────────────────────────────── */
  var D = window.AD_CHRONO || {};
  var LO = typeof D.lo === "number" ? D.lo : 1850;
  var HI = typeof D.hi === "number" ? D.hi : 2020;
  var POOL = (D.years || []).filter(function (e) {
    return e && typeof e.y === "number" && e.y >= LO && e.y <= HI &&
      e.c && e.c.length === TRIES;
  });

  /* ── state ─────────────────────────────────────────────────────────────── */
  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var entry = null, guesses = [], over = false, t0 = Date.now();
  var rows = [], tier = null, ladder = null, verdict = null, grows = null;
  var bar = null, field = null, slider = null, ticks = null;

  /* ── boot ──────────────────────────────────────────────────────────────── */
  var main = A.mount({
    id: ID, dayN: day,
    help: "<p>One year. Five clues about it, revealed one at a time — the first is the " +
      "hardest, the last is the giveaway. Set the year with the slider or type it, and guess " +
      "as early as you dare.</p>" +
      "<p>What a correct year is worth, by the number of clues showing: " +
      "<b>100 · 85 · 70 · 55 · 40</b>. Land <b>within two years</b> and you keep half. " +
      "Miss by more, every time, and it's 10.</p>" +
      "<ul><li>Wrong guesses tell you <b>too early</b> or <b>too late</b>, and roughly how far — " +
      "a band, never the exact gap, or the second guess would just be arithmetic.</li>" +
      "<li>Your best guess of the round is the one that counts.</li>" +
      "<li>No clue ever names the year, and every fact is real and correctly dated.</li>" +
      "<li><b>Practice</b> is unlimited and never touches your stats.</li></ul>",
  });

  if (!POOL.length) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">The year bank hasn\'t ' +
      "loaded. Check core/data/chrono.js.</p>";
    return;
  }

  entry = pickEntry();

  tier = A.el("div", "tier");
  tier.setAttribute("aria-hidden", "true");
  main.appendChild(tier);

  ladder = A.el("div", "ladder");
  for (var i = 0; i < TRIES; i++) {
    var row = A.el("div", "clue locked");
    row.innerHTML = '<span class="ix"></span><p class="tx"></p><span class="val"></span>';
    rows.push(row);
    ladder.appendChild(row);
  }
  main.appendChild(ladder);

  verdict = A.el("div", "verdict");
  verdict.setAttribute("aria-live", "polite");
  main.appendChild(verdict);

  grows = A.el("div", "grows");
  main.appendChild(grows);

  var modes = A.el("div", "ac-row");
  modes.style.marginTop = "var(--sp-3)";
  modes.innerHTML = practice
    ? '<a class="ac-pill" href="./">← TODAY\'S YEAR</a>'
    : '<a class="ac-pill" href="?practice=1">∞ PRACTICE</a>';
  main.appendChild(modes);

  bar = A.el("div", "bar");
  bar.innerHTML =
    '<div class="brow">' +
      '<button class="nudge" id="down" type="button" aria-label="One year earlier">−</button>' +
      '<input id="year" type="number" inputmode="numeric" autocomplete="off" ' +
        'min="' + LO + '" max="' + HI + '" step="1" aria-label="Your year">' +
      '<button class="nudge" id="up" type="button" aria-label="One year later">+</button>' +
      '<button class="ac-btn" id="go" type="button">GUESS</button>' +
    "</div>" +
    '<div class="track">' +
      '<input id="slider" type="range" min="' + LO + '" max="' + HI + '" step="1" ' +
        'aria-label="Year slider">' +
      '<div class="ticks" id="ticks" aria-hidden="true"></div>' +
    "</div>" +
    '<div class="ends" aria-hidden="true"><span>' + LO + "</span><span>" + HI + "</span></div>";
  main.appendChild(bar);

  field = bar.querySelector("#year");
  slider = bar.querySelector("#slider");
  ticks = bar.querySelector("#ticks");

  setYear(Math.round((LO + HI) / 2));

  slider.addEventListener("input", function () {
    field.value = slider.value;
    A.sfx("tick");
  });
  // Typing: sync the slider only once the value is a plausible year, so the
  // field doesn't fight the player mid-keystroke. Clamp on blur, not before.
  field.addEventListener("input", function () {
    var v = parseInt(field.value, 10);
    if (!isNaN(v) && v >= LO && v <= HI) slider.value = String(v);
  });
  field.addEventListener("change", function () { setYear(readYear()); });
  field.addEventListener("blur", function () { setYear(readYear()); });
  field.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
  });
  bar.querySelector("#down").onclick = function () { nudge(-1); };
  bar.querySelector("#up").onclick = function () { nudge(1); };
  bar.querySelector("#go").onclick = submit;

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector(".ac-modal.show")) return;
    if (e.key === "Enter" && document.activeElement !== field) { e.preventDefault(); submit(); }
  });

  restore();

  /* ── the day's year ────────────────────────────────────────────────────── */

  function pickEntry() {
    if (practice) return A.pick(A.rng(String(Date.now()) + Math.random()), POOL);
    return POOL[A.dailyIndex(ID, day, POOL.length)];
  }
  function answer() { return entry.y; }
  function shown() { return Math.min(TRIES, guesses.length + 1); }

  /* ── the year control ──────────────────────────────────────────────────── */

  function readYear() { return parseInt(field.value, 10); }
  function setYear(y) {
    if (isNaN(y)) y = parseInt(slider.value, 10);
    y = A.clamp(Math.round(y), LO, HI);
    field.value = String(y);
    slider.value = String(y);
    return y;
  }
  function nudge(d) {
    var y = readYear();
    if (isNaN(y)) y = parseInt(slider.value, 10);
    setYear(y + d);
    A.sfx("tick");
    field.focus();
  }

  /* ── play ──────────────────────────────────────────────────────────────── */

  function bandOf(diff) {
    var d = Math.abs(diff);
    for (var i = 0; i < BANDS.length; i++) if (d <= BANDS[i].max) return i;
    return BANDS.length - 1;
  }

  function submit() {
    if (over) return;
    var raw = readYear();
    if (isNaN(raw)) { field.value = slider.value; raw = readYear(); }
    var y = setYear(raw);
    if (guesses.indexOf(y) >= 0) {
      A.toast("You've already tried " + y, true);
      A.sfx("bad");
      shake();
      return;
    }

    guesses.push(y);
    var b = bandOf(y - answer());
    renderGuesses();
    paintTier();
    sayVerdict(y);
    save();

    if (b === 0) {
      A.sfx("win");
      end(true);
    } else if (guesses.length >= TRIES) {
      A.sfx("lose");
      end(false);
    } else {
      A.sfx(b <= 1 ? "near" : "miss");
      reveal(guesses.length, true);      // the next rung down the ladder
    }
  }

  function shake() {
    bar.classList.add("ac-shake");
    setTimeout(function () { bar.classList.remove("ac-shake"); }, 420);
  }

  /* ── rendering ─────────────────────────────────────────────────────────── */

  function reveal(i, fresh) {
    var row = rows[i];
    if (!row) return;
    row.className = "clue" + (fresh ? " fresh" : "");
    row.querySelector(".ix").textContent = pad(i + 1);
    row.querySelector(".tx").textContent = entry.c[i];
    // A revealed clue's tier is history — the strip at the top carries the live
    // number, so repeating it on every row is just noise.
    row.querySelector(".val").textContent = "";
    if (fresh) {
      A.sfx("reveal");
      // scrollIntoView, not a rAF animation: a backgrounded tab pauses rAF and
      // the clue would arrive invisible.
      try {
        row.scrollIntoView({
          block: "center",
          behavior: A.settings().reduceMotion ? "auto" : "smooth",
        });
      } catch (e) { /* older Safari: ignore the options object */ }
    }
  }

  function lockRow(i) {
    var row = rows[i];
    row.className = "clue locked";
    row.querySelector(".ix").textContent = pad(i + 1);
    row.querySelector(".tx").textContent = "sealed";
    row.querySelector(".val").textContent = PTS[i + 1] + " PTS";
  }

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function paintLadder() {
    for (var i = 0; i < TRIES; i++) {
      if (i < shown()) reveal(i, false);
      else lockRow(i);
    }
  }

  function paintTier() {
    tier.innerHTML = "";
    for (var i = 0; i < TRIES; i++) {
      var pip = A.el("i", i < guesses.length ? "spent" : (i === guesses.length && !over ? "live" : ""));
      pip.textContent = PTS[i + 1];
      tier.appendChild(pip);
    }
  }

  function renderGuesses() {
    grows.innerHTML = "";
    guesses.forEach(function (y) {
      var d = y - answer(), i = bandOf(d);
      var el = A.el("div", "gr w" + i);
      el.innerHTML = '<span class="yr">' + y + "</span>" +
        '<span class="vd">' + (i === 0 ? "THE YEAR" : d < 0 ? "TOO EARLY ▸" : "◂ TOO LATE") + "</span>" +
        '<span class="bd">' + BANDS[i].lab + "</span>";
      grows.appendChild(el);
    });
    paintTicks();
  }

  function paintTicks() {
    ticks.innerHTML = "";
    guesses.forEach(function (y) {
      var t = A.el("i", "w" + bandOf(y - answer()));
      t.style.left = (100 * (y - LO) / (HI - LO)) + "%";
      ticks.appendChild(t);
    });
  }

  function sayVerdict(y) {
    if (y === undefined) {
      verdict.innerHTML = over ? "" :
        "<span>five guesses · clue " + shown() + " is showing · worth <b>" +
        PTS[shown()] + "</b></span>";
      return;
    }
    var d = y - answer(), i = bandOf(d);
    if (i === 0) {
      verdict.innerHTML = '<span><b>' + y + "</b> — <span class='close'>bang on</span></span>";
      return;
    }
    verdict.innerHTML = "<span><b>" + y + "</b> is too " + (d < 0 ? "early" : "late") +
      " · <span class='" + VCLASS[i] + "'>" + BANDS[i].word + "</span>, " +
      BANDS[i].lab.toLowerCase() + " out</span>";
  }

  /* ── persistence ───────────────────────────────────────────────────────── */

  function save() {
    if (practice) return;
    A.save(ID, day, { guesses: guesses, year: answer() });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st && st.guesses) {
      // Defensive: a stale save from before a bank change could hold guesses
      // for a different year. `year` pins it; if it disagrees, start clean.
      if (st.year === undefined || st.year === answer()) {
        guesses = st.guesses.slice(0, TRIES);
      }
    }
    paintLadder();
    paintTier();
    renderGuesses();
    if (guesses.length) {
      setYear(guesses[guesses.length - 1]);
      sayVerdict(guesses[guesses.length - 1]);
    } else {
      sayVerdict();
    }
    if (st && st.done) {
      over = true;
      lock();
      setTimeout(function () { sheet(st.won, st.shareGrid, st.norm); }, 240);
    }
  }

  function lock() {
    bar.classList.add("done");
    field.disabled = true;
    slider.disabled = true;
    paintTier();
  }

  /* ── scoring ───────────────────────────────────────────────────────────── */

  // The best guess of the round wins: exact pays the tier, within CLOSE pays
  // half of it, everything else pays nothing.
  function scoreOf() {
    var best = 0, exact = false;
    guesses.forEach(function (y, k) {
      var d = Math.abs(y - answer()), pts = PTS[k + 1];
      if (d === 0) { exact = true; best = Math.max(best, pts); }
      else if (d <= CLOSE) best = Math.max(best, Math.round(pts / 2));
    });
    return { norm: best || LOSS_NORM, exact: exact };
  }

  function closest() {
    var b = null;
    guesses.forEach(function (y) {
      var d = Math.abs(y - answer());
      if (b === null || d < Math.abs(b - answer())) b = y;
    });
    return b;
  }

  function squares() {
    var cb = A.settings().colourblind;
    return [guesses.map(function (y) {
      var i = bandOf(y - answer());
      if (i === 0) return cb ? "🟦" : "🟩";
      if (i === 1) return cb ? "🟧" : "🟨";
      if (i <= 3) return "🟪";
      return "⬛";
    }).join("")];
  }

  /* ── ending ────────────────────────────────────────────────────────────── */

  function end(won) {
    over = true;
    lock();
    var sc = scoreOf();
    var n = guesses.length;
    var grid = squares();
    var near = closest();
    var off = Math.abs(near - answer());
    var detail = won ? n + (n === 1 ? " clue" : " clues")
      : (off <= CLOSE ? off + " yr" + (off === 1 ? "" : "s") + " off" : "missed");

    if (!practice) {
      A.finish(ID, day, {
        score: sc.norm, norm: sc.norm, won: won, detail: detail,
        bucket: won ? n : "X", shareGrid: grid, durationMs: Date.now() - t0,
      });
    }
    if (won) A.confetti(n <= 2 ? 140 : 80);
    sheet(won, grid, sc.norm);
  }

  function sheet(won, grid, norm) {
    var near = closest();
    var off = near === null ? null : Math.abs(near - answer());
    var extra = '<p class="bigyear">' + answer() + "</p>";
    if (entry.n) extra += '<p class="note">' + A.esc(entry.n) + "</p>";
    if (!won && off !== null) {
      extra += '<p class="center tiny muted" style="margin-top:var(--sp-2)">closest guess ' +
        near + " · " + off + " year" + (off === 1 ? "" : "s") + " out</p>";
    }
    extra += '<div class="allclues">' + entry.c.map(function (c, i) {
      return '<div class="' + (i < shown() ? "seen" : "") + '"><b>' + pad(i + 1) + "</b>" +
        "<span>" + A.esc(c) + "</span></div>";
    }).join("") + "</div>";

    var title = won
      ? (guesses.length === 1 ? "ORACLE" : guesses.length === 2 ? "SHARP"
        : guesses.length <= 4 ? "GOT IT" : "JUST IN TIME")
      : (off !== null && off <= CLOSE ? "SO NEAR" : "TOMORROW, THEN");

    return A.results(ID, practice ? A.PRACTICE : day, {
      title: title,
      lines: [won ? "solved on clue " + guesses.length + " of " + TRIES
        : guesses.length + " guesses, none of them the year"],
      extraHTML: extra,
      state: { norm: norm, shareGrid: grid, won: won },
      shareText: "CHRONO (practice)\n" + (grid || []).join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  /* ── register (CONTRACT §5) ────────────────────────────────────────────── */
  // core/registry.js already lists CHRONO; this is the self-description the
  // contract asks every cabinet for, and it clears the `soon` flag for anyone
  // who reaches the page directly while the hub still has it behind glass.
  A.register({
    id: ID, name: "CHRONO", tagline: "five clues, falling in value — what year?",
    icon: "⏳", accent: "--violet", family: "offline", parMs: 180000,
    hasArchive: true, hasPractice: true, distLabel: "clues used", stamps: false,
    soon: false,
  });

  /* ── debug hook — drives a whole game headlessly ───────────────────────── */
  window.__CH = {
    answer: answer,
    entry: function () { return entry; },
    guess: function (y) { setYear(y); submit(); },
    clues: function () { return entry.c.slice(0, shown()); },
    pool: function () { return POOL.length; },
    state: function () {
      return {
        day: day, practice: practice, year: answer(), guesses: guesses.slice(),
        shown: shown(), over: over, norm: scoreOf().norm, pool: POOL.length,
        lo: LO, hi: HI,
      };
    },
  };
})();
