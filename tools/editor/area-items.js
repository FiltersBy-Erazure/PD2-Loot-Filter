/* Items: change single items (EZ.overrides): find an item, see what Erazure and the player's filter do with it at
   every filter level, pick which of them (quality, ethereal, identified, levels, character levels) and what to do:
   show, hide, mute, another sound or icon, icon only, an alert, a changed or replaced look. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
(function () {
  "use strict";
  const {h, fill, seg, pill} = EZ.ui;
  const QUALS = [["", "Any"], ["NORM", "Normal"], ["SUP", "Superior"], ["INF", "Low quality"], ["MAG", "Magic"],
                 ["RARE", "Rare"], ["CRAFT", "Crafted"], ["SET", "Set"], ["UNI", "Unique"]];
  const ACTIONS = [
    ["hunt", "Hunt it", "Shown wherever Erazure hides it, with a loud look, a big minimap icon and a sound of its " +
      "own instead of Erazure's."],
    ["show", "Show it", "Where Erazure hides it, it shows with the look Erazure's other rules give it."],
    ["hide", "Hide it", "On the ground outside town: no label, no icon, no sound. Your inventory, stash and shops " +
      "still name it."],
    ["mute", "Mute it", "No drop sound; the label, icon and chat line stay."],
    ["sound", "Another sound", "Its drop sound, wherever Erazure gives it one (or adds one)."],
    ["icon", "Another icon", "Its minimap icon, wherever Erazure gives it one."],
    ["iconOnly", "Icon only", "Keep the minimap icon; no chat line and no sound (BH gives them together)."],
    ["notify", "Add an alert", "An icon, sound and chat line of your own."],
    ["look", "Change its look", "Your text where Erazure decides its look; Erazure's tags and description stay."],
    ["replace", "Replace its look", "Your look, decided before any of Erazure's rules."],
  ];
  const ACTION_NAME = Object.fromEntries(ACTIONS.map(([k, t]) => [k, t]));
  let draft = null;  // {id (when editing), spec (the picked item), scope, action, ...}

  const plain = (s) => String(s || "").replace(/ÿc./g, "").split("\n")[0].trim();

  /* Kinds of items, for changing many at once (their codes from the catalog: gems by grade, runes by number). */
  function kinds() {
    const cat = EZ.items.catalog(), bases = [...cat.bases.values()];
    const by = (f) => bases.filter(f).map((b) => b.code);
    const list = (codes) => codes.filter((c) => cat.bases.has(c));
    const grades = ["", "Chipped", "Flawed", "Normal", "Flawless", "Perfect"];
    const out = [];
    for (let l = 1; l <= 5; l++) out.push({id: "gems" + l, title: grades[l] + " gems and skulls", codes: by((b) => b.gem && b.gem[0] === l)});
    for (const [a, b, t] of [[1, 7, "El to Tal"], [8, 11, "Ral to Amn"], [12, 15, "Sol to Hel"], [16, 19, "Io to Fal"],
                             [20, 21, "Lem and Pul"], [22, 25, "Um to Gul"], [26, 33, "Vex to Zod"]]) {
      out.push({id: `runes${a}`, title: "Runes " + t, codes: by((x) => x.rune >= a && x.rune <= b)});
    }
    out.push({id: "hp", title: "Healing potions", codes: list(["hp1", "hp2", "hp3", "hp4", "hp5"])},
      {id: "mp", title: "Mana potions", codes: list(["mp1", "mp2", "mp3", "mp4", "mp5"])},
      {id: "rv", title: "Rejuvenation potions", codes: list(["rvs", "rvl"])},
      {id: "util", title: "Antidote, stamina and thawing potions", codes: list(["yps", "vps", "wms"])},
      {id: "throw", title: "Throwing potions", codes: list(["gpl", "gpm", "gps", "opl", "opm", "ops"])},
      {id: "scrolls", title: "Scrolls and tomes", codes: list(["tsc", "isc", "tbk", "ibk"])},
      {id: "keys", title: "Keys", codes: list(["key"])},
      {id: "gold", title: "Gold", codes: list(["gld"])},
      {id: "quivers", title: "Arrows and bolts", codes: by((b) => /^(aqv|cqv)/.test(b.code))},
      {id: "charms", title: "Magic charms", codes: list(["cm1", "cm2", "cm3"]), quality: "MAG"},
      {id: "jewels-mag", title: "Magic jewels", codes: list(["jew"]), quality: "MAG"},
      {id: "jewels-rare", title: "Rare jewels", codes: list(["jew"]), quality: "RARE"},
      {id: "jewelry-mag", title: "Magic rings and amulets", codes: list(["rin", "amu"]), quality: "MAG"},
      {id: "jewelry-rare", title: "Rare rings and amulets", codes: list(["rin", "amu"]), quality: "RARE"});
    return out.filter((k) => k.codes.length);
  }

  function newDraft(pick) {
    const q = pick.spec.quality || "";
    return {spec: Object.assign({}, pick.spec), label: pick.label,
            scope: {codes: (pick.codes || [pick.spec.code]).slice(), quality: q, eth: "any", id: "any", levels: [],
                    clvl: ["", ""]},
            action: "hide", sound: 0, icon: "", alert: {icon: {}, sound: 0, chat: "all", tier: 4}, mode: "add",
            text: "%NAME%"};
  }

  function summary(o) {
    const s = o.scope, cat = EZ.items.catalog();
    const names = s.codes.map((c) => { const b = cat.bases.get(c); return b ? plain(b.name) : c; });
    const q = QUALS.find(([k]) => k === (s.quality || ""));
    const bits = [(s.quality ? q[1] + " " : "") + names.slice(0, 3).join(", ") + (names.length > 3 ? ` +${names.length - 3}` : "")];
    if (s.eth === "yes") bits.push("ethereal"); else if (s.eth === "no") bits.push("not ethereal");
    if (s.id === "yes") bits.push("identified"); else if (s.id === "no") bits.push("unidentified");
    if ((s.levels || []).length) bits.push("levels " + s.levels.slice().sort((a, b) => a - b).join(", "));
    const [a, b] = s.clvl || [];
    if (a || b) bits.push("character level " + (a || 1) + "-" + (b || 99));
    return bits.join(" · ");
  }

  /* The picked item at each filter level, Erazure's and the player's (the preview's character and place). */
  function strip(app, spec) {
    const P = EZ.preview;
    if (!P || !P.erazure) return null;
    const base = P.erazure(), mine = P.yours();
    if (!base) return null;
    const names = ["Show All Items"].concat(EZ.filter.levels(base.lines).map((l) => plain(l.text)));
    const rows = [];
    for (let lv = 0; lv < names.length; lv++) {
      const a = P.run(base, spec, lv), b = mine ? P.run(mine, spec, lv) : a;
      if (!a) continue;
      const cell = (r) => r.invisible || r.hidden ? h("span.fe-pv-hidden", r.invisible ? "nothing" : "no label") :
        EZ.render.label(r.name, {start: r.start});
      const changed = mine && JSON.stringify([a.name, a.sound, a.chat, a.invisible, a.icons.map((x) => [x.border,
        x.map, x.dot, x.px])]) !== JSON.stringify([b.name, b.sound, b.chat, b.invisible, b.icons.map((x) => [x.border,
        x.map, x.dot, x.px])]);
      rows.push(h("tr" + (changed ? ".is-changed" : ""), h("td.fe-num", String(lv)), h("td.fe-sub.fe-small", names[lv]),
        h("td", cell(a), a.sound ? h("span.fe-pv-snd", " ♪") : null),
        mine ? h("td", cell(b), b.sound ? h("span.fe-pv-snd", " ♪") : null) : null));
    }
    return h("div.fe-tablewrap", h("table.fe-it-strip",
      h("thead", h("tr", h("th", "Lv"), h("th", "Level"), h("th", "Erazure"), mine ? h("th", "Yours") : null)),
      h("tbody", rows)));
  }

  function editor(app, box) {
    const d = draft, cat = EZ.items.catalog();
    const s = d.scope;
    const redraw = () => editor(app, box);
    const set = (fn) => { fn(d); redraw(); };
    const flip = (arr, v) => { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); };
    const levelNames = EZ.filter.levels(app.versionLines()).map((l) => plain(l.text));
    const base = cat.bases.get(d.spec.code);
    // the base's tiers (normal / exceptional / elite)
    const fam = (() => {
      const rev = new Map();
      for (const b of cat.bases.values()) if (b.up) rev.set(b.up.code, b.code);
      let root = d.spec.code;
      for (let n = 0; n < 4 && rev.has(root); n++) root = rev.get(root);
      const out = [root];
      let b = cat.bases.get(root);
      for (let n = 0; n < 4 && b && b.up; n++) { out.push(b.up.code); b = cat.bases.get(b.up.code); }
      return out.filter((c) => cat.bases.has(c));
    })();
    const shared = (s.quality === "UNI" || s.quality === "SET") ?
      cat.uniques.filter((u) => s.codes.indexOf(u.code) >= 0 && u.kind === s.quality).map((u) => u.name) : [];
    const extra = [];
    if (d.action === "sound") {
      extra.push(h("div.fe-row", h("button.fe-btn.small", {type: "button", onclick: () => EZ.sounds.pick(app,
        Object.keys(EZ.filter.notifications(app.versionLines()).sounds).map(Number), d.sound,
        (id) => set((x) => { x.sound = id; }))}, d.sound ? "♪ " + EZ.sounds.name(app.data, d.sound) : "Pick a sound"),
        d.sound ? EZ.sounds.play(app.data, d.sound) : h("span.fe-sub", "(no sound: the same as Mute)")));
    }
    if (d.action === "icon" || d.action === "notify" || d.action === "hunt") {
      const palette = app.data.palette || [];
      const layers = d.action === "icon" ? Object.fromEntries((d.icon || "").split(" ").filter(Boolean).map((k) => k.split("-")))
        : d.alert.icon;
      const setLayer = (l, col) => set((x) => {
        const now = Object.assign({}, layers);
        if (col === null) delete now[l]; else now[l] = col;
        if (x.action === "icon") x.icon = EZ.rules.LAYERS.filter((k) => now[k]).map((k) => k + "-" + now[k]).join(" ");
        else x.alert.icon = now;
      });
      const combo = EZ.rules.LAYERS.filter((k) => layers[k]).map((k) => k + "-" + layers[k]).join(" ");
      extra.push(h("div.fe-row.fe-small", EZ.looks.icon(combo, palette, 3), EZ.rules.LAYERS.map((l) => {
        const b = h("button.fe-layer", {type: "button"}, h("span.fe-layerbox", {style: {background: layers[l] ?
          palette[parseInt(layers[l], 16)] : "transparent"}}), l === "BORDER" ? "Border" : l === "MAP" ? "Map" :
          l === "DOT" ? "Dot" : "Pixel");
        b.addEventListener("click", () => EZ.looks.palettePicker(b, palette, layers[l], (col) => setLayer(l, col), true));
        return b;
      }), d.action === "icon" && !combo ? h("span.fe-sub", "(no icon)") : null));
    }
    if (d.action === "notify" || d.action === "hunt") {
      extra.push(h("div.fe-row.fe-small", h("button.fe-btn.small", {type: "button", onclick: () => EZ.sounds.pick(app,
        Object.keys(EZ.filter.notifications(app.versionLines()).sounds).map(Number), d.alert.sound,
        (id) => set((x) => { x.alert.sound = id; }))}, d.alert.sound ? "♪ " + EZ.sounds.name(app.data, d.alert.sound) :
        "Pick a sound"), d.alert.sound ? EZ.sounds.play(app.data, d.alert.sound) : null,
        h("select", {"aria-label": "Chat line", onchange: (e) => set((x) => { x.alert.chat = e.target.value; })},
          [["all", "Chat line on every level"], ["tier", "Chat line on levels 0 to …"], ["none", "No chat line or sound"]]
            .map(([v, t]) => h("option", {value: v, selected: d.alert.chat === v}, t))),
        d.alert.chat === "tier" ? h("input.fe-pv-num", {type: "number", min: 0, max: 9, value: d.alert.tier,
          "aria-label": "Up to level", onchange: (e) => set((x) => { x.alert.tier = e.target.value; })}) : null),
        d.action === "notify" ? seg([{value: "add", text: "Only where Erazure has none"}, {value: "instead",
          text: "Instead of Erazure's"}], d.mode, (v) => set((x) => { x.mode = v; }), {label: "Erazure's alerts"}) : null);
    }
    if (d.action === "look" || d.action === "replace" || d.action === "hunt") {
      const cards = EZ.filter.lookCards(app.src, app.versionLines());
      extra.push(h("select", {"aria-label": "Start from one of Erazure's looks", onchange: (e) => {
        if (e.target.value) set((x) => { x.text = e.target.value.replace(/\s+$/, ""); });
      }}, h("option", {value: ""}, "Start from one of Erazure's looks…"),
        EZ.filter.GROUPS.map((g) => h("optgroup", {label: g.title}, cards.filter((c) => c.group === g.id &&
          c.tpls[0] && c.tpls[0].tpl.indexOf("%NAME%") >= 0).map((c) => h("option", {value: c.tpls[0].tpl}, c.title))))));
    }
    if (d.action === "look" || d.action === "replace" || d.action === "hunt") {
      const input = h("input.fe-mono", {type: "text", value: d.text, spellcheck: "false", "aria-label": "The look",
        oninput: (e) => { d.text = e.target.value; prev(); }});
      const prevBox = h("span.fe-ed-rulelabel");
      const prev = () => fill(prevBox, EZ.render.label(EZ.looks.fill(d.text.replace(/\{[^}]*\}?/, ""),
        EZ.looks.values(app.versionLines()), "%" + ({UNI: "GOLD", SET: "GREEN", RARE: "YELLOW", MAG: "BLUE",
          CRAFT: "ORANGE"}[s.quality] || "WHITE") + "%" + plain(base ? base.name : "Item"))));
      prev();
      extra.push(h("div.fe-stack", input, h("div.fe-row.fe-small", prevBox, h("span.fe-sub", d.action === "look" ?
        "%NAME% is the name with Erazure's tags so far." : "%NAME% is the game's name (and Erazure's base names)."))));
    }
    const add = () => {
      const o = {id: d.id || "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), action: d.action,
                 scope: JSON.parse(JSON.stringify(s))};
      if (!o.scope.quality) delete o.scope.quality;
      if (d.action === "sound") o.sound = d.sound;
      if (d.action === "icon") o.icon = d.icon;
      if (d.action === "notify") { o.alert = JSON.parse(JSON.stringify(d.alert)); o.mode = d.mode; }
      if (d.action === "hunt") o.alert = JSON.parse(JSON.stringify(d.alert));
      if (d.action === "look" || d.action === "replace" || d.action === "hunt") o.text = d.text;
      draft = null;  // before the change: the area is drawn again without the form
      EZ.store.change((ed) => {
        ed.items = (ed.items || []).filter((x) => x.id !== o.id);
        ed.items.push(o);
      }, {label: "items"});
      EZ.ui.toast((d.id ? "Changed: " : "Added: ") + ACTION_NAME[o.action] + " · " + summary(o), "good");
    };
    fill(box,
      h("div.fe-row", h("h3", {style: {margin: 0}}, d.label), h("span.fe-sub", (base ? plain(base.name) : "") + " · " +
        d.spec.code), h("span.fe-bar-gap"), h("button.fe-btn.ghost.small", {type: "button", onclick: () => {
          draft = null; app.drawArea(); }}, "✕")),
      strip(app, d.spec),
      h("p.fe-sub.fe-small", "The item as the preview shows it (its character, place and the game's options); open it " +
        "in the preview's Item view to change those."),
      h("fieldset.fe-bd-set", h("legend", "Which of them"),
        h("div.fe-bd-field.wide", h("span.fe-bd-label", "Bases"), h("div.fe-row.fe-small",
          s.codes.map((c) => h("span.fe-bd-chip", plain((cat.bases.get(c) || {}).name || c), " ", h("code.fe-small", c),
            s.codes.length > 1 ? h("button.fe-x", {type: "button", "aria-label": "Remove " + c, onclick: () =>
              set((x) => { x.scope.codes = x.scope.codes.filter((k) => k !== c); })}, "✕") : null)),
          fam.length > 1 && fam.some((c) => s.codes.indexOf(c) < 0) ? h("button.fe-btn.ghost.small", {type: "button",
            onclick: () => set((x) => { for (const c of fam) if (x.scope.codes.indexOf(c) < 0) x.scope.codes.push(c); })},
            "+ its other tiers") : null)),
        shared.length > 1 ? h("p.fe-note.warn.fe-bd-field.wide", `${shared.length} ${s.quality === "SET" ? "set items" :
          "uniques"} share this base (${shared.slice(0, 6).join(", ")}${shared.length > 6 ? "…" : ""}): until it's ` +
          "identified BH can't tell them apart, so the change is for all of them.") : null,
        h("div.fe-bd-field.wide", h("span.fe-bd-label", "Quality"), seg(QUALS.map(([v, t]) => ({value: v, text: t})),
          s.quality || "", (v) => set((x) => { x.scope.quality = v; }), {label: "Quality"})),
        h("div.fe-bd-field", h("span.fe-bd-label", "Ethereal"), seg([{value: "any", text: "Either"}, {value: "yes",
          text: "Yes"}, {value: "no", text: "No"}], s.eth, (v) => set((x) => { x.scope.eth = v; }), {label: "Ethereal"})),
        h("div.fe-bd-field", h("span.fe-bd-label", "Identified"), seg([{value: "any", text: "Either"}, {value: "yes",
          text: "Yes"}, {value: "no", text: "No"}], s.id, (v) => set((x) => { x.scope.id = v; }), {label: "Identified"})),
        h("div.fe-bd-field.wide", h("span.fe-bd-label", "Filter levels (none picked: every level)"),
          h("div.fe-row.fe-small", levelNames.map((n, i) => h("button.fe-chiptog", {type: "button", title: `${i + 1}: ${n}`,
            "aria-pressed": String(s.levels.indexOf(i + 1) >= 0), onclick: () => set((x) => flip(x.scope.levels, i + 1))},
            String(i + 1))))),
        h("div.fe-bd-field", h("span.fe-bd-label", "Character level"), h("div.fe-row.fe-small",
          h("input.fe-pv-num", {type: "number", min: 1, max: 99, value: s.clvl[0], placeholder: "from",
            "aria-label": "From character level", onchange: (e) => set((x) => { x.scope.clvl[0] = e.target.value; })}),
          h("span", "to"), h("input.fe-pv-num", {type: "number", min: 1, max: 99, value: s.clvl[1], placeholder: "to",
            "aria-label": "To character level", onchange: (e) => set((x) => { x.scope.clvl[1] = e.target.value; })})))),
      h("fieldset.fe-bd-set", h("legend", "What to do"),
        h("div.fe-bd-field.wide", h("div.fe-choice", ACTIONS.map(([k, t, sub]) => EZ.ui.option(t, sub, d.action === k,
          () => set((x) => {
            x.action = k;
            if (k === "hunt" && x.text === "%NAME%") {  // the hunt's own look and alert to start from
              x.text = EZ.overrides.HUNT.text;
              x.alert = JSON.parse(JSON.stringify(EZ.overrides.HUNT.alert));
            }
          }))))),
        extra.length ? h("div.fe-bd-field.wide", extra) : null),
      h("div.fe-row", h("button.fe-btn.primary", {type: "button", onclick: add}, d.id ? "Keep the change" : "Add this change"),
        h("span.fe-sub.fe-small", ACTION_NAME[d.action] + " · " + summary({scope: s}))));
  }

  EZ.areas.push({
    id: "items", title: "Items", icon: "◈", order: 30, group: "b",
    count: (e) => EZ.edits.countArea("items", e),
    render(box, app) {
      const e = EZ.store.current().edits;
      const input = h("input.fe-pv-search", {type: "search", placeholder: "Find an item: Shako, Ber Rune, Small Charm, " +
        "Thresher…", "aria-label": "Find an item"});
      const picks = h("div.fe-pv-picks", {hidden: true, role: "listbox"});
      const show = () => {
        const found = EZ.items.search(input.value, 14);
        fill(picks, found.map((p) => h("button", {type: "button", role: "option", onclick: () => {
          picks.hidden = true;
          draft = newDraft(p);
          app.drawArea();
          if (EZ.preview && EZ.preview.state) {  // the preview follows the item
            EZ.preview.state.spec = Object.assign({}, p.spec);
            EZ.preview.state.mode = "item";
            EZ.preview.changed({}, app);
          }
        }}, h("span", p.label), h("small", p.sub + " · " + p.spec.code))));
        picks.hidden = !found.length;
      };
      input.addEventListener("input", show);
      input.addEventListener("keydown", (ev) => { if (ev.key === "Escape") picks.hidden = true; });
      input.addEventListener("blur", () => setTimeout(() => { picks.hidden = true; }, 150));
      const kindList = kinds();
      const kindSel = h("select", {"aria-label": "Or a kind of item", onchange: (ev) => {
        const k = kindList.find((x) => x.id === ev.target.value);
        if (!k) return;
        draft = newDraft({spec: {code: k.codes[0], quality: k.quality}, codes: k.codes, label: k.title});
        app.drawArea();
      }}, h("option", {value: ""}, "…or a kind of item"), kindList.map((k) => h("option", {value: k.id}, k.title)));
      const card = h("section.fe-card", {id: "fe-item-edit"});
      if (draft) editor(app, card);
      const list = (e.items || []).filter(EZ.overrides.valid);
      const yours = list.length ? h("section.fe-card", {id: "fe-items-list"}, h("h3", "Your item changes"),
        list.map((o) => h("div.fe-rb-op", h("div.fe-row.fe-small", pill(ACTION_NAME[o.action] || o.action, "accent"),
          h("span", summary(o)), o.action === "notify" ? pill(o.mode === "instead" ? "instead of Erazure's" :
            "where Erazure has none", "info") : null, h("span.fe-bar-gap"),
          h("button.fe-btn.ghost.small", {type: "button", onclick: () => {
            const cat = EZ.items.catalog(), b = cat.bases.get(o.scope.codes[0]);
            draft = Object.assign(newDraft({spec: {code: o.scope.codes[0], quality: o.scope.quality || undefined},
              label: b ? plain(b.name) : o.scope.codes[0]}), JSON.parse(JSON.stringify({id: o.id, action: o.action,
              sound: o.sound || 0, icon: o.icon || "", alert: o.alert || {icon: {}, sound: 0, chat: "all", tier: 4},
              mode: o.mode || "add", text: o.text || "%NAME%"})));
            draft.scope = Object.assign({quality: "", eth: "any", id: "any", levels: [], clvl: ["", ""]},
              JSON.parse(JSON.stringify(o.scope)));
            app.drawArea();
          }}, "Edit"),
          h("button.fe-btn.ghost.small", {type: "button", onclick: () => EZ.store.change((ed) => {
            ed.items = (ed.items || []).filter((x) => x.id !== o.id);
            if (!ed.items.length) delete ed.items;
          }, {label: "items"})}, "Remove"))))) : null;
      EZ.ui.add(box, [
        h("div.fe-area-head", h("div", h("h2", "Items"),
          h("p.fe-sub", "Change single items: show or hide them, change their alerts or their look. Only the rules " +
            "for these items change, so everything else stays Erazure's, and it follows Erazure's updates."))),
        h("section.fe-card", h("div.fe-row", h("div.fe-pv-pick.fe-bd-search", input, picks), kindSel),
          draft ? null : h("p.fe-sub.fe-small", {style: {marginTop: ".5em"}}, "Unique and set items are told apart only " +
            "once identified: unidentified, a change is for every unique (or set item) on that base.")),
        draft ? card : null, yours]);
      if (draft) requestAnimationFrame(() => { const el = box.querySelector("#fe-item-edit"); if (el) el.scrollIntoView({block: "nearest"}); });
    },
  });
})();
