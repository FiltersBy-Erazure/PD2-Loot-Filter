/* The Filter Editor's reading of Erazure's lines (alias form, from the source): sections, rules, aliases, the
   filter level names, Erazure's own player options (050) and the cards of the aliases that draw something (the
   alias editor's: 040's symbol aliases and 020's version names). Everything here is read from the lines, never from
   the page's own data, so it follows each new Erazure. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.filter = (function () {
  "use strict";

  const OPTIONS_SECTION = "050-customization.filter";
  const SYMBOLS_SECTION = "040-aliases.filter";
  const CUBE_SECTION = "020-horadric-cube.filter";
  const RULE_RE = /^(\s*\/\/+\s*)?(ItemDisplay\[)/;
  const ALIAS_RE = /^Alias\[([A-Za-z0-9_]+)\]:(.*)$/;
  const NOTIFY_RE = /%(?:BORDER|MAP|DOT|PX|LINE)-[0-9a-f]{1,4}%|%SOUNDID-\d{1,4}%/i;
  const ICON_RE = /%(BORDER|MAP|DOT|PX)-([0-9a-f]{1,4})%/gi;
  const SOUND_RE = /%SOUNDID-(\d{1,4})%/gi;
  const TIER_RE = /%TIER-(\d)%/i;
  const LEVEL_RE = /^ItemDisplayFilterName\[\]:/;

  /* {name: [first line, one past the last]} of the source's sections, for the lines of a version (a style edits
     patch adds lines: their places come from section starts counted on the version's own lines, found by the
     sections' first lines). */
  function sections(src, lines) {
    const out = {}, list = src.sections;
    if (lines === src.lines || lines.length === src.lines.length) {
      for (let k = 0; k < list.length; k++) {
        out[list[k][0]] = [list[k][1], k + 1 < list.length ? list[k + 1][1] : lines.length];
      }
      return out;
    }
    let at = 0;
    for (let k = 0; k < list.length; k++) {
      const first = src.lines[list[k][1]];
      while (at < lines.length && lines[at] !== first) at++;
      out[list[k][0]] = [at, lines.length];
      if (k) out[list[k - 1][0]][1] = at;
    }
    return out;
  }

  function sectionOf(secs, i) {
    for (const name of Object.keys(secs)) {
      const [a, b] = secs[name];
      if (i >= a && i < b) return name;
    }
    return null;
  }

  /* A rule line's parts as BH reads it: {off: the // prefix of a switched-off rule or "", cond, out, comment,
     head: the text up to the output}, or null for a line that isn't a rule. */
  function rule(line) {
    const m = RULE_RE.exec(line);
    if (!m) return null;
    const off = m[1] || "";
    const text = line.slice(off.length);
    const c = text.indexOf("//");
    const code = c < 0 ? text : text.slice(0, c);
    const j = code.indexOf(":");
    if (j < 0) return null;
    const key = code.slice(0, j).trim();
    if (!key.endsWith("]")) return null;
    return {off, cond: key.slice("ItemDisplay[".length, key.length - 1), out: code.slice(j + 1),
            comment: c < 0 ? "" : text.slice(c), head: off + code.slice(0, j + 1)};
  }

  const notifies = (out) => NOTIFY_RE.test(out);
  const continues = (out) => out.indexOf("%CONTINUE%") >= 0;

  /* The icon keywords of an output, in order ("BORDER-91 MAP-9B DOT-62 PX-68"), "" for none. */
  function icons(out) {
    const found = [];
    ICON_RE.lastIndex = 0;
    let m;
    while ((m = ICON_RE.exec(out))) found.push(m[1].toUpperCase() + "-" + m[2].toUpperCase());
    return found.join(" ");
  }

  function sounds(out) {
    const found = [];
    SOUND_RE.lastIndex = 0;
    let m;
    while ((m = SOUND_RE.exec(out))) found.push(+m[1]);
    return found;
  }

  /* {name: {i, value}} of the alias definitions (the first of a name, as BH reads them all). */
  function aliases(lines) {
    const out = {};
    for (let i = 0; i < lines.length; i++) {
      const m = ALIAS_RE.exec(lines[i]);
      if (m && !out[m[1]]) out[m[1]] = {i, value: EZ.core.bhTrim(m[2].split("//")[0])};
    }
    return out;
  }

  /* The filter level names: [{i, text}] (BH reads 12 at most; level 0 is BH's own "Show All Items"). */
  function levels(lines) {
    const out = [];
    for (let i = 0; i < lines.length && out.length < 12; i++) {
      if (LEVEL_RE.test(lines[i])) {
        const v = lines[i].slice(lines[i].indexOf(":") + 1);
        const c = v.indexOf("//");
        out.push({i, text: c < 0 ? v : v.slice(0, c)});
      }
    }
    return out;
  }

  /* Erazure's own player options (050): [{title, options: [{id, label, lines: [line index], conds}]}], each
     option's rules switched off in the filter until the player switches it on. Options of one group whose rules
     test the same items (the same conditions) are one choice: choice = the option ids that compete. */
  function options(src, lines) {
    const secs = sections(src, lines);
    const range = secs[OPTIONS_SECTION];
    if (!range) return [];
    const groups = [];
    let group = null, opt = null;
    for (let i = range[0]; i < range[1]; i++) {
      const line = lines[i];
      const g = /^\/\/\s+=+\s+(.+?)\s+=+\s*$/.exec(line);
      if (g) {
        group = {title: g[1], options: []};
        groups.push(group);
        opt = null;
        continue;
      }
      if (!group) continue;
      if (!line.trim()) { opt = null; continue; }
      const r = rule(line);
      if (r && r.off) {
        if (opt) {
          opt.lines.push(i);
          opt.conds.push(r.cond.replace(/\s+/g, " ").trim());
        }
        continue;
      }
      const l = /^\/\/\s+(\S.*?)\s*$/.exec(line);  // one space or more (050's charm options have one)
      if (l && !l[1].startsWith("=")) {
        opt = {id: group.title + " / " + l[1], label: l[1], group: group.title, lines: [], conds: []};
        group.options.push(opt);
      }
    }
    for (const gr of groups) {
      gr.options = gr.options.filter((o) => o.lines.length);
      const byConds = new Map();
      for (const o of gr.options) {
        const key = o.conds.slice().sort().join("\n");
        if (!byConds.has(key)) byConds.set(key, []);
        byConds.get(key).push(o);
      }
      for (const set of byConds.values()) for (const o of set) o.choice = set.map((x) => x.id);
    }
    return groups.filter((gr) => gr.options.length);
  }

  /* ---------------------------------------------------------------- look cards (tools/alias_editor.py's) */

  const GROUPS = [  // (id, title, note, which cards: by their first alias's name), in the page's order
    ["uniques", "Unique items", "Unidentified uniques, by tier.", (n) => n.startsWith("UNI_") || n.startsWith("FACET")],
    ["sets", "Set items", "Unidentified set items, by tier.", (n) => n.startsWith("SET")],
    ["rares", "Rare and magic items", "Unidentified rares, jewels, rings, charms and magic crafting bases.",
     (n) => n.startsWith("RARE_") || n.startsWith("MAGIC_")],
    ["runes", "Runes", "Single runes and stacks.", (n) => n.indexOf("RUNE") >= 0 || n.endsWith("BIG_GG")],
    ["pd2", "PD2 items and keys", "Shards, Puzzle items, the Cube, Vial and Mirror, keys, tokens, uber items and " +
     "Craft Infusions.", (n) => !n.endsWith("VERSION_NAME") && !/^(HIGHLIGHT|AMPLIFY|LOWER_RES)/.test(n)],
    ["highlights", "Description highlights", "Lines in item descriptions.",
     (n) => /^(HIGHLIGHT|AMPLIFY|LOWER_RES)/.test(n)],
    ["cube", "Horadric Cube", "Each version's name in the Horadric Cube's description.",
     (n) => n.endsWith("VERSION_NAME")],
  ];
  const keyOf = (name) => name.replace(/_(LEFT|RIGHT)$/, "");
  const OFF_TOGGLES = ["BIG_GG", "POE_SOUNDS", "REVEALED"];
  /* Cards named for what they are (the Alerts area's kinds by the same words), where 040's own comment says less. */
  const CARD_TITLES = {
    UNI_HIGH_VALUE: "Unique items: High value", UNI_MEDIUM_VALUE: "Unique items: Medium value",
    UNI_MINIMAL_VALUE: "Unique items: Minimal value",
    UNI_MINIMAL_GRAIL: "Unique items you haven't discovered: Minimal value ones",
    UNI_GRAIL: "Unique items you haven't discovered: the others",
    UNI_NORMAL: "Other unique items (levels 0-7)",
    SET_HIGH_VALUE: "Set items: High value", SET_MEDIUM_VALUE: "Set items: Medium value",
    SET_GRAIL: "Set items you haven't discovered",
  };

  function lookAliases(src, lines) {
    const secs = sections(src, lines), out = [];
    const [a0, a1] = secs[SYMBOLS_SECTION] || [0, 0];
    let title = "", inComment = false;
    for (let i = a0; i < a1; i++) {
      const line = lines[i];
      if (line.startsWith("// ") && !inComment) title = line.slice(3).split(":")[0].trim();
      inComment = line.startsWith("//");
      const m = ALIAS_RE.exec(line);
      if (m && m[2].indexOf("%") >= 0 && !m[2].startsWith("(")) out.push({name: m[1], i, value: m[2], title});
    }
    const [c0, c1] = secs[CUBE_SECTION] || [0, 0];
    for (let i = c0; i < c1; i++) {
      const m = ALIAS_RE.exec(lines[i]);
      if (m && m[1].endsWith("VERSION_NAME")) out.push({name: m[1], i, value: m[2], title: m[2]});
    }
    return out;
  }

  /* A rule's output as the label it draws with this card's aliases: aliases and %NAME% left in, the description
     where the alias sits in it (alias_editor.template). */
  function template(names, line) {
    const r = rule(line);
    let out = r.out;
    const body = /\{(.*)\}/.exec(out);
    if (body && body[1].indexOf("%" + names[0] + "%") >= 0) {
      out = body[1].split(/%CL%|%NL%/).find((p) => p.indexOf("%" + names[0] + "%") >= 0);
    } else {
      out = out.replace(/\{.*\}/, "");
    }
    out = out.replace(/%(CONTINUE|(BORDER|MAP|DOT|PX)-[0-9A-Fa-f]+|SOUNDID-\d+|TIER-\d)%/g, "");
    const band = /\bED(?:>(\d+)|~(\d+)-)/.exec(r.cond);
    const ed = String((band ? (band[1] ? +band[1] + 1 : +band[2]) : 500) + 12);
    return out.replace(/%QTY%/g, "12").replace(/%ILVL%/g, "92").replace(/%ED%/g, ed).replace(/%EDAM%/g, ed)
      .replace(/\s+$/, "");
  }

  /* The look cards: [{key, title, group, aliases: [{name, i, value}], tpls: [{tpl, at}]}] (alias_editor.page_data,
     its looks(): the different labels the card's aliases decide, at most 3, one item before a stack). */
  function lookCards(src, lines) {
    const list = lookAliases(src, lines);
    const names = new Set(list.map((a) => a.name));
    const order = new Map(list.map((a, k) => [a.name, k]));
    const rules = [];
    for (let i = 0; i < lines.length; i++) if (lines[i].startsWith("ItemDisplay[")) rules.push(i);
    const cards = [], seen = new Set();
    for (const a of list) {
      if (seen.has(a.name)) continue;
      const key = keyOf(a.name);
      const group = list.filter((b) => keyOf(b.name) === key);
      for (const b of group) seen.add(b.name);
      const gnames = group.map((b) => b.name);
      const found = [];
      for (const i of rules) {
        const line = lines[i];
        const r = rule(line);
        if (!r) continue;
        const words = r.cond.replace(/[()]/g, " ").split(/\s+/);
        if (OFF_TOGGLES.some((t) => words.indexOf(t) >= 0)) continue;
        const used = [...names].filter((n) => line.indexOf("%" + n + "%") >= 0);
        if (!used.length) continue;
        const last = used.reduce((x, y) => (order.get(x) > order.get(y) ? x : y));
        if (gnames.indexOf(last) < 0) continue;
        const tpl = template(gnames, line);
        const same = (t) => t.replace(/(%[A-Z_]+%)+(?=%NAME%)/g, "");
        if (!found.some((f) => same(f.tpl) === same(tpl))) found.push({tpl, at: i, stack: r.cond.indexOf("QTY>") >= 0});
      }
      found.sort((x, y) => x.stack - y.stack);
      let tpls = found.slice(0, 3).map((f) => ({tpl: f.tpl, at: f.at}));
      let used = found.length > 0;  // a card no rule uses changes nothing in game (040 keeps some on purpose)
      if (!tpls.length) {
        const fallback = rules.find((i) => gnames.every((n) => lines[i].indexOf("%" + n + "%") >= 0));
        used = fallback !== undefined;
        tpls = [fallback !== undefined ? {tpl: template(gnames, lines[fallback]), at: fallback}
                                       : {tpl: "%" + gnames[0] + "%  %NAME%  " + gnames.slice(1).map((n) => "%" + n + "%").join(""),
                                          at: null}];
      }
      const g = GROUPS.find((gr) => gr[3](a.name));
      cards.push({key, title: CARD_TITLES[key] || a.title, group: g ? g[0] : "pd2", aliases: group, tpls, used});
    }
    return cards;
  }

  /* Every distinct drop sound and icon combination of the rules: {sounds: {id: [line]}, icons: {combo: [line]}}. */
  function notifications(lines) {
    const out = {sounds: {}, icons: {}};
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith("ItemDisplay[")) continue;
      const r = rule(lines[i]);
      if (!r) continue;
      for (const s of sounds(r.out)) (out.sounds[s] || (out.sounds[s] = [])).push(i);
      const ic = icons(r.out);
      if (ic) (out.icons[ic] || (out.icons[ic] = [])).push(i);
    }
    return out;
  }

  return {sections, sectionOf, rule, notifies, continues, icons, sounds, aliases, levels, options, lookCards,
          lookAliases, notifications, GROUPS: GROUPS.map((g) => ({id: g[0], title: g[1], note: g[2]})), keyOf,
          ICON_RE, SOUND_RE, TIER_RE, NOTIFY_RE, ALIAS_RE, OPTIONS_SECTION};
})();
