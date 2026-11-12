/* Wishlists: the identified items a player wants, by kind, quality and stats (each one must have, and "N of these"),
   tagged with a description line (and a label tag, an icon and a sound if the player likes). EZ.wishlists writes
   the rules. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
(function () {
  "use strict";
  const {h, fill, pill, seg} = EZ.ui;
  let draft = null;

  const JEWELRY = [["rin", "Rings"], ["amu", "Amulets"], ["jew", "Jewels"], ["cm1", "Small charms"],
                   ["cm2", "Large charms"], ["cm3", "Grand charms"]];
  const EXAMPLES = [
    ["Caster amulet", {name: "Caster amulet", codes: ["amu"], quals: ["RARE", "CRAFT"], need: [
      {kind: "word", word: "FCR", op: "min", a: "10"}], pool: [
      {kind: "word", word: "LIFE", op: "min", a: "40"}, {kind: "word", word: "STR", op: "min", a: "15"},
      {kind: "word", word: "DEX", op: "min", a: "15"}, {kind: "word", word: "RES", op: "min", a: "15"},
      {kind: "word", word: "MANA", op: "min", a: "60"}], n: "2", line: "Caster amulet", color: "GREEN"}],
    ["Fast boots", {name: "Fast boots", groups: ["BOOTS"], quals: ["RARE", "CRAFT", "MAG"], need: [
      {kind: "word", word: "FRW", op: "min", a: "30"}], pool: [
      {kind: "word", word: "FRES", op: "min", a: "25"}, {kind: "word", word: "LRES", op: "min", a: "25"},
      {kind: "word", word: "CRES", op: "min", a: "25"}, {kind: "word", word: "DEX", op: "min", a: "5"},
      {kind: "word", word: "MFIND", op: "min", a: "20"}], n: "2", line: "Fast boots", color: "GREEN"}],
    ["Lightning skiller", {name: "Lightning skiller", codes: ["cm3"], quals: ["MAG"], need: [
      {kind: "TABSK", n: "9", op: "min", a: "1"}, {kind: "word", word: "LIFE", op: "min", a: "35"}], pool: [], n: "1",
      line: "Lightning skiller with life", color: "ORANGE", tag: "GC"}],
  ];

  const blank = () => ({name: "", codes: [], groups: [], quals: ["RARE", "CRAFT"], need: [], pool: [], n: "1",
                        line: "", color: "GREEN", tag: "", alert: {icon: {}, sound: 0, chat: "all"}});

  function rows(app, list, set, label, note) {
    const RA = EZ.rulesArea, cat = EZ.items.catalog();
    const skills = [...cat.skills.values()].filter((s) => RA.CLASS_INDEX[s.cls] !== undefined)
      .sort((a, b) => RA.CLASS_INDEX[a.cls] - RA.CLASS_INDEX[b.cls] || a.name.localeCompare(b.name));
    const box = h("div.fe-stack");
    list.forEach((s, k) => {
      const kind = h("select", {"aria-label": "Kind of stat", onchange: (e) => set(() => {
        list[k] = {kind: e.target.value, word: "", n: "", op: s.op || "min", a: s.a, b: s.b};
      })}, RA.STAT_KINDS.map(([v, t]) => h("option", {value: v, selected: s.kind === v}, t)));
      let what;
      if (s.kind === "word") {
        what = h("select", {"aria-label": "Stat", onchange: (e) => set(() => { s.word = e.target.value; }, true)},
          h("option", {value: ""}, "Pick a stat"), RA.STAT_WORDS.map(([v, t]) => h("option", {value: v, selected: s.word === v}, t)));
      } else if (s.kind === "STAT") {
        what = h("input.fe-pv-num", {type: "number", min: 0, value: s.n, placeholder: "id", "aria-label": "Stat number",
          onchange: (e) => set(() => { s.n = e.target.value; }, true)});
      } else if (s.kind === "CLSK") {
        what = h("select", {"aria-label": "Class", onchange: (e) => set(() => { s.n = e.target.value; }, true)},
          h("option", {value: ""}, "Pick a class"), RA.CLASS_NAMES.map((c, i) => h("option", {value: String(i),
            selected: String(s.n) === String(i)}, c)));
      } else if (s.kind === "TABSK") {
        what = h("select", {"aria-label": "Skill tab", onchange: (e) => set(() => { s.n = e.target.value; }, true)},
          h("option", {value: ""}, "Pick a skill tab"), RA.TABS.map(([i, t]) => h("option", {value: String(i),
            selected: String(s.n) === String(i)}, t)));
      } else {
        what = h("select", {"aria-label": "Skill", onchange: (e) => set(() => { s.n = e.target.value; }, true)},
          h("option", {value: ""}, "Pick a skill"), RA.CLASS_NAMES.map((c, ci) => h("optgroup", {label: c},
            skills.filter((x) => RA.CLASS_INDEX[x.cls] === ci).map((x) => h("option", {value: String(x.id),
              selected: String(s.n) === String(x.id)}, x.name)))));
      }
      box.appendChild(h("div.fe-row.fe-small.fe-bd-stat", kind, what,
        h("select", {"aria-label": "Compare", onchange: (e) => set(() => { s.op = e.target.value; })},
          RA.OPS.map(([v, t]) => h("option", {value: v, selected: (s.op || "min") === v}, t))),
        h("input.fe-pv-num", {type: "number", value: s.a, "aria-label": "Value", onchange: (e) => set(() => { s.a = e.target.value; }, true)}),
        s.op === "between" ? [h("span", "and"), h("input.fe-pv-num", {type: "number", value: s.b, "aria-label": "Second value",
          onchange: (e) => set(() => { s.b = e.target.value; }, true)})] : null,
        h("button.fe-x", {type: "button", "aria-label": "Remove this stat", onclick: () => set(() => { list.splice(k, 1); })}, "✕")));
    });
    return h("div.fe-bd-field.wide", h("span.fe-bd-label", label), box,
      h("div.fe-row.fe-small", h("button.fe-btn.small", {type: "button", onclick: () => set(() => {
        list.push({kind: "word", word: "", n: "", op: "min", a: "", b: ""});
      })}, "+ Add a stat"), note ? h("span.fe-sub", note) : null));
  }

  function editor(app, box) {
    const d = draft, RA = EZ.rulesArea;
    const redraw = () => editor(app, box);
    const set = (fn, quiet) => { fn(d); if (quiet) drawResult(); else redraw(); };
    const flip = (arr, v) => { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); };
    const result = h("div.fe-bd-result");
    const drawResult = () => {
      const r = EZ.wishlists.rule(d);
      if (!r) { fill(result, h("p.fe-sub", "Pick a kind of item or a stat: a wishlist with neither would tag every item.")); return; }
      const ls = r.line.split("\n");
      const ctx = EZ.lint.context(app.src, app.versionLines(), {top: ls, bottom: []}, {soundCount: app.data.soundCount});
      const findings = EZ.lint.lines(ls, Object.assign(ctx, {block: "top"})).filter((f) => f.level !== "info");
      fill(result, ls.map((l) => h("code.fe-bd-line", l)),
        findings.length ? h("ul.fe-ed-lint", findings.map((f) => h("li.fe-ed-finding." + f.level, pill(f.level === "error" ?
          "error" : "check", f.level === "error" ? "bad" : "warn"), h("span", f.text)))) : null,
        h("div.fe-row", h("button.fe-btn.primary", {type: "button", onclick: () => {
          const w = JSON.parse(JSON.stringify(d));
          w.id = w.id || "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
          draft = null;
          EZ.store.change((ed) => {
            ed.wishlists = (ed.wishlists || []).filter((x) => x.id !== w.id);
            ed.wishlists.push(w);
          }, {label: "wishlists"});
        }}, d.id ? "Keep the wishlist" : "Add the wishlist"),
          h("button.fe-btn.ghost", {type: "button", onclick: () => { draft = null; app.drawArea(); }}, "Cancel")));
    };
    const palette = app.data.palette || [];
    const layers = d.alert.icon || {};
    const combo = EZ.rules.LAYERS.filter((k) => layers[k]).map((k) => k + "-" + layers[k]).join(" ");
    fill(box,
      h("h3", d.id ? "Change the wishlist" : "A new wishlist"),
      h("fieldset.fe-bd-set", h("legend", "Which items"),
        h("label.fe-bd-field.wide", h("span.fe-bd-label", "Its name (for you)"), h("input", {type: "text", value: d.name,
          oninput: (e) => set(() => { d.name = e.target.value; }, true)})),
        h("div.fe-bd-field.wide", h("span.fe-bd-label", "Kinds of items (any of these)"), h("div.fe-row.fe-small",
          JEWELRY.map(([c, t]) => h("button.fe-chiptog", {type: "button", "aria-pressed": String(d.codes.indexOf(c) >= 0),
            onclick: () => set(() => flip(d.codes, c))}, t)),
          RA.GROUPS.filter(([g]) => g !== "Other").flatMap(([, list]) => list).map(([g, t]) => h("button.fe-chiptog",
            {type: "button", "aria-pressed": String(d.groups.indexOf(g) >= 0), onclick: () => set(() => flip(d.groups, g))},
            t.replace(/ \(.*\)$/, ""))))),
        h("div.fe-bd-field.wide", h("span.fe-bd-label", "Quality"), h("div.fe-row.fe-small",
          [["MAG", "Magic"], ["RARE", "Rare"], ["CRAFT", "Crafted"], ["UNI", "Unique"], ["SET", "Set"]].map(([q, t]) =>
            h("button.fe-chiptog", {type: "button", "aria-pressed": String(d.quals.indexOf(q) >= 0),
              onclick: () => set(() => flip(d.quals, q))}, t)))),
        rows(app, d.need, set, "Stats it must have (all of these)"),
        rows(app, d.pool, set, "And some of these", "Stats show once the item is identified."),
        d.pool.length ? h("div.fe-bd-field", h("span.fe-bd-label", "How many of them"), h("input.fe-pv-num", {type: "number",
          min: 1, max: d.pool.length, value: d.n, "aria-label": "How many of them", onchange: (e) => set(() => { d.n = e.target.value; }, true)})) : null),
      h("fieldset.fe-bd-set", h("legend", "What it gets"),
        h("label.fe-bd-field", h("span.fe-bd-label", "A line in its description"), h("input", {type: "text", value: d.line,
          placeholder: d.name || "Wishlist", oninput: (e) => set(() => { d.line = e.target.value; }, true)})),
        h("div.fe-bd-field", h("span.fe-bd-label", "Its color"), h("select", {"aria-label": "Its color", onchange: (e) =>
          set(() => { d.color = e.target.value; })}, EZ.wishlists.COLORS.map((c) => h("option", {value: c, selected: d.color === c},
          c.charAt(0) + c.slice(1).toLowerCase().replace("_", " "))))),
        h("label.fe-bd-field", h("span.fe-bd-label", "A tag before its name (optional)"), h("input", {type: "text",
          value: d.tag || "", placeholder: "e.g. WL", oninput: (e) => set(() => { d.tag = e.target.value; }, true)})),
        h("div.fe-bd-field.wide", h("span.fe-bd-label", "An icon and a sound (optional)"), h("div.fe-row.fe-small",
          EZ.looks.icon(combo, palette, 3), EZ.rules.LAYERS.map((l) => {
            const b = h("button.fe-layer", {type: "button"}, h("span.fe-layerbox", {style: {background: layers[l] ?
              palette[parseInt(layers[l], 16)] : "transparent"}}), l === "BORDER" ? "Border" : l === "MAP" ? "Map" :
              l === "DOT" ? "Dot" : "Pixel");
            b.addEventListener("click", () => EZ.looks.palettePicker(b, palette, layers[l], (col) => set(() => {
              d.alert.icon = Object.assign({}, d.alert.icon);
              if (col === null) delete d.alert.icon[l]; else d.alert.icon[l] = col;
            }), true));
            return b;
          }),
          h("button.fe-btn.small", {type: "button", onclick: () => EZ.sounds.pick(app,
            Object.keys(EZ.filter.notifications(app.versionLines()).sounds).map(Number), d.alert.sound,
            (id) => set(() => { d.alert.sound = id; }))}, d.alert.sound ? "♪ " + EZ.sounds.name(app.data, d.alert.sound) :
            "Pick a sound"), d.alert.sound ? EZ.sounds.play(app.data, d.alert.sound) : null))),
      result);
    drawResult();
  }

  EZ.areas.push({
    id: "wishlists", title: "Wishlists", icon: "★", order: 60, group: "b",
    count: (e) => EZ.edits.countArea("wishlists", e),
    render(box, app) {
      const e = EZ.store.current().edits;
      const list = (e.wishlists || []).filter(EZ.wishlists.valid);
      const card = h("section.fe-card", {id: "fe-wish-edit"});
      if (draft) editor(app, card);
      EZ.ui.add(box, [
        h("div.fe-area-head", h("div", h("h2", "Wishlists"),
          h("p.fe-sub", "The identified items you want: by kind, quality and stats. Each gets a line in its description " +
            "(and a tag, an icon or a sound if you like) wherever it is: on the ground, in your inventory, stash or a " +
            "shop. Erazure's looks and tags stay."))),
        draft ? card : h("section.fe-card", h("div.fe-row",
          h("button.fe-btn.primary", {type: "button", onclick: () => { draft = blank(); app.drawArea(); }}, "+ A new wishlist"),
          h("span.fe-sub", "or start from:"),
          EXAMPLES.map(([t, w]) => h("button.fe-btn.small", {type: "button", onclick: () => {
            draft = Object.assign(blank(), JSON.parse(JSON.stringify(w)));
            app.drawArea();
          }}, t)))),
        list.length ? h("section.fe-card", h("h3", "Your wishlists"), list.map((w) => {
          const r = EZ.wishlists.rule(w);
          return h("div.fe-rb-op", h("div.fe-row.fe-small", h("b", w.name || w.line || "Wishlist"),
            r ? null : pill("tags nothing yet", "warn"), h("span.fe-bar-gap"),
            h("button.fe-btn.ghost.small", {type: "button", onclick: () => {
              draft = Object.assign(blank(), JSON.parse(JSON.stringify(w)));
              app.drawArea();
            }}, "Change"),
            h("button.fe-btn.ghost.small", {type: "button", onclick: () => EZ.store.change((ed) => {
              ed.wishlists = (ed.wishlists || []).filter((x) => x.id !== w.id);
              if (!ed.wishlists.length) delete ed.wishlists;
            }, {label: "wishlists"})}, "Remove")),
            r ? h("p.fe-sub.fe-small", EZ.words.cond(r.cond.replace(/\$f\([^\s]*\)/g, "").trim()) +
              ((w.pool || []).length ? `, and ${w.n || 1} of ${(w.pool || []).length} more stats` : "")) : null);
        })) : null]);
    },
  });
})();
