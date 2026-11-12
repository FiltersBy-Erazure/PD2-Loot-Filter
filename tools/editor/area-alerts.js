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
    const silent = new Set(data.silentSounds || []);
    const row = (id, close) => h("div.fe-soundrow" + (id === current ? ".on" : ""),
      h("button.fe-btn.small", {type: "button", "aria-label": "Pick " + name(data, id), onclick: () => { close(); onpick(id); }},
        "Pick"),
      h("span", h("b", name(data, id)), h("span.fe-sub", " #" + id),
        silent.has(id) ? h("span.fe-pill.warn", {style: {marginLeft: ".4em"}}, "silent: no sound file") : null),
      silent.has(id) ? null : play(data, id));
    let closeIt = null;
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      EZ.ui.clear(list);
      const poe = data.poeSounds || [];
      const groups = q ? [["Matches", all.filter((id) => String(id) === q || name(data, id).toLowerCase().indexOf(q) >= 0)
        .slice(0, 300)]] : [["Erazure's drop sounds", used.filter((id) => poe.indexOf(id) < 0)],
                            ["PD2's Path of Exile drop sounds", poe]];
      for (const [title, ids] of groups) {
        if (!ids.length) continue;
        list.appendChild(h("h4", title));
        for (const id of ids) list.appendChild(row(id, closeIt));
      }
      if (q && !list.children.length) list.appendChild(h("p.fe-sub", "No sound matches."));
    };
    search.addEventListener("input", draw);
    closeIt = dialog({title: "Pick a drop sound", body: [
      h("p.fe-sub", "Some of the game's sounds never play as drop sounds: looping ones and music, and the ones marked " +
        "silent (they have no sound file)."),
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
          {sub: "In the game the chat line and the sound come together: this keeps only the minimap icons."}),
        toggle("No minimap icons", !!a.noIcons, (v) => set("noIcons", v),
          {sub: "An item that only had an icon also loses its chat line (the game sends a chat line only with an " +
                "icon or a sound)."}),
        h("div", h("div.fe-row", h("span", "Icon size"), seg([{value: "", text: "Erazure's default"},
          {value: "smaller", text: "Smaller"}, {value: "bigger", text: "Bigger"}], a.iconSize || "",
          (v) => set("iconSize", v), {label: "Icon size"})),
          h("p.fe-sub.fe-small", {style: {margin: ".3em 0 0"}}, a.iconSize === "smaller" ? "Smaller: every box of an " +
            "icon moves one size in (an icon of the center pixel alone stays as it is)." : a.iconSize === "bigger" ?
            "Bigger: an icon without the outer box gets one in its own color; the biggest icons (High value drops) " +
            "already have it." : "Smaller moves every box of an icon one size in; Bigger gives the icons without " +
            "one the outer box. Looks draws the icons at the size picked here."))));

    /* ---- how loud each kind of drop is (EZ.volume) */
    const vol = e.volume || {};
    const kinds = EZ.volume.kinds(app.src, lines);
    const setVol = (id, v) => EZ.store.change((ed) => {
      ed.volume = ed.volume || {};
      if (v) ed.volume[id] = v; else delete ed.volume[id];
      if (!Object.keys(ed.volume).length) delete ed.volume;
    }, {label: "how loud"});
    const own = Object.keys(vol).filter((k) => EZ.volume.MODES.indexOf(vol[k]) >= 0).length;
    /* a kind's rules said as the items they are for: "Lem Rune, Pul Rune" (the words of its first rules) */
    const examples = (k) => {
      const out = [];
      for (const i of k.lines) {
        const r = F.rule(lines[i]);
        const c = r.comment.replace(/^\/\/\s*/, "").trim();
        const w = EZ.words.forWhat(r.cond, c, 2);
        if (w && out.indexOf(w) < 0) out.push(w);
        if (out.length >= 3) break;
      }
      return out;
    };
    const volumeCard = h("section.fe-card", {id: "fe-volume"},
      h("h3", "How loud each kind of drop is"),
      h("p.fe-sub", "Every alert of Erazure's belongs to one kind: unique and set items by their value tier, the rest " +
        "by what they are. Quieten a kind and every drop of that kind follows."),
      h("div.fe-row.fe-small", {style: {marginBottom: ".5em"}},
        h("button.fe-btn.small", {type: "button", onclick: () => {
          const changed = EZ.store.change((ed) => {
            ed.volume = EZ.volume.fewer(app.src, lines, ed.volume);
          }, {label: "how loud"});
          if (changed) {
            EZ.ui.undoToast("Every kind but High value uniques and sets, and runes, has no sound now (your own " +
              "choices stayed).");
          }
        }}, "Sounds only for High value uniques and sets, and runes"),
        own ? h("button.fe-btn.ghost.small", {type: "button", onclick: () => {
          EZ.store.change((ed) => { delete ed.volume; }, {label: "how loud"});
          EZ.ui.undoToast(`Every kind is as Erazure has it again (${own} choice${own === 1 ? "" : "s"} of yours went).`);
        }}, "↺ Erazure's default for every kind") : null),
      h("div.fe-tablewrap", h("table.fe-levels", h("tbody", kinds.map((k) => {
        const ex = examples(k);
        return h("tr" + (vol[k.id] ? ".is-changed" : ""),
          h("td", h("div", k.title), k.sub || ex.length ? h("div.fe-sub.fe-small", k.sub ? k.sub :
            "such as " + ex.join("; ")) : null),
          h("td", h("select", {"aria-label": k.title, onchange: (ev) => setVol(k.id, ev.target.value)},
            [["", "Erazure's default"], ["mute", "No sound"], ["iconOnly", "Icon only (no chat line, no sound)"],
             ["none", "No alerts"]].map(([v, t]) => h("option", {value: v, selected: (vol[k.id] || "") === v}, t)))));
      })))));

    const swaps = e.sounds || {};
    const used = Object.keys(notes.sounds).map((k) => +k).sort((x, y) => notes.sounds[y].length - notes.sounds[x].length);
    /* Does a rule play in the player's version? Its POE_SOUNDS test against the version's Path of Exile sounds. */
    const poeOn = !!(e.base.poe || e.base.style === "corrlorized");
    const playsHere = (i) => {
      const c = F.rule(lines[i]).cond;
      if (/!POE_SOUNDS\b/.test(c)) return !poeOn;
      if (/(^|[\s(])POE_SOUNDS\b/.test(c)) return poeOn;
      return true;
    };
    const soundRow = (id) => {
      const ruleIdx = notes.sounds[id].filter(playsHere).concat(notes.sounds[id].filter((i) => !playsHere(i)));
      const where = [];
      for (const i of ruleIdx) {
        const r = F.rule(lines[i]);
        const c = r.comment.replace(/^\/\/\s*/, "").trim();
        const w = EZ.words.forWhat(r.cond, c, 2);
        if (w && where.indexOf(w) < 0) where.push(w);
        if (where.length >= 3) break;
      }
      const to = id in swaps ? +swaps[id] : id;
      const btn = h("button.fe-btn.small", {type: "button", "aria-label": "Change the sound " + S.name(app.data, id),
        onclick: () => S.pick(app, used, to, (picked) =>
        EZ.store.change((ed) => {
          ed.sounds = ed.sounds || {};
          if (picked === id) delete ed.sounds[id]; else ed.sounds[id] = picked;
        }, {label: "sound"}))}, "Change");
      const more = notes.sounds[id].length - where.length;
      return h("div.fe-soundrow" + (id in swaps ? ".is-changed" : ""),
        h("div.fe-soundmain",
          h("div", h("b", S.name(app.data, id)), h("span.fe-sub", " #" + id), " ", S.play(app.data, id)),
          h("div.fe-sub", where.length ? "For " + where.join("; ") + (more > 0 ? "; and more" : "") : "")),
        id in swaps ? h("div.fe-soundto", "→ ", to ? h("b", S.name(app.data, to)) : h("b", "no sound"),
          to ? S.play(app.data, to) : null) : null,
        h("div.fe-row.fe-small", btn,
          id in swaps ? h("button.fe-btn.ghost.small", {type: "button", "aria-label": "Erazure's default for the sound " +
            S.name(app.data, id), onclick: () => EZ.store.change((ed) => {
            delete ed.sounds[id];
          })}, "↺ Erazure's default") : h("button.fe-btn.ghost.small", {type: "button", "aria-label": "Silence the " +
            "sound " + S.name(app.data, id), onclick: () =>
            EZ.store.change((ed) => { ed.sounds = ed.sounds || {}; ed.sounds[id] = 0; })}, "Silence")));
    };
    const here = used.filter((id) => notes.sounds[id].some(playsHere));
    const elsewhere = used.filter((id) => !notes.sounds[id].some(playsHere));
    const soundsCard = h("section.fe-card", {id: "fe-sounds"},
      h("h3", "Drop sounds"),
      h("p.fe-sub", "Every sound your version plays, most used first" + (poeOn ? " (with Path of Exile sounds)." :
        " (without Path of Exile sounds: switch them on in Your version on Start to hear those).") + " ▶ plays one " +
        "here; in game, type .playsound and its number (#) in the chat to hear it."),
      h("div.fe-soundlist", here.map(soundRow)),
      elsewhere.length ? h("details.fe-rules", h("summary", `Sounds your version doesn't play (${elsewhere.length}: ` +
        (poeOn ? "the versions without" : "the versions with") + " Path of Exile sounds)"),
        h("div.fe-soundlist", elsewhere.map(soundRow))) : null);

    box.append(
      h("div.fe-area-head", h("div", h("h2", "Alerts"),
        h("p.fe-sub", "What a drop does besides its label: its chat line, its sound and its minimap icon."),
        h("p.fe-sub.fe-small", "The minimap icons' colors: on ", h("a", {href: "#looks/icons", onclick: (ev) => {
          ev.preventDefault(); app.go("looks", "icons");
        }}, "Looks"), ". A single item's alerts: on ", h("a", {href: "#items", onclick: (ev) => {
          ev.preventDefault(); app.go("items");
        }}, "Items"), "."))),
      globals, volumeCard, soundsCard);
  },
});
