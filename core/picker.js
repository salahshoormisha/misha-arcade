/* ============================================================================
   MIDNIGHT ARCADE · DAILY WING — the country picker
   One type-ahead used by FLAGLE, GLOBLE, OUTLINE, TRADLE, PICK 5, FOODGUESSR,
   CLUEDROP, LINGUAGUESSR and the quizzes. Getting this right once means every
   geo game feels the same and forgives the same typos.

     var p = A.picker(host, { onPick: function (iso, rec) {...} });

   Matching is deliberately generous: "usa", "holland", "burma", "ivory coast",
   "persia", "uae", "drc", "s korea", "cote d'ivoire" all resolve. Diacritics
   are stripped both ways, so "curacao" finds "Curaçao".
   ========================================================================== */
(function (A) {
  "use strict";

  var norm = A.normName;   // defined in arcade.js — every game can compare names

  // Extra ways people actually type countries, beyond the dataset's own aliases.
  var EXTRA = {
    US: ["usa", "us", "united states", "america", "the states"],
    GB: ["uk", "britain", "great britain", "england", "scotland", "wales", "northern ireland"],
    AE: ["uae", "emirates"],
    IR: ["persia"],
    NL: ["holland"],
    MM: ["burma"],
    CI: ["ivory coast"],
    CD: ["drc", "congo kinshasa", "zaire"],
    CG: ["congo brazzaville"],
    KR: ["s korea", "south korea", "korea"],
    KP: ["n korea", "north korea"],
    CZ: ["czech republic", "czechia"],
    SZ: ["swaziland"],
    MK: ["macedonia"],
    CV: ["cape verde"],
    TL: ["east timor"],
    TR: ["turkey", "turkiye"],
    VA: ["vatican"],
    RU: ["russia"],
    SY: ["syria"],
    LA: ["laos"],
    BN: ["brunei"],
    TZ: ["tanzania"],
    BO: ["bolivia"],
    VE: ["venezuela"],
    ST: ["sao tome"],
    DO: ["dominican republic"],
    CF: ["car", "central african republic"],
  };

  function index() {
    if (A._pickIndex) return A._pickIndex;
    var out = [];
    (window.AD_COUNTRIES || []).forEach(function (c) {
      var names = [c.n].concat(c.alt || []).concat(EXTRA[c.i] || []);
      out.push({
        i: c.i, rec: c, name: c.n,
        keys: names.map(norm).filter(Boolean).concat([norm(c.i), norm(c.n3 || "")]),
        pop: c.pop || 0,
      });
    });
    A._pickIndex = out;
    return out;
  }

  A.findCountry = function (text) {
    var q = norm(text);
    if (!q) return null;
    var idx = index(), exact = null;
    for (var i = 0; i < idx.length; i++) {
      if (idx[i].keys.indexOf(q) >= 0) { exact = idx[i]; break; }
    }
    return exact ? exact.rec : null;
  };

  A.search = function (text, opts) {
    opts = opts || {};
    var q = norm(text);
    if (!q) return [];
    var pool = opts.pool ? {} : null;
    if (pool) opts.pool.forEach(function (i) { pool[i] = 1; });
    var ex = {};
    (opts.exclude || []).forEach(function (i) { ex[i] = 1; });

    var hits = [];
    index().forEach(function (e) {
      if (pool && !pool[e.i]) return;
      if (ex[e.i]) return;
      if (opts.unOnly !== false && e.rec.un !== 1 && !(pool && pool[e.i])) return;
      var best = 99;
      for (var k = 0; k < e.keys.length; k++) {
        var key = e.keys[k];
        if (!key) continue;
        if (key === q) { best = Math.min(best, 0); }
        else if (key.indexOf(q) === 0) { best = Math.min(best, 1); }
        else if (key.indexOf(" " + q) > 0) { best = Math.min(best, 2); }
        else if (key.indexOf(q) > 0) { best = Math.min(best, 3); }
      }
      if (best < 99) hits.push({ e: e, r: best });
    });
    hits.sort(function (a, b) { return a.r - b.r || b.e.pop - a.e.pop; });
    return hits.slice(0, opts.max || 8).map(function (h) { return h.e.rec; });
  };

  /**
   * A.picker(host, opts) → { el, input, focus, clear, setExclude, disable }
   * opts: onPick(iso, rec), pool, exclude, placeholder, flags, max, unOnly
   */
  A.picker = function (host, opts) {
    opts = opts || {};
    var wrap = A.el("div", "ac-picker");
    wrap.innerHTML =
      '<input type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" ' +
      'placeholder="' + A.esc(opts.placeholder || "type a country…") + '" aria-label="Guess a country">' +
      '<div class="sug" role="listbox"></div>';
    host.appendChild(wrap);

    var input = wrap.querySelector("input");
    var sug = wrap.querySelector(".sug");
    var exclude = (opts.exclude || []).slice();
    var list = [], sel = -1, locked = false;

    function render() {
      if (!list.length) { sug.innerHTML = ""; sug.classList.remove("on"); return; }
      sug.innerHTML = list.map(function (c, i) {
        return '<button type="button" role="option" class="' + (i === sel ? "sel" : "") + '" data-i="' + c.i + '">' +
          (opts.flags === false ? "" : '<img alt="" src="' + A.rootPath() + "core/data/flags/" + c.i + '.svg" ' +
            'onerror="this.style.visibility=\'hidden\'">') +
          "<span>" + A.esc(c.n) + "</span></button>";
      }).join("");
      sug.classList.add("on");
      A.$$("button", sug).forEach(function (b) {
        b.onclick = function () { choose(b.getAttribute("data-i")); };
      });
    }

    function update() {
      list = locked ? [] : A.search(input.value, {
        pool: opts.pool, exclude: exclude, max: opts.max || 8, unOnly: opts.unOnly,
      });
      sel = list.length ? 0 : -1;
      render();
    }

    function choose(iso) {
      if (locked) return;
      var rec = (window.AD_COUNTRIES || []).filter(function (c) { return c.i === iso; })[0];
      if (!rec) return;
      input.value = "";
      list = []; sel = -1; render();
      if (opts.onPick) opts.onPick(iso, rec);
    }

    input.addEventListener("input", update);
    input.addEventListener("focus", update);
    input.addEventListener("blur", function () { setTimeout(function () { sug.classList.remove("on"); }, 160); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(list.length - 1, sel + 1); render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); render(); }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (sel >= 0 && list[sel]) return choose(list[sel].i);
        var exact = A.findCountry(input.value);
        if (exact && exclude.indexOf(exact.i) < 0) return choose(exact.i);
        if (input.value.trim()) A.toast("No country like that", true);
      } else if (e.key === "Escape") { list = []; render(); input.blur(); }
    });

    return {
      el: wrap, input: input,
      focus: function () { try { input.focus(); } catch (e) {} },
      clear: function () { input.value = ""; update(); },
      setExclude: function (l) { exclude = (l || []).slice(); update(); },
      disable: function (on) {
        locked = !!on;
        input.disabled = !!on;
        wrap.style.opacity = on ? ".5" : "";
        if (on) { list = []; render(); }
      },
    };
  };

  /* styles — injected once so games don't each restate them */
  var css = document.createElement("style");
  css.textContent =
    ".ac-picker{position:relative;max-width:340px;margin:0 auto;width:100%}" +
    ".ac-picker input{width:100%;background:#ffffff10;border:1px solid var(--line2);border-radius:999px;" +
    "padding:13px 18px;color:var(--ink);font-size:15px;text-align:center;min-height:48px}" +
    ".ac-picker input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 16px var(--glow)}" +
    ".ac-picker .sug{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:30;display:none;" +
    "background:linear-gradient(180deg,#1d1040,#150b30);border:1px solid var(--line2);border-radius:12px;" +
    "overflow:hidden;box-shadow:0 14px 40px #000a;max-height:270px;overflow-y:auto}" +
    ".ac-picker .sug.on{display:block}" +
    ".ac-picker .sug button{display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;" +
    "padding:10px 13px;color:var(--ink2);font-size:13.5px;cursor:pointer;text-align:left;min-height:44px}" +
    ".ac-picker .sug button.sel,.ac-picker .sug button:hover{background:var(--glow);color:#fff}" +
    ".ac-picker .sug img{width:26px;height:17px;object-fit:cover;border-radius:2px;flex:0 0 auto}";
  document.head.appendChild(css);

})(window.A);
