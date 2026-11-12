/* The player's own rules (My rules): two blocks of filter lines the player writes or builds, one above Erazure's rules
   (right before 050's options, after 045 / 047's name rebuilds, so their %NAME% has Erazure's base names) and one
   below them (right before 370's catch-all), each between two marker comments. Lines are put in as they are typed;
   BH reads them with every alias (Erazure's too), and the aliases are written out with the rest of the file.

   Also the rule builder's text: EZ.rules.build(spec) -> one rule line from the builder's fields (the area draws the
   form; tools/editor_selftest.py checks the lines it makes). */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.rules = (function () {
  "use strict";
  const PLACE = {top: "050-customization.filter", bottom: "370-catch-all.filter"};
  const MARKS = {
    top: ["// ===============  Your own rules (Erazure Filter Editor), above Erazure's rules  ===============",
          "// ===============  End of your own rules above Erazure's  ==============="],
    bottom: ["// ===============  Your own rules (Erazure Filter Editor), below Erazure's rules  ===============",
             "// ===============  End of your own rules below Erazure's  ==============="],
  };
  const BLOCKS = ["top", "bottom"];

  /* A block's text as lines (any line breaks; no line break characters left in a line). */
  function lines(text) {
    if (typeof text !== "string" || !text) return [];
    const out = text.replace(/\r\n?/g, "\n").split("\n");
    while (out.length && !out[out.length - 1].trim()) out.pop();
    return out;
  }

  const isComment = (line) => /^\s*\/\//.test(line);

  /* The lines BH reads (not blank, not a comment): what the block changes. */
  function active(list) { return list.filter((l) => l.trim() && !isComment(l)); }

  function blockText(e, which) { return e && e.rules && typeof e.rules[which] === "string" ? e.rules[which] : ""; }

  function count(e) {
    let n = 0;
    for (const b of BLOCKS) n += active(lines(blockText(e, b))).length;
    return n;
  }

  /* The edit step: each block that has a line BH reads goes in with its markers. */
  function apply(ctx) {
    for (const which of BLOCKS) {
      const list = lines(blockText(ctx.edits, which));
      if (!active(list).length) continue;
      const secs = EZ.filter.sections(ctx.src, ctx.lines);
      const range = secs[PLACE[which]];
      if (!range) { ctx.unplaced("rules", which === "top" ? "Your rules above Erazure's" : "Your rules below Erazure's",
                                 "Erazure moved the place they go"); continue; }
      ctx.lines.splice(range[0], 0, MARKS[which][0], ...list, MARKS[which][1]);
    }
  }

  /* ---------------------------------------------------------------- a line, for the block's list */

  /* {kind: rule / alias / formula / level / comment / blank / other, stops, hides, notifies, cond, out} as BH reads
     the line (cut at //, split at the first :). */
  function describe(line) {
    if (!line.trim()) return {kind: "blank"};
    if (isComment(line)) return {kind: "comment"};
    const c = line.indexOf("//");
    const code = c < 0 ? line : line.slice(0, c);
    const j = code.indexOf(":");
    const key = EZ.core.bhTrim(j < 0 ? code : code.slice(0, j));
    if (key.startsWith("Alias[")) return {kind: "alias", name: key.slice(6, -1)};
    if (key.startsWith("Formula[")) return {kind: "formula", name: key.slice(8, -1)};
    if (key.startsWith("ItemDisplayFilterName[")) return {kind: "level"};
    if (!key.startsWith("ItemDisplay[") || j < 0) return {kind: "other"};
    const out = EZ.core.bhTrim(code.slice(j + 1));
    const cont = out.indexOf("%CONTINUE%") >= 0;
    const notifies = EZ.filter.notifies(out);
    const text = out.replace(/\{[^}]*\}?/, "").replace(/%(CONTINUE|(BORDER|MAP|DOT|PX|LINE|NOTIFY)-[0-9a-f]{1,4}|SOUNDID-\d{1,4}|TIER-\d)%/gi, "");
    return {kind: "rule", cond: key.slice(12, -1), out, stops: !cont, hides: !cont && !text.length, notifies};
  }

  /* ---------------------------------------------------------------- the builder's rule */

  const QUALITY_WORD = {INF: "INF", NORM: "(NMAG !SUP !INF)", SUP: "SUP", NMAG: "NMAG", MAG: "MAG", RARE: "RARE",
                        CRAFT: "CRAFT", SET: "SET", UNI: "UNI"};
  const PLACE_WORDS = {ground: "GROUND !TOWN", groundAll: "GROUND", town: "TOWN", inventory: "INVENTORY",
                       stash: "STASH", cube: "CUBE", shop: "SHOP", equipped: "EQUIPPED", compendium: "COMPENDIUM"};
  const CLASS_WORDS = ["AMAZON", "SORCERESS", "NECROMANCER", "PALADIN", "BARBARIAN", "DRUID", "ASSASSIN"];
  const LAYERS = ["BORDER", "MAP", "DOT", "PX"];

  const anyOf = (parts) => parts.length === 0 ? "" : parts.length === 1 ? parts[0] : "(" + parts.join(" OR ") + ")";
  const int = (v) => { const n = parseInt(v, 10); return isNaN(n) ? null : n; };

  /* FILTLVL words for a set of levels (1-12): ranges joined; "" when every level (or none) is picked. */
  function levelWords(levels, max) {
    max = max || 12;
    const set = [...new Set((levels || []).map(int).filter((n) => n !== null && n >= 0 && n <= max))].sort((a, b) => a - b);
    if (!set.length) return "";
    if (set[0] <= 1 && set.length >= max - set[0] + 1 && set[set.length - 1] === max) return "";
    const runs = [];
    for (const n of set) {
      const last = runs[runs.length - 1];
      if (last && last[1] === n - 1) last[1] = n; else runs.push([n, n]);
    }
    const word = ([a, b]) => a === b ? "FILTLVL=" + a : b === max && a > 0 ? "FILTLVL>" + (a - 1) :
      a === 0 && b < max ? "FILTLVL<" + (b + 1) : "FILTLVL~" + a + "-" + b;
    return anyOf(runs.map(word));
  }

  /* A comparison as BH writes it: at least n -> >n-1, at most n -> <n+1, exactly, between a and b. */
  function compare(word, op, a, b) {
    const x = int(a), y = int(b);
    if (x === null) return "";
    if (op === "min") return word + ">" + (x - 1);
    if (op === "max") return word + "<" + (x + 1);
    if (op === "between" && y !== null) return x === y ? word + "=" + x : word + "~" + Math.min(x, y) + "-" + Math.max(x, y);
    return word + "=" + x;
  }

  /* One stat row of the builder: {word, op, a, b} for a named word, {stat: n}, {skill: id, total: {tab, cls}}. */
  function statWords(s) {
    if (!s) return "";
    if (s.skill !== undefined && s.skill !== null && s.skill !== "") {
      const id = int(s.skill);
      if (id === null) return "";
      if (!s.total) return compare("SK" + id, s.op, s.a, s.b);
      const parts = ["MULTI107," + id];
      if (s.tab !== undefined && s.tab !== null && s.tab !== "" && int(s.tab) !== null) parts.push("MULTI188," + int(s.tab));
      if (s.cls !== undefined && s.cls !== null && s.cls !== "" && int(s.cls) !== null) parts.push("MULTI83," + int(s.cls));
      parts.push("STAT127");
      const sum = parts.join("+");  // BH's sum of stats compares with = < > only
      if (s.op === "between") {
        const x = int(s.a), y = int(s.b);
        if (x === null || y === null) return compare(sum, "min", s.a);
        return sum + ">" + (Math.min(x, y) - 1) + " " + sum + "<" + (Math.max(x, y) + 1);
      }
      return compare(sum, s.op, s.a, s.b);
    }
    if (s.stat !== undefined && s.stat !== null && s.stat !== "") {
      const id = int(s.stat);
      return id === null ? "" : compare("STAT" + id, s.op, s.a, s.b);
    }
    if (!s.word || !/^[A-Z0-9_]+$/.test(s.word)) return "";
    return compare(s.word, s.op, s.a, s.b);
  }

  /* Text the player typed, safe inside a rule: no // (BH ends the line there), no { } in a label or description. */
  function clean(text, inDesc) {
    let t = String(text || "").replace(/[\r\n]+/g, " ").replace(/\/\/+/g, "/");
    if (inDesc) t = t.replace(/[{}]/g, "");
    return t;
  }

  /* spec -> {line, cond, out}. spec: {codes: [], groups: [], tiers: [NORM / EXC / ELT], hands (1H / 2H), quals: [], eth, id, rw ("yes" / "no"), sock: {op, a, b},
     ilvl: [min, max], levels: [], clvl: [min, max], classes: [], diffs: [], place, disc ("new" / "found"), stats: [],
     extra (more condition words), show ("show" / "hide"), text, desc: {how: keep / below / above / replace / clear,
     text}, icon: {BORDER: "0A", ...}, sound, chat ("all" / "tier" / "none"), tier, cont, comment}. */
  function build(spec) {
    spec = spec || {};
    const conds = [];
    const items = [];
    for (const c of spec.codes || []) if (/^[a-z0-9]{2,4}$/.test(c)) items.push(c);
    for (const g of spec.groups || []) if (/^[A-Z0-9]+$/.test(g)) items.push(g);
    if (items.length) conds.push(anyOf(items));
    const tiers = (spec.tiers || []).filter((t) => t === "NORM" || t === "EXC" || t === "ELT");
    if (tiers.length && tiers.length < 3) conds.push(anyOf(tiers));
    if (spec.hands === "1H" || spec.hands === "2H") conds.push(spec.hands);
    const quals = (spec.quals || []).filter((q) => QUALITY_WORD[q]).map((q) => QUALITY_WORD[q]);
    if (quals.length) conds.push(anyOf(quals));
    const yn = (v, word) => { if (v === "yes") conds.push(word); else if (v === "no") conds.push("!" + word); };
    yn(spec.eth, "ETH");
    yn(spec.id, "ID");
    yn(spec.rw, "RW");
    if (spec.sock && spec.sock.op && spec.sock.op !== "any") {
      const w = spec.sock.op === "none" ? "SOCK=0" : compare("SOCK", spec.sock.op, spec.sock.a, spec.sock.b);
      if (w) conds.push(w);
    }
    const range = (word, r, lo, hi) => {
      if (!r) return;
      const a = int(r[0]), b = int(r[1]);
      if (a !== null && a > lo) conds.push(word + ">" + (a - 1));
      if (b !== null && b < hi) conds.push(word + "<" + (b + 1));
    };
    range("ILVL", spec.ilvl, 1, 99);
    const lv = levelWords(spec.levels);
    // a hide for every level is for levels 1-12: level 0 (Show All Items) shows everything, as an item change's hide
    if (lv) conds.push(lv);
    else if (spec.show === "hide") conds.push("FILTLVL>0");
    range("CLVL", spec.clvl, 1, 99);
    const cls = (spec.classes || []).filter((c) => CLASS_WORDS.indexOf(c) >= 0);
    if (cls.length && cls.length < 7) conds.push(anyOf(cls));
    const diffs = [...new Set((spec.diffs || []).map(int).filter((d) => d === 0 || d === 1 || d === 2))].sort();
    if (diffs.length && diffs.length < 3) conds.push(anyOf(diffs.map((d) => "DIFF=" + d)));
    const hide = spec.show === "hide";
    const place = spec.place === undefined ? (hide ? "ground" : "any") : spec.place;
    if (PLACE_WORDS[place]) conds.push(PLACE_WORDS[place]);
    if (spec.disc === "new") conds.push("!ALLDISCOVERED");
    else if (spec.disc === "found") conds.push("ALLDISCOVERED");
    for (const s of spec.stats || []) {
      const w = statWords(s);
      if (w) conds.push(w);
    }
    const extra = clean(spec.extra).replace(/[\[\]:]/g, " ").trim();
    if (extra) conds.push(extra);
    let out = "";
    if (!hide) {
      out = clean(spec.text === undefined ? "%NAME%" : spec.text, true);
      const d = spec.desc || {how: "keep"};
      const t = clean(d.text, true);
      if (d.how === "below" && t) out += "{" + t + "%CL%%NAME%}";
      else if (d.how === "above" && t) out += "{%NAME%%CL%" + t + "}";
      else if (d.how === "replace") out += "{" + t + "}";
      else if (d.how === "clear") out += "{}";
      else out += "{%NAME%}";
    }
    const icon = spec.icon || {};
    for (const l of LAYERS) {
      const c = String(icon[l] || "");
      if (/^[0-9A-Fa-f]{1,2}$/.test(c)) out += "%" + l + "-" + c.toUpperCase().padStart(2, "0") + "%";
    }
    const sound = int(spec.sound);
    if (sound && sound > 0) out += "%SOUNDID-" + sound + "%";
    const alerts = /%(BORDER|MAP|DOT|PX)-|%SOUNDID-/.test(out);
    if (alerts && spec.chat === "none") out += "%TIER-0%";
    else if (alerts && spec.chat === "tier" && int(spec.tier) !== null) out += "%TIER-" + Math.max(0, Math.min(9, int(spec.tier))) + "%";
    if (spec.cont && !hide) out += "%CONTINUE%";
    const cond = conds.join(" ");
    const note = clean(spec.comment).trim();
    return {cond, out, line: "ItemDisplay[" + cond + "]:" + out + (note ? " // " + note : "")};
  }

  /* Where a line of a built filter is in the player's blocks: {block, n (its line in the block, from 1)} or null. */
  const found = new WeakMap();
  function locate(list, i) {
    let spans = found.get(list);
    if (!spans) {
      spans = [];
      for (const which of BLOCKS) {
        const a = list.indexOf(MARKS[which][0]);
        const b = a < 0 ? -1 : list.indexOf(MARKS[which][1], a + 1);
        if (a >= 0 && b > a) spans.push([which, a, b]);
      }
      found.set(list, spans);
    }
    for (const [which, a, b] of spans) if (i > a && i < b) return {block: which, n: i - a};
    return null;
  }

  return {lines, active, count, apply, describe, build, locate, levelWords, statWords, MARKS, PLACE, BLOCKS, CLASS_WORDS,
          PLACE_WORDS, LAYERS, isComment};
})();

/* The step and the count (after every other edit: the player's lines are as they typed them). */
if (EZ.edits) {
  EZ.edits.step(900, (ctx) => EZ.rules.apply(ctx));
  EZ.edits.counter("rules", (e) => EZ.rules.count(e));
}
