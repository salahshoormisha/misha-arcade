/* ============================================================================
   THE DECIDER — the one cabinet in the arcade where they play against each
   other. One device, two people, pass it back and forth.
   ----------------------------------------------------------------------------
   Built on the shape of games/wordish/game.js (the reference implementation):
     requestedDay → deterministic plan → load → save on every move
     → finish once → results sheet.

   THREE ROUNDS
     R1  ALTERNATING  six questions each, strictly in turns, 10 points, the
                      difficulty ramping 1→5. Both players in a pair get the
                      SAME category and the SAME difficulty (different
                      questions), so the round is genuinely symmetrical.
     R2  THE STEAL    six questions, three each. Miss one and it is offered to
                      the other player for half points. The correct answer is
                      NOT shown until the steal has been resolved — otherwise
                      the steal would be free.
     R3  THE WAGER    one numeric question. Each player secretly stakes up to
                      their own score BEFORE seeing the question, then answers
                      secretly. Closest takes the whole pot; dead exact takes
                      double. Revealed together.

   A full-screen curtain sits between every turn, so nobody sees a question
   that is not theirs. It fades in via a forced reflow, never rAF — rAF is
   paused in a background tab and the curtain would never appear.

   NORM (cross-game 0-100 currency, CONTRACT §3) — the LOCAL player's share of
   the points scored on the night:
       norm = round(100 * mine / (mine + theirs))      (50 if nobody scored)
   So a dead heat is 50, a solid win around 60-65, a hiding 80+, and a whitewash
   100. A loss lands below 50, which is right: the other person earned it.
   `par` is therefore 50 — a level contest.

   The head-to-head ledger lives in its own localStorage key (see H2H_KEY) and
   counts DAILY games only. Rematches run in practice mode and are logged as
   friendlies, so a quick decider over breakfast can never be undone by one.
   ========================================================================== */
(function () {
  "use strict";

  /* ── constants ────────────────────────────────────────────────────────────
     Declared above every first use: `var` initialisers do NOT hoist, so a
     constant referenced by a function called during boot would be undefined. */

  var ID = "decider";
  var PTS = 10, STEAL_PTS = 5;
  var R1_LADDER = [1, 2, 3, 3, 4, 5];      // one entry per PAIR of questions
  var R2_LADDER = [2, 3, 3, 4, 4, 5];      // one entry per question
  var R1_N = R1_LADDER.length * 2;         // 12
  var R2_N = R2_LADDER.length;             // 6
  var NQ = R1_N + R2_N;                    // 18 asked questions, then the wager
  var COL = ["--hot", "--cool"];           // player one, player two
  var LET = ["A", "B", "C", "D"];
  var DEF = ["Misha", "David"];
  var H2H_KEY = A.NS + "decider:h2h";
  var NAME_MAX = 12;
  var PAR = 50;                            // a level contest

  var HELP =
    "<p><b>One phone, two people, three rounds.</b> Pass it back and forth — a full-screen " +
    "curtain covers the screen between turns so you never see each other's question.</p>" +
    "<ul>" +
    "<li><b>Round 1 — alternating.</b> Six questions each, strictly in turns, ten points a go. " +
    "Both of you get the same category and the same difficulty each time, so nobody gets the " +
    "easy half. The ladder climbs from one pip to five.</li>" +
    "<li><b>Round 2 — the steal.</b> Six questions, three each. Miss yours and it is offered to " +
    "the other one for <b>five</b>. You will not be told the right answer until the steal has " +
    "been settled, so there is nothing to give away.</li>" +
    "<li><b>Round 3 — the wager.</b> One question with a number for an answer. You each stake up " +
    "to your own score <i>before</i> you see it, then answer in secret. <b>Closest takes the " +
    "pot. Exactly right takes double.</b> Revealed together.</li>" +
    "<li><b>The ledger.</b> Only the daily counts towards the head-to-head on the title screen. " +
    "Rematches are friendlies — for pride, and for arguing about.</li>" +
    "<li>On a laptop: <b>1-4</b> or <b>A-D</b> to answer, <b>Enter</b> for everything else.</li>" +
    "</ul>";

  /* ── the data, defensively ───────────────────────────────────────────────
     A malformed entry is skipped rather than allowed to break a round. */

  var T = window.AD_TRIVIA || {};
  var CATS = T.cats || {};
  var ALL = [];
  var MC = [], NUM = [], BY = {}, BYD = {}, CAT_KEYS = [];

  (function prepare() {
    var raw = T.questions || [], i, q, key;
    for (i = 0; i < raw.length; i++) {
      q = raw[i];
      if (!q || typeof q.q !== "string" || !q.q) continue;
      if (!CATS[q.cat]) continue;
      var d = Math.round(+q.diff);
      if (!(d >= 1 && d <= 5)) continue;

      if (q.numeric) {
        if (typeof q.a !== "number" || !isFinite(q.a)) continue;
        ALL.push({ q: q.q, a: q.a, unit: String(q.unit || ""), cat: q.cat, diff: d,
          note: String(q.note || ""), numeric: true });
        NUM.push(ALL.length - 1);
        continue;
      }
      if (!q.opts || q.opts.length !== 4 || typeof q.a !== "string") continue;
      var seen = {}, bad = false, ai = -1, j;
      for (j = 0; j < 4; j++) {
        var o = String(q.opts[j] === undefined ? "" : q.opts[j]).trim();
        if (!o || seen[o.toLowerCase()]) { bad = true; break; }
        seen[o.toLowerCase()] = 1;
        if (o.toLowerCase() === String(q.a).trim().toLowerCase()) ai = j;
      }
      if (bad || ai < 0) continue;
      ALL.push({ q: q.q, a: String(q.a).trim(), ai: ai, cat: q.cat, diff: d,
        opts: q.opts.map(function (x) { return String(x).trim(); }),
        note: String(q.note || "") });
      var idx = ALL.length - 1;
      MC.push(idx);
      key = q.cat + "|" + d;
      (BY[key] || (BY[key] = [])).push(idx);
      (BYD[d] || (BYD[d] = [])).push(idx);
    }
    CAT_KEYS = Object.keys(CATS).filter(function (c) {
      for (var d = 1; d <= 5; d++) if ((BY[c + "|" + d] || []).length) return true;
      return false;
    });
  })();

  /* ── who is playing ──────────────────────────────────────────────────── */

  function clean(s, dflt) {
    s = String(s === undefined || s === null ? "" : s).replace(/[<>]/g, "").trim();
    return (s || dflt).slice(0, NAME_MAX);
  }

  function ledger() {
    var L = A._get(H2H_KEY, null) || {};
    return {
      opponent: clean(L.opponent, DEF[1]),
      wins: [+L.wins0 || 0, +L.wins1 || 0],
      draws: +L.draws || 0,
      friendlies: +L.friendlies || 0,
      days: L.days || {},
      last: L.last || null,
    };
  }
  function saveLedger(L) {
    A._set(H2H_KEY, {
      opponent: L.opponent, wins0: L.wins[0], wins1: L.wins[1], draws: L.draws,
      friendlies: L.friendlies, days: L.days, last: L.last,
    });
  }

  var names = [clean(A.settings().player, DEF[0]), ledger().opponent];
  function tag(p) { return (names[p] || "?").charAt(0).toUpperCase(); }
  function esc(s) { return A.esc(s === undefined || s === null ? "" : s); }

  /* ── the day's plan (deterministic) ──────────────────────────────────── */

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;

  function pool(list, used) {
    var out = [], i;
    for (i = 0; i < list.length; i++) if (!used[list[i]]) out.push(list[i]);
    return out;
  }
  function widen(diff, used) {
    var order = [diff], out = [], k, d;
    for (k = 1; k <= 4; k++) { order.push(diff - k); order.push(diff + k); }
    for (k = 0; k < order.length; k++) {
      d = order[k];
      if (d >= 1 && d <= 5) out = out.concat(pool(BYD[d] || [], used));
    }
    return out;
  }
  // Categories not yet used today come first, so a game spreads across the board.
  function catOrder(rnd, catsUsed) {
    var shuffled = A.shuffle(rnd, CAT_KEYS), fresh = [], stale = [], i;
    for (i = 0; i < shuffled.length; i++) {
      (catsUsed[shuffled[i]] ? stale : fresh).push(shuffled[i]);
    }
    return fresh.concat(stale);
  }
  function take(rnd, diff, used, catsUsed, n) {
    var order = catOrder(rnd, catsUsed), i, p;
    for (i = 0; i < order.length; i++) {
      p = pool(BY[order[i] + "|" + diff] || [], used);
      if (p.length >= n) {
        var got = A.sample(rnd, p, n);
        got.forEach(function (x) { used[x] = 1; });
        catsUsed[order[i]] = (catsUsed[order[i]] || 0) + n;
        return got;
      }
    }
    var wide = widen(diff, used);              // last resort: difficulty only
    if (wide.length < n) return null;
    var any = A.sample(rnd, wide, n);
    any.forEach(function (x) { used[x] = 1; catsUsed[ALL[x].cat] = (catsUsed[ALL[x].cat] || 0) + 1; });
    return any;
  }

  function buildPlan() {
    var seed = practice ? ID + ":prac:" + Date.now() + ":" + Math.random() : ID + ":plan:" + day;
    var rnd = A.rng(seed);
    var used = {}, catsUsed = {}, r1 = [], r2 = [], i, got;

    for (i = 0; i < R1_LADDER.length; i++) {
      got = take(rnd, R1_LADDER[i], used, catsUsed, 2);
      if (!got) return null;
      r1.push(got[0], got[1]);
    }
    for (i = 0; i < R2_LADDER.length; i++) {
      got = take(rnd, R2_LADDER[i], used, catsUsed, 1);
      if (!got) return null;
      r2.push(got[0]);
    }
    var np = pool(NUM.filter(function (x) { return ALL[x].diff >= 3; }), used);
    if (!np.length) np = pool(NUM, used);
    if (!np.length) return null;

    return {
      sig: ALL.length,
      first: A.rng(ID + ":toss:" + (practice ? seed : day))() < 0.5 ? 0 : 1,
      r1: r1, r2: r2, w: A.pick(rnd, np),
    };
  }

  var plan = null, steps = [];

  function makeSteps() {
    steps = [];
    var i;
    for (i = 0; i < plan.r1.length; i++) {
      steps.push({ r: 1, n: i, i: plan.r1[i], p: (plan.first + i) % 2 });
    }
    // Round two opens with whoever went second in round one.
    for (i = 0; i < plan.r2.length; i++) {
      steps.push({ r: 2, n: i, i: plan.r2[i], p: (plan.first + 1 + i) % 2 });
    }
  }

  /* ── state ───────────────────────────────────────────────────────────── */

  var S = null;
  function blank() {
    return {
      v: 1, screen: "title", si: 0, stage: "q", ans: [], score: [0, 0],
      w: { turn: 0, bet: [null, null], val: [null, null] },
      over: false, t0: Date.now(),
    };
  }

  function step() { return steps[S.si] || null; }
  function q() { var s = step(); return s ? ALL[s.i] : null; }
  function wq() { return ALL[plan.w]; }
  function stealing() { return S.stage === "steal"; }
  function value() { return stealing() ? STEAL_PTS : PTS; }

  function actor() {
    if (S.screen === "wpass" || S.screen === "wbet" || S.screen === "wask") return S.w.turn;
    var s = step();
    if (!s) return plan.first;
    return stealing() ? 1 - s.p : s.p;
  }

  /* ── chrome ──────────────────────────────────────────────────────────── */

  var main = A.mount({ id: ID, dayN: day, help: HELP });
  main.classList.add("dc");
  var stage = A.el("div");
  var board = null;

  if (!CAT_KEYS.length || MC.length < NQ || !NUM.length) {
    main.innerHTML = '<p class="center muted" style="padding:44px 0;line-height:1.85">' +
      "The question bank didn't load.<br>Check <b>core/data/trivia.js</b> — it should set " +
      "<code>window.AD_TRIVIA.questions</code>.</p>";
    return;
  }

  plan = buildPlan();
  if (!plan) {
    main.innerHTML = '<p class="center muted" style="padding:44px 0;line-height:1.85">' +
      "Couldn't build tonight's card from the question bank.<br>" +
      "Run <b>python3 _build/check_trivia.py</b>.</p>";
    return;
  }
  makeSteps();
  main.appendChild(stage);
  restore();

  /* ── rendering ───────────────────────────────────────────────────────── */

  function paint() {
    stage.innerHTML = "";
    dropCurtain();
    main.style.setProperty("--p", "var(" + COL[actor()] + ")");
    if (S.screen === "title") return renderTitle();

    stage.appendChild(scoreboard());
    if (S.screen === "pass" || S.screen === "wpass") return renderCurtain();
    if (S.screen === "ask") return renderAsk();
    if (S.screen === "reveal") return renderReveal();
    if (S.screen === "wbet") return renderBet();
    if (S.screen === "wask") return renderWAsk();
    if (S.screen === "wreveal") return renderWReveal();
    if (S.screen === "done") return renderDone();
  }

  function scoreboard() {
    var wrap = A.el("div", "dc-board");
    var live = actor(), showLive = S.screen !== "done" && S.screen !== "wreveal";
    var p;
    for (p = 0; p < 2; p++) {
      var side = A.el("div", "dc-side" + (showLive && p === live ? " on" : ""));
      side.style.setProperty("--who", "var(" + COL[p] + ")");
      side.innerHTML = '<span class="dc-nm">' + esc(names[p]) + "</span>" +
        '<span class="dc-sc">' + S.score[p] + "</span>" +
        '<span class="dc-tag">' + (showLive && p === live ? "TO ANSWER" : "POINTS") + "</span>";
      if (p === 0) wrap.appendChild(side); else { wrap.appendChild(mid()); wrap.appendChild(side); }
    }
    return wrap;

    function mid() {
      var m = A.el("div", "dc-mid");
      var s = step();
      var txt;
      if (S.screen === "done") txt = "FINAL";
      else if (S.screen.charAt(0) === "w") txt = "<b>R3</b>THE WAGER";
      else if (s) {
        txt = "<b>R" + s.r + "</b>" + (s.r === 1
          ? "Q" + (Math.floor(s.n / 2) + 1) + "/6"
          : "Q" + (s.n + 1) + "/6");
      } else txt = "—";
      m.innerHTML = txt;
      return m;
    }
  }

  /* ── title ───────────────────────────────────────────────────────────── */

  function leadLine(L) {
    var a = L.wins[0], b = L.wins[1], d = L.draws;
    if (!a && !b && !d) return "NOTHING SETTLED YET";
    if (a === b) return "ALL SQUARE AT <em>" + a + "-" + b + "</em>";
    var hi = a > b ? 0 : 1;
    return esc(names[hi]).toUpperCase() + " LEADS <em>" +
      Math.max(a, b) + "-" + Math.min(a, b) + "</em>";
  }

  function renderTitle() {
    var L = ledger();
    var box = A.el("div", "dc-title dc-in");
    var played = L.wins[0] + L.wins[1] + L.draws;

    box.innerHTML =
      '<div class="dc-h2h">' +
        '<div class="dc-lead">' + leadLine(L) + "</div>" +
        '<div class="dc-h2hsub">' +
          (played ? played + " DECIDER" + (played === 1 ? "" : "S") +
            (L.draws ? " · " + L.draws + " DRAWN" : "") : "FIRST BLOOD TONIGHT") +
          (L.friendlies ? " · " + L.friendlies + " FRIENDL" + (L.friendlies === 1 ? "Y" : "IES") : "") +
        "</div>" +
        '<div class="dc-names">' +
          '<div class="dc-name a"><label>PLAYER ONE</label>' +
            '<input id="dc-n0" maxlength="' + NAME_MAX + '" autocomplete="off" spellcheck="false" ' +
            'value="' + esc(names[0]) + '" aria-label="Player one name"></div>' +
          '<div class="dc-name b"><label>PLAYER TWO</label>' +
            '<input id="dc-n1" maxlength="' + NAME_MAX + '" autocomplete="off" spellcheck="false" ' +
            'value="' + esc(names[1]) + '" aria-label="Player two name"></div>' +
        "</div>" +
      "</div>" +
      '<div class="dc-rules">' +
        rule("R1", "<b>Six each, in turns.</b> Same category, same difficulty, ten points — " +
          "and it gets harder every question.") +
        rule("R2", "<b>The steal.</b> Three each. Miss and the other one gets it for five.") +
        rule("R3", "<b>The wager.</b> One number. Stake what you dare. Closest takes the pot, " +
          "exact takes double.") +
      "</div>" +
      '<p class="center tiny dim" style="margin-top:14px;line-height:1.8">' +
        esc(names[plan.first]) + " goes first" + (practice ? "" : " today") +
        ".<br>Put the phone down between turns — the screen covers itself.</p>" +
      '<div class="ac-row dc-acts"><button class="ac-btn" id="dc-start">' +
        (practice ? "PLAY A FRIENDLY ▸" : "START THE DECIDER ▸") + "</button></div>" +
      '<div class="ac-row dc-foot">' +
        (practice ? '<a class="ac-pill" href="./">◂ TODAY\'S DECIDER</a>'
                  : '<a class="ac-pill" href="?practice=1">∞ FRIENDLY</a>') +
        '<button class="ac-pill" id="dc-arch">📅 ARCHIVE</button>' +
      "</div>";

    stage.appendChild(box);

    var n0 = box.querySelector("#dc-n0"), n1 = box.querySelector("#dc-n1");
    n0.onchange = n0.onblur = function () { setName(0, this.value); };
    n1.onchange = n1.onblur = function () { setName(1, this.value); };
    box.querySelector("#dc-start").onclick = start;
    box.querySelector("#dc-arch").onclick = function () { A.archiveModal(ID); };

    function rule(k, txt) {
      return '<div class="dc-rule"><i>' + k + "</i><span>" + txt + "</span></div>";
    }
  }

  function setName(p, v) {
    var next = clean(v, DEF[p]);
    if (next === names[p]) return;
    names[p] = next;
    if (p === 0) A.set("player", next);
    else { var L = ledger(); L.opponent = next; saveLedger(L); }
    paint();
    A.toast(p === 0 ? "Player one is " + next : "Player two is " + next);
  }

  /* ── the curtain ─────────────────────────────────────────────────────── */

  var curtain = null;
  function dropCurtain() {
    if (curtain) { curtain.remove(); curtain = null; }
  }

  function renderCurtain() {
    var p = actor(), s = step(), isW = S.screen === "wpass";
    var why, head;

    if (isW) {
      head = "ROUND 3 · THE WAGER";
      why = "One question, and the answer is a number. Stake up to your <b>" + S.score[p] +
        "</b> before you see it.";
    } else if (stealing()) {
      head = "ROUND 2 · Q" + (s.n + 1) + " OF 6 · THE STEAL";
      why = esc(names[1 - p]) + " missed it. Yours for <b>" + STEAL_PTS + " points</b> — " +
        "their wrong answer is crossed out.";
    } else {
      head = "ROUND " + s.r + " · Q" + (s.r === 1 ? Math.floor(s.n / 2) + 1 : s.n + 1) + " OF 6";
      why = "Your question. Worth <b>" + PTS + " points</b>.";
    }

    var c = A.el("div", "dc-curtain");
    c.style.setProperty("--who", "var(" + COL[p] + ")");
    c.innerHTML =
      '<div class="dc-cstep">' + head + "</div>" +
      '<div class="dc-cto">PASS TO</div>' +
      '<div class="dc-cname">' + esc(names[p]) + "</div>" +
      '<div class="dc-cwhy">' + why + "</div>" +
      '<div class="dc-cscore">' + esc(names[0]) + " " + S.score[0] + "  ·  " +
        esc(names[1]) + " " + S.score[1] + "</div>" +
      '<button class="ac-btn" id="dc-ready">I\'M ' + esc(names[p]).toUpperCase() + " — READY</button>" +
      '<div class="dc-eyes">' + esc(names[1 - p]).toUpperCase() + ", NO LOOKING</div>";

    document.body.appendChild(c);
    curtain = c;
    // Force a reflow, then show synchronously. requestAnimationFrame here would
    // leave the curtain invisible forever in a backgrounded tab.
    void c.offsetWidth;
    c.classList.add("in");
    c.querySelector("#dc-ready").onclick = go;
    try { c.querySelector("#dc-ready").focus({ preventScroll: true }); } catch (e) {}
  }

  /* ── asking ──────────────────────────────────────────────────────────── */

  function pips(d) { return "●".repeat(d) + "○".repeat(5 - d); }

  function metaRow(item, extra) {
    var c = CATS[item.cat] || { label: item.cat, icon: "•" };
    var row = A.el("div", "ac-row dc-meta");
    row.innerHTML =
      '<span class="ac-pill">' + c.icon + " " + esc(c.label) + "</span>" +
      '<span class="ac-pill"><span class="dc-pips">' + pips(item.diff) + "</span></span>" +
      (extra || "");
    return row;
  }

  function renderAsk() {
    var item = q(), a = S.ans[S.si] || null;
    var box = A.el("div", "dc-in");
    box.appendChild(metaRow(item, '<span class="ac-pill"><b>' + value() + "</b> PTS</span>"));

    var qe = A.el("div", "dc-q", esc(item.q));
    box.appendChild(qe);

    var opts = A.el("div", "dc-opts");
    item.opts.forEach(function (text, i) {
      var b = A.el("button", "dc-opt");
      b.type = "button";
      b.innerHTML = "<b>" + LET[i] + "</b><span>" + esc(text) + "</span>";
      if (stealing() && a && a.pick === i) {
        b.classList.add("out");
        b.disabled = true;
        b.setAttribute("aria-label", text + " — already tried");
      } else {
        b.onclick = function () { pick(i); };
      }
      opts.appendChild(b);
    });
    box.appendChild(opts);
    stage.appendChild(box);
  }

  function renderReveal() {
    var item = q(), a = S.ans[S.si];
    var mine = stealing() ? a.s : a;
    var full = fullReveal();
    var box = A.el("div", "dc-in");
    box.appendChild(metaRow(item));
    box.appendChild(A.el("div", "dc-q", esc(item.q)));

    var opts = A.el("div", "dc-opts");
    item.opts.forEach(function (text, i) {
      var b = A.el("button", "dc-opt");
      b.type = "button";
      b.disabled = true;
      b.innerHTML = "<b>" + LET[i] + "</b><span>" + esc(text) + "</span>";
      if (full && i === item.ai) b.classList.add("ok");
      else if (mine && i === mine.pick) b.classList.add("no");
      else if (a.s && !stealing() && i === a.pick) b.classList.add("no");
      else b.classList.add("dim");
      opts.appendChild(b);
    });
    box.appendChild(opts);

    var v = A.el("div", "dc-verd");
    if (mine.ok) {
      v.innerHTML = '<span class="' + (stealing() ? "st" : "up") + '">' +
        (stealing() ? "STOLEN" : "CORRECT") + " · +" + value() + "</span> &nbsp;" +
        esc(names[actor()]);
    } else if (!full) {
      v.innerHTML = '<span class="dn">MISSED</span> &nbsp;OVER TO ' +
        esc(names[1 - actor()]).toUpperCase() + " FOR " + STEAL_PTS;
    } else {
      v.innerHTML = '<span class="dn">NO POINTS</span>' +
        (stealing() ? " &nbsp;NOBODY GOT IT" : "");
    }
    box.appendChild(v);

    if (full && item.note) {
      box.appendChild(A.el("div", "dc-note", "<i>WHY</i>" + esc(item.note)));
    }

    var go2 = A.el("div", "ac-row dc-go");
    go2.innerHTML = '<button class="ac-btn" id="dc-next">' + nextLabel() + "</button>";
    box.appendChild(go2);
    stage.appendChild(box);
    go2.querySelector("#dc-next").onclick = go;
  }

  // The correct answer stays hidden while a steal is still on the table.
  function fullReveal() {
    var s = step(), a = S.ans[S.si];
    if (!s || !a) return true;
    if (stealing()) return true;
    return !(s.r === 2 && !a.ok);
  }

  function nextLabel() {
    if (!fullReveal()) return "OFFER THE STEAL ▸";
    if (S.si + 1 >= NQ) return "TO THE WAGER ▸";
    var nx = steps[S.si + 1];
    return "PASS TO " + esc(names[nx.p]).toUpperCase() + " ▸";
  }

  /* ── the wager ───────────────────────────────────────────────────────── */

  var betVal = 0;

  function renderBet() {
    var p = S.w.turn, max = S.score[p], item = wq();
    betVal = S.w.bet[p] === null ? Math.min(max, Math.round(max / 2)) : S.w.bet[p];
    betVal = A.clamp(betVal, 0, max);

    var box = A.el("div", "dc-in");
    box.style.setProperty("--who", "var(" + COL[p] + ")");
    box.appendChild(metaRow(item, '<span class="ac-pill">NUMBER ANSWER</span>'));

    var bet = A.el("div", "dc-bet");
    bet.innerHTML =
      '<div class="dc-betval" id="dc-bv">' + betVal + "</div>" +
      '<div class="dc-betof">' + esc(names[p]).toUpperCase() + " — STAKED OF " + max + "</div>" +
      (max > 0
        ? '<div class="dc-slider">' +
            '<button class="dc-step" id="dc-minus" aria-label="Lower the stake">−</button>' +
            '<input class="dc-range" id="dc-rng" type="range" min="0" max="' + max +
              '" step="1" value="' + betVal + '" aria-label="Your stake">' +
            '<button class="dc-step" id="dc-plus" aria-label="Raise the stake">+</button>' +
          "</div>" +
          '<div class="ac-row dc-chips">' +
            '<button class="ac-pill" data-b="0">NOTHING</button>' +
            '<button class="ac-pill" data-b="' + Math.round(max / 4) + '">A QUARTER</button>' +
            '<button class="ac-pill" data-b="' + Math.round(max / 2) + '">HALF</button>' +
            '<button class="ac-pill" data-b="' + max + '">ALL IN</button>' +
          "</div>"
        : '<p class="center tiny muted" style="margin-top:12px;line-height:1.8">' +
          "Nothing on the board to stake.<br>This one is for pride.</p>");
    box.appendChild(bet);

    var go2 = A.el("div", "ac-row dc-go");
    go2.innerHTML = '<button class="ac-btn" id="dc-lock">LOCK IT IN ▸</button>';
    box.appendChild(go2);
    box.appendChild(A.el("p", "center tiny dim",
      "You will see the question next. " + esc(names[1 - p]) + " never sees this number."));
    stage.appendChild(box);

    var out = box.querySelector("#dc-bv"), rng = box.querySelector("#dc-rng");
    function show(v) {
      betVal = A.clamp(Math.round(v) || 0, 0, max);
      out.textContent = betVal;
      if (rng) rng.value = betVal;
    }
    if (rng) {
      rng.oninput = function () { show(+this.value); };
      box.querySelector("#dc-minus").onclick = function () { show(betVal - 1); A.sfx("tick"); };
      box.querySelector("#dc-plus").onclick = function () { show(betVal + 1); A.sfx("tick"); };
      A.$$(".dc-chips .ac-pill", box).forEach(function (b) {
        b.onclick = function () { show(+b.getAttribute("data-b")); A.sfx("key"); };
      });
    }
    go2.querySelector("#dc-lock").onclick = function () { lockBet(betVal); };
  }

  function renderWAsk() {
    var p = S.w.turn, item = wq();
    var box = A.el("div", "dc-in");
    box.style.setProperty("--who", "var(" + COL[p] + ")");
    box.appendChild(metaRow(item, '<span class="ac-pill">STAKED <b>' + S.w.bet[p] + "</b></span>"));
    box.appendChild(A.el("div", "dc-q", esc(item.q)));

    var wrap = A.el("div", "dc-numwrap");
    wrap.innerHTML =
      '<input class="dc-num" id="dc-nv" type="text" inputmode="numeric" autocomplete="off" ' +
        'spellcheck="false" placeholder="?" aria-label="Your answer">' +
      '<div class="dc-unit">ANSWER IN ' + esc(item.unit).toUpperCase() + "</div>";
    box.appendChild(wrap);

    var go2 = A.el("div", "ac-row dc-go");
    go2.innerHTML = '<button class="ac-btn" id="dc-sub">LOCK IN THE ANSWER ▸</button>';
    box.appendChild(go2);
    box.appendChild(A.el("p", "center tiny dim", "Closest wins the pot. Exactly right doubles it."));
    stage.appendChild(box);

    var inp = box.querySelector("#dc-nv");
    inp.onkeydown = function (e) {
      if (e.key === "Enter") { e.preventDefault(); submitNum(inp.value); }
    };
    go2.querySelector("#dc-sub").onclick = function () { submitNum(inp.value); };
    try { inp.focus({ preventScroll: true }); } catch (e2) {}
  }

  function parseNum(v) {
    var s = String(v === undefined || v === null ? "" : v).replace(/[^0-9.\-]/g, "");
    if (!s || s === "-" || s === "." || s === "-.") return null;
    var n = parseFloat(s);
    return isFinite(n) ? n : null;
  }

  function wagerOutcome() {
    var truth = wq().a;
    var d0 = Math.abs((S.w.val[0] === null ? Infinity : S.w.val[0]) - truth);
    var d1 = Math.abs((S.w.val[1] === null ? Infinity : S.w.val[1]) - truth);
    var pot = (S.w.bet[0] || 0) + (S.w.bet[1] || 0);
    var win = d0 === d1 ? -1 : (d0 < d1 ? 0 : 1);
    var exact = win >= 0 && (win === 0 ? d0 : d1) === 0;
    var delta = [0, 0];
    if (win >= 0) {
      delta[win] = pot * (exact ? 2 : 1) - (S.w.bet[win] || 0);
      delta[1 - win] = -(S.w.bet[1 - win] || 0);
    }
    return { truth: truth, d: [d0, d1], pot: pot, win: win, exact: exact, delta: delta };
  }

  function renderWReveal() {
    var o = S.w.out, item = wq();
    var box = A.el("div", "dc-in");
    box.appendChild(metaRow(item, '<span class="ac-pill">POT <b>' + o.pot + "</b></span>"));
    box.appendChild(A.el("div", "dc-q", esc(item.q)));

    var t = A.el("div", "dc-truth");
    t.innerHTML = '<div class="dc-truthn">' + A.fmtNum(o.truth) + "</div>" +
      '<div class="dc-truthl">' + esc(item.unit).toUpperCase() + "</div>";
    box.appendChild(t);

    var rows = A.el("div", "dc-wrows");
    var p;
    for (p = 0; p < 2; p++) {
      var won = o.win === p;
      var r = A.el("div", "dc-wrow" + (won ? " win" : ""));
      r.style.setProperty("--who", "var(" + COL[p] + ")");
      var said = S.w.val[p] === null ? "no answer" : A.fmtNum(S.w.val[p]);
      var off = S.w.val[p] === null ? "—"
        : (o.d[p] === 0 ? "spot on" : "out by " + A.fmtNum(Math.round(o.d[p] * 100) / 100));
      var dl = o.delta[p];
      r.innerHTML =
        '<div class="dc-wl"><div class="dc-wn">' + esc(names[p]) + "</div>" +
          '<div class="dc-wd">SAID ' + esc(said) + " · " + esc(off) + "</div></div>" +
        '<div class="dc-wr"><div class="dc-wg ' + (dl > 0 ? "up" : dl < 0 ? "dn" : "") + '">' +
          (dl > 0 ? "+" : "") + dl + "</div>" +
          '<div class="dc-wb">STAKED ' + (S.w.bet[p] || 0) + "</div></div>";
      rows.appendChild(r);
    }
    box.appendChild(rows);

    var v = A.el("div", "dc-verd");
    if (o.win < 0) {
      v.innerHTML = '<span class="st">DEAD HEAT</span> &nbsp;EVERYONE KEEPS THEIR STAKE';
    } else {
      v.innerHTML = '<span class="' + (o.exact ? "st" : "up") + '">' +
        (o.exact ? "EXACT — THE POT DOUBLES" : "TAKES THE POT") + "</span> &nbsp;" +
        esc(names[o.win]).toUpperCase();
    }
    box.appendChild(v);
    if (item.note) box.appendChild(A.el("div", "dc-note", "<i>WHY</i>" + esc(item.note)));

    var go2 = A.el("div", "ac-row dc-go");
    go2.innerHTML = '<button class="ac-btn" id="dc-fin">THE VERDICT ▸</button>';
    box.appendChild(go2);
    stage.appendChild(box);
    go2.querySelector("#dc-fin").onclick = go;
  }

  /* ── the verdict ─────────────────────────────────────────────────────── */

  function categoryTable() {
    var rows = {}, order = [], i, s, a;
    function bump(cat, p, right) {
      var r = rows[cat];
      if (!r) { r = rows[cat] = { asked: [0, 0], right: [0, 0] }; order.push(cat); }
      r.asked[p]++;
      if (right) r.right[p]++;
    }
    for (i = 0; i < NQ; i++) {
      s = steps[i]; a = S.ans[i];
      if (!s || !a) continue;
      bump(ALL[s.i].cat, s.p, a.ok);
      if (a.s) bump(ALL[s.i].cat, a.s.p, a.s.ok);
    }
    return { rows: rows, order: order };
  }

  function renderDone() {
    var t = categoryTable();
    var diff = S.score[0] - S.score[1];
    var hi = diff === 0 ? -1 : (diff > 0 ? 0 : 1);
    var box = A.el("div", "dc-in");

    var f = A.el("div", "dc-final");
    if (hi >= 0) f.style.setProperty("--who", "var(" + COL[hi] + ")");
    f.innerHTML =
      '<div class="dc-fwin">' + (hi < 0 ? "A DRAW" : esc(names[hi]).toUpperCase() + " WINS") + "</div>" +
      '<div class="dc-fby">' + (hi < 0 ? "NOTHING SETTLED" : "BY " + Math.abs(diff) +
        " POINT" + (Math.abs(diff) === 1 ? "" : "S")) + "</div>" +
      '<div class="dc-fsc">' + S.score[0] + " — " + S.score[1] + "</div>" +
      '<p class="tiny dim" style="margin-top:6px">' + esc(names[0]) + " · " + esc(names[1]) + "</p>";
    box.appendChild(f);

    var cats = A.el("div", "dc-cats");
    var html = '<div class="dc-cath">WHO KNEW WHAT</div>';
    t.order.forEach(function (c) {
      var r = t.rows[c], meta = CATS[c] || { label: c, icon: "•" };
      var w0 = r.right[0], w1 = r.right[1];
      html += '<div class="dc-crow"><div class="dc-clab">' + meta.icon + " " + esc(meta.label) +
        "</div>" +
        '<div class="dc-cn a' + (w0 > w1 ? " hi" : "") + '">' + w0 + "/" + r.asked[0] + "</div>" +
        '<div class="dc-cn b' + (w1 > w0 ? " hi" : "") + '">' + w1 + "/" + r.asked[1] + "</div></div>";
    });
    cats.innerHTML = html;
    box.appendChild(cats);
    box.appendChild(A.el("div", "dc-legend",
      "left column " + esc(names[0]) + " · right column " + esc(names[1]) +
      "<br>right answers out of questions put to them"));

    var acts = A.el("div", "ac-row dc-acts");
    acts.innerHTML =
      '<button class="ac-btn" id="dc-re">🥊 REMATCH</button>' +
      '<button class="ac-btn ghost" id="dc-sheet">SCORECARD</button>';
    box.appendChild(acts);
    box.appendChild(A.el("p", "center tiny dim", "A rematch is a friendly — it never touches " +
      "the daily result or the ledger."));
    stage.appendChild(box);

    acts.querySelector("#dc-re").onclick = function () {
      location.href = "?practice=1&r=" + Date.now();
    };
    acts.querySelector("#dc-sheet").onclick = function () { sheet(); };
  }

  /* ── actions ─────────────────────────────────────────────────────────── */

  function start() {
    S.screen = "pass";
    S.si = 0;
    S.stage = "q";
    S.t0 = Date.now();
    A.sfx("key");
    save();
    paint();
  }

  function pick(i) {
    if (S.screen !== "ask") return;
    var item = q(), ok = i === item.ai;
    var a = S.ans[S.si] || (S.ans[S.si] = { pick: null, ok: false, s: null });
    if (stealing()) {
      if (a.s) return;
      a.s = { p: actor(), pick: i, ok: ok };
      if (ok) S.score[actor()] += STEAL_PTS;
    } else {
      if (a.pick !== null) return;
      a.pick = i;
      a.ok = ok;
      if (ok) S.score[actor()] += PTS;
    }
    S.screen = "reveal";
    A.sfx(ok ? "ok" : "miss", S.si % 5);
    save();
    paint();
  }

  // One button drives every forward move, so the whole game is one loop.
  function go() {
    if (S.screen === "pass") { S.screen = "ask"; A.sfx("tick"); save(); return paint(); }
    if (S.screen === "wpass") {
      S.screen = S.w.bet[S.w.turn] === null ? "wbet" : "wask";
      A.sfx("tick");
      save();
      return paint();
    }
    if (S.screen === "reveal") {
      if (!fullReveal()) { S.stage = "steal"; S.screen = "pass"; save(); return paint(); }
      S.si++;
      S.stage = "q";
      if (S.si >= NQ) { S.w.turn = plan.first; S.screen = "wpass"; }
      else S.screen = "pass";
      save();
      return paint();
    }
    if (S.screen === "wreveal") return finish();
  }

  function lockBet(v) {
    var p = S.w.turn;
    S.w.bet[p] = A.clamp(Math.round(v) || 0, 0, S.score[p]);
    S.screen = "wask";
    A.sfx("reveal");
    save();
    paint();
  }

  function submitNum(v) {
    var n = parseNum(v);
    if (n === null) { A.toast("Put a number in", true); A.sfx("bad"); return; }
    var p = S.w.turn;
    S.w.val[p] = n;
    A.sfx("stamp");
    if (S.w.val[1 - p] === null) {
      S.w.turn = 1 - p;
      S.screen = "wpass";
    } else {
      S.w.out = wagerOutcome();
      S.score[0] += S.w.out.delta[0];
      S.score[1] += S.w.out.delta[1];
      S.screen = "wreveal";
    }
    save();
    paint();
  }

  /* ── persistence ─────────────────────────────────────────────────────── */

  function save() {
    if (practice) return;
    A.save(ID, day, {
      v: 1, sig: plan.sig, plan: plan, screen: S.screen, si: S.si, stage: S.stage,
      ans: S.ans, score: S.score, w: S.w, over: S.over, t0: S.t0,
    });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    S = blank();
    if (st && st.plan && st.sig === ALL.length && st.plan.r1 && st.plan.r1.length === R1_N) {
      plan = st.plan;
      makeSteps();
      S.si = A.clamp(+st.si || 0, 0, NQ);
      S.stage = st.stage === "steal" ? "steal" : "q";
      S.ans = st.ans || [];
      S.score = [+(st.score || [])[0] || 0, +(st.score || [])[1] || 0];
      S.w = st.w || S.w;
      S.t0 = +st.t0 || Date.now();
      S.over = !!(st.over || st.done);
      // Never restore straight onto a live question: hand it back through the
      // curtain, so a reload can't show the wrong person somebody's question.
      if (S.over) S.screen = "done";
      else if (st.screen === "title") S.screen = "title";
      else if (String(st.screen).charAt(0) === "w") {
        S.screen = st.screen === "wreveal" ? "wreveal" : "wpass";
      } else S.screen = "pass";
      if (S.screen === "wreveal" && !S.w.out) S.w.out = wagerOutcome();
    }
    paint();
    if (S.over) setTimeout(sheet, 480);
  }

  /* ── the share grid: the round-by-round swing ────────────────────────── */

  function glyphs() {
    var cb = A.settings().colourblind;
    return { hit: cb ? "🟦" : "🟩", steal: cb ? "🟧" : "🟨", miss: "⬛", idle: "⬜" };
  }

  function shareRows() {
    var g = glyphs(), rows = [], p, k, row, si, a, s;

    for (p = 0; p < 2; p++) {
      row = "";
      for (k = 0; k < R1_LADDER.length; k++) {
        si = k * 2 + (p === plan.first ? 0 : 1);
        a = S.ans[si];
        row += !a || a.pick === null ? g.idle : (a.ok ? g.hit : g.miss);
      }
      rows.push("R1 " + tag(p) + " " + row);
    }
    for (p = 0; p < 2; p++) {
      row = "";
      for (k = 0; k < R2_N; k++) {
        si = R1_N + k;
        s = steps[si];
        a = S.ans[si];
        if (!a || a.pick === null) { row += g.idle; continue; }
        if (s.p === p) row += a.ok ? g.hit : g.miss;
        else if (a.s && a.s.p === p) row += a.s.ok ? g.steal : g.miss;
        else row += g.idle;
      }
      rows.push("R2 " + tag(p) + " " + row);
    }
    var o = S.w.out;
    rows.push("R3 " + (!o ? "⬜" : o.win < 0 ? "🤝" : o.exact ? "🎯" : "⚔️") +
      " " + S.score[0] + "-" + S.score[1]);
    return rows;
  }

  /* ── ending ──────────────────────────────────────────────────────────── */

  function normFor(a, b) {
    var total = a + b;
    return total <= 0 ? 50 : A.clamp(Math.round(100 * a / total), 0, 100);
  }

  function finish() {
    if (S.over) { S.screen = "done"; return paint(); }
    S.over = true;
    S.screen = "done";

    var a = S.score[0], b = S.score[1];
    var norm = normFor(a, b);
    var res = a > b ? "W" : a < b ? "L" : "D";
    var rows = shareRows();

    if (!practice) {
      A.finish(ID, day, {
        score: a, norm: norm, won: a > b, detail: a + "-" + b + " " + res,
        bucket: res, shareGrid: rows, durationMs: Date.now() - S.t0,
      });
      save();
    }
    recordLedger(res);

    var hi = res === "W" ? 0 : res === "L" ? 1 : -1;
    if (hi < 0) A.sfx("near");
    else A.sfx(S.w.out && S.w.out.exact ? "perfect" : hi === 0 ? "win" : "david");
    if (hi >= 0) {
      A.confetti(Math.abs(a - b) >= 20 ? 150 : 90, {
        colours: hi === 0 ? ["#ff4fa3", "#ffd1ec", "#b18cff", "#ffd84f"]
                          : ["#4fd8ff", "#7dffa8", "#b18cff", "#ffffff"],
        hearts: 0.12,
      });
    }
    paint();
    setTimeout(sheet, 620);
  }

  function recordLedger(res) {
    var L = ledger();
    if (practice) {
      L.friendlies++;
    } else {
      if (L.days[String(day)]) return;         // already counted this day
      L.days[String(day)] = res;
      if (res === "W") L.wins[0]++;
      else if (res === "L") L.wins[1]++;
      else L.draws++;
    }
    L.opponent = names[1];
    L.last = { day: practice ? null : day, score: [S.score[0], S.score[1]], res: res, at: Date.now() };
    saveLedger(L);
  }

  function shareText() {
    var a = S.score[0], b = S.score[1];
    return "THE DECIDER " + (practice ? "(friendly)" : "#" + day) + " · " +
      names[0] + " " + a + "-" + b + " " + names[1] + "\n" +
      shareRows().join("\n") + "\n" + A.SITE;
  }

  function sheet() {
    var a = S.score[0], b = S.score[1];
    var res = a > b ? "W" : a < b ? "L" : "D";
    var norm = normFor(a, b);
    var t = categoryTable();
    var L = ledger();

    var html = '<p class="center" style="font-size:19px;letter-spacing:2px;color:var(--gold);' +
      'margin:2px 0 10px">' + esc(names[0]) + " " + a + " — " + b + " " + esc(names[1]) + "</p>";

    html += '<div class="dc-cats"><div class="dc-cath">WHO KNEW WHAT</div>';
    t.order.forEach(function (c) {
      var r = t.rows[c], meta = CATS[c] || { label: c, icon: "•" };
      html += '<div class="dc-crow"><div class="dc-clab">' + meta.icon + " " + esc(meta.label) +
        '</div><div class="dc-cn a' + (r.right[0] > r.right[1] ? " hi" : "") + '">' +
        r.right[0] + "/" + r.asked[0] + '</div><div class="dc-cn b' +
        (r.right[1] > r.right[0] ? " hi" : "") + '">' + r.right[1] + "/" + r.asked[1] +
        "</div></div>";
    });
    html += "</div>";

    if (S.w.out) {
      var o = S.w.out;
      html += '<p class="center tiny muted" style="margin-top:10px;line-height:1.8">' +
        "WAGER · pot " + o.pot + (o.win < 0 ? " · dead heat, stakes returned"
          : " · " + esc(names[o.win]) + (o.exact ? " was exact and doubled it" : " took it")) +
        "</p>";
    }

    html += '<p class="center tiny dim" style="margin-top:8px;line-height:1.8">' +
      (practice ? "Friendly — the ledger stands at " : "Head to head: ") +
      "<b>" + esc(names[0]) + " " + L.wins[0] + " · " + esc(names[1]) + " " + L.wins[1] +
      (L.draws ? " · " + L.draws + " drawn" : "") + "</b></p>";

    var m = A.results(ID, practice ? A.PRACTICE : day, {
      title: res === "W" ? esc(names[0]).toUpperCase() + " TAKES IT"
        : res === "L" ? esc(names[1]).toUpperCase() + " TAKES IT" : "HONOURS EVEN",
      lines: [res === "D" ? "a dead heat" : "by " + Math.abs(a - b) + " point" +
        (Math.abs(a - b) === 1 ? "" : "s")],
      extraHTML: html,
      state: { norm: norm, shareGrid: shareRows(), won: a > b },
      shareText: shareText(),
      onReplay: function () { location.href = "?practice=1&r=" + Date.now(); },
    });

    // Own the share text everywhere (the core only uses opts.shareText in practice).
    var sb = m.body.querySelector("#ac-share");
    if (sb) sb.onclick = function () { A.share(shareText()); };
    return m;
  }

  /* ── keyboard ────────────────────────────────────────────────────────── */

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector(".ac-modal.show")) return;
    var el = document.activeElement, tn = el && el.tagName;
    if (tn === "INPUT" || tn === "TEXTAREA" || tn === "SELECT") return;

    if (e.key === "Enter" || e.key === " ") {
      if (S.screen === "title") { e.preventDefault(); return start(); }
      if (S.screen === "pass" || S.screen === "wpass" || S.screen === "reveal" ||
          S.screen === "wreveal") { e.preventDefault(); return go(); }
      if (S.screen === "wbet") { e.preventDefault(); return lockBet(betVal); }
      return;
    }
    if (S.screen === "ask") {
      var i = -1;
      if (/^[1-4]$/.test(e.key)) i = +e.key - 1;
      else if (/^[a-dA-D]$/.test(e.key)) i = LET.indexOf(e.key.toUpperCase());
      if (i >= 0) {
        var a = S.ans[S.si];
        if (stealing() && a && a.pick === i) return;      // that one is crossed out
        e.preventDefault();
        pick(i);
      }
    }
  });

  /* ── register + par + debug hook ─────────────────────────────────────── */

  A.register({
    id: ID, name: "THE DECIDER", tagline: "one device, two people, settle it",
    icon: "🥊", accent: "--hot", family: "versus", parMs: 420000,
    hasArchive: true, hasPractice: true, versus: true, distLabel: "result",
  });
  A.setPar(ID, function () { return PAR; });   // a level contest is par

  // Enough to drive a whole game headlessly from the console.
  window.__DC = {
    state: function () {
      var s = step();
      return {
        screen: S.screen, si: S.si, stage: S.stage, round: s ? s.r : 3,
        actor: actor(), actorName: names[actor()], score: S.score.slice(),
        names: names.slice(), first: plan.first, over: S.over,
        day: day, practice: practice, norm: normFor(S.score[0], S.score[1]),
        wager: { bet: S.w.bet.slice(), val: S.w.val.slice(), turn: S.w.turn, out: S.w.out || null },
      };
    },
    plan: function () {
      return steps.map(function (s, k) {
        return { k: k, r: s.r, p: s.p, name: names[s.p], cat: ALL[s.i].cat,
          diff: ALL[s.i].diff, q: ALL[s.i].q };
      }).concat([{ k: "wager", r: 3, cat: wq().cat, diff: wq().diff, q: wq().q, a: wq().a }]);
    },
    q: function () {
      var item = S.screen.charAt(0) === "w" ? wq() : q();
      if (!item) return null;
      return { q: item.q, a: item.a, opts: item.opts || null, cat: item.cat, diff: item.diff,
        unit: item.unit || null, value: value() };
    },
    go: go,
    pick: pick,
    right: function () { pick(q().ai); return this.state(); },
    wrong: function () { pick((q().ai + 1) % 4); return this.state(); },
    bet: function (n) { lockBet(n); return this.state(); },
    num: function (v) { submitNum(v); return this.state(); },
    sheet: sheet,
    h2h: ledger,
    share: shareRows,
    normFor: normFor,
    /**
     * Play a whole game without touching the screen.
     *   __DC.play({ hit:[0.8,0.55], bet:"half", ans:[+2,-9] })
     * hit = per-player chance of answering correctly (deterministic sequence),
     * bet = "half" | "all" | "none" | a number, ans = per-player wager error.
     */
    play: function (opt) {
      opt = opt || {};
      var hit = opt.hit || [0.75, 0.6];
      var seq = A.rng("dcplay:" + (opt.seed === undefined ? 1 : opt.seed));
      var guard = 0;
      if (S.screen === "title") start();
      while (!S.over && guard++ < 400) {
        if (S.screen === "pass" || S.screen === "wpass" || S.screen === "reveal" ||
            S.screen === "wreveal") { go(); continue; }
        if (S.screen === "ask") {
          if (seq() < hit[actor()]) this.right(); else this.wrong();
          continue;
        }
        if (S.screen === "wbet") {
          var max = S.score[S.w.turn];
          var v = opt.bet === "all" ? max : opt.bet === "none" ? 0
            : typeof opt.bet === "number" ? opt.bet : Math.round(max / 2);
          lockBet(v);
          continue;
        }
        if (S.screen === "wask") {
          var off = (opt.ans || [0, 5])[S.w.turn];
          submitNum(wq().a + (off === undefined ? 0 : off));
          continue;
        }
        break;
      }
      return this.state();
    },
  };
})();
