/* ============================================================================
   MIDNIGHT ARCADE · DAILY WING — shared UI kit
   Header, modals, toasts, on-screen keyboard, stats panel, result sheet,
   settings, archive picker, confetti. Extends the `A` global from arcade.js.
   ========================================================================== */
(function (A, root) {
  "use strict";
  if (!A) throw new Error("ui.js needs arcade.js first");

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  A.el = el;
  A.$ = function (s, r) { return (r || document).querySelector(s); };
  A.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── how deep are we? (games live two levels below the arcade root) ───── */
  A.rootPath = function () {
    var p = location.pathname;
    if (/\/games\/[^/]+\/?[^/]*$/.test(p)) return "../../";
    if (/\/(daily|league|passport)\/?[^/]*$/.test(p)) return "../";
    return "./";
  };

  /* ── toasts ──────────────────────────────────────────────────────────── */

  var toastHost = null;
  A.toast = function (msg, bad) {
    if (!toastHost) {
      toastHost = el("div", "ac-toast-host");
      document.body.appendChild(toastHost);
    }
    var t = el("div", "ac-toast" + (bad ? " bad" : ""), A.esc(msg));
    toastHost.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .25s"; t.style.opacity = "0";
      setTimeout(function () { t.remove(); }, 260);
    }, bad ? 2200 : 1500);
  };

  /* ── modal ───────────────────────────────────────────────────────────── */

  A.modal = function (title, html, opts) {
    opts = opts || {};
    var wrap = el("div", "ac-modal");
    var box = el("div", "box");
    var x = el("button", "x", "✕");
    x.setAttribute("aria-label", "Close");
    box.appendChild(x);
    if (title) box.appendChild(el("h2", null, A.esc(title)));
    var body = el("div", "body");
    body.innerHTML = html || "";
    box.appendChild(body);
    wrap.appendChild(box);
    document.body.appendChild(wrap);
    // Force a reflow, then show synchronously. Using requestAnimationFrame here
    // would leave the modal invisible forever in a backgrounded tab (rAF is
    // paused when the page is hidden) — the game would look like it had hung.
    void wrap.offsetWidth;
    wrap.classList.add("show");

    function close() {
      wrap.classList.remove("show");
      setTimeout(function () { wrap.remove(); }, 200);
      document.removeEventListener("keydown", onKey);
      if (opts.onClose) opts.onClose();
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    x.onclick = close;
    wrap.addEventListener("click", function (e) { if (e.target === wrap && !opts.sticky) close(); });
    document.addEventListener("keydown", onKey);
    return { el: wrap, body: body, close: close };
  };

  /* ── header ──────────────────────────────────────────────────────────── */

  /**
   * A.mount({ id, title, sub, help, onStats })
   * Builds the standard chrome and returns the <main> element to fill.
   */
  A.mount = function (opts) {
    opts = opts || {};
    var g = opts.id ? A.game(opts.id) : null;
    var accent = opts.accent || (g && g.accent) || "--hot";
    document.documentElement.style.setProperty("--accent", "var(" + accent + ")");
    document.documentElement.style.setProperty("--glow", glowFor(accent));

    var h = el("header", "ac-header");
    var back = el("a", "back", "");           // chevron drawn in CSS
    back.href = A.rootPath();
    back.title = "Back to the arcade";
    back.setAttribute("aria-label", "Back to the arcade");
    h.appendChild(back);
    h.appendChild(el("h1", null, A.esc(opts.title || (g && g.name) || "ARCADE")));

    // Line icons rather than emoji — emoji as UI chrome is the single fastest
    // way to make an interface look unconsidered, and it renders differently
    // on every platform.
    var ICON = {
      help: '<svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" ' +
        'stroke-width="1.6" stroke-linecap="round"><circle cx="10" cy="10" r="7.5"/>' +
        '<path d="M7.8 7.6a2.2 2.2 0 1 1 3.1 2c-.6.4-.9.9-.9 1.6"/><circle cx="10" cy="14.6" r=".85" fill="currentColor" stroke="none"/></svg>',
      stats: '<svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" ' +
        'stroke-width="1.6" stroke-linecap="round"><path d="M3.5 16.5v-5m5 5V5m5 11.5v-8"/></svg>',
      cog: '<svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" ' +
        'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="2.6"/>' +
        '<path d="M10 2.6v2m0 10.8v2M2.6 10h2m10.8 0h2M4.8 4.8l1.4 1.4m7.6 7.6 1.4 1.4m0-10.4-1.4 1.4M6.2 13.8l-1.4 1.4"/></svg>',
    };
    var tools = el("div", "tools");
    if (opts.help) {
      var qb = el("button", "ac-ico", ICON.help);
      qb.title = "How to play";
      qb.setAttribute("aria-label", "How to play");
      qb.onclick = function () { A.modal("How to play", opts.help); };
      tools.appendChild(qb);
    }
    if (opts.id) {
      var sb = el("button", "ac-ico", ICON.stats);
      sb.title = "Stats";
      sb.setAttribute("aria-label", "Stats");
      sb.onclick = function () { A.statsModal(opts.id); };
      tools.appendChild(sb);
    }
    var gb = el("button", "ac-ico", ICON.cog);
    gb.title = "Settings";
    gb.setAttribute("aria-label", "Settings");
    gb.onclick = function () { A.settingsModal(); };
    tools.appendChild(gb);
    h.appendChild(tools);
    document.body.appendChild(h);

    if (opts.sub !== null) {
      var sub = el("div", "ac-sub", opts.sub || subLine(opts));
      sub.id = "ac-sub";
      document.body.appendChild(sub);
    }

    var main = el("main", "ac-wrap" + (opts.wide ? " wide" : ""));
    document.body.appendChild(main);

    // Global error toast — invaluable for debugging on her machine remotely.
    root.addEventListener("error", function (e) {
      A.toast((e.message || "Something went wrong"), true);
    });
    return main;
  };

  function subLine(opts) {
    var d = opts.dayN === undefined ? A.dayNumber() : opts.dayN;
    if (d === A.PRACTICE) return "Practice · unlimited";
    return "Day " + d + " · " + A.prettyDate(d);
  }
  A.subLine = subLine;

  A.setSub = function (text) {
    var s = document.getElementById("ac-sub");
    if (s) s.innerHTML = text;
  };

  // The redesign removed glows. Cabinets still set --glow, so it resolves to
  // a transparent value rather than being left undefined.
  function glowFor() { return "transparent"; }

  /* ── on-screen keyboard ──────────────────────────────────────────────── */

  var ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  /**
   * A.keyboard({ onKey(ch), onEnter(), onBack(), enter:"ENTER", host })
   * Returns { el, paint(states), set(ch,state) } where states is {A:"ok",...}
   */
  A.keyboard = function (opts) {
    opts = opts || {};
    var wrap = el("div", "ac-kbd");
    var btns = {};
    ROWS.forEach(function (row, ri) {
      var r = el("div", "krow");
      if (ri === 2) r.appendChild(mk(opts.enter || "ENTER", "wide", function () { opts.onEnter && opts.onEnter(); }));
      row.split("").forEach(function (ch) {
        var b = mk(ch, "", function () { opts.onKey && opts.onKey(ch); });
        btns[ch] = b; r.appendChild(b);
      });
      if (ri === 2) r.appendChild(mk("⌫", "wide", function () { opts.onBack && opts.onBack(); }));
      wrap.appendChild(r);
    });
    function mk(label, cls, fn) {
      var b = el("button", cls, label);
      b.type = "button";
      b.setAttribute("aria-label", label === "⌫" ? "Backspace" : label);
      b.addEventListener("click", function (e) { e.preventDefault(); fn(); b.blur(); });
      return b;
    }
    (opts.host || document.body).appendChild(wrap);

    var api = {
      el: wrap,
      paint: function (states) {
        Object.keys(btns).forEach(function (ch) {
          var s = states[ch];
          btns[ch].className = s || "";
        });
      },
      disable: function (on) { wrap.style.pointerEvents = on ? "none" : ""; wrap.style.opacity = on ? ".55" : ""; },
    };

    if (!opts.noPhysical) {
      document.addEventListener("keydown", function (e) {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (document.querySelector(".ac-modal.show")) return;
        if (e.key === "Enter") { e.preventDefault(); opts.onEnter && opts.onEnter(); }
        else if (e.key === "Backspace") { e.preventDefault(); opts.onBack && opts.onBack(); }
        else if (/^[a-zA-Z]$/.test(e.key)) { opts.onKey && opts.onKey(e.key.toUpperCase()); }
      });
    }
    return api;
  };

  /* ── stats ───────────────────────────────────────────────────────────── */

  A.statsHTML = function (gameId) {
    var s = A.stats(gameId), g = A.game(gameId) || {};
    var h = '<div class="ac-stats">' +
      st(s.played, "Played") + st(s.winPct + "%", "Win rate") +
      st(s.streak, "Streak") + st(s.maxStreak, "Best") + st(s.avgNorm, "Average") +
      "</div>";
    var keys = Object.keys(s.curve);
    if (keys.length) {
      keys.sort(function (a, b) { return isNaN(a) || isNaN(b) ? String(a).localeCompare(b) : a - b; });
      var max = Math.max.apply(null, keys.map(function (k) { return s.curve[k]; }));
      var today = A.load(gameId, A.dayNumber());
      h += '<div class="ac-dist">';
      keys.forEach(function (k) {
        var n = s.curve[k], w = Math.max(8, Math.round(100 * n / max));
        var hi = today && today.done && String(today.bucket) === k;
        h += '<div class="d' + (hi ? " hi" : "") + '"><i>' + A.esc(k) + '</i>' +
          '<u style="width:' + w + '%">' + n + "</u></div>";
      });
      h += "</div>";
    }
    if (g.distLabel) h += '<p class="tiny dim center" style="margin-top:8px">' + A.esc(g.distLabel) + "</p>";
    return h;
    function st(v, l) { return "<div><b>" + v + "</b><span>" + l + "</span></div>"; }
  };

  A.statsModal = function (gameId) {
    var g = A.game(gameId) || {};
    var html = A.statsHTML(gameId);
    var rs = A.runStreak();
    html += '<p class="tiny dim center" style="margin-top:14px">Arcade run: <b>' + rs.current +
      "</b> day" + (rs.current === 1 ? "" : "s") + " · best <b>" + rs.max + "</b> · " + rs.total + " days played</p>";
    html += '<div class="ac-row" style="margin-top:14px">' +
      '<button class="ac-btn ghost sm" id="ac-arch">Archive</button>' +
      '<a class="ac-btn ghost sm" href="' + A.rootPath() + 'daily/">Today\'s run</a>' +
      "</div>";
    var m = A.modal((g.name || gameId) + " · stats", html);
    var ab = m.body.querySelector("#ac-arch");
    if (ab) ab.onclick = function () { m.close(); A.archiveModal(gameId); };
    return m;
  };

  /* ── archive picker ──────────────────────────────────────────────────── */

  A.archiveModal = function (gameId, opts) {
    opts = opts || {};
    var today = A.dayNumber();
    var html = '<p class="tiny muted center">Every day since the arcade opened. Playing an old one ' +
      "counts for your stats but not your streak.</p><div id='ac-days' style='display:grid;" +
      "grid-template-columns:repeat(auto-fill,minmax(46px,1fr));gap:6px;margin-top:12px'></div>";
    var m = A.modal("Archive", html);
    var host = m.body.querySelector("#ac-days");
    for (var d = today; d >= 0; d--) {
      (function (d) {
        var st = A.load(gameId, d);
        var b = el("button", "ac-pill", String(d));
        b.style.cssText = "justify-content:center;cursor:pointer;padding:9px 0;font-size:11px";
        if (st && st.done) {
          b.style.borderColor = st.won ? "var(--ok)" : "var(--bad)";
          b.style.color = "#fff";
          b.title = A.dateFromDay(d) + " — " + (st.detail || "");
        } else { b.title = A.dateFromDay(d); }
        if (d === today) { b.innerHTML = "<b>" + d + "</b>"; b.style.background = "var(--glow)"; }
        b.onclick = function () {
          m.close();
          if (opts.onPick) opts.onPick(d);
          else location.search = "?d=" + d;
        };
        host.appendChild(b);
      })(d);
    }
    return m;
  };

  // Read ?d= / ?practice from the URL — every game supports both.
  A.requestedDay = function () {
    var q = new URLSearchParams(location.search);
    if (q.has("practice") || q.has("p")) return A.PRACTICE;
    var d = q.get("d");
    if (d !== null && d !== "" && !isNaN(+d)) return A.clamp(Math.floor(+d), 0, A.dayNumber());
    return A.dayNumber();
  };

  /* ── result sheet ────────────────────────────────────────────────────── */

  /**
   * A.results(gameId, dayN, { title, lines, extraHTML, onReplay })
   * The shared end-of-game sheet: score, share, countdown, next steps.
   */
  A.results = function (gameId, dayN, opts) {
    opts = opts || {};
    var st = A.load(gameId, dayN) || opts.state || {};
    var g = A.game(gameId) || {};
    var practice = dayN === A.PRACTICE;

    var h = '<div class="center"><div class="ac-score">' + (st.norm || 0) +
      "<small>" + A.esc(opts.title || (st.won ? "NICE" : "TOMORROW, THEN")) + "</small></div></div>";

    if (opts.lines && opts.lines.length) {
      h += '<p class="center tiny muted" style="margin-top:10px">' +
        opts.lines.map(A.esc).join("<br>") + "</p>";
    }
    if (st.shareGrid && st.shareGrid.length) {
      h += '<div class="ac-grid-share">' + st.shareGrid.map(A.esc).join("\n") + "</div>";
    }
    if (opts.extraHTML) h += opts.extraHTML;

    if (!practice) {
      // Par first — it's the number they actually want to beat.
      var pr = A.par(gameId, dayN);
      var mine = st.norm || 0;
      var d = mine - pr.par;
      var best = A.stats(gameId).bestNorm || 0;
      h += '<div class="ac-row" style="margin-top:10px">' +
        '<span class="ac-pill">PAR <b>' + pr.par + "</b></span>" +
        '<span class="ac-pill' + (d >= 0 ? " on" : "") + '">' +
        (d >= 0 ? "+" : "−") + "<b>" + Math.abs(d) + "</b> v par" + "</span>" +
        (mine >= best && mine > 0 ? '<span class="ac-pill on">Personal best</span>'
          : '<span class="ac-pill">Best <b>' + best + "</b></span>") +
        "</div>" +
        '<p class="tiny dim center" style="margin-top:5px">par from ' + A.esc(pr.source) + "</p>";

      var c = A.card(dayN);
      h += '<div class="ac-row" style="margin-top:8px"><span class="ac-pill">TODAY\'S CARD <b>' +
        c.total + "</b>/100</span><span class=\"ac-pill\">" + c.played + " game" +
        (c.played === 1 ? "" : "s") + "</span></div>";
    }

    h += '<div class="ac-row" style="margin-top:16px">' +
      '<button class="ac-btn" id="ac-share">Share</button>' +
      (practice ? '<button class="ac-btn ghost" id="ac-again">Play again</button>'
        : '<a class="ac-btn ghost" href="' + A.rootPath() + 'league/">Misha v David</a>') +
      "</div>";

    if (!practice) {
      h += '<div class="ac-row" style="margin-top:8px">' +
        '<a class="ac-btn ghost sm" href="' + A.rootPath() + 'daily/">Next game →</a>' +
        (g.hasPractice ? '<a class="ac-btn ghost sm" href="?practice=1">Practice</a>' : "") +
        "</div><div class='ac-next center' id='ac-cd'></div>";
    }

    var m = A.modal(null, h, opts.modalOpts);
    var sb = m.body.querySelector("#ac-share");
    if (sb) sb.onclick = function () {
      A.share(practice ? (opts.shareText || "") : A.shareCard(gameId, dayN));
    };
    var ag = m.body.querySelector("#ac-again");
    if (ag) ag.onclick = function () { m.close(); opts.onReplay ? opts.onReplay() : location.reload(); };

    var cd = m.body.querySelector("#ac-cd");
    if (cd) {
      var tick = function () {
        var ms = A.msToMidnight();
        var hh = Math.floor(ms / 3600000), mm = Math.floor(ms % 3600000 / 60000), ss = Math.floor(ms % 60000 / 1000);
        cd.textContent = "Next puzzle in " + hh + "h " + mm + "m " + ss + "s";
      };
      tick();
      var iv = setInterval(function () {
        if (!document.body.contains(cd)) return clearInterval(iv);
        tick();
      }, 1000);
    }
    if (A.backupDue()) {
      var warn = el("p", "tiny center", 'Your stats live only in this browser — ' +
        '<a href="#" id="ac-bk">save a backup</a>');
      warn.style.cssText = "margin-top:12px;color:var(--gold)";
      m.body.appendChild(warn);
      warn.querySelector("#ac-bk").onclick = function (e) { e.preventDefault(); A.backupNow(); A.toast("Backup saved to Downloads"); };
    }
    return m;
  };

  /* ── settings ────────────────────────────────────────────────────────── */

  A.settingsModal = function () {
    var s = A.settings();
    var h = "";
    h += row("player", "Who's playing", '<input id="sv-player" value="' + A.esc(s.player) +
      '" placeholder="your name" style="background:#ffffff10;border:1px solid var(--line2);' +
      'border-radius:8px;padding:8px 10px;width:130px;text-align:right">');
    h += tog("hardMode", "Hard mode", s.hardMode, "revealed hints must be reused");
    h += tog("colourblind", "High contrast", s.colourblind, "blue/orange instead of green/yellow");
    h += tog("sound", "Sound", s.sound);
    h += tog("reduceMotion", "Reduce motion", s.reduceMotion);
    h += tog("glam", "Glam mode", s.glam);
    h += '<hr style="border:none;border-top:1px solid var(--line);margin:16px 0">';
    h += '<p class="tiny muted">Everything you\'ve played lives in <b>this browser only</b>. ' +
      "Keep a backup — it takes one tap.</p>";
    h += '<div class="ac-row" style="margin-top:10px">' +
      '<button class="ac-btn ghost sm" id="sv-bk">Back up</button>' +
      '<button class="ac-btn ghost sm" id="sv-rs">Restore</button>' +
      '<button class="ac-btn ghost sm" id="sv-code">Sync code</button></div>';
    var last = s.lastBackup ? new Date(s.lastBackup).toLocaleDateString() : "never";
    h += '<p class="tiny dim center" style="margin-top:8px">last backup: ' + last + "</p>";

    var m = A.modal("Settings", h);
    var q = function (id) { return m.body.querySelector(id); };

    q("#sv-player").onchange = function () { A.set("player", this.value.trim().slice(0, 18)); A.toast("Hello, " + (this.value.trim() || "player")); };
    A.$$(".sv-tog", m.body).forEach(function (b) {
      b.onclick = function () {
        var k = b.getAttribute("data-k");
        var v = !A.settings()[k];
        A.set(k, v);
        b.classList.toggle("on", v);
        b.textContent = v ? "On" : "Off";
      };
    });
    q("#sv-bk").onclick = function () { A.backupNow(); A.toast("Saved to Downloads"); };
    q("#sv-rs").onclick = function () {
      var i = el("input"); i.type = "file"; i.accept = ".json,application/json";
      i.onchange = function () {
        var f = i.files[0]; if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          if (A.restore(r.result)) { A.toast("Restored — reloading"); setTimeout(function () { location.reload(); }, 700); }
          else A.toast("That file isn't an arcade backup", true);
        };
        r.readAsText(f);
      };
      i.click();
    };
    q("#sv-code").onclick = function () {
      var code = A.syncCode();
      var mm = A.modal("Sync code", '<p class="tiny muted">Paste this into the same box on another ' +
        "browser or device to copy your whole arcade across. It's long — use the copy button.</p>" +
        '<textarea id="sc" style="width:100%;height:110px;background:#0d0620;border:1px solid var(--line2);' +
        'border-radius:8px;color:var(--ink3);font-size:9px;padding:8px" spellcheck="false">' + A.esc(code) +
        '</textarea><div class="ac-row" style="margin-top:10px">' +
        '<button class="ac-btn sm" id="sc-copy">Copy</button>' +
        '<button class="ac-btn ghost sm" id="sc-apply">Apply pasted code</button></div>');
      mm.body.querySelector("#sc-copy").onclick = function () { A.copy(code).then(function () { A.toast("Copied"); }); };
      mm.body.querySelector("#sc-apply").onclick = function () {
        var v = mm.body.querySelector("#sc").value.trim();
        if (v && v !== code && A.applySyncCode(v)) { A.toast("Restored — reloading"); setTimeout(function () { location.reload(); }, 700); }
        else A.toast("That code didn't parse", true);
      };
    };
    return m;

    function row(k, label, ctrl) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;' +
        'border-bottom:1px solid #ffffff0d"><span style="font-size:12px;letter-spacing:1.4px">' + label +
        "</span>" + ctrl + "</div>";
    }
    function tog(k, label, on, note) {
      return row(k, label + (note ? '<br><span class="tiny dim" style="letter-spacing:0">' + note + "</span>" : ""),
        '<button class="ac-pill sv-tog' + (on ? " on" : "") + '" data-k="' + k + '" style="cursor:pointer;min-width:56px;justify-content:center">' +
        (on ? "On" : "Off") + "</button>");
    }
  };

  /* ── confetti ────────────────────────────────────────────────────────── */

  A.confetti = function (n, opts) {
    if (A.settings().reduceMotion) return;
    opts = opts || {};
    var cvs = document.getElementById("ac-cf");
    if (!cvs) {
      cvs = el("canvas", "ac-confetti");
      cvs.id = "ac-cf";
      document.body.appendChild(cvs);
    }
    cvs.width = innerWidth; cvs.height = innerHeight;
    var cx = cvs.getContext("2d");
    var C = opts.colours || ["#ff4fa3", "#ffd1ec", "#b18cff", "#4fd8ff", "#ffd84f", "#7dffa8"];
    var bits = [];
    for (var i = 0; i < (n || 90); i++) bits.push({
      x: innerWidth / 2 + (Math.random() - .5) * 300, y: innerHeight * .34,
      vx: (Math.random() - .5) * 420, vy: -170 - Math.random() * 400,
      r: 3 + Math.random() * 5, c: C[i % C.length], rot: Math.random() * 6, ttl: 2.2,
      heart: Math.random() < (opts.hearts === undefined ? .25 : opts.hearts),
    });
    var last = performance.now();
    (function loop(t) {
      var dt = Math.min(.05, (t - last) / 1000); last = t;
      cx.clearRect(0, 0, cvs.width, cvs.height);
      bits = bits.filter(function (b) { return (b.ttl -= dt) > 0; });
      bits.forEach(function (b) {
        b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 900 * dt; b.rot += dt * 6;
        cx.globalAlpha = Math.min(1, b.ttl);
        if (b.heart) { cx.font = (b.r * 4) + "px serif"; cx.fillText("💗", b.x, b.y); }
        else {
          cx.save(); cx.translate(b.x, b.y); cx.rotate(b.rot);
          cx.fillStyle = b.c; cx.fillRect(-b.r, -b.r / 2, b.r * 2, b.r); cx.restore();
        }
      });
      cx.globalAlpha = 1;
      if (bits.length) requestAnimationFrame(loop);
      else cx.clearRect(0, 0, cvs.width, cvs.height);
    })(last);
  };

  /* ── the share card, as an actual image ───────────────────────────────────
     An emoji grid is fine for one game, but a whole day across twenty of them
     is emoji soup in a message thread. So the day's card also renders as a
     designed 1080px PNG, shared via the native sheet where that supports files
     and downloaded where it doesn't. Drawn on the same palette as the site.  */

  var CARD_INK = "#f5f2f8", CARD_INK2 = "#bdb6cb", CARD_INK3 = "#8b8399",
      CARD_BG = "#0a0910", CARD_S1 = "#171423", CARD_HAIR = "rgba(255,255,255,.09)";

  function accentHex(token) {
    return ({
      "--hot": "#ff5c9d", "--cool": "#56c8f5", "--gold": "#efbe5a",
      "--mint": "#4ecb8f", "--violet": "#a78bfa",
    })[token] || "#ff5c9d";
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  var DISPLAY = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif';

  /**
   * A.cardImage(dayN) → Promise<Blob>  (1080 x 1080 PNG)
   * The day's results as a card you'd actually want to send someone.
   */
  A.cardImage = function (dayN) {
    if (dayN === undefined) dayN = A.dayNumber();
    var c = A.card(dayN), rs = A.runStreak();
    var played = (A.registry || []).filter(function (g) { return c.results[g.id]; });

    var W = 1080, H = 1080, PAD = 84;
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var g = cv.getContext("2d");

    // ground
    g.fillStyle = CARD_BG; g.fillRect(0, 0, W, H);
    var lift = g.createRadialGradient(W / 2, -H * 0.28, 0, W / 2, -H * 0.28, H * 1.05);
    lift.addColorStop(0, "#2a2140"); lift.addColorStop(0.45, "#141122"); lift.addColorStop(1, CARD_BG);
    g.fillStyle = lift; g.fillRect(0, 0, W, H);

    // masthead
    g.textBaseline = "alphabetic";
    g.strokeStyle = "#ff5c9d"; g.lineWidth = 4;
    g.beginPath(); g.arc(PAD + 15, PAD + 14, 15, 0, 6.2832); g.stroke();
    g.fillStyle = "#ff5c9d";
    g.beginPath(); g.arc(PAD + 15, PAD + 14, 7, 0, 6.2832); g.fill();
    g.fillStyle = CARD_INK3;
    g.font = "600 22px " + DISPLAY;
    g.letterSpacing && (g.letterSpacing = "5px");
    g.fillText("MIDNIGHT ARCADE", PAD + 44, PAD + 22);
    g.letterSpacing && (g.letterSpacing = "0px");

    g.fillStyle = CARD_INK3;
    g.font = "500 24px " + DISPLAY;
    g.textAlign = "right";
    g.fillText("Day " + dayN + " · " + A.prettyDate(dayN), W - PAD, PAD + 22);
    g.textAlign = "left";

    // the number
    g.fillStyle = CARD_INK;
    g.font = "700 208px " + DISPLAY;
    g.fillText(String(c.total), PAD - 6, PAD + 250);
    var wNum = g.measureText(String(c.total)).width;
    g.fillStyle = CARD_INK3;
    g.font = "500 44px " + DISPLAY;
    g.fillText("/100", PAD + wNum + 6, PAD + 250);

    g.fillStyle = CARD_INK2;
    g.font = "500 30px " + DISPLAY;
    var sub = played.length + (played.length === 1 ? " game" : " games");
    if (rs.current > 1) sub += "  ·  " + rs.current + "-day run";
    if (c.name) sub = c.name + "  ·  " + sub;
    g.fillText(sub, PAD, PAD + 300);

    // rows
    var y = PAD + 356, rowH = 62, maxRows = 9;
    var show = played.slice(0, maxRows);
    show.forEach(function (gm) {
      var r = c.results[gm.id];
      var acc = accentHex(gm.accent);
      g.fillStyle = CARD_S1;
      roundRect(g, PAD, y, W - PAD * 2, rowH - 8, 14); g.fill();
      g.strokeStyle = CARD_HAIR; g.lineWidth = 1;
      roundRect(g, PAD + .5, y + .5, W - PAD * 2 - 1, rowH - 9, 14); g.stroke();

      g.font = "600 25px " + DISPLAY;
      g.fillStyle = acc;
      g.fillText(gm.name, PAD + 26, y + 36);

      // norm bar
      var barW = 210, barX = W - PAD - 26 - barW - 86;
      g.fillStyle = "rgba(255,255,255,.09)";
      roundRect(g, barX, y + 21, barW, 10, 5); g.fill();
      g.fillStyle = acc;
      roundRect(g, barX, y + 21, Math.max(6, barW * A.clamp(r.norm, 0, 100) / 100), 10, 5); g.fill();

      g.fillStyle = CARD_INK;
      g.font = "700 27px " + DISPLAY;
      g.textAlign = "right";
      g.fillText(String(r.norm), W - PAD - 26, y + 37);
      g.textAlign = "left";
      y += rowH;
    });

    if (played.length > maxRows) {
      g.fillStyle = CARD_INK3;
      g.font = "500 24px " + DISPLAY;
      g.fillText("+ " + (played.length - maxRows) + " more", PAD + 4, y + 30);
      y += 44;
    }

    if (!played.length) {
      g.fillStyle = CARD_INK3;
      g.font = "500 28px " + DISPLAY;
      g.fillText("Nothing played yet today.", PAD, y + 30);
    }

    // footer
    g.strokeStyle = CARD_HAIR; g.lineWidth = 1;
    g.beginPath(); g.moveTo(PAD, H - PAD - 52); g.lineTo(W - PAD, H - PAD - 52); g.stroke();
    g.fillStyle = CARD_INK3;
    g.font = "500 24px " + DISPLAY;
    g.fillText("salahshoormisha.github.io/misha-arcade", PAD, H - PAD - 12);
    g.textAlign = "right";
    g.fillStyle = CARD_INK3;
    g.fillText("same puzzles, no server", W - PAD, H - PAD - 12);
    g.textAlign = "left";

    return new Promise(function (res) {
      if (cv.toBlob) cv.toBlob(function (b) { res(b); }, "image/png");
      else res(null);
    });
  };

  /** Share the day as an image, falling back to text then to a download. */
  A.shareCardImage = function (dayN) {
    if (dayN === undefined) dayN = A.dayNumber();
    return A.cardImage(dayN).then(function (blob) {
      var name = "midnight-arcade-day-" + dayN + ".png";
      if (!blob) return A.share(A.runCard(dayN));
      var file = null;
      try { file = new File([blob], name, { type: "image/png" }); } catch (e) {}
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], text: A.runCard(dayN) })
          .catch(function () { return dl(); });
      }
      return dl();
      function dl() {
        var u = URL.createObjectURL(blob), a = document.createElement("a");
        a.href = u; a.download = name;
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 400);
        A.toast("Card saved — the text is on your clipboard too");
        return A.copy(A.runCard(dayN));
      }
    });
  };

  /* ── small helpers games keep needing ────────────────────────────────── */

  A.timerEl = function (host) {
    var e = el("span", "ac-pill", "0:00"), t0 = Date.now(), stopped = false;
    host.appendChild(e);
    (function tick() {
      if (stopped) return;
      e.textContent = A.fmtTime(Date.now() - t0);
      setTimeout(tick, 500);
    })();
    return {
      el: e,
      ms: function () { return Date.now() - t0; },
      stop: function () { stopped = true; return Date.now() - t0; },
      reset: function () { t0 = Date.now(); },
    };
  };

  // A "you already played today" gate every daily game shows on re-entry.
  A.alreadyPlayed = function (gameId, dayN, opts) {
    return A.results(gameId, dayN, Object.assign({ title: "Already played" }, opts || {}));
  };

})(window.A, window);
