#!/usr/bin/env python3
"""Self-test of the Filter Editor's JavaScript (tools/editor/*.js), run in a headless Chromium browser (Microsoft Edge
on the author's PC, google-chrome on GitHub's runners) against what the Python tools do.

    python tools/editor_selftest.py                run every test; exit 1 on a failure
    python tools/editor_selftest.py --only NAME    run the tests whose name starts with NAME
    python tools/editor_selftest.py --browser EXE  use that browser (else $EDITOR_BROWSER, then the usual places)
    python tools/editor_selftest.py --decode FILE  print the editor changes saved in a filter (its EDITS lines)

Tests:
  versions   every launcher version built by the editor with no edits is byte for byte the root filter (CRC32 and
             size), so a player who changes nothing downloads exactly the launcher's file.
  features   every feature of tools/editor/features.js finds its sections, aliases or lines in today's filter, and
             Erazure's options (050) parse.
  edits      every golden edit set of tools/editor_fixtures/ built by the editor (its lines, the aliases written out)
             equals this file's Python reference built on tools/build.py's own functions, line by line; the
             reference writes the aliases out with build.py's --check verification (BH reads every rule of the
             written file as it reads the edited alias form), and the EDITS header decodes to the edit set.
  engine     the engine (tools/editor/engine.js, BH's rules ported) on hand-checked cases from BH's source: formulas
             (Formula.h: precedence, functions, float math, BH's number), conditions (implicit AND, AND / OR left to
             right, a ) without its (, words BH drops, a rule with no condition left), whole rules (name and
             description passes, %NL% where BH allows it, TrimItemText, the 56-letter cut, unknown keywords,
             notifications and %TIER-n%, hiding and invisibility, Force Show, named formulas and $f islands).
  paste      items BH copies in the game (Ctrl+C: its JSON) read into the preview's items: base, quality, flags,
             the unique or set item, its stats as the game holds them, the socket fillers.
  tiers      the engine on Erazure - Main against tools/tier_map.py's model (the Unique / Set Tiers page): every
             unique and set base, unidentified on the ground, in every scenario the page has (filter level,
             character level, class, ethereal, place, discovered): its label, chat line, drop sound and minimap icon.

The page under test is served over http from a temporary folder; the browser writes the results as JSON into the
page, which --dump-dom prints.
"""
import argparse
import base64
import functools
import http.server
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import zlib
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
EDITOR = ROOT / "tools" / "editor"
SOURCE = ROOT / "Erazure-Filter-Editor-Source.js"
FIXTURES = ROOT / "tools" / "editor_fixtures"
MODULES = ["core.js", "ui.js", "store.js", "filter.js", "features.js", "edits.js", "engine.js", "items.js"]  # in order
TESTS_JS = ROOT / "tools" / "editor_selftest.js"  # the engine tests' code
BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge",
]

PAGE = """<!doctype html>
<html><head><meta charset="utf-8"><title>Filter Editor self-test</title></head>
<body><pre id="result">running</pre>
__SCRIPTS__
<script src="source.js"></script>
<script>
const EXPECT = __EXPECT__;
const ONLY = __ONLY__;
const results = [], running = [];
function test(name, fn) {
  if (ONLY && !name.startsWith(ONLY)) return;
  const t0 = performance.now();
  const done = (detail) => results.push({name, ok: !detail || !detail.fail, detail: detail || null,
                                         ms: Math.round(performance.now() - t0)});
  const fail = (e) => results.push({name, ok: false, detail: {fail: String(e && e.stack || e)},
                                    ms: Math.round(performance.now() - t0)});
  try {
    const r = fn();
    if (r && r.then) running.push(r.then(done, fail)); else done(r);
  } catch (e) { fail(e); }
}
const src = window.ERAZURE_EDITOR_SOURCE;
const C = EZ.core;
function crcs(lines) { return lines.map((l) => C.crc32(new TextEncoder().encode(l)).toString(36)); }

test("versions", () => {
  const bad = [], times = [];
  for (const v of src.variants) {
    const t0 = performance.now();
    const built = C.buildVariant(src, v);
    times.push(Math.round(performance.now() - t0));
    const crc = C.crc32(built.bytes), want = EXPECT.files[v.file];
    if (!want) { bad.push(`${v.file}: no root file`); continue; }
    if (crc !== want.crc || built.bytes.length !== want.size) {
      bad.push(`${v.file}: crc ${crc.toString(16)} size ${built.bytes.length}, root ${want.crc.toString(16)} ${want.size}`);
    }
  }
  return {fail: bad.length ? bad.join("; ") : null, versions: src.variants.length, ms: times};
});

test("features", () => {
  const F = EZ.filter, bad = [];
  const main = src.variants.find((v) => v.name === src.main);
  const lines = C.variantLines(src, main);
  const secs = F.sections(src, lines), aliases = Object.keys(F.aliases(lines));
  let switched = 0;
  for (const f of EZ.features) {
    for (const s of f.sections || []) {
      if (!secs[s]) { bad.push(`${f.id}: no section ${s}`); continue; }
      let n = 0;
      for (let i = secs[s][0]; i < secs[s][1]; i++) {
        const r = lines[i].startsWith("ItemDisplay[") ? F.rule(lines[i]) : null;
        if (r && F.continues(r.out) && !F.notifies(r.out)) n++;
      }
      if (!n) bad.push(`${f.id}: ${s} has no %CONTINUE% rule without alerts to switch off`);
      switched += n;
    }
    if (f.aliases) {
      const names = Array.isArray(f.aliases) ? f.aliases : aliases.filter((a) => f.aliases.test(a));
      if (!names.length) bad.push(`${f.id}: no alias matches`);
      for (const a of names) if (aliases.indexOf(a) < 0) bad.push(`${f.id}: no Alias[${a}]`);
    }
    if (f.switchOn) {
      const r = secs[f.switchOn.section];
      if (!r) bad.push(`${f.id}: no section ${f.switchOn.section}`);
      else if (!lines.slice(r[0], r[1]).some((l) => /^\\s*\\/\\//.test(l) && l.indexOf(f.switchOn.match) >= 0)) {
        bad.push(`${f.id}: no switched-off line with ${f.switchOn.match}`);
      }
    }
  }
  const groups = F.options(src, lines);
  const opts = groups.reduce((n, g) => n + g.options.length, 0);
  if (!groups.length || !opts) bad.push("050's options didn't parse");
  return {fail: bad.length ? bad.join("; ") : null, features: EZ.features.length, rulesTheySwitch: switched,
          optionGroups: groups.length, options: opts};
});

test("edits", async () => {
  const out = {};
  for (const name of Object.keys(EXPECT.fixtures)) {
    const fx = EXPECT.fixtures[name];
    const p = EZ.store.normalize({name: fx.name, file: fx.file, edits: JSON.parse(JSON.stringify(fx.edits))});
    const variant = src.variants.find((v) => v.toggle === EXPECT.toggle[name] && (v.style || null) === EXPECT.style[name]);
    const r = EZ.edits.apply(src, p, C.variantLines(src, variant));
    const lines = C.written(src, r.lines);
    const header = r.report.count ? await EZ.edits.headerLines(src, p, variant, r.report.count) : [];
    const decoded = header.length ? await EZ.edits.fromFile(header.join("\\n")) : null;
    out[name] = {variant: variant.name, count: r.report.count, unplaced: r.report.unplaced, crcs: crcs(lines),
                 header: header.length, decoded};
  }
  return {results: out};
});

</script>
<script src="tests.js"></script>
<script>
Promise.all(running).then(() => { document.getElementById("result").textContent = JSON.stringify(results); });
</script></body></html>
"""


# ---------------------------------------------------------------- the browser

def find_browser(given):
    for cand in [given, os.environ.get("EDITOR_BROWSER")] + BROWSERS:
        if not cand:
            continue
        if os.path.isabs(cand) and Path(cand).exists():
            return cand
        found = shutil.which(cand)
        if found:
            return found
    sys.exit("editor_selftest: no Chromium browser found (Edge or Chrome); pass --browser or set EDITOR_BROWSER")


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def run_page(browser, html, files, timeout=900):
    """Serve html (index.html) and files ({name: path}) from a temporary folder, load the page in the headless browser
    and return the JSON it wrote into #result."""
    with tempfile.TemporaryDirectory(prefix="editor-selftest-") as tmp:
        tmp = Path(tmp)
        (tmp / "index.html").write_text(html, encoding="utf-8")
        for name, path in files.items():
            shutil.copyfile(path, tmp / name)
        profile = tmp / "profile"
        httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(tmp)))
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        try:
            url = f"http://127.0.0.1:{httpd.server_address[1]}/index.html"
            cmd = [browser, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
                   "--disable-extensions", "--disable-background-networking", f"--user-data-dir={profile}",
                   "--virtual-time-budget=120000", "--dump-dom", url]
            out = subprocess.run(cmd, capture_output=True, timeout=timeout, encoding="utf-8", errors="replace")
        finally:
            httpd.shutdown()
    m = re.search(r'<pre id="result">(.*?)</pre>', out.stdout, re.S)
    if not m:
        sys.exit(f"editor_selftest: the browser printed no result.\nstdout: {out.stdout[:2000]}\n"
                 f"stderr: {out.stderr[:2000]}")
    text = m.group(1).replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"').replace("&amp;", "&")
    if text == "running":
        sys.exit("editor_selftest: the page's script stopped before writing its results (a syntax error?)\n"
                 f"stderr: {out.stderr[:4000]}")
    return json.loads(text)


def load_source():
    text = SOURCE.read_text(encoding="ascii")
    return json.loads(text[text.index("=") + 1:text.rindex(";")])


# ---------------------------------------------------------------- the Python reference of tools/editor/edits.js

FEATURE_RE = re.compile(r"\{id: \"([\w-]+)\".*?(?=\n  \{id: |\n\];)", re.S)
COLORS = ["WHITE", "RED", "GREEN", "BLUE", "GOLD", "GRAY", "BLACK", "TAN", "ORANGE", "YELLOW", "PURPLE",
          "DARK_GREEN", "CORAL", "SAGE", "TEAL", "LIGHT_GRAY"]
RULE_RE = re.compile(r"^(\s*//+\s*)?(ItemDisplay\[)")
ALIAS_RE = re.compile(r"^Alias\[([A-Za-z0-9_]+)\]:(.*)$")
NOTIFY_RE = re.compile(r"%(?:BORDER|MAP|DOT|PX|LINE)-[0-9a-f]{1,4}%|%SOUNDID-\d{1,4}%", re.I)
ICON_RE = re.compile(r"%(BORDER|MAP|DOT|PX)-([0-9a-f]{1,4})%", re.I)
SOUND_RE = re.compile(r"%SOUNDID-\d{1,4}%", re.I)
TIER_RE = re.compile(r"%TIER-(\d)%", re.I)
FILTLVL_RE = re.compile(r"FILTLVL(=|<|>|~)(\d+)(?:-(\d+))?")
SIZES = ["BORDER", "MAP", "DOT", "PX"]


def features():
    """The feature definitions of tools/editor/features.js: [(id, on default, sections, aliases (list or regex),
    switch-on (section, match))]."""
    text = (EDITOR / "features.js").read_text(encoding="utf-8")
    out = []
    for m in FEATURE_RE.finditer(text):
        body = m.group(0)
        secs = re.findall(r'"(\d{3}-[\w-]+\.filter)"', body.split("switchOn")[0]) if "sections:" in body else []
        al = None
        a = re.search(r"aliases: (\[[^\]]*\]|/[^/]+/)", body)
        if a:
            al = json.loads(a.group(1)) if a.group(1).startswith("[") else re.compile(a.group(1)[1:-1])
        so = re.search(r'switchOn: \{section: "([^"]+)", match: "([^"]+)"\}', body)
        on = not re.search(r"\bon: false\b", body)
        out.append((m.group(1), on, secs, al, (so.group(1), so.group(2)) if so else None))
    return out


def rule(line):
    m = RULE_RE.match(line)
    if not m:
        return None
    off = m.group(1) or ""
    text = line[len(off):]
    c = text.find("//")
    code = text if c < 0 else text[:c]
    j = code.find(":")
    if j < 0:
        return None
    key = code[:j].strip()
    if not key.endswith("]"):
        return None
    return {"off": off, "cond": key[len("ItemDisplay["):-1], "out": code[j + 1:],
            "comment": "" if c < 0 else text[c:], "head": off + code[:j + 1]}


def each_output(lines, fn):
    for i, line in enumerate(lines):
        r = rule(line)
        if r:
            out = fn(r["out"])
            if out != r["out"]:
                lines[i] = r["head"] + out + r["comment"]


def sections(src, lines):
    lst = src["sections"]
    out = {}
    if len(lines) == len(src["lines"]):
        for k, (name, start) in enumerate(lst):
            out[name] = [start, lst[k + 1][1] if k + 1 < len(lst) else len(lines)]
        return out
    at = 0
    for k, (name, start) in enumerate(lst):
        first = src["lines"][start]
        while at < len(lines) and lines[at] != first:
            at += 1
        out[name] = [at, len(lines)]
        if k:
            out[lst[k - 1][0]][1] = at
    return out


def aliases(lines):
    out = {}
    for i, line in enumerate(lines):
        m = ALIAS_RE.match(line)
        if m and m.group(1) not in out:
            out[m.group(1)] = i
    return out


def set_alias(lines, name, value):
    re_ = re.compile(r"^Alias\[" + name + r"\]:")
    for i, line in enumerate(lines):
        if re_.match(line):
            lines[i] = f"Alias[{name}]:{value}"
            return True
    return False


def options050(src, lines):
    rng = sections(src, lines).get("050-customization.filter")
    out, group, opt = {}, None, None
    for i in range(*rng) if rng else []:
        line = lines[i]
        g = re.match(r"^//\s+=+\s+(.+?)\s+=+\s*$", line)
        if g:
            group, opt = g.group(1), None
            continue
        if group is None:
            continue
        if not line.strip():
            opt = None
            continue
        r = rule(line)
        if r and r["off"]:
            if opt is not None:
                out[opt].append(i)
            continue
        lab = re.match(r"^//\s{2,}(\S.*?)\s*$", line)
        if lab and not lab.group(1).startswith("="):
            opt = f"{group} / {lab.group(1)}"
            out.setdefault(opt, [])
    return out


def resized(combo, how):
    parts = [k.split("-") for k in combo.split(" ") if k]
    if how == "smaller":
        moved = []
        for lay, col in parts:
            k = SIZES.index(lay.upper()) + 1
            if k < len(SIZES):
                moved.append(f"{SIZES[k]}-{col}")
        return " ".join(moved)
    if how == "bigger" and parts and not any(lay.upper() == "BORDER" for lay, _ in parts):
        outer = next((p for p in parts if p[0].upper() == "MAP"), parts[0])
        return " ".join([f"BORDER-{outer[1]}"] + [f"{lay}-{col}" for lay, col in parts])
    return combo


def compares(op, a, b, level):
    if op == "=":
        return level == a
    if op == "<":
        return level < a
    if op == ">":
        return level > a
    return level == a if b is None else a <= level <= b


def copy_levels(cond, copies):
    def sub(m):
        tok, op, a, b = m.group(0), m.group(1), int(m.group(2)), (int(m.group(3)) if m.group(3) else None)
        yes = [n for n, mm in copies if compares(op, a, b, mm) and not compares(op, a, b, n)]
        no = [n for n, mm in copies if not compares(op, a, b, mm) and compares(op, a, b, n)]
        if not yes and not no:
            return tok
        inner = tok
        if no:
            inner = "(" + " ".join(f"!FILTLVL={n}" for n in no) + " " + tok + ")"
        if yes:
            inner = "(" + " OR ".join(f"FILTLVL={n}" for n in yes) + " OR " + inner + ")"
        return inner
    return FILTLVL_RE.sub(sub, cond)


def count(e, feats):
    n = sum(1 for v in (e.get("options") or {}).values() if v)
    n += sum(1 for fid, on, *_ in feats if fid in (e.get("features") or {}) and bool(e["features"][fid]) != on)
    lv = e.get("levels") or {}
    n += len(lv.get("names") or {}) + len(lv.get("copies") or {})
    n += len(e.get("looks") or {}) + len(e.get("remap") or {}) + len(e.get("icons") or {})
    a = e.get("alerts") or {}
    n += len(e.get("sounds") or {}) + sum(1 for k in ("noSounds", "noIcons", "iconsOnly") if a.get(k))
    n += 1 if a.get("iconSize") in ("smaller", "bigger") else 0
    return n


def reference(src, edits, lines, feats):
    """tools/editor/edits.js's apply, in Python: the version's lines with the edit set, before the write-out."""
    lines = list(lines)
    # Erazure's options (050)
    opts = options050(src, lines)
    for oid, on in (edits.get("options") or {}).items():
        if on and oid in opts:
            for i in opts[oid]:
                lines[i] = re.sub(r"^\s*//+\s*", "", lines[i], count=1)
    # features
    want = edits.get("features") or {}
    for fid, on_default, secs, al, so in feats:
        if fid not in want or bool(want[fid]) == on_default:
            continue
        on = bool(want[fid])
        if secs and not on:
            rngs = sections(src, lines)
            for s in secs:
                for i in range(*rngs[s]):
                    if lines[i].startswith("ItemDisplay["):
                        r = rule(lines[i])
                        if r and "%CONTINUE%" in r["out"] and not NOTIFY_RE.search(r["out"]):
                            lines[i] = "//" + lines[i]
        elif al is not None and not on:
            names = al if isinstance(al, list) else [n for n in aliases(lines) if al.search(n)]
            for n in names:
                set_alias(lines, n, "FALSE")
        elif so and on:
            rng = sections(src, lines)[so[0]]
            for i in range(*rng):
                r = rule(lines[i])
                if r and r["off"] and so[1] in lines[i]:
                    lines[i] = re.sub(r"^\s*//+\s*", "", lines[i], count=1)
    # looks
    for name, value in (edits.get("looks") or {}).items():
        if isinstance(value, str):
            set_alias(lines, name, value)
    # color remap
    m = edits.get("remap") or {}
    keys = [k for k in m if k in COLORS and m[k] in COLORS and m[k] != k]
    if keys:
        swap = lambda s: re.sub("%(" + "|".join(COLORS) + ")%", lambda mm: f"%{m[mm.group(1)]}%" if mm.group(1) in keys
                                else mm.group(0), s)  # noqa: E731
        each_output(lines, swap)
        for i, line in enumerate(lines):
            a = ALIAS_RE.match(line)
            if a and "%" in a.group(2) and not a.group(2).lstrip().startswith("("):
                lines[i] = f"Alias[{a.group(1)}]:{swap(a.group(2))}"
    # sounds
    smap, al = edits.get("sounds") or {}, edits.get("alerts") or {}
    if al.get("noSounds") or smap:
        def sound(mm):
            if al.get("noSounds"):
                return ""
            sid = str(int(mm.group(0)[9:-1]))
            if sid not in smap:
                return mm.group(0)
            to = int(smap[sid])
            return f"%SOUNDID-{to}%" if to > 0 else ""
        each_output(lines, lambda out: SOUND_RE.sub(sound, out))
    # icons
    imap, size = edits.get("icons") or {}, al.get("iconSize") if al.get("iconSize") in ("smaller", "bigger") else None
    if al.get("noIcons") or size or imap:
        def icon(out):
            combo = " ".join(f"{a.upper()}-{b.upper()}" for a, b in ICON_RE.findall(out))
            if not combo:
                return out
            to = combo
            if al.get("noIcons"):
                to = ""
            else:
                if combo in imap and isinstance(imap[combo], str):
                    to = imap[combo]
                if size:
                    to = resized(to, size)
            if to == combo:
                return out
            first = ICON_RE.search(out).start()
            rest = ICON_RE.sub("", out)
            return rest[:first] + "".join(f"%{k}%" for k in to.split(" ") if k) + rest[first:]
        each_output(lines, icon)
    # alert switches
    if al.get("iconsOnly"):
        each_output(lines, lambda out: out if not NOTIFY_RE.search(out) else
                    (TIER_RE.sub("%TIER-0%", out) if TIER_RE.search(out) else out + "%TIER-0%"))
    # filter levels
    lv = edits.get("levels") or {}
    found = [i for i, line in enumerate(lines) if line.startswith("ItemDisplayFilterName[]:")][:12]
    for k, text in (lv.get("names") or {}).items():
        n = int(k)
        if 1 <= n <= len(found) and isinstance(text, str):
            line = lines[found[n - 1]]
            colon = line.index(":") + 1
            c = line.find("//", colon)
            lines[found[n - 1]] = line[:colon] + text.replace("//", "/") + ("" if c < 0 else line[c:])
    copies = sorted((int(k), int(v)) for k, v in (lv.get("copies") or {}).items())
    copies = [(n, mm) for n, mm in copies if 1 <= n <= len(found) and 1 <= mm <= len(found) and n != mm]
    if copies:
        out = []
        for line in lines:
            a = ALIAS_RE.match(line)
            if a and "FILTLVL" in a.group(2):
                out.append(f"Alias[{a.group(1)}]:{copy_levels(a.group(2), copies)}")
                continue
            r = rule(line)
            if not r or ("FILTLVL" not in r["cond"] and not TIER_RE.search(r["out"])):
                out.append(line)
                continue
            cond = copy_levels(r["cond"], copies)
            rebuilt = lambda c, o: f"{r['off']}ItemDisplay[{c}]:{o}{r['comment']}"  # noqa: E731
            tier = TIER_RE.search(r["out"])
            if not tier:
                out.append(rebuilt(cond, r["out"]))
                continue
            t = int(tier.group(1))
            on = [n for n, mm in copies if t >= mm and not t >= n]
            off = [n for n, mm in copies if not t >= mm and t >= n]
            if not on and not off:
                out.append(rebuilt(cond, r["out"]))
                continue
            these = " OR ".join(f"FILTLVL={x}" for x in on + off)
            out.append(rebuilt(f"{cond} !({these})", r["out"]))
            if on:
                out.append(rebuilt(cond + " (" + " OR ".join(f"FILTLVL={x}" for x in on) + ")",
                                   TIER_RE.sub("", r["out"], count=1)))
            if off:
                out.append(rebuilt(cond + " (" + " OR ".join(f"FILTLVL={x}" for x in off) + ")",
                                   TIER_RE.sub("%TIER-0%", r["out"], count=1)))
        lines = out
    # the Cube's Custom mark
    n = count(edits, feats)
    if n:
        v = src["version"]
        for i, line in enumerate(lines):
            if line.startswith("ItemDisplay[box]") and v in line:
                lines[i] = line.replace(v, f"{v} - Custom ({n} change{'' if n == 1 else 's'})", 1)
                break
    return lines, n


def variant_lines(src, variant):
    """core.js's variantLines, in Python: the toggle block, then Minimal's alias lines or the Corrlorized patch."""
    lines = list(src["lines"])
    for name, items in src["toggles"].items():
        for i, body in items:
            lines[i] = body if name == variant["toggle"] else "//" + body
    style = src["styles"].get(variant["style"]) if variant["style"] else None
    if style and style["kind"] == "aliases":
        for i, line in enumerate(lines):
            m = re.match(r"^Alias\[([A-Za-z0-9_]+)\]:", line)
            if m and m.group(1) in style["lines"]:
                lines[i] = style["lines"][m.group(1)]
    elif style:
        after = {}
        for i, line in style["patch"]["inserted"]:
            after.setdefault(i, []).append(line)
        out = []
        for i, line in enumerate(lines):
            out.append(style["patch"]["replaced"].get(str(i), line))
            out += after.get(i, [])
        lines = out
    return lines


def written(src, lines):
    """The aliases written out by build.py itself, with its --check verification (BH reads the same rules)."""
    if not src["writeOut"]:
        return lines
    out = build.write_out_aliases([x.encode("utf-8") for x in lines], lambda i: f"line {i + 1}", True)
    return [x.decode("utf-8") for x in out]


def fixture_variant(src, edits):
    b = edits["base"]
    parts = []
    if b.get("revealed"):
        parts.append("Revealed")
    if b.get("bigGG"):
        parts.append("BIG GG")
    if b.get("poe") or b.get("style") == "corrlorized":
        parts.append("PoE")
    if not b.get("revealed") and not b.get("bigGG"):
        parts.insert(0, "Main")
    toggle = "Erazure - " + " - ".join(parts)
    style = {"erazure": None, "minimal": "minimal.filter", "corrlorized": "corrlorized.edits"}[b.get("style", "erazure")]
    return toggle, style


def check_edits(src, detail, fixtures):
    """Compare each fixture's JS lines (by CRC) with the reference; return failure messages."""
    feats, bad = features(), []
    for name, fx in fixtures.items():
        js = detail["results"].get(name)
        if not js:
            bad.append(f"{name}: no result from the page")
            continue
        toggle, style = fixture_variant(src, fx["edits"])
        variant = next(v for v in src["variants"] if v["toggle"] == toggle and v["style"] == style)
        lines, n = reference(src, fx["edits"], variant_lines(src, variant), feats)
        try:
            lines = written(src, lines)
        except SystemExit as e:
            bad.append(f"{name}: the written-out filter doesn't read as its alias form ({e})")
            continue
        want = [format(zlib.crc32(x.encode("utf-8")) & 0xffffffff, "x") for x in lines]
        got = [format(int(c, 36), "x") for c in js["crcs"]]
        if js["count"] != n:
            bad.append(f"{name}: the page counts {js['count']} changes, the reference {n}")
        if len(got) != len(want):
            bad.append(f"{name}: {len(got)} lines from the page, {len(want)} from the reference")
        for i, (a, b) in enumerate(zip(got, want)):
            if a != b:
                bad.append(f"{name}: line {i + 1} differs; the reference has: {lines[i][:200]}")
                break
        if js.get("unplaced"):
            bad.append(f"{name}: unplaced edits {js['unplaced']}")
        dec = js.get("decoded")
        if n and (not dec or dec.get("edits", {}).get("base") != fx["edits"]["base"] or dec.get("name") != fx["name"]):
            bad.append(f"{name}: the EDITS header doesn't decode to the edit set")
    return bad


# ---------------------------------------------------------------- --decode

def decode(path):
    text = Path(path).read_text(encoding="utf-8", errors="replace")
    parts, total = {}, 0
    for m in re.finditer(r"^// EDITS (\d+)/(\d+) (\S+)\s*$", text, re.M):
        parts[int(m.group(1))], total = m.group(3), int(m.group(2))
    if not total or len(parts) != total:
        sys.exit(f"{path}: no complete EDITS lines (not saved by the Filter Editor, or edited by hand since)")
    data = "".join(parts[k] for k in range(1, total + 1))
    raw = base64.urlsafe_b64decode(data[1:] + "=" * (-len(data[1:]) % 4))
    if data[0] == "z":
        raw = zlib.decompress(raw, -15)
    print(json.dumps(json.loads(raw.decode("utf-8")), indent=1, ensure_ascii=False))


# ---------------------------------------------------------------- the engine's cases (from BH's source)

# formulas: (text, item stats, the character, what BH shows: its %.2f with ".00" / one trailing 0 dropped; None: the
# formula doesn't compile, so BH leaves the island as text)
ENGINE_FORMULAS = [
    ("1+2*3", {}, {}, "7"), ("2^3^2", {}, {}, "512"), ("-2^2", {}, {}, "4"), ("(1+2)*3", {}, {}, "9"),
    ("7/2", {}, {}, "3.5"), ("1/3", {}, {}, "0.33"), ("2/3", {}, {}, "0.67"), ("0.125", {}, {}, "0.12"),
    ("0.375", {}, {}, "0.38"), ("0.625", {}, {}, "0.62"), ("0.005", {}, {}, "0"), ("floor(7/2)", {}, {}, "3"),
    ("round(-2.5)", {}, {}, "-3"), ("round(2.5)", {}, {}, "3"), ("mod(7,3)", {}, {}, "1"), ("min(3,1,2)", {}, {}, "1"),
    ("max(3,1,2)", {}, {}, "3"), ("countif(1,2,1,1)", {}, {}, "2"), ("count(0,1,2)", {}, {}, "2"),
    ("if(0,1,2)", {}, {}, "2"), ("and(1,0)", {}, {}, "0"), ("or(0,2)", {}, {}, "1"), ("xor(1,1,1)", {}, {}, "1"),
    ("abs(-3)", {}, {}, "3"), ("sign(-0.5)", {}, {}, "-1"), ("1/0", {}, {}, "f_err"), ("-0.001", {}, {}, "-0"),
    ("2147483648", {}, {}, "2147483648"), ("2147483904", {}, {}, "f_err"), ("stat0", {"0": 5}, {}, "5"),
    ("stat7", {"7": 10240}, {}, "40"), ("multi7,0", {"7": 10240}, {}, "40"), ("STAT0*2", {"0": 5}, {}, "10"),
    ("stat0+", {}, {}, None), ("max()", {}, {}, None), ("foo", {}, {}, None), ("stat", {}, {}, None),
    ("1 2", {}, {}, None), ("cl8", {}, {}, "f_err"), ("and(cl8,0)", {}, {}, "0"), ("5.", {}, {}, "5"),
    (".5", {}, {}, "0.5"), ("1e2", {}, {}, "100"), ("sqrt(2)", {}, {}, "1.41"), ("ln(0)", {}, {}, "f_err"),
    ("average(1,2)", {}, {}, "1.5"), ("pow(2,10)", {}, {}, "1024"), ("!0", {}, {}, "1"), ("!5", {}, {}, "0"),
    ("3>2", {}, {}, "1"), ("2==2", {}, {}, "1"), ("1!=1", {}, {}, "0"), ("2>=3", {}, {}, "0"),
    ("1+2==3", {}, {}, "1"), ("clvl", {}, {"clvl": 90}, "90"), ("stat218/8*clvl", {"218": 3}, {"clvl": 90}, "33.75"),
]
# conditions: (text, item, the character, 1 / 0)
ENGINE_CONDITIONS = [
    ("TRUE OR FALSE FALSE", {}, {}, 0), ("FALSE TRUE OR TRUE", {}, {}, 1), ("!TRUE OR TRUE", {}, {}, 1),
    ("!(TRUE OR TRUE)", {}, {}, 0), ("TRUE) FALSE", {}, {}, 1), ("(TRUE", {}, {}, 1), ("TRUE (FALSE", {}, {}, 0),
    ("FOOBAR TRUE", {}, {}, 1), ("FOOBAR FALSE", {}, {}, 0), ("FOOBAR", {}, {}, 1), ("", {}, {}, 1),
    ("ILVL>abc", {"ilvl": 5}, {}, 1), ("ILVL>abc FALSE", {"ilvl": 5}, {}, 0), ("ILVL>", {"ilvl": 5}, {}, 1),
    ("ILVL>4 ILVL<6", {"ilvl": 5}, {}, 1), ("ILVL~5-9", {"ilvl": 5}, {}, 1), ("ILVL~6-9", {"ilvl": 5}, {}, 0),
    ("ILVL", {"ilvl": 5}, {}, 0), ("r30", {"code": "r30"}, {}, 1), ("r30 OR r31", {"code": "r31"}, {}, 1),
    ("7cr", {"code": "7cr2"}, {}, 0), ("7cr2", {"code": "7cr2"}, {}, 1),
    ("LIFE>39", {"stats": {"7": 10240}}, {}, 1), ("LIFE>40", {"stats": {"7": 10240}}, {}, 0),
    ("STAT7>39", {"stats": {"7": 10240}}, {}, 1), ("MULTI7,0>39", {"stats": {"7": 10240}}, {}, 1),
    ("RES>10", {"stats": {"39": 11, "41": 11, "43": 11, "45": 11}}, {}, 1),
    ("RES>10", {"stats": {"39": 11, "41": 10, "43": 11, "45": 11}}, {}, 0),
    ("STR+DEX>9", {"stats": {"0": 5, "2": 5}}, {}, 1), ("STR+DEX~5-20", {"stats": {"0": 5, "2": 5}}, {}, 0),
    ("SK54>2", {"stats": {"107,54": 3}}, {}, 1), ("SK54x>2", {"stats": {"107,54": 3}}, {}, 1),
    ("CHSK54>2", {"stats": {"204,3459": 5}}, {}, 1), ("CHSK54>3", {"stats": {"204,3459": 3}}, {}, 0),
    ("$f(STAT0*2)>9", {"stats": {"0": 5}}, {}, 1), ("$f(STAT0*2)", {"stats": {"0": 5}}, {}, 1),
    ("$f(STAT0-5)", {"stats": {"0": 5}}, {}, 0), ("$f(FOO)>1 TRUE", {"code": "r30"}, {}, 0),
    ("CLVL>89", {}, {"clvl": 90}, 1), ("FILTLVL=3", {}, {"filtlvl": 3}, 1), ("AMAZON", {}, {"cls": 0}, 1),
    ("AMAZON>3", {}, {"cls": 0}, 1), ("MAPID=0", {}, {"mapid": 0}, 0), ("GOLD>100", {"code": "rin"}, {}, 0),
    ("GOLD>100", {"code": "gld", "stats": {"14": 500}}, {}, 1),
]
# whole rules: (lines, item, the character, the game's options, what BH gives: name / desc / hidden / invisible /
# forced / sound / chat / icons / cut)
ENGINE_RULES = [
    (["ItemDisplay[r30]: %NAME% x%CONTINUE%", "ItemDisplay[r30]: [%NAME%]{%NAME%desc}"],
     {"code": "r30", "quality": "NORM", "id": True, "gameName": "Ber Rune"}, {"filtlvl": 1}, {},
     {"name": "[Ber Rune x]", "desc": "desc"}),
    (["ItemDisplay[]: %NAME%%NL%two"], {"code": "rin", "quality": "RARE", "id": False, "gameName": "Ring"},
     {"filtlvl": 1}, {}, {"name": "Ringtwo"}),
    (["ItemDisplay[]: %NAME%%NL%two"], {"code": "rin", "quality": "RARE", "id": True, "gameName": "Ring\nGrim Coil"},
     {"filtlvl": 1}, {}, {"name": "Ring\nGrim Coil\ntwo"}),
    (["ItemDisplay[]: %NAME%%NL%a%NL%b"], {"code": "x", "quality": "SUP", "id": True, "gameName": "X",
      "base": {"groups": [], "staffmod": False, "autoprefix": 0}}, {"filtlvl": 1}, {}, {"name": "X\nab"}),
    (["ItemDisplay[]: %NAME%%NL%a"], {"code": "x", "quality": "NORM", "id": True, "gameName": "X",
      "base": {"groups": [], "staffmod": False, "autoprefix": 0}}, {"filtlvl": 1}, {}, {"name": "Xa"}),
    (["ItemDisplay[]: %CL%a%CL%%CL%b%CS%%CS%c%CS%"], {"code": "x", "quality": "UNI", "id": True, "gameName": "X"},
     {"filtlvl": 1}, {}, {"name": "a\nb c"}),
    (["ItemDisplay[]: %RED%" + "x" * 60], {"code": "x", "quality": "UNI", "id": True, "gameName": "X"},
     {"filtlvl": 1}, {}, {"name": "ÿc1" + "x" * 56, "cut": {"name": 4, "copy": 0}}),
    (["ItemDisplay[]: %FOO%bar %RED5% %red%x %PERCENT%"], {"code": "x", "quality": "UNI", "id": True,
      "gameName": "X"}, {"filtlvl": 1}, {}, {"name": "%FOO%bar %RED5% ÿc1x %"}),
    (["ItemDisplay[]: a{b %SOUNDID-5%}%SOUNDID-7%"], {"code": "x", "quality": "UNI", "id": True, "gameName": "X"},
     {"filtlvl": 1}, {}, {"name": "a", "desc": "b %SOUNDID-5%", "sound": 7}),
    (["ItemDisplay[r30]: %NAME%%BORDER-21%%TIER-0%%CONTINUE%", "ItemDisplay[r30]: %NAME%%MAP-0A%%SOUNDID-100%"],
     {"code": "r30", "quality": "NORM", "id": True, "gameName": "Ber Rune"}, {"filtlvl": 5}, {},
     {"sound": 100, "icons": [[0x21, None, None, None], [None, 0x0A, None, None]], "chatRule": 1}),
    (["ItemDisplay[r30]: %NAME%%BORDER-21%%TIER-0%%CONTINUE%", "ItemDisplay[r30]: %NAME%%MAP-0A%%SOUNDID-100%"],
     {"code": "r30", "quality": "NORM", "id": True, "gameName": "Ber Rune"}, {"filtlvl": 0}, {},
     {"sound": 0, "chatRule": 0}),
    (["ItemDisplay[r30]: %NAME%%BORDER-21%%TIER-0%", "ItemDisplay[r30]: %NAME%%MAP-0A%%SOUNDID-100%"],
     {"code": "r30", "quality": "NORM", "id": True, "gameName": "Ber Rune"}, {"filtlvl": 5}, {},
     {"sound": 0, "chatRule": None, "icons": [[0x21, None, None, None]]}),
    (["ItemDisplay[r30 FILTLVL>0]:"], {"code": "r30", "quality": "NORM", "id": True, "gameName": "Ber Rune"},
     {"filtlvl": 1}, {}, {"name": "", "hidden": True, "invisible": True}),
    (["ItemDisplay[r30 FILTLVL>0]:"], {"code": "r30", "quality": "NORM", "id": True, "gameName": "Ber Rune"},
     {"filtlvl": 0}, {}, {"name": "Ber Rune", "hidden": False}),
    (["ItemDisplay[r30 FILTLVL>0]:", "ItemDisplay[r30]: %NAME%%MAP-0A%"],
     {"code": "r30", "quality": "NORM", "id": True, "gameName": "Ber Rune"}, {"filtlvl": 1}, {},
     {"name": "", "hidden": True, "invisible": False}),
    (["ItemDisplay[r30]: %CONTINUE%", "ItemDisplay[r30]: x%NAME%"],
     {"code": "r30", "quality": "NORM", "id": True, "gameName": "Ber Rune"}, {"filtlvl": 1}, {},
     {"name": "x", "invisible": True}),
    (["ItemDisplay[$f(STAT0*2)>9]: %NAME% $f(STAT0/8)"], {"code": "x", "quality": "UNI", "id": True,
      "gameName": "X", "stats": {"0": 5}}, {"filtlvl": 1}, {}, {"name": "X 0.62"}),
    (["Formula[test]: stat0+1", "ItemDisplay[FORMULATEST>5]: ok %FORMULATEST%"], {"code": "x", "quality": "UNI",
      "id": True, "gameName": "X", "stats": {"0": 5}}, {"filtlvl": 1}, {}, {"name": "ok 6"}),
    (["ItemDisplay[LIFE>39]: %LIFE% %STAT7% %MULTI7,0%"], {"code": "x", "quality": "UNI", "id": True,
      "gameName": "X", "stats": {"7": 10240}}, {"filtlvl": 1}, {}, {"name": "40 40 10240"}),
    (["ItemDisplay[uap FILTLVL>0]:"], {"code": "uap", "quality": "UNI", "id": False, "gameName": "Shako",
      "disc": {"ALLDISCOVERED": False}}, {"filtlvl": 1}, {}, {"name": "Shako", "forced": True, "invisible": False}),
    (["ItemDisplay[uap FILTLVL>0]:"], {"code": "uap", "quality": "UNI", "id": False, "gameName": "Shako",
      "disc": {"ALLDISCOVERED": True}}, {"filtlvl": 1}, {}, {"name": "", "forced": False, "invisible": True}),
    (["ItemDisplay[hp5]: %NAME%%MAP-0A%"], {"code": "hp5", "quality": "NORM", "id": True, "gameName": "Potion"},
     {"filtlvl": 0}, {"hideHealing": True}, {"name": "", "invisible": True, "icons": []}),
    (["Alias[ME]:r30", "ItemDisplay[ME]: %ME%!"], {"code": "r30", "quality": "NORM", "id": True,
      "gameName": "Ber"}, {"filtlvl": 1}, {}, {"name": "r30!"}),
]


# items BH copies in the game (Ctrl+C, StashExport::CopyItemJSONToClipboard's JSON) and what the editor makes of them
PASTE_CASES = [
    ({"type": "Shako", "quality": "Unique", "iLevel": 87, "location": "Stash", "isEthereal": False,
      "unidentified": False, "sockets": 1, "defense": 141, "quantity": 0, "name": "Harlequin Crest",
      "stats": [{"name": "item_allskills", "stat_id": 127, "value": 2},
                {"name": "item_hp_perlevel", "stat_id": 216, "value": 8},
                {"name": "item_magicbonus", "stat_id": 80, "value": 47, "range": {"min": 25, "max": 50}},
                {"name": "strength", "stat_id": 0, "value": 2}, {"name": "maxhp", "stat_id": 7, "value": 30}],
      "socketed": [{"type": "Ber Rune", "quality": "Normal", "iLevel": 1, "isRune": True}]},
     {"code": "uap", "quality": "UNI", "id": True, "sockets": 1, "place": "STASH", "filled": 1},
     {"127": 2, "216": 2048, "80": 47, "0": 2, "7": 7680, "31": 141, "194": 1}, 1),
    ({"type": "Grand Charm", "quality": "Magic", "iLevel": 91, "location": "Inventory", "isEthereal": False,
      "unidentified": False, "sockets": 0, "defense": 0, "quantity": 0, "name": "Sparking Grand Charm of Life",
      "stats": [{"name": "item_addskill_tab", "skill": "Lightning Skills (Sorceress)", "value": 1},
                {"name": "maxhp", "stat_id": 7, "value": 40}]},
     {"code": "cm3", "quality": "MAG", "id": True, "name": "Sparking Grand Charm of Life"},
     {"188,9": 1, "7": 10240}, 0),
]


def tier_cases():
    """tools/tier_map.py's outcomes on Erazure - Main for every unique and set base, unidentified on the ground, in
    every scenario of the page: [[kind, code, eth, class, clvl, place, grail, level, chat, sound, icons, label, look]]."""
    import tier_map as T
    groups, _, variants, _ = T.analyse()
    main = variants[build.MAIN] if build.MAIN in variants else variants["Erazure - Main"]
    out = []
    for g in groups:
        if not g.base:
            continue
        for sc in g.dims.scenarios():
            a = dict(zip(T.DIMS, sc))
            if any(a[t] != main[t] for t in T.TOGGLES):
                continue
            look, chat, sound, icons = g.table[sc]
            label = T.label(g, sc, main) if look != "HIDDEN" else None
            out.append([g.kind, g.code, a["ETH"], a["CLASS"], a["CLVL"], a["LOC"], a["GRAIL"], a["FILTLVL"], chat,
                        sound, [list(i) for i in icons], label, look])
    return out


# ---------------------------------------------------------------- main

def expectations(src, only=""):
    files = {}
    for v in src["variants"]:
        path = ROOT / v["file"]
        if path.exists():
            raw = path.read_bytes()
            files[v["file"]] = {"crc": zlib.crc32(raw) & 0xffffffff, "size": len(raw)}
    fixtures = {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in sorted(FIXTURES.glob("*.json"))}
    toggle, style = {}, {}
    for name, fx in fixtures.items():
        toggle[name], style[name] = fixture_variant(src, fx["edits"])
    out = {"files": files, "fixtures": fixtures, "toggle": toggle, "style": style,
           "engine": {"formulas": ENGINE_FORMULAS, "conditions": ENGINE_CONDITIONS, "rules": ENGINE_RULES}}
    import editor_map
    data = editor_map.page_data()
    out.update(catalog=data["catalog"], soundCount=data["soundCount"], paste=PASTE_CASES)
    if not only or "tiers".startswith(only[:5]) or only.startswith("tiers"):
        out["tiers"] = tier_cases()
    return out


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Self-test the Filter Editor's JavaScript in a headless browser.")
    ap.add_argument("--only", default="", help="run only the tests whose name starts with this")
    ap.add_argument("--browser", help="the Chromium browser to run (Edge or Chrome)")
    ap.add_argument("--decode", metavar="FILE", help="print the editor changes saved in a filter")
    args = ap.parse_args()
    if args.decode:
        decode(args.decode)
        return
    if not SOURCE.exists():
        sys.exit("editor_selftest: Erazure-Filter-Editor-Source.js is missing (run: python tools/build.py)")
    src = load_source()
    browser = find_browser(args.browser)
    expect = expectations(src, args.only)
    scripts = "\n".join(f'<script src="{m}"></script>' for m in MODULES)
    html = (PAGE.replace("__SCRIPTS__", scripts)
                .replace("__EXPECT__", json.dumps(expect))
                .replace("__ONLY__", json.dumps(args.only or None)))
    files = {m: EDITOR / m for m in MODULES}
    files["source.js"] = SOURCE
    files["tests.js"] = TESTS_JS
    results = run_page(browser, html, files)
    for r in results:
        if r["name"] == "edits" and r["ok"]:
            bad = check_edits(src, r["detail"], expect["fixtures"])
            r["detail"] = {"fail": "; ".join(bad)} if bad else {"edit sets": len(expect["fixtures"])}
            r["ok"] = not bad
    failed = [r for r in results if not r["ok"]]
    for r in results:
        detail = r.get("detail") or {}
        note = detail.get("fail") if not r["ok"] else ", ".join(f"{k} {v}" for k, v in detail.items()
                                                               if k not in ("fail", "examples"))
        print(f"{'ok  ' if r['ok'] else 'FAIL'} {r['name']} ({r['ms']} ms){': ' + str(note) if note else ''}")
        if not r["ok"] and detail.get("examples"):
            print(json.dumps(detail["examples"], ensure_ascii=False, indent=1)[:12000])
    if not results:
        sys.exit("editor_selftest: no test ran")
    if failed:
        sys.exit(f"editor_selftest: {len(failed)} of {len(results)} tests failed")
    print(f"All {len(results)} Filter Editor tests passed.")


if __name__ == "__main__":
    main()
