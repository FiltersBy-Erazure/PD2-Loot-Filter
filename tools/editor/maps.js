/* Maps (the Maps area): a red warning line on identified maps that roll the mods the player picks (right before
   Erazure's last map rules, 147, so it sits with the map's other lines), and identified maps hidden on the ground
   when they roll a mod the player won't run or promise less experience than the player asks for (146's MXR_<code>:
   the map's rolls' experience multiplier). The hides are item overrides (EZ.overrides), so BH draws nothing for such
   a map, not even its icon. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.maps = (function () {
  "use strict";
  const MARKS = ["// ===============  Your map warnings (Erazure Filter Editor)  ===============",
                 "// ===============  End of your map warnings  ==============="];
  const SECTION = "147-map-display-end.filter";
  const MAPS = "(MAPTIER>0 OR UNIQUE_MAPS)";

  /* A roll of each map stat (the page's data: the affixes' highest), so a stat's text reads as on a map ("-38% Fire
     Resist" is "less Fire Resist"). */
  const samples = new Map();
  function init(data) {
    for (const [sid, , lo, hi] of (data && data.mapStats) || []) samples.set(sid, Math.abs(hi) >= Math.abs(lo) ? hi : lo);
  }

  const ids = (list) => [...new Set((Array.isArray(list) ? list : []).map((x) => parseInt(x, 10)).filter((n) => n > 0 && n < 4096))];
  const minXp = (m) => { const v = parseFloat(m && m.minXp); return isFinite(v) && v > 0 && v < 20 ? Math.round(v * 100) / 100 : null; };

  /* A mod's name for the warning line: the stat's own text without its numbers. */
  function name(sid) {
    const line = EZ.items.catalog() ? EZ.items.statLine(sid, 0, samples.get(sid) || 1) : "";
    const plain = String(line || "").replace(/ÿc./g, "").replace(/-\d+%?\s*/g, "less ")
      .replace(/\+?\d+%?\s*(?:to |of )?/g, "").replace(/\s+/g, " ").replace(/:\s*$/, "").trim();
    return plain || "stat " + sid;
  }

  /* The map item codes (the catalog's map bases) and those with an experience multiplier (146's MXR aliases). */
  function codes(lines) {
    const cat = EZ.items.catalog();
    const all = [...cat.bases.values()].filter((b) => b.map).map((b) => b.code);
    const mxr = new Set(Object.keys(EZ.filter.aliases(lines)).filter((n) => n.startsWith("MXR_")).map((n) => n.slice(4).toLowerCase()));
    return {all, xp: all.filter((c) => mxr.has(c))};
  }

  function hides(edits, ctx) {
    const m = edits.maps;
    if (!m || typeof m !== "object" || !ctx) return [];
    const out = [];
    const hide = ids(m.hide), x = minXp(m);
    if (!hide.length && x === null) return out;
    const c = codes(ctx.lines);
    for (const sid of hide) out.push({action: "hide", scope: {codes: c.all, id: "yes", extra: "!STAT" + sid + "=0"}});
    if (x !== null) {
      for (const code of c.xp) {
        out.push({action: "hide", scope: {codes: [code], id: "yes", extra: "$f((MXR_" + code.toUpperCase() + ")<" + x + ")"}});
      }
    }
    return out;
  }

  function apply(ctx) {
    const m = ctx.edits.maps;
    const warn = ids(m && m.warn);
    if (!warn.length) return;
    const secs = EZ.filter.sections(ctx.src, ctx.lines);
    const range = secs[SECTION];
    if (!range) { ctx.unplaced("maps", "Map warnings", "Erazure no longer has " + SECTION); return; }
    const lines = warn.map((sid) => "ItemDisplay[ID " + MAPS + " !STAT" + sid + "=0]:%NAME%{%NAME%%CL%%RED%! " +
      name(sid).replace(/[{}]/g, "").replace(/\/\/+/g, "/") + "}%CONTINUE%");
    ctx.lines.splice(range[0], 0, MARKS[0], ...lines, MARKS[1]);
  }

  function count(e) {
    const m = e.maps;
    if (!m || typeof m !== "object") return 0;
    return ids(m.warn).length + ids(m.hide).length + (minXp(m) !== null ? 1 : 0);
  }

  return {init, apply, hides, count, name, codes, ids, minXp, MAPS, SECTION};
})();

if (EZ.edits) {
  EZ.edits.step(650, (ctx) => EZ.maps.apply(ctx));
  EZ.edits.counter("maps", (e) => EZ.maps.count(e));
}
if (EZ.overrides) EZ.overrides.generators.push((edits, ctx) => EZ.maps.hides(edits, ctx));
