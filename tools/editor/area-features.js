/* Features: the parts of Erazure a player can switch off (tags, description lines, map lines...: EZ.features), an
   area of their own since 2026-11-12 (the author; until then a card of Options). Mostly what Erazure writes on and under
   names; a few switches (Grail looks, level 1's sockets, the sell tags on small items) change what shows too. */
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
    // a switch put back to Erazure's default follows Erazure again (as on Maps); one Erazure's own default came to
    // meet (a choice kept from before) can be let go with the button right after its title
    const row = (f) => {
      const def = EZ.edits.featureDefault(f);
      const pinned = e.features && f.id in e.features;
      const on = pinned ? !!e.features[f.id] : def;
      return h("div.fe-feature" + (on !== def ? ".is-changed" : ""),
        toggle(f.title, on, (v) => EZ.store.change((ed) => {
          ed.features = ed.features || {};
          if (v === def) delete ed.features[f.id]; else ed.features[f.id] = v;
          if (!Object.keys(ed.features).length) delete ed.features;
        }, {label: f.title}), {sub: f.sub}),
        pinned ? h("button.fe-btn.ghost.small", {type: "button", title: "Back to Erazure's default (today " +
          (def ? "on" : "off") + "), which follows Erazure's updates", onclick: () => EZ.store.change((ed) => {
          delete ed.features[f.id];
          if (!Object.keys(ed.features).length) delete ed.features;
        })}, "↺ Erazure's default") : null);
    };
    box.append(
      h("div.fe-area-head", h("div", h("h2", "Features"),
        h("p.fe-sub", "Switch off what you don't want to see. Most switches are tags and description lines only, so " +
          "what shows, hides and alerts stays Erazure's; the Grail and Strictness switches and the sell tags on small " +
          "items also change what shows. Erazure's map lines are on Maps too."))),
      h("section.fe-card", {id: "fe-features"},
        groups.map((g) => h("div.fe-featgroup", h("h4", g.title), h("div.fe-stack", g.list.map(row))))));
    if (app.sub) {
      const el = box.querySelector("#fe-" + app.sub);
      if (el) el.scrollIntoView();
    }
  },
});
