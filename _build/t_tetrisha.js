/* t_tetrisha.js — reproduce the NaN score: a heart detonation whose column
   collapse completes more than 4 rows at once.
   Run from the repo root:
     $JSC _build/harness.js -e 'load("_build/t_tetrisha.js")'                */

H.html("tetrisha/index.html");
load("tetrisha/audio.js");
load("tetrisha/game.js");
H.boot();

var T = window.__TT, g = T.game;

H.section("setup: bottom 10 rows full except col 4; 15-cell pillar in col 4");
T.start("marathon");
for (var r = 12; r <= 21; r++) T.fillRow(r, 4);       // rows 12..21, gap at col 4
for (var r2 = 2; r2 <= 11; r2++) g.board[r2][4] = "Z"; // 10 spare cells above the gaps
H.ok(g.state === "play", "game running");

H.section("drop the heart");
T.spawn("♥");
H.ok(g.piece && g.piece.isHeart, "heart piece is falling");
T.hardDrop();
H.ok(g.state === "heartburst", "heart detonated (state=" + g.state + ")");
H.ok(isFinite(g.score), "score finite right after detonation: " + g.score);

H.section("let the burst resolve");
T.step(1200);                                          // stateT passes 0.9 → resolveClears(true)
var n = g.clearingRows.length;
print("  rows completed simultaneously: " + n + " (state=" + g.state + ")");
H.ok(n > 4 || g.state === "play", "collapse produced a >4-row clear (n=" + n + ")");
H.ok(isFinite(g.score), "score is finite after the mega-clear: " + g.score);

H.section("finish the clear animation");
T.step(2000);
H.ok(isFinite(g.score), "score still finite once play resumes: " + g.score);
H.ok(g.score > 0, "and it actually went up: " + g.score);
H.ok(isFinite(g.hi), "hi-score finite: " + g.hi);
print("  lines total: " + g.lines);

H.done();
