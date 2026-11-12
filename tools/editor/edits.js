/* The Filter Editor's edits: a profile's edit set applied to a version's lines (alias form), in a fixed order, each
   step a plain text change BH reads as the player meant. Every step finds its lines by what they say (section names,
   option labels, alias names, rule text), so the same edits apply to every new Erazure; a step that can't place an
   edit says so in the report instead of guessing.

   The order: changes to Erazure's own rules (EZ.ops) -> Erazure's options (050) -> features -> looks -> color remap
   -> sounds -> icons -> alert switches -> filter level names and copies -> (later steps: categories, items, the
   player's own rules...) -> the Cube's Custom mark. The header
   (the edit set itself, so a saved file can be imported again) is added by headerLines, after the aliases are
   written out. tools/editor_selftest.py checks every step against a Python version of it. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.edits = (function () {
  "use strict";
  const F = EZ.filter;

  const COLORS = ["WHITE", "RED", "GREEN", "BLUE", "GOLD", "GRAY", "BLACK", "TAN", "ORANGE", "YELLOW", "PURPLE",
                  "DARK_GREEN", "CORAL", "SAGE", "TEAL", "LIGHT_GRAY"];
  const COLOR_RE = new RegExp("%(" + COLORS.join("|") + ")%", "g");
  const ICON_ANY = /%(?:BORDER|MAP|DOT|PX)-[0-9a-f]{1,4}%/gi;
  const SOUND_ANY = /%SOUNDID-\d{1,4}%/gi;
  const TIER_ANY = /%TIER-\d%/gi;
  const FILTLVL_RE = /FILTLVL(=|<|>|~)(\d+)(?:-(\d+))?/g;
  const SITE = "https://filtersby-erazure.github.io/PD2-Loot-Filter/editor/";

  /* ---------------------------------------------------------------- helpers */

  /* Change every rule line's output (active and switched-off rules): fn(out, rule, i) -> new output. */
  function eachOutput(lines, fn) {
    for (let i = 0; i < lines.length; i++) {
      const r = F.rule(lines[i]);
      if (!r) continue;
      const out = fn(r.out, r, i);
      if (out !== r.out) lines[i] = r.head + out + r.comment;
    }
  }

  function setAlias(lines, name, value) {
    const re = new RegExp("^Alias\\[" + name + "\\]:");
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        lines[i] = "Alias[" + name + "]:" + value;
        return true;
      }
    }
    return false;
  }

  function featureDefault(f) { return f.on === undefined ? true : f.on; }

  /* ---------------------------------------------------------------- the steps */

  /* A hide line hides on the ground outside town only, as Erazure's own hide rules do: GROUND and !TOWN added where
     it has neither (2026-11-12, the author: every hide line the editor writes is for the ground outside town, so an
     item shows as always in town, the inventory and the stash; 050's options have no GROUND). */
  function groundOnly(line) {
    const r = F.rule(line);
    if (!r || /%CONTINUE%/i.test(r.out)) return line;
    const label = r.out.replace(/\{[^}]*\}?/, "")
      .replace(/%(?:(?:BORDER|MAP|DOT|PX|LINE|NOTIFY)-[0-9a-f]{1,4}|SOUNDID-\d{1,4}|TIER-\d)%/gi, "").trim();
    if (label) return line;
    const has = (w) => new RegExp("(^|[^A-Za-z0-9_])" + w + "($|[^A-Za-z0-9_])").test(r.cond);
    const add = (has("GROUND") ? "" : " GROUND") + (has("TOWN") ? "" : " !TOWN");
    if (!add) return line;
    return r.off + "ItemDisplay[" + (r.cond.trim() ? r.cond + add : add.trim()) + "]:" + r.out + r.comment;
  }

  function options(ctx) {
    const want = ctx.edits.options || {};
    const ids = Object.keys(want).filter((k) => want[k]);
    if (!ids.length) return;
    const groups = F.options(ctx.src, ctx.lines);
    const byId = new Map();
    for (const g of groups) for (const o of g.options) byId.set(o.id, o);
    const on = [];
    for (const id of ids) {
      const o = byId.get(id);
      if (!o) { ctx.unplaced("options", id, "Erazure no longer has this option"); continue; }
      for (const i of o.lines) {
        ctx.lines[i] = groundOnly(ctx.lines[i].replace(/^\s*\/\/+\s*/, ""));
        on.push(i);
      }
    }
    // an option's hide also takes away the minimap icon, chat line and sound of the items it hides, as an Items hide
    // does (the overrides step: EZ.overrides' "unalert"): of the items this line hides, not the ones an option line
    // above it decides first (higher in the list wins)
    on.sort((a, b) => a - b);
    const stops = on.map((i) => F.rule(ctx.lines[i])).map((r) => r && !/%CONTINUE%/i.test(r.out) ? r : null);
    ctx.optionHides = [];
    stops.forEach((r, k) => {
      if (!r) return;
      const label = r.out.replace(/\{[^}]*\}?/, "")
        .replace(/%(?:(?:BORDER|MAP|DOT|PX|LINE|NOTIFY)-[0-9a-f]{1,4}|SOUNDID-\d{1,4}|TIER-\d)%/gi, "").trim();
      if (label) return;
      ctx.optionHides.push({cond: r.cond.trim(), above: stops.slice(0, k).filter(Boolean).map((x) => x.cond.trim())});
    });
  }

  function features(ctx) {
    const want = ctx.edits.features || {};
    for (const f of EZ.features) {
      if (!(f.id in want) || !!want[f.id] === featureDefault(f)) continue;
      const on = !!want[f.id];
      if (f.sections && !on) {
        const secs = F.sections(ctx.src, ctx.lines);
        for (const name of f.sections) {
          const range = secs[name];
          if (!range) { ctx.unplaced("options", f.title, `Erazure no longer has ${name}`); continue; }
          for (let i = range[0]; i < range[1]; i++) {
            const line = ctx.lines[i];
            if (!line.startsWith("ItemDisplay[")) continue;
            const r = F.rule(line);
            if (r && F.continues(r.out) && !F.notifies(r.out) && (!f.descOnly || descOnly(r.out))) {
              ctx.lines[i] = "//" + line;
            }
          }
        }
      } else if (f.aliases && !on) {
        const names = Array.isArray(f.aliases) ? f.aliases
          : Object.keys(F.aliases(ctx.lines)).filter((n) => f.aliases.test(n));
        if (!names.length) ctx.unplaced("options", f.title, "Erazure no longer has these aliases");
        for (const n of names) if (!setAlias(ctx.lines, n, "FALSE")) ctx.unplaced("options", f.title, `no Alias[${n}]`);
      } else if (f.switchOn && on) {
        const range = F.sections(ctx.src, ctx.lines)[f.switchOn.section];
        if (!range) { ctx.unplaced("options", f.title, `Erazure no longer has ${f.switchOn.section}`); continue; }
        let n = 0;
        for (let i = range[0]; i < range[1]; i++) {
          const r = F.rule(ctx.lines[i]);
          if (r && r.off && ctx.lines[i].indexOf(f.switchOn.match) >= 0) {
            ctx.lines[i] = ctx.lines[i].replace(/^\s*\/\/+\s*/, "");
            n++;
          }
        }
        if (!n) ctx.unplaced("options", f.title, "Erazure no longer has these lines");
      }
    }
  }

  function looks(ctx) {
    const want = ctx.edits.looks || {};
    for (const name of Object.keys(want)) {
      if (typeof want[name] !== "string") continue;
      if (!setAlias(ctx.lines, name, slashes(want[name]))) ctx.unplaced("looks", name, "Erazure no longer has this look");
    }
  }

  /* BH ends a line at its first //: two slashes in a row in a look get the color in effect written between them
     (/%GOLD%/, as Erazure writes its own looks); with no color before them in the look, one slash stays. */
  const LOOK_COLOR_RE = /%(WHITE|RED|GREEN|BLUE|GOLD|GRAY|BLACK|TAN|ORANGE|YELLOW|PURPLE|DARK_GREEN|CORAL|SAGE|TEAL|LIGHT_GRAY)%/g;
  function slashes(v) {
    return String(v).replace(/\/{2,}/g, (run, at, all) => {
      const before = all.slice(0, at).match(LOOK_COLOR_RE);
      return before ? run.split("").join(before[before.length - 1]) : "/";
    });
  }

  /* A rule that writes description lines alone: its label is just %NAME%. */
  const descOnly = (out) => out.replace(/\{[^}]*\}?/, "").replace(/%CONTINUE%/g, "").trim() === "%NAME%";

  function remap(ctx) {
    const map = ctx.edits.remap || {};
    const keys = Object.keys(map).filter((k) => COLORS.indexOf(k) >= 0 && COLORS.indexOf(map[k]) >= 0 && map[k] !== k);
    if (!keys.length) return;
    const swap = (s) => s.replace(COLOR_RE, (m, c) => keys.indexOf(c) >= 0 ? "%" + map[c] + "%" : m);
    eachOutput(ctx.lines, (out) => swap(out));
    for (let i = 0; i < ctx.lines.length; i++) {
      const m = F.ALIAS_RE.exec(ctx.lines[i]);
      if (m && m[2].indexOf("%") >= 0 && !m[2].trimStart().startsWith("(")) {
        ctx.lines[i] = "Alias[" + m[1] + "]:" + swap(m[2]);
      }
    }
  }

  function sounds(ctx) {
    const map = ctx.edits.sounds || {}, all = ctx.edits.alerts && ctx.edits.alerts.noSounds;
    if (!all && !Object.keys(map).length) return;
    eachOutput(ctx.lines, (out) => out.replace(SOUND_ANY, (m) => {
      if (all) return "";
      const id = String(+m.slice(9, -1));
      if (!(id in map)) return m;
      const to = +map[id];
      return to > 0 ? "%SOUNDID-" + to + "%" : "";
    }));
  }

  /* An icon combination's keywords ("BORDER-91 MAP-9B" -> "%BORDER-91%%MAP-9B%"). */
  const keywords = (combo) => combo ? combo.split(" ").map((k) => "%" + k + "%").join("") : "";
  const SIZES = ["BORDER", "MAP", "DOT", "PX"];

  function resized(combo, how) {
    const parts = combo.split(" ").filter(Boolean).map((k) => k.split("-"));
    if (how === "smaller") {
      return parts.map(([l, c]) => [SIZES[SIZES.indexOf(l.toUpperCase()) + 1], c]).filter(([l]) => l)
        .map(([l, c]) => l + "-" + c).join(" ");
    }
    if (how === "bigger" && parts.length && !parts.some(([l]) => l.toUpperCase() === "BORDER")) {
      const outer = parts.find(([l]) => l.toUpperCase() === "MAP") || parts[0];
      return ["BORDER-" + outer[1], ...parts.map(([l, c]) => l + "-" + c)].join(" ");
    }
    return combo;
  }

  function icons(ctx) {
    const map = ctx.edits.icons || {}, a = ctx.edits.alerts || {};
    const size = a.iconSize === "smaller" || a.iconSize === "bigger" ? a.iconSize : null;
    if (!a.noIcons && !size && !Object.keys(map).length) return;
    eachOutput(ctx.lines, (out) => {
      const combo = F.icons(out);
      if (!combo) return out;
      let to = combo;
      if (a.noIcons) to = "";
      else {
        if (combo in map && typeof map[combo] === "string") to = map[combo];
        if (size) to = resized(to, size);
      }
      if (to === combo) return out;
      ICON_ANY.lastIndex = 0;
      const first = out.search(ICON_ANY);
      const rest = out.replace(ICON_ANY, "");
      return rest.slice(0, first) + keywords(to) + rest.slice(first);
    });
  }

  function alerts(ctx) {
    const a = ctx.edits.alerts || {};
    if (!a.iconsOnly) return;
    eachOutput(ctx.lines, (out) => {
      if (!F.notifies(out)) return out;
      TIER_ANY.lastIndex = 0;
      return TIER_ANY.test(out) ? out.replace(TIER_ANY, "%TIER-0%") : out + "%TIER-0%";
    });
  }

  /* The truth of one FILTLVL comparison at level L. */
  function compares(op, a, b, L) {
    if (op === "=") return L === a;
    if (op === "<") return L < a;
    if (op === ">") return L > a;
    return b === undefined ? L === a : L >= a && L <= b;
  }

  /* A condition's FILTLVL comparisons rewritten so that each copied level N behaves as level M (copies = [[N, M]]):
     at N the comparison is what it is at M; at every other level it is itself. */
  function copyLevels(cond, copies) {
    return cond.replace(FILTLVL_RE, (tok, op, x, y) => {
      const a = +x, b = y === undefined ? undefined : +y;
      const yes = [], no = [];
      for (const [N, M] of copies) {
        const atM = compares(op, a, b, M), atN = compares(op, a, b, N);
        if (atM && !atN) yes.push(N);
        else if (!atM && atN) no.push(N);
      }
      if (!yes.length && !no.length) return tok;
      let inner = tok;
      if (no.length) inner = "(" + no.map((n) => "!FILTLVL=" + n).join(" ") + " " + tok + ")";
      if (yes.length) inner = "(" + yes.map((n) => "FILTLVL=" + n).join(" OR ") + " OR " + inner + ")";
      return inner;
    });
  }

  function levels(ctx) {
    const lv = ctx.edits.levels || {};
    const names = lv.names || {}, copyMap = lv.copies || {};
    const found = F.levels(ctx.lines);
    for (const k of Object.keys(names)) {
      const n = +k, at = found[n - 1];
      if (!at || typeof names[k] !== "string") { ctx.unplaced("options", "Level " + k + " name", "no such level"); continue; }
      const line = ctx.lines[at.i];
      const colon = line.indexOf(":") + 1, c = line.indexOf("//", colon);
      ctx.lines[at.i] = line.slice(0, colon) + names[k].replace(/\/\//g, "/") + (c < 0 ? "" : line.slice(c));
    }
    const copies = Object.keys(copyMap).map((k) => [+k, +copyMap[k]])
      .filter(([N, M]) => N >= 1 && N <= found.length && M >= 1 && M <= found.length && N !== M);
    if (!copies.length) return;
    const out = [];
    for (let i = 0; i < ctx.lines.length; i++) {
      const line = ctx.lines[i];
      const m = F.ALIAS_RE.exec(line);
      if (m && m[2].indexOf("FILTLVL") >= 0) { out.push("Alias[" + m[1] + "]:" + copyLevels(m[2], copies)); continue; }
      const r = F.rule(line);
      if (!r || r.cond.indexOf("FILTLVL") < 0 && !F.TIER_RE.test(r.out)) { out.push(line); continue; }
      const cond = copyLevels(r.cond, copies);
      const tier = F.TIER_RE.exec(r.out);
      const rebuilt = (c, o) => r.off + "ItemDisplay[" + c + "]:" + o + r.comment;
      if (!tier) { out.push(rebuilt(cond, r.out)); continue; }
      /* %TIER-n%: chat and sound on levels 0-n. A copied level on the other side of n than its model gets a twin. */
      const n = +tier[1], on = [], off = [];
      for (const [N, M] of copies) {
        const atM = n >= M, atN = n >= N;
        if (atM && !atN) on.push(N);
        else if (!atM && atN) off.push(N);
      }
      if (!on.length && !off.length) { out.push(rebuilt(cond, r.out)); continue; }
      const these = on.concat(off).map((x) => "FILTLVL=" + x).join(" OR ");
      out.push(rebuilt(cond + " !(" + these + ")", r.out));
      if (on.length) {
        out.push(rebuilt(cond + " (" + on.map((x) => "FILTLVL=" + x).join(" OR ") + ")",
                         r.out.replace(F.TIER_RE, "")));
      }
      if (off.length) {
        out.push(rebuilt(cond + " (" + off.map((x) => "FILTLVL=" + x).join(" OR ") + ")",
                         r.out.replace(F.TIER_RE, "%TIER-0%")));
      }
    }
    ctx.lines = out;
  }

  /* The Cube's version line: "Season 14 - November 10th - v1 - Custom (12 changes)". */
  function mark(ctx, count) {
    if (!count) return;
    const v = ctx.src.version;
    for (let i = 0; i < ctx.lines.length; i++) {
      const line = ctx.lines[i];
      if (line.startsWith("ItemDisplay[box]") && line.indexOf(v) >= 0) {
        ctx.lines[i] = line.replace(v, `${v} - Custom (${count} change${count === 1 ? "" : "s"})`);
        return;
      }
    }
  }

  /* Steps other modules add, each (ctx) => void, in their order: below 0 before every other edit (changes to
     Erazure's own lines: EZ.ops), from 0 after levels (categories, items, the player's own rules...). */
  const later = [];
  function step(order, fn) { later.push({order, fn}); later.sort((a, b) => a.order - b.order); }

  /* ---------------------------------------------------------------- counting */

  /* The player's changes, by area: {area: n} (a pinned choice counts even where it equals Erazure's today). */
  const counters = {
    options: (e) => Object.keys(e.options || {}).filter((k) => e.options[k]).length +
      Object.keys((e.levels || {}).names || {}).length + Object.keys((e.levels || {}).copies || {}).length,
    features: (e) => EZ.features.filter((f) => e.features && f.id in e.features && !!e.features[f.id] !== featureDefault(f)).length,
    looks: (e) => Object.keys(e.looks || {}).length + Object.keys(e.remap || {}).length + Object.keys(e.icons || {}).length,
    alerts: (e) => Object.keys(e.sounds || {}).length +
      ["noSounds", "noIcons", "iconsOnly"].filter((k) => e.alerts && e.alerts[k]).length +
      (e.alerts && (e.alerts.iconSize === "smaller" || e.alerts.iconSize === "bigger") ? 1 : 0),
  };
  function countArea(area, e) { return counters[area] ? counters[area](e) : 0; }
  function count(e) { return Object.keys(counters).reduce((n, k) => n + counters[k](e), 0); }
  function counter(area, fn) { counters[area] = fn; }

  /* ---------------------------------------------------------------- applying */

  /* The version's lines with the profile's edits: {lines, report: {unplaced: [{area, what, why}], count}}. */
  function apply(src, profile, lines) {
    const ctx = {src, edits: profile.edits, lines: lines.slice(), report: {unplaced: [], count: 0}};
    ctx.unplaced = (area, what, why) => ctx.report.unplaced.push({area, what, why});
    for (const s of later) if (s.order < 0) s.fn(ctx);  // changes to Erazure's own lines, as the player saw them
    options(ctx);
    features(ctx);
    looks(ctx);
    remap(ctx);
    sounds(ctx);
    icons(ctx);
    alerts(ctx);
    levels(ctx);
    for (const s of later) if (s.order >= 0) s.fn(ctx);
    ctx.report.count = count(profile.edits);
    mark(ctx, ctx.report.count);
    return {lines: ctx.lines, report: ctx.report};
  }

  /* ---------------------------------------------------------------- the header */

  function b64url(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function unb64url(text) {
    const s = atob(text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4));
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }

  async function squeeze(bytes) {
    if (typeof CompressionStream === "undefined") return null;
    const cs = new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw")));
    return new Uint8Array(await cs.arrayBuffer());
  }

  async function unsqueeze(bytes, limit) {
    const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const reader = ds.getReader(), parts = [];
    let n = 0;
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      n += value.length;
      if (n > limit) throw new Error("too big");
      parts.push(value);
    }
    const out = new Uint8Array(n);
    let at = 0;
    for (const p of parts) { out.set(p, at); at += p.length; }
    return out;
  }

  /* The edit set as text: "z" + base64url(deflate-raw(JSON)) or "j" + base64url(JSON). */
  async function pack(payload) {
    const raw = new TextEncoder().encode(JSON.stringify(payload));
    const z = await squeeze(raw);
    return z && z.length < raw.length ? "z" + b64url(z) : "j" + b64url(raw);
  }

  async function unpack(text, limit) {
    limit = limit || 4 << 20;
    const kind = text[0], body = unb64url(text.slice(1));
    const raw = kind === "z" ? await unsqueeze(body, limit) : body;
    if (raw.length > limit) throw new Error("too big");
    return JSON.parse(new TextDecoder().decode(raw));
  }

  /* The comment lines that open a saved file: what it is, and the edit set (EDITS k/n), so importing it restores
     the edits. */
  async function headerLines(src, profile, variant, count) {
    const data = await pack({app: "erazure-filter-editor", v: EZ.store.SCHEMA, name: profile.name, file: profile.file,
                             edits: profile.edits});
    const chunks = [];
    for (let i = 0; i < data.length; i += 1000) chunks.push(data.slice(i, i + 1000));
    return [
      "// Made with the Erazure Filter Editor: " + SITE,
      `// ${variant.launcher} with ${count} change${count === 1 ? "" : "s"}, on Erazure ${src.version}. To change it or to`,
      "// bring it up to date, open the editor and import this file: your changes are in the EDITS lines below.",
      ...chunks.map((c, k) => `// EDITS ${k + 1}/${chunks.length} ${c}`),
      "",
    ];
  }

  /* The edit set of a saved file's text (its EDITS lines), or null. */
  async function fromFile(text) {
    const parts = [];
    const re = /^\/\/ EDITS (\d+)\/(\d+) (\S+)\s*$/gm;
    let m, total = 0;
    while ((m = re.exec(text))) { parts[+m[1] - 1] = m[3]; total = +m[2]; }
    if (!total || parts.length !== total || parts.some((p) => !p)) return null;
    const data = await unpack(parts.join(""));
    return data && data.app === "erazure-filter-editor" ? data : null;
  }

  return {apply, step, count, countArea, counter, headerLines, fromFile, pack, unpack, copyLevels, groundOnly, COLORS,
          featureDefault, resized, slashes, SITE};
})();
