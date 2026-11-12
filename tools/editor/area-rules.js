/* My rules: the player's own rules in BH's filter language, in two blocks (above Erazure's rules and below them).
   Each block is a code editor (line numbers, highlighting, find, the browser's own undo) with BH's reading of every
   line (EZ.lint) and a list of what each rule draws; a rule builder writes a rule from a form (EZ.rules.build) and
   adds it to a block. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
(function () {
  "use strict";
  const {h, fill, debounce, seg, pill} = EZ.ui;
  const STORE = "erazure-filter-editor-builder";
  const LH = 20;  // the code editor's line height, px (template.html: .fe-ed-*)
  const CLASS_INDEX = {ama: 0, sor: 1, nec: 2, pal: 3, bar: 4, dru: 5, ass: 6};
  const CLASS_NAMES = ["Amazon", "Sorceress", "Necromancer", "Paladin", "Barbarian", "Druid", "Assassin"];
  const TABS = [[0, "Bow and Crossbow Skills (Amazon)"], [1, "Passive and Magic Skills (Amazon)"],
    [2, "Javelin and Spear Skills (Amazon)"], [8, "Fire Skills (Sorceress)"], [9, "Lightning Skills (Sorceress)"],
    [10, "Cold Skills (Sorceress)"], [16, "Curses (Necromancer)"], [17, "Poison and Bone Skills (Necromancer)"],
    [18, "Summoning Skills (Necromancer)"], [24, "Combat Skills (Paladin)"], [25, "Offensive Auras (Paladin)"],
    [26, "Defensive Auras (Paladin)"], [32, "Combat Skills (Barbarian)"], [33, "Masteries (Barbarian)"],
    [34, "Warcries (Barbarian)"], [40, "Summoning (Druid)"], [41, "Shape Shifting (Druid)"], [42, "Elemental (Druid)"],
    [48, "Traps (Assassin)"], [49, "Shadow Disciplines (Assassin)"], [50, "Martial Arts (Assassin)"]];
  const GROUPS = [
    ["Armor", [["HELM", "Helms (class helms too)"], ["CIRC", "Circlets"], ["CHEST", "Body armor"],
      ["SHIELD", "Shields (class shields too)"], ["GLOVES", "Gloves"], ["BOOTS", "Boots"], ["BELT", "Belts"],
      ["ARMOR", "Any armor"]]],
    ["Weapons", [["AXE", "Axes"], ["MACE", "Maces, clubs and hammers"], ["SWORD", "Swords"], ["DAGGER", "Daggers"],
      ["THROWING", "Throwing weapons"], ["JAV", "Javelins (Amazon ones too)"], ["SPEAR", "Spears"],
      ["POLEARM", "Polearms"], ["BOW", "Bows"], ["XBOW", "Crossbows"], ["STAFF", "Staves"], ["WAND", "Wands"],
      ["SCEPTER", "Scepters"], ["WEAPON", "Any weapon"]]],
    ["Class items", [["ZON", "Amazon weapons"], ["SOR", "Sorceress orbs"], ["NEC", "Necromancer heads"],
      ["DIN", "Paladin shields"], ["BAR", "Barbarian helms"], ["DRU", "Druid pelts"], ["SIN", "Assassin claws"],
      ["CLASS", "Any class item"]]],
    ["Other", [["JEWELRY", "Rings and amulets"], ["CHARM", "Charms"], ["QUIVER", "Arrows and bolts"],
      ["MISC", "Misc items (potions, gems, runes, keys...)"]]],
  ];
  const GROUP_NAME = new Map(GROUPS.flatMap(([, list]) => list));
  const QUALS = [["INF", "Low quality"], ["NORM", "Normal"], ["SUP", "Superior"], ["MAG", "Magic"], ["RARE", "Rare"],
                 ["CRAFT", "Crafted"], ["SET", "Set"], ["UNI", "Unique"]];
  const PLACES = [["auto", "Shown: anywhere. Hidden: on the ground outside town"], ["any", "Anywhere"],
    ["ground", "On the ground, outside town"], ["groundAll", "On the ground, in town too"], ["town", "In town"],
    ["inventory", "In your inventory"], ["stash", "In your stash"], ["cube", "In the Horadric Cube"],
    ["shop", "In a shop"], ["equipped", "Equipped"], ["compendium", "In the Compendium"]];
  const STAT_WORDS = [["ED", "Enhanced damage (weapons) or defense (armor) %"], ["EDAM", "Enhanced damage %"],
    ["EDEF", "Enhanced defense %"], ["DEF", "Defense"], ["PLUSDEF", "Defense from affixes, runeword and sockets"],
    ["RES", "All resistances (the lowest of the four)"], ["FRES", "Fire resistance"], ["CRES", "Cold resistance"],
    ["LRES", "Lightning resistance"], ["PRES", "Poison resistance"], ["MAXRES", "Max resistances (the lowest)"],
    ["ALLSK", "+ to all skills"], ["FCR", "Faster cast rate"], ["IAS", "Increased attack speed"],
    ["FHR", "Faster hit recovery"], ["FBR", "Faster block rate"], ["FRW", "Faster run/walk"], ["LIFE", "Life"],
    ["MANA", "Mana"], ["STR", "Strength"], ["DEX", "Dexterity"], ["ALLATTRIB", "All attributes (the lowest)"],
    ["MFIND", "Magic find"], ["GFIND", "Gold find"], ["AR", "Attack rating"], ["ARPER", "Attack rating %"],
    ["MINDMG", "Minimum damage"], ["MAXDMG", "Maximum damage"], ["DTM", "Damage taken goes to mana"],
    ["MAEK", "Mana after each kill"], ["REPLIFE", "Replenish life"], ["ALVL", "Affix level"],
    ["CRAFTALVL", "Affix level if crafted"], ["QLVL", "The base's quality level"], ["LVLREQ", "Required level"],
    ["MAXSOCKETS", "Most sockets the item can get"], ["QTY", "Quantity (a stack)"], ["GOLD", "Gold (a pile)"],
    ["RUNE", "Rune number (El 1 ... Zod 33)"], ["PRICE", "Sell price"]];
  /* The kinds of stat a form asks; "A stat" picks from Erazure's words and every stat of the game as the game words it
     (a game stat is kept as STAT<n>). */
  const STAT_KINDS = [["word", "A stat"], ["SK", "+ to one skill"],
    ["SKTOTAL", "+ to one skill, counting + all, class and tab skills"], ["CLSK", "+ to a class's skills"],
    ["TABSK", "+ to a skill tab"], ["OS", "+ to a skill of any class (oskill)"], ["CHSK", "Charges of a skill"]];
  const kindOf = (s) => s.kind === "STAT" ? "word" : s.kind;
  const OPS = [["min", "at least"], ["max", "at most"], ["exactly", "exactly"], ["between", "between"]];
  const SAMPLE_COLOR = {UNI: "GOLD", SET: "GREEN", RARE: "YELLOW", MAG: "BLUE", CRAFT: "ORANGE"};

  /* ---------------------------------------------------------------- the builder's form (kept in this browser) */

  function blank() {
    return {codes: [], groups: [], tiers: [], hands: "", quals: [], eth: "any", id: "any", rw: "any",
            sock: {op: "any", a: "", b: ""}, ilvl: ["", ""], levels: [], clvl: ["", ""], classes: [], diffs: [],
            place: "auto", disc: "any", stats: [], extra: "", show: "show", text: "%NAME%",
            desc: {how: "keep", text: ""}, icon: {}, sound: 0, chat: "all", tier: 4, cont: false, comment: ""};
  }
  let B = (() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || "null");
      if (s && typeof s === "object") return Object.assign(blank(), s);
    } catch (e) { /* a new form */ }
    return blank();
  })();
  const keepForm = debounce(() => {
    try { localStorage.setItem(STORE, JSON.stringify(B)); } catch (e) { /* not kept */ }
  }, 400);

  /* What a template sets: only "What it does" (the items, levels and places picked stay). */
  const TEMPLATES = [
    ["Hide something", "Hide the items you pick on the ground outside town (your inventory, stash and shops still " +
      "name them).", {show: "hide"}],
    ["Make it stand out", "A bright label, a minimap icon and a drop sound for the items you pick.",
      {text: "%ORANGE%*** %NAME% %ORANGE%***", icon: {BORDER: "60", DOT: "0A"}, sound: 2585}],
    ["Add a tag", "A short tag before the name, and Erazure's rules still run after it.",
      {text: "%GOLD%Tag %NAME%", cont: true}],
    ["Show the item level", "The item level after the name of the items you pick (bases, charms, jewels...).",
      {text: "%NAME% %GRAY%(%ILVL%)", cont: true}],
    ["Add a description line", "A line in the hover box of the items you pick; the label stays Erazure's.",
      {desc: {how: "below", text: "%GREEN%My note"}, cont: true}],
  ];
  const WHAT_FIELDS = ["show", "text", "desc", "icon", "sound", "chat", "tier", "cont"];

  /* The form as EZ.rules.build reads it. */
  function specOf(b) {
    const cat = EZ.items.catalog();
    const stats = b.stats.map((s) => {
      const base = {op: s.op, a: s.a, b: s.b};
      if (s.kind === "word") return s.word ? Object.assign(base, {word: s.word}) : null;
      if (s.n === "" || s.n === undefined || s.n === null) return null;
      if (s.kind === "STAT") return Object.assign(base, {stat: s.n});
      if (s.kind === "SK") return Object.assign(base, {skill: s.n});
      if (s.kind === "SKTOTAL") {
        const sk = cat && cat.skills.get(+s.n);
        return Object.assign(base, {skill: s.n, total: true, tab: sk && sk.tab !== null ? sk.tab : null,
                                    cls: sk && CLASS_INDEX[sk.cls] !== undefined ? CLASS_INDEX[sk.cls] : null});
      }
      return Object.assign(base, {word: s.kind + s.n});
    }).filter(Boolean);
    return Object.assign({}, b, {place: b.place === "auto" ? undefined : b.place, stats});
  }

  /* ---------------------------------------------------------------- helpers */

  const plainName = (s) => String(s || "").replace(/ÿc./g, "").trim();
  const blockOf = (which) => {
    const e = EZ.store.current().edits;
    return e.rules && typeof e.rules[which] === "string" ? e.rules[which] : "";
  };
  const live = {top: null, bottom: null};  // the editors' text while typing (before it's saved)
  const textOf = (which) => live[which] !== null ? live[which] : blockOf(which);

  function lintContext(app) {
    let erazureF = null;  // Erazure's compiled filter (the preview's): which of its rules alert
    try { const z = EZ.preview && EZ.preview.erazure ? EZ.preview.erazure() : null; erazureF = z ? z.F : null; } catch (e) { /* none */ }
    return EZ.lint.context(app.src, app.versionLines(), {top: EZ.rules.lines(textOf("top")),
      bottom: EZ.rules.lines(textOf("bottom"))}, {soundCount: app.data.soundCount, erazureF});
  }

  function lintBlock(app, which, list) {
    return EZ.lint.lines(list || EZ.rules.lines(textOf(which)), Object.assign(lintContext(app), {block: which}));
  }

  /* Erazure's alias values with the player's own (for drawing a rule's label). */
  let valsCache = null;
  function aliasValues(app) {
    const lines = app.versionLines();
    if (!valsCache || valsCache.lines !== lines) valsCache = {lines, vals: EZ.looks.values(lines)};
    const out = Object.assign({}, valsCache.vals);
    for (const which of EZ.rules.BLOCKS) {
      for (const line of EZ.rules.lines(textOf(which))) {
        const m = EZ.filter.ALIAS_RE.exec(line);
        if (m && !(m[1] in out)) out[m[1]] = EZ.core.bhTrim(m[2].split("//")[0]);
      }
    }
    return out;
  }

  /* A rule's label drawn (its text, the keywords that aren't text taken out), or a "Hidden" pill. */
  function miniLabel(out, vals, sample) {
    const text = out.replace(/\{[^}]*\}?/, "")
      .replace(/%(CONTINUE|(BORDER|MAP|DOT|PX|LINE|NOTIFY)-[0-9a-f]{1,4}|SOUNDID-\d{1,4}|TIER-\d)%/gi, "");
    if (!text.trim()) return h("span.fe-pv-hidden", "hidden");
    return EZ.render.label(EZ.looks.fill(text, vals, sample || "%WHITE%Item"));
  }

  /* The hover-box lines a rule writes, drawn as the game's description (null when it writes none of its own). */
  function miniDesc(out, vals) {
    const t = EZ.render.descOf(out, vals);
    return t ? h("div.fe-minidesc", {title: "Its lines in the hover box"}, EZ.render.coded(t, "3")) : null;
  }

  /* A stat picker: Erazure's words first, then every stat of the game as the game words it ("+X to Vitality",
     "X% Chance of Crushing Blow"), searchable. onpick({kind: "word", word} or {kind: "STAT", n}). */
  let statChoiceList = null;
  function statList() {
    if (statChoiceList) return statChoiceList;
    const out = STAT_WORDS.map(([w, t]) => ({label: t, sub: w, value: {kind: "word", word: w}}));
    const seen = new Set(out.map((x) => x.label.toLowerCase()));
    const cat = EZ.items.catalog();
    for (const id of [...cat.stats.keys()].sort((a, b) => a - b)) {
      const t = EZ.items.statTitle(id);
      if (!t || seen.has(t.toLowerCase())) continue;
      seen.add(t.toLowerCase());
      out.push({label: t, sub: "stat " + id, value: {kind: "STAT", n: String(id)}});
    }
    return (statChoiceList = out);
  }
  function statName(s) {
    if (s.kind === "word" && s.word) return (STAT_WORDS.find(([w]) => w === s.word) || [s.word, s.word])[1];
    if (s.kind === "STAT" && s.n !== "" && s.n !== undefined) return EZ.items.statTitle(+s.n) || "stat " + s.n;
    return "";
  }
  function statPicker(s, onpick) {
    const cur = statName(s);
    const c = EZ.ui.combo({placeholder: cur || "Pick a stat: life, vitality, crushing blow…", label: "Stat", all: true,
      find: (q) => {
        const qq = q.toLowerCase();
        return statList().filter((x) => !qq || x.label.toLowerCase().indexOf(qq) >= 0 || x.sub.toLowerCase() === qq)
          .slice(0, 120).map((x) => ({label: x.label, sub: x.value.kind === "word" ? "" : x.sub,
            pick: () => onpick(x.value)}));
      },
      empty: (q) => `No stat matches "${q}".`});
    if (cur) c.input.classList.add("has-value");
    c.box.classList.add("fe-statpick");
    return c.box;
  }

  function alertsOf(out, app) {
    const parts = [];
    const combo = EZ.filter.icons(out);
    if (combo) parts.push(EZ.looks.icon(combo, app.data.palette || [], 2));
    for (const id of EZ.filter.sounds(out)) {
      parts.push(h("span.fe-small", "♪ " + EZ.sounds.name(app.data, id) + " "), EZ.sounds.play(app.data, id));
    }
    const tier = EZ.filter.TIER_RE.exec(out);
    if (tier && (combo || EZ.filter.sounds(out).length)) {
      parts.push(pill(+tier[1] === 0 ? "icon only" : "chat on levels 0-" + tier[1], "info"));
    }
    return parts;
  }

  /* ---------------------------------------------------------------- highlighting */

  const NOTE_WORDS = /^%(CONTINUE|(BORDER|MAP|DOT|PX|LINE|NOTIFY)-[0-9a-f]{1,4}|SOUNDID-\d{1,4}|TIER-\d)%$/i;

  function condTokens(text, bad, aliases) {
    const out = [];
    for (const part of text.split(/(\s+|[()!])/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { out.push(part); continue; }
      let cls = "w";
      const core = part.replace(/[<>=~].*$/, "");
      if (part === "(" || part === ")" || part === "!" || /^(AND|OR|&&|\|\|)$/.test(part)) cls = "op";
      else if (bad.has(part) || bad.has(core)) cls = "bad";
      else if (aliases.has(core)) cls = "al";
      else if (/^[a-z0-9]{3}/.test(core) && !/^[0-9]+$/.test(core)) cls = "code";
      if ((cls === "w" || cls === "al") && core !== part) {
        out.push(h("span.c-" + cls, core), h("span.c-num", part.slice(core.length)));
      } else out.push(h("span.c-" + cls, part));
    }
    return out;
  }

  function outTokens(text, aliases) {
    const out = [];
    for (const part of text.split(/(%[^%\s]*%|[{}])/)) {
      if (!part) continue;
      if (part === "{" || part === "}") { out.push(h("span.c-br", part)); continue; }
      const m = /^%([A-Za-z_]+)%$/.exec(part);
      if (m && EZ.render.WORDS[m[1].toUpperCase()] !== undefined) {
        const c = EZ.render.rgb(EZ.render.WORDS[m[1].toUpperCase()]);
        out.push(h("span.c-col", {style: {color: c || "inherit"}}, part));
      } else if (NOTE_WORDS.test(part)) out.push(h("span.c-note", part));
      else if (m && aliases.has(m[1].toUpperCase())) out.push(h("span.c-al", part));
      else if (/^%.*%$/.test(part)) out.push(h("span.c-kw", part));
      else out.push(h("span.c-txt", part));
    }
    return out;
  }

  /* One line's highlighted pieces. bad: the words BH drops on it; aliases: every alias name (upper case too). */
  function lineTokens(line, bad, aliases) {
    if (/^\s*\/\//.test(line)) return [h("span.c-cmt", line)];
    const c = line.indexOf("//");
    const code = c < 0 ? line : line.slice(0, c), cmt = c < 0 ? "" : line.slice(c);
    const out = [];
    const j = code.indexOf(":");
    const m = /^(\s*)(ItemDisplay\[|Alias\[|Formula\[|ItemDisplayFilterName\[)/.exec(code);
    if (m && j > 0 && code.lastIndexOf("]", j) > 0) {
      const close = code.lastIndexOf("]", j);
      out.push(m[1], h("span.c-head", m[2]));
      const inner = code.slice(m[0].length, close);
      if (m[2] === "ItemDisplay[") out.push(...condTokens(inner, bad, aliases));
      else out.push(h("span.c-al", inner));
      out.push(h("span.c-head", code.slice(close, j + 1)));
      const rest = code.slice(j + 1);
      if (m[2] === "Formula[") out.push(h("span.c-txt", rest));
      else if (m[2] === "Alias[" && rest.indexOf("%") < 0) out.push(...condTokens(rest, bad, aliases));
      else out.push(...outTokens(rest, aliases));
    } else out.push(h("span.c-txt", code));
    if (cmt) out.push(h("span.c-cmt", cmt));
    return out;
  }

  /* "Now an item change", with a button to see it on Items. */
  function itemsToast(app, n) {
    const done = EZ.ui.toast((n === 1 ? "Now an item change" : `Now ${n} item changes`) + " (edit it on Items like " +
      "any other).", "good", {ms: 9000, action: h("button.fe-btn.small", {type: "button", style: {marginLeft: ".6em"},
        onclick: () => { done(); app.go("items"); }}, "Show it in Items")});
  }

  /* ---------------------------------------------------------------- a block: the code editor and its lists */

  function codeEditor(app, which, onLint) {
    const ta = h("textarea.fe-ed-ta", {spellcheck: "false", autocomplete: "off", autocapitalize: "off",
      wrap: "off", "aria-label": which === "top" ? "Your rules above Erazure's" : "Your rules below Erazure's"});
    ta.value = blockOf(which);
    const hl = h("pre.fe-ed-hl", {"aria-hidden": "true"});
    const gutter = h("pre.fe-ed-gutter", {"aria-hidden": "true"});
    const findIn = h("input.fe-ed-find", {type: "search", placeholder: "Find", "aria-label": "Find in your rules"});
    const findN = h("span.fe-sub.fe-small");
    const lintBox = h("ul.fe-ed-lint", {"aria-live": "polite"});
    const list = h("div.fe-ed-rules");
    let findings = [];

    const rows = () => Math.min(26, Math.max(7, ta.value.split("\n").length + 2));
    ta.rows = rows();

    const selectLine = (n) => {
      const ls = ta.value.split("\n");
      let a = 0;
      for (let k = 0; k < n && k < ls.length; k++) a += ls[k].length + 1;
      ta.focus();
      ta.setSelectionRange(a, a + (ls[n] || "").length);
      ta.scrollTop = Math.max(0, n * LH - ta.clientHeight / 3);
      sync();
    };

    const sync = () => {
      hl.scrollTop = ta.scrollTop;
      hl.scrollLeft = ta.scrollLeft;
      gutter.scrollTop = ta.scrollTop;
    };
    const size = () => {
      hl.style.width = ta.clientWidth + "px";
      hl.style.height = ta.clientHeight + "px";
      gutter.style.height = ta.clientHeight + "px";
    };

    const paint = () => {
      const ls = ta.value.split("\n");
      const ctx = lintContext(app);
      const names = new Set(ctx.aliases.map((a) => a.name));
      for (const n of [...names]) names.add(n.toUpperCase());
      const byLine = new Map();
      for (const f of findings) {
        const cur = byLine.get(f.line) || {level: "info", bad: new Set()};
        if (f.level === "error" || (f.level === "warning" && cur.level === "info")) cur.level = f.level;
        if (f.word) cur.bad.add(f.word);
        byLine.set(f.line, cur);
      }
      fill(hl, ls.map((line, n) => {
        const f = byLine.get(n);
        return h("span.fe-ed-line" + (f && f.level !== "info" ? "." + (f.level === "error" ? "err" : "warn") : ""),
          line ? lineTokens(line, f && f.level === "error" ? f.bad : new Set(), names) : " ");
      }));
      fill(gutter, ls.map((line, n) => {
        const f = byLine.get(n);
        return h("span.fe-ed-num" + (f && f.level !== "info" ? "." + (f.level === "error" ? "err" : "warn") : ""),
          String(n + 1));
      }));
      size();
      sync();
    };

    const relint = () => {
      findings = lintBlock(app, which, EZ.rules.lines(ta.value).concat([]));
      paint();
      drawLint();
      drawList();
      if (onLint) onLint(findings);
    };

    /* A line of the block as item changes (Items): the line goes, its overrides come. */
    const convert = (n) => {
      save.flush();
      const ls = EZ.rules.lines(ta.value);
      if (n >= ls.length) return;
      const ctx = lintContext(app);
      const r = EZ.overrides.fromRule(ls[n], {aliases: ctx.aliases, F: ctx.F});
      if (r.why) { EZ.ui.toast(r.why, "bad"); return; }
      ls.splice(n, 1);
      const text = ls.join("\n");
      live[which] = null;
      EZ.store.change((ed) => {
        ed.items = (ed.items || []).concat(r.list);
        if (text.trim()) {
          ed.rules = ed.rules || {};
          ed.rules[which] = text;
        } else if (ed.rules) {
          delete ed.rules[which];
          if (!Object.keys(ed.rules).length) delete ed.rules;
        }
      }, {label: "my rules to items"});
      itemsToast(app, r.list.length);
    };

    const drawLint = () => {
      const shown = findings.filter((f) => f.level !== "info" || f.fix || findings.length < 12);
      fill(lintBox, shown.slice(0, 60).map((f) => h("li.fe-ed-finding." + f.level,
        h("button.fe-btn.ghost.small", {type: "button", onclick: () => selectLine(f.line),
          title: "Go to line " + (f.line + 1)}, "Line " + (f.line + 1)),
        pill(f.level === "error" ? "error" : f.level === "warning" ? "check" : "note",
             f.level === "error" ? "bad" : f.level === "warning" ? "warn" : "info"),
        h("span", f.text),
        f.fix ? h("button.fe-btn.small", {type: "button", onclick: () => convert(f.line)}, f.fix.label) : null)));
      if (shown.length > 60) lintBox.appendChild(h("li.fe-sub", `… and ${shown.length - 60} more.`));
    };

    const drawList = () => {
      const vals = aliasValues(app);
      const ls = EZ.rules.lines(ta.value);
      const items = [];
      ls.forEach((line, n) => {
        const d = EZ.rules.describe(line);
        if (d.kind === "blank" || d.kind === "comment") return;
        const kind = d.kind === "rule" ? (d.hides ? ["hides", "bad"] : d.stops ? ["decides the look", "accent"] :
          ["adds a layer", "info"]) : d.kind === "alias" ? ["alias", ""] : d.kind === "formula" ? ["formula", ""] :
          ["not a rule", "bad"];
        items.push(h("button.fe-ed-rule", {type: "button", onclick: () => selectLine(n), title: "Go to line " + (n + 1)},
          h("span.fe-num", String(n + 1)), pill(kind[0], kind[1]),
          d.kind === "rule" ? h("span.fe-ed-rulelabel", miniLabel(d.out, vals)) : h("code.fe-small", d.name || ""),
          d.kind === "rule" && d.notifies ? h("span.fe-row.fe-small", alertsOf(d.out, app)) : null,
          d.kind === "rule" ? miniDesc(d.out, vals) : null));
      });
      fill(list, items.length ? items : h("p.fe-sub.fe-small", "No rules yet."));
    };

    const save = debounce(() => {
      const text = ta.value;
      EZ.store.change((ed) => {
        if (text.trim()) {
          ed.rules = ed.rules || {};
          ed.rules[which] = text;
        } else if (ed.rules) {
          delete ed.rules[which];
          if (!Object.keys(ed.rules).length) delete ed.rules;
        }
      }, {quiet: true, label: "my rules"});
    }, 700);
    const relintSoon = debounce(relint, 150);

    ta.addEventListener("input", () => {
      live[which] = ta.value;
      paint();
      relintSoon();
      save();
    });
    ta.addEventListener("scroll", sync);
    ta.addEventListener("blur", () => { save.flush(); });
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(() => { size(); sync(); }).observe(ta);

    const findNext = (back) => {
      const q = findIn.value;
      if (!q) { findN.textContent = ""; return; }
      const t = ta.value.toLowerCase(), qq = q.toLowerCase();
      const hits = [];
      for (let i = t.indexOf(qq); i >= 0; i = t.indexOf(qq, i + 1)) hits.push(i);
      if (!hits.length) { findN.textContent = "no match"; return; }
      const at = back ? ta.selectionStart : ta.selectionEnd;
      let k = back ? hits.length - 1 : 0;
      for (let x = 0; x < hits.length; x++) {
        if (!back && hits[x] >= at) { k = x; break; }
        if (back && hits[x] < at - (ta.selectionEnd - ta.selectionStart === q.length ? q.length : 0)) k = x;
      }
      const i = hits[k];
      ta.focus();
      ta.setSelectionRange(i, i + q.length);
      const line = ta.value.slice(0, i).split("\n").length - 1;
      ta.scrollTop = Math.max(0, line * LH - ta.clientHeight / 3);
      sync();
      findN.textContent = `${k + 1} of ${hits.length}`;
    };
    findIn.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); findNext(e.shiftKey); }
    });
    findIn.addEventListener("input", () => { findN.textContent = ""; });

    const box = h("div.fe-ed",
      h("div.fe-ed-bar", findIn,
        h("button.fe-btn.ghost.small", {type: "button", onclick: () => findNext(true), title: "Previous (Shift+Enter)",
          "aria-label": "Previous match"}, "↑"),
        h("button.fe-btn.ghost.small", {type: "button", onclick: () => findNext(false), title: "Next (Enter)",
          "aria-label": "Next match"}, "↓"), findN,
        h("span.fe-bar-gap"),
        h("button.fe-btn.ghost.small", {type: "button", onclick: async () => {
          try { await navigator.clipboard.writeText(ta.value); EZ.ui.toast("Copied your rules."); } catch (e) {
            EZ.ui.toast("Your browser didn't let the page copy: select the text and press Ctrl+C.", "bad"); }
        }}, "Copy all")),
      h("div.fe-ed-body", gutter, h("div.fe-ed-wrap", hl, ta)),
      lintBox,
      h("h4.fe-ed-h", "What these rules draw"),
      list);
    relint();
    requestAnimationFrame(() => { size(); sync(); });
    return {box, ta, relint, selectLine, findings: () => findings};
  }

  /* ---------------------------------------------------------------- the builder */

  function builder(app, add) {
    const cat = EZ.items.catalog();
    const lines = app.versionLines();
    const card = h("section.fe-card", {id: "fe-builder"});
    const result = h("div.fe-bd-result");
    const families = (() => {
      const rev = new Map();
      for (const b of cat.bases.values()) if (b.up) rev.set(b.up.code, b.code);
      return (code) => {
        let root = code;
        for (let n = 0; n < 4 && rev.has(root); n++) root = rev.get(root);
        const out = [root];
        let b = cat.bases.get(root);
        for (let n = 0; n < 4 && b && b.up; n++) { out.push(b.up.code); b = cat.bases.get(b.up.code); }
        return out;
      };
    })();
    const levelNames = EZ.filter.levels(lines).map((l) => plainName(l.text));
    const used = Object.keys(EZ.filter.notifications(lines).sounds).map((k) => +k);

    const set = (fn, full) => {
      fn(B);
      keepForm();
      if (full) draw(); else drawResult();
    };

    const field = (label, ...kids) => h("div.fe-bd-field", h("span.fe-bd-label", label), h("div.fe-row.fe-small", kids));
    const chips = (list, on, toggleIt, title) => list.map(([value, text]) => h("button.fe-chiptog", {type: "button",
      "aria-pressed": String(on.indexOf(value) >= 0), title: title ? title(value) : null,
      onclick: () => set((b) => toggleIt(b, value), true)}, text));
    const flip = (arr, v) => { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); };
    const numIn = (value, onset, label, extra) => h("input.fe-pv-num", Object.assign({type: "number", value: value,
      "aria-label": label, oninput: (e) => set((b) => onset(b, e.target.value))}, extra || {}));
    const yesNo = (key, label) => field(label, seg([{value: "any", text: "Either"}, {value: "yes", text: "Yes"},
      {value: "no", text: "No"}], B[key], (v) => set((b) => { b[key] = v; }, true), {label}));

    function itemsField() {
      const search = EZ.ui.combo({placeholder: "Search an item: Shako, Ber Rune, Small Charm…", label: "Search an item",
        find: (q) => EZ.items.search(q, 12).map((p) => ({label: p.label, sub: p.sub + " · " + p.spec.code, pick: () =>
          set((b) => {
            if (b.codes.indexOf(p.spec.code) < 0) b.codes.push(p.spec.code);
            if (p.spec.quality && b.quals.indexOf(p.spec.quality) < 0) b.quals.push(p.spec.quality);
          }, true)})),
        empty: (q) => `No item matches "${q}".`});
      const group = h("select", {"aria-label": "Add a kind of item", onchange: (e) => {
        const v = e.target.value;
        e.target.value = "";
        if (v) set((b) => { if (b.groups.indexOf(v) < 0) b.groups.push(v); }, true);
      }}, h("option", {value: ""}, "…or add a kind of item"),
        GROUPS.map(([title, list]) => h("optgroup", {label: title}, list.map(([v, t]) => h("option", {value: v}, t)))));
      const chipsRow = h("div.fe-row.fe-small",
        B.codes.map((code) => {
          const base = cat.bases.get(code);
          const fam = families(code).filter((c) => cat.bases.has(c));
          const missing = fam.filter((c) => B.codes.indexOf(c) < 0);
          const shared = B.quals.filter((q) => q === "UNI" || q === "SET").map((q) =>
            cat.uniques.filter((u) => u.code === code && u.kind === q).length).reduce((a, b) => a + b, 0);
          return h("span.fe-bd-chip", {title: code},
            (base ? plainName(base.name) : code) + " ", h("code.fe-small", code),
            fam.length > 1 && missing.length ? h("button.fe-btn.ghost.small", {type: "button",
              title: "Add its other tiers: " + missing.map((c) => plainName((cat.bases.get(c) || {}).name || c)).join(", "),
              onclick: () => set((b) => { for (const c of missing) if (b.codes.indexOf(c) < 0) b.codes.push(c); }, true)},
              "+ tiers") : null,
            shared > 1 ? h("span.fe-sub", {title: "Unidentified, the loot filter can't tell them apart: they share " +
              "this base"}, ` (${shared} share it)`) : null,
            h("button.fe-x", {type: "button", "aria-label": "Remove " + code, onclick: () =>
              set((b) => { b.codes = b.codes.filter((c) => c !== code); }, true)}, "✕"));
        }),
        B.groups.map((g) => h("span.fe-bd-chip", GROUP_NAME.get(g) || g, " ", h("code.fe-small", g),
          h("button.fe-x", {type: "button", "aria-label": "Remove " + g, onclick: () =>
            set((b) => { b.groups = b.groups.filter((x) => x !== g); }, true)}, "✕"))));
      search.box.classList.add("fe-bd-search");
      return h("div.fe-bd-field.wide", h("span.fe-bd-label", "Items (any of these; none: every item)"),
        h("div.fe-row", search.box, group), chipsRow);
    }

    function statsField() {
      const skills = [...cat.skills.values()].filter((s) => CLASS_INDEX[s.cls] !== undefined)
        .sort((a, b) => CLASS_INDEX[a.cls] - CLASS_INDEX[b.cls] || a.name.localeCompare(b.name));
      const rowsBox = h("div.fe-stack");
      B.stats.forEach((s, k) => {
        const kind = h("select", {"aria-label": "Kind of stat", onchange: (e) => set((b) => {
          b.stats[k] = {kind: e.target.value, word: "", n: "", op: s.op || "min", a: s.a, b: s.b};
        }, true)}, STAT_KINDS.map(([v, t]) => h("option", {value: v, selected: kindOf(s) === v}, t)));
        let what = null;
        if (s.kind === "word" || s.kind === "STAT") {
          what = statPicker(s, (v) => set((b) => {
            b.stats[k] = Object.assign({kind: v.kind, word: v.word || "", n: v.n || ""},
              {op: b.stats[k].op || "min", a: b.stats[k].a, b: b.stats[k].b});
          }, true));
        } else if (s.kind === "CLSK") {
          what = h("select", {"aria-label": "Class", onchange: (e) => set((b) => { b.stats[k].n = e.target.value; })},
            h("option", {value: ""}, "Pick a class"),
            CLASS_NAMES.map((c, i) => h("option", {value: String(i), selected: String(s.n) === String(i)}, c)));
        } else if (s.kind === "TABSK") {
          what = h("select", {"aria-label": "Skill tab", onchange: (e) => set((b) => { b.stats[k].n = e.target.value; })},
            h("option", {value: ""}, "Pick a skill tab"),
            TABS.map(([i, t]) => h("option", {value: String(i), selected: String(s.n) === String(i)}, t)));
        } else {
          what = h("select", {"aria-label": "Skill", onchange: (e) => set((b) => { b.stats[k].n = e.target.value; })},
            h("option", {value: ""}, "Pick a skill"),
            CLASS_NAMES.map((c, ci) => h("optgroup", {label: c}, skills.filter((x) => CLASS_INDEX[x.cls] === ci)
              .map((x) => h("option", {value: String(x.id), selected: String(s.n) === String(x.id)}, x.name)))));
        }
        const total = s.kind === "SKTOTAL" && s.n !== "" ? cat.skills.get(+s.n) : null;
        rowsBox.appendChild(h("div.fe-row.fe-small.fe-bd-stat", kind, what,
          h("select", {"aria-label": "Compare", onchange: (e) => set((b) => { b.stats[k].op = e.target.value; }, true)},
            OPS.map(([v, t]) => h("option", {value: v, selected: (s.op || "min") === v}, t))),
          numIn(s.a, (b, v) => { b.stats[k].a = v; }, "Value"),
          s.op === "between" ? [h("span", "and"), numIn(s.b, (b, v) => { b.stats[k].b = v; }, "Second value")] : null,
          total && total.tab === null ? h("span.fe-sub", "(its tab isn't counted)") : null,
          h("button.fe-x", {type: "button", "aria-label": "Remove this stat", onclick: () =>
            set((b) => { b.stats.splice(k, 1); }, true)}, "✕")));
      });
      return h("div.fe-bd-field.wide", h("span.fe-bd-label", "Stats (all of these)"), rowsBox,
        h("div.fe-row.fe-small", h("button.fe-btn.small", {type: "button", onclick: () =>
          set((b) => { b.stats.push({kind: "word", word: "", n: "", op: "min", a: "", b: ""}); }, true)}, "+ Add a stat"),
          h("span.fe-sub", "Stats show on identified items (and on non-magical items: sockets, defense, ED).")));
    }

    function iconField() {
      const palette = app.data.palette || [];
      const combo = EZ.rules.LAYERS.filter((l) => B.icon[l]).map((l) => l + "-" + B.icon[l]).join(" ");
      return field("Minimap icon", EZ.looks.icon(combo, palette, 3),
        EZ.rules.LAYERS.map((l) => {
          const b = h("button.fe-layer", {type: "button", title: `${l}: ${B.icon[l] || "none"}`},
            h("span.fe-layerbox", {style: {background: B.icon[l] ? palette[parseInt(B.icon[l], 16)] : "transparent"}}),
            l === "BORDER" ? "Border" : l === "MAP" ? "Map" : l === "DOT" ? "Dot" : "Pixel");
          b.addEventListener("click", () => EZ.looks.palettePicker(b, palette, B.icon[l], (col) => set((x) => {
            x.icon = Object.assign({}, x.icon);
            if (col === null) delete x.icon[l]; else x.icon[l] = col;
          }, true), true));
          return b;
        }),
        combo ? h("button.fe-btn.ghost.small", {type: "button", onclick: () => set((x) => { x.icon = {}; }, true)},
          "No icon") : null);
    }

    function drawResult() {
      const spec = specOf(B);
      const r = EZ.rules.build(spec);
      const findings = lintBlock(app, "top", [r.line]);
      const vals = aliasValues(app);
      const first = B.codes.length ? cat.bases.get(B.codes[0]) : null;
      const q = B.quals.length === 1 ? B.quals[0] : null;
      const sample = "%" + (SAMPLE_COLOR[q] || "WHITE") + "%" + (first ? plainName(first.name) : "Item");
      const copy = async () => {
        try { await navigator.clipboard.writeText(r.line); EZ.ui.toast("Copied the rule."); } catch (e) {
          EZ.ui.toast("Your browser didn't let the page copy: select the rule and press Ctrl+C.", "bad"); }
      };
      // the notes that matter here: errors and checks, and a note that comes with a fix (an item change does it
      // better); a form that picks no items can't be added
      const shown = findings.filter((f) => f.level !== "info" || f.fix);
      const noItems = !(B.codes.length || B.groups.length || B.quals.length || B.tiers.length || B.stats.length ||
        B.extra.trim() || B.eth !== "any" || B.id !== "any" || B.rw !== "any" || B.sock.op !== "any" || B.ilvl[0] ||
        B.ilvl[1] || B.hands || B.disc !== "any");
      const toItems = () => {
        const ctx = lintContext(app);
        const c = EZ.overrides.fromRule(r.line, {aliases: ctx.aliases, F: ctx.F});
        if (c.why) { EZ.ui.toast(c.why, "bad"); return; }
        EZ.store.change((ed) => { ed.items = (ed.items || []).concat(c.list); }, {label: "my rules to items"});
        itemsToast(app, c.list.length);
      };
      fill(result,
        h("div.fe-bd-show",
          h("div.fe-ground.fe-bd-ground", miniLabel(r.out, vals, sample)),
          h("div.fe-row.fe-small", alertsOf(r.out, app)),
          miniDesc(r.out, vals)),
        h("details.fe-rules", h("summary", "Show the rule"), h("code.fe-bd-line", r.line),
          h("div.fe-row.fe-small", h("button.fe-btn.ghost.small", {type: "button", onclick: copy}, "Copy it"))),
        shown.length ? h("ul.fe-ed-lint", shown.map((f) => h("li.fe-ed-finding." + f.level,
          pill(f.level === "error" ? "error" : f.level === "warning" ? "check" : "note",
            f.level === "error" ? "bad" : f.level === "warning" ? "warn" : "info"), h("span", f.text),
          f.fix ? h("button.fe-btn.small", {type: "button", onclick: toItems}, f.fix.label) : null))) : null,
        noItems ? h("p.fe-note.warn", "Pick the items it is for first (Which items): with none, the rule is for every " +
          "item.") : null,
        h("div.fe-row",
          h("button.fe-btn.primary", {type: "button", disabled: noItems, onclick: () => add("top", r.line)},
            "Add above Erazure's rules"),
          h("button.fe-btn", {type: "button", disabled: noItems, onclick: () => add("bottom", r.line)},
            "Add below Erazure's rules"),
          h("button.fe-btn.ghost", {type: "button", onclick: () => resetForm(blank(), "Cleared the form.")},
            "Clear the form")),
        h("p.fe-sub.fe-small", "Above: your rule comes before Erazure's, so it changes items Erazure styles too. " +
          "Below: it comes after them, for the few items Erazure leaves to its last rule (most items never get there)."));
    }

    /* Change the whole form, with a way back (the form isn't in the page's Undo). */
    function resetForm(next, said) {
      const before = JSON.stringify(B);
      for (const k of Object.keys(B)) delete B[k];
      Object.assign(B, next);
      keepForm();
      draw();
      const done = EZ.ui.toast(said, null, {ms: 9000, action: h("button.fe-btn.small", {type: "button",
        style: {marginLeft: ".6em"}, onclick: () => {
          done();
          const old = JSON.parse(before);
          for (const k of Object.keys(B)) delete B[k];
          Object.assign(B, old);
          keepForm();
          draw();
        }}, "Undo")});
    }

    function draw() {
      const hide = B.show === "hide";
      const alerting = Object.keys(B.icon).length || B.sound;
      fill(card,
        h("h3", "Build a rule"),
        h("p.fe-sub", "Pick what the rule matches and what it does; the rule is written below as BH reads it. Add it " +
          "to your rules, then change it there if you like."),
        h("div.fe-row.fe-small.fe-bd-templates", h("span.fe-sub", "What it does, from:"),
          TEMPLATES.map(([title, sub, over]) => h("button.fe-btn.small", {type: "button", title: sub, onclick: () => {
            const next = JSON.parse(JSON.stringify(B)), fresh = blank();
            for (const k of WHAT_FIELDS) next[k] = fresh[k];
            Object.assign(next, JSON.parse(JSON.stringify(over)));
            resetForm(next, `"${title}": What it does is set; the items, levels and places you picked stay.`);
          }}, title))),
        h("fieldset.fe-bd-set", h("legend", "Which items"),
          itemsField(),
          field("Quality (any of these)", chips(QUALS, B.quals, (b, v) => flip(b.quals, v))),
          field("Tier", chips([["NORM", "Normal"], ["EXC", "Exceptional"], ["ELT", "Elite"]], B.tiers,
            (b, v) => flip(b.tiers, v))),
          field("Hands", seg([{value: "", text: "Either"}, {value: "1H", text: "One-handed"},
            {value: "2H", text: "Two-handed"}], B.hands, (v) => set((b) => { b.hands = v; }, true), {label: "Hands"})),
          yesNo("eth", "Ethereal"), yesNo("id", "Identified"), yesNo("rw", "Runeword"),
          field("Sockets", h("select", {"aria-label": "Sockets", onchange: (e) => set((b) => { b.sock.op = e.target.value; }, true)},
            [["any", "Any"], ["none", "None"], ["exactly", "Exactly"], ["min", "At least"], ["max", "At most"],
             ["between", "Between"]].map(([v, t]) => h("option", {value: v, selected: B.sock.op === v}, t))),
            ["exactly", "min", "max", "between"].indexOf(B.sock.op) >= 0 ? numIn(B.sock.a, (b, v) => { b.sock.a = v; },
              "Sockets", {min: 0, max: 6}) : null,
            B.sock.op === "between" ? [h("span", "and"), numIn(B.sock.b, (b, v) => { b.sock.b = v; }, "Sockets",
              {min: 0, max: 6})] : null),
          field("Item level", numIn(B.ilvl[0], (b, v) => { b.ilvl[0] = v; }, "Lowest item level", {placeholder: "from",
            min: 1, max: 99}), h("span", "to"), numIn(B.ilvl[1], (b, v) => { b.ilvl[1] = v; }, "Highest item level",
            {placeholder: "to", min: 1, max: 99})),
          statsField(),
          h("label.fe-bd-field.wide", h("span.fe-bd-label", "More conditions (BH's words, as Erazure writes them)"),
            h("input", {type: "text", value: B.extra, spellcheck: "false", class: "fe-mono",
              placeholder: "e.g. !GRAIL_NEW (MAPTIER>2)", oninput: (e) => set((b) => { b.extra = e.target.value; })}))),
        h("fieldset.fe-bd-set", h("legend", "When and where"),
          field("Filter levels (none picked: every level)", chips(levelNames.map((n, i) => [i + 1, String(i + 1)]),
            B.levels, (b, v) => flip(b.levels, v), (v) => `${v}: ${levelNames[v - 1] || ""}`)),
          B.levels.length ? h("p.fe-sub.fe-small", B.levels.slice().sort((a, b) => a - b)
            .map((v) => `${v}: ${levelNames[v - 1] || ""}`).join(" · ")) : null,
          field("Character level", numIn(B.clvl[0], (b, v) => { b.clvl[0] = v; }, "From character level",
            {placeholder: "from", min: 1, max: 99}), h("span", "to"), numIn(B.clvl[1], (b, v) => { b.clvl[1] = v; },
            "To character level", {placeholder: "to", min: 1, max: 99})),
          field("Your class (none picked: any)", chips(EZ.rules.CLASS_WORDS.map((c, i) => [c, CLASS_NAMES[i]]),
            B.classes, (b, v) => flip(b.classes, v))),
          field("Difficulty (none picked: any)", chips([[0, "Normal"], [1, "Nightmare"], [2, "Hell"]], B.diffs,
            (b, v) => flip(b.diffs, v))),
          field("Where the item is", h("select", {"aria-label": "Where the item is", onchange: (e) =>
            set((b) => { b.place = e.target.value; })},
            PLACES.map(([v, t]) => h("option", {value: v, selected: B.place === v}, t)))),
          field("Holy Grail (uniques and sets)", h("select", {"aria-label": "Holy Grail", onchange: (e) =>
            set((b) => { b.disc = e.target.value; })},
            [["any", "Either"], ["new", "Not discovered yet"], ["found", "Discovered"]].map(([v, t]) =>
              h("option", {value: v, selected: B.disc === v}, t))))),
        h("fieldset.fe-bd-set", h("legend", "What it does"),
          field("The item", seg([{value: "show", text: "Show it"}, {value: "hide", text: "Hide it"}], B.show,
            (v) => set((b) => { b.show = v; }, true), {label: "Show or hide"})),
          hide ? h("p.fe-sub.fe-small", "A hidden item keeps its minimap icon or sound if you give it one.") : [
            h("p.fe-sub.fe-small", "Above Erazure's rules, a rule that doesn't keep going decides these items' label: " +
              "Erazure's look and tags stop for them. To show items Erazure hides, with Erazure's look, use ",
              h("a", {href: "#items", onclick: (ev) => { ev.preventDefault(); app.go("items"); }}, "Items"), "."),
            h("label.fe-bd-field.wide", h("span.fe-bd-label", "Its label (%NAME% is the name so far)"),
              h("input", {type: "text", value: B.text, spellcheck: "false", class: "fe-mono", "data-fe-text": "",
                oninput: (e) => set((b) => { b.text = e.target.value; })})),
            h("div.fe-row.fe-small.fe-bd-insert", EZ.edits.COLORS.map((c) => h("button.fe-chipbtn", {type: "button",
              title: "%" + c + "%", style: {color: EZ.render.rgb(EZ.render.WORDS[c]) || "inherit"},
              onmousedown: (ev) => ev.preventDefault(), onclick: (ev) => insertInto(ev.target, "%" + c + "%")}, "■")),
              ["%NAME%", "%ILVL%", "%SOCKETS%", "%NL%", "*", "•", "~", "+", "!"].map((s) => h("button.fe-chipbtn",
                {type: "button", onmousedown: (ev) => ev.preventDefault(), onclick: (ev) => insertInto(ev.target, s)}, s))),
            field("Description (hover box)", h("select", {"aria-label": "Description", onchange: (e) =>
              set((b) => { b.desc = Object.assign({}, b.desc, {how: e.target.value}); }, true)},
              [["keep", "Keep what it has"], ["below", "Add a line under it"], ["above", "Add a line over it"],
               ["replace", "Replace it"], ["clear", "Empty it"]].map(([v, t]) => h("option", {value: v,
                selected: B.desc.how === v}, t))),
              ["below", "above", "replace"].indexOf(B.desc.how) >= 0 ? h("input", {type: "text", value: B.desc.text,
                class: "fe-mono", spellcheck: "false", "aria-label": "Description text", placeholder: "%GREEN%My note",
                oninput: (e) => set((b) => { b.desc = Object.assign({}, b.desc, {text: e.target.value}); })}) : null),
            field("Keep going", h("label.fe-switch", h("input", {type: "checkbox", checked: !!B.cont,
              onchange: (e) => set((b) => { b.cont = e.target.checked; }, true)}), h("span.track"),
              h("span", "Let later rules (Erazure's too) build on this one (%CONTINUE%)")))],
          iconField(),
          field("Drop sound", h("button.fe-btn.small", {type: "button", onclick: () => EZ.sounds.pick(app, used, B.sound,
            (id) => set((b) => { b.sound = id; }, true))}, B.sound ? "♪ " + EZ.sounds.name(app.data, B.sound) : "Pick a sound"),
            B.sound ? EZ.sounds.play(app.data, B.sound) : null,
            B.sound ? h("button.fe-btn.ghost.small", {type: "button", onclick: () => set((b) => { b.sound = 0; }, true)},
              "No sound") : null),
          alerting ? field("Chat line", h("select", {"aria-label": "Chat line", onchange: (e) =>
            set((b) => { b.chat = e.target.value; }, true)},
            [["all", "On every level"], ["tier", "Only on levels 0 to …"], ["none", "None (icon only, no sound)"]]
              .map(([v, t]) => h("option", {value: v, selected: B.chat === v}, t))),
            B.chat === "tier" ? numIn(B.tier, (b, v) => { b.tier = v; }, "Up to level", {min: 0, max: 9}) : null) : null,
          h("label.fe-bd-field.wide", h("span.fe-bd-label", "A note for yourself (after //)"),
            h("input", {type: "text", value: B.comment, oninput: (e) => set((b) => { b.comment = e.target.value; })}))),
        result);
      drawResult();
    }

    function insertInto(btn, text) {
      const input = card.querySelector("input[data-fe-text]");
      if (!input) return;
      const s = input.selectionStart === null ? input.value.length : input.selectionStart;
      const t = input.selectionEnd === null ? s : input.selectionEnd;
      input.value = input.value.slice(0, s) + text + input.value.slice(t);
      input.focus();
      input.setSelectionRange(s + text.length, s + text.length);
      set((b) => { b.text = input.value; });
      void btn;
    }

    draw();
    return card;
  }

  /* ---------------------------------------------------------------- the area */

  let warnCache = {key: null, n: 0};
  function errorLines(app) {
    const e = EZ.store.current().edits;
    const key = JSON.stringify(e.rules || {}) + "|" + (app.variant() || {}).name;
    if (warnCache.key === key) return warnCache.n;
    let n = 0;
    try {
      for (const which of EZ.rules.BLOCKS) {
        const f = lintBlock(app, which, EZ.rules.lines(blockOf(which)));
        n += new Set(f.filter((x) => x.level === "error").map((x) => x.line)).size;
      }
    } catch (err) { n = 0; }
    warnCache = {key, n};
    return n;
  }

  if (EZ.app && EZ.app.checks) {
    EZ.app.checks.push((app) => {
      const n = errorLines(app);
      return n ? {text: `My rules: ${n} line${n === 1 ? "" : "s"} the game can't read as written, or that would ` +
        "change every item (see the red notes there).", area: "rules"} : null;
    });
  }

  /* For the rules browser: the highlighter and a rule's label and alerts. */
  EZ.rulesArea = {lineTokens, miniLabel, miniDesc, alertsOf, aliasValues, statPicker, statName, kindOf, STAT_KINDS,
                  STAT_WORDS, OPS, CLASS_INDEX, CLASS_NAMES, TABS, GROUPS, GROUP_NAME};

  EZ.areas.push({
    id: "rules", title: "My rules", icon: "⊕", order: 80, group: "c",
    count: (e) => EZ.edits.countArea("rules", e),
    warn: (e, app) => errorLines(app),
    render(box, app) {
      live.top = live.bottom = null;
      const editors = {};
      const add = (which, line) => {
        const cur = editors[which] ? editors[which].ta.value : blockOf(which);
        const text = (cur.replace(/\s+$/, "") ? cur.replace(/\s+$/, "") + "\n" : "") + line;
        EZ.store.change((ed) => {
          ed.rules = ed.rules || {};
          ed.rules[which] = text;
        }, {label: "my rules"});
        EZ.ui.toast(which === "top" ? "Added to your rules above Erazure's." : "Added to your rules below Erazure's.",
          "good");
        const card = box.querySelector("#fe-rules-" + which);
        if (card) card.scrollIntoView({block: "start"});
      };
      const blockCard = (which) => {
        const ed = codeEditor(app, which);
        editors[which] = ed;
        return h("section.fe-card", {id: "fe-rules-" + which},
          h("h3", which === "top" ? "Above Erazure's rules" : "Below Erazure's rules"),
          h("p.fe-sub", which === "top" ?
            "These come first. A rule here that decides the look (no %CONTINUE%) is the item's label, and Erazure's " +
            "own rules never see the item; a %CONTINUE% rule adds a layer that Erazure's rules build on, where they " +
            "use %NAME% (many of Erazure's looks write the whole name, runes and gems among them: check the item in " +
            "the preview). If your rule has an icon or a sound, it decides these items' alert: Erazure's chat line " +
            "and sound don't come (yours do, if you picked a sound)." :
            "These come after Erazure's rules, for the items Erazure leaves to its very last rule (most items Erazure " +
            "styles never get here: the check says when a rule changes nothing). Alerts here only count where " +
            "Erazure has none."),
          ed.box);
      };
      const help = h("section.fe-card.flat",
        h("h3", "How rules work"),
        h("ul",
          h("li", "BH reads the rules from the top. The first rule that matches and has no ", h("code", "%CONTINUE%"),
            " decides what the item shows; a rule with ", h("code", "%CONTINUE%"), " passes its text on as ",
            h("code", "%NAME%"), " to the rules after it."),
          h("li", "Minimap icons, drop sounds and chat lines are worked out on their own: the first matching rule that " +
            "has one decides the sound and the chat line, and icons add up until a rule without ",
            h("code", "%CONTINUE%"), "."),
          h("li", "AND and OR count the same and are read left to right: ", h("code", "A OR B C"), " is ",
            h("code", "(A OR B) AND C"), ". Put brackets round every OR."),
          h("li", "To hide an item only on the ground, add ", h("code", "GROUND !TOWN"), ": without them it has no name " +
            "in your inventory, stash and shops either."),
          h("li", "Erazure's aliases work in your rules: ", h("code", "TOWN"), ", ", h("code", "GRAIL_NEW"),
            ", the looks (", h("code", "%UNI_HIGH_VALUE_LEFT%"), "…). Filter levels are ", h("code", "FILTLVL=1"),
            " to ", h("code", "FILTLVL=12"), "."),
          h("li", "Every word BH knows is on the ", h("a", {href: "https://wiki.projectdiablo2.com/wiki/Item_Filtering",
            target: "_blank", rel: "noopener"}, "PD2 wiki's Item Filtering page"), ".")));
      EZ.ui.add(box, [
        h("div.fe-area-head", h("div", h("h2", "My rules ", pill("Advanced", "info")),
          h("p.fe-sub", "Your own rules in BH's filter language, above or below Erazure's. Build one with the form, or " +
            "write them yourself: every line is checked as BH will read it."))),
        app.advancedNote(),
        builder(app, add), blockCard("top"), blockCard("bottom"), help]);
      if (app.sub && box.querySelector("#fe-" + app.sub)) box.querySelector("#fe-" + app.sub).scrollIntoView();
    },
  });
})();
