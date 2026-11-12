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
     patch adds lines: their places come from the version's own lines). Each section is found by its anchor, its
     first line that appears once in the source (a section's first lines are often the same row of dashes as the
     next one's), counted back to the section's start. */
  function anchors(src) {
    if (src.sectionAnchors) return src.sectionAnchors;
    const seen = new Map();
    for (const line of src.lines) seen.set(line, (seen.get(line) || 0) + 1);
    const list = src.sections;
    src.sectionAnchors = list.map((sec, k) => {
      const end = k + 1 < list.length ? list[k + 1][1] : src.lines.length;
      let a = sec[1];
      while (a < end && seen.get(src.lines[a]) !== 1) a++;
      return a < end ? a : sec[1];
    });
    return src.sectionAnchors;
  }
  function sections(src, lines) {
    const out = {}, list = src.sections;
    if (lines === src.lines || lines.length === src.lines.length) {
      for (let k = 0; k < list.length; k++) {
        out[list[k][0]] = [list[k][1], k + 1 < list.length ? list[k + 1][1] : lines.length];
      }
      return out;
    }
    const anchor = anchors(src);
    let at = 0;
    for (let k = 0; k < list.length; k++) {
      const first = src.lines[anchor[k]];
      let j = at;
      while (j < lines.length && lines[j] !== first) j++;
      const start = Math.max(0, j - (anchor[k] - list[k][1]));
      out[list[k][0]] = [start, lines.length];
      if (k) out[list[k - 1][0]][1] = start;
      if (j < lines.length) at = j + 1;
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
  /* Cards named for what they draw (the Alerts area's kinds by the same words), where 040's own comment is a short
     name, or names several cards alike (two looks per rune group: a few and a stack). */
  const RUNES = (from, to, n) => `Runes ${from} to ${to}: ${n}`;
  const INFUSION = "Craft Infusion: ";
  const CARD_TITLES = {
    UNI_HIGH_VALUE: "Unique items: High value", UNI_MEDIUM_VALUE: "Unique items: Medium value",
    UNI_MINIMAL_VALUE: "Unique items: Minimal value",
    UNI_MINIMAL_GRAIL: "Unique items you haven't discovered: Minimal value ones",
    UNI_GRAIL: "Unique items you haven't discovered: the others",
    UNI_NORMAL: "Other unique items (levels 0-7)",
    UNI_LLD: "Unique items for low-level dueling", UNI_DCLONE_RATHMA: "Unique items from Diablo Clone and Rathma",
    SET_HIGH_VALUE: "Set items: High value", SET_MEDIUM_VALUE: "Set items: Medium value",
    SET_GRAIL: "Set items you haven't discovered", SET_LLD: "Set items for low-level dueling", SET: "Set items",
    SET_NORMAL: "Normal set items",
    RARE_HIGH_VALUE: "Rare items: High value", RARE_MEDIUM_VALUE: "Rare items: Medium value",
    RARE_LOW_VALUE: "Rare items: Low value", RARE_ETH_CRAFT: "Ethereal rare crafting bases",
    MAGIC_ETH_CRAFT: "Ethereal magic crafting bases",
    LOWEST_RUNE_LOW_QTY: RUNES("El", "Tal", "fewer than 10"), LOWEST_RUNE_HIGH_QTY: RUNES("El", "Tal", "a stack of 10 or more"),
    LOW_RUNE_LOW_QTY: RUNES("Ral", "Io", "fewer than 10"), LOW_RUNE_HIGH_QTY: RUNES("Ral", "Io", "a stack of 10 or more"),
    MID_RUNE_LOW_QTY: RUNES("Lum", "Fal", "fewer than 10"), MID_RUNE_HIGH_QTY: RUNES("Lum", "Fal", "a stack of 10 or more"),
    LEM_RUNE_LOW_QTY: "Lem Rune: one", PUL_RUNE_LOW_QTY: "Pul Rune: one",
    LEM_PUL_RUNE_HIGH_QTY: "Lem and Pul Runes: a stack of 2 or more", UM_RUNE: "Um Rune", MAL_RUNE: "Mal Rune",
    IST_GUL_RUNE: "Ist and Gul Runes", VEX_OHM_LO_RUNE: "Vex, Ohm and Lo Runes",
    SUR_BER_JAH_CHAM_ZOD_BIG_GG: "Runes Sur to Zod",
    WORLDSTONE_LOW_QTY: "Worldstone Shards: fewer than 10", WORLDSTONE_HIGH_QTY: "Worldstone Shards: a stack of 10 or more",
    INFUSION_BLOOD: INFUSION + "Blood", INFUSION_CASTER: INFUSION + "Caster", INFUSION_SAFETY: INFUSION + "Safety",
    INFUSION_HITPOWER: INFUSION + "Hitpower", INFUSION_VAMPIRIC: INFUSION + "Vampiric",
    INFUSION_BOUNTIFUL: INFUSION + "Bountiful", INFUSION_BRILLIANT: INFUSION + "Brilliant",
    FACET_NAME: "Rainbow Facet: its name", HIGHLIGHT_1: "Highlights: blue and teal",
    HIGHLIGHT_2: "Highlights: blue, purple, red and orange",
  };
  /* What a card is for, in a line under its title: 040's comment after its first colon, without its codes. */
  const CARD_NOTES = {
    INFUSION_BLOOD: "In a stack, in town and in the inventory: one look for both sides of the name.",
  };
  const noteOf = (comment) => comment.replace(/\s*\((?:[A-Z][A-Z0-9_]*(?:,\s*)?)+(?:\s*\d+)?\)/g, "")
    .replace(/\s*\([^()]*'s [A-Z_]+ [a-z]+\)/g, "")  // "(150's REVEALED rename)": where Erazure does it
    .replace(/%NAME%/g, "the name").replace(/\s+/g, " ").trim()
    .replace(/(^|[.:] )([a-z])/g, (m, a, b) => a + b.toUpperCase());

  function lookAliases(src, lines) {
    const secs = sections(src, lines), out = [];
    const [a0, a1] = secs[SYMBOLS_SECTION] || [0, 0];
    let title = "", note = "", raw = "", inComment = false;
    for (let i = a0; i < a1; i++) {
      const line = lines[i];
      if (line.startsWith("// ") && !inComment) {
        const text = line.slice(3), colon = text.indexOf(":");
        title = (colon >= 0 ? text.slice(0, colon) : text).trim();
        raw = colon >= 0 ? text.slice(colon + 1) : "";
        note = noteOf(raw);
      } else if (line.startsWith("// ") && inComment && raw) {  // the comment goes on: the note too
        raw += " " + line.slice(3);
        note = noteOf(raw);
      }
      inComment = line.startsWith("//");
      const m = ALIAS_RE.exec(line);
      if (m && m[2].indexOf("%") >= 0 && !m[2].startsWith("(")) out.push({name: m[1], i, value: m[2], title, note});
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
  const cardCache = new WeakMap();  // a version's lines (app.versionLines keeps them) -> its cards
  function lookCards(src, lines) {
    if (cardCache.has(lines)) return cardCache.get(lines);
    const list = lookAliases(src, lines);
    const names = new Set(list.map((a) => a.name));
    const order = new Map(list.map((a, k) => [a.name, k]));
    const rules = [];
    for (let i = 0; i < lines.length; i++) if (lines[i].startsWith("ItemDisplay[")) rules.push(i);
    /* Each rule once: the card alias it uses last (a card's rules are those whose last one is the card's). A %NAME%
       lies between two '%' in a row (a name has none). */
    const lastOf = [];
    for (const i of rules) {
      const line = lines[i];
      const r = rule(line);
      if (!r) continue;
      const words = r.cond.replace(/[()]/g, " ").split(/\s+/);
      if (OFF_TOGGLES.some((t) => words.indexOf(t) >= 0)) continue;
      let last = null;
      for (let p = line.indexOf("%"); p >= 0;) {
        const q = line.indexOf("%", p + 1);
        if (q < 0) break;
        const n = line.slice(p + 1, q);
        if (names.has(n) && (last === null || order.get(n) > order.get(last))) last = n;
        p = q;
      }
      if (last !== null) lastOf.push([i, last]);
    }
    const cards = [], seen = new Set();
    for (const a of list) {
      if (seen.has(a.name)) continue;
      const key = keyOf(a.name);
      const group = list.filter((b) => keyOf(b.name) === key);
      for (const b of group) seen.add(b.name);
      const gnames = group.map((b) => b.name);
      const found = [];
      for (const [i, last] of lastOf) {
        if (gnames.indexOf(last) < 0) continue;
        const line = lines[i];
        const r = rule(line);
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
      const note = CARD_NOTES[key] || (/^INFUSION_/.test(key) ? CARD_NOTES.INFUSION_BLOOD : a.note || "");
      cards.push({key, title: CARD_TITLES[key] || a.title, note: note ? note[0].toUpperCase() + note.slice(1) : "",
                  group: g ? g[0] : "pd2", aliases: group, tpls, used});
    }
    cardCache.set(lines, cards);
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
