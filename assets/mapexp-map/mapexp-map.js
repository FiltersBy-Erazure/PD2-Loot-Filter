
(() => {
  "use strict";

  // Written by tools/gen_map_exp.py (never by hand): levels: the "at Level" line's character levels; tiers: [tier,
  // monster level, gold, red and purple from]; penalty: the share of experience a monster gives at each character
  // level (rows) and monster level (columns, from "from"); lineCuts: the "at Level" line's colors, {maps (T1-T3 and
  // unique), dungeons}: [from character level, to, red from, purple from]; maps: [name, tier, full clear / the
  // average's, clear path / the average's, the "at Level" line of the plain map at each character level]; example: the
  // Sanatorium above.
  /* map-exp-data:start */
  const DATA = {"levels":[80,98],"tiers":[[1,87,1.45,1.65,1.8],[2,88,1.5,1.7,1.85],[3,89,1.55,1.75,1.95],[4,92,0.0,2.65,2.9]],"lineCuts":{"maps":[[80,98,2.0,2.5]],"dungeons":[[80,94,10.5,13.0],[95,95,11.5,14.5],[96,96,12.5,15.5],[97,97,12.5,15.5],[98,98,14.5,18.0]]},"penalty":{"from":87,"rows":[[0.9195,0.9091,0.8989,0.8889,0.8791,0.8696,0.8602,0.8511,0.8421],[0.931,0.9205,0.9101,0.9,0.8901,0.8804,0.871,0.8617,0.8526],[0.9425,0.9318,0.9213,0.9111,0.9011,0.8913,0.8817,0.8723,0.8632],[0.954,0.9432,0.9326,0.9222,0.9121,0.9022,0.8925,0.883,0.8737],[0.9655,0.9545,0.9438,0.9333,0.9231,0.913,0.9032,0.8936,0.8842],[0.977,0.9659,0.9551,0.9444,0.9341,0.9239,0.914,0.9043,0.8947],[0.9885,0.9773,0.9663,0.9556,0.9451,0.9348,0.9247,0.9149,0.9053],[1.0,0.9886,0.9775,0.9667,0.956,0.9457,0.9355,0.9255,0.9158],[1.0,1.0,0.9888,0.9778,0.967,0.9565,0.9462,0.9362,0.9263],[1.0,1.0,1.0,0.9889,0.978,0.9674,0.957,0.9468,0.9368],[1.0,1.0,1.0,1.0,0.989,0.9783,0.9677,0.9574,0.9474],[1.0,1.0,1.0,1.0,1.0,0.9891,0.9785,0.9681,0.9579],[1.0,1.0,1.0,1.0,1.0,1.0,0.9892,0.9787,0.9684],[0.8102,1.0,1.0,1.0,1.0,1.0,1.0,0.9894,0.9789],[0.6204,0.8102,1.0,1.0,1.0,1.0,1.0,1.0,0.9895],[0.4306,0.6204,0.8102,1.0,1.0,1.0,1.0,1.0,1.0],[0.2408,0.4306,0.6204,0.8102,1.0,1.0,1.0,1.0,1.0],[0.051,0.2408,0.4306,0.6204,0.8102,1.0,1.0,1.0,1.0],[0.0508,0.051,0.2408,0.4306,0.6204,0.8102,1.0,1.0,1.0]]},"maps":[["Ancestral Trial",1,0.964,0.87,[1.12,1.12,1.12,1.12,1.12,1.12,1.12,1.12,1.116,1.114,1.114,1.11,1.108,1.041,1.003,0.981,0.852,0.717,0.72]],["Fall of Caldeum",1,0.895,0.702,[1.288,1.288,1.288,1.288,1.288,1.288,1.288,1.288,1.285,1.284,1.284,1.279,1.276,1.215,1.188,1.182,1.042,0.905,0.902]],["Lost Temple",1,1.044,0.836,[1.26,1.26,1.26,1.26,1.26,1.26,1.26,1.26,1.256,1.255,1.256,1.251,1.248,1.191,1.168,1.165,1.03,0.898,0.895]],["Phlegethon",1,1.108,1.158,[0.969,0.969,0.969,0.969,0.969,0.969,0.969,0.969,0.965,0.963,0.962,0.958,0.957,0.893,0.852,0.82,0.704,0.578,0.581]],["Poisoned Well",1,0.677,0.914,[0.751,0.751,0.751,0.751,0.751,0.751,0.751,0.751,0.748,0.746,0.746,0.743,0.741,0.692,0.66,0.636,0.546,0.449,0.451]],["Ruins of Viz-Jun",1,1.062,1.095,[0.983,0.983,0.983,0.983,0.983,0.983,0.983,0.983,0.979,0.977,0.976,0.972,0.97,0.906,0.866,0.834,0.717,0.59,0.591]],["Sanatorium",1,1.006,1.278,[0.794,0.794,0.794,0.794,0.794,0.794,0.794,0.794,0.792,0.791,0.791,0.788,0.787,0.749,0.732,0.728,0.641,0.556,0.555]],["Shadows of Westmarch",1,0.871,0.978,[0.898,0.898,0.898,0.898,0.898,0.898,0.898,0.898,0.896,0.895,0.895,0.891,0.89,0.846,0.827,0.821,0.723,0.626,0.624]],["Tomb of Zoltun Kulle",1,0.854,0.846,[1.021,1.021,1.021,1.021,1.021,1.021,1.021,1.021,1.017,1.016,1.015,1.011,1.009,0.952,0.92,0.904,0.788,0.669,0.67]],["Torajan Jungle",1,1.063,1.293,[0.831,0.831,0.831,0.831,0.831,0.831,0.831,0.831,0.828,0.827,0.827,0.824,0.822,0.775,0.749,0.734,0.639,0.541,0.542]],["Ashen Plains",2,1.037,0.937,[1.106,1.106,1.106,1.106,1.106,1.106,1.106,1.106,1.108,1.106,1.107,1.109,1.107,1.137,1.11,1.117,1.166,1.123,1.052]],["Canyon of Sescheron",2,0.904,0.954,[0.949,0.949,0.949,0.949,0.949,0.949,0.949,0.949,0.951,0.949,0.948,0.95,0.948,0.974,0.942,0.937,0.964,0.917,0.838]],["Descent from Mount Arreat",2,1.064,0.954,[1.114,1.114,1.114,1.114,1.114,1.114,1.114,1.114,1.116,1.114,1.115,1.117,1.115,1.146,1.116,1.121,1.167,1.122,1.047]],["Fortress of Aranoch",2,1.456,1.044,[1.396,1.396,1.396,1.396,1.396,1.396,1.396,1.396,1.399,1.396,1.395,1.397,1.394,1.433,1.38,1.366,1.398,1.323,1.196]],["Halls of Torture",2,1.364,1.149,[1.187,1.187,1.187,1.187,1.187,1.187,1.187,1.187,1.189,1.187,1.187,1.189,1.187,1.22,1.184,1.183,1.227,1.174,1.086]],["Horazon's Memory",2,0.998,1.148,[0.871,0.871,0.871,0.871,0.871,0.871,0.871,0.871,0.872,0.87,0.87,0.871,0.87,0.894,0.863,0.857,0.878,0.833,0.757]],["Pandemonium Citadel",2,1.041,0.819,[1.268,1.268,1.268,1.268,1.268,1.268,1.268,1.268,1.27,1.269,1.271,1.274,1.272,1.307,1.3,1.337,1.431,1.408,1.376]],["Ruined Cistern",2,0.86,0.871,[0.985,0.985,0.985,0.985,0.985,0.985,0.985,0.985,0.987,0.986,0.987,0.989,0.987,1.015,1.001,1.02,1.081,1.054,1.013]],["Sewers of Harrogath",2,0.871,0.804,[1.081,1.081,1.081,1.081,1.081,1.081,1.081,1.081,1.083,1.082,1.082,1.085,1.083,1.113,1.094,1.11,1.17,1.137,1.084]],["Throne of Insanity",2,0.964,0.81,[1.191,1.191,1.191,1.191,1.191,1.191,1.191,1.191,1.193,1.191,1.191,1.193,1.191,1.224,1.187,1.185,1.225,1.17,1.078]],["Arreat Battlefield",3,1.093,1.043,[1.035,1.035,1.035,1.035,1.035,1.035,1.035,1.035,1.037,1.04,1.041,1.043,1.048,1.077,1.144,1.162,1.244,1.437,1.528]],["Bastion Keep",3,0.876,0.91,[0.953,0.953,0.953,0.953,0.953,0.953,0.953,0.953,0.954,0.958,0.958,0.96,0.963,0.99,1.052,1.065,1.135,1.295,1.367]],["Blood Moon",3,0.843,1.093,[0.766,0.766,0.766,0.766,0.766,0.766,0.766,0.766,0.768,0.77,0.769,0.77,0.772,0.793,0.843,0.829,0.852,0.938,0.954]],["Demon Road",3,0.949,1.035,[0.907,0.907,0.907,0.907,0.907,0.907,0.907,0.907,0.908,0.911,0.912,0.914,0.918,0.943,1.002,1.019,1.091,1.259,1.338]],["Kehjistan Marketplace",3,1.117,1.418,[0.779,0.779,0.779,0.779,0.779,0.779,0.779,0.779,0.78,0.783,0.783,0.785,0.788,0.81,0.86,0.872,0.932,1.074,1.14]],["Kyovashad",3,1.044,0.901,[1.144,1.144,1.144,1.144,1.144,1.144,1.144,1.144,1.146,1.15,1.151,1.153,1.158,1.19,1.265,1.286,1.379,1.595,1.698]],["River of Blood",3,1.017,1.027,[0.977,0.977,0.977,0.977,0.977,0.977,0.977,0.977,0.979,0.982,0.983,0.985,0.99,1.017,1.08,1.101,1.182,1.368,1.459]],["Royal Crypts",3,0.905,0.998,[0.896,0.896,0.896,0.896,0.896,0.896,0.896,0.896,0.898,0.901,0.901,0.903,0.907,0.932,0.99,1.006,1.078,1.244,1.322]],["Skovos Stronghold",3,1.051,1.114,[0.932,0.932,0.932,0.932,0.932,0.932,0.932,0.932,0.934,0.937,0.937,0.94,0.944,0.97,1.03,1.047,1.122,1.298,1.381]]],"example":{"name":"Sanatorium","tier":1,"density":47,"xp":15,"full":1.006,"path":1.278,"roll":1.485,"plain":[0.794,0.794,0.794,0.794,0.794,0.794,0.794,0.794,0.792,0.791,0.791,0.788,0.787,0.749,0.732,0.728,0.641,0.556,0.555],"line":[1.182,1.182,1.182,1.182,1.182,1.182,1.182,1.182,1.178,1.176,1.175,1.17,1.168,1.095,1.052,1.025,0.888,0.742,0.746],"own50":[1.131,1.131,1.131,1.131,1.131,1.131,1.131,1.131,1.126,1.124,1.124,1.119,1.117,1.048,1.006,0.981,0.849,0.71,0.714],"area1":[1.198,1.198,1.198,1.198,1.198,1.198,1.198,1.198,1.2,1.198,1.198,1.2,1.198,1.231,1.193,1.19,1.231,1.175,1.082]}};
  /* map-exp-data:end */

  const $ = id => document.getElementById(id);
  const [L0, L1] = DATA.levels;
  const LEVELS = Array.from({ length: L1 - L0 + 1 }, (_, i) => L0 + i);
  // the filter cuts the tag to two decimals (1.649 shows as 1.64x) and rounds the "at Level" line (1.155 shows as 1.16x)
  const cut = (v, d) => (Math.floor(v * 10 ** d + 1e-4) / 10 ** d).toFixed(d);
  const near = v => (Math.floor(v * 100 + 0.5) / 100).toFixed(2);
  const pct = v => Math.round(v * 100) + "%";
  const tierName = t => (t === 4 ? "T4 dungeons" : "T" + t);
  const SERIES = [
    { t: 1, label: "T1 maps", short: "T1", color: "var(--s1)" },
    { t: 2, label: "T2 maps", short: "T2", color: "var(--s2)" },
    { t: 3, label: "T3 maps", short: "T3", color: "var(--s3)" },
  ];
  // the average plain map of each tier at each level: the average of its maps' lines
  const AVG = SERIES.map(s => {
    const ms = DATA.maps.filter(m => m[1] === s.t);
    return LEVELS.map((_, i) => ms.reduce((a, m) => a + m[4][i], 0) / ms.length);
  });
  const state = { level: 89, hover: null };
  const el = { lvl: $("lvl"), lvlOut: $("lvlOut"), plot: $("plot") };

  const cell = (tr, text, cls) => { const td = tr.insertCell(); td.textContent = text; if (cls) td.className = cls; return td; };
  const range = (a, b) => (a === b ? String(a) : `${a}–${b}`);

  // ---------- the tag's colors ----------
  function renderBands() {
    const tb = $("bandTable").tBodies[0];
    DATA.tiers.forEach(([t, , g, r, p]) => {
      const tr = tb.insertRow();
      cell(tr, tierName(t), "name");
      // gold from 0: every map of the tier shows the tag (T4 dungeons)
      cell(tr, g ? `below ${g.toFixed(2)}x` : "never", "under");
      cell(tr, g ? `${g.toFixed(2)}x – ${(r - 0.01).toFixed(2)}x` : `below ${r.toFixed(2)}x`);
      cell(tr, `${r.toFixed(2)}x – ${(p - 0.01).toFixed(2)}x`);
      cell(tr, `${p.toFixed(2)}x and up`);
    });
  }

  // ---------- the "at Level" line's colors ----------
  function renderLineBands() {
    const tb = $("lineBandTable").tBodies[0];
    [["T1–T3 and unique maps", DATA.lineCuts.maps], ["T4 dungeons", DATA.lineCuts.dungeons]].forEach(([name, runs]) => {
      runs.forEach(([lo, hi, r, p]) => {
        const tr = tb.insertRow();
        const th = cell(tr, name, "name");
        if (runs.length > 1) { const s = document.createElement("small"); s.textContent = `level ${range(lo, hi)}`; th.appendChild(s); }
        cell(tr, `below ${r.toFixed(2)}x`);
        cell(tr, `${r.toFixed(2)}x – ${(p - 0.01).toFixed(2)}x`);
        cell(tr, `${p.toFixed(2)}x and up`);
      });
    });
  }

  // ---------- the level penalty ----------
  function renderPenalty() {
    const row = DATA.penalty.rows[state.level - L0], from = DATA.penalty.from;
    const tb = $("penTable").tBodies[0];
    tb.textContent = "";
    DATA.tiers.forEach(([t, ml]) => {
      const tr = tb.insertRow();
      const name = cell(tr, tierName(t), "name");
      const s = document.createElement("small"); s.textContent = `level ${ml}`; name.appendChild(s);
      [0, 2, 3].forEach(k => { const v = row[ml + k - from]; cell(tr, pct(v), v < 0.995 ? "low" : ""); });
    });
  }

  // ---------- the tiers' average maps over the levels ----------
  function niceTicks(lo, hi, n) {
    const span = hi - lo, raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(k => k * p).find(s => span / s <= n) || 10 * p;
    const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, out = [];
    for (let v = a; v <= b + step / 2; v += step) out.push(+v.toFixed(8));
    return out;
  }
  const SVGNS = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs, parent) => { const n = document.createElementNS(SVGNS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };

  function buildLegend() {
    const ul = $("legend");
    SERIES.forEach(s => {
      const li = document.createElement("li");
      const k = document.createElement("span"); k.className = "key"; k.style.background = s.color;
      const t = document.createElement("span"); t.textContent = `Average plain ${s.label}`;
      li.append(k, t); ul.appendChild(li);
    });
  }

  function renderAvgTable() {
    const t = $("avgTable");
    const head = t.createTHead().insertRow();
    ["Your level", ...SERIES.map(s => s.label)].forEach(h => { const th = document.createElement("th"); th.scope = "col"; th.textContent = h; head.appendChild(th); });
    const tb = t.createTBody();
    LEVELS.forEach((c, i) => { const tr = tb.insertRow(); cell(tr, String(c)); AVG.forEach(v => cell(tr, v[i].toFixed(2) + "x")); });
  }

  function drawChart() {
    const plot = el.plot;
    const W = Math.max(280, Math.round(plot.clientWidth || 600));
    const narrow = W < 560;
    const H = narrow ? 240 : 280;
    const m = { l: narrow ? 40 : 48, r: 34, t: 26, b: 40 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const n = LEVELS.length - 1;
    let lo = Math.min(1, ...AVG.flat()), hi = Math.max(1, ...AVG.flat());
    const pad = (hi - lo) * 0.06;
    const ticks = niceTicks(lo - pad, hi + pad, narrow ? 4 : 5);
    const y0 = ticks[0], y1 = ticks[ticks.length - 1];
    const X = i => m.l + i / n * iw;
    const Y = v => m.t + (1 - (v - y0) / (y1 - y0)) * ih;

    const hadFocus = plot.contains(document.activeElement);
    plot.textContent = "";
    const svg = mk("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", tabindex: "0",
      "aria-label": "The average plain T1, T2 and T3 map's at Level line at every character level from 80 to 98; the table under the chart lists every value" }, plot);
    const grid = mk("g", {}, svg);
    ticks.forEach(v => {
      mk("line", { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), stroke: "var(--grid)", "stroke-width": 1, "shape-rendering": "crispEdges" }, grid);
      const t = mk("text", { x: m.l - 8, y: Y(v) + 4, "text-anchor": "end", class: "tick" }, grid); t.textContent = v.toFixed(1) + "x";
    });
    mk("line", { x1: m.l, x2: W - m.r, y1: m.t + ih, y2: m.t + ih, stroke: "var(--axis)", "stroke-width": 1, "shape-rendering": "crispEdges" }, grid);
    const step = narrow ? 3 : 2;
    LEVELS.forEach((c, i) => {
      if ((c - L0) % step) return;
      mk("line", { x1: X(i), x2: X(i), y1: m.t + ih, y2: m.t + ih + 4, stroke: "var(--axis)", "stroke-width": 1, "shape-rendering": "crispEdges" }, grid);
      const t = mk("text", { x: X(i), y: m.t + ih + 17, "text-anchor": "middle", class: "tick" }, grid); t.textContent = String(c);
    });
    const xt = mk("text", { x: m.l + iw / 2, y: H - 4, "text-anchor": "middle", class: "axis-title" }, grid); xt.textContent = "Your character's level";

    // 1.0x: the average plain T1-T3 map
    const y1x = Y(1);
    mk("line", { x1: m.l, x2: W - m.r, y1: y1x, y2: y1x, stroke: "var(--fg2)", "stroke-width": 1, opacity: 0.6, "stroke-dasharray": "4 3", "shape-rendering": "crispEdges" }, svg);
    const hl = mk("text", { x: m.l + 6, y: y1x - 6, "text-anchor": "start", class: "marker-label" }, svg); hl.textContent = "The average plain map";

    // your level
    const mx = X(state.level - L0);
    mk("line", { x1: mx, x2: mx, y1: m.t - 6, y2: m.t + ih, stroke: "var(--accent)", "stroke-width": 1.5 }, svg);
    const ml = mk("text", { x: Math.min(Math.max(mx, m.l + 30), W - m.r - 30), y: m.t - 10, "text-anchor": "middle", class: "marker-label" }, svg);
    ml.textContent = `Level ${state.level}`;

    SERIES.forEach((s, k) => {
      const d = AVG[k].map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join("");
      mk("path", { d, fill: "none", stroke: s.color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
    });
    // direct labels at the right end, kept 13px apart
    const ends = SERIES.map((s, k) => ({ s, y: Y(AVG[k][n]) })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 13);
    ends.forEach(e => { const t = mk("text", { x: W - m.r + 6, y: e.y + 4, class: "end-label" }, svg); t.textContent = e.s.short; });

    // hover layer
    const cross = mk("line", { y1: m.t, y2: m.t + ih, stroke: "var(--fg2)", "stroke-width": 1, opacity: 0, "shape-rendering": "crispEdges" }, svg);
    const dots = SERIES.map(s => mk("circle", { r: 4, fill: s.color, stroke: "var(--panel)", "stroke-width": 2, opacity: 0 }, svg));
    const hit = mk("rect", { x: m.l - 6, y: 0, width: iw + 12, height: m.t + ih + 24, fill: "transparent", style: "cursor: crosshair" }, svg);
    const tip = document.createElement("div"); tip.className = "mx-tip"; tip.hidden = true; plot.appendChild(tip);

    const show = (i, px) => {
      i = Math.max(0, Math.min(n, i));
      state.hover = i;
      cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i)); cross.setAttribute("opacity", 0.55);
      dots.forEach((dot, k) => { dot.setAttribute("cx", X(i)); dot.setAttribute("cy", Y(AVG[k][i])); dot.setAttribute("opacity", 1); });
      tip.textContent = "";
      const head = document.createElement("div"); head.className = "mx-tip-head"; head.textContent = `Level ${LEVELS[i]}`; tip.appendChild(head);
      SERIES.map((s, k) => ({ s, v: AVG[k][i] })).sort((a, b) => b.v - a.v).forEach(({ s, v }) => {
        const row = document.createElement("div"); row.className = "mx-tip-row";
        const key = document.createElement("span"); key.className = "key"; key.style.background = s.color;
        const b = document.createElement("b"); b.textContent = v.toFixed(2) + "x";
        const t = document.createElement("span"); t.textContent = s.label;
        row.append(key, b, t); tip.appendChild(row);
      });
      const foot = document.createElement("div"); foot.className = "mx-tip-foot"; foot.textContent = "Click to pick this level"; tip.appendChild(foot);
      tip.hidden = false;
      const pw = plot.clientWidth, tw = tip.offsetWidth, scale = pw / W;
      const xpx = px !== undefined ? px : X(i) * scale;
      let left = xpx + 14; if (left + tw > pw) left = Math.max(0, xpx - tw - 14);
      tip.style.left = left + "px"; tip.style.top = Math.max(0, (m.t + 4) * scale) + "px";
    };
    const hide = () => { cross.setAttribute("opacity", 0); dots.forEach(d => d.setAttribute("opacity", 0)); tip.hidden = true; state.hover = null; };
    const toI = ev => { const r = svg.getBoundingClientRect(); const x = (ev.clientX - r.left) * W / r.width; return { i: Math.round((x - m.l) / iw * n), px: ev.clientX - r.left }; };
    hit.addEventListener("pointermove", ev => { const p = toI(ev); show(p.i, p.px); });
    hit.addEventListener("pointerdown", ev => { const p = toI(ev); show(p.i, p.px); });
    hit.addEventListener("pointerleave", hide);
    hit.addEventListener("click", ev => { const p = toI(ev); setLevel(L0 + Math.max(0, Math.min(n, p.i))); });
    svg.addEventListener("focus", () => show(state.hover ?? state.level - L0));
    svg.addEventListener("blur", hide);
    svg.addEventListener("keydown", ev => {
      const cur = state.hover ?? state.level - L0;
      if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") { ev.preventDefault(); show(cur + (ev.key === "ArrowRight" ? 1 : -1)); }
      else if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setLevel(L0 + cur); }
      else if (ev.key === "Escape") hide();
    });
    if (hadFocus) svg.focus({ preventScroll: true });
  }

  // ---------- every plain map ----------
  function renderMaps() {
    const i = state.level - L0;
    const tb = $("mapTable").tBodies[0];
    tb.textContent = "";
    DATA.maps.slice().sort((a, b) => b[4][i] - a[4][i]).forEach(([name, tier, full, path, line]) => {
      const tr = tb.insertRow();
      cell(tr, name, "name");
      cell(tr, "T" + tier);
      cell(tr, full.toFixed(2) + "x");
      cell(tr, path.toFixed(2) + "x");
      cell(tr, line[i].toFixed(2) + "x", "main");
    });
  }

  // ---------- the example ----------
  function renderExampleText() {
    const E = DATA.example, i = 89 - L0, band = DATA.tiers.find(r => r[0] === E.tier);
    const shown = Math.round(100 * +cut(E.roll, 2)), at = x => Math.round(100 * x);  // in hundredths, as the filter compares
    const color = shown >= at(band[4]) ? "purple" : shown >= at(band[3]) ? "red" : shown >= at(band[2]) ? "gold" : null;
    $("exRolls").textContent = `+${E.density}% Monster Density and +${E.xp}% Experience`;
    $("exRoll").textContent = E.roll.toFixed(3) + "x";
    $("exRoll2").textContent = E.roll.toFixed(3);
    $("exTag").textContent = color ? `${cut(E.roll, 2)}x Experience` : "no line";
    $("exBand").textContent = color || "below gold";
    $("exFull").textContent = E.full.toFixed(2) + "x";
    $("exPath").textContent = E.path.toFixed(2) + "x";
    $("exPlain").textContent = E.plain[i].toFixed(2) + "x";
    $("exPlain2").textContent = E.plain[i].toFixed(2);
    $("exProd").textContent = E.line[i].toFixed(3);
    $("exLine").textContent = `${near(E.line[i])}x at Level 89`;
    $("shotTag").textContent = `${cut(E.roll, 2)}x Experience`;
    document.querySelectorAll(".mapexp-map .exTagText").forEach(s => { s.textContent = `${cut(E.roll, 2)}x Experience`; });
    $("shotLine").textContent = `${near(E.line[i])}x at Level 89`;
    document.querySelectorAll(".mapexp-map .exLineText").forEach(s => { s.textContent = `${near(E.line[i])}x at Level 89`; });
  }

  function renderExampleTable() {
    const E = DATA.example, tb = $("exTable").tBodies[0];
    const vals = i => [E.line[i], E.own50[i], E.area1[i]].map(v => near(v) + "x");
    tb.textContent = "";
    let start = 0;
    LEVELS.forEach((c, i) => {
      if (i + 1 < LEVELS.length && vals(i + 1).join() === vals(i).join()) return;
      const tr = tb.insertRow();
      if (state.level >= LEVELS[start] && state.level <= c) tr.className = "cur";
      cell(tr, range(LEVELS[start], c));
      vals(i).forEach((v, k) => cell(tr, v, k ? "" : "main"));
      start = i + 1;
    });
  }

  // ---------- your level, and the bar ----------
  const barAvg = SERIES.map(s => {
    const sp = document.createElement("span"), key = document.createElement("span"), b = document.createElement("b");
    key.className = "key"; key.style.background = s.color;
    sp.append(key, s.short + " ", b);
    $("barAvg").appendChild(sp);
    return b;
  });
  // the sections' anchors land under the bar, whatever its height (it wraps on narrow screens)
  const bar = $("mxBar"), root = bar.closest(".mapexp-map") || document.documentElement;
  const barHeight = () => root.style.setProperty("--bar", bar.offsetHeight + "px");
  if ("ResizeObserver" in window) new ResizeObserver(barHeight).observe(bar); else barHeight();

  function setLevel(v) {
    state.level = Math.max(L0, Math.min(L1, v));
    el.lvl.value = state.level;
    el.lvlOut.value = el.lvlOut.textContent = String(state.level);
    document.querySelectorAll(".mapexp-map .lvlA").forEach(s => { s.textContent = String(state.level); });
    barAvg.forEach((b, k) => { b.textContent = AVG[k][state.level - L0].toFixed(2) + "x"; });
    renderPenalty();
    drawChart();
    renderMaps();
    renderExampleTable();
  }
  el.lvl.min = L0; el.lvl.max = L1;
  el.lvl.addEventListener("input", () => setLevel(+el.lvl.value));
  $("avgToggle").addEventListener("click", ev => {
    const open = $("avgWrap").hidden;
    $("avgWrap").hidden = !open;
    ev.currentTarget.setAttribute("aria-expanded", String(open));
    ev.currentTarget.textContent = open ? "Hide the table" : "Show as a table";
  });

  renderBands();
  renderLineBands();
  buildLegend();
  renderAvgTable();
  renderExampleText();
  setLevel(state.level);
  // redraw the chart when the page width changes
  let raf = 0, lastW = 0;
  new ResizeObserver(() => {
    const w = el.plot.clientWidth;
    if (w === lastW) return; lastW = w;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(drawChart);
  }).observe(el.plot);
})();
