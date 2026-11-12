/* Wishlists (the Highlights area): identified items with the stats the player wants get a line in their description
   (and, if the player likes, an icon and a sound): kinds of items, qualities, the stats each must have, and "N of
   these" from a pool of others (BH's COUNT formula: each stat's test is true or false, the count against N). Each
   wishlist is %CONTINUE% rules, so Erazure's looks and tags still come: its label tag and alert before Erazure's rules,
   its description line right before Erazure's last rule (some of Erazure's layers start the description anew, so a
   line written earlier wouldn't last). It acts wherever the item is (inventory, stash, shops). */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.wishlists = (function () {
  "use strict";
  const MARKS = {
    top: ["// ===============  Your highlights (Erazure Filter Editor): tags and alerts  ===============",
          "// ===============  End of your highlights' tags and alerts  ==============="],
    bottom: ["// ===============  Your highlights (Erazure Filter Editor): description lines  ===============",
             "// ===============  End of your highlights' description lines  ==============="],
  };
  const QUALS = ["MAG", "RARE", "CRAFT", "UNI", "SET"];
  const COLORS = ["GREEN", "GOLD", "ORANGE", "RED", "BLUE", "PURPLE", "WHITE", "TAN", "YELLOW", "TEAL", "CORAL", "SAGE"];
  const int = (v) => { const n = parseInt(v, 10); return isNaN(n) ? null : n; };

  /* A stat row as a formula test (BH's Formula.h variables: the condition words in lower case, stat / multi with
     their numbers), or null. */
  function formulaOf(s) {
    if (!s) return null;
    let v = null;
    if (s.kind === "word" && s.word && /^[A-Z0-9_]+$/.test(s.word)) {
      const w = s.word.toLowerCase();
      v = EZ.engine.VARS[w] ? w : null;
    } else if (s.kind === "STAT" && int(s.n) !== null) v = "stat" + int(s.n);
    else if (s.kind === "SK" && int(s.n) !== null) v = "multi107," + int(s.n);
    else if (s.kind === "OS" && int(s.n) !== null) v = "multi97," + int(s.n);
    else if (s.kind === "TABSK" && int(s.n) !== null) v = "multi188," + int(s.n);
    else if (s.kind === "CLSK" && int(s.n) !== null) v = "multi83," + int(s.n);
    else if (s.kind === "CHSK" && int(s.n) !== null) v = "chsk" + int(s.n);
    else if (s.kind === "SKTOTAL" && int(s.n) !== null) {
      const parts = ["multi107," + int(s.n)];
      if (s.tab !== null && s.tab !== undefined && int(s.tab) !== null) parts.push("multi188," + int(s.tab));
      if (s.cls !== null && s.cls !== undefined && int(s.cls) !== null) parts.push("multi83," + int(s.cls));
      parts.push("allsk");
      v = "(" + parts.join("+") + ")";
    }
    const a = int(s.a), b = int(s.b);
    if (v === null || a === null) return null;
    if (s.op === "max") return v + "<=" + a;
    if (s.op === "exactly") return v + "==" + a;
    if (s.op === "between" && b !== null) return "and(" + v + ">=" + Math.min(a, b) + "," + v + "<=" + Math.max(a, b) + ")";
    return v + ">=" + a;
  }

  /* A stat row as condition words (EZ.rules.statWords; a skill total with its tab and class). */
  function wordsOf(s) {
    if (!s) return "";
    const cat = EZ.items.catalog && EZ.items.catalog();
    const base = {op: s.op, a: s.a, b: s.b};
    if (s.kind === "word") return s.word ? EZ.rules.statWords(Object.assign(base, {word: s.word})) : "";
    if (s.n === "" || s.n === undefined || s.n === null) return "";
    if (s.kind === "STAT") return EZ.rules.statWords(Object.assign(base, {stat: s.n}));
    if (s.kind === "SK") return EZ.rules.statWords(Object.assign(base, {skill: s.n}));
    if (s.kind === "SKTOTAL") {
      const sk = cat && cat.skills.get(+s.n);
      const CLS = {ama: 0, sor: 1, nec: 2, pal: 3, bar: 4, dru: 5, ass: 6};
      return EZ.rules.statWords(Object.assign(base, {skill: s.n, total: true, tab: sk ? sk.tab : null,
                                                     cls: sk && CLS[sk.cls] !== undefined ? CLS[sk.cls] : null}));
    }
    return EZ.rules.statWords(Object.assign(base, {word: s.kind + s.n}));
  }

  /* The skill total's tab and class (the formula needs them as numbers). */
  function withSkill(s) {
    if (s.kind !== "SKTOTAL") return s;
    const cat = EZ.items.catalog && EZ.items.catalog();
    const sk = cat && cat.skills.get(+s.n);
    const CLS = {ama: 0, sor: 1, nec: 2, pal: 3, bar: 4, dru: 5, ass: 6};
    return Object.assign({}, s, {tab: sk ? sk.tab : null, cls: sk && CLS[sk.cls] !== undefined ? CLS[sk.cls] : null});
  }

  const clean = (t) => String(t || "").replace(/[\r\n{}]+/g, " ").replace(/\/\/+/g, "/").trim();

  /* One wishlist's rules: {cond, top (its label tag and alert, or null), bottom (its description line), line (both,
     for showing)}; null when it names no item and no stat (it would tag every item). */
  function rule(w) {
    const conds = ["ID"];
    const items = [];
    for (const c of (w.codes || [])) if (/^[a-z0-9]{2,4}$/.test(c)) items.push(c);
    for (const g of (w.groups || [])) if (/^[A-Z0-9]+$/.test(g)) items.push(g);
    if (items.length) conds.push(items.length === 1 ? items[0] : "(" + items.join(" OR ") + ")");
    const quals = (w.quals || []).filter((q) => QUALS.indexOf(q) >= 0);
    if (quals.length) conds.push(quals.length === 1 ? quals[0] : "(" + quals.join(" OR ") + ")");
    let stats = 0;
    for (const s of w.need || []) {
      const t = wordsOf(s);
      if (t) { conds.push(t); stats++; }
    }
    const pool = (w.pool || []).map((s) => formulaOf(withSkill(s))).filter(Boolean);
    const n = Math.max(1, Math.min(pool.length, int(w.n) || 1));
    if (pool.length) { conds.push("$f(COUNT(" + pool.join(",") + ")>=" + n + ")"); stats++; }
    if (!items.length && !stats) return null;
    const color = COLORS.indexOf(w.color) >= 0 ? w.color : "GREEN";
    const text = clean(w.line) || clean(w.name) || "Highlight";
    const cond = conds.join(" "), note = "// Your highlight: " + (clean(w.name) || text);
    const alert = EZ.overrides.alertText(w.alert), tag = clean(w.tag);
    const top = tag || alert ? "ItemDisplay[" + cond + "]:" + (tag ? "%" + color + "%" + tag + "%CS%" : "") +
      "%NAME%{%NAME%}" + alert + "%CONTINUE%" + note : null;
    const bottom = "ItemDisplay[" + cond + "]:%NAME%{%NAME%%CL%%" + color + "%" + text + "}%CONTINUE%" + note;
    return {cond, top, bottom, line: top ? top + "\n" + bottom : bottom};
  }

  const valid = (w) => w && typeof w === "object" && !Array.isArray(w);

  /* A highlight in words: "identified rare or crafted amulets with FCR 10+, and 2 of: life 40+, strength 15+". */
  const QUAL_WORD = {MAG: "magic", RARE: "rare", CRAFT: "crafted", UNI: "unique", SET: "set"};
  function describe(w) {
    const r = rule(w);
    if (!r) return "";
    const q = (w.quals || []).filter((x) => QUAL_WORD[x]).map((x) => QUAL_WORD[x]);
    const kinds = [];
    for (const c of w.codes || []) {
      const b = EZ.items.base && EZ.items.base(c);
      kinds.push(b ? EZ.render.plain(b.name).split(" / ")[0] + "s" : c);
    }
    for (const g of w.groups || []) kinds.push(EZ.words.PLAIN[g] ? EZ.words.PLAIN[g] + "s" : g.toLowerCase());
    const say = (s) => { const t = wordsOf(s); return t ? EZ.words.cond(t) : ""; };
    const need = (w.need || []).map(say).filter(Boolean);
    const pool = (w.pool || []).map((s) => say(withSkill(s))).filter(Boolean);
    const n = Math.max(1, Math.min(pool.length, int(w.n) || 1));
    let s = "Identified " + (q.length ? q.join(" or ") + " " : "") + (kinds.length ? kinds.join(", ") : "items");
    if (need.length) s += " with " + need.join(", ");
    if (pool.length) s += (need.length ? ", and " : " with ") + (pool.length > 1 ? n + " of: " : "") + pool.join(", ");
    return s;
  }

  /* Erazure's stopping rules an identified item can meet ("!ID" rules can't): [{i, r, tree}], their conditions read
     as BH reads them (cached by line while Erazure's aliases stay the same). Hide rules (no text) are left out. */
  let treeCache = {sig: null, map: new Map()};
  function stoppers(lines) {
    const aliases = EZ.core.bhAliases(EZ.core.bhEntries(lines));
    const sig = aliases.length + "\n" + aliases.map((a) => a.name + "=" + a.value).join("\n");
    if (treeCache.sig !== sig) treeCache = {sig, map: new Map()};
    const out = [], todo = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith("ItemDisplay[")) continue;
      const r = EZ.filter.rule(line);
      if (!r || /%CONTINUE%/i.test(r.out) || /(^|[\s(])!ID\b/.test(r.cond)) continue;
      const text = r.out.replace(/\{[^}]*\}?/, "").replace(/%(BORDER|MAP|DOT|PX|LINE|NOTIFY)-[0-9a-f]{1,4}%|%SOUNDID-\d{1,4}%|%TIER-\d%/gi, "");
      if (!text.trim()) continue;
      if (!treeCache.map.has(line)) todo.push({line, cond: r.cond});
      out.push({i, r, line});
    }
    if (todo.length) {
      const subs = EZ.core.substitute([todo.map((t) => t.cond), todo.map(() => "")], aliases)[0];
      const F = {formulas: Object.create(null), formulaText: Object.create(null), statMax: 1023, skillMax: 1023,
                 soundCount: 10000};
      const namer = EZ.engine.islandNamer();
      todo.forEach((t, k) => {
        let tree = null;
        try { tree = EZ.engine.condition(EZ.engine.islandsOf(subs[k], "", "", F, namer), F); } catch (e) { tree = null; }
        treeCache.map.set(t.line, tree);
      });
    }
    return out.map((x) => Object.assign(x, {tree: treeCache.map.get(x.line)})).filter((x) => x.tree);
  }

  /* The highlight's line in a stopping rule's output: its description gets the line (over its own lines, as the
     highlight's own rule writes it), or is the line where the rule had none. */
  function withLine(out, color, text) {
    const l = out.indexOf("{"), r = out.indexOf("}", l + 1);
    const add = "%" + color + "%" + text;
    if (l >= 0 && r > l) return out.slice(0, r) + (out.slice(l + 1, r).trim() ? "%CL%" : "") + add + out.slice(r);
    return out + "{" + add + "}";
  }

  /* Twins of Erazure's stopping rules for a highlight's items: charms, jewels, quivers and other items Erazure ends
     early never reach the highlight's own line before the last rule, so each such rule gets a twin right above it
     (the highlight's condition and its own, its output with the line added). Exact: the twin matches only items both
     match. [[line index, twin]]. */
  function twins(lines, list) {
    const out = [];
    const cat = EZ.items.catalog && EZ.items.catalog();
    if (!cat || !cat.bases || !cat.bases.size || !EZ.overrides) return out;
    const stops = stoppers(lines);
    for (const {w, r} of list) {
      const t = EZ.overrides.treeOf(r.cond, {});
      if (!t) continue;
      const quals = (w.quals || []).filter((q) => QUALS.indexOf(q) >= 0);
      const cands = [];
      for (const code of EZ.overrides.codesOf(t.tree, t.F).slice(0, 200)) {
        const b = cat.bases.get(code);
        for (const quality of quals.length ? quals : QUALS) cands.push({code, base: b, quality, id: true});
      }
      if (!cands.length) continue;
      const F0 = {formulas: Object.create(null), statMax: 1023, skillMax: 1023, soundCount: 10000};
      const color = COLORS.indexOf(w.color) >= 0 ? w.color : "GREEN";
      const text = clean(w.line) || clean(w.name) || "Highlight";
      for (const s of stops) {
        if (!cands.some((it) => EZ.engine.evalCondition(s.tree, it, {}, F0) !== 0 &&
                                EZ.engine.evalCondition(t.tree, it, {}, t.F) !== 0)) continue;
        const top = EZ.overrides.topWords(s.r.cond);
        const sc = top && top.some((x) => x === "OR" || x === "||") ? "(" + s.r.cond.trim() + ")" : s.r.cond.trim();
        out.push([s.i, "ItemDisplay[" + r.cond + " " + sc + "]:" + withLine(s.r.out, color, text) +
          "// Your highlight: " + (clean(w.name) || text)]);
      }
    }
    return out;
  }

  function apply(ctx) {
    const pairs = (ctx.edits.wishlists || []).filter(valid).map((w) => ({w, r: rule(w)})).filter((x) => x.r);
    if (!pairs.length) return;
    const list = pairs.map((x) => x.r);
    // the twins first (their places are lines of Erazure's), from the bottom up so the places stay
    const byLine = new Map();
    for (const [i, line] of twins(ctx.lines, pairs)) {
      if (!byLine.has(i)) byLine.set(i, []);
      byLine.get(i).push(line);
    }
    for (const i of [...byLine.keys()].sort((a, b) => b - a)) ctx.lines.splice(i, 0, ...byLine.get(i));
    for (const which of ["top", "bottom"]) {
      const lines = list.map((r) => r[which]).filter(Boolean);
      if (!lines.length) continue;
      const secs = EZ.filter.sections(ctx.src, ctx.lines);
      const range = secs[EZ.rules.PLACE[which]];
      if (!range) { ctx.unplaced("highlights", "Your highlights", "Erazure no longer has " + EZ.rules.PLACE[which]); continue; }
      ctx.lines.splice(range[0], 0, MARKS[which][0], ...lines, MARKS[which][1]);
    }
  }

  return {rule, apply, describe, twins, formulaOf, wordsOf, valid, COLORS, QUALS, MARKS};
})();

if (EZ.edits) {
  EZ.edits.step(600, (ctx) => EZ.wishlists.apply(ctx));
  EZ.edits.counter("wishlists", (e) => (e.wishlists || []).filter((w) => EZ.wishlists.valid(w) && EZ.wishlists.rule(w)).length);
}
