
(() => {
  "use strict";

  // The bases that take Infinity (polearms and spears with 4 sockets): code, name, tier, speed (WSM), two-hand min,
  // two-hand max, Strength, Dexterity, Strength bonus, Dexterity bonus, level requirement. Amazon spears take Infinity
  // too, but the merc can't wear them.
  const RAW = [["7vo","Colossus Voulge","E",10,21,206,210,55,75,75,48],["7pa","Cryptic Axe","E",10,41,188,165,103,75,75,59],["7st","Ghost Spear","E",0,23,194,122,163,75,75,62],["7wc","Giant Thresher","E",-10,50,142,188,140,75,75,66],["7h7","Great Poleaxe","E",0,58,159,179,99,75,75,63],["7sr","Hyperion Spear","E",-10,44,149,155,120,75,75,43],["7br","Mancatcher","E",-20,52,115,132,134,75,75,55],["7o7","Ogre Axe","E",0,35,181,195,75,75,75,45],["7tr","Stygian Pike","E",0,36,180,168,97,75,75,49],["7s8","Thresher","E",-10,15,176,152,118,75,75,53],["7p7","War Pike","E",20,41,223,165,106,75,75,66],["9s8","Battle Scythe","X",-10,25,64,82,82,75,75,25],["9h9","Bec-de-Corbin","X",0,18,122,133,91,75,75,25],["9vo","Bill","X",0,20,76,95,0,75,75,25],["9tr","Fuscina","X",0,24,53,77,25,75,75,24],["9wc","Grim Scythe","X",-10,44,100,140,140,75,75,25],["9p9","Lance","X",20,33,163,110,88,75,75,25],["9b7","Lochaber Axe","X",10,9,83,80,0,75,75,21],["9pa","Partizan","X",10,49,108,113,67,75,75,23],["9br","War Fork","X",-20,23,58,80,95,75,75,25],["9sr","War Spear","X",-10,15,54,25,25,75,75,21],["9st","Yari","X",0,41,85,101,0,75,75,25],["brn","Brandistock","N",-20,7,17,40,50,75,75,0],["hal","Halberd","N",0,12,45,75,47,75,75,0],["pik","Pike","N",20,14,63,60,45,75,75,0],["pax","Poleaxe","N",10,18,39,62,0,75,75,0],["scy","Scythe","N",-10,8,20,41,41,75,75,0],["spt","Spetum","N",0,15,23,54,35,75,75,0],["tri","Trident","N",0,9,15,38,24,75,75,0],["vou","Voulge","N",0,6,21,50,0,75,75,0],["wsc","War Scythe","N",-10,15,36,80,80,75,75,0]];
  const TIER = { E: "Elite", X: "Exceptional", N: "Normal" };
  const MAX_IAS = 150;
  const BER_LEVEL = 63;
  const PASS_FRAMES = 20;
  const PASS_RUNS = 8000;

  const root = document.querySelector(".merc-map");
  const ethD = d => Math.floor((d + Math.floor(d / 2)) * 5 / 6);
  const BASES = RAW.map(([code, name, tier, wsm, min, max, rs, rd, sb, db, lvl]) => {
    const emin = ethD(min), emax = ethD(max);
    return { code, name, tier, wsm, emin, emax, avg: (emin + emax) / 2, rs: Math.max(0, rs - 10), rd: Math.max(0, rd - 10), sb, db, lvl };
  });
  const ELITE = BASES.filter(b => b.tier === "E");

  const SLOTS = ["--s1", "--s2", "--s3", "--s4", "--s5"];
  // each speed group's own dash too, so its line doesn't rely on its color alone
  const DASHES = ["none", "8 4", "2 3", "11 3 2 3", "6 2 1 2"];
  const GROUPS = [-20, -10, 0, 10, 20].map((wsm, k) => {
    const bases = ELITE.filter(b => b.wsm === wsm).sort((a, b) => b.avg - a.avg || a.name.localeCompare(b.name));
    const lead = bases[0];
    const tied = bases.filter(b => b.avg === lead.avg);
    return { k, wsm, color: `var(${SLOTS[k]})`, dash: DASHES[k], bases, lead, label: bases.map(b => b.name).join(", "), short: tied.map(b => b.name).join(" · ") };
  });
  const groupOf = b => GROUPS.find(g => g.wsm === b.wsm);

  const signed = n => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n);
  const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const secs = v => !isFinite(v) ? "never" : v >= 100 ? nf0.format(v) + " s" : nf1.format(v) + " s";
  const pct = v => v <= 0 ? "0%" : v < 0.005 ? "<1%" : v >= 1 ? "100%" : v > 0.995 ? ">99%" : nf0.format(v * 100) + "%";

  // speed: item IAS -> total attack speed -> frames. The IAS Calculator owns the attack speed model: from one attack
  // to the next (a length + AI_GAP) these give its engine's frames for every base at every IAS (tools/ias_selftest.py
  // checks it), so a change here or there needs the other.
  /* merc-speed:start */
  const eias = i => Math.floor(120 * i / (120 + i));
  const totalSpeed = (i, wsm, sias) => Math.min(75, eias(i) + sias - wsm);
  const rate = t => Math.floor(256 * (100 + t) / 100);
  // a Jab's and a basic attack's length as the PD2 wiki's Desert Guard breakpoints count them
  const jabFrames = t => Math.ceil(256 * 14 / rate(t));
  const swingFrames = t => Math.ceil(256 * 16 / rate(t)) - 1;
  // the merc starts its next attack 2 frames after either length: the game ends the attack a frame later, and the
  // merc picks its next one the frame after that (until 2026-11-13 the page counted 1 frame, so its rates were ~7%
  // high)
  const AI_GAP = 2;
  /* merc-speed:end */
  // the sorceress's cast: 14 frames, FCR counted like IAS, capped at 75
  const castFrames = fcr => Math.ceil(256 * 14 / rate(Math.min(75, eias(fcr)))) - 1;
  const W200 = castFrames(200), W105 = castFrames(105);

  // the merc's Strength, Dexterity and Jab level (Nightmare row at level 43, Hell row at level 75; Str / Dex per level
  // in eighths, Jab per level in 32nds)
  function merc(L) {
    const r = L >= 75 ? { L: 75, str: 173, dex: 139, jab: 24, jabPer: 0 } : { L: 43, str: 117, dex: 91, jab: 14, jabPer: 10 };
    const d = L - r.L;
    return { str: r.str + Math.floor(d * 14 / 8), dex: r.dex + Math.floor(d * 12 / 8), jab: r.jab + Math.floor(d * r.jabPer / 32) };
  }
  function levelNeeded(b) {
    for (let L = Math.max(BER_LEVEL, b.lvl); L <= 99; L++) {
      const m = merc(L);
      if (m.str >= b.rs && m.dex >= b.rd) return L;
    }
    return null;
  }

  // the weapon's own two-hand damage: the ethereal base raised by the enhanced damage on the weapon (Infinity's roll
  // plus a superior base's bonus)
  function weapon(b, S) {
    const wed = S.ed + S.sup;
    const min = b.emin + Math.floor(b.emin * wed / 100), max = b.emax + Math.floor(b.emax * wed / 100);
    return { min, max, avg: (min + max) / 2 };
  }
  // what a hit makes of the weapon's damage: the Strength and Dexterity bonus, Jab's bonus and other gear's damage %
  function multipliers(b, S) {
    const statPct = Math.floor(S.str * b.sb / 100) + Math.floor(S.dex * b.db / 100);
    const p = 100 + statPct + S.other;
    return { jab: (p + S.jabPct) / 100, swing: p / 100 };
  }

  function evalBase(b, i, S) {
    const t = totalSpeed(i, b.wsm, S.sias);
    const fj = jabFrames(t), fa = swingFrames(t);
    const pj = S.mix, pa = 1 - pj;
    const w = weapon(b, S), m = multipliers(b, S);
    const dj = w.avg * m.jab * S.crit.mean, da = w.avg * m.swing * S.crit.mean;
    const frames = pj * (fj + AI_GAP) + pa * (fa + AI_GAP), hits = pj * 2 + pa, dmg = pj * 2 * dj + pa * da;
    return { t, fj, fa, dps: 25 * dmg / frames, hps: 25 * hits / frames, dhit: dmg / hits };
  }

  // Crushing Blow's divisor by target; efficiency divides it
  const cbDivisor = (share, lifeLeft, lifeMax, cbe) => (share === "pe" ? 70 + 1000 * (1 - lifeLeft / lifeMax) : share) / (1 + cbe / 100);

  function killTime(e, S) {
    const T = S.target;
    if (!(T.life > 0)) return 0;
    const keep = Math.max(0, 1 - T.pr / 100);
    const dmg = e.dhit * keep;
    const c = T.share === "none" ? 0 : S.cbc;
    if (!(dmg > 0) && !(c > 0 && keep > 0)) return Infinity;
    let L = T.life, n = 0;
    while (L > 0.5 && n < 200000) {
      const cb = c > 0 ? c * L / cbDivisor(T.share, L, T.life, S.cbe) * keep : 0;
      L -= cb + dmg;
      n++;
    }
    return n >= 200000 ? Infinity : n / e.hps;
  }

  // teleport pass: the merc's one attack on the monster, simulated hit by hit, frame by frame from the frame you land
  function mulberry32(a) {
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function passSim(b, S, seed) {
    const P = S.pass, F = PASS_FRAMES;
    const r = rate(totalSpeed(S.ias, b.wsm, S.sias));
    const h1 = Math.ceil(256 * 5 / r), h2 = Math.ceil(256 * 9 / r), jl = Math.ceil(256 * 14 / r);
    const ah = Math.ceil(256 * 11 / r), al = Math.ceil(256 * 16 / r) - 1;
    const w = weapon(b, S), m = multipliers(b, S), C = S.crit;
    const keep = Math.max(0, 1 - P.pr / 100);
    const cbOn = S.cbc > 0 && keep > 0;
    const div = cbDivisor(8, 1, 1, S.cbe);
    const dmgAt = new Float64Array(F + 1), deadAt = new Float64Array(F + 1);
    let firstDmg = 0, firstDead = 0;
    const fr = new Int32Array(8), mu = new Float64Array(8);
    const rnd = mulberry32(seed);
    const spread = w.max - w.min;
    for (let k = 0; k < PASS_RUNS; k++) {
      // the merc's one attack on this monster; its next attack goes to whatever is beside it by then
      const t0 = P.d;
      let n = 0;
      if (rnd() < S.mix) { fr[n] = t0 + h1; mu[n++] = m.jab; fr[n] = t0 + h2; mu[n++] = m.jab; }
      else { fr[n] = t0 + ah; mu[n++] = m.swing; }
      const firstCount = n;
      let L = P.life, dealt = 0, j = 0;
      const hit = () => {
        if (L > 0) {
          if (cbOn && rnd() < S.cbc) { const cb = L / div * keep; L -= cb; dealt += cb; }
          // Critical Strike first; Deadly Strike only on a hit that isn't one
          const strike = rnd() < C.pc ? C.cm : rnd() < C.pd ? C.dm : 1;
          const x = (w.min + rnd() * spread) * mu[j] * strike * keep; L -= x; dealt += x;
        }
        j++;
        if (j === firstCount) { firstDmg += dealt; if (L <= 0) firstDead++; }
      };
      for (let f = 0; f <= F; f++) {
        while (j < n && fr[j] <= f) hit();
        dmgAt[f] += dealt;
        if (L <= 0) deadAt[f]++;
      }
      while (j < firstCount) hit();
    }
    for (let f = 0; f <= F; f++) { dmgAt[f] /= PASS_RUNS; deadAt[f] /= PASS_RUNS; }
    return { h1, h2, jl, ah, al, dmgAt: Array.from(dmgAt), deadAt: Array.from(deadAt), firstDmg: firstDmg / PASS_RUNS, firstDead: firstDead / PASS_RUNS };
  }

  // ---------- settings ----------
  const $ = id => document.getElementById(id);
  const el = { ias: $("ias"), iasNum: $("iasNum"), lvl: $("lvl"), ed: $("ed"), edOut: $("edOut"), sup: $("sup"), supOut: $("supOut"), plus: $("plus"), other: $("other"), sias: $("sias"), mix: $("mix"), cbc: $("cbc"), cbe: $("cbe"), cs: $("cs"), csOut: $("csOut"), csMul: $("csMul"), ds: $("ds"), dsOut: $("dsOut"), dsMul: $("dsMul"), dsMax: $("dsMax"), target: $("target"), life: $("life"), pr: $("pr"), cbs: $("cbs"), pLife: $("pLife"), pPr: $("pPr"), pDelay: $("pDelay"), showLow: $("showLow") };
  for (let L = 99; L >= BER_LEVEL; L--) el.lvl.add(new Option(String(L), String(L), L === 98, L === 98));
  for (let p = 0; p <= 6; p++) el.plus.add(new Option(p ? "+" + p : "None", String(p)));
  const TARGETS = {
    pack: { life: 30000, pr: 0, cbs: "8", label: "a map monster" },
    boss: { life: 300000, pr: 20, cbs: "30", label: "a map boss" },
    baal: { life: 493700, pr: 50, cbs: "pe", label: "Baal" },
  };
  const num = (input, lo, hi, dflt) => { const v = parseFloat(input.value); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : dflt; };

  // Critical Strike (at most 75%) is rolled first, Deadly Strike (at most 75% + Maximum Deadly Strike) on a hit that
  // isn't one; they do 200% and 150% damage plus their multipliers
  function strikes() {
    const cs = +el.cs.value, ds = +el.ds.value;
    const csMul = num(el.csMul, 0, 500, 0), dsMul = num(el.dsMul, 0, 500, 0), dsCap = 75 + num(el.dsMax, 0, 100, 0);
    const pc = Math.min(cs, 75) / 100, pd = Math.min(ds, dsCap, 100) / 100;
    const cm = (200 + csMul) / 100, dm = (150 + dsMul) / 100;
    return { cs, ds, dsCap, pc, pd, cm, dm, mean: 1 + pc * (cm - 1) + (1 - pc) * pd * (dm - 1) };
  }

  function settings() {
    const L = +el.lvl.value, m = merc(L), plus = +el.plus.value;
    const jabLvl = m.jab + plus;
    const share = el.cbs.value === "pe" || el.cbs.value === "none" ? el.cbs.value : +el.cbs.value;
    return {
      L, str: m.str, dex: m.dex, jabLvl, jabPct: 30 + 15 * (jabLvl - 1),
      ed: +el.ed.value, sup: +el.sup.value < 5 ? 0 : +el.sup.value, crit: strikes(),
      other: num(el.other, 0, 5000, 0), sias: Math.round(num(el.sias, 0, 200, 0)), mix: +el.mix.value,
      cbc: num(el.cbc, 0, 100, 40) / 100, cbe: num(el.cbe, 0, 500, 0), ias: Math.round(num(el.iasNum, 0, MAX_IAS, 40)),
      target: { life: num(el.life, 0, 1e8, 300000), pr: num(el.pr, 0, 100, 0), share, key: el.target.value },
      pass: { life: num(el.pLife, 1, 1e7, 6000), pr: num(el.pPr, 0, 100, 0), d: +el.pDelay.value },
    };
  }

  // ---------- charts ----------
  function niceTicks(lo, hi, n) {
    if (!(hi > lo)) { hi = lo + 1; lo = Math.max(0, lo - 1); }
    const span = hi - lo, raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(k => k * p).find(s => span / s <= n) || 10 * p;
    const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, out = [];
    for (let v = a; v <= b + step / 2; v += step) out.push(+v.toFixed(8));
    return out;
  }
  const SVGNS = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs, parent) => { const n = document.createElementNS(SVGNS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  // a speed group's key: a short line in its color and dash (its size comes from the styles)
  const keyOf = g => {
    const s = mk("svg", { class: "key", "aria-hidden": "true", focusable: "false" });
    mk("line", { x1: 0, x2: "100%", y1: "50%", y2: "50%", stroke: g.color, "stroke-width": 2, "stroke-dasharray": g.dash }, s);
    return s;
  };

  const iasChart = (card, better, fmt, tick, metric) => ({
    card, better, fmt, tick, xMax: MAX_IAS, xTitle: "Item IAS (%)", pick: true, fromZero: false,
    xStep: narrow => (narrow ? 30 : 10),
    head: i => `${i}% IAS`,
    values: g => state.series[g.k].map(e => metric(e, state.S)),
    extra: (g, i) => `Jab ${state.series[g.k][i].fj}f`,
    markers: () => [{ x: state.S.ias, label: `Your IAS ${state.S.ias}%`, anchor: "middle" }],
    hline: () => null,
  });
  const CHARTS = {
    dps: iasChart($("c-dps"), "high", v => nf0.format(v), v => nf0.format(v), e => e.dps),
    cb: iasChart($("c-cb"), "high", v => nf2.format(v), v => (Math.round(v * 100) / 100).toString(), (e, S) => e.hps * S.cbc),
    kill: iasChart($("c-kill"), "low", v => secs(v), v => nf0.format(v), e => e.kill),
    pass: {
      card: $("c-pass"), better: "high", fmt: v => nf0.format(v), tick: v => nf0.format(v), xMax: PASS_FRAMES, pick: false, fromZero: true,
      xTitle: "Frames after you land (25 a second)",
      xStep: narrow => (narrow ? 4 : 1),
      head: i => `Frame ${i} after you land`,
      values: g => state.pass.get(g.lead.code).dmgAt,
      extra: g => { const p = state.pass.get(g.lead.code); return `Jab hits on frames ${p.h1 + state.S.pass.d}, ${p.h2 + state.S.pass.d}`; },
      markers: () => [{ x: W200, label: "200% FCR", anchor: "end" }, { x: W105, label: "105% FCR", anchor: "start" }],
      hline: () => ({ v: state.S.pass.life, label: `Monster life ${nf0.format(state.S.pass.life)}` }),
    },
  };
  let state = { S: null, series: null, pass: null, hover: {} };

  function buildLegends() {
    for (const key in CHARTS) {
      const ul = CHARTS[key].card.querySelector(".mm-legend");
      ul.textContent = "";
      ul.setAttribute("aria-label", "Speed groups");
      GROUPS.forEach(g => {
        const li = document.createElement("li");
        li.tabIndex = 0;
        const k = keyOf(g);
        const t = document.createElement("span"); t.textContent = g.label;
        const s = document.createElement("span"); s.className = "spd"; s.textContent = "speed " + signed(g.wsm);
        li.append(k, t, s);
        const on = () => emphasize(g.k), off = () => emphasize(null);
        li.addEventListener("pointerenter", on); li.addEventListener("pointerleave", off);
        li.addEventListener("focus", on); li.addEventListener("blur", off);
        ul.appendChild(li);
      });
    }
  }
  function emphasize(k) {
    root.querySelectorAll("path.series").forEach(p => { p.style.opacity = k === null || +p.dataset.k === k ? "1" : "0.18"; });
  }

  function computeSeries(S) {
    // one entry per group per IAS: evaluated on the group's strongest elite base; cached by total speed
    const out = {};
    GROUPS.forEach(g => {
      const cache = new Map(), rows = [];
      for (let i = 0; i <= MAX_IAS; i++) {
        const t = totalSpeed(i, g.wsm, S.sias);
        let e = cache.get(t);
        if (!e) { e = evalBase(g.lead, i, S); e.kill = killTime(e, S); cache.set(t, e); }
        rows.push(e);
      }
      out[g.k] = rows;
    });
    return out;
  }

  function drawChart(key) {
    const C = CHARTS[key], S = state.S, plot = C.card.querySelector(".plot");
    const W = Math.max(280, Math.round(plot.clientWidth || 600));
    const narrow = W < 560;
    const H = narrow ? 250 : 290;
    const m = { l: narrow ? 46 : 58, r: 36, t: 24, b: 42 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const xMax = C.xMax;
    const vals = GROUPS.map(g => C.values(g));
    const hl = C.hline();
    let lo = Infinity, hi = -Infinity;
    vals.forEach(v => v.forEach(x => { if (isFinite(x)) { lo = Math.min(lo, x); hi = Math.max(hi, x); } }));
    if (hl) hi = Math.max(hi, hl.v);
    if (!isFinite(lo)) { lo = 0; hi = 1; }
    if (C.fromZero) lo = 0;
    const pad = (hi - lo) * 0.06;
    const ticks = niceTicks(C.fromZero ? 0 : Math.max(0, lo - pad), hi + pad, narrow ? 4 : 5);
    const y0 = ticks[0], y1 = ticks[ticks.length - 1];
    const X = i => m.l + i / xMax * iw;
    const Y = v => m.t + (1 - (Math.min(Math.max(v, y0), y1) - y0) / (y1 - y0)) * ih;

    const hadFocus = plot.contains(document.activeElement);
    plot.textContent = "";
    const svg = mk("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", tabindex: "0", "aria-label": `${C.card.querySelector("h2").textContent}, one line per speed group; the tables list every value` }, plot);
    const grid = mk("g", {}, svg);
    // every number on the axis with the decimals its steps need (2.0, 1.8 ...; 27.5, 25.0 ...): never rounded to a whole one
    const dec = Math.max(0, ...ticks.map(v => (String(v).split(".")[1] || "").length));
    const tickNf = new Intl.NumberFormat("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    ticks.forEach(v => {
      mk("line", { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), stroke: "var(--grid)", "stroke-width": 1, "shape-rendering": "crispEdges" }, grid);
      const t = mk("text", { x: m.l - 8, y: Y(v) + 4, "text-anchor": "end", class: "tick" }, grid); t.textContent = tickNf.format(v);
    });
    mk("line", { x1: m.l, x2: W - m.r, y1: m.t + ih, y2: m.t + ih, stroke: "var(--axis)", "stroke-width": 1, "shape-rendering": "crispEdges" }, grid);
    const step = C.xStep(narrow);
    for (let i = 0; i <= xMax; i += step) {
      mk("line", { x1: X(i), x2: X(i), y1: m.t + ih, y2: m.t + ih + 4, stroke: "var(--axis)", "stroke-width": 1, "shape-rendering": "crispEdges" }, grid);
      const t = mk("text", { x: X(i), y: m.t + ih + 17, "text-anchor": "middle", class: "tick" }, grid); t.textContent = String(i);
    }
    const xt = mk("text", { x: m.l + iw / 2, y: H - 6, "text-anchor": "middle", class: "axis-title" }, grid); xt.textContent = C.xTitle;

    if (hl) {
      const y = Y(hl.v);
      mk("line", { x1: m.l, x2: W - m.r, y1: y, y2: y, stroke: "var(--fg2)", "stroke-width": 1, opacity: 0.6, "shape-rendering": "crispEdges" }, svg);
      // at the left end, where every line is still at 0 (at the right end the lines ran through it)
      const t = mk("text", { x: m.l + 6, y: y - 6, "text-anchor": "start", class: "marker-label" }, svg); t.textContent = hl.label;
    }
    C.markers().forEach(mm => {
      const mx = X(mm.x);
      mk("line", { x1: mx, x2: mx, y1: m.t - 6, y2: m.t + ih, stroke: "var(--accent)", "stroke-width": 1.5 }, svg);
      const lx = mm.anchor === "middle" ? Math.min(Math.max(mx, m.l + 30), W - m.r - 30) : mm.anchor === "end" ? mx - 4 : mx + 4;
      const ml = mk("text", { x: lx, y: m.t - 10, "text-anchor": mm.anchor, class: "marker-label" }, svg);
      ml.textContent = mm.label;
    });

    // series: steps hold from i to i + 1
    GROUPS.forEach((g, n) => {
      const v = vals[n];
      let d = `M${X(0).toFixed(1)},${Y(v[0]).toFixed(1)}`;
      for (let i = 1; i <= xMax; i++) if (v[i] !== v[i - 1]) d += `H${X(i).toFixed(1)}V${Y(v[i]).toFixed(1)}`;
      d += `H${X(xMax).toFixed(1)}`;
      mk("path", { d, fill: "none", stroke: g.color, "stroke-width": 2, "stroke-dasharray": g.dash, "stroke-linejoin": "round",
        "stroke-linecap": g.dash === "none" ? "round" : "butt", class: "series", "data-k": g.k }, svg);
    });
    // direct labels at the right end (the group's speed), kept 13px apart and above the x axis
    const ends = GROUPS.map((g, n) => ({ g, y: Y(vals[n][xMax]) })).sort((a, b) => a.y - b.y || a.g.k - b.g.k);
    for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 13);
    for (let i = ends.length - 1; i >= 0; i--) ends[i].y = Math.min(ends[i].y, i === ends.length - 1 ? m.t + ih : ends[i + 1].y - 13);
    ends.forEach(e => { const t = mk("text", { x: W - m.r + 6, y: e.y + 4, class: "end-label" }, svg); t.textContent = signed(e.g.wsm); });

    // hover layer
    const cross = mk("line", { y1: m.t, y2: m.t + ih, stroke: "var(--fg2)", "stroke-width": 1, opacity: 0, "shape-rendering": "crispEdges" }, svg);
    const dots = GROUPS.map(g => mk("circle", { r: 4, fill: g.color, stroke: "var(--panel)", "stroke-width": 2, opacity: 0 }, svg));
    const hit = mk("rect", { x: m.l - 6, y: 0, width: iw + 12, height: m.t + ih + 24, fill: "transparent", style: "cursor: crosshair" }, svg);
    const tip = document.createElement("div"); tip.className = "mm-tip"; tip.hidden = true; plot.appendChild(tip);

    const show = (i, px) => {
      i = Math.max(0, Math.min(xMax, i));
      state.hover[key] = i;
      cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i)); cross.setAttribute("opacity", 0.55);
      dots.forEach((dot, n) => { dot.setAttribute("cx", X(i)); dot.setAttribute("cy", Y(vals[n][i])); dot.setAttribute("opacity", 1); });
      const order = GROUPS.map((g, n) => ({ g, v: vals[n][i] })).sort((a, b) => C.better === "low" ? a.v - b.v : b.v - a.v);
      tip.textContent = "";
      const head = document.createElement("div"); head.className = "mm-tip-head"; head.textContent = C.head(i); tip.appendChild(head);
      order.forEach(({ g, v }) => {
        const row = document.createElement("div"); row.className = "mm-tip-row";
        const k = keyOf(g);
        const b = document.createElement("b"); b.textContent = C.fmt(v);
        const s = document.createElement("span"); s.textContent = `${g.short} · ${C.extra(g, i)}`;
        row.append(k, b, s); tip.appendChild(row);
      });
      if (C.pick) { const foot = document.createElement("div"); foot.className = "mm-tip-foot"; foot.textContent = "Click to set your IAS here"; tip.appendChild(foot); }
      tip.hidden = false;
      const pw = plot.clientWidth, tw = tip.offsetWidth;
      const scale = pw / W, xpx = (px !== undefined ? px : X(i) * scale);
      let left = xpx + 14; if (left + tw > pw) left = Math.max(0, xpx - tw - 14);
      tip.style.left = left + "px"; tip.style.top = Math.max(0, (m.t + 4) * scale) + "px";
    };
    const hide = () => { cross.setAttribute("opacity", 0); dots.forEach(d => d.setAttribute("opacity", 0)); tip.hidden = true; delete state.hover[key]; };
    const toX = ev => { const r = svg.getBoundingClientRect(); const x = (ev.clientX - r.left) * W / r.width; return { i: Math.round((x - m.l) / iw * xMax), px: ev.clientX - r.left }; };
    hit.addEventListener("pointermove", ev => { const p = toX(ev); show(p.i, p.px); });
    hit.addEventListener("pointerdown", ev => { const p = toX(ev); show(p.i, p.px); });
    hit.addEventListener("pointerleave", hide);
    if (C.pick) hit.addEventListener("click", ev => { const p = toX(ev); setIas(Math.max(0, Math.min(xMax, p.i))); });
    svg.addEventListener("focus", () => show(state.hover[key] ?? (C.pick ? S.ias : W105)));
    svg.addEventListener("blur", hide);
    svg.addEventListener("keydown", ev => {
      const cur = state.hover[key] ?? (C.pick ? S.ias : W105);
      if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") { ev.preventDefault(); show(cur + (ev.key === "ArrowRight" ? 1 : -1) * (ev.shiftKey ? 10 : 1)); }
      else if (C.pick && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); setIas(cur); }
      else if (ev.key === "Escape") hide();
    });
    if (hadFocus) svg.focus({ preventScroll: true });
    else if (state.hover[key] !== undefined) show(state.hover[key]);
  }

  // ---------- tiles, tables, breakpoints ----------
  const names = list => list.map(b => b.name).join(", ");
  function leadersOf(rows, key, better) {
    const best = better === "low" ? Math.min(...rows.map(r => r[key])) : Math.max(...rows.map(r => r[key]));
    return { best, rows: rows.filter(r => Math.abs(r[key] - best) <= 1e-9 * Math.max(1, Math.abs(best))) };
  }

  function renderTiles(S) {
    const rows = ELITE.map(b => {
      const e = evalBase(b, S.ias, S);
      return { b, dps: e.dps, cbs: e.hps * S.cbc, hps: e.hps, kill: killTime(e, S), fj: e.fj };
    });
    const a = leadersOf(rows, "dps", "high");
    $("t1v").textContent = nf0.format(a.best);
    $("t1s").textContent = names(a.rows.map(r => r.b));
    const second = rows.filter(r => !a.rows.includes(r)).sort((x, y) => y.dps - x.dps)[0];
    $("t1n").textContent = second ? `${((a.best / second.dps - 1) * 100).toFixed(1)}% ahead of ${second.b.name} at ${S.ias}% IAS` : `at ${S.ias}% IAS`;

    const c = leadersOf(rows, "cbs", "high");
    const v2 = $("t2v"); v2.textContent = nf2.format(c.best); const u2 = document.createElement("span"); u2.textContent = "a second"; v2.appendChild(u2);
    $("t2s").textContent = names(c.rows.map(r => r.b));
    $("t2n").textContent = `${nf2.format(c.rows[0].hps)} hits a second, Jab ${c.rows[0].fj} frames`;

    const k = leadersOf(rows, "kill", "low");
    $("t3v").textContent = secs(k.best);
    $("t3s").textContent = names(k.rows.map(r => r.b));
    const slow = Math.max(...rows.map(r => r.kill));
    const tl = TARGETS[S.target.key] ? TARGETS[S.target.key].label : "your target";
    $("t3n").textContent = `on ${tl}; the slowest elite base takes ${secs(slow)}`;

    // the strip at the bottom of the screen: the same three
    $("dIas").textContent = `Best at ${S.ias}% IAS`;
    $("d1v").textContent = nf0.format(a.best); $("d1s").textContent = names(a.rows.map(r => r.b));
    $("d2v").textContent = nf2.format(c.best); $("d2s").textContent = names(c.rows.map(r => r.b));
    $("d3v").textContent = secs(k.best); $("d3s").textContent = names(k.rows.map(r => r.b));
  }

  // a cell; l names its column on a phone, where each row is a card
  function addCell(tr, text, cls, l) { const c = document.createElement("td"); c.textContent = text; if (cls) c.className = cls; if (l) c.dataset.l = l; tr.appendChild(c); return c; }
  function nameCell(tr, b) {
    const n = addCell(tr, "", "name"), g = groupOf(b);
    n.appendChild(keyOf(g));
    n.appendChild(document.createTextNode(b.name));
    if (b.tier !== "E") { const s = document.createElement("small"); s.textContent = TIER[b.tier]; n.appendChild(s); }
  }

  function renderTable(S) {
    $("tblIas").textContent = String(S.ias);
    const showLow = el.showLow.checked;
    $("lowNote").hidden = !showLow;
    const rows = BASES.filter(b => b.tier === "E" || showLow).map(b => {
      const e = evalBase(b, S.ias, S);
      return { b, e, dps: e.dps, hps: e.hps, cbs: e.hps * S.cbc, kill: killTime(e, S), need: levelNeeded(b) };
    }).sort((x, y) => y.dps - x.dps || x.b.name.localeCompare(y.b.name));
    const best = {
      dps: leadersOf(rows, "dps", "high").best, hps: leadersOf(rows, "hps", "high").best,
      cbs: leadersOf(rows, "cbs", "high").best, kill: leadersOf(rows, "kill", "low").best,
    };
    const isBest = (k, v) => Math.abs(v - best[k]) <= 1e-9 * Math.max(1, Math.abs(best[k]));
    const tb = $("baseTable").querySelector("tbody");
    tb.textContent = "";
    rows.forEach(r => {
      const { b, e } = r;
      const tr = document.createElement("tr");
      nameCell(tr, b);
      addCell(tr, signed(b.wsm), "", "Speed");
      const w = weapon(b, S);
      addCell(tr, `${nf0.format(w.min)}–${nf0.format(w.max)}`, "", "Two-hand damage");
      addCell(tr, `${b.rs} / ${b.rd}`, "", "Str / Dex needed");
      const lv = addCell(tr, r.need === null ? "over 99" : String(r.need), "", "Merc level needed");
      if (r.need === null || r.need > S.L) { lv.className = "low"; lv.title = "Your merc can't wear it yet without Strength or Dexterity from gear"; lv.textContent += " (higher than yours)"; }
      addCell(tr, `${e.fj} frames`, "", "Jab length");
      addCell(tr, nf0.format(r.dps), isBest("dps", r.dps) ? "best" : "", "Damage / s");
      addCell(tr, nf2.format(r.hps), isBest("hps", r.hps) ? "best" : "", "Hits / s");
      addCell(tr, nf2.format(r.cbs), isBest("cbs", r.cbs) ? "best" : "", "Crushing Blows / s");
      addCell(tr, secs(r.kill), isBest("kill", r.kill) ? "best" : "", "Kill time");
      tb.appendChild(tr);
    });
  }

  function computePass(S) {
    const out = new Map();
    ELITE.forEach((b, n) => out.set(b.code, passSim(b, S, 9001 + n * 7919)));
    return out;
  }

  function renderPass(S) {
    $("passW105").textContent = String(W105); $("passW200").textContent = String(W200);
    $("passH200").textContent = `200% FCR (${W200} frames)`;
    $("passH105").textContent = `105% FCR (${W105} frames)`;
    const rows = ELITE.map(b => {
      const p = state.pass.get(b.code);
      const len = S.mix * (p.jl + AI_GAP) + (1 - S.mix) * (p.al + AI_GAP);
      return { b, p, dAll: p.firstDmg, kAll: p.firstDead, s200: Math.min(1, W200 / len), s105: Math.min(1, W105 / len) };
    }).sort((x, y) => x.b.wsm - y.b.wsm || y.b.avg - x.b.avg || x.b.name.localeCompare(y.b.name));
    const keys = ["dAll", "kAll", "s200", "s105"];
    const best = {}; keys.forEach(k => { best[k] = Math.max(...rows.map(r => r[k])); });
    const mark = (k, v) => (best[k] > 0 && Math.abs(v - best[k]) <= 1e-9 * Math.max(1, best[k]) ? "best" : "");
    const tb = $("passTable").querySelector("tbody");
    tb.textContent = "";
    const d = S.pass.d;
    rows.forEach(r => {
      const tr = document.createElement("tr");
      nameCell(tr, r.b);
      addCell(tr, signed(r.b.wsm), "", "Speed");
      addCell(tr, `${r.p.h1 + d} and ${r.p.h2 + d}`, "", "Jab hits on frames");
      addCell(tr, `${r.p.jl} frames`, "", "Jab length");
      addCell(tr, nf0.format(r.dAll), "sep " + mark("dAll", r.dAll), "Damage to the monster");
      addCell(tr, pct(r.kAll), mark("kAll", r.kAll), "Monster dead");
      addCell(tr, pct(r.s200), "sep " + mark("s200", r.s200), `Landings attacked, 200% FCR`);
      addCell(tr, pct(r.s105), mark("s105", r.s105), `Landings attacked, 105% FCR`);
      tb.appendChild(tr);
    });
  }

  function renderBreakpoints(S) {
    const build = (id, framesOf) => {
      const tbl = $(id); tbl.textContent = "";
      const start = GROUPS.map(g => framesOf(totalSpeed(0, g.wsm, S.sias)));
      const hiF = Math.max(...start), loF = framesOf(75);
      const thead = document.createElement("thead"), hr = document.createElement("tr");
      const th0 = document.createElement("th"); th0.scope = "col"; th0.textContent = "Speed group"; hr.appendChild(th0);
      for (let f = hiF; f >= loF; f--) { const th = document.createElement("th"); th.scope = "col"; th.textContent = `${f}f`; hr.appendChild(th); }
      thead.appendChild(hr); tbl.appendChild(thead);
      const tb = document.createElement("tbody");
      GROUPS.forEach((g, n) => {
        const tr = document.createElement("tr");
        const c0 = document.createElement("td");
        c0.appendChild(keyOf(g));
        c0.appendChild(document.createTextNode(`${signed(g.wsm)}: ${g.label}`));
        tr.appendChild(c0);
        for (let f = hiF; f >= loF; f--) {
          const c = document.createElement("td");
          if (f <= start[n]) {
            let need = null;
            for (let i = 0; i <= 600; i++) if (framesOf(totalSpeed(i, g.wsm, S.sias)) <= f) { need = i; break; }
            c.textContent = need === null ? "—" : String(need);
            if (need === 0) c.className = "zero";
          }
          tr.appendChild(c);
        }
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
    };
    build("bpJab", jabFrames);
    build("bpA1", swingFrames);
  }

  const nfp = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
  function renderStrikes(C) {
    el.csOut.textContent = `${C.cs}%`;
    el.dsOut.textContent = `${C.ds}%`;
    $("csInfo").dataset.tip = `At most 75%. A Critical Strike does ${nf0.format(C.cm * 100)}% damage.`;
    $("dsInfo").dataset.tip = `Rolled when a hit isn't a Critical Strike; at most ${C.dsCap}%. A Deadly Strike does ${nf0.format(C.dm * 100)}% damage.`;
    if (tipOn && (tipOn.id === "csInfo" || tipOn.id === "dsInfo")) showTip(tipOn);
    // past the cap, said under the slider
    const over = C.ds > C.dsCap, dsNote = $("dsNote");
    dsNote.hidden = !over;
    dsNote.textContent = over ? `Only ${C.dsCap}% counts: the cap is 75% plus Maximum Deadly Strike` : "";
    const shareC = nfp.format(C.pc * 100), shareD = nfp.format((1 - C.pc) * C.pd * 100);
    // each strike's damage said with its share (a multiplier adds to the 200% / 150%)
    const dmgC = nf0.format(C.cm * 100), dmgD = nf0.format(C.dm * 100);
    const which = C.pc && C.pd
      ? `${shareC}% of hits are Critical Strikes, at ${dmgC}% damage, and ${shareD}% Deadly Strikes, at ${dmgD}%`
      : C.pc ? `${shareC}% of hits are Critical Strikes, at ${dmgC}% damage`
      : `${shareD}% of hits are Deadly Strikes, at ${dmgD}% damage`;
    $("critSum").textContent = C.mean === 1 ? "No Critical or Deadly Strikes: every hit does its plain damage."
      : `${which}: the average hit does ${nfp.format(C.mean * 100)}% of its plain damage.`;
  }

  // ---------- the (i) texts: on hover, keyboard focus or a tap ----------
  const help = document.createElement("div");
  help.className = "mm-help"; help.id = "mm-help"; help.setAttribute("role", "tooltip"); help.hidden = true;
  root.appendChild(help);
  let tipOn = null;
  function showTip(t) {
    if (!t.dataset.tip) return;
    if (tipOn && tipOn !== t) tipOn.removeAttribute("aria-describedby");
    tipOn = t;
    help.textContent = t.dataset.tip;
    help.hidden = false;
    t.setAttribute("aria-describedby", "mm-help");
    const r = t.getBoundingClientRect(), R = root.getBoundingClientRect();
    const w = help.offsetWidth, vw = document.documentElement.clientWidth;
    const x = Math.min(Math.max(r.left + r.width / 2 - w / 2, 8), vw - w - 8);
    help.style.left = `${x - R.left}px`;
    help.style.top = `${r.bottom - R.top + 8}px`;
  }
  function hideTip() {
    if (tipOn) tipOn.removeAttribute("aria-describedby");
    tipOn = null;
    help.hidden = true;
  }
  root.addEventListener("pointerover", e => {
    if (e.pointerType !== "mouse") return;
    const t = e.target.closest("button.info");
    if (t && t !== tipOn) showTip(t);
  });
  root.addEventListener("pointerout", e => {
    if (e.pointerType === "mouse" && tipOn && !tipOn.contains(e.relatedTarget)) hideTip();
  });
  root.addEventListener("focusin", e => { const t = e.target.closest("button.info"); if (t) showTip(t); });
  root.addEventListener("focusout", e => { if (tipOn && e.target === tipOn) hideTip(); });
  root.addEventListener("click", e => { const t = e.target.closest("button.info"); if (t) showTip(t); });
  document.addEventListener("click", e => { if (tipOn && !e.target.closest("button.info")) hideTip(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && tipOn) hideTip(); });
  window.addEventListener("scroll", () => { if (tipOn) hideTip(); }, { passive: true });

  // ---------- the strip: shown while the tiles are off screen (under the website's bar counts as off) ----------
  const dock = $("mm-dock");
  let flashT = 0;
  const flashDock = () => { dock.classList.add("flash"); clearTimeout(flashT); flashT = setTimeout(() => dock.classList.remove("flash"), 450); };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(es => { for (const e of es) dock.classList.toggle("on", !e.isIntersecting); },
      { rootMargin: "-64px 0px 0px 0px" }).observe(root.querySelector(".tiles"));
  }

  // ---------- wiring ----------
  function renderAll() {
    const S = settings();
    state.S = S;
    el.edOut.textContent = `+${S.ed}%`;
    el.supOut.textContent = S.sup ? `+${S.sup}%` : "None";
    el.sup.setAttribute("aria-valuetext", S.sup ? `${S.sup}% enhanced damage` : "Not superior");
    renderStrikes(S.crit);
    $("lvlNote").textContent = `Strength ${S.str}, Dexterity ${S.dex} before gear`;
    $("jabNote").textContent = `Jab level ${S.jabLvl}: +${S.jabPct}% damage`;
    state.series = computeSeries(S);
    state.pass = computePass(S);
    renderTiles(S);
    for (const k in CHARTS) drawChart(k);
    renderPass(S);
    renderTable(S);
    renderBreakpoints(S);
    emphasize(null);
  }
  // from a chart: the tiles are likely off screen, so the strip catches the eye
  function setIas(i) { el.ias.value = String(i); el.iasNum.value = String(i); renderAll(); flashDock(); }

  el.ias.addEventListener("input", () => { el.iasNum.value = el.ias.value; renderAll(); });
  el.iasNum.addEventListener("input", () => { const v = num(el.iasNum, 0, MAX_IAS, 0); el.ias.value = String(Math.round(v)); renderAll(); });
  ["ed", "sup", "cs", "ds"].forEach(k => el[k].addEventListener("input", renderAll));
  ["lvl", "plus", "mix", "showLow", "pDelay"].forEach(k => el[k].addEventListener("change", renderAll));
  ["other", "sias", "cbc", "cbe", "csMul", "dsMul", "dsMax", "pLife", "pPr"].forEach(k => el[k].addEventListener("input", renderAll));
  el.target.addEventListener("change", () => {
    const T = TARGETS[el.target.value];
    if (T) { el.life.value = String(T.life); el.pr.value = String(T.pr); el.cbs.value = T.cbs; }
    renderAll();
  });
  ["life", "pr"].forEach(k => el[k].addEventListener("input", () => { el.target.value = "custom"; renderAll(); }));
  el.cbs.addEventListener("change", () => { el.target.value = "custom"; renderAll(); });

  buildLegends();
  renderAll();
  // redraw the charts when the page width changes
  let raf = 0, lastW = 0;
  const main = $("mm-main");
  new ResizeObserver(() => {
    const w = main.clientWidth;
    if (w === lastW) return; lastW = w;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { for (const k in CHARTS) drawChart(k); });
  }).observe(main);
})();
