/* ============================================================================
   MIDNIGHT ARCADE · DAILY WING — map & globe renderer
   Consumes core/data/world.js (AD_WORLD). Canvas 2D, retina-aware.

   Used by: GLOBLE (heat globe), TIMEGUESSR / PLACEGUESSR (click-to-guess),
   SILHOUETTE quiz (single-country shapes), GEOGRID + PASSPORT (choropleth).

     var m = A.map(canvasEl, { mode:"equirect", onPick:fn });
     m.fill("IR", "#ff4fa3"); m.marker(35.7, 51.4, {colour:"#fff"}); m.draw();
   ========================================================================== */
(function (A) {
  "use strict";

  var W = function () { return window.AD_WORLD; };

  /* ── projections ───────────────────────────────────────────────────────── */
  // Equirectangular, clipped to the inhabited band so Antarctica doesn't eat
  // half the canvas — the same trick web maps use.
  var LAT_TOP = 83, LAT_BOT = -56;

  function makeEquirect(w, h, view) {
    var lonL = view.lonL, lonR = view.lonR, latT = view.latT, latB = view.latB;
    return {
      to: function (lat, lon) {
        return [(lon - lonL) / (lonR - lonL) * w, (latT - lat) / (latT - latB) * h];
      },
      from: function (x, y) {
        return [latT - y / h * (latT - latB), lonL + x / w * (lonR - lonL)];
      },
      visible: function () { return true; },
    };
  }

  function makeOrtho(w, h, view) {
    var R = Math.min(w, h) / 2 * 0.94, cx = w / 2, cy = h / 2;
    var l0 = view.lon0 * Math.PI / 180, p0 = view.lat0 * Math.PI / 180;
    var sp0 = Math.sin(p0), cp0 = Math.cos(p0);
    return {
      R: R, cx: cx, cy: cy,
      to: function (lat, lon) {
        var p = lat * Math.PI / 180, l = lon * Math.PI / 180 - l0;
        var cosc = sp0 * Math.sin(p) + cp0 * Math.cos(p) * Math.cos(l);
        var x = cx + R * Math.cos(p) * Math.sin(l);
        var y = cy - R * (cp0 * Math.sin(p) - sp0 * Math.cos(p) * Math.cos(l));
        return [x, y, cosc >= 0];
      },
      from: function (x, y) {
        var dx = (x - cx) / R, dy = (cy - y) / R;
        var rho = Math.sqrt(dx * dx + dy * dy);
        if (rho > 1) return null;
        var c = Math.asin(rho), sc = Math.sin(c), cc = Math.cos(c);
        if (rho < 1e-9) return [view.lat0, view.lon0];
        var lat = Math.asin(cc * sp0 + dy * sc * cp0 / rho) * 180 / Math.PI;
        var lon = (l0 + Math.atan2(dx * sc, rho * cp0 * cc - dy * sp0 * sc)) * 180 / Math.PI;
        return [lat, ((lon + 540) % 360) - 180];
      },
      visible: function (lat, lon) {
        var p = lat * Math.PI / 180, l = lon * Math.PI / 180 - l0;
        return sp0 * Math.sin(p) + cp0 * Math.cos(p) * Math.cos(l) >= -0.02;
      },
    };
  }

  /* ── the map object ────────────────────────────────────────────────────── */

  A.map = function (canvas, opts) {
    opts = opts || {};
    var m = {
      mode: opts.mode || "equirect",
      fills: {},
      strokes: {},
      markers: [],
      lines: [],
      view: { lonL: -180, lonR: 180, latT: LAT_TOP, latB: LAT_BOT, lat0: 20, lon0: 10 },
      only: opts.only || null,          // restrict drawing to these ISO2s
      showLand: opts.showLand !== false,
      showBorders: opts.showBorders !== false,
      labels: [],
      dpr: 1,
      proj: null,
      colours: Object.assign({
        sea: "#0b0620", land: "#241a4d", border: "#3b2a6e",
        graticule: "#ffffff0d", rim: "#4fd8ff",
      }, opts.colours || {}),
    };

    function size() {
      var r = canvas.getBoundingClientRect();
      var cssW = Math.max(1, Math.round(r.width || canvas.width || 320));
      var cssH = Math.max(1, Math.round(r.height || canvas.height || 200));
      m.dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = cssW * m.dpr;
      canvas.height = cssH * m.dpr;
      m.w = cssW; m.h = cssH;
    }

    function proj() {
      return m.mode === "globe" ? makeOrtho(m.w, m.h, m.view) : makeEquirect(m.w, m.h, m.view);
    }

    m.project = function (lat, lon) { return (m.proj || proj()).to(lat, lon); };
    m.unproject = function (x, y) { return (m.proj || proj()).from(x, y); };

    m.fill = function (iso, colour) { m.fills[iso] = colour; return m; };
    m.stroke = function (iso, colour) { m.strokes[iso] = colour; return m; };
    m.clearFills = function () { m.fills = {}; m.strokes = {}; return m; };
    m.marker = function (lat, lon, o) { m.markers.push(Object.assign({ lat: lat, lon: lon }, o || {})); return m; };
    m.clearMarkers = function () { m.markers = []; m.lines = []; m.labels = []; return m; };
    m.line = function (a, b, o) { m.lines.push({ a: a, b: b, o: o || {} }); return m; };
    m.label = function (lat, lon, text, o) { m.labels.push(Object.assign({ lat: lat, lon: lon, text: text }, o || {})); return m; };

    m.spinTo = function (lat, lon) { m.view.lat0 = lat; m.view.lon0 = lon; return m; };

    m.zoomTo = function (iso, pad) {
      var w = W(); if (!w) return m;
      var bb = w.bbox(iso); if (!bb) return m;
      pad = pad === undefined ? 0.35 : pad;
      var dx = (bb[2] - bb[0]) * pad, dy = (bb[3] - bb[1]) * pad;
      m.view.lonL = bb[0] - dx; m.view.lonR = bb[2] + dx;
      m.view.latT = bb[3] + dy; m.view.latB = bb[1] - dy;
      // keep aspect sane
      var arCanvas = m.w / m.h, spanX = m.view.lonR - m.view.lonL, spanY = m.view.latT - m.view.latB;
      var arView = spanX / spanY;
      if (arView < arCanvas) {
        var need = spanY * arCanvas, add = (need - spanX) / 2;
        m.view.lonL -= add; m.view.lonR += add;
      } else {
        var need2 = spanX / arCanvas, add2 = (need2 - spanY) / 2;
        m.view.latT += add2; m.view.latB -= add2;
      }
      return m;
    };

    m.reset = function () {
      m.view = { lonL: -180, lonR: 180, latT: LAT_TOP, latB: LAT_BOT, lat0: m.view.lat0, lon0: m.view.lon0 };
      return m;
    };

    m.draw = function () {
      size();
      var w = W();
      var g = canvas.getContext("2d");
      m.proj = proj();
      var P = m.proj;
      g.save();
      g.scale(m.dpr, m.dpr);
      g.clearRect(0, 0, m.w, m.h);

      if (m.mode === "globe") {
        g.fillStyle = m.colours.sea;
        g.beginPath(); g.arc(P.cx, P.cy, P.R, 0, 6.2832); g.fill();
        g.strokeStyle = m.colours.rim; g.globalAlpha = .5;
        g.lineWidth = 1.2; g.stroke(); g.globalAlpha = 1;
        graticule(g, P);
      } else if (opts.sea !== false) {
        g.fillStyle = m.colours.sea;
        g.fillRect(0, 0, m.w, m.h);
      }

      if (!w) {   // data not loaded — say so rather than showing a blank box
        g.fillStyle = "#6b5aa0"; g.font = "12px " + "monospace"; g.textAlign = "center";
        g.fillText("map data not loaded", m.w / 2, m.h / 2);
        g.restore(); return m;
      }

      var codes = m.only || w.all();
      // Antarctica is 50 rings reaching the pole and is never the answer to
      // anything here — drawing it is all cost and no benefit.
      if (!m.antarctica) codes = codes.filter(function (c) { return c !== "AQ"; });

      // Land base. Each country is filled as its OWN path: one combined path
      // would be evaluated under a single nonzero winding count, which lets
      // opposite-wound rings from different countries cancel (and flood the
      // canvas). Per-country fills also make each country's own holes work.
      if (m.showLand) {
        g.fillStyle = m.colours.land;
        codes.forEach(function (c) {
          if (m.fills[c]) return;
          g.beginPath(); path(g, P, w.rings(c)); g.fill();
        });
      }
      // filled countries
      Object.keys(m.fills).forEach(function (c) {
        var rings = w.rings(c); if (!rings || !rings.length) return;
        g.fillStyle = m.fills[c];
        g.beginPath(); path(g, P, rings); g.fill();
      });
      // borders
      if (m.showBorders) {
        g.strokeStyle = m.colours.border; g.lineWidth = .6; g.globalAlpha = .9;
        g.beginPath();
        codes.forEach(function (c) { path(g, P, w.rings(c)); });
        g.stroke(); g.globalAlpha = 1;
      }
      // explicit strokes on top
      Object.keys(m.strokes).forEach(function (c) {
        g.strokeStyle = m.strokes[c]; g.lineWidth = 1.6;
        g.beginPath(); path(g, P, w.rings(c)); g.stroke();
      });

      // lines
      m.lines.forEach(function (L) {
        var pts = greatCircle(L.a, L.b, 48).map(function (p) { return P.to(p[0], p[1]); });
        g.strokeStyle = L.o.colour || "#fff"; g.lineWidth = L.o.width || 1.6;
        g.setLineDash(L.o.dash || [5, 4]);
        g.beginPath();
        var started = false;
        pts.forEach(function (q) {
          if (q[2] === false) { started = false; return; }
          if (!started) { g.moveTo(q[0], q[1]); started = true; } else g.lineTo(q[0], q[1]);
        });
        g.stroke(); g.setLineDash([]);
      });

      // markers
      m.markers.forEach(function (k) {
        var q = P.to(k.lat, k.lon);
        if (q[2] === false) return;
        var r = k.r || 5;
        if (k.pin) {
          g.fillStyle = k.colour || "#ff4fa3";
          g.beginPath();
          g.moveTo(q[0], q[1]);
          g.lineTo(q[0] - r * .8, q[1] - r * 1.9);
          g.lineTo(q[0] + r * .8, q[1] - r * 1.9);
          g.closePath(); g.fill();
          g.beginPath(); g.arc(q[0], q[1] - r * 2.1, r * .95, 0, 6.2832); g.fill();
          g.strokeStyle = "#0009"; g.lineWidth = 1; g.stroke();
        } else {
          g.beginPath(); g.arc(q[0], q[1], r, 0, 6.2832);
          g.fillStyle = k.colour || "#ff4fa3"; g.fill();
          g.strokeStyle = k.ring || "#fff"; g.lineWidth = k.lw || 1.6; g.stroke();
        }
        if (k.text) {
          g.font = "700 10px " + mono(); g.textAlign = "center";
          g.fillStyle = "#000a"; g.fillText(k.text, q[0] + 1, q[1] - r - 5 + 1);
          g.fillStyle = k.textColour || "#fff"; g.fillText(k.text, q[0], q[1] - r - 5);
        }
      });

      m.labels.forEach(function (L) {
        var q = P.to(L.lat, L.lon);
        if (q[2] === false) return;
        g.font = (L.size || 10) + "px " + mono(); g.textAlign = "center";
        g.fillStyle = "#000b"; g.fillText(L.text, q[0] + 1, q[1] + 1);
        g.fillStyle = L.colour || "#ffe3f3"; g.fillText(L.text, q[0], q[1]);
      });

      g.restore();
      return m;
    };

    function path(g, P, rings) {
      if (!rings) return;
      for (var i = 0; i < rings.length; i++) {
        var r = rings[i], started = false;
        for (var j = 0; j < r.length; j++) {
          var q = P.to(r[j][1], r[j][0]);      // rings are [lon,lat]
          if (q[2] === false) { started = false; continue; }
          if (!started) { g.moveTo(q[0], q[1]); started = true; }
          else g.lineTo(q[0], q[1]);
        }
        if (started) g.closePath();
      }
    }

    function graticule(g, P) {
      g.strokeStyle = m.colours.graticule; g.lineWidth = .6;
      for (var lat = -60; lat <= 80; lat += 20) {
        g.beginPath(); var st = false;
        for (var lon = -180; lon <= 180; lon += 4) {
          var q = P.to(lat, lon);
          if (q[2] === false) { st = false; continue; }
          st ? g.lineTo(q[0], q[1]) : (g.moveTo(q[0], q[1]), st = true);
        }
        g.stroke();
      }
      for (var lo = -180; lo < 180; lo += 20) {
        g.beginPath(); var s2 = false;
        for (var la = -80; la <= 80; la += 4) {
          var q2 = P.to(la, lo);
          if (q2[2] === false) { s2 = false; continue; }
          s2 ? g.lineTo(q2[0], q2[1]) : (g.moveTo(q2[0], q2[1]), s2 = true);
        }
        g.stroke();
      }
    }

    /* ── interaction ─────────────────────────────────────────────────────── */

    if (opts.onPick || opts.onCountry || opts.drag) {
      canvas.style.touchAction = "none";
      canvas.style.cursor = "crosshair";
      var dragging = false, moved = 0, lastX = 0, lastY = 0;

      canvas.addEventListener("pointerdown", function (e) {
        dragging = true; moved = 0;
        lastX = e.clientX; lastY = e.clientY;
        canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - lastX, dy = e.clientY - lastY;
        moved += Math.abs(dx) + Math.abs(dy);
        if (opts.drag) {
          if (m.mode === "globe") {
            m.view.lon0 = ((m.view.lon0 - dx * 0.4 + 540) % 360) - 180;
            m.view.lat0 = A.clamp(m.view.lat0 + dy * 0.4, -85, 85);
          } else {
            var spanX = m.view.lonR - m.view.lonL, spanY = m.view.latT - m.view.latB;
            var sx = dx / m.w * spanX, sy = dy / m.h * spanY;
            m.view.lonL -= sx; m.view.lonR -= sx;
            m.view.latT += sy; m.view.latB += sy;
          }
          m.draw();
        }
        lastX = e.clientX; lastY = e.clientY;
      });
      canvas.addEventListener("pointerup", function (e) {
        dragging = false;
        if (moved > 8) return;                       // it was a drag, not a tap
        var r = canvas.getBoundingClientRect();
        var ll = m.unproject(e.clientX - r.left, e.clientY - r.top);
        if (!ll) return;
        if (opts.onCountry) {
          var iso = m.at(ll[0], ll[1]);
          opts.onCountry(iso, ll);
        }
        if (opts.onPick) opts.onPick(ll[0], ll[1]);
      });
      if (opts.wheel !== false && m.mode !== "globe") {
        canvas.addEventListener("wheel", function (e) {
          e.preventDefault();
          var k = e.deltaY > 0 ? 1.12 : 1 / 1.12;
          var r = canvas.getBoundingClientRect();
          var ll = m.unproject(e.clientX - r.left, e.clientY - r.top);
          if (!ll) return;
          var v = m.view;
          v.lonL = ll[1] + (v.lonL - ll[1]) * k; v.lonR = ll[1] + (v.lonR - ll[1]) * k;
          v.latT = ll[0] + (v.latT - ll[0]) * k; v.latB = ll[0] + (v.latB - ll[0]) * k;
          m.draw();
        }, { passive: false });
      }
    }

    // Which country is at this lat/lon? (point-in-polygon over the rings)
    m.at = function (lat, lon) {
      var w = W(); if (!w) return null;
      var codes = m.only || w.all();
      for (var i = 0; i < codes.length; i++) {
        var bb = w.bbox(codes[i]);
        if (!bb || lon < bb[0] || lon > bb[2] || lat < bb[1] || lat > bb[3]) continue;
        if (inRings(w.rings(codes[i]), lon, lat)) return codes[i];
      }
      return null;
    };

    m.resizeOn = function () {
      var t;
      window.addEventListener("resize", function () {
        clearTimeout(t); t = setTimeout(function () { m.draw(); }, 120);
      });
      return m;
    };

    return m;
  };

  function inRings(rings, x, y) {
    if (!rings) return false;
    var inside = false;
    for (var r = 0; r < rings.length; r++) {
      var ring = rings[r];
      for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
      }
    }
    return inside;
  }
  A.inRings = inRings;

  function greatCircle(a, b, n) {
    var r = Math.PI / 180, out = [];
    var f1 = a[0] * r, l1 = a[1] * r, f2 = b[0] * r, l2 = b[1] * r;
    var d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((f2 - f1) / 2), 2) +
      Math.cos(f1) * Math.cos(f2) * Math.pow(Math.sin((l2 - l1) / 2), 2)));
    if (!d) return [a, b];
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      var A1 = Math.sin((1 - t) * d) / Math.sin(d), B1 = Math.sin(t * d) / Math.sin(d);
      var x = A1 * Math.cos(f1) * Math.cos(l1) + B1 * Math.cos(f2) * Math.cos(l2);
      var y = A1 * Math.cos(f1) * Math.sin(l1) + B1 * Math.cos(f2) * Math.sin(l2);
      var z = A1 * Math.sin(f1) + B1 * Math.sin(f2);
      out.push([Math.atan2(z, Math.sqrt(x * x + y * y)) / r, Math.atan2(y, x) / r]);
    }
    return out;
  }
  A.greatCircle = greatCircle;

  function mono() { return '"SF Mono",Menlo,Monaco,monospace'; }

  /* ── silhouette helper (Worldle-style shape quiz) ─────────────────────── */

  A.silhouette = function (canvas, iso, o) {
    o = o || {};
    var w = W(); if (!w) return false;
    var rings = w.rings(iso);
    if (!rings || !rings.length) return false;
    var bb = w.bbox(iso);
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var r = canvas.getBoundingClientRect();
    var cw = Math.round(r.width || canvas.width || 260), ch = Math.round(r.height || canvas.height || 260);
    canvas.width = cw * dpr; canvas.height = ch * dpr;
    var g = canvas.getContext("2d");
    g.save(); g.scale(dpr, dpr); g.clearRect(0, 0, cw, ch);

    var pad = o.pad === undefined ? 14 : o.pad;
    // Mercator-ish vertical stretch so shapes aren't squashed near the poles.
    var midLat = (bb[1] + bb[3]) / 2;
    var kx = Math.cos(midLat * Math.PI / 180) || 1;
    var spanX = (bb[2] - bb[0]) * kx, spanY = (bb[3] - bb[1]);
    var s = Math.min((cw - pad * 2) / (spanX || 1), (ch - pad * 2) / (spanY || 1));
    var ox = (cw - spanX * s) / 2, oy = (ch - spanY * s) / 2;
    var rot = (o.rotate || 0) * Math.PI / 180;
    if (rot) { g.translate(cw / 2, ch / 2); g.rotate(rot); g.translate(-cw / 2, -ch / 2); }

    g.beginPath();
    rings.forEach(function (ring) {
      ring.forEach(function (p, i) {
        var x = ox + (p[0] - bb[0]) * kx * s;
        var y = oy + (bb[3] - p[1]) * s;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      });
      g.closePath();
    });
    g.fillStyle = o.fill || "#ffe3f3";
    g.fill();
    if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = o.lw || 1; g.stroke(); }
    g.restore();
    return true;
  };

  /* ── proximity helpers every geo game wants ──────────────────────────── */

  A.geo = {
    // 0..1 closeness, the *-dle convention (max distance ≈ half the globe)
    prox: function (km) { return A.clamp(1 - km / 20015, 0, 1); },
    // Globle-style heat colour: near = hot
    heat: function (km) {
      var t = A.clamp(1 - km / 12000, 0, 1);
      var stops = [[0, [70, 50, 140]], [.45, [255, 216, 79]], [.75, [255, 140, 60]], [1, [255, 45, 90]]];
      for (var i = 1; i < stops.length; i++) {
        if (t <= stops[i][0]) {
          var a = stops[i - 1], b = stops[i], f = (t - a[0]) / (b[0] - a[0]);
          return "rgb(" + a[1].map(function (v, k) { return Math.round(v + (b[1][k] - v) * f); }).join(",") + ")";
        }
      }
      return "rgb(255,45,90)";
    },
    km: function (n) { return n < 10 ? n.toFixed(1) + " km" : Math.round(n).toLocaleString() + " km"; },
  };

})(window.A);
