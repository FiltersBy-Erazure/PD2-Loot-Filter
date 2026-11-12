#!/usr/bin/env python3
"""The website's Filter Editor page (Erazure-Filter-Editor.html, repo root, committed; the site's Filter Editor tab shows
it): the editor's modules of tools/editor/ put into the template's one script, with the catalogs the page needs that
come from docs/ (the game's tables), never from sections/: the filter itself, everything the page reads from it, is
Erazure-Filter-Editor-Source.js, which tools/build.py writes with the filters (so the two never have to be written in
a particular order, and website/hooks.py cache-busts the source by its CRC).

    python tools/editor_map.py                 write the page
    python tools/editor_map.py --check         change nothing; exit 1 if the page is out of date
    python tools/editor_map.py --assets DIR    also write the game-art assets from the game folder (fonts, floors,
                                               item pictures, sounds: Erazure-Filter-Editor-Assets/ and
                                               tools/editor_assets.json), like grail_map.py needs the game files

The page's tests: python tools/editor_selftest.py.
"""
import argparse
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import style_map  # noqa: E402  (the look cards' sample names and name colors, the Minimal page's)
import tier_map as T  # noqa: E402  (DOC_HEAD, the players' pages' document head; sounds, palette)

ROOT = Path(__file__).resolve().parent.parent
EDITOR = ROOT / "tools" / "editor"
TEMPLATE = EDITOR / "template.html"
PAGE = ROOT / "Erazure-Filter-Editor.html"
ASSET_INFO = ROOT / "tools" / "editor_assets.json"
# the modules, in the order the page runs them (each adds itself to the EZ namespace)
MODULES = ["core.js", "ui.js", "store.js", "filter.js", "features.js", "edits.js", "render.js", "share.js", "app.js",
           "area-start.js", "area-options.js", "area-looks.js", "area-alerts.js", "area-todo.js"]
# PD2's own drop sounds (pd2\dropsounds\tinkNN.wav), the PoE versions' picks
POE_SOUNDS = range(4714, 4730)


def page_data():
    """The catalogs the page embeds (from docs/, the tools and the committed asset info; nothing from sections/)."""
    sounds = T.load_sounds()
    data = {
        "palette": [T.load_palette().get(f"{i:02X}", "#000000") for i in range(256)],
        "sounds": {str(i): s["name"] for i, s in sorted(sounds.items())},
        "poeSounds": [i for i in POE_SOUNDS if i in sounds],
        "looks": {"sample": style_map.SAMPLE, "nameColor": style_map.NAME_COLOR},
    }
    if ASSET_INFO.exists():
        data["assets"] = json.loads(ASSET_INFO.read_text(encoding="utf-8"))
    return data


def page_text():
    template = TEMPLATE.read_text(encoding="utf-8")
    modules = []
    for name in MODULES:
        text = (EDITOR / name).read_text(encoding="utf-8")
        if "</script" in text.lower():
            sys.exit(f"tools/editor/{name}: '</script' can't be in the page's script (website/hooks.py takes the script "
                     "up to the first </script>)")
        modules.append(f"/* ---- tools/editor/{name} ---- */\n{text.rstrip()}\n")
    data = json.dumps(page_data(), ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    for mark in ("/*__DATA__*/null", "/*__MODULES__*/"):
        if template.count(mark) != 1:
            sys.exit(f"tools/editor/template.html: '{mark}' must appear exactly once")
    text = template.replace("/*__DATA__*/null", data).replace("/*__MODULES__*/", "\n".join(modules))
    return T.DOC_HEAD + text.rstrip() + "\n</body>\n</html>\n"


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Write the Filter Editor page.")
    ap.add_argument("--check", action="store_true", help="change nothing; exit 1 if the page is out of date")
    ap.add_argument("--assets", metavar="DIR", help="also write the game-art assets from the game folder")
    args = ap.parse_args()
    if args.assets:
        import editor_assets  # noqa: E402  (only with the game files)
        editor_assets.write(args.assets)
    text = page_text()
    old = PAGE.read_text(encoding="utf-8") if PAGE.exists() else None
    if args.check:
        if old != text:
            print(f"{PAGE.name} is out of date (run: python tools/editor_map.py)")
            sys.exit(1)
        print(f"{PAGE.name} in sync.")
        return
    if old != text:
        PAGE.write_text(text, encoding="utf-8", newline="\n")
        print(f"wrote {PAGE.name} ({len(text.encode()) // 1024} KB)")
    else:
        print(f"{PAGE.name} already up to date")


if __name__ == "__main__":
    main()
