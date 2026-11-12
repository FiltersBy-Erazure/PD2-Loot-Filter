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
      done();  // built: what follows (a folder dialog, the browser's own prompt, the write) shows itself
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

  /* A browser that already has the file in its downloads saves the new one as "Erazure-Custom (1).filter": the
     launcher would keep loading the old one. */
  const renamedNote = (name) => "If your browser added a number to the name, such as " +
    name.replace(/\.filter$/, " (1).filter") + ", rename it back to " + name + ".";

  function saved(built, how, folder) {
    const before = EZ.store.current().saved;
    // the first save of this profile, or the first under a new file name: the launcher needs picking (once)
    const first = !before || before.file !== built.name;
    const changesN = built.report && built.report.count || 0;
    EZ.store.changeProfile((p) => {
      p.saved = {version: app.src.version, build: app.src.build, at: Date.now(), crc: built.crc, how, folder: folder || "",
                 file: built.name, edits: editsKey(p)};
    });
    EZ.store.remember(EZ.store.current(), how === "download" ? "downloaded" : "saved to the game");
    if (first) {
      nextSteps(built, how, changesN);
    } else if (how === "download") {
      toast(h("span", "Downloaded ", h("b", built.name), ". Replace the one in Diablo II\\ProjectD2\\filters\\local " +
              "with it, then press " + RELOAD + ". " + renamedNote(built.name)), "good", {ms: 12000});
    } else {
      toast(h("span", "Saved ", h("b", built.name), " in ", h("b", folder), ". Press " + RELOAD + "."),
            "good", {ms: 8000});
    }
    redraw();
  }

  /* After the first save (of a profile, or under a new file name): what's left to do, in a box that stays until it is
     closed, and how to tell in game that the file is the one loaded (the Cube's version line). */
  function nextSteps(built, how, changesN) {
    const steps = [];
    if (how === "download") {
      steps.push(h("li", "Move ", h("b", built.name), " from your downloads into ",
        h("code", "Diablo II\\ProjectD2\\filters\\local"), " (replace the one there). " + renamedNote(built.name)));
    }
    steps.push(h("li", "In the launcher open ", h("b", "Item Filter Profiles"), ", click ", h("b", "Local Filter"),
      ", pick ", h("b", built.name), " and click ", h("b", "Save Filter"), ". Only this once: the launcher keeps it."));
    steps.push(h("li", "In game, press " + RELOAD + " (or start the game)."));
    steps.push(h("li", "To check it's yours: hover the Horadric Cube in your inventory. Its version line ends with ",
      h("b", changesN ? `Custom (${changesN} change${changesN === 1 ? "" : "s"})` : "Custom (… changes)"), "."));
    let close = null;
    close = dialog({title: how === "download" ? "Downloaded: put it in your game" : "Saved: one step in the launcher",
      body: [h("ol.fe-steps", steps),
        h("p.fe-sub", "Next time, saving here is all it takes, then the reload key. Doesn't show? See ",
          h("a", {href: "#changes/ch-help", onclick: (ev) => {
            ev.preventDefault();
            if (close) close();
            go("changes", "ch-help");
          }}, "If nothing you change shows in game"), ".")],
      buttons: [{text: "Got it", primary: true, onclick: () => {}}]});
  }

  const canSaveInPlace = () => window.isSecureContext && "showDirectoryPicker" in window;

  /* The game folder: the one kept from last time (asking the browser again if it must), or one the player picks
     (ask; another: never the kept one). */
  async function folderHandle(ask, another) {
    let dir = another ? null : await EZ.store.kvGet("dir");
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
              h("li", "Pick the ", h("b", "local"), " folder (inside ProjectD2\\filters). Your browser then asks to " +
                "let this page edit files in that folder: allow it."),
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
      // a folder that isn't "local": save there anyway, or pick another (the click opens the folder picker again)
      while (dir.name !== "local") {
        const ans = await new Promise((resolve) => dialog({
          title: "Is this the right folder?",
          body: [h("p", "The folder you picked is ", h("b", dir.name), ". The launcher's local filters live in ",
                   h("code", "Diablo II\\ProjectD2\\filters\\local"), ". Save here anyway?")],
          buttons: [{text: "Pick another", onclick: () => resolve("again")},
                    {text: "Save here", primary: true, onclick: () => resolve("here")}],
          onclose: () => resolve(null),
        }));
        if (ans === "here") break;
        if (ans !== "again") return;
        dir = await folderHandle(true, true);  // straight from the click: the browser opens its picker only then
      }
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
    const navWasOpen = app.els.root.classList.contains("nav-open");
    app.els.root.classList.remove("nav-open");
    drawArea();
    drawSide();
    drawBar();
    syncDrawers();
    if (!(opts && opts.keepScroll) && !sub) {  // with a sub-section, the area has scrolled to it
      const top = app.els.root.getBoundingClientRect().top + window.scrollY - topOffset();
      if (window.scrollY > top) window.scrollTo({top});
    }
    // keyboard and screen reader users land on the area (or the part linked to): its heading takes the focus
    const target = sub && app.els.area.querySelector("#fe-" + sub) || app.els.area;
    const head = target.querySelector("h2, h3") || app.els.area.querySelector("h2");
    if (head && (navWasOpen || !(opts && opts.noFocus))) {
      head.tabIndex = -1;
      try { head.focus({preventScroll: true}); } catch (e) { head.focus(); }
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

  const isPhone = () => window.matchMedia("(max-width: 640px)").matches;

  /* The menu beside Save: saving, then backing up and sharing, then help; on a phone with no folder to save into,
     taking the changes to a PC comes first (they live in this phone's browser). */
  function saveMenuItems() {
    const toPc = !canSaveInPlace() && isPhone();
    const share = {text: "Copy a share link", sub: toPc ? "open it on your PC to get your changes there"
      : "anyone opening it can load your changes", onclick: () => EZ.share.copyLink()};
    const extra = (EZ.app.saveMenu || []).map((f) => f(app));
    return [
      toPc ? {heading: "Your changes stay on this phone"} : null,
      toPc ? share : null,
      {heading: "Save"},
      {text: "Download the filter (.filter)", sub: "to put in filters\\local yourself", onclick: () => checked(() =>
        withBuild("Building your filter", download))},
      canSaveInPlace() ? {text: "Forget the game folder", sub: "the next save asks for it again", onclick: forgetFolder} : null,
      {heading: "Back up and share"},
      {text: "Back up my changes (.json)", sub: "a file of your changes, to keep or move (not for the game)",
        onclick: () => EZ.share.exportFile(app)},
      toPc ? null : share,
      {text: "Import changes", sub: "a backup, a share link, or a filter this editor saved",
        onclick: () => EZ.share.importFile()},
      isPhone() ? {heading: "This page"} : null,
      isPhone() ? {text: "Undo", sub: "the last change", disabled: !EZ.store.canUndo(), onclick: () => EZ.store.undoStep()} : null,
      isPhone() ? {text: "Redo", disabled: !EZ.store.canRedo(), onclick: () => EZ.store.redoStep()} : null,
      extra.length ? {heading: "Help"} : null,
      ...extra,
    ];
  }

  function drawBar() {
    const p = EZ.store.current(), v = variant(), ch = changes();
    const bar = app.els.bar;
    const stale = p.saved && p.saved.version !== app.src.version;
    // changes made since the last save: the game's file doesn't have them yet
    const behind = !!(p.saved && p.saved.edits !== undefined && p.saved.edits !== editsKey(p));
    const saveBtn = h("button.fe-btn.primary" + (behind ? ".is-behind" : ""), {type: "button", onclick: saveToGame,
      title: (canSaveInPlace() ? "Save your filter into the game's filters\\local folder" : "Download your filter") +
        (behind ? ": your file in the game doesn't have your latest changes yet" : "")},
      canSaveInPlace() ? "Save to game" : "Download",
      behind ? [h("span.fe-dot", {"aria-hidden": "true"}), h("span.fe-sr", " (your latest changes aren't saved yet)")] : null);
    const more = h("button.fe-btn", {type: "button", "aria-label": "More ways to save and share", "aria-haspopup": "menu",
      "aria-expanded": "false"}, "▾");
    more.addEventListener("click", () => menu(more, saveMenuItems()));
    const areaNow = EZ.areas.find((a) => a.id === app.area) || EZ.areas[0];
    const navOpen = app.els.root.classList.contains("nav-open");
    fill(bar,
      h("button.fe-btn.fe-only-phone.fe-navbtn", {type: "button", "aria-expanded": String(navOpen),
        "aria-controls": "fe-side", "aria-label": "Areas (now " + areaNow.title + ")", onclick: () => toggleNav()},
        h("span", {"aria-hidden": "true"}, "☰"), " " + areaNow.title),
      h("button.fe-title", {type: "button", title: "Your profile: switch, rename or add one on Start",
        onclick: () => go("start", "profiles")}, h("small", "Profile"), h("b", p.name)),
      h("button.fe-chip.fe-hide-phone", {type: "button", title: "Your version: change it on Start",
        onclick: () => go("start", "version")}, v ? v.launcher : "?"),
      h("button.fe-chip.fe-hide-phone" + (ch.count ? ".good" : ""), {type: "button",
        title: ch.count ? "See what your changes do (Changes)" : "Nothing changed yet: see where to start",
        onclick: () => go(ch.count ? "changes" : "start", ch.count ? "" : "goals")},
        ch.count ? EZ.ui.plural(ch.count, "change") : "No changes"),
      ch.warn ? h("button.fe-chip.warn", {type: "button", title: "Changes that need a look",
        onclick: () => go("changes")}, "⚠ " + ch.warn) : null,
      stale ? h("button.fe-chip.warn", {type: "button", title: "Erazure has changed since you last saved: save again " +
        "to get the new version with your changes", onclick: () => go("start", "save")}, "Update: " + app.src.version)
        : h("span.fe-chip.plain.fe-hide-phone", {title: "The Erazure version this page builds"}, app.src.version),
      app.els.search || null,
      h("span.fe-bar-gap"),
      h("button.fe-btn.ghost.fe-hide-phone", {type: "button", onclick: () => EZ.store.undoStep(),
        disabled: !EZ.store.canUndo(), "aria-label": "Undo", title: "Undo (Ctrl+Z)"}, "↶"),
      h("button.fe-btn.ghost.fe-hide-phone", {type: "button", onclick: () => EZ.store.redoStep(),
        disabled: !EZ.store.canRedo(), "aria-label": "Redo", title: "Redo (Ctrl+Y)"}, "↷"),
      h("button.fe-btn.fe-pvbtn", {type: "button", onclick: togglePreview, "aria-pressed": String(previewShown()),
        "aria-controls": "fe-preview",
        title: previewShown() ? "Close the preview (more room for the area)" : "Show the preview"}, "Preview"),
      h("span.fe-row", {style: {gap: "0"}}, saveBtn, more));
  }

  /* A short fingerprint of a profile's changes: the last save keeps it, so the bar can tell that the game's file is
     behind (a change since), and an undo back to the saved changes clears that again. */
  function editsKey(p) {
    return EZ.core.crc32(new TextEncoder().encode(JSON.stringify(p.edits)));
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
      const said = a.title + (c.w ? `, ${c.w} need${c.w === 1 ? "s" : ""} a look` : c.n ? ", " + EZ.ui.plural(c.n, "change") : "");
      list.appendChild(h("li", h("button", {type: "button", "aria-current": a.id === app.area ? "page" : null,
        title: a.title, "aria-label": said, onclick: () => go(a.id)},
        h("span.ic", {"aria-hidden": "true"}, a.icon), h("span.lbl", a.title),
        c.w ? h("span.n.warn", {"aria-hidden": "true"}, "⚠" + c.w) : c.n ? h("span.n", {"aria-hidden": "true"}, String(c.n)) : null)));
    }
    // on a phone the areas menu is the way around: the preview opens from it too
    list.appendChild(h("li.fe-only-phone", h("button", {type: "button", onclick: () => {
      app.els.root.classList.remove("nav-open");
      togglePreview(true);
    }}, h("span.ic", {"aria-hidden": "true"}, "◧"), h("span.lbl", "Preview"))));
    fill(app.els.side, h("nav", {"aria-label": "Editor areas"}, list));
  }

  /* The control that had the focus, said so it can be found again after the area is drawn again (every change draws
     it anew): its kind, its words and its place among the controls with the same. */
  function focusKey(root) {
    const el = document.activeElement;
    if (!el || el === root || !root.contains(el)) return null;
    const sigOf = (x) => {
      const t = x.tagName, label = x.closest("label");
      const own = label ? [...label.childNodes].filter((n) => n !== x && !(n.contains && n.contains(x)))
        .map((n) => n.textContent).join(" ") : "";
      const words = x.getAttribute("aria-label") || (t === "BUTTON" || t === "SUMMARY" || t === "A" ? x.textContent : "") ||
        x.getAttribute("placeholder") || own || x.getAttribute("title") || "";
      return t + "|" + (x.type || "") + "|" + (x.name || "") + "|" + (t === "INPUT" && /radio|checkbox/.test(x.type) ?
        x.value : "") + "|" + words.replace(/\s+/g, " ").trim().slice(0, 80);
    };
    const sig = sigOf(el);
    const same = [...root.querySelectorAll(el.tagName)].filter((x) => sigOf(x) === sig);
    const at = {sig, n: same.indexOf(el), tag: el.tagName, sigOf};
    if (typeof el.selectionStart === "number" && /text|search|number|textarea/i.test(el.type || el.tagName)) {
      try { at.sel = [el.selectionStart, el.selectionEnd]; } catch (e) { /* a number field */ }
    }
    return at;
  }
  function refocus(root, at) {
    if (!at) return;
    const same = [...root.querySelectorAll(at.tag)].filter((x) => at.sigOf(x) === at.sig);
    const el = same[Math.min(at.n, same.length - 1)];
    if (!el) return;
    try { el.focus({preventScroll: true}); } catch (e) { el.focus(); }
    if (at.sel) { try { el.setSelectionRange(at.sel[0], at.sel[1]); } catch (e) { /* a number field */ } }
  }

  /* Draw the chosen area. A sub-section (app.sub: a link such as Alerts' "change them on Looks", or the address)
     is scrolled to by the area on this drawing only: later redraws (every change) leave the page where it is, and
     the control in use keeps the focus. */
  function drawArea() {
    const a = EZ.areas.find((x) => x.id === app.area) || EZ.areas[0];
    const box = app.els.area;
    const again = app.drawn === a.id;
    const at = again ? focusKey(box) : null;
    fill(box);
    try {
      a.render(box, app);
    } catch (e) {
      fill(box, h("p.fe-note.bad", "This area failed to draw: " + (e && e.message || e)));
      if (window.console) console.error(e);
    }
    app.drawn = a.id;
    app.sub = "";
    if (at) refocus(box, at);
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
  /* Open or close the preview (show: true opens it, false closes it, nothing switches it). */
  function togglePreview(show) {
    const root = app.els.root;
    const want = typeof show === "boolean" ? show : !previewShown();
    if (want === previewShown()) { if (want) focusPreview(); return; }
    if (narrow()) root.classList.toggle("pv-open", want);
    else {
      root.classList.toggle("pv-closed", !want);
      try { localStorage.setItem("erazure-filter-editor-pv", want ? "open" : "closed"); } catch (e) { /* this visit */ }
    }
    if (previewShown() && EZ.preview && EZ.preview.changed) EZ.preview.changed({}, app);  // catch up
    drawBar();
    syncDrawers();
    if (want && narrow()) focusPreview();
    else if (!want && narrow()) { const b = app.els.bar.querySelector(".fe-pvbtn"); if (b) b.focus(); }
  }
  function focusPreview() {
    const b = app.els.previewBox && app.els.previewBox.querySelector(".fe-pvclose");
    if (b && narrow()) b.focus({preventScroll: true});
  }

  /* The areas menu (a drawer on phones). */
  function toggleNav(open) {
    const root = app.els.root;
    const want = typeof open === "boolean" ? open : !root.classList.contains("nav-open");
    root.classList.toggle("nav-open", want);
    syncDrawers();
    const btn = app.els.bar.querySelector(".fe-navbtn");
    if (btn) btn.setAttribute("aria-expanded", String(want));
    if (want) {
      const first = app.els.side.querySelector("button[aria-current]") || app.els.side.querySelector("button");
      if (first) first.focus();
    } else if (btn) btn.focus();
  }

  /* A drawer that is closed is out of reach of the Tab key and of screen readers (inert); one that is open shows. */
  function syncDrawers() {
    const root = app.els.root;
    if (!root || !app.els.side) return;
    const phone = isPhone(), nar = narrow();
    app.els.side.inert = phone && !root.classList.contains("nav-open");
    if (app.els.previewBox) app.els.previewBox.inert = nar && !root.classList.contains("pv-open");
  }

  function redraw() {
    drawBar();
    drawSide();
    drawArea();
  }

  function frame(root) {
    const bar = h("header.fe-bar");
    const side = h("aside.fe-side", {id: "fe-side"});
    // the editor's own part of the page: a region (on the website the page around it has its own main)
    const area = h("section.fe-area", {tabindex: "-1", role: "region", "aria-label": "Editor"});
    const preview = h("aside.fe-preview", {id: "fe-preview", "aria-label": "Preview"});
    const grip = h("div.fe-grip", {title: "Drag to make the preview wider or narrower", "aria-hidden": "true"});
    fill(root, bar, side, area, preview);
    preview.appendChild(grip);
    // the close button stays in view while the preview scrolls (a phone's drawer has no other way out)
    preview.appendChild(h("div.fe-pvclose-at", h("button.fe-btn.small.fe-pvclose", {type: "button",
      onclick: () => togglePreview(false), title: "Close the preview (more room for the area)"}, "Close preview ✕")));
    preview.appendChild(h("button.fe-pvtab", {type: "button", onclick: () => togglePreview(true), title: "Show the preview"},
      "◂ Preview"));
    const inner = h("div.fe-preview-inner");
    preview.appendChild(inner);
    let pv = null;
    try { pv = localStorage.getItem("erazure-filter-editor-pv"); } catch (e) { /* the default */ }
    if (pv === "closed" || (pv === null && window.innerWidth < 1400)) root.classList.add("pv-closed");
    Object.assign(app.els, {root, bar, side, area, preview: inner, previewBox: preview, grip});
    // the bar's own height (it wraps on narrow screens): the sidebar, the drawers and the sticky parts sit under it
    if (window.ResizeObserver) {
      new ResizeObserver(() => {
        const px = Math.round(bar.getBoundingClientRect().height) + "px";
        root.style.setProperty("--bar", px);
        // the website's own "Back to top" button sits under it (website/docs/editor.md)
        document.documentElement.style.setProperty("--fe-bar", px);
      }).observe(bar);
    }
    for (const q of ["(max-width: 640px)", "(max-width: 1000px)"]) {
      const m = window.matchMedia(q);
      const on = () => { syncDrawers(); drawBar(); };
      if (m.addEventListener) m.addEventListener("change", on); else if (m.addListener) m.addListener(on);
    }
    // a tap beside the open areas menu closes it
    document.addEventListener("pointerdown", (e) => {
      if (!root.classList.contains("nav-open") || side.contains(e.target)) return;
      const btn = bar.querySelector(".fe-navbtn");
      if (btn && btn.contains(e.target)) return;
      toggleNav(false);
    });
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
    if (e.key === "Escape" && !document.querySelector(".edit-map .fe-dialog-back, .edit-map .fe-menu")) {
      const root = app.els.root;
      if (root.classList.contains("nav-open")) { e.preventDefault(); toggleNav(false); return; }
      if (narrow() && root.classList.contains("pv-open")) { e.preventDefault(); togglePreview(false); return; }
    }
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
    syncDrawers();
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

  /* Show an item in the preview (Changes' rows, a scene's alerts): the preview opens at any width, at the filter level
     given (the table's). */
  function showInPreview(spec, level) {
    const P = EZ.preview;
    if (!P || !P.state) return;
    P.state.spec = Object.assign({}, spec);
    P.state.mode = "item";
    if (typeof level === "number") P.state.filtlvl = level;
    if (P.saveState) P.saveState();
    if (previewShown()) P.changed({}, app);
    else togglePreview(true);
  }

  Object.assign(app, {start, go, redraw, drawBar, drawSide, drawArea, drawPreview, variant, variantFor, toggleName,
                      versionLines, advancedNote, lineRef, lineLink, togglePreview, previewShown, showInPreview,
                      changes, build, withBuild, download, saveToGame, checked, canSaveInPlace, forgetFolder, fileName,
                      renamedNote, isPhone, STYLE_NAMES, saveMenu: [], checks: []});
  return app;
})();
