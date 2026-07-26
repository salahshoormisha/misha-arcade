/* ============================================================================
   ATLAS GYM — the drill room.
   Twelve multiple-choice questions built out of flags, capitals, shapes and
   borders. The thing no quiz site does: it keeps a per-country accuracy record
   and feeds you the ones you keep getting wrong, across every geography game
   in the arcade.

   NORM: percentage correct, with a small bonus for a clean sweep.
   ========================================================================== */
(function () {
  "use strict";

  var ID = "atlas", N = 12;
  var WEAK_KEY = "ag_weak";        // { iso: {seen, wrong} } — shared drill memory
  // Declared up here, not next to build(): `var` initialisers do not hoist, so
  // a later declaration would still be undefined when build() runs.
  var KINDS = ["flag", "capital", "capitalOf", "shape", "borders"];

  var ALL = window.AD_COUNTRIES || [];
  var byIso = {};
  ALL.forEach(function (c) { byIso[c.i] = c; });

  var POOL = ALL.filter(function (c) {
    return c.un === 1 && (window.AD_FLAGS || {})[c.i] && c.cap;
  });

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var qs = [], at = 0, right = 0, answered = [], t0 = Date.now(), locked = false;

  /* ── the weak-spot ledger ────────────────────────────────────────────── */
  function weak() { return A._get(WEAK_KEY, {}); }
  function noteAnswer(iso, ok) {
    var w = weak();
    var e = w[iso] || { seen: 0, wrong: 0 };
    e.seen++; if (!ok) e.wrong++;
    w[iso] = e;
    A._set(WEAK_KEY, w);
  }
  // Countries you get wrong often, hardest first.
  function weakest(n) {
    var w = weak();
    return Object.keys(w)
      .filter(function (i) { return byIso[i] && w[i].wrong > 0; })
      .sort(function (a, b) {
        var ra = w[a].wrong / w[a].seen, rb = w[b].wrong / w[b].seen;
        return rb - ra || w[b].wrong - w[a].wrong;
      })
      .slice(0, n);
  }

  var main = A.mount({
    id: ID, dayN: day,
    help: "<p>Twelve questions across flags, capitals, shapes and borders.</p>" +
      "<p>The gym <b>remembers what you get wrong</b> — here and in the other geography " +
      "cabinets — and puts those countries in front of you again until they stick. " +
      "Get one right and it's stamped in your passport like anywhere else.</p>",
  });

  if (POOL.length < 20) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">Country data hasn\'t loaded yet.</p>';
    return;
  }

  var host = A.el("div"); main.appendChild(host);
  var prog = A.el("div", "prog"); main.appendChild(prog);
  var row = A.el("div", "ac-row"); row.style.marginTop = "12px";
  row.innerHTML = practice ? '<a class="ac-pill" href="./">← TODAY\'S TWELVE</a>'
    : '<a class="ac-pill" href="?practice=1">∞ PRACTICE</a>';
  main.appendChild(row);
  var weakBox = A.el("div", "weak"); main.appendChild(weakBox);

  build();
  restore();

  /* ── question construction ───────────────────────────────────────────── */

  function build() {
    var rand = practice ? A.rng(String(Date.now()) + Math.random()) : A.rngFor(ID, day);
    // Half the questions are drawn from your weak spots (once you have any).
    var focus = weakest(Math.floor(N / 2));
    var rest = A.shuffle(rand, POOL.map(function (c) { return c.i; }))
      .filter(function (i) { return focus.indexOf(i) < 0; });
    var subjects = focus.concat(rest).slice(0, N);
    subjects = A.shuffle(rand, subjects);

    qs = subjects.map(function (iso, k) {
      var c0 = byIso[iso];
      // City-states give themselves away: "which country's capital is
      // Singapore?" is not a question. Same for Monaco, Vatican City, Djibouti…
      var sameName = A.normName(c0.cap || "") === A.normName(c0.n) ||
        A.normName(c0.n).indexOf(A.normName(c0.cap || "zzz")) === 0;
      var kinds = KINDS.filter(function (kd) {
        if (kd === "shape") return window.AD_WORLD && (window.AD_WORLD.rings(iso) || []).length &&
          (c0.area || 0) > 50000;
        if (kd === "borders") return (c0.bord || []).length > 0;
        if (kd === "capital" || kd === "capitalOf") return !sameName;
        return true;
      });
      if (!kinds.length) kinds = ["flag"];
      var kind = kinds[Math.floor(rand() * kinds.length)];
      return makeQ(kind, iso, rand);
    });
  }

  function makeQ(kind, iso, rand) {
    var c = byIso[iso];
    var q = { kind: kind, iso: iso };
    // Decoys from the same region where possible — a quiz whose wrong answers
    // are from another continent teaches nothing.
    function decoys(pickName, n) {
      var same = POOL.filter(function (x) { return x.i !== iso && x.reg === c.reg; });
      var pool = same.length >= n ? same : POOL.filter(function (x) { return x.i !== iso; });
      return A.shuffle(rand, pool).slice(0, n).map(pickName);
    }

    if (kind === "flag") {
      q.ask = "WHOSE FLAG IS THIS?";
      q.flag = iso;
      q.answer = c.n;
      q.opts = [c.n].concat(decoys(function (x) { return x.n; }, 3));
    } else if (kind === "capital") {
      q.ask = "WHAT'S THE CAPITAL OF";
      q.big = c.n.toUpperCase();
      q.answer = c.cap;
      q.opts = [c.cap].concat(decoys(function (x) { return x.cap; }, 3));
    } else if (kind === "capitalOf") {
      q.ask = "WHICH COUNTRY'S CAPITAL IS";
      q.big = String(c.cap).toUpperCase();
      q.answer = c.n;
      q.opts = [c.n].concat(decoys(function (x) { return x.n; }, 3));
    } else if (kind === "shape") {
      q.ask = "WHICH COUNTRY IS THIS?";
      q.shape = iso;
      q.answer = c.n;
      q.opts = [c.n].concat(decoys(function (x) { return x.n; }, 3));
    } else {
      var n = (c.bord || []).length;
      q.ask = "HOW MANY COUNTRIES DOES IT BORDER?";
      q.big = c.n.toUpperCase();
      q.answer = String(n);
      var set = {}; set[n] = 1;
      var alts = [];
      var tries = 0;
      while (alts.length < 3 && tries++ < 40) {
        var v = Math.max(0, n + (Math.floor(rand() * 7) - 3));
        if (!set[v]) { set[v] = 1; alts.push(String(v)); }
      }
      q.opts = [String(n)].concat(alts);
    }
    q.opts = A.shuffle(rand, q.opts.filter(function (v, i, a) { return v && a.indexOf(v) === i; }));
    return q;
  }

  /* ── rendering ───────────────────────────────────────────────────────── */

  function render() {
    var q = qs[at];
    if (!q) return finish();
    A.setSub((practice ? "PRACTICE" : "DAY " + day) + " · QUESTION " + (at + 1) + " OF " + qs.length);

    host.innerHTML = '<div class="prompt"><div class="q">' + A.esc(q.ask) + "</div>" +
      (q.big ? '<div class="big">' + A.esc(q.big) + "</div>" : "") +
      (q.flag ? '<img id="qflag" alt="A national flag" src="' + A.rootPath() + "core/data/flags/" + q.flag + '.svg">' : "") +
      (q.shape ? '<canvas id="qshape" role="img" aria-label="The silhouette of a country"></canvas>' : "") +
      '</div><div class="opts"></div>';

    // A missing flag file must not leave a broken-image icon sitting in the
    // middle of the question. Swap in a labelled placeholder instead.
    var fim = document.getElementById("qflag");
    if (fim) {
      fim.onerror = function () {
        var ph = A.el("div", "qflag-miss", "flag artwork unavailable");
        ph.id = "qflag-miss";
        fim.replaceWith(ph);
      };
    }

    if (q.shape) {
      silhouette(document.getElementById("qshape"), q.shape,
        { fill: "#f5f2f8", stroke: "rgba(255,255,255,.22)", lw: 1.2, pad: 12 });
    }

    var opts = host.querySelector(".opts");
    q.opts.forEach(function (o) {
      var b = A.el("button", null, A.esc(o));
      b.onclick = function () { answer(o, b); };
      opts.appendChild(b);
    });

    prog.innerHTML = "";
    for (var i = 0; i < qs.length; i++) {
      var el = A.el("i");
      if (answered[i] !== undefined) el.className = answered[i] ? "ok" : "no";
      prog.appendChild(el);
    }
    renderWeak();
  }

  function renderWeak() {
    var w = weakest(4);
    weakBox.innerHTML = w.length
      ? "<em>you keep missing</em><br>" +
        w.map(function (i) { return "<b>" + A.esc(byIso[i].n) + "</b>"; }).join(", ") +
        " — they'll keep coming back"
      : "";
  }

  function answer(choice, btn) {
    if (locked) return;
    locked = true;
    var q = qs[at];
    var ok = choice === q.answer;
    answered[at] = ok;
    if (ok) { right++; A.sfx("ok", at); btn.classList.add("right"); A.stamp(q.iso, ID); }
    else {
      A.sfx("bad"); btn.classList.add("wrong");
      A.$$(".opts button", host).forEach(function (b) {
        if (b.textContent === q.answer) b.classList.add("right");
      });
    }
    noteAnswer(q.iso, ok);
    A.$$(".opts button", host).forEach(function (b) { b.disabled = true; });
    for (var i = 0; i < qs.length; i++) {
      if (answered[i] !== undefined) prog.children[i].className = answered[i] ? "ok" : "no";
    }
    save();
    setTimeout(function () { locked = false; at++; render(); }, ok ? 460 : 900);
  }

  /* ── persistence ─────────────────────────────────────────────────────── */

  // `answered` is the single source of truth: it holds one entry per question
  // asked, in order. `at` and `right` are derived from it on restore, which is
  // what stops a reload from re-serving the question you just answered (save()
  // runs before the 460 ms reveal bumps `at`, so the stored `at` is one behind)
  // and from double-counting it — that could push `right` past the question
  // count and print "13 of 12 right" on the result sheet.
  function save() { if (!practice) A.save(ID, day, { at: answered.length, right: right, answered: answered }); }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st && !st.done && st.answered && st.answered.length) {
      answered = st.answered.slice(0, qs.length).map(Boolean);
      at = answered.length;
      right = answered.filter(function (x) { return x; }).length;
    }
    if (st && st.done) {
      host.innerHTML = "";
      prog.innerHTML = "";
      setTimeout(function () {
        A.results(ID, day, { title: "ALREADY DRILLED", state: st });
      }, 220);
      return;
    }
    render();
  }

  /* ── ending ──────────────────────────────────────────────────────────── */

  function finish() {
    // Count from `answered`, never from the running tally — see save()/restore().
    right = answered.filter(function (x) { return x; }).length;
    A.setSub(A.subLine({ dayN: day }));
    var pct = A.clamp(Math.round(100 * right / qs.length), 0, 100);
    var norm = A.clamp(right === qs.length ? 100 : Math.round(pct * 0.92), 0, 100);
    var grid = [];
    var line = "";
    answered.forEach(function (ok, i) {
      line += ok ? "🟩" : "🟥";
      if ((i + 1) % 6 === 0) { grid.push(line); line = ""; }
    });
    if (line) grid.push(line);

    var stamps = [];
    qs.forEach(function (q, i) { if (answered[i]) stamps.push(q.iso); });

    if (!practice) {
      A.finish(ID, day, {
        score: right, norm: norm, won: right >= Math.ceil(qs.length * 0.6),
        detail: right + "/" + qs.length,
        bucket: pct >= 100 ? "12/12" : pct >= 83 ? "10-11" : pct >= 66 ? "8-9" : pct >= 50 ? "6-7" : "<6",
        shareGrid: grid, durationMs: Date.now() - t0, stamps: stamps,
      });
    }
    if (right === qs.length) { A.sfx("perfect"); A.confetti(140); }
    else if (right >= qs.length * 0.75) { A.sfx("win"); A.confetti(60); }
    else A.sfx("lose");

    host.innerHTML = ""; prog.innerHTML = "";
    var w = weakest(5);
    A.results(ID, practice ? A.PRACTICE : day, {
      title: right === qs.length ? "FLAWLESS" : right >= 9 ? "SHARP" : right >= 6 ? "PASSABLE" : "BACK TO THE GYM",
      lines: [right + " of " + qs.length + " right"],
      extraHTML: w.length ? '<p class="center tiny" style="color:var(--amber);margin-top:var(--sp-2)">' +
        "next session will drill: " + A.esc(w.map(function (i) { return byIso[i].n; }).join(", ")) + "</p>" : "",
      state: { norm: norm, shareGrid: grid, won: right >= Math.ceil(qs.length * 0.6) },
      shareText: "ATLAS GYM (practice) " + right + "/" + qs.length + "\n" + grid.join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  window.__AT = {
    qs: function () { return qs; },
    answerAll: function (correct) {
      var guard = 0;
      (function step() {
        if (at >= qs.length || guard++ > 40) return;
        var q = qs[at];
        var pick = correct ? q.answer : q.opts.filter(function (o) { return o !== q.answer; })[0];
        var btns = A.$$(".opts button", host);
        for (var i = 0; i < btns.length; i++) if (btns[i].textContent === pick) { btns[i].click(); break; }
        setTimeout(step, 60);
      })();
    },
    state: function () { return { at: at, right: right, n: qs.length }; },
  };
})();
