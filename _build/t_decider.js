/* t_decider.js — THE DECIDER.
   Run from the repo root:
     JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
     $JSC _build/harness.js -e 'load("_build/t_decider.js")'

   The regression that made this file necessary: _build/gen_trivia2.py switched
   core/data/trivia.js from verbose objects to packed rows, and nothing updated
   the reader. The cabinet did not crash — it hit its own "the question bank
   didn't load" guard and returned from the IIFE, so `window.__DC` never
   existed and the game silently showed an error card. Every check below that
   touches __DC would have failed; the first one is the canary.                */

H.html("games/decider/index.html");
["core/registry.js", "core/arcade.js", "core/ui.js", "core/audio.js",
 "core/data/trivia.js", "games/decider/game.js"].forEach(load);
H.boot();

H.section("the bank actually decodes");
H.ok(typeof __DC === "object", "__DC exists — the IIFE ran past the bank guard");
var T = window.AD_TRIVIA;
H.ok(T && T.q && T.q.length > 1000, "bank has >1000 rows (" + (T.q ? T.q.length : 0) + ")");
H.ok(T.c && T.c.length > 5, "category key list present (" + (T.c ? T.c.length : 0) + ")");

H.section("options are shuffled, not answer-first");
/* Packed rows store the answer in slot 1. If the reader forgets to shuffle,
   the correct button is always A and the game is trivially winnable. Ask the
   REAL game where the answer landed, over many real questions. */
/* __DC.q() deliberately omits the answer index so a console can't cheat, so
   ask the honest question instead: where does the answer sit among the options
   the game is actually about to render?

   Play a real game to the end, stepping the same screens a player steps, and
   sample every question on the way past. (__DC.go() advances the screen; it is
   not a day selector.) */
H.click(H.find("#dc-start"));           // the real button a player presses
H.ok(__DC.state().screen !== "title", "START THE DECIDER actually starts it");

var slot = [0, 0, 0, 0], asked = 0, off = 0, texts = {}, guard = 0;
while (!__DC.state().over && guard++ < 400) {
  var sc = __DC.state().screen;
  if (sc === "pass" || sc === "reveal" || sc === "wpass" || sc === "wreveal") {
    __DC.go(); continue;
  }
  if (sc === "ask") {
    var qq = __DC.q();
    if (qq && qq.opts && qq.opts.length === 4) {
      texts[qq.q] = 1;
      var at = qq.opts.indexOf(qq.a);
      if (at < 0) off++; else { slot[at]++; asked++; }
    }
    __DC.right();
    continue;
  }
  if (sc === "wbet") { __DC.bet(0); continue; }
  if (sc === "wask") { __DC.num(__DC.q().a); continue; }
  break;
}
H.eq(off, 0, "every question's answer is among its own options");
H.ok(asked >= 12, "sampled " + asked + " questions by actually playing to the end");
H.eq(Object.keys(texts).length, asked, "every one of them a different question");
H.ok(slot[0] < asked * 0.6, "answer is not always button A (A got " + slot[0] + "/" + asked + ")");
H.ok(slot.filter(function (x) { return x > 0; }).length >= 3,
     "answer lands in at least three different slots: A" + slot[0] + " B" + slot[1] +
     " C" + slot[2] + " D" + slot[3]);

H.section("and the shuffle itself is uniform over the whole bank");
/* 4-element Fisher-Yates on the arcade's own RNG, one seed per question — the
   exact call the reader makes. Skew here would mean a guessable answer slot. */
var u = [0, 0, 0, 0];
for (var s2 = 0; s2 < 4000; s2++) {
  u[A.shuffle(A.rng("dcopt:" + s2.toString(36)), ["A", "b", "c", "d"]).indexOf("A")]++;
}
H.ok(Math.max.apply(null, u) - Math.min.apply(null, u) < 4000 * 0.06,
     "uniform across 4000 seeds: " + u.join(" "));

H.section("the shuffle is stable, not volatile");
/* Seeded from the question's own text, so a player who reloads mid-game finds
   the buttons where they left them. Seeding from anything volatile would
   reorder the options under them. */
var q1 = "Who plays Jack Sparrow in the Pirates of the Caribbean films?";
var o1 = A.shuffle(A.rng("dcopt:" + A.hash(q1).toString(36)), ["a", "b", "c", "d"]).join("");
var o2 = A.shuffle(A.rng("dcopt:" + A.hash(q1).toString(36)), ["a", "b", "c", "d"]).join("");
H.eq(o1, o2, "the same question always shuffles the same way");

var audit = __DC.audit(400);

H.section("400 cards through the real picker");
H.eq(audit.failed, 0, "every card built");
H.eq(audit.pairsBroken, 0, "both players always get the same category and difficulty");

H.section("her complaint: 'two easy questions and then two hard questions'");
H.ok(audit.worstStepInRound <= 1, "difficulty never jumps more than one pip inside a round (" +
     audit.worstStepInRound + ")");
H.ok(audit.worstStepAcrossRounds <= 1, "nor across the round boundary (" +
     audit.worstStepAcrossRounds + ")");

H.section("her complaint: too much art / literature / older cultural history");
function share(c) { return parseFloat(String(audit.cat[c]).replace(/.*\(|%\)/g, "")); }
H.ok(share("art") < 3, "art is rare: " + audit.cat.art);
H.ok(share("lit") < 3.5, "literature is rare: " + audit.cat.lit);
H.ok(share("history") < 5, "history is rare: " + audit.cat.history);

H.section("her complaint: their cities / heritage should be HARDER, not absent");
["cities", "persia", "jewish"].forEach(function (c) {
  H.ok(share(c) > 5, c + " still comes up often: " + audit.cat[c]);
});
// and it must be able to ask them hard questions, which was the actual gap
var hard = {};
for (var k = 0; k < T.q.length; k++) {
  var r = T.q[k], numeric = typeof r[1] === "number";
  var cat = T.c[numeric ? r[3] : r[5]], d = numeric ? r[4] : r[6];
  if (d >= 4) hard[cat] = (hard[cat] || 0) + 1;
}
["cities", "persia", "jewish"].forEach(function (c) {
  H.ok((hard[c] || 0) >= 20, c + " has " + (hard[c] || 0) + " questions at difficulty 4-5");
});

H.section("the difficulty curve itself");
H.ok(parseFloat(audit.diff[3]) > parseFloat(audit.diff[1]),
     "middling questions outnumber gimmes");

H.done();
