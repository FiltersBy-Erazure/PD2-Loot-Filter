/* Highlights (the area's name since 2026-11-12, the author; its code and the edit set still say wishlists): the
   identified items a player wants, by kind, quality and stats (each one must have, and "N of these"), tagged with a
   description line (and a label tag, an icon and a sound if the player likes). EZ.wishlists writes the rules. */
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
      })}, RA.STAT_KINDS.map(([v, t]) => h("option", {value: v, selected: RA.kindOf(s) === v}, t)));
      let what;
      if (s.kind === "word" || s.kind === "STAT") {
        what = RA.statPicker(s, (v) => set(() => {
          list[k] = {kind: v.kind, word: v.word || "", n: v.n || "", op: s.op || "min", a: s.a, b: s.b};
        }));
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
      const done = !!EZ.wishlists.wordsOf(s) && String(s.a === undefined ? "" : s.a).trim() !== "";
      box.appendChild(h("div.fe-row.fe-small.fe-bd-stat" + (done ? "" : ".is-unfinished"), kind, what,
        h("select", {"aria-label": "Compare", onchange: (e) => set(() => { s.op = e.target.value; })},
          RA.OPS.map(([v, t]) => h("option", {value: v, selected: (s.op || "min") === v}, t))),
        h("input.fe-pv-num", {type: "number", value: s.a, "aria-label": "Value", onchange: (e) => set(() => { s.a = e.target.value; }, true)}),
        s.op === "between" ? [h("span", "and"), h("input.fe-pv-num", {type: "number", value: s.b, "aria-label": "Second value",
          onchange: (e) => set(() => { s.b = e.target.value; }, true)})] : null,
        h("button.fe-x", {type: "button", "aria-label": "Remove this stat", onclick: () => set(() => { list.splice(k, 1); })}, "✕"),
        done ? null : pill(EZ.wishlists.wordsOf(Object.assign({}, s, {a: s.a || "1"})) ? "needs a value" : "needs a stat",
          "warn")));
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
    const cancel = () => { draft = null; app.drawArea(); };
    /* a sample of what it draws: the label with its tag, the line in the hover box, in their colors */
    const sample = (r) => {
      const R = EZ.render, color = R.WORDS[EZ.wishlists.COLORS.indexOf(d.color) >= 0 ? d.color : "GREEN"];
      const first = d.codes.length ? EZ.items.base(d.codes[0]) : null;
      const q = d.quals.length === 1 ? d.quals[0] : d.quals.indexOf("RARE") >= 0 ? "RARE" : d.quals[0];
      const name = first ? R.plain(first.name).split(" / ")[0] : "Item";
      const tag = (d.tag || "").replace(/[{}]/g, "").trim();
      const text = (d.line || d.name || "Highlight").replace(/[{}]/g, "").trim();
      return h("div.fe-bd-show",
        h("div.fe-ground.fe-bd-ground", R.label((tag ? "ÿc" + color + tag + " " : "") + "ÿc" +
          (R.QUALITY[q] || "0") + name)),
        h("div.fe-minidesc", {title: "Its line in the hover box (over Erazure's lines there)"},
          R.coded("ÿc" + color + text, "3")));
    };
    const drawResult = () => {
      const r = EZ.wishlists.rule(d);
      const buttons = h("div.fe-row",
        r ? h("button.fe-btn.primary", {type: "button", onclick: () => {
          const w = JSON.parse(JSON.stringify(d));
          const was = !!w.id;
          w.id = w.id || "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
          draft = null;
          // an edited highlight keeps its place in the list
          const changed = EZ.store.change((ed) => {
            const list = ed.wishlists || [];
            const k = list.findIndex((x) => x.id === w.id);
            if (k >= 0) list[k] = w; else list.push(w);
            ed.wishlists = list;
          }, {label: "wishlists"});
          if (!changed) { app.drawArea(); EZ.ui.toast("Nothing changed: the highlight already was this."); return; }
          EZ.ui.toast((was ? "Saved the highlight: " : "Added the highlight: ") + (w.name || w.line || "Highlight") +
            ". " + (app.canSaveInPlace() ? "Save to game" : "Download") + " to use it in game.", "good", {ms: 7000});
        }}, d.id ? "Save the highlight" : "Add the highlight") : null,
        h("button.fe-btn.ghost", {type: "button", onclick: cancel}, "Cancel"));
      if (!r) {
        fill(result, h("p.fe-sub", "Pick a kind of item or a stat: a highlight with neither would tag every item."),
          buttons);
        return;
      }
      const ls = r.line.split("\n");
      const ctx = EZ.lint.context(app.src, app.versionLines(), {top: ls, bottom: []}, {soundCount: app.data.soundCount});
      const findings = EZ.lint.lines(ls, Object.assign(ctx, {block: "top"})).filter((f) => f.level !== "info");
      fill(result,
        h("p", h("b", "Tags: "), EZ.wishlists.describe(d), "."),
        sample(r),
        h("details.fe-rules", h("summary", "Show the rule"), ls.map((l) => h("code.fe-bd-line", l))),
        findings.length ? h("ul.fe-ed-lint", findings.map((f) => h("li.fe-ed-finding." + f.level, pill(f.level === "error" ?
          "error" : "warning", f.level === "error" ? "bad" : "warn"), h("span", f.text)))) : null,
        buttons);
    };
    const palette = app.data.palette || [];
    const layers = d.alert.icon || {};
    const combo = EZ.rules.LAYERS.filter((k) => layers[k]).map((k) => k + "-" + layers[k]).join(" ");
    const lineInput = h("input", {type: "text", value: d.line, placeholder: d.name || "Highlight",
      oninput: (e) => set(() => { d.line = e.target.value; }, true)});
    fill(box,
      h("div.fe-row", h("h3", {style: {margin: 0}}, d.id ? "Edit the highlight" : "A new highlight"),
        h("span.fe-bar-gap"), h("button.fe-btn.ghost.small", {type: "button", "aria-label": "Close without keeping it",
          title: "Close without keeping it", onclick: cancel}, "✕")),
      h("fieldset.fe-bd-set", h("legend", "Which items"),
        h("label.fe-bd-field.wide", h("span.fe-bd-label", "Its name (for you)"), h("input", {type: "text", value: d.name,
          oninput: (e) => set(() => { d.name = e.target.value; lineInput.placeholder = d.name || "Highlight"; }, true)})),
        h("div.fe-bd-field.wide", h("span.fe-bd-label", "Kinds of items (any of these)"), h("div.fe-row.fe-small",
          JEWELRY.map(([c, t]) => h("button.fe-chiptog", {type: "button", "aria-pressed": String(d.codes.indexOf(c) >= 0),
            onclick: () => set(() => flip(d.codes, c))}, t)),
          RA.GROUPS.filter(([g]) => g !== "Other").flatMap(([, list]) => list).map(([g, t]) => h("button.fe-chiptog",
            {type: "button", "aria-pressed": String(d.groups.indexOf(g) >= 0), onclick: () => set(() => flip(d.groups, g))},
            t.replace(/ \(.*\)$/, ""))))),
        h("div.fe-bd-field.wide", h("span.fe-bd-label", "Quality"), h("div.fe-row.fe-small",
          [["MAG", "Magic"], ["RARE", "Rare"], ["CRAFT", "Crafted"], ["SET", "Set"], ["UNI", "Unique"]].map(([q, t]) =>
            h("button.fe-chiptog", {type: "button", "aria-pressed": String(d.quals.indexOf(q) >= 0),
              onclick: () => set(() => flip(d.quals, q))}, t)))),
        rows(app, d.need, set, "Stats it must have (all of these)"),
        rows(app, d.pool, set, "And some of these", "Stats show once the item is identified."),
        d.pool.length ? h("div.fe-bd-field", h("span.fe-bd-label", "How many of them"), h("input.fe-pv-num", {type: "number",
          min: 1, max: Math.max(1, d.pool.filter((s) => EZ.wishlists.wordsOf(s)).length), value: d.n,
          "aria-label": "How many of them", onchange: (e) => set(() => { d.n = e.target.value; }, true)}),
          d.pool.some((s) => !EZ.wishlists.wordsOf(s)) ? h("span.fe-sub.fe-small", "(rows that need a stat or a value " +
            "don't count)") : null) : null),
      h("fieldset.fe-bd-set", h("legend", "What it gets"),
        h("label.fe-bd-field", h("span.fe-bd-label", "A line in its description"), lineInput),
        h("div.fe-bd-field", h("span.fe-bd-label", "Its color: " + (d.color || "GREEN").charAt(0) +
          (d.color || "GREEN").slice(1).toLowerCase().replace("_", " ")), h("div.fe-row.fe-small",
          EZ.wishlists.COLORS.map((c) => h("button.fe-chipbtn", {type: "button", "aria-pressed": String(d.color === c),
            title: c.charAt(0) + c.slice(1).toLowerCase().replace("_", " "), "aria-label": "Color: " +
              c.toLowerCase().replace("_", " "), onclick: () => set(() => { d.color = c; })},
            h("span.fe-chipsw", {style: {background: EZ.render.rgb(EZ.render.WORDS[c]) || "#000"}}))))),
        h("label.fe-bd-field", h("span.fe-bd-label", "A tag before its name (optional)"), h("input", {type: "text",
          value: d.tag || "", placeholder: "e.g. GC", oninput: (e) => set(() => { d.tag = e.target.value; }, true)})),
        h("div.fe-bd-field.wide", h("span.fe-bd-label", "An alert: a minimap icon, a sound and a chat line (optional)"),
          h("div.fe-row.fe-small", h("span.fe-bd-label", "Minimap icon:"), EZ.looks.icon(combo, palette, 3),
            EZ.rules.LAYERS.map((l) => EZ.looks.layerButton(l, layers[l], palette, (col) => set(() => {
              d.alert.icon = Object.assign({}, d.alert.icon);
              if (col === null) delete d.alert.icon[l]; else d.alert.icon[l] = col;
            })))),
          h("div.fe-row.fe-small", h("span.fe-bd-label", "Drop sound:"), h("button.fe-btn.small", {type: "button",
            onclick: () => EZ.sounds.pick(app, Object.keys(EZ.filter.notifications(app.versionLines()).sounds).map(Number),
              d.alert.sound, (id) => set(() => { d.alert.sound = id; }))},
            d.alert.sound ? "♪ " + EZ.sounds.name(app.data, d.alert.sound) : "Pick a sound"),
            d.alert.sound ? EZ.sounds.play(app.data, d.alert.sound) : null),
          // the chat line comes with an icon or a sound (the game sends them together): when, or not at all
          h("div.fe-row.fe-small", h("span.fe-bd-label", "Chat line:"),
            h("select", {"aria-label": "Chat line", onchange: (e) => set(() => { d.alert.chat = e.target.value; })},
              [["all", "On every filter level"], ["tier", "Only on filter levels 0 to …"], ["none", "None (and no sound)"]]
                .map(([v, t]) => h("option", {value: v, selected: (d.alert.chat || "all") === v}, t))),
            d.alert.chat === "tier" ? h("input.fe-pv-num", {type: "number", min: 0, max: 9, value: d.alert.tier || 4,
              "aria-label": "Up to filter level", onchange: (e) => set(() => { d.alert.tier = e.target.value; })}) : null,
            h("span.fe-sub", "(it comes with an icon or a sound; they fire for identified items only)")))),
      result);
    drawResult();
  }

  EZ.areas.push({
    id: "highlights", title: "Highlights", icon: "★", order: 60, group: "b",
    count: (e) => EZ.edits.countArea("wishlists", e),
    render(box, app) {
      const e = EZ.store.current().edits;
      const list = (e.wishlists || []).filter(EZ.wishlists.valid);
      const card = h("section.fe-card", {id: "fe-wish-edit"});
      if (draft) editor(app, card);
      EZ.ui.add(box, [
        h("div.fe-area-head", h("div", h("h2", "Highlights"),
          h("p.fe-sub", "Highlight the identified items you want, by kind, quality and stats: each gets a line in its description " +
            "(and a tag, an icon or a sound if you like) wherever it is: on the ground, in your inventory, stash or a " +
            "shop. Erazure's looks and tags stay."))),
        draft ? card : h("section.fe-card", h("div.fe-row",
          h("button.fe-btn.primary", {type: "button", onclick: () => { draft = blank(); app.drawArea(); }}, "+ A new highlight"),
          h("span.fe-sub", "or start from:"),
          EXAMPLES.map(([t, w]) => h("button.fe-btn.small", {type: "button", onclick: () => {
            draft = Object.assign(blank(), JSON.parse(JSON.stringify(w)));
            app.drawArea();
          }}, t)))),
        list.length ? h("section.fe-card", h("h3", "Your highlights"), list.map((w) => {
          const r = EZ.wishlists.rule(w);
          return h("div.fe-rb-op", h("div.fe-row.fe-small", h("b", w.name || w.line || "Highlight"),
            r ? null : pill("tags nothing yet", "warn"), h("span.fe-bar-gap"),
            h("button.fe-btn.ghost.small", {type: "button", "aria-label": "Edit the highlight " + (w.name || w.line ||
              "Highlight"), onclick: () => {
              draft = Object.assign(blank(), JSON.parse(JSON.stringify(w)));
              app.drawArea();
            }}, "Edit"),
            h("button.fe-btn.ghost.small", {type: "button", "aria-label": "Remove the highlight " + (w.name || w.line ||
              "Highlight"), onclick: () => {
              EZ.store.change((ed) => {
                ed.wishlists = (ed.wishlists || []).filter((x) => x.id !== w.id);
                if (!ed.wishlists.length) delete ed.wishlists;
              }, {label: "wishlists"});
              EZ.ui.undoToast("Removed the highlight " + (w.name || w.line || "Highlight") + ".");
            }}, "Remove")),
            r ? h("p.fe-sub.fe-small", EZ.wishlists.describe(w) + ".") : null);
        })) : null]);
    },
  });
})();
