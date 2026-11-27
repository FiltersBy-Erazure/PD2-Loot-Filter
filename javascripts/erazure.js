/* Erazure website: Material's "Back to top" button (navigation.top) appears just under the header, where a page's
   sticky bar sits once you've scrolled (the filter bars of Unique & Set Tiers, Non-magical Bases, Magic / Rare Items
   and Filter Levels, Map Experience's level bar, Event and Boss Map Runs' strip), and the bar is drawn over it. Each
   time the button appears, find the sticky element of the page right under the header and tell erazure.css where it
   ends, so the button shows below it. */
(function () {
  "use strict";
  var button = document.querySelector(".md-top"), header = document.querySelector(".md-header");
  if (!button || !header) return;
  var root = document.documentElement;
  function barUnderHeader() {
    var hits = document.elementsFromPoint(window.innerWidth / 2, header.getBoundingClientRect().bottom + 1);
    for (var i = 0; i < hits.length; i++) {
      for (var e = hits[i]; e && e.closest(".md-content"); e = e.parentElement) {
        if (getComputedStyle(e).position === "sticky") return e;
      }
    }
    return null;
  }
  function place() {
    var bar = button.hidden ? null : barUnderHeader();
    if (bar) {
      root.style.setProperty("--page-bar-bottom", Math.round(bar.getBoundingClientRect().bottom) + "px");
      root.setAttribute("data-page-bar", "");
    } else {
      root.removeAttribute("data-page-bar");
    }
  }
  new MutationObserver(place).observe(button, {attributes: true, attributeFilter: ["hidden"]});
  window.addEventListener("resize", place);
})();

/* A page whose own tabs are in the row under the site's tabs (page_tabs: the Grail Planner; overrides/partials/
   tabs.html): the page's script opens a tab from its #tab-<name> link, and this marks the open one in the row, as the
   page's own tab row marks it (aria-selected), whether it was opened there, from the row, a link or the address. */
(function () {
  "use strict";
  var links = document.querySelectorAll('.ez-pages a[href^="#tab-"]');
  var tabs = document.querySelectorAll('[role="tab"][data-tab]');
  if (!links.length || !tabs.length) return;
  function mark() {
    // no tab open (the Feedback page's feedback on an update, which has no tab): none marked
    var open = document.querySelector('[role="tab"][data-tab][aria-selected="true"]');
    for (var i = 0; i < links.length; i++) {
      var on = !!open && links[i].getAttribute("href") === "#tab-" + open.getAttribute("data-tab");
      links[i].parentElement.classList.toggle("md-tabs__item--active", on);
      if (on) links[i].setAttribute("aria-current", "true"); else links[i].removeAttribute("aria-current");
    }
  }
  var watch = new MutationObserver(mark);
  for (var i = 0; i < tabs.length; i++) watch.observe(tabs[i], {attributes: true, attributeFilter: ["aria-selected"]});
  mark();
})();

/* The same page's tabs in the phone menu (hooks.py makes them the page's contents, 2026-11-15, audit GP-01): the menu
   opens on them, not on the page's own entry, and the list has the page's name, not "Table of contents". The page sits
   in the nav's top level (mkdocs.yml, 2026-11-16, the author: as a section's one page it put a level with only a
   "Grail Planner" entry between the sections and its tabs), so back from the tabs is the sections. */
(function () {
  "use strict";
  var toc = document.getElementById("__toc");
  if (!toc || !document.querySelector('.ez-pages a[href^="#tab-"]')) return;
  var name = toc.parentElement.querySelector(":scope > label.md-nav__link");
  var title = toc.parentElement.querySelector(":scope > nav.md-nav--secondary > label.md-nav__title");
  if (name && title) {
    var text = name.textContent.trim();
    for (var n = title.lastChild; n; n = n.previousSibling) {
      if (n.nodeType === 3 && n.textContent.trim()) { n.textContent = " " + text + " "; break; }
    }
    title.parentElement.setAttribute("aria-label", text);
  }
  function open() { toc.checked = true; }
  open();
  window.addEventListener("pageshow", function (e) { if (e.persisted) open(); });
})();

/* A site search result opens a page with ?h=<what was searched> (Material's search.highlight). On a page that draws
   its items by script (hooks.py lists their names for the search, 2026-11-15, audit SITE-01), the same words go into
   the page's own search box, so the result opens on the item: Unique & Set Tiers, Non-magical Bases, Magic and Rare
   Items (their search box #q), the Grail Planner (its "Where do I find it?" box). */
(function () {
  "use strict";
  var h = null;
  try { h = new URLSearchParams(location.search).get("h"); } catch (e) {}
  if (!h || !document.querySelector(".ez-search-terms")) return;
  function fill() {
    var q = document.querySelector(".erazure-map input#q") || document.getElementById("gm-lq");
    if (!q) return;
    q.value = h;
    q.dispatchEvent(new Event("input", {bubbles: true}));
    q.scrollIntoView({block: "start"});
    window.scrollBy(0, -120);
  }
  if (document.readyState === "complete") setTimeout(fill, 60);
  else window.addEventListener("load", function () { setTimeout(fill, 60); });
})();

/* A search result's title link carries an empty ?h= (Material fills it with the words its own text matched, and a
   page's title matches none): the words searched go there, so the title opens the item as the result's other link
   does (the additions audit, 2026-11-23, SW-01: the Item Lookup's title opened on the Ber Rune). */
document.addEventListener("click", function (e) {
  var a = e.target.closest && e.target.closest("a.md-search-result__link");
  var input = document.querySelector(".md-search__input"), q = input ? input.value.trim() : "";
  if (!a || !q) return;
  try {
    var u = new URL(a.href, location.href);
    if (u.searchParams.get("h")) return;
    u.searchParams.set("h", q);
    a.href = u.href;
  } catch (err) { /* an address this browser can't read: left as it is */ }
}, true);

/* Glossary terms (an abbr with a title: Markdown's on the site's pages, hooks.py's on the maps' text) show their
   meaning on a tap or keyboard focus too: phones show no hover title (the additions audit, 2026-11-23, SW-04). Not in
   a link, button, heading or summary, where a tap does something else. */
(function () {
  "use strict";
  var tip = null, owner = null;
  var free = function (a) { return !a.closest("a, button, summary, label, h1, h2, h3, h4, h5, h6"); };
  function hide() {
    if (tip) { tip.remove(); tip = null; }
    if (owner) { owner.removeAttribute("aria-describedby"); owner = null; }
  }
  function show(a) {
    if (owner === a) return;
    hide();
    if (!a.title) return;
    tip = document.createElement("span");
    tip.className = "ez-term-tip"; tip.id = "ez-term-tip"; tip.setAttribute("role", "tooltip");
    tip.textContent = a.title;
    document.body.appendChild(tip);
    var r = a.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, vw = document.documentElement.clientWidth;
    var left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, vw - w - 8));
    var top = r.bottom + 6 + h > window.innerHeight - 8 && r.top - h - 6 > 8 ? r.top - h - 6 : r.bottom + 6;
    tip.style.left = left + window.scrollX + "px";
    tip.style.top = top + window.scrollY + "px";
    owner = a;
    a.setAttribute("aria-describedby", tip.id);
  }
  function mark() {
    [].forEach.call(document.querySelectorAll(".md-typeset abbr[title]"), function (a) {
      if (free(a) && !a.hasAttribute("tabindex")) a.tabIndex = 0;
    });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".md-typeset abbr[title]");
    if (a && free(a)) { show(a); return; }
    if (tip && !(e.target.closest && e.target.closest(".ez-term-tip"))) hide();
  });
  document.addEventListener("focusin", function (e) {
    var a = e.target;
    if (a && a.matches && a.matches(".md-typeset abbr[title]") && free(a)) show(a);
  });
  document.addEventListener("focusout", function (e) { if (owner && e.target === owner) hide(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
  window.addEventListener("scroll", hide, {passive: true});
  window.addEventListener("resize", hide);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mark); else mark();
})();

/* A page that widens its content (its own .md-grid rule) starts at the window's edge while the header and tabs keep
   Material's width, so its title sat 110 px left of the logo at 1440 px (2026-11-15, audit SITE-08). Move the content
   in to the header's edge, as far as it keeps the room it needs; the Filter Editor, an app that uses the whole
   window, keeps it. */
(function () {
  "use strict";
  var main = document.querySelector(".md-main__inner");
  // (the Item Lookup runs the editor's preview inside .edit-map.fe-lookup: a page, not the app)
  if (!main || !main.querySelector(".erazure-map") || main.querySelector(".edit-map:not(.fe-lookup)")) return;
  var inner = main.querySelector(".md-content__inner");
  // the room the page keeps: the item tables need 1,240 px; the calculators and the planner do with 1,000
  var need = main.querySelector(".base-map, .magic-map, .rare-map, .level-map, .tier-map, .shop-map, .grail-map") ? 1240 : 1000;
  function align() {
    main.style.paddingLeft = main.style.paddingRight = "";
    var tab = document.querySelector(".md-tabs__link");  // hidden below 1220 px: nothing to line up with
    if (!tab || !inner || !tab.getClientRects().length) return;
    var cs = getComputedStyle(inner), box = inner.getBoundingClientRect();
    var now = box.left + parseFloat(cs.paddingLeft);
    var room = box.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var pad = Math.max(0, Math.min(tab.getBoundingClientRect().left - now, (room - need) / 2));
    if (pad > 0) main.style.paddingLeft = main.style.paddingRight = pad + "px";
  }
  align();
  window.addEventListener("resize", align);
})();

/* Feedback (2026-11-21, the author: "the feedback button on each page links to the feedback tab. Depending on where
   you linked from, some of the fields will be filled out as they apply to where it was linked from"). A Feedback
   button in the header and "Feedback on this page" in the footer (website/hooks.py) open the Feedback page with
   ?from=<this page's path from the site's root>, and leave in sessionStorage (erazure-feedback-from) this page's
   address as it is now (a calculator's setup, a planner tab), what its search box holds, and what the page passes on
   through window.erazureFeedback (the Filter Editor's report, the Damage Calculator's builds; it may return a Promise,
   given 1.5 s). The Feedback page (website/feedback/Feedback.html) reads them. Neither shows on the Feedback page. */
var ezFeedback = (function () {
  "use strict";
  var KEY = "erazure-feedback-from";
  var root = typeof __md_scope !== "undefined" ? __md_scope : null;
  if (!root) return null;
  var path = location.pathname.indexOf(root.pathname) === 0 ? location.pathname.slice(root.pathname.length) : "";
  path = path.replace(/index\.html$/, "");
  var here = /^feedback\//.test(path);
  function title() {
    var h1 = document.querySelector(".md-content h1");
    return (h1 ? h1.textContent : document.title.split(" - ")[0]).replace(/¶/g, "").trim();
  }
  function url(params) {
    return new URL("feedback/?from=" + encodeURIComponent(path).replace(/%2F/g, "/") + (params || ""), root).href;
  }
  // ctx: what the page passes on (the What's New picks); without it, the page's own window.erazureFeedback
  function open(ctx, params) {
    var hand = {path: path, title: title(), url: location.href, at: Date.now(), ctx: ctx || {}};
    var q = document.querySelector(".erazure-map input#q") || document.getElementById("gm-lq");
    if (q && q.value) hand.ctx.search = q.value;
    var left = false;
    function leave(more) {
      if (left) return;
      left = true;
      if (more && typeof more === "object") {
        for (var k in more) if (Object.prototype.hasOwnProperty.call(more, k)) hand.ctx[k] = more[k];
      }
      try { sessionStorage.setItem(KEY, JSON.stringify(hand)); } catch (e) { /* the page still knows where from */ }
      location.href = url(params);
    }
    var hook = !ctx && typeof window.erazureFeedback === "function" ? window.erazureFeedback : null;
    if (!hook) { leave(null); return; }
    var timer = setTimeout(function () { leave(null); }, 1500);
    Promise.resolve().then(hook).then(function (more) { clearTimeout(timer); leave(more); },
      function () { clearTimeout(timer); leave(null); });
  }
  function click(e) {
    if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open(null);
  }
  var foot = document.querySelector(".md-copyright .ez-fb-foot");
  if (foot && here) {
    foot.parentNode.removeChild(foot);
  } else if (foot) {
    var link = foot.querySelector("a");
    link.href = url();
    link.addEventListener("click", click);
  }
  var inner = document.querySelector(".md-header__inner");
  if (inner && !here) {
    var btn = document.createElement("a");
    btn.className = "md-header__button ez-fb-head";
    btn.href = url();
    btn.title = "Feedback on this page";
    btn.setAttribute("aria-label", "Feedback on this page");
    // a speech bubble (Material Design's chat_bubble_outline)
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 ' +
      '2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg><span>Feedback</span>';
    btn.addEventListener("click", click);
    inner.insertBefore(btn, inner.querySelector('label[for="__search"]') || inner.querySelector(".md-header__source"));
  }
  return {open: open, path: path, root: root};
})();

/* What's New (2026-11-21, the author: "a feedback button for the what's new page that allows players to select bullet
   points they want to submit feedback on"): on a page with <div class="ez-feedback-select"></div> (What's New, Season 14
   Launch), "Give feedback on changes" turns on picking: each bullet under a date heading gets a tick box, a click on
   its text (not on a link in it) ticks it, and a bar at the bottom counts them and opens the Feedback page with them
   (?changes=<heading id>.<bullet's number under it>, and their text through the hand-off above). ?select=1 starts
   picking (the Feedback page's links back). The picks stay for the visit (sessionStorage erazure-feedback-picks:
   <path>). A heading's Cube line is the first paragraph's "Season ..." in italics, else the marker's data-cube. */
function ezChangeList(article) {
  var out = [], head = null, cube = "", first = false, n = 0;
  var marker = article.querySelector(".ez-feedback-select");
  var pageCube = marker ? marker.getAttribute("data-cube") || "" : "";
  for (var i = 0; i < article.children.length; i++) {
    var el = article.children[i];
    if (el.tagName === "H2") { head = el; cube = ""; first = true; n = 0; continue; }
    if (!head) continue;
    if (first && el.tagName === "P") {
      var em = el.querySelector("em");
      if (em && /^Season \d/.test(em.textContent.trim())) cube = em.textContent.trim().replace(/\.$/, "");
    }
    first = false;
    if (el.tagName !== "UL" && el.tagName !== "OL") continue;
    for (var j = 0; j < el.children.length; j++) {
      if (el.children[j].tagName !== "LI") continue;
      n++;
      var h = head.cloneNode(true), links = h.querySelectorAll(".headerlink");
      for (var k = 0; k < links.length; k++) links[k].parentNode.removeChild(links[k]);
      out.push({li: el.children[j], id: head.id + "." + n, date: h.textContent.trim(), cube: cube || pageCube});
    }
  }
  return out;
}
function ezChangePlain(c, base) {
  var li = c.li.cloneNode(true), drop = li.querySelectorAll(".ez-pick"), i;
  for (i = 0; i < drop.length; i++) drop[i].parentNode.removeChild(drop[i]);
  var links = li.querySelectorAll("a[href]");
  for (i = 0; i < links.length; i++) links[i].setAttribute("href", new URL(links[i].getAttribute("href"), base).href);
  var ids = li.querySelectorAll("[id]");
  for (i = 0; i < ids.length; i++) ids[i].removeAttribute("id");
  return {id: c.id, date: c.date, cube: c.cube, text: li.textContent.replace(/\s+/g, " ").trim(), html: li.innerHTML};
}
// the Feedback page reads an update page's changes with this when the hand-off is gone (a shared link)
window.ezUpdateChanges = function (doc, base) {
  var article = doc.querySelector(".md-content__inner");
  return article ? ezChangeList(article).map(function (c) { return ezChangePlain(c, base || location.href); }) : [];
};
(function () {
  "use strict";
  var marker = document.querySelector(".md-content .ez-feedback-select");
  if (!marker || !ezFeedback) return;
  var article = marker.closest(".md-content__inner");
  var items = article ? ezChangeList(article) : [];
  if (!items.length) return;
  var KEY = "erazure-feedback-picks:" + ezFeedback.path;
  var picked = [];
  try { picked = JSON.parse(sessionStorage.getItem(KEY) || "[]") || []; } catch (e) { picked = []; }
  var on = false;
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  var toggle = el("button", "ez-btn ez-pick-toggle", "Give feedback on changes");
  toggle.type = "button";
  toggle.setAttribute("aria-pressed", "false");
  var help = el("p", "ez-pick-help", "Pick the changes you want to tell me about: click a change, or its box. Then " +
    "press Give feedback at the bottom of the screen.");
  help.hidden = true;
  marker.appendChild(toggle);
  marker.appendChild(help);
  var bar = el("div", "ez-pickbar");
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Picked changes");
  var count = el("span", "ez-pick-count");
  count.setAttribute("aria-live", "polite");
  var give = el("button", "ez-btn ez-btn--primary", "Give feedback ›");
  var clear = el("button", "ez-btn", "Clear");
  var done = el("button", "ez-btn", "Done");
  give.type = clear.type = done.type = "button";
  bar.appendChild(count);
  bar.appendChild(give);
  bar.appendChild(clear);
  bar.appendChild(done);
  bar.hidden = true;
  article.appendChild(bar);
  function save() {
    try { sessionStorage.setItem(KEY, JSON.stringify(picked)); } catch (e) { /* kept on this page only */ }
  }
  function show() {
    var n = 0;
    items.forEach(function (c) {
      var p = picked.indexOf(c.id) >= 0;
      c.box.checked = p;
      c.li.classList.toggle("ez-picked", p);
      if (p) n++;
    });
    count.textContent = n === 1 ? "1 change picked" : n + " changes picked";
    give.disabled = !n;
  }
  function set(c, v) {
    picked = picked.filter(function (id) { return id !== c.id; });
    if (v) picked.push(c.id);
    save();
    show();
  }
  items.forEach(function (c) {
    var box = document.createElement("input");
    box.type = "checkbox";
    box.className = "ez-pick";
    box.setAttribute("aria-label", "Pick: " + c.li.textContent.replace(/\s+/g, " ").trim().slice(0, 90));
    box.addEventListener("change", function () { set(c, box.checked); });
    c.li.insertBefore(box, c.li.firstChild);
    c.li.classList.add("ez-pickable");
    c.li.parentNode.classList.add("ez-picklist");
    c.box = box;
    c.li.addEventListener("click", function (e) {
      if (!on || e.target === box || e.target.closest("a, button, input, summary, details")) return;
      if (String(window.getSelection ? window.getSelection() : "").length) return;  // selecting text, not ticking
      set(c, !box.checked);
    });
  });
  function enter() {
    on = true;
    article.classList.add("ez-picking");
    toggle.textContent = "Done picking";
    toggle.setAttribute("aria-pressed", "true");
    help.hidden = bar.hidden = false;
    show();
  }
  function leave() {
    on = false;
    article.classList.remove("ez-picking");
    toggle.textContent = "Give feedback on changes";
    toggle.setAttribute("aria-pressed", "false");
    help.hidden = bar.hidden = true;
  }
  toggle.addEventListener("click", function () { if (on) leave(); else enter(); });
  done.addEventListener("click", function () { leave(); toggle.focus(); });
  clear.addEventListener("click", function () { picked = []; save(); show(); });
  give.addEventListener("click", function () {
    var list = items.filter(function (c) { return picked.indexOf(c.id) >= 0; });
    if (!list.length) return;
    ezFeedback.open({changes: list.map(function (c) { return ezChangePlain(c, location.href); })},
      "&changes=" + list.map(function (c) { return encodeURIComponent(c.id); }).join(","));
  });
  var select = null;
  try { select = new URLSearchParams(location.search).get("select"); } catch (e) { select = null; }
  if (select === "1") enter();
})();

/* Updates (the website ideas' #7, 2026-11-22). A dot on What's New's links once there's an update since the visitor
   last opened What's New (a first visit sets the mark without one), and a notice when the visitor's own Filter Editor
   copy is older than today's Erazure: the editor keeps its profiles in this browser (localStorage
   erazure-filter-editor, each profile's saved.version the Cube line of the Erazure it was saved from), and the page's
   <meta name="ez-version"> is the newest one (hooks.py from Erazure-Filter-Editor-Source.js). */
(function () {
  "use strict";
  var meta = function (n) { var m = document.querySelector('meta[name="' + n + '"]'); return m ? m.content : ""; };
  var latest = meta("ez-latest"), version = meta("ez-version");
  var root = typeof __md_scope !== "undefined" ? __md_scope.pathname : "/";
  var here = location.pathname.replace(/index\.html$/, "");
  // What's New's dot
  if (latest) {
    var SEEN = "erazure-whats-new-seen", seen = null;
    try { seen = localStorage.getItem(SEEN); } catch (e) { seen = latest; }
    var onUpdates = here === root + "updates/";
    if (!seen || onUpdates) { try { localStorage.setItem(SEEN, latest); } catch (e) {} }
    else if (seen < latest) {
      document.querySelectorAll('a[href$="updates/"], a[href$="updates/index.html"]').forEach(function (a) {
        if (a.closest(".md-footer, .ez-announce") || a.querySelector(".ez-new")) return;
        var d = document.createElement("span");
        d.className = "ez-new"; d.textContent = "\u25CF"; d.title = "A new update since your last look";
        d.setAttribute("aria-label", "new update");
        a.appendChild(d);
      });
    }
  }
  // the out-of-date custom filter notice (not on the Filter Editor, which says it itself)
  if (!version || here === root + "editor/") return;
  var store = null;
  try { store = JSON.parse(localStorage.getItem("erazure-filter-editor") || "null"); } catch (e) { store = null; }
  if (!store || !store.profiles) return;
  var old = Object.keys(store.profiles).map(function (k) { return store.profiles[k]; })
    .filter(function (p) { return p && p.saved && p.saved.version && p.saved.version !== version; });
  if (!old.length) return;
  var DISMISS = "erazure-stale-dismissed";
  try { if (localStorage.getItem(DISMISS) === version) return; } catch (e) {}
  var inner = document.querySelector(".md-content__inner");
  if (!inner) return;
  var p = old[0], bar = document.createElement("div");
  bar.className = "ez-stale"; bar.setAttribute("role", "status");
  // the update a filter was saved from, in words: "the November 16th update", with its number when the date is today's
  // ("the November 23rd v1 update"), or a same-day update read as none (the additions audit, 2026-11-23, SW-11)
  var parse = function (v) { var m = v.match(/ - ([A-Z][a-z]+ \d+(?:st|nd|rd|th))(?: - (v\d+))?/); return m ? {date: m[1], n: m[2] || ""} : null; };
  var today = parse(version);
  var update = function (v) {
    var o = parse(v);
    return o ? "the " + o.date + (today && today.date === o.date && o.n ? " " + o.n : "") + " update" : "an older update";
  };
  var ed = document.createElement("a"); ed.href = root + "editor/"; ed.textContent = "Open the Filter Editor";
  var txt = document.createElement("span");
  txt.append(old.length === 1 ? "Your custom filter \u201C" + p.name + "\u201D was saved from " + update(p.saved.version) + ". "
    : old.length + " of your custom filters were saved from older updates. ", ed,
    " and save " + (old.length === 1 ? "it" : "them") + " again to get the latest changes.");
  var wn = document.createElement("a"); wn.href = root + "updates/"; wn.textContent = "What\u2019s New";
  var x = document.createElement("button"); x.type = "button"; x.className = "ez-stale-x"; x.textContent = "\u2715";
  x.setAttribute("aria-label", "Dismiss until the next update");
  x.addEventListener("click", function () { try { localStorage.setItem(DISMISS, version); } catch (e) {} bar.remove(); });
  bar.append(txt, " \u00B7 ", wn, x);
  inner.insertBefore(bar, inner.firstChild);
})();

/* The item pages' row menus (the website ideas' #3, 2026-11-22): a row of Unique & Set Tiers, Non-magical Bases, Magic
   Items or Rare Items has a ⋯ button (.ez-rowmenu, the page's own; hidden on a page opened from a file) whose data-menu
   holds {id, editor, items: [{name, quality, grail, lookup}]}. Its menu: a link to the row (the page's address with its
   filter level, version and search: window.ezItemPage.link), each item on the Item Lookup (lookup/ + its lookup:
   ?h=<name>, or #i=<code>.<quality>), each item's Grail Planner lookup (#gm-find=), a change for the
   row's bases in the Filter Editor (#items/new?...), and a report on each item on the Feedback page (the item, its
   quality, the page's filter level and version through the Feedback hand-off). */
(function () {
  "use strict";
  var root = typeof __md_scope !== "undefined" ? __md_scope.href : null;
  if (!root) return;
  var menu = null, opener = null;
  function close(back) {
    if (!menu) return;
    menu.remove(); menu = null;
    if (opener) { opener.setAttribute("aria-expanded", "false"); if (back) opener.focus(); }
    opener = null;
  }
  function item(text, act) {
    var b = document.createElement(act.href ? "a" : "button");
    if (act.href) b.href = act.href; else b.type = "button";
    b.setAttribute("role", "menuitem");
    b.textContent = text;
    b.addEventListener("click", function (e) { if (act.run) { e.preventDefault(); act.run(b); } else close(false); });
    return b;
  }
  function heading(text) { var h = document.createElement("div"); h.className = "ez-rm-h"; h.textContent = text; return h; }
  function open(btn) {
    var d;
    try { d = JSON.parse(btn.dataset.menu || "{}"); } catch (e) { return; }
    close(false);
    opener = btn;
    btn.setAttribute("aria-expanded", "true");
    menu = document.createElement("div");
    menu.className = "ez-rowmenu-pop";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", btn.getAttribute("aria-label") || "Links");
    var page = window.ezItemPage || {};
    var items = d.items || [];
    menu.append(item("Copy a link to this row", {run: function (b) {
      var link = page.link ? page.link(d.id) : location.href.split("#")[0] + "#" + d.id;
      var done = function (ok) { b.textContent = ok ? "Link copied" : "Copy this link: " + link; };
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(function () { done(true); }, function () { done(false); });
      else done(false);
    }}));
    // each item on the Item Lookup (the additions audit, 2026-11-23, LU-16)
    var look = items.filter(function (x) { return x.lookup; });
    if (look.length) {
      menu.append(heading("Item Lookup"));
      look.forEach(function (x) {
        menu.append(item(look.length > 1 ? "See " + x.name + " on every level and version" : "See it on every level and version",
          {href: root + "lookup/" + x.lookup}));
      });
    }
    var grail = items.filter(function (x) { return x.grail; });
    if (grail.length) {
      menu.append(heading("Grail Planner"));
      grail.forEach(function (x) {
        menu.append(item("Where to find " + x.name, {href: root + "grail/#gm-find=" + encodeURIComponent(x.name)}));
      });
    }
    if (d.editor) {
      menu.append(heading("Filter Editor"));
      menu.append(item(items.length > 1 ? "Change how these show" : "Change how it shows",
        {href: root + "editor/#items/new?" + d.editor}));
    }
    if (items.length && window.ezFeedback !== null) {
      menu.append(heading("Feedback"));
      items.forEach(function (x) {
        menu.append(item("Report a problem with " + x.name, {run: function () {
          close(false);
          var ctx = {item: x.name, quality: x.quality};
          if (page.level && page.level() !== "") ctx.level = String(page.level());
          if (page.version) ctx.version = page.version();
          if (typeof ezFeedback !== "undefined" && ezFeedback) ezFeedback.open(ctx, "#tab-item");  // its item report
        }}));
      });
    }
    document.body.append(menu);
    var r = btn.getBoundingClientRect(), w = menu.offsetWidth, hgt = menu.offsetHeight;
    var left = Math.min(Math.max(8, r.right - w), document.documentElement.clientWidth - w - 8);
    var top = r.bottom + 4 + hgt > innerHeight && r.top - 4 - hgt > 0 ? r.top - 4 - hgt : r.bottom + 4;
    menu.style.left = (left + scrollX) + "px";
    menu.style.top = (top + scrollY) + "px";
    var first = menu.querySelector("[role=menuitem]");
    if (first) first.focus();
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".ez-rowmenu");
    if (btn) { e.preventDefault(); e.stopPropagation(); if (opener === btn) close(true); else open(btn); return; }
    if (menu && !menu.contains(e.target)) close(false);
  });
  document.addEventListener("keydown", function (e) {
    if (!menu) return;
    var all = [].slice.call(menu.querySelectorAll("[role=menuitem]")), k = all.indexOf(document.activeElement);
    if (e.key === "Escape") { e.preventDefault(); close(true); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      all[(k + (e.key === "ArrowDown" ? 1 : all.length - 1)) % all.length].focus();
    } else if (e.key === "Tab") close(false);
  });
  window.addEventListener("resize", function () { close(false); });
})();

/* One character for every tool (the website ideas' #11, 2026-11-22): localStorage erazure-character, {v: 1, cls
   ("ama", "ass", "bar", "dru", "nec", "pal", "sor"), lvl, str, dex, ias, fcr, fhr, frw, life, def, pdr, res {fire,
   cold, ltng, pois}, max {the same}, merc, mf}. A page with a .ez-char box and window.ezCharPage = {fields: [...],
   read(), use(c), fit(c)} gets its character there: what is saved of the page's fields, "Use my saved character" (only
   those fields, and only on a click) and "Save as my character" (the page's fields into it, the rest kept); fit(c)
   gives what the page would make of them (a level its slider can't show: the nearest it can), so a saved level 60
   reads as level 80's slider already. A page that draws its own parts later (the Filter Editor) mounts a box itself:
   window.ezCharacter.mount(box, page). window.ezCharacter = {get, set, mount}. */
(function () {
  "use strict";
  var KEY = "erazure-character";
  var CLS = {ama: "Amazon", ass: "Assassin", bar: "Barbarian", dru: "Druid", nec: "Necromancer", pal: "Paladin", sor: "Sorceress"};
  var ELEM = ["fire", "cold", "ltng", "pois"];
  function get() {
    try { var c = JSON.parse(localStorage.getItem(KEY) || "null"); return c && typeof c === "object" ? c : {}; } catch (e) { return {}; }
  }
  function set(part) {
    var c = get();
    for (var k in part) if (Object.prototype.hasOwnProperty.call(part, k) && part[k] !== undefined && part[k] !== null) c[k] = part[k];
    c.v = 1;
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { return false; }
    return true;
  }
  var num = function (v) { return Number(v).toLocaleString("en-US"); };
  var WORD = {
    cls: function (v) { return CLS[v]; },
    lvl: function (v) { return "level " + v; },
    str: function (v) { return num(v) + " Strength"; },
    dex: function (v) { return num(v) + " Dexterity"; },
    ias: function (v) { return v + "% IAS"; },
    fcr: function (v) { return v + "% FCR"; },
    fhr: function (v) { return v + "% FHR"; },
    frw: function (v) { return v + "% FRW"; },
    life: function (v) { return num(v) + " life"; },
    def: function (v) { return num(v) + " defense"; },
    pdr: function (v) { return v + "% PDR"; },
    res: function (v) { return "resistances " + ELEM.map(function (k) { return v[k]; }).join(" / ") + "%"; },
    max: function (v) { return "maximum " + ELEM.map(function (k) { return v[k]; }).join(" / ") + "%"; },
    merc: function (v) { return "mercenary level " + v; },
    mf: function (v) { return v + "% magic find"; },
  };
  var NAME = {cls: "class", lvl: "level", str: "Strength", dex: "Dexterity", ias: "IAS", fcr: "FCR", fhr: "FHR",
    frw: "FRW", life: "life", def: "defense", pdr: "PDR", res: "resistances", max: "maximum resistances",
    merc: "mercenary level", mf: "magic find"};
  var join = function (xs, w) { return xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + (xs.length > 2 ? "," : "") + " " + w + " " + xs[xs.length - 1]; };
  var list = function (xs) { return join(xs, "and"); };
  var name = function (k) { return NAME[k]; };
  var has = function (c, k) { return c[k] !== undefined && c[k] !== null && c[k] !== "" && (k !== "cls" || CLS[c[k]]); };
  var same = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
  var mounts = [];  // [{box, page, note, noteAt}]
  // A page may name the box (page.title: Infinity Base Comparison's "Your mercenary") and its save button
  // (page.saveText: the Damage Calculator's "Save build A as my character"). The additions audit, 2026-11-23: a field
  // this page holds but the saved character lacks keeps Save there and is named ("no FCR or FHR saved yet": CA-03,
  // MG-10, where a saved class hid Save for good); the buttons say which way they go (a one-field page: "Use my saved
  // level" / "Save this level as mine"); until something is saved, a line says what Save keeps (CA-10: it was only in
  // the buttons' hover titles, which phones never show).
  // The box is a card (the author, 2026-11-24, the builds panel review, on every page that has it): a small "Your
  // character" title, what is saved as tags, the page's Use / Save buttons; a page with armory(V) gets the armory line
  // under them and what each load did.
  function draw(m) {
    var page = m.page, fields = page.fields.filter(function (k) { return WORD[k]; });
    var c = get(), now = page.read() || {}, fitted = page.fit ? page.fit(JSON.parse(JSON.stringify(c))) : c;
    var saved = fields.filter(function (k) { return has(c, k); });
    var differs = saved.filter(function (k) { return !same(fitted[k], now[k]); });
    var missing = fields.filter(function (k) { return !has(c, k) && has(now, k); });
    // what Save would keep: the fields the page has a value for (Map Lines asks for resistances but never saves them)
    var keeps = fields.filter(function (k) { return has(now, k); });
    var one = fields.length === 1 ? NAME[fields[0]] : "";
    m.box.classList.add("ez-char");
    // the card's top part is drawn again each time; the armory row under it (armRow) is built once, so a name being
    // typed there survives the redraws
    if (!m.top || m.top.parentNode !== m.box) {
      m.box.textContent = "";
      m.top = document.createElement("div");
      m.top.className = "ez-char-top";
      m.box.append(m.top);
      m.arm = null;
    }
    var box = m.top;
    box.textContent = "";
    var label = document.createElement("strong");
    label.className = "ez-char-title";
    label.textContent = page.title || "Your character";
    box.append(label);
    // each saved value a tag; a value this page can't hold says what it makes of it: "level 60 (level 80 here)"; a box
    // named for its mercenary says "level 98", not "mercenary level 98"
    var word = function (k, v) { return k === "merc" && page.title ? "level " + v : WORD[k](v); };
    saved.forEach(function (k) {
      var t = document.createElement("span");
      t.className = "ez-tag";
      t.textContent = word(k, c[k]) + (same(fitted[k], c[k]) ? "" : " (" + word(k, fitted[k]) + " here)");
      box.append(t);
    });
    var state = !saved.length ? "None saved yet." : missing.length ? "No " + join(missing.map(name), "or") + " saved yet."
      : differs.length ? "" : "This page has it.";
    if (state) {
      var st = document.createElement("span");
      st.className = "ez-char-state";
      st.textContent = state;
      box.append(st);
    }
    if (differs.length) {
      var u = document.createElement("button");
      u.type = "button"; u.className = "ez-char-b"; u.textContent = one ? "Use my saved " + one : "Use my saved character";
      u.title = "Put your saved " + list(differs.map(function (k) { return NAME[k]; })) + " into this page";
      u.addEventListener("click", function () {
        var c2 = get(), part = {};
        fields.forEach(function (k) { if (has(c2, k)) part[k] = c2[k]; });
        m.note = "Used your " + list(Object.keys(part).map(function (k) { return NAME[k]; })) + "."; m.noteAt = Date.now();
        page.use(part);
        drawAll();
      });
      box.append(u);
    }
    if (!saved.length || differs.length || missing.length) {
      var s = document.createElement("button");
      s.type = "button"; s.className = "ez-char-b";
      s.textContent = page.saveText || (one ? "Save this " + one + " as mine" : "Save as my character");
      s.title = "Keep this page's " + list((keeps.length ? keeps : fields).map(name)) + " in this browser for the site's other pages";
      s.addEventListener("click", function () {
        var r = page.read() || {}, part = {};
        fields.forEach(function (k) { if (has(r, k)) part[k] = r[k]; });
        m.note = set(part) ? "Saved in this browser for the site's other pages: " + list(Object.keys(part).map(name)) + "."
          : "Your browser doesn't let this site keep it.";
        m.noteAt = Date.now();
        drawAll();
      });
      box.append(s);
    }
    var n = document.createElement("span");
    n.className = "ez-char-note"; n.setAttribute("role", "status"); n.textContent = m.note || "";
    box.append(n);
    if (!saved.length && !m.note && keeps.length) {
      var help = document.createElement("span");
      help.className = "ez-char-help";
      help.textContent = "Saving keeps your " + list(keeps.map(name)) + " in this browser, so the site's other pages can fill "
        + (keeps.length === 1 ? "it" : "them") + " in.";
      box.append(help);
    }
    if (typeof page.armory === "function") {
      if (!m.arm) { m.arm = armRow(m); (armHost(m) || m.box).append(m.arm.row); }
      armSync(m);
    }
  }
  // A page may put the armory line elsewhere: in a second .ez-char marked data-arm (the IAS Calculator's, at the top of
  // its setup: the first-time visitor audit, 2026-11-26, ST-02, where loading your character fills in the setup); that
  // box is not a card of its own (start() skips it) and holds only the line and what each load did.
  function armHost(m) {
    var h = document.querySelector(".ez-char[data-arm]");
    return h && h !== m.box ? h : null;
  }

  /* Load from the armory (the author, 2026-11-24: "pulling character data directly from ... pd2 armory", gear,
     stats, skills and level): on a page whose ezCharPage has armory(V) (the Damage Calculator, IAS Calculator,
     Breakpoints and Monster Damage), a line under the card's tags takes a character's name. Load asks our Worker
     (tools/armory_worker.js at ARMORY_PROXY: the armory answers other sites' pages only through it); Paste takes the
     armory's own answer, opened in a tab and copied. javascripts/armory.js (window.ezArmory: the loader, its data from
     tools/armory_data.py) loads on first use. The page fills itself from one weapon set (V) and answers {filled, left,
     add?, warn?, undoable(), undo()}. A page with targets() (the Damage Calculator in Compare builds: Build A ... and A
     new build) takes the one picked beside Load as armory(V, target), answers with key (the build it filled, for the
     weapon set buttons: armory(V, key) fills it again) and letter, and clear() for Clear character; more than one
     character can then be loaded, each a block in the card with its build's letter (the author's pick: "all in the
     box"). The name is kept in this browser (erazure-armory); nothing loads without a click. */
  // the Worker's address (deployed 2026-11-24 by the author; "" would offer the paste steps only). It answers the
  // website's pages and 127.0.0.1:8000 / localhost:8000 (site_preview.bat). tools/armory_selftest.py sets
  // window.ezArmoryProxy before this runs, with fetch stubbed, to try Load
  var ARMORY_PROXY = window.ezArmoryProxy || "https://pd2-armory.erazure.workers.dev";
  var ARM_KEY = "erazure-armory";
  var NAME_OK = /^[A-Za-z][A-Za-z_-]{1,14}$/;
  // loads: [{C, k, V, res, target, letter, what}] one per loaded character, in the card in their letters' order; into:
  // the target picked beside Load ("" until the player picks one: then it follows the name typed)
  var arm = {loads: [], busy: false, err: "", open: false, name: "", into: "", note: ""};
  try { arm.name = String((JSON.parse(localStorage.getItem(ARM_KEY) || "{}") || {}).name || ""); } catch (e) { /* storage off */ }
  var armReady = null, armN = 0;
  function armLoader() {
    if (window.ezArmory && window.ezArmory.api === 1) return Promise.resolve(window.ezArmory);
    if (!armReady) {
      armReady = new Promise(function (ok, no) {
        var s = document.createElement("script");
        s.src = (typeof __md_scope !== "undefined" ? __md_scope.href : "/") + "javascripts/armory.js";
        s.onload = function () {
          if (window.ezArmory && window.ezArmory.api === 1) ok(window.ezArmory);
          else { armReady = null; no(new Error("script")); }  // an older or newer loader than this box (cache)
        };
        s.onerror = function () { armReady = null; no(new Error("script")); };
        document.head.append(s);
      });
    }
    return armReady;
  }
  var armSite = function (name) { return "https://api.projectdiablo2.com/game/character/" + encodeURIComponent(name); };
  // the character's own page on the PD2 armory (2026-11-24, the author: "a link to the PD2 armory for the character
  // you type in"): beside Load, following the name typed, and on each loaded character's name
  var armPage = function (name) { return "https://www.projectdiablo2.com/character/" + encodeURIComponent(name); };
  var armPage0 = function () { return mounts.length ? mounts[0].page : window.ezCharPage; };
  var armTargets = function (page) { var t = page && typeof page.targets === "function" ? page.targets() : null; return t && t.length ? t : null; };
  // the build a target fills, as a letter ("A"): from the page's options
  var armLetter = function (page, target) {
    var t = armTargets(page) || [];
    for (var i = 0; i < t.length; i++) if (String(t[i].value) === String(target)) return t[i].letter || "";
    return "";
  };
  // one load: its weapon set k from C, into the page (a set switch fills the same build again)
  function armFill(page, L, k) {
    L.k = k; L.res = null;
    try {
      L.V = window.ezArmory.view(L.C, k);
      L.res = page.armory(L.V, L.key !== undefined ? L.key : L.target) || null;
      if (L.res && L.res.key !== undefined) L.key = L.res.key;
      if (L.res && L.res.letter) L.letter = L.res.letter;
      return true;
    } catch (e) {
      arm.err = "page";
      if (window.console) console.error(e);
      return false;
    }
  }
  // Clear character: the page as it was before that load (a page without clear() undoes while nothing changed since)
  // what it did: "removed" (a build the load made), "restored" (that build as it was), or "undone" (the whole page)
  function armClear(L) {
    var how = "";
    if (L.res) { if (L.res.clear) how = L.res.clear() || "restored"; else if (L.res.undoable()) { L.res.undo(); how = "undone"; } }
    arm.loads = arm.loads.filter(function (x) { return x !== L; });
    return how;
  }
  var armCanClear = function (L) { return !!(L.res && (L.res.clear || L.res.undoable())); };
  function armSet(m, L, k) {
    arm.err = ""; arm.note = "";
    // a page without targets fills one character at a time: the last import undone first, then filled again
    if (L.key === undefined && L.res && L.res.undoable()) L.res.undo();
    armFill(m.page, L, k);
    drawAll();
  }
  function armGot(m, C, target) {
    arm.busy = false; arm.err = ""; arm.note = ""; arm.open = false; arm.name = C.name;
    try { localStorage.setItem(ARM_KEY, JSON.stringify({name: C.name})); } catch (e) { /* storage off */ }
    var page = m.page, letter = target !== undefined ? armLetter(page, target) : "";
    // what that build held from an earlier load is cleared first, so Clear character goes back to before both; a page
    // without targets holds one character
    arm.loads.filter(function (L) { return target === undefined || (letter && L.letter === letter); }).forEach(armClear);
    var L = {C: C, target: target, letter: letter, what: false};
    if (armFill(page, L, C.def)) arm.loads.push(L);
    arm.into = "";  // the next name picks its build again
    drawAll();
    return L;
  }
  function armFetch(m, name, target) {
    arm.name = name = String(name || "").trim();
    if (!NAME_OK.test(name)) { arm.err = "name"; drawAll(); return Promise.resolve(null); }
    arm.busy = true; arm.err = ""; arm.note = ""; drawAll();
    return armLoader().then(function (A) { return A.get(name, ARMORY_PROXY); }).then(function (C) { return armGot(m, C, target); }, function (e) {
      arm.busy = false;
      arm.err = (e && e.kind) || "script";
      if (arm.err === "network") arm.open = true;  // the paste steps instead
      drawAll();
      return null;
    });
  }
  function armPaste(m, text, target) {
    if (!String(text || "").trim()) return;
    arm.busy = true; arm.err = ""; arm.note = ""; drawAll();
    armLoader().then(function (A) {
      var C = null;
      try { C = A.parse(text); } catch (e) { arm.busy = false; arm.err = (e && e.kind) || "paste"; drawAll(); return; }
      armGot(m, C, target === null && m.arm ? armInto(m.arm, C.name) : target);
    }, function () { arm.busy = false; arm.err = "script"; drawAll(); });
  }
  function armButton(text, cls) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "ez-char-b" + (cls ? " " + cls : ""); b.textContent = text;
    return b;
  }
  // the build the next load goes into: the one picked, else the name decides (2026-11-24: empty, or the name loaded
  // into a build, keeps that build; another name, A new build while there is room)
  function armInto(a, who) {
    var t = armTargets(a.page);
    if (!t) return undefined;
    var ok = function (v) { return t.some(function (x) { return String(x.value) === String(v) && !x.disabled; }); };
    if (arm.into && ok(arm.into)) return arm.into;
    var nm = String(who === undefined ? arm.name : who).toLowerCase(), have = arm.loads.find(function (L) { return L.C.name.toLowerCase() === nm; });
    if (have && have.letter) { var mine = t.find(function (x) { return x.letter === have.letter && !x.disabled; }); if (mine) return String(mine.value); }
    if (nm && have === undefined && ok("new") && arm.loads.length) return "new";
    var first = t.find(function (x) { return !x.disabled; });
    return first ? String(first.value) : undefined;
  }
  function armRow(m) {
    var a = {row: document.createElement("div"), page: m.page}, id = "ez-arm-" + (++armN);
    a.row.className = "ez-arm";
    var line = document.createElement("div");
    line.className = "ez-arm-line";
    var lab = document.createElement("label"), b = document.createElement("b");
    lab.htmlFor = id; lab.className = "ez-arm-label"; b.textContent = "PD2 armory";
    lab.append(b, ":");
    a.name = document.createElement("input");
    a.name.type = "text"; a.name.id = id; a.name.className = "ez-arm-name"; a.name.placeholder = "Character name";
    a.name.autocomplete = "off"; a.name.spellcheck = false; a.name.maxLength = 15; a.name.value = arm.name;
    a.name.setAttribute("autocapitalize", "off");
    a.name.addEventListener("focus", function () { armLoader().catch(function () { /* said on use */ }); });
    // the armory's whole answer pasted into the name box works too (read before the box's 15 letters cut it)
    a.name.addEventListener("paste", function (e) {
      var t = e.clipboardData && e.clipboardData.getData("text");
      if (t && /^\s*\{/.test(t)) { e.preventDefault(); armPaste(m, t, null); }
    });
    a.name.addEventListener("input", function () {
      arm.name = a.name.value.trim();
      armLink(a);
      armIntoSync(a);
    });
    a.name.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); if (ARMORY_PROXY) armFetch(m, a.name.value, armInto(a)); else { arm.open = true; drawAll(); } }
    });
    // into: the page's builds (Compare builds), "into Build A"
    a.intoWrap = document.createElement("label");
    a.intoWrap.className = "ez-arm-intolab";
    a.into = document.createElement("select");
    a.into.className = "ez-arm-into";
    a.into.setAttribute("aria-label", "Load into");
    a.intoWrap.append("into ", a.into);
    a.into.addEventListener("change", function () { arm.into = a.into.value; });
    a.load = armButton("Load");
    a.load.hidden = !ARMORY_PROXY;
    a.load.addEventListener("click", function () { armFetch(m, a.name.value, armInto(a)); });
    // what it takes, in its name (the IAS Calculator's first-time visitor audit, WO-02: "Paste instead" didn't say)
    a.pasteB = armButton(ARMORY_PROXY ? "Paste the armory's text" : "Paste it in");
    a.pasteB.addEventListener("click", function () {
      arm.open = !arm.open; drawAll();
      if (arm.open) a.text.focus();
    });
    a.view = document.createElement("a");
    a.view.className = "ez-arm-view"; a.view.target = "_blank"; a.view.rel = "noopener";
    a.panel = document.createElement("div");
    a.panel.className = "ez-arm-paste";
    a.panel.id = id + "-p";
    a.pasteB.setAttribute("aria-controls", a.panel.id);
    var steps = document.createElement("ol");
    var s1 = document.createElement("li");
    a.link = document.createElement("a");
    a.link.target = "_blank"; a.link.rel = "noopener";
    s1.append("Open ", a.link, " (a new tab).");
    var s2 = document.createElement("li");
    s2.textContent = "Select all of it and copy it: Ctrl+A, then Ctrl+C (in Firefox: Raw Data, then Copy).";
    var s3 = document.createElement("li");
    s3.textContent = "Paste it here:";
    steps.append(s1, s2, s3);
    a.text = document.createElement("textarea");
    a.text.className = "ez-arm-text"; a.text.rows = 3; a.text.spellcheck = false;
    a.text.setAttribute("aria-label", "Your character's armory data, pasted");
    a.text.addEventListener("focus", function () { armLoader().catch(function () { /* said on use */ }); });
    a.text.addEventListener("paste", function (e) {
      var t = e.clipboardData && e.clipboardData.getData("text");
      if (!t) return;  // the browser's own paste: read on input
      e.preventDefault();
      armPaste(m, t, null);
    });
    a.text.addEventListener("input", function () {
      if (/^\s*\{[\s\S]*\}\s*$/.test(a.text.value)) { var t = a.text.value; a.text.value = ""; armPaste(m, t, null); }
    });
    a.panel.append(steps, a.text);
    a.out = document.createElement("div");
    a.out.className = "ez-arm-out";
    a.out.setAttribute("role", "status");
    line.append(lab, a.name, a.intoWrap, a.load, a.pasteB, a.view);
    a.row.append(line, a.panel, a.out);
    armLink(a);
    return a;
  }
  function armLink(a) {
    var ok = NAME_OK.test(arm.name);
    a.link.textContent = ok ? arm.name + "'s armory data" : "your character's armory data (type its name first)";
    if (ok) { a.link.href = armSite(arm.name); a.link.removeAttribute("aria-disabled"); }
    else { a.link.removeAttribute("href"); a.link.setAttribute("aria-disabled", "true"); }
    // its page on the PD2 armory, while the name typed is one a character can have
    a.view.hidden = !ok;
    if (ok) {
      a.view.href = armPage(arm.name);
      a.view.textContent = "Armory page ↗";
      a.view.title = arm.name + " on the PD2 armory (a new tab)";
      a.view.setAttribute("aria-label", "See " + arm.name + " on the PD2 armory");
    }
  }
  // the into list, from the page's targets (none: hidden); not rebuilt while it has the focus
  function armIntoSync(a) {
    var t = armTargets(a.page);
    a.intoWrap.hidden = !t;
    if (!t || document.activeElement === a.into) return;
    var want = armInto(a), html = t.map(function (x) { return String(x.value) + "|" + x.label + "|" + !!x.disabled; }).join(",");
    if (a.into.dataset.opts !== html) {
      a.into.textContent = "";
      t.forEach(function (x) {
        var o = document.createElement("option");
        o.value = String(x.value); o.textContent = x.label; o.disabled = !!x.disabled;
        a.into.append(o);
      });
      a.into.dataset.opts = html;
    }
    if (want !== undefined) a.into.value = want;
  }
  // "3 minutes ago", "5 hours ago", "2 days ago"
  function armAgo(ms) {
    if (!ms) return "";
    var mins = Math.max(0, Math.round((Date.now() - ms) / 60000));
    var n = mins < 60 ? [mins, "minute"] : mins < 48 * 60 ? [Math.round(mins / 60), "hour"] : [Math.round(mins / 1440), "day"];
    return n[0] < 1 ? "just now" : n[0] + " " + n[1] + (n[0] === 1 ? "" : "s") + " ago";
  }
  var ARM_ERR = {
    name: function () { return "A character's name is 2 to 15 letters, and can have a - or _ in it."; },
    missing: function () {
      return "The armory has no character named " + arm.name + ", or can't read that character right now. Check the name as the game shows it.";
    },
    network: function () { return "The armory didn't answer. You can paste it in instead:"; },
    noproxy: function () { return "Paste it in:"; },
    paste: function () { return "That isn't a character from the armory: copy the whole page (Ctrl+A, Ctrl+C) and paste it again."; },
    script: function () { return "This page couldn't load the armory reader. Reload the page and try again."; },
    page: function () { return "Something went wrong filling in this page. The rest of it still works."; },
  };
  // every item starts with a capital letter, whichever page made it (the author, 2026-11-24: "make sure that the
  // capitalization is standardized ... Keep this consistent"); names inside keep their own
  var caps = function (xs) { return xs.map(function (t) { t = String(t); return t.charAt(0).toUpperCase() + t.slice(1); }); };
  // one loaded character: the green status line (its build's letter when there are more), Clear character, its two
  // weapon sets, a ⚠ line when the page can't work out its main skill, then a fold with what it filled in, what it
  // left, and what to add by hand (the author's picks, 2026-11-24)
  function armBlock(m, L, many) {
    var C = L.C, V = L.V, page = m.page, blk = document.createElement("div");
    blk.className = "ez-arm-blk";
    var line = document.createElement("p");
    line.className = "ez-arm-status";
    if (many && L.letter) {
      var key = document.createElement("span");
      key.className = "ez-arm-key"; key.textContent = L.letter; key.setAttribute("aria-label", "Build " + L.letter);
      if (page.keyColor) key.style.setProperty("--key", page.keyColor(L.letter));
      line.append(key);
    }
    var ok = document.createElement("span");
    ok.className = "ez-arm-ok"; ok.setAttribute("aria-hidden", "true"); ok.textContent = "✓";
    var nm = document.createElement("b"), nl = document.createElement("a");
    nl.href = armPage(C.name); nl.target = "_blank"; nl.rel = "noopener"; nl.title = "Its page on the PD2 armory (a new tab)";
    nl.textContent = C.name;
    nm.append(nl);
    var nc = (C.charms || []).length, setb = (V.worn || []).filter(function (w) { return w.n >= 2; }).length;
    var ago = armAgo(C.saved), bits = ["level " + C.lvl + " " + C.clsName + (C.hc ? ", hardcore" : "") + (C.dead ? ", dead" : "")];
    if (ago) bits.push("saved " + ago);
    if (nc || setb) bits.push((nc ? nc + " charm" + (nc === 1 ? "" : "s") : "") + (nc && setb ? " and " : "") + (setb ? "set bonuses" : "") + " counted");
    var what = document.createElement("span");
    what.className = "ez-arm-what-line";
    what.textContent = bits.join(" · ");
    line.append(ok, nm, what);
    if (armCanClear(L)) {
      var clr = armButton("Clear character", "ez-arm-clear");
      clr.dataset.key = "clear-" + (L.letter || "a");
      clr.setAttribute("aria-label", "Clear " + C.name + ": the page as it was before the load");
      clr.addEventListener("click", function () {
        var how = armClear(L);
        arm.note = "Cleared " + C.name + ": " + (how === "removed" ? "build " + L.letter + " removed."
          : how === "restored" && L.letter ? "build " + L.letter + " is back as it was." : "the page is as it was before the load.");
        drawAll();
      });
      line.append(clr);
    }
    blk.append(line);
    // the weapon sets, when the other one holds something: the one picked with its ✓ (no label, the set in hand
    // first: the author, 2026-11-24)
    if (C.sets[1] && C.sets[1].label !== "no weapon") {
      var sets = document.createElement("p");
      sets.className = "ez-arm-sets";
      sets.setAttribute("role", "group");
      sets.setAttribute("aria-label", "Weapon set");
      C.sets.forEach(function (s, k) {
        var on = L.k === k, sb = armButton("", "ez-arm-set");
        if (on) {
          var ck = document.createElement("span");
          ck.setAttribute("aria-hidden", "true");
          ck.textContent = "✓ ";
          sb.append(ck);
        }
        sb.append(s.label);
        sb.setAttribute("aria-pressed", String(on));
        sb.dataset.key = "set" + (L.letter || "") + k;
        sb.addEventListener("click", function () { armSet(m, L, k); });
        sets.append(sb);
      });
      blk.append(sets);
    }
    var res = L.res;
    if (!res) return blk;
    if (res.warn) {
      var w = document.createElement("p");
      w.className = "ez-arm-warn";
      w.textContent = "⚠ " + res.warn;
      blk.append(w);
    }
    var notes = (V.notes || []).slice();
    if (V.failed) notes.push(V.failed + " item" + (V.failed === 1 ? "" : "s") + " the armory couldn't read");
    var groups = [["✓ Filled in", res.filled], ["○ Left as it was", res.left], ["✎ Add yourself", res.add], ["Not counted", notes]]
      .filter(function (g) { return g[1] && g[1].length; });
    if (!groups.length) return blk;
    var fold = document.createElement("details");
    fold.className = "ez-arm-what";
    fold.open = !!L.what;
    fold.addEventListener("toggle", function () { L.what = fold.open; });
    var sum = document.createElement("summary");
    sum.textContent = res.add && res.add.length ? "What was filled in, and what to add yourself" : "What was filled in";
    sum.dataset.key = "what-" + (L.letter || "a");
    var lists = document.createElement("div");
    lists.className = "ez-arm-lists";
    groups.forEach(function (g) {
      var col = document.createElement("div"), h = document.createElement("p"), ul = document.createElement("ul");
      h.className = "ez-arm-lh"; h.textContent = g[0];
      caps(g[1]).forEach(function (t) { var li = document.createElement("li"); li.textContent = t; ul.append(li); });
      col.append(h, ul);
      lists.append(col);
    });
    fold.append(sum, lists);
    blk.append(fold);
    return blk;
  }
  function armSync(m) {
    var a = m.arm;
    if (document.activeElement !== a.name && a.name.value.trim() !== arm.name) a.name.value = arm.name;
    armLink(a);
    armIntoSync(a);
    a.load.disabled = arm.busy;
    a.pasteB.setAttribute("aria-expanded", String(arm.open));
    a.panel.hidden = !arm.open;
    // the output, drawn again: the focus stays where it was (by its key)
    var had = a.out.contains(document.activeElement) && document.activeElement.dataset ? document.activeElement.dataset.key : "";
    a.out.textContent = "";
    var p = document.createElement("p");
    if (arm.busy) p.textContent = "Loading " + (arm.name || "it") + " from the armory…";
    else if (arm.err && ARM_ERR[arm.err]) p.textContent = (arm.err === "network" || arm.err === "noproxy" ? "" : "⚠ ") + ARM_ERR[arm.err]();
    else if (arm.note) p.textContent = arm.note;
    if (p.textContent) a.out.append(p);
    // a page's builds can go (Remove, Reset, Undo): a load whose build is gone goes with it
    if (m.page.loaded) arm.loads = arm.loads.filter(function (L) { return L.key === undefined || m.page.loaded(L.key); });
    var loads = arm.loads.slice().sort(function (x, y) { return (x.letter || "").localeCompare(y.letter || ""); });
    loads.forEach(function (L) { if (L.V) a.out.append(armBlock(m, L, loads.length > 1)); });
    if (had) {
      var back = a.out.querySelector('[data-key="' + had + '"]');
      if (back) back.focus();
    }
  }
  function drawAll() {
    mounts = mounts.filter(function (m) { return m.box.isConnected; });
    mounts.forEach(draw);
  }
  // a box drawn again (the editor redraws its parts) replaces the old one gone from the page and keeps its note
  function mount(box, page) {
    if (!box || !page) return;
    var old = null;
    mounts = mounts.filter(function (m) {
      if (m.box === box || !m.box.isConnected) { if (!old || m.noteAt > old.noteAt) old = m; return false; }
      return true;
    });
    var m = {box: box, page: page, note: old ? old.note : "", noteAt: old ? old.noteAt : 0};
    mounts.push(m);
    draw(m);
  }
  // a build card's own name box (the Damage Calculator's Start from…: A character from the PD2 armory) loads through
  // the card above, its status shown there with the others: a promise of {ok} or {error: the words to show}
  function load(name, target) {
    var m = mounts.find(function (x) { return typeof x.page.armory === "function" && x.box.isConnected; });
    if (!m) return Promise.resolve({error: "This page can't load from the PD2 armory."});
    return armFetch(m, name, target).then(function (L) {
      return L ? {ok: true} : {error: arm.err && ARM_ERR[arm.err] ? ARM_ERR[arm.err]() : "That didn't load."};
    });
  }
  window.ezCharacter = {get: get, set: set, mount: mount, classes: CLS, load: load};
  // the page's own changes can make it match the saved character, or not: drawn again as they happen (the page's own
  // redraw right after a Use keeps its "Used your ..." line)
  var t = 0;
  var soon = function () {
    clearTimeout(t);
    t = setTimeout(function () {
      mounts.forEach(function (m) { if (Date.now() - m.noteAt > 1500) m.note = ""; });
      drawAll();
    }, 400);
  };
  var outside = function (e) { return !e.target.closest || !e.target.closest(".ez-char"); };
  document.addEventListener("input", function (e) { if (mounts.length && outside(e)) soon(); }, true);
  document.addEventListener("change", function (e) { if (mounts.length && outside(e)) soon(); }, true);
  document.addEventListener("click", function (e) {
    if (mounts.length && e.target.closest && e.target.closest("button") && outside(e)) soon();
  }, true);
  window.addEventListener("storage", function (e) { if (e.key === KEY) drawAll(); });
  // a page whose script is deferred (the Grail Planner's) defines its hook after this runs: then once the page is read
  function start() {
    var page = window.ezCharPage;
    if (!page) return;
    [].forEach.call(document.querySelectorAll(".ez-char:not([data-arm])"), function (box) { mount(box, page); });
  }
  if (window.ezCharPage) start(); else document.addEventListener("DOMContentLoaded", start);
})();

/* Annotated pictures (the website ideas' #26 and #25, 2026-11-22): a picture tools/example_shots.py drew has a card file
   beside it (img/examples/<name>.json: each label's box as fractions of the picture, the item, the filter levels that
   show it, its drop sound and the PoE version's). A button over each label opens a small card: the item, where it
   shows, its sound, a link to the Item Lookup. The Versions page's .ez-versions box picks the scene, the look and the
   add-on of the pictures drawn in each version. window.ezSound plays a drop sound: the game's own clip from the Filter
   Editor's copies (4-bit IMA ADPCM: rate, length, first sample and step index, then two samples a byte). */
(function () {
  "use strict";
  var SITE = typeof __md_scope !== "undefined" ? __md_scope.href : "https://filtersby-erazure.github.io/PD2-Loot-Filter/";
  var STEPS = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97,
    107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876,
    963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358,
    5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086,
    29794, 32767];
  var INDEX = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];
  var cache = {}, audio = null, playing = null;
  function decode(buf) {
    var dv = new DataView(buf), rate = dv.getUint32(0, true), n = dv.getUint32(4, true);
    var pred = dv.getInt16(8, true), index = Math.min(dv.getUint16(10, true), 88);
    var out = new Float32Array(n), bytes = new Uint8Array(buf, 12);
    out[0] = pred / 32768;
    for (var i = 1; i < n; i++) {
      var b = bytes[(i - 1) >> 1], code = (i - 1) & 1 ? b >> 4 : b & 15, step = STEPS[index], d = step >> 3;
      if (code & 4) d += step;
      if (code & 2) d += step >> 1;
      if (code & 1) d += step >> 2;
      pred = code & 8 ? Math.max(-32768, pred - d) : Math.min(32767, pred + d);
      index = Math.max(0, Math.min(88, index + INDEX[code]));
      out[i] = pred / 32768;
    }
    return {rate: rate, samples: out};
  }
  function play(id, btn) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      cache[id] = cache[id] || fetch(SITE + "Erazure-Filter-Editor-Assets/sounds/" + id + ".adpcm")
        .then(function (r) { if (!r.ok) throw new Error("no clip"); return r.arrayBuffer(); }).then(decode);
      cache[id].then(function (c) {
        if (playing) { try { playing.stop(); } catch (e) { /* ended */ } }
        var buf = audio.createBuffer(1, c.samples.length, c.rate);
        buf.copyToChannel(c.samples, 0);
        var src = audio.createBufferSource();
        src.buffer = buf; src.connect(audio.destination); src.start(); playing = src;
        if (btn) { btn.classList.add("on"); src.onended = function () { btn.classList.remove("on"); }; }
      }, function () { if (btn) { btn.disabled = true; btn.title = "This sound can't play here"; } });
    } catch (e) { if (btn) btn.disabled = true; }
  }
  window.ezSound = {play: play};

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
  // the levels that show it in words: "every filter level", "filter levels 0-7, hidden on 8-12"
  function runs(xs) {
    var out = [], a = null, p = null;
    xs.forEach(function (x) { if (a === null) { a = p = x; } else if (x === p + 1) { p = x; } else { out.push(a === p ? a : a + "-" + p); a = p = x; } });
    if (a !== null) out.push(a === p ? a : a + "-" + p);
    return out.join(", ");
  }
  function levelWords(levels) {
    if (levels.length === 13) return "Shown on every filter level.";
    if (!levels.length) return "Hidden on every filter level.";
    var hidden = [];
    for (var i = 0; i < 13; i++) if (levels.indexOf(i) < 0) hidden.push(i);
    return "Shown on filter levels " + runs(levels) + ", hidden on " + runs(hidden) + ".";
  }
  var openCard = null;
  function closeCard() { if (openCard) { openCard.remove(); openCard = null; } }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCard(); });
  document.addEventListener("click", function (e) {
    if (openCard && !openCard.contains(e.target) && !(e.target.closest && e.target.closest(".ez-ann-b"))) closeCard();
  });
  function showCard(wrap, x, both) {
    closeCard();
    var c = el("div", "ez-ann-card"), head = el("div", "ez-ann-h");
    var name = x.item + (x.quality ? " (" + x.quality + (x.id ? "" : ", unidentified") + ")" : "");
    head.appendChild(el("strong", "", name));
    var shut = el("button", "ez-ann-x", "✕");
    shut.type = "button"; shut.setAttribute("aria-label", "Close");
    shut.addEventListener("click", closeCard);
    head.appendChild(shut);
    c.appendChild(head);
    c.appendChild(el("p", "", levelWords(x.levels)));
    var row = el("p", "ez-ann-s");
    function sound(id, words) {
      var s = el("button", "ez-ann-play", "▶ " + words);
      s.type = "button";
      s.addEventListener("click", function (e) { e.stopPropagation(); play(id, s); });
      row.appendChild(s);
    }
    if (x.sound) sound(x.sound, both ? "Its sound" : "Its drop sound");
    if (both && x.poe && x.poe !== x.sound) sound(x.poe, "In the PoE versions");
    if (!x.sound && !(both && x.poe)) row.appendChild(el("span", "", "No drop sound."));
    c.appendChild(row);
    var a = el("a", "", "Open in the Item Lookup: every filter level and the rule that decides ›");
    a.href = SITE + "lookup/#i=" + x.code + (x.q ? "." + x.q : "");
    var lp = el("p");
    lp.appendChild(a);
    c.appendChild(lp);
    // under the label, kept inside the picture's width
    c.style.top = (100 * (x.box[1] + x.box[3])) + "%";
    c.style.left = (100 * x.box[0]) + "%";
    wrap.appendChild(c);
    var over = c.getBoundingClientRect().right - wrap.getBoundingClientRect().right;
    if (over > 0) c.style.left = "calc(" + (100 * x.box[0]) + "% - " + Math.ceil(over + 4) + "px)";
    if (c.getBoundingClientRect().left < wrap.getBoundingClientRect().left) c.style.left = "0";
    openCard = c;
    var first = c.querySelector(".ez-ann-play, a");
    if (first) first.focus({preventScroll: true});
  }
  function annotate(img, both) {
    var src = img.getAttribute("src") || "";
    fetch(src.replace(/\.png(\?.*)?$/, ".json")).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d) return;
      var target = img.closest("a") || img, wrap = target.parentElement;
      if (!wrap || !wrap.classList.contains("ez-ann")) {
        wrap = el("span", "ez-ann");
        target.parentNode.insertBefore(wrap, target);
        wrap.appendChild(target);
      }
      [].forEach.call(wrap.querySelectorAll(".ez-ann-b"), function (b) { b.remove(); });
      var buttons = [];
      d.labels.forEach(function (x) {
        if (!x.box) return;
        var b = el("button", "ez-ann-b");
        b.type = "button";
        b.setAttribute("aria-label", "About " + x.item + (x.quality ? " (" + x.quality + ")" : ""));
        b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); showCard(wrap, x, both); });
        wrap.appendChild(b);
        buttons.push({b: b, box: x.box});
      });
      var again = function () { place(img, buttons); };
      again();
      if (!img.complete) img.addEventListener("load", again, {once: true});
      if (wrap.ezPlace) window.removeEventListener("resize", wrap.ezPlace);  // Versions draws its picture again
      wrap.ezPlace = again;
      window.addEventListener("resize", again);
    }, function () { /* no card file: the picture stays as it is */ });
  }
  // Each label's button covers its label and, where the picture is small, as much around it as reaches 24 px tall, up
  // to half the gap to the labels above and below it (the additions audit, 2026-11-23, ST-04: on a phone the buttons
  // were 5-12 px tall, and a near miss opened the full-size picture).
  function place(img, buttons) {
    var H = img.clientHeight, W = img.clientWidth;
    var want = H ? 24 / H : 0, side = W ? 3 / W : 0;  // a picture not drawn yet: the labels' own boxes until it is
    buttons.forEach(function (o) {
      var x = o.box[0], y = o.box[1], w = o.box[2], h = o.box[3], top = y, bottom = y + h;
      if (h < want) {
        var lo = 0, hi = 1;
        buttons.forEach(function (p) {
          var q = p.box;
          if (p === o || q[0] >= x + w || q[0] + q[2] <= x) return;  // not above or below this one
          if (q[1] >= y + h) hi = Math.min(hi, (y + h + q[1]) / 2);
          else if (q[1] + q[3] <= y) lo = Math.max(lo, (q[1] + q[3] + y) / 2);
        });
        top = Math.max(lo, y + h / 2 - want / 2);
        bottom = Math.min(hi, y + h / 2 + want / 2);
      }
      o.b.style.left = 100 * Math.max(0, x - side) + "%"; o.b.style.width = 100 * (w + 2 * side) + "%";
      o.b.style.top = 100 * top + "%"; o.b.style.height = 100 * (bottom - top) + "%";
    });
  }
  function start() {
    [].forEach.call(document.querySelectorAll(".md-content img"), function (im) {
      if (/img\/examples\/[a-z0-9-]+\.png(\?.*)?$/.test(im.getAttribute("src") || "")) annotate(im, false);
    });
    // the Versions page: the same drops in each version
    var box = document.querySelector(".md-content .ez-versions");
    if (!box) return;
    var CHOICES = [["scene", "Drops", [["home-gear", "Gear"], ["home-runes", "Runes and PD2 items"]]],
      ["look", "Look", [["", "Erazure"], ["minimal", "Minimal"]]],
      ["add", "Add", [["", "Nothing"], ["revealed", "Revealed"], ["big-gg", "BIG GG"]]]];
    var st = {scene: "home-gear", look: "", add: ""};
    var bar = el("div", "ez-versions-bar"), fig = el("figure"), img = el("img"), cap = el("figcaption");
    CHOICES.forEach(function (ch) {
      var g = el("div", "ez-seg"), lab = el("span", "ez-seg-l", ch[1]);
      lab.id = "ezv-" + ch[0];
      g.setAttribute("role", "group"); g.setAttribute("aria-labelledby", lab.id);
      ch[2].forEach(function (o) {
        var b = el("button", "", o[1]);
        b.type = "button"; b.dataset.k = ch[0]; b.dataset.v = o[0];
        b.addEventListener("click", function () { st[ch[0]] = o[0]; draw(); });
        g.appendChild(b);
      });
      var w = el("div", "ez-seg-w");
      w.appendChild(lab); w.appendChild(g); bar.appendChild(w);
    });
    fig.appendChild(img); fig.appendChild(cap);
    box.appendChild(bar); box.appendChild(fig);
    function draw() {
      [].forEach.call(bar.querySelectorAll("button"), function (b) { b.setAttribute("aria-pressed", String(st[b.dataset.k] === b.dataset.v)); });
      var part = [st.look, st.add].filter(Boolean).join("-") || "main";
      var name = (st.look ? "Minimal" : "Erazure") + (st.add ? " - " + (st.add === "big-gg" ? "BIG GG" : "Revealed") : (st.look ? "" : " - Main"));
      img.src = SITE + "img/examples/versions-" + st.scene + "-" + part + ".png";
      img.alt = "The same drops in " + name;
      cap.textContent = name + " on filter level 1, outside town. Click a label for its drop sound, in this version and in the PoE one. ";
      // the full-size picture, as Examples' pictures have (the additions audit, 2026-11-23, ST-04)
      var full = el("a", "", "Open the picture full size");
      full.href = img.src;
      cap.appendChild(full);
      closeCard();
      annotate(img, true);
    }
    draw();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

/* A folded section's pages row (overrides/partials/tabs.html, mkdocs.yml extra.page_fold: Resources, 2026-11-26, the
   IAS Calculator's first-time visitor audit, LA-01): a group's name opens its pages under it, one group at a time;
   a click elsewhere or Escape closes it (Escape puts the focus back on the name). */
(function () {
  "use strict";
  var open = null;
  function close(focus) {
    if (!open) return;
    open.setAttribute("aria-expanded", "false");
    var list = document.getElementById(open.getAttribute("aria-controls"));
    if (list) list.hidden = true;
    if (focus) open.focus();
    open = null;
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".ez-fold-b");
    if (b) {
      var was = open === b;
      close(false);
      if (!was) {
        b.setAttribute("aria-expanded", "true");
        var list = document.getElementById(b.getAttribute("aria-controls"));
        if (list) list.hidden = false;
        open = b;
      }
      return;
    }
    if (open && !(e.target.closest && e.target.closest(".ez-fold-list"))) close(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) close(true);
  });
  // the focus leaving the open group closes it, onto the next group's name too (the IAS Calculator's full audit of
  // 2026-11-27, CO-08: Tab onto the next name left the first list open)
  document.addEventListener("focusin", function (e) {
    if (open && open.closest(".ez-fold") !== (e.target.closest && e.target.closest(".ez-fold"))) close(false);
  });
})();
