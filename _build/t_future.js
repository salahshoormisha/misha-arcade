/* t_future.js — does the arcade still work in five years?
     JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
     $JSC _build/harness.js -e 'load("_build/t_future.js")'

   Every cabinet picks its puzzle with A.dailyIndex(gameId, dayN, poolSize),
   which walks a seeded permutation so nothing repeats until the pool is spent.
   What happens on the day AFTER it is spent is the interesting question, and no
   other test asks it: t_all.js boots each cabinet on today, and the per-cabinet
   suites mostly sweep the handful of days that have actually elapsed since the
   epoch. A cabinet that divides by a pool length, indexes past the end, or
   assumes dayN < pool would sail through all of that and then break silently on
   an ordinary morning months from now — by which point the cause is long buried.

   So: boot every cabinet at a spread of real future days and require it to come
   up clean. This proves the cabinet BOOTS on that day. It does not prove the
   puzzle is any good.                                                        */

var HOOKS = {
  atlas: "__AT", boxed: "__BX", chrono: "__CH", cluedrop: "__CD",
  connectrade: "__CT", decider: "__DC", flagle: "__FL", foodguessr: "__FG",
  geogrid: "__GG", globle: "__GL", lingua: "__LG", linxicon: "__LX",
  midi: "__MD", mini: "__MN", misaligned: "__MI", outline: "__OL",
  phylo: "__PH", pick5: "__P5", placeguessr: "__PG", quartets: "__QT",
  thirdle: "__TH", timeguessr: "__TG", tradle: "__TR", wordish: "__WD",
};

/* today, a week, a season, a year, two years, five years, and a deliberately
   absurd one — the arcade should degrade, never explode. */
var DAYS = [0, 7, 100, 365, 730, 1825, 5000];

var ids = Object.keys(HOOKS).sort();
var trouble = [];

DAYS.forEach(function (day) {
  H.section("day " + day + (day === 0 ? "  (the epoch)"
            : day === 365 ? "  (a year in)"
            : day === 1825 ? "  (five years in)" : ""));
  var broke = [];

  ids.forEach(function (id) {
    H.reset();
    H.atDay(day + 1);          // "today" is past the day we ask for
    H.url("?d=" + day);
    delete globalThis[HOOKS[id]];

    var errs = 0, realError = console.error;
    console.error = function () { errs++; };
    var why = null;
    try {
      H.html("games/" + id + "/index.html");
      H.scripts.forEach(function (src) {
        var p = src.replace(/\?.*$/, "");
        p = p.indexOf("../../") === 0 ? p.slice(6) : "games/" + id + "/" + p;
        load(p);
      });
      H.boot();
    } catch (e) {
      why = String((e && e.message) || e);
    }
    console.error = realError;

    if (typeof globalThis[HOOKS[id]] !== "object") {
      broke.push(id + (why ? " (" + why + ")" : " (bailed out)"));
      trouble.push("day " + day + ": " + id);
    } else if (errs) {
      broke.push(id + " (" + errs + " console errors)");
      trouble.push("day " + day + ": " + id + " — console errors");
    }
  });

  H.eq(broke.join(", ") || "none", "none",
       ids.length + " cabinets boot on day " + day);
});

H.calendar(null);              // put the real clock back for anything after us

H.section("summary");
if (trouble.length) {
  print("  broke somewhere in the future:");
  trouble.forEach(function (t) { print("    " + t); });
} else {
  print("  all " + ids.length + " cabinets boot on every day tested, out to " +
        DAYS[DAYS.length - 1] + " days (" +
        (DAYS[DAYS.length - 1] / 365).toFixed(1) + " years) past the epoch");
}

H.done();
