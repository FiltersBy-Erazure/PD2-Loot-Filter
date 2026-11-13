/* The Filter Editor's preview column: an item run through Erazure's filter and through the player's (EZ.engine), at
   the filter level, character and place the column's settings pick, with the game's options. Two views:
   - Item: one item (searched, or built: quality, identified, ethereal, sockets, item level, stats), its label as the
     game draws it, minimap icon, chat line, drop sound and hover box description, Erazure's beside the player's; how
     the filter built it (the rules that matched, in order) and the item at every filter level;
   - Samples: a board of typical drops at once, the player's changes outlined.
   The labels are drawn as HTML in D2GL's colors (EZ.render); the game's own font comes with the assets. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.preview = (function () {
  "use strict";
  const {h, fill, add, seg, toggle, debounce} = EZ.ui;
  const STORE = "erazure-filter-editor-preview";
  const CLASSES = ["Amazon", "Sorceress", "Necromancer", "Paladin", "Barbarian", "Druid", "Assassin"];
  const DIFFS = ["Normal", "Nightmare", "Hell"];
  const WHERE = [{value: "field", text: "Outside town", mapid: 2}, {value: "town", text: "In town", mapid: 1},
                 {value: "map", text: "In a T1-T3 map", mapid: 143},
                 {value: "uber", text: "Pandemonium Fortress", mapid: 137}];
  const PLACES = [{value: "GROUND", text: "On the ground"}, {value: "INVENTORY", text: "In the inventory"},
                  {value: "STASH", text: "In the stash"}, {value: "CUBE", text: "In the Cube"},
                  {value: "EQUIPPED", text: "Equipped"}, {value: "SHOP", text: "In a shop"}];
  const QUALITIES = ["NORM", "SUP", "INF", "MAG", "RARE", "CRAFT", "UNI", "SET"];
  // a board of typical drops (the samples view): spec + what it is
  const SAMPLES = [
    {code: "r30"}, {code: "r22"}, {code: "r08"}, {code: "gld", gold: 4800}, {code: "gpv"}, {code: "gcr"},
    {code: "skz"}, {code: "hp5"}, {code: "rvl"}, {code: "rvs"}, {code: "isc"}, {code: "key", qty: 6},
    {code: "pk1"}, {code: "wss"}, {code: "t31", quality: "RARE"}, {code: "uap", quality: "UNI"},
    {code: "obf", quality: "UNI"}, {code: "rin", quality: "RARE"}, {code: "amu", quality: "MAG"},
    {code: "cm3", quality: "MAG"}, {code: "cm2", quality: "MAG"}, {code: "jew", quality: "RARE"},
    {code: "7s8", eth: true, sockets: 4}, {code: "uar", quality: "SUP", sockets: 4}, {code: "6lw", sockets: 4},
    {code: "ci3", quality: "MAG"}, {code: "pa9", quality: "MAG"}, {code: "xvg", quality: "RARE"},
    {code: "utp", quality: "SET"}, {code: "mbt", quality: "MAG"},
  ];

  // the drop scenes: a floor, the area BH reads (MAPID) and a pile of typical drops (the settings give the rest)
  // (place: where the scene is, as the settings' "You are" says it; the scene's own, whatever that setting says)
  const SCENES = [
    {id: "baal", title: "Baal's Throne", floor: "baal", mapid: 131, place: "outside town", items: [
      {code: "r30"}, {code: "uap", quality: "UNI"}, {code: "uar", quality: "SUP", sockets: 4},
      {code: "cm3", quality: "MAG"}, {code: "gpv"}, {code: "gld", gold: 2400}, {code: "rin", quality: "RARE"},
      {code: "amu", quality: "MAG"}, {code: "7s8", eth: true, sockets: 4}, {code: "gcr"}, {code: "rvl"},
      {code: "hp5"}, {code: "jew", quality: "RARE"}, {code: "cm1", quality: "MAG"}, {code: "ci3", quality: "RARE"},
      {code: "pk1"}, {code: "r22"}, {code: "xvg", quality: "RARE"}]},
    {id: "chaos", title: "Chaos Sanctuary", floor: "chaos", mapid: 108, place: "outside town", items: [
      {code: "r26"}, {code: "obf", quality: "UNI"}, {code: "utp", quality: "SET"}, {code: "cm2", quality: "MAG"},
      {code: "gpw"}, {code: "gld", gold: 1800}, {code: "amu", quality: "RARE"}, {code: "6lw", sockets: 4},
      {code: "mbt", quality: "MAG"}, {code: "skz"}, {code: "rvs"}, {code: "mp5"}]},
    {id: "map", title: "A T3 map", floor: "barracks", mapid: 143, place: "in a map", items: [
      {code: "t31", quality: "RARE"}, {code: "r24"}, {code: "wss"}, {code: "uap", quality: "UNI"},
      {code: "cm3", quality: "MAG"}, {code: "jew", quality: "MAG"}, {code: "rin", quality: "MAG"},
      {code: "gld", gold: 3100}, {code: "gpr"}, {code: "pa9", quality: "MAG"}, {code: "rvl"}, {code: "key", qty: 6}]},
    // (the desert floor; the Rocky Waste outside Lut Gholein as the area, so the filter hides what it hides there)
    {id: "runes", title: "Runes", floor: "lut", mapid: 41, place: "outside town", items: [
      {code: "r01"}, {code: "r08"}, {code: "r10"}, {code: "r12"}, {code: "r15"}, {code: "r18"}, {code: "r20"},
      {code: "r22"}, {code: "r24"}, {code: "r26"}, {code: "r28"}, {code: "r30"}, {code: "r31"}, {code: "r33"}]},
    {id: "town", title: "Harrogath", floor: "harrogath", mapid: 109, place: "in town", items: [
      {code: "isc"}, {code: "tsc"}, {code: "hp5"}, {code: "mp5"}, {code: "rvs"}, {code: "key", qty: 12},
      {code: "gld", gold: 9000}, {code: "uap", quality: "UNI"}, {code: "cm1", quality: "MAG"}]},
  ];

  let app = null, box = null;
  const cache = {base: null, baseName: null, yours: null, yoursKey: null};
  const state = defaults();

  function defaults() {
    const d = {mode: "scene", scene: "baal", sceneSide: "yours", showHidden: false, spec: {code: "r30"}, notes: [],
               clvl: 90, cls: 1, diff: 2, where: "field", filtlvl: 1,
               opts: {detailed: 1, dropSounds: true, forceUndiscovered: true, forceUnowned: false, hideHealing: false,
                      hideMana: false}, open: {item: true, trace: false, levels: true, options: false}};
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || "null");
      if (s && typeof s === "object") {
        for (const k of Object.keys(d)) if (s[k] !== undefined) d[k] = typeof d[k] === "object" && !Array.isArray(d[k])
          ? Object.assign({}, d[k], s[k]) : s[k];
      }
    } catch (e) { /* the defaults */ }
    if (!d.spec || typeof d.spec.code !== "string") d.spec = {code: "r30"};
    return d;
  }
  const save = debounce(() => {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* not kept */ }
  }, 300);

  /* ---------------------------------------------------------------- the filters */

  function compileOpts() {
    const c = EZ.items.catalog();
    return {statMax: c.statMax, skillMax: c.skillMax, soundCount: app.data.soundCount};
  }

  /* Erazure's version (the player's base, no edits). */
  function erazure() {
    if (!app) app = EZ.app;  // an area asked before the preview was drawn
    const v = app.variant();
    if (!v) return null;
    if (cache.baseName !== v.name) {
      cache.base = {F: EZ.engine.compile(app.versionLines(v), compileOpts()), lines: app.versionLines(v)};
      cache.baseName = v.name;
    }
    return cache.base;
  }

  /* The player's filter (null while it has no edits: it is Erazure's). */
  function yours() {
    if (!app) app = EZ.app;
    const p = EZ.store.current();
    if (!app.changes().count) return null;
    const key = (app.variant() || {}).name + "|" + JSON.stringify(p.edits);
    if (cache.yoursKey !== key) {
      const lines = EZ.edits.applied(app.src, p, app.versionLines()).lines;
      cache.yours = {F: EZ.engine.compile(lines, compileOpts()), lines};
      cache.yoursKey = key;
    }
    return cache.yours;
  }

  /* A filter with these edits (the Items form's change before it is added): one kept at a time. */
  const trial = {key: null, val: null};
  function withEdits(edits) {
    if (!app) app = EZ.app;
    const key = (app.variant() || {}).name + "|" + JSON.stringify(edits);
    if (trial.key !== key) {
      const lines = EZ.edits.apply(app.src, {edits}, app.versionLines()).lines;
      trial.val = {F: EZ.engine.compile(lines, compileOpts()), lines};
      trial.key = key;
    }
    return trial.val;
  }

  /* The character and place an area's answers are worked out for, as controls the area shows beside them (the
     preview's own settings: a change here changes the preview too). onchange: the area draws again. */
  function context(onchange, opts) {
    if (!app) app = EZ.app;
    const re = (fn) => { fn(); save(); if (box) redraw(); if (onchange) onchange(); };
    const clvl = h("input.fe-pv-num", {type: "number", min: 1, max: 99, value: state.clvl, "aria-label": "Character level",
      onchange: (e) => re(() => { state.clvl = Math.max(1, Math.min(99, +e.target.value || 1)); })});
    const cls = select(CLASSES.map((c, i) => ({value: i, text: c})), state.cls, (v) => re(() => { state.cls = +v; }),
      "Class");
    const diff = select(DIFFS.map((c, i) => ({value: i, text: c})), state.diff, (v) => re(() => { state.diff = +v; }),
      "Difficulty");
    const where = opts && opts.ground ? null : select(WHERE, state.where, (v) => re(() => { state.where = v; }),
      "Where you are");
    return h("div.fe-row.fe-small.fe-ctxline", h("span.fe-sub", (opts && opts.lead) || "For a level"), clvl, cls, diff,
      where || h("span.fe-sub", "outside town"));
  }

  function ctx(level) {
    const w = WHERE.find((x) => x.value === state.where) || WHERE[0];
    return {clvl: state.clvl, cls: state.cls, diff: state.diff, mapid: w.mapid,
            filtlvl: level === undefined ? state.filtlvl : level, charstats: {12: state.clvl}};
  }

  function run(f, spec, level) {
    const item = EZ.items.make(spec);
    if (!item || !f) return null;
    return EZ.engine.run(f.F, item, ctx(level), state.opts);
  }

  /* Erazure's run and the player's of the same items at one filter level, for a long list (Changes' every item):
     Erazure's runs are kept (they don't change for a version and these settings: the last few settings), and an item
     whose rules the player's filter holds as Erazure's does takes Erazure's run for the player's too (its lines'
     numbers are Erazure's: for what the item looks like only). -> (spec) => [Erazure's run, the player's] or null. */
  const baseRuns = new WeakMap();  // Erazure's compiled filter -> Map(settings -> Map(item -> run))
  function pairs(base, mine, level) {
    if (!base) return () => null;
    const c = ctx(level), o = state.opts;
    const key = JSON.stringify([level, c, o]);
    let kept = baseRuns.get(base.F);
    if (!kept) baseRuns.set(base.F, kept = new Map());
    let runs = kept.get(key);
    if (runs) kept.delete(key);
    else runs = new Map();
    kept.set(key, runs);
    while (kept.size > 3) kept.delete(kept.keys().next().value);
    const formulasAlike = !!mine && EZ.engine.namedFormulas(base.F) === EZ.engine.namedFormulas(mine.F);
    const alike = new Map();  // code and quality -> the player's rules are Erazure's
    return (spec) => {
      const item = EZ.items.make(spec);
      if (!item) return null;
      const k = JSON.stringify(spec);
      let a = runs.get(k);
      if (!a) {
        a = EZ.engine.run(base.F, item, c, o);
        runs.set(k, a);
      }
      if (!mine) return [a, null];
      const cls = item.code + "|" + item.quality;
      let same = alike.get(cls);
      if (same === undefined) {
        same = formulasAlike && EZ.engine.sameRules(base.F, mine.F, item);
        alike.set(cls, same);
      }
      return [a, same ? a : EZ.engine.run(mine.F, EZ.items.make(spec), c, o)];
    };
  }

  /* ---------------------------------------------------------------- drawing results */

  /* What a drop looks like, to tell Erazure's from the player's (an icon's colors, not the line that drew it: the
     player's own rules move Erazure's lines). */
  const boxes = (r) => r.icons.map((x) => [x.border, x.map, x.dot, x.px]);
  /* the Horadric Cube's "- Custom (n changes)" mark is in every changed filter: no change to the item itself */
  const CUSTOM_RE = / - Custom \(\d+ changes?\)/;
  const outcome = (r) => JSON.stringify([r.name, boxes(r), r.sound, r.chat, r.invisible,
    String(r.desc || "").replace(CUSTOM_RE, "")]);

  function iconCanvas(layers, scale) {
    scale = scale || 4;
    const size = 8 * scale + 6;
    const c = h("canvas", {width: size, height: size, class: "fe-pv-icon", role: "img",
      "aria-label": layers.length ? "minimap icon" : "no minimap icon"});
    const g = c.getContext("2d");
    g.fillStyle = "#070707";
    g.fillRect(0, 0, size, size);
    const pal = app.data.palette || [];
    const boxes = [];
    for (const l of layers) {
      for (const [k, d] of [["border", 8], ["map", 6], ["dot", 4], ["px", 2]]) {
        if (l[k] !== null && l[k] !== undefined) boxes.push([d, l[k] & 255]);
      }
    }
    const draw = ([d, col]) => {
      const s = d * scale, o = (size - s) / 2;
      g.fillStyle = pal[col] || "#000";
      g.fillRect(o, o, s, s);
    };
    boxes.filter((b) => b[1] !== 0).forEach(draw);
    boxes.filter((b) => b[1] === 0).forEach(draw);  // D2GL draws black boxes itself, over the rest
    return c;
  }

  function soundName(id) {
    const n = app.data.sounds && app.data.sounds[id];
    return n ? n : "sound " + id;
  }

  /* A label in the game's own font (EZ.glyphs) once its atlas is there, the HTML label until then. */
  function labelNode(text, start, zoom) {
    const c = EZ.glyphs && EZ.glyphs.label(text, {start, zoom: zoom || 1.5});
    if (c) return c;
    if (EZ.glyphs && EZ.glyphs.available()) EZ.glyphs.want("label", redraw);
    return EZ.render.label(text, {start});
  }

  function chatNode(text, start) {
    const c = EZ.glyphs && EZ.glyphs.chat(text, {start, zoom: 1.3});
    if (c) return c;
    if (EZ.glyphs && EZ.glyphs.available()) EZ.glyphs.want("chat", redraw);
    return codedText(text, start, "fe-chatline");
  }

  /* Text with color codes as spans (the chat line, the description), lines in the game's order. */
  function codedText(text, start, cls) {
    const out = h("span." + (cls || "fe-coded"));
    const lines = EZ.render.lines(text, start);
    lines.forEach((segs, i) => {
      if (i) out.appendChild(h("br"));
      for (const s of segs) {
        const span = h("span", s.text);
        const c = EZ.render.rgb(s.color);
        if (c) span.style.color = c;
        out.appendChild(span);
      }
    });
    return out;
  }

  function stateLine(r) {
    if (!r) return null;
    if (r.byOption) return EZ.ui.pill("Hidden by the game's Hide Potions option", "warn");
    const w = EZ.render.hiddenWords(r);
    if (w) return EZ.ui.pill(w + ": " + EZ.render.HIDDEN_LONG[w].replace(/^./, (c) => c.toLowerCase()), "warn");
    if (r.forced) return EZ.ui.pill("Shown by Force Show (the game's option)", "info");
    return null;
  }

  /* One result: label, state, icon, chat, sound, description. */
  function resultCard(r, title, other, item) {
    const card = h("div.fe-pvres-col");
    if (title) card.appendChild(h("div.fe-pvres-title", title));
    const ground = h("div.fe-ground.fe-pvground");
    if (!r) {
      ground.appendChild(h("span.fe-sub", "No such item"));
      card.appendChild(ground);
      return card;
    }
    if (r.name && !r.invisible && !r.hidden) ground.appendChild(labelNode(r.name, r.start, 1.5));
    else ground.appendChild(EZ.render.hiddenNode(r) || h("span.fe-pv-hidden", "No label"));
    card.appendChild(ground);
    const pills = h("div.fe-row.fe-small", stateLine(r));
    if (r.cut.name) pills.appendChild(EZ.ui.pill(`The game cuts ${r.cut.name} letter${r.cut.name > 1 ? "s" : ""} (56 at most)`, "warn"));
    if (r.cut.copy) pills.appendChild(EZ.ui.pill(`The game copies 127 characters: ${r.cut.copy} more cut`, "warn"));
    if (r.maybe) pills.appendChild(EZ.ui.pill("Some rules ask what this preview leaves open (How it's built lists " +
      "them)", "info"));
    if (pills.childNodes.length) card.appendChild(pills);
    const dl = h("dl.fe-kv.fe-pvkv");
    const diff = (k) => other && JSON.stringify(k === "icons" ? boxes(other) : other[k]) !==
      JSON.stringify(k === "icons" ? boxes(r) : r[k]) ? "is-changed" : null;
    dl.appendChild(h("dt", "Minimap"));
    dl.appendChild(h("dd", {class: diff("icons")}, r.icons.length ? iconCanvas(r.icons) : h("span.fe-sub", "no icon")));
    dl.appendChild(h("dt", "Chat"));
    dl.appendChild(h("dd", {class: diff("chat")}, r.chat === null ? h("span.fe-sub", "no chat line") :
      r.chat === "" ? h("span.fe-sub", "an empty line") : chatNode(r.chat, r.start)));
    dl.appendChild(h("dt", "Sound"));
    // the clip when the editor has it; the game's chat command to hear it either way, once, with what it is
    const clip = r.sound && EZ.sound.has(r.sound);
    dl.appendChild(h("dd", {class: diff("sound")}, r.sound ? h("span", "♪ " + soundName(r.sound) + " ",
      clip ? EZ.sound.button(r.sound, soundName(r.sound)) : null, " ", h("small.fe-sub", {title: "Type it in the " +
        "game's chat to hear the sound in game"}, (clip ? "in game: " : "to hear it, type in the game's chat: ") +
        ".playsound " + r.sound)) : h("span.fe-sub", "none")));
    let hoverDrawn = false;
    if (item) {
      const text = EZ.items.hoverText(item, r, ctx());
      const c = EZ.glyphs && EZ.glyphs.hover(text, {zoom: 1.2, tint: EZ.items.QUALITY_TINT[item.quality]});
      if (c) { card.appendChild(h("div.fe-pvhover", c)); hoverDrawn = true; }
      else if (EZ.glyphs && EZ.glyphs.available()) EZ.glyphs.want("hover", redraw);
    }
    // the hover box's filter lines: drawn above in the game's font; here only when that can't be drawn, or to say
    // that they differ from Erazure's
    if (r.desc && !hoverDrawn) {
      dl.appendChild(h("dt", "Hover"));
      dl.appendChild(h("dd", {class: diff("desc")}, h("div.fe-pvdesc", codedText(r.desc, "3"))));
    } else if (hoverDrawn && diff("desc")) {
      dl.appendChild(h("dt", "Hover"));
      dl.appendChild(h("dd", {class: "is-changed"}, h("span.fe-sub", "Its hover box lines differ from Erazure's.")));
    }
    card.appendChild(dl);
    return card;
  }

  /* ---------------------------------------------------------------- the settings */

  function levelNames(f) {
    const names = ["Show All Items"];
    for (const l of EZ.filter.levels(f.lines)) names.push(l.text.replace(/ÿc./g, "").trim());
    return names;
  }

  function select(options, value, onchange, label) {
    const s = h("select", {"aria-label": label, onchange: (e) => onchange(e.target.value)});
    for (const o of options) s.appendChild(h("option", {value: String(o.value), selected: String(o.value) === String(value)},
      o.text));
    return s;
  }

  function set(fn) {
    fn();
    save();
    draw();
    // the areas that show what the preview's item does (Erazure's rules) follow it
    try { document.dispatchEvent(new CustomEvent("fe-preview-item")); } catch (e) { /* an old browser */ }
  }

  function settings(f) {
    const names = levelNames(f);
    const lv = select(names.map((n, i) => ({value: i, text: i + " · " + n})), state.filtlvl,
      (v) => set(() => { state.filtlvl = +v; }), "Filter level");
    lv.classList.add("fe-pv-level");
    const clvl = h("input.fe-pv-num", {type: "number", min: 1, max: 99, value: state.clvl, "aria-label": "Character level",
      onchange: (e) => set(() => { state.clvl = Math.max(1, Math.min(99, +e.target.value || 1)); })});
    const cls = select(CLASSES.map((c, i) => ({value: i, text: c})), state.cls, (v) => set(() => { state.cls = +v; }),
      "Class");
    const diff = select(DIFFS.map((c, i) => ({value: i, text: c})), state.diff, (v) => set(() => { state.diff = +v; }),
      "Difficulty");
    const where = select(WHERE, state.where, (v) => set(() => { state.where = v; }), "Where you are");
    const o = state.opts;
    const opt = (label, k, sub) => toggle(label, !!o[k], (on) => set(() => { o[k] = on; }), {sub});
    const options = h("details.fe-pv-options", {open: state.open.options || null,
      ontoggle: (e) => { state.open.options = e.target.open; save(); }},
      h("summary", "The game's options"),
      h("div.fe-stack.fe-small",
        h("label.fe-row", "Detailed Notifications ", select([{value: 0, text: "Off"}, {value: 1, text: "All drops"},
          {value: 2, text: "New drops only"}], o.detailed, (v) => set(() => { o.detailed = +v; }), "Detailed Notifications")),
        opt("Drop Sounds", "dropSounds"),
        opt("Force Show Undiscovered", "forceUndiscovered", "on by default"),
        opt("Force Show Unowned", "forceUnowned"),
        opt("Hide Healing Potions", "hideHealing"),
        opt("Hide Mana Potions", "hideMana")));
    // where the character is (the item's own place is in The item); a scene has its own
    const sc = state.mode === "scene" ? SCENES.find((x) => x.id === state.scene) || SCENES[0] : null;
    const youAre = sc ? h("div.fe-pvfield", h("span", "You are"), h("span.fe-sub", {style: {padding: ".38em 0"}},
      sc.place[0].toUpperCase() + sc.place.slice(1) + " (the scene's own)")) : h("label.fe-pvfield", h("span", "You are"), where);
    const box = h("div.fe-pvctx",
      h("label.fe-pvfield.wide", h("span", "Filter level"), lv),
      h("label.fe-pvfield", h("span", "Character"), h("span.fe-row", clvl, cls)),
      h("label.fe-pvfield", h("span", "Difficulty"), diff),
      youAre,
      options);
    // on a phone the settings fold (one line), so the preview itself has the room
    if (EZ.app.isPhone && EZ.app.isPhone()) {
      const summary = `${state.filtlvl} · ${names[state.filtlvl] || ""}, level ${state.clvl} ${CLASSES[state.cls]}, ` +
        DIFFS[state.diff];
      return h("details.fe-pv-fold", {open: state.open.settings || null,
        ontoggle: (e) => { state.open.settings = e.target.open; save(); }},
        h("summary", "Settings: " + summary), box);
    }
    return box;
  }

  /* ---------------------------------------------------------------- the item */

  /* The item to look at (to change one, Items has its own search): the keyboard's combo box. */
  function picker() {
    const choose = (p) => set(() => {
      state.spec = Object.assign({}, p.spec);
      state.notes = [];
      const b = EZ.items.base(p.spec.code);
      if (b && !b.misc && !p.spec.quality) state.spec.quality = "NORM";
    });
    const search = EZ.ui.combo({placeholder: "Look at an item: Ber, Shako, Thresher…", label: "Look at an item",
      find: (q) => EZ.items.search(q, 14).map((p) => ({label: p.label, sub: p.sub, pick: () => choose(p)})),
      empty: () => "Nothing by that name"});
    search.box.style.flex = "1 1 auto";
    search.box.style.marginBottom = "0";
    const paste = h("button.fe-btn.small", {type: "button", title: "An item copied in the game (Ctrl+C)",
      onclick: pasteDialog}, "Paste from the game");
    return h("div.fe-row.fe-pv-pickrow", {style: {flexWrap: "nowrap", marginBottom: ".6em"}}, search.box, paste);
  }

  /* An item BH copied in the game: point at it, Ctrl+C, paste here. */
  function pasteDialog() {
    const ta = h("textarea", {rows: 9, placeholder: "{\n  \"type\": \"Shako\",\n  \"quality\": \"Unique\", …\n}",
      "aria-label": "The item copied in the game"});
    const msg = h("p.fe-sub", {role: "status"});
    EZ.ui.dialog({title: "Paste an item from the game", body: [
      h("p", "In game, point at an item and press ", h("kbd", "Ctrl"), " + ", h("kbd", "C"),
        ": the game copies it and the chat says “Copied item to clipboard”. Paste it here (", h("kbd", "Ctrl"), " + ",
        h("kbd", "V"), "). The preview shows it as it drops: on the ground, unidentified."),
      ta, msg],
      buttons: [{text: "Cancel"}, {text: "Use this item", primary: true, onclick: () => {
        try {
          const r = EZ.items.fromGame(ta.value);
          // shown as it dropped: on the ground and unidentified (hides only work there); The item is and Identified
          // change it
          const spec = Object.assign({}, r.spec), was = {place: spec.place, id: spec.id};
          spec.place = "GROUND";
          if (!EZ.items.alwaysId(EZ.items.base(spec.code), spec.quality)) spec.id = false;
          set(() => { state.spec = spec; state.notes = r.notes; state.pasted = was; state.mode = "item"; });
          return false;
        } catch (e) {
          msg.textContent = e.message + ".";
          msg.className = "fe-note bad";
          return true;
        }
      }}]});
    setTimeout(() => ta.focus(), 30);
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then((t) => { if (!ta.value && /"type"\s*:/.test(t)) ta.value = t; }).catch(() => {});
    }
  }

  function itemEditor() {
    const spec = state.spec, b = EZ.items.base(spec.code);
    if (!b) return h("p.fe-note.bad", "This item isn't in the game's tables.");
    const q = spec.quality || "NORM";
    const u = spec.uni != null ? EZ.items.unique(spec.uni) : null;
    const nmag = q === "NORM" || q === "SUP" || q === "INF";
    const change = (fn) => set(() => fn(state.spec));
    const rows = [];
    // a T1-T4 map is white, magic or rare (a unique map is a base of its own)
    const qualities = u ? [u.kind] : b.maptier >= 1 && b.maptier <= 4 ? ["NORM", "MAG", "RARE"] : b.misc ?
      (b.groups.some((g) => ["JEWELRY", "CHARM", "QUIVER"].includes(g)) || b.code === "jew" || b.map ?
        ["NORM", "MAG", "RARE", "CRAFT", "UNI", "SET"] : ["NORM"]) : QUALITIES;
    if (qualities.length > 1) {
      rows.push(h("label.fe-pvfield", h("span", "Quality"), select(qualities.map((x) => ({value: x,
        text: EZ.items.QUALITY_NAMES[x]})), q, (v) => change((s) => { s.quality = v; delete s.uni; }), "Quality")));
    }
    const flags = h("div.fe-row.fe-small");
    if (!EZ.items.alwaysId(b, q)) flags.appendChild(toggle("Identified", !!spec.id, (on) => change((s) => { s.id = on; })));
    if (b.canEth && !(u && u.eth)) flags.appendChild(toggle("Ethereal", !!spec.eth, (on) => change((s) => { s.eth = on; })));
    if (q === "UNI" || q === "SET") {
      flags.appendChild(toggle("Discovered", spec.discovered !== false, (on) => change((s) => { s.discovered = on; })));
    }
    if (flags.childNodes.length) rows.push(flags);
    // the corruption (and an amulet's desecration): the outcomes the cube gives this item as it is now; picking one
    // adds its stats (at the item's rolls), a socket outcome its sockets (an item pasted from the game keeps its own)
    if (!spec.noProps) {
      const list = EZ.items.corruptionsFor(spec);
      const field = (label, key, none) => {
        const cur = spec[key] || 0;
        const opts = [{value: 0, text: none}].concat(list.map((o) => ({value: o.n, text: o.name})));
        if (cur && !list.some((o) => o.n === cur)) {
          opts.push({value: cur, text: "Outcome " + cur + " (not one this item gets as it is now)"});
        }
        return h("label.fe-pvfield", h("span", label), select(opts, cur, (v) => change((s) => {
          const n = +v || 0;
          if (n) s[key] = n; else delete s[key];
          if (key === "corrupt" && !n) delete s.desecrate;
          const o = list.find((x) => x.n === n);
          if (o && o.sockets && !(s.sockets > 0)) {
            const ilvl = s.ilvl === undefined ? 85 : s.ilvl;
            const cap = b.maxsock ? (ilvl <= 25 ? b.maxsock[0] : ilvl <= 40 ? b.maxsock[1] : b.maxsock[2]) : 6;
            s.sockets = Math.max(1, Math.min(o.sockets, cap || o.sockets, 6));
          }
          // its stats are what an identified item shows: a magical item with them is identified
          if (o && o.stats.length && !EZ.items.alwaysId(b, s.quality) && !s.id) {
            s.id = true;
            EZ.ui.toast("Identified, so the loot filter can read the corruption's stats.");
          }
        }), label));
      };
      if (list.length || spec.corrupt) rows.push(field("Corruption", "corrupt", "Not corrupted"));
      if (spec.corrupt && b.code === "amu") rows.push(field("Desecration", "desecrate", "Not desecrated"));
    }
    const nums = h("div.fe-row.fe-small");
    const numField = (label, value, min, max, fn) => h("label.fe-row", label + " ",
      h("input.fe-pv-num", {type: "number", min, max, value, onchange: (e) => change((s) => fn(s,
        Math.max(min, Math.min(max, Math.round(+e.target.value || 0)))))}));
    if (b.sockets) nums.appendChild(numField("Sockets", spec.sockets || 0, 0, 6, (s, v) => { s.sockets = v; }));
    if (!b.misc || !nmag || b.map) nums.appendChild(numField("Item level", spec.ilvl === undefined ? 85 : spec.ilvl, 1, 99,
      (s, v) => { s.ilvl = v; }));
    if (b.code === "gld") nums.appendChild(numField("Gold", spec.gold || 1, 1, 1000000, (s, v) => { s.gold = v; }));
    else if (b.stack) nums.appendChild(numField("Quantity", spec.qty || 1, 1, 500, (s, v) => { s.qty = v; }));
    if (u && u.props.some(([, , lo, hi]) => lo !== hi)) {
      nums.appendChild(h("label.fe-row", "Rolls ", h("input", {type: "range", min: 0, max: 100, value:
        Math.round((spec.roll === undefined ? 1 : spec.roll) * 100), "aria-label": "Rolls, lowest to highest",
        onchange: (e) => change((s) => { s.roll = +e.target.value / 100; })})));
    }
    if (nums.childNodes.length) rows.push(nums);
    rows.push(h("div.fe-row.fe-small", h("label.fe-row", "The item is ", select(PLACES, spec.place || "GROUND",
      (v) => change((s) => { s.place = v; }), "Where the item is")),
      h("label.fe-row", "Sells for ", h("input.fe-pv-num.wide", {type: "number", min: 0, value: spec.sell === undefined ? "" : spec.sell,
        placeholder: "?", title: "The gold a vendor pays (Malah): rules about sell value ask it",
        onchange: (e) => change((s) => { s.sell = e.target.value === "" ? undefined : Math.max(0, +e.target.value); })}))));
    rows.push(statsEditor());
    const PLACE_NAME = {INVENTORY: "your inventory", STASH: "your stash", CUBE: "the Cube", EQUIPPED: "equipped",
                        GROUND: "on the ground"};
    const was = spec.noProps && state.pasted;
    const notes = spec.noProps ? h("div",
      was ? h("p.fe-note.fe-small", "Pasted from the game and shown as it drops: on the ground" +
        (spec.id === false && was.id ? " and unidentified" : "") + " (it was copied " + (PLACE_NAME[was.place] ?
        (was.place === "EQUIPPED" ? "equipped" : "in " + PLACE_NAME[was.place]) : "in your inventory") +
        (was.id ? ", identified" : "") + "). The item is and Identified below change it.") : null,
      state.notes && state.notes.length ? h("p.fe-note.fe-small", "From the game. Not in the game's copy: " +
        state.notes.join("; ") + ".") : null) : null;
    return h("div.fe-pv-item", h("div.fe-pv-itemname", EZ.items.describe(spec),
      spec.noProps ? h("span.fe-pill.info", {style: {marginLeft: ".5em"}}, "from the game") : null), notes, rows);
  }

  let everyStat = false;  // the picker lists every stat, not only the ones this kind of item can have
  function statsEditor() {
    const spec = state.spec;
    const wrap = h("div.fe-pv-stats");
    const list = spec.stats || [];
    const magical = !EZ.items.alwaysId(EZ.items.base(spec.code), spec.quality);
    if (magical && !spec.id && list.length) {
      wrap.appendChild(h("p.fe-note.warn.fe-small", "Unidentified: the game shows the loot filter none of its stats, " +
        "so these count only once it is identified (switch Identified on above)."));
    }
    list.forEach(([sid, p, v], i) => {
      wrap.appendChild(h("span.fe-chip", {title: "stat " + sid + (p ? ", " + p : "")}, EZ.items.statText(sid, p, v),
        h("button.fe-btn.ghost.small", {type: "button", "aria-label": "Remove",
        onclick: () => set(() => { spec.stats.splice(i, 1); })}, "✕")));
    });
    /* Adding one: a list that opens with one click (or as you type, every word found), each stat with its rolls on
       this kind of item; the stat picked shows under it with its value (its highest roll to start with) and, for a
       skill, class or tab, its parameter, then Add (or Enter). */
    const choices = EZ.items.statChoices(spec, everyStat);
    // (a stat whose line shows no number, "Map contains Ghosts", has no rolls to tell: its value is a monster's number)
    const rolls = (c) => !c.range || !/X/.test(c.name) ? "" : c.range[0] === c.range[1] ? "rolls " + c.range[0]
      : "rolls " + c.range[0] + " to " + c.range[1];
    const best = (c) => {
      if (c.range) return Math.abs(c.range[0]) > Math.abs(c.range[1]) ? c.range[0] : c.range[1];
      const roll = EZ.maps && EZ.maps.rollOf ? EZ.maps.rollOf(c.id) : undefined;
      return roll !== undefined ? roll : /X/.test(c.name) ? 10 : 1;
    };
    let chosen = null;
    const val = h("input.fe-pv-num", {type: "number", value: 10, "aria-label": "Its value"});
    const param = h("input.fe-pv-num", {type: "number", value: 0, "aria-label": "Its parameter (a skill, class or tab number)"});
    const paramBox = h("label.fe-row", "Parameter ", param);
    const chosenName = h("b"), chosenRolls = h("span.fe-sub");
    const addIt = () => {
      if (!chosen) return;
      const c = chosen;
      set(() => {
        (spec.stats = spec.stats || []).push([c.id, c.param ? +param.value || 0 : 0, +val.value || 0]);
        // stats are what an identified item shows: a magical item with one is identified
        if (magical && !spec.id) { spec.id = true; EZ.ui.toast("Identified, so the loot filter can read its stats."); }
      });
    };
    const chosenRow = h("div.fe-pv-statchosen", {hidden: true},
      h("div.fe-row.fe-small", chosenName, chosenRolls),
      h("div.fe-row.fe-small", h("label.fe-row", "Value ", val), paramBox,
        h("button.fe-btn.small.primary", {type: "button", onclick: addIt}, "Add"),
        h("button.fe-btn.ghost.small", {type: "button", onclick: () => { chosen = null; chosenRow.hidden = true; }},
          "Cancel")));
    for (const box of [val, param]) {
      box.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); addIt(); }
        else if (e.key === "Escape") { e.preventDefault(); chosen = null; chosenRow.hidden = true; }
      });
    }
    const choose = (c) => {
      chosen = c;
      chosenName.textContent = c.name;
      chosenRolls.textContent = rolls(c) ? "(" + rolls(c) + " on this kind of item)" : "";
      val.value = best(c);
      param.value = 0;
      paramBox.hidden = !c.param;
      chosenRow.hidden = false;
      setTimeout(() => { val.focus(); val.select(); }, 0);
    };
    const pick = EZ.ui.combo({placeholder: "Pick a stat to add: click here, or type to search", label: "Pick a stat to add",
      all: true,
      find: (q) => {
        const words = q.toLowerCase().split(/\s+/).filter(Boolean);
        return choices.filter((c) => words.every((w) => c.name.toLowerCase().indexOf(w) >= 0))
          .map((c) => ({label: c.name, sub: rolls(c), pick: () => choose(c)}));
      },
      empty: (q) => `No stat matches "${q}"` + (everyStat ? "." : ": tick “List every stat” below to look further.")});
    const every = h("label.fe-row.fe-small", h("input", {type: "checkbox", checked: everyStat, onchange: (ev) => {
      everyStat = ev.target.checked; redraw(); }}), h("span.fe-sub", "List every stat (not only the ones this kind of " +
      "item can have)"));
    add(wrap, [h("div.fe-pv-statpick", pick.box), chosenRow, every]);
    return h("details.fe-pv-statsbox", {open: list.length ? true : null}, h("summary", "Stats" +
      (list.length ? " (" + list.length + ")" : "")), wrap);
  }

  /* ---------------------------------------------------------------- how it was built, and every level */

  function traceView(f, r) {
    if (!r) return null;
    const where = (i) => app.lineLink(f.lines, i);  // Erazure's lines as Erazure's rules numbers them, yours by name
    // the rules that ask what this preview leaves open (a stat, its sell price…) show too, dimmed: they may match
    const KIND = {stop: ["decides", "This rule decides the label: the rules after it don't change it"],
                  continue: ["adds to it", "This rule adds to the label (its tags, its colors), and the rules after it go on"],
                  maybe: ["may match", "This rule asks something the preview leaves open: add it under The item to know"],
                  notify: ["alert", "This rule gives an alert: a minimap icon, a chat line or a sound"]};
    const done = r.trace.filter((t) => t.kind !== "maybe").length, maybes = r.trace.length - done;
    const rows = r.trace.map((t) => {
      const rule = f.F.byLine.get(t.i);
      const [kind, tip] = KIND[t.kind] || KIND.notify;
      const tags = [];
      if (t.notify || t.kind === "notify") tags.push(r.chatRule === t.i ? "chat" : null, r.soundRule === t.i ? "sound" : null,
        r.icons.some((x) => x.i === t.i) ? "icon" : null);
      return h("li.fe-trace-row" + (t.kind === "maybe" ? ".maybe" : ""),
        h("span.fe-trace-where", where(t.i)), h("span.fe-pill", {title: tip}, kind),
        tags.filter(Boolean).map((x) => h("span.fe-pill.info", x)),
        h("code.fe-trace-text", rule ? (rule.cond.length > 90 ? rule.cond.slice(0, 88) + "…" : rule.cond) : ""));
    });
    return h("details.fe-pv-trace", {open: state.open.trace || null,
      ontoggle: (e) => { state.open.trace = e.target.open; save(); }},
      h("summary", "How it's built (" + done + " rule" + (done === 1 ? "" : "s") + (maybes ? ", " + maybes + " may match" : "") +
        ")"),
      maybes ? h("p.fe-sub.fe-small", "The dimmed rules ask what this preview leaves open, such as a stat or the price a " +
        "vendor pays: add it under The item (Stats, Sells for) to see whether they match.") : null,
      h("ol.fe-trace", rows.length ? rows : h("li.fe-sub", "No rule matched: the game's own name.")));
  }

  /* The item at every filter level: a row per level with its name and the label at the size it reads (a long one
     scrolls in its row rather than shrinking), a gold edge where the player's filter differs from Erazure's. */
  function levelsView(base, mine) {
    const f = mine || base;
    const names = levelNames(f);
    const strip = h("div.fe-pv-levelrows");
    let changedN = 0;
    for (let lv = 0; lv < names.length; lv++) {
      const r = run(f, state.spec, lv);
      const rb = mine ? run(base, state.spec, lv) : null;
      const changed = !!(mine && r && rb && outcome(r) !== outcome(rb));
      if (changed) changedN++;
      const shown = r && r.name && !r.invisible && !r.hidden;
      strip.appendChild(h("button.fe-pv-levelrow" + (lv === state.filtlvl ? ".on" : "") + (changed ? ".is-changed" : ""),
        {type: "button", title: "Show the item at " + lv + " · " + names[lv], "aria-pressed": String(lv === state.filtlvl),
          onclick: () => set(() => { state.filtlvl = lv; })},
        h("span.fe-pv-lv", h("b", String(lv)), " " + names[lv]),
        h("span.fe-pv-levellabel", shown ? labelNode(r.name, r.start, 1) : (EZ.render.hiddenNode(r) ||
          h("span.fe-pv-hidden", "No label"))),
        h("span.fe-row.fe-small.fe-pv-levelalerts", r && r.icons.length ? iconCanvas(r.icons, 2) : null,
          r && r.sound ? h("span.fe-pv-snd", {title: soundName(r.sound)}, "♪") : null,
          changed ? h("span.fe-pill.accent", {title: "Your filter differs from Erazure's here"}, "changed") : null)));
    }
    return h("details.fe-pv-levels", {open: state.open.levels || null,
      ontoggle: (e) => { state.open.levels = e.target.open; save(); }},
      h("summary", "At every filter level" + (mine ? changedN ? ` (yours differs on ${changedN} level${changedN === 1 ? "" :
        "s"})` : " (as Erazure's)" : "")),
      strip);
  }

  /* ---------------------------------------------------------------- views */

  function itemView(base, mine) {
    const rb = run(base, state.spec), rm = mine ? run(mine, state.spec) : null;
    const res = h("div.fe-pvres" + (mine ? ".two" : ""),
      resultCard(rb, mine ? "Erazure" : null, null, EZ.items.make(state.spec)),
      mine ? resultCard(rm, "Yours", rb, EZ.items.make(state.spec)) : null);
    const f = mine || base;
    return [picker(), h("details.fe-pv-editor", {open: state.open.item || null,
      ontoggle: (e) => { state.open.item = e.target.open; save(); }}, h("summary", "The item"), itemEditor()),
      res, traceView(f, mine ? rm : rb), levelsView(base, mine)];
  }

  /* The drop scene: the pile of a scene on its floor, in the player's filter (or Erazure's), the alerts below. */
  function sceneView(base, mine) {
    const sc = SCENES.find((x) => x.id === state.scene) || SCENES[0];
    const side = mine && state.sceneSide !== "erazure" ? mine : base;
    const zoom = 1.5;
    const pick = seg(SCENES.map((x) => ({value: x.id, text: x.title})), sc.id,
      (v) => set(() => { state.scene = v; }), {label: "Scene"});
    const which = mine ? seg([{value: "yours", text: "Yours"}, {value: "erazure", text: "Erazure"}],
      state.sceneSide === "erazure" ? "erazure" : "yours", (v) => set(() => { state.sceneSide = v; }),
      {label: "Whose filter"}) : null;
    const head = h("div.fe-row.fe-small", pick, which,
      toggle("Show hidden", !!state.showHidden, (on) => set(() => { state.showHidden = on; })));
    // whose filter, at which level and where: first, under the scene's tabs
    const lvName = levelNames(side)[state.filtlvl] || "";
    const note = h("p.fe-sub.fe-small.fe-scene-note", (mine ? side === mine ? "Your filter" : "Erazure's filter" :
      "Erazure's filter (you have no changes yet)") + ` at ${state.filtlvl} · ${lvName}, ${sc.place}` +
      (mine && side === mine ? "; your changes have a gold edge" : "") + ". Click a drop to look at it.");
    if (!EZ.scene.available() || !EZ.glyphs.available()) {
      return [head, h("p.fe-note", "The scene needs the game's pictures and font (Erazure-Filter-Editor-Assets); " +
        "they aren't with this page. The Item and Samples views work without them.")];
    }
    if (!EZ.glyphs.ready("label")) {
      EZ.glyphs.want("label", redraw);
      return [head, h("p.fe-sub", h("span.fe-spin"), " Loading the game's font…")];
    }
    const items = [], log = [];
    const c = Object.assign(ctx(), {mapid: sc.mapid});
    for (const spec of sc.items) {
      const it = EZ.items.make(spec);
      if (!it) continue;
      const r = EZ.engine.run(side.F, it, c, state.opts);
      let changed = false;
      if (mine && side === mine) {
        const rb = EZ.engine.run(base.F, it, c, state.opts);
        changed = outcome(rb) !== outcome(r);
      }
      const label = r.name && !r.invisible ? EZ.glyphs.label(r.name, {start: r.start, zoom}) : null;
      items.push({label, zoom, code: spec.code, hidden: r.hidden, invisible: r.invisible, spec, r, changed});
      if (r.chat !== null || r.sound || r.icons.length) log.push({spec, r, changed});
    }
    const holder = h("div.fe-scene", h("p.fe-sub", h("span.fe-spin"), " Drawing…"));
    EZ.scene.load(sc.floor).then((pics) => {
      const avail = Math.max(240, (holder.clientWidth || 480) / zoom);
      const out = EZ.scene.draw(pics, items, {zoom, seed: sc.id, showHidden: state.showHidden, fit: avail});
      const g = out.canvas.getContext("2d"), k = zoom * (window.devicePixelRatio || 1);
      g.strokeStyle = "#d8b45e";
      g.lineWidth = Math.max(1, k);
      for (const p of out.where) {
        if (p.item.changed) g.strokeRect(p.x * k - 2, p.y * k - 2, p.w * k + 4, (p.h - 30) * k + 4);
      }
      out.canvas.addEventListener("click", (e) => {
        const r = out.canvas.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * out.w,
              sy = (e.clientY - r.top) / r.height * out.h;
        const hit = out.where.find((p) => sx >= p.x && sx <= p.x + p.w && sy >= p.y && sy <= p.y + p.h);
        if (hit) set(() => { state.spec = Object.assign({}, hit.item.spec); state.mode = "item"; });
      });
      out.canvas.title = "Click an item to look at it";
      out.canvas.setAttribute("role", "img");
      out.canvas.setAttribute("aria-label", "The drops on the floor: " + items.filter((x) => !x.invisible)
        .map((x) => EZ.items.describe(x.spec)).join(", "));
      fill(holder, out.canvas);
    });
    // the alerts, each a button to the item (the scene's picture needs a mouse; this list doesn't)
    const open = (spec) => set(() => { state.spec = Object.assign({}, spec); state.mode = "item"; });
    const alerts = h("ul.fe-scene-log", log.map(({spec, r, changed}) => h("li" + (changed ? ".is-changed" : ""),
      h("button.fe-linkbtn.fe-scene-open", {type: "button", title: "Look at it in the Item view",
        "aria-label": "Look at " + EZ.items.describe(spec), onclick: () => open(spec)},
        r.icons.length ? iconCanvas(r.icons, 2) : h("span.fe-scene-noicon"),
        r.chat !== null ? chatNode(r.chat || EZ.items.describe(spec), r.start) : h("span.fe-sub", EZ.items.describe(spec))),
      r.sound ? h("span.fe-small", "♪ " + soundName(r.sound), " ", EZ.sound.button(r.sound, soundName(r.sound))) :
        null)));
    return [head, note, holder, log.length ? h("h4.fe-scene-h", "Alerts, in drop order") : null, alerts];
  }

  function samplesView(base, mine) {
    const grid = h("div.fe-pv-samples");
    for (const spec of SAMPLES) {
      if (!EZ.items.base(spec.code)) continue;
      const rb = run(base, spec), rm = mine ? run(mine, spec) : rb;
      const changed = mine && outcome(rb) !== outcome(rm);
      const shown = rm.name && !rm.invisible && !rm.hidden;
      // a long label takes two columns, so it reads at its size
      const longest = shown ? Math.max(...EZ.render.plain(rm.name).split("\n").map((x) => x.length)) : 0;
      grid.appendChild(h("button.fe-pv-sample" + (changed ? ".is-changed" : "") + (longest > 22 ? ".wide" : ""),
        {type: "button", title: "Open in the item view",
          onclick: () => set(() => { state.spec = Object.assign({}, spec); state.mode = "item"; })},
        h("small.fe-sub", EZ.items.describe(spec)),
        h("span.fe-pv-sample-label", shown ? labelNode(rm.name, rm.start, 1) : EZ.render.hiddenNode(rm) ||
          h("span.fe-pv-hidden", "No label")),
        h("span.fe-row.fe-small", rm.icons.length ? iconCanvas(rm.icons, 2) : null,
          rm.sound ? h("span", {title: soundName(rm.sound)}, "♪") : null,
          changed ? EZ.ui.pill("changed", "accent") : null)));
    }
    const lvName = levelNames(mine || base)[state.filtlvl] || "";
    return [h("p.fe-sub.fe-small", (mine ? "How these drops look with your filter" : "How these drops look with " +
      "Erazure's filter (you have no changes yet)") + ` at ${state.filtlvl} · ${lvName}` +
      (mine ? "; what your changes change has a gold edge." : ".") + " Click one to look at it."), grid];
  }

  function draw() {
    if (!box || !app) return;
    EZ.items.init(app.data);
    let base, mine;
    try {
      base = erazure();
      mine = yours();
    } catch (e) {
      fill(box, h("div.fe-pv-head", h("h3", "Preview")), h("div.fe-pv-body", h("p.fe-note.bad",
        "The preview couldn't read the filter: " + (e && e.message || e))));
      if (window.console) console.error(e);
      return;
    }
    if (!base) { fill(box, h("div.fe-pv-head", h("h3", "Preview"))); return; }
    const head = h("div.fe-pv-head",
      h("div.fe-row", h("h3", {style: {margin: 0}}, "Preview"),
        seg([{value: "scene", text: "Scene"}, {value: "item", text: "Item"}, {value: "samples", text: "Samples"}],
          state.mode,
          (v) => set(() => { state.mode = v; }), {label: "Preview view"})),
      settings(mine || base));
    let body;
    try {
      body = state.mode === "samples" ? samplesView(base, mine) : state.mode === "scene" ? sceneView(base, mine) :
        itemView(base, mine);
    } catch (e) {
      body = [h("p.fe-note.bad", "The preview failed: " + (e && e.message || e))];
      if (window.console) console.error(e);
    }
    fill(box, head, h("div.fe-pv-body", body));
  }

  const redraw = debounce(draw, 250);

  return {
    render(b, a) { box = b; app = a; draw(); },
    changed(ev, a) { app = a; redraw(); },
    state, run, pairs, erazure, yours, withEdits, context, ctx, iconCanvas, SAMPLES, levelNames,
    saveState: () => save(),
  };
})();
