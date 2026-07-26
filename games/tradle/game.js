/* ============================================================================
   TRADLE — guess the country from the treemap of what it sells.
   Built on the shape of games/wordish/game.js (the reference implementation)
   and matching games/flagle/game.js for the guess rows, so the two geo
   cabinets feel like one machine.

   Better than the original in four ways:
     · the treemap is drawn HERE, on canvas, from core/data/trade.js — the real
       game is an iframe of OEC's renderer that needs a network and often
       comes back blank. Ours is offline, instant and readable at 375 px.
     · a colour LEGEND. The original never tells you what the colours mean and
       expects you to learn 21 HS sections by osmosis.
     · a spendable 💡 hint: the country's economy in one line, for 8 points.
     · a post-game panel that names the top three exports in plain English,
       plus a real archive, unlimited practice and passport stamps.

   NORM (cross-game 0-100 currency, _build/CONTRACT.md §3):
     solved in 1..6 guesses → 100, 92, 80, 68, 55, 42   (modal win 3-4 → ~74)
     lost                   → 10
     hint used              → −8   (floor 5 when won)
   ========================================================================== */
(function () {
  "use strict";

  /* ── constants ─────────────────────────────────────────────────────────
     Everything the boot sequence touches is declared up here: `var`
     initialisers do NOT hoist, and this file draws before it finishes. */
  var ID = "tradle", TRIES = 6, HINT_COST = 8;
  var NORM = [0, 100, 92, 80, 68, 55, 42];
  var MIN_EXPORTS = 1e9;      // keeps the pool to real economies, not re-export noise
  var MONO = '"SF Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace';

  // Treemap labels. HS4 names are written for economists; these are the ones
  // that will not fit or will not parse at a glance.
  var SHORT = {
    "Motor vehicles; parts and accessories (8701 to 8705)": "Vehicle Parts",
    "Coal, Briquettes and Similar Manufactured Solid Fuels": "Coal",
    "Vaccines, blood, antisera, toxins and cultures": "Vaccines & Blood",
    "Acyclic alcohol derivatives (halogenated, sulphonated, nitrated)": "Alcohol Derivatives",
    "Coconuts, Brazil Nuts, and Cashews": "Coconuts & Cashews",
    "Machinery Having Individual Functions": "Special Machinery",
    "Planes, Helicopters, and/or Spacecraft": "Aircraft",
    "Aircraft parts (gliders, balloons, and powered aircraft)": "Aircraft Parts",
    "Hydrogen, rare gases and other non-metals": "Industrial Gases",
    "Dried/Salted/Smoked/Brined Fish": "Cured Fish",
    "Niobium, Tantalum, Vanadium and Zirconium Ore": "Rare Metal Ore",
    "Documents of title (bonds etc) and unused stamps": "Banknotes & Bonds",
    "Sulfonated, Nitrated or Nitrosated Hydrocarbons": "Hydrocarbons",
    "Slag, Ash and Residues Containing Heavy Metals, not from Ferrous Metallurgy": "Metal Slag",
    "Industrial Fatty Acids, Oils and Alcohols": "Fatty Acids",
    "Mixed Mineral or Chemical Fertilizers": "Mixed Fertilizer",
    "Low-voltage Protection Equipment": "Switchgear",
    "Nitrogen Heterocyclic Compounds": "Heterocyclics",
    "Bicycles, delivery tricycles, other cycles": "Bicycles",
    "Non-Retail Pure Cotton Yarn": "Cotton Yarn",
    "Non-Retail Synthetic Staple Fibers Yarn": "Synthetic Yarn",
    "Other Processed Fruits and Nuts": "Processed Fruit",
    "Reaction and Catalytic Products": "Catalysts",
    "Cobalt Oxides and Hydroxides": "Cobalt Oxides",
    "Large Flat-Rolled Stainless Steel": "Stainless Sheet",
    "Other Women's Undergarments": "Underwear",
    "Light Rubberized Knitted Fabric": "Stretch Fabric",
    "Large Construction Vehicles": "Diggers",
    "Other Measuring Instruments": "Measuring Kit",
  };

  // Plain English for the post-game panel — what the thing actually is.
  var PLAIN = {
    "Refined Petroleum": "refined fuel", "Crude Petroleum": "crude oil",
    "Petroleum Gas": "natural gas", "Packaged Medicaments": "packaged medicines",
    "Motor vehicles; parts and accessories (8701 to 8705)": "car parts",
    "Vaccines, blood, antisera, toxins and cultures": "vaccines and blood products",
    "Acyclic alcohol derivatives (halogenated, sulphonated, nitrated)": "industrial alcohols",
    "Coal, Briquettes and Similar Manufactured Solid Fuels": "coal",
    "Integrated Circuits": "computer chips", "Broadcasting Equipment": "phones and broadcast kit",
    "Ethylene Polymers": "polyethylene plastic", "Propylene Polymers": "polypropylene plastic",
    "Machinery Having Individual Functions": "specialised machinery",
    "Non-Knit Men's Suits": "men's tailored clothing", "Non-Knit Women's Suits": "women's tailored clothing",
    "Knit T-shirts": "T-shirts", "Knit Sweaters": "knitwear", "Knit Women's Suits": "knitted womenswear",
    "Nitrogenous Fertilizers": "nitrogen fertiliser", "Phosphatic Fertilizers": "phosphate fertiliser",
    "Mixed Mineral or Chemical Fertilizers": "mixed fertiliser",
    "Other Oily Seeds": "oilseeds", "Coconuts, Brazil Nuts, and Cashews": "coconuts and cashews",
    "Non-fillet Frozen Fish": "frozen fish", "Non-fillet Fresh Fish": "fresh fish",
    "Fish Fillets": "fish fillets", "Dried/Salted/Smoked/Brined Fish": "cured fish",
    "Special Purpose Ships": "specialist ships", "Passenger and Cargo Ships": "ships",
    "Planes, Helicopters, and/or Spacecraft": "aircraft",
    "Aircraft parts (gliders, balloons, and powered aircraft)": "aircraft parts",
    "Rolled Tobacco": "cigarettes", "Raw Tobacco": "leaf tobacco",
    "Precious Metal Ore": "precious-metal ore", "Hard Liquor": "spirits",
    "Nitrogen Heterocyclic Compounds": "pharmaceutical chemicals",
    "Low-voltage Protection Equipment": "electrical switchgear",
    "Industrial Fatty Acids, Oils and Alcohols": "industrial fatty acids",
    "Non-Retail Pure Cotton Yarn": "cotton yarn", "Non-Retail Synthetic Staple Fibers Yarn": "synthetic yarn",
    "Hydrogen, rare gases and other non-metals": "industrial gases",
    "Niobium, Tantalum, Vanadium and Zirconium Ore": "rare-metal ore",
    "Documents of title (bonds etc) and unused stamps": "banknotes and bonds",
    "Sulfonated, Nitrated or Nitrosated Hydrocarbons": "industrial hydrocarbons",
    "Reaction and Catalytic Products": "industrial catalysts",
    "Other Processed Fruits and Nuts": "processed fruit and nuts",
    "Slag, Ash and Residues Containing Heavy Metals, not from Ferrous Metallurgy": "metal-bearing slag",
    "Light Rubberized Knitted Fabric": "stretch fabric", "Other Women's Undergarments": "women's underwear",
    "Large Flat-Rolled Stainless Steel": "stainless steel sheet", "Cobalt Oxides and Hydroxides": "cobalt oxides",
    "Large Construction Vehicles": "diggers and construction vehicles",
    "Other Measuring Instruments": "measuring instruments", "Medical Instruments": "medical instruments",
    "Orthopedic Appliances": "orthopaedic devices", "Precious Metal Watches": "luxury watches",
    "Semiconductor Devices": "semiconductors", "Electrical Capacitors": "capacitors",
    "Sulfate Chemical Woodpulp": "wood pulp", "Iron Reductions": "direct-reduced iron",
    "Hot-Rolled Iron": "hot-rolled steel", "Scrap Iron": "scrap iron",
    "Raw Aluminium": "unwrought aluminium", "Refined Copper": "refined copper",
    "Calcium Phosphates": "phosphate rock", "Animal Meal and Pellets": "fishmeal",
    "Bovine, Sheep, and Goat Fat": "tallow", "Concentrated Milk": "milk powder",
    "Bovine": "live cattle", "Sheep and Goats": "live sheep and goats", "Edible Offal": "offal",
    "Prepared Wool or Animal Hair": "processed wool", "Gravel and Crushed Stone": "gravel",
    "Rough Wood": "logs", "Sawn Wood": "sawn timber", "Particle Board": "particle board",
    "Cigarette Paper": "cigarette paper", "Alcohol > 80% ABV": "high-proof alcohol",
    "Coffee and Tea Extracts": "instant coffee and tea", "Railway Cargo Containers": "shipping containers",
    "Washing and Bottling Machines": "bottling machines", "Textile Footwear": "fabric shoes",
    "Bicycles, delivery tricycles, other cycles": "bicycles", "Delivery Trucks": "delivery trucks",
    "Insulated Wire": "insulated wire", "Gas Turbines": "gas turbines", "Electricity": "electricity",
  };

  /* ── data ──────────────────────────────────────────────────────────────── */
  var T = window.AD_TRADE || {};
  var SECT = T.sections || {};
  var TRADE = {};
  (T.countries || []).forEach(function (c) { TRADE[c.i] = c; });

  var ALL = window.AD_COUNTRIES || [];
  var byIso = {};
  ALL.forEach(function (c) { byIso[c.i] = c; });

  // Answer pool: UN members with a location, a basket and real trade. Sorted,
  // so both players walk the same permutation on the same day.
  var POOL = Object.keys(TRADE).filter(function (i) {
    var c = byIso[i];
    return c && c.un === 1 && (c.capll || c.ll) &&
      TRADE[i].total >= MIN_EXPORTS && TRADE[i].items && TRADE[i].items.length > 2;
  }).sort();

  /* ── state ─────────────────────────────────────────────────────────────── */
  var day = A.requestedDay();
  var practice = day === A.PRACTICE;
  var answer = null, guesses = [], over = false, hinted = false, t0 = Date.now();
  var cvs = null, picker = null, list = null, hintBox = null, triesEl = null;
  var legendEl = null, remFill = null, remTx = null, drawTimer = null;

  /* ── boot ──────────────────────────────────────────────────────────────── */
  var main = A.mount({
    id: ID, dayN: day,
    help: "<p>One country's exports, drawn as a treemap. Every rectangle is a product; " +
      "its <b>area is its share</b> of what that country sells abroad, and its <b>colour</b> " +
      "is the family it belongs to (the key is under the map).</p>" +
      "<p>Six guesses. Each wrong one tells you <b>how far away</b> you are, " +
      "<b>which way</b> to go, and how warm you're getting.</p>" +
      "<ul><li><b>What is this economy?</b> gives you the whole basket in one line — " +
      "costs 8 points, not a guess.</li>" +
      "<li>Every country you get right is <b>stamped in your passport</b>.</li>" +
      "<li>Type freely — <i>USA</i>, <i>Holland</i>, <i>Persia</i> and <i>Burma</i> all work.</li>" +
      "<li>Baskets are 2023 mirror-reconciled UN Comtrade data. A few countries " +
      "under-report badly; when the day's answer is one of them we say so at the end.</li>" +
      "<li><b>Practice</b> is unlimited and never touches your stats.</li></ul>",
  });

  if (!POOL.length || !SECT["1"]) {
    main.innerHTML = '<p class="center muted" style="padding:40px 0">Trade data hasn\'t loaded. ' +
      "Check core/data/trade.js and countries.js.</p>";
    return;
  }

  answer = pickAnswer();

  var wrap = A.el("div"); wrap.id = "mapwrap";
  cvs = A.el("canvas"); cvs.id = "tree";
  cvs.setAttribute("role", "img");
  cvs.setAttribute("aria-label", "A treemap of one country's exports");
  wrap.appendChild(cvs);
  main.appendChild(wrap);

  legendEl = A.el("div", "legend");
  main.appendChild(legendEl);

  var rem = A.el("div", "rem", '<div class="rembar"><i></i></div><div class="remtx"></div>');
  main.appendChild(rem);
  remFill = rem.querySelector("i");
  remTx = rem.querySelector(".remtx");

  triesEl = A.el("div", "tries");
  main.appendChild(triesEl);

  var pickHost = A.el("div"); pickHost.style.marginTop = "14px";
  main.appendChild(pickHost);
  picker = A.picker(pickHost, { pool: POOL, onPick: guess, placeholder: "who sells this?" });

  var row = A.el("div", "ac-row"); row.style.marginTop = "10px";
  row.innerHTML = '<button class="ac-pill" id="hint">WHAT IS THIS ECONOMY?</button>' +
    (practice ? '<a class="ac-pill" href="./">← TODAY\'S COUNTRY</a>'
      : '<a class="ac-pill" href="?practice=1">∞ PRACTICE</a>');
  main.appendChild(row);

  hintBox = A.el("div", "hintbox"); main.appendChild(hintBox);
  list = A.el("div", "guesses"); main.appendChild(list);

  row.querySelector("#hint").onclick = doHint;

  paintLegend();
  restore();

  window.addEventListener("resize", function () {
    clearTimeout(drawTimer);
    drawTimer = setTimeout(draw, 140);
  });

  /* ── the day's country ─────────────────────────────────────────────────── */

  function pickAnswer() {
    if (practice) return A.pick(A.rng(String(Date.now()) + Math.random()), POOL);
    return POOL[A.dailyIndex(ID, day, POOL.length)];
  }

  function items() {
    return (TRADE[answer].items || []).filter(function (it) {
      return it.name !== "Other" && it.share > 0;
    }).sort(function (a, b) { return b.share - a.share; });
  }

  function at(c) { return c.capll || c.ll; }          // [lat, lon]

  /* ── play ──────────────────────────────────────────────────────────────── */

  function guess(iso) {
    if (over) return;
    if (guesses.indexOf(iso) >= 0) return A.toast("Already guessed that one", true);
    guesses.push(iso);
    picker.setExclude(guesses);
    var won = iso === answer;
    renderGuesses();
    paintTries();
    save();
    if (won) { A.sfx("win"); end(true); }
    else if (guesses.length >= TRIES) { A.sfx("lose"); end(false); }
    else { A.sfx("miss"); }
  }

  function doHint() {
    if (over || hinted) return;
    var h = (TRADE[answer] || {}).hint;
    if (!h) {
      hintBox.innerHTML = "<b>the economy</b>no one-liner recorded for this one — no charge";
      return;
    }
    hinted = true;
    hintBox.innerHTML = "<b>the economy</b>" + A.esc(h.replace(/\s*\[partial data\]\s*$/, "")) +
      ' <span class="dim">(−' + HINT_COST + " pts)</span>";
    A.sfx("reveal");
    save();
  }

  /* ── squarified treemap ────────────────────────────────────────────────
     Bruls, Huizing & van Wijk (2000). Lay the items out in rows along the
     shorter side of the space that's left, greedily extending a row while
     that keeps the worst aspect ratio in it going down. Items must arrive
     sorted descending. Returns [{it, x, y, w, h}]. */

  function worst(mx, mn, sum, side) {
    var s2 = side * side, q = sum * sum;
    return Math.max(s2 * mx / q, q / (s2 * mn));
  }

  function squarify(vals, x, y, w, h) {
    var out = [], sum = 0, i, j;
    for (i = 0; i < vals.length; i++) sum += vals[i].v;
    if (!(sum > 0) || w <= 0 || h <= 0) return out;

    var scale = (w * h) / sum;
    var left = vals.map(function (v) { return { it: v.it, a: v.v * scale }; });

    while (left.length) {
      if (w < 0.5 || h < 0.5) break;                  // numerical safety valve
      var side = Math.min(w, h);
      var row = [], rowSum = 0, best = Infinity, k = 0;

      while (k < left.length) {
        var a = left[k].a, next = rowSum + a, mx = a, mn = a;
        for (j = 0; j < row.length; j++) {
          if (row[j].a > mx) mx = row[j].a;
          if (row[j].a < mn) mn = row[j].a;
        }
        var ratio = worst(mx, mn, next, side);
        if (!row.length || ratio <= best) { row.push(left[k]); rowSum = next; best = ratio; k++; }
        else break;
      }

      var thick = rowSum / side, pos = 0;
      for (j = 0; j < row.length; j++) {
        var len = row[j].a / rowSum * side;
        if (w >= h) out.push({ it: row[j].it, x: x, y: y + pos, w: thick, h: len });
        else out.push({ it: row[j].it, x: x + pos, y: y, w: len, h: thick });
        pos += len;
      }
      if (w >= h) { x += thick; w -= thick; } else { y += thick; h -= thick; }
      left = left.slice(row.length);
    }
    return out;
  }

  /* ── drawing ───────────────────────────────────────────────────────────── */

  function rgbOf(hex) {
    var h = String(hex || "#888").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
  }
  function mix(rgb, to, t) {
    return "rgb(" + rgb.map(function (v, i) { return Math.round(v + (to[i] - v) * t); }).join(",") + ")";
  }
  function lumOf(rgb) { return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255; }

  function shortName(n) {
    if (SHORT[n]) return SHORT[n];
    var s = String(n).split(/[;(]/)[0].trim();
    if (s.length > 26) s = s.split(",")[0].trim();
    return s;
  }
  function plainName(n) {
    if (PLAIN[n]) return PLAIN[n];
    var s = String(n).split(/[;(]/)[0].trim().replace(/,\s*$/, "");
    return s.toLowerCase();
  }
  function pctOf(share) {
    var p = share * 100;
    return (p >= 10 ? Math.round(p) : p.toFixed(1)) + "%";
  }

  // Greedy word wrap, then clip to maxLines with an ellipsis on the last line.
  function wrapLines(g, text, maxW, maxLines) {
    var words = String(text).split(/\s+/), all = [], cur = "", i;
    for (i = 0; i < words.length; i++) {
      var t = cur ? cur + " " + words[i] : words[i];
      if (!cur || g.measureText(t).width <= maxW) cur = t;
      else { all.push(cur); cur = words[i]; }
    }
    if (cur) all.push(cur);

    var clipped = all.length > maxLines;
    var lines = all.slice(0, maxLines);
    for (i = 0; i < lines.length; i++) {
      var tail = clipped && i === lines.length - 1;
      if (!tail && g.measureText(lines[i]).width <= maxW) continue;
      var s = lines[i];
      while (s.length > 1 && g.measureText(s + "…").width > maxW) s = s.slice(0, -1);
      lines[i] = s + "…";
    }
    return lines;
  }

  function draw() {
    if (!cvs) return;
    var w = cvs.clientWidth || 340;
    if (w < 40) return;
    var h = A.clamp(Math.round(w * 0.76), 220, 330);
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cvs.width = Math.round(w * dpr); cvs.height = Math.round(h * dpr);
    cvs.style.height = h + "px";

    var g = cvs.getContext("2d");
    g.save();
    g.scale(dpr, dpr);
    g.clearRect(0, 0, w, h);
    g.fillStyle = "#141220";                       /* --s1 */
    g.fillRect(0, 0, w, h);

    var its = items();
    var vals = its.map(function (it) { return { it: it, v: it.share }; });
    var rects = squarify(vals, 0, 0, w, h);

    rects.forEach(function (r) {
      var sec = SECT[r.it.colour] || SECT["0"] || { colour: "#2e2941", name: "Other" };
      var rgb = rgbOf(sec.colour);
      var x = r.x, y = r.y, rw = Math.max(0, r.w), rh = Math.max(0, r.h);

      var grad = g.createLinearGradient(x, y, x + rw, y + rh);
      grad.addColorStop(0, mix(rgb, [245, 242, 248], 0.16));
      grad.addColorStop(1, mix(rgb, [10, 9, 16], 0.34));
      g.fillStyle = grad;
      g.fillRect(x, y, rw, rh);

      // seams + a top-left highlight, so the blocks read as separate tiles
      g.strokeStyle = "rgba(10,9,16,.58)"; g.lineWidth = 2;
      g.strokeRect(x + 1, y + 1, Math.max(0, rw - 2), Math.max(0, rh - 2));
      g.strokeStyle = "rgba(255,255,255,.13)"; g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x + 1.5, y + rh - 1.5); g.lineTo(x + 1.5, y + 1.5); g.lineTo(x + rw - 1.5, y + 1.5);
      g.stroke();

      var dark = lumOf(rgb) < 0.55;
      var ink = dark ? "#f5f2f8" : "#0a0910";
      var pad = rw > 76 ? 8 : 5;
      var maxW = rw - pad * 2;
      if (maxW < 26 || rh < 20) return;

      var fs = A.clamp(Math.round(Math.sqrt(rw * rh) / 7.2), 9, 15);
      var pfs = A.clamp(fs + 2, 11, 18);
      var lh = Math.round(fs * 1.2);

      g.shadowColor = dark ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.35)";
      g.shadowBlur = 2;
      g.textBaseline = "alphabetic";
      g.fillStyle = ink;

      var roomForName = Math.floor((rh - pad * 2 - pfs * 1.05) / lh);
      if (roomForName >= 1 && maxW >= 34) {
        g.font = "600 " + fs + "px " + MONO;
        var lines = wrapLines(g, shortName(r.it.name), maxW, A.clamp(roomForName, 1, 3));
        for (var i = 0; i < lines.length; i++) {
          g.fillText(lines[i], x + pad, y + pad + fs + i * lh);
        }
      }
      if (rh >= pad * 2 + pfs) {
        g.font = "800 " + pfs + "px " + MONO;
        var lab = pctOf(r.it.share);
        if (g.measureText(lab).width <= maxW) g.fillText(lab, x + pad, y + rh - pad);
      }
      g.shadowBlur = 0;
    });

    g.strokeStyle = "rgba(255,255,255,.075)"; g.lineWidth = 1;
    g.strokeRect(0.5, 0.5, w - 1, h - 1);
    g.restore();

    paintRemainder();
  }

  function paintRemainder() {
    var shown = 0;
    items().forEach(function (it) { shown += it.share; });
    var pct = A.clamp(shown, 0, 1) * 100;
    remFill.style.width = pct.toFixed(1) + "%";
    remTx.textContent = "THESE " + items().length + " PRODUCTS = " + pct.toFixed(0) +
      "% OF EXPORTS · THE REST IS SPREAD THIN";
  }

  function paintLegend() {
    var seen = {}, order = [];
    items().forEach(function (it) {
      if (seen[it.colour]) { seen[it.colour] += it.share; return; }
      seen[it.colour] = it.share; order.push(it.colour);
    });
    order.sort(function (a, b) { return seen[b] - seen[a]; });
    legendEl.innerHTML = order.map(function (k) {
      var s = SECT[k] || { colour: "#2e2941", name: "Other" };
      return '<span><i style="background:' + A.esc(s.colour) + '"></i>' + A.esc(s.name) + "</span>";
    }).join("");
  }

  function paintTries() {
    triesEl.innerHTML = "";
    for (var t = 0; t < TRIES; t++) {
      var i = A.el("i");
      if (t < guesses.length) i.className = guesses[t] === answer ? "won" : "used";
      triesEl.appendChild(i);
    }
  }

  /* ── feedback ──────────────────────────────────────────────────────────── */

  function distTo(iso) {
    var a = at(byIso[iso]), b = at(byIso[answer]);
    return A.haversine(a[0], a[1], b[0], b[1]);
  }
  function proxPct(iso) {
    if (iso === answer) return 100;
    return Math.min(99, Math.round(A.geo.prox(distTo(iso)) * 100));   // a miss never shows 100%
  }
  // The original's 5-square proximity meter: each 🟩 = 20 points, a 🟨 = a leftover ≥ 10.
  function squares(pc) {
    var cb = A.settings().colourblind;
    var gr = Math.min(5, Math.floor(pc / 20));
    var ye = (pc - 20 * gr) >= 10 && gr < 5 ? 1 : 0;
    return rep(cb ? "🟦" : "🟩", gr) + rep(cb ? "🟧" : "🟨", ye) + rep("⬜", 5 - gr - ye);
  }
  function rep(s, n) { var o = ""; for (var i = 0; i < n; i++) o += s; return o; }

  function renderGuesses() {
    list.innerHTML = "";
    guesses.forEach(function (iso) {
      var c = byIso[iso], won = iso === answer;
      var el = A.el("div", "gr" + (won ? " win" : ""));
      el.innerHTML =
        '<img alt="" src="' + A.rootPath() + "core/data/flags/" + iso + '.svg" onerror="this.style.visibility=\'hidden\'">' +
        '<span class="nm">' + A.esc(c.n) + "</span>" +
        (won ? '<span class="ar">✓</span><span class="pc">100%</span>'
          : '<span class="km">' + A.geo.km(distTo(iso)) + '</span><span class="ar">' +
            A.arrow(A.bearing(at(c)[0], at(c)[1], at(byIso[answer])[0], at(byIso[answer])[1])) +
            '</span><span class="pc">' + proxPct(iso) + "%</span>");
      list.appendChild(el);
    });
  }

  /* ── persistence ───────────────────────────────────────────────────────── */

  function save() {
    if (practice) return;
    A.save(ID, day, { guesses: guesses, hinted: hinted });
  }

  function restore() {
    var st = practice ? null : A.load(ID, day);
    if (st) {
      guesses = st.guesses || [];
      hinted = !!st.hinted;
      if (hinted) { hinted = false; doHint(); }
    }
    picker.setExclude(guesses);
    renderGuesses();
    paintTries();
    draw();
    if (st && st.done) {
      over = true;
      picker.disable(true);
      setTimeout(function () { sheet(st.won, st.shareGrid, st.norm); }, 240);
    }
  }

  /* ── ending ────────────────────────────────────────────────────────────── */

  function end(won) {
    over = true;
    picker.disable(true);
    var n = guesses.length;
    var norm = won ? Math.max(5, NORM[n] - (hinted ? HINT_COST : 0)) : 10;

    var grid = guesses.map(function (iso) { return squares(proxPct(iso)); });
    if (hinted) grid.push("💡");

    if (!practice) {
      A.finish(ID, day, {
        score: norm, norm: norm, won: won, detail: won ? n + "/" + TRIES : "X/" + TRIES,
        bucket: won ? n : "X", shareGrid: grid, durationMs: Date.now() - t0,
        stamps: won ? [answer] : [],
      });
    } else if (won) { A.stamp(answer, ID); }

    if (won) A.confetti(n <= 2 ? 130 : 70);
    sheet(won, grid, norm);
  }

  function sheet(won, grid, norm) {
    var c = byIso[answer], t = TRADE[answer];
    var top = items().slice(0, 3).map(function (it) {
      return "<b>" + A.esc(plainName(it.name)) + "</b> (" + pctOf(it.share) + ")";
    });
    var sentence = top.length > 1
      ? top.slice(0, -1).join(", ") + " and " + top[top.length - 1]
      : (top[0] || "");

    var extra = '<p class="center" style="margin:var(--sp-2) 0 2px">' +
      '<img alt="" style="width:34px;height:22px;object-fit:cover;border-radius:2px;vertical-align:-5px;margin-right:8px" ' +
      'src="' + A.rootPath() + "core/data/flags/" + answer + '.svg" onerror="this.style.display=\'none\'">' +
      '<b style="font-size:var(--t-lg);letter-spacing:.08em">' + A.esc(c.n) + "</b></p>" +
      '<p class="center tiny muted">' + A.esc([c.cap, c.sub || c.reg].filter(Boolean).join(" · ")) + "</p>" +
      '<p class="top3">Sells mostly ' + sentence + "." +
      '<br><span class="muted tiny">' + usd(t.total) + " of goods in " + (T.year || 2023) + "</span></p>";

    if (t.note) extra += '<p class="caveat">⚠︎ ' + A.esc(t.note) + "</p>";
    if (won) extra += '<p class="center tiny" style="color:var(--green);margin-top:var(--sp-2)">' +
      A.esc(c.n) + " stamped in your passport</p>";

    A.results(ID, practice ? A.PRACTICE : day, {
      title: won ? (guesses.length <= 1 ? "CALLED IT" : guesses.length <= 2 ? "SHARP" : "GOT IT")
        : "NOT THIS TIME",
      extraHTML: extra,
      state: { norm: norm, shareGrid: grid, won: won },
      shareText: "TRADLE (practice)\n" + (grid || []).join("\n") + "\n" + A.SITE,
      onReplay: function () { location.reload(); },
    });
  }

  function usd(n) {
    if (n >= 1e12) return "$" + (n / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (n >= 1e9) return "$" + Math.round(n / 1e9) + "B";
    if (n >= 1e6) return "$" + Math.round(n / 1e6) + "M";
    return "$" + Math.round(n);
  }

  /* ── debug hook — drives a whole game headlessly ───────────────────────── */
  window.__TR = {
    answer: function () { return answer; },
    guess: guess,
    hint: doHint,
    pool: function () { return POOL.slice(); },
    items: function () { return items(); },
    layout: function () {
      var w = cvs.clientWidth || 340, h = A.clamp(Math.round(w * 0.76), 220, 330);
      return squarify(items().map(function (it) { return { it: it, v: it.share }; }), 0, 0, w, h);
    },
    state: function () {
      return {
        day: day, practice: practice, answer: answer, guesses: guesses.slice(),
        over: over, hinted: hinted, pool: POOL.length, items: items().length,
      };
    },
  };
})();
