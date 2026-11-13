/* Help: how the editor works, saving and updates, the game's options and keys, and the questions players ask. An
   answer's [[words|area/part]] is a link to that place of the editor. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
(function () {
  "use strict";
  const {h} = EZ.ui;

  const QA = [
    ["How does the editor work?", [
      "You pick one of Erazure's versions and change what you like. The editor keeps your changes, never a copy of " +
      "the filter: each time you save, it builds the newest Erazure with your changes on top.",
      "With no changes, the file it saves is exactly the launcher's: then keep the launcher's Erazure, which updates " +
      "by itself."]],
    ["How do I get my filter into the game?", [
      "Save to game (in Chrome, Edge and other browsers that can save into a folder) writes it straight into " +
      "Diablo II\\ProjectD2\\filters\\local; other browsers download it, and you put it there yourself.",
      "Once: in the launcher, Item Filter Profiles, Local Filter, pick your file, Save Filter.",
      "A change here reaches the game only with the file: after a change, Save to game again (or download again and " +
      "replace the file in filters\\local), then press the reload filter key in game (Numpad 0 unless you changed it " +
      "in Configure Controls). The steps are on [[Start|start/save]]."]],
    ["Erazure has updated. What do I do?", [
      "Your local filter doesn't update itself. Open the editor and save again: the bar says when Erazure has changed " +
      "since your last save, and your changes go onto the new Erazure.",
      "Your changes to Erazure's own rules are found again in the new version; if Erazure changed one of those rules, " +
      "[[Erazure's rules|erazure]] lists it so you can check it."]],
    ["How do I go back to plain Erazure?", [
      "In the launcher's Item Filter Profiles, pick Erazure instead of Local Filter, then your version and Save " +
      "Filter: it updates by itself again. Your changes stay here for later.",
      "Or clear them: Clear all changes on [[Start|start/share]]. History there keeps a copy, so you can bring them " +
      "back."]],
    ["I hid an item, but it still shows. Why?", [
      "Hiding works on the ground outside town only: an item dropped in town, or in your inventory and stash, still " +
      "shows (test it outside town).",
      "A unique or set item you haven't discovered yet shows even where you hide it: the game's Force Show " +
      "Undiscovered option (on by default).",
      "And the game reads your file only after you save again and press the reload filter key. " +
      "[[I didn't see my item|changes/ch-help]] on Changes answers for any item."]],
    ["Where are my changes kept?", [
      "In this browser: your profiles, and the last 30 saves of each (on [[Start|start/share]], under History). Back " +
      "them up now and then (Back up my changes, on Start or in the menu next to Save to game): clearing the browser's " +
      "data takes them with it.",
      "Every file the editor saves holds your changes too: import it on any computer to get them back."]],
    ["What does the preview show?", [
      "Drops as the game draws them with your filter (or Erazure's, before you change anything): a Scene of drops on " +
      "the floor, one Item at every filter level with the rules that build it, or Samples of typical drops. What your " +
      "changes change is marked \"changed\" (in the scene, the drop is outlined).",
      "Its settings at the top (filter level, character, difficulty, where you are) count everywhere the editor works " +
      "out what an item looks like."]],
    ["How do filter levels work?", [
      "Level 0 shows every item. Levels 1 to 12 are Erazure's, from the least strict to the most: pick one in the " +
      "game's Options, Loot Filter, or set hotkeys to increase and decrease the filter level in the game's options. " +
      "[[Filter levels|levels]] can rename a level or make it behave like another, to change one level only."]],
    ["Why does an item still have its own color?", [
      "The game colors some names itself (runes orange, the Worldstone Shard red, unique and set items by quality): " +
      "the filter writes its text after the game's color, so a look that doesn't set a color keeps the game's."]],
    ["Why is an item hidden that Erazure shows, or the other way round?", [
      "[[Changes|changes]] shows every item at a filter level, Erazure's beside yours, and the preview's Item view " +
      "lists every rule that builds an item's label. The game's own options can hide items too: Hide Healing / Mana " +
      "Potions, and Force Show Undiscovered shows unique and set items you haven't found yet whatever the filter says."]],
    ["What are rules, %CONTINUE% and alerts?", [
      "The game reads the rules from the top; the first one that matches without %CONTINUE% (the word that says " +
      "\"keep going\") decides the label, and one with %CONTINUE% passes its text on to the next. Minimap icons, sounds " +
      "and chat lines are decided apart: the first matching rule with one decides the sound and the chat line, and " +
      "icons add up until a rule without %CONTINUE%. [[My rules|rules]] has a rule builder and checks every line you " +
      "write."]],
    ["What is BH?", [
      "BH is the part of the game (it comes with Project Diablo 2) that reads the loot filter: My rules and Erazure's " +
      "rules name it where they explain how a rule is read. You don't install anything: the game has it.",
      "Most changes never need rules: [[Items|items]], [[Quick Edits|quick]], [[Looks|looks]] and [[Alerts|alerts]] " +
      "write them for you."]],
    ["Can I share my changes?", [
      "Copy a share link, or back up your changes as a file (on [[Start|start/share]], or in the menu next to Save to " +
      "game). Anyone who opens the link or imports the file gets your changes on their own copy of Erazure."]],
    ["Where can I ask for help?", [
      "Copy a report (the last part of [[I didn't see my item|changes/ch-help]] on Changes, or the menu next to Save " +
      "to game): it holds your version, your changes and the item you ask about. Paste it in a message to erazure on " +
      "Discord, with your question."]],
  ];

  EZ.areas.push({
    id: "help", title: "Help", icon: "?", order: 110, group: "d",
    render(box, app) {
      const site = "https://filtersby-erazure.github.io/PD2-Loot-Filter/";
      // an answer's text with its [[words|area/part]] links to the editor's places
      const said = (text) => {
        const out = [];
        let at = 0;
        for (const m of text.matchAll(/\[\[([^|\]]+)\|([a-z-]+)(?:\/([a-z-]+))?\]\]/g)) {
          out.push(text.slice(at, m.index));
          const [, words, area, part] = m;
          out.push(h("a", {href: "#" + area + (part ? "/" + part : ""), onclick: (ev) => {
            ev.preventDefault();
            app.go(area, part || "");
          }}, words));
          at = m.index + m[0].length;
        }
        out.push(text.slice(at));
        return out;
      };
      EZ.ui.add(box, [
        h("div.fe-area-head", h("div", h("h2", "Help"), h("p.fe-sub", "How the editor works, and answers to common " +
          "questions."))),
        h("section.fe-card", QA.map(([q, a]) => h("details.fe-faq", h("summary", q), a.map((t) => h("p", said(t)))))),
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
