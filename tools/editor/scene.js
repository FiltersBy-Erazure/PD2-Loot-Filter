/* The Filter Editor's drop scene: items on a floor of the game's own tiles with the labels the filter gives them, as
   the website's Examples are drawn (tools/example_shots.py): the area's floor tiles in the game's diamond grid, each
   picked by its rarity (the same tiles every time: a seeded pick), a dungeon's light falling off round the middle,
   each item's picture on the ground under its label, the labels in tidy columns (the game's own stacking isn't
   known, so this is a stand-in for a pile). Pictures and floors: Erazure-Filter-Editor-Assets (tools/editor_assets.py). */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.scene = (function () {
  "use strict";
  let info = null, baseUrl = "";
  const images = {};
  const ROW = 46, GAP = 44, MARGIN = [40, 34];  // game pixels (tools/example_shots.py)
  const smoothstep = (e0, e1, x) => { const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1); return t * t * (3 - 2 * t); };

  function init(assets, base) {
    info = assets && assets.floors && assets.ground ? assets : null;
    baseUrl = base || "";
  }
  function available() { return !!info; }

  function image(file) {
    if (!images[file]) {
      images[file] = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = baseUrl + file;
      });
    }
    return images[file];
  }

  /* Both pictures a scene needs: resolves {floor, ground} (null where one didn't load). */
  function load(floorName) {
    if (!info) return Promise.resolve(null);
    const f = info.floors[floorName] || Object.values(info.floors)[0];
    return Promise.all([image(f.file), image(info.ground.file)]).then(([floor, ground]) => ({floor, ground, def: f}));
  }

  function rng(seed) {  // mulberry32
    let a = 0;
    for (let i = 0; i < seed.length; i++) a = (a * 31 + seed.charCodeAt(i)) | 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* The ground picture of an item code: [x, y, w, h] on the sheet, or null. */
  function sprite(code) {
    const f = info && info.ground.items[code];
    return f ? info.ground.sprites[f] : null;
  }

  /* Lay the items out in columns: [{cx, top, box: [w, h], item}] and the scene's size, in game pixels. items: [{label
     (a canvas, its size in CSS pixels), zoom, code, hidden, invisible}]. */
  function layout(items, perColumn) {
    const cols = [];
    for (let i = 0; i < items.length; i += perColumn) cols.push(items.slice(i, i + perColumn));
    const boxOf = (it) => it.label ? [parseFloat(it.label.style.width) / it.zoom,
                                      it.label.height / it.label.width * parseFloat(it.label.style.width) / it.zoom] : [90, 18];
    const widths = cols.map((col) => Math.max(...col.map((it) => boxOf(it)[0])));
    const w = Math.ceil(widths.reduce((a, b) => a + b, 0) + GAP * Math.max(cols.length - 1, 0) + 2 * MARGIN[0]);
    const h = Math.ceil(Math.max(...cols.map((c) => c.length)) * ROW + 2 * MARGIN[1]);
    const placed = [];
    let x = MARGIN[0];
    cols.forEach((col, ci) => {
      const cx = x + widths[ci] / 2;
      col.forEach((it, n) => placed.push({cx, top: MARGIN[1] + n * ROW, box: boxOf(it), item: it}));
      x += widths[ci] + GAP;
    });
    return {w, h, placed};
  }

  /* Draw a scene into a new canvas. pics: load()'s; items as layout()'s; zoom: CSS pixels per game pixel. */
  function draw(pics, items, opts) {
    opts = opts || {};
    const zoom = opts.zoom || 1, k = zoom * (window.devicePixelRatio || 1);
    let per = opts.perColumn || 6;
    if (opts.fit) {  // as many columns as fit the width given (game pixels)
      const widest = Math.max(90, ...items.map((it) => it.label ? parseFloat(it.label.style.width) / it.zoom : 90));
      const cols = Math.max(1, Math.floor((opts.fit - 2 * MARGIN[0] + GAP) / (widest + GAP)));
      per = Math.ceil(items.length / cols);
    }
    const {w, h, placed} = layout(items, per);
    const c = document.createElement("canvas");
    c.width = Math.round(w * k); c.height = Math.round(h * k);
    c.style.width = w * zoom + "px";
    c.className = "fe-scene-canvas";
    const g = c.getContext("2d");
    g.fillStyle = "#0b0a09";
    g.fillRect(0, 0, c.width, c.height);
    g.imageSmoothingEnabled = true;
    // the floor: the area's tiles in the diamond grid; cell (0, 0) in the middle
    if (pics && pics.floor) {
      const rarity = pics.def.rarity, n = rarity.length;
      const weights = rarity.some((x) => x > 0) ? rarity : rarity.map(() => 1);
      const total = weights.reduce((a, b) => a + b, 0);
      const pick = rng(opts.seed || "scene");
      const ox = w / 2 - 80, oy = h / 2 - 40, span = Math.ceil((w + h) / 40) + 4;
      for (let cy = -span; cy < span; cy++) {
        for (let cx = -span; cx < span; cx++) {
          const x0 = ox + (cx - cy) * 80, y0 = oy + (cx + cy) * 40;
          let r = pick() * total, t = 0;
          while (t < n - 1 && r >= weights[t]) { r -= weights[t]; t++; }
          if (x0 + 160 <= 0 || x0 >= w || y0 + 80 <= 0 || y0 >= h) continue;
          g.drawImage(pics.floor, t * 160, 0, 160, 80, x0 * k, y0 * k, 160 * k, 80 * k);
        }
      }
    }
    // the items' pictures under their labels
    const where = [];
    for (const p of placed) {
      const it = p.item;
      if (it.invisible) continue;
      const s = sprite(it.code);
      if (!s || !pics || !pics.ground) continue;
      const top = p.top + p.box[1] + 3;
      g.drawImage(pics.ground, s[0], s[1], s[2], s[3], Math.round(p.cx - s[2] / 2) * k, Math.round(top) * k, s[2] * k, s[3] * k);
    }
    // a dungeon's light, round on the floor
    if (pics && pics.def && pics.def.light) {
      const radius = pics.def.light, img = g.getImageData(0, 0, c.width, c.height), d = img.data;
      for (let y = 0; y < c.height; y++) {
        const dy = (y / k - h / 2) * 2;
        for (let x = 0; x < c.width; x++) {
          const dx = x / k - w / 2, dist = Math.sqrt(dx * dx + dy * dy) / radius;
          if (dist < 0.55) continue;
          const f = Math.max(0, 1 - smoothstep(0.55, 1.15, dist)) * 0.85 + 0.15, p = (y * c.width + x) * 4;
          d[p] *= f; d[p + 1] *= f; d[p + 2] *= f;
        }
      }
      g.putImageData(img, 0, 0);
    }
    // the labels
    for (const p of placed) {
      const it = p.item;
      const x = (p.cx - p.box[0] / 2) * k, y = p.top * k;
      if (it.label && !it.invisible) g.drawImage(it.label, x, y, p.box[0] * k, p.box[1] * k);
      else if (opts.showHidden) {
        g.save();
        g.strokeStyle = "rgba(200,190,170,.35)";
        g.setLineDash([4 * k / 2, 3 * k / 2]);
        g.strokeRect(x, y, p.box[0] * k, p.box[1] * k);
        g.restore();
      }
      where.push({x: x / k, y: p.top, w: p.box[0], h: p.box[1] + 30, item: it});
    }
    return {canvas: c, where, w, h};
  }

  return {init, available, load, draw, sprite};
})();
