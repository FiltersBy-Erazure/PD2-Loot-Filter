/* Maps: Erazure's map lines on or off, a red warning on identified maps with the mods the player picks, and hiding
   identified maps with a mod the player won't run or a lower experience multiplier than the player asks for
   (EZ.maps). */
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
        if (!ed.maps.warn.length) delete ed.maps.warn;
        if (!ed.maps.hide.length) delete ed.maps.hide;
        if (EZ.maps.minXp(ed.maps) === null) delete ed.maps.minXp;
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

      // experience
      const x = EZ.maps.minXp(m);
      const input = h("input.fe-pv-num.wide", {type: "number", min: 0, max: 10, step: 0.1, value: x === null ? "" : x,
        placeholder: "e.g. 1.5", "aria-label": "Lowest experience multiplier",
        onchange: (ev) => change((mm) => { mm.minXp = ev.target.value; })});
      const site = "https://filtersby-erazure.github.io/PD2-Loot-Filter/resources/map-experience/";
      const xp = h("section.fe-card", {id: "fe-map-xp"}, h("h3", "Experience"),
        h("p.fe-sub", "Erazure tags identified T1-T4 maps with how much more experience their rolls give (", h("a",
          {href: site, target: "_blank", rel: "noopener"}, "Map Experience"), "). Hide the ones below:"),
        h("div.fe-row", h("span", "Hide identified maps below"), input, h("span", "× experience"),
          x !== null ? h("button.fe-btn.ghost.small", {type: "button", onclick: () => change((mm) => { delete mm.minXp; })},
            "Show them all") : null),
        h("p.fe-sub.fe-small", "Unique maps and maps that aren't identified are never hidden by this."));

      EZ.ui.add(box, [
        h("div.fe-area-head", h("div", h("h2", "Maps"),
          h("p.fe-sub", "Erazure's map lines, warnings for the mods you avoid, and maps you'd rather not see."))),
        lines, mods, xp]);
      if (app.sub && box.querySelector("#fe-" + app.sub)) box.querySelector("#fe-" + app.sub).scrollIntoView();
    },
  });
})();
