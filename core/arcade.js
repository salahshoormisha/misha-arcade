/* ============================================================================
   MIDNIGHT ARCADE · DAILY WING — core engine
   ----------------------------------------------------------------------------
   One shared brain for every daily game in the arcade: deterministic daily
   puzzles (so two people on two laptops get the same puzzle with no server),
   per-game state + stats + streaks, a normalised cross-game score, share
   cards, serverless head-to-head, the passport, and backup/restore.

   Loaded as a plain script. Exposes one global: A
   No dependencies. No build step. Works offline.
   ========================================================================== */
(function (root) {
  "use strict";

  var A = {};
  root.A = A;

  /* ── config ──────────────────────────────────────────────────────────── */

  // Day 0 of the arcade. Everything daily is indexed off this, in LOCAL time,
  // so a puzzle "day" turns over at the player's midnight, like NYT games.
  A.EPOCH = "2026-07-25";
  A.NS = "ag_";               // localStorage namespace
  A.VERSION = 1;

  /* ── tiny utils ──────────────────────────────────────────────────────── */

  A.clamp = function (n, lo, hi) { return n < lo ? lo : n > hi ? hi : n; };

  A.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  A.fmtTime = function (ms) {
    var t = Math.max(0, Math.round(ms / 1000));
    var m = Math.floor(t / 60), s = t % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  };

  A.fmtNum = function (n) {
    return (n === null || n === undefined || isNaN(n)) ? "—" : Number(n).toLocaleString();
  };

  // Loose name key: lowercase, diacritics stripped, punctuation flattened.
  // Lives here rather than in picker.js because games that never draw a picker
  // still need to compare names ("is this capital just the country again?").
  A.normName = function (s) {
    s = String(s).toLowerCase();
    if (s.normalize) s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return s.replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  };

  // Great-circle distance in km — used by every geo game, so it lives here.
  A.haversine = function (lat1, lon1, lat2, lon2) {
    var R = 6371, r = Math.PI / 180;
    var dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  };

  // Initial bearing lat1,lon1 → lat2,lon2, in degrees from north.
  A.bearing = function (lat1, lon1, lat2, lon2) {
    var r = Math.PI / 180;
    var y = Math.sin((lon2 - lon1) * r) * Math.cos(lat2 * r);
    var x = Math.cos(lat1 * r) * Math.sin(lat2 * r) -
      Math.sin(lat1 * r) * Math.cos(lat2 * r) * Math.cos((lon2 - lon1) * r);
    return (Math.atan2(y, x) / r + 360) % 360;
  };

  // 8-point arrow for a bearing — the universal *-dle feedback glyph.
  A.arrow = function (deg) {
    return ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"][Math.round(((deg % 360) / 45)) % 8];
  };

  // Proximity helpers. These live here, not in worldmap.js: they are pure
  // maths that every geo game needs, including the ones that draw no map.
  A.geo = {
    // 0..1 closeness, the *-dle convention (max distance ≈ half the globe)
    prox: function (km) { return A.clamp(1 - km / 20015, 0, 1); },
    // Globle-style heat colour: near = hot
    heat: function (km) {
      var t = A.clamp(1 - km / 12000, 0, 1);
      var stops = [[0, [70, 50, 140]], [.45, [255, 216, 79]], [.75, [255, 140, 60]], [1, [255, 45, 90]]];
      for (var i = 1; i < stops.length; i++) {
        if (t <= stops[i][0]) {
          var a = stops[i - 1], b = stops[i], f = (t - a[0]) / (b[0] - a[0]);
          return "rgb(" + a[1].map(function (v, k) { return Math.round(v + (b[1][k] - v) * f); }).join(",") + ")";
        }
      }
      return "rgb(255,45,90)";
    },
    km: function (n) { return n < 10 ? n.toFixed(1) + " km" : Math.round(n).toLocaleString() + " km"; },
  };

  /* ── dates ───────────────────────────────────────────────────────────── */

  function ymd(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  // Parse "YYYY-MM-DD" as a LOCAL date (new Date("...") would read it as UTC).
  function parseLocal(s) {
    var p = String(s).split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  A.today = function () { return ymd(new Date()); };

  A.dayNumber = function (dateStr) {
    var a = parseLocal(dateStr || A.today()), b = parseLocal(A.EPOCH);
    // Compare at noon to be immune to DST shifts.
    a.setHours(12, 0, 0, 0); b.setHours(12, 0, 0, 0);
    return Math.round((a - b) / 86400000);
  };

  A.dateFromDay = function (n) {
    var b = parseLocal(A.EPOCH);
    b.setHours(12, 0, 0, 0);
    b.setDate(b.getDate() + n);
    return ymd(b);
  };

  A.prettyDate = function (n) {
    var d = parseLocal(A.dateFromDay(n));
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  A.msToMidnight = function () {
    var n = new Date(), m = new Date(n);
    m.setHours(24, 0, 0, 0);
    return m - n;
  };

  /* ── deterministic randomness ────────────────────────────────────────── */

  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
    }
    return h >>> 0;
  }
  A.hash = fnv1a;

  // mulberry32 — small, fast, good enough, and identical on every device.
  A.rng = function (seed) {
    var a = typeof seed === "number" ? seed >>> 0 : fnv1a(String(seed));
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  A.rngFor = function (gameId, dayN) { return A.rng(gameId + ":" + dayN); };

  A.pick = function (rand, arr) { return arr[Math.floor(rand() * arr.length)]; };

  A.shuffle = function (rand, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  A.sample = function (rand, arr, n) { return A.shuffle(rand, arr).slice(0, n); };

  /**
   * Which item of a pool does day `dayN` get?
   * A seeded permutation of the whole pool, reshuffled every cycle — so you
   * never see a repeat until you've seen all of them, and both players get
   * the same one. This is strictly better than the usual `dayN % pool`.
   */
  A.dailyIndex = function (gameId, dayN, poolSize) {
    if (!poolSize) return 0;
    var cycle = Math.floor(dayN / poolSize);
    var pos = ((dayN % poolSize) + poolSize) % poolSize;
    var order = [];
    for (var i = 0; i < poolSize; i++) order.push(i);
    return A.shuffle(A.rng(gameId + "#" + cycle), order)[pos];
  };

  /* ── storage ─────────────────────────────────────────────────────────── */

  var memFallback = {};   // if localStorage is unavailable (private mode, quota)
  var lsOK = (function () {
    try { localStorage.setItem(A.NS + "t", "1"); localStorage.removeItem(A.NS + "t"); return true; }
    catch (e) { return false; }
  })();

  function raw(k) {
    try { return lsOK ? localStorage.getItem(k) : (k in memFallback ? memFallback[k] : null); }
    catch (e) { return null; }
  }
  function setRaw(k, v) {
    try { if (lsOK) localStorage.setItem(k, v); else memFallback[k] = v; }
    catch (e) { memFallback[k] = v; A.toast && A.toast("Storage full — progress may not save"); }
  }
  function delRaw(k) {
    try { if (lsOK) localStorage.removeItem(k); else delete memFallback[k]; } catch (e) {}
  }
  function getJSON(k, dflt) {
    var v = raw(k);
    if (v === null) return dflt;
    try { return JSON.parse(v); } catch (e) { return dflt; }
  }
  function setJSON(k, o) { setRaw(k, JSON.stringify(o)); }

  A.storageOK = lsOK;
  A._get = getJSON; A._set = setJSON;

  function keyDay(g, d) { return A.NS + "d:" + g + ":" + d; }
  function keyStats(g) { return A.NS + "s:" + g; }

  /* ── events ──────────────────────────────────────────────────────────── */

  var handlers = {};
  A.on = function (evt, fn) { (handlers[evt] || (handlers[evt] = [])).push(fn); return A; };
  A.emit = function (evt, payload) {
    (handlers[evt] || []).forEach(function (fn) { try { fn(payload); } catch (e) { console.warn(e); } });
  };

  /* ── settings ────────────────────────────────────────────────────────── */

  var DEFAULT_SETTINGS = {
    player: "",          // "" until chosen; "misha" | "david" | any name
    hardMode: false,
    colourblind: false,
    sound: true,
    reduceMotion: false,
    glam: false,
    lastBackup: 0,
  };

  A.settings = function () {
    var s = getJSON(A.NS + "settings", null) || {};
    var out = {};
    for (var k in DEFAULT_SETTINGS) out[k] = (k in s) ? s[k] : DEFAULT_SETTINGS[k];
    // The hub's GLAM MODE easter egg predates this engine — respect its key.
    if (raw("arcade_glam") === "1") out.glam = true;
    return out;
  };

  A.set = function (k, v) {
    var s = A.settings();
    s[k] = v;
    setJSON(A.NS + "settings", s);
    if (k === "glam") { try { localStorage.setItem("arcade_glam", v ? "1" : "0"); } catch (e) {} }
    A.applySettings();
    A.emit("settings", s);
    return s;
  };

  A.player = function () {
    var p = A.settings().player;
    return p || "";
  };

  A.applySettings = function () {
    var s = A.settings(), b = document.body;
    if (!b) return;
    b.classList.toggle("cb", !!s.colourblind);
    b.classList.toggle("glam", !!s.glam);
    b.classList.toggle("rm", !!s.reduceMotion ||
      (root.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches));
  };

  /* ── per-day game state ──────────────────────────────────────────────── */

  A.load = function (gameId, dayN) { return getJSON(keyDay(gameId, dayN), null); };

  A.save = function (gameId, dayN, obj) {
    if (dayN === A.PRACTICE) return obj;           // practice never persists
    var prev = A.load(gameId, dayN) || {};
    var merged = Object.assign({}, prev, obj, { _t: Date.now() });
    setJSON(keyDay(gameId, dayN), merged);
    return merged;
  };

  A.PRACTICE = -999999;   // pass as dayN for unlimited/practice play

  A.isDone = function (gameId, dayN) {
    var s = A.load(gameId, dayN);
    return !!(s && s.done);
  };

  /* ── stats ───────────────────────────────────────────────────────────── */

  function blankStats() {
    return {
      played: 0, wins: 0, streak: 0, maxStreak: 0, lastDay: null,
      best: null, sumNorm: 0, bestNorm: 0, curve: {}, totalMs: 0,
    };
  }

  A.stats = function (gameId) {
    var s = Object.assign(blankStats(), getJSON(keyStats(gameId), {}));
    s.avgNorm = s.played ? Math.round(s.sumNorm / s.played) : 0;
    s.winPct = s.played ? Math.round(100 * s.wins / s.played) : 0;
    return s;
  };

  /**
   * Finish a game for a day. Idempotent: calling twice for the same
   * (gameId, dayN) will not double-count. Returns the stored result.
   *
   * res = { score, norm, won, detail, shareGrid, stamps, durationMs, bucket }
   *   norm    0..100 cross-game currency (see CONTRACT §3) — required
   *   bucket  optional key for the distribution chart (e.g. guesses used)
   */
  A.finish = function (gameId, dayN, res) {
    res = res || {};
    var result = {
      done: true,
      won: !!res.won,
      score: res.score === undefined ? null : res.score,
      norm: A.clamp(Math.round(res.norm || 0), 0, 100),
      detail: res.detail || "",
      shareGrid: res.shareGrid || [],
      stamps: res.stamps || [],
      durationMs: res.durationMs || 0,
      bucket: res.bucket === undefined ? null : res.bucket,
      at: Date.now(),
      day: dayN,
      game: gameId,
    };

    if (dayN === A.PRACTICE) { A.emit("finish", result); return result; }

    var already = A.load(gameId, dayN);
    var first = !(already && already.done);
    A.save(gameId, dayN, result);

    if (first) {
      var s = Object.assign(blankStats(), getJSON(keyStats(gameId), {}));
      s.played++;
      if (result.won) s.wins++;
      s.sumNorm += result.norm;
      s.bestNorm = Math.max(s.bestNorm || 0, result.norm);
      if (result.score !== null) s.best = (s.best === null) ? result.score : Math.max(s.best, result.score);
      s.totalMs += result.durationMs || 0;
      if (result.bucket !== null) {
        var b = String(result.bucket);
        s.curve[b] = (s.curve[b] || 0) + 1;
      }
      // Win streak, in the usual daily-game sense: consecutive days won.
      if (result.won) {
        s.streak = (s.lastDay !== null && dayN === s.lastDay + 1) ? s.streak + 1 : 1;
      } else {
        s.streak = 0;
      }
      s.lastDay = (s.lastDay === null) ? dayN : Math.max(s.lastDay, dayN);
      s.maxStreak = Math.max(s.maxStreak || 0, s.streak);
      setJSON(keyStats(gameId), s);

      (result.stamps || []).forEach(function (iso) { A.stamp(iso, gameId); });
      touchRun(dayN);
    }

    A.emit("finish", result);
    return result;
  };

  /* ── the daily run (cross-game) ──────────────────────────────────────── */

  // Days on which the player finished at least one game — the global streak.
  function touchRun(dayN) {
    var r = getJSON(A.NS + "run", { days: [] });
    if (r.days.indexOf(dayN) < 0) { r.days.push(dayN); r.days.sort(function (a, b) { return a - b; }); }
    setJSON(A.NS + "run", r);
  }

  A.runStreak = function () {
    var days = (getJSON(A.NS + "run", { days: [] }).days || []);
    if (!days.length) return { current: 0, max: 0, total: 0 };
    var set = {}; days.forEach(function (d) { set[d] = 1; });
    var today = A.dayNumber();
    var cur = 0, probe = set[today] ? today : (set[today - 1] ? today - 1 : null);
    if (probe !== null) { while (set[probe]) { cur++; probe--; } }
    var max = 0, run = 0, prev = null;
    days.forEach(function (d) { run = (prev !== null && d === prev + 1) ? run + 1 : 1; max = Math.max(max, run); prev = d; });
    return { current: cur, max: max, total: days.length };
  };

  /**
   * The day's card: every game's result, plus a total.
   * `total` is the mean norm over games PLAYED (so playing 3 games well beats
   * playing 12 badly), with a small completion bonus for breadth.
   */
  A.card = function (dayN) {
    if (dayN === undefined) dayN = A.dayNumber();
    var out = { day: dayN, date: A.dateFromDay(dayN), results: {}, played: 0, sum: 0, name: A.player() };
    (A.registry || []).forEach(function (g) {
      var st = A.load(g.id, dayN);
      if (st && st.done) {
        out.results[g.id] = { norm: st.norm, detail: st.detail, won: st.won, score: st.score };
        out.played++; out.sum += st.norm;
      }
    });
    out.mean = out.played ? Math.round(out.sum / out.played) : 0;
    var breadth = Math.min(1, out.played / 6);          // 6 games = full breadth
    out.total = Math.round(out.mean * (0.85 + 0.15 * breadth));
    return out;
  };

  /* ── par: something to measure yourself against, with no server ────────
     The real games tell you how you did versus everyone else. We have no
     server and never will, so instead each game can declare how hard TODAY'S
     puzzle is, and par is that difficulty blended with your own record. It is
     honest — it never pretends to be a crowd — and it gives them the thing
     they actually want: a number to beat.                                  */

  var parFns = {};
  A.setPar = function (gameId, fn) { parFns[gameId] = fn; };

  A.par = function (gameId, dayN) {
    var s = A.stats(gameId);
    var mine = s.played >= 3 ? s.avgNorm : null;
    var hard = null;
    if (parFns[gameId]) {
      try { hard = parFns[gameId](dayN); } catch (e) { hard = null; }
    }
    // A game's own difficulty estimate leads; your average pulls it toward you.
    var par, source;
    if (hard !== null && mine !== null) { par = Math.round(hard * 0.6 + mine * 0.4); source = "difficulty + your form"; }
    else if (hard !== null) { par = Math.round(hard); source = "today's difficulty"; }
    else if (mine !== null) { par = mine; source = "your average"; }
    else { par = 70; source = "a solid day"; }
    return { par: A.clamp(par, 5, 98), source: source };
  };

  /* ── records: the team's own high scores to chase ────────────────────── */

  A.records = function () {
    var out = { bestCard: null, bestDay: null, perGame: {}, weeks: {} };
    var days = (getJSON(A.NS + "run", { days: [] }).days || []);
    days.forEach(function (d) {
      var c = A.card(d);
      if (!out.bestCard || c.total > out.bestCard) { out.bestCard = c.total; out.bestDay = d; }
      var wk = Math.floor(d / 7);
      var w = out.weeks[wk] || (out.weeks[wk] = { n: 0, sum: 0, week: wk });
      w.n++; w.sum += c.total;
    });
    Object.keys(out.weeks).forEach(function (k) {
      out.weeks[k].avg = Math.round(out.weeks[k].sum / out.weeks[k].n);
    });
    (A.registry || []).forEach(function (g) {
      var s = A.stats(g.id);
      if (s.played) out.perGame[g.id] = { best: s.bestNorm, avg: s.avgNorm, played: s.played, streak: s.streak };
    });
    return out;
  };

  // This week vs last week — the co-op scoreboard.
  A.weekForm = function () {
    var r = A.records();
    var thisWk = Math.floor(A.dayNumber() / 7);
    var a = r.weeks[thisWk], b = r.weeks[thisWk - 1];
    return {
      thisWeek: a ? a.avg : null, thisN: a ? a.n : 0,
      lastWeek: b ? b.avg : null, lastN: b ? b.n : 0,
      delta: (a && b) ? a.avg - b.avg : null,
    };
  };

  /* ── share cards ─────────────────────────────────────────────────────── */

  A.SITE = "https://salahshoormisha.github.io/misha-arcade/";

  A.shareCard = function (gameId, dayN) {
    var g = A.game(gameId), st = A.load(gameId, dayN);
    if (!st || !st.done) return "";
    var head = (g ? g.name : gameId.toUpperCase()) + " #" + dayN + " · " + (st.detail || (st.won ? "solved" : "missed"));
    var body = (st.shareGrid || []).join("\n");
    return head + (body ? "\n" + body : "") + "\n" + A.SITE;
  };

  A.runCard = function (dayN) {
    var c = A.card(dayN);
    var lines = ["🕹️ MIDNIGHT ARCADE · DAY " + dayN, ""];
    (A.registry || []).forEach(function (g) {
      var r = c.results[g.id];
      if (r) lines.push(g.icon + " " + g.name + " " + bar(r.norm) + " " + (r.detail || r.norm));
    });
    lines.push("", "CARD " + c.total + "/100 · " + c.played + " game" + (c.played === 1 ? "" : "s"));
    var rs = A.runStreak();
    if (rs.current > 1) lines.push("🔥 " + rs.current + "-day run");
    lines.push(A.SITE + "daily/");
    return lines.join("\n");
  };

  function bar(n) {
    var full = Math.round(A.clamp(n, 0, 100) / 20);
    return "█".repeat(full) + "░".repeat(5 - full);
  }
  A.bar = bar;

  A.share = function (text) {
    if (!text) return Promise.resolve(false);
    var done = function (msg) { A.toast && A.toast(msg); return true; };
    if (navigator.share) {
      return navigator.share({ text: text }).then(function () { return true; })
        .catch(function () { return A.copy(text).then(function () { return done("Copied to clipboard"); }); });
    }
    return A.copy(text).then(function (ok) { return ok ? done("Copied to clipboard") : done("Couldn't copy — select and copy manually"); });
  };

  A.copy = function (text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  };

  function legacyCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  /* ── head-to-head: pack a day's card into a URL ──────────────────────────
     No server, no accounts. Your results become a short token you can text;
     opening the link shows the H2H table and lets the other person reply with
     theirs. Format (then base64url + a checksum so a mangled paste is caught):

       1|<dayN>|<name>|<id>,<norm>,<won>,<detail>;<id>,<norm>,<won>,<detail>...

     Game ids are indexes into the registry to keep it short.
     ------------------------------------------------------------------------- */

  function b64url(s) {
    return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function unb64url(s) {
    s = String(s).replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return decodeURIComponent(escape(atob(s)));
  }

  /* Version 2 names each game by its own id. Version 1 used the game's INDEX in
     the registry, which is fine right up until a cabinet is inserted anywhere
     but the end — after that an older link decodes cleanly into the WRONG
     games, reporting a Wordle score as a Flagle one with no error anywhere. A
     link that fails loudly is recoverable; one that lies is not. Ids cost about
     forty characters in a URL hash, which nobody reads. Version 1 tokens are
     still accepted so any link already sent keeps working. */
  A.packCard = function (dayN) {
    var c = A.card(dayN), parts = [];
    (A.registry || []).forEach(function (g) {
      var r = c.results[g.id];
      if (r) parts.push([g.id, r.norm, r.won ? 1 : 0,
        String(r.detail || "").replace(/[;,|]/g, " ").slice(0, 12)].join(","));
    });
    var body = ["2", dayN, (c.name || "player").replace(/[|]/g, ""), parts.join(";")].join("|");
    return b64url(body) + "." + fnv1a(body).toString(36);
  };

  A.unpackCard = function (token) {
    try {
      var bits = String(token).split(".");
      var body = unb64url(bits[0]);
      if (bits[1] && fnv1a(body).toString(36) !== bits[1]) return null;   // mangled
      var f = body.split("|");
      if (f[0] !== "1" && f[0] !== "2") return null;
      var byIndex = f[0] === "1";      // the old positional format
      var out = { day: +f[1], name: f[2] || "player", results: {}, played: 0, sum: 0 };
      (f[3] ? f[3].split(";") : []).forEach(function (p) {
        var q = p.split(","), reg = A.registry || [], g;
        if (byIndex) {
          g = reg[+q[0]];
        } else {
          for (var i = 0; i < reg.length; i++) if (reg[i].id === q[0]) { g = reg[i]; break; }
        }
        if (!g) return;                // a game this build doesn't have: skip it
        out.results[g.id] = { norm: +q[1], won: q[2] === "1", detail: q[3] || "" };
        out.played++; out.sum += +q[1];
      });
      out.mean = out.played ? Math.round(out.sum / out.played) : 0;
      var breadth = Math.min(1, out.played / 6);
      out.total = Math.round(out.mean * (0.85 + 0.15 * breadth));
      return out;
    } catch (e) { return null; }
  };

  A.duelLink = function (dayN) {
    if (dayN === undefined) dayN = A.dayNumber();
    var base = location.href.replace(/[#?].*$/, "");
    // Always point at league/, wherever we're called from.
    base = base.replace(/\/(games\/[^/]+|daily|league|passport)\/?[^/]*$/, "/") ;
    if (!/\/$/.test(base)) base += "/";
    return base + "league/#c=" + A.packCard(dayN);
  };

  A.readDuel = function () {
    var m = /[#&]c=([^&]+)/.exec(location.hash);
    return m ? A.unpackCard(m[1]) : null;
  };

  /* ── the league (local record of head-to-heads) ──────────────────────── */

  A.league = function () {
    return getJSON(A.NS + "league", { matches: {}, opponent: "" });
  };

  A.recordMatch = function (dayN, theirs) {
    var L = A.league();
    var mine = A.card(dayN);
    L.opponent = theirs.name || L.opponent || "David";
    L.matches[dayN] = {
      day: dayN,
      mine: { name: mine.name || "You", total: mine.total, played: mine.played, results: mine.results },
      theirs: { name: theirs.name, total: theirs.total, played: theirs.played, results: theirs.results },
      at: Date.now(),
    };
    setJSON(A.NS + "league", L);
    return L.matches[dayN];
  };

  A.leagueTable = function () {
    var L = A.league(), me = 0, them = 0, draws = 0, byGame = {}, days = [];
    Object.keys(L.matches).sort(function (a, b) { return a - b; }).forEach(function (k) {
      var m = L.matches[k];
      days.push(m);
      if (m.mine.total > m.theirs.total) me++;
      else if (m.mine.total < m.theirs.total) them++;
      else draws++;
      Object.keys(m.mine.results).forEach(function (g) {
        if (!m.theirs.results[g]) return;
        byGame[g] = byGame[g] || { me: 0, them: 0, draw: 0 };
        var a = m.mine.results[g].norm, b = m.theirs.results[g].norm;
        if (a > b) byGame[g].me++; else if (b > a) byGame[g].them++; else byGame[g].draw++;
      });
    });
    return { me: me, them: them, draws: draws, byGame: byGame, days: days, opponent: L.opponent || "David" };
  };

  /* ── the passport ────────────────────────────────────────────────────── */

  A.passport = function () { return getJSON(A.NS + "passport", {}); };

  A.stamp = function (iso2, gameId) {
    if (!iso2 || String(iso2).length !== 2) return;
    iso2 = String(iso2).toUpperCase();
    var p = A.passport();
    if (!p[iso2]) p[iso2] = { first: A.today(), games: [], n: 0 };
    if (p[iso2].games.indexOf(gameId) < 0) p[iso2].games.push(gameId);
    p[iso2].n = (p[iso2].n || 0) + 1;
    p[iso2].last = A.today();
    setJSON(A.NS + "passport", p);
    A.emit("stamp", { iso2: iso2, game: gameId, entry: p[iso2] });
  };

  A.passportCount = function () { return Object.keys(A.passport()).length; };

  /* ── registry ────────────────────────────────────────────────────────── */

  // Populated by core/registry.js (static, so the hub knows every game without
  // loading every game). A.register() lets a game self-describe / override.
  A.registry = root.AD_REGISTRY || [];

  A.game = function (id) {
    for (var i = 0; i < A.registry.length; i++) if (A.registry[i].id === id) return A.registry[i];
    return null;
  };

  A.register = function (meta) {
    var existing = A.game(meta.id);
    if (existing) Object.assign(existing, meta);
    else A.registry.push(meta);
    A.current = A.game(meta.id);
    return A.current;
  };

  /* ── backup / restore ────────────────────────────────────────────────── */

  A.backup = function () {
    var out = { _arcade: "midnight-arcade-backup", v: A.VERSION, at: new Date().toISOString(), keys: {} };
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf(A.NS) === 0 || k === "arcade_glam" || /^(mm_hi|tt_hi|tt_sprint)$/.test(k)) {
          out.keys[k] = localStorage.getItem(k);
        }
      }
    } catch (e) {}
    return JSON.stringify(out);
  };

  A.download = function (filename, text) {
    var b = new Blob([text], { type: "application/json" });
    var u = URL.createObjectURL(b), a = document.createElement("a");
    a.href = u; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 400);
  };

  A.backupNow = function () {
    A.download("midnight-arcade-" + A.today() + ".json", A.backup());
    A.set("lastBackup", Date.now());
  };

  A.restore = function (json) {
    try {
      var o = JSON.parse(json);
      if (!o || o._arcade !== "midnight-arcade-backup" || !o.keys) return false;
      Object.keys(o.keys).forEach(function (k) { setRaw(k, o.keys[k]); });
      return true;
    } catch (e) { return false; }
  };

  // A short code you can paste between devices when you can't move a file.
  A.syncCode = function () { return b64url(A.backup()); };
  A.applySyncCode = function (code) {
    try { return A.restore(unb64url(String(code).trim())); } catch (e) { return false; }
  };

  A.backupDue = function () {
    var s = A.settings();
    var played = A.runStreak().total;
    return played >= 5 && (Date.now() - (s.lastBackup || 0)) > 14 * 864e5;
  };

  A.wipe = function () {
    var kill = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf(A.NS) === 0) kill.push(k);
      }
    } catch (e) {}
    kill.forEach(delRaw);
  };

  /* ── boot ────────────────────────────────────────────────────────────── */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", A.applySettings);
  } else {
    A.applySettings();
  }

})(window);
