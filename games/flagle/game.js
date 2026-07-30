/* ============================================================================
   FLAGLE — guess the country from a flag revealed one tile at a time.
   Built on the shape of games/wordish/game.js (the reference implementation).

   Better than the original in four ways:
     · a real archive + unlimited practice
     · a spendable hint that describes what is ON the flag, from the shipped
       feature index rather than a vague nudge
     · correct answers stamp the ARCADE PASSPORT
     · the same flag for both players on the same day, with no server

   NORM: solved in 1..6 → 100, 92, 80, 68, 55, 42; lost → 10; hint costs 8.
   ========================================================================== */
(function () {
  "use strict";

  var ID = "flagle", TRIES = 6, COLS = 3, ROWS = 2;
  var NORM = [0, 100, 92, 80, 68, 55, 42];

  /* ── two pools, not one ─────────────────────────────────────────────────
     GUESS is everything you may type: any place with a flag and a location,
     territories included — the original guesses against the whole ISO 3166-1
     list, and using one pool for both jobs is why typing Taiwan, Kosovo,
     Greenland or Hong Kong used to return nothing at all.
     POOL is the narrower set allowed to BE the answer: inhabited places only,
     so a day is never Bouvet Island or the French Southern Territories. */
  var ALL = window.AD_COUNTRIES || [];
  var byIso = {};
  ALL.forEach(function (c) { byIso[c.i] = c; });
  var hasFlag = function (c) { return (window.AD_FLAGS || {})[c.i] && (c.capll || c.ll); };
  var GUESS = ALL.filter(hasFlag).map(function (c) { return c.i; });
  var POOL = ALL.filter(function (c) {
    return hasFlag(c) && (c.un === 1 || (c.pop || 0) >= 10000);
  }).map(function (c) { return c.i; });

  function at(c) { return c.capll || c.ll; }          // [lat, lon]

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var answer, guesses = [], over = false, hinted = false, t0 = Date.now();
  var cvs, img = null, picker, order;

  function pickAnswer() {
    if (practice) return A.pick(A.rng(String(Date.now()) + Math.random()), POOL);
    return POOL[A.dailyIndex(ID, day, POOL.length)];
  }

  /* ── boot ────────────────────────────────────────────────────────────── */
  var main = A.mount({
    id: ID, dayN: day,
    help: "<p>A flag behind six tiles, <b>all of them shut</b>. Every guess opens one — and tells " +
      "you <b>how far away</b> you are and <b>which way</b> to go.</p>" +
      "<ul><li>Six guesses, six tiles, one for one. You never see the whole flag until it's over.</li>" +
      "<li><b>Hard mode always.</b> The suggestions list shows no flag thumbnails, so you can't " +
      "eye-match your way to the answer.</li>" +
      "<li>Win and you unlock <b>five bonus rounds</b> on the same country — shape, capital, " +
      "neighbours, tongue &amp; coin, and how many people live there.</li>" +
      "<li><b>What's on it?</b> describes what's actually on the flag — costs 8 points, not a guess.</li>" +
      "<li>Every country you get right is <b>stamped in your passport</b>.</li>" +
      "<li>Guess any country <i>or territory</i> — Taiwan, Kosovo, Greenland and Hong Kong all " +
      "count, and <i>USA</i>, <i>Holland</i>, <i>Persia</i> and <i>Burma</i> all work.</li></ul>",
  });

  if (!POOL.length) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">Flag data hasn\'t loaded. ' +
      "Check core/data/flags.js and countries.js.</p>";
    return;
  }

  answer = pickAnswer();

  var wrap = A.el("div"); wrap.id = "flagwrap";
  cvs = A.el("canvas"); cvs.id = "flag";
  cvs.setAttribute("role", "img");
  cvs.setAttribute("aria-label", "A partially revealed national flag");
  wrap.appendChild(cvs);
  main.appendChild(wrap);

  var statusEl = A.el("div", "fl-status");
  main.appendChild(statusEl);

  var tries = A.el("div", "tries");
  main.appendChild(tries);

  var pickHost = A.el("div"); pickHost.style.marginTop = "14px";
  main.appendChild(pickHost);
  // flags:false is the original's HARD MODE, and it is the only honest setting
  // for a game about recognising flags. With thumbnails in the suggestions you
  // could scroll the dropdown and eye-match the tiles on screen.
  picker = A.picker(pickHost, {
    pool: GUESS, flags: false, onPick: guess, placeholder: "which country or territory?",
  });

  var row = A.el("div", "ac-row"); row.style.marginTop = "10px";
  row.innerHTML = '<button class="ac-pill" id="hint">WHAT\'S ON IT?</button>' +
    (practice ? '<a class="ac-pill" href="./">← TODAY\'S FLAG</a>'
      : '<a class="ac-pill" href="?practice=1">∞ PRACTICE</a>');
  main.appendChild(row);

  var hintBox = A.el("div", "hintbox"); main.appendChild(hintBox);
  var list = A.el("div", "guesses"); main.appendChild(list);

  row.querySelector("#hint").onclick = doHint;

  // Tile reveal order is seeded, so both players uncover the same corners.
  order = A.shuffle(A.rng(ID + ":order:" + (practice ? answer : day)), [0, 1, 2, 3, 4, 5]);

  A.flagImg(answer).then(function (im) { img = im; draw(); })
    .catch(function () { A.toast("Couldn't load that flag", true); });

  restore();

  /* ── play ────────────────────────────────────────────────────────────── */

  function guess(iso) {
    if (over) return;
    if (guesses.indexOf(iso) >= 0) return A.toast("Already guessed that one", true);
    guesses.push(iso);
    var won = iso === answer;
    draw();
    renderGuesses();
    save();
    if (won) { A.sfx("win"); end(true); }
    else if (guesses.length >= TRIES) { A.sfx("lose"); end(false); }
    else { A.sfx("miss"); }
  }

  function doHint(quiet) {
    if (over || hinted) return;
    hinted = true;
    var m = A.flagMeta(answer) || {};
    var bits = [];
    if (m.colours && m.colours.length) bits.push(m.colours.slice(0, 4).join(", "));
    if (m.features && m.features.length) {
      bits.push(m.features.slice(0, 3).map(A.flagFeatureLabel).join(", "));
    }
    hintBox.innerHTML = bits.length
      ? "<b>on the flag</b>" + A.esc(bits.join(" · ")) + ' <span class="dim">(−8 pts)</span>'
      : "<b>on the flag</b>no extra detail recorded for this one — no charge";
    if (!bits.length) hinted = false;
    if (quiet) return;              // replaying it on restore would re-chime
    A.sfx("reveal");
    save();
  }

  /* ── drawing ─────────────────────────────────────────────────────────── */

  function draw() {
    if (!img) return;
    var meta = A.flagMeta(answer) || {};
    var ar = meta.ar || 1.6;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = cvs.clientWidth || 360, h = Math.round(w / ar);
    cvs.width = w * dpr; cvs.height = h * dpr;
    cvs.style.height = h + "px";
    var g = cvs.getContext("2d");
    g.save(); g.scale(dpr, dpr);
    g.clearRect(0, 0, w, h);
    A.flagDraw(g, img, 0, 0, w, h, "cover");

    // Cover the tiles that haven't been earned yet. Every guess flips exactly
    // ONE tile, including the winning one, so before the first guess the flag
    // is completely hidden and you never see all six until the game is over.
    // Handing out a free tile up front (guesses.length + 1) was most of why
    // this played far too easily.
    var shown = over ? 6 : Math.min(6, guesses.length);
    var tw = w / COLS, th = h / ROWS;
    for (var k = 0; k < 6; k++) {
      var idx = order.indexOf(k);
      if (idx < shown) continue;
      var cx = (k % COLS) * tw, cy = Math.floor(k / COLS) * th;
      // A plain raised surface, so an unrevealed tile reads as a lid over the
      // flag rather than as a dark part of the flag itself. (--s2 / --hair.)
      g.fillStyle = "#1b1829";
      g.fillRect(cx, cy, tw, th);
      g.strokeStyle = "rgba(255,255,255,.075)"; g.lineWidth = 1;
      g.strokeRect(cx + .5, cy + .5, tw - 1, th - 1);
    }
    g.restore();

    tries.innerHTML = "";
    for (var t = 0; t < TRIES; t++) {
      var i = A.el("i");
      if (t < guesses.length) i.className = guesses[t] === answer ? "won" : "used";
      tries.appendChild(i);
    }

    var left = TRIES - guesses.length;
    statusEl.textContent = over ? ""
      : guesses.length === 0 ? "Make a guess to reveal the first tile"
        : left + (left === 1 ? " guess left" : " guesses left");
  }

  function renderGuesses() {
    list.innerHTML = "";
    guesses.forEach(function (iso) {
      var c = byIso[iso], won = iso === answer;
      var d = A.haversine(at(c)[0], at(c)[1], at(byIso[answer])[0], at(byIso[answer])[1]);
      var b = A.bearing(at(c)[0], at(c)[1], at(byIso[answer])[0], at(byIso[answer])[1]);
      // A miss must never print 100%. Syria→Lebanon is 84 km and Congo→DR Congo
      // is 7 km, both of which round to 100 on the proximity curve — a red row
      // reading "100%" looks like the game got the answer wrong.
      var pc = won ? 100 : Math.min(99, Math.round(A.geo.prox(d) * 100));
      var el = A.el("div", "gr" + (won ? " win" : ""));
      el.innerHTML =
        '<img alt="" src="' + A.rootPath() + "core/data/flags/" + iso + '.svg" onerror="this.style.visibility=\'hidden\'">' +
        '<span class="nm">' + A.esc(c.n) + "</span>" +
        (won ? '<span class="ar">✓</span><span class="pc">100%</span>'
          : '<span class="km">' + A.geo.km(d) + '</span><span class="ar">' + A.arrow(b) +
            '</span><span class="pc">' + pc + "%</span>");
      list.appendChild(el);
    });
  }

  /* ── persistence ─────────────────────────────────────────────────────── */

  function save() {
    if (practice) return;
    A.save(ID, day, { guesses: guesses, hinted: hinted });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st) {
      guesses = st.guesses || [];
      hinted = !!st.hinted;
      if (hinted) doHintSilent();
    }
    renderGuesses();
    draw();
    if (st && st.done) {
      over = true;
      picker.disable(true);
      draw();
      // pass the stored grid/score through — the sheet must look identical on a
      // reload, not fall back to an empty share block.
      setTimeout(function () { sheet(st.won, st.shareGrid, st.norm); }, 240);
    }
  }
  function doHintSilent() { hinted = false; doHint(true); }

  /* ── bonus rounds ────────────────────────────────────────────────────────
     Winning unlocks five short rounds about the same country, the way the
     original does. They add a line to the share and a tally to the sheet, but
     deliberately DO NOT move `norm` — the 0-100 has to stay comparable across
     every cabinet for the league, and a lucky bonus streak shouldn't outweigh
     a sharp flag read.

     The original's coat-of-arms round is replaced by CAPITAL and TONGUE: we
     ship no emblem artwork, and faking it would be worse than using the real
     data we already hold for every country. Every round below is built from
     countries.js / flags.js / world.js — nothing here is invented. */

  var bonusHost = null;
  // Canvas fillStyle can't read a CSS custom property, so resolve it once.
  var INK = (getComputedStyle(document.documentElement)
    .getPropertyValue("--ink") || "").trim() || "#f5f2f8";

  // Asks the real render path, so "can we draw this?" can never disagree with
  // what the round actually shows.
  function hasShape(iso) {
    if (!hasShape._c) { hasShape._c = A.el("canvas"); hasShape._c.width = hasShape._c.height = 8; }
    try { return A.silhouette(hasShape._c, iso, { pad: 0 }) !== false; }
    catch (e) { return false; }
  }

  // Decoys from as close to home as possible — same subregion, then continent,
  // then anywhere. A Baltic answer offered three Pacific decoys would give
  // itself away on geography alone.
  function peers(rand, n, ok) {
    var c = byIso[answer], out = [];
    [function (i) { return byIso[i].sub === c.sub; },
     function (i) { return byIso[i].reg === c.reg; },
     function () { return true; }].forEach(function (scope) {
      if (out.length >= n) return;
      var cand = POOL.filter(function (i) {
        return i !== answer && out.indexOf(i) < 0 && byIso[i] && scope(i) && (!ok || ok(i));
      });
      out = out.concat(A.shuffle(rand, cand).slice(0, n - out.length));
    });
    return out;
  }

  var POP_BANDS = [
    [50e3, "under 50 thousand"], [500e3, "50 thousand to half a million"],
    [1e6, "half a million to a million"], [3e6, "1 to 3 million"],
    [8e6, "3 to 8 million"], [25e6, "8 to 25 million"],
    [60e6, "25 to 60 million"], [150e6, "60 to 150 million"],
    [Infinity, "over 150 million"],
  ];
  function popBand(p) {
    for (var k = 0; k < POP_BANDS.length; k++) if (p < POP_BANDS[k][0]) return k;
    return POP_BANDS.length - 1;
  }

  function buildRounds() {
    var rand = A.rng(ID + ":bonus:" + answer + ":" + (practice ? "x" : day));
    var c = byIso[answer], FL = window.AD_FLAGS || {}, out = [];

    // 1 · SHAPE — four outlines, one of them the country you just named.
    if (hasShape(answer)) {
      var sp = peers(rand, 3, hasShape);
      if (sp.length === 3) out.push({
        id: "shape", label: "SHAPE", icon: "🗺️", tries: 2, kind: "shape",
        ask: "Which outline is " + c.n + "?",
        opts: A.shuffle(rand, sp.concat([answer])).map(function (i) {
          return { iso: i, right: i === answer };
        }),
      });
    }

    // 2 · CAPITAL — four cities from the same part of the world.
    if (c.cap) {
      var cp = peers(rand, 3, function (i) { return byIso[i].cap && byIso[i].cap !== c.cap; });
      if (cp.length === 3) out.push({
        id: "capital", label: "CAPITAL", icon: "🏛️", tries: 2, kind: "text",
        ask: "What is the capital of " + c.n + "?",
        opts: A.shuffle(rand, cp.map(function (i) { return { text: byIso[i].cap }; })
          .concat([{ text: c.cap, right: true }])),
      });
    }

    // 3 · NEIGHBOURS — eight flags, one of which really does share a border.
    //     Islands have no land border, so they simply skip this round.
    var bord = (c.bord || []).filter(function (i) { return byIso[i] && FL[i]; });
    if (bord.length) {
      var wrong = peers(rand, 7, function (i) { return bord.indexOf(i) < 0 && FL[i]; });
      if (wrong.length >= 5) out.push({
        id: "border", label: "NEIGHBOURS", icon: "🧭", tries: 3, kind: "flag",
        ask: "Which of these shares a land border with " + c.n + "?",
        opts: A.shuffle(rand, wrong.map(function (i) { return { iso: i }; })
          .concat([{ iso: A.pick(rand, bord), right: true }])),
        note: c.n + " borders " + bord.map(function (i) { return byIso[i].n; }).join(", ") + ".",
      });
    }

    // 4 · TONGUE and 5 · COIN — one shot each, like the original's pair.
    [["tongue", "TONGUE", "🗣️", "lang", "Which language is spoken in "],
     ["coin", "COIN", "🪙", "cur", "What do they spend in "]].forEach(function (spec) {
      var mine = (c[spec[3]] || [])[0];
      if (!mine) return;
      var seen = {}, dec = [];
      peers(rand, 40).forEach(function (i) {
        var v = (byIso[i][spec[3]] || [])[0];
        if (!v || v === mine || seen[v] || dec.length >= 3) return;
        seen[v] = 1; dec.push({ text: v });
      });
      if (dec.length < 3) return;
      out.push({
        id: spec[0], label: spec[1], icon: spec[2], tries: 1, kind: "text",
        ask: spec[4] + c.n + "?",
        opts: A.shuffle(rand, dec.concat([{ text: mine, right: true }])),
      });
    });

    // 6 · HOW MANY — a population band, one shot. Decoys are neighbouring
    //     bands, so it's a real judgement rather than a coin flip.
    if (c.pop) {
      var bi = popBand(c.pop);
      var near = [];
      POP_BANDS.forEach(function (b, k) {
        if (k !== bi && Math.abs(k - bi) <= 3) near.push({ text: b[1] });
      });
      if (near.length >= 3) out.push({
        id: "people", label: "HOW MANY", icon: "👫", tries: 1, kind: "text",
        ask: "How many people live in " + c.n + "?",
        opts: A.shuffle(rand, A.shuffle(rand, near).slice(0, 3)
          .concat([{ text: POP_BANDS[bi][1], right: true }])),
        note: "About " + A.fmtNum(c.pop) + " people.",
      });
    }

    return out.slice(0, 5);        // five rounds, as the original has
  }

  function runBonus(after) {
    var rounds = buildRounds();
    if (!rounds.length) return after([]);
    var results = [], n = 0;
    bonusHost = A.el("div", "bonus");
    main.insertBefore(bonusHost, list);
    step();

    function step() {
      if (n >= rounds.length) {
        if (bonusHost.parentNode) bonusHost.parentNode.removeChild(bonusHost);
        return after(results);
      }
      var r = rounds[n], used = 0, closed = false;
      bonusHost.innerHTML =
        '<div class="bn-head"><span class="bn-ix">BONUS ' + (n + 1) + " / " + rounds.length +
        '</span><span class="bn-nm">' + r.icon + " " + r.label + "</span></div>" +
        '<p class="bn-ask">' + A.esc(r.ask) + "</p>" +
        '<div class="bn-opts bn-' + r.kind + '"></div>' +
        '<p class="bn-foot"></p>';
      var optHost = bonusHost.querySelector(".bn-opts");
      var foot = bonusHost.querySelector(".bn-foot");
      foot.textContent = r.tries > 1 ? r.tries + " tries" : "one shot";

      r.opts.forEach(function (o) {
        var b = A.el("button", "bn-opt");
        if (r.kind === "shape") {
          var cv = A.el("canvas"); cv.className = "bn-shape";
          b.appendChild(cv);
          // The canvas has to be laid out before silhouette() measures it, so
          // draw on a timeout — NOT requestAnimationFrame, which is paused in a
          // background tab and would leave every outline blank.
          setTimeout(function () { A.silhouette(cv, o.iso, { fill: INK, pad: 8 }); }, 0);
        } else if (r.kind === "flag") {
          var im = A.el("img");
          im.alt = ""; im.src = A.rootPath() + "core/data/flags/" + o.iso + ".svg";
          im.onerror = function () { this.style.visibility = "hidden"; };
          b.appendChild(im);
        } else {
          b.textContent = o.text;
        }
        b.onclick = function () { hit(o, b); };
        optHost.appendChild(b);
      });

      function hit(o, b) {
        if (closed) return;
        used++;
        if (o.right) {
          b.classList.add("right"); closed = true; A.sfx("ok");
          results.push({ id: r.id, label: r.label, icon: r.icon, ok: true, used: used });
          close();
        } else {
          b.classList.add("wrong"); b.disabled = true; A.sfx("bad");
          if (used >= r.tries) {
            closed = true;
            results.push({ id: r.id, label: r.label, icon: r.icon, ok: false, used: used });
            close();
          } else {
            var left = r.tries - used;
            foot.textContent = left + (left === 1 ? " try left" : " tries left");
          }
        }
      }

      function close() {
        // Always show what the answer was — a bonus round you got wrong should
        // still teach you the thing.
        Array.prototype.forEach.call(optHost.children, function (el, k) {
          el.disabled = true;
          if (r.opts[k].right) el.classList.add("right");
        });
        foot.innerHTML = r.note ? '<span class="bn-note">' + A.esc(r.note) + "</span>" : "";
        var nx = A.el("button", "ac-pill bn-next",
          n + 1 >= rounds.length ? "SEE THE RESULT →" : "NEXT BONUS ROUND →");
        nx.onclick = function () { n++; step(); };
        bonusHost.appendChild(nx);
        try { nx.focus({ preventScroll: true }); } catch (e) {}
      }
    }
  }

  /* ── ending ──────────────────────────────────────────────────────────── */

  function end(won) {
    over = true;
    picker.disable(true);
    draw();
    var n = guesses.length;
    var norm = won ? Math.max(5, NORM[n] - (hinted ? 8 : 0)) : 10;

    var grid = [];
    var line = "";
    guesses.forEach(function (iso, i) {
      if (iso === answer) { line += "🟩"; return; }
      var c = byIso[iso];
      var d = A.haversine(at(c)[0], at(c)[1], at(byIso[answer])[0], at(byIso[answer])[1]);
      line += d < 1000 ? "🟨" : d < 4000 ? "🟧" : "⬛";
    });
    grid.push(line + "⬜".repeat(Math.max(0, TRIES - guesses.length)));
    if (hinted) grid.push("💡");

    // Bank the day BEFORE the bonus rounds. If they close the tab halfway
    // through a bonus round the flag result still has to count — and A.finish
    // only counts stats the first time, so calling it again later to attach the
    // bonus line is safe.
    bank(won, norm, grid, null);
    if (!won) return sheet(won, grid, norm, null);

    A.confetti(n <= 2 ? 130 : 70);
    runBonus(function (res) {
      bank(won, norm, grid, res);
      sheet(won, grid, norm, res);
    });
  }

  // Bonus rounds add a row to the share but never touch `norm` — see the note
  // above buildRounds().
  function bonusRow(res) {
    if (!res || !res.length) return null;
    return res.map(function (r) { return r.ok ? r.icon : "▫️"; }).join("");
  }

  function withBonus(grid, res) {
    var g = (grid || []).slice(), row = bonusRow(res);
    if (row) g.push(row);
    return g;
  }

  var stamped = false;
  function bank(won, norm, grid, res) {
    var g = withBonus(grid, res);
    if (!practice) {
      A.finish(ID, day, {
        score: norm, norm: norm, won: won,
        detail: won ? guesses.length + "/" + TRIES : "X/" + TRIES,
        bucket: won ? guesses.length : "X", shareGrid: g, durationMs: Date.now() - t0,
        stamps: won ? [answer] : [],
      });
    } else if (won && !stamped) { stamped = true; A.stamp(answer, ID); }
  }

  function sheet(won, grid, norm, res) {
    var c = byIso[answer];
    var extra = '<p class="center" style="margin:var(--sp-2) 0 2px">' +
      '<b style="font-size:var(--t-lg);letter-spacing:.08em">' + A.esc(c.n) + "</b></p>" +
      '<p class="center tiny muted">' + A.esc([c.cap, c.sub || c.reg].filter(Boolean).join(" · ")) + "</p>" +
      '<p class="center" style="margin-top:var(--sp-2)">' + A.flagSwatches(answer) + "</p>";

    if (res && res.length) {
      var got = res.filter(function (r) { return r.ok; }).length;
      extra += '<p class="bn-tally">' + res.map(function (r) {
        return '<span class="' + (r.ok ? "hit" : "miss") + '">' + r.icon +
          '<i>' + A.esc(r.label) + "</i></span>";
      }).join("") + "</p>" +
        '<p class="center tiny muted">bonus rounds ' + got + " of " + res.length +
        " — they don't move your score</p>";
    }
    if (won) extra += '<p class="center tiny" style="color:var(--green);margin-top:var(--sp-2)">' +
      A.esc(c.n) + " stamped in your passport</p>";

    var g = withBonus(grid, res);
    A.results(ID, practice ? A.PRACTICE : day, {
      title: won ? (guesses.length <= 2 ? "SHARP" : "GOT IT") : "NOT THIS TIME",
      extraHTML: extra,
      state: { norm: norm, shareGrid: g, won: won },
      shareText: "FLAGLE (practice)\n" + g.join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  window.addEventListener("resize", function () { clearTimeout(draw._t); draw._t = setTimeout(draw, 140); });

  window.__FL = {
    answer: function () { return answer; },
    guess: guess,
    rounds: buildRounds,
    // Every clickable control the bonus panel currently shows, so a test can
    // drive the REAL buttons rather than the functions underneath them.
    buttons: function () {
      return Array.prototype.slice.call(document.querySelectorAll(".bn-opt, .bn-next"));
    },
    state: function () {
      return {
        guesses: guesses, over: over, day: day,
        answerPool: POOL.length, guessPool: GUESS.length,
        tilesShown: over ? 6 : Math.min(6, guesses.length),
      };
    },
  };
})();
