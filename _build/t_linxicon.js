/* ============================================================================
   t_linxicon.js — drive LINXICON end to end through its own controls.
   Run: $JSC _build/harness.js -e 'load("_build/t_linxicon.js")'

   Every word in this file goes in the way a finger puts it in: into the real
   <input>, then a click on the real LINK button — which is a <button
   type="submit"> with no onclick at all, so the only thing that makes it work
   is the browser turning the click into a `submit` on the enclosing <form>.
   The harness grew that default action for this cabinet (see its header): with
   it missing, LINK fired absolutely nothing under test while working fine in a
   browser, which is precisely the dead-END-TURN shape this arcade already
   shipped once.
   ========================================================================== */

var SRC = null;
var doc = H.doc;

function loadPage(search, keepStore, semBase) {
  var keep = null;
  if (keepStore) { keep = {}; var s0 = H.store(); for (var k0 in s0) keep[k0] = s0[k0]; }
  H.reset();
  if (keep) { var s1 = H.store(); for (var k1 in keep) s1[k1] = keep[k1]; }
  H.url(search || "");
  H.html("games/linxicon/index.html");
  if (!SRC) SRC = H.scripts.map(function (s) {
    var p = s.replace(/\?v=\d+$/, "");
    return p.indexOf("../../") === 0 ? p.slice(6) : "games/linxicon/" + p;
  });
  SRC.forEach(function (f) {
    // between sem.js and game.js is the only moment SEM_BASE can be redirected,
    // which is how the "the dictionary never arrived" path gets tested
    if (f === "games/linxicon/game.js" && semBase) window.SEM_BASE = semBase;
    load(f);
  });
  H.boot();
  H.flush();
  return window.__LX;
}

/* The real control path: type, then press LINK. */
function play(word) {
  H.type(H.find("#lx-word"), word);
  H.click("#lx-add");
  return window.__LX.state();
}
/* The other real control path: type, then press Enter in the field. */
function playByEnter(word) {
  var inp = H.find("#lx-word");
  H.type(inp, word);
  doc.activeElement = inp;
  H.key("Enter");
  H.flush();
  return window.__LX.state();
}

function closeSheet() {
  var x = H.maybe(".ac-modal .x");
  if (x) H.click(x);
  H.flush();
}

/* ── boot ────────────────────────────────────────────────────────────── */

var L = loadPage("");

H.section("boot: the pair is up and the controls exist");
H.ok(!!L, "__LX debug hook exists");
var puz = L.puzzle();
H.ok(!!puz && !!puz.a && !!puz.b, "a pair was drawn: " + puz.a + " → " + puz.b);
H.ok(L.state().ready, "the vector dictionary loaded");
H.ok(!!H.maybe("#lx-word"), "the word field is in the DOM");
H.ok(!!H.maybe("#lx-add"), "LINK is in the DOM");
H.ok(!!H.maybe("#lx-hint") && !!H.maybe("#lx-undo") && !!H.maybe("#lx-give"),
     "so are STEPPING STONE, UNDO and GIVE UP");
H.ok(!!H.maybe("#lx-arch"), "and ARCHIVE");
H.eq(H.find(".lx-node.start").textContent, puz.a.toUpperCase(), "the start word is shown");
H.eq(H.find(".lx-node.target").textContent, puz.b.toUpperCase(), "…and the far word");
H.ok(!H.find(".lx-game").hidden, "the board is revealed once the dictionary is in");
H.ok(H.text("#lx-cap").indexOf("BOOK") > 0, "the cap pill quotes the book: " + H.text("#lx-cap"));
H.eq(puz.cap, puz.n + 4, "the cap is the book plus four spare links");
H.ok(!H.maybe(".lx-load"), "the loading panel is gone");

H.section("the endpoints really are far apart");
H.ok(!L.link(puz.a, puz.b), "there is no direct link between them — the puzzle is not free");

/* ── a link, through the real button ─────────────────────────────────── */

H.section("a link goes in through the LINK button");
var st = play(puz.path[1]);
H.eq(st.links, 1, "one link made");
H.eq(st.chain.length, 2, "the chain grew");
H.eq(st.chain[1], puz.path[1], "…by the word we typed");
H.eq(H.all(".lx-edge:not(.open)").length, 1, "one edge is drawn");
H.ok(H.text(".lx-edge b") !== null, "the edge shows its boldness: " + H.text(".lx-edge b"));
H.ok(/people say so|close in meaning/.test(H.text(".lx-edge em")),
     "…and why it counted: " + H.text(".lx-edge em"));
H.eq(H.find("#lx-word").value, "", "the field is cleared for the next word");
H.ok(H.text("#lx-cap").indexOf("1") === 0 || /<b>1<\/b>/.test(H.find("#lx-cap").innerHTML),
     "the cap pill counts it: " + H.text("#lx-cap"));

H.section("Enter in the field does the same thing (implicit form submission)");
var st2 = playByEnter(puz.path[2]);
H.eq(st2.links, 2, "two links now");
H.eq(st2.chain[2], puz.path[2], "…and the second word landed");

H.section("wobbles: the three ways a word is refused");
var w0 = L.state().wobbles;
play("qqzzxwv");
H.eq(L.state().wobbles, w0 + 1, "a word that isn't in the dictionary is a wobble");
H.ok(/isn't in this dictionary/.test(H.visible().join(" ")), "…and says so");
H.eq(L.state().links, 2, "no link was made");

play(puz.a);
H.eq(L.state().wobbles, w0 + 2, "a word already in the chain is a wobble");
H.ok(/Already in the chain/.test(H.visible().join(" ")), "…and says so");

/* a real word that certainly does not link from here */
var far = null, hereW = L.state().chain[L.state().chain.length - 1];
L.forEachWord(function (word) {
  if (far) return;
  if (word === hereW) return;
  if (L.state().chain.indexOf(word) >= 0) return;
  if (!L.link(hereW, word)) far = word;
}, 400);
H.ok(!!far, "found a word with no link from here: " + far);
play(far);
H.eq(L.state().wobbles, w0 + 3, "an unlinked word is a wobble");
H.ok(/No link from/.test(H.visible().join(" ")), "…and the toast names both words");
H.eq(L.state().links, 2, "still two links");

H.section("UNDO takes the last link back");
H.click("#lx-undo");
H.eq(L.state().links, 1, "one link left");
H.eq(L.state().chain.length, 2, "the chain shortened");
H.eq(L.state().wobbles, w0 + 4, "an undo costs a wobble too");
H.eq(H.all(".lx-edge:not(.open)").length, 1, "the board redrew");

H.section("the wobble penalty (first three free, then two each, capped at 20)");
H.eq(L.wobblePenalty(0), 0, "no wobbles, no penalty");
H.eq(L.wobblePenalty(3), 0, "three are free");
H.eq(L.wobblePenalty(4), 2, "the fourth costs two");
H.eq(L.wobblePenalty(20), 20, "and it stops at twenty");
H.eq(L.wobblePenalty(60), 20, "…however badly it goes");

/* ── winning, via the shipped route ──────────────────────────────────── */

H.section("walking the book route wins");
L = loadPage("?d=2");
puz = L.puzzle();
var fin = L.solve();
H.ok(fin.over && fin.won, "the chain closed: " + fin.chain.join(" → "));
H.ok(fin.links <= puz.n, "it took no more links than the book: " + fin.links + " ≤ " + puz.n);
H.eq(fin.chain[fin.chain.length - 1], puz.b, "the chain ends at the far word");
H.eq(fin.hints, 0, "with no stepping stones");
H.ok(H.find(".lx-node.target.done") !== null, "the far word is marked reached");

H.section("the result sheet appeared — behind a timer, never behind a rAF");
H.ok(!H.maybe(".ac-modal"), "…and not before its beat");
H.tick(1200);
var sheet = H.maybe(".ac-modal");
H.ok(!!sheet, "the sheet is on screen");
var txt = H.visible(sheet).join(" ");
H.ok(!!H.maybe("#ac-share"), "with a share control");
H.ok(/BOLDNESS/.test(txt), "it breaks the score into boldness…");
H.ok(/EFFICIENCY/.test(txt), "…and efficiency");
H.ok(/One route that works/.test(txt), "it prints a route that works");
H.ok(txt.indexOf(puz.path[1].toUpperCase()) >= 0, "…the real one");
H.ok(/PAR/.test(txt), "par is offered to beat");
H.eq(H.all(".lx-srow").length, fin.links, "one summary row per link");

H.section("the norm and the share grid");
var rec = JSON.parse(H.store()["ag_d:linxicon:2"]);
H.ok(rec.done && rec.won, "recorded as a win");
H.ok(rec.norm >= 55 && rec.norm <= 100, "matching the book scores strongly: " + rec.norm);
H.eq(rec.shareGrid.length, 1, "one share row");
/* the four band squares are not all the same length in UTF-16 — ⬜ is one code
   unit and the rest are surrogate pairs — so count code POINTS */
H.eq(Array.from(rec.shareGrid[0]).length, fin.links, "one block per link");
H.ok(Array.from(rec.shareGrid[0]).every(function (ch) { return "🟦🟩🟨⬜".indexOf(ch) >= 0; }),
     "made only of the four legal blocks: " + rec.shareGrid[0]);
H.ok(rec.detail.indexOf("link") > 0, "the league detail reads well: " + rec.detail);
closeSheet();

H.section("stats and the streak were written");
var stats = JSON.parse(H.store()["ag_s:linxicon"]);
H.eq(stats.played, 1, "one play");
H.eq(stats.wins, 1, "one win");
H.eq(stats.streak, 1, "streak of one");
H.eq(stats.bestNorm, rec.norm, "best norm recorded");

H.section("a reload shows the sheet again and does not double-count");
L = loadPage("?d=2", true);
H.tick(500);
H.ok(L.state().over, "the finished day restores as over");
H.ok(!!H.maybe(".ac-modal"), "and the sheet comes back");
H.eq(JSON.parse(H.store()["ag_s:linxicon"]).played, 1, "still one play");
closeSheet();

/* ── the scoring formula ─────────────────────────────────────────────── */

H.section("boldness: the timid move is the worthless one");
H.eq(L.bold(0.75), 0, "a near-synonym scores nothing");
H.eq(L.bold(0.20), 100, "a link the vectors cannot even see scores everything");
H.ok(L.bold(0.323) >= 76 && L.bold(0.323) <= 80, "the loosest legal vector step: " + L.bold(0.323));
H.eq(L.bold(0.95), 0, "and it never goes negative");
H.eq(L.bold(-0.5), 100, "…or past a hundred");
var bmono = true, bp = 101;
for (var c = -0.2; c <= 1; c += 0.02) { var bv = L.bold(c); if (bv > bp) bmono = false; bp = bv; }
H.ok(bmono, "boldness falls as the words get closer, everywhere");

H.section("the norm mapping (CONTRACT §3: a good day ~70, an excellent one ~90)");
L = loadPage("?d=3");
puz = L.puzzle();
var N = L.normFor;
H.ok(N(puz.n, 70, 0, 0, true, 1) >= 82, "matching the book with ordinary steps is strong: " +
     N(puz.n, 70, 0, 0, true, 1));
H.ok(N(puz.n + 1, 60, 0, 0, true, 1) >= 60 && N(puz.n + 1, 60, 0, 0, true, 1) <= 80,
     "one link over the book with middling steps is a solid day: " + N(puz.n + 1, 60, 0, 0, true, 1));
H.eq(N(puz.n, 100, 0, 0, true, 1), 100, "the shortest chain with a maximal leap every time is 100");
H.ok(N(puz.n, 40, 0, 0, true, 1) < 80, "all legal and all tame does not score well: " +
     N(puz.n, 40, 0, 0, true, 1));
H.eq(N(puz.n, 100, 1, 0, true, 1), 82, "a stepping stone costs 18");
H.eq(N(puz.n, 100, 2, 0, true, 1), 64, "two cost 36");
H.ok(N(puz.n, 100, 0, 9, true, 1) === 88, "nine wobbles cost twelve");
H.eq(N(0, 0, 0, 0, false, 0), 0, "losing with no ground covered is 0");
H.ok(N(0, 0, 0, 0, false, 1) <= 15, "losing with the gap closed is still ≤ 15");
H.ok(N(99, 0, 9, 99, true, 0) >= 10, "a win never scores below 10, however scruffy");

/* ── the tools ───────────────────────────────────────────────────────── */

H.section("STEPPING STONE plays a real link and charges for it");
L = loadPage("?d=4");
puz = L.puzzle();
var beforeN = L.state().links;
H.click("#lx-hint");
var afterHint = L.state();
H.eq(afterHint.hints, 1, "one stone spent");
H.ok(afterHint.links > beforeN, "and it actually played a link");
H.ok(L.link(afterHint.chain[afterHint.chain.length - 2] || puz.a,
            afterHint.chain[afterHint.chain.length - 1]),
     "the link it played is legal under the same rule the player is held to");
H.ok(H.text("#lx-hint").indexOf("(1)") > 0, "the button says one is left: " + H.text("#lx-hint"));
if (!L.state().over) {
  H.click("#lx-hint");
  H.eq(L.state().hints, 2, "the second stone is spendable");
  H.ok(H.find("#lx-hint").disabled, "and then the button is disabled");
}
closeSheet();

H.section("GIVE UP asks first, and the sheet still comes");
L = loadPage("?d=5");
H.click("#lx-give");
H.ok(!!H.maybe("#lx-yes") && !!H.maybe("#lx-no"), "a confirm modal is up");
H.click("#lx-no");
H.ok(!L.state().over, "Keep going does exactly that");
H.click("#lx-give");
H.click("#lx-yes");
H.ok(L.state().over && !L.state().won, "Give up ends the day as a loss");
H.tick(900);
H.ok(!!H.maybe(".ac-modal"), "and the sheet appears");
var lose = JSON.parse(H.store()["ag_d:linxicon:5"]);
H.eq(lose.won, false, "recorded as a loss");
H.ok(lose.norm >= 0 && lose.norm <= 15, "and scores at most 15: " + lose.norm);
/* REGRESSION: giving up before making a single link used to push an EMPTY
   string, which the sheet rendered as a blank grid box and the share text as a
   stray blank line. */
H.eq(lose.shareGrid.length, 0, "no links, no share rows " + JSON.stringify(lose.shareGrid));
H.ok(lose.shareGrid.every(function (r) { return r.length > 0; }), "so certainly no empty row");
H.ok(A.shareCard("linxicon", 5).indexOf("\n\n") < 0, "and the share card has no blank line");
H.ok(L.shareText().indexOf("\n\n") < 0, "nor does the cabinet's own share text");
H.ok(!H.maybe(".ac-grid-share"), "the sheet draws no empty grid box");
closeSheet();

H.section("the chain snaps at the cap");
L = loadPage("?d=6");
puz = L.puzzle();
var steps = 0;
while (!L.state().over && steps < 40) {
  // walk away from the target on purpose: always take the first legal word
  var here = L.state().chain[L.state().chain.length - 1], nxt = null;
  L.forEachWord(function (word) {
    if (nxt) return;
    if (word === puz.b) return;                       // never close it
    if (L.state().chain.indexOf(word) >= 0) return;
    if (L.link(here, word) && !L.link(word, puz.b)) nxt = word;
  }, 1500);
  if (!nxt) break;
  play(nxt);
  steps++;
}
var snap = L.state();
H.ok(snap.over, "the round ended on its own");
H.ok(!snap.won, "as a loss");
H.eq(snap.links, puz.cap, "exactly at the cap: " + snap.links + " of " + puz.cap);
H.ok(/chain snapped/.test(H.text("#lx-chain") || ""), "and the board says the chain snapped");
H.tick(900);
closeSheet();

/* ── the dictionary never arrives ────────────────────────────────────── */

H.section("a failed dictionary download degrades to a retry, not a hang");
L = loadPage("?d=7", false, "../../core/data/NOPE-");
H.ok(!!H.maybe(".lx-load"), "the loading panel is still up");
H.ok(/Couldn't load the dictionary/.test(H.visible().join(" ")), "it says what went wrong");
H.ok(!!H.maybe("#lx-retry"), "and offers a retry");
H.ok(H.find(".lx-game").hidden, "the board stays hidden rather than half-alive");
H.ok(H.text(".lx-node.start") === L.puzzle().a.toUpperCase(),
     "the pair is still on screen, so you can think while you fix it");
H.ok(!L.state().ready, "and nothing pretends to be ready");
window.SEM_BASE = null;

/* ── archive + practice ──────────────────────────────────────────────── */

H.section("?d=<n> archive days");
var p0 = loadPage("?d=0").puzzle();
var p1 = loadPage("?d=1").puzzle();
var p0b = loadPage("?d=0").puzzle();
H.ok(p0.a !== p1.a || p0.b !== p1.b, "two archive days are different pairs");
H.eq(p0.a + "→" + p0.b, p0b.a + "→" + p0b.b,
     "the same day is always the same pair — two players, no server");

H.section("?practice=1");
L = loadPage("?practice=1");
H.eq(L.state().practice, true, "practice mode is on");
H.eq(H.text(".ac-sub"), "Practice · unlimited", "the subtitle says so");
L.solve();
H.ok(L.state().over && L.state().won, "practice plays through to a win");
H.tick(1200);
H.ok(!!H.maybe(".ac-modal"), "and shows its own sheet");
H.eq(Object.keys(H.store()).filter(function (x) { return /^ag_d:linxicon:/.test(x); }).length, 0,
     "practice writes no finished day");
H.ok(H.store()["ag_s:linxicon"] === undefined, "…and does not touch the daily stats");
closeSheet();

/* ── THE ARCHIVE SWEEP ───────────────────────────────────────────────── */

H.section("every puzzle in the archive is winnable under the browser's own rule");
L = loadPage("");
var all = L.puzzles();
var bad = [], ends = {}, dupEnds = 0;
all.forEach(function (p, i) {
  var why = [];
  if (!L.known(p.a) || !L.known(p.b)) why.push("endpoint not in the dictionary");
  if (!p.path || p.path.length !== p.n + 1) why.push("path is " + (p.path || []).length + " long, n+1 = " + (p.n + 1));
  else {
    if (p.path[0] !== p.a || p.path[p.path.length - 1] !== p.b) why.push("path does not run a → b");
    for (var k = 0; k < p.path.length - 1; k++) {
      if (!L.link(p.path[k], p.path[k + 1])) why.push("NOT A LINK: " + p.path[k] + " → " + p.path[k + 1]);
    }
    var seen = {};
    p.path.forEach(function (w) { if (seen[w]) why.push("path repeats " + w); seen[w] = 1; });
  }
  if (L.link(p.a, p.b)) why.push("endpoints link directly — the puzzle is free");
  if (p.n < 2) why.push("n < 2");
  if (!(p.rb >= 0 && p.rb <= 100)) why.push("rb out of range: " + p.rb);
  if (p.n + 4 < p.path.length - 1) why.push("the book route does not fit inside the cap");
  var key = p.a + "|" + p.b;
  if (ends[key]) dupEnds++;
  ends[key] = 1;
  if (why.length) bad.push("#" + i + " " + p.a + "→" + p.b + ": " + why.join("; "));
});
H.ok(all.length >= 365, "there are at least a year of puzzles: " + all.length);
H.eq(bad.length, 0, "every one has a route the cabinet itself accepts" +
     (bad.length ? " — " + bad.slice(0, 4).join(" | ") : ""));
H.eq(dupEnds, 0, "no pair of endpoints is used twice");

H.section("the daily walk covers the pool without repeating");
var seenIdx = {}, dup = 0, badDay = [];
for (var d = 0; d < all.length; d++) {
  var idx = A.dailyIndex("linxicon", d, all.length);
  if (!(idx >= 0 && idx < all.length)) { badDay.push(d); continue; }
  if (seenIdx[idx]) dup++;
  seenIdx[idx] = 1;
}
H.eq(badDay.length, 0, "every day resolves to a real puzzle");
H.eq(dup, 0, "no repeat inside one pass of the pool");
H.eq(Object.keys(seenIdx).length, all.length, "…and one pass reaches every puzzle");

H.section("par tracks the day's own route rather than a flat number");
var pars = [];
for (var pd = 0; pd < 40; pd++) pars.push(A.par("linxicon", pd).par);
H.ok(Math.min.apply(null, pars) >= 55 && Math.max.apply(null, pars) <= 82,
     "par stays inside 55…82: " + Math.min.apply(null, pars) + "–" + Math.max.apply(null, pars));
H.ok(new Set(pars).size > 3, "and it actually varies by day (" + new Set(pars).size + " values)");

H.section("twelve archive days played right through the buttons");
var sweep = [], norms = [];
var DAYS = Math.min(12, A.dayNumber() + 1);
for (var day = 0; day < DAYS; day++) {
  var Q = loadPage("?d=" + day);
  var e0 = H.log.filter(function (l) { return l.indexOf("ERROR") === 0; }).length;
  var q = Q.puzzle();
  // through the real button, one word at a time, exactly as a player would
  for (var s = 1; s < q.path.length && !Q.state().over; s++) play(q.path[s]);
  H.tick(1200);
  var stt = Q.state();
  var errs = H.log.filter(function (l) { return l.indexOf("ERROR") === 0; }).length - e0;
  var r = H.store()["ag_d:linxicon:" + day];
  r = r ? JSON.parse(r) : null;
  if (errs) sweep.push("day " + day + ": " + errs + " console errors");
  else if (!stt.won) sweep.push("day " + day + " (" + q.a + "→" + q.b + ") not winnable through the buttons");
  else if (!r || !r.done) sweep.push("day " + day + ": nothing recorded");
  else if (!(r.norm >= 10 && r.norm <= 100)) sweep.push("day " + day + ": norm " + r.norm);
  else if (!r.shareGrid.length || !r.shareGrid[0]) sweep.push("day " + day + ": empty share grid");
  else if (!H.maybe(".ac-modal")) sweep.push("day " + day + ": no result sheet");
  else norms.push(r.norm);
  closeSheet();
}
H.eq(sweep.length, 0, DAYS + " days won through the buttons with a silent console" +
     (sweep.length ? " — " + sweep.slice(0, 4).join(" | ") : ""));
H.eq(norms.length, DAYS, "one score banked per day");
H.ok(Math.min.apply(null, norms) >= 55,
     "walking the book always scores at least a solid day: " +
     Math.min.apply(null, norms) + "–" + Math.max.apply(null, norms));

H.done();
