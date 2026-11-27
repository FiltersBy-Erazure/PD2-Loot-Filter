/* The Damage Calculator's Fight tab (2026-11-26, the author: "a fight to the kill", each build in a lane of its own,
   all starting together). Loaded by the page the first time the tab opens; the page hands it its numbers through
   ezFight.init(api, box, base). Each lane plays one of the fights the page's kill time is the average of (fight k is
   the k-th run of the kill time's own seeded simulation), so what you watch is what the page counts: every hit's
   damage as it lands, a word for a critical strike, deadly strike, crushing blow or miss, the monster's life going
   down, damage over time a number a second, and the lane stopping at the kill with its time. The character and the
   monster are the game's own sprites (stage.js), the monster flinching as the game's hit recovery check makes it and
   dying at the kill. Served on the website as it is, comments too. */
(function () {
  "use strict";
  const VERSION = 1;          // the page's FIGHT_API version this file knows
  const FPS = 25;             // the game's frames a second
  const SPEEDS = [0.25, 0.5, 1, 2, 4];
  let W = 320, H = 200;       // a lane's stage, in game pixels: the IAS Calculator's (taller for a tall monster)
  let api = null, box = null, base = "", ver = "", loaded = "";
  const S = { k: 0, playing: true, speed: 1, frame: 0, acc: 0, last: 0, lanes: [], sig: "", raf: 0, built: false };
  const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const secs = f => `${nf1.format(f / FPS)} s`;
  const pts = v => Math.max(0, Math.round(v / 256));   // 256ths of a point of life -> points
  const esc = s => (api ? api.esc(s) : String(s));
  const $ = id => document.getElementById(id);
  const G = () => window.ezStage;
  const IX = () => window.EZ_FIGHT;

  function loadScript(src, done, fail) {
    const s = document.createElement("script");
    s.src = src; s.onload = done; s.onerror = fail;
    document.head.appendChild(s);
  }
  /* what a frame's looks need of a lane's fight (the audit of 2026-11-27, CO-04: every look walked the whole fight's
     hits and casts every frame, so a boss fight of 100,000 hits cost 10 ms a frame from its first): the ones within
     LOOK_BACK frames before the lane's clock and LOOK_AHEAD after it (the longest look after its hit, Desecrate's raised
     corpses, lasts 400 frames; the longest before it is a shot's flight or a fall), found by halving (they come in frame
     order; a list that doesn't is used whole), kept for the frame. nearM: a lane's hits (or the list given) by their
     frame; nearKeys: an object's keys that are frames (each cast's bolts, heads...), as numbers; nearArr: a list by key */
  const LOOK_BACK = 450, LOOK_AHEAD = 240;
  const SORTED = new WeakMap(), NEAR = new WeakMap();
  const lowerBound = (a, v, key) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (key(a[m]) < v) lo = m + 1; else hi = m; } return lo; };
  function nearArr(a, key) {
    if (!a || !a.length) return a || [];
    let ok = SORTED.get(a);
    if (ok === undefined || ok.n !== a.length) { ok = { n: a.length, s: a.every((q, j) => !j || key(a[j - 1]) <= key(q)) }; SORTED.set(a, ok); }
    if (!ok.s) return a;
    const f = S.frame, c = NEAR.get(a);
    if (c && c.f === f && c.n === a.length) return c.out;
    const out = a.slice(lowerBound(a, f - LOOK_BACK, key), lowerBound(a, f + LOOK_AHEAD + 1, key));
    NEAR.set(a, { f, n: a.length, out });
    return out;
  }
  const byF = m => m.f;
  const nearM = (x, list) => nearArr(list || x.F.moments || [], byF);
  // (an object's keys read once: its casts are all made when the lane is built)
  const KEYS = new WeakMap();
  function nearKeys(o) {
    if (!o) return [];
    let a = KEYS.get(o);
    if (!a) { a = Object.keys(o).map(Number).sort((p, q) => p - q); KEYS.set(o, a); }
    return nearArr(a, v => v);
  }
  // how many of an object's frame keys are at or before frame f (Hydra's casts, the sentinels thrown, so far)
  function countKeys(o, f) {
    if (!o) return 0;
    nearKeys(o);
    return lowerBound(KEYS.get(o), f + 1, v => v);
  }

  // ================================================================== a lane's setup: the monster, the attacker
  /* the monster the lane fights: the one picked (a boss, or a map's monster, in the map's act), else a stand-in by the
     monster's Size (Fallen, Zombie, a big Act 5 monster) on Act 1's floor. {id, set, table, act, gh, box, name} */
  function monsterOf(l) {
    const I = IX(), m = api.monster && api.monster();
    let id = m ? (String(m.k).startsWith("map:") ? String(m.k).slice(4) : m.k) : null, standin = false;
    const size = Math.max(1, Math.min(3, +l.T.size || 2));
    if (!id || !I.mons[id]) { id = I.standin[size - 1]; standin = true; }
    const row = I.mons[id];
    const act = standin ? 1 : (l.T.map && I.maps[l.T.map]) || row[2] || 1;
    // the ground it stands on: its level's own tiles (the map's level, a boss's fight's: the audit's GA-04, every map had
    // stood on Harrogath's siege ground), else its act's
    const LT = I.lt || {}, fl = standin ? 1 : (l.T.map && (LT.maps || {})[l.T.map]) || (LT.mons || {})[id] || act;
    // (where its overlays sit, whether it has any, how it bleeds: MonStats2 OverlayHeight, noOvly, Bleed, trace T10)
    const lk = row[8] || [];
    return { id, set: row[0], table: colorOf(row, l.T, id), act, fl, gh: row[3], h: row[4], oh: lk[0] === undefined ? row[4] : lk[0],
             nov: !!lk[1], bleed: lk[2] || 0, name: m ? m.n : "your monster", standin, size };
  }
  /* its color table as the game picks it when the monster appears (the client, traced 2026-11-26): its TransLvl's
     (row[1]); a unique's (Kind unique or superunique) one of 30 at random, 9-29 being the game's shared tables 1-21
     (RandTransforms) and 30 or more table 2; then Hell's Utrans over either, for every monster (a boss's too: 255 is no
     shift at all). The random one is rolled per fight, the same in every lane (they fight the same monster). The
     picture: a table of its own (2-7), a shared one ("r" and its number) or none (-1) */
  function colorOf(row, T, id) {
    let idx = row[1];
    if (T && (T.kind === "unique" || T.kind === "superunique")) {
      let h = 0;
      for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) | 0;
      idx = 9 + Math.floor(api.mulberry32(h + S.k * 7919)() * 30);
    }
    if (row[5]) idx = row[5] === 255 ? 0 : row[5];
    if (idx >= 30) idx = 2;
    return idx < 2 ? -1 : idx < 8 ? idx : "r" + (idx - 8);
  }
  // the missile a ranged attack shoots (the IAS Calculator's shotOf): {key, vel, trans, n (Multiple Shot's fan)}
  function shotOf(l, s) {
    const I = IX(), E = l.E;
    if (!(E.attack.missile || E.attack.throw) || !I.ias) return null;
    const sk = I.ias.sk[String(E.attack.id)] || {}, kind = I.ias.k[s.w] || "";
    let name = sk.msl ? G().pickMissile(sk.msl, kind) : "";
    if (!I.ias.mis[name]) name = I.ias.ms[s.w] || "";
    const mis = I.ias.mis[name];
    if (!mis) return null;
    const lvl = Math.max(1, Math.min(60, +l.b.s.lvl || 1));
    return { key: "MS-" + mis.c.replace(/[\\/]/g, "_"), vel: mis.v, trans: mis.t, n: sk.mc ? sk.mc[lvl - 1] || 1 : 1, name, li: lightOf(name) };
  }
  /* where the two stand (the IAS Calculator's spots: in reach for a melee attack, about 5 yards apart for one that
     shoots, throws or casts), the monster a little farther when it is big, both moved down until its top shows */
  const FROM = { "": 2, mid: 7.5, far: 15, end: 21 };   // subtiles apart (a yard is 1.5 subtiles)
  function placeOf(x) {
    const far = x.ranged, M = G().monster(x.mon.set), bx = M ? M.box : [-20, -60, 20, 0];
    const st = x.apart;   // a spell's distance by its Cast from, in subtiles
    /* a big monster a little farther, the farther the more its picture reaches out towards the character (the audit's
       UX-12, the author's call: Duriel's body, reaching 81 pixels the character's way, had hidden the Paladin) */
    const reachOut = Math.min(40, Math.max(0, -bx[0] - 45));
    const d = st ? [st * 8, st * 4] : far ? [61, 30.5] : [29, 14.5], big = bx[2] - bx[0] > 90 ? [10 + reachOut, 5 + reachOut / 2] : [0, 0];
    const cx = (x.W || W) / 2, cy = (x.H || H) / 2 + 34;
    const me = [cx - d[0], cy - d[1]], mon = [cx + d[0] + big[0], cy + d[1] + big[1]];
    const top = mon[1] + bx[1], dy = top < 6 ? 6 - top : 0;
    return { me: [me[0], me[1] + dy], mon: [mon[0], mon[1] + dy], box: bx };
  }

  // ================================================================== a lane's fight
  /* the frames of an attack's hits within one round of it (as the page counts a round: attack 1 and attack 2 where
     they take different times, else one attack), from the IAS Calculator's timeline of the attack; a cast's damage at
     its release; else spread evenly over the round */
  function roundOf(fr) {
    if (fr && fr.r && !fr.r.why) {
      let tl = G().timeline(fr.r, api.IAS.A, 100);
      const parts = fr.r.t.parts;
      if (!fr.alt && fr.r.t.avg && parts.length > 1) tl = tl.slice(0, parts[0].frames);
      return tl;
    }
    return [];
  }
  function hitFrames(fr, tl) {
    if (!fr) return [0];
    const at = [];
    (tl || []).forEach((e, i) => { if (e.hit) at.push(i); });
    if (at.length === fr.hits && at.length) return at;
    if (fr.cast) return [Math.min(fr.frames - 1, Math.max(0, fr.cast.rel || fr.frames - 1))];
    const n = Math.max(1, fr.hits || 1);
    return Array.from({ length: n }, (_, j) => Math.max(0, Math.round(fr.frames * (j + 1) / n) - 1));
  }
  const timesWord = k => (k === 1 ? "once" : k === 2 ? "twice" : `${k} times`);
  const andList = a => (a.length < 3 ? a.join(" and ") : `${a.slice(0, -1).join(", ")}, and ${a[a.length - 1]}`);
  // what damage over time is called in the lane
  const dotWord = el => (el === "fire" ? "burning" : el === "pois" ? "poison" : el === "ltng" ? "lightning" : el === "cold" ? "cold" : el === "mag" ? "magic" : "burning");
  const overOf = parts => (parts || []).reduce((t, r) => t + (r.over || 0), 0);
  // a hit's words: short over the monster, in full in the hit-by-hit list
  const kindOf = ev => (ev.miss ? ["miss"] : []).concat(ev.crit ? ["crit"] : [], ev.ds ? ["deadly"] : [], ev.cb > 0 ? ["crushing"] : []);
  const SHORT = { miss: "Miss", crit: "Crit", deadly: "Deadly", crushing: "Crushing" };
  const LONG = { miss: "missed", crit: "critical strike", deadly: "deadly strike", crushing: "crushing blow" };
  /* a hit's layer for the flinch and its flash: fire, cold, lightning or poison on it (magic is none, trace T4 A.3: the
     audit of 2026-11-27, GA-06 / MO-07, magic had counted and poison hadn't); a weapon's own elements by x.elHit */
  const LAYER = { fire: 1, cold: 1, ltng: 1, pois: 1 };
  const elemental = (ev, x) => ((ev.el || 0) > 0 && (!x || x.elHit)) || (ev.pois || 0) > 0
    || (ev.parts || []).some(r => r.x && LAYER[r.x.el] && (r.d.length || r.over));

  /* one lane's fight k: the k-th run of killTime's stream, each hit placed on its frame (a shot's on the frame it
     arrives: flight). {moments: [{f, dmg, words, ev}], dots: [{f, total, frames, word}], steps, killF, hits, unit,
     avg, life}. live (a spell's lane): its burning ground and poison count as they burn, not when they start (the
     page's kill time counts them in full at the cast), so the casts go on until the monster's life runs out (the
     stream's next casts, as a player casts again) and the kill is that frame. wxs: the lanes of the skills cast between
     cooldowns (the page's rotation: E.wv.use), whose plays come at their frames (ev.t0) with their own hit frames,
     flight and split; their moments go in wm (m.w: whose, 1-3), the main skill's in moments, all of them in all */
  /* a rotation's play counts x its m (Inferno's debuff, Volcano's pace) in its loss: its burning and poison too (the
     audit of 2026-11-27, MO-09: the burn's share of the raise had shown as an instant hit) */
  const scaled = (ev, m) => (m && m !== 1 ? Object.assign({}, ev, { pois: (ev.pois || 0) * m,
    parts: (ev.parts || []).map(r => (r.over > 0 ? Object.assign({}, r, { over: r.over * m }) : r)) }) : ev);
  function fightOf(lane, k, flight, split, live, wxs) {
    const E = lane.E, T = lane.T;
    // (a build that can't make its attack: the page's own reason, the audit's MO-05)
    if (!E || !E.fr) return { none: E && E.why ? E.why : "This setup has no attack speed here, so there is no fight to show." };
    if (E.attack.frames_only) return { none: "This attack's damage isn't worked out on this page." };
    if (!E.kill || E.kill.never) return { none: E.final > 0 ? "This build takes too long to kill the monster to show its fight." : "No damage gets through: this build never kills the monster." };
    const life = Math.max(1, +T.life || 1) * 256;
    // (the kill time's own cap, a rotation's plays a rotation more: the audit's MO-04, a long rotation had left its runs)
    const cap = api.killCap(E, life);
    const fin = E.fof && E.fof.fin, wv = wxs && wxs.length && E.wv && E.wv.k > 0 ? E.wv : null;
    const rnd = api.mulberry32(api.killSeed);
    api.prepFight(E);
    if (fin) api.prepFight(fin.E);
    if (wv) wv.use.forEach(o => api.prepFight(o.E));
    for (let r = 0; r < k; r++) api.fightRun(E, T, rnd, life, false, cap);
    const evs = [];
    const run = api.fightRun(E, T, rnd, life, false, cap, ev => evs.push(ev));
    const fr = E.fr, tl = roundOf(fr), H = hitFrames(fr, tl), finTl = fin ? roundOf(fin.E.fr) : null, HF = fin ? hitFrames(fin.E.fr, finTl) : null;
    const perHit = fr.frames / Math.max(1, fr.hits), fl = flight || 0;
    const lagOf = typeof live === "number" ? live : 0;
    live = !!live && run.L <= 0;
    if (live) {   // enough casts after the run's last to cover its longest burn, or the lane's own lag (Hydra's heads)
      const burn = Math.max(lagOf, evs.reduce((b, ev) => (ev.parts || []).reduce((c, r) => Math.max(c, r.over > 0 ? +r.x.frames || FPS : 0), Math.max(b, ev.pois > 0 ? perHit : 0)), 0));
      const need = evs.length + (burn ? (Math.ceil(burn / Math.max(1, fr.frames)) * H.length + H.length) * (wv ? Math.ceil((wv.i1 - wv.i0) / wv.casts) : 1) : 0);
      // (a charge-up's steps carry their frame: the next runs' go on from the end of the one before; a rotation goes on
      // where it was, its plays' frames its own)
      // (these runs start at full life, so no crushing blow on them: a 1 / 8 of the whole life on a nearly dead monster,
      // the audit's MO-10; they are no page number's)
      let tOff = run.t || 0, played = run.hits;
      for (let g = 0; evs.length < need && g < 200; g++) {
        const r2 = api.fightRun(E, T, rnd, life, true, cap, ev => { if (evs.length < need) { if (E.fof) ev.t0 += tOff; evs.push(ev); } }, wv ? played : 0);
        tOff += r2.t || 0; played += r2.hits;
      }
    }
    let moments = [], dots = [], wm = [];
    const steps = [];
    // a spell never misses (the page's text): Blaze's data rolls to hit (its ignite has ToHit, though it ends on no one),
    // a roll that changes nothing of its damage, so the lane shows no miss for it
    const wordsOf = ev => E.spell ? kindOf(ev).filter(w => w !== "miss") : kindOf(ev);
    // a hit's damage over time (each piece also kept with the hit's number, m.dots, for the hit-by-hit list)
    const pushDots = (f, ev, landed) => {
      const n0 = dots.length;
      if (landed && ev.pois > 0) dots.push({ f: f + 1, total: ev.pois, frames: Math.max(1, Math.round(perHit)), word: "poison" });
      // (whole frames: a part's frames can be an average, Blade Sentinel's poison's; a fraction never ended its drain)
      for (const r of ev.parts || []) if (r.over > 0) dots.push({ f: f + 1, total: r.over, frames: Math.max(1, Math.round(+r.x.frames || FPS)), word: dotWord(r.x.el) });
      return dots.slice(n0);
    };
    const keep = (m, ds) => { if (m && ds.length) m.dots = (m.dots || []).concat(ds); };
    evs.forEach((ev0, i) => {
      const ev = wv ? scaled(ev0, ev0.m) : ev0;
      if (E.fof) steps.push({ t0: ev.t0, fin: !!ev.fin, s: ev.s, miss: !!ev.miss, done: !!ev.done });
      if (wv) steps.push({ t0: ev.t0, w: ev.wv || 0 });
      if (wv && ev.wv) {
        /* another skill's play between cooldowns: its own hit frame, flight and split; a round of several hits (Jab's)
           each on its own hit frame (the audit's MO-09: the round had shown as one number on its first) */
        const wx = wxs[ev.wv - 1], w = ev.wv, hs = ev.hits && ev.hits.length > 1 ? ev.hits.map(h => scaled(h, ev.m)) : [ev];
        hs.forEach((hv, h) => {
          const loss = hs.length > 1 ? hv.loss : ev.loss, f0 = ev.t0 + (wx.H[h] !== undefined ? wx.H[h] : wx.H[wx.H.length - 1]);
          const wd = (wx.l.E.spell ? kindOf(hv).filter(q => q !== "miss") : kindOf(hv)).filter(q => q !== "miss" || !(loss > 0)), w0 = wm.length;
          if (wx.split) wx.split(Object.assign({}, hv, { loss }), f0).forEach((p, j) => wm.push({ f: p.f, dmg: p.dmg, words: j ? [] : wd, ev: j ? null : hv, cev: hv, total: p.dmg, more: j > 0 || h > 0, w }));
          else wm.push({ f: f0 + (wx.flight || 0), dmg: loss - (loss > 0 ? hv.pois || 0 : 0) - overOf(hv.parts), words: wd, ev: hv, total: loss - overOf(hv.parts), w, more: h > 0 });
          keep(wm[w0], pushDots(f0 + (wx.split ? 0 : wx.flight || 0), hv, loss > 0));
        });
        return;
      }
      if (ev.fin) {
        // a finisher's step: each of its hits on its own frame, the charges' releases with the hit they follow
        const hs = ev.hits || [];
        let shown = 0;
        hs.forEach((h, j) => {
          const f = ev.t0 + (HF[j] !== undefined ? HF[j] : HF[HF.length - 1]);
          const rel = (ev.parts || []).filter(r => r.rel === j);
          const own = h.miss ? 0 : (h.cb || 0) + (h.phys || 0) + (h.el || 0);
          const relD = rel.reduce((t, r) => t + r.d.reduce((a, v) => a + v, 0), 0);
          moments.push({ f, dmg: own + relD, words: kindOf(h), ev: h, total: own + relD + (h.miss ? 0 : h.pois || 0) });
          shown += own + relD + (h.miss ? 0 : h.pois || 0) + overOf(h.parts) + overOf(rel);
          const m = moments[moments.length - 1];
          keep(m, pushDots(f, h, !h.miss));
          for (const r of rel) if (r.over > 0) { const d = { f: f + 1, total: r.over, frames: Math.max(1, Math.round(+r.x.frames || FPS)), word: dotWord(r.x.el) }; dots.push(d); keep(m, [d]); }
        });
        // what the step took off that its hits' parts don't show (a hit's rounding): on its last hit; when its hits
        // show more than it took (Dragon Talon's kicks), each shown part scaled down to it
        if (moments.length && hs.length) {
          if (ev.loss >= shown || shown <= 0) moments[moments.length - 1].dmg += ev.loss - shown;
          else { const k = ev.loss / shown; for (let j = moments.length - hs.length; j < moments.length; j++) moments[j].dmg *= k; dots.forEach(d => { if (d.f > moments[moments.length - hs.length].f) d.total *= k; }); }
        }
        return;
      }
      if (split) {   // a spell whose missiles land over time (Frozen Orb's bolts): a number for each
        const f0 = wv ? ev.t0 + H[0] : Math.floor(i / H.length) * fr.frames + H[i % H.length], m0 = moments.length;
        split(ev, f0).forEach((p, j) => moments.push({ f: p.f, dmg: p.dmg, words: j ? [] : wordsOf(ev), ev: j ? null : ev, cev: ev, total: p.dmg, more: j > 0 }));
        keep(moments[m0], pushDots(f0, ev, !ev.miss));
        return;
      }
      const f = (E.fof || wv ? ev.t0 + H[0] : Math.floor(i / H.length) * fr.frames + H[i % H.length]) + fl;
      const landed = !ev.miss;
      const dmg = ev.loss - (landed ? ev.pois || 0 : 0) - overOf(ev.parts);
      moments.push({ f, dmg, words: wordsOf(ev), ev, total: ev.loss - overOf(ev.parts) });
      keep(moments[moments.length - 1], pushDots(f, ev, landed));
    });
    if (split) moments.sort((a, b) => a.f - b.f);
    wm.sort((a, b) => a.f - b.f);
    // every skill's numbers in the order they land (between cooldowns)
    let all = wv ? moments.concat(wm).sort((a, b) => a.f - b.f) : moments;
    // the kill: the frame the numbers so far reach the monster's life (a cast's bolts can kill before its last)
    let last = all.length ? all[all.length - 1].f : 0;
    if ((split || E.fof || wv) && run.L <= 0) {   // (a finisher's step: its first kick can kill, its others come after)
      let took = 0;
      for (const m of all) { took += m.dmg; if (took >= life - 1e-6) { last = m.f; break; } }
    }
    if (live) {   // the frame the life runs out; what comes after it never happens, a burn ends there
      const K = runsOut(all, dots, life);
      if (K >= 0) {
        last = K;
        moments = moments.filter(m => m.f <= K);
        wm = wm.filter(m => m.f <= K);
        all = all.filter(m => m.f <= K);
        dots = dots.filter(d => d.f <= K).map(d => { const n = Math.min(d.frames, K - d.f + 1); return Object.assign({}, d, { total: d.total * n / d.frames, frames: n }); });
      }
    }
    return { moments, wm: wv ? wm : null, all: wv ? all : null, dots, steps, tl, finTl, H, HF, killF: run.L <= 0 ? last : -1, hits: run.hits, life,
             unit: E.spell || E.attack.sentinel ? api.unitOf(E.attack) : "hit", avg: E.kill.secs };
  }

  /* the frame a lane's life runs out on the tab's own clock (step()): each moment's number once the clock reaches its
     frame, each dot drained a frame at a time from its first frame; -1 if it never does */
  function runsOut(moments, dots, life) {
    const delta = new Map(), ms = moments.slice().sort((a, b) => a.f - b.f);
    let end = ms.length ? ms[ms.length - 1].f : 0;
    for (const d of dots) {
      const v = d.total / d.frames;
      delta.set(d.f, (delta.get(d.f) || 0) + v);
      delta.set(d.f + d.frames, (delta.get(d.f + d.frames) || 0) - v);
      end = Math.max(end, d.f + d.frames);
    }
    let took = 0, rate = 0, j = 0;
    for (let F = 1; F <= end + 1; F++) {
      while (j < ms.length && ms[j].f <= F) took += ms[j++].dmg;
      rate += delta.get(F) || 0;
      took += rate;
      if (took >= life * (1 - 1e-9) - 1e-6) return F;
    }
    return -1;
  }

  /* Does a landed hit make the monster flinch (its get-hit mode)? The game's hit recovery check (traced 2026-11-26
     in the live build: the base game's, which PD2 doesn't change): never without a get-hit mode (MonStats2 mGH), when
     frozen, for poison alone or under 1 point of damage; else the hit's class picks a divisor (a one-handed swing
     against small, a thrust, a bow or crossbow 8; a two-handed swing against large 64; against small or a club 32; the
     rest 16, and any hit carrying an element or a critical strike counts as one of the rest), and a hit under its
     share of the monster's life never makes it flinch; under twice that a 1-in-2 and then a 1-in-4 roll can stop it
     (it flinches 3 times in 8), under four times the 1-in-4 alone (3 times in 4), from there always. rnd: the lane's
     own draws (the game rolls them on the monster's own seed) */
  function flinches(x, m, rnd) {
    // (each missile of a cast is a hit of its own: its number and its cast's record, m.cev; the audit's GA-06 / MO-06,
    // only a cast's first missile had been able to make the monster flinch)
    const ev = m.ev || m.cev;
    if (!x.mon.gh || !ev || m.words.includes("miss") || m.total < 256) return false;
    if (m.ev && ev.pois && m.total <= ev.pois) return false;
    const base = x.hc, cls = elemental(ev, x) || ev.crit ? 16 + base : base;
    const div = [2, 6, 10, 11].includes(cls) ? 8 : cls === 5 ? 64 : cls === 4 || cls === 8 ? 32 : 16;
    const max = x.F.life, t = m.total;
    if (t < Math.trunc(max / div)) return false;
    if (t < Math.trunc(max / (div / 2)) && rnd() < 0.5) return false;
    if (t < Math.trunc(max / (div / 4)) && rnd() < 0.25) return false;
    return true;
  }

  /* the hit's own flash on the monster as it flinches or dies (the audit of 2026-11-27, CV-01; trace T4 A.3):
     the client plays it as the monster enters its get-hit or death mode, from the hit's class: of fire, cold and
     lightning on it the first from a start that turns with each such hit (cold, fire, lightning, poison; poison plays
     none), else a critical strike's impact; only for a hit whose class (the weapon's, or the missile's) has a low
     nibble (a spell's missiles mostly don't: Bone Spear's 6 does, and carries no element or crit) */
  /* a struck monster's blood (trace T10, the audit's CV-05): as it flinches from a hit that took life, one time in
     3, a monster of MonStats2 Bleed above 0 sheds one blood (missile 18 + rand(2 x Bleed): blood1-2, bigblood1-2 for
     Bleed 2) on a sub-tile beside it, (dx, dy) of direction d = (its facing + rand(7) - 3) & 7, never straight behind
     it (it faces the attacker: up-left, the game's direction 2); the 9 frames of the drop falling to its splat, one a
     game frame. Not traced: whether the drop moves, and whether the splat stays after its last frame (not drawn) */
  const BLOODS = ["blood1", "blood2", "bigblood1", "bigblood2"], BLOOD_DX = [0, -1, -2, -1, 0, 1, 2, 1], BLOOD_DY = [2, 1, 0, -1, -2, -1, 0, 1];
  function bleed(x, m) {
    if (!(x.mon.bleed > 0)) return;
    const h = n => ((m.f * 2654435761 + x.i * 40503 + S.k * 9176 + n * 69069) >>> 0) % 1000003;
    if (h(1) % 3) return;
    const o = IX().mis[BLOODS[h(2) % Math.min(4, 2 * x.mon.bleed)]], d = (2 + (h(3) % 7) - 3) & 7;
    if (o) (x.bloods = (x.bloods || []).filter(q => S.frame - q.t0 < 20)).push({ o, t0: S.frame, d });
  }
  function bloodFx(x, ctx, mx, my) {
    (x.bloods || []).forEach(q => {
      const u = S.frame - q.t0;
      if (u < 0 || u >= Math.max(1, q.o.n || 9)) return;
      const [sx, sy] = G().toScreen(BLOOD_DX[q.d], BLOOD_DY[q.d]);
      G().drawShot(ctx, q.o, u, mx + sx, my + sy, 0, q.o.t, [mx + sx, my + sy]);
    });
  }
  const FLASH = { cold: "ice_explode", fire: "fire_hit", ltng: "lightning" }, FLASH_ORDER = ["cold", "fire", "ltng", "pois"];
  function flash(x, m) {
    const ev = m.ev || m.cev;
    if (!ev || ev.miss || !(x.hc & 15)) return;
    const has = k => (k === "pois" ? (ev.pois || 0) > 0 : (ev.el || 0) > 0 && x.elHas[k])
      || (ev.parts || []).some(r => r.x && r.x.el === k && (r.d.length || r.over));
    let key = null;
    if (FLASH_ORDER.some(has)) {
      const s = (x.flashTurn = ((x.flashTurn || 0) + 1) % 4);
      for (let j = 0; j < 4 && !key; j++) { const k = FLASH_ORDER[(s + j) % 4]; if (has(k)) key = FLASH[k] || ""; }
    } else if (ev.crit) key = "doubledamage" + (1 + (m.f * 7 + x.i) % 3);   // (1ofN 3: one of the three; not the flinches' draws)
    if (key && IX().ov && IX().ov[key]) x.flash = { o: IX().ov[key], t0: S.frame };
  }

  // ================================================================== the tab
  const CSS = `
  /* the controls stay under the site's header while the lanes scroll by (a phone shows one lane at a time), as the
     site's other bars do: under the header's z-index (4), and in place in a window 560 px tall or less (200% zoom) */
  .dmg-map .fx-bar { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; margin: 4px 0 14px;
                     position: sticky; top: 0; z-index: 3; background: var(--panel); padding-block: 6px; }
  .md-content .dmg-map .fx-bar { top: 2.4rem; }
  @media (max-height: 560px) { .dmg-map .fx-bar { position: static; } }
  .dmg-map .fx-bar .fx-what { color: var(--fg2); font-size: 13px; }
  .dmg-map .fx-bar select { width: auto; min-width: 72px; }
  .dmg-map .fx-bar .fx-spd { display: inline-flex; gap: 6px; align-items: center; }
  .dmg-map .fx-lanes { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
  /* the lanes share their rows (a lane's name, attack, scene, life, status and list), so each line sits at the same
     height across a row of lanes even when one lane's text wraps */
  @supports (grid-template-rows: subgrid) {
    .dmg-map .fx-lane { grid-row: span 6; grid-template-rows: subgrid; row-gap: 8px; }
  }
  .dmg-map .fx-lane { border: 1px solid var(--line); border-top: 3px solid var(--key); border-radius: 6px; background: var(--panel2);
                      padding: 10px 12px 12px; min-width: 0; display: grid; gap: 8px; align-content: start; }
  .dmg-map .fx-head { display: flex; gap: 8px; align-items: center; min-width: 0; font-weight: 600; }
  .dmg-map .fx-head .kb { flex: none; display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 3px;
                          border: 2px solid var(--key); background: color-mix(in srgb, var(--key) 30%, transparent);
                          font-size: 12px; font-weight: 700; line-height: 1; color: var(--fg); }
  .dmg-map .fx-head .fx-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dmg-map .fx-sub { color: var(--fg2); font-size: 13px; }
  .dmg-map .fx-scene { position: relative; border-radius: 4px; background: #000; overflow: hidden; line-height: 0; }
  .dmg-map .fx-scene canvas { width: 100%; height: auto; display: block; image-rendering: pixelated; }
  /* a number rises and fades over a second of the fight (at 4x a quarter of a second, at least 0.35 s: the audit of
     2026-11-27, UX-01, numbers had piled up at speed), its length set on it (--dur) */
  .dmg-map .fx-pop { position: absolute; transform: translate(-50%, 0); white-space: nowrap; pointer-events: none; line-height: 1.2;
                     font-weight: 700; font-size: 15px; color: #fff; text-shadow: 0 1px 2px #000, 0 0 3px #000;
                     animation: fx-rise var(--dur, 1s) linear forwards; }
  .dmg-map .fx-pop small { font-size: 12px; font-weight: 700; margin-left: 4px; color: #e8c66e; }
  .dmg-map .fx-pop.dot { font-size: 13px; color: #ddd; }
  .dmg-map .fx-pop.miss { color: #bbb; }
  @keyframes fx-rise { from { opacity: 1; transform: translate(-50%, 0); } 60% { opacity: 1; } to { opacity: 0; transform: translate(-50%, -100px); } }
  @media (prefers-reduced-motion: reduce) { .dmg-map .fx-pop { animation: fx-fade var(--dur, 1s) linear forwards; } }
  @keyframes fx-fade { from { opacity: 1; } to { opacity: 0; } }
  .dmg-map .fx-life { display: grid; gap: 4px; }
  .dmg-map .fx-meter { height: 10px; border-radius: 3px; background: var(--grid); overflow: hidden; }
  /* (a lighter red on the dark page: 3.5 : 1 against its track, the darker one 2.2 : 1; the audit's AC-05) */
  .dmg-map .fx-meter span { display: block; height: 100%; width: 100%; background: #e0483e; }
  [data-md-color-scheme="default"] .dmg-map .fx-meter span { background: #b3261e; }
  .dmg-map .fx-lt { font-size: 13px; color: var(--fg2); font-variant-numeric: tabular-nums; }
  .dmg-map .fx-status { margin: 0; font-size: 14px; font-variant-numeric: tabular-nums; }
  .dmg-map .fx-status b { color: var(--fg); }
  .dmg-map .fx-status .fx-avg { display: block; margin-top: 2px; font-size: 13px; color: var(--fg2); }
  .dmg-map .fx-none { margin: 0; color: var(--fg2); font-size: 13px; }
  .dmg-map .fx-log summary { cursor: pointer; font-size: 13px; color: var(--fg2); }
  .dmg-map .fx-log ol { margin: 6px 0 0; padding-left: 0; list-style: none; max-height: 260px; overflow: auto; font-size: 13px;
                        font-variant-numeric: tabular-nums; }
  .dmg-map .fx-log li { display: flex; gap: 8px; justify-content: space-between; border-top: 1px solid var(--grid); padding: 2px 0; }
  .dmg-map .fx-log li span:first-child { color: var(--muted); }
  .dmg-map .fx-log ol:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .dmg-map .fx-lanes + .note { margin-top: 14px; }
  .dmg-map .fx-lead { margin: 0 0 8px; }
  `;

  function controls() {
    return `<div class="fx-bar" role="group" aria-label="The fight">
      <button type="button" id="fx-play">${S.playing ? "Pause" : "Play"}</button>
      <button type="button" id="fx-step" title="One game frame (1/25 s)">Next frame</button>
      <span class="fx-spd"><label class="fx-what" for="fx-speed">Speed</label>
      <select id="fx-speed">${SPEEDS.map(v => `<option value="${v}"${v === S.speed ? " selected" : ""}>${v === 0.25 ? "¼" : v === 0.5 ? "½" : v}×</option>`).join("")}</select></span>
      <button type="button" id="fx-again">Fight again</button>
      <button type="button" id="fx-skip" title="Play every lane to its kill at once">Skip to the kill</button>
      <span class="fx-what" id="fx-which"></span>
      <span class="fx-what fx-warn" id="fx-warn" hidden>Some of the fight&rsquo;s pictures couldn&rsquo;t load, so parts of it may be missing. Fight again tries them again.</span>
      <span class="sr-only" id="fx-live" aria-live="polite"></span>
    </div>`;
  }

  // the lanes' state from the page's results: rebuilt when a lane's numbers change, else left playing
  function signature(lanes) {
    return JSON.stringify(lanes.map(l => [l.name, l.E && l.E.final, l.E && l.E.toHit, l.E && l.E.fr && l.E.fr.frames, l.E && l.E.kill && l.E.kill.secs,
      l.T && l.T.life, l.T && l.T.preset, l.T && l.T.map, l.T && l.T.size, l.E && l.E.attack && l.E.attack.k, l.b && l.b.w && l.b.w.code, l.b && l.b.o && l.b.o.code,
      // (and what only changes its looks: an aura, a curse, Inner Sight or Conviction on the monster, its kind; found by
      // the coverage gate, 2026-11-26: a curse that changed no number left the lane without its look)
      // (the others' Battle Cry and the party's curse limit too: the audit's CO-05, they changed no number of a spell's)
      l.b, l.T && [l.T.kind, l.T.champ, l.T.conv, l.T.inner, l.T.others, l.T.bc, l.T.partyMax]]));
  }
  /* opt (between cooldowns): the lane of another skill of the rotation, drawn on its lane's stage (opt.place, the attacker's distance
     opt.apart): its looks and how its missiles land, no fight of its own (its casts come in its lane's fight) */
  function laneOf(l, i, opt) {
    const I = IX(), E = l.E;
    const x = { l, i, at: 0, dmg: 0, dot: 0, acc: {}, done: false, R: E && E.fr ? E.fr.r || null : null, mon: monsterOf(l), monMode: { m: "NU", t0: 0 } };
    const s = E && E.attack ? api.iasSetup(l.b, E.attack) : null;
    x.look = s ? { g: I.ias.g[s.w] || "", g2: s.oh === "weapon" ? I.ias.g[s.w2] || "" : "", shield: s.oh === "shield" } : { g: "", shield: false };
    if (s) { x.look.tint = tintOf(l.b, s.w); if (x.look.g2) x.look.tint2 = tintOf(l.b, s.w2); }
    x.hc = s && I.hc[s.w] !== undefined ? I.hc[s.w] : 1;   // the weapon's hit class (hand to hand without one)
    // (the elements a weapon's hit carries: a layer for the flinch, and the flash it plays)
    x.elHas = {};
    (E && E.per || []).forEach(p => ["fire", "cold", "ltng"].forEach(k => { if (p.el && p.el[k]) x.elHas[k] = true; }));
    x.elHit = Object.keys(x.elHas).length > 0;
    x.shot = s ? shotOf(l, s) : null;
    x.ranged = !!x.shot || !!(E && (E.spell || E.attack.missile || E.attack.throw));
    // Split Throw's weapons, 3 + min(level / 5, 4); Lightning Fury's bolt from the monster it struck (traces T4, T12)
    if (x.shot && E.attack.k === "splitthrow") x.split3 = { n: 3 + Math.min(Math.floor(Math.max(1, +l.b.s.lvl || 1) / 5), 4) };
    if (x.shot && E.attack.k === "lightningfury" && (I.mis || {}).furylightning) x.fury = I.mis.furylightning;
    // a spell's caster stands as far as its Cast from says (Frozen Orb's 14 yards: its flight ends on the monster),
    // the lane's stage wide enough for it
    const spo = E && E.spell ? (I.spells || {})[String(E.attack.id)] : null;
    if (spo && spo.disc) x.apart = FROM[""];   // Blaze: cast next to the monster (the page's)
    if (spo && (spo.orb || spo.walk || spo.fan || spo.comb)) {
      // by the build's Cast from where the page counts by it, else 5 yards (Teeth, Bone Spear)
      const usesFrom = ((E.ex && E.ex.always) || []).some(q => q.from !== undefined);
      x.apart = usesFrom ? FROM[l.b.s.from || ""] || FROM.mid : FROM.mid;
      x.W = Math.max(W, Math.round(x.apart * 16 + 200)); x.H = Math.max(H, Math.round(x.apart * 8 + 160));
    }
    /* the Assassin's (2026-11-26): her traps stand between her and the monster, as far from it as the page's Trap laid
       says (Charged Bolt Sentry, Wake of Fire), else 5 yards; she stands a little behind them. Blade Sentinel's
       sentinel runs from beside her to past the monster (its Cast from); Blade Fury's blades fly as her shots */
    const spx = E && E.attack ? (I.spells || {})[String(E.attack.id)] || null : null;
    const exPart = k => ((E && E.ex && E.ex.always) || []).find(q => q.k === k);
    if (spx && spx.trap) {
      const q = exPart("shot"), from = q && (E.attack.k === "chargedboltsentry" || E.attack.k === "wakeoffire") ? q.from : "mid";
      x.trapD = FROM[from || ""] || FROM.mid;
      x.apart = Math.max(FROM.mid, x.trapD + 4);
    }
    if (spx && spx.sentinel) { const q = exPart("blade"); x.apart = FROM[q && q.from || ""] || FROM[""]; }
    if (spx && (spx.trap || spx.sentinel)) { x.W = Math.max(W, Math.round(x.apart * 16 + 200)); x.H = Math.max(H, Math.round(x.apart * 8 + 160)); }
    if (spx && spx.atk) x.atk = spx.atk;   // an attack skill's looks: its strike, the target's overlay and states
    if (spx && spx.charge && E && E.fof) x.chg = spx.charge;   // a charge-up skill's charges and releases
    if (x.chg && E.fof.fin) {   // its finisher's own look (Dragon Tail's explosion, Dragon Flight's overlay)
      const fs = (I.spells || {})[{ dc: "260", dt: "270", df: "275", dl: "255" }[E.fof.fin.kind || "dc"]];
      x.finAtk = fs && fs.atk ? fs.atk : null;
    }
    // Blade Fury throws its blades whatever the weapon (a throwing knife's own missile isn't thrown: found by the coverage
    // gate, 2026-11-27, the Blade Fury preset's Warshrike drew knives)
    if (spx && spx.fury) {
      const m = (I.mis || {})[spx.fury.blade];
      if (m) x.shot = { key: m.c, vel: m.v, trans: m.t, n: 1, z: spx.fury.z || 0, li: m.li, hc: m.hc || 0 };
    }
    x.place = placeOf(x);
    if (opt && opt.place) { x.place = opt.place; x.apart = opt.apart; }   // (the other skill: where its lane's attacker stands)
    const reach = Math.hypot(x.place.mon[0] - x.place.me[0], x.place.mon[1] - x.place.me[1]) - 14;
    /* the moves (2026-11-26): Charge runs in from 10 yards at its own speed (the run speed with +150%, FRW not counted:
       22.5 points, a sixteenth of a sub-tile each a frame: the Run Speed page's rule), its first strike when it connects
       (the page counts the strikes back to back after it: the run before each isn't counted); Whirlwind and Blade Dance
       whirl back and forth through the monster at walking speed with the skill's velocity % (traced 2026-11-16), their
       hits on the game's timer as the page counts them */
    if (E && E.attack && E.attack.kind === "charge") {
      const [wx, wy] = G().toWorld(x.place.mon[0] - x.place.me[0], x.place.mon[1] - x.place.me[1]), d = Math.hypot(wx, wy) || 1;
      const v = 22.5 / 16, n = Math.max(1, Math.ceil((FROM.far - d) / v));
      x.runIn = { n, from: [x.place.mon[0] - (x.place.mon[0] - x.place.me[0]) * FROM.far / d, x.place.mon[1] - (x.place.mon[1] - x.place.me[1]) * FROM.far / d] };
      x.W = Math.max(x.W || W, Math.round(FROM.far * 16 + 200));
      x.place = placeOf(x);
      x.runIn.from = [x.place.mon[0] - (x.place.mon[0] - x.place.me[0]) * FROM.far / d, x.place.mon[1] - (x.place.mon[1] - x.place.me[1]) * FROM.far / d];
    }
    if (E && E.attack && E.attack.kind === "ww") {
      const lvl = Math.max(1, +l.b.s.lvl || 1), sk = api.SK[E.attack.id] || {};
      const vel = sk.aurastat1 === "velocitypercent" ? +api.Calc.value(E.attack.id, "aurastatcalc1", lvl) || 0 : 0, frw = +l.b.g.frw || 0;
      x.ww = { v: 6 * Math.max(25, 100 + frw + vel) / 100 / 16, span: 2.5 };
    }
    x.reach = reach;
    // the character's own animations: standing (NU: between casts, and once its monster is dead) and casting (SC),
    // with the weapon class it holds (a werewolf or werebear its own); the class's or form's token
    const cls = (api.IAS.CLS || {})[l.b.cls], form = E && E.attack ? E.attack.form : "";
    const tok = form === "40" || form === "TG" ? form : cls ? cls.tok || "" : "";
    const wc = form === "40" || form === "TG" ? "HTH" : String((api.IAS.BASE[s && s.w] || {}).wc || "hth").toUpperCase();
    x.tok = tok; x.wc = wc;
    x.nu = I.nu && I.nu[tok + "NU" + wc] ? tok + "NU" + wc : "";
    x.cast = E && E.fr && E.fr.cast ? castOf(x, l) : null;
    // a missile's hit takes its own hit class (Missiles.txt HitClass, trace M1), not the weapon's: an arrow's 10, a
    // javelin's 6, a thrown axe's 2, a spell's (the audit of 2026-11-27, GA-06 / MO-07: the weapon's had counted)
    if (x.shot) x.hc = x.shot.hc !== undefined ? x.shot.hc : (I.mhc || {})[x.shot.name] || 0;
    else if (E && E.spell) x.hc = x.cast && x.cast.mis ? x.cast.mis.hc || 0 : 0;
    const v = x.shot ? x.shot.vel : x.cast && x.cast.mis ? x.cast.mis.v : 0;
    x.flight = v ? Math.max(1, Math.ceil(reach / G().SUBTILE / (v * G().MIS_PACE))) : 0;
    if (x.split3) { const need = reach / G().SUBTILE; for (let t = 1; t <= 29; t++) if (splitOut(t) >= need) { x.flight = t; break; } }
    // (a nova's ring slows as it spreads: it reaches the monster the frame its slowed travel does)
    if (x.cast && x.cast.ring && x.cast.mis && x.cast.mis.a && v) {
      const need = reach / G().SUBTILE, pace = v * G().MIS_PACE, a = x.cast.mis.a / 4096;
      for (let t = 1; t <= Math.max(1, x.cast.mis.r); t++) if (travel(pace, a, t) >= need) { x.flight = t; break; }
    }
    if (x.cast && x.cast.meteor) x.flight = x.cast.meteor.fall;   // the meteor lands its fall's frames after the release
    if (x.cast && (x.cast.wall || x.cast.disc)) x.flight = 0;     // the ground burns from the release
    if (x.cast && x.cast.storm) x.flight = 0;                     // a strike's damage comes as its bolt appears
    if (x.cast && (x.cast.corpse || x.cast.curse)) x.flight = 0;  // a corpse bursts, a curse lands, at the release
    if (x.cast && x.cast.orbit) x.flight = 0;                     // Hurricane's gusts: at once
    if (x.cast && x.cast.fall) x.flight = x.cast.fall.frames;     // Armageddon's rock lands its fall's frames on
    if (x.runIn) x.flight = x.runIn.n;                            // Charge: its strikes after the run in
    if (x.cast && (x.cast.shield || x.cast.mind || x.cast.trap)) x.flight = 0;   // a strike's, a blast's: at once; a trap's: its own
    // the traps: her throw at each laying (the IAS Calculator's S2 at her attack speed), each trap's shots on its frames
    if (x.cast && x.cast.trap) {
      const R = api.IAS.evaluate(api.iasSetup(l.b, E.attack));
      if (R && !R.why) { x.R = R; x.layTl = roundOf({ r: R }); x.layEvt = Math.max(0, x.layTl.findIndex(e => e.hit)); }
      x.trapL = true; x.traps = []; x.trapK = 0;
    }
    // Blade Sentinel's sentinels, Fire Blast's and Shock Web's bombs: each throw's, by its release frame
    if (spx && spx.sentinel && E.fr && E.fr.r) x.sent = {};
    if (spo && spo.bombs) {
      x.bomb = {};
      const D = Math.max(1, Math.round(x.apart || G().toWorld(x.place.mon[0] - x.place.me[0], x.place.mon[1] - x.place.me[1])[0]));
      const air = I.mis[spo.bombs.air] || { v: 16 };
      x.arc = v => Math.max(1, Math.floor(v * 64 / (3 * Math.max(1, air.v))));   // (the arc's frames to a spot v sub-tiles off)
      if (!spo.bombs.boom) x.flight = x.arc(D);   // Shock Web: its fields lie from the throw's landing
      else x.flight = 0;
    }
    if (x.cast && x.cast.trail && x.cast.mis) x.trail = trailOf(x);
    if (spo && spo.orb) x.orb = orbOf(x, spo.orb);
    if (x.cast && x.cast.rain) x.rain = {};   // each cast's shards, by its release frame
    if (spo && spo.walk) x.walk = {};          // each cast's charged bolts, by its release frame
    if (spo && spo.fan) x.fan = {};            // each cast's lances, by its release frame
    if (spo && spo.comb) x.comb = {};          // each cast's ring of fire balls, by its release frame
    if (spo && spo.hydra) x.hyd = {};          // each cast's heads, by its release frame
    if (spo && spo.delay && spo.delay.bolt) x.delayS = {};   // Fist of the Heavens: each cast's strike and bolt
    if (spo && spo.curse && E.fr.cast && E.fr.cast.cycle > 1) x.cyc = {};   // Dark Pact: its curses cast again first
    if (spo && (spo.boulder || spo.volcano || spo.cracks)) x.ground2 = {};  // a boulder's roll, a volcano, a fissure: by cast
    const split = x.orb ? (ev, f) => orbSplit(x, ev, f) : x.rain ? (ev, f) => rainSplit(x, ev, f)
      : x.walk ? (ev, f) => walkSplit(x, ev, f) : x.fan ? (ev, f) => fanSplit(x, ev, f)
      : x.comb ? (ev, f) => combSplit(x, ev, f) : x.hyd ? (ev, f) => hydraSplit(x, ev, f)
      : x.delayS ? (ev, f) => delaySplit(x, ev, f) : x.cyc ? (ev, f) => cycleSplit(x, ev, f)
      : x.ground2 ? (ev, f) => (x.cast.boulder ? boulderSplit : x.cast.volcano ? volcanoSplit : fissureSplit)(x, ev, f)
      : x.trapL ? (ev, f) => trapSplit(x, ev, f) : x.sent ? (ev, f) => sentSplit(x, ev, f)
      : x.bomb && spo.bombs.boom ? (ev, f) => bombSplit(x, ev, f) : x.split3 ? (ev, f) => splitThrowSplit(x, ev, f) : null;
    // a spell's lane kills when its life runs out; a cast whose missiles land over time (a Frozen Orb's bolts, Hydra's
    // heads for 5 seconds) has the next casts go on for up to 170 frames after the run's last
    // (a trap's damage comes over its life, a sentinel's over its 50 frames: the next ones go on that long)
    const lag = x.trapL ? (E.fr.cast.dsentry ? 170 : trapPlan(x).evt + Math.min(400, trapPlan(x).life)) : x.sent ? 70 : 0;
    if (opt && opt.companion) {   // a skill between cooldowns: what its lane's fight needs of it
      x.split = split; x.tl = roundOf(E.fr); x.H = hitFrames(E.fr, x.tl);
      return x;
    }
    /* between cooldowns (the page's rotation, 2026-11-26): each other skill's lane on this one's stage, where this one's
       attacker stands (a spell's distance as this one's) */
    if (E && E.wv && E.wv.k > 0 && E.wv.use && E.wv.use.every(o => o.E && o.E.fr)) {
      x.ws = E.wv.use.map(o => laneOf(Object.assign({}, l, { E: o.E, b: o.bW }), i, { companion: true, place: x.place, apart: x.apart || Math.max(FROM[""], (x.place.mon[0] - x.place.me[0]) / 16) }));
    }
    x.F = fightOf(l, S.k, x.flight, split, lag || (E && E.spell ? (split ? 170 : true) : false), x.ws);
    /* an attack whose damage goes on after its hit (Immolation Arrow's fire, Poison Strike's poison, a weapon's poison)
       kills when the life runs out too (it attacks on until then), not on the killing blow's frame (until 2026-11-26 its
       poison drained after the kill, within a hit's frames) */
    if (!split && !lag && !(E && E.spell) && x.F.dots && x.F.dots.length && x.F.killF >= 0) x.F = fightOf(l, S.k, x.flight, null, true, x.ws);
    if (x.ws) {
      // each skill's plays at their frames, and each other skill's numbers for its own drawing
      x.starts = x.F.steps.filter(q => !q.w).map(q => q.t0);
      x.ws.forEach((y, j) => {
        y.starts = x.F.steps.filter(q => q.w === j + 1).map(q => q.t0);
        y.F = { moments: (x.F.wm || []).filter(m => m.w === j + 1), dots: [], steps: [], tl: y.tl, H: y.H, killF: x.F.killF, life: x.F.life };
      });
    }
    x.rnd = api.mulberry32(9973 + 131 * S.k + 7 * i);   // the flinches' own draws
    x.f = 0;   // the lane's own clock: its frames played (the audit's UX-03: a lane plays while it shows)
    x.looks = looksOf(x, l);
    return x;
  }
  /* a spell's cast as the game plays it (the page's castFrames, the Breakpoints page's rule): the class's or form's
     casting animation at trunc(its speed x min(175, 100 + effective FCR) / 100) 256ths of a frame a game frame for the
     cast's own frames (Chain Lightning's and Frozen Orb's sequence at speed 256 through its steps), standing out a
     cooldown; its cast overlay (Skills.txt castoverlay: Overlay.txt's frames at its AnimRate, 16ths of a frame a game
     frame) from the cast's start; the drawn spells' client missile leaving at the release and what it becomes where it
     hits (its ExplosionMissile and hit sub-missiles) */
  function castOf(x, l) {
    const I = IX(), E = l.E, fr = E.fr, C = api.DATA.cast || {};
    const key = E.attack.form === "40" ? "wolf" : E.attack.form === "TG" ? "bear" : l.b.cls, A = (C.cls || {})[key] || [16, 256, 8];
    const seq = (C.seq || {})[E.attack.id], sp = (I.spells || {})[String(E.attack.id)] || {};
    /* a channel (Inferno: held, its sequence a step a game frame whatever the cast rate, the breath's 4 frames a loop of
       its first steps); a storm (Thunder Storm: cast once, its own cast rate, then it strikes on its own) */
    const chan = fr.cast.tick === "channel", once = fr.cast.tick === "period" || fr.cast.tick === "aura";
    const rate = chan ? 256 : Math.max(1, Math.trunc((seq ? 256 : A[1]) * Math.min(C.cap || 175, 100 + (fr.cast.eff || 0)) / 100));
    const sq = (I.castseq || {})[sp.seq || "12"] || {}, steps = seq || chan ? sq[x.wc.toLowerCase()] || sq.hth || null : null;
    const own = once ? Math.max(1, Math.ceil(256 * A[0] / rate) - 1) : Math.max(1, fr.cast.own || fr.frames);
    const rel = once ? Math.max(1, Math.ceil(256 * A[2] / rate)) : fr.cast.rel || fr.frames;
    return { rate, steps, own, rel, chan, once, ring: sp.ring || 0,
             rain: sp.rain || null, meteor: sp.meteor || null, trail: sp.trail || null, wall: sp.wall || null, disc: sp.disc || null,
             stream: sp.stream || null, storm: sp.storm || null, comb: sp.comb || null, hydra: sp.hydra || null,
             delay: sp.delay || null, tov: sp.delay && sp.delay.tov && I.ov ? I.ov[sp.delay.tov] || null : null,
             startm: sp.startm && I.mis ? I.mis[sp.startm] || null : null, corpse: sp.corpse || null, curse: sp.curse || null,
             cycle: fr.cast.dsentry ? 1 : Math.max(1, fr.cast.cycle || 1), orbit: sp.orbit || null, fall: sp.fall || null, boulder: sp.boulder || null,
             volcano: sp.volcano || null, cracks: sp.cracks || null, burst: sp.burst || null, lock: !!sp.lock,
             trap: sp.trap || null, mind: sp.mind || null, shield: sp.shield || null,
             hov: sp.hov && I.ov ? I.ov[sp.hov] || null : null,
             ov: sp.ov && I.ov ? I.ov[sp.ov] || null : null, mis: sp.m && I.mis && I.mis[sp.m] ? Object.assign({ name: sp.m }, I.mis[sp.m]) : null };
  }
  /* what the lane shows besides the fight's own drawing (the author, 2026-11-26: "proceed with the buffs, auras and
     curses"): on the character the states of its auras and buffs (its own or a party member's: the game puts the same
     state on both), on the monster its curses as the page counts them (the ones that hold), Battle Cry and Conviction,
     and its colors: chilled (blue) in Holy Freeze and for the cold's length after a hit with cold damage (a spell's
     ELen; an item's cold taken as 2 seconds), poisoned (green) while its poison runs */
  /* a weapon in a buff's color: Enchant red, Cold Enchant blue, Venom green (on the weapons its state names: Venom's
     the melee ones). The game draws the item's layer through that color's table of the item palette its Transform
     names (index icol); a page opened as a file can't read the picture's colors and washes the layer instead */
  const ITEM_BUFFS = [["venomclaws", b => b.cls === "ass" && +b.buf.venom > 0], ["coldenchant", b => +b.buf.cench > 0], ["enchant", b => +b.buf.ench > 0]];
  const WASH = { 6: "rgba(90, 150, 255, .5)", 9: "rgba(255, 70, 40, .5)", 12: "rgba(70, 220, 70, .5)" };
  function tintOf(b, code) {
    const C = IX().icol, g = C && C.w[code];
    if (!g) return null;
    for (const [st, on] of ITEM_BUFFS) {
      const s = C.s[st];
      if (!s || !on(b) || (s[1] && !s[1].includes(code))) continue;
      const k = `${g}-${s[0]}`;
      if (C.t[k]) return { k, t: C.t[k], wash: WASH[s[0]] || "rgba(255, 255, 255, .3)" };
    }
    return null;
  }
  const HOLY_STATE = { fire: "holyfire", freeze: "holywind", shock: "holyshock", sanc: "sanctuary" };
  // (the page's Holy auras on a build: a Paladin's own and the items', each at the higher level; an older page: his own)
  const holiesOf = b => (api.holyAuras ? api.holyAuras(b)
    : b.cls === "pal" && +b.buf.holyLvl > 0 && HOLY_STATE[b.buf.holy] ? [{ k: b.buf.holy, lvl: +b.buf.holyLvl }] : []);
  const CURSE_STATE = { amp: "amplifydamage", decrep: "decrepify", lowres: "lowerresist", weaken: "weaken", attract: "attract" };
  const CURSE_ID = { amp: 66, decrep: 87, lowres: 91, weaken: 72, attract: 86 };   // (their skills: the curses' own looks)
  const ID_STATE = Object.fromEntries(Object.keys(CURSE_ID).map(k => [CURSE_ID[k], CURSE_STATE[k]]));
  /* the aura states take turns (trace T10, the author's question of 2026-11-27): of a unit's states with
     States.txt's aura flag (Paladin auras, Conviction, Holy Freeze's chill, Sanctuary, Battle Command, Burst of Speed,
     the spirits...), one at a time shows its overlays, 51 frames each, by its state id, the next higher after it (from
     the lowest: the game's first is the one that came on first); the other states (curses, Battle Cry, Frenzy...) all
     show. Hidden ones keep animating */
  const AURA_TURN = 51;
  function auraTurn(states, f) {
    const A = IX().auras || {}, on = states.filter(st => A[st] !== undefined).sort((p, q) => A[p] - A[q]);
    if (on.length < 2) return states;
    const show = on[Math.floor(Math.max(0, f) / AURA_TURN) % on.length];
    return states.filter(st => A[st] === undefined || st === show);
  }
  function looksOf(x, l) {
    const b = l.b, E = l.E, me = [], mon = [];
    if (+b.aur.might > 0) me.push("might");
    if (+b.aur.conc > 0) me.push("concentration");
    if (+b.aur.ba > 0) me.push("blessedaim");
    if (+b.buf.fana > 0) me.push("fanaticism");
    // the Holy auras, a Paladin's own and the items' (any class: the page's holyAuras, 2026-11-27, trace T14)
    const holyOn = holiesOf(b);
    holyOn.forEach(A => { if (HOLY_STATE[A.k]) me.push(HOLY_STATE[A.k]); });
    if (+b.aur.bc > 0) me.push("battlecommand");
    if (b.cls === "bar" && +b.buf.frenzy > 0) me.push("frenzy");
    if (b.cls === "ass" && +b.buf.bos > 0) me.push(b.buf.bosOff ? "fade" : "quickness");
    if (+b.aur.wolv > 0) me.push("wolverine");   // Heart of Wolverine's spirit's state on its party
    if (+b.aur.grim > 0) me.push("grimward");   // Grim Ward's totem's state on the units near it (its look at their feet)
    // Maul's charges held by a werebear attacking with something else (Maul's own lane shows them as it charges)
    if (E && E.attack && E.attack.form === "TG" && +b.buf.maul > 0) me.push("maul");
    const on = api.onMonster ? api.onMonster(b, l.T) : null;
    if (on) {
      on.curses.forEach(c => { if (CURSE_STATE[c.kind]) mon.push(CURSE_STATE[c.kind]); });
      if (on.bc) mon.push("battlecry");
    }
    if (+l.T.conv > 0) mon.push("conviction");
    if (holyOn.some(A => A.k === "sanc")) mon.push("sanctuary");   // (PD2 puts it on the monsters in range: trace T4)
    if (+l.T.inner > 0) mon.push("innersight");   // an Amazon's Inner Sight on it
    // (in Holy Freeze it is chilled all along; a hit's chill and freeze: coldLog)
    const holdCold = holyOn.some(A => A.k === "freeze");
    // states that come and go: Thunder Storm's on the caster from its cast's release; Inferno's debuff on the monster
    // from its first flame to its auralencalc frames (10) after the last (a breath every 4 frames keeps it on)
    const from = {}, win = {}, c = x.cast, ms = x.F.moments || [];
    if (c && c.storm && c.storm.state) { me.push(c.storm.state); from[c.storm.state] = c.rel; }
    if (c && c.shield && c.shield.state) { me.push(c.shield.state); from[c.shield.state] = c.rel; }   // Blade Shield's blades
    // an attack's state on the attacker (Berserk, Feral Rage, Maul, Concentrate) and on its target from the first hit
    // (Rabies)
    if (x.atk && x.atk.state) me.push(x.atk.state);
    if (x.atk && x.atk.tstate && ms.length) win[x.atk.tstate] = [ms[0].f, Infinity];
    if (c && c.stream && c.stream.debuff && c.stream.debuff[0] && ms.length) win[c.stream.debuff[0]] = [ms[0].f, ms[ms.length - 1].f + (c.stream.debuff[1] || 10)];
    /* a channel between cooldowns (Inferno in Meteor's waits): its debuff from each breath for its length, so it comes
       and goes (each window [from, to), merged) */
    (x.ws || []).forEach(y => {
      const cy = y.cast, D = cy && cy.stream && cy.stream.debuff;
      if (!D || !D[0] || !y.F.moments.length) return;
      const len = D[1] || 10, w = [];
      y.F.moments.forEach(m => { if (w.length && m.f <= w[w.length - 1][1]) w[w.length - 1][1] = m.f + len; else w.push([m.f, m.f + len]); });
      win[D[0]] = w;
    });
    return { me: [...new Set(me)], mon: [...new Set(mon)], holdCold, from, win };
  }
  // the monster's color at a frame: chilled, poisoned or its own
  function colorAt(x, f) {
    const L = x.looks, C = coldLog(x);
    if (L.holdCold || C.on(C.chill, f) || C.on(C.freeze, f)) return "cold";
    if (x.F.dots && x.F.dots.some(d => d.word === "poison" && f >= d.f && f < d.f + d.frames)) return "poison";
    return "";
  }
  /* Frozen Orb as the client flies it (its do function 19): the orb at its Vel for its Range frames towards the monster,
     a bolt every Param1 frames, each Param2 of the 64 directions on from the last (Vel, Range of the bolt), and where it
     ends its nova (16 bolts, every fourth direction). The frames a bolt hits the monster: it enters a sub-tile of the
     monster's footprint (its own sub-tile for a small one, the four beside it too for a normal-size one, the 3 x 3 for
     a big one: the page's simulation's rule), once a bolt. The cast's bolt hits (the page's count, rolled in the fight)
     land on those frames in turn; more of them than the drawing has go on its last */
  function orbOf(x, O) {
    const I = IX(), M = I.mis, orb = x.cast.mis, bolt = M[O.bolt], nova = M[O.nova];
    if (!orb || !bolt) return null;
    const pace = v => v * G().MIS_PACE, size = Math.max(1, Math.min(3, +x.l.T.size || 2));
    const mon = [x.apart + 0.5, 0.5], cell = [Math.floor(mon[0]), Math.floor(mon[1])];
    const inFoot = (cx, cy) => { const dx = Math.abs(cx - cell[0]), dy = Math.abs(cy - cell[1]); return size === 1 ? dx + dy === 0 : size === 2 ? dx + dy <= 1 : Math.max(dx, dy) <= 1; };
    const bolts = [], hits = [], dirOf = k => { const i = ((k % 64) + 64) % 64, len = Math.hypot(G().RING_X[i], G().RING_Y[i]); return [G().RING_X[i] / len, G().RING_Y[i] / len]; };
    const fly = (t0, from, dir, v, range, row) => {
      bolts.push({ t0, from, dir, v, range, row });
      let last = [Math.floor(from[0]), Math.floor(from[1])];
      for (let t = 1; t <= range; t++) {
        const px = from[0] + dir[0] * pace(v) * t, py = from[1] + dir[1] * pace(v) * t, c = [Math.floor(px), Math.floor(py)];
        if (c[0] !== last[0] || c[1] !== last[1]) { if (inFoot(c[0], c[1])) { hits.push(t0 + t); bolts[bolts.length - 1].end = t; return; } last = c; }
      }
    };
    const n = Math.max(1, orb.r), start = [0.5, 0.5];
    for (let k = 0; k * O.every < n; k++) {
      const t = k * O.every, at = [start[0] + pace(orb.v) * t, start[1]];
      fly(t, at, dirOf(k * O.step), bolt.v, bolt.r, bolt);
    }
    const end = [start[0] + pace(orb.v) * n, start[1]];
    if (nova) for (let i = 0; i < 16; i++) fly(n, end, dirOf(i * 4), nova.v, nova.r, nova);
    hits.sort((a, b) => a - b);
    return { bolts, hits, n, start, bolt, boltKey: bolt.c, novaKey: nova ? nova.c : bolt.c, s: bolt.s, len: bolt.n, t: bolt.t };
  }
  // a cast's damage spread over its bolts' frames (f: the cast's release); the rest of the cast on the first
  function orbSplit(x, ev, f) {
    const hits = x.orb.hits, rolls = [];
    (ev.parts || []).forEach(r => { if (r.x && r.x.k === "bolt") r.d.forEach(v => rolls.push(v)); });
    const total = ev.loss - overOf(ev.parts), rest = total - rolls.reduce((a, v) => a + v, 0);
    if (!rolls.length || !hits.length) return [{ f: f + (hits[0] || 0), dmg: total }];
    return rolls.map((v, k) => ({ f: f + hits[Math.min(k, hits.length - 1)], dmg: v + (k === 0 ? rest : 0) }));
  }
  /* Blizzard as the client drops it (its centre's do function 13): a shard every frames / count frames of the centre's
     life (the page's: frames / calc2 shards), each on a random sub-tile of the square of calc1 - 1 around the spot cast
     on, falling its Range frames from CltParam1 pixels up, bursting where it lands on every monster whose centre lies
     within its radius (the page's rule). Where the shards land comes from the lane's own draws, picked so that as many
     of them reach the monster as the fight rolled for that cast (the game's own spots are random too) */
  function rainSplit(x, ev, f) {
    const R = x.cast.rain, part = (ev.parts || []).find(r => r.x && r.x.k === "shard");
    const total = ev.loss - overOf(ev.parts);
    if (!part) return [{ f, dmg: total }];
    const of = Math.max(1, part.x.of || 25), every = Math.max(1, Math.round(50 / of)), rad = part.x.rad || 4, sp = Math.max(1, part.x.spread || 4);
    const want = part.d.length, rnd = api.mulberry32(7919 + f * 31 + S.k * 101 + x.i);
    let best = null;
    for (let tries = 0; tries < 60; tries++) {
      const shards = [];
      for (let k = 0; k < of; k++) {
        const dx = Math.floor(rnd() * 2 * sp) - sp + 0.5, dy = Math.floor(rnd() * 2 * sp) - sp + 0.5;
        shards.push({ t: k * every, dx, dy, hit: dx * dx + dy * dy <= rad * rad, v: Math.floor(rnd() * R.shards.length) });
      }
      const n = shards.filter(q => q.hit).length;
      if (!best || Math.abs(n - want) < Math.abs(best.n - want)) best = { shards, n };
      if (n === want) break;
    }
    x.rain[f] = best.shards;
    const at = best.shards.filter(q => q.hit).map(q => f + q.t + R.fall), rest = total - part.d.reduce((a, v) => a + v, 0);
    if (!at.length) return [{ f: f + R.fall, dmg: total }];
    return part.d.map((v, k) => ({ f: at[Math.min(k, at.length - 1)], dmg: v + (k === 0 ? rest : 0) }));
  }
  /* Charged Bolt as it wanders (the game's path: legs of 2 sub-tiles, each the 8-way direction to the monster or one
     of its two neighbours, 11 / 10 / 11 in 32, at its Vel (+ VelLev a level, up to MaxVel) for its Range frames; a bolt
     hits the frame it enters a sub-tile of the monster's footprint, once). The paths come from the lane's own draws,
     picked so that as many bolts reach the monster as the fight rolled for that cast (the game's paths are random too) */
  const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const SEQ = [].concat(...Array(10).fill([-1, 0, 1]), [-1, 1]);
  function dir8(dx, dy) {
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (ax >= 2 * ay) return dx > 0 ? 0 : 4;
    if (ay >= 2 * ax) return dy > 0 ? 2 : 6;
    if (dx > 0) return dy > 0 ? 1 : 7;
    return dy > 0 ? 3 : 5;
  }
  /* Tornado and Twister walk the same way (their client start functions 69 and 68: the game's spread on charged-bolt
     paths): Tornado's one twister hits once on its way (Size 3: a sub-tile of its 3 x 3 on the monster's footprint)
     and bursts every calc4 (15) frames from its start, the burst reaching a monster within aurarangecalc (4); Twister's
     11 race out slowing (Accel) and the first to reach the monster hits it, the lock keeping the rest off */
  function walkSplit(x, ev, f) {
    const c = x.cast, m = c.mis, part = (ev.parts || []).find(r => r.x && (r.x.k === "bolt" || r.x.k === "hit"));
    const total = ev.loss - overOf(ev.parts);
    if (!part || !m) return [{ f, dmg: total }];
    const lvl = Math.max(1, +x.l.b.s.lvl || 1), v0 = Math.min(m.mv || 99, m.v + Math.floor((m.vl || 0) * (lvl - 1) / 8)) * G().MIS_PACE;
    const a = (m.a || 0) / 4096, speed = t => Math.max(0, v0 + Math.floor((t - 1) / 5) * a);
    const N = Math.max(1, part.x.of || 1), want = part.d.length, size = Math.max(1, Math.min(3, +x.l.T.size || 2));
    const mon = [Math.round(x.apart), 0], B = c.burst;
    const foot = (cx, cy) => { const dx = Math.abs(cx - mon[0]), dy = Math.abs(cy - mon[1]); return size === 1 ? dx + dy === 0 : size === 2 ? dx + dy <= 1 : Math.max(dx, dy) <= 1; };
    const inFoot = (cx, cy) => m.z >= 3 ? [-1, 0, 1].some(i => [-1, 0, 1].some(j => foot(cx + i, cy + j))) : foot(cx, cy);
    const main = dir8(mon[0], mon[1]);
    // one bolt's walk from the caster
    const walk1 = rnd => {
      let px = 0.5, py = 0.5, cell = [0, 0], tx = 0.5, ty = 0.5, hit = -1;
      const path = [];
      for (let t = 1; t <= m.r; t++) {
        let left = speed(t);
        while (left > 1e-9) {
          if (Math.abs(tx - px) < 1e-9 && Math.abs(ty - py) < 1e-9) {   // the next leg
            const d = DIRS[(main + SEQ[Math.floor(rnd() * 32)] + 8) % 8];
            tx = px + 2 * d[0]; ty = py + 2 * d[1];
          }
          const seg = Math.hypot(tx - px, ty - py);
          if (seg <= left) { px = tx; py = ty; left -= seg; } else { px += (tx - px) * left / seg; py += (ty - py) * left / seg; left = 0; }
        }
        path.push([px, py]);
        const cc = [Math.floor(px), Math.floor(py)];
        if (cc[0] !== cell[0] || cc[1] !== cell[1]) { cell = cc; if (hit < 0 && inFoot(cc[0], cc[1])) hit = t; }
      }
      // Tornado's bursts within reach: from its start, every calc4 frames
      const bursts = B ? path.map((q, t) => t).filter(t => t % B[0] === 0 && Math.hypot(path[t][0] - mon[0] - 0.5, path[t][1] - mon[1] - 0.5) <= B[1]) : [];
      return { path, hit, bursts };
    };
    const rnd = api.mulberry32(4651 + f * 37 + S.k * 211 + x.i);
    const bolts = pickWalkers(walkPool(x, "cast", walk1), N, want, c.lock, rnd);
    x.walk[f] = bolts;
    const at = bolts.flatMap(q => (q.hit >= 0 ? [q.hit] : []).concat(q.bursts.map(t => Math.max(1, t)))).map(t => f + t).sort((p, q) => p - q);
    const rest = total - part.d.reduce((a, v2) => a + v2, 0);
    if (!at.length) return [{ f, dmg: total }];
    return part.d.map((v2, k) => ({ f: at[Math.min(k, at.length - 1)], dmg: v2 + (k === 0 ? rest : 0) }));
  }
  /* walking bolts (Charged Bolt, Tornado, Twister, Charged Bolt Sentry's): a lane's pool of them, each walked once (the
     audit of 2026-11-27, CO-03: every cast's bolts had been walked whole up to 60 times over until as many reached the
     monster as the fight rolled, which froze the page for seconds, up to a minute against a boss, at every rebuild).
     A cast's bolts all start from the same spot and each walks on its own draws, so a cast takes from the pool as many
     bolts that reach the monster as it has hits and fills the rest with ones that don't. key: where they start (the
     caster, a trap's place); walk1(rnd): one bolt's walk, {path, hit, bursts} */
  const POOL = 48, POOL_WALKS = 800;
  const hashOf = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) | 0; return h; };
  function walkPool(x, key, walk1) {
    const pools = x.wpool || (x.wpool = {});
    if (pools[key]) return pools[key];
    const rnd = api.mulberry32(9157 + S.k * 211 + x.i * 31 + hashOf(key)), hit = [], miss = [];
    for (let g = 0; g < POOL_WALKS && (hit.length < POOL || miss.length < POOL); g++) {
      const b = walk1(rnd);
      b.n = (b.hit >= 0 ? 1 : 0) + (b.bursts ? b.bursts.length : 0);
      (b.n ? hit : miss).push(b);
    }
    return (pools[key] = { hit, miss });
  }
  /* a cast's N bolts from the pool: want of them reaching the monster (Twister's lock: at least want), the rest not;
     Tornado's (a hit and its bursts each) picked as a set that adds up to want, the closest of 60 tries */
  function pickWalkers(P, N, want, lock, rnd) {
    const take = (arr, n) => {   // n of them, no bolt twice while the pool lasts
      const out = [];
      let idx = [];
      for (let j = 0; j < n && arr.length; j++) {
        if (!idx.length) idx = arr.map((_, i) => i);
        out.push(arr[idx.splice(Math.floor(rnd() * idx.length), 1)[0]]);
      }
      return out;
    };
    if (!P.hit.some(b => b.n > 1)) {
      const bolts = take(P.hit, Math.min(N, want));
      return bolts.concat(take(P.miss.length ? P.miss : P.hit, N - bolts.length));
    }
    const all = P.hit.concat(P.miss);
    let best = null;
    for (let g = 0; g < 60; g++) {
      const bolts = take(all, N), n = bolts.reduce((t, b) => t + b.n, 0), ok = lock ? n >= want : n === want;
      if (!best || (ok && !best.ok) || (!best.ok && Math.abs(n - want) < Math.abs(best.n - want))) best = { bolts, n, ok };
      if (ok) break;
    }
    return best.bolts;
  }
  /* a missile's picture frame age game frames into its life: its AnimSpeed (16ths of a frame a game frame), played to
     SubStart, then looping SubStart-SubStop while it lives (SubLoop), else looping (LoopAnim) or holding its last */
  function misFrame(e, age) {
    const n = Math.max(1, e.n || 1), k = Math.floor(Math.max(0, age) * (e.s || 16) / 16);
    if (e.sub) {
      const a = Math.min(e.sub[0], n - 1), b = Math.min(Math.max(e.sub[1], a), n - 1);
      return k <= b ? k : a + (k - a) % (b - a + 1);
    }
    return e.l ? k % n : Math.min(k, n - 1);
  }
  /* Fire Wall as the client lays it (its start function 26 and its makers' do function 6, traced 2026-11-26): a flame
     on the spot cast on (the monster's) and two makers from there, both ways across the line from the caster, each at
     its Vel for Range + LevRange a level frames, drawn as they go, making a flame each frame they enter a new sub-tile
     (the big flame or the small one at even odds: the lane's own draws), every flame burning the first one's Range
     (75 frames). Blaze as the game draws it (its ignite's server hit, whose flames the server sends to the client: the
     skill has no client start function): a disc of flames on every sub-tile within sHitPar1 (4) of the caster, burning
     SHitCalc1 (35) frames. The page counts their damage (the flames under the monster), drained a frame at a time */
  function wallOf(x) {
    const Wl = x.cast.wall, mk = x.cast.mis, lvl = Math.max(1, +x.l.b.s.lvl || 1);
    const [wx, wy] = G().toWorld(x.place.mon[0] - x.place.me[0], x.place.mon[1] - x.place.me[1]), len = Math.hypot(wx, wy) || 1;
    const across = [-wy / len, wx / len], v = mk.v * G().MIS_PACE, life = Math.max(1, mk.r + (mk.lr || 0) * lvl), spots = [];
    [1, -1].forEach(sg => {
      let cell = [0, 0];
      for (let t = 1; t <= life; t++) {
        const cc = [Math.floor(0.5 + sg * across[0] * v * t), Math.floor(0.5 + sg * across[1] * v * t)];
        if (cc[0] !== cell[0] || cc[1] !== cell[1]) { cell = cc; spots.push({ t, at: cc }); }
      }
    });
    return { spots, life, across, v, kinds: {}, lits: {} };
  }
  /* a missile's way after t frames, in sub-tiles: Vel x 3 / 64 a frame (VelLev a level / 8 more, up to MaxVel), its
     Accel (4096ths of a sub-tile a frame) added every fifth frame, never below nought (the path's own rule: traced) */
  function travel(v0, a, t) {
    let d = 0;
    for (let k = 1; k <= t; k++) d += Math.max(0, v0 + Math.floor((k - 1) / 5) * a);
    return d;
  }
  /* Inferno as the client breathes it (PD2's client start function 111, traced 2026-11-26): each breath aims calc3
     flames (the page's count) in a fan towards the monster, N / 2 + 8 sub-tiles out (N more on 40% of breaths), a
     sub-tile apart across the line, each made at odds of 2 in N, its Vel varied by -6 to +1 (the first one's halved),
     living calc1 frames (one less at even odds), slowing by its Accel; a flame leaves its trail (the client's do 8:
     PD2's odds of CltParam2 % + CltParam3 x level / 4 % a frame, on a frame it enters a new sub-tile), each piece at a
     random height within its Z Range. The breaths come from the lane's own draws: the game's are random too */
  function breathOf(x, r0) {
    const B = x.breaths || (x.breaths = {});
    if (B[r0]) return B[r0];
    const I = IX(), St = x.cast.stream, fm = I.mis[St.m] || {}, pc = I.mis[St.trail] || {};
    const lvl = Math.max(1, Math.min(60, +x.l.b.s.lvl || 1)), N = Math.max(1, St.n[lvl - 1] || 1), life = St.life[lvl - 1] || 16;
    const odds = Math.min(100, Math.max(1, St.odds[0] || 100)) + (St.odds[1] > 0 ? Math.trunc(St.odds[1] * lvl / 4) : 0);
    const rnd = api.mulberry32(3301 + r0 * 37 + S.k * 101 + x.i), R = () => Math.floor(rnd() * 0x7fffffff);
    const [wx, wy] = G().toWorld(x.place.mon[0] - x.place.me[0], x.place.mon[1] - x.place.me[1]), len = Math.hypot(wx, wy) || 1;
    const to = [wx / len, wy / len], across = [-to[1], to[0]];
    const far = Math.trunc(N / 2) + 8 + (N > 1 && R() % 100 < 40 ? N : 0), aim = [to[0] * far, to[1] * far];
    const flames = [];
    for (let k = 0; k < N; k++) {
      const r = R();
      if (r % N > 1) continue;
      let vel = (fm.v || 28) - 6 + (r & 7);
      if (vel > 2 && k === 0) vel = Math.trunc(vel / 2);
      const off = k - Math.trunc(N / 2), tx = aim[0] + across[0] * off, ty = aim[1] + across[1] * off, tl = Math.hypot(tx, ty) || 1;
      const dir = [tx / tl, ty / tl], v0 = vel * G().MIS_PACE, a = (fm.a || 0) / 4096, lf = Math.max(1, life + (r & 1) - 1);
      const pieces = [];
      let cell = [0, 0], d = 0;
      for (let t = 1; t < lf; t++) {
        d += Math.max(0, v0 + Math.floor((t - 1) / 5) * a);
        const cc = [Math.floor(0.5 + dir[0] * d), Math.floor(0.5 + dir[1] * d)];
        const roll = R() % 100 < odds;
        if (cc[0] !== cell[0] || cc[1] !== cell[1]) {
          cell = cc;
          if (roll && pc.c) pieces.push({ t0: t, d, z: pc.zr > 0 ? R() % pc.zr - Math.trunc(pc.zr / 2) : 0 });
        }
      }
      flames.push({ dir, v0, a, life: lf, pieces });
    }
    return (B[r0] = flames);
  }
  /* Molten Boulder's end (the client's hit 52, traced 2026-11-27, trace T7): at its life's end or on a large
     monster (it rolls on through others), on its sub-tile: its explosion (a sound), cHitPar1 rocks each lobbed at a
     random spot up to 20 sub-tiles off on each axis (a spot within 3 makes none; they fly at cHitPar2 x 3/4, living
     their flight, t x (N + 1 - t) pixels up at frame t of N, in a direction the game takes from the spot's coordinates:
     drawn from the lane's draws), then 18 fire patches (CltHitSubMissile3, lit) on the meteor's table of spots. w: the
     boulder's place in sub-tiles from the caster */
  function boulderHit(x, out, B, bang, w, age, seed) {
    const I = IX(), [ax, ay] = x.place.me, c = [Math.floor(w[0] + 0.5), Math.floor(w[1] + 0.5)];
    const at = (e, a, dx, dy, d, z) => { if (!e || a < 0 || a >= Math.max(1, e.r)) return; const [sx, sy] = G().toScreen(c[0] + dx, c[1] + dy); putShot(out, ay + sy + 0.5, e, d || 0, misFrame(e, a), ax + sx, ay + sy - (z || 0), z ? [ax + sx, ay + sy] : undefined); };
    at(bang[0], age, 0, 0);
    const rock = bang[1] || null;   // (bang: the rows of CltHitSubMissile1-2)
    if (rock) {
      const rnd = api.mulberry32(9157 + seed * 17), sp = G().iasSprite(rock.c), n = sp && sp.geo ? sp.geo.dirs || 1 : 1, pace = (B.lob || 15) * G().MIS_PACE;
      for (let k = 0; k < (B.rocks || 10); k++) {
        const dx = Math.floor(rnd() * 41) - 20, dy = Math.floor(rnd() * 41) - 20, dist = Math.trunc(Math.max(Math.abs(dx), Math.abs(dy)) + Math.min(Math.abs(dx), Math.abs(dy)) / 2), d = Math.floor(rnd() * n);
        if (dist <= 3) continue;
        const N = Math.max(1, Math.floor(dist / pace)), u = age;
        if (u >= N) continue;
        const f = u / N, z = u * (N + 1 - u);
        const [sx, sy] = G().toScreen(c[0] + dx * f, c[1] + dy * f);
        out.push({ y: ay + sy, draw: ctx => n > 1 ? G().drawDirShot(ctx, rock, d, misFrame(rock, u), Math.round(ax + sx), Math.round(ay + sy - z), rock.t, [ax + sx, ay + sy])
          : G().drawFx(ctx, rock, misFrame(rock, u), Math.round(ax + sx), Math.round(ay + sy - z), rock.t, [ax + sx, ay + sy]) });
      }
    }
    const fire = B.fire ? I.mis[B.fire] : null;
    if (fire) METEOR18.forEach(o => at(fire, age, o[0], o[1]));
  }
  // the flames burning at the lane's frame, each where its feet are: [{y, draw(ctx)}], drawn in the units' order
  function groundOf(x) {
    const I = IX(), c = x.cast, f = S.frame, out = [];
    if (x.sent) sentFx(x, out);
    if (x.bomb) bombFx(x, out);
    if (x.shot) shotTrail(x, out);
    const own = c && (c.stream || c.storm || c.comb || c.hydra || c.delay || c.corpse || c.curse || c.orbit || c.fall || c.boulder || c.volcano || c.cracks || c.trap || c.mind);
    if (!c || !(c.wall || c.disc || own)) return out;
    if (own) { flightsOf(x, out); return out; }
    const [ax, ay] = x.place.me, [mx, my] = x.place.mon;
    const put = (e, age, px, py, lit) => out.push({ y: py, draw: ctx => G().drawFx(ctx, e, misFrame(e, age), Math.round(px), Math.round(py), e.t, lit) });
    nearM(x).forEach(m => {
      if (m.more) return;
      const r0 = m.f - x.flight, u = f - r0;
      if (u < 0) return;
      if (c.wall) {
        const Wl = c.wall, wl = x.wallG || (x.wallG = wallOf(x)), spot = I.mis[Wl.spot];
        if (spot && u < Wl.life) put(spot, u, mx, my);
        // each cast's own picks of the big flame or the small one
        const kinds = wl.kinds[r0] || (wl.kinds[r0] = (() => { const rnd = api.mulberry32(5813 + r0 * 31 + S.k * 97 + x.i); return wl.spots.map(() => Wl.flames[Math.floor(rnd() * Wl.flames.length)]); })());
        // (a maker's flame has a light at odds of 1 in its CltParam1, none at 0: trace T5; the lane's own draws)
        const lits = wl.lits[r0] || (wl.lits[r0] = (() => { const rnd = api.mulberry32(7717 + r0 * 13 + S.k * 89 + x.i); return wl.spots.map(() => makerLit(c.mis, rnd()) !== false); })());
        wl.spots.forEach((q, j) => {
          const e = I.mis[kinds[j]], age = u - q.t;
          if (!e || age < 0 || age >= Wl.life) return;
          const [sx, sy] = G().toScreen(q.at[0], q.at[1]);
          put(e, age, mx + sx, my + sy, lits[j] ? undefined : false);
        });
        const mk = c.mis;   // the makers themselves, at the wall's two ends while they move
        if (mk && u < wl.life) [1, -1].forEach(sg => {
          const d = wl.v * u, [sx, sy] = G().toScreen(sg * wl.across[0] * d, sg * wl.across[1] * d);
          put(mk, u, mx + sx, my + sy);
        });
      }
      if (c.disc) {
        const D = c.disc, e = I.mis[D.flame];
        if (!e || u >= D.life) return;
        for (let i = -D.r; i <= D.r; i++) for (let j = -D.r; j <= D.r; j++) {
          if (i * i + j * j > D.r * D.r) continue;
          const [sx, sy] = G().toScreen(i, j);
          put(e, u, ax + sx, ay + sy);
        }
      }
    });
    return out;
  }
  /* Combustion as PD2's client sends it (its client start function 100, traced 2026-11-26: its ring helper): calc2
     (32) fire balls from the caster towards every 64 / calc2-th point of the game's ring of 64, at their Vel for their
     Range; a ball that enters the monster's footprint (by its Size, the page's simulation's rule) explodes there (the
     client's own collision: every one that reaches it), the others fly on. The page's hits (the fight's roll for the
     cast) land as the balls reach it, the first at once and each next after the lock (NextDelay 2: 3 frames on) */
  function combOf(x) {
    const c = x.cast, m = c.mis, v = m.v * G().MIS_PACE, size = Math.max(1, Math.min(3, +x.l.T.size || 2));
    const step = Math.max(1, Math.floor(64 / Math.max(1, c.comb.n))), cell = [Math.floor(x.apart + 0.5), 0];
    const inFoot = (cx, cy) => { const dx = Math.abs(cx - cell[0]), dy = Math.abs(cy - cell[1]); return size === 1 ? dx + dy === 0 : size === 2 ? dx + dy <= 1 : Math.max(dx, dy) <= 1; };
    const rays = [];
    for (let k = 0; k < 64; k += step) {
      const rx = G().RING_X[k], ry = G().RING_Y[k], rl = Math.hypot(rx, ry) || 1, dir = [rx / rl, ry / rl];
      let last = [0, 0], hit = -1;
      for (let t = 1; t <= m.r; t++) {
        const cc = [Math.floor(0.5 + dir[0] * v * t), Math.floor(0.5 + dir[1] * v * t)];
        if (cc[0] !== last[0] || cc[1] !== last[1]) { last = cc; if (inFoot(cc[0], cc[1])) { hit = t; break; } }
      }
      rays.push({ dir, hit });
    }
    return { rays, v, at: rays.filter(q => q.hit >= 0).map(q => q.hit).sort((a, b) => a - b) };
  }
  function combSplit(x, ev, f) {
    const part = (ev.parts || []).find(r => r.x && r.x.k === "ball"), total = ev.loss - overOf(ev.parts);
    const g = x.combG || (x.combG = combOf(x));
    x.comb[f] = g;
    if (!part || !part.d.length) return [{ f: f + (g.at[0] || 1), dmg: total }];
    const rest = total - part.d.reduce((a, v) => a + v, 0);
    let last = -Infinity;
    return part.d.map((v, k) => {
      const t = Math.max(g.at.length ? g.at[Math.min(k, g.at.length - 1)] : 1, last + 3);
      last = t;
      return { f: f + t, dmg: v + (k === 0 ? rest : 0) };
    });
  }
  /* Hydra and Lesser Hydra as the game raises them (the server's do 144 and the heads' AI, traced 2026-11-25): each
     cast's three heads at the spot (+ (-1, -1), (0, 0), (1, -1) sub-tiles; here a third of the way to the monster, the
     casts' spots side by side in turn), rising (S2) for their spawn frames; a head thinks after its aidel: at 60% odds
     it shoots (A1, its missile at its release frame, the next think after the attack and its aidel), else it idles 10
     frames, and a think past its life (125 frames) and it dies (DT). The rolls come from the lane's own draws, picked
     so that a cast's shots are as many as the fight rolled for it (the page's average: 3.24 a head); each hits as its
     missile reaches the monster */
  const compassOf = (wx, wy) => Math.round((((Math.atan2(wy, wx) * 180 / Math.PI - 45) % 360 + 360) % 360) / 45) % 8;
  function headsOf(x, rnd, slot) {
    const I = IX(), H = x.cast.hydra, shot = I.mis[H.shot] || { v: 25 }, lvl = Math.max(1, +x.l.b.s.lvl || 1);
    const life = H.life[0] + H.life[1] * (lvl - 1), [MX, MY] = G().toWorld(x.place.mon[0] - x.place.me[0], x.place.mon[1] - x.place.me[1]);
    const spot = [Math.round(MX / 3), (slot - 1) * 3], v = shot.v * G().MIS_PACE;
    return [[-1, -1], [0, 0], [1, -1]].map((o, h) => {
      const at = [spot[0] + o[0], spot[1] + o[1]], d = Math.hypot(MX - at[0], MY - at[1]);
      const shots = [];
      let t = H.spawn + H.aidel;
      while (t <= life) { if (rnd() < 0.6) { shots.push(t); t += H.a1[0] + H.aidel; } else t += 10; }
      const c = compassOf(MX - at[0], MY - at[1]), sets = H.sets[h] || {};
      const near = [c, (c + 1) % 8, (c + 7) % 8, (c + 2) % 8, (c + 6) % 8].find(k => sets[String(k)]);
      return { h, at, shots, death: t, flight: Math.max(1, Math.ceil(d / v)), set: sets[String(near)] || "", dir: [(MX - at[0]) / (d || 1), (MY - at[1]) / (d || 1)], d };
    });
  }
  function hydraSplit(x, ev, f) {
    const H = x.cast.hydra, part = (ev.parts || []).find(r => r.x && r.x.k === "shot"), total = ev.loss - overOf(ev.parts);
    const slot = Math.floor(f / Math.max(1, x.l.E.fr.frames)) % 3, want = part ? part.d.length : 0;
    const rnd = api.mulberry32(8101 + f * 41 + S.k * 113 + x.i);
    let best = null;
    for (let tries = 0; tries < 200; tries++) {
      const heads = headsOf(x, rnd, slot), n = heads.reduce((t, q) => t + q.shots.length, 0);
      if (!best || Math.abs(n - want) < Math.abs(best.n - want)) best = { heads, n };
      if (n === want) break;
    }
    x.hyd[f] = best.heads;
    const hits = [];
    best.heads.forEach(q => q.shots.forEach(T => hits.push(f + T + H.a1[1] + q.flight)));
    hits.sort((a, b) => a - b);
    if (!part || !hits.length) return [{ f: f + (hits[0] || H.spawn + H.aidel), dmg: total }];
    const rest = total - part.d.reduce((a, v) => a + v, 0);
    return part.d.map((v, k) => ({ f: hits[Math.min(k, hits.length - 1)], dmg: v + (k === 0 ? rest : 0) }));
  }
  /* Fist of the Heavens as the game strikes (the delay's server hit at the end of its 10 frames: the lightning on the
     target; then its bolt, which starts on the target and hits it from its Activate frame, 2): the strike's number at
     the delay's end, the bolt's 2 frames on */
  function delaySplit(x, ev, f) {
    const D = x.cast.delay, total = ev.loss - overOf(ev.parts), t = f + D.frames;
    const bolt = (ev.parts || []).find(r => r.x && r.x.k === "fbolt"), bv = bolt ? bolt.d.reduce((a, v) => a + v, 0) : 0;
    x.delayS[f] = 1;
    return bv > 0 ? [{ f: t, dmg: total - bv }, { f: t + Math.max(1, D.act), dmg: bv }] : [{ f: t, dmg: total }];
  }
  /* a delay spell's look on the monster: the server's overlay (Fist of the Heavens' strike, Holy Light's light) from
     each cast's release for its frames, drawn over it */
  function tovFx(x, ctx, mx, my) {
    const c = x.cast, o = c && c.tov, f = S.frame;
    if (!o) return;
    const back = c.delay.at_end ? c.delay.frames : 0;
    nearM(x).forEach(m => {
      if (m.more) return;
      const k = Math.floor((f - (m.f - back)) * o.rate / 16);
      if (k >= 0 && k < Math.max(1, o.n)) G().drawFx(ctx, o, k, mx + o.dx, my + o.dy, o.trans, [mx, my]);
    });
  }
  /* Dark Pact's cycle (the page's: its curses cast again, then Dark Pact, each a cast): its blast at the last cast's
     release */
  function cycleSplit(x, ev, f) {
    const n = Math.max(1, Math.round(x.l.E.fr.frames / x.cast.cycle));
    x.cyc[f] = 1;
    return [{ f: f + (x.cast.cycle - 1) * n, dmg: ev.loss - overOf(ev.parts) }];
  }
  /* the corpse a cast blows up, next to the monster (the page counts one for each cast): the monster's own body (its
     dead frame) two sub-tiles off, lying there until the cast; Corpse Explosion (the game's client start function 32,
     traced 2026-11-26) bursts it into gore with a fire burst; Desecrate (PD2's 101) into gore with a ring of 8 poison
     clouds drifting out from it, and the 5 corpses it raises lie around the spot for their 16 seconds */
  const CORPSE_AT = [0, -2], RAISED = [[2, 0], [-2, 0], [0, 2], [2, -2], [-2, -2]];
  function corpseOf(x) {
    const M = G().monster(x.mon.set);
    if (!M) return null;
    if (M.modes.DD) return { mode: "DD", f: 0 };
    return M.modes.DT ? { mode: "DT", f: M.modes.DT.f - 1 } : null;
  }
  /* Molten Boulder as the game rolls it: it emerges at the Druid (its emerging missile, 5 frames), then rolls at its Vel
     towards the monster for Range + LevRange a level frames (LevRange read signed: 85 - level), a flame of its client
     sub-missiles each new sub-tile (one of the three at even odds, each burning the first one's Range: its client do
     47 as Fire Wall's makers); it hits the monster each frame it enters a new sub-tile reaching it (Size 2: its sub-tile
     and the four beside it; no LastCollide), a monster too large to knock back breaks it at once; it explodes where it
     stops (its hit 52: the explosion, flying rocks). The page's hits (the fight's roll) land on those frames in turn,
     its explosion's at the end. The knockback (the monster pushed 5 sub-tiles, half the time) isn't drawn */
  function boulderSplit(x, ev, f) {
    const B = x.cast.boulder, I = IX(), em = I.mis[B.emerge] || { r: 5 }, ro = I.mis[B.roll] || { v: 8, r: 85, lr: -1 };
    const lvl = Math.max(1, +x.l.b.s.lvl || 1), life = Math.max(1, ro.r + (ro.lr || 0) * lvl), v = ro.v * G().MIS_PACE;
    const [MX] = G().toWorld(x.place.mon[0] - x.place.me[0], x.place.mon[1] - x.place.me[1]), size = Math.max(1, Math.min(3, +x.l.T.size || 2));
    const cell = [Math.floor(MX + 0.5), 0], foot = (cx, cy) => { const dx = Math.abs(cx - cell[0]), dy = Math.abs(cy - cell[1]); return size === 1 ? dx + dy === 0 : size === 2 ? dx + dy <= 1 : Math.max(dx, dy) <= 1; };
    const meets = (cx, cy) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => foot(cx + a, cy + b));
    const hp = (ev.parts || []).find(r => r.x && r.x.k === "hitF"), large = hp && hp.x.expl > 0 && !(hp.x.hits > 0);
    const start = em.r || 5, hits = [], fires = [], rnd = api.mulberry32(2207 + f * 43 + S.k * 71 + x.i);
    let last = [0, 0], end = life;
    for (let t = 1; t <= life; t++) {
      const px = 0.7 + v * t, cc = [Math.floor(px + 0.5), 0];
      if (cc[0] === last[0] && cc[1] === last[1]) continue;
      last = cc;
      fires.push({ t, at: px, k: B.flames[Math.floor(rnd() * B.flames.length)] });
      if (meets(cc[0], cc[1])) { hits.push(t); if (large) { end = t; break; } }
    }
    x.ground2[f] = { start, end, fires, v };
    const total = ev.loss - overOf(ev.parts), d = hp ? hp.d.length : 0, at = hits.map(t => f + start + t);
    if (!d) return [{ f: f + start + end, dmg: total }];
    // the hits on its contact frames in turn; with the explosion counted (hits + 1 rolls) its share at the end
    const out = [];
    const each = total / d;
    for (let k = 0; k < d; k++) out.push({ f: at.length && (k < at.length || large) ? at[Math.min(k, at.length - 1)] : f + start + end, dmg: each });
    return out;
  }
  /* Volcano on the monster's spot as the client draws it (its client function 91 and the volcano's do 50): the volcano
     and its fire for their Range (150 frames); debris every CltParam3 (2) frames while 2 < its age < 128 (ages 4-126:
     trace T11, the audit's GA-22; the frames left had been counted, 20 frames late), each
     arcing (the client's height motion, as Fire Blast's bombs) to a random sub-tile within aurarangecalc (12) and
     bursting there (its hit: a burst of lava and a lava pool). The page's hits: the volcano's every 7 frames (PD2's lock),
     its debris' fires under the monster: the fight's rolls on those frames in turn */
  function volcanoSplit(x, ev, f) {
    const V = x.cast.volcano, I = IX(), dm = I.mis[V.debris] || { v: 14 }, rnd = api.mulberry32(3851 + f * 47 + S.k * 61 + x.i);
    const deb = [];
    for (let t = 1; t <= 150; t++) {
      if (t > 2 && t < 128 && t % V.every === 0) {
        const tx = Math.floor(rnd() * (2 * V.spread + 1)) - V.spread, ty = Math.floor(rnd() * (2 * V.spread + 1)) - V.spread;
        const D = Math.max(Math.abs(tx), Math.abs(ty)) + Math.min(Math.abs(tx), Math.abs(ty)) / 2;
        deb.push({ t, to: [tx, ty], n: Math.max(1, Math.round(D * 64 / (3 * Math.max(1, dm.v)))) });
      }
    }
    x.ground2[f] = { deb };
    const parts = ev.parts || [], body = parts.filter(r => r.x && (r.x.k === "body" || r.x.k === "bodyP")), fire = parts.filter(r => r.x && (r.x.k === "debris" || r.x.k === "debrisP"));
    const out = [], sum = rs => rs.reduce((t, r) => t + r.d.reduce((a, v) => a + v, 0), 0);
    const nb = Math.max(...body.map(r => r.d.length), 0), nf = Math.max(...fire.map(r => r.d.length), 0);
    for (let k = 0; k < nb; k++) out.push({ f: f + 7 * (k + 1), dmg: body.reduce((t, r) => t + (r.d[k] || 0), 0) });
    for (let k = 0; k < nf; k++) { const q = deb[Math.floor(rnd() * deb.length)] || { t: 30, n: 5 }; out.push({ f: f + q.t + q.n, dmg: fire.reduce((t, r) => t + (r.d[k] || 0), 0) }); }
    const total = ev.loss - overOf(ev.parts), rest = total - sum(body) - sum(fire);
    if (!out.length) return [{ f: f + 7, dmg: total }];
    out.sort((p, q) => p.f - q.f);
    out[0].dmg += rest;
    return out;
  }
  /* Fissure as the client opens it (the game's client start function 28 and its centre's do 48): a crack every calc2
     frames for its centre's Range (55), each on a random sub-tile within calc1 - 1 of the spot (the monster's), with a
     random facing and its smoke, on another or not (the client has no rule against it: trace T11, the audit's
     GA-22); a crack hits a monster its 3 x 3 reaches, once, as it opens. Where they open
     comes from the lane's own draws, picked so that as many reach the monster as the fight rolled */
  function fissureSplit(x, ev, f) {
    const C = x.cast.cracks, part = (ev.parts || []).find(r => r.x && r.x.k === "crack"), total = ev.loss - overOf(ev.parts);
    const every = Math.max(1, part && part.x.every > 0 ? part.x.every : 1), sp = C.spread, size = Math.max(1, Math.min(3, +x.l.T.size || 2));
    const foot = (cx, cy) => { const dx = Math.abs(cx), dy = Math.abs(cy); return size === 1 ? dx + dy === 0 : size === 2 ? dx + dy <= 1 : Math.max(dx, dy) <= 1; };
    const reach = (cx, cy) => [-1, 0, 1].some(i => [-1, 0, 1].some(j => foot(cx + i, cy + j)));
    const want = part ? part.d.length : 0, rnd = api.mulberry32(6421 + f * 53 + S.k * 83 + x.i);
    let best = null;
    for (let tries = 0; tries < 80; tries++) {
      const cr = [];
      for (let t = 0; t < C.frames; t += every) {
        const cx = Math.floor(rnd() * 2 * sp) - sp, cy = Math.floor(rnd() * 2 * sp) - sp;
        cr.push({ t, at: [cx, cy], hit: reach(cx, cy), d: Math.floor(rnd() * 4) });
      }
      const n = cr.filter(q => q.hit).length;
      if (!best || Math.abs(n - want) < Math.abs(best.n - want)) best = { cr, n };
      if (n === want) break;
    }
    x.ground2[f] = { cr: best.cr };
    const at = best.cr.filter(q => q.hit).map(q => f + q.t + 1);
    if (!part || !part.d.length || !at.length) return [{ f: f + 1, dmg: total }];
    const rest = total - part.d.reduce((a, v) => a + v, 0);
    return part.d.map((v, k) => ({ f: at[Math.min(k, at.length - 1)], dmg: v + (k === 0 ? rest : 0) }));
  }
  // a missile's picture at (x, y): every way (its direction file d) or its one way
  // a do-6 maker's flame (Fire Wall's, Fire Claws', Immolation Arrow's): a light at odds of 1 in its maker's CltParam1,
  // none at 0 (trace T5), from its own draw; false (no light) or undefined (its own)
  const makerLit = (m, r) => (m && m.lq !== undefined && !(m.lq > 0 && r * m.lq < 1) ? false : undefined);
  const putShot = (out, y, e, d, fr, px, py, at) => {   // (at: the ground under it, when it is drawn higher)
    const sp = G().iasSprite(e.c), dirs = sp && sp.geo ? sp.geo.dirs || 0 : 0;
    out.push({ y, draw: ctx => dirs ? G().drawDirShot(ctx, e, Math.min(dirs - 1, d), fr, Math.round(px), Math.round(py), e.t, at) : G().drawFx(ctx, e, fr, Math.round(px), Math.round(py), e.t, at) });
  };
  /* a cloud's puffs (the game's missile do 4, traced 2026-11-27, trace T2): each frame of its life, at odds 1 in
     CltParam1, CltParam2 puffs (CltSubMissile1) where the cloud is, each drifting at its own Vel towards a point
     CltParam3 to 2 x CltParam3 - 1 sub-tiles off on each axis (a random sign each) for its Range. at(t): the cloud's
     spot t frames into its life (world sub-tiles); px(w): a spot's place on the stage. Poison and Plague Javelin's
     clouds, Desecrate's, Poison Strike's, Cobra Strike's (whose own picture is none) */
  function puffsOf(out, e, age, at, seed, px) {
    const I = IX(), pf = e && e.pf, pu = pf ? I.mis[(e.cs || [])[0]] : null;
    if (!pu || age < 0) return;
    const rnd = api.mulberry32(seed), life = Math.max(1, pu.r || 25), v = (pu.v || 1) * G().MIS_PACE, P3 = Math.max(1, pf[2] || 6);
    const sp = G().iasSprite(pu.c), dirs = sp && sp.geo ? sp.geo.dirs || 1 : 1;
    for (let t = 0; t <= age; t++) {
      if (Math.floor(rnd() * Math.max(1, pf[0] || 24)) !== 0) continue;
      for (let k = 0; k < Math.max(1, pf[1] || 1); k++) {
        const dx = (rnd() < 0.5 ? -1 : 1) * (P3 + Math.floor(rnd() * P3)), dy = (rnd() < 0.5 ? -1 : 1) * (P3 + Math.floor(rnd() * P3)), a = age - t;
        if (a >= life) continue;
        const L = Math.hypot(dx, dy) || 1, c = at(t), [qx, qy] = px([c[0] + dx / L * v * a, c[1] + dy / L * v * a]);
        putShot(out, qy, pu, G().fileDir(dx, dy, dirs), misFrame(pu, a), qx, qy);
      }
    }
  }
  // Inferno's flames and their trails, Thunder Storm's bolts and rings, Combustion's balls, Hydra's heads and their
  // shots, Fist of the Heavens' bolts, corpses and their bursts, curses' areas, each where its feet are (groundOf)
  function flightsOf(x, out) {
    const I = IX(), c = x.cast, f = S.frame, [ax, ay] = x.place.me, [mx, my] = x.place.mon;
    const end = x.F.killF >= 0 ? x.F.killF : Infinity;
    if (c.trap) trapFx(x, out);
    if (c.mind) mindFx(x, out);
    /* Hurricane (its state's client function 90 and the debris' do 60, traced 2026-11-26): from its cast's release a
       piece every cltcalc1 (3) frames, a swoosh, a rock or a tree, circling the Druid at its Vel for its Range (do 60
       re-aims it across the line to the centre every other frame); where each starts and its radius come from the lane's
       own draws (the client's own spread isn't traced) */
    if (c.orbit) {
      /* its state's client function 90 (trace T11, the audit's GA-13): each frame O.per pieces (3 x cltcalc1,
         9), each from one of the 8 points of a radius-7 ring round the Druid, of a random kind and at a random height
         (0-74 pixels, kept), launched along the ring and re-aimed along it every 2 frames, so it circles counterclockwise
         on screen and drifts out to about 9 sub-tiles over its life (120-145 degrees): about 186 in the air at once */
      const O = c.orbit, t0 = c.rel, last = Math.min(f, end + 75), per = O.per || 9, R0 = O.ring || 7, Z = (O.zmax || 74) + 1;
      const life = Math.max(1, ...O.kinds.map(k => (I.mis[k] || {}).r || 0));
      for (let b = Math.max(t0, f - life); b <= last; b++) {
        for (let j = 0; j < per; j++) {
          const rnd = api.mulberry32(911 + b * 131 + j * 17 + x.i), e = I.mis[O.kinds[Math.floor(rnd() * O.kinds.length)]];
          if (!e) continue;
          const u = f - b;
          if (u < 0 || u >= e.r) continue;
          const th0 = Math.floor(rnd() * 8) * Math.PI / 4, z = Math.floor(rnd() * Z), r = R0 + 2.1 * u / Math.max(1, e.r);
          const th = th0 - (e.v * G().MIS_PACE / (R0 + 1)) * u, wx = Math.cos(th) * r, wy = Math.sin(th) * r;   // (a falling angle: counterclockwise on screen)
          const [sx, sy] = G().toScreen(wx, wy), sp = G().iasSprite(e.c), dirs = sp && sp.geo ? sp.geo.dirs || 0 : 0;
          putShot(out, ay + sy, e, dirs ? G().fileDir(Math.sin(th), -Math.cos(th), dirs) : 0, misFrame(e, u), ax + sx, ay + sy - z, [ax + sx, ay + sy]);
        }
      }
    }
    /* Armageddon (its client function 92): each rock falls to its spot from cltcalc3 x cltcalc1 pixels to the right and
       cltcalc2 x cltcalc1 up, cltcalc3 and cltcalc2 pixels a frame, its fiery tail with it, and bursts there (its
       explosion, its fire). A rock that reaches the monster (the fight's roll) lands within 2 sub-tiles of it, the
       others on a random spot within 9 of the Druid away from it */
    if (c.fall) {
      const A = c.fall, tail = I.mis[A.tail], rock = I.mis[A.rock], hits = A.hits.map(k => I.mis[k]).filter(Boolean);
      const [MX, MY] = G().toWorld(mx - ax, my - ay);
      nearM(x).forEach((q, j) => {
        const r0 = q.f - A.frames, u = f - r0;
        if (u < 0 || r0 > end) return;
        const rnd = api.mulberry32(5101 + r0 * 17 + x.i), near = q.dmg > 0;
        let wx, wy;
        for (let g = 0; g < 20; g++) {
          wx = near ? MX + rnd() * 4 - 2 : rnd() * 18 - 9; wy = near ? MY + rnd() * 4 - 2 : rnd() * 18 - 9;
          if (near || Math.hypot(wx - MX, wy - MY) > 6) break;
        }
        const [sx, sy] = G().toScreen(wx, wy);
        if (u < A.frames) {
          // (its slide in map units, half a pixel right and a quarter down each: trace T11, the audit's GA-12)
          const left = A.frames - u, px = ax + sx + A.dx / 2 * left / A.frames, py = ay + sy + (A.dx / 4 - A.z) * left / A.frames;
          [tail, rock].forEach(e => { if (e) putShot(out, ay + sy, e, 0, misFrame(e, u), px, py, [px, ay + sy]); });
        } else hits.forEach(e => { const age = u - A.frames; if (age < Math.max(1, e.r)) putShot(out, ay + sy + 0.5, e, 0, misFrame(e, age), ax + sx, ay + sy); });
      });
    }
    if (c.boulder) {
      const B = c.boulder, em = I.mis[B.emerge], ro = I.mis[B.roll], bang = B.bang.map(k => I.mis[k]).filter(Boolean);
      const [MX, MY] = G().toWorld(mx - ax, my - ay), len = Math.hypot(MX, MY) || 1, dir = [MX / len, MY / len];
      const rsp = ro ? G().iasSprite(ro.c) : null, rdirs = rsp && rsp.geo ? rsp.geo.dirs || 1 : 1, dk = G().fileDir(dir[0], dir[1], rdirs);
      nearKeys(x.ground2).forEach(k => {
        const r0 = +k, g = x.ground2[k], u = f - r0;
        if (u < 0 || r0 > end) return;
        if (em && u < g.start) { const [sx, sy] = G().toScreen(dir[0] * 0.7, dir[1] * 0.7); putShot(out, ay + sy, em, dk, misFrame(em, u), ax + sx, ay + sy); }
        const t = u - g.start;
        const lr = api.mulberry32(6163 + r0 * 29 + x.i);   // (its trail is do 6's: a flame's light at odds of 1 in CltParam1)
        g.fires.forEach(q => {
          const e = I.mis[q.k], age = t - q.t, lf = (I.mis[B.flames[0]] || {}).r || 75, lit = makerLit(ro, lr());
          if (!e || age < 0 || age >= lf) return;
          const [sx, sy] = G().toScreen(dir[0] * q.at, dir[1] * q.at);
          putShot(out, ay + sy, e, 0, misFrame(e, age), ax + sx, ay + sy, lit);
        });
        if (ro && t >= 0 && t < g.end) { const d = 0.7 + g.v * t, [sx, sy] = G().toScreen(dir[0] * d, dir[1] * d); putShot(out, ay + sy, ro, dk, misFrame(ro, t), ax + sx, ay + sy); }
        const age = t - g.end;
        if (age >= 0) boulderHit(x, out, B, bang, [dir[0] * (0.7 + g.v * g.end), dir[1] * (0.7 + g.v * g.end)], age, r0 * 13 + x.i);
      });
    }
    if (c.volcano) {
      const V = c.volcano, base = I.mis[V.base], fire = I.mis[V.fire], deb = I.mis[V.debris], hits = V.hits.map(k => I.mis[k]).filter(Boolean);
      nearKeys(x.ground2).forEach(k => {
        const r0 = +k, g = x.ground2[k], u = f - r0;
        if (u < 0 || r0 > end || u > 175) return;
        if (u < 150) [base, fire].forEach(e => { if (e) putShot(out, my, e, 0, misFrame(e, u), mx, my); });
        g.deb.forEach(q => {
          const t = u - q.t;
          if (t < 0) return;
          const [sx, sy] = G().toScreen(q.to[0], q.to[1]);
          if (t < q.n && deb) {   // its arc (the client's height motion: up from 30 pixels and back down, as the bombs')
            const z = Math.max(0, 30 + t * (q.n + 1 - 30 / q.n) - t * t);
            putShot(out, my + sy * t / q.n, deb, 0, misFrame(deb, t), mx + sx * t / q.n, my + sy * t / q.n - z, [mx + sx * t / q.n, my + sy * t / q.n]);
          } else hits.forEach(e => { const age = t - q.n; if (age >= 0 && age < Math.max(1, e.r)) putShot(out, my + sy, e, 0, misFrame(e, age), mx + sx, my + sy); });
        });
      });
    }
    if (c.cracks) {
      const C = c.cracks, crack = I.mis[C.crack], smoke = I.mis[C.smoke];
      nearKeys(x.ground2).forEach(k => {
        const r0 = +k, g = x.ground2[k], u = f - r0;
        if (u < 0 || r0 > end) return;
        g.cr.forEach(q => {
          const t = u - q.t, [sx, sy] = G().toScreen(q.at[0], q.at[1]);
          if (t < 0) return;
          if (crack && t < crack.r) putShot(out, my + sy, crack, q.d, misFrame(crack, t), mx + sx, my + sy);
          if (smoke && t < smoke.r) putShot(out, my + sy + 0.5, smoke, 0, misFrame(smoke, t), mx + sx, my + sy);
        });
      });
    }
    if (c.corpse) {
      const C = c.corpse, body = corpseOf(x), casts = nearM(x).filter(q => !q.more).map(q => q.f - x.flight);
      const [cx0, cy0] = G().toScreen(CORPSE_AT[0], CORPSE_AT[1]), cx = Math.round(mx + cx0), cy = Math.round(my + cy0);
      const last = casts.filter(r => r <= f).pop(), boom = C.boom.map(k => I.mis[k]).filter(Boolean);
      const busy = last !== undefined && f - last < Math.max(...boom.map(e => e.r), 1);
      if (body && !busy) out.push({ y: cy, draw: ctx => G().drawMonster(ctx, x.mon.set, x.mon.table, x.mon.act, body.mode, body.f, cx, cy, "") });
      casts.forEach(r0 => {
        const u = f - r0;
        if (u < 0 || r0 > end) return;
        boom.forEach(e => {
          if (u >= Math.max(1, e.r)) return;
          const sp = G().iasSprite(e.c), dirs = sp && sp.geo ? sp.geo.dirs || 0 : 0;   // (a picture of one way: drawFx)
          out.push({ y: cy + 0.5, draw: ctx => dirs ? G().drawDirShot(ctx, e, G().fileDir(1, 1, dirs), misFrame(e, u), cx, cy, e.t) : G().drawFx(ctx, e, misFrame(e, u), cx, cy, e.t) });
        });
        if (C.raise && body) RAISED.slice(0, C.raise).forEach(([ox, oy]) => {
          if (u >= C.decay) return;
          const [sx, sy] = G().toScreen(CORPSE_AT[0] + ox, CORPSE_AT[1] + oy), px = Math.round(mx + sx), py = Math.round(my + sy);
          out.push({ y: py, draw: ctx => G().drawMonster(ctx, x.mon.set, x.mon.table, x.mon.act, body.mode, body.f, px, py, "") });
        });
        const cl = C.cloud ? I.mis[C.cloud] : null;
        if (cl && u < cl.r) {
          const sp = G().iasSprite(cl.c), dirs = sp && sp.geo ? sp.geo.dirs || 1 : 1, step = Math.max(1, Math.floor(64 / C.n));
          for (let k = 0; k < 64; k += step) {
            const rx = G().RING_X[k], ry = G().RING_Y[k], rl = Math.hypot(rx, ry) || 1, d = cl.v * G().MIS_PACE * u;
            const [sx, sy] = G().toScreen(CORPSE_AT[0] + rx / rl * d, CORPSE_AT[1] + ry / rl * d);
            out.push({ y: my + sy, draw: ctx => G().drawDirShot(ctx, cl, G().fileDir(rx, ry, dirs), misFrame(cl, u), Math.round(mx + sx), Math.round(my + sy), cl.t) });
            puffsOf(out, cl, u, t => [CORPSE_AT[0] + rx / rl * cl.v * G().MIS_PACE * t, CORPSE_AT[1] + ry / rl * cl.v * G().MIS_PACE * t], 3301 + k * 13 + r0 * 7, w => { const [qx, qy] = G().toScreen(w[0], w[1]); return [mx + qx, my + qy]; });
          }
        }
      });
    }
    /* Dark Pact's own look as it lands (its state's start, dark_pact_hit; the game's client start function 30 makes the
       curse's area too, drawn by a client function not traced yet: left out) */
    if (c.curse) {
      const st = I.starts && I.ov ? I.ov[I.starts[c.curse.state]] : null;
      if (st) nearM(x).forEach(q => {
        const k = Math.floor((f - q.f) * st.rate / 16);
        if (k >= 0 && k < st.n) out.push({ y: my + 0.5, draw: ctx => G().drawFx(ctx, st, k, Math.round(mx + st.dx), Math.round(my + st.dy), st.trans, [mx, my]) });
      });
      /* every curse's own looks (the game's client start 18 and do 30, shared by every curse; traced 2026-11-27,
         trace T2), for each cast of the cycle (your curses again, then Dark Pact): the cast's spark
         (cltmissilec, cursecast) from you towards the monster at its Vel for its Range, hidden its first 7 frames; at the
         release an unseen centre on the monster bursts three times (0, 3 and 6 frames on) into the curse's pieces
         (cltmissilea, CurseArea) on the spots of a disc of radius R = its aurarangecalc - 3 (at least 2; every other
         spot past 4), each at odds 1 in R (R / 2 past 4); a piece doesn't move, shows from its 2nd frame, its file's
         first direction */
      const AR = c.curse.areas || {}, n = Math.max(1, Math.round(x.l.E.fr.frames / c.cycle)), M = monAt(x);
      const own = (x.l.b.deb.curses || []).map(r => CURSE_ID[r.c]).filter(id => AR[id]);
      const list = Array.from({ length: Math.max(0, c.cycle - 1) }, (_, i) => own[i % Math.max(1, own.length)] || 66).concat([381]);
      const dir = (() => { const d = [M[0] - 0.5, M[1] - 0.5], L = Math.hypot(d[0], d[1]) || 1; return [d[0] / L, d[1] / L]; })();
      nearKeys(x.cyc).forEach(k => list.forEach((id, i) => {
        const t0 = +k + i * n, a = AR[id], u = f - t0;
        if (!a || u < 0 || u > n + 30) return;
        const cm = I.mis[a[1]];
        if (cm && u > 7 && u < Math.max(1, cm.r)) { const d = cm.v * G().MIS_PACE * u, [qx, qy] = scr(x, [0.5 + dir[0] * d, 0.5 + dir[1] * d]); putShot(out, qy, cm, 0, misFrame(cm, u), qx, qy); }
        const pc = I.mis[a[0]], ur = u - (c.rel || 0);
        // (each of your curses lands with its state's start, curse_hit: the audit's CV-03)
        const hs = id !== 381 && I.starts && I.ov ? I.ov[I.starts[ID_STATE[id]]] : null, kk = hs ? Math.floor(ur * hs.rate / 16) : -1;
        if (hs && kk >= 0 && kk < hs.n) out.push({ y: my + 0.5, draw: ctx => G().drawFx(ctx, hs, kk, Math.round(mx + hs.dx), Math.round(my + hs.dy), hs.trans, [mx, my]) });
        if (!pc || ur < 0) return;
        const lvl = id === 381 ? +x.l.b.s.lvl || 1 : +((x.l.b.deb.curses || []).find(r => CURSE_ID[r.c] === id) || {}).lvl || 1;
        let R = 6;
        try { R = Math.max(2, (api.Calc.value(id, "aurarangecalc", lvl, { blvl: { curmas: +x.l.b.deb.cm || 0 } }) || 6) - 3); } catch (e) { R = 3; }
        const odds = R > 4 ? Math.floor(R / 2) : R, step = R > 4 ? 2 : 1, rnd = api.mulberry32(t0 * 37 + id);
        [0, 3, 6].forEach(b => {
          const age = ur - b;
          for (let j = -R; j <= R; j += step) for (let i2 = -R; i2 <= R; i2 += step) {
            if (i2 * i2 + j * j > R * R) continue;
            if (Math.floor(rnd() * odds) !== 0) continue;
            if (age < 2 || age >= Math.max(1, pc.r)) continue;
            const [qx, qy] = scr(x, [M[0] + i2, M[1] + j]);
            putShot(out, qy, pc, 0, misFrame(pc, age), qx, qy);
          }
        });
      }));
    }
    /* Fist of the Heavens' bolt (the client's hit 26 at the delay's end: one at each unit within 20 sub-tiles; the
       lone monster's own starts on it, nudged a sub-tile each way, so it leaves to the south on the screen): HolyBolt's
       picture at its Vel, speeding up by its Accel, for its Range; it hits the monster from its Activate frame (its hit
       sub-missile there) and flies on (no CollideKill). None once the monster is dead (no unit to aim at) */
    if (c.delay && c.delay.bolt && x.delayS && c.mis) {
      const m = c.mis, D = c.delay, dir = [Math.SQRT1_2, Math.SQRT1_2], subs = (m.h || []).map(k => I.mis[k]).filter(Boolean);
      nearKeys(x.delayS).forEach(k => {
        const r0 = +k + D.frames, u = f - r0;
        if (r0 > end || u < 0 || u >= Math.max(m.r, D.act + 14)) return;
        if (u < m.r) {
          const d = travel(m.v * G().MIS_PACE, (m.a || 0) / 4096, u), [sx, sy] = G().toScreen(dir[0] * d, dir[1] * d);
          out.push({ y: my + sy, draw: ctx => G().drawDirShot(ctx, m, 0, misFrame(m, u), Math.round(mx + sx), Math.round(my + sy), m.t) });
        }
        const age = u - D.act;
        if (age >= 0 && r0 + D.act <= end) {
          const d = travel(m.v * G().MIS_PACE, (m.a || 0) / 4096, D.act), [sx, sy] = G().toScreen(dir[0] * d, dir[1] * d);
          subs.forEach(e => { if (age < Math.max(1, e.r)) out.push({ y: my + sy + 0.5, draw: ctx => G().drawFx(ctx, e, misFrame(e, age), Math.round(mx + sx), Math.round(my + sy), e.t) }); });
        }
      });
    }
    if (c.comb && c.mis) {
      const m = c.mis, sp = G().iasSprite(m.c), dirs = sp && sp.geo ? sp.geo.dirs || 1 : 1;
      nearKeys(x.comb).forEach(k => {
        const r0 = +k, u = f - r0, g = x.comb[k];
        if (r0 > end || u < 0 || u > m.r + 20) return;
        g.rays.forEach(q => {
          const hit = q.hit >= 0 && r0 + q.hit <= end, stop = hit ? q.hit : m.r;   // (a dead monster stops none)
          if (u < stop) {
            const d = g.v * u, [sx, sy] = G().toScreen(q.dir[0] * d, q.dir[1] * d);
            out.push({ y: ay + sy, draw: ctx => G().drawDirShot(ctx, m, G().fileDir(q.dir[0], q.dir[1], dirs), misFrame(m, u), Math.round(ax + sx), Math.round(ay + sy), m.t) });
          } else if (hit) {
            const d = g.v * q.hit, [sx, sy] = G().toScreen(q.dir[0] * d, q.dir[1] * d);
            landFx(out, m.name, u - q.hit, ax + sx, ay + sy, r0 * 11 + q.hit * 5 + x.i);
          }
        });
      });
    }
    if (c.hydra) {
      const H = c.hydra, shot = I.mis[H.shot], ssp = shot ? G().iasSprite(shot.c) : null, sdirs = ssp && ssp.geo ? ssp.geo.dirs || 1 : 1;
      nearKeys(x.hyd).forEach(k => {
        const r0 = +k, u = f - r0;
        if (r0 > end || u < 0) return;
        x.hyd[k].forEach(q => {
          if (u >= q.death + H.dt) return;
          const [hx, hy] = G().toScreen(q.at[0], q.at[1]), px = Math.round(ax + hx), py = Math.round(ay + hy);
          // its mode now: rising, dying, shooting (none after the monster's death: it has no one to shoot), standing
          let mode = "NU", fr = 0;
          const atk = q.shots.find(T => u >= T && u < T + H.a1[0] && r0 + T <= end);
          if (u < H.spawn) { mode = "S2"; fr = u; }
          else if (u >= q.death) { mode = "DT"; fr = u - q.death; }
          else if (atk !== undefined) { mode = "A1"; fr = u - atk; }
          else { const M = G().monster(q.set), n = M && M.modes.NU ? M.modes.NU.f : 12; fr = (u - H.spawn) % n; }
          out.push({ y: py, draw: ctx => { G().shadow(ctx, px, py, 12); G().drawMonster(ctx, q.set, 2, x.mon.act, mode, fr, px, py, ""); } });
          // its shots on their way: from its release frame to the monster, and where they land (the shared rule)
          if (shot) q.shots.forEach(T => {
            const t = u - T - H.a1[1], land = r0 + T + H.a1[1] + q.flight <= end;
            if (land && t >= q.flight) landFx(out, H.shot, t - q.flight, mx, my, r0 * 7 + T * 3 + q.h + x.i);
            if (t < 0 || t >= (land ? q.flight : shot.r) || r0 + T + H.a1[1] > end) return;
            const d = shot.v * G().MIS_PACE * t, [sx, sy] = G().toScreen(q.at[0] + q.dir[0] * d, q.at[1] + q.dir[1] * d);
            out.push({ y: ay + sy, draw: ctx => G().drawDirShot(ctx, shot, G().fileDir(q.dir[0], q.dir[1], sdirs), misFrame(shot, t), Math.round(ax + sx), Math.round(ay + sy), shot.t) });
          });
        });
      });
    }
    if (c.stream) {
      const fm = I.mis[c.stream.m], pc = I.mis[c.stream.trail];
      const fsp = fm ? G().iasSprite(fm.c) : null, psp = pc ? G().iasSprite(pc.c) : null;
      const fdirs = fsp && fsp.geo ? fsp.geo.dirs || 1 : 1, pdirs = psp && psp.geo ? psp.geo.dirs || 1 : 1;
      nearM(x).forEach(m => {
        const r0 = m.f - x.flight, u = f - r0;
        if (u < 0 || u > 64) return;   // (a flame lives 32 frames at most, its last trail 14 more)
        breathOf(x, r0).forEach(q => {
          if (u < q.life && fm) {
            const d = travel(q.v0, q.a, u), [sx, sy] = G().toScreen(q.dir[0] * d, q.dir[1] * d);
            out.push({ y: ay + sy, draw: ctx => G().drawDirShot(ctx, fm, G().fileDir(q.dir[0], q.dir[1], fdirs), misFrame(fm, u), Math.round(ax + sx), Math.round(ay + sy), fm.t) });
          }
          if (pc) q.pieces.forEach(pz => {
            const age = u - pz.t0;
            if (age < 0 || age >= pc.r) return;
            const [sx, sy] = G().toScreen(q.dir[0] * pz.d, q.dir[1] * pz.d);
            out.push({ y: ay + sy, draw: ctx => G().drawDirShot(ctx, pc, G().fileDir(q.dir[0], q.dir[1], pdirs), misFrame(pc, age), Math.round(ax + sx), Math.round(ay + sy - pz.z), pc.t, [ax + sx, ay + sy]) });
          });
        });
      });
      /* (traced 2026-11-27, trace T3) Arctic Blast's cast look on her, once at the channel's first breath, and its
         shatter: a monster that dies with the debuff on (a breath within its last 10 frames) breaks into a ring of Param4
         missiles (every other of the game's 64 ring points) flying out from it */
      const pg = c.stream.prg && I.ov ? I.ov[c.stream.prg] : null, ms = x.F.moments;
      if (pg && ms.length) { const k = Math.floor((f - (ms[0].f - x.flight)) * pg.rate / 16); if (k >= 0 && k < Math.max(1, pg.n)) out.push({ y: ay + 1, draw: ctx => G().drawFx(ctx, pg, k, Math.round(ax + pg.dx), Math.round(ay + pg.dy), pg.trans, [ax, ay]) }); }
      const sh = c.stream.shatter, se = sh ? I.mis[sh[0]] : null, kf = x.F.killF;
      if (se && kf >= 0 && f >= kf && ms.some(q => q.f <= kf && kf - q.f <= ((c.stream.debuff || [])[1] || 10))) {
        const u = f - kf, sp = G().iasSprite(se.c), n = sp && sp.geo ? sp.geo.dirs || 1 : 1, step = Math.max(1, Math.round(64 / sh[1])), d = travel(se.v * G().MIS_PACE, (se.a || 0) / 4096, u);
        if (u < Math.max(1, se.r)) for (let k = 0; k < 64; k += step) {
          const rx = G().RING_X[k], ry = G().RING_Y[k], rl = Math.hypot(rx, ry) || 1, [sx, sy] = G().toScreen(rx / rl * d, ry / rl * d);
          out.push({ y: my + sy, draw: ctx => G().drawDirShot(ctx, se, G().fileDir(rx, ry, n), misFrame(se, u), Math.round(mx + sx), Math.round(my + sy), se.t) });
        }
      }
    }
    if (c.storm) {
      /* Thunder Storm's strike as the client draws it (its function 84 and the bolt's hit function 4, traced
         2026-11-26): the bolt (cltmissilea) on the monster from 280 pixels up, falling 40 a frame (on the ground from its
         sixth frame), for its Range (9) frames; as it ends (it always explodes) its ring of 64 novas from the spot, each
         its own way, slowing by its Accel, for its Range (15) */
      const T = c.storm, bolt = I.mis[T.bolt], nova = I.mis[T.nova];
      const nsp = nova ? G().iasSprite(nova.c) : null, ndirs = nsp && nsp.geo ? nsp.geo.dirs || 1 : 1;
      nearM(x).forEach(m => {
        const u = f - m.f;
        if (u < 0) return;
        if (bolt && u < Math.max(1, bolt.r)) {
          const z = Math.max(0, T.z - T.vz * (u + 1));
          out.push({ y: my + 0.5, draw: ctx => G().drawShot(ctx, bolt, misFrame(bolt, u), mx, my - z, 0, bolt.t, [mx, my]) });
        }
        const t = u - Math.max(1, bolt ? bolt.r : 9);
        if (!nova || t < 0 || t >= nova.r) return;
        const d = travel(nova.v * G().MIS_PACE, (nova.a || 0) / 4096, t);
        for (let i = 0; i < T.ring; i++) {
          const k = i * 64 / T.ring, rx = G().RING_X[k], ry = G().RING_Y[k], rl = Math.hypot(rx, ry) || 1;
          const [sx, sy] = G().toScreen(rx / rl * d, ry / rl * d);
          out.push({ y: my + sy, draw: ctx => G().drawDirShot(ctx, nova, G().fileDir(rx, ry, ndirs), misFrame(nova, t), Math.round(mx + sx), Math.round(my + sy), nova.t) });
        }
      });
    }
  }
  /* what a spell's hits put on the monster (its hit missile's ProgOverlay: Inferno's flash of fire, the lightning
     spells' shock, Frost Nova's ice), from each hit for its frames */
  function hitFx(x, ctx, mx, my) {
    const o = x.cast && x.cast.hov, f = S.frame;
    if (!o) return;
    nearM(x).forEach(m => {
      if (!(m.dmg > 0) || m.words.includes("miss")) return;
      const k = Math.floor((f - m.f) * o.rate / 16);
      if (k >= 0 && k < Math.max(1, o.n)) G().drawFx(ctx, o, k, mx + o.dx, my + o.dy, o.trans, [mx, my]);
    });
  }
  /* Lightning and Chain Lightning as the client draws them (their do function 8: PD2 puts its own in the game's
     place, which at a bolt's default odds runs the game's; traced 2026-11-26): the bolt flies at its Vel for its Range
     (pierces on: the hit lands when it reaches the monster), leaving its piece (the strike, CltSubMissile1) where it is
     each frame it enters a new sub-tile (at Vel 30 every frame), each piece living its own Range frames, drawn the way
     the bolt flies and lifted by a random height within its CltParam2 (Z Range 16: -8 to +7 pixels, the bolt's own
     draws: the lane's here), which makes the bolt jagged; Chain Lightning's bolt shows its own picture too. On a lone
     monster the chain has no one to jump to. Until 2026-11-26 the fight left a piece every CltParam1 (3) frames: that
     is the piece's number of sub-loops */
  function trailOf(x) {
    const c = x.cast, v = c.mis.v * G().MIS_PACE;
    const [wx, wy] = G().toWorld(x.place.mon[0] - x.place.me[0], x.place.mon[1] - x.place.me[1]), len = Math.hypot(wx, wy) || 1;
    const dir = [wx / len, wy / len], at = [];
    let cell = [0, 0];
    for (let t = 1; t <= c.mis.r; t++) {
      const cc = [Math.floor(0.5 + dir[0] * v * t), Math.floor(0.5 + dir[1] * v * t)];
      if (cc[0] !== cell[0] || cc[1] !== cell[1]) { cell = cc; at.push(t); }
    }
    return { dir, v, at, z: {} };
  }
  function trailFx(x, ctx, ax, ay) {
    const I = IX(), c = x.cast, T = c.trail, piece = I.mis[T.piece], f = S.frame, P = x.trail;
    if (!c.mis || !piece || !P) return;
    const sp = G().iasSprite(piece.c), dirs = sp && sp.geo ? sp.geo.dirs || 1 : 1, dk = G().fileDir(P.dir[0], P.dir[1], dirs);
    const where = t => G().toScreen(P.dir[0] * P.v * t, P.dir[1] * P.v * t), zr = piece.zr || 0;
    nearM(x).forEach(m => {
      const r0 = m.f - x.flight, u = f - r0;
      if (u < 0 || u >= c.mis.r + piece.r) return;
      // each cast's pieces at their own random heights
      const z = P.z[r0] || (P.z[r0] = (() => { const rnd = api.mulberry32(6007 + r0 * 29 + S.k * 89 + x.i); return P.at.map(() => zr > 0 ? Math.floor(rnd() * zr) - Math.trunc(zr / 2) : 0); })());
      P.at.forEach((t0, j) => {   // the pieces left so far, each for its Range
        const age = u - t0;
        if (age < 0 || age >= piece.r) return;
        const [sx, sy] = where(t0);
        G().drawDirShot(ctx, piece, dk, misFrame(piece, age), ax + sx, ay + sy - z[j], piece.t, [ax + sx, ay + sy]);
      });
      if (u < c.mis.r && c.mis.c && !/null$/.test(c.mis.c)) {
        const [sx, sy] = where(u);
        G().drawShot(ctx, c.mis, Math.floor(u * c.mis.s / 16) % Math.max(1, c.mis.n || 1), ax + sx, ay + sy, 0, c.mis.t);
      }
    });
  }
  /* Ice Barrage as the game sends it (its client start function 17, PD2's server do 8, the game's fan): calc1 lances
     side by side, the middle one at the point cast at (the monster), each side one aimed a sub-tile beside it, the next
     two sub-tiles, ... (the page's rule: up close the angle widens, but the lances pass a monster cast on a step apart),
     at their Vel for their Range; a lance hits the frame it enters the monster's footprint and bursts there. As many of
     them burst on it as the fight rolled for the cast (the first to reach it); the others fly on past */
  function fanSplit(x, ev, f) {
    const c = x.cast, m = c.mis, part = (ev.parts || []).find(r => r.x && (r.x.k === "lance" || r.x.k === "bolt" || r.x.k === "hit"));
    const total = ev.loss - overOf(ev.parts);
    if (!part || !m) return [{ f, dmg: total }];
    const N = Math.max(1, part.x.of || 1), size = Math.max(1, Math.min(3, +x.l.T.size || 2)), v = m.v * G().MIS_PACE;
    const mon = [x.apart + 0.5, 0.5], cell = [Math.floor(mon[0]), Math.floor(mon[1])];
    const inFoot = (cx, cy) => { const dx = Math.abs(cx - cell[0]), dy = Math.abs(cy - cell[1]); return size === 1 ? dx + dy === 0 : size === 2 ? dx + dy <= 1 : Math.max(dx, dy) <= 1; };
    // a missile of Size 2 (Holy Bolt's) tests its sub-tile and the four beside it (the traced collision rule)
    const meets = (cx, cy) => (m.z >= 2 ? [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] : [[0, 0]]).some(([a, b]) => inFoot(cx + a, cy + b));
    const lances = [];
    for (let k = 0; k < N; k++) {
      const off = k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2);
      const aim = [mon[0] - 0.5, off], len = Math.hypot(aim[0], aim[1]) || 1, dir = [aim[0] / len, aim[1] / len];
      let last = [0, 0], hit = -1;
      for (let t = 1; t <= m.r; t++) {
        const px = 0.5 + dir[0] * v * t, py = 0.5 + dir[1] * v * t, cc = [Math.floor(px), Math.floor(py)];
        if (cc[0] !== last[0] || cc[1] !== last[1]) { last = cc; if (meets(cc[0], cc[1])) { hit = t; break; } }
      }
      // (every one that reaches the monster bursts there: the client's own collision; the fight's hits are the first)
      lances.push({ dir, hit, burst: hit >= 0 });
    }
    const order = lances.filter(q => q.hit >= 0).sort((a, b) => a.hit - b.hit);
    x.fan[f] = lances;
    const at = order.slice(0, part.d.length).map(q => f + q.hit), rest = total - part.d.reduce((a, v2) => a + v2, 0);
    if (!at.length) return [{ f, dmg: total }];
    return part.d.map((v2, k) => ({ f: at[Math.min(k, at.length - 1)], dmg: v2 + (k === 0 ? rest : 0) }));
  }
  function fanFx(x, ctx, ax, ay, mx, my) {
    const I = IX(), m = x.cast.mis, f = S.frame, sp = G().iasSprite(m.c), n = sp && sp.geo ? sp.geo.dirs || 1 : 1;
    const end = x.F.killF >= 0 ? x.F.killF : Infinity;
    // Bone Spear's trail (its client do 18): a piece each frame the spear enters a new sub-tile, the spear's way
    const T = x.cast.trail, piece = T ? I.mis[T.piece] : null, psp = piece ? G().iasSprite(piece.c) : null, pdirs = psp && psp.geo ? psp.geo.dirs || 1 : 1;
    nearKeys(x.fan).forEach(k => {
      const r0 = +k, u = f - r0;
      if (u < 0) return;
      x.fan[k].forEach(q => {
        if (piece) {
          const v = m.v * G().MIS_PACE;
          let cell = [0, 0];
          for (let t = 1; t <= Math.min(u, m.r - 1); t++) {
            const cc = [Math.floor(0.5 + q.dir[0] * v * t), Math.floor(0.5 + q.dir[1] * v * t)];
            if (cc[0] === cell[0] && cc[1] === cell[1]) continue;
            cell = cc;
            const age = u - t;
            if (age >= piece.r) continue;
            const [sx, sy] = G().toScreen(q.dir[0] * v * t, q.dir[1] * v * t);
            G().drawDirShot(ctx, piece, G().fileDir(q.dir[0], q.dir[1], pdirs), misFrame(piece, age), ax + sx, ay + sy, piece.t);
          }
        }
        // (none bursts on a dead monster; a missile without CollideKill, Holy Bolt's, bursts there and flies on)
        const burst = q.burst && r0 + q.hit <= end, stop = burst && m.ck ? q.hit : m.r;
        if (u < stop) {
          const d = m.v * G().MIS_PACE * u, [sx, sy] = G().toScreen(q.dir[0] * d, q.dir[1] * d);
          G().drawDirShot(ctx, m, G().fileDir(q.dir[0], q.dir[1], n), Math.floor(u * m.s / 16) % Math.max(1, m.n || 1), ax + sx, ay + sy, m.t);
        }
        if (burst && u >= q.hit) {
          const out = [];
          landFx(out, m.name, u - q.hit, mx, my, r0 * 13 + q.hit * 3 + x.i);
          out.sort((p, q2) => p.y - q2.y).forEach(g => g.draw(ctx));
        }
      });
    });
  }
  function walkFx(x, ctx, ax, ay) {
    const c = x.cast, m = c.mis, f = S.frame, sp = G().iasSprite(m.c), n = sp && sp.geo ? sp.geo.dirs || 1 : 1;
    const end = x.F.killF >= 0 ? x.F.killF : Infinity;
    nearKeys(x.walk).forEach(k => {
      const r0 = +k;
      x.walk[k].forEach(b => {
        // a bolt ends where it hits the monster; once the monster is dead it wanders on for its Range
        const u = f - r0, stop = b.hit >= 0 && r0 + b.hit <= end && m.ck ? b.hit : b.path.length;
        if (u < 1 || u > stop) return;
        const [wx, wy] = b.path[u - 1], [px0, py0] = u > 1 ? b.path[u - 2] : [0.5, 0.5];
        const [sx, sy] = G().toScreen(wx - 0.5, wy - 0.5);
        G().drawDirShot(ctx, m, G().fileDir(wx - px0 || 1, wy - py0, n), misFrame(m, u), ax + sx, ay + sy, m.t);
      });
    });
  }
  // ================================================================== where a missile lands (2026-11-26)
  /* What the client makes where a missile hits (traced 2026-11-26): its client hit function's own, then (the hit
     functions return 1) its explosion missile there. Hit 1 (Fire Ball's, Combustion's, Hydra's, Fire Arrow's, Exploding
     Arrow's): fireexplosion2 on every sub-tile within cHitPar1, at odds of 1 in cHitPar2 when that is set (Fire Ball:
     every sub-tile within 4); hit 14 (Glacial Spike's, Ice Barrage's, Freezing Arrow's): its first hit missile there and
     3 or 4 of its second on the sub-tiles beside it, facing out (one of 3 patterns, turned by one of 8); hit 2 (Plague
     Javelin's): two rings of its cloud drifting out from a ring of 16 points 2 sub-tiles off, every cHitPar2-th at its
     Param1, every cHitPar1-th of the rest at its Param2; hit 12 (Immolation Arrow's): a disc of fire (its three kinds at
     even odds) within the skill's calc1, burning SHitCalc1 frames; another's hit missiles there. Each piece for its
     Range; the pieces' rolls from the lane's own draws */
  const RING16 = [[0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [2, -1], [2, -2], [1, -2], [0, -2], [-1, -2], [-2, -2], [-2, -1], [-2, 0], [-2, 1], [-2, 2], [-1, 2]];
  const EJECTA = [[0, 1, 4, 5], [0, 2, 4, 6], [0, 3, 5]], NEAR8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  // a meteor's hit (the game's hit 18, traced 2026-11-27): its explosions' 5 spots and its fires' 18, in sub-tiles
  const METEOR5 = [[0, 0], [4, 0], [0, 4], [-4, 0], [0, -4]];
  const METEOR18 = [[2, -2], [-2, -2], [0, 2], [0, 5], [-3, 3], [0, 3], [3, 3], [-1, 2], [1, 1], [-1, -1], [2, -1], [-4, -2], [-3, -2],
    [-1, -3], [0, -4], [1, -3], [3, -3], [4, -2]];
  function landFx(out, name, age, px, py, seed, disc) {
    const I = IX(), m = I.mis[name];
    if (!m || age < 0) return;
    const at = (e, a, dx, dy, d) => {   // a piece dx, dy sub-tiles off the spot, a frames old
      if (!e || a < 0 || a >= Math.max(1, e.r)) return;
      const [sx, sy] = G().toScreen(dx, dy);
      putShot(out, py + sy + 0.5, e, d || 0, misFrame(e, a), px + sx, py + sy);
    };
    const rnd = api.mulberry32(9029 + seed * 61), h = (m.h || []).map(k => I.mis[k]);
    if (m.hf === 1 && h[0] !== undefined) {
      const R = (m.hp || [])[0] || 0, odds = (m.hp || [])[1] || 0, e = I.mis.fireexplosion2;
      for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) {
        if (i * i + j * j > R * R) continue;
        if (odds > 0 && Math.floor(rnd() * odds) !== 0) continue;
        at(e, age, i, j);
      }
    } else if (m.hf === 14) {
      at(h[0], age, 0, 0);
      const e = h[1], sp = e ? G().iasSprite(e.c) : null, n = sp && sp.geo ? sp.geo.dirs || 1 : 1;
      const pat = EJECTA[Math.floor(rnd() * 3)], rot = Math.floor(rnd() * 8);
      if (e) pat.forEach(k => { const d = (k + rot) & 7, o = NEAR8[d]; at(e, age, o[0], o[1], G().fileDir(o[0], o[1], n)); });
    } else if (m.hf === 2) {
      const e = h[0], sp = e ? G().iasSprite(e.c) : null, n = sp && sp.geo ? sp.geo.dirs || 1 : 1, hp = m.hp || [1, 2], pp = e && e.pp ? e.pp : [2, 4];
      const ring = (k0, step, par) => { for (let k = k0; k < 16; k += Math.max(1, step)) { const [ox, oy] = RING16[k], L = Math.hypot(ox, oy), d = par * 3 / 128 * age; at(e, age, ox / L * d, oy / L * d, G().fileDir(ox, oy, n));
        if (e && age < Math.max(1, e.r)) puffsOf(out, e, age, t => [ox / L * par * 3 / 128 * t, oy / L * par * 3 / 128 * t], seed * 31 + k + k0 * 17, w => { const [qx, qy] = G().toScreen(w[0], w[1]); return [px + qx, py + qy]; }); } };
      if (e) { ring(0, hp[1], pp[0]); if (hp[0] > 0) ring(1, hp[0], pp[1]); }
    } else if (m.hf === 12) {
      const R = disc || 3, life = m.hl || 50;   // (every sub-tile within R; each flame's life SHitCalc1 + rand(25) - 12)
      for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) {
        if (i * i + j * j > R * R) continue;
        const e = h[Math.floor(rnd() * h.length)], lf = life + Math.floor(rnd() * 25) - 12;
        if (e && age < lf) { const [sx, sy] = G().toScreen(i, j); putShot(out, py + sy, e, 0, misFrame(e, age), px + sx, py + sy); }
      }
    } else if (m.hf === 18) {   /* a meteor's (traced 2026-11-27, T1; no rand): CltHitSubMissile1 cHitPar1 times on the
       spot and 4 sub-tiles each way (each its own Range); CltHitSubMissile2 a light only; then cHitPar2 of 3 and
       cHitPar3 of 4 along one table of 18 spots, all living the skill's Param3 (`fl`) */
      const hp = m.hp || [5, 3, 15], life = m.fl || 40;
      for (let i = 0; i < hp[0]; i++) { const o = METEOR5[i % 5]; at(h[0], age, o[0], o[1]); }
      at(h[1], age, 0, 0);   // (its light on the spot: whitelightmissile has no picture)
      const fire = (e, k) => { if (e && age < life) { const o = METEOR18[k % 18], [sx, sy] = G().toScreen(o[0], o[1]); putShot(out, py + sy, e, 0, misFrame(e, age), px + sx, py + sy); } };
      let k = 0;
      for (let i = 0; i < (hp[1] || 0); i++) fire(h[2], k++);
      for (let i = 0; i < (hp[2] || 0); i++) fire(h[3], k++);
    } else if (m.hf !== 4 && m.hf !== 25 && m.hf !== 16) h.forEach(e => at(e, age, 0, 0));   // (4: a ring; 25 / 16: at others)
    at(I.mis[m.x], age, 0, 0);
  }
  /* the shots' own trails (traced 2026-11-26): Immolation Arrow's fire (its do 6, as Fire Wall's makers: a flame of its
     CltSubMissile1-3 each new sub-tile, every one living CltSubMissile1's Range), Poison and Plague Javelin's clouds (their
     do 3: a cloud, CltSubMissile1, each new sub-tile, living its Range); a cloud's own puffs (its do 4) aren't drawn */
  function shotTrail(x, out) {
    const I = IX(), m = I.mis[x.shot.name], f = S.frame, [ax, ay] = x.place.me, [mx, my] = x.place.mon;
    if (!m || !m.do || !(m.cs || []).length) return;
    const [wx, wy] = G().toWorld(mx - ax, my - ay), L = Math.hypot(wx, wy) || 1, dir = [wx / L, wy / L], v = m.v * G().MIS_PACE;
    const life = (I.mis[m.cs[0]] || {}).r || 40;
    nearM(x).forEach(q => {
      if (q.more) return;
      const r0 = q.f - x.flight, u = f - r0;
      if (u < 0 || u > x.flight + life) return;
      const rnd = api.mulberry32(4447 + r0 * 19 + x.i), lr = api.mulberry32(6143 + r0 * 23 + x.i);
      let cell = [0, 0];
      for (let t = 1; t <= Math.min(u, x.flight); t++) {
        const p = [dir[0] * v * t, dir[1] * v * t], cc = [Math.floor(p[0] + 0.5), Math.floor(p[1] + 0.5)];
        const k = m.cs.length === 3 ? [1, 2, 0][Math.floor(rnd() * 3)] : m.cs.length === 2 ? Math.floor(rnd() * 2) : 0;
        if (cc[0] === cell[0] && cc[1] === cell[1]) continue;
        cell = cc;
        const e = I.mis[m.cs[k]], age = u - t, lit = makerLit(m, lr());
        if (!e || age >= life) continue;   // (each lives CltSubMissile1's Range, whichever it is)
        const sp = G().iasSprite(e.c), n = sp && sp.geo ? sp.geo.dirs || 1 : 1, [sx, sy] = G().toScreen(p[0], p[1]);
        putShot(out, ay + sy, e, G().fileDir(dir[0], dir[1], n), misFrame(e, age), ax + sx, ay + sy, lit);
        puffsOf(out, e, age, () => p, 7019 + r0 * 13 + t * 101 + x.i, w => { const [qx, qy] = G().toScreen(w[0], w[1]); return [ax + qx, ay + qy]; });
      }
    });
  }
  // the shots' landings on the monster (each shot that reaches it: the client's own collision, a missed one too), and
  // a hit overlay (Lightning Bolt's javelin)
  function shotLand(x, out) {
    const I = IX(), m = I.mis[x.shot.name], f = S.frame, [mx, my] = x.place.mon, disc = x.atk && x.atk.disc;
    if (!m) return;
    const po = m.po && I.ov ? I.ov[m.po] : null;
    nearM(x).forEach(q => {
      if (q.more) return;
      const age = f - q.f;
      if (age < 0 || age > 120) return;
      landFx(out, x.shot.name, age, mx, my, q.f * 5 + x.i, disc);
      // the server's own fire where it lands (its hit 9, sent to the client: Immolation Arrow's one on the spot)
      const sd = m.sd, se = sd ? I.mis[sd[0]] : null;
      if (se && age < (sd[2] || se.r || 50)) for (let i = -sd[1]; i <= sd[1]; i++) for (let j = -sd[1]; j <= sd[1]; j++) {
        if (i * i + j * j > sd[1] * sd[1]) continue;
        const [sx, sy] = G().toScreen(i, j);
        putShot(out, my + sy, se, 0, misFrame(se, age), mx + sx, my + sy);
      }
      if (po) { const k = Math.floor(age * po.rate / 16); if (k < Math.max(1, po.n)) out.push({ y: my + 1, draw: ctx => G().drawFx(ctx, po, k, mx + po.dx, my + po.dy, po.trans, [mx, my]) }); }
    });
  }
  /* an attack's own looks at each hit (traced 2026-11-26): Charged Strike's bolts from the monster, away from the
     attacker, on charged-bolt paths (its client do 19: the page's count, calc1); Power Strike's ring of 64 novas from
     the monster and Lightning Strike's bolt on it (client do 22: from the target at the next unit by id, a lone monster
     itself; Power Strike's missile goes off at once, its hit 4 the ring); Dragon Tail's explosion on it (do 7); Sacrifice's
     blood (do 34: cltcalc1 splashes); Poison Strike's 6 clouds out from it (PD2's do 102); Fire Claws' makers from the
     Druid to it, each leaving fire each new sub-tile (PD2's do 110: calc2 of them, at most 77 frames; its path's wander
     isn't traced: straight); the target's overlay (Concentrate's, Fire Claws', Dragon Flight's, Joust's, Tiger
     Strike's). The client makes them at each swing's hit frame, a missed one too */
  function strikeFx(x, ctx, out) {
    const I = IX(), A = x.atk, f = S.frame, [ax, ay] = x.place.me, [mx, my] = x.place.mon, M = monAt(x);
    const end = x.F.killF >= 0 ? x.F.killF : Infinity, lvl = Math.max(1, +x.l.b.s.lvl || 1);
    const ov = A.tov && I.ov ? I.ov[A.tov] : null;
    /* Sacrifice's kill (PD2's, traced 2026-11-27, T1): the dying monster's state 223 flashes its start look, and its
       corpse bursts (the client plays the missile's file once) the death animation's length - 6 frames after the kill,
       3 to 30 (under 6: 30, the game's unsigned sum) */
    if (A.kill && x.F.killF >= 0) {
      const k0 = x.F.killF, Mo = G().monster(x.mon.set), dt = Mo && Mo.modes.DT ? Math.ceil(Mo.modes.DT.f * 256 / Math.max(1, Mo.modes.DT.rate)) : 20;
      const delay = dt < 6 ? 30 : Math.max(3, Math.min(30, dt - 6)), kov = A.kill.ov && I.ov ? I.ov[A.kill.ov] : null, e = I.mis[A.kill.boom];
      if (kov) { const k = Math.floor((f - k0) * kov.rate / 16); if (f >= k0 && k < Math.max(1, kov.n)) out.push({ y: my + 1, draw: c2 => G().drawFx(c2, kov, k, mx + kov.dx, my + kov.dy, kov.trans, [mx, my]) }); }
      if (e && f >= k0 + delay && f - k0 - delay < Math.max(1, e.n || e.r)) putShot(out, my + 1, e, 0, Math.min(f - k0 - delay, Math.max(1, e.n) - 1), mx, my);
    }
    // Vengeance: its state's start look on the monster at each hit that lands (the state goes on again with each one:
    // PD2's own do function isn't traced, so how long it stays on between hits is the guess)
    const th = A.thit && I.ov ? I.ov[A.thit] : null;
    nearM(x).forEach(q => {
      if (q.more || q.f > end) return;
      const u = f - q.f, seed = q.f * 17 + x.i;
      if (u < 0 || u > 100) return;
      if (ov && !A.leap) { const k = Math.floor(u * ov.rate / 16); if (k < Math.max(1, ov.n)) out.push({ y: my + 1, draw: c2 => G().drawFx(c2, ov, k, mx + ov.dx, my + ov.dy, ov.trans, [mx, my]) }); }
      if (th && !(q.ev && q.ev.miss)) { const k = Math.floor(u * th.rate / 16); if (k < Math.max(1, th.n)) out.push({ y: my + 1, draw: c2 => G().drawFx(c2, th, k, mx + th.dx, my + th.dy, th.trans, [mx, my]) }); }
      /* Exploding Arrow's delayed blasts (PD2's server hit 63, traced 2026-11-27, trace T8): on a hit, calc2 of
         them, each at a random spot of the triangle from the monster to calc3 sub-tiles past it, Param4 wide, two a band
         from the monster out, calc4 + 2 (i + 1) frames after the hit: Exploding Arrow's srvmissilea and srvmissileb, which
         PD2 sends to every player (the band's spread within it: the lane's own draws) */
      if (A.blasts && !(q.ev && q.ev.miss)) {
        const B = A.blasts, n = B.n[Math.min(60, lvl) - 1] || 0, rnd = api.mulberry32(seed * 5 + 4409), bands = Math.max(1, n / 2);
        const [wx, wy] = G().toWorld(mx - ax, my - ay), L = Math.hypot(wx, wy) || 1, U = [wx / L, wy / L], P = [-U[1], U[0]];
        for (let i = 0; i < n; i++) {
          const a = Math.min(1, ((i >> 1) + rnd()) / bands), s = (rnd() * 2 - 1) * a, age = u - B.delay - 2 * (i + 1);
          const [sx, sy] = G().toScreen(U[0] * B.len * a + P[0] * B.w / 2 * s, U[1] * B.len * a + P[1] * B.w / 2 * s);
          B.mis.forEach(k => { const e = I.mis[k]; if (e && age >= 0 && age < Math.max(1, e.r)) putShot(out, my + sy + 0.5, e, 0, misFrame(e, age), mx + sx, my + sy); });
        }
      }
      if (A.cbolts) {
        const m = I.mis[A.cbolts], part = ((q.ev && q.ev.parts) || []).find(r => r.x && r.x.k === "bolt"), N = Math.max(1, (part && part.x.of) || 3);
        if (m) {
          const sp = G().iasSprite(m.c), n = sp && sp.geo ? sp.geo.dirs || 1 : 1;
          const bolts = x.cb && x.cb[q.f] || ((x.cb || (x.cb = {}))[q.f] = walkPaths(x, M, [2 * M[0] - 0.5, 2 * M[1] - 0.5], m, N, lvl, api.mulberry32(seed)));
          bolts.forEach(b => {
            if (u < 1 || u > b.path.length) return;
            const w = b.path[u - 1], w0 = u > 1 ? b.path[u - 2] : M, [qx, qy] = scr(x, w);
            out.push({ y: qy, draw: c2 => G().drawDirShot(c2, m, G().fileDir(w[0] - w0[0] || 1, w[1] - w0[1], n), misFrame(m, u), Math.round(qx), Math.round(qy), m.t) });
          });
        }
      }
      if (A.strike) {
        const m = I.mis[A.strike], ring = m && m.hf === 4 ? I.mis[(m.h || [])[0]] : null;
        if (ring && u < ring.r) {
          const sp = G().iasSprite(ring.c), n = sp && sp.geo ? sp.geo.dirs || 1 : 1, d = ring.v * G().MIS_PACE * u;
          for (let k = 0; k < 64; k++) {
            const rx = G().RING_X[k], ry = G().RING_Y[k], rl = Math.hypot(rx, ry) || 1, [sx, sy] = G().toScreen(rx / rl * d, ry / rl * d);
            out.push({ y: my + sy, draw: c2 => G().drawDirShot(c2, ring, G().fileDir(rx, ry, n), misFrame(ring, u), Math.round(mx + sx), Math.round(my + sy), ring.t) });
          }
          // the ring hits the monster it starts on unless it is small (the page's size rule), and its client hit 10
          // puts the novas' ProgOverlay on it (traced 2026-11-27, T2: hit functions 9, 10 and 16 do)
          const po = ring.po && I.ov && ring.hf === 10 && (+x.l.T.size || 2) > 1 ? I.ov[ring.po] : null;
          if (po && !(q.ev && q.ev.miss)) { const k = Math.floor(u * po.rate / 16); if (k < Math.max(1, po.n)) out.push({ y: my + 1, draw: c2 => G().drawFx(c2, po, k, mx + po.dx, my + po.dy, po.trans, [mx, my]) }); }
        } else if (m && !ring) {
          // (the bolt itself, made on the monster and aimed at it: its light there the frame it hits, then fading)
          if (u === 0 && m.li) out.push({ y: my, draw: () => G().light(mx, my, G().misLight(m.li)) });
          const pc = I.mis[(m.cs || [])[0]] || I.mis.lightninghit, sp = pc ? G().iasSprite(pc.c) : null, n = sp && sp.geo ? sp.geo.dirs || 1 : 1;
          if (pc && u < pc.r) out.push({ y: my + 0.5, draw: c2 => G().drawDirShot(c2, pc, G().fileDir(mx - ax, my - ay, n), misFrame(pc, u), mx, my, pc.t) });
          const po = m.po && I.ov ? I.ov[m.po] : null;
          if (po) { const k = Math.floor(u * po.rate / 16); if (k < Math.max(1, po.n)) out.push({ y: my + 1, draw: c2 => G().drawFx(c2, po, k, mx + po.dx, my + po.dy, po.trans, [mx, my]) }); }
        }
      }
      if (A.boom) { const e = I.mis[A.boom]; if (e && u < e.r) putShot(out, my + 0.5, e, 0, misFrame(e, u), mx, my); }
      if (A.blood) {
        const e = I.mis[A.blood[0]], rnd = api.mulberry32(seed), sp = e ? G().iasSprite(e.c) : null, n = sp && sp.geo ? sp.geo.dirs || 1 : 1;
        if (e) for (let k = 0; k < A.blood[1]; k++) {
          const o = [rnd() * 2 - 1, rnd() * 2 - 1], d = Math.floor(rnd() * 8);
          if (u < Math.max(1, e.n || 9)) { const [sx, sy] = G().toScreen(o[0], o[1]); putShot(out, my + sy, e, d % n, Math.min(u, (e.n || 9) - 1), mx + sx, my + sy - 30, [mx + sx, my + sy]); }
        }
      }
      if (A.clouds) {
        const e = I.mis[A.clouds[0]], N = A.clouds[1], sp = e ? G().iasSprite(e.c) : null, n = sp && sp.geo ? sp.geo.dirs || 1 : 1;
        if (e && u < e.r) for (let k = 0; k < 64; k += Math.floor(64 / N)) {
          const rx = G().RING_X[k], ry = G().RING_Y[k], rl = Math.hypot(rx, ry) || 1, d = e.v * G().MIS_PACE * u, [sx, sy] = G().toScreen(rx / rl * d, ry / rl * d);
          putShot(out, my + sy, e, G().fileDir(rx, ry, n), misFrame(e, u), mx + sx, my + sy);
          puffsOf(out, e, u, t => [rx / rl * e.v * G().MIS_PACE * t, ry / rl * e.v * G().MIS_PACE * t], seed * 7 + k, w => { const [qx, qy] = G().toScreen(w[0], w[1]); return [mx + qx, my + qy]; });
        }
      }
      if (A.claws) {
        /* calc2 makers (par1 + (base points / 5) x par2), each walking its own path (trace T11, the audit's
           GA-14: PD2's path type 10 is the charged bolts' walk, legs of 2 sub-tiles each the 8-way direction to the
           monster or a neighbour of it, and PD2 gives each maker a seed of its own), min(life, 77) / 2 legs, then
           standing for the rest of its life; a flame each new sub-tile, as Fire Wall's makers */
        const C = A.claws, m = I.mis[C.m], hard = +x.l.b.s.hard > 0 ? +x.l.b.s.hard : Math.min(20, lvl), N = Math.max(0, C.par[0] + Math.floor(hard / 5) * C.par[1]);
        const [wx, wy] = G().toWorld(mx - ax, my - ay), life = Math.min(77, m ? m.r : 25), flame = m ? (I.mis[(m.cs || [])[0]] || {}).r || 12 : 12;
        const legs = life >> 1, main = dir8(wx, wy), v = m ? m.v * G().MIS_PACE : 1;
        if (m && N > 0) for (let k = 0; k < N; k++) {
          const rnd = api.mulberry32(seed + k * 101), pick = api.mulberry32(seed * 5 + k * 37), lr = api.mulberry32(seed * 3 + 6151 + k);
          let px = 0, py = 0, tx = 0, ty = 0, n = 0, cell = [0, 0];
          for (let t = 1; t <= Math.min(u, life); t++) {
            let left = v;
            while (left > 1e-9) {
              if (Math.abs(tx - px) < 1e-9 && Math.abs(ty - py) < 1e-9) {
                if (n >= legs) break;
                const d = DIRS[(main + SEQ[Math.floor(rnd() * 32)] + 8) % 8];
                tx = px + 2 * d[0]; ty = py + 2 * d[1]; n++;
              }
              const seg = Math.hypot(tx - px, ty - py);
              if (seg <= left) { px = tx; py = ty; left -= seg; } else { px += (tx - px) * left / seg; py += (ty - py) * left / seg; left = 0; }
            }
            const cc = [Math.floor(px + 0.5), Math.floor(py + 0.5)], kk = [1, 2, 0][Math.floor(pick() * 3)], lit = makerLit(m, lr());
            if (cc[0] === cell[0] && cc[1] === cell[1]) continue;
            cell = cc;
            const e = I.mis[(m.cs || [])[kk]] || I.mis[(m.cs || [])[0]], age = u - t;
            if (!e || age >= flame) continue;
            const [sx, sy] = G().toScreen(px, py);
            putShot(out, ay + sy, e, 0, misFrame(e, age), ax + sx, ay + sy, lit);
          }
          // (the maker itself where it runs or stands, as Fire Wall's)
          if (u < life) { const [sx, sy] = G().toScreen(px, py); putShot(out, ay + sy, m, 0, misFrame(m, u), ax + sx, ay + sy); }
        }
      }
    });
  }

  // ================================================================== the moves (2026-11-26)
  // her spot at frame f: running in (Charge), whirling back and forth through the monster (Whirlwind, Blade Dance)
  function mePos(x, f) {
    f = f === undefined ? S.frame : f;
    const [ax, ay] = x.place.me, [mx, my] = x.place.mon;
    if (x.runIn && f < x.runIn.n) {
      const k = Math.max(0, f) / x.runIn.n, [fx, fy] = x.runIn.from;
      return [fx + (ax - fx) * k, fy + (ay - fy) * k];
    }
    if (x.ww) {
      const end = x.F.killF >= 0 ? x.F.killF + 25 : Infinity, t = Math.min(f, end);
      const [wx, wy] = G().toWorld(mx - ax, my - ay), d = Math.hypot(wx, wy) || 1, span = d + x.ww.span;
      const p = (x.ww.v * t) % (2 * span), along = p < span ? p : 2 * span - p;   // out through it and back
      return [ax + (mx - ax) * along / d, ay + (my - ay) * along / d];
    }
    return [ax, ay];
  }
  /* Dragon Flight's and Joust's leap: the attacker lands by the monster as each attack starts, its look (the skill's
     tgtoverlay, the game's own function draws it on the caster) on her there */
  function leapFx(x, ctx, ax, ay) {
    const ov = IX().ov[x.atk.tov], f = S.frame, end = x.F.killF >= 0 ? x.F.killF : Infinity, h0 = x.F.H ? x.F.H[0] : 0;
    if (!ov) return;
    nearM(x).forEach(q => {
      const s0 = q.f - h0 - x.flight;
      if (q.more || s0 > end) return;
      const k = Math.floor((f - s0) * ov.rate / 16);
      if (k >= 0 && k < Math.max(1, ov.n)) G().drawFx(ctx, ov, k, ax + ov.dx, ay + ov.dy, ov.trans, [ax, ay]);
    });
  }

  // ================================================================== the charge-ups and finishers (2026-11-26)
  /* A charge-up skill's charges as the fight plays them (the page's model, traced 2026-11-25): every landed hit casts
     the next charge, 1, 2, 3, then 1 again (the 4th clears the three first), its release made at once (PD2's rework:
     the charge's stage at the hit); a miss casts nothing; a finisher (Dragon Claw after each of its two hits, landed or
     not; Dragon Tail, Dragon Flight and Dragon Talon on the kick that lands) releases every charge held, then they are
     gone. [{f, stage (1-3), held after}] and the charges held from each frame [{f, n}] */
  function chargeLog(x) {
    if (x.chgLog) return x.chgLog;
    const F = x.F, E = x.l.E, fin = E.fof && E.fof.fin, kind = fin ? fin.kind || "dc" : "", HF = F.HF || [0];
    const rel = [], held = [{ f: 0, n: 0 }], kicks = [];
    let n = 0;
    F.steps.forEach((st, k) => {
      if (st.fin) {
        if (!st.done) return;
        const hs = kind === "dc" ? HF : [HF[0]];
        hs.forEach(h => { for (let g = 1; g <= n; g++) rel.push({ f: st.t0 + h, stage: g, fin: true }); });
        kicks.push(st.t0 + HF[0]);
        n = 0;
        held.push({ f: st.t0 + HF[HF.length - 1] + 1, n });
        return;
      }
      if (st.miss) return;
      const f = st.t0 + (F.H ? F.H[0] : 0);
      n = st.s + 1;
      rel.push({ f, stage: n, hit: true });
      held.push({ f, n });
    });
    return (x.chgLog = { rel, held, kicks });
  }
  // the orbs circling the Assassin while she holds charges (Overlay.txt's <state>_1-3: the client picks them by the
  // count; how isn't traced), the 2nd and 3rd charge's flash, Cobra's and Tiger's own overlay at each charge (prgoverlay)
  function chargeOrbFx(x, ctx, ax, ay) {
    const I = IX(), C = x.chg, f = S.frame, L = chargeLog(x), end = x.F.killF >= 0 ? x.F.killF : Infinity;
    const h = L.held.filter(q => q.f <= f).pop(), n = h ? h.n : 0, ov = n ? I.ov[C.orbs[n - 1]] : null;
    if (ov && f <= end + 25) { const k = Math.floor(f * ov.rate / 16) % Math.max(1, ov.n); G().drawFx(ctx, ov, k, ax + ov.dx, ay + ov.dy, ov.trans, [ax, ay]); }
    L.rel.forEach(q => {
      if (!q.hit) return;
      const u = f - q.f, fl = I.ov[(C.flash || [])[q.stage - 1]] || I.ov[(C.prg || [])[q.stage - 1]];
      if (!fl || u < 0) return;
      const k = Math.floor(u * fl.rate / 16);
      if (k < Math.max(1, fl.n)) G().drawFx(ctx, fl, k, ax + fl.dx, ay + fl.dy, fl.trans, [ax, ay]);
    });
  }
  /* each release as the client draws it (traced 2026-11-26, trace C15): by the skill's client function for
     that stage: the game's 9 (Fists of Fire's explosion on the monster and 16 tries at its flames within 4 sub-tiles);
     PD2's 107 and the game's 10 (a ring from the monster: Fists of Fire's 64 fire novas, Claws of Thunder's 64 novas,
     Cobra Strike's 64 poison clouds, whose own picture is none: their puffs); the game's 11 (Claws of Thunder's charged
     bolts out of the monster, 64 / prgcalc3 of them, the first to cross it leaving its storm on it); PD2's 106 (a fan from
     the Assassin at the monster: Cobra Strike's 7 poison bolts; Fists of Fire's orb, which drops a meteor every 5
     frames as it flies on); PD2's 83 (a ring curving out from the monster: Blades of Ice's 11 chaos ice, Phoenix Strike's
     7 chain lightnings); the game's 14 (Phoenix Strike's meteor on the monster); 15 (its 24 chaos ice scattered); 81
     (Blades of Ice's wave from the Assassin through the monster, trailing waves sideways). The curving and scattering
     paths and the clouds' puffs aren't traced: drawn as spirals, random ways and one puff a cloud */
  function chargeFx(x, out) {
    const I = IX(), C = x.chg, f = S.frame, L = chargeLog(x), M = monAt(x), [mx, my] = x.place.mon;
    const end = x.F.killF >= 0 ? x.F.killF : Infinity;
    const put = (e, age, w, d) => { if (!e || age < 0 || age >= Math.max(1, e.r)) return; const [px, py] = scr(x, w); putShot(out, py, e, d, misFrame(e, age), px, py); };
    const dirsOf = e => { const sp = e ? G().iasSprite(e.c) : null; return sp && sp.geo ? sp.geo.dirs || 1 : 1; };
    if (x.finAtk) L.kicks.forEach(k => {   // the finisher's landed kick: its explosion, its overlay
      const u = f - k, A = x.finAtk, e = A.boom ? I.mis[A.boom] : null, ov = A.tov && I.ov ? I.ov[A.tov] : null;
      if (u < 0 || k > end) return;
      if (e && u < e.r) putShot(out, my + 0.5, e, 0, misFrame(e, u), mx, my);
      if (ov) { const n2 = Math.floor(u * ov.rate / 16); if (n2 < Math.max(1, ov.n)) out.push({ y: my + 1, draw: c2 => G().drawFx(c2, ov, n2, mx + ov.dx, my + ov.dy, ov.trans, [mx, my]) }); }
    });
    L.rel.forEach(q => {
      const u = f - q.f;
      if (u < 0 || u > 90 || q.f > end) return;
      const g = q.stage - 1, fn = C.fn[g], name = C.m[g], m = I.mis[name], seed = q.f * 31 + g * 7 + x.i;
      const N = C.n[g] || 0, P = C.pc[g] || 0;
      if (!m && fn !== 9) return;
      if (fn === 9) {   // the explosion and its flames
        put(m, u, M, 0);
        const fl = m ? I.mis[(m.cs || [])[0]] || I.mis.fistsoffirefirewall : null, rnd = api.mulberry32(seed);
        if (fl) for (let k = 0; k < 16; k++) { const o = [Math.floor(rnd() * 9) - 4, Math.floor(rnd() * 9) - 4]; if (o[0] * o[0] + o[1] * o[1] <= 16) put(fl, u, [M[0] + o[0], M[1] + o[1]], 0); }
      } else if (fn === 107 || fn === 10 || fn === 83) {   // a ring (83: curving out) from the monster
        const step = N > 1 ? Math.max(1, Math.round(64 / N)) : Math.max(1, P || 1), v = m.v * G().MIS_PACE, n = dirsOf(m), cloud = m.pf && m.c && /null$/.test(m.c);
        /* (83: snakes, trace T11, the audit's GA-16: each bolt heads for its ring point, picks a turn sense at
           even odds and a rate of 2-4 64ths of a circle; each point turns the heading by it and steps 2 sub-tiles along
           the 8-way direction nearest it; after point 0 and every 15 points the sense flips and the rate is drawn again;
           35 points for Blades of Ice's chaos ice, 45 for Phoenix Strike's chain lightning. It curls 169-338 degrees,
           then curls back) */
        const snake = k => {
          const key = seed + ":" + k, S0 = x.snk || (x.snk = {});
          if (S0[key]) return S0[key];
          const r3 = api.mulberry32(seed * 13 + k * 7 + 3), pts = [[M[0], M[1]]], n0 = x.l.E.attack.k === "boi" ? 35 : 45;
          let h = k, sg = r3() < 0.5 ? -1 : 1, rate = 2 + Math.floor(r3() * 3);
          for (let i = 0; i < n0; i++) {
            h = (h + sg * rate + 64) % 64;
            const d = DIRS[Math.round(h / 8) % 8], [px, py] = pts[pts.length - 1];
            pts.push([px + 2 * d[0], py + 2 * d[1]]);
            if (i === 0 || i % 15 === 0) { sg = -sg; rate = 2 + Math.floor(r3() * 3); }
          }
          if (Object.keys(S0).length > 400) x.snk = {};
          return ((x.snk || S0)[key] = pts);
        };
        const along = (pts, d) => { const i = Math.min(pts.length - 2, Math.floor(d / 2)), f2 = Math.min(1, d / 2 - i), a = pts[i], b = pts[i + 1]; return [a[0] + (b[0] - a[0]) * f2, a[1] + (b[1] - a[1]) * f2]; };
        const wAt = (k, t) => { if (fn === 83) return along(snake(k), v * t); const a0 = Math.atan2(G().RING_Y[k], G().RING_X[k]); return [M[0] + Math.cos(a0) * v * t, M[1] + Math.sin(a0) * v * t]; };
        // a bolt's trail (its do 8, traced 2026-11-27, T2: a piece, CltSubMissile1, each new sub-tile, from a random
        // frame of its picture, living its Range and holding its last frame: Blades of Ice's chill puffs, Phoenix
        // Strike's lightning)
        const tp = fn === 83 && (m.cs || [])[0] ? I.mis[m.cs[0]] : null;
        // (a trail piece made on the monster puts its own ProgOverlay on it when its client hit is one that does: Phoenix
        // Strike's lightning pieces, hit 10; once a release)
        const tpo = tp && tp.po && I.ov ? I.ov[tp.po] : null;   // (the ring starts on it: its first pieces are)
        if (tpo && u >= 1) { const k = Math.floor((u - 1) * tpo.rate / 16); if (k < Math.max(1, tpo.n)) out.push({ y: my + 1, draw: c2 => G().drawFx(c2, tpo, k, mx + tpo.dx, my + tpo.dy, tpo.trans, [mx, my]) }); }
        for (let k = 0; k < 64; k += step) {
          const w = wAt(k, u), w0 = fn === 83 && u > 0 ? wAt(k, u - 1) : M, a = Math.atan2(w[1] - w0[1], w[0] - w0[0]);
          // Cobra Strike's clouds (no picture of their own): their puffs (the game's do 4, traced 2026-11-27, T2)
          if (cloud) puffsOf(out, m, u, t => wAt(k, t), seed * 3 + k, ww => scr(x, ww));
          else put(m, u, w, G().fileDir(Math.cos(a), Math.sin(a), n));
          if (tp) {
            const r2 = api.mulberry32(seed * 11 + k), last = Math.max(1, tp.n || 1) - 1;
            let cell = null;
            for (let t = 1; t <= Math.min(u, m.r || 50); t++) {
              const p = wAt(k, t), cc = [Math.floor(p[0]), Math.floor(p[1])], sf = Math.floor(r2() * (last + 1)), age = u - t;
              if (cell && cc[0] === cell[0] && cc[1] === cell[1]) continue;
              cell = cc;
              if (age < Math.max(1, tp.r)) { const [qx, qy] = scr(x, p); putShot(out, qy, tp, G().fileDir(p[0] - M[0] || 1, p[1] - M[1], dirsOf(tp)), Math.min(sf + age, last), qx, qy); }
            }
          }
        }
      } else if (fn === 11) {   // charged bolts out of the monster; the storm of the first to cross it
        const n = dirsOf(m), cnt = Math.max(1, Math.round(64 / Math.max(1, P || 4))), rnd = api.mulberry32(seed);
        const bolts = (x.cotB || (x.cotB = {}))[q.f] || (x.cotB[q.f] = Array.from({ length: cnt }, (_, k) => walkPaths(x, M, [M[0] + Math.cos(k * 6.283 / cnt) * 9, M[1] + Math.sin(k * 6.283 / cnt) * 9], m, 1, 1, rnd)[0]));
        bolts.forEach(b => { if (u >= 1 && u <= b.path.length) { const w = b.path[u - 1], w0 = u > 1 ? b.path[u - 2] : M; put(m, u, w, G().fileDir(w[0] - w0[0] || 1, w[1] - w0[1], n)); } });
        put(I.mis[(m.h || [])[0]], u - 1, M, 0);
      } else if (fn === 106 && N <= 1) {   // Fists of Fire's orb: a meteor every 5 frames as it flies on past the monster
        const orb = I.mis[(m.h || [])[0]] || {}, cen = (orb.cs || [])[0] || "fofmeteorcenter", [wx, wy] = [M[0] - 0.5, M[1] - 0.5], Lw = Math.hypot(wx, wy) || 1;
        const v0 = m.v * G().MIS_PACE, v1 = Math.min(orb.v || 20, orb.mv || 99) * G().MIS_PACE, every = (orb.pp || [5])[0] || 5;
        // (the delay and the orb have no picture of their own: their lights as they fly)
        const at = d => [0.5 + wx / Lw * d, 0.5 + wy / Lw * d];
        if (u < (m.r || 5)) put(m, u, at(v0 * u), 0);
        else if (orb.c && u - (m.r || 5) < (orb.r || 12)) put(orb, u - (m.r || 5), at(v0 * (m.r || 5) + v1 * (u - (m.r || 5))), 0);
        for (let k = 0; k * every < (orb.r || 12); k++) {
          const d = v0 * (m.r || 5) + v1 * k * every, w = [0.5 + wx / Lw * d, 0.5 + wy / Lw * d];
          meteorAt(x, out, cen, u - (m.r || 5) - k * every, w);
        }
      } else if (fn === 106) {   // a fan from the Assassin at the monster
        const v = m.v * G().MIS_PACE, n = dirsOf(m), [wx, wy] = [M[0] - 0.5, M[1] - 0.5];
        for (let k = 0; k < N; k++) {
          const off = k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2), aim = [wx, wy + off], La = Math.hypot(aim[0], aim[1]) || 1, d = v * u;
          put(m, u, [0.5 + aim[0] / La * d, 0.5 + aim[1] / La * d], G().fileDir(aim[0], aim[1], n));
        }
      } else if (fn === 14) meteorAt(x, out, name, u, M);
      else if (fn === 15) {   // scattered from the monster
        /* (each aimed at the monster's spot + (rand(40) - 20, rand(40) - 20), its aim turning 14.04 degrees one way or
           the other every 2 frames: it wobbles out; trace T11, the audit's GA-16) */
        const v = m.v * G().MIS_PACE, n = dirsOf(m), rnd = api.mulberry32(seed);
        for (let k = 0; k < Math.max(1, P); k++) {
          const rx = Math.floor(rnd() * 40) - 20, ry = Math.floor(rnd() * 40) - 20, wob = api.mulberry32(seed * 17 + k);
          let a = Math.atan2(ry, rx || 1), px = M[0], py = M[1];
          for (let t = 1; t <= u; t++) { if (t % 2 === 0) a += (wob() < 0.5 ? -1 : 1) * 0.245; px += Math.cos(a) * v; py += Math.sin(a) * v; }
          put(m, u, [px, py], G().fileDir(Math.cos(a), Math.sin(a), n));
        }
      } else if (fn === 81) {   // the wave from the Assassin through the monster, its trails sideways each new sub-tile
        const tr = I.mis[(m.cs || [])[0]], v = m.v * G().MIS_PACE, n = dirsOf(m), [wx, wy] = [M[0] - 0.5, M[1] - 0.5], Lw = Math.hypot(wx, wy) || 1, dir = [wx / Lw, wy / Lw];
        put(m, u, [0.5 + dir[0] * travel(v, (m.a || 0) / 4096, u), 0.5 + dir[1] * travel(v, (m.a || 0) / 4096, u)], G().fileDir(dir[0], dir[1], n));
        let cell = [0, 0];
        for (let t = 1; t <= Math.min(u, m.r); t++) {
          const dd = travel(v, (m.a || 0) / 4096, t), p0 = [0.5 + dir[0] * dd, 0.5 + dir[1] * dd], cc = [Math.floor(p0[0]), Math.floor(p0[1])];
          if (cc[0] === cell[0] && cc[1] === cell[1]) continue;
          cell = cc;
          if (tr) [1, -1].forEach(sg => { const a = u - t, d2 = tr.v * G().MIS_PACE * a; put(tr, a, [p0[0] - sg * dir[1] * d2, p0[1] + sg * dir[0] * d2], G().fileDir(-sg * dir[1], sg * dir[0], dirsOf(tr))); });
        }
      }
    });
  }
  /* a meteor's centre at w (the game's do 9: its mark there while the meteor (CltSubMissile1) and its tail fall
     CltParam1 frames from CltParam2 pixels a frame up, then its hit: the explosion, light and fire, by the shared rule) */
  function meteorAt(x, out, name, u, w) {
    const I = IX(), cen = I.mis[name];
    if (!cen || u < 0) return;
    const fall = (cen.cp || [15])[0] || 15, z = (cen.cp || [15, 25])[1] || 25, sl = (cen.cp || [15, 25, 15])[2] || 15, [px, py] = scr(x, w);
    if (u < fall) {   // (the meteor and its tail from the upper left: CltParam3 pixels right and CltParam2 down a frame)
      putShot(out, py, cen, 0, misFrame(cen, u), px, py);
      const ox = -sl / 2 * (fall - u), oy = -(z + sl / 4) * (fall - u);   // (map units: trace T11, as Meteor's)
      (cen.cs || []).forEach(k => { const e = I.mis[k]; if (e) putShot(out, py + 0.5, e, 0, misFrame(e, u), px + ox, py + oy, [px + ox, py]); });
      return;
    }
    landFx(out, name, u - fall, px, py, Math.round(px * 7 + py));
  }

  // ================================================================== the Assassin's (2026-11-26)
  // the monster's footprint by its Size, (dx, dy) sub-tiles from its own: small its sub-tile, normal a plus of 5, big 3 x 3
  const footOf = size => (dx, dy) => { const a = Math.abs(dx), b = Math.abs(dy); return size === 1 ? a + b === 0 : size === 2 ? a + b <= 1 : Math.max(a, b) <= 1; };
  // (world sub-tiles from the caster's spot, (0.5, 0.5) her own, to the stage's pixels)
  const scr = (x, w) => { const [sx, sy] = G().toScreen(w[0] - 0.5, w[1] - 0.5); return [x.place.me[0] + sx, x.place.me[1] + sy]; };
  const monAt = x => { const [MX, MY] = G().toWorld(x.place.mon[0] - x.place.me[0], x.place.mon[1] - x.place.me[1]); return [MX + 0.5, MY + 0.5]; };
  /* the first frame a missile from `from` towards `to` at v sub-tiles a frame (for life frames) enters a sub-tile that
     meets the monster's footprint (a missile of Size 2 or more: its sub-tile and the four beside it), else -1 */
  function meetAt(x, from, to, v, life, msize) {
    const M = monAt(x), cell = [Math.floor(M[0]), Math.floor(M[1])], foot = footOf(Math.max(1, Math.min(3, +x.l.T.size || 2)));
    const meets = (cx, cy) => (msize >= 2 ? [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] : [[0, 0]]).some(([a, b]) => foot(cx + a - cell[0], cy + b - cell[1]));
    const L = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1, d = [(to[0] - from[0]) / L, (to[1] - from[1]) / L];
    let last = [Math.floor(from[0]), Math.floor(from[1])];
    if (meets(last[0], last[1])) return 0;
    for (let t = 1; t <= life; t++) {
      const c = [Math.floor(from[0] + d[0] * v * t), Math.floor(from[1] + d[1] * v * t)];
      if (c[0] !== last[0] || c[1] !== last[1]) { last = c; if (meets(c[0], c[1])) return t; }
    }
    return -1;
  }

  /* the traps as an Assassin lays them: one a throw (her S2 at her attack speed, the trap on its release) until five
     stand, then a new one as the oldest runs out of shots (laying sooner only replaces the oldest: the page's rule).
     A trap (the game's AssassinSentry, traced 2026-11-25) rises (S1), thinks after its aidel and shoots calc4 times, a
     shot every swing + aidel frames, its shot leaving on the swing's event frame, and dies after the last (DT); with
     its monster dead it stands. Death Sentry's stay (500 explosions): five laid, each blowing up a corpse by the monster
     every swing + aidel frames */
  const TRAP_OFF = [0, -2, 2, -4, 4];
  function trapPlan(x) {
    if (x.plan) return x.plan;
    const c = x.l.E.fr.cast, TD = (((api.DATA.ex || {}).traps || {})[String(x.l.E.attack.id)]) || {};
    const lay = Math.max(1, x.layTl && x.layTl.length ? x.layTl.length : c.own || 15), evt = Math.max(0, x.layEvt || 0);
    const first = (+TD.spawn || 15) + (+TD.aidel || 15), cyc = (+TD.swing || 15) + (+TD.aidel || 15);
    const life = c.dsentry ? Infinity : first + Math.max(0, c.shots || 0) * cyc;
    return (x.plan = { lay, evt, max: Math.max(1, c.petmax || 5), first, cyc, life, TD, lays: [] });
  }
  function layAt(x, k) {
    const P = trapPlan(x), L = P.lays;
    while (L.length <= k) {
      const j = L.length;
      let t = j ? L[j - 1] + P.lay : 0;
      // (the throw starts so its trap stands as the oldest dies, as the page counts 5 kept up: until the audit, MO-03,
      // it started then, each trap a throw's release frames late)
      if (j >= P.max) t = Math.max(t, L[j - P.max] + P.life);
      L.push(t);
    }
    return L[k];
  }
  // a trap's spot: in a row across the line, its distance from the monster (world sub-tiles from her spot)
  const trapAt = (x, slot) => { const M = monAt(x); return [M[0] - x.trapD, M[1] + TRAP_OFF[slot % TRAP_OFF.length]]; };
  // Death Sentry's explosions in turn: [{t, j}] (each trap's every swing + aidel frames, its event on the swing)
  function dsAt(x, k) {
    const P = trapPlan(x), ev = (x.cast.trap.evt || [2])[0];
    if (!P.ds || P.ds.length <= k) {   // (each trap's first 2 (k + 1): enough for the k-th of them all)
      const n = Math.max(8, 2 * (k + 1));
      P.ds = [];
      for (let j = 0; j < P.max; j++) for (let m = 0; m < n; m++) P.ds.push({ t: layAt(x, j) + P.evt + P.first + m * P.cyc + ev, j });
      P.ds.sort((a, b) => a.t - b.t || a.j - b.j);
    }
    return P.ds[k];
  }
  function trapSplit(x, ev, f0) {
    const k = x.trapK++, P = trapPlan(x), T = x.cast.trap, c = x.l.E.fr.cast, total = ev.loss - overOf(ev.parts);
    if (c.dsentry) {   // an explosion: its trap's swing, the corpse's burst
      const q = dsAt(x, k);
      x.layStarts = Array.from({ length: P.max }, (_, j) => layAt(x, j));
      (x.booms || (x.booms = [])).push(q);
      return [{ f: q.t, dmg: total }];
    }
    const L0 = layAt(x, k), spawn = L0 + P.evt, slot = k % P.max, at = trapAt(x, slot), M = monAt(x);
    const shots = Math.max(1, c.shots || 1), I = IX(), lvl = Math.max(1, +x.l.b.s.lvl || 1);
    const part = (ev.parts || []).find(r => r.x && r.x.k === "shot"), rolls = part ? part.d : [];
    const rnd = api.mulberry32(7411 + k * 53 + S.k * 97 + x.i), m = I.mis[T.m] || { v: 20, r: 20 };
    const evt = (T.evt || [0])[0], dist = Math.hypot(M[0] - at[0], M[1] - at[1]);
    const t = { k, L0, spawn, slot, at, death: spawn + P.life, shots: [] };
    // the rolls in turn over its shots (a shot's share: its hits)
    const per = Array.from({ length: shots }, () => []);
    rolls.forEach((v, j) => per[Math.min(shots - 1, Math.floor(j * shots / Math.max(1, rolls.length)))].push(v));
    const out = [];
    for (let j = 0; j < shots; j++) {
      const t0 = spawn + P.first + j * P.cyc, go = t0 + evt, sh = { t0, go, hits: [] };
      if (T.kind === "bolt") {
        const v = m.v * G().MIS_PACE, h = meetAt(x, at, M, v, m.r + (m.lr || 0) * lvl, m.z);
        sh.hits.push(go + Math.max(1, h >= 0 ? h : Math.ceil(dist / v)));
      } else if (T.kind === "walk") {
        // (its bolts from the lane's pool for the trap's place, as a cast's: walkPool)
        const want = per[j].length, N = Math.max(1, (part && part.x.of) || 5);
        const bolts = pickWalkers(walkPool(x, "trap" + slot, r => walkPaths(x, at, M, m, 1, lvl, r)[0]), N, want, false, rnd);
        sh.bolts = bolts;
        bolts.filter(b => b.hit >= 0).forEach(b => sh.hits.push(go + b.hit));
      } else if (T.kind === "wake") {
        // the maker at its Vel for its Range (no CollideKill: it passes), its hit as it meets the monster; the flames
        // it leaves each new sub-tile, two sideways, each hitting as it meets it
        const v = m.v * G().MIS_PACE, fl = I.mis[T.flame] || { v: 8, r: 20 }, fv = fl.v * G().MIS_PACE;
        const L = Math.hypot(M[0] - at[0], M[1] - at[1]) || 1, dir = [(M[0] - at[0]) / L, (M[1] - at[1]) / L], side = [-dir[1], dir[0]];
        const h = meetAt(x, at, [at[0] + dir[0] * 99, at[1] + dir[1] * 99], v, m.r, m.z);
        if (h >= 0) sh.hits.push(go + h);
        sh.dir = dir; sh.side = side; sh.flames = [];
        let cell = [Math.floor(at[0]), Math.floor(at[1])];
        for (let u = 1; u <= m.r; u++) {
          const p = [at[0] + dir[0] * v * u, at[1] + dir[1] * v * u], cc = [Math.floor(p[0]), Math.floor(p[1])];
          if (cc[0] === cell[0] && cc[1] === cell[1]) continue;
          cell = cc;
          [1, -1].forEach(sg => {
            const q = meetAt(x, p, [p[0] + sg * side[0] * 99, p[1] + sg * side[1] * 99], fv, fl.r, fl.z);
            sh.flames.push({ u, p, sg });
            if (q >= 0) sh.hits.push(go + u + Math.max(1, q));
          });
        }
        sh.hits.sort((a, b) => a - b);
      } else if (T.kind === "flames") {
        // Wake of Inferno's breath: a flame every calc3 frames from its event (the page's count), each flying at its Vel
        // for calc1 frames towards the monster
        const n = Math.max(1, +P.TD.flames || 7), v = m.v * G().MIS_PACE;
        sh.flames = [];
        for (let i = 0; i < n; i++) {
          const go2 = go + i * (T.every || 3), h = meetAt(x, at, M, v, T.life || 20, m.z);
          sh.flames.push({ go: go2, alt: rnd() < 0.5 });
          sh.hits.push(go2 + Math.max(1, h >= 0 ? h : Math.ceil(dist / v)));
        }
      }
      t.shots.push(sh);
      const hs = sh.hits.length ? sh.hits : [go + 1];
      per[j].forEach((v, i) => out.push({ f: hs[Math.min(i, hs.length - 1)], dmg: v }));
    }
    x.traps.push(t);
    x.layStarts = x.traps.map(q => q.L0);
    if (!out.length) return [{ f: spawn + P.first + evt + 1, dmg: total }];
    out.sort((a, b) => a.f - b.f);
    out[0].dmg += total - rolls.reduce((a, v) => a + v, 0);
    return out;
  }
  // Charged Bolt Sentry's bolts from the trap: Charged Bolt's walk (legs of 2 sub-tiles, each the 8-way direction to
  // the monster or a neighbour, 11 / 10 / 11 in 32), a hit the frame a bolt enters the monster's footprint
  function walkPaths(x, at, M, m, N, lvl, rnd) {
    const v = Math.min(m.mv || 99, m.v + Math.floor((m.vl || 0) * (lvl - 1) / 8)) * G().MIS_PACE;
    const cell = [Math.floor(M[0]), Math.floor(M[1])], foot = footOf(Math.max(1, Math.min(3, +x.l.T.size || 2)));
    const main = dir8(M[0] - at[0], M[1] - at[1]), bolts = [];
    for (let b = 0; b < N; b++) {
      let px = at[0], py = at[1], tx = px, ty = py, c = [Math.floor(px), Math.floor(py)], hit = -1;
      const path = [];
      for (let t = 1; t <= m.r; t++) {
        let left = v;
        while (left > 1e-9) {
          if (Math.abs(tx - px) < 1e-9 && Math.abs(ty - py) < 1e-9) { const d = DIRS[(main + SEQ[Math.floor(rnd() * 32)] + 8) % 8]; tx = px + 2 * d[0]; ty = py + 2 * d[1]; }
          const seg = Math.hypot(tx - px, ty - py);
          if (seg <= left) { px = tx; py = ty; left -= seg; } else { px += (tx - px) * left / seg; py += (ty - py) * left / seg; left = 0; }
        }
        path.push([px, py]);
        const cc = [Math.floor(px), Math.floor(py)];
        if (cc[0] !== c[0] || cc[1] !== c[1]) { c = cc; if (hit < 0 && foot(cc[0] - cell[0], cc[1] - cell[1])) hit = t; }
      }
      bolts.push({ path, hit });
    }
    return bolts;
  }
  // a trap's picture now: rising, shooting, dying, standing
  function trapLook(x, t, f, end) {
    const T = x.cast.trap, P = trapPlan(x), u = f - t.spawn;
    if (u < 0) return null;
    const S1 = (T.modes || {}).S1 || 15;
    if (u < S1) return { mode: "S1", fr: u };
    const sw = (t.shots || []).find(q => f >= q.t0 && f < q.t0 + T.swing.length && q.t0 <= end);
    if (sw) { const st = T.swing[f - sw.t0]; return { mode: st[0], fr: st[1] }; }
    const lastGo = t.shots && t.shots.length ? t.shots[t.shots.length - 1].t0 : -1;
    if (isFinite(t.death) && lastGo >= 0 && lastGo <= end && f >= t.death) {
      const dt = (T.modes || {}).DT || 20;
      return f - t.death < dt ? { mode: "DT", fr: f - t.death } : null;
    }
    const nu = (T.modes || {}).NU || 1;
    return { mode: "NU", fr: (u - S1) % nu };
  }
  function trapFx(x, out) {
    const I = IX(), T = x.cast.trap, P = trapPlan(x), f = S.frame, end = x.F.killF >= 0 ? x.F.killF : Infinity;
    const M = monAt(x), [mx, my] = x.place.mon, lvl = Math.max(1, +x.l.b.s.lvl || 1);
    const set = T.sets[String(compassOf(1, 0))] || Object.values(T.sets)[0];
    const units = x.l.E.fr.cast.dsentry ? Array.from({ length: P.max }, (_, j) => ({ k: j, L0: layAt(x, j), spawn: layAt(x, j) + P.evt, at: trapAt(x, j), death: Infinity, shots: nearArr(x.booms || [], q => q.t).filter(q => q.j === j).map(q => ({ t0: q.t - (T.evt || [2])[0] })) })) : x.traps;
    units.forEach(t => {
      if (t.L0 > end || f < t.spawn) return;
      const look = trapLook(x, t, f, end), [px, py] = scr(x, t.at);
      if (look) out.push({ y: py, draw: ctx => { G().shadow(ctx, px, py, 10); G().drawMonster(ctx, set, 2, x.mon.act, look.mode, look.fr, Math.round(px), Math.round(py), ""); } });
      // Death Sentry's cast overlay on the trap as it casts
      const ov = T.ov && I.ov ? I.ov[T.ov] : null;
      if (ov) t.shots.forEach(q => { const k2 = Math.floor((f - q.t0) * ov.rate / 16); if (q.t0 <= end && k2 >= 0 && k2 < ov.n) out.push({ y: py + 0.5, draw: ctx => G().drawFx(ctx, ov, k2, Math.round(px + ov.dx), Math.round(py + ov.dy), ov.trans, [px, py]) }); });
      if (x.l.E.fr.cast.dsentry) return;
      t.shots.forEach(sh => {
        if (sh.go > end || f < sh.go) return;
        const u = f - sh.go;
        if (T.kind === "bolt") boltFx(x, out, t.at, M, I.mis[T.m], I.mis[T.piece], u, sh, end, lvl);
        else if (T.kind === "walk") {
          const m = I.mis[T.m], sp = m ? G().iasSprite(m.c) : null, n = sp && sp.geo ? sp.geo.dirs || 1 : 1;
          if (m) sh.bolts.forEach(b => {
            const stop = b.hit >= 0 && sh.go + b.hit <= end && m.ck ? b.hit : b.path.length;
            if (u < 1 || u > stop) return;
            const w = b.path[u - 1], w0 = u > 1 ? b.path[u - 2] : t.at, [qx, qy] = scr(x, w);
            out.push({ y: qy, draw: ctx => G().drawDirShot(ctx, m, G().fileDir(w[0] - w0[0] || 1, w[1] - w0[1], n), misFrame(m, u), Math.round(qx), Math.round(qy), m.t) });
          });
        } else if (T.kind === "wake") {
          const m = I.mis[T.m], fl = I.mis[T.flame];
          if (m && u < m.r) { const v = m.v * G().MIS_PACE, [qx, qy] = scr(x, [t.at[0] + sh.dir[0] * v * u, t.at[1] + sh.dir[1] * v * u]); putShot(out, qy, m, 0, misFrame(m, u), qx, qy); }
          if (fl) sh.flames.forEach(q => {
            const a = u - q.u;
            if (a < 0 || a >= fl.r) return;
            const d = fl.v * G().MIS_PACE * a, [qx, qy] = scr(x, [q.p[0] + q.sg * sh.side[0] * d, q.p[1] + q.sg * sh.side[1] * d]);
            putShot(out, qy, fl, 0, misFrame(fl, a), qx, qy);
          });
        } else if (T.kind === "flames") {
          // each flame towards the monster, drawn cltcalc1 (-37) pixels lower (the client's height for it)
          sh.flames.forEach(q => {
            const e = I.mis[q.alt && T.alt ? T.alt : T.m], a = f - q.go;
            if (!e || a < 0 || a >= (T.life || 20) || q.go > end) return;
            const L = Math.hypot(M[0] - t.at[0], M[1] - t.at[1]) || 1, d = Math.min(e.v * G().MIS_PACE * a, L + 2);
            const [qx, qy] = scr(x, [t.at[0] + (M[0] - t.at[0]) / L * d, t.at[1] + (M[1] - t.at[1]) / L * d]);
            putShot(out, qy, e, 0, misFrame(e, a), qx, qy - (T.z || 0), [qx, qy]);
          });
        }
      });
    });
    // Death Sentry: the corpse by the monster, its bursts (the corpse's gore and the sentry's explosion)
    if (x.l.E.fr.cast.dsentry) {
      const body = corpseOf(x), [cx0, cy0] = G().toScreen(CORPSE_AT[0], CORPSE_AT[1]), cx = Math.round(mx + cx0), cy = Math.round(my + cy0);
      const boom = (T.boom || []).map(k => I.mis[k]).filter(Boolean), last = nearArr(x.booms || [], q => q.t).filter(q => q.t <= f).pop();
      const busy = last && f - last.t < Math.max(1, ...boom.map(e => e.r));
      if (body && !busy) out.push({ y: cy, draw: ctx => G().drawMonster(ctx, x.mon.set, x.mon.table, x.mon.act, body.mode, body.f, cx, cy, "") });
      nearArr(x.booms || [], q => q.t).forEach(q => {
        const u = f - q.t;
        if (u < 0 || q.t > end) return;
        boom.forEach(e => { if (u < Math.max(1, e.r)) putShot(out, cy + 0.5, e, G().fileDir(1, 1, 4), misFrame(e, u), cx, cy); });
      });
    }
  }
  /* a sentry's bolt (Lightning Sentry's, Chain Lightning Sentry's: their do 8, as Lightning's): from the trap towards
     the monster at its Vel, a piece of lightning where it is each new sub-tile, each living its Range at a random height
     within its Z Range; Chain Lightning Sentry's bolt shows its own picture and stops on the monster (CollideKill),
     Lightning Sentry's has none and flies its Range (10 + 2 a level) through it */
  function boltFx(x, out, at, M, m, pc, u, sh, end, lvl) {
    if (!m) return;
    const v = m.v * G().MIS_PACE, L = Math.hypot(M[0] - at[0], M[1] - at[1]) || 1, dir = [(M[0] - at[0]) / L, (M[1] - at[1]) / L];
    const life = m.r + (m.lr || 0) * lvl, hit = sh.hits[0] - sh.go, stop = m.ck && sh.hits[0] <= end ? hit : life;
    if (pc && u < life + pc.r) {
      const sp = G().iasSprite(pc.c), dirs = sp && sp.geo ? sp.geo.dirs || 1 : 1, dk = G().fileDir(dir[0], dir[1], dirs);
      const rnd = api.mulberry32(3907 + sh.go * 29 + x.i);
      let cell = [Math.floor(at[0]), Math.floor(at[1])];
      for (let t = 1; t <= Math.min(u, stop); t++) {
        const p = [at[0] + dir[0] * v * t, at[1] + dir[1] * v * t], cc = [Math.floor(p[0]), Math.floor(p[1])];
        const z = pc.zr > 0 ? Math.floor(rnd() * pc.zr) - Math.trunc(pc.zr / 2) : 0;
        if (cc[0] === cell[0] && cc[1] === cell[1]) continue;
        cell = cc;
        const age = u - t;
        if (age >= pc.r) continue;
        const [qx, qy] = scr(x, p);
        out.push({ y: qy, draw: ctx => G().drawDirShot(ctx, pc, dk, misFrame(pc, age), Math.round(qx), Math.round(qy - z), pc.t, [qx, qy]) });
      }
    }
    if (u < stop && m.c && !/null$/.test(m.c)) {
      const [qx, qy] = scr(x, [at[0] + dir[0] * v * u, at[1] + dir[1] * v * u]);
      out.push({ y: qy, draw: ctx => G().drawShot(ctx, m, misFrame(m, u), qx, qy, 0, m.t) });
    } else if (u < stop && m.li) {   // (a bolt without a picture, the sentries': its light where its head is)
      const [qx, qy] = scr(x, [at[0] + dir[0] * v * u, at[1] + dir[1] * v * u]);
      out.push({ y: qy, draw: () => G().light(qx, qy, G().misLight(m.li)) });
    }
  }

  /* Blade Sentinel's sentinel as the game runs it (traced 2026-11-25): summoned a sub-tile from the Assassin towards the
     monster, it thinks the next frame and flies at 1.5 sub-tiles a frame to 3 sub-tiles past the monster, stands out its
     aidel (5 frames), turns (a burst, 75% of a melee hit, on everything within 7 sub-tiles, once 6 frames have passed
     since its first think, then at most every 12) and flies back, and so on until its 50 frames are up. Its blade hits
     the monster each frame the sentinel's 3 x 3 meets the monster's footprint, at most every 6 frames (the lock). The
     fight's blade and burst rolls land on those frames in turn */
  function sentOf(x) {
    if (x.sentG) return x.sentG;
    const S2 = (api.DATA.ex || {}).sent || {}, v = (+S2.vel || 24) / 16, rest = +S2.aidel || 5, life = +S2.life || 50;
    const gap = (+S2.next || 5) + 1, gate0 = +S2.first || 6, gateN = +S2.gate || 12;
    const M = monAt(x), cell = [Math.floor(M[0]), Math.floor(M[1])], foot = footOf(Math.max(1, Math.min(3, +x.l.T.size || 2)));
    const a = 1.5, b = M[0] + 3, reachB = ((x.l.E.ex && x.l.E.ex.always) || []).find(q => q.k === "burst");
    const R = reachB && reachB.r ? reachB.r : 7, pos = [{ p: a, mode: "S1" }], blades = [], bursts = [];
    let t = 1, p = a, to = b, gate = 1 + gate0, last = -99;
    const touch = q => [-1, 0, 1].some(i => [-1, 0, 1].some(j => foot(Math.floor(q) + i - cell[0], Math.floor(M[1]) + j - cell[1])));
    const step = (mode) => { pos[t] = { p, mode }; if (touch(p) && t - last >= gap) { blades.push(t); last = t; } t++; };
    while (t <= life) {
      while (Math.abs(to - p) > 1e-9 && t <= life) { p += Math.sign(to - p) * Math.min(v, Math.abs(to - p)); step("WL"); }
      for (let i = 0; i < rest && t <= life; i++) step("NU");
      if (t > life) break;
      if (t >= gate) { if (Math.abs(p - M[0]) <= R) bursts.push(t); gate = t + gateN; }
      to = to === b ? a : b;
    }
    return (x.sentG = { pos, blades, bursts, life: t });
  }
  function sentSplit(x, ev, f0) {
    const g = sentOf(x), total = ev.loss - overOf(ev.parts);
    x.sent[f0] = 1;
    const sum = ks => { const ps = (ev.parts || []).filter(r => r.x && ks.includes(r.x.k)), n = Math.max(0, ...ps.map(r => r.d.length)); return Array.from({ length: n }, (_, i) => ps.reduce((t, r) => t + (r.d[i] || 0), 0)); };
    const bl = sum(["blade", "bladeE"]), bu = sum(["burst", "burstE"]), out = [];
    bl.forEach((v, i) => out.push({ f: f0 + (g.blades.length ? g.blades[Math.min(i, g.blades.length - 1)] : 1), dmg: v }));
    bu.forEach((v, i) => out.push({ f: f0 + (g.bursts.length ? g.bursts[Math.min(i, g.bursts.length - 1)] : 6), dmg: v }));
    const rest = total - bl.concat(bu).reduce((a, v) => a + v, 0);
    if (!out.length) return [{ f: f0 + 1, dmg: total }];
    out.sort((a, b) => a.f - b.f);
    out[0].dmg += rest;
    return out;
  }
  function sentFx(x, out) {
    const sp = (IX().spells || {})[String(x.l.E.attack.id)], S2 = sp && sp.sentinel, f = S.frame, end = x.F.killF >= 0 ? x.F.killF : Infinity;
    if (!S2) return;
    const g = sentOf(x), set = S2.sets[String(compassOf(1, 0))] || Object.values(S2.sets)[0], M = monAt(x), dt = (S2.modes || {}).DT || 35;
    nearKeys(x.sent).forEach(k => {
      const r0 = +k, u = f - r0;
      if (r0 > end || u < 0 || u >= g.life + dt) return;
      const q = g.pos[Math.min(u, g.pos.length - 1)], [px, py] = scr(x, [q.p, M[1]]);
      const mode = u >= g.life ? "DT" : q.mode, fr = u >= g.life ? u - g.life : u;
      const n = mode === "DT" ? fr : fr % Math.max(1, (S2.modes || {})[mode] || 1);
      out.push({ y: py, draw: ctx => { G().shadow(ctx, px, py, 8); G().drawMonster(ctx, set, 2, x.mon.act, mode, n, Math.round(px), Math.round(py), ""); } });
    });
  }

  /* Fire Blast's and Shock Web's bombs as the client throws them (its skill client do 5, traced 2026-11-20): each to a
     random sub-tile of the spread around the monster (-R to R - 1 both ways; one bomb, or a spread under 2, on the
     monster), in an arc of D x 64 / (3 x Vel) frames (D: the longer axis and half the shorter, from the thrower), from
     30 pixels up (the client's height motion). Fire Blast's lands as the bomb on the ground, which goes off at once where
     it touches the monster, else after its Range (5): the explosion's fire reaches everything within its radius (4); the
     spots come from the lane's own draws, picked so that as many explode within reach as the fight rolled for that
     throw. Shock Web's spikes lie where they land as shock fields for their Range (90 frames: the page's damage over
     time, from the throw's landing) */
  function bombsOf(x, r0, want) {
    if (x.bomb[r0]) return x.bomb[r0];
    const sp = (IX().spells || {})[String(x.l.E.attack.id)].bombs, part = ((x.l.E.ex && x.l.E.ex.always) || []).find(q => q.k === "bomb" || q.k === "field") || {};
    const N = Math.max(1, part.of || 1), R = part.spread || 0, rad = part.r || 4, M = monAt(x), foot = footOf(Math.max(1, Math.min(3, +x.l.T.size || 2)));
    const rnd = api.mulberry32(6133 + r0 * 59 + S.k * 71 + x.i);
    let best = null;
    for (let g = 0; g < 60; g++) {
      const bs = [];
      for (let i = 0; i < N; i++) {
        const o = N <= 1 || R < 2 ? [0, 0] : [Math.floor(rnd() * 2 * R) - R, Math.floor(rnd() * 2 * R) - R];
        const to = [M[0] + o[0], M[1] + o[1]], a = Math.abs(to[0] - 0.5), b = Math.abs(to[1] - 0.5);
        if (N > 1 && R >= 2 && a * a + b * b <= 4) continue;   // (the game skips a spot by the thrower)
        const n = x.arc(Math.max(a, b) + Math.min(a, b) / 2), touch = foot(o[0], o[1]);
        bs.push({ to, n, touch, reach: o[0] * o[0] + o[1] * o[1] <= rad * rad, d: Math.floor(rnd() * 8) });
      }
      const n = bs.filter(q => q.reach).length;
      if (want === undefined || !best || Math.abs(n - want) < Math.abs(best.n - want)) best = { bs, n };
      if (want === undefined || n === want) break;
    }
    return (x.bomb[r0] = best.bs);
  }
  function bombSplit(x, ev, f0) {
    const part = (ev.parts || []).find(r => r.x && r.x.k === "bomb"), total = ev.loss - overOf(ev.parts), gr = IX().mis[(IX().spells || {})[String(x.l.E.attack.id)].bombs.ground] || { r: 5 };
    const bs = bombsOf(x, f0, part ? part.d.length : 0), at = bs.filter(q => q.reach).map(q => f0 + q.n + (q.touch ? 1 : Math.max(1, gr.r))).sort((a, b) => a - b);
    if (!part || !part.d.length || !at.length) return [{ f: f0 + (at[0] || x.arc(1)), dmg: total }];
    const rest = total - part.d.reduce((a, v) => a + v, 0);
    return part.d.map((v, k) => ({ f: at[Math.min(k, at.length - 1)], dmg: v + (k === 0 ? rest : 0) }));
  }
  function bombFx(x, out) {
    const I = IX(), B = (I.spells || {})[String(x.l.E.attack.id)].bombs, f = S.frame, end = x.F.killF >= 0 ? x.F.killF : Infinity;
    const air = I.mis[B.air], gr = I.mis[B.ground], boom = I.mis[B.boom];
    if (!air) return;
    // each throw by its release: Fire Blast's from its layouts (its numbers land as each bomb goes off), Shock Web's
    // from its numbers (its fields' damage from the landing)
    const casts = B.boom ? nearKeys(x.bomb) : [...new Set(nearM(x).filter(m => !m.more).map(m => m.f - x.flight))];
    casts.forEach(r0 => {
      const u = f - r0;
      if (u < 0 || r0 > end + 1) return;
      bombsOf(x, r0).forEach(q => {
        const asp = G().iasSprite(air.c), adirs = asp && asp.geo ? asp.geo.dirs || 1 : 1;
        if (u < q.n) {   // in the air: along the ground to its spot, z pixels up (30 + k (N + 1 - 30 / N) - k^2)
          const k2 = u + 1, z = Math.max(0, 30 + k2 * (q.n + 1 - 30 / q.n) - k2 * k2), w = [0.5 + (q.to[0] - 0.5) * k2 / q.n, 0.5 + (q.to[1] - 0.5) * k2 / q.n], [qx, qy] = scr(x, w);
          putShot(out, qy, air, G().fileDir(q.to[0] - 0.5, q.to[1] - 0.5, adirs), misFrame(air, u), qx, qy - z, [qx, qy]);
          return;
        }
        const a = u - q.n, [qx, qy] = scr(x, q.to);
        if (!gr) return;
        const sit = boom ? (q.touch ? 1 : Math.max(1, gr.r)) : gr.r;   // the bomb on the ground until it goes off; a field its 90 frames
        const gsp = G().iasSprite(gr.c), gdirs = gsp && gsp.geo ? gsp.geo.dirs || 1 : 1;
        if (a < sit) putShot(out, qy, gr, q.d % gdirs, misFrame(gr, a), qx, qy);
        else if (boom && a - sit < Math.max(1, boom.r)) putShot(out, qy + 0.5, boom, 0, misFrame(boom, a - sit), qx, qy);
      });
    });
  }

  /* Mind Blast as PD2's client draws it (its skill client do 8 and its centre's do 17, traced 2026-11-26): the centre
     on the spot cast on (the monster) for its Range (10 frames), and while it is younger than 10 frames, every third
     frame (4 times), its hit scattered over the blast's disc: every sub-tile within the radius (every other one beyond
     a radius of 4), each at odds of 1 in the radius (half of it beyond 4), each living its Range. The radius: the skill's
     aurarangecalc, 2 more for each stack of its state on the caster (a cast within 20 frames of the last one stacks,
     up to 3). The page counts its one hit on the monster at the cast */
  function mindFx(x, out) {
    const I = IX(), Mi = x.cast.mind, cen = I.mis[Mi.centre], hit = I.mis[Mi.hit], f = S.frame, end = x.F.killF >= 0 ? x.F.killF : Infinity, [mx, my] = x.place.mon;
    const part = ((x.l.E.ex && x.l.E.ex.always) || []).find(q => q.k === "hit") || {}, r0 = part.r0 || 4, per = part.per || 2, most = part.most || 3;
    const casts = nearM(x).filter(m => !m.more).map(m => m.f), chain = x.l.E.fr.frames < 20;
    casts.forEach((c0, ci) => {
      const u = f - c0;
      if (u < 0 || u > 22 || c0 > end) return;
      if (cen && u < cen.r) putShot(out, my, cen, 0, misFrame(cen, u), mx, my);
      if (!hit) return;
      const R = r0 + ((chain ? Math.min(ci + 1, most) : 1) - 1) * per, stepN = R > 4 ? 2 : 1, odds = R > 4 ? Math.floor(R / 2) : R;
      for (let w = 0; w < Mi.until && w <= u; w += 3) {
        const a = u - w;
        if (a >= hit.r) continue;
        const rnd = api.mulberry32(2711 + c0 * 31 + w * 7 + x.i);
        for (let i = -R; i <= R; i += stepN) for (let j = -R; j <= R; j += stepN) {
          if (i * i + j * j > R * R || Math.floor(rnd() * Math.max(1, odds)) !== 0) continue;
          const [sx, sy] = G().toScreen(i, j);
          putShot(out, my + sy, hit, 0, misFrame(hit, a), mx + sx, my + sy);
        }
      }
    });
  }

  /* Blade Shield's strikes (its srvdo 54 every perdelay frames: the damage at the strike) and, at each, the blade its
     attachment sends from the Assassin to the monster (the client's do 57: its picture at its Vel, speeding up by its
     Accel, until it reaches the monster) */
  function shieldFx(x, ctx, ax, ay, mx, my) {
    const m = IX().mis[x.cast.shield.blade], f = S.frame, end = x.F.killF >= 0 ? x.F.killF : Infinity;
    if (!m) return;
    const [wx, wy] = G().toWorld(mx - ax, my - ay), L = Math.hypot(wx, wy) || 1;
    nearM(x).forEach(q => {
      const u = f - q.f;
      if (u < 0 || q.f > end || u >= m.r) return;
      const d = travel(m.v * G().MIS_PACE, (m.a || 0) / 4096, u);
      if (d > L) return;
      const [sx, sy] = G().toScreen(wx / L * d, wy / L * d);
      G().drawShot(ctx, m, misFrame(m, u), ax + sx, ay + sy, 0, m.t);
    });
  }

  /* The pictures come before the fight (the audit of 2026-11-27, CO-01 / PE-02): the lanes are laid out once every
     lane's monster has its picture (the stage's size and the spots come from it: a boss laid out before it arrived
     stood the character inside it, the numbers on its belly, for the whole fight), and the clock holds until the first
     frame's pictures are in (the floor, the characters, the monster in its colors; on a slow connection a short fight
     had played out on a black stage), at most HOLD_MS. A picture that failed is asked for again at the next build and
     the bar says so meanwhile. */
  const HOLD_MS = 15000;
  function waitingFor(lanes) {
    const sets = [...new Set(lanes.map(l => monsterOf(l).set))];
    sets.forEach(s => G().monster(s));   // (asks for them)
    return sets.some(s => G().monState(s) === "loading");
  }
  function holdOn() {
    S.hold = true; S.holdAt = performance.now();
    clearTimeout(S.holdT); S.holdT = setTimeout(held, HOLD_MS + 50);   // (a load that never ends doesn't hold it for good)
    held();
  }
  // the clock goes once nothing is loading (or HOLD_MS have passed); the bar says what it waits for, and any failure
  function held() {
    if (S.hold && (!G().pending() || performance.now() - S.holdAt > HOLD_MS)) { S.hold = false; whichText(); kick(); }
    const w = $("fx-which");
    if (w && S.hold) w.textContent = "Loading the pictures…";
    const warn = $("fx-warn");
    if (warn) warn.hidden = !G().failures();
  }
  function whichText() {
    const w = $("fx-which"), who = S.lanes.length ? S.lanes[0].mon : null;
    if (w) w.textContent = `Fight ${S.k + 1}` + (who ? ` against ${monWords(who, true)}` : "");
  }
  // a link to the tab (#tab-fight): the page scrolled to it while the tab was still loading, so it may have stopped short
  function landOnce() {
    if (S.landed) return;
    S.landed = true;
    if ((location.hash === "#tab-fight" || (api.fromLink && api.fromLink())) && Math.abs(window.scrollY - S.y0) < 2) {
      const bar = document.querySelector(".dm-tabbar");
      if (bar) bar.scrollIntoView({ block: "start" });
    }
  }
  function build(restart) {
    const lanes = api.lanes();
    const sig = signature(lanes) + "|" + S.k;
    if (!restart && sig === S.sig && S.built) return;
    if (restart || sig !== S.sig) G().retry();
    S.sig = sig;
    if (waitingFor(lanes)) {   // (laid out when the monster's picture arrives: the stage's onload builds again)
      S.built = false;
      if (S.lanes.length) holdOn();
      return;
    }
    S.built = true;
    S.frame = 0; S.acc = 0;
    S.still = api.reducedMotion();
    // (playing at first, paused with reduced motion; after that a pause holds through a change on the page: the
    // audit's CO-12, a paused fight had started playing at every change)
    if (!S.started) { S.started = true; S.playing = !S.still; }
    // the stage: tall enough for the monster (Baal stands about 180 pixels tall)
    W = 320; H = 200;
    const mon0 = lanes.length ? monsterOf(lanes[0]) : null, M0 = mon0 ? G().monster(mon0.set) : null;
    if (M0) { const tall = M0.box[3] - M0.box[1], wide = M0.box[2] - M0.box[0]; H = Math.max(200, Math.min(320, tall + 110)); W = Math.max(320, Math.min(440, Math.round(H * 1.6), wide + 230)); }
    S.lanes = lanes.map((l, i) => laneOf(l, i));
    G().keepPictures(S.lanes.map(x => `${x.mon.set}|${x.mon.table}|${x.mon.act}`));
    /* one stage size for every lane (the author, 2026-11-26: the lanes' lines should line up): the largest any lane
       needs (Frozen Orb's 14 yards, Charge's run), each lane's units moved to its middle; their other places are
       worked out from these two at draw time */
    const SW = Math.max(W, ...S.lanes.map(x => x.W || W)), SH = Math.max(H, ...S.lanes.map(x => x.H || H));
    S.lanes.forEach(x => {
      const dx = (SW - (x.W || W)) / 2, dy = (SH - (x.H || H)) / 2;
      x.W = SW; x.H = SH;
      if (!dx && !dy) return;
      x.place = Object.assign({}, x.place, { me: [x.place.me[0] + dx, x.place.me[1] + dy], mon: [x.place.mon[0] + dx, x.place.mon[1] + dy] });
      if (x.runIn) x.runIn.from = [x.runIn.from[0] + dx, x.runIn.from[1] + dy];
    });
    /* the note under the lanes (the audit's WO-01): what the numbers and words are; the spells' rule only when a lane
       is a spell, a trap or a sentinel. No controls when no lane can fight (CO-11) */
    const fights = S.lanes.some(x => !x.F.none), later = S.lanes.some(x => !x.F.none && (x.l.E.spell || x.trapL || x.sent));
    box.innerHTML = (fights ? controls() : "") + `<div class="fx-lanes">${S.lanes.map((x, i) => laneHTML(x, i)).join("")}</div>` + (fights ? `
      <p class="note">A number is what one hit takes off the monster&rsquo;s life: Crit, Deadly, and Crushing mark a critical
      strike, a deadly strike, and a crushing blow, and Miss a hit that missed. Poison, burning, and other damage over time
      show one number a second. The monster flinches when a hit is big enough for its life, as in the game, and a
      lane&rsquo;s time is the frame of its killing blow.${later ? ` A spell&rsquo;s, trap&rsquo;s, or sentinel&rsquo;s damage
      counts here as it lands (each Frozen Orb bolt, each Hydra shot, burning ground and poison as they burn), but the
      page&rsquo;s kill time counts each cast&rsquo;s damage in full when it&rsquo;s cast, so these fights take longer than the
      page&rsquo;s kill time.` : ""}</p>` : "");
    if (fights) wire();
    // each lane plays while at least a third of its picture shows (the audit's UX-03; `tick`)
    if (S.io) S.io.disconnect();
    if (window.IntersectionObserver) {
      S.io = new IntersectionObserver(es => {
        es.forEach(e => { const x = S.lanes[+e.target.dataset.lane]; if (x && e.target.isConnected) x.vis = e.intersectionRatio >= 0.33; });
        kick();
      }, { threshold: [0, 0.33, 0.66, 1] });
      S.lanes.forEach((x, i) => { const sc = $(`fx-scene-${i}`); if (sc) { sc.dataset.lane = String(i); S.io.observe(sc); } });
    }
    S.lanes.forEach((x, i) => { paint(x, i, true); draw(x); });   // (the first frame: its pictures are asked for)
    whichText();
    playText();
    holdOn();
    landOnce();
    kick();
    averages();
  }
  /* a rotation's pattern in words, as the page's Side by Side says it (the audit's WO-02): every N casts of the skill,
     each other skill's plays in it */
  function rotWords(W, att) {
    const parts = W.use.map((o, j) => (W.count[j + 1] ? `${esc(o.att.label)} ${timesWord(W.count[j + 1])}` : "")).filter(Boolean);
    return `${W.casts === 1 ? `each cast of ${esc(att)}` : `every ${W.casts} casts of ${esc(att)}`}: ${andList(parts)}`;
  }
  /* who a lane is, for a screen reader (the audit's CO-10 / AC-04): "Build A (Paladin)" comparing builds, the lane's
     own name ("Weapon B", "Now") comparing weapons or gear; short: its letter, or that name */
  const whoOf = l => (api.mode && api.mode() !== "builds" ? l.name : `Build ${l.letter} (${l.name})`);
  const shortWho = l => (api.mode && api.mode() !== "builds" ? l.name : l.letter);
  function laneHTML(x, i) {
    const l = x.l, F = x.F, E = l.E, who = esc(whoOf(l));
    const att = E && E.attack ? E.attack.label : "";
    const head = `<div class="fx-head"><span class="kb" style="--key:${l.key}" aria-hidden="true">${l.letter}</span><span class="fx-name">${esc(l.name)}</span></div>`;
    if (F.none) return `<section class="fx-lane" style="--key:${l.key}" aria-label="${who}">${head}<p class="fx-none">${esc(F.none)}</p></section>`;
    return `<section class="fx-lane" style="--key:${l.key}" aria-label="${who}: ${esc(att)}">
      ${head}
      <div class="fx-sub">${E.wv && E.wv.k > 0 ? `${esc(att)} + ${andList(E.wv.use.map(o => esc(o.att.label)))} &middot; ${rotWords(E.wv, att)}, a ${nf0.format(E.wv.frames)}-frame rotation` : `${esc(att)} &middot; ${nf0.format(E.fr.frames)} frames ${E.fr.cast && E.fr.cast.cycle > 1 && !E.fr.cast.dsentry ? `a cycle of ${E.fr.cast.cycle} casts` : F.unit !== "hit" ? `${/^[aeiou]/.test(F.unit) ? "an" : "a"} ${esc(F.unit)}` : E.fr.hits > 1 ? `for ${E.fr.hits} hits` : "an attack"}`}</div>
      <div class="fx-scene" id="fx-scene-${i}"><canvas id="fx-cv-${i}" width="${x.W || W}" height="${x.H || H}" role="img" aria-label="${who}, ${esc(att)}, fighting ${esc(monWords(x.mon))}"></canvas></div>
      <div class="fx-life"><div class="fx-meter" aria-hidden="true"><span id="fx-bar-${i}"></span></div><span class="fx-lt" id="fx-lt-${i}"></span></div>
      <p class="fx-status" id="fx-st-${i}"></p>
      <details class="fx-log" id="fx-log-${i}"><summary>Hit by hit</summary><ol id="fx-ol-${i}" tabindex="0" aria-label="Hits of ${who}: time and damage"></ol></details>
    </section>`;
  }
  /* the monster in words: its name, or with your own numbers the stand-in that's drawn and why (the audit's UX-11) */
  const STANDIN = { fallen1: "Fallen", zombie1: "Zombie", overseer1: "Overseer" }, SIZES = ["Small", "Normal", "Big"];
  function monWords(m, full) {
    if (!m.standin) return m.name;
    const n = STANDIN[m.id] || "monster", a = /^[AEIOU]/.test(n) ? "an" : "a";
    return full ? `${m.name} (${a} ${n} stands in for a ${SIZES[m.size - 1] || "Normal"}-size monster)` : `${m.name} (${a} ${n})`;
  }
  /* Fight again and Replay build the lanes again: the button pressed keeps the keyboard's focus and the open
     hit-by-hit lists stay open, written for the new fight (the audit's AC-01: focus fell to the page) */
  function rebuild(id) {
    const open = S.lanes.map((x, i) => { const d = $(`fx-log-${i}`); return !!(d && d.open); });
    build(true);
    open.forEach((o, i) => { const d = $(`fx-log-${i}`); if (o && d && !d.open) d.open = true; });
    const b = $(id);
    if (b) b.focus();
  }
  function wire() {
    $("fx-play").addEventListener("click", () => {
      if (allDone()) { S.playing = true; rebuild("fx-play"); playText(); kick(); return; }   // Replay: the same fight from the start
      S.playing = !S.playing; playText(); kick();
    });
    $("fx-step").addEventListener("click", () => { S.playing = false; step(); playText(); });
    $("fx-speed").addEventListener("change", e => { S.speed = +e.target.value || 1; });
    $("fx-again").addEventListener("click", () => { S.k++; S.playing = !S.still; rebuild("fx-again"); });
    $("fx-skip").addEventListener("click", skipToKill);
    S.lanes.forEach((x, i) => {
      const d = $(`fx-log-${i}`);
      if (d) d.addEventListener("toggle", () => { if (d.open) logList(x, i); });
    });
  }
  // the life left at the lane's current frame: the hits so far and the damage over time drained so far
  function lifeAt(x) {
    if (x.F.killF >= 0 && S.frame >= x.F.killF) return 0;
    return Math.max(0, x.F.life - x.dmg - x.dot);
  }
  function paint(x, i, first) {
    if (x.F.none) return;
    S.frame = x.f || 0;
    const L = lifeAt(x), life = x.F.life;
    const bar = $(`fx-bar-${i}`), lt = $(`fx-lt-${i}`), st = $(`fx-st-${i}`);
    if (bar) bar.style.width = `${(100 * L / life).toFixed(2)}%`;
    if (lt) lt.textContent = `${nf0.format(Math.ceil(L / 256))} of ${nf0.format(pts(life))} life`;
    const dead = x.F.killF >= 0 && S.frame >= x.F.killF;
    if (dead && !x.done) {
      x.done = true;
      st.innerHTML = `<b>Killed in ${secs(x.F.killF + 1)}</b> with ${countText(x)}<span class="fx-avg" id="fx-avg-${i}">${avgText(x)}</span>`;
      /* said for a screen reader (the running time above changes every frame, so it isn't a live region): this kill
         alone, and once every lane is done who killed it when (the audit's AC-03: each kill had repeated every
         earlier one) */
      const live = $("fx-live");
      if (live && !first) {
        let say = `${whoOf(x.l)} killed the monster in ${secs(x.F.killF + 1)}.`;
        const dead2 = S.lanes.filter(y => !y.F.none && y.F.killF >= 0);
        if (dead2.length > 1 && allDone()) {
          const at = new Map();
          dead2.slice().sort((p, q) => p.F.killF - q.F.killF).forEach(y => { const t = secs(y.F.killF + 1); at.set(t, (at.get(t) || []).concat(shortWho(y.l))); });
          say += ` All done: ${[...at].map(([t, w], j) => `${j ? "then " : ""}${andList(w)} in ${t}`).join(", ")}.`;
        }
        live.textContent = say;
      }
    } else if (!dead && (first || !x.done)) {
      // (and how long it takes on average, so a long fight says so from the start: the audit's UX-06)
      const about = x.own && x.own.n >= x.own.N && x.own.n ? x.own.sum / x.own.n : x.F.avg;
      st.innerHTML = x.F.killF < 0 ? `${secs(S.frame)}: it doesn't die within ${nf0.format(x.F.hits)} ${x.F.unit}s`
        : `${secs(S.frame)} of about ${nf1.format(about)} s, ${countText(x)}`;
    }
  }
  /* what a lane counts: its hits, casts, traps... ; a rotation's each skill's plays (the audit's UX-07: they were counted
     together), Dark Pact's cycles with their casts (UX-08: a cycle had been counted as a cast) */
  function countText(x) {
    const n = x.n || 0, c = x.l.E.fr && x.l.E.fr.cast;
    if (x.ws) {
      const names = [x.l.E.attack.label].concat(x.ws.map(y => y.l.E.attack.label)), cnt = x.nw || [];
      return andList(names.map((nm, j) => (j === 0 || cnt[j] ? `${esc(nm)} ${timesWord(cnt[j] || 0)}` : "")).filter(Boolean));
    }
    if (c && c.cycle > 1 && !c.dsentry) return `${nf0.format(n)} cycle${n === 1 ? "" : "s"} (${nf0.format(n * c.cycle)} casts)`;
    return `${nf0.format(n)} ${x.F.unit}${n === 1 ? "" : "s"}`;
  }
  /* under a kill: the average of the lane's own fights, once worked out, beside the page's kill time, named as such
     (the audit's MO-01 / MO-02, the author's pick, 2026-11-27: the page counts a cast's damage when it's cast and an
     attack's whole last attack, the lane each hit when it lands, so the two differ: a spell's fights always take longer) */
  function avgText(x) {
    const page = `the page&rsquo;s kill time${x.l.E.attack.kind === "charge" ? " (strikes only)" : ""} is ${nf1.format(x.F.avg)} s`;
    const o = x.own && x.own.n >= x.own.N && x.own.n ? `${x.own.n} fight${x.own.n === 1 ? "" : "s"} here average ${nf1.format(x.own.sum / x.own.n)} s; ` : "";
    return o ? o + page : page.charAt(0).toUpperCase() + page.slice(1);
  }
  /* each lane's own average: the kills of fights 1 to N (N the page's own count of runs for the build, at most 20),
     each worked out as the lane is (laneOf with that fight's number), a little at a time while the page is idle; kept
     by the lane's build and monster, so Fight again shows it at once */
  const AVG_N = 20, OWN = new Map();
  function averages() {
    const sig = S.sig, jobs = [];
    S.lanes.forEach((x, i) => {
      if (x.F.none || x.F.killF < 0) return;
      const key = signature([x.l]), had = OWN.get(key);
      if (had) { x.own = had; return; }
      x.own = { N: Math.min(AVG_N, api.killRuns(x.l.E, x.F.life)), n: 0, sum: 0, key };
      for (let k = 0; k < x.own.N; k++) jobs.push([x, i, k]);
    });
    if (!jobs.length) return;
    const idle = window.requestIdleCallback ? (f => requestIdleCallback(f, { timeout: 400 })) : (f => setTimeout(() => f({ timeRemaining: () => 8 }), 40));
    /* (a fight that takes long to work out, a boss's thousands of casts, waits while the clock runs: one would hold a
       frame up; the audit's batch 4) */
    let heavy = false;
    const busy = () => S.playing && !allDone() && !S.hold;
    const next = dl => {
      if (S.sig !== sig || !S.built) return;   // (rebuilt meanwhile: that build starts its own)
      if (heavy && busy()) { setTimeout(() => idle(next), 500); return; }
      const t0 = performance.now();
      while (jobs.length) {
        const [x, i, k] = jobs.shift();
        let kf = -1;
        if (k === S.k) kf = x.F.killF;
        else {
          const k0 = S.k, t1 = performance.now();
          S.k = k;
          try { kf = laneOf(x.l, i).F.killF; } catch (e) { kf = -1; } finally { S.k = k0; }
          if (performance.now() - t1 > 30) heavy = true;
        }
        if (kf >= 0) { x.own.n++; x.own.sum += (kf + 1) / FPS; } else x.own.N--;
        if (x.own.n >= x.own.N) {
          OWN.set(x.own.key, x.own);
          const el = $(`fx-avg-${i}`);
          if (el) el.innerHTML = avgText(x);
        }
        if (performance.now() - t0 > Math.max(4, dl.timeRemaining())) break;
      }
      if (jobs.length) idle(next);
    };
    idle(next);
  }
  /* the numbers over the monster's head (the audit of 2026-11-27, UX-01: at 4x a dozen sat on top of each other, a
     Frozen Orb's bolts merged into what read as seven-digit hits). Each rises POP_RISE pixels at a steady pace and
     fades over a second of the fight's clock (1 s at 1x, a quarter at 4x, at least 0.35 s), so the numbers keep the
     gaps they start with; a new one starts once the newest has risen a line (POP_LINE). Plain numbers landing within
     POP_JOIN game frames of the newest, or before it has risen a line, add into it (a spell's bolts, a fast attack's
     hits at 4x: the hit-by-hit list keeps each); a word (Crit, Miss) takes its place, the one too close making way.
     Hidden from screen readers: the list has them all (AC-04) */
  const POP_JOIN = 3, POP_LINE = 17, POP_RISE = 100;
  function pop(x, i, text, words, cls) {
    const sc = $(`fx-scene-${i}`);
    if (!sc || S.ff) return;
    const dur = Math.max(350, 1000 / S.speed), now = performance.now(), pops = (x.pops || (x.pops = [])).filter(q => q.el.isConnected && now - q.t < q.dur);
    x.pops = pops;
    const v = /^[\d,]+$/.test(text) && !(words && words.length) && !cls ? +text.replace(/,/g, "") : NaN;
    // where it starts: the monster's head, low enough on the stage to rise without leaving it (a boss's head is near its top)
    const scale = sc.clientHeight / (x.H || H) || 1, mx = x.place.mon[0], my = Math.max(x.place.mon[1] + x.place.box[1] - 4, 0.75 * POP_RISE / scale);
    // (no number starts within a line of another: the ones that haven't risen a line yet, measured, are "close")
    const top0 = sc.getBoundingClientRect().top + my * scale;
    const close = S.still ? [] : pops.filter(q => q.el.getBoundingClientRect().top - top0 > -POP_LINE), plain = close.filter(q => !isNaN(q.v));
    const newest = pops[pops.length - 1];
    const join = q => { q.v += v; q.f = S.frame; q.el.firstChild.textContent = nf0.format(q.v); };
    if (!isNaN(v)) {
      if (plain.length) { join(plain[plain.length - 1]); return; }
      if (newest && !isNaN(newest.v) && !S.still && S.frame - newest.f <= POP_JOIN) { join(newest); return; }
      if (close.length) return;   // (a word just showed: this number waits in the list)
    } else {
      if (close.some(q => isNaN(q.v))) return;   // (a word just showed: this one waits in the list)
      close.forEach(q => q.el.remove());         // (a word over a plain number: the number makes way)
    }
    const p = document.createElement("span");
    p.className = "fx-pop" + (cls ? " " + cls : "");
    p.setAttribute("aria-hidden", "true");
    p.style.left = `${(100 * mx / (x.W || W)).toFixed(2)}%`;
    p.style.top = `${(100 * Math.max(0, my) / (x.H || H)).toFixed(2)}%`;
    p.style.setProperty("--dur", `${Math.round(dur)}ms`);
    p.innerHTML = `<span>${esc(text)}</span>` + (words && words.length ? `<small>${esc(words.join(", "))}</small>` : "");
    // with reduced motion the numbers don't rise, so one shows at a time (the next replaces it) rather than piling up
    if (S.still) sc.querySelectorAll(".fx-pop").forEach(q => q.remove());
    sc.appendChild(p);
    pops.push({ el: p, t: now, f: S.frame, v, dur });
    setTimeout(() => p.remove(), dur + 100);
  }
  /* Freezing and chill (traced 2026-11-27, trace T9; the author's choice of 11-26: "Model and draw it", the
     page's numbers unchanged). A hit carries a chill length and a freeze length (frames): a skill's own is its ELen
     with its ELevLen1-3 a level by bands (2-8, 9-16, then on) and its ELenSymPerCalc %, a melee hit's or a missile's
     adds the gear's cold length x the skill's SrcDam / 128 (a spell takes the skill's alone). Ice Blast's length and
     Glacial Spike's auralencalc freeze, as do Ice Arrow's (with the gear's) and Freezing Arrow's explosion (12 + the
     gear's, hit or miss); Ice Barrage's auralencalc chills; Blades of Ice's first charge chills its 250, its waves and
     bolts 100, Phoenix Strike's third 100. The page has no cold length for gear: cold on gear is taken as 2 seconds (a
     stand-in: items carry 25-250 frames, which add up, Thul 75, a sapphire 25-75; trace T12, the audit's GA-19),
     and Cold Enchant's 25 frames are added to it (lengths add: until then Cold Enchant's replaced the gear's). On the monster: both lengths x the cold resistance's share (immune: none), then a
     chill none at its ColdEffect 0, else / Hell's MonsterColdDivisor (at least 1); a freeze on a boss or a unique
     chills it instead, else none at ColdEffect 0 or more, else / MonsterFreezeDivisor; each pushes its state's end
     later, never sooner. Frozen, the monster stands still (its frame held: how the client holds it isn't traced, the
     game stops it acting), takes no hit recovery and stands anew (NU) when it thaws; chilled, its animations run at its
     ColdEffect (Holy Freeze's slow on top). It shatters as it dies (no body: the ice break of its Height and smoke)
     when frozen, or chilled with its last chill's 20% roll (none with MonStats2 deadCol) */
  const COLD_GEAR = 50, COLD_ENCHANT = 25;
  function skillLen(sk, id, lvl, ctx) {
    const L1 = +sk.ELevLen1 || 0, L2 = +sk.ELevLen2 || 0, L3 = +sk.ELevLen3 || 0;
    let n = +sk.ELen || 0;
    if (lvl > 1) n += Math.min(lvl - 1, 7) * L1;
    if (lvl > 8) n += Math.min(lvl - 8, 8) * L2;
    if (lvl > 16) n += (lvl - 16) * L3;
    if (sk.ELenSymPerCalc) n += Math.trunc(n * (+api.Calc.value(id, "ELenSymPerCalc", lvl, ctx) || 0) / 100);
    return n;
  }
  // each landed hit's (or explosion's) chill and freeze lengths before the monster's side: [{f, chill, freeze, E}]
  function coldApps(x) {
    const out = [];
    (x.F.all || x.F.moments || []).forEach(m => {
      const y = m.w && x.ws ? x.ws[m.w - 1] : x, E = y.l.E, b = y.l.b;
      if (!E || !E.attack) return;
      const k = E.attack.k, id = E.attack.id, sk = api.SK[id] || {}, ev = m.ev || {};
      const lvl = Math.max(1, Math.min(60, +b.s.lvl || 1)), ctx = api.ctxOf ? api.ctxOf(b, E.attack) : {};
      const landed = m.w ? !(ev.miss && !(ev.loss > 0)) : !ev.miss;
      const spellCold = (ev.parts || []).some(r => r.x && r.x.el === "cold" && r.d.length);
      const ench = +b.buf.cench > 0, gearCold = [b.g, b.w].some(o => o && +o.cmax > 0), gear = (gearCold ? COLD_GEAR : 0) + (ench ? COLD_ENCHANT : 0);
      const src = (+sk.SrcDam || 128) / 128;
      let chill = 0, freeze = 0;
      if (k === "iceblast") freeze = skillLen(sk, id, lvl, ctx);
      else if (k === "glacialspike") freeze = +api.Calc.value(id, "auralencalc", lvl, ctx) || 0;
      else if (k === "icebarrage") chill = +api.Calc.value(id, "auralencalc", lvl, ctx) || 0;
      else if (k === "icearrow") freeze = landed ? Math.trunc((skillLen(sk, id, lvl, ctx) + gear) * src) : 0;
      else if (k === "freezingarrow") { freeze = skillLen(sk, id, lvl, ctx) + gear; chill = landed ? gear : 0; }
      else if (k === "coldarrow") chill = landed ? Math.trunc((skillLen(sk, id, lvl, ctx) + gear) * src) : 0;
      else if (E.spell) chill = spellCold ? skillLen(sk, id, lvl, ctx) : 0;
      else if (landed && gear) chill = Math.trunc(gear * src);
      if (chill > 0 || freeze > 0) out.push({ f: m.f, chill, freeze, E });
    });
    // a charge-up's releases: Blades of Ice's first charge its skill's chill, its waves and bolts 100; Phoenix Strike's
    // third (its chaos ice) 100
    const k = x.l.E && x.l.E.attack ? x.l.E.attack.k : "";
    if (x.chg && (k === "boi" || k === "phx")) {
      const sk = api.SK[x.l.E.attack.id] || {}, lvl = Math.max(1, +x.l.b.s.lvl || 1);
      chargeLog(x).rel.forEach(q => {
        const c = k === "boi" ? (q.stage === 1 ? skillLen(sk, x.l.E.attack.id, lvl, {}) : 100) : q.stage === 3 ? 100 : 0;
        if (c > 0) out.push({ f: q.f, chill: c, freeze: 0, E: x.l.E });
      });
    }
    return out.sort((a, b) => a.f - b.f);
  }
  function coldLog(x) {
    if (x.coldLog) return x.coldLog;
    const I = IX(), cd = (I.mons[x.mon.id] || [])[7] || [0, 0, 0], ce = cd[0], T = x.l.T, div = (I.cold && I.cold.div) || [4, 4];
    const boss = !!cd[2] || ["unique", "superunique", "boss", "lesser", "mapboss"].includes(T.kind);
    const chill = [], freeze = [], rolls = [], rnd = api.mulberry32(6007 + S.k * 131 + x.i), veng = !!(x.l.E && x.l.E.attack && x.l.E.attack.veng);
    const push = (W, a, n) => { if (n <= 0) return; const L = W[W.length - 1]; if (L && a <= L[1]) L[1] = Math.max(L[1], a + n); else W.push([a, a + n]); };
    const chillOn = (f, len) => {
      if (len <= 0 || ce === 0) return;
      push(chill, f, ce < 0 ? Math.max(1, Math.floor(len / div[0])) : len);
      // (the shatter state, rolled again at every chill; PD2 takes it off after every landed Vengeance hit, so a
      // Vengeance kill never shatters from it: trace T12)
      rolls.push([f, !cd[1] && rnd() < 0.2 && !veng]);
    };
    coldApps(x).forEach(a => {
      const R = a.E && a.E.ER && a.E.ER.cold, mult = R ? R.mult : 1;
      chillOn(a.f, Math.trunc(a.chill * mult));
      const z = Math.trunc(a.freeze * mult);
      if (z > 0) { if (boss) chillOn(a.f, z); else if (ce < 0) push(freeze, a.f, Math.floor(z / div[1])); }
    });
    const on = (W, f) => W.some(([a, b]) => f >= a && f < b);
    const kf = x.F.killF, last = rolls.filter(r => r[0] <= kf).pop();
    const shatter = kf >= 0 && (on(freeze, kf) || (on(chill, kf) && !!last && last[1]));
    // Holy Freeze's slow (its state on the monster: -dm34 to its animation rates)
    const b = x.l.b, hfl = (holiesOf(b).find(A => A.k === "freeze") || {}).lvl || 0, hf = hfl > 0 ? +api.Calc.value(114, "aurastatcalc3", hfl, {}) || 0 : 0;
    return (x.coldLog = { chill, freeze, ce, hf, shatter, on, cum: [0] });
  }
  const frozenAt = (x, f) => { const C = coldLog(x); return C.on(C.freeze, f); };
  // a monster shattering as it dies (the client, trace T9): no body, the ice break of its Height (missile 271 +
  // MonStats2 Height) and icebreaksmoke on it, each in a direction of its own (the lane's draws), played once
  function shatterFx(x, ctx, mx, my, age) {
    const I = IX(), C = I.cold || {}, h = Math.max(0, Math.min(4, x.mon.h === undefined ? 2 : +x.mon.h)), rnd = api.mulberry32(7121 + S.k * 13 + x.i);
    [(C.break || {})[String(h)], C.smoke].forEach(k => {
      const e = k ? I.mis[k] : null, d = rnd();
      if (!e || age < 0 || age >= Math.max(1, e.r)) return;
      const sp = G().iasSprite(e.c), n = sp && sp.geo ? sp.geo.dirs || 0 : 0;
      if (n > 1) G().drawDirShot(ctx, e, Math.floor(d * n), misFrame(e, age), Math.round(mx), Math.round(my), e.t);
      else G().drawFx(ctx, e, misFrame(e, age), Math.round(mx), Math.round(my), e.t);
    });
  }
  // the monster's animation from frame a to b in game frames of its own: none while frozen, slower while chilled
  function animSpan(x, a, b) {
    const C = coldLog(x);
    if (!C.chill.length && !C.freeze.length && !C.hf) return b - a;
    const sp = f => (C.on(C.freeze, f) ? 0 : Math.max(0, 1 + (C.on(C.chill, f) ? C.ce : 0) / 100 + C.hf / 100));
    const cum = C.cum;
    for (let f = cum.length - 1; f < Math.max(a, b); f++) cum.push(cum[f] + sp(f));
    return cum[Math.max(0, b)] - cum[Math.max(0, a)];
  }
  // the monster's mode at the lane's frame: dying and dead at the kill, hit for its get-hit animation's frames
  function monFrame(x) {
    const M = G().monster(x.mon.set);
    if (!M) return null;
    const F = S.frame;
    if (x.F.killF >= 0 && F >= x.F.killF) {
      const dt = M.modes.DT, n = dt ? Math.floor((F - x.F.killF) * dt.rate / 256) : 0;
      if (dt && n < dt.f) return { mode: "DT", f: n };
      return { mode: M.modes.DD ? "DD" : dt ? "DT" : "NU", f: M.modes.DD ? 0 : dt ? dt.f - 1 : 0 };
    }
    // (thawed: it stands anew, NU from the freeze's end)
    const thaw = coldLog(x).freeze.filter(([a, b]) => b <= F && b > x.monMode.t0).pop();
    if (thaw) x.monMode = { m: "NU", t0: thaw[1] };
    const mm = x.monMode, m = M.modes[mm.m] || M.modes.NU, n = Math.floor(animSpan(x, mm.t0, F) * m.rate / 256);
    if (mm.m === "GH" && n >= m.f) { x.monMode = { m: "NU", t0: F }; return monFrame(x); }
    return { mode: mm.m, f: mm.m === "NU" ? n % M.modes.NU.f : n };
  }
  // the attacker's animation frame at the lane's frame: the round (or charge-up / finisher step) it is in
  // standing (its NU at its own speed), t game frames in
  function standFrame(x, t) {
    const a = x.nu && IX().nu[x.nu];
    return a ? { key: x.nu, f: Math.floor(Math.max(0, t) * a[1] / 256) % a[0] } : null;
  }
  // a cast's frame i game frames into it (null past its own frames: the character stands out the cooldown)
  function castFrame(x, i) {
    const c = x.cast;
    if (i < 0 || i >= c.own) return null;
    const pos = Math.floor(i * c.rate / 256);
    if (c.steps) { const st = c.steps[Math.min(c.steps.length - 1, pos)]; return { key: x.tok + st[0] + x.wc, f: st[1] }; }
    return { key: x.tok + "SC" + x.wc, f: pos };
  }
  /* the frame a lane's cast started on at frame f (no later than the kill): its own casts' starts between cooldowns
     (its fight's steps), else one a round; -1 before the first */
  function castAt(x, f, end) {
    const g = Math.min(f, end);
    if (x.starts) { let s = -1; for (const t of x.starts) { if (t <= g) s = t; else break; } return s; }
    const n = Math.max(1, Math.round(x.l.E.fr.frames / (x.cast ? x.cast.cycle : 1)));
    return Math.floor(g / n) * n;
  }
  /* between cooldowns: the skill's cast (or attack), the other skills' in its wait, each at its play's frame and its
     own speed, standing between; after the kill the play it is in plays out */
  function weaveFrame(x) {
    const F = x.F, f = S.frame, end = F.killF >= 0 ? F.killF : Infinity;
    let s = null;
    for (const q of F.steps) { if (q.t0 <= Math.min(f, end)) s = q; else break; }
    if (!s) return standFrame(x, f);
    const y = s.w ? x.ws[s.w - 1] : x, i = f - s.t0;
    if (y.cast) return castFrame(y, i) || standFrame(x, i - y.cast.own);
    const tl = s.w ? y.tl : F.tl;
    if (y.R && tl && tl.length && i < tl.length) return G().shown(y.R, tl[i], f);
    return standFrame(x, i - (tl ? tl.length : 0));
  }
  function meFrame(x) {
    if (x.ws) return weaveFrame(x);
    const off = x.runIn ? x.runIn.n : 0;
    if (off && S.frame < off) {   // Charge's run (its sequence's RN steps, a frame each)
      const key = x.tok + "RN" + x.wc, a = IX().sprites && IX().sprites.includes(key);
      return a ? { key, f: S.frame % 8 } : standFrame(x, S.frame);
    }
    const F = x.F, fr = x.l.E.fr, f = S.frame - off, end = (F.killF >= 0 ? F.killF : Infinity) - off;
    if (x.trapL) {   // her traps: her throw (S2) at each laying, standing between
      const ls = x.layStarts || [], lj = lowerBound(ls, Math.min(f, end) + 1, v => v) - 1, L = lj >= 0 ? ls[lj] : undefined;
      if (L === undefined || !x.layTl || !x.layTl.length) return standFrame(x, f);
      const i = f - L;
      return i < x.layTl.length ? G().shown(x.R, x.layTl[i], f) : standFrame(x, i - x.layTl.length);
    }
    if (x.cast && x.cast.once) return castFrame(x, f) || standFrame(x, f - x.cast.own);   // Thunder Storm: cast once
    if (x.cast) {   // a spell: a cast every round, standing out the rest (a cooldown); after the kill the cast plays out
      // (Dark Pact's cycle: its curses cast again, then Dark Pact: a cast each of its share of the cycle)
      const n = Math.max(1, Math.round(fr.frames / x.cast.cycle)), at = f > end ? Math.floor(end / n) * n : Math.floor(f / n) * n;
      return castFrame(x, f - at) || standFrame(x, f - at - x.cast.own) || standFrame(x, f);
    }
    if (!x.R) return standFrame(x, f);
    let R = x.R, tl = F.tl, i;
    if (F.steps.length) {
      let s = null;
      for (const st of F.steps) { if (st.t0 <= f) s = st; else break; }
      if (!s) s = F.steps[0];
      const fin = x.l.E.fof && x.l.E.fof.fin;
      if (s.fin && fin && fin.E.fr && fin.E.fr.r) { R = fin.E.fr.r; tl = F.finTl; }
      i = f - s.t0;
    } else i = f % Math.max(1, fr.frames);
    if (f > end) {   // after the kill: the attack runs to its end, then the character stands
      const ki = F.steps.length ? end - (F.steps.filter(s => s.t0 <= end).pop() || { t0: 0 }).t0 : end % Math.max(1, fr.frames);
      i = ki + (f - end);
      if (i >= tl.length) return standFrame(x, i - tl.length) || G().shown(R, tl[tl.length - 1], f);
    }
    const e = tl[Math.min(tl.length - 1, Math.max(0, i))];
    return G().shown(R, e, f);
  }
  /* Feral Rage's and Maul's look by the charges held (their setfunc 16, traced 2026-11-27, trace T3): one front
     and one back of five overlays, row (charges - 1) x 5 / max, charges and max (the skill's calc2 at its level) each at
     most 5, a new count starting its row again. The lane's own: the hits landed so far (none before the first: the state
     isn't on yet); a werebear's held Maul charges under another attack: the field's count. A stage is a state of its own
     here ("maul#2": its two overlays) */
  function stageOf(x, s, f) {
    const I = IX(), Z = I.sizes && I.sizes[s];
    if (!Z) return s;
    const own = x.atk && x.atk.state === s;
    const c = own ? nearM(x).filter(m => m.f <= f && !m.more && !(m.ev && m.ev.miss)).length : +x.l.b.buf.maul || 0;
    if (c < 1) return null;
    const lvl = Math.max(1, Math.min(60, +x.l.b.s.lvl || 1)), max = Math.min(5, own ? Z.max[lvl - 1] || 5 : 5);
    const row = Math.floor((Math.min(5, c) - 1) * 5 / Math.max(1, max)), key = s + "#" + row;
    if (!I.states[key]) I.states[key] = [Z.f[row], Z.b[row]].filter(Boolean);
    return key;
  }
  /* the build fields' own (traced 2026-11-27, trace T4): a Druid's Heart of Wolverine spirit standing where it
     was cast (here behind her: the game makes it at the cast's spot and it stays), a Barbarian's Grim Ward (his
     corpse's ward, a normal corpse's medium one, standing its 40 seconds: here behind him); drawn before the units in
     front of them */
  function fieldsBack(x, ctx) {
    const I = IX(), b = x.l.b, f = S.frame;
    const at = (ox, oy) => { const [sx, sy] = G().toScreen(ox, oy); return [Math.round(x.place.me[0] + sx), Math.round(x.place.me[1] + sy)]; };
    const sp = (I.spells["236"] || {}).spirit;
    if (sp && sp.sets && b.cls === "dru" && +b.aur.wolv > 0) {
      const set = Object.values(sp.sets)[0], M = G().monster(set), m = M && M.modes.NU;
      if (m) { const [px, py] = at(-2, -1); G().shadow(ctx, px, py, 10); G().drawMonster(ctx, set, 3, x.mon.act, "NU", Math.floor(f * m.rate / 256) % m.f, px, py, ""); }
    }
    const w = (I.spells["150"] || {}).ward, e = w ? I.mis[w] : null;
    if (e && b.cls === "bar" && +b.aur.grim > 0) { const [px, py] = at(-1, -2); G().drawFx(ctx, e, misFrame(e, f), px, py, e.t); }
  }
  /* Sanctuary's gleams (its state's client active function, on every unit with the state: about one every 24.5 frames
     at a random spot within 18 sub-tiles, each living its Range; PD2 puts the state on the monsters in range too) and
     Holy Freeze's chill starting on the monster as the fight begins (its state's start look) */
  function fieldsTop(x, ctx) {
    const I = IX(), b = x.l.b, f = S.frame, [mx, my] = x.place.mon, on = holiesOf(b);
    if (!on.length) return;
    const g = (I.spells["119"] || {}).gleam, e = g && on.some(A => A.k === "sanc") ? I.mis[g.m] : null;
    if (e) [x.place.me, x.place.mon].forEach((c, ci) => {
      for (let t = Math.max(0, f - Math.max(1, e.r) + 1); t <= f; t++) {
        const r = api.mulberry32(t * 131 + ci * 7 + x.i * 977);
        if (r() * g.every >= 1) continue;
        const a = r() * 6.283, d = Math.sqrt(r()) * g.r, [sx, sy] = G().toScreen(Math.cos(a) * d, Math.sin(a) * d);
        G().drawFx(ctx, e, misFrame(e, f - t), Math.round(c[0] + sx), Math.round(c[1] + sy), e.t);
      }
    });
    const ts = (I.spells["114"] || {}).tstart, o = ts && on.some(A => A.k === "freeze") && I.ov ? I.ov[ts] : null;
    if (o) { const k = Math.floor(f * o.rate / 16); if (k < Math.max(1, o.n) && !(x.F.killF >= 0 && f >= x.F.killF)) G().drawFx(ctx, o, k, Math.round(mx + o.dx), Math.round(my + o.dy), o.trans, [mx, my]); }
  }
  /* the lights (traced 2026-11-27, trace T5; the stage's light map): each drawn missile's row carries its light
     (li: radius, color, flicker, name) and each overlay's (lo: start radius, radius, color, name), so the stage lights
     them where they are drawn */
  const lightOf = n => { const L = IX().lights && IX().lights.m[n]; return L ? L.concat([n]) : null; };
  function lightRows() {
    const I = IX(), L = I.lights || { m: {}, o: {} };
    Object.keys(I.mis || {}).forEach(n => { if (L.m[n]) I.mis[n].li = L.m[n].concat([n]); });
    Object.keys(I.ov || {}).forEach(n => { if (L.o[n]) I.ov[n].lo = L.o[n].concat(["ov:" + n]); });
  }
  /* the area's light for the lane's monster: [intensity, red, green, blue], its map's or its boss's area, else its
     act's outdoors (I.amb) */
  function ambOf(x) {
    const A = IX().amb || {}, T = x.l.T;
    return (T.map && (A.maps || {})[T.map]) || (A.mons || {})[x.mon.id] || (A.acts || {})[x.mon.act] || [255, 255, 255, 255];
  }
  /* the lane's own lights: the character's (radius 13, white), the monster's (MonStats2 Light in its color; a
     champion's radius 7 in a random color, a unique's radius 7 in its MonStats2 color, the client's monster mod), a
     spell's cast glow on the caster (its cltmissile's light from 1 sub-tile, growing a sub-tile a frame, while the
     cast plays) */
  function ownLights(x, ax, ay, mx, my, dead, me) {
    const I = IX(), LI = I.light || {}, row = I.mons[x.mon.id] || [], T = x.l.T;
    G().light(ax, ay, { r: LI.me || 13, c: [255, 255, 255], s: LI.me || 13, id: "me", n: "player" });
    if (!dead) {
      const own = row[6] || null, kind = T.kind;
      let q = own ? { r: own[0], c: [own[1], own[2], own[3]] } : null;
      if (kind === "champion") {   // (three random bytes: the fight's monster, the same in every lane)
        const r = api.mulberry32(4421 + S.k * 7919);
        q = { r: LI.champ || 7, c: [Math.floor(r() * 256), Math.floor(r() * 256), Math.floor(r() * 256)] };
      } else if (kind === "unique" || kind === "superunique") q = { r: LI.champ || 7, c: own ? [own[1], own[2], own[3]] : [0, 0, 0] };
      if (q && q.r > 0) G().light(mx, my, Object.assign(q, { s: q.r, id: "mon", n: "monster" }));
    }
    // (each cast's own: the game frees it at the cast's end and makes the next one at 1)
    const g = x.cast && me && me.key !== x.nu ? ((I.lights || {}).g || {})[String(x.l.E.attack.id)] : null, gl = g ? lightOf(g) : null;
    if (gl) G().light(ax, ay, { r: gl[0], c: [gl[1], gl[2], gl[3]], s: 1, id: "glow" + castAt(x, S.frame, x.F.killF >= 0 ? x.F.killF : Infinity), n: gl[5] });
  }
  // the families that draw what their missiles become themselves
  const SELF = ["meteor", "wall", "disc", "stream", "storm", "comb", "delay", "corpse", "curse", "orbit", "fall", "boulder", "volcano", "cracks", "trap", "mind", "shield"];
  // one lane drawn as the game draws it (traced 2026-11-19 for the IAS Calculator: the units back to front by how low
  // their feet are, each whole; the monster stands lower, so it comes last; a shot on its way before it)
  function draw(x) {
    S.frame = x.f || 0;
    const cv = $(`fx-cv-${x.i}`);
    if (!cv || x.F.none) return;
    const ctx = cv.getContext("2d"), LW = x.W || W, LH = x.H || H;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, LW, LH);
    const fl = G().floor(x.mon.fl || x.mon.act);
    if (fl) for (let ox = (LW - fl.width) / 2 % fl.width - fl.width; ox < LW; ox += fl.width)
      for (let oy = (LH - fl.height) / 2 % fl.height - fl.height; oy < LH; oy += fl.height) ctx.drawImage(fl, Math.round(ox), Math.round(oy));
    // the frame's lights: gathered from the lane drawn on a canvas that draws nothing, then the floor lit
    const [ax, ay] = mePos(x), I = IX();
    G().lightsBegin(x.lmem || (x.lmem = {}), ax, ay, ambOf(x), (I.light || {}).gamma || 1);
    units(x, G().NULL_CTX, true);
    G().lightsEnd(S.frame, x.i * 977 + S.k * 31);
    G().lightFloor(ctx, LW, LH);
    units(x, ctx, false);
    G().lightsOff();
  }
  // the lane's units and looks, back to front (gather: the lights' pass)
  function units(x, ctx, gather) {
    const [ax, ay] = mePos(x), [mx, my] = x.place.mon;
    G().shadow(ctx, ax, ay, 20);
    if (!(x.F.killF >= 0 && S.frame >= x.F.killF && coldLog(x).shatter)) G().shadow(ctx, mx, my, Math.max(20, (x.place.box[2] - x.place.box[0]) / 3));
    const me = meFrame(x), f = S.frame;
    // the burning ground: each flame where its feet are, before the units lower on the stage
    const ground = groundOf(x).concat(...(x.ws || []).map(groundOf)), back = ground.filter(g => g.y <= ay), mid = ground.filter(g => g.y > ay && g.y <= my), front = ground.filter(g => g.y > my);
    back.forEach(g => g.draw(ctx));
    const L = x.looks, meS = auraTurn(L.me.filter(s => !(s in L.from) || f >= L.from[s]), f).map(s => stageOf(x, s, f)).filter(Boolean);
    const inWin = w => (Array.isArray(w[0]) ? w.some(([a, b]) => f >= a && f < b) : f >= w[0] && f < w[1]);   // (a list: a debuff that comes and goes)
    // (a monster of MonStats2 noOvly shows no overlay at all: trace T10)
    const monS = x.mon.nov ? [] : auraTurn(L.mon.concat(Object.keys(L.win).filter(s => inWin(L.win[s]))), f);
    // its overlays lifted by its OverlayHeight's row of Overlay.txt's Height1-4, 0 = 75 pixels (-1 here); trace T10, the
    // audit's GA-03: until then by its Height, which sat the act bosses' curses inside their bodies
    const mf = monFrame(x), dead = x.F.killF >= 0 && f >= x.F.killF, mh = x.mon.oh > 0 ? Math.min(4, x.mon.oh) - 1 : -1;
    if (gather) ownLights(x, ax, ay, mx, my, dead, me);
    const shat = dead && coldLog(x).shatter;
    const drawMon = () => {
      if (shat) { shatterFx(x, ctx, mx, my, f - x.F.killF); return; }
      if (!dead) G().drawStates(ctx, monS, f, mx, my, mh, true);
      if (mf) G().drawMonster(ctx, x.mon.set, x.mon.table, x.mon.act, mf.mode, mf.f, Math.round(mx), Math.round(my), dead ? "" : colorAt(x, f));
      if (!dead) G().drawStates(ctx, monS, f, mx, my, mh, false);
    };
    const below = ay > my;   // (whirling past the monster: she is drawn after it, the units' order)
    if (below) drawMon();
    if (x.runIn && f < x.runIn.n && me) {   // Charge's trails: two fainter copies behind her
      [[2, 0.45], [4, 0.2]].forEach(([k, a]) => { const [px, py] = mePos(x, f - k); ctx.save(); ctx.globalAlpha = a; G().drawAttacker(ctx, me.key, me.f, Math.round(px), Math.round(py), x.look); ctx.restore(); });
    }
    fieldsBack(x, ctx);
    G().drawStates(ctx, meS, f, ax, ay, 1, true);   // (a player's overlays are lifted by Height2)
    if (me) G().drawAttacker(ctx, me.key, me.f, Math.round(ax), Math.round(ay), x.look);
    G().drawStates(ctx, meS, f, ax, ay, 1, false);
    if (x.chg) chargeOrbFx(x, ctx, ax, ay);
    if (x.atk && x.atk.leap) leapFx(x, ctx, ax, ay);
    mid.forEach(g => g.draw(ctx));
    // (between cooldowns: the other skills' looks drawn with this one's, each from its own casts)
    const lanes = [x].concat(x.ws || []);
    /* the shots' and the spells' looks on either side of the monster by where their feet are, as the game draws its
       missiles among the units (the audit's GA-05: they had all been drawn behind it) */
    const looks = () => { lanes.forEach(y => { if (y.shot) shotsFx(y, ctx, ax, ay, mx, my); if (y.cast) castFx(y, ctx, ax, ay, mx, my); }); bloodFx(x, ctx, mx, my); };
    try {
      G().feetWithin(-Infinity, my);
      looks();
      if (!below) drawMon();
      G().feetWithin(my, Infinity);
      looks();
    } finally { G().feetWithin(null); }
    if (x.flash) {   // (the hit's flash as it flinches or dies: CV-01)
      const o = x.flash.o, k = Math.floor((f - x.flash.t0) * o.rate / 16);
      if (k >= 0 && k < Math.max(1, o.n) && !x.mon.nov) G().drawFx(ctx, o, k, mx + o.dx, my + o.dy + G().liftOf(o, mh), o.trans, [mx, my]);
    }
    lanes.forEach(y => { if (y.cast) { hitFx(y, ctx, mx, my); tovFx(y, ctx, mx, my); } });
    if (lanes.some(y => y.shot || y.atk || y.chg)) {
      const top = [];
      lanes.forEach(y => {
        if (y.shot) shotLand(y, top);
        if (y.atk) strikeFx(y, ctx, top);
        if (y.chg) chargeFx(y, top);
      });
      top.sort((p, q) => p.y - q.y).forEach(g => g.draw(ctx));
    }
    front.forEach(g => g.draw(ctx));
    lanes.forEach(y => { if (y.cast && !y.orb && !y.rain && !y.fan && !y.walk && !SELF.some(k => y.cast[k])) landedFx(y, ctx, mx, my); });
    fieldsTop(x, ctx);
  }
  // the shots on their way: each leaves its flight's frames before its hit lands
  /* a volley (Multiple Shot's): the game's fan (its server do 8, the one Ice Barrage and Holy Bolt use): each arrow aims
     at a point beside the monster, a sub-tile apart across the line to it (0, +1, -1, +2, ...), and flies its own way,
     drawn in its own direction; one that meets the monster stops there, the others fly on for their Range (the audit's
     GA-09: one picture turned 0.07 radians an arrow had been drawn) */
  function volleyOf(x, ax, ay, mx, my) {
    const m = (IX().mis || {})[x.shot.name], sp = m ? G().iasSprite(m.c) : null;
    if (!m || !/^MSD-/.test(m.c) || !sp || !sp.geo) return null;
    if (x.volley) return x.volley;
    const [wx, wy] = G().toWorld(mx - ax, my - ay), len = Math.hypot(wx, wy) || 1, u = [wx / len, wy / len], p = [-u[1], u[0]];
    const size = Math.max(1, Math.min(3, +x.l.T.size || 2)), v = m.v * G().MIS_PACE, cell = [Math.floor(0.5 + wx), Math.floor(0.5 + wy)];
    const inFoot = (cx, cy) => { const dx = Math.abs(cx - cell[0]), dy = Math.abs(cy - cell[1]); return size === 1 ? dx + dy === 0 : size === 2 ? dx + dy <= 1 : Math.max(dx, dy) <= 1; };
    const arrows = [];
    for (let k = 0; k < x.shot.n; k++) {
      const off = k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2), aim = [wx + p[0] * off, wy + p[1] * off];
      const al = Math.hypot(aim[0], aim[1]) || 1, dir = [aim[0] / al, aim[1] / al];
      let last = [0, 0], stop = Math.max(1, m.r);
      for (let t = 1; t <= m.r; t++) {
        const cc = [Math.floor(0.5 + dir[0] * v * t), Math.floor(0.5 + dir[1] * v * t)];
        if (cc[0] !== last[0] || cc[1] !== last[1]) { last = cc; if (inFoot(cc[0], cc[1])) { stop = t; break; } }
      }
      arrows.push({ dir, stop: k === 0 ? Math.max(stop, x.flight) : stop, file: G().fileDir(dir[0], dir[1], sp.geo.dirs || 1) });
    }
    return (x.volley = { m, v, arrows });
  }
  /* Split Throw (traces T4 B and T12, the audit's CV-02): its weapons fanned as Multiple Shot's arrows (aim
     points a sub-tile apart across the line to the monster, from +n/2 down), all at once, slowing in 5-frame bands
     (1.69, 1.43, 1.17, 0.91, 0.65, then 0.39 sub-tiles a frame: 30.8 in 29 frames); the first to cross the monster
     ends on it (they block each other on it for 3 frames), the others fly through to their end and come back down their
     own line (0.19, 0.58, 0.97, 1.36, 1.75, 2.14, then 2.25 a frame), over the monster again, to the thrower about 57
     frames after the throw. (The returns hit the monster in the game: the page doesn't count them yet) */
  const SPLIT_OUT = [1.69, 1.43, 1.17, 0.91, 0.65, 0.39], SPLIT_BACK = [0.19, 0.58, 0.97, 1.36, 1.75, 2.14, 2.25];
  const banded = (bands, t) => { let d = 0; for (let i = 1; i <= t; i++) d += bands[Math.min(bands.length - 1, Math.floor((i - 1) / 5))]; return d; };
  const splitOut = t => banded(SPLIT_OUT, Math.min(t, 29));
  // Split Throw's numbers (the page's returns, 2026-11-27): the throw's hit as its first weapon lands, each return that
  // lands as it comes back over the monster, 52-54 frames after the throw (trace T12)
  function splitThrowSplit(x, ev, f) {
    const total = ev.loss - overOf(ev.parts), rets = (ev.parts || []).filter(r => r.x && /^ret/.test(r.x.k || ""));
    const back = rets.reduce((t, r) => t + r.d.reduce((a, v) => a + v, 0), 0);
    const out = [{ f: f + x.flight, dmg: Math.max(0, total - back) }];   // (a miss: the returns alone, its own share 0)
    // each return's number: its physical roll (crushing blow in) and its elemental ones; a pierced throw's own weapon too
    let j = 0;
    [["ret", "retE"], ["retP", "retPE"]].forEach(([a, e]) => rets.filter(r => r.x.k === a).forEach(A => {
      const Es = rets.filter(r => r.x.k === e);
      A.d.forEach((v, i) => { out.push({ f: f + 52 + (j % 3), dmg: v + Es.reduce((t, r) => t + (r.d[i] || 0), 0) }); j++; });
    }));
    return out;
  }
  function splitFx(x, ctx, ax, ay, mx, my) {
    const I = IX(), n = x.split3.n, [wx, wy] = G().toWorld(mx - ax, my - ay), L = Math.hypot(wx, wy) || 1, u0 = [wx / L, wy / L], p = [-u0[1], u0[0]];
    const back = I.mis[x.shot.name + "return"], base = Math.atan2(my - ay, mx - ax);
    const size = Math.max(1, Math.min(3, +x.l.T.size || 2)), cell = [Math.floor(0.5 + wx), Math.floor(0.5 + wy)];
    const inFoot = (cx, cy) => { const dx = Math.abs(cx - cell[0]), dy = Math.abs(cy - cell[1]); return size === 1 ? dx + dy === 0 : size === 2 ? dx + dy <= 1 : Math.max(dx, dy) <= 1; };
    if (!x.splitW) {
      x.splitW = [];
      for (let i = 0; i < n; i++) {
        const off = Math.floor(n / 2) - i, aim = [wx + p[0] * off, wy + p[1] * off], al = Math.hypot(aim[0], aim[1]) || 1, dir = [aim[0] / al, aim[1] / al];
        let cross = -1, last = [0, 0];
        for (let t = 1; t <= 29 && cross < 0; t++) { const d = splitOut(t), cc = [Math.floor(0.5 + dir[0] * d), Math.floor(0.5 + dir[1] * d)]; if ((cc[0] !== last[0] || cc[1] !== last[1]) && inFoot(cc[0], cc[1])) cross = t; last = cc; }
        x.splitW.push({ dir, cross });
      }
      const first = x.splitW.filter(q => q.cross >= 0).sort((a, b) => a.cross - b.cross)[0];
      x.splitW.forEach(q => { q.lands = q === first; });
    }
    const draw = (row, t, d, dir, turn) => {
      const [sx, sy] = G().toScreen(dir[0] * d, dir[1] * d), a = Math.atan2(sy, sx) - base + (turn ? Math.PI : 0);
      G().drawShot(ctx, row, t, ax + sx, ay + sy, a, row.trans !== undefined ? row.trans : row.t, [ax + sx, ay + sy]);
    };
    nearM(x).forEach(m => {
      const t = S.frame - (m.f - x.flight);
      if (t < 0 || m.more) return;   // (a throw's first number: its returns' come later)
      x.splitW.forEach(q => {
        if (q.lands) { if (t < Math.max(1, x.flight)) draw(x.shot, t, splitOut(t), q.dir); return; }   // (it ends on the monster as the hit lands)
        if (t < 29) { draw(x.shot, t, splitOut(t), q.dir); return; }
        const out = splitOut(29), r = banded(SPLIT_BACK, t - 29);
        if (back && r < out - 1) draw(back, t - 29, out - r, q.dir, true);
      });
    });
  }
  // Lightning Fury's bolt (furylightning, trace T12, the audit's CV-04): one a javelin that strikes, from the monster on
  // the javelin's line, through and on at its speed for its Range (25 frames: 35 sub-tiles), a lone monster's too
  function furyFx(x, ctx, ax, ay, mx, my) {
    const e = x.fury, [wx, wy] = G().toWorld(mx - ax, my - ay), L = Math.hypot(wx, wy) || 1, sp = G().iasSprite(e.c), dirs = sp && sp.geo ? sp.geo.dirs || 0 : 0;
    nearM(x).forEach(m => {
      const u = S.frame - m.f;
      if (u < 0 || u >= Math.max(1, e.r) || m.more || m.words.includes("miss")) return;   // (a throw's first number)
      const d = e.v * G().MIS_PACE * u, [sx, sy] = G().toScreen(wx / L * d, wy / L * d), fr = misFrame(e, u);
      if (dirs) G().drawDirShot(ctx, e, G().fileDir(wx, wy, dirs), fr, mx + sx, my + sy, e.t);
      else G().drawShot(ctx, e, fr, mx + sx, my + sy, 0, e.t);
    });
  }
  function shotsFx(x, ctx, ax, ay, mx, my) {
    if (x.fury) furyFx(x, ctx, ax, ay, mx, my);
    if (x.split3) { splitFx(x, ctx, ax, ay, mx, my); return; }
    const ang = Math.atan2(my - ay, mx - ax), vol = x.shot.n > 1 ? volleyOf(x, ax, ay, mx, my) : null;
    nearM(x).forEach(m => {
      const t = S.frame - (m.f - x.flight);
      if (vol) {
        if (t < 0) return;
        vol.arrows.forEach(q => {
          if (t >= q.stop) return;
          const [sx, sy] = G().toScreen(q.dir[0] * vol.v * t, q.dir[1] * vol.v * t);
          G().drawDirShot(ctx, vol.m, q.file, Math.floor(t * vol.m.s / 16) % Math.max(1, vol.m.n || 1), ax + sx, ay + sy, vol.m.t);
        });
        return;
      }
      if (t < 0 || t >= x.flight) return;
      for (let k = 0; k < x.shot.n; k++) {
        const a = (k - (x.shot.n - 1) / 2) * 0.07, d = x.shot.vel * G().MIS_PACE * G().SUBTILE * t;
        const gx = ax + Math.cos(ang + a) * d, gy = ay + Math.sin(ang + a) * d;
        G().drawShot(ctx, x.shot, t, gx, gy - (x.shot.z || 0), a, x.shot.trans, [gx, gy]);
      }
    });
  }
  /* a spell's look: its cast overlay over the character from each cast's start, its missile from the release to the
     monster (the hit lands when it arrives). A missile is placed on the ground where it is, as the game places it: its
     picture's own offsets lift it (the IAS Calculator's shots too; until 2026-11-26 the fight lifted them 30 pixels
     more, and Frozen Orb started over the Sorceress's head: the author) */
  function castFx(x, ctx, ax, ay, mx, my) {
    const c = x.cast, f = S.frame, end = x.F.killF >= 0 ? x.F.killF : Infinity;
    const start = c.once ? 0 : castAt(x, f, end);
    if (start < 0) return;   // (between cooldowns: before this skill's first cast)
    // Teeth's and Bone Spear's bone burst at the caster as each cast starts, facing the monster
    if (c.startm) {
      const k = f - start, sp = G().iasSprite(c.startm.c), dirs = sp && sp.geo ? sp.geo.dirs || 1 : 1;
      const [wx, wy] = G().toWorld(mx - ax, my - ay);
      if (k >= 0 && k < Math.max(1, c.startm.r)) G().drawDirShot(ctx, c.startm, G().fileDir(wx, wy, dirs), misFrame(c.startm, k), ax, ay, c.startm.t);
    }
    if (c.ov) {
      const k = Math.floor((f - start) * c.ov.rate / 16);
      if (k >= 0 && k < c.ov.n) G().drawFx(ctx, c.ov, k, ax + c.ov.dx, ay + c.ov.dy, c.ov.trans, [ax, ay]);
    }
    // a state's own look as it starts (Thunder Storm's, at the cast's release)
    const st = c.storm && IX().starts ? IX().ov[IX().starts[c.storm.state]] : null;
    if (st) {
      const k = Math.floor((f - c.rel) * st.rate / 16);
      if (k >= 0 && k < st.n) G().drawFx(ctx, st, k, ax + st.dx, ay + st.dy, st.trans, [ax, ay]);
    }
    if (c.shield) { shieldFx(x, ctx, ax, ay, mx, my); return; }
    if (c.stream || c.storm || c.comb || c.hydra || c.delay || c.corpse || c.curse || c.orbit || c.fall || c.boulder || c.volcano || c.cracks || c.trap || c.mind) return;   // with the units
    if (x.orb) { orbFx(x, ctx, ax, ay); return; }
    if (x.rain) { rainFx(x, ctx, mx, my); return; }
    if (x.walk) { walkFx(x, ctx, ax, ay); return; }
    if (x.fan) { fanFx(x, ctx, ax, ay, mx, my); return; }
    if (c.trail) { trailFx(x, ctx, ax, ay); return; }
    if (c.wall || c.disc) return;   // the burning ground: drawn with the units (groundOf)
    if (c.meteor) { meteorFx(x, ctx, mx, my); return; }
    if (c.mis && c.ring && x.flight) {   // a nova: its ring of missiles out of the caster, each its own way, for its Range
      const sp = G().iasSprite(c.mis.c), n = sp && sp.geo ? sp.geo.dirs || 1 : 1, pace = c.mis.v * G().MIS_PACE;
      nearM(x).forEach(m => {
        const t = f - (m.f - x.flight);
        if (t < 0 || t >= Math.max(1, c.mis.r)) return;
        // (the ring slows by its Accel as it spreads: the audit's GA-08, it had kept its full speed, ending 20% farther)
        const dd = travel(pace, (c.mis.a || 0) / 4096, t);
        for (let i = 0; i < c.ring; i++) {
          const wx = G().RING_X[i * 64 / c.ring], wy = G().RING_Y[i * 64 / c.ring], len = Math.hypot(wx, wy);
          const [sx, sy] = G().toScreen(wx / len * dd, wy / len * dd);
          G().drawDirShot(ctx, c.mis, G().fileDir(wx, wy, n), Math.floor(t * c.mis.s / 16) % Math.max(1, c.mis.n || 1), ax + sx, ay + sy, c.mis.t);
        }
      });
      return;
    }
    if (c.mis && x.flight && !/null$/.test(c.mis.c)) {   // (Psychic Hammer's has no picture: only its hit shows)
      const ang = Math.atan2(my - ay, mx - ax);
      nearM(x).forEach(m => {
        const t = f - (m.f - x.flight);
        if (t < 0 || t >= x.flight) return;
        const d = c.mis.v * G().MIS_PACE * G().SUBTILE * t;
        G().drawShot(ctx, c.mis, Math.floor(t * c.mis.s / 16) % Math.max(1, c.mis.n || 1), ax + Math.cos(ang) * d, ay + Math.sin(ang) * d, 0, c.mis.t);
      });
    }
  }
  // Blizzard's shards: falling, then their burst where they land
  function rainFx(x, ctx, mx, my) {
    const I = IX(), R = x.cast.rain, f = S.frame, cen = x.cast.mis;
    nearKeys(x.rain).forEach(k => {
      const r0 = +k;
      // (the centre the shards fall from has no picture: its light on the spot for its Range)
      if (cen && cen.li && f >= r0 && f - r0 < Math.max(1, cen.r)) G().light(mx, my, G().misLight(cen.li));
      x.rain[k].forEach(q => {
        /* the client's own shard (trace T11, the audit's GA-12): from its creation it falls from zs pixels up, vs
           a frame (blizzard1 140 / 4: 35 frames, blizzard2 140 / 5: 28), so it lands about 20 frames after the
           server's shard has hit (R.fall, 9 frames: the number shows first) */
        const u = f - (r0 + q.t), zs = (R.zs || [])[q.v] || R.z, vs = (R.vs || [])[q.v] || R.z / Math.max(1, R.fall);
        const fall = Math.max(1, Math.ceil(zs / vs));
        if (u < 0 || u >= fall + 6) return;
        const [sx, sy] = G().toScreen(q.dx, q.dy), px = mx + sx, py = my + sy;
        if (u < fall) {
          const m = I.mis[R.shards[q.v]] || {};
          G().drawShot(ctx, m, Math.floor(u * (m.s || 16) / 16) % Math.max(1, m.n || 1), px, py - Math.max(0, zs - vs * u), 0, m.t, [px, py]);
        } else {
          ((I.mis[R.shards[q.v]] || {}).h || []).forEach(h => { const e = I.mis[h]; if (e) G().drawFx(ctx, e, Math.min(u - fall, Math.max(1, e.n) - 1), px, py, e.t); });
        }
      });
    });
  }
  // Meteor: its mark on the spot while it falls, the meteor coming down, its burst, and the fire it leaves
  function meteorFx(x, ctx, mx, my) {
    const I = IX(), Mt = x.cast.meteor, f = S.frame, c = x.cast;
    nearM(x).forEach(m => {
      const land = m.f, u = f - (land - Mt.fall);
      if (u < 0) return;
      if (u < Mt.fall) {
        G().drawFx(ctx, c.mis, Math.floor(u * c.mis.s / 16) % Math.max(1, c.mis.n || 1), mx, my, c.mis.t);
        // the meteor and its tail (CltSubMissile2) from the upper left, landing together (traced 2026-11-27, T1)
        // (its slide is in map units, drawn as half a pixel right and a quarter down each, its fall a pixel a unit:
        // trace T11, the audit's GA-12; until then it started twice as far left and less high)
        const left = Mt.fall - u, sl = Mt.slide || 15, ox = -sl / 2 * left, oy = -(Mt.zstep + sl / 4) * left;
        [Mt.rock, Mt.tail].forEach(k => { const e = I.mis[k]; if (e) G().drawShot(ctx, e, Math.floor(u * e.s / 16) % Math.max(1, e.n || 1), mx + ox, my + oy, 0, e.t, [mx + ox, my]); });
        return;
      }
      const t = u - Mt.fall, fire = I.mis[Mt.fire];
      const burn = (m.ev && (m.ev.parts || []).find(r => r.over > 0)) ? ((m.ev.parts.find(r => r.over > 0).x.frames) || 40) : 0;
      if (fire && t < burn) G().drawFx(ctx, fire, Math.floor(t * fire.s / 16) % Math.max(1, fire.n || 1), mx, my, fire.t);
      // its hit, the client's own (hit 18: five explosions and 18 fires by the game's tables), beside the server's fire
      const top = [], cname = (I.spells[String(x.l.E.attack.id)] || {}).m;
      if (cname) landFx(top, cname, t, mx, my, m.f * 3 + x.i);
      top.sort((p, q) => p.y - q.y).forEach(g => g.draw(ctx));
    });
  }
  function orbFx(x, ctx, ax, ay) {
    const O = x.orb, c = x.cast, n = Math.max(1, x.l.E.fr.frames), f = S.frame, end = x.F.killF >= 0 ? x.F.killF : Infinity;
    const sp = G().iasSprite(O.boltKey), dirs = sp && sp.geo ? sp.geo.dirs || 1 : 1;
    const toS = (wx, wy) => { const [sx, sy] = G().toScreen(wx - O.start[0], wy - O.start[1]); return [ax + sx, ay + sy]; };
    const casts = [];
    if (x.starts) x.starts.forEach(t => { if (t <= f && t > f - O.n - 30) casts.push(t + c.rel); });   // (between cooldowns)
    else for (let s0 = Math.floor(Math.min(f, end + n) / n) * n; s0 >= 0 && s0 > f - O.n - 30; s0 -= n) casts.push(s0 + c.rel);
    casts.forEach(r => {
      const t = f - r;
      if (t < 0) return;
      if (t < O.n) { const [px, py] = toS(O.start[0] + c.mis.v * G().MIS_PACE * t, O.start[1]); G().drawShot(ctx, c.mis, Math.floor(t * c.mis.s / 16) % Math.max(1, c.mis.n || 1), px, py, 0, c.mis.t); }
      // where it ends: its hit's nova (the bolts below) and then its explosion missile (frozenorbexplode: the client's
      // rule for every missile that lands, trace C14; found by the coverage gate, 2026-11-26)
      const ex = c.mis.x ? IX().mis[c.mis.x] : null;
      if (ex && t >= O.n && t - O.n < Math.max(1, ex.r)) { const [px, py] = toS(O.start[0] + c.mis.v * G().MIS_PACE * O.n, O.start[1]); G().drawShot(ctx, ex, misFrame(ex, t - O.n), px, py, 0, ex.t); }
      O.bolts.forEach(b => {
        // a bolt ends where it hits the monster; once the monster is dead there is nothing to hit: it flies its Range
        const u = t - b.t0, stop = b.end && r + b.t0 + b.end <= end ? b.end : b.range;
        if (u < 0 || u >= stop) return;
        const d = b.v * G().MIS_PACE * u, [px, py] = toS(b.from[0] + b.dir[0] * d, b.from[1] + b.dir[1] * d);
        G().drawDirShot(ctx, { c: O.boltKey, li: (b.row || O.bolt).li }, G().fileDir(b.dir[0], b.dir[1], dirs), Math.floor(u * O.s / 16) % Math.max(1, O.len || 1), px, py, O.t);
      });
    });
  }
  /* where a missile hits: what the client makes there, each for its Range frames at its AnimSpeed: its hit
     sub-missiles when it has a hit function that makes them (Fire Ball's fire explosion, Glacial Spike's two), else
     its explosion missile (read from Missiles.txt; the client's hit functions themselves not traced yet) */
  function landedFx(x, ctx, mx, my) {
    const c = x.cast, f = S.frame;
    if (!c.mis) return;
    const out = [];
    nearM(x).forEach(m => { if (!m.more) landFx(out, c.mis.name || c.misName, f - m.f, mx, my, m.f * 7 + x.i); });
    out.sort((p, q) => p.y - q.y).forEach(g => g.draw(ctx));
  }
  function drawAll() { S.lanes.forEach(x => draw(x)); }
  // one game frame for every lane
  /* one game frame for each lane that plays (which: all of them unless given; draw: false while the clock catches up,
     the lanes then drawn once): S.frame is the lane's own frame while it is handled */
  function step(which, drawIt) {
    S.lanes.forEach((x, i) => {
      if (x.F.none || (which && !which(x))) return;
      S.frame = ++x.f;
      const F = x.F;
      if (!x.done) {
        const ms = F.all || F.moments;   // (between cooldowns: both skills' numbers)
        while (x.at < ms.length && ms[x.at].f <= S.frame) {
          const m = ms[x.at++];
          x.dmg += m.dmg;
          if (!m.more) {   // the casts (or hits) so far: a cast's later bolts aren't more casts; a rotation's by skill
            x.n = (x.n || 0) + 1;
            (x.nw || (x.nw = []))[m.w || 0] = (x.nw[m.w || 0] || 0) + 1;
          }
          const n = pts(m.dmg);
          // a stream's breaths (Inferno): one number a second, as damage over time (the author's choice); between
          // cooldowns the lane of the skill the number is from decides
          const y = m.w && x.ws ? x.ws[m.w - 1] : x;
          if (y.cast && y.cast.chan) {   // (its word by its element: Inferno's burning, Arctic Blast's cold)
            const w = dotWord(((m.ev && m.ev.parts) || []).map(r => r.x && r.x.el).find(Boolean) || "fire");
            x.acc[w] = (x.acc[w] || 0) + m.dmg;
          }
          else if (n > 0 || m.words.length) pop(x, i, n > 0 ? nf0.format(n) : "", m.words.map(w => SHORT[w] || w), n > 0 ? "" : "miss");
          if ((F.killF < 0 || m.f < F.killF) && !frozenAt(x, m.f) && flinches(x, m, x.rnd)) { x.monMode = { m: "GH", t0: S.frame }; flash(x, m); bleed(x, m); }
          else if (m.f === F.killF && !x.flashKill && !coldLog(x).shatter) { x.flashKill = true; flash(x, m); }   // (its death: DT; none as it shatters)
        }
        // Hydra's casts count as they are cast (their heads' shots land seconds later)
        if (x.hyd) x.n = countKeys(x.hyd, F.killF < 0 ? S.frame : Math.min(S.frame, F.killF));
        // (a trap counts as it is laid, a sentinel as it is thrown: their damage comes later)
        if (x.trapL && !x.l.E.fr.cast.dsentry) x.n = lowerBound(x.layStarts || [], (F.killF < 0 ? S.frame : Math.min(S.frame, F.killF)) + 1, v => v);
        if (x.sent) x.n = countKeys(x.sent, F.killF < 0 ? S.frame : Math.min(S.frame, F.killF));
        // damage over time: what each piece drains this frame, its number once a second (the pieces near the frame)
        nearArr(F.dots, d => d.f).forEach(d => {
          if (S.frame < d.f || S.frame >= d.f + d.frames) return;
          const v = d.total / d.frames;
          x.dot += v;
          x.acc[d.word] = (x.acc[d.word] || 0) + v;
        });
        if (S.frame % FPS === 0) {
          for (const w of Object.keys(x.acc)) { const n = pts(x.acc[w]); if (n > 0) pop(x, i, nf0.format(n), [w], "dot"); }
          x.acc = {};
        }
        // (skipping to the kill: only the kill itself is written, nothing drawn on the way)
        if (!S.ff || (F.killF >= 0 && S.frame >= F.killF)) paint(x, i);
        if (!S.ff) logList(x, i);   // (an open hit-by-hit list takes the hits as they land)
      }
      if (!S.ff && drawIt !== false) draw(x);
    });
  }
  function hidden() { return !box || !box.isConnected || box.closest("[hidden]") !== null; }
  const allDone = () => !S.lanes.some(x => !x.F.none && !x.done);
  // the Play button: Pause while it plays, Replay once every lane has its kill; Skip to the kill while one is to come
  function playText() {
    const b = $("fx-play"), s = $("fx-skip");
    if (b) b.textContent = allDone() ? "Replay" : S.playing ? "Pause" : "Play";
    if (s) s.disabled = allDone() || !S.lanes.some(x => !x.done && x.F.killF >= 0);
  }
  /* Skip to the kill (the audit's UX-06, the author's pick: a boss's fight takes minutes even at 4x): every lane played
     to its kill at once, its numbers and pictures left out on the way, then the second after the last kill as usual */
  function skipToKill() {
    const toKill = x => !x.F.none && !x.done && x.F.killF >= 0;
    if (!S.lanes.some(toKill)) return;
    S.ff = true;
    try { for (let g = 0; g < 1e6 && S.lanes.some(toKill); g++) step(toKill); }
    finally { S.ff = false; }
    S.lanes.forEach((x, i) => { paint(x, i); logList(x, i); });
    drawAll();
    if (allDone()) { S.playing = true; tail = afterKill(); }
    playText();
    kick();
  }
  /* after the last kill the lanes play on a second (the characters standing, as Run Speed's race plays on after the
     last runner: the author's ask, 2026-11-26), longer while a monster is still dying (its death animation) */
  let tail = 0;
  function afterKill() {
    let n = FPS;
    S.lanes.forEach(x => {
      const M = x.F.killF >= 0 ? G().monster(x.mon.set) : null, dt = M && M.modes.DT;
      if (dt) n = Math.max(n, x.F.killF + Math.ceil(dt.f * 256 / Math.max(1, dt.rate)) - (x.f || 0) + 1);
    });
    return n;
  }
  /* the clock (the audit of 2026-11-27): a lane plays while it shows (UX-03: a fight played out below the fold or
     before the player had scrolled to it; `x.vis` from an IntersectionObserver, unknown counting as shown), at most
     MAX_STEPS game frames a tick (CO-04 / PE-03: a slow machine plays slower rather than freezing to catch up; until
     then up to 40 a tick at 4x, each drawing every lane), the lanes drawn once after their steps */
  const MAX_STEPS = 6, shows = x => x.vis !== false;
  function tick(now) {
    S.raf = 0;
    if (hidden()) { S.last = 0; return; }
    const going = S.playing && !allDone() && !S.hold;   // (held while the first frame's pictures load)
    if ((going || tail > 0) && S.lanes.some(shows)) {
      if (S.last) S.acc += (now - S.last) * (going ? S.speed : 1);
      if (S.acc > MAX_STEPS * 40) S.acc = MAX_STEPS * 40;
      let n = 0;
      for (; S.acc >= 40; n++) { S.acc -= 40; step(shows, false); if (!going) tail--; }
      if (n) S.lanes.forEach(x => { if (shows(x)) draw(x); });
      S.last = now;
      if (allDone() && going) { playText(); tail = afterKill(); }
      if (S.playing && !allDone() || tail > 0) S.raf = requestAnimationFrame(tick);
      else S.last = 0;
    } else S.last = 0;   // (no lane shows: the observer starts it again)
  }
  function kick() { if (!S.raf) S.raf = requestAnimationFrame(tick); }
  /* the hit-by-hit list, while it is open: the hits up to the lane's clock, each as it lands (the audit of 2026-11-27,
     UX-10: it showed the whole fight from the start), none after the kill (MO-11: a finisher's kick after the kill had
     been listed); each row its time, the skill in a rotation (UX-07), its number and the damage over time it started
     (UX-09: a poison cast had read 0); once the lane is done, what came over time in all by kind, up to the life it took */
  function logList(x, i) {
    const ol = $(`fx-ol-${i}`), d = $(`fx-log-${i}`);
    if (!ol || !d || !d.open || x.F.none) return;
    S.frame = x.f || 0;
    const F = x.F, upTo = x.done ? F.killF : S.frame, ms = (F.all || F.moments).filter(m => m.f <= upTo && (F.killF < 0 || m.f <= F.killF));
    const key = `${S.k}|${ms.length}|${x.done}`;
    if (ol.dataset.k === key) return;
    ol.dataset.k = key;
    const names = x.ws ? [x.l.E.attack.label].concat(x.ws.map(y => y.l.E.attack.label)) : null;
    // (a piece of damage over time drains until the kill)
    const drained = q => (F.killF >= 0 ? q.total * Math.max(0, Math.min(q.frames, F.killF - q.f + 1)) / q.frames : q.total);
    const byKind = (list, k) => {
      const by = {};
      list.forEach(q => { by[q.word] = (by[q.word] || 0) + drained(q) * k; });
      return Object.keys(by).filter(w => pts(by[w]) > 0).map(w => `${nf0.format(pts(by[w]))} ${w}`);
    };
    const row = m => {
      const n = pts(m.dmg), over = m.dots ? byKind(m.dots, 1) : [];
      const val = [n > 0 || !over.length ? nf0.format(n) : "", over.length ? `${andList(over)} over time` : ""].filter(Boolean).join(" + ");
      const words = m.words.length ? ` (${esc(m.words.map(w => LONG[w] || w).join(", "))})` : "";
      return `<li><span>${secs(m.f + 1)}${names ? ` &middot; ${esc(names[m.w || 0])}` : ""}</span><span>${val}${words}</span></li>`;
    };
    const shown = ms.length > 400 ? ms.slice(0, 300).concat([null], ms.slice(-60)) : ms;
    let foot = "";
    if (x.done && F.dots.length) {
      // (up to the life the hits before the kill left: a kill by poison drains past it on its last frame; a killing
      // blow's own overkill isn't taken off what burned before it)
      const before = ms.filter(m => m.f < F.killF).reduce((t, m) => t + m.dmg, 0), over = F.dots.reduce((t, q) => t + drained(q), 0);
      const k = over > 0 ? Math.min(1, Math.max(0, F.life - before) / over) : 1, parts = byKind(F.dots, k);
      if (parts.length) foot = `<li><span>Over time in all</span><span>${andList(parts)}</span></li>`;
    }
    const end = ol.scrollTop + ol.clientHeight >= ol.scrollHeight - 4, top = ol.scrollTop;
    ol.innerHTML = shown.map(m => (m ? row(m) : `<li><span>&hellip;</span><span></span></li>`)).join("") + foot;
    ol.scrollTop = end ? ol.scrollHeight : top;
  }

  /* the stage and the pictures' index (asked for together: the audit's PE-02), then the lanes; each picture that
     arrives draws the lanes again, lays them out if they were waiting for their monster, and lets the clock go once
     the first frame's pictures are all in */
  function render() {
    if (!api || !box) return;
    if (loaded !== "ready") {
      if (!loaded) {
        loaded = "loading";
        const sprites = base + "../Fight-Sprites/", q = ver ? "?v=" + encodeURIComponent(ver) : "";
        let n = 0;
        const both = () => {
          if (++n < 2) return;
          G().config({ ias: base + "../IAS-Calculator-Sprites/", fight: sprites, v: ver, onload: () => {
            if (hidden()) return;
            if (!S.built) { build(false); return; }
            drawAll(); held();
          } });
          lightRows();
          loaded = "ready"; render();
        };
        let failed = false;
        const fail = text => () => { if (!failed) { failed = true; box.innerHTML = `<p class="note">${text}</p>`; } };
        loadScript(base + "stage.js" + q, both, fail("The fight couldn&rsquo;t load. Reload the page to try again."));
        loadScript(sprites + "index.js" + q, both, fail("The fight&rsquo;s pictures couldn&rsquo;t load. Reload the page to try again."));
      }
      return;
    }
    if (!document.getElementById("ez-fight-css")) {
      const st = document.createElement("style");
      st.id = "ez-fight-css"; st.textContent = CSS;
      document.head.appendChild(st);
    }
    build(false);
    kick();
  }

  window.ezFight = {
    // v: the files' version (the site's build writes it into the page), asked for with each of them
    init(a, b, url, v) {
      if (!a || a.v !== VERSION) return false;
      api = a; box = b; base = url || ""; ver = v && !/^__/.test(v) ? String(v) : "";
      S.y0 = window.scrollY;
      return true;
    },
    render,
    // for the self-test: a lane's fight k, and stepping the clock by hand
    fight: (lane, k, live) => fightOf(lane, k, 0, null, live),
    step: n => { for (let i = 0; i < (n || 1); i++) step(); return S.lanes.map(x => ({ done: x.done, at: x.at, frame: x.f, killF: x.F.killF, mode: x.monMode.m })); },
    lanes: () => S.lanes,
    // (the self-test's: a lane's monster as drawn now, and its chill / freeze windows and whether it shatters)
    mon: i => (S.lanes[i] ? monFrame(S.lanes[i]) : null),
    cold: i => (S.lanes[i] ? coldLog(S.lanes[i]) : null),
  };
})();
