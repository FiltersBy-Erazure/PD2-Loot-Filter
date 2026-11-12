/* The engine's tests for tools/editor_selftest.py (its test page loads this after its own tests): EXPECT.engine holds
   hand-checked cases from BH's source, EXPECT.tiers tools/tier_map.py's outcomes for Erazure - Main. */
(function () {
  "use strict";
  const E = EZ.engine;
  const F0 = () => ({formulas: Object.create(null), statMax: 1023, skillMax: 1023, soundCount: 10000});
  const show = (x) => JSON.stringify(x);

  test("engine", () => {
    const bad = [];
    for (const [text, stats, c, want] of EXPECT.engine.formulas) {
      const node = E.compileFormula(text);
      let got;
      if (!node) got = null;
      else {
        const r = E.runFormula(node, {stats}, c, F0());
        got = r.err ? "f_err" : r.unknown ? "?" : E.formatNumber(r.v);
      }
      if (got !== want) bad.push(`formula ${text}: ${show(got)}, BH ${show(want)}`);
    }
    for (const [text, item, c, want] of EXPECT.engine.conditions) {
      const F = F0();
      // a condition's islands, as the rules' are compiled
      const lines = ["ItemDisplay[" + text + "]: x"];
      const comp = E.compile(lines, {});
      const it = Object.assign({quality: "NORM", id: true, stats: {}}, item);
      const got = E.match(comp.rules[0], it, c, comp);
      if (got !== want) bad.push(`condition ${text || "(empty)"}: ${got}, BH ${want}`);
      void F;
    }
    for (const [lines, item, c, opts, want] of EXPECT.engine.rules) {
      const comp = E.compile(lines, {});
      const it = Object.assign({stats: {}, place: "GROUND"}, item);
      const r = E.run(comp, it, c, opts);
      const got = {name: r.name, desc: r.desc, hidden: r.hidden, invisible: r.invisible, forced: r.forced,
                   sound: r.sound, chatRule: r.chatRule, cut: r.cut,
                   icons: r.icons.map((x) => [x.border, x.map, x.dot, x.px])};
      for (const k of Object.keys(want)) {
        if (show(got[k]) !== show(want[k])) bad.push(`rules ${show(lines)}: ${k} ${show(got[k])}, BH ${show(want[k])}`);
      }
    }
    return {fail: bad.length ? bad.join("\n  ") : null, formulas: EXPECT.engine.formulas.length,
            conditions: EXPECT.engine.conditions.length, rules: EXPECT.engine.rules.length};
  });

  test("sound", () => {
    const raw = atob(EXPECT.sound.clip), buf = new ArrayBuffer(raw.length), u8 = new Uint8Array(buf);
    for (let i = 0; i < raw.length; i++) u8[i] = raw.charCodeAt(i);
    const pcm = EZ.sound.decode(buf), want = EXPECT.sound.samples, bad = [];
    if (pcm.rate !== 22050) bad.push("rate " + pcm.rate);
    if (pcm.samples.length !== want.length) bad.push(`${pcm.samples.length} samples, want ${want.length}`);
    for (let i = 0; i < want.length && bad.length < 5; i++) {
      if (Math.round(pcm.samples[i] * 32768) !== want[i]) bad.push(`sample ${i}: ${Math.round(pcm.samples[i] * 32768)}, want ${want[i]}`);
    }
    return {fail: bad.length ? bad.join("; ") : null, samples: want.length, codecMaxError: EXPECT.sound.maxError};
  });

  test("paste", () => {
    EZ.items.init({catalog: EXPECT.catalog});
    const bad = [];
    for (const [json, want, stats, notes] of EXPECT.paste) {
      let r;
      try { r = EZ.items.fromGame(JSON.stringify(json)); } catch (e) { bad.push(`${json.type}: ${e.message}`); continue; }
      for (const k of Object.keys(want)) {
        if (show(r.spec[k]) !== show(want[k])) bad.push(`${json.type}: ${k} ${show(r.spec[k])}, want ${show(want[k])}`);
      }
      const it = EZ.items.make(r.spec);
      for (const k of Object.keys(stats)) {
        if (it.stats[k] !== stats[k]) bad.push(`${json.type}: stat ${k} ${it.stats[k]}, want ${stats[k]}`);
      }
      if (r.notes.length !== notes) bad.push(`${json.type}: ${r.notes.length} notes (${r.notes.join("; ")}), want ${notes}`);
    }
    return {fail: bad.length ? bad.join("\n  ") : null, items: EXPECT.paste.length};
  });

  /* A label's lines top first as [[color, text]] (tier_map.label's form: color names, the game's color first). */
  const NAMES = {"0": "WHITE", "1": "RED", "2": "GREEN", "3": "BLUE", "4": "GOLD", "5": "GRAY", "\x02": "BLACK",
    "7": "TAN", "8": "ORANGE", "9": "YELLOW", ";": "PURPLE", ":": "DARK_GREEN", "\x06": "CORAL", "\x07": "SAGE",
    "\x09": "TEAL", "\x0C": "LIGHT_GRAY"};
  function labelLines(name, start) {
    let color = NAMES[start] || "WHITE";
    const lines = name.split("\n").map((part) => {
      const segs = [];
      let buf = "";
      for (let i = 0; i < part.length; i++) {
        if (part[i] === "ÿ" && part[i + 1] === "c" && i + 2 < part.length) {
          if (buf) segs.push([color, buf]);
          buf = "";
          color = NAMES[part[i + 2]] || ("?" + part.charCodeAt(i + 2));
          i += 2;
          continue;
        }
        buf += part[i];
      }
      if (buf) segs.push([color, buf]);
      return segs;
    });
    return lines.reverse();
  }
  function merged(lines) {  // adjacent pieces of one color joined, empty pieces left out
    return lines.map((segs) => {
      const out = [];
      for (const [c, t] of segs) {
        if (!t) continue;
        if (out.length && out[out.length - 1][0] === c) out[out.length - 1][1] += t; else out.push([c, t]);
      }
      return out;
    });
  }

  test("tiers", () => {
    if (!EXPECT.tiers) return {skipped: "no tier cases"};
    EZ.items.init({catalog: EXPECT.catalog});
    const main = src.variants.find((v) => v.name === src.main);
    const t0 = performance.now();
    const F = E.compile(C.variantLines(src, main), {statMax: EXPECT.catalog.statMax, skillMax: EXPECT.catalog.skillMax,
                                                    soundCount: EXPECT.soundCount});
    const compileMs = Math.round(performance.now() - t0);
    const cls = {AMAZON: 0, SORCERESS: 1, NECROMANCER: 2, PALADIN: 3, BARBARIAN: 4, DRUID: 5, ASSASSIN: 6};
    const kinds = {}, examples = {}, seen = {labels: 0, icons: 0, sounds: 0, chats: 0, hidden: 0};
    let n = 0;
    const t1 = performance.now();
    for (const [kind, code, eth, klass, clvl, loc, grail, level, chat, sound, icons, label, look] of EXPECT.tiers) {
      const base = EZ.items.base(code);
      const it = {code, base, quality: kind, id: false, eth: !!eth, rw: false, socketed: 0, place: "GROUND",
                  disc: {ALLDISCOVERED: grail === "found", ANYDISCOVERED: grail === "found"},
                  gameName: base.name};
      const c = {filtlvl: level, clvl, cls: klass === null ? undefined : cls[klass],
                 mapid: loc === "field" ? 2 : loc === "town" ? 1 : loc};
      const r = E.run(F, it, c, {});
      n++;
      const diffs = [];
      if ((r.chatRule !== null) !== chat) diffs.push("chat");
      if (r.sound !== sound) diffs.push("sound");
      const want = icons.map((l) => l.map((x) => x === null ? null : parseInt(x, 16)));
      const have = r.icons.map((x) => [x.border, x.map, x.dot, x.px]);
      if (show(want) !== show(have)) diffs.push("icon");
      const hidden = !r.name.replace(/ÿc./g, "").trim();
      if ((look === "HIDDEN") !== hidden) diffs.push("hidden");
      else if (label && !hidden) {
        const mine = merged(labelLines(r.name, r.start)), theirs = merged(label);
        if (show(mine) !== show(theirs)) diffs.push("label");
        seen.labels++;
      }
      seen.icons += want.length ? 1 : 0;
      seen.sounds += sound ? 1 : 0;
      seen.chats += chat ? 1 : 0;
      seen.hidden += hidden ? 1 : 0;
      for (const d of diffs) {
        kinds[d] = (kinds[d] || 0) + 1;
        if (!examples[d]) examples[d] = [];
        if (examples[d].length < 6) {
          examples[d].push({code, kind, level, eth, clvl, loc, grail, klass, mine: {chat: r.chatRule, sound: r.sound,
            icons: have, name: r.name, trace: r.trace.slice(-6)},
            theirs: {chat, sound, icons: want, label, look}});
        }
      }
    }
    const ms = Math.round(performance.now() - t1);
    const fail = Object.keys(kinds).length ? Object.entries(kinds).map(([k, v]) => `${v} ${k}`).join(", ") : null;
    return {fail, cases: n, compared: show(seen), compileMs, runMsPerCase: +(ms / Math.max(1, n)).toFixed(3),
            examples: fail ? examples : undefined};
  });

  test("lint", () => {
    EZ.items.init({catalog: EXPECT.catalog});
    if (EZ.glyphs && EXPECT.assets) EZ.glyphs.init(EXPECT.assets, "");
    const bad = [];
    const main = src.variants.find((v) => v.name === src.main);
    const mainLines = C.variantLines(src, main);
    for (const [line, block, want] of EXPECT.lint) {
      const ctx = Object.assign(EZ.lint.context(src, mainLines, {top: block === "top" ? [line] : [],
        bottom: block === "bottom" ? [line] : []}, {soundCount: EXPECT.soundCount}), {block});
      const got = EZ.lint.lines([line], ctx);
      const says = got.map((f) => f.level + ": " + f.text).join(" | ");
      for (const [level, words] of want) {
        if (!got.some((f) => f.level === level && f.text.indexOf(words) >= 0)) {
          bad.push(`${line}: no ${level} saying "${words}" (it says: ${says || "nothing"})`);
        }
      }
      for (const f of got) {
        if (f.level !== "info" && !want.some(([level, words]) => level === f.level && f.text.indexOf(words) >= 0)) {
          bad.push(`${line}: an unexpected ${f.level}: ${f.text}`);
        }
      }
    }
    // every rule of Erazure's versions as a player's line: none may be an error
    const kinds = {};
    let rules = 0;
    const t0 = performance.now();
    for (const name of [src.main, "Minimal", "Corrlorized - Main - PoE"]) {
      const v = src.variants.find((x) => x.name === name);
      if (!v) { bad.push(`no version ${name}`); continue; }
      const lines = C.variantLines(src, v);
      const ctx = Object.assign(EZ.lint.context(src, lines, {top: [], bottom: []}, {soundCount: EXPECT.soundCount}),
                                {block: "erazure"});
      const list = lines.filter((l) => l.startsWith("ItemDisplay["));
      rules += list.length;
      for (const f of EZ.lint.lines(list, ctx)) {
        if (f.level === "error") {
          if (bad.length < 25) bad.push(`${name}: ${list[f.line].slice(0, 160)}: ${f.text}`);
        } else if (f.level === "warning") {
          const k = f.text.slice(0, 48);
          kinds[k] = (kinds[k] || 0) + 1;
        }
      }
    }
    return {fail: bad.length ? bad.join("\n  ") : null, cases: EXPECT.lint.length, erazureRules: rules,
            ms: Math.round(performance.now() - t0), erazureWarnings: show(kinds)};
  });

  /* Item overrides do what they say for the items they name, and change nothing for the others (tools/editor/
     overrides.js): each built into Erazure - Main and run by the engine beside Erazure's own. */
  test("items", () => {
    EZ.items.init({catalog: EXPECT.catalog});
    const main = src.variants.find((v) => v.name === src.main);
    const lines = C.variantLines(src, main);
    const opts = {statMax: EXPECT.catalog.statMax, skillMax: EXPECT.catalog.skillMax, soundCount: EXPECT.soundCount};
    const base = E.compile(lines, opts);
    const bad = [], t0 = performance.now();
    const ground = (filtlvl, mapid) => ({filtlvl, clvl: 90, cls: 1, diff: 2, mapid: mapid || 2, charstats: {12: 90}});
    const make = (spec) => EZ.items.make(Object.assign({place: "GROUND"}, spec));
    const run = (F, spec, c) => E.run(F, make(spec), c, {});
    const boxes = (r) => r.icons.map((x) => [x.border, x.map, x.dot, x.px]);
    const same = (a, b) => show([a.name, boxes(a), a.sound, a.chat, a.invisible]) === show([b.name, boxes(b), b.sound, b.chat, b.invisible]);
    const built = (items) => {
      const p = EZ.store.normalize({name: "t", edits: {base: {style: "erazure"}, items}});
      const r = EZ.edits.apply(src, p, lines);
      return E.compile(r.lines, opts);
    };
    const levels = [0, 1, 5, 9, 12];
    // an item Erazure hides at level 12 on the ground, and one it shows without any alert at level 1
    const hiddenCode = ["gcr", "gcv", "gcb", "gcg", "gcw", "gcy", "skc", "isc", "tsc", "hp1", "mp1"].find((c) =>
      EZ.items.base(c) && run(base, {code: c}, ground(12)).hidden);
    const quietCode = ["tsc", "isc", "key", "hp2", "mp2", "yps", "vps", "wms"].find((c) => {
      if (!EZ.items.base(c)) return false;
      const r = run(base, {code: c}, ground(1));
      return !r.hidden && !r.icons.length && r.chatRule === null;
    });
    const cases = [
      ["hide Ber Rune on levels 8-12", [{action: "hide", scope: {codes: ["r30"], levels: [8, 9, 10, 11, 12]}}], (F) => {
        const r = run(F, {code: "r30"}, ground(9));
        if (!r.hidden || !r.invisible || r.icons.length || r.sound) return "not hidden at level 9: " + show([r.name, boxes(r), r.sound]);
        for (const [lv, mapid] of [[5, 2], [9, 1], [12, 1], [0, 2]]) {
          if (!same(run(F, {code: "r30"}, ground(lv, mapid)), run(base, {code: "r30"}, ground(lv, mapid)))) return `changed at level ${lv} (area ${mapid})`;
        }
        return same(run(F, {code: "r31"}, ground(9)), run(base, {code: "r31"}, ground(9))) ? null : "Jah Rune changed";
      }],
      ["show " + hiddenCode, [{action: "show", scope: {codes: [hiddenCode]}}], (F) => {
        const r = run(F, {code: hiddenCode}, ground(12));
        if (r.hidden) return "still hidden at level 12";
        return same(run(F, {code: "r30"}, ground(12)), run(base, {code: "r30"}, ground(12))) ? null : "Ber Rune changed";
      }],
      ["mute unique Shakos", [{action: "mute", scope: {codes: ["uap"], quality: "UNI"}}], (F) => {
        for (const lv of levels) {
          const a = run(F, {code: "uap", quality: "UNI"}, ground(lv)), b = run(base, {code: "uap", quality: "UNI"}, ground(lv));
          if (a.sound) return `a sound at level ${lv}`;
          if (a.name !== b.name || show(boxes(a)) !== show(boxes(b)) || (a.chat === null) !== (b.chat === null)) return `more than the sound changed at level ${lv}`;
        }
        return same(run(F, {code: "uap", quality: "SET"}, ground(1)), run(base, {code: "uap", quality: "SET"}, ground(1))) ? null : "a set Shako changed";
      }],
      ["another icon on unique Shakos", [{action: "icon", icon: "BORDER-0A", scope: {codes: ["uap"], quality: "UNI"}}], (F) => {
        const a = run(F, {code: "uap", quality: "UNI"}, ground(1)), b = run(base, {code: "uap", quality: "UNI"}, ground(1));
        if (!a.icons.length || a.icons.some((x) => show([x.border, x.map, x.dot, x.px]) !== show([10, null, null, null]))) return "icons " + show(boxes(a));
        return a.sound === b.sound && a.name === b.name ? null : "more than the icon changed";
      }],
      ["icon only for Ber Runes", [{action: "iconOnly", scope: {codes: ["r30"]}}], (F) => {
        const a = run(F, {code: "r30"}, ground(1)), b = run(base, {code: "r30"}, ground(1));
        if (a.chat !== null || a.sound) return "a chat line or sound at level 1";
        return show(boxes(a)) === show(boxes(b)) && a.name === b.name ? null : "the icon or label changed";
      }],
      ["replace the look of unidentified rare rings", [{action: "replace", text: "%RED%My ring",
        scope: {codes: ["rin"], quality: "RARE", id: "no"}}], (F) => {
        const a = run(F, {code: "rin", quality: "RARE"}, ground(1));
        if (a.name !== "ÿc1My ring") return "name " + show(a.name);
        return same(run(F, {code: "rin", quality: "MAG"}, ground(1)), run(base, {code: "rin", quality: "MAG"}, ground(1))) ? null : "magic rings changed";
      }],
      ["change the look of Ber Runes", [{action: "look", text: "%GOLD%B %NAME%", scope: {codes: ["r30"]}}], (F) => {
        const a = run(F, {code: "r30"}, ground(1)), b = run(base, {code: "r30"}, ground(1));
        if (!a.name.startsWith("ÿc4B ")) return "name " + show(a.name);
        return show(boxes(a)) === show(boxes(b)) && a.sound === b.sound ? null : "the alerts changed";
      }],
      ["hunt " + hiddenCode, [{action: "hunt", scope: {codes: [hiddenCode]}}], (F) => {
        for (const lv of [1, 12]) {
          const a = run(F, {code: hiddenCode}, ground(lv));
          if (a.hidden) return `hidden at level ${lv}`;
          if (a.name.indexOf(">>> ") < 0) return `no hunt look at level ${lv}: ${show(a.name)}`;
          if (a.sound !== 4728 || !a.icons.length || a.icons[0].border !== 0x9B) return `not its alert at level ${lv}: ` +
            show([boxes(a), a.sound]);
        }
        return same(run(F, {code: "r30"}, ground(12)), run(base, {code: "r30"}, ground(12))) ? null : "Ber Rune changed";
      }],
      ["an alert for " + quietCode + " where Erazure has none", [
        {action: "notify", alert: {icon: {MAP: "0A"}, sound: 4728}, scope: {codes: [quietCode]}},
        {action: "notify", alert: {icon: {MAP: "0A"}, sound: 4728}, scope: {codes: ["r30"]}}], (F) => {
        const a = run(F, {code: quietCode}, ground(1));
        if (!a.icons.some((x) => x.map === 10) || a.sound !== 4728) return "no alert: " + show([boxes(a), a.sound]);
        const r = run(F, {code: "r30"}, ground(1)), b = run(base, {code: "r30"}, ground(1));
        return r.sound === b.sound && r.chatRule !== null ? null : "Ber Rune's own alert changed";
      }],
    ];
    let n = 0;
    for (const [what, items, check] of cases) {
      if (what.indexOf("undefined") >= 0) { bad.push(what + ": no item to test it on"); continue; }
      let F;
      try { F = built(items); } catch (e) { bad.push(what + ": " + e.message); continue; }
      const why = check(F);
      n++;
      if (why) bad.push(what + ": " + why);
    }
    // all of them at once still builds, and a hidden item stays hidden where a wider show meets it
    try {
      const F = built(cases.flatMap((c) => c[1]).concat([{action: "show", scope: {codes: ["r30"]}}]));
      const r = run(F, {code: "r30"}, ground(9));
      if (!r.hidden) bad.push("together: the narrower hide of Ber Runes lost to the wider show");
    } catch (e) { bad.push("together: " + e.message); }
    return {fail: bad.length ? bad.join("\n  ") : null, cases: n, ms: Math.round(performance.now() - t0)};
  });

  /* Wishlists tag the identified items that have the stats, and only them (tools/editor/wishlists.js). */
  test("wishlists", () => {
    EZ.items.init({catalog: EXPECT.catalog});
    const main = src.variants.find((v) => v.name === src.main);
    const opts = {statMax: EXPECT.catalog.statMax, skillMax: EXPECT.catalog.skillMax, soundCount: EXPECT.soundCount};
    const w = {id: "w1", name: "Caster amulet", codes: ["amu"], quals: ["RARE", "CRAFT"],
               need: [{kind: "word", word: "FCR", op: "min", a: "10"}],
               pool: [{kind: "word", word: "LIFE", op: "min", a: "40"}, {kind: "word", word: "STR", op: "min", a: "15"},
                      {kind: "SKTOTAL", n: "54", op: "min", a: "2"}], n: "2", line: "Caster amulet", color: "GREEN",
               tag: "WL", alert: {icon: {MAP: "0A"}, sound: 4728}};
    const p = EZ.store.normalize({name: "t", edits: {base: {style: "erazure"}, wishlists: [w]}});
    const F = E.compile(EZ.edits.apply(src, p, C.variantLines(src, main)).lines, opts);
    const c = {filtlvl: 1, clvl: 90, cls: 1, diff: 2, mapid: 2, charstats: {12: 90}};
    const run = (quality, stats, id) => E.run(F, EZ.items.make({code: "amu", quality, id: id !== false, stats,
                                                                place: "GROUND"}), c, {});
    const tagged = (r) => r.desc.indexOf("Caster amulet") >= 0 && r.name.indexOf("WL") >= 0;
    const bad = [];
    const cases = [
      ["FCR 10, life 40, strength 15", "RARE", [[105, 0, 10], [7, 0, 40], [0, 0, 15]], true],
      ["FCR 10, life 40, +2 Teleport through all skills", "CRAFT", [[105, 0, 10], [7, 0, 40], [127, 0, 2]], true],
      ["FCR 10, +1 Teleport, +1 lightning skills", "RARE", [[105, 0, 10], [107, 54, 1], [188, 9, 1], [0, 0, 15]], true],
      ["FCR 10, life 40 only", "RARE", [[105, 0, 10], [7, 0, 40]], false],
      ["FCR 5, life 40, strength 15", "RARE", [[105, 0, 5], [7, 0, 40], [0, 0, 15]], false],
      ["magic, FCR 10, life 40, strength 15", "MAG", [[105, 0, 10], [7, 0, 40], [0, 0, 15]], false],
    ];
    for (const [what, q, stats, want] of cases) {
      const r = run(q, stats);
      if (tagged(r) !== want) bad.push(`${what}: ${want ? "not tagged" : "tagged"} (${show([r.name, r.desc])})`);
      if (want && (r.sound !== 4728 || !r.icons.some((x) => x.map === 10))) bad.push(`${what}: no alert`);
    }
    if (tagged(run("RARE", undefined, false))) bad.push("an unidentified amulet is tagged");
    return {fail: bad.length ? bad.join("\n  ") : null, cases: cases.length + 1};
  });

  /* The Changes area's line diff (tools/editor/diff.js): it rebuilds both sides, pairs only equal lines and is as
     short as a diff can be (the longest common subsequence's), on random short texts. */
  test("diff", () => {
    const bad = [];
    let seed = 7;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const lcs = (a, b) => {
      const dp = Array.from({length: a.length + 1}, () => new Array(b.length + 1).fill(0));
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
      return dp[a.length][b.length];
    };
    for (let t = 0; t < 400; t++) {
      const len = () => Math.floor(rnd() * 28);
      const a = Array.from({length: len()}, () => "abcd"[Math.floor(rnd() * 4)]);
      const b = t % 3 ? a.map((x) => rnd() < 0.2 ? "abcd"[Math.floor(rnd() * 4)] : x).filter(() => rnd() > 0.1)
        : Array.from({length: len()}, () => "abcd"[Math.floor(rnd() * 4)]);
      const e = EZ.diff.lines(a, b);
      const ra = e.filter((x) => x.kind !== "add").map((x) => a[x.a]);
      const rb = e.filter((x) => x.kind !== "del").map((x) => x.kind === "add" ? b[x.b] : b[x.b]);
      if (show(ra) !== show(a) || show(rb) !== show(b)) { bad.push(`${show(a)} -> ${show(b)}: doesn't rebuild`); continue; }
      if (e.some((x) => x.kind === "same" && a[x.a] !== b[x.b])) bad.push(`${show(a)} -> ${show(b)}: pairs unequal lines`);
      const n = e.filter((x) => x.kind !== "same").length;
      if (n !== a.length + b.length - 2 * lcs(a, b)) bad.push(`${show(a)} -> ${show(b)}: ${n} edits, the shortest has ` +
        (a.length + b.length - 2 * lcs(a, b)));
      if (bad.length > 5) break;
    }
    return {fail: bad.length ? bad.join("\n  ") : null, cases: 400};
  });

  test("rules", () => {
    EZ.items.init({catalog: EXPECT.catalog});
    const bad = [];
    const main = src.variants.find((v) => v.name === src.main);
    const aliases = C.bhAliases(C.bhEntries(C.variantLines(src, main)));
    for (const [spec, want] of EXPECT.build) {
      const r = EZ.rules.build(spec);
      if (r.line !== want) bad.push(`${show(spec)}: ${r.line}, want ${want}`);
      const cond = C.substitute([[r.cond], [""]], aliases)[0][0];
      const a = EZ.engine.analyze(cond);
      if (a.dropped.length || a.never) {
        bad.push(`${r.line}: BH drops ${a.dropped.map((d) => d.token).join(", ")}${a.never ? " (it never matches)" : ""}`);
      }
    }
    for (const [cond, want] of EXPECT.words) {
      const got = EZ.words.cond(cond, {levels: 12});
      if (got !== want) bad.push(`words ${cond || "(empty)"}: ${got}, want ${want}`);
    }
    // the blocks go in between their markers, and the preview finds a rule's line in them
    const p = EZ.store.normalize({name: "t", edits: {base: {style: "erazure"}, rules: {top: "// note\nItemDisplay[r30]:%NAME%{%NAME%}\n\n", bottom: " \n// only a note\n"}}});
    const built = EZ.edits.apply(src, p, C.variantLines(src, main));
    const at = built.lines.indexOf("ItemDisplay[r30]:%NAME%{%NAME%}");
    const where = EZ.rules.locate(built.lines, at);
    if (!where || where.block !== "top" || where.n !== 2) bad.push(`locate: ${show(where)}`);
    if (built.lines.indexOf(EZ.rules.MARKS.bottom[0]) >= 0) bad.push("a block of notes only went into the file");
    if (built.report.count !== 1) bad.push(`count ${built.report.count}, want 1`);
    return {fail: bad.length ? bad.join("\n  ") : null, cases: EXPECT.build.length};
  });
})();
