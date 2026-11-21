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

/* A page that widens its content (its own .md-grid rule) starts at the window's edge while the header and tabs keep
   Material's width, so its title sat 110 px left of the logo at 1440 px (2026-11-15, audit SITE-08). Move the content
   in to the header's edge, as far as it keeps the room it needs; the Filter Editor, an app that uses the whole
   window, keeps it. */
(function () {
  "use strict";
  var main = document.querySelector(".md-main__inner");
  if (!main || !main.querySelector(".erazure-map") || main.querySelector(".edit-map")) return;
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
