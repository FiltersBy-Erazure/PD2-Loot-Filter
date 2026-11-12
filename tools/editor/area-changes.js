/* Changes: what the player's changes do. A summary by area (and what needs a look), every item's label and alerts
   at a filter level, Erazure's beside the player's (only what changes, by default), the filter file's differences in
   a readable diff, and troubleshooting for "I didn't see my item". */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
(function () {
  "use strict";
  const {h, fill, pill, seg, toggle} = EZ.ui;
  const view = {level: null, onlyChanged: true, q: ""};
  const CHUNK = 250;

  const plain = (s) => String(s || "").replace(/ÿc./g, "").trim();
  const boxes = (r) => r.icons.map((x) => [x.border, x.map, x.dot, x.px]);
  const outcome = (r) => JSON.stringify([r.name, boxes(r), r.sound, r.chat, r.invisible, r.desc]);

  /* Every kind of drop the editor checks: each misc base as it drops, each weapon and armor base non-magical, magic
     and rare (unidentified), rings, amulets, jewels and charms magic and rare, each unique and set base unidentified. */
  let specCache = null;
  function specs() {
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

  function cell(r) {
    if (!r) return h("span.fe-sub", "?");
    const parts = [];
    if (r.invisible) parts.push(h("span.fe-pv-hidden", "nothing (hidden, no alert)"));
    else if (r.hidden) parts.push(h("span.fe-pv-hidden", "no label"));
    else parts.push(EZ.render.label(r.name, {start: r.start}));
    if (r.icons.length && EZ.preview.iconCanvas) parts.push(EZ.preview.iconCanvas(r.icons, 2));
    if (r.sound) parts.push(h("span.fe-pv-snd", "♪ " + EZ.sounds.name(EZ.app.data || {}, r.sound)));
    if (r.chat !== null && !r.sound) parts.push(pill("chat", "info"));
    return h("div.fe-row.fe-small", parts);
  }

  /* ---------------------------------------------------------------- every item */

  function everyItem(app) {
    const P = EZ.preview;
    const card = h("section.fe-card", {id: "fe-ch-items"});
    const base = P && P.erazure && P.erazure(), mine = P && P.yours && P.yours();
    if (!base) { fill(card, h("p.fe-sub", "The preview isn't ready yet.")); return card; }
    const names = ["Show All Items"].concat(EZ.filter.levels(base.lines).map((l) => plain(l.text)));
    if (view.level === null) view.level = P.state.filtlvl;
    const table = h("tbody");
    const status = h("span.fe-sub.fe-small");
    let token = 0;
    const draw = () => {
      const my = ++token;
      EZ.ui.clear(table);
      if (!mine) { status.textContent = "No changes yet: every item is Erazure's."; return; }
      const list = specs(), q = view.q.trim().toLowerCase();
      let k = 0, shown = 0, changed = 0;
      const step = () => {
        if (my !== token) return;
        const end = Math.min(list.length, k + CHUNK);
        for (; k < end; k++) {
          const spec = list[k];
          const label = EZ.items.describe(spec);
          if (q && label.toLowerCase().indexOf(q) < 0) continue;
          const a = P.run(base, spec, view.level), b = P.run(mine, spec, view.level);
          if (!a || !b) continue;
          const diff = outcome(a) !== outcome(b);
          if (diff) changed++;
          if (view.onlyChanged && !diff) continue;
          if (shown >= 400) continue;
          shown++;
          table.appendChild(h("tr" + (diff ? ".is-changed" : ""), h("td.fe-small", h("button.fe-btn.ghost.small",
            {type: "button", title: "Open in the preview", onclick: () => {
              P.state.spec = Object.assign({}, spec);
              P.state.mode = "item";
              P.changed({}, app);
              if (!app.els.root.classList.contains("pv-open") && window.innerWidth <= 1000) app.els.root.classList.add("pv-open");
            }}, label)), h("td", cell(a)), h("td", cell(b))));
        }
        status.textContent = `${changed.toLocaleString()} of ${k.toLocaleString()} kinds of drop change` +
          (k < list.length ? "…" : "") + (shown >= 400 ? " (the first 400 shown)" : "");
        if (k < list.length) setTimeout(step, 0);
      };
      step();
    };
    const lv = h("select", {"aria-label": "Filter level", onchange: (e) => { view.level = +e.target.value; draw(); }},
      names.map((n, i) => h("option", {value: String(i), selected: i === view.level}, i + " · " + n)));
    const search = h("input", {type: "search", value: view.q, placeholder: "Only items named…", "aria-label": "Only items named"});
    search.addEventListener("input", EZ.ui.debounce(() => { view.q = search.value; draw(); }, 250));
    fill(card,
      h("h3", "Every item"),
      h("p.fe-sub", "Each kind of drop on the ground at one filter level, with the preview's character and place: " +
        "Erazure's label and alerts beside yours."),
      h("div.fe-row", lv, search, toggle("Only what changes", view.onlyChanged, (v) => { view.onlyChanged = v; draw(); })),
      h("p", status),
      h("div.fe-tablewrap", h("table.fe-ch-table", h("thead", h("tr", h("th", "Item"), h("th", "Erazure"), h("th", "Yours"))),
        table)));
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
      const secA = EZ.filter.sections(app.src, before), secB = EZ.filter.sections(app.src, after);
      const where = (secs, i) => {
        const own = EZ.rules.locate(after, i);
        if (secs === secB && own) return (own.block === "top" ? "your rules above:" : "your rules below:") + own.n;
        const name = EZ.filter.sectionOf(secs, i);
        return name ? name.replace(/\.filter$/, "") + ":" + (i - secs[name][0] + 1) : "line " + (i + 1);
      };
      const adds = edits.filter((e) => e.kind === "add").length, dels = edits.filter((e) => e.kind === "del").length;
      fill(out, h("p.fe-sub", `${hunks.length.toLocaleString()} places: ${adds.toLocaleString()} lines added or ` +
        `changed, ${dels.toLocaleString()} taken out or changed (aliases as Erazure writes them; the saved file has ` +
        "them written out)."),
      hunks.slice(0, 150).map((hk) => h("div.fe-ch-hunk",
        h("div.fe-ch-where", where(secA, hk.a) + (hk.a !== hk.b ? "  →  " + where(secB, hk.b) : "")),
        h("pre.fe-ch-pre", hk.rows.map((r) => h("span.fe-ch-" + r.kind, (r.kind === "add" ? "+ " : r.kind === "del" ?
          "- " : "  ") + (r.kind === "add" ? after[r.b] : before[r.a])))))),
      hunks.length > 150 ? h("p.fe-sub", `… and ${hunks.length - 150} more places.`) : null);
    };
    fill(card, h("h3", "The filter file's differences"),
      h("p.fe-sub", "Every line your changes add, change or take out of Erazure's version, as a diff."),
      h("button.fe-btn", {type: "button", onclick: go}, "Show the differences"), out);
    return card;
  }

  /* ---------------------------------------------------------------- troubleshooting */

  function trouble(app) {
    const P = EZ.preview;
    const card = h("section.fe-card", {id: "fe-ch-help"}, h("h3", "I didn't see my item"));
    const f = P && (P.yours() || P.erazure());
    const spec = P && P.state && P.state.spec;
    if (f && spec) {
      const r = P.run(f, spec);
      const o = P.state.opts || {};
      const item = EZ.items.describe(spec), lines = [];
      const secs = EZ.filter.sections(app.src, f.lines);
      const where = (i) => {
        const own = EZ.rules.locate(f.lines, i);
        if (own) return (own.block === "top" ? "your rules above Erazure's, line " : "your rules below, line ") + own.n;
        const name = EZ.filter.sectionOf(secs, i);
        return name ? name.replace(/\.filter$/, "") + ":" + (i - secs[name][0] + 1) : "line " + (i + 1);
      };
      if (r.byOption) lines.push("The game's Hide Healing / Mana Potions option hides it before any rule (Loot Filter options).");
      else if (r.invisible) lines.push(`Hidden by ${where(r.stop)}, and no rule gives it an alert, so BH draws nothing at all.`);
      else if (r.hidden) lines.push(`Its label is hidden by ${where(r.stop)}; ${r.icons.length ? "its minimap icon still shows" :
        "no icon"}.`);
      else lines.push(`It shows (decided by ${r.stop === null ? "no rule: the game's own name" : where(r.stop)}).`);
      if (r.forced) lines.push("The game's Force Show Undiscovered option shows it anyway (it isn't discovered yet).");
      if (r.chatRule === null && !r.invisible) lines.push("No chat line: " + (o.detailed === 0 ? "Detailed Notifications is off." :
        "no rule gives it an alert at this level."));
      if (r.chatRule !== null && !r.sound) lines.push(o.dropSounds === false ? "No sound: Drop Sounds is off in the game's options." :
        "No drop sound: the rule that gives its alert has none.");
      card.appendChild(h("p", "The preview's item, ", h("b", item), ", at level " + P.state.filtlvl + ":"));
      card.appendChild(h("ul", lines.map((t) => h("li", t))));
      card.appendChild(h("p.fe-sub.fe-small", "Pick another item, level or character in the preview; its Item view lists " +
        "every rule that builds the label (How it's built)."));
    }
    card.appendChild(h("h4", "If nothing you change shows in game"));
    card.appendChild(h("ol.fe-steps",
      h("li", "The file is in ", h("code", "Diablo II\\ProjectD2\\filters\\local"), " and ends in ", h("code", ".filter"),
        " (not ", h("code", ".filter.txt"), ": Windows can hide that end)."),
      h("li", "In the launcher: Item Filter Profiles, ", h("b", "Local Filter"), ", your file, ", h("b", "Save Filter"), "."),
      h("li", "In game, after every save: press ", h("kbd", "Numpad 0"), " to reload the filter."),
      h("li", "Options, Loot Filter: ", h("b", "Enable Loot Filter"), " is on, and the filter level is the one you " +
        "expect (", h("kbd", "Ctrl"), "+", h("kbd", "Numpad 0-9"), " jumps to levels 0-9). Level 0 shows everything."),
      h("li", "No sound: the game's ", h("b", "Drop Sounds"), " option; no chat line: ", h("b", "Detailed Notifications"),
        "; potions gone: the ", h("b", "Hide Healing / Mana Potions"), " options.")));
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
    const rows = EZ.areas.filter((a) => (ch.byArea[a.id] || {}).n || (ch.byArea[a.id] || {}).w).map((a) => {
      const c = ch.byArea[a.id];
      return h("li", h("a", {href: "#" + a.id, onclick: (e) => { e.preventDefault(); app.go(a.id); }}, a.title), ": ",
        EZ.ui.plural(c.n, "change"), c.w ? h("span", " · ", pill("⚠ " + c.w + " need a look", "warn")) : null);
    });
    return h("section.fe-card", {id: "fe-ch-summary"},
      h("h3", "Your changes"),
      ch.count ? h("ul", rows) : h("p.fe-sub", "None yet: your filter is Erazure's own " + ((app.variant() || {}).launcher || "") + "."),
      report && report.unplaced && report.unplaced.length ? h("div.fe-note.warn", h("b", "Not placed: "),
        h("ul", report.unplaced.map((u) => h("li", (u.what ? u.what + ": " : "") + u.why)))) : null,
      h("p.fe-sub.fe-small", `${after.toLocaleString()} rules (Erazure's version: ${before.toLocaleString()}` +
        (after !== before ? `, ${after > before ? "+" : ""}${(after - before).toLocaleString()}` : "") + "). More rules " +
        "take BH a little longer to load when the game starts or you reload the filter."));
  }

  EZ.areas.push({
    id: "changes", title: "Changes", icon: "⇄", order: 100, group: "d",
    render(box, app) {
      EZ.ui.add(box, [
        h("div.fe-area-head", h("div", h("h2", "Changes"),
          h("p.fe-sub", "What your changes do, item by item, and what to check when something doesn't show."))),
        summary(app), everyItem(app), diffCard(app), trouble(app)]);
      if (app.sub && box.querySelector("#fe-" + app.sub)) box.querySelector("#fe-" + app.sub).scrollIntoView();
    },
  });
})();
