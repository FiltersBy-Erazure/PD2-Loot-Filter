/* Features: the parts of Erazure a player can switch off (tags, description lines, map lines...: EZ.features), an
   area of their own since 2026-11-12 (the author; until then a card of Options). Mostly what Erazure writes on and under
   names; a few switches (Grail looks, level 1's sockets, the sell tags on small items) change what shows too.
   Each switch shows what it changes (2026-11-12, the author: "each of the sections ... needs to have some kind of
   preview that shows what having the option on or off would affect"): a few of its rules drawn on an item they are
   for, or (features.js `samples`) items run with the feature on and off; and a feature with parts lists them, each
   its own switch with what it draws ("for charm tags, they may want to choose individual tags to turn off";
   EZ.edits.featureParts groups the rules). */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
EZ.featuresArea = (function () {
  "use strict";
  const KEYWORDS = /%(?:CONTINUE|(?:BORDER|MAP|DOT|PX|LINE|NOTIFY)-[0-9A-Fa-f]{1,4}|SOUNDID-\d{1,4}|TIER-\d)%/g;
  const KEEP = new Set(["NAME", "CL", "CS", "NL", "PERCENT"]);
  // a value the item's numbers take where a rule's condition asks for none (else 10, the condition's bounds kept)
  const TYPICAL = {QTY: 12, ILVL: 85, CRAFTALVL: 80, ALVL: 80, QLVL: 60, MAXSOCKETS: 4, SOCKETS: 3, SOCK: 3,
                   CLVL: 90, CHARSTAT12: 90, RUNENUM: 30, LVLREQ: 40, GOLD: 1500, PRICE: 25000, SELLPRICE: 25000,
                   DEF: 200, ED: 150, EDAM: 150, EDEF: 100};
  const QCOLOR = [["UNI", "GOLD"], ["SET", "GREEN"], ["RARE", "YELLOW"], ["CRAFT", "ORANGE"], ["MAG", "BLUE"]];
  // the item kinds a condition can name, as the name a sample is drawn with
  const KIND_NAMES = {HELM: "Helm", CIRC: "Circlet", CHEST: "Body Armor", SHIELD: "Shield", GLOVES: "Gloves",
    BOOTS: "Boots", BELT: "Belt", ARMOR: "Armor", AXE: "Axe", MACE: "Mace", CLUB: "Club", TMACE: "Mace",
    HAMMER: "Hammer", SWORD: "Sword", DAGGER: "Dagger", THROWING: "Throwing Knife", JAV: "Javelin", SPEAR: "Spear",
    POLEARM: "Polearm", BOW: "Bow", XBOW: "Crossbow", STAFF: "Staff", WAND: "Wand", SCEPTER: "Scepter",
    WEAPON: "Weapon", CLASS: "Class Item", ZON: "Amazon Javelin", SOR: "Sorceress Orb", NEC: "Necromancer Head",
    DIN: "Paladin Shield", BAR: "Barbarian Helm", DRU: "Druid Pelt", SIN: "Assassin Claw", JEWELRY: "Ring",
    CHARM: "Grand Charm", QUIVER: "Arrows"};

  /* A value of `word` the condition asks for: its own comparisons' bounds around a typical value. */
  function valueFor(word, cond) {
    const esc = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("(^|[\\s(])(!?)" + esc + "([<>=~])(\\d+)(?:-(\\d+))?(?=$|[\\s)])", "g");
    let lo = -Infinity, hi = Infinity, eq = null, m;
    while ((m = re.exec(cond))) {
      if (m[2]) continue;
      const a = +m[4];
      if (m[3] === ">") lo = Math.max(lo, a + 1);
      else if (m[3] === "<") hi = Math.min(hi, a - 1);
      else if (m[3] === "=") eq = a;
      else { lo = Math.max(lo, a); hi = Math.min(hi, m[5] === undefined ? a : +m[5]); }
    }
    if (eq !== null) return eq;
    const t = TYPICAL[word] !== undefined ? TYPICAL[word] : 10;
    return lo > hi ? lo : Math.max(lo, Math.min(hi, t));
  }

  /* A $f(...) formula (its parentheses matched) as a number: the viewer's level where it reads it, a map experience
     multiplier's parts as 1.7, else the given number. */
  function formulaValue(f, n) {
    if (/^\$f\(\s*(?:CHARSTAT12|CLVL)\s*\)$/.test(f)) return 90;
    if (/MOD\(/.test(f) && /MX[RX]_/.test(f)) return 7;
    if (/MX[RX]_/.test(f)) return 1;
    return n;
  }
  function noFormulas(text, n) {
    let out = "", i = 0;
    while (i < text.length) {
      const k = text.indexOf("$f(", i);
      if (k < 0) { out += text.slice(i); break; }
      out += text.slice(i, k);
      let depth = 0, j = k + 2;
      for (; j < text.length; j++) {
        if (text[j] === "(") depth++;
        else if (text[j] === ")" && --depth === 0) break;
      }
      out += String(formulaValue(text.slice(k, j + 1), n));
      i = j + 1;
    }
    return out;
  }

  /* The words of a condition the item has (not under a !): a sample must not be what the rule leaves out. */
  function positiveWords(cond) {
    const out = [], neg = [false], re = /(!?)\(|\)|(!?)([A-Za-z0-9_]+)/g;
    let m;
    while ((m = re.exec(cond))) {
      if (m[0].endsWith("(")) neg.push(neg[neg.length - 1] || m[1] === "!");
      else if (m[0] === ")") { if (neg.length > 1) neg.pop(); }
      else if (!neg[neg.length - 1] && !m[2]) out.push(m[3]);
    }
    return out;
  }

  /* The name a rule is drawn on: the first item its condition names (a base, else a kind), in its quality's color. */
  function sampleName(cond) {
    const toks = positiveWords(cond);
    let name = null;
    for (const t of toks) {
      if (!/^[a-z0-9]{3,4}$/.test(t) || /^\d+$/.test(t)) continue;
      const b = EZ.items.base(t);
      if (b) { name = EZ.render.plain(b.name).split(" / ")[0].trim(); break; }
    }
    if (!name) name = KIND_NAMES[toks.find((t) => KIND_NAMES[t])] || "Item";
    const q = QCOLOR.find(([w]) => toks.indexOf(w) >= 0);
    return "%" + (q ? q[1] : toks.indexOf("ETH") >= 0 ? "GRAY" : "WHITE") + "%" + name;
  }

  /* A rule drawn on its own (no item runs it): {label (the label's codes, or "" when the rule writes nothing on it),
     desc (its description lines)}: its looks filled, %NAME% the sample's, the item's numbers a value its condition
     asks for. */
  function drawRule(r, vals) {
    const name = sampleName(r.cond);
    const num = (s) => noFormulas(s, 10).replace(/%([A-Z][A-Z0-9_]*(?:,\d+)?)%/g, (m, w) =>
      KEEP.has(w) || EZ.render.WORDS[w] !== undefined || w in vals ? m : String(valueFor(w, r.cond)));
    const out = num(r.out.replace(KEYWORDS, ""));
    const labelText = out.replace(/\{[^}]*\}?/, "");
    const own = labelText.replace(/%NAME%/g, "").replace(/%[A-Z_]+%/g, "").replace(/ÿc./g, "").trim();
    return {label: own ? EZ.looks.fill(labelText, vals, name) : "", desc: EZ.render.descOf(out, vals)};
  }

  /* What some rules draw: each different label (on the item's name) or description line, `max` at most. */
  function drawn(rules, vals, max) {
    const {h} = EZ.ui;
    const seen = new Set(), out = [];
    for (const r of rules) {
      const d = drawRule(r, vals);
      const key = d.label + "|" + d.desc;
      if (seen.has(key) || (!d.label && !d.desc)) continue;
      seen.add(key);
      out.push(h("span.fe-featsample", d.label ? EZ.render.label(d.label) : null,
        d.desc ? h("span.fe-minidesc", EZ.render.coded(d.desc, "3")) : null));
      if (out.length >= (max || 3)) break;
    }
    return out;
  }

  return {drawRule, drawn, sampleName, valueFor};
})();

EZ.areas.push({
  id: "features", title: "Features", icon: "✦", order: 25, group: "b",
  count: (e) => EZ.edits.countArea("features", e),
  render(box, app) {
    const {h, toggle} = EZ.ui;
    const FA = EZ.featuresArea, F = EZ.filter;
    const e = EZ.store.current().edits;
    const lines = app.versionLines();
    const vals = EZ.looks.values(lines), al = F.aliases(lines);
    const area = this;
    // a stat block named by the game's own stat name where Erazure has no title of its own
    const titleOf = (p) => ({item_nonclassskill: "+ Skills of another class"})[p.title] || p.title;
    // the parts a switch's examples come from first: the stats every player knows
    const KNOWN = ["Magic Find", "Faster Cast Rate", "All Resistances", "All Resist", "Life", "+ All Skills",
                   "Enhanced Damage", "Increased Attack Speed", "Gold Find", "Faster Run/Walk"];
    area.open = area.open || new Set();      // the features whose parts list is open (kept while the area redraws)
    area.query = area.query || {};           // and the words its list is narrowed to
    // a link to a switch's parts (Maps' "Choose its parts on Features") opens them
    if (app.drawn !== "features" && /^feat-/.test(app.sub || "")) area.open.add(app.sub.slice(5));
    const groups = [];
    for (const f of EZ.features) {
      let g = groups.find((x) => x.title === f.group);
      if (!g) groups.push(g = {title: f.group, list: []});
      g.list.push(f);
    }

    /* A part's rules: its own lines, or the tag lines that ask its aliases (an alias read as TRUE). */
    const rulesOf = (f, p, max) => {
      if (p.lines) return p.lines.slice(0, max).map((i) => F.rule(lines[i])).filter(Boolean);
      const range = F.sections(app.src, lines)[f.tagLines], out = [];
      if (!range) return out;
      const res = p.aliases.map((n) => new RegExp("(^|[^A-Za-z0-9_])" + n + "($|[^A-Za-z0-9_])", "g"));
      for (let i = range[0]; i < range[1] && out.length < max; i++) {
        if (!lines[i].startsWith("ItemDisplay[")) continue;
        const r = F.rule(lines[i]);
        if (!r || !res.some((re) => { re.lastIndex = 0; return re.test(r.cond); })) continue;
        let cond = r.cond;
        for (const re of res) cond = cond.replace(re, "$1TRUE$2");
        const own = p.aliases.map((n) => al[n] ? "(" + al[n].value + ")" : "").join(" ");
        out.push(Object.assign({}, r, {cond: own + " " + cond}));
      }
      return out;
    };
    /* A section feature's own rules (those it switches off), for its preview. */
    const featureRules = (f) => {
      const secs = F.sections(app.src, lines), out = [];
      for (const name of f.sections || []) {
        const r0 = secs[name];
        if (!r0) continue;
        for (let i = r0[0]; i < r0[1] && out.length < 40; i++) {
          if (!lines[i].startsWith("ItemDisplay[")) continue;
          const r = F.rule(lines[i]);
          if (r && F.continues(r.out) && !F.notifies(r.out) &&
              (!f.descOnly || /^%NAME%$/.test(r.out.replace(/\{[^}]*\}?/, "").replace(/%CONTINUE%/g, "").trim()))) out.push(r);
        }
      }
      return out;
    };

    const setParts = (f, fn) => EZ.store.change((ed) => {
      const fp = Object.assign({}, ed.featureParts || {});
      const now = new Set(fp[f.id] || []);
      fn(now);
      if (now.size) fp[f.id] = [...now]; else delete fp[f.id];
      if (Object.keys(fp).length) ed.featureParts = fp; else delete ed.featureParts;
    }, {label: f.title});

    /* What the switch changes: a few of its rules drawn (its first parts', else its first rules), or its sample items
       run with the switch on and off (worked out when asked: it builds the filter with it flipped). */
    const preview = (f, on, parts) => {
      const def = EZ.edits.featureDefault(f);
      if (f.samples) {
        const out = h("div.fe-featpreview");
        const run = () => {
          EZ.ui.fill(out, h("span.fe-sub.fe-small", h("span.fe-spin"), " Working it out…"));
          setTimeout(() => {
            const P = EZ.preview, z = P.erazure();
            let y = null;
            try { y = P.withEdits({v: e.v, base: e.base, features: {[f.id]: !def}}); } catch (err) { y = null; }
            const words = def ? ["On (Erazure's default)", "Off"] : ["Off (Erazure's default)", "On"];
            // the description only where it differs (with the switch on and off), as the hover box shows it
            const cell = (r, other) => r.hidden || r.invisible ? EZ.render.hiddenNode(r) : h("span.fe-featcell",
              EZ.render.label(r.name, {start: r.start}),
              r.desc && !(other.hidden || other.invisible) && String(r.desc) !== String(other.desc) ?
                h("span.fe-minidesc", EZ.render.coded(String(r.desc), "3")) : null);
            EZ.ui.fill(out, f.samples.map((s) => {
              const ctx = Object.assign(P.ctx(s.level), {mapid: 2},
                s.clvl ? {clvl: s.clvl, charstats: {12: s.clvl}} : {});
              const it = EZ.items.make(Object.assign({place: "GROUND"}, s.spec));
              if (!it || !z || !y) return null;
              const a = EZ.engine.run(z.F, it, ctx, P.state.opts), b = EZ.engine.run(y.F, it, ctx, P.state.opts);
              const place = s.spec.place && s.spec.place !== "GROUND" ? "in the " + s.spec.place.toLowerCase() :
                "on the ground";
              return h("div.fe-featrow", h("span.fe-sub.fe-small", `${EZ.items.describe(s.spec)}, ${place}, filter ` +
                `level ${s.level}` + (s.clvl ? `, character level ${s.clvl}` : "") + ":"),
                h("span.fe-featpair", h("small", words[0]), cell(a, b)), h("span.fe-featpair", h("small", words[1]),
                  cell(b, a)));
            }));
          }, 30);
        };
        out.appendChild(h("button.fe-btn.small", {type: "button", onclick: run}, "Show it on an item"));
        return out;
      }
      const known = (p) => { const k = KNOWN.indexOf(titleOf(p)); return k < 0 ? KNOWN.length : k; };
      const pick = parts.map((p, i) => [known(p), i, p]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((x) => x[2]);
      const rules = parts.length ? pick.slice(0, 8).flatMap((p) => rulesOf(f, p, 1)) : featureRules(f).slice(0, 12);
      const shown = FA.drawn(rules, vals, 3);
      if (!shown.length) return null;
      return h("div.fe-featpreview", h("span.fe-sub.fe-small", on ? "It draws, for example:" :
        "Switched on, it would draw, for example:"), shown, on ? h("span.fe-sub.fe-small", "Off, these go.") : null);
    };

    /* The feature's parts, each its own switch, with what it draws. */
    const partsList = (f, on, parts) => {
      const off = new Set(EZ.edits.partsOff(e.featureParts, f));
      const gone = [...off].filter((k) => !parts.some((p) => p.key === k));
      const wrap = h("details.fe-featparts" + (on ? "" : ".is-disabled"), {open: area.open.has(f.id) || null});
      const body = h("div.fe-featparts-body");
      const draw = () => {
        const q = (area.query[f.id] || "").trim().toLowerCase();
        const list = parts.filter((p) => !q || titleOf(p).toLowerCase().indexOf(q) >= 0);
        EZ.ui.fill(body,
          on ? null : h("p.fe-note.fe-small", "The switch above is off, so all of them are: switch it on to choose."),
          h("div.fe-row.fe-small.fe-featparts-tools",
            parts.length > 12 ? h("input", {type: "search", value: area.query[f.id] || "", placeholder: "Find a part…",
              "aria-label": "Find a part of " + f.title, oninput: (ev) => { area.query[f.id] = ev.target.value; draw(); }}) : null,
            h("button.fe-btn.small", {type: "button", disabled: !on || !off.size, onclick: () =>
              setParts(f, (s) => s.clear())}, "All on"),
            h("button.fe-btn.small", {type: "button", disabled: !on || off.size >= parts.length, onclick: () =>
              setParts(f, (s) => { for (const p of parts) s.add(p.key); })}, "All off")),
          h("ul.fe-partlist", list.map((p) => h("li.fe-part" + (off.has(p.key) ? ".is-off" : ""),
            h("label",
              h("input", {type: "checkbox", checked: !off.has(p.key), disabled: !on, onchange: (ev) =>
                setParts(f, (s) => { if (ev.target.checked) s.delete(p.key); else s.add(p.key); })}),
              h("span.fe-part-title", titleOf(p).length > 80 ? titleOf(p).slice(0, 78) + "…" : titleOf(p))),
            h("span.fe-part-draws", FA.drawn(rulesOf(f, p, 6), vals, 2))))),
          list.length ? null : h("p.fe-sub.fe-small", "No part matches."),
          gone.length ? h("p.fe-note.warn.fe-small", "Switched off but no longer in Erazure: " +
            gone.map((k) => k.replace(/^text:/, "")).join(", ") + ". ", h("button.fe-btn.ghost.small", {type: "button",
              onclick: () => setParts(f, (s) => { for (const k of gone) s.delete(k); })}, "Forget them")) : null);
      };
      wrap.addEventListener("toggle", () => {
        if (wrap.open) { area.open.add(f.id); if (!body.childNodes.length) draw(); } else area.open.delete(f.id);
      });
      if (wrap.open) draw();
      wrap.append(h("summary", `Choose its parts: ${parts.length}` + (off.size ? `, ${off.size} switched off` : "")),
        body);
      return wrap;
    };

    // a switch put back to Erazure's default follows Erazure again (as on Maps); one Erazure's own default came to
    // meet (a choice kept from before) can be let go with the button right after its title
    const row = (f) => {
      const def = EZ.edits.featureDefault(f);
      const pinned = e.features && f.id in e.features;
      const on = pinned ? !!e.features[f.id] : def;
      const parts = f.parts || f.partAliases ? EZ.edits.featureParts(app.src, lines, f) : [];
      const offN = EZ.edits.partsOff(e.featureParts, f).length;
      return h("div.fe-feature" + (on !== def || (on && offN) ? ".is-changed" : ""), {id: "fe-feat-" + f.id},
        h("div.fe-row.fe-feature-head",
          toggle(f.title, on, (v) => EZ.store.change((ed) => {
            ed.features = ed.features || {};
            if (v === def) delete ed.features[f.id]; else ed.features[f.id] = v;
            if (!Object.keys(ed.features).length) delete ed.features;
          }, {label: f.title}), {sub: f.sub}),
          pinned ? h("button.fe-btn.ghost.small", {type: "button", title: "Back to Erazure's default (today " +
            (def ? "on" : "off") + "), which follows Erazure's updates", onclick: () => EZ.store.change((ed) => {
            delete ed.features[f.id];
            if (!Object.keys(ed.features).length) delete ed.features;
          })}, "↺ Erazure's default") : null),
        h("div.fe-featmore", preview(f, on, parts), parts.length > 1 ? partsList(f, on, parts) : null));
    };
    box.append(
      h("div.fe-area-head", h("div", h("h2", "Features"),
        h("p.fe-sub", "Switch off what you don't want to see. Most switches are tags and description lines only, so " +
          "what shows, hides and alerts stays Erazure's; the Grail and Strictness switches and the sell tags on small " +
          "items also change what shows. Under each switch: what it draws (its numbers an example), and where it has " +
          "parts, each part its own switch: Charm tags' Gold Find, a highlight's skill. Erazure's map lines are on Maps " +
          "too."))),
      h("section.fe-card", {id: "fe-features"},
        groups.map((g) => h("div.fe-featgroup", h("h4", g.title), h("div.fe-stack", g.list.map(row))))));
    if (app.sub) {
      const el = box.querySelector("#fe-" + app.sub) || box.querySelector("#fe-feat-" + app.sub);
      if (el) el.scrollIntoView();
    }
  },
});
