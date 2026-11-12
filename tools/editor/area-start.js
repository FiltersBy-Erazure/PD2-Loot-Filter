/* Start: the player's version (style and switches), the file name, saving it into the game (and what to do in the
   launcher and in game), profiles, the saved history, and importing, exporting and sharing changes. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
EZ.areas.push({
  id: "start", title: "Start", icon: "⌂", order: 10, group: "a",
  render(box, app) {
    const {h, option, toggle, ago, dialog, confirmBox, toast} = EZ.ui;
    const p = EZ.store.current(), base = p.edits.base, v = app.variant();
    const set = (fn) => EZ.store.change((e) => fn(e.base), {label: "version"});

    const styles = [
      ["erazure", "Erazure", "Erazure's full look: colorful, intuitive symbols for runes, gems, maps, charms and more."],
      ["minimal", "Minimal", "The same filter with a minimal style: fewer, simpler symbols around the names of items."],
      ["corrlorized", "Corrlorized", "Corr's restyle of Erazure: his own colors, symbols and Path of Exile sound picks."],
    ];
    const corr = base.style === "corrlorized";

    const version = h("section.fe-card", {id: "fe-version"},
      h("h3", "Your version"),
      h("p.fe-sub", "Every version shows and hides the same items at each filter level; they differ in looks, names " +
        "and sounds. Your changes go on top of the version you pick, and you can switch at any time."),
      h("div.fe-choice", styles.map(([id, name, text]) =>
        option(name, text, base.style === id, () => set((b) => { b.style = id; })))),
      h("div.fe-stack", {style: {marginTop: ".9em"}},
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
      spellcheck: "false", style: {width: "16em"}});
    fileInput.addEventListener("change", () => {
      const v2 = fileInput.value.replace(/\.filter$/i, "").trim() || "Erazure-Custom";
      EZ.store.changeProfile((pp) => { pp.file = v2; }, {quiet: true});
      fileInput.value = v2;
    });
    const save = h("section.fe-card", {id: "fe-save"},
      h("h3", "Save it to your game"),
      h("div.fe-row",
        h("label.fe-field", h("span", "File name"), h("span.fe-row", {style: {gap: ".35em"}}, fileInput,
          h("span.fe-sub", ".filter")))),
      h("div.fe-row", {style: {marginTop: ".8em"}},
        h("button.fe-btn.primary", {type: "button", onclick: () => app.saveToGame()},
          app.canSaveInPlace() ? "Save to game" : "Download"),
        app.canSaveInPlace() ? h("button.fe-btn", {type: "button", onclick: () =>
          app.withBuild("Building your filter", app.download)}, "Download") : null),
      s ? h("p.fe-sub", {style: {marginTop: ".6em"}},
        `Last ${s.how === "folder" ? "saved to the game" : "downloaded"} ${ago(s.at)}: ${s.file || ""}, Erazure ${s.version}.`)
        : null,
      stale ? h("p.fe-note.warn", "Erazure has changed since then (now ", h("b", app.src.version), "). Save again to " +
        "get the new version with your changes: a local filter never updates by itself.") : null,
      h("h4", {style: {marginTop: "1em"}}, "In the launcher and in game"),
      h("ol.fe-steps",
        h("li", app.canSaveInPlace()
          ? ["Save to game, and pick the folder ", h("code", "Diablo II\\ProjectD2\\filters\\local"), " the first time."]
          : ["Download, and put the file in ", h("code", "Diablo II\\ProjectD2\\filters\\local"), "."]),
        h("li", "Once: in the launcher open ", h("b", "Item Filter Profiles"), ", click ", h("b", "Local Filter"),
          ", pick your file and click ", h("b", "Save Filter"), "."),
        h("li", "In game: Options, Loot Filter, turn on ", h("b", "Enable Loot Filter"), " and pick a filter level (",
          h("kbd", "Ctrl"), "+", h("kbd", "Numpad 0"), "–", h("kbd", "9"), " jump to levels 0–9)."),
        h("li", "After every save here, press ", h("kbd", "Numpad 0"), " in game to reload the filter.")));

    /* ---- profiles */
    const profiles = EZ.store.profiles();
    const rename = () => {
      const input = h("input", {type: "text", value: p.name, style: {width: "100%"}});
      dialog({title: "Rename this profile", body: [input], buttons: [{text: "Cancel"}, {text: "Rename", primary: true,
        onclick: () => { const n = input.value.trim(); if (n) EZ.store.changeProfile((pp) => { pp.name = n.slice(0, 60); }); }}]});
    };
    const profilesCard = h("section.fe-card", {id: "fe-profiles"},
      h("h3", "Profiles"),
      h("p.fe-sub", "A profile is one set of changes: one per character or build, if you like. Each saves to its own " +
        "file name; the launcher uses the one you picked there."),
      h("div.fe-profiles", profiles.map((x) => h("button.fe-option", {type: "button", "aria-pressed": String(x.id === p.id),
        onclick: () => EZ.store.switchTo(x.id)},
        h("b", x.name), h("small", `${app.fileName(x)} · ${EZ.edits.count(x.edits)} change${EZ.edits.count(x.edits) === 1 ? "" : "s"}` +
          (x.saved ? ` · saved ${ago(x.saved.at)}` : ""))))),
      h("div.fe-row", {style: {marginTop: ".7em"}},
        h("button.fe-btn", {type: "button", onclick: () => EZ.store.addProfile("New profile")}, "New profile"),
        h("button.fe-btn", {type: "button", onclick: () => EZ.store.addProfile(p.name + " (copy)", p.edits)}, "Duplicate"),
        h("button.fe-btn", {type: "button", onclick: rename}, "Rename"),
        profiles.length > 1 ? h("button.fe-btn.danger", {type: "button", onclick: () => confirmBox("Delete this profile?",
          `${p.name} and its changes go (its saved file in your game stays).`, "Delete", () => EZ.store.removeProfile(p.id))},
          "Delete") : null));

    /* ---- history, import, export */
    const historyBox = h("div.fe-history", h("p.fe-sub", "Loading…"));
    EZ.store.history(p).then((list) => {
      EZ.ui.fill(historyBox, list.length ? h("ul.fe-histlist", list.slice(0, 12).map((it) => h("li",
        h("span", ago(it.at) + (it.why ? " · " + it.why : ""),
          h("span.fe-sub", ` · ${EZ.edits.count(JSON.parse(it.edits))} changes`)),
        h("button.fe-btn.ghost.small", {type: "button", onclick: () => confirmBox("Restore these changes?",
          "Your profile's changes become the ones you had then (Undo brings back today's).", "Restore", () =>
            EZ.store.change((e) => {
              const old = EZ.store.normalize({edits: JSON.parse(it.edits)}).edits;
              for (const k of Object.keys(e)) delete e[k];
              Object.assign(e, old);
            }, {label: "restore"}))}, "Restore"))))
        : h("p.fe-sub", "Each save and download keeps a copy of your changes here (in this browser)."));
    }).catch(() => EZ.ui.fill(historyBox, h("p.fe-sub", "This browser keeps no history (blocked storage).")));
    const moveCard = h("section.fe-card", {id: "fe-share"},
      h("h3", "Keep, share and bring in changes"),
      h("p.fe-sub", "Your changes live in this browser. Keep a copy as a file, share them with a link, or bring in " +
        "changes from a file, a link, or a filter this editor saved (its changes are in it)."),
      h("div.fe-row",
        h("button.fe-btn", {type: "button", onclick: () => EZ.share.exportFile(app)}, "Save changes to a file"),
        h("button.fe-btn", {type: "button", onclick: () => EZ.share.copyLink()}, "Copy a share link"),
        h("button.fe-btn", {type: "button", onclick: () => EZ.share.importFile()}, "Import a file"),
        h("button.fe-btn", {type: "button", onclick: () => EZ.share.importPaste()}, "Paste a link"),
        h("button.fe-btn.danger", {type: "button", onclick: () => confirmBox("Clear all changes?",
          "Every change of this profile goes; your version stays. Undo brings them back.", "Clear", () =>
            EZ.store.change((e) => { const b = e.base; for (const k of Object.keys(e)) delete e[k]; e.v = EZ.store.SCHEMA; e.base = b; },
              {label: "clear"}))}, "Clear all changes")),
      !EZ.store.storageOk() ? h("p.fe-note.bad", "This browser doesn't keep your changes (a private window or blocked " +
        "storage): save them to a file before you leave.") : null,
      h("h4", {style: {marginTop: "1em"}}, "History"), historyBox);

    // a quick setup while the profile has no changes (each answer is an ordinary change, shown in its area after)
    let quick = null;
    const DONE = "erazure-filter-editor-setup-done";
    let dismissed = false;
    try { dismissed = localStorage.getItem(DONE) === "1"; } catch (e) { /* show it */ }
    if (!app.changes().count && !dismissed) {
      const tags = EZ.features.filter((f) => f.group === "Tags");
      const LOUD = ["uni-high", "set-high", "runes"];
      quick = h("section.fe-card", {id: "fe-quick"},
        h("h3", "Quick setup"),
        h("p.fe-sub", "Two questions to start from; every answer is an ordinary change you can see and undo later."),
        h("h4", "How many alerts do you want?"),
        h("div.fe-choice",
          option("Erazure's", "Icons, chat lines and sounds as Erazure gives them.", true, () => {}),
          option("Fewer sounds", "Sounds only for High value uniques and sets, and for runes; icons and chat lines stay.",
            false, () => EZ.store.change((e) => {
              e.volume = {};
              for (const k of EZ.volume.kinds(app.src, app.versionLines())) if (LOUD.indexOf(k.id) < 0) e.volume[k.id] = "mute";
            }, {label: "quick setup"})),
          option("Icons only", "Minimap icons, no chat lines and no sounds.", false, () => EZ.store.change((e) => {
            e.alerts = Object.assign({}, e.alerts, {iconsOnly: true});
          }, {label: "quick setup"}))),
        h("h4", {style: {marginTop: ".9em"}}, "Tags on items (the short stat tags before their names)?"),
        h("div.fe-choice",
          option("All of Erazure's", "Affix, roll, runeword, charm, jewel, resistance and sell tags.", true, () => {}),
          option("None", "Plain names: every kind of tag switched off (each can come back on Features).", false, () =>
            EZ.store.change((e) => {
              e.features = Object.assign({}, e.features);
              for (const f of tags) if (EZ.edits.featureDefault(f)) e.features[f.id] = false;
            }, {label: "quick setup"}))),
        h("div.fe-row", {style: {marginTop: ".6em"}}, h("button.fe-btn.ghost.small", {type: "button", onclick: () => {
          try { localStorage.setItem(DONE, "1"); } catch (e) { /* asked again */ }
          app.drawArea();
        }}, "Don't show this again")));
    }

    box.append(
      h("div.fe-area-head", h("div", h("h2", "Start"),
        h("p.fe-sub", "Pick your version, change what you like, and save it straight into your game."))),
      version, quick || "", save, profilesCard, moveCard);
    if (app.sub) {
      const el = box.querySelector("#fe-" + app.sub);
      if (el) el.scrollIntoView();
    }
  },
});
