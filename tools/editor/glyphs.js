/* The Filter Editor's game text: labels, chat lines and hover boxes drawn the way PD2's HD text (D2GL,
   github.com/bayaraa/d2gl, modules/hd_text) draws them, from D2GL's own MTSDF atlases (tools/editor_assets.py cuts them
   out of d2gl.mpq): each glyph's shadow (the atlas's alpha distance, 0.356 of black, or light grey behind dark text),
   then the glyph (the median of its three distances against the font's weight, sharpened by the font's size), on the
   label's 60% black box that fades out at both ends; lines centred, the string's first line at the bottom, a color
   carrying on to the line above (tools/example_shots.py draws the website's Examples the same way).

   Drawn per pixel into a canvas at the zoom asked for times the screen's pixel ratio. Until the atlases are loaded
   (or where the browser won't let a page read them: a page opened as a file), EZ.render's HTML labels stand in. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.glyphs = (function () {
  "use strict";
  let info = null, baseUrl = "", failed = false;
  const sheets = {}, loading = {}, waiters = [];
  const smoothstep = (e0, e1, x) => { const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1); return t * t * (3 - 2 * t); };

  function init(assets, base) {
    info = assets && assets.fonts && assets.atlases ? assets : null;
    baseUrl = base || "";
  }

  function available() { return !!info && !failed; }

  /* Load the atlases a font needs; resolves true when they're there, false where they can't be read. */
  function load(names) {
    if (!info || failed) return Promise.resolve(false);
    return Promise.all(names.map((name) => {
      if (sheets[name]) return Promise.resolve(true);
      if (!loading[name]) {
        const a = info.atlases[name];
        loading[name] = new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            try {
              const c = document.createElement("canvas");
              c.width = a.w; c.height = a.h;
              const g = c.getContext("2d", {willReadFrequently: true});
              g.drawImage(img, 0, 0);
              sheets[name] = {w: a.w, h: a.h, px: g.getImageData(0, 0, a.w, a.h).data, glyphs: a.glyphs};
              resolve(true);
            } catch (e) {
              failed = true;  // a page opened as a file: the browser won't let it read the pixels
              resolve(false);
            }
          };
          img.onerror = () => { failed = true; resolve(false); };
          img.src = baseUrl + a.file + (a.v ? "?v=" + a.v : "");
        });
      }
      return loading[name];
    })).then((oks) => oks.every(Boolean));
  }

  function ready(use) {
    if (!available()) return false;
    const f = info.fonts[use];
    return !!(f && sheets[f.atlas] && sheets.NotoSymbol);
  }

  /* Ask for a font; fn runs once it's there (the preview redraws). */
  function want(use, fn) {
    if (!available()) return;
    const f = info.fonts[use];
    if (!f) return;
    load([f.atlas, "NotoSymbol"]).then((ok) => { if (ok && fn) fn(); });
  }

  /* (sheet, glyph [adv, pl, pb, pr, pt, left, top, right, bottom], symbol?) as D2GL's GlyphSet::getGlyph finds it. */
  function glyph(font, ch) {
    const cp = ch === " " ? 32 : ch.codePointAt(0);
    const main = sheets[font.atlas];
    let g = main.glyphs[cp];
    if (g) return [main, g, false];
    const sym = sheets.NotoSymbol;
    g = sym.glyphs[cp] || sym.glyphs[0x2639];
    return [sym, g, true];
  }

  /* D2GL's colors: code character -> [r, g, b] (EZ.render's table), alpha codes @ABC. */
  function rgbOf(code) {
    const c = EZ.render.CODES[code];
    return c ? [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16),
                parseInt(c.slice(6, 8), 16) / 255] : null;
  }
  const ALPHA = {"@": 1, "A": 0x99 / 255, "B": 0x66 / 255, "C": 0x33 / 255};

  /* The text's lines top first, each [{rgb, alpha, text}]; colors carry on in the string's order. */
  function lines(text, start) {
    let color = rgbOf(start || "0") || [254, 254, 254, 1], alpha = 1;
    const parts = text.split("\n").map((part) => {
      const segs = [];
      let buf = "";
      const flush = () => { if (buf) segs.push({rgb: color, alpha, text: buf}); buf = ""; };
      for (let i = 0; i < part.length; i++) {
        if (part[i] === "ÿ" && part[i + 1] === "c" && i + 2 < part.length) {
          const k = part[i + 2];
          if (k in ALPHA) { flush(); alpha = ALPHA[k]; i += 2; continue; }
          const c = rgbOf(k);
          if (c) { flush(); color = c; i += 2; continue; }
        }
        buf += part[i];
      }
      flush();
      return segs;
    });
    return parts.reverse();
  }

  function lineWidth(font, segs) {
    let n = 0, w = 0;
    for (const s of segs) for (const ch of s.text) { w += glyph(font, ch)[1][0]; n++; }
    return n ? w * font.size + font.spacing * font.size * (n - 1) : 0;
  }

  /* A premultiplied RGBA float buffer with the blends D2GL draws (source alpha over). */
  function Buffer(w, h) {
    this.w = w; this.h = h; this.px = new Float32Array(w * h * 4);
  }
  Buffer.prototype.blend = function (x, y, r, g, b, a) {
    if (a <= 0 || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const p = (y * this.w + x) * 4, px = this.px, k = 1 - a;
    px[p] = r * a + px[p] * k;
    px[p + 1] = g * a + px[p + 1] * k;
    px[p + 2] = b * a + px[p + 2] * k;
    px[p + 3] = a + px[p + 3] * k;
  };
  Buffer.prototype.toCanvas = function (cssW, cssH) {
    const c = document.createElement("canvas");
    c.width = this.w; c.height = this.h;
    c.style.width = cssW + "px";
    const g = c.getContext("2d");
    const img = g.createImageData(this.w, this.h), d = img.data, px = this.px;
    for (let i = 0; i < px.length; i += 4) {
      const a = px[i + 3];
      if (a <= 0) continue;
      d[i] = px[i] / a; d[i + 1] = px[i + 1] / a; d[i + 2] = px[i + 2] / a; d[i + 3] = a * 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  };

  /* Bilinear RGBA (0..1) at sheet point (u, v) from the top left. */
  function sample(s, u, v, out) {
    u -= 0.5; v -= 0.5;
    const x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0;
    out[0] = out[1] = out[2] = out[3] = 0;
    const px = s.px, w = s.w;
    for (let j = 0; j < 2; j++) {
      const yy = Math.min(Math.max(y0 + j, 0), s.h - 1), wy = j ? fy : 1 - fy;
      for (let i = 0; i < 2; i++) {
        const xx = Math.min(Math.max(x0 + i, 0), w - 1), f = wy * (i ? fx : 1 - fx);
        const p = (yy * w + xx) * 4;
        out[0] += px[p] * f; out[1] += px[p + 1] * f; out[2] += px[p + 2] * f; out[3] += px[p + 3] * f;
      }
    }
    out[0] /= 255; out[1] /= 255; out[2] /= 255; out[3] /= 255;
  }

  /* One glyph at pen (x, baseline y) in buffer pixels, size: the font's size in buffer pixels. shadow: its strength
     (the font's, or a share of it), 0 for none. */
  const tap = [0, 0, 0, 0];
  function drawGlyph(buf, font, ch, x, y, size, seg, shadow) {
    const [s, g, symbol] = glyph(font, ch);
    const [, pl, , , pt, left, top, right, bottom] = g;
    if (right <= left) return;
    const scale = size / 32;
    const qx = x + pl * size, qy = y - pt * size + (symbol ? size * font.symbolOff : 0);
    const qw = (right - left) * scale, qh = (bottom - top) * scale;
    const weight = symbol ? 1 + (font.weight - 1) * 0.5 : font.weight;
    const [r, gg, b, ca] = seg.rgb;
    const alpha = seg.alpha * ca;
    const shade = r + gg + b < 0.1 * 255 * 3 ? 0.8 * 255 : 0;
    const smooth = Math.max(font.size, 1);
    const y0 = Math.round(qy), y1 = Math.round(qy + qh), x0 = Math.round(qx), x1 = Math.round(qx + qw);
    for (let py = y0; py < y1; py++) {
      const v = top + (py + 0.5 - qy) / scale;
      for (let px = x0; px < x1; px++) {
        sample(s, left + (px + 0.5 - qx) / scale, v, tap);
        if (shadow) {
          const sa = tap[3] < 0.26 ? 0 : smoothstep(0, 1, tap[3]) * shadow;
          buf.blend(px, py, shade, shade, shade, sa * alpha);
        }
        const msd = Math.max(Math.min(tap[0], tap[1]), Math.min(Math.max(tap[0], tap[1]), tap[2]));
        const op = Math.min(Math.max(smooth * (msd - (1 - 0.5 * weight)) + 0.5, 0), 1);
        buf.blend(px, py, r, gg, b, op * alpha);
      }
    }
  }

  function drawLine(buf, font, segs, x, y, size, k, shadow) {
    for (const seg of segs) {
      for (const ch of seg.text) {
        const g = glyph(font, ch)[1];
        if (ch !== " ") drawGlyph(buf, font, ch, x, y, size, seg, shadow);
        x += (g[0] * font.size + font.spacing * font.size) * k;
      }
    }
  }

  /* A dropped item's label (D2GL's drawRectangledText): a canvas, or null until the font is there.
     opts: {start: the game's color code, zoom: CSS pixels per game pixel, state: "ground" | "alt" (hovered with Alt:
     blue) | "hover" (hovered without Alt: solid black, no fade, no shadow)}. */
  const cache = new Map();
  function cached(key, make) {
    let c = cache.get(key);
    if (!c) {
      c = make();
      cache.set(key, c);
      if (cache.size > 400) cache.delete(cache.keys().next().value);
    }
    const copy = document.createElement("canvas");
    copy.width = c.width; copy.height = c.height;
    copy.style.width = c.style.width;
    copy.className = c.className;
    for (const a of ["role", "aria-label"]) copy.setAttribute(a, c.getAttribute(a));
    copy.getContext("2d").drawImage(c, 0, 0);
    return copy;
  }

  function label(text, opts) {
    opts = opts || {};
    if (!ready("label")) return null;
    return cached(["l", text, opts.start, opts.zoom, opts.state, window.devicePixelRatio].join("|"), () => drawLabel(text, opts));
  }

  function drawLabel(text, opts) {
    const font = info.fonts.label;
    const ls = lines(text, opts.start);
    const widths = ls.map((segs) => lineWidth(font, segs));
    const tw = Math.max(0, ...widths);
    const th = (ls.length - 1) * font.size * font.lineHeight + font.size;
    const padX = 3.4, padY = Math.max(1.4, (18 - font.size) / 2);
    const ext = Math.max(Math.min(tw * 0.1, 15), 10);
    const w = tw + 2 * (padX + ext), h = th + 2 * padY;
    const zoom = opts.zoom || 1.5;
    const k = zoom * (window.devicePixelRatio || 1);
    const buf = new Buffer(Math.ceil(w * k), Math.ceil(h * k));
    const state = opts.state || "ground";
    const fade = state === "hover" ? 0 : ext / (tw + 10);
    const [br, bg, bb, ba] = state === "alt" ? [33, 63, 152, 0.867] : state === "hover" ? [0, 0, 0, 0.8] : [0, 0, 0, 0.6];
    for (let py = 0; py < buf.h; py++) {
      for (let px = 0; px < buf.w; px++) {
        const u = (px + 0.5) / buf.w;
        const f = !fade ? 1 : u < 0.5 ? smoothstep(0, fade, u) : smoothstep(1, 1 - fade, u);
        buf.blend(px, py, br, bg, bb, ba * f);
      }
    }
    const shadow = state === "hover" ? 0 : font.shadow;
    const base = font.size + padY + font.size * font.offY;
    ls.forEach((segs, n) => {
      const x = (w - widths[n]) / 2;
      drawLine(buf, font, segs, x * k, (base + n * font.size * font.lineHeight) * k, font.size * k, k, shadow);
    });
    const c = buf.toCanvas(w * zoom, h * zoom);
    c.className = "fe-glabel";
    c.setAttribute("role", "img");
    c.setAttribute("aria-label", EZ.render.plain(text));
    return c;
  }

  /* A chat line (D2GL's chat: font 13, left aligned, each line on its own 60% black box, half the shadow). */
  function chat(text, opts) {
    opts = opts || {};
    if (!ready("chat")) return null;
    return cached(["c", text, opts.start, opts.zoom, window.devicePixelRatio].join("|"), () => drawChat(text, opts));
  }

  function drawChat(text, opts) {
    const font = info.fonts.chat;
    const segs = lines(text.replace(/\n/g, " "), opts.start)[0] || [];
    const tw = lineWidth(font, segs);
    const padX = 3, padY = 2;
    const w = tw + 2 * padX, h = font.size * 1.25 + 2 * padY;
    const zoom = opts.zoom || 1.5;
    const k = zoom * (window.devicePixelRatio || 1);
    const buf = new Buffer(Math.ceil(w * k), Math.ceil(h * k));
    for (let py = 0; py < buf.h; py++) for (let px = 0; px < buf.w; px++) buf.blend(px, py, 0, 0, 0, 0.6);
    drawLine(buf, font, segs, padX * k, (padY + font.size + font.size * font.offY) * k, font.size * k, k,
             font.shadow * 0.5);
    const c = buf.toCanvas(w * zoom, h * zoom);
    c.className = "fe-gchat";
    c.setAttribute("role", "img");
    c.setAttribute("aria-label", EZ.render.plain(text));
    return c;
  }

  /* The hover box (D2GL: font 14, no shadow, padding 10 x 5, the lines centred, a 0.8 fill tinted at the top by the
     item's quality, a fine inner edge). text: one string, bottom line first. */
  function hover(text, opts) {
    opts = opts || {};
    if (!ready("hover")) return null;
    return cached(["h", text, opts.start, opts.zoom, opts.tint, window.devicePixelRatio].join("|"), () => drawHover(text, opts));
  }

  function drawHover(text, opts) {
    const font = info.fonts.hover;
    const ls = lines(text, opts.start || "3");
    const widths = ls.map((segs) => lineWidth(font, segs));
    const padX = 10, padY = 5, pitch = font.size * font.lineHeight;
    const w = Math.max(...widths, 40) + 2 * padX, h = (ls.length - 1) * pitch + font.size + 2 * padY + 2;
    const zoom = opts.zoom || 1.3;
    const k = zoom * (window.devicePixelRatio || 1);
    const buf = new Buffer(Math.ceil(w * k), Math.ceil(h * k));
    const tint = opts.tint ? [parseInt(opts.tint.slice(0, 2), 16), parseInt(opts.tint.slice(2, 4), 16),
                              parseInt(opts.tint.slice(4, 6), 16)] : [34, 34, 34];
    for (let py = 0; py < buf.h; py++) {
      const f = Math.max(0, 1 - py / (buf.h * 0.6));
      for (let px = 0; px < buf.w; px++) {
        buf.blend(px, py, 0, 0, 0, 0.8);
        buf.blend(px, py, tint[0], tint[1], tint[2], 0.8 * f);
        const edge = px < k || py < k || px >= buf.w - k || py >= buf.h - k;
        if (edge) buf.blend(px, py, 90, 84, 74, 0.6);
      }
    }
    const base = padY + font.size + font.size * font.offY;
    ls.forEach((segs, n) => {
      const x = (w - widths[n]) / 2;
      drawLine(buf, font, segs, x * k, (base + n * pitch) * k, font.size * k, k, 0);
    });
    const c = buf.toCanvas(w * zoom, h * zoom);
    c.className = "fe-ghover";
    c.setAttribute("role", "img");
    c.setAttribute("aria-label", EZ.render.plain(text));
    return c;
  }

  return {init, available, load, ready, want, label, chat, hover, lines, info: () => info};
})();
