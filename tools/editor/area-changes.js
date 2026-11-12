/* Changes: what the player's changes do. A summary by area (and what needs a look), every item's label and alerts
   at a filter level, Erazure's beside the player's (only what changes, by default), the filter file's differences in
   a readable diff, and troubleshooting for "I didn't see my item". */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
(function () {
  "use strict";
  const {h, fill, pill, toggle} = EZ.ui;
  const view = {level: null, picked: false, onlyChanged: true, q: "", trouble: null, troubleLevel: null};
  const CHUNK = 250;

  const plain = (s) => String(s || "").replace(/ÿc./g, "").trim();
  const boxes = (r) => r.icons.map((x) => [x.border, x.map, x.dot, x.px]);
  /* the Horadric Cube's "- Custom (n changes)" mark is in every changed filter: not a change to the item */
  const CUSTOM_RE = / - Custom \(\d+ changes?\)/;
  const descOf = (r) => String(r.desc || "").replace(CUSTOM_RE, "");
  const looks = (r) => JSON.stringify([r.name, boxes(r), r.sound, r.chat, r.invisible]);
  const outcome = (r) => looks(r) + "|" + descOf(r);

  /* Every kind of drop the editor checks: each misc base as it drops, each weapon and armor base non-magical, magic
     and rare (unidentified), rings, amulets, jewels and charms magic and rare, each unique and set base unidentified;
     then the items the player's item changes are for, with their ethereal, sockets, enhanced defense and item level. */
  let specCache = null;
  function baseSpecs() {
    if (specCache) return specCache;
    const cat = EZ.items.catalog(), out = [], seen = new Set();
    const add = (spec) => {
      const k = spec.code + "|" + (spec.quality || "NORM");
      if (seen.has(k)) return;
      seen.add(k);
      out.push(spec);
    };
    for (const b of cat.bases.values()) {
      if (!b.spawnable && !b.quest && b.code !== "gld") continue;
      if (b.groups.indexOf("CHARM") >= 0) { add({code: b.code, quality: "MAG"}); continue; }
      if (b.groups.indexOf("JEWELRY") >= 0 || b.code === "jew") {
        add({code: b.code, quality: "MAG"});
        add({code: b.code, quality: "RARE"});
        continue;
      }
      if (!EZ.items.qualities(b)) { add(b.code === "gld" ? {code: b.code, gold: 1000} : {code: b.code}); continue; }
      add({code: b.code});
      add({code: b.code, quality: "MAG"});
      add({code: b.code, quality: "RARE"});
    }
    for (const u of cat.uniques) if (cat.bases.has(u.code)) add({code: u.code, quality: u.kind});
    specCache = out;
    return out;
  }

  /* The items an item change is for, as the table tries them: each base (at most 40) in each quality it picks, made to
     fit its ethereal, sockets, enhanced defense / damage and item level. */
  function changeSpecs(o) {
    const O = EZ.overrides, cat = EZ.items.catalog(), s = o.scope || {}, out = [];
    const quals = O.qualsOf(s), so = O.socketsOf(s), ed = O.edOf(s), [ia, ib] = O.ilvlOf(s);
    for (const code of (s.codes || []).slice(0, 40)) {
      const b = cat.bases.get(code);
      if (!b) continue;
      const qs = EZ.items.qualities(b) ? (quals.length ? quals : ["NORM"]) : [undefined];
      for (const q of qs) {
        const spec = {code};
        if (q && q !== "NORM") spec.quality = q;
        if (s.eth === "yes") spec.eth = true;
        if (s.id === "yes") spec.id = true;
        if (so.length) spec.sockets = so[so.length - 1];
        if (ed && (b.armor || b.weapon)) {
          if (!spec.quality || spec.quality === "INF") spec.quality = "SUP";
          spec.stats = [[b.armor ? 16 : 17, 0, ed]];
        }
        if (ia || ib) spec.ilvl = ia || ib;
        out.push(spec);
      }
    }
    return out;
  }

  function specs() {
    const extra = [], seen = new Set(baseSpecs().map((x) => JSON.stringify(x)));
    for (const o of (EZ.store.current().edits.items || []).filter(EZ.overrides.valid)) {
      for (const sp of changeSpecs(o)) {
        const k = JSON.stringify(sp);
        if (!seen.has(k)) { seen.add(k); extra.push(sp); }
      }
    }
    return extra.concat(baseSpecs());  // the changes' own items first
  }

  /* The filter levels the player's changes can change: the levels their item changes and map choices pick, a level
     made to behave like another; null when some change is for every level. */
  function touchedLevels(e) {
    const set = new Set();
    let every = false;
    const lv = (list) => { if (!list || !list.length) every = true; else for (const n of list) set.add(+n); };
    for (const k of ["options", "features", "featureParts", "looks", "remap", "sounds", "icons", "alerts", "volume",
                     "wishlists", "ops", "rules"]) {
      const v = e[k];
      if (v && (Array.isArray(v) ? v.length : typeof v === "object" ? Object.keys(v).length : true)) every = true;
    }
    for (const o of e.items || []) lv((o.scope || {}).levels);
    if (e.maps) {
      if ((e.maps.warn || []).length || (e.maps.hide || []).length) every = true;
      if ((e.maps.hideMaps || []).length) lv(e.maps.hideMapsLevels);
    }
    for (const n of Object.keys((e.levels || {}).copies || {})) set.add(+n);
    return every || !set.size ? null : [...set].sort((a, b) => a - b);
  }

  function cell(r, desc) {
    if (!r) return h("span.fe-sub", "?");
    const parts = [];
    if (r.invisible || r.hidden) parts.push(EZ.render.hiddenNode(r));
    else parts.push(EZ.render.label(r.name, {start: r.start}));
    if (r.icons.length && EZ.preview.iconCanvas) parts.push(EZ.preview.iconCanvas(r.icons, 2));
    if (r.sound) parts.push(h("span.fe-pv-snd", "♪ " + EZ.sounds.name(EZ.app.data || {}, r.sound)));
    if (r.chat !== null && !r.sound) parts.push(pill("chat", "info"));
    const row = h("div.fe-row.fe-small", parts);
    if (!desc) return row;
    const d = descOf(r);
    return h("div", row, d ? h("div.fe-minidesc", {title: "Its hover box lines"}, EZ.render.coded(d, "3"))
      : h("span.fe-sub.fe-small", "(no hover box lines)"));
  }

  /* ---------------------------------------------------------------- every item */

  function everyItem(app) {
    const P = EZ.preview;
    const card = h("section.fe-card", {id: "fe-ch-items"});
    const base = P && P.erazure && P.erazure(), mine = P && P.yours && P.yours();
    if (!base) { fill(card, h("p.fe-sub", "The preview isn't ready yet.")); return card; }
    const names = ["Show All Items"].concat(EZ.filter.levels(base.lines).map((l) => plain(l.text)));
    const touched = touchedLevels(EZ.store.current().edits);
    if (!view.picked) {  // start on a level the changes reach
      const want = P.state.filtlvl;
      view.level = !touched || touched.indexOf(want) >= 0 ? want : touched[0];
    }
    const table = h("tbody");
    const status = h("span.fe-sub.fe-small");
    let token = 0;
    const draw = () => {
      const my = ++token;
      EZ.ui.clear(table);
      if (!mine) { status.textContent = "No changes yet: every item is Erazure's."; return; }
      const list = specs(), q = view.q.trim().toLowerCase();
      const seen = new Set();  // two changes' items that read and draw alike: one row
      let k = 0, shown = 0, changed = 0;
      const step = () => {
        if (my !== token) return;
        const end = Math.min(list.length, k + CHUNK);
        for (; k < end; k++) {
          const spec = list[k];
          const ed = spec.stats && spec.stats.find(([sid]) => sid === 16 || sid === 17);
          const label = EZ.items.describe(spec) + (ed ? `, ${ed[2]}% enhanced ${ed[0] === 16 ? "defense" : "damage"}` : "") +
            (spec.ilvl ? ", item level " + spec.ilvl : "");
          if (q && label.toLowerCase().indexOf(q) < 0) continue;
          const a = P.run(base, spec, view.level), b = P.run(mine, spec, view.level);
          if (!a || !b) continue;
          const key = label + "|" + outcome(a) + "|" + outcome(b);
          if (seen.has(key)) continue;
          seen.add(key);
          const diff = outcome(a) !== outcome(b);
          if (diff) changed++;
          if (view.onlyChanged && !diff) continue;
          if (shown >= 400) continue;
          shown++;
          const descOnly = diff && looks(a) === looks(b);  // only the hover box differs: show it
          table.appendChild(h("tr" + (diff ? ".is-changed" : ""), h("td.fe-small", h("button.fe-btn.ghost.small",
            {type: "button", title: "Open it in the preview, at this filter level",
              onclick: () => app.showInPreview(spec, view.level)}, label),
            descOnly ? h("div.fe-sub.fe-small", "its hover box differs") : null),
            h("td", cell(a, descOnly)), h("td", cell(b, descOnly))));
        }
        status.textContent = `Your changes change ${changed.toLocaleString()} of ${k.toLocaleString()} drops at this ` +
          "level" + (k < list.length ? "…" : ".") + (shown >= 400 ? " (The first 400 are shown.)" : "");
        if (k < list.length) setTimeout(step, 0);
      };
      step();
    };
    const lv = h("select", {"aria-label": "Filter level", onchange: (e) => {
      view.level = +e.target.value;
      view.picked = true;
      draw();
    }}, names.map((n, i) => h("option", {value: String(i), selected: i === view.level},
      i + " · " + n + (touched && touched.indexOf(i) >= 0 ? " · changed" : ""))));
    const search = h("input", {type: "search", value: view.q, placeholder: "Only items named…", "aria-label": "Only items named"});
    search.addEventListener("input", EZ.ui.debounce(() => { view.q = search.value; draw(); }, 250));
    fill(card,
      h("h3", "Every item"),
      h("p.fe-sub", "Each kind of drop on the ground at one filter level, Erazure's label and alerts beside yours, " +
        "and first the items your item changes are for (ethereal, socketed, superior or high item level as they pick)."),
      P.context(() => app.drawArea()),
      touched && touched.length ? h("p.fe-note.fe-small", "Your changes touch filter level" + (touched.length > 1 ? "s " :
        " ") + touched.join(", ") + " only.") : null,
      h("div.fe-row", lv, search, toggle("Only what changes", view.onlyChanged, (v) => { view.onlyChanged = v; draw(); })),
      h("p", status),
      h("div.fe-tablewrap", h("table.fe-ch-table", h("thead", h("tr", h("th", "Item"), h("th", "Erazure"), h("th", "Yours"))),
        table)),
      h("p.fe-sub.fe-small", "Every changed filter writes \"Custom\" and its number of changes into the Horadric Cube's " +
        "hover box (on the version line): that alone doesn't count as a change here."));
    setTimeout(draw, 0);
    return card;
  }

  /* ---------------------------------------------------------------- the file's differences */

  function diffCard(app) {
    const card = h("section.fe-card", {id: "fe-ch-diff"});
    const out = h("div");
    const go = () => {
      const p = EZ.store.current();
      const before = app.versionLines();
      const after = EZ.edits.apply(app.src, p, before).lines;
      const edits = EZ.diff.lines(before, after);
      if (!edits) { fill(out, h("p.fe-note.warn", "Too many differences to show here.")); return; }
      const hunks = EZ.diff.hunks(edits, 2);
      const where = (hk) => {
        const at = hk.rows.find((r) => r.kind === "same" || r.kind === "del");
        return at ? app.lineLink(before, at.a) : app.lineLink(after, hk.b);
      };
      const adds = edits.filter((e) => e.kind === "add").length, dels = edits.filter((e) => e.kind === "del").length;
      fill(out, h("p.fe-sub", `${hunks.length.toLocaleString()} places: ${adds.toLocaleString()} lines added or ` +
        `changed, ${dels.toLocaleString()} taken out or changed (Erazure's short names for its looks and conditions ` +
        "left in; the saved file has them written out)."),
      hunks.slice(0, 150).map((hk) => h("div.fe-ch-hunk",
        h("div.fe-ch-where", "Near ", where(hk)),
        h("pre.fe-ch-pre", hk.rows.map((r) => h("span.fe-ch-" + r.kind, (r.kind === "add" ? "+ " : r.kind === "del" ?
          "- " : "  ") + (r.kind === "add" ? after[r.b] : before[r.a])))))),
      hunks.length > 150 ? h("p.fe-sub", `… and ${hunks.length - 150} more places.`) : null);
    };
    fill(card, h("h3", "The filter file's differences"),
      h("p.fe-sub", "Every line your changes add, change or take out of Erazure's version, line by line."),
      h("button.fe-btn", {type: "button", onclick: go}, "Show the differences"), out);
    return card;
  }

  /* ---------------------------------------------------------------- troubleshooting */

  /* "I didn't see my item": its own question (which item, at which filter level), answered for the item as it drops:
     on the ground outside town, at the character the line under it picks. */
  function trouble(app) {
    const P = EZ.preview;
    const card = h("section.fe-card", {id: "fe-ch-help"}, h("h3", "I didn't see my item"));
    const answer = h("div");
    const levels = P && P.erazure && P.erazure() ? ["Show All Items"].concat(EZ.filter.levels(P.erazure().lines)
      .map((l) => plain(l.text))) : [];
    if (view.troubleLevel === null && P && P.state) view.troubleLevel = P.state.filtlvl;
    const draw = () => {
      if (!P || !P.erazure || !P.erazure()) { fill(answer, h("p.fe-sub", "The preview isn't ready yet.")); return; }
      const spec = view.trouble;
      if (!spec) { fill(answer, h("p.fe-sub", "Name the item above, and the filter level you play on.")); return; }
      const f = P.yours() || P.erazure();
      const item = EZ.items.make(Object.assign({}, spec, {place: "GROUND"}));
      if (!item) { fill(answer, h("p.fe-note.bad", "This item isn't in the game's tables.")); return; }
      const c = Object.assign(P.ctx(view.troubleLevel), {mapid: 2});  // outside town
      const o = P.state.opts || {};
      const r = EZ.engine.run(f.F, item, c, o);
      const where = (i) => app.lineLink(f.lines, i);
      const lines = [];
      if (r.byOption) lines.push(["The game's Hide Healing / Mana Potions option hides it before any rule (Loot Filter " +
        "options)."]);
      else if (r.invisible) lines.push(["Hidden by ", where(r.stop), ", and no rule gives it an alert, so the game " +
        "draws nothing at all."]);
      else if (r.hidden) lines.push(["Its label is hidden by ", where(r.stop), "; " + (r.icons.length ?
        "its minimap icon still shows." : "no icon.")]);
      else lines.push(["It shows (decided by ", r.stop === null ? "no rule: the game's own name" : where(r.stop), ")."]);
      if (r.forced) lines.push(["The game's Force Show Undiscovered option shows it anyway (it isn't discovered yet)."]);
      if (r.chatRule === null && !r.invisible) lines.push(["No chat line: " + (o.detailed === 0 ?
        "Detailed Notifications is off." : "no rule gives it an alert at this level.")]);
      if (r.chatRule !== null && !r.sound) lines.push([o.dropSounds === false ? "No sound: Drop Sounds is off in the game's " +
        "options." : "No drop sound: the rule that gives its alert has none."]);
      fill(answer,
        h("p", h("b", EZ.items.describe(spec)), ", on the ground outside town at filter level " + view.troubleLevel + ":"),
        h("ul", lines.map((t) => h("li", t))),
        h("p.fe-sub.fe-small", "In the preview's Item view, How it's built lists every rule that builds its label."));
    };
    const safeDraw = () => {
      try { draw(); } catch (e) {  // an item the editor's list no longer has (after an update): ask again
        view.trouble = null;
        fill(answer, h("p.fe-sub", "Name the item above, and the filter level you play on."));
      }
    };
    const search = EZ.ui.combo({placeholder: view.trouble ? EZ.items.describe(view.trouble) :
      "Which item? Shako, Ber Rune, Grand Charm…", label: "Which item?",
      find: (q) => EZ.items.search(q, 12).map((p) => ({label: p.label, sub: p.sub, pick: () => {
        const b = EZ.items.base(p.spec.code);
        view.trouble = Object.assign({}, p.spec);
        if (b && EZ.items.qualities(b) && !view.trouble.quality) view.trouble.quality = "NORM";
        search.input.placeholder = EZ.items.describe(view.trouble);
        search.input.classList.add("has-value");
        safeDraw();
      }})), empty: (q) => `No item matches "${q}".`});
    if (view.trouble) search.input.classList.add("has-value");
    search.box.style.flex = "1 1 18em";
    const lvSel = h("select", {"aria-label": "The filter level you play on", onchange: (e) => {
      view.troubleLevel = +e.target.value;
      safeDraw();
    }}, levels.map((n, i) => h("option", {value: String(i), selected: i === view.troubleLevel}, i + " · " + n)));
    card.appendChild(h("div.fe-row", search.box, lvSel));
    if (P && P.context) card.appendChild(P.context(safeDraw, {ground: true, lead: "Your character: level"}));
    card.appendChild(answer);
    safeDraw();
    const go = (area, sub, text) => h("a", {href: "#" + area + (sub ? "/" + sub : ""), onclick: (e) => {
      e.preventDefault();
      app.go(area, sub);
    }}, text);
    card.appendChild(h("h4", "If nothing you change shows in game"));
    card.appendChild(h("ol.fe-steps",
      h("li", "The file is in ", h("code", "Diablo II\\ProjectD2\\filters\\local"), " and ends in ", h("code", ".filter"),
        " (not ", h("code", ".filter.txt"), ", an end Windows can hide), with no number your browser added to its " +
        "name, such as (1)."),
      h("li", "In the launcher: Item Filter Profiles, ", h("b", "Local Filter"), ", your file, ", h("b", "Save Filter"),
        ". Each profile saves to its own file: the launcher loads the one picked there (", go("start", "profiles",
          "your profiles and their files"), ")."),
      h("li", "After every change here: ", h("b", "Save to game"), " again (or download again and replace the file), " +
        "then press the reload filter key in game (", h("kbd", "Numpad 0"), " unless you changed it in Configure " +
        "Controls). The Horadric Cube's version line then ends with Custom and your number of changes."),
      h("li", "Options, Loot Filter: ", h("b", "Enable Loot Filter"), " is on, and the filter level is the one you " +
        "expect. Level 0 shows everything."),
      h("li", "Hiding works on the ground outside town only: an item dropped in town, or in your inventory and stash, " +
        "still shows (test it outside town)."),
      h("li", "A unique or set item you haven't discovered yet shows even where you hide it: the game's ",
        h("b", "Force Show Undiscovered"), " option, on by default."),
      h("li", "No sound: the game's ", h("b", "Drop Sounds"), " option; no chat line: ", h("b", "Detailed Notifications"),
        "; potions gone: the ", h("b", "Hide Healing / Mana Potions"), " options.")));
    // still stuck: a report to paste where people can help
    card.appendChild(h("h4", "Still stuck?"));
    card.appendChild(h("p.fe-sub", "Copy a report (your version, your changes as a share link, and this item with " +
      "the rules that decide it) and paste it in a message to ", h("b", "erazure"), " on Discord, with your question."));
    card.appendChild(h("button.fe-btn", {type: "button", onclick: () => copyReport(app)}, "Copy a report for Discord"));
    return card;
  }

  /* ---------------------------------------------------------------- the summary */

  function summary(app) {
    const ch = app.changes();
    const p = EZ.store.current();
    let report = null, lines = null;
    try {
      const r = EZ.edits.apply(app.src, p, app.versionLines());
      report = r.report;
      lines = r.lines;
    } catch (e) { report = {unplaced: [{area: "?", what: "", why: e.message}]}; }
    const rulesOf = (ls) => ls.filter((l) => l.startsWith("ItemDisplay[")).length;
    const before = rulesOf(app.versionLines()), after = lines ? rulesOf(lines) : before;
    const link = (id, text) => h("a", {href: "#" + id, onclick: (e) => { e.preventDefault(); app.go(id); }}, text);
    const rows = EZ.areas.filter((a) => (ch.byArea[a.id] || {}).n || (ch.byArea[a.id] || {}).w).map((a) => {
      const c = ch.byArea[a.id];
      return h("li", link(a.id, a.title), ": ",
        EZ.ui.plural(c.n, "change"), c.w ? h("span", " · ", pill("⚠ " + c.w + " need a look", "warn")) : null);
    });
    if (!ch.count) {
      return h("section.fe-card", {id: "fe-ch-summary"},
        h("h3", "Your changes"),
        h("p", "None yet: your filter is the launcher's " + ((app.variant() || {}).launcher || "Erazure") + "."),
        h("p.fe-sub", "Make a change in ", link("quick", "Quick Edits"), ", ", link("items", "Items"), " or ",
          link("alerts", "Alerts"), " (or pick a goal on ", link("start", "Start"), "), and what it does shows here, " +
          "item by item."));
    }
    // a change an Erazure update left with nowhere to go: named as its area lists it, with that area's link
    const unplaced = report && report.unplaced || [];
    const areaOf = (id) => EZ.areas.find((a) => a.id === id);
    return h("section.fe-card", {id: "fe-ch-summary"},
      h("h3", "Your changes"),
      h("ul", rows),
      unplaced.length ? h("div.fe-note.warn", h("b", "No longer apply: "),
        h("ul", unplaced.map((u) => {
          const a = areaOf(u.area);
          const what = u.area === "erazure" ? "your change to Erazure's rule " + JSON.stringify(u.what) : u.what;
          return h("li", (what ? what + ": " : "") + u.why + ". ", a ? h("span", "Edit or remove it in ",
            link(a.id, a.title), ".") : null);
        })),
        h("p.fe-sub.fe-small", "Erazure changed since you made these, so they do nothing now; your other changes work.")) : null,
      h("p.fe-sub.fe-small", `${after.toLocaleString()} rules (Erazure's version: ${before.toLocaleString()}` +
        (after !== before ? `, ${after > before ? "+" : ""}${(after - before).toLocaleString()}` : "") + "). More rules " +
        "take the game a little longer to load when the game starts or you reload the filter."));
  }

  const PLACE_WORDS = {field: "outside town", town: "in town", map: "in a T1-T3 map", uber: "in the Pandemonium Fortress"};

  /* A short report to paste in Discord when asking for help: the version, the changes by area (and a share link that
     loads them, when it fits), and the item asked about ("I didn't see my item"'s, else the preview's) with what
     Erazure's filter and the player's do with it (the lines that decide it). */
  async function report(app) {
    const P = EZ.preview, ch = app.changes(), v = app.variant() || {};
    const out = ["Erazure Filter Editor: " + (v.launcher || "?") + ", Erazure " + app.src.version];
    const areas = EZ.areas.filter((a) => (ch.byArea[a.id] || {}).n).map((a) => a.title + " " + ch.byArea[a.id].n);
    out.push("Changes: " + (ch.count ? ch.count + " (" + areas.join(", ") + ")" : "none") +
      (ch.warn ? ", " + ch.warn + " need a look" : ""));
    if (P && P.state && P.erazure && P.erazure()) {
      const s = P.state;
      const asked = view.trouble && EZ.items.base(view.trouble.code);
      const spec = asked ? Object.assign({}, view.trouble, {place: "GROUND"}) : s.spec;
      const level = asked ? view.troubleLevel : s.filtlvl;
      const cls = ["Amazon", "Sorceress", "Necromancer", "Paladin", "Barbarian", "Druid", "Assassin"][s.cls] || "?";
      out.push("Item: " + EZ.items.describe(spec) + " at filter level " + level + ", character level " + s.clvl + " " +
        cls + ", " + ["Normal", "Nightmare", "Hell"][s.diff] + ", " + (asked ? "outside town" :
          PLACE_WORDS[s.where] || s.where));
      for (const [who, f] of [["Erazure", P.erazure()], ["Yours", P.yours()]]) {
        if (!f) continue;
        let r = null;
        try { r = P.run(f, spec, level); } catch (e) { r = null; }
        if (!r) continue;
        const at = (i) => i === null || i === undefined ? "none" : app.lineRef(f.lines, i).text;
        out.push(who + ": " + (EZ.render.hiddenWords(r) || EZ.render.plain(r.name)) + " | decided by " + at(r.stop) +
          (r.sound ? " | sound " + r.sound + " (" + at(r.soundRule) + ")" : "") +
          (r.icons.length ? " | icon" : "") + (r.chat !== null ? " | chat" : ""));
      }
    }
    if (ch.count) {
      let url = "";
      try { url = await EZ.share.link(); } catch (e) { url = ""; }
      const room = 1900 - out.join("\n").length - 30;
      out.push(url && url.length <= room ? "My changes: " + url
        : "My changes: too many for a link; I can send the backup file (Back up my changes).");
    }
    return out.join("\n").slice(0, 1990);
  }

  async function copyReport(app) {
    const text = await report(app);
    try {
      await navigator.clipboard.writeText(text);
      EZ.ui.toast("Copied. Paste it in a message to erazure on Discord, with your question.", "good", {ms: 8000});
    } catch (e) {
      EZ.ui.dialog({title: "Your report", body: [h("p.fe-sub", "Copy it, and paste it in a message to erazure on " +
        "Discord with your question."), h("textarea", {rows: 9, readonly: true, text})]});
    }
  }

  if (EZ.app && EZ.app.saveMenu) {
    EZ.app.saveMenu.push((app) => ({text: "Copy a report for Discord", sub: "for help: your version, your changes and an item",
      onclick: () => copyReport(app)}));
  }

  EZ.areas.push({
    id: "changes", title: "Changes", icon: "⇄", order: 100, group: "d",
    render(box, app) {
      const any = app.changes().count > 0;  // with no changes, nothing to compare: the summary says where to start
      EZ.ui.add(box, [
        h("div.fe-area-head", h("div", h("h2", "Changes"),
          h("p.fe-sub", "What your changes do, item by item, and what to check when something doesn't show."))),
        summary(app), any ? everyItem(app) : null, any ? diffCard(app) : null, trouble(app)]);
      if (app.sub && box.querySelector("#fe-" + app.sub)) box.querySelector("#fe-" + app.sub).scrollIntoView();
    },
  });
})();
