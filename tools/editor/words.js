/* A rule's condition in plain words, for the rules browser ("unique Shako, unidentified, on filter levels 5-7, outside
   town"): BH's reading (AND and OR left to right, a ! before a word or a bracket) of the condition as Erazure wrote it,
   Erazure's aliases by what they mean where the editor knows it, else by name. A guide, not a proof: the engine
   decides what a rule matches (the preview). */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.words = (function () {
  "use strict";
  const PLAIN = {
    MAG: "magic", RARE: "rare", UNI: "unique", SET: "set", CRAFT: "crafted", NMAG: "non-magical", SUP: "superior",
    INF: "low quality", NORM: "normal tier", EXC: "exceptional tier", ELT: "elite tier", ETH: "ethereal",
    ID: "identified", RW: "a runeword", GEMMED: "with something socketed", TRUE: "always", FALSE: "never",
    HELM: "helm", CIRC: "circlet", CHEST: "body armor", SHIELD: "shield", GLOVES: "gloves", BOOTS: "boots",
    BELT: "belt", ARMOR: "armor", AXE: "axe", MACE: "mace (clubs and hammers too)", CLUB: "club", TMACE: "mace",
    HAMMER: "hammer", SWORD: "sword", DAGGER: "dagger", THROWING: "throwing weapon", JAV: "javelin", SPEAR: "spear",
    POLEARM: "polearm", BOW: "bow", XBOW: "crossbow", STAFF: "staff", WAND: "wand", SCEPTER: "scepter",
    WEAPON: "weapon", "1H": "one-handed", "2H": "two-handed", CLASS: "class item", ZON: "Amazon weapon",
    SOR: "Sorceress orb", NEC: "Necromancer head", DIN: "Paladin shield", BAR: "Barbarian helm", DRU: "Druid pelt",
    SIN: "Assassin claw", JEWELRY: "ring or amulet", CHARM: "charm", QUIVER: "quiver", MISC: "misc item",
    GROUND: "on the ground", INVENTORY: "in the inventory", STASH: "in the stash", CUBE: "in the Cube",
    EQUIPPED: "equipped", MERC: "on the mercenary", SHOP: "in a shop", COMPENDIUM: "in the Compendium",
    PREVIEW: "a Compendium preview", GUILDVAULT: "in the guild vault", TROPHYCASE: "in the trophy case",
    AMAZON: "playing an Amazon", SORCERESS: "playing a Sorceress", NECROMANCER: "playing a Necromancer",
    PALADIN: "playing a Paladin", BARBARIAN: "playing a Barbarian", DRUID: "playing a Druid",
    ASSASSIN: "playing an Assassin", ANYDISCOVERED: "partly discovered", ALLDISCOVERED: "discovered",
    ANYOWNED: "partly owned", ALLOWNED: "owned",
    // Erazure's aliases the editor can name
    TOWN: "in town", GRAIL_NEW: "an undiscovered unique or set", BIG_GG: "the BIG GG versions",
    POE_SOUNDS: "the PoE sound versions", REVEALED: "the Revealed versions",
  };
  const NUMBER = {
    FILTLVL: "filter level", CLVL: "character level", ILVL: "item level", ALVL: "affix level", QLVL: "quality level",
    CRAFTALVL: "affix level if crafted", LVLREQ: "required level", SOCK: "sockets", SOCKETS: "sockets",
    DIFF: "difficulty", QTY: "stack of", GOLD: "gold", RUNE: "rune", ED: "ED", EDEF: "+% defense", EDAM: "+% damage",
    DEF: "defense", RES: "all res", FRES: "fire res", CRES: "cold res", LRES: "lightning res", PRES: "poison res",
    MAXRES: "max res", ALLSK: "+ all skills", FCR: "FCR", IAS: "IAS", FHR: "FHR", FBR: "FBR", FRW: "FRW",
    LIFE: "life", MANA: "mana", STR: "strength", DEX: "dexterity", ALLATTRIB: "all attributes", MFIND: "magic find",
    GFIND: "gold find", AR: "attack rating", ARPER: "attack rating %", MINDMG: "min damage", MAXDMG: "max damage",
    DTM: "damage to mana", MAEK: "mana per kill", REPLIFE: "replenish life", PRICE: "sell price",
    SELLPRICE: "sell price", BUYPRICE: "buy price", MAXSOCKETS: "most sockets", MAPID: "area", MAPTIER: "map tier",
    PLUSDEF: "defense from affixes", WIDTH: "width", HEIGHT: "height", AREA: "inventory squares", MAXDUR: "durability",
    PREFIX: "prefix", SUFFIX: "suffix", AUTOMOD: "automagic mod",
  };
  const DIFFS = ["Normal", "Nightmare", "Hell"];

  /* One word (a token without its ! and brackets) in words. */
  function word(w, opts) {
    if (PLAIN[w]) return PLAIN[w];
    if (w.startsWith("$f(")) return "a formula";
    const sum = /^([A-Z_0-9,+]+\+[A-Z_0-9,]+)([<=>~])(-?\d+)$/.exec(w);
    if (sum) {  // BH adds the stats up: MULTI107,54+MULTI188,9+MULTI83,1+STAT127>2
      const parts = sum[1].split("+").filter(Boolean).map((p) => {
        const s = /^MULTI(\d+),(\d+)$/.exec(p);
        if (s && s[1] === "107") return "+ " + skill(+s[2]);
        if (s && s[1] === "188") return "its tab";
        if (s && s[1] === "83") return "class skills";
        if (p === "STAT127") return "all skills";
        return NUMBER[p] || p.toLowerCase();
      });
      return parts.join(" + ") + " " + cmpText(sum[2], +sum[3]);
    }
    const m = /^([A-Z_]+?)(\d*(?:,\d+)?)([<=>~])(-?\d+)(?:-(-?\d+))?$/.exec(w);
    if (m) {
      const key = m[1], id = m[2], op = m[3], a = +m[4], b = m[5];
      let name = NUMBER[key + id] || NUMBER[key];
      if (!name && /^(SK|OS)$/.test(key) && id) name = "+ to " + skill(+id);
      else if (!name && key === "CHSK" && id) name = "charges of " + skill(+id);
      else if (!name && key === "STAT" && id) name = "stat " + id;
      else if (!name && key === "MULTI" && id) name = "stat " + id;
      else if (!name && key === "TABSK" && id) name = "+ to skill tab " + id;
      else if (!name && key === "CLSK" && id) name = "+ to class skills " + id;
      else if (!name && key === "CHARSTAT" && id) name = "character stat " + id;
      if (!name) return w;
      if (key === "DIFF" && op === "=" && DIFFS[a]) return DIFFS[a];
      if (key === "RUNE" && op !== "~") return "rune " + cmpText(op, a);
      if (key === "FILTLVL") return levelText(op, a, b === undefined ? undefined : +b, opts);
      return name + " " + (op === "~" ? `${a}-${b}` : cmpText(op, a));
    }
    if (/^[a-z0-9]{3}/.test(w) && !/^\d+$/.test(w)) {
      const base = EZ.items && EZ.items.base && EZ.items.base(w.slice(0, 4));
      return base ? base.name.replace(/ÿc./g, "").trim() : w;
    }
    return w;
  }
  const cmpText = (op, a) => op === ">" ? `${a + 1}+` : op === "<" ? `below ${a}` : String(a);
  function levelText(op, a, b, opts) {
    const n = opts && opts.levels ? opts.levels : 12;
    if (op === "=") return `filter level ${a}`;
    if (op === ">") return a + 1 >= n ? `filter level ${n}` : `filter levels ${a + 1}-${n}`;
    if (op === "<") return a - 1 <= 0 ? "filter level 0" : `filter levels 0-${a - 1}`;
    return `filter levels ${a}-${b}`;
  }
  function skill(id) {
    const cat = EZ.items && EZ.items.catalog && EZ.items.catalog();
    const s = cat && cat.skills && cat.skills.get(id);
    return s ? s.name : "skill " + id;
  }

  /* The condition's tokens as BH splits them: words, !, ( and ). */
  function tokens(cond) {
    const out = [];
    for (const tok of cond.split(/\s+/).filter(Boolean)) {
      let a = 0, b = tok.length;
      while (a < b && (tok[a] === "!" || tok[a] === "(")) out.push(tok[a++]);
      const tail = [];
      while (b > a && tok[b - 1] === ")") { tail.push(")"); b--; }
      if (a < b) out.push(tok.slice(a, b));
      out.push(...tail);
    }
    return out;
  }

  /* A tree from the tokens, BH's way: AND and OR left to right (each joins what came before), ! the next operand. */
  function parse(toks) {
    let i = 0;
    function operand() {
      if (i >= toks.length) return null;
      const t = toks[i];
      if (t === "!") { i++; const x = operand(); return x ? {k: "not", x} : null; }
      if (t === "(") {
        i++;
        const x = seq();
        if (toks[i] === ")") i++;
        return x ? {k: "group", x} : null;
      }
      if (t === ")") return null;
      i++;
      return {k: "w", w: t};
    }
    function seq() {
      let left = null;
      while (i < toks.length && toks[i] !== ")") {
        const t = toks[i];
        let op = "AND";
        if (t === "AND" || t === "&&" || t === "OR" || t === "||") { op = t === "OR" || t === "||" ? "OR" : "AND"; i++; }
        const right = operand();
        if (!right) { if (i < toks.length && toks[i] !== ")") i++; continue; }
        left = left ? {k: op, a: left, b: right} : right;
      }
      return left;
    }
    return seq();
  }

  /* An AND / OR chain flattened: [parts] of the same op. */
  function flat(n, op) {
    if (n.k === op) return flat(n.a, op).concat(flat(n.b, op));
    if (n.k === "group" && n.x.k === op) return flat(n.x, op);
    return [n];
  }

  function text(n, opts, inside) {
    if (!n) return "";
    if (n.k === "w") return word(n.w, opts);
    if (n.k === "group") return text(n.x, opts, inside);
    if (n.k === "not") {
      const x = n.x.k === "group" ? n.x.x : n.x;
      const t = text(x, opts, x.k !== "OR");
      return x.k === "w" || x.k === "not" ? "not " + t : "not (" + t + ")";
    }
    const parts = flat(n, n.k).map((p) => {
      const t = text(p, opts, true), and = p.k === "AND" || (p.k === "group" && p.x.k === "AND");
      return n.k === "OR" && and ? "(" + t + ")" : t;
    });
    if (n.k === "OR") return inside ? "(" + parts.join(" or ") + ")" : parts.join(" or ");
    return parts.join(", ");
  }

  /* The condition in words. opts: {levels: how many filter levels}. */
  function cond(c, opts) {
    if (!c || !c.trim()) return "every item";
    const t = parse(tokens(c));
    return t ? text(t, opts, false) : c;
  }

  return {cond, word, tokens, parse, PLAIN};
})();
