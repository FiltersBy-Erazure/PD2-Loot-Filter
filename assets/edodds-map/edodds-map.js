
(() => {
  "use strict";

  // Written by tools/ed_odds.py from tools/ed_odds_engine.js (never by hand): the odds, worked out exactly.
  /* ed-engine:start */
/* The enhanced damage of rare and crafted weapons, worked out exactly (every roll counted, none drawn at random).
   One engine for two pages: the website's Enhanced Damage Odds page (website/resources/ED-Odds.html, between its
   ed-engine markers, written there by tools/ed_odds.py) and the ED highlight tiers review page
   (tools/ed_highlights_template.html's marker, by tools/ed_highlights.py). Edit it here, then run both tools.

   The rules are the Item Builder's (traced 2026-11-22; tools/item_odds.py's docstring), and tools/ed_odds.py
   --selftest checks this engine against item_odds.py's pools and splits:
   - Enhanced damage comes from prefixes only: the pure ED group (105: Jagged ... Visceral) and the ED + attack rating
     group (111: Sharp ... Master's, bows and crossbows Grandmaster's) can both roll, and their ED adds up.
   - An affix can roll when its level <= the affix level <= its max level, its rare flag lets the quality (0 never;
     2 and 3 not on crafts), its item types fit the base and its class (if any) is the base's (DATA.pools holds the
     affixes each base's types and class allow). Each pick takes a group not on the item yet by its weight (frequency x
     10; in a map a tiered affix, version 101-104, gets + trunc(w x min(10(t + 1), 10(M + 1)) / 100), M 1-4 for T1 maps
     to T4 dungeons; crafts never), then an affix of the group by weight.
   - Affix level: the item level raised to the base's quality level q, less q / 2 below 99 - q / 2, else 2 x ilvl - 99,
     kept at 1-99.
   - A rare's affix count: 6 from item level 85, 5-6 from 65, 4-6 from 45, else 3-6; a crafted item max(m, 0-4), m 1 /
     2 / 3 / 4 at crafted item level <= 30 / 31-50 / 51-70 / 71+ (the crafted item level: trunc(character level / 2) +
     trunc(the base's item level / 2), 1-99), plus the craft's own ED. Each pick a prefix or a suffix at even odds, at
     most 3 a side (every weapon's pools hold 3 groups a side at every level: tools/ed_odds.py checks it).
   - Corruption: the outcomes that add ED (DATA.corr, per 1,000 corruptions).
   - Every base of the weapon type that can drop at the item level counts the same.
   DATA: types [[key, label]], bases [[code, name, type index, tier 0-2, quality level, pool index]], affixes [[name,
   group, frequency, level, max level, rare flag, version, ED low, ED high]], pools [[affix index]], crafts [{names, lo,
   hi}], corr [{n, per1000, lo, hi, with}], maxEd. */
function edOddsEngine(DATA) {
  "use strict";
  const N = DATA.maxEd + 1;                          // ED 0..maxEd
  const AFF = DATA.affixes.map(a => ({ name: a[0], g: a[1], freq: a[2], level: a[3], max: a[4], rare: a[5], ver: a[6], lo: a[7], hi: a[8] }));
  const BASES = DATA.bases.map(b => ({ code: b[0], name: b[1], type: DATA.types[b[2]][0], tier: b[3], qlvl: b[4], pool: b[5] }));

  function affixLevel(ilvl, qlvl) {
    const i = Math.max(ilvl, qlvl), h = Math.floor(qlvl / 2);
    const a = i < 99 - h ? i - h : 2 * i - 99;
    return a < 2 ? 1 : a > 98 ? 99 : a;
  }
  const craftLevel = (clvl, bilvl) => Math.max(1, Math.min(99, Math.floor(clvl / 2) + Math.floor(bilvl / 2)));
  function binom(n, k) { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
  function rareCounts(ilvl) {                        // {affix count: chance}
    const lo = ilvl >= 85 ? 6 : ilvl >= 65 ? 5 : ilvl >= 45 ? 4 : 3, out = {};
    for (let n = lo; n <= 6; n++) out[n] = 1 / (7 - lo);
    return out;
  }
  function craftCounts(cil) {
    const m = cil <= 30 ? 1 : cil <= 50 ? 2 : cil <= 70 ? 3 : 4, out = {};
    for (let r = 0; r <= 4; r++) { const n = Math.max(m, r); out[n] = (out[n] || 0) + 1 / 5; }
    return out;
  }
  function prefixCounts(counts) {                    // each pick a prefix or a suffix at even odds, at most 3 a side
    const out = {};
    for (const [n0, pn] of Object.entries(counts)) {
      const n = +n0;
      for (let b = 0; b <= n; b++) {
        const k = Math.min(3, Math.max(b, n - 3));
        out[k] = (out[k] || 0) + pn * binom(n, b) / 2 ** n;
      }
    }
    return out;
  }
  function weight(a, M) {
    const w = a.freq * 10;
    if (M > 0 && a.ver >= 101 && a.ver <= 104) return w + Math.trunc(w * Math.min(10 * (a.ver - 100 + 1), 10 * (M + 1)) / 100);
    return w;
  }
  const flagOk = (rare, craft) => rare !== 0 && !(craft && (rare === 2 || rare === 3));

  function uniform(lo, hi) { const a = new Float64Array(N); for (let v = lo; v <= hi && v < N; v++) a[v] = 1 / (hi - lo + 1); return a; }
  const DELTA0 = (() => { const a = new Float64Array(N); a[0] = 1; return a; })();
  function span(a) { let lo = 0, hi = N - 1; while (lo < N && !a[lo]) lo++; while (hi >= 0 && !a[hi]) hi--; return [lo, hi]; }
  function conv(a, b) {
    const out = new Float64Array(N), [al, ah] = span(a), [bl, bh] = span(b);
    for (let i = al; i <= ah; i++) { const x = a[i]; if (!x) continue; for (let j = bl; j <= bh && i + j < N; j++) out[i + j] += x * b[j]; }
    return out;
  }
  function addScaled(out, a, s) { for (let i = 0; i < N; i++) out[i] += a[i] * s; }

  // the prefix groups a pick can take (their weights), and each ED group's ED
  const POOLS = new Map();
  function pool(poolIdx, alvl, craft, M) {
    const key = `${poolIdx}|${alvl}|${craft ? 1 : 0}|${M}`;
    let p = POOLS.get(key);
    if (p) return p;
    const groups = new Map();
    for (const i of DATA.pools[poolIdx]) {
      const a = AFF[i];
      if (a.level > alvl || (a.max && alvl > a.max) || !flagOk(a.rare, craft)) continue;
      const w = weight(a, M);
      if (!groups.has(a.g)) groups.set(a.g, { w: 0, parts: [] });
      const g = groups.get(a.g); g.w += w; g.parts.push({ w, a });
    }
    const gl = [...groups.values()], edGroups = gl.filter(g => g.parts.some(x => x.a.hi > 0));
    const edPmf = edGroups.map(g => { const d = new Float64Array(N); for (const x of g.parts) addScaled(d, x.a.hi ? uniform(x.a.lo, x.a.hi) : DELTA0, x.w / g.w); return d; });
    p = { ws: gl.map(g => g.w), ed: gl.map(g => edGroups.indexOf(g)), edPmf, edGroups, masks: {}, combos: {} };
    POOLS.set(key, p);
    return p;
  }
  // the chance of each set of ED groups among k picks of distinct groups (ordered picks by weight, the last one in one step)
  function maskProbs(p, k) {
    if (p.masks[k]) return p.masks[k];
    const E = p.edPmf.length, out = new Float64Array(1 << E), G = p.ws.length, used = new Uint8Array(G);
    const tot = p.ws.reduce((s, w) => s + w, 0);
    const edIdx = []; for (let g = 0; g < G; g++) if (p.ed[g] >= 0) edIdx.push(g);
    (function rec(depth, rem, pr, mask) {
      if (depth === k || rem <= 0) { out[mask] += pr; return; }
      if (depth === k - 1) {
        let edLeft = 0;
        for (const g of edIdx) if (!used[g]) { edLeft += p.ws[g]; out[mask | (1 << p.ed[g])] += pr * p.ws[g] / rem; }
        out[mask] += pr * (rem - edLeft) / rem;
        return;
      }
      for (let g = 0; g < G; g++) {
        if (used[g] || !p.ws[g]) continue;
        used[g] = 1;
        rec(depth + 1, rem - p.ws[g], pr * p.ws[g] / rem, p.ed[g] >= 0 ? mask | (1 << p.ed[g]) : mask);
        used[g] = 0;
      }
    })(0, tot, 1, 0);
    return (p.masks[k] = out);
  }
  function combo(p, mask) {
    if (p.combos[mask]) return p.combos[mask];
    let d = DELTA0;
    p.edPmf.forEach((e, i) => { if (mask & (1 << i)) d = conv(d, e); });
    return (p.combos[mask] = d);
  }
  function basePmf(p, kd) {
    const out = new Float64Array(N);
    for (const [k, pk] of Object.entries(kd)) {
      const m = maskProbs(p, +k);
      for (let mask = 0; mask < m.length; mask++) if (m[mask]) addScaled(out, combo(p, mask), pk * m[mask]);
    }
    return out;
  }
  const CORR_W = DATA.corr.reduce((s, c) => s + c.per1000, 0);
  const CORR = (() => { const d = new Float64Array(N); for (const c of DATA.corr) addScaled(d, uniform(c.lo, c.hi), c.per1000 / CORR_W); return d; })();
  function survival(pmf) { const s = new Float64Array(N + 1); for (let i = N - 1; i >= 0; i--) s[i] = s[i + 1] + pmf[i]; return s; }

  /* One weapon type in a setup: q "rare" or "craft"; sc {ilvl, M (0 outside maps, 1-4 T1 maps to T4 dungeons), clvl,
     bilvl, craft (index of DATA.crafts), bases ("all" or a tier 0-2)}. Returns {n bases, bases [names], u (the share
     with at least each ED, uncorrupted: u[x]), c (with an ED corruption), any (some ED), best {sum, tops: the best
     prefixes}, cr (the craft), cil, counts (affix counts)}. */
  const RESULTS = new Map();
  function result(typeKey, q, sc) {
    const craft = q === "craft";
    const key = [typeKey, q, craft ? `${sc.clvl}|${sc.bilvl}|${sc.craft}` : `${sc.ilvl}|${sc.M}`, sc.bases].join("|");
    let r = RESULTS.get(key);
    if (r) return r;
    const dropLvl = craft ? sc.bilvl : sc.ilvl;
    const bases = BASES.filter(b => b.type === typeKey && b.qlvl <= dropLvl && (sc.bases === "all" || b.tier === +sc.bases));
    const cil = craft ? craftLevel(sc.clvl, sc.bilvl) : sc.ilvl;
    const counts = craft ? craftCounts(cil) : rareCounts(sc.ilvl);
    const kd = prefixCounts(counts);
    const u = new Float64Array(N);
    let best = null;
    for (const b of bases) {
      const p = pool(b.pool, affixLevel(cil, b.qlvl), craft, craft ? 0 : sc.M);
      addScaled(u, basePmf(p, kd), 1 / bases.length);
      const tops = p.edGroups.map(g => g.parts.filter(x => x.a.hi).sort((x, y) => y.a.hi - x.a.hi)[0].a).sort((x, y) => y.hi - x.hi).slice(0, 3);
      const sum = tops.reduce((s, a) => s + a.hi, 0);
      if (!best || sum > best.sum) best = { sum, tops };
    }
    let pmf = u;
    const cr = craft ? DATA.crafts[sc.craft] : null;
    if (cr && cr.hi) pmf = conv(u, uniform(cr.lo, cr.hi));
    r = { n: bases.length, bases: bases.map(b => b.name), u: survival(pmf), c: survival(conv(pmf, CORR)),
          any: bases.length ? 1 - pmf[0] : 0, best, cr, cil, counts };
    RESULTS.set(key, r);
    return r;
  }
  const reach = (s, x) => x == null ? null : x <= 0 ? 1 : x > N - 1 ? 0 : s[x];

  return { N, AFF, BASES, CORR_W, affixLevel, craftLevel, craftCounts, rareCounts, result, reach };
}
  /* ed-engine:end */

  // Written by tools/ed_odds.py (never by hand): the engine's data (types, bases, affixes, pools, crafts, corr, maxEd),
  // areas [[key, name, M, area level]], the filter's tiers [{key, clvl ("below" / "from" 80, or every level), look}],
  // thresholds {type: {tier: ED it starts from, or null}}, the ED tag {from, below, look}, the game's text colors.
  /* ed-odds-data:start */
  const DATA = {"types":[["axe1","Axes (1H)"],["axe2","Axes (2H)"],["swor1","Swords (1H)"],["swor2","Swords (2H)"],["knif","Daggers"],["club","Clubs"],["mace","Maces"],["hamm","Hammers"],["scep","Scepters"],["spea","Spears"],["pole","Polearms"],["h2h","Claws"],["jave","Javelins"],["tkni","Throwing knives"],["taxe","Throwing axes"],["bow","Bows"],["xbow","Crossbows"],["abow","Amazon bows"],["aspe","Amazon spears"],["ajav","Amazon javelins"]],"bases":[["2ax","Double Axe",0,0,13,0],["2hs","Two-Handed Sword",3,0,10,1],["6cb","Great Bow",15,2,68,2],["6hb","Blade Bow",15,2,60,2],["6hx","Colossus Crossbow",16,2,75,2],["6l7","Crusader Bow",15,2,77,2],["6lb","Shadow Bow",15,2,63,2],["6lw","Hydra Bow",15,2,85,2],["6lx","Pellet Bow",16,2,57,2],["6mx","Gorgon Crossbow",16,2,67,2],["6rx","Demon Crossbow",16,2,84,2],["6s7","Diamond Bow",15,2,72,2],["6sb","Spider Bow",15,2,55,2],["6sw","Ward Bow",15,2,80,2],["72a","Ettin Axe",0,2,70,0],["72h","Legend Sword",3,2,59,1],["7ar","Suwayyah",11,2,59,3],["7ax","Small Crescent",0,2,61,0],["7b7","Champion Sword",3,2,77,1],["7b8","Winged Axe",14,2,80,4],["7ba","Silver-edged Axe",1,2,65,0],["7bk","Winged Knife",13,2,77,5],["7bl","Legend Spike",4,2,85,6],["7br","Mancatcher",9,2,74,7],["7bs","Conquest Sword",2,2,78,1],["7bt","Decapitator",1,2,73,0],["7cl","Truncheon",5,2,52,8],["7cm","Highland Blade",3,2,66,1],["7cr","Phase Blade",2,2,73,9],["7cs","Battle Cestus",11,2,73,3],["7dg","Bone Knife",4,2,58,6],["7di","Mithril Point",4,2,70,6],["7fb","Colossus Sword",3,2,80,1],["7fc","Hydra Edge",2,2,69,1],["7fl","Scourge",6,2,76,1],["7ga","Champion Axe",1,2,82,0],["7gd","Colossus Blade",3,2,85,1],["7gi","Glorious Axe",1,2,85,0],["7gl","Ghost Glaive",12,2,79,10],["7gm","Thunder Maul",7,2,85,11],["7gs","Balrog Blade",3,2,71,1],["7h7","Great Poleaxe",10,2,84,12],["7ha","Tomahawk",0,2,54,0],["7ja","Hyperion Javelin",12,2,54,10],["7kr","Fanged Knife",4,2,83,6],["7la","Feral Axe",1,2,57,0],["7ls","Cryptic Sword",2,2,82,1],["7lw","Feral Claws",11,2,78,3],["7m7","Ogre Maul",7,2,69,11],["7ma","Reinforced Mace",6,2,63,1],["7mp","War Spike",0,2,79,0],["7mt","Devil Star",6,2,70,1],["7o7","Ogre Axe",10,2,60,12],["7p7","War Pike",9,2,85,7],["7pa","Cryptic Axe",10,2,79,12],["7pi","Stygian Pilum",12,2,62,10],["7qr","Scissors Suwayyah",11,2,85,3],["7qs","Seraph Rod",8,2,76,13],["7s7","Balrog Spear",12,2,71,10],["7s8","Thresher",10,2,71,14],["7sb","Elegant Blade",2,2,63,1],["7sc","Mighty Scepter",8,2,62,13],["7sm","Ataghan",2,2,61,1],["7sp","Tyrant Club",5,2,57,8],["7sr","Hyperion Spear",9,2,58,7],["7ss","Falcata",2,2,56,1],["7st","Ghost Spear",9,2,83,7],["7ta","Flying Axe",14,2,56,4],["7tk","Flying Knife",13,2,64,5],["7tr","Stygian Pike",9,2,66,7],["7ts","Winged Harpoon",12,2,85,10],["7tw","Runic Talons",11,2,81,3],["7vo","Colossus Voulge",10,2,64,12],["7wa","Berserker Axe",0,2,85,0],["7wb","Wrist Sword",11,2,62,3],["7wc","Giant Thresher",10,2,85,14],["7wd","Mythical Sword",2,2,85,1],["7wh","Legendary Mallet",7,2,82,11],["7ws","Caduceus",8,2,85,13],["7xf","War Fist",11,2,68,3],["8cb","Double Bow",15,1,39,2],["8hb","Razor Bow",15,1,33,2],["8hx","Ballista",16,1,47,2],["8l8","Large Siege Bow",15,1,46,2],["8lb","Cedar Bow",15,1,35,2],["8lw","Gothic Bow",15,1,52,2],["8lx","Arbalest",16,1,34,2],["8mx","Siege Crossbow",16,1,40,2],["8rx","Chu-Ko-Nu",16,1,54,2],["8s8","Short Siege Bow",15,1,43,2],["8sb","Edge Bow",15,1,30,2],["8sw","Rune Bow",15,1,49,2],["92a","Twin Axe",0,1,39,0],["92h","Espandon",3,1,37,1],["9ar","Quhab",11,1,28,3],["9ax","Cleaver",0,1,34,0],["9b7","Lochaber Axe",10,1,33,12],["9b8","Hurlbat",14,1,41,4],["9b9","Gothic Sword",3,1,48,1],["9ba","Bearded Axe",1,1,38,0],["9bk","War Dart",13,1,39,5],["9bl","Stiletto",4,1,46,6],["9br","War Fork",9,1,41,7],["9bs","Battle Sword",2,1,40,1],["9bt","Tabar",1,1,42,0],["9cl","Cudgel",5,1,30,8],["9cm","Dacian Falx",3,1,42,1],["9cr","Dimensional Blade",2,1,37,9],["9cs","Hand Scythe",11,1,41,3],["9dg","Poignard",4,1,31,6],["9di","Rondel",4,1,36,6],["9fb","Zweihander",3,1,49,1],["9fc","Tulwar",2,1,37,1],["9fl","Knout",6,1,43,1],["9ga","Gothic Axe",1,1,46,0],["9gd","Executioner Sword",3,1,54,1],["9gi","Ancient Axe",1,1,51,0],["9gl","Spiculum",12,1,46,10],["9gm","Martel de Fer",7,1,53,11],["9gs","Tusk Sword",3,1,45,1],["9h9","Bec-de-Corbin",10,1,51,12],["9ha","Hatchet",0,1,31,0],["9ja","War Javelin",12,1,30,10],["9kr","Cinquedeas",4,1,42,6],["9la","Military Axe",1,1,34,0],["9ls","Rune Sword",2,1,44,1],["9lw","Greater Claws",11,1,45,3],["9m9","War Club",7,1,45,11],["9ma","Flanged Mace",6,1,35,1],["9mp","Crowbill",0,1,43,0],["9mt","Jagged Star",6,1,39,1],["9p9","Lance",9,1,47,7],["9pa","Partizan",10,1,35,12],["9pi","Great Pilum",12,1,37,10],["9qr","Scissors Quhab",11,1,54,3],["9qs","Holy Water Sprinkler",8,1,40,13],["9s8","Battle Scythe",10,1,40,14],["9s9","Simbilan",12,1,40,10],["9sb","Shamshir",2,1,35,1],["9sc","Rune Scepter",8,1,31,13],["9sm","Cutlass",2,1,43,1],["9sp","Barbed Club",5,1,32,8],["9sr","War Spear",9,1,33,7],["9ss","Gladius",2,1,30,1],["9st","Yari",9,1,44,7],["9ta","Francisca",14,1,34,4],["9tk","Battle Dart",13,1,31,5],["9tr","Fuscina",9,1,36,7],["9ts","Harpoon",12,1,51,10],["9tw","Greater Talons",11,1,50,3],["9vo","Bill",10,1,37,12],["9wa","Naga",0,1,48,0],["9wb","Wrist Spike",11,1,32,3],["9wc","Grim Scythe",10,1,55,14],["9wd","Ancient Sword",2,1,49,1],["9wh","Battle Hammer",7,1,48,11],["9ws","Divine Scepter",8,1,45,13],["9xf","Fascia",11,1,36,3],["am1","Stag Bow",17,0,18,2],["am2","Reflex Bow",17,0,27,2],["am3","Maiden Spear",18,0,18,15],["am4","Maiden Pike",18,0,27,15],["am5","Maiden Javelin",19,0,23,16],["am6","Ashwood Bow",17,1,39,2],["am7","Ceremonial Bow",17,1,47,2],["am8","Ceremonial Spear",18,1,43,15],["am9","Ceremonial Pike",18,1,51,15],["ama","Ceremonial Javelin",19,1,35,16],["amb","Matriarchal Bow",17,2,53,2],["amc","Grand Matron Bow",17,2,78,2],["amd","Matriarchal Spear",18,2,61,15],["ame","Matriarchal Pike",18,2,81,15],["amf","Matriarchal Javelin",19,2,65,16],["axe","Axe",0,0,7,0],["axf","Hatchet Hands",11,0,12,3],["bal","Balanced Axe",14,0,16,4],["bar","Bardiche",10,0,5,12],["bax","Broad Axe",1,0,12,0],["bkf","Balanced Knife",13,0,13,5],["bld","Blade",4,0,23,6],["brn","Brandistock",9,0,16,7],["bsd","Broad Sword",2,0,15,1],["bsw","Bastard Sword",3,0,24,1],["btl","Blade Talons",11,0,21,3],["btx","Battle Axe",1,0,17,0],["cbw","Composite Bow",15,0,12,2],["ces","Cestus",11,0,15,3],["clb","Club",5,0,1,8],["clm","Claymore",3,0,17,1],["clw","Claws",11,0,18,3],["crs","Crystal Sword",2,0,11,9],["dgr","Dagger",4,0,3,6],["dir","Dirk",4,0,9,6],["fla","Flail",6,0,19,1],["flb","Flamberge",3,0,27,1],["flc","Falchion",2,0,11,1],["gax","Great Axe",1,0,23,0],["gis","Giant Sword",3,0,21,1],["gix","Giant Axe",1,0,27,0],["glv","Glaive",12,0,23,10],["gma","Great Maul",7,0,32,11],["gsc","Grand Scepter",8,0,15,13],["gsd","Great Sword",3,0,33,1],["hal","Halberd",10,0,29,12],["hax","Hand Axe",0,0,3,0],["hbw","Hunter's Bow",15,0,5,2],["hxb","Heavy Crossbow",16,0,24,2],["jav","Javelin",12,0,1,10],["kri","Kris",4,0,17,6],["ktr","Katar",11,0,1,3],["lax","Large Axe",1,0,6,0],["lbb","Long Battle Bow",15,0,23,2],["lbw","Long Bow",15,0,8,2],["lsd","Long Sword",2,0,20,1],["lwb","Long War Bow",15,0,31,2],["lxb","Light Crossbow",16,0,6,2],["mac","Mace",6,0,8,1],["mau","Maul",7,0,21,11],["mpi","Military Pick",0,0,19,0],["mst","Morning Star",6,0,13,1],["mxb","Crossbow",16,0,15,2],["pax","Poleaxe",10,0,21,12],["pik","Pike",9,0,24,7],["pil","Pilum",12,0,10,10],["rxb","Repeating Crossbow",16,0,33,2],["sbb","Short Battle Bow",15,0,18,2],["sbr","Sabre",2,0,8,1],["sbw","Short Bow",15,0,1,2],["scm","Scimitar",2,0,5,1],["scp","Scepter",8,0,3,13],["scy","Scythe",10,0,15,14],["skr","Scissors Katar",11,0,24,3],["spc","Spiked Club",5,0,4,8],["spr","Spear",9,0,5,7],["spt","Spetum",9,0,20,7],["ssd","Short Sword",2,0,1,1],["ssp","Short Spear",12,0,15,10],["swb","Short War Bow",15,0,27,2],["tax","Throwing Axe",14,0,7,4],["tkf","Throwing Knife",13,0,2,5],["tri","Trident",9,0,9,7],["tsp","Throwing Spear",12,0,29,10],["vou","Voulge",10,0,11,12],["wax","War Axe",0,0,25,0],["whm","War Hammer",7,0,25,11],["wrb","Wrist Blade",11,0,9,3],["wsc","War Scythe",10,0,34,14],["wsd","War Sword",2,0,27,1],["wsp","War Scepter",8,0,21,13]],"affixes":[["Jagged",105,90,1,41,1,1,10,20],["Deadly",105,90,5,45,1,1,21,30],["Vicious",105,80,8,48,1,1,31,40],["Brutal",105,80,14,54,1,1,41,50],["Massive",105,70,20,60,1,1,51,65],["Savage",105,70,26,0,1,1,66,80],["Merciless",105,60,32,0,1,1,81,100],["Ferocious",105,60,41,0,1,101,101,200],["Cruel",105,50,51,0,1,102,201,300],["Bronze",110,80,1,41,1,1,0,0],["Iron",110,80,4,44,1,1,0,0],["Steel",110,70,8,0,1,1,0,0],["Silver",110,70,12,0,1,1,0,0],["Gold",110,60,17,0,1,1,0,0],["Platinum",110,60,22,0,1,1,0,0],["Meteoric",110,50,27,0,1,1,0,0],["Strange",110,50,32,0,1,100,0,0],["Sharp",111,90,5,45,1,1,10,20],["Fine",111,90,12,52,1,1,21,30],["Warrior's",111,80,19,59,1,1,31,40],["Soldier's",111,80,27,0,1,1,41,50],["Knight's",111,70,38,0,1,1,51,65],["Lord's",111,60,47,0,1,1,66,80],["King's",111,50,56,0,1,1,81,100],["Master's",111,50,56,0,1,100,101,150],["Serpent's",115,20,37,77,1,1,0,0],["Azure",117,20,5,45,1,1,0,0],["Lapis",117,20,35,0,1,1,0,0],["Cobalt",117,20,55,0,1,1,0,0],["Russet",118,10,35,0,1,1,0,0],["Garnet",118,10,55,0,1,1,0,0],["Tangerine",119,40,5,45,1,1,0,0],["Ocher",119,10,35,0,1,1,0,0],["Coral",119,10,55,0,1,1,0,0],["Beryl",120,40,5,45,1,1,0,0],["Viridian",120,10,35,0,1,1,0,0],["Jade",120,10,55,0,1,1,0,0],["Triumphant",121,40,3,53,1,1,0,0],["Victorious",121,40,17,0,1,100,0,0],["Aureolic",121,40,12,0,1,100,0,0],["Mechanic's",122,30,10,0,1,100,0,0],["Artisan's",122,20,33,0,1,100,0,0],["Jeweler's",122,10,55,0,1,103,0,0],["Lunar",123,20,3,43,1,100,0,0],["Arcadian",123,20,15,55,1,100,0,0],["Unearthly",123,10,25,0,1,100,0,0],["Astral",123,10,35,0,1,100,0,0],["Elysian",123,10,45,0,1,100,0,0],["Expert's",125,10,20,0,1,100,0,0],["Veteran's",125,10,40,0,1,100,0,0],["Fanatic",125,10,20,0,1,100,0,0],["Raging",125,10,40,0,1,100,0,0],["Sounding",125,10,20,0,1,100,0,0],["Resonant",125,10,40,0,1,100,0,0],["Fool's",111,70,50,0,1,100,0,0],["Grinding",105,70,50,0,1,100,0,0],["Snowy",137,30,25,65,1,100,0,0],["Shivering",137,20,35,0,1,100,0,0],["Boreal",137,10,50,0,1,100,0,0],["Hibernal",137,10,70,0,1,100,0,0],["Fiery",138,30,25,65,1,100,0,0],["Smoldering",138,20,35,0,1,100,0,0],["Smoking",138,10,47,0,1,100,0,0],["Flaming",138,10,61,0,1,100,0,0],["Condensing",138,10,65,0,1,102,0,0],["Static",139,30,25,65,1,100,0,0],["Glowing",139,20,34,0,1,100,0,0],["Buzzing",139,10,46,0,1,100,0,0],["Arcing",139,10,60,0,1,100,0,0],["Shocking",139,10,65,0,1,101,0,0],["Septic",140,30,1,41,1,100,0,0],["Foul",140,20,10,50,1,100,0,0],["Corrosive",140,10,20,0,1,100,0,0],["Toxic",140,10,35,0,1,100,0,0],["Pestilent",140,10,50,0,1,100,0,0],["Slayer's",125,40,30,0,1,1,0,0],["Berserker's",125,10,50,0,1,1,0,0],["Consecrated",142,40,1,41,1,100,0,0],["Pure",142,30,15,0,1,100,0,0],["Sacred",142,20,25,0,1,100,0,0],["Hallowed",142,10,35,0,1,100,0,0],["Crimson",118,40,5,45,1,1,0,0],["Blood Letting",200,30,13,53,1,1,0,0],["Murderous",200,10,51,0,1,100,0,0],["Blood Sucking",200,20,32,0,1,100,0,0],["Visceral",105,10,75,0,3,104,301,400],["Celestial",123,10,55,0,3,104,0,0],["Plague",140,10,50,0,1,100,0,0],["Cultist's",170,40,28,68,1,100,0,0],["Bloodthirster's",170,40,48,0,1,103,0,0],["Gorelust's",170,40,68,0,1,101,0,0],["Virulent",140,10,65,0,1,100,0,0],["Master's",125,10,60,0,3,104,0,0],["Echoing",125,10,60,0,3,104,0,0],["Furious",125,10,60,0,3,104,0,0],["Lion Branded",125,10,20,0,1,100,0,0],["Hawk Branded",125,10,40,0,1,100,0,0],["Captain's",125,10,20,0,1,100,0,0],["Commander's",125,10,40,0,1,100,0,0],["Monk's",125,40,35,0,1,1,0,0],["Priest's",125,20,65,0,1,102,0,0],["Fletcher's",125,10,20,0,1,100,0,0],["Bowyer's",125,10,40,0,1,100,0,0],["Visionary",111,10,25,0,1,100,0,0],["Maiden's",125,40,30,0,1,1,0,0],["Valkyrie's",125,20,50,0,1,1,0,0],["Divine",142,10,45,0,1,100,0,0],["Grandmaster's",111,40,69,0,1,101,151,200],["Archer's",125,10,60,0,1,100,0,0],["Sizzling",171,20,10,29,1,100,0,0],["Singeing",171,20,30,59,1,100,0,0],["Infernal",171,20,60,0,1,103,0,0],["Frigid",171,20,10,29,1,100,0,0],["Frostbitten",171,20,30,59,1,100,0,0],["Subzero",171,20,60,0,1,103,0,0],["Archer's",125,10,60,0,3,104,0,0],["Entrapping",125,10,20,0,1,100,0,0],["Trickster's",125,10,40,0,1,100,0,0],["Mentalist's",125,10,20,0,1,100,0,0],["Psychic",125,10,40,0,1,100,0,0],["Shogukusha's",125,10,20,0,1,100,0,0],["Sensei's",125,10,40,0,1,100,0,0],["Magekiller's",125,40,30,0,1,100,0,0],["Witch-hunter's",125,20,50,0,1,100,0,0],["Crackling",171,20,10,29,1,100,0,0],["Jolting",171,20,30,59,1,100,0,0],["Surging",171,20,60,0,1,103,0,0],["Decaying",171,20,10,29,1,100,0,0],["Festering",171,20,30,59,1,100,0,0],["Necrotic",171,20,60,0,1,103,0,0],["Cunning",125,10,60,0,3,104,0,0],["Kenshi's",125,10,60,0,3,104,0,0],["Shadow",125,10,60,0,3,104,0,0],["Fungal",125,10,20,0,1,100,0,0],["Noxious",125,10,40,0,1,100,0,0],["Summoner's",125,40,30,0,1,1,0,0],["Necromancer's",125,20,50,0,1,1,0,0],["Infectious",140,10,65,0,1,100,0,0],["Harpoonist's",125,10,20,0,1,100,0,0],["Spearmaiden's",125,10,40,0,1,100,0,0],["Lancer's",125,10,60,0,1,100,0,0],["Trainer's",125,10,20,0,1,100,0,0],["Caretaker's",125,10,40,0,1,100,0,0],["Spiritual",125,10,20,0,1,100,0,0],["Feral",125,10,40,0,1,100,0,0],["Natural",125,10,20,0,1,100,0,0],["Terrene",125,10,40,0,1,100,0,0],["Shaman's",125,40,30,0,1,100,0,0],["Hierophant's",125,20,50,0,1,100,0,0],["Communal",125,10,60,0,3,104,0,0],["Gaean",125,10,60,0,3,104,0,0],["Keeper's",125,10,60,0,3,104,0,0],["Slayer's",125,40,30,0,1,103,0,0],["Berserker's",125,10,50,0,1,104,0,0],["Lizard's",115,40,3,43,1,1,0,0],["Snake's",115,40,6,46,1,1,0,0],["Serpent's",115,30,14,54,1,1,0,0],["Drake's",115,20,20,0,1,1,0,0],["Dragon's",115,20,24,0,1,1,0,0],["Wyrm's",115,20,30,0,1,1,0,0],["Great Wyrm's",115,20,37,0,1,100,0,0],["Bahamut's",115,20,45,0,1,100,0,0],["Sapphire",117,30,25,0,1,1,0,0],["Ruby",118,30,25,0,1,1,0,0],["Amber",119,30,25,0,1,1,0,0],["Emerald",120,30,25,0,1,1,0,0],["Monk's",125,40,30,0,1,1,0,0],["Priest's",125,20,50,0,1,1,0,0],["Lizard's",115,40,1,2,1,1,0,0],["Lancer's",125,10,60,0,3,104,0,0],["Crackling",171,20,10,29,1,100,0,0],["Jolting",171,20,30,59,1,100,0,0],["Surging",171,20,60,0,1,104,0,0]],"pools":[[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,95,96,97,98,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,99,100,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,101,102,54,55,103,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,104,105,77,78,79,80,81,82,83,84,85,106,86,107,108,87,88,89,90,91,109,110,111,112,113,114,115],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,116,117,118,119,120,121,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,122,123,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,109,110,111,112,113,114,124,125,126,127,128,129,130,131,132],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,43,44,45,46,47,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,133,134,116,117,118,119,120,121,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,135,136,122,123,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,137,130,131,132],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,138,139,140,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,104,105,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,141,142,143,144,145,146,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,147,148,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,149,150,151],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,95,96,97,98,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,99,100,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,109,110,111,112,113,114,124,125,126,92,93,94],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,43,44,45,46,47,138,139,140,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,104,105,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,124,125,126,127,128,129,152,153,92,93,94],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,99,100,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,154,155,156,157,158,159,160,161,26,27,28,162,29,30,163,31,32,33,164,34,35,36,165,37,38,39,40,41,42,43,44,45,46,47,95,96,97,98,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,166,167,77,78,79,80,81,168,82,83,84,85,86,87,88,89,90,91,109,110,111,112,113,114,124,125,126],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,137,92,93,94],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,138,139,140,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,104,105,77,78,79,80,81,82,83,84,85,86,169,87,88,89,90,91,170,171,172],[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,43,44,45,46,47,138,139,140,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,104,105,77,78,79,80,81,82,83,84,85,86,169,87,88,89,90,91,124,125,126,127,128,129]],"crafts":[{"names":["Hitpower","Blood","Safety"],"lo":50,"hi":80},{"names":["Brilliant"],"lo":20,"hi":40},{"names":["Caster","Vampiric","Bountiful"],"lo":0,"hi":0}],"corr":[{"n":2,"per1000":25,"lo":40,"hi":80,"with":""},{"n":17,"per1000":15,"lo":40,"hi":60,"with":"5% life stolen"},{"n":22,"per1000":10,"lo":80,"hi":120,"with":"20% IAS"},{"n":24,"per1000":10,"lo":60,"hi":80,"with":"ignore target's defense"},{"n":25,"per1000":10,"lo":50,"hi":70,"with":"25% deadly strike"},{"n":26,"per1000":10,"lo":80,"hi":120,"with":"+250 attack rating"}],"maxEd":800,"areas":[["out","Outside maps",0,0],["t1","T1 map",1,87],["t2","T2 map",2,88],["t3","T3 map",3,89],["t4","T4 dungeon",4,92]],"tiers":[{"key":"lvl","clvl":"below","look":[["ORANGE","**"],["YELLOW","**"],["ORANGE","   +412% Enhanced Damage   "],["YELLOW","**"],["ORANGE","**"]]},{"key":"high","clvl":"below","look":[["RED","*"],["ORANGE","**"],["YELLOW","**"],["ORANGE","   +412% Enhanced Damage   "],["YELLOW","**"],["ORANGE","**"],["RED","*"]]},{"key":"high80","clvl":"from","look":[["ORANGE","**"],["YELLOW","**"],["ORANGE","   +412% Enhanced Damage   "],["YELLOW","**"],["ORANGE","**"]]},{"key":"purple","clvl":"","look":[["PURPLE","**"],["RED","**"],["ORANGE","**"],["RED","    +412% Enhanced Damage    "],["ORANGE","**"],["RED","**"],["PURPLE","**"]]},{"key":"lr","clvl":"","look":[["BLUE","**"],["PURPLE","**"],["RED","**"],["ORANGE","**"],["PURPLE","    +412% Enhanced Damage    "],["ORANGE","**"],["RED","**"],["PURPLE","**"],["BLUE","**"]]},{"key":"top","clvl":"","look":[["TEAL","**"],["BLUE","**"],["PURPLE","**"],["RED","**"],["PURPLE","    +412% Enhanced Damage    "],["RED","**"],["PURPLE","**"],["BLUE","**"],["TEAL","**"]]},{"key":"gold","clvl":"","look":[["GREEN","**"],["TEAL","**"],["BLUE","**"],["PURPLE","**    +412% Enhanced Damage    "],["PURPLE","**"],["BLUE","**"],["TEAL","**"],["GREEN","**"]]}],"thresholds":{"axe1":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"axe2":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"swor1":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"swor2":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"knif":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"club":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"mace":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"hamm":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"scep":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"spea":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"pole":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"h2h":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"jave":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"tkni":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"taxe":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"bow":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"xbow":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"abow":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"aspe":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700},"ajav":{"lvl":250,"high":300,"high80":300,"purple":400,"lr":500,"top":600,"gold":700}},"tag":{"from":400,"below":[["WHITE","412"],["RED","ed"]],"look":[["WHITE","412"],["PURPLE","ed"]]},"colors":{"WHITE":"#FEFEFE","RED":"#FE6950","GREEN":"#25FE00","BLUE":"#7B7BFE","GOLD":"#DFB679","GRAY":"#7B7B7B","BLACK":"#000000","TAN":"#D9CD8E","ORANGE":"#FFB200","YELLOW":"#EBEB75","PURPLE":"#B700FF","DARK_GREEN":"#008C00","CORAL":"#E09595","SAGE":"#B6E12E","TEAL":"#5CA6A4","LIGHT_GRAY":"#A9A9B0"}};
  /* ed-odds-data:end */

  const E = edOddsEngine(DATA);
  const $ = id => document.getElementById(id);
  const STORE = "erazure-ed-odds";
  const TYPES = DATA.types.map(([key, label]) => ({ key, label }));
  const TYPE = Object.fromEntries(TYPES.map(t => [t.key, t]));
  const AREA = Object.fromEntries(DATA.areas.map(a => [a[0], a]));
  const DEF = { q: "rare", at: "t3", il: 89, craft: 0, cl: 90, bil: 89, b: "all", c: 0, t: "swor2" };
  const state = Object.assign({}, DEF);
  const clampLvl = v => Math.max(1, Math.min(99, Math.round(+v) || 1));
  function fit() {
    if (!["rare", "craft"].includes(state.q)) state.q = DEF.q;
    if (!AREA[state.at]) state.at = DEF.at;
    for (const k of ["il", "cl", "bil"]) state[k] = clampLvl(state[k]);
    state.craft = Math.max(0, Math.min(DATA.crafts.length - 1, Math.round(+state.craft) || 0));
    if (!["all", "0", "1", "2"].includes(String(state.b))) state.b = DEF.b;
    state.b = String(state.b);
    state.c = +state.c ? 1 : 0;
    if (!TYPE[state.t]) state.t = DEF.t;
  }
  try { Object.assign(state, JSON.parse(localStorage.getItem(STORE) || "{}")); } catch (e) { /* this visit */ }
  // a link to a setup: ?quality=rare&at=t3&il=89&b=all&c=0&t=swor2 (crafts: quality=crafted&craft=0&cl=90&bil=89).
  // Never ?q=: the site's search opens on it (and keeps the page from scrolling).
  const ADDR = { quality: "q" }, QWORD = { rare: "rare", crafted: "craft" };
  (() => {
    const a = new URLSearchParams(location.search);
    for (const [k, v] of a) {
      const key = ADDR[k] || k;
      if (key === "q") { if (QWORD[v]) state.q = QWORD[v]; } else if (key in DEF) state[key] = v;
    }
  })();
  fit();

  const num = v => v.toLocaleString("en-US");
  const low = s => /^Amazon/.test(s) ? s : s[0].toLowerCase() + s.slice(1);  // a weapon type's name in a sentence
  const words = a => a.length < 3 ? a.join(" and ") : a.slice(0, -1).join(", ") + ", and " + a[a.length - 1];
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  function odds(p) {
    if (p == null) return "-";
    if (p <= 1e-15) return "never";
    if (p >= 0.9995) return "all";
    if (p >= 0.1) return Math.round(p * 100) + "%";
    const n = 1 / p;
    if (n < 1e4) return "1 in " + num(Math.round(n));
    if (n < 1e6) return "1 in " + num(Math.round(n / 100) * 100);
    if (n < 1e9) return "1 in " + (n / 1e6).toFixed(n < 1e7 ? 1 : 0) + "M";
    return "1 in " + (n / 1e9).toFixed(n < 1e10 ? 1 : 0) + "B";
  }
  // game text: [[color, text], ...]
  function game(segs, cls) {
    const box = el("span", "game" + (cls ? " " + cls : ""));
    for (const [c, t] of segs) { const s = el("span", "", t); s.style.color = DATA.colors[c] || DATA.colors.WHITE; box.appendChild(s); }
    return box;
  }
  function starsOf(look) {         // the stars before the line's text
    const out = [];
    for (const [c, t] of look) { const m = t.match(/^\*+/); if (!m) break; out.push([c, m[0]]); if (m[0].length < t.length) break; }
    return out;
  }
  const lineOf = (look, ed) => look.map(([c, t]) => [c, t.replace("412", String(ed))]);
  const CLVL = { below: "clvl below 80", from: "clvl 80+", "": "every character level" };

  // the table's star columns: the tiers whose thresholds match for every weapon type share one (300%: red stars below
  // clvl 80, orange from 80), each at its most common threshold
  const COLS = [];
  for (const t of DATA.tiers) {
    const sig = TYPES.map(k => DATA.thresholds[k.key][t.key]).join(",");
    const c = COLS.find(x => x.sig === sig);
    if (c) c.tiers.push(t); else COLS.push({ sig, tiers: [t] });
  }
  for (const c of COLS) {
    const n = {};
    for (const k of TYPES) { const v = DATA.thresholds[k.key][c.tiers[0].key]; if (v != null) n[v] = (n[v] || 0) + 1; }
    c.value = +Object.keys(n).sort((a, b) => n[b] - n[a] || a - b)[0];
  }
  COLS.sort((a, b) => a.value - b.value);
  const thrOf = (k, c) => DATA.thresholds[k][c.tiers[0].key];

  // ---------- the bar ----------
  for (const [key, name, , lvl] of DATA.areas) {
    const o = el("option", "", lvl ? `${name} (area level ${lvl})` : name); o.value = key; $("eoAt").appendChild(o);
  }
  DATA.crafts.forEach((c, i) => {
    const o = el("option", "", words(c.names).replace(/ and ([^,]*)$/, " or $1") + (c.hi ? ` (+${c.lo}–${c.hi}%)` : " (none)"));
    o.value = String(i); $("eoCraft").appendChild(o);
  });
  for (const t of TYPES) { const o = el("option", "", t.label); o.value = t.key; $("eoType").appendChild(o); }
  const setup = () => state.q === "craft"
    ? { clvl: state.cl, bilvl: state.bil, craft: state.craft, bases: state.b }
    : { ilvl: state.il, M: AREA[state.at][2], bases: state.b };
  const result = k => E.result(k, state.q, setup());
  const curve = r => state.c ? r.c : r.u;
  const baseWord = { all: "", 0: "normal ", 1: "exceptional ", 2: "elite " };
  function setupWords() {
    const q = state.q === "craft" ? "Crafted" : "Rare", b = baseWord[state.b];
    if (state.q === "craft") {
      const c = DATA.crafts[state.craft];
      return `${q} ${b}weapons: ${words(c.names).replace(/ and ([^,]*)$/, " or $1")} crafts by a level ${state.cl} character on bases of item level ${state.bil}`;
    }
    const a = AREA[state.at];
    return `${q} ${b}weapons that drop at item level ${state.il}${a[2] ? " in a " + a[1] : " outside maps"}`;
  }

  // ---------- every weapon type ----------
  function renderTable() {
    const head = $("eoTable").tHead, body = $("eoTable").tBodies[0];
    head.textContent = ""; body.textContent = "";
    const hr = head.insertRow();
    const th = (text, cls) => { const h = el("th", cls, text); h.scope = "col"; hr.appendChild(h); return h; };
    th("Weapon type", "type-h");
    th("Any enhanced damage", "n");
    for (const c of COLS) {
      const h = th("", "n tier"), st = el("span", "stars");
      for (const t of c.tiers) st.appendChild(game(starsOf(t.look), "mini"));
      st.setAttribute("aria-hidden", "true");
      h.append(st, `${c.value}%+`);
    }
    th("Most", "n");
    for (const t of TYPES) {
      const r = result(t.key), tr = body.insertRow();
      if (t.key === state.t) tr.className = "sel";
      const td0 = tr.insertCell(); td0.className = "type";
      const b = el("button", "pick"); b.type = "button"; b.dataset.t = t.key; b.setAttribute("aria-pressed", String(t.key === state.t));
      b.append(el("span", "car", t.key === state.t ? "◆" : "▸"), el("span", "name", t.label));
      td0.append(b, el("span", "sub", r.n ? `${r.n} base${r.n === 1 ? "" : "s"}` : "no bases drop here"));
      const cell = (label, text, cls) => { const td = tr.insertCell(); td.className = "n" + (cls ? " " + cls : ""); td.dataset.l = label; td.textContent = text; return td; };
      cell("Any enhanced damage", r.n ? odds(r.any) : "-");
      for (const c of COLS) {
        const v = thrOf(t.key, c);
        if (v == null) { cell(`${c.value}%+`, "no stars", "never"); continue; }
        const p = r.n ? E.reach(curve(r), v) : null;
        const td = cell(`${c.value}%+`, odds(p), p != null && p <= 1e-15 ? "never" : "");
        if (v !== c.value) td.appendChild(el("span", "from", `from ${v}%`));
      }
      cell("Most", r.n && r.best ? `${r.best.sum + (r.cr ? r.cr.hi : 0) + (state.c ? maxCorr : 0)}%` : "-");
    }
    $("eoTypesLede").textContent = `${setupWords()}, ${state.c ? "each with a corruption that adds enhanced damage" : "not corrupted"}.`;
  }
  const maxCorr = Math.max(...DATA.corr.map(c => c.hi));

  // ---------- one weapon type ----------
  const SERIES = [
    { key: "u", label: "Not corrupted", color: "var(--s1)", dash: "" },
    { key: "c", label: "With an ED corruption", color: "var(--s2)", dash: "8 4" },
  ];
  const SVG = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs, parent) => { const n = document.createElementNS(SVG, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  function keyMark(s, w) {
    const svg = mk("svg", { width: w, height: 6, "aria-hidden": "true" });
    mk("line", { x1: 1, x2: w - 1, y1: 3, y2: 3, stroke: s.color, "stroke-width": 2, "stroke-dasharray": s.dash || "none" }, svg);
    return svg;
  }
  $("eoLegend").append(...SERIES.map(s => { const sp = el("span"); sp.append(keyMark(s, 22), s.label); return sp; }));

  let hover = null;
  function renderOne() {
    const t = TYPE[state.t], r = result(t.key);
    $("eoType").value = t.key;
    $("eoOneH").textContent = `${t.label}, ${state.q === "craft" ? "crafted" : "rare"}`;
    $("eoOneLede").textContent = "The share of these weapons with at least each amount of enhanced damage, not corrupted and with a corruption that adds enhanced damage. The lines mark where the stars start.";
    // how many reach each star
    const tb = $("eoReach").tBodies[0]; tb.textContent = "";
    for (const c of COLS) for (const tier of c.tiers) {
      const v = DATA.thresholds[t.key][tier.key], tr = tb.insertRow();
      const td = tr.insertCell(); td.append(game(starsOf(tier.look), "mini"));
      if (tier.clvl) td.appendChild(el("span", "sub", CLVL[tier.clvl]));
      const n = (text, cls) => { const x = tr.insertCell(); x.className = "n" + (cls ? " " + cls : ""); x.textContent = text; };
      if (v == null) { n("no stars", "never"); n(""); n(""); continue; }
      n(`${v}%`);
      for (const k of ["u", "c"]) { const p = r.n ? E.reach(r[k], v) : null; n(odds(p), p != null && p <= 1e-15 ? "never" : ""); }
    }
    // the facts
    const dl = $("eoFacts"); dl.textContent = "";
    const fact = (k, v) => dl.append(el("dt", "", k), el("dd", "", v));
    if (r.n && r.best) {
      const most = r.best.sum + (r.cr ? r.cr.hi : 0);
      const parts = r.best.tops.map(a => `${a.name} ${a.lo}–${a.hi}%`).concat(r.cr && r.cr.hi ? [`the craft's ${r.cr.lo}–${r.cr.hi}%`] : []);
      fact("Most enhanced damage", `${most}% (${words(parts)})`);
      fact("With a corruption", `up to ${most + maxCorr}%`);
      fact("Any enhanced damage", odds(r.any));
      fact("Affixes", countWords(r.counts).replace(" affixes", "").replace(" affix", "") + (state.q === "craft" ? ` random (crafted item level ${r.cil})` : ""));
    } else for (const k of ["Most enhanced damage", "With a corruption", "Any enhanced damage", "Affixes"]) fact(k, "-");  // the same rows: nothing below moves
    $("eoBasesSum").textContent = `The ${r.n} base${r.n === 1 ? "" : "s"} counted, each the same`;
    $("eoBasesList").textContent = r.n ? words(r.bases.slice()) + "." : "None.";
    drawChart(r);
  }
  function countWords(counts) {
    const ks = Object.keys(counts).map(Number), lo = Math.min(...ks), hi = Math.max(...ks);
    return lo === hi ? `${lo} random affix${lo > 1 ? "es" : ""}` : `${lo}–${hi} random affixes`;
  }

  function drawChart(r) {
    const plot = $("eoPlot"), hadFocus = plot.contains(document.activeElement);
    plot.textContent = "";
    if (!r.n) { plot.appendChild(el("p", "eo-lede", `No ${low(TYPE[state.t].label)} base drops at this item level.`)); return; }
    const W = Math.max(300, Math.round(plot.clientWidth || 640)), narrow = W < 560;
    const H = narrow ? 260 : 300, m = { l: narrow ? 62 : 76, r: 14, t: 34, b: 44 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const last = s => { let i = E.N - 1; while (i > 0 && s[i] <= 1e-15) i--; return i; };
    const marks = [];
    for (const c of COLS) { const v = thrOf(state.t, c); if (v != null && !marks.some(x => x.v === v)) marks.push({ v, c }); }
    const xmax = Math.min(E.N - 1, Math.ceil((Math.max(last(r.c), ...marks.map(x => x.v)) + 25) / 50) * 50);
    let lo = 0;
    for (const s of [r.u, r.c]) for (let i = 0; i <= xmax; i++) if (s[i] > 1e-15) lo = Math.min(lo, Math.floor(Math.log10(s[i])));
    const ymin = Math.max(-10, Math.min(-3, lo));
    const X = v => m.l + iw * v / xmax;
    const Y = p => m.t + ih * (p > 0 ? Math.max(Math.log10(p), ymin) : ymin) / ymin;
    const yLab = d => d === 0 ? "all" : d === -1 ? "10%" : "1 in " + (d <= -9 ? (10 ** (-d - 9)) + "B" : d <= -6 ? (10 ** (-d - 6)) + "M" : num(10 ** -d));
    const svg = mk("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", tabindex: "0",
      "aria-label": `The share of ${state.q === "craft" ? "crafted" : "rare"} ${low(TYPE[state.t].label)} with at least each amount of enhanced damage, not corrupted and with an enhanced damage corruption; the table beside it lists the stars' numbers` }, plot);
    const g = mk("g", {}, svg);
    for (let d = 0; d >= ymin; d--) {
      mk("line", { x1: m.l, x2: W - m.r, y1: Y(10 ** d), y2: Y(10 ** d), stroke: "var(--grid)", "stroke-width": 1, "shape-rendering": "crispEdges" }, g);
      if (!narrow || d % 2 === 0) { const t = mk("text", { x: m.l - 8, y: Y(10 ** d) + 4, "text-anchor": "end" }, g); t.textContent = yLab(d); }
    }
    mk("line", { x1: m.l, x2: W - m.r, y1: m.t + ih, y2: m.t + ih, stroke: "var(--axis)", "stroke-width": 1, "shape-rendering": "crispEdges" }, g);
    const step = xmax > 400 && narrow ? 200 : xmax > 400 ? 100 : 50;
    for (let v = 0; v <= xmax; v += step) {
      mk("line", { x1: X(v), x2: X(v), y1: m.t + ih, y2: m.t + ih + 4, stroke: "var(--axis)", "stroke-width": 1 }, g);
      const t = mk("text", { x: X(v), y: m.t + ih + 17, "text-anchor": "middle" }, g); t.textContent = v + "%";
    }
    const xt = mk("text", { x: m.l + iw / 2, y: H - 4, "text-anchor": "middle", class: "axis-title" }, g); xt.textContent = "Enhanced damage, at least";
    // where the stars start: a line and the outer stars' color beside the number. The tags share one row (the author,
    // 2026-11-25: the 300% tag a row down looked misaligned): each right of its line, or left of it where the next one
    // would run into it (or past the chart's right edge); a second row only where neither side has room (phones)
    const tags = [];
    for (const { v, c } of marks.sort((a, b) => a.v - b.v)) {
      const px = X(v);
      mk("line", { x1: px, x2: px, y1: m.t - 4, y2: m.t + ih, stroke: "var(--fg2)", "stroke-width": 1, opacity: 0.45, "shape-rendering": "crispEdges" }, g);
      const col = (starsOf(c.tiers[c.tiers.length - 1].look)[0] || ["WHITE"])[0];
      const rect = mk("rect", { x: px - 9, y: 4, width: 6, height: 8, rx: 1, fill: DATA.colors[col] }, g);
      const t = mk("text", { x: px - 1, y: 12, class: "mark" }, g); t.textContent = v + "%";
      let w = 0;
      try { w = t.getComputedTextLength(); } catch (e) { /* not drawn */ }
      tags.push({ px, rect, t, w: w || 7.5 * t.textContent.length, left: false, row: 0 });
    }
    const span = k => k.left ? [k.px - 12 - k.w, k.px - 4] : [k.px - 9, k.px - 1 + k.w];
    const fits = (k, prev) => span(k)[0] >= 0 && span(k)[1] <= W && (!prev || span(prev)[1] + 6 <= span(k)[0]);
    const row0 = [];
    for (const k of tags) {
      const a = row0[row0.length - 1], before = row0[row0.length - 2];
      if (fits(k, a)) { row0.push(k); continue; }
      k.left = true;  // its own left side (the last one, at the right edge)
      if (fits(k, a)) { row0.push(k); continue; }
      k.left = false;
      if (a && !a.left) {  // the one before it on its left
        a.left = true;
        if (fits(a, before) && fits(k, a)) { row0.push(k); continue; }
        a.left = false;
      }
      k.row = 1;
    }
    for (const k of tags) {
      const y = 12 + k.row * 13, [x0] = span(k);
      if (k.left) {
        k.t.setAttribute("text-anchor", "end");
        k.t.setAttribute("x", k.px - 4);
        k.rect.setAttribute("x", x0);
      }
      k.t.setAttribute("y", y);
      k.rect.setAttribute("y", y - 8);
    }
    // the two lines, each to its last ED, then down
    for (const s of SERIES) {
      const sv = r[s.key], end = last(sv);
      let d = "";
      for (let v = 0; v <= Math.min(end, xmax); v++) d += (v ? "L" : "M") + X(v).toFixed(1) + "," + Y(sv[v]).toFixed(1);
      d += "L" + X(Math.min(end, xmax)).toFixed(1) + "," + Y(0).toFixed(1);
      const attrs = { d, fill: "none", stroke: s.color, "stroke-width": 2, "stroke-linejoin": "round" };
      if (s.dash) attrs["stroke-dasharray"] = s.dash;
      mk("path", attrs, svg);
    }
    // no label on the lines (the author, 2026-11-25: "I'm not sure we need to label on the graph itself if we have a
    // legend ... the labels clutter the space"): the legend above names them, each with its own dash
    // the hover layer
    const cross = mk("line", { y1: m.t, y2: m.t + ih, stroke: "var(--fg2)", "stroke-width": 1, opacity: 0 }, svg);
    const dots = SERIES.map(s => mk("circle", { r: 4, fill: s.color, stroke: "var(--panel)", "stroke-width": 2, opacity: 0 }, svg));
    const hit = mk("rect", { x: m.l, y: 0, width: iw, height: m.t + ih + 20, fill: "transparent", style: "cursor: crosshair" }, svg);
    const tip = el("div", "eo-tip"); tip.hidden = true; plot.appendChild(tip);
    const show = (v, px) => {
      v = Math.max(0, Math.min(xmax, Math.round(v)));
      hover = v;
      cross.setAttribute("x1", X(v)); cross.setAttribute("x2", X(v)); cross.setAttribute("opacity", 0.6);
      SERIES.forEach((s, k) => { const p = r[s.key][v]; dots[k].setAttribute("cx", X(v)); dots[k].setAttribute("cy", Y(p)); dots[k].setAttribute("opacity", p > 1e-15 ? 1 : 0); });
      tip.textContent = "";
      tip.appendChild(el("div", "eo-tip-head", `${v}% enhanced damage or more`));
      for (const s of SERIES) {
        const row = el("div", "eo-tip-row");
        row.append(keyMark(s, 18), el("b", "", odds(E.reach(r[s.key], v))), el("span", "", s.label));
        tip.appendChild(row);
      }
      tip.hidden = false;
      const pw = plot.clientWidth, tw = tip.offsetWidth, scale = pw / W, xpx = px !== undefined ? px : X(v) * scale;
      let left = xpx + 14; if (left + tw > pw) left = Math.max(0, xpx - tw - 14);
      tip.style.left = left + "px"; tip.style.top = Math.max(0, (m.t + 6) * scale) + "px";
    };
    const hide = () => { cross.setAttribute("opacity", 0); dots.forEach(d => d.setAttribute("opacity", 0)); tip.hidden = true; };
    const toV = ev => { const b = svg.getBoundingClientRect(); const x = (ev.clientX - b.left) * W / b.width; return { v: (x - m.l) / iw * xmax, px: ev.clientX - b.left }; };
    hit.addEventListener("pointermove", ev => { const p = toV(ev); show(p.v, p.px); });
    hit.addEventListener("pointerdown", ev => { const p = toV(ev); show(p.v, p.px); });
    hit.addEventListener("pointerleave", hide);
    svg.addEventListener("focus", () => show(hover ?? (marks[0] ? marks[0].v : 0)));
    svg.addEventListener("blur", hide);
    svg.addEventListener("keydown", ev => {
      const cur = hover ?? 0, d = ev.shiftKey ? 50 : 10;
      if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") { ev.preventDefault(); show(cur + (ev.key === "ArrowRight" ? d : -d)); }
      else if (ev.key === "Home" || ev.key === "End") { ev.preventDefault(); show(ev.key === "Home" ? 0 : xmax); }
      else if (ev.key === "Escape") hide();
    });
    if (hadFocus) svg.focus({ preventScroll: true });
  }

  // ---------- the stars and how it's worked out (these follow the filter, not the setup) ----------
  function renderStars() {
    const tb = $("eoStars").tBodies[0];
    for (const c of COLS) for (const t of c.tiers) {
      const tr = tb.insertRow();
      tr.insertCell().appendChild(game(lineOf(t.look, c.value)));
      const f = tr.insertCell(); f.className = "n"; f.textContent = `${c.value}%`;
      const none = TYPES.filter(k => DATA.thresholds[k.key][t.key] == null).map(k => low(k.label));
      tr.insertCell().textContent = CLVL[t.clvl] + (none.length ? `, not on ${words(none)}` : "");
    }
    const tag = DATA.tag, box = $("eoTag");
    const a = el("span"), b = el("span");
    a.append(game(lineOf(tag.below, 312), "tag"), `below ${tag.from}% ("ed" in red)`);
    b.append(game(lineOf(tag.look, 412), "tag"), `from ${tag.from}% ("ed" in purple)`);
    box.append(el("span", "", "The tag before the item's name:"), a, b);
  }
  function renderHow() {
    const how = $("eoHow");
    const ed = E.AFF.map((a, i) => ({ ...a, i })).filter(a => a.hi > 0).sort((a, b) => a.g - b.g || a.lo - b.lo);
    const typesOf = i => TYPES.filter(t => DATA.bases.some(b => DATA.types[b[2]][0] === t.key && DATA.pools[b[5]].includes(i)));
    const p = html => { const x = el("p"); x.innerHTML = html; how.appendChild(x); };
    const table = (heads, rows) => {
      const wrap = el("div", "scroll"), t = el("table"), h = t.createTHead().insertRow(), body = t.createTBody();
      heads.forEach(([text, cls]) => { const th = el("th", cls || "", text); th.scope = "col"; h.appendChild(th); });
      rows.forEach(r => { const tr = body.insertRow(); r.forEach((v, k) => { const td = tr.insertCell(); td.textContent = v; if (heads[k][1]) td.className = heads[k][1]; }); });
      wrap.appendChild(t); how.appendChild(wrap);
    };
    const tiered = ed.filter(a => a.ver >= 101 && a.ver <= 104);
    p("Every number on this page is worked out from how the game rolls a rare or crafted weapon, counting every way it can roll; none are drawn at random.");
    p("<b>Prefixes.</b> Enhanced damage comes only from a weapon's prefixes, from two groups: enhanced damage (Jagged to Visceral) and enhanced damage with attack rating (Sharp to Master's, and Grandmaster's on bows and crossbows). A weapon can have one of each, and their enhanced damage adds up. Each prefix is picked by its weight among the groups not on the weapon yet, so the other prefixes (resistances, skills, elemental damage...) make enhanced damage rarer.");
    table([["Prefix"], ["Enhanced damage", "n"], ["Affix level", "n"], ["Weight", "n"], ["Rolls on"]],
      ed.map(a => {
        const ts = typesOf(a.i), all = ts.length === TYPES.length;
        return [a.name, `${a.lo}–${a.hi}%`, a.max ? `${a.level}–${a.max}` : `${a.level}+`, num(a.freq * 10),
          (a.rare === 3 ? "rares" : "rares and crafts") + (all ? "" : ` (${words(ts.map(t => low(t.label)))})`)];
      }));
    p("<b>Affix level.</b> A prefix rolls only within its affix levels. A weapon's affix level comes from its item level and its base's quality level (q): the item level less half of q, or twice the item level less 99 once that is higher. So an elite base needs a higher item level than a normal one for the same prefixes.");
    p(`<b>Rares.</b> A rare has 6 affixes from item level 85, 5–6 from 65, 4–6 from 45, and 3–6 below. Each is a prefix or a suffix at even odds, at most 3 of each, so from item level 85 every rare has 3 prefixes.`);
    p(`<b>Crafts.</b> A crafted weapon's item level is half your character level plus half the base's item level. It gets at least 1, 2, 3, or 4 random affixes at a crafted item level up to 30, 31–50, 51–70, or 71 and up, and a roll of 0–4 can give it more, up to 4. Visceral never rolls on a craft. The craft adds its own enhanced damage:`);
    table([["Craft"], ["Enhanced damage", "n"]], DATA.crafts.map(c => [words(c.names).replace(/ and ([^,]*)$/, " or $1"), c.hi ? `+${c.lo}–${c.hi}%` : "none"]));
    const maps = DATA.areas.filter(a => a[2]);
    p(`<b>Maps.</b> In a map, monsters and the items they drop are of the map's area level: ${words(maps.map(a => `${a[3]} in a ${a[1]}`))} (champions 2 higher, unique monsters 3). There the tiered prefixes are picked more often: ${words(maps.map(a => `${10 * (a[2] + 1)}% more in a ${a[1]}`))}, but no more than the prefix's own tier allows (${words(tiered.map(a => `${a.name} +${10 * (a.ver - 100 + 1)}%`))}). The cube makes crafts, so they get no map bonus.`);
    p(`<b>Corruption.</b> ${Math.round(E.CORR_W / 10)}% of corruptions on a weapon without sockets add enhanced damage; the rest add none. "Adds enhanced damage" in the bar counts only weapons that got one of these:`);
    table([["Enhanced damage", "n"], ["Also"], ["Share of corruptions", "n"]],
      DATA.corr.map(c => [`+${c.lo}–${c.hi}%`, c.with || "nothing else", `${(c.per1000 / 10).toFixed(1)}%`]));
    p(`<b>Bases.</b> Every base of the weapon type that drops at the item level counts the same, ethereal or not. Javelins and Amazon javelins are their own types, apart from spears. Claws and Amazon weapons roll only their own class's skill prefixes, which changes their odds a little. For the odds of one exact item, with its other affixes too, see the <a href="../item-builder/">Item Builder</a>; for what else a corruption can do, <a href="../corruption-outcomes/">Corruption Outcomes</a>.`);
  }

  // ---------- state, the address, Reset and Copy ----------
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* a private window */ }
    const q = new URLSearchParams({ quality: state.q === "craft" ? "crafted" : "rare" });
    for (const k of state.q === "craft" ? ["craft", "cl", "bil", "b", "c", "t"] : ["at", "il", "b", "c", "t"]) q.set(k, String(state[k]));
    try { history.replaceState(null, "", location.pathname + "?" + q.toString() + location.hash); } catch (e) { /* a file */ }
    resetBtn();
  }
  let undo = null;
  const isDef = () => Object.keys(DEF).every(k => String(state[k]) === String(DEF[k]));
  function resetBtn() {
    if (undo && !isDef()) undo = null;
    $("eoReset").textContent = undo ? "Undo reset" : "Reset to the defaults";
    $("eoReset").disabled = !undo && isDef();
  }
  $("eoReset").addEventListener("click", () => {
    if (undo) { const was = undo.was; undo = null; Object.assign(state, was); render(); return; }
    undo = { was: Object.assign({}, state) };
    Object.assign(state, DEF);
    render();
  });
  $("eoCopy").addEventListener("click", () => {
    save();
    const note = $("eoCopyNote"), link = location.href;
    const done = ok => { note.textContent = ok ? "Copied." : link; if (ok) setTimeout(() => { note.textContent = ""; }, 2500); };
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => done(true), () => done(false)); else done(false);
  });

  function renderBar() {
    document.querySelectorAll(".edodds-map [data-q]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.q === state.q)));
    document.querySelectorAll(".edodds-map [data-c]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.c === state.c)));
    document.querySelectorAll(".edodds-map .eo-f[data-for]").forEach(f => { f.hidden = f.dataset.for !== state.q; });
    const put = (id, v) => { if (document.activeElement !== $(id)) $(id).value = v; };
    $("eoAt").value = state.at; put("eoIl", state.il);
    $("eoCraft").value = String(state.craft); put("eoCl", state.cl); put("eoBil", state.bil);
    $("eoBases").value = state.b;
    if (state.q === "craft") {
      const cil = E.craftLevel(state.cl, state.bil);
      $("eoNote").textContent = `Crafted item level ${cil}: ${countWords(E.craftCounts(cil))}. Bases that drop at item level ${state.bil} count.`;
    } else {
      $("eoNote").textContent = `A rare of item level ${state.il} has ${countWords(E.rareCounts(state.il)).replace("random ", "")}.`
        + (AREA[state.at][2] ? " Champions drop items 2 levels higher, unique monsters 3." : "");
    }
  }
  function render() {
    fit();
    renderBar(); renderTable(); renderOne(); save();
  }

  document.querySelectorAll(".edodds-map [data-q]").forEach(b => b.addEventListener("click", () => { state.q = b.dataset.q; render(); }));
  document.querySelectorAll(".edodds-map [data-c]").forEach(b => b.addEventListener("click", () => { state.c = +b.dataset.c; render(); }));
  $("eoAt").addEventListener("change", () => { state.at = $("eoAt").value; const lvl = AREA[state.at][3]; if (lvl) state.il = lvl; render(); });
  $("eoCraft").addEventListener("change", () => { state.craft = +$("eoCraft").value; render(); });
  $("eoBases").addEventListener("change", () => { state.b = $("eoBases").value; render(); });
  $("eoType").addEventListener("change", () => { state.t = $("eoType").value; render(); });
  let typing = null;
  for (const [id, k] of [["eoIl", "il"], ["eoCl", "cl"], ["eoBil", "bil"]]) {
    const inp = $(id);
    inp.addEventListener("input", () => {
      if (inp.value === "" || !Number.isFinite(+inp.value)) return;
      clearTimeout(typing);
      typing = setTimeout(() => { state[k] = clampLvl(inp.value); render(); }, 250);
    });
    inp.addEventListener("change", () => { clearTimeout(typing); state[k] = clampLvl(inp.value); render(); });
  }
  $("eoTable").addEventListener("click", ev => {
    const b = ev.target.closest("button.pick");
    if (!b) return;
    state.t = b.dataset.t;
    render();
    const sec = $("one-type"), bar = $("eoBar");
    const header = document.querySelector(".md-header"), sticky = getComputedStyle(bar).position === "sticky";
    sec.style.scrollMarginTop = ((header ? header.offsetHeight : 0) + (sticky ? bar.offsetHeight : 0) + 8) + "px";
    sec.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  });
  let resizing = null;
  window.addEventListener("resize", () => { clearTimeout(resizing); resizing = setTimeout(() => drawChart(result(state.t)), 150); });

  renderStars();
  renderHow();
  render();
})();
