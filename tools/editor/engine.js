/* The Filter Editor's engine: a filter's rules run for an item as PD2's BH runs them. A port of the PD2 BH source
   (github.com/Project-Diablo-2/BH: BH/Modules/Item/ItemDisplay.cpp, Item.cpp, MapNotify.cpp, BH/Formula.h, Common.cpp):

   - InitializeItemRules: every alias written into the rules (EZ.core.substitute), Formula[KEY] entries and $f(...)
     islands compiled (an island that doesn't compile stays text), each rule's condition cut into tokens at white space;
   - BuildConditions: a token's leading and trailing ! ( ) are operators; the rest is a key, a comparison (= < > ~) and a
     number (a token whose number doesn't read is dropped with its trailing operators); the key is a word of BH's
     table, else an item code (3+ characters, none of the first three upper case), else a sum (+), else SK / OS /
     CHSK / CLSK / TABSK / STAT / CHARSTAT / MULTI with a number, else a formula; anything else is dropped. An operand
     after an operand or ) gets an AND first, so does ! or ( (the implicit AND);
   - ProcessConditions and Convert: AND and OR of equal precedence, read left to right, ! binding tightest; a ) without
     its ( ends the condition there; a condition that doesn't make one tree never matches, one with no condition left
     (empty, or only words BH drops) always matches (Rule::Evaluate);
   - each condition word as BH reads it (ItemStatCondition's x256 for life and mana, the affix list for ED, MAXDUR,
     FOOLS and charges, the item + runeword + socket fillers list for enhanced damage, defense and damage);
   - formulas (Formula.h): its lexer and parser, constant folding, float arithmetic, BH's errors, shown with %.2f and
     ".00" or one trailing 0 dropped (f_err on an error, not finite or past 2^31);
   - BuildAction (BORDER MAP DOT PX LINE NOTIFY TIER, the first {...}, SOUNDID, %MAP%, %CONTINUE% taken out in that
     order; %words% with a lower case letter upper-cased first) and BuildReplacementActions (an unknown %WORD% stays
     text, a keyword with the wrong number of numbers stays text);
   - the name and the description: every matching rule up to the first that stops replaces them; %NL% / %CL% in a name
     only where BH allows a line break (identified magic or better, runewords, shop items; one in a non-magical class
     or superior item); TrimItemText (%CL% %CS%, the 56 visible characters, 512 in a shop, 511 in all, 126 on tomes);
     ItemNamePatch's copy of 127 characters (123 for quest items); level 0 keeps the game's name;
   - the game's own options: Hide Healing / Mana Potions first; Force Show Undiscovered / Unowned for a unique or set
     the filter hides (the game's name, the item stays visible);
   - notifications, the model the players' pages use (tested in game 2026-10-18): the first matching notification
     rule its %TIER-n% allows gives the chat line and the drop sound; minimap icons stack, each matching rule's boxes,
     up to the first matching notification rule that stops, %TIER-n% or not; an item a matching rule hides at a level
     above 0 that no notification rule matches is invisible (BH: no label, no picture, no icon).

   Two ways to run: with a whole item (the preview), or with an item that leaves things out (undefined): a word that
   reads something left out is "maybe" (0.5), which is how the editor finds the rules that can match an item.

   The item: {code, base (EZ.items' catalog row), quality (INF NORM SUP MAG SET RARE UNI CRAFT), id, eth, rw, socketed
   (how many items are in its sockets), ilvl, stats {"sid" or "sid,param": the game's raw value, every list},
   list {sid: the item + runeword + socket fillers value of BH's special stats}, own {key: the item's own affixes},
   prefixes, suffixes, automod, place (GROUND INVENTORY STASH CUBE EQUIPPED MERC SHOP ...), disc {ANYDISCOVERED ...},
   gameName (the game's name for it), lvlreq, reqlvl, sell, buy}. The character: {clvl, cls (0-6), diff (0-2), mapid,
   filtlvl, charstats}. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.engine = (function () {
  "use strict";
  const MAYBE = 0.5;
  const f32 = Math.fround;
  const FLT_MAX = 3.4028234663852886e38;
  const dict = (o) => Object.assign(Object.create(null), o || {});

  /* ================================================================ formulas (BH/Formula.h) */

  const ERR = 1, UNK = 2;  // eval states besides OK
  const ERR_VALUE = {err: true};

  /* The lexer: [{t, v}] or null (LEXICAL_ERROR). Its input is lower case (Compile lowercases it). */
  const NUM_RE = /^(?:0x(?:[0-9a-f]+\.?[0-9a-f]*|\.[0-9a-f]+)(?:p[+-]?\d+)?|(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)/;
  const isLetter = (ch) => (ch >= "a" && ch <= "z") || ch === "_" || (ch > "\x7f" && /\p{L}/u.test(ch));
  function lex(input) {
    const out = [];
    let i = 0;
    while (i < input.length) {
      const c = input[i];
      if (c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\v" || c === "\f") { i++; continue; }
      const two = input.substr(i, 2);
      if (two === "==" || two === "!=" || two === ">=" || two === "<=") { out.push({t: "op", v: two}); i += 2; continue; }
      if ("+-*/^<>!".indexOf(c) >= 0) { out.push({t: "op", v: c}); i++; continue; }
      if (c === "(" || c === ")" || c === ",") { out.push({t: c, v: c}); i++; continue; }
      if ((c >= "0" && c <= "9") || c === ".") {
        const m = NUM_RE.exec(input.slice(i));
        if (!m) return null;
        out.push({t: "num", v: m[0]});
        i += m[0].length;
        continue;
      }
      if (isLetter(c)) {
        let j = i + 1;
        while (j < input.length && isLetter(input[j])) j++;
        out.push({t: "var", v: input.slice(i, j)});
        i = j;
        continue;
      }
      return null;
    }
    return out;
  }

  /* wcstof of a whole token: the float, or null where BH's parser refuses it (out of range). */
  function readFloat(s) {
    let v;
    if (s.startsWith("0x")) {
      const m = /^0x([0-9a-f]*)\.?([0-9a-f]*)(?:p([+-]?\d+))?$/.exec(s);
      if (!m || (!m[1] && !m[2])) return null;
      v = parseInt(m[1] || "0", 16);
      for (let k = 0; k < m[2].length; k++) v += parseInt(m[2][k], 16) / Math.pow(16, k + 1);
      if (m[3]) v *= Math.pow(2, +m[3]);
    } else v = Number(s);
    const f = f32(v);
    if (!isFinite(f) || (v !== 0 && f === 0) || (f !== 0 && Math.abs(f) < 1.1754943508222875e-38)) return null;
    return f;
  }

  const OPS = dict({"==": ["EQ", 1], ">": ["GT", 1], "<": ["LT", 1], "!=": ["NE", 1], ">=": ["GE", 1],
    "<=": ["LE", 1], "+": ["ADD", 2], "-": ["SUB", 2], "*": ["MUL", 3], "/": ["DIV", 3], "^": ["POW", 4]});
  const FUNCS = dict({if: "IF", and: "AND", or: "OR", ln: "LN", exp: "EXP", floor: "FLOOR", ceil: "CEIL",
    round: "ROUND", min: "MIN", max: "MAX", mod: "MOD", average: "AVERAGE", sqrt: "SQRT", pow: "POW", count: "COUNT",
    countif: "COUNTIF", xor: "XOR", abs: "ABS", sign: "SIGN"});
  const ARITY = {LN: [1, 1], EXP: [1, 1], FLOOR: [1, 1], CEIL: [1, 1], ROUND: [1, 1], SQRT: [1, 1], ABS: [1, 1],
    SIGN: [1, 1], MOD: [2, 2], POW: [2, 2], IF: [3, 3], AND: [1, Infinity], OR: [1, Infinity], MIN: [1, Infinity],
    MAX: [1, Infinity], AVERAGE: [1, Infinity], XOR: [1, Infinity], COUNT: [1, Infinity], COUNTIF: [2, Infinity]};

  /* Formula<T>::Compile: the formula's tree ({op, v, kids, name, ids}), or null. */
  function compileFormula(raw) {
    const toks = lex(raw.toLowerCase());
    if (!toks) return null;
    let pos = 0, err = false;
    const peek = () => toks[pos] || {t: "eof", v: ""};
    const advance = () => { if (pos < toks.length) pos++; };
    function expression(minPrec) {
      let left = unary();
      if (!left) return null;
      let last = -1;
      while (last !== pos) {
        last = pos;
        const t = peek();
        if (t.t !== "op" || !OPS[t.v]) break;
        const [op, prec] = OPS[t.v];
        if (prec < minPrec) break;
        advance();
        const right = expression(prec + (op !== "POW" ? 1 : 0));
        if (!right) { err = true; return null; }
        left = {op, kids: [left, right]};
      }
      return left;
    }
    function unary() {
      const v = peek().v;
      if (v === "-" || v === "!") {
        advance();
        const k = unary();
        if (!k) { err = true; return null; }
        return {op: v === "-" ? "NEG" : "NOT", kids: [k]};
      }
      if (v === "+") { advance(); return unary(); }
      return primary();
    }
    function primary() {
      const t = peek();
      if (t.t === "var") {
        if (FUNCS[t.v]) return fn(FUNCS[t.v]);
        const def = VARS[t.v];
        if (!def) { err = true; return null; }
        advance();
        const ids = [];
        for (let k = 0; k < def[0]; k++) {
          if (k > 0) {
            if (peek().t !== ",") { err = true; return null; }
            advance();
          }
          const n = peek();
          if (n.t !== "num" || !/^\d+$/.test(n.v) || +n.v > 2147483647) { err = true; return null; }
          ids.push(+n.v);
          advance();
        }
        return {op: "VAR", name: t.v, ids};
      }
      if (t.t === "num") {
        const v = readFloat(t.v);
        if (v === null) { err = true; return null; }
        advance();
        return {op: "LIT", v};
      }
      if (t.t === "(") {
        advance();
        const n = expression(0);
        if (peek().t !== ")") { err = true; return null; }
        advance();
        return n;
      }
      err = true;
      return null;
    }
    function fn(code) {
      advance();
      if (peek().t !== "(") { err = true; return null; }
      advance();
      const kids = [];
      if (peek().t !== ")") {
        let last = -1;
        while (last !== pos) {
          last = pos;
          const a = expression(0);
          if (!a) { err = true; return null; }
          kids.push(a);
          if (peek().t !== ",") break;
          advance();
        }
      }
      if (peek().t !== ")") { err = true; return null; }
      advance();
      const [lo, hi] = ARITY[code];
      if (kids.length < lo || kids.length > hi) { err = true; return null; }
      return {op: code, kids};
    }
    const root = expression(0);
    if (pos < toks.length) err = true;
    if (err || !root) return null;
    return optimize(root);
  }

  /* Formula<T>::optimize: a node of literals folded; IF / AND / OR with a deciding literal cut short. */
  function optimize(n) {
    if (!n.kids) return n;
    n.kids = n.kids.map(optimize);
    if (n.kids.length && n.kids.every((k) => k.op === "LIT")) {
      const st = {s: 0};
      const v = evalNode(n, null, null, null, st);
      return st.s === 0 ? {op: "LIT", v} : n;
    }
    if (n.op === "IF" && n.kids[0].op === "LIT") return n.kids[0].v !== 0 ? n.kids[1] : n.kids[2];
    if (n.op === "AND") { for (const c of n.kids) if (c.op === "LIT" && c.v === 0) return {op: "LIT", v: 0}; }
    if (n.op === "OR") { for (const c of n.kids) if (c.op === "LIT" && c.v !== 0) return {op: "LIT", v: 1}; }
    return n;
  }

  /* Formula<T>::eval, in float. st.s: 0 OK, ERR a math error (BH then gives 0 everywhere), UNK a value left out. */
  function evalNode(n, it, c, F, st) {
    if (st.s === ERR) return 0;
    const k = n.kids;
    const ev = (x) => evalNode(x, it, c, F, st);
    switch (n.op) {
      case "LIT": return n.v;
      case "VAR": {
        const r = VARS[n.name][1](it, c, n.ids, F);
        if (r === ERR_VALUE) { st.s = ERR; return 0; }
        if (r === undefined || r === null) { st.s = UNK; return 0; }
        return f32(+r);
      }
      case "NEG": return f32(-ev(k[0]));
      case "NOT": return ev(k[0]) !== 0 ? 0 : 1;
      case "ADD": { const a = ev(k[0]); return f32(a + ev(k[1])); }
      case "SUB": { const a = ev(k[0]); return f32(a - ev(k[1])); }
      case "MUL": { const a = ev(k[0]); return f32(a * ev(k[1])); }
      case "DIV": { const a = ev(k[0]); return f32(a / ev(k[1])); }
      case "POW": { const a = ev(k[0]); return f32(Math.pow(a, ev(k[1]))); }
      case "EQ": { const a = ev(k[0]); return a === ev(k[1]) ? 1 : 0; }
      case "NE": { const a = ev(k[0]); return a !== ev(k[1]) ? 1 : 0; }
      case "GT": { const a = ev(k[0]); return a > ev(k[1]) ? 1 : 0; }
      case "LT": { const a = ev(k[0]); return a < ev(k[1]) ? 1 : 0; }
      case "GE": { const a = ev(k[0]); return a >= ev(k[1]) ? 1 : 0; }
      case "LE": { const a = ev(k[0]); return a <= ev(k[1]) ? 1 : 0; }
      case "IF": return ev(k[0]) !== 0 ? ev(k[1]) : ev(k[2]);
      case "AND": for (const x of k) if (ev(x) === 0) return 0; return 1;
      case "OR": for (const x of k) if (ev(x) !== 0) return 1; return 0;
      case "LN": return f32(Math.log(ev(k[0])));
      case "EXP": return f32(Math.exp(ev(k[0])));
      case "FLOOR": return f32(Math.floor(ev(k[0])));
      case "CEIL": return f32(Math.ceil(ev(k[0])));
      case "ROUND": { const v = ev(k[0]); return f32(v < 0 ? -Math.round(-v) : Math.round(v)); }
      case "MIN": { let r = f32(FLT_MAX); for (const x of k) { const v = ev(x); if (v < r) r = v; } return r; }
      case "MAX": { let r = -f32(FLT_MAX); for (const x of k) { const v = ev(x); if (r < v) r = v; } return r; }
      case "MOD": { const a = ev(k[0]); return f32(a % ev(k[1])); }
      case "AVERAGE": { let r = 0; for (const x of k) r = f32(r + ev(x)); return f32(r / k.length); }
      case "SQRT": return f32(Math.sqrt(ev(k[0])));
      case "XOR": { let r = false; for (const x of k) r = r !== (ev(x) !== 0); return r ? 1 : 0; }
      case "COUNT": { let r = 0; for (const x of k) r += ev(x) !== 0 ? 1 : 0; return r; }
      case "COUNTIF": {
        const last = ev(k[k.length - 1]);
        let r = 0;
        for (let i = 0; i < k.length - 1; i++) r += ev(k[i]) === last ? 1 : 0;
        return r;
      }
      case "ABS": return Math.abs(ev(k[0]));
      case "SIGN": { const v = ev(k[0]); return (0 < v ? 1 : 0) - (v < 0 ? 1 : 0); }
    }
    return 0;
  }

  /* execute(): {v}, {err: true} or {unknown: true}. */
  function runFormula(node, it, c, F) {
    const st = {s: 0};
    const v = evalNode(node, it, c, F, st);
    if (st.s === ERR) return {err: true};
    if (st.s === UNK) return {unknown: true};
    return {v};
  }

  /* BH's number: %.2f (exact ties to even, as the CRT's printf), then ".00" or one trailing 0 dropped. */
  function formatNumber(v) {
    if (!isFinite(v) || Math.abs(v) > 2147483648) return "f_err";
    const neg = v < 0 || Object.is(v, -0);
    const s = Math.abs(v) * 100;  // exact: a float times 100 fits a double
    let n = Math.floor(s);
    const d = s - n;
    if (d > 0.5 || (d === 0.5 && n % 2 === 1)) n += 1;
    let txt = (neg ? "-" : "") + Math.floor(n / 100) + "." + String(n % 100).padStart(2, "0");
    if (txt.endsWith("00")) txt = txt.slice(0, -3);
    else if (txt.endsWith("0")) txt = txt.slice(0, -1);
    return txt;
  }

  /* ================================================================ the item's values (BH's way) */

  const QUALITY_INDEX = {INF: 1, NORM: 2, SUP: 3, MAG: 4, SET: 5, RARE: 6, UNI: 7, CRAFT: 8};
  const NMAG = {INF: 1, NORM: 1, SUP: 1};
  const SPECIAL = new Set([16, 17, 18, 21, 22, 23, 24, 159, 160]);  // read from the item + runeword + sockets list
  const CLASS_ID = {AMAZON: 0, SORCERESS: 1, NECROMANCER: 2, PALADIN: 3, BARBARIAN: 4, DRUID: 5, ASSASSIN: 6};
  const PLACES = ["EQUIPPED", "MERC", "INVENTORY", "CUBE", "STASH", "GROUND", "COMPENDIUM", "PREVIEW", "GUILDVAULT",
                  "TROPHYCASE"];
  const statKey = (sid, p) => p ? sid + "," + p : String(sid);

  /* D2COMMON_GetUnitStat(item, sid, p): undefined when the item's stats are left out. */
  function unitStat(it, sid, p) {
    if (!it.stats) return undefined;
    const v = it.stats[statKey(sid, p)];
    return v === undefined ? 0 : v;
  }
  /* GetStatFromList: the item's own affixes, its runeword and its socket fillers (layer 0). */
  function listStat(it, sid) {
    if (it.list) { const v = it.list[sid]; return v === undefined ? 0 : v; }
    return unitStat(it, sid, 0);
  }
  /* The item's own stat list (0x40): its affixes, not the runeword nor the sockets. */
  function ownStat(it, sid, p) {
    if (it.own) { const v = it.own[statKey(sid, p)]; return v === undefined ? 0 : v; }
    return unitStat(it, sid, p);
  }
  function ownEntries(it) {
    const o = it.own || it.stats;
    return o ? Object.keys(o).map((k) => { const [s, p] = k.split(","); return [+s, +(p || 0), o[k]]; }) : undefined;
  }
  /* GetAdjustedUnitStat: life and mana as shown, the special stats from the list. */
  function adjusted(it, sid, p) {
    if (sid === 7 || sid === 9) { const v = unitStat(it, sid, p); return v === undefined ? undefined : Math.trunc(v / 256); }
    if (SPECIAL.has(sid)) return listStat(it, sid);
    return unitStat(it, sid, p);
  }
  function inGroup(it, g) { return it.base ? it.base.groups.indexOf(g) >= 0 : undefined; }

  function affixLevel(ilvl, qlvl, mlvl) {
    ilvl &= 255; qlvl &= 255;
    if (ilvl > 99) ilvl = 99;
    if (qlvl > ilvl) ilvl = qlvl;
    if (mlvl > 0) return ilvl + mlvl > 99 ? 99 : ilvl + mlvl;
    return ilvl < 99 - Math.floor(qlvl / 2) ? ilvl - Math.floor(qlvl / 2) : ilvl * 2 - 99;
  }
  function alvl(it) {
    return it.base && it.ilvl !== undefined ? affixLevel(it.ilvl, it.base.qlvl, it.base.mlvl) : undefined;
  }
  function craftAlvl(it, c) {
    if (!it.base || it.ilvl === undefined || c.clvl === undefined) return undefined;
    return affixLevel(Math.trunc(0.5 * c.clvl) + Math.trunc(0.5 * it.ilvl), it.base.qlvl, it.base.mlvl);
  }
  function rerollAlvl(it, c) {
    if (!it.base) return undefined;
    if (it.base.map) return 0;
    const cor = unitStat(it, 360, 0);
    if (cor === undefined || it.quality === undefined) return undefined;
    if (cor > 0) return 0;
    let r;
    if (it.quality === "RARE") {
      if (it.ilvl === undefined || c.clvl === undefined) return undefined;
      r = (Math.trunc(0.4 * it.ilvl) + Math.trunc(0.4 * c.clvl)) & 255;
    } else if (it.quality === "MAG") {
      if (it.ilvl === undefined) return undefined;
      r = it.ilvl & 255;
    } else return 0;
    return affixLevel(r, it.base.qlvl, it.base.mlvl);
  }
  function maxSockets(it) {
    const b = it.base;
    if (!b || it.ilvl === undefined) return undefined;
    if (!b.maxsock) return 0;
    return it.ilvl <= 25 ? b.maxsock[0] : it.ilvl <= 40 ? b.maxsock[1] : b.maxsock[2];
  }
  function minMax(it, max) {
    const a = (max ? [22, 24, 160] : [21, 23, 159]).map((s) => listStat(it, s));
    return a.some((x) => x === undefined) ? undefined : Math.max(a[0], a[1], a[2]);
  }
  function minOfAll(it, ids) {  // ALLATTRIB / MAXRES / %RES% / the formula's res: the lowest when all four are there
    const a = ids.map((s) => unitStat(it, s, 0));
    if (a.some((x) => x === undefined)) return undefined;
    return a.every((x) => x) ? Math.min(...a) : 0;
  }
  function eased(it, req) {
    const ease = unitStat(it, 91, 0);
    if (ease === undefined || it.eth === undefined) return undefined;
    let delta = Math.trunc(req * ease / 100);
    if (it.eth) delta -= 10;
    return Math.max(0, req + delta);
  }
  function reqStat(it, which) {  // ReqStatCondition::GetValue
    const b = it.base;
    if (!b) return undefined;
    if (which === "LEVEL") return it.reqlvl !== undefined ? it.reqlvl : it.lvlreq;
    return eased(it, which === "STR" ? b.reqstr || 0 : b.reqdex || 0);
  }
  function upStat(it, which) {  // UpStatCondition::GetValue: the base its cube upgrade makes
    const b = it.base;
    if (!b) return undefined;
    if (!b.up) return 0;
    if (which === "LEVEL") {
      const cur = it.reqlvl !== undefined ? it.reqlvl : it.lvlreq;
      return cur === undefined ? undefined : Math.max(b.up.lvlreq || 0, cur);
    }
    return eased(it, which === "STR" ? b.up.reqstr || 0 : b.up.reqdex || 0);
  }
  function baseDamage(it, kind) {  // BaseWeaponDamageCondition::GetValue
    const b = it.base;
    if (!b) return undefined;
    const shield = b.groups.indexOf("SHIELD") >= 0, boots = b.groups.indexOf("BOOTS") >= 0;
    const withEth = (d) => it.eth === undefined ? undefined : it.eth ? Math.trunc((d + Math.trunc(d / 2)) * 5 / 6) : d;
    switch (kind) {
      case "MINSMITE": return shield ? b.mindam || 0 : 0;
      case "MAXSMITE": return shield ? b.maxdam || 0 : 0;
      case "MINKICK": return boots ? b.mindam || 0 : 0;
      case "MAXKICK": return boots ? b.maxdam || 0 : 0;
      case "MINONEH": return shield || boots ? 0 : withEth(b.mindam || 0);
      case "MAXONEH": return shield || boots ? 0 : withEth(b.maxdam || 0);
      case "MINTWOH": return withEth(b.min2 || 0);
      case "MAXTWOH": return withEth(b.max2 || 0);
      case "MINTHROW": return withEth(b.minmis || 0);
      case "MAXTHROW": return withEth(b.maxmis || 0);
    }
    return 0;
  }
  function charged(it, skill) {  // ChargedCondition: the highest level of the skill's charges (the affix list)
    const e = ownEntries(it);
    if (!e) return undefined;
    let best = 0;
    for (const [s, p] of e) if (s === 204 && (p >> 6) === skill) best = Math.max(best, p & 63);
    return best;
  }
  function fools(it) {  // both per-level stats in the affix list
    const e = ownEntries(it);
    if (!e) return undefined;
    let v = 0;
    for (const [s, p, x] of e) {
      if (s === 218 && p === 0 && x) v += 1;
      if (s === 224 && p === 0 && x) v += 2;
    }
    return v === 3;
  }
  function edValue(it) {  // ED: the affix list's +% defense (armor) or +% damage
    const a = inGroup(it, "ARMOR");
    return a === undefined ? undefined : ownStat(it, a ? 16 : 17, 0);
  }
  function rune(it) { return it.base ? (it.base.rune || null) : undefined; }
  function gem(it, i) { return it.base ? (it.base.gem ? it.base.gem[i] : null) : undefined; }
  function place(it, word) { return it.place === undefined ? undefined : it.place === word; }
  function discovery(it, word) {
    if (!it.disc) return undefined;
    const v = it.disc[word];
    return v === undefined ? undefined : !!v;
  }
  function charStat(c, sid) {
    if (sid === 12) return c.clvl;
    if (!c.charstats) return undefined;
    const v = c.charstats[sid];
    return v === undefined ? 0 : v;
  }

  /* Formula variables (formulaVarDefs): name -> [parameters, resolver]. A resolver gives a number, a boolean, undefined
     (left out) or ERR_VALUE (BH's MATH_ERROR). */
  const bool = (x) => x === undefined ? undefined : (x ? 1 : 0);
  const G = (g) => [0, (it) => bool(inGroup(it, g))];
  const A = (sid) => [0, (it) => adjusted(it, sid, 0)];
  const Q = (word) => [0, (it) => it.quality === undefined ? undefined : (it.quality === word ? 1 : 0)];
  const C = (n) => [0, (it, c) => c.cls === undefined ? undefined : (c.cls === n ? 1 : 0)];
  const P = (word) => [0, (it) => bool(place(it, word))];
  const CL_GROUPS = [null, "DRU", "BAR", "DIN", "NEC", "SIN", "SOR", "ZON"];
  const EQ_GROUPS = [null, "HELM", "CHEST", "SHIELD", "GLOVES", "BOOTS", "BELT", "CIRC"];
  const WP_GROUPS = [null, "AXE", "MACE", "SWORD", "DAGGER", "THROWING", "JAV", "SPEAR", "POLEARM", "BOW", "XBOW",
                     "STAFF", "WAND", "SCEPTER"];
  const pick = (list) => [1, (it, c, ids) => list[ids[0]] ? bool(inGroup(it, list[ids[0]])) : ERR_VALUE];
  const skill = (sid) => [1, (it, c, ids, F) => ids[0] > F.skillMax ? ERR_VALUE : adjusted(it, sid, ids[0])];
  const opt = (f) => (it) => { const v = f(it); return v === undefined ? undefined : v || 0; };
  const VARS = dict({
    stat: [1, (it, c, ids) => adjusted(it, ids[0], 0)],
    multi: [2, (it, c, ids) => adjusted(it, ids[0], ids[1])],
    charstat: [1, (it, c, ids) => charStat(c, ids[0])],
    onehand: G("1H"), twohand: G("2H"),
    allsk: A(127), alvl: [0, (it) => alvl(it)], amazon: C(0), ar: A(19), armor: G("ARMOR"), arper: A(119),
    assassin: C(6),
    automod: [0, (it) => {
      if (it.quality === undefined || it.id === undefined) return undefined;
      if ((it.quality === "MAG" || it.quality === "RARE") && !it.id) return 0;
      return it.automod;
    }],
    axe: G("AXE"), bar: G("BAR"), barbarian: C(4), belt: G("BELT"), boots: G("BOOTS"), bow: G("BOW"),
    buyprice: [0, (it) => it.buy], charm: G("CHARM"), chest: G("CHEST"),
    chsk: [1, (it, c, ids, F) => ids[0] > F.skillMax ? ERR_VALUE : charged(it, ids[0])],
    circ: G("CIRC"), cl: pick(CL_GROUPS), class: G("CLASS"),
    clsk: [1, (it, c, ids) => ids[0] >= 7 ? ERR_VALUE : adjusted(it, 83, ids[0])],
    club: G("CLUB"), clvl: [0, (it, c) => c.clvl], craft: Q("CRAFT"), craftalvl: [0, (it, c) => craftAlvl(it, c)],
    compendium: P("COMPENDIUM"), cres: A(43), cube: P("CUBE"), dagger: G("DAGGER"), def: A(31), dex: A(2),
    diff: [0, (it, c) => c.diff], din: G("DIN"), dru: G("DRU"), druid: C(5), dtm: A(114), ed: [0, edValue],
    edam: A(17), edef: A(16), elt: G("ELT"), eq: pick(EQ_GROUPS), equipped: P("EQUIPPED"),
    eth: [0, (it) => bool(it.eth)], exc: G("EXC"), false: [0, () => 0], fbr: A(102), fcr: A(105), fhr: A(99),
    filtlvl: [0, (it, c) => c.filtlvl], fools: [0, (it) => bool(fools(it))], fres: A(39), frw: A(96),
    gem: [0, opt((it) => gem(it, 0))], gemlevel: [0, opt((it) => gem(it, 0))],
    gemmed: [0, (it) => it.socketed === undefined ? undefined : (it.socketed > 0 ? 1 : 0)],
    gemtype: [0, opt((it) => gem(it, 1))], gfind: A(79), gloves: G("GLOVES"), guildvault: P("GUILDVAULT"),
    gold: [0, (it) => it.code === undefined ? undefined : (it.code === "gld" ? unitStat(it, 14, 0) : 0)],
    ground: P("GROUND"), hammer: G("HAMMER"), helm: G("HELM"), ias: A(93), id: [0, (it) => bool(it.id)],
    ilvl: [0, (it) => it.ilvl], inf: Q("INF"), inventory: P("INVENTORY"), jav: G("JAV"), jewelry: G("JEWELRY"),
    life: A(7), lres: A(41), lvlreq: [0, (it) => it.lvlreq], mace: G("MACE"), maek: A(138), mag: Q("MAG"), mana: A(9),
    mapid: [0, (it, c) => c.mapid === undefined ? undefined : c.mapid || 0],
    maptier: [0, (it) => it.base ? it.base.maptier : undefined], maxdmg: [0, (it) => minMax(it, true)],
    maxdur: [0, (it) => ownStat(it, 75, 0)], merc: P("MERC"), mfind: A(80), mindmg: [0, (it) => minMax(it, false)],
    misc: G("MISC"), nec: G("NEC"), necromancer: C(2),
    nmag: [0, (it) => it.quality === undefined ? undefined : (NMAG[it.quality] ? 1 : 0)],
    norm: G("NORM"), os: skill(97), paladin: C(3), polearm: G("POLEARM"), preview: P("PREVIEW"), pres: A(45),
    price: [0, (it) => it.sell], qlvl: [0, (it) => it.base ? it.base.qlvl : undefined], qty: A(70),
    quiver: G("QUIVER"), rare: Q("RARE"), repair: A(252), replife: A(74), repquant: A(253),
    rerollalvl: [0, (it, c) => rerollAlvl(it, c)], res: [0, (it) => minOfAll(it, [39, 41, 43, 45])],
    rune: [0, opt(rune)], rw: [0, (it) => bool(it.rw)], scepter: G("SCEPTER"), sellprice: [0, (it) => it.sell],
    set: Q("SET"), shield: G("SHIELD"), shop: [0, (it) => bool(place(it, "SHOP"))], sin: G("SIN"), sk: skill(107),
    sock: A(194), sockets: A(194), sor: G("SOR"), sorceress: C(1), spear: G("SPEAR"), staff: G("STAFF"),
    stash: P("STASH"), str: A(0), sup: Q("SUP"), sword: G("SWORD"), tabsk: skill(188), throwing: G("THROWING"),
    tmace: G("TMACE"), trophycase: P("TROPHYCASE"), true: [0, () => 1], uni: Q("UNI"), wand: G("WAND"),
    weapon: G("WEAPON"), wp: pick(WP_GROUPS), xbow: G("XBOW"), zon: G("ZON"),
    width: [0, (it) => it.base ? it.base.w : undefined], height: [0, (it) => it.base ? it.base.h : undefined],
    area: [0, (it) => it.base ? it.base.w * it.base.h : undefined],
    maxsockets: [0, maxSockets], uplvl: [0, (it) => upStat(it, "LEVEL")], upstr: [0, (it) => upStat(it, "STR")],
    updex: [0, (it) => upStat(it, "DEX")], maxres: [0, (it) => minOfAll(it, [40, 44, 42, 46])],
    plusdef: [0, (it) => listStat(it, 31)], allattrib: [0, (it) => minOfAll(it, [0, 2, 3, 1])],
    baseblock: [0, (it) => it.base ? it.base.block || 0 : undefined],
    baseminoneh: [0, (it) => baseDamage(it, "MINONEH")], basemintwoh: [0, (it) => baseDamage(it, "MINTWOH")],
    baseminsmite: [0, (it) => baseDamage(it, "MINSMITE")], baseminkick: [0, (it) => baseDamage(it, "MINKICK")],
    baseminthrow: [0, (it) => baseDamage(it, "MINTHROW")], basemaxoneh: [0, (it) => baseDamage(it, "MAXONEH")],
    basemaxtwoh: [0, (it) => baseDamage(it, "MAXTWOH")], basemaxsmite: [0, (it) => baseDamage(it, "MAXSMITE")],
    basemaxkick: [0, (it) => baseDamage(it, "MAXKICK")], basemaxthrow: [0, (it) => baseDamage(it, "MAXTHROW")],
    reqlvl: [0, (it) => reqStat(it, "LEVEL")], reqstr: [0, (it) => reqStat(it, "STR")],
    reqdex: [0, (it) => reqStat(it, "DEX")],
  });

  /* ================================================================ conditions */

  // condition_map: the words BH knows, each to its condition (the item group words are their own)
  const WORDS = dict();
  for (const w of ["AND", "OR", "TRUE", "FALSE", "ETH", "SET", "MAG", "RARE", "UNI", "CRAFTALVL", "REROLLALVL", "PREFIX",
    "SUFFIX", "AUTOMOD", "MAPID", "MAPTIER", "CRAFT", "RW", "NMAG", "SUP", "INF", "NORM", "EXC", "ELT", "CLASS", "ID",
    "ILVL", "QLVL", "ALVL", "CLVL", "FILTLVL", "DIFF", "RUNE", "GOLD", "GEMMED", "GEMTYPE", "GEM", "ED", "EDEF", "EDAM",
    "DEF", "MAXDUR", "RES", "FRES", "CRES", "LRES", "PRES", "IAS", "FCR", "FHR", "FBR", "LIFE", "MANA", "QTY", "GOODSK",
    "GOODTBSK", "FOOLS", "LVLREQ", "ARPER", "MFIND", "GFIND", "STR", "DEX", "FRW", "MINDMG", "MAXDMG", "AR", "DTM",
    "MAEK", "REPLIFE", "REPQUANT", "REPAIR", "ARMOR", "BELT", "CHEST", "HELM", "SHIELD", "GLOVES", "BOOTS", "CIRC",
    "DRU", "BAR", "DIN", "NEC", "SIN", "SOR", "ZON", "MISC", "JEWELRY", "CHARM", "QUIVER", "SHOP", "EQUIPPED", "MERC",
    "CUBE", "INVENTORY", "STASH", "GROUND", "COMPENDIUM", "PREVIEW", "GUILDVAULT", "TROPHYCASE", "1H", "2H", "AXE",
    "MACE", "CLUB", "TMACE", "HAMMER", "SWORD", "DAGGER", "THROWING", "JAV", "SPEAR", "POLEARM", "BOW", "XBOW",
    "STAFF", "WAND", "SCEPTER", "WEAPON", "ALLSK", "BUYPRICE", "PRICE", "BASEMINONEH", "BASEMINTWOH", "BASEMINTHROW",
    "BASEMINKICK", "BASEMINSMITE", "BASEMAXONEH", "BASEMAXTWOH", "BASEMAXTHROW", "BASEMAXKICK", "BASEMAXSMITE",
    "BASEBLOCK", "ALLATTRIB", "MAXRES", "PLUSDEF", "MAXSOCKETS", "WIDTH", "HEIGHT", "AREA", "ANYDISCOVERED",
    "ALLDISCOVERED", "ANYOWNED", "ALLOWNED"]) WORDS[w] = w;
  Object.assign(WORDS, {SOCKETS: "SOCK", SOCK: "SOCK", GEMLEVEL: "GEM", SELLPRICE: "PRICE",
    AMAZON: "CLS", SORCERESS: "CLS", NECROMANCER: "CLS", PALADIN: "CLS", BARBARIAN: "CLS", DRUID: "CLS", ASSASSIN: "CLS",
    REQSTR: "REQSTAT", REQDEX: "REQSTAT", REQLVL: "REQSTAT", UPSTR: "UPSTAT", UPDEX: "UPSTAT", UPLVL: "UPSTAT",
    EQ1: "HELM", EQ2: "CHEST", EQ3: "SHIELD", EQ4: "GLOVES", EQ5: "BOOTS", EQ6: "BELT", EQ7: "CIRC",
    CL1: "DRU", CL2: "BAR", CL3: "DIN", CL4: "NEC", CL5: "SIN", CL6: "SOR", CL7: "ZON",
    WP1: "AXE", WP2: "MACE", WP3: "SWORD", WP4: "DAGGER", WP5: "THROWING", WP6: "JAV", WP7: "SPEAR", WP8: "POLEARM",
    WP9: "BOW", WP10: "XBOW", WP11: "STAFF", WP12: "WAND", WP13: "SCEPTER"});
  const GROUP_WORDS = new Set(["NORM", "EXC", "ELT", "CLASS", "ARMOR", "BELT", "CHEST", "HELM", "SHIELD", "GLOVES",
    "BOOTS", "CIRC", "DRU", "BAR", "DIN", "NEC", "SIN", "SOR", "ZON", "MISC", "JEWELRY", "CHARM", "QUIVER", "1H", "2H",
    "AXE", "MACE", "CLUB", "TMACE", "HAMMER", "SWORD", "DAGGER", "THROWING", "JAV", "SPEAR", "POLEARM", "BOW", "XBOW",
    "STAFF", "WAND", "SCEPTER", "WEAPON"]);
  // ItemStatCondition words: the stat each reads
  const STAT_WORDS = dict({SOCK: 194, EDEF: 16, EDAM: 17, DEF: 31, FRES: 39, CRES: 43, LRES: 41, PRES: 45, IAS: 93,
    FCR: 105, FHR: 99, FBR: 102, LIFE: 7, MANA: 9, QTY: 70, ARPER: 119, MFIND: 80, GFIND: 79, STR: 0, DEX: 2, FRW: 96,
    AR: 19, DTM: 114, MAEK: 138, REPLIFE: 74, REPQUANT: 253, REPAIR: 252, ALLSK: 127});

  /* IntegerCompare / FloatCompare: 1 or 0, MAYBE for a value left out; null (BH: false for this kind of item) is 0. */
  function cmp(v, op, a, b) {
    if (v === undefined) return MAYBE;
    if (v === null || v === ERR_VALUE) return 0;
    switch (op) {
      case "=": return v === a ? 1 : 0;
      case ">": return v > a ? 1 : 0;
      case "<": return v < a ? 1 : 0;
      case "~": return a <= v && v <= b ? 1 : 0;
    }
    return 0;
  }
  const truth = (x) => x === undefined ? MAYBE : (x ? 1 : 0);

  /* ItemStatCondition: life and mana against the number x 256, the special stats from the list. */
  function itemStat(it, sid, p, op, a, b) {
    if (sid === 7 || sid === 9) return cmp(unitStat(it, sid, p), op, a * 256, b * 256);
    if (SPECIAL.has(sid)) return cmp(listStat(it, sid), op, a, b);
    return cmp(unitStat(it, sid, p), op, a, b);
  }

  /* AddCondition's parts (its names are case sensitive): [{stat, param, minmax} | {formula}]. */
  const ADD_STATS = dict({LIFE: [7, 0], MANA: [9, 0], STR: [0, 0], DEX: [2, 0], CRES: [43, 0], FRES: [39, 0],
    LRES: [41, 0], PRES: [45, 0], MINDMG: [21, 0], MAXDMG: [22, 0], EDEF: [16, 0], EDAM: [17, 0], FCR: [105, 0],
    AR: [19, 0], REPLIFE: [74, 0], STAT: [-1, 1], MULTI: [-1, 2]});
  function addParts(key, F) {
    const parts = [];
    let pieces = key.split("+");
    if (pieces.length && pieces[pieces.length - 1] === "") pieces = pieces.slice(0, -1);  // getline: no empty last
    for (const code of pieces) {
      const m = /([A-Z_]+)(?:(\d{1,9})(?:,(\d{1,9}))?)?/.exec(code);
      if (!m) continue;
      const s = ADD_STATS[m[1]];
      if (!s) {
        if (F.formulas[m[1]]) parts.push({formula: F.formulas[m[1]]});
        continue;
      }
      if (s[1] !== (m[2] ? 1 : 0) + (m[3] ? 1 : 0)) continue;
      const p1 = m[2] ? +m[2] : s[0], p2 = m[3] ? +m[3] : 0;
      parts.push(m[1] === "MAXDMG" || m[1] === "MINDMG" ? {stat: p1, minmax: true} : {stat: p1, param: p2});
    }
    return parts;
  }
  function addValue(it, c, F, parts) {
    let v = 0, fv = 0, unknown = false, hasF = false;
    for (const p of parts) {
      if (p.formula) {
        hasF = true;
        const r = runFormula(p.formula, it, c, F);
        if (r.unknown) unknown = true;
        else if (!r.err) fv = f32(fv + r.v);
        continue;
      }
      let x;
      if (p.stat === 7 || p.stat === 9) { x = unitStat(it, p.stat, p.param); if (x !== undefined) x = Math.trunc(x / 256); }
      else if (p.minmax && (p.stat === 21 || p.stat === 22)) x = minMax(it, p.stat === 22);
      else if (SPECIAL.has(p.stat)) x = listStat(it, p.stat);
      else x = unitStat(it, p.stat, p.minmax ? 0x7FFFFFFF : p.param);
      if (x === undefined) unknown = true; else v += x;
    }
    if (unknown) return undefined;
    return hasF ? f32(v + fv) : v;
  }

  /* One operand of a condition word: (it, c, F) -> 1 / 0 / MAYBE. */
  function operand(kind, key, op, a, b) {
    switch (kind) {
      case "TRUE": return () => 1;
      case "FALSE": return () => 0;
      case "ETH": return (it) => truth(it.eth);
      case "RW": return (it) => truth(it.rw);
      case "ID": return (it) => truth(it.id);
      case "SET": case "MAG": case "RARE": case "UNI": case "CRAFT": case "SUP": case "INF":
        return (it) => it.quality === undefined ? MAYBE : (it.quality === kind ? 1 : 0);
      case "NMAG": return (it) => it.quality === undefined ? MAYBE : (NMAG[it.quality] ? 1 : 0);
      case "CLS": { const n = CLASS_ID[key]; return (it, c) => c.cls === undefined ? MAYBE : (c.cls === n ? 1 : 0); }
      case "CRAFTALVL": return (it, c) => cmp(craftAlvl(it, c), op, a, b);
      case "REROLLALVL": return (it, c) => cmp(rerollAlvl(it, c), op, a, b);
      case "PREFIX": case "SUFFIX": {
        const field = kind === "PREFIX" ? "prefixes" : "suffixes";
        return (it) => {
          if (it.quality === undefined || it.id === undefined) return MAYBE;
          if (it.quality === "RARE" && !it.id) return 0;
          if (op !== "=" && op !== "~") return 0;
          const list = it[field];
          if (list === undefined) return MAYBE;
          return list.some((x) => x > 0 && cmp(x, op, a, b) === 1) ? 1 : 0;
        };
      }
      case "AUTOMOD": return (it) => {
        if (it.quality === undefined || it.id === undefined) return MAYBE;
        if ((it.quality === "MAG" || it.quality === "RARE") && !it.id) return 0;
        return cmp(it.automod, op, a, b);
      };
      case "MAPID": return (it, c) => c.mapid === undefined ? MAYBE : (c.mapid > 0 ? cmp(c.mapid, op, a, b) : 0);
      case "MAPTIER": return (it) => cmp(it.base ? it.base.maptier : undefined, op, a, b);
      case "ILVL": return (it) => cmp(it.ilvl, op, a, b);
      case "QLVL": return (it) => cmp(it.base ? it.base.qlvl : undefined, op, a, b);
      case "ALVL": return (it) => cmp(alvl(it), op, a, b);
      case "CLVL": return (it, c) => cmp(c.clvl, op, a, b);
      case "FILTLVL": return (it, c) => cmp(c.filtlvl, op, a, b);
      case "DIFF": return (it, c) => cmp(c.diff, op, a, b);
      case "RUNE": return (it) => cmp(rune(it), op, a, b);
      case "GOLD": return (it) => cmp(it.code === undefined ? undefined : it.code === "gld" ? unitStat(it, 14, 0) : null,
                                      op, a, b);
      case "GEMMED": return (it) => it.socketed === undefined ? MAYBE : (it.socketed > 0 ? 1 : 0);
      case "GEMTYPE": return (it) => cmp(gem(it, 1), op, a, b);
      case "GEM": return (it) => cmp(gem(it, 0), op, a, b);
      case "ED": return (it) => cmp(edValue(it), op, a, b);
      case "MAXDUR": return (it) => cmp(ownStat(it, 75, 0), op, a, b);
      case "RES": return (it) => {
        let r = 1;
        for (const s of [39, 41, 43, 45]) {
          const x = cmp(unitStat(it, s, 0), op, a, b);
          if (x === 0) return 0;
          if (x === MAYBE) r = MAYBE;
        }
        return r;
      };
      case "GOODSK": case "GOODTBSK": return () => cmp(0, op, a, 0);  // the player's BH skill lists: none
      case "FOOLS": return (it) => truth(fools(it));
      case "LVLREQ": return (it) => cmp(it.lvlreq, op, a, b);
      case "MINDMG": return (it) => cmp(minMax(it, false), op, a, b);
      case "MAXDMG": return (it) => cmp(minMax(it, true), op, a, b);
      case "SHOP": return (it) => truth(place(it, "SHOP"));
      case "BUYPRICE": return (it) => cmp(it.buy, op, a, b);
      case "PRICE": return (it) => cmp(it.sell, op, a, b);
      case "WIDTH": return (it) => cmp(it.base ? it.base.w : undefined, op, a, b);
      case "HEIGHT": return (it) => cmp(it.base ? it.base.h : undefined, op, a, b);
      case "AREA": return (it) => cmp(it.base ? it.base.w * it.base.h : undefined, op, a, b);
      case "REQSTAT": {
        const w = key === "REQSTR" ? "STR" : key === "REQDEX" ? "DEX" : "LEVEL";
        return (it) => cmp(reqStat(it, w), op, a, b);
      }
      case "UPSTAT": {
        const w = key === "UPSTR" ? "STR" : key === "UPDEX" ? "DEX" : "LEVEL";
        return (it) => cmp(upStat(it, w), op, a, b);
      }
      case "BASEBLOCK": return (it) => cmp(it.base ? it.base.block || 0 : undefined, op, a, b);
      case "ALLATTRIB": return (it) => cmp(minOfAll(it, [0, 2, 1, 3]), op, a, b);
      case "MAXRES": return (it) => cmp(minOfAll(it, [40, 44, 42, 46]), op, a, b);
      case "PLUSDEF": return (it) => cmp(listStat(it, 31), op, a, b);
      case "MAXSOCKETS": return (it) => cmp(maxSockets(it), op, a, b);
      case "ANYDISCOVERED": case "ALLDISCOVERED": case "ANYOWNED": case "ALLOWNED":
        return (it) => truth(discovery(it, kind));
    }
    if (kind.startsWith("BASEM")) { const w = kind.slice(4); return (it) => cmp(baseDamage(it, w), op, a, b); }
    if (PLACES.indexOf(kind) >= 0) return (it) => truth(place(it, kind));
    if (GROUP_WORDS.has(kind)) return (it) => truth(inGroup(it, kind));
    if (STAT_WORDS[kind] !== undefined) { const s = STAT_WORDS[kind]; return (it) => itemStat(it, s, 0, op, a, b); }
    return null;
  }

  /* int(wstringstream >> value): the number at the start (after white space), or null. */
  function readInt(s) {
    const m = /^[ \t\n\r\v\f]*([+-]?\d+)/.exec(s);
    if (!m) return null;
    const v = Number(m[1]);
    return v > 2147483647 || v < -2147483648 ? null : v;
  }

  const SKILL_PREFIXES = [["SK", 107], ["OS", 97], ["CHSK", 204], ["CLSK", 83], ["TABSK", 188], ["STAT", 0],
                          ["CHARSTAT", -1]];
  const SYM = {"!": "not", "(": "(", ")": ")"};

  /* Condition::BuildConditions for one token, onto out (with the implicit ANDs; st.last: the last kind added). */
  function buildConditions(token, out, st, F, rec) {
    const nonOperand = (k) => {
      if ((k === "not" || k === "(") && (st.last === "v" || st.last === ")")) out.push({k: "and"});
      out.push({k});
      st.last = k === "and" || k === "or" ? "op" : k;
    };
    let i = 0;
    for (; i < token.length && SYM[token[i]]; i++) nonOperand(SYM[token[i]]);
    token = token.slice(i);
    const end = [];
    let j = token.length - 1;
    for (; j >= 0 && SYM[token[j]]; j--) end.unshift(SYM[token[j]]);
    token = token.slice(0, j + 1);
    const d = token.search(/[<=>~]/);
    let key = token, op = "", a = 0, b = 0;
    if (d >= 0) {
      key = token.slice(0, d).trim();
      op = token[d];
      const vs = token.slice(d + 1).trim();
      if (vs.length) {
        const r = op === "~" ? vs.indexOf("-") : -1;
        if (r >= 0) {
          const x = readInt(vs.slice(0, r)), y = readInt(vs.slice(r + 1));
          if (x === null || y === null) {  // BH returns: the token and its trailing operators are dropped
            if (rec) rec.push({token, why: "its range doesn't read as two numbers"});
            return;
          }
          a = x; b = y;
        } else {
          const x = readInt(vs);
          if (x === null) {
            if (rec) rec.push({token, why: "its number doesn't read"});
            return;
          }
          a = x;
        }
      }
    }
    let f = null, only = null;  // only: the item codes or qualities this operand needs (the rule index)
    const kind = WORDS[key];
    if (kind === "AND") nonOperand("and");
    else if (kind === "OR") nonOperand("or");
    else if (kind) {
      f = operand(kind, key, op, a, b);
      if (QUALITY_INDEX[kind] && kind !== "NORM") only = {quals: [kind]};
      else if (kind === "NMAG") only = {quals: ["INF", "NORM", "SUP"]};
    } else if (key.length >= 3 && !/[A-Z]/.test(key.slice(0, 3)) && !/\p{Lu}/u.test(key.slice(0, 3))) {
      const code = key.slice(0, 4);
      f = (it) => it.code === undefined ? MAYBE : (it.code === code ? 1 : 0);
      only = {codes: [code]};
    } else if (key.indexOf("+") >= 0) {
      const parts = addParts(key, F);
      f = (it, c) => {
        const v = addValue(it, c, F, parts);
        return v === undefined ? MAYBE : cmp(v, op, a, 0);
      };
    } else {
      let done = false;
      for (const [pre, sid] of SKILL_PREFIXES) {
        if (!key.startsWith(pre)) continue;
        done = true;
        const n = readInt(key.slice(pre.length));
        if (n === null || n < 0) break;
        if (pre === "CHARSTAT") { if (n <= F.statMax) f = (it, c) => cmp(charStat(c, n), op, a, b); }
        else if (pre === "STAT") { if (n <= F.statMax) f = (it) => itemStat(it, n, 0, op, a, b); }
        else if (pre === "CLSK") { if (n < 7) f = (it) => itemStat(it, sid, n, op, a, b); }
        else if (pre === "TABSK") { if (n <= 50) f = (it) => itemStat(it, sid, n, op, a, b); }
        else if (pre === "CHSK") { if (n <= F.skillMax) f = (it) => cmp(charged(it, n), op, a, b); }
        else if (n <= F.skillMax) f = (it) => itemStat(it, sid, n, op, a, b);
        break;
      }
      if (!done && key.startsWith("MULTI")) {
        done = true;
        const m = /(\d{1,10}),(\d{1,10})/.exec(key);
        if (m && +m[1] <= 2147483647 && +m[2] <= 2147483647) {
          const s1 = +m[1], s2 = +m[2];
          f = (it) => itemStat(it, s1, s2, op, a, b);
        }
      }
      if (!done && F.formulas[key]) {
        const node = F.formulas[key];
        f = (it, c) => {
          const r = runFormula(node, it, c, F);
          if (r.unknown) return MAYBE;
          if (r.err) return 0;
          return op ? cmp(r.v, op, a, b) : (r.v !== 0 ? 1 : 0);
        };
      }
    }
    if (!f && rec && kind !== "AND" && kind !== "OR" && key) {
      rec.push({token, why: WORDS[key] ? "a word that needs a comparison" : /^(SK|OS|CHSK|CLSK|TABSK|STAT|CHARSTAT)/.test(key) ?
        "its number is out of range or missing" : "BH doesn't know this word"});
    }
    if (f) {
      if (st.last === "v" || st.last === ")") out.push({k: "and"});
      out.push({k: "v", f, word: token, only});
      st.last = "v";
    }
    for (const k of end) nonOperand(k);
  }

  const ALWAYS = {k: "always"};

  /* Condition::ProcessConditions (shunting-yard) and Rule::Convert: the tree, ALWAYS when no condition is left (an
     empty condition, or only words BH doesn't know), or null (never matches). */
  function tree(conds) {
    const rpn = [], stack = [];
    let cut = false;
    for (const c of conds) {
      if (c.k === "v") rpn.push(c);
      else if (c.k === "and" || c.k === "or" || c.k === "not") {
        if (c.k !== "not") {
          while (stack.length) {
            const t = stack[stack.length - 1].k;
            if (t === "not" || t === "and" || t === "or") rpn.push(stack.pop()); else break;
          }
        }
        stack.push(c);
      } else if (c.k === "(") stack.push(c);
      else if (c.k === ")") {
        let found = false;
        while (stack.length) {
          const s = stack.pop();
          if (s.k === "(") { found = true; break; }
          rpn.push(s);
        }
        if (!found) { cut = true; break; }
      }
    }
    if (!cut) {
      while (stack.length) {
        const s = stack.pop();
        if (s.k === "(" || s.k === ")") break;
        rpn.push(s);
      }
    }
    if (!rpn.length) return ALWAYS;  // Rule::Evaluate: a rule with no conditions left always matches
    const st = [];
    for (const c of rpn) {
      if (c.k === "v") st.push(c);
      else if (c.k === "and" || c.k === "or") {
        if (st.length < 2) return null;
        const rhs = st.pop(), lhs = st.pop();
        st.push({k: c.k, lhs, rhs});
      } else if (c.k === "not") {
        if (!st.length) return null;
        st.push({k: "not", lhs: st.pop()});
      } else return null;
    }
    return st.length === 1 ? st[0] : null;
  }

  /* What a condition needs of every item it can match: {codes: Set | null, quals: Set | null} (null: anything).
     An AND needs what either side needs, an OR what both sides need together; a ! needs nothing. */
  function needs(n, key) {
    if (!n) return null;
    if (n.k === "v") return n.only && n.only[key] ? new Set(n.only[key]) : null;
    if (n.k === "not" || n.k === "always") return null;
    const a = needs(n.lhs, key), b = needs(n.rhs, key);
    if (n.k === "and") {
      if (a && b) return new Set([...a].filter((x) => b.has(x)));
      return a || b;
    }
    if (a && b) return new Set([...a, ...b]);
    return null;
  }

  function evalTree(n, it, c, F) {
    switch (n.k) {
      case "v": return n.f(it, c, F);
      case "always": return 1;
      case "and": { const x = evalTree(n.lhs, it, c, F); return x === 0 ? 0 : Math.min(x, evalTree(n.rhs, it, c, F)); }
      case "or": { const x = evalTree(n.lhs, it, c, F); return x === 1 ? 1 : Math.max(x, evalTree(n.rhs, it, c, F)); }
      case "not": return 1 - evalTree(n.lhs, it, c, F);
    }
    return 0;
  }

  /* ================================================================ outputs */

  const UPPER_RE = /^(?:(?:%[^%]*%)|[^%])*%((?:\w|_|-)*?[a-z]+?(?:\w|_|-)*?)%/;
  const LEGACY = [["WHITE", 0x20], ["RED", 0x0A], ["GREEN", 0x84], ["BLUE", 0x97], ["GOLD", 0x0D], ["GRAY", 0xD0],
    ["BLACK", 0x00], ["TAN", 0x5A], ["ORANGE", 0x60], ["YELLOW", 0x0C], ["PURPLE", 0x9B], ["DARK_GREEN", 0x76],
    ["CORAL", 0x66], ["SAGE", 0x82], ["TEAL", 0xCB], ["LIGHT_GRAY", 0xD6]];

  function takeOut(text, re) {
    const m = re.exec(text);
    return m ? [text.slice(0, m.index) + text.slice(m.index + m[0].length), m] : [text, null];
  }

  /* BuildAction: {name, desc (replacement parts), text, descText (as written), cont, border, map, dot, px, line,
     notify, tier, sound, notifies}. */
  function action(out, F) {
    let name = out;
    for (let n = 0; n < 1000; n++) {
      const m = UPPER_RE.exec(name);
      if (!m) break;
      const start = m[0].length - m[1].length - 1;
      name = name.slice(0, start) + m[1].replace(/[a-z]/g, (x) => x.toUpperCase()) + name.slice(start + m[1].length);
    }
    const a = {cont: false, border: null, map: null, dot: null, px: null, line: null, notify: null, tier: -1, sound: 0};
    for (const [k, f] of [["BORDER", "border"], ["MAP", "map"], ["DOT", "dot"], ["PX", "px"], ["LINE", "line"],
                          ["NOTIFY", "notify"]]) {
      const [t, m] = takeOut(name, new RegExp("%" + k + "-([a-f0-9]{1,4})%", "i"));
      name = t;
      if (m) a[f] = parseInt(m[1], 16);
    }
    {
      const [t, m] = takeOut(name, /%TIER-([0-9])%/i);
      name = t;
      if (m) a.tier = +m[1];
    }
    let desc = "";
    const l = name.indexOf("{"), r = name.indexOf("}");
    if (l >= 0 && r >= 0 && l < r) {
      desc = name.slice(l + 1, r);
      name = name.slice(0, l) + name.slice(r + 1);
    }
    {
      const [t, m] = takeOut(name, /%SOUNDID-([0-9]{1,4})%/i);
      name = t;
      if (m && +m[1] < F.soundCount) a.sound = +m[1];
    }
    const legacy = name.indexOf("%MAP%");
    if (legacy >= 0) {
      let color = 0x20, last = 0;
      for (const [c, v] of LEGACY) {
        const p = name.indexOf("%" + c + "%");
        if (p >= 0 && p < legacy && p >= last) { color = v; last = p; }
      }
      name = name.slice(0, legacy) + name.slice(legacy + 5);
      a.map = color;
      if (a.border === null) a.border = color;
    }
    const done = name.indexOf("%CONTINUE%");
    if (done >= 0) { name = name.slice(0, done) + name.slice(done + 10); a.cont = true; }
    a.text = name;
    a.descText = desc;
    a.name = replacements(name, F);
    a.desc = replacements(desc, F);
    a.notifies = a.border !== null || a.map !== null || a.dot !== null || a.px !== null || a.line !== null ||
                 a.sound !== 0;
    return a;
  }

  const COLORS = dict({WHITE: "0", RED: "1", GREEN: "2", BLUE: "3", GOLD: "4", GRAY: "5", TAN: "7", ORANGE: "8",
    YELLOW: "9", PURPLE: ";", DARK_GREEN: ":", BLACK: "\x02", CORAL: "\x06", SAGE: "\x07", TEAL: "\x09",
    LIGHT_GRAY: "\x0C", FULL_TRANS: "\x40", THREE_FOURTHS_TRANS: "\x41", HALF_TRANS: "\x42", QUARTER_TRANS: "\x43"});
  const STATIC = new Set(["NAME", "BASENAME", "SOCKETS", "RUNENUM", "RUNENAME", "GEMLEVEL", "GEMTYPE", "ILVL", "ALVL",
    "CRAFTALVL", "REROLLALVL", "LVLREQ", "WPNSPD", "RANGE", "CODE", "LBRACE", "RBRACE", "PERCENT", "BUYPRICE",
    "SELLPRICE", "PRICE", "QTY", "RES", "ED", "CS", "CL", "NL", "REQSTR", "REQDEX", "REQLVL", "BASEMINONEH",
    "BASEMAXONEH", "BASEMINTWOH", "BASEMAXTWOH", "BASEMINTHROW", "BASEMAXTHROW", "BASEMINKICK", "BASEMAXKICK",
    "BASEMINSMITE", "BASEMAXSMITE", "BASEBLOCK", "ALLATTRIB", "MAXRES", "PLUSDEF", "UPSTR", "UPDEX", "UPLVL",
    "MAXSOCKETS", "MINDMG", "MAXDMG", "EDEF", "EDAM", "DEF", "FRES", "CRES", "LRES", "PRES", "IAS", "FCR", "FHR", "FBR",
    "LIFE", "MANA", "ARPER", "MFIND", "GFIND", "STR", "DEX", "FRW", "AR", "DTM", "MAEK", "REPLIFE", "REPQUANT",
    "REPAIR"]);
  const DYNAMIC = dict({STAT: 1, SK: 1, OS: 1, CLSK: 1, TABSK: 1, CHARSTAT: 1, MULTI: 2});
  const KEYWORD_RE = /%([A-Z_]+)(?:(\d{1,9})(?:,(\d{1,9}))?)?%/g;

  /* BuildReplacementActions: [string | {k, p1, p2} | {formula, ref}]. */
  function replacements(text, F) {
    const out = [];
    let last = 0;
    while (last < text.length) {
      KEYWORD_RE.lastIndex = last;
      const m = KEYWORD_RE.exec(text);
      if (!m) break;
      if (m.index > last) out.push(text.slice(last, m.index));
      const name = m[1], count = (m[2] ? 1 : 0) + (m[3] ? 1 : 0);
      let spec;
      if (COLORS[name] !== undefined) spec = count ? m[0] : "ÿc" + COLORS[name];
      else if (STATIC.has(name)) spec = count ? m[0] : {k: name};
      else if (DYNAMIC[name] !== undefined) spec = count !== DYNAMIC[name] ? m[0] : {k: name, p1: +m[2], p2: m[3] ? +m[3] : 0};
      else if (F.formulas[name]) spec = count ? m[0] : {formula: F.formulas[name], ref: name};
      if (spec === undefined) {  // no such keyword: its text but the last %, and look again from that %
        out.push(m[0].slice(0, -1));
        last = m.index + m[0].length - 1;
        continue;
      }
      out.push(spec);
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }

  const fmtInt = (v) => v === undefined ? "?" : String(Math.trunc(v) | 0);
  const GEM_LEVELS = ["NONE", "Chipped", "Flawed", "Normal", "Flawless", "Perfect"];
  const GEM_TYPES = ["NONE", "Amethyst", "Diamond", "Emerald", "Ruby", "Sapphire", "Topaz", "Skull"];
  function stripColor(s) { return /^ÿc./.test(s) ? s.slice(3) : s; }

  /* ReplacementValue::Replace; s: the ReplaceContext {name, limit, nlAllowed, nmagStaffmod, blockedNL}. */
  function replaceOne(spec, s, it, c, F) {
    if (typeof spec === "string") return spec;
    if (spec.formula) {
      const r = runFormula(spec.formula, it, c, F);
      if (r.unknown) return "?";
      return r.err ? "f_err" : formatNumber(r.v);
    }
    const b = it.base || {};
    switch (spec.k) {
      case "NAME": if (s.name.length > 1023) s.name = s.name.slice(0, 1023); return s.name;
      case "BASENAME": return stripColor(b.name || "");
      case "LBRACE": return "{";
      case "RBRACE": return "}";
      case "PERCENT": return "%";
      case "CS": return "\b";
      case "CL": case "NL": {
        const ch = spec.k === "CL" ? "\r" : "\n";
        if (s.blockedNL) return "";
        if (!s.limit || s.nlAllowed) return ch;
        if (s.nmagStaffmod) { s.blockedNL = true; return ch; }
        return "";
      }
      case "SOCKETS": return fmtInt(unitStat(it, 194, 0));
      case "RUNENUM": { const r = rune(it); return r === undefined ? "?" : String(r || 0); }
      case "RUNENAME": {
        if (!b.rune) return "";
        const n = b.name || "", k = n.indexOf(" ");
        return k < 0 ? n : n.slice(0, k);
      }
      case "GEMLEVEL": return b.gem ? GEM_LEVELS[b.gem[0]] || "" : "";
      case "GEMTYPE": return b.gem ? GEM_TYPES[b.gem[1]] || "" : "";
      case "ILVL": return fmtInt(it.ilvl);
      case "ALVL": return fmtInt(alvl(it));
      case "CRAFTALVL": return fmtInt(craftAlvl(it, c));
      case "REROLLALVL": return fmtInt(rerollAlvl(it, c));
      case "LVLREQ": return fmtInt(it.lvlreq);
      case "WPNSPD": return String(b.speed || 0);
      case "RANGE": return String(b.range || 0);
      case "CODE": return it.code || "";
      case "BUYPRICE": return b.quest ? "" : fmtInt(it.buy);
      case "SELLPRICE": case "PRICE": return b.quest ? "" : fmtInt(it.sell);
      case "QTY": return fmtInt(unitStat(it, 70, 0));
      case "RES": return fmtInt(minOfAll(it, [39, 41, 43, 45]));
      case "ED": return fmtInt(edValue(it));
      case "REQSTR": return fmtInt(reqStat(it, "STR"));
      case "REQDEX": return fmtInt(reqStat(it, "DEX"));
      case "REQLVL": return fmtInt(reqStat(it, "LEVEL"));
      case "BASEBLOCK": return fmtInt(it.base ? b.block || 0 : undefined);
      case "ALLATTRIB": return fmtInt(minOfAll(it, [0, 2, 1, 3]));
      case "MAXRES": return fmtInt(minOfAll(it, [40, 44, 42, 46]));
      case "PLUSDEF": return fmtInt(listStat(it, 31));
      case "UPSTR": return fmtInt(upStat(it, "STR"));
      case "UPDEX": return fmtInt(upStat(it, "DEX"));
      case "UPLVL": return fmtInt(upStat(it, "LEVEL"));
      case "MAXSOCKETS": return fmtInt(maxSockets(it));
      case "MINDMG": return fmtInt(minMax(it, false));
      case "MAXDMG": return fmtInt(minMax(it, true));
      case "STAT": return spec.p1 > F.statMax ? "" : fmtInt(adjusted(it, spec.p1, 0));
      case "SK": return spec.p1 > F.skillMax ? "" : fmtInt(unitStat(it, 107, spec.p1));
      case "OS": return spec.p1 > F.skillMax ? "" : fmtInt(unitStat(it, 97, spec.p1));
      case "CLSK": return spec.p1 > F.skillMax ? "" : fmtInt(unitStat(it, 83, spec.p1));
      case "TABSK": return spec.p1 > F.skillMax ? "" : fmtInt(unitStat(it, 188, spec.p1));
      case "CHARSTAT": return spec.p1 > F.statMax ? "" : fmtInt(charStat(c, spec.p1));
      case "MULTI": return spec.p1 > F.statMax ? "" : fmtInt(unitStat(it, spec.p1, spec.p2));
    }
    if (spec.k.startsWith("BASEM")) return fmtInt(baseDamage(it, spec.k.slice(4)));
    if (STAT_WORDS[spec.k] !== undefined) return fmtInt(adjusted(it, STAT_WORDS[spec.k], 0));
    return "";
  }

  function applyParts(parts, s, it, c, F) {
    let out = "";
    for (const p of parts) out += replaceOne(p, s, it, c, F);
    return out;
  }

  const WS = (ch) => ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\v" || ch === "\f";
  const CODE_RE = /ÿc[0-9;:\x01-\x1F]/g;
  function visibleLength(s) { return s.replace(CODE_RE, "").length; }

  /* TrimItemText: {text, cut (visible characters the 56 / 512 limit cut)}. limit: the visible limit, 0 for a
     description. */
  function trim(text, limit, code) {
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === "\r") {
        if (!out.length || out[out.length - 1] === "\n") continue;
        if (i + 1 < text.length && text[i + 1] !== "\n" && text[i + 1] !== "\r") out += "\n";
      } else if (ch === "\b") {
        if (!out.length || WS(out[out.length - 1]) || out[out.length - 1] === "\b") continue;
        if (i + 1 < text.length && !WS(text[i + 1]) && text[i + 1] !== "\b") out += " ";
      } else out += ch;
    }
    let cut = 0;
    if (limit) {
      const codes = [];
      CODE_RE.lastIndex = 0;
      let m;
      while ((m = CODE_RE.exec(out))) codes.push(m.index);
      let keep = 0;
      for (const pos of codes) {
        if (pos - keep > limit) break;
        keep += 3;
      }
      if (out.length - 3 * codes.length > limit) {
        const max = limit + keep;
        cut = visibleLength(out.slice(max));
        out = out.slice(0, max);
      }
    }
    const hard = code && /^[ti]bk/.test(code) ? 127 : 512;
    if (out.length > hard - 1) out = out.slice(0, hard - 1);
    return {text: out, cut};
  }

  /* ItemNamePatch's copy: a color code too near the end dropped, then nameSize - 1 characters (127; 123 for quest
     items; 511 on the gamble screen). */
  function copyName(name, size) {
    const last = name.lastIndexOf("ÿc");
    if (last >= 0 && last > size - 5) name = name.slice(0, last);
    return name.length > size - 1 ? {text: name.slice(0, size - 1), cut: name.length - (size - 1)} : {text: name, cut: 0};
  }

  /* The chat line (MapNotify): the name's outer white space and color codes trimmed (the last leading code kept; a
     name of several lines is left as it is: the trim doesn't match across a line break), each line break " - ", at
     most 151 bytes. Its color: the quality's. */
  const CHAT_RE = /^[ \t\n\v\f\r]*(?:(?:[ \t\n\v\f\r]*?)(ÿc[0123456789;:]))*[ \t\n\v\f\r]*(.*?[^ \t\n\v\f\r])[ \t\n\v\f\r]*(?:ÿc[0123456789;:])*[ \t\n\v\f\r]*$/;
  function chatLine(name) {
    const m = CHAT_RE.exec(name);
    let s = m ? (m[1] || "") + m[2] : name;
    s = s.replace(/\n/g, " - ");
    const enc = new TextEncoder();
    if (enc.encode(s).length > 151) {
      let n = s.length;
      while (n > 0 && enc.encode(s.slice(0, n)).length > 151) n--;
      s = s.slice(0, n);
    }
    return s;
  }

  /* ================================================================ compiling a filter */

  /* BH's island refs: ISLAND_A..Z, then AA, BA, ...: its suffix counts up from the first letter. */
  function islandNamer() {
    const suffix = [];
    const name = () => "ISLAND_" + suffix.map((x) => String.fromCharCode(65 + x)).join("");
    return () => {
      for (let i = 0; i < suffix.length; i++) {
        if (suffix[i] === 25) { suffix[i] = 0; continue; }
        suffix[i]++;
        return name();
      }
      suffix.push(0);
      return name();
    };
  }

  /* ReplaceFormulaIslands: each $f(...) that compiles becomes pre + its ref + suf. */
  function islands(text, pre, suf, F, next) {
    if (text.indexOf("$f(") < 0) return text;
    let out = "", at = 0;
    while (at < text.length) {
      const start = text.indexOf("$f(", at);
      if (start < 0) { out += text.slice(at); break; }
      out += text.slice(at, start);
      let count = 0, end = text.length;
      for (let i = start + 2; i < text.length; i++) {
        if (text[i] === "(") count++;
        else if (text[i] === ")") { count--; if (count === 0) { end = i; break; } }
      }
      if (end < text.length) {
        const node = compileFormula(text.slice(start + 3, end));
        if (node) {
          const ref = next();
          F.formulas[ref] = node;
          F.formulaText[ref] = text.slice(start + 3, end);
          out += pre + ref + suf;
        } else out += text.slice(start, end + 1);
        at = end + 1;
        continue;
      }
      out += "$f(";
      at = start + 3;
    }
    return out;
  }

  /* A version's lines (alias form, toggles as they are) as BH reads them. opts: {statMax, skillMax, soundCount}.
     -> {rules: [{i, n, cond, out, tree, act}], mapRules, byLine, formulas}. */
  function compile(lines, opts) {
    opts = opts || {};
    const core = EZ.core;
    const entries = core.bhEntries(lines);
    const aliases = core.bhAliases(entries);
    const rules = core.ruleEntries(lines, entries).filter((r) => !r.prefix);
    const texts = core.substitute([rules.map((r) => r.cond), rules.map((r) => r.out)], aliases);
    const F = {formulas: dict(), formulaText: dict(), statMax: opts.statMax || 1023, skillMax: opts.skillMax || 1023,
               soundCount: opts.soundCount || 10000, rules: [], mapRules: [], byLine: new Map()};
    for (const e of entries) {
      const m = /^Formula\[(.*)\]$/.exec(e.key);
      if (!m) continue;
      const node = compileFormula(e.value);
      if (!node) continue;
      const ref = "FORMULA" + m[1].replace(/[a-z]/g, (x) => x.toUpperCase());
      F.formulas[ref] = node;
      F.formulaText[ref] = e.value;
    }
    const next = islandNamer();
    for (let n = 0; n < rules.length; n++) {
      const cond = islands(texts[0][n], "", "", F, next);
      const out = islands(texts[1][n], "%", "%", F, next);
      const conds = [], st = {last: null};
      for (const tok of cond.split(/[ \t\n\r\v\f]+/)) if (tok) buildConditions(tok, conds, st, F);
      const t = tree(conds);
      const r = {i: rules[n].i, n, cond: texts[0][n], out: texts[1][n], tree: t, act: action(out, F),
                 codes: needs(t, "codes"), quals: needs(t, "quals")};
      F.rules.push(r);
      F.byLine.set(r.i, r);
      if (r.act.notifies) F.mapRules.push(r);
    }
    F.lists = new Map();
    return F;
  }

  /* The rules that can match an item of this code and quality, in order (both passes): {rules, mapRules}. */
  function rulesFor(F, it) {
    const key = (it.code === undefined ? "?" : it.code) + "|" + (it.quality === undefined ? "?" : it.quality);
    let l = F.lists.get(key);
    if (!l) {
      const ok = (r) => r.tree && (!r.codes || it.code === undefined || r.codes.has(it.code)) &&
                        (!r.quals || it.quality === undefined || r.quals.has(it.quality));
      l = {rules: F.rules.filter(ok), mapRules: F.mapRules.filter(ok)};
      F.lists.set(key, l);
    }
    return l;
  }

  /* ================================================================ running */

  /* The color the game puts in front of the name (after BH's): gray for an ethereal or socketed non-magical item, gold
     for a runeword. */
  const QUALITY_COLOR = {INF: "0", NORM: "0", SUP: "0", MAG: "3", SET: "2", RARE: "9", UNI: "4", CRAFT: "8"};
  function gameColor(it) {
    if (it.rw) return "4";
    if (NMAG[it.quality] && (it.eth || (unitStat(it, 194, 0) || 0) > 0)) return "5";
    return QUALITY_COLOR[it.quality] || "0";
  }

  function match(r, it, c, F) { return r.tree ? evalTree(r.tree, it, c, F) : 0; }

  /* A unique or set the game's Force Show options show whatever the filter does. */
  function forceShow(it, o) {
    if ((it.quality !== "UNI" && it.quality !== "SET") || !it.disc) return false;
    return (o.forceUndiscovered !== false && it.disc.ALLDISCOVERED === false) ||
           (!!o.forceUnowned && it.disc.ALLOWNED === false);
  }

  /* What BH and the game show for the item: {name (the label as BH hands it to the game, which then draws it after its
     own color code, start), start, desc, hidden (no label), invisible (BH doesn't draw the item at all), forced,
     icons [{i, border, map, dot, px}], chat (the chat line's text), chatRule, sound, soundRule, trace [{i, kind:
     continue / stop / maybe / notify}], stop (the line that stopped the rules), cut {name, copy}, maybe}.
     o: the game's options {hideHealing, hideMana, forceUndiscovered (on), forceUnowned, detailed (1: every drop, 2:
     new drops, 0: none), newDrop (true), dropSounds (on), nameSize (128: ground, hover box, inventory)}. */
  function run(F, it, c, o) {
    o = o || {};
    const trace = [];
    const lvl = c.filtlvl;
    if (it.code && /^[hm]p[1-5]$/.test(it.code) &&
        ((it.code[0] === "h" && o.hideHealing) || (it.code[0] === "m" && o.hideMana))) {
      return {name: "", start: "0", desc: "", hidden: true, invisible: true, byOption: true, forced: false, icons: [],
              chat: null, chatRule: null, sound: 0, soundRule: null, trace, stop: null, cut: {name: 0, copy: 0},
              maybe: false};
    }
    let game = it.gameName || "";
    if (game[0] === " ") game = game.slice(1);
    if (game[game.length - 1] === " ") game = game.slice(0, -1);
    const shop = it.place === "SHOP";
    const s = {name: game, limit: true, blockedNL: false,
               nlAllowed: !!((it.id && (QUALITY_INDEX[it.quality] >= 4 || it.rw)) || shop),
               nmagStaffmod: !!NMAG[it.quality] && !!it.base &&
                 !!(it.base.staffmod || (it.base.autoprefix > 0 && it.base.autoprefix !== 308) || it.quality === "SUP")};
    const d = {name: "", limit: false, blockedNL: false, nlAllowed: true, nmagStaffmod: false};
    let stop = null, maybe = false, emptyBeforeStop = false;
    const lists = rulesFor(F, it);
    for (const r of lists.rules) {
      const v = match(r, it, c, F);
      if (v === 0) continue;
      if (v === MAYBE) { maybe = true; trace.push({i: r.i, kind: "maybe"}); continue; }
      s.name = applyParts(r.act.name, s, it, c, F);
      d.name = applyParts(r.act.desc, d, it, c, F);
      if (!r.act.text.length) emptyBeforeStop = true;
      trace.push({i: r.i, kind: r.act.cont ? "continue" : "stop"});
      if (!r.act.cont) { stop = r.i; break; }
    }
    const tn = s.name ? trim(s.name, shop ? 512 : 56, it.code) : {text: "", cut: 0};
    const desc = d.name ? trim(d.name, 0, it.code).text : "";
    const forced = forceShow(it, o);
    let name = tn.text, hidden = false;
    if (!name) {
      if (!lvl) name = it.gameName || "";  // GetItemName: on level 0 an empty name keeps the game's
      else if (forced) name = it.gameName || "";
      else hidden = true;
    }
    const size = o.nameSize || (it.base && it.base.quest ? 124 : 128);
    const copy = name ? copyName(name, size) : {text: "", cut: 0};
    name = copy.text;
    // the notification pass
    let chatRule = null, sound = 0, soundRule = null, any = false;
    const icons = [];
    for (const r of lists.mapRules) {
      const v = match(r, it, c, F);
      if (v !== 1) {
        if (v === MAYBE) { maybe = true; if (!trace.some((x) => x.i === r.i)) trace.push({i: r.i, kind: "maybe", notify: true}); }
        continue;
      }
      any = true;
      const a = r.act;
      if (chatRule === null && (!lvl || a.tier === -1 || a.tier >= lvl)) {
        chatRule = r.i;
        sound = a.sound;
        soundRule = a.sound ? r.i : null;
      }
      if (a.border !== null || a.map !== null || a.dot !== null || a.px !== null) {
        icons.push({i: r.i, border: a.border, map: a.map, dot: a.dot, px: a.px});
      }
      const t = trace.find((x) => x.i === r.i);
      if (t) t.notify = true; else trace.push({i: r.i, kind: "notify", notify: true});
      if (!a.cont) break;  // the pages' model: icons and the chat line end at the first matching rule that stops
    }
    trace.sort((x, y) => x.i - y.i);
    const invisible = !!lvl && emptyBeforeStop && !any && !forced;
    const start = gameColor(it);
    const detailed = o.detailed === undefined ? 1 : o.detailed;
    const told = chatRule !== null && !invisible && (detailed === 1 || (detailed === 2 && o.newDrop !== false));
    const chat = told ? (name ? chatLine("ÿc" + start + name) : "") : null;
    if (!told || o.dropSounds === false) sound = 0;
    return {name, start, desc, hidden: hidden || invisible, invisible, forced, icons: invisible ? [] : icons, chat,
            chatRule: told ? chatRule : null, sound, soundRule: sound ? soundRule : null, trace, stop,
            cut: {name: tn.cut, copy: copy.cut}, maybe};
  }

  /* Can the rule at this line match an item like this? 1, MAYBE or 0 (what the item leaves out: maybe). */
  function canMatch(F, line, it, c) {
    const r = F.byLine.get(line);
    return r ? match(r, it, c, F) : 0;
  }

  /* What BH makes of a condition (lint): {dropped: [{token, why}], never (no tree: it never matches), always (no
     condition left: it always matches), codes (the item codes it names)}. F: a compiled filter (its formulas). */
  function analyze(text, F) {
    F = F || {formulas: dict(), statMax: 1023, skillMax: 1023, soundCount: 10000};
    const conds = [], st = {last: null}, rec = [];
    for (const tok of text.split(/[ \t\n\r\v\f]+/)) if (tok) buildConditions(tok, conds, st, F, rec);
    const t = tree(conds);
    return {dropped: rec, never: !t, always: t && t.k === "always", codes: conds.filter((c) => c.only && c.only.codes)
      .map((c) => c.only.codes[0])};
  }

  /* One condition's tree from its text (the tests; lint), and its value for an item. */
  function condition(text, F) {
    F = F || {formulas: dict(), statMax: 1023, skillMax: 1023, soundCount: 10000};
    const conds = [], st = {last: null};
    for (const tok of text.split(/[ \t\n\r\v\f]+/)) if (tok) buildConditions(tok, conds, st, F);
    return tree(conds);
  }

  return {compile, run, canMatch, match, action, compileFormula, runFormula, formatNumber, trim, copyName, chatLine,
          affixLevel, gameColor, condition, analyze, islandsOf: islands, islandNamer, replacements, MAYBE,
          QUALITY_COLOR, CLASS_ID, PLACES, VARS, WORDS,
          evalCondition: (t, it, c, F) => t ? evalTree(t, it, c, F || {formulas: dict()}) : 0};
})();
