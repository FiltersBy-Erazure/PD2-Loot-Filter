/* The Filter Editor's drawing of what the game draws. Text is in BH's color codes (ÿc + a character, looked up in
   D2GL's g_text_colors: the PD2 fork's d2gl/src/modules/hd_text/variables.h), its lines in the game's order (the
   string's first line drawn at the bottom, each line centred, a color carrying on to the line above).

   This module draws labels as styled HTML in D2GL's colors on the game's 60% black box with faded ends; the game-font
   canvas renderer (fonts from d2gl.mpq, the MSDF math of D2GL's shader) replaces the text drawing behind the same calls
   once the assets are there (EZ.glyphs). */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.render = (function () {
  "use strict";
  const {h} = EZ.ui;

  /* D2GL's g_text_colors: code character -> RRGGBBAA. */
  const CODES = {
    "\x01": "DFB679FF", "\x02": "000000FF", "\x03": "DFB67966", "\x04": "C22121FF", "\x05": "959595FF",
    "\x06": "E09595FF", "\x07": "B6E12EFF", "\x08": "9EA0A0FF", "\x09": "5CA6A4FF", "\x0A": "A2AAA5FF",
    "\x0B": "A6E0A7FF", "\x0C": "A9A9B0FF", "\x0D": "A9B1B1FF", "\x0E": "E2ABE2FF", "\x0F": "EB2EAEFF",
    "\x10": "B0B2E2FF", "\x11": "EBEBE1FF", "\x12": "E22EB8FF", "\x13": "EBEBEBFF", "\x14": "21C7CAFF",
    "\x15": "CB21CDFF", "\x16": "CED126FF", "\x17": "D2D328FF", "\x18": "D5D6D8FF", "\x19": "D9D965FF",
    "\x1A": "DA29DAFF", "\x1B": "DC68DBFF", "\x1C": "DCAD2BFF", "\x1D": "2BDFDFFF", "\x1E": "DFADDFFF",
    "\x1F": "2CE02CFF", "!": "E0B3B3FF", "\"": "2C2CE1FF", "#": "E1E1E2FF", "$": "E2EBEBFF", "%": "EBEB77FF",
    "&": "898D8BFF", "'": "8D8D8BFF", "(": "8EA1A0FF", ")": "0DCCE9FF", "*": "2325CEFF", "+": "8DEAD3FF",
    ",": "D5D3EAFF", "-": "EAD8D9FF", ".": "29DCDCFF", "/": "DFDFEBFF", "0": "FEFEFEFF", "1": "FE6950FF",
    "2": "25FE00FF", "3": "7B7BFEFF", "4": "DFB679FF", "5": "7B7B7BFF", "6": "00000000", "7": "D9CD8EFF",
    "8": "FFB200FF", "9": "EBEB75FF", ":": "008C00FF", ";": "B700FFFF", "<": "00D200FF", "=": "EBEBEBFF",
  };
  /* PD2's own: the rest of the text at this alpha (BH's FULL / THREE_FOURTHS / HALF / QUARTER_TRANS). */
  const ALPHA = {"@": 1, "A": 0x99 / 255, "B": 0x66 / 255, "C": 0x33 / 255};

  /* BH's color words as it writes them under Glide (BH ItemDisplay.cpp's ReplacementMap). */
  const WORDS = {WHITE: "0", RED: "1", GREEN: "2", BLUE: "3", GOLD: "4", GRAY: "5", BLACK: "\x02", TAN: "7",
                 ORANGE: "8", YELLOW: "9", PURPLE: ";", DARK_GREEN: ":", CORAL: "\x06", SAGE: "\x07", TEAL: "\x09",
                 LIGHT_GRAY: "\x0C", FULL_TRANS: "@", THREE_FOURTHS_TRANS: "A", HALF_TRANS: "B", QUARTER_TRANS: "C"};
  const WORD_RE = new RegExp("%(" + Object.keys(WORDS).join("|") + ")%", "g");
  /* The color a dropped item's name starts in (the game puts it in front), by quality. */
  const QUALITY = {NMAG: "0", MAG: "3", SET: "2", RARE: "9", UNI: "4", CRAFT: "8", SOCKETED: "5", ETH: "5"};

  function codes(text) { return text.replace(WORD_RE, (m, w) => "ÿc" + WORDS[w]); }

  function rgb(code) {
    const c = CODES[code];
    return c ? "#" + c.slice(0, 6) : null;
  }

  /* The text's lines in the game's drawing order, top first: [[{color, alpha, text}]]. The string's lines are split
     at \n (BH's %NL%); its first line is drawn at the bottom, and the colors carry on in string order. */
  function lines(text, start) {
    const parts = text.split("\n");
    let color = start || "0", alpha = 1;
    const out = parts.map((part) => {
      const segs = [];
      let buf = "";
      for (let i = 0; i < part.length; i++) {
        if (part[i] === "ÿ" && part[i + 1] === "c" && i + 2 < part.length) {
          const k = part[i + 2];
          if (k in CODES || k in ALPHA) {
            if (buf) segs.push({color, alpha, text: buf});
            buf = "";
            if (k in ALPHA) alpha = ALPHA[k]; else color = k;
            i += 2;
            continue;
          }
        }
        buf += part[i];
      }
      if (buf) segs.push({color, alpha, text: buf});
      return segs;
    });
    return out.reverse();
  }

  /* A label as the game draws a dropped item's name: the box (rgba 0,0,0,.6, both ends fading), the lines centred.
     opts: {start: the quality's color code, state: "ground" | "alt" (hovered with Alt: blue) | "hover" (no Alt:
     solid black, no fade), cut: [visible characters cut off] (drawn ghosted), zoom}. */
  function label(text, opts) {
    opts = opts || {};
    const box = h("span.fe-label" + (opts.state ? ".is-" + opts.state : ""));
    if (opts.zoom) box.style.fontSize = (13.5 * opts.zoom) + "px";
    for (const segs of lines(text, opts.start)) {
      const row = h("span.fe-label-line");
      if (!segs.length) row.appendChild(document.createTextNode(" "));
      for (const s of segs) {
        const c = rgb(s.color);
        const span = h("span", s.text);
        if (c) span.style.color = c;
        if (CODES[s.color] && CODES[s.color].slice(6) === "00") span.style.color = "transparent";
        if (s.alpha < 1) span.style.opacity = String(s.alpha);
        row.appendChild(span);
      }
      box.appendChild(row);
    }
    box.setAttribute("aria-label", plain(text));
    return box;
  }

  /* The text without its color codes, lines top first joined by " / " (for screen readers and copying). */
  function plain(text) {
    return lines(text).map((segs) => segs.map((s) => s.text).join("")).join(" / ");
  }

  /* A filter level name as the launcher and BH's menu show it (its own codes in its own colors, on no box). */
  function levelName(text) {
    const out = h("span.fe-levelname");
    for (const segs of lines(text, "0")) {
      for (const s of segs) {
        const span = h("span", s.text);
        const c = rgb(s.color);
        if (c) span.style.color = c;
        out.appendChild(span);
      }
    }
    return out;
  }

  /* Text with color codes as lines of colored spans, in the game's order (a chat line, a description). */
  function coded(text, start, cls) {
    const out = h("span." + (cls || "fe-coded"));
    lines(text, start).forEach((segs, i) => {
      if (i) out.appendChild(h("br"));
      for (const s of segs) {
        const span = h("span", s.text);
        const c = rgb(s.color);
        if (c) span.style.color = c;
        out.appendChild(span);
      }
    });
    return out;
  }

  /* The hover-box lines a rule's output writes of its own ({…}: %NAME% is what earlier rules wrote, %CL% a new
     line), in the game's codes, or "" when it writes none. vals: the alias values (its looks). */
  function descOf(out, vals) {
    const l = out.indexOf("{"), r = out.indexOf("}", l + 1);
    if (l < 0 || r < 0) return "";
    let t = out.slice(l + 1, r);
    for (let n = 0; n < 4 && /%[A-Z0-9_]+%/.test(t); n++) {
      t = t.replace(/%([A-Z0-9_]+)%/g, (m, k) => k === "NAME" || !vals || !(k in vals) ? m : vals[k]);
    }
    t = codes(t.replace(/%(?:CL|NL)%/g, "\n").replace(/%PERCENT%/g, "%").replace(/%CS%/g, " "));
    return t.split("\n").filter((x) => x.replace(/ÿc./g, "").replace(/%NAME%/g, "").trim())
      .map((x) => x.replace(/%NAME%/g, "…")).join("\n");
  }

  /* What a hidden item shows, in the same words everywhere (an engine result: invisible, hidden, icons): "Hidden"
     (nothing on the ground: no label, no picture, no alert) or "Hidden, icon only" (no label; the item lies there
     with its minimap icon); null while it shows. hiddenNode: those words in the hidden style, with the long form
     as its tooltip. */
  function hiddenWords(r) {
    if (!r || !(r.hidden || r.invisible)) return null;
    if (r.invisible) return "Hidden";
    return r.icons && r.icons.length ? "Hidden, icon only" : "Hidden, alert only";
  }
  const HIDDEN_LONG = {
    "Hidden": "Nothing on the ground: no label, no picture, no minimap icon, no chat line, no sound.",
    "Hidden, icon only": "No label, but the item lies on the ground and its minimap icon shows (and its alert, if it has one).",
    "Hidden, alert only": "No label and no minimap icon, but the item lies on the ground and its chat line or sound comes.",
  };
  function hiddenNode(r) {
    const w = hiddenWords(r);
    return w ? h("span.fe-pv-hidden", {title: HIDDEN_LONG[w]}, w) : null;
  }

  return {CODES, WORDS, QUALITY, codes, rgb, lines, label, plain, levelName, coded, descOf, hiddenWords, hiddenNode,
          HIDDEN_LONG};
})();
