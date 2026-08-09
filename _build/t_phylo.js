/* ============================================================================
   t_phylo.js — drive PHYLO end to end through its own controls.
   Run: $JSC _build/harness.js -e 'load("_build/t_phylo.js")'

   Every guess in this file goes in the way a finger puts it in: type into the
   picker's real <input>, press Enter, let the picker's own keydown handler
   resolve the name and call onPick. Nothing calls guess() directly — the point
   of the harness is that the wiring is what is under test, and this arcade has
   already shipped a control that was wired to nothing.
   ========================================================================== */

var SRC = null;
var doc = H.doc;

function loadPage(search, keepStore) {
  var keep = null;
  if (keepStore) { keep = {}; var s = H.store(); for (var k in s) keep[k] = s[k]; }
  H.reset();
  if (keep) { var s2 = H.store(); for (var k2 in keep) s2[k2] = keep[k2]; }
  H.url(search || "");
  H.html("games/phylo/index.html");
  if (!SRC) SRC = H.scripts.map(function (s) {
    var p = s.replace(/\?v=\d+$/, "");
    return p.indexOf("../../") === 0 ? p.slice(6) : "games/phylo/" + p;
  });
  SRC.forEach(function (f) { load(f); });
  H.boot();
  return window.__PH;
}

/* Type a name into the picker and press Enter — the whole point of the file. */
function typeGuess(name) {
  var inp = H.find(".ac-picker input");
  H.type(inp, name);
  doc.activeElement = inp;
  H.key("Enter");
  H.flush();
  return window.__PH.state();
}

/* n real organisms from the shipped tree that are NOT today's answer, so a test
   that wants "some guesses in" never accidentally wins or misses. */
function decoys(n) {
  var out = [], want = window.__PH.answer().s, all = [];
  window.__PH.forEachSpecies(function (e) { all.push(e); });
  for (var i = 0; i < all.length && out.length < n; i += 37) {
    if (all[i].s !== want) out.push(all[i].n);
  }
  return out;
}

function closeSheet() {
  var x = H.maybe(".ac-modal .x");
  if (x) H.click(x);
  H.flush();
}

/* ── boot ────────────────────────────────────────────────────────────── */

var P = loadPage("");

H.section("boot: the page builds and the controls exist");
H.ok(!!P, "__PH debug hook exists");
var pool = P.pool();
H.ok(pool.all > 300, "the whole tree is loaded: " + pool.all + " organisms");
H.ok(pool.answers > 100, "the answer band is big enough: " + pool.answers);
H.ok(!!H.maybe(".ac-picker input"), "the picker input is in the DOM");
H.ok(!!H.maybe("#reveal"), "GIVE UP is in the DOM");
H.eq(H.all(".rung").length, 8, "eight rungs on the ladder");
H.eq(H.text("#lad-count"), "0 of 8 rungs", "the counter starts at nothing");
H.ok(/Name anything alive/.test(H.text(".status") || ""), "the opening line invites a guess");
H.ok(H.text(".ac-sub").indexOf("Day ") === 0, "the subtitle names the day: " + H.text(".ac-sub"));

H.section("the answer is well-formed");
var ans = P.answer();
H.ok(!!ans && !!ans.n && !!ans.s, "the answer has a common name and a binomial: " + ans.n);
H.eq(ans.l.length, 7, "seven ranked ancestors plus the species");
H.ok(ans.l.every(function (x) { return typeof x === "number" && x >= 0; }), "every rank resolves to a taxon");
H.ok(!!ans.d, "and a one-line description for the sheet");

H.section("opening with a bacterium — the play the help text recommends");
/* REGRESSION, on its own page so it really is the FIRST guess. paintStatus()
   used to build "shared down to <rank>" before checking whether anything was
   shared at all, so RANK_LABEL[-1].toLowerCase() threw on the first
   cross-domain guess: the guess never reached the list and appeared to vanish.
   The help text recommends exactly this opening. */
(function () {
  var Q = loadPage("");
  var errs0 = H.log.filter(function (l) { return l.indexOf("ERROR") === 0; }).length;
  var cross = typeGuess("Escherichia coli");
  H.eq(H.log.filter(function (l) { return l.indexOf("ERROR") === 0; }).length, errs0,
       "no error was raised");
  H.eq(cross.guesses.length, 1, "the guess landed");
  H.eq(cross.known, 0, "…sharing nothing with today's eukaryote");
  H.ok(/not even the same domain/.test(H.text(".status")), "and the status line says so plainly");
  H.eq(H.all(".guesses .gr").length, 1, "it is in the guess list");
  H.ok((H.text(".ruled") || "").indexOf("Bacteria") >= 0, "Bacteria is crossed off under the frontier");
  H.eq(H.all(".rung.on").length, 0, "no rung is claimed");
  H.eq(H.all(".rung.edge").length, 1, "the frontier is still DOMAIN");
})();
P = loadPage("");

/* ── a guess, through the picker ─────────────────────────────────────── */

H.section("a guess goes in through the picker's own input");
var st = typeGuess("Human");
H.eq(st.guesses.length, 1, "one guess recorded");
H.eq(st.guesses[0], "Human", "…and it is the one we typed");
H.eq(H.all(".guesses .gr").length, 1, "one row in the guess list");
H.ok(/parts at|FOUND|different domain/.test(H.text(".guesses .gr")), "the row says where you parted");
H.ok(H.text("#lad-count") !== "0 of 8 rungs" || P.state().known === 0,
     "the rung counter reflects what the guess taught you: " + H.text("#lad-count"));
H.ok(/closest so far/.test(H.text(".status")), "the status line names your closest guess");

H.section("the ladder shows the confirmed lineage and nothing more");
var known = P.state().known;
var onCount = H.all(".rung.on").length;
H.eq(onCount, known, "exactly the confirmed rungs are lit");
H.eq(H.all(".rung.edge").length, 1, "one frontier rung");
H.ok(H.all(".rung.off").length === 8 - known - 1, "the rest are dark");
var filled = [];
H.all(".rung.on").forEach(function (r) { filled.push(H.text(H.maybe(".tx", r))); });
H.ok(filled.every(function (t) { return t && t !== "·"; }), "every lit rung carries a real taxon name");
/* the harness does not decode entities, so the bullet arrives as its source */
H.ok(/^(·|&middot;)$/.test(H.text(".rung.edge .tx") || ""),
     "the frontier rung is blank — it is what you're hunting");

H.section("a repeat guess is refused, not double-counted");
typeGuess("Human");
H.eq(P.state().guesses.length, 1, "still one guess");
H.ok(/Already guessed/.test(H.visible().join(" ")), "and it says so");

H.section("a nonsense word is refused without breaking the round");
typeGuess("zzzzqqq");
H.eq(P.state().guesses.length, 1, "no guess was added");
H.ok(!!H.maybe(".ac-picker input"), "the picker survives");

H.section("GIVE UP is locked until you've actually tried");
H.click("#reveal");
H.ok(!P.state().over, "two guesses in, giving up is refused");
H.ok(/more goes first/.test(H.visible().join(" ")), "…and it tells you why");

/* ── win, through the picker ─────────────────────────────────────────── */

H.section("winning: type the answer's own name");
decoys(2).forEach(typeGuess);
var before = P.state().guesses.length;
H.eq(before, 3, "three real guesses are on the board first");
var win = typeGuess(ans.n);
H.ok(win.over, "the game is over");
H.ok(win.finished, "…and finished exactly once");
H.eq(win.guesses.length, before + 1, "the winning guess counted");
H.eq(win.known, 7, "the ladder is complete down to genus");
H.eq(H.all(".rung.on").length + H.all(".rung.found").length, 8, "every rung is filled in");
H.eq(H.all(".rung.off, .rung.edge").length, 0, "nothing is left dark or hunting");
var lad = H.text(".ladder");
P.lineageOf(ans).forEach(function (t) { H.ok(lad.indexOf(t) >= 0, "the ladder shows " + t); });
H.ok(H.all(".guesses .gr.win").length === 1, "the winning row is marked");

H.section("the result sheet appeared — synchronously, not behind a rAF");
var sheet = H.maybe(".ac-modal");
H.ok(!!sheet, "a result sheet is on screen");
H.ok(!!H.maybe("#ac-share"), "with a share control");
var sheetText = H.visible(sheet).join(" ");
H.ok(sheetText.indexOf(ans.n) >= 0, "it names the organism: " + ans.n);
H.ok(sheetText.indexOf(ans.s) >= 0, "and its binomial");
H.ok(/›/.test(H.text(".ac-modal .box")) || sheetText.indexOf("Eukaryota") >= 0,
     "and prints the full lineage");
H.ok(/PAR/.test(sheetText), "par is offered to beat");

H.section("the norm and the share grid");
var store = H.store();
var dayKey = null;
for (var k in store) if (/^ag_d:phylo:/.test(k)) dayKey = k;
H.ok(!!dayKey, "the day was written to localStorage (" + dayKey + ")");
var rec = JSON.parse(store[dayKey]);
H.ok(rec.done && rec.won, "recorded as a win");
H.ok(rec.norm >= 60 && rec.norm <= 100, "norm for a 4-guess win is in a strong band: " + rec.norm);
H.eq(rec.shareGrid.length, win.guesses.length, "one share row per guess");
H.ok(rec.shareGrid.every(function (r) { return /^(🟦|🟩)+$|^⬛$/.test(r); }),
     "every share row is made only of the three legal blocks");
H.ok(/🟩/.test(rec.shareGrid[rec.shareGrid.length - 1]), "the last row shows ground newly won");
H.ok(rec.shareGrid[rec.shareGrid.length - 1].length / 2 === 8,
     "…and runs the full eight rungs");
H.ok(rec.detail.indexOf("guess") > 0, "the league detail reads well: " + rec.detail);

H.section("stats and the streak were written");
var sk = null;
for (var k2 in store) if (/^ag_s:phylo/.test(k2)) sk = k2;
H.ok(!!sk, "a stats record exists");
var stats = JSON.parse(store[sk]);
H.eq(stats.played, 1, "one play");
H.eq(stats.wins, 1, "one win");
H.eq(stats.streak, 1, "streak of one");
H.ok(stats.bestNorm === rec.norm, "best norm recorded");
H.ok(!!stats.curve[String(rec.bucket)], "the distribution bucket was counted: " + rec.bucket);

H.section("finishing is idempotent — a reload shows the sheet, not a second finish");
closeSheet();
P = loadPage("", true);                        // same browser, same localStorage
H.tick(400);                                   // restore()'s 240 ms sheet
H.ok(P.state().over, "the finished day restores as over");
H.ok(!!H.maybe(".ac-modal"), "and the sheet comes back after the reflow");
var stats2 = JSON.parse(H.store()[sk]);
H.eq(stats2.played, 1, "still one play — no double count");

/* ── scoring curve ───────────────────────────────────────────────────── */

H.section("the norm curve (CONTRACT §3: a good day ~70, an excellent one ~90)");
function normAt(n) { return Math.max(8, Math.min(100, Math.round(112 - 5.2 * n))); }
H.eq(normAt(2), 100, "a 2-guess win is exceptional");
H.ok(normAt(5) >= 84 && normAt(5) <= 90, "5 guesses is an excellent day: " + normAt(5));
H.ok(normAt(8) >= 68 && normAt(8) <= 74, "8 guesses is a solid day: " + normAt(8));
H.ok(normAt(20) <= 15, "twenty guesses barely scores: " + normAt(20));
var mono = true, prev = 101;
for (var g = 1; g <= 30; g++) { var v = normAt(g); if (v > prev) mono = false; prev = v; }
H.ok(mono, "more guesses never scores better");

/* ── giving up ───────────────────────────────────────────────────────── */

H.section("giving up scores zero and still shows the answer");
P = loadPage("?d=3");
decoys(4).forEach(typeGuess);
H.eq(P.state().guesses.length, 4, "four real guesses before giving up is allowed");
H.click("#reveal");
H.ok(P.state().over, "GIVE UP ends the round");
H.ok(P.state().revealed, "…and marks it revealed");
var giveKey = "ag_d:phylo:3";
var gr = JSON.parse(H.store()[giveKey]);
H.eq(gr.norm, 0, "a reveal scores nothing");
H.eq(gr.won, false, "and is not a win");
H.eq(H.all(".rung.on").length + H.all(".rung.found").length, 8, "the whole lineage is shown anyway");
H.ok(H.visible(H.find(".ac-modal")).join(" ").indexOf(P.answer().n) >= 0, "the sheet names the answer");
closeSheet();

/* ── archive + practice ──────────────────────────────────────────────── */

H.section("?d=<n> archive days");
var a0 = loadPage("?d=0").answer();
var a1 = loadPage("?d=1").answer();
var a0b = loadPage("?d=0").answer();
H.ok(a0.s !== a1.s, "two archive days are different organisms");
H.eq(a0.s, a0b.s, "the same day is always the same organism — two players, no server");

H.section("?practice=1");
P = loadPage("?practice=1");
H.eq(P.state().practice, true, "practice mode is on");
H.eq(H.text(".ac-sub"), "Practice · unlimited", "the subtitle says so");
var before2 = JSON.parse(H.store()[sk] || "{}").played || 0;
typeGuess(P.answer().n);
H.ok(P.state().over, "practice plays through to a win");
H.ok(!!H.maybe(".ac-modal"), "and shows its own sheet");
var afterStats = H.store()[sk];
H.ok(afterStats === undefined || JSON.parse(afterStats).played === before2,
     "practice does NOT touch the daily stats");
var pkeys = Object.keys(H.store()).filter(function (x) { return /^ag_d:phylo:/.test(x); });
H.ok(pkeys.length === 0, "…and writes no finished day");
closeSheet();

/* ── THE ARCHIVE SWEEP ───────────────────────────────────────────────── */

H.section("every day of the archive is playable and winnable");
P = loadPage("");
var ALL = P.pool();
var bad = [], seen = {}, dup = 0;
var probe = window.__PH;
/* One page, many days: A.dailyIndex is pure, so the same walk the cabinet does
   at boot can be re-run for every day without reloading 400 organisms 400×. */
var CYCLE = ALL.answers;                       // one full pass of the answer pool
for (var d = 0; d < 420; d++) {
  var idx = A.dailyIndex("phylo", d, ALL.answers);
  if (!(idx >= 0 && idx < ALL.answers)) { bad.push(d + ": index " + idx); continue; }
  var e = P.answerFor(d);
  if (!e) { bad.push(d + ": no answer"); continue; }
  if (!e.n || !e.s || !e.d) { bad.push(d + ": " + e.s + " missing name/binomial/blurb"); continue; }
  if (!e.l || e.l.length !== 7) { bad.push(d + ": " + e.s + " lineage is " + (e.l || []).length + " deep"); continue; }
  var lin = P.lineageOf(e);
  if (lin.some(function (x) { return !x; })) { bad.push(d + ": " + e.s + " has a blank rank"); continue; }
  if (probe.guessByName(e.n) === null) { bad.push(d + ": " + e.n + " is not typeable"); continue; }
  if (d < CYCLE) { if (seen[e.s]) dup++; seen[e.s] = 1; }
}
H.eq(bad.length, 0, "420 days, no broken answer" + (bad.length ? " — " + bad.slice(0, 5).join(" | ") : ""));
H.eq(dup, 0, "no day repeats an organism inside one pass of the pool (" + CYCLE + " days)");
H.eq(Object.keys(seen).length, CYCLE, "…and one pass reaches every organism in the pool");

H.section("every organism in the tree is reachable by name and parts cleanly");
var broke = 0, unnamed = 0, self = 0;
P.forEachSpecies(function (e) {
  if (!e.n || !e.s) { unnamed++; return; }
  if (!e.l || e.l.length !== 7) { broke++; return; }
  if (P.shared(e, e) !== 8) self++;
});
H.eq(unnamed, 0, "every entry has a name");
H.eq(broke, 0, "every entry has a complete seven-rank lineage");
H.eq(self, 0, "an organism always matches itself at species level");

H.section("every archive day played right through, one guess per kingdom");
/* The archive check above proves the DATA is sound for every day. This one
   proves the SCREEN is: every rung state, every value of `known` from 0 to 7,
   and the whole end sequence, driven through the picker, with the console
   watched for a single error. `known` is what indexes RANK_LABEL, and an
   off-by-one there is the bug that was hiding in paintStatus. */
var SWEEP = Math.min(16, A.dayNumber() + 1);   // the archive only goes back to the epoch
var sweepFail = [], normSeen = [];
for (var day = 0; day < SWEEP; day++) {
  var Q = loadPage("?d=" + day);
  var a = Q.answer();
  var e0 = H.log.filter(function (l) { return l.indexOf("ERROR") === 0; }).length;
  var probes = ["Escherichia coli", "Giant Kelp", "Button Mushroom", "Amoeba",
                "Wheat", "Human", "Domestic Cat"];
  /* plus the answer's own nearest neighbours, so `known` reaches 5, 6 and 7 */
  Q.forEachSpecies(function (e) {
    if (probes.length > 11) return;
    if (e.s === a.s) return;
    var d = Q.shared(e, a);
    if (d >= 5 && probes.indexOf(e.n) < 0) probes.push(e.n);
  });
  probes.forEach(function (nm) { if (!Q.state().over) typeGuess(nm); });
  if (!Q.state().over) typeGuess(a.n);
  var s = Q.state();
  var newErrs = H.log.filter(function (l) { return l.indexOf("ERROR") === 0; }).length - e0;
  var recD = H.store()["ag_d:phylo:" + day];
  var r = recD ? JSON.parse(recD) : null;
  if (newErrs) sweepFail.push("day " + day + ": " + newErrs + " console errors");
  else if (!s.over || !r || !r.won) sweepFail.push("day " + day + " (" + a.n + ") did not finish as a win");
  else if (!(r.norm >= 8 && r.norm <= 100)) sweepFail.push("day " + day + ": norm " + r.norm);
  else if (!r.shareGrid.length) sweepFail.push("day " + day + ": empty share grid");
  else if (H.all(".rung.on").length + H.all(".rung.found").length !== 8) {
    sweepFail.push("day " + day + ": ladder only " +
      (H.all(".rung.on").length + H.all(".rung.found").length) + "/8 after the win");
  } else normSeen.push(r.norm);
  closeSheet();
}
H.eq(sweepFail.length, 0, SWEEP + " days played to a win with a silent console" +
     (sweepFail.length ? " — " + sweepFail.slice(0, 4).join(" | ") : ""));
H.eq(normSeen.length, SWEEP, "one score banked per day");
H.ok(Math.min.apply(null, normSeen) >= 8 && Math.max.apply(null, normSeen) <= 100,
     "every one inside 8…100 (" + Math.min.apply(null, normSeen) + "–" +
     Math.max.apply(null, normSeen) + ")");

P = loadPage("");
var probe = window.__PH;

H.section("shared() is a sane metric on real pairs");
var human = probe.guessByName("Human"), mush = probe.guessByName("Button Mushroom");
H.ok(P.shared(human, human) === 8, "an organism shares everything with itself");
H.ok(P.shared(human, mush) <= 1, "a human and a mushroom part almost at once: " +
     P.shared(human, mush));
H.ok(P.shared(human, mush) === P.shared(mush, human), "it is symmetric");

H.section("no reptiles, anywhere in the pool");
/* One of the two people who play this has a reptile phobia. A reptile as the
   answer — or offered by the type-ahead on the way to one — is a reason to stop
   playing, so this is a hard product requirement, not a preference.
   _build/gen_phylo.py enforces it at harvest time (BANNED_TAXA); this checks
   the shipped file, so a hand-edit or a stale regeneration cannot slip past. */
var PD = window.AD_PHYLO;
var BANNED = ["Reptilia", "Sauropsida", "Lepidosauria", "Squamata", "Serpentes",
              "Testudines", "Chelonia", "Crocodylia", "Rhynchocephalia"];
var badTaxa = BANNED.filter(function (t) { return PD.taxa.indexOf(t) >= 0; });
H.eq(badTaxa.join(",") || "none", "none", "no reptile taxon is even in the name table");

/* Names too, because a lineage can be right while a common name still reads as
   a snake. \bboa\b and \badder\b are word-bounded: "Bladderwrack" contains
   "adder" and is a seaweed. */
var RE = /\b(snake|lizard|turtle|tortoise|crocodile|alligator|gecko|python|cobra|viper|chameleon|iguana|komodo|adder|boa|skink|terrapin|gharial|caiman|rattlesnake|mamba|anole|monitor lizard)\b/i;
var byName = PD.sp.filter(function (s) { return RE.test(s.n) || RE.test(s.s || ""); });
H.eq(byName.map(function (s) { return s.n; }).join(", ") || "none", "none",
     "no organism reads as a reptile by name either");

H.done();
