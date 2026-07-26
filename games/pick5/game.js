/* ============================================================================
   PICK 5 — name the five biggest exporters of the day's product.
   Built on the shape of games/wordish/game.js (the reference implementation):
     requestedDay → dailyIndex → load → save on every move → finish once → results.

   SCORING (verified against the real OEC game, _build/RESEARCH.md):
     score% = Σ over your 5 picks of  ( that country's export value of the product
                                        ÷ Σ of the TRUE top-5 countries' values ) × 100
     Every pick earns partial credit. 100% is reachable only by naming the exact
     five, because any substitute is by definition smaller than what it replaces.
     Trophies at 50 / 75 / 90 (🥉🥈🥇) and 🏅 for the exact top five.

   NORM (cross-game 0-100 currency, CONTRACT §3):
     norm = clamp(round(score%), 5, 100) once you've spent all five picks.
     A 5-pick finish can never score below 5; naming the true top five is a
     genuine 100 and is rare, so 100 is never handed out for merely finishing.
     bucket = "0-49" | "50-74" | "75-89" | "90+"   (the trophy bands)
     par    = 50 + naive/2, where `naive` is what you'd score by blindly picking
     the world's five largest exporters overall (CN, US, DE, JP, KR) — a real,
     computable measure of how obvious today's product is.

   WHERE THE RANKED TABLE COMES FROM
     core/data/trade.js ships the exact top 5 per HS4 product (`top5[].top`).
     Ranks 6+ are reconstructed from the same file two ways, so a pick just
     outside the medals still gets its true rank and its real value:
       (a) composition — a country's `items[]` share × its `total`
       (b) RCA inversion — Balassa RCA rearranged: v = rca × E_country × W_product ÷ W_world
     Both were checked against the exact top-5 values: (a) agrees to <0.5%,
     (b) to <2%. Anything past that table scores 0 and is labelled honestly as
     "outside the ranked table", NOT as "exports none" — see sheet().
   ========================================================================== */
(function () {
  "use strict";

  /* ── constants FIRST (a `var` initialiser does not hoist; anything read
        during boot must be declared above its first use) ─────────────────── */
  var ID = "pick5", PICKS = 5;
  var T = window.AD_TRADE || {};
  var PRODUCTS = (T.top5 || []).filter(function (p) { return p && p.top && p.top.length === 5; });
  var SECTIONS = T.sections || {};
  var TRADE_C = T.countries || [];
  var RCA = T.rca || {};
  var WORLD = T.worldTotal || 0;
  var YEAR = T.year || 2023;

  var SEG = ["--mint", "--cool", "--violet", "--hot", "--gold"];
  var TIERS = [
    { at: 90, cup: "🥇", word: "GOLD" },
    { at: 75, cup: "🥈", word: "SILVER" },
    { at: 50, cup: "🥉", word: "BRONZE" },
  ];
  var NAIVE = ["CN", "US", "DE", "JP", "KR"];   // the five biggest exporters, full stop

  var TOTALS = {};
  TRADE_C.forEach(function (c) { TOTALS[c.i] = c.total; });

  /* ── formatting ─────────────────────────────────────────────────────────── */
  function usd(v) {
    if (!v || v < 0) return "$0";
    if (v >= 1e12) return "$" + (v / 1e12).toFixed(v < 1e13 ? 2 : 1) + "T";
    if (v >= 1e9) return "$" + (v / 1e9).toFixed(v < 1e10 ? 2 : 1) + "B";
    if (v >= 1e6) return "$" + (v / 1e6).toFixed(v < 1e7 ? 1 : 0) + "M";
    if (v >= 1e3) return "$" + Math.round(v / 1e3) + "k";
    return "$" + Math.round(v);
  }
  function pc(x, dp) { return x.toFixed(dp === undefined ? 1 : dp) + "%"; }
  function cname(iso) {
    var c = window.AD_C ? window.AD_C(iso) : null;
    return (c && c.n) || iso;
  }
  function flagImg(iso) {
    return '<img alt="" src="' + A.rootPath() + "core/data/flags/" + iso +
      '.svg" style="width:20px;height:13px;object-fit:cover;border-radius:2px;' +
      'vertical-align:-1px;margin-right:6px" onerror="this.style.visibility=\'hidden\'">';
  }

  /* ── the ranked exporter table for one product ──────────────────────────── */
  function tableFor(prod) {
    var rows = [], seen = {}, floor5 = prod.top[4][1];
    prod.top.forEach(function (t) { rows.push({ i: t[0], v: t[1], exact: true }); seen[t[0]] = 1; });

    var extra = {};
    TRADE_C.forEach(function (c) {                       // (a) composition
      if (seen[c.i]) return;
      for (var k = 0; k < c.items.length; k++) {
        if (c.items[k].name === prod.name) { extra[c.i] = c.items[k].share * c.total; return; }
      }
    });
    Object.keys(RCA).forEach(function (iso) {            // (b) RCA inversion
      if (seen[iso] || extra[iso] !== undefined || !TOTALS[iso] || !prod.world || !WORLD) return;
      RCA[iso].forEach(function (p) {
        if (p.name === prod.name) extra[iso] = p.rca * TOTALS[iso] * prod.world / WORLD;
      });
    });

    Object.keys(extra).map(function (i) { return { i: i, v: extra[i], exact: false }; })
      // A reconstructed value can never outrank the authoritative five. (On the
      // shipped data this never fires — it is a guard, not a fudge.)
      .filter(function (r) { return r.v > 0 && r.v < floor5; })
      .sort(function (a, b) { return b.v - a.v; })
      .forEach(function (r) { rows.push(r); });

    rows.forEach(function (r, k) { r.rank = k + 1; });
    return rows;
  }

  function prodFor(dayN) { return PRODUCTS[A.dailyIndex(ID, dayN, PRODUCTS.length)]; }

  /* ── state — declared BEFORE anything that closes over it runs ──────────── */
  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var prod = null, table = null, byIso = {}, T5SUM = 0, TRUE5 = [];
  var picks = [], over = false, busy = false, instant = false, t0 = Date.now();
  var main, picker, slots, pctEl, cupEl, trackEl, leftEl, timers = [];

  /* ── par: how obvious is today's product? ───────────────────────────────── */
  A.setPar(ID, function (dayN) {
    var p = (dayN === A.PRACTICE) ? prod : prodFor(dayN);
    if (!p) return null;
    var sum = 0, tot = 0, m = {};
    p.top.forEach(function (t) { m[t[0]] = t[1]; tot += t[1]; });
    NAIVE.forEach(function (i) { sum += m[i] || 0; });
    return tot ? 50 + (50 * sum / tot) : null;
  });

  function chooseProduct() {
    if (practice) return A.pick(A.rng(String(Date.now()) + Math.random()), PRODUCTS);
    return prodFor(day);
  }

  /* ── boot ───────────────────────────────────────────────────────────────── */
  main = A.mount({
    id: ID, dayN: day,
    help: "<p>One product a day. Name the <b>five countries that export the most of it</b>.</p>" +
      "<p>Every pick scores what it is actually worth: <i>that country's exports of the product, " +
      "divided by the true top five added together</i>. So a near-miss still banks points, and " +
      "one huge exporter can be worth more than four small ones.</p>" +
      "<ul><li><b>No undo, no skip, no duplicates.</b> Five picks and it's over.</li>" +
      "<li>Each pick shows its <b>true world rank</b> straight away — " +
      "<b class='ok'>green</b> = top five, <b style='color:var(--near)'>yellow</b> = ranked but lower, " +
      "<b style='color:var(--bad)'>red</b> = outside the ranked table. Use it: later picks are informed.</li>" +
      "<li>Trophies at <b>50%</b> 🥉, <b>75%</b> 🥈, <b>90%</b> 🥇 — and 🏅 for the exact five.</li>" +
      "<li>You're told <b>how many countries export it</b>, which the original never does.</li>" +
      "<li>Every top-five country you name gets <b>stamped in your passport</b>.</li>" +
      "<li>Type freely — <i>USA</i>, <i>Holland</i>, <i>Persia</i> and <i>Burma</i> all work.</li></ul>" +
      "<p class='tiny muted'>Values are 2023 CEPII BACI (HS6 Rev. 1992) via the OEC, in USD FOB. " +
      "Ranks 1–5 are exact; ranks below that are reconstructed from the same file, so the table is " +
      "deep but not infinite — a country it doesn't cover scores zero.</p>",
  });

  if (!PRODUCTS.length) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">Trade data hasn\'t loaded. ' +
      "Check core/data/trade.js (needs AD_TRADE.top5).</p>";
    return;
  }

  prod = chooseProduct();
  table = tableFor(prod);
  byIso = {};
  table.forEach(function (r) { byIso[r.i] = r; });
  TRUE5 = prod.top.map(function (t) { return t[0]; });
  T5SUM = prod.top.reduce(function (a, t) { return a + t[1]; }, 0);

  var sec = SECTIONS[prod.colour] || {};
  var banner = A.el("div", "ac-card");
  banner.id = "prod";
  banner.innerHTML =
    '<div class="sec"><i></i>' + A.esc((sec.name || "TRADED GOODS").toUpperCase()) +
    " · HS4 " + A.esc(prod.hs4) + "</div>" +
    "<h2" + (prod.name.length > 30 ? ' class="long"' : "") + ">" + A.esc(prod.name) + "</h2>" +
    '<div class="meta"><b>' + usd(prod.world) + "</b> traded worldwide in " + YEAR +
    " · <b>" + prod.n + "</b> countries export it</div>";
  if (sec.colour) {
    banner.style.setProperty("--pcol", sec.colour);
    banner.style.setProperty("--pglow", sec.colour + "26");
  }
  main.appendChild(banner);

  var box = A.el("div");
  box.id = "scorebox";
  box.innerHTML =
    '<div class="pctline"><span class="cup" id="cup">🏆</span>' +
    '<span class="pct" id="pct">0.0<small>%</small></span></div>' +
    '<div id="track"></div>';
  main.appendChild(box);

  pctEl = box.querySelector("#pct");
  cupEl = box.querySelector("#cup");
  trackEl = box.querySelector("#track");
  for (var s = 0; s < PICKS; s++) {
    var seg = A.el("i", "seg");
    seg.style.background = "var(" + SEG[s] + ")";
    trackEl.appendChild(seg);
  }
  var ticks = A.el("div");
  ticks.id = "ticks";
  ticks.innerHTML = TIERS.slice().reverse().map(function (t) {
    return '<b style="left:' + t.at + '%"><span>' + t.cup + "</span></b>";
  }).join("");
  trackEl.appendChild(ticks);

  slots = A.el("ol");
  slots.id = "slots";
  main.appendChild(slots);

  var pickHost = A.el("div");
  pickHost.id = "pickhost";
  main.appendChild(pickHost);
  picker = A.picker(pickHost, {
    onPick: commit, unOnly: false, max: 7,
    placeholder: "name an exporter…",
  });

  leftEl = A.el("div");
  leftEl.id = "left";
  main.appendChild(leftEl);

  var row = A.el("div", "ac-row");
  row.style.marginTop = "12px";
  row.innerHTML = practice
    ? '<a class="ac-pill" href="./">← TODAY\'S PRODUCT</a>'
    : '<a class="ac-pill" href="?practice=1">∞ PRACTICE</a>';
  main.appendChild(row);

  var whyEl = A.el("div");
  whyEl.id = "why";
  whyEl.style.display = "none";
  main.appendChild(whyEl);

  var credit = A.el("p", "ac-credit",
    "2023 trade values · CEPII BACI (HS6 Rev. 1992) via the OEC · USD FOB");
  main.appendChild(credit);

  if (A.settings().reduceMotion) document.body.classList.add("rm");

  restore();

  /* ── play ───────────────────────────────────────────────────────────────── */

  function commit(iso) {
    if (over || busy) return false;
    if (picks.indexOf(iso) >= 0) { A.toast("Already picked that one", true); return false; }
    if (picks.length >= PICKS) return false;

    picks.push(iso);
    save();                                   // saved BEFORE the animation, so a
    picker.setExclude(picks.slice());         // reload mid-reveal loses nothing
    render(picks.length - 1);
    return true;
  }

  // Render every slot; `animate` is the index of the row to reveal theatrically.
  function render(animate) {
    slots.innerHTML = "";
    var cb = A.settings().colourblind, settle = null;
    for (var k = 0; k < PICKS; k++) {
      var li = A.el("li");
      if (cb) li.className = "cb";
      if (k >= picks.length) {
        li.className = (cb ? "cb " : "") + "empty";
        li.innerHTML = '<span class="num">' + (k + 1) + '</span><span class="nm">— EMPTY —</span>';
        slots.appendChild(li);
        continue;
      }
      var iso = picks[k], r = byIso[iso];
      var v = r ? r.v : 0;
      var share = T5SUM ? 100 * v / T5SUM : 0;
      var cls = !r ? "out" : r.rank <= 5 ? "top" : "mid";
      var badge = r ? "#" + r.rank : "—";
      li.innerHTML =
        '<span class="num" style="background:var(' + SEG[k] + ')">' + (k + 1) + "</span>" +
        '<span class="nm">' + flagImg(iso) + "<span class='t'></span></span>" +
        '<span class="sub"></span>' +
        '<span class="rk ' + cls + '">' + badge + "</span>";
      var nameEl = li.querySelector(".t"), subEl = li.querySelector(".sub"), rkEl = li.querySelector(".rk");
      var full = cname(iso);
      var sub = r
        ? usd(v) + " · " + pc(share, 1) + " of the top five"
        : "outside the ranked table · 0 points";

      if (k === animate && !instant && !A.settings().reduceMotion && !document.hidden) {
        typeOut(nameEl, full, function (n, sb, rk, subTxt, val) {
          return function () {
            countUp(sb, val, subTxt, function () {
              rk.classList.add("in");
              A.sfx(cls === "top" ? "ok" : cls === "mid" ? "near" : "miss", 2);
              afterReveal();
            });
          };
        }(nameEl, subEl, rkEl, sub, v));
        busy = true;
        picker.disable(true);
      } else {
        nameEl.textContent = full;
        subEl.textContent = sub;
        rkEl.classList.add("in");
        if (k === animate) { A.sfx(cls === "top" ? "ok" : cls === "mid" ? "near" : "miss", 2); afterReveal(); }
      }
      slots.appendChild(li);
    }
    paintScore(animate !== undefined && animate !== null);
    paintLeft();
  }

  function afterReveal() {
    busy = false;
    if (picks.length >= PICKS) { end(); return; }
    picker.disable(false);
    picker.focus();
  }

  function scorePct() {
    var sum = 0;
    picks.forEach(function (i) { if (byIso[i]) sum += byIso[i].v; });
    return T5SUM ? Math.min(100, 100 * sum / T5SUM) : 0;
  }

  function tierFor(p) {
    for (var i = 0; i < TIERS.length; i++) if (p >= TIERS[i].at) return TIERS[i];
    return null;
  }
  function perfect() {
    if (picks.length < PICKS) return false;
    for (var i = 0; i < PICKS; i++) if (TRUE5.indexOf(picks[i]) < 0) return false;
    return true;
  }

  function paintScore(animatePct) {
    for (var k = 0; k < PICKS; k++) {
      var r = picks[k] ? byIso[picks[k]] : null;
      var w = r && T5SUM ? 100 * r.v / T5SUM : 0;
      // A 0-point pick still gets a sliver, so you can see it was spent.
      trackEl.children[k].style.width = (picks[k] ? Math.max(0.6, w) : 0) + "%";
    }
    var p = scorePct();
    var t = perfect() ? { cup: "🏅" } : tierFor(p);
    cupEl.textContent = t ? t.cup : "🏆";
    cupEl.className = "cup" + (t ? " on" : "");
    if (animatePct && !instant && !A.settings().reduceMotion && !document.hidden) tweenPct(p);
    else setPct(p);
  }
  function setPct(p) { pctEl.innerHTML = A.esc(p.toFixed(1)) + "<small>%</small>"; }

  function paintLeft() {
    if (over) { leftEl.textContent = ""; return; }
    var n = PICKS - picks.length;
    leftEl.textContent = n === PICKS ? "FIVE PICKS · NO UNDO"
      : n + " PICK" + (n === 1 ? "" : "S") + " LEFT";
  }

  /* ── animation helpers (setTimeout/setInterval only — requestAnimationFrame
        is paused in a background tab and would strand the reveal) ─────────── */

  function every(ms, fn) { var h = setInterval(fn, ms); timers.push(h); return h; }
  function stop(h) { clearInterval(h); }

  function typeOut(el, text, done) {
    var i = 0;
    var h = every(24, function () {
      i = Math.min(text.length, i + 1);
      el.textContent = text.slice(0, i);
      if (i % 2 === 0) A.sfx("type");
      if (i >= text.length) { stop(h); done(); }
    });
  }

  function countUp(el, value, finalText, done) {
    var start = Date.now(), dur = 420;
    var h = every(33, function () {
      var k = Math.min(1, (Date.now() - start) / dur);
      el.textContent = usd(value * k) + " · …";
      if (k >= 1) { stop(h); el.textContent = finalText; done(); }
    });
  }

  function tweenPct(target) {
    var from = parseFloat(pctEl.textContent) || 0, start = Date.now(), dur = 900;
    if (tweenPct._h) stop(tweenPct._h);
    tweenPct._h = every(40, function () {
      var k = Math.min(1, (Date.now() - start) / dur);
      setPct(from + (target - from) * (1 - Math.pow(1 - k, 3)));
      if (k >= 1) { stop(tweenPct._h); tweenPct._h = null; setPct(target); }
    });
  }

  /* ── the one line the original never gives you ──────────────────────────── */
  // Everything here is read off the shipped data. If a clause isn't derivable
  // it is simply left out — nothing is invented.
  function whyLine() {
    var v1 = prod.top[0][1], v2 = prod.top[1][1], c1 = prod.top[0][0];
    if (!prod.world || !v1) return "";
    var wshare = 100 * v1 / prod.world;
    var out = "<b>" + A.esc(cname(c1)) + "</b> alone is <b>" + pc(wshare, 0) +
      "</b> of world exports of " + A.esc(prod.name.toLowerCase()) + " — ";
    out += (v2 && v1 / v2 >= 1.15)
      ? "<b>" + (v1 / v2).toFixed(1) + "×</b> the next biggest (" + A.esc(cname(prod.top[1][0])) + ")."
      : "barely ahead of " + A.esc(cname(prod.top[1][0])) + ".";

    var selfShare = null, rca = null, i;
    var cc = null;
    for (i = 0; i < TRADE_C.length; i++) if (TRADE_C[i].i === c1) { cc = TRADE_C[i]; break; }
    if (cc) {
      for (i = 0; i < cc.items.length; i++) {
        if (cc.items[i].name === prod.name) { selfShare = 100 * cc.items[i].share; break; }
      }
    }
    if (RCA[c1]) {
      for (i = 0; i < RCA[c1].length; i++) if (RCA[c1][i].name === prod.name) { rca = RCA[c1][i].rca; break; }
    }
    if (selfShare !== null) {
      out += " It's " + pc(selfShare, 1) + " of everything " + A.esc(cname(c1)) + " sells abroad.";
    } else if (rca !== null && rca >= 2) {
      out += " " + A.esc(cname(c1)) + " sells <b>" + (rca < 10 ? rca.toFixed(1) : Math.round(rca)) +
        "×</b> more of it than its overall size in world trade would predict.";
    }
    return out;
  }

  /* ── persistence ────────────────────────────────────────────────────────── */

  function save() {
    if (practice) return;
    var st = A.load(ID, day);
    if (st && st.done) return;                 // finished days are immutable
    A.save(ID, day, { picks: picks, hs4: prod.hs4 });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st && st.hs4 && st.hs4 !== prod.hs4) st = null;   // different product, different game
    if (st && st.picks) picks = st.picks.filter(function (i) { return typeof i === "string"; }).slice(0, PICKS);
    picker.setExclude(picks.slice());
    render(null);
    if (st && st.done) {
      over = true;
      picker.disable(true);
      showWhy();
      paintLeft();
      setTimeout(function () { sheet(st.norm, st.won, st.shareGrid, st.detail); }, 240);
    } else if (picks.length >= PICKS) {
      end();                                    // crashed after the 5th pick, before finish
    }
  }

  function showWhy() {
    var w = whyLine();
    if (!w) return;
    whyEl.innerHTML = w;
    whyEl.style.display = "";
  }

  /* ── ending ─────────────────────────────────────────────────────────────── */

  function end() {
    if (over) return;
    over = true;
    busy = false;
    picker.disable(true);
    paintLeft();

    var p = scorePct();
    var norm = A.clamp(Math.round(p), 5, 100);
    var won = p >= 50;
    var hits = picks.filter(function (i) { return byIso[i] && byIso[i].rank <= 5; }).length;
    var cb = A.settings().colourblind;
    var dots = picks.map(function (i) {
      var r = byIso[i];
      if (!r) return "🔴";
      if (r.rank <= 5) return cb ? "🟦" : "🟢";
      return cb ? "🟧" : "🟡";
    });
    var t = perfect() ? { cup: "🏅" } : tierFor(p);
    var grid = [
      "🏭 " + prod.name,
      dots.join(" ") + "  " + hits + "/5",
      (t ? t.cup + " " : "") + p.toFixed(1) + "% of the top five",
    ];
    var detail = p.toFixed(1) + "% · " + hits + "/5";
    var bucket = p >= 90 ? "90+" : p >= 75 ? "75-89" : p >= 50 ? "50-74" : "0-49";
    var stamps = picks.filter(function (i) { return byIso[i] && byIso[i].rank <= 5; });

    if (!practice) {
      A.finish(ID, day, {
        score: Math.round(p * 10) / 10, norm: norm, won: won, detail: detail,
        bucket: bucket, shareGrid: grid, stamps: stamps, durationMs: Date.now() - t0,
      });
    } else {
      stamps.forEach(function (i) { A.stamp(i, ID); });
    }

    showWhy();
    if (perfect()) { A.sfx("perfect"); A.confetti(160); }
    else if (won) { A.sfx("win"); A.confetti(p >= 90 ? 120 : 70); }
    else A.sfx("lose");

    setTimeout(function () { sheet(norm, won, grid, detail); }, 620);
  }

  function sheet(norm, won, grid, detail) {
    var p = scorePct(), t = perfect() ? { cup: "🏅", word: "PERFECT" } : tierFor(p);
    var extra = "";

    var w = whyLine();
    if (w) extra += '<p class="tiny" style="color:var(--amber);line-height:1.7;' +
      'margin:var(--sp-3) 0 0;text-align:center">' + w + "</p>";

    extra += '<p class="p5head">THE REAL TOP FIVE · ' + A.esc(prod.name.toUpperCase()) + "</p>";
    extra += '<div class="p5wrap"><table class="p5tab"><tr><th></th><th>country</th>' +
      '<th style="text-align:right">exports</th><th style="text-align:right">share</th></tr>';
    prod.top.forEach(function (tp, k) {
      var got = picks.indexOf(tp[0]) >= 0;
      extra += '<tr class="' + (got ? "got" : "") + '"><td class="r">' + (k + 1) + '</td><td class="c">' +
        flagImg(tp[0]) + A.esc(cname(tp[0])) + (got ? " ✓" : "") + '</td><td class="n">' + usd(tp[1]) +
        '</td><td class="n">' + pc(100 * tp[1] / T5SUM, 1) + "</td></tr>";
    });
    extra += "</table></div>";

    extra += '<p class="p5head">YOUR FIVE</p>';
    extra += '<div class="p5wrap"><table class="p5tab"><tr><th></th><th>country</th>' +
      '<th style="text-align:right">exports</th><th style="text-align:right">scored</th></tr>';
    picks.forEach(function (iso, k) {
      var r = byIso[iso];
      extra += '<tr class="' + (r && r.rank <= 5 ? "got" : "") + '"><td class="r">' + (k + 1) + '</td><td class="c">' +
        flagImg(iso) + A.esc(cname(iso)) +
        ' <span class="dim">' + (r ? "#" + r.rank : "unranked") + "</span></td>" +
        '<td class="n">' + (r ? usd(r.v) : "—") + '</td><td class="n">' +
        (r ? pc(100 * r.v / T5SUM, 1) : "0.0%") + "</td></tr>";
    });
    extra += "</table></div>";

    extra += '<p class="tiny dim" style="margin-top:var(--sp-2);line-height:1.6">' +
      prod.n + " countries exported " + A.esc(prod.name.toLowerCase()) + " in " + YEAR +
      ". Ranks 1–5 here are exact; this build ranks <b>" + table.length +
      "</b> of them, and anything below that scores zero — it is outside our table, " +
      "not necessarily outside the trade.</p>";

    var stamped = picks.filter(function (i) { return byIso[i] && byIso[i].rank <= 5; });
    if (stamped.length) extra += '<p class="center tiny" style="color:var(--green);' +
      'margin-top:var(--sp-2)">' + stamped.map(function (i) { return A.esc(cname(i)); }).join(", ") +
      " stamped in your passport</p>";

    A.results(ID, practice ? A.PRACTICE : day, {
      title: perfect() ? "THE EXACT FIVE" : p >= 90 ? "GOLD" : p >= 75 ? "SILVER"
        : p >= 50 ? "BRONZE" : "NO TROPHY TODAY",
      lines: [t ? "you took home " + (t.word || "a medal") : "you needed 50% for a bronze"],
      extraHTML: extra,
      state: { norm: norm, shareGrid: grid, won: won },
      shareText: "PICK 5 (practice) · " + detail + "\n" + (grid || []).join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  /* ── debug hook — enough to play a whole game headlessly ────────────────── */
  window.__P5 = {
    product: function () {
      return { hs4: prod.hs4, name: prod.name, n: prod.n, world: prod.world, top5Total: T5SUM };
    },
    top5: function () { return TRUE5.slice(); },
    table: function () { return table.map(function (r) { return { iso: r.i, rank: r.rank, v: r.v, exact: !!r.exact }; }); },
    // Turn off the staged reveal so picks resolve synchronously — use this first.
    fast: function (on) { instant = on !== false; return instant; },
    pick: commit,
    play: function (list) {
      instant = true;
      var ok = 0;
      (list || []).forEach(function (i) { if (commit(i)) ok++; });
      return ok;
    },
    solve: function () { return this.play(TRUE5.slice()); },
    why: whyLine,
    state: function () {
      return {
        day: day, practice: practice, picks: picks.slice(), over: over, busy: busy,
        pct: scorePct(), norm: A.clamp(Math.round(scorePct()), 5, 100),
        perfect: perfect(), tableDepth: table.length, pool: PRODUCTS.length,
      };
    },
  };
})();
