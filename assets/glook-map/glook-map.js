
(() => {
  "use strict";
  /* upd-data:start */
const DATA = {"palette":{"00":"#000000","01":"#240000","02":"#1c1808","03":"#2c2410","04":"#3c3418","05":"#5c0000","06":"#484020","07":"#544828","08":"#900000","09":"#8c4810","0A":"#bc0000","0B":"#d08420","0C":"#f4c46c","0D":"#8c7c50","0E":"#ac9c64","0F":"#0c0c08","10":"#141010","11":"#1c1c1c","12":"#28241c","13":"#2c2c2c","14":"#3c3830","15":"#383838","16":"#484848","17":"#585048","18":"#645834","19":"#585858","1A":"#74643c","1B":"#646464","1C":"#7c7470","1D":"#848484","1E":"#9c9894","1F":"#c4c4c4","20":"#f4f4f4","21":"#080404","22":"#100400","23":"#180804","24":"#181008","25":"#1c1410","26":"#240c04","27":"#20180c","28":"#201814","29":"#2c1008","2A":"#241c10","2B":"#28200c","2C":"#380804","2D":"#301c10","2E":"#302814","2F":"#40140c","30":"#382810","31":"#480c04","32":"#38281c","33":"#4c200c","34":"#442c14","35":"#402c20","36":"#581008","37":"#483420","38":"#443428","39":"#54281c","3A":"#5c1c14","3B":"#5c2408","3C":"#543818","3D":"#543824","3E":"#6c1810","3F":"#682c10","40":"#5c4424","41":"#702418","42":"#683c24","43":"#7c2c0c","44":"#644c2c","45":"#704808","46":"#802818","47":"#745028","48":"#883024","49":"#6c5040","4A":"#8c340c","4B":"#702068","4C":"#785844","4D":"#8c4040","4E":"#845c30","4F":"#9c3424","50":"#a42818","51":"#a44814","52":"#8c6440","53":"#8c7038","54":"#8c6850","55":"#b04434","56":"#b44c20","57":"#987058","58":"#a07840","59":"#bc601c","5A":"#9c8448","5B":"#c45454","5C":"#c86c20","5D":"#ac7c58","5E":"#b08848","5F":"#c87c54","60":"#e07020","61":"#b89c54","62":"#fc2c00","63":"#c08c70","64":"#cc9850","65":"#e48430","66":"#e07070","67":"#d09878","68":"#f8883c","69":"#eca038","6A":"#d8b864","6B":"#e0a484","6C":"#f0b444","6D":"#f4c04c","6E":"#f0b08c","6F":"#fcd45c","70":"#fcb0b0","71":"#042410","72":"#142418","73":"#203c18","74":"#18480c","75":"#004430","76":"#186408","77":"#245c24","78":"#385c24","79":"#086c44","7A":"#287c14","7B":"#407434","7C":"#587830","7D":"#349c1c","7E":"#708438","7F":"#48a034","80":"#58904c","81":"#44bc28","82":"#849848","83":"#60b84c","84":"#18fc00","85":"#74dc5c","86":"#8cd07c","87":"#a0fc88","88":"#0c0c28","89":"#181848","8A":"#000058","8B":"#381444","8C":"#102468","8D":"#283c64","8E":"#282878","8F":"#4c1080","90":"#384c84","91":"#303094","92":"#48608c","93":"#385ca0","94":"#5050ac","95":"#4c6cac","96":"#5478bc","97":"#2460d8","98":"#6478d0","99":"#6490e0","9A":"#80a0dc","9B":"#a420fc","9C":"#8484f0","9D":"#a0a0fc","9E":"#90b8fc","9F":"#588c90","A0":"#68a0a4","A1":"#84c0c4","A2":"#98d0d4","A3":"#a8ccfc","A4":"#ccf4f4","A5":"#c0a080","A6":"#c4c0a8","A7":"#e0c494","A8":"#fce874","A9":"#c4fcb0","AA":"#fce4a4","AB":"#fcfcc4","AC":"#040404","AD":"#080808","AE":"#0c0c0c","AF":"#101010","B0":"#141414","B1":"#181818","B2":"#241c18","B3":"#202020","B4":"#242424","B5":"#282828","B6":"#302820","B7":"#303030","B8":"#383028","B9":"#343434","BA":"#34383c","BB":"#443834","BC":"#3c3c3c","BD":"#4c3c30","BE":"#404040","BF":"#44403c","C0":"#444444","C1":"#50483c","C2":"#584438","C3":"#4c4c4c","C4":"#604c3c","C5":"#34585c","C6":"#505050","C7":"#545454","C8":"#5c5c5c","C9":"#685c50","CA":"#606060","CB":"#447074","CC":"#7c6450","CD":"#686868","CE":"#6c6c6c","CF":"#786c60","D0":"#707070","D1":"#747474","D2":"#7c7c7c","D3":"#948064","D4":"#908474","D5":"#ac8870","D6":"#909090","D7":"#9c9484","D8":"#8094b8","D9":"#a0a0a0","DA":"#b0ac98","DB":"#acacac","DC":"#b8b8b8","DD":"#cccccc","DE":"#d8d8d8","DF":"#ccccfc","E0":"#e4e4e4","E1":"#fc0080","E2":"#101408","E3":"#141c08","E4":"#142008","E5":"#18240c","E6":"#202c0c","E7":"#203418","E8":"#30381c","E9":"#002044","EA":"#180068","EB":"#080804","EC":"#141410","ED":"#181814","EE":"#1c1c14","EF":"#1c2010","F0":"#242018","F1":"#242814","F2":"#282820","F3":"#2c2824","F4":"#202c30","F5":"#302c24","F6":"#343028","F7":"#38342c","F8":"#303c40","F9":"#403c34","FA":"#484438","FB":"#504c44","FC":"#5c584c","FD":"#605c54","FE":"#686458","FF":"#ffffff"},"clips":[31,34,35,40,259,309,317,329,418,422,619,705,770,869,1123,1166,1257,1349,1352,1802,2232,2246,2261,2301,2302,2324,2332,2333,2346,2348,2387,2399,2403,2437,2440,2443,2446,2447,2448,2464,2465,2472,2473,2475,2585,2594,2679,3915,3925,4249,4304,4609,4629,4632,4633,4639,4651,4707,4714,4715,4716,4717,4718,4719,4720,4721,4722,4723,4724,4725,4726,4727,4728,4729],"before":"9e60dae","after":"bb15833","examples":[{"key":"uni","what":"Uniques of no value tier","base":"Quhab","items":["Mage Slayer"],"level":1,"before":["Grail look",[[["ORANGE","*"],["GOLD","*"],["LIGHT_GRAY","* "],["WHITE",">  "],["GOLD","Quhab  "],["WHITE","< "],["LIGHT_GRAY","*"],["GOLD","*"],["ORANGE","*"]]],[["0B","69","6A","20"]],true,null],"after":["Grail look",[[["ORANGE","*"],["YELLOW","*"],["TAN","*"],["LIGHT_GRAY","* "],["WHITE",">  "],["GOLD","Quhab  "],["WHITE","< "],["LIGHT_GRAY","*"],["TAN","*"],["YELLOW","*"],["ORANGE","*"]]],[["0B","69","6A","20"]],true,[2594,"malus"]]},{"key":"minimal","what":"Minimal value uniques","base":"Matriarchal Bow","items":["Blood Raven's Charge"],"level":1,"before":["Minimal value",[[["RED","\\"],["ORANGE","\\\\  "],["GOLD",">  "],["WHITE","•  "],["GOLD","Matriarchal Bow  "],["WHITE","•  "],["GOLD","<  "],["ORANGE","/"],["ORANGE","/"],["RED","/"]]],[[null,"50","59","6A"]],true,null],"after":["Minimal value Grail look",[[["ORANGE","\\"],["YELLOW","\\"],["TAN","\\"],["LIGHT_GRAY","\\  "],["GOLD",">  "],["WHITE","*  "],["GOLD","Matriarchal Bow  "],["WHITE","*  "],["GOLD","<  "],["LIGHT_GRAY","/"],["TAN","/"],["YELLOW","/"],["ORANGE","/"]]],[["0B","69","6A","20"]],true,[2594,"malus"]]},{"key":"set","what":"Set items of no value tier","base":"Circlet","items":["Naj's Circlet"],"level":1,"before":["Grail look",[[["ORANGE","*"],["GREEN","*"],["DARK_GREEN","* "],["GREEN",">  "],["GREEN","Circlet  "],["GREEN","< "],["DARK_GREEN","*"],["GREEN","*"],["ORANGE","*"]]],[["71","76","7D","69"]],true,null],"after":["Grail look",[[["ORANGE","*"],["YELLOW","*"],["GREEN","*"],["DARK_GREEN","* "],["GREEN",">  "],["GREEN","Circlet  "],["GREEN","< "],["DARK_GREEN","*"],["GREEN","*"],["YELLOW","*"],["ORANGE","*"]]],[["71","76","7D","69"]],true,[2594,"malus"]]},{"key":"rings","what":"Set rings and amulets","base":"Ring","items":["Cathan's Seal","Angelic Halo","Bul-Kathos' Death Band"],"level":1,"before":["standard set look",[[["PURPLE","*"],["GREEN","*"],["DARK_GREEN","* "],["GREEN",">  "],["GREEN","Ring  "],["GREEN","< "],["DARK_GREEN","*"],["GREEN","*"],["PURPLE","*"]]],[["71","76","7D","69"]],true,null],"after":["Grail look",[[["ORANGE","*"],["YELLOW","*"],["GREEN","*"],["DARK_GREEN","* "],["GREEN",">  "],["GREEN","Ring  "],["GREEN","< "],["DARK_GREEN","*"],["GREEN","*"],["YELLOW","*"],["ORANGE","*"]]],[["71","76","7D","69"]],true,[2594,"malus"]]},{"key":"set12","what":"High and Medium value set items on level 12","base":"Scissors Suwayyah","items":["Natalya's Mark"],"level":12,"before":["name only",[[["GREEN","Scissors Suwayyah"]]],[["71","76","7D","69"]],true,null],"after":["Grail look",[[["ORANGE","*"],["YELLOW","*"],["GREEN","*"],["DARK_GREEN","* "],["GREEN",">  "],["GREEN","Scissors Suwayyah  "],["GREEN","< "],["DARK_GREEN","*"],["GREEN","*"],["YELLOW","*"],["ORANGE","*"]]],[["71","76","7D","69"]],true,[2594,"malus"]]},{"key":"high","what":"High and Medium value uniques","base":"Ring","items":["Nagelring","Manald Heal","The Stone of Jordan","Constricting Loop","Bul-Kathos' Wedding Band","Dwarf Star","Raven Frost","Nature's Peace","Wisp Projector","Carrion Wind"],"level":1,"before":["High value",[[["BLUE","\\\\"],["PURPLE","\\\\"],["RED","\\\\"],["ORANGE","\\\\  "],["GOLD",">  "],["WHITE","O  "],["GOLD","Ring  "],["WHITE","O  "],["GOLD","<  "],["ORANGE","/"],["ORANGE","/"],["RED","/"],["RED","/"],["PURPLE","/"],["PURPLE","/"],["BLUE","/"],["BLUE","/"]]],[["91","9B","62","68"]],true,[34,"quest hellforge place"]],"after":["High value",[[["BLUE","\\\\"],["PURPLE","\\\\"],["RED","\\\\"],["ORANGE","\\\\  "],["GOLD",">  "],["WHITE","O  "],["GOLD","Ring  "],["WHITE","O  "],["GOLD","<  "],["ORANGE","/"],["ORANGE","/"],["RED","/"],["RED","/"],["PURPLE","/"],["PURPLE","/"],["BLUE","/"],["BLUE","/"]]],[["91","9B","62","68"]],true,[34,"quest hellforge place"]]}],"counts":{"before":{"uni":225,"set":102},"after":{"uni":290,"set":123}}};
  /* upd-data:end */

  const $ = id => document.getElementById(id);
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  // a backslash is drawn as the slash mirrored (.bs): the web fonts space "\" wide, the game draws it like "/"
  function colored(color, text) {
    const s = el("span", "c-" + color);
    text.split("\\").forEach((part, i) => {
      if (i) s.append(el("span", "bs", "/"));
      if (part) s.append(part);
    });
    return s;
  }
  function label(lines) {
    const box = el("span", "d2");
    for (const segs of lines || []) {
      const ln = el("span", "ln");
      for (const [c, t] of segs) ln.append(colored(c, t));
      box.append(ln);
    }
    return box;
  }
  function icon(layers) {
    // the minimap icon: BORDER, MAP, DOT and PX as nested boxes of 8, 6, 4 and 2 game pixels, drawn at twice that
    const box = el("span", "icon");
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", "Minimap icon");
    const sizes = [16, 12, 8, 4];
    (layers || []).forEach((code, i) => {
      if (!code) return;
      const s = el("span");
      const px = sizes[i], off = (16 - px) / 2;
      s.style.cssText = `left:${off}px;top:${off}px;width:${px}px;height:${px}px;background:${DATA.palette[code] || "#888"}`;
      box.append(s);
    });
    return box;
  }
  // ---------- drop sounds: the game's own clips, as the Unique & Set Tiers page plays them ----------
  const CLIPS = new Set(DATA ? DATA.clips : []);
  const CLIP_BASE = (document.querySelector(".md-content") ? "../../" : "../") + "Erazure-Filter-Editor-Assets/sounds/";
  const STEPS = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97,
    107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963,
    1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484,
    7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767];
  const IDX = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];
  const clipCache = {};
  let audio = null, playing = null;
  function decode(buf) {
    const dv = new DataView(buf), rate = dv.getUint32(0, true), n = dv.getUint32(4, true);
    let pred = dv.getInt16(8, true), index = Math.min(dv.getUint16(10, true), 88);
    const out = new Float32Array(n), bytes = new Uint8Array(buf, 12);
    out[0] = pred / 32768;
    for (let i = 1; i < n; i++) {
      const b = bytes[(i - 1) >> 1], code = (i - 1) & 1 ? b >> 4 : b & 15, step = STEPS[index];
      let delta = step >> 3;
      if (code & 4) delta += step;
      if (code & 2) delta += step >> 1;
      if (code & 1) delta += step >> 2;
      pred = code & 8 ? Math.max(-32768, pred - delta) : Math.min(32767, pred + delta);
      index = Math.max(0, Math.min(88, index + IDX[code]));
      out[i] = pred / 32768;
    }
    return { rate, samples: out };
  }
  async function play(id, btn) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") await audio.resume();
      clipCache[id] = clipCache[id] || fetch(CLIP_BASE + id + ".adpcm").then(r => { if (!r.ok) throw new Error("no clip"); return r.arrayBuffer(); }).then(decode);
      const c = await clipCache[id];
      if (playing) { try { playing.stop(); } catch (e) { /* ended */ } }
      const buf = audio.createBuffer(1, c.samples.length, c.rate);
      buf.copyToChannel(c.samples, 0);
      const src = audio.createBufferSource();
      src.buffer = buf;
      src.connect(audio.destination);
      src.start();
      playing = src;
      btn.classList.add("on");
      src.onended = () => btn.classList.remove("on");
    } catch (e) {
      btn.disabled = true;
      btn.title = "This sound can't play here";
    }
  }
  function sound(s) {
    const wrap = el("span", "sound");
    if (CLIPS.has(+s[0])) {
      const b = el("button", "play", "▶");
      b.type = "button";
      b.title = "Play the drop sound";
      b.setAttribute("aria-label", "Play the drop sound: " + s[1]);
      b.addEventListener("click", () => play(+s[0], b));
      wrap.append(b);
    }
    wrap.append("sound: " + s[1]);
    return wrap;
  }
  // an outcome: [look's name, label, icons, chat, sound]
  function look(o) {
    const box = el("div", "look");
    box.append(label(o[1]));
    const marks = el("div", "marks");
    const ic = (o[2] || [])[0];
    if (ic && ic.some(Boolean)) marks.append(icon(ic));
    marks.append(el("span", "badge" + (o[3] ? "" : " off"), o[3] ? "chat" : "no chat"));
    marks.append(o[4] ? sound(o[4]) : el("span", "badge off", "no sound"));
    marks.append(el("span", "lname", o[0]));
    box.append(marks);
    return box;
  }
  function init() {
    if (!DATA) return;
    const c = DATA.counts;
    for (const [k, what] of [["uni", "uniques"], ["set", "set items"]]) {
      const box = el("div", "count");
      box.append(el("b", null, `${c.before[k]} → ${c.after[k]}`), el("span", null, `${what} that can show a Grail look before you discover them`));
      $("glCounts").append(box);
    }
    const tb = $("glTable").tBodies[0];
    for (const x of DATA.examples) {
      const tr = tb.insertRow();
      const item = tr.insertCell();
      item.className = "item";
      const more = x.items.length > 3 ? ` and ${x.items.length - 3} more` : "";
      item.append(el("b", null, x.what), el("small", null, `${x.base}: ${x.items.slice(0, 3).join(", ")}${more}`));
      if (x.level !== 1) item.append(el("small", null, `Filter level ${x.level}`));
      const same = JSON.stringify(x.before) === JSON.stringify(x.after);
      for (const [lab, o] of [["Before (October 31st)", x.before], ["After (November 5th)", x.after]]) {
        const td = tr.insertCell();
        td.dataset.label = lab;
        td.append(look(o));
        if (same && o === x.after) td.append(el("p", "same", "The same: their own look and sound."));
      }
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
