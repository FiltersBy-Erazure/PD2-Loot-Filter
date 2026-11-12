/* Options: Erazure's own player options (050), Erazure's features to switch off, and the filter levels (their names,
   and a level made to behave like another so it can be tuned on its own). */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
EZ.areas.push({
  id: "options", title: "Options", icon: "⚙", order: 20, group: "b",
  count: (e) => EZ.edits.countArea("options", e),
  render(box, app) {
    const {h, toggle, pill} = EZ.ui;
    const F = EZ.filter, R = EZ.render;
    const e = EZ.store.current().edits;
    const lines = app.versionLines();
    const sub = app.sub;

    /* ---- Erazure's options (050) */
    const groups = F.options(app.src, lines);
    const setOption = (o, on) => EZ.store.change((ed) => {
      ed.options = ed.options || {};
      for (const id of o.choice) delete ed.options[id];
      if (on) ed.options[o.id] = true;
    }, {label: o.label});
    const optionCards = groups.map((g) => {
      const seen = new Set(), rows = [];
      for (const o of g.options) {
        if (seen.has(o.id)) continue;
        if (o.choice.length > 1) {
          const set = g.options.filter((x) => o.choice.indexOf(x.id) >= 0);
          set.forEach((x) => seen.add(x.id));
          const name = "fe-opt-" + g.title.replace(/\W+/g, "") + rows.length;
          const chosen = set.find((x) => e.options && e.options[x.id]);
          const radio = (label, checked, onpick, extra) => h("label.fe-radio",
            h("input", {type: "radio", name, checked, onchange: onpick}), h("span", label), extra || null);
          rows.push(h("fieldset.fe-choiceset", h("legend.fe-sub", "Pick one"),
            radio("Erazure's own", !chosen, () => setOption(set[0], false), pill("default")),
            set.map((x) => radio(x.label, chosen === x, () => setOption(x, true)))));
        } else {
          seen.add(o.id);
          rows.push(toggle(o.label, !!(e.options && e.options[o.id]), (on) => setOption(o, on)));
        }
      }
      const rulesShown = h("details.fe-rules", h("summary", "The rules these switch on"),
        h("pre.fe-code", g.options.map((o) => o.lines.map((i) => lines[i].replace(/^\/\/+/, "")).join("\n")).join("\n")));
      return h("div.fe-optgroup", h("h4", g.title), h("div.fe-stack", rows), rulesShown);
    });

    /* ---- features */
    const fgroups = [];
    for (const f of EZ.features) {
      let g = fgroups.find((x) => x.title === f.group);
      if (!g) fgroups.push(g = {title: f.group, list: []});
      g.list.push(f);
    }
    const featureRow = (f) => {
      const def = EZ.edits.featureDefault(f);
      const pinned = e.features && f.id in e.features;
      const on = pinned ? !!e.features[f.id] : def;
      return h("div.fe-feature" + (on !== def ? ".is-changed" : ""),
        toggle(f.title, on, (v) => EZ.store.change((ed) => {
          ed.features = ed.features || {};
          ed.features[f.id] = v;
        }, {label: f.title}), {sub: f.sub}),
        pinned ? h("button.fe-btn.ghost.small", {type: "button", title: "Follow Erazure again (its own choice, today " +
          (def ? "on" : "off") + ")", onclick: () => EZ.store.change((ed) => { delete ed.features[f.id]; })},
          "↺ Follow Erazure") : null);
    };

    /* ---- filter levels */
    const found = F.levels(lines);
    const lv = e.levels || {};
    const colorChoices = [["", "its own colors"], ["0", "White"], ["4", "Gold"], ["2", "Green"], ["3", "Blue"],
      ["9", "Yellow"], ["8", "Orange"], ["1", "Red"], [";", "Purple"], ["7", "Tan"], ["5", "Gray"], [")", "Cyan"]];
    const levelRows = found.map((l, k) => {
      const n = k + 1;
      const name = lv.names && lv.names[n] !== undefined ? lv.names[n] : l.text;
      const plainName = R.plain(name);
      const own = /^ÿc(.)/.exec(name);
      const input = h("input", {type: "text", value: plainName, "aria-label": `Level ${n}'s name`,
        style: {width: "100%"}});
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
      return h("tr",
        h("td.fe-num", String(n)),
        h("td", R.levelName(name), lv.names && lv.names[n] !== undefined ? h("div.fe-sub", "Erazure: ", R.levelName(l.text)) : null),
        h("td", h("div.fe-row", {style: {flexWrap: "nowrap"}}, input, color)),
        h("td", like));
    });

    box.append(
      h("div.fe-area-head", h("div", h("h2", "Options"),
        h("p.fe-sub", "Erazure's own choices, the parts of Erazure you can switch off, and the filter levels."))),
      h("section.fe-card", {id: "fe-options"},
        h("h3", "Erazure's options"),
        h("p.fe-sub", "Erazure's own choices for potions, quivers, class items and more. Where two options cover the " +
          "same item, the one higher in this list wins."),
        groups.length ? h("div.fe-optgrid", optionCards) : h("p.fe-empty", "This version has no options.")),
      h("section.fe-card", {id: "fe-features"},
        h("h3", "Erazure's features"),
        h("p.fe-sub", "Switch off what you don't want to see. Tags and description lines only: what shows, hides and " +
          "notifies stays Erazure's. A switch you changed keeps your choice even when Erazure changes its own."),
        fgroups.map((g) => h("div.fe-featgroup", h("h4", g.title), h("div.fe-stack", g.list.map(featureRow))))),
      h("section.fe-card", {id: "fe-levels"},
        h("h3", "Filter levels"),
        h("p.fe-sub", "Rename a level, or make it behave like another level: then tune it on its own (Items, Alerts) " +
          "and keep Erazure's levels as they are. BH reads 12 levels; level 0 always shows everything."),
        h("div.fe-tablewrap", h("table.fe-levels",
          h("thead", h("tr", h("th", "#"), h("th", "Shows as"), h("th", "Name and color"), h("th", "Behaves like"))),
          h("tbody", levelRows)))));
    if (sub) {
      const el = box.querySelector("#fe-" + sub);
      if (el) el.scrollIntoView();
    }
  },
});
