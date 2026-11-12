/* Items: change single items or many at once (EZ.overrides): find an item or a kind of item, see what Erazure and the
   player's filter do with it at every filter level, pick which of them (bases, qualities, ethereal, identified,
   sockets, enhanced defense / damage, item level, filter levels, character levels) and what to do: show (with
   Erazure's look, the look of another level, or the player's own), hide, mute, another sound or icon, icon only, an
   alert, a changed or replaced look. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
(function () {
  "use strict";
  const {h, fill, seg, pill} = EZ.ui;
  const QUALS = [["NORM", "Normal"], ["SUP", "Superior"], ["INF", "Low quality"], ["MAG", "Magic"], ["RARE", "Rare"],
                 ["CRAFT", "Crafted"], ["SET", "Set"], ["UNI", "Unique"]];
  const QUAL_NAME = Object.fromEntries(QUALS);
  const WHITE = ["NORM", "SUP", "INF"];
  const ACTIONS = [
    ["hunt", "Hunt it", "Shown wherever Erazure hides it, with a loud look, a big minimap icon and a sound of its " +
      "own instead of Erazure's."],
    ["show", "Show it", "Where Erazure hides it, it shows: with the look Erazure gives it on these levels, the look it " +
      "has on another level, or a look of your own."],
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
  /* Looks to start from besides Erazure's own (the name keeps its color: the editor puts it back after the text). */
  const PRESETS = [["Red dots: •  Item  •", "%RED%•  %NAME%  %RED%•"], ["Tan dots: •  Item  •", "%TAN%•  %NAME%  %TAN%•"],
    ["Gold stars: *  Item  *", "%GOLD%*  %NAME%  %GOLD%*"], ["Purple arrows: >>>  Item  <<<", "%PURPLE%>>>  %NAME%  %PURPLE%<<<"]];
  const SAMPLE_COLOR = {MAG: "BLUE", RARE: "YELLOW", CRAFT: "ORANGE", SET: "GREEN", UNI: "GOLD"};
  let draft = null;  // {id (when editing), spec (the item the strip shows), scope, action, ...}

  const plain = (s) => String(s || "").replace(/ÿc./g, "").split("\n")[0].trim();
  const O = () => EZ.overrides;

  /* ---------------------------------------------------------------- bases and kinds */

  /* A base's tiers (normal, exceptional, elite), its own code among them. */
  function famOf(code) {
    const cat = EZ.items.catalog();
    const rev = new Map();
    for (const b of cat.bases.values()) if (b.up) rev.set(b.up.code, b.code);
    let root = code;
    for (let n = 0; n < 4 && rev.has(root); n++) root = rev.get(root);
    const out = [root];
    let b = cat.bases.get(root);
    for (let n = 0; n < 4 && b && b.up; n++) { out.push(b.up.code); b = cat.bases.get(b.up.code); }
    return out.filter((c) => cat.bases.has(c));
  }

  /* Kinds of items by type (BH's item groups, as the rule builder offers them): [{id, title, group, codes}]. */
  function typeKinds() {
    const cat = EZ.items.catalog(), bases = [...cat.bases.values()].filter((b) => b.spawnable && !b.quest);
    const groups = (EZ.rulesArea && EZ.rulesArea.GROUPS) || [];
    const out = [];
    const of = (f) => bases.filter(f).map((b) => b.code);
    for (const [title, list] of groups) {
      for (const [g, label] of list) {
        const gear = title !== "Other";
        out.push({id: "g-" + g, title: label, group: title, codes: of((b) => b.groups.indexOf(g) >= 0 && (!gear || b.armor ||
          (b.weapon && (b.types || []).indexOf("tpot") < 0)))});  // throwing potions are weapons to the game
      }
    }
    out.push({id: "g-HELM-noclass", title: "Helms (not class helms)", group: "Armor",
              codes: of((b) => b.groups.indexOf("HELM") >= 0 && b.groups.indexOf("CLASS") < 0)},
             {id: "g-SHIELD-noclass", title: "Shields (not class shields)", group: "Armor",
              codes: of((b) => b.groups.indexOf("SHIELD") >= 0 && b.groups.indexOf("CLASS") < 0)});
    return out.filter((k) => k.codes.length);
  }

  /* Kinds of items, for changing many at once (their codes from the catalog: gems by grade, runes by number), then
     the kinds by type. */
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
    return out.filter((k) => k.codes.length).map((k) => Object.assign(k, {group: "Kinds"})).concat(typeKinds());
  }

  /* A select of kinds, grouped (onPick(kind)). */
  function kindSelect(placeholder, onPick) {
    const list = kinds();
    const groups = [...new Set(list.map((k) => k.group))];
    return h("select", {"aria-label": placeholder, onchange: (ev) => {
      const k = list.find((x) => x.id === ev.target.value);
      ev.target.value = "";
      if (k) onPick(k);
    }}, h("option", {value: ""}, placeholder), groups.map((g) => h("optgroup", {label: g},
      list.filter((k) => k.group === g).map((k) => h("option", {value: k.id}, k.title + " (" + k.codes.length + ")")))));
  }

  /* A search box for items: onPick(pick) with the picked item (EZ.items.search's). */
  function searchBox(placeholder, onPick) {
    const input = h("input.fe-pv-search", {type: "search", placeholder, "aria-label": placeholder});
    const picks = h("div.fe-pv-picks", {hidden: true, role: "listbox"});
    const show = () => {
      const found = EZ.items.search(input.value, 14);
      fill(picks, found.map((p) => h("button", {type: "button", role: "option", onclick: () => {
        picks.hidden = true;
        input.value = "";
        onPick(p);
      }}, h("span", p.label), h("small", p.sub + " · " + p.spec.code))));
      picks.hidden = !found.length;
    };
    input.addEventListener("input", show);
    input.addEventListener("keydown", (ev) => { if (ev.key === "Escape") picks.hidden = true; });
    input.addEventListener("blur", () => setTimeout(() => { picks.hidden = true; }, 150));
    return h("div.fe-pv-pick.fe-bd-search", input, picks);
  }

  /* ---------------------------------------------------------------- the draft */

  function newDraft(pick) {
    const q = pick.spec.quality || "";
    return {spec: Object.assign({}, pick.spec), label: pick.label,
            scope: {codes: (pick.codes || [pick.spec.code]).slice(), quals: q ? [q] : [], eth: "any", id: "any",
                    sockets: [], ed: "", ilvl: ["", ""], levels: [], clvl: ["", ""], extra: ""},
            action: "hide", sound: 0, icon: "", alert: {icon: {}, sound: 0, chat: "all", tier: 4}, mode: "add",
            text: "%NAME%", look: "erazure", asLevel: null, keepColor: true, unknown: []};
  }

  /* The draft's scope as an override keeps it (empty fields left out). */
  function scopeOf(s) {
    const out = {codes: s.codes.slice(), eth: s.eth, id: s.id, levels: s.levels.slice(), clvl: s.clvl.slice()};
    const q = O().qualsOf(s);
    if (q.length) out.quals = q;
    const so = O().socketsOf(s);
    if (so.length) out.sockets = so;
    if (O().edOf(s)) out.ed = String(O().edOf(s));
    const [a, b] = O().ilvlOf(s);
    if (a || b) out.ilvl = [a ? String(a) : "", b ? String(b) : ""];
    if (typeof s.extra === "string" && s.extra.trim()) out.extra = s.extra.trim();
    return out;
  }

  /* The item the strip and the preview show: the draft's picked base, made to fit the scope. */
  function sample(d) {
    const s = d.scope, cat = EZ.items.catalog();
    const code = s.codes.indexOf(d.spec.code) >= 0 ? d.spec.code : s.codes[0];
    const b = cat.bases.get(code);
    const spec = Object.assign({}, d.spec, {code});
    const q = O().qualsOf(s);
    if (b && !EZ.items.qualities(b)) delete spec.quality;
    else if (q.length && q.indexOf(spec.quality || "NORM") < 0) spec.quality = q[0];
    if (spec.quality !== "UNI" && spec.quality !== "SET") delete spec.uni;
    const so = O().socketsOf(s);
    if (so.length && so.indexOf(spec.sockets || 0) < 0) spec.sockets = so[0];
    if (s.eth === "yes") spec.eth = true; else if (s.eth === "no") spec.eth = false;
    if (s.id === "yes") spec.id = true; else if (s.id === "no") spec.id = false;
    const ed = O().edOf(s);
    if (ed && b && (b.armor || b.weapon)) {
      if ((!spec.quality || spec.quality === "NORM" || spec.quality === "INF") && (!q.length || q.indexOf("SUP") >= 0)) {
        spec.quality = "SUP";
      }
      spec.stats = [[b.armor ? 16 : 17, 0, ed]];
    }
    const [ia, ib] = O().ilvlOf(s);
    if (ia || ib) spec.ilvl = ia || ib;
    return spec;
  }

  function summary(o) {
    const s = o.scope, cat = EZ.items.catalog();
    const names = s.codes.map((c) => { const b = cat.bases.get(c); return b ? plain(b.name) : c; });
    const q = O().qualsOf(s);
    const white = WHITE.every((x) => q.indexOf(x) >= 0);
    const qn = (white ? ["Non-magical"] : []).concat(q.filter((x) => !white || WHITE.indexOf(x) < 0).map((x) => QUAL_NAME[x]));
    const bits = [(qn.length ? qn.join(" or ") + " " : "") + names.slice(0, 3).join(", ") +
      (names.length > 3 ? ` +${names.length - 3}` : "")];
    if (s.eth === "yes") bits.push("ethereal"); else if (s.eth === "no") bits.push("not ethereal");
    if (s.id === "yes") bits.push("identified"); else if (s.id === "no") bits.push("unidentified");
    const so = O().socketsOf(s);
    if (so.length) bits.push(so.join(" or ") + (so.length === 1 && so[0] === 1 ? " socket" : " sockets"));
    if (O().edOf(s)) bits.push(O().edOf(s) + "%+ enhanced defense / damage");
    const [ia, ib] = O().ilvlOf(s);
    if (ia || ib) bits.push("item level " + (ia && ib ? ia + "-" + ib : ia ? ia + "+" : "up to " + ib));
    if ((s.levels || []).length) bits.push("levels " + s.levels.slice().sort((a, b) => a - b).join(", "));
    const [a, b] = s.clvl || [];
    if (a || b) bits.push("character level " + (a || 1) + "-" + (b || 99));
    if (typeof s.extra === "string" && s.extra.trim()) bits.push("and " + s.extra.trim().slice(0, 40));
    if (o.action === "show" && o.look === "level" && o.asLevel !== null && o.asLevel !== undefined) {
      bits.push("as level " + o.asLevel + " shows it");
    } else if (o.action === "show" && o.look === "own") bits.push("your look");
    return bits.join(" · ");
  }

  /* The picked item at each filter level, Erazure's and the player's (the preview's character and place). */
  function levelsOf(app, spec) {
    const P = EZ.preview;
    if (!P || !P.erazure) return null;
    const base = P.erazure(), mine = P.yours();
    if (!base) return null;
    const names = ["Show All Items"].concat(EZ.filter.levels(base.lines).map((l) => plain(l.text)));
    const out = [];
    for (let lv = 0; lv < names.length; lv++) {
      const a = P.run(base, spec, lv);
      if (!a) continue;
      out.push({lv, name: names[lv], a, b: mine ? P.run(mine, spec, lv) : null});
    }
    return {rows: out, mine: !!mine};
  }

  function strip(app, spec) {
    const got = levelsOf(app, spec);
    if (!got) return null;
    const cell = (r) => r.invisible || r.hidden ? h("span.fe-pv-hidden", r.invisible ? "nothing" : "no label") :
      EZ.render.label(r.name, {start: r.start});
    const key = (r) => JSON.stringify([r.name, r.sound, r.chat, r.invisible, r.icons.map((x) => [x.border, x.map, x.dot,
      x.px])]);
    const rows = got.rows.map(({lv, name, a, b}) => {
      const changed = b && key(a) !== key(b);
      return h("tr" + (changed ? ".is-changed" : ""), h("td.fe-num", String(lv)), h("td.fe-sub.fe-small", name),
        h("td", cell(a), a.sound ? h("span.fe-pv-snd", " ♪") : null),
        got.mine ? h("td", cell(b || a), (b || a).sound ? h("span.fe-pv-snd", " ♪") : null) : null);
    });
    return h("div.fe-tablewrap", h("table.fe-it-strip",
      h("thead", h("tr", h("th", "Lv"), h("th", "Level"), h("th", "Erazure"), got.mine ? h("th", "Yours") : null)),
      h("tbody", rows)));
  }

  /* ---------------------------------------------------------------- the form */

  function editor(app, box) {
    const d = draft, cat = EZ.items.catalog();
    const s = d.scope;
    const redraw = () => editor(app, box);
    const set = (fn) => { fn(d); redraw(); };
    const flip = (arr, v) => { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); };
    const levelNames = EZ.filter.levels(app.versionLines()).map((l) => plain(l.text));
    const spec = sample(d);
    const base = cat.bases.get(spec.code);
    const bases = s.codes.map((c) => cat.bases.get(c)).filter(Boolean);
    const quals = O().qualsOf(s);
    const addCodes = (codes) => set((x) => { for (const c of codes) if (cat.bases.has(c) && x.scope.codes.indexOf(c) < 0) x.scope.codes.push(c); });

    /* which of them */
    const missingTiers = [...new Set(s.codes.flatMap(famOf))].filter((c) => s.codes.indexOf(c) < 0);
    const typed = h("input.fe-mono", {type: "text", placeholder: "Codes: bhm, xh9, uh9", spellcheck: "false",
      "aria-label": "Item codes to add", style: {width: "12em"}});
    const addTyped = () => {
      const words = typed.value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      const known = words.filter((w) => cat.bases.has(w)), unknown = words.filter((w) => !cat.bases.has(w));
      set((x) => {
        for (const c of known) if (x.scope.codes.indexOf(c) < 0) x.scope.codes.push(c);
        x.unknown = unknown;
      });
    };
    typed.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); addTyped(); } });
    const basesField = h("div.fe-bd-field.wide", h("span.fe-bd-label", `Bases (${s.codes.length})`),
      h("div.fe-row.fe-small", s.codes.map((c) => h("span.fe-bd-chip" + (c === spec.code ? ".is-on" : ""),
        h("button.fe-linkbtn", {type: "button", title: "Show this one in the table below", onclick: () =>
          set((x) => { x.spec.code = c; })}, plain((cat.bases.get(c) || {}).name || c)), " ", h("code.fe-small", c),
        s.codes.length > 1 ? h("button.fe-x", {type: "button", "aria-label": "Leave out " + c, onclick: () =>
          set((x) => { x.scope.codes = x.scope.codes.filter((k) => k !== c); })}, "✕") : null)),
        missingTiers.length ? h("button.fe-btn.ghost.small", {type: "button", onclick: () => addCodes(missingTiers)},
          s.codes.length > 1 ? "+ their other tiers" : "+ its other tiers") : null),
      h("div.fe-row.fe-small", {style: {marginTop: ".35em"}},
        searchBox("+ Add a base…", (p) => addCodes([p.spec.code])),
        kindSelect("+ Add a kind…", (k) => addCodes(k.codes)),
        typed, h("button.fe-btn.small", {type: "button", onclick: addTyped}, "Add")),
      (d.unknown || []).length ? h("p.fe-note.warn.fe-small", d.unknown.join(", ") + (d.unknown.length === 1 ?
        " isn't an item code." : " aren't item codes.") + " Find the item by its name in Add a base.") : null);
    const shared = quals.filter((q) => q === "UNI" || q === "SET").flatMap((q) =>
      cat.uniques.filter((u) => s.codes.indexOf(u.code) >= 0 && u.kind === q).map((u) => u.name));
    const white = WHITE.every((x) => quals.indexOf(x) >= 0);
    const qualityField = h("div.fe-bd-field.wide", h("span.fe-bd-label", "Quality (none picked: every quality)"),
      h("div.fe-row.fe-small",
        h("button.fe-chiptog", {type: "button", "aria-pressed": String(white), title: "Normal, Superior and Low quality",
          onclick: () => set((x) => {
            const now = O().qualsOf(x.scope);
            x.scope.quals = white ? now.filter((q) => WHITE.indexOf(q) < 0) : [...new Set(now.concat(WHITE))];
            delete x.scope.quality;
          })}, "Non-magical"),
        QUALS.map(([v, t]) => h("button.fe-chiptog", {type: "button", "aria-pressed": String(quals.indexOf(v) >= 0),
          onclick: () => set((x) => {
            const now = O().qualsOf(x.scope);
            flip(now, v);
            x.scope.quals = now;
            delete x.scope.quality;
          })}, t))));
    const maxSock = Math.max(0, ...bases.map((b) => b.sockets || 0));
    const so = O().socketsOf(s);
    const socketsField = maxSock ? h("div.fe-bd-field", h("span.fe-bd-label", "Sockets (none picked: any)"),
      h("div.fe-row.fe-small", Array.from({length: maxSock + 1}, (_, n) => h("button.fe-chiptog", {type: "button",
        "aria-pressed": String(so.indexOf(n) >= 0), onclick: () => set((x) => {
          const now = O().socketsOf(x.scope);
          flip(now, n);
          x.scope.sockets = now.sort((a, b) => a - b);
        })}, String(n))))) : null;
    const gear = bases.some((b) => b.armor || b.weapon);
    const edField = gear ? h("div.fe-bd-field", h("span.fe-bd-label", "Enhanced defense / damage at least"),
      h("div.fe-row.fe-small", h("input.fe-pv-num", {type: "number", min: 1, max: 999, value: s.ed || "",
        placeholder: "%", "aria-label": "Enhanced defense or damage at least",
        onchange: (e) => set((x) => { x.scope.ed = e.target.value; })}),
        h("span.fe-sub", "% (superior items, or any item's total)"))) : null;
    const ilvl = s.ilvl || ["", ""];
    const ilvlField = h("div.fe-bd-field", h("span.fe-bd-label", "Item level"), h("div.fe-row.fe-small",
      h("input.fe-pv-num", {type: "number", min: 1, max: 99, value: ilvl[0], placeholder: "from",
        "aria-label": "From item level", onchange: (e) => set((x) => { x.scope.ilvl = [e.target.value, (x.scope.ilvl || [])[1] || ""]; })}),
      h("span", "to"), h("input.fe-pv-num", {type: "number", min: 1, max: 99, value: ilvl[1], placeholder: "to",
        "aria-label": "To item level", onchange: (e) => set((x) => { x.scope.ilvl = [(x.scope.ilvl || [])[0] || "", e.target.value]; })})));
    const extraField = h("details.fe-bd-field.wide", s.extra ? {open: true} : {},
      h("summary.fe-sub.fe-small", "More conditions (BH's words)"),
      h("input.fe-mono", {type: "text", value: s.extra || "", spellcheck: "false", placeholder: "e.g. SORCERESS or RES>29",
        "aria-label": "More conditions", style: {width: "100%"}, onchange: (e) => set((x) => { x.scope.extra = e.target.value; })}),
      h("p.fe-sub.fe-small", "Added to the rest as they are (an OR needs its brackets). Lint them on My rules first."));

    /* what to do */
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
    if (d.action === "show") {
      extra.push(h("div.fe-row.fe-small", h("span.fe-bd-label", "Its look"), seg([
        {value: "erazure", text: "Erazure's on these levels"}, {value: "level", text: "As another level shows it"},
        {value: "own", text: "Your own"}], d.look || "erazure", (v) => set((x) => {
          x.look = v;
          if (v === "own" && x.text === "%NAME%") x.text = PRESETS[0][1];
        }), {label: "Its look"})));
      if (d.look === "level") {
        const got = levelsOf(app, spec);
        const own = (s.levels || []).map(Number);
        const opts = got ? got.rows.filter((r) => own.indexOf(r.lv) < 0).map((r) => h("option", {value: r.lv,
          selected: d.asLevel === r.lv}, `${r.lv} · ${r.name}: ${r.a.hidden ? "hidden" : plain(r.a.name) || "(no name)"}`)) : [];
        extra.push(h("div.fe-stack", h("select", {"aria-label": "The level whose look it takes", onchange: (e) =>
          set((x) => { x.asLevel = e.target.value === "" ? null : +e.target.value; })},
          h("option", {value: "", selected: d.asLevel === null}, "Pick the level…"), opts),
          h("p.fe-sub.fe-small", "On your levels it looks, alerts and shows as Erazure has it on that level (for " +
            (own.length ? "levels " + own.join(", ") : "every level") + "). The list shows the item above as each " +
            "level draws it.")));
      }
    }
    if (d.action === "look" || d.action === "replace" || d.action === "hunt" || (d.action === "show" && d.look === "own")) {
      const cards = EZ.filter.lookCards(app.src, app.versionLines());
      extra.push(h("select", {"aria-label": "Start from a look", onchange: (e) => {
        if (e.target.value) set((x) => { x.text = e.target.value.replace(/\s+$/, ""); });
      }}, h("option", {value: ""}, "Start from a look…"),
        h("optgroup", {label: "Simple"}, PRESETS.map(([t, v]) => h("option", {value: v}, t))),
        EZ.filter.GROUPS.map((g) => h("optgroup", {label: "Erazure: " + g.title}, cards.filter((c) => c.group === g.id &&
          c.tpls[0] && c.tpls[0].tpl.indexOf("%NAME%") >= 0).map((c) => h("option", {value: c.tpls[0].tpl}, c.title))))));
      const input = h("input.fe-mono", {type: "text", value: d.text, spellcheck: "false", "aria-label": "The look",
        oninput: (e) => { d.text = e.target.value; prev(); }});
      const prevBox = h("span.fe-ed-rulelabel");
      const q0 = spec.quality || "NORM";
      const col = SAMPLE_COLOR[q0] || (spec.eth || (spec.sockets || 0) > 0 ? "GRAY" : "WHITE");
      const prev = () => fill(prevBox, EZ.render.label(EZ.looks.fill((d.keepColor ? O().colored(d.text, col) : d.text)
        .replace(/\{[^}]*\}?/, ""), EZ.looks.values(app.versionLines()), "%" + col + "%" + plain(base ? base.name : "Item"))));
      prev();
      extra.push(h("div.fe-stack", input,
        EZ.ui.toggle("The name keeps its own color", d.keepColor, (on) => set((x) => { x.keepColor = on; }),
          {sub: "After your text's colors the name goes back to white, gray (ethereal or socketed), blue, yellow… as " +
                "the game draws it."}),
        h("div.fe-row.fe-small", prevBox, h("span.fe-sub", d.action === "replace" ?
          "%NAME% is the game's name (and Erazure's base names)." : "%NAME% is the name with Erazure's tags so far."))));
    }
    const add = () => {
      const o = {id: d.id || "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), action: d.action,
                 scope: scopeOf(s)};
      if (d.action === "sound") o.sound = d.sound;
      if (d.action === "icon") o.icon = d.icon;
      if (d.action === "notify") { o.alert = JSON.parse(JSON.stringify(d.alert)); o.mode = d.mode; }
      if (d.action === "hunt") o.alert = JSON.parse(JSON.stringify(d.alert));
      if (d.action === "show" && d.look === "level") {
        if (d.asLevel === null || d.asLevel === undefined) { EZ.ui.toast("Pick the level whose look it takes.", "bad"); return; }
        o.look = "level";
        o.asLevel = d.asLevel;
      }
      if (d.action === "look" || d.action === "replace" || d.action === "hunt" || (d.action === "show" && d.look === "own")) {
        o.text = d.text;
        o.keepColor = !!d.keepColor;
        if (d.action === "show") o.look = "own";
      }
      draft = null;  // before the change: the area is drawn again without the form
      EZ.store.change((ed) => {
        ed.items = (ed.items || []).filter((x) => x.id !== o.id);
        ed.items.push(o);
      }, {label: "items"});
      EZ.ui.toast((d.id ? "Changed: " : "Added: ") + ACTION_NAME[o.action] + " · " + summary(o), "good");
    };
    fill(box,
      h("div.fe-row", h("h3", {style: {margin: 0}}, d.label), h("span.fe-sub", (base ? plain(base.name) : "") + " · " +
        spec.code), h("span.fe-bar-gap"), h("button.fe-btn.ghost.small", {type: "button", onclick: () => {
          draft = null; app.drawArea(); }}, "✕")),
      strip(app, spec),
      h("p.fe-sub.fe-small", "The item as the preview shows it (its character, place and the game's options), made to " +
        "fit what you pick below; click a base to see that one."),
      h("fieldset.fe-bd-set", h("legend", "Which of them"),
        basesField,
        shared.length > 1 ? h("p.fe-note.warn.fe-bd-field.wide", `${shared.length} ${quals.indexOf("SET") >= 0 &&
          quals.indexOf("UNI") < 0 ? "set items" : "uniques and set items"} share these bases (${shared.slice(0, 6).join(", ")}` +
          `${shared.length > 6 ? "…" : ""}): until it's identified BH can't tell them apart, so the change is for all of ` +
          "them.") : null,
        qualityField,
        h("div.fe-bd-field", h("span.fe-bd-label", "Ethereal"), seg([{value: "any", text: "Either"}, {value: "yes",
          text: "Yes"}, {value: "no", text: "No"}], s.eth, (v) => set((x) => { x.scope.eth = v; }), {label: "Ethereal"})),
        h("div.fe-bd-field", h("span.fe-bd-label", "Identified"), seg([{value: "any", text: "Either"}, {value: "yes",
          text: "Yes"}, {value: "no", text: "No"}], s.id, (v) => set((x) => { x.scope.id = v; }), {label: "Identified"})),
        socketsField, edField, ilvlField,
        h("div.fe-bd-field.wide", h("span.fe-bd-label", "Filter levels (none picked: every level)"),
          h("div.fe-row.fe-small", levelNames.map((n, i) => h("button.fe-chiptog", {type: "button", title: `${i + 1}: ${n}`,
            "aria-pressed": String(s.levels.indexOf(i + 1) >= 0), onclick: () => set((x) => flip(x.scope.levels, i + 1))},
            String(i + 1))))),
        h("div.fe-bd-field", h("span.fe-bd-label", "Character level"), h("div.fe-row.fe-small",
          h("input.fe-pv-num", {type: "number", min: 1, max: 99, value: s.clvl[0], placeholder: "from",
            "aria-label": "From character level", onchange: (e) => set((x) => { x.scope.clvl[0] = e.target.value; })}),
          h("span", "to"), h("input.fe-pv-num", {type: "number", min: 1, max: 99, value: s.clvl[1], placeholder: "to",
            "aria-label": "To character level", onchange: (e) => set((x) => { x.scope.clvl[1] = e.target.value; })}))),
        extraField),
      h("fieldset.fe-bd-set", h("legend", "What to do"),
        h("div.fe-bd-field.wide", h("div.fe-choice", ACTIONS.map(([k, t, sub]) => EZ.ui.option(t, sub, d.action === k,
          () => set((x) => {
            x.action = k;
            if (k === "hunt" && x.text === "%NAME%") {  // the hunt's own look and alert to start from
              x.text = EZ.overrides.HUNT.text;
              x.alert = JSON.parse(JSON.stringify(EZ.overrides.HUNT.alert));
              x.keepColor = false;
            }
          }))))),
        extra.length ? h("div.fe-bd-field.wide", extra) : null),
      h("div.fe-row", h("button.fe-btn.primary", {type: "button", onclick: add}, d.id ? "Keep the change" : "Add this change"),
        h("span.fe-sub.fe-small", ACTION_NAME[d.action] + " · " + summary({action: d.action, look: d.look,
          asLevel: d.asLevel, scope: s}))));
  }

  /* An override back into the form. */
  function draftOf(o) {
    const cat = EZ.items.catalog(), b = cat.bases.get(o.scope.codes[0]);
    const q = EZ.overrides.qualsOf(o.scope);
    const d = Object.assign(newDraft({spec: {code: o.scope.codes[0], quality: q.length === 1 ? q[0] : undefined},
      label: b ? plain(b.name) : o.scope.codes[0]}), JSON.parse(JSON.stringify({id: o.id, action: o.action,
      sound: o.sound || 0, icon: o.icon || "", alert: o.alert || {icon: {}, sound: 0, chat: "all", tier: 4},
      mode: o.mode || "add", text: o.text || "%NAME%", look: o.look || "erazure",
      asLevel: o.asLevel === undefined ? null : o.asLevel, keepColor: o.keepColor === undefined ? o.action !== "hunt" &&
        o.action !== "look" && o.action !== "replace" : !!o.keepColor})));
    const sc = JSON.parse(JSON.stringify(o.scope));
    d.scope = Object.assign({quals: [], eth: "any", id: "any", sockets: [], ed: "", ilvl: ["", ""], levels: [],
                             clvl: ["", ""], extra: ""}, sc, {quals: q});
    delete d.scope.quality;
    return d;
  }

  EZ.areas.push({
    id: "items", title: "Items", icon: "◈", order: 30, group: "b",
    count: (e) => EZ.edits.countArea("items", e),
    render(box, app) {
      const e = EZ.store.current().edits;
      const pick = searchBox("Find an item: Shako, Ber Rune, Small Charm, Thresher…", (p) => {
        draft = newDraft(p);
        app.drawArea();
        if (EZ.preview && EZ.preview.state) {  // the preview follows the item
          EZ.preview.state.spec = Object.assign({}, p.spec);
          EZ.preview.state.mode = "item";
          EZ.preview.changed({}, app);
        }
      });
      const kindSel = kindSelect("…or a kind of item", (k) => {
        draft = newDraft({spec: {code: k.codes[0], quality: k.quality}, codes: k.codes, label: k.title});
        app.drawArea();
      });
      const card = h("section.fe-card", {id: "fe-item-edit"});
      if (draft) editor(app, card);
      const list = (e.items || []).filter(EZ.overrides.valid);
      const yours = list.length ? h("section.fe-card", {id: "fe-items-list"}, h("h3", "Your item changes"),
        h("p.fe-sub.fe-small", "Where two of them meet, the narrower one wins (fewer bases, a quality, sockets, levels…); " +
          "for two alike, the later one."),
        list.map((o) => h("div.fe-rb-op", h("div.fe-row.fe-small", pill(ACTION_NAME[o.action] || o.action, "accent"),
          h("span", summary(o)), o.action === "notify" ? pill(o.mode === "instead" ? "instead of Erazure's" :
            "where Erazure has none", "info") : null, h("span.fe-bar-gap"),
          h("button.fe-btn.ghost.small", {type: "button", onclick: () => { draft = draftOf(o); app.drawArea(); }}, "Edit"),
          h("button.fe-btn.ghost.small", {type: "button", onclick: () => EZ.store.change((ed) => {
            ed.items = (ed.items || []).filter((x) => x.id !== o.id);
            if (!ed.items.length) delete ed.items;
          }, {label: "items"})}, "Remove"))))) : null;
      EZ.ui.add(box, [
        h("div.fe-area-head", h("div", h("h2", "Items"),
          h("p.fe-sub", "Change single items or many at once: show or hide them, change their alerts or their look. " +
            "Only the rules for these items change, so everything else stays Erazure's, and it follows Erazure's " +
            "updates."))),
        h("section.fe-card", h("div.fe-row", pick, kindSel),
          draft ? null : h("p.fe-sub.fe-small", {style: {marginTop: ".5em"}}, "Pick one item or a kind (throwing " +
            "weapons, paladin shields, helms…), then add more bases, leave some out, and narrow it down by quality, " +
            "sockets, enhanced defense, item level and filter level. Unique and set items are told apart only once " +
            "identified: unidentified, a change is for every unique (or set item) on that base.")),
        draft ? card : null, yours]);
      if (draft) requestAnimationFrame(() => { const el = box.querySelector("#fe-item-edit"); if (el) el.scrollIntoView({block: "nearest"}); });
    },
  });
})();
