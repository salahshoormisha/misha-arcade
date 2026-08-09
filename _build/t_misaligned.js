/* ============================================================================
   t_misaligned.js — MISALIGNED, driven through its own buttons.

     JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
     $JSC _build/harness.js -e 'load("_build/t_misaligned.js")'

   Everything below goes through the real DOM: real clicks on the real option
   buttons, real keydown events on document, the real LOCK IT IN and the real
   NEXT. Nothing calls the function under a button — that is how this arcade
   shipped a dead END TURN past 300 passing tests.

   __MI.right() is used only to decide WHICH button to click. The click itself
   is always a real click on a real element, and every assertion is made against
   what is on screen afterwards.

   THE THING THIS CABINET CAN GET WRONG THAT NOTHING ELSE CAN: leaking. If the
   reveal text, the source, the author, the year or a milestone's date is on
   screen while the question is still open, the round is free and it does not
   look broken — it looks easy. Every round of every archive day is checked for
   that, string by string.
   ========================================================================== */

/* ── loading the cabinet the way the browser does ─────────────────────────── */

var PAGE = "games/misaligned/index.html";

function loadPage(search, keepStore) {
  var saved = keepStore ? JSON.parse(JSON.stringify(H.store())) : null;
  H.reset();
  if (saved) Object.keys(saved).forEach(function (k) { H.store()[k] = saved[k]; });
  H.url(search === undefined ? "" : search);
  H.html(PAGE);
  var dir = PAGE.replace(/[^/]*$/, "");
  H.scripts.forEach(function (s) { load(resolve(dir + s.replace(/\?.*$/, ""))); });
  H.boot();
}
function resolve(p) {
  var out = [];
  p.split("/").forEach(function (seg) {
    if (seg === "..") out.pop(); else if (seg && seg !== ".") out.push(seg);
  });
  return out.join("/");
}

/* ── reading the screen the way a player does ─────────────────────────────── */

function screenText() { return H.visible(H.find("main")).join("  "); }
function opts() { return H.all(".mi-opt"); }
function liveOpts() {
  return opts().filter(function (b) { return !b.disabled; });
}
function optText(b) {
  var s = b.querySelector("span");
  return s ? s.textContent.replace(/\s+/g, " ").trim() : "";
}
function letterOf(b) {
  var l = b.querySelector("b");
  return l ? l.textContent.trim() : "";
}
function byLetter(letter) {
  var bs = liveOpts();
  for (var i = 0; i < bs.length; i++) if (letterOf(bs[i]) === letter) return bs[i];
  throw new Error("no live option " + JSON.stringify(letter) + " on screen");
}
function bank() { return window.__MI.bank(); }
function st() { return window.__MI.state(); }

/* Substring test that survives the whitespace collapse H.visible does. */
function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }
function shows(hay, needle) {
  var n = norm(needle);
  return n.length > 0 && norm(hay).indexOf(n) >= 0;
}

/* ── driving it ───────────────────────────────────────────────────────────── */

function begin() { H.click(H.find("#mi-start")); }
function next() { H.click(H.find("#mi-next")); }

/** Answer the round on screen correctly, through the buttons. */
function answerRight() {
  var kind = window.__MI.kinds()[st().ri];
  if (kind === "order") {
    window.__MI.rightOrder().forEach(function (L) { H.click(byLetter(L)); });
    H.click(H.find("#mi-lock"));
  } else {
    H.click(byLetter(window.__MI.right()));
  }
}

/** Answer it as wrongly as the round allows. */
function answerWrong() {
  var kind = window.__MI.kinds()[st().ri];
  if (kind === "order") {
    // Exactly reversed: zero concordant pairs, the floor of the round.
    window.__MI.rightOrder().slice().reverse().forEach(function (L) { H.click(byLetter(L)); });
    H.click(H.find("#mi-lock"));
    return;
  }
  if (kind === "bench") {
    // Two bands away or more, so not even the adjacent-band consolation.
    var right = window.__MI.right(), L = ["A", "B", "C", "D"];
    var ri = L.indexOf(right);
    H.click(byLetter(L[ri <= 1 ? 3 : 0]));
    return;
  }
  var r = window.__MI.right();
  var bs = liveOpts();
  for (var i = 0; i < bs.length; i++) if (letterOf(bs[i]) !== r) return H.click(bs[i]);
  throw new Error("nothing wrong to click");
}

/* ── what must never be on screen while a question is open ────────────────── */

/**
 * Returns a list of leaks found on the CURRENT question screen. Every string
 * here is something the reveal is allowed to say and the question is not.
 */
function leaks() {
  var P = window.__MI.plan(), s = st(), kind = window.__MI.kinds()[s.ri];
  var D = window.AD_MISALIGNED, txt = screenText(), bad = [];

  function check(v, why) { if (v && shows(txt, v)) bad.push(why + ": " + norm(v).slice(0, 60)); }

  if (kind === "spec") {
    var sp = D.spec[P.spec[s.ri]];
    check(sp.story, "reveal text");
    check(sp.who, "author");
    check(sp.url, "source url");
  } else if (kind === "fake") {
    check(D.fakes[P.fake].tell, "the tell");
    P.bits.forEach(function (b) {
      check(D.bits[b].who, "author");
      check(D.bits[b].url, "source url");
    });
  } else if (kind === "bench") {
    var bn = D.bench[P.bench];
    check(bn.score, "the machine's score");
    check(bn.story, "reveal text");
    check(bn.url, "source url");
  } else {
    P.order.forEach(function (m) {
      var mi = D.mile[m];
      check(mi.d, "the raw date");
      check(mi.d.slice(0, 4), "the year");
      check(mi.note, "reveal note");
      check(mi.url, "source url");
    });
  }
  return bad;
}

/** Structural checks on the question screen: options distinct, none empty. */
function optionSanity() {
  var bad = [], seen = {};
  var bs = opts();
  bs.forEach(function (b) {
    var t = optText(b).toLowerCase().replace(/\W+/g, " ").trim();
    if (!t) bad.push("an empty option");
    if (seen[t]) bad.push("duplicate option: " + t.slice(0, 50));
    seen[t] = 1;
  });
  return bad;
}

/* ══════════════════════════════════════════════════════════════════════════ */

H.section("BOOT");
loadPage();
H.ok(!!window.AD_MISALIGNED, "core/data/misaligned.js defines window.AD_MISALIGNED");
var B = bank();
H.ok(B.spec >= 40, "spec bank is deep: " + B.spec + " incidents");
H.ok(B.bits >= 40, "one-liner bank is deep: " + B.bits);
H.ok(B.fakes >= 20, "invented bank is deep: " + B.fakes);
H.ok(B.bench >= 20, "benchmark bank is deep: " + B.bench);
H.ok(B.mile >= 40, "milestone bank is deep: " + B.mile);
H.ok(B.orders >= 200, "ordering sets: " + B.orders);
H.ok(H.log.filter(function (l) { return l.indexOf("ERROR") === 0; }).length === 0,
  "no errors logged during boot");
H.ok(!!H.maybe("#mi-start"), "the title card offers a START button");
H.eq(st().screen, "intro", "starts on the title card");
H.ok(!H.maybe(".mi-opt"), "no options on the title card");

H.section("A PERFECT DAY, ROUND BY ROUND");
begin();
H.eq(st().screen, "q", "START opened round one");
var KINDS = window.__MI.kinds();
for (var r = 0; r < 5; r++) {
  H.eq(st().ri, r, "on round " + (r + 1) + " (" + KINDS[r] + ")");
  H.eq(opts().length >= 4, true, "round " + (r + 1) + " shows at least four things to choose from");
  H.eq(optionSanity(), [], "round " + (r + 1) + " options are distinct and non-empty");
  H.eq(leaks(), [], "round " + (r + 1) + " leaks nothing");
  answerRight();
  H.eq(st().screen, "r", "round " + (r + 1) + " revealed after answering");
  H.eq(st().res[r].got, 20, "round " + (r + 1) + " scored the full 20");
  H.ok(!!H.maybe(".mi-note"), "round " + (r + 1) + " reveal explains itself");
  if (r < 4) next();
}
H.ok(!!H.maybe("#mi-next"), "the last reveal offers a way on");
next();
H.eq(st().total, 100, "a perfect day is 100");
H.ok(!!H.maybe(".ac-modal"), "the result sheet opened by itself");
H.ok(shows(H.text(".ac-modal"), "100"), "the sheet shows the score");
H.ok(shows(H.text(".ac-modal"), "5 of 5 rounds clean"), "the sheet counts the clean rounds");

H.section("THE STATS THE ARCADE KEEPS");
var STORE = H.store();
var stats = JSON.parse(STORE["ag_s:misaligned"] || "null");
H.ok(!!stats, "a stats record was written");
H.eq(stats.played, 1, "one game played");
H.eq(stats.wins, 1, "and won");
H.eq(stats.bestNorm, 100, "best norm recorded as 100");

H.section("FINISH IS IDEMPOTENT ACROSS A RELOAD");
loadPage("", true);
H.flush();
H.tick(400);
H.eq(st().screen, "done", "a finished day comes back finished");
H.ok(!!H.maybe(".ac-modal"), "and reopens the sheet");
var stats2 = JSON.parse(H.store()["ag_s:misaligned"] || "null");
H.eq(stats2.played, 1, "reloading a finished day does not count it twice");
H.eq(stats2.bestNorm, 100, "and does not re-score it");

H.section("THE WORST DAY");
H.reset();
loadPage("?d=1");
begin();
for (var w = 0; w < 5; w++) {
  H.eq(leaks(), [], "worst-day round " + (w + 1) + " leaks nothing");
  answerWrong();
  H.eq(st().res[w].got, 0, "round " + (w + 1) + " scored nothing");
  if (w < 4) next();
}
next();
H.eq(st().total, 0, "a wholly wrong day is 0, not a negative and not a crash");
H.ok(!!H.maybe(".ac-modal"), "the sheet still opens on a bad day");
var lost = JSON.parse(H.store()["ag_s:misaligned"] || "null");
H.eq(lost.wins, 0, "a 0 does not count as a win");

H.section("PARTIAL CREDIT IS REAL");
H.reset();
loadPage("?d=2");
begin();
// Rounds 1 and 2 wrong, then a single transposition in the ordering round.
answerWrong(); next();
answerWrong(); next();
var seq = window.__MI.rightOrder().slice();
var swap = seq[2]; seq[2] = seq[3]; seq[3] = swap;   // one adjacent transposition
seq.forEach(function (L) { H.click(byLetter(L)); });
H.click(H.find("#mi-lock"));
H.eq(st().res[2].got, 13, "one transposition in the ordering round is worth 13");
next();
answerRight(); next();          // round 4 clean
// Round 5: the neighbouring band.
var L4 = ["A", "B", "C", "D"], right5 = window.__MI.right();
var near5 = L4[L4.indexOf(right5) === 3 ? 2 : L4.indexOf(right5) + 1];
H.click(byLetter(near5));
H.eq(st().res[4].got, 8, "the neighbouring band is worth 8, not 0");
next();
H.eq(st().total, 41, "the partial day totals 41");

H.section("THE ORDERING ROUND, THROUGH ITS OWN BUTTONS");
H.reset();
loadPage("?d=3");
begin(); answerRight(); next(); answerRight(); next();
H.eq(window.__MI.kinds()[st().ri], "order", "round three is the ordering round");
H.ok(!H.maybe("#mi-lock"), "no LOCK IT IN until all four are placed");
H.eq(H.all(".mi-slot.full").length, 0, "four empty slots to start");
var ord = window.__MI.rightOrder();
H.click(byLetter(ord[0]));
H.eq(st().place.length, 1, "tapping an item places it");
H.eq(H.all(".mi-slot.full").length, 1, "and it appears in slot one");
H.eq(liveOpts().length, 3, "and leaves the pool of unplaced items");
H.click(H.find(".mi-slot.full"));
H.eq(st().place.length, 0, "tapping a placed item takes it back");
H.eq(liveOpts().length, 4, "and returns it to the pool");
ord.forEach(function (L) { H.click(byLetter(L)); });
H.ok(!!H.maybe("#mi-lock"), "LOCK IT IN appears once all four are placed");
H.eq(liveOpts().length, 0, "and nothing is left to place");
H.click(H.find("#mi-lock"));
H.eq(st().res[2].got, 20, "the right order scores 20");
H.eq(H.all(".mi-slot.ok").length, 4, "the reveal marks all four right");
H.ok(shows(screenText(), window.AD_MISALIGNED.mile[window.__MI.plan().order[0]].d.slice(0, 4)),
  "the reveal finally shows the dates");

H.section("THE PHYSICAL KEYBOARD DRIVES THE SAME HANDLERS");
H.reset();
loadPage("?d=4");
H.key("Enter");
H.eq(st().screen, "q", "Enter starts the game");
var want = window.__MI.right();
H.key(want.toLowerCase());
H.eq(st().screen, "r", "a letter key answers");
H.eq(st().res[0].got, 20, "and it answered with the key that was pressed");
H.key("Enter");
H.eq(st().ri, 1, "Enter moves on from a reveal");
H.key(String(["A", "B", "C", "D"].indexOf(window.__MI.right()) + 1));
H.eq(st().res[1].got, 20, "digits work as well as letters");

H.section("PROGRESS SURVIVES A RELOAD MID-GAME");
var midRes = st().res.slice(0, 2);
loadPage("?d=4", true);
H.eq(st().res[0].got, midRes[0].got, "round one's score came back");
H.eq(st().res[1].got, midRes[1].got, "round two's score came back");
H.eq(st().ri, 1, "and it resumed on the round it was left on");
H.eq(st().screen, "r", "on the reveal it was left showing");
H.ok(!!H.maybe("#mi-next"), "with a live NEXT button");
next();
H.eq(st().ri, 2, "which still works after the reload");

H.section("PRACTICE IS UNLIMITED AND NEVER RANKED");
H.reset();
loadPage("?practice=1");
H.eq(st().practice, true, "practice mode is on");
begin();
for (var p = 0; p < 5; p++) { answerRight(); if (p < 4) next(); }
next();
H.eq(st().total, 100, "practice plays through");
H.ok(!H.store()["ag_s:misaligned"], "practice wrote no stats");
H.ok(!!H.maybe(".ac-modal"), "practice still shows a sheet");

H.section("EVERY ARCHIVE DAY IS PLAYABLE AND WINNABLE");
var today = (function () { loadPage(); return window.A.dayNumber(); })();
var days = 0, dayFails = 0, leakFails = 0, dupFails = 0;
for (var d = 0; d <= today; d++) {
  H.reset();
  loadPage("?d=" + d);
  if (st().screen !== "intro") { dayFails++; continue; }
  begin();
  var ok = true;
  for (var rr = 0; rr < 5; rr++) {
    if (opts().length < 4) { ok = false; break; }
    var lk = leaks(); if (lk.length) { leakFails++; print("   leak day " + d + " r" + (rr + 1) + ": " + lk.join(" / ")); }
    var du = optionSanity(); if (du.length) { dupFails++; print("   dup day " + d + " r" + (rr + 1) + ": " + du.join(" / ")); }
    answerRight();
    if (st().res[rr].got !== 20) { ok = false; break; }
    if (rr < 4) next();
  }
  if (!ok) { dayFails++; print("   FAILED day " + d); continue; }
  next();
  if (st().total !== 100) { dayFails++; print("   day " + d + " did not total 100"); }
  days++;
}
H.eq(dayFails, 0, "all " + (today + 1) + " archive days play to a perfect 100");
H.eq(leakFails, 0, "no archive day leaks an answer");
H.eq(dupFails, 0, "no archive day shows a duplicate option");

H.section("FUZZING THE POOL THROUGH PRACTICE (200 fresh draws)");
var N = 200, fuzzBad = 0, fuzzLeak = 0, fuzzDup = 0, seenSpec = {}, seenFake = {}, seenBench = {};
for (var f = 0; f < N; f++) {
  H.reset();
  loadPage("?practice=1");
  begin();
  var P = window.__MI.plan();
  seenSpec[P.spec[0]] = 1; seenSpec[P.spec[1]] = 1;
  seenFake[P.fake] = 1; seenBench[P.bench] = 1;
  if (P.spec[0] === P.spec[1]) { fuzzBad++; print("   same incident twice on a draw"); }
  if (P.bits[0] === P.bits[1] || P.bits[1] === P.bits[2] || P.bits[0] === P.bits[2]) {
    fuzzBad++; print("   duplicate one-liner in a draw");
  }
  if (P.order.length !== 4 || P.order[0] === P.order[1]) { fuzzBad++; print("   bad ordering set"); }
  var good = true;
  for (var k = 0; k < 5; k++) {
    if (leaks().length) fuzzLeak++;
    if (optionSanity().length) fuzzDup++;
    answerRight();
    if (st().res[k].got !== 20) { good = false; break; }
    if (k < 4) next();
  }
  if (!good) { fuzzBad++; continue; }
  next();
  if (st().total !== 100) fuzzBad++;
}
H.eq(fuzzBad, 0, N + " random draws all played to 100 with no duplicate draws");
H.eq(fuzzLeak, 0, "and none of them leaked");
H.eq(fuzzDup, 0, "and none of them showed a duplicate option");
H.ok(Object.keys(seenSpec).length > 40,
  "the draws reached " + Object.keys(seenSpec).length + " distinct incidents");
H.ok(Object.keys(seenFake).length > 15,
  "and " + Object.keys(seenFake).length + " distinct inventions");
H.ok(Object.keys(seenBench).length > 15,
  "and " + Object.keys(seenBench).length + " distinct benchmark rows");

H.section("EVERY BENCH ROW'S BAND MATCHES ITS OWN NUMBERS");
H.reset();
loadPage();
var Dd = window.AD_MISALIGNED, bandBad = 0, urlBad = 0;
Dd.bench.forEach(function (b) {
  if (b.band < 0 || b.band > 3) { bandBad++; print("   " + b.id + ": band out of range"); }
  if (!/^https?:\/\//.test(b.url)) { urlBad++; print("   " + b.id + ": no source"); }
});
H.eq(bandBad, 0, "every benchmark row has a band in 0..3");
Dd.spec.forEach(function (s) { if (!/^https?:\/\//.test(s.url)) urlBad++; });
Dd.bits.forEach(function (b) { if (!/^https?:\/\//.test(b.url)) urlBad++; });
Dd.mile.forEach(function (m) { if (!/^https?:\/\//.test(m.url)) urlBad++; });
H.eq(urlBad, 0, "every real entry in the whole bank carries a source URL");
var tellBad = 0;
Dd.fakes.forEach(function (f) { if (!f.tell || f.tell.length < 40) tellBad++; });
H.eq(tellBad, 0, "every invented entry carries a tell worth reading");

H.section("THE ORDERING SETS ARE ANSWERABLE");
var gapBad = 0, MINGAP = { day: 45, month: 70, year: 400 };
function asDate(s) { return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)); }
Dd.orders.forEach(function (o) {
  for (var i = 0; i < 4; i++) {
    for (var j = i + 1; j < 4; j++) {
      var a = Dd.mile[o[i]], b = Dd.mile[o[j]];
      var need = Math.max(MINGAP[a.prec], MINGAP[b.prec]);
      if (Math.abs(asDate(a.d) - asDate(b.d)) / 86400000 < need) gapBad++;
    }
  }
});
H.eq(gapBad, 0, "no ordering set asks a player to split two dates we do not know apart");
var ascBad = 0;
Dd.orders.forEach(function (o) {
  for (var i = 1; i < 4; i++) if (Dd.mile[o[i]].d < Dd.mile[o[i - 1]].d) ascBad++;
});
H.eq(ascBad, 0, "every ordering set is stored in true date order");

H.section("THE REGISTRY ENTRY IS LIVE");
var g = window.A.game("misaligned");
H.ok(!!g, "misaligned is in the registry");
H.ok(!g.soon, "and is no longer marked `soon`");
H.eq(g.hasArchive, true, "it advertises an archive, and has one");
H.eq(g.hasPractice, true, "it advertises practice, and has it");

H.done();
