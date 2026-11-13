#!/usr/bin/env python3
"""Self-test of the IAS Calculator's engine (website/resources/IAS-Calculator.html), run in a headless Chromium
browser (Microsoft Edge on the author's PC, google-chrome on GitHub's runners), with the page's own DATA line.

    python tools/ias_selftest.py                 run every test; exit 1 on a failure
    python tools/ias_selftest.py --browser EXE   use that browser (else $EDITOR_BROWSER, then the usual places)
    python tools/ias_selftest.py --setup "c=bar&w=7cr&wi=20&g=20"
                                                 print the engine's result for one setup (the page's share-link keys)

Tests:
  cases       the hand-checked cases of tools/ias_cases.json: each setup's frames, speed, rate, the form's base
              speed, swing lengths and dual-wield choice, worked out by hand from the game's rules.
  invariants  random setups (every class, form, weapon the class can hold and attack it can use): frames are whole
              and at least 1; more IAS on gear never means more frames; each breakpoints row is the engine's result
              at its IAS; the frame grid's boxes are the engine's results; a Fastest Frames row reproduces its frames (its group's or fewer).
  shared      the Damage Calculator (website/resources/Damage-Calculator.html) runs the same engine on the same data:
              its ias-engine block is the page's, its IAS_DATA the part of the page's data the engine reads
              (tools/ias_data.py --sync writes them).
  previews    the attack previews (website/resources/IAS-Calculator-Sprites/) were drawn from the page's data, and
              every drawn animation's files are there (tools/ias_sprites.py check_files).
  infinity    Infinity Merc Bases (website/resources/Infinity-Merc-Bases.html) works out the Act 2 mercenary's Jab and
              basic attack with formulas of its own (its merc-speed block): from one attack to the next they must
              take the engine's frames, for every base it lists, at every item IAS from 0 to 150 and with skill IAS,
              and its bases' speeds must be the page's data's.
The engine (between the page's ias-engine markers) and the IAS_DATA line (between its calc-data markers) are loaded
into a test page of their own; nothing of the page's interface runs.
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
sys.path.insert(0, str(TOOLS))
import editor_selftest  # noqa: E402  (its headless browser runner)

PAGE = ROOT / "website" / "resources" / "IAS-Calculator.html"
INFINITY_PAGE = ROOT / "website" / "resources" / "Infinity-Merc-Bases.html"
CASES = TOOLS / "ias_cases.json"

TEST_JS = r"""
const DEF = {cls: "bar", form: "human", atk: 0, lvl: 20, tg: 5, w: "", wi: 0, oh: "none", w2: "", wi2: 0, gear: 0,
             fana: 0, frenzy: 0, fst: 5, inc: 0, bos: 0, hustle: false, ww: 0, other: 0, mon: "zombie"};
const out = {fail: [], ran: 0, info: {}};
function bad(name, msg) { out.fail.push(name + ": " + msg); }
function check(c) {
  out.ran++;
  const s = Object.assign({}, DEF, c.setup), r = IAS.evaluate(s), x = c.expect;
  if (x.why) { if (!r.why) bad(c.name, "should not be possible"); return; }
  if (r.why) { bad(c.name, "not possible: " + r.why); return; }
  const got = {frames: r.t.parts.map(p => p.frames), f0: r.t.parts[0].frames, eias: r.sp.eias, speed: r.sp.speed,
               rate: r.t.rate, swings: r.t.parts[0].swings, which: r.sp.which, wsm: r.sp.wsm, ias: r.sp.ias,
               skill: r.sp.skill, wc: r.p.wc, H: r.p.formBase ? r.p.formBase.H : undefined, base: r.t.base,
               hits: r.t.parts[0].hits, avg: r.t.avg ? r.t.avg.frames : undefined, parts: r.t.parts.length};
  Object.keys(x).forEach(k => {
    if (JSON.stringify(got[k]) !== JSON.stringify(x[k])) bad(c.name, `${k} is ${JSON.stringify(got[k])}, should be ${JSON.stringify(x[k])}`);
  });
}
CASES.forEach(check);

// random setups
let seed = 12345;
const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
const D = IAS.D, classes = D.cls.map(c => c[0]).concat((D.mercs || []).map(m => m.k)), forms = ["human", "human", "wolf", "bear"];
let checked = 0;
for (let i = 0; i < 1500; i++) {
  const cls = classes[rnd(classes.length)], merc = IAS.MERC[cls], form = merc ? "human" : forms[rnd(forms.length)];
  const bases = D.b.filter(b => IAS.canHold(cls, b.c));
  const w = rnd(8) === 0 ? "" : bases[rnd(bases.length)].c;
  const s = Object.assign({}, DEF, {cls, form, w, wi: rnd(60), gear: rnd(150), fana: rnd(3) ? 0 : rnd(25), ww: rnd(25),
                                    mon: ["zombie", "fallen", "bird"][rnd(3)],
                                    inc: cls === "bar" ? rnd(12) : 0, bos: cls === "ass" ? rnd(12) : 0, lvl: 1 + rnd(30), tg: 1 + rnd(6),
                                    frenzy: cls === "bar" && rnd(2) ? rnd(30) : 0, fst: rnd(6), other: rnd(4) ? 0 : rnd(60) - 30});
  const b = IAS.BASE[w];
  if (merc) { /* one weapon, no shield */ }
  else if (b && IAS.dualClass(cls) && IAS.canSecond(cls, b) && rnd(2)) {
    const seconds = bases.filter(x => IAS.canSecond(cls, x));
    s.oh = "weapon"; s.w2 = seconds[rnd(seconds.length)].c; s.wi2 = rnd(40);
  } else if (b && !IAS.twoHanded(cls, b) && b.wc !== "bow" && b.wc !== "xbw" && rnd(2)) s.oh = "shield";
  const skills = merc ? merc.atk : D.sk.filter(k => k.c === cls || !k.c).concat(D.os.map(o => IAS.SKILL[o[0]]).filter(Boolean));
  s.atk = rnd(3) ? 0 : skills.length ? skills[rnd(skills.length)].id : 0;
  const r = IAS.evaluate(s);
  if (r.why) continue;
  checked++;
  const name = JSON.stringify(s);
  r.t.parts.forEach(p => { if (!Number.isInteger(p.frames) || p.frames < 1) bad("random " + name, "frames " + p.frames); });
  // more IAS on gear: never more frames
  const more = IAS.evaluate(Object.assign({}, s, {gear: s.gear + 1 + rnd(40)}));
  // more IAS never means more frames, but in a channel with a timer (Blade Fury: a loop shorter than its timer)
  if (!r.p.channel) r.t.parts.forEach((p, k) => { if (more.t.parts[k].frames > p.frames) bad("random " + name, "more IAS, more frames"); });
  if (r.t.avg && r.t.avg.frames !== (r.t.parts[0].frames + r.t.parts[1].frames) / 2) bad("random " + name, "the average isn't attack 1 and 2's");
  if (r.p.fx && more.t.parts[0].frames !== r.t.parts[0].frames) bad("random " + name, "a fixed speed changed with IAS");
  // breakpoints: each row is the engine at its gear IAS, frames never go up
  if (!r.p.fixed && !r.p.fx) {
    const bp = IAS.breakpoints(s);
    let prev = Infinity;
    bp.rows.forEach(row => {
      const again = IAS.evaluate(Object.assign({}, s, {gear: row.gear}));
      if (again.t.parts[0].frames !== row.r.t.parts[0].frames) bad("breakpoints " + name, "row at " + row.gear + " differs");
      if (row.r.t.parts[0].frames > prev && !r.p.channel) bad("breakpoints " + name, "frames go up at " + row.gear);
      prev = row.r.t.parts[0].frames;
      if (row.gear > 0) {
        const less = IAS.evaluate(Object.assign({}, s, {gear: row.gear - 1}));
        const key = x => x.t.parts.map(p => p.swings ? p.swings.join("/") : p.frames).join(",");
        if (key(less) === key(row.r)) bad("breakpoints " + name, "one IAS less is as fast at " + row.gear);
      }
    });
    // the IAS to spare (from no IAS on other gear, and from no IAS at all): that much less keeps the frames, one more
    // less doesn't (where a slower row is below)
    [false, true].forEach(fromNone => {
      const b2 = IAS.breakpoints(s, fromNone);
      if (!b2.rows.length) return;
      const key = x => x.t.parts.map(p => p.swings ? p.swings.join("/") : p.frames).join(",");
      const at = gear => key(IAS.evaluate(Object.assign({}, s, {gear})));
      const what = `spare ${fromNone ? "from none " : ""}${name}`;
      if (b2.spare < 0 || b2.spare !== s.gear - b2.rows[b2.you].gear) bad(what, "spare " + b2.spare);
      else if (at(s.gear - b2.spare) !== at(s.gear)) bad(what, `${b2.spare} IAS less changes the frames`);
      else if (b2.you > 0 && at(s.gear - b2.spare - 1) === at(s.gear)) bad(what, `${b2.spare + 1} IAS less keeps the frames`);
    });
    if (i % 25 === 0) {
      const g = IAS.grid(s, [0, s.wi, 40], [0, s.gear, 100]);
      [0, s.wi, 40].forEach((wi, a) => [0, s.gear, 100].forEach((gear, c) => {
        const e = IAS.evaluate(Object.assign({}, s, {wi, gear}));
        if (g[a][c].f !== (e.t.avg ? e.t.avg.frames : e.t.parts[0].frames)) bad("grid " + name, `box ${wi}/${gear}`);
      }));
    }
  }
}
out.info.random = checked;
// Fastest Frames: each row's setup gives its frames
let ffRows = 0;
D.cls.map(c => c[0]).forEach(cls => ["human", "wolf", "bear"].forEach(form => {  // the classes (no mercenaries)
  IAS.fastest(cls, form, code => (IAS.BASE[code] ? IAS.BASE[code].m || 0 : 0)).forEach(group => group.rows.forEach(row => {
    ffRows++;
    const s = Object.assign({}, DEF, {cls, form, w: row.g.s.w, oh: row.g.s.oh, w2: row.g.s.w2 || "", wi: row.wi, gear: row.other});
    const r = IAS.evaluate(s);
    if (r.why) bad(`fastest ${cls} ${form}`, "a row's setup isn't possible: " + r.why);
    else if (r.t.parts[0].frames > group.frames || r.t.parts[0].frames !== row.frames)
      bad(`fastest ${cls} ${form}`, `${JSON.stringify(s)} gives ${r.t.parts[0].frames}, the row says ${row.frames} (for ${group.frames})`);
  }));
}));
out.info.fastest = ffRows;
// Infinity Merc Bases: its own Jab and basic attack formulas against the engine, from one attack to the next
let infRows = 0;
const JAB = IAS.MERC.m2.atk.find(a => a.n === "Jab").id;
INF.RAW.forEach(([code, name, , wsm]) => {
  if (!IAS.BASE[code] || !IAS.canHold("m2", code)) { bad("infinity " + name, "the Desert Mercenary can't hold it"); return; }
  if (IAS.BASE[code].w !== wsm) bad("infinity " + name, `speed ${wsm}, the IAS Calculator's data says ${IAS.BASE[code].w}`);
  [0, 9, 18, 27, 36, 45, 60].forEach(sias => {
    for (let ias = 0; ias <= 150; ias++) {
      const t = INF.totalSpeed(ias, wsm, sias);
      [[JAB, INF.jabFrames, "Jab"], [0, INF.swingFrames, "basic attack"]].forEach(([atk, len, what]) => {
        infRows++;
        const r = IAS.evaluate(Object.assign({}, DEF, {cls: "m2", atk, w: code, gear: ias, other: sias}));
        if (r.why) bad(`infinity ${name} ${what}`, r.why);
        else if (len(t) + INF.AI_GAP !== r.t.parts[0].frames)
          bad(`infinity ${name} ${what}`, `${ias} IAS, ${sias} skill IAS: ${len(t)} + ${INF.AI_GAP} frames, the engine ${r.t.parts[0].frames}`);
      });
    }
  });
});
out.info.infinity = infRows;
"""

PAGE_HTML = """<!doctype html>
<html><head><meta charset="utf-8"><title>IAS Calculator self-test</title></head>
<body><pre id="result">running</pre>
<script>
"use strict";
__DATA__
__ENGINE__
__INFINITY__
const CASES = __CASES__;
__MODE__
</script></body></html>
"""


def blocks():
    text = PAGE.read_text(encoding="utf-8")

    def between(a, b):
        i, j = text.index(a) + len(a), text.index(b)
        return text[i:j]
    return between("/* calc-data:start */", "/* calc-data:end */"), between("/* ias-engine:start */", "/* ias-engine:end */")


def infinity_js():
    """Infinity Merc Bases' speed formulas (its merc-speed block) and bases (its RAW line), as the test page's INF."""
    text = INFINITY_PAGE.read_text(encoding="utf-8")
    a, b = "/* merc-speed:start */", "/* merc-speed:end */"
    speed = text[text.index(a) + len(a):text.index(b)]
    raw = re.search(r"^\s*const RAW = \[.*\];$", text, re.M).group(0)
    return ("const INF = (function () {\n" + raw + "\n" + speed +
            "\nreturn {totalSpeed, jabFrames, swingFrames, AI_GAP, RAW};\n})();")


def run(browser, cases, mode_js):
    data, engine = blocks()
    html = (PAGE_HTML.replace("__DATA__", data).replace("__ENGINE__", engine).replace("__INFINITY__", infinity_js())
            .replace("__CASES__", json.dumps(cases)).replace("__MODE__", mode_js))
    return editor_selftest.run_page(browser, html, {}, timeout=600)


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Self-test of the IAS Calculator page's engine.")
    ap.add_argument("--browser", help="a Chromium browser (Edge or Chrome)")
    ap.add_argument("--setup", help="print the engine's result for one setup (share-link keys)")
    args = ap.parse_args()
    browser = editor_selftest.find_browser(args.browser)
    if args.setup:
        keys = {"c": "cls", "f": "form", "a": "atk", "l": "lvl", "t": "tg", "w": "w", "wi": "wi", "o": "oh", "w2": "w2",
                "wj": "wi2", "g": "gear", "fa": "fana", "fr": "frenzy", "fs": "fst", "in": "inc", "bs": "bos", "hu": "hustle",
                "ww": "ww", "ot": "other", "mo": "mon"}
        s = {}
        for kv in args.setup.lstrip("#").split("&"):
            k, _, v = kv.partition("=")
            if k in keys:
                s[keys[k]] = v if k in ("c", "f", "w", "w2", "o", "mo") else (v == "1" if k == "hu" else int(v))
        js = ("const DEF = {cls: 'bar', form: 'human', atk: 0, lvl: 20, tg: 5, w: '', wi: 0, oh: 'none', w2: '', wi2: 0, "
              "gear: 0, fana: 0, frenzy: 0, fst: 5, inc: 0, bos: 0, hustle: false, ww: 0, other: 0, mon: 'zombie'};"
              "const s = Object.assign({}, DEF, CASES), r = IAS.evaluate(s), bp = r.why ? null : IAS.breakpoints(s);"
              "document.getElementById('result').textContent = JSON.stringify({why: r.why || '', parts: r.why ? [] : "
              "r.t.parts.map(p => ({label: p.label, frames: p.frames, swings: p.swings, anim: p.anim && p.anim.code})), "
              "speed: r.sp, base: r.t && r.t.base, rate: r.t && r.t.rate, formBase: r.p.formBase, "
              "breakpoints: bp && bp.rows.map(x => [x.gear, x.r.t.parts.map(p => p.swings ? p.swings.join('/') : p.frames).join(' / ')])});")
        print(json.dumps(run(browser, s, js), indent=1))
        return
    import ias_data
    import ias_sprites
    shared = []
    if not ias_data.sync(check=True):
        shared.append("shared: the Damage Calculator's engine or data isn't the IAS Calculator's")
    shared += ["previews: " + b for b in ias_sprites.check_files(ias_sprites.page_data())]
    cases = json.loads(CASES.read_text(encoding="utf-8"))["cases"]
    js = TEST_JS + "\ndocument.getElementById('result').textContent = JSON.stringify(out);"
    res = run(browser, cases, js)
    res["fail"] = shared + res["fail"]
    for f in res["fail"][:60]:
        print("ias_selftest: FAIL", f)
    if len(res["fail"]) > 60:
        print(f"ias_selftest: ... and {len(res['fail']) - 60} more")
    print(f"ias_selftest: {res['ran']} cases, {res['info'].get('random', 0)} random setups, "
          f"{res['info'].get('fastest', 0)} Fastest Frames rows, {res['info'].get('infinity', 0)} Infinity Merc Bases "
          f"setups: {'FAILED' if res['fail'] else 'ok'}")
    sys.exit(1 if res["fail"] else 0)


if __name__ == "__main__":
    main()
