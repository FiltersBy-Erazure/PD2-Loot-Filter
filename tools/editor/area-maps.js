/* Maps: Erazure's map lines on or off, a red warning on identified maps with the mods the player picks, hiding
   identified maps with a mod the player won't run, and the T1-T3 maps the player never picks up (EZ.maps). */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
(function () {
  "use strict";
  const {h, toggle} = EZ.ui;
  const GROUPS = [["map-mon-", "Monsters"], ["map-play-", "You"], ["map-glob-", "The map"], ["", "Other"]];

  EZ.areas.push({
    id: "maps", title: "Maps", icon: "⌖", order: 70, group: "b",
    count: (e) => EZ.edits.countArea("maps", e),
    render(box, app) {
      const e = EZ.store.current().edits;
      const m = e.maps || {};
      const warn = new Set(EZ.maps.ids(m.warn)), hide = new Set(EZ.maps.ids(m.hide));
      const change = (fn) => EZ.store.change((ed) => {
        ed.maps = Object.assign({warn: [], hide: []}, ed.maps || {});
        fn(ed.maps);
        ed.maps.warn = EZ.maps.ids(ed.maps.warn);
        ed.maps.hide = EZ.maps.ids(ed.maps.hide);
        ed.maps.hideMaps = EZ.maps.mapCodes(ed.maps.hideMaps);
        ed.maps.hideMapsLevels = EZ.maps.levelsOf(ed.maps.hideMapsLevels);
        delete ed.maps.minXp;  // the experience hide, until 2026-11-12
        for (const k of ["warn", "hide", "hideMaps", "hideMapsLevels"]) if (!ed.maps[k].length) delete ed.maps[k];
        if (!Object.keys(ed.maps).length) delete ed.maps;
      }, {label: "maps"});
      const flip = (key, sid, on) => change((x) => {
        x[key] = (x[key] || []).filter((s) => s !== sid);
        if (on) x[key].push(sid);
      });

      // Erazure's map lines: the features of the Maps group (the same switches as on Options)
      const feats = EZ.features.filter((f) => f.group === "Maps");
      const lines = h("section.fe-card", h("h3", "Erazure's map lines"),
        h("p.fe-sub", "The lines Erazure writes under an identified map's name. The same switches are on Options."),
        h("div.fe-stack", feats.map((f) => {
          const on = e.features && f.id in e.features ? !!e.features[f.id] : EZ.edits.featureDefault(f);
          return toggle(f.title, on, (v) => EZ.store.change((ed) => {
            ed.features = ed.features || {};
            if (v === EZ.edits.featureDefault(f)) delete ed.features[f.id]; else ed.features[f.id] = v;
          }, {label: f.title}), {sub: f.sub});
        })));

      // the mods
      const stats = (app.data.mapStats || []).map(([sid, prop, lo, hi]) => ({sid, prop, lo, hi, name: EZ.maps.name(sid)}));
      const groups = GROUPS.map(([pre, title]) => [title, stats.filter((s) => (pre ? s.prop.startsWith(pre) :
        !GROUPS.some(([p]) => p && s.prop.startsWith(p))))]).filter(([, list]) => list.length);
      const mods = h("section.fe-card", {id: "fe-map-mods"}, h("h3", "Map mods"),
        h("p.fe-sub", "Warn: a red line on identified maps that roll it. Hide: identified maps that roll it are hidden " +
          "on the ground outside town (no label, no icon); your inventory and stash still show them."),
        groups.map(([title, list]) => h("div", h("h4", title), h("div.fe-tablewrap", h("table.fe-levels",
          h("thead", h("tr", h("th", "Mod"), h("th", "Rolls"), h("th", "Warn"), h("th", "Hide"))),
          h("tbody", list.map((s) => h("tr" + (warn.has(s.sid) || hide.has(s.sid) ? ".is-changed" : ""),
            h("td", s.name), h("td.fe-sub.fe-small", s.lo === s.hi ? String(s.lo) : s.lo + " to " + s.hi),
            h("td", h("input", {type: "checkbox", checked: warn.has(s.sid), "aria-label": "Warn: " + s.name,
              onchange: (ev) => flip("warn", s.sid, ev.target.checked)})),
            h("td", h("input", {type: "checkbox", checked: hide.has(s.sid), "aria-label": "Hide: " + s.name,
              onchange: (ev) => flip("hide", s.sid, ev.target.checked)}))))))))));

      // the maps the player never picks up: their non-magical ones, on the ground outside town
      const skip = new Set(EZ.maps.mapCodes(m.hideMaps)), lv = EZ.maps.levelsOf(m.hideMapsLevels);
      const levelNames = EZ.filter.levels(app.versionLines()).map((l) => String(l.text).replace(/ÿc./g, "").trim());
      const tiers = EZ.maps.choices();
      const setMaps = (codes, on) => change((mm) => {
        const now = new Set(EZ.maps.mapCodes(mm.hideMaps));
        for (const c of codes) if (on) now.add(c); else now.delete(c);
        mm.hideMaps = [...now];
      });
      const skipCard = h("section.fe-card", {id: "fe-map-skip"}, h("h3", "Maps you don't pick up"),
        h("p.fe-sub", "Tick the maps you have no use for. Their non-magical maps (the ones monsters drop) are hidden on " +
          "the ground outside town: no label, no icon, no sound. In town, your inventory and your stash they show as " +
          "always. Magic, rare and unique maps are never hidden by this, nor T4 dungeons (made from rare T3 maps in " +
          "the cube, always identified and rare)."),
        h("div.fe-map-tiers", tiers.map(({tier, maps}) => {
          const all = maps.every((x) => skip.has(x.code));
          return h("div.fe-map-tier", h("div.fe-row", h("h4", {style: {margin: 0}}, "T" + tier + " maps"),
            h("span.fe-bar-gap"), h("button.fe-btn.ghost.small", {type: "button", onclick: () =>
              setMaps(maps.map((x) => x.code), !all)}, all ? "Untick all" : "Tick all")),
          h("ul.fe-map-list", maps.map((x) => h("li", h("label.fe-check" + (skip.has(x.code) ? ".is-on" : ""),
            h("input", {type: "checkbox", checked: skip.has(x.code), "aria-label": "Hide non-magical " + x.name + " maps",
              onchange: (ev) => setMaps([x.code], ev.target.checked)}),
            h("span", x.name), h("code.fe-small.fe-sub", x.code))))));
        })),
        h("div.fe-bd-field", {style: {marginTop: ".6em"}}, h("span.fe-bd-label", "On filter levels (none picked: every level)"),
          h("div.fe-row.fe-small", levelNames.map((n, i) => h("button.fe-chiptog", {type: "button", title: `${i + 1}: ${n}`,
            "aria-pressed": String(lv.indexOf(i + 1) >= 0), onclick: () => change((mm) => {
              const now = EZ.maps.levelsOf(mm.hideMapsLevels);
              const k = now.indexOf(i + 1);
              if (k >= 0) now.splice(k, 1); else now.push(i + 1);
              mm.hideMapsLevels = now;
            })}, String(i + 1))))),
        skip.size ? h("p.fe-sub.fe-small", `${skip.size} map${skip.size === 1 ? "" : "s"} hidden` + (lv.length ?
          " on level" + (lv.length === 1 ? " " : "s ") + lv.join(", ") : " on every level") + ".") : null);

      EZ.ui.add(box, [
        h("div.fe-area-head", h("div", h("h2", "Maps"),
          h("p.fe-sub", "Erazure's map lines, warnings for the mods you avoid, and maps you'd rather not see."))),
        lines, skipCard, mods]);
      if (app.sub && box.querySelector("#fe-" + app.sub)) box.querySelector("#fe-" + app.sub).scrollIntoView();
    },
  });
})();
