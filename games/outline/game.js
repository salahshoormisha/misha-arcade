/* ============================================================================
   OUTLINE — name the country from its silhouette alone.
   Worldle's idea, drawn from the same real Natural Earth geometry the rest of
   the arcade uses, so the shapes are honest.

   Better than the original:
     · the shape is ROTATED by a seeded angle, which kills the "I recognise the
       picture, not the country" reflex — and it un-rotates when you finish
     · a hint that gives you the shape's real geography (area, neighbours)
     · archive + practice + passport stamping

   NORM: solved in 1..6 → 100, 92, 80, 68, 55, 42; lost → 10; hint costs 8.
   ========================================================================== */
(function () {
  "use strict";

  var ID = "outline", TRIES = 6;
  var NORM = [0, 100, 92, 80, 68, 55, 42];

  var ALL = window.AD_COUNTRIES || [];
  var byIso = {};
  ALL.forEach(function (c) { byIso[c.i] = c; });

  /* The pool is the whole game's difficulty dial. Two filters, both earned:
     scattered archipelagos are not silhouettes anyone can name (a rotated
     Solomon Islands is 21 specks), and a country nobody has heard of is a
     coin-flip rather than a puzzle. So: drop small many-island states, then
     keep the most salient shapes by population + area. */
  function ringCount(iso) {
    var r = window.AD_WORLD && window.AD_WORLD.rings(iso);
    return r ? r.length : 0;
  }
  var CAND = ALL.filter(function (c) {
    if (c.un !== 1 || !(c.capll || c.ll)) return false;
    if (!window.AD_WORLD || !ringCount(c.i)) return false;
    if ((c.area || 0) < 20000) return false;
    // scattered and small = unnameable from a shape
    if (ringCount(c.i) > 8 && (c.area || 0) < 150000) return false;
    return true;
  });
  CAND.forEach(function (c) {
    c._sal = 0.6 * Math.log10((c.pop || 1) + 10) + 0.4 * Math.log10((c.area || 1) + 10);
  });
  CAND.sort(function (a, b) { return b._sal - a._sal; });
  var POOL = CAND.slice(0, 130).map(function (c) { return c.i; });

  function at(iso) { var c = byIso[iso]; return c.capll || c.ll; }
  function dist(a, b) { return A.haversine(at(a)[0], at(a)[1], at(b)[0], at(b)[1]); }

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var answer, guesses = [], over = false, hinted = false, rot = 0, t0 = Date.now();
  var cvs, picker;

  function pickAnswer() {
    if (practice) return A.pick(A.rng(String(Date.now()) + Math.random()), POOL);
    return POOL[A.dailyIndex(ID, day, POOL.length)];
  }

  var main = A.mount({
    id: ID, dayN: day,
    help: "<p>One country, as a plain silhouette — no labels, no scale, and <b>rotated</b>, so " +
      "recognising the picture won't save you.</p>" +
      "<ul><li>Six guesses, each with distance and direction to the real answer.</li>" +
      "<li><b>💡 Hint</b> tells you its size and how many countries it borders — costs 8 points.</li>" +
      "<li>The shape turns the right way up when the round ends.</li></ul>",
  });

  if (!POOL.length || !window.AD_WORLD) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">Map data hasn\'t loaded yet.</p>';
    return;
  }
  answer = pickAnswer();
  rot = Math.floor(A.rng(ID + ":rot:" + (practice ? answer + Math.random() : day))() * 360);

  cvs = A.el("canvas"); cvs.id = "shape";
  cvs.setAttribute("role", "img");
  cvs.setAttribute("aria-label", "The silhouette of a country, rotated");
  main.appendChild(cvs);

  var tries = A.el("div", "tries"); main.appendChild(tries);

  var pickHost = A.el("div"); pickHost.style.marginTop = "14px";
  main.appendChild(pickHost);
  picker = A.picker(pickHost, { pool: POOL, onPick: guess, placeholder: "which country is that?" });

  var row = A.el("div", "ac-row"); row.style.marginTop = "10px";
  row.innerHTML = '<button class="ac-pill" id="hint">💡 SIZE &amp; BORDERS</button>' +
    (practice ? '<a class="ac-pill" href="./">← TODAY\'S SHAPE</a>'
      : '<a class="ac-pill" href="?practice=1">∞ PRACTICE</a>');
  main.appendChild(row);

  var hintBox = A.el("div", "hintbox"); main.appendChild(hintBox);
  var list = A.el("div", "guesses"); main.appendChild(list);
  row.querySelector("#hint").onclick = doHint;

  restore();

  /* ── play ────────────────────────────────────────────────────────────── */

  function guess(iso) {
    if (over) return;
    if (guesses.indexOf(iso) >= 0) return A.toast("Already guessed that one", true);
    guesses.push(iso);
    var won = iso === answer;
    renderGuesses(); save();
    if (won) { A.sfx("win"); end(true); }
    else if (guesses.length >= TRIES) { A.sfx("lose"); end(false); }
    else A.sfx("miss");
  }

  function doHint() {
    if (over || hinted) return;
    hinted = true;
    var c = byIso[answer];
    var n = (c.bord || []).length;
    var size = c.area > 2e6 ? "enormous" : c.area > 5e5 ? "large" : c.area > 1e5 ? "mid-sized" : "small";
    hintBox.innerHTML = "💡 " + size + " (" + A.fmtNum(c.area) + " km²) · " +
      (n ? "borders " + n + " countr" + (n === 1 ? "y" : "ies") : "borders no one") +
      ' <span class="dim">(−8 pts)</span>';
    A.sfx("reveal"); save();
  }

  /* ── drawing ─────────────────────────────────────────────────────────── */

  function draw() {
    A.silhouette(cvs, answer, {
      rotate: over ? 0 : rot,
      fill: over ? "#3de08a" : "#ffe3f3",
      stroke: "#ffffff40", lw: 1.2, pad: 18,
    });
    tries.innerHTML = "";
    for (var t = 0; t < TRIES; t++) {
      var i = A.el("i");
      if (t < guesses.length) i.className = guesses[t] === answer ? "won" : "used";
      tries.appendChild(i);
    }
  }

  function renderGuesses() {
    draw();
    list.innerHTML = "";
    guesses.forEach(function (iso) {
      var c = byIso[iso], won = iso === answer;
      var d = dist(iso, answer), b = A.bearing(at(iso)[0], at(iso)[1], at(answer)[0], at(answer)[1]);
      var el = A.el("div", "gr" + (won ? " win" : ""));
      el.innerHTML = '<img alt="" src="' + A.rootPath() + "core/data/flags/" + iso +
        '.svg" onerror="this.style.visibility=\'hidden\'">' +
        '<span class="nm">' + A.esc(c.n) + "</span>" +
        (won ? '<span class="ar">🎉</span><span class="pc">100%</span>'
          : '<span class="km">' + A.geo.km(d) + '</span><span class="ar">' + A.arrow(b) +
            '</span><span class="pc">' + Math.round(A.geo.prox(d) * 100) + "%</span>");
      list.appendChild(el);
    });
  }

  /* ── persistence ─────────────────────────────────────────────────────── */

  function save() { if (!practice) A.save(ID, day, { guesses: guesses, hinted: hinted }); }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st) {
      guesses = st.guesses || [];
      if (st.hinted) doHint();
    }
    renderGuesses();
    if (st && st.done) {
      over = true; picker.disable(true); draw();
      setTimeout(function () { sheet(st.won, st.norm); }, 240);
    }
  }

  /* ── ending ──────────────────────────────────────────────────────────── */

  function end(won) {
    over = true; picker.disable(true); draw();
    var n = guesses.length;
    var norm = won ? Math.max(5, NORM[n] - (hinted ? 8 : 0)) : 10;

    var line = "";
    guesses.forEach(function (iso) {
      if (iso === answer) { line += "🟩"; return; }
      var d = dist(iso, answer);
      line += d < 1000 ? "🟨" : d < 4000 ? "🟧" : "⬛";
    });
    var grid = [line + "⬜".repeat(Math.max(0, TRIES - guesses.length))];
    if (hinted) grid.push("💡");

    if (!practice) {
      A.finish(ID, day, {
        score: norm, norm: norm, won: won, detail: won ? n + "/" + TRIES : "X/" + TRIES,
        bucket: won ? n : "X", shareGrid: grid, durationMs: Date.now() - t0,
        stamps: won ? [answer] : [],
      });
    } else if (won) A.stamp(answer, ID);

    if (won) A.confetti(n <= 2 ? 130 : 70);
    sheet(won, norm, grid);
  }

  function sheet(won, norm, grid) {
    var c = byIso[answer];
    var extra = '<p class="center" style="margin:6px 0 2px"><b style="font-size:17px;letter-spacing:2px">' +
      A.esc(c.n) + "</b></p>" +
      '<p class="center tiny muted">' + A.esc([c.cap, c.sub || c.reg].filter(Boolean).join(" · ")) +
      " · " + A.fmtNum(c.area) + " km²</p>" +
      (won ? '<p class="center tiny" style="color:var(--mint);margin-top:8px">🛂 stamped in your passport</p>' : "");

    A.results(ID, practice ? A.PRACTICE : day, {
      title: won ? (guesses.length <= 2 ? "CARTOGRAPHER" : "GOT IT") : "NOT THIS TIME",
      extraHTML: extra,
      state: { norm: norm, shareGrid: grid, won: won },
      shareText: "OUTLINE (practice)\n" + (grid || []).join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  window.addEventListener("resize", function () { clearTimeout(draw._t); draw._t = setTimeout(draw, 140); });

  window.__OL = {
    answer: function () { return answer; }, guess: guess,
    state: function () { return { guesses: guesses, over: over, rot: rot, pool: POOL.length }; },
  };
})();
