/* ============================================================================
   MIDNIGHT ARCADE · DAILY WING — flag loader / renderer
   Real vector flags (core/data/flags/XX.svg), fetched on demand and cached in
   memory. Used by FLAGLE (tile reveal), the flag quizzes and the PASSPORT.

     A.flagImg("IR").then(img => ...)         // decoded <img>, ready to draw
     A.flagEl("IR", {height:60})              // an <img> element you can append
     A.flagDraw(ctx, img, x, y, w, h)         // letterboxed draw, correct ratio
   ========================================================================== */
(function (A) {
  "use strict";

  var cache = {}, imgCache = {};

  A.flagMeta = function (iso) {
    var F = window.AD_FLAGS;
    return (F && F[String(iso).toUpperCase()]) || null;
  };

  A.flagURL = function (iso) {
    iso = String(iso).toUpperCase();
    var meta = A.flagMeta(iso);
    return A.rootPath() + "core/data/flags/" + ((meta && meta.file) || (iso + ".svg"));
  };

  A.flagText = function (iso) {
    iso = String(iso).toUpperCase();
    if (cache[iso]) return cache[iso];
    cache[iso] = fetch(A.flagURL(iso))
      .then(function (r) { if (!r.ok) throw new Error("no flag " + iso); return r.text(); })
      .catch(function (e) { delete cache[iso]; throw e; });
    return cache[iso];
  };

  /** A decoded <img> of the flag — safe to drawImage() immediately. */
  A.flagImg = function (iso) {
    iso = String(iso).toUpperCase();
    if (imgCache[iso]) return imgCache[iso];
    imgCache[iso] = A.flagText(iso).then(function (svg) {
      return new Promise(function (res, rej) {
        var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        var im = new Image();
        im.decoding = "sync";
        im.onload = function () { res(im); };
        im.onerror = function () { rej(new Error("decode " + iso)); };
        im.src = url;
      });
    }).catch(function (e) { delete imgCache[iso]; throw e; });
    return imgCache[iso];
  };

  A.flagEl = function (iso, o) {
    o = o || {};
    var im = document.createElement("img");
    im.alt = o.alt === undefined ? ("flag of " + iso) : o.alt;
    im.loading = "lazy";
    im.style.cssText = "display:block;border-radius:3px;box-shadow:0 2px 10px #0006;" +
      (o.height ? "height:" + o.height + "px;width:auto;" : "") +
      (o.width ? "width:" + o.width + "px;height:auto;" : "") + (o.css || "");
    im.src = A.flagURL(iso);
    if (o.blank) { im.alt = ""; im.setAttribute("aria-hidden", "true"); }
    return im;
  };

  /** Draw preserving aspect ratio, centred in the box (never stretched). */
  A.flagDraw = function (g, img, x, y, w, h, mode) {
    var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return null;
    var s = mode === "cover" ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
    var dw = iw * s, dh = ih * s;
    var dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;
    g.drawImage(img, dx, dy, dw, dh);
    return { x: dx, y: dy, w: dw, h: dh };
  };

  /** Preload a set of flags (call with the day's answer + decoys). */
  A.flagPreload = function (list) {
    return Promise.all((list || []).map(function (i) {
      return A.flagImg(i).catch(function () { return null; });
    }));
  };

  /** Pretty colour swatches for hints, from the flags.js index. */
  A.flagSwatches = function (iso) {
    var meta = A.flagMeta(iso);
    if (!meta || !meta.colours) return "";
    var HEX = {
      red: "#d7192d", white: "#fff", blue: "#22409a", green: "#12874a",
      yellow: "#fcd116", black: "#111", orange: "#ff8200", maroon: "#7b1128",
      cyan: "#39c2d7", purple: "#6a2c91",
    };
    return meta.colours.slice(0, 5).map(function (c) {
      return '<i style="display:inline-block;width:13px;height:13px;border-radius:3px;vertical-align:-2px;' +
        "border:1px solid #ffffff30;background:" + (HEX[c] || "#888") + '" title="' + c + '"></i>';
    }).join(" ");
  };

  A.flagFeatureLabel = function (f) {
    var L = {
      "horizontal-tricolour": "three horizontal bands", "vertical-tricolour": "three vertical bands",
      bicolour: "two bands", cross: "a cross", saltire: "a diagonal cross",
      canton: "a canton in the corner", crescent: "a crescent", star: "a single star",
      stars: "multiple stars", sun: "a sun", emblem: "a central emblem",
      "coat-of-arms": "a coat of arms", animal: "an animal", plant: "a plant or tree",
      text: "written script", triangle: "a triangle", chevron: "a chevron",
      diagonal: "a diagonal division", bordered: "a border", "unique-shape": "a non-rectangular shape",
    };
    return L[f] || f;
  };

})(window.A);
