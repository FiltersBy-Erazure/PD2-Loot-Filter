/* Filter levels: the levels' names, and a level of the player's own (a level made to behave like another, which the
   player then changes on its own: edits.js's levels step, `levels: {names, copies}`). An area of its own since
   2026-11-12 (the author's answer to the first-time player audit: players look for "a level of my own"); until then a
   card of Quick Edits. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
EZ.areas.push({
  id: "levels", title: "Filter levels", icon: "⇕", order: 22, group: "b",
  count: (e) => EZ.edits.countArea("levels", e),
  render(box, app) {
    const {h} = EZ.ui;
    const F = EZ.filter, R = EZ.render;
    const e = EZ.store.current().edits;
    const lines = app.versionLines();
    const found = F.levels(lines);
    const lv = e.levels || {};
    const colorChoices = [["", "its own colors"], ["0", "White"], ["4", "Gold"], ["2", "Green"], ["3", "Blue"],
      ["9", "Yellow"], ["8", "Orange"], ["1", "Red"], [";", "Purple"], ["7", "Tan"], ["5", "Gray"], [")", "Cyan"]];
    const levelRows = found.map((l, k) => {
      const n = k + 1;
      const name = lv.names && lv.names[n] !== undefined ? lv.names[n] : l.text;
      const plainName = R.plain(name);
      const own = /^ÿc(.)/.exec(name);
      const input = h("input", {type: "text", value: plainName, "aria-label": `Level ${n}'s name`});
      const color = h("select", {"aria-label": `Level ${n}'s color`},
        colorChoices.map(([c, t]) => h("option", {value: c, selected: lv.names && lv.names[n] !== undefined &&
          own && own[1] === c && /^ÿc.[^ÿ]*$/.test(name)}, t)));
      const saveName = () => EZ.store.change((ed) => {
        ed.levels = ed.levels || {};
        ed.levels.names = ed.levels.names || {};
        const text = input.value.trim();
        if (!text || (!color.value && text === R.plain(l.text))) delete ed.levels.names[n];
        else ed.levels.names[n] = color.value ? "ÿc" + color.value + text : (text === R.plain(l.text) ? l.text : text);
      }, {label: `level ${n}'s name`});
      input.addEventListener("change", saveName);
      color.addEventListener("change", saveName);
      const like = h("select", {"aria-label": `Level ${n} behaves like`, onchange: (ev) => EZ.store.change((ed) => {
        ed.levels = ed.levels || {};
        ed.levels.copies = ed.levels.copies || {};
        if (+ev.target.value === n) delete ed.levels.copies[n];
        else ed.levels.copies[n] = +ev.target.value;
      }, {label: `level ${n}`})},
        found.map((x, kk) => h("option", {value: kk + 1, selected: (lv.copies && lv.copies[n] ? lv.copies[n] : n) === kk + 1},
          kk + 1 === n ? "itself" : `level ${kk + 1}: ${R.plain(x.text)}`)));
      const renamed = lv.names && lv.names[n] !== undefined, copied = lv.copies && lv.copies[n];
      const reset = renamed || copied ? h("button.fe-btn.ghost.small", {type: "button",
        "aria-label": `Level ${n}: back to Erazure's`, onclick: () => EZ.store.change((ed) => {
          if (ed.levels && ed.levels.names) delete ed.levels.names[n];
          if (ed.levels && ed.levels.copies) delete ed.levels.copies[n];
        }, {label: `level ${n}`})}, "Erazure's default") : null;
      return h("div.fe-levelrow" + (renamed || copied ? ".is-changed" : ""),
        h("span.fe-num", String(n)),
        h("div.fe-levelrow-body",
          h("div.fe-row", {style: {gap: ".5em"}}, R.levelName(name), reset,
            renamed ? h("div.fe-sub.fe-small", {style: {flexBasis: "100%"}}, "Erazure: ", R.levelName(l.text)) : null),
          // a level made to behave like another keeps Erazure's name until it gets one of its own
          copied && !renamed ? h("p.fe-note.warn.fe-small", {style: {margin: 0}}, `It behaves like level ${copied} ` +
            `now, but still shows Erazure's name for level ${n}: give it a name of your own.`) : null,
          h("div.fe-levelrow-fields",
            h("label.fe-levelrow-name", h("span.fe-bd-label", "Name"), input),
            h("label", h("span.fe-bd-label", "Color"), color),
            h("label.fe-levelrow-like", h("span.fe-bd-label", "Behaves like"), like))));
    });
    const items = (text) => h("a", {href: "#items", onclick: (ev) => { ev.preventDefault(); app.go("items"); }}, text);
    const page = EZ.edits.SITE.replace(/editor\/$/, "filter-levels/");
    box.append(
      h("div.fe-area-head", h("div", h("h2", "Filter levels"),
        h("p.fe-sub", "Rename a level, or make a level of your own: a level that behaves like another, which you then " +
          "change on its own. The game reads 12 levels; level 0 always shows everything. What each of Erazure's " +
          "levels shows, hides and alerts is on the website's ",
          h("a", {href: page, target: "_blank", rel: "noopener"}, "Filter Levels"), " page."))),
      h("section.fe-card", {id: "fe-own-level"},
        h("h3", "A level of your own"),
        h("ol.fe-steps.fe-small",
          h("li", "Pick a level you don't play on, such as 11."),
          h("li", "Set its Behaves like to the level closest to what you want, such as 8: it replaces Erazure's " +
            "level 11 in your file."),
          h("li", "Give it a name of your own, so you know it in game."),
          h("li", "Change it on its own in ", items("Items"), ": pick its filter level in a change there."))),
      h("section.fe-card", {id: "fe-levels"},
        h("h3", "The levels"),
        h("div.fe-levelrows", levelRows)));
    if (app.sub) {
      const el = box.querySelector("#fe-" + app.sub);
      if (el) el.scrollIntoView();
    }
  },
});
