/* The Filter Editor's small UI kit: DOM building (text only, never HTML from data), toasts, dialogs, menus and the
   common controls (segmented choices, switches, option cards). */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.ui = (function () {
  "use strict";

  /* h("button.fe-btn.primary", {onclick, title, ...}, "text", child, [children]) */
  function h(spec, attrs, ...kids) {
    const m = /^([a-z0-9]+)?((?:\.[\w-]+)*)$/i.exec(spec) || [];
    const el = document.createElement(m[1] || "div");
    if (m[2]) el.className = m[2].slice(1).split(".").join(" ");
    if (attrs && (typeof attrs !== "object" || attrs instanceof Node || Array.isArray(attrs))) {
      kids.unshift(attrs);
      attrs = null;
    }
    if (attrs) {
      for (const k of Object.keys(attrs)) {
        const v = attrs[k];
        if (v === undefined || v === null || v === false) continue;
        if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
        else if (k === "class") el.className += (el.className ? " " : "") + v;
        else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
        else if (k === "dataset") Object.assign(el.dataset, v);
        else if (k === "text") el.textContent = v;
        else if (k in el && k !== "list" && typeof v !== "string") el[k] = v;
        else el.setAttribute(k, v === true ? "" : String(v));
      }
    }
    add(el, kids);
    return el;
  }

  function add(el, kids) {
    for (const k of kids) {
      if (k === null || k === undefined || k === false) continue;
      if (Array.isArray(k)) add(el, k);
      else el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
    }
    return el;
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
    return el;
  }

  function fill(el, ...kids) {
    return add(clear(el), kids);
  }

  /* The editor's root, for toasts, menus and dialogs to live in (so the page's own styles apply). */
  let host = null;
  function setHost(el) { host = el; }

  let toastBox = null;
  function toast(text, kind, opts) {
    opts = opts || {};
    if (!toastBox || !toastBox.isConnected) {
      toastBox = h("div.fe-toasts", {role: "status", "aria-live": "polite"});
      (host || document.body).appendChild(toastBox);
    }
    const close = h("button.fe-btn.ghost.small.x", {type: "button", "aria-label": "Close", text: "✕"});
    const t = h("div.fe-toast" + (kind ? "." + kind : ""), h("div", text, opts.action || null), close);
    const done = () => { if (t.isConnected) t.remove(); };
    close.addEventListener("click", done);
    toastBox.appendChild(t);
    if (!opts.sticky) setTimeout(done, opts.ms || 5000);
    return done;
  }

  /* A modal dialog: dialog({title, body: [nodes], buttons: [{text, primary, danger, onclick: () => keepOpen?}],
     guard: () => message or null}). With a guard, Escape, a click outside and a button with no action of its own
     ask first while the guard has a message (lines typed and not kept yet). Dialogs stack: keys go to the top one. */
  const open = [];
  function dialog(opts) {
    const before = document.activeElement;
    const box = h("div.fe-dialog", {role: "dialog", "aria-modal": "true"});
    const back = h("div.fe-dialog-back", box);
    const close = () => {
      back.remove();
      const k = open.indexOf(box);
      if (k >= 0) open.splice(k, 1);
      document.removeEventListener("keydown", onkey, true);
      if (before && before.focus) before.focus();
      if (opts.onclose) opts.onclose();
    };
    const ask = () => {
      const msg = opts.guard && opts.guard();
      if (!msg) { close(); return; }
      dialog({title: "Discard what you typed?", body: [h("p", msg)],
        buttons: [{text: "Keep editing"}, {text: "Discard", danger: true, onclick: () => { close(); }}]});
    };
    const onkey = (e) => {
      if (open[open.length - 1] !== box) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); ask(); }
      else if (e.key === "Tab") trapTab(e, box);
    };
    const title = h("h3", {id: "fe-dlg-" + Math.random().toString(36).slice(2)}, opts.title);
    box.setAttribute("aria-labelledby", title.id);
    const foot = h("div.fe-dialog-foot");
    for (const b of opts.buttons || [{text: "Close"}]) {
      foot.appendChild(h("button.fe-btn" + (b.primary ? ".primary" : "") + (b.danger ? ".danger" : ""),
        {type: "button", onclick: () => {
          if (!b.onclick) { ask(); return; }
          if (b.onclick(close) !== true) close();
        }}, b.text));
    }
    add(box, [title, opts.body || [], foot]);
    back.addEventListener("mousedown", (e) => { if (e.target === back && !opts.modal) ask(); });
    document.addEventListener("keydown", onkey, true);
    open.push(box);
    (host || document.body).appendChild(back);
    const first = box.querySelector("input, select, textarea, button.primary, button");
    if (first) first.focus();
    return close;
  }

  /* A toast for a change that replaced the player's own choices: it says what happened, with Undo. */
  function undoToast(text) {
    const done = toast(text, "good", {ms: 9000, action: h("button.fe-btn.small", {type: "button", style: {marginLeft: ".6em"},
      onclick: () => { if (EZ.store && EZ.store.undoStep()) done(); }}, "Undo")});
    return done;
  }

  function trapTab(e, box) {
    const els = [...box.querySelectorAll("button, input, select, textarea, a[href], [tabindex='0']")]
      .filter((x) => !x.disabled && x.offsetParent !== null);
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function confirmBox(title, text, yes, onyes) {
    dialog({title, body: [h("p", text)], buttons: [{text: "Cancel"}, {text: yes, primary: true, onclick: onyes}]});
  }

  /* A menu under an anchor: menu(anchor, [{text, sub, onclick, disabled}]) */
  let openMenu = null;
  function menu(anchor, items) {
    if (openMenu) openMenu();
    const box = h("div.fe-menu", {role: "menu"});
    for (const it of items) {
      if (!it) continue;
      box.appendChild(h("button", {type: "button", role: "menuitem", disabled: !!it.disabled, onclick: () => {
        close();
        it.onclick();
      }}, h("span", h("span", it.text), it.sub ? h("small", it.sub) : null)));
    }
    const root = host || document.body;
    root.appendChild(box);
    const r = anchor.getBoundingClientRect(), rr = root.getBoundingClientRect();
    const w = box.offsetWidth;
    let left = r.right - rr.left - w;
    if (left < 4) left = 4;
    box.style.left = left + "px";
    box.style.top = (r.bottom - rr.top + 4) + "px";
    const away = (e) => { if (!box.contains(e.target) && e.target !== anchor) close(); };
    const key = (e) => {
      if (e.key === "Escape") { close(); anchor.focus(); }
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const bs = [...box.querySelectorAll("button:not(:disabled)")];
        const i = bs.indexOf(document.activeElement);
        const n = e.key === "ArrowDown" ? (i + 1) % bs.length : (i - 1 + bs.length) % bs.length;
        if (bs[n]) bs[n].focus();
        e.preventDefault();
      }
    };
    function close() {
      box.remove();
      document.removeEventListener("mousedown", away, true);
      document.removeEventListener("keydown", key, true);
      openMenu = null;
    }
    document.addEventListener("mousedown", away, true);
    document.addEventListener("keydown", key, true);
    openMenu = close;
    const first = box.querySelector("button:not(:disabled)");
    if (first) first.focus();
    return close;
  }

  /* A search box with its results under it, the same everywhere (items, bases, stats): the arrows move through the
     results, Enter picks the highlighted one (the first at first), Escape closes them, and they stay while the focus
     is in the box. combo({placeholder, label, find: (q) -> [{label, sub, pick}], empty: (q) -> text, all: show the
     whole list for an empty box, onfocus too}) -> {box, input, close}. */
  let comboN = 0;
  function combo(opts) {
    const id = "fe-combo-" + (++comboN);
    const input = h("input.fe-pv-search", {type: "search", placeholder: opts.placeholder || "", "aria-label": opts.label,
      role: "combobox", "aria-expanded": "false", "aria-autocomplete": "list", "aria-controls": id, autocomplete: "off",
      spellcheck: "false"});
    const list = h("div.fe-pv-picks", {hidden: true, role: "listbox", id});
    let found = [], at = -1;
    const close = () => {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      at = -1;
    };
    const mark = () => {
      [...list.querySelectorAll("[role=option]")].forEach((el, k) => {
        el.setAttribute("aria-selected", String(k === at));
        if (k === at) {
          input.setAttribute("aria-activedescendant", el.id);
          if (el.scrollIntoView) el.scrollIntoView({block: "nearest"});
        }
      });
    };
    const pick = (k) => {
      const f = found[k];
      if (!f) return;
      close();
      input.value = "";
      f.pick();
    };
    const show = () => {
      const q = input.value.trim();
      found = q || opts.all ? opts.find(q) : [];
      at = found.length && q ? 0 : -1;
      fill(list, found.length ? found.map((f, k) => h("button", {type: "button", role: "option", id: id + "-" + k,
        tabindex: "-1", onmousedown: (e) => e.preventDefault(), onclick: () => pick(k)},
        h("span", f.label), f.sub ? h("small", f.sub) : null))
        : q ? h("p.fe-sub.fe-small", {style: {margin: ".45em .7em"}}, opts.empty ? opts.empty(q) : `Nothing matches "${q}".`)
        : null);
      const open = !!(q || (opts.all && found.length));
      list.hidden = !open;
      input.setAttribute("aria-expanded", String(open));
      mark();
    };
    input.addEventListener("input", show);
    if (opts.all) input.addEventListener("focus", show);
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (list.hidden) show();
        if (!found.length) return;
        e.preventDefault();
        at = at < 0 ? (e.key === "ArrowDown" ? 0 : found.length - 1)
          : (at + (e.key === "ArrowDown" ? 1 : found.length - 1)) % found.length;
        mark();
      } else if (e.key === "Enter") {
        if (!list.hidden && found.length) { e.preventDefault(); pick(at < 0 ? 0 : at); }
      } else if (e.key === "Escape") {
        if (!list.hidden) { e.preventDefault(); e.stopPropagation(); close(); }
      }
    });
    input.addEventListener("blur", () => setTimeout(() => {
      if (document.activeElement !== input && !list.contains(document.activeElement)) close();
    }, 150));
    return {box: h("div.fe-pv-pick", input, list), input, list, close, show};
  }

  /* A segmented choice: seg([{value, text, title}], current, onchange, {label}) */
  function seg(options, current, onchange, opts) {
    const box = h("div.fe-seg", {role: "group", "aria-label": opts && opts.label || null});
    for (const o of options) {
      box.appendChild(h("button", {type: "button", "aria-pressed": String(o.value === current), title: o.title || null,
        disabled: !!o.disabled, onclick: () => { if (o.value !== current) onchange(o.value); }}, o.text));
    }
    return box;
  }

  /* A switch: toggle(label, checked, onchange, {disabled, title, sub}) */
  function toggle(label, checked, onchange, opts) {
    opts = opts || {};
    const input = h("input", {type: "checkbox", checked: !!checked, disabled: !!opts.disabled,
      onchange: (e) => onchange(e.target.checked)});
    return h("label.fe-switch", {title: opts.title || null}, input, h("span.track"),
      h("span", h("span", label), opts.sub ? h("small.fe-sub", {style: {display: "block"}}, opts.sub) : null));
  }

  /* An option card in a choice: option(title, sub, pressed, onclick) */
  function option(title, sub, pressed, onclick, extra) {
    return h("button.fe-option", {type: "button", "aria-pressed": String(!!pressed), onclick},
      h("b", title), sub ? h("small", sub) : null, extra || null);
  }

  function pill(text, kind) {
    return h("span.fe-pill" + (kind ? "." + kind : ""), text);
  }

  function debounce(fn, ms) {
    let t = null;
    const d = (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    d.flush = (...args) => { clearTimeout(t); fn(...args); };
    return d;
  }

  /* "2 minutes ago", "yesterday", "Nov 9" */
  function ago(ms) {
    if (!ms) return "";
    const s = Math.round((Date.now() - ms) / 1000);
    if (s < 45) return "just now";
    if (s < 90) return "a minute ago";
    const m = Math.round(s / 60);
    if (m < 60) return `${m} minutes ago`;
    const hrs = Math.round(m / 60);
    if (hrs < 24) return hrs === 1 ? "an hour ago" : `${hrs} hours ago`;
    const d = new Date(ms);
    return d.toLocaleDateString(undefined, {month: "short", day: "numeric", year:
      d.getFullYear() === new Date().getFullYear() ? undefined : "numeric"});
  }

  function plural(n, one, many) {
    return `${n.toLocaleString()} ${n === 1 ? one : (many || one + "s")}`;
  }

  return {h, add, clear, fill, setHost, toast, undoToast, dialog, confirmBox, menu, combo, seg, toggle, option, pill,
          debounce, ago, plural};
})();
