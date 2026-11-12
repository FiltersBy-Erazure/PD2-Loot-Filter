/* The Filter Editor's drop sounds: the game's own clips (Erazure-Filter-Editor-Assets/sounds, written by
   tools/editor_assets.py from the game's MPQs as 4-bit IMA ADPCM: its sample rate, length, first sample and step
   index, then two samples a byte, low nibble first), decoded here when played and played through Web Audio. */
var EZ = typeof EZ !== "undefined" ? EZ : {};
EZ.sound = (function () {
  "use strict";
  let info = null, baseUrl = "", ctx = null, playing = null;
  const clips = {};
  const STEPS = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80,
    88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796,
    876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358,
    5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086,
    29794, 32767];
  const INDEX = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];

  function init(assets, base) {
    info = assets && assets.sounds ? assets : null;
    baseUrl = base || "";
  }
  function has(id) { return !!(info && info.sounds[String(id)]); }

  /* The clip's samples: {rate, samples (Float32Array)}. */
  function decode(buf) {
    const dv = new DataView(buf);
    const rate = dv.getUint32(0, true), n = dv.getUint32(4, true);
    let pred = dv.getInt16(8, true), index = Math.min(dv.getUint16(10, true), 88);
    const out = new Float32Array(n), bytes = new Uint8Array(buf, 12);
    out[0] = pred / 32768;
    for (let i = 1; i < n; i++) {
      const b = bytes[(i - 1) >> 1], code = (i - 1) & 1 ? b >> 4 : b & 15;
      const step = STEPS[index];
      let delta = step >> 3;
      if (code & 4) delta += step;
      if (code & 2) delta += step >> 1;
      if (code & 1) delta += step >> 2;
      pred = code & 8 ? Math.max(-32768, pred - delta) : Math.min(32767, pred + delta);
      index = Math.max(0, Math.min(88, index + INDEX[code]));
      out[i] = pred / 32768;
    }
    return {rate, samples: out};
  }

  function load(id) {
    const s = info.sounds[String(id)];
    if (!clips[id]) {
      clips[id] = fetch(baseUrl + s.file + (s.v ? "?v=" + s.v : "")).then((r) => {
        if (!r.ok) throw new Error("no clip");
        return r.arrayBuffer();
      }).then(decode);
    }
    return clips[id];
  }

  /* Play a drop sound; resolves false when there's no clip or the browser won't play. */
  function play(id) {
    if (!has(id)) return Promise.resolve(false);
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return Promise.resolve(false);
    }
    return load(id).then((pcm) => {
      if (ctx.state === "suspended") ctx.resume();
      if (playing) { try { playing.stop(); } catch (e) { /* done */ } }
      const buf = ctx.createBuffer(1, pcm.samples.length, pcm.rate);
      buf.getChannelData(0).set(pcm.samples);
      const src = ctx.createBufferSource(), gain = ctx.createGain();
      gain.gain.value = 0.8;
      src.buffer = buf;
      src.connect(gain).connect(ctx.destination);
      src.start();
      playing = src;
      return true;
    }).catch(() => false);
  }

  /* A ▶ button that plays the sound, or the game's own test command when the editor has no clip of it. */
  function button(id, name) {
    const {h} = EZ.ui;
    if (!has(id)) return h("span.fe-sub", {title: "Type this in the game's chat to hear it"}, `.playsound ${id}`);
    return h("button.fe-btn.ghost.small.fe-play", {type: "button", title: "Play " + (name || "the sound"),
      "aria-label": "Play " + (name || "the sound " + id), onclick: (e) => {
        e.stopPropagation();
        play(id).then((ok) => { if (!ok) EZ.ui.toast("The browser didn't play the sound."); });
      }}, "▶");
  }

  return {init, has, play, button, decode};
})();
