#!/usr/bin/env python3
"""
Minimap icon preview: a page on this computer that draws the filter's minimap icons as the game does and draws them
again within a second of a change to sections/ or styles/, so a color code shows as you edit it. Double-click
icon_preview.bat, or (from the repo root):

    python tools/icon_preview.py [--port 8765] [--no-browser]

then open http://127.0.0.1:8765/ (the page is tools/icon_preview.html; its data comes from here). Ctrl+C stops it.

The page:
- every rule with %BORDER-xx% %MAP-xx% %DOT-xx% %PX-xx%, by section, its icon in game pixels on a floor of the
  Examples page's pictures (website/docs/img/examples/), and what changed since the page opened (or since Reset);
- the whole icon of an item (Item check): each notification rule that matches it adds its boxes, up to the first
  one without %CONTINUE% (as tools/tier_map.py); explain_item's model, the base's item groups from
  docs/pd2-bases.tsv; a rule it can't decide (character level, stats...) is a switch;
- a palette to try colors on a rule; Save writes the codes into the rule's line in sections/ (only the icon codes
  change, and only while the line is still the one the page read), then runs what the Claude Code hook runs after a
  section edit (.claude/hooks/rebuild.py: generators, players' pages, build; about a minute).

How the game draws an icon: over the item's spot on the automap BH draws each matching rule's boxes, BORDER 8x8,
MAP 6x6, DOT 4x4 and PX 2x2 game pixels around the same center, in that order (MapNotify.cpp), one rule after the
other: a later rule's BORDER covers an earlier rule's DOT. Each box is solid and opaque, its palette color (the act's
palette: only E1-FE differ from act to act; docs/pd2-palette.tsv is act 1). With HD text (D2GL) a black box (00)
is drawn by D2GL in its own layer over the game's picture (D2GL hd_text.cpp, drawSolidRect), so it covers every box
of the icon under it, those drawn after it too: the Vial of Lightsong's BORDER-00 showed the whole icon black.
"""
import argparse
import hashlib
import json
import re
import subprocess
import sys
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from types import SimpleNamespace
from urllib.parse import parse_qs, urlparse

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402
import explain_item as E  # noqa: E402
import lint_filter as L  # noqa: E402
import tier_map as T  # noqa: E402
from example_shots import COLORS  # noqa: E402

ROOT = build.ROOT
PAGE = ROOT / "tools" / "icon_preview.html"
FLOOR_DIR = ROOT / "website" / "docs" / "img" / "examples"
HOOK = ROOT / ".claude" / "hooks" / "rebuild.py"
WATCHED = [build.SECTIONS, build.STYLES]  # with version.json and filter_definitions.json
KEYS = ("BORDER", "MAP", "DOT", "PX")
TOKEN_RE = {k: re.compile(rf"%{k}-([a-f0-9]{{1,4}})%", re.I) for k in KEYS}
WORD_RE = re.compile(r"%([A-Za-z0-9_]+)%")
# The Examples page's scenes (tools/example_shots.py SCENES): the floor each one is drawn on
FLOORS = {"potions": "Rogue Encampment", "gems": "Jail", "runes-low": "Lut Gholein", "runes-mid": "Harrogath",
          "runes-high": "Worldstone Keep", "dclone-rathma-lucion": "Chaos Sanctuary"}

LOCK = threading.Lock()  # REBUILD
CACHE_LOCK = threading.Lock()
CACHE = {}  # (token, variant) -> rules data
REBUILD = {"state": "idle", "message": "", "at": "", "again": None}


def token():
    """A fingerprint of every file the rules are read from: it changes when one is saved."""
    h = hashlib.sha1()
    files = [p for d in WATCHED if d.is_dir() for p in sorted(d.iterdir()) if p.is_file()]
    for p in files + [build.VERSION_FILE, build.DEFS]:
        try:
            st = p.stat()
        except OSError:
            continue
        h.update(f"{p.name}:{st.st_mtime_ns}:{st.st_size};".encode())
    return h.hexdigest()[:16]


def label(name):
    """A rule's name text (aliases filled in) as [[color word or None, text, is a keyword], ...]."""
    out, color, pos = [], None, 0
    for m in WORD_RE.finditer(name):
        if m.start() > pos:
            out.append([color, name[pos:m.start()], 0])
        word = m.group(1)
        if word in COLORS:
            color = word
        else:
            out.append([color, word, 1])
        pos = m.end()
    if pos < len(name):
        out.append([color, name[pos:], 0])
    return out


def load_rules(variant):
    """The variant's rules as the page needs them: every icon rule, and every notification rule for the item check."""
    lines, where, own = build.variant_text(variant)
    lt = L.Linter(lines, where, False)
    rules, seen = [], {}
    for r in lt.rules:
        name, cont, notify, sound, tier, layer = T.parse_output(r.output, lt.aliases)
        if not notify:
            continue
        loc = where(r.idx)
        m = re.match(r"sections/([^:]+):(\d+)$", loc)
        out = r.line[r.line.find("]:") + 2:]
        c = out.find("//")
        comment = out[c + 2:].strip() if c >= 0 else ""
        body = out if c < 0 else out[:c]
        key = f"{m.group(1) if m else loc}|{r.cond}|{comment}"
        seen[key] = seen.get(key, 0) + 1
        rules.append({
            "id": loc, "file": m.group(1) if m else loc.split(":")[0][len("sections/"):], "line": int(m.group(2)) if m else 0,
            "key": f"{key}|{seen[key]}", "layers": list(layer) if layer else None,
            "edit": [bool(TOKEN_RE[k].search(body)) for k in KEYS] if layer else None,
            "cont": cont, "tier": tier, "sound": sound, "cond": r.cond, "comment": comment, "raw": r.line,
            "own": r.idx in own or not m, "label": label(name.strip()) if layer else None,
            "_cond": E.expand_condition(r.cond, lt.aliases),
        })
    return rules


def rules_data(variant):
    tok = token()
    with CACHE_LOCK:
        if (tok, variant) not in CACHE:
            for k in [k for k in CACHE if k[0] != tok]:
                del CACHE[k]
            try:
                CACHE[(tok, variant)] = {"rules": load_rules(variant), "error": None}
            except SystemExit as e:  # build.fail: a section file it can't read
                CACHE[(tok, variant)] = {"rules": [], "error": str(e)}
        return tok, CACHE[(tok, variant)]


# ---------------------------------------------------------------- the item check

BASES = {}


def item_check(variant, q):
    """The notification rules an item can match, in order, up to the first certain one without %CONTINUE%."""
    if not BASES:
        BASES.update(T.load_bases())
    code = q.get("code", "").strip()
    quality = q.get("quality", "NMAG").upper()
    if not code or quality not in E.QUALITIES:
        return {"error": "an item code and a quality (NMAG MAG RARE UNI SET CRAFT)"}
    values = []
    for kv in q.get("values", "").replace(",", " ").split():
        k, eq, v = kv.partition("=")
        if not eq or not re.fullmatch(r"-?\d+", v.strip()):
            return {"error": f"'{kv}': values are written KEY=number (CLVL=90 SOCK=4 MAPID=1)"}
        values.append(f"{k}={v}")
    level = q.get("level", "")
    args = SimpleNamespace(code=code, quality=quality, groups=None, cls=q.get("cls") or None,
                           where=q.get("where", "GROUND").upper(), id=q.get("id") == "1", unid=q.get("id") != "1",
                           eth=q.get("eth") == "1", level=int(level) if level.isdigit() else None, set=values)
    item = E.Item(args)
    base = BASES.get(code)
    groups = None
    if base:
        groups = T.item_groups(set(base["types"]))
        if base["tier"] in T.TIER_GROUP:
            groups.add(T.TIER_GROUP[base["tier"]])
    group_words = T.GROUP_WORDS | set(T.TIER_GROUP.values())

    def atom_of(word):
        if groups is not None and word in group_words:
            return int(word in groups)
        return E.atom(word, item)
    tok, data = rules_data(variant)
    out = []
    for r in data["rules"]:
        v = E.evaluate(r["_cond"], item, atom_of)
        if not v:
            continue
        out.append({"key": r["key"], "v": v})
        if v == 1 and not r["cont"]:
            break
    name = re.sub(r"(?:Ã¿|ÿ)c.", "", base["name"]).strip() if base else None  # as level_map.clean
    return {"token": tok, "base": name, "rules": out, "error": data["error"]}


# ---------------------------------------------------------------- saving

def set_icon(line, layers):
    """The rule line with its icon codes set to layers (BORDER, MAP, DOT, PX; None: no box). Only those words change;
    a new one goes beside the others."""
    start = line.find("]:") + 2
    end = line.find("//", start)
    end = len(line) if end < 0 else end
    body = line[start:end]
    for i, key in enumerate(KEYS):
        code = layers[i]
        m = TOKEN_RE[key].search(body)
        if m:
            if code and m.group(1).upper().zfill(2) == code:
                continue
            new = f"{m.group(0)[:len(key) + 2]}{code}%" if code else ""
            body = body[:m.start()] + new + body[m.end():]
        elif code:
            body = insert_token(body, i, f"%{key}-{code}%")
    return line[:start] + body + line[end:]


def insert_token(body, i, token_text):
    """After the nearest earlier box's word, else before the nearest later one's, else before %TIER / %SOUNDID /
    %CONTINUE% / the description."""
    for key in reversed(KEYS[:i]):
        m = TOKEN_RE[key].search(body)
        if m:
            return body[:m.end()] + token_text + body[m.end():]
    for key in KEYS[i + 1:]:
        m = TOKEN_RE[key].search(body)
        if m:
            return body[:m.start()] + token_text + body[m.start():]
    m = re.search(r"%(?:TIER|SOUNDID)-|%CONTINUE%|\{", body, re.I)
    at = m.start() if m else len(body)
    return body[:at] + token_text + body[at:]


def without_icons(line):
    for rx in TOKEN_RE.values():
        line = rx.sub("", line)
    return line


def save(edits, sections=None):
    """Write each edit ({id: 'sections/<file>:<line>', raw: the line as the page read it, layers}) into its section
    file. Returns (files written, errors); a line that changed since the page read it is left alone."""
    sections = sections or build.SECTIONS
    by_file, errors = {}, []
    for e in edits:
        m = re.fullmatch(r"sections/([^:/\\]+):(\d+)", str(e.get("id", "")))
        layers = e.get("layers")
        if not m or not build.SECTION_NAME_RE.match(m.group(1)):
            errors.append(f"{e.get('id')}: not a line of sections/ (a style variant's own line?)")
            continue
        if (not isinstance(layers, list) or len(layers) != 4
                or any(x is not None and not re.fullmatch(r"[0-9A-F]{2}", str(x)) for x in layers)):
            errors.append(f"{e['id']}: the codes must be two hex digits or empty")
            continue
        by_file.setdefault(m.group(1), []).append((int(m.group(2)), e.get("raw", ""), layers, e["id"]))
    written = []
    for name, items in by_file.items():
        path = sections / name
        if not path.is_file():
            errors.append(f"sections/{name}: no such file")
            continue
        data, _ = build.normalize(path.read_bytes())
        lines = data.split(b"\r\n")
        changed = False
        for n, raw, layers, where in items:
            if not 1 <= n < len(lines):
                errors.append(f"{where}: the file has no such line any more")
                continue
            line = lines[n - 1].decode("utf-8")
            if line.rstrip() != raw.rstrip():
                errors.append(f"{where}: the line changed since the page read it (it reloads: try again)")
                continue
            new = set_icon(line, layers)
            if without_icons(new) != without_icons(line):
                errors.append(f"{where}: would change more than the icon codes; left alone")
                continue
            if new != line:
                lines[n - 1] = new.encode("utf-8")
                changed = True
        if changed:
            path.write_bytes(b"\r\n".join(lines))
            written.append(path)
    return written, errors


def rebuild(path):
    """Run the hook's rebuild for a saved section file, in the background; once more after it if saved again."""
    with LOCK:
        if REBUILD["state"] == "running":
            REBUILD["again"] = path
            return
        REBUILD.update(state="running", message="Rebuilding the filters and the players' pages...", again=None)

    def run(p):
        while p:
            payload = json.dumps({"tool_input": {"file_path": str(p)}})
            res = subprocess.run([sys.executable, str(HOOK)], input=payload, cwd=ROOT, capture_output=True,
                                 encoding="utf-8", errors="replace")
            ok = res.returncode == 0
            msg = (res.stderr or "").strip() if not ok else ""
            if ok and res.stdout.strip():
                try:
                    msg = json.loads(res.stdout)["hookSpecificOutput"]["additionalContext"]
                except (ValueError, KeyError, TypeError):
                    msg = res.stdout.strip()
            with LOCK:
                p, REBUILD["again"] = REBUILD["again"], None
                if p:
                    REBUILD.update(message="Saved again meanwhile: rebuilding once more...")
                else:
                    REBUILD.update(state="ok" if ok else "failed", at=time.strftime("%H:%M:%S"),
                                   message=msg or ("Filters and players' pages rebuilt." if ok else "The rebuild failed."))
    threading.Thread(target=run, args=(path,), daemon=True).start()


# ---------------------------------------------------------------- the server

def floors():
    out = []
    for name, title in FLOORS.items():
        p = FLOOR_DIR / f"{name}.png"
        if p.is_file():
            head = p.read_bytes()[16:24]  # PNG IHDR: width, height
            out.append({"name": name, "title": title, "w": int.from_bytes(head[:4], "big"),
                        "h": int.from_bytes(head[4:], "big")})
    return out


def meta():
    return {"variants": [n for n, _ in build.load_defs()], "palette": T.load_palette(), "levels": T.load_levels(),
            "floors": floors(), "scale": 2, "colors": {k: "#" + v for k, v in COLORS.items()}}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def send(self, body, ctype="application/json; charset=utf-8", status=200):
        if not isinstance(body, bytes):
            body = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = urlparse(self.path)
        q = {k: v[-1] for k, v in parse_qs(url.query).items()}
        variant = q.get("variant") or build.MAIN
        if url.path in ("/", "/index.html"):
            return self.send(PAGE.read_bytes(), "text/html; charset=utf-8")
        if url.path == "/api/meta":
            return self.send(meta())
        if url.path == "/api/state":
            with LOCK:
                rb = {k: REBUILD[k] for k in ("state", "message", "at")}
            return self.send({"token": token(), "rebuild": rb})
        if url.path == "/api/rules":
            tok, data = rules_data(variant)
            rules = [{k: v for k, v in r.items() if not k.startswith("_")} for r in data["rules"]]
            return self.send({"token": tok, "variant": variant, "rules": rules, "error": data["error"]})
        if url.path == "/api/item":
            return self.send(item_check(variant, q))
        m = re.fullmatch(r"/floors/([a-z0-9-]+)\.png", url.path)
        if m and (FLOOR_DIR / f"{m.group(1)}.png").is_file():
            return self.send((FLOOR_DIR / f"{m.group(1)}.png").read_bytes(), "image/png")
        self.send({"error": "not found"}, status=404)

    def do_POST(self):
        if urlparse(self.path).path != "/api/save":
            return self.send({"error": "not found"}, status=404)
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))).decode("utf-8"))
            edits = body["edits"]
        except (ValueError, KeyError, TypeError):
            return self.send({"error": "bad request"}, status=400)
        written, errors = save(edits)
        if written:
            rebuild(written[0])
        self.send({"saved": [f"sections/{p.name}" for p in written], "errors": errors})


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Preview the filter's minimap icons while you edit them.")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--no-browser", action="store_true")
    args = ap.parse_args()
    server = None
    for port in range(args.port, args.port + 10):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
            break
        except OSError:
            continue
    if not server:
        sys.exit(f"no free port from {args.port} to {args.port + 9}")
    url = f"http://127.0.0.1:{server.server_port}/"
    print(f"Minimap icon preview at {url} (watching sections/ and styles/). Ctrl+C or close this window to stop.")
    if not args.no_browser:
        threading.Timer(0.5, webbrowser.open, (url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
