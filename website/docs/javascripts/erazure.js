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
