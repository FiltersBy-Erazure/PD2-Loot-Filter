/* The player's changes to Erazure's own rules (the Erazure's rules area): switch a rule off or on, change it, or put
   lines before or after it. Each change (an op) names its line by what it was when the player made it: its section,
   its place there and its text. Every new Erazure finds the line again the way tools/style_edits.py finds Corr's
   entries (Filter.find, ported with difflib's SequenceMatcher): the same text nearest its place, else the same
   condition and comment in its section showing much the same, else a line of its section near its place at least 80%
   alike with the same comment; a change no stage finds waits for the player ("needs attention"). A changed line that
   Erazure has changed since gets both changes, word by word (style_edits.merge3: the player's wins where both changed
   the same words).

   The step runs first, on the version's lines as the player browsed them; every other edit applies after it.
   tools/editor_selftest.py checks it against style_edits.py itself. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.ops = (function () {
  "use strict";
  const ALIKE = 0.8, NEAR = 150, SHOWS_ALIKE = 0.5;
  const RULE_RE = /^(ItemDisplay\[.*?\]:)(.*)$/;
  const ALIAS_RE = /^(Alias\[([A-Za-z0-9_]+)\]:)(.*)$/;
  const TOKEN_RE = /%[A-Z0-9_\-]+%|\s+|[\p{L}\p{N}_]+|[\s\S]/gu;
  const OFF_RE = /^\s*\/\/+\s*(?=ItemDisplay\[)/;
  const KINDS = ["off", "on", "change", "before", "after"];
  const CLAIMS = {off: true, on: true, change: true};

  /* ---------------------------------------------------------------- difflib.SequenceMatcher (no junk) */

  function b2jOf(b) {
    const m = new Map();
    for (let j = 0; j < b.length; j++) {
      let l = m.get(b[j]);
      if (!l) m.set(b[j], l = []);
      l.push(j);
    }
    return m;
  }

  /* SequenceMatcher(None, a, b, autojunk=False) over arrays (a string's letters: Array.from). */
  function Matcher(a, b, b2j) {
    this.a = a;
    this.b = b;
    this.b2j = b2j || b2jOf(b);
    this.blocks = null;
  }
  Matcher.prototype.longest = function (alo, ahi, blo, bhi) {
    const a = this.a, b2j = this.b2j;
    let besti = alo, bestj = blo, bestsize = 0, j2len = new Map();
    for (let i = alo; i < ahi; i++) {
      const next = new Map(), js = b2j.get(a[i]);
      if (js) {
        for (const j of js) {
          if (j < blo) continue;
          if (j >= bhi) break;
          const k = (j2len.get(j - 1) || 0) + 1;
          next.set(j, k);
          if (k > bestsize) { besti = i - k + 1; bestj = j - k + 1; bestsize = k; }
        }
      }
      j2len = next;
    }
    return [besti, bestj, bestsize];
  };
  Matcher.prototype.matching = function () {
    if (this.blocks) return this.blocks;
    const la = this.a.length, lb = this.b.length, queue = [[0, la, 0, lb]], found = [];
    while (queue.length) {
      const [alo, ahi, blo, bhi] = queue.pop();
      const [i, j, k] = this.longest(alo, ahi, blo, bhi);
      if (!k) continue;
      found.push([i, j, k]);
      if (alo < i && blo < j) queue.push([alo, i, blo, j]);
      if (i + k < ahi && j + k < bhi) queue.push([i + k, ahi, j + k, bhi]);
    }
    found.sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2]);
    const out = [];
    let i1 = 0, j1 = 0, k1 = 0;
    for (const [i2, j2, k2] of found) {
      if (i1 + k1 === i2 && j1 + k1 === j2) k1 += k2;
      else { if (k1) out.push([i1, j1, k1]); i1 = i2; j1 = j2; k1 = k2; }
    }
    if (k1) out.push([i1, j1, k1]);
    out.push([la, lb, 0]);
    return (this.blocks = out);
  };
  const calc = (m, t) => t ? 2 * m / t : 1;
  Matcher.prototype.ratio = function () {
    let m = 0;
    for (const x of this.matching()) m += x[2];
    return calc(m, this.a.length + this.b.length);
  };
  Matcher.prototype.quickRatio = function () {
    const full = new Map();
    for (const x of this.b) full.set(x, (full.get(x) || 0) + 1);
    const avail = new Map();
    let m = 0;
    for (const x of this.a) {
      const n = avail.has(x) ? avail.get(x) : (full.get(x) || 0);
      avail.set(x, n - 1);
      if (n > 0) m++;
    }
    return calc(m, this.a.length + this.b.length);
  };
  Matcher.prototype.realQuickRatio = function () {
    return calc(Math.min(this.a.length, this.b.length), this.a.length + this.b.length);
  };
  Matcher.prototype.opcodes = function () {
    let i = 0, j = 0;
    const out = [];
    for (const [ai, bj, size] of this.matching()) {
      const tag = i < ai && j < bj ? "replace" : i < ai ? "delete" : j < bj ? "insert" : "";
      if (tag) out.push([tag, i, ai, j, bj]);
      i = ai + size;
      j = bj + size;
      if (size) out.push(["equal", ai, i, bj, j]);
    }
    return out;
  };
  const chars = (s) => Array.from(s);

  /* ---------------------------------------------------------------- lines (style_edits.split / note) */

  function split(line) {
    let m = RULE_RE.exec(line);
    if (m) {
      const c = m[2].indexOf("//");
      return c < 0 ? [m[1], m[2], ""] : [m[1], m[2].slice(0, c), m[2].slice(c)];
    }
    m = ALIAS_RE.exec(line);
    if (m) return [m[1], m[3], ""];
    return [null, line, ""];
  }
  const note = (line) => split(line)[2].slice(2).trim();
  const aliasName = (line) => { const m = ALIAS_RE.exec(line); return m ? m[2] : null; };

  function showsAlike(a, b) {
    const m = new Matcher(chars(split(a)[1]), chars(split(b)[1]));
    return m.realQuickRatio() >= SHOWS_ALIKE && m.quickRatio() >= SHOWS_ALIKE && m.ratio() >= SHOWS_ALIKE;
  }

  /* ---------------------------------------------------------------- finding a line (style_edits.Filter) */

  function Filter(lines, starts) {
    this.lines = lines;
    this.names = starts.map((s) => s[0]);
    this.at = starts.map((s) => s[1]);
    this.first = new Map(starts);
    this.exact = new Map();
    this.rules = new Map();
    this.aliases = new Map();
    const push = (map, k, i) => { const l = map.get(k); if (l) l.push(i); else map.set(k, [i]); };
    lines.forEach((line, i) => {
      push(this.exact, line, i);
      const head = split(line)[0];
      if (head === null) return;
      const name = aliasName(line);
      if (name) push(this.aliases, name, i);
      else push(this.rules, head + "\u0000" + note(line), i);
    });
  }
  Filter.prototype.fileOf = function (i) {
    let lo = 0, hi = this.at.length;  // bisect_right
    while (lo < hi) { const mid = (lo + hi) >> 1; if (i < this.at[mid]) hi = mid; else lo = mid + 1; }
    return lo - 1 >= 0 ? this.names[lo - 1] : null;
  };
  Filter.prototype.pos = function (file, line) {
    return this.first.has(file) && line ? this.first.get(file) + line - 1 : null;
  };
  Filter.prototype.place = function (i) {
    const name = this.fileOf(i);
    return name ? [name, i - this.first.get(name) + 1] : [null, i + 1];
  };
  Filter.prototype.find = function (old, file, pos, taken, stage) {
    const free = (idxs) => idxs.filter((i) => !taken.has(i));
    const nearest = (idxs) => {
      let best = null, bk = null;
      for (const i of idxs) {
        const k = [this.fileOf(i) !== file ? 1 : 0, pos !== null ? Math.abs(i - pos) : 0];
        if (best === null || k[0] < bk[0] || (k[0] === bk[0] && k[1] < bk[1])) { best = i; bk = k; }
      }
      return best;
    };
    if (stage === "exact") return nearest(free(this.exact.get(old) || []));
    const name = aliasName(old);
    if (stage === "condition") {
      if (name) return nearest(free(this.aliases.get(name) || []));
      const head = split(old)[0];
      if (head === null) return null;
      return nearest(free(this.rules.get(head + "\u0000" + note(old)) || []).filter((i) =>
        (file === null || this.fileOf(i) === file) && showsAlike(old, this.lines[i])));
    }
    if (pos === null || name) return null;
    let best = ALIKE, found = null;
    const want = note(old), b = chars(old), b2j = b2jOf(b), oldHead = split(old)[0];
    for (let i = Math.max(0, pos - NEAR); i < Math.min(this.lines.length, pos + NEAR + 1); i++) {
      const line = this.lines[i];
      if (taken.has(i) || !line.trim() || (file && this.fileOf(i) !== file) || note(line) !== want) continue;
      if ((split(line)[0] === null && oldHead !== null) || aliasName(line)) continue;
      const m = new Matcher(chars(line), b, b2j);
      if (m.realQuickRatio() > best && m.quickRatio() > best) {
        const r = m.ratio();
        if (r > best && showsAlike(old, line)) { best = r; found = i; }
      }
    }
    return found;
  };

  const STAGES = ["exact", "condition", "alike"];

  /* Each op's line in these lines: [{op, i (or null), how: exact / condition / alike}], the ops that claim their line
     (off, on, change) taking it from the others, stage by stage as style_edits.place_entries does. */
  function place(ops, flt) {
    const out = ops.map((op) => ({op, i: null, how: null}));
    const taken = new Set(), none = new Set();
    for (const stage of STAGES) {
      for (const p of out) {
        if (p.i !== null || !p.op.at) continue;
        const pos = flt.pos(p.op.at.file, p.op.at.line);
        const claims = !!CLAIMS[p.op.kind];
        const i = flt.find(p.op.at.text, p.op.at.file || null, pos, claims ? taken : none, stage);
        if (i !== null) {
          p.i = i;
          p.how = stage;
          if (claims) taken.add(i);
        }
      }
    }
    return out;
  }

  /* ---------------------------------------------------------------- the word merge (style_edits.merge3) */

  const tokens = (text) => text.match(TOKEN_RE) || [];

  function hunks(a, b) {
    return new Matcher(a, b).opcodes().filter((o) => o[0] !== "equal").map(([, i1, i2, j1, j2]) => [i1, i2, b.slice(j1, j2)]);
  }
  function clash(x, y) {
    const [a1, a2] = x, [b1, b2] = y;
    return (a1 < b2 && b1 < a2) || (a1 === a2 && a2 === b1 && b1 === b2) || (a1 === a2 && b1 < a1 && a1 < b2) ||
           (b1 === b2 && a1 < b1 && b1 < a2);
  }
  function patch(base, lo, hi, hs) {
    const out = [];
    let pos = lo;
    for (const [i1, i2, rep] of hs.slice().sort((x, y) => x[0] - y[0] || x[1] - y[1])) {
      out.push(...base.slice(pos, i1), ...rep);
      pos = i2;
    }
    return out.concat(base.slice(pos, hi));
  }

  /* [merged text, whether both changed the same words]: both sides' changes from base, mine (the player's) winning
     where they overlap. */
  function merge3(base, mine, theirs) {
    if (theirs === base || mine === theirs) return [mine, false];
    if (mine === base) return [theirs, false];
    const b = tokens(base);
    const marked = hunks(b, tokens(mine)).map((h) => [h, "s"]).concat(hunks(b, tokens(theirs)).map((h) => [h, "a"]));
    marked.sort((x, y) => x[0][0] - y[0][0] || x[0][1] - y[0][1]);  // a stable sort, as Python's
    const clusters = [];
    for (const [h, side] of marked) {
      const last = clusters[clusters.length - 1];
      if (last && last.some(([g]) => clash(h, g))) last.push([h, side]); else clusters.push([[h, side]]);
    }
    let out = [], pos = 0, clashed = false;
    for (const cluster of clusters) {
      const lo = Math.min(...cluster.map(([h]) => h[0])), hi = Math.max(...cluster.map(([h]) => h[1]));
      const ours = cluster.filter(([, s]) => s === "s").map(([h]) => h);
      const others = cluster.filter(([, s]) => s === "a").map(([h]) => h);
      let rep;
      if (ours.length && others.length) {
        const a = patch(b, lo, hi, others), s = patch(b, lo, hi, ours);
        if (a.join("") !== s.join("")) clashed = true;
        rep = s;
      } else rep = patch(b, lo, hi, ours.length ? ours : others);
      out = out.concat(b.slice(pos, lo), rep);
      pos = hi;
    }
    return [out.concat(b.slice(pos)).join(""), clashed];
  }

  /* ---------------------------------------------------------------- the step */

  /* The version's sections as Filter's starts: [[name, first line]]. */
  function starts(src, lines) {
    const secs = EZ.filter.sections(src, lines);
    return Object.keys(secs).map((k) => [k, secs[k][0]]).sort((x, y) => x[1] - y[1]);
  }

  const valid = (op) => op && typeof op === "object" && KINDS.indexOf(op.kind) >= 0 && op.at &&
    typeof op.at.text === "string" && op.at.text.length && (typeof op.at.file === "string" || op.at.file === null);

  /* The ops of an edit set, placed in these lines: [{op, i, how, now (the line's text today)}]. */
  function locate(src, lines, ops) {
    const list = (ops || []).filter(valid);
    if (!list.length) return [];
    const flt = new Filter(lines, starts(src, lines));
    return place(list, flt).map((p) => Object.assign(p, {now: p.i === null ? null : lines[p.i]}));
  }

  function apply(ctx) {
    const placed = locate(ctx.src, ctx.lines, ctx.edits.ops);
    if (!placed.length) return;
    const before = new Map(), after = new Map(), swap = new Map();
    const lines = ctx.lines;
    ctx.report.ops = [];
    for (const p of placed) {
      const op = p.op;
      ctx.report.ops.push({id: op.id, how: p.how, i: p.i});
      if (p.i === null) { ctx.unplaced("erazure", op.id || op.at.text.slice(0, 60), "Erazure no longer has this rule"); continue; }
      const cur = swap.has(p.i) ? swap.get(p.i) : lines[p.i];
      if (op.kind === "off") {
        if (!OFF_RE.test(cur) && cur.startsWith("ItemDisplay[")) swap.set(p.i, "//" + cur);
      } else if (op.kind === "on") {
        if (OFF_RE.test(cur)) swap.set(p.i, cur.replace(/^\s*\/\/+\s*/, ""));
      } else if (op.kind === "change") {
        if (typeof op.line !== "string") continue;
        const text = op.line.replace(/[\r\n]+/g, " ");
        swap.set(p.i, p.how === "exact" ? text : merge3(op.at.text, text, cur)[0]);
      } else {
        const add = (Array.isArray(op.lines) ? op.lines : []).filter((l) => typeof l === "string")
          .map((l) => l.replace(/[\r\n]+/g, " "));
        const map = op.kind === "before" ? before : after;
        if (!map.has(p.i)) map.set(p.i, []);
        map.get(p.i).push(...add);
      }
    }
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      if (before.has(i)) out.push(...before.get(i));
      out.push(swap.has(i) ? swap.get(i) : lines[i]);
      if (after.has(i)) out.push(...after.get(i));
    }
    ctx.lines = out;
  }

  /* An op's anchor for line i of a version's lines: {file, line, text}. */
  function anchor(src, lines, i) {
    const flt = new Filter(lines, starts(src, lines));
    const [file, line] = flt.place(i);
    return {file, line, text: lines[i]};
  }

  return {Matcher, Filter, place, locate, apply, anchor, merge3, tokens, split, note, showsAlike, starts, valid,
          KINDS, chars};
})();

if (EZ.edits) {
  EZ.edits.step(-100, (ctx) => EZ.ops.apply(ctx));  // first: on the lines as the player browsed them
  EZ.edits.counter("erazure", (e) => (e.ops || []).filter(EZ.ops.valid).length);
}
