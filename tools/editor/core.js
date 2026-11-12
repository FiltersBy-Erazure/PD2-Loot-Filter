/* The Filter Editor's core: builds any of the launcher's versions from Erazure-Filter-Editor-Source.js (written by
   tools/build.py) exactly as tools/build.py builds it, so that a version with no edits comes out byte for byte as the
   launcher's file. Ports of build.py's render (the toggle blocks), apply_style (Minimal's aliases), the Corrlorized
   patch (styles/corrlorized.edits as applied by style_edits.py, stored by build.py as the lines it replaced and
   inserted) and write_out_aliases / bh_entries / bh_aliases / bh_substitute (every alias but the three toggles written
   into the rules as BH writes them when it loads a filter).

   Loaded by the page (the generator puts every module of tools/editor/ into one script) and by tools/editor_selftest.py
   (a test page in headless Chromium). No DOM here. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.core = (function () {
  "use strict";

  const ALIAS_DEF_RE = /^Alias\[([A-Za-z0-9_]+)\]:/;
  const SWITCHED_OFF_RULE = /^([ \t]*\/\/+[ \t]*)(ItemDisplay\[.*)$/;
  const RULE_KEY = "ItemDisplay[";

  /* BH's Trim (Config.cpp), as build.py's bh_trim: spaces off both ends, then tabs. */
  function bhTrim(s) {
    let a = 0, b = s.length;
    while (a < b && s.charCodeAt(a) === 32) a++;
    while (b > a && s.charCodeAt(b - 1) === 32) b--;
    if (a || b < s.length) s = s.slice(a, b);
    a = 0; b = s.length;
    while (a < b && s.charCodeAt(a) === 9) a++;
    while (b > a && s.charCodeAt(b - 1) === 9) b--;
    return a || b < s.length ? s.slice(a, b) : s;
  }

  /* [{i, key, value}] of the lines BH's Config::Parse keeps: cut at the first //, key and value split at the first ':'
     and trimmed (build.py's bh_entries). */
  function bhEntries(lines, first) {
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const c = line.indexOf("//");
      const code = c < 0 ? line : line.slice(0, c);
      if (!code) continue;
      const j = code.indexOf(":");
      if (j < 0) {
        const t = bhTrim(code);
        out.push({i: i + (first || 0), key: t, value: t});
      } else {
        out.push({i: i + (first || 0), key: bhTrim(code.slice(0, j)), value: bhTrim(code.slice(j + 1))});
      }
    }
    return out;
  }

  /* [{i, name, value}] as InitializeItemRules has them: ReadMapList("Alias"), the name cut at a space. */
  function bhAliases(entries) {
    const out = [];
    for (const e of entries) {
      if (e.key.startsWith("Alias[")) {
        const name = bhTrim(e.key.slice(e.key.indexOf("[") + 1, e.key.length - 1)).split(" ")[0];
        out.push({i: e.i, name: name, value: e.value});
      }
    }
    return out;
  }

  /* ASCII upper case only, as BH's output key (build.py: chr(ord(c) - 32) for a-z). */
  function upperAscii(s) {
    return s.replace(/[a-z]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 32));
  }

  function replaceLeftmost(rule, key, value, name) {
    for (let n = 0; n < 10000; n++) {
      const p = rule.indexOf(key);
      if (p < 0) return rule;
      rule = rule.slice(0, p) + value + rule.slice(p + key.length);
    }
    throw new Error(`Alias[${name}] keeps finding its name in what it writes (the game would hang)`);
  }

  /* BH's alias loop over every rule (build.py's bh_substitute): texts = [conditions[], outputs[]], changed in place.
     For each alias in order: in conditions the name, in outputs %NAME% (ASCII upper case), every occurrence replaced,
     searching again from the start until none is left. As build.py: all at once, unless that leaves the key in some
     rule's text; then every rule goes BH's way, leftmost first.

     This loop tries every alias on every rule (about 8 million searches for a version: most of a second). So
     substitute() below takes each text on its own, only through the aliases its words can hold, and keeps what it
     wrote per alias table: after an edit only the lines it changed are new. That is the same result as long as no
     alias leaves its own key behind (then the rules aren't independent: every rule goes leftmost first); a text where
     one does sends the whole call here. */
  function substituteAll(texts, aliases) {
    for (const a of aliases) {
      if (!a.name) continue;
      const keys = [a.name, "%" + upperAscii(a.name) + "%"];
      for (let k = 0; k < 2; k++) {
        const key = keys[k], list = texts[k];
        let hit = null, again = false;
        for (let r = 0; r < list.length; r++) {
          const s = list[r];
          if (s.indexOf(key) < 0) continue;
          const n = s.split(key).join(a.value);
          if (n.indexOf(key) >= 0) again = true;
          (hit || (hit = [])).push(r, n);
        }
        if (!hit) continue;
        if (!again) {
          for (let h = 0; h < hit.length; h += 2) list[hit[h]] = hit[h + 1];
        } else {
          for (let r = 0; r < list.length; r++) {
            if (list[r].indexOf(key) >= 0) list[r] = replaceLeftmost(list[r], key, a.value, a.name);
          }
        }
      }
    }
    return texts;
  }

  /* An alias table as substitute() reads it, kept for the last few tables (a look edited makes a new one):
     keys[0] the names (conditions), keys[1] the %NAME% keys (outputs); the names by text, their lengths; the aliases
     whose names a word can't hold (odd: searched for in every text); per text what it became (null: it left an
     alias's key behind). A list of aliases is read once (callers pass the list bhAliases made and never change it):
     the item changes and lint call substitute() once per rule with the same list. */
  const WORD_NAME = /^[A-Za-z0-9_]+$/;
  const tables = new Map(), byList = new WeakMap();
  const TABLES_KEPT = 6;
  const keepRecent = (t) => {
    tables.delete(t.sig);
    tables.set(t.sig, t);  // the most recently used last
    while (tables.size > TABLES_KEPT) tables.delete(tables.keys().next().value);
    return t;
  };
  function tableOf(aliases) {
    let t = byList.get(aliases);
    if (t) return keepRecent(t);  // (the same string: its hash is kept)
    let sig = "";
    for (const a of aliases) sig += a.name + "\u0000" + a.value + "\u0001";
    t = tables.get(sig);
    if (t) {
      byList.set(aliases, t);
      return keepRecent(t);
    }
    t = {sig, aliases, keys: [[], []], names: new Map(), outNames: new Map(), lens: [], odd: [[], []], runs: new Map(),
         memo: [new Map(), new Map()]};
    const lens = new Set();
    aliases.forEach((a, k) => {
      if (!a.name) { t.keys[0].push(null); t.keys[1].push(null); return; }
      const up = upperAscii(a.name);
      t.keys[0].push(a.name);
      t.keys[1].push("%" + up + "%");
      if (WORD_NAME.test(a.name)) {
        if (!t.names.has(a.name)) t.names.set(a.name, []);
        t.names.get(a.name).push(k);
        lens.add(a.name.length);
      } else t.odd[0].push(k);
      if (up.indexOf("%") < 0) {
        if (!t.outNames.has(up)) t.outNames.set(up, []);
        t.outNames.get(up).push(k);
      } else t.odd[1].push(k);
    });
    t.lens = [...lens].sort((x, y) => x - y);
    byList.set(aliases, t);
    return keepRecent(t);
  }

  const isWordCode = (c) => (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95;

  /* The aliases whose key a text holds (some may be listed twice): in a condition a name lies inside one run of
     letters, digits and _, so each run is looked up (and kept) once; in an output %NAME% lies between two '%' in a
     row (a name has none). The odd ones are searched for. */
  function keysIn(t, s, k) {
    const out = [];
    if (k === 0) {
      for (let i = 0, n = s.length; i < n;) {
        while (i < n && !isWordCode(s.charCodeAt(i))) i++;
        let j = i;
        while (j < n && isWordCode(s.charCodeAt(j))) j++;
        if (j > i) {
          const run = s.slice(i, j);
          let c = t.runs.get(run);
          if (c === undefined) {
            c = [];
            for (let p = 0; p < run.length; p++) {
              for (const len of t.lens) {
                if (p + len > run.length) break;
                const ks = t.names.get(run.substr(p, len));
                if (ks) for (const x of ks) c.push(x);
              }
            }
            t.runs.set(run, c);
          }
          for (const x of c) out.push(x);
        }
        i = j;
      }
    } else {
      for (let p = s.indexOf("%"); p >= 0;) {
        const q = s.indexOf("%", p + 1);
        if (q < 0) break;
        const ks = t.outNames.get(s.slice(p + 1, q));
        if (ks) for (const x of ks) out.push(x);
        p = q;
      }
    }
    for (const x of t.odd[k]) if (s.indexOf(t.keys[k][x]) >= 0) out.push(x);
    return out;
  }

  /* One text through the alias loop on its own: the aliases it holds, in order, each all at once; null when one
     leaves its key behind. */
  function oneText(t, s, k) {
    let last = -1;
    for (;;) {
      let next = Infinity;
      for (const x of keysIn(t, s, k)) if (x > last && x < next) next = x;
      if (next === Infinity) return s;
      const key = t.keys[k][next];
      const n = s.split(key).join(t.aliases[next].value);
      if (n.indexOf(key) >= 0) return null;
      s = n;
      last = next;
    }
  }

  function substitute(texts, aliases) {
    const t = tableOf(aliases);
    const done = [];
    for (let k = 0; k < 2; k++) {
      const list = texts[k], memo = t.memo[k], out = new Array(list.length);
      for (let r = 0; r < list.length; r++) {
        let n = memo.get(list[r]);
        if (n === undefined) {
          n = oneText(t, list[r], k);
          memo.set(list[r], n);
        }
        if (n === null) return substituteAll(texts, aliases);
        out[r] = n;
      }
      done.push(out);
    }
    for (let k = 0; k < 2; k++) for (let r = 0; r < done[k].length; r++) texts[k][r] = done[k][r];
    return texts;
  }

  /* The rules of a filter's lines, each {i, prefix, text, cond, out}: the active ItemDisplay entries and every
     switched-off one (//ItemDisplay[...], the options of 050, Corr's x entries), by line. */
  function ruleEntries(lines, entries) {
    const rules = [];
    for (const e of entries) {
      if (e.key.startsWith(RULE_KEY)) {
        rules.push({i: e.i, prefix: "", text: lines[e.i], cond: e.key.slice(RULE_KEY.length, e.key.length - 1),
                    out: e.value});
      }
    }
    for (let i = 0; i < lines.length; i++) {
      const m = SWITCHED_OFF_RULE.exec(lines[i]);
      if (!m) continue;
      for (const e of bhEntries([m[2]])) {
        if (e.key.startsWith(RULE_KEY)) {
          rules.push({i: i, prefix: m[1], text: m[2], cond: e.key.slice(RULE_KEY.length, e.key.length - 1),
                      out: e.value});
        }
      }
    }
    rules.sort((x, y) => x.i - y.i);
    return rules;
  }

  function leadingBlank(s) {
    let n = 0;
    while (n < s.length && (s.charCodeAt(n) === 32 || s.charCodeAt(n) === 9)) n++;
    return s.slice(0, n);
  }

  function trailingBlank(s) {
    let n = s.length;
    while (n > 0 && (s.charCodeAt(n - 1) === 32 || s.charCodeAt(n - 1) === 9)) n--;
    return s.slice(n);
  }

  /* The lines with every alias but `keep` written into the rules, the switched-off ones too, and each definition
     turned into a comment (build.py's write_out_aliases, without its --check verification, which
     tools/editor_selftest.py does for the page). Throws where an alias writes ':' or '//' into a rule. */
  function writeOut(lines, keep, prefix) {
    lines = lines.slice();
    const entries = bhEntries(lines);
    const gone = bhAliases(entries).filter((a) => !keep.has(a.name));
    const rules = ruleEntries(lines, entries);
    const texts = substitute([rules.map((r) => r.cond), rules.map((r) => r.out)], gone);
    for (let n = 0; n < rules.length; n++) {
      const r = rules[n], cond = texts[0][n], out = texts[1][n];
      if (cond === r.cond && out === r.out) continue;
      if (cond.indexOf(":") >= 0 || cond.indexOf("//") >= 0 || out.indexOf("//") >= 0) {
        const err = new Error("an alias writes ':' or '//' into a rule; the game would read the line differently");
        err.line = r.i;
        throw err;
      }
      const c = r.text.indexOf("//");
      const comment = c < 0 ? "" : r.text.slice(c);
      const code = c < 0 ? r.text : r.text.slice(0, c);
      const j = code.indexOf(":");
      const lead = leadingBlank(code);
      const space = leadingBlank(code.slice(j + 1));
      const tail = out ? trailingBlank(code) : "";
      lines[r.i] = `${r.prefix}${lead}${RULE_KEY}${cond}]:${space}${out}${tail}${comment}`;
    }
    for (const a of gone) lines[a.i] = prefix + lines[a.i];
    return lines;
  }

  /* The filter's lines with only `active`'s toggle block switched on (build.py's render): toggles =
     {block name: [[line index, its Alias line without // or trailing blanks], ...]}. */
  function render(lines, toggles, active) {
    const out = lines.slice();
    for (const name of Object.keys(toggles)) {
      for (const [i, body] of toggles[name]) out[i] = name === active ? body : "//" + body;
    }
    return out;
  }

  /* A style file's aliases ({name: its line}) in place of the same aliases' lines (build.py's apply_style). */
  function applyStyleLines(lines, style) {
    const out = lines.slice();
    for (let i = 0; i < out.length; i++) {
      const m = ALIAS_DEF_RE.exec(out[i]);
      if (m && Object.prototype.hasOwnProperty.call(style, m[1])) out[i] = style[m[1]];
    }
    return out;
  }

  /* A style edits file as build.py stores it: {replaced: {line index: its line}, inserted: [[after line index,
     line], ...]} (style_edits.apply's output by its origin). */
  function applyPatch(lines, patch) {
    const after = new Map();
    for (const [i, line] of patch.inserted) {
      if (!after.has(i)) after.set(i, []);
      after.get(i).push(line);
    }
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      out.push(Object.prototype.hasOwnProperty.call(patch.replaced, i) ? patch.replaced[i] : lines[i]);
      const more = after.get(i);
      if (more) for (const line of more) out.push(line);
    }
    return out;
  }

  /* The alias-form lines of a version (one of src.variants), before any edit. */
  function variantLines(src, variant) {
    let lines = render(src.lines, src.toggles, variant.toggle);
    if (variant.style) {
      const style = src.styles[variant.style];
      lines = style.kind === "aliases" ? applyStyleLines(lines, style.lines) : applyPatch(lines, style.patch);
    }
    return lines;
  }

  /* The written file's lines (aliases written out when the source says the build writes them). */
  function written(src, lines) {
    return src.writeOut ? writeOut(lines, new Set(src.keep), src.writtenOut) : lines;
  }

  /* CRLF between lines (the last line is the empty one after the final line break), UTF-8 without BOM. */
  function encode(lines) {
    return new TextEncoder().encode(lines.join("\r\n"));
  }

  let crcTable = null;
  function crc32(bytes) {
    if (!crcTable) {
      crcTable = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        crcTable[n] = c >>> 0;
      }
    }
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  /* A launcher version's file as the build writes it: {lines, bytes}. */
  function buildVariant(src, variant) {
    const lines = written(src, variantLines(src, variant));
    return {lines: lines, bytes: encode(lines)};
  }

  return {bhTrim, bhEntries, bhAliases, substitute, substituteAll, ruleEntries, writeOut, render, applyStyleLines,
          applyPatch, variantLines, written, encode, crc32, buildVariant, ALIAS_DEF_RE, SWITCHED_OFF_RULE};
})();
