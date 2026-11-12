/* The Filter Editor's storage: the player's profiles (each an edit set: what they changed, never a filter file) in
   localStorage, undo / redo for this visit, a persistent history and the game folder's handle in IndexedDB. Every read
   and write is guarded: a private window or blocked storage keeps the editor working for the visit, and says so. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.store = (function () {
  "use strict";
  const KEY = "erazure-filter-editor";
  const SCHEMA = 1;
  const UNDO_MAX = 100;
  const HISTORY_MAX = 30;

  function newEdits() {
    return {v: SCHEMA, base: {style: "erazure", revealed: false, bigGG: false, poe: false}};
  }

  function newProfile(name, file) {
    const id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return {id, name: name || "My Erazure", file: file || "Erazure-Custom", edits: newEdits(), saved: null,
            created: Date.now(), changed: Date.now()};
  }

  /* A file name from a profile's name ("Barbarian" -> "Erazure-Barbarian"), and one no other profile saves to. */
  const fileFrom = (name) => "Erazure-" + (String(name || "").replace(/[^A-Za-z0-9 _-]+/g, " ").trim()
    .replace(/\s+/g, "-").slice(0, 40) || "Custom");
  function freeFile(want, except) {
    const used = new Set(Object.values(data.profiles).filter((p) => p.id !== except).map((p) => String(p.file || "").toLowerCase()));
    let f = want, n = 2;
    while (used.has(f.toLowerCase())) f = want + "-" + n++;
    return f;
  }
  function freeName(want) {
    const used = new Set(Object.values(data.profiles).map((p) => p.name));
    let s = want, n = 2;
    while (used.has(s)) s = want + " (" + n++ + ")";
    return s;
  }
  /* The profiles that save to the same file as another: [[name, name...]] per shared file. */
  function sharedFiles() {
    const by = new Map();
    for (const p of profiles()) {
      const k = String(p.file || "Erazure-Custom").toLowerCase();
      by.set(k, (by.get(k) || []).concat([p]));
    }
    return [...by.values()].filter((list) => list.length > 1);
  }

  let data = null, okToSave = true, warned = false;
  const undo = [], redo = [];
  const listeners = new Set();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      okToSave = false;
    }
    if (!data || typeof data !== "object" || data.v !== SCHEMA || !data.profiles) {
      const p = newProfile();
      data = {v: SCHEMA, current: p.id, order: [p.id], profiles: {[p.id]: p}};
    }
    for (const id of Object.keys(data.profiles)) normalize(data.profiles[id]);
    if (!data.profiles[data.current]) data.current = data.order[0];
    return data;
  }

  /* An edit set read back from storage, a file or a link: every field the editor reads, of the right kind. */
  function normalize(p) {
    const e = p.edits && typeof p.edits === "object" ? p.edits : newEdits();
    const b = e.base && typeof e.base === "object" ? e.base : {};
    e.v = SCHEMA;
    e.base = {style: ["erazure", "minimal", "corrlorized"].includes(b.style) ? b.style : "erazure",
              revealed: !!b.revealed, bigGG: !!b.bigGG, poe: !!b.poe};
    if (e.ops !== undefined) {  // changes to Erazure's rules: a list of objects (EZ.ops checks each one's fields)
      const list = Array.isArray(e.ops) ? e.ops.filter((o) => o && typeof o === "object" && !Array.isArray(o) &&
        o.at && typeof o.at === "object" && typeof o.at.text === "string").slice(0, 5000) : [];
      if (list.length) e.ops = list; else delete e.ops;
    }
    if (e.items !== undefined) {  // item overrides: a list of objects (EZ.overrides checks each one's fields)
      const list = Array.isArray(e.items) ? e.items.filter((o) => o && typeof o === "object" && !Array.isArray(o) &&
        o.scope && typeof o.scope === "object" && Array.isArray(o.scope.codes)).slice(0, 2000) : [];
      if (list.length) e.items = list; else delete e.items;
    }
    if (e.maps !== undefined && (!e.maps || typeof e.maps !== "object" || Array.isArray(e.maps))) delete e.maps;
    if (e.wishlists !== undefined && !Array.isArray(e.wishlists)) delete e.wishlists;
    if (e.volume !== undefined && (!e.volume || typeof e.volume !== "object" || Array.isArray(e.volume))) delete e.volume;
    if (e.rules !== undefined) {  // My rules: two blocks of text (a link or file could hold anything)
      const r = e.rules && typeof e.rules === "object" ? e.rules : {}, keep = {};
      for (const k of ["top", "bottom"]) if (typeof r[k] === "string" && r[k].trim()) keep[k] = r[k].slice(0, 400000);
      if (Object.keys(keep).length) e.rules = keep; else delete e.rules;
    }
    p.edits = e;
    p.name = typeof p.name === "string" && p.name.trim() ? p.name.slice(0, 60) : "My Erazure";
    p.file = typeof p.file === "string" ? p.file : "Erazure-Custom";
    return p;
  }

  function save() {
    if (!okToSave) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      okToSave = false;
      if (!warned) {
        warned = true;
        EZ.ui.toast("This browser won't keep your changes (a private window or blocked storage). Use Save changes " +
                    "to a file before you leave.", "bad", {sticky: true});
      }
      return false;
    }
  }

  function current() { return data.profiles[data.current]; }
  function profiles() { return data.order.map((id) => data.profiles[id]).filter(Boolean); }
  function storageOk() { return okToSave; }

  /* Change the current profile's edits: fn(edits) changes them in place. One undo step per call. */
  function change(fn, opts) {
    const p = current();
    const before = JSON.stringify(p.edits);
    fn(p.edits);
    const after = JSON.stringify(p.edits);
    if (after === before) return false;
    if (!(opts && opts.noUndo)) {
      undo.push({id: p.id, edits: before});
      if (undo.length > UNDO_MAX) undo.shift();
      redo.length = 0;
    }
    p.changed = Date.now();
    save();
    emit({what: "edits", label: opts && opts.label, quiet: !!(opts && opts.quiet)});
    return true;
  }

  /* Change the current profile's own fields (name, file, saved); opts.quiet: the area isn't drawn again. */
  function changeProfile(fn, opts) {
    fn(current());
    current().changed = Date.now();
    save();
    emit({what: "profile", quiet: !!(opts && opts.quiet)});
  }

  function step(from, to) {
    const p = current();
    for (let i = from.length - 1; i >= 0; i--) {
      if (from[i].id !== p.id) continue;
      const s = from.splice(i, 1)[0];
      to.push({id: p.id, edits: JSON.stringify(p.edits)});
      p.edits = normalize({edits: JSON.parse(s.edits)}).edits;
      p.changed = Date.now();
      save();
      emit({what: "edits", undo: true});
      return true;
    }
    return false;
  }

  const undoStep = () => step(undo, redo);
  const redoStep = () => step(redo, undo);
  const canUndo = () => undo.some((s) => s.id === data.current);
  const canRedo = () => redo.some((s) => s.id === data.current);

  function switchTo(id) {
    if (!data.profiles[id] || id === data.current) return;
    data.current = id;
    save();
    emit({what: "switch"});
  }

  function addProfile(name, edits, file) {
    const nm = freeName(name || "My Erazure");
    const p = newProfile(nm, freeFile(file || fileFrom(nm)));
    if (edits) p.edits = normalize({edits: JSON.parse(JSON.stringify(edits))}).edits;
    data.profiles[p.id] = p;
    data.order.push(p.id);
    data.current = p.id;
    save();
    emit({what: "switch"});
    return p;
  }

  function removeProfile(id) {
    if (data.order.length < 2) return false;
    delete data.profiles[id];
    data.order = data.order.filter((x) => x !== id);
    if (data.current === id) data.current = data.order[0];
    save();
    emit({what: "switch"});
    return true;
  }

  function on(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function emit(ev) { for (const fn of listeners) fn(ev); }

  /* Another tab of the editor saved (the browser's storage event): this tab takes its store, so neither overwrites the
     other's work with an old copy; this tab stays on its profile while it still exists. */
  function fromOtherTab(ev) {
    if (ev.key !== KEY || ev.newValue === null || !data) return;
    let next = null;
    try { next = JSON.parse(ev.newValue); } catch (e) { return; }
    if (!next || typeof next !== "object" || next.v !== SCHEMA || !next.profiles || !Array.isArray(next.order)) return;
    const cur = data.current;
    data = next;
    for (const id of Object.keys(data.profiles)) normalize(data.profiles[id]);
    if (data.profiles[cur]) data.current = cur;
    else if (!data.profiles[data.current]) data.current = data.order[0];
    emit({what: "switch", other: true});
  }
  if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("storage", fromOtherTab);

  /* IndexedDB: the game folder handles (File System Access) and the history snapshots. */
  let dbp = null;
  function db() {
    if (!dbp) {
      dbp = new Promise((resolve, reject) => {
        if (!("indexedDB" in window)) { reject(new Error("no IndexedDB")); return; }
        const req = indexedDB.open(KEY, 1);
        req.onupgradeneeded = () => {
          const d = req.result;
          if (!d.objectStoreNames.contains("kv")) d.createObjectStore("kv");
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbp;
  }

  async function kvGet(key) {
    try {
      const d = await db();
      return await new Promise((resolve, reject) => {
        const r = d.transaction("kv").objectStore("kv").get(key);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
    } catch (e) {
      return undefined;
    }
  }

  async function kvSet(key, value) {
    try {
      const d = await db();
      await new Promise((resolve, reject) => {
        const t = d.transaction("kv", "readwrite");
        if (value === undefined) t.objectStore("kv").delete(key);
        else t.objectStore("kv").put(value, key);
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /* A snapshot of a profile's edits in its history (the last HISTORY_MAX saves), newest first. The edits are read at
     once, so a change made right after the call (Clear, Restore, Import over) doesn't reach the snapshot. */
  async function remember(p, why) {
    const key = "history:" + p.id;
    const edits = JSON.stringify(p.edits);
    const list = (await kvGet(key)) || [];
    if (list.length && list[0].edits === edits) return;
    list.unshift({at: Date.now(), why: why || "", edits});
    await kvSet(key, list.slice(0, HISTORY_MAX));
  }

  async function history(p) { return (await kvGet("history:" + p.id)) || []; }

  /* Keep the current profile's changes in its history before something replaces them all (Clear, Restore, Import
     over): Undo lasts only while the page is open, the history stays. */
  function keepCopy(why) {
    const p = current();
    if (EZ.edits && EZ.edits.count && !EZ.edits.count(p.edits)) return Promise.resolve();
    return remember(p, why).catch(() => {});
  }

  return {load, save, current, profiles, change, changeProfile, undoStep, redoStep, canUndo, canRedo, switchTo,
          addProfile, removeProfile, on, normalize, newEdits, storageOk, kvGet, kvSet, remember, history, keepCopy,
          sharedFiles, freeFile, fileFrom, SCHEMA};
})();
