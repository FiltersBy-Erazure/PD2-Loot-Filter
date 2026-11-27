
(() => {
  "use strict";

  // Written by tools/gen_map_exp.py (never by hand): levels: the "at Level" line's character levels; tiers: [tier,
  // monster level, gold, red and purple from]; penalty: the share of experience a monster gives at each character
  // level (rows) and monster level (columns, from "from"); lineCuts: the "at Level" line's colors, {maps (T1-T3 and
  // unique), dungeons}: [from character level, to, red from, purple from]; maps: [name, tier, full clear / the
  // average's, clear path / the average's, the "at Level" line of the plain map at each character level]; example: the
  // Sanatorium above.
  /* map-exp-data:start */
  const DATA = {"levels":[80,98],"tiers":[[1,87,1.49,1.71,1.87],[2,88,1.52,1.73,1.89],[3,89,1.61,1.81,2.0],[4,92,0.0,2.78,3.04]],"lineCuts":{"maps":[[80,98,2.0,2.5]],"dungeons":[[80,94,10.5,13.0],[95,95,11.5,14.5],[96,96,12.5,15.5],[97,97,12.5,15.5],[98,98,14.5,18.0]]},"penalty":{"from":87,"rows":[[0.9195,0.9091,0.8989,0.8889,0.8791,0.8696,0.8602,0.8511,0.8421],[0.931,0.9205,0.9101,0.9,0.8901,0.8804,0.871,0.8617,0.8526],[0.9425,0.9318,0.9213,0.9111,0.9011,0.8913,0.8817,0.8723,0.8632],[0.954,0.9432,0.9326,0.9222,0.9121,0.9022,0.8925,0.883,0.8737],[0.9655,0.9545,0.9438,0.9333,0.9231,0.913,0.9032,0.8936,0.8842],[0.977,0.9659,0.9551,0.9444,0.9341,0.9239,0.914,0.9043,0.8947],[0.9885,0.9773,0.9663,0.9556,0.9451,0.9348,0.9247,0.9149,0.9053],[1.0,0.9886,0.9775,0.9667,0.956,0.9457,0.9355,0.9255,0.9158],[1.0,1.0,0.9888,0.9778,0.967,0.9565,0.9462,0.9362,0.9263],[1.0,1.0,1.0,0.9889,0.978,0.9674,0.957,0.9468,0.9368],[1.0,1.0,1.0,1.0,0.989,0.9783,0.9677,0.9574,0.9474],[1.0,1.0,1.0,1.0,1.0,0.9891,0.9785,0.9681,0.9579],[1.0,1.0,1.0,1.0,1.0,1.0,0.9892,0.9787,0.9684],[0.8102,1.0,1.0,1.0,1.0,1.0,1.0,0.9894,0.9789],[0.6204,0.8102,1.0,1.0,1.0,1.0,1.0,1.0,0.9895],[0.4306,0.6204,0.8102,1.0,1.0,1.0,1.0,1.0,1.0],[0.2408,0.4306,0.6204,0.8102,1.0,1.0,1.0,1.0,1.0],[0.051,0.2408,0.4306,0.6204,0.8102,1.0,1.0,1.0,1.0],[0.0508,0.051,0.2408,0.4306,0.6204,0.8102,1.0,1.0,1.0]]},"maps":[["Ancestral Trial",1,0.948,0.881,[1.088,1.088,1.088,1.088,1.088,1.088,1.088,1.088,1.084,1.082,1.082,1.078,1.076,1.009,0.969,0.945,0.819,0.685,0.691]],["Fall of Caldeum",1,0.928,0.71,[1.317,1.317,1.317,1.317,1.317,1.317,1.317,1.317,1.314,1.313,1.313,1.308,1.306,1.246,1.223,1.222,1.082,0.946,0.945]],["Lost Temple",1,0.966,0.872,[1.121,1.121,1.121,1.121,1.121,1.121,1.121,1.121,1.117,1.115,1.115,1.111,1.109,1.046,1.013,0.996,0.87,0.74,0.743]],["Phlegethon",1,1.069,1.173,[0.924,0.924,0.924,0.924,0.924,0.924,0.924,0.924,0.92,0.918,0.917,0.913,0.912,0.847,0.805,0.771,0.659,0.535,0.54]],["Poisoned Well",1,0.681,0.925,[0.745,0.745,0.745,0.745,0.745,0.745,0.745,0.745,0.742,0.74,0.74,0.737,0.736,0.688,0.658,0.637,0.549,0.454,0.456]],["Ruins of Viz-Jun",1,1.109,1.098,[1.023,1.023,1.023,1.023,1.023,1.023,1.023,1.023,1.019,1.017,1.016,1.012,1.01,0.941,0.898,0.864,0.741,0.607,0.611]],["Sanatorium",1,1.056,1.294,[0.823,0.823,0.823,0.823,0.823,0.823,0.823,0.823,0.821,0.82,0.82,0.817,0.816,0.777,0.762,0.76,0.672,0.585,0.585]],["Shadows of Westmarch",1,0.876,0.978,[0.905,0.905,0.905,0.905,0.905,0.905,0.905,0.905,0.902,0.901,0.901,0.898,0.896,0.852,0.832,0.826,0.728,0.63,0.63]],["Tomb of Zoltun Kulle",1,0.816,0.857,[0.964,0.964,0.964,0.964,0.964,0.964,0.964,0.964,0.96,0.959,0.958,0.954,0.953,0.894,0.859,0.838,0.727,0.608,0.613]],["Torajan Jungle",1,1.035,1.309,[0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.797,0.795,0.795,0.792,0.791,0.742,0.714,0.696,0.604,0.506,0.509]],["Ashen Plains",2,1.034,0.949,[1.089,1.089,1.089,1.089,1.089,1.089,1.089,1.089,1.091,1.089,1.089,1.091,1.089,1.12,1.09,1.093,1.135,1.09,1.012]],["Canyon of Sescheron",2,0.91,0.966,[0.942,0.942,0.942,0.942,0.942,0.942,0.942,0.942,0.944,0.942,0.942,0.943,0.942,0.969,0.938,0.935,0.964,0.92,0.842]],["Descent from Mount Arreat",2,1.079,0.956,[1.128,1.128,1.128,1.128,1.128,1.128,1.128,1.128,1.13,1.128,1.129,1.131,1.129,1.161,1.133,1.14,1.188,1.145,1.07]],["Fortress of Aranoch",2,1.47,1.065,[1.382,1.382,1.382,1.382,1.382,1.382,1.382,1.382,1.385,1.382,1.382,1.383,1.381,1.421,1.373,1.366,1.405,1.337,1.218]],["Halls of Torture",2,1.417,1.159,[1.222,1.222,1.222,1.222,1.222,1.222,1.222,1.222,1.224,1.222,1.222,1.224,1.222,1.257,1.227,1.235,1.289,1.243,1.163]],["Horazon's Memory",2,1.008,1.162,[0.868,0.868,0.868,0.868,0.868,0.868,0.868,0.868,0.87,0.868,0.868,0.869,0.867,0.892,0.86,0.852,0.871,0.825,0.745]],["Pandemonium Citadel",2,1.028,0.829,[1.237,1.237,1.237,1.237,1.237,1.237,1.237,1.237,1.239,1.238,1.24,1.243,1.241,1.276,1.267,1.301,1.389,1.366,1.329]],["Ruined Cistern",2,0.878,0.878,[0.998,0.998,0.998,0.998,0.998,0.998,0.998,0.998,1.0,0.999,1.0,1.002,1.0,1.029,1.015,1.034,1.096,1.071,1.027]],["Sewers of Harrogath",2,0.869,0.814,[1.065,1.065,1.065,1.065,1.065,1.065,1.065,1.065,1.067,1.066,1.066,1.069,1.067,1.097,1.078,1.094,1.152,1.12,1.065]],["Throne of Insanity",2,0.976,0.82,[1.191,1.191,1.191,1.191,1.191,1.191,1.191,1.191,1.193,1.191,1.191,1.193,1.191,1.225,1.189,1.189,1.23,1.178,1.085]],["Arreat Battlefield",3,1.097,1.056,[1.026,1.026,1.026,1.026,1.026,1.026,1.026,1.026,1.028,1.032,1.032,1.035,1.039,1.068,1.137,1.155,1.235,1.426,1.515]],["Bastion Keep",3,0.891,0.921,[0.956,0.956,0.956,0.956,0.956,0.956,0.956,0.956,0.958,0.961,0.961,0.963,0.967,0.995,1.058,1.073,1.145,1.31,1.386]],["Blood Moon",3,0.849,1.107,[0.762,0.762,0.762,0.762,0.762,0.762,0.762,0.762,0.764,0.766,0.765,0.766,0.767,0.789,0.84,0.823,0.842,0.92,0.93]],["Demon Road",3,0.958,1.048,[0.904,0.904,0.904,0.904,0.904,0.904,0.904,0.904,0.905,0.909,0.909,0.911,0.915,0.941,1.001,1.018,1.089,1.255,1.333]],["Kehjistan Marketplace",3,1.029,1.081,[0.94,0.94,0.94,0.94,0.94,0.94,0.94,0.94,0.942,0.945,0.946,0.948,0.952,0.979,1.042,1.059,1.132,1.308,1.39]],["Kyovashad",3,1.049,0.913,[1.135,1.135,1.135,1.135,1.135,1.135,1.135,1.135,1.137,1.141,1.142,1.145,1.149,1.182,1.258,1.281,1.373,1.591,1.695]],["River of Blood",3,0.975,1.04,[0.926,0.926,0.926,0.926,0.926,0.926,0.926,0.926,0.928,0.931,0.931,0.933,0.937,0.964,1.026,1.042,1.114,1.285,1.364]],["Royal Crypts",3,0.926,1.011,[0.905,0.905,0.905,0.905,0.905,0.905,0.905,0.905,0.907,0.91,0.91,0.913,0.916,0.943,1.003,1.021,1.095,1.266,1.348]],["Skovos Stronghold",3,1.073,1.128,[0.94,0.94,0.94,0.94,0.94,0.94,0.94,0.94,0.941,0.945,0.945,0.947,0.951,0.979,1.041,1.06,1.136,1.316,1.402]]],"example":{"name":"Sanatorium","tier":1,"density":47,"xp":15,"full":1.056,"path":1.294,"roll":1.494,"plain":[0.823,0.823,0.823,0.823,0.823,0.823,0.823,0.823,0.821,0.82,0.82,0.817,0.816,0.777,0.762,0.76,0.672,0.585,0.585],"line":[1.232,1.232,1.232,1.232,1.232,1.232,1.232,1.232,1.228,1.226,1.226,1.221,1.219,1.146,1.104,1.081,0.94,0.792,0.797],"own10":[1.218,1.218,1.218,1.218,1.218,1.218,1.218,1.218,1.214,1.212,1.211,1.206,1.204,1.132,1.091,1.068,0.929,0.782,0.787],"area1":[1.249,1.249,1.249,1.249,1.249,1.249,1.249,1.249,1.252,1.249,1.25,1.252,1.249,1.285,1.25,1.252,1.3,1.248,1.157]},"dungeons":{"level":92,"rolls":{"u":[106.8,9.7,65.1],"c":[148.0,26.4,67.1,0.1]},"monster":[2.29,2.88],"list":[["Plains of Torment",4.923,1.576,[3.025,3.025,3.025,3.025,3.025,3.025,3.025,3.025,3.025,3.025,3.04,3.055,3.072,3.09,3.108,3.411,3.755,4.234,5.208],[7.925,7.925,7.925,7.925,7.925,7.925,7.925,7.925,7.925,7.925,7.965,8.004,8.048,8.08,8.111,8.887,9.785,11.033,13.081],[9.53,9.53,9.53,9.53,9.53,9.53,9.53,9.53,9.53,9.53,9.578,9.625,9.677,9.721,9.759,10.692,11.775,13.276,15.92]],["Sanctuary of Sin",3.709,1.238,[2.897,2.897,2.897,2.897,2.897,2.897,2.897,2.897,2.897,2.897,2.911,2.926,2.942,2.961,2.979,3.272,3.602,4.061,5.052],[8.277,8.277,8.277,8.277,8.277,8.277,8.277,8.277,8.277,8.277,8.319,8.36,8.405,8.451,8.496,9.321,10.263,11.571,14.118],[9.903,9.903,9.903,9.903,9.903,9.903,9.903,9.903,9.903,9.903,9.953,10.002,10.057,10.115,10.169,11.156,12.288,13.854,17.043]],["Steppes of Daken-Shar",4.911,1.219,[3.889,3.889,3.889,3.889,3.889,3.889,3.889,3.889,3.889,3.889,3.909,3.928,3.949,3.976,4.004,4.398,4.842,5.459,6.845],[10.817,10.817,10.817,10.817,10.817,10.817,10.817,10.817,10.817,10.817,10.871,10.925,10.984,11.047,11.109,12.19,13.422,15.133,18.553],[12.699,12.699,12.699,12.699,12.699,12.699,12.699,12.699,12.699,12.699,12.763,12.826,12.896,12.973,13.043,14.31,15.763,17.772,21.907]]],"clears":{"u":[[1.0,92,441160006,32948736,355140023,65.14]],"c":[[0.1,92,567043792,33831959,364659906,74.14],[0.1,92,567043792,33831959,364659906,76.14],[0.1,92,559697500,40263759,433985462,65.14],[0.1,92,559697500,40263759,433985462,65.14],[0.1,92,435467528,37932428,408857062,65.14],[0.1,92,435467528,37932428,408857062,65.14],[0.1,92,693395023,34305939,369768720,65.14],[0.1,93,515386647,34137819,367956630,65.14],[0.1,92,428511970,44022016,474494071,65.14],[0.1,92,559697500,40263759,433985462,65.14]]},"example":{"name":"Steppes of Daken-Shar","density":106,"rarity":0,"xp":65,"cDensity":161,"cRarity":0,"cXp":74,"cArea":0,"roll":2.662,"cRoll":3.213,"full":4.911,"path":1.219,"plain":[3.889,3.889,3.889,3.889,3.889,3.889,3.889,3.889,3.889,3.889,3.909,3.928,3.949,3.976,4.004,4.398,4.842,5.459,6.845],"line":[10.396,10.396,10.396,10.396,10.396,10.396,10.396,10.396,10.396,10.396,10.448,10.5,10.557,10.615,10.672,11.709,12.892,14.535,17.742],"cLine":[12.572,12.572,12.572,12.572,12.572,12.572,12.572,12.572,12.572,12.572,12.635,12.698,12.767,12.827,12.888,14.131,15.558,17.541,21.125]}}};
  /* map-exp-data:end */
  // Written by tools/mendeln_data.py (never by hand; the Shadow of Mendeln page's numbers): span: the experience each
  // character level takes; ratio: the experience a character of each level gets (/ 1024); pen: the level penalty
  // (/ 256) by how many levels you are above a monster; area: each tier's area level; clears: the tier's average map's
  // full clear, [normal monsters, champions, uniques] (one player, no penalty): p non-magical, r the average rolled rare.
  /* map-exp-levels:start */
  const TO_NEXT = {"span":{"80":61702579,"81":67255812,"82":73308835,"83":79906630,"84":87098226,"85":94937067,"86":103481403,"87":112794729,"88":122946255,"89":134011418,"90":146072446,"91":159218965,"92":173548673,"93":189168053,"94":206193177,"95":224750564,"96":244978115,"97":267026144,"98":291058498},"ratio":{"80":496,"81":448,"82":400,"83":352,"84":304,"85":256,"86":192,"87":144,"88":108,"89":81,"90":61,"91":46,"92":35,"93":26,"94":20,"95":15,"96":11,"97":8,"98":6},"pen":[256,256,256,256,256,256,207,159,110,61,13],"area":{"1":87,"2":88,"3":89},"clears":{"1":{"p":[48038597,5756182,53310690],"r":[95327681,7745266,71867308]},"2":{"p":[53054827,6229634,61195156],"r":[113366608,8357590,82033141]},"3":{"p":[49153792,5857327,56000357],"r":[111330751,8699695,83004963]}},"xp":{"1":11.99,"2":14.15,"3":16.07}};
  /* map-exp-levels:end */

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
  const state = { level: 89, dgKind: "u" };  // dgKind: the dungeons' chart, the average rare dungeon (u) or corrupted (c)
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
      const t = document.createElement("span"); t.textContent = `Average non-magical ${s.label}`;
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

  // a series' key: a short line in its color and dash (an SVG), or the plain bar the maps' chart has always used
  function keyMark(s, w) {
    if (!s.dash) { const k = document.createElement("span"); k.className = "key"; k.style.background = s.color; return k; }
    const k = mk("svg", { class: "key", viewBox: `0 0 ${w} 6`, "aria-hidden": "true" });
    mk("line", { x1: 1, x2: w - 1, y1: 3, y2: 3, stroke: s.color, "stroke-width": 2, "stroke-dasharray": s.dash }, k);
    return k;
  }

  // a chart of lines over the levels (the tiers' average maps, the dungeons): cfg.series() gives [{label, short, color,
  // dash, values}], cfg.ref a dashed line at a value and its label (or none), cfg.right the room for the end labels,
  // cfg.aria its text; hovering or the arrow keys show a level's values, a click or Enter picks that level
  function lineChart(plot, cfg) {
    let hover = null;
    return function draw() {
      const series = cfg.series();
      const W = Math.max(280, Math.round(plot.clientWidth || 600));
      const narrow = W < 560;
      const H = narrow ? 240 : 280;
      const m = { l: narrow ? 40 : 48, r: cfg.right || 34, t: 26, b: 40 };
      const iw = W - m.l - m.r, ih = H - m.t - m.b;
      const n = LEVELS.length - 1;
      const all = series.flatMap(s => s.values).concat(cfg.ref ? [cfg.ref.value] : []);
      const lo = Math.min(...all), hi = Math.max(...all);
      const pad = (hi - lo) * 0.06;
      const ticks = niceTicks(lo - pad, hi + pad, narrow ? 4 : 5);
      const dec = ticks.every(v => Number.isInteger(v)) ? 0 : 1;
      const y0 = ticks[0], y1 = ticks[ticks.length - 1];
      const X = i => m.l + i / n * iw;
      const Y = v => m.t + (1 - (v - y0) / (y1 - y0)) * ih;

      const hadFocus = plot.contains(document.activeElement);
      plot.textContent = "";
      const svg = mk("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", tabindex: "0",
        "aria-label": typeof cfg.aria === "function" ? cfg.aria() : cfg.aria }, plot);
      const grid = mk("g", {}, svg);
      ticks.forEach(v => {
        mk("line", { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), stroke: "var(--grid)", "stroke-width": 1, "shape-rendering": "crispEdges" }, grid);
        const t = mk("text", { x: m.l - 8, y: Y(v) + 4, "text-anchor": "end", class: "tick" }, grid); t.textContent = v.toFixed(dec) + "x";
      });
      mk("line", { x1: m.l, x2: W - m.r, y1: m.t + ih, y2: m.t + ih, stroke: "var(--axis)", "stroke-width": 1, "shape-rendering": "crispEdges" }, grid);
      const step = narrow ? 3 : 2;
      LEVELS.forEach((c, i) => {
        if ((c - L0) % step) return;
        mk("line", { x1: X(i), x2: X(i), y1: m.t + ih, y2: m.t + ih + 4, stroke: "var(--axis)", "stroke-width": 1, "shape-rendering": "crispEdges" }, grid);
        const t = mk("text", { x: X(i), y: m.t + ih + 17, "text-anchor": "middle", class: "tick" }, grid); t.textContent = String(c);
      });
      const xt = mk("text", { x: m.l + iw / 2, y: H - 4, "text-anchor": "middle", class: "axis-title" }, grid); xt.textContent = "Your character's level";

      // a reference value (the maps' 1.0x: the average plain T1-T3 map)
      if (cfg.ref) {
        const yr = Y(cfg.ref.value);
        mk("line", { x1: m.l, x2: W - m.r, y1: yr, y2: yr, stroke: "var(--fg2)", "stroke-width": 1, opacity: 0.6, "stroke-dasharray": "4 3", "shape-rendering": "crispEdges" }, svg);
        const hl = mk("text", { x: m.l + 6, y: yr - 6, "text-anchor": "start", class: "marker-label" }, svg); hl.textContent = cfg.ref.label;
      }

      // your level
      const mx = X(state.level - L0);
      mk("line", { x1: mx, x2: mx, y1: m.t - 6, y2: m.t + ih, stroke: "var(--accent)", "stroke-width": 1.5 }, svg);
      const ml = mk("text", { x: Math.min(Math.max(mx, m.l + 30), W - m.r - 30), y: m.t - 10, "text-anchor": "middle", class: "marker-label" }, svg);
      ml.textContent = `Level ${state.level}`;

      series.forEach(s => {
        const d = s.values.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join("");
        const attrs = { d, fill: "none", stroke: s.color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" };
        if (s.dash) Object.assign(attrs, { "stroke-dasharray": s.dash, "stroke-linecap": "butt" });
        mk("path", attrs, svg);
      });
      // direct labels at the right end, kept 13px apart
      const ends = series.map(s => ({ s, y: Y(s.values[n]) })).sort((a, b) => a.y - b.y);
      for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 13);
      ends.forEach(e => { const t = mk("text", { x: W - m.r + 6, y: e.y + 4, class: "end-label" }, svg); t.textContent = e.s.short; });

      // hover layer
      const cross = mk("line", { y1: m.t, y2: m.t + ih, stroke: "var(--fg2)", "stroke-width": 1, opacity: 0, "shape-rendering": "crispEdges" }, svg);
      const dots = series.map(s => mk("circle", { r: 4, fill: s.color, stroke: "var(--panel)", "stroke-width": 2, opacity: 0 }, svg));
      const hit = mk("rect", { x: m.l - 6, y: 0, width: iw + 12, height: m.t + ih + 24, fill: "transparent", style: "cursor: crosshair" }, svg);
      const tip = document.createElement("div"); tip.className = "mx-tip"; tip.hidden = true; plot.appendChild(tip);

      const show = (i, px) => {
        i = Math.max(0, Math.min(n, i));
        hover = i;
        cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i)); cross.setAttribute("opacity", 0.55);
        dots.forEach((dot, k) => { dot.setAttribute("cx", X(i)); dot.setAttribute("cy", Y(series[k].values[i])); dot.setAttribute("opacity", 1); });
        tip.textContent = "";
        const head = document.createElement("div"); head.className = "mx-tip-head"; head.textContent = `Level ${LEVELS[i]}`; tip.appendChild(head);
        series.map(s => ({ s, v: s.values[i] })).sort((a, b) => b.v - a.v).forEach(({ s, v }) => {
          const row = document.createElement("div"); row.className = "mx-tip-row";
          const b = document.createElement("b"); b.textContent = v.toFixed(2) + "x";
          const t = document.createElement("span"); t.textContent = s.label;
          row.append(keyMark(s, 16), b, t); tip.appendChild(row);
        });
        const foot = document.createElement("div"); foot.className = "mx-tip-foot"; foot.textContent = "Click to pick this level"; tip.appendChild(foot);
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
      hit.addEventListener("click", ev => { const p = toI(ev); setLevel(L0 + Math.max(0, Math.min(n, p.i))); });
      svg.addEventListener("focus", () => show(hover ?? state.level - L0));
      svg.addEventListener("blur", hide);
      svg.addEventListener("keydown", ev => {
        const cur = hover ?? state.level - L0;
        if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") { ev.preventDefault(); show(cur + (ev.key === "ArrowRight" ? 1 : -1)); }
        else if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setLevel(L0 + cur); }
        else if (ev.key === "Escape") hide();
      });
      if (hadFocus) svg.focus({ preventScroll: true });
    };
  }
  const drawChart = lineChart(el.plot, {
    series: () => SERIES.map((s, k) => ({ ...s, values: AVG[k] })),
    ref: { value: 1, label: "The average plain map" },
    aria: "The average plain T1, T2 and T3 map's at Level line at every character level from 80 to 98; the table under the chart lists every value",
  });

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
    const vals = i => [E.line[i], E.own10[i], E.area1[i]].map(v => near(v) + "x");
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

  // ---------- T4 dungeons ----------
  // DATA.dungeons: level (their monsters'), rolls (the average rare dungeon's, u as it comes from the Cube, c corrupted:
  // [density, rarity, Experience(, area level)]), monster (a normal spawn and an elite pack against a T3 map's), list
  // ([name, full clear and clear path against the average plain T3 map, the line before its rolls, average rare,
  // corrupted]), clears (the maps to your next level's numbers) and example
  const DG = DATA.dungeons;
  const DG_SERIES = DG.list.map((d, k) => ({ label: d[0], short: d[0].split(" ")[0], color: `var(--s${k + 1})`,
    dash: ["none", "8 4", "2 3"][k] }));
  const DG_COL = { u: 4, c: 5 };
  const joinList = (xs) => (xs.length < 3 ? xs.join(" and ") : xs.slice(0, -1).join(", ") + ", and " + xs[xs.length - 1]);
  const whole = (v) => Math.round(v);
  // the "at Level" line's color on a dungeon: its number as shown against the cuts of your level
  function dgLineColor(v, lv) {
    const run = DATA.lineCuts.dungeons.find(([lo, hi]) => lv >= lo && lv <= hi), at = (x) => Math.round(100 * x);
    const shown = Math.round(100 * +near(v));
    return shown >= at(run[3]) ? "purple" : shown >= at(run[2]) ? "red" : "gold";
  }
  // the experience a monster gives at your level: the level penalty (/ 256) by how far above it you are, or your
  // level / its level below it
  const penAt = (level, x) => (level >= x ? TO_NEXT.pen[Math.min(level - x, 10)] / 256 : level / x);
  // full clears of the average rare dungeon (u) or corrupted one (c: its outcomes, each with its chance) from your
  // level to the next, counting the dungeon's own Experience (solo, without your own +% experience)
  function dungeonsToNext(level, kind) {
    const one = DG.clears[kind].reduce((a, [w, m, n, kc, ku, x]) =>
      a + w * (n * penAt(level, m) + kc * penAt(level, m + 2) + ku * penAt(level, m + 3)) * (1 + x / 100), 0);
    return TO_NEXT.span[level] / (one * TO_NEXT.ratio[level] / 1024);
  }

  function renderDungeonsOnce() {
    document.querySelectorAll(".mapexp-map .dgLv").forEach((s) => { s.textContent = String(DG.level); });
    document.querySelectorAll(".mapexp-map .dgLv2").forEach((s) => { s.textContent = String(DG.level + 2); });
    document.querySelectorAll(".mapexp-map .dgLv3").forEach((s) => { s.textContent = String(DG.level + 3); });
    const [d, r, x] = DG.rolls.u, [cd, cr, cx, ca] = DG.rolls.c;
    $("dgHowU").textContent = `+${whole(d)}% Monster Density, +${whole(r)}% Monster Rarity, and +${whole(x)}% Experience`;
    $("dgHowC").textContent = `+${whole(cd - d)}% Monster Density, +${whole(cr - r)}% Monster Rarity, and +${whole(cx - x)}% ` +
      `Experience more` + (ca ? `, and +1 Area Level ${Math.round(ca * 10)} time${Math.round(ca * 10) === 1 ? "" : "s"} in 10` : "");
    const ul = $("dgLegend");
    DG_SERIES.forEach((s) => {
      const li = document.createElement("li"), t = document.createElement("span");
      t.textContent = s.label;
      li.append(keyMark(s, 24), t); ul.appendChild(li);
    });
  }

  function renderDungeonTable() {
    const i = state.level - L0, tb = $("dgTable").tBodies[0];
    tb.textContent = "";
    DG.list.slice().sort((a, b) => b[4][i] - a[4][i]).forEach(([name, full, path, , u, c]) => {
      const tr = tb.insertRow();
      cell(tr, name, "name");
      cell(tr, full.toFixed(2) + "x");
      cell(tr, path.toFixed(2) + "x");
      cell(tr, u[i].toFixed(2) + "x", "main");
      cell(tr, c[i].toFixed(2) + "x", "main");
    });
  }

  function renderDungeonWhy() {
    const i = state.level - L0, lv = state.level, t3 = DATA.tiers.find((t) => t[0] === 3)[1];
    const span = (k) => { const v = DG.list.map((d) => d[k][i]); return `${Math.min(...v).toFixed(1)}x to ${Math.max(...v).toFixed(1)}x`; };
    const [d, , x] = DG.rolls.u, [nm, pk] = DG.monster;
    $("dgWhy").textContent = `At level ${lv} the average rare dungeon shows ${span(4)}, against the average plain T3 map. ` +
      `Its monsters are worth more: a group of normal monsters gives about ${nm.toFixed(1)} times the experience of a T3 ` +
      `map's, and a champion or unique pack about ${pk.toFixed(1)} times. Before its rolls, that makes a dungeon ${span(3)}. ` +
      `Then its rolls count, as a rare map's do, with its preset +40–50% Experience on top of what its six random ` +
      `affixes roll: the average rare dungeon has +${whole(d)}% Monster Density and +${whole(x)}% Experience.`;
    const avg = (k, j) => DG.list.reduce((a, row) => a + row[k][j], 0) / DG.list.length;
    $("dgClimb").textContent = `From level 95 the line climbs. A monster more than 5 levels below you gives less ` +
      `experience: a T3 map's normal monsters (level ${t3}) from level ${t3 + 6}, its champions (${t3 + 2}) from ` +
      `${t3 + 8}, and its uniques (${t3 + 3}) from ${t3 + 9}, while a dungeon's normal monsters (${DG.level}) only do from ` +
      `${DG.level + 6}, and its champions and uniques not at all. So the T3 maps a dungeon is compared with fall ` +
      `behind: at level ${L1} the average rare dungeon shows ${(avg(4, L1 - L0) / avg(4, 94 - L0)).toFixed(1)} times ` +
      `its line at 94.`;
  }

  const drawDungeons = lineChart($("dgPlot"), {
    right: 80,
    series: () => DG_SERIES.map((s, k) => ({ ...s, values: DG.list[k][DG_COL[state.dgKind]] })),
    aria: () => `Each T4 dungeon's at Level line, ${state.dgKind === "c" ? "corrupted" : "the average rare dungeon"}, at ` +
      "every character level from 80 to 98; the table under the chart lists every value",
  });
  function renderDungeonLevels() {
    const t = $("dgLvTable");
    t.textContent = "";
    const head = t.createTHead().insertRow();
    ["Your level", ...DG_SERIES.map((s) => s.label)].forEach((h) => { const th = document.createElement("th"); th.scope = "col"; th.textContent = h; head.appendChild(th); });
    const tb = t.createTBody();
    LEVELS.forEach((c, i) => {
      const tr = tb.insertRow();
      cell(tr, String(c));
      DG.list.forEach((d) => cell(tr, d[DG_COL[state.dgKind]][i].toFixed(2) + "x"));
    });
  }
  function setDungeonKind(kind) {
    state.dgKind = kind;
    document.querySelectorAll(".mapexp-map .mx-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === kind)));
    drawDungeons();
    renderDungeonLevels();
  }

  function renderDungeonNext() {
    if (!TO_NEXT) { $("dgNextText").textContent = ""; return; }
    const lv = state.level, u = dungeonsToNext(lv, "u"), c = dungeonsToNext(lv, "c");
    const count = (v) => (v >= 10 ? String(Math.round(v)) : v.toFixed(1));
    const share = (v) => { const s = 100 / v; return (s >= 10 ? Math.round(s) : s.toFixed(1)) + "%"; };
    const maps = toNext(lv, 3, "r") / u;  // full clears of the average rare T3 map one average rare dungeon is worth
    const head = `From level ${lv} to ${lv + 1} takes ${Math.round(TO_NEXT.span[lv]).toLocaleString("en-US")} experience`;
    $("dgNextText").textContent = (u >= 1
      ? `${head}: about ${count(u)} full clears of the average rare dungeon, each ${share(u)} of the level, or ${count(c)} ` +
        `corrupted ones (${share(c)} each).`
      : `${head}, and one full clear of the average rare dungeon gives about ${(1 / u).toFixed(1)} times that ` +
        `(corrupted, ${(1 / c).toFixed(1)} times): more than the whole level.`) +
      ` One average rare dungeon is worth about ${maps.toFixed(1)} full clears of the average rare T3 map. Solo, ` +
      `counting the dungeon's own Experience, and without your own +% experience.`;
  }

  function renderDungeonExample() {
    const E = DG.example, i = state.level - L0, lv = state.level, band = DATA.tiers.find((r) => r[0] === 4);
    const shown = Math.round(100 * +cut(E.roll, 2)), at = (x) => Math.round(100 * x);  // in hundredths, as the filter compares
    const tag = shown >= at(band[4]) ? "purple" : shown >= at(band[3]) ? "red" : "gold";  // every dungeon shows the tag
    const line = dgLineColor(E.line[i], lv), cLine = dgLineColor(E.cLine[i], lv);
    $("dgExRolls").textContent = `+${E.density}% Monster Density and +${E.xp}% Experience (+40–50% of it from the preset affix)` +
      (E.rarity ? `, and +${E.rarity}% Monster Rarity.` : `, and no Monster Rarity.`);
    $("dgExRoll").textContent = E.roll.toFixed(3) + "x";
    $("dgExRoll2").textContent = E.roll.toFixed(3);
    $("dgExTag").textContent = `${cut(E.roll, 2)}x Experience`;
    $("dgExBand").textContent = tag;
    $("dgExFull").textContent = E.full.toFixed(2) + "x";
    $("dgExPath").textContent = E.path.toFixed(2) + "x";
    $("dgExPlain").textContent = E.plain[i].toFixed(2) + "x";
    $("dgExPlain2").textContent = E.plain[i].toFixed(2);
    $("dgExProd").textContent = E.line[i].toFixed(2);
    $("dgExLine").textContent = `${near(E.line[i])}x at Level ${lv}`;
    $("dgExLineBand").textContent = line;
    const adds = [];
    if (E.cDensity !== E.density) adds.push(`+${E.cDensity - E.density}% Monster Density`);
    if (E.cRarity !== E.rarity) adds.push(`+${E.cRarity - E.rarity}% Monster Rarity`);
    if (E.cXp !== E.xp) adds.push(`+${E.cXp - E.xp}% Experience`);
    if (E.cArea) adds.push(`+${E.cArea} Area Level`);
    $("dgExCor").textContent = `a corruption with ${joinList(adds)} among its stats makes its rolls worth ` +
      `${E.cRoll.toFixed(3)}x, and the line ${near(E.cLine[i])}x at Level ${lv}, ${cLine}. A corrupted dungeon ` +
      `shows no Experience tag: its rolls are settled.`;
    $("dgShotTag").textContent = `${cut(E.roll, 2)}x`;
    $("dgShotTag").className = tag;
    $("dgShotLine").textContent = `${near(E.line[i])}x`;
    $("dgShotLine").className = line;
    $("dgShotXp").textContent = `+${E.xp}%`;
    $("dgShotDen").textContent = `+${E.density}%`;
    $("dgShot").setAttribute("aria-label", `A ${E.name} dungeon's two experience lines, ${cut(E.roll, 2)}x Experience ` +
      `(${tag}) and ${near(E.line[i])}x at Level ${lv} (${line}), over its Experience and Monster Density rolls`);
    const tb = $("dgExTable").tBodies[0];
    const vals = (j) => [E.line[j], E.cLine[j]].map((v) => near(v) + "x");
    tb.textContent = "";
    let start = 0;
    LEVELS.forEach((c, j) => {
      if (j + 1 < LEVELS.length && vals(j + 1).join() === vals(j).join()) return;
      const tr = tb.insertRow();
      if (lv >= LEVELS[start] && lv <= c) tr.className = "cur";
      cell(tr, range(LEVELS[start], c));
      vals(j).forEach((v, k) => cell(tr, v, k ? "" : "main"));
      start = j + 1;
    });
  }

  function renderDungeons() {
    renderDungeonWhy();
    renderDungeonTable();
    drawDungeons();
    renderDungeonNext();
    renderDungeonExample();
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

  const STORE = "erazure-map-experience";  // your level, kept in this browser while it differs from 89 (audit RES-10)
  /* your character, shared with the site's other tools: the .ez-char box (javascripts/erazure.js; the website ideas' #11):
     the level, which this page's slider holds from 80 to 98 */
  window.ezCharPage = {fields: ["lvl"], read: () => ({lvl: state.level}),
    fit: (c) => Object.assign(c, c.lvl !== undefined ? {lvl: Math.max(L0, Math.min(L1, Math.round(+c.lvl) || L0))} : {}),
    use: (c) => { if (c.lvl !== undefined) setLevel(Math.max(L0, Math.min(L1, Math.round(+c.lvl) || L0))); }};
  function setLevel(v) {
    state.level = Math.max(L0, Math.min(L1, v));
    try { if (state.level === 89) localStorage.removeItem(STORE); else localStorage.setItem(STORE, String(state.level)); } catch (e) { /* storage blocked */ }
    el.lvl.value = state.level;
    el.lvlOut.value = el.lvlOut.textContent = String(state.level);
    document.querySelectorAll(".mapexp-map .lvlA").forEach(s => { s.textContent = String(state.level); });
    barAvg.forEach((b, k) => { b.textContent = AVG[k][state.level - L0].toFixed(2) + "x"; });
    const li = state.level - L0, top = DATA.maps.reduce((m, r) => (!m || r[4][li] > m[4][li] ? r : m), null);
    $("mxBest").replaceChildren("Best non-magical map at level " + state.level + ": ", Object.assign(document.createElement("b"), {textContent: top[0]}),
      ` (T${top[1]}) ${top[4][li].toFixed(2)}x`);
    renderNext();
    renderPenalty();
    drawChart();
    renderMaps();
    renderExampleTable();
    renderDungeons();
  }
  // full clears of each tier's average map that take you to your next level (solo, without your own +% experience: the
  // website ideas' #39); a rolled rare map counts its own Experience roll (TO_NEXT.xp, since 2026-11-22)
  function toNext(level, tier, kind) {
    const c = TO_NEXT.clears[tier][kind], m = TO_NEXT.area[tier];
    const xp = kind === "r" && TO_NEXT.xp ? 1 + TO_NEXT.xp[tier] / 100 : 1;
    const one = (c[0] * penAt(level, m) + c[1] * penAt(level, m + 2) + c[2] * penAt(level, m + 3)) * xp * TO_NEXT.ratio[level] / 1024;
    return TO_NEXT.span[level] / one;
  }
  function renderNext() {
    if (!TO_NEXT) { $("mxNext").hidden = true; $("mxNextText").textContent = ""; return; }
    const lv = state.level, fmt = (v) => Math.round(v).toLocaleString("en-US");
    const per = (kind) => [1, 2, 3].map((t) => fmt(toNext(lv, t, kind))).join(" / ");
    document.querySelectorAll(".mapexp-map .lvlNext").forEach((x) => { x.textContent = String(lv + 1); });
    $("mxNext").replaceChildren("To level " + (lv + 1) + ": ", Object.assign(document.createElement("b"), {textContent: per("p")}),
      " full clears of the average non-magical T1 / T2 / T3 map, " + per("r") + " of a corrupted rare one");
    $("mxNextText").textContent = "From level " + lv + " to " + (lv + 1) + " takes " + fmt(TO_NEXT.span[lv]) + " experience: " +
      "about " + per("p") + " full clears of the average non-magical T1 / T2 / T3 map, or " + per("r") + " of the average " +
      "rolled rare one with one corruption (its own Experience roll counted), solo and without your own +% experience. " +
      "A party and your own +% experience (an Annihilus) make each clear " +
      "worth more (a Fortified map's own clear stays about the same: half the monsters, each worth twice); the Shadow of " +
      "Mendeln page works out what that map event adds.";
    // the Shadow of Mendeln page that text names is a link to it (the additions audit, MG-09)
    const mn = $("mxNextText"), mw = "Shadow of Mendeln", mi = mn.textContent.indexOf(mw);
    if (mi >= 0) {
      const a = document.createElement("a"), tx = mn.textContent;
      a.href = "../shadow-of-mendeln/"; a.textContent = mw;
      mn.replaceChildren(tx.slice(0, mi), a, tx.slice(mi + mw.length));
    }
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
  renderDungeonsOnce();
  renderDungeonLevels();
  document.querySelectorAll(".mapexp-map .mx-switch button").forEach((b) => b.addEventListener("click", () => setDungeonKind(b.dataset.kind)));
  $("dgToggle").addEventListener("click", ev => {
    const open = $("dgWrap").hidden;
    $("dgWrap").hidden = !open;
    ev.currentTarget.setAttribute("aria-expanded", String(open));
    ev.currentTarget.textContent = open ? "Hide the table" : "Show as a table";
  });
  let keptLevel = null;
  try { keptLevel = +localStorage.getItem(STORE) || null; } catch (e) { /* storage blocked */ }
  setLevel(keptLevel || state.level);
  // redraw the charts when the page width changes
  [[el.plot, drawChart], [$("dgPlot"), drawDungeons]].forEach(([plot, draw]) => {
    let raf = 0, lastW = 0;
    new ResizeObserver(() => {
      const w = plot.clientWidth;
      if (w === lastW) return; lastW = w;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
    }).observe(plot);
  });
})();
