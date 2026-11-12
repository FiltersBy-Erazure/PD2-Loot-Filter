#!/usr/bin/env python3
"""Self-test of the Filter Editor's JavaScript (tools/editor/*.js), run in a headless Chromium browser (Microsoft Edge
on the author's PC, google-chrome on GitHub's runners) against what the Python tools do.

    python tools/editor_selftest.py                run every test; exit 1 on a failure
    python tools/editor_selftest.py --only NAME    run the tests whose name starts with NAME
    python tools/editor_selftest.py --browser EXE  use that browser (else $EDITOR_BROWSER, then the usual places)

Tests:
  versions    every launcher version built by the editor with no edits is byte for byte the root filter
              (CRC32 and size), so a player who changes nothing downloads exactly the launcher's file.

The page under test is served over http from a temporary folder (so canvas and image tests can read pixels later);
the browser writes the results as JSON into the page, which --dump-dom prints.
"""
import argparse
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
ROOT = Path(__file__).resolve().parent.parent
EDITOR = ROOT / "tools" / "editor"
SOURCE = ROOT / "Erazure-Filter-Editor-Source.js"
MODULES = ["core.js"]  # in load order
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
const results = [];
function test(name, fn) {
  if (ONLY && !name.startsWith(ONLY)) return;
  const t0 = performance.now();
  try {
    const detail = fn();
    results.push({name, ok: !detail || !detail.fail, detail: detail || null, ms: Math.round(performance.now() - t0)});
  } catch (e) {
    results.push({name, ok: false, detail: {fail: String(e && e.stack || e)}, ms: Math.round(performance.now() - t0)});
  }
}
const src = window.ERAZURE_EDITOR_SOURCE;
test("versions", () => {
  const C = EZ.core, bad = [], times = [];
  for (const v of src.variants) {
    const t0 = performance.now();
    const built = C.buildVariant(src, v);
    times.push(Math.round(performance.now() - t0));
    const crc = C.crc32(built.bytes), want = EXPECT.files[v.file];
    if (!want) { bad.push(`${v.file}: no root file`); continue; }
    if (crc !== want.crc || built.bytes.length !== want.size) {
      let at = -1;
      bad.push(`${v.file}: crc ${crc.toString(16)} size ${built.bytes.length}, root ${want.crc.toString(16)} ` +
               `${want.size}`);
    }
  }
  return {fail: bad.length ? bad.join("; ") : null, versions: src.variants.length, ms: times};
});
document.getElementById("result").textContent = JSON.stringify(results);
</script></body></html>
"""


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


def serve(folder):
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(folder)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def run_page(browser, html, files, timeout=600):
    """Serve html (index.html) and files ({name: path}) from a temporary folder, load the page in the headless browser
    and return the JSON it wrote into #result."""
    with tempfile.TemporaryDirectory(prefix="editor-selftest-") as tmp:
        tmp = Path(tmp)
        (tmp / "index.html").write_text(html, encoding="utf-8")
        for name, path in files.items():
            shutil.copyfile(path, tmp / name)
        profile = tmp / "profile"
        httpd = serve(tmp)
        try:
            url = f"http://127.0.0.1:{httpd.server_address[1]}/index.html"
            cmd = [browser, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
                   "--disable-extensions", "--disable-background-networking", f"--user-data-dir={profile}",
                   "--virtual-time-budget=60000", "--dump-dom", url]
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


def expectations():
    """What the root filters are: {file: {crc, size}} for every file the source's versions name."""
    text = SOURCE.read_text(encoding="ascii")
    data = json.loads(text[text.index("=") + 1:text.rindex(";")])
    files = {}
    for v in data["variants"]:
        path = ROOT / v["file"]
        if path.exists():
            raw = path.read_bytes()
            files[v["file"]] = {"crc": zlib.crc32(raw) & 0xffffffff, "size": len(raw)}
    return {"files": files}


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Self-test the Filter Editor's JavaScript in a headless browser.")
    ap.add_argument("--only", default="", help="run only the tests whose name starts with this")
    ap.add_argument("--browser", help="the Chromium browser to run (Edge or Chrome)")
    args = ap.parse_args()
    if not SOURCE.exists():
        sys.exit("editor_selftest: Erazure-Filter-Editor-Source.js is missing (run: python tools/build.py)")
    browser = find_browser(args.browser)
    scripts = "\n".join(f'<script src="{m}"></script>' for m in MODULES)
    html = (PAGE.replace("__SCRIPTS__", scripts)
                .replace("__EXPECT__", json.dumps(expectations()))
                .replace("__ONLY__", json.dumps(args.only or None)))
    files = {m: EDITOR / m for m in MODULES}
    files["source.js"] = SOURCE
    results = run_page(browser, html, files)
    failed = [r for r in results if not r["ok"]]
    for r in results:
        detail = r.get("detail") or {}
        note = detail.get("fail") if not r["ok"] else ", ".join(f"{k} {v}" for k, v in detail.items() if k != "fail")
        print(f"{'ok  ' if r['ok'] else 'FAIL'} {r['name']} ({r['ms']} ms){': ' + str(note) if note else ''}")
    if not results:
        sys.exit("editor_selftest: no test ran")
    if failed:
        sys.exit(f"editor_selftest: {len(failed)} of {len(results)} tests failed")
    print(f"All {len(results)} Filter Editor tests passed.")


if __name__ == "__main__":
    main()
