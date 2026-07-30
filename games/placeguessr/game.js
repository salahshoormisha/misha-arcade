/* ============================================================================
   PLACEGUESSR — one photograph, one pin, five rounds.
   ----------------------------------------------------------------------------
   GeoGuessr's reasoning without Google Street View (whose imagery may not be
   cached or redistributed): 255 freely-licensed Wikimedia Commons photographs,
   every one with the coordinate the file itself records. Not the monuments —
   the roadsides. Read the script on the signs, the plants, which side of the
   road the traffic is on.

   SCORING — one smooth monotonic curve, deliberately unlike either original
     round points = 5000 · e^(−d/1200)   with d in km, and a flat 5000 inside 25 km
     0 km 5000 · 100 km 4600 · 250 km 4058 · 500 km 3293 · 1000 km 2168
     2000 km 940 · 4000 km 177 · 8000 km 6
   GeoGuessr's own curve is 5000·e^(−10d/D) where D is the pack's bounding-box
   diagonal (≈14,900 km worldwide, so k≈1490); this is a little harsher, and it
   is smooth, so a better guess ALWAYS scores better. TimeGuessr's piecewise
   staircase is not copied: it is discontinuous at every breakpoint (2,000,000 m
   scores 2500 but 2,000,001 m scores 1833 — one extra metre costs 667 points)
   and it pays 80% of the location points for missing the country by 500 km.

   HINTS cost 350 each. The first clue of every round is free — it is also the
   whole round when the photo can't load, and on a dead connection every clue
   becomes free rather than the round becoming unplayable.

   NORM (CONTRACT §3) — 25,000 is the theoretical max and effectively
   unreachable, so norm is piecewise linear through
     (0,0) → (14,000, 72) → (20,500, 92) → (25,000, 100)
   i.e. averaging ~660 km of error across five rounds is a solid day (72) and
   ~240 km is an excellent one (92). 100 needs five rounds inside ~50 km.
   ========================================================================== */
(function () {
  "use strict";

  var ID = "placeguessr", ROUNDS = 5, PER = 5000, HINT_COST = 350;
  var K = 1200;                    // km constant of the scoring curve
  var FREE_RADIUS = 25;            // inside this, a perfect round
  var SOLID = 14000, GREAT = 20500, MAXTOT = PER * ROUNDS;

  var POOL = (window.AD_PHOTOS && window.AD_PHOTOS.place) || [];

  /* ── state ─────────────────────────────────────────────────────────────── */
  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var rounds = [];                 // the five photos
  var scores = [], dists = [], guessed = [], hintsUsed = [], gotCountry = [];
  var r = 0, pin = null, resolved = false, over = false, offline = false;
  var shown = 0;                   // clues revealed this round
  var t0 = Date.now();
  var main, hud, pipsEl, figEl, shotEl, noshotEl, figlineEl, hintBtn, cluesEl;
  var mapCanvas, map, pinoutEl, goBtn, verdictEl, reviewEl;

  /* ── round selection ───────────────────────────────────────────────────── */

  function seedRounds() {
    var out = [];
    if (!POOL.length) return out;
    if (practice) {
      var rnd = A.rng(String(Date.now()) + Math.random());
      var bag = A.shuffle(rnd, POOL);
      // spread the practice set over continents too, cheaply: no two from one country
      var seen = {};
      for (var i = 0; i < bag.length && out.length < ROUNDS; i++) {
        if (seen[bag[i].iso2]) continue;
        seen[bag[i].iso2] = 1; out.push(bag[i]);
      }
      while (out.length < ROUNDS && out.length < POOL.length) out.push(bag[out.length]);
      return out;
    }
    // Deterministic and non-repeating: walk A.dailyIndex forward until we have
    // five distinct photos from five distinct countries.
    var used = {}, iso = {}, probe = 0;
    while (out.length < ROUNDS && probe < POOL.length * 2) {
      var j = A.dailyIndex(ID, day * ROUNDS + probe, POOL.length);
      probe++;
      var p = POOL[j];
      if (!p || used[j]) continue;
      if (iso[p.iso2] && out.length < ROUNDS) continue;
      used[j] = 1; iso[p.iso2] = 1; out.push(p);
    }
    // relax the one-country rule if the pool is thin
    probe = 0;
    while (out.length < ROUNDS && probe < POOL.length * 2) {
      var j2 = A.dailyIndex(ID, day * ROUNDS + probe, POOL.length);
      probe++;
      if (!used[j2]) { used[j2] = 1; out.push(POOL[j2]); }
    }
    return out;
  }

  /* ── scoring ───────────────────────────────────────────────────────────── */

  function distPoints(km) {
    if (km <= FREE_RADIUS) return PER;
    return Math.round(PER * Math.exp(-km / K));
  }

  function roundPoints(km, paidHints) {
    return Math.max(0, distPoints(km) - HINT_COST * paidHints);
  }

  function total() {
    var s = 0;
    for (var i = 0; i < scores.length; i++) s += (scores[i] || 0);
    return s;
  }

  function normFor(tot) {
    if (tot <= 0) return 0;
    if (tot <= SOLID) return Math.round(72 * tot / SOLID);
    if (tot <= GREAT) return Math.round(72 + 20 * (tot - SOLID) / (GREAT - SOLID));
    return Math.min(100, Math.round(92 + 8 * (tot - GREAT) / (MAXTOT - GREAT)));
  }

  // Today's difficulty, for A.par. A landmark round ("easy:1") is a recognition
  // round, so it lifts the expected score; a photo with more written clues is
  // more deducible.
  A.setPar(ID, function (dayN) {
    var save = day, out;
    try {
      day = dayN;
      var set = seedRounds();
      if (!set.length) return null;
      var easy = 0, clues = 0;
      set.forEach(function (p) { easy += p.easy ? 1 : 0; clues += (p.clues || []).length; });
      out = Math.round(60 + 4 * easy + (clues / set.length - 2) * 3);
    } catch (e) { out = null; }
    day = save;
    return out === undefined ? null : A.clamp(out, 45, 88);
  });

  /* ── boot ──────────────────────────────────────────────────────────────── */

  main = A.mount({
    id: ID, dayN: day, wide: true,
    help:
      "<p>Five photographs, five pins. Drop a pin where you think each one was " +
      "taken; you're scored on how far off you are, as the crow flies.</p>" +
      "<ul>" +
      "<li><b>Read the frame, not the landmark.</b> The script on the signs, which side " +
      "the traffic drives on, the plants, the soil colour, the roof tiles, the poles.</li>" +
      "<li><b>Tap the map</b> to place a pin, drag to pan, scroll or use +/− to zoom in and " +
      "place it again more precisely. The pin readout names the country you're in.</li>" +
      "<li><b>The first clue each round is free.</b> Every clue after that costs 350 points. " +
      "If the photos can't load, every clue is free and the round plays on the words alone.</li>" +
      "<li><b>Tap the photograph</b> to enlarge it.</li>" +
      "</ul>" +
      "<p>Points fall smoothly: <b>5,000</b> within 25 km, 4,600 at 100 km, 3,293 at 500 km, " +
      "2,168 at 1,000 km, 940 at 2,000 km. There are no cliff edges — a better guess always " +
      "scores better, which is not true of the game this is based on.</p>" +
      "<p class='tiny muted'>Every photograph is freely licensed, from Wikimedia Commons, and " +
      "the credit is shown after each round. No Street View: its imagery can't legally be " +
      "shipped offline.</p>",
  });

  if (!POOL.length) {
    main.appendChild(A.el("p", "center muted",
      "The photo set didn't load. Reload, or try CLUEDROP — it needs no pictures."));
    return;
  }

  rounds = seedRounds();
  for (var i = 0; i < ROUNDS; i++) { scores[i] = null; dists[i] = null; guessed[i] = null; hintsUsed[i] = 0; gotCountry[i] = false; }

  hud = A.el("div", null, "");
  hud.id = "hud";
  main.appendChild(hud);

  var stage = A.el("div", null, "");
  stage.id = "stage";
  main.appendChild(stage);

  /* left column: the photograph and the clue ladder */
  var leftCol = A.el("div", null, "");
  stage.appendChild(leftCol);

  figEl = A.el("figure", null, "");
  figEl.id = "fig";
  shotEl = A.el("img", null);
  shotEl.id = "shot";
  shotEl.alt = "The photograph for this round";
  noshotEl = A.el("div", null,
    '<span class="ttl">No picture</span>' +
    '<span class="say">The photo needs a connection. Play it on the clues below — ' +
    "they're all free while the pictures are down.</span>");
  noshotEl.id = "noshot";
  noshotEl.style.display = "none";
  figEl.appendChild(shotEl);
  figEl.appendChild(noshotEl);
  leftCol.appendChild(figEl);

  figlineEl = A.el("div", "figline", "");
  leftCol.appendChild(figlineEl);

  hintBtn = A.el("button", "ac-btn ghost sm", "Reveal a clue");
  hintBtn.id = "hintbar";
  hintBtn.style.display = "block";
  hintBtn.style.margin = "var(--sp-3) auto 0";
  leftCol.appendChild(hintBtn);

  cluesEl = A.el("ul", null, "");
  cluesEl.id = "clues";
  leftCol.appendChild(cluesEl);

  /* right column: the map and the console */
  var rightCol = A.el("div", null, "");
  stage.appendChild(rightCol);

  var mapbox = A.el("div", null, "");
  mapbox.id = "mapbox";
  mapCanvas = A.el("canvas", null);
  mapCanvas.id = "gmap";
  mapbox.appendChild(mapCanvas);
  rightCol.appendChild(mapbox);

  var ctl = A.el("div", "mapctl", "");
  ctl.innerHTML =
    '<button class="ac-pill" id="zin" aria-label="Zoom in">+</button>' +
    '<button class="ac-pill" id="zout" aria-label="Zoom out">−</button>' +
    '<button class="ac-pill" id="zres">Whole world</button>';
  rightCol.appendChild(ctl);

  var act = A.el("div", null, "");
  act.id = "act";
  pinoutEl = A.el("div", null, "");
  pinoutEl.id = "pinout";
  goBtn = A.el("button", "ac-btn", "Make guess");
  goBtn.id = "go";
  goBtn.disabled = true;
  act.appendChild(pinoutEl);
  act.appendChild(goBtn);
  rightCol.appendChild(act);

  verdictEl = A.el("div", null, "");
  verdictEl.id = "verdict";
  main.appendChild(verdictEl);

  reviewEl = A.el("div", null, "");
  main.appendChild(reviewEl);

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

  function drawPin() {
    map.clearMarkers();
    if (pin) map.marker(pin[0], pin[1], { colour: "#56c8f5", pin: true, r: 5 });
    map.draw();
    paintPinout();
  }

  function paintPinout() {
    if (!pin) {
      pinoutEl.className = "";
      pinoutEl.innerHTML = "Tap the map to drop a pin";
      goBtn.disabled = true;
      return;
    }
    var iso = null;
    try { iso = map.at(pin[0], pin[1]); } catch (e) { iso = null; }
    var rec = iso ? byIso(iso) : null;
    pinoutEl.className = "";
    pinoutEl.innerHTML = "Pin <b>" + fmtLL(pin[0], pin[1]) + "</b>" +
      (rec ? " · <b>" + A.esc(rec.n) + "</b>" : " · <b>at sea</b>");
    goBtn.disabled = false;
  }

  function fmtLL(lat, lon) {
    return Math.abs(lat).toFixed(1) + "°" + (lat >= 0 ? "N" : "S") + " " +
      Math.abs(lon).toFixed(1) + "°" + (lon >= 0 ? "E" : "W");
  }

  function zoom(k) {
    var v = map.view;
    var cx = (v.lonL + v.lonR) / 2, cy = (v.latT + v.latB) / 2;
    var spanX = (v.lonR - v.lonL) * k;
    if (spanX > 360) { map.reset(); worldView(); map.draw(); drawPin(); return; }
    if (spanX < 1.2) return;
    v.lonL = cx - spanX / 2; v.lonR = cx + spanX / 2;
    var spanY = (v.latT - v.latB) * k;
    v.latT = cy + spanY / 2; v.latB = cy - spanY / 2;
    map.draw();
    drawPin();
  }

  // Keep the longitude/latitude spans matching the canvas so the world is not
  // stretched. The canvas ratio comes from CSS, so read it after a draw.
  function worldView() {
    var ar = (map.w || 360) / (map.h || 141);
    var spanY = 360 / ar, mid = 12;
    map.view.lonL = -180; map.view.lonR = 180;
    map.view.latT = mid + spanY / 2; map.view.latB = mid - spanY / 2;
  }

  function fitBoth(a, b) {
    var ar = (map.w || 360) / (map.h || 141);
    var lo = Math.min(a[1], b[1]), hi = Math.max(a[1], b[1]);
    var lb = Math.min(a[0], b[0]), lt = Math.max(a[0], b[0]);
    var cx = (lo + hi) / 2, cy = (lb + lt) / 2;
    var spanX = Math.max(hi - lo, (lt - lb) * ar, 6) * 1.6;
    if (spanX > 360) { worldView(); return; }
    var spanY = spanX / ar;
    map.view.lonL = cx - spanX / 2; map.view.lonR = cx + spanX / 2;
    map.view.latT = cy + spanY / 2; map.view.latB = cy - spanY / 2;
  }

  ctl.querySelector("#zin").onclick = function () { zoom(1 / 1.9); };
  ctl.querySelector("#zout").onclick = function () { zoom(1.9); };
  ctl.querySelector("#zres").onclick = function () { map.reset(); worldView(); map.draw(); drawPin(); };
  goBtn.onclick = function () { resolved ? next() : submit(); };
  // NOT `hintBtn.onclick = revealClue` — the handler would receive the
  // MouseEvent as `silent`, which is truthy, so a paid clue would silently
  // become free. Wrap it.
  hintBtn.onclick = function () { revealClue(false); };
  figEl.onclick = function () { figEl.classList.toggle("big"); };

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector(".ac-modal.show")) return;
    if (e.key === " " || e.key === "Enter") {
      if (goBtn.disabled) return;
      e.preventDefault();
      goBtn.click();
    }
  });

  function byIso(iso) {
    var all = window.AD_COUNTRIES || [];
    for (var i = 0; i < all.length; i++) if (all[i].i === iso) return all[i];
    return null;
  }

  restore();
  if (!over) {
    showRound();
  } else {
    // Re-entry after finishing: the stage would be an empty photo frame and a
    // dead console, so drop it and let the review carry the five rounds.
    stage.style.display = "none";
    paintHud();
    review();
    setTimeout(sheet, 260);
  }

  /* ── a round ───────────────────────────────────────────────────────────── */

  function cur() { return rounds[r]; }

  function showRound() {
    var p = cur();
    resolved = false; pin = null; shown = 0; offline = false;
    verdictEl.innerHTML = "";
    figEl.classList.remove("big");
    cluesEl.innerHTML = "";
    goBtn.textContent = "Make guess";
    goBtn.disabled = true;

    // Photo. A dead URL is routine, not exceptional: fall back to the words.
    shotEl.style.display = "";
    noshotEl.style.display = "none";
    figEl.classList.remove("dead");
    shotEl.onerror = function () {
      offline = true;
      shotEl.style.display = "none";
      noshotEl.style.display = "";
      paintClues();
    };
    shotEl.onload = function () { shotEl.style.display = ""; noshotEl.style.display = "none"; };
    shotEl.src = p.url;

    figlineEl.innerHTML = p.caption
      ? '<span>' + A.esc(p.caption) + "</span>" : '<span class="dim">No caption on this one.</span>';

    map.reset(); worldView(); map.clearMarkers(); map.draw();
    paintPinout();
    revealClue(true);          // the first clue of every round is free
    paintHud();
    A.setSub((practice ? "PRACTICE" : "DAY " + day) + " · ROUND " + (r + 1) + " OF " + ROUNDS);
  }

  function paintHud() {
    var pips = "";
    for (var i = 0; i < ROUNDS; i++) {
      pips += "<i class='" + (scores[i] !== null ? "done" : i === r ? "now" : "") + "'></i>";
    }
    hud.innerHTML =
      '<div class="strip" style="display:flex;align-items:center;justify-content:space-between;' +
      'gap:var(--sp-3);font-size:var(--t-xs);letter-spacing:.16em;text-transform:uppercase;' +
      'color:var(--ink-4);font-variant-numeric:tabular-nums">' +
      "<span>Round <b style='color:var(--ink)'>" + Math.min(r + 1, ROUNDS) + "</b>/" + ROUNDS + "</span>" +
      "<span class='pips'>" + pips + "</span>" +
      "<span>Banked <b style='color:var(--ink)'>" + total().toLocaleString() + "</b></span></div>";
  }

  function clueList() { return (cur().clues || []).slice(0, 4); }

  function revealClue(silent) {
    if (over) return;
    var list = clueList();
    if (shown >= list.length) { paintClues(); return; }
    if (!silent && !resolved) {
      // beyond the first, a clue costs points — unless the photo is missing
      if (shown >= 1 && !offline) hintsUsed[r]++;
      A.sfx("reveal");
    }
    shown++;
    paintClues();
  }

  function paintClues() {
    var list = clueList();
    var h = "";
    for (var i = 0; i < shown && i < list.length; i++) {
      h += "<li class='" + (i === 0 || offline ? "free" : "") + "'>" + A.esc(list[i]) +
        (i === 0 ? " <span class='dim'>· free</span>"
          : offline ? " <span class='dim'>· free while the photos are down</span>"
            : " <span class='dim'>· −" + HINT_COST + "</span>") + "</li>";
    }
    cluesEl.innerHTML = h;
    var more = list.length - shown;
    if (resolved || over || more <= 0) {
      hintBtn.style.display = "none";
    } else {
      hintBtn.style.display = "block";
      hintBtn.textContent = offline ? "Reveal a clue (free)"
        : "Reveal a clue (−" + HINT_COST + ")";
    }
  }

  function submit() {
    if (resolved || over || !pin) return;
    var p = cur();
    var km = A.haversine(pin[0], pin[1], p.lat, p.lon);
    var paid = hintsUsed[r];
    var got = roundPoints(km, paid);
    scores[r] = got;
    dists[r] = km;
    guessed[r] = [pin[0], pin[1]];
    var iso = null;
    try { iso = map.at(pin[0], pin[1]); } catch (e) { iso = null; }
    gotCountry[r] = iso === p.iso2;
    resolved = true;

    // both pins, joined, and zoomed to fit unless they're a continent apart
    map.clearMarkers();
    fitBoth(pin, [p.lat, p.lon]);
    map.marker(pin[0], pin[1], { colour: "#56c8f5", pin: true, r: 5 });
    map.marker(p.lat, p.lon, { colour: "#ff5c9d", pin: true, r: 5 });
    map.line(pin, [p.lat, p.lon], { colour: "#f5f2f8aa", dash: [7, 5], width: 1.4 });
    map.draw();

    A.sfx(got >= 4400 ? "stamp" : got >= 2000 ? "ok" : "miss");
    if (got >= 4600) A.confetti(50, { hearts: 0 });
    paintVerdict(km, got, paid);
    paintClues();
    paintHud();
    goBtn.textContent = r >= ROUNDS - 1 ? "Final score" : "Next round";
    goBtn.disabled = false;
    pinoutEl.innerHTML = "Yours in <b style='color:var(--cyan)'>blue</b>, the real place in " +
      "<b style='color:var(--pink)'>pink</b>";
    save();
  }

  function paintVerdict(km, got, paid) {
    var p = cur();
    var h = '<div class="ac-card">';
    h += '<div class="vd-top"><span class="vd-km">' + A.geo.km(km) + " out</span>" +
      '<span class="vd-pt">' + got.toLocaleString() + "<small>/5000</small></span></div>";
    h += '<div class="vd-place">' + A.esc(p.place) + "</div>";
    var bits = [];
    bits.push(gotCountry[r] ? "Right country." : "Wrong country.");
    bits.push(km <= FREE_RADIUS ? "Inside 25 km — a perfect round."
      : distPoints(km).toLocaleString() + " for the distance");
    if (paid) bits.push("−" + (paid * HINT_COST) + " for " + paid + " clue" + (paid === 1 ? "" : "s"));
    h += '<div class="vd-note">' + bits.join(" · ") + "</div>";
    var all = clueList();
    if (all.length) {
      h += '<div class="vd-note">What was in the frame: ' +
        all.map(function (c) { return A.esc(c); }).join(", ") + ".</div>";
    }
    h += '<div class="vd-note ac-credit">' + A.esc(p.credit) + " · " + A.esc(p.licence) +
      ' · <a href="' + A.esc(p.page) + '" target="_blank" rel="noopener">the file on Commons</a></div>';
    h += "</div>";
    verdictEl.innerHTML = h;
  }

  function next() {
    if (r >= ROUNDS - 1) return end();
    r++;
    save();
    showRound();
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { window.scrollTo(0, 0); }
  }

  /* ── persistence ───────────────────────────────────────────────────────── */

  function save() {
    if (practice) return;
    A.save(ID, day, {
      r: r, scores: scores, dists: dists, guessed: guessed,
      hintsUsed: hintsUsed, gotCountry: gotCountry, ids: rounds.map(function (p) { return p.id; }),
    });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (!st) return;
    if (String(st.ids || "") !== String(rounds.map(function (p) { return p.id; }))) return;
    scores = st.scores || scores;
    dists = st.dists || dists;
    guessed = st.guessed || guessed;
    hintsUsed = st.hintsUsed || hintsUsed;
    gotCountry = st.gotCountry || gotCountry;
    r = A.clamp(st.r || 0, 0, ROUNDS - 1);
    if (st.done) { over = true; }
  }

  /* ── ending ────────────────────────────────────────────────────────────── */

  function bandRow(pts) {
    var cb = A.settings().colourblind;
    var g = cb ? "🟦" : "🟩", y = cb ? "🟧" : "🟨", b = "⬛";
    if (pts >= 4600) return g + g + g;
    if (pts >= 4000) return g + g + y;
    if (pts >= 3200) return g + y + b;
    if (pts >= 2000) return y + y + b;
    if (pts >= 900) return y + b + b;
    return b + b + b;
  }

  function shareGrid() {
    var out = [];
    for (var i = 0; i < ROUNDS; i++) {
      var s = scores[i];
      out.push("🛣️" + (s === null ? "⬛⬛⬛" : bandRow(s)) +
        (s === null ? "" : " " + A.geo.km(dists[i])));
    }
    return out;
  }

  function shareText() {
    return "PLACEGUESSR " + (practice ? "(practice)" : "#" + day) + " " +
      total().toLocaleString() + "/" + MAXTOT.toLocaleString() + "\n" +
      shareGrid().join("\n") + "\n" + A.SITE;
  }

  function end() {
    if (over) return;
    over = true;
    var tot = total(), norm = normFor(tot);
    var right = 0;
    for (var i = 0; i < ROUNDS; i++) if (gotCountry[i]) right++;
    var stamps = [];
    for (var j = 0; j < ROUNDS; j++) {
      if (gotCountry[j] || (dists[j] !== null && dists[j] <= 250)) stamps.push(rounds[j].iso2);
    }
    var detail = tot.toLocaleString() + " pts · " + right + "/5 countries";

    if (!practice) {
      A.finish(ID, day, {
        score: tot, norm: norm, won: tot >= SOLID, detail: detail,
        bucket: Math.min(5, Math.floor(tot / 5000)),
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
    hintBtn.style.display = "none";
    paintHud();
    review();
    sheet();
  }

  function review() {
    var h = '<div class="rv-h">The five places</div><ul class="rvlist">';
    for (var i = 0; i < ROUNDS; i++) {
      var p = rounds[i], s = scores[i];
      h += "<li><div class='top'><span class='n'>" + (i + 1) + "</span>" +
        "<span class='pl'>" + A.esc(p.place) + "</span>" +
        "<span class='pt'>" + (s === null ? "—" : s.toLocaleString()) + "</span></div>";
      h += "<div class='sub'>" + (dists[i] === null ? "not played"
        : A.geo.km(dists[i]) + " out · " + (gotCountry[i] ? "right country" : "wrong country") +
        (hintsUsed[i] ? " · " + hintsUsed[i] + " paid clue" + (hintsUsed[i] === 1 ? "" : "s") : "")) +
        "</div>";
      if ((p.clues || []).length) {
        h += "<div class='sub'>" + p.clues.map(function (c) { return A.esc(c); }).join(", ") + "</div>";
      }
      h += "<div class='ac-credit'>" + A.esc(p.credit) + " · " + A.esc(p.licence) +
        ' · <a href="' + A.esc(p.page) + '" target="_blank" rel="noopener">Commons</a></div></li>';
    }
    h += "</ul>";
    reviewEl.innerHTML = h;
  }

  function sheet() {
    var tot = total(), norm = normFor(tot);
    var right = 0, best = -1, bestI = 0;
    for (var i = 0; i < ROUNDS; i++) {
      if (gotCountry[i]) right++;
      if ((scores[i] || 0) > best) { best = scores[i] || 0; bestI = i; }
    }
    var extra = "<p class='center tiny muted' style='margin-top:6px'>" +
      "<b>" + tot.toLocaleString() + "</b> of " + MAXTOT.toLocaleString() +
      " · <b>" + right + "</b> of 5 countries · best round <b>" +
      A.esc(rounds[bestI].place) + "</b> at " +
      (dists[bestI] === null ? "—" : A.geo.km(dists[bestI])) + "</p>" +
      "<p class='center tiny dim'>A solid five rounds is " + SOLID.toLocaleString() +
      " (about 660 km out each time); an excellent one is " + GREAT.toLocaleString() +
      " (about 240 km).</p>";

    var m = A.results(ID, practice ? A.PRACTICE : day, {
      title: norm >= 92 ? "SURVEYOR" : tot >= SOLID ? "WELL READ" : right >= 3 ? "RIGHT IDEA" : "NEXT TIME",
      extraHTML: extra,
      state: { norm: norm, shareGrid: shareGrid(), won: tot >= SOLID },
      shareText: shareText(),
      onReplay: function () { location.reload(); },
    });
    var sb = m.body.querySelector("#ac-share");
    if (sb) sb.onclick = function () { A.share(practice ? shareText() : A.shareCard(ID, day)); };
    return m;
  }

  /* ── debug hook — drives the REAL buttons ──────────────────────────────── */
  window.__PG = {
    state: function () {
      return {
        day: day, practice: practice, r: r, resolved: resolved, over: over,
        offline: offline, pin: pin && pin.slice(), shown: shown,
        scores: scores.slice(), dists: dists.slice(), hintsUsed: hintsUsed.slice(),
        gotCountry: gotCountry.slice(), total: total(), norm: normFor(total()),
        rounds: rounds.map(function (p) { return { id: p.id, place: p.place, iso2: p.iso2, lat: p.lat, lon: p.lon, clues: p.clues }; }),
      };
    },
    answer: function () { var p = cur(); return { place: p.place, lat: p.lat, lon: p.lon, iso2: p.iso2 }; },
    // Place a pin by dispatching REAL pointer events on the canvas at that
    // lat/lon, so the map's own hit-testing and tap-vs-drag logic is what runs.
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
    hint: function () { document.getElementById("hintbar").click(); },
    // play the whole game: `off` km of deliberate error on every round
    autoplay: function (off) {
      var guard = 0;
      while (!over && guard++ < 40) {
        var a = this.answer();
        var d = (off === undefined ? 300 : off) / 111.32;
        this.drop(a.lat + d, a.lon);
        this.go();       // submit
        this.go();       // next round / final score
      }
      return this.state();
    },
    points: distPoints,
  };
})();
