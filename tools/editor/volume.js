/* How loud each kind of drop is (the Alerts area): every rule of Erazure's that alerts (an icon, a sound, a chat
   line) belongs to one kind: the unique and set tiers by the look they draw (040's tier aliases), everything else
   by its section. Per kind the player keeps Erazure's alerts, takes the sound away, keeps only the icon (no chat
   line, no sound: BH gives them together) or takes every alert away. A whole-rule change, so exact: an item whose
   alert a muted rule decides is silent. Runs after the level copies, before the item overrides. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.volume = (function () {
  "use strict";
  const MODES = ["mute", "iconOnly", "none"];
  const TIERS = [
    ["uni-high", "Unique items: High value", /%UNI_HIGH_VALUE_LEFT%/],
    ["uni-medium", "Unique items: Medium value", /%UNI_MEDIUM_VALUE_LEFT%/],
    ["uni-minimal", "Unique items: Minimal value", /%UNI_MINIMAL_(?:VALUE|GRAIL)_LEFT%/],
    ["uni-grail", "Unique items not discovered yet", /%UNI_GRAIL_LEFT%/],
    ["set-high", "Set items: High value", /%SET_HIGH_VALUE_LEFT%/],
    ["set-medium", "Set items: Medium value", /%SET_MEDIUM_VALUE_LEFT%/],
    ["set-grail", "Set items not discovered yet", /%SET_GRAIL_LEFT%/],
  ];
  const SECTIONS = {"060": "Gold, potions and tomes", "070": "Keys", "080": "Quest items", "090": "Gems",
    "100": "PD2 items", "110": "Runes", "120": "PD2 items", "130": "Maps", "140": "Maps", "145": "Maps", "146": "Maps",
    "147": "Maps", "150": "Unique items: other", "160": "Unique items: other", "170": "Set items: other",
    "180": "Crafted items", "190": "Rare items", "200": "Magic items", "205": "Non-magical bases",
    "210": "Non-magical bases", "220": "Non-magical bases", "240": "Charms", "250": "Jewels",
    "260": "Arrows and bolts", "280": "Skill and shop highlights", "310": "Staffmods"};
  const RUNE_RE = /(^|[\s(!])r\d\d\b|RUNE[<>=~]/;  // a rune rule anywhere is a rune alert
  const ALL = /%(?:BORDER|MAP|DOT|PX|LINE|NOTIFY)-[0-9a-f]{1,4}%|%SOUNDID-\d{1,4}%|%TIER-\d%/gi;
  const SOUNDS = /%SOUNDID-\d{1,4}%/gi;
  const TIER = /%TIER-\d%/gi;

  /* A section's kind: its number's name, else the file's own name ("230-item-description-notes" -> "Item
     description notes"). */
  function sectionKind(name) {
    const n = name.slice(0, 3);
    if (SECTIONS[n]) return [SECTIONS[n].toLowerCase().replace(/[^a-z0-9]+/g, "-"), SECTIONS[n]];
    const words = name.replace(/\.filter$/, "").slice(4).replace(/-/g, " ");
    return ["sec-" + n, words.charAt(0).toUpperCase() + words.slice(1)];
  }

  /* The kind of each alerting rule: Map(line -> [id, title]). */
  function classify(src, lines) {
    const secs = EZ.filter.sections(src, lines);
    const out = new Map();
    for (const name of Object.keys(secs)) {
      const [a, b] = secs[name];
      const fallback = sectionKind(name);
      for (let i = a; i < b; i++) {
        const line = lines[i];
        if (!line.startsWith("ItemDisplay[")) continue;
        const r = EZ.filter.rule(line);
        if (!r || !EZ.filter.notifies(r.out)) continue;
        const t = TIERS.find(([, , re]) => re.test(r.out));
        out.set(i, t ? [t[0], t[1]] : RUNE_RE.test(r.cond) ? ["runes", "Runes"] : /MAPTIER/.test(r.cond) ?
          ["maps", "Maps"] : fallback);
      }
    }
    return out;
  }

  /* The kinds of a version: [{id, title, rules (how many alerting rules)}], tiers first, then the sections' order. */
  function kinds(src, lines) {
    const seen = new Map();
    for (const [, [id, title]] of classify(src, lines)) {
      if (!seen.has(id)) seen.set(id, {id, title, rules: 0});
      seen.get(id).rules++;
    }
    const tierIds = TIERS.map((t) => t[0]);
    return [...seen.values()].sort((x, y) => {
      const a = tierIds.indexOf(x.id), b = tierIds.indexOf(y.id);
      if (a >= 0 || b >= 0) return (a < 0 ? 99 : a) - (b < 0 ? 99 : b);
      return 0;
    });
  }

  function quieter(out, mode) {
    if (mode === "mute") return out.replace(SOUNDS, "");
    if (mode === "none") return out.replace(ALL, "");
    if (mode === "iconOnly") return out.search(TIER) >= 0 ? out.replace(TIER, "%TIER-0%") : out + "%TIER-0%";
    return out;
  }

  function apply(ctx) {
    const want = ctx.edits.volume || {};
    const ids = Object.keys(want).filter((k) => MODES.indexOf(want[k]) >= 0);
    if (!ids.length) return;
    for (const [i, [id]] of classify(ctx.src, ctx.lines)) {
      if (MODES.indexOf(want[id]) < 0) continue;
      const r = EZ.filter.rule(ctx.lines[i]);
      const out = quieter(r.out, want[id]);
      if (out !== r.out) ctx.lines[i] = r.head + out + r.comment;
    }
  }

  return {kinds, classify, apply, quieter, MODES, TIERS};
})();

if (EZ.edits) {
  EZ.edits.step(50, (ctx) => EZ.volume.apply(ctx));
  EZ.edits.counter("volume", (e) => Object.keys(e.volume || {}).filter((k) => EZ.volume.MODES.indexOf(e.volume[k]) >= 0).length);
}
