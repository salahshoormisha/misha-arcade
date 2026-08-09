/* ============================================================================
   MISALIGNED — five rounds a day about systems that met their objective.
   ----------------------------------------------------------------------------
   Built on the shape of games/wordish/game.js (the reference implementation)
   and games/decider/game.js (the other question-driven cabinet):

     requestedDay → deterministic plan → load → save after every move
     → finish once → results sheet.

   THE FIVE ROUNDS, in order, 20 points each

     R1, R2  SPECIFICATION GAMING
             The setup, then the objective exactly as it was written down.
             Four things it might have done; one is what it did. Most of the
             wrong answers are not invented — they are what genuinely happened
             to a DIFFERENT system in the same family, which is why the round
             is hard: everything on the screen is plausible because almost
             everything on the screen is real.
             20 for the right one, 0 otherwise.

     R3      PUT THEM IN ORDER
             Four dated milestones, earliest first. The generator only ships a
             set when every pair is far enough apart to be unambiguous at the
             precision we actually know the dates to, so a wrong answer is
             never our fault.
             20 exact · 13 for one transposition · 7 for four of six pairs
             right · 0 for anything at or below chance.

     R4      REAL OR INVENTED
             Four one-line incidents. Three happened. One was made up, and
             carries a checkable flaw — an incentive pointing the wrong way, a
             physical impossibility, an anachronism, a number that cannot be
             right. The reveal names it. This round is winnable by reasoning,
             not just by recall.
             20 or 0.

     R5      AGAINST THE BASELINE
             A machine result on a named benchmark at a named date, and the
             human baseline it was measured against. Which band did it land in?
             The bands are shown WITH their numeric cut-offs, so this is a
             question about numbers rather than a question about vibes.
             20 exact · 8 for the neighbouring band · 0 otherwise.

   NORM (cross-game 0-100 currency, CONTRACT §3)
     norm = the raw total out of 100. No curve: the rounds were calibrated so
     that a strong player who knows this field lands around 70 — roughly
     three-quarters of the two specification rounds, the ordering usually right
     or one swap out, the invention usually spotted, the band often only
     adjacent. Five clean rounds is 100 and is genuinely uncommon; four clean
     and a near miss is around 90. That is the brief.
     `won` (what the streak counts) = 60 or better, i.e. three rounds' worth.

   WHAT NEVER APPEARS BEFORE AN ANSWER IS LOCKED IN
     the reveal text, the source, the author, the year, the date of a milestone,
     the machine's score, or the tell of an invented incident. _build/t_misaligned.js
     sweeps the whole archive asserting exactly that, because a leak here does
     not look like a bug — it looks like an easy day.
   ========================================================================== */
(function () {
  "use strict";

  /* ── constants ────────────────────────────────────────────────────────────
     All declared above their first use. `var` initialisers do NOT hoist, so a
     constant read by a function that runs during boot would be undefined. */

  var ID = "misaligned";
  var NR = 5;                       // rounds in a day
  var PTS = 20;                     // points per round
  var WIN_AT = 60;                  // norm at or above which the day counts
  var LET = ["A", "B", "C", "D"];
  var KIND = ["spec", "spec", "order", "fake", "bench"];
  var TITLE = [
    "SPECIFICATION GAMING",
    "SPECIFICATION GAMING",
    "PUT THEM IN ORDER",
    "REAL OR INVENTED",
    "AGAINST THE BASELINE",
  ];

  // The four bands, in scale order. They are NOT shuffled: shuffling a scale
  // makes it unreadable, and the answer's position already moves with the data.
  // Cut-offs match _build/gen_misaligned.py exactly — if you change one, change
  // both, and the generator will refuse to ship a row whose band disagrees.
  var BANDS = [
    { t: "Nowhere near it", d: "more than 20 points below the human baseline" },
    { t: "Below it, but in the same league", d: "3 to 20 points below" },
    { t: "Level pegging", d: "within 3 points either way" },
    { t: "Above the human baseline", d: "more than 3 points clear" },
  ];

  var HELP =
    "<p><b>Five rounds. Twenty points each. All of it documented.</b> Every real case here " +
    "carries the paper, post or report it came from, and the reveal links to it.</p>" +
    "<ul>" +
    "<li><b>Rounds 1 and 2 — specification gaming.</b> You get the setup and the objective " +
    "exactly as it was written down. Pick what the thing actually did. Fair warning: most of " +
    "the wrong answers also happened, just to something else.</li>" +
    "<li><b>Round 3 — put them in order.</b> Four dated milestones, earliest first. Tap to " +
    "place, tap a placed one to take it back. Full marks for exact, most of them for a single " +
    "transposition.</li>" +
    "<li><b>Round 4 — real or invented.</b> Three of the four happened. The fourth was made " +
    "up, and something in it does not add up — a backwards incentive, an impossible number, a " +
    "date that cannot be right. Find that, rather than trying to remember all three others.</li>" +
    "<li><b>Round 5 — against the baseline.</b> A result, a benchmark, a date, and the human " +
    "baseline. Which band? The cut-offs are on the buttons. Land on the wrong side of a line " +
    "and you still get eight.</li>" +
    "</ul>" +
    "<p>On a laptop: <b>1-4</b> or <b>A-D</b> to answer, <b>Enter</b> to move on.</p>" +
    "<p class='tiny dim'>Nothing here is about anyone's workplace. It is the public record: " +
    "the specification-gaming list, the papers behind it, and the system cards.</p>";

  /* ── the data, defensively ──────────────────────────────────────────────── */

  var D = window.AD_MISALIGNED || {};
  var SPEC = D.spec || [], BITS = D.bits || [], FAKES = D.fakes || [];
  var BENCH = D.bench || [], MILE = D.mile || [], ORDERS = D.orders || [];

  var SPEC_BY = {};
  (function () {
    for (var i = 0; i < SPEC.length; i++) SPEC_BY[SPEC[i].id] = SPEC[i];
  })();

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var prand = A.rng(String(Date.now()) + ":" + Math.random());

  var S = null, plan = null, main = null, stage = null, finished = false;

  /* ── the day's plan (deterministic) ───────────────────────────────────────
     Everything is drawn through A.dailyIndex, which walks a seeded permutation
     of each pool and only reshuffles once the pool is exhausted — so nothing
     comes back until everything else has had a turn. Practice draws at random
     and is never ranked. */

  function idx(key, n) {
    if (!n) return 0;
    if (practice) return Math.floor(prand() * n) % n;
    return A.dailyIndex(ID + ":" + key, day, n);
  }

  function range(n) { var o = [], i; for (i = 0; i < n; i++) o.push(i); return o; }

  // Distinct draws from one pool: step forward off any collision, so three
  // one-liners can never be the same one-liner three times.
  function spread(vals, n) {
    var out = [], i, v, guard;
    for (i = 0; i < vals.length; i++) {
      v = ((vals[i] % n) + n) % n;
      guard = 0;
      while (out.indexOf(v) >= 0 && guard++ < n) v = (v + 1) % n;
      out.push(v);
    }
    return out;
  }

  function build() {
    var rnd = practice ? prand : A.rng(ID + ":plan:" + day);

    // Two specification-gaming cases, never the same one, and preferring two
    // different families so a day is not two rounds of the same joke.
    var s1 = idx("spec1", SPEC.length);
    var s2 = idx("spec2", SPEC.length);
    if (SPEC.length > 1) {
      var guard = 0;
      while ((s2 === s1 || (SPEC.length > 4 && SPEC[s2].fam === SPEC[s1].fam)) &&
             guard++ < SPEC.length) {
        s2 = (s2 + 1) % SPEC.length;
      }
      if (s2 === s1) s2 = (s1 + 1) % SPEC.length;
    }

    var bits = spread([idx("bit1", BITS.length), idx("bit2", BITS.length),
                       idx("bit3", BITS.length)], BITS.length);

    var p = {
      spec: [s1, s2],
      specOpts: [null, null],
      order: (ORDERS[idx("order", ORDERS.length)] || [0, 1, 2, 3]).slice(),
      orderShown: null,
      bits: bits,
      fake: idx("fake", FAKES.length),
      roi: null,
      bench: idx("bench", BENCH.length),
    };

    // Options for each specification round: the truth plus exactly three
    // decoys, sampled (not sliced) so a case that comes round again does not
    // come round with the same four lines.
    var r;
    for (r = 0; r < 2; r++) {
      p.specOpts[r] = specOptions(SPEC[p.spec[r]], A.rng(ID + ":o" + r + ":" + day + ":" + p.spec[r]));
    }

    // Four milestones, shown shuffled. `order` itself stays in true date order
    // and is the answer key.
    p.orderShown = A.shuffle(A.rng(ID + ":ord:" + day + ":" + p.order.join(",")), p.order.slice());

    // Three real one-liners and one invention, shuffled together. Rendered
    // identically: no source, no author, no year, until it is answered.
    var roi = p.bits.map(function (b) { return { k: "bit", i: b }; });
    roi.push({ k: "fake", i: p.fake });
    p.roi = A.shuffle(A.rng(ID + ":roi:" + day + ":" + p.fake), roi);

    return p;

    function specOptions(s, rr) {
      var ds = s.decoys || [], og = s.orig || [];
      var pickIdxs = A.shuffle(rr, range(ds.length)).slice(0, 3);
      var opts = [{ t: s.real, ok: 1, o: "" }];
      pickIdxs.forEach(function (k) { opts.push({ t: ds[k], ok: 0, o: og[k] || "" }); });
      // Belt and braces: the generator guarantees distinct option text, but a
      // duplicate on screen would make the round unanswerable, so drop any.
      var seen = {}, clean = [];
      opts.forEach(function (o) {
        var key = String(o.t).toLowerCase().replace(/\W+/g, " ").trim();
        if (seen[key]) return;
        seen[key] = 1;
        clean.push(o);
      });
      return A.shuffle(rr, clean);
    }
  }

  /* ── state ────────────────────────────────────────────────────────────── */

  function blank() {
    return {
      v: 1, screen: "intro", ri: 0,
      res: [null, null, null, null, null],   // {pick, got} per round
      place: [],                             // round 3, shown-indices placed so far
      t0: Date.now(),
    };
  }

  function res(i) { return S.res[i] || null; }
  function total() {
    var t = 0, i;
    for (i = 0; i < NR; i++) if (res(i)) t += res(i).got;
    return t;
  }
  function cleanRounds() {
    var n = 0, i;
    for (i = 0; i < NR; i++) if (res(i) && res(i).got === PTS) n++;
    return n;
  }

  function save() {
    if (practice) return;
    A.save(ID, day, {
      v: 1, screen: S.screen, ri: S.ri, res: S.res, place: S.place, t0: S.t0,
      done: S.screen === "done", norm: total(),
    });
  }

  /* ── boot ─────────────────────────────────────────────────────────────── */

  main = A.mount({ id: ID, dayN: day, help: HELP });
  stage = A.el("div");

  if (SPEC.length < 2 || BITS.length < 3 || !FAKES.length || !BENCH.length ||
      !ORDERS.length || MILE.length < 4) {
    main.innerHTML = '<p class="center muted" style="padding:44px 0;line-height:1.85">' +
      "The case bank didn't load.<br>Check <b>core/data/misaligned.js</b> — it should set " +
      "<code>window.AD_MISALIGNED</code>.<br>Rebuild it with " +
      "<b>python3 _build/gen_misaligned.py</b>.</p>";
    return;
  }

  plan = build();
  main.appendChild(stage);
  restore();

  function restore() {
    var st = practice ? null : A.load(ID, day);
    S = blank();
    if (st && st.v === 1 && st.res && st.res.length === NR) {
      S.screen = st.screen || "intro";
      S.ri = A.clamp(+st.ri || 0, 0, NR - 1);
      S.res = st.res;
      S.place = st.place || [];
      S.t0 = st.t0 || Date.now();
    }
    if (S.screen === "done") {
      finished = true;
      paint();
      setTimeout(function () { sheet(); }, 240);
      return;
    }
    paint();
  }

  /* ── rendering ────────────────────────────────────────────────────────── */

  function paint() {
    stage.innerHTML = "";
    if (S.screen === "intro") return renderIntro();
    if (S.screen === "done") return renderDone();
    stage.appendChild(strip());
    if (S.screen === "q") return renderQ();
    if (S.screen === "r") return renderR();
  }

  function pipClass(i) {
    var r = res(i);
    if (!r) return (i === S.ri && S.screen !== "done") ? "mi-pip live" : "mi-pip";
    if (r.got === PTS) return "mi-pip on";
    if (r.got > 0) return "mi-pip half";
    return "mi-pip off";
  }

  function strip() {
    var w = A.el("div", "mi-strip"), i;
    var pips = A.el("div", "mi-pips");
    for (i = 0; i < NR; i++) pips.appendChild(A.el("div", pipClass(i)));
    w.appendChild(A.el("span", "ac-pill", "ROUND <b>" + (S.ri + 1) + "</b>/" + NR));
    w.appendChild(pips);
    w.appendChild(A.el("span", "ac-pill", "<b>" + total() + "</b>/100"));
    return w;
  }

  // Fade in without requestAnimationFrame: a backgrounded tab pauses rAF and
  // the card would sit at opacity 0 forever. A forced reflow is synchronous.
  function show(box) {
    stage.appendChild(box);
    void box.offsetWidth;
    box.classList.add("shown");
    return box;
  }

  function card() { return A.el("div", "mi-in"); }

  function kick(box, extra) {
    box.appendChild(A.el("div", "mi-kick", A.esc(TITLE[S.ri]) + (extra ? " · " + extra : "")));
  }

  function optButton(letter, html, onClick) {
    var b = A.el("button", "mi-opt");
    b.type = "button";
    b.innerHTML = "<b>" + letter + "</b><span>" + html + "</span>";
    if (onClick) b.onclick = onClick; else b.disabled = true;
    return b;
  }

  function goRow(label, fn, id) {
    var row = A.el("div", "ac-row mi-go");
    var b = A.el("button", "ac-btn", label);
    b.type = "button";
    b.id = id || "mi-next";
    b.onclick = fn;
    row.appendChild(b);
    return row;
  }

  /* ── the title card ───────────────────────────────────────────────────── */

  function renderIntro() {
    var box = card();
    var st = A.stats(ID);
    box.innerHTML =
      '<div class="mi-kick">FIVE ROUNDS · 100 POINTS</div>' +
      '<p class="mi-lede">Systems that did exactly what they were told, and nothing like ' +
      "what was wanted.<br>Every real case here has a source, and the reveal links to it.</p>" +
      '<div class="mi-rules">' +
        rule("R1", "<b>Specification gaming.</b> The objective as written. Pick what it " +
          "actually did. Most of the wrong answers also happened — elsewhere.") +
        rule("R2", "<b>Again</b>, a different family of system.") +
        rule("R3", "<b>Put them in order.</b> Four dated milestones, earliest first.") +
        rule("R4", "<b>Real or invented.</b> Three happened. One does not add up. Find the " +
          "flaw rather than trying to recall the other three.") +
        rule("R5", "<b>Against the baseline.</b> A result, a benchmark, a human number. " +
          "Which band, to the point?") +
      "</div>";

    box.appendChild(goRow(practice ? "PLAY A ROUND ▸" : "START ▸", start, "mi-start"));

    var foot = A.el("div", "ac-row mi-foot");
    foot.innerHTML =
      (practice ? '<a class="ac-pill" href="./">TODAY\'S FIVE</a>'
                : '<a class="ac-pill" href="?practice=1">PRACTICE</a>') +
      '<button class="ac-pill" id="mi-arch" type="button">ARCHIVE</button>';
    box.appendChild(foot);

    if (st.played) {
      var t = A.el("div", "ac-row mi-tally");
      t.innerHTML = '<span class="ac-pill">PLAYED <b>' + st.played + "</b></span>" +
        '<span class="ac-pill">BEST <b>' + (st.bestNorm || 0) + "</b></span>" +
        '<span class="ac-pill">AVERAGE <b>' + (st.avgNorm || 0) + "</b></span>";
      box.appendChild(t);
    }

    show(box);
    box.querySelector("#mi-arch").onclick = function () { A.archiveModal(ID); };

    function rule(k, txt) { return '<div class="mi-rule"><i>' + k + "</i><span>" + txt + "</span></div>"; }
  }

  function start() {
    S.screen = "q";
    S.ri = 0;
    A.sfx("key");
    save();
    paint();
  }

  /* ── asking ───────────────────────────────────────────────────────────── */

  function renderQ() {
    var k = KIND[S.ri];
    if (k === "spec") return askSpec();
    if (k === "order") return askOrder();
    if (k === "fake") return askRoi();
    return askBench();
  }

  function askSpec() {
    var s = SPEC[plan.spec[S.ri]], opts = plan.specOpts[S.ri];
    var box = card();
    kick(box);
    box.appendChild(A.el("div", "mi-ctx", A.esc(s.ctx)));
    box.appendChild(A.el("div", "mi-given",
      "<i>THE OBJECTIVE, AS WRITTEN</i>" + A.esc(s.given)));
    box.appendChild(A.el("div", "mi-ask", "WHAT DID IT ACTUALLY DO?"));

    var wrap = A.el("div", "mi-opts");
    opts.forEach(function (o, i) {
      wrap.appendChild(optButton(LET[i], A.esc(o.t), function () { answer(i); }));
    });
    box.appendChild(wrap);
    show(box);
  }

  function askRoi() {
    var box = card();
    kick(box);
    box.appendChild(A.el("div", "mi-ctx",
      "Three of these happened and are on the record. One was made up — and something " +
      "in it does not add up."));
    box.appendChild(A.el("div", "mi-ask", "WHICH ONE IS THE INVENTION?"));

    var wrap = A.el("div", "mi-opts");
    plan.roi.forEach(function (o, i) {
      var txt = o.k === "fake" ? FAKES[o.i].txt : BITS[o.i].txt;
      wrap.appendChild(optButton(LET[i], A.esc(txt), function () { answer(i); }));
    });
    box.appendChild(wrap);
    show(box);
  }

  function askBench() {
    var b = BENCH[plan.bench];
    var box = card();
    kick(box);
    box.appendChild(A.el("div", "mi-ctx",
      "<b>" + A.esc(b.sys) + "</b>, on <b>" + A.esc(b.bench) + "</b>, in " + b.year + "."));
    box.appendChild(A.el("div", "mi-given",
      "<i>THE HUMAN BASELINE ON THAT BENCHMARK</i>" + A.esc(b.human)));
    box.appendChild(A.el("div", "mi-ask", "WHERE DID THE MACHINE LAND?"));

    var wrap = A.el("div", "mi-opts");
    BANDS.forEach(function (band, i) {
      wrap.appendChild(optButton(LET[i],
        A.esc(band.t) + "<em>" + A.esc(band.d) + "</em>",
        function () { answer(i); }));
    });
    box.appendChild(wrap);
    show(box);
  }

  function askOrder() {
    var box = card();
    kick(box);
    box.appendChild(A.el("div", "mi-ctx",
      "Four things that happened. Put them in the order they happened in."));
    box.appendChild(A.el("div", "mi-ask", "EARLIEST FIRST"));

    var slots = A.el("div", "mi-slots"), i;
    for (i = 0; i < 4; i++) {
      var placed = S.place[i];
      var sl = A.el("div", "mi-slot" + (placed === undefined ? "" : " full"));
      if (placed === undefined) {
        sl.innerHTML = "<i>" + (i + 1) + "</i><span>—</span>";
      } else {
        sl.innerHTML = "<i>" + (i + 1) + "</i><span>" + A.esc(MILE[placed].lab) + "</span>";
        sl.onclick = (function (pos) {
          return function () { unplace(pos); };
        })(i);
      }
      slots.appendChild(sl);
    }
    box.appendChild(slots);

    var left = plan.orderShown.filter(function (m) { return S.place.indexOf(m) < 0; });
    if (left.length) {
      var wrap = A.el("div", "mi-opts");
      left.forEach(function (m) {
        var letter = LET[plan.orderShown.indexOf(m)];
        wrap.appendChild(optButton(letter, A.esc(MILE[m].lab), function () { place(m); }));
      });
      box.appendChild(wrap);
      box.appendChild(A.el("div", "mi-hint", "Tap a placed one to take it back."));
    } else {
      box.appendChild(goRow("LOCK IT IN ▸", function () { answer(S.place.slice()); }, "mi-lock"));
    }
    show(box);
  }

  function place(m) {
    if (S.place.indexOf(m) >= 0 || S.place.length >= 4) return;
    S.place.push(m);
    A.sfx("key");
    save();
    paint();
  }

  function unplace(pos) {
    if (pos < 0 || pos >= S.place.length) return;
    S.place.splice(pos, 1);
    A.sfx("tick");
    save();
    paint();
  }

  /* ── scoring one round ────────────────────────────────────────────────── */

  function answer(pick) {
    if (S.screen !== "q" || res(S.ri)) return;
    var got = 0, k = KIND[S.ri];

    if (k === "spec") {
      got = plan.specOpts[S.ri][pick] && plan.specOpts[S.ri][pick].ok ? PTS : 0;
    } else if (k === "fake") {
      got = plan.roi[pick] && plan.roi[pick].k === "fake" ? PTS : 0;
    } else if (k === "bench") {
      var d = Math.abs(pick - BENCH[plan.bench].band);
      got = d === 0 ? PTS : d === 1 ? 8 : 0;
    } else {
      got = orderScore(pick);
    }

    S.res[S.ri] = { pick: pick, got: got };
    S.screen = "r";
    A.sfx(got === PTS ? "ok" : got > 0 ? "near" : "miss");
    save();
    paint();
  }

  /**
   * The ordering round. `given` is the player's sequence of MILE indices;
   * plan.order is the true sequence, ascending by date.
   *   exact                      → 20
   *   5 of the 6 pairs right     → 13   (one transposition)
   *   4 of 6                     → 7
   *   3 or fewer (chance is 3)   → 0
   * Scoring on pairs rather than positions means a single item slipped one
   * place costs far less than a reversal, which is the right shape: the player
   * who knows the decade but not the month should not be wiped out.
   */
  function orderScore(given) {
    var truth = plan.order, i, j, pairs = 0;
    if (!given || given.length !== 4) return 0;
    for (i = 0; i < 4; i++) {
      for (j = i + 1; j < 4; j++) {
        if (truth.indexOf(given[i]) < truth.indexOf(given[j])) pairs++;
      }
    }
    if (pairs === 6) return PTS;
    if (pairs === 5) return 13;
    if (pairs === 4) return 7;
    return 0;
  }

  /* ── revealing ────────────────────────────────────────────────────────── */

  function verdict(got, extra) {
    var v = A.el("div", "mi-verd");
    v.innerHTML = got === PTS
      ? '<span class="up">RIGHT</span> · +' + got
      : got > 0
        ? '<span class="pt">CLOSE</span> · +' + got
        : '<span class="dn">NO</span> · +0';
    if (extra) v.innerHTML += " &nbsp;" + extra;
    return v;
  }

  function source(who, year, url, label) {
    var s = A.el("div", "mi-src");
    s.innerHTML = "<div>" + (label ? A.esc(label) + " — " : "") + A.esc(who || "") +
      (year ? ", " + year : "") +
      (url ? ' · <a href="' + A.esc(url) + '" target="_blank" rel="noopener">source</a>' : "") +
      "</div>";
    return s;
  }

  function renderR() {
    var k = KIND[S.ri];
    if (k === "spec") return revSpec();
    if (k === "order") return revOrder();
    if (k === "fake") return revRoi();
    return revBench();
  }

  function nextLabel() {
    if (S.ri + 1 >= NR) return "SEE THE DAY ▸";
    return "ROUND " + (S.ri + 2) + " ▸";
  }

  function nextRow() {
    return goRow(nextLabel(), advance, "mi-next");
  }

  function advance() {
    if (S.screen !== "r") return;
    if (S.ri + 1 >= NR) {
      S.screen = "done";
      end();
      return;
    }
    S.ri++;
    S.screen = "q";
    A.sfx("key");
    save();
    paint();
  }

  function revSpec() {
    var s = SPEC[plan.spec[S.ri]], opts = plan.specOpts[S.ri], r = res(S.ri);
    var box = card();
    kick(box);
    box.appendChild(A.el("div", "mi-ctx", A.esc(s.ctx)));
    box.appendChild(A.el("div", "mi-given",
      "<i>THE OBJECTIVE, AS WRITTEN</i>" + A.esc(s.given)));

    var wrap = A.el("div", "mi-opts");
    opts.forEach(function (o, i) {
      var b = optButton(LET[i], A.esc(o.t), null);
      if (o.ok) b.classList.add("ok");
      else if (i === r.pick) b.classList.add("no");
      else b.classList.add("faded");
      wrap.appendChild(b);
    });
    box.appendChild(wrap);
    box.appendChild(verdict(r.got));

    box.appendChild(A.el("div", "mi-note", "<i>WHAT HAPPENED</i>" + A.esc(s.story) +
      (s.contested ? " <b>This one is often misreported; the version above is the sourced one.</b>" : "")));

    // The borrowed wrong answers are the point of the round: say so, and credit
    // the case each one was lifted from.
    var lifted = [];
    opts.forEach(function (o, i) {
      if (!o.o || !SPEC_BY[o.o]) return;
      var other = SPEC_BY[o.o];
      lifted.push(LET[i] + " also happened — " + other.who + ", " + other.year);
    });
    if (lifted.length) {
      var l = A.el("div", "mi-note");
      l.innerHTML = "<i>AND THE OTHERS</i>" + lifted.map(A.esc).join("<br>");
      box.appendChild(l);
    }

    box.appendChild(source(s.who, s.year, s.url));
    box.appendChild(nextRow());
    show(box);
  }

  function revRoi() {
    var r = res(S.ri);
    var box = card();
    kick(box);
    box.appendChild(A.el("div", "mi-ctx", "Three happened. One did not."));

    var wrap = A.el("div", "mi-opts");
    plan.roi.forEach(function (o, i) {
      var txt = o.k === "fake" ? FAKES[o.i].txt : BITS[o.i].txt;
      var b = optButton(LET[i], A.esc(txt), null);
      if (o.k === "fake") b.classList.add("ok");
      else if (i === r.pick) b.classList.add("no");
      else b.classList.add("faded");
      wrap.appendChild(b);
    });
    box.appendChild(wrap);
    box.appendChild(verdict(r.got));

    var f = FAKES[plan.fake];
    box.appendChild(A.el("div", "mi-note", "<i>THE INVENTED ONE, AND THE TELL</i>" + A.esc(f.tell)));

    var src = A.el("div", "mi-src");
    plan.roi.forEach(function (o, i) {
      if (o.k !== "bit") return;
      var b = BITS[o.i];
      src.innerHTML += "<div>" + LET[i] + " — " + A.esc(b.who) + ", " + b.year +
        ' · <a href="' + A.esc(b.url) + '" target="_blank" rel="noopener">source</a>' +
        (b.contested ? " (often misreported)" : "") + "</div>";
    });
    box.appendChild(src);
    box.appendChild(nextRow());
    show(box);
  }

  function revBench() {
    var b = BENCH[plan.bench], r = res(S.ri);
    var box = card();
    kick(box);
    box.appendChild(A.el("div", "mi-ctx",
      "<b>" + A.esc(b.sys) + "</b>, on <b>" + A.esc(b.bench) + "</b>, in " + b.year + "."));

    var wrap = A.el("div", "mi-opts");
    BANDS.forEach(function (band, i) {
      var el = optButton(LET[i], A.esc(band.t) + "<em>" + A.esc(band.d) + "</em>", null);
      if (i === b.band) el.classList.add("ok");
      else if (i === r.pick) el.classList.add("no");
      else el.classList.add("faded");
      wrap.appendChild(el);
    });
    box.appendChild(wrap);
    box.appendChild(verdict(r.got));

    box.appendChild(A.el("div", "mi-note",
      "<i>THE NUMBERS</i><b>" + A.esc(b.score) + "</b> against a human baseline of <b>" +
      A.esc(b.human) + "</b>.<br>" + A.esc(b.story)));
    box.appendChild(source("", b.year, b.url, b.bench));
    box.appendChild(nextRow());
    show(box);
  }

  function revOrder() {
    var r = res(S.ri), given = r.pick || [];
    var box = card();
    kick(box);
    box.appendChild(A.el("div", "mi-ctx", "In the order they happened:"));

    var slots = A.el("div", "mi-slots");
    plan.order.forEach(function (m, i) {
      var sl = A.el("div", "mi-slot full " + (given[i] === m ? "ok" : "no"));
      var mi = MILE[m];
      sl.innerHTML = "<i>" + (i + 1) + "</i><span>" + A.esc(mi.lab) +
        "<small>" + A.esc(prettyWhen(mi)) + "</small></span>";
      slots.appendChild(sl);
    });
    box.appendChild(slots);
    box.appendChild(verdict(r.got, r.got === PTS ? "" : "in the right place: " +
      countRight(given) + "/4"));

    var notes = plan.order.filter(function (m) { return MILE[m].note; });
    if (notes.length) {
      var n = A.el("div", "mi-note");
      n.innerHTML = "<i>WORTH KNOWING</i>" + A.esc(MILE[notes[0]].note);
      box.appendChild(n);
    }

    var src = A.el("div", "mi-src");
    plan.order.forEach(function (m, i) {
      var mi = MILE[m];
      src.innerHTML += "<div>" + (i + 1) + " — " +
        '<a href="' + A.esc(mi.url) + '" target="_blank" rel="noopener">source</a></div>';
    });
    box.appendChild(src);
    box.appendChild(nextRow());
    show(box);
  }

  function countRight(given) {
    var n = 0, i;
    for (i = 0; i < 4; i++) if (given[i] === plan.order[i]) n++;
    return n;
  }

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  // Never claim more precision than the bank records. `prec` is the honesty
  // field: a milestone we only know the year of prints the year.
  function prettyWhen(m) {
    var y = m.d.slice(0, 4), mo = +m.d.slice(5, 7), dd = +m.d.slice(8, 10);
    if (m.prec === "year") return y;
    if (m.prec === "month") return MONTHS[mo - 1] + " " + y;
    return dd + " " + MONTHS[mo - 1] + " " + y;
  }

  /* ── the end ──────────────────────────────────────────────────────────── */

  function grid() {
    var out = "", i, r;
    for (i = 0; i < NR; i++) {
      r = res(i);
      out += !r || r.got === 0 ? "⬛" : r.got === PTS
        ? (A.settings().colourblind ? "🟦" : "🟩")
        : (A.settings().colourblind ? "🟧" : "🟨");
    }
    return [out];
  }

  function end() {
    var n = total();
    var won = n >= WIN_AT;
    if (!practice && !finished) {
      finished = true;
      A.finish(ID, day, {
        score: n, norm: n, won: won, detail: cleanRounds() + "/" + NR,
        bucket: cleanRounds(), shareGrid: grid(), durationMs: Date.now() - S.t0,
      });
    }
    save();
    if (n >= 90) { A.sfx("perfect"); A.confetti(140); }
    else if (won) { A.sfx("win"); A.confetti(80); }
    else A.sfx("lose");
    paint();
    sheet();
  }

  function renderDone() {
    var box = card();
    box.appendChild(strip());
    box.appendChild(A.el("div", "mi-kick", "THE DAY"));
    var t = A.el("div", "mi-rules"), i;
    for (i = 0; i < NR; i++) {
      var r = res(i);
      t.appendChild(A.el("div", "mi-rule",
        "<i>R" + (i + 1) + "</i><span><b>" + A.esc(TITLE[i]) + "</b> — " +
        (r ? r.got : 0) + "/" + PTS + "</span>"));
    }
    box.appendChild(t);
    box.appendChild(goRow("RESULT ▸", sheet, "mi-sheet"));
    show(box);
  }

  function shareLine() {
    return "MISALIGNED " + (practice ? "(practice)" : "#" + day) + " " +
      total() + "/100\n" + grid().join("\n") + "\n" + A.SITE;
  }

  function sheet() {
    var n = total();
    var extra = '<p class="center tiny muted" style="margin-top:10px;line-height:1.8">' +
      cleanRounds() + " of " + NR + " rounds clean.</p>";

    var m = A.results(ID, practice ? A.PRACTICE : day, {
      title: n >= 90 ? "READ THE SPEC" : n >= 70 ? "WELL CALIBRATED"
        : n >= WIN_AT ? "SOLID" : n > 0 ? "PARTIAL CREDIT" : "TOMORROW, THEN",
      extraHTML: extra,
      state: { norm: n, shareGrid: grid(), won: n >= WIN_AT },
      shareText: shareLine(),
      onReplay: function () { location.reload(); },
    });
    // Own the share text in every mode — the core only reads opts.shareText
    // when dayN is PRACTICE.
    var sb = m.body.querySelector("#ac-share");
    if (sb) sb.onclick = function () { A.share(practice ? shareLine() : A.shareCard(ID, day)); };
    return m;
  }

  /* ── keyboard ─────────────────────────────────────────────────────────── */

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (document.activeElement && document.activeElement.localName) || "";
    if (tag === "input" || tag === "textarea") return;
    if (document.querySelector(".ac-modal")) return;

    var k = String(e.key || "");
    if (k === "Enter" || k === " ") {
      var btn = document.querySelector("#mi-start, #mi-lock, #mi-next, #mi-sheet");
      if (btn) { e.preventDefault(); btn.click(); }
      return;
    }
    if (S.screen !== "q") return;

    var n = -1;
    if (/^[1-4]$/.test(k)) n = +k - 1;
    else if (/^[a-dA-D]$/.test(k)) n = k.toLowerCase().charCodeAt(0) - 97;
    if (n < 0) return;

    // Route through the real buttons, so the keyboard can never diverge from
    // the taps. In the ordering round the letters belong to the items, which
    // move as they are placed, so match on the letter that is on screen.
    var btns = A.$$(".mi-opt:not(:disabled)", stage);
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i].querySelector("b");
      if (b && b.textContent === LET[n]) { e.preventDefault(); btns[i].click(); return; }
    }
  });

  /* ── debug hook, for _build/t_misaligned.js ───────────────────────────── */

  window.__MI = {
    day: function () { return day; },
    plan: function () { return plan; },
    state: function () {
      return {
        screen: S.screen, ri: S.ri, place: S.place.slice(),
        res: S.res.map(function (r) { return r ? { pick: r.pick, got: r.got } : null; }),
        total: total(), clean: cleanRounds(), practice: practice,
      };
    },
    // What the CORRECT option letter is for the round on screen — the test uses
    // this to click the right button, never to bypass one.
    right: function () {
      var k = KIND[S.ri], i;
      if (k === "spec") {
        for (i = 0; i < plan.specOpts[S.ri].length; i++) if (plan.specOpts[S.ri][i].ok) return LET[i];
      }
      if (k === "fake") {
        for (i = 0; i < plan.roi.length; i++) if (plan.roi[i].k === "fake") return LET[i];
      }
      if (k === "bench") return LET[BENCH[plan.bench].band];
      return null;
    },
    // The order round's answer, as the letters shown on the unplaced buttons.
    rightOrder: function () {
      return plan.order.map(function (m) { return LET[plan.orderShown.indexOf(m)]; });
    },
    kinds: function () { return KIND.slice(); },
    bank: function () {
      return { spec: SPEC.length, bits: BITS.length, fakes: FAKES.length,
               bench: BENCH.length, mile: MILE.length, orders: ORDERS.length };
    },
  };
})();
