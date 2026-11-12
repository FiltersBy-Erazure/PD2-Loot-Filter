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
})();
