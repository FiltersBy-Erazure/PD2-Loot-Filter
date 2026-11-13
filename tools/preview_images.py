"""The website's link-preview pictures: website/docs/img/previews/<name>.png, 1200 x 630 each.

Discord and other sites show a page's picture under a link to it (og:image). website/overrides/main.html writes the
tags from a page's `image:` front matter line; a page without one gets default.png. The author's choice (2026-11-13):
- designed cards for Ohm vs Jewel Comparison, Run Speed Visualizer, the IAS Calculator and the Grail Planner: the
  page's name over parts of the page itself, moved into the card;
- screenshots for Unique & Set Tiers, Map Experience and Infinity Base Comparison;
- the site's name beside the lynx holding the PD2 coin (tools/preview_mascot.png) for every other page.

    python tools/preview_images.py [NAME ...] [--no-build]

Builds the site into tools/.cache/preview-site with the MkDocs of site_preview.bat, serves it on a free local port and
takes each picture in headless Edge or Chrome through the DevTools protocol. Every run uses a new browser profile, so
every page starts from its defaults. Not run by build.bat, the hook or CI: rerun it after a change to how one of these
pages looks. The Run Speed Visualizer card catches the race in motion, so it comes out a little different each run.
"""
import argparse
import base64
import functools
import http.server
import json
import os
import shutil
import socket
import struct
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "website" / "docs" / "img" / "previews"
SITE = ROOT / "tools" / ".cache" / "preview-site"
VENV = ROOT / "tools" / ".cache" / "mkdocs-venv"
MASCOT = ROOT / "tools" / "preview_mascot.png"
SIZE = (1200, 630)  # a page's width in CSS pixels must be a multiple of 40, so its height (21/40 of it) is whole

# the page behind a card stays as it is; these strips at the bottom of the screen would show through a screenshot
HIDE = (".md-header,.md-tabs,.md-top,.md-footer,.md-content__button,"
        ".dock,#mm-dock,#dm-dock,#fr-dock,#ia-bar{display:none!important}")

# url: the page, from the site's root. w: its width in CSS pixels (the picture is 1200 wide, so 800 shows it at
# 1.5x). wait: seconds after the page has loaded; settle: seconds after the card or the scroll, before the shot.
# card: a designed card (see CARD_JS); sel / off: a screenshot from that element, off pixels under the top;
# scroll: JavaScript that scrolls instead; css: added to the page first.
SHOTS = [
    dict(name="ohm-vs-jewel-comparison", url="resources/ohm-vs-jewel-comparison/", w=920, wait=1.5,
         card=dict(root=".ohm-map", title="Ohm vs Jewel Comparison", size=32, gap=14, parts=["#oj-verdict"])),
    dict(name="run-speed-visualizer", url="resources/run-speed-visualizer/", w=800, wait=1.0, settle=2.7,
         card=dict(root=".frw-map", title="Run Speed Visualizer", gap=14, grid="align-content:start;gap:10px",
                   parts=["#fr-stage", "#fr-race-res"])),
    dict(name="ias-calculator", url="resources/ias-calculator/", w=920, wait=2.0, settle=1.2,
         card=dict(root=".ias-map", title="IAS Calculator", grid="grid-template-columns:1fr 1.1fr",
                   parts=["#ia-answer", "#ia-stage"], hide=["#ia-answer button"],
                   style=[["#ia-stage", "width:100%;height:auto;border-radius:8px"]]),
         # the setup the card shows: class, base (without its WSM) and attack
         sub="['ia-cls','ia-base','ia-atk'].map(id => { const e = document.getElementById(id); "
             "return e && e.selectedOptions[0] ? e.selectedOptions[0].textContent.replace(/\\s*\\(.*\\)\\s*$/, '') "
             ": ''; }).filter(Boolean).join(' \\u00b7 ')"),
    dict(name="grail", url="grail/#gm-comp", w=1000, wait=5.0, settle=2.5, css="#gm-bar{display:none!important}",
         card=dict(root=".grail-map", title="Grail Planner", band=True,
                   sub="Mark what you've found in the game's own Compendium"),
         sel="#gm-comp-stage", off=150),
    dict(name="tiers", url="tiers/", w=920, wait=5.0, settle=1.5, css=".tier-map .bar{position:static!important}",
         sel=".tier-map .bar", off=12),
    dict(name="map-experience", url="resources/map-experience/", w=920, wait=2.0, settle=1.0,
         css=".mapexp-map .mx-bar{top:0!important}",
         scroll="(() => { const b = document.getElementById('mxBar'), l = document.getElementById('legend'); "
                "window.scrollTo(0, window.scrollY + l.getBoundingClientRect().top - b.offsetHeight - 16); })()"),
    dict(name="infinity-base-comparison", url="resources/infinity-base-comparison/", w=920, wait=3.0, settle=1.0,
         sel=".merc-map .tiles", off=16),
    # every page without a picture of its own; drawn on a Resources page for its fonts
    dict(name="default", url="resources/ohm-vs-jewel-comparison/", w=800, wait=1.5,
         card=dict(root=".ohm-map", title="Erazure's PD2 Loot Filter", size=50,
                   eyebrow="Loot filter for Project Diablo 2", mascot=True,
                   lines=["Filter levels", "Unique & set tiers", "Grail Planner", "Calculators"])),
]

# A card: a fixed layer over the page with the site's name, the page's name and the page's own parts moved into it
# (a part keeps the page's styles, and its script keeps drawing it: the race, the attack preview). band: only the
# name, over the page scrolled under it. mascot: the default card, the name beside the picture.
CARD_JS = r"""
window.ogCard = function (o) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
  const chest = '<svg viewBox="0 0 24 24" style="width:20px;height:20px;flex:none;fill:#d8b45e"><path d="M5 4h14a3 3 0 0 1 3 3v4h-7v-1H9v1H2V7a3 3 0 0 1 3-3m6 7h2v2h-2zm-9 1h7v1l2 2h2l2-2v-1h7v8H2z"/></svg>';
  const host = document.querySelector(o.root) || document.body;
  const card = document.createElement('div');
  card.style.cssText = 'position:fixed;inset:0;z-index:99;box-sizing:border-box;overflow:hidden;background:#1e2129;'
    + 'color:#f1ead9;font-family:"Source Sans 3","Segoe UI",Arial,sans-serif;padding:24px 30px 26px;'
    + 'display:flex;flex-direction:column;gap:' + (o.gap || 18) + 'px';
  const head = document.createElement('div');
  head.innerHTML = '<div style="display:flex;align-items:center;gap:8px;color:#d8b45e;font-weight:600;font-size:15px;letter-spacing:.02em">'
    + chest + esc(o.eyebrow || "Erazure's PD2 Loot Filter") + '</div>'
    + '<div style="font-weight:700;font-size:' + (o.size || 38) + 'px;line-height:1.1;margin-top:6px;text-wrap:balance">' + esc(o.title) + '</div>'
    + (o.sub ? '<div style="color:#b9b2a3;font-size:16px;margin-top:6px">' + esc(o.sub) + '</div>' : '')
    + (o.lines ? '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:22px">' + o.lines.map(t =>
        '<span style="border:1px solid #4a4436;border-radius:999px;padding:3px 12px;font-size:15px;color:#d9d1c0">' + esc(t) + '</span>').join('') + '</div>' : '');
  card.appendChild(head);
  const loaded = [];
  if (o.mascot) {
    card.style.flexDirection = 'row'; card.style.alignItems = 'center'; card.style.gap = '24px';
    card.style.padding = '24px 40px';
    head.style.flex = '1';
    const img = new Image();
    img.style.cssText = 'height:372px;width:auto;flex:none';
    loaded.push(new Promise(r => { img.onload = r; img.onerror = r; }));
    img.src = o.mascot;
    card.appendChild(img);
  } else if (o.band) {
    card.style.bottom = 'auto'; card.style.paddingBottom = '18px';
  } else {
    const body = document.createElement('div');
    body.style.cssText = 'flex:1;min-height:0;display:grid;gap:22px;align-items:center;' + (o.grid || '');
    for (const sel of o.parts || []) { const e = document.querySelector(sel); if (e) { e.style.margin = '0'; body.appendChild(e); } }
    card.appendChild(body);
  }
  host.appendChild(card);
  (o.hide || []).forEach(s => document.querySelectorAll(s).forEach(e => e.style.display = 'none'));
  (o.style || []).forEach(([s, css]) => document.querySelectorAll(s).forEach(e => e.style.cssText += ';' + css));
  return Promise.all(loaded.concat([document.fonts.ready])).then(() => 'ok');
};
"""


class DevTools:
    """A page of the browser, driven over its DevTools websocket (no package needed)."""

    def __init__(self, url):
        hostport, path = url.split("://", 1)[1].split("/", 1)
        host, port = hostport.split(":")
        self.sock = socket.create_connection((host, int(port)))
        key = base64.b64encode(os.urandom(16)).decode()
        self.sock.sendall((f"GET /{path} HTTP/1.1\r\nHost: {hostport}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                           f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n").encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.sock.recv(4096)
        self.buf = buf.split(b"\r\n\r\n", 1)[1]
        self.n = 0

    def _read(self, k):
        while len(self.buf) < k:
            chunk = self.sock.recv(1 << 20)
            if not chunk:
                raise EOFError("the browser closed the connection")
            self.buf += chunk
        out, self.buf = self.buf[:k], self.buf[k:]
        return out

    def _send(self, obj):
        data = json.dumps(obj).encode()
        n = len(data)
        head = bytes([0x81]) + (bytes([0x80 | n]) if n < 126 else bytes([0x80 | 126]) + struct.pack(">H", n)
                                if n < 65536 else bytes([0x80 | 127]) + struct.pack(">Q", n))
        mask = os.urandom(4)
        self.sock.sendall(head + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

    def _recv(self):
        data = b""
        while True:
            b0, b1 = self._read(2)
            n = b1 & 0x7F
            if n == 126:
                n = struct.unpack(">H", self._read(2))[0]
            elif n == 127:
                n = struct.unpack(">Q", self._read(8))[0]
            data += self._read(n)
            if b0 & 0x80:
                return json.loads(data)

    def call(self, method, **params):
        self.n += 1
        self._send({"id": self.n, "method": method, "params": params})
        while True:
            msg = self._recv()
            if msg.get("id") == self.n:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})

    def js(self, expression):
        r = self.call("Runtime.evaluate", expression=expression, awaitPromise=True, returnByValue=True)
        if "exceptionDetails" in r:
            raise RuntimeError(r["exceptionDetails"].get("exception", {}).get("description", r["exceptionDetails"]))
        return r.get("result", {}).get("value")


def find_browser():
    for p in (os.environ.get("PROGRAMFILES(X86)", ""), os.environ.get("PROGRAMFILES", ""),
              os.environ.get("LOCALAPPDATA", "")):
        for rel in (r"Microsoft\Edge\Application\msedge.exe", r"Google\Chrome\Application\chrome.exe"):
            if p and Path(p, rel).exists():
                return str(Path(p, rel))
    for name in ("msedge", "google-chrome", "chromium", "chrome"):
        if shutil.which(name):
            return shutil.which(name)
    sys.exit("No Edge or Chrome found.")


def build_site():
    py = VENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    if not py.exists():
        sys.exit("MkDocs isn't installed yet: double-click site_preview.bat once, then run this again.")
    print("Building the site ...")
    subprocess.run([str(py), "-m", "mkdocs", "build", "-q", "-f", str(ROOT / "website" / "mkdocs.yml"),
                    "-d", str(SITE)], check=True, env=dict(os.environ, PYTHONIOENCODING="utf-8"))


def serve(directory):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(directory)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def png_size(data):
    return struct.unpack(">II", data[16:24])


def shoot(page, base, s):
    w = s["w"]
    h = w * SIZE[1] // SIZE[0]
    assert w * SIZE[1] % SIZE[0] == 0, f"{s['name']}: width {w} is no multiple of 40"
    page.call("Emulation.setDeviceMetricsOverride", width=w, height=h, deviceScaleFactor=SIZE[0] / w, mobile=False)
    page.call("Page.navigate", url=base + s["url"])
    for _ in range(300):
        time.sleep(0.1)
        if page.js("document.readyState") == "complete":
            break
    time.sleep(s.get("wait", 1.0))
    page.js("(() => { const st = document.createElement('style'); st.textContent = " + json.dumps(HIDE + s.get("css", ""))
            + "; document.head.appendChild(st); })()")
    if "card" in s:
        card = dict(s["card"])
        if "sub" in s:
            card["sub"] = page.js(s["sub"])
        if card.pop("mascot", False):
            card["mascot"] = "data:image/png;base64," + base64.b64encode(MASCOT.read_bytes()).decode()
        page.js(CARD_JS + "; ogCard(" + json.dumps(card) + ")")
    if "sel" in s:
        found = page.js(f"(() => {{ const e = document.querySelector({json.dumps(s['sel'])}); if (!e) return false; "
                        f"window.scrollTo(0, window.scrollY + e.getBoundingClientRect().top - {s.get('off', 0)}); "
                        "return true; })()")
        if not found:
            raise RuntimeError(f"{s['name']}: {s['sel']} isn't on the page")
    if "scroll" in s:
        page.js(s["scroll"])
    time.sleep(s.get("settle", 0.6))
    data = base64.b64decode(page.call("Page.captureScreenshot", format="png")["data"])
    if png_size(data) != SIZE:
        raise RuntimeError(f"{s['name']}: the picture came out {png_size(data)}, not {SIZE}")
    return data


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("names", nargs="*", help="only these pictures (" + ", ".join(s["name"] for s in SHOTS) + ")")
    ap.add_argument("--no-build", action="store_true", help="use the site built by the last run")
    args = ap.parse_args()
    unknown = set(args.names) - {s["name"] for s in SHOTS}
    if unknown:
        sys.exit("No such picture: " + ", ".join(sorted(unknown)))
    if not args.no_build or not SITE.exists():
        build_site()
    httpd = serve(SITE)
    base = f"http://127.0.0.1:{httpd.server_address[1]}/"
    profile = tempfile.mkdtemp(prefix="preview-images-")
    browser = subprocess.Popen([find_browser(), "--headless=new", "--disable-gpu", "--hide-scrollbars", "--mute-audio",
                                "--no-first-run", "--remote-debugging-port=0", f"--user-data-dir={profile}",
                                "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        port_file = Path(profile, "DevToolsActivePort")
        for _ in range(100):
            if port_file.exists() and port_file.read_text().strip():
                break
            time.sleep(0.1)
        port = port_file.read_text().split()[0]
        for _ in range(50):
            try:
                with socket.create_connection(("127.0.0.1", int(port)), timeout=1):
                    break
            except OSError:
                time.sleep(0.1)
        tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json"))
        page = DevTools(next(t for t in tabs if t["type"] == "page")["webSocketDebuggerUrl"])
        OUT.mkdir(parents=True, exist_ok=True)
        for s in SHOTS:
            if args.names and s["name"] not in args.names:
                continue
            data = shoot(page, base, s)
            path = OUT / (s["name"] + ".png")
            old = path.read_bytes() if path.exists() else None
            if old == data:
                print(f"{path.relative_to(ROOT)}: unchanged")
            else:
                path.write_bytes(data)
                print(f"{path.relative_to(ROOT)}: {len(data) // 1024} KB")
    finally:
        browser.terminate()
        try:
            browser.wait(10)
        except subprocess.TimeoutExpired:
            browser.kill()
        httpd.shutdown()
        shutil.rmtree(profile, ignore_errors=True)


if __name__ == "__main__":
    main()
