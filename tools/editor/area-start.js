/* Start: what the editor does (a file of your own, which updates when you save again), a quick setup, where to go
   for what you want to change, the player's version (style and switches), the file name, saving it into the game
   (and what to do in the launcher and in game), profiles, the saved history, and importing, exporting and sharing
   changes. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
EZ.areas.push({
  id: "start", title: "Start", icon: "⌂", order: 10, group: "a",
  render(box, app) {
    const {h, option, toggle, ago, dialog, confirmBox, toast} = EZ.ui;
    const p = EZ.store.current(), base = p.edits.base, v = app.variant();
    const set = (fn) => EZ.store.change((e) => fn(e.base), {label: "version"});
    const link = (area, text, sub) => h("a", {href: "#" + area + (sub ? "/" + sub : ""), onclick: (ev) => {
      ev.preventDefault();
      app.go(area, sub);
    }}, text);

    /* ---- what the editor does (the author's audit, 2026-11-12: say up front that a save is a file of your own) */
    const intro = h("section.fe-card.fe-intro", {id: "fe-intro"},
      h("p", "This page keeps your changes to Erazure (in this browser). Each time you save, it builds Erazure's newest " +
        "version with your changes into a filter file of your own, which the launcher loads as a ", h("b", "Local Filter"),
        "."),
      h("p.fe-sub", "A local filter doesn't update by itself: when Erazure updates, come back and save again (your " +
        "changes carry over). With no changes, keep the launcher's Erazure: it updates by itself."));

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

    /* ---- what do you want to change? (each goal and the area for it) */
    const goals = [
      ["Show or hide particular items", "items", "a base, a unique, a kind of item; on the levels you pick"],
      ["Show or hide whole kinds at once", "quick", "potions, class items, quivers, charms…"],
      ["A filter level of your own", "quick", "rename one, or make it behave like another and tune it", "levels"],
      ["Fewer sounds or chat lines", "alerts", "per kind of drop, or everywhere at once"],
      ["Other colors or symbols", "looks", "the looks around names, colors, minimap icons"],
      ["Switch off tags or description lines", "features", "affix tags, roll tags, resistances, highlights…"],
      ["Mark the rares you'd keep", "highlights", "a line under items with the stats you want"],
      ["Maps you never pick up", "maps", "and warnings for map mods you avoid"],
    ];
    const goalsCard = h("section.fe-card", {id: "fe-goals"},
      h("h3", "What do you want to change?"),
      h("div.fe-goals", goals.map(([title, area, sub, part]) => h("button.fe-option", {type: "button",
        onclick: () => app.go(area, part)}, h("b", title), h("small", sub),
        h("small.fe-goal-area", "→ " + (EZ.areas.find((a) => a.id === area) || {title: area}).title)))),
      h("p.fe-sub.fe-small", {style: {marginTop: ".6em"}}, "Advanced: ", link("rules", "My rules"), " and ",
        link("erazure", "Erazure's rules"), " work in the loot filter's own language. Changes shows what yours do."));

    const s = p.saved;
    const stale = s && s.version !== app.src.version;
    const fileInput = h("input", {type: "text", value: p.file || "Erazure-Custom", "aria-label": "File name",
      spellcheck: "false", style: {width: "16em"}});
    fileInput.addEventListener("change", () => {
      const v2 = fileInput.value.replace(/\.filter$/i, "").trim() || "Erazure-Custom";
      EZ.store.changeProfile((pp) => { pp.file = v2; });
      fileInput.value = v2;
    });
    const shared = EZ.store.sharedFiles();
    const mine = shared.find((list) => list.some((x) => x.id === p.id));
    const save = h("section.fe-card", {id: "fe-save"},
      h("h3", "Save it to your game"),
      h("div.fe-row",
        h("label.fe-field", h("span", "File name"), h("span.fe-row", {style: {gap: ".35em"}}, fileInput,
          h("span.fe-sub", ".filter")))),
      mine ? h("p.fe-note.warn", "Your profiles ", mine.map((x) => x.name).join(" and "), " save to the same file: " +
        "saving one replaces the other's filter in your game folder. Give this one a name of its own.") : null,
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
        h("li", "In game: Options, Loot Filter, turn on ", h("b", "Enable Loot Filter"), " and pick a filter level. " +
          "You can also set hotkeys to increase and decrease the filter level in the game's options."),
        h("li", app.canSaveInPlace()
          ? ["After a change here, ", h("b", "Save to game"), " again (it replaces your file), then press the reload " +
             "filter key in game (", h("kbd", "Numpad 0"), " unless you changed it in Configure Controls)."]
          : ["A change here doesn't reach your file by itself: after a change, ", h("b", "Download"), " again and " +
             "replace the file in ", h("code", "filters\\local"), " (keep its name), then press the reload filter key " +
             "in game (", h("kbd", "Numpad 0"), " unless you changed it in Configure Controls)."])));

    /* ---- profiles: each its own name and file (EZ.store gives a new one a file of its own) */
    const profiles = EZ.store.profiles();
    const rename = () => {
      const input = h("input", {type: "text", value: p.name, style: {width: "100%"}, "aria-label": "Profile name"});
      const fileToo = h("input", {type: "checkbox", checked: !p.saved});
      const fileNote = h("span.fe-sub");
      const sync = () => {
        const want = EZ.store.freeFile(EZ.store.fileFrom(input.value.trim() || p.name), p.id);
        fileNote.textContent = `Save it as ${want}.filter` + (p.saved ? " (pick the new file in the launcher once)" : "");
      };
      input.addEventListener("input", sync);
      sync();
      dialog({title: "Rename this profile", body: [input,
        h("label.fe-row", {style: {marginTop: ".6em", gap: ".45em"}}, fileToo, fileNote)],
        buttons: [{text: "Cancel"}, {text: "Rename", primary: true, onclick: () => {
          const n = input.value.trim();
          if (!n) return;
          EZ.store.changeProfile((pp) => {
            pp.name = n.slice(0, 60);
            if (fileToo.checked) pp.file = EZ.store.freeFile(EZ.store.fileFrom(pp.name), pp.id);
          });
        }}]});
    };
    const profilesCard = h("section.fe-card", {id: "fe-profiles"},
      h("h3", "Profiles"),
      h("p.fe-sub", "A profile is one set of changes: one per character or build, if you like. Each saves to its own " +
        "file; in the launcher, pick the file of the profile you play."),
      h("div.fe-profiles", profiles.map((x) => h("button.fe-option", {type: "button", "aria-pressed": String(x.id === p.id),
        onclick: () => EZ.store.switchTo(x.id)},
        h("b", x.name), h("small", `${app.fileName(x)} · ${EZ.edits.count(x.edits)} change${EZ.edits.count(x.edits) === 1 ? "" : "s"}` +
          (x.saved ? ` · saved ${ago(x.saved.at)}` : ""))))),
      shared.length ? h("p.fe-note.warn", shared.map((list) => list.map((x) => x.name).join(" and ") + " save to " +
        app.fileName(list[0])).join("; ") + ": saving one replaces the other's file. Rename one (its file too).") : null,
      h("div.fe-row", {style: {marginTop: ".7em"}},
        h("button.fe-btn", {type: "button", onclick: () => EZ.store.addProfile("New profile")}, "New profile"),
        h("button.fe-btn", {type: "button", onclick: () => EZ.store.addProfile(p.name + " (copy)", p.edits)}, "Duplicate"),
        h("button.fe-btn", {type: "button", onclick: rename}, "Rename"),
        profiles.length > 1 ? h("button.fe-btn.danger", {type: "button", onclick: () => confirmBox("Delete this profile?",
          `${p.name} and its changes go (its saved file in your game stays).`, "Delete", () => EZ.store.removeProfile(p.id))},
          "Delete") : null));

    /* ---- history, import, export (a copy goes into History before anything replaces every change) */
    const historyBox = h("div.fe-history", h("p.fe-sub", "Loading…"));
    EZ.store.history(p).then((list) => {
      EZ.ui.fill(historyBox, list.length ? h("ul.fe-histlist", list.slice(0, 12).map((it) => h("li",
        h("span", ago(it.at) + (it.why ? " · " + it.why : ""),
          h("span.fe-sub", ` · ${EZ.edits.count(JSON.parse(it.edits))} changes`)),
        h("button.fe-btn.ghost.small", {type: "button", onclick: () => confirmBox("Restore these changes?",
          "Your profile's changes become the ones you had then. History keeps a copy of today's, and Undo brings them " +
          "back while this page is open.", "Restore", async () => {
            await EZ.store.keepCopy("before restoring");
            EZ.store.change((e) => {
              const old = EZ.store.normalize({edits: JSON.parse(it.edits)}).edits;
              for (const k of Object.keys(e)) delete e[k];
              Object.assign(e, old);
            }, {label: "restore"});
          })}, "Restore"))))
        : h("p.fe-sub", "Each save and download keeps a copy of your changes here (in this browser), and so does " +
            "clearing, restoring or importing over them."));
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
          "Every change of this profile goes; your version stays. History keeps a copy, and Undo brings them back " +
          "while this page is open.", "Clear", async () => {
            await EZ.store.keepCopy("before clearing");
            EZ.store.change((e) => { const b = e.base; for (const k of Object.keys(e)) delete e[k]; e.v = EZ.store.SCHEMA; e.base = b; },
              {label: "clear"});
          })}, "Clear all changes")),
      !EZ.store.storageOk() ? h("p.fe-note.bad", "This browser doesn't keep your changes (a private window or blocked " +
        "storage): save them to a file before you leave.") : null,
      h("h4", {style: {marginTop: "1em"}}, "History"), historyBox);

    /* ---- the quick setup: two questions, kept on screen until both are answered or it is put away (the answers are
       ordinary changes, each in its own area; p.setup remembers which were answered) */
    let quick = null;
    const DONE = "erazure-filter-editor-setup-done";
    let dismissed = false;
    try { dismissed = localStorage.getItem(DONE) === "1"; } catch (e) { /* show it */ }
    const answered = p.setup || {};
    const started = answered.alerts || answered.tags;
    if (!dismissed && !(answered.alerts && answered.tags) && (started || !app.changes().count)) {
      const tags = EZ.features.filter((f) => f.group === "Tags");
      const ed = p.edits;
      const loud = ed.alerts && ed.alerts.iconsOnly ? "icons" : EZ.volume.isFewer(app.src, app.versionLines(), ed.volume) &&
        ed.volume && Object.keys(ed.volume).length ? "fewer" : "erazure";
      const tagsOff = tags.length && tags.every((f) => !EZ.edits.featureDefault(f) ||
        (ed.features && ed.features[f.id] === false));
      const answer = (key, fn, said) => {
        EZ.store.change(fn, {label: "quick setup"});
        EZ.store.changeProfile((pp) => { pp.setup = Object.assign({}, pp.setup, {[key]: true}); }, {quiet: true});
        if (said) toast(said[0], "good", {ms: 8000, action: h("button.fe-btn.small", {type: "button",
          style: {marginLeft: ".6em"}, onclick: () => app.go(said[1])}, "Open " + said[2])});
        app.drawArea();
      };
      quick = h("section.fe-card", {id: "fe-quick"},
        h("h3", "Quick setup"),
        h("p.fe-sub", "Two questions to start from; every answer is an ordinary change you can see and undo later."),
        h("h4", "How many alerts do you want?"),
        h("div.fe-choice",
          option("Erazure's default", "Icons, chat lines and sounds as Erazure gives them.", loud === "erazure",
            () => answer("alerts", (e) => {
              delete e.volume;
              if (e.alerts) { delete e.alerts.iconsOnly; if (!Object.keys(e.alerts).length) delete e.alerts; }
            })),
          option("Fewer sounds", "Sounds only for High value uniques and sets, and for runes; icons and chat lines stay.",
            loud === "fewer", () => answer("alerts", (e) => {
              e.volume = EZ.volume.fewer(app.src, app.versionLines(), e.volume);
              if (e.alerts) { delete e.alerts.iconsOnly; if (!Object.keys(e.alerts).length) delete e.alerts; }
            }, ["Fewer sounds: done. Change any kind of drop on Alerts.", "alerts", "Alerts"])),
          option("Icons only", "Minimap icons, no chat lines and no sounds.", loud === "icons",
            () => answer("alerts", (e) => {
              delete e.volume;
              e.alerts = Object.assign({}, e.alerts, {iconsOnly: true});
            }, ["Icons only: done. It's the switch at the top of Alerts.", "alerts", "Alerts"]))),
        h("h4", {style: {marginTop: ".9em"}}, "Tags on items (the short stat tags before their names)?"),
        h("div.fe-choice",
          option("All of Erazure's", "Affix, roll, runeword, charm, jewel, resistance and sell tags.", !tagsOff,
            () => answer("tags", (e) => {
              if (!e.features) return;
              for (const f of tags) delete e.features[f.id];
              if (!Object.keys(e.features).length) delete e.features;
            })),
          option("None", "Plain names: every kind of tag switched off (each can come back on Features).", tagsOff,
            () => answer("tags", (e) => {
              e.features = Object.assign({}, e.features);
              for (const f of tags) if (EZ.edits.featureDefault(f)) e.features[f.id] = false;
            }, ["Tags switched off. Each kind can come back on Features.", "features", "Features"]))),
        h("div.fe-row", {style: {marginTop: ".6em"}}, h("button.fe-btn.ghost.small", {type: "button", onclick: () => {
          try { localStorage.setItem(DONE, "1"); } catch (e) { /* asked again */ }
          app.drawArea();
        }}, "Don't show this again")));
    }

    box.append(
      h("div.fe-area-head", h("div", h("h2", "Start"),
        h("p.fe-sub", "Pick your version, change what you like, and save it straight into your game."))),
      intro, quick || "", goalsCard, version, save, profilesCard, moveCard);
    if (app.sub) {
      const el = box.querySelector("#fe-" + app.sub);
      if (el) el.scrollIntoView();
    }
  },
});
