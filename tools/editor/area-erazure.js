/* Erazure's rules (advanced): every line of the player's version as BH reads it, by section, searchable, each rule in
   words with what it draws; the rules the preview's item can match. A rule can be switched off or on, changed, or
   get the player's own lines before or after it (EZ.ops keeps each change by what its line says, so it follows
   Erazure's updates; the list of changes says where one moved or can't be found). Generated sections (rebuilt from
   data on every update) and the twins their tools write take only a switch-off. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
(function () {
  "use strict";
  const {h, fill, pill, dialog, debounce} = EZ.ui;
  const ROW = 56;  // a row's height in the list (template.html: .fe-rb-row)
  const GENERATED = new Set(["045-unique-set-rolls.filter", "047-runeword-base-names.filter",
    "146-map-experience.filter", "270-boss-gear-tags.filter", "290-low-level-rare-tags.filter",
    "305-runeword-rolls.filter", "312-tag-count.filter"]);
  const view = {section: "", q: "", what: "rules", match: false, mine: false, top: 0};  // for this visit
  const OFF_RE = /^\s*\/\/+\s*(?=ItemDisplay\[)/;

  /* ---------------------------------------------------------------- the version's lines, read once */

  let cache = null;
  function model(app) {
    const lines = app.versionLines();
    if (cache && cache.lines === lines) return cache;
    const secs = EZ.filter.sections(app.src, lines);
    const order = Object.keys(secs).map((name) => ({name, a: secs[name][0], b: secs[name][1]})).sort((x, y) => x.a - y.a);
    const rules = new Map();  // line -> EZ.filter.rule()
    for (let i = 0; i < lines.length; i++) {
      const r = EZ.filter.rule(lines[i]);
      if (r) rules.set(i, r);
    }
    // the twins tools write next to a rule: 280's plain twins (under their star rule), the sell twins of 210 / 220 /
    // 310 (over their hide rule): a switch-off takes them with it
    const twins = new Map(), kids = new Map();
    const tie = (kid, parent) => {
      twins.set(kid, parent);
      if (!kids.has(parent)) kids.set(parent, []);
      kids.get(parent).push(kid);
    };
    for (const s of order) {
      if (s.name.startsWith("280-")) {
        for (let i = s.a + 1; i < s.b; i++) {
          const r = rules.get(i), p = rules.get(i - 1);
          if (r && p && !r.off && / STAT360>0$/.test(r.cond) && / !STAT360>0$/.test(p.cond) &&
              r.cond.replace(/ STAT360>0$/, "") === p.cond.replace(/ !STAT360>0$/, "")) tie(i, i - 1);
        }
      }
      if (/^(210|220|310)-/.test(s.name)) {
        for (let i = s.a; i < s.b; i++) {
          const r = rules.get(i);
          if (!r || r.off || r.cond.indexOf("!SMALL_SELL_BASE") < 0) continue;
          for (let k = i - 1; k >= s.a; k--) {
            const t = rules.get(k);
            if (!t || t.off || !/(^|[\s(])SMALL_SELL_(GOLD|GRAY|NK)\b/.test(t.cond)) break;
            tie(k, i);
          }
        }
      }
    }
    cache = {lines, order, rules, twins, kids, secs};
    return cache;
  }

  const sectionOf = (m, i) => {
    for (const s of m.order) if (i >= s.a && i < s.b) return s;
    return null;
  };
  const where = (m, i) => {
    const s = sectionOf(m, i);
    return s ? s.name.replace(/\.filter$/, "") + ":" + (i - s.a + 1) : "line " + (i + 1);
  };
  const locked = (m, i) => {
    const s = sectionOf(m, i);
    return (s && GENERATED.has(s.name)) || m.twins.has(i);
  };

  /* The ops of the edit set placed in the version: {byLine: Map(line -> [placed]), list: [placed]} (cached). */
  let placedCache = {key: null, val: null};
  function placed(app) {
    const e = EZ.store.current().edits, lines = app.versionLines();
    const key = JSON.stringify(e.ops || []) + "|" + (app.variant() || {}).name;
    if (placedCache.key === key && placedCache.lines === lines) return placedCache.val;
    const list = EZ.ops.locate(app.src, lines, e.ops);
    const byLine = new Map();
    for (const p of list) {
      if (p.i === null) continue;
      if (!byLine.has(p.i)) byLine.set(p.i, []);
      byLine.get(p.i).push(p);
    }
    placedCache = {key, lines, val: {list, byLine}};
    return placedCache.val;
  }

  /* A sample name for a rule's label: the first item its condition names, in its quality's color. */
  const QCOLOR = [["UNI", "GOLD"], ["SET", "GREEN"], ["RARE", "YELLOW"], ["CRAFT", "ORANGE"], ["MAG", "BLUE"]];
  function sample(cond) {
    const toks = cond.split(/[\s()!]+/).filter(Boolean);
    let name = "Item";
    for (const t of toks) {
      if (!/^[a-z0-9]{3,4}$/.test(t) || /^\d+$/.test(t)) continue;
      const b = EZ.items.base(t);
      if (b) { name = b.name.replace(/ÿc./g, "").split("\n")[0].trim(); break; }
    }
    const q = QCOLOR.find(([w]) => toks.indexOf(w) >= 0);
    return "%" + (q ? q[1] : "WHITE") + "%" + name;
  }

  const newId = () => "o" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* Set the claiming change (off / on / change) of these lines or take it away (kind null): one per line, one undo
     step for them all. */
  function setClaim(app, list, kind, extra) {
    const m = model(app), by = placed(app).byLine;
    const lines = Array.isArray(list) ? list : [list];
    const gone = [], add = [];
    for (const i of lines) {
      for (const p of by.get(i) || []) if (["off", "on", "change"].indexOf(p.op.kind) >= 0) gone.push(p.op.id);
      if (kind) add.push(Object.assign({id: newId(), kind, at: EZ.ops.anchor(app.src, m.lines, i)}, extra || {}));
    }
    EZ.store.change((ed) => {
      ed.ops = (ed.ops || []).filter((o) => gone.indexOf(o.id) < 0).concat(add);
      if (!ed.ops.length) delete ed.ops;
    }, {label: "Erazure's rules"});
  }

  function addLines(app, i, kind, lines) {
    const m = model(app), at = EZ.ops.anchor(app.src, m.lines, i);
    EZ.store.change((ed) => {
      ed.ops = ed.ops || [];
      ed.ops.push({id: newId(), kind, at, lines});
    }, {label: "Erazure's rules"});
  }

  function dropOp(id) {
    EZ.store.change((ed) => {
      ed.ops = (ed.ops || []).filter((o) => o.id !== id);
      if (!ed.ops.length) delete ed.ops;
    }, {label: "Erazure's rules"});
  }

  /* A moved change, kept on the line it found today (a changed line: the merge it gets now becomes its text). */
  function reanchor(app, p) {
    const at = EZ.ops.anchor(app.src, model(app).lines, p.i);
    EZ.store.change((ed) => {
      const o = (ed.ops || []).find((x) => x.id === p.op.id);
      if (!o) return;
      if (o.kind === "change") o.line = EZ.ops.merge3(o.at.text, o.line, p.now)[0];
      o.at = at;
    }, {label: "Erazure's rules"});
  }

  /* ---------------------------------------------------------------- one rule, opened */

  function lintFor(app, text) {
    const ctx = EZ.lint.context(app.src, app.versionLines(), {top: [], bottom: []}, {soundCount: app.data.soundCount});
    return EZ.lint.lines([text], Object.assign(ctx, {block: "erazure"}));
  }

  function findingsList(list) {
    const shown = list.filter((f) => f.level !== "info");
    return shown.length ? h("ul.fe-ed-lint", shown.map((f) => h("li.fe-ed-finding." + f.level,
      pill(f.level === "error" ? "error" : "check", f.level === "error" ? "bad" : "warn"), h("span", f.text)))) : null;
  }

  function open(app, i) {
    const m = model(app), line = m.lines[i], r = m.rules.get(i);
    const RA = EZ.rulesArea, vals = RA.aliasValues(app);
    const names = new Set(Object.keys(vals));
    for (const n of [...names]) names.add(n.toUpperCase());
    const mine = placed(app).byLine.get(i) || [];
    const claim = mine.find((p) => ["off", "on", "change"].indexOf(p.op.kind) >= 0);
    const isLocked = locked(m, i);
    const body = h("div.fe-stack");
    const code = (text) => h("pre.fe-rb-code", RA.lineTokens(text, new Set(), names));
    body.appendChild(code(line));
    if (r) {
      body.appendChild(h("p", h("b", "Matches: "), EZ.words.cond(r.cond.trim(), {levels: EZ.filter.levels(m.lines).length})));
      const d = EZ.rules.describe(r.off ? line.replace(OFF_RE, "") : line);
      body.appendChild(h("div.fe-row", h("b", "Draws: "), r.off ? pill("switched off", "warn") : null,
        d.kind === "rule" ? h("span.fe-ed-rulelabel", RA.miniLabel(d.out, vals, sample(r.cond))) : null,
        d.kind === "rule" && d.notifies ? RA.alertsOf(d.out, app) : null,
        d.kind === "rule" ? pill(d.hides ? "hides" : d.stops ? "decides the look" : "adds a layer",
          d.hides ? "bad" : d.stops ? "accent" : "info") : null));
      const pv = EZ.preview && EZ.preview.erazure && EZ.preview.erazure();
      if (pv && !r.off && EZ.preview.state) {
        const item = EZ.items.make(EZ.preview.state.spec);
        if (item) {
          const v = EZ.engine.canMatch(pv.F, i, item, EZ.preview.ctx());
          body.appendChild(h("p.fe-sub", "The preview's item (", EZ.items.describe(EZ.preview.state.spec), "): ",
            h("b", v === 1 ? "matches" : v === 0 ? "doesn't match" : "may match (it depends on what the preview leaves open)"),
            "."));
        }
      }
    }
    for (const kid of m.kids.get(i) || []) {
      body.appendChild(h("p.fe-sub", "With it: its twin at " + where(m, kid) + " (a switch-off takes it too)."));
    }
    if (isLocked) {
      body.appendChild(h("p.fe-note", m.twins.has(i) ? "A twin Erazure's tools write for the rule at " +
        where(m, m.twins.get(i)) + ": change that rule instead." : "This section is rebuilt from game data on every " +
        "Erazure update: you can switch a rule off, but not change it or add lines here."));
    }
    for (const p of mine) {
      body.appendChild(h("div.fe-note.warn", h("b", "Your change: "), opText(p.op), " ",
        h("button.fe-btn.ghost.small", {type: "button", onclick: () => { close(); dropOp(p.op.id); }}, "Undo it")));
    }
    const editBox = h("div");
    const editor = (initial, kind) => {
      const ta = h("textarea", {rows: kind === "change" ? 3 : 4, spellcheck: "false", "aria-label": kind === "change" ?
        "The rule" : "Your lines"});
      ta.value = initial;
      const out = h("div.fe-stack");
      const draw = () => {
        const ls = EZ.rules.lines(ta.value);
        const findings = [];
        for (const f of EZ.lint.lines(ls, Object.assign(EZ.lint.context(app.src, app.versionLines(), {top: [], bottom: []},
          {soundCount: app.data.soundCount}), {block: "erazure"}))) findings.push(Object.assign({}, f, {text: (ls.length > 1 ?
            "Line " + (f.line + 1) + ": " : "") + f.text}));
        const d = ls.length === 1 ? EZ.rules.describe(ls[0]) : null;
        fill(out, d && d.kind === "rule" ? h("div.fe-row", h("span.fe-ed-rulelabel", RA.miniLabel(d.out, vals,
          sample(d.cond))),
          d.notifies ? RA.alertsOf(d.out, app) : null) : null, findingsList(findings));
      };
      ta.addEventListener("input", debounce(draw, 150));
      draw();
      fill(editBox, h("div.fe-stack", h("h4", kind === "change" ? "Change the rule" : kind === "before" ?
        "Your lines before it" : "Your lines after it"), ta, out,
        h("div.fe-row", h("button.fe-btn.primary", {type: "button", onclick: () => {
          const ls = EZ.rules.lines(ta.value);
          if (kind === "change") {
            const text = ls.join(" ").trim();
            close();
            if (!text || text === line) setClaim(app, i, null); else setClaim(app, i, "change", {line: text});
          } else if (ls.some((l) => l.trim())) { close(); addLines(app, i, kind, ls); }
        }}, "Keep it"), h("button.fe-btn.ghost", {type: "button", onclick: () => fill(editBox)}, "Cancel"))));
      ta.focus();
    };
    const buttons = h("div.fe-row");
    if (r && !r.off) {
      buttons.appendChild(h("button.fe-btn", {type: "button", onclick: () => {
        close();
        setClaim(app, [i].concat(m.kids.get(i) || []), "off");
      }}, "Switch it off"));
    }
    if (r && r.off && !(claim && claim.op.kind === "off")) {
      buttons.appendChild(h("button.fe-btn", {type: "button", onclick: () => { close(); setClaim(app, i, "on"); }},
        "Switch it on"));
    }
    if (!isLocked && r) {
      buttons.appendChild(h("button.fe-btn", {type: "button", onclick: () =>
        editor(claim && claim.op.kind === "change" ? claim.op.line : line, "change")}, "Change it"));
    }
    if (!isLocked) {
      buttons.appendChild(h("button.fe-btn", {type: "button", onclick: () => editor("", "before")}, "Add lines before"));
      buttons.appendChild(h("button.fe-btn", {type: "button", onclick: () => editor("", "after")}, "Add lines after"));
    }
    body.appendChild(buttons);
    body.appendChild(editBox);
    const close = dialog({title: where(m, i), body: [body], buttons: [{text: "Close"}]});
  }

  function opText(op) {
    if (op.kind === "off") return "switched off";
    if (op.kind === "on") return "switched on";
    if (op.kind === "change") return "changed to " + (op.line || "").slice(0, 160);
    return `${(op.lines || []).length} line${(op.lines || []).length === 1 ? "" : "s"} ${op.kind} it`;
  }

  /* ---------------------------------------------------------------- the list of changes */

  function changesCard(app) {
    const m = model(app), list = placed(app).list;
    if (!list.length) return null;
    const rows = list.map((p) => {
      const op = p.op;
      const status = p.i === null ? pill("needs attention", "bad") : p.how === "exact" ? pill("in place", "good") :
        pill("Erazure changed this rule", "warn");
      return h("div.fe-rb-op" + (p.i === null ? ".bad" : p.how !== "exact" ? ".warn" : ""),
        h("div.fe-row.fe-small", status, h("b", op.kind === "change" ? "Changed" : op.kind === "off" ? "Switched off" :
          op.kind === "on" ? "Switched on" : op.kind === "before" ? "Lines before" : "Lines after"),
          p.i !== null ? h("button.fe-btn.ghost.small", {type: "button", onclick: () => open(app, p.i)}, where(m, p.i)) :
            h("span.fe-sub", "was " + (op.at.file || "").replace(/\.filter$/, "") + ":" + (op.at.line || "?"))),
        h("code.fe-rb-optext", (p.i !== null ? p.now : op.at.text).slice(0, 240)),
        p.i === null ? h("p.fe-sub.fe-small", "Erazure no longer has this rule, so your change does nothing. Find the " +
          "rule it became in the list below and make the change again, or drop it.") :
          p.how !== "exact" ? h("p.fe-sub.fe-small", "Erazure has changed this rule since you changed it; your change " +
            "still applies to it" + (op.kind === "change" ? ", merged into Erazure's new line." : ".")) : null,
        h("div.fe-row.fe-small",
          p.i !== null && p.how !== "exact" ? h("button.fe-btn.small", {type: "button", onclick: () => reanchor(app, p)},
            "Keep it on this line") : null,
          h("button.fe-btn.ghost.small", {type: "button", onclick: () => dropOp(op.id)}, p.i === null ? "Drop it" :
            "Undo it")));
    });
    return h("section.fe-card", {id: "fe-rb-changes"}, h("h3", "Your changes to Erazure's rules"), rows);
  }

  /* ---------------------------------------------------------------- the browser */

  function browser(app) {
    const m = model(app);
    const vals = EZ.rulesArea.aliasValues(app);
    const levels = EZ.filter.levels(m.lines).length;
    const mineBy = placed(app).byLine;
    const listBox = h("div.fe-rb-list", {role: "list", tabindex: "0", "aria-label": "Erazure's rules"});
    const inner = h("div.fe-rb-inner");
    listBox.appendChild(inner);
    const count = h("span.fe-sub.fe-small");
    let rows = [];
    const words = new Map();

    const matchFn = () => {
      if (!view.match) return null;
      const pv = EZ.preview && EZ.preview.erazure && EZ.preview.erazure();
      const item = pv && EZ.items.make(EZ.preview.state.spec);
      if (!pv || !item) return null;
      const c = EZ.preview.ctx();
      return (i) => EZ.engine.canMatch(pv.F, i, item, c) !== 0;
    };

    const build = () => {
      const q = view.q.trim().toLowerCase();
      let code = null;
      if (q) {
        const hit = EZ.items.search(view.q, 3).find((p) => p.label.toLowerCase() === q && p.key[0] === "b");
        if (hit) code = hit.spec.code;
      }
      const codeRe = code ? new RegExp("(^|[\\s(!])" + code + "\\b") : null;
      const can = matchFn();
      rows = [];
      for (const s of m.order) {
        if (view.section && s.name !== view.section) continue;
        const list = [];
        for (let i = s.a; i < s.b; i++) {
          const line = m.lines[i], r = m.rules.get(i);
          if (view.what === "rules" && !(r && !r.off)) continue;
          if (view.what === "rules+off" && !r) continue;
          if (view.mine && !mineBy.has(i)) continue;
          if (q && line.toLowerCase().indexOf(q) < 0 && !(codeRe && r && codeRe.test(r.cond))) continue;
          if (can && !(r && !r.off && can(i))) continue;
          list.push(i);
        }
        if (!list.length) continue;
        rows.push({sec: s, n: list.length});
        for (const i of list) rows.push({i});
      }
      inner.style.height = rows.length * ROW + "px";
      const n = rows.filter((x) => x.i !== undefined).length;
      count.textContent = n.toLocaleString() + (n === 1 ? " line" : " lines");
      paint(true);
    };

    const rowNode = (x, k) => {
      const style = {top: k * ROW + "px"};
      if (x.sec) {
        return h("div.fe-rb-row.fe-rb-sec", {style, role: "listitem"}, h("b", x.sec.name.replace(/\.filter$/, "")),
          h("span.fe-sub", " · " + x.n.toLocaleString()), GENERATED.has(x.sec.name) ? pill("generated", "info") : null);
      }
      const i = x.i, line = m.lines[i], r = m.rules.get(i);
      const mine = mineBy.get(i);
      if (!r) {
        return h("button.fe-rb-row.fe-rb-text" + (mine ? ".is-changed" : ""), {type: "button", style, role: "listitem",
          onclick: () => open(app, i)}, h("span.fe-rb-where", where(m, i)), h("span.fe-rb-comment", line || " "));
      }
      if (!words.has(i)) words.set(i, EZ.words.cond(r.cond.trim(), {levels}));
      const d = EZ.rules.describe(r.off ? line.replace(OFF_RE, "") : line);
      const kind = r.off ? ["off", ""] : d.hides ? ["hides", "bad"] : d.stops ? ["look", "accent"] : ["layer", "info"];
      return h("button.fe-rb-row" + (mine ? ".is-changed" : "") + (r.off ? ".off" : ""), {type: "button", style,
        role: "listitem", onclick: () => open(app, i), title: line.slice(0, 400)},
        h("span.fe-rb-top", h("span.fe-rb-where", where(m, i)), pill(kind[0], kind[1]),
          m.twins.has(i) ? pill("twin", "") : null,
          mine ? pill(mine.map((p) => p.op.kind === "change" ? "changed" : p.op.kind).join(", "), "warn") : null,
          h("span.fe-rb-words", words.get(i))),
        h("span.fe-rb-draw", d.kind === "rule" ? EZ.rulesArea.miniLabel(d.out, vals, sample(r.cond)) : null,
          d.kind === "rule" && d.notifies ? h("span.fe-row.fe-small", EZ.rulesArea.alertsOf(d.out, app)) : null));
    };

    let painted = [-1, -1];
    const paint = (force) => {
      const top = listBox.scrollTop, height = listBox.clientHeight || 600;
      const first = Math.max(0, Math.floor(top / ROW) - 6), last = Math.min(rows.length, Math.ceil((top + height) / ROW) + 6);
      if (!force && first === painted[0] && last === painted[1]) return;
      painted = [first, last];
      fill(inner, rows.slice(first, last).map((x, k) => rowNode(x, first + k)));
      view.top = top;
    };
    let ticking = false;
    listBox.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; paint(false); });
    });

    const sectionSel = h("select", {"aria-label": "Section", onchange: (e) => { view.section = e.target.value; view.top = 0;
      listBox.scrollTop = 0; build(); }},
      h("option", {value: ""}, "Every section"),
      m.order.map((s) => h("option", {value: s.name, selected: s.name === view.section}, s.name.replace(/\.filter$/, ""))));
    const search = h("input", {type: "search", value: view.q, placeholder: "Search the lines, or an item: Shako, r30, %GOLD%…",
      "aria-label": "Search Erazure's rules"});
    search.addEventListener("input", debounce(() => { view.q = search.value; listBox.scrollTop = 0; build(); }, 200));
    const whatSel = h("select", {"aria-label": "Which lines", onchange: (e) => { view.what = e.target.value; build(); }},
      [["rules", "Rules"], ["rules+off", "Rules, switched-off ones too"], ["all", "Every line (notes too)"]].map(([v, t]) =>
        h("option", {value: v, selected: view.what === v}, t)));
    const matchT = h("label.fe-switch", h("input", {type: "checkbox", checked: view.match, onchange: (e) => {
      view.match = e.target.checked; listBox.scrollTop = 0; build(); }}), h("span.track"),
      h("span", "Only rules the preview's item can match"));
    const mineT = h("label.fe-switch", h("input", {type: "checkbox", checked: view.mine, onchange: (e) => {
      view.mine = e.target.checked; listBox.scrollTop = 0; build(); }}), h("span.track"), h("span", "Only my changes"));

    const card = h("section.fe-card.fe-rb",
      h("div.fe-row.fe-rb-tools", search, sectionSel, whatSel),
      h("div.fe-row.fe-small", matchT, mineT, h("span.fe-bar-gap"), count),
      view.match ? h("p.fe-sub.fe-small", "The item: ", EZ.items.describe(EZ.preview.state.spec), " (pick another in " +
        "the preview's Item view; its filter level, character and place count too).") : null,
      listBox);
    requestAnimationFrame(() => { build(); if (view.top) { listBox.scrollTop = view.top; paint(true); } });
    return card;
  }

  /* ---------------------------------------------------------------- the area */

  let warnCache = {key: null, n: 0};
  function needLook(app) {
    const e = EZ.store.current().edits;
    if (!e.ops || !e.ops.length) return 0;
    const key = JSON.stringify(e.ops) + "|" + (app.variant() || {}).name;
    if (warnCache.key !== key) {
      let n = 0;
      try { n = placed(app).list.filter((p) => p.i === null || p.how !== "exact").length; } catch (err) { n = 0; }
      warnCache = {key, n};
    }
    return warnCache.n;
  }

  EZ.areas.push({
    id: "erazure", title: "Erazure's rules", icon: "≡", order: 90, group: "c",
    count: (e) => EZ.edits.countArea("erazure", e),
    warn: (e, app) => needLook(app),
    render(box, app) {
      EZ.ui.add(box, [
        h("div.fe-area-head", h("div", h("h2", "Erazure's rules"),
          h("p.fe-sub", "Every line of your version as BH reads it. Open a rule to switch it off, change it, or add " +
            "your own lines before or after it."))),
        h("p.fe-note", "For changing Erazure's rules one by one. Your changes are kept by what each line says, so they " +
          "follow Erazure's updates, and this page says when Erazure has changed a rule you changed. Quick Edits, Features, Looks " +
          "and Alerts change many rules at once and never need checking."),
        changesCard(app), browser(app)]);
      if (app.sub && box.querySelector("#fe-" + app.sub)) box.querySelector("#fe-" + app.sub).scrollIntoView();
    },
  });
})();
