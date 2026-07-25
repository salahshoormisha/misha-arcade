/* ============================================================================
   FLAGLE — guess the country from a flag revealed one tile at a time.
   Built on the shape of games/wordish/game.js (the reference implementation).

   Better than the original in four ways:
     · a real archive + unlimited practice
     · a spendable hint that describes what is ON the flag, from the shipped
       feature index rather than a vague nudge
     · correct answers stamp the ARCADE PASSPORT
     · the same flag for both players on the same day, with no server

   NORM: solved in 1..6 → 100, 92, 80, 68, 55, 42; lost → 10; hint costs 8.
   ========================================================================== */
(function () {
  "use strict";

  var ID = "flagle", TRIES = 6, COLS = 3, ROWS = 2;
  var NORM = [0, 100, 92, 80, 68, 55, 42];

  /* ── the pool: UN members that have both a flag and a location ─────────── */
  var ALL = window.AD_COUNTRIES || [];
  var byIso = {};
  ALL.forEach(function (c) { byIso[c.i] = c; });
  var POOL = ALL.filter(function (c) {
    return c.un === 1 && (window.AD_FLAGS || {})[c.i] && (c.capll || c.ll);
  }).map(function (c) { return c.i; });

  function at(c) { return c.capll || c.ll; }          // [lat, lon]

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var answer, guesses = [], over = false, hinted = false, t0 = Date.now();
  var cvs, img = null, picker, order;

  function pickAnswer() {
    if (practice) return A.pick(A.rng(String(Date.now()) + Math.random()), POOL);
    return POOL[A.dailyIndex(ID, day, POOL.length)];
  }

  /* ── boot ────────────────────────────────────────────────────────────── */
  var main = A.mount({
    id: ID, dayN: day,
    help: "<p>A flag, hidden behind six tiles. Every guess uncovers another one — and tells you " +
      "<b>how far away</b> you are, and <b>which way</b> to go.</p>" +
      "<ul><li>Six guesses. The whole flag is showing by the last one.</li>" +
      "<li><b>💡 Hint</b> describes what's actually on the flag — costs 8 points, not a guess.</li>" +
      "<li>Every country you get right is <b>stamped in your passport</b>.</li>" +
      "<li>Type freely — <i>USA</i>, <i>Holland</i>, <i>Persia</i> and <i>Burma</i> all work.</li></ul>",
  });

  if (!POOL.length) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">Flag data hasn\'t loaded. ' +
      "Check core/data/flags.js and countries.js.</p>";
    return;
  }

  answer = pickAnswer();

  var wrap = A.el("div"); wrap.id = "flagwrap";
  cvs = A.el("canvas"); cvs.id = "flag";
  cvs.setAttribute("role", "img");
  cvs.setAttribute("aria-label", "A partially revealed national flag");
  wrap.appendChild(cvs);
  main.appendChild(wrap);

  var tries = A.el("div", "tries");
  main.appendChild(tries);

  var pickHost = A.el("div"); pickHost.style.marginTop = "14px";
  main.appendChild(pickHost);
  picker = A.picker(pickHost, { pool: POOL, onPick: guess, placeholder: "which country?" });

  var row = A.el("div", "ac-row"); row.style.marginTop = "10px";
  row.innerHTML = '<button class="ac-pill" id="hint">💡 WHAT\'S ON IT?</button>' +
    (practice ? '<a class="ac-pill" href="./">← TODAY\'S FLAG</a>'
      : '<a class="ac-pill" href="?practice=1">∞ PRACTICE</a>');
  main.appendChild(row);

  var hintBox = A.el("div", "hintbox"); main.appendChild(hintBox);
  var list = A.el("div", "guesses"); main.appendChild(list);

  row.querySelector("#hint").onclick = doHint;

  // Tile reveal order is seeded, so both players uncover the same corners.
  order = A.shuffle(A.rng(ID + ":order:" + (practice ? answer : day)), [0, 1, 2, 3, 4, 5]);

  A.flagImg(answer).then(function (im) { img = im; draw(); })
    .catch(function () { A.toast("Couldn't load that flag", true); });

  restore();

  /* ── play ────────────────────────────────────────────────────────────── */

  function guess(iso) {
    if (over) return;
    if (guesses.indexOf(iso) >= 0) return A.toast("Already guessed that one", true);
    guesses.push(iso);
    var won = iso === answer;
    draw();
    renderGuesses();
    save();
    if (won) { A.sfx("win"); end(true); }
    else if (guesses.length >= TRIES) { A.sfx("lose"); end(false); }
    else { A.sfx("miss"); }
  }

  function doHint() {
    if (over || hinted) return;
    hinted = true;
    var m = A.flagMeta(answer) || {};
    var bits = [];
    if (m.colours && m.colours.length) bits.push(m.colours.slice(0, 4).join(", "));
    if (m.features && m.features.length) {
      bits.push(m.features.slice(0, 3).map(A.flagFeatureLabel).join(", "));
    }
    hintBox.innerHTML = bits.length
      ? "💡 " + A.esc(bits.join(" · ")) + ' <span class="dim">(−8 pts)</span>'
      : "💡 no extra detail recorded for this one — no charge";
    if (!bits.length) hinted = false;
    A.sfx("reveal");
    save();
  }

  /* ── drawing ─────────────────────────────────────────────────────────── */

  function draw() {
    if (!img) return;
    var meta = A.flagMeta(answer) || {};
    var ar = meta.ar || 1.6;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = cvs.clientWidth || 360, h = Math.round(w / ar);
    cvs.width = w * dpr; cvs.height = h * dpr;
    cvs.style.height = h + "px";
    var g = cvs.getContext("2d");
    g.save(); g.scale(dpr, dpr);
    g.clearRect(0, 0, w, h);
    A.flagDraw(g, img, 0, 0, w, h, "cover");

    // Cover the tiles that haven't been earned yet.
    var shown = over ? 6 : Math.min(6, guesses.length + 1);
    var tw = w / COLS, th = h / ROWS;
    for (var k = 0; k < 6; k++) {
      var idx = order.indexOf(k);
      if (idx < shown) continue;
      var cx = (k % COLS) * tw, cy = Math.floor(k / COLS) * th;
      g.fillStyle = "#0d0722";
      g.fillRect(cx, cy, tw, th);
      g.strokeStyle = "#ffffff10"; g.lineWidth = 1;
      g.strokeRect(cx + .5, cy + .5, tw - 1, th - 1);
    }
    g.restore();

    tries.innerHTML = "";
    for (var t = 0; t < TRIES; t++) {
      var i = A.el("i");
      if (t < guesses.length) i.className = guesses[t] === answer ? "won" : "used";
      tries.appendChild(i);
    }
  }

  function renderGuesses() {
    list.innerHTML = "";
    guesses.forEach(function (iso) {
      var c = byIso[iso], won = iso === answer;
      var d = A.haversine(at(c)[0], at(c)[1], at(byIso[answer])[0], at(byIso[answer])[1]);
      var b = A.bearing(at(c)[0], at(c)[1], at(byIso[answer])[0], at(byIso[answer])[1]);
      var pc = Math.round(A.geo.prox(d) * 100);
      var el = A.el("div", "gr" + (won ? " win" : ""));
      el.innerHTML =
        '<img alt="" src="' + A.rootPath() + "core/data/flags/" + iso + '.svg" onerror="this.style.visibility=\'hidden\'">' +
        '<span class="nm">' + A.esc(c.n) + "</span>" +
        (won ? '<span class="ar">🎉</span><span class="pc">100%</span>'
          : '<span class="km">' + A.geo.km(d) + '</span><span class="ar">' + A.arrow(b) +
            '</span><span class="pc">' + pc + "%</span>");
      list.appendChild(el);
    });
  }

  /* ── persistence ─────────────────────────────────────────────────────── */

  function save() {
    if (practice) return;
    A.save(ID, day, { guesses: guesses, hinted: hinted });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st) {
      guesses = st.guesses || [];
      hinted = !!st.hinted;
      if (hinted) doHintSilent();
    }
    renderGuesses();
    draw();
    if (st && st.done) {
      over = true;
      picker.disable(true);
      draw();
      setTimeout(function () { sheet(st.won); }, 240);
    }
  }
  function doHintSilent() { hinted = false; doHint(); }

  /* ── ending ──────────────────────────────────────────────────────────── */

  function end(won) {
    over = true;
    picker.disable(true);
    draw();
    var n = guesses.length;
    var norm = won ? Math.max(5, NORM[n] - (hinted ? 8 : 0)) : 10;

    var grid = [];
    var line = "";
    guesses.forEach(function (iso, i) {
      if (iso === answer) { line += "🟩"; return; }
      var c = byIso[iso];
      var d = A.haversine(at(c)[0], at(c)[1], at(byIso[answer])[0], at(byIso[answer])[1]);
      line += d < 1000 ? "🟨" : d < 4000 ? "🟧" : "⬛";
    });
    grid.push(line + "⬜".repeat(Math.max(0, TRIES - guesses.length)));
    if (hinted) grid.push("💡");

    if (!practice) {
      A.finish(ID, day, {
        score: norm, norm: norm, won: won, detail: won ? n + "/" + TRIES : "X/" + TRIES,
        bucket: won ? n : "X", shareGrid: grid, durationMs: Date.now() - t0,
        stamps: won ? [answer] : [],
      });
    } else if (won) { A.stamp(answer, ID); }

    if (won) A.confetti(n <= 2 ? 130 : 70);
    sheet(won, grid, norm);
  }

  function sheet(won, grid, norm) {
    var c = byIso[answer];
    var extra = '<p class="center" style="margin:6px 0 2px"><b style="font-size:17px;letter-spacing:2px">' +
      A.esc(c.n) + "</b></p>" +
      '<p class="center tiny muted">' + A.esc([c.cap, c.sub || c.reg].filter(Boolean).join(" · ")) + "</p>" +
      '<p class="center" style="margin-top:8px">' + A.flagSwatches(answer) + "</p>";
    if (won) extra += '<p class="center tiny" style="color:var(--mint);margin-top:8px">🛂 ' +
      A.esc(c.n) + " stamped in your passport</p>";

    A.results(ID, practice ? A.PRACTICE : day, {
      title: won ? (guesses.length <= 2 ? "SHARP" : "GOT IT") : "NOT THIS TIME",
      extraHTML: extra,
      state: { norm: norm, shareGrid: grid, won: won },
      shareText: "FLAGLE (practice)\n" + (grid || []).join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  window.addEventListener("resize", function () { clearTimeout(draw._t); draw._t = setTimeout(draw, 140); });

  window.__FL = {
    answer: function () { return answer; },
    guess: guess,
    state: function () { return { guesses: guesses, over: over, day: day, pool: POOL.length }; },
  };
})();
