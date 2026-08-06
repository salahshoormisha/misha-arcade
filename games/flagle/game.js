/* ============================================================================
   FLAGLE — a flag behind six shut tiles.

   Mechanics come from _build/RESEARCH.md § "Flagle (flagle.io)" (confidence:
   high, read off the live bundle). Faithful to the original:

     · 3 wide × 2 tall grid of six tiles. ALL SIX START SHUT — the original's
       status line before the first guess is literally "Make a guess to reveal
       the first tile" (RESEARCH §RULES). There is no free tile. Handing one
       out is what flagle.fun does, and RESEARCH calls that out as the thing
       that "makes the endgame much softer than the original".
     · Six guesses. Every guess flips exactly ONE tile, the winning one
       included ("Verified in localStorage: the winning PANAMA entry carries
       tile:3"), so tiles and guesses are consumed 1:1 and you never see the
       whole flag until it is over.
     · Feedback per guess: great-circle distance centroid→centroid, plus one
       direction arrow.
     · Share = the 3×2 tile map in 🟩/🟥, red for a tile you burned on a wrong
       guess, green for one you never needed; a loss is all six red
       (RESEARCH §SHARE, exact construction).
     · Winning unlocks a chain of short bonus rounds about the same country,
       which add emoji to the share and nothing to the score.

   Four deliberate departures, each one straight out of RESEARCH's own
   WEAKNESSES / IMPROVEMENT IDEAS for the original:

     1. THE REVEAL ORDER IS INFORMATION-RANKED, not a blind shuffle.
        RESEARCH: "Random tile order makes daily difficulty wildly uneven. On a
        flag like Panama, drawing the tile containing the star effectively ends
        the puzzle; drawing three tiles of flat colour tells you nothing."
        Its fix: "reveal least-informative first so the difficulty curve is
        monotonic." See tileWeights() — flat corners open first, the charge is
        saved for last.
     2. THE PROXIMITY PERCENTAGE IS GONE. RESEARCH: percent is
        floor((20000−km)/20000×100), "a pure linear restatement of the km
        figure, so one third of the feedback UI is decorative." In its place:
        how close your guess's FLAG is to the answer's, read off the colour and
        feature index in core/data/flags.js. Informative, never decisive — it
        tells you two of three colours match, not which two.
     3. HARD MODE IS THE ONLY MODE. The suggestions list never renders flag
        thumbnails (A.picker's `flags:false`). With them you can scroll the
        dropdown and eye-match the tiles on screen, which is not this game.
     4. THE BONUS ROUNDS SURVIVE A LOSS. RESEARCH: "The five bonus rounds — the
        best content in the game — are locked behind winning the main round.
        Lose the flag and you see none of them." Here you always get them, and
        there is a control to skip them.

   NORM (CONTRACT §3). By guesses used: 1→100, 2→97, 3→88, 4→72, 5→58, 6→46,
   loss→8. Guess 1 is made with every tile shut, so a 1-guess win is luck and
   is the only route to 100 besides an inspired 2. With the ranked reveal the
   modal win lands on 4 → 72, which is the "solid day" the contract asks for;
   3 → 88 is the excellent day. Bonus rounds deliberately do NOT move norm —
   the 0-100 has to stay comparable across every cabinet, and a lucky bonus
   streak shouldn't outweigh a sharp flag read.
   ========================================================================== */
(function () {
  "use strict";

  var ID = "flagle", TRIES = 6, COLS = 3, ROWS = 2, TILES = COLS * ROWS;
  var NORM = [0, 100, 97, 88, 72, 58, 46], LOSS_NORM = 8;

  /* ── two pools, not one ─────────────────────────────────────────────────
     GUESS is everything you may type: any place with a flag and a location,
     territories included — the original guesses against the whole ISO 3166-1
     list, and using one pool for both jobs is why typing Taiwan, Kosovo,
     Greenland or Hong Kong used to return nothing at all.
     POOL is the narrower set allowed to BE the answer: inhabited places only,
     so a day is never Bouvet Island or the French Southern Territories. */
  var ALL = window.AD_COUNTRIES || [];
  var FLAGS = window.AD_FLAGS || {};
  var byIso = {};
  ALL.forEach(function (c) { byIso[c.i] = c; });
  var hasFlag = function (c) { return FLAGS[c.i] && (c.capll || c.ll); };
  var GUESS = ALL.filter(hasFlag).map(function (c) { return c.i; });
  var POOL = ALL.filter(function (c) {
    return hasFlag(c) && (c.un === 1 || (c.pop || 0) >= 10000);
  }).map(function (c) { return c.i; });

  function at(c) { return c.capll || c.ll; }          // [lat, lon]

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var answer, guesses = [], over = false, banked = false, t0 = Date.now();
  var cvs, img = null, picker, order, ended = false;

  function pickAnswer() {
    if (practice) return A.pick(A.rng(String(Date.now()) + Math.random()), POOL);
    return POOL[A.dailyIndex(ID, day, POOL.length)];
  }

  /* ── which tile gives the flag away ──────────────────────────────────────
     Tiles are numbered 0 1 2 across the top, 3 4 5 across the bottom.

     A flag's telling detail is almost never spread evenly: it is a charge in
     the middle, or a canton in the top-left, or a triangle at the hoist. The
     feature index in core/data/flags.js already records which of those a flag
     has, so weight each tile by how likely that detail sits in it and reveal
     ASCENDING — the flat corners first, the charge last.

     Two properties matter and both hold. It is DETERMINISTIC: every device
     computes the same order from the same shipped data, so both players burn
     the same tiles and their share grids line up. And it DEGRADES to the
     original: a plain tricolour has no localised feature at all, every weight
     is 0, and the order collapses to the day's blind seeded shuffle, which is
     exactly what flagle.io does.

     The weights are a judgement, not a measurement — we ship no rasteriser, so
     nothing here counts pixels. They encode one claim: charges sit in the
     middle column, cantons and hoist devices sit on the left. */
  var CHARGE = {
    canton:         [9, 1, 0, 0, 0, 0],
    "coat-of-arms": [1, 9, 1, 1, 9, 1],
    emblem:         [1, 9, 1, 1, 9, 1],
    animal:         [1, 8, 1, 1, 8, 1],
    plant:          [1, 8, 1, 1, 8, 1],
    sun:            [2, 8, 2, 2, 8, 2],
    crescent:       [3, 8, 2, 3, 8, 2],
    star:           [3, 8, 2, 3, 8, 2],
    text:           [2, 7, 2, 2, 7, 2],
    cross:          [2, 7, 2, 2, 7, 2],
    stars:          [4, 6, 4, 4, 6, 4],
    saltire:        [4, 6, 4, 4, 6, 4],
    triangle:       [7, 3, 0, 7, 3, 0],
    chevron:        [7, 3, 0, 7, 3, 0],
    diagonal:       [5, 4, 5, 5, 4, 5],
    "unique-shape": [3, 3, 3, 3, 3, 3],
  };

  function tileWeights(iso) {
    var f = (A.flagMeta(iso) || {}).features || [];
    var w = [0, 0, 0, 0, 0, 0];
    f.forEach(function (name) {
      var v = CHARGE[name];
      if (!v) return;
      for (var k = 0; k < TILES; k++) w[k] += v[k];
    });
    return w;
  }

  function revealOrder(iso, seed) {
    var blind = A.shuffle(A.rng(seed), [0, 1, 2, 3, 4, 5]);
    var w = tileWeights(iso);
    return blind.slice().sort(function (a, b) {
      return (w[a] - w[b]) || (blind.indexOf(a) - blind.indexOf(b));
    });
  }

  /* ── how alike are two flags ─────────────────────────────────────────────
     This is what replaced the useless proximity %. It reports how much of the
     ANSWER's palette your guess shares, and names at most one shared design
     trait — and only a trait common enough to leave real work to do. A tag
     carried by fewer than RARE flags (say "unique-shape", which is Nepal and
     nobody else) would hand the game over, so those report as an unnamed
     "something in common". */
  var RARE = 8;
  var featCount = (function () {
    var n = {};
    Object.keys(FLAGS).forEach(function (i) {
      ((FLAGS[i] || {}).features || []).forEach(function (f) { n[f] = (n[f] || 0) + 1; });
    });
    return n;
  })();

  function affinity(guessIso, answerIso) {
    var g = A.flagMeta(guessIso) || {}, a = A.flagMeta(answerIso) || {};
    var gc = g.colours || [], ac = (a.colours || []).slice(0, 5);
    var shared = ac.filter(function (c) { return gc.indexOf(c) >= 0; }).length;
    var gf = g.features || [], af = a.features || [];
    var both = af.filter(function (f) { return gf.indexOf(f) >= 0; });
    // Name the least common shared trait — it is the one that narrows most —
    // but only from the traits that are common enough not to be an answer key.
    var named = null, hidden = both.length > 0;
    both.filter(function (f) { return (featCount[f] || 0) >= RARE; })
      .sort(function (x, y) { return (featCount[x] || 0) - (featCount[y] || 0); })
      .slice(0, 1).forEach(function (f) { named = f; });
    return { shared: shared, of: ac.length, named: named, any: hidden };
  }

  function affinityText(af) {
    var bits = [];
    if (af.of) {
      bits.push(af.shared === 0 ? "no colour in common"
        : af.shared === af.of ? "all " + af.of + " colours in common"
          : af.shared + " of " + af.of + " colours");
    }
    if (af.named) bits.push("also has " + A.flagFeatureLabel(af.named));
    else if (af.any) bits.push("something in common besides colour");
    return bits.join(" · ");
  }

  /* ── boot ────────────────────────────────────────────────────────────── */
  var main = A.mount({
    id: ID, dayN: day,
    help: "<p>A flag behind six tiles, <b>all six shut</b>. Every guess opens one " +
      "&mdash; and tells you <b>how far</b> you are, <b>which way</b> to go, and how much " +
      "your flag has in common with the one you can't see.</p>" +
      "<ul><li>Six guesses, six tiles, one for one, the winning guess included. You never " +
      "see the whole flag until it's over.</li>" +
      "<li>The tiles don't open at random: the <b>flattest corners go first</b> and whatever " +
      "the flag actually has ON it &mdash; a canton, a crescent, a coat of arms &mdash; is " +
      "saved for last. Same order on both your screens.</li>" +
      "<li><b>Hard mode always.</b> The suggestions list shows no flag thumbnails, so you " +
      "can't scroll the dropdown and eye-match your way to the answer.</li>" +
      "<li>Under each guess: how many of the answer's colours your flag shares, and one " +
      "trait you have in common. Enough to narrow it, never enough to name it.</li>" +
      "<li>Win or lose, you get <b>bonus rounds</b> on the country &mdash; shape, capital, " +
      "neighbours, tongue, coin. They don't move your score.</li>" +
      "<li>Every country you get right is <b>stamped in your passport</b>.</li>" +
      "<li>Guess any country <i>or territory</i> &mdash; Taiwan, Kosovo, Greenland and Hong " +
      "Kong all count, and <i>USA</i>, <i>Holland</i>, <i>Persia</i> and <i>Burma</i> all " +
      "work.</li></ul>",
  });

  if (!POOL.length) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">Flag data hasn\'t loaded. ' +
      "Check core/data/flags.js and countries.js.</p>";
    return;
  }

  answer = pickAnswer();
  order = revealOrder(answer, ID + ":order:" + (practice ? answer + ":" + t0 : day));

  var wrap = A.el("div"); wrap.id = "flagwrap";
  cvs = A.el("canvas"); cvs.id = "flag";
  cvs.setAttribute("role", "img");
  cvs.setAttribute("aria-label", "A partially revealed national flag");
  wrap.appendChild(cvs);
  main.appendChild(wrap);

  var statusEl = A.el("div", "fl-status");
  main.appendChild(statusEl);

  var tries = A.el("div", "tries");
  main.appendChild(tries);

  var pickHost = A.el("div"); pickHost.style.marginTop = "14px";
  main.appendChild(pickHost);
  // flags:false is the original's hard mode, and the only honest setting for a
  // game about recognising flags.
  picker = A.picker(pickHost, {
    pool: GUESS, flags: false, onPick: guess, placeholder: "which country or territory?",
  });

  var row = A.el("div", "ac-row"); row.style.marginTop = "10px";
  row.innerHTML = practice
    ? '<a class="ac-pill" href="./">TODAY\'S FLAG</a>'
    : '<a class="ac-pill" href="?practice=1">PRACTICE, UNLIMITED</a>';
  main.appendChild(row);

  var list = A.el("div", "guesses"); main.appendChild(list);

  A.flagImg(answer).then(function (im) { img = im; draw(); })
    .catch(function () { A.toast("Couldn't load that flag", true); chrome(); });

  restore();

  /* ── play ────────────────────────────────────────────────────────────── */

  function guess(iso) {
    if (over || ended) return;                       // no double-submit
    if (guesses.indexOf(iso) >= 0) return A.toast("Already guessed that one", true);
    if (!byIso[iso]) return A.toast("No country like that", true);
    guesses.push(iso);
    var won = iso === answer;
    draw();
    renderGuesses();
    save();
    if (won) { A.sfx("win"); end(true); }
    else if (guesses.length >= TRIES) { A.sfx("lose"); end(false); }
    else { A.sfx("miss"); }
  }

  /* ── drawing ─────────────────────────────────────────────────────────── */

  // Canvas fillStyle can't read a CSS custom property, so resolve the tokens
  // once — lazily, because a `var` initialiser read at boot from a function
  // defined above it is `undefined`, and that has cost this build two cabinets.
  var TOK = null;
  function tok(name, fallback) {
    if (!TOK) TOK = getComputedStyle(document.documentElement);
    var v = (TOK.getPropertyValue(name) || "").trim();
    return v || fallback;
  }

  function draw() { paint(); chrome(); }

  function paint() {
    if (!img) return;
    var meta = A.flagMeta(answer) || {};
    var ar = meta.ar || 1.6;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = cvs.clientWidth || 360, h = Math.round(w / ar);
    cvs.width = w * dpr; cvs.height = h * dpr;
    cvs.style.height = h + "px";
    var g = cvs.getContext("2d");
    if (!g) return;
    g.save(); g.scale(dpr, dpr);
    g.clearRect(0, 0, w, h);
    A.flagDraw(g, img, 0, 0, w, h, "cover");

    // Cover every tile that hasn't been earned. Before the first guess that is
    // all six; only when the game is over do you see the flag whole.
    var shown = over ? TILES : Math.min(TILES, guesses.length);
    var tw = w / COLS, th = h / ROWS;
    var lid = tok("--s2", "#1b1829"), hair = tok("--hair", "rgba(255,255,255,.075)");
    for (var k = 0; k < TILES; k++) {
      if (order.indexOf(k) < shown) continue;
      var cx = (k % COLS) * tw, cy = Math.floor(k / COLS) * th;
      g.fillStyle = lid;
      g.fillRect(cx, cy, tw, th);
    }
    // While it's in play the seams show, so the 3×2 structure is legible; when
    // it ends they vanish and the six pieces fuse into one flag. RESEARCH calls
    // that gap collapse "a small touch that is worth copying".
    if (!over) {
      g.strokeStyle = hair; g.lineWidth = 1;
      for (var c = 1; c < COLS; c++) { g.beginPath(); g.moveTo(c * tw, 0); g.lineTo(c * tw, h); g.stroke(); }
      for (var r = 1; r < ROWS; r++) { g.beginPath(); g.moveTo(0, r * th); g.lineTo(w, r * th); g.stroke(); }
    }
    g.restore();
  }

  // Split out of paint() on purpose: if the flag SVG fails to load the pips and
  // the status line must still work, or the cabinet looks dead.
  function chrome() {
    tries.innerHTML = "";
    for (var t = 0; t < TRIES; t++) {
      var i = A.el("i");
      if (t < guesses.length) i.className = guesses[t] === answer ? "won" : "used";
      tries.appendChild(i);
    }
    var left = TRIES - guesses.length;
    statusEl.textContent = over ? ""
      : guesses.length === 0 ? "Make a guess to reveal the first tile"
        : left + (left === 1 ? " guess left" : " guesses left");
  }

  function renderGuesses() {
    list.innerHTML = "";
    guesses.forEach(function (iso) {
      var c = byIso[iso], won = iso === answer;
      var el = A.el("div", "gr" + (won ? " win" : ""));
      if (won) {
        el.innerHTML = '<div class="g1"><span class="nm">' + A.esc(c.n) +
          '</span><span class="ar">🎉</span></div>' +
          '<div class="g2">that\'s the one</div>';
      } else {
        var A0 = at(c), A1 = at(byIso[answer]);
        var d = A.haversine(A0[0], A0[1], A1[0], A1[1]);
        var b = A.bearing(A0[0], A0[1], A1[0], A1[1]);
        // No flag thumbnail here either. The original's guess row is name +
        // distance + arrow (RESEARCH §UI), and a thumbnail next to every guess
        // is one more way to sit and eye-match against the open tiles.
        el.innerHTML = '<div class="g1"><span class="nm">' + A.esc(c.n) +
          '</span><span class="km">' + A.geo.km(d) + '</span><span class="ar">' + A.arrow(b) +
          "</span></div>" +
          '<div class="g2">' + A.esc(affinityText(affinity(iso, answer))) + "</div>";
      }
      list.appendChild(el);
    });
  }

  /* ── persistence ─────────────────────────────────────────────────────── */

  function save() {
    if (practice) return;
    A.save(ID, day, { guesses: guesses });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st) guesses = st.guesses || [];
    renderGuesses();
    draw();
    if (st && st.done) {
      over = true; ended = true; banked = true;
      picker.disable(true);
      draw();
      // Pass the stored grid, score AND bonus tally through, so a reload shows
      // exactly the sheet it showed the first time rather than an empty share
      // block and a missing tally.
      setTimeout(function () { sheet(st.won, st.shareGrid, st.norm, st.bonus || null); }, 240);
    }
  }

  /* ── bonus rounds ────────────────────────────────────────────────────────
     Short rounds about the same country, the way the original does — except
     you get them whether you won or lost, and you can skip them. They add a
     line to the share and a tally to the sheet and never move `norm`.

     The original's coat-of-arms and capital-flag rounds are replaced by
     CAPITAL and TONGUE: we ship no emblem or city-flag artwork, and faking it
     would be worse than using the real data we already hold for every country.
     Every round below is built from countries.js / flags.js / world.js —
     nothing here is invented. */

  var bonusHost = null;

  // Asks the real render path, so "can we draw this?" can never disagree with
  // what the round actually shows. The area floor is a separate judgement: a
  // 430 km² island renders as a dot, and picking between four dots is not a
  // question about shape. Those countries just skip this round.
  var SHAPE_MIN_AREA = 10000;   // km²
  function hasShape(iso) {
    var c = byIso[iso];
    if (!c || (c.area || 0) < SHAPE_MIN_AREA) return false;
    if (!A.silhouette) return false;
    if (!hasShape._c) { hasShape._c = A.el("canvas"); hasShape._c.width = hasShape._c.height = 8; }
    try { return A.silhouette(hasShape._c, iso, { pad: 0 }) !== false; }
    catch (e) { return false; }
  }

  // Decoys from as close to home as possible — same subregion, then continent,
  // then anywhere. A Baltic answer offered three Pacific decoys would give
  // itself away on geography alone.
  function peers(rand, n, ok) {
    var c = byIso[answer], out = [];
    [function (i) { return byIso[i].sub === c.sub; },
     function (i) { return byIso[i].reg === c.reg; },
     function () { return true; }].forEach(function (scope) {
      if (out.length >= n) return;
      var cand = POOL.filter(function (i) {
        return i !== answer && out.indexOf(i) < 0 && byIso[i] && scope(i) && (!ok || ok(i));
      });
      out = out.concat(A.shuffle(rand, cand).slice(0, n - out.length));
    });
    return out;
  }

  var POP_BANDS = [
    [50e3, "under 50 thousand"], [500e3, "50 thousand to half a million"],
    [1e6, "half a million to a million"], [3e6, "1 to 3 million"],
    [8e6, "3 to 8 million"], [25e6, "8 to 25 million"],
    [60e6, "25 to 60 million"], [150e6, "60 to 150 million"],
    [Infinity, "over 150 million"],
  ];
  function popBand(p) {
    for (var k = 0; k < POP_BANDS.length; k++) if (p < POP_BANDS[k][0]) return k;
    return POP_BANDS.length - 1;
  }

  function buildRounds() {
    var rand = A.rng(ID + ":bonus:" + answer + ":" + (practice ? "x" : day));
    var c = byIso[answer], out = [];

    // 1 · SHAPE — four outlines, one of them the country you just named.
    if (hasShape(answer)) {
      var sp = peers(rand, 3, hasShape);
      if (sp.length === 3) out.push({
        id: "shape", label: "SHAPE", icon: "🗺️", tries: 2, kind: "shape",
        ask: "Which outline is " + c.n + "?",
        opts: A.shuffle(rand, sp.concat([answer])).map(function (i) {
          return { iso: i, right: i === answer };
        }),
      });
    }

    // 2 · CAPITAL — four cities from the same part of the world.
    if (c.cap) {
      var cp = peers(rand, 3, function (i) { return byIso[i].cap && byIso[i].cap !== c.cap; });
      if (cp.length === 3) out.push({
        id: "capital", label: "CAPITAL", icon: "🏛️", tries: 2, kind: "text",
        ask: "What is the capital of " + c.n + "?",
        opts: A.shuffle(rand, cp.map(function (i) { return { text: byIso[i].cap }; })
          .concat([{ text: c.cap, right: true }])),
      });
    }

    // 3 · NEIGHBOURS — flags, one of which really does share a land border.
    //     Islands have no land border, so they simply skip this round.
    var bord = (c.bord || []).filter(function (i) { return byIso[i] && FLAGS[i]; });
    if (bord.length) {
      var wrong = peers(rand, 7, function (i) { return bord.indexOf(i) < 0 && FLAGS[i]; });
      if (wrong.length >= 5) out.push({
        id: "border", label: "NEIGHBOURS", icon: "🧭", tries: 3, kind: "flag",
        ask: "Which of these shares a land border with " + c.n + "?",
        opts: A.shuffle(rand, wrong.map(function (i) { return { iso: i }; })
          .concat([{ iso: A.pick(rand, bord), right: true }])),
        note: c.n + " borders " + bord.map(function (i) { return byIso[i].n; }).join(", ") + ".",
      });
    }

    // 4 · TONGUE and 5 · COIN — one shot each, like the original's pair.
    [["tongue", "TONGUE", "🗣️", "lang", "Which language is spoken in "],
     ["coin", "COIN", "🪙", "cur", "What do they spend in "]].forEach(function (spec) {
      var mine = (c[spec[3]] || [])[0];
      if (!mine) return;
      var seen = {}, dec = [];
      peers(rand, 40).forEach(function (i) {
        var v = (byIso[i][spec[3]] || [])[0];
        if (!v || v === mine || seen[v] || dec.length >= 3) return;
        seen[v] = 1; dec.push({ text: v });
      });
      if (dec.length < 3) return;
      out.push({
        id: spec[0], label: spec[1], icon: spec[2], tries: 1, kind: "text",
        ask: spec[4] + c.n + "?",
        opts: A.shuffle(rand, dec.concat([{ text: mine, right: true }])),
      });
    });

    // 6 · HOW MANY — a population band, one shot. Decoys are neighbouring
    //     bands, so it's a real judgement rather than a coin flip. This is the
    //     backstop: it builds for every country with a population, which keeps
    //     an island with no border and no shape from getting a thin chain.
    if (c.pop) {
      var bi = popBand(c.pop), near = [];
      POP_BANDS.forEach(function (b, k) {
        if (k !== bi && Math.abs(k - bi) <= 3) near.push({ text: b[1] });
      });
      if (near.length >= 3) out.push({
        id: "people", label: "HOW MANY", icon: "👫", tries: 1, kind: "text",
        ask: "How many people live in " + c.n + "?",
        opts: A.shuffle(rand, A.shuffle(rand, near).slice(0, 3)
          .concat([{ text: POP_BANDS[bi][1], right: true }])),
        note: "About " + A.fmtNum(c.pop) + " people.",
      });
    }

    return out.slice(0, 5);        // five rounds, as the original has
  }

  function runBonus(after) {
    var rounds = buildRounds();
    if (!rounds.length) return after([]);
    var results = [], n = 0, stopped = false;
    bonusHost = A.el("div", "bonus");
    main.insertBefore(bonusHost, list);
    step();

    function finish() {
      if (stopped) return;
      stopped = true;
      if (bonusHost && bonusHost.parentNode) bonusHost.parentNode.removeChild(bonusHost);
      after(results);
    }

    function step() {
      if (stopped) return;
      if (n >= rounds.length) return finish();
      var r = rounds[n], used = 0, closed = false;
      bonusHost.innerHTML =
        '<div class="bn-head"><span class="bn-ix">BONUS ' + (n + 1) + " / " + rounds.length +
        '</span><span class="bn-nm">' + r.label + "</span></div>" +
        '<p class="bn-ask">' + A.esc(r.ask) + "</p>" +
        '<div class="bn-opts bn-' + r.kind + '"></div>' +
        '<p class="bn-foot"></p>' +
        '<button class="bn-skip" type="button">SKIP TO THE RESULT</button>';
      var optHost = bonusHost.querySelector(".bn-opts");
      var foot = bonusHost.querySelector(".bn-foot");
      foot.textContent = r.tries > 1 ? r.tries + " tries" : "one shot";
      bonusHost.querySelector(".bn-skip").onclick = finish;

      r.opts.forEach(function (o) {
        var b = A.el("button", "bn-opt");
        b.type = "button";
        if (r.kind === "shape") {
          var cv = A.el("canvas"); cv.className = "bn-shape";
          b.appendChild(cv);
          // The canvas has to be laid out before silhouette() measures it, so
          // draw on a timeout — NOT requestAnimationFrame, which is paused in a
          // background tab and would leave every outline blank.
          setTimeout(function () { A.silhouette(cv, o.iso, { fill: tok("--ink", "#f5f2f8"), pad: 8 }); }, 0);
        } else if (r.kind === "flag") {
          var im = A.el("img");
          im.alt = ""; im.src = A.rootPath() + "core/data/flags/" + o.iso + ".svg";
          im.onerror = function () { this.style.visibility = "hidden"; };
          b.appendChild(im);
        } else {
          b.textContent = o.text;
        }
        b.onclick = function () { hit(o, b); };
        optHost.appendChild(b);
      });

      function hit(o, b) {
        if (closed) return;
        used++;
        if (o.right) {
          b.classList.add("right"); closed = true; A.sfx("ok");
          results.push({ id: r.id, label: r.label, icon: r.icon, ok: true, used: used });
          close();
        } else {
          b.classList.add("wrong"); b.disabled = true; A.sfx("bad");
          if (used >= r.tries) {
            closed = true;
            results.push({ id: r.id, label: r.label, icon: r.icon, ok: false, used: used });
            close();
          } else {
            var left = r.tries - used;
            foot.textContent = left + (left === 1 ? " try left" : " tries left");
          }
        }
      }

      function close() {
        // Always show what the answer was — a bonus round you got wrong should
        // still teach you the thing.
        Array.prototype.forEach.call(optHost.children, function (el, k) {
          el.disabled = true;
          if (r.opts[k].right) el.classList.add("right");
        });
        foot.innerHTML = r.note ? '<span class="bn-note">' + A.esc(r.note) + "</span>" : "";
        var nx = A.el("button", "ac-pill bn-next",
          n + 1 >= rounds.length ? "SEE THE RESULT" : "NEXT BONUS ROUND");
        nx.type = "button";
        nx.onclick = function () { n++; step(); };
        bonusHost.appendChild(nx);
        try { nx.focus({ preventScroll: true }); } catch (e) {}
      }
    }
  }

  /* ── ending ──────────────────────────────────────────────────────────── */

  /* The share grid, exactly as RESEARCH §SHARE specifies it: six 🟩, then every
     guess EXCEPT the last paints its tile 🟥, split 3 + 3. Red is a tile you
     burned; green is one you never needed. A loss replaces the lot with red. */
  function shareGrid(won) {
    var cells = [];
    for (var i = 0; i < TILES; i++) cells.push(won ? "🟩" : "🟥");
    if (won) for (var k = 0; k < guesses.length - 1; k++) cells[order[k]] = "🟥";
    return [cells.slice(0, COLS).join(""), cells.slice(COLS, TILES).join("")];
  }

  function end(won) {
    if (ended) return;                                 // A.finish exactly once
    ended = true; over = true;
    picker.disable(true);
    draw();
    var n = guesses.length;
    var norm = won ? NORM[n] : LOSS_NORM;
    var grid = shareGrid(won);

    // Bank the day BEFORE the bonus rounds. If they close the tab halfway
    // through one, the flag result still has to count.
    bank(won, norm, grid);
    if (won) A.confetti(n <= 2 ? 130 : 70);
    runBonus(function (res) {
      // The bonus line is appended by MERGING into the saved state, not by a
      // second A.finish — finish is called once per day, full stop.
      if (!practice && res && res.length) {
        A.save(ID, day, { shareGrid: withBonus(grid, res), bonus: res });
      }
      sheet(won, grid, norm, res);
    });
  }

  // Bonus rounds add a row to the share but never touch `norm` — see the note
  // above buildRounds().
  function bonusRow(res) {
    if (!res || !res.length) return null;
    return res.map(function (r) { return r.ok ? r.icon : "▫️"; }).join("");
  }

  function withBonus(grid, res) {
    var g = (grid || []).slice(), r = bonusRow(res);
    if (r) g.push(r);
    return g;
  }

  function bank(won, norm, grid) {
    if (banked) return;
    banked = true;
    if (practice) { if (won) A.stamp(answer, ID); return; }
    A.finish(ID, day, {
      score: norm, norm: norm, won: won,
      detail: won ? guesses.length + "/" + TRIES : "X/" + TRIES,
      bucket: won ? guesses.length : "X",
      shareGrid: grid, durationMs: Date.now() - t0,
      stamps: won ? [answer] : [],
    });
  }

  function sheet(won, grid, norm, res) {
    var c = byIso[answer];
    var extra = '<p class="center" style="margin:var(--sp-2) 0 2px">' +
      '<b style="font-size:var(--t-lg);letter-spacing:.08em">' + A.esc(c.n) + "</b></p>" +
      '<p class="center tiny muted">' + A.esc([c.cap, c.sub || c.reg].filter(Boolean).join(" · ")) + "</p>" +
      '<p class="center" style="margin-top:var(--sp-2)">' + A.flagSwatches(answer) + "</p>";

    if (res && res.length) {
      var got = res.filter(function (r) { return r.ok; }).length;
      extra += '<p class="bn-tally">' + res.map(function (r) {
        return '<span class="' + (r.ok ? "hit" : "miss") + '">' + r.icon +
          "<i>" + A.esc(r.label) + "</i></span>";
      }).join("") + "</p>" +
        '<p class="center tiny muted">bonus rounds ' + got + " of " + res.length +
        " — they don't move your score</p>";
    }
    if (won) extra += '<p class="center tiny" style="color:var(--green);margin-top:var(--sp-2)">' +
      A.esc(c.n) + " stamped in your passport</p>";

    var g = withBonus(grid, res);
    A.results(ID, practice ? A.PRACTICE : day, {
      title: won ? (guesses.length <= 2 ? "SHARP" : "GOT IT") : "NOT THIS TIME",
      extraHTML: extra,
      state: { norm: norm, shareGrid: g, won: won },
      shareText: "FLAGLE" + (practice ? " (practice)" : " #" + day) + " " +
        (won ? guesses.length + "/" + TRIES : "X/" + TRIES) + "\n" + g.join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  window.addEventListener("resize", function () { clearTimeout(draw._t); draw._t = setTimeout(draw, 140); });

  /* Debug hooks. buttons() is the important one: it lists every control the
     cabinet is actually showing, so a test drives the REAL handlers instead of
     the functions underneath them. That is the lesson MISHANAMEH's dead END
     TURN button cost this build. */
  window.__FL = {
    answer: function () { return answer; },
    guess: guess,
    rounds: buildRounds,
    order: function () { return order.slice(); },
    weights: tileWeights,
    affinity: function (iso) { return affinity(iso, answer); },
    shareGrid: shareGrid,
    norm: NORM,
    buttons: function () {
      return A.$$(".bn-opt, .bn-next, .bn-skip, .ac-btn, .ac-pill, .ac-ico, .ac-picker .sug button");
    },
    state: function () {
      return {
        guesses: guesses, over: over, ended: ended, banked: banked, day: day,
        answerPool: POOL.length, guessPool: GUESS.length,
        tilesShown: over ? TILES : Math.min(TILES, guesses.length),
      };
    },
  };
})();
