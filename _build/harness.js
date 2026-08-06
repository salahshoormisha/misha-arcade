/* ===========================================================================
   harness.js — a real-enough DOM for JavaScriptCore, so a cabinet can be driven
   headlessly THROUGH ITS OWN BUTTONS.

   Why this exists: this arcade has already shipped a dead END TURN button that
   300 passing tests never touched, because the tests called the function *under*
   the button. Everything here exists so a test can say H.click(H.find("#go"))
   and have the same code path run that a finger would run.

   USE
     JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
     $JSC _build/harness.js core/arcade.js core/data/words.js \
          games/wordish/game.js _build/t_wordish.js

   In the test file:
     H.html("games/wordish/index.html");   // parse the REAL markup into the DOM
     H.boot();                             // fire DOMContentLoaded then load
     H.click(H.find(".key[data-k=A]"));    // drive the real handler
     H.flush();                            // run pending timers to quiescence
     print(H.text(H.find("#board")));

   WHAT IS FAKE, and therefore what this cannot prove: layout (every rect is
   zero-sized), painting (canvas records calls, draws nothing), fonts, CSS
   cascade beyond custom properties, and scrolling. A green run here means the
   LOGIC and the WIRING are right. It says nothing about whether the thing looks
   good — check that by reading the CSS against a cabinet already known good.
   =========================================================================== */

(function () {
  "use strict";

  var ROOT = (function () {
    // Tests are run from the repo root, but be forgiving.
    try { readFile("core/style.css"); return ""; } catch (e) {}
    try { readFile("../core/style.css"); return "../"; } catch (e) {}
    return "/Users/mishasalahshoor/cbai-ops/misha-arcade/";
  })();

  /* ── console ────────────────────────────────────────────────────────── */
  function fmt(a) {
    if (typeof a === "string") return a;
    if (a === null) return "null";
    if (a === undefined) return "undefined";
    if (typeof a === "object") {
      try { return JSON.stringify(a); } catch (e) { return String(a); }
    }
    return String(a);
  }
  var LOG = [];
  globalThis.console = {
    log: function () { var s = Array.prototype.map.call(arguments, fmt).join(" "); LOG.push(s); print(s); },
    warn: function () { var s = "WARN " + Array.prototype.map.call(arguments, fmt).join(" "); LOG.push(s); print(s); },
    error: function () { var s = "ERROR " + Array.prototype.map.call(arguments, fmt).join(" "); LOG.push(s); print(s); },
    info: function () { this.log.apply(this, arguments); },
    debug: function () {},
    table: function (x) { this.log(x); },
    group: function () {}, groupEnd: function () {}, time: function () {}, timeEnd: function () {},
  };

  /* ── events ─────────────────────────────────────────────────────────── */
  function Event(type, init) {
    init = init || {};
    this.type = type;
    this.bubbles = !!init.bubbles;
    this.cancelable = !!init.cancelable;
    this.defaultPrevented = false;
    this.target = null;
    this.currentTarget = null;
    this._stop = false;
    this._stopImmediate = false;
    for (var k in init) if (!(k in this)) this[k] = init[k];
  }
  Event.prototype.preventDefault = function () { this.defaultPrevented = true; };
  Event.prototype.stopPropagation = function () { this._stop = true; };
  Event.prototype.stopImmediatePropagation = function () { this._stop = this._stopImmediate = true; };

  function CustomEvent(type, init) { Event.call(this, type, init); this.detail = (init || {}).detail; }
  CustomEvent.prototype = Object.create(Event.prototype);

  function KeyboardEvent(type, init) {
    Event.call(this, type, init); init = init || {};
    this.key = init.key || ""; this.code = init.code || this.key;
    this.keyCode = init.keyCode || 0;
    this.shiftKey = !!init.shiftKey; this.ctrlKey = !!init.ctrlKey;
    this.metaKey = !!init.metaKey; this.altKey = !!init.altKey;
    this.repeat = !!init.repeat;
  }
  KeyboardEvent.prototype = Object.create(Event.prototype);

  function MouseEvent(type, init) {
    Event.call(this, type, init); init = init || {};
    this.clientX = init.clientX || 0; this.clientY = init.clientY || 0;
    this.offsetX = init.offsetX || 0; this.offsetY = init.offsetY || 0;
    this.button = init.button || 0;
    this.shiftKey = !!init.shiftKey; this.metaKey = !!init.metaKey;
    this.ctrlKey = !!init.ctrlKey; this.altKey = !!init.altKey;
  }
  MouseEvent.prototype = Object.create(Event.prototype);

  function TouchEvent(type, init) {
    Event.call(this, type, init); init = init || {};
    this.touches = init.touches || []; this.changedTouches = init.changedTouches || this.touches;
  }
  TouchEvent.prototype = Object.create(Event.prototype);

  /* ── style ──────────────────────────────────────────────────────────── */
  var CSS_PROPS = ("display,position,top,left,right,bottom,width,height,margin,padding," +
    "background,backgroundColor,backgroundImage,color,border,borderColor,borderRadius," +
    "opacity,transform,transition,font,fontSize,fontWeight,fontFamily,textAlign," +
    "visibility,zIndex,overflow,flex,gap,gridTemplateColumns,gridTemplateRows," +
    "lineHeight,letterSpacing,boxShadow,filter,cursor,pointerEvents,whiteSpace," +
    "maxWidth,minWidth,maxHeight,minHeight,textTransform,animation,inset,aspectRatio").split(",");

  function Style(owner) {
    Object.defineProperty(this, "_own", { value: owner || null, enumerable: false });
    Object.defineProperty(this, "_v", { value: {}, enumerable: false });
  }
  Style.prototype.setProperty = function (k, v) { this._v[k] = v == null ? "" : String(v); };
  Style.prototype.removeProperty = function (k) { var o = this._v[k]; delete this._v[k]; return o; };
  Style.prototype.getPropertyValue = function (k) {
    if (k in this._v) return this._v[k];
    // camelCase mirror, so el.style.color = "red" is visible to getPropertyValue
    var camel = k.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
    if (this[camel] != null && this[camel] !== "") return String(this[camel]);
    return "";
  };
  Object.defineProperty(Style.prototype, "cssText", {
    get: function () {
      var out = [], self = this;
      Object.keys(this._v).forEach(function (k) { out.push(k + ": " + self._v[k]); });
      CSS_PROPS.forEach(function (p) {
        if (self[p] != null && self[p] !== "") {
          out.push(p.replace(/[A-Z]/g, function (c) { return "-" + c.toLowerCase(); }) + ": " + self[p]);
        }
      });
      return out.join("; ");
    },
    set: function (t) {
      var self = this;
      String(t).split(";").forEach(function (decl) {
        var i = decl.indexOf(":");
        if (i < 0) return;
        var k = decl.slice(0, i).trim(), v = decl.slice(i + 1).trim();
        if (!k) return;
        if (k.slice(0, 2) === "--") self._v[k] = v;
        else self[k.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); })] = v;
      });
    },
  });
  CSS_PROPS.forEach(function (p) { Style.prototype[p] = ""; });

  /* the real design tokens, parsed out of core/style.css so this never drifts */
  var TOKENS = (function () {
    var t = {};
    try {
      var css = readFile(ROOT + "core/style.css");
      var re = /(--[a-z0-9-]+)\s*:\s*([^;}]+)/gi, m;
      while ((m = re.exec(css))) if (!(m[1] in t)) t[m[1]] = m[2].trim();
    } catch (e) {
      t["--ink"] = "#f5f2f8"; t["--s1"] = "#141220"; t["--bg-far"] = "#06050b";
    }
    return t;
  })();

  /* ── DOM ────────────────────────────────────────────────────────────── */
  var VOID = { br: 1, hr: 1, img: 1, input: 1, meta: 1, link: 1, source: 1, area: 1, base: 1, col: 1, embed: 1, track: 1, wbr: 1 };

  function ClassList(el) { this._el = el; }
  ClassList.prototype._list = function () {
    return (this._el.className || "").split(/\s+/).filter(Boolean);
  };
  ClassList.prototype._set = function (a) {
    var seen = {}, out = [];
    a.forEach(function (c) { if (c && !seen[c]) { seen[c] = 1; out.push(c); } });
    this._el.className = out.join(" ");
  };
  ClassList.prototype.add = function () {
    this._set(this._list().concat(Array.prototype.slice.call(arguments)));
  };
  ClassList.prototype.remove = function () {
    var kill = Array.prototype.slice.call(arguments);
    this._set(this._list().filter(function (c) { return kill.indexOf(c) < 0; }));
  };
  ClassList.prototype.contains = function (c) { return this._list().indexOf(c) >= 0; };
  ClassList.prototype.toggle = function (c, force) {
    var has = this.contains(c);
    var want = force === undefined ? !has : !!force;
    if (want) this.add(c); else this.remove(c);
    return want;
  };
  Object.defineProperty(ClassList.prototype, "length", { get: function () { return this._list().length; } });

  function TextNode(t) { this.nodeType = 3; this.nodeValue = String(t); this.parentNode = null; }
  Object.defineProperty(TextNode.prototype, "textContent", {
    get: function () { return this.nodeValue; },
    set: function (v) { this.nodeValue = String(v); },
  });

  var UID = 0;

  function Element(tag) {
    this.nodeType = 1;
    this.tagName = String(tag).toUpperCase();
    this.localName = String(tag).toLowerCase();
    this.childNodes = [];
    this.parentNode = null;
    this.attributes = {};
    this.className = "";
    this.id = "";
    this.style = new Style(this);
    this.classList = new ClassList(this);
    this.dataset = {};
    this._h = {};                 // handlers, by type
    this._uid = ++UID;
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
    this.scrollTop = 0; this.scrollLeft = 0;
    this.scrollWidth = 0; this.scrollHeight = 0;
    this.clientWidth = 0; this.clientHeight = 0;
    this.offsetWidth = 0; this.offsetHeight = 0;
    this.selectionStart = 0; this.selectionEnd = 0;
    if (this.localName === "canvas") { this.width = 300; this.height = 150; }
  }

  Object.defineProperty(Element.prototype, "children", {
    get: function () { return this.childNodes.filter(function (n) { return n.nodeType === 1; }); },
  });
  Object.defineProperty(Element.prototype, "firstChild", {
    get: function () { return this.childNodes[0] || null; },
  });
  Object.defineProperty(Element.prototype, "lastChild", {
    get: function () { return this.childNodes[this.childNodes.length - 1] || null; },
  });
  Object.defineProperty(Element.prototype, "firstElementChild", {
    get: function () { return this.children[0] || null; },
  });
  Object.defineProperty(Element.prototype, "lastElementChild", {
    get: function () { var c = this.children; return c[c.length - 1] || null; },
  });
  Object.defineProperty(Element.prototype, "childElementCount", {
    get: function () { return this.children.length; },
  });
  Object.defineProperty(Element.prototype, "nextSibling", {
    get: function () {
      if (!this.parentNode) return null;
      var i = this.parentNode.childNodes.indexOf(this);
      return this.parentNode.childNodes[i + 1] || null;
    },
  });
  Object.defineProperty(Element.prototype, "nextElementSibling", {
    get: function () {
      if (!this.parentNode) return null;
      var s = this.parentNode.children, i = s.indexOf(this);
      return s[i + 1] || null;
    },
  });
  Object.defineProperty(Element.prototype, "previousElementSibling", {
    get: function () {
      if (!this.parentNode) return null;
      var s = this.parentNode.children, i = s.indexOf(this);
      return i > 0 ? s[i - 1] : null;
    },
  });
  Object.defineProperty(Element.prototype, "parentElement", {
    get: function () { return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null; },
  });

  Element.prototype.appendChild = function (n) {
    if (n.nodeType === 11) {          // fragment
      n.childNodes.slice().forEach(this.appendChild, this);
      return n;
    }
    if (n.parentNode) n.parentNode.removeChild(n);
    n.parentNode = this;
    this.childNodes.push(n);
    return n;
  };
  Element.prototype.append = function () {
    Array.prototype.forEach.call(arguments, function (n) {
      this.appendChild(typeof n === "string" ? new TextNode(n) : n);
    }, this);
  };
  Element.prototype.removeChild = function (n) {
    var i = this.childNodes.indexOf(n);
    if (i >= 0) { this.childNodes.splice(i, 1); n.parentNode = null; }
    return n;
  };
  Element.prototype.insertBefore = function (n, ref) {
    if (n.parentNode) n.parentNode.removeChild(n);
    var i = ref ? this.childNodes.indexOf(ref) : -1;
    n.parentNode = this;
    if (i < 0) this.childNodes.push(n); else this.childNodes.splice(i, 0, n);
    return n;
  };
  Element.prototype.replaceChild = function (nu, old) {
    this.insertBefore(nu, old); this.removeChild(old); return old;
  };
  Element.prototype.remove = function () { if (this.parentNode) this.parentNode.removeChild(this); };
  Element.prototype.cloneNode = function (deep) {
    var e = new Element(this.localName);
    e.className = this.className; e.id = this.id;
    var self = this;
    Object.keys(this.attributes).forEach(function (k) { e.attributes[k] = self.attributes[k]; });
    Object.keys(this.dataset).forEach(function (k) { e.dataset[k] = self.dataset[k]; });
    e.style.cssText = this.style.cssText;
    e.value = this.value;
    if (deep) this.childNodes.forEach(function (c) {
      e.appendChild(c.nodeType === 3 ? new TextNode(c.nodeValue) : c.cloneNode(true));
    });
    return e;
  };
  Element.prototype.contains = function (n) {
    while (n) { if (n === this) return true; n = n.parentNode; }
    return false;
  };
  Element.prototype.closest = function (sel) {
    var n = this;
    while (n && n.nodeType === 1) { if (matches(n, sel)) return n; n = n.parentNode; }
    return null;
  };
  Element.prototype.matches = function (sel) { return matches(this, sel); };

  Element.prototype.setAttribute = function (k, v) {
    v = String(v);
    this.attributes[k] = v;
    if (k === "class") this.className = v;
    else if (k === "id") this.id = v;
    else if (k === "style") this.style.cssText = v;
    else if (k === "value") this.value = v;
    else if (k === "disabled") this.disabled = true;
    else if (k === "hidden") this.hidden = true;
    else if (k.slice(0, 5) === "data-") {
      this.dataset[k.slice(5).replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); })] = v;
    } else if (k === "width" || k === "height") this[k] = parseFloat(v) || 0;
  };
  Element.prototype.getAttribute = function (k) {
    if (k === "class") return this.className || null;
    if (k === "id") return this.id || null;
    if (k === "style") return this.style.cssText || null;
    return k in this.attributes ? this.attributes[k] : null;
  };
  Element.prototype.hasAttribute = function (k) { return this.getAttribute(k) !== null; };
  Element.prototype.removeAttribute = function (k) {
    delete this.attributes[k];
    if (k === "class") this.className = "";
    if (k === "disabled") this.disabled = false;
    if (k === "hidden") this.hidden = false;
  };
  Element.prototype.setAttributeNS = function (ns, k, v) { this.setAttribute(k, v); };

  Object.defineProperty(Element.prototype, "textContent", {
    get: function () {
      return this.childNodes.map(function (n) {
        return n.nodeType === 3 ? n.nodeValue : n.textContent;
      }).join("");
    },
    set: function (v) {
      this.childNodes.forEach(function (n) { n.parentNode = null; });
      this.childNodes = [];
      if (v !== "" && v != null) this.appendChild(new TextNode(v));
    },
  });
  Object.defineProperty(Element.prototype, "innerText", {
    get: function () { return this.textContent; },
    set: function (v) { this.textContent = v; },
  });

  Object.defineProperty(Element.prototype, "innerHTML", {
    get: function () { return serialize(this.childNodes); },
    set: function (h) {
      this.childNodes.forEach(function (n) { n.parentNode = null; });
      this.childNodes = [];
      parseInto(this, String(h));
    },
  });
  Object.defineProperty(Element.prototype, "outerHTML", {
    get: function () { return serialize([this]); },
  });

  Element.prototype.getBoundingClientRect = function () {
    return { x: 0, y: 0, top: 0, left: 0, right: this.offsetWidth, bottom: this.offsetHeight,
             width: this.offsetWidth, height: this.offsetHeight };
  };
  Element.prototype.focus = function () { doc.activeElement = this; this.dispatchEvent(new Event("focus")); };
  Element.prototype.blur = function () { if (doc.activeElement === this) doc.activeElement = doc.body; };
  Element.prototype.select = function () {};
  Element.prototype.setSelectionRange = function () {};
  Element.prototype.scrollIntoView = function () {};
  Element.prototype.animate = function () { return { finished: Promise.resolve(), cancel: function () {} }; };
  Element.prototype.getContext = function (kind) {
    if (kind !== "2d") return null;
    if (!this._ctx) this._ctx = makeCtx(this);
    return this._ctx;
  };
  Element.prototype.toDataURL = function () { return "data:image/png;base64,"; };
  Element.prototype.toBlob = function (cb) { cb({ size: 0, type: "image/png" }); };
  Element.prototype.play = function () { return Promise.resolve(); };
  Element.prototype.pause = function () {};

  Element.prototype.addEventListener = function (t, fn, opt) {
    if (!fn) return;
    (this._h[t] = this._h[t] || []).push({ fn: fn, once: !!(opt && opt.once) });
  };
  Element.prototype.removeEventListener = function (t, fn) {
    if (!this._h[t]) return;
    this._h[t] = this._h[t].filter(function (h) { return h.fn !== fn; });
  };
  Element.prototype.dispatchEvent = function (ev) {
    ev.target = ev.target || this;
    var node = this;
    while (node) {
      ev.currentTarget = node;
      var hs = (node._h && node._h[ev.type]) ? node._h[ev.type].slice() : [];
      // the on* property is a listener too, and games use both
      var on = node["on" + ev.type];
      if (typeof on === "function") hs.unshift({ fn: on, once: false });
      for (var i = 0; i < hs.length; i++) {
        try { hs[i].fn.call(node, ev); }
        catch (e) { console.error("listener " + ev.type + " on " + tagOf(node) + ": " + (e && e.stack || e)); }
        if (hs[i].once) node.removeEventListener(ev.type, hs[i].fn);
        if (ev._stopImmediate) return !ev.defaultPrevented;
      }
      if (!ev.bubbles || ev._stop) break;
      node = node.parentNode || (node === doc.documentElement ? null : (node === doc ? null : (node.parentNode || (node !== doc ? doc : null))));
      if (node === doc) { // let document-level listeners run, then window
        ev.currentTarget = doc;
        var dh = (doc._h[ev.type] || []).slice();
        for (var j = 0; j < dh.length; j++) {
          try { dh[j].fn.call(doc, ev); } catch (e) { console.error("doc listener " + ev.type + ": " + (e && e.stack || e)); }
        }
        node = null;
      }
    }
    return !ev.defaultPrevented;
  };
  Element.prototype.click = function () {
    this.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    this.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    this.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    this.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  };
  Element.prototype.querySelector = function (s) { return query(this, s, true); };
  Element.prototype.querySelectorAll = function (s) { return query(this, s, false); };
  Element.prototype.getElementsByClassName = function (c) { return query(this, "." + c, false); };
  Element.prototype.getElementsByTagName = function (t) { return query(this, t, false); };

  function tagOf(n) {
    if (!n || !n.localName) return "?";
    return n.localName + (n.id ? "#" + n.id : "") + (n.className ? "." + n.className.split(/\s+/).join(".") : "");
  }

  function Fragment() { this.nodeType = 11; this.childNodes = []; this.parentNode = null; }
  Fragment.prototype.appendChild = Element.prototype.appendChild;
  Fragment.prototype.querySelector = Element.prototype.querySelector;
  Fragment.prototype.querySelectorAll = Element.prototype.querySelectorAll;

  /* ── selectors ──────────────────────────────────────────────────────── */
  // Supports: comma lists, descendant and > combinators, tag, #id, .class,
  // [attr], [attr=v], [attr="v"], :not(simple), :first-child, :last-child.
  function matchSimple(el, sel) {
    if (el.nodeType !== 1) return false;
    var re = /([#.]?[\w-]+|\[[^\]]+\]|:not\([^)]+\)|:[\w-]+|\*)/g, m;
    while ((m = re.exec(sel))) {
      var tok = m[1];
      if (tok === "*") continue;
      if (tok[0] === "#") { if (el.id !== tok.slice(1)) return false; }
      else if (tok[0] === ".") { if (!el.classList.contains(tok.slice(1))) return false; }
      else if (tok[0] === "[") {
        var body = tok.slice(1, -1);
        var eq = body.indexOf("=");
        if (eq < 0) { if (!el.hasAttribute(body.trim())) return false; }
        else {
          var k = body.slice(0, eq).replace(/[~^$*|]$/, "").trim();
          var v = body.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
          if (String(el.getAttribute(k)) !== v) return false;
        }
      } else if (tok.slice(0, 5) === ":not(") {
        if (matchSimple(el, tok.slice(5, -1))) return false;
      } else if (tok[0] === ":") {
        var p = tok.slice(1);
        if (p === "first-child") { if (!el.parentElement || el.parentElement.children[0] !== el) return false; }
        else if (p === "last-child") {
          if (!el.parentElement) return false;
          var s = el.parentElement.children; if (s[s.length - 1] !== el) return false;
        }
        else if (p === "disabled") { if (!el.disabled) return false; }
        else if (p === "checked") { if (!el.checked) return false; }
        // anything else (:hover, ::before) is unmatchable headlessly — ignore
      } else if (el.localName !== tok.toLowerCase()) return false;
    }
    return true;
  }

  function matches(el, sel) {
    return String(sel).split(",").some(function (part) {
      var chain = part.trim().split(/\s*(>)\s*|\s+/).filter(function (x) { return x && x !== undefined; });
      if (!chain.length) return false;
      // walk right to left
      var i = chain.length - 1, node = el;
      if (!matchSimple(node, chain[i])) return false;
      i--;
      while (i >= 0) {
        var tok = chain[i];
        if (tok === ">") {
          i--;
          node = node.parentElement;
          if (!node || !matchSimple(node, chain[i])) return false;
          i--;
        } else {
          var p = node.parentElement, ok = false;
          while (p) { if (matchSimple(p, tok)) { ok = true; break; } p = p.parentElement; }
          if (!ok) return false;
          node = p; i--;
        }
      }
      return true;
    });
  }

  function query(root, sel, one) {
    var out = [];
    (function walk(n) {
      n.childNodes.forEach(function (c) {
        if (c.nodeType !== 1) return;
        if (matches(c, sel)) { out.push(c); if (one) throw { _found: c }; }
        walk(c);
      });
    })(root);
    return one ? null : out;
  }
  // one-hit fast exit without exceptions leaking
  var _query = query;
  query = function (root, sel, one) {
    if (!one) return _query(root, sel, false);
    try { _query(root, sel, true); } catch (e) { if (e && e._found) return e._found; throw e; }
    return null;
  };

  /* ── HTML parser ────────────────────────────────────────────────────── */
  function parseInto(parent, html) {
    var stack = [parent], i = 0, n = html.length;
    while (i < n) {
      var lt = html.indexOf("<", i);
      if (lt < 0) { addText(stack[stack.length - 1], html.slice(i)); break; }
      if (lt > i) addText(stack[stack.length - 1], html.slice(i, lt));
      if (html.substr(lt, 4) === "<!--") {
        var end = html.indexOf("-->", lt); i = end < 0 ? n : end + 3; continue;
      }
      if (html[lt + 1] === "!") { var g = html.indexOf(">", lt); i = g < 0 ? n : g + 1; continue; }
      if (html[lt + 1] === "/") {
        var gt = html.indexOf(">", lt);
        var name = html.slice(lt + 2, gt).trim().toLowerCase();
        for (var k = stack.length - 1; k > 0; k--) {
          if (stack[k].localName === name) { stack.length = k; break; }
        }
        i = gt < 0 ? n : gt + 1; continue;
      }
      // open tag
      var gt2 = lt + 1, q = 0;
      while (gt2 < n) {
        var ch = html[gt2];
        if (ch === '"' || ch === "'") { q = q === ch ? 0 : (q || ch); }
        else if (ch === ">" && !q) break;
        gt2++;
      }
      var raw = html.slice(lt + 1, gt2);
      var selfClose = /\/$/.test(raw.trim());
      raw = raw.replace(/\/$/, "");
      var sp = raw.search(/[\s]/);
      var tag = (sp < 0 ? raw : raw.slice(0, sp)).toLowerCase();
      var el = doc.createElement(tag);
      if (sp >= 0) {
        var ar = /([\w:.-]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g, am;
        var attrStr = raw.slice(sp);
        while ((am = ar.exec(attrStr))) {
          var v = am[2] === undefined ? "" : am[2].replace(/^["']|["']$/g, "");
          el.setAttribute(am[1], v);
        }
      }
      stack[stack.length - 1].appendChild(el);
      i = gt2 + 1;
      if (tag === "script" || tag === "style" || tag === "textarea") {
        var close = html.toLowerCase().indexOf("</" + tag, i);
        if (close < 0) close = n;
        el.appendChild(new TextNode(html.slice(i, close)));
        var cgt = html.indexOf(">", close);
        i = cgt < 0 ? n : cgt + 1;
        continue;
      }
      if (!selfClose && !VOID[tag]) stack.push(el);
    }
  }
  function addText(parent, t) {
    if (!/\S/.test(t) && !t) return;
    if (t === "") return;
    parent.appendChild(new TextNode(decode(t)));
  }
  function decode(s) {
    return s.replace(/&(amp|lt|gt|quot|#39|nbsp|mdash|ndash|times|hellip);/g, function (_, e) {
      return { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " ",
               mdash: "—", ndash: "–", times: "×", hellip: "…" }[e];
    });
  }
  function serialize(nodes) {
    return nodes.map(function (n) {
      if (n.nodeType === 3) return n.nodeValue;
      var a = "";
      if (n.className) a += ' class="' + n.className + '"';
      if (n.id) a += ' id="' + n.id + '"';
      Object.keys(n.attributes).forEach(function (k) {
        if (k === "class" || k === "id") return;
        a += " " + k + '="' + n.attributes[k] + '"';
      });
      if (VOID[n.localName]) return "<" + n.localName + a + ">";
      return "<" + n.localName + a + ">" + serialize(n.childNodes) + "</" + n.localName + ">";
    }).join("");
  }

  /* ── canvas 2d: records calls, draws nothing ────────────────────────── */
  function makeCtx(cv) {
    var calls = [];
    var ctx = {
      canvas: cv, _calls: calls,
      fillStyle: "#000", strokeStyle: "#000", lineWidth: 1, lineCap: "butt", lineJoin: "miter",
      font: "10px sans-serif", textAlign: "start", textBaseline: "alphabetic",
      globalAlpha: 1, globalCompositeOperation: "source-over", miterLimit: 10,
      shadowBlur: 0, shadowColor: "transparent", shadowOffsetX: 0, shadowOffsetY: 0,
      lineDashOffset: 0, imageSmoothingEnabled: true, filter: "none",
      measureText: function (t) { return { width: String(t).length * 6, actualBoundingBoxAscent: 7, actualBoundingBoxDescent: 2 }; },
      createLinearGradient: grad, createRadialGradient: grad, createConicGradient: grad,
      createPattern: function () { return {}; },
      getImageData: function (x, y, w, h) {
        return { width: w, height: h, data: new Uint8ClampedArray(Math.max(0, w * h * 4)) };
      },
      putImageData: function () {}, createImageData: function (w, h) {
        return { width: w, height: h, data: new Uint8ClampedArray(Math.max(0, w * h * 4)) };
      },
      isPointInPath: function () { return false; },
      setLineDash: function () {}, getLineDash: function () { return []; },
      getTransform: function () { return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; },
    };
    function grad() { return { addColorStop: function () {} }; }
    ("save,restore,scale,rotate,translate,transform,setTransform,resetTransform,beginPath," +
     "closePath,moveTo,lineTo,bezierCurveTo,quadraticCurveTo,arc,arcTo,ellipse,rect,roundRect," +
     "fill,stroke,clip,fillRect,strokeRect,clearRect,fillText,strokeText,drawImage,drawFocusIfNeeded"
    ).split(",").forEach(function (m) {
      ctx[m] = function () { calls.push([m].concat(Array.prototype.slice.call(arguments))); };
    });
    return ctx;
  }

  /* ── document / window ──────────────────────────────────────────────── */
  var doc = {
    nodeType: 9,
    _h: {},
    readyState: "loading",
    title: "",
    createElement: function (t) { return new Element(t); },
    createElementNS: function (ns, t) { return new Element(t); },
    createTextNode: function (t) { return new TextNode(t); },
    createDocumentFragment: function () { return new Fragment(); },
    getElementById: function (id) { return query(doc.documentElement, "#" + id, true); },
    querySelector: function (s) { return query(doc.documentElement, s, true); },
    querySelectorAll: function (s) { return query(doc.documentElement, s, false); },
    getElementsByTagName: function (t) { return query(doc.documentElement, t, false); },
    getElementsByClassName: function (c) { return query(doc.documentElement, "." + c, false); },
    addEventListener: function (t, fn, o) { (doc._h[t] = doc._h[t] || []).push({ fn: fn, once: !!(o && o.once) }); },
    removeEventListener: function (t, fn) {
      if (doc._h[t]) doc._h[t] = doc._h[t].filter(function (h) { return h.fn !== fn; });
    },
    dispatchEvent: function (ev) {
      ev.target = ev.target || doc; ev.currentTarget = doc;
      (doc._h[ev.type] || []).slice().forEach(function (h) {
        try { h.fn.call(doc, ev); } catch (e) { console.error("doc " + ev.type + ": " + (e && e.stack || e)); }
      });
      var on = doc["on" + ev.type];
      if (typeof on === "function") { try { on.call(doc, ev); } catch (e) { console.error(e); } }
      return !ev.defaultPrevented;
    },
    execCommand: function () { return true; },
    hasFocus: function () { return true; },
    visibilityState: "visible",
    hidden: false,
  };
  doc.documentElement = new Element("html");
  doc.head = new Element("head");
  doc.body = new Element("body");
  doc.documentElement.appendChild(doc.head);
  doc.documentElement.appendChild(doc.body);
  doc.activeElement = doc.body;
  doc.ownerDocument = doc;
  doc.defaultView = null;   // set below

  var store = {};
  var localStorage = {
    getItem: function (k) { return k in store ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    clear: function () { store = {}; },
    key: function (i) { return Object.keys(store)[i] || null; },
  };
  Object.defineProperty(localStorage, "length", { get: function () { return Object.keys(store).length; } });

  var raf = [];
  var win = globalThis;
  win.window = win;
  win.globalThis = win;
  win.document = doc;
  doc.defaultView = win;
  win.localStorage = localStorage;
  win.sessionStorage = { getItem: function () { return null; }, setItem: function () {},
                         removeItem: function () {}, clear: function () {} };
  win.Element = Element;
  win.HTMLElement = Element;
  win.HTMLCanvasElement = Element;
  win.Node = Element;
  win.Event = Event;
  win.CustomEvent = CustomEvent;
  win.KeyboardEvent = KeyboardEvent;
  win.MouseEvent = MouseEvent;
  win.PointerEvent = MouseEvent;
  win.TouchEvent = TouchEvent;
  win.innerWidth = 1280;
  win.innerHeight = 800;
  win.devicePixelRatio = 2;
  win.scrollX = win.scrollY = win.pageXOffset = win.pageYOffset = 0;
  win.scrollTo = function () {};
  win.self = win;
  win.top = win;
  win.parent = win;
  win.frameElement = null;
  win.name = "";
  win.isSecureContext = true;
  win.origin = "https://salahshoormisha.github.io";
  win.location = {
    href: "https://salahshoormisha.github.io/misha-arcade/games/x/",
    origin: "https://salahshoormisha.github.io",
    protocol: "https:", host: "salahshoormisha.github.io",
    hostname: "salahshoormisha.github.io", port: "",
    pathname: "/misha-arcade/games/x/", search: "", hash: "",
    assign: function (u) { win.location.href = u; },
    replace: function (u) { win.location.href = u; },
    reload: function () {},
    toString: function () { return win.location.href; },
  };
  win.history = {
    length: 1, state: null,
    pushState: function (s, t, u) { if (u) applyURL(u); },
    replaceState: function (s, t, u) { if (u) applyURL(u); },
    back: function () {}, forward: function () {}, go: function () {},
  };
  function applyURL(u) {
    u = String(u);
    var h = u.indexOf("#"), q = u.indexOf("?");
    win.location.hash = h >= 0 ? u.slice(h) : "";
    win.location.search = q >= 0 ? u.slice(q, h >= 0 ? h : undefined) : "";
  }
  win.navigator = {
    userAgent: "jsc-harness", language: "en-GB", languages: ["en-GB", "en"],
    platform: "MacIntel", maxTouchPoints: 0, onLine: true,
    clipboard: { writeText: function () { return Promise.resolve(); },
                 readText: function () { return Promise.resolve(""); } },
    share: function () { return Promise.resolve(); },
    canShare: function () { return false; },
    vibrate: function () { return true; },
    sendBeacon: function () { return true; },
  };
  win.screen = { width: 1280, height: 800, availWidth: 1280, availHeight: 800, orientation: { type: "landscape-primary" } };
  win.matchMedia = function (q) {
    var m = /min-width:\s*(\d+)/.exec(q);
    var hit = m ? win.innerWidth >= +m[1] : /prefers-color-scheme:\s*dark/.test(q);
    return { matches: hit, media: q, addEventListener: function () {}, removeEventListener: function () {},
             addListener: function () {}, removeListener: function () {}, onchange: null };
  };
  win.getComputedStyle = function (el) {
    var s = new Style(el);
    s.cssText = el && el.style ? el.style.cssText : "";
    return {
      getPropertyValue: function (k) {
        var own = s.getPropertyValue(k);
        if (own) return own;
        return TOKENS[k] || "";
      },
      get display() { return el && el.style.display || "block"; },
      get width() { return (el && el.offsetWidth || 0) + "px"; },
      get height() { return (el && el.offsetHeight || 0) + "px"; },
      get fontSize() { return el && el.style.fontSize || "16px"; },
      get opacity() { return el && el.style.opacity || "1"; },
      get transform() { return el && el.style.transform || "none"; },
      get visibility() { return el && el.style.visibility || "visible"; },
    };
  };
  win.requestAnimationFrame = function (fn) { raf.push(fn); return raf.length; };
  win.cancelAnimationFrame = function (i) { raf[i - 1] = null; };
  win.requestIdleCallback = function (fn) { return setTimeout(function () { fn({ timeRemaining: function () { return 5; } }); }, 0); };
  win.cancelIdleCallback = function () {};
  win.performance = win.performance || { now: (function () { var t = 0; return function () { return (t += 16); }; })() };
  win.alert = function (m) { console.log("ALERT " + m); };
  win.confirm = function () { return true; };
  win.prompt = function () { return ""; };
  win.open = function () { return null; };
  win.close = function () {};
  win.atob = win.atob || function (b) {
    var T = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    b = String(b).replace(/=+$/, ""); var out = "", bits = 0, acc = 0;
    for (var i = 0; i < b.length; i++) {
      acc = (acc << 6) | T.indexOf(b[i]); bits += 6;
      if (bits >= 8) { bits -= 8; out += String.fromCharCode((acc >> bits) & 255); }
    }
    return out;
  };
  win.btoa = win.btoa || function (s) {
    var T = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var out = "", i = 0; s = String(s);
    while (i < s.length) {
      var a = s.charCodeAt(i++), b = s.charCodeAt(i++), c = s.charCodeAt(i++);
      out += T[a >> 2] + T[((a & 3) << 4) | (isNaN(b) ? 0 : b >> 4)]
           + (isNaN(b) ? "=" : T[((b & 15) << 2) | (isNaN(c) ? 0 : c >> 6)])
           + (isNaN(c) ? "=" : T[c & 63]);
    }
    return out;
  };
  win.Image = function () { var e = new Element("img"); e.decode = function () { return Promise.resolve(); }; return e; };
  win.Audio = function () { return new Element("audio"); };
  win.AudioContext = win.webkitAudioContext = function () {
    var stub = function () {
      return { connect: function () { return stub(); }, start: function () {}, stop: function () {},
               disconnect: function () {}, gain: { value: 1, setValueAtTime: function () {},
               linearRampToValueAtTime: function () {}, exponentialRampToValueAtTime: function () {} },
               frequency: { value: 440, setValueAtTime: function () {}, linearRampToValueAtTime: function () {},
               exponentialRampToValueAtTime: function () {} }, type: "sine",
               buffer: null, playbackRate: { value: 1 }, Q: { value: 1 }, detune: { value: 0 } };
    };
    return {
      state: "suspended", currentTime: 0, sampleRate: 44100, destination: stub(),
      resume: function () { this.state = "running"; return Promise.resolve(); },
      suspend: function () { return Promise.resolve(); }, close: function () { return Promise.resolve(); },
      createGain: stub, createOscillator: stub, createBufferSource: stub, createBiquadFilter: stub,
      createDynamicsCompressor: stub, createStackNode: stub, createWaveShaper: stub,
      createConvolver: stub, createDelay: stub, createStereoPanner: stub, createPanner: stub,
      createBuffer: function (c, l, r) { return { length: l, sampleRate: r, numberOfChannels: c,
        getChannelData: function () { return new Float32Array(l); } }; },
      decodeAudioData: function (b, ok) { if (ok) ok({ duration: 1 }); return Promise.resolve({ duration: 1 }); },
    };
  };
  win.fetch = function (u) {
    return Promise.reject(new Error("harness: no network. fetch(" + u + ")"));
  };
  win.XMLHttpRequest = function () {
    return { open: function () {}, send: function () {}, setRequestHeader: function () {},
             addEventListener: function () {}, status: 0, responseText: "" };
  };
  win.Blob = function (parts) { this.size = 0; this.type = ""; this._parts = parts; };
  win.URL = win.URL || function (u) { this.href = u; };
  win.URL.createObjectURL = function () { return "blob:harness"; };
  win.URL.revokeObjectURL = function () {};
  win.ResizeObserver = function (cb) {
    return { observe: function () {}, unobserve: function () {}, disconnect: function () {} };
  };
  win.IntersectionObserver = win.ResizeObserver;
  win.MutationObserver = function () {
    return { observe: function () {}, disconnect: function () {}, takeRecords: function () { return []; } };
  };
  win.addEventListener = function (t, fn, o) { (win._wh = win._wh || {}), (win._wh[t] = win._wh[t] || []).push(fn); };
  win.removeEventListener = function (t, fn) {
    if (win._wh && win._wh[t]) win._wh[t] = win._wh[t].filter(function (f) { return f !== fn; });
  };
  win.dispatchEvent = function (ev) {
    ev.target = ev.target || win;
    ((win._wh && win._wh[ev.type]) || []).slice().forEach(function (fn) {
      try { fn.call(win, ev); } catch (e) { console.error("window " + ev.type + ": " + (e && e.stack || e)); }
    });
    var on = win["on" + ev.type];
    if (typeof on === "function") { try { on.call(win, ev); } catch (e) { console.error(e); } }
    return !ev.defaultPrevented;
  };

  /* ── the H helper, which is what tests actually use ──────────────────── */
  var H = {
    doc: doc, win: win, TOKENS: TOKENS, log: LOG,
    root: ROOT,

    /* Parse a real index.html into the DOM. <script> tags are NOT executed —
       you pass those on the jsc command line, in the same order as the file. */
    html: function (path) {
      var src = readFile(ROOT + path);
      var m = /<body[^>]*>([\s\S]*)<\/body>/i.exec(src);
      var body = m ? m[1] : src;
      var hm = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(src);
      doc.body.innerHTML = body.replace(/<script[\s\S]*?<\/script>/gi, "");
      if (hm) doc.head.innerHTML = hm[1].replace(/<script[\s\S]*?<\/script>/gi, "");
      var t = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(src);
      if (t) doc.title = t[1].trim();
      // the script order the page really uses — a test can assert against it
      H.scripts = [];
      var sre = /<script[^>]*src\s*=\s*["']([^"']+)["']/gi, sm;
      while ((sm = sre.exec(src))) H.scripts.push(sm[1]);
      return doc.body;
    },

    /* Fire the lifecycle events a game may be waiting on. */
    boot: function () {
      doc.readyState = "interactive";
      doc.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true }));
      doc.readyState = "complete";
      win.dispatchEvent(new Event("load"));
      H.flush();
      return H;
    },

    find: function (sel, from) {
      var el = (from || doc).querySelector(sel);
      if (!el) throw new Error("harness: no element matches " + JSON.stringify(sel));
      return el;
    },
    maybe: function (sel, from) { return (from || doc).querySelector(sel); },
    all: function (sel, from) { return (from || doc).querySelectorAll(sel); },

    /* Click THROUGH the element, the way a finger does: the full event
       sequence, bubbling, and then whatever timers that kicked off. */
    click: function (el, opt) {
      if (typeof el === "string") el = H.find(el);
      if (el.disabled) throw new Error("harness: clicked a disabled " + tagOf(el));
      el.dispatchEvent(new MouseEvent("pointerdown", Object.assign({ bubbles: true }, opt)));
      el.dispatchEvent(new MouseEvent("mousedown", Object.assign({ bubbles: true }, opt)));
      el.dispatchEvent(new MouseEvent("pointerup", Object.assign({ bubbles: true }, opt)));
      el.dispatchEvent(new MouseEvent("mouseup", Object.assign({ bubbles: true }, opt)));
      el.dispatchEvent(new MouseEvent("click", Object.assign({ bubbles: true, cancelable: true }, opt)));
      H.flush();
      return el;
    },
    key: function (k, opt) {
      var init = Object.assign({ key: k, bubbles: true, cancelable: true }, opt);
      var t = doc.activeElement || doc.body;
      t.dispatchEvent(new KeyboardEvent("keydown", init));
      if (k.length === 1) t.dispatchEvent(new KeyboardEvent("keypress", init));
      t.dispatchEvent(new KeyboardEvent("keyup", init));
      win.dispatchEvent(new KeyboardEvent("keydown", init));
      H.flush();
    },
    type: function (el, text) {
      if (typeof el === "string") el = H.find(el);
      el.value = String(text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      H.flush();
      return el;
    },

    /* Run every pending rAF callback and let the timer queue drain. Games that
       animate schedule the next frame from inside the callback, so cap it. */
    flush: function (frames) {
      var n = frames === undefined ? 4 : frames;
      for (var i = 0; i < n; i++) {
        var q = raf; raf = [];
        q.forEach(function (fn) {
          if (!fn) return;
          try { fn(win.performance.now()); } catch (e) { console.error("rAF: " + (e && e.stack || e)); }
        });
        if (!raf.length) break;
      }
      return H;
    },

    text: function (sel) {
      var el = typeof sel === "string" ? H.maybe(sel) : sel;
      return el ? el.textContent.replace(/\s+/g, " ").trim() : null;
    },
    /* A crude visual dump: the tree with classes and text, for eyeballing. */
    dump: function (el, depth) {
      el = el || doc.body; depth = depth === undefined ? 3 : depth;
      var out = [];
      (function walk(n, d, pad) {
        if (d > depth) return;
        n.children.forEach(function (c) {
          var own = c.childNodes.filter(function (x) { return x.nodeType === 3; })
                     .map(function (x) { return x.nodeValue; }).join("").replace(/\s+/g, " ").trim();
          out.push(pad + tagOf(c) + (own ? "  “" + own.slice(0, 60) + "”" : "") +
                   (c.style.display === "none" ? "   [display:none]" : ""));
          walk(c, d + 1, pad + "  ");
        });
      })(el, 1, "");
      return out.join("\n");
    },
    /* Everything a human could actually read on screen, in order. */
    visible: function (el) {
      var out = [];
      (function walk(n) {
        if (n.nodeType === 1) {
          if (n.style.display === "none" || n.hidden || n.style.visibility === "hidden") return;
          if (n.localName === "script" || n.localName === "style") return;
        }
        if (n.nodeType === 3) { var t = n.nodeValue.replace(/\s+/g, " ").trim(); if (t) out.push(t); return; }
        n.childNodes.forEach(walk);
      })(el || doc.body);
      return out;
    },
    reset: function () {
      store = {}; raf = []; LOG.length = 0;
      doc.body.innerHTML = ""; doc._h = {}; win._wh = {};
    },
    /* localStorage, for asserting on saved state */
    store: function () { return store; },
    setSize: function (w, h) { win.innerWidth = w; win.innerHeight = h;
      win.dispatchEvent(new Event("resize")); H.flush(); },

    /* tiny assertion kit — keeps test files short and their output uniform */
    fails: 0, checks: 0,
    ok: function (cond, msg) {
      H.checks++;
      if (cond) { print("  ok   " + msg); return true; }
      H.fails++; print("  FAIL " + msg); return false;
    },
    eq: function (a, b, msg) {
      return H.ok(a === b || JSON.stringify(a) === JSON.stringify(b),
                  msg + "   (got " + fmt(a) + ", want " + fmt(b) + ")");
    },
    near: function (a, b, tol, msg) {
      return H.ok(Math.abs(a - b) <= tol, msg + "   (got " + a + ", want " + b + "±" + tol + ")");
    },
    throws: function (fn, msg) {
      try { fn(); } catch (e) { return H.ok(true, msg); }
      return H.ok(false, msg + " (did not throw)");
    },
    section: function (t) { print("\n" + t); },
    done: function () {
      print("\n" + (H.fails ? "FAILED " + H.fails + " of " + H.checks
                            : "passed all " + H.checks) + " checks");
      if (H.fails) throw new Error(H.fails + " check(s) failed");
    },
  };
  win.H = H;
  win.__harness = H;
})();
