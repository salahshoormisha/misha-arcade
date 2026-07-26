/* ============================================================================
   CONNECTRADE — sixteen products, four economies.
   ----------------------------------------------------------------------------
   Built on the shape of games/wordish/game.js (the reference implementation):
     requestedDay → seeded board → load → save on every move → finish once → results

   THE RULES THAT MAKE IT NOT-CONNECTIONS (verified, _build/RESEARCH.md):
     · the four countries ARE SHOWN, by name and flag, above the grid. You know
       WHO. The whole game is working out WHICH FOUR PRODUCTS are whose.
     · six mistakes, not four. "One off!" on a 3-of-4 guess.
     · a duplicate guess is BLOCKED (Submit refuses it), never punished.
     · group colour = the country's index in the day's list. It carries no
       difficulty signal at all — unlike Connections' yellow→purple.
     · a solved group becomes a full-width coloured band: country + its four.
     · every attempt is logged at the bottom with ✅/❌.

   FOUR THINGS THE ORIGINAL DOESN'T DO
     · it never reveals the answers when you lose. We always do.
     · every solved band says what that basket means, from the data: the
       basket's size, its dominant HS section, and each product's Balassa RCA.
     · the KEY toggle (colour-tag every product in the log) is remembered
       instead of silently resetting to "on" every single load.
     · a partial basket (Comtrade under-reporting, e.g. Iran) is flagged rather
       than presented as the whole truth.

   WHERE THE BOARD COMES FROM — core/data/trade.js, `rca{ISO2}` = 6-9 products
   by revealed comparative advantage (Balassa), already filtered to ≥0.5% of
   that country's exports. That file's own board rules, followed exactly:
     1. each country takes the first FOUR of its products not already claimed
        by an earlier country on the board;
     2. allocate THINNEST LIST FIRST, then validate 16 distinct products and
        redraw if not (measured 99.995% solvable in that order).
   The day's list order IS the allocation order, so "the country listed first
   keeps a shared product" is literally true.

   PICKING FOUR DISTINGUISHABLE ECONOMIES (a board of four oil states is a
   coin-flip, not a puzzle). The pool is every country with ≥$1.5B of exports,
   ≥6 RCA products and a flag — 148 of them. A day draws 2 from the 45 biggest
   exporters and 2 from the rest, so there is always a household name to anchor
   on, then keeps the draw only if:
     · ≥3 of the four have DIFFERENT dominant HS sections, and no section
       covers more than 2 of them (this is the anti-oil-state rule);
     · no more than 2 share a continent, and ≥3 different sub-regions.
   Plus a cooldown: days are built in blocks of eight and no country may appear
   twice inside a block, so you don't get Sweden three mornings running.

   NORM (cross-game 0-100 currency, CONTRACT §3):
     won  → max(25, 100 − 12 × mistakes)      lost → 10
   So 0 mistakes = 100, 1 = 88, 2 = 76, 3 = 64, 4 = 52, 5 = 40. A win can carry
   at most five mistakes (the sixth ends it), so the floor of 25 is a guard.
   PAR = 86 − 4 × (countries outside the top 40 exporters) − 1.2 × (tiles whose
   product name runs over 24 characters): a real, computable read on whether
   tonight is four famous economies or a vocabulary test. Clamped to 58..90.
   ========================================================================== */
(function () {
  "use strict";

  /* ── constants FIRST. A `var` initialiser does NOT hoist, so anything read
        while booting must be declared above its first use. ───────────────── */

  var ID = "connectrade";
  var MAX_MISTAKES = 6;
  var PICK = 4;                  // tiles per guess
  var MIN_TOTAL = 1.5e9;         // pool floor: a real economy, not a lagoon
  var MAJOR_N = 45;              // the "household name" tier
  var BLOCK = 8;                 // no country twice inside a block of days
  var TRIES = 60;                // draw attempts per day before loosening

  var T = window.AD_TRADE || {};
  var RCA = T.rca || {};
  var SECTIONS = T.sections || {};
  var YEAR = T.year || 2023;
  var TCO = {};
  (T.countries || []).forEach(function (c) { if (c && c.i) TCO[c.i] = c; });

  /* Group colour by index in the day's list — no difficulty meaning. */
  var GC = [
    { tok: "--cool", sq: "🟦" },
    { tok: "--gold", sq: "🟨" },
    { tok: "--mint", sq: "🟩" },
    { tok: "--violet", sq: "🟪" }
  ];
  var RANK_WORD = ["FLAWLESS", "SHARP", "SOLID", "SCRAPED IN", "SCRAPED IN", "SCRAPED IN"];

  /* HS4 labels that do not fit a tile. Every short form keeps the meaning; the
     full official name is shown on the solved band and in the result sheet.
     Checked: no two products collapse to the same short form, and nothing left
     in the pool is over 30 characters. */
  var SHORT = {
    "Slag, Ash and Residues Containing Heavy Metals, not from Ferrous Metallurgy": "Heavy-Metal Slag and Ash",
    "Alkali, alkaline-earth, rare-earth metals, scandium, yttrium, and mercury": "Alkali and Rare-Earth Metals",
    "Vehicle Bodies (including cabs) for the motor vehicles (8701 to 8705)": "Vehicle Bodies and Cabs",
    "Acyclic alcohol derivatives (halogenated, sulphonated, nitrated)": "Acyclic Alcohol Derivatives",
    "Trailers and semi-trailers, not mechanically propelled vehicles": "Trailers and Semi-Trailers",
    "Aircraft parts (gliders, balloons, and powered aircraft)": "Aircraft Parts",
    "Coal, Briquettes and Similar Manufactured Solid Fuels": "Coal and Briquettes",
    "Other live plants, cuttings and slips; mushroom spawn": "Live Plants and Cuttings",
    "Motor vehicles; parts and accessories (8701 to 8705)": "Motor Vehicle Parts",
    "Documents of title (bonds etc) and unused stamps": "Banknotes, Bonds and Stamps",
    "Sulfonated, Nitrated or Nitrosated Hydrocarbons": "Sulfonated Hydrocarbons",
    "Vaccines, blood, antisera, toxins and cultures": "Vaccines and Antisera",
    "Niobium, Tantalum, Vanadium and Zirconium Ore": "Niobium and Tantalum Ore",
    "Electrical Lighting and Signalling Equipment": "Lighting and Signal Gear",
    "Bicycles, delivery tricycles, other cycles": "Bicycles and Tricycles",
    "Hydrogen, rare gases and other non-metals": "Hydrogen and Rare Gases",
    "Industrial Fatty Acids, Oils and Alcohols": "Industrial Fatty Acids",
    "Synthetic Reconstructed Jewellery Stones": "Synthetic Gemstones",
    "Oxometallic or Peroxometallic Acid Salts": "Oxometallic Acid Salts",
    "Planes, Helicopters, and/or Spacecraft": "Planes and Helicopters",
    "Industrial Food Preperation Machinery": "Food Processing Machinery",
    "Machinery Having Individual Functions": "Special-Purpose Machinery",
    "Mixed Mineral or Chemical Fertilizers": "Mixed Fertilizers",
    "Dissolving Grades Chemical Woodpulp": "Dissolving Wood Pulp",
    "Other Vegetable Residues and Waste": "Vegetable Residues",
    "Coconuts, Brazil Nuts, and Cashews": "Coconuts and Cashews",
    "Coconut and Other Vegetable Fibers": "Coconut and Plant Fibers",
    "Large Flat-Rolled Stainless Steel": "Flat-Rolled Stainless Steel",
    "Processed Synthetic Staple Fibers": "Synthetic Staple Fibers",
    "Marble, Travertine and Alabaster": "Marble and Travertine",
    "Dried/Salted/Smoked/Brined Fish": "Dried or Salted Fish",
    "Nitrogen Heterocyclic Compounds": "Nitrogen Heterocyclics",
    "Other Processed Fruits and Nuts": "Processed Fruit and Nuts",
    "Reaction and Catalytic Products": "Catalytic Products",
    "Light Rubberized Knitted Fabric": "Rubberized Knit Fabric"
  };

  var HELP =
    "<p>Sixteen products. <b>Four economies, named above the grid.</b> Each one owns exactly " +
    "four of the tiles — the four things it sells a bigger share of than almost anyone else. " +
    "Pick four, hit <b>SUBMIT</b>.</p>" +
    "<ul><li><b>Six mistakes.</b> Get exactly three of a real four and you'll be told " +
    "<b>“One off!”</b> — but never which three.</li>" +
    "<li>A set you've already tried is <b>blocked, not punished</b>. SHUFFLE and DESELECT are free.</li>" +
    "<li>The four colours are just the order the countries are listed in. " +
    "<b>They mean nothing else</b> — there is no easy group and no purple trick here.</li>" +
    "<li><b>KEY</b> colour-tags every product in the attempts log with its true owner, so the log " +
    "fills in as an answer key. It's on by default and we remember what you set it to.</li>" +
    "<li>Solve a group and the band tells you <b>why</b> those four: the size of the basket, what " +
    "dominates it, and how many times the world-average share each product is.</li>" +
    "<li>Lose and you still get all four answers. Every country you crack is a <b>passport stamp</b>.</li></ul>" +
    "<p class='tiny muted'>“Unusually good at selling” is <b>revealed comparative advantage</b> " +
    "(Balassa): a product's share of that country's exports divided by its share of world exports. " +
    "12× means twelve times the world-average share — not twelve times more money than anyone else. " +
    YEAR + " CEPII BACI (HS6 Rev. 1992) via the OEC.</p>";

  /* ── the pool, built once ─────────────────────────────────────────────── */

  function cRec(iso) { return (window.AD_C ? window.AD_C(iso) : null) || null; }
  function cname(iso) { var c = cRec(iso); return (c && c.n) || iso; }

  var PROF = {};
  /* A country's dominant HS section, from items[] (which always carry one).
     "0" is the Other remainder and is skipped. */
  function profile(iso) {
    if (PROF[iso]) return PROF[iso];
    var c = TCO[iso], mix = {}, best = null, bw = -1, k;
    if (c) {
      for (k = 0; k < c.items.length; k++) {
        var it = c.items[k];
        if (!it.colour || it.colour === "0") continue;
        mix[it.colour] = (mix[it.colour] || 0) + (it.share || 0);
      }
    }
    Object.keys(mix).sort().forEach(function (s) {
      if (mix[s] > bw) { bw = mix[s]; best = s; }
    });
    PROF[iso] = { sec: best, share: bw < 0 ? 0 : bw };
    return PROF[iso];
  }

  var POOL = Object.keys(RCA).sort().filter(function (iso) {
    var c = TCO[iso];
    if (!c || !cRec(iso)) return false;
    if (!RCA[iso] || RCA[iso].length < 6) return false;
    if (!(c.total >= MIN_TOTAL)) return false;
    return !!profile(iso).sec;
  });

  var BY_SIZE = POOL.slice().sort(function (a, b) {
    return (TCO[b].total - TCO[a].total) || (a < b ? -1 : 1);
  });
  var MAJOR = BY_SIZE.slice(0, MAJOR_N).sort();
  var MINOR = BY_SIZE.slice(MAJOR_N).sort();
  var TOP40 = {};
  BY_SIZE.slice(0, 40).forEach(function (i) { TOP40[i] = 1; });

  /* ── formatting ───────────────────────────────────────────────────────── */

  function esc(s) { return A.esc(s === undefined || s === null ? "" : s); }
  function usd(v) {
    if (!v || v < 0) return "$0";
    if (v >= 1e12) return "$" + (v / 1e12).toFixed(v < 1e13 ? 2 : 1) + "T";
    if (v >= 1e9) return "$" + (v / 1e9).toFixed(v < 1e10 ? 1 : 0) + "B";
    if (v >= 1e6) return "$" + Math.round(v / 1e6) + "M";
    return "$" + Math.round(v);
  }
  function xmul(r) {
    if (!(r > 0)) return "—";
    if (r >= 100) return Math.round(r) + "×";
    if (r >= 10) return r.toFixed(0) + "×";
    return r.toFixed(1) + "×";
  }
  function shortName(n) {
    var s = SHORT[n];
    if (s) return s;
    if (n.length <= 30) return n;
    var cut = n.replace(/\s*[(;].*$/, "");           // drop a parenthetical / clause
    if (cut.length > 30) cut = cut.slice(0, 29).replace(/[\s,]+\S*$/, "") + "…";
    return cut || n.slice(0, 29) + "…";
  }
  function flagImg(iso, w, h) {
    return '<img alt="" src="' + A.rootPath() + "core/data/flags/" + esc(iso) +
      '.svg"' + (w ? ' style="width:' + w + "px;height:" + h + 'px"' : "") +
      ' onerror="this.style.visibility=\'hidden\'">';
  }

  /* ── board construction ───────────────────────────────────────────────── */

  function diverse(four) {
    var secs = {}, regs = {}, subs = {}, nsec = 0, nsub = 0, i, s, c;
    for (i = 0; i < four.length; i++) {
      s = profile(four[i]).sec;
      secs[s] = (secs[s] || 0) + 1;
      if (secs[s] === 1) nsec++;
      if (secs[s] > 2) return false;                 // the anti-oil-state rule
      c = cRec(four[i]);
      if (!c) return false;
      regs[c.reg] = (regs[c.reg] || 0) + 1;
      if (regs[c.reg] > 2) return false;
      if (!subs[c.sub]) { subs[c.sub] = 1; nsub++; }
    }
    return nsec >= 3 && nsub >= 3;
  }

  /* Thinnest RCA list first, ties broken by draw position — a stable order that
     does not depend on Array#sort stability. */
  function allocOrder(four) {
    var idx = [0, 1, 2, 3].slice(0, four.length);
    idx.sort(function (a, b) {
      var d = RCA[four[a]].length - RCA[four[b]].length;
      return d || (a - b);
    });
    return idx.map(function (k) { return four[k]; });
  }

  function allocate(four) {
    var seq = allocOrder(four), claimed = {}, disp = {}, groups = [], i, j;
    for (i = 0; i < seq.length; i++) {
      var list = RCA[seq[i]], got = [];
      for (j = 0; j < list.length && got.length < PICK; j++) {
        var p = list[j];
        if (claimed[p.name]) continue;               // an earlier country kept it
        var d = shortName(p.name);
        if (disp[d]) continue;                       // two labels would look identical
        claimed[p.name] = 1; disp[d] = 1;
        got.push({ name: p.name, disp: d, rca: p.rca });
      }
      if (got.length < PICK) return null;            // this draw cannot field 16
      groups.push({ i: seq[i], items: got });
    }
    var n = 0;
    for (i = 0; i < groups.length; i++) n += groups[i].items.length;
    return n === PICK * groups.length ? groups : null;
  }

  function drawTwo(rand, tier, used) {
    var s = A.shuffle(rand, tier), out = [], i;
    for (i = 0; i < s.length && out.length < 2; i++) {
      if (used.indexOf(s[i]) < 0) out.push(s[i]);
    }
    return out;
  }

  /* One board for one seed. `avoid` is a list of countries on cooldown;
     `loose` drops the diversity gate (last resort only). */
  function buildOne(seed, avoid, loose) {
    for (var att = 0; att < TRIES; att++) {
      var rand = A.rng(ID + ":board:" + seed + ":" + att);
      var four = drawTwo(rand, MAJOR, avoid).concat(drawTwo(rand, MINOR, avoid));
      if (four.length < 4) return null;
      four = A.shuffle(rand, four);
      if (!loose && !diverse(four)) continue;
      var g = allocate(four);
      if (g) return { groups: g, attempt: att, loose: !!loose };
    }
    return null;
  }

  /* The day's board. Deterministic in `dayN` alone, and cheap: days are built
     in blocks of eight, each day excluding every country already used earlier
     in ITS block, so no country can appear twice inside a block. Because a
     block always starts from the same state, day N's board is the same however
     you arrive at it — which a rolling window could not promise. Eight builds,
     ~2 ms, and both players get the identical board. */
  var boardCache = {};
  function boardFor(dayN) {
    if (boardCache[dayN]) return boardCache[dayN];
    var d0 = Math.floor(dayN / BLOCK) * BLOCK, avoid = [], b = null, d;
    for (d = d0; d <= dayN; d++) {
      if (boardCache[d]) b = boardCache[d];
      else {
        b = buildOne(d, avoid, false) || buildOne(d, [], false) || buildOne(d, [], true);
        if (!b) return null;
        boardCache[d] = b;
      }
      b.groups.forEach(function (g) { avoid.push(g.i); });
    }
    return b;
  }

  function practiceBoard() {
    var s = "p" + Date.now() + ":" + Math.random();
    return buildOne(s, [], false) || buildOne(s, [], true);
  }

  /* ── par: is tonight four famous economies, or a vocabulary test? ──────── */

  function parFor(b) {
    if (!b) return null;
    var outside = 0, long = 0;
    b.groups.forEach(function (g) {
      if (!TOP40[g.i]) outside++;
      g.items.forEach(function (p) { if (p.name.length > 24) long++; });
    });
    return A.clamp(Math.round(86 - 4 * outside - 1.2 * long), 58, 90);
  }
  A.setPar(ID, function (dayN) {
    if (dayN === A.PRACTICE) return parFor(board);
    return parFor(boardFor(dayN));
  });

  /* THE NORM FORMULA — on the debug hook so it can be checked directly. */
  function normFor(m, w) { return w ? Math.max(25, 100 - 12 * m) : 10; }

  /* ── state ────────────────────────────────────────────────────────────── */

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var board = null, groups = [], order = [], sel = [], guesses = [], solved = [];
  var mistakes = 0, over = false, won = false, busy = false, t0 = Date.now();
  var showKey = true;
  var main, host, stripEl, bandHost, grid, heartEl, subBtn, hintEl, logEl, keyBtn;
  var tileEl = {};

  var PREF = ID + ":prefs";
  function loadPrefs() {
    var p = A.load(PREF, 0);
    if (p && typeof p.key === "boolean") showKey = p.key;
  }
  function savePrefs() { A.save(PREF, 0, { key: showKey }); }

  function groupOf(name) {
    for (var i = 0; i < groups.length; i++) {
      var it = groups[i].items;
      for (var j = 0; j < it.length; j++) if (it[j].name === name) return groups[i];
    }
    return null;
  }
  function isSolved(iso) { return solved.indexOf(iso) >= 0; }
  function groupByIso(iso) {
    for (var i = 0; i < groups.length; i++) if (groups[i].i === iso) return groups[i];
    return null;
  }
  function isLive(name) { var g = groupOf(name); return !!g && !isSolved(g.i); }
  function liveTiles() { return order.filter(isLive); }
  function unsolved() { return groups.filter(function (g) { return !isSolved(g.i); }); }
  function dispOf(name) { var g = groupOf(name); if (!g) return name;
    for (var j = 0; j < g.items.length; j++) if (g.items[j].name === name) return g.items[j].disp;
    return name; }

  /* ── one true line per country, composed from the data ────────────────── */

  function basketLine(g) {
    var c = TCO[g.i], pr = profile(g.i);
    var sec = pr.sec && SECTIONS[pr.sec] ? SECTIONS[pr.sec].name : null;
    var bits = [usd(c.total) + " of exports in " + YEAR];
    if (sec && pr.share > 0) bits.push(sec.toLowerCase() + " " + Math.round(pr.share * 100) + "% of the basket");
    var top = g.items[0], i;
    for (i = 1; i < g.items.length; i++) if (g.items[i].rca > top.rca) top = g.items[i];
    bits.push("most lopsided here: " + top.disp.toLowerCase() + " at " + xmul(top.rca) + " the world-average share");
    return bits.join(" · ");
  }

  /* trade.js flags two different problems; take the wording from its own note
     so the tag can never contradict the note printed underneath it. */
  function noteTag(iso) {
    var c = TCO[iso];
    if (!c || !c.note) return "";
    return /^re-export/i.test(c.note) ? " · re-export inflated, see below"
      : " · partial data, see below";
  }

  /* ── boot ─────────────────────────────────────────────────────────────── */

  function boot() {
    main = A.mount({ id: ID, dayN: day, help: HELP, wide: true });
    host = A.el("div"); host.id = "ctboard";
    main.appendChild(host);

    if (!POOL.length) {
      host.innerHTML = '<p class="center muted" style="padding:44px 0;line-height:1.8">' +
        "Trade data hasn't loaded.<br>Check <b>core/data/trade.js</b> — it should set " +
        "<code>window.AD_TRADE.rca</code>.</p>";
      return;
    }

    loadPrefs();
    board = practice ? practiceBoard() : boardFor(day);
    if (!board) {
      host.innerHTML = '<p class="center muted" style="padding:44px 0;line-height:1.8">' +
        "Couldn't build a board for day " + esc(String(day)) + ".<br>" +
        '<a href="?practice=1">Try practice</a> instead.</p>';
      return;
    }
    groups = board.groups;

    var all = [];
    groups.forEach(function (g) { g.items.forEach(function (p) { all.push(p.name); }); });
    order = A.shuffle(A.rng(ID + ":lay:" + (practice ? String(Math.random()) : day)), all);

    /* top row */
    var top = A.el("div", "cttop ac-row");
    top.innerHTML =
      '<button class="ac-pill" id="ctarch">🗓 ARCHIVE</button>' +
      '<span class="ac-pill" id="ctpar"></span>' +
      (practice ? '<a class="ac-pill" href="./">← TODAY\'S BOARD</a>'
        : '<a class="ac-pill" href="?practice=1">∞ PRACTICE</a>');
    host.appendChild(top);
    top.querySelector("#ctarch").onclick = function () { A.archiveModal(ID); };
    var pp = top.querySelector("#ctpar");
    var par = A.par(ID, practice ? A.dayNumber() : day);
    pp.innerHTML = "PAR <b>" + par.par + "</b>";
    pp.title = "par is " + par.source;

    var cap = A.el("p", "tiny dim center", "THESE FOUR ECONOMIES · FOUR PRODUCTS EACH");
    cap.style.cssText = "margin-top:12px;letter-spacing:1.6px;font-size:9.5px";
    host.appendChild(cap);

    stripEl = A.el("div"); stripEl.id = "ctstrip";
    host.appendChild(stripEl);

    bandHost = A.el("div"); bandHost.id = "ctbands";
    host.appendChild(bandHost);

    grid = A.el("div"); grid.id = "ctgrid";
    host.appendChild(grid);

    heartEl = A.el("div", "cthearts");
    host.appendChild(heartEl);

    var ctl = A.el("div", "ac-row ctctl");
    ctl.innerHTML =
      '<button class="ac-pill" id="ctshuf">🔀 SHUFFLE</button>' +
      '<button class="ac-pill" id="ctdesel">DESELECT</button>' +
      '<button class="ac-pill" id="ctkey"></button>';
    host.appendChild(ctl);

    var ctl2 = A.el("div", "ac-row ctctl ctctl2");
    ctl2.innerHTML = '<button class="ac-btn" id="ctsubmit" disabled>SELECT FOUR</button>';
    host.appendChild(ctl2);

    hintEl = A.el("div", "cthint");
    host.appendChild(hintEl);

    logEl = A.el("div", "ctlog");
    host.appendChild(logEl);

    var credit = A.el("p", "ac-credit",
      YEAR + " exports · CEPII BACI (HS6 Rev. 1992) via the OEC · " +
      "groups are each country's top four by Balassa RCA");
    credit.style.marginTop = "16px";
    host.appendChild(credit);

    subBtn = ctl2.querySelector("#ctsubmit");
    keyBtn = ctl.querySelector("#ctkey");
    subBtn.onclick = submit;
    keyBtn.onclick = function () {
      showKey = !showKey; savePrefs(); A.sfx("tick");
      A.toast(showKey ? "Log shows each product's owner" : "Log is plain text");
      render();
    };
    ctl.querySelector("#ctshuf").onclick = doShuffle;
    ctl.querySelector("#ctdesel").onclick = function () {
      if (over || busy || !sel.length) return;
      sel = []; A.sfx("tick"); render(); save();
    };

    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector(".ac-modal.show")) return;
      if (e.key === "Enter" && !over && !busy && sel.length === PICK) { e.preventDefault(); submit(); }
      else if (e.key === "Escape" && sel.length) { e.preventDefault(); sel = []; render(); }
    });

    window.addEventListener("resize", relayout);
    window.addEventListener("orientationchange", relayout);
    /* A tab that was hidden when it rendered has no layout to measure; re-fit
       the type the moment it comes back. */
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) relayout();
    });

    restore();
  }

  /* ── rendering ────────────────────────────────────────────────────────── */

  function render() { renderStrip(); renderBands(); renderGrid(); renderStatus(); renderLog(); }

  function relayout() {
    clearTimeout(relayout._t);
    relayout._t = setTimeout(renderGrid, 140);
  }

  function renderStrip() {
    stripEl.innerHTML = "";
    groups.forEach(function (g, k) {
      var done = isSolved(g.i);
      var e = A.el("div", "ctc" + (done ? " done" : ""));
      e.style.setProperty("--ctc", "var(" + GC[k].tok + ")");
      e.innerHTML = flagImg(g.i) + '<span class="nm">' + esc(cname(g.i)) + "</span>" +
        '<span class="tk">' + (done ? "✓" : "×4") + "</span>";
      e.title = cname(g.i) + (done ? " — solved" : " — four of these tiles are its exports");
      stripEl.appendChild(e);
    });
  }

  function bandEl(g, k, revealed) {
    var b = A.el("div", "ctband" + (revealed ? " rev" : ""));
    b.style.setProperty("--ctc", "var(" + GC[k].tok + ")");
    b.innerHTML =
      '<span class="bn">' + flagImg(g.i, 20, 14) + esc(cname(g.i).toUpperCase()) + "</span>" +
      '<span class="bt">' + g.items.map(function (p) { return esc(p.disp); }).join(" · ") + "</span>" +
      '<span class="bz">' + esc(basketLine(g) + noteTag(g.i)) + "</span>";
    return b;
  }

  function renderBands() {
    bandHost.innerHTML = "";
    solved.forEach(function (iso) {
      var k = idxOf(iso);
      if (k >= 0) bandHost.appendChild(bandEl(groups[k], k, false));
    });
    if (over && !won) {
      groups.forEach(function (g, k) {
        if (!isSolved(g.i)) bandHost.appendChild(bandEl(g, k, true));
      });
    }
  }

  function idxOf(iso) {
    for (var i = 0; i < groups.length; i++) if (groups[i].i === iso) return i;
    return -1;
  }

  /* Deterministic type fitting — no measure-and-retry, no requestAnimationFrame
     (which is paused in a background tab and would leave tiles unreadable).
     Greedy monospace wrap at each candidate size; first size whose lines fit
     the tile's height wins, so nothing can ever clip. */
  function fitFont(text, w, h) {
    var words = String(text).toUpperCase().split(/\s+/), fs, i;
    for (fs = 13; fs >= 8; fs -= 0.5) {
      var cpl = Math.floor((w - 12) / (fs * 0.62));
      if (cpl < 3) continue;
      var lines = 1, room = cpl;
      for (i = 0; i < words.length; i++) {
        var wl = words[i].length;
        if (wl > cpl) {                              // hard-broken by overflow-wrap
          if (room < cpl) { lines++; room = cpl; }
          var need = wl;
          while (need > room) { need -= room; lines++; room = cpl; }
          room -= need;
          if (room === 0) { lines++; room = cpl; }
          continue;
        }
        if (wl <= room) { room -= wl + 1; }
        else { lines++; room = cpl - wl - 1; }
      }
      if (lines * fs * 1.16 <= h - 10) return fs;
    }
    return 8;
  }

  /* A tile's real box — or, if the page is laid out at zero width (hidden tab,
     a Safari page restored from cache), the box it WILL have, derived from the
     same numbers game.css uses. Never returns something unusable. */
  function tileBox(el) {
    var w = el ? el.clientWidth : 0, h = el ? el.clientHeight : 0;
    if (w >= 60 && h >= 40) return { w: w, h: h };
    var vw = Math.max(320, document.documentElement.clientWidth || window.innerWidth || 375);
    var gw = Math.min(720, Math.min(900, vw) - 28);
    var cols = gw >= 560 ? 4 : 2;
    return { w: Math.max(80, (gw - (cols - 1) * 7) / cols), h: cols === 4 ? 84 : 70 };
  }

  function renderGrid() {
    var live = liveTiles();
    grid.innerHTML = "";
    tileEl = {};
    grid.classList.toggle("off", over || busy);
    if (!live.length) return;
    var shown = [];
    live.forEach(function (name) {
      var d = dispOf(name);
      var b = A.el("button", "ctt", esc(d));
      b.type = "button";
      if (sel.indexOf(name) >= 0) b.classList.add("sel");
      b.setAttribute("aria-pressed", sel.indexOf(name) >= 0 ? "true" : "false");
      if (d !== name) b.title = name;
      b.onclick = function () { tap(name); };
      tileEl[name] = b;
      shown.push({ el: b, text: d });
      grid.appendChild(b);
    });
    /* Measure ONE real tile, then size the type to it. Reading the box beats
       guessing the column count from a media query we'd have to keep in sync,
       and it is a single synchronous reflow — never rAF, which a background tab
       pauses (tiles would be left unsized and unreadable). */
    var box = tileBox(shown[0].el);
    shown.forEach(function (s) { s.el.style.fontSize = fitFont(s.text, box.w, box.h) + "px"; });
  }

  function renderStatus() {
    var left = MAX_MISTAKES - mistakes, h = "", i;
    for (i = 0; i < MAX_MISTAKES; i++) h += '<i class="' + (i < left ? "" : "gone") + '">♥</i>';
    heartEl.innerHTML = '<span class="hh">' + h + "</span><span>" +
      (over ? (won ? "SOLVED" : "OUT") : left + " LEFT") + "</span>";

    if (keyBtn) keyBtn.innerHTML = showKey ? "🔑 KEY ON" : "🔑 KEY OFF";

    if (subBtn) {
      var dup = sel.length === PICK && seen(sel);
      subBtn.disabled = over || busy || sel.length !== PICK || dup;
      subBtn.textContent = over ? "DONE"
        : dup ? "ALREADY TRIED"
          : sel.length === PICK ? "SUBMIT"
            : sel.length === 0 ? "SELECT FOUR" : "SELECT " + (PICK - sel.length) + " MORE";
    }
    if (hintEl) {
      hintEl.innerHTML = over ? ""
        : sel.length === PICK && seen(sel) ? "You've tried these four already — swap one out. It costs nothing."
          : unsolved().length === 1 && solved.length ? "One economy left. Everything still on the board is theirs."
            : "";
    }
  }

  function renderLog() {
    if (!guesses.length) { logEl.innerHTML = ""; return; }
    var h = "<h3>ATTEMPTS</h3><ol>";
    guesses.forEach(function (gg, n) {
      var hit = correctGroup(gg);
      h += '<li class="' + (hit ? "hit" : "") + '"><span class="n">' + (n + 1) + "</span>" +
        '<span class="ps">' + gg.map(function (name) {
          var k = idxOf((groupOf(name) || {}).i);
          var sw = showKey && k >= 0
            ? '<span class="sw" style="--swc:var(' + GC[k].tok + ')"></span>' : "";
          return sw + esc(dispOf(name));
        }).join(", ") + "</span>" +
        '<span class="mk">' + (hit ? "✅" : "❌") + "</span></li>";
    });
    logEl.innerHTML = h + "</ol>";
  }

  /* ── play ─────────────────────────────────────────────────────────────── */

  function keyOf(list) { return list.slice().sort().join("|"); }
  function seen(list) {
    var k = keyOf(list);
    for (var i = 0; i < guesses.length; i++) if (keyOf(guesses[i]) === k) return true;
    return false;
  }
  function correctGroup(list) {
    var g = groupOf(list[0]);
    if (!g) return null;
    for (var i = 1; i < list.length; i++) if (groupOf(list[i]) !== g) return null;
    return list.length === PICK ? g : null;
  }

  function tap(name) {
    if (over || busy) return;
    var i = sel.indexOf(name);
    if (i >= 0) { sel.splice(i, 1); A.sfx("tick"); }
    else if (sel.length >= PICK) { A.toast("Four at a time — deselect one first"); return; }
    else { sel.push(name); A.sfx("key"); }
    render();
    save();
  }

  function submit() {
    if (over || busy || sel.length !== PICK) return;
    if (seen(sel)) { A.toast("Already tried — it costs you nothing"); A.sfx("tick"); return; }

    var picked = sel.slice();
    guesses.push(picked);
    busy = true;

    var hit = correctGroup(picked), best = 0;
    groups.forEach(function (g) {
      var n = 0;
      picked.forEach(function (name) { if (groupOf(name) === g) n++; });
      if (n > best) best = n;
    });

    if (hit) {
      solved.push(hit.i);
      sel = [];
      save();
      bounce(picked);
      A.sfx("ok", solved.length - 1);
      setTimeout(function () {
        busy = false;
        render();
        if (solved.length === groups.length) end(true);
      }, 520);
      return;
    }

    mistakes++;
    save();
    shake(picked);
    A.sfx(mistakes >= MAX_MISTAKES ? "lose" : "miss");
    if (best === PICK - 1) A.toast("One off!");
    else if (mistakes === MAX_MISTAKES - 1) A.toast("One heart left", true);

    setTimeout(function () {
      busy = false;
      sel = [];
      render();
      if (mistakes >= MAX_MISTAKES) end(false);
    }, 460);
  }

  function shake(list) {
    list.forEach(function (name) {
      var e = tileEl[name];
      if (!e) return;
      e.classList.add("ac-shake");
      setTimeout(function () { e.classList.remove("ac-shake"); }, 430);
    });
  }
  function bounce(list) {
    list.forEach(function (name, i) {
      var e = tileEl[name];
      if (!e) return;
      setTimeout(function () {
        e.classList.add("ac-bounce");
        setTimeout(function () { e.classList.remove("ac-bounce"); }, 500);
      }, i * 80);
    });
  }

  function doShuffle() {
    if (over || busy) return;
    var live = liveTiles();
    if (live.length < 2) return;
    var next = live, tries = 0, i;
    while (tries++ < 24) {
      next = A.shuffle(A.rng(Date.now() + ":" + Math.random() + ":" + tries), live);
      var same = false;
      for (i = 0; i < live.length; i++) if (next[i] === live[i]) { same = true; break; }
      if (!same) break;
    }
    var out = order.slice(), n = 0;
    for (i = 0; i < out.length; i++) if (isLive(out[i])) out[i] = next[n++];
    order = out;
    A.sfx("tick");
    render();
    save();
  }

  /* ── persistence ──────────────────────────────────────────────────────── */

  function sig() { return groups.map(function (g) { return g.i; }).join(","); }

  function playState() {
    return { v: 1, sig: sig(), order: order, sel: sel, guesses: guesses, solved: solved };
  }
  function save() { if (!practice) A.save(ID, day, playState()); }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st && st.sig !== sig()) st = null;             // board changed under us
    if (st) {
      if (st.order && st.order.length === order.length) order = st.order.slice();
      guesses = (st.guesses || []).filter(function (g) {
        return g && g.length === PICK && g.every(function (n) { return !!groupOf(n); });
      });
      solved = (st.solved || []).filter(function (iso) { return !!groupByIso(iso); });
      sel = (st.sel || []).filter(isLive).slice(0, PICK);
      mistakes = 0;
      guesses.forEach(function (g) { if (!correctGroup(g)) mistakes++; });
      if (st.done) { over = true; won = !!st.won; }
      else if (solved.length === groups.length) { over = true; won = true; }
      else if (mistakes >= MAX_MISTAKES) { over = true; won = false; }
    }
    render();
    if (over) {
      setTimeout(function () {
        sheet(won, st && st.norm !== undefined ? st.norm : normFor(mistakes, won));
      }, 240);
    }
  }

  /* ── ending ───────────────────────────────────────────────────────────── */

  function shareRows() {
    return guesses.map(function (gg) {
      return gg.map(function (name) {
        var k = idxOf((groupOf(name) || {}).i);
        return k >= 0 ? GC[k].sq : "⬜";
      }).join("");
    });
  }

  function shareText(norm) {
    return "CONNECTRADE " + (practice ? "(practice)" : "#" + day) + " · " + norm + "/100\n" +
      shareRows().join("\n") + "\n" + A.SITE;
  }

  function end(w) {
    over = true;
    won = w;
    var norm = normFor(mistakes, won);
    var rows = shareRows();
    var detail = won ? (mistakes ? mistakes + " wrong" : "clean sweep")
      : "lost " + solved.length + "/" + groups.length;

    if (!practice) {
      A.finish(ID, day, {
        score: norm, norm: norm, won: won, detail: detail, bucket: String(mistakes),
        shareGrid: rows, stamps: solved.slice(), durationMs: Date.now() - t0
      });
    }

    render();
    if (won) {
      A.sfx(mistakes === 0 ? "perfect" : "win");
      A.confetti(mistakes === 0 ? 150 : 85);
    } else {
      A.sfx("lose");
    }
    setTimeout(function () { sheet(won, norm); }, won ? 880 : 1120);
  }

  function sheet(w, norm) {
    var html = '<div class="ctsum">';
    groups.forEach(function (g, k) {
      var c = TCO[g.i];
      html += '<div class="ctsrow" style="--ctc:var(' + GC[k].tok + ')">' +
        "<b>" + flagImg(g.i, 18, 12) + esc(cname(g.i).toUpperCase()) +
        (isSolved(g.i) ? " ✓" : "") + "</b>" +
        '<span class="pl">' + g.items.map(function (p) {
          return esc(p.name) + " <span style='color:var(--ink4)'>" + esc(xmul(p.rca)) + "</span>";
        }).join(" · ") + "</span>" +
        "<i>" + esc(basketLine(g)) + "</i>" +
        (c && c.note ? "<u>⚠︎ " + esc(c.note) + "</u>" : "") +
        "</div>";
    });
    html += "</div>";
    html += '<p class="tiny dim center" style="margin-top:8px;line-height:1.6">' +
      "× is Balassa RCA: that many times the world-average share of exports. " +
      YEAR + " CEPII BACI via the OEC.</p>";

    var lines = w
      ? [mistakes ? mistakes + (mistakes === 1 ? " mistake" : " mistakes") + " · " +
        (MAX_MISTAKES - mistakes) + " hearts left" : "not one wrong guess"]
      : ["you cracked " + solved.length + " of " + groups.length + " — here are all four"];

    var m = A.results(ID, practice ? A.PRACTICE : day, {
      title: w ? RANK_WORD[Math.min(mistakes, RANK_WORD.length - 1)] : "NEXT TIME",
      lines: lines,
      extraHTML: html,
      state: { norm: norm, shareGrid: shareRows(), won: w },
      shareText: shareText(norm),
      onReplay: function () { location.reload(); }
    });
    var sb = m.body.querySelector("#ac-share");
    if (sb) sb.onclick = function () { A.share(shareText(norm)); };
    return m;
  }

  /* ── register + debug hook ────────────────────────────────────────────── */

  A.register({
    id: ID, name: "CONNECTRADE", tagline: "sixteen products, four economies",
    icon: "🧭", accent: "--cool", family: "trade", parMs: 180000,
    hasArchive: true, hasPractice: true
  });

  /* Enough to play a whole game — and audit every board — from the console. */
  window.__CT = {
    pool: function () {
      return { pool: POOL.length, major: MAJOR.length, minor: MINOR.length };
    },
    board: function () {
      return {
        day: day, practice: practice, attempt: board && board.attempt,
        loose: !!(board && board.loose), par: parFor(board),
        countries: groups.map(function (g) { return g.i; })
      };
    },
    groups: function () {
      return groups.map(function (g, k) {
        return {
          iso: g.i, name: cname(g.i), colour: GC[k].tok,
          products: g.items.map(function (p) { return p.name; }),
          shown: g.items.map(function (p) { return p.disp; }),
          rca: g.items.map(function (p) { return p.rca; }),
          line: basketLine(g)
        };
      });
    },
    tiles: function () { return liveTiles().map(dispOf); },
    select: function (list) { sel = list.slice(0, PICK); render(); return sel; },
    submit: submit,
    guess: function (list) { sel = list.slice(0, PICK); render(); submit(); return this.state(); },
    solve: function (n) {
      var g = groups[n];
      return this.guess(g.items.map(function (p) { return p.name; }));
    },
    /* three of one group plus a ringer from the next — a deliberate near miss */
    wrong: function () {
      var left = unsolved();
      if (left.length < 2) return null;
      return this.guess(left[0].items.slice(0, 3).map(function (p) { return p.name; })
        .concat([left[1].items[0].name]));
    },
    shuffle: doShuffle,
    state: function () {
      return {
        mistakes: mistakes, hearts: MAX_MISTAKES - mistakes, solved: solved.slice(),
        guesses: guesses.length, over: over, won: won, selected: sel.slice(),
        norm: normFor(mistakes, won), share: shareRows()
      };
    },
    normFor: normFor,

    /* Every invariant that matters, over `n` days of real boards. */
    audit: function (n) {
      n = n || 200;
      var bad = [], seenLoose = 0, attempts = 0, maxAtt = 0, pars = [], longest = 0;
      var use = {}, dispSeen = {}, dispClash = [];
      var adjacent = 0, inBlock = 0, prev = null, blockSeen = {}, blockAt = -1;
      for (var d = 0; d < n; d++) {
        var b = boardFor(d);
        if (!b) { bad.push([d, "no board"]); continue; }
        if (b.loose) seenLoose++;
        attempts += b.attempt; maxAtt = Math.max(maxAtt, b.attempt);
        pars.push(parFor(b));
        var names = {}, disp = {}, iso = {}, nb = 0;
        b.groups.forEach(function (g) {
          if (iso[g.i]) bad.push([d, "country twice"]);
          iso[g.i] = 1;
          use[g.i] = (use[g.i] || 0) + 1;
          if (g.items.length !== 4) bad.push([d, "group of " + g.items.length]);
          g.items.forEach(function (p) {
            nb++;
            if (names[p.name]) bad.push([d, "dup product " + p.name]);
            if (disp[p.disp]) bad.push([d, "dup label " + p.disp]);
            names[p.name] = disp[p.disp] = 1;
            longest = Math.max(longest, p.disp.length);
            if (dispSeen[p.disp] && dispSeen[p.disp] !== p.name) {
              dispClash.push([p.disp, p.name, dispSeen[p.disp]]);
            }
            dispSeen[p.disp] = p.name;
          });
        });
        if (nb !== 16) bad.push([d, "tiles " + nb]);
        var isos = b.groups.map(function (g) { return g.i; });
        if (Math.floor(d / BLOCK) !== blockAt) { blockAt = Math.floor(d / BLOCK); blockSeen = {}; }
        isos.forEach(function (i2) {
          if (blockSeen[i2]) inBlock++;
          blockSeen[i2] = 1;
          if (prev && prev.indexOf(i2) >= 0) adjacent++;
        });
        prev = isos;
      }
      pars.sort(function (a, b2) { return a - b2; });
      return {
        days: n, problems: bad.slice(0, 12), problemCount: bad.length,
        looseBoards: seenLoose, meanAttempts: +(attempts / n).toFixed(2), maxAttempt: maxAtt,
        parMin: pars[0], parMedian: pars[Math.floor(pars.length / 2)], parMax: pars[pars.length - 1],
        longestLabel: longest, labelClashes: dispClash.slice(0, 6),
        repeatsInsideBlock: inBlock, backToBackDays: adjacent,
        countriesUsed: Object.keys(use).length,
        mostUsed: Object.keys(use).sort(function (a, b2) { return use[b2] - use[a]; })
          .slice(0, 5).map(function (i2) { return i2 + ":" + use[i2]; })
      };
    }
  };

  boot();
})();
