/* The game's stage for the Damage Calculator's Fight tab: how an attack plays out frame by frame, and how the game
   draws it. The IAS Calculator's attack preview, made to take its setup as arguments (website/resources/
   IAS-Calculator.html keeps its own copy until the fight's branch is merged), and the fight's own monsters, floors and
   palettes (Fight-Sprites/, written from the game's files). Served on the website as it is, comments too. */
(function () {
  "use strict";

  /* One attack, a game frame at a time (the IAS Calculator's timeline(), traced 2026-11-18): each entry the animation
     frame (or sequence step) drawn and whether a hit lands. Game frame i draws the animation where it stands at that
     frame's start, start x 256 + i x rate, so a held Amazon's thrust shows its frame 2 (the frame it starts at) first;
     a hit lands on the first game frame that draws its hit frame, ceil((hit - start) x 256 / rate) in, as the server
     schedules it. An attack that rolls back draws its next swing a step past the frame it goes back to, so each hit
     lands on its swing's last frame. A hit the attack ends before drawing is marked on its last frame; a hit a held
     Strafe or Fend loses is marked lost. A cooldown still running when the attack is over: the figure stands (its
     standing animation, at the other animation rate) until the next attack can start.
     R: the IAS engine's result ({p, t}); A: the engine's animations (A[key] = [frames, speed, ...]); other: the other
     animation rate in % (100; the slows that take it lower it) */
  function timeline(R, A, other) {
    if (!R || R.why) return [];
    const p = R.p, t = R.t, part = t.parts[0];
    const hitAt = (h, start, rate, n) => Math.min(n - 1, Math.max(0, Math.ceil((h - start) * 256 / rate)));
    const landedOf = q => (q.landed !== undefined ? q.landed : q.hits);
    if (p.fixed) {  // a hit each time the timer allows (the spin goes on by itself, a step a game frame)
      // (the Act 5 mercenary's spin goes back to its first step at each hit: steps 1 to the hit step)
      const steps = p.seq.steps, loop = p.merc ? steps.slice(1, p.fixed + 1) : steps.slice(4, 8);
      return Array.from({ length: part.frames }, (_, i) => {
        const pos = Math.trunc(i * t.rate / 256) % loop.length;
        return { f: i, hit: i === part.frames - 1, step: loop[pos] || steps[0] };
      });
    }
    const out = [];
    if (p.channel) {
      const steps = p.seq.steps.slice(0, p.channel.at + 1);
      for (let i = 0; i < part.frames; i++) {
        const pos = Math.min(steps.length - 1, Math.trunc((i % t.loop) * t.rate / 256));
        out.push({ f: pos, hit: i === part.frames - 1, step: steps[pos] });
      }
      return out;
    }
    if (p.charge !== undefined) {  // the strike, its last 7 steps; the hit "N frames in" (its own trace)
      const steps = p.seq.steps.slice(8), rate = t.rate, last = steps.length - 1;
      const reach = (at, from, i) => at <= from + rate && (i === 0 || at > from);
      for (let i = 0; i < part.frames; i++) {
        const from = i * rate, pos = Math.min(last, (from + rate) >> 8);
        out.push({ f: pos, hit: steps.some((x, k) => x[2] === 1 && reach(k * 256, from, i)), step: steps[pos] });
      }
      return out;
    }
    if (p.seq) {  // its steps, each step's event on the first frame that draws the step
      const steps = p.seq.steps, rate = t.rate, last = steps.length - 1, n = part.frames;
      const marks = new Set(steps.map((x, k) => (x[2] === 1 ? hitAt(k, 0, rate, n) : -1)));
      for (let i = 0; i < n; i++) {
        const pos = Math.min(last, (i * rate) >> 8);
        out.push({ f: pos, hit: marks.has(i), step: steps[pos] });
      }
      return out;
    }
    if (t.avg) {
      // attack 1, then attack 2: the game draws either, half the time each, and makes the hit at attack 1's hit frame
      // (attack 2 loses it when it ends first: t.parts[1].lost)
      const a1 = t.parts[0];
      t.parts.forEach(q => {
        const marks = new Set(q === a1 || !q.lost ? a1.anim.hits.map(h => hitAt(h, a1.anim.start, a1.srate || a1.rate, q.frames)) : []);
        for (let i = 0; i < q.frames; i++) {
          out.push({ f: Math.min(q.anim.frames - 1, (q.anim.start * 256 + i * q.rate) >> 8), key: q.anim.code, part: q.label, hit: marks.has(i) });
        }
      });
      return out;
    }
    const a = part.anim, rate = part.rate;
    if (part.swings) {
      // runs to its hit, on the frame that draws the hit frame; the swing goes back and the next frame draws a step
      // past where it went back to. The last hit runs on to the end.
      const act = p.rollback.action * 256, keep = landedOf(part);
      let left = p.rollback.hits, pos = a.start * 256, made = 0;
      for (let i = 0; i < part.frames; i++) {
        const hit = left > 0 && pos >= act;
        if (hit) made++;
        out.push({ f: Math.min(a.frames - 1, pos >> 8), hit: hit && made <= keep, lost: hit && made > keep });
        // Fury as a werewolf: faster from its `from`th frame, once the game has finished its own (the engine's timing)
        const r = part.from !== undefined && i + 1 >= part.from ? part.rate2 : rate;
        pos = hit && --left > 0 ? Math.trunc(((pos >> 8) * (100 - p.rollback.pct)) / 100) * 256 + r : pos + r;
      }
      return out;
    }
    if (p.merc && part.arrows) {  // the Rogue's Strafe: the animation frame by frame as the game schedules it (mercRollback)
      const at = new Set(part.arrows.map(g => g - 1));
      return part.draw.map((f, i) => ({ f: Math.min(a.frames - 1, f), hit: at.has(i) }));
    }
    // in a form the game makes the hit at its own rate (srate: from the attack's own length), sooner than your swing
    // draws it; Feral Rage's swing runs faster from its `from`th frame once the hit is known (the engine's timing)
    const own = part.wait ? part.own : part.frames, marks = new Set(a.hits.map(h => hitAt(h, a.start, part.srate || rate, own)));
    for (let i = 0, pos = a.start * 256; i < own; i++) {
      out.push({ f: Math.min(a.frames - 1, pos >> 8), hit: marks.has(i) });
      pos += part.from !== undefined && i + 1 >= part.from ? part.rate2 : rate;
    }
    if (part.wait) {
      const key = p.tok + "NU" + p.wc.toUpperCase(), nu = A && A[key];
      const nr = nu ? Math.max(1, Math.trunc(nu[1] * Math.max(0, other === undefined ? 100 : other) / 100)) : 0;
      for (let k = 0; k < part.wait; k++) {
        out.push(nu ? { f: Math.trunc(k * nr / 256) % nu[0], key, wait: true } : { f: a.frames - 1, wait: true });
      }
    }
    return out;
  }
  /* what the attacker shows on an entry of the timeline: an animation and its frame (the IAS Calculator's shownFrame).
     steps: game frames since the fight began (Whirlwind's and Blade Dance's spin keeps turning across hits: the
     sequence's steps 0-7 once, then 4-7) */
  function shown(R, e, steps) {
    if (!R || R.why || !e) return null;
    const p = R.p;
    if (p.fixed && p.seq) {
      const st = p.seq.steps, n = steps, step = p.merc ? st[n <= p.fixed ? n : 1 + (n - p.fixed - 1) % p.fixed] :
        st[n < st.length ? n : 4 + (n - st.length) % (st.length - 4)];
      if (step) return { key: p.tok + step[0] + p.wc.toUpperCase(), f: step[1] };
    }
    if (e.step) return { key: p.tok + e.step[0] + p.wc.toUpperCase(), f: e.step[1] };
    return { key: e.key || p.anims[0].code, f: e.f };
  }

  // ================================================================== pictures
  /* Each picture is a layout script and an atlas, loaded once: the IAS Calculator's attack animations and missiles
     (IAS-Calculator-Sprites/: window.IAS_SPRITES[key] = {f, o: each frame's drawing order, p: {part: [[atlas x, y, w,
     h, x and y from the feet], ...]}}) and the fight's monsters (Fight-Sprites/mon-<set>.js: window.EZ_MON[set], an
     indexed picture as base64 that takes the act's palette and the monster's color table). onload: called when one
     arrives, or fails (to draw again). v: the files' version (the site's build puts it in), asked for with every file
     so a browser never mixes an old picture with a new fight. Every load is counted while it is under way (pending():
     the fight holds its clock until the first frame's pictures are in) and a failed one is kept (failed()) until
     retry() asks for it again (the audit of 2026-11-27, CO-07 / PE-02) */
  const ST = { ias: "", fight: "", v: "", onload: null, state: {}, img: {}, mon: {}, dead: {}, deadWait: {}, pics: {}, floors: {}, fails: new Set() };
  let busy = 0;
  const begin = () => { busy++; };
  const end = () => { busy = Math.max(0, busy - 1); };
  const ver = () => (ST.v ? "?v=" + encodeURIComponent(ST.v) : "");
  function config(o) { Object.assign(ST, o); }
  function loadScript(src, done, fail) {
    const s = document.createElement("script");
    s.src = src; s.onload = done; s.onerror = fail;
    document.head.appendChild(s);
  }
  /* a picture, decoded before it is handed over (decode() works off the page's main thread: Baal's atlas had stalled
     it for 0.35-0.65 s on a slow phone, the audit's PE-05) */
  function loadImage(src, done, fail) {
    const im = new Image(), ok = () => done(im);
    im.src = src;
    if (im.decode) im.decode().then(ok, () => { if (im.complete && im.naturalWidth) ok(); else if (fail) fail(); });
    else { im.onload = ok; im.onerror = fail; }
  }
  const ready = () => { if (ST.onload) ST.onload(); };
  const failed = key => { ST.fails.add(key); ready(); };
  // the loads under way, and the pictures that couldn't load
  const pending = () => busy;
  const failures = () => ST.fails.size;
  // ask again for every picture that failed (Fight again, a rebuilt lane)
  function retry() {
    ST.fails.forEach(key => {
      const [kind, k] = [key.slice(0, key.indexOf(":")), key.slice(key.indexOf(":") + 1)];
      if (kind === "s") delete ST.state[k];
      else if (kind === "m") delete ST.mon[k];
      else if (kind === "d") delete ST.dead[k];
      else if (kind === "f") delete ST.floors[k];
      else if (kind === "p") delete ST.pics[k];
    });
    ST.fails.clear();
  }
  // (the fight's own sprites in the same format: the casting and standing animations, the spells' missiles and
  // overlays, Fight-Sprites/, listed in its index; the rest are the IAS Calculator's)
  let own = null;
  const dirOf = key => (own && own.has(key) ? ST.fight : ST.ias);
  function iasSprite(key) {
    if (!key) return null;
    if (!own && window.EZ_FIGHT) own = new Set(window.EZ_FIGHT.sprites || []);
    if (!ST.state[key]) {
      ST.state[key] = "loading";
      const dir = dirOf(key), miss = () => { ST.state[key] = "missing"; end(); failed("s:" + key); };
      begin();
      loadScript(dir + key + ".js" + ver(),
        () => loadImage(dir + key + ".png" + ver(), im => { ST.img[key] = im; ST.state[key] = "ready"; end(); ready(); }, miss), miss);
    }
    return ST.state[key] === "ready" ? { geo: (window.IAS_SPRITES || {})[key], img: ST.img[key] } : null;
  }
  function monster(set) {
    if (!set) return null;
    if (!ST.mon[set]) {
      ST.mon[set] = "loading";
      begin();
      loadScript(ST.fight + "mon-" + set + ".js" + ver(), () => { ST.mon[set] = "ready"; end(); ready(); },
        () => { ST.mon[set] = "missing"; end(); failed("m:" + set); });
    }
    return ST.mon[set] === "ready" ? (window.EZ_MON || {})[set] || null : null;
  }
  // where a monster's picture is: "loading", "ready", "missing" (failed), or not asked for yet
  const monState = set => ST.mon[set];
  /* a big set's death (DT, DD) in a file of its own (Fight-Sprites/mon-<set>-dt.js: window.EZ_MON_DT[set], its picture
     as base64; the audit of 2026-11-27, PE-05: Baal's 200 death frames were most of his 2 MB), asked for once the set is
     drawn. It counts as a load under way (pending()) only once a death is to be drawn before it has come, so the
     fight's first frame doesn't wait for it */
  function death(set) {
    if (!ST.dead[set]) {
      ST.dead[set] = "loading";
      const done = st => { ST.dead[set] = st; if (ST.deadWait[set]) { delete ST.deadWait[set]; end(); } if (st === "missing") failed("d:" + set); else ready(); };
      loadScript(ST.fight + "mon-" + set + "-dt.js" + ver(), () => done((window.EZ_MON_DT || {})[set] ? "ready" : "missing"), () => done("missing"));
    }
    return ST.dead[set] === "ready";
  }
  const deathWanted = set => { if (ST.dead[set] === "loading" && !ST.deadWait[set]) { ST.deadWait[set] = true; begin(); } };
  function floor(act) {
    const f = ST.floors[act];
    if (f === undefined) {
      ST.floors[act] = null;
      const I = window.EZ_FIGHT;
      if (I && I.floor[act]) {
        begin();
        loadImage(ST.fight + I.floor[act] + ver(), im => { ST.floors[act] = im; end(); ready(); }, () => { end(); failed("f:" + act); });
      }
      return null;
    }
    return f;
  }
  // a PNG's palette replaced (an indexed atlas: palette entry i becomes the act's color of the monster's table[i]),
  // as a picture the canvas can draw; index 0 stays see-through
  const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t.push(c >>> 0); } return t; })();
  const crc32 = (u, a, b) => { let c = 0xffffffff; for (let i = a; i < b; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const unb64 = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  function repaint(png, pal, table, color) {
    const u = png.slice();
    for (let p = 8; p + 8 <= u.length;) {
      const len = ((u[p] << 24) | (u[p + 1] << 16) | (u[p + 2] << 8) | u[p + 3]) >>> 0;
      if (u[p + 4] === 0x50 && u[p + 5] === 0x4c && u[p + 6] === 0x54 && u[p + 7] === 0x45) {  // PLTE
        for (let i = 0; i < len / 3; i++) {
          let s = table ? table[i] : i;
          if (color) s = color[s];   // a state's color shift on top (chilled, poisoned)
          u[p + 8 + i * 3] = pal[s * 3]; u[p + 9 + i * 3] = pal[s * 3 + 1]; u[p + 10 + i * 3] = pal[s * 3 + 2];
        }
        const c = crc32(u, p + 4, p + 8 + len);
        u[p + 8 + len] = c >>> 24; u[p + 9 + len] = (c >>> 16) & 255; u[p + 10 + len] = (c >>> 8) & 255; u[p + 11 + len] = c & 255;
        break;
      }
      p += 12 + len;
    }
    return URL.createObjectURL(new Blob([u], { type: "image/png" }));
  }
  // a made picture (a blob URL) handed to its image, the URL let go once it has loaded (the decoded image stays)
  function loadMade(url, done, fail) {
    loadImage(url, im => { URL.revokeObjectURL(url); done(im); }, () => { URL.revokeObjectURL(url); if (fail) fail(); });
  }
  /* a monster's atlas in its act's palette and its color table (the client's palette shift: table TransLvl + 2 of its
     folder's palshift.dat; an identity table is left out of the data), and a state's color shift on top (color: "cold"
     or "poison", pal.pl2's tables, as the IAS Calculator draws a chilled unit) */
  function monsterPicture(set, table, act, color, part) {
    const M = monster(set), I = window.EZ_FIGHT;
    if (!M || !I) return null;
    const src = part ? (window.EZ_MON_DT || {})[set] : M.png;   // (part 1: a big set's death, PE-05)
    if (!src) return null;
    const k = `${set}|${table}|${act}|${color || ""}` + (part ? "|1" : "");
    if (ST.pics[k] === undefined) {
      ST.pics[k] = null;
      // (its own table, or one of the game's shared ones a unique can take: "r" and its number)
      const r = typeof table === "string" && table[0] === "r" && I.rand ? +table.slice(1) : -1;
      const pal = unb64(I.pal[act] || I.pal[1]), tb = r >= 0 ? unb64(I.rand).slice(r * 256, r * 256 + 256) : M.shift[String(table)] ? unb64(M.shift[String(table)]) : null;
      // (the act's own table: GA-01; an older index had one, Act 1's)
      const sh = color && I.shift ? I.shift[color] : null, cs = sh ? unb64(typeof sh === "string" ? sh : sh[act] || sh[1]) : null;
      begin();
      // (a picture let go while it was being made is dropped when it arrives)
      loadMade(repaint(unb64(src), pal, tb, cs), im => { if (ST.pics[k] === null) ST.pics[k] = im; end(); ready(); },
        () => { end(); if (ST.pics[k] === null) failed("p:" + k); });
    }
    return ST.pics[k];
  }
  /* let go of the monsters' pictures no lane shows any more (each monster in each color table it was drawn in, its
     chilled and poisoned looks: Baal's is 30 MB decoded, the audit's CO-16): keep the ones of these monsters, each
     "set|table|act" */
  function keepPictures(keep) {
    const on = new Set(keep);
    Object.keys(ST.pics).forEach(k => { if (!on.has(k.split("|").slice(0, 3).join("|"))) delete ST.pics[k]; });
  }

  // ================================================================== light
  /* The game's lights (traced 2026-11-27, trace T5). The client rebuilds a light map every frame: 48 x 48
     points, one on each sub-tile corner, round the player's sub-tile. Each point starts at the area's light (its
     intensity x its color), then every light within its radius r adds its color x 255 x (r - d) / r at distance d (the
     game's octagonal distance: 0.960 x the longer side + 0.398 x the shorter, in sub-tiles, from the middle of the
     light's sub-tile), each channel at most 255. The floor takes the points' light across each sub-tile; a unit (the
     character, the monster, a missile, an overlay on it) the one point at its feet; a picture shows its colors x light /
     255, never brighter than its own. The lights: the character's own, a monster's, a champion's, each missile's (full
     from its start, flickering by its Flicker, shrinking a sub-tile a frame where it ended), each overlay's (InitRadius
     growing to Radius a sub-tile a frame, gone with the overlay), a spell's cast glow (from 1 to its radius while the
     cast plays). A lane is drawn twice a frame: once on a canvas that draws nothing, gathering the lights from the draw
     calls (lightsBegin ... lightsEnd), then the picture, the floor and each unit lit by them. */
  const LT = { collect: false, on: false, white: true, list: [], mem: null, ox: 0, oy: 0, amb: [255, 255, 255, 255], gamma: 1,
               lin: null, cv: null, gcv: null, tcv: null, g0: [-24, -24] };
  const N_LIGHT = 48;
  const noop = () => {};
  // a canvas that draws nothing (the first pass)
  const NULL_CTX = new Proxy({}, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; } });
  // where a screen point is in the light map: sub-tiles from the corner of the player's sub-tile (the player's feet
  // are its middle)
  const lmOf = (x, y) => { const [wx, wy] = toWorld(x - LT.ox, y - LT.oy); return [wx + 0.5, wy + 0.5]; };
  /* a light at the screen point (x, y) (the unit's feet), while the lights are gathered: {r: radius, c: [R, G, B], f:
     flicker, s: its radius as it starts, fade: shrinks where it ended (a missile's), n: its name, id: a unit's own} */
  function light(x, y, q) {
    if (!LT.collect || !q || !(q.r > 0)) return;
    const [wx, wy] = lmOf(x, y);
    LT.list.push(Object.assign({}, q, { wx: Math.floor(wx) + 0.5, wy: Math.floor(wy) + 0.5 }));
    if (ST.onLight && q.n) ST.onLight(q.n);
  }
  // a missile's light (its row's li: [radius, R, G, B, flicker, name]) or an overlay's (lo: [start, radius, R, G, B, name])
  const misLight = li => (li ? { r: li[0], c: [li[1], li[2], li[3]], f: li[4], s: li[0], fade: true, n: li[5] } : null);
  const ovLight = lo => (lo ? { r: lo[1], c: [lo[2], lo[3], lo[4]], f: 0, s: lo[0], fade: false, n: lo[5] } : null);
  const rowLight = k => (k && typeof k === "object" ? (k.li ? misLight(k.li) : k.lo ? ovLight(k.lo) : null) : null);
  /* the lights of one lane's frame: mem (the lane's own, kept between frames), (ox, oy) the player's feet on the stage,
     amb the area's light [intensity, R, G, B], gamma the floor picture's */
  function lightsBegin(mem, ox, oy, amb, gamma) {
    Object.assign(LT, { collect: true, on: true, list: [], mem, ox, oy, amb: amb || [255, 255, 255, 255], gamma: gamma || 1 });
  }
  const mul32 = a => () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  /* the frame's lights as the game steps them (a sub-tile a frame): a light seen last frame (its name, nearest within
     3 sub-tiles) goes on from its radius, a new one starts at its start radius, one gone fades if it is a missile's;
     then the light map */
  function lightsEnd(frame, seed) {
    LT.collect = false;
    const mem = LT.mem || {}, rnd = mul32((frame * 7919 + (seed | 0)) | 0);
    const base = mem.f === frame ? mem.base || [] : mem.f === frame - 1 ? mem.now || [] : [];
    const used = new Set(), now = [];
    LT.list.forEach(q => {
      let best = -1, bd = 3;
      base.forEach((p, i) => {
        if (used.has(i) || p.dying || p.n !== q.n || p.id !== q.id) return;
        const d = Math.max(Math.abs(p.wx - q.wx), Math.abs(p.wy - q.wy));
        if (d < bd) { bd = d; best = i; }
      });
      let cur = q.s;
      if (best >= 0) {
        used.add(best);
        const p = base[best];
        // (a flickering light, once at its radius: a new aim of radius + 0 to Flicker - 1 each frame)
        const aim = q.f > 0 && p.cur >= q.r ? q.r + Math.floor(rnd() * q.f) : q.r;
        cur = p.cur + Math.sign(aim - p.cur);
      }
      now.push(Object.assign(q, { cur: Math.max(0, Math.min(31, cur)) }));
    });
    base.forEach((p, i) => { if (!used.has(i) && p.fade && p.cur > 1) now.push(Object.assign({}, p, { dying: true, cur: p.cur - 1 })); });
    if (mem.f !== frame) { mem.base = base; mem.f = frame; }
    mem.now = now;
    lightMap(now);
  }
  function lightMap(list) {
    const N = N_LIGHT, A = LT.amb, g0 = LT.g0, acc = new Float32Array(N * N * 3);
    for (let i = 0; i < N * N; i++) { acc[i * 3] = A[1] * A[0]; acc[i * 3 + 1] = A[2] * A[0]; acc[i * 3 + 2] = A[3] * A[0]; }
    list.forEach(q => {
      const r = q.cur;
      if (!(r > 0)) return;
      const x0 = Math.max(0, Math.floor(q.wx - r) - g0[0]), x1 = Math.min(N - 1, Math.ceil(q.wx + r) - g0[0]);
      const y0 = Math.max(0, Math.floor(q.wy - r) - g0[1]), y1 = Math.min(N - 1, Math.ceil(q.wy + r) - g0[1]);
      for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
        const dx = Math.abs(i + g0[0] - q.wx), dy = Math.abs(j + g0[1] - q.wy);
        const d = 0.960 * Math.max(dx, dy) + 0.398 * Math.min(dx, dy);
        if (d >= r) continue;
        const v = Math.floor(255 * (r - d) / r), k = (j * N + i) * 3;
        acc[k] += q.c[0] * v; acc[k + 1] += q.c[1] * v; acc[k + 2] += q.c[2] * v;
      }
    });
    const lin = LT.lin && LT.lin.length === N * N * 3 ? LT.lin : (LT.lin = new Uint8ClampedArray(N * N * 3));
    let white = true;
    for (let i = 0; i < N * N * 3; i++) { const v = Math.min(255, Math.floor(acc[i] / 255)); lin[i] = v; if (v < 255) white = false; }
    LT.white = white;
  }
  // the light at a screen point: the map's point at the corner of its sub-tile ([R, G, B], 0-255)
  function lightAt(x, y) {
    if (!LT.on || LT.white || !LT.lin) return null;
    const [wx, wy] = lmOf(x, y), N = N_LIGHT;
    const i = Math.max(0, Math.min(N - 1, Math.floor(wx) - LT.g0[0])), j = Math.max(0, Math.min(N - 1, Math.floor(wy) - LT.g0[1])), k = (j * N + i) * 3;
    return [LT.lin[k], LT.lin[k + 1], LT.lin[k + 2]];
  }
  /* the floor lit: the light map's points across each sub-tile (smoothed between them, as the game shades a floor
     tile's sub-tiles between their corners), times the floor's colors; in the floor picture's gamma */
  function lightFloor(ctx, w, h) {
    if (!LT.on || LT.white || !LT.lin) return;
    const N = N_LIGHT, g = LT.gamma;
    if (!LT.gcv) { LT.gcv = document.createElement("canvas"); LT.gcv.width = N; LT.gcv.height = N; }
    const gx = LT.gcv.getContext("2d"), img = gx.createImageData(N, N), lut = new Uint8ClampedArray(256);
    for (let v = 0; v < 256; v++) lut[v] = Math.round(255 * Math.pow(v / 255, g));
    for (let i = 0; i < N * N; i++) { img.data[i * 4] = lut[LT.lin[i * 3]]; img.data[i * 4 + 1] = lut[LT.lin[i * 3 + 1]]; img.data[i * 4 + 2] = lut[LT.lin[i * 3 + 2]]; img.data[i * 4 + 3] = 255; }
    gx.putImageData(img, 0, 0);
    if (!LT.cv) LT.cv = document.createElement("canvas");
    if (LT.cv.width !== w || LT.cv.height !== h) { LT.cv.width = w; LT.cv.height = h; }
    const c = LT.cv.getContext("2d"), A = LT.amb, far = k => lut[Math.min(255, Math.floor(A[k] * A[0] / 255))];
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = `rgb(${far(1)}, ${far(2)}, ${far(3)})`;
    c.fillRect(0, 0, w, h);
    // (point i, j of the map at its corner: the corner g0 + (i, j), half a sub-tile up and left of the feet's middle)
    const [sx, sy] = toScreen(LT.g0[0] - 0.5, LT.g0[1] - 0.5);
    c.setTransform(16, 8, -16, 8, LT.ox + sx, LT.oy + sy);
    c.imageSmoothingEnabled = true;
    c.drawImage(LT.gcv, -0.5, -0.5);
    c.setTransform(1, 0, 0, 1, 0, 0);
    blend(ctx, "multiply", null, () => ctx.drawImage(LT.cv, 0, 0));
  }
  function lightsOff() { LT.on = false; LT.collect = false; }
  /* a picture's part drawn lit by the light at (fx, fy) (its unit's feet): its colors x light / 255, on a canvas of its
     own (the canvas's own blend, its see-through and its added light, then apply as the unit's) */
  function blit(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh, L) {
    if (!L || (L[0] >= 255 && L[1] >= 255 && L[2] >= 255)) { ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh); return; }
    if (!LT.tcv) LT.tcv = document.createElement("canvas");
    const c = LT.tcv;
    if (c.width < sw) c.width = sw;
    if (c.height < sh) c.height = sh;
    const g = c.getContext("2d");
    g.globalCompositeOperation = "source-over";
    g.clearRect(0, 0, sw, sh);
    g.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    g.globalCompositeOperation = "multiply";
    g.fillStyle = `rgb(${L[0]}, ${L[1]}, ${L[2]})`;
    g.fillRect(0, 0, sw, sh);
    g.globalCompositeOperation = "destination-in";
    g.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    g.globalCompositeOperation = "source-over";
    ctx.drawImage(c, 0, 0, sw, sh, dx, dy, dw, dh);
  }
  // a look's picture key: a missile's row (c), an overlay's (key), or the key itself
  const keyOf = k => (k && typeof k === "object" ? k.c || k.key || "" : k);
  /* a blend for one picture, set and set back by hand (the audit of 2026-11-27, PE-07: a save() and restore() around
     each picture took two thirds of a software canvas's time, Hydra's and Fire Wall's lanes stalling once a second) */
  function blend(ctx, op, alpha, draw) {
    const o0 = ctx.globalCompositeOperation, a0 = ctx.globalAlpha;
    if (op) ctx.globalCompositeOperation = op;
    if (alpha !== null) ctx.globalAlpha = alpha;
    draw();
    ctx.globalCompositeOperation = o0; ctx.globalAlpha = a0;
  }

  // ================================================================== drawing
  /* which weapon, shield or body part draws each layer of an attack animation: look = {g: the weapon's graphic, g2:
     the second weapon's (two weapons), shield: whether a shield is held} */
  function layerPart(comp, geo, look) {
    if (geo.p[comp]) return comp;
    if (comp === "SH") return look.shield ? Object.keys(geo.p).find(k => k.startsWith("SH:")) : null;
    if (comp === "RH" || comp === "LH") {
      const g = comp === "LH" && look.g2 ? look.g2 : look.g;
      return g && geo.p[`${comp}:${g}`] ? `${comp}:${g}` : null;
    }
    return null;
  }
  function drawAttacker(ctx, key, frame, x, y, look) {
    if (LT.collect) return true;   // (gathering the lights: the character's own is the lane's)
    const sp = iasSprite(key);
    if (!sp || !sp.geo) return false;
    const f = Math.max(0, Math.min(frame, sp.geo.f - 1)), L = lightAt(x, y);
    (sp.geo.o[f] || []).forEach(comp => {
      const part = layerPart(comp, sp.geo, look), fr = part && sp.geo.p[part][f];
      if (!fr) return;
      // a weapon in a buff's color (look.tint: the main weapon's, tint2 the second's)
      const tn = part !== comp && (comp === "RH" || comp === "LH") ? (comp === "LH" && look.g2 ? look.tint2 : look.tint) : null;
      const img = tn ? tinted(key, sp.img, tn) : null;
      if (img) blit(ctx, img, fr[0], fr[1], fr[2], fr[3], x + fr[4], y + fr[5], fr[2], fr[3], L);
      else if (tn && TINT[key + "|" + tn.k] === "wash") washed(ctx, sp.img, fr, x, y, tn.wash, L);
      else blit(ctx, sp.img, fr[0], fr[1], fr[2], fr[3], x + fr[4], y + fr[5], fr[2], fr[3], L);
    });
    return true;
  }
  /* an attack's picture with an item color table on it (entry i of its palette becomes entry table[i], as the game
     draws an item's layer), made once from the picture's bytes; opened as a file the page can't read them ("wash") */
  const TINT = {};
  function tinted(key, img, tn) {
    const k = key + "|" + tn.k, v = TINT[k];
    if (v) return typeof v === "string" ? null : v;
    TINT[k] = "loading";
    fetch(dirOf(key) + key + ".png" + ver()).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error("no picture")))).then(buf => {
      const b = new Uint8Array(buf), t = unb64(tn.t);
      for (let p = 8; p + 8 <= b.length;) {
        const len = ((b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]) >>> 0;
        if (b[p + 4] === 0x50 && b[p + 5] === 0x4c && b[p + 6] === 0x54 && b[p + 7] === 0x45) {  // PLTE
          const pal = b.slice(p + 8, p + 8 + len);
          for (let i = 0; i * 3 < len; i++) { const j = t[i] * 3; if (j + 2 < len) b.set(pal.subarray(j, j + 3), p + 8 + i * 3); }
          const c = crc32(b, p + 4, p + 8 + len);
          b.set([c >>> 24, (c >>> 16) & 255, (c >>> 8) & 255, c & 255], p + 8 + len);
          break;
        }
        p += 12 + len;
      }
      loadMade(URL.createObjectURL(new Blob([b], { type: "image/png" })), im => { TINT[k] = im; ready(); }, () => { TINT[k] = "wash"; ready(); });
    }).catch(() => { TINT[k] = "wash"; ready(); });
    return null;
  }
  let washCv = null;
  function washed(ctx, img, fr, x, y, color, L) {
    if (!washCv) washCv = document.createElement("canvas");
    const w = fr[2], h = fr[3];
    if (washCv.width < w) washCv.width = w;
    if (washCv.height < h) washCv.height = h;
    const g = washCv.getContext("2d");
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = "source-over";
    g.drawImage(img, fr[0], fr[1], w, h, 0, 0, w, h);
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = color;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "source-over";
    blit(ctx, washCv, 0, 0, w, h, x + fr[4], y + fr[5], w, h, L);
  }
  /* a monster in one of its modes (NU standing, GH hit, DT dying, DD dead), its layers in the game's order for the
     frame; a layer the game draws see-through (its COF's Trans) at half */
  /* a monster's COF layer drawn see-through by its draw effect (trace T10: the unit renderer takes it as the
     overlays' draw modes): 1 at 50%, 2 at 75% (Mephisto's death), 3 adding its light, 4 multiplying (Lucion's body),
     5 / 7 solid; 6 keeps the alpha the previous draw left (the scene's: 50% here, a stand-in: the Lernaean Hydra, the
     Void Watcher's limb). A transparent layer of effect 0 (25%) is read as solid: none of the fight's monsters has one */
  const LAYER_MODE = { 1: [null, 0.5], 2: [null, 0.75], 3: ["lighter", 1], 4: ["multiply", 1], 6: [null, 0.5] };
  // an overlay's lift on a unit: Overlay.txt's Height1-4 by the unit's row (a monster's OverlayHeight - 1, a player's 1),
  // a monster of OverlayHeight 0 (h -1) 75 pixels (trace T10)
  const liftOf = (o, h) => (h < 0 ? -75 : (o.h || [])[h] || 0);
  function drawMonster(ctx, set, table, act, mode, frame, x, y, color) {
    if (LT.collect) return true;   // (gathering the lights: the monster's own is the lane's)
    const L = lightAt(x, y);
    const M = monster(set);
    let img = M ? monsterPicture(set, table, act, color) || (color ? monsterPicture(set, table, act) : null) : null;
    if (!M || !img) return false;
    let m = M.modes[mode] || M.modes.NU;
    // (a big set's death: its own picture, asked for as soon as the set is drawn and made ready before the kill; a death
    // to be drawn before it has come shows the monster standing, the load then counted as under way: PE-05)
    if (M.split) {
      const dimg = death(set) ? monsterPicture(set, table, act, color, 1) || (color ? monsterPicture(set, table, act, null, 1) : null) : null;
      if (m.a) {
        if (dimg) img = dimg;
        else { deathWanted(set); m = M.modes.NU; frame = 0; }
      }
    }
    const f = Math.max(0, Math.min(frame, m.f - 1));
    (m.o[f] || []).forEach(comp => {
      const rows = m.p[comp], fr = rows && rows[f];
      if (!fr) return;
      const tr = m.t && m.t[comp], put = () => blit(ctx, img, fr[0], fr[1], fr[2], fr[3], x + fr[4], y + fr[5], fr[2], fr[3], L);
      const lm = tr ? LAYER_MODE[tr] : null;
      if (lm) blend(ctx, lm[0], lm[1], put);
      else put();
    });
    return true;
  }
  /* a missile's frame at (x, y), turned by ang (a fan's side arrow); one the game draws see-through (Trans 1) adds its
     light, as the IAS Calculator draws them. k: its row (its picture's key c and its light li) or the key. lit: false
     for one made without a light (a Fire Wall maker's flames but 1 in CltParam1), or the point on the ground its light
     and the light on it are at when it is drawn higher (a falling meteor, a trail's piece at its height) */
  const feet = (x, y, lit) => (Array.isArray(lit) ? lit : [x, y]);
  /* only the pictures whose feet are within [lo, hi) on the stage, while set: a spell's or a shot's looks drawn in two
     passes, those higher on the stage than the monster's feet before it, the lower ones after it (the units' order, as
     the game draws its missiles: the audit of 2026-11-27, GA-05; they had all been drawn behind the monster) */
  let FEET = null;
  function feetWithin(lo, hi) { FEET = lo === null ? null : [lo, hi]; }
  const skipFeet = y => FEET !== null && !(y >= FEET[0] && y < FEET[1]);
  function drawShot(ctx, k, frame, x, y, ang, trans, lit) {
    const at = feet(x, y, lit);
    if (skipFeet(at[1])) return;
    if (LT.collect) { if (lit !== false) light(at[0], at[1], rowLight(k)); return; }
    const key = keyOf(k), sp = iasSprite(key), rows = sp && sp.geo ? sp.geo.p.M || sp.geo.p.d0 : null, fr = rows ? rows[frame % rows.length] : null;   // (a picture of every way: its first)
    if (!fr) return;
    const cx = Math.round(x + fr[4] + fr[2] / 2), cy = Math.round(y + fr[5] + fr[3] / 2), L = lightAt(at[0], at[1]);
    blend(ctx, trans === 1 ? "lighter" : null, null, () => {
      if (!ang) { blit(ctx, sp.img, fr[0], fr[1], fr[2], fr[3], cx - Math.round(fr[2] / 2), cy - Math.round(fr[3] / 2), fr[2], fr[3], L); return; }
      const m0 = ctx.getTransform();   // (a fan's side arrow, turned about its middle)
      ctx.translate(cx, cy); ctx.rotate(ang);
      blit(ctx, sp.img, fr[0], fr[1], fr[2], fr[3], -Math.round(fr[2] / 2), -Math.round(fr[3] / 2), fr[2], fr[3], L);
      ctx.setTransform(m0);
    });
  }
  /* an overlay (a cast's: Overlay.txt) or what a missile becomes (its explosion), frame n at (x, y): Trans 3 adds its
     light, another Trans blends at half (the IAS Calculator's overlays). k: its row (an overlay's key and light lo, a
     missile's c and li) or the key; lit as drawShot's */
  function drawFx(ctx, k, n, x, y, trans, lit) {
    const at = feet(x, y, lit);
    if (skipFeet(at[1])) return;
    if (LT.collect) { if (lit !== false) light(at[0], at[1], rowLight(k)); return; }
    const key = keyOf(k), sp = iasSprite(key), fr = sp && sp.geo ? sp.geo.p.M[n] : null;
    if (!fr) return;
    blend(ctx, trans === 3 || trans === 1 ? "lighter" : null, trans === 3 || trans === 1 || !trans ? null : 0.5,
      () => blit(ctx, sp.img, fr[0], fr[1], fr[2], fr[3], Math.round(x + fr[4]), Math.round(y + fr[5]), fr[2], fr[3], lightAt(at[0], at[1])));
  }
  /* the overlays of a unit's states (States.txt's overlay1-4, Overlay.txt's frames at its AnimRate: 16ths of a frame a
     game frame, lifted by the unit's height of Height1-4), those drawn behind it (PreDraw) or in front; Trans 0 at half
     (traced 2026-11-16: draw modes 0, 1 and 2 blend at 25%, 50% and 75%), 3 adding its light. t: game frames since the
     fight began */
  function drawStates(ctx, states, t, x, y, h, behind) {
    const I = window.EZ_FIGHT;
    if (!I || !I.states) return;
    const done = new Set();
    states.forEach(st => (I.states[st] || []).forEach(name => {
      const o = I.ov[name];
      if (!o || done.has(name) || !!o.pre !== behind) return;
      done.add(name);
      if (LT.collect) { light(x, y, rowLight(o)); return; }
      const sp = iasSprite(o.key), n = Math.max(1, o.n || (sp && sp.geo ? sp.geo.f : 1));
      const fr = sp && sp.geo ? sp.geo.p.M[Math.floor(t * o.rate / 16) % Math.min(n, sp.geo.f)] : null;
      if (!fr || !fr[2]) return;
      // (the game's draw modes 0 / 1 / 2: 25%, 50%, 75%; until 2026-11-26 0 was 50%)
      blend(ctx, o.trans >= 3 ? "lighter" : null, o.trans >= 3 ? null : [0.25, 0.5, 0.75][o.trans] || 0.5,
        () => blit(ctx, sp.img, fr[0], fr[1], fr[2], fr[3], Math.round(x + o.dx + fr[4]), Math.round(y + o.dy + liftOf(o, h) + fr[5]), fr[2], fr[3], lightAt(x, y)));
    }));
  }
  /* a missile's direction in its picture for a direction in the world (subtiles): the game's file order of N
     directions, from the compass index c (clockwise from south on screen: S, SW, W, NW, N, NE, E, SE for 8): 8 ->
     [4, 0, 5, 1, 6, 2, 7, 3]; 2N -> an even c is N's of c / 2, an odd c N + (c - 1) / 2 (d2_sprites' 16-direction order
     follows it); 4 directions are the diagonals SW, NW, NE, SE. South on screen is the world's (1, 1) */
  function fileOf(c, n) {
    if (n === 8) return [4, 0, 5, 1, 6, 2, 7, 3][c];
    return c % 2 === 0 ? fileOf(c / 2, n / 2) : n / 2 + (c - 1) / 2;
  }
  function fileDir(wx, wy, n) {
    if (!n || n <= 1) return 0;
    const a = ((Math.atan2(wy, wx) * 180 / Math.PI - 45) % 360 + 360) % 360;
    if (n === 4) return Math.round((a - 45) / 90 + 4) % 4;
    return fileOf(Math.round(a / (360 / n)) % n, n);
  }
  // a frame of a missile drawn every way (its parts d0, d1, ...), in direction k, at (x, y)
  function drawDirShot(ctx, m, k, frame, x, y, trans, lit) {
    const at = feet(x, y, lit);
    if (skipFeet(at[1])) return;
    if (LT.collect) { if (lit !== false) light(at[0], at[1], rowLight(m)); return; }
    const key = keyOf(m), sp = iasSprite(key), rows = sp && sp.geo ? sp.geo.p["d" + k] : null, fr = rows ? rows[frame % rows.length] : null;
    if (!fr || !fr[2]) return;
    blend(ctx, trans === 1 || trans >= 3 ? "lighter" : null, null,
      () => blit(ctx, sp.img, fr[0], fr[1], fr[2], fr[3], Math.round(x + fr[4]), Math.round(y + fr[5]), fr[2], fr[3], lightAt(at[0], at[1])));
  }
  // the game's ring: the 64 points a nova's missiles fly towards (subtiles from the caster)
  const RING_X = [30, 29, 29, 28, 27, 26, 24, 23, 21, 19, 16, 14, 11, 8, 5, 2, 0, -2, -5, -8, -11, -14, -16, -19, -21, -23, -24, -26,
    -27, -28, -29, -29, -30, -29, -29, -28, -27, -26, -24, -23, -21, -19, -16, -14, -11, -8, -5, -2, 0, 2, 5, 8, 11, 14, 16, 19, 21, 23, 24, 26, 27, 28, 29, 29];
  const RING_Y = RING_X.map((_, i) => RING_X[(i + 48) % 64]);
  function shadow(ctx, x, y, rx) {
    if (LT.collect) return;
    ctx.fillStyle = "rgba(0, 0, 0, .38)";
    ctx.beginPath(); ctx.ellipse(x, y, rx, rx / 2.4, 0, 0, Math.PI * 2); ctx.fill();
  }
  // world subtiles <-> the stage's pixels (a subtile east-south-east is 16 x 8 pixels)
  const toWorld = (sx, sy) => [(sx / 16 + sy / 8) / 2, (sy / 8 - sx / 16) / 2];
  const toScreen = (wx, wy) => [(wx - wy) * 16, (wx + wy) * 8];
  const SUBTILE = Math.hypot(16, 8);
  // a missile moves Vel x 3 / 64 subtiles a frame (the client takes three quarters of Missiles.txt's Vel in sixteenths
  // of a subtile, traced 2026-11-20)
  const MIS_PACE = 3 / 64;
  function pickMissile(msl, kind) {  // as tools/ias_data.py's pick_missile
    const [own, a, b, c] = msl;
    if (own) return own;
    if (kind === "xbow" || kind === "tkni") return b || a;
    if (kind === "jave" || kind === "ajav") return c || a;
    return a;
  }

  window.ezStage = { timeline, shown, config, iasSprite, monster, monsterPicture, floor, drawAttacker, drawMonster, drawShot, drawFx, drawStates,
                     shadow, toWorld, toScreen, SUBTILE, MIS_PACE, pickMissile, fileDir, drawDirShot, RING_X, RING_Y,
                     monState, pending, failures, retry, keepPictures, feetWithin, liftOf,
                     light, misLight, lightsBegin, lightsEnd, lightFloor, lightsOff, lightAt, keyOf, NULL_CTX };
})();
