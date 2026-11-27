
(() => {
  "use strict";

  // Written by tools/mendeln_data.py (never by hand): lxp: the base experience of each monster level (/ 100 of a
  // 1,000 monster's); span: the experience each character level takes; ratio: the experience a character of each
  // level gets (/ 1024); mon: the wave monsters' experience; pen: the level penalty (/ 256) by how many levels you are
  // above a monster; phases: [waves, normal monsters, champions, uniques] on average; minions: per unique; berserk: the
  // champions' share of berserkers; party: a party's bonus per member after the first; cap: a share's most; area: each
  // tier's area level; clears: the tier's average map's full clear, [normal monsters, champions, uniques] (one player,
  // no penalty): p non-magical, r rolled rare, f Fortified; rolled: the average rolled rare map's rolls.
  /* mendeln-data:start */
  const DATA = {"lxp":{"84":49836,"85":51195,"86":52554,"87":53913,"88":55272,"89":56631,"90":57990,"91":59349,"92":60708,"93":62067,"94":63426,"95":64785,"96":66144},"span":{"80":61702579,"81":67255812,"82":73308835,"83":79906630,"84":87098226,"85":94937067,"86":103481403,"87":112794729,"88":122946255,"89":134011418,"90":146072446,"91":159218965,"92":173548673,"93":189168053,"94":206193177,"95":224750564,"96":244978115,"97":267026144,"98":291058498},"ratio":{"80":496,"81":448,"82":400,"83":352,"84":304,"85":256,"86":192,"87":144,"88":108,"89":81,"90":61,"91":46,"92":35,"93":26,"94":20,"95":15,"96":11,"97":8,"98":6},"mon":1000,"pen":[256,256,256,256,256,256,207,159,110,61,13],"phases":[[20,72.5,0.0,0.0],[15,38.3333,15.0,0.0],[10,15.4167,5.0,10.0]],"minions":4.5,"berserk":0.2,"party":0.34765625,"cap":8388607,"area":{"1":87,"2":88,"3":89},"clears":{"1":{"p":[48038597,5756182,53310690],"pf":[24183885,2878091,26655345],"r":[95327681,7745266,71867308],"rf":[47847665,3858923,35801662]},"2":{"p":[53054827,6229634,61195156],"pf":[26638274,3114817,30597578],"r":[113366608,8357590,82033141],"rf":[56815275,4163631,40862532]},"3":{"p":[49153792,5857327,56000357],"pf":[24773739,2928664,28000178],"r":[111330751,8699695,83004963],"rf":[55922300,4298099,41018442]}},"rolled":{"1":{"density":91,"rarity":14,"xp":12},"2":{"density":104,"rarity":18,"xp":14},"3":{"density":117,"rarity":22,"xp":16}}};
  /* mendeln-data:end */

  const D = DATA;
  const $ = id => document.getElementById(id);
  const root = $("mnBar").closest(".mendeln-map") || document.documentElement;
  const L0 = 80, L1 = 98;
  const LEVELS = Array.from({ length: L1 - L0 + 1 }, (_, i) => L0 + i);
  const STORE = "erazure-mendeln";
  const DEF = { lvl: 95, tier: 3, plus: false, fort: false, players: 1, xp: 0, evMin: 2, clMin: 15 };
  // the setup in the address, as Rune Odds keeps its own (the additions audit, SW-08): a link opens on it
  // ?level=95&map=3&plus=0&fortified=0&players=1&xp=0&event=2&clear=15
  const ADDR = [["lvl", "level"], ["tier", "map"], ["plus", "plus"], ["fort", "fortified"], ["players", "players"], ["xp", "xp"],
    ["evMin", "event"], ["clMin", "clear"]];
  const S = load();

  function load() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(STORE) || "{}") || {}; } catch (e) { s = {}; }
    const q = new URLSearchParams(location.search);
    for (const [k, p] of ADDR) {
      const v = q.get(p);
      if (v === null || v === "" || !isFinite(+v)) continue;
      s[k] = typeof DEF[k] === "boolean" ? +v === 1 : +v;
    }
    const o = { ...DEF };
    const num = (v, lo, hi, d) => (typeof v === "number" && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
    o.lvl = Math.round(num(s.lvl, L0, L1, DEF.lvl));
    o.tier = [1, 2, 3].includes(s.tier) ? s.tier : DEF.tier;
    o.plus = s.plus === true; o.fort = s.fort === true;
    o.players = Math.round(num(s.players, 1, 8, DEF.players));
    o.xp = num(s.xp, 0, 100, DEF.xp);
    o.evMin = num(s.evMin, 0.5, 30, DEF.evMin); o.clMin = num(s.clMin, 1, 120, DEF.clMin);
    return o;
  }
  function save() {
    const same = Object.keys(DEF).every(k => S[k] === DEF[k]);
    try { if (same) localStorage.removeItem(STORE); else localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { /* private window */ }
    const p = new URLSearchParams(location.search);
    for (const [k, n] of ADDR) p.set(n, typeof S[k] === "boolean" ? (S[k] ? "1" : "0") : String(S[k]));
    try { history.replaceState(null, "", location.pathname + "?" + p.toString() + location.hash); } catch (e) { /* a file */ }
    resetBtn();
  }

  // ---------- the model ----------
  const pen = (c, m) => (c >= m ? D.pen[Math.min(c - m, 10)] / 256 : c / m);
  const COUNT = D.phases.reduce((a, [, n, c, u]) => ({ n: a.n + n, c: a.c + c, u: a.u + u }), { n: 0, c: 0, u: 0 });
  // a wave monster's experience when it spawns, for the players in the game
  function base(alvl, players) {
    const b = Math.floor(D.mon * D.lxp[alvl] / 100);
    return b + Math.floor(b * 50 * (players - 1) / 100);
  }
  // one kill's experience for each member of a party of `players`, all of level c
  function share(e, m, c, players, xp) {
    if (c >= 99) return 0;
    const sh = Math.min(e * (1 + D.party * (players - 1)) / players, D.cap);
    return sh * pen(c, m) * D.ratio[c] / 1024 * (1 + xp / 100);
  }
  // s: {lvl, tier, plus, fort, players, xp} -> each kind's experience per monster, per phase and in all
  function event(s) {
    const a = D.area[s.tier] + (s.plus ? 1 : 0), b = base(a, s.players), f = s.fort ? 2 : 1;
    const one = (e, m) => f * share(e, m, s.lvl, s.players, s.xp);
    const pm = {
      n: one(b, a),
      c: (1 - D.berserk) * one(3 * b, a + 2) + D.berserk * one(5 * b, a + 3),
      u: one(5 * b, a + 3), m: one(b, a),
    };
    const phases = D.phases.map(([, n, c, u]) => n * pm.n + c * pm.c + u * (pm.u + D.minions * pm.m));
    const total = phases.reduce((x, y) => x + y, 0);
    return { total, phases, pm, pct: 100 * total / D.span[s.lvl] };
  }
  // a full clear of the tier's average map, for one player before the experience ratio and +% experience (as the
  // event's below: the two cancel in a comparison)
  function clear(s, rolled) {
    const c = D.clears[s.tier][(rolled ? "r" : "p") + (s.fort ? "f" : "")];
    const L = D.area[s.tier], m = L + (s.plus ? 1 : 0), sc = D.lxp[m] / D.lxp[L];
    return (s.fort ? 2 : 1) * sc * (c[0] * pen(s.lvl, m) + c[1] * pen(s.lvl, m + 2) + c[2] * pen(s.lvl, m + 3));
  }
  const eventRaw = s => event({ ...s, players: 1, xp: 0 }).total / (D.ratio[s.lvl] / 1024);
  const vsClear = (s, rolled) => eventRaw(s) / clear(s, rolled);

  // ---------- words and numbers ----------
  const fmtPct = v => (v >= 10 ? v.toFixed(1) : v >= 1 ? v.toFixed(2) : String(+v.toPrecision(2))) + "%";
  const fmtExp = v => (v >= 1e7 ? (v / 1e6).toFixed(1) + "M" : v >= 1e6 ? (v / 1e6).toFixed(2) + "M"
    : Math.round(v / 1e3).toLocaleString("en-US") + "k");
  const fmtX = v => String(Math.round(v * 100) / 100);
  const fmtR = v => v.toFixed(2);
  const fmtMin = v => (v >= 10 ? String(Math.round(v)) : String(Math.round(v * 10) / 10));
  const tierWord = s => `T${s.tier}`;
  const mapWords = s => {
    const parts = [];
    if (s.fort) parts.push("Fortified");
    if (s.plus) parts.push("+1 area level");
    return parts.length ? `${tierWord(s)} map, ${parts.join(", ")}` : `${tierWord(s)} map`;
  };
  const partyWords = n => (n === 1 ? "solo" : `${n} players in a party`);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const cell = (tr, text, cls) => { const td = tr.insertCell(); td.textContent = text; if (cls) td.className = cls; return td; };

  // ---------- the answer ----------
  function renderAnswer() {
    const ev = event(S), nm = vsClear(S, false), rr = vsClear(S, true);
    $("mnSetup").textContent = `Level ${S.lvl} · ${partyWords(S.players)} · ${mapWords(S)}` + (S.xp ? ` · +${S.xp}% experience` : "");
    $("mnPct").textContent = fmtPct(ev.pct);
    $("mnEachA").textContent = S.players > 1 ? ", each" : "";
    $("mnExp").textContent = fmtExp(ev.total);
    $("mnNm").textContent = fmtR(nm);
    $("mnRr").textContent = fmtR(rr);
    const mins = rr * S.clMin;
    const who = S.players > 1 ? `each of the ${S.players} of you gets` : "you get";
    $("mnSay").textContent = S.lvl >= 99 ? "At level 99 there's no experience to gain."
      : `Stay for him: in about ${fmtMin(S.evMin)} minutes ${who} as much as ${fmtMin(mins)} minutes of clearing a corrupted rare ${tierWord(S)} map gives.`;
  }

  // ---------- the four choices ----------
  const ROOM = 5;  // em the bars leave free for their values, at the track's 14px
  function ladderSteps() {
    const b = { lvl: S.lvl, xp: S.xp, tier: 1, plus: false, fort: false, players: 1 };
    const steps = [
      { label: "Solo, on a T1 map", s: b },
      { label: "Fortified", s: { ...b, fort: true } },
      { label: "A party of 8", s: { ...b, fort: true, players: 8 } },
      { label: "A T3 map", s: { ...b, fort: true, players: 8, tier: 3 } },
      { label: "+1 area level", s: { ...b, fort: true, players: 8, tier: 3, plus: true } },
    ];
    steps.forEach(st => { st.v = event(st.s).pct; });
    return steps;
  }
  function renderLadder() {
    const steps = ladderSteps(), max = steps[steps.length - 1].v, box = $("mnLadder");
    box.textContent = "";
    steps.forEach((st, i) => {
      const row = el("div", "row" + (i === steps.length - 1 ? " row-last" : ""));
      row.appendChild(el("span", "lab", st.label));
      row.appendChild(el("span", "mult" + (i ? "" : " start"), i ? "×" + fmtX(st.v / steps[i - 1].v) : "start"));
      const tr = el("div", "track"), fill = el("div", "fill"), val = el("span", "val", fmtPct(st.v));
      fill.style.width = val.style.left = `calc((100% - ${ROOM}em) * ${st.v / max})`;
      tr.append(fill, val);
      row.appendChild(tr);
      box.appendChild(row);
      st.track = tr;
    });
    // your setup, as a dashed line over the bars
    const you = event(S).pct, mark = el("div", "mn-you");
    const first = steps[0].track, last = steps[steps.length - 1].track;
    const place = () => {
      const bx = box.getBoundingClientRect(), tr = first.getBoundingClientRect(), lr = last.getBoundingClientRect();
      const room = tr.width - ROOM * parseFloat(getComputedStyle(first).fontSize);
      mark.style.left = (tr.left - bx.left + room * Math.min(1, you / max)) + "px";
      mark.style.top = (tr.top - bx.top - 4) + "px";
      mark.style.height = (lr.bottom - tr.top + 8) + "px";
    };
    mark.appendChild(el("span", "", `You: ${fmtPct(you)}`));
    box.appendChild(mark);
    place();
    box._place = place;
    const total = max / steps[0].v;
    $("mnLadSub").textContent = `At level ${S.lvl}, each player's share of the level per event, each choice on top of the ones before it: ${fmtX(total)} times in all. The dashed line is your setup.`;
    $("mnWhyF").textContent = "×" + fmtX(steps[1].v / steps[0].v);
    $("mnWhyP").textContent = "×" + fmtX(steps[2].v / steps[1].v);
    $("mnWhyP2").textContent = fmtX(steps[2].v / steps[1].v);
    $("mnWhyT").textContent = "×" + fmtX(steps[3].v / steps[2].v);
    $("mnWhyA").textContent = "×" + fmtX(steps[4].v / steps[3].v);
  }

  // ---------- every map at your level ----------
  const COLS = [[false, false], [true, false], [false, true], [true, true]];  // [plus, fort]
  function renderGrid() {
    const tb = $("mnGrid").tBodies[0];
    const hadFocus = tb.contains(document.activeElement) ? document.activeElement.dataset.key : null;
    tb.textContent = "";
    const vals = [1, 2, 3].map(t => COLS.map(([plus, fort]) => event({ ...S, tier: t, plus, fort }).pct));
    const best = Math.max(...vals.flat()), base = vals[0][0];
    [1, 2, 3].forEach((t, r) => {
      const tr = tb.insertRow();
      if (t === S.tier) tr.className = "cur";
      const th = cell(tr, `T${t}`, "name");
      th.appendChild(el("small", "", `area level ${D.area[t]}`));
      COLS.forEach(([plus, fort], k) => {
        const td = tr.insertCell(); td.className = "c";
        const v = vals[r][k], cur = t === S.tier && plus === S.plus && fort === S.fort;
        const b = el("button", (v === best ? "best" : "") + (cur ? " cur" : ""));
        b.type = "button"; b.dataset.key = `${t}${k}`;
        b.setAttribute("aria-pressed", String(cur));
        const tags = [];
        if (cur) tags.push(["You", "tagline you"]);
        if (v === best) tags.push(["✓ Best", "tagline"]);
        tags.forEach(([w, c]) => b.appendChild(el("span", c, w)));
        b.appendChild(el("b", "", fmtPct(v)));
        b.appendChild(el("small", "", v === base ? "the T1 map" : "×" + fmtX(v / base) + " of T1"));
        b.setAttribute("aria-label", `T${t}${plus ? ", +1 area level" : ""}${fort ? ", Fortified" : ""}: ${fmtPct(v)} of the level${cur ? ", your setup" : ""}${v === best ? ", the best" : ""}`);
        b.addEventListener("click", () => { S.tier = t; S.plus = plus; S.fort = fort; update(); });
        td.appendChild(b);
      });
    });
    $("mnGridSub").textContent = `Your share of the level per event, ${S.players === 1 ? "solo" : `each of ${S.players} players in a party`}${S.xp ? `, +${S.xp}% experience` : ""}. Pick a map here or in the bar.`;
    if (hadFocus) { const b = tb.querySelector(`[data-key="${hadFocus}"]`); if (b) b.focus({ preventScroll: true }); }
  }

  // ---------- your level ----------
  const SVGNS = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs, parent) => { const n = document.createElementNS(SVGNS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  function niceTicks(lo, hi, n) {
    const span = hi - lo, raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(k => k * p).find(s => span / s <= n) || 10 * p;
    const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, out = [];
    for (let v = a; v <= b + step / 2; v += step) out.push(+v.toFixed(8));
    return out;
  }
  // by area level: the T1 map is the line at 1
  const SERIES = [
    { add: 3, label: "T3, +1 area level", color: "var(--s3)", dash: "" },
    { add: 2, label: "T3, or T2 +1", color: "var(--s2)", dash: "8 4" },
    { add: 1, label: "T2, or T1 +1", color: "var(--s1)", dash: "2 4" },
  ];
  const areaOf = s => D.area[s.tier] + (s.plus ? 1 : 0);
  const rel = (c, add) => {
    const t1 = { lvl: c, tier: 1, plus: false, fort: false, players: 1, xp: 0 };
    const s = add === 3 ? { ...t1, tier: 3, plus: true } : add === 2 ? { ...t1, tier: 3 } : { ...t1, tier: 2 };
    return event(s).total / event(t1).total;
  };
  const REL = SERIES.map(se => LEVELS.map(c => rel(c, se.add)));
  const keySvg = (color, dash, w) => {
    const s = mk("svg", { width: 26, height: 10, viewBox: "0 0 26 10", "aria-hidden": "true" });
    mk("line", { x1: 1, x2: 25, y1: 5, y2: 5, stroke: color, "stroke-width": w || 2.5, "stroke-dasharray": dash || "none", "stroke-linecap": "round" }, s);
    return s;
  };
  function buildLegend() {
    const ul = $("mnLegend");
    SERIES.forEach(se => { const li = el("li"); li.append(keySvg(se.color, se.dash), el("span", "", se.label)); ul.appendChild(li); });
    const li = el("li"); li.append(keySvg("var(--fg2)", "3 3", 1.5), el("span", "", "T1 = 1x")); ul.appendChild(li);
  }
  function drawLevel() {
    const plot = $("mnPlot");
    const W = Math.max(300, Math.round(plot.clientWidth || 640)), narrow = W < 560;
    const H = narrow ? 250 : 290;
    const m = { l: narrow ? 40 : 48, r: narrow ? 64 : 150, t: 26, b: 42 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b, n = LEVELS.length - 1;
    const ticks = niceTicks(1, Math.max(...REL.flat()) * 1.02, narrow ? 4 : 7);
    $("mnLev98").textContent = fmtR(REL[0][n]);
    const y0 = 1, y1 = ticks[ticks.length - 1];
    const X = i => m.l + i / n * iw, Y = v => m.t + (1 - (v - y0) / (y1 - y0)) * ih;
    const hadFocus = plot.contains(document.activeElement);
    plot.textContent = "";
    const svg = mk("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", tabindex: "0",
      "aria-label": "Each map's event against a T1 map's, at every character level from 80 to 98; the table under the chart lists every value" }, plot);
    const g = mk("g", {}, svg);
    ticks.forEach(v => {
      mk("line", { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), stroke: "var(--grid)", "stroke-width": 1, "shape-rendering": "crispEdges" }, g);
      const t = mk("text", { x: m.l - 8, y: Y(v) + 4, "text-anchor": "end", class: "tick" }, g); t.textContent = fmtX(v) + "x";
    });
    const step = narrow ? 3 : 2;
    LEVELS.forEach((c, i) => {
      if ((c - L0) % step) return;
      const t = mk("text", { x: X(i), y: m.t + ih + 17, "text-anchor": "middle", class: "tick" }, g); t.textContent = String(c);
    });
    const xt = mk("text", { x: m.l + iw / 2, y: H - 4, "text-anchor": "middle", class: "axis-title" }, g); xt.textContent = "Your level";
    // the T1 map: 1x
    mk("line", { x1: m.l, x2: W - m.r, y1: Y(1), y2: Y(1), stroke: "var(--fg2)", "stroke-width": 1.5, "stroke-dasharray": "3 3", opacity: 0.8 }, svg);
    // your level
    const mx = X(S.lvl - L0);
    mk("line", { x1: mx, x2: mx, y1: m.t - 6, y2: m.t + ih, stroke: "var(--accent)", "stroke-width": 1.5 }, svg);
    const ml = mk("text", { x: Math.min(Math.max(mx, m.l + 30), W - m.r - 30), y: m.t - 10, "text-anchor": "middle", class: "marker-label" }, svg);
    ml.textContent = `Level ${S.lvl}`;
    const curAdd = areaOf(S) - D.area[1];
    SERIES.forEach((se, k) => {
      const d = REL[k].map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join("");
      mk("path", { d, fill: "none", stroke: se.color, "stroke-width": se.add === curAdd ? 3.5 : 2.2, "stroke-dasharray": se.dash || "none",
        "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
    });
    // labels at the right end, kept 14px apart
    const ends = SERIES.map((se, k) => ({ se, v: REL[k][n], y: Y(REL[k][n]) }));
    ends.push({ se: { label: "T1", add: 0 }, v: 1, y: Y(1) });
    ends.sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 14);
    ends.forEach(e => {
      const t = mk("text", { x: W - m.r + 8, y: e.y + 4, class: "end-label" + (e.se.add === curAdd ? " cur" : "") }, svg);
      t.textContent = narrow ? `${fmtX(e.v)}x` : `${e.se.label} ${fmtX(e.v)}x`;
    });
    // hover
    const cross = mk("line", { y1: m.t, y2: m.t + ih, stroke: "var(--fg2)", "stroke-width": 1, opacity: 0 }, svg);
    const dots = SERIES.map(se => mk("circle", { r: 4, fill: se.color, stroke: "var(--panel)", "stroke-width": 2, opacity: 0 }, svg));
    const hit = mk("rect", { x: m.l - 6, y: 0, width: iw + 12, height: m.t + ih + 24, fill: "transparent", style: "cursor: crosshair" }, svg);
    const tip = el("div", "mn-tip"); tip.hidden = true; plot.appendChild(tip);
    let hover = null;
    const show = (i, px) => {
      i = Math.max(0, Math.min(n, i)); hover = i;
      cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i)); cross.setAttribute("opacity", 0.55);
      dots.forEach((dot, k) => { dot.setAttribute("cx", X(i)); dot.setAttribute("cy", Y(REL[k][i])); dot.setAttribute("opacity", 1); });
      tip.textContent = "";
      tip.appendChild(el("div", "mn-tip-head", `Level ${LEVELS[i]}`));
      SERIES.forEach((se, k) => {
        const row = el("div", "mn-tip-row");
        row.append(keySvg(se.color, se.dash), el("b", "", fmtR(REL[k][i]) + "x"), el("span", "", se.label));
        tip.appendChild(row);
      });
      tip.appendChild(el("div", "mn-tip-foot", "Against a T1 map's event. Click to pick this level."));
      tip.hidden = false;
      const pw = plot.clientWidth, tw = tip.offsetWidth, scale = pw / W;
      const xpx = px !== undefined ? px : X(i) * scale;
      let left = xpx + 14; if (left + tw > pw) left = Math.max(0, xpx - tw - 14);
      tip.style.left = left + "px"; tip.style.top = Math.max(0, (m.t + 4) * scale) + "px";
    };
    const hide = () => { cross.setAttribute("opacity", 0); dots.forEach(d => d.setAttribute("opacity", 0)); tip.hidden = true; hover = null; };
    const toI = ev => { const r = svg.getBoundingClientRect(); const x = (ev.clientX - r.left) * W / r.width; return { i: Math.round((x - m.l) / iw * n), px: ev.clientX - r.left }; };
    hit.addEventListener("pointermove", ev => { const p = toI(ev); show(p.i, p.px); });
    hit.addEventListener("pointerdown", ev => { const p = toI(ev); show(p.i, p.px); });
    hit.addEventListener("pointerleave", hide);
    hit.addEventListener("click", ev => { const p = toI(ev); S.lvl = L0 + Math.max(0, Math.min(n, p.i)); update(); });
    svg.addEventListener("focus", () => show(hover ?? S.lvl - L0));
    svg.addEventListener("blur", hide);
    svg.addEventListener("keydown", ev => {
      const cur = hover ?? S.lvl - L0;
      if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") { ev.preventDefault(); show(cur + (ev.key === "ArrowRight" ? 1 : -1)); }
      else if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); S.lvl = L0 + cur; update(); }
      else if (ev.key === "Escape") hide();
    });
    if (hadFocus) svg.focus({ preventScroll: true });
  }
  function renderLevelTable() {
    const t = $("mnLevTable");
    t.textContent = "";
    const head = t.createTHead().insertRow();
    ["Your level", "T1", "T2, or T1 +1", "T3, or T2 +1", "T3, +1 area level"].forEach(h => { const th = el("th", "", h); th.scope = "col"; head.appendChild(th); });
    const tb = t.createTBody();
    const adds = [[1, false], [2, false], [3, false], [3, true]];
    LEVELS.forEach(c => {
      const tr = tb.insertRow();
      if (c === S.lvl) tr.className = "cur";
      cell(tr, String(c), "name");
      adds.forEach(([tier, plus]) => cell(tr, fmtPct(event({ ...S, lvl: c, tier, plus }).pct)));
    });
    const cap = t.createCaption(); cap.className = "note"; cap.style.textAlign = "left"; cap.style.captionSide = "bottom"; cap.style.paddingTop = "6px";
    cap.textContent = `Your share of the level per event, ${partyWords(S.players)}${S.fort ? ", Fortified" : ""}${S.xp ? `, +${S.xp}% experience` : ""}.`;
  }

  // ---------- against clearing the map ----------
  function renderClear() {
    const nm = vsClear(S, false), rr = vsClear(S, true), r = D.rolled[S.tier];
    $("mnVsNm").textContent = fmtR(nm);
    $("mnVsRr").textContent = fmtR(rr);
    $("mnRolls").textContent = `on average +${r.density}% Monster Density, +${r.rarity}% Monster Rarity, and +${r.xp}% Experience`;
    $("mnClearSub").textContent = `One event against a full clear of the tier's average map, both for your setup: level ${S.lvl}, ${mapWords(S)}, ${partyWords(S.players)}.`;
    const ev = event(S).pct;
    const rows = [
      { lab: "This event", sm: `${fmtMin(S.evMin)} minutes`, v: ev / S.evMin, first: true },
      { lab: `Clearing a corrupted rare ${tierWord(S)} map`, sm: `${fmtMin(S.clMin)} minutes`, v: ev / rr / S.clMin },
      { lab: `Clearing a non-magical ${tierWord(S)} map`, sm: `${fmtMin(S.clMin)} minutes`, v: ev / nm / S.clMin },
    ];
    const max = Math.max(...rows.map(x => x.v)), box = $("mnRate");
    box.textContent = "";
    rows.forEach(x => {
      const row = el("div", "row" + (x.first ? " first" : ""));
      const lab = el("span", "lab", x.lab); lab.appendChild(el("small", "", x.sm));
      const tr = el("div", "track"), fill = el("div", "fill"), val = el("span", "val", fmtPct(x.v));
      fill.style.width = val.style.left = `calc((100% - ${ROOM}em) * ${x.v / max})`;
      tr.append(fill, val); row.append(lab, tr); box.appendChild(row);
    });
    const per = (S.clMin / S.evMin);
    $("mnRateSay").textContent = `A minute of the event gives ${fmtX(rr * per)} times what a minute of clearing a corrupted rare ${tierWord(S)} map does, and ${fmtX(nm * per)} times a non-magical one. One event is worth ${fmtMin(rr * S.clMin)} minutes of clearing a corrupted rare map, or ${fmtMin(nm * S.clMin)} of a non-magical one.`;
  }

  // ---------- the waves ----------
  function waveExp(ev) {
    const out = [];
    D.phases.forEach(([w], k) => { for (let i = 0; i < w; i++) out.push(ev.phases[k] / w); });
    return out;
  }
  function drawWaves() {
    const plot = $("mnWavePlot"), ev = event(S), per = waveExp(ev), nW = per.length;
    const cum = [0]; per.forEach(v => cum.push(cum[cum.length - 1] + v));
    const pc = cum.map(v => (ev.total ? 100 * v / ev.total : 0));
    const W = Math.max(300, Math.round(plot.clientWidth || 640)), narrow = W < 560;
    const H = narrow ? 240 : 270;
    const m = { l: narrow ? 40 : 48, r: 20, t: 34, b: 42 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const X = w => m.l + w / nW * iw, Y = v => m.t + (1 - v / 100) * ih;
    plot.textContent = "";
    const svg = mk("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img",
      "aria-label": "The event's experience so far, wave by wave; the table under the chart gives each phase's share" }, plot);
    // the three phases
    let w0 = 0;
    const names = narrow ? ["Normal", "+ champions", "+ uniques"] : ["Normal monsters", "+ champions", "+ uniques, minions"];
    D.phases.forEach(([w], k) => {
      const x0 = X(w0), x1 = X(w0 + w);
      if (k % 2 === 1) mk("rect", { x: x0, y: m.t, width: x1 - x0, height: ih, fill: "var(--accent-wash)" }, svg);
      const t = mk("text", { x: (x0 + x1) / 2, y: m.t - 10, "text-anchor": "middle", class: "band-label" }, svg);
      t.textContent = `${names[k]}`;
      w0 += w;
    });
    [0, 25, 50, 75, 100].forEach(v => {
      mk("line", { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), stroke: "var(--grid)", "stroke-width": 1, "shape-rendering": "crispEdges" }, svg);
      const t = mk("text", { x: m.l - 8, y: Y(v) + 4, "text-anchor": "end", class: "tick" }, svg); t.textContent = v + "%";
    });
    [0, 10, 20, 30, 35, 45].forEach(w => {
      if (narrow && w === 30) return;
      const t = mk("text", { x: X(w), y: m.t + ih + 17, "text-anchor": "middle", class: "tick" }, svg); t.textContent = String(w);
    });
    const xt = mk("text", { x: m.l + iw / 2, y: H - 4, "text-anchor": "middle", class: "axis-title" }, svg); xt.textContent = "Waves done (a wave every 1.6 seconds)";
    const pts = pc.map((v, w) => `${X(w).toFixed(1)},${Y(v).toFixed(1)}`);
    mk("path", { d: `M${X(0)},${Y(0)}L${pts.join("L")}L${X(nW)},${Y(0)}Z`, fill: "var(--accent)", opacity: 0.16 }, svg);
    mk("path", { d: `M${pts.join("L")}`, fill: "none", stroke: "var(--accent)", "stroke-width": 2.5, "stroke-linejoin": "round" }, svg);
    let wsum = 0;
    D.phases.slice(0, -1).forEach(([w]) => {
      wsum += w;
      const v = pc[wsum];
      mk("circle", { cx: X(wsum), cy: Y(v), r: 4.5, fill: "var(--accent)", stroke: "var(--panel)", "stroke-width": 2 }, svg);
      const t = mk("text", { x: X(wsum) - 8, y: Y(v) - 10, "text-anchor": "end", class: "pt-label" }, svg);
      t.textContent = `${Math.round(v)}% by wave ${wsum}`;
    });
  }
  function renderPhases() {
    const ev = event(S), tb = $("mnPhases").tBodies[0];
    tb.textContent = "";
    const words = ["0–7 normal monsters", "0–5 normal monsters and 0–2 champions", "0–3 normal, 0–1 champion, and 0–2 uniques"];
    let w0 = 1;
    D.phases.forEach(([w, n, c, u], k) => {
      const tr = tb.insertRow();
      cell(tr, `${w0}–${w0 + w - 1}`, "name");
      const td = cell(tr, words[k], "wide"); td.style.textAlign = "left"; td.style.whiteSpace = "normal";
      cell(tr, n.toFixed(1));
      cell(tr, c ? String(Math.round(c)) : "–");
      cell(tr, u ? `${Math.round(u)} (${Math.round(u * D.minions)})` : "–");
      cell(tr, Math.round(100 * ev.phases[k] / ev.total) + "%");
      w0 += w;
    });
    const tr = tb.insertRow(); tr.className = "cur";
    cell(tr, "All 45", "name");
    cell(tr, "", "wide");
    cell(tr, COUNT.n.toFixed(1)); cell(tr, String(Math.round(COUNT.c))); cell(tr, `${Math.round(COUNT.u)} (${Math.round(COUNT.u * D.minions)})`);
    cell(tr, "100%");
    const last = Math.round(100 * ev.phases[ev.phases.length - 1] / ev.total);
    $("mnWavesSub").textContent = `The champions come from wave 21, the uniques from wave 36. At your setup the last 10 waves bring ${last}% of the event's experience: leave early and that's what you miss.`;
  }

  // ---------- how it's worked out ----------
  function renderHow() {
    $("mnHowCounts").textContent = `${COUNT.n.toFixed(0)} normal monsters, ${Math.round(COUNT.c)} champions, and ${Math.round(COUNT.u)} uniques with ${Math.round(COUNT.u * D.minions)} minions`;
    $("mnHowBase").textContent = [1, 2, 3].map(t => `${base(D.area[t], 1).toLocaleString("en-US")} on a T${t} map`).join(", ")
      + `, and ${base(D.area[3] + 1, 1).toLocaleString("en-US")} on a T3 map with +1 area level`;
    const rolls = ["density", "rarity", "xp"].map((k, i) =>
      `${["Monster Density", "Monster Rarity", "Experience"][i]} +${[1, 2, 3].map(t => D.rolled[t][k]).join(" / +")}%`);
    $("mnHowRolls").textContent = `${rolls[0]}, ${rolls[1]}, and ${rolls[2]}`;
    const part = c => `${+(100 * D.ratio[c] / 1024).toPrecision(2)}%`;
    $("mnHowRatio").textContent = `${part(80)} at level 80, ${part(90)} at 90${[80, 90].includes(S.lvl) ? "" : `, ${part(S.lvl)} at your level ${S.lvl}`}`;
  }

  // ---------- the bar ----------
  const bar = $("mnBar");
  const barHeight = () => root.style.setProperty("--barh", bar.offsetHeight + "px");
  if ("ResizeObserver" in window) new ResizeObserver(barHeight).observe(bar); else barHeight();

  /* your character, shared with the site's other tools: the .ez-char box (javascripts/erazure.js; the website ideas' #11):
     the level, which this page's slider holds from 80 to 98 */
  window.ezCharPage = {fields: ["lvl"], read: () => ({lvl: S.lvl}),
    fit: (c) => Object.assign(c, c.lvl !== undefined ? {lvl: Math.max(L0, Math.min(L1, Math.round(+c.lvl) || L0))} : {}),
    use: (c) => { if (c.lvl !== undefined) { S.lvl = Math.max(L0, Math.min(L1, Math.round(+c.lvl) || L0)); update(); } }};
  function update() {
    $("mnLvl").value = S.lvl;
    $("mnLvlOut").value = $("mnLvlOut").textContent = String(S.lvl);
    document.querySelectorAll('.mendeln-map input[name="mnTier"]').forEach(r => { r.checked = +r.value === S.tier; });
    $("mnPlus").checked = S.plus; $("mnFort").checked = S.fort;
    $("mnPl").value = S.players;
    $("mnPlOut").value = $("mnPlOut").textContent = String(S.players);
    document.querySelectorAll(".mendeln-map .lvlA").forEach(s => { s.textContent = String(S.lvl); });
    document.querySelectorAll(".mendeln-map .tierA").forEach(s => { s.textContent = tierWord(S); });
    renderAnswer();
    renderLadder();
    renderGrid();
    drawLevel();
    renderLevelTable();
    renderClear();
    drawWaves();
    renderPhases();
    renderHow();
    save();
  }
  $("mnLvl").addEventListener("input", e => { S.lvl = +e.target.value; update(); });
  document.querySelectorAll('.mendeln-map input[name="mnTier"]').forEach(r => r.addEventListener("change", e => { S.tier = +e.target.value; update(); }));
  $("mnPlus").addEventListener("change", e => { S.plus = e.target.checked; update(); });
  $("mnFort").addEventListener("change", e => { S.fort = e.target.checked; update(); });
  $("mnPl").addEventListener("input", e => { S.players = +e.target.value; update(); });
  const numBox = (id, key, lo, hi) => {
    const box = $(id);
    box.value = S[key];
    box.addEventListener("input", () => {
      const v = parseFloat(box.value);
      if (!isFinite(v)) return;
      S[key] = Math.min(hi, Math.max(lo, v));
      update();
    });
    box.addEventListener("change", () => { box.value = S[key]; });
  };
  numBox("mnXp", "xp", 0, 100);
  numBox("mnEvMin", "evMin", 0.5, 30);
  numBox("mnClMin", "clMin", 1, 120);
  $("mnLevToggle").addEventListener("click", ev => {
    const open = $("mnLevWrap").hidden;
    $("mnLevWrap").hidden = !open;
    ev.currentTarget.setAttribute("aria-expanded", String(open));
    ev.currentTarget.textContent = open ? "Hide the table" : "Show every level as a table";
  });

  // Reset to the defaults, then Undo reset until the next change; Copy a link to this setup, which the address holds
  // (the additions audit, SW-08: as every calculator has them)
  let undo = null;  // {was: the setup before the reset}, until the setup changes
  const isDef = () => Object.keys(DEF).every(k => S[k] === DEF[k]);
  const boxes = () => { $("mnXp").value = S.xp; $("mnEvMin").value = S.evMin; $("mnClMin").value = S.clMin; };
  function resetBtn() {
    if (undo && !isDef()) undo = null;
    $("mnReset").textContent = undo ? "Undo reset" : "Reset to the defaults";
    $("mnReset").disabled = !undo && isDef();
  }
  $("mnReset").addEventListener("click", () => {
    if (undo) { const was = undo.was; undo = null; Object.assign(S, was); boxes(); update(); return; }
    undo = { was: { ...S } };
    Object.assign(S, DEF);
    boxes(); update();
  });
  $("mnCopy").addEventListener("click", () => {
    save();
    const note = $("mnCopyNote"), link = location.href;
    const done = ok => { note.textContent = ok ? "Copied." : link; if (ok) setTimeout(() => { note.textContent = ""; }, 2500); };
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => done(true), () => done(false)); else done(false);
  });

  buildLegend();
  update();
  // redraw the charts and the ladder's marker when the width changes
  let raf = 0, lastW = 0;
  new ResizeObserver(() => {
    const w = $("mnPlot").clientWidth;
    if (w === lastW) return; lastW = w;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { drawLevel(); drawWaves(); if ($("mnLadder")._place) $("mnLadder")._place(); });
  }).observe($("mnPlot"));
})();
