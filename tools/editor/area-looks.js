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

  /* The name a card's labels are drawn with: the style page's samples, then the editor's own (every card a name of
     its own, never "Item"). */
  const MORE_SAMPLES = {SKELETON_KEY: "Skeleton Key", ALMANAC: "Horadric Almanac", NAVIGATOR: "Horadric Navigator",
    VIAL: "Vial of Lightsong", MIRROR: "Lilith's Mirror", DKEY: "Key of Destruction", HKEY: "Key of Hate",
    TKEY: "Key of Terror", TOKEN_OF_ABSOLUTION: "Token of Absolution", PANDEMONIUM_TALISMAN: "Pandemonium Talisman",
    UBER_ORGAN: "Baal's Eye", RELIC: "Relic of the Ancients", SIGIL_MADAWC: "Sigil of Madawc",
    SIGIL_TALIC: "Sigil of Talic", SIGIL_KORLIC: "Sigil of Korlic", VISION_OF_TERROR: "Vision of Terror",
    TERROR_PART: "Black Soulstone", VOIDSTONE: "Voidstone", VOID_PART: "Hellfire Ashes", JAWBONE: "Trang-Oul's Jawbone",
    TAINTED_SHARD: "Tainted Worldstone Shard", SHADOW_OF_HATRED: "Shadow of Hatred", DEMONIC_INSIGNIA: "Demonic Insignia",
    HATRED_PART: "Flesh of Malic", MAGIC_CHARM: "Grand Charm", MAGIC_JEWEL_NAME: "Jewel", RARE_LOW_VALUE: "Gauntlets",
    UNI_NORMAL: "Sacred Armor"};
  function sampleFor(key, data) {
    const nc = (data.looks && data.looks.nameColor || []).find(([p]) => key.startsWith(p));
    const name = (data.looks && data.looks.sample && data.looks.sample[key]) || MORE_SAMPLES[key] ||
      (/^INFUSION_/.test(key) ? "Craft Infusion" : "Item");
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

  /* The four nested boxes of a minimap icon, outer to inner, in words (the game's own names in the tooltip). */
  const LAYER_WORDS = {BORDER: ["Outer", "the outer 8-pixel box (BORDER)"], MAP: ["Big", "the 6-pixel box (MAP)"],
                       DOT: ["Small", "the 4-pixel box (DOT)"], PX: ["Center", "the 2-pixel center (PX)"]};
  /* A button for one box of an icon: its color and its name; a click opens the palette. */
  function layerButton(l, color, palette, onpick) {
    const w = LAYER_WORDS[l] || [l, l];
    const b = h("button.fe-layer", {type: "button", title: "The color of " + w[1] + " (or none)",
      "aria-label": w[0] + " box: " + (color ? "color " + color : "none"), "aria-haspopup": "dialog"},
      h("span.fe-layerbox", {style: {background: color ? palette[parseInt(color, 16)] : "transparent"}}), w[0]);
    b.addEventListener("click", () => palettePicker(b, palette, color, onpick, true));
    return b;
  }

  /* A palette picker under an anchor: onpick("0A") or onpick(null) for none. It takes the focus (its color, or
     None), the arrows move through the colors, Escape closes it and gives the focus back. */
  function palettePicker(anchor, palette, current, onpick, allowNone) {
    const grid = h("div.fe-palette", {role: "listbox", "aria-label": "Minimap colors"});
    const close = (stay) => {
      if (!wrap.isConnected) return;
      wrap.remove();
      document.removeEventListener("mousedown", away, true);
      document.removeEventListener("keydown", key, true);
      if (!stay && anchor.isConnected) anchor.focus();
    };
    const away = (ev) => { if (!wrap.contains(ev.target)) close(); };
    const key = (ev) => {
      if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); close(); return; }
      const sw = [...grid.children], i = sw.indexOf(document.activeElement);
      if (i < 0) return;
      const step = {ArrowRight: 1, ArrowLeft: -1, ArrowDown: 16, ArrowUp: -16}[ev.key];
      if (step) {
        ev.preventDefault();
        const n = sw[Math.max(0, Math.min(sw.length - 1, i + step))];
        if (n) n.focus();
      }
    };
    let on = null;
    for (let i = 0; i < 256; i++) {
      const hex = i.toString(16).toUpperCase().padStart(2, "0");
      const b = h("button.fe-swatch" + (hex === current ? ".on" : ""), {type: "button", title: hex, role: "option",
        "aria-selected": String(hex === current), "aria-label": "color " + hex, style: {background: palette[i]},
        onclick: () => { close(); onpick(hex); }});
      if (hex === current) on = b;
      grid.appendChild(b);
    }
    const none = allowNone ? h("button.fe-btn.small", {type: "button", onclick: () => { close(); onpick(null); }}, "None")
      : null;
    const wrap = h("div.fe-menu.fe-palette-menu", {role: "dialog", "aria-label": "Pick a minimap color"},
      none, h("span.fe-sub.fe-small", {style: {marginLeft: ".5em"}}, "Arrows move, Enter picks, Escape closes"), grid);
    // in the editor's root, right after the anchor's card in Tab order would be best; the root keeps it on screen
    const root = anchor.closest(".edit-map") || document.body;
    root.appendChild(wrap);
    const r = anchor.getBoundingClientRect(), rr = root.getBoundingClientRect();
    wrap.style.left = Math.max(4, Math.min(r.left - rr.left, rr.width - wrap.offsetWidth - 4)) + "px";
    wrap.style.top = (r.bottom - rr.top + 4) + "px";
    setTimeout(() => document.addEventListener("mousedown", away, true));
    document.addEventListener("keydown", key, true);
    // Tab out of it closes it (the focus goes on where it went)
    wrap.addEventListener("focusout", (ev) => { if (ev.relatedTarget && !wrap.contains(ev.relatedTarget)) close(true); });
    (on || none || grid.firstChild).focus();
  }

  return {values, fill, sampleFor, styleValues, icon, palettePicker, layerButton, LAYER_WORDS};
})();

EZ.areas.push({
  id: "looks", title: "Looks", icon: "✎", order: 40, group: "b",
  count: (e) => EZ.edits.countArea("looks", e),
  render(box, app) {
    const {h} = EZ.ui;
    const F = EZ.filter, R = EZ.render, L = EZ.looks;
    const e = EZ.store.current().edits;
    const lines = app.versionLines();
    const base = L.values(lines);
    const vals = Object.assign({}, base, e.looks || {});
    const shown = (v) => {  // the looks as the game reads them (two slashes in a row get a color between them)
      const out = Object.assign({}, v);
      for (const k of Object.keys(out)) if (typeof out[k] === "string" && out[k] !== base[k]) out[k] = EZ.edits.slashes(out[k]);
      return out;
    };
    const palette = app.data.palette || [];
    const styles = {erazure: L.styleValues(app, "erazure"), minimal: L.styleValues(app, "minimal"),
                    corrlorized: L.styleValues(app, "corrlorized")};
    // the cards no rule uses change nothing in game: left out (040 keeps some on purpose)
    const cards = F.lookCards(app.src, lines).filter((c) => c.used !== false);
    // a style's looks, the Horadric Cube's version names aside (they name the version the file is)
    const names = cards.filter((c) => c.group !== "cube").flatMap((c) => c.aliases.map((a) => a.name));
    const own = Object.keys(e.looks || {}).length;
    const nice = (c) => c.charAt(0) + c.slice(1).toLowerCase().replace(/_/g, " ");
    const yourVersion = app.STYLE_NAMES[e.base.style] || "Erazure";

    /* ---- the color swap, as the game draws it: a label's color codes swapped (the cards draw with it) */
    const remap = e.remap || {};
    const codeSwap = {};
    for (const k of Object.keys(remap)) if (R.WORDS[k] && R.WORDS[remap[k]]) codeSwap[R.WORDS[k]] = R.WORDS[remap[k]];
    const swapped = (text) => Object.keys(codeSwap).length ? text.replace(/ÿc(.)/g, (m, ch) =>
      codeSwap[ch] !== undefined ? "ÿc" + codeSwap[ch] : m) : text;

    /* ---- presets (they replace the player's own looks: a toast with Undo says so) */
    const preset = (style) => {
      const changed = EZ.store.change((ed) => {
        const keep = {};  // the Cube's names stay the player's
        for (const k of Object.keys(ed.looks || {})) if (names.indexOf(k) < 0) keep[k] = ed.looks[k];
        ed.looks = keep;
        if (!(style === "erazure" && e.base.style === "erazure")) {
          for (const n of names) {
            const v = styles[style][n];
            if (v !== undefined && v !== base[n]) ed.looks[n] = v;
          }
        }
        if (!Object.keys(ed.looks).length) delete ed.looks;
      }, {label: "looks preset"});
      if (changed) {
        EZ.ui.undoToast(`${app.STYLE_NAMES[style]}'s looks are in` + (own ? ` (your ${own} own look${own === 1 ? "" :
          "s"} went).` : "."));
      }
    };
    const presets = h("section.fe-card", {id: "fe-looks-styles"},
      h("h3", "Start from a style"),
      h("p.fe-sub", "Put the looks below to a style's own, then change what you like" + (own ? ": this replaces your " +
        own + " own look" + (own === 1 ? "" : "s") + " (Undo brings them back)" : "") + ". Your version (Start) stays " +
        "as it is: its sounds and what it shows are unchanged, and the Horadric Cube keeps your version's name."),
      h("div.fe-row", ["erazure", "minimal", "corrlorized"].map((s) => h("button.fe-btn", {type: "button",
        onclick: () => preset(s)}, app.STYLE_NAMES[s] + "'s looks"))),
      h("p.fe-sub.fe-small", "Corr's own colors, symbols and sounds come with the Corrlorized version on Start; " +
        "Corrlorized's looks here are the few he sets by name (magic charms, the Vial and the Mirror)."),
      own ? h("p.fe-sub", {style: {marginTop: ".5rem"}},
        `${own} look${own === 1 ? " is" : "s are"} your own.`, " ",
        h("button.fe-btn.small", {type: "button", title: "Your version (" + yourVersion + ") draws them again",
          onclick: () => {
            EZ.store.change((ed) => { delete ed.looks; }, {label: "looks"});
            EZ.ui.undoToast("Erazure's default looks are back.");
          }}, "Back to Erazure's default looks")) : null);

    /* ---- color remap */
    const swatch = (c) => h("span.fe-swatchbox", {"aria-hidden": "true", style: {background: R.rgb(R.WORDS[c]) || "#000"}});
    const colorRow = (c) => {
      const sel = h("select", {"aria-label": `${nice(c)} becomes`, onchange: (ev) => EZ.store.change((ed) => {
        ed.remap = ed.remap || {};
        if (ev.target.value === c) delete ed.remap[c]; else ed.remap[c] = ev.target.value;
      }, {label: "color " + c})},
        // black text on the label's dark box can't be read: never a color to swap to
        EZ.edits.COLORS.filter((x) => x !== "BLACK").map((x) => h("option", {value: x, selected: (remap[c] || c) === x},
          x === c ? "No change" : nice(x))));
      return h("div.fe-remap" + (remap[c] ? ".is-changed" : ""),
        h("span.fe-swatch-name", swatch(c), " " + nice(c)), h("span.fe-sub", {"aria-hidden": "true"}, "→"), sel,
        remap[c] ? swatch(remap[c]) : null);
    };
    const recolor = h("section.fe-card", {id: "fe-recolor"},
      h("h3", "Swap a color everywhere"),
      h("p.fe-sub", "Every label and description line Erazure draws in one color, in another. Handy when two colors " +
        "look alike to you (red and green, yellow and gold). Item names follow where Erazure writes their color: " +
        "unique names follow Gold, set names Green. The colors the game gives a name itself stay (a rune's orange, " +
        "where no rule colors it). The cards below draw with your swaps."),
      h("div.fe-remaps", EZ.edits.COLORS.filter((c) => c !== "BLACK").map(colorRow)));

    /* ---- look cards */
    let editing = null;
    const tools = h("div.fe-looktools.is-idle");
    const insertAt = (text) => {
      if (!editing || !editing.isConnected) {
        EZ.ui.toast("Click into a look field first, then pick a color or symbol here.");
        return;
      }
      const s = editing.selectionStart || editing.value.length, t = editing.selectionEnd || s;
      editing.value = editing.value.slice(0, s) + text + editing.value.slice(t);
      editing.focus();
      editing.setSelectionRange(s + text.length, s + text.length);
      editing.dispatchEvent(new Event("input"));
    };
    const hint = h("span.fe-sub.fe-looktools-hint", "Click into a look field, then pick a color or symbol to put in it:");
    const chips = h("div.fe-looktools-chips",
      EZ.edits.COLORS.map((c) => h("button.fe-chipbtn", {type: "button", title: nice(c) + " (%" + c + "%)",
        "aria-label": "Insert " + nice(c).toLowerCase(), onmousedown: (ev) => ev.preventDefault(),
        onclick: () => insertAt("%" + c + "%")}, h("span.fe-chipsw", {style: {background: R.rgb(R.WORDS[c]) || "#000"}}))),
      ["•", "·", "*", "x", "X", "o", "O", "\\", "/", ">", "<", "|", "-", "=", "~", "+", "#", "$", "(", ")", "[", "]"]
        .map((s) => h("button.fe-chipbtn", {type: "button", "aria-label": "Insert " + s,
          onmousedown: (ev) => ev.preventDefault(), onclick: () => insertAt(s)}, s)));
    // on a phone the chips fold away (they take several rows), until opened
    if (app.isPhone && app.isPhone()) {
      tools.appendChild(h("details.fe-looktools-fold", h("summary", "Colors and symbols to insert"), hint, chips));
    } else {
      tools.append(hint, chips);
    }
    const howTo = h("p.fe-note.fe-small", "A look is text around the item's name: its left part, the name, its right " +
      "part. A color word (", h("code", "%RED%"), ", the colored squares below) colors everything after it. Two " +
      "slashes in a row would end the line in game, so the editor puts the color between them.");
    const caption = (n) => /_LEFT$/.test(n) ? "Left of the name" : /_RIGHT$/.test(n) ? "Right of the name" :
      /VERSION_NAME$/.test(n) ? "The version's name in the Cube" : /_NAME$/.test(n) ? "The name" : "The look";
    const query = h("input", {type: "search", placeholder: "Find a look: rune, key, charm, set…", "aria-label": "Find a look",
      style: {flex: "1 1 16em", maxWidth: "24em"}});
    const cardEls = [];
    const groupBoxes = F.GROUPS.map((g) => {
      const mine = cards.filter((c) => c.group === g.id);
      if (!mine.length) return null;
      return h("section.fe-card.fe-lookgroup", {id: "fe-looks-" + g.id}, h("h3", g.title), h("p.fe-sub", g.note),
        h("div.fe-lookgrid", mine.map((c) => {
          const sample = L.sampleFor(c.key, app.data);
          const preview = h("div.fe-lookprev");
          const draw = (v) => {
            EZ.ui.fill(preview, c.tpls.map((t) => R.label(swapped(L.fill(t.tpl, v, sample)))));
          };
          draw(shown(vals));
          const rows = c.aliases.map((a) => {
            const mineToo = e.looks && a.name in e.looks;
            const note = h("p.fe-sub.fe-small.fe-looknote", {hidden: true});
            const input = h("textarea", {rows: 1, spellcheck: "false", "aria-label": c.title + ": " + caption(a.name),
              title: a.name, class: "fe-mono fe-lookfield" + (mineToo ? " is-changed" : "")});
            input.value = vals[a.name] || "";
            const check = () => {
              const v = input.value;
              note.hidden = !/\/\//.test(v) || EZ.edits.slashes(v) !== v.replace(/\/{2,}/g, "/");
              note.textContent = "Two slashes in a row end the line in game, and no color comes before them here: one " +
                "slash stays (put a color before them to keep them).";
            };
            input.addEventListener("focus", () => { editing = input; tools.classList.remove("is-idle"); });
            input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); input.blur(); } });
            input.addEventListener("input", () => {
              if (/[\r\n]/.test(input.value)) input.value = input.value.replace(/[\r\n]+/g, "");
              check();
              draw(shown(Object.assign({}, vals, {[a.name]: input.value})));
            });
            input.addEventListener("change", () => EZ.store.change((ed) => {
              ed.looks = ed.looks || {};
              if (input.value === base[a.name]) delete ed.looks[a.name]; else ed.looks[a.name] = input.value;
              if (!Object.keys(ed.looks).length) delete ed.looks;
            }, {label: a.name}));
            check();
            const from = (style, label) => {
              const v = styles[style][a.name];
              return v !== undefined && v !== vals[a.name] ? h("button.fe-btn.small", {type: "button",
                title: `Put ${app.STYLE_NAMES[style]}'s look in this field`,
                onclick: () => EZ.store.change((ed) => {
                  ed.looks = ed.looks || {};
                  if (v === base[a.name]) delete ed.looks[a.name]; else ed.looks[a.name] = v;
                })}, label) : null;
            };
            return h("div.fe-aliasrow", h("span.fe-bd-label", {title: a.name}, caption(a.name)), input, note,
              h("div.fe-row.fe-small", from("erazure", "Use Erazure's"), from("minimal", "Use Minimal's"),
                from("corrlorized", "Use Corrlorized's"),
                mineToo ? h("button.fe-btn.small", {type: "button", title: `Back to your version's (${yourVersion}) look`,
                  onclick: () => EZ.store.change((ed) => { delete ed.looks[a.name]; })}, "↺ Erazure's default") : null));
          });
          const el = h("div.fe-lookcard" + (c.aliases.some((a) => e.looks && a.name in e.looks) ? ".is-changed" : ""),
            h("div.fe-looktitle", c.title), c.note ? h("div.fe-sub.fe-small.fe-looknote2", c.note) : null, preview, rows);
          cardEls.push({el, words: (c.title + " " + c.note + " " + g.title + " " + sample).toLowerCase()});
          return el;
        })));
    });
    // the filter box: only the cards whose words have every word typed
    query.addEventListener("input", EZ.ui.debounce(() => {
      const words = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      for (const x of cardEls) x.el.hidden = !words.every((w) => x.words.indexOf(w) >= 0);
      for (const g of box.querySelectorAll(".fe-lookgroup")) {
        g.hidden = !!words.length && ![...g.querySelectorAll(".fe-lookcard")].some((c) => !c.hidden);
      }
    }, 150));

    /* ---- minimap icons (drawn at the icon size Alerts picks) */
    const notes = F.notifications(lines);
    const swaps = e.icons || {};
    const size = e.alerts && (e.alerts.iconSize === "smaller" || e.alerts.iconSize === "bigger") ? e.alerts.iconSize : null;
    const sized = (combo) => size ? EZ.edits.resized(combo, size) : combo;
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
      // what the icon is for, as the items its rules name (a rule's own note where it has one), never its code
      const where = [];
      for (const i of notes.icons[combo]) {
        const r = F.rule(lines[i]);
        const c = r.comment.replace(/^\/\/\s*/, "").trim();
        const w = EZ.words.forWhat(r.cond, c, 2);
        if (w && where.indexOf(w) < 0) where.push(w);
        if (where.length >= 3) break;
      }
      const more = notes.icons[combo].length > where.length;
      // rules with this icon and no sound give their chat line through the icon alone: without it, none
      const quiet = notes.icons[combo].filter((i) => { const r = F.rule(lines[i]); return r && !F.sounds(r.out).length; }).length;
      return h("div.fe-iconrow" + (combo in swaps ? ".is-changed" : ""),
        L.icon(sized(combo), palette, 3), h("span.fe-sub", {"aria-hidden": "true"}, "→"), L.icon(sized(to), palette, 3),
        h("div.fe-iconinfo",
          h("div.fe-sub", where.length ? "For " + where.join("; ") + (more ? "; and more" : "") : ""),
          h("div.fe-row.fe-small", ["BORDER", "MAP", "DOT", "PX"].map((l) => L.layerButton(l, layers[l], palette,
            (col) => set(l, col))),
          h("button.fe-btn.ghost.small", {type: "button", title: quiet ? `${quiet} of its rules have no sound: they lose ` +
            "their chat line too (the game needs an icon or a sound for one)" : "No minimap icon for these items",
            onclick: () => {
              EZ.store.change((ed) => { ed.icons = ed.icons || {}; ed.icons[combo] = ""; });
              if (quiet) EZ.ui.undoToast(`No icon: ${quiet} of its rules have no sound, so those items lose their chat ` +
                "line too.");
            }}, "No icon"),
          combo in swaps ? h("button.fe-btn.ghost.small", {type: "button", onclick: () => EZ.store.change((ed) => {
            delete ed.icons[combo];
          })}, "↺ Erazure's default") : null),
          to === "" && quiet ? h("p.fe-note.warn.fe-small", {style: {margin: ".3em 0 0"}}, `${quiet} of its rules ` +
            "have no sound: with no icon, those items get no chat line either.") : null));
    };
    const iconsCard = h("section.fe-card", {id: "fe-icons"},
      h("h3", "Minimap icons"),
      h("p.fe-sub", "Every icon Erazure draws on the minimap, most used first. An icon is up to four nested boxes " +
        "(outer, big, small and the center pixel), each in a color. Change one here and it changes everywhere Erazure " +
        "uses it." + (size ? ` Drawn ${size}, as your icon size on Alerts makes them.` : "")),
      h("div.fe-iconlist", combos.map(iconRow)));

    const jumps = h("p.fe-small.fe-row", {style: {gap: ".35em .6em"}}, h("span.fe-sub", "Jump to:"),
      [["looks-styles", "Styles"], ["recolor", "Color swaps"]].concat(F.GROUPS.filter((g) => cards.some((c) => c.group === g.id))
        .map((g) => ["looks-" + g.id, g.title])).concat([["icons", "Minimap icons"]]).map(([id, t]) =>
        h("a", {href: "#looks/" + id.replace(/^looks-/, ""), onclick: (ev) => {
          ev.preventDefault();
          const el = box.querySelector("#fe-" + id);
          if (el) el.scrollIntoView({behavior: "smooth"});
        }}, t)));
    EZ.ui.add(box, [
      h("div.fe-area-head", h("div", h("h2", "Looks"),
        h("p.fe-sub", "The symbols and colors around item names, and the minimap icons."), jumps)),
      presets, recolor, howTo, h("div.fe-row", {style: {marginBottom: ".6em"}}, query), tools, groupBoxes, iconsCard]);
    if (app.sub) {
      const el = box.querySelector("#fe-" + app.sub) || box.querySelector("#fe-looks-" + app.sub);
      if (el) el.scrollIntoView();
    }
  },
});
