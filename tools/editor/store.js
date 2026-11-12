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

  function newProfile(name) {
    const id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return {id, name: name || "My Erazure", file: "Erazure-Custom", edits: newEdits(), saved: null,
            created: Date.now(), changed: Date.now()};
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

  function addProfile(name, edits) {
    const p = newProfile(name);
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

  /* A snapshot of a profile's edits in its history (the last HISTORY_MAX saves), newest first. */
  async function remember(p, why) {
    const key = "history:" + p.id;
    const list = (await kvGet(key)) || [];
    const edits = JSON.stringify(p.edits);
    if (list.length && list[0].edits === edits) return;
    list.unshift({at: Date.now(), why: why || "", edits});
    await kvSet(key, list.slice(0, HISTORY_MAX));
  }

  async function history(p) { return (await kvGet("history:" + p.id)) || []; }

  return {load, save, current, profiles, change, changeProfile, undoStep, redoStep, canUndo, canRedo, switchTo,
          addProfile, removeProfile, on, normalize, newEdits, storageOk, kvGet, kvSet, remember, history, SCHEMA};
})();
