/* t_duel.js — the serverless head-to-head.
     JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
     $JSC _build/harness.js -e 'load("_build/t_duel.js")'

   There is no server, so the ONLY way one of them sees the other's day is a
   link: A.packCard() squeezes the whole card into a base64url token with an
   FNV checksum, and A.unpackCard() reads it back. Nothing else in the tree
   tests this, and it is silently fragile in a specific way — the token stores
   each game as its REGISTRY INDEX, so opening a cabinet (which I have done five
   times tonight) shifts every index after it. A link sent before the change
   would then decode into the wrong games rather than failing loudly.

   These checks cover the round trip, tamper detection, the index-drift hazard,
   and the awkward inputs a real link picks up on its way through a phone.     */

H.reset();
H.atDay(40);
load("core/registry.js");
load("core/arcade.js");
load("core/ui.js");

/* Put a real day on the board through the real API, not by hand. */
function play(day, entries) {
  entries.forEach(function (e) {
    A.finish(e.id, day, { score: e.norm, norm: e.norm, won: e.won,
                          detail: e.detail || "", shareGrid: ["🟩🟩"] });
  });
}

H.section("a card survives the round trip");
play(40, [
  { id: "wordish", norm: 78, won: true, detail: "4/6" },
  { id: "quartets", norm: 91, won: true, detail: "1 away" },
  { id: "flagle", norm: 55, won: false, detail: "6/6" },
]);
var token = A.packCard(40);
H.ok(token.length > 20, "packCard produced a token (" + token.length + " chars)");
var back = A.unpackCard(token);
H.ok(!!back, "and it decodes");
H.eq(back.day, 40, "the day survives");
H.eq(back.played, 3, "all three results survive");
H.eq(back.results.wordish.norm, 78, "wordish norm survives");
H.eq(back.results.quartets.won, true, "a win survives as a win");
H.eq(back.results.flagle.won, false, "a loss survives as a loss");
H.eq(back.results.wordish.detail, "4/6", "the detail line survives");

H.section("it refuses a mangled token");
H.eq(A.unpackCard(token.slice(0, -1)), null, "one character lopped off the checksum");
H.eq(A.unpackCard(token.replace(/^./, "Z")), null, "a flipped character in the body");
H.eq(A.unpackCard("total nonsense"), null, "outright junk");
H.eq(A.unpackCard(""), null, "an empty token");
H.ok(A.unpackCard(null) === null || A.unpackCard(null) === undefined, "null");

H.section("the link points at league/ from wherever it is made");
["games/flagle/", "daily/", "league/", "passport/", ""].forEach(function (dir) {
  H.url("", "");
  H.win.location.href = "https://x.dev/misha-arcade/" + dir;
  var link = A.duelLink(40);
  H.ok(/\/misha-arcade\/league\/#c=/.test(link),
       "from /" + (dir || "root") + " → " + link.replace(/#c=.*/, "#c=…"));
});

H.section("a link read back off the URL is the same card");
H.win.location.href = "https://x.dev/misha-arcade/league/";
var made = A.duelLink(40);
H.url("", made.replace(/^[^#]*/, ""));
var read = A.readDuel();
H.ok(!!read, "readDuel found the card in the hash");
H.eq(read.played, 3, "with all three results");
H.eq(read.results.quartets.norm, 91, "and the right numbers");

H.section("a link survives a cabinet being inserted into the registry");
/* This is why the token names games by id rather than by position. Insert a
   cabinet at the front — every later index shifts by one — and the card must
   still say what it said, or a Wordle score is silently reported as a Flagle
   one with no error anywhere. */
var realReg = A.registry;
var madeBefore = A.packCard(40);
A.registry = [{ id: "brand-new-cabinet", name: "NEW" }].concat(realReg);
var afterInsert = A.unpackCard(madeBefore);
A.registry = realReg;
H.ok(!!afterInsert, "the older link still decodes");
H.eq(afterInsert.played, 3, "with the same number of results");
H.eq(afterInsert.results.wordish.norm, 78, "wordish is still wordish");
H.eq(afterInsert.results.quartets.norm, 91, "quartets is still quartets");
H.eq(afterInsert.results.flagle.won, false, "and flagle is still the loss");

H.section("version 1 links, sent before this change, still work");
/* Hand-build a v1 (positional) token exactly as the old code did. */
function b64url(s) {
  var b = H.win.btoa(unescape(encodeURIComponent(s)));
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
var wi = -1, qi = -1;
realReg.forEach(function (g, i) { if (g.id === "wordish") wi = i; if (g.id === "quartets") qi = i; });
var v1body = ["1", 40, "player", wi + ",78,1,4/6;" + qi + ",91,1,1 away"].join("|");
var v1 = b64url(v1body) + "." + A.hash(v1body).toString(36);
var v1out = A.unpackCard(v1);
H.ok(!!v1out, "a version 1 token decodes");
H.eq(v1out.results.wordish.norm, 78, "and maps its indexes correctly");
H.eq(v1out.results.quartets.detail, "1 away", "including the detail line");

H.section("a card naming a game this build doesn't have");
var unknown = ["2", 40, "player", "wordish,80,1,3/6;not-a-game,99,1,x"].join("|");
var utok = b64url(unknown) + "." + A.hash(unknown).toString(36);
var uout = A.unpackCard(utok);
H.ok(!!uout, "still decodes rather than throwing");
H.eq(uout.played, 1, "and quietly drops the game it doesn't know");

H.section("empty and odd cards");
H.reset(); H.atDay(40);
load("core/registry.js"); load("core/arcade.js"); load("core/ui.js");
var empty = A.unpackCard(A.packCard(40));
H.eq(empty.played, 0, "a day with nothing played packs and unpacks as empty");
H.eq(empty.mean, 0, "and means zero rather than NaN");
H.ok(isFinite(empty.total), "and totals a real number: " + empty.total);

play(41, [{ id: "wordish", norm: 100, won: true, detail: "a,b;c|d" }]);
var odd = A.unpackCard(A.packCard(41));
H.ok(!!odd, "a detail containing the delimiters , ; | still round-trips");
H.eq(odd.played, 1, "without corrupting the card");
H.ok(odd.results.wordish.detail.indexOf(";") < 0 &&
     odd.results.wordish.detail.indexOf("|") < 0,
     "the delimiters are stripped, not smuggled through: " +
     JSON.stringify(odd.results.wordish.detail));

H.section("a name with an emoji or an accent");
var st = A.card(40);
A.setName && A.setName("Mîshâ 💗");
play(42, [{ id: "wordish", norm: 70, won: true }]);
var named = A.unpackCard(A.packCard(42));
H.ok(!!named, "a non-ASCII player name round-trips");

H.calendar(null);
H.done();
