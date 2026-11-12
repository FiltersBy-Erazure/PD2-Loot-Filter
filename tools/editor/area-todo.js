/* The areas still being built on the filter-editor branch: each draws a note until its module registers it.
   Removed piece by piece as the areas arrive; the branch is merged only when this file is gone. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
(function () {
  "use strict";
  const TODO = [
    ["items", "Items", "◈", 30, "b", "Show, hide, mute or restyle single items; your hunt list; unique and set tiers."],
    ["wishlists", "Wishlists", "★", 60, "b", "Rares, shop items, runeword and crafting bases, charms and jewels you want."],
    ["maps", "Maps", "⌖", 70, "b", "Map lines, mod warnings and hides, minimum experience."],
    ["changes", "Changes", "⇄", 100, "d", "What your changes do, item by item; every item; compare; troubleshooting."],
    ["help", "Help", "?", 110, "d", "How the editor works, updates, and answers to common questions."],
  ];
  for (const [id, title, icon, order, group, what] of TODO) {
    if (EZ.areas.some((a) => a.id === id)) continue;
    EZ.areas.push({id, title, icon, order, group, render(box) {
      const {h} = EZ.ui;
      box.append(h("div.fe-area-head", h("h2", title)), h("div.fe-empty", h("p", what),
        h("p.fe-sub", "This part of the editor is still being built.")));
    }});
  }
})();
