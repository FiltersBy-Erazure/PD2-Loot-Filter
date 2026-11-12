/* The Filter Editor's frame: loads the filter's source, keeps the player's profile, draws the bar, the sidebar of
   areas (each area is a module that registers itself in EZ.areas), the chosen area and the preview column, and builds,
   saves and downloads the player's filter. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
EZ.app = (function () {
  "use strict";
  const {h, fill, toast, dialog, menu} = EZ.ui;
  const SOURCE_FILE = "Erazure-Filter-Editor-Source.js";
  const STYLES = {erazure: null, minimal: "minimal.filter", corrlorized: "corrlorized.edits"};
  const STYLE_NAMES = {erazure: "Erazure", minimal: "Minimal", corrlorized: "Corrlorized"};

  const app = {src: null, data: null, root: null, area: "start", sub: "", els: {}, building: null};

  /* ---------------------------------------------------------------- the source */

  function sourceUrl(scriptSrc, v) {
    const q = v && !v.startsWith("__") ? "?v=" + v : "";
    if (scriptSrc) {
      try { return new URL("../../" + SOURCE_FILE + q, scriptSrc).href; } catch (e) { /* the file's own name */ }
    }
    return SOURCE_FILE + q;
  }

  /* The game art's folder (Erazure-Filter-Editor-Assets): beside the source file. */
  function assetBase(scriptSrc) {
    if (scriptSrc) {
      try { return new URL("../../Erazure-Filter-Editor-Assets/", scriptSrc).href; } catch (e) { /* beside the page */ }
    }
    return "Erazure-Filter-Editor-Assets/";
  }

  function loadSource(url) {
    return new Promise((resolve, reject) => {
      if (window.ERAZURE_EDITOR_SOURCE) { resolve(window.ERAZURE_EDITOR_SOURCE); return; }
      const s = document.createElement("script");
      s.src = url;
      s.onload = () => window.ERAZURE_EDITOR_SOURCE ? resolve(window.ERAZURE_EDITOR_SOURCE)
                                                     : reject(new Error("the filter's data file is empty"));
      s.onerror = () => reject(new Error("the filter's data file didn't load"));
      document.head.appendChild(s);
    });
  }

  /* ---------------------------------------------------------------- versions */

  function toggleName(base) {
    const parts = [];
    if (base.revealed) parts.push("Revealed");
    if (base.bigGG) parts.push("BIG GG");
    if (base.poe || base.style === "corrlorized") parts.push("PoE");
    if (!base.revealed && !base.bigGG) parts.unshift("Main");
    return "Erazure - " + parts.join(" - ");
  }

  /* The launcher version the player's base is: one of the source's variants. */
  function variantFor(base) {
    const toggle = toggleName(base), style = STYLES[base.style];
    return app.src.variants.find((v) => v.toggle === toggle && (v.style || null) === style) || null;
  }

  function variant() { return variantFor(EZ.store.current().edits.base); }

  /* A version's lines in alias form, before any edit (cached: the areas read them to list what can change). */
  const lineCache = new Map();
  function versionLines(v) {
    v = v || variant();
    if (!lineCache.has(v.name)) lineCache.set(v.name, EZ.core.variantLines(app.src, v));
    return lineCache.get(v.name);
  }

  /* What the player's edits change beyond their version: {count, warn, byArea} (each edit module counts its own). */
  function changes() {
    const out = {count: 0, warn: 0, byArea: {}};
    const e = EZ.store.current().edits;
    for (const a of EZ.areas) {
      const n = a.count ? a.count(e, app) : 0, w = a.warn ? a.warn(e, app) : 0;
      out.byArea[a.id] = {n, w};
      out.count += n;
      out.warn += w;
    }
    return out;
  }

  /* ---------------------------------------------------------------- building and saving */

  /* The player's filter: {bytes, lines, name, variant, crc, report}. EZ.edits applies the edits when that module is
     there; with none the file is the launcher's. */
  async function build() {
    const p = EZ.store.current(), v = variant();
    let lines = EZ.core.variantLines(app.src, v), report = null;
    if (EZ.edits && EZ.edits.apply) {
      const r = EZ.edits.apply(app.src, p, lines, app);
      lines = r.lines;
      report = r.report;
    }
    lines = EZ.core.written(app.src, lines);
    if (report && report.count) lines = (await EZ.edits.headerLines(app.src, p, v, report.count)).concat(lines);
    const bytes = EZ.core.encode(lines);
    return {bytes, lines, name: fileName(p), variant: v, crc: EZ.core.crc32(bytes), report};
  }

  function fileName(p) {
    const base = (p.file || "Erazure-Custom").replace(/\.filter$/i, "").replace(/[\\/:*?"<>|]+/g, "-").trim();
    return (base || "Erazure-Custom") + ".filter";
  }

  /* Build in the next frame (the page shows that it's working), then hand the file to fn. */
  function withBuild(what, fn) {
    if (app.building) return;
    const done = toast(h("span", h("span.fe-spin"), " " + what + "…"), null, {sticky: true});
    app.building = true;
    setTimeout(async () => {
      try {
        await fn(await build());
      } catch (e) {
        if (e && e.name === "AbortError") return;
        toast("Couldn't build your filter: " + (e && e.message || e), "bad", {sticky: true});
        if (window.console) console.error(e);
      } finally {
        app.building = false;
        done();
      }
    }, 30);
  }

  function download(built) {
    const url = URL.createObjectURL(new Blob([built.bytes], {type: "application/octet-stream"}));
    const a = h("a", {href: url, download: built.name});
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    saved(built, "download");
  }

  function saved(built, how, folder) {
    EZ.store.changeProfile((p) => {
      p.saved = {version: app.src.version, build: app.src.build, at: Date.now(), crc: built.crc, how, folder: folder || "",
                 file: built.name};
    });
    EZ.store.remember(EZ.store.current(), how === "download" ? "downloaded" : "saved to the game");
    if (how === "download") {
      toast(h("span", "Downloaded ", h("b", built.name), ". Put it in Diablo II\\ProjectD2\\filters\\local and pick it " +
              "in the launcher (Local Filter, then Save Filter)."), "good", {ms: 9000});
    } else {
      toast(h("span", "Saved ", h("b", built.name), " in ", h("b", folder), ". In game, press Numpad 0 to reload it."),
            "good", {ms: 7000});
    }
    redraw();
  }

  const canSaveInPlace = () => window.isSecureContext && "showDirectoryPicker" in window;

  async function folderHandle(ask) {
    let dir = await EZ.store.kvGet("dir");
    if (dir && dir.queryPermission) {
      let state = await dir.queryPermission({mode: "readwrite"});
      if (state === "prompt") state = await dir.requestPermission({mode: "readwrite"});
      if (state === "granted") return dir;
    }
    if (!ask) return null;
    dir = await window.showDirectoryPicker({id: "pd2-filters-local", mode: "readwrite"});
    await EZ.store.kvSet("dir", dir);
    return dir;
  }

  async function writeInPlace(built, dir) {
    let old = null;
    try {
      const f = await (await dir.getFileHandle(built.name)).getFile();
      old = await f.arrayBuffer();
    } catch (e) { /* no file yet */ }
    if (old && old.byteLength) {
      const bak = await dir.getFileHandle(built.name + ".bak", {create: true});
      const w = await bak.createWritable();
      await w.write(old);
      await w.close();
    }
    const fh = await dir.getFileHandle(built.name, {create: true});
    const w = await fh.createWritable();
    await w.write(built.bytes);
    await w.close();
  }

  /* What a module wants the player to know before saving (EZ.app.checks: fn(app) -> {text, area} or null): a
     dialog lists them, with Save anyway or Fix them (the first one's area). */
  function checked(then) {
    const issues = app.checks.map((f) => { try { return f(app); } catch (e) { return null; } }).filter(Boolean);
    if (!issues.length) { then(); return; }
    dialog({title: "Before you save", body: [
      h("p", "BH will trip over some of your changes:"),
      h("ul", issues.map((x) => h("li", x.text))),
      h("p.fe-sub", "Save anyway, or fix them first.")],
      buttons: [{text: "Fix them", onclick: () => { const at = issues.find((x) => x.area); if (at) go(at.area); }},
                {text: "Save anyway", primary: true, onclick: () => { then(); }}]});
  }

  function saveToGame() { checked(saveNow); }

  function saveNow() {
    if (!canSaveInPlace()) { withBuild("Building your filter", download); return; }
    withBuild("Saving your filter", async (built) => {
      let dir = await folderHandle(false);
      if (!dir) {
        const ok = await new Promise((resolve) => dialog({
          title: "Save straight into your game",
          body: [
            h("p", "Pick the folder ", h("code", "Diablo II\\ProjectD2\\filters\\local"), ". The editor saves ",
              h("b", built.name), " there, keeps the one it replaces as ", h("code", built.name + ".bak"),
              " and remembers the folder for next time."),
            h("ol.fe-steps",
              h("li", "Pick the ", h("b", "local"), " folder (inside ProjectD2\\filters)."),
              h("li", "Once: in the launcher open Item Filter Profiles, click ", h("b", "Local Filter"), ", pick ",
                h("b", built.name), " and click ", h("b", "Save Filter"), "."),
              h("li", "After every save here, press ", h("kbd", "Numpad 0"), " in game: the filter reloads.")),
          ],
          buttons: [{text: "Download instead", onclick: () => resolve("download")},
                    {text: "Pick the folder", primary: true, onclick: () => resolve("pick")}],
          onclose: () => resolve(null),
        }));
        if (ok === "download") { download(built); return; }
        if (ok !== "pick") return;
        dir = await folderHandle(true);
      }
      if (dir.name !== "local" && !(await new Promise((resolve) => dialog({
        title: "Is this the right folder?",
        body: [h("p", "The folder you picked is ", h("b", dir.name), ". The launcher's local filters live in ",
                 h("code", "Diablo II\\ProjectD2\\filters\\local"), ". Save here anyway?")],
        buttons: [{text: "Pick another", onclick: async () => { await EZ.store.kvSet("dir", undefined); resolve(false); }},
                  {text: "Save here", primary: true, onclick: () => resolve(true)}],
        onclose: () => resolve(false),
      })))) return;
      await writeInPlace(built, dir);
      saved(built, "folder", dir.name);
    });
  }

  async function forgetFolder() {
    await EZ.store.kvSet("dir", undefined);
    toast("The editor forgot the game folder; the next save asks for it again.");
  }

  /* ---------------------------------------------------------------- the frame */

  function go(area, sub, opts) {
    if (!EZ.areas.some((a) => a.id === area)) area = "start";
    app.area = area;
    app.sub = sub || "";
    const hash = "#" + area + (app.sub ? "/" + app.sub : "");
    if (location.hash !== hash) {
      try { history[opts && opts.replace ? "replaceState" : "pushState"](null, "", hash); } catch (e) { /* file: */ }
    }
    app.els.root.classList.remove("nav-open");
    drawArea();
    drawSide();
    if (!(opts && opts.keepScroll)) {
      const top = app.els.root.getBoundingClientRect().top + window.scrollY - topOffset();
      if (window.scrollY > top) window.scrollTo({top});
    }
  }

  function topOffset() {
    const v = getComputedStyle(app.els.root).getPropertyValue("--top").trim();
    if (v.endsWith("rem")) return parseFloat(v) * parseFloat(getComputedStyle(document.documentElement).fontSize);
    return parseFloat(v) || 0;
  }

  function fromHash() {
    const m = /^#([a-z-]+)(?:\/(.*))?$/.exec(location.hash || "");
    if (m && m[1] === "wishlists") m[1] = "highlights";  // the area's name until 2026-11-12
    if (m && EZ.areas.some((a) => a.id === m[1])) {
      app.area = m[1];
      app.sub = m[2] ? decodeURIComponent(m[2]) : "";
    }
  }

  function drawBar() {
    const p = EZ.store.current(), v = variant(), ch = changes();
    const bar = app.els.bar;
    const stale = p.saved && p.saved.version !== app.src.version;
    const saveBtn = h("button.fe-btn.primary", {type: "button", onclick: saveToGame,
      title: canSaveInPlace() ? "Save your filter into the game's filters\\local folder" : "Download your filter"},
      canSaveInPlace() ? "Save to game" : "Download");
    const more = h("button.fe-btn", {type: "button", "aria-label": "More ways to save", "aria-haspopup": "menu"}, "▾");
    more.addEventListener("click", () => menu(more, [
      {text: "Download the file", sub: "to put in filters\\local yourself", onclick: () => checked(() =>
        withBuild("Building your filter", download))},
      canSaveInPlace() ? {text: "Forget the game folder", sub: "the next save asks for it again", onclick: forgetFolder} : null,
      {text: "Save changes to a file", sub: "to keep or move them (import it here)", onclick: () => EZ.share.exportFile(app)},
      {text: "Copy a share link", sub: "anyone opening it can load your changes", onclick: () => EZ.share.copyLink()},
      {text: "Import changes", sub: "a changes file, or a filter this editor saved", onclick: () => EZ.share.importFile()},
      ...(EZ.app.saveMenu || []).map((f) => f(app)),
    ]));
    fill(bar,
      h("button.fe-btn.ghost.fe-only-phone", {type: "button", "aria-label": "Areas", onclick: () => {
        app.els.root.classList.toggle("nav-open");
      }}, "☰"),
      h("div.fe-title", h("b", p.name)),
      h("button.fe-chip", {type: "button", title: "Your version: change it on Start", onclick: () => go("start")},
        v ? v.launcher : "?"),
      h("span.fe-chip" + (ch.count ? ".good" : ""), {title: "Your changes to Erazure"},
        ch.count ? EZ.ui.plural(ch.count, "change") : "No changes"),
      ch.warn ? h("button.fe-chip.warn", {type: "button", title: "Changes that need a look",
        onclick: () => go("changes")}, "⚠ " + ch.warn) : null,
      h("span.fe-chip" + (stale ? ".warn" : ""), {title: stale ? "Erazure has changed since you last saved: save " +
        "again to get the new version with your changes" : "The Erazure version this page builds"},
        stale ? "Update: " + app.src.version : app.src.version),
      app.els.search || null,
      h("span.fe-bar-gap"),
      h("button.fe-btn.ghost", {type: "button", onclick: () => EZ.store.undoStep(), disabled: !EZ.store.canUndo(),
        title: "Undo (Ctrl+Z)"}, "↶"),
      h("button.fe-btn.ghost", {type: "button", onclick: () => EZ.store.redoStep(), disabled: !EZ.store.canRedo(),
        title: "Redo (Ctrl+Y)"}, "↷"),
      h("button.fe-btn.fe-only-narrow", {type: "button", onclick: togglePreview, "aria-expanded":
        String(app.els.root.classList.contains("pv-open"))}, "Preview"),
      h("span.fe-row", {style: {gap: "0"}}, saveBtn, more));
  }

  function drawSide() {
    const ch = changes();
    const list = h("ul.fe-nav");
    let group = null;
    for (const a of EZ.areas) {
      if (group !== null && a.group !== group) list.appendChild(h("li.fe-nav-sep", {"aria-hidden": "true"}));
      group = a.group;
      const c = ch.byArea[a.id] || {n: 0, w: 0};
      list.appendChild(h("li", h("button", {type: "button", "aria-current": a.id === app.area ? "page" : null,
        title: a.title, onclick: () => go(a.id)},
        h("span.ic", {"aria-hidden": "true"}, a.icon), h("span.lbl", a.title),
        c.w ? h("span.n.warn", {title: `${c.w} need a look`}, "⚠" + c.w) : c.n ? h("span.n", String(c.n)) : null)));
    }
    fill(app.els.side, h("nav", {"aria-label": "Editor areas"}, list));
  }

  function drawArea() {
    const a = EZ.areas.find((x) => x.id === app.area) || EZ.areas[0];
    const box = app.els.area;
    fill(box);
    try {
      a.render(box, app);
    } catch (e) {
      fill(box, h("p.fe-note.bad", "This area failed to draw: " + (e && e.message || e)));
      if (window.console) console.error(e);
    }
  }

  function drawPreview() {
    const box = app.els.preview;
    if (EZ.preview && EZ.preview.render) {
      EZ.preview.render(box, app);
    } else {
      fill(box, h("div.fe-pv-head", h("h3", "Preview")),
        h("div.fe-pv-body", h("p.fe-sub", "The preview comes in a later step of the editor's build.")));
    }
  }

  function togglePreview() {
    app.els.root.classList.toggle("pv-open");
    drawBar();
  }

  function redraw() {
    drawBar();
    drawSide();
    drawArea();
  }

  function frame(root) {
    const bar = h("header.fe-bar");
    const side = h("aside.fe-side");
    const area = h("main.fe-area", {tabindex: "-1"});
    const preview = h("aside.fe-preview", {"aria-label": "Preview"});
    const grip = h("div.fe-grip", {title: "Drag to make the preview wider or narrower", "aria-hidden": "true"});
    fill(root, bar, side, area, preview);
    preview.appendChild(grip);
    const inner = h("div.fe-preview-inner");
    preview.appendChild(inner);
    Object.assign(app.els, {root, bar, side, area, preview: inner, grip});
    grip.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const x0 = e.clientX, w0 = preview.getBoundingClientRect().width;
      const move = (ev) => {
        const w = Math.max(340, Math.min(window.innerWidth * 0.6, w0 + (x0 - ev.clientX)));
        root.style.setProperty("--pw", Math.round(w) + "px");
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        try { localStorage.setItem("erazure-filter-editor-pw", root.style.getPropertyValue("--pw")); } catch (er) { /**/ }
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
    try {
      const pw = localStorage.getItem("erazure-filter-editor-pw");
      if (pw) root.style.setProperty("--pw", pw);
    } catch (e) { /* the default width */ }
  }

  function keys(e) {
    if (e.defaultPrevented) return;
    const t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !typing) {
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { if (EZ.store.undoStep()) e.preventDefault(); }
      else if (k === "y" || (k === "z" && e.shiftKey)) { if (EZ.store.redoStep()) e.preventDefault(); }
    }
  }

  /* ---------------------------------------------------------------- start */

  async function start(root, data, scriptSrc, sourceV) {
    app.data = data || {};
    EZ.ui.setHost(root.parentElement || root);
    if (EZ.glyphs) EZ.glyphs.init(app.data.assets, assetBase(scriptSrc));
    if (EZ.scene) EZ.scene.init(app.data.assets, assetBase(scriptSrc));
    if (EZ.sound) EZ.sound.init(app.data.assets, assetBase(scriptSrc));
    if (EZ.items) EZ.items.init(app.data);
    if (EZ.maps) EZ.maps.init(app.data);
    EZ.store.load();
    EZ.areas.sort((a, b) => a.order - b.order);
    try {
      app.src = await loadSource(sourceUrl(scriptSrc, sourceV));
    } catch (e) {
      fill(root, h("div.fe-loading", h("p", "The editor couldn't load Erazure's filter: " + e.message + "."),
        h("p", "Reload the page to try again.")));
      return;
    }
    if (EZ.edits && EZ.edits.init) EZ.edits.init(app.src, app);
    frame(root);
    fromHash();
    redraw();
    drawPreview();
    window.addEventListener("popstate", () => { fromHash(); drawArea(); drawSide(); });
    EZ.share.fromLocation();
    document.addEventListener("keydown", keys);
    EZ.store.on((ev) => {
      if (ev.what === "switch" || ev.undo) redraw();
      else { drawBar(); drawSide(); if (!ev.quiet) drawArea(); }
      if (EZ.preview && EZ.preview.changed) EZ.preview.changed(ev, app);
    });
  }

  Object.assign(app, {start, go, redraw, drawBar, drawSide, drawArea, drawPreview, variant, variantFor, toggleName,
                      versionLines,
                      changes, build, withBuild, download, saveToGame, canSaveInPlace, forgetFolder, fileName,
                      STYLE_NAMES, saveMenu: [], checks: []});
  return app;
})();
