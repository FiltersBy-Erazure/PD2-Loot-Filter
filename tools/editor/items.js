/* The Filter Editor's items: the catalog the page carries (tools/editor_map.py: the game's bases, unique and set items,
   stats and skills, from docs/) and the items the preview runs through the filter, made the way the game makes them
   (EZ.engine's item: the game's raw stat values, BH's lists).

   An item spec (what the preview keeps and the player edits): {code, quality (NORM SUP INF MAG RARE CRAFT UNI SET),
   uni (a unique or set item's index in the catalog), roll (0..1 within its ranges, 1 = the best), id, eth, sockets,
   filled (items in its sockets), ilvl, stats [[stat, param, value as shown]], qty, gold, rw (a runeword's name),
   corrupt (the corruption outcome, stat 360), name (a magic or rare item's name), place, discovered, owned, sell, buy,
   lvlreq}. Left out: the game's defaults (identified when it can't be otherwise, item level 85, no sockets, on the
   ground, discovered). */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.items = (function () {
  "use strict";
  let C = null;
  const NMAG = {NORM: 1, SUP: 1, INF: 1};
  const QUALITY_NAMES = {NORM: "Normal", SUP: "Superior", INF: "Low quality", MAG: "Magic", RARE: "Rare",
                         CRAFT: "Crafted", UNI: "Unique", SET: "Set"};
  const key = (sid, p) => p ? sid + "," + p : String(sid);

  function init(data) {
    if (C) return C;
    const cat = (data && data.catalog) || {bases: [], uniques: [], stats: [], skills: [], baseFields: [], cats: [],
                                            flags: {}};
    const FL = cat.flags;
    const bases = new Map();
    for (const row of cat.bases) {
      const o = {};
      cat.baseFields.forEach((f, i) => { o[f] = row[i]; });
      o.groups = o.groups ? o.groups.split(" ") : [];
      o.types = o.types ? o.types.split(",") : [];
      o.cat = cat.cats[o.cat] || "Other";
      const fl = o.flags;
      Object.assign(o, {canEth: !!(fl & FL.eth), staffmod: !!(fl & FL.staffmod), quest: !!(fl & FL.quest),
                        map: !!(fl & FL.map), stack: !!(fl & FL.stack), spawnable: !!(fl & FL.spawnable),
                        nodur: !!(fl & FL.nodur), misc: o.groups.indexOf("MISC") >= 0,
                        armor: o.groups.indexOf("ARMOR") >= 0, weapon: o.groups.indexOf("WEAPON") >= 0});
      if (o.dmg) [o.mindam, o.maxdam, o.min2, o.max2, o.minmis, o.maxmis] = o.dmg;
      o.hand = o.hand || 1;
      bases.set(o.code, o);
    }
    for (const b of bases.values()) {
      const u = b.up && bases.get(b.up);
      b.up = u ? {code: u.code, reqstr: u.reqstr, reqdex: u.reqdex, lvlreq: u.lvlreq} : null;
    }
    const uniques = cat.uniques.map(([kind, name, code, lvlreq, eth, props, set], index) =>
      ({index, kind: kind ? "SET" : "UNI", name, code, lvlreq, eth: !!eth, props, set}));
    const stats = new Map(cat.stats.map(([id, name, shift, pri, text, neg, str2, func, val, dgrp, gfunc, gval, gpos, op,
                                          opParam]) =>
      [id, {id, name, shift, pri, text, neg, str2, func, val, dgrp, gfunc, gval, gpos, op, opParam}]));
    const skills = new Map(cat.skills.map(([id, name, cls, tab]) => [id, {id, name, cls,
      tab: tab === undefined || tab < 0 ? null : tab}]));
    C = {bases, uniques, stats, skills, cats: cat.cats, statMax: cat.statMax || 1023, skillMax: cat.skillMax || 1023,
         townIds: cat.townIds || [1, 40, 75, 103, 109], strings: cat.strings || {}};
    return C;
  }

  const base = (code) => C && C.bases.get(code);
  const unique = (i) => C && C.uniques[i];

  /* The game's name for the item (its string's first line is drawn at the bottom: base first, then the item's own
     name). */
  function gameName(spec, b, u) {
    const q = spec.quality || "NORM", n = b.name;
    if (b.code === "gld") return (spec.gold || 1) + " Gold";
    if (spec.rw) return n + "\n" + spec.rw;
    if (q === "SUP") return "Superior " + n;
    if (q === "INF") return "Cracked " + n;
    if (!spec.id || NMAG[q]) return n;
    if (q === "MAG") return spec.name || n;
    if (q === "RARE" || q === "CRAFT") return n + "\n" + (spec.name || "Grim Visage");
    if (u) return n + "\n" + u.name;
    return n;
  }

  /* The engine's item for a spec (see EZ.engine). Unidentified, an item has none of its own properties (the game
     doesn't send them); a non-magical one is always identified. */
  function make(spec) {
    const b = base(spec.code);
    if (!b) return null;
    const q = spec.quality || "NORM";
    const u = (q === "UNI" || q === "SET") && spec.uni != null ? unique(spec.uni) : null;
    const id = NMAG[q] ? true : spec.id !== undefined ? !!spec.id : false;
    const own = {}, list = {}, stats = {};
    const add = (map, sid, p, v) => { const k = key(sid, p); map[k] = (map[k] || 0) + v; };
    const roll = spec.roll === undefined ? 1 : spec.roll;
    // the item's own properties: a unique's or set item's, the player's (as shown), a corruption
    if (u && id && !spec.noProps) {
      for (const [sid, p, lo, hi] of u.props) add(own, sid, p, Math.round(lo + (hi - lo) * roll));
    }
    const shown = (map, list) => {
      for (const [sid, p, v] of list || []) {
        const s = C.stats.get(sid);
        add(map, sid, p || 0, Math.round(v * (1 << (s ? s.shift : 0))));
      }
    };
    shown(own, spec.stats);
    if (spec.corrupt) own[key(360, 0)] = spec.corrupt;
    for (const k of Object.keys(own)) stats[k] = own[k];
    // what the socket fillers bring (BH's stat words read them, its special stats' list too)
    const sock = {};
    shown(sock, spec.sockStats);
    for (const k of Object.keys(sock)) stats[k] = (stats[k] || 0) + sock[k];
    for (const sid of [16, 17, 18, 21, 22, 23, 24, 31, 159, 160]) {
      const v = (own[key(sid, 0)] || 0) + (sock[key(sid, 0)] || 0);
      if (v) list[sid] = v;
    }
    // what the base and the item's state give
    const sockets = Math.max(0, Math.min(spec.sockets || 0, 6));
    if (sockets) stats["194"] = (stats["194"] || 0) + sockets;
    if (b.code === "gld") stats["14"] = spec.gold || 1;
    if (b.stack || spec.qty) stats["70"] = spec.qty || 1;
    const eth = !!spec.eth || !!(u && u.eth);
    if (b.dur && !b.nodur) { stats["72"] = b.dur; stats["73"] = b.dur; }
    if (spec.def !== undefined) stats["31"] = spec.def;
    else if (b.armor && b.maxac) {
      const ed = own["16"] || 0, flat = own["31"] || 0;
      let d = b.maxac + (ed > 0 ? 1 : 0);
      if (eth) d = Math.floor(d * 3 / 2);
      stats["31"] = Math.floor(d * (100 + ed) / 100) + flat;
    }
    if (b.weapon && b.dmg) {
      const ethd = (x) => eth ? Math.floor(x * 3 / 2) : x;
      if (b.mindam || b.maxdam) { stats["21"] = ethd(b.mindam) + (own["21"] || 0); stats["22"] = ethd(b.maxdam) + (own["22"] || 0); }
      if (b.min2 || b.max2) { stats["23"] = ethd(b.min2) + (own["23"] || 0); stats["24"] = ethd(b.max2) + (own["24"] || 0); }
      if (b.minmis || b.maxmis) { stats["159"] = ethd(b.minmis) + (own["159"] || 0); stats["160"] = ethd(b.maxmis) + (own["160"] || 0); }
    }
    const disc = (q === "UNI" || q === "SET") ? {
      ALLDISCOVERED: spec.discovered !== false, ANYDISCOVERED: spec.discovered !== false,
      ALLOWNED: spec.owned !== false, ANYOWNED: spec.owned !== false} : {
      ALLDISCOVERED: false, ANYDISCOVERED: false, ALLOWNED: false, ANYOWNED: false};
    return {
      code: b.code, base: b, quality: q, id, eth, rw: !!spec.rw, socketed: Math.min(spec.filled || 0, sockets),
      ilvl: spec.ilvl === undefined ? 85 : spec.ilvl, stats, list, own,
      prefixes: spec.prefixes || [], suffixes: spec.suffixes || [], automod: spec.automod === undefined ? -1 : spec.automod,
      place: spec.place || "GROUND", disc, gameName: gameName(Object.assign({}, spec, {id, quality: q}), b, u),
      lvlreq: spec.lvlreq !== undefined ? spec.lvlreq : Math.max(b.lvlreq || 0, u ? u.lvlreq : 0),
      sell: spec.sell, buy: spec.buy,
    };
  }

  /* A short description of the spec: "Ethereal Superior Thresher, 4 sockets". */
  function describe(spec) {
    const b = base(spec.code);
    if (!b) return spec.code || "?";
    const q = spec.quality || "NORM";
    const u = spec.uni != null ? unique(spec.uni) : null;
    const plain = b.name.replace(/ÿc./g, "");
    const parts = [];
    if (spec.eth) parts.push("Ethereal");
    if (u) parts.push(u.name + (u.name !== plain ? " (" + plain + ")" : ""));
    else {
      if (q !== "NORM" || !b.misc) parts.push(q === "NORM" ? "" : QUALITY_NAMES[q]);
      parts.push(b.code === "gld" ? (spec.gold || 1) + " Gold" : plain);
    }
    let s = parts.filter(Boolean).join(" ");
    if (spec.sockets) s += ", " + spec.sockets + " socket" + (spec.sockets > 1 ? "s" : "");
    if (spec.rw) s += ", " + spec.rw;
    if (!NMAG[q] && !spec.id && (q !== "NORM")) s += ", unidentified";
    return s;
  }

  /* Every item the player can pick: [{key, label, sub, spec}], bases (non-magical), then unique and set items. */
  let pickList = null;
  function picks() {
    if (pickList) return pickList;
    const out = [];
    for (const b of C.bases.values()) {
      if (!b.spawnable && !b.quest && b.code !== "gld" && !/^(pk|t[0-9]|bet|ceh|fed|tes|ubr)/.test(b.code)) continue;
      const plain = b.name.replace(/ÿc./g, "");
      out.push({key: "b:" + b.code, label: plain, sub: b.cat === "Other" ? "Misc" : b.cat, spec: {code: b.code}});
    }
    for (const u of C.uniques) {
      const b = base(u.code);
      if (!b) continue;
      out.push({key: "u:" + u.index, label: u.name, sub: (u.kind === "SET" ? "Set" : "Unique") + " · " +
        b.name.replace(/ÿc./g, ""), spec: {code: u.code, quality: u.kind, uni: u.index, id: true}});
    }
    pickList = out;
    return out;
  }

  /* Search the pick list: the best matches first (whole word starts, then anywhere). */
  function search(text, limit) {
    const q = text.trim().toLowerCase();
    if (!q) return [];
    const words = q.split(/\s+/);
    const scored = [];
    for (const p of picks()) {
      const hay = (p.label + " " + p.sub + " " + p.spec.code).toLowerCase();
      if (!words.every((w) => hay.indexOf(w) >= 0)) continue;
      const l = p.label.toLowerCase();
      const score = (l === q ? 0 : l.startsWith(q) ? 1 : hay.split(/[\s·(),]+/).some((w) => w.startsWith(words[0])) ? 2 : 3) +
                    (p.key[0] === "b" ? 0 : 0.5);
      scored.push([score, p]);
    }
    scored.sort((a, b) => a[0] - b[0] || a[1].label.localeCompare(b[1].label));
    return scored.slice(0, limit || 30).map((x) => x[1]);
  }

  /* ---------------------------------------------------------------- an item copied in the game

     BH copies the item under the mouse when the player presses Ctrl+C (StashExport::CopyItemJSONToClipboard): its
     base's name (type), quality, item level, place, ethereal, unidentified, sockets, defense, quantity, its own name,
     runeword, the items in its sockets, and its stats (the item's own stat list: a stat's id and value, life and mana
     as shown; skills, skill tabs, class skills, charges and chances to cast by name). */
  const QUALITY_WORDS = {None: "NORM", Inferior: "INF", Normal: "NORM", Superior: "SUP", Magic: "MAG", Set: "SET",
                         Rare: "RARE", Unique: "UNI", Crafted: "CRAFT"};
  const PLACE_WORDS = {Inventory: "INVENTORY", Equip: "EQUIPPED", Belt: "INVENTORY", Cube: "CUBE", Stash: "STASH"};
  const TAB_IDS = {"Bow and Crossbow Skills (Amazon)": 0, "Passive and Magic Skills (Amazon)": 1,
    "Javalin and Spear Skills (Amazon)": 2, "Fire Skills (Sorceress)": 8, "Lightning Skills (Sorceress)": 9,
    "Cold Skills (Sorceress)": 10, "Curses Skills (Necromancer)": 16, "Poison and Bone Skills (Necromancer)": 17,
    "Summoning Skills (Necromancer)": 18, "Combat Skills (Paladin)": 24, "Offensive Auras (Paladin)": 25,
    "Defensive Auras (Paladin)": 26, "Combat Skills (Barbarian)": 32, "Masteries (Barbarian)": 33,
    "Warcries (Barbarian)": 34, "Summoning (Druid)": 40, "Shapeshifting (Druid)": 41, "Elemental (Druid)": 42,
    "Traps (Assassin)": 48, "Shadow Desciplines (Assassin)": 49, "Martial Arts (Assassin)": 50};
  const CLASS_SKILL_IDS = {"Amazon Skills": 0, "Sorceress Skills": 1, "Necromancer Skills": 2, "Paladin Skills": 3,
                           "Barbarian Skills": 4, "Druid Skills": 5, "Assassin Skills": 6};
  const CAST_ON = [[/on attack/i, 195], [/when you kill|on kill/i, 196], [/when you die|on death/i, 197],
                   [/on striking/i, 198], [/level.?up/i, 199], [/when casting|on cast/i, 200], [/when struck/i, 201]];
  const plainName = (s) => String(s || "").replace(/ÿc./g, "").trim().toLowerCase();

  function skillId(name, prefer) {
    const n = plainName(name);
    let best = null;
    for (const s of C.skills.values()) {
      if (plainName(s.name) !== n) continue;
      if (prefer && prefer.has(s.id)) return s.id;
      if (best === null || (s.cls && !C.skills.get(best).cls)) best = s.id;
    }
    return best;
  }

  /* One stat of BH's copy -> [stat, param, value as shown], or a note. oskills: the unique's or set item's own
     table decides between +N to a skill (107) and +N to a skill of another class (97). */
  function gameStat(st, oskills) {
    if (st.stat_id !== undefined) return [+st.stat_id, 0, +st.value];
    if (st.skill !== undefined && st.charges !== undefined) {
      const id = skillId(st.skill);
      const cur = parseInt(String(st.charges), 10);
      return id === null ? "charges of " + st.skill : [204, (id << 6) | ((+st.level || 0) & 63), isNaN(cur) ? 1 : cur];
    }
    if (st.chance !== undefined) {
      const m = CAST_ON.find(([re]) => re.test(st.name || ""));
      const sk = /level \d+ (.+?) (?:on|when)/i.exec(st.name || "");
      const id = sk ? skillId(sk[1]) : null;
      return m && id !== null ? [m[1], (id << 6) | ((+st.level || 0) & 63), +st.chance] : "chance to cast: " + st.name;
    }
    if (st.skill !== undefined && TAB_IDS[st.skill] !== undefined) return [188, TAB_IDS[st.skill], +st.value];
    if (st.skill !== undefined && CLASS_SKILL_IDS[st.skill] !== undefined) return [83, CLASS_SKILL_IDS[st.skill], +st.value];
    if (st.skill !== undefined && /^\+\d+ to /.test(st.name || "")) {
      const id = skillId(st.skill, oskills);
      if (id === null) return "skill " + st.skill;
      return [oskills && oskills.has(id) ? 97 : 107, id, +st.value];
    }
    return st.name ? String(st.name) : "a stat";
  }

  /* BH's Ctrl+C text -> {spec, notes}; throws on text that isn't an item BH copied. */
  function fromGame(text) {
    let o;
    try { o = JSON.parse(String(text).trim()); } catch (e) { throw new Error("that isn't what the game copies (Ctrl+C in game)"); }
    if (Array.isArray(o)) o = o[0];
    if (!o || typeof o !== "object" || typeof o.type !== "string") throw new Error("that isn't an item the game copied");
    const cands = [...C.bases.values()].filter((b) => plainName(b.name) === plainName(o.type));
    if (!cands.length) throw new Error(`no base is called "${o.type}"`);
    const b = cands.find((x) => x.spawnable) || cands[0];
    const quality = o.isGem || o.isRune ? "NORM" : QUALITY_WORDS[o.quality] || "NORM";
    const spec = {code: b.code, quality, ilvl: +o.iLevel || 1, eth: !!o.isEthereal, id: !o.unidentified,
                  sockets: +o.sockets || 0, place: PLACE_WORDS[o.location] || "INVENTORY", stats: [], noProps: true};
    if (o.quantity) spec.qty = +o.quantity;
    if (o.defense) spec.def = +o.defense;
    if (o.isRuneword) spec.rw = String(o.runeword || "Runeword");
    let oskills = null;
    if (quality === "UNI" || quality === "SET") {
      const u = C.uniques.find((x) => x.name === o.name && x.code === b.code) || C.uniques.find((x) => x.name === o.name);
      if (u) {
        spec.uni = u.index;
        oskills = new Set(u.props.filter(([sid]) => sid === 97).map(([, p]) => p));
      }
    } else if (o.name && spec.id) spec.name = String(o.name);
    const notes = [];
    for (const st of o.stats || []) {
      const s = gameStat(st, oskills);
      if (Array.isArray(s)) spec.stats.push(s); else notes.push(s);
    }
    if (Array.isArray(o.socketed) && o.socketed.length) {
      spec.filled = o.socketed.length;
      spec.sockStats = [];
      let plain = 0;
      for (const f of o.socketed) {
        if (!f.stats) { plain++; continue; }
        for (const st of f.stats) {
          const s = gameStat(st, null);
          if (Array.isArray(s)) spec.sockStats.push(s);
        }
      }
      if (plain) notes.push(`${plain} socketed rune${plain > 1 ? "s or gems" : " or gem"}: the game's copy leaves out what they add`);
    }
    return {spec, notes};
  }

  /* ItemStatCost's descfunc forms (shop_map.describe): the value before (descval 1) or after (2) the string. */
  function describeStat(func, val, pos, s2, v) {
    const plus = v >= 0 ? "+" : "";
    if (pos.indexOf("%d") >= 0) return pos.replace("%d", String(v)).replace(/%%/g, "%");
    const forms = {1: plus + v, 2: v + "%", 3: String(v), 4: plus + v + "%", 5: v + "%", 6: plus + v, 7: v + "%",
                   8: plus + v + "%", 9: String(v), 12: plus + v, 19: String(v), 20: "-" + v + "%"};
    const n = forms[func] !== undefined ? forms[func] : String(v);
    let text = val === 0 ? pos : val === 2 ? pos + " " + n : n + " " + pos;
    if (func >= 6 && func <= 9 && s2) text += " " + s2;
    return text;
  }

  /* A stat's line as the game words it (shop_map.stat_text): v as shown; clvl for the per-level stats. */
  function statLine(sid, p, v, clvl) {
    const st = C.stats.get(sid);
    if (!st || !st.func) return statLabel(sid, p, v);
    if (st.op === 2 && clvl) v = Math.floor(v * clvl / (1 << st.opParam));  // per level, at the character's level
    const S = (k) => C.strings[k] || "";
    const plus = v >= 0 ? "+" : "";
    const sk = (id) => { const s = C.skills.get(id); return s ? s.name : String(id); };
    switch (st.func) {
      case 13: return plus + v + " " + S("class:" + p + ":StrAllSkills");
      case 14: {
        const cls = p >> 3, tab = p & 7;
        return S("class:" + cls + ":StrSkillTab" + (tab + 1)).replace("%d", String(v)) + " " + S("class:" + cls + ":StrClassOnly");
      }
      case 27: {
        const s = C.skills.get(p), cls = s ? CLASS_CODES.indexOf(s.cls) : -1;
        return plus + v + " to " + sk(p) + (cls >= 0 ? " " + S("class:" + cls + ":StrClassOnly") : "");
      }
      case 28: return plus + v + " to " + sk(p);
      case 24: return "Level " + (p & 63) + " " + sk(p >> 6) + " " + st.text.replace("%d", String(v)).replace("%d", String(v));
      case 15: return st.text.replace("%d%%", v + "%").replace("%d", String(p & 63)).replace("%s", sk(p >> 6));
      case 16: return st.text.replace("%d", String(v)).replace("%s", sk(p));
    }
    if (sid === 17) return "+" + v + "% Enhanced Damage";
    return describeStat(st.func, st.val, sid === 7 || sid === 9 || v >= 0 ? st.text : st.neg, st.str2, v);
  }
  const CLASS_CODES = ["ama", "sor", "nec", "pal", "bar", "dru", "ass"];

  /* The affix lines of an item, top first (highest descpriority first; a group of equal values as its one line). */
  function statLines(it, clvl) {
    const own = Object.keys(it.own).map((k) => { const [s, p] = k.split(","); return [+s, +(p || 0), it.own[k]]; })
      .filter(([s, , v]) => v && !HIDDEN_STATS.has(s) && C.stats.get(s));
    const shown = (s, v) => Math.trunc(v / (1 << ((C.stats.get(s) || {}).shift || 0)));
    const groups = {};
    for (const [s, , v] of own) { const g = C.stats.get(s).dgrp; if (g) (groups[g] = groups[g] || []).push([s, v]); }
    const members = {};
    for (const st of C.stats.values()) if (st.dgrp) (members[st.dgrp] = members[st.dgrp] || []).push(st.id);
    own.sort((x, y) => (C.stats.get(y[0]).pri - C.stats.get(x[0]).pri) || (y[0] - x[0]) || (y[1] - x[1]));
    const out = [], done = new Set();
    for (const [s, p, v] of own) {
      if (done.has(s + "," + p)) continue;
      const st = C.stats.get(s), g = st.dgrp;
      if (g && groups[g].length === members[g].length && new Set(groups[g].map((x) => x[1])).size === 1) {
        for (const m of members[g]) done.add(m + ",0");
        out.push(describeStat(st.gfunc, st.gval, st.gpos, "", shown(s, v)));
        continue;
      }
      out.push(statLine(s, p, shown(s, v), clvl));
    }
    return out;
  }

  /* A stat in words: "+1 to Lightning Skills (Sorceress)", "+40 to Life", "+3 to Nova". */
  function statLabel(sid, p, v) {
    const sk = (id) => { const s = C.skills.get(id); return s ? s.name : "skill " + id; };
    const plus = (v >= 0 ? "+" : "") + v;
    if (sid === 107 || sid === 97) return `${plus} to ${sk(p)}${sid === 97 ? " (any class)" : ""}`;
    if (sid === 83) return `${plus} to ${Object.keys(CLASS_SKILL_IDS).find((k) => CLASS_SKILL_IDS[k] === p) || "class " + p}`;
    if (sid === 188) return `${plus} to ${Object.keys(TAB_IDS).find((k) => TAB_IDS[k] === p) || "skill tab " + p}`;
    if (sid === 204) return `Level ${p & 63} ${sk(p >> 6)} (${v} charges)`;
    if (sid >= 195 && sid <= 201) return `${v}% chance to cast level ${p & 63} ${sk(p >> 6)}`;
    const s = C.stats.get(sid);
    const text = s && s.text ? s.text : (s ? s.name : "stat " + sid);
    if (/%\+?d/.test(text)) return text.replace(/%\+d/, plus).replace(/%d/, String(v)).replace(/%%/g, "%");
    return `${plus} ${text}${p ? " (" + p + ")" : ""}`;
  }

  /* ---------------------------------------------------------------- the hover box

     The game's hover box as one string drawn bottom up (shop_map.tooltip's order): the sockets line, the affix lines
     (blue), the filter's description (its first line lowest), the item and affix level, the base lines, the name, the
     Cost in a shop; a color carries on to the line above. */
  const QUALITY_TINT = {UNI: "2B2215", SET: "1C3418", RARE: "31311E", CRAFT: "2F2102", MAG: "1D1D31"};
  const CLASS_ONLY = [10917, 10918, 10919, 10920, 10921, 10922, 10923];
  const HIDDEN_STATS = new Set([14, 16, 17, 18, 21, 22, 23, 24, 31, 70, 72, 73, 92, 159, 160, 194, 356, 360]);

  function hoverText(it, r, ctx, opts) {
    opts = opts || {};
    const b = it.base, S = (id) => C.strings[id] || "";
    const W = "\u00ffc0", BLUE = "\u00ffc3", RED = "\u00ffc1", GRAY = "\u00ffc5";
    const v = (sid, p) => it.stats[p ? sid + "," + p : String(sid)] || 0;
    const shown = (sid, p) => {
      const s = C.stats.get(sid);
      return Math.trunc(v(sid, p) / (1 << (s ? s.shift : 0)));
    };
    const up = [];  // bottom first
    if (v(360)) up.push(RED + "Corrupted");
    if (it.eth) up.push(BLUE + S(22745));
    if (v(194)) up.push(BLUE + S(3453) + " (" + v(194) + ")");
    if (it.id) {
      const ed = it.base.armor ? shown(16, 0) : shown(17, 0);
      const lines = statLines(it, ctx && ctx.clvl).map((l) => BLUE + l);
      if (ed) lines.unshift(BLUE + "+" + ed + "% Enhanced " + (it.base.armor ? "Defense" : "Damage"));
      for (const l of lines.reverse()) up.push(l);
    }
    if (r && r.desc) for (const l of r.desc.split("\n")) up.push(l);
    if (opts.itemLevel) up.push(W + "Item Level: " + it.ilvl);
    const base = [];  // top first
    if (b.armor && v(31)) base.push(W + S(3461) + " " + (it.own["16"] || it.own["31"] ? BLUE : W) + v(31));
    if (b.groups.indexOf("SHIELD") >= 0 && b.block) base.push(W + S(11018) + W + b.block + "%");
    if (b.weapon && b.dmg) {
      const ed = it.own["17"] || 0, col = ed || it.own["21"] || it.own["22"] ? BLUE : W;
      const dmg = (lo, hi) => [Math.floor(lo * (100 + ed) / 100) + (it.own["21"] || 0),
                               Math.floor(hi * (100 + ed) / 100) + (it.own["22"] || 0)];
      if ((b.min2 || b.max2) && b.hand & 2) { const [lo, hi] = dmg(b.min2, b.max2); base.push(W + S(3466) + " " + col + lo + " " + S(3464) + " " + hi); }
      if ((b.mindam || b.maxdam) && b.hand & 1) { const [lo, hi] = dmg(b.mindam, b.maxdam); base.push(W + S(3465) + " " + col + lo + " " + S(3464) + " " + hi); }
      if (b.throw && (b.minmis || b.maxmis)) base.push(W + S(3467) + " " + b.minmis + " " + S(3464) + " " + b.maxmis);
    }
    if (b.dur && !b.nodur) base.push(W + S(3457) + " " + b.dur + " " + S(3463) + " " + b.dur);
    if (b.cls >= 0) base.push((ctx && ctx.cls === b.cls ? W : RED) + S(CLASS_ONLY[b.cls]));
    if (b.reqdex) base.push(W + S(3459) + " " + b.reqdex);
    if (b.reqstr) base.push(W + S(3458) + " " + b.reqstr);
    if (it.lvlreq > 1) base.push((ctx && ctx.clvl >= it.lvlreq ? W : RED) + S(3469) + " " + it.lvlreq);
    for (const l of base.reverse()) up.push(l);
    for (const l of (r && r.name ? r.name : it.gameName || "").split("\n")) up.push(l);
    return up.join("\n");
  }

  /* The stats a player can add, by name: [{id, name}] (the game's own wording where it has one). */
  function statChoices() {
    const out = [];
    for (const s of C.stats.values()) {
      const t = s.text ? s.text.replace(/%[a-z0-9+]+/gi, "").replace(/\s+/g, " ").trim() : "";
      out.push({id: s.id, name: (t ? t[0].toUpperCase() + t.slice(1) : s.name) + " (stat " + s.id + ")"});
    }
    return out;
  }

  /* A stat's name as the game words it on an item, its value as X ("+X to Vitality", "X% Deadly Strike", "Cannot Be
     Frozen"), or "" for a stat the game shows no line for, or one about a skill (the skill kinds of the pickers). */
  const SKILL_FUNCS = new Set([13, 14, 15, 16, 24, 27, 28]);
  function statTitle(sid) {
    const st = C && C.stats.get(sid);
    if (!st || !st.text || SKILL_FUNCS.has(st.func) || HIDDEN_STATS.has(sid)) return "";
    if (!st.func) return /%/.test(st.text) ? "" : st.text;
    const t = describeStat(st.func, st.val, st.text, st.str2, 7777);
    if (/%[+0-9]*[a-z]/i.test(t)) return "";  // a form the pickers can't word
    return t.replace(/7777/g, "X");
  }

  /* Whether a base drops in more than one quality (weapons, armor, rings, amulets, charms, jewels, maps, arrows and
     bolts): everything else (gems, runes, potions, keys, PD2 items, quest items...) is always a normal item. */
  function qualities(b) {
    return !!b && (b.armor || b.weapon || b.map || b.code === "jew" || b.groups.indexOf("CHARM") >= 0 ||
                   b.groups.indexOf("JEWELRY") >= 0 || b.groups.indexOf("QUIVER") >= 0);
  }

  return {init, base, unique, make, describe, picks, search, statChoices, statLabel, statLine, statLines, statTitle,
          gameName, fromGame, hoverText, qualities,
          QUALITY_TINT, QUALITY_NAMES,
          catalog: () => C};
})();
