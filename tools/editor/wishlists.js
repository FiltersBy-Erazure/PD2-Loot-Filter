/* Wishlists (the Wishlists area): identified items with the stats the player wants get a line in their description
   (and, if the player likes, an icon and a sound): kinds of items, qualities, the stats each must have, and "N of
   these" from a pool of others (BH's COUNT formula: each stat's test is true or false, the count against N). Each
   wishlist is %CONTINUE% rules, so Erazure's looks and tags still come: its label tag and alert before Erazure's rules,
   its description line right before Erazure's last rule (some of Erazure's layers start the description anew, so a
   line written earlier wouldn't last). It acts wherever the item is (inventory, stash, shops). */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.wishlists = (function () {
  "use strict";
  const MARKS = {
    top: ["// ===============  Your wishlists (Erazure Filter Editor): tags and alerts  ===============",
          "// ===============  End of your wishlists' tags and alerts  ==============="],
    bottom: ["// ===============  Your wishlists (Erazure Filter Editor): description lines  ===============",
             "// ===============  End of your wishlists' description lines  ==============="],
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
    const text = clean(w.line) || clean(w.name) || "Wishlist";
    const cond = conds.join(" "), note = w.name ? " // " + clean(w.name) : "";
    const alert = EZ.overrides.alertText(w.alert), tag = clean(w.tag);
    const top = tag || alert ? "ItemDisplay[" + cond + "]:" + (tag ? "%" + color + "%" + tag + "%CS%" : "") +
      "%NAME%{%NAME%}" + alert + "%CONTINUE%" + note : null;
    const bottom = "ItemDisplay[" + cond + "]:%NAME%{%NAME%%CL%%" + color + "%" + text + "}%CONTINUE%" + note;
    return {cond, top, bottom, line: top ? top + "\n" + bottom : bottom};
  }

  const valid = (w) => w && typeof w === "object" && !Array.isArray(w);

  function apply(ctx) {
    const list = (ctx.edits.wishlists || []).filter(valid).map(rule).filter(Boolean);
    if (!list.length) return;
    for (const which of ["top", "bottom"]) {
      const lines = list.map((r) => r[which]).filter(Boolean);
      if (!lines.length) continue;
      const secs = EZ.filter.sections(ctx.src, ctx.lines);
      const range = secs[EZ.rules.PLACE[which]];
      if (!range) { ctx.unplaced("wishlists", "Your wishlists", "Erazure no longer has " + EZ.rules.PLACE[which]); continue; }
      ctx.lines.splice(range[0], 0, MARKS[which][0], ...lines, MARKS[which][1]);
    }
  }

  return {rule, apply, formulaOf, wordsOf, valid, COLORS, QUALS, MARKS};
})();

if (EZ.edits) {
  EZ.edits.step(600, (ctx) => EZ.wishlists.apply(ctx));
  EZ.edits.counter("wishlists", (e) => (e.wishlists || []).filter((w) => EZ.wishlists.valid(w) && EZ.wishlists.rule(w)).length);
}
