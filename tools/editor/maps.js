/* Maps (the Maps area): a red warning line on identified maps that roll the mods the player picks (right before
   Erazure's last map rules, 147, so it sits with the map's other lines), identified maps hidden on the ground when
   they roll a mod the player won't run, and the T1-T3 maps the player never picks up: their non-magical ones (what
   monsters drop) hidden on the ground outside town, on the filter levels the player picks (2026-11-12, the author:
   instead of hiding maps below an experience multiplier; T4 dungeons come from rare T3 maps in the cube, always
   identified and rare, so they are never in the list). The hides are item overrides (EZ.overrides), so BH draws
   nothing for such a map, not even its icon, and the map looks as always in town, the inventory and the stash. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.maps = (function () {
  "use strict";
  const MARKS = ["// ===============  Your map warnings (Erazure Filter Editor)  ===============",
                 "// ===============  End of your map warnings  ==============="];
  const SECTION = "147-map-display-end.filter";
  const MAPS = "(MAPTIER>0 OR UNIQUE_MAPS)";
  const WHITE = ["INF", "NORM", "SUP"];

  /* A roll of each map stat (the page's data: the affixes' and corruptions' highest), so a stat's text reads as on a
     map ("-38% Fire Resist" is "less Fire Resist"); signs: 1 when it rolls below 0, 2 above, 3 both (players' attack
     and cast speed: a corruption lowers them, another raises them; the page's data has a line for each). */
  const samples = new Map(), signs = new Map();
  function init(data) {
    for (const [sid, , lo, hi] of (data && data.mapStats) || []) {
      samples.set(sid, Math.abs(hi) >= Math.abs(lo) ? hi : lo);
      signs.set(sid, (signs.get(sid) || 0) | (Math.max(lo, hi) < 0 ? 1 : 2));
    }
  }
  /* Whether a map stat rolls both below and above 0: a warning (or a hide) is for the lower, a mark for the higher. */
  const mixed = (sid) => signs.get(sid) === 3;
  /* The condition of a warning or hide (bad) or a mark: the map rolls the mod (for a mixed one, on that side). */
  const rolls = (sid, bad) => mixed(sid) ? "STAT" + sid + (bad ? "<0" : ">0") : "!STAT" + sid + "=0";

  const ids = (list) => [...new Set((Array.isArray(list) ? list : []).map((x) => parseInt(x, 10)).filter((n) => n > 0 && n < 4096))];
  /* The map codes the player hides (item codes, as the edit set keeps them). */
  const mapCodes = (list) => [...new Set((Array.isArray(list) ? list : []).filter((c) => typeof c === "string" &&
    /^[a-z0-9]{2,4}$/.test(c)))];
  const levelsOf = (list) => [...new Set((Array.isArray(list) ? list : []).map((x) => parseInt(x, 10))
    .filter((n) => n >= 1 && n <= 12))].sort((a, b) => a - b);

  /* A mod's name as the game words it on a map, its rolled value as X ("Monsters have X% of Physical Damage as Extra
     Poison Damage over 5 Seconds", "Players have -X Drain Life"): the stat's own text with a stand-in value of the
     roll's sign (sign: -1 or 1 for a side of a mixed one), so fixed numbers and the minus sign stay. */
  function name(sid, sign) {
    const roll = sign || samples.get(sid) || 1;
    const line = EZ.items.catalog() ? EZ.items.statLine(sid, 0, roll < 0 ? -7777 : 7777) : "";
    const plain = String(line || "").replace(/ÿc./g, "").replace(/7777/g, "X").replace(/\s+/g, " ")
      .replace(/:\s*$/, "").trim();
    return plain || "stat " + sid;
  }
  /* The warning line's words (in game, under the map's own line with the value): the name without its X (a mixed
     stat's red warning shows only when it rolls lower, its gold mark only when higher). */
  const lineName = (sid) => name(sid).replace(/[+-]?X%?\s*(?:to |of )?/g, "").replace(/\s+/g, " ").trim()
    .replace(/:$/, "");  // ("Monster Rarity: +X%" is "Monster Rarity")

  /* The map item codes (the catalog's map bases) and those with an experience multiplier (146's MXR aliases). */
  function codes(lines) {
    const cat = EZ.items.catalog();
    const all = [...cat.bases.values()].filter((b) => b.map).map((b) => b.code);
    const mxr = new Set(Object.keys(EZ.filter.aliases(lines)).filter((n) => n.startsWith("MXR_")).map((n) => n.slice(4).toLowerCase()));
    return {all, xp: all.filter((c) => mxr.has(c))};
  }

  /* The maps a player can choose to hide: T1, T2 and T3 maps that drop, by tier: [{tier, maps: [{code, name}]}]. */
  function choices() {
    const cat = EZ.items.catalog();
    return [1, 2, 3].map((tier) => ({tier, maps: [...cat.bases.values()]
      .filter((b) => b.map && b.maptier === tier && b.spawnable)
      .map((b) => ({code: b.code, name: String(b.name).replace(/ÿc./g, "").replace(/\s+Map$/, "")}))
      .sort((a, b) => a.name.localeCompare(b.name))}));
  }

  function hides(edits, ctx) {
    const m = edits.maps;
    if (!m || typeof m !== "object" || !ctx) return [];
    const out = [];
    const hide = ids(m.hide);
    if (hide.length) {
      const c = codes(ctx.lines);
      for (const sid of hide) out.push({action: "hide", tag: "maps", scope: {codes: c.all, id: "yes", extra: rolls(sid, true)}});
    }
    const cat = EZ.items.catalog();
    const skip = mapCodes(m.hideMaps).filter((c) => { const b = cat.bases.get(c); return b && b.map; });
    if (skip.length) out.push({action: "hide", tag: "maps", scope: {codes: skip, quals: WHITE, levels: levelsOf(m.hideMapsLevels)}});
    return out;
  }

  /* The player's lines under an identified map's name: a red "!" line for a mod to avoid (warn), a gold "+" line for
     a bonus to look for (mark). */
  function apply(ctx) {
    const m = ctx.edits.maps;
    const warn = ids(m && m.warn), mark = ids(m && m.mark);
    if (!warn.length && !mark.length) return;
    const secs = EZ.filter.sections(ctx.src, ctx.lines);
    const range = secs[SECTION];
    if (!range) { ctx.unplaced("maps", "Map warnings", "Erazure moved its map lines"); return; }
    const line = (sid, look, bad) => "ItemDisplay[ID " + MAPS + " " + rolls(sid, bad) + "]:%NAME%{%NAME%%CL%" + look +
      lineName(sid).replace(/[{}]/g, "").replace(/\/\/+/g, "/") + "}%CONTINUE%";
    const lines = warn.map((sid) => line(sid, "%RED%! ", true)).concat(mark.map((sid) => line(sid, "%GOLD%+ ", false)));
    ctx.lines.splice(range[0], 0, MARKS[0], ...lines, MARKS[1]);
  }

  /* The Maps area's changes: its warnings and hides, and Erazure's map lines switched (Features lists them too, and
     counts them here). */
  function count(e) {
    const lines = EZ.features.filter((f) => f.group === "Maps").reduce((n, f) => n + EZ.edits.featureChanges(e, f), 0);
    const m = e.maps;
    if (!m || typeof m !== "object") return lines;
    return lines + ids(m.warn).length + ids(m.hide).length + ids(m.mark).length + mapCodes(m.hideMaps).length;
  }

  /* The bonuses a map rolls (more magic find, gold, experience, density, rarity, an area level, more drops, an extra
     boss, players' faster movement): good for the player, and most maps roll one, so the Maps area offers them a gold
     line only; a mixed stat's higher side (players' faster attacks and casts) is a bonus too. */
  const BONUS = new Set([370, 371, 372, 373, 374, 375, 457, 494, 495, 496, 497, 498]);
  /* Whether a mod's text shows its value (a guest monster or splash damage shows none: no roll to read). */
  const hasValue = (sid) => /X/.test(name(sid));

  return {init, apply, hides, count, name, codes, choices, ids, mapCodes, levelsOf, hasValue, mixed, BONUS, MAPS,
          SECTION, rollOf: (sid) => samples.get(sid)};
})();

if (EZ.edits) {
  EZ.edits.step(650, (ctx) => EZ.maps.apply(ctx));
  EZ.edits.counter("maps", (e) => EZ.maps.count(e));
}
if (EZ.overrides) EZ.overrides.generators.push((edits, ctx) => EZ.maps.hides(edits, ctx));
