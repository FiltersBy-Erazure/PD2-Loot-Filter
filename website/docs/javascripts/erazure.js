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
    var open = document.querySelector('[role="tab"][data-tab][aria-selected="true"]');
    if (!open) return;
    for (var i = 0; i < links.length; i++) {
      var on = links[i].getAttribute("href") === "#tab-" + open.getAttribute("data-tab");
      links[i].parentElement.classList.toggle("md-tabs__item--active", on);
      if (on) links[i].setAttribute("aria-current", "true"); else links[i].removeAttribute("aria-current");
    }
  }
  var watch = new MutationObserver(mark);
  for (var i = 0; i < tabs.length; i++) watch.observe(tabs[i], {attributes: true, attributeFilter: ["aria-selected"]});
  mark();
})();
