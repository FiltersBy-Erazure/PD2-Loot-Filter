/* Per-item overrides (the Items area): show, hide, mute, another sound or icon, icon only, an alert of the player's,
   a changed or replaced look, for a set of items (bases or uniques / sets on their base, a quality, ethereal or not,
   identified or not, filter levels, character levels). Each is exact for BH and keeps Erazure's looks: it changes
   only the rules that can match its items (the engine's three-valued test on the items with everything else left
   open), and only for them:

   - show: the hide rules that can match get " !(X)" (one that also alerts is split, its twin for X keeping the alert
     and passing the item on to the rules after it);
   - hide: a rule "(X) GROUND !TOWN FILTLVL>0" hides the item before Erazure's rules, and every alerting rule that can
     match gets " !(that)", so BH draws nothing at all (no label, no icon) where it is hidden;
   - mute, another sound, another icon, icon only: every alerting rule that can match is split into "C !(X)" (as it
     was) and "C (X)" (its twin, changed);
   - an alert of the player's: "only if Erazure has none" is a rule before the catch-all (BH's alert pass takes the
     first alerting rule that matches); "instead of Erazure's" is a rule before Erazure's rules and Erazure's alerting
     rules split, their twins without alerts;
   - change the look: every rule that decides the look and can match is split, its twin with the player's text (its
     description and alerts kept); replace the look: a rule before Erazure's rules that decides it.

   Overrides go from the widest to the narrowest (each changes the lines the ones before it left), so a narrower one
   wins where they meet; their rules before Erazure's go narrowest first. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.overrides = (function () {
  "use strict";
  const ACTIONS = ["show", "hide", "mute", "sound", "icon", "iconOnly", "notify", "look", "replace", "hunt"];
  /* A hunted item: shown wherever Erazure hides it, a loud look where Erazure decides its look, and an alert of its
     own instead of Erazure's (the player can change each). */
  const HUNT = {text: "%PURPLE%>>> %NAME% %PURPLE%<<<", alert: {icon: {BORDER: "9B", MAP: "9B", DOT: "20"}, sound: 4728,
                                                                chat: "all"}};
  const QUALITY_WORD = {INF: "INF", NORM: "(NMAG !SUP !INF)", SUP: "SUP", NMAG: "NMAG", MAG: "MAG", RARE: "RARE",
                        CRAFT: "CRAFT", SET: "SET", UNI: "UNI"};
  const NOTIFY_ALL = /%(?:BORDER|MAP|DOT|PX|LINE|NOTIFY)-[0-9a-f]{1,4}%|%SOUNDID-\d{1,4}%|%TIER-\d%/gi;
  const ICONS = /%(?:BORDER|MAP|DOT|PX)-[0-9a-f]{1,4}%/gi;
  const SOUNDS = /%SOUNDID-\d{1,4}%/gi;
  const TIERS = /%TIER-\d%/gi;
  const MARKS = {
    top: ["// ===============  Your item changes (Erazure Filter Editor), before Erazure's rules  ===============",
          "// ===============  End of your item changes before Erazure's rules  ==============="],
    bottom: ["// ===============  Your item alerts (Erazure Filter Editor), where Erazure has none  ===============",
             "// ===============  End of your item alerts  ==============="],
  };
  const int = (v) => { const n = parseInt(v, 10); return isNaN(n) ? null : n; };

  /* ---------------------------------------------------------------- the items an override is for */

  /* Its items as a BH condition (X). */
  function cond(s) {
    const parts = [];
    const codes = (s.codes || []).filter((c) => /^[a-z0-9]{2,4}$/.test(c));
    if (codes.length) parts.push(codes.length === 1 ? codes[0] : "(" + codes.join(" OR ") + ")");
    if (QUALITY_WORD[s.quality]) parts.push(QUALITY_WORD[s.quality]);
    if (s.eth === "yes") parts.push("ETH"); else if (s.eth === "no") parts.push("!ETH");
    if (s.id === "yes") parts.push("ID"); else if (s.id === "no") parts.push("!ID");
    const lv = EZ.rules.levelWords(s.levels || []);
    if (lv) parts.push(lv);
    const a = int((s.clvl || [])[0]), b = int((s.clvl || [])[1]);
    if (a !== null && a > 1) parts.push("CLVL>" + (a - 1));
    if (b !== null && b < 99) parts.push("CLVL<" + (b + 1));
    if (typeof s.extra === "string" && s.extra.trim()) {  // more words (the Maps area's stat tests, formulas)
      parts.push(s.extra.replace(/\/\/+/g, "/").replace(/[\r\n:[\]]/g, " ").trim());
    }
    return parts.join(" ");
  }

  /* Overrides other areas make from their own settings: fn(edits, ctx) -> [override] (the Maps area's hides). */
  const generators = [];

  /* The items with only what the override fixes known (the engine reads everything else as "maybe"). */
  function partials(s) {
    const out = [];
    for (const code of s.codes || []) {
      const base = EZ.items.base(code);
      if (!base) continue;
      out.push({code, base, quality: !EZ.items.qualities(base) ? "NORM" : s.quality && s.quality !== "NMAG" ? s.quality :
        undefined,
                eth: s.eth === "yes" ? true : s.eth === "no" ? false : undefined,
                id: s.id === "yes" ? true : s.id === "no" ? false : undefined});
    }
    return out;
  }

  function contexts(s) {
    const lv = (s.levels || []).map(int).filter((n) => n !== null);
    return lv.length ? lv.map((n) => ({filtlvl: n})) : [{}];
  }

  const valid = (o) => o && typeof o === "object" && ACTIONS.indexOf(o.action) >= 0 && o.scope &&
    typeof o.scope === "object" && Array.isArray(o.scope.codes) && o.scope.codes.length > 0;

  /* How narrow an override is (higher: narrower): fewer items, a quality, ethereal, identified, levels. */
  function narrowness(o) {
    const s = o.scope;
    return -Math.min(50, s.codes.length) + (s.quality ? 60 : 0) + (s.eth && s.eth !== "any" ? 10 : 0) +
      (s.id && s.id !== "any" ? 10 : 0) + ((s.levels || []).length ? 20 - s.levels.length : 0) +
      ((s.clvl || []).some((x) => x !== "" && x !== null && x !== undefined) ? 5 : 0);
  }

  /* ---------------------------------------------------------------- the rules, read as BH reads them */

  const memo = new Map();
  let memoKey = null;

  /* Every active rule of the lines: [{i, r (EZ.filter.rule), tree, act}], conditions and outputs with the aliases
     written in (kept by line text while the aliases stay the same). */
  function read(lines) {
    const entries = EZ.core.bhEntries(lines);
    const aliases = EZ.core.bhAliases(entries);
    const key = aliases.map((a) => a.name + "=" + a.value).join("\n");
    if (key !== memoKey || memo.size > 60000) { memo.clear(); memoKey = key; }
    const F = {formulas: Object.create(null), formulaText: Object.create(null), statMax: 1023, skillMax: 1023,
               soundCount: 10000};
    const cat = EZ.items.catalog && EZ.items.catalog();
    if (cat) { F.statMax = cat.statMax; F.skillMax = cat.skillMax; }
    for (const e of entries) {
      const m = /^Formula\[(.*)\]$/.exec(e.key);
      if (!m) continue;
      const node = EZ.engine.compileFormula(e.value);
      if (node) F.formulas["FORMULA" + m[1].replace(/[a-z]/g, (x) => x.toUpperCase())] = node;
    }
    const namer = EZ.engine.islandNamer();
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith("ItemDisplay[")) continue;
      const r = EZ.filter.rule(line);
      if (!r) continue;
      let m = memo.get(line);
      if (!m) {
        const t = EZ.core.substitute([[r.cond], [EZ.core.bhTrim(r.out)]], aliases);
        const isl = EZ.engine.islandsOf(t[0][0], "", "", F, namer);
        m = {tree: EZ.engine.condition(isl, F), act: EZ.engine.action(EZ.engine.islandsOf(t[1][0], "%", "%", F, namer), F)};
        memo.set(line, m);
      }
      out.push({i, r, tree: m.tree, act: m.act});
    }
    return {rules: out, F};
  }

  /* ---------------------------------------------------------------- rewriting lines */

  function withCond(line, extra) {
    const r = EZ.filter.rule(line);
    return r.off + "ItemDisplay[" + (r.cond ? r.cond + " " : "") + extra + "]:" + r.out + r.comment;
  }
  function withOut(line, out) {
    const r = EZ.filter.rule(line);
    return r.off + "ItemDisplay[" + r.cond + "]:" + out + r.comment;
  }
  const notifyKeys = (out) => (out.match(NOTIFY_ALL) || []).join("");
  const descOf = (out) => { const m = /\{[^}]*\}?/.exec(out.replace(NOTIFY_ALL, "")); return m ? m[0] : ""; };
  const icons = (combo) => combo ? combo.split(" ").filter(Boolean).map((k) => "%" + k + "%").join("") : "";

  /* The alert keywords the player picked: icon layers, a sound, the chat line. */
  function alertText(a) {
    a = a || {};
    let out = "";
    for (const l of EZ.rules.LAYERS) {
      const c = String((a.icon || {})[l] || "");
      if (/^[0-9A-Fa-f]{1,2}$/.test(c)) out += "%" + l + "-" + c.toUpperCase().padStart(2, "0") + "%";
    }
    const s = int(a.sound);
    if (s && s > 0) out += "%SOUNDID-" + s + "%";
    if (out && a.chat === "none") out += "%TIER-0%";
    else if (out && a.chat === "tier" && int(a.tier) !== null) out += "%TIER-" + Math.max(0, Math.min(9, int(a.tier))) + "%";
    return out;
  }

  /* The player's text for a look (no // and no line breaks; braces only as they wrote them). */
  const clean = (t) => String(t || "").replace(/[\r\n]+/g, " ").replace(/\/\/+/g, "/");

  /* One override applied to the lines: {lines, top: [lines before Erazure's], bottom: [lines before the end]}. */
  function one(lines, o) {
    const X = cond(o.scope);
    if (!X) return {lines, top: [], bottom: []};
    const {rules, F} = read(lines);
    const items = partials(o.scope), ctxs = contexts(o.scope);
    const can = (x) => x.tree && items.some((it) => ctxs.some((c) => EZ.engine.evalCondition(x.tree, it, c, F) !== 0));
    const add = new Map(), split = new Map();  // line -> extra condition; line -> twin output
    const top = [], bottom = [];
    const g = "(" + X + ")";
    if (o.action === "show") {
      for (const x of rules) {
        if (x.act.text.length || !can(x)) continue;
        if (x.act.notifies && !x.act.cont) split.set(x.i, "%NAME%{%NAME%}" + notifyKeys(x.r.out) + "%CONTINUE%");
        else add.set(x.i, "!" + g);
      }
    } else if (o.action === "hide") {
      const hidden = "(" + g + " GROUND !TOWN FILTLVL>0)";
      top.push("ItemDisplay[" + g + " GROUND !TOWN FILTLVL>0]:");
      for (const x of rules) if (x.act.notifies && can(x)) add.set(x.i, "!" + hidden);
    } else if (["mute", "sound", "icon", "iconOnly"].indexOf(o.action) >= 0) {
      for (const x of rules) {
        if (!x.act.notifies || !can(x)) continue;
        let out = x.r.out;
        if (o.action === "mute") out = out.replace(SOUNDS, "");
        else if (o.action === "sound") {
          const s = int(o.sound);
          const kw = s && s > 0 ? "%SOUNDID-" + s + "%" : "";
          out = out.search(SOUNDS) >= 0 ? out.replace(SOUNDS, () => kw) : out + kw;
        } else if (o.action === "icon") {
          const kw = icons(typeof o.icon === "string" ? o.icon : "");
          const at = out.search(ICONS);
          out = at >= 0 ? out.replace(ICONS, "").slice(0, at) + kw + out.replace(ICONS, "").slice(at) : out + kw;
        } else {
          out = out.search(TIERS) >= 0 ? out.replace(TIERS, "%TIER-0%") : out + "%TIER-0%";
        }
        if (out !== x.r.out) split.set(x.i, out);
      }
    } else if (o.action === "notify") {
      const kw = alertText(o.alert);
      if (!kw) return {lines, top, bottom};
      const rule = "ItemDisplay[" + X + "]:%NAME%{%NAME%}" + kw + "%CONTINUE%";
      if (o.mode === "instead") {
        top.push(rule);
        for (const x of rules) {
          if (!x.act.notifies || !can(x)) continue;
          split.set(x.i, x.r.out.replace(NOTIFY_ALL, ""));
        }
      } else bottom.push(rule);
    } else if (o.action === "look") {
      const text = clean(o.text);
      for (const x of rules) {
        if (x.act.cont || !x.act.text.length || !can(x)) continue;
        split.set(x.i, text.replace(/[{}]/g, "") + descOf(x.r.out) + notifyKeys(x.r.out));
      }
    } else if (o.action === "replace") {
      top.push("ItemDisplay[" + X + "]:" + clean(o.text));
    }
    if (!add.size && !split.size) return {lines, top, bottom};
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      if (add.has(i)) out.push(withCond(lines[i], add.get(i)));
      else if (split.has(i)) {
        out.push(withCond(lines[i], "!" + g));
        out.push(withOut(withCond(lines[i], g), split.get(i)));
      } else out.push(lines[i]);
    }
    return {lines: out, top, bottom};
  }

  /* The edit step (after the level copies, before the player's own rules). */
  function apply(ctx) {
    const made = generators.flatMap((g) => { try { return g(ctx.edits, ctx) || []; } catch (e) { return []; } });
    const list = (ctx.edits.items || []).concat(made).filter(valid).flatMap((o) => o.action !== "hunt" ? [o] : [
      Object.assign({}, o, {action: "show"}),
      Object.assign({}, o, {action: "look", text: typeof o.text === "string" && o.text ? o.text : HUNT.text}),
      Object.assign({}, o, {action: "notify", mode: "instead", alert: o.alert || HUNT.alert})]);
    if (!list.length) return;
    const sorted = list.map((o, k) => ({o, k, n: narrowness(o)})).sort((a, b) => a.n - b.n || a.k - b.k);
    const tops = [], bottoms = [];
    let lines = ctx.lines;
    for (const {o, n} of sorted) {
      const r = one(lines, o);
      lines = r.lines;
      if (r.top.length) tops.push({n, lines: r.top});
      if (r.bottom.length) bottoms.push({n, lines: r.bottom});
    }
    tops.sort((a, b) => b.n - a.n);  // the narrowest first: a stopping rule there wins
    ctx.lines = lines;
    const put = (which, groups, section) => {
      if (!groups.length) return;
      const secs = EZ.filter.sections(ctx.src, ctx.lines);
      const range = secs[section];
      if (!range) { ctx.unplaced("items", which, "Erazure no longer has " + section); return; }
      ctx.lines.splice(range[0], 0, MARKS[which][0], ...groups.flatMap((g) => g.lines), MARKS[which][1]);
    };
    put("top", tops, EZ.rules.PLACE.top);
    put("bottom", bottoms, EZ.rules.PLACE.bottom);
  }

  return {apply, one, cond, partials, contexts, read, alertText, valid, narrowness, ACTIONS, MARKS, HUNT, generators};
})();

if (EZ.edits) {
  EZ.edits.step(500, (ctx) => EZ.overrides.apply(ctx));
  EZ.edits.counter("items", (e) => (e.items || []).filter(EZ.overrides.valid).length);
}
