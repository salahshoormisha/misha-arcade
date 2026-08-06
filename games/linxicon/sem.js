/* ============================================================================
   SEM — the link rule, evaluated in the browser.
   ----------------------------------------------------------------------------
   _build/sem_linkgraph.py defines exactly one rule, and this file is that rule:

       u–v is a LINK  IFF  at least two people in the Small World of Words norms
                           answered one of these words with the other
                     OR    cos(u, v) >= TAU.

   Both halves have to be here or the check would quietly become "cosine only",
   which is a different game — cosine cannot see that PEPPER makes people say
   SALT, and it thinks HOT and COLD are nearly the same word.

     · the human half  → core/data/semlinks.js (178 KB, loads with the page)
     · the cosine half → core/data/semantic.js (words + codebook, 92 KB) plus
       core/data/semantic-v0..v8.js (2.2 MB of 4-bit codes). THOSE ARE LAZY.
       They are pulled in only by this cabinet, only once, behind a progress
       bar, and the browser caches them afterwards.

   WHY SHIP VECTORS AT ALL rather than a precomputed list of legal moves:
     1. the player may type any of the 11,600 words, from any of the 11,600
        words, so "this day's legal moves" is not a bounded set — it is the
        whole graph;
     2. scoring rewards BOLDNESS, which is the cosine of the step you took, so
        the number is needed anyway, per move, live;
     3. the same cosines drive the warmth reading (how close you are to the
        target), which is what makes the puzzle playable rather than a guess;
     4. precomputing the cosine half over the full vocabulary is ~20 billion
        multiplications — sem_linkgraph.py only ever did it for a 4,200-word
        core, which is why the shipped path length is a "shortest KNOWN" one.

   Vectors are unit-length, so a dot product IS a cosine. Codes are 4-bit, two
   per byte, hi nibble first, 300 dims = 150 bytes per word. Decoded vectors are
   cached; the cache is bounded because a long session can touch a lot of words.
   ========================================================================== */
window.SEM = (function () {
  "use strict";

  var S = {
    ready: false,        // are the vectors in?
    n: 0,
    tau: 0.3229,
    words: [],
  };

  var META = window.AD_SEM || null;
  var IDX = null;        // word -> id
  var CODES = null;      // Uint8Array, 150 bytes per word
  var CB = null;         // 16 reconstruction levels
  var LINKS = null;      // sorted Int32Array of min*n+max association keys
  var cache = null, cacheKeys = null;
  var CACHE_MAX = 3000;

  /* ── vocabulary (available immediately — semantic.js is small) ────────── */

  if (META && META.words) {
    S.words = META.words.split(" ");
    S.n = S.words.length;
    CB = META.cb;
    IDX = Object.create(null);
    for (var i = 0; i < S.words.length; i++) IDX[S.words[i]] = i;
  }

  S.id = function (w) {
    if (!IDX) return -1;
    var k = String(w == null ? "" : w).trim().toLowerCase();
    var v = IDX[k];
    return v === undefined ? -1 : v;
  };
  S.word = function (id) { return S.words[id] || ""; };

  /* ── the human half ──────────────────────────────────────────────────── */

  (function () {
    var L = window.AD_SEMLINKS;
    if (!L || !L.parts) return;
    S.tau = L.tau || S.tau;
    var bytes = b64parts(L.parts, L.bytes);
    var out = new Int32Array(L.count), p = 0, run = 0, k = 0;
    while (p < bytes.length && k < out.length) {
      var shift = 0, val = 0, b;
      do { b = bytes[p++]; val |= (b & 0x7F) << shift; shift += 7; } while (b & 0x80);
      run += val;
      out[k++] = run;
    }
    LINKS = out;
  })();

  // Binary search — the keys are sorted by construction, so this is exact and
  // allocates nothing. A Set of 80k numbers would work too and cost far more.
  S.assoc = function (a, b) {
    if (!LINKS || a === b || a < 0 || b < 0) return false;
    var key = (a < b ? a : b) * S.n + (a < b ? b : a);
    var lo = 0, hi = LINKS.length - 1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1, v = LINKS[mid];
      if (v === key) return true;
      if (v < key) lo = mid + 1; else hi = mid - 1;
    }
    return false;
  };

  /* ── the cosine half ─────────────────────────────────────────────────── */

  function b64parts(parts, total) {
    var out = new Uint8Array(total), at = 0;
    for (var p = 0; p < parts.length; p++) {
      var bin = atob(parts[p]);
      for (var j = 0; j < bin.length; j++) out[at + j] = bin.charCodeAt(j) & 255;
      at += bin.length;
    }
    return out;
  }

  S.vec = function (id) {
    var v = cache[id];
    if (v) return v;
    var out = new Float32Array(300), off = id * 150, k = 0;
    for (var p = 0; p < 150; p++) {
      var by = CODES[off + p];
      out[k++] = CB[by >> 4];
      out[k++] = CB[by & 15];
    }
    if (cacheKeys.length >= CACHE_MAX) { cache[cacheKeys.shift()] = null; }
    cache[id] = out; cacheKeys.push(id);
    return out;
  };

  S.cos = function (a, b) {
    if (!S.ready || a < 0 || b < 0) return 0;
    if (a === b) return 1;
    var x = S.vec(a), y = S.vec(b), s = 0;
    for (var d = 0; d < 300; d++) s += x[d] * y[d];
    return s;
  };

  /* ── THE RULE ────────────────────────────────────────────────────────── */

  S.link = function (a, b) {
    if (a < 0 || b < 0 || a === b) return false;
    if (S.assoc(a, b)) return true;
    return S.ready && S.cos(a, b) >= S.tau;
  };

  /* Why a step was legal — the cabinet says so out loud, because "a person
     said it" and "the maths says so" are different kinds of link. */
  S.why = function (a, b) {
    if (S.assoc(a, b)) return "assoc";
    if (S.ready && S.cos(a, b) >= S.tau) return "cos";
    return null;
  };

  /* ── loading the vector chunks ───────────────────────────────────────── */

  S.needed = function () {
    if (!META) return 0;
    var have = (window.AD_SEMV || []).filter(function (x) { return !!x; }).length;
    return Math.max(0, META.chunks - have);
  };

  function build() {
    var v = window.AD_SEMV || [];
    var total = 0, lens = [];
    for (var i = 0; i < META.chunks; i++) {
      if (!v[i]) return false;
      var bl = v[i].length / 4 * 3;
      lens.push(bl); total += bl;
    }
    CODES = new Uint8Array(total);
    var at = 0;
    for (var k = 0; k < META.chunks; k++) {
      var bin = atob(v[k]);
      for (var j = 0; j < bin.length; j++) CODES[at + j] = bin.charCodeAt(j) & 255;
      at += bin.length;
    }
    // The base64 strings are 2.2 MB of live JS string; drop them once decoded.
    window.AD_SEMV = null;
    cache = new Array(S.n); cacheKeys = [];
    S.ready = true;
    return true;
  }

  /**
   * S.load(onProgress, done) — pull the code chunks in, one script at a time.
   * onProgress(done, total); done(ok). Safe to call twice. If the chunks are
   * already present (the test harness loads them directly) it finishes at once,
   * synchronously, without touching the network.
   */
  var loading = false;
  S.load = function (onProgress, done) {
    if (S.ready) { done && done(true); return; }
    if (!META) { done && done(false); return; }
    if (loading) return;
    loading = true;
    var total = META.chunks, base = (window.SEM_BASE || "../../core/data/");

    function step(i) {
      if (i >= total) {
        loading = false;
        done && done(build());
        return;
      }
      if ((window.AD_SEMV || [])[i]) {          // already here — skip the fetch
        onProgress && onProgress(i + 1, total);
        step(i + 1);
        return;
      }
      var s = document.createElement("script");
      s.src = base + "semantic-v" + i + ".js?v=13";
      s.onload = function () { onProgress && onProgress(i + 1, total); step(i + 1); };
      s.onerror = function () { loading = false; done && done(false); };
      document.head.appendChild(s);
    }
    step(0);
  };

  return S;
})();
