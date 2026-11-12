/* Taking edits in and out of the editor: export a profile's changes as a file, a share link, or the EDITS lines of a
   saved filter; import any of them (as a new profile or over the current one). Everything read is untrusted: parsed
   as data, size-capped, normalized, never put into the page as HTML. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.share = (function () {
  "use strict";
  const {h, toast, dialog} = EZ.ui;
  const LINK_KEY = "e=";
  const DISCORD = 2000;

  function payload(p) {
    return {app: "erazure-filter-editor", v: EZ.store.SCHEMA, name: p.name, file: p.file, edits: p.edits};
  }

  function exportFile(app) {
    const p = EZ.store.current();
    const text = JSON.stringify(payload(p), null, 1);
    const url = URL.createObjectURL(new Blob([text], {type: "application/json"}));
    const a = h("a", {href: url, download: app.fileName(p).replace(/\.filter$/, "") + "-changes.json"});
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    toast("Backed up your changes as a file. It isn't a filter: import it on this page (any browser) to get them back.",
      "good", {ms: 8000});
  }

  async function link() {
    const data = await EZ.edits.pack(payload(EZ.store.current()));
    return location.href.replace(/#.*$/, "") + "#" + LINK_KEY + data;
  }

  async function copyLink() {
    const url = await link();
    let copied = false;
    try { await navigator.clipboard.writeText(url); copied = true; } catch (e) { /* show it instead */ }
    const long = url.length > DISCORD;
    dialog({title: "Share your changes", body: [
      h("p", copied ? "The link is copied. Anyone who opens it can load your changes into their editor."
                    : "Copy this link. Anyone who opens it can load your changes into their editor."),
      h("textarea", {readonly: true, rows: 4, onfocus: (e) => e.target.select()}, url),
      long ? h("p.fe-note.warn", `The link is ${url.length.toLocaleString()} characters: too long for one Discord ` +
        "message (2,000). Share your changes as a file instead (Back up my changes).") : null,
    ]});
  }

  /* Read an import: a saved filter (its EDITS lines), a changes file or a link. Resolves {name, file, edits} or
     throws with a message for the player. */
  async function read(text) {
    text = String(text || "").trim();
    if (!text) throw new Error("There's nothing to import.");
    if (text.length > 8 << 20) throw new Error("That's too big to be a filter or a backup of your changes.");
    let data = null;
    const at = text.indexOf("#" + LINK_KEY);
    if (at >= 0 || /^[jz][A-Za-z0-9_-]+$/.test(text)) {
      data = await EZ.edits.unpack(at >= 0 ? text.slice(at + 1 + LINK_KEY.length) : text);
    } else if (text[0] === "{") {
      data = JSON.parse(text);
    } else {
      data = await EZ.edits.fromFile(text);
      if (!data) {
        throw new Error("This file has no Filter Editor changes in it: it wasn't saved by this page, or the lines at " +
                        "its top that hold the changes were taken out by hand.");
      }
    }
    if (!data || typeof data !== "object" || data.app !== "erazure-filter-editor" || !data.edits) {
      throw new Error("That isn't a set of Filter Editor changes.");
    }
    if ((data.v || 0) > EZ.store.SCHEMA) {
      throw new Error("These changes come from a newer editor: reload the page and try again.");
    }
    const p = EZ.store.normalize({name: data.name, file: data.file, edits: data.edits});
    return {name: p.name, file: p.file, edits: p.edits};
  }

  /* Ask where the imported edits go, then put them there. */
  function offer(imported, source) {
    const n = EZ.edits.count(imported.edits);
    dialog({title: "Import changes", body: [
      h("p", h("b", imported.name), ` (${n} change${n === 1 ? "" : "s"}) ` + (source || "") + "."),
      h("p.fe-sub", "As a new profile keeps your own changes as they are (it gets a file of its own); over yours " +
        "replaces your current profile's changes (History keeps a copy of yours, and Undo brings them back while this " +
        "page is open)."),
    ], buttons: [
      {text: "Cancel"},
      {text: "Over my current profile", onclick: () => {
        EZ.store.keepCopy("before importing over it").then(() => {
          EZ.store.change((e) => {
            for (const k of Object.keys(e)) delete e[k];
            Object.assign(e, JSON.parse(JSON.stringify(imported.edits)));
          }, {label: "import"});
          toast("Imported over your current profile.", "good");
        });
      }},
      {text: "As a new profile", primary: true, onclick: () => {
        const p = EZ.store.addProfile(imported.name, imported.edits,
          imported.file && imported.file !== "Erazure-Custom" ? imported.file : null);
        toast(`Imported as the profile ${p.name}, saving to ${p.file}.filter.`, "good");
      }},
    ]});
  }

  async function importText(text, source) {
    try {
      offer(await read(text), source);
    } catch (e) {
      toast(e.message || String(e), "bad", {sticky: true});
    }
  }

  function importFile() {
    const input = h("input", {type: "file", accept: ".filter,.json,.txt", style: {display: "none"}});
    input.addEventListener("change", async () => {
      const f = input.files && input.files[0];
      input.remove();
      if (!f) return;
      if (f.size > 8 << 20) { toast("That file is too big to be a filter or a backup of your changes.", "bad"); return; }
      importText(await f.text(), "from " + f.name);
    });
    document.body.appendChild(input);
    input.click();
  }

  function importPaste() {
    const area = h("textarea", {rows: 6, placeholder: "Paste a share link, or the text of a backup"});
    dialog({title: "Import changes", body: [h("p.fe-sub", "Paste a share link, or the text of a backup of your changes (its .json file)."), area],
      buttons: [{text: "Cancel"}, {text: "Import", primary: true, onclick: () => { importText(area.value, "pasted"); }}]});
  }

  /* A share link opened: offer its changes (once), then take it out of the address. */
  async function fromLocation() {
    const m = /#e=([jz][A-Za-z0-9_-]+)/.exec(location.hash || "");
    if (!m) return false;
    try { history.replaceState(null, "", location.href.replace(/#.*$/, "") + "#start"); } catch (e) { /* file: */ }
    await importText(m[1], "from a share link");
    return true;
  }

  return {exportFile, copyLink, read, offer, importText, importFile, importPaste, fromLocation, link};
})();
