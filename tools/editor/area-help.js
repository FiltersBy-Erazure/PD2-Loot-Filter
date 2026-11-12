/* Help: how the editor works, saving and updates, the game's options and keys, and the questions players ask. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
(function () {
  "use strict";
  const {h} = EZ.ui;

  const QA = [
    ["How does the editor work?", [
      "You pick one of Erazure's versions and change what you like. The editor keeps your changes, never a copy of " +
      "the filter: each time you save, it builds the newest Erazure with your changes on top.",
      "With no changes, the file it saves is exactly the launcher's."]],
    ["How do I get my filter into the game?", [
      "Save to game (Chrome and Edge) writes it straight into Diablo II\\ProjectD2\\filters\\local; other browsers " +
      "download it, and you put it there yourself.",
      "Once: in the launcher, Item Filter Profiles, Local Filter, pick your file, Save Filter. After every save, press " +
      "Numpad 0 in game to reload it."]],
    ["Erazure has updated. What do I do?", [
      "Your local filter doesn't update itself. Open the editor and save again: the bar says when Erazure has changed " +
      "since your last save, and your changes go onto the new Erazure.",
      "Changes to Erazure's own rules follow each rule by what it says; if Erazure changed one of those rules, " +
      "Erazure's rules lists it so you can check it."]],
    ["Where are my changes kept?", [
      "In this browser (profiles, and the last 30 saves of each in its history). Save changes to a file now and then " +
      "(the menu next to Save to game): clearing the browser's data takes them with it.",
      "Every file the editor saves holds your changes too: import it on any computer to get them back."]],
    ["How do filter levels work?", [
      "Level 0 shows every item. Levels 1 to 12 are Erazure's, from the least strict to the most; Ctrl+Numpad 0-9 " +
      "jumps to levels 0-9, and the in-game menu reaches 10-12. Quick Edits can rename a level or make it a copy of " +
      "another, to change one level only."]],
    ["Why does an item still have its own color?", [
      "The game colors some names itself (runes orange, the Worldstone Shard red, unique and set items by quality): " +
      "the filter writes its text after the game's color, so a look that doesn't set a color keeps the game's."]],
    ["Why is an item hidden that Erazure shows, or the other way round?", [
      "Changes shows every item at a filter level, Erazure's beside yours, and the preview's Item view lists every " +
      "rule that builds an item's label. The game's own options can hide items too: Hide Healing / Mana Potions, " +
      "and Force Show Undiscovered shows unique and set items you haven't found yet whatever the filter says."]],
    ["What are rules, %CONTINUE% and alerts?", [
      "BH reads the rules from the top; the first one that matches without %CONTINUE% decides the label, and one " +
      "with %CONTINUE% passes its text on to the next. Minimap icons, sounds and chat lines are decided apart: the " +
      "first matching rule with one decides the sound and the chat line, and icons add up until a rule without " +
      "%CONTINUE%. My rules has a rule builder and checks every line you write."]],
    ["Can I share my changes?", [
      "Copy a share link or save the changes to a file (the menu next to Save to game). Anyone who opens the link or " +
      "imports the file gets your changes on their own copy of Erazure."]],
  ];

  EZ.areas.push({
    id: "help", title: "Help", icon: "?", order: 110, group: "d",
    render(box, app) {
      const site = "https://filtersby-erazure.github.io/PD2-Loot-Filter/";
      EZ.ui.add(box, [
        h("div.fe-area-head", h("div", h("h2", "Help"), h("p.fe-sub", "How the editor works, and answers to common " +
          "questions."))),
        h("section.fe-card", QA.map(([q, a]) => h("details.fe-faq", h("summary", q), a.map((t) => h("p", t))))),
        h("section.fe-card.flat", h("h3", "More"),
          h("ul",
            h("li", h("a", {href: site + "filter-levels/", target: "_blank", rel: "noopener"}, "Filter Levels"),
              ": what each level shows and hides."),
            h("li", h("a", {href: site + "tiers/", target: "_blank", rel: "noopener"}, "Unique and Set Tiers"),
              ": every unique and set item's look, by tier."),
            h("li", h("a", {href: "https://wiki.projectdiablo2.com/wiki/Item_Filtering", target: "_blank",
              rel: "noopener"}, "The PD2 wiki's Item Filtering page"), ": every word a rule can use."))),
        h("p.fe-sub.fe-small", "Erazure " + app.src.version + "."),
      ]);
    },
  });
})();
