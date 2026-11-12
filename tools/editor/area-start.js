/* Start: the player's version (style and switches), the file name, saving it into the game, and what to do in the
   launcher and in game. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
EZ.areas.push({
  id: "start", title: "Start", icon: "⌂", order: 10, group: "a",
  render(box, app) {
    const {h, option, toggle, ago} = EZ.ui;
    const p = EZ.store.current(), base = p.edits.base, v = app.variant();
    const set = (fn) => EZ.store.change((e) => fn(e.base), {label: "version"});

    const styles = [
      ["erazure", "Erazure", "Erazure's full look: colorful, intuitive symbols for runes, gems, maps, charms and more."],
      ["minimal", "Minimal", "The same filter with a minimal style: fewer, simpler symbols around the names of items."],
      ["corrlorized", "Corrlorized", "Corr's restyle of Erazure: his own colors, symbols and Path of Exile sound picks."],
    ];
    const corr = base.style === "corrlorized";

    const version = h("section.fe-card",
      h("h3", "Your version"),
      h("p.fe-sub", "Every version shows and hides the same items at each filter level; they differ in looks, names " +
        "and sounds. Your changes go on top of the version you pick, and you can switch at any time."),
      h("div.fe-choice", styles.map(([id, name, text]) =>
        option(name, text, base.style === id, () => set((b) => { b.style = id; })))),
      h("div.fe-stack", {style: {marginTop: ".9rem"}},
        toggle("Revealed names", base.revealed, (on) => set((b) => { b.revealed = on; }),
          {sub: "Unidentified unique and set items show the names they identify to."}),
        toggle("BIG GG mystery", base.bigGG, (on) => set((b) => { b.bigGG = on; }),
          {sub: "High runes and super rare drops hide what they are on the ground (BIG GG or LIL GG) until you " +
                "pick them up."}),
        toggle("Path of Exile sounds", base.poe || corr, (on) => set((b) => { b.poe = on; }),
          {disabled: corr, sub: corr ? "Corrlorized always has them." : "Path of Exile sound effects on valuable drops."})),
      v ? h("p.fe-note", "This is the launcher's ", h("b", v.launcher), ". ", v.description || "") : null);

    const s = p.saved;
    const stale = s && s.version !== app.src.version;
    const fileInput = h("input", {type: "text", value: p.file || "Erazure-Custom", "aria-label": "File name",
      spellcheck: "false", style: {width: "16rem"}});
    fileInput.addEventListener("change", () => {
      const v2 = fileInput.value.replace(/\.filter$/i, "").trim() || "Erazure-Custom";
      EZ.store.changeProfile((pp) => { pp.file = v2; }, {quiet: true});
      fileInput.value = v2;
    });
    const save = h("section.fe-card",
      h("h3", "Save it to your game"),
      h("div.fe-row",
        h("label.fe-field", h("span", "File name"), h("span.fe-row", {style: {gap: ".35rem"}}, fileInput,
          h("span.fe-sub", ".filter")))),
      h("div.fe-row", {style: {marginTop: ".8rem"}},
        h("button.fe-btn.primary", {type: "button", onclick: () => app.saveToGame()},
          app.canSaveInPlace() ? "Save to game" : "Download"),
        app.canSaveInPlace() ? h("button.fe-btn", {type: "button", onclick: () =>
          app.withBuild("Building your filter", app.download)}, "Download") : null),
      s ? h("p.fe-sub", {style: {marginTop: ".6rem"}},
        `Last ${s.how === "folder" ? "saved to the game" : "downloaded"} ${ago(s.at)}: ${s.file || ""}, Erazure ${s.version}.`)
        : null,
      stale ? h("p.fe-note.warn", "Erazure has changed since then (now ", h("b", app.src.version), "). Save again to " +
        "get the new version with your changes: a local filter never updates by itself.") : null,
      h("h4", {style: {marginTop: "1rem"}}, "In the launcher and in game"),
      h("ol.fe-steps",
        h("li", app.canSaveInPlace()
          ? ["Save to game, and pick the folder ", h("code", "Diablo II\\ProjectD2\\filters\\local"), " the first time."]
          : ["Download, and put the file in ", h("code", "Diablo II\\ProjectD2\\filters\\local"), "."]),
        h("li", "Once: in the launcher open ", h("b", "Item Filter Profiles"), ", click ", h("b", "Local Filter"),
          ", pick your file and click ", h("b", "Save Filter"), "."),
        h("li", "In game: Options, Loot Filter, turn on ", h("b", "Enable Loot Filter"), " and pick a filter level (",
          h("kbd", "Ctrl"), "+", h("kbd", "Numpad 0"), "–", h("kbd", "9"), " jump to levels 0–9)."),
        h("li", "After every save here, press ", h("kbd", "Numpad 0"), " in game to reload the filter.")));

    box.append(
      h("div.fe-area-head", h("div", h("h2", "Start"),
        h("p.fe-sub", "Pick your version, change what you like, and save it straight into your game."))),
      version, save);
  },
});
