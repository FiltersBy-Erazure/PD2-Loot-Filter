/* Alerts: what a drop does besides its label (the chat line, the drop sound and the minimap icon). Global switches,
   and every drop sound Erazure plays with what plays it, each one swappable or silenced. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.areas = EZ.areas || [];
EZ.sounds = (function () {
  "use strict";
  const {h, dialog} = EZ.ui;

  function name(data, id) {
    const n = data.sounds && data.sounds[String(id)];
    return n ? n : "sound " + id;
  }

  /* A play button when the editor has the sound's clip (the assets: EZ.sound), else the game's own test command. */
  function play(data, id) {
    if (EZ.sound) return EZ.sound.button(id, name(data, id));
    return h("span.fe-sub", {title: "Type this in the game's chat to hear it"}, `.playsound ${id}`);
  }

  /* A dialog to pick a sound: Erazure's own, PD2's PoE ones, or any by name or number. onpick(id) (0: no sound). */
  function pick(app, used, current, onpick) {
    const data = app.data;
    const search = h("input", {type: "search", placeholder: "Search sounds by name or number", "aria-label": "Search",
      style: {width: "100%"}});
    const list = h("div.fe-soundlist", {role: "listbox"});
    const all = Object.keys(data.sounds || {}).map((k) => +k);
    const row = (id, close) => h("div.fe-soundrow" + (id === current ? ".on" : ""),
      h("button.fe-btn.small", {type: "button", onclick: () => { close(); onpick(id); }}, "Pick"),
      h("span", h("b", name(data, id)), h("span.fe-sub", " #" + id)), play(data, id));
    let closeIt = null;
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      EZ.ui.clear(list);
      const groups = q ? [["Matches", all.filter((id) => String(id) === q || name(data, id).toLowerCase().indexOf(q) >= 0)
        .slice(0, 300)]] : [["Erazure's drop sounds", used], ["PD2's Path of Exile drop sounds", data.poeSounds || []]];
      for (const [title, ids] of groups) {
        if (!ids.length) continue;
        list.appendChild(h("h4", title));
        for (const id of ids) list.appendChild(row(id, closeIt));
      }
      if (q && !list.children.length) list.appendChild(h("p.fe-sub", "No sound matches."));
    };
    search.addEventListener("input", draw);
    closeIt = dialog({title: "Pick a drop sound", body: [
      h("p.fe-sub", "Some of the game's sounds never play as drop sounds (looping ones and music)."),
      search, list],
      buttons: [{text: "No sound", onclick: () => onpick(0)}, {text: "Cancel"}]});
    draw();
  }

  return {name, play, pick};
})();

EZ.areas.push({
  id: "alerts", title: "Alerts", icon: "♪", order: 50, group: "b",
  count: (e) => EZ.edits.countArea("alerts", e) + EZ.edits.countArea("volume", e),
  render(box, app) {
    const {h, toggle, seg} = EZ.ui;
    const F = EZ.filter, S = EZ.sounds;
    const e = EZ.store.current().edits;
    const a = e.alerts || {};
    const lines = app.versionLines();
    const notes = F.notifications(lines);
    const set = (k, v) => EZ.store.change((ed) => {
      ed.alerts = ed.alerts || {};
      if (v) ed.alerts[k] = v; else delete ed.alerts[k];
    }, {label: k});

    const globals = h("section.fe-card",
      h("h3", "Everywhere at once"),
      h("div.fe-stack",
        toggle("No drop sounds", !!a.noSounds, (v) => set("noSounds", v),
          {sub: "Every drop is silent; chat lines and icons stay."}),
        toggle("Icons only: no chat lines or sounds", !!a.iconsOnly, (v) => set("iconsOnly", v),
          {sub: "In BH the chat line and the sound come together: this keeps only the minimap icons."}),
        toggle("No minimap icons", !!a.noIcons, (v) => set("noIcons", v),
          {sub: "An item that only had an icon also loses its chat line (BH needs an icon or a sound to notify)."}),
        h("div.fe-row", h("span", "Icon size"), seg([{value: "", text: "Erazure's"}, {value: "smaller", text: "Smaller"},
          {value: "bigger", text: "Bigger"}], a.iconSize || "", (v) => set("iconSize", v), {label: "Icon size"}))));

    /* ---- how loud each kind of drop is (EZ.volume) */
    const vol = e.volume || {};
    const kinds = EZ.volume.kinds(app.src, lines);
    const setVol = (id, v) => EZ.store.change((ed) => {
      ed.volume = ed.volume || {};
      if (v) ed.volume[id] = v; else delete ed.volume[id];
      if (!Object.keys(ed.volume).length) delete ed.volume;
    }, {label: "how loud"});
    const LOUD = ["uni-high", "set-high", "runes"];
    const volumeCard = h("section.fe-card", {id: "fe-volume"},
      h("h3", "How loud each kind of drop is"),
      h("p.fe-sub", "Every rule of Erazure's that alerts belongs to one kind: the unique and set tiers by their look, " +
        "the rest by what the rule is for. Quieten a kind and every drop whose alert it decides follows."),
      h("div.fe-row.fe-small", {style: {marginBottom: ".5em"}},
        h("button.fe-btn.small", {type: "button", onclick: () => EZ.store.change((ed) => {
          ed.volume = {};
          for (const k of kinds) if (LOUD.indexOf(k.id) < 0) ed.volume[k.id] = "mute";
        }, {label: "how loud"})}, "Sounds only for High value uniques and sets, and runes"),
        Object.keys(vol).length ? h("button.fe-btn.ghost.small", {type: "button", onclick: () => EZ.store.change((ed) => {
          delete ed.volume;
        }, {label: "how loud"})}, "↺ Erazure's for every kind") : null),
      h("div.fe-tablewrap", h("table.fe-levels", h("tbody", kinds.map((k) => h("tr" + (vol[k.id] ? ".is-changed" : ""),
        h("td", k.title, h("span.fe-sub", ` · ${k.rules} rule${k.rules === 1 ? "" : "s"}`)),
        h("td", h("select", {"aria-label": k.title, onchange: (ev) => setVol(k.id, ev.target.value)},
          [["", "Erazure's"], ["mute", "No sound"], ["iconOnly", "Icon only (no chat line, no sound)"],
           ["none", "No alerts"]].map(([v, t]) => h("option", {value: v, selected: (vol[k.id] || "") === v}, t))))))))));

    const swaps = e.sounds || {};
    const used = Object.keys(notes.sounds).map((k) => +k).sort((x, y) => notes.sounds[y].length - notes.sounds[x].length);
    const soundRow = (id) => {
      const ruleIdx = notes.sounds[id];
      const poe = ruleIdx.filter((i) => /(^|[\s(])POE_SOUNDS\b/.test(F.rule(lines[i]).cond)).length;
      const where = ruleIdx.slice(0, 3).map((i) => {
        const r = F.rule(lines[i]);
        return r.comment.replace(/^\/\/\s*/, "").trim() || r.cond.replace(/!?POE_SOUNDS\s*/, "").slice(0, 50);
      }).filter(Boolean);
      const to = id in swaps ? +swaps[id] : id;
      const btn = h("button.fe-btn.small", {type: "button", onclick: () => S.pick(app, used, to, (picked) =>
        EZ.store.change((ed) => {
          ed.sounds = ed.sounds || {};
          if (picked === id) delete ed.sounds[id]; else ed.sounds[id] = picked;
        }, {label: "sound"}))}, "Change");
      return h("div.fe-soundrow" + (id in swaps ? ".is-changed" : ""),
        h("div.fe-soundmain",
          h("div", h("b", S.name(app.data, id)), h("span.fe-sub", " #" + id), " ", S.play(app.data, id)),
          h("div.fe-sub", `${ruleIdx.length} rule${ruleIdx.length === 1 ? "" : "s"}` +
            (poe === ruleIdx.length ? " · PoE versions" : poe ? "" : " · non-PoE versions") +
            (where.length ? " · " + where.join(" · ") : ""))),
        id in swaps ? h("div.fe-soundto", "→ ", to ? h("b", S.name(app.data, to)) : h("b", "no sound"),
          to ? S.play(app.data, to) : null) : null,
        h("div.fe-row.fe-small", btn,
          id in swaps ? h("button.fe-btn.ghost.small", {type: "button", onclick: () => EZ.store.change((ed) => {
            delete ed.sounds[id];
          })}, "↺ Erazure's") : h("button.fe-btn.ghost.small", {type: "button", onclick: () =>
            EZ.store.change((ed) => { ed.sounds = ed.sounds || {}; ed.sounds[id] = 0; })}, "Silence")));
    };
    const soundsCard = h("section.fe-card", {id: "fe-sounds"},
      h("h3", "Drop sounds"),
      h("p.fe-sub", "Every sound Erazure plays, most used first. The PoE versions play their own picks: switch your " +
        "version's Path of Exile sounds on Start to hear those."),
      h("div.fe-soundlist", used.map(soundRow)));

    box.append(
      h("div.fe-area-head", h("div", h("h2", "Alerts"),
        h("p.fe-sub", "What a drop does besides its label: its chat line, its sound and its minimap icon."))),
      globals, volumeCard, soundsCard,
      h("p.fe-note", "Minimap icons: change them on ", h("a", {href: "#looks/icons", onclick: (ev) => {
        ev.preventDefault(); app.go("looks", "icons");
      }}, "Looks"), ". A single item's alerts: on ", h("a", {href: "#items", onclick: (ev) => {
        ev.preventDefault(); app.go("items");
      }}, "Items"), "."));
  },
});
