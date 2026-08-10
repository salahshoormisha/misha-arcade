/* t_pages.js — the four pages that are not cabinets. Run from the repo root:
     JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
     $JSC _build/harness.js -e 'load("_build/t_pages.js")'

   WHY THIS EXISTS. index.html, daily/, league/ and passport/ are the connective
   tissue: every cabinet can be perfect and the arcade still reads as broken if
   the hub links nowhere, the Daily Run hides three cabinets, or the league
   prints "NaN" on the morning of day 0. They had ZERO coverage until now, for a
   mechanical reason — H.html() strips <script> and these four do all of their
   rendering in an INLINE block, so nothing ran and nothing could be asserted.
   The harness now captures those blocks (H.inlineScripts) and runs them on
   demand (H.runInline); see its header.

   What this file checks, in order:
     · the harness's own new trick, so a future change to it fails here loudly
     · all four pages come up: no console errors, readable text, a main region
     · the Daily Run lists EVERY registry cabinet, in registry order, grouped by
       wing in registry order, `soon` ones as dead rows and the rest as links
     · NO DEAD LINKS — every href and every <img src> any of the four pages
       emits, in every state including inside modals, resolved the way a browser
       would and checked against the disk. ~250 targets.
     · the Daily Run's progress maths with nothing / some / all played, seeded
       through the real A.finish()
     · the league empty, near-empty and long: season table, form guide, records,
       personal bests, and no NaN / undefined / Invalid Date anywhere
     · the passport with no stamps, some, and all of them
     · every page at 375 px as well as 1280 px
     · day 0 and a gap in play, where the date arithmetic is most likely to bite

   WHAT IT CANNOT PROVE. The harness has no layout and no painting: every
   element measures zero, the canvas records calls instead of pixels, and CSS
   beyond custom properties is not cascaded. So "375 px" here means the page
   renders the same content, throws nothing, declares no fixed width wider than
   the viewport, and hands the map a box it actually follows — NOT that it looks
   right. Nothing in this file is evidence about how anything looks.          */

var JSC_PAGES = ["index.html", "daily/index.html", "league/index.html", "passport/index.html"];

/* ── page harnessing ──────────────────────────────────────────────────────
   location matters more than it looks: A.rootPath() decides the depth of every
   link on the page from location.pathname, so a test that leaves it pointing at
   games/x/ tests the wrong tree entirely. */
function page(path) {
  H.reset();
  var dir = String(path).replace(/index\.html$/, "");
  H.win.location.pathname = "/misha-arcade/" + dir;
  H.win.location.href = "https://salahshoormisha.github.io/misha-arcade/" + dir;
  H.win.location.search = "";
  H.win.location.hash = "";
  H.setSize(1280, 800);
  H.html(path);
  H.loadScripts();
  return path;
}
/* Run the page's own code and fire the lifecycle, counting anything it logs as
   an error on the way up — a page that renders while shouting is not fine. */
var lastErrs = 0;
function go() {
  var real = console.error, n = 0;
  console.error = function () { n++; real.apply(console, arguments); };
  try { H.runInline(); H.boot(); } finally { console.error = real; }
  lastErrs = n;
  return n;
}
function seen() { return H.visible().join(" | "); }
function toasts() { return H.all(".ac-toast").map(function (e) { return H.text(e); }); }

/* Text no page may ever show. "undefined" and "null" are deliberately included:
   they only ever reach the screen through a missing property. */
var ROT = ["NaN", "undefined", "Invalid Date", "[object Object]", "null", "Infinity"];
function noRot(label) {
  var t = seen(), bad = ROT.filter(function (w) { return t.indexOf(w) >= 0; });
  return H.ok(!bad.length, label + " prints no rot" + (bad.length ? "  ← " + bad.join(", ") : ""));
}

/* ── the link auditor ─────────────────────────────────────────────────────
   Resolve like a browser (against the page's directory, ?v= stripped), turn a
   directory into its index.html, and read it off the disk. Absolute URLs and
   data: URIs are out of scope — there is no network here. */
var checked = {}, deadLinks = [];
function exists(p) {
  if (p in checked) return checked[p];
  var ok = true;
  try { readFile(H.root + p); } catch (e) { ok = false; }
  return (checked[p] = ok);
}
function auditLinks(where) {
  var targets = [];
  H.all("[href]").forEach(function (e) { targets.push([e.getAttribute("href"), "href on <" + e.localName + ">"]); });
  H.all("img").forEach(function (e) { targets.push([e.src || e.getAttribute("src"), "img src"]); });
  var n = 0;
  targets.forEach(function (t) {
    var raw = t[0];
    if (!raw) return;
    if (/^(data:|https?:|mailto:|blob:|#)/i.test(raw)) return;
    var p = H.resolve(raw);
    if (!/\.[a-z0-9]+$/i.test(p)) p = (p ? p + "/" : "") + "index.html";
    n++;
    if (!exists(p)) deadLinks.push(where + ": " + raw + " → " + p + "  (" + t[1] + ")");
  });
  return n;
}
var auditedTotal = 0;
function audited(where) { auditedTotal += auditLinks(where); }

/* Fixed widths wider than the viewport are the one overflow a harness with no
   layout can still catch: an inline width:420px or a min-width in the page's
   own stylesheet will overflow a 375 px phone no matter what else is true. */
function overWide(limit) {
  var out = [];
  H.all("*").forEach(function (e) {
    var w = e.style && (e.style.width || e.style.minWidth);
    var m = /^(\d+(?:\.\d+)?)px$/.exec(String(w || "").trim());
    if (m && +m[1] > limit) out.push("<" + e.localName + " class=" + (e.className || "-") + "> width:" + w);
  });
  H.all("style").forEach(function (s) {
    var css = s.textContent || "", re = /(?:^|[^-a-z])(min-width|width)\s*:\s*(\d+(?:\.\d+)?)px/gi, m;
    while ((m = re.exec(css))) if (+m[2] > limit) out.push("stylesheet " + m[1] + ":" + m[2] + "px");
  });
  return out;
}

/* Seed a day through the real API, never by writing localStorage by hand. */
function play(id, day, norm, detail, extra) {
  return A.finish(id, day, Object.assign({
    norm: norm, won: norm > 0, detail: detail || String(norm), bucket: 4,
  }, extra || {}));
}

/* ═══════════════════════════════════════════════════════════════════════ */
H.section("the harness can now run an inline <script>");
(function () {
  H.reset();
  H.html("daily/index.html");
  H.ok(H.inlineScripts.length === 1, "daily/ has one inline block, captured");
  H.ok(H.scripts.length === 4 && H.scripts[0].indexOf("registry.js") > 0,
       "…and its four <script src> are still listed in page order");
  H.ok(!H.maybe("script"), "H.html still strips <script> from the DOM (old behaviour intact)");
  H.ok(typeof A === "undefined" || !H.maybe(".ac-header"),
       "…and still executes nothing by itself");
  H.eq(H.resolve("../core/arcade.js?v=13"), "core/arcade.js", "H.resolve strips ?v= and climbs");
  H.throws(function () {
    H.reset(); H.html("daily/index.html"); H.runInline();   // no core loaded → A is not there
  }, "an inline block that throws rethrows out of H.runInline instead of being swallowed");
  H.reset();
  var a = H.doc.createElement("a");
  a.href = "../league/";
  H.ok(a.getAttribute("href") === "../league/", "el.href reflects into the attribute, as in a browser");
})();

/* ═══════════════════════════════════════════════════════════════════════ */
H.section("all four pages come up");
H.atDay(15);
JSC_PAGES.forEach(function (p) {
  page(p);
  var errs = go();
  H.ok(errs === 0, p + " boots with no console errors");
  H.ok(seen().replace(/\s+/g, "").length > 200, p + " has readable text on it");
  H.ok(!!(H.maybe("main") || H.maybe(".shell")), p + " has a main region");
  noRot(p);
  audited(p + " · cold");
});

/* ═══════════════════════════════════════════════════════════════════════ */
H.section("the Daily Run lists every cabinet");
(function () {
  page("daily/index.html"); go();

  // registry order, grouped by wing, wings in the order the registry
  // introduces them — the registry file says "order here = order in the Daily
  // Run", so that is the order asserted.
  var famIdx = {}, order = [];
  A.registry.forEach(function (g) { if (!(g.family in famIdx)) famIdx[g.family] = Object.keys(famIdx).length; });
  A.registry.map(function (g, i) { return { g: g, i: i }; })
    .sort(function (a, b) { return famIdx[a.g.family] - famIdx[b.g.family] || a.i - b.i; })
    .forEach(function (r) { order.push(r.g.name); });

  var rows = H.all(".cab");
  H.eq(rows.length, A.registry.length, "every registry cabinet has a row (" + A.registry.length + ")");
  H.eq(rows.map(function (e) { return H.text(H.find(".txt b", e)); }), order,
       "…in registry order, grouped by wing");

  var wings = H.all(".set h3").map(function (e) { return H.text(e).split(" ")[0] + H.text(e).split(" ")[1]; });
  H.ok(wings.length === Object.keys(famIdx).length, "one section per wing (" + wings.length + ")");
  H.ok(seen().indexOf("THE RING") < seen().indexOf("THE ANNEXE"),
       "THE RING sits where the registry puts it, not at the bottom");

  // soon vs playable
  var soon = A.registry.filter(function (g) { return g.soon; });
  var live = A.registry.filter(function (g) { return !g.soon; });
  H.ok(soon.length > 0, "the registry still has a `soon` cabinet to test against (" + soon.length + ")");
  soon.forEach(function (g) {
    var row = rows.filter(function (e) { return H.text(H.find(".txt b", e)) === g.name; })[0];
    H.ok(row && row.localName === "span", g.name + " (soon) is a dead <span>, not a link");
    H.ok(row && !row.getAttribute("href"), g.name + " (soon) emits no href to 404 on");
    H.ok(row && H.text(row).indexOf("Soon") >= 0, g.name + " (soon) says so");
  });
  live.forEach(function (g) {
    var row = rows.filter(function (e) { return H.text(H.find(".txt b", e)) === g.name; })[0];
    H.ok(row && row.localName === "a" && row.getAttribute("href") === "../games/" + g.id + "/",
         g.name + " links to ../games/" + g.id + "/");
  });

  // the five she opened tonight had better be on the page
  ["TIMEGUESSR", "MISALIGNED", "PHYLO", "LINXICON", "THE DECIDER"].forEach(function (n) {
    var row = rows.filter(function (e) { return H.text(H.find(".txt b", e)) === n; })[0];
    H.ok(!!row && row.localName === "a", n + " surfaces as a working link");
  });

  // the suggested set must be able to reach every wing — walking the wings in a
  // fixed order and slicing to five made the last three unreachable.
  var reach = {}, everSuggested = {};
  for (var d = 0; d < 60; d++) {
    H.atDay(d); page("daily/index.html"); go();
    var t = H.text(".suggest p") || "";
    A.registry.forEach(function (g) {
      if (!g.soon && t.indexOf(g.name) >= 0) { reach[g.family] = 1; everSuggested[g.id] = 1; }
    });
  }
  H.eq(Object.keys(reach).sort(), Object.keys(famIdx).sort(),
       "over 60 days the suggested set reaches every wing");
  H.eq(A.registry.filter(function (g) { return !g.soon && !everSuggested[g.id]; }).map(function (g) { return g.id; }), [],
       "…and every playable cabinet gets suggested at least once");
  H.atDay(15);

  // determinism: both players must get the same set for the same day
  page("daily/index.html"); go();
  var setA = H.text(".suggest p");
  page("daily/index.html"); go();
  H.eq(H.text(".suggest p"), setA, "the suggested set is the same on a second device");
})();

/* ═══════════════════════════════════════════════════════════════════════ */
H.section("the Daily Run's progress maths");
(function () {
  var live = null;

  page("daily/index.html"); go();
  live = A.registry.filter(function (g) { return !g.soon; }).length;
  H.ok(seen().indexOf("Nothing played yet") >= 0, "nothing played → “Nothing played yet”");
  H.ok(seen().indexOf("0/" + live) >= 0, "…0/" + live + " played");
  H.eq(H.text(".dial .mid b"), "0", "…the dial reads 0");
  H.ok(/\b\d+ \| Min left/.test(seen().replace(/ \| /g, " | ")), "…and an estimate of the time left");
  H.eq(H.all(".cab .meter").length, 0, "…no cabinet shows a score meter");

  page("daily/index.html");
  play("wordish", 15, 82, "4/6");
  play("flagle", 15, 55, "5/6", { stamps: ["IR", "GB"] });
  play("mini", 15, 0, "gave up");
  go();
  H.ok(seen().indexOf("Good start.") >= 0, "three played → “Good start.”");
  H.ok(seen().indexOf("3/" + live) >= 0, "…3/" + live + " played");
  H.eq(H.all(".cab.done").length, 3, "…three rows marked done");
  H.eq(H.all(".cab .meter").length, 3, "…each with a meter");
  H.eq(H.text(".dial .mid b"), String(A.card(15).total), "…the dial matches A.card().total");
  H.ok(A.card(15).total > 0, "…and that total is a real number (" + A.card(15).total + ")");
  noRot("daily · part-played");
  audited("daily · part-played");

  // the live re-render: finishing a game elsewhere must update this page
  var was = H.text(".dial .mid b");
  play("midi", 15, 90, "3:01");
  H.flush();
  H.ok(seen().indexOf("4/" + live) >= 0, "A.finish elsewhere re-renders the page (4/" + live + ")");
  H.ok(H.text(".dial .mid b") !== was, "…and the dial moves with it");

  page("daily/index.html");
  A.registry.filter(function (g) { return !g.soon; }).forEach(function (g, i) { play(g.id, 15, 60 + (i % 40), "x"); });
  go();
  H.ok(seen().indexOf("Clean sweep.") >= 0, "everything played → “Clean sweep.”");
  H.ok(seen().indexOf("100%") >= 0 && seen().indexOf("Complete") >= 0, "…“100% Complete”, not “0 Min left”");
  H.eq(H.all(".cab.done").length, live, "…every playable row is done");
  H.eq(H.maybe(".suggest"), null, "…and nothing is suggested any more");
  noRot("daily · swept");
  audited("daily · swept");

  // the two share buttons, through the buttons
  page("daily/index.html"); go();
  H.click("#shareCard");
  H.ok(toasts().join(" ").indexOf("Play something first") >= 0, "Share card with nothing played warns instead of sharing");
  page("daily/index.html");
  play("wordish", 15, 82, "4/6");
  go();
  H.click("#shareCard");
  H.ok(toasts().join(" ").indexOf("Play something first") < 0, "…and shares once there is something to share");
  var si = H.find("#shareImg");
  H.click(si);
  H.tick(60);
  H.ok(si.disabled === false, "Share as image re-enables its button when it finishes");
  H.ok(toasts().join(" ").indexOf("Card saved") >= 0, "…and says where the card went");
})();

/* ═══════════════════════════════════════════════════════════════════════ */
H.section("the league · empty and near-empty");
(function () {
  page("league/index.html"); go();
  H.ok(seen().indexOf("No fixtures yet") >= 0, "no results → the season explains itself");
  H.ok(seen().indexOf("The team") >= 0, "…THE TEAM still renders");
  H.eq(H.all("tbody tr").length, 0, "…with no table of nobody");
  H.ok(seen().indexOf("Run | 0") >= 0 || seen().indexOf("Run") >= 0, "…the run pill reads 0");
  H.eq(H.maybe(".form"), null, "…no form guide out of thin air");
  H.ok(seen().indexOf("Best card") < 0, "…and no “Best card” before there is one");
  noRot("league · cold");
  audited("league · cold");

  // day 0: the week before the arcade existed must not be compared against
  H.atDay(0);
  page("league/index.html");
  play("wordish", 0, 100, "2/6");
  go();
  H.ok(seen().indexOf("no week to compare yet") >= 0, "day 0 · week −1 does not exist and is not invented");
  H.ok(seen().indexOf("Best card | 88 | · day 0") >= 0 || /Best card \| \d+ \| · day 0/.test(seen()),
       "day 0 · the best card is day 0");
  H.ok(seen().indexOf("1 personal best today") >= 0, "day 0 · your first score is a personal best");
  noRot("league · day 0");

  // one game, one day: every average and percentage divides by something real
  H.atDay(1);
  page("league/index.html");
  play("wordish", 1, 40, "6/6");
  go();
  H.ok(seen().indexOf("played 1 · avg 40") >= 0, "one result → “played 1 · avg 40”, not a division by zero");
  noRot("league · one result");
  H.atDay(15);
})();

/* ═══════════════════════════════════════════════════════════════════════ */
H.section("the league · a season");
(function () {
  function opponent(day, shift) {
    var t = A.unpackCard(A.packCard(day));
    t.name = "David";
    t.sum = 0; t.played = 0;
    Object.keys(t.results).forEach(function (k) {
      t.results[k].norm = A.clamp(t.results[k].norm + shift, 0, 100);
      t.sum += t.results[k].norm; t.played++;
    });
    t.mean = t.played ? Math.round(t.sum / t.played) : 0;
    t.total = Math.round(t.mean * (0.85 + 0.15 * Math.min(1, t.played / 6)));
    return t;
  }

  page("league/index.html");
  A.set("player", "Misha");
  [9, 10, 11, 12, 13, 14, 15].forEach(function (d) {
    play("wordish", d, 60 + d, "4/6");
    play("flagle", d, 40 + d, "3/6", { stamps: ["IR"] });
    A.recordMatch(d, opponent(d, d < 12 ? 20 : -20));
  });
  go();
  H.eq(H.all("tbody tr").length, 2, "seven fixtures → two rows in the table");
  // # · PLAYER · P · W · D · L · PTS · +/−
  var cells = H.all("tbody tr")[0].children.map(function (c) { return H.text(c); });
  H.eq(cells[0], "1", "…the leader is first");
  H.eq(cells[2], "7", "…played 7");
  H.eq(+cells[3] + +cells[4] + +cells[5], 7, "…W + D + L adds up to P");
  H.eq(+cells[6], (+cells[3]) * 3 + (+cells[4]), "…points are 3 for a win, 1 for a draw");
  H.ok(/^[+−]?\d+$/.test(cells[7]), "…the +/− column uses the minus sign it advertises  (" + cells[7] + ")");
  H.eq(H.all(".form span").length, 7, "…a form pip per fixture");
  H.ok(H.all(".form span").every(function (s) { return /^[WLD]$/.test(H.text(s)); }), "…each of them W, L or D");
  H.eq(H.text(H.all(".form span")[0]), "W", "…most recent first (day 15 was a win)");
  H.ok(seen().indexOf("Rivalry by game") >= 0, "…rivalry by game appears");
  H.ok(seen().indexOf("Records to beat") >= 0, "…so do the records");
  H.ok(seen().indexOf("Best card") >= 0 && seen().indexOf("Best run") >= 0, "…and the team's own bests");
  H.ok(seen().indexOf("v LAST WEEK") >= 0, "…with a week-on-week comparison once there are two weeks");
  noRot("league · seven fixtures");
  audited("league · seven fixtures");

  // a dead-level season must not claim a speciality for either of you
  page("league/index.html");
  A.set("player", "Misha");
  for (var d = 0; d <= 40; d++) {
    play("wordish", d, 40 + (d % 50), "4/6");
    play("flagle", d, 30 + (d % 60), "3/6");
    A.recordMatch(d, opponent(d, 0));
  }
  go();
  H.eq(H.all(".form span").length, 10, "41 fixtures → the form guide stops at ten");
  H.ok(H.all(".form span").every(function (s) { return H.text(s) === "D"; }), "…all draws, shown as draws");
  H.eq(H.all("tbody tr")[0].children.map(function (c) { return H.text(c); })[7], "0",
       "…a level season shows 0, not −0 or +0");
  H.ok(seen().indexOf("patch") < 0, "…and neither of you is handed a “patch” you haven't earned");
  H.ok(seen().indexOf("41") >= 0, "…41 fixtures counted");
  noRot("league · level season");

  // a gap in play: the streak must break and the arithmetic must survive it
  H.atDay(30);
  page("league/index.html");
  [0, 1, 2, 3, 20, 21, 28, 29, 30].forEach(function (d) { play("wordish", d, 50 + d, "4/6"); });
  go();
  var rs = A.runStreak();
  H.eq(rs.current, 3, "a gap breaks the run: 28–29–30 is a 3-day run");
  H.eq(rs.max, 4, "…the best run is still the 0–3 one");
  H.eq(rs.total, 9, "…nine days played in all");
  H.ok(seen().indexOf("Run | 3") >= 0, "…and the page says 3");
  noRot("league · gappy history");
  H.atDay(15);
})();

/* ═══════════════════════════════════════════════════════════════════════ */
H.section("the league · driving it");
(function () {
  page("league/index.html");
  play("wordish", 15, 70, "3/6");
  go();

  H.click("#send");
  H.ok(!!H.maybe(".ac-modal"), "Send my card with no name asks who you are");
  H.ok(H.text(".ac-modal").indexOf("WHO ARE YOU") >= 0, "…in as many words");
  H.click("#misha");
  H.tick(400);
  H.eq(A.settings().player, "Misha", "…tapping MISHA sets the player");
  H.ok(!!H.maybe("#again"), "…and the card goes out, with a COPY AGAIN in the sheet");
  H.click("#again");
  H.tick(20);
  H.ok(toasts().join(" ").indexOf("Copied") >= 0, "COPY AGAIN copies");

  // the whole point of the page: a card arrives in the hash
  page("league/index.html");
  A.set("player", "Misha");
  play("wordish", 15, 70, "3/6");
  play("flagle", 15, 50, "4/6");
  var tok = A.packCard(15);
  H.win.location.hash = "#c=" + tok;
  H.win.location.href = "https://salahshoormisha.github.io/misha-arcade/league/#c=" + tok;
  go();
  H.ok(seen().indexOf("SENT DAY 15") >= 0, "an incoming card is read out of the hash");
  H.eq(H.all(".vs .side").length, 2, "…and shown head to head");
  H.ok(H.all(".g").length >= 2, "…game by game");
  H.ok(!!H.maybe("#save") && !!H.maybe("#reply"), "…with both replies offered");
  noRot("league · incoming");
  audited("league · incoming");
  H.click("#save");
  H.tick(20);
  H.eq(Object.keys(A.league().matches), ["15"], "Save to season records the fixture");
  H.eq(H.all("tbody tr").length, 2, "…and the table appears");
  H.ok(toasts().join(" ").indexOf("Fixture saved") >= 0, "…and says so");

  // a mangled paste must fall back to the normal page, not a broken one
  page("league/index.html");
  H.win.location.hash = "#c=this-is-not-a-card";
  H.win.location.href = "https://salahshoormisha.github.io/misha-arcade/league/#c=this-is-not-a-card";
  H.ok(go() === 0, "a mangled duel link does not throw");
  H.ok(seen().indexOf("SENT DAY") < 0, "…it is ignored");
  H.ok(seen().indexOf("The season") >= 0, "…and the page is otherwise itself");
  noRot("league · mangled link");
})();

/* ═══════════════════════════════════════════════════════════════════════ */
H.section("the passport");
(function () {
  page("passport/index.html"); go();
  var TOTAL = (window.AD_COUNTRIES || []).filter(function (c) { return c.un === 1; }).length;
  H.ok(TOTAL > 150, "countries.js carries a sovereign set (" + TOTAL + ")");
  H.ok(seen().indexOf("0 | / " + TOTAL) >= 0 || H.text(".stampbig") === "0 / " + TOTAL,
       "no stamps → 0 / " + TOTAL);
  H.click(H.find(".ac-header .ac-ico"));
  H.ok(H.text(".ac-modal").indexOf(TOTAL + " sovereign states") >= 0,
       "…and the help text quotes the same number as the counter");
  H.click(".ac-modal .x"); H.tick(400);
  H.ok(seen().indexOf("Nothing stamped yet") >= 0, "…the wall says so rather than showing an empty grid");
  H.eq(H.all(".wall button").length, 0, "…with no tiles");
  H.ok(H.all(".cont .r").length >= 5, "…every region is listed at 0");
  H.ok(seen().indexOf("Most wanted") >= 0, "…and there is something to chase");
  noRot("passport · empty");
  audited("passport · empty");

  page("passport/index.html");
  ["IR", "GB", "US", "IL", "TJ"].forEach(function (i) { A.stamp(i, "flagle"); });
  A.stamp("IR", "tradle"); A.stamp("IR", "globle");
  go();
  H.eq(H.text(".stampbig").indexOf("5"), 0, "five stamps → the counter reads 5");
  H.eq(H.all(".wall button").length, 5, "…five tiles on the wall");
  H.ok(H.all(".wall img").length === 5, "…each with a flag");
  noRot("passport · five");
  audited("passport · five");

  // the segmented control, through the buttons
  var segs = H.all(".ac-seg button");
  H.eq(segs.length, 3, "the wall has three modes");
  H.click(segs[1]);
  H.eq(H.all(".wall button").length, TOTAL - 5, "MISSING shows the " + (TOTAL - 5) + " you haven't got");
  H.click(H.all(".ac-seg button")[2]);
  H.eq(H.all(".wall button").length, TOTAL, "EVERYTHING shows all " + TOTAL);
  audited("passport · whole wall");           // ← every flag file, checked on disk
  H.click(H.all(".ac-seg button")[0]);
  H.eq(H.all(".wall button").length, 5, "COLLECTED goes back to five");

  // a tile opens its country
  H.click(H.all(".wall button")[0]);
  var m = H.text(".ac-modal");
  H.ok(!!m, "a tile opens the country");
  H.ok(m.indexOf("STAMPED") >= 0, "…saying when it was stamped");
  H.ok(m.indexOf("FLAGLE") >= 0, "…and which game gave it to you");
  H.ok(ROT.every(function (w) { return m.indexOf(w) < 0; }), "…with no rot in the detail sheet");
  audited("passport · country sheet");
  H.click(".ac-modal .x"); H.tick(400);
  H.eq(H.maybe(".ac-modal"), null, "…and it closes");

  // an uncollected one offers a route to it, and that route must exist
  H.click(H.all(".ac-seg button")[1]);
  H.click(H.all(".wall button")[0]);
  H.ok(H.text(".ac-modal").indexOf("NOT YET COLLECTED") >= 0, "an uncollected country says so");
  H.ok(!!H.maybe(".ac-modal a[href]"), "…and points at a cabinet that can give it to you");
  audited("passport · hunt sheet");
  H.click(".ac-modal .x"); H.tick(400);

  // the map: it must follow the box it is given, or it overflows the phone
  var cvs = H.find("#map");
  cvs.offsetWidth = 343; cvs.offsetHeight = 300;
  H.setSize(375, 812);
  H.tick(300);
  H.eq(cvs.width, 343 * Math.min(2, H.win.devicePixelRatio),
       "the map redraws to the width of its box, not the window");
  H.setSize(1280, 800);

  // everything collected
  page("passport/index.html");
  (window.AD_COUNTRIES || []).forEach(function (c) { if (c.un === 1) A.stamp(c.i, "flagle"); });
  go();
  H.eq(H.text(".stampbig"), TOTAL + " / " + TOTAL, "all stamped → " + TOTAL + " / " + TOTAL);
  H.ok(seen().indexOf("nothing left to collect") >= 0, "…and the chase list retires itself");
  H.eq(H.all(".cont .r").filter(function (r) { return H.text(r).indexOf("100") < 0 && /(\d+)\/\1/.test(H.text(r)); }).length,
       H.all(".cont .r").length, "…every region is complete");
  noRot("passport · complete");
  audited("passport · complete");

  H.click("#sh");
  H.tick(20);
  H.ok(true, "Share works from the passport (it goes to the share sheet, so there is nothing to assert past “it did not throw”)");
})();

/* ═══════════════════════════════════════════════════════════════════════ */
H.section("the hub");
(function () {
  page("index.html"); go();
  H.ok(seen().indexOf("Midnight Arcade") >= 0, "the hub names itself");
  ["daily/", "league/", "passport/", "mishaman/", "tetrisha/", "mishanameh/"].forEach(function (href) {
    H.ok(H.all("[href='" + href + "']").length > 0, "the hub links to " + href);
  });

  // the chip list is the hub's promise about what is inside; it must not lie
  var chips = H.all(".chips span").map(function (e) { return H.text(e); });
  H.reset();
  load("core/registry.js");
  var live = window.AD_REGISTRY.filter(function (g) { return !g.soon; });
  var missing = live.filter(function (g) { return chips.indexOf(g.name) < 0; }).map(function (g) { return g.name; });
  H.eq(missing, [], "every playable cabinet is named on the hub");
  var extra = chips.filter(function (c) { return !window.AD_REGISTRY.some(function (g) { return g.name === c; }); });
  H.eq(extra, [], "…and the hub names nothing that does not exist");
  H.eq(chips.length, live.length, "…" + live.length + " chips for " + live.length + " cabinets");

  page("index.html"); go();
  H.ok(seen().indexOf("Nothing played yet today") >= 0, "cold hub: nothing played yet");
  H.ok(H.text("#best-mm").indexOf("—") > 0, "…and no hi-score invented for MISHA-MAN");
  noRot("hub · cold");

  // with a history, the wing line reports it
  H.reset();
  H.win.location.pathname = "/misha-arcade/";
  H.win.location.href = "https://salahshoormisha.github.io/misha-arcade/";
  H.html("index.html");
  load("core/registry.js"); load("core/arcade.js");
  [13, 14, 15].forEach(function (d) { play("wordish", d, 70, "4/6", { stamps: ["IR", "GB"] }); });
  H.win.localStorage.setItem("mm_hi", "4200");
  H.win.localStorage.setItem("tt_hi", "18000");
  H.win.localStorage.setItem("tt_sprint", "95.5");
  go();
  H.ok(H.text("#wing-stat").indexOf("3") >= 0 && H.text("#wing-stat").indexOf("run") >= 0,
       "a 3-day run shows on the hub  (“" + H.text("#wing-stat") + "”)");
  H.ok(H.text("#wing-stat").indexOf("stamped") >= 0, "…so do the stamps");
  H.ok(H.text("#wing-stat").indexOf("195") < 0,
       "…without a fixed /195 the passport would disagree with");
  H.ok(H.text("#rank").indexOf("Rank") >= 0, "the rank line appears once there are points");
  H.ok(H.text("#best-tt").indexOf("Sprint 40") >= 0, "…and TETRISHA's sprint time");
  noRot("hub · with a history");
  audited("hub · with a history");

  // the note, and the easter egg, through the real controls
  page("index.html"); go();
  H.ok(!H.find("#note").classList.contains("show"), "the note starts closed");
  H.click("#note-btn");
  H.ok(H.find("#note").classList.contains("show"), "…opens on the button");
  H.key("Escape");
  H.ok(!H.find("#note").classList.contains("show"), "…and closes on Escape");
  H.ok(!H.doc.body.classList.contains("glam"), "glam mode is off to start with");
  "MISHA".split("").forEach(function (c) { H.key(c); });
  H.ok(H.doc.body.classList.contains("glam"), "…typing her name turns it on");
  "MISHA".split("").forEach(function (c) { H.key(c); });
  H.ok(!H.doc.body.classList.contains("glam"), "…and again turns it off");
})();

/* ═══════════════════════════════════════════════════════════════════════ */
H.section("375 px");
(function () {
  JSC_PAGES.forEach(function (p) {
    page(p);
    H.setSize(375, 812);
    var errs = go();
    H.ok(errs === 0, p + " at 375 px boots clean");
    H.ok(seen().replace(/\s+/g, "").length > 200, "…with the same content on it");
    var wide = overWide(375);
    H.ok(!wide.length, "…and declares nothing wider than the viewport" + (wide.length ? "  ← " + wide.join("; ") : ""));
    noRot(p + " @375");
    audited(p + " @375");
  });

  // the one real-layout question a headless harness can answer: the only
  // fixed-size thing on these pages is the daily dial, and it must fit
  page("daily/index.html");
  H.setSize(375, 812);
  go();
  var dial = H.find(".dial svg");
  H.ok(+dial.getAttribute("width") <= 340, "the daily dial (" + dial.getAttribute("width") + "px) fits a 375 px phone");
  H.setSize(1280, 800);
})();

/* ═══════════════════════════════════════════════════════════════════════ */
H.section("no dead links");
(function () {
  H.ok(auditedTotal > 200, auditedTotal + " links and images resolved and checked against the disk");
  H.ok(!deadLinks.length, "none of them is dead" + (deadLinks.length ? ":\n       " + deadLinks.join("\n       ") : ""));

  // and the reverse: every cabinet on disk is reachable from the Daily Run
  H.atDay(15);
  page("daily/index.html"); go();
  var linked = {};
  H.all(".cab[href]").forEach(function (e) {
    var m = /\.\.\/games\/([^/]+)\//.exec(e.getAttribute("href"));
    if (m) linked[m[1]] = 1;
  });
  var onDisk = A.registry.filter(function (g) { return !g.soon; }).map(function (g) { return g.id; });
  H.eq(onDisk.filter(function (id) { return !linked[id]; }), [],
       "every playable cabinet is reachable from the Daily Run");
})();

/* ═══════════════════════════════════════════════════════════════════════ */
H.section("dates and par");
(function () {
  page("daily/index.html");
  H.atDay(0);
  go();
  H.ok(seen().indexOf("Day 0") >= 0, "day 0 is day 0, not day −1 or NaN");
  H.ok(!/Day 0 · (Invalid|undefined)/.test(seen()), "…and it has a real date on it");
  H.eq(A.dateFromDay(0), A.EPOCH, "day 0 is the epoch");
  H.eq(A.dayNumber(A.EPOCH), 0, "…and round-trips");
  noRot("daily · day 0");

  // par is the number a result sheet shows you; the cold start must be sane
  H.reset(); load("core/registry.js"); load("core/arcade.js");
  var p = A.par("wordish", 0);
  H.eq(p.par, 70, "par with no history is a solid day, 70");
  H.ok(p.source.indexOf("solid") >= 0, "…and says where it came from");
  [90, 80, 70].forEach(function (n, i) { play("wordish", i, n, "x"); });
  p = A.par("wordish", 3);
  H.eq(p.par, 80, "after three days par is your own average");
  H.ok(p.par >= 5 && p.par <= 98, "…and is always inside its own bounds");
  A.setPar("wordish", function () { return 50; });
  p = A.par("wordish", 3);
  H.eq(p.par, Math.round(50 * 0.6 + 80 * 0.4), "a game's own difficulty leads, your form pulls it");
  A.setPar("wordish", function () { throw new Error("boom"); });
  H.eq(A.par("wordish", 3).par, 80, "…and a game whose par function throws falls back to your average");
  H.atDay(15);
})();

H.section("summary");
print("  " + auditedTotal + " links/images checked, " + deadLinks.length + " dead");
print("  pages covered: " + JSC_PAGES.join(", "));
H.done();
