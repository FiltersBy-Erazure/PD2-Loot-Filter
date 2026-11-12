/* Per-item overrides (the Items area): show, hide, mute, another sound or icon, icon only, an alert of the player's,
   a changed or replaced look, for a set of items: bases (or uniques / sets on their base), qualities (several, or
   non-magical), ethereal or not, identified or not, sockets (several counts), enhanced defense / damage at least,
   item level, filter levels, character levels. Each is exact for BH and keeps Erazure's looks: it changes only the
   rules that can match its items (the engine's three-valued test on the items with everything else left open), and
   only for them:

   - show: the hide rules that can match get " !(X)" (one that also alerts is split, its twin for X keeping the alert
     and passing the item on to the rules after it). Shown as level N shows it (asLevel): first every FILTLVL test of
     the rules that can match X, and of the aliases, reads level N for X on its levels ("(FILTLVL=5 OR (X))",
     "(FILTLVL<9 !(X))"), and a %TIER-n% that N and those levels fall on different sides of gets a twin for X, so X
     looks and alerts as on level N; then the show. With a look of the player's (look "own"): a show and a look;
   - hide: a rule "(X) GROUND !TOWN FILTLVL>0" hides the item before Erazure's rules, and every alerting rule that can
     match gets " !(that)", so BH draws nothing at all (no label, no icon) where it is hidden;
   - mute, another sound, another icon, icon only: every alerting rule that can match is split into "C !(X)" (as it
     was) and "C (X)" (its twin, changed);
   - an alert of the player's: "only if Erazure has none" is a rule before the catch-all (BH's alert pass takes the
     first alerting rule that matches); "instead of Erazure's" is a rule before Erazure's rules and Erazure's alerting
     rules split, their twins without alerts;
   - change the look: every rule that decides the look and can match is split, its twin with the player's text (its
     description and alerts kept); replace the look: a rule before Erazure's rules that decides it. keepColor: the
     name keeps its own color after the player's text (a twin per color: white, gray when ethereal or socketed, gold
     for runewords, the quality's own).

   Overrides go from the widest to the narrowest (each changes the lines the ones before it left), so a narrower one
   wins where they meet; for two alike the later one. A wider one whose own rules sit outside Erazure's (a hide's
   line, a replaced look, an alert of the player's) leaves out the items of each narrower one that must win there: a
   show in a hide, a look in a replaced look, any change of alerts in an alert of the player's. Their rules before
   Erazure's go narrowest first. */
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
  const QUALS = ["INF", "NORM", "SUP", "MAG", "RARE", "CRAFT", "SET", "UNI"];
  const WHITE = ["INF", "NORM", "SUP"];
  const NOTIFY_ALL = /%(?:BORDER|MAP|DOT|PX|LINE|NOTIFY)-[0-9a-f]{1,4}%|%SOUNDID-\d{1,4}%|%TIER-\d%/gi;
  const ICONS = /%(?:BORDER|MAP|DOT|PX)-[0-9a-f]{1,4}%/gi;
  const SOUNDS = /%SOUNDID-\d{1,4}%/gi;
  const TIERS = /%TIER-\d%/gi;
  const FILTLVL_RE = /FILTLVL(=|<|>|~)(\d+)(?:-(\d+))?/g;
  const MARKS = {
    top: ["// ===============  Your item changes (Erazure Filter Editor), before Erazure's rules  ===============",
          "// ===============  End of your item changes before Erazure's rules  ==============="],
    bottom: ["// ===============  Your item alerts (Erazure Filter Editor), where Erazure has none  ===============",
             "// ===============  End of your item alerts  ==============="],
  };
  const int = (v) => { const n = parseInt(v, 10); return isNaN(n) ? null : n; };

  /* ---------------------------------------------------------------- the items an override is for */

  /* Its qualities, in one order: [] for every quality (scope.quals; an older override's scope.quality; NMAG is low
     quality, normal and superior). */
  function qualsOf(s) {
    const pick = Array.isArray(s.quals) ? s.quals : typeof s.quality === "string" && s.quality ? [s.quality] : [];
    const set = new Set();
    for (const q of pick) {
      if (q === "NMAG") for (const w of WHITE) set.add(w);
      else if (QUALS.indexOf(q) >= 0) set.add(q);
    }
    return set.size === QUALS.length ? [] : QUALS.filter((q) => set.has(q));
  }

  /* The qualities as BH words: "RARE", "NMAG", "(NMAG OR MAG)". */
  function qualityWords(quals) {
    if (!quals.length) return "";
    const white = WHITE.every((q) => quals.indexOf(q) >= 0);
    const parts = (white ? ["NMAG"] : []).concat(quals.filter((q) => !white || WHITE.indexOf(q) < 0)
      .map((q) => QUALITY_WORD[q]));
    return parts.length === 1 ? parts[0] : "(" + parts.join(" OR ") + ")";
  }

  /* Its socket counts (0-6): [] for any. */
  function socketsOf(s) {
    const set = new Set((Array.isArray(s.sockets) ? s.sockets : []).map(int).filter((n) => n !== null && n >= 0 && n <= 6));
    return set.size === 7 ? [] : [...set].sort((a, b) => a - b);
  }

  /* Its enhanced defense / damage at least (null: any). */
  function edOf(s) { const n = int(s.ed); return n !== null && n > 0 ? Math.min(n, 999) : null; }

  /* Its item level range: [from or null, to or null]. */
  function ilvlOf(s) {
    const r = Array.isArray(s.ilvl) ? s.ilvl : [];
    const a = int(r[0]), b = int(r[1]);
    return [a !== null && a > 1 ? Math.min(a, 99) : null, b !== null && b < 99 ? Math.max(b, 1) : null];
  }

  /* Its items as a BH condition (X); except: conditions of narrower overrides to leave out. */
  function cond(s, except) {
    const parts = [];
    const codes = (s.codes || []).filter((c) => /^[a-z0-9]{2,4}$/.test(c));
    if (codes.length) parts.push(codes.length === 1 ? codes[0] : "(" + codes.join(" OR ") + ")");
    const q = qualityWords(qualsOf(s));
    if (q) parts.push(q);
    if (s.eth === "yes") parts.push("ETH"); else if (s.eth === "no") parts.push("!ETH");
    if (s.id === "yes") parts.push("ID"); else if (s.id === "no") parts.push("!ID");
    const so = socketsOf(s);
    if (so.length) parts.push(so.length === 1 ? "SOCK=" + so[0] : "(" + so.map((n) => "SOCK=" + n).join(" OR ") + ")");
    const ed = edOf(s);
    if (ed) parts.push("ED>" + (ed - 1));
    const [ia, ib] = ilvlOf(s);
    if (ia) parts.push("ILVL>" + (ia - 1));
    if (ib) parts.push("ILVL<" + (ib + 1));
    const lv = EZ.rules.levelWords(s.levels || []);
    if (lv) parts.push(lv);
    const a = int((s.clvl || [])[0]), b = int((s.clvl || [])[1]);
    if (a !== null && a > 1) parts.push("CLVL>" + (a - 1));
    if (b !== null && b < 99) parts.push("CLVL<" + (b + 1));
    if (typeof s.extra === "string" && s.extra.trim()) {  // more words (the Maps area's stat tests, formulas; a rule's)
      parts.push(s.extra.replace(/\/\/+/g, "/").replace(/[\r\n:[\]]/g, " ").trim());
    }
    for (const e of except || []) parts.push("!(" + e + ")");
    return parts.join(" ");
  }

  /* Overrides other areas make from their own settings: fn(edits, ctx) -> [override] (the Maps area's hides). */
  const generators = [];

  /* The items with only what the override fixes known (the engine reads everything else as "maybe"): one per base
     and quality. */
  function partials(s) {
    const out = [];
    const quals = qualsOf(s);
    const eth = s.eth === "yes" ? true : s.eth === "no" ? false : undefined;
    const id = s.id === "yes" ? true : s.id === "no" ? false : undefined;
    for (const code of s.codes || []) {
      const base = EZ.items.base(code);
      if (!base) continue;
      const qs = !EZ.items.qualities(base) ? ["NORM"] : quals.length ? quals : [undefined];
      for (const quality of qs) out.push({code, base, quality, eth, id});
    }
    return out;
  }

  /* The filter levels to test rules at: the override's (with more, such as the level it shows its items as), or
     every level at once. */
  function contexts(s, more) {
    const lv = (s.levels || []).map(int).filter((n) => n !== null);
    if (!lv.length) return [{}];
    return [...new Set(lv.concat(more || []))].map((n) => ({filtlvl: n}));
  }

  const valid = (o) => o && typeof o === "object" && ACTIONS.indexOf(o.action) >= 0 && o.scope &&
    typeof o.scope === "object" && Array.isArray(o.scope.codes) && o.scope.codes.length > 0;

  /* How narrow an override is (higher: narrower): fewer items, a quality, ethereal, identified, sockets, enhanced
     defense / damage, item level, levels, more words. */
  function narrowness(o) {
    const s = o.scope, q = qualsOf(s).length, so = socketsOf(s).length;
    return -Math.min(50, s.codes.length) + (q ? 64 - 4 * q : 0) + (s.eth && s.eth !== "any" ? 10 : 0) +
      (s.id && s.id !== "any" ? 10 : 0) + ((s.levels || []).length ? 20 - s.levels.length : 0) +
      ((s.clvl || []).some((x) => x !== "" && x !== null && x !== undefined) ? 5 : 0) + (so ? 14 - so : 0) +
      (edOf(s) ? 6 : 0) + (ilvlOf(s).some((x) => x !== null) ? 6 : 0) +
      (typeof s.extra === "string" && s.extra.trim() ? 4 : 0);
  }

  /* Can two overrides' items meet? (no: no base in common, or levels, qualities, ethereal or identified apart) */
  function overlap(a, b) {
    const codes = new Set(a.codes);
    if (!b.codes.some((c) => codes.has(c))) return false;
    const la = (a.levels || []).map(int), lb = (b.levels || []).map(int);
    if (la.length && lb.length && !la.some((x) => lb.indexOf(x) >= 0)) return false;
    const qa = qualsOf(a), qb = qualsOf(b);
    if (qa.length && qb.length && !qa.some((x) => qb.indexOf(x) >= 0)) return false;
    for (const k of ["eth", "id"]) {
      if ((a[k] === "yes" && b[k] === "no") || (a[k] === "no" && b[k] === "yes")) return false;
    }
    const sa = socketsOf(a), sb = socketsOf(b);
    if (sa.length && sb.length && !sa.some((x) => sb.indexOf(x) >= 0)) return false;
    const [a1, a2] = ilvlOf(a), [b1, b2] = ilvlOf(b);
    if ((a1 || 1) > (b2 || 99) || (b1 || 1) > (a2 || 99)) return false;
    return true;
  }

  /* Must narrower n win where the rules of wider w sit outside Erazure's (so w leaves n's items out)? */
  const ALERTS = {mute: 1, sound: 1, icon: 1, iconOnly: 1, notify: 1, hide: 1};
  const levelled = (o) => o.action === "show" && int(o.asLevel) !== null;
  function beats(n, w) {
    if (w.action === "hide") return n.action === "show";
    if (w.action === "replace") return n.action === "look" || levelled(n);
    if (w.action === "notify") return !!ALERTS[n.action] || levelled(n);
    return false;
  }

  /* The colors a name can have, as [condition (null: the only one), color]: for "the name keeps its color". */
  function colorCases(s) {
    const q = qualsOf(s), all = !q.length, so = socketsOf(s);
    const out = [];
    if (all || q.some((x) => WHITE.indexOf(x) >= 0)) {
      const w = all ? "NMAG" : qualityWords(q.filter((x) => WHITE.indexOf(x) >= 0));
      const white = s.eth !== "yes" && (!so.length || so.indexOf(0) >= 0);
      const gray = !(s.eth === "no" && so.length && so.every((n) => n === 0));
      if (gray) out.push(["RW", "GOLD"]);
      if (gray && white) out.push([w + " !RW (ETH OR SOCK>0)", "GRAY"], [w + " !RW !ETH !SOCK>0", "WHITE"]);
      else if (gray) out.push([w + " !RW", "GRAY"]);
      else out.push([w, "WHITE"]);
    }
    for (const [k, col] of [["MAG", "BLUE"], ["RARE", "YELLOW"], ["CRAFT", "ORANGE"], ["SET", "GREEN"], ["UNI", "GOLD"]]) {
      if (all || q.indexOf(k) >= 0) out.push([k, col]);
    }
    return out.length === 1 ? [[null, out[0][1]]] : out;
  }

  /* The player's look with a color code right before its first %NAME% (outside the description). */
  function colored(text, col) {
    if (!col) return text;
    const at = text.indexOf("%NAME%"), brace = text.indexOf("{");
    if (at < 0 || (brace >= 0 && brace < at)) return text;
    return text.slice(0, at) + "%" + col + "%" + text.slice(at);
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
    return {rules: out, F, aliases};
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

  /* The truth of one FILTLVL comparison at level L. */
  function compares(op, a, b, L) {
    if (op === "=") return L === a;
    if (op === "<") return L < a;
    if (op === ">") return L > a;
    return b === undefined ? L === a : L >= a && L <= b;
  }

  /* Show as level N shows it: X's items on the override's levels read every FILTLVL test (of the rules that can match
     them, and of the aliases) as level N, and a %TIER-n% between N and those levels gets a twin for them. */
  function asLevel(lines, o, X) {
    const N = Math.max(0, Math.min(12, int(o.asLevel)));
    const scoped = (o.scope.levels || []).map(int).filter((n) => n !== null && n >= 0 && n <= 12);
    const levels = scoped.length ? scoped : Array.from({length: 13}, (_, k) => k);
    const g = "(" + X + ")";
    const rewrite = (text) => text.replace(FILTLVL_RE, (tok, op, x, y) => {
      const a = +x, b = y === undefined ? undefined : +y;
      const atN = compares(op, a, b, N);
      if (levels.every((L) => compares(op, a, b, L) === atN)) return tok;
      return atN ? "(" + tok + " OR " + g + ")" : "(" + tok + " !" + g + ")";
    });
    const out = lines.slice();
    for (let i = 0; i < out.length; i++) {
      const m = EZ.filter.ALIAS_RE.exec(out[i]);
      if (m && m[2].indexOf("FILTLVL") >= 0) {
        const v = rewrite(m[2]);
        if (v !== m[2]) out[i] = "Alias[" + m[1] + "]:" + v;
      }
    }
    const {rules, F} = read(lines);
    const items = partials(o.scope), ctxs = contexts(o.scope, [N]);
    const can = (x) => x.tree && items.some((it) => ctxs.some((c) => EZ.engine.evalCondition(x.tree, it, c, F) !== 0));
    const twins = new Map();
    for (const x of rules) {
      if (!can(x)) continue;
      const r = x.r;
      const c = r.cond.indexOf("FILTLVL") >= 0 ? rewrite(r.cond) : r.cond;
      const tier = x.act.notifies ? EZ.filter.TIER_RE.exec(r.out) : null;
      const n = tier ? +tier[1] : null;
      if (n !== null && levels.some((L) => (n >= L) !== (n >= N))) {
        out[x.i] = r.off + "ItemDisplay[" + (c ? c + " " : "") + "!" + g + "]:" + r.out + r.comment;
        twins.set(x.i, r.off + "ItemDisplay[" + (c ? c + " " : "") + g + "]:" +
          (n >= N ? r.out.replace(TIERS, "") : r.out.replace(TIERS, "%TIER-0%")) + r.comment);
      } else if (c !== r.cond) {
        out[x.i] = r.off + "ItemDisplay[" + c + "]:" + r.out + r.comment;
      }
    }
    if (!twins.size) return out;
    const done = [];
    for (let i = 0; i < out.length; i++) {
      done.push(out[i]);
      if (twins.has(i)) done.push(twins.get(i));
    }
    return done;
  }

  /* One override applied to the lines: {lines, top: [lines before Erazure's], bottom: [lines before the end]}. */
  function one(lines, o) {
    const X = cond(o.scope, o.except);
    if (!X) return {lines, top: [], bottom: []};
    const N = o.action === "show" ? int(o.asLevel) : null;
    if (N !== null) lines = asLevel(lines, o, X);
    const {rules, F} = read(lines);
    const items = partials(o.scope), ctxs = contexts(o.scope, N !== null ? [N] : []);
    const can = (x) => x.tree && items.some((it) => ctxs.some((c) => EZ.engine.evalCondition(x.tree, it, c, F) !== 0));
    const add = new Map(), split = new Map();  // line -> extra condition; line -> [[twin's condition, its output]]
    const top = [], bottom = [];
    const g = "(" + X + ")";
    const twin = (i, out) => split.set(i, [[g, out]]);
    if (o.action === "show") {
      for (const x of rules) {
        if (x.act.text.length || !can(x)) continue;
        if (x.act.notifies && !x.act.cont) twin(x.i, "%NAME%{%NAME%}" + notifyKeys(x.r.out) + "%CONTINUE%");
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
        if (out !== x.r.out) twin(x.i, out);
      }
    } else if (o.action === "notify") {
      const kw = alertText(o.alert);
      if (!kw) return {lines, top, bottom};
      const rule = "ItemDisplay[" + X + "]:%NAME%{%NAME%}" + kw + "%CONTINUE%";
      if (o.mode === "instead") {
        top.push(rule);
        for (const x of rules) {
          if (!x.act.notifies || !can(x)) continue;
          twin(x.i, x.r.out.replace(NOTIFY_ALL, ""));
        }
      } else bottom.push(rule);
    } else if (o.action === "look") {
      const text = clean(o.text);
      const cases = o.keepColor ? colorCases(o.scope) : [[null, null]];
      for (const x of rules) {
        if (x.act.cont || !x.act.text.length || !can(x)) continue;
        const tail = descOf(x.r.out) + notifyKeys(x.r.out);
        split.set(x.i, cases.map(([c, col]) => [c ? g + " " + c : g, colored(text, col).replace(/[{}]/g, "") + tail]));
      }
    } else if (o.action === "replace") {
      const text = clean(o.text);
      for (const [c, col] of o.keepColor ? colorCases(o.scope) : [[null, null]]) {
        top.push("ItemDisplay[" + (c ? g + " " + c : X) + "]:" + colored(text, col));
      }
    }
    if (!add.size && !split.size) return {lines, top, bottom};
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      if (add.has(i)) out.push(withCond(lines[i], add.get(i)));
      else if (split.has(i)) {
        out.push(withCond(lines[i], "!" + g));
        for (const [c, o2] of split.get(i)) out.push(withOut(withCond(lines[i], c), o2));
      } else out.push(lines[i]);
    }
    return {lines: out, top, bottom};
  }

  /* What an override does, as the overrides the steps apply: a hunt is a show, a look and an alert instead of
     Erazure's; a show with a look of the player's is a show and a look. */
  function expand(o) {
    if (o.action === "hunt") {
      return [Object.assign({}, o, {action: "show", asLevel: undefined}),
        Object.assign({}, o, {action: "look", text: typeof o.text === "string" && o.text ? o.text : HUNT.text}),
        Object.assign({}, o, {action: "notify", mode: "instead", alert: o.alert || HUNT.alert})];
    }
    if (o.action === "show" && o.look === "own" && typeof o.text === "string" && o.text.trim()) {
      return [Object.assign({}, o, {asLevel: undefined}), Object.assign({}, o, {action: "look", asLevel: undefined})];
    }
    if (o.action === "show" && o.look !== "level") return [Object.assign({}, o, {asLevel: undefined})];
    return [o];
  }

  /* The edit step (after the level copies, before the player's own rules). */
  function apply(ctx) {
    const made = generators.flatMap((g) => { try { return g(ctx.edits, ctx) || []; } catch (e) { return []; } });
    const list = (ctx.edits.items || []).concat(made).filter(valid).flatMap(expand);
    if (!list.length) return;
    const sorted = list.map((o, k) => ({o, k, n: narrowness(o)})).sort((a, b) => a.n - b.n || a.k - b.k);
    for (let p = 0; p < sorted.length; p++) {
      const w = sorted[p].o, except = [];
      for (let q = p + 1; q < sorted.length; q++) {
        const nn = sorted[q].o;
        if (beats(nn, w) && overlap(nn.scope, w.scope)) except.push(cond(nn.scope));
      }
      sorted[p].except = except;
    }
    const tops = [], bottoms = [];
    let lines = ctx.lines;
    for (const {o, n, except} of sorted) {
      const r = one(lines, except.length ? Object.assign({}, o, {except}) : o);
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

  /* ---------------------------------------------------------------- a rule of the player's as item changes */

  /* The bases a condition can match (with everything else open): [codes]. F: the formulas it may ask. */
  function codesOf(tree, F) {
    const out = [];
    for (const b of EZ.items.catalog().bases.values()) {
      if (EZ.engine.evalCondition(tree, {code: b.code, base: b}, {}, F) !== 0) out.push(b.code);
    }
    return out;
  }

  /* The condition of a line of the player's, as BH reads it: {tree, F} or null. opts: {aliases, F}. */
  function treeOf(cond, opts) {
    const F = opts.F || {formulas: Object.create(null), statMax: 1023, skillMax: 1023, soundCount: 10000};
    const sub = opts.aliases && opts.aliases.length ? EZ.core.substitute([[cond], [""]], opts.aliases)[0][0] : cond;
    const isl = EZ.engine.islandsOf(sub, "", "", {formulas: F.formulas, formulaText: {}}, EZ.engine.islandNamer());
    const tree = EZ.engine.condition(isl, F);
    return tree ? {tree, F} : null;
  }

  /* Erazure's alerting rules (icon, chat line, sound) that can meet the items a condition matches, at the same filter
     level: [line index] (at most limit). Fz: Erazure's compiled filter. */
  function alertsMeeting(tree, F, Fz, limit) {
    const cat = EZ.items.catalog(), found = [];
    if (!Fz || !Fz.mapRules) return found;
    const L = Array.from({length: 13}, (_, k) => ({filtlvl: k}));
    const cands = [];  // the items the condition can match (base and quality) and at which levels
    for (const code of codesOf(tree, F).slice(0, 80)) {
      const b = cat.bases.get(code);
      for (const quality of EZ.items.qualities(b) ? QUALS : ["NORM"]) {
        const it = {code, base: b, quality};
        const at = L.filter((c) => EZ.engine.evalCondition(tree, it, c, F) !== 0);
        if (at.length) cands.push({it, at});
      }
    }
    for (const r of Fz.mapRules) {
      if (!r.tree) continue;
      const hit = cands.some(({it, at}) => (!r.codes || r.codes.has(it.code)) && (!r.quals || r.quals.has(it.quality)) &&
        at.some((c) => EZ.engine.evalCondition(r.tree, it, c, Fz) !== 0));
      if (hit) { found.push(r.i); if (found.length >= (limit || 3)) break; }
    }
    return found;
  }

  /* A condition's words at its top level (a bracketed group is one word); null if its brackets don't close. */
  function topWords(cond) {
    const out = [];
    let depth = 0, cur = "";
    for (const ch of cond.trim()) {
      if (ch === "(") depth++;
      else if (ch === ")" && --depth < 0) return null;
      if (/\s/.test(ch) && depth === 0) { if (cur) out.push(cur); cur = ""; } else cur += ch;
    }
    if (depth) return null;
    if (cur) out.push(cur);
    return out;
  }

  /* A condition taken apart into an override's scope where its words fit the Items form: {codes, quals, eth, id,
     sockets, ed, ilvl, levels, clvl, extra (the words left)}. A word about the base alone (an item code, an item
     group, a tier: true or false for each base, never "maybe") is in the codes; GROUND !TOWN of a hide go (the hide
     has them). With an OR at the top (BH reads AND and OR left to right) the condition stays whole in extra. */
  function scopeOf(cond, codes, opts, hides) {
    const scope = {codes, quals: [], eth: "any", id: "any", sockets: [], ed: "", ilvl: ["", ""], levels: [],
                   clvl: ["", ""], extra: ""};
    const words = topWords(cond);
    if (!words || words.some((w) => w.toUpperCase() === "OR")) {
      scope.extra = (hides ? cond.replace(/(^|\s+)GROUND(\s+!TOWN)?\s*$/, "") : cond).trim();
      return scope;
    }
    const cat = EZ.items.catalog(), bases = [...cat.bases.values()];
    let levels = null, quals = null, socks = null, ilo = 1, ihi = 99, clo = 1, chi = 99, ed = 0;
    const rest = [];
    const range = (op, a, b, lo, hi) => {
      const out = new Set();
      for (let L = lo; L <= hi; L++) if (compares(op, a, b, L)) out.add(L);
      return out;
    };
    const meet = (a, b) => a === null ? b : new Set([...a].filter((x) => b.has(x)));
    const parts = (w) => {
      const m = /^\((.*)\)$/.exec(w);
      if (!m) return [w];
      const inner = topWords(m[1]);
      if (!inner || inner.length < 3 || inner.filter((x, k) => k % 2 === 1).some((x) => x.toUpperCase() !== "OR")) return null;
      return inner.filter((x, k) => k % 2 === 0);
    };
    const QWORD = {NMAG: WHITE, MAG: ["MAG"], RARE: ["RARE"], CRAFT: ["CRAFT"], SET: ["SET"], UNI: ["UNI"], SUP: ["SUP"],
                   INF: ["INF"]};
    for (const w of words) {
      if (hides && (w === "GROUND" || w === "!TOWN")) continue;
      const alts = parts(w);
      let m;
      if (alts && alts.every((x) => /^FILTLVL(=|<|>|~)(\d+)(?:-(\d+))?$/.test(x))) {
        const set = new Set();
        for (const x of alts) {
          const g = /^FILTLVL(=|<|>|~)(\d+)(?:-(\d+))?$/.exec(x);
          for (const L of range(g[1], +g[2], g[3] === undefined ? undefined : +g[3], 0, 12)) set.add(L);
        }
        levels = meet(levels, set);
      } else if (alts && alts.every((x) => QWORD[x])) {
        quals = meet(quals, new Set(alts.flatMap((x) => QWORD[x])));
      } else if (alts && alts.every((x) => /^SOCK=\d$/.test(x))) {
        socks = meet(socks, new Set(alts.map((x) => +x.slice(5))));
      } else if (w === "ETH" || w === "!ETH") scope.eth = w === "ETH" ? "yes" : "no";
      else if (w === "ID" || w === "!ID") scope.id = w === "ID" ? "yes" : "no";
      else if ((m = /^ILVL(>|<)(\d+)$/.exec(w))) { if (m[1] === ">") ilo = Math.max(ilo, +m[2] + 1); else ihi = Math.min(ihi, +m[2] - 1); }
      else if ((m = /^CLVL(>|<)(\d+)$/.exec(w))) { if (m[1] === ">") clo = Math.max(clo, +m[2] + 1); else chi = Math.min(chi, +m[2] - 1); }
      else if ((m = /^ED>(\d+)$/.exec(w)) && !ed) ed = +m[1] + 1;
      else {
        const t = treeOf(w, opts);
        const baseOnly = t && bases.every((b) => {
          const v = EZ.engine.evalCondition(t.tree, {code: b.code, base: b}, {}, t.F);
          return v === 0 || v === 1;
        });
        if (!baseOnly) rest.push(w);
      }
    }
    if (levels !== null) {
      const list = [...levels].filter((L) => L >= 1).sort((a, b) => a - b);
      if (!list.length) return null;  // no level left: the rule never shows its items
      scope.levels = list.length === 12 ? [] : list;
    }
    if (quals !== null) scope.quals = QUALS.filter((q) => quals.has(q));
    if (socks !== null) scope.sockets = [...socks].sort((a, b) => a - b);
    if (ed) scope.ed = String(ed);
    if (ilo > 1 || ihi < 99) scope.ilvl = [ilo > 1 ? String(ilo) : "", ihi < 99 ? String(ihi) : ""];
    if (clo > 1 || chi < 99) scope.clvl = [clo > 1 ? String(clo) : "", chi < 99 ? String(chi) : ""];
    scope.extra = rest.join(" ");
    return scope;
  }

  /* An item a condition can match, to draw it (Quick Edits' samples): {spec (for EZ.items.make), levels (the filter
     levels it holds on, [] for every one), cls, clvl} or null. Its base an elite one where the condition takes several
     (the first in the game's order), its quality the condition's (normal when it says none, superior with an enhanced
     defense / damage), ethereal, sockets and item level as the condition asks. */
  function sampleOf(cond, opts) {
    opts = opts || {};
    const t = treeOf(cond, opts);
    if (!t) return null;
    const codes = codesOf(t.tree, t.F);
    if (!codes.length) return null;
    const sc = scopeOf(cond, codes, opts, false);
    if (!sc) return null;
    const cat = EZ.items.catalog();
    const elite = (c) => (cat.bases.get(c).groups.indexOf("ELT") >= 0 ? 1 : 0);
    const order = codes.map((c, k) => [c, k]).sort((a, b) => elite(b[0]) - elite(a[0]) || a[1] - b[1]).map((x) => x[0]);
    const words = (sc.extra || "").split(/[\s()]+/);
    const clsWord = Object.keys(EZ.engine.CLASS_ID).find((w) => words.indexOf(w) >= 0);
    const cls = clsWord === undefined ? undefined : EZ.engine.CLASS_ID[clsWord];
    const clvl = int(sc.clvl[0]) || (int(sc.clvl[1]) ? Math.min(90, int(sc.clvl[1])) : 90);
    const [ia, ib] = ilvlOf(sc);
    const ilvl = ia || (ib ? Math.min(85, ib) : 85);
    const ed = edOf(sc);
    const prefer = ["NORM", "MAG", "RARE", "SUP", "CRAFT", "UNI", "SET", "INF"];
    for (const code of order.slice(0, 16)) {
      const b = cat.bases.get(code);
      const quals = !EZ.items.qualities(b) ? [undefined] : (sc.quals.length ? sc.quals : ["NORM"]).slice()
        .sort((x, y) => (ed ? (y === "SUP") - (x === "SUP") : 0) || prefer.indexOf(x) - prefer.indexOf(y));
      for (const quality of quals) {
        const spec = {code, ilvl};
        if (quality) spec.quality = quality;
        if (sc.eth === "yes") spec.eth = true;
        if (sc.id === "yes") spec.id = true;
        if (sc.sockets.length) spec.sockets = sc.sockets[0];
        if (ed && (b.armor || b.weapon)) spec.stats = [[b.armor ? 16 : 17, 0, ed]];
        const it = EZ.items.make(Object.assign({place: "GROUND"}, spec));
        if (!it) continue;
        const lv = sc.levels.length ? sc.levels : [1];
        const ok = lv.some((filtlvl) => EZ.engine.evalCondition(t.tree, it, {filtlvl, clvl, cls, diff: 2, mapid: 2,
          charstats: {12: clvl}}, t.F) !== 0);
        if (ok) return {spec, levels: sc.levels, cls, clvl: sc.clvl.some((x) => x !== "") ? clvl : undefined};
      }
    }
    return null;
  }

  /* A rule of the player's own (My rules, above Erazure's) as item changes: {list: [override]} or {why}. A hide
     becomes a hide (which takes Erazure's icons, chat lines and sounds too); a rule that decides the look becomes a
     show, with its text as the player's look unless it is just the name, and its alerts as alerts instead of
     Erazure's. opts: {aliases (as BH reads them where the rule sits), F (its formulas)}. */
  function fromRule(line, opts) {
    opts = opts || {};
    const d = EZ.rules.describe(line);
    if (d.kind !== "rule") return {why: "Only a rule (ItemDisplay[...]) can become an item change."};
    if (!d.stops) return {why: "A %CONTINUE% rule adds a layer to Erazure's: only a rule that decides what the item " +
      "shows can become an item change."};
    const t = treeOf(d.cond, opts);
    if (!t) return {why: "BH can't read this rule's condition."};
    const codes = codesOf(t.tree, t.F);
    if (!codes.length) return {why: "This rule matches no item."};
    if (codes.length > 400) return {why: `This rule is for ${codes.length} kinds of items: name the items (or a kind ` +
      "of item) in it first."};
    const id = () => "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const scope = scopeOf(d.cond, codes, opts, d.hides);
    if (!scope) return {why: "This rule is for no filter level from 1 to 12."};
    if (d.hides) return {list: [{id: id(), action: "hide", scope}]};
    const label = d.out.replace(/\{[^}]*\}?/, "").replace(NOTIFY_ALL, "").replace(/%CONTINUE%/g, "").trim();
    const list = [label === "%NAME%" ? {id: id(), action: "show", scope} :
      {id: id(), action: "show", look: "own", text: label, keepColor: false, scope}];
    if (d.notifies) {
      const alert = {icon: {}, sound: 0, chat: "all", tier: 4};
      let m;
      const re = /%(BORDER|MAP|DOT|PX)-([0-9a-f]{1,2})%/gi;
      while ((m = re.exec(d.out))) if (!alert.icon[m[1].toUpperCase()]) alert.icon[m[1].toUpperCase()] = m[2].toUpperCase();
      const s = /%SOUNDID-(\d{1,4})%/i.exec(d.out);
      if (s) alert.sound = +s[1];
      const tier = /%TIER-(\d)%/i.exec(d.out);
      if (tier) { alert.chat = +tier[1] === 0 ? "none" : "tier"; alert.tier = +tier[1]; }
      list.push({id: id(), action: "notify", mode: "instead", alert, scope: JSON.parse(JSON.stringify(scope))});
    }
    return {list};
  }

  return {apply, one, cond, partials, contexts, read, alertText, valid, narrowness, overlap, beats, expand, qualsOf,
          socketsOf, edOf, ilvlOf, qualityWords, colorCases, colored, fromRule, scopeOf, topWords, treeOf, codesOf, alertsMeeting,
          sampleOf,
          ACTIONS, MARKS, HUNT, QUALS, WHITE, generators};
})();

if (EZ.edits) {
  EZ.edits.step(500, (ctx) => EZ.overrides.apply(ctx));
  EZ.edits.counter("items", (e) => (e.items || []).filter(EZ.overrides.valid).length);
}
