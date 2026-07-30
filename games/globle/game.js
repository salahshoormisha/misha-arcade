/* ============================================================================
   GLOBLE — every guess lights up on a real globe, coloured by how close it is.
   No guess limit; fewer is better.

   Better than the original:
     · the globe spins to your latest guess so you never lose it round the back
     · a running "closest so far" line, which the original makes you eyeball
     · neighbours of the answer are outlined at the end, so you learn the map
     · archive + practice + passport stamping

   NORM: 100 at 1 guess falling ~8 a guess — a 6-guess win lands ≈67, which is
   about the median result. Floor 5.
   ========================================================================== */
(function () {
  "use strict";

  var ID = "globle";

  var ALL = window.AD_COUNTRIES || [];
  var byIso = {};
  ALL.forEach(function (c) { byIso[c.i] = c; });

  // Only countries we can actually draw AND locate.
  // Anything we can both place and draw on the globe. GUESS is everything —
  // territories included, so typing Greenland or Taiwan works — while POOL is
  // the narrower set allowed to be the day's answer.
  var drawable = function (c) {
    return (c.capll || c.ll) && window.AD_WORLD && (window.AD_WORLD.rings(c.i) || []).length;
  };
  var GUESS = ALL.filter(drawable).map(function (c) { return c.i; });
  var POOL = ALL.filter(function (c) {
    return drawable(c) && (c.un === 1 || (c.pop || 0) >= 100000);
  }).map(function (c) { return c.i; });

  function at(iso) { var c = byIso[iso]; return c.capll || c.ll; }
  function dist(a, b) { return A.haversine(at(a)[0], at(a)[1], at(b)[0], at(b)[1]); }

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var answer, guesses = [], over = false, t0 = Date.now();
  var map, picker, cvs;

  function pickAnswer() {
    if (practice) return A.pick(A.rng(String(Date.now()) + Math.random()), POOL);
    return POOL[A.dailyIndex(ID, day, POOL.length)];
  }

  var main = A.mount({
    id: ID, dayN: day,
    help: "<p>Name any country. It lights up on the globe by <b>how close it is</b> to the mystery " +
      "country — deep violet is cold, red is nearly there.</p>" +
      "<ul><li>No limit on guesses, but your score falls with each one.</li>" +
      "<li>Drag to spin. The globe turns to whatever you just guessed.</li>" +
      "<li>At the end it outlines the answer's <b>neighbours</b>, which is how you " +
      "actually learn the map.</li></ul>",
  });

  if (!POOL.length || !window.AD_WORLD) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">Map data hasn\'t loaded yet.</p>';
    return;
  }
  answer = pickAnswer();

  cvs = A.el("canvas"); cvs.id = "globe";
  cvs.setAttribute("role", "img");
  cvs.setAttribute("aria-label", "A globe showing your guesses coloured by proximity");
  main.appendChild(cvs);

  var legend = A.el("div", "legend");
  legend.innerHTML = "COLD <span class='sw'>" +
    [12000, 9000, 6000, 3500, 1500, 300].map(function (k) {
      return "<i style='background:" + A.geo.heat(k) + "'></i>";
    }).join("") + "</span> HOT";
  main.appendChild(legend);

  var best = A.el("div", "best"); main.appendChild(best);

  var pickHost = A.el("div"); pickHost.style.marginTop = "12px";
  main.appendChild(pickHost);
  picker = A.picker(pickHost, { pool: GUESS, onPick: guess, placeholder: "name any country…" });

  var row = A.el("div", "ac-row"); row.style.marginTop = "10px";
  row.innerHTML = (practice ? '<a class="ac-pill" href="./">← TODAY\'S COUNTRY</a>'
    : '<a class="ac-pill" href="?practice=1">∞ PRACTICE</a>') +
    '<button class="ac-pill" id="spin">↻ SPIN TO CLOSEST</button>';
  main.appendChild(row);

  var list = A.el("div", "guesses"); main.appendChild(list);

  // Land/sea must be legible without becoming the loudest thing on the page:
  // neutral raised-surface land on a near-black ocean, hairline borders, and a
  // dim rim instead of the renderer's default cyan halo. The only saturated
  // colour on the globe is the guess heat itself.
  map = A.map(cvs, {
    mode: "globe", drag: true,
    colours: { sea: "#0b0a12", land: "#241f36", border: "#3a3450", rim: "#4a4459" },
  });
  map.spinTo(20, 10);

  row.querySelector("#spin").onclick = function () {
    var c = closest();
    if (c) { spinTo(c); } else { A.toast("Guess something first"); }
  };

  restore();

  /* ── play ────────────────────────────────────────────────────────────── */

  function guess(iso) {
    if (over) return;
    if (guesses.indexOf(iso) >= 0) return A.toast("Already guessed that one", true);
    guesses.push(iso);
    var won = iso === answer;
    paint();
    spinTo(iso);
    save();
    if (won) { A.sfx("win"); end(true); }
    else {
      var d = dist(iso, answer);
      A.sfx(d < 1500 ? "ok" : d < 5000 ? "near" : "miss");
    }
  }

  function closest() {
    var b = null, bd = Infinity;
    guesses.forEach(function (g) {
      var d = dist(g, answer);
      if (d < bd) { bd = d; b = g; }
    });
    return b;
  }

  function spinTo(iso) {
    var target = window.AD_WORLD.centroid(iso) || [at(iso)[1], at(iso)[0]];  // [lon,lat]
    animateTo(target[1], target[0]);
  }

  // Ease the globe round rather than snapping — it reads as a real object.
  function animateTo(lat, lon) {
    if (A.settings().reduceMotion) { map.spinTo(lat, lon); map.draw(); return; }
    var v = map.view;
    var fromLat = v.lat0, fromLon = v.lon0;
    var dLon = ((lon - fromLon + 540) % 360) - 180;
    var t0a = performance.now(), dur = 520;
    (function step(now) {
      var k = Math.min(1, (now - t0a) / dur);
      var e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      map.spinTo(fromLat + (lat - fromLat) * e, fromLon + dLon * e);
      map.draw();
      if (k < 1) requestAnimationFrame(step);
    })(t0a);
  }

  function paint() {
    map.clearFills(); map.clearMarkers();
    guesses.forEach(function (g) {
      map.fill(g, g === answer ? "#4ecb8f" : A.geo.heat(dist(g, answer)));
    });
    if (over) {
      map.stroke(answer, "#f5f2f8");
      (byIso[answer].bord || []).forEach(function (n) {
        if (byIso[n]) map.stroke(n, "#efbe5a");
      });
    }
    map.draw();
    renderList();
  }

  function renderList() {
    var b = closest();
    var n = guesses.length, plural = n + " guess" + (n === 1 ? "" : "es");
    // Once you've found it, "closest so far: DR Congo · 0.0 km" is nonsense —
    // say what actually happened instead.
    best.innerHTML = !b ? ""
      : b === answer
        ? "found it in <b>" + plural + "</b>"
        : "closest so far: <b>" + A.esc(byIso[b].n) + "</b> · " + A.geo.km(dist(b, answer)) +
          " · " + plural;
    var sorted = guesses.slice().sort(function (x, y) { return dist(x, answer) - dist(y, answer); });
    list.innerHTML = "";
    sorted.forEach(function (g) {
      var d = dist(g, answer), won = g === answer;
      var el = A.el("div", "gr" + (won ? " win" : ""));
      el.innerHTML = '<span class="dot" style="background:' + (won ? "#4ecb8f" : A.geo.heat(d)) + '"></span>' +
        '<span class="nm">' + A.esc(byIso[g].n) + "</span>" +
        '<span class="km">' + (won ? "✓ FOUND" : A.geo.km(d)) + "</span>";
      list.appendChild(el);
    });
  }

  /* ── persistence ─────────────────────────────────────────────────────── */

  function save() { if (!practice) A.save(ID, day, { guesses: guesses }); }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st) guesses = st.guesses || [];
    paint();
    if (guesses.length) spinTo(closest());
    if (st && st.done) {
      over = true; picker.disable(true); paint();
      setTimeout(function () { sheet(st.won, st.norm, st.shareGrid); }, 260);
    }
  }

  /* ── ending ──────────────────────────────────────────────────────────── */

  function end(won) {
    over = true;
    picker.disable(true);
    paint();
    var n = guesses.length;
    var norm = A.clamp(Math.round(108 - 8 * n), 5, 100);

    // Share grid: one square per guess, hottest-to-coldest as you actually went.
    var grid = [];
    var lineRow = "";
    guesses.forEach(function (g, i) {
      var d = dist(g, answer);
      lineRow += g === answer ? "🟩" : d < 1500 ? "🟥" : d < 4000 ? "🟧" : d < 8000 ? "🟨" : "🟦";
      if ((i + 1) % 8 === 0) { grid.push(lineRow); lineRow = ""; }
    });
    if (lineRow) grid.push(lineRow);

    if (!practice) {
      A.finish(ID, day, {
        score: n, norm: norm, won: won, detail: n + (n === 1 ? " guess" : " guesses"),
        bucket: n <= 3 ? "1-3" : n <= 5 ? "4-5" : n <= 8 ? "6-8" : n <= 12 ? "9-12" : "13+",
        shareGrid: grid, durationMs: Date.now() - t0, stamps: [answer],
      });
    } else { A.stamp(answer, ID); }

    A.confetti(n <= 4 ? 130 : 70);
    sheet(won, norm, grid);
  }

  function sheet(won, norm, grid) {
    var c = byIso[answer];
    var nb = (c.bord || []).map(function (i) { return byIso[i] && byIso[i].n; }).filter(Boolean);
    var extra = '<p class="center" style="margin:var(--sp-2) 0 2px">' +
      '<b style="font-size:var(--t-lg);letter-spacing:.08em">' + A.esc(c.n) + "</b></p>" +
      '<p class="center tiny muted">' + A.esc([c.cap, c.sub || c.reg].filter(Boolean).join(" · ")) + "</p>" +
      '<p class="center tiny" style="color:var(--amber);margin-top:var(--sp-2)">' +
      (nb.length ? "borders " + A.esc(nb.join(", ")) : "borders no one — it's an island") + "</p>" +
      '<p class="center tiny" style="color:var(--green);margin-top:var(--sp-2)">stamped in your passport</p>';

    A.results(ID, practice ? A.PRACTICE : day, {
      title: guesses.length <= 3 ? "UNCANNY" : guesses.length <= 6 ? "GOT THERE" : "THE LONG WAY",
      extraHTML: extra,
      state: { norm: norm, shareGrid: grid, won: won },
      shareText: "GLOBLE (practice) — " + guesses.length + " guesses\n" + (grid || []).join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  window.addEventListener("resize", function () {
    clearTimeout(paint._t); paint._t = setTimeout(function () { map.draw(); }, 140);
  });

  window.__GL = {
    answer: function () { return answer; },
    guess: guess,
    state: function () { return { guesses: guesses, over: over, pool: POOL.length }; },
  };
})();
