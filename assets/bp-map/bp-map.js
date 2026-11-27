
(() => {
  "use strict";

  // Written by tools/breakpoint_data.py (never by hand): classes; anims: per class (and wereform) its cast (sc), hit
  // recovery (gh) and block (bl) animation per weapon class, [frames, speed]; seqcast: the cast sequences (the
  // Sorceress's Chain Lightning and Frozen Orb); castCap 175, chill 50 (faster cast rate taken), holyShield 100, base 50.
  /* breakpoint-data:start */
  const DATA = {"classes":[["ama","Amazon"],["ass","Assassin"],["bar","Barbarian"],["dru","Druid"],["nec","Necromancer"],["pal","Paladin"],["sor","Sorceress"],["wolf","Druid as a werewolf"],["bear","Druid as a werebear"]],"anims":{"ama":{"sc":{"hth":[20,256],"1hs":[20,256],"1ht":[20,256],"2hs":[20,256],"2ht":[20,256],"stf":[20,256],"bow":[20,256],"xbw":[20,256]},"gh":{"hth":[6,256],"1hs":[6,256],"1ht":[6,256],"2hs":[6,256],"2ht":[6,256],"stf":[6,256],"bow":[6,256],"xbw":[6,256]},"bl":{"hth":[3,256],"1hs":[3,88],"1ht":[3,256]}},"ass":{"sc":{"hth":[17,256],"1hs":[17,256],"1ht":[17,256],"2hs":[17,256],"2ht":[17,256],"stf":[17,256],"bow":[17,256],"xbw":[17,256],"ht1":[17,256],"ht2":[17,256]},"gh":{"hth":[5,256],"1hs":[5,256],"1ht":[5,256],"2hs":[5,256],"2ht":[5,256],"stf":[5,256],"bow":[5,256],"xbw":[5,256],"ht1":[5,256],"ht2":[5,256]},"bl":{"hth":[3,256],"1hs":[3,256],"1ht":[3,256],"ht1":[3,256],"ht2":[3,256]}},"bar":{"sc":{"hth":[14,256],"1hs":[14,256],"1ht":[14,256],"2hs":[14,256],"2ht":[14,256],"stf":[14,256],"bow":[14,256],"xbw":[14,256]},"gh":{"hth":[5,256],"1hs":[5,256],"1ht":[5,256],"2hs":[5,256],"2ht":[5,256],"stf":[5,256],"bow":[5,256],"xbw":[5,256]},"bl":{"hth":[4,256],"1hs":[4,256],"1ht":[4,256]}},"dru":{"sc":{"hth":[15,208],"1hs":[15,208],"1ht":[15,208],"2hs":[15,208],"2ht":[15,208],"stf":[15,208],"bow":[15,208],"xbw":[15,208]},"gh":{"hth":[7,256],"1hs":[7,248],"1ht":[7,256],"2hs":[7,256],"2ht":[7,256],"stf":[7,256],"bow":[7,256],"xbw":[7,256]},"bl":{"hth":[6,256],"1hs":[6,256],"1ht":[6,256]}},"nec":{"sc":{"hth":[16,256],"1hs":[16,256],"1ht":[16,256],"2hs":[16,256],"2ht":[16,256],"stf":[16,256],"bow":[16,256],"xbw":[16,256]},"gh":{"hth":[7,256],"1hs":[7,256],"1ht":[7,256],"2hs":[7,256],"2ht":[7,256],"stf":[7,256],"bow":[7,256],"xbw":[7,256]},"bl":{"hth":[6,256],"1hs":[6,256],"1ht":[6,256]}},"pal":{"sc":{"hth":[16,256],"1hs":[16,256],"1ht":[16,256],"2hs":[16,256],"2ht":[16,256],"stf":[16,256],"bow":[16,256],"xbw":[16,256]},"gh":{"hth":[5,256],"1hs":[5,256],"1ht":[5,256],"2hs":[5,256],"2ht":[5,192],"stf":[5,192],"bow":[5,256],"xbw":[5,256]},"bl":{"hth":[3,256],"1hs":[3,256],"1ht":[3,256],"2hs":[3,168],"2ht":[3,256]}},"sor":{"sc":{"hth":[14,256],"1hs":[14,256],"1ht":[14,256],"2hs":[14,256],"2ht":[14,256],"stf":[14,256],"bow":[14,256],"xbw":[14,256]},"gh":{"hth":[8,256],"1hs":[8,256],"1ht":[8,256],"2hs":[8,256],"2ht":[8,256],"stf":[8,256],"bow":[8,256],"xbw":[8,256]},"bl":{"hth":[5,256],"1hs":[5,256],"1ht":[5,256]}},"wolf":{"sc":{"hth":[11,168]},"gh":{"hth":[4,256]},"bl":{"hth":[5,256]}},"bear":{"sc":{"hth":[10,152]},"gh":{"hth":[5,184]},"bl":{"hth":[5,200]}}},"seqcast":{"sor":{"skills":["Chain Lightning","Frozen Orb"],"frames":19}},"castCap":175,"chill":50,"holyShield":100,"base":50};
  /* breakpoint-data:end */

  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const STORE = "erazure-breakpoints";
  const SITE = typeof __md_scope !== "undefined" ? __md_scope.href : "https://filtersby-erazure.github.io/PD2-Loot-Filter/";
  $("bp-to-ias").href = SITE + "resources/ias-calculator/";
  $("bp-to-lines").href = SITE + "resources/map-lines/";
  // the weapon classes in words (breakpoint_data.py stops if Weapons.txt no longer gives them these weapons)
  const WC_WORDS = {hth: "no weapon", "1hs": "a one-handed swinging weapon (sword, axe, mace, wand, orb)",
    "1ht": "a one-handed thrusting weapon (dagger, javelin)", "2hs": "a two-handed sword", "2ht": "a spear",
    stf: "a staff, polearm, or two-handed axe or hammer", bow: "a bow", xbw: "a crossbow", ht1: "a claw", ht2: "two claws"};
  const SHIELD_WCS = ["hth", "1hs", "1ht", "ht1"];
  /* the setup: in this browser and in the address, as the other calculators keep theirs (the additions audit, SW-08,
     2026-11-23): a link holds only what differs from the defaults, in short keys */
  const DEFAULT = {cls: "sor", wc: "", holy: 0, chill: 0, fcr: 0, fhr: 0, fbr: 0};
  const KEYS = {cls: "c", wc: "w", holy: "h", chill: "ch", fcr: "fc", fhr: "fh", fbr: "fb"};
  const state = Object.assign({}, DEFAULT);
  function fromHash() {
    const h = location.hash.slice(1);
    if (!/(^|&)[a-z]+=/.test(h)) return null;
    const out = {};
    for (const kv of h.split("&")) {
      const [k, v] = kv.split("="), key = Object.keys(KEYS).find(x => KEYS[x] === k);
      if (key && v !== undefined) out[key] = typeof DEFAULT[key] === "number" ? Math.max(0, Math.round(Number(v)) || 0) : decodeURIComponent(v);
    }
    return out;
  }
  // a link's setup first, else this browser's, else the defaults
  let linked = null;
  try { linked = fromHash(); } catch (e) { /* a broken link */ }
  if (linked) Object.assign(state, linked);
  else try { Object.assign(state, JSON.parse(localStorage.getItem(STORE) || "{}")); } catch (e) { /* this visit */ }

  // the game's maths (the animation rate)
  const eff = v => (120 + v === 0 ? 0 : Math.trunc(120 * v / (120 + v)));
  const castFrames = ([f, s], v, seq) => { const rate = Math.trunc(s * Math.min(DATA.castCap, 100 + eff(v)) / 100); return Math.ceil(256 * f / rate) - (seq ? 0 : 1); };
  const slowFrames = ([f, s], v, base) => { const rate = Math.max(1, Math.trunc((base + eff(v)) * s / 100)); return Math.ceil(256 * f / rate) - 1; };
  const TOP = 1000;  // breakpoints past this are out of reach of any gear
  function table(fn) {
    const rows = []; let last = null;
    for (let v = 0; v <= TOP; v++) { const n = fn(v); if (n !== last) { rows.push([v, n]); last = n; } }
    return rows;
  }

  // the bar
  for (const [c, n] of DATA.classes) { const o = el("option", "", n); o.value = c; $("bpClass").appendChild(o); }
  const anim = () => DATA.anims[state.cls];
  // weapon classes that change cast, hit recovery or (where the class blocks differently by weapon: an Amazon's
  // one-handed swinging weapon) block, grouped by what they give
  function groups(cls) {
    const a = DATA.anims[cls || state.cls], by = new Map();
    const blocks = new Set(SHIELD_WCS.filter(w => a.bl[w]).map(w => JSON.stringify(a.bl[w]))).size > 1;
    for (const wc of Object.keys(a.sc)) {
      const key = JSON.stringify([a.sc[wc], a.gh[wc], blocks && SHIELD_WCS.includes(wc) ? a.bl[wc] || null : null]);
      if (!by.has(key)) by.set(key, []);
      by.get(key).push(wc);
    }
    return [...by.values()];
  }
  const listWords = xs => xs.length < 3 ? xs.join(" or ") : xs.slice(0, -1).join(", ") + ", or " + xs[xs.length - 1];
  function fillWeapons() {
    const gs = groups(), sel = $("bpWeapon"); sel.textContent = "";
    $("bpWeaponF").hidden = gs.length < 2;
    const big = gs.reduce((a, b) => (b.length > a.length ? b : a), gs[0]);
    for (const g of gs) {
      const other = g.includes("hth") ? "Any other weapon, or none" : "Any other weapon";
      const o = el("option", "", g === big ? other : listWords(g.map(w => WC_WORDS[w] || w)).replace(/^./, c => c.toUpperCase()));
      o.value = g[0]; sel.appendChild(o);
    }
    if (!gs.some(g => g.includes(state.wc))) state.wc = big[0];
    state.wc = sel.value = gs.find(g => g.includes(state.wc))[0];  // a group by its first, as the list names it
  }
  // the weapon a class starts on (its biggest group's): a link leaves it out
  const wcDefault = cls => { const gs = groups(cls); return gs.reduce((a, b) => (b.length > a.length ? b : a), gs[0])[0]; };
  function hashText() {
    return Object.keys(KEYS).filter(k => (k === "wc" ? state.wc !== wcDefault(state.cls) : state[k] !== DEFAULT[k]))
      .map(k => `${KEYS[k]}=${encodeURIComponent(state[k])}`).join("&");
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private window */ }
    const q = hashText();
    try { history.replaceState(null, "", q ? "#" + q : location.pathname + location.search); } catch (e) { /* file: */ }
    resetBtn();
  }
  $("bpClass").addEventListener("change", () => { state.cls = $("bpClass").value; state.wc = ""; render(); });
  $("bpWeapon").addEventListener("change", () => { state.wc = $("bpWeapon").value; render(); });
  document.querySelectorAll(".bp-map [data-holy]").forEach(b => b.addEventListener("click", () => { state.holy = +b.dataset.holy; render(); }));
  document.querySelectorAll(".bp-map [data-chill]").forEach(b => b.addEventListener("click", () => { state.chill = +b.dataset.chill; render(); }));

  // a card: your % in, your frames, the next breakpoint, the table
  function card(title, stat, key, rows, sub, extra) {
    const c = el("section", "panel card");
    c.setAttribute("aria-labelledby", "bp-h-" + key);
    const h = el("h2", "", title); h.id = "bp-h-" + key; c.appendChild(h);
    if (sub) c.appendChild(el("p", "sub", sub));
    if (!rows) { c.appendChild(el("p", "none", extra)); return c; }
    const inp = el("input"); inp.type = "number"; inp.min = 0; inp.max = TOP; inp.id = "bp-in-" + key; inp.value = state[key];
    const lab = el("label", "", `Your ${stat}`); lab.htmlFor = inp.id;
    const line = el("div", "in"); line.append(lab, inp, el("span", "sub", "%"));
    c.appendChild(line);
    const out = el("div"); c.appendChild(out);
    const draw = () => {
      const v = Math.max(0, Math.min(TOP, Math.round(+inp.value) || 0));
      out.textContent = "";
      for (const t of rows) {
        const i = t.rows.reduce((k, r, j) => (r[0] <= v ? j : k), 0), now = t.rows[i], nx = t.rows[i + 1];
        if (t.name) out.appendChild(el("p", "sub", t.name));
        const n = el("p", "now"); n.append(el("span", "n", String(now[1])), el("span", "u", `frame${now[1] === 1 ? "" : "s"} (${(now[1] / 25).toFixed(2)} s)`));
        const nt = el("p", "next");
        if (nx) nt.innerHTML = `Next: <b>+${nx[0] - v}% ${stat}</b> (${nx[0]}% in all) for ${nx[1]} frame${nx[1] === 1 ? "" : "s"}.` +
          (v > now[0] ? ` You could do with ${v - now[0]}% less and keep ${now[1]}.` : "");
        else nt.textContent = v > now[0] ? `The fastest. You could do with ${v - now[0]}% less and keep ${now[1]}.` : "The fastest.";
        const tb = el("table", "bp-table"), hd = tb.createTHead().insertRow();
        hd.append(el("th", "", stat), el("th", "", "Frames"));
        const body = tb.createTBody();
        t.rows.forEach((r, j) => { const tr = body.insertRow(); if (j === i) tr.className = "you"; tr.insertCell().textContent = r[0] + "%"; tr.insertCell().textContent = r[1]; });
        out.append(n, nt, tb);
      }
    };
    inp.addEventListener("input", () => { state[key] = Math.max(0, Math.min(TOP, Math.round(+inp.value) || 0)); draw(); save(); });
    draw();
    return c;
  }

  function render() {
    $("bpClass").value = state.cls;
    fillWeapons();
    const a = anim(), wc = state.wc;
    $("bpHolyF").hidden = state.cls !== "pal";
    document.querySelectorAll(".bp-map [data-holy]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.holy === state.holy)));
    document.querySelectorAll(".bp-map [data-chill]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.chill === state.chill)));
    const chilled = v => (state.chill ? v - Math.min(v, DATA.chill) : v);
    const cast = [{name: "", rows: table(v => castFrames(a.sc[wc], chilled(v), false))}];
    const seq = DATA.seqcast[state.cls];
    if (seq) { cast[0].name = "Other spells"; cast.push({name: listWords(seq.skills), rows: table(v => castFrames([seq.frames, 256], chilled(v), true))}); }
    // block: with the weapon held beside the shield (a two-handed weapon, bow or crossbow holds none)
    const shieldWc = SHIELD_WCS.includes(wc) ? wc : null, bl = shieldWc && a.bl[shieldWc];
    const base = state.cls === "pal" && state.holy ? DATA.holyShield : DATA.base;
    const box = $("bpCards"); box.textContent = "";
    box.append(
      card("Cast rate", "FCR", "fcr", cast, state.chill ? `Chilled: up to ${DATA.chill}% of it doesn't count.` : ""),
      card("Hit recovery", "FHR", "fhr", [{name: "", rows: table(v => slowFrames(a.gh[wc], v, DATA.base))}]),
      card("Block", "FBR", "fbr", bl ? [{name: "", rows: table(v => slowFrames(bl, v, base))}] : null,
        base !== DATA.base ? "With Holy Shield." : "", "No shield with this weapon."),
    );
    save();
  }

  // your character, shared with the site's other tools (javascripts/erazure.js; the website ideas' #11)
  const CODES = {ama: "ama", ass: "ass", bar: "bar", dru: "dru", nec: "nec", pal: "pal", sor: "sor"};
  window.ezCharPage = {fields: ["cls", "fcr", "fhr"],
    read: () => ({cls: CODES[state.cls], fcr: state.fcr, fhr: state.fhr}),
    fit: c => c,
    use(c) {
      if (c.cls && CODES[c.cls] && !(c.cls === "dru" && (state.cls === "wolf" || state.cls === "bear"))) state.cls = c.cls;
      if (c.fcr !== undefined) state.fcr = Math.max(0, Math.min(TOP, Math.round(+c.fcr) || 0));
      if (c.fhr !== undefined) state.fhr = Math.max(0, Math.min(TOP, Math.round(+c.fhr) || 0));
      undo = null;
      render();
    },
    /* a character from the PD2 armory (erazure.js's box, javascripts/armory.js; the author, 2026-11-24): the class (a
       Druid in its form with 2+ points in Werewolf or Werebear), the weapon class of the set picked, faster cast
       rate, hit recovery and block rate from the gear (charms and set bonuses in) and the class's passive skills
       (V.passive: Weapon Block's block rate, Dodge's and Combat Reflexes' hit recovery), Holy Shield on for a Paladin
       with points in it and a shield; Chilled stays (notes: .claude/rules/resources/armory.md) */
    armory(V) {
      const before = JSON.stringify(state), pc = v => Math.max(0, Math.min(TOP, Math.round(v || 0)));
      const ps = V.passive || {}, from = V.passiveFrom || {};
      state.cls = V.cls === "dru" && V.form !== "human" && DATA.anims[V.form] ? V.form : V.cls;
      if (!DATA.anims[state.cls]) state.cls = DEFAULT.cls;
      state.wc = V.wc;
      state.fcr = pc((V.st[105] || 0) + (ps[105] || 0)); state.fhr = pc((V.st[99] || 0) + (ps[99] || 0));
      state.fbr = pc((V.st[102] || 0) + (ps[102] || 0));
      state.holy = V.cls === "pal" && V.skill(117).base > 0 && V.shield ? 1 : 0;  // Holy Shield
      undo = null;
      render();
      const after = JSON.stringify(state), now = () => JSON.stringify(state);
      // "FBR (Weapon Block's 18 in)": a skill's part named where there is one
      const word = (w, id) => (ps[id] ? `${w} (${from[id].map(s => (window.ezArmory && ezArmory.skillName ? ezArmory.skillName(s) : "a skill")).join(" and ")}’s ${ps[id]} in)` : w);
      const filled = ["weapon", word("FCR", 105), word("FHR", 99), word("FBR", 102)].concat(V.cls === "pal" ? ["Holy Shield"] : []);
      return {filled, left: ["Chilled"], undoable: () => now() === after,
        undo() { if (now() !== after) return false; Object.assign(state, JSON.parse(before)); undo = null; render(); return true; }};
    }};

  // Reset to the defaults, then Undo reset until the next change; Copy a link (the setup is in the address), as the
  // other calculators have them (the additions audit, SW-08, 2026-11-23)
  let undo = null;
  const resetEl = $("bpReset");
  function resetBtn() {
    resetEl.textContent = undo ? "Undo reset" : "Reset to the defaults";
    resetEl.disabled = !undo && !hashText();
  }
  resetEl.addEventListener("click", () => {
    if (undo) { Object.assign(state, undo); undo = null; render(); return; }
    const was = Object.assign({}, state);
    Object.assign(state, DEFAULT);
    render();
    undo = was;
    resetBtn();
  });
  // any change ends the reset's Undo (taken before the control's own handler runs)
  for (const id of ["bpBar", "bpCards"]) {
    $(id).addEventListener("input", () => { undo = null; }, true);
    $(id).addEventListener("change", () => { undo = null; }, true);
    $(id).addEventListener("click", e => { if (e.target.closest("button")) undo = null; }, true);
  }
  // a link pasted over this page's address opens its setup too
  addEventListener("hashchange", () => {
    let l = null;
    try { l = fromHash(); } catch (e) { /* a broken link */ }
    if (!l) return;
    Object.assign(state, DEFAULT, l);
    undo = null;
    if (!DATA.anims[state.cls]) state.cls = DEFAULT.cls;
    render();
  });
  $("bpCopy").addEventListener("click", () => {
    save();
    const note = $("bpCopyNote"), link = location.href;
    const done = ok => { note.textContent = ok ? "Copied." : link; if (ok) setTimeout(() => { note.textContent = ""; }, 2500); };
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => done(true), () => done(false)); else done(false);
  });

  // a setup from a link or an older visit, kept within what the page shows
  if (!DATA.anims[state.cls]) state.cls = DEFAULT.cls;
  for (const k of ["fcr", "fhr", "fbr"]) state[k] = Math.max(0, Math.min(TOP, Math.round(+state[k]) || 0));
  for (const k of ["holy", "chill"]) state[k] = +state[k] ? 1 : 0;
  render();
})();
