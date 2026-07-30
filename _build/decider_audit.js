// _build/decider_audit.js -- measure THE DECIDER's real round-builder headlessly.
//
//   osascript -l JavaScript _build/decider_audit.js
//
// Runs the SHIPPED games/decider/game.js against the SHIPPED
// core/data/trivia.js under JavaScriptCore, with just enough of the arcade core
// and the DOM stubbed to let the cabinet boot, then calls window.__DC.audit().
// This is deliberately the real picker rather than a Python re-implementation:
// a reimplementation would measure the model of the code, not the code.
// (node is not installed on this machine.)
ObjC.import("Foundation");

var ROOT = "/Users/mishasalahshoor/cbai-ops/misha-arcade/";
var CARDS = 400;

function slurp(rel) {
  return $.NSString.stringWithContentsOfFileEncodingError(
    $(ROOT + rel), $.NSUTF8StringEncoding, null).js;
}

/* ── the DOM, only as much of it as boots the cabinet ────────────────────── */

function El(tag) {
  var e = {
    tagName: String(tag || "div").toUpperCase(),
    children: [], innerHTML: "", textContent: "", type: "", value: "",
    disabled: false, offsetWidth: 1,
    style: { setProperty: function () {} },
    classList: {
      add: function () {}, remove: function () {},
      contains: function () { return false; },
    },
    appendChild: function (c) { e.children.push(c); return c; },
    removeChild: function () {}, remove: function () {},
    setAttribute: function () {}, getAttribute: function () { return "0"; },
    addEventListener: function () {}, removeEventListener: function () {},
    focus: function () {}, blur: function () {},
    querySelector: function () { return El("div"); },
    querySelectorAll: function () { return []; },
  };
  return e;
}

var document = {
  body: El("body"),
  createElement: El,
  addEventListener: function () {},
  querySelector: function () { return null; },
  querySelectorAll: function () { return []; },
  activeElement: null,
};
var window = { AD_TRIVIA: null, location: { hash: "", search: "" } };
var navigator = { share: null };

/* ── the arcade core, only the parts the decider touches ─────────────────── */

var store = {};
var A = {
  NS: "ag_",
  PRACTICE: -999999,
  SITE: "https://salahshoormisha.github.io/misha-arcade/",
  clamp: function (n, lo, hi) { return n < lo ? lo : n > hi ? hi : n; },
  esc: function (s) { return String(s); },
  fmtNum: function (n) { return String(n); },

  // Verbatim from core/arcade.js. The measurements only mean anything if the
  // random number generator is bit-for-bit the one the browser runs.
  hash: function (str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
    }
    return h >>> 0;
  },
  rng: function (seed) {
    var a = typeof seed === "number" ? seed >>> 0 : A.hash(String(seed));
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  pick: function (rand, arr) { return arr[Math.floor(rand() * arr.length)]; },
  shuffle: function (rand, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  },
  sample: function (rand, arr, n) { return A.shuffle(rand, arr).slice(0, n); },

  _get: function (k, d) { return store[k] === undefined ? d : store[k]; },
  _set: function (k, v) { store[k] = v; },
  settings: function () { return { player: "Misha", colourblind: false }; },
  set: function () {},
  load: function () { return null; },
  save: function () {},
  finish: function () {},
  requestedDay: function () { return 3; },
  el: function (t, c, h) { var e = El(t); if (h !== undefined) e.innerHTML = h; return e; },
  mount: function () { return El("main"); },
  $$: function () { return []; },
  toast: function () {}, sfx: function () {}, confetti: function () {},
  archiveModal: function () {}, register: function () {}, setPar: function () {},
  on: function () {},
  results: function () { return { body: El("div") }; },
};

/* ── load the shipped files, exactly as the page does ────────────────────── */

(new Function("window", slurp("core/data/trivia.js")))(window);
(new Function("window", "document", "navigator", "A",
  slurp("games/decider/game.js")))(window, document, navigator, A);

if (!window.__DC) throw new Error("game.js did not expose __DC -- it bailed during boot");

var bank = window.AD_TRIVIA.questions;
var byCat = {}, byDiff = {}, i;
for (i = 0; i < bank.length; i++) {
  byCat[bank[i].cat] = (byCat[bank[i].cat] || 0) + 1;
  byDiff[bank[i].diff] = (byDiff[bank[i].diff] || 0) + 1;
}

JSON.stringify({
  bankSize: bank.length,
  bankNumeric: bank.filter(function (q) { return q.numeric; }).length,
  bankByDiff: byDiff,
  bankByCat: byCat,
  served: window.__DC.audit(CARDS),
}, null, 1);
