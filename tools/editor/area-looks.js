/* Looks: the symbols and colors around item names (Erazure's look aliases, one card per look, its labels drawn), style
   presets, a global color swap, and the minimap icons Erazure uses. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
EZ.looks = (function () {
  "use strict";
  const {h} = EZ.ui;
  const F = EZ.filter, R = EZ.render;

  /* {name: value} of a version's aliases. */
  function values(lines) {
    const out = {}, a = F.aliases(lines);
    for (const k of Object.keys(a)) out[k] = a[k].value;
    return out;
  }

  /* An output template drawn: every %ALIAS% filled (a few rounds: looks may hold other looks), %NAME% the sample. */
  function fill(tpl, vals, sample) {
    let text = tpl;
    for (let n = 0; n < 4 && /%[A-Z0-9_]+%/.test(text); n++) {
      text = text.replace(/%([A-Z0-9_]+)%/g, (m, k) => k === "NAME" || !(k in vals) ? m : vals[k]);
    }
    return R.codes(text.replace(/%NAME%/g, sample).replace(/%PERCENT%/g, "%")).replace(/%NL%/g, "\n")
      .replace(/%(?:CL|CS)%/g, " ");
  }

  function sampleFor(key, data) {
    const nc = (data.looks && data.looks.nameColor || []).find(([p]) => key.startsWith(p));
    const name = (data.looks && data.looks.sample && data.looks.sample[key]) || "Item";
    return (nc ? "%" + nc[1] + "%" : "%WHITE%") + name;
  }

  /* The looks of the style versions (Minimal's alias lines, Corrlorized's alias values from its own lines). */
  function styleValues(app, style) {
    if (style === "minimal") {
      const out = {}, lines = app.src.styles["minimal.filter"].lines;
      for (const k of Object.keys(lines)) {
        const m = F.ALIAS_RE.exec(lines[k]);
        if (m) out[k] = EZ.core.bhTrim(m[2]);
      }
      return out;
    }
    if (style === "corrlorized") {
      const v = app.src.variants.find((x) => x.style === "corrlorized.edits");
      return v ? values(app.versionLines(v)) : {};
    }
    return values(app.src.lines);
  }

  /* An icon drawn as BH draws it, scaled: the layers' boxes (8/6/4/2 game pixels) in rule order, 00 last. */
  function icon(combo, palette, scale) {
    scale = scale || 3;
    const size = 8 * scale + 4;
    const c = h("canvas", {width: size, height: size, class: "fe-icon", role: "img",
      "aria-label": combo ? "minimap icon " + combo : "no minimap icon"});
    const g = c.getContext("2d");
    g.fillStyle = "#0b0b0b";
    g.fillRect(0, 0, size, size);
    const dims = {BORDER: 8, MAP: 6, DOT: 4, PX: 2};
    const layers = combo ? combo.split(" ").map((k) => k.split("-")) : [];
    const draw = (l, col) => {
      const d = dims[l.toUpperCase()] * scale, o = (size - d) / 2;
      g.fillStyle = palette[parseInt(col, 16) & 255] || "#000";
      g.fillRect(o, o, d, d);
    };
    for (const [l, col] of layers) if (parseInt(col, 16) !== 0) draw(l, col);
    for (const [l, col] of layers) if (parseInt(col, 16) === 0) draw(l, col);
    return c;
  }

  /* A palette picker under an anchor: onpick("0A") or onpick(null) for none. */
  function palettePicker(anchor, palette, current, onpick, allowNone) {
    const grid = h("div.fe-palette", {role: "listbox", "aria-label": "Minimap colors"});
    const close = () => { wrap.remove(); document.removeEventListener("mousedown", away, true); };
    const away = (ev) => { if (!wrap.contains(ev.target)) close(); };
    for (let i = 0; i < 256; i++) {
      const hex = i.toString(16).toUpperCase().padStart(2, "0");
      grid.appendChild(h("button.fe-swatch" + (hex === current ? ".on" : ""), {type: "button", title: hex,
        "aria-label": "color " + hex, style: {background: palette[i]}, onclick: () => { close(); onpick(hex); }}));
    }
    const wrap = h("div.fe-menu.fe-palette-menu",
      allowNone ? h("button.fe-btn.small", {type: "button", onclick: () => { close(); onpick(null); }}, "None") : null,
      grid);
    const root = anchor.closest(".edit-map") || document.body;
    root.appendChild(wrap);
    const r = anchor.getBoundingClientRect(), rr = root.getBoundingClientRect();
    wrap.style.left = Math.max(4, Math.min(r.left - rr.left, rr.width - wrap.offsetWidth - 4)) + "px";
    wrap.style.top = (r.bottom - rr.top + 4) + "px";
    setTimeout(() => document.addEventListener("mousedown", away, true));
  }

  return {values, fill, sampleFor, styleValues, icon, palettePicker};
})();

EZ.areas.push({
  id: "looks", title: "Looks", icon: "✎", order: 40, group: "b",
  count: (e) => EZ.edits.countArea("looks", e),
  render(box, app) {
    const {h, seg} = EZ.ui;
    const F = EZ.filter, R = EZ.render, L = EZ.looks;
    const e = EZ.store.current().edits;
    const lines = app.versionLines();
    const base = L.values(lines);
    const vals = Object.assign({}, base, e.looks || {});
    const palette = app.data.palette || [];
    const styles = {erazure: L.styleValues(app, "erazure"), minimal: L.styleValues(app, "minimal"),
                    corrlorized: L.styleValues(app, "corrlorized")};
    const cards = F.lookCards(app.src, lines);
    const names = cards.flatMap((c) => c.aliases.map((a) => a.name));

    /* ---- presets */
    const preset = (style) => EZ.store.change((ed) => {
      ed.looks = {};
      if (style === "erazure" && e.base.style === "erazure") return;
      for (const n of names) {
        const v = styles[style][n];
        if (v !== undefined && v !== base[n]) ed.looks[n] = v;
      }
    }, {label: "looks preset"});
    const presets = h("section.fe-card",
      h("h3", "Start from a style"),
      h("p.fe-sub", "Put every look below to a style's own, then change what you like. Your version (Start) stays as " +
        "it is: its sounds and what it shows are unchanged."),
      h("div.fe-row", ["erazure", "minimal", "corrlorized"].map((s) => h("button.fe-btn", {type: "button",
        onclick: () => preset(s)}, app.STYLE_NAMES[s] + "'s looks"))),
      Object.keys(e.looks || {}).length ? h("p.fe-sub", {style: {marginTop: ".5rem"}},
        `${Object.keys(e.looks).length} looks are your own.`, " ",
        h("button.fe-btn.ghost.small", {type: "button", onclick: () => EZ.store.change((ed) => { ed.looks = {}; })},
          "Use your version's looks again")) : null);

    /* ---- color remap */
    const remap = e.remap || {};
    const colorRow = (c) => {
      const code = R.WORDS[c];
      const sel = h("select", {"aria-label": `${c} becomes`, onchange: (ev) => EZ.store.change((ed) => {
        ed.remap = ed.remap || {};
        if (ev.target.value === c) delete ed.remap[c]; else ed.remap[c] = ev.target.value;
      }, {label: "color " + c})},
        EZ.edits.COLORS.map((x) => h("option", {value: x, selected: (remap[c] || c) === x}, x === c ? "itself" : nice(x))));
      return h("div.fe-remap" + (remap[c] ? ".is-changed" : ""),
        h("span.fe-swatch-text", {style: {color: R.rgb(code) || "inherit"}}, "■ " + nice(c)), h("span.fe-sub", "→"), sel,
        remap[c] ? h("span.fe-swatch-text", {style: {color: R.rgb(R.WORDS[remap[c]])}}, "■") : null);
    };
    const recolor = h("section.fe-card", {id: "fe-recolor"},
      h("h3", "Swap a color everywhere"),
      h("p.fe-sub", "Every label and description line Erazure draws in one color, in another. Handy when two colors " +
        "look alike to you (red and green, yellow and gold). Item names the game colors itself keep their colors."),
      h("div.fe-remaps", EZ.edits.COLORS.filter((c) => c !== "BLACK").map(colorRow)));

    /* ---- look cards */
    let editing = null;
    const insertAt = (text) => {
      if (!editing || !editing.isConnected) return;
      const s = editing.selectionStart || editing.value.length, t = editing.selectionEnd || s;
      editing.value = editing.value.slice(0, s) + text + editing.value.slice(t);
      editing.focus();
      editing.setSelectionRange(s + text.length, s + text.length);
      editing.dispatchEvent(new Event("input"));
    };
    const tools = h("div.fe-looktools",
      h("span.fe-sub", "Insert into the look you're editing: "),
      EZ.edits.COLORS.map((c) => h("button.fe-chipbtn", {type: "button", title: "%" + c + "%",
        style: {color: R.rgb(R.WORDS[c]) || "inherit"}, onmousedown: (ev) => ev.preventDefault(),
        onclick: () => insertAt("%" + c + "%")}, "■")),
      ["•", "·", "*", "x", "X", "o", "O", "\\", "/", ">", "<", "|", "-", "=", "~", "+", "#", "$", "(", ")", "[", "]"]
        .map((s) => h("button.fe-chipbtn", {type: "button", onmousedown: (ev) => ev.preventDefault(),
          onclick: () => insertAt(s)}, s)));
    const groupBoxes = F.GROUPS.map((g) => {
      const mine = cards.filter((c) => c.group === g.id);
      if (!mine.length) return null;
      return h("section.fe-card", {id: "fe-looks-" + g.id}, h("h3", g.title), h("p.fe-sub", g.note),
        h("div.fe-lookgrid", mine.map((c) => {
          const sample = L.sampleFor(c.key, app.data);
          const preview = h("div.fe-lookprev");
          const draw = (v) => {
            EZ.ui.fill(preview, c.tpls.map((t) => R.label(L.fill(t.tpl, v, sample))));
          };
          draw(vals);
          const rows = c.aliases.map((a) => {
            const own = e.looks && a.name in e.looks;
            const input = h("input", {type: "text", value: vals[a.name] || "", spellcheck: "false",
              "aria-label": a.name, class: "fe-mono" + (own ? " is-changed" : "")});
            input.addEventListener("focus", () => { editing = input; });
            input.addEventListener("input", () => draw(Object.assign({}, vals, {[a.name]: input.value})));
            input.addEventListener("change", () => EZ.store.change((ed) => {
              ed.looks = ed.looks || {};
              if (input.value === base[a.name]) delete ed.looks[a.name]; else ed.looks[a.name] = input.value;
            }, {label: a.name}));
            const from = (style, label) => {
              const v = styles[style][a.name];
              return v !== undefined && v !== vals[a.name] ? h("button.fe-btn.ghost.small", {type: "button",
                onclick: () => EZ.store.change((ed) => {
                  ed.looks = ed.looks || {};
                  if (v === base[a.name]) delete ed.looks[a.name]; else ed.looks[a.name] = v;
                })}, label) : null;
            };
            return h("div.fe-aliasrow", h("code.fe-aliasname", a.name.replace(/_/g, "_​")), input,
              h("div.fe-row.fe-small", from("erazure", "Erazure's"), from("minimal", "Minimal's"),
                from("corrlorized", "Corrlorized's"),
                own ? h("button.fe-btn.ghost.small", {type: "button", onclick: () => EZ.store.change((ed) => {
                  delete ed.looks[a.name];
                })}, "↺ Your version's") : null));
          });
          return h("div.fe-lookcard" + (c.aliases.some((a) => e.looks && a.name in e.looks) ? ".is-changed" : ""),
            h("div.fe-looktitle", c.title), preview, rows);
        })));
    });

    /* ---- minimap icons */
    const notes = F.notifications(lines);
    const swaps = e.icons || {};
    const combos = Object.keys(notes.icons).sort((a, b) => notes.icons[b].length - notes.icons[a].length);
    const iconRow = (combo) => {
      const to = combo in swaps ? swaps[combo] : combo;
      const layers = {};
      for (const k of to.split(" ").filter(Boolean)) { const [l, c] = k.split("-"); layers[l.toUpperCase()] = c; }
      const set = (layer, col) => EZ.store.change((ed) => {
        const now = Object.assign({}, layers);
        if (col === null) delete now[layer]; else now[layer] = col;
        const next = ["BORDER", "MAP", "DOT", "PX"].filter((l) => now[l]).map((l) => l + "-" + now[l]).join(" ");
        ed.icons = ed.icons || {};
        if (next === combo) delete ed.icons[combo]; else ed.icons[combo] = next;
      }, {label: "minimap icon"});
      const where = notes.icons[combo].slice(0, 3).map((i) => {
        const r = F.rule(lines[i]);
        const note = r.comment.replace(/^\/\/\s*/, "").trim();
        return note || r.cond.slice(0, 60);
      }).filter(Boolean);
      return h("div.fe-iconrow" + (combo in swaps ? ".is-changed" : ""),
        L.icon(combo, palette, 3), h("span.fe-sub", "→"), L.icon(to, palette, 3),
        h("div.fe-iconinfo",
          h("div", h("b", `${notes.icons[combo].length} rule${notes.icons[combo].length === 1 ? "" : "s"}`),
            where.length ? h("span.fe-sub", " · " + where.join(" · ")) : null),
          h("div.fe-row.fe-small", ["BORDER", "MAP", "DOT", "PX"].map((l) => {
            const b = h("button.fe-layer", {type: "button", title: `${l}: ${layers[l] || "none"}`},
              h("span.fe-layerbox", {style: {background: layers[l] ? palette[parseInt(layers[l], 16)] : "transparent"}}),
              l === "BORDER" ? "Border" : l === "MAP" ? "Map" : l === "DOT" ? "Dot" : "Pixel");
            b.addEventListener("click", () => L.palettePicker(b, palette, layers[l], (col) => set(l, col), true));
            return b;
          }),
          h("button.fe-btn.ghost.small", {type: "button", onclick: () => EZ.store.change((ed) => {
            ed.icons = ed.icons || {};
            ed.icons[combo] = "";
          })}, "No icon"),
          combo in swaps ? h("button.fe-btn.ghost.small", {type: "button", onclick: () => EZ.store.change((ed) => {
            delete ed.icons[combo];
          })}, "↺ Erazure's") : null)));
    };
    const iconsCard = h("section.fe-card", {id: "fe-icons"},
      h("h3", "Minimap icons"),
      h("p.fe-sub", "Every icon Erazure draws on the minimap, most used first. An icon is up to four nested boxes " +
        "(border, map, dot, pixel). Change one here and it changes everywhere Erazure uses it."),
      h("div.fe-iconlist", combos.map(iconRow)));

    EZ.ui.add(box, [
      h("div.fe-area-head", h("div", h("h2", "Looks"),
        h("p.fe-sub", "The symbols and colors around item names, and the minimap icons."))),
      presets, recolor, tools, groupBoxes, iconsCard]);
    if (app.sub) {
      const el = box.querySelector("#fe-" + app.sub);
      if (el) el.scrollIntoView();
    }

    function nice(c) { return c.charAt(0) + c.slice(1).toLowerCase().replace(/_/g, " "); }
  },
});
