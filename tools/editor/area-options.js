/* Quick Edits (until 2026-11-12 "Options"; the author: a name that says these are quick, simple, high-level edits):
   Erazure's own player options (050), each group beside sample items drawn as the game draws them with the player's
   choices (the author: "Show Rare Ethereal Druid Pelts" draws an Eth Blood Spirit, its Hide draws nothing), and the
   filter levels (their names, and a level made to behave like another so it can be tuned on its own). Erazure's
   features (tags and description lines to switch off) have their own area (area-features.js). */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
(function () {
  "use strict";
  let sampleLevel = null;  // the filter level the samples are drawn at (the preview's at first)
  const QUAL_WORD = {NORM: "Non-magical", SUP: "Superior", INF: "Low quality", MAG: "Magic", RARE: "Rare",
                     CRAFT: "Crafted", SET: "Set", UNI: "Unique"};
  const CLASS_NAME = ["Amazon", "Sorceress", "Necromancer", "Paladin", "Barbarian", "Druid", "Assassin"];
  const cache = {key: null, samples: new Map()};

  /* The sample items of an option group: [{spec, levels, cls, clvl}] (at most 6, one per kind of item its rules are
     for). */
  function samplesOf(g, lines, aliases) {
    if (cache.key !== lines) { cache.key = lines; cache.samples = new Map(); }
    if (cache.samples.has(g.title)) return cache.samples.get(g.title);
    const out = [], seen = new Set();
    for (const o of g.options) {
      const picks = o.lines.length > 1 ? [o.lines[0], o.lines[o.lines.length - 1]] : o.lines;
      for (const i of picks) {
        const r = EZ.filter.rule(lines[i].replace(/^\s*\/\/+\s*/, ""));
        if (!r) continue;
        let s = null;
        try { s = EZ.overrides.sampleOf(r.cond, {aliases}); } catch (e) { s = null; }
        if (!s) continue;
        const key = JSON.stringify(s);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(s);
        if (out.length >= 6) break;
      }
      if (out.length >= 6) break;
    }
    cache.samples.set(g.title, out);
    return out;
  }

  /* The filter levels an option changes its items on (the author's audit, 2026-11-12: a switch whose samples show no
     change read as broken): each of its sample items with the option's lines alone after Erazure's aliases, against
     Erazure's filter, at levels 1-12. Worked out a group at a time after the area is drawn, kept per version. */
  const levelCache = {key: null, map: new Map(), aliasLines: null};
  function changedLevels(app, o, lines, aliases, z) {
    if (levelCache.key !== lines) {
      levelCache.key = lines;
      levelCache.map = new Map();
      levelCache.aliasLines = lines.filter((l) => /^(Alias|Formula)\[/.test(l));
    }
    if (levelCache.map.has(o.id)) return levelCache.map.get(o.id);
    const P = EZ.preview, cat = EZ.items.catalog();
    const own = o.lines.map((i) => EZ.edits.groundOnly(lines[i].replace(/^\s*\/\/+\s*/, "")));
    const mini = levelCache.aliasLines.concat(own, ["ItemDisplay[]:%NAME%{%NAME%}"]);
    const F = EZ.engine.compile(mini, {statMax: cat.statMax, skillMax: cat.skillMax, soundCount: app.data.soundCount});
    const first = levelCache.aliasLines.length, last = first + own.length;  // the option's lines in mini
    const samples = [];
    for (const i of o.lines) {
      const r = EZ.filter.rule(lines[i].replace(/^\s*\/\/+\s*/, ""));
      let s = null;
      try { s = r ? EZ.overrides.sampleOf(r.cond, {aliases}) : null; } catch (e) { s = null; }
      if (s) samples.push(s);
    }
    const out = [];
    for (let lv = 1; lv <= 12; lv++) {
      const hit = samples.some((s) => {
        const ctx = Object.assign(P.ctx(lv), s.cls !== undefined ? {cls: s.cls} : {},
          s.clvl !== undefined ? {clvl: s.clvl, charstats: {12: s.clvl}} : {}, {mapid: 2});
        const it = EZ.items.make(Object.assign({place: "GROUND"}, s.spec));
        if (!it) return false;
        const mine = EZ.engine.run(F, it, ctx, P.state.opts);
        if (mine.stop === null || mine.stop < first || mine.stop >= last) return false;  // the option doesn't decide it
        const a = EZ.engine.run(z.F, it, ctx, P.state.opts);
        return a.hidden !== mine.hidden || (!mine.hidden && EZ.render.plain(a.name) !== EZ.render.plain(mine.name));
      });
      if (hit) out.push(lv);
    }
    levelCache.map.set(o.id, out);
    return out;
  }
  const runs = (list) => {
    const parts = [];
    for (let k = 0; k < list.length; k++) {
      let j = k;
      while (j + 1 < list.length && list[j + 1] === list[j] + 1) j++;
      parts.push(j > k ? list[k] + "-" + list[j] : String(list[k]));
      k = j;
    }
    return parts.join(", ");
  };

  /* A sample's words: "Rare ethereal Blood Spirit, item level 85". */
  function describe(s) {
    const b = EZ.items.base(s.spec.code);
    const name = b ? EZ.render.plain(b.name).split("\n")[0] : s.spec.code;
    const bits = [(s.spec.quality ? QUAL_WORD[s.spec.quality] + " " : "") + (s.spec.eth ? "ethereal " : "") + name];
    if (s.spec.sockets) bits.push(s.spec.sockets + " socket" + (s.spec.sockets === 1 ? "" : "s"));
    if (s.spec.stats) bits.push(s.spec.stats[0][2] + "% enhanced " + (s.spec.stats[0][0] === 16 ? "defense" : "damage"));
    if (b && (b.groups.indexOf("CHARM") >= 0 || s.spec.ilvl !== 85)) bits.push("item level " + s.spec.ilvl);
    if (s.cls !== undefined) bits.push("as " + CLASS_NAME[s.cls] + "s");
    return bits.join(", ");
  }

  EZ.areas.push({
    id: "quick", title: "Quick Edits", icon: "⚡︎", order: 20, group: "b",
    count: (e) => EZ.edits.countArea("options", e),
    render(box, app) {
      const {h, toggle} = EZ.ui;
      const F = EZ.filter, R = EZ.render, P = EZ.preview;
      const e = EZ.store.current().edits;
      const lines = app.versionLines();
      const sub = app.sub;
      const aliases = EZ.core.bhAliases(EZ.core.bhEntries(lines));
      const levelNames = F.levels(lines).map((l) => R.plain(l.text));
      if (sampleLevel === null) sampleLevel = P && P.state && P.state.filtlvl ? P.state.filtlvl : 12;
      const z = P && P.erazure ? P.erazure() : null, y = P && P.yours ? P.yours() || z : z;

      /* ---- one sample item, drawn with the player's choices (and what Erazure's own does, where it differs) */
      const outcome = (r) => JSON.stringify([r.name, r.hidden, r.icons.map((x) => [x.border, x.map, x.dot, x.px]), r.sound]);
      const drawn = (r) => r.hidden ? h("span.fe-pv-hidden", r.invisible ? "hidden: nothing shows" : "hidden: icon only") :
        R.label(r.name, {start: r.start});
      const sampleBox = (s) => {
        if (!z) return null;
        const lv = s.levels.length && s.levels.indexOf(sampleLevel) < 0 ? s.levels[s.levels.length - 1] : sampleLevel;
        const ctx = Object.assign(P.ctx(lv), s.cls !== undefined ? {cls: s.cls} : {},
          s.clvl !== undefined ? {clvl: s.clvl, charstats: {12: s.clvl}} : {});
        const it = EZ.items.make(Object.assign({place: "GROUND"}, s.spec));
        if (!it) return null;
        const a = EZ.engine.run(z.F, it, ctx, P.state.opts), b = EZ.engine.run(y.F, it, ctx, P.state.opts);
        const changed = outcome(a) !== outcome(b);
        return h("div.fe-optsample" + (changed ? ".is-changed" : ""),
          h("div.fe-optsample-label", drawn(b), b.icons.length && !b.invisible ? P.iconCanvas(b.icons, 2) : null),
          h("div.fe-sub.fe-small", describe(s) + (lv !== sampleLevel ? ` (level ${lv})` : "")),
          changed ? h("div.fe-sub.fe-small.fe-optsample-was", "Erazure's default: ", a.hidden ? (a.invisible ? "hidden" :
            "icon only") : R.label(a.name, {start: a.start})) : null);
      };

      /* ---- Erazure's options (050) */
      const groups = F.options(app.src, lines);
      const setOption = (o, on) => EZ.store.change((ed) => {
        ed.options = ed.options || {};
        for (const id of o.choice) delete ed.options[id];
        if (on) ed.options[o.id] = true;
      }, {label: o.label});
      const pending = [];  // [option, its "changes levels" note], filled once the area is drawn
      const levelsNote = (o) => {
        const span = h("small.fe-sub.fe-optlevels", "…");
        pending.push([o, span]);
        return span;
      };
      const optionRows = groups.map((g) => {
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
              radio("Erazure's default", !chosen, () => setOption(set[0], false)),
              set.map((x) => radio(x.label, chosen === x, () => setOption(x, true), levelsNote(x)))));
          } else {
            seen.add(o.id);
            rows.push(h("div", toggle(o.label, !!(e.options && e.options[o.id]), (on) => setOption(o, on)),
              levelsNote(o)));
          }
        }
        const rulesShown = h("details.fe-rules", h("summary", "The rules these switch on"),
          h("pre.fe-code", g.options.map((o) => o.lines.map((i) => lines[i].replace(/^\/\/+/, "")).join("\n")).join("\n")));
        const samples = samplesOf(g, lines, aliases).map(sampleBox).filter(Boolean);
        return h("div.fe-optrow",
          h("div.fe-optgroup", h("h4", g.title), h("div.fe-stack", rows), rulesShown),
          h("div.fe-optsamples", {"aria-label": g.title + ": how the items look"},
            samples.length ? samples : h("p.fe-sub.fe-small", "No sample item for these.")));
      });
      const levelPick = h("select", {"aria-label": "Draw the samples at filter level", onchange: (ev) => {
        sampleLevel = +ev.target.value;
        app.drawArea();
      }}, levelNames.map((n, k) => h("option", {value: k + 1, selected: sampleLevel === k + 1}, `${k + 1} · ${n}`)));

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
        return h("div.fe-levelrow" + (renamed || copied ? ".is-changed" : ""),
          h("span.fe-num", String(n)),
          h("div.fe-levelrow-body",
            h("div", R.levelName(name), renamed ? h("div.fe-sub.fe-small", "Erazure: ", R.levelName(l.text)) : null),
            h("div.fe-levelrow-fields",
              h("label.fe-levelrow-name", h("span.fe-bd-label", "Name"), input),
              h("label", h("span.fe-bd-label", "Color"), color),
              h("label.fe-levelrow-like", h("span.fe-bd-label", "Behaves like"), like))));
      });

      box.append(
        h("div.fe-area-head", h("div", h("h2", "Quick Edits"),
          h("p.fe-sub", "Simple switches for whole kinds of items: show or hide them in one click, each beside an item " +
            "drawn as the game will show it. And your filter levels' names."))),
        h("section.fe-card", {id: "fe-options"},
          h("div.fe-row", h("h3", {style: {margin: 0}}, "Show or hide kinds of items"), h("span.fe-bar-gap"),
            h("label.fe-row.fe-small", h("span.fe-sub", "Items drawn at filter level"), levelPick)),
          P && P.context ? P.context(() => app.drawArea(), {lead: "The items are drawn on the ground outside town for " +
            "a level"}) : null,
          h("p.fe-sub", "Erazure's own choices for potions, quivers, class items and more. Where two of them cover the " +
            "same item, the one higher in this list wins. Every hide is for the ground outside town, and takes the " +
            "items' minimap icons, chat lines and sounds away too: in town, your inventory and stash the items look " +
            "as always. Under each switch: the filter levels it changes (on the others Erazure already does it)."),
          groups.length ? h("div.fe-optrows", optionRows) : h("p.fe-empty", "This version has no options.")),
        h("section.fe-card", {id: "fe-levels"},
          h("h3", "Filter levels"),
          h("p.fe-sub", "Rename a level, or make it behave like another level: then tune it on its own (Items, Alerts) " +
            "and keep Erazure's levels as they are. The game reads 12 levels; level 0 always shows everything."),
          h("div.fe-levelrows", levelRows)));
      if (sub) {
        const el = box.querySelector("#fe-" + sub);
        if (el) el.scrollIntoView();
      }
      // the levels each switch changes: a few at a time, so the area shows at once
      if (z && pending.length) {
        let k = 0;
        const step = () => {
          const end = Math.min(pending.length, k + 4);
          for (; k < end; k++) {
            const [o, span] = pending[k];
            if (!span.isConnected) return;  // the area was drawn again
            let lv = [];
            try { lv = changedLevels(app, o, lines, aliases, z); } catch (err) { span.textContent = ""; continue; }
            span.textContent = lv.length === 12 ? "changes every level (1-12)" : lv.length ? "changes level" +
              (lv.length > 1 ? "s " : " ") + runs(lv) : "changes no level for these items (Erazure already does it)";
            if (!lv.length) span.classList.add("is-none");
          }
          if (k < pending.length) setTimeout(step, 0);
        };
        setTimeout(step, 0);
      }
    },
  });
})();
