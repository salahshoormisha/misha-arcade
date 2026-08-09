/* ============================================================================
   TIMEGUESSR — five archive photographs. When, and where?
   ----------------------------------------------------------------------------
   Each round shows one freely-licensed Wikimedia Commons photograph. You set a
   year and drop a pin, and submit BOTH at once — there is no locking one half
   in and then thinking about the other. Then the round tells you what you were
   actually looking at, which is the whole point of the game.

   SCORING — the real game's shape (5,000 for the year + 5,000 for the place,
   10,000 a round, 50,000 a game) with both of its documented faults fixed.

   YEAR (max 5,000).  The original is a staircase: 0y→5000, 1y→4950, 2y→4800,
   3y→4600, 4y→4300, 5y→3900, 6-7y→3400, 8-10y→2500, 11-15y→2000, 16-20y→1000,
   21y+→0.  Two problems, both of which players complain about: the plateaus are
   wide (improving from 15 years off to 11 earns you literally nothing) and 21
   years off is a cliff-edge zero.  Ours is smooth and never quite reaches zero:

       n = |guess − actual|
       n = 0  → 5,000            (a distinct prize for nailing it)
       n > 0  → round(4800 · e^(−(n−1)/10))
       1y 4800 · 2y 4343 · 3y 3930 · 5y 3218 · 8y 2384 · 10y 1952
       15y 1184 · 20y 718 · 30y 264 · 50y 36

   PLACE (max 5,000).  The original is piecewise linear and DISCONTINUOUS at
   every breakpoint — 2,000,000 m scores 2500 but 2,000,001 m scores 1833, so a
   marginally better guess can score much worse — and it is far too forgiving
   (500 km off still banks 80% of the points).  Ours is the same smooth curve
   PLACEGUESSR uses, so the two photo cabinets share one mental model:

       d ≤ 25 km → 5,000          (146 of the 190 photos are city-centre
       else      → round(5000 · e^(−d/1200))   precision, so 25 km IS exact)
       100 km 4,600 · 250 km 4,060 · 500 km 3,296 · 1,000 km 2,173
       2,000 km 944 · 4,000 km 178 · 8,000 km 6

   Submit with no pin and you keep the year points and forfeit the place points
   — the real game's timeout rule, made into an ordinary move.

   NORM (CONTRACT §3).  50,000 needs five spot-on years AND five pins inside
   25 km, so it is the theoretical ceiling, not a realistic one. Piecewise
   linear through
       (0,0) → (30,000, 72) → (40,000, 92) → (50,000, 100)
   Calibrated on five-round games with the shape real ones have — a couple of
   rounds nailed, a couple respectable, one disaster:
     good      1y+40km, 4y+300km, 3y+600km, 7y+1,100km, 16y+2,600km = 30.3k → 73
     excellent 0y+10km, 1y+40km,  2y+150km, 4y+400km,   7y+900km    = 40.5k → 92
   That is CONTRACT §7's band exactly — a good day ≈70-75, an excellent one ≈90
   — and it is deliberately two thousand points a game meaner than the first cut
   of this curve, which handed 78 to a 30,000 and 94 to a 40,000 and so let an
   ordinary morning read like a triumph next to a WORDISHA 78. 100 needs a
   flawless five, not merely a very good one: 45,000 is still only 96.

   SHARE GRID.  Each half of a row is a three-segment bar of that half's score:
   a segment is green when it is full, yellow when it is half full, black when
   it is empty. The six cut points are therefore 6/6…1/6 of the half's 5,000,
   and they are SOLVED OUT OF THE CURVES at first use rather than typed in — so
   the row goes on meaning the same thing if a curve is ever retuned, and cannot
   drift into flattery. As solved today:
       📅  0y 🟩🟩🟩 · ≤2y 🟩🟩🟨 · ≤4y 🟩🟩⬛ · ≤7y 🟩🟨⬛ · ≤11y 🟩⬛⬛ · ≤18y 🟨⬛⬛
       🌍  ≤25km 🟩🟩🟩 · ≤218 🟩🟩🟨 · ≤486 🟩🟩⬛ · ≤832 🟩🟨⬛ · ≤1,318 🟩⬛⬛ · ≤2,149 🟨⬛⬛
   Past the last rung is ⬛⬛⬛, as is a half you forfeited and a round you never
   reached. The hand-typed bands this replaces paid a green square for a pin
   4,000 km out (178 of 5,000 points) and a yellow one for 8,000 km, so a game
   that banked 651 of 50,000 still shared a grid with colour in every row.

   THE YEAR RANGE IS READ FROM THE DATA at boot (min/max of AD_PHOTOS.time),
   never hard-coded: the photo set is still growing and the slider must track it.
   ========================================================================== */
(function () {
  "use strict";

  var ID = "timeguessr", ROUNDS = 5;
  var YEAR_MAX = 5000, PLACE_MAX = 5000, PER_ROUND = YEAR_MAX + PLACE_MAX;
  var MAXTOT = PER_ROUND * ROUNDS;          // 50,000
  var SOLID = 30000, GREAT = 40000;         // the two norm hinges
  var K_KM = 1200;                          // km constant of the place curve
  var FREE_KM = 25;                         // inside this, a perfect place score
  var YEAR_TAU = 10;                        // years constant of the year curve
  var STAMP_KM = 250;                       // close enough to stamp the passport

  var POOL = (window.AD_PHOTOS && window.AD_PHOTOS.time) || [];

  /* The slider's range is whatever the data actually holds, today. */
  var Y_MIN = 1900, Y_MAX = 2000, Y_MID = 1950;
  (function () {
    if (!POOL.length) return;
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i < POOL.length; i++) {
      var y = +POOL[i].year;
      if (!isFinite(y)) continue;
      if (y < lo) lo = y;
      if (y > hi) hi = y;
    }
    if (isFinite(lo) && isFinite(hi) && hi >= lo) {
      Y_MIN = lo; Y_MAX = hi; Y_MID = Math.round((lo + hi) / 2);
    }
  })();

  /* ── state ─────────────────────────────────────────────────────────────── */
  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var rounds = [];
  var yearGuess = [], pinAt = [], yScore = [], pScore = [], distKm = [], gotCountry = [];
  var r = 0, pin = null, year = Y_MID, resolved = false, over = false, dead = false;
  var t0 = Date.now();

  var main, stripEl, pipsEl, stageEl, figEl, shotEl, missEl, capEl;
  var mapCanvas, map, pinreadEl, rvEl, sumEl;
  var yearEl, sliderEl, goBtn, lbEl, lbImg;

  /* ── the five photographs ──────────────────────────────────────────────── */

  // One photo from each of five equal slices of the pool sorted by year, so
  // every day spans the archive instead of handing you five 1960s pictures.
  // Slicing by count (not by fixed decades) keeps the spread even as the set
  // grows and stays correct whatever years it ends up covering.
  function bands() {
    var sorted = POOL.slice().sort(function (a, b) {
      return (a.year - b.year) || (a.id < b.id ? -1 : 1);
    });
    var out = [], n = sorted.length;
    for (var i = 0; i < ROUNDS; i++) {
      out.push(sorted.slice(Math.floor(i * n / ROUNDS), Math.floor((i + 1) * n / ROUNDS)));
    }
    return out;
  }

  function seedRounds(dayN) {
    var out = [], iso = {}, bs = bands();
    if (!POOL.length) return out;
    var rnd = (dayN === A.PRACTICE) ? A.rng(String(Date.now()) + Math.random()) : null;

    for (var b = 0; b < bs.length; b++) {
      var band = bs[b];
      if (!band.length) continue;
      var chosen = null;
      if (rnd) {
        var bag = A.shuffle(rnd, band);
        for (var k = 0; k < bag.length; k++) {
          if (!iso[bag[k].iso2]) { chosen = bag[k]; break; }
        }
        chosen = chosen || bag[0];
      } else {
        // Deterministic, non-repeating, and independent per band. Walk forward
        // if the country is already used today.
        for (var probe = 0; probe < band.length; probe++) {
          var p = band[A.dailyIndex(ID + "/" + b, dayN + probe, band.length)];
          if (!p) continue;
          if (iso[p.iso2] && probe < band.length - 1) continue;
          chosen = p; break;
        }
        chosen = chosen || band[0];
      }
      iso[chosen.iso2] = 1;
      out.push(chosen);
    }
    // Thin pool: top up rather than shipping a four-round game.
    for (var f = 0; out.length < ROUNDS && f < POOL.length; f++) {
      if (out.indexOf(POOL[f]) < 0) out.push(POOL[f]);
    }
    return out.slice(0, ROUNDS);
  }

  /* ── scoring ───────────────────────────────────────────────────────────── */

  function yearPoints(off) {
    off = Math.abs(off);
    if (off === 0) return YEAR_MAX;
    return Math.round(4800 * Math.exp(-(off - 1) / YEAR_TAU));
  }

  function placePoints(km) {
    if (km === null || km === undefined) return 0;
    if (km <= FREE_KM) return PLACE_MAX;
    return Math.round(PLACE_MAX * Math.exp(-km / K_KM));
  }

  function roundScore(i) {
    if (yScore[i] === null || yScore[i] === undefined) return null;
    return yScore[i] + (pScore[i] || 0);
  }

  function total() {
    var s = 0;
    for (var i = 0; i < ROUNDS; i++) { var v = roundScore(i); if (v !== null) s += v; }
    return s;
  }

  function normFor(tot) {
    if (tot <= 0) return 0;
    if (tot <= SOLID) return Math.round(72 * tot / SOLID);
    if (tot <= GREAT) return Math.round(72 + 20 * (tot - SOLID) / (GREAT - SOLID));
    return Math.min(100, Math.round(92 + 8 * (tot - GREAT) / (MAXTOT - GREAT)));
  }

  // How hard is a given day? Old photographs are far harder to date than recent
  // ones, and a photo with more to read in it is more deducible.
  A.setPar(ID, function (dayN) {
    try {
      var set = seedRounds(dayN);
      if (!set.length) return null;
      var s = 0;
      set.forEach(function (p) {
        var v = 74;
        if (p.year < 1900) v -= 9;
        else if (p.year < 1940) v -= 4;
        else if (p.year >= 1990) v += 5;
        if ((p.clues || []).length >= 3) v += 2;
        s += v;
      });
      return A.clamp(Math.round(s / set.length), 45, 88);
    } catch (e) { return null; }
  });

  /* ── the page ──────────────────────────────────────────────────────────── */

  main = A.mount({
    id: ID, dayN: day, wide: true,
    help:
      "<p>Five real photographs from the archive. For each one, say <b>when</b> it was " +
      "taken and <b>where</b> — both at once, one shot each.</p>" +
      "<ul>" +
      "<li><b>Type the year</b>, drag the slider, or nudge it a year at a time. The range is " +
      Y_MIN + "–" + Y_MAX + " because that is what the archive holds.</li>" +
      "<li><b>Tap the map</b> to drop a pin. Zoom in and tap again to place it properly.</li>" +
      "<li><b>Make guess</b> submits both halves. No pin? You keep the year points and " +
      "forfeit the place points.</li>" +
      "<li><b>Tap the photograph</b> to enlarge it — the clue is often a shop sign, a car, " +
      "a hemline, a tram.</li>" +
      "</ul>" +
      "<p>Up to <b>5,000</b> for the year — spot on is 5,000, three years out is 3,930, " +
      "twenty is 718 — and up to <b>5,000</b> for the place: anything inside 25 km is full " +
      "marks, 500 km out is 3,296, 2,000 km is 944. Both curves are smooth, so a better " +
      "guess always scores better. <b>50,000</b> is the ceiling; 27,000 is a good day.</p>" +
      "<p class='tiny muted'>Every photograph is freely licensed, from Wikimedia Commons, " +
      "and its credit is shown when the round resolves. The pictures need a connection — " +
      "without one the round plays on its caption instead.</p>",
  });

  if (!POOL.length) {
    main.appendChild(A.el("p", "center muted",
      "The photo set didn't load. Reload the page, or try CLUEDROP — it needs no pictures."));
    return;
  }

  rounds = seedRounds(day);
  for (var i0 = 0; i0 < ROUNDS; i0++) {
    yearGuess[i0] = null; pinAt[i0] = null; yScore[i0] = null;
    pScore[i0] = null; distKm[i0] = null; gotCountry[i0] = false;
  }

  main.innerHTML =
    '<div class="strip" id="strip"></div>' +
    '<div class="pips" id="pips"></div>' +
    '<div class="stage" id="stage">' +
      '<div class="col">' +
        '<figure class="pwrap tap" id="pwrap">' +
          '<img id="shot" alt="The photograph for this round">' +
          '<div class="miss" id="miss" style="display:none">' +
            '<em>. . .</em>' +
            '<span>This picture needs a connection. Play the round on its caption below.</span>' +
          '</div>' +
          '<span class="zoomtag">tap to enlarge</span>' +
        '</figure>' +
        '<p class="cap" id="cap"></p>' +
      '</div>' +
      '<div class="col">' +
        '<div class="mapbox"><canvas id="gmap"></canvas></div>' +
        '<div class="maprow">' +
          '<button class="zbtn" id="zin" type="button" aria-label="Zoom in">+</button>' +
          '<button class="zbtn" id="zout" type="button" aria-label="Zoom out">&minus;</button>' +
          '<button class="zbtn wide" id="zres" type="button">Whole world</button>' +
          '<div class="pinread empty" id="pinread">Tap the map to drop a pin</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="rv hide" id="rv"></div>' +
    '<div id="sum"></div>' +
    '<div class="bar">' +
      '<div class="brow">' +
        '<button class="nudge" id="yminus" type="button" aria-label="One year earlier">' + chevron(1) + '</button>' +
        '<input id="year" type="number" inputmode="numeric" step="1" ' +
               'aria-label="The year you think this was taken">' +
        '<button class="nudge" id="yplus" type="button" aria-label="One year later">' + chevron(0) + '</button>' +
        '<button class="ac-btn" id="go" type="button">Make guess</button>' +
      '</div>' +
      '<div class="track"><input id="slider" type="range" step="1" aria-label="Year"></div>' +
      '<div class="ends"><span id="e0"></span><span id="e1"></span></div>' +
    '</div>';

  lbEl = A.el("div", "lightbox");
  lbEl.id = "lb";
  lbEl.innerHTML =
    '<button class="shut" type="button" aria-label="Close">&#10005;</button>' +
    '<img id="lbimg" alt="The photograph, enlarged">' +
    '<div class="note">tap anywhere to close</div>';
  document.body.appendChild(lbEl);

  function chevron(left) {
    return '<svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" ' +
      'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="' + (left ? "M12.5 4.5 6.5 10l6 5.5" : "M7.5 4.5 13.5 10l-6 5.5") + '"/></svg>';
  }

  stripEl = document.getElementById("strip");
  pipsEl = document.getElementById("pips");
  stageEl = document.getElementById("stage");
  figEl = document.getElementById("pwrap");
  shotEl = document.getElementById("shot");
  missEl = document.getElementById("miss");
  capEl = document.getElementById("cap");
  mapCanvas = document.getElementById("gmap");
  pinreadEl = document.getElementById("pinread");
  rvEl = document.getElementById("rv");
  sumEl = document.getElementById("sum");
  yearEl = document.getElementById("year");
  sliderEl = document.getElementById("slider");
  goBtn = document.getElementById("go");
  lbImg = document.getElementById("lbimg");

  yearEl.min = sliderEl.min = String(Y_MIN);
  yearEl.max = sliderEl.max = String(Y_MAX);
  yearEl.setAttribute("min", String(Y_MIN)); yearEl.setAttribute("max", String(Y_MAX));
  sliderEl.setAttribute("min", String(Y_MIN)); sliderEl.setAttribute("max", String(Y_MAX));
  document.getElementById("e0").textContent = String(Y_MIN);
  document.getElementById("e1").textContent = String(Y_MAX);

  /* ── the map ───────────────────────────────────────────────────────────── */

  map = A.map(mapCanvas, {
    mode: "equirect", drag: true, wheel: true,
    colours: { sea: "#06050b", land: "#241f36", border: "#3b3454" },
    onPick: function (lat, lon) {
      if (resolved || over) return;
      pin = [lat, lon];
      drawPin();
      A.sfx("key");
    },
  });
  map.resizeOn();

  var YOU = "#56c8f5";        // --cyan: your guess
  var TRUTH = "#efbe5a";      // --amber: what it actually was

  function worldView() {
    var ar = (map.w || 360) / (map.h || 170);
    var spanY = 360 / ar, mid = 12;
    map.view.lonL = -180; map.view.lonR = 180;
    map.view.latT = mid + spanY / 2; map.view.latB = mid - spanY / 2;
  }

  function fitBoth(a, b) {
    var ar = (map.w || 360) / (map.h || 170);
    var lo = Math.min(a[1], b[1]), hi = Math.max(a[1], b[1]);
    var lb = Math.min(a[0], b[0]), lt = Math.max(a[0], b[0]);
    var cx = (lo + hi) / 2, cy = (lb + lt) / 2;
    var spanX = Math.max(hi - lo, (lt - lb) * ar, 8) * 1.6;
    if (spanX > 360) { worldView(); return; }
    var spanY = spanX / ar;
    map.view.lonL = cx - spanX / 2; map.view.lonR = cx + spanX / 2;
    map.view.latT = cy + spanY / 2; map.view.latB = cy - spanY / 2;
  }

  function zoom(k) {
    var v = map.view;
    var cx = (v.lonL + v.lonR) / 2, cy = (v.latT + v.latB) / 2;
    var spanX = (v.lonR - v.lonL) * k;
    if (spanX > 360) { map.reset(); worldView(); map.draw(); drawPin(); return; }
    if (spanX < 1.2) return;
    var spanY = (v.latT - v.latB) * k;
    v.lonL = cx - spanX / 2; v.lonR = cx + spanX / 2;
    v.latT = cy + spanY / 2; v.latB = cy - spanY / 2;
    map.draw();
    drawPin();
  }

  function drawPin() {
    map.clearMarkers();
    if (pin) map.marker(pin[0], pin[1], { colour: YOU, pin: true, r: 5 });
    map.draw();
    paintPinread();
  }

  function byIso(iso) {
    var all = window.AD_COUNTRIES || [];
    for (var i = 0; i < all.length; i++) if (all[i].i === iso) return all[i];
    return null;
  }

  function isoAt(lat, lon) {
    try { return map.at(lat, lon); } catch (e) { return null; }
  }

  function fmtLL(lat, lon) {
    return Math.abs(lat).toFixed(1) + "°" + (lat >= 0 ? "N" : "S") + " " +
      Math.abs(lon).toFixed(1) + "°" + (lon >= 0 ? "E" : "W");
  }

  function paintPinread() {
    if (resolved) return;
    if (!pin) {
      pinreadEl.className = "pinread empty";
      pinreadEl.innerHTML = "Tap the map to drop a pin";
      return;
    }
    var rec = byIso(isoAt(pin[0], pin[1]));
    pinreadEl.className = "pinread";
    pinreadEl.innerHTML = "Pin <b>" + fmtLL(pin[0], pin[1]) + "</b> · <b>" +
      (rec ? A.esc(rec.n) : "at sea") + "</b>";
  }

  /* ── the year control ──────────────────────────────────────────────────── */

  function setYear(y, from) {
    y = A.clamp(Math.round(+y || Y_MID), Y_MIN, Y_MAX);
    year = y;
    if (from !== "field") yearEl.value = String(y);
    if (from !== "slider") sliderEl.value = String(y);
  }

  yearEl.addEventListener("input", function () {
    var raw = String(yearEl.value).replace(/[^0-9-]/g, "");
    if (raw === "" ) return;                       // mid-typing; leave it alone
    var v = +raw;
    if (v < Y_MIN || v > Y_MAX) {
      // Still typing "19…" toward 1972 — don't yank it to 1850 under their hands.
      if (String(Math.abs(v)).length >= String(Y_MAX).length) setYear(v, "field");
      return;
    }
    setYear(v, "field");
  });
  yearEl.addEventListener("change", function () { setYear(yearEl.value); });
  yearEl.addEventListener("blur", function () { setYear(yearEl.value); });

  sliderEl.addEventListener("input", function () { setYear(sliderEl.value, "slider"); });

  // Hold-to-repeat, like the original: one year, then a pause, then a run.
  // A press steps immediately, so the click that follows it must not step
  // again. `armed` is consumed by that click rather than cleared on a timer —
  // a timer would make a keyboard press in the same tick disappear.
  function bindNudge(btn, dir) {
    var delay = null, run = null, armed = false;
    function step() {
      if (resolved || over) return;
      setYear(year + dir);
      A.sfx("key");
    }
    function stopHold() { clearTimeout(delay); clearInterval(run); delay = run = null; }
    function abandon() { armed = false; stopHold(); }   // no click will follow
    btn.addEventListener("pointerdown", function () {
      if (resolved || over) return;
      armed = true;
      step();
      delay = setTimeout(function () { run = setInterval(step, 80); }, 400);
    });
    btn.addEventListener("pointerup", stopHold);
    btn.addEventListener("pointercancel", abandon);
    btn.addEventListener("pointerleave", abandon);
    window.addEventListener("pointerup", stopHold);   // released off the button
    btn.addEventListener("click", function () {
      if (armed) { armed = false; return; }           // already stepped on the press
      step();                                          // keyboard / assistive activation
    });
  }
  bindNudge(document.getElementById("yminus"), -1);
  bindNudge(document.getElementById("yplus"), 1);

  /* ── wiring ────────────────────────────────────────────────────────────── */

  document.getElementById("zin").onclick = function () { zoom(1 / 1.9); };
  document.getElementById("zout").onclick = function () { zoom(1.9); };
  document.getElementById("zres").onclick = function () {
    map.reset(); worldView(); map.draw(); drawPin();
  };
  goBtn.onclick = function () { resolved ? next() : submit(); };

  figEl.onclick = function () { if (!dead && shotEl.src) openLb(); };
  lbEl.onclick = function () { closeLb(); };

  function openLb() {
    lbImg.src = shotEl.src;
    // NOT inside requestAnimationFrame: rAF is paused in a background tab, so
    // the lightbox would silently never appear. Force the reflow, then show.
    void lbEl.offsetWidth;
    lbEl.classList.add("show");
  }
  function closeLb() { lbEl.classList.remove("show"); }

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (lbEl.classList.contains("show")) {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") { e.preventDefault(); closeLb(); }
      return;
    }
    if (document.querySelector(".ac-modal.show")) return;
    var t = e.target;
    var typing = (t === yearEl || t === sliderEl);
    if (e.key === "Enter" || (e.key === " " && !typing)) {
      if (goBtn.disabled) return;
      e.preventDefault();
      goBtn.click();
    }
  });

  restore();
  if (!over) {
    showRound();
  } else {
    stageEl.style.display = "none";
    document.querySelector(".bar").style.display = "none";
    paintStrip();
    summary();
    setTimeout(sheet, 260);
  }

  /* ── a round ───────────────────────────────────────────────────────────── */

  function cur() { return rounds[r]; }

  function showRound() {
    var p = cur();
    resolved = false; pin = null; dead = false;
    rvEl.className = "rv hide";
    rvEl.innerHTML = "";
    goBtn.textContent = "Make guess";
    goBtn.disabled = false;
    yearEl.disabled = false; sliderEl.disabled = false;
    setYear(Y_MID);                        // a fixed midpoint every round, never your last guess

    // A dead photo URL is routine, not exceptional — these live on Wikimedia and
    // the game must stay playable on a bad connection.
    figEl.className = "pwrap tap";
    shotEl.style.display = "";
    missEl.style.display = "none";
    shotEl.onerror = function () { failPhoto(); };
    shotEl.onload = function () {
      dead = false;
      figEl.className = "pwrap tap";
      shotEl.style.display = "";
      missEl.style.display = "none";
      paintCap();
    };
    shotEl.src = p.url;
    if (!p.url) failPhoto();

    paintCap();
    map.reset(); worldView(); map.clearMarkers(); map.draw();
    paintPinread();
    paintStrip();
    A.setSub((practice ? "PRACTICE" : "DAY " + day) + " · ROUND " + (r + 1) + " OF " + ROUNDS);
  }

  function failPhoto() {
    dead = true;
    figEl.className = "pwrap dead";
    shotEl.style.display = "none";
    missEl.style.display = "";
    paintCap();
  }

  function paintCap() {
    var p = cur();
    if (dead) {
      // Text-only fallback: with no picture, the caption IS the round.
      capEl.className = "cap";
      capEl.innerHTML = p.caption
        ? "<b>Without the picture:</b> " + A.esc(p.caption)
        : "No picture and no caption for this one — a guess in the dark.";
      return;
    }
    var clues = (p.clues || []).slice(0, 4);
    if (clues.length) {
      capEl.className = "cap";
      capEl.innerHTML = "In the frame: " + clues.map(function (c) { return A.esc(c); }).join(", ") + ".";
    } else {
      capEl.className = "cap none";
      capEl.innerHTML = "Nothing catalogued in this frame — read the picture itself.";
    }
  }

  function paintStrip() {
    var done = 0;
    for (var i = 0; i < ROUNDS; i++) if (roundScore(i) !== null) done++;
    stripEl.innerHTML =
      "<span>Round <b>" + Math.min(r + 1, ROUNDS) + "</b>/" + ROUNDS + "</span>" +
      "<span>" + done + " played</span>" +
      "<span>Banked <b>" + total().toLocaleString() + "</b></span>";
    var h = "";
    for (var j = 0; j < ROUNDS; j++) {
      var s = roundScore(j);
      var w = s === null ? 0 : Math.round(100 * s / PER_ROUND);
      h += "<i class='" + (j === r && !over ? "live" : "") + "'><b style='width:" + w + "%'></b></i>";
    }
    pipsEl.innerHTML = h;
  }

  /* ── submitting ────────────────────────────────────────────────────────── */

  function submit() {
    if (resolved || over) return;
    var p = cur();
    var off = Math.abs(year - p.year);
    var km = pin ? A.haversine(pin[0], pin[1], p.lat, p.lon) : null;

    yearGuess[r] = year;
    pinAt[r] = pin ? [pin[0], pin[1]] : null;
    yScore[r] = yearPoints(off);
    pScore[r] = pin ? placePoints(km) : 0;
    distKm[r] = km;
    gotCountry[r] = pin ? (isoAt(pin[0], pin[1]) === p.iso2) : false;
    resolved = true;

    map.clearMarkers();
    if (pin) {
      fitBoth(pin, [p.lat, p.lon]);
      map.marker(pin[0], pin[1], { colour: YOU, pin: true, r: 5 });
      map.line(pin, [p.lat, p.lon], { colour: "#f5f2f8aa", dash: [7, 5], width: 1.4 });
    } else {
      map.zoomTo(p.iso2, 1.6);
    }
    map.marker(p.lat, p.lon, { colour: TRUTH, pin: true, r: 5 });
    map.draw();

    var got = roundScore(r);
    A.sfx(got >= 8500 ? "stamp" : got >= 5000 ? "ok" : "miss");
    if (got >= 9200) A.confetti(50, { hearts: 0 });

    yearEl.disabled = true; sliderEl.disabled = true;
    setYear(year);
    paintVerdict();
    paintStrip();
    pinreadEl.className = "pinread";
    pinreadEl.innerHTML = pin
      ? "Yours in <b>blue</b>, the real place in <b>gold</b>"
      : "No pin — the real place is in <b>gold</b>";
    goBtn.textContent = r >= ROUNDS - 1 ? "Final score" : "Next round";
    save();
  }

  function yearsLine(off) {
    if (off === 0) return "spot on";
    return off === 1 ? "1 year off" : off.toLocaleString() + " years off";
  }

  function paintVerdict() {
    var p = cur(), i = r;
    var off = Math.abs(yearGuess[i] - p.year);
    var km = distKm[i];
    var h = "";

    h += '<div class="rline"><span class="k">Year</span><span class="v">' +
      "You said <b class='yr'>" + yearGuess[i] + "</b> · it was <b class='pl'>" + p.year +
      "</b> · " + yearsLine(off) +
      '</span><span class="p">' + yScore[i].toLocaleString() + "</span></div>";

    h += '<div class="rline"><span class="k">Place</span><span class="v">' +
      "<b class='pl'>" + A.esc(p.place) + "</b> · " +
      (km === null ? "no pin — place forfeited"
        : km <= FREE_KM ? A.geo.km(km) + " out — inside 25 km, full marks"
          : A.geo.km(km) + " out · " + (gotCountry[i] ? "right country" : "wrong country")) +
      '</span><span class="p">' + pScore[i].toLocaleString() + "</span></div>";

    h += '<div class="rline tot"><span class="k">Round</span><span class="v">of ' +
      PER_ROUND.toLocaleString() + '</span><span class="p">' +
      roundScore(i).toLocaleString() + "</span></div>";

    h += '<div class="legend"><span><i class="you"></i>your pin</span>' +
      '<span><i class="act"></i>the real place</span></div>';

    var stamp = stampFor(i);
    h += '<div class="stamped' + (stamp ? "" : " no") + '">' +
      (stamp ? "Passport stamped · " + A.esc((byIso(stamp) || {}).n || stamp)
        : "No stamp — land inside 250 km, or in the right country, to collect one") +
      "</div>";

    if (p.caption) {
      h += '<div class="full">What you were looking at: ' + A.esc(p.caption) + "</div>";
    }
    h += '<div class="ac-credit">' + A.esc(p.credit) + " · " + A.esc(p.licence) +
      ' · <a href="' + A.esc(p.page) + '" target="_blank" rel="noopener">the file on Commons</a></div>';

    rvEl.innerHTML = h;
    // Synchronous reveal — see openLb() for why this is never done in a rAF.
    void rvEl.offsetWidth;
    rvEl.className = "rv";
  }

  function stampFor(i) {
    if (yScore[i] === null) return null;
    if (gotCountry[i] || (distKm[i] !== null && distKm[i] <= STAMP_KM)) return rounds[i].iso2;
    return null;
  }

  function next() {
    if (r >= ROUNDS - 1) return end();
    r++;
    save();
    showRound();
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { window.scrollTo(0, 0); }
  }

  /* ── persistence ───────────────────────────────────────────────────────── */

  function ids() { return rounds.map(function (p) { return p.id; }).join("|"); }

  function save() {
    if (practice) return;
    A.save(ID, day, {
      r: r, ids: ids(), yearGuess: yearGuess, pinAt: pinAt,
      yScore: yScore, pScore: pScore, distKm: distKm, gotCountry: gotCountry,
    });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (!st) return;
    if (String(st.ids || "") !== ids()) return;      // the pool moved under us
    yearGuess = st.yearGuess || yearGuess;
    pinAt = st.pinAt || pinAt;
    yScore = st.yScore || yScore;
    pScore = st.pScore || pScore;
    distKm = st.distKm || distKm;
    gotCountry = st.gotCountry || gotCountry;
    r = A.clamp(st.r || 0, 0, ROUNDS - 1);
    if (st.done) over = true;
  }

  /* ── ending ────────────────────────────────────────────────────────────── */

  function yearBand(i) {
    if (yScore[i] === null || yearGuess[i] === null) return null;
    return Math.abs(yearGuess[i] - rounds[i].year);
  }

  function blocks(n, cb) {
    var g = cb ? "🟦" : "🟩";   // 🟦 / 🟩
    var y = cb ? "🟧" : "🟨";   // 🟧 / 🟨
    var b = "⬛";                                // ⬛
    return [g, y, b][n[0]] + [g, y, b][n[1]] + [g, y, b][n[2]];
  }

  // A three-segment bar of the half's score: full segment green, half-full
  // yellow, empty black — so six rungs at 6/6…1/6 of the half's 5,000, and a
  // seventh, all black, for anything below the last one.
  var LADDER = [
    [0, 0, 0],   // 6/6 — full marks
    [0, 0, 1],   // 5/6
    [0, 0, 2],   // 4/6
    [0, 1, 2],   // 3/6
    [0, 2, 2],   // 2/6
    [1, 2, 2],   // 1/6
    [2, 2, 2],   // below that, forfeited, or never reached
  ];
  var SIXTHS = [1, 5 / 6, 4 / 6, 3 / 6, 2 / 6, 1 / 6];

  // The rungs are SOLVED out of yearPoints/placePoints, not typed in, so the
  // grid cannot drift away from the scoring. Walking one unit at a time is fine
  // — it is ~5,000 Math.exp calls, once, and only when a game ends. Memoised,
  // and computed on first use rather than at load, because a `var` read during
  // module set-up would be undefined.
  var CUTS = null;
  function barCuts() {
    if (CUTS) return CUTS;
    var yr = [], pl = [];
    for (var i = 0; i < SIXTHS.length; i++) {
      var need = SIXTHS[i];
      var n = -1;
      while (n < 400 && yearPoints(n + 1) >= need * YEAR_MAX) n++;
      yr.push(n);
      var d = -1;
      while (d < 21000 && placePoints(d + 1) >= need * PLACE_MAX) d++;
      pl.push(d);
    }
    CUTS = { year: yr, place: pl };
    return CUTS;
  }

  // `cuts` ascends, so the first rung the value fits inside is the right one.
  function bar(v, cuts, cb) {
    if (v === null || v === undefined) return blocks(LADDER[LADDER.length - 1], cb);
    for (var i = 0; i < cuts.length; i++) if (v <= cuts[i]) return blocks(LADDER[i], cb);
    return blocks(LADDER[LADDER.length - 1], cb);
  }

  function yearRow(off, cb) {
    return bar(off === null || off === undefined ? null : Math.abs(off), barCuts().year, cb);
  }

  function placeRow(km, cb) {
    return bar(km, barCuts().place, cb);
  }

  function shareGrid() {
    var cb = A.settings().colourblind, out = [];
    for (var i = 0; i < ROUNDS; i++) {
      var played = roundScore(i) !== null;
      out.push("🌍" + placeRow(played ? distKm[i] : null, cb) + " " +
        "📅" + yearRow(played ? yearBand(i) : null, cb));
    }
    return out;
  }

  function shareText() {
    return "TIMEGUESSR " + (practice ? "(practice)" : "#" + day) + " " +
      total().toLocaleString() + "/" + MAXTOT.toLocaleString() + "\n" +
      shareGrid().join("\n") + "\n" + A.SITE;
  }

  function end() {
    if (over) return;
    over = true;
    var tot = total(), norm = normFor(tot);
    var stamps = [], right = 0, spot = 0;
    for (var i = 0; i < ROUNDS; i++) {
      var s = stampFor(i);
      if (s) stamps.push(s);
      if (gotCountry[i]) right++;
      if (yearBand(i) === 0) spot++;
    }
    var detail = tot.toLocaleString() + " pts · " + right + "/5 places";

    if (!practice) {
      A.finish(ID, day, {
        score: tot, norm: norm, won: tot >= SOLID, detail: detail,
        bucket: Math.min(9, Math.floor(norm / 10)) * 10,
        shareGrid: shareGrid(), stamps: stamps, durationMs: Date.now() - t0,
      });
    } else {
      stamps.forEach(function (s) { A.stamp(s, ID); });
    }

    if (norm >= 92) { A.sfx("perfect"); A.confetti(170, { hearts: 0 }); }
    else if (tot >= SOLID) { A.sfx("win"); A.confetti(90, { hearts: 0 }); }
    else A.sfx("lose");

    goBtn.disabled = true;
    goBtn.textContent = "Done";
    yearEl.disabled = true; sliderEl.disabled = true;
    paintStrip();
    summary();
    sheet();
  }

  function summary() {
    var h = '<div class="rv sumhead"><div class="rline"><span class="k">All five</span>' +
      '<span class="v">what they were, and how you did</span>' +
      '<span class="p">' + total().toLocaleString() + "</span></div>";
    for (var i = 0; i < ROUNDS; i++) {
      var p = rounds[i], s = roundScore(i);
      h += '<div class="sumrow"><b>' + (i + 1) + "</b><span>" + p.year + " · " +
        A.esc(p.place) + "</span><u>" + (s === null ? "—" : s.toLocaleString()) + "</u></div>";
      h += '<div class="sumrow"><b></b><span>' +
        (s === null ? "not played"
          : yearsLine(yearBand(i)) + " · " +
            (distKm[i] === null ? "no pin" : A.geo.km(distKm[i]) + " out")) +
        "</span><u></u></div>";
    }
    h += "</div>";
    sumEl.innerHTML = h;
  }

  function sheet() {
    var tot = total(), norm = normFor(tot);
    var right = 0, spot = 0, bestI = 0, best = -1;
    for (var i = 0; i < ROUNDS; i++) {
      if (gotCountry[i]) right++;
      if (yearBand(i) === 0) spot++;
      if ((roundScore(i) || 0) > best) { best = roundScore(i) || 0; bestI = i; }
    }
    var extra = "<p class='center tiny muted' style='margin-top:6px'><b>" +
      tot.toLocaleString() + "</b> of " + MAXTOT.toLocaleString() + " · <b>" + right +
      "</b> of 5 right countries · best round <b>" + A.esc(rounds[bestI].place) + ", " +
      rounds[bestI].year + "</b> at " + best.toLocaleString() + "</p>" +
      "<p class='center tiny dim'>A good five rounds is " + SOLID.toLocaleString() +
      " — about 6,000 a round, which is the year inside half a decade and the pin " +
      "inside 700 km. An excellent one is " + GREAT.toLocaleString() + ".</p>";

    var m = A.results(ID, practice ? A.PRACTICE : day, {
      title: norm >= 92 ? "ARCHIVIST" : tot >= SOLID ? "WELL DATED" : right >= 3 ? "RIGHT MAP" : "NEXT TIME",
      extraHTML: extra,
      state: { norm: norm, shareGrid: shareGrid(), won: tot >= SOLID },
      shareText: shareText(),
      onReplay: function () { location.reload(); },
    });
    var sb = m.body.querySelector("#ac-share");
    if (sb) sb.onclick = function () { A.share(practice ? shareText() : A.shareCard(ID, day)); };
    return m;
  }

  /* ── debug hook — every one of these drives the REAL control ───────────── */

  window.__TG = {
    state: function () {
      return {
        day: day, practice: practice, r: r, resolved: resolved, over: over, dead: dead,
        year: year, pin: pin && pin.slice(),
        yMin: Y_MIN, yMax: Y_MAX, yMid: Y_MID,
        yearGuess: yearGuess.slice(), pinAt: pinAt.slice(),
        yScore: yScore.slice(), pScore: pScore.slice(), distKm: distKm.slice(),
        gotCountry: gotCountry.slice(),
        total: total(), norm: normFor(total()),
        rounds: rounds.map(function (p) {
          return { id: p.id, year: p.year, place: p.place, iso2: p.iso2, lat: p.lat, lon: p.lon };
        }),
      };
    },
    answer: function () { var p = cur(); return { year: p.year, lat: p.lat, lon: p.lon, iso2: p.iso2, place: p.place }; },

    // type into the real field, exactly as a keyboard does
    type: function (y) {
      yearEl.value = String(y);
      yearEl.dispatchEvent(new Event("input", { bubbles: true }));
      yearEl.dispatchEvent(new Event("change", { bubbles: true }));
      return year;
    },
    // drag the real slider
    slide: function (y) {
      sliderEl.value = String(y);
      sliderEl.dispatchEvent(new Event("input", { bubbles: true }));
      return year;
    },
    // a finger on the nudge: press, release, click — the whole sequence, so the
    // hold-to-repeat timer is armed AND disarmed exactly as it would be
    nudge: function (dir) {
      var b = document.getElementById(dir < 0 ? "yminus" : "yplus");
      var o = { bubbles: true, cancelable: true, pointerId: 1, pointerType: "mouse", isPrimary: true };
      try { b.dispatchEvent(new PointerEvent("pointerdown", o)); } catch (e) {}
      try { b.dispatchEvent(new PointerEvent("pointerup", o)); } catch (e) {}
      b.dispatchEvent(new MouseEvent("click", o));
      return year;
    },
    // the same button reached from the keyboard: a bare click, no pointer at all
    nudgeKey: function (dir) {
      var b = document.getElementById(dir < 0 ? "yminus" : "yplus");
      b.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      return year;
    },

    // a tap on the canvas at that lat/lon — the map's own hit-testing runs
    drop: function (lat, lon) {
      var q = map.project(lat, lon);
      var box = mapCanvas.getBoundingClientRect();
      var o = {
        bubbles: true, cancelable: true, pointerId: 1, pointerType: "mouse",
        isPrimary: true, clientX: box.left + q[0], clientY: box.top + q[1],
      };
      try { mapCanvas.dispatchEvent(new PointerEvent("pointerdown", o)); } catch (e) {}
      mapCanvas.dispatchEvent(new PointerEvent("pointerup", o));
      return pin;
    },
    go: function () { document.getElementById("go").click(); },
    photoFailed: function () { shotEl.dispatchEvent(new Event("error")); return dead; },
    photoLoaded: function () { shotEl.dispatchEvent(new Event("load")); return dead; },
    share: shareGrid,
    shareText: shareText,
    points: { year: yearPoints, place: placePoints, norm: normFor },

    // play the whole thing: `yoff` years and `koff` km of deliberate error
    autoplay: function (yoff, koff) {
      var guard = 0;
      while (!over && guard++ < 40) {
        var a = this.answer();
        this.type(A.clamp(a.year + (yoff === undefined ? 3 : yoff), Y_MIN, Y_MAX));
        if (koff !== null) this.drop(a.lat + (koff === undefined ? 200 : koff) / 111.32, a.lon);
        this.go();     // submit
        this.go();     // next round / final score
      }
      return this.state();
    },
  };
})();
