/* ============================================================================
   FOODGUESSR — three dishes a day, guess where each one is from.

   Verified mechanics from the real thing (_build/RESEARCH.md):
     · 3 rounds a day, 5 guesses per round, 5,000 points a round, 15,000 total
     · the dish's DESCRIPTION is visible from the start; its NAME unlocks after
       two wrong guesses — the name is a hint, not the question
     · wrong guesses give a warmth word and a compass bearing computed from
       country centres, so a miss teaches you geography rather than cooking
     · a dish may belong to more than one country; any of them counts

   Better than the original: it works with no photograph at all (the
   description is written to be guessable on its own), the "why this is
   national" note is shown afterwards, and correct answers stamp the passport.

   NORM = round(100 * total / 15000).
   ========================================================================== */
(function () {
  "use strict";

  var ID = "foodguessr", ROUNDS = 3, MAX_GUESS = 5, PER_ROUND = 5000;

  var FOOD = window.AD_FOOD || {};
  var ALL = window.AD_COUNTRIES || [];
  var byIso = {};
  ALL.forEach(function (c) { byIso[c.i] = c; });

  var COUNTRIES = (FOOD.countries || []).filter(function (c) {
    return byIso[c.i] && (c.dishes || []).length && (byIso[c.i].capll || byIso[c.i].ll);
  });

  function at(iso) { var c = byIso[iso]; return c && (c.capll || c.ll); }

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var rounds = [], r = 0, guesses = [], scores = [], over = false, t0 = Date.now();
  var picker, host;

  /* ── build the day's three rounds ─────────────────────────────────────── */
  function build() {
    var rand = practice ? A.rng(String(Date.now()) + Math.random()) : A.rngFor(ID, day);
    // one dish from each of three different countries, spread across regions
    var pool = A.shuffle(rand, COUNTRIES.slice());
    var picked = [], seenRegion = {};
    pool.forEach(function (c) {
      if (picked.length >= ROUNDS) return;
      var reg = (byIso[c.i] || {}).reg || "?";
      if (seenRegion[reg] && picked.length < ROUNDS - 1) return;   // spread it out
      seenRegion[reg] = 1;
      picked.push(c);
    });
    while (picked.length < ROUNDS && pool.length) picked.push(pool[picked.length]);
    return picked.map(function (c) {
      var d = A.pick(rand, c.dishes);
      return { iso: c.i, dish: d, alt: d.also || [] };
    });
  }

  var main = A.mount({
    id: ID, dayN: day,
    help: "<p>Three dishes, three countries. You get <b>five guesses</b> a round and " +
      "<b>5,000 points</b> if you nail it first time — a thousand less for each guess after.</p>" +
      "<ul><li>The description is there from the start. The dish's <b>name</b> unlocks after two " +
      "wrong guesses, because the name is half the answer.</li>" +
      "<li>A wrong guess tells you how <b>warm</b> you are and points you the right way.</li>" +
      "<li>Some dishes belong to more than one country. Any of them counts.</li>" +
      "<li>Get it right and the country is stamped in your passport.</li></ul>",
  });

  if (COUNTRIES.length < 6) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">Food data hasn\'t finished loading yet — ' +
      "try again in a minute.</p>";
    return;
  }

  rounds = build();
  host = A.el("div"); main.appendChild(host);

  var pickHost = A.el("div"); pickHost.style.marginTop = "14px"; main.appendChild(pickHost);
  picker = A.picker(pickHost, { onPick: guess, placeholder: "where's it from?" });

  var row = A.el("div", "ac-row"); row.style.marginTop = "10px";
  row.innerHTML = practice ? '<a class="ac-pill" href="./">← TODAY\'S THREE</a>'
    : '<a class="ac-pill" href="?practice=1">∞ PRACTICE</a>';
  main.appendChild(row);

  var list = A.el("div", "guesses"); main.appendChild(list);

  restore();

  /* ── play ────────────────────────────────────────────────────────────── */

  function cur() { return rounds[r]; }
  function myGuesses() { return guesses[r] || (guesses[r] = []); }

  function correctSet() {
    var c = cur();
    return [c.iso].concat(c.alt || []);
  }

  function guess(iso) {
    if (over) return;
    var gs = myGuesses();
    if (gs.indexOf(iso) >= 0) return A.toast("Already guessed that one", true);
    gs.push(iso);
    var right = correctSet().indexOf(iso) >= 0;
    if (right) {
      scores[r] = Math.max(0, PER_ROUND - (gs.length - 1) * 1000);
      A.sfx("win");
      A.stamp(cur().iso, ID);
      save();
      render();
      setTimeout(nextRound, 1500);
      return;
    }
    if (gs.length >= MAX_GUESS) {
      scores[r] = 0;
      A.sfx("lose");
      save(); render();
      setTimeout(nextRound, 2200);
      return;
    }
    A.sfx("miss");
    save(); render();
  }

  function nextRound() {
    if (r >= ROUNDS - 1) return end();
    r++;
    picker.clear();
    picker.setExclude([]);
    render();
  }

  /* ── warmth ──────────────────────────────────────────────────────────── */

  function warmth(iso) {
    var a = at(iso), b = at(cur().iso);
    if (!a || !b) return { txt: "—", km: null, bearing: 0 };
    var km = A.haversine(a[0], a[1], b[0], b[1]);
    var brg = A.bearing(a[0], a[1], b[0], b[1]);
    var borders = (byIso[iso].bord || []).indexOf(cur().iso) >= 0;
    var txt = borders ? "🔥🔥🔥 shares a border"
      : km < 1200 ? "🔥🔥 very warm"
      : km < 3000 ? "🔥 warm"
      : km < 6000 ? "🌡️ lukewarm"
      : km < 9500 ? "❄️ cold" : "🧊 freezing";
    return { txt: txt, km: km, bearing: brg };
  }

  /* ── rendering ───────────────────────────────────────────────────────── */

  function render() {
    var c = cur(), gs = myGuesses();
    var solved = gs.length && correctSet().indexOf(gs[gs.length - 1]) >= 0;
    var dead = !solved && gs.length >= MAX_GUESS;
    var nameShown = gs.length >= 2 || solved || dead || over;

    A.setSub((practice ? "PRACTICE" : "DAY " + day) + " · ROUND " + (r + 1) + " OF " + ROUNDS);

    var h = '<div class="round">ROUND ' + (r + 1) + " · " +
      (solved || dead ? "" : (MAX_GUESS - gs.length) + " GUESSES LEFT · ") +
      "WORTH " + Math.max(0, PER_ROUND - gs.length * 1000).toLocaleString() + "</div>";

    // Photos live on Wikimedia, so a 404 (or simply being offline) is routine.
    // Both the no-photo and the failed-photo cases render the SAME placeholder,
    // which keeps the 4:3 box and centres its contents — see #dish.noimg.
    if (c.dish.img) {
      h += '<img id="dish" alt="A dish, country hidden" loading="lazy" src="' +
        A.esc(c.dish.img) + '">';
    } else {
      h += noPhoto();
    }

    h += nameShown
      ? '<div class="dname">' + A.esc(c.dish.name) + "</div>"
      : '<div class="dname hidden">the name unlocks after two guesses</div>';
    h += '<div class="ddesc">' + A.esc(c.dish.desc || "") + "</div>";

    if ((solved || dead) && c.dish.why) h += '<div class="why">' + A.esc(c.dish.why) + "</div>";
    if (solved || dead) {
      h += '<p class="verdict" style="color:' + (solved ? "var(--ok)" : "var(--bad)") + '">' +
        (solved ? "✓ " : "✕ ") + A.esc(byIso[c.iso].n) + "</p>";
      h += '<div class="scoreline"><b>' + (scores[r] || 0).toLocaleString() + "</b> / " +
        PER_ROUND.toLocaleString() + "</div>";
    }

    h += '<div class="pips"></div>';
    host.innerHTML = h;

    var dishImg = host.querySelector("img#dish");
    if (dishImg) {
      dishImg.onerror = function () {
        var d = A.el("div");
        d.innerHTML = noPhoto();
        dishImg.replaceWith(d.firstChild);
      };
    }

    var pips = host.querySelector(".pips");
    for (var i = 0; i < MAX_GUESS; i++) {
      var el = A.el("i");
      if (i < gs.length) el.className = (correctSet().indexOf(gs[i]) >= 0) ? "won" : "used";
      pips.appendChild(el);
    }

    // guess trail
    list.innerHTML = "";
    gs.forEach(function (iso) {
      var right = correctSet().indexOf(iso) >= 0;
      var w = warmth(iso);
      var el = A.el("div", "gr" + (right ? " win" : ""));
      el.innerHTML = '<img alt="" src="' + A.rootPath() + "core/data/flags/" + iso +
        '.svg" onerror="this.style.visibility=\'hidden\'">' +
        '<span class="nm">' + A.esc(byIso[iso].n) + "</span>" +
        (right ? '<span class="warm">🎉 correct</span>'
          : '<span class="warm">' + w.txt + "</span><span class='ar'>" + A.arrow(w.bearing) + "</span>");
      list.appendChild(el);
    });

    picker.setExclude(gs);
    picker.disable(solved || dead || over);
  }

  /* ── persistence ─────────────────────────────────────────────────────── */

  function save() { if (!practice) A.save(ID, day, { r: r, guesses: guesses, scores: scores }); }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    // Restore the board whether or not the day is finished. Skipping this on a
    // finished day left a pristine "ROUND 1 · 5 GUESSES LEFT · WORTH 5,000"
    // sitting behind the result sheet, with no guess trail and the wrong dish.
    if (st) {
      r = A.clamp(st.r || 0, 0, ROUNDS - 1);
      guesses = st.guesses || [];
      scores = st.scores || [];
    }
    if (st && st.done) {
      over = true;
      render();
      picker.disable(true);
      A.setSub(A.subLine({ dayN: day }));
      setTimeout(function () { A.results(ID, day, { title: "ALREADY EATEN", state: st }); }, 240);
      return;
    }
    render();
  }

  // The one placeholder used for "no photo recorded" and "photo wouldn't load".
  function noPhoto() {
    return '<div id="dish" class="noimg" role="img" aria-label="No photograph for this dish">' +
      '<span class="glyph">\uD83C\uDF7D\uFE0F</span>' +
      '<span class="say">no photo — go on the description</span></div>';
  }

  /* ── ending ──────────────────────────────────────────────────────────── */

  function end() {
    over = true;
    picker.disable(true);
    A.setSub(A.subLine({ dayN: practice ? A.PRACTICE : day }));
    var total = scores.reduce(function (a, b) { return a + (b || 0); }, 0);
    var norm = A.clamp(Math.round(100 * total / (PER_ROUND * ROUNDS)), 0, 100);

    // moon-phase bar per round, like the original's share
    var MOON = ["🌑", "🌘", "🌗", "🌖", "🌕"];
    var grid = rounds.map(function (rd, i) {
      var f = (scores[i] || 0) / PER_ROUND;
      var n = Math.max(0, Math.min(4, Math.round(f * 4)));
      return MOON[n].repeat(1) + " " + (scores[i] || 0).toLocaleString().padStart(5, " ") +
        "  " + (byIso[rd.iso] ? byIso[rd.iso].n : "");
    });

    var stamps = [];
    rounds.forEach(function (rd, i) { if ((scores[i] || 0) > 0) stamps.push(rd.iso); });

    if (!practice) {
      A.finish(ID, day, {
        score: total, norm: norm, won: total > 0,
        detail: total.toLocaleString() + " pts",
        bucket: norm >= 90 ? "90+" : norm >= 70 ? "70-89" : norm >= 50 ? "50-69" : norm >= 25 ? "25-49" : "<25",
        shareGrid: grid, durationMs: Date.now() - t0, stamps: stamps,
      });
    } else { stamps.forEach(function (s) { A.stamp(s, ID); }); }

    if (norm >= 80) { A.sfx("perfect"); A.confetti(130); }
    else if (norm >= 50) { A.sfx("win"); A.confetti(60); }

    A.results(ID, practice ? A.PRACTICE : day, {
      title: norm >= 90 ? "GASTRONOME" : norm >= 70 ? "WELL FED" : norm >= 40 ? "PECKISH" : "STILL HUNGRY",
      lines: [total.toLocaleString() + " / " + (PER_ROUND * ROUNDS).toLocaleString()],
      state: { norm: norm, shareGrid: grid, won: total > 0 },
      shareText: "FOODGUESSR (practice) " + total.toLocaleString() + "\n" + grid.join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  window.__FG = {
    rounds: function () { return rounds.map(function (x) { return { iso: x.iso, dish: x.dish.name }; }); },
    guess: guess,
    state: function () { return { r: r, guesses: guesses, scores: scores, over: over }; },
  };
})();
