/* ============================================================================
   BOXED IN — the arcade's Letter Boxed.
   ----------------------------------------------------------------------------
   VERIFIED RULES (_build/RESEARCH.md · NYT Letter Boxed, confidence: high):
     · 12 distinct letters, three per side of a square. Consecutive letters may
       NOT come from the same side (which also makes a doubled letter illegal).
     · Minimum word length 3. Letters may be reused within and across words.
     · The last letter of a word becomes the FIRST letter of the next. That is
       enforced by SEEDING the next word with it, never by rejecting anything.
     · WIN = every one of the 12 letters used at least once. `par` is a TARGET,
       NOT a limit — going over par still wins, just with a different message.
     · Validation is only two checks: length >= 3, and membership in the word
       list. (Because our input layer refuses an illegal letter in the first
       place, "in the list" and "playable on this board" are the same thing.)
     · Backspace on a one-letter buffer un-submits the previous word.

   WHAT WE ADD, because the original has none of it: a letters-remaining
   readout (the whole strategy), a share line, stats, practice, an archive —
   and at the end, one shortest known solution.

   THE BOARD IS GENERATED HERE, seeded by A.rngFor(id, day) so both players get
   the same square with no server. We first find a provable TWO-WORD solution
   (word A + word B, chained, together covering exactly 12 distinct letters),
   then derive the square from it by 4-colouring the letter-adjacency graph of
   those two words with exactly three letters per side. A legal two-word solve
   therefore exists by construction — and is re-verified through the same
   validator the player's own input goes through before the board may appear.

   PAR (4-6, the range the real game uses) comes from how much slack the board
   has, measured against the real dictionary at generation time:
       S = playableWords + 10 * min(twoWordSolutions, 30)
       S >= 720 → par 4      S >= 480 → par 5      else → par 6

   NORM (cross-game 0-100 currency, CONTRACT §3):
       words <= par-1 → 100   == par → 85   par+1 → 70   +2 → 55   +3 → 40
       beyond → 30            unsolved / gave up → 10
   ========================================================================== */
(function () {
  "use strict";

  /* ── constants FIRST: a `var` initialiser does not hoist, and everything
        below is read while the page is booting ───────────────────────────── */
  var ID = "boxed";
  var MINLEN = 3, NLET = 12, PERSIDE = 3;
  var VOW = "AEIOUY";
  var NICE_N = 3200;          // the word list is frequency-ordered: solution
                              // words come from this common head of it only
  var MAXCUR = 14;            // buffer cap (no dictionary word is longer than 12)

  // Words we would rather not reveal as "our solution" over breakfast. Tiny on
  // purpose — the list itself was already screened for slurs and profanity.
  var BLOCK = {};
  "MISC BREAST BREASTS NAKED LINGERIE SEXY NUDE PORN EROTIC VIAGRA"
    .split(" ").forEach(function (w) { BLOCK[w] = 1; });

  // A board proved by hand, used only if generation somehow comes up empty.
  var FALLBACK = { sides: ["ETU", "DGI", "COR", "ANS"], sol: ["SUGAR", "REDUCTION"] };

  /* ── the dictionary ───────────────────────────────────────────────────── */
  var RAW = (window.AD_WORDS && window.AD_WORDS.boxed) || [];
  var WORDS = [], WSET = {}, MASK = [], NICE = [], BYFIRST = {};

  (function prep() {
    var i, j, w, m, ok;
    for (i = 0; i < RAW.length; i++) {
      w = String(RAW[i]).toUpperCase();
      if (w.length < MINLEN || !/^[A-Z]+$/.test(w)) continue;
      ok = true;
      for (j = 0; j < w.length - 1; j++) if (w.charAt(j) === w.charAt(j + 1)) { ok = false; break; }
      if (!ok) continue;                                  // a doubled letter can never be played
      m = wmask(w);
      if (popcount(m) > NLET) continue;                   // needs more than 12 letters: unplayable
      if (WSET[w]) continue;
      WSET[w] = 1;
      WORDS.push(w);
      MASK.push(m);
    }
    for (i = 0; i < WORDS.length && i < NICE_N; i++) {
      w = WORDS[i];
      if (w.length < 4 || w.length > 9) continue;
      if (BLOCK[w]) continue;
      j = popcount(MASK[i]);
      if (j < 4 || j > 9) continue;
      NICE.push(i);
      (BYFIRST[w.charAt(0)] || (BYFIRST[w.charAt(0)] = [])).push(i);
    }
  })();

  function wmask(w) {
    var m = 0, i;
    for (i = 0; i < w.length; i++) m |= 1 << (w.charCodeAt(i) - 65);
    return m;
  }
  function popcount(x) {
    x = x - ((x >> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
    x = (x + (x >> 4)) & 0x0f0f0f0f;
    return (x * 0x01010101) >> 24;
  }
  function lettersOf(mask) {
    var out = [], i;
    for (i = 0; i < 26; i++) if (mask & (1 << i)) out.push(String.fromCharCode(65 + i));
    return out;
  }

  /* ── board generation ─────────────────────────────────────────────────── */

  function addEdges(edges, w) {
    var i, a, b;
    for (i = 0; i < w.length - 1; i++) {
      a = w.charAt(i); b = w.charAt(i + 1);
      edges[a < b ? a + b : b + a] = 1;
    }
  }

  /** Partition 12 letters into 4 sides of 3 with no adjacent pair sharing a
   *  side. Equitable 4-colouring by backtracking — 12 nodes, instant. */
  function colourSides(letters, edges, rand) {
    var adj = {}, side = {}, cap = [PERSIDE, PERSIDE, PERSIDE, PERSIDE], ord, i;
    letters.forEach(function (L) { adj[L] = []; });
    Object.keys(edges).forEach(function (key) {
      var a = key.charAt(0), b = key.charAt(1);
      if (!adj[a] || !adj[b]) return;
      adj[a].push(b); adj[b].push(a);
    });
    // Shuffle for variety, then most-constrained-first (Array#sort is stable in
    // ES2019, so the shuffle is what breaks ties).
    ord = A.shuffle(rand, letters).sort(function (x, y) { return adj[y].length - adj[x].length; });

    function fits(L, s) {
      var n = adj[L], i;
      for (i = 0; i < n.length; i++) if (side[n[i]] === s) return false;
      return true;
    }
    function dfs(k) {
      if (k === ord.length) return true;
      var L = ord[k], s;
      for (s = 0; s < 4; s++) {
        if (!cap[s] || !fits(L, s)) continue;
        side[L] = s; cap[s]--;
        if (dfs(k + 1)) return true;
        delete side[L]; cap[s]++;
      }
      return false;
    }
    if (!dfs(0)) return null;
    var out = [[], [], [], []];
    for (i = 0; i < letters.length; i++) out[side[letters[i]]].push(letters[i]);
    return out;
  }

  function sideMapOf(sides) {
    var of = {}, mask = 0;
    sides.forEach(function (s, si) {
      var i;
      for (i = 0; i < s.length; i++) {
        of[s.charAt ? s.charAt(i) : s[i]] = si;
        mask |= 1 << ((s.charAt ? s.charCodeAt(i) : s[i].charCodeAt(0)) - 65);
      }
    });
    return { of: of, mask: mask };
  }

  function legalOn(w, of) {                 // every letter on the board, no two
    var i, c;                               // consecutive letters from one side
    for (i = 0; i < w.length; i++) {
      c = w.charAt(i);
      if (of[c] === undefined) return false;
      if (i && of[c] === of[w.charAt(i - 1)]) return false;
    }
    return true;
  }
  function playableOn(w, of) { return w.length >= MINLEN && legalOn(w, of); }
  function legalBuffer(c) { return legalOn(c, P.of); }

  /** How much slack does this board give? Every dictionary word that can be
   *  played on it, plus how many two-word solutions it admits. */
  function profile(of, bmask) {
    var list = [], i, j, w, ok;
    for (i = 0; i < WORDS.length; i++) {
      if (MASK[i] & ~bmask) continue;
      w = WORDS[i]; ok = true;
      for (j = 1; j < w.length; j++) if (of[w.charAt(j)] === of[w.charAt(j - 1)]) { ok = false; break; }
      if (ok) list.push(i);
    }
    var byF = {};
    for (i = 0; i < list.length; i++) {
      w = WORDS[list[i]].charAt(0);
      (byF[w] || (byF[w] = [])).push(list[i]);
    }
    var n2 = 0;
    for (i = 0; i < list.length && n2 < 40; i++) {
      w = WORDS[list[i]];
      var bucket = byF[w.charAt(w.length - 1)] || [];
      for (j = 0; j < bucket.length && n2 < 40; j++) {
        if (list[i] === bucket[j]) continue;
        if (popcount(MASK[list[i]] | MASK[bucket[j]]) === NLET) n2++;
      }
    }
    return { n: list.length, n2: n2 };
  }

  function qualityOf(sides, pf) {
    if (pf.n < 220 || pf.n2 < 3) return -1;             // too tight to be fun
    var q = (1 - Math.abs(pf.n - 430) / 430) * 0.7 + Math.min(pf.n2, 24) / 24 * 0.3;
    var worst = 0;
    sides.forEach(function (s) {
      var v = 0, i;
      for (i = 0; i < s.length; i++) if (VOW.indexOf(s[i]) >= 0) v++;
      if (v > worst) worst = v;
    });
    if (worst >= 3) q -= 0.25;                          // an all-vowel side plays badly
    return q;
  }

  function parFor(pf) {
    var S = pf.n + 10 * Math.min(pf.n2, 30);
    return S >= 720 ? 4 : S >= 480 ? 5 : 6;
  }

  /** The hard assertion: never ship a board we have not proved solvable. */
  function proves(a, b, of, bmask) {
    return !!(a && b && WSET[a] && WSET[b] &&
      a.charAt(a.length - 1) === b.charAt(0) &&
      popcount(bmask) === NLET &&
      popcount(wmask(a) | wmask(b)) === NLET &&
      (wmask(a) | wmask(b)) === bmask &&
      playableOn(a, of) && playableOn(b, of));
  }

  function generate(rand) {
    var order = A.shuffle(rand, NICE), cands = [], tried = 0;
    var i, j, o, ai, bi, opts, letters, edges, sides;

    for (i = 0; i < order.length && cands.length < 6 && tried < 1200; i++) {
      ai = order[i]; tried++;
      var bucket = BYFIRST[WORDS[ai].charAt(WORDS[ai].length - 1)];
      if (!bucket) continue;
      opts = [];
      for (j = 0; j < bucket.length; j++) {
        bi = bucket[j];
        if (bi === ai) continue;
        if (popcount(MASK[ai] | MASK[bi]) !== NLET) continue;
        opts.push(bi);
      }
      if (!opts.length) continue;
      opts = A.shuffle(rand, opts);
      for (o = 0; o < opts.length && o < 3; o++) {
        bi = opts[o];
        letters = lettersOf(MASK[ai] | MASK[bi]);
        edges = {};
        addEdges(edges, WORDS[ai]);
        addEdges(edges, WORDS[bi]);
        sides = colourSides(letters, edges, rand);
        if (sides) { cands.push({ a: WORDS[ai], b: WORDS[bi], sides: sides }); break; }
      }
    }

    var best = null, bestQ = -Infinity;
    for (i = 0; i < cands.length; i++) {
      var c = cands[i], sm = sideMapOf(c.sides);
      if (!proves(c.a, c.b, sm.of, sm.mask)) continue;    // silently drop a bad one
      var pf = profile(sm.of, sm.mask), q = qualityOf(c.sides, pf);
      if (q > bestQ) { bestQ = q; best = { a: c.a, b: c.b, sides: c.sides, pf: pf }; }
    }
    if (!best) return null;

    // Arrangement is cosmetic: which group is which side, and the order inside
    // a side, change nothing about legality. Shuffle both, then rebuild the
    // side map from the FINAL arrangement.
    var arranged = A.shuffle(rand, best.sides).map(function (s) { return A.shuffle(rand, s).join(""); });
    var fin = sideMapOf(arranged);
    if (!proves(best.a, best.b, fin.of, fin.mask)) return null;

    return {
      sides: arranged, of: fin.of, mask: fin.mask,
      letters: arranged.join(""),
      sol: [best.a, best.b],
      par: parFor(best.pf),
      words: best.pf.n, sols2: best.pf.n2,
      sig: arranged.join("-"),
    };
  }

  function buildPuzzle(seed) {
    var i, P;
    for (i = 0; i < 4; i++) {
      P = generate(A.rng(seed + (i ? ":" + i : "")));
      if (P) return P;
    }
    // Never leave the cabinet dark: the hand-proved board, run through the
    // very same assertion.
    var sm = sideMapOf(FALLBACK.sides);
    if (proves(FALLBACK.sol[0], FALLBACK.sol[1], sm.of, sm.mask)) {
      var pf = profile(sm.of, sm.mask);
      return {
        sides: FALLBACK.sides.slice(), of: sm.of, mask: sm.mask,
        letters: FALLBACK.sides.join(""), sol: FALLBACK.sol.slice(),
        par: parFor(pf), words: pf.n, sols2: pf.n2, sig: FALLBACK.sides.join("-"),
      };
    }
    return null;
  }

  /* ── state ────────────────────────────────────────────────────────────── */
  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var P = null;
  var said = [];              // submitted words, in order
  var cur = "";              // the word being built (starts with the chain letter)
  var used = {};             // board letters covered by submitted words
  var over = false, finished = false, lastOK = false, t0 = Date.now();
  var genMs = 0;
  var topEl, wordEl, curEl, boxEl, cv, ctx, leftEl, listEl, usedPill;
  var btn = {}, pts = [], geo = { size: 0, lo: 0, hi: 0 };
  var PALETTE = { line: "#635c73", ink: "#f5f2f8", accent: "#efbe5a" };

  var HELP =
    "<p>Twelve letters, three on each side of the square. Build a word by tapping " +
    "letters or just typing, then press <b>ENTER</b>.</p>" +
    "<ul><li><b>Consecutive letters can't come from the same side.</b> That's the whole game.</li>" +
    "<li>Three letters minimum. Letters can be reused as often as you like.</li>" +
    "<li>The last letter of a word becomes the first letter of the next one — it's " +
    "put there for you.</li>" +
    "<li>You win when <b>all twelve letters</b> have been used at least once.</li>" +
    "<li>The target is a <b>target</b>, not a limit. Going over it still wins.</li>" +
    "<li><b>⌫ on a single letter un-submits</b> the word before it, in one tap.</li></ul>" +
    "<p>There is always a <b>two-word</b> solution. We'll show you one at the end, " +
    "which the original never does.</p>";

  /* ── boot ─────────────────────────────────────────────────────────────── */

  var main = A.mount({ id: ID, dayN: day, help: HELP });

  if (WORDS.length < 500) {
    main.appendChild(A.el("p", "center muted", "The word list hasn't loaded — reload the page."));
    return;
  }

  genMs = (function () {
    var t = (window.performance && performance.now) ? performance.now() : Date.now();
    P = buildPuzzle(practice ? ("boxed:p:" + Date.now() + ":" + Math.random()) : (ID + ":" + day));
    return Math.round(((window.performance && performance.now) ? performance.now() : Date.now()) - t);
  })();

  if (!P) {
    main.appendChild(A.el("p", "center muted", "Couldn't build today's square. Try practice mode."));
    return;
  }

  A.setPar(ID, function (d) {
    if (d !== day || !P) return null;
    return P.par === 4 ? 74 : P.par === 5 ? 70 : 66;   // what a solid solve is worth here
  });

  buildDOM();
  restore();
  layout();
  render();

  /* ── DOM ──────────────────────────────────────────────────────────────── */

  function buildDOM() {
    topEl = A.el("div", "bx-top");
    topEl.innerHTML =
      '<span class="ac-pill">TARGET <b>' + P.par + '</b> WORDS</span>' +
      '<span class="ac-pill" id="bx-used">USED <b>0</b></span>' +
      '<span class="ac-pill">SHORTEST <b>2</b></span>';
    main.appendChild(topEl);
    usedPill = topEl.querySelector("#bx-used");

    wordEl = A.el("div");
    wordEl.id = "wordline";
    curEl = A.el("span");
    curEl.id = "curword";
    wordEl.appendChild(curEl);
    var caret = A.el("i");
    caret.id = "caret";
    wordEl.appendChild(caret);
    wordEl.setAttribute("aria-live", "polite");
    main.appendChild(wordEl);

    boxEl = A.el("div");
    boxEl.id = "box";
    cv = A.el("canvas");
    cv.id = "cv";
    cv.setAttribute("aria-hidden", "true");
    boxEl.appendChild(cv);
    ctx = cv.getContext("2d");

    var SIDENAME = ["top", "right", "bottom", "left"];
    P.sides.forEach(function (s, si) {
      var i;
      for (i = 0; i < s.length; i++) {
        var L = s.charAt(i);
        var b = A.el("button", "lb", L);
        b.type = "button";
        b.setAttribute("aria-label", L + ", " + SIDENAME[si] + " side");
        b.setAttribute("data-l", L);
        b.addEventListener("click", function (e) { e.preventDefault(); push(L); b.blur(); });
        btn[L] = b;
        boxEl.appendChild(b);
        pts.push({ L: L, side: si, i: i, x: 0, y: 0 });
      }
    });
    main.appendChild(boxEl);

    leftEl = A.el("div");
    leftEl.id = "left";
    leftEl.setAttribute("aria-live", "polite");
    main.appendChild(leftEl);

    listEl = A.el("div");
    listEl.id = "words";
    main.appendChild(listEl);

    var ctl = A.el("div", "ac-row");
    ctl.id = "ctl";
    ctl.innerHTML =
      '<button class="ac-btn" id="bx-enter" type="button">ENTER</button>' +
      '<button class="ac-btn ghost" id="bx-del" type="button">⌫ DELETE</button>' +
      '<button class="ac-btn ghost" id="bx-restart" type="button">RESTART</button>';
    main.appendChild(ctl);
    ctl.querySelector("#bx-enter").onclick = submit;
    ctl.querySelector("#bx-del").onclick = back;
    ctl.querySelector("#bx-restart").onclick = askRestart;

    var modes = A.el("div", "modes");
    modes.innerHTML =
      '<button class="ac-btn ghost sm" id="bx-give" type="button">SHOW A SOLUTION</button>' +
      (practice ? '<a class="ac-btn ghost sm" href="./">← TODAY\'S SQUARE</a>'
        : '<a class="ac-btn ghost sm" href="?practice=1">∞ PRACTICE</a>');
    main.appendChild(modes);
    modes.querySelector("#bx-give").onclick = askGiveUp;

    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", function () {
      clearTimeout(buildDOM._t);
      buildDOM._t = setTimeout(function () { layout(); draw(); }, 140);
    });
    readPalette();
  }

  function readPalette() {
    try {
      var cs = getComputedStyle(document.body);
      var get = function (n, d) { return (cs.getPropertyValue(n) || "").trim() || d; };
      PALETTE.line = get("--ink-4", PALETTE.line);
      PALETTE.ink = get("--ink", PALETTE.ink);
      PALETTE.accent = get("--amber", PALETTE.accent);
    } catch (e) { /* keep the defaults */ }
  }

  /* ── geometry ─────────────────────────────────────────────────────────── */

  function layout() {
    var size = Math.max(240, Math.round(boxEl.clientWidth || 320));
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    geo.size = size;
    geo.lo = Math.round(Math.max(26, size * 0.088));
    geo.hi = size - geo.lo;
    boxEl.style.height = size + "px";
    cv.style.width = size + "px";
    cv.style.height = size + "px";
    cv.width = Math.round(size * dpr);
    cv.height = Math.round(size * dpr);
    geo.dpr = dpr;

    var lo = geo.lo, span = geo.hi - geo.lo;
    pts.forEach(function (p) {
      var t = lo + span * (p.i + 1) / 4;
      if (p.side === 0) { p.x = t; p.y = lo; }
      else if (p.side === 1) { p.x = geo.hi; p.y = t; }
      else if (p.side === 2) { p.x = t; p.y = geo.hi; }
      else { p.x = lo; p.y = t; }
      var b = btn[p.L];
      b.style.left = p.x + "px";
      b.style.top = p.y + "px";
    });
  }

  function ptOf(L) {
    var i;
    for (i = 0; i < pts.length; i++) if (pts[i].L === L) return pts[i];
    return null;
  }

  function draw() {
    if (!ctx || !geo.size) return;
    var s = geo.size, lo = geo.lo, span = geo.hi - geo.lo, i, p;
    ctx.setTransform(geo.dpr, 0, 0, geo.dpr, 0, 0);
    ctx.clearRect(0, 0, s, s);

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = PALETTE.line;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(lo, lo, span, span);
    ctx.globalAlpha = 1;

    if (cur.length > 1) {
      ctx.strokeStyle = PALETTE.accent;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      for (i = 0; i < cur.length; i++) {
        p = ptOf(cur.charAt(i));
        if (!p) continue;
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  /* ── input ────────────────────────────────────────────────────────────── */

  function seedLen() { return said.length ? 1 : 0; }

  function push(ch) {
    if (over) return;
    if (P.of[ch] === undefined) { A.toast(ch + " isn't on this board", true); return; }
    if (cur.length >= MAXCUR) { nope("That's long enough"); return; }
    var prev = cur.charAt(cur.length - 1);
    if (prev && P.of[prev] === P.of[ch]) {
      nope(prev === ch ? "A letter can't follow itself" : prev + " and " + ch + " are on the same side");
      return;
    }
    cur += ch;
    A.sfx("type");
    render();
  }

  function back() {
    if (over) return;
    if (cur.length > seedLen()) {
      cur = cur.slice(0, -1);
      A.sfx("key");
      render();
      return;
    }
    if (said.length) {                    // the hidden superpower: un-submit
      cur = said.pop();
      recount();
      lastOK = false;
      A.sfx("miss");
      A.toast("Took back " + cur);
      render();
      save();
    }
  }

  function submit() {
    if (over) return;
    if (cur.length < MINLEN) return nope("Too short");
    if (!WSET[cur]) return nope("Not in the word list");
    if (said.indexOf(cur) >= 0) return nope("Already played " + cur);

    var fresh = newLetters(cur);
    said.push(cur);
    recount();
    var done = left().length === 0;
    A.sfx("ok", said.length - 1);
    praise(cur, done);
    lastOK = true;
    cur = cur.charAt(cur.length - 1);
    pulse();
    render();
    save();
    if (done) setTimeout(function () { end(true); }, 460);
    else if (!fresh) A.toast("No new letters from that one", true);
  }

  // The original's praise ladder, verbatim from the bundle's rules.
  function praise(w, done) {
    if (w.length >= 7) A.toast(done ? "Savant!" : "Genius!");
    else A.toast(lastOK ? "Nice!" : "Awesome!");
  }

  function nope(msg) {
    A.toast(msg, true);
    A.sfx("bad");
    wordEl.classList.add("ac-shake");
    setTimeout(function () { wordEl.classList.remove("ac-shake"); }, 400);
  }

  function pulse() {
    if (A.settings().reduceMotion) return;
    boxEl.style.transform = "scale(.965)";
    setTimeout(function () { boxEl.style.transform = ""; }, 130);
  }

  function onKey(e) {
    if (over) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector(".ac-modal.show")) return;
    if (e.key === "Enter") { e.preventDefault(); submit(); }
    else if (e.key === "Backspace") { e.preventDefault(); back(); }
    else if (/^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); push(e.key.toUpperCase()); }
  }

  /* ── letters used / left ──────────────────────────────────────────────── */

  function recount() {
    used = {};
    said.forEach(function (w) {
      var i;
      for (i = 0; i < w.length; i++) used[w.charAt(i)] = 1;
    });
  }

  function left() {
    var out = [], i;
    for (i = 0; i < P.letters.length; i++) {
      if (!used[P.letters.charAt(i)]) out.push(P.letters.charAt(i));
    }
    return out;
  }

  function newLetters(w) {
    var i, n = 0;
    for (i = 0; i < w.length; i++) if (!used[w.charAt(i)]) n++;
    return n;
  }

  /* ── render ───────────────────────────────────────────────────────────── */

  function render() {
    var sl = seedLen(), i, L, cls;

    curEl.innerHTML = sl && cur.length
      ? '<span class="seed">' + A.esc(cur.charAt(0)) + "</span>" + A.esc(cur.slice(1))
      : A.esc(cur);

    var lastCh = cur.charAt(cur.length - 1);
    for (i = 0; i < P.letters.length; i++) {
      L = P.letters.charAt(i);
      cls = "lb";
      if (used[L]) cls += " used";
      if (cur.indexOf(L) >= 0) cls += " act";
      if (L === lastCh) cls += " last";
      else if (lastCh && P.of[L] === P.of[lastCh] && !over) cls += " off";
      btn[L].className = cls;
    }

    var rest = left();
    if (rest.length) {
      leftEl.className = "";
      leftEl.innerHTML = rest.length + (rest.length === 1 ? " LETTER LEFT " : " LETTERS LEFT ") +
        "<b>" + A.esc(rest.join("")) + "</b>";
    } else {
      leftEl.className = "done";
      leftEl.innerHTML = "ALL TWELVE LETTERS USED";
    }

    // The submitted words, with the JOIN letters picked out — which is how the
    // chaining rule teaches itself.
    listEl.innerHTML = "";
    said.forEach(function (w, wi) {
      var head = wi > 0, tail = (wi < said.length - 1) || !over;
      var html = (head ? "<b>" + A.esc(w.charAt(0)) + "</b>" : A.esc(w.charAt(0))) +
        A.esc(w.slice(1, w.length - 1)) +
        (w.length > 1 ? (tail ? "<b>" + A.esc(w.charAt(w.length - 1)) + "</b>"
          : A.esc(w.charAt(w.length - 1))) : "");
      listEl.appendChild(A.el("span", null, html));
    });
    usedPill.innerHTML = "USED <b>" + said.length + "</b>";
    draw();
  }

  /* ── persistence ──────────────────────────────────────────────────────── */

  function save() {
    if (practice) return;
    A.save(ID, day, { said: said, cur: cur, sig: P.sig });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st && st.sig === P.sig && st.said && st.said.length) {
      st.said.forEach(function (w) {
        w = String(w).toUpperCase();
        if (!WSET[w] || !playableOn(w, P.of)) return;
        if (said.length && w.charAt(0) !== said[said.length - 1].slice(-1)) return;
        if (said.indexOf(w) >= 0) return;
        said.push(w);
      });
      recount();
    }
    // The buffer always begins with the chain letter; anything else is dropped.
    cur = said.length ? said[said.length - 1].slice(-1) : "";
    if (st && st.sig === P.sig && typeof st.cur === "string") {
      var c = st.cur.toUpperCase();
      if (c.length > cur.length && c.length <= MAXCUR && c.indexOf(cur) === 0 && legalBuffer(c)) cur = c;
    }
    if (st && st.done) {
      over = true; finished = true;
      setTimeout(function () { sheet(!!st.won, st.norm); }, 260);
    }
  }

  /* ── ending ───────────────────────────────────────────────────────────── */

  function normFor(n) {
    var d = n - P.par;
    return d <= -1 ? 100 : d === 0 ? 85 : d === 1 ? 70 : d === 2 ? 55 : d === 3 ? 40 : 30;
  }

  function shareGrid() {
    var seen = {}, rows = [];
    var NEW = A.settings().colourblind ? "🟦" : "🟨";
    said.forEach(function (w) {
      var row = "", i, c;
      for (i = 0; i < w.length; i++) {
        c = w.charAt(i);
        if (seen[c]) row += "⬛";
        else { row += NEW; seen[c] = 1; }
      }
      rows.push(row);
    });
    return rows;
  }

  function end(won) {
    if (finished) return;
    over = true; finished = true;
    var n = said.length;
    var norm = won ? normFor(n) : 10;
    var grid = shareGrid();
    var detail = won ? n + "w · par " + P.par : "unsolved";

    if (!practice) {
      A.finish(ID, day, {
        score: won ? n : 0, norm: norm, won: won, detail: detail,
        bucket: won ? n : "X", shareGrid: grid, durationMs: Date.now() - t0,
      });
    }
    if (won) {
      A.sfx(n <= 2 ? "perfect" : "win");
      A.confetti(n <= P.par ? 130 : 80);
    } else A.sfx("lose");
    render();
    sheet(won, norm, grid);
  }

  function sheet(won, norm, grid) {
    var n = said.length;
    var title = !won ? "THE SQUARE WINS"
      : n <= 2 ? "TWO WORDS"
        : n < P.par ? "UNDER TARGET"
          : n === P.par ? "ON TARGET"
            : "SUPER SOLVING";

    var same = n === 2 && said[0] === P.sol[0] && said[1] === P.sol[1];
    var head = same ? "THE TWO WORDS WE FOUND TOO"
      : (won && n <= 2) ? "OURS WAS" : "ONE TWO-WORD SOLUTION";
    var extra = '<p class="sol">' + head +
      "<br>" + A.esc(P.sol[0]) + ' <i>→</i> ' + A.esc(P.sol[1]) + "</p>" +
      '<p class="tiny dim center">' + A.fmtNum(P.words) + " words were playable on this square" +
      (P.sols2 >= 40 ? " · 40+ two-word solutions" : " · " + P.sols2 + " two-word solution" +
        (P.sols2 === 1 ? "" : "s")) + "</p>";
    if (won && n <= 2 && !same) {
      extra += '<p class="tiny muted center">Yours was different — and just as short.</p>';
    }
    if (won && n > P.par) {
      extra += '<p class="tiny muted center">Solved in ' + n + ". For an extra challenge, try " +
        P.par + " or fewer.</p>";
    }

    A.results(ID, practice ? A.PRACTICE : day, {
      title: title,
      lines: won ? [n + " word" + (n === 1 ? "" : "s") + " · target " + P.par, "12/12 letters"]
        : ["target was " + P.par + " words", left().length + " letters never used"],
      extraHTML: extra,
      state: { norm: norm, shareGrid: grid || shareGrid(), won: won },
      shareText: "BOXED IN (practice) · " + (won ? n + "w · par " + P.par : "unsolved") + "\n" +
        (grid || shareGrid()).join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  /* ── the two confirmations ────────────────────────────────────────────── */

  function askRestart() {
    if (over) return;
    if (!said.length && cur.length <= seedLen()) return;
    var m = A.modal("START AGAIN?", '<p class="center muted">This clears every word you\'ve ' +
      "played on today's square. Your target and your stats stay as they are.</p>" +
      '<div class="ac-row" style="margin-top:16px">' +
      '<button class="ac-btn" id="bx-yes" type="button">CLEAR IT</button>' +
      '<button class="ac-btn ghost" id="bx-no" type="button">KEEP PLAYING</button></div>');
    m.body.querySelector("#bx-yes").onclick = function () {
      m.close();
      said = []; cur = ""; used = {}; lastOK = false;
      A.sfx("miss");
      render(); save();
    };
    m.body.querySelector("#bx-no").onclick = m.close;
  }

  function askGiveUp() {
    if (over) { sheet(false, 10); return; }
    var m = A.modal("SHOW A SOLUTION?", '<p class="center muted">That ends today\'s square as ' +
      "unsolved — it scores 10, and it can't be undone.</p>" +
      '<div class="ac-row" style="margin-top:16px">' +
      '<button class="ac-btn" id="bx-yes" type="button">SHOW ME</button>' +
      '<button class="ac-btn ghost" id="bx-no" type="button">KEEP TRYING</button></div>');
    m.body.querySelector("#bx-yes").onclick = function () { m.close(); end(false); };
    m.body.querySelector("#bx-no").onclick = m.close;
  }

  /* ── debug hook ───────────────────────────────────────────────────────── */

  window.__BX = {
    board: function () { return { sides: P.sides, par: P.par, sol: P.sol, words: P.words, sols2: P.sols2, genMs: genMs }; },
    state: function () {
      return {
        said: said.slice(), cur: cur, left: left().join(""), over: over,
        day: day, practice: practice, par: P.par, norm: over ? normFor(said.length) : null,
      };
    },
    // type() replaces the buffer with `s`, keeping the chain letter, exactly as
    // if the player had cleared and retyped it.
    type: function (s) {
      s = String(s).toUpperCase();
      cur = said.length ? said[said.length - 1].slice(-1) : "";
      var i = (said.length && s.charAt(0) === cur) ? 1 : 0;
      for (; i < s.length; i++) push(s.charAt(i));
      render();
      return cur;
    },
    word: function (s) { window.__BX.type(s); submit(); return said.slice(); },
    key: function (k) { onKey({ key: k, preventDefault: function () {} }); return __BX.state(); },
    solve: function () { window.__BX.word(P.sol[0]); window.__BX.word(P.sol[1]); return said.slice(); },
    giveUp: function () { end(false); },
    back: back,
  };
})();
