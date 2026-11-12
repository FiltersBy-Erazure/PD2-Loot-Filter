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
      // the scope's sockets, enhanced defense, item level and several qualities (non-magical)
      ["show non-magical non-eth Full Plate Mails with 0 or 3 sockets on level 12", [{action: "show",
        scope: {codes: ["ful"], quals: ["NMAG"], eth: "no", sockets: [0, 3], levels: [12]}}], (F) => {
        for (const [spec, want] of [[{code: "ful", sockets: 0}, true], [{code: "ful", sockets: 3}, true],
          [{code: "ful", quality: "SUP", sockets: 3, stats: [[16, 0, 12]]}, true], [{code: "ful", sockets: 1}, false],
          [{code: "ful", sockets: 3, eth: true}, false], [{code: "ful", quality: "MAG", sockets: 0}, "same"]]) {
          const a = run(F, spec, ground(12));
          if (want === "same") { if (!same(a, run(base, spec, ground(12)))) return "a magic one changed"; continue; }
          if (a.hidden === want) return show(spec) + (want ? " still hidden" : " shown");
        }
        return same(run(F, {code: "ful", sockets: 0}, ground(11)), run(base, {code: "ful", sockets: 0}, ground(11))) ?
          null : "level 11 changed";
      }],
      ["hide rare amulets below item level 90 on level 12", [{action: "hide",
        scope: {codes: ["amu"], quals: ["RARE"], ilvl: ["", "89"], levels: [12]}}], (F) => {
        const a = run(F, {code: "amu", quality: "RARE", ilvl: 80}, ground(12));
        if (!a.invisible || a.icons.length) return "item level 80: " + show([a.name, boxes(a)]);
        return same(run(F, {code: "amu", quality: "RARE", ilvl: 90}, ground(12)),
          run(base, {code: "amu", quality: "RARE", ilvl: 90}, ground(12))) ? null : "item level 90 changed";
      }],
      ["show superior Caps with 10%+ enhanced defense on level 12", [{action: "show",
        scope: {codes: ["cap"], quals: ["SUP"], ed: "10", levels: [12]}}], (F) => {
        if (run(F, {code: "cap", quality: "SUP", stats: [[16, 0, 12]]}, ground(12)).hidden) return "12% still hidden";
        return run(F, {code: "cap", quality: "SUP", stats: [[16, 0, 5]]}, ground(12)).hidden ? null : "5% shown";
      }],
      ["a narrower show wins over a wider hide of the player's", [
        {action: "hide", scope: {codes: ["bhm", "xh9", "uh9", "cap", "skp"], quals: ["RARE"], levels: [11]}},
        {action: "show", scope: {codes: ["bhm", "xh9", "uh9"], quals: ["RARE"], levels: [11]}}], (F) => {
        const a = run(F, {code: "bhm", quality: "RARE"}, ground(11)), b = run(F, {code: "cap", quality: "RARE"}, ground(11));
        if (a.hidden) return "the Bone Helm stays hidden";
        if (!b.hidden || b.icons.length) return "the Cap isn't hidden";
        return same(a, run(F, {code: "bhm", quality: "RARE"}, ground(5))) ? null : "the Bone Helm doesn't look as on level 5";
      }],
      ["show magic eth Glaives on level 12 as level 11 shows them", [{action: "show", look: "level", asLevel: 11,
        scope: {codes: ["glv", "9gl", "7gl"], quals: ["MAG"], eth: "yes", levels: [12]}}], (F) => {
        const spec = {code: "glv", quality: "MAG", eth: true};
        if (!same(run(F, spec, ground(12)), run(base, spec, ground(11)))) return "not as on level 11: " + show(run(F, spec, ground(12)).name);
        for (const lv of [0, 5, 10, 11]) if (!same(run(F, spec, ground(lv)), run(base, spec, ground(lv)))) return `level ${lv} changed`;
        return same(run(F, {code: "jav", quality: "MAG", eth: true}, ground(12)), run(base, {code: "jav", quality: "MAG",
          eth: true}, ground(12))) ? null : "a Javelin changed";
      }],
      ["show white Diadems with red dots, the name in its own color", [{action: "show", look: "own",
        text: "%RED%•  %NAME%  %RED%•", keepColor: true, scope: {codes: ["ci3"], quals: ["NMAG"], levels: [12]}}], (F) => {
        const a = run(F, {code: "ci3", sockets: 0}, ground(12)), b = run(F, {code: "ci3", sockets: 2}, ground(12));
        if (!/^ÿc1•  ÿc0/.test(a.name) || !/ÿc1•$/.test(a.name)) return "0 sockets: " + show(a.name);
        if (!/^ÿc1•  ÿc5/.test(b.name)) return "2 sockets: " + show(b.name);
        return same(run(F, {code: "ci3", sockets: 0}, ground(11)), run(base, {code: "ci3", sockets: 0}, ground(11))) ?
          null : "level 11 changed";
      }],
    ];
    // a rule of My rules made an item change: its hide takes Erazure's icon too
    {
      const line = "ItemDisplay[FILTLVL=12 amu RARE ILVL<90 GROUND !TOWN]:";
      const Fz = base, aliases = C.bhAliases(C.bhEntries(lines));
      const tr = EZ.overrides.treeOf(line.slice(12, line.indexOf("]:")), {aliases});
      const meets = tr ? EZ.overrides.alertsMeeting(tr.tree, tr.F, Fz, 3) : [];
      if (!meets.length) bad.push("My rules: no Erazure alert found for a hide of rare amulets on level 12");
      const r = EZ.overrides.fromRule(line, {aliases});
      if (r.why) bad.push("My rules to Items: " + r.why);
      else if (show((({codes, quals, levels, ilvl, extra}) => [codes, quals, levels, ilvl, extra])(r.list[0].scope)) !==
               show([["amu"], ["RARE"], [12], ["", "89"], ""])) bad.push("My rules to Items: its scope " + show(r.list[0].scope));
      if (!r.why) cases.push(["My rules' hide of rare amulets below 90, as an item change", r.list, (F) => {
        const a = run(F, {code: "amu", quality: "RARE", ilvl: 80}, ground(12));
        if (!a.invisible || a.icons.length) return "item level 80: " + show([a.name, boxes(a)]);
        return same(run(F, {code: "amu", quality: "RARE", ilvl: 95}, ground(12)), run(base, {code: "amu", quality: "RARE",
          ilvl: 95}, ground(12))) ? null : "item level 95 changed";
      }]);
      const s = EZ.overrides.fromRule("ItemDisplay[FILTLVL=12 ful NMAG !ETH (SOCK=0 OR SOCK=3)]:%RED%* %NAME%{%NAME%}%DOT-0A%", {aliases});
      if (s.why || s.list.length !== 2 || s.list[0].look !== "own" || s.list[1].action !== "notify") {
        bad.push("My rules to Items: a look with an icon became " + show(s.why || s.list.map((o) => o.action)));
      }
    }
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

  /* A player's own level 12 (2026-11-12): his 19 asks as item changes, each as he meant it, Erazure's own looks kept,
     a hide that takes the icon too, and levels 0-11 as Erazure's. */
  test("level12", () => {
    EZ.items.init({catalog: EXPECT.catalog});
    const main = src.variants.find((v) => v.name === src.main);
    const lines = C.variantLines(src, main);
    const opts = {statMax: EXPECT.catalog.statMax, skillMax: EXPECT.catalog.skillMax, soundCount: EXPECT.soundCount};
    const t0 = performance.now(), bad = [];
    const cat = EZ.items.catalog(), has = (c) => cat.bases.has(c);
    const group = (g, f) => [...cat.bases.values()].filter((b) => b.groups.indexOf(g) >= 0 && b.spawnable &&
      !b.quest && (!f || f(b))).map((b) => b.code);
    const THROW = group("THROWING", (b) => b.weapon && b.types.indexOf("tpot") < 0);
    const JAVS = ["glv", "jav", "ssp", "9s9", "9gl", "9ja", "7s7", "7gl", "7ja"];
    const BARB = ["ba4", "ba5", "ba9", "baa", "bae", "baf"], AJAV = ["am5", "ama", "amf"], BONE = ["bhm", "xh9", "uh9"];
    const HELMS = group("HELM", (b) => b.groups.indexOf("CLASS") < 0).filter((c) => BONE.indexOf(c) < 0);
    const PALS = group("DIN", (b) => b.armor).filter((c) => c !== "paf" && c !== "paa");
    if (THROW.length !== 30 || PALS.length !== 13 || HELMS.length !== 21) bad.push(`kinds: ${THROW.length} throwing ` +
      `weapons (30), ${PALS.length} paladin shields (13), ${HELMS.length} helms (21)`);
    const DOTS = {look: "own", text: "%RED%•  %NAME%  %RED%•", keepColor: true};
    let k = 0;
    const o = (action, codes, scope, more) => Object.assign({id: "p" + (k++), action, scope: Object.assign({codes,
      levels: [12]}, scope)}, more || {});
    const items = [
      o("show", ["ful"], {quals: ["NMAG"], eth: "no", sockets: [0, 3]}, DOTS),
      o("show", BONE, {quals: ["RARE"]}),
      o("show", BARB, {quals: ["NMAG"], sockets: [0, 3]}, DOTS),
      o("show", AJAV, {quals: ["NMAG"], sockets: [0]}, DOTS),
      o("show", AJAV, {quals: ["MAG", "RARE"]}),
      o("show", ["flb", "9fb", "7fb"], {quals: ["RARE"]}),
      o("show", ["ci3"], {quals: ["NMAG"], sockets: [0]}, DOTS),
      o("hide", ["gpb", "gpy", "gpv"], {}),
      o("show", ["cm2"], {quals: ["MAG"], ilvl: ["90", ""]}, {look: "level", asLevel: 10}),
      o("hide", ["cm1", "cm2", "cm3"], {quals: ["MAG"], ilvl: ["", "89"]}),
      o("show", BARB, {quals: ["MAG", "RARE"]}),
      o("show", JAVS, {quals: ["NMAG"], eth: "yes", sockets: [0]}, DOTS),
      o("show", JAVS, {quals: ["MAG"], eth: "yes"}),
      o("show", THROW, {quals: ["RARE"]}),
      o("show", HELMS, {quals: ["NMAG"], sockets: [0, 3], ed: "10"}, DOTS),
      o("show", BONE, {quals: ["NMAG"], sockets: [0, 3]}, DOTS),
      o("hide", PALS, {quals: ["NMAG"]}),
      o("hide", ["amu"], {quals: ["RARE"], ilvl: ["", "89"]}),
    ];
    const p = EZ.store.normalize({name: "t", edits: {base: {style: "erazure"}, items}});
    const F = E.compile(EZ.edits.apply(src, p, lines).lines, opts), F0 = E.compile(lines, opts);
    const ctx = (lv, cls) => ({filtlvl: lv, clvl: 90, cls: cls === undefined ? 1 : cls, diff: 2, mapid: 2, charstats: {12: 90}});
    const make = (spec) => EZ.items.make(Object.assign({place: "GROUND", ilvl: 85}, spec));
    const state = (r) => !r.hidden ? "show" : (r.icons.length || r.sound) ? "icon" : "hide";
    const ED = (armor, v) => [[armor ? 16 : 17, 0, v]], RES = (v) => [[39, 0, v], [41, 0, v], [43, 0, v], [45, 0, v]];
    const cases = [];
    const want = (what, spec, w, cls, dots) => cases.push({what, spec, w, cls, dots});
    for (const s of [0, 3]) want("ful " + s, {code: "ful", sockets: s}, "show", 1, true);
    for (const s of [1, 2, 4]) want("ful " + s, {code: "ful", sockets: s}, "hide");
    want("ful eth 3", {code: "ful", sockets: 3, eth: true}, "hide");
    for (const c of BONE) want("rare " + c, {code: c, quality: "RARE"}, "show");
    for (const c of ["cap", "skp", "uap", "usk"]) want("rare " + c, {code: c, quality: "RARE"}, "hide");
    for (const c of BARB) {
      for (const [s, eth] of [[0, false], [3, false], [0, true], [3, true]]) want(`${c} ${s}${eth ? " eth" : ""}`, {code: c, sockets: s, eth}, "show", 1, true);
      for (const q of ["MAG", "RARE"]) want(q + " " + c, {code: c, quality: q}, "show");
    }
    for (const c of AJAV) {
      want(c + " 0", {code: c, sockets: 0}, "show", 1, true);
      want(c + " 2", {code: c, sockets: 2}, "hide");
      for (const [q, cls] of [["MAG", 1], ["RARE", 1], ["MAG", 0]]) want(`${q} ${c} class ${cls}`, {code: c, quality: q}, "show", cls);
    }
    for (const c of ["flb", "9fb", "7fb"]) want("rare " + c, {code: c, quality: "RARE"}, "show");
    for (const c of ["ci0", "ci1", "ci2", "ci3"]) want("rare " + c, {code: c, quality: "RARE"}, "show");
    want("ci3 0", {code: "ci3", sockets: 0}, "show", 1, true);
    want("ci3 2", {code: "ci3", sockets: 2}, "hide");
    for (const c of ["skl", "gpw", "gpg", "skz", "gpr"].filter(has)) want(c, {code: c}, "show");
    for (const c of ["gpb", "gpy", "gpv", "glw", "glr", "gsw", "gfw", "sku"].filter(has)) want(c, {code: c}, "hide");
    for (const c of ["cm1", "cm2", "cm3"]) {
      want(c + " 85", {code: c, quality: "MAG", ilvl: 85}, "hide");
      want(c + " 91", {code: c, quality: "MAG", ilvl: 91}, "show");
    }
    for (const c of JAVS) {
      want(c + " eth 0", {code: c, eth: true, sockets: 0}, "show", 1, true);
      want(c + " eth 1", {code: c, eth: true, sockets: 1}, "hide");
      want("magic " + c + " eth", {code: c, quality: "MAG", eth: true}, "show");
    }
    for (const c of THROW) want("rare " + c, {code: c, quality: "RARE"}, "show");
    for (const c of ["aar", "ful", "gth", "fld", "xul", "xth", "xar", "uar", "uul", "utu", "uld", "xld"]) want("rare " + c, {code: c, quality: "RARE"}, "show");
    for (const c of HELMS) {
      want(c + " sup 0 12ed", {code: c, quality: "SUP", sockets: 0, stats: ED(true, 12)}, "show", 1, true);
      want(c + " sup eth 0 12ed", {code: c, quality: "SUP", eth: true, sockets: 0, stats: ED(true, 12)}, "show", 1, true);
      want(c + " sup 0 5ed", {code: c, quality: "SUP", sockets: 0, stats: ED(true, 5)}, "hide");
      want(c + " 0", {code: c, sockets: 0}, "hide");
      want(c + " sup 1 12ed", {code: c, quality: "SUP", sockets: 1, stats: ED(true, 12)}, "hide");
    }
    for (const c of ["usk", "ghm", "xhm", "uhm"].filter((x) => HELMS.indexOf(x) >= 0)) {
      want(c + " sup 3 12ed", {code: c, quality: "SUP", sockets: 3, stats: ED(true, 12)}, "show", 1, true);
    }
    for (const c of BONE) {
      want(c + " 0", {code: c, sockets: 0}, "show", 1, true);
      want(c + " 1", {code: c, sockets: 1}, "hide");
    }
    want("uh9 3", {code: "uh9", sockets: 3}, "show", 1, true);
    for (const [c, eth, s, r] of [["pa8", true, 4, 30], ["pa9", true, 0, 30], ["pad", false, 4, 35], ["pac", true, 4, 25],
      ["pab", true, 4, 25], ["pae", false, 4, 35]]) want(`${c} ${s} ${r}res`, {code: c, eth, sockets: s, stats: RES(r)}, "hide");
    for (const [c, eth] of [["paf", false], ["paa", true]]) want(`${c} as Erazure`, {code: c, eth, sockets: 4, stats: RES(35)}, "same");
    for (const [c, many] of [["7gd", 6], ["7fb", 5]]) {
      for (const s of [0, many]) want(`${c} sup ${s} 15ed`, {code: c, quality: "SUP", sockets: s, ilvl: 87, stats: ED(false, 15)}, "show");
      want(c + " 0", {code: c, sockets: 0, ilvl: 87}, "hide");
    }
    for (const [il, w] of [[80, "hide"], [89, "hide"], [90, "show"], [95, "show"]]) want("rare amu " + il, {code: "amu", quality: "RARE", ilvl: il}, w);
    let n = 0;
    for (const c of cases) {
      const it = make(c.spec);
      if (!it) { bad.push(c.what + ": no such item"); continue; }
      n++;
      const r = E.run(F, it, ctx(12, c.cls), {});
      if (c.w === "same") {
        const b = E.run(F0, it, ctx(12, c.cls), {});
        if (r.name !== b.name || state(r) !== state(b)) bad.push(c.what + ": not Erazure's");
      } else if (state(r) !== c.w) bad.push(`${c.what}: ${state(r)}, not ${c.w}`);
      else if (c.dots) {
        const col = it.quality === "MAG" ? "3" : E.gameColor(it);
        if (r.name.indexOf("ÿc1•  ÿc" + col) !== 0 || !/ÿc1•$/.test(r.name)) bad.push(c.what + ": no red dots " + JSON.stringify(r.name));
      }
      for (const lv of [1, 5, 8, 11]) {
        const a = E.run(F0, it, ctx(lv, c.cls), {}), b = E.run(F, it, ctx(lv, c.cls), {});
        if (a.name !== b.name || a.hidden !== b.hidden || a.icons.length !== b.icons.length || a.sound !== b.sound) {
          bad.push(`${c.what}: level ${lv} changed`);
          break;
        }
      }
    }
    // the Large Charm takes level 10's look
    const lc = E.run(F, make({code: "cm2", quality: "MAG", ilvl: 91}), ctx(12), {});
    const lc10 = E.run(F0, make({code: "cm2", quality: "MAG", ilvl: 91}), ctx(10), {});
    if (lc.name !== lc10.name) bad.push("Large Charm 91: " + JSON.stringify(lc.name) + ", level 10 " + JSON.stringify(lc10.name));
    return {fail: bad.length ? bad.slice(0, 20).join("\n  ") + (bad.length > 20 ? `\n  … ${bad.length - 20} more` : "") : null,
            items: items.length, cases: n, ms: Math.round(performance.now() - t0)};
  });

  /* Quick Edits' samples (EZ.overrides.sampleOf): an item for each of Erazure's options (050), drawn with the option
     as the game will draw it; the author's example, Show Rare Ethereal Druid Pelts, draws an ethereal Blood Spirit,
     and an option's hide line is for the ground outside town only. */
  test("quick", () => {
    EZ.items.init({catalog: EXPECT.catalog});
    const main = src.variants.find((v) => v.name === src.main);
    const lines = C.variantLines(src, main);
    const opts = {statMax: EXPECT.catalog.statMax, skillMax: EXPECT.catalog.skillMax, soundCount: EXPECT.soundCount};
    const aliases = C.bhAliases(C.bhEntries(lines));
    const t0 = performance.now(), bad = [], without = [];
    let n = 0;
    for (const g of EZ.filter.options(src, lines)) {
      for (const o of g.options) {
        const r = EZ.filter.rule(lines[o.lines[0]].replace(/^\s*\/\/+\s*/, ""));
        const s = r && EZ.overrides.sampleOf(r.cond, {aliases});
        if (s) n++; else without.push(o.id);
      }
    }
    if (without.length > 2) bad.push("options without a sample item: " + without.join("; "));
    const build = (options) => E.compile(EZ.edits.apply(src, EZ.store.normalize({name: "t", edits: {base: {style:
      "erazure"}, options}}), lines).lines, opts);
    const at = (F, spec, lv, place) => E.run(F, EZ.items.make(Object.assign({place: place || "GROUND"}, spec)),
      {filtlvl: lv, clvl: 90, cls: 1, diff: 2, mapid: 2, charstats: {12: 90}}, {});
    const pelts = EZ.filter.options(src, lines).find((g) => g.title === "Druid Pelts");
    const show = pelts && pelts.options.find((o) => /^Show Rare Ethereal/.test(o.label));
    const hide = pelts && pelts.options.find((o) => /^Hide Rare Non-Ethereal/.test(o.label));
    if (!show || !hide) bad.push("no Show Rare Ethereal / Hide Rare Non-Ethereal Druid Pelts option");
    else {
      const s = EZ.overrides.sampleOf(EZ.filter.rule(lines[show.lines[0]].replace(/^\s*\/\/+\s*/, "")).cond, {aliases});
      if (!s || s.spec.quality !== "RARE" || !s.spec.eth || EZ.items.base(s.spec.code).groups.indexOf("DRU") < 0) {
        bad.push("the sample of " + show.id + ": " + JSON.stringify(s));
      } else {
        const F0 = build({}), F1 = build({[show.id]: true}), F2 = build({[hide.id]: true});
        if (!at(F0, s.spec, 12).hidden) bad.push("Erazure shows a rare ethereal pelt on level 12 (the test expects it hidden)");
        if (at(F1, s.spec, 12).hidden) bad.push(show.id + " on: the rare ethereal pelt is still hidden on level 12");
        const plain = Object.assign({}, s.spec, {eth: false});
        const h1 = at(F2, plain, 1);
        if (!h1.hidden) bad.push(hide.id + " on: a rare non-ethereal pelt shows on level 1");
        if (at(F2, plain, 1, "INVENTORY").hidden) bad.push(hide.id + " on: it is hidden in the inventory too");
      }
    }
    // a hide takes the items' alerts away too (the author's audit, 2026-11-12: "hide" meant two things on one page)
    const quivers = EZ.filter.options(src, lines).find((g) => g.title === "Arrows and Bolts");
    const hideQ = quivers && quivers.options.find((o) => /^Hide rare quivers/i.test(o.label));
    if (!hideQ) bad.push("no Hide rare quivers option");
    else {
      const FQ = build({[hideQ.id]: true}), Fz = E.compile(lines, opts);
      const qs = EZ.overrides.sampleOf(EZ.filter.rule(lines[hideQ.lines[0]].replace(/^\s*\/\/+\s*/, "")).cond, {aliases});
      const q = qs.spec;
      const was = at(Fz, q, 1), now = at(FQ, q, 1), lv0 = at(FQ, q, 0);
      if (!was.icons.length) bad.push("Erazure gives a rare quiver no icon on level 1 (the test expects one)");
      if (!now.invisible || now.icons.length || now.sound) bad.push(hideQ.id + " on: a rare quiver keeps an alert");
      if (lv0.hidden || lv0.icons.length !== was.icons.length) bad.push(hideQ.id + " on: level 0 changed");
      if (at(FQ, q, 1, "INVENTORY").hidden) bad.push(hideQ.id + " on: a rare quiver is hidden in the inventory");
    }
    return {fail: bad.length ? bad.join("\n  ") : null, samples: n, without, ms: Math.round(performance.now() - t0)};
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
    // charms, jewels and quivers: Erazure ends them with a rule of its own before the highlight's line, which then
    // comes as a twin of that rule (the author's audit, 2026-11-12: the line never showed there)
    const kinds = [
      ["a magic Grand Charm, +1 lightning skills and 35 life", {codes: ["cm3"], quals: ["MAG"], need: [
        {kind: "TABSK", n: "9", op: "min", a: "1"}, {kind: "word", word: "LIFE", op: "min", a: "35"}]},
       {code: "cm3", quality: "MAG", stats: [[188, 9, 1], [7, 0, 35]]}, {code: "cm3", quality: "MAG", stats: [[7, 0, 35]]}],
      ["a rare jewel, 15 IAS", {codes: ["jew"], quals: ["RARE", "MAG"], need: [{kind: "word", word: "IAS", op: "min",
        a: "15"}]}, {code: "jew", quality: "RARE", stats: [[93, 0, 15], [0, 0, 9]]}, {code: "jew", quality: "RARE",
        stats: [[0, 0, 9]]}],
      ["a magic quiver, 5 dexterity", {groups: ["QUIVER"], quals: ["MAG", "RARE"], need: [{kind: "word", word: "DEX",
        op: "min", a: "5"}]}, {code: "aqv", quality: "MAG", stats: [[2, 0, 5]]}, {code: "aqv", quality: "MAG", stats: []}],
    ];
    for (const [what, wl, yes, no] of kinds) {
      const hw = Object.assign({id: "k", name: "Wanted", line: "Wanted one", color: "GREEN"}, wl);
      const pk = EZ.store.normalize({name: "t", edits: {base: {style: "erazure"}, wishlists: [hw]}});
      const Fk = E.compile(EZ.edits.apply(src, pk, C.variantLines(src, main)).lines, opts);
      // in the inventory: Erazure hides identified quivers with few useful stats on the ground
      const runK = (spec) => E.run(Fk, EZ.items.make(Object.assign({id: true, place: "INVENTORY"}, spec)), c, {});
      const a = runK(yes), b = runK(no);
      if (a.desc.indexOf("Wanted one") < 0) bad.push(`${what}: no highlight line (${show([a.name, a.desc])})`);
      if (b.desc.indexOf("Wanted one") >= 0) bad.push(`${what}: the line on one without the stats`);
    }
    return {fail: bad.length ? bad.join("\n  ") : null, cases: cases.length + 1 + kinds.length * 2};
  });

  /* How loud each kind of drop is (volume.js): a tier's sound lines (the %SOUNDID% line above its look) go with the
     tier, so "Sounds only for High value uniques and sets, and runes" keeps Griffon's Eye, Annihilus and Immortal
     King's sound and silences a Medium value unique's (the author's audit, 2026-11-12). */
  test("volume", () => {
    EZ.items.init({catalog: EXPECT.catalog});
    const main = src.variants.find((v) => v.name === src.main);
    const lines = C.variantLines(src, main);
    const opts = {statMax: EXPECT.catalog.statMax, skillMax: EXPECT.catalog.skillMax, soundCount: EXPECT.soundCount};
    const build = (volume) => E.compile(EZ.edits.apply(src, EZ.store.normalize({name: "t", edits: {base: {style:
      "erazure"}, volume}}), lines).lines, opts);
    const c = {filtlvl: 1, clvl: 90, cls: 1, diff: 2, mapid: 2, charstats: {12: 90}};
    const at = (F, spec) => E.run(F, EZ.items.make(Object.assign({place: "GROUND", id: false}, spec)), c, {});
    const griffon = {code: "ci3", quality: "UNI"}, anni = {code: "cm1", quality: "UNI"};
    const ik = {code: "uar", quality: "SET"}, medium = {code: "7xf", quality: "UNI"};
    const z = E.compile(lines, opts), bad = [];
    for (const [what, s] of [["Griffon's Eye", griffon], ["Annihilus", anni], ["Immortal King's Soul Cage", ik],
                             ["a Medium value unique (War Fist)", medium]]) {
      if (!at(z, s).sound) bad.push(`Erazure plays no sound for ${what} (the test expects one)`);
    }
    const fewer = build(EZ.volume.fewer(src, lines, {}));
    for (const [what, s] of [["Griffon's Eye", griffon], ["Annihilus", anni], ["Immortal King's Soul Cage", ik]]) {
      const r = at(fewer, s);
      if (!r.sound || !r.icons.length) bad.push(`Fewer sounds: ${what} lost its sound or icon`);
    }
    if (at(fewer, medium).sound) bad.push("Fewer sounds: a Medium value unique still plays its sound");
    if (at(build({"uni-high": "mute"}), griffon).sound) bad.push("High value uniques muted: Griffon's Eye still plays");
    if (!at(build({"uni-high": "mute"}), medium).sound) bad.push("High value uniques muted: a Medium one went quiet");
    if (at(build({"uni-medium": "mute"}), medium).sound) bad.push("Medium value uniques muted: War Fist still plays");
    // no alerts: the tier's own rules give none (a later rule's icon can still come: BH's alert pass goes on)
    const none = at(build({"set-high": "none"}), ik);
    if (none.sound || none.icons.some((x) => x.i === at(z, ik).icons[0].i)) {
      bad.push("High value sets with no alerts: IK keeps its sound or its tier's icon");
    }
    return {fail: bad.length ? bad.join("\n  ") : null, cases: 13};
  });

  /* Map warnings and hides (tools/editor/maps.js): a warning line on identified maps with the mod, a hide of
     identified maps with a mod or a low experience multiplier, nothing else changed. */
  test("maps", () => {
    EZ.items.init({catalog: EXPECT.catalog});
    EZ.maps.init({mapStats: EXPECT.mapStats});
    const main = src.variants.find((v) => v.name === src.main);
    const lines = C.variantLines(src, main);
    const opts = {statMax: EXPECT.catalog.statMax, skillMax: EXPECT.catalog.skillMax, soundCount: EXPECT.soundCount};
    const code = EZ.maps.codes(lines).xp[0];
    if (!code) return {fail: "no map with an experience multiplier"};
    const build = (maps) => E.compile(EZ.edits.apply(src, EZ.store.normalize({name: "t", edits: {base: {style: "erazure"},
      maps}}), lines).lines, opts);
    const at = (F, spec, mapid) => E.run(F, EZ.items.make(Object.assign({code, quality: "RARE", place: "GROUND"}, spec)),
      {filtlvl: 1, clvl: 90, cls: 1, diff: 2, mapid: mapid || 2, charstats: {12: 90}}, {});
    const bad = [];
    let F = build({warn: [442]});
    if (at(F, {id: true, stats: [[442, 0, 1111]]}).desc.indexOf("ÿc1! ") < 0) bad.push("no warning on a map with Ghosts");
    if (at(F, {id: true, stats: [[440, 0, 391]]}).desc.indexOf("ÿc1! ") >= 0) bad.push("a warning on a map without Ghosts");
    F = build({hide: [440]});
    if (!at(F, {id: true, stats: [[440, 0, 391]]}).invisible) bad.push("a map with Hell Bovines isn't hidden");
    if (at(F, {id: true, stats: [[442, 0, 1111]]}).hidden) bad.push("a map without Hell Bovines is hidden");
    if (at(F, {id: true, stats: [[440, 0, 391]]}, 1).hidden) bad.push("a map with Hell Bovines is hidden in town");
    // players' attack speed: one corruption lowers it, another raises it; a warning is for the lower, a mark for the
    // higher (and +1 area level, a corruption's, can be marked)
    if (!EZ.maps.mixed(451) || EZ.maps.mixed(374)) bad.push("players' attack speed isn't the one stat with two sides");
    F = build({warn: [451], mark: [374]});
    const lower = at(F, {id: true, stats: [[451, 0, -25]]}).desc, higher = at(F, {id: true, stats: [[451, 0, 30]]}).desc;
    if (lower.indexOf("ÿc1! ") < 0 || higher.indexOf("ÿc1! ") >= 0) bad.push("the warning on lower attack speed: " +
      JSON.stringify([lower, higher]));
    if (at(F, {id: true, stats: [[374, 0, 1]]}).desc.indexOf("+ Area Level") < 0) bad.push("no mark on +1 area level");
    F = build({mark: [451]});
    if (at(F, {id: true, stats: [[451, 0, 30]]}).desc.indexOf("+ Players have") < 0 ||
        at(F, {id: true, stats: [[451, 0, -25]]}).desc.indexOf("+ Players have") >= 0) bad.push("the mark on higher attack speed");
    // a map the player never picks up: its non-magical ones hidden on the ground outside town, on the levels picked
    const skip = EZ.maps.choices()[0].maps[0].code;
    F = build({hideMaps: [skip], hideMapsLevels: [11, 12]});
    const run = (spec, lv, mapid) => E.run(F, EZ.items.make(Object.assign({code: skip, place: "GROUND"}, spec)),
      {filtlvl: lv, clvl: 90, cls: 1, diff: 2, mapid: mapid || 2, charstats: {12: 90}}, {});
    const w12 = run({quality: "NORM"}, 12);
    if (!w12.invisible || w12.icons.length) bad.push("a non-magical " + skip + " isn't hidden on level 12");
    if (run({quality: "NORM"}, 12, 1).hidden) bad.push("a non-magical " + skip + " is hidden in town");
    if (run({quality: "NORM", place: "INVENTORY"}, 12).hidden) bad.push("a non-magical " + skip + " is hidden in the inventory");
    if (run({quality: "NORM"}, 9).hidden) bad.push("a non-magical " + skip + " is hidden on level 9");
    const base12 = E.run(E.compile(lines, opts), EZ.items.make({code: skip, quality: "MAG", place: "GROUND"}),
      {filtlvl: 12, clvl: 90, cls: 1, diff: 2, mapid: 2, charstats: {12: 90}}, {});
    if (run({quality: "MAG"}, 12).hidden !== base12.hidden) bad.push("a magic " + skip + " changed");
    if (EZ.maps.choices().some((t) => t.maps.some((x) => EZ.items.base(x.code).maptier !== t.tier)) ||
        EZ.maps.choices().reduce((n, t) => n + t.maps.length, 0) < 25) bad.push("the T1-T3 map list is off");
    return {fail: bad.length ? bad.join("\n  ") : null, map: code, hidden: skip, cases: 16};
  });

  /* The preview's Corruption field (tools/editor/items.js corruptionsFor, make): the outcomes the cube gives an item as
     it is (docs/pd2-corruptions.tsv, a map's docs/pd2-map-corruptions.tsv), named in the game's words, and the stats
     a picked one adds (identified only; an amulet's desecration a second outcome, stat 206). */
  test("corruption", () => {
    EZ.items.init({catalog: EXPECT.catalog});
    const I = EZ.items, bad = [];
    const names = (spec) => I.corruptionsFor(spec).map((o) => o.n + ": " + o.name);
    const has = (spec, want) => {
      const got = names(spec);
      if (got.indexOf(want) < 0) bad.push(`${JSON.stringify(spec)}: no "${want}" in ${JSON.stringify(got.slice(0, 6))}…`);
      return got;
    };
    if (has({code: "xvg", quality: "RARE"}, "33: +50-80% Enhanced Defense").length !== 24) bad.push("rare gloves: not 24");
    const white = has({code: "crs", quality: "NORM"}, "32: Sockets (up to 6)");
    if (white.length !== 1) bad.push("a white sword gets more than sockets: " + JSON.stringify(white));
    has({code: "t29", quality: "RARE"}, "85: +1 to Area Level, Monster Density: +20-25%");
    has({code: "t29", quality: "RARE"}, "87: Players have -3-4% to All Maximum Resistances, Monster Density: +40-50%, " +
      "Monster Rarity: +15-20%");
    has({code: "amu", quality: "RARE"}, "51: All Resistances +7-10");
    has({code: "uap", quality: "UNI", sockets: 1}, "50: +1 to All Skills");
    if (names({code: "cm1", quality: "MAG"}).length) bad.push("a charm has corruptions");
    const own = (spec) => I.make(spec).own;
    const g = own({code: "xvg", quality: "RARE", id: true, corrupt: 33});
    if (g["16"] !== 80 || g["360"] !== 33) bad.push("corrupted rare gloves (outcome 33): " + JSON.stringify(g));
    const u = own({code: "xvg", quality: "RARE", corrupt: 33});
    if (u["16"] !== undefined || u["360"] !== 33) bad.push("unidentified, its stats show: " + JSON.stringify(u));
    const a = own({code: "amu", quality: "RARE", id: true, corrupt: 50, desecrate: 51});
    if (a["127"] !== 1 || a["206"] !== 51 || a["39"] !== 10) bad.push("a corrupted, desecrated amulet: " + JSON.stringify(a));
    return {fail: bad.length ? bad.join("\n  ") : null, cases: 11};
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

  /* The alias loop the page runs (each text on its own, through the aliases its words can hold, kept per alias table)
     against BH's loop over every rule (substituteAll, build.py's bh_substitute): every version as the engine reads it,
     again from what it kept, after an edit and as the write-out reads it; then made-up tables whose values write
     keys, hold keys in keys and names a word can't hold, and the case where one rule decides how every rule goes. */
  test("substitute", () => {
    const bad = [];
    let cases = 0;
    const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
    // (all: BH's loop's result when the caller has it already: it takes most of a second on a version)
    const both = (texts, aliases, what, all) => {
      cases++;
      let fast = null, ef = null, ea = null;
      try { fast = C.substitute([texts[0].slice(), texts[1].slice()], aliases); } catch (e) { ef = String(e.message); }
      if (!all) {
        try { all = C.substituteAll([texts[0].slice(), texts[1].slice()], aliases); } catch (e) { ea = String(e.message); }
      }
      if (ef || ea) {
        if (ef !== ea) bad.push(`${what}: ${ef || "no error"}, BH's loop ${ea || "no error"}`);
        return null;
      }
      for (let k = 0; k < 2; k++) {
        if (same(fast[k], all[k])) continue;
        const i = fast[k].findIndex((x, j) => x !== all[k][j]);
        bad.push(`${what}, ${k ? "output" : "condition"} ${i}: ${show(fast[k][i])}, BH's loop ${show(all[k][i])}`);
      }
      return all;
    };
    // a few versions (the others' written files are compared byte for byte by "versions"): Main first
    const keep = new Set(src.keep);
    src.variants.filter((v, i) => i % 6 === 0).forEach((v, n) => {
      const lines = C.variantLines(src, v), entries = C.bhEntries(lines);
      const aliases = C.bhAliases(entries), rules = C.ruleEntries(lines, entries);
      const texts = [rules.map((r) => r.cond), rules.map((r) => r.out)];
      const all = both(texts, aliases, v.name);
      if (all) both(texts, aliases, v.name + " (kept)", all);
      if (!n) {
        both([texts[0].map((c, i) => i % 97 ? c : c + " FILTLVL>3"), texts[1].map((o, i) => i % 89 ? o : "x" + o)],
             aliases, v.name + " (edited)");
      }
      both(texts, aliases.filter((a) => !keep.has(a.name)), v.name + " (written out)");
    });
    let seed = 11;
    const rnd = (m) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed >>> 16) % m; };
    const word = (len, abc) => Array.from({length: len}, () => abc[rnd(abc.length)]).join("");
    for (let t = 0; t < 400 && bad.length <= 5; t++) {
      const aliases = Array.from({length: 1 + rnd(5)}, () => ({name: word(1 + rnd(3), t % 7 ? "ab_" : "ab-%"),
                                                              value: word(rnd(5), "xb% _")}));
      const texts = [Array.from({length: 6}, () => word(rnd(14), "ab_% x-")),
                     Array.from({length: 6}, () => word(rnd(14), "AB_%x ab"))];
      both(texts, aliases, `made-up ${show(aliases)} on ${show(texts)}`);
    }
    // "aaaaa" leaves the key behind, so BH's loop takes every rule leftmost first: "aaaaaa" -> xxaa, not xaxa
    both([["aaaaaa", "aaaaa"], [""]], [{name: "aaa", value: "xa"}], "leftmost first");
    both([["aaaaaa"], [""]], [{name: "aaa", value: "xa"}], "all at once");
    return {fail: bad.length ? bad.join("\n  ") : null, cases};
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
