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
  const RELOAD = "the reload filter key in game (Numpad 0 unless you changed it in Configure Controls)";

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
      let built = null;
      try {
        built = await build();
      } catch (e) {
        toast("Couldn't build your filter: " + (e && e.message || e), "bad", {sticky: true});
        if (window.console) console.error(e);
        app.building = false;
        done();
        return;
      }
      try {
        await fn(built);
      } catch (e) {
        // the folder picker closed without a folder (the player cancelled, or the browser refused a system folder
        // such as Program Files), or the browser couldn't write there: offer the download
        const offer = h("button.fe-btn.small", {type: "button", style: {marginLeft: ".6em"}, onclick: () => {
          close();
          download(built);
        }}, "Download instead");
        const close = e && e.name === "AbortError"
          ? toast(h("span", "No folder picked, so nothing was saved. If Diablo II is under Program Files, your " +
              "browser can't save there: download the file and move it into ", h("code", "filters\\local"), " yourself."),
            null, {ms: 14000, action: offer})
          : toast("Couldn't save into the folder: " + (e && e.message || e), "bad", {sticky: true, action: offer});
        if (!(e && e.name === "AbortError") && window.console) console.error(e);
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
      toast(h("span", "Downloaded ", h("b", built.name), ". Put it in Diablo II\\ProjectD2\\filters\\local (replace " +
              "the one there) and pick it in the launcher once (Local Filter, then Save Filter); then press " + RELOAD + "."),
            "good", {ms: 11000});
    } else {
      toast(h("span", "Saved ", h("b", built.name), " in ", h("b", folder), ". Press " + RELOAD + "."),
            "good", {ms: 8000});
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

  /* What a module wants the player to know before saving (EZ.app.checks: fn(app) -> {text, area, sub} or null): a
     dialog lists them, with Fix them (the first one's area) or Save anyway. */
  function checked(then) {
    const issues = app.checks.map((f) => { try { return f(app); } catch (e) { return null; } }).filter(Boolean);
    if (!issues.length) { then(); return; }
    dialog({title: "Before you save", body: [
      h("p", issues.length === 1 ? "Have a look at this first:" : "Have a look at these first:"),
      h("ul", issues.map((x) => h("li", x.text))),
      h("p.fe-sub", "Fix them first, or save as it is.")],
      buttons: [{text: "Save anyway", onclick: () => { then(); }},
                {text: "Fix them", primary: true, onclick: () => {
                  const at = issues.find((x) => x.area);
                  if (at) go(at.area, at.sub || "");
                }}]});
  }

  /* Two profiles that save to the same file replace each other's filter in the game folder. */
  function sharedFileCheck() {
    const p = EZ.store.current();
    const same = EZ.store.sharedFiles().find((list) => list.some((x) => x.id === p.id));
    if (!same) return null;
    const others = same.filter((x) => x.id !== p.id).map((x) => x.name);
    return {text: `Your profile ${p.name} saves to the same file as ${others.join(", ")} (${fileName(p)}): saving it ` +
      "replaces that profile's filter in your game folder. Give it a file name of its own on Start.", area: "start",
      sub: "save"};
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
              h("li", "After every save here, press " + RELOAD + ".")),
            h("p.fe-sub", "If Diablo II is installed under Program Files, your browser won't let the page save there: " +
              "use Download instead and move the file into filters\\local yourself."),
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
    if (!(opts && opts.keepScroll) && !sub) {  // with a sub-section, the area has scrolled to it
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
    if (m && m[1] === "wishlists") m[1] = "highlights";  // the areas' names until 2026-11-12
    if (m && m[1] === "options") m[1] = "quick";
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
      h("button.fe-btn", {type: "button", onclick: togglePreview, "aria-pressed": String(previewShown()),
        title: previewShown() ? "Hide the preview (more room for the area)" : "Show the preview"}, "Preview"),
      h("span.fe-row", {style: {gap: "0"}}, saveBtn, more));
  }

  function drawSide() {
    const ch = changes();
    const list = h("ul.fe-nav");
    let group = null;
    const NAMED = {c: "Advanced"};  // My rules and Erazure's rules: the filter's own language
    for (const a of EZ.areas) {
      if (group !== null && a.group !== group) {
        list.appendChild(NAMED[a.group] ? h("li.fe-nav-sep.named", NAMED[a.group])
          : h("li.fe-nav-sep", {"aria-hidden": "true"}));
      }
      group = a.group;
      const c = ch.byArea[a.id] || {n: 0, w: 0};
      list.appendChild(h("li", h("button", {type: "button", "aria-current": a.id === app.area ? "page" : null,
        title: a.title, onclick: () => go(a.id)},
        h("span.ic", {"aria-hidden": "true"}, a.icon), h("span.lbl", a.title),
        c.w ? h("span.n.warn", {title: `${c.w} need a look`}, "⚠" + c.w) : c.n ? h("span.n", String(c.n)) : null)));
    }
    fill(app.els.side, h("nav", {"aria-label": "Editor areas"}, list));
  }

  /* Draw the chosen area. A sub-section (app.sub: a link such as Alerts' "change them on Looks", or the address)
     is scrolled to by the area on this drawing only: later redraws (every change) leave the page where it is. */
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
    app.sub = "";
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

  /* The preview column: a drawer on narrow screens (pv-open), a column that closes on wide ones (pv-closed; the
     choice kept in this browser; closed at first below 1400 px, where the area needs the room). */
  const narrow = () => window.matchMedia("(max-width: 1000px)").matches;
  function previewShown() {
    const root = app.els.root;
    return !!root && (narrow() ? root.classList.contains("pv-open") : !root.classList.contains("pv-closed"));
  }
  function togglePreview() {
    const root = app.els.root;
    if (narrow()) root.classList.toggle("pv-open");
    else {
      const closed = root.classList.toggle("pv-closed");
      try { localStorage.setItem("erazure-filter-editor-pv", closed ? "closed" : "open"); } catch (e) { /* this visit */ }
    }
    if (previewShown() && EZ.preview && EZ.preview.changed) EZ.preview.changed({}, app);  // catch up
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
    preview.appendChild(h("button.fe-btn.ghost.small.fe-pvclose", {type: "button", onclick: togglePreview,
      title: "Hide the preview (more room for the area)"}, "Hide ▸"));
    preview.appendChild(h("button.fe-pvtab", {type: "button", onclick: togglePreview, title: "Show the preview"},
      "◂ Preview"));
    const inner = h("div.fe-preview-inner");
    preview.appendChild(inner);
    let pv = null;
    try { pv = localStorage.getItem("erazure-filter-editor-pv"); } catch (e) { /* the default */ }
    if (pv === "closed" || (pv === null && window.innerWidth < 1400)) root.classList.add("pv-closed");
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
      if (EZ.preview && EZ.preview.changed && previewShown()) EZ.preview.changed(ev, app);
      if (ev.other) otherTab();
    });
    document.addEventListener("visibilitychange", () => { if (!document.hidden && app.otherTab) otherTab(); });
    app.checks.unshift(sharedFileCheck);
  }

  /* A line of a built filter (the player's, or Erazure's version) named for the player: Erazure's lines as Erazure's
     rules numbers them ("110-runes:132"; open() shows that rule there), the player's by what made them ("your item
     change: Hide it · Shako", "your rule above Erazure's, line 3", "your highlight: Caster amulet"). -> {text, open} */
  function lineRef(lines, i) {
    if (i === null || i === undefined || i < 0 || !lines) return {text: "no rule", open: null};
    const line = lines[i] || "";
    const own = EZ.rules.locate(lines, i);
    if (own) {
      return {text: (own.block === "top" ? "your rule above Erazure's, line " : "your rule below Erazure's, line ") +
        own.n, open: () => go("rules")};
    }
    const m = /\/\/ Your item change \[([^\]]*)\]\s*$/.exec(line);
    if (m) {
      const id = m[1];
      const o = (EZ.store.current().edits.items || []).find((x) => x.id === id);
      const what = o && EZ.itemsArea ? EZ.itemsArea.title(o) : id === "maps" ? "a map you don't pick up" : "";
      return {text: "your item change" + (what ? ": " + what : ""), open: () => go(id === "maps" ? "maps" : "items")};
    }
    const hl = /\/\/ Your highlight: (.*)$/.exec(line);
    if (hl) return {text: "your highlight: " + hl[1].trim(), open: () => go("highlights")};
    const v = versionLines();
    const j = lines === v ? i : EZ.diff.origin(v, lines)[i];
    if (j >= 0) {
      const secs = EZ.filter.sections(app.src, v), name = EZ.filter.sectionOf(secs, j);
      return {text: name ? name.replace(/\.filter$/, "") + ":" + (j - secs[name][0] + 1) : "line " + (j + 1),
        open: () => { go("erazure"); if (EZ.erazureArea) EZ.erazureArea.open(app, j); }};
    }
    return {text: "a line your changes added", open: () => go("changes")};
  }
  /* lineRef as a link (a button) or as text. */
  function lineLink(lines, i) {
    const r = lineRef(lines, i);
    return r.open ? h("button.fe-linkbtn", {type: "button", title: "Open it", onclick: r.open}, r.text) : r.text;
  }

  /* My rules and Erazure's rules open with this (it folds, and stays folded in this browser): they are for the loot
     filter's own language, and most changes have an area of their own that follows every update. */
  function advancedNote() {
    const KEY = "erazure-filter-editor-adv";
    let folded = false;
    try { folded = localStorage.getItem(KEY) === "folded"; } catch (e) { /* open */ }
    const link = (area, text) => h("a", {href: "#" + area, onclick: (ev) => { ev.preventDefault(); go(area); }}, text);
    const d = h("details.fe-note.fe-advnote", folded ? {} : {open: true},
      h("summary", h("b", "Advanced"), ": rules in the loot filter's own language (BH, the part of the game that " +
        "reads the filter)."),
      h("p", "To show, hide or restyle particular items, use ", link("items", "Items"), "; whole kinds of items, ",
        link("quick", "Quick Edits"), "; sounds, chat lines and icons, ", link("alerts", "Alerts"), "; colors and " +
        "symbols, ", link("looks", "Looks"), "; tags and description lines, ", link("features", "Features"),
        "; the rares you want, ", link("highlights", "Highlights"), ". Those follow every Erazure update and never " +
        "need checking."));
    d.addEventListener("toggle", () => {
      try { localStorage.setItem(KEY, d.open ? "open" : "folded"); } catch (e) { /* this visit */ }
    });
    return d;
  }

  /* Another tab of the editor saved: this tab took its changes (EZ.store). Say so once the player looks at this tab. */
  let otherSaid = 0;
  function otherTab() {
    if (document.hidden) { app.otherTab = true; return; }
    app.otherTab = false;
    if (Date.now() - otherSaid < 60000) return;
    otherSaid = Date.now();
    toast("The editor is open in another tab too, and it changed your profiles there: this tab now shows those " +
      "changes. Work in one tab at a time.", null, {ms: 10000});
  }

  Object.assign(app, {start, go, redraw, drawBar, drawSide, drawArea, drawPreview, variant, variantFor, toggleName,
                      versionLines, advancedNote, lineRef, lineLink,
                      changes, build, withBuild, download, saveToGame, canSaveInPlace, forgetFolder, fileName,
                      STYLE_NAMES, saveMenu: [], checks: []});
  return app;
})();
