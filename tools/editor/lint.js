/* The Filter Editor's lint: what BH will make of the player's own lines (My rules), read with the engine's own port
   of BH (EZ.engine.analyze / action / replacements) after every alias is written in as BH writes it, so a word BH
   drops, a condition it can't read, a keyword it shows as text, a label it cuts or a letter the game can't draw is
   named before the player saves. tools/lint_filter.py checks Erazure's own sections; tools/editor_selftest.py runs
   this lint over every rule of Erazure (none may be an error) and over lines with known mistakes. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.lint = (function () {
  "use strict";
  const KEYWORD_RE = /%([A-Z_]+)(?:(\d{1,9})(?:,(\d{1,9}))?)?%/g;
  const LEFT_RE = /%(BORDER|MAP|DOT|PX|LINE|NOTIFY|TIER|SOUNDID)-[^%\s]*%/gi;
  const COLORS = new Set(["WHITE", "RED", "GREEN", "BLUE", "GOLD", "GRAY", "BLACK", "TAN", "ORANGE", "YELLOW", "PURPLE",
    "DARK_GREEN", "CORAL", "SAGE", "TEAL", "LIGHT_GRAY", "FULL_TRANS", "THREE_FOURTHS_TRANS", "HALF_TRANS",
    "QUARTER_TRANS"]);
  const STATIC = new Set(["NAME", "BASENAME", "SOCKETS", "RUNENUM", "RUNENAME", "GEMLEVEL", "GEMTYPE", "ILVL", "ALVL",
    "CRAFTALVL", "REROLLALVL", "LVLREQ", "WPNSPD", "RANGE", "CODE", "LBRACE", "RBRACE", "PERCENT", "BUYPRICE",
    "SELLPRICE", "PRICE", "QTY", "RES", "ED", "CS", "CL", "NL", "REQSTR", "REQDEX", "REQLVL", "BASEMINONEH",
    "BASEMAXONEH", "BASEMINTWOH", "BASEMAXTWOH", "BASEMINTHROW", "BASEMAXTHROW", "BASEMINKICK", "BASEMAXKICK",
    "BASEMINSMITE", "BASEMAXSMITE", "BASEBLOCK", "ALLATTRIB", "MAXRES", "PLUSDEF", "UPSTR", "UPDEX", "UPLVL",
    "MAXSOCKETS", "MINDMG", "MAXDMG", "EDEF", "EDAM", "DEF", "FRES", "CRES", "LRES", "PRES", "IAS", "FCR", "FHR", "FBR",
    "LIFE", "MANA", "ARPER", "MFIND", "GFIND", "STR", "DEX", "FRW", "AR", "DTM", "MAEK", "REPLIFE", "REPQUANT",
    "REPAIR"]);
  const DYNAMIC = {STAT: 1, SK: 1, OS: 1, CLSK: 1, TABSK: 1, CHARSTAT: 1, MULTI: 2};
  const NOTIFY_WORDS = {BORDER: "border", MAP: "map", DOT: "dot", PX: "px", LINE: "line", NOTIFY: "notify"};
  const VALID = {TIER: /^%TIER-[0-9]%$/i, SOUNDID: /^%SOUNDID-[0-9]{1,4}%$/i};
  for (const k of Object.keys(NOTIFY_WORDS)) VALID[k] = new RegExp("^%" + k + "-[a-f0-9]{1,4}%$", "i");
  const NAME_MAX = 56, SHOP_MAX = 512, COPY_MAX = 127, DESC_MAX = 500;
  const SHOP_RE = /(^|[^!\w])SHOP\b/;
  const WORD_RE = /[A-Za-z0-9_]+/g;

  function balanced(text) {
    let d = 0;
    for (const ch of text) {
      if (ch === "(") d++;
      else if (ch === ")" && --d < 0) return false;
    }
    return d === 0;
  }

  /* True if an AND follows an OR inside the same brackets ('A OR B C' is '(A OR B) AND C' to BH). */
  function andAfterOr(cond) {
    const toks = [];
    for (const tok of cond.split(/\s+/).filter(Boolean)) {
      let a = 0, b = tok.length;
      while (a < b && "!(".indexOf(tok[a]) >= 0) toks.push(tok[a++]);
      const tail = [];
      while (b > a && tok[b - 1] === ")") { tail.push(")"); b--; }
      const core = tok.slice(a, b);
      if (core) toks.push(core === "&&" ? "AND" : core === "||" ? "OR" : core);
      toks.push(...tail);
    }
    const seen = [false];
    let last = null;
    for (const t of toks) {
      const operand = t !== "AND" && t !== "OR" && t !== ")" && t !== "!" && t !== "(";
      const implicit = (operand || t === "!" || t === "(") && last !== null && (last === ")" || (last !== "AND" &&
        last !== "OR" && last !== "!" && last !== "("));
      if (implicit && seen[seen.length - 1]) return true;
      if (t === "(") seen.push(false);
      else if (t === ")") { if (seen.length > 1) seen.pop(); }
      else if (t === "OR") seen[seen.length - 1] = true;
      else if (t === "AND" && seen[seen.length - 1]) return true;
      last = t;
    }
    return false;
  }

  /* ---------------------------------------------------------------- the game's letters */

  let fontSets;
  function fonts() {
    if (fontSets !== undefined) return fontSets;
    const info = EZ.glyphs && EZ.glyphs.info && EZ.glyphs.info();
    if (!info || !info.atlases || !info.fonts || !(info.atlases.NotoSymbol || {}).has) return (fontSets = null);
    const set = (name) => {
      const s = new Set();
      for (const [a, b] of (info.atlases[name] || {}).has || []) for (let c = a; c <= b; c++) s.add(c);
      return s;
    };
    const sym = set("NotoSymbol");
    const sheet = new Set();
    for (const a of Object.values(info.atlases)) for (const k of Object.keys(a.glyphs || {})) sheet.add(+k);
    fontSets = {label: set(info.fonts.label.atlas), chat: set(info.fonts.chat.atlas), sym, sheet};
    return fontSets;
  }

  /* ---------------------------------------------------------------- the context */

  const cache = new WeakMap();

  /* What the lint needs of the player's filter: the aliases in the order BH reads them (Erazure's before 050, the
     top block's, Erazure's after it, the bottom block's), the named formulas, the game's item codes, Erazure's alias
     and formula names and the words of its conditions. blocks: {top: [lines], bottom: [lines]}. */
  function context(src, versionLines, blocks, opts) {
    opts = opts || {};
    let base = cache.get(versionLines);
    if (!base) {
      const entries = EZ.core.bhEntries(versionLines);
      const aliases = EZ.core.bhAliases(entries);
      const secs = EZ.filter.sections(src, versionLines);
      const formulas = [];
      const words = new Set();
      for (const e of entries) {
        const m = /^Formula\[(.*)\]$/.exec(e.key);
        if (m) formulas.push({name: m[1], text: e.value});
        if (e.key.startsWith("ItemDisplay[")) for (const w of e.key.match(WORD_RE) || []) words.add(w);
      }
      for (const a of aliases) for (const w of a.value.match(WORD_RE) || []) words.add(w);
      base = {aliases, formulas, words, top: (secs[EZ.rules.PLACE.top] || [0])[0],
              bottom: (secs[EZ.rules.PLACE.bottom] || [versionLines.length])[0]};
      cache.set(versionLines, base);
    }
    const own = {top: [], bottom: []}, ownFormulas = [];
    for (const b of ["top", "bottom"]) {
      for (const e of EZ.core.bhEntries(blocks[b] || [])) {
        if (e.key.startsWith("Alias[")) {
          const a = EZ.core.bhAliases([e])[0];
          own[b].push(Object.assign(a, {block: b}));
        }
        const m = /^Formula\[(.*)\]$/.exec(e.key);
        if (m) ownFormulas.push({name: m[1], text: e.value, block: b, i: e.i});
      }
    }
    const aliases = base.aliases.filter((a) => a.i < base.top).concat(own.top,
      base.aliases.filter((a) => a.i >= base.top && a.i < base.bottom), own.bottom,
      base.aliases.filter((a) => a.i >= base.bottom));
    const cat = EZ.items && EZ.items.catalog && EZ.items.catalog();
    const F = {formulas: Object.create(null), formulaText: Object.create(null), statMax: cat ? cat.statMax : 1023,
               skillMax: cat ? cat.skillMax : 1023, soundCount: opts.soundCount || 10000};
    for (const f of base.formulas.concat(ownFormulas)) {
      const node = EZ.engine.compileFormula(f.text);
      if (node) F.formulas["FORMULA" + f.name.replace(/[a-z]/g, (x) => x.toUpperCase())] = node;
    }
    return {aliases, F, codes: cat && cat.bases && cat.bases.size ? new Set(cat.bases.keys()) : null,
            erazureAliases: new Set(base.aliases.map((a) => a.name)),
            erazureFormulas: new Set(base.formulas.map((f) => f.name.toUpperCase())), words: base.words, own};
  }

  /* ---------------------------------------------------------------- the checks */

  /* What a label's own text adds at least (its %NAME% aside; a number or formula counted as one letter): {shown:
     visible letters, raw: with color codes, name: %NAME% in it, chars: the letters it draws}. */
  function measure(parts) {
    let shown = 0, raw = 0, name = false, chars = "";
    for (const p of parts) {
      if (typeof p === "string") {
        const colorCodes = (p.match(/ÿc./g) || []).length;
        const plain = p.replace(/ÿc./g, "");
        shown += plain.length;
        raw += plain.length + 3 * colorCodes;
        chars += plain;
      } else if (p.k === "NAME") name = true;
      else { shown += 1; raw += 1; }  // a line break, a %, a number: at least one letter
    }
    return {shown, raw, name, chars};
  }

  /* Each $f(...) of a text whose formula BH can't read (it stays as text): [the island]. */
  function badIslands(text) {
    const out = [];
    let at = 0;
    while ((at = text.indexOf("$f(", at)) >= 0) {
      let depth = 0, end = -1;
      for (let i = at + 2; i < text.length; i++) {
        if (text[i] === "(") depth++;
        else if (text[i] === ")" && --depth === 0) { end = i; break; }
      }
      if (end < 0) { out.push(text.slice(at)); break; }
      if (!EZ.engine.compileFormula(text.slice(at + 3, end))) out.push(text.slice(at, end + 1));
      at = end + 1;
    }
    return out;
  }

  /* Lint the lines of one block: [{line, level (error / warning / info), text, word}]. env: context()'s, with block
     ("top" / "bottom") for the messages that depend on where the lines go. */
  function lines(list, env) {
    env = env || {};
    const out = [];
    const say = (line, level, text, word) => out.push({line, level, text, word: word || null});
    const F = env.F || {formulas: Object.create(null), statMax: 1023, skillMax: 1023, soundCount: 10000};
    const fs = fonts();
    list.forEach((raw, n) => {
      const line = raw.replace(/\s+$/, "");
      if (!line.trim() || /^\s*\/\//.test(line)) return;
      const c = line.indexOf("//");
      const code = c < 0 ? line : line.slice(0, c);
      const j = code.indexOf(":");
      const key = EZ.core.bhTrim(j < 0 ? code : code.slice(0, j));
      const value = j < 0 ? "" : EZ.core.bhTrim(code.slice(j + 1));
      if (key.startsWith("Alias[")) { aliasLine(n, key, value, env, say); return; }
      if (key.startsWith("Formula[")) { formulaLine(n, key, value, env, say); return; }
      if (key.startsWith("ItemDisplayFilterName[")) {
        say(n, "warning", "BH reads 12 filter level names and Erazure has 12: this one is never shown. Rename a level " +
          "on Options instead.");
        return;
      }
      if (!key.startsWith("ItemDisplay[")) {
        say(n, "error", "BH ignores this line: a rule starts with ItemDisplay[ (an alias with Alias[, a formula with " +
          "Formula[), and anything else is skipped. Start a note with //.", code.trim().slice(0, 30));
        return;
      }
      if (j < 0) {
        say(n, "error", c >= 0 && line.indexOf(":", c) > 0 ? "The // cuts the rule before its ':' (BH ends a line at " +
          "its first //): the rule is gone." : "No ':' after the conditions: BH reads this line as nothing.");
        return;
      }
      if (!key.endsWith("]")) {
        say(n, "error", line.indexOf("]", j) > j ? "A ':' inside the [ ]: BH splits a rule at its first ':', so this " +
          "rule's condition is cut there (and the rest of it becomes what it shows). Take the ':' out." :
          "The conditions don't end with ]: write ItemDisplay[conditions]: what it shows.");
        return;
      }
      ruleLine(n, key.slice("ItemDisplay[".length, -1), value, line, env, F, fs, say);
    });
    return out;
  }

  function aliasLine(n, key, value, env, say) {
    const name = EZ.core.bhTrim(key.slice(6, key.lastIndexOf("]") < 0 ? key.length : key.lastIndexOf("]"))).split(" ")[0];
    if (!name || !/^[A-Za-z0-9_]+$/.test(name)) {
      say(n, "error", "An alias's name is letters, digits and _ only (Alias[MY_NAME]:...).", name);
      return;
    }
    if (value.indexOf(name) >= 0) {
      say(n, "error", `Alias[${name}] contains its own name: BH would replace it forever and the game hangs ` +
        "loading the filter. The editor won't save it.", name);
    }
    if (env.erazureAliases && env.erazureAliases.has(name)) {
      say(n, "warning", `Erazure already has Alias[${name}], and BH uses the first one it reads (Erazure's): yours ` +
        "changes nothing. Change Erazure's looks on Looks, or pick another name.", name);
    }
    const clash = [];
    if (env.words) for (const w of env.words) if (w !== name && w.indexOf(name) >= 0) { clash.push(w); if (clash.length > 4) break; }
    if (clash.length) {
      say(n, "warning", `BH replaces an alias's name inside other words too: ${clash.join(", ")}${clash.length > 4 ?
        "..." : ""} in Erazure's rules would change. Pick a longer, unusual name (MY_${name}).`, name);
    }
    say(n, "info", `Alias[${name}] works in every rule of the file (Erazure's too), from where BH reads it.`);
  }

  function formulaLine(n, key, value, env, say) {
    const name = key.slice(8, key.lastIndexOf("]") < 0 ? key.length : key.lastIndexOf("]"));
    if (!/^[A-Za-z_]+$/.test(name)) say(n, "error", "A formula's name is letters and _ only.", name);
    if (!EZ.engine.compileFormula(value)) {
      say(n, "error", "BH can't read this formula: every condition that asks it (FORMULA" + name.toUpperCase() +
        ">0) matches nothing.", name);
    }
    if (env.erazureFormulas && env.erazureFormulas.has(name.toUpperCase())) {
      say(n, "warning", `Erazure already has Formula[${name}]: pick another name, or Erazure's rules that ask it ` +
        "change too.", name);
    }
  }

  function ruleLine(n, cond0, out0, line, env, F, fs, say) {
    let cond = cond0, outText = out0;
    if (env.aliases && env.aliases.length) {
      const t = EZ.core.substitute([[cond], [outText]], env.aliases);
      cond = t[0][0];
      outText = t[1][0];
    }
    // the condition, its $f(...) islands as BH compiles them (into a copy: the context's formulas stay as they are)
    const condF = {formulas: Object.assign(Object.create(null), F.formulas), statMax: F.statMax, skillMax: F.skillMax,
                   soundCount: F.soundCount};
    const namer = EZ.engine.islandNamer();
    const isl = EZ.engine.islandsOf(cond, "", "", {formulas: condF.formulas, formulaText: {}}, namer);
    if (!balanced(cond)) {
      say(n, "error", "Unbalanced ( ) in the conditions: BH stops reading at a ) without its ( and ignores a ( that " +
        "isn't closed.");
    } else if (andAfterOr(isl)) {
      say(n, "warning", "AND after OR in the same brackets: BH reads AND and OR left to right, so 'A OR B C' means " +
        "'(A OR B) AND C'. Add brackets for the grouping you mean.");
    }
    for (const b of badIslands(cond)) say(n, "error", `BH can't read the formula ${b.slice(0, 40)}: it drops the word.`, b);
    const a = EZ.engine.analyze(isl, condF);
    for (const d of a.dropped) {
      say(n, "error", `BH drops '${d.token}' (${d.why}): the rest of the condition still counts, so the rule matches ` +
        "more items than you meant.", d.token);
    }
    const act = EZ.engine.action(EZ.engine.islandsOf(outText, "%", "%", {formulas: condF.formulas, formulaText: {}},
                                                     namer), condF);
    const hides = !act.cont && !act.text.length;
    if (a.never) {
      say(n, "error", "BH can't build this condition (an AND, OR or ! without what it joins): the rule never matches.");
    } else if (a.always) {
      const stopTop = env.block === "top" && !act.cont;
      say(n, stopTop || cond.trim() ? "warning" : "info", (cond.trim() ? "No condition is left once BH drops what it " +
        "can't read: " : "No condition: ") + "the rule matches every item" + (stopTop ? ", and above Erazure's rules it " +
        "decides every item's look (Erazure's own rules never run)." : "."));
    }
    if (env.codes) {
      for (const code of a.codes) {
        if (!env.codes.has(code)) {
          say(n, "warning", `'${code}' is no item code of the game: it matches nothing. (A word of 3 or more letters ` +
            "that starts in lower case is read as an item code.)", code);
        }
      }
    }
    // the output, as BuildAction reads it
    const opens = (outText.match(/\{/g) || []).length, closes = (outText.match(/\}/g) || []).length;
    if (opens > 1 || closes > 1) {
      say(n, "error", "More than one { or }: BH reads the first { } as the description and shows the rest as text.");
    } else if (opens !== closes) {
      say(n, "error", "A { without its } (or the other way round): BH shows it as text, and the rule has no " +
        "description of its own.");
    }
    for (const k of (act.text + " " + act.descText).match(LEFT_RE) || []) {
      const kind = k.slice(1, k.indexOf("-")).toUpperCase();
      const second = VALID[kind].test(k);  // a well-formed one left over: BH took an earlier one of its kind
      const why = second ? "BH takes only the first one of a kind" : kind === "TIER" ? "BH reads one digit, 0-9" :
        kind === "SOUNDID" ? "a sound is a number of up to 4 digits" : "a color is 1-4 hex digits (00-FF)";
      say(n, "error", `${k} shows as text: ${why}.`, k);
    }
    if (/%CONTINUE%/.test(act.descText)) say(n, "error", "%CONTINUE% inside { } is shown as text there; put it outside.");
    for (const [part, isDesc] of [[act.text, false], [act.descText, true]]) {
      KEYWORD_RE.lastIndex = 0;
      let m;
      while ((m = KEYWORD_RE.exec(part))) {
        const w = m[1], count = (m[2] ? 1 : 0) + (m[3] ? 1 : 0);
        const known = COLORS.has(w) || STATIC.has(w) ? count === 0 : DYNAMIC[w] !== undefined ? count === DYNAMIC[w] :
          !!condF.formulas[w] && count === 0;
        if (known || (isDesc && w === "CONTINUE")) { KEYWORD_RE.lastIndex = m.index + m[0].length; continue; }
        const hint = NOTIFY_WORDS[w] ? ` (an icon needs a color: %${w}-0A%)` : w === "SOUNDID" ? " (%SOUNDID-123%)" :
          w === "TIER" ? " (%TIER-4%)" : DYNAMIC[w] !== undefined ? ` (it needs ${DYNAMIC[w]} number${DYNAMIC[w] > 1 ?
          "s" : ""}: %${w}${DYNAMIC[w] > 1 ? "107,54" : "127"}%)` : "";
        say(n, "error", `${m[0]} is no keyword BH knows: it shows as text${hint}.`, m[0]);
        KEYWORD_RE.lastIndex = m.index + m[0].length - 1;
      }
    }
    for (const b of badIslands(act.text + act.descText)) {
      say(n, "error", `BH can't read the formula ${b.slice(0, 40)}: it shows as text.`, b);
    }
    if (/%SOUNDID-\d{1,4}%/i.test(outText) && !act.sound) {
      say(n, "warning", "That sound number is past the game's sounds: no sound plays.");
    }
    // hiding and layers
    if (hides) {
      if (!/\bGROUND\b/.test(cond)) {
        say(n, "warning", "This hides the item everywhere BH names it: your inventory, stash and shops too. Add GROUND " +
          "!TOWN to hide it only on the ground outside town.");
      } else if (!/!TOWN\b/.test(cond0) && !/!\s*TOWN\b/.test(cond0)) {
        say(n, "info", "This hides the item on the ground in town too (towns and the guild halls). Erazure adds !TOWN " +
          "to every hide.");
      }
    }
    if (act.cont && !act.text.length) {
      say(n, "warning", "A %CONTINUE% rule with no text empties the name for every later rule (Erazure's too): " +
        "write %NAME% to keep it.");
    } else if (act.cont && act.name.every((p) => typeof p === "string" || p.k !== "NAME") &&
               act.name.some((p) => typeof p !== "string" || p.replace(/ÿc./g, "").trim())) {
      say(n, "info", "This %CONTINUE% rule's text has no %NAME%: every later rule (Erazure's too) gets your text " +
        "instead of the item's name.");
    }
    if (out0.indexOf("{") < 0 && out0.trim()) {
      say(n, "info", "Without { } this rule empties the description earlier rules wrote. Write {%NAME%} to keep it.");
    }
    // sizes and letters
    const label = measure(act.name), desc = measure(act.desc);
    const max = SHOP_RE.test(cond) ? SHOP_MAX : NAME_MAX;
    if (!hides) {
      if (label.shown > max) {
        say(n, "warning", `This label has at least ${label.shown} letters${label.name ? " besides the item's name" : ""}: ` +
          `BH shows ${max} and cuts the rest (the top line's right end).`);
      } else if (label.name && label.shown + 14 > max) {
        say(n, "info", `With the item's name (often 14 letters or more) this label may pass BH's ${max} letters: ` +
          "BH cuts the top line's right end.");
      }
      if (label.raw > COPY_MAX) {
        say(n, "warning", `This label holds at least ${label.raw} characters with its color codes: BH hands the game ` +
          `${COPY_MAX} and cuts the rest.`);
      }
    }
    if (desc.raw > DESC_MAX) {
      say(n, "warning", `The description has at least ${desc.raw} characters: BH ends a long description with "..."`);
    }
    if (fs) {
      const missing = new Set(), preview = new Set();
      for (const [chars, set] of [[label.chars, fs.label], [desc.chars, fs.label]]) {
        for (const ch of chars) {
          const cp = ch.codePointAt(0);
          if (cp < 0x20) continue;
          if (!set.has(cp) && !fs.sym.has(cp)) missing.add(ch);
          else if (!fs.sheet.has(cp)) preview.add(ch);
        }
      }
      for (const ch of missing) say(n, "warning", `The game has no letter '${ch}': it draws ☹ instead.`, ch);
      for (const ch of preview) say(n, "info", `The preview can't draw '${ch}' (the game can).`, ch);
    }
  }

  /* {error, warning, info} counts. */
  function counts(findings) {
    const c = {error: 0, warning: 0, info: 0};
    for (const f of findings) c[f.level]++;
    return c;
  }

  return {lines, context, counts, andAfterOr, balanced, measure};
})();
