/* Features: the parts of Erazure a player can switch off (tags, description lines, map lines...: EZ.features), an
   area of their own since 2026-11-12 (the author; until then a card of Options). What shows, hides and alerts stays
   Erazure's. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
EZ.areas.push({
  id: "features", title: "Features", icon: "✦", order: 25, group: "b",
  count: (e) => EZ.edits.countArea("features", e),
  render(box, app) {
    const {h, toggle} = EZ.ui;
    const e = EZ.store.current().edits;
    const groups = [];
    for (const f of EZ.features) {
      let g = groups.find((x) => x.title === f.group);
      if (!g) groups.push(g = {title: f.group, list: []});
      g.list.push(f);
    }
    const row = (f) => {
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
    box.append(
      h("div.fe-area-head", h("div", h("h2", "Erazure's features"),
        h("p.fe-sub", "Switch off what you don't want to see: tags and description lines only, so what shows, hides " +
          "and alerts stays Erazure's. A switch you changed keeps your choice even when Erazure changes its own."))),
      h("section.fe-card", {id: "fe-features"},
        groups.map((g) => h("div.fe-featgroup", h("h4", g.title), h("div.fe-stack", g.list.map(row))))));
    if (app.sub) {
      const el = box.querySelector("#fe-" + app.sub);
      if (el) el.scrollIntoView();
    }
  },
});
