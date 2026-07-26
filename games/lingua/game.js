/* ============================================================================
   LINGUAGUESSR — a real sentence, in a real language, in its own script.
   Guess a country where that language is spoken. Five guesses.

   Built on the shape of games/wordish/game.js (the reference implementation),
   with FLAGLE's guess rows (distance · bearing · proximity) so the geo
   cabinets all feel like one machine.

   This game is about WRITING SYSTEMS, not about people. Nothing here judges,
   ranks or exoticises anybody: the hero element is a passage of real text,
   set as well as the device can set it, and the reveal is a small lesson in
   what that script actually is.

   Four things the original Ethnoguessr never did:
     · no faces, ever — the puzzle is a script, and the reveal teaches the tell
     · a three-rung HINT LADDER that unlocks as you miss: script tell →
       geographic tell → near-giveaway, each one spendable for 7 points
     · every accepted country counts (Arabic is not a trick question), and the
       miss feedback points at the NEAREST correct one
     · real typography: a per-script font stack, correct lang/dir, vertical
       Mongolian, and a tofu check that hands you the script hint for free if
       your device has no font for it

   NORM (cross-game 0-100 currency, _build/CONTRACT.md §3):
     solved in 1..5 guesses → 100, 85, 70, 55, 40   (modal win 3 → 70)
     lost                   → 10
     each hint taken        → −7   (floor 5 when won, 0 when lost)
   ========================================================================== */
(function () {
  "use strict";

  /* ── constants ─────────────────────────────────────────────────────────
     Everything the boot sequence touches is declared up here: `var`
     initialisers do NOT hoist, and this file builds its DOM immediately. */

  var ID = "lingua", TRIES = 5, HINTS = 3, HINT_COST = 7, LOST = 10;
  var NORM = [0, 100, 85, 70, 55, 40];

  // Rung labels — what each hint is about, said before you buy it.
  var RUNG = ["THE SCRIPT", "THE PLACE", "NEARLY THE ANSWER"];

  /* Font stacks, keyed by ISO 15924 script code. macOS and iOS names only —
     the arcade ships no font files and never will. Each stack ends in the two
     broadest things Apple installs, so a missing family degrades to a real
     glyph rather than a box. Verified on macOS 12 (see __LG.audit()). */
  var TAIL = '"Arial Unicode MS", "Lucida Grande", sans-serif';
  var STAIL = '"Arial Unicode MS", serif';
  var FONTS = {
    Latn: '"Times New Roman", "Iowan Old Style", Charter, Georgia, ' + STAIL,
    Cyrl: '"PT Serif", Georgia, "Times New Roman", ' + STAIL,
    Grek: '"Times New Roman", Georgia, ' + STAIL,
    Arab: '"SF Arabic", "Geeza Pro", Baghdad, "Al Bayan", Damascus, Nadeem, ' + TAIL,
    Hebr: '"Arial Hebrew", Raanana, "New Peninim MT", "Times New Roman", ' + TAIL,
    Armn: '"Noto Sans Armenian", Mshtakan, "Times New Roman", ' + TAIL,
    Geor: '"Noto Sans Georgian", "Arial Unicode MS", "Helvetica Neue", ' + TAIL,
    Deva: '"Devanagari Sangam MN", "Kohinoor Devanagari", "ITF Devanagari", "Devanagari MT", ' + TAIL,
    Beng: '"Bangla Sangam MN", "Kohinoor Bangla", "Bangla MN", ' + TAIL,
    Guru: '"Gurmukhi Sangam MN", "Kohinoor Gurmukhi", "Gurmukhi MN", ' + TAIL,
    Gujr: '"Gujarati Sangam MN", "Kohinoor Gujarati", "Gujarati MT", ' + TAIL,
    Taml: '"Tamil Sangam MN", "Kohinoor Tamil", "Tamil MN", InaiMathi, ' + TAIL,
    Telu: '"Telugu Sangam MN", "Kohinoor Telugu", "Telugu MN", ' + TAIL,
    Knda: '"Kannada Sangam MN", "Noto Sans Kannada", "Kannada MN", ' + TAIL,
    Mlym: '"Malayalam Sangam MN", "Kohinoor Malayalam", "Malayalam MN", ' + TAIL,
    Orya: '"Noto Sans Oriya", "Oriya Sangam MN", "Kohinoor Odia", "Oriya MN", ' + TAIL,
    Sinh: '"Sinhala Sangam MN", "Noto Sans Sinhala", "Sinhala MN", ' + TAIL,
    Thai: 'Thonburi, "SF Thai", "Sukhumvit Set", Ayuthaya, Silom, ' + TAIL,
    Laoo: '"Lao Sangam MN", "Noto Sans Lao", "Lao MN", ' + TAIL,
    Khmr: '"Khmer Sangam MN", "Noto Sans Khmer", "Khmer MN", ' + TAIL,
    Mymr: '"Myanmar Sangam MN", "Noto Sans Myanmar", "Myanmar MN", ' + TAIL,
    Tibt: 'Kailasa, Kokonor, "Noto Serif Tibetan", ' + TAIL,
    Java: '"Noto Sans Javanese", "Noto Serif Javanese", ' + TAIL,
    Hans: '"PingFang SC", "Hiragino Sans GB", "Songti SC", STHeiti, "Heiti SC", ' + TAIL,
    Hant: '"PingFang TC", "Songti TC", "Heiti TC", "Apple LiGothic", ' + TAIL,
    Jpan: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Hiragino Mincho ProN", "Yu Gothic", ' + TAIL,
    Hang: '"Apple SD Gothic Neo", AppleGothic, "Nanum Gothic", ' + TAIL,
    Ethi: 'Kefa, "Noto Sans Ethiopic", ' + TAIL,
    Tfng: '"Noto Sans Tifinagh", ' + TAIL,
    Adlm: '"Noto Sans Adlam", ' + TAIL,
    Vaii: '"Noto Sans Vai", ' + TAIL,
    Cher: '"Plantagenet Cherokee", "Noto Sans Cherokee", ' + TAIL,
    Cans: '"Euphemia UCAS", Euphemia, "Noto Sans Canadian Aboriginal", ' + TAIL,
    Thaa: '"Noto Sans Thaana", "MV Boli", Thaana, ' + TAIL,
    Syrc: '"Noto Sans Syriac", "Estrangelo Edessa", ' + TAIL,
    Mong: '"Noto Sans Mongolian", "Mongolian Baiti", ' + TAIL,
    Yiii: '"Noto Sans Yi", Nisc18030, ' + TAIL,
    Nkoo: '"Noto Sans NKo", ' + TAIL,
  };
  // Urdu is set in nastaʿlīq or it is not Urdu. Apple ships Noto Nastaliq Urdu.
  var FONT_BY_KEY = { urd: '"Noto Nastaliq Urdu", "Noto Naskh Arabic", "Geeza Pro", ' + TAIL };

  // Size multiplier and line-height per script: Devanagari needs more room
  // above and below than Latin, nastaʿlīq needs a great deal more.
  var SCALE = {
    Arab: 1.22, Hebr: 1.1, Thaa: 1.18, Syrc: 1.18, Nkoo: 1.14, Adlm: 1.18,
    Deva: 1.08, Beng: 1.08, Guru: 1.08, Gujr: 1.08, Orya: 1.08,
    Taml: 1.1, Telu: 1.1, Knda: 1.1, Mlym: 1.1, Sinh: 1.1,
    Thai: 1.14, Laoo: 1.14, Khmr: 1.18, Mymr: 1.14, Tibt: 1.14, Java: 1.18,
    Ethi: 1.05, Cans: 1.05, Vaii: 1.1, Yiii: 1.05, Tfng: 1.05, Mong: 1.05,
    urd: 1.42,
  };
  var LEAD = {
    Arab: 1.95, Hebr: 1.8, Thaa: 2, Syrc: 1.9, Nkoo: 1.9, Adlm: 1.9,
    Deva: 2, Beng: 2, Guru: 2, Gujr: 2, Orya: 2, Taml: 2, Telu: 2, Knda: 2,
    Mlym: 2, Sinh: 2, Thai: 2.05, Laoo: 2.05, Khmr: 2.15, Mymr: 2.1, Tibt: 2.05,
    Java: 2.15, Hans: 1.8, Hant: 1.8, Jpan: 1.8, Hang: 1.8, Ethi: 1.7,
    Cans: 1.7, Cher: 1.7, Mong: 1.9, urd: 2.5,
  };

  var RTL = { Arab: 1, Hebr: 1, Thaa: 1, Syrc: 1, Nkoo: 1, Adlm: 1 };
  var VERT = { Mong: 1 };                     // written top-to-bottom, columns L→R

  /* The data keys are ISO 639-3, which IS valid in a lang attribute — but the
     one place a wrong tag changes the GLYPHS is Han: the same code point is
     drawn differently in Chinese, Japanese and Korean, and engines key that off
     the 639-1 tag. So the languages where the tag does real work are spelled
     the way browsers expect; everything else falls through to its 639-3 code. */
  var LANGTAG = {
    cmn_hans: "zh-Hans", cmn_hant: "zh-Hant", jpn: "ja", kor: "ko",
    khk_mong: "mn-Mong", khk: "mn", arb: "ar", pes: "fa", urd: "ur",
    heb: "he", ydd: "yi", hin: "hi", ben: "bn", tha: "th", ell: "el",
    rus: "ru", kat: "ka", hye: "hy", amh: "am", bod: "bo",
  };

  /* ── data ──────────────────────────────────────────────────────────────── */

  var L = window.AD_LINGUA || {};
  var CO = {};
  (window.AD_COUNTRIES || []).forEach(function (c) { CO[c.i] = c; });

  function at(c) { return c.capll || c.ll; }   // [lat, lon]

  // The answer pool: every sample whose countries we can actually place on the
  // globe. Sorted by key so both players walk the same permutation.
  var SAMPLES = (L.samples || []).filter(function (s) {
    return s && s.text && s.countries && s.countries.some(function (i) { return CO[i] && at(CO[i]); });
  }).sort(function (a, b) { return a.key < b.key ? -1 : a.key > b.key ? 1 : 0; });

  // The guessing pool: every UN member, plus every country that is an answer
  // somewhere (Greenland, Taiwan, Hong Kong, Macau, Kosovo). Same every day,
  // so it gives nothing away.
  var PMAP = {};
  (window.AD_COUNTRIES || []).forEach(function (c) { if (c.un === 1 && at(c)) PMAP[c.i] = 1; });
  SAMPLES.forEach(function (s) {
    s.countries.forEach(function (i) { if (CO[i] && at(CO[i])) PMAP[i] = 1; });
  });
  var POOL = Object.keys(PMAP).sort();

  /* ── state ─────────────────────────────────────────────────────────────── */

  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var sandbox = false;                        // set by __LG.show() — never scores
  var S = null;                               // the day's sample
  var guesses = [], taken = [], free = -1, over = false, t0 = Date.now();
  var picker = null, specTxt = null, specBody = null, plateTries = null;
  var noFontBox = null, saidBox = null, ladder = null, list = null, fitTimer = null;
  // Typesetting state. Declared HERE, above the boot block: `var` initialisers
  // do not hoist, so a copy further down the file would run *after* boot and
  // quietly undo the first fit.
  var fitting = false, lastW = 0, lastH = 0, shown = false;

  /* ── boot ──────────────────────────────────────────────────────────────── */

  var main = A.mount({
    id: ID, dayN: day,
    help: "<p>One passage of <b>real text</b>, in a real language, in the script that " +
      "language is actually written in. Name a country where it is spoken.</p>" +
      "<ul><li><b>Five guesses.</b> Any country where the language is spoken counts — " +
      "Arabic is not a trick question.</li>" +
      "<li>A miss tells you <b>how far</b> you are from the nearest right answer and " +
      "<b>which way</b> to go.</li>" +
      "<li>Every miss unlocks a rung of the <b>hint ladder</b>: the script, then the " +
      "region, then something close to the answer. Reading one costs <b>7 points</b>, " +
      "never a guess.</li>" +
      "<li>Get it and the country is <b>stamped in your passport</b>. Afterwards you get " +
      "the language, its family, its writing system, the English of the passage and the source.</li>" +
      "<li>Type freely — <i>USA</i>, <i>Holland</i>, <i>Persia</i> and <i>Burma</i> all work.</li>" +
      "<li>Passages are the Universal Declaration of Human Rights (the most translated " +
      "document there is) and a few Wikipedia openings. Nothing is invented.</li></ul>",
  });

  if (!SAMPLES.length) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">Language data hasn\'t loaded. ' +
      "Check core/data/lingua.js and countries.js.</p>";
    return;
  }

  S = pickSample(day);

  var spec = A.el("div", "ac-card spec");
  spec.innerHTML =
    '<div class="plate"><span class="id"></span><span class="tries"></span></div>' +
    '<div class="body"><div class="txt"></div></div>' +
    '<div class="nofont"></div>' +
    '<div class="foot"></div>' +
    '<div class="saidhost"></div>';
  main.appendChild(spec);

  specBody = spec.querySelector(".body");
  specTxt = spec.querySelector(".txt");
  plateTries = spec.querySelector(".tries");
  noFontBox = spec.querySelector(".nofont");
  saidBox = spec.querySelector(".saidhost");
  spec.querySelector(".id").textContent = "SPECIMEN " +
    (practice || sandbox ? "∞" : "No. " + pad(day));
  spec.querySelector(".foot").textContent = srcLabel(S.src);

  var pickHost = A.el("div", "pickhost");
  main.appendChild(pickHost);
  picker = A.picker(pickHost, { pool: POOL, onPick: guess, placeholder: "where is this spoken?" });

  var row = A.el("div", "ac-row underpick");
  row.innerHTML = practice
    ? '<a class="ac-pill" href="./">← TODAY\'S SPECIMEN</a>'
    : '<a class="ac-pill" href="?practice=1">∞ PRACTICE</a>';
  main.appendChild(row);

  ladder = A.el("div", "ladder");
  main.appendChild(ladder);
  list = A.el("div", "guesses");
  main.appendChild(list);

  // Today's difficulty, for the par line on the result sheet: a language with
  // many speakers in many countries is a gift; 2,000 speakers in one is not.
  A.setPar(ID, function (dayN) {
    var s = pickSample(dayN);
    if (!s) return null;
    var sp = Math.log(Math.max(1000, s.speakers || 1000)) / Math.LN10;
    return A.clamp(Math.round(18 + 6 * sp + 2 * Math.min(6, s.countries.length)), 30, 86);
  });

  paintSpecimen();
  restore();
  watchSize();

  /* ── the day's specimen ────────────────────────────────────────────────── */

  function pickSample(dayN) {
    if (dayN === A.PRACTICE) return A.pick(A.rng(String(Date.now()) + Math.random()), SAMPLES);
    return SAMPLES[A.dailyIndex(ID, dayN, SAMPLES.length)];
  }

  function fontFor(s) { return FONT_BY_KEY[s.key] || FONTS[s.sc] || TAIL; }

  // A BCP-47 tag for the passage, so the browser shapes, breaks and reads it as
  // the right language instead of guessing. "cmn_hans" → "zh-Hans".
  function bcp47(s) {
    return LANGTAG[s.key] || s.key.replace(/_(hans|hant|mong)$/, function (m, g) {
      return "-" + g.charAt(0).toUpperCase() + g.slice(1);
    });
  }

  function paintSpecimen() {
    var vert = !!VERT[S.sc];
    specTxt.textContent = S.text;
    specTxt.style.fontFamily = fontFor(S);
    specTxt.setAttribute("lang", bcp47(S));
    specTxt.setAttribute("dir", RTL[S.sc] ? "rtl" : "ltr");
    specTxt.className = "txt" + (vert ? " vert" : "") + (shown ? " in" : "");
    fit(true);

    // If this device has no font for the script the passage is unreadable, so
    // the script hint stops being a hint and becomes an accessibility fix.
    if (free < 0 && noFont()) {
      free = 0;
      noFontBox.innerHTML = "⚠︎ your device has no font for this writing system, so it's " +
        "showing boxes. The script hint is on the house.";
      if (taken.indexOf(0) < 0) taken.push(0);
    }
    paintTries();
  }

  /* Fit the passage to the card: pick the largest size that does not overflow,
     never clip. Reading scrollHeight forces layout, so this walks down in
     single steps from a per-script ceiling and stops at the first fit.

     It must survive being laid out at no size at all — a background tab, a
     hidden pane, a page restored from the back/forward cache all report a
     zero-width box, and a font size chosen from that measurement would be
     wrong and would never be corrected by a window `resize` event. So: bail
     while the box is unmeasurable, and let the ResizeObserver below call back
     the moment it has real dimensions. (State for it is declared at the top.) */

  function fit(force) {
    if (!specTxt || fitting) return;
    var avail = specBody.clientWidth;
    if (avail < 80) return;                    // not laid out yet — try again later
    var vh = window.innerHeight || 0;
    if (!force && avail === lastW && vh === lastH && shown) return;
    lastW = avail; lastH = vh;
    fitting = true;
    try {
      var vert = !!VERT[S.sc];
      var mul = SCALE[S.key] || SCALE[S.sc] || 1;
      // Vertical text is measured across, horizontal text down. The height must
      // be cleared for horizontal scripts or a switch of specimen inherits it.
      var maxH = vert ? A.clamp(Math.round((vh || 700) * 0.45), 220, 300)
        : A.clamp(Math.round((vh || 700) * 0.44), 240, 340);
      specTxt.style.lineHeight = String(LEAD[S.key] || LEAD[S.sc] || 1.65);
      specTxt.style.height = vert ? maxH + "px" : "";
      var ok = false;
      for (var px = 31; px >= 14; px--) {
        specTxt.style.fontSize = Math.round(px * mul) + "px";
        ok = vert ? specTxt.scrollWidth <= specTxt.clientWidth + 1
          : specTxt.scrollHeight <= maxH;
        if (ok) break;
      }
      // Nothing may ever be clipped. Only the vertical case caps its height, so
      // if even the smallest size overflows, the cap comes off and the card grows.
      if (vert && !ok) specTxt.style.height = "";
      specBody.style.minHeight = vert ? "" : "132px";
    } finally { fitting = false; }
    reveal();
  }

  // The passage starts invisible so the fitting pass never shows as a jump in
  // type size. Revealed synchronously — never inside requestAnimationFrame,
  // which a background tab pauses — and force-revealed shortly after boot in
  // case this device never gives us a measurable box.
  function reveal() {
    if (shown) return;
    shown = true;
    specTxt.classList.add("in");
  }

  function watchSize() {
    if (window.ResizeObserver) {
      try {
        new ResizeObserver(function () { fit(); }).observe(specBody);
      } catch (e) {}
    }
    window.addEventListener("resize", function () {
      clearTimeout(fitTimer);
      fitTimer = setTimeout(fit, 140);
    });
    window.addEventListener("orientationchange", function () {
      clearTimeout(fitTimer);
      fitTimer = setTimeout(function () { fit(true); }, 220);
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) fit();
    });
    // A webfont is never used here, but asking for the system stack to settle
    // costs nothing and catches the one frame where metrics can still change.
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(function () { fit(true); })["catch"](function () {});
    }
    setTimeout(reveal, 700);
  }

  /* Tofu check. Three or more DIFFERENT characters of a script that all render
     to the identical bitmap can only be the last-resort box, so that is what
     we test — no font-list sniffing, no guessing about the device. */
  function noFont() { return isTofu(S.text, fontFor(S)); }

  function isTofu(text, font) {
    try {
      var cv = document.createElement("canvas");
      cv.width = 44; cv.height = 44;
      var g = cv.getContext("2d");
      if (!g || !g.getImageData) return false;
      g.font = '30px ' + font;
      g.textBaseline = "middle";
      g.fillStyle = "#fff";

      var chars = [], seen = {}, i, ch, cp;
      for (i = 0; i < text.length && chars.length < 4; i++) {
        ch = text.charAt(i);
        cp = text.charCodeAt(i);
        if (cp >= 0xD800 && cp <= 0xDBFF) { ch = text.substr(i, 2); i++; }
        if (cp < 0x0180) continue;                       // Latin always renders
        if (seen[ch]) continue;
        if (g.measureText(ch).width < 2) continue;       // combining mark / zero width
        seen[ch] = 1;
        chars.push(ch);
      }
      if (chars.length < 3) return false;                // not enough to judge

      var sigs = chars.map(function (c) {
        g.clearRect(0, 0, 44, 44);
        g.fillText(c, 3, 24);
        var d = g.getImageData(0, 0, 44, 44).data, h = 2166136261, ink = 0, k;
        for (k = 3; k < d.length; k += 4) {
          if (d[k]) ink++;
          h = Math.imul(h ^ d[k], 16777619);
        }
        return ink ? String(h) : "blank";
      });
      for (i = 1; i < sigs.length; i++) if (sigs[i] !== sigs[0]) return false;
      return true;
    } catch (e) { return false; }
  }

  /* ── play ──────────────────────────────────────────────────────────────── */

  function guess(iso) {
    if (over || !CO[iso]) return;
    if (guesses.indexOf(iso) >= 0) return A.toast("Already guessed that one", true);
    guesses.push(iso);
    picker.setExclude(guesses);
    var won = right(iso);
    renderGuesses();
    paintTries();
    renderLadder();
    save();
    if (won) { A.sfx("win"); end(true); }
    else if (guesses.length >= TRIES) { A.sfx("lose"); end(false); }
    else { A.sfx(nearest(iso).km < 900 ? "near" : "miss"); }
  }

  function right(iso) { return S.countries.indexOf(iso) >= 0; }

  function wrongCount() {
    var n = 0;
    guesses.forEach(function (i) { if (!right(i)) n++; });
    return n;
  }

  // Rung k is unlocked by the k-th miss; the first is free if there is no font.
  function unlocked(k) { return over || k === free || wrongCount() > k; }

  function takeHint(k) {
    if (k < 0 || k >= HINTS || !S.hints[k]) return;
    if (taken.indexOf(k) >= 0) return;
    if (!unlocked(k) || over) return;
    taken.push(k);
    A.sfx("reveal");
    renderLadder();
    save();
  }

  function paidHints() {
    return taken.filter(function (k) { return k !== free; }).length;
  }

  /* ── feedback ──────────────────────────────────────────────────────────── */

  // Distance and bearing are measured to the NEAREST accepted country, so a
  // widely spoken language is never unfair to guess at.
  function nearest(iso) {
    var g = CO[iso], best = null, bd = Infinity;
    S.countries.forEach(function (t) {
      var tc = CO[t];
      if (!tc || !at(tc)) return;
      var d = A.haversine(at(g)[0], at(g)[1], at(tc)[0], at(tc)[1]);
      if (d < bd) { bd = d; best = t; }
    });
    return { iso: best, km: bd };
  }

  function renderGuesses() {
    list.innerHTML = "";
    guesses.forEach(function (iso) {
      var c = CO[iso], won = right(iso), el = A.el("div", "gr" + (won ? " win" : ""));
      var html = '<img alt="" src="' + A.rootPath() + "core/data/flags/" + iso +
        '.svg" onerror="this.style.visibility=\'hidden\'">' +
        '<span class="nm">' + A.esc(c.n) + "</span>";
      if (won) {
        html += '<span class="ar">🎉</span><span class="pc">100%</span>';
      } else {
        var n = nearest(iso), b = CO[n.iso];
        var brg = A.bearing(at(c)[0], at(c)[1], at(b)[0], at(b)[1]);
        html += '<span class="km">' + A.geo.km(n.km) + '</span>' +
          '<span class="ar">' + A.arrow(brg) + "</span>" +
          '<span class="pc">' + Math.min(99, Math.round(A.geo.prox(n.km) * 100)) + "%</span>";
      }
      el.innerHTML = html;
      list.appendChild(el);
    });
  }

  function paintTries() {
    plateTries.innerHTML = "";
    for (var t = 0; t < TRIES; t++) {
      var i = A.el("i");
      if (t < guesses.length) i.className = right(guesses[t]) ? "won" : "used";
      plateTries.appendChild(i);
    }
  }

  function renderLadder() {
    ladder.innerHTML = "";
    for (var k = 0; k < HINTS; k++) {
      (function (k) {
        var hint = S.hints[k];
        if (!hint) return;
        // Once the round is over every rung opens up — the ladder becomes the
        // lesson — but only the ones actually bought were ever charged for.
        var bought = taken.indexOf(k) >= 0;
        var got = bought || over;
        var open = unlocked(k);
        var b = A.el("button", "rung" + (got ? " done" : open ? "" : " locked"));
        b.type = "button";
        var head = '<span class="n">' + (k + 1) + "</span>" +
          '<span class="lb">' + RUNG[k] + "</span>";
        if (got) {
          b.innerHTML = '<span class="hd">' + head + '<span class="cost">' +
            (bought ? (k === free ? "FREE" : "−" + HINT_COST) : "NOT CHARGED") + "</span></span>" +
            '<span class="hx">' + A.esc(hint) + "</span>";
          b.disabled = true;
        } else if (open) {
          b.innerHTML = head + '<span class="cost">READ · −' + HINT_COST + "</span>";
          b.setAttribute("aria-label", "Read hint " + (k + 1) + ", costs " + HINT_COST + " points");
          b.onclick = function () { takeHint(k); };
        } else {
          b.innerHTML = head + '<span class="cost mute">AFTER ' +
            (k + 1) + " MISS" + (k ? "ES" : "") + "</span>";
          b.disabled = true;
        }
        ladder.appendChild(b);
      })(k);
    }
  }

  /* ── persistence ───────────────────────────────────────────────────────── */

  function save() {
    if (practice || sandbox) return;
    A.save(ID, day, { guesses: guesses, taken: taken, free: free });
  }

  function restore() {
    var st = practice || sandbox ? null : A.load(ID, day);
    if (st) {
      guesses = (st.guesses || []).filter(function (i) { return !!CO[i]; });
      if (typeof st.free === "number") free = st.free;
      (st.taken || []).forEach(function (k) { if (taken.indexOf(k) < 0) taken.push(k); });
    }
    picker.setExclude(guesses);
    renderGuesses();
    renderLadder();
    paintTries();
    if (st && st.done) {
      over = true;
      picker.disable(true);
      said();
      renderLadder();
      setTimeout(function () { sheet(st.won, st.shareGrid, st.norm); }, 240);
    }
  }

  /* ── ending ────────────────────────────────────────────────────────────── */

  function end(won) {
    over = true;
    picker.disable(true);
    renderLadder();
    said();

    var n = guesses.length;
    var base = won ? NORM[n] : LOST;
    var norm = A.clamp(base - HINT_COST * paidHints(), won ? 5 : 0, 100);
    var grid = shareGrid();

    if (!practice && !sandbox) {
      A.finish(ID, day, {
        score: norm, norm: norm, won: won,
        detail: won ? n + "/" + TRIES : "X/" + TRIES,
        bucket: won ? n : "X",
        shareGrid: grid,
        durationMs: Date.now() - t0,
        stamps: won ? [guesses[n - 1]] : [],
      });
    } else if (won) { A.stamp(guesses[n - 1], ID); }

    if (won) { A.confetti(n <= 2 ? 130 : 70); A.sfx("stamp"); }
    sheet(won, grid, norm);
  }

  function shareGrid() {
    var cb = A.settings().colourblind;
    var line = "";
    guesses.forEach(function (iso) {
      if (right(iso)) { line += cb ? "🟦" : "🟩"; return; }
      var km = nearest(iso).km;
      line += km < 800 ? (cb ? "🟧" : "🟨") : km < 2500 ? "🟧" : "⬛";
    });
    for (var i = guesses.length; i < TRIES; i++) line += "⬜";
    var out = [line];
    if (taken.length) out.push(rep("💡", taken.length));
    return out;
  }

  function rep(s, n) { var o = ""; for (var i = 0; i < n; i++) o += s; return o; }

  // The card keeps the answer after the sheet is dismissed — the page itself
  // should still teach you what you were looking at.
  function said() {
    spec.classList.add("done");          // also releases the text for selection
    saidBox.innerHTML = '<div class="said"><div class="lg">' + A.esc(S.lang.toUpperCase()) + "</div>" +
      '<div class="mt">' + A.esc(S.script) + " · " + A.esc(S.family) + "<br>" +
      A.esc(speakers(S.speakers)) + " SPEAKERS</div>" +
      '<div class="gl">“' + A.esc(S.gloss) + "”</div></div>";
  }

  function sheet(won, grid, norm) {
    var hit = won ? guesses[guesses.length - 1] : null;
    var chips = S.countries.map(function (i) {
      var c = CO[i];
      if (!c) return "";
      return '<span class="' + (i === hit ? "hit" : "") + '">' +
        '<img alt="" src="' + A.rootPath() + "core/data/flags/" + i +
        '.svg" onerror="this.style.display=\'none\'">' + A.esc(c.n) + "</span>";
    }).join("");

    var url = srcURL(S);
    var extra =
      '<p class="rv-lang">' + A.esc(S.lang.toUpperCase()) + "</p>" +
      '<p class="rv-meta">' + A.esc(S.script) + "<br>" + A.esc(S.family) + " · " +
      A.esc(speakers(S.speakers)) + " SPEAKERS</p>" +
      '<p class="rv-gloss">“' + A.esc(S.gloss) + "”</p>" +
      '<div class="rv-where">' + chips + "</div>" +
      '<p class="rv-src">' + A.esc(srcLabel(S.src)) +
      (url ? ' · <a href="' + A.esc(url) + '" target="_blank" rel="noopener">source</a>' : "") +
      "</p>";
    if (won) {
      extra += '<p class="center tiny" style="color:var(--mint);margin-top:10px">🛂 ' +
        A.esc((CO[hit] || {}).n || hit) + " stamped in your passport</p>";
    }

    A.results(ID, practice || sandbox ? A.PRACTICE : day, {
      title: won ? (guesses.length === 1 ? "FIRST LOOK" : guesses.length <= 2 ? "SHARP" : "GOT IT")
        : "NOT THIS TIME",
      extraHTML: extra,
      state: { norm: norm, shareGrid: grid, won: won },
      shareText: "LINGUAGUESSR (practice)\n" + (grid || []).join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  /* ── labels ────────────────────────────────────────────────────────────── */

  // What the passage is, said without naming the language: the UDHR file name
  // carries the ISO 639-3 code, so it can never be shown while the game is on.
  function srcLabel(src) {
    if (/^UDHR/.test(src)) {
      var tail = (src.split("::")[1] || "").replace(/^\s*udhr_[a-z0-9_]+\.xml,?\s*/i, "").trim();
      return "UNIVERSAL DECLARATION OF HUMAN RIGHTS" + (tail ? " · " + tail.toUpperCase() : "");
    }
    if (/wikipedia/i.test(src)) return "WIKIPEDIA · OPENING LINES";
    return "REAL TEXT, SOURCED";
  }

  function srcURL(s) {
    var w = /([a-z-]+)\.wikipedia\.org REST summary of "([^"]+)"/.exec(s.src);
    if (w) return "https://" + w[1] + ".wikipedia.org/wiki/" + encodeURIComponent(w[2]);
    if (/^UDHR/.test(s.src)) return "https://github.com/eric-muller/udhr";
    return null;
  }

  function speakers(n) {
    if (!n) return "—";
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + " BILLION";
    if (n >= 1e6) return Math.round(n / 1e6) + " MILLION";
    if (n >= 1e3) return Math.round(n / 1e3) + ",000";
    return String(n);
  }

  function pad(n) { return (n < 10 ? "00" : n < 100 ? "0" : "") + n; }

  /* ── debug hooks — drive a whole game, or audit every script, headlessly ── */

  window.__LG = {
    sample: function () { return S; },
    answer: function () { return { key: S.key, lang: S.lang, countries: S.countries.slice() }; },
    guess: guess,
    hint: takeHint,
    solve: function () { guess(S.countries[0]); },
    fit: fit,
    pool: function () { return { samples: SAMPLES.length, countries: POOL.length }; },
    state: function () {
      return {
        day: day, practice: practice, sandbox: sandbox, key: S.key, sc: S.sc,
        font: fontFor(S), lang: bcp47(S), dir: RTL[S.sc] ? "rtl" : "ltr",
        px: specTxt.style.fontSize, guesses: guesses.slice(), taken: taken.slice(),
        free: free, over: over, wrong: wrongCount(),
      };
    },
    // Load any sample by key. Never saves, never scores — for verification.
    show: function (key) {
      var hit = SAMPLES.filter(function (s) { return s.key === key; })[0];
      if (!hit) return null;
      sandbox = true; S = hit; guesses = []; taken = []; free = -1; over = false;
      picker.disable(false); picker.setExclude([]);
      spec.classList.remove("done");
      noFontBox.innerHTML = ""; saidBox.innerHTML = "";
      spec.querySelector(".id").textContent = "SPECIMEN ∞";
      spec.querySelector(".foot").textContent = srcLabel(S.src);
      paintSpecimen(); renderGuesses(); renderLadder();
      return S.key + " · " + S.lang + " · " + S.sc;
    },
    // Every sample, in its own font, on one page: the visual font audit.
    contactSheet: function () {
      var host = A.el("div");
      host.style.cssText = "max-width:900px;margin:0 auto;padding:8px 0";
      SAMPLES.forEach(function (s) {
        var box = A.el("div");
        box.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:8px 10px;" +
          "margin-bottom:6px;background:#ffffff06";
        var tag = A.el("div");
        tag.style.cssText = "font-size:9px;letter-spacing:1px;color:var(--ink4)";
        tag.textContent = s.sc + " · " + s.lang + (isTofu(s.text, fontFor(s)) ? " · ⚠︎ TOFU" : "");
        var t = A.el("div");
        t.textContent = s.text.slice(0, 46);
        t.setAttribute("lang", bcp47(s));
        t.setAttribute("dir", RTL[s.sc] ? "rtl" : "ltr");
        t.style.cssText = "font-family:" + fontFor(s) + ";font-size:" +
          Math.round(19 * (SCALE[s.key] || SCALE[s.sc] || 1)) + "px;line-height:" +
          (LEAD[s.key] || LEAD[s.sc] || 1.6) + ";color:var(--ink);margin-top:2px;" +
          "overflow:hidden;white-space:nowrap;text-overflow:ellipsis";
        box.appendChild(tag); box.appendChild(t); host.appendChild(box);
      });
      main.innerHTML = "";
      main.appendChild(host);
      return SAMPLES.length;
    },
    // Which samples would show boxes on this device?
    audit: function () {
      var bad = [], byScript = {};
      SAMPLES.forEach(function (s) {
        var t = isTofu(s.text, fontFor(s));
        byScript[s.sc] = byScript[s.sc] || { ok: 0, tofu: 0 };
        byScript[s.sc][t ? "tofu" : "ok"]++;
        if (t) bad.push(s.sc + ":" + s.lang);
      });
      return { samples: SAMPLES.length, scripts: Object.keys(byScript).length, tofu: bad, byScript: byScript };
    },
  };
})();
