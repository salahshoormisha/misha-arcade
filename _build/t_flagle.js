/* ===========================================================================
   t_flagle.js — drive FLAGLE through its own controls.

     JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
     $JSC _build/harness.js -e 'load("_build/t_flagle.js")'

   Everything here goes through the real DOM: the picker is TYPED INTO and its
   suggestion is CLICKED, the bonus options are CLICKED, the sheet is found by
   reading the page. Nothing calls the function under a button — that is the
   mistake MISHANAMEH's dead END TURN cost this build.
   =========================================================================== */

var CORE = ["core/registry.js", "core/arcade.js", "core/ui.js", "core/audio.js",
            "core/flagart.js", "core/worldmap.js", "core/data/countries.js",
            "core/data/world.js", "core/data/flags.js", "core/picker.js"];

/* Boot a fresh cabinet at a given URL. Scripts are re-loaded each time, which
   is what a real page reload does. */
function boot(search) {
  H.reset();
  H.url(search || "");
  H.html("games/flagle/index.html");
  CORE.forEach(load);
  load("games/flagle/game.js");
  H.boot();
  H.tick(50);                       // let the flag SVG fetch + decode land
  return window.__FL;
}

/* Type a partial name and click the suggestion for `iso` — a real guess. */
function typeGuess(iso) {
  var rec = null;
  (window.AD_COUNTRIES || []).forEach(function (c) { if (c.i === iso) rec = c; });
  var input = H.find(".ac-picker input");
  H.type(input, rec.n.slice(0, Math.min(rec.n.length, 6)));
  var btn = H.maybe('.ac-picker .sug button[data-i="' + iso + '"]');
  if (!btn) {                       // long/awkward names: fall back to the code
    H.type(input, iso);
    btn = H.maybe('.ac-picker .sug button[data-i="' + iso + '"]');
  }
  if (!btn) throw new Error("no suggestion for " + iso + " (" + rec.n + ")");
  H.click(btn);
  H.tick(30);
  return btn;
}

/* Any country that is not the answer and is not already guessed. */
function wrongOne(FL) {
  var used = FL.state().guesses, ans = FL.answer();
  var pool = ["FR", "BR", "NZ", "KE", "JP", "CA", "NO", "PE", "TH", "EG", "IS", "MX"];
  for (var i = 0; i < pool.length; i++) {
    if (pool[i] !== ans && used.indexOf(pool[i]) < 0 && window.AD_FLAGS[pool[i]]) return pool[i];
  }
  throw new Error("ran out of wrong answers");
}

/* ── 1 · the answer leak ─────────────────────────────────────────────────── */
H.section("1 · the picker cannot show the answer");
var FL = boot("");
H.ok(!!FL, "cabinet booted");
H.ok(H.maybe(".ac-picker.no-flags") !== null, "picker is in no-flags (hard) mode");

/* Type a partial country name and look at what the dropdown actually renders.
   This is the exact complaint: "when you search countries, it shows the flag …
   you can literally just scroll down and see exactly the flag that's on the
   screen." One query would not prove it — a leak could hide behind a code path
   only some queries take (aliases, territories, exact hits, long lists). */
var QUERIES = ["ira", "u", "s", "gu", "new", "isl", "korea", "united", "persia", "cote", "ZZQQ"];
var leaks = [];
QUERIES.forEach(function (q) {
  H.type(H.find(".ac-picker input"), q);
  var s = H.find(".ac-picker .sug");
  if (s.querySelectorAll("img").length) leaks.push(q + ":img");
  if (s.querySelectorAll("svg").length) leaks.push(q + ":svg");
  if (s.querySelectorAll("picture, canvas, object, image").length) leaks.push(q + ":media");
  if (/flags\//.test(s.innerHTML)) leaks.push(q + ":path");
  if (/background|data:image|\.svg|\.png|\.webp/i.test(s.innerHTML)) leaks.push(q + ":smuggled");
});
H.eq(leaks.length, 0, "no flag imagery in the suggestions across " + QUERIES.length +
     " different queries" + (leaks.length ? " — " + leaks.join(" ") : ""));

H.type(H.find(".ac-picker input"), "ira");
var sug = H.find(".ac-picker .sug");
H.ok(sug.querySelectorAll("button").length >= 2, "typing a partial name still suggests countries");
H.ok(H.text(sug).toLowerCase().indexOf("iran") >= 0, "…and they are the right ones, by NAME only");

/* the whole page, not just the dropdown: nothing may render ANY flag while the
   game is in play — not the answer's, and not a guess's either, because a row
   of guess thumbnails is just a slower way to eye-match against the open tiles */
var ansIso = FL.answer();
H.ok(H.doc.body.innerHTML.indexOf("flags/" + ansIso + ".svg") < 0,
     "the answer's flag file is not referenced anywhere on the page (" + ansIso + ")");
H.eq(H.all("img").length, 0, "no <img> element anywhere in the cabinet mid-game");

/* And prove `flags:false` is a real OPTION and not a global neuter — eight
   other cabinets pass a country picker where the flag is a helpful label, not
   the answer, and they must be untouched. Built in a scratch host that is torn
   down immediately so it can't pollute the assertions above. */
var ctlHost = H.doc.createElement("div");
H.doc.body.appendChild(ctlHost);
var ctl = A.picker(ctlHost, { onPick: function () {} });
H.type(ctl.input, "ira");
H.ok(ctl.el.querySelectorAll(".sug img").length > 0,
     "a DEFAULT picker still shows thumbnails (GLOBLE, TRADLE, OUTLINE… keep them)");
H.ok(ctl.el.className.indexOf("no-flags") < 0, "…and is not marked no-flags");
H.doc.body.removeChild(ctlHost);

/* ── 2 · the mechanics RESEARCH.md describes ─────────────────────────────── */
H.section("2 · mechanics (RESEARCH.md § flagle.io)");
H.eq(FL.state().tilesShown, 0, "all six tiles start shut — no free tile");
H.ok(/Make a guess to reveal the first tile/.test(H.text(".fl-status")),
     "status line matches the original's before the first guess");
H.eq(FL.order().length, 6, "six tiles in the reveal order");
H.eq(FL.order().slice().sort().join(""), "012345", "the order is a permutation of all six");
H.eq(H.all(".tries i").length, 6, "six try pips");

var w1 = wrongOne(FL);
typeGuess(w1);
H.eq(FL.state().guesses.length, 1, "the clicked suggestion registered as a guess");
H.eq(FL.state().tilesShown, 1, "one guess, one tile — 1:1");
H.ok(/5 guesses left/.test(H.text(".fl-status")), "status counts down: " + H.text(".fl-status"));

var r1 = H.find(".gr");
H.ok(/km/.test(H.text(r1)), "guess row carries a distance");
H.ok(H.text(r1).indexOf("%") < 0, "no proximity percentage — RESEARCH calls it decorative");
H.eq(r1.querySelectorAll("img").length, 0, "no flag thumbnail in the guess row either");
H.ok(H.maybe(".gr .g2") !== null && H.text(".gr .g2").length > 3,
     "guess row carries flag affinity: “" + H.text(".gr .g2") + "”");

/* affinity is informative, never decisive */
var selfAff = FL.affinity(FL.answer());
H.eq(selfAff.shared, selfAff.of, "the answer shares all of its own colours (sanity)");
H.ok(H.doc.body.innerHTML.indexOf(">" + window.AD_COUNTRIES.filter(
       function (c) { return c.i === ansIso; })[0].n + "<") < 0,
     "the affinity line never names the answer");

/* duplicate + unknown guesses are refused */
typeGuess(w1);
H.eq(FL.state().guesses.length, 1, "guessing the same country twice does nothing");
FL.guess("ZZ");
H.eq(FL.state().guesses.length, 1, "an unknown code is refused");

/* ── 2b · keyboard-only play ─────────────────────────────────────────────── */
H.section("2b · playable from the keyboard alone");
var kb = boot("");
var kin = H.find(".ac-picker input");
kin.focus();
H.eq(H.doc.activeElement, kin, "the picker input takes focus");
H.type(kin, "braz");
H.ok(H.all(".ac-picker .sug button").length >= 1, "typing opens suggestions");
H.ok(H.maybe(".ac-picker .sug button.sel") !== null, "the first suggestion is preselected");
H.key("ArrowDown");
H.ok(H.all(".ac-picker .sug button")[1].className.indexOf("sel") >= 0, "ArrowDown moves the selection");
H.key("ArrowUp");
H.ok(H.all(".ac-picker .sug button")[0].className.indexOf("sel") >= 0, "ArrowUp moves it back");
H.key("Enter");
H.tick(30);
H.eq(kb.state().guesses.length, 1, "Enter submits the highlighted suggestion");
H.eq(kb.state().guesses[0], "BR", "…and it was Brazil");
H.eq(H.find(".ac-picker input").value, "", "the input clears after a guess");
/* typed-in-full then Enter, with no suggestion highlighted */
H.type(kin, "persia");
H.key("Enter");
H.tick(30);
H.eq(kb.state().guesses[1], "IR", "an alias typed in full also submits on Enter");
H.key("Escape");
H.ok(H.all(".ac-picker .sug button").length === 0, "Escape closes the suggestions");

/* ── 2c · the tiles are really painted shut ──────────────────────────────
   Reading FL.state().tilesShown proves the bookkeeping. It does not prove the
   canvas. The harness records every 2D call, so the lids can be counted and
   located for real: after N guesses there must be exactly 6−N filled rectangles
   and they must sit on exactly the tiles the reveal order has NOT reached. */
H.section("2c · the lids are actually painted, on the right tiles");
function lids() {
  var g = H.find("#flag").getContext("2d");
  var calls = g._calls, from = 0;
  for (var i = 0; i < calls.length; i++) if (calls[i][0] === "clearRect") from = i;
  var out = [];
  for (var j = from; j < calls.length; j++) {
    if (calls[j][0] !== "fillRect") continue;
    var x = calls[j][1], y = calls[j][2], tw = calls[j][3], th = calls[j][4];
    out.push(Math.round(x / tw) + 3 * Math.round(y / th));
  }
  return out.sort(function (a, b) { return a - b; });
}
var lid0 = boot("");
H.eq(lids().length, 6, "before any guess all six tiles are painted over");
typeGuess(wrongOne(lid0));
var open1 = lid0.order()[0];
H.eq(lids().length, 5, "one guess later, five lids remain");
H.ok(lids().indexOf(open1) < 0, "the tile that opened is tile " + open1 +
     ", the first in the reveal order, and it is no longer painted over");
typeGuess(wrongOne(lid0));
H.eq(lids().join(","), lid0.order().slice(2).sort(function (a, b) { return a - b; }).join(","),
     "after two guesses the painted tiles are exactly the four still to come");

/* ── 3 · information-ranked reveal ───────────────────────────────────────── */
H.section("3 · the reveal order is MEASURED, not guessed");
/* `t` in core/data/flags.js is produced by _build/gen_flag_tiles.py, which
   rasterises all 250 shipped SVGs through Quick Look and scores each sixth on
   edge energy, colour count and distance from the flag's own mean colour. */
var noT = [], badT = [], flat = 0, charged = 0;
Object.keys(window.AD_FLAGS).forEach(function (iso) {
  var t = window.AD_FLAGS[iso].t;
  if (!t) { noT.push(iso); return; }
  if (t.length !== 6 || Math.min.apply(null, t) !== 0 || Math.max.apply(null, t) > 5) badT.push(iso);
  if (Math.max.apply(null, t) === 0) flat++; else charged++;
});
H.eq(noT.length, 0, "every one of the " + Object.keys(window.AD_FLAGS).length +
     " shipped flags carries a measured tile ranking" + (noT.length ? " — " + noT.slice(0, 8) : ""));
H.eq(badT.length, 0, "every ranking is six ranks starting at 0" + (badT.length ? " — " + badT : ""));
H.ok(charged > 120, charged + " flags have somewhere on them worth saving for last");
H.ok(flat > 20, flat + " flags measure genuinely flat and keep the blind shuffle");

/* The game must READ that measurement — FL.weights is the function draw() uses. */
function last(iso) {             // tiles that open last, i.e. the giveaway
  var w = FL.weights(iso), hi = Math.max.apply(null, w), out = [];
  w.forEach(function (v, k) { if (v === hi) out.push(k); });
  return out;
}
function first(iso) {
  var w = FL.weights(iso), lo = Math.min.apply(null, w), out = [];
  w.forEach(function (v, k) { if (v === lo) out.push(k); });
  return out;
}
/* Tiles: 0 1 2 across the top, 3 4 5 across the bottom. */
H.eq(last("US"), [0], "the STARS AND STRIPES saves its canton (tile 0) for last");
H.eq(last("JP"), [1, 4], "JAPAN saves the two tiles the sun disc straddles");
H.eq(last("PA"), [0, 5], "PANAMA saves both star quarters — RESEARCH's own example of " +
     "the tile that 'effectively ends the puzzle'");
H.eq(last("BR"), [1], "BRAZIL saves the globe");
H.eq(last("CA"), [1, 4], "CANADA saves the maple leaf");
H.eq(first("TR"), [2, 5], "TURKEY opens on the plain red fly, not the crescent");
H.eq(first("SA"), [3, 5], "SAUDI ARABIA opens below the script, not on it");
[["FR", "France"], ["ID", "Indonesia"], ["MC", "Monaco"], ["PL", "Poland"]].forEach(function (p) {
  var w = FL.weights(p[0]);
  H.eq(Math.max.apply(null, w), Math.min.apply(null, w),
       p[1] + " measures flat, so its order is the day's seeded shuffle — exactly flagle.io");
});

var aw = FL.weights(ansIso);
H.ok(aw.length === 6, "today's weights for " + ansIso + ": " + aw.join(","));

/* determinism: the same day rebuilds the same puzzle and the same order */
var ord1 = FL.order().join(""), ans1 = FL.answer();
var FL2 = boot("");
H.eq(FL2.answer(), ans1, "same day, same answer");
H.eq(FL2.order().join(""), ord1, "same day, same tile order on both devices");

/* ── 4 · a full win, through the buttons ─────────────────────────────────── */
H.section("4 · win in four, sheet, share grid, stamp");
FL = boot("");
var ans = FL.answer();
for (var i = 0; i < 3; i++) typeGuess(wrongOne(FL));
H.eq(FL.state().tilesShown, 3, "three tiles open after three wrong guesses");
typeGuess(ans);
H.tick(400);

H.ok(FL.state().over, "game is over");
H.eq(FL.state().banked, true, "the day was banked");
var saved = JSON.parse(H.store()["ag_d:flagle:" + FL.state().day] || "null");
H.ok(saved && saved.done, "saved state says done");
H.eq(saved.won, true, "…and won");
H.eq(saved.detail, "4/6", "detail is 4/6");
H.eq(saved.norm, FL.norm[4], "norm for a 4-guess win is " + FL.norm[4]);
H.ok(saved.norm >= 65 && saved.norm <= 80, "a modal win lands in the solid band (CONTRACT §3)");

var grid = FL.shareGrid(true);
H.eq(grid.length, 2, "share grid is two rows of three — the 3×2 tile map");
H.eq(grid.join("").length / 2, 6, "six squares");
var reds = grid.join("").split("🟥").length - 1;
H.eq(reds, 3, "one red per WRONG guess, the winning tile stays green (RESEARCH §SHARE)");
var lost = FL.shareGrid(false).join("");
H.eq(lost.split("🟥").length - 1, 6, "a loss is all six red");

H.eq(FL.state().tilesShown, 6, "the whole flag is revealed once it's over");
var pass = JSON.parse(H.store()["ag_passport"] || "{}");
H.ok(!!pass[ans], "the answer is stamped in the passport (" + ans + ")");
H.ok((pass[ans].games || []).indexOf("flagle") >= 0, "…stamped by flagle");

/* the picker is dead afterwards */
H.ok(H.find(".ac-picker input").disabled, "picker input is disabled after the game ends");
FL.guess(wrongOne(FL));
H.eq(FL.state().guesses.length, 4, "no guesses accepted after the end");

/* ── 5 · bonus rounds, clicked ───────────────────────────────────────────── */
H.section("5 · bonus rounds");
var rounds = FL.rounds();
H.ok(rounds.length >= 1, rounds.length + " bonus rounds built for " + ans +
     " [" + rounds.map(function (r) { return r.id; }).join(", ") + "]");
H.ok(rounds.length <= 5, "never more than five");
rounds.forEach(function (r) {
  H.ok(r.opts.length >= 4, r.id + ": " + r.opts.length + " options");
  H.eq(r.opts.filter(function (o) { return o.right; }).length, 1, r.id + ": exactly one right answer");
});

H.ok(H.maybe(".bonus") !== null, "the bonus panel is on screen after the flag round");
H.ok(H.all(".bn-opt").length >= 4, "its options are real buttons: " + H.all(".bn-opt").length);
H.ok(H.maybe(".bn-skip") !== null, "there is a way out of the chain");

/* answer every round by clicking the correct option, then Next */
var guard = 0;
while (H.maybe(".bonus") && guard++ < 12) {
  var opts = H.all(".bn-opt");
  var idx = -1, r = rounds[Math.min(guard - 1, rounds.length - 1)];
  // find the right button by matching against the round the panel is showing
  var head = H.text(".bn-nm");
  rounds.forEach(function (rr) { if (rr.label === head) r = rr; });
  r.opts.forEach(function (o, k) { if (o.right) idx = k; });
  H.click(opts[idx]);
  H.tick(20);
  var nx = H.maybe(".bn-next");
  if (!nx) break;
  H.click(nx);
  H.tick(20);
}
H.ok(guard <= 12, "the chain terminated (" + guard + " rounds walked)");
H.ok(H.maybe(".bonus") === null, "the bonus panel is gone once the chain ends");

/* ── 6 · the result sheet ────────────────────────────────────────────────── */
H.section("6 · the result sheet actually appears");
H.tick(400);
var modal = H.maybe(".ac-modal");
H.ok(modal !== null, "a result sheet exists");
H.ok(modal.classList.contains("show"), "…and it is SHOWN synchronously, not inside a rAF");
H.ok(H.maybe(".ac-score") !== null, "the sheet shows a score");
H.ok(H.visible(modal).join(" ").indexOf("GOT IT") >= 0, "the sheet says GOT IT");
H.ok(H.maybe("#ac-share") !== null, "there is a Share button");
var sheetText = H.visible(modal).join(" ");
H.ok(sheetText.indexOf("stamped in your passport") >= 0, "the sheet mentions the stamp");
H.ok(/bonus rounds \d of \d/.test(sheetText), "the sheet tallies the bonus rounds");

var card = A.shareCard("flagle", FL.state().day);
H.ok(card.indexOf("FLAGLE") === 0, "share card starts with the cabinet name");
H.ok(card.indexOf("4/6") > 0, "share card carries the score");
H.ok(/[🟩🟥]{3}\n[🟩🟥]{3}/.test(card), "share card carries the 3×2 grid:\n" + card);

/* ── 7 · finish is called exactly once ───────────────────────────────────── */
H.section("7 · A.finish exactly once, and re-entry");
var stats = A.stats("flagle");
H.eq(stats.played, 1, "one play recorded, not two (bonus rounds must not re-finish)");
H.eq(stats.wins, 1, "one win");
H.eq(stats.curve["4"], 1, "the guess-distribution got exactly one entry at 4");

/* reload the same day: the sheet comes back, stats do not move */
var day = FL.state().day;
var keep = {};
Object.keys(H.store()).forEach(function (k) { keep[k] = H.store()[k]; });
H.reset();
Object.keys(keep).forEach(function (k) { H.store()[k] = keep[k]; });
H.url("");
H.html("games/flagle/index.html");
CORE.forEach(load);
load("games/flagle/game.js");
H.boot();
H.tick(600);
H.ok(H.maybe(".ac-modal") !== null, "re-entering the day re-shows the sheet");
H.eq(A.stats("flagle").played, 1, "…and does not double-count the play");
H.eq(window.__FL.state().tilesShown, 6, "…and shows the whole flag");
H.ok(/bonus rounds \d of \d/.test(H.visible(H.maybe(".ac-modal")).join(" ")),
     "…and still shows the bonus tally, restored from storage");
H.ok(A.shareCard("flagle", day).split("\n").length >= 4,
     "…and the share card still carries the bonus row");

/* ── 8 · archive and practice ────────────────────────────────────────────── */
H.section("8 · archive ?d=<n> and practice ?practice=1");
var d0 = boot("?d=0");
H.eq(d0.state().day, 0, "?d=0 loads day 0");
var d0ans = d0.answer();
var d0again = boot("?d=0");
H.eq(d0again.answer(), d0ans, "day 0 is the same flag every time");
var d3 = boot("?d=3");
H.eq(d3.state().day, 3, "?d=3 loads day 3");

var p = boot("?practice=1");
H.eq(p.state().day, A.PRACTICE, "?practice=1 is practice mode");
H.ok(!!p.answer(), "practice picked a flag: " + p.answer());
var before = A.stats("flagle").played;
var pans = p.answer();
typeGuess(pans);
H.tick(400);
H.eq(A.stats("flagle").played, before, "a practice win does not touch the daily stats");
H.ok(!!A.passport()[pans], "…but it does still stamp the passport");

/* ── 9 · a full loss ─────────────────────────────────────────────────────── */
H.section("9 · losing");
FL = boot("?d=5");
for (var j = 0; j < 6; j++) typeGuess(wrongOne(FL));
H.eq(FL.state().guesses.length, 6, "six guesses used");
H.ok(FL.state().over, "the game ended after the sixth");
var lostState = JSON.parse(H.store()["ag_d:flagle:5"] || "null");
H.eq(lostState.won, false, "recorded as a loss");
H.eq(lostState.detail, "X/6", "detail is X/6");
H.ok(lostState.norm <= 15, "a loss scores " + lostState.norm + " (bottom of the barrel)");
H.eq(lostState.shareGrid.join(""), "🟥🟥🟥🟥🟥🟥", "the loss share grid is all red");
H.ok(H.maybe(".bonus") !== null, "the bonus rounds run after a loss too");
H.click(H.find(".bn-skip"));
H.tick(400);
H.ok(H.maybe(".ac-modal") !== null, "skipping the bonus rounds goes straight to the sheet");
H.ok(H.visible(H.maybe(".ac-modal")).join(" ").indexOf("NOT THIS TIME") >= 0, "the sheet says NOT THIS TIME");
H.eq(FL.state().tilesShown, 6, "a loss still reveals the whole flag");

/* ── 10 · the answer pool ────────────────────────────────────────────────── */
H.section("10 · pools");
var st = FL.state();
H.ok(st.answerPool > 190, st.answerPool + " countries can be the answer");
H.ok(st.guessPool >= st.answerPool, st.guessPool + " can be typed (territories included)");
["IR", "GB", "US", "IL", "TJ"].forEach(function (iso) {
  var hit = false;
  for (var k = 0; k <= 400; k++) if (window.AD_COUNTRIES.filter(function (c) { return c.i === iso; }).length) { hit = true; break; }
  H.ok(hit, iso + " is in the data (CONTRACT §7)");
});
/* every day of the next year must build a playable puzzle */
var bad = [];
for (var d = 0; d < 366; d++) {
  var iso = null;
  try { iso = A.dailyIndex("flagle", d, st.answerPool); } catch (e) { bad.push(d); }
  if (iso === null || iso === undefined || iso < 0 || iso >= st.answerPool) bad.push(d);
}
H.eq(bad.length, 0, "every day for a year resolves to a real pool slot");

/* ── 11 · design tokens ──────────────────────────────────────────────────── */
H.section("11 · design system");
var css = readFile("games/flagle/index.html");
var styleBlock = /<style>([\s\S]*?)<\/style>/.exec(css)[1];
var hexes = styleBlock.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
H.eq(hexes.length, 0, "no literal hex in the cabinet's CSS" + (hexes.length ? " — " + hexes.join(" ") : ""));
var js = readFile("games/flagle/game.js");
var jsHex = (js.match(/["']#[0-9a-fA-F]{3,8}["']/g) || []);
H.ok(jsHex.length <= 3, "hex in game.js only as canvas fallbacks: " + jsHex.join(" "));
H.ok(styleBlock.indexOf("var(--") > 0, "the cabinet's CSS uses the shared tokens");
/* control labels carry no emoji */
["ac-pill", "ac-btn", "bn-next", "bn-skip"].forEach(function (cls) {
  var hit = (js.match(new RegExp('"' + cls + '[^"]*",\\s*\\n?\\s*"([^"]*)"', "g")) || []).join(" ");
  H.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(hit), "no emoji in ." + cls + " labels");
});

/* ── 12 · THE WHOLE ARCHIVE ──────────────────────────────────────────────
   Not a sample. Every day of the archive is booted, played to a win through
   the picker, and checked. `A.dailyIndex` walks a seeded permutation of the
   pool, so one full cycle visits every answer exactly once — i.e. this is also
   a sweep of every flag that can ever be the answer. */
H.section("12 · every single day in the archive");
var DAYS = FL.state().answerPool;
var hist = {}, per = {}, thin = [], seen = {}, unsolved = [], noSvg = [];
var badPerm = [], nonMono = [], noPick = [], shareBad = [], wrongDay = [];
var shortRich = [], shortThin = [];
for (var dd = 0; dd < DAYS; dd++) {
  /* MOVE THE CALENDAR, don't just ask for the day. A.requestedDay() clamps ?d=
     to today — you cannot play tomorrow's puzzle — so a sweep that only sets
     the query string re-tests TODAY on every iteration. This loop used to do
     exactly that and reported "232 days" having seen 16 flags. H.atDay(n) makes
     today BE day n, and it has to happen before boot() because the cabinet reads
     its day once, at load. */
  H.atDay(dd);
  var f = boot("?d=" + dd);
  var a = f.answer();
  if (f.state().day !== dd) wrongDay.push(dd + "→" + f.state().day);
  seen[a] = (seen[a] || 0) + 1;

  // the artwork the cabinet is about must exist on disk
  try { readFile("core/data/flags/" + a + ".svg"); } catch (e) { noSvg.push(a); }

  // reveal order: a permutation, and never a telling tile before a flat one
  var o = f.order(), w = f.weights(a);
  if (o.slice().sort().join("") !== "012345") badPerm.push(dd);
  for (var q = 1; q < 6; q++) if (w[o[q]] < w[o[q - 1]]) nonMono.push(dd + ":" + a);

  // bonus rounds
  var rr = f.rounds();
  hist[rr.length] = (hist[rr.length] || 0) + 1;
  rr.forEach(function (r) { per[r.id] = (per[r.id] || 0) + 1; });
  if (rr.length < 3) thin.push(a + " (" + rr.length + ")");
  // A day shorter than five has to be short because the COUNTRY's record is
  // short — never because a builder quietly stopped building. SHAPE wants
  // ≥10,000 km² (game.js SHAPE_MIN_AREA) and NEIGHBOURS wants a land border.
  if (rr.length < 5) {
    var cr = null;
    (window.AD_COUNTRIES || []).forEach(function (c) { if (c.i === a) cr = c; });
    var canShape = ((cr && cr.area) || 0) >= 10000, canBord = ((cr && cr.bord) || []).length > 0;
    (canShape && canBord ? shortRich : shortThin).push(a + "(" + rr.length + ")");
  }

  // SOLVABLE — through the real picker and the real suggestion button
  var rec = null;
  (window.AD_COUNTRIES || []).forEach(function (c) { if (c.i === a) rec = c; });
  H.type(H.find(".ac-picker input"), rec.n);
  var btn = H.maybe('.ac-picker .sug button[data-i="' + a + '"]');
  if (!btn) { H.type(H.find(".ac-picker input"), a); btn = H.maybe('.ac-picker .sug button[data-i="' + a + '"]'); }
  if (!btn) { noPick.push(a + "/" + rec.n); continue; }
  H.click(btn);
  H.tick(20);
  var st = f.state();
  if (!st.over || st.guesses[0] !== a || st.tilesShown !== 6) unsolved.push(dd + ":" + a);
  var g = f.shareGrid(true).join("");
  if (g.length / 2 !== 6 || g.indexOf("🟥") >= 0) shareBad.push(dd + ":" + a);
}
H.calendar(null);                    // real clock back, for everything after this
print("  days swept:     " + DAYS);
print("  rounds per day: " + JSON.stringify(hist));
print("  per round:      " + JSON.stringify(per));
H.eq(wrongDay.length, 0, "the sweep really walked the archive rather than re-testing today" +
     (wrongDay.length ? " — " + wrongDay.slice(0, 6) : ""));
H.eq(Object.keys(seen).length, DAYS, "one full cycle visits every answer exactly once — " +
     Object.keys(seen).length + " distinct flags over " + DAYS + " days, no repeat");
H.eq(noSvg.length, 0, "every answer has its SVG on disk" + (noSvg.length ? " — " + noSvg : ""));
H.eq(badPerm.length, 0, "every day's reveal order is a permutation of all six tiles");
H.eq(nonMono.length, 0, "no day ever opens a telling tile before a flatter one" +
     (nonMono.length ? " — " + nonMono.slice(0, 6) : ""));
H.eq(noPick.length, 0, "every answer can be TYPED and picked from the suggestions" +
     (noPick.length ? " — " + noPick.slice(0, 6) : ""));
H.eq(unsolved.length, 0, "every day is solvable in one guess through the buttons" +
     (unsolved.length ? " — " + unsolved.slice(0, 6) : ""));
H.eq(shareBad.length, 0, "every day's one-guess share grid is six clean greens");
H.eq(thin.length, 0, "no day gets fewer than three bonus rounds" +
     (thin.length ? " — " + thin.slice(0, 10).join(", ") : ""));
/* This used to demand that 90% of days got the full five, and passed only
   because the sweep above was re-testing today. Run honestly the true figure is
   179 of 232, and the shortfall is not a defect: SHAPE needs a country whose
   outline reads at tile size and NEIGHBOURS needs a land border, and 53 of the
   possible answers are small islands with neither — Malta, Barbados, Tuvalu.
   game.js builds for exactly that, naming HOW MANY "the backstop … which keeps
   an island with no border and no shape from getting a thin chain". So the
   honest invariant is not a percentage anybody picked, it is: nobody gets fewer
   rounds than their own record can fill. */
print("  four-round days: " + shortThin.length + " (small islands: no outline, no land border)");
H.eq(shortRich.length, 0, "every answer with both an outline and a land border gets the full five" +
     (shortRich.length ? " — " + shortRich.slice(0, 8).join(", ") : ""));
H.eq((hist[5] || 0) + shortThin.length, DAYS,
     (hist[5] || 0) + " days get the full five and the other " + shortThin.length +
     " are exactly the ones the data cannot fill");
["shape", "capital", "border", "tongue", "coin", "people"].forEach(function (id) {
  H.ok((per[id] || 0) > 0, "the " + id.toUpperCase() + " round builds (" + (per[id] || 0) + "/" + DAYS + ")");
});

/* ── 13 · is it actually hard? ────────────────────────────────────────────
   The complaint that started this rebuild was "it's way too easy". Two things
   have to hold. The SCORE CURVE has to put a good day where CONTRACT §3 says,
   and the FEEDBACK must not hand the answer over in one move. */
H.section("13 · difficulty, honestly");
var FD = boot("");
H.eq(FD.norm[1], 100, "a 1-guess win — every tile shut, pure recall or luck — is the 100");
H.ok(FD.norm[2] < 100, "a 2-guess win is " + FD.norm[2] + ", short of 100");
H.ok(FD.norm[3] >= 85 && FD.norm[3] <= 92, "a 3-guess win is " + FD.norm[3] +
     " — the 'excellent day ≈90' of CONTRACT §3 / §7");
H.ok(FD.norm[4] >= 70 && FD.norm[4] <= 75, "a 4-guess win is " + FD.norm[4] +
     " — the 'good day ≈70-75'");
H.ok(FD.norm[5] < FD.norm[4] && FD.norm[6] < FD.norm[5], "5 and 6 fall away: " +
     FD.norm[5] + ", " + FD.norm[6]);
var only100 = FD.norm.filter(function (n) { return n === 100; }).length;
H.eq(only100, 1, "exactly one guess count scores 100, so 100 is never routine");

/* The affinity line replaced flagle.io's proximity %. It has to narrow the
   field without naming the answer. Measured across the whole pool against a
   fixed probe: how many possible answers would print the SAME LINE? If that is
   ever 1, the readout IS the answer.

   The bucket key must be the sentence the player actually READS, not the values
   behind it, and it is now taken straight out of the cabinet's own
   affinityLine(). Keying on (shared, of) instead — as this did — got it wrong
   in BOTH directions: it invented a leak that is never printed (when nothing is
   shared the line says "no colour in common" and withholds the colour count, so
   one real bucket of three was scored as three phantom singletons) and it hid
   three real ones (it collapsed the named trait to a yes/no, and "2 of 5
   colours · also has tricolour" fits exactly one country). */
var PROBE = "FR";
var buckets = {}, worst = 1e9, worstLine = "";
for (var pi = 0; pi < DAYS; pi++) {
  var iso = null, k = 0;
  window.AD_COUNTRIES.forEach(function (c) {
    if (!window.AD_FLAGS[c.i] || !(c.un === 1 || (c.pop || 0) >= 10000) || !(c.capll || c.ll)) return;
    if (k++ === A.dailyIndex("flagle", pi, DAYS)) iso = c.i;
  });
  if (!iso || iso === PROBE) continue;
  var line = FD.affinityLine(PROBE, iso) || "(nothing at all)";
  buckets[line] = (buckets[line] || 0) + 1;
}
Object.keys(buckets).forEach(function (k2) {
  if (buckets[k2] < worst) { worst = buckets[k2]; worstLine = k2; }
});
print("  affinity lines vs " + PROBE + ": " + JSON.stringify(buckets));
H.ok(worst >= 2, "the flag-affinity readout never singles out one country — the " +
     "narrowest line (“" + worstLine + "”) still fits " + worst + " of them");

/* One probe proves one probe, so sweep all 250 typeable guesses × 232 possible
   answers (~3 s). But sweep for the right property.

   "No line anywhere ever fits a single answer" is NOT achievable and should not
   be asked for. 232 answers against a readout with ~25 distinct values must
   leave thin buckets somewhere: Sri Lanka's palette is odd enough that 67
   different guesses describe it uniquely, and India's flag shares all three of
   its colours with exactly one possible answer. The only way to close that is
   to flatten "2 of 4 colours" into "some colours in common" — which is the
   decorative proximity % this readout exists to replace. And a unique colour
   line does not NAME anybody: you still have to work out which country has
   those colours, from flags.js data you have not memorised, while the distance
   and arrow on the same row are narrowing the field far harder anyway.

   What the cabinet does guarantee, and what regressions would break, is that
   THE TRAIT CLAUSE is never what singles a country out — that is the whole job
   of the coarsening ladder in game.js, and it must hold for every guess. */
var traitDecides = [], answers = [], typeable = [];
window.AD_COUNTRIES.forEach(function (c) {
  if (!window.AD_FLAGS[c.i] || !(c.capll || c.ll)) return;
  typeable.push(c.i);
  if (c.un === 1 || (c.pop || 0) >= 10000) answers.push(c.i);
});
var lonely = 0, lonelyWho = {};
typeable.forEach(function (g) {
  var tal = {}, who = {};
  answers.forEach(function (x) {
    if (x === g) return;
    var t = FD.affinityLine(g, x);
    tal[t] = (tal[t] || 0) + 1; who[t] = x;
  });
  Object.keys(tal).forEach(function (t) {
    if (tal[t] >= 2) return;
    lonely++; lonelyWho[who[t]] = 1;
    if (t.indexOf(" · ") >= 0) traitDecides.push(g + " → “" + t + "”");
  });
});
print("  swept " + typeable.length + " guesses × " + answers.length + " answers: " +
      lonely + " lines fit only one answer, all of them bare colour counts, " +
      "reaching " + Object.keys(lonelyWho).length + " of the " + answers.length + " answers");
H.eq(traitDecides.length, 0, "across every guess in the game, the named trait is never " +
     "what singles a country out" + (traitDecides.length ? " — " + traitDecides.slice(0, 6).join("; ") : ""));

H.done();
