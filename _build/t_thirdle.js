/* ============================================================================
   t_thirdle.js — THIRDLE, driven through its own buttons and its own keyboard.

     JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
     $JSC _build/harness.js -e 'load("_build/t_thirdle.js")'

   Everything here goes through the real DOM: clicks on the real on-screen keys,
   real keydown events on document, real taps on real tiles. Nothing calls the
   function under the button — that is how this arcade shipped a dead END TURN.

   The one exception is the 400-day layout scan, which calls the generator
   directly (__TH.build) because loading 400 pages to check a shape is silly;
   it is the same function, on the same seed, that the day itself boots with.
   ========================================================================== */

/* ── loading the cabinet the way the browser does ─────────────────────────── */

function loadPage(path, search, keepStore) {
  var saved = keepStore ? JSON.parse(JSON.stringify(H.store())) : null;
  H.reset();
  if (saved) Object.keys(saved).forEach(function (k) { H.store()[k] = saved[k]; });
  H.url(search === undefined ? "" : search);
  H.html(path);
  var dir = path.replace(/[^/]*$/, "");
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

/* ── reading the board the way a player does ──────────────────────────────── */

var LEN = 5;

/** The rendered board, one string per row, "." where there is no square. */
function board() {
  var cells = H.all("#grid .cell");
  var m = /repeat\((\d+)/.exec(H.find("#grid").style.gridTemplateColumns || "");
  var cols = m ? +m[1] : 0;
  var rows = [];
  for (var i = 0; i < cells.length; i += cols) {
    var line = "";
    for (var c = 0; c < cols && i + c < cells.length; c++) {
      var el = cells[i + c];
      line += el.classList.contains("gap") ? "." : (el.textContent || "_");
    }
    rows.push(line);
  }
  return rows;
}
function boardStr() { return board().join("|"); }

/** Which free slot is the cursor on, and which slots are locked. */
function lockedSet() {
  var cr = __TH.puzzle().cross, L = {};
  L[cr[0].w * LEN + cr[0].i] = 1; L[1 * LEN + cr[0].w2i] = 1;
  L[cr[1].w * LEN + cr[1].i] = 1; L[1 * LEN + cr[1].w2i] = 1;
  return L;
}
function freeSlots() {
  var L = lockedSet(), out = [];
  for (var s = 0; s < LEN * 3; s++) if (!L[s]) out.push(s);
  return out;
}

/* ── driving it ───────────────────────────────────────────────────────────── */

function keyBtn(label) {
  var bs = H.all(".ac-kbd button");
  for (var i = 0; i < bs.length; i++) if (bs[i].textContent === label) return bs[i];
  throw new Error("no on-screen key " + JSON.stringify(label));
}
function tap(ch) { H.click(keyBtn(ch)); }            // the on-screen keyboard
function press(k) { H.key(k); }                      // a real keyboard

/** Tap the square that holds free slot `slot`. */
function tapCell(slot) {
  var cr = __TH.puzzle(), cells = H.all("#grid .cell");
  // the board is drawn row-major over the same cell map, so find it by walking
  // the free order: the nth non-gap, non-locked square in slot order.
  var idx = slotToCellIndex(slot);
  if (idx < 0) throw new Error("no square for slot " + slot);
  H.click(cells[idx]);
}

/* Map a flat 15-slot index to the index of its square in the rendered grid.
   Rebuilt from the puzzle geometry, the same way render() lays it out. */
function slotToCellIndex(slot) {
  var p = __TH.build(dayOf()), cr = p.cross;
  var C = 0, a = cr[0].w2i, b = cr[1].w2i, pi = cr[0].i, qi = cr[1].i;
  C = Math.max(pi, qi);
  var cols = [], minC = C, maxC = C;
  function reg(r, c) { if (c < minC) minC = c; if (c > maxC) maxC = c; }
  for (var j = 0; j < LEN; j++) { reg(a, C - pi + j); reg(b, C - qi + j); }
  var w = maxC - minC + 1;
  var word = Math.floor(slot / LEN), i = slot % LEN, r, c;
  if (word === 1) { r = i; c = C; }
  else if (word === 0) { r = a; c = C - pi + i; }
  else { r = b; c = C - qi + i; }
  return r * w + (c - minC);
}
function dayOf() { return __TH.state().day; }

/** Type a whole three-word attempt through the physical keyboard, skipping the
    locked squares exactly as the game does. */
function typeAttempt(ws, useOnScreen) {
  freeSlots().forEach(function (s) {
    var ch = ws[Math.floor(s / LEN)][s % LEN];
    useOnScreen ? tap(ch) : press(ch);
  });
}
function toasts() { return H.all(".ac-toast").map(function (t) { return t.textContent; }); }
function lastToast() { var t = toasts(); return t[t.length - 1] || ""; }

/** A valid word that fits the locked letters of word `w`. */
function fitWord(w, avoid) {
  var P = __TH.answer(), L = lockedSet();
  var need = [];
  for (var i = 0; i < LEN; i++) need.push(L[w * LEN + i] ? P[w][i] : null);
  var list = (window.AD_WORDS.valid5 || []);
  for (var k = 0; k < list.length; k++) {
    var c = list[k].toUpperCase();
    if (c === P[w] || c === avoid) continue;
    var ok = true;
    for (var j = 0; j < LEN; j++) if (need[j] && c[j] !== need[j]) { ok = false; break; }
    if (ok) return c;
  }
  return null;
}
/** Three valid, wrong words that fit the locks — one legal losing attempt. */
function wrongAttempt(n) {
  var out = [], seen = {};
  for (var w = 0; w < 3; w++) {
    var P = __TH.answer(), L = lockedSet(), need = [];
    for (var i = 0; i < LEN; i++) need.push(L[w * LEN + i] ? P[w][i] : null);
    var list = window.AD_WORDS.valid5 || [], hits = [];
    for (var k = 0; k < list.length && hits.length <= (n || 0) + 3; k++) {
      var c = list[k].toUpperCase();
      if (c === P[w] || seen[c]) continue;
      var ok = true;
      for (var j = 0; j < LEN; j++) if (need[j] && c[j] !== need[j]) { ok = false; break; }
      if (ok) hits.push(c);
    }
    var pick = hits[Math.min(n || 0, hits.length - 1)];
    seen[pick] = 1;
    out.push(pick);
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════════════════ */

H.section("1 · wiring — the page loads what it says it loads");
loadPage("games/thirdle/index.html");
H.eq(H.scripts.length, 6, "index.html lists 6 scripts");
H.ok(/game\.js/.test(H.scripts[H.scripts.length - 1]), "game.js loads last");
H.ok(!!H.maybe("#grid"), "the grid exists");
H.ok(!!H.maybe(".tries"), "the tries bar exists");
H.ok(H.all(".key i").length === 4, "the legend shows all four states");
H.ok(H.all(".ac-kbd button").length === 28, "on-screen keyboard: 26 letters + enter + backspace");
H.ok(new RegExp("Day " + A.dayNumber() + "\\b").test(H.text("#ac-sub")),
     "the sub-line names the day   (" + H.text("#ac-sub") + ")");
H.eq(H.all("#grid .cell:not(.gap)").length, 13, "13 squares — 15 slots, two of them shared");
H.eq(H.all("#grid .lock").length, 2, "two given crossing squares, locked");
H.ok(H.log.filter(function (l) { return /^ERROR/.test(l); }).length === 0,
     "nothing threw during boot");

H.section("2 · the layout complaint — 'two lines next to each other'");
/* Her words: "there were two lines next to each other in a way that implies
   there were too few words". The two ACROSS words sit on rows a and b of the
   DOWN word. Two rows apart with the same column offset draws a near-solid
   5-wide block that reads as a two-word puzzle. The rule below is what the
   generator must guarantee: never adjacent, and when only two rows apart the
   words must be offset enough that they cannot stack into a block. */
function layoutOK(p) {
  var a = p.cross[0].w2i, b = p.cross[1].w2i;
  var dr = Math.abs(a - b), dc = Math.abs(p.cross[0].i - p.cross[1].i);
  if (dr < 2) return "across words on touching rows (|Δrow|=" + dr + ")";
  if (dr === 2 && dc < 3) return "two rows apart AND only " + dc + " columns offset — reads as one block";
  return null;
}
function nearDupe(x, y) {
  var same = 0;
  for (var i = 0; i < LEN; i++) if (x[i] === y[i]) same++;
  return same >= LEN - 1;
}
var bad = [], nulls = 0, dupes = [], shapes = {};
for (var d = 0; d <= 400; d++) {
  var p = __TH.build(d);
  if (!p) { nulls++; continue; }
  var why = layoutOK(p);
  if (why) bad.push("day " + d + " " + p.w.join("/") + ": " + why);
  for (var i = 0; i < 3; i++) for (var j = i + 1; j < 3; j++) {
    if (p.w[i] === p.w[j] || nearDupe(p.w[i], p.w[j])) dupes.push("day " + d + " " + p.w[i] + "/" + p.w[j]);
  }
  var k = Math.abs(p.cross[0].w2i - p.cross[1].w2i) + ":" + Math.abs(p.cross[0].i - p.cross[1].i);
  shapes[k] = (shapes[k] || 0) + 1;
}
H.eq(nulls, 0, "every day 0-400 builds a puzzle");
/* Word 1 must be the UPPER across word on every day. `a` and `b` are picked
   independently, so without normalising, half of all days started you typing
   on the bottom row and then jumped the cursor up to the down word. */
var upsideDown = [];
for (var d2 = 0; d2 <= 400; d2++) {
  var p2 = __TH.build(d2);
  if (p2 && p2.cross[0].w2i > p2.cross[1].w2i) upsideDown.push(d2);
}
H.eq(upsideDown.length, 0, "the first word is the top word on every day 0-400" +
     (upsideDown.length ? "   (days " + upsideDown.slice(0, 8).join(", ") + ")" : ""));
H.ok(bad.length === 0, "no day 0-400 draws two lines as one block" +
     (bad.length ? "\n       " + bad.slice(0, 6).join("\n       ") + (bad.length > 6 ? "\n       …+" + (bad.length - 6) : "") : ""));
H.ok(dupes.length === 0, "no puzzle repeats a word or a near-anagram of one" +
     (dupes.length ? "   (" + dupes.slice(0, 5).join(", ") + ")" : ""));
H.ok(Object.keys(shapes).length >= 6, "the layout still varies: " + Object.keys(shapes).length +
     " distinct Δrow:Δcol shapes over 401 days");

H.section("3 · typing");
loadPage("games/thirdle/index.html");
var F = freeSlots();
H.eq(F.length, 11, "11 squares to fill — the two crossings are given");
var before = boardStr();
tap("A");
H.ok(boardStr() !== before, "an on-screen key writes a letter");
H.eq(__TH.state().focus, 1, "and moves the cursor on");
press("B");
H.eq(__TH.state().focus, 2, "a real keydown does the same   (this is the path core/ui.js owns)");
var lockedBefore = H.all("#grid .lock").map(function (e) { return e.textContent; });
for (var t3 = 0; t3 < 20; t3++) press("Z");
H.eq(__TH.state().focus, F.length, "the cursor stops at the end of the board");
H.eq(H.all("#grid .lock").map(function (e) { return e.textContent; }), lockedBefore,
     "typing never overwrites a given letter");

H.section("4 · deleting — 'it's sometimes difficult to delete letters'");
loadPage("games/thirdle/index.html");
press("A"); press("B"); press("C");
H.eq(__TH.state().focus, 3, "three letters typed");
press("Backspace");
H.eq(__TH.state().focus, 2, "backspace steps back");
H.ok(board().join("").indexOf("C") < 0, "and removes the letter just typed");
press("Backspace"); press("Backspace");
H.eq(board().join("").replace(/[._]/g, "").length, 2, "backspace keeps walking left (only the 2 given letters left)");
press("Backspace");
H.eq(__TH.state().focus, 0, "backspace at the start of the board is a no-op, not a crash");

/* The case she hit: the board is FULL between attempts, so the square the
   cursor lands on after typing already holds a letter. Deleting must still
   mean "undo what I just typed", in one press. */
H.section("4b · deleting over a board that still holds the last attempt");
var W4 = wrongAttempt(0);
typeAttempt(W4);
H.click(keyBtn("ENTER"));
H.eq(__TH.state().guesses.length, 1, "the attempt was accepted   (" + W4.join("/") + ")");
H.ok(board().join("").replace(/[._]/g, "").length === 13, "the attempt stays on the board to edit");
H.eq(__TH.state().focus, 0, "the cursor goes back to the first square");
press("Q");
H.eq(__TH.state().focus, 1, "typing over the old attempt works");
var afterQ = boardStr();
press("Backspace");
H.ok(boardStr() !== afterQ, "ONE backspace changes the board");
H.ok(board().join("").indexOf("Q") < 0, "…and it deletes the Q just typed, not the stale letter ahead of it");
H.eq(__TH.state().focus, 0, "cursor is back where the Q was");

/* And the other half: tap a square, then delete it. */
H.section("4c · tap a square, then delete that square");
var slot = F[6];
tapCell(slot);
H.eq(__TH.state().focus, 6, "tapping a square moves the cursor onto it");
var cellIdx = slotToCellIndex(slot);
H.ok(H.all("#grid .cell")[cellIdx].textContent !== "", "that square holds a letter");
press("Backspace");
H.eq(H.all("#grid .cell")[cellIdx].textContent, "", "one backspace clears the square you are looking at");
H.eq(__TH.state().focus, 6, "and the cursor stays on it, ready to retype");
press("Backspace");
H.eq(__TH.state().focus, 5, "a second backspace walks left");
H.eq(H.all("#grid .cell")[slotToCellIndex(F[5])].textContent, "", "clearing as it goes");
var lockedNow = H.all("#grid .lock").map(function (e) { return e.textContent; });
for (var t4 = 0; t4 < 30; t4++) press("Backspace");
H.eq(H.all("#grid .lock").map(function (e) { return e.textContent; }), lockedNow,
     "backspace can never delete a given letter");
H.eq(__TH.state().focus, 0, "backspace walks to the first square and stops there, like a text field");
H.ok(board().join("").replace(/[._]/g, "").length > 2, "the squares to the RIGHT of the cursor are untouched");

/* Which leaves one dead end: a full board with the cursor at the first square.
   Backspace has nowhere left to walk, so there is an explicit way out. */
H.section("4d · CLEAR");
var clearBtn = H.find("#th-clear");
H.eq(clearBtn.textContent, "CLEAR", "there is a CLEAR control");
H.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(clearBtn.textContent), "…with no emoji in its label");
H.click(clearBtn);
H.eq(board().join("").replace(/[._]/g, "").length, 2, "CLEAR empties every square except the two given ones");
H.eq(__TH.state().focus, 0, "and puts the cursor back at the start");
press("X");
H.ok(board().join("").indexOf("X") >= 0, "typing works straight after CLEAR");
H.click(keyBtn("ENTER"));
H.eq(__TH.state().guesses.length, 1, "a cleared board cannot be submitted");

/* Everything above pressed the PHYSICAL Backspace. The on-screen ⌫ is a
   different element with a different listener, and on a phone it is the only
   one that exists — so it gets driven through every one of the same states. */
H.section("4e · the on-screen ⌫ key, in every state");
loadPage("games/thirdle/index.html");
var delKey = keyBtn("⌫");
H.ok(!!delKey, "there is an on-screen delete key");
H.click(delKey);
H.eq(__TH.state().focus, 0, "⌫ on an empty board is a no-op, not a crash");
H.eq(board().join("").replace(/[._]/g, "").length, 2, "…and deletes nothing");
tap("A"); tap("B"); tap("C");
H.eq(__TH.state().focus, 3, "three letters tapped in");
H.click(delKey);
H.eq(__TH.state().focus, 2, "⌫ steps back");
H.ok(board().join("").indexOf("C") < 0, "…and removes the letter just tapped");
H.click(delKey); H.click(delKey);
H.eq(board().join("").replace(/[._]/g, "").length, 2, "⌫ keeps walking left");
H.eq(__TH.state().focus, 0, "…and stops at the first square");

/* The state she was actually in: a full board left over from the last attempt. */
var W4e = wrongAttempt(0);
typeAttempt(W4e, true);                                   // via the on-screen keys
H.click(keyBtn("ENTER"));
H.eq(__TH.state().guesses.length, 1, "an attempt tapped in on-screen is accepted");
H.eq(__TH.state().focus, 0, "cursor back at the first square, board still full");
var full4e = board().join("").replace(/[._]/g, "").length;
H.eq(full4e, 13, "the board is full");
H.click(delKey);
H.eq(board().join("").replace(/[._]/g, "").length, 12, "ONE tap of ⌫ empties the square under the cursor");
H.eq(__TH.state().focus, 0, "…and leaves the cursor on it, ready to retype");
tap("Q");
H.ok(board().join("").indexOf("Q") >= 0, "retyping into it works");
H.click(delKey);
H.ok(board().join("").indexOf("Q") < 0, "and ⌫ takes that Q straight back off");

/* Held down. Auto-repeat is just more of the same events, so eleven of them
   must clear all eleven editable squares and stop — never the given letters. */
H.section("4f · holding delete down");
loadPage("games/thirdle/index.html");
var W4f = wrongAttempt(0);
typeAttempt(W4f);
H.click(keyBtn("ENTER"));
var Ff = freeSlots();
tapCell(Ff[Ff.length - 1]);
H.eq(__TH.state().focus, Ff.length - 1, "cursor parked on the last editable square");
for (var h4 = 0; h4 < Ff.length; h4++) press("Backspace");
H.eq(board().join("").replace(/[._]/g, "").length, 2,
     "holding ⌫ from the last square clears all " + Ff.length + " of them");
H.eq(__TH.state().focus, 0, "…and comes to rest on the first square");
for (var h5 = 0; h5 < 25; h5++) press("Backspace");
H.eq(board().join("").replace(/[._]/g, "").length, 2, "and keeps holding it does nothing more");
H.eq(H.all("#grid .lock").length, 2, "the two given squares are still there");
H.ok(H.all("#grid .lock").every(function (e) { return e.textContent !== ""; }),
     "…still holding their letters");

/* Deleting across the joins: the eleven editable squares are one run that
   crosses from the first across word into the down word into the second. */
H.section("4g · deleting across the boundary between the three words");
loadPage("games/thirdle/index.html");
var Fb = freeSlots();
var wordOf = function (s) { return Math.floor(s / 5); };
var firstOfW1 = -1;
for (var q4 = 0; q4 < Fb.length; q4++) if (wordOf(Fb[q4]) === 1) { firstOfW1 = q4; break; }
H.ok(firstOfW1 > 0, "the down word starts partway along the run   (free slot " + firstOfW1 + ")");
typeAttempt(wrongAttempt(0));
H.click(keyBtn("ENTER"));
tapCell(Fb[firstOfW1]);
H.eq(__TH.state().focus, firstOfW1, "cursor on the down word's first editable square");
press("Backspace");                       // clears it in place
press("Backspace");                       // must step back INTO the across word
H.eq(__TH.state().focus, firstOfW1 - 1, "⌫ steps back out of the down word");
H.eq(wordOf(Fb[__TH.state().focus]), 0, "…into the across word above it");
H.eq(H.all("#grid .cell")[slotToCellIndex(Fb[firstOfW1 - 1])].textContent, "",
     "and that square across the join is the one it cleared");


H.section("5 · submitting");
loadPage("games/thirdle/index.html");
H.click(keyBtn("ENTER"));
H.eq(__TH.state().guesses.length, 0, "an empty board does not burn a try");
H.ok(/Fill all three/i.test(lastToast()), "…it says why   (" + lastToast() + ")");
press("Z"); press("Z"); press("Z"); press("Z");
H.click(keyBtn("ENTER"));
H.eq(__TH.state().guesses.length, 0, "a half-filled board does not burn a try either");
for (var z = 0; z < 20; z++) press("Backspace");
typeAttempt(["ZZZZZ".slice(0, 5), "ZZZZZ", "ZZZZZ"]);
H.click(keyBtn("ENTER"));
H.eq(__TH.state().guesses.length, 0, "a full board of nonsense does not burn a try");
H.ok(/isn't a word/.test(lastToast()), "…and it names the word that isn't one   (" + lastToast() + ")");

H.section("5b · the same three words twice");
loadPage("games/thirdle/index.html");
var W5 = wrongAttempt(0);
typeAttempt(W5);
H.click(keyBtn("ENTER"));
H.eq(__TH.state().guesses.length, 1, "first attempt lands");
H.click(keyBtn("ENTER"));
H.eq(__TH.state().guesses.length, 1, "pressing ENTER again does not burn a second try on the same words");
H.ok(/same|already/i.test(lastToast()), "…it says so   (" + lastToast() + ")");

H.section("6 · colours");
loadPage("games/thirdle/index.html");
var ANS6 = __TH.answer();
typeAttempt(wrongAttempt(0));
H.click(keyBtn("ENTER"));
var painted = H.all("#grid .cell").filter(function (c) {
  return /\b(ok|near|elsewhere|miss)\b/.test(c.className);
});
H.ok(painted.length > 0, "the attempt comes back coloured (" + painted.length + " squares)");
var kbdPainted = H.all(".ac-kbd button").filter(function (b) {
  return /\b(ok|near|elsewhere|miss)\b/.test(b.className);
});
H.ok(kbdPainted.length > 0, "and the keyboard learns from it (" + kbdPainted.length + " keys)");
H.ok(H.all(".ac-kbd button.ok").length >= 2, "the two given letters are already green on the keyboard");
press("Q");
H.ok(!/\b(ok|near|elsewhere|miss)\b/.test(H.all("#grid .cell")[slotToCellIndex(freeSlots()[0])].className),
     "retyping a square drops its colour — the colour belonged to the letter");

/* The four states, worked out here from scratch — Wordle's two-pass rule inside
   each word, then the cross-word pass that makes a letter belonging to one of
   the OTHER two words purple. Nothing below borrows game.js's own scorer; the
   answers come from __TH.answer() and everything else is computed here, then
   compared against the classes actually painted on the squares. */
function expectStates(ws, ans) {
  var out = [];
  for (var w = 0; w < 3; w++) {
    var g = ws[w], a = ans[w], res = [], pool = {};
    for (var i = 0; i < LEN; i++) {
      res.push("miss");
      if (g[i] !== a[i]) pool[a[i]] = (pool[a[i]] || 0) + 1;
    }
    for (var j = 0; j < LEN; j++) if (g[j] === a[j]) res[j] = "ok";
    for (var k = 0; k < LEN; k++) {
      if (res[k] === "ok") continue;
      if (pool[g[k]] > 0) { res[k] = "near"; pool[g[k]]--; }
    }
    out.push(res);
  }
  for (var w2 = 0; w2 < 3; w2++) {
    var others = ans.filter(function (_, n) { return n !== w2; }).join("");
    for (var m = 0; m < LEN; m++) {
      if (out[w2][m] === "miss" && others.indexOf(ws[w2][m]) >= 0) out[w2][m] = "elsewhere";
    }
  }
  return out;
}
function stateOfCell(el) {
  var m = /\b(ok|near|elsewhere|miss)\b/.exec(el.className);
  return m ? m[1] : null;
}
var ORDER = { miss: 1, elsewhere: 2, near: 3, ok: 4 };

H.section("6a · the four colours, against an independent scorer");
var purpleSeen = 0, dayScanned = [];
for (var dd = 0; dd < 8; dd++) {
  loadPage("games/thirdle/index.html", "?d=" + dd);
  var ansD = __TH.answer(), gD = wrongAttempt(0);
  typeAttempt(gD);
  H.click(keyBtn("ENTER"));
  if (__TH.state().guesses.length !== 1) { H.ok(false, "day " + dd + ": the attempt was refused"); continue; }
  var want = expectStates(gD, ansD), cells = H.all("#grid .cell"), byCell = {};
  for (var s6 = 0; s6 < 15; s6++) {
    var ci = slotToCellIndex(s6), st6 = want[Math.floor(s6 / LEN)][s6 % LEN];
    if (!byCell[ci] || ORDER[st6] > ORDER[byCell[ci]]) byCell[ci] = st6;
  }
  var wrong = [];
  Object.keys(byCell).forEach(function (ci) {
    var got = stateOfCell(cells[ci]);
    if (got !== byCell[ci]) wrong.push("cell " + ci + " painted " + got + ", should be " + byCell[ci]);
    if (byCell[ci] === "elsewhere") purpleSeen++;
  });
  dayScanned.push(dd);
  H.ok(wrong.length === 0, "day " + dd + " (" + ansD.join("/") + " ← " + gD.join("/") +
       ") is painted exactly right" + (wrong.length ? "\n       " + wrong.join("\n       ") : ""));
}
H.ok(purpleSeen > 0, "the fourth colour actually fires — " + purpleSeen +
     " purple squares across days " + dayScanned.join(","));

/* The keyboard is a summary of the board: each letter shows the best thing that
   has ever happened to it, and it must never go backwards. */
H.section("6b · the keyboard's colour state");
loadPage("games/thirdle/index.html");
function keyStates() {
  var out = {};
  H.all(".ac-kbd button").forEach(function (b) {
    if (b.textContent.length === 1) out[b.textContent] = stateOfCell(b);
  });
  return out;
}
var ks0 = keyStates();
H.eq(Object.keys(ks0).filter(function (c) { return ks0[c] === "ok"; }).length, 2,
     "before a single guess, only the two given letters are lit");
var gK = wrongAttempt(0);
typeAttempt(gK);
H.click(keyBtn("ENTER"));
var wantK = {}, ansK = __TH.answer(), stK = expectStates(gK, ansK);
for (var w6 = 0; w6 < 3; w6++) for (var i6 = 0; i6 < LEN; i6++) {
  var chK = gK[w6][i6], sK = stK[w6][i6];
  if (!wantK[chK] || ORDER[sK] > ORDER[wantK[chK]]) wantK[chK] = sK;
}
var ks1 = keyStates(), badK = [];
Object.keys(wantK).forEach(function (c) {
  if (ks1[c] !== wantK[c]) badK.push(c + ": key says " + ks1[c] + ", board says " + wantK[c]);
});
H.ok(badK.length === 0, "every key matches the best state that letter reached" +
     (badK.length ? "   (" + badK.join("; ") + ")" : ""));
Object.keys(ks0).forEach(function (c) {
  if (ks0[c] && ORDER[ks1[c]] < ORDER[ks0[c]]) badK.push(c + " went backwards");
});
H.ok(badK.length === 0, "and no key ever downgrades");
var untouched = Object.keys(ks1).filter(function (c) { return !ks1[c]; });
H.ok(untouched.length > 0 && untouched.every(function (c) { return gK.join("").indexOf(c) < 0; }),
     "letters never guessed stay blank   (" + untouched.length + " of them)");

/* The colours are the whole information content of the game, and they used to
   fall off any square you had TOUCHED rather than any square whose letter had
   changed. Retype a word identically — the obvious way to edit the third word
   is to type straight through from the first square — and ten of the thirteen
   squares went blank. That is the game losing your last attempt's answer. */
H.section("6c · a square keeps its colour while it keeps its letter");
loadPage("games/thirdle/index.html");
function coloured() {
  return H.all("#grid .cell").filter(function (c) {
    return /\b(ok|near|elsewhere|miss)\b/.test(c.className);
  }).length;
}
var W6 = wrongAttempt(0);
typeAttempt(W6);
H.click(keyBtn("ENTER"));
H.eq(coloured(), 13, "every square is scored after an attempt");
typeAttempt(W6);                                     // the same eleven letters again
H.eq(coloured(), 13, "retyping the identical attempt keeps every colour");
H.eq(__TH.state().focus, 11, "…and the cursor has walked to the end");
var F6 = freeSlots(), c6 = slotToCellIndex(F6[0]);
tapCell(F6[0]);
var had = H.all("#grid .cell")[c6].textContent;
press(had === "Z" ? "Y" : "Z");
H.eq(coloured(), 12, "changing ONE letter drops that one square's colour");
H.ok(!/\b(ok|near|elsewhere|miss)\b/.test(H.all("#grid .cell")[c6].className),
     "…and it is the square that changed");
press("Backspace");                                   // undo it — back to the old letter
press(had);
H.eq(coloured(), 13, "putting the same letter back brings the colour back");

H.section("6d · the cursor");
loadPage("games/thirdle/index.html");
H.eq(H.all("#grid .cur").length, 1, "exactly one square carries the cursor");
H.ok(H.all("#grid .cur")[0] === H.all("#grid .cell")[slotToCellIndex(freeSlots()[0])],
     "and it is the first editable square");
tapCell(freeSlots()[5]);
H.eq(H.all("#grid .cur").length, 1, "still exactly one after a tap");
H.ok(H.all("#grid .cur")[0] === H.all("#grid .cell")[slotToCellIndex(freeSlots()[5])],
     "…on the square that was tapped");
H.ok(H.all("#grid .lock").every(function (e) { return !e.classList.contains("cur"); }),
     "the cursor can never land on a given square");
/* The registry gives this cabinet accent --violet, and core/style.css defines
   --violet AS --purple — the exact fill of the fourth state. A cursor drawn in
   var(--accent) therefore vanished the moment it landed on a purple square. */
var htmlSrc = readFile("games/thirdle/index.html");
var curRule = /\.ac-tile\.cur\s*\{([^}]*)\}/.exec(htmlSrc);
H.ok(!!curRule, "the cabinet styles its own cursor");
H.ok(!/var\(--accent\)/.test(curRule[1]),
     "…and NOT in var(--accent), which resolves to the fourth colour   (" + curRule[1].trim() + ")");
loadPage("games/thirdle/index.html");
typeAttempt(wrongAttempt(0));
H.click(keyBtn("ENTER"));
tapCell(freeSlots()[0]);
var curCell = H.all("#grid .cur")[0];
H.ok(/\b(ok|near|elsewhere|miss)\b/.test(curCell.className),
     "the cursor sits on a coloured square without replacing its colour   (" + curCell.className + ")");

/* Rebuilding the grid per keystroke re-ran core's `pop` keyframe on all
   thirteen squares, so the whole board flinched on every key. It must be
   repainted in place instead: the same nodes, the same classes where nothing
   changed. */
H.section("6e · the board is repainted, not rebuilt");
loadPage("games/thirdle/index.html");
var nodes0 = H.all("#grid .cell");
press("A");
var nodes1 = H.all("#grid .cell");
H.eq(nodes1.length, nodes0.length, "same number of squares after a keystroke");
H.ok(nodes0.every(function (n, i) { return n === nodes1[i]; }),
     "every square is the SAME element — no node was replaced");
/* …and a square in a different word is not even reclassed. */
var Fd = freeSlots(), far = -1;
for (var q6 = 0; q6 < Fd.length; q6++) if (Math.floor(Fd[q6] / 5) === 2) { far = Fd[q6]; break; }
var farEl = H.all("#grid .cell")[slotToCellIndex(far)];
var farCls = farEl.className;
press("B"); press("C");
H.eq(farEl.className, farCls, "a square in another word is untouched by typing");
H.click(H.find("#th-clear"));
H.ok(H.all("#grid .cell").every(function (n, i) { return n === nodes0[i]; }),
     "CLEAR repaints too — it does not rebuild the grid either");

H.section("6f · which of the three words am I in");
loadPage("games/thirdle/index.html");
H.eq(H.all("#grid .inword").length, 5, "the five squares of the current word are marked");
var Fe = freeSlots();
H.ok(H.all("#grid .inword").indexOf(H.all("#grid .cell")[slotToCellIndex(Fe[0])]) >= 0,
     "…including the one under the cursor");
var w1start = -1;
for (var q7 = 0; q7 < Fe.length; q7++) if (Math.floor(Fe[q7] / 5) === 1) { w1start = q7; break; }
tapCell(Fe[w1start]);
H.eq(H.all("#grid .inword").length, 5, "still five when the cursor moves to the down word");
H.ok(H.all("#grid .inword").indexOf(H.all("#grid .cell")[slotToCellIndex(Fe[0])]) < 0,
     "…and it is a different five — the mark followed the cursor");

H.section("7 · winning");
loadPage("games/thirdle/index.html");
var A7 = __TH.answer();
var finishes = [];
A.on("finish", function (r) { finishes.push(r); });
typeAttempt(wrongAttempt(0));
H.click(keyBtn("ENTER"));
typeAttempt(A7);
H.click(keyBtn("ENTER"));
H.ok(__TH.state().over, "the game is over");
H.ok(__TH.state().won, "and won");
H.eq(finishes.length, 1, "A.finish fired exactly once");
H.eq(finishes[0].norm, 95, "norm for a 2-attempt win");
H.eq(finishes[0].detail, "2/6", "detail reads 2/6");
H.eq(finishes[0].bucket, 2, "bucket is the attempt count");
H.eq(finishes[0].shareGrid.length, 2, "the share grid has one line per attempt");
H.ok(/^[🟩🟨🟪⬛ ]+$/.test(finishes[0].shareGrid[0]), "…and only the four glyphs   (" + finishes[0].shareGrid[0] + ")");
H.eq(finishes[0].shareGrid[1], "🟩🟩🟩🟩🟩 🟩🟩🟩🟩🟩 🟩🟩🟩🟩🟩", "the winning line is all green");
H.tick(400);
H.ok(!!H.maybe(".ac-modal.show"), "the result sheet actually appears");
H.ok(H.visible(H.find(".ac-modal")).join(" ").indexOf(A7[0]) >= 0, "it shows the three words");
H.ok(!!H.maybe("#ac-share"), "with a share button");
H.click(keyBtn("ENTER"));
H.eq(__TH.state().guesses.length, 2, "ENTER after the end does nothing");
press("A");
H.eq(__TH.state().guesses.length, 2, "and so does typing");
var stats7 = A.stats("thirdle");
H.eq(stats7.played, 1, "stats recorded one play");
H.eq(stats7.wins, 1, "…and one win");

H.section("8 · losing");
loadPage("games/thirdle/index.html");
var A8 = __TH.answer(), fin8 = [];
A.on("finish", function (r) { fin8.push(r); });
for (var g = 0; g < 6; g++) {
  for (var b8 = 0; b8 < 20; b8++) press("Backspace");
  typeAttempt(wrongAttempt(g));
  H.click(keyBtn("ENTER"));
}
H.eq(__TH.state().guesses.length, 6, "six attempts used");
H.ok(__TH.state().over && !__TH.state().won, "the game ended, lost");
H.eq(fin8.length, 1, "A.finish fired once");
H.eq(fin8[0].norm, 12, "a loss is worth 12");
H.eq(fin8[0].detail, "X/6", "detail reads X/6");
H.eq(H.all("#grid .cell.ok").length, 0, "a loss is not painted as a win");
H.eq(H.all("#grid .cell.reveal").length, 13, "the answer is revealed in its own colour");
H.ok(board().join("").indexOf(A8[1][0]) >= 0, "and the words are readable on the board");

H.section("8b · the tries bar");
loadPage("games/thirdle/index.html");
H.eq(H.all(".tries i").length, 6, "six pips, one per try");
H.eq(H.all(".tries i.used").length + H.all(".tries i.won").length, 0, "none spent yet");
typeAttempt(wrongAttempt(0));
H.click(keyBtn("ENTER"));
H.eq(H.all(".tries i.used").length, 1, "one spent after one attempt");
for (var b8b = 0; b8b < 20; b8b++) press("Backspace");
typeAttempt(wrongAttempt(1));
H.click(keyBtn("ENTER"));
H.eq(H.all(".tries i.used").length, 2, "two after two");
H.eq(H.all(".tries i.won").length, 0, "…and none of them marked as the win");
for (var b8c = 0; b8c < 20; b8c++) press("Backspace");
typeAttempt(__TH.answer());
H.click(keyBtn("ENTER"));
H.eq(H.all(".tries i.won").length, 1, "the winning try is marked");
H.eq(H.all(".tries i.used").length, 2, "…and the two spent ones stay spent");

H.section("8c · stats and the distribution");
loadPage("games/thirdle/index.html", "?d=5");
typeAttempt(wrongAttempt(0));
H.click(keyBtn("ENTER"));
for (var b8d = 0; b8d < 20; b8d++) press("Backspace");
typeAttempt(wrongAttempt(1));
H.click(keyBtn("ENTER"));
for (var b8e = 0; b8e < 20; b8e++) press("Backspace");
typeAttempt(__TH.answer());
H.click(keyBtn("ENTER"));
H.tick(400);
var s8 = A.stats("thirdle");
H.eq(s8.played, 1, "an archive day counts as a play");
H.eq(s8.wins, 1, "…and as a win");
H.eq(s8.curve["3"], 1, "the distribution buckets it under 3 guesses");
H.eq(s8.bestNorm, 85, "norm for a 3-attempt win is 85");
H.ok(/3\/6/.test(H.visible(H.find(".ac-modal")).join(" ")) ||
     A.load("thirdle", 5).detail === "3/6", "the league line reads 3/6");


H.section("9 · reload mid-game");
loadPage("games/thirdle/index.html");
var A9 = __TH.answer();
typeAttempt(wrongAttempt(0));
H.click(keyBtn("ENTER"));
var g9 = __TH.state().guesses.length, board9 = boardStr();
loadPage("games/thirdle/index.html", "", true);          // same localStorage
H.eq(__TH.state().guesses.length, g9, "the attempt survived the reload");
H.eq(boardStr(), board9, "the board came back the same");
H.ok(H.all(".ac-kbd button").filter(function (b) { return /\b(ok|near|elsewhere|miss)\b/.test(b.className); }).length > 0,
     "the keyboard colours came back too");
press("Q");
H.ok(board().join("").indexOf("Q") >= 0, "AND THE KEYBOARD STILL WORKS after a reload");
H.eq(__TH.state().focus, 1, "the cursor starts at the first square, not off the end");

H.section("9b · reload after finishing");
loadPage("games/thirdle/index.html");
typeAttempt(__TH.answer());
H.click(keyBtn("ENTER"));
H.tick(400);
var fin9 = [];
loadPage("games/thirdle/index.html", "", true);
A.on("finish", function (r) { fin9.push(r); });
H.tick(400);
H.ok(__TH.state().over, "a finished day comes back finished");
H.ok(!!H.maybe(".ac-modal.show"), "and shows its result sheet again");
H.eq(fin9.length, 0, "without finishing a second time");
H.eq(A.stats("thirdle").played, 1, "so the stats still say one play");

/* A saved board is a flat 15-slot array whose meaning depends on which word is
   which. If the generator ever lays a day out differently, restoring the old
   array would drop letters into the wrong squares — including the two GIVEN
   ones, which the player cannot then fix. The save is stamped with its puzzle. */
H.section("9c · a save that belongs to a different puzzle is discarded");
loadPage("games/thirdle/index.html");
typeAttempt(wrongAttempt(0));
H.click(keyBtn("ENTER"));
var key9 = Object.keys(H.store()).filter(function (k) { return /thirdle/.test(k); })[0];
H.ok(!!key9, "the day's board is in storage   (" + key9 + ")");
var saved9 = JSON.parse(H.store()[key9]);
H.ok(!!saved9.sig, "…stamped with the puzzle it belongs to   (" + saved9.sig + ")");
saved9.sig = "AAAAA|BBBBB|CCCCC";
saved9.cur = new Array(15).fill("Z");
H.store()[key9] = JSON.stringify(saved9);
loadPage("games/thirdle/index.html", "", true);
H.eq(__TH.state().guesses.length, 0, "a board from another puzzle is not restored");
H.eq(H.all("#grid .lock").filter(function (e) { return e.textContent === "Z"; }).length, 0,
     "…and it cannot corrupt the two given letters");
H.eq(H.all("#grid .lock").length, 2, "the given squares are intact");
press("A");
H.ok(board().join("").indexOf("A") >= 0, "and the board is playable from scratch");

H.section("9d · a finished board takes no more input");
loadPage("games/thirdle/index.html");
typeAttempt(__TH.answer());
H.click(keyBtn("ENTER"));
H.tick(400);
H.eq(H.all("#grid .cur").length, 0, "no cursor on a finished board");
H.eq(H.all("#grid .inword").length, 0, "…and no current-word shading");
H.ok(H.find("#grid").classList.contains("done"), "the grid is marked done, so nothing looks tappable");
H.ok(H.find("#th-clear").disabled, "CLEAR is disabled");
var before9d = boardStr();
H.click(H.all("#grid .cell:not(.gap)")[0]);
H.eq(boardStr(), before9d, "tapping a square on a finished board changes nothing");

H.section("10 · the archive (?d=)");
loadPage("games/thirdle/index.html", "?d=3");
var arch = __TH.answer().join("/");
H.ok(/Day 3/.test(H.text("#ac-sub")), "?d=3 says day 3   (" + H.text("#ac-sub") + ")");
loadPage("games/thirdle/index.html", "?d=3");
H.eq(__TH.answer().join("/"), arch, "the same day is the same puzzle");
loadPage("games/thirdle/index.html", "?d=4");
H.ok(__TH.answer().join("/") !== arch, "a different day is a different puzzle");
loadPage("games/thirdle/index.html", "?d=99999");
H.eq(dayOf(), A.dayNumber(), "a day from the future clamps to today   (day " + dayOf() + ")");
loadPage("games/thirdle/index.html", "?d=-4");
H.ok(dayOf() >= 0, "a negative day clamps too   (day " + dayOf() + ")");

H.section("11 · practice (?practice=1)");
loadPage("games/thirdle/index.html", "?practice=1");
H.ok(/Practice/i.test(H.text("#ac-sub")), "the sub-line says practice");
H.ok(/TODAY/i.test(H.text(".th-modes")), "…and offers the way back to today");
var pFin = [];
A.on("finish", function (r) { pFin.push(r); });
typeAttempt(__TH.answer());
H.click(keyBtn("ENTER"));
H.tick(400);
H.ok(__TH.state().won, "practice can be won");
H.eq(pFin.length, 0, "practice never writes a result");
H.eq(A.stats("thirdle").played, 0, "and never touches the stats");
H.ok(!!H.maybe(".ac-modal.show"), "it still shows a sheet");
H.ok(H.visible(H.find(".ac-modal")).join(" ").indexOf("Play again") >= 0, "with Play again on it");
H.eq(Object.keys(H.store()).filter(function (k) { return /thirdle/.test(k); }).length, 0,
     "practice leaves nothing in storage");

H.section("12 · house style");
var js = readFile("games/thirdle/game.js"), html = readFile("games/thirdle/index.html");
H.ok(!/#[0-9a-fA-F]{3,6}\b/.test(html.replace(/theme-color[^>]*>/, "")),
     "no literal hex in the cabinet's CSS — tokens only");
H.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(js.replace(/GLYPH[\s\S]*?};/, "").replace(/icon:[^\n]*/g, "")),
     "no emoji outside the share grid");
H.ok(/var\(--/.test(html), "it does use the design tokens");

H.done();
