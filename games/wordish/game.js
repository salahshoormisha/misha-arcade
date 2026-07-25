/* ============================================================================
   WORDISHA — the arcade's Wordle.
   ----------------------------------------------------------------------------
   This file is the REFERENCE IMPLEMENTATION for every other cabinet in the
   daily wing. If you are building another game, copy this shape:

     1. read the day    → A.requestedDay()   (handles ?d= archive and ?practice)
     2. seed the puzzle → A.dailyIndex(id, day, pool.length)
     3. restore state   → A.load(id, day)     and re-render it
     4. autosave        → A.save(id, day, {...}) after every move
     5. finish once     → A.finish(id, day, {norm, won, detail, shareGrid, ...})
     6. show the sheet  → A.results(id, day, {...})

   NORM (cross-game 0-100 currency, see _build/CONTRACT.md §3):
     solved in 1..6 guesses → 100, 96, 86, 72, 58, 46   (the modal win is 4 → 72)
     lost                   → 12
     each revealed letter   → −12 (floor 5 when won)
   ========================================================================== */
(function () {
  "use strict";

  var ID = "wordish", LEN = 5, TRIES = 6;
  var NORM = [0, 100, 96, 86, 72, 58, 46];

  /* ── word lists (with a survivable fallback if data hasn't loaded) ────── */
  var W = window.AD_WORDS || {};
  var FALLBACK = ("about above alone among beach began begin being below birth blood board brain bread break " +
    "bring brown build burnt cabin cable candy chair chalk charm chase cheap check chess chief child china " +
    "class clean clear climb clock close cloud coast could count court cover crash cream crown daily dance " +
    "dealt death delay dirty dozen drank dream dress drink drive early earth eight empty enjoy enter equal " +
    "every exact exist extra faith false fault fever field fight final first flame flash float floor focus " +
    "force found frame fresh front fruit funny giant given glass globe grace grade grand grant grass great " +
    "green group guard guess guest happy heart heavy hotel house human humid ideal image index inner input " +
    "issue joint judge juice known label large later laugh layer learn least leave legal lemon level light " +
    "limit local lodge logic loose lucky lunar lunch magic major maker maple march match maybe mayor medal " +
    "media mercy metal meter might minor mixed model money month moral mount mouse mouth movie music never " +
    "night noise north noted novel nurse ocean offer often onion order other ought outer owner paint panel " +
    "paper party pause peace pearl phase phone photo piano piece pilot pitch place plain plane plant plate " +
    "point pound power press price pride prime print prize proof proud prove pulse punch pupil queen quick " +
    "quiet quite radio raise range rapid ratio reach ready realm rebel refer relax reply rider ridge right " +
    "risky river roast robot rocky roman rough round route royal rugby ruler rural salad sauce scale scene " +
    "scope score sense serve seven shade shake shall shape share sharp sheet shelf shell shift shine shirt " +
    "shock shoot shore short shown sight silly since siren sixth skill sleep slide slope small smart smile " +
    "smoke snake solar solid solve sorry sound south space spare speak speed spend spent spice spine spoke " +
    "sport staff stage stair stand stare start state steam steel steep stick still stock stone stood store " +
    "storm story stove strap straw strip study stuff style sugar suite sunny super swear sweet swift swing " +
    "table taken taste teach thank theme there these thick thing think third those three threw throw thumb " +
    "tiger tight timer tired title toast today token tooth topic total touch tough tower towel trace track " +
    "trade trail train treat trend trial tribe trick tried truck truly trunk trust truth twice twist uncle " +
    "under union unite until upper upset urban usual valid value video villa vinyl vital vivid vocal voice " +
    "wagon waist watch water weary weird whale wheat wheel where which while white whole whose windy woman " +
    "world worry worse worth would wound wrist write wrong yield young youth").split(" ");

  var ANSWERS = (W.answers5 && W.answers5.length ? W.answers5 : FALLBACK).map(up);
  var VALID = {};
  (W.valid5 && W.valid5.length ? W.valid5 : FALLBACK).forEach(function (w) { VALID[up(w)] = 1; });
  ANSWERS.forEach(function (w) { VALID[w] = 1; });

  // The Persian pack: real English words borrowed from Farsi. Discoverable, optional.
  var PERSIAN = (W.persian || []).filter(function (p) {
    return up(p.w || p).length === LEN && VALID[up(p.w || p)];
  });
  function up(s) { return String(s).toUpperCase(); }

  /* ── state ───────────────────────────────────────────────────────────── */
  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var pack = (new URLSearchParams(location.search)).get("pack") === "persian" && PERSIAN.length ? "persian" : "main";
  var pool = pack === "persian" ? PERSIAN.map(function (p) { return up(p.w || p); }) : ANSWERS;
  var answer, guesses = [], cur = "", over = false, revealed = [], t0 = Date.now();
  var board, kbd, keyState = {};

  function pickAnswer() {
    if (practice) {
      var r = A.rng(String(Date.now()) + Math.random());
      return A.pick(r, pool);
    }
    return pool[A.dailyIndex(ID + ":" + pack, day, pool.length)];
  }

  /* ── boot ────────────────────────────────────────────────────────────── */
  var main = A.mount({
    id: ID, dayN: day,
    help: "<p>Six goes at a five-letter word. <b class='ok'>Green</b> = right letter, right place. " +
      "<b>Yellow</b> = right letter, wrong place. Grey = not in the word.</p>" +
      "<p>Everyone gets the same word on the same day — so you and David can argue about it fairly.</p>" +
      "<ul><li><b>Hard mode</b> (settings ⚙): any hint you've found must be reused.</li>" +
      "<li><b>Reveal a letter</b> if you're stuck — it costs you 12 points, not the game.</li>" +
      "<li><b>Persian pack</b>: the whole word list becomes English words borrowed from Farsi. " +
      "Kiosk, divan, julep, bazaar. You'll be surprised how many there are.</li>" +
      "<li><b>Practice</b> is unlimited and never touches your stats.</li></ul>",
  });

  answer = pickAnswer();

  board = A.el("div", null, "");
  board.id = "board";
  for (var r = 0; r < TRIES; r++) {
    var row = A.el("div", "row");
    for (var c = 0; c < LEN; c++) row.appendChild(A.el("div", "ac-tile"));
    board.appendChild(row);
  }
  main.appendChild(board);

  var modes = A.el("div", "modes");
  modes.innerHTML =
    '<button class="ac-pill" id="reveal">💡 REVEAL A LETTER</button>' +
    '<a class="ac-pill" id="packlink" href="?' + (pack === "persian" ? "" : "pack=persian") + '">' +
    (pack === "persian" ? "🔤 BACK TO NORMAL" : "🇮🇷 PERSIAN PACK") + "</a>" +
    (practice ? '<a class="ac-pill" href="./">← TODAY\'S WORD</a>'
      : '<a class="ac-pill" href="?practice=1">∞ PRACTICE</a>');
  main.appendChild(modes);
  if (!PERSIAN.length) { var pl = modes.querySelector("#packlink"); if (pl) pl.style.display = "none"; }
  if (pack === "persian") A.setSub("PERSIAN PACK · DAY " + (practice ? "∞" : day));

  kbd = A.keyboard({
    onKey: function (ch) { type(ch); },
    onEnter: submit,
    onBack: function () { cur = cur.slice(0, -1); paint(); },
    host: main,
  });

  main.querySelector("#reveal").onclick = doReveal;

  restore();

  /* ── play ────────────────────────────────────────────────────────────── */

  function type(ch) {
    if (over || cur.length >= LEN) return;
    cur += ch;
    A.sfx("type");
    paint();
  }

  function submit() {
    if (over) return;
    if (cur.length < LEN) return nope("Not enough letters");
    if (!VALID[cur]) return nope("Not in the word list");

    if (A.settings().hardMode) {
      var v = hardCheck(cur);
      if (v) return nope(v);
    }

    guesses.push(cur);
    var res = score(cur, answer);
    res.forEach(function (s, i) {
      var ch = cur[i];
      var rank = { ok: 3, near: 2, miss: 1 };
      if (!keyState[ch] || rank[s] > rank[keyState[ch]]) keyState[ch] = s;
    });
    var won = cur === answer;
    cur = "";
    paint(true);
    save();

    if (won) { setTimeout(function () { end(true); }, 620); }
    else if (guesses.length >= TRIES) { setTimeout(function () { end(false); }, 620); }
    else {
      res.forEach(function (s, i) { setTimeout(function () { A.sfx(s === "ok" ? "ok" : s === "near" ? "near" : "miss", i); }, i * 90); });
    }
  }

  // Wordle's exact two-pass scoring — greens first, then yellows from what's left.
  function score(guess, ans) {
    var out = new Array(LEN).fill("miss"), pool = {};
    for (var i = 0; i < LEN; i++) {
      if (guess[i] === ans[i]) out[i] = "ok";
      else pool[ans[i]] = (pool[ans[i]] || 0) + 1;
    }
    for (var j = 0; j < LEN; j++) {
      if (out[j] === "ok") continue;
      if (pool[guess[j]] > 0) { out[j] = "near"; pool[guess[j]]--; }
    }
    return out;
  }

  function hardCheck(g) {
    for (var i = 0; i < guesses.length; i++) {
      var s = score(guesses[i], answer), prev = guesses[i];
      for (var k = 0; k < LEN; k++) {
        if (s[k] === "ok" && g[k] !== prev[k]) return ordinal(k + 1) + " letter must be " + prev[k];
        if (s[k] === "near" && g.indexOf(prev[k]) < 0) return "Guess must contain " + prev[k];
      }
    }
    for (var m = 0; m < revealed.length; m++) {
      if (g[revealed[m]] !== answer[revealed[m]]) return ordinal(revealed[m] + 1) + " letter must be " + answer[revealed[m]];
    }
    return null;
  }
  function ordinal(n) { return ["", "1st", "2nd", "3rd", "4th", "5th"][n] || n + "th"; }

  function nope(msg) {
    A.toast(msg, true);
    A.sfx("bad");
    var row = board.children[guesses.length];
    if (row) { row.classList.add("ac-shake"); setTimeout(function () { row.classList.remove("ac-shake"); }, 420); }
  }

  function doReveal() {
    if (over) return;
    var left = [];
    for (var i = 0; i < LEN; i++) if (revealed.indexOf(i) < 0) left.push(i);
    if (!left.length) return;
    var idx = A.pick(A.rng(ID + day + revealed.length), left);
    revealed.push(idx);
    keyState[answer[idx]] = "ok";
    A.sfx("reveal");
    A.toast("Letter " + (idx + 1) + " is " + answer[idx]);
    paint();
    save();
  }

  /* ── rendering ───────────────────────────────────────────────────────── */

  function paint(animate) {
    for (var r = 0; r < TRIES; r++) {
      var row = board.children[r];
      for (var c = 0; c < LEN; c++) {
        var t = row.children[c];
        var g = guesses[r];
        if (g) {
          var s = score(g, answer)[c];
          t.textContent = g[c];
          t.className = "ac-tile " + s + (animate && r === guesses.length - 1 ? " flip" : "");
          if (animate && r === guesses.length - 1) t.style.animationDelay = (c * 0.09) + "s";
        } else if (r === guesses.length) {
          t.textContent = cur[c] || (revealed.indexOf(c) >= 0 ? answer[c] : "");
          t.className = "ac-tile" + (cur[c] ? " filled" : revealed.indexOf(c) >= 0 ? " filled" : "");
          if (!cur[c] && revealed.indexOf(c) >= 0) t.style.color = "var(--gold)";
          else t.style.color = "";
        } else {
          t.textContent = ""; t.className = "ac-tile"; t.style.color = "";
        }
      }
    }
    kbd.paint(keyState);
  }

  /* ── persistence ─────────────────────────────────────────────────────── */

  function save() {
    if (practice) return;
    A.save(ID, day, { guesses: guesses, revealed: revealed, pack: pack, keyState: keyState });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st && st.pack && st.pack !== pack) st = null;   // different pack, different game
    if (st) {
      guesses = st.guesses || [];
      revealed = st.revealed || [];
      keyState = st.keyState || {};
    }
    paint();
    if (st && st.done) {
      over = true;
      kbd.disable(true);
      setTimeout(function () { sheet(st.won); }, 240);
    }
  }

  /* ── ending ──────────────────────────────────────────────────────────── */

  function end(won) {
    over = true;
    kbd.disable(true);
    var n = guesses.length;
    var norm = won ? Math.max(5, NORM[n] - revealed.length * 12) : 12;

    var grid = guesses.map(function (g) {
      return score(g, answer).map(function (s) {
        return s === "ok" ? (A.settings().colourblind ? "🟦" : "🟩")
          : s === "near" ? (A.settings().colourblind ? "🟧" : "🟨") : "⬛";
      }).join("");
    });
    if (revealed.length) grid.push("💡".repeat(revealed.length));

    var detail = won ? n + "/" + TRIES : "X/" + TRIES;

    if (!practice) {
      A.finish(ID, day, {
        score: norm, norm: norm, won: won, detail: detail, bucket: won ? n : "X",
        shareGrid: grid, durationMs: Date.now() - t0,
      });
    }
    if (won) { A.sfx("win"); A.confetti(n <= 2 ? 140 : 80); }
    else A.sfx("lose");
    sheet(won, grid, detail, norm);
  }

  function sheet(won, grid, detail, norm) {
    var extra = "";
    if (!won) extra += '<p class="center" style="font-size:22px;letter-spacing:5px;color:var(--gold);margin:8px 0">' +
      A.esc(answer) + "</p>";
    var ety = PERSIAN.filter(function (p) { return up(p.w || p) === answer; })[0];
    if (ety && ety.from) extra += '<p class="etym">🇮🇷 <b>' + A.esc(answer) + "</b> — from Persian <i>" +
      A.esc(ety.from) + "</i></p>";

    A.results(ID, practice ? A.PRACTICE : day, {
      title: won ? ["GENIUS", "MAGNIFICENT", "IMPRESSIVE", "SPLENDID", "GREAT", "PHEW"][(guesses.length || 1) - 1]
        : "TOMORROW, THEN",
      extraHTML: extra,
      state: { norm: norm, shareGrid: grid, won: won },
      shareText: "WORDISHA (practice) " + (detail || "") + "\n" + (grid || []).join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  // Expose a debug hook so the build can drive it in a browser test.
  window.__WD = {
    answer: function () { return answer; },
    guess: function (w) { cur = up(w); submit(); },
    state: function () { return { guesses: guesses, over: over, day: day, pack: pack }; },
  };
})();
