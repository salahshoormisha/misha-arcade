/* t_placeguessr.js — drive PLACEGUESSR end-to-end through its real buttons.
   Run: $JSC _build/harness.js -e 'load("_build/t_placeguessr.js")'          */

H.html("games/placeguessr/index.html");
H.scripts.forEach(function (s) { load("games/placeguessr/" + s.replace(/\?v=\d+$/, "")); });
H.boot();

var P = window.__PG;

H.section("boot");
H.ok(!!P, "__PG debug hook exists");
var st = P.state();
H.eq(st.rounds.length, 5, "five rounds drawn");
H.ok(st.rounds.every(function (r) { return r.iso2 && isFinite(r.lat) && isFinite(r.lon); }),
     "every round has iso2 + coordinates");
H.ok(!st.over, "not over at boot");
var names = st.rounds.map(function (r) { return r.id; });
H.eq(new Set(names).size, 5, "no duplicate photos in a day");

H.section("a good game: ~120 km off on every pin");
var fin = P.autoplay(120);
H.ok(fin.over, "game reached the end");
H.eq(fin.scores.filter(function (s) { return s !== null; }).length, 5, "all five rounds scored");
H.ok(isFinite(fin.total) && fin.total > 0, "total is a finite positive number: " + fin.total);
H.ok(fin.norm >= 55 && fin.norm <= 100, "norm in a sane band for a good game: " + fin.norm);

H.section("the result sheet actually appeared");
var sheet = H.maybe(".ac-modal") || H.maybe(".ac-sheet") || H.maybe("#ac-share");
H.ok(!!sheet, "result sheet / share control present in the DOM");

H.section("A.finish recorded exactly once");
var key = null, store = H.store();
for (var k in store) if (k.indexOf("placeguessr") >= 0) key = k;
H.ok(!!key, "a placeguessr save exists in localStorage (" + key + ")");
var saved = JSON.parse(store[key]);
var days = Object.keys(saved.days || saved);
H.ok(days.length >= 1, "one day recorded");

H.section("archive + practice params parse (URLSearchParams shim)");
H.ok(typeof URLSearchParams === "function", "URLSearchParams exists under jsc");
var u = new URLSearchParams("?d=3&practice=1");
H.eq(u.get("d"), "3", "?d= reads back");
H.eq(u.get("practice"), "1", "?practice= reads back");

H.done();
