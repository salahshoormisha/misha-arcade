/* t_timeguessr.js — drive TIMEGUESSR through its own buttons, field, slider
   and map, with no browser.
     JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
     $JSC _build/harness.js -e 'load("_build/t_timeguessr.js")'

   Everything here goes through a real control: H.click on the real element, a
   real `input` event on the real field, a real pointer tap on the real canvas.
   Nothing calls the function under the button — that is exactly how this arcade
   shipped a dead END TURN past 300 passing tests.                            */

var PAGE = "games/timeguessr/index.html";

/* Load the page's OWN script list, in the page's own order, so a <script> the
   page forgets fails here rather than in her browser. */
function loadPage(search, keepStore) {
  // H.reset() wipes localStorage, which is right for a fresh browser and wrong
  // for a reload — carry the saved keys across when we are testing re-entry.
  var keep = null;
  if (keepStore) {
    keep = {};
    var s = H.store();
    Object.keys(s).forEach(function (k) { keep[k] = s[k]; });
  }
  H.reset();
  if (keep) Object.keys(keep).forEach(function (k) { localStorage.setItem(k, keep[k]); });
  H.url(search === undefined ? "" : search);
  H.html(PAGE);
  var dir = PAGE.replace(/[^/]*$/, "");
  H.scripts.forEach(function (s) { load(resolve(dir + s.replace(/\?.*$/, ""))); });
  H.boot();
  // Give the map canvas a real size: every rect is zero in the harness, and a
  // zero-wide map projects every tap onto the same pixel.
  var cv = H.find("#gmap");
  cv.offsetWidth = 420; cv.offsetHeight = 200;
  window.__TG.state();                       // touch it so a boot throw surfaces here
  return window.__TG;
}
function resolve(p) {
  var out = [];
  p.split("/").forEach(function (seg) {
    if (seg === "..") out.pop(); else if (seg && seg !== ".") out.push(seg);
  });
  return out.join("/");
}

function sheetShown() {
  var boxes = H.all(".ac-modal.show");
  for (var i = 0; i < boxes.length; i++) {
    if (boxes[i].querySelector("#ac-share")) return boxes[i];
  }
  return null;
}
function closeSheet() {
  var s = sheetShown();
  if (s) H.click(s.querySelector(".x"));
  H.tick(400);
}
/* Every finish A.finish() has written, across every day. */
function finishes() {
  var st = H.store(), out = [];
  Object.keys(st).forEach(function (k) {
    if (k.indexOf("ag_d:timeguessr:") !== 0) return;
    var v = JSON.parse(st[k]);
    if (v && v.done) out.push({ key: k, v: v });
  });
  return out;
}

/* ══ 1. boot ═══════════════════════════════════════════════════════════════ */
H.section("boot: the page builds and the controls exist");
var T = loadPage();
var st = T.state();

H.ok(!!window.__TG, "__TG debug hook exists");
H.eq(st.rounds.length, 5, "five rounds drawn");
H.eq(new Set(st.rounds.map(function (x) { return x.id; })).size, 5, "no duplicate photo in a day");
H.eq(new Set(st.rounds.map(function (x) { return x.iso2; })).size, 5, "five different countries");
H.ok(st.rounds.every(function (x) { return isFinite(x.year) && isFinite(x.lat) && isFinite(x.lon); }),
     "every round has a year and a coordinate");
H.ok(!!H.maybe("#go") && !!H.maybe("#year") && !!H.maybe("#slider") && !!H.maybe("#gmap"),
     "go button, year field, slider and map are all in the DOM");
H.ok(!!H.maybe("#yminus") && !!H.maybe("#yplus"), "both year nudges are in the DOM");
H.ok(/ROUND 1 OF 5/.test(H.text("#ac-sub")), "subtitle names the round: " + H.text("#ac-sub"));

H.section("the year range is READ FROM THE DATA, not hard-coded");
var years = window.AD_PHOTOS.time.map(function (p) { return p.year; });
var lo = Math.min.apply(null, years), hi = Math.max.apply(null, years);
H.eq(st.yMin, lo, "slider min is the pool's real minimum year");
H.eq(st.yMax, hi, "slider max is the pool's real maximum year");
H.eq(H.find("#slider").getAttribute("min"), String(lo), "the slider element carries it too");
H.eq(H.find("#slider").getAttribute("max"), String(hi), "…and its max");
H.eq(H.find("#year").getAttribute("max"), String(hi), "so does the typed field");
H.eq(H.text("#e0"), String(lo), "the scale under the slider is labelled at its left end");
H.eq(H.text("#e1"), String(hi), "…and at its right end");
H.eq(st.year, Math.round((lo + hi) / 2), "a round opens at the midpoint, not at your last guess");

H.section("the year control, at both extremes and past them");
H.eq(T.type(hi + 40), hi, "typing a year past the end clamps to the max");
H.eq(T.type(lo - 40), lo, "typing one before the start clamps to the min");
H.eq(H.find("#slider").value, String(lo), "the slider follows the field");
H.eq(T.slide(1974), 1974, "dragging the slider sets the year");
H.eq(H.find("#year").value, "1974", "…and the field follows the slider");
H.eq(T.nudge(-1), 1973, "a tap on the back nudge steps one year back");
H.eq(T.nudge(1), 1974, "a tap on the forward nudge steps one year forward");
H.eq(T.nudgeKey(-1), 1973, "the same button from the keyboard steps once, not twice");
H.eq(T.nudgeKey(1), 1974, "…in both directions");
T.slide(lo);
H.eq(T.nudge(-1), lo, "nudging below the minimum stays at the minimum");
T.slide(hi);
H.eq(T.nudge(1), hi, "nudging above the maximum stays at the maximum");

H.section("hold-to-repeat on the nudge (400 ms, then a year every 80 ms)");
T.slide(1900);
var minus = H.find("#yminus");
minus.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
H.eq(T.state().year, 1899, "press: one year straight away");
H.tick(390);
H.eq(T.state().year, 1899, "…and nothing more before the 400 ms delay");
H.tick(90 + 80 * 3);
H.ok(T.state().year <= 1895, "…then it runs: " + T.state().year);
minus.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
var parked = T.state().year;
H.tick(1000);
H.eq(T.state().year, parked, "release stops it");

/* ══ 2. the pin, at its extremes ════════════════════════════════════════════ */
H.section("the pin: a real tap on the real canvas");
H.eq(T.state().pin, null, "no pin at the start of a round");
H.eq(H.find("#pinread").className, "pinread empty", "the readout says so");
var p1 = T.drop(51.5, -0.12);                      // London
H.ok(!!p1, "a tap on the map drops a pin");
H.near(p1[0], 51.5, 1.2, "pin latitude is where we tapped");
H.near(p1[1], -0.12, 2.5, "pin longitude is where we tapped");
H.ok(/United Kingdom/.test(H.text("#pinread")), "the readout names the country: " + H.text("#pinread"));
var p2 = T.drop(-41, 174);                          // the far corner
H.near(p2[0], -41, 2, "tapping again MOVES the pin rather than adding one");
H.ok(/S/.test(H.text("#pinread")) && /E/.test(H.text("#pinread")),
     "southern/eastern hemisphere reads back: " + H.text("#pinread"));

H.section("map controls");
var before = H.find("#gmap")._ctx ? 1 : 1;
H.click("#zin");  H.ok(true, "zoom in did not throw");
H.click("#zout"); H.ok(true, "zoom out did not throw");
H.click("#zres"); H.ok(true, "whole world did not throw");
H.ok(!!T.state().pin, "the pin survives zooming");

/* ══ 3. round 1, resolved, and the payoff ══════════════════════════════════ */
H.section("round 1: submit through the real button");
var a = T.answer();
T.type(a.year + 3);
T.drop(a.lat + 1, a.lon);                      // ~111 km north
H.click("#go");
var s1 = T.state();
H.ok(s1.resolved, "the round resolved");
H.eq(s1.yScore[0], 3930, "3 years off scores 3,930");
H.ok(s1.pScore[0] > 4400 && s1.pScore[0] < 5000, "~111 km scores " + s1.pScore[0]);
H.ok(!H.find("#rv").classList.contains("hide"), "the result card is visible, not hidden");
H.ok(H.find("#rv").innerHTML.indexOf(String(a.year)) >= 0, "it shows the true year");
H.ok(H.text("#rv").indexOf(a.place) >= 0, "it names the place: " + a.place);
var seen = H.visible(H.find("#rv")).join(" ");
H.ok(/years off/.test(seen), "it says how many years off");
H.ok(/your pin/.test(seen) && /the real place/.test(seen), "the map legend is spelled out");
H.ok(H.find("#rv").querySelector(".ac-credit") !== null, "the credit and licence are rendered");
H.ok(/commons\.wikimedia\.org/.test(H.find("#rv").innerHTML), "…with the link to the file");
var full = H.maybe(".full");
H.ok(!!full && H.text(full).length > 20,
     "the caption payoff is shown: " + H.text(full).slice(0, 70) + "…");
H.eq(H.text("#go"), "Next round", "the button becomes Next round");
H.eq(H.find("#year").disabled, true, "the year field locks once the round is resolved");

H.section("an unanswered round: submit with no pin at all");
H.click("#go");                                  // to round 2
H.eq(T.state().r, 1, "we are on round 2");
H.eq(T.state().pin, null, "the pin is cleared for the new round");
H.eq(H.find("#rv").className, "rv hide", "and the old result card is hidden again");
var a2 = T.answer();
T.type(a2.year);                                 // year right, no pin
H.click("#go");
var s2 = T.state();
H.eq(s2.yScore[1], 5000, "the year still scores full marks with no pin");
H.eq(s2.pScore[1], 0, "the place scores nothing");
H.eq(s2.distKm[1], null, "and no distance is recorded");
H.ok(/no pin/i.test(H.text("#rv")), "the card says the place was forfeited");
H.ok(/🌍⬛⬛⬛/.test(T.share()[1]), "its share row shows an empty globe block: " + T.share()[1]);
H.ok(/📅🟩🟩🟩/.test(T.share()[1]), "…and a full calendar block");
H.ok(/🌍⬛⬛⬛ 📅⬛⬛⬛/.test(T.share()[4]), "a round never reached is blank on both sides");

/* ══ 4. finish the game ════════════════════════════════════════════════════ */
H.section("rounds 3-5, then the final score");
H.click("#go");                                  // to round 3
for (var i = 0; i < 3; i++) {
  var ai = T.answer();
  T.type(ai.year + (i === 0 ? 0 : 6));
  T.drop(ai.lat + (i === 0 ? 0.05 : 4), ai.lon);
  H.click("#go");                                // submit
  H.click("#go");                                // next / final score
}
var fin = T.state();
H.ok(fin.over, "the game is over");
H.eq(fin.yScore.filter(function (x) { return x !== null; }).length, 5, "all five rounds scored");
H.ok(fin.total > 0 && fin.total <= 50000, "total is inside 0…50,000: " + fin.total);
H.eq(fin.norm, T.points.norm(fin.total), "norm matches the published curve");
H.ok(fin.norm > 40 && fin.norm < 100, "norm is in a sane band for this game: " + fin.norm);

H.section("the result sheet actually appeared");
var sh = sheetShown();
H.ok(!!sh, "a result sheet is on screen with a share control");
H.ok(/\d/.test(H.text(sh.querySelector(".ac-score"))), "it shows the norm: " +
     H.text(sh.querySelector(".ac-score")));
H.ok(H.text(sh).indexOf("50,000") >= 0, "and the score out of 50,000");
H.ok(H.text(sh).indexOf("PAR") >= 0, "par is offered to beat");

H.section("the share grid");
var grid = T.share();
H.eq(grid.length, 5, "five rows, one per round");
// the /u flag matters: 🟩 and 🟨 are surrogate pairs, so an unflagged character
// class would count UTF-16 units instead of squares
H.ok(grid.every(function (row) { return /^🌍[🟩🟨⬛]{3} 📅[🟩🟨⬛]{3}$/u.test(row); }),
     "every row is globe+3 and calendar+3:\n    " + grid.join("\n    "));
var txt = T.shareText();
H.ok(/^TIMEGUESSR #\d+ [\d,]+\/50,000$/.test(txt.split("\n")[0]), "header line: " + txt.split("\n")[0]);
H.ok(txt.indexOf(A.SITE) > 0, "the share text carries the arcade link");
var card = A.shareCard("timeguessr", T.state().day);
H.ok(card.indexOf("TIMEGUESSR #") === 0 && card.indexOf("🌍") > 0,
     "A.shareCard builds the same grid: " + card.split("\n")[0]);

H.section("the round-by-round summary is left on the page");
var rows = H.all(".sumrow");
H.ok(rows.length >= 5, "a summary row per round (" + rows.length + " rows)");
H.ok(H.text("#sum").indexOf(fin.rounds[0].place) >= 0, "it names the places");
H.ok(H.text("#sum").indexOf(String(fin.rounds[0].year)) >= 0, "…and the years");

H.section("A.finish ran exactly once, with a sane norm");
var f = finishes();
H.eq(f.length, 1, "exactly one finished day is stored");
H.eq(f[0].v.norm, fin.norm, "the stored norm is the one the game computed");
H.ok(f[0].v.norm >= 0 && f[0].v.norm <= 100, "0 ≤ norm ≤ 100");
H.eq(f[0].v.shareGrid.length, 5, "the share grid was stored for the league");
H.eq(A.stats("timeguessr").played, 1, "stats counted one play");
H.eq(H.find("#go").disabled, true, "the button is disabled once the game is over");
// dispatch a click anyway: a disabled button cannot be pressed, but the handler
// under it must still be idempotent, because reload and re-entry reach it too
H.find("#go").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
H.flush();
H.eq(finishes().length, 1, "firing it again after the end does not finish twice");
H.eq(A.stats("timeguessr").played, 1, "…and does not double-count the play");

H.section("passport stamps");
var pp = A.passport(), stamped = Object.keys(pp);
H.ok(stamped.length >= 1, "at least one country was stamped: " + stamped.join(","));
H.ok(stamped.every(function (c) { return pp[c].games.indexOf("timeguessr") >= 0; }),
     "every stamp credits this cabinet");
H.ok(f[0].v.stamps.length === stamped.length, "the finish record lists the same stamps");
var unearned = [];
fin.rounds.forEach(function (x, i) {
  var earned = fin.gotCountry[i] || (fin.distKm[i] !== null && fin.distKm[i] <= 250);
  if (!earned && stamped.indexOf(x.iso2) >= 0) unearned.push(x.iso2);
});
H.eq(unearned.length, 0, "nothing was stamped that wasn't earned (in-country, or within 250 km)");

H.section("reload: the day comes back exactly as it was left");
var was = fin.total;
T = loadPage("", true);                          // same browser, same storage
H.ok(T.state().over, "a finished day comes back finished");
H.eq(T.state().total, was, "with the same total");
H.tick(400);
H.ok(!!sheetShown(), "and it puts the sheet straight back up");
H.eq(finishes().length, 1, "re-entry does not finish the day a second time");
closeSheet();

/* ══ 5. a dead photo ═══════════════════════════════════════════════════════ */
H.section("a photograph that fails to load");
H.reset();
T = loadPage("?practice=1");
H.eq(T.state().dead, false, "the picture is assumed fine to start with");
H.ok(H.find("#miss").style.display === "none", "no failure notice up front");
T.photoFailed();                                 // the img element's own error event
var d = T.state();
H.eq(d.dead, true, "the game noticed");
H.ok(H.find("#pwrap").classList.contains("dead"), "the frame is marked dead");
H.ok(H.find("#miss").style.display !== "none", "the notice is shown instead of a broken image");
H.eq(H.find("#shot").style.display, "none", "the broken <img> is hidden, never displayed");
H.ok(/Without the picture/.test(H.text("#cap")), "the caption takes over as the round: " +
     H.text("#cap").slice(0, 60) + "…");
var deadAns = T.answer();
T.type(deadAns.year + 1);
T.drop(deadAns.lat, deadAns.lon);
H.click("#go");
H.eq(T.state().yScore[0], 4800, "the round is still fully playable and scores normally");
H.ok(T.state().pScore[0] === 5000, "…including the place half");
H.click("#go");
H.eq(T.state().r, 1, "and it advances to the next round");
H.eq(T.state().dead, false, "which starts with a clean frame again");
T.photoLoaded();
H.ok(!H.find("#pwrap").classList.contains("dead"), "a photo that loads clears the dead state");

/* ══ 6. practice and archive ═══════════════════════════════════════════════ */
H.section("?practice=1");
T = loadPage("?practice=1");
H.eq(T.state().practice, true, "practice mode is on");
H.ok(/PRACTICE/.test(H.text("#ac-sub")), "the subtitle says so: " + H.text("#ac-sub"));
var before2 = A.stats("timeguessr").played;
T.autoplay(2, 60);
H.ok(T.state().over, "a practice game plays to the end");
H.eq(A.stats("timeguessr").played, before2, "practice does NOT touch the daily stats");
H.eq(finishes().length, 0, "…and writes no finished day");
H.ok(/practice/.test(T.shareText()), "its share text is marked practice");
closeSheet();

H.section("?d=<n> archive");
T = loadPage("?d=0");
H.eq(T.state().day, 0, "day 0 loads from the URL");
var d0 = T.state().rounds.map(function (x) { return x.id; }).join(",");
T = loadPage("?d=1");
H.eq(T.state().day, 1, "day 1 loads from the URL");
var d1 = T.state().rounds.map(function (x) { return x.id; }).join(",");
H.ok(d0 !== d1, "different days draw different photographs");
T = loadPage("?d=0");
H.eq(T.state().rounds.map(function (x) { return x.id; }).join(","), d0,
     "the same day always draws the same five — two players, no server");
T.autoplay(1, 30);
var af = finishes();
H.eq(af.length, 1, "an archive day records a finish");
H.eq(af[0].key, "ag_d:timeguessr:0", "…filed under day 0, not under today");
H.eq(af[0].v.day, 0, "…and the record knows which day it was");
closeSheet();

H.section("every day of the first fortnight is playable and well-spread");
for (var dN = 0; dN < 14; dN++) {
  var set = [], sorted;
  T = loadPage("?d=" + dN);
  set = T.state().rounds;
  if (set.length !== 5) { H.ok(false, "day " + dN + " drew " + set.length + " rounds"); break; }
  var isos = new Set(set.map(function (x) { return x.iso2; }));
  var span = Math.max.apply(null, set.map(function (x) { return x.year; })) -
             Math.min.apply(null, set.map(function (x) { return x.year; }));
  if (isos.size !== 5 || span < 60) {
    H.ok(false, "day " + dN + ": " + isos.size + " countries, " + span + " years of spread");
    break;
  }
}
H.ok(true, "14 days: five countries and a wide spread of eras every time");

/* ══ 7. the scoring curves ═════════════════════════════════════════════════ */
H.section("the year curve (RESEARCH.md's staircase, made smooth)");
H.eq(T.points.year(0), 5000, "spot on is 5,000");
H.eq(T.points.year(1), 4800, "1 year off");
H.eq(T.points.year(3), 3930, "3 years off");
H.eq(T.points.year(-3), 3930, "guessing early and late are the same");
H.eq(T.points.year(10), 1952, "10 years off");
H.eq(T.points.year(20), 718, "20 years off");
H.ok(T.points.year(21) > 0, "21 years off is NOT the original's cliff-edge zero: " + T.points.year(21));
var mono = true;
for (var n = 1; n < 170; n++) if (T.points.year(n) > T.points.year(n - 1)) mono = false;
H.ok(mono, "the year curve never rewards a worse guess");

H.section("the place curve (smooth, no discontinuities)");
H.eq(T.points.place(0), 5000, "on the spot");
H.eq(T.points.place(25), 5000, "inside 25 km is full marks");
H.eq(T.points.place(null), 0, "no pin scores nothing");
H.eq(T.points.place(100), 4600, "100 km");
H.eq(T.points.place(500), 3296, "500 km");
H.eq(T.points.place(2000), 944, "2,000 km");
var smooth = true, prev = 5000;
for (var km = 0; km <= 20000; km += 7) {
  var v = T.points.place(km);
  if (v > prev + 0.001) smooth = false;
  prev = v;
}
H.ok(smooth, "monotonic over the whole globe — a nearer pin never scores worse");
H.ok(Math.abs(T.points.place(2000) - T.points.place(2000.01)) < 1,
     "no cliff at 2,000 km (the original loses 667 points for one extra metre)");

H.section("the norm mapping (CONTRACT §3)");
H.eq(T.points.norm(0), 0, "nothing scores 0");
H.eq(T.points.norm(30000), 72, "a solid day is 72");
H.eq(T.points.norm(40000), 92, "an excellent day is 92");
H.eq(T.points.norm(50000), 100, "the ceiling is 100");
H.ok(T.points.norm(45000) < 100, "45,000 of 50,000 is not yet 100: " + T.points.norm(45000));
H.ok(T.points.norm(33000) >= 70 && T.points.norm(33000) <= 80,
     "a good-not-great day lands in the 70s: " + T.points.norm(33000));
var normMono = true, pn = -1;
for (var tt = 0; tt <= 50000; tt += 250) { var nv = T.points.norm(tt); if (nv < pn) normMono = false; pn = nv; }
H.ok(normMono, "norm rises with the score, everywhere");

H.section("a realistic strong game does not hit 100");
T = loadPage("?d=4");
T.autoplay(1, 15);                               // 1 year off and 15 km out, every round
var strong = T.state();
H.ok(strong.norm >= 88, "very strong play scores highly: " + strong.norm);
H.ok(strong.norm < 100, "…but 100 still is not routine: " + strong.norm);
closeSheet();

H.section("a bad game floors sensibly");
T = loadPage("?d=5");
T.autoplay(60, 6000);                            // 60 years and 6,000 km out
var bad = T.state();
H.ok(bad.total < 3000, "a wild game banks very little: " + bad.total);
H.ok(bad.norm >= 0 && bad.norm < 15, "and norms low without going negative: " + bad.norm);
H.ok(T.share().every(function (row) { return /⬛⬛⬛/.test(row); }), "its share grid is mostly black");

H.done();
