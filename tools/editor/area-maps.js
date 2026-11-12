/* Maps: Erazure's map lines on or off, the T1-T3 maps the player never picks up (EZ.maps), a red warning on identified
   maps with the mods the player picks, hiding identified maps with a mod the player won't run, and a gold line for the
   bonuses the player looks for. */
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
      const warn = new Set(EZ.maps.ids(m.warn)), hide = new Set(EZ.maps.ids(m.hide)), mark = new Set(EZ.maps.ids(m.mark));
      const change = (fn) => EZ.store.change((ed) => {
        ed.maps = Object.assign({warn: [], hide: [], mark: []}, ed.maps || {});
        fn(ed.maps);
        ed.maps.warn = EZ.maps.ids(ed.maps.warn);
        ed.maps.hide = EZ.maps.ids(ed.maps.hide);
        ed.maps.mark = EZ.maps.ids(ed.maps.mark);
        ed.maps.hideMaps = EZ.maps.mapCodes(ed.maps.hideMaps);
        ed.maps.hideMapsLevels = EZ.maps.levelsOf(ed.maps.hideMapsLevels);
        delete ed.maps.minXp;  // the experience hide, until 2026-11-12
        for (const k of ["warn", "hide", "mark", "hideMaps", "hideMapsLevels"]) if (!ed.maps[k].length) delete ed.maps[k];
        if (!Object.keys(ed.maps).length) delete ed.maps;
      }, {label: "maps"});
      const flip = (key, sid, on) => change((x) => {
        x[key] = (x[key] || []).filter((s) => s !== sid);
        if (on) x[key].push(sid);
      });

      // Erazure's map lines: the features of the Maps group (the same switches as on Features, handled alike: a
      // switch put back to Erazure's default follows Erazure again)
      const feats = EZ.features.filter((f) => f.group === "Maps");
      const lines = h("section.fe-card", {id: "fe-map-lines"}, h("h3", "Erazure's map lines"),
        h("p.fe-sub", "The lines Erazure writes under an identified map's name. The same switches are on Features."),
        h("div.fe-stack", feats.map((f) => {
          const def = EZ.edits.featureDefault(f);
          const pinned = e.features && f.id in e.features;
          const on = pinned ? !!e.features[f.id] : def;
          const offN = EZ.edits.partsOff(e.featureParts, f).length;
          return h("div.fe-feature" + (on !== def || (on && offN) ? ".is-changed" : ""), toggle(f.title, on, (v) => EZ.store.change((ed) => {
            ed.features = ed.features || {};
            if (v === def) delete ed.features[f.id]; else ed.features[f.id] = v;
            if (!Object.keys(ed.features).length) delete ed.features;
          }, {label: f.title}), {sub: f.sub}),
          pinned ? h("button.fe-btn.ghost.small", {type: "button", title: "Back to Erazure's default (today " +
            (def ? "on" : "off") + "), which follows Erazure's updates", onclick: () => EZ.store.change((ed) => {
            delete ed.features[f.id];
            if (!Object.keys(ed.features).length) delete ed.features;
          })}, "↺ Erazure's default") : null,
          f.parts ? h("div.fe-featmore.fe-small", h("a", {href: "#features/feat-" + f.id, onclick: (ev) => {
            ev.preventDefault(); app.go("features", "feat-" + f.id); }}, "Choose its parts on Features" +
            (offN ? ` (${offN} switched off)` : ""))) : null);
        })));

      // the mods: the bonuses (good for the player, and most maps roll one) take a gold line only; every other mod a
      // red warning line or a hide. One table layout for all, so the columns line up from group to group.
      // (a stat that rolls lower on some maps and higher on others has a line for each side: its lower one is warned
      // of, its higher one marked)
      const stats = (app.data.mapStats || []).map(([sid, prop, lo, hi]) => {
        const side = EZ.maps.mixed(sid) ? (Math.max(lo, hi) < 0 ? -1 : 1) : 0;
        return {sid, prop, lo, hi, side, name: EZ.maps.name(sid, side)};
      });
      const isBonus = (s) => s.side ? s.side > 0 : EZ.maps.BONUS.has(s.sid);
      const bonus = stats.filter(isBonus), rest = stats.filter((s) => !isBonus(s));
      const groups = GROUPS.map(([pre, title]) => [title, rest.filter((s) => (pre ? s.prop.startsWith(pre) :
        !GROUPS.some(([p]) => p && s.prop.startsWith(p))))]).filter(([, list]) => list.length);
      const rolls = (s) => !EZ.maps.hasValue(s.sid) ? "" : s.lo === s.hi ? String(Math.abs(s.lo)) :
        Math.min(Math.abs(s.lo), Math.abs(s.hi)) + " to " + Math.max(Math.abs(s.lo), Math.abs(s.hi));
      // a check box filling its cell (the whole cell takes the click)
      const box2 = (key, s, set, label) => h("td.fe-mapcheck", h("label", h("input", {type: "checkbox", checked: set.has(s.sid),
        "aria-label": label + ": " + s.name, onchange: (ev) => flip(key, s.sid, ev.target.checked)})));
      const table = (list, cols) => h("div.fe-tablewrap", h("table.fe-levels.fe-maptable",
        h("colgroup", h("col"), h("col.fe-mapcol-rolls"), cols.map(() => h("col.fe-mapcol-box"))),
        h("thead", h("tr", h("th", "Mod"), h("th", "Rolls"), cols.map(([, t]) => h("th", t)))),
        h("tbody", list.map((s) => h("tr" + (cols.some(([k]) => (k === "warn" ? warn : k === "hide" ? hide : mark).has(s.sid)) ?
          ".is-changed" : ""), h("td", s.name), h("td.fe-sub.fe-small", rolls(s)),
          cols.map(([k, t]) => box2(k, s, k === "warn" ? warn : k === "hide" ? hide : mark, t)))))));
      const mods = h("section.fe-card", {id: "fe-map-mods"}, h("h3", "Map mods"),
        h("p.fe-sub", "Warn: a red line under the map's name when you hover over an identified map that rolls it. " +
          "Hide: identified maps that roll it are hidden on the ground outside town (no label, no icon); your " +
          "inventory and stash still show them."),
        groups.map(([title, list]) => h("div", h("h4", title), table(list, [["warn", "Warn"], ["hide", "Hide"]]))),
        bonus.length ? h("div", h("h4", "Bonuses"),
          h("p.fe-sub.fe-small", "Good for you, and most maps roll one of them, so they take no warning or hide. Mark: a " +
            "gold line under the map's name, to spot the ones you look for."),
          table(bonus, [["mark", "Mark"]])) : null);

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
              setMaps(maps.map((x) => x.code), !all)}, all ? "Clear T" + tier : "Select all T" + tier)),
          h("ul.fe-map-list", maps.map((x) => h("li", h("label.fe-check" + (skip.has(x.code) ? ".is-on" : ""),
            {title: "Item code " + x.code},
            h("input", {type: "checkbox", checked: skip.has(x.code), "aria-label": "Hide non-magical " + x.name + " maps",
              onchange: (ev) => setMaps([x.code], ev.target.checked)}),
            h("span", x.name))))));
        })),
        h("div.fe-bd-field", {style: {marginTop: ".6em"}}, h("span.fe-bd-label", "On filter levels (none picked: every level)"),
          h("div.fe-row.fe-small", {role: "group", "aria-label": "Filter levels"}, levelNames.map((n, i) =>
            h("button.fe-chiptog", {type: "button", title: `${i + 1}: ${n}`, "aria-label": `Filter level ${i + 1}: ${n}`,
              "aria-pressed": String(lv.indexOf(i + 1) >= 0), onclick: () => change((mm) => {
                const now = EZ.maps.levelsOf(mm.hideMapsLevels);
                const k = now.indexOf(i + 1);
                if (k >= 0) now.splice(k, 1); else now.push(i + 1);
                mm.hideMapsLevels = now;
              })}, String(i + 1)))),
          h("span.fe-sub.fe-small", lv.length ? "Picked: " + lv.map((n) => n + " · " + (levelNames[n - 1] || "")).join("; ")
            : "Every filter level (0 always shows everything).")),
        skip.size ? h("p.fe-sub.fe-small", `${skip.size} map${skip.size === 1 ? "" : "s"} hidden` + (lv.length ?
          " on filter level" + (lv.length === 1 ? " " : "s ") + lv.join(", ") : " on every filter level") + ".") : null);

      EZ.ui.add(box, [
        h("div.fe-area-head", h("div", h("h2", "Maps"),
          h("p.fe-sub", "Erazure's map lines, maps you'd rather not see, and lines for the mods you avoid or look for."))),
        lines, skipCard, mods]);
      if (app.sub && box.querySelector("#fe-" + app.sub)) box.querySelector("#fe-" + app.sub).scrollIntoView();
    },
  });
})();
