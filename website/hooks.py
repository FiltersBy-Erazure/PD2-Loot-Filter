"""MkDocs hook for the Erazure website: the players' pages made from the filter's own rules.

Each is a repo-root HTML file that a tool writes (build.bat runs them):
- Erazure-Unique-Set-Tiers.html (tools/tier_map.py), shown on the Unique & Set Tiers page (docs/tiers.md)
- Erazure-Non-Magic-Bases.html (tools/base_map.py), shown on the Non-magical Bases page (docs/bases.md)
- Erazure-Magic-Items.html and Erazure-Rare-Items.html (tools/magic_rare_map.py), shown on the Magic Items and Rare
  Items pages (docs/magic.md, docs/rare.md)
- Erazure-Filter-Levels.html (tools/level_map.py), shown on the Filter Levels page (docs/filter-levels.md)
- Erazure-Minimal-Style.html (tools/style_map.py), shown on the Minimal Version page (docs/minimal.md)
- Erazure-Skill-Shop-Highlights.html (tools/shop_map.py), shown on the Skill & Shop Highlights page (docs/shop.md)
- Erazure-Grail-Planner.html (tools/grail_map.py, from the game's tables: not run by build.bat), shown on the Grail
  Planner page (docs/grail.md)
- Erazure-Filter-Editor.html (tools/editor_map.py), shown on the Filter Editor page (docs/editor.md); it loads the
  filter from Erazure-Filter-Editor-Source.js (tools/build.py writes it with the filters) and its game art from
  Erazure-Filter-Editor-Assets/ (tools/editor_map.py --assets), both copied beside it; the source's name in its script
  gets the source's CRC (SOURCE_V), so a browser never keeps an old copy of the filter after a push
The Resources tab's pages are written by hand, in website/resources/ (each with its data and script inside):
- Infinity-Merc-Bases.html, shown on the Infinity Merc Bases page (docs/resources/infinity-merc-bases.md)
- Map-Experience.html, shown on the Map Experience page (docs/resources/map-experience.md); its numbers are written by
  tools/gen_map_exp.py
- Event-Boss-Runs.html, shown on the Event and Boss Map Runs page (docs/resources/event-boss-runs.md); the event-run
  model writes the whole file (its site_page.py, kept out of the repo with the model)
- Ohm-vs-Jewel.html, shown on the Ohm vs Jewel page (docs/resources/ohm-vs-jewel.md); its game numbers are written
  by tools/calc_data.py
- Damage-Calculator.html, shown on the Damage Calculator page (docs/resources/damage-calculator.md), and
  Run-Speed.html, shown on the Run Speed page (docs/resources/run-speed.md); their game numbers are written by
  tools/calc_data.py too, and the Run Speed race's pictures (Run-Speed-Sprites/, copied beside it) by
  tools/run_sprites.py
- IAS-Calculator.html, shown on the IAS Calculator page (docs/resources/ias-calculator.md); its game numbers are
  written by tools/ias_data.py, its engine checked by tools/ias_selftest.py
Each goes into the site as a file of its own (a Resources page under resources/), so its address keeps working.
Its site page shows the same map with no frame, so its filter bar can stay under the site's header while
scrolling: this hook takes the styles, the
markup between the map's markers (<!-- tier-map:start --> ...) and the script out of the file, puts the markup where
the page has its placeholder (<div id="tier-map-here"></div> ...), and adds the styles and the script (with the
data) as two files of their own.
"""
import zlib
from pathlib import Path

from mkdocs.exceptions import PluginError
from mkdocs.structure.files import File

ROOT = Path(__file__).resolve().parent.parent
MAPS = [  # (the page, from the repo root; the tool that writes it, or "by hand"; its site page; its marker and class name)
    ("Erazure-Unique-Set-Tiers.html", "tools/tier_map.py", "tiers.md", "tier-map"),
    ("Erazure-Non-Magic-Bases.html", "tools/base_map.py", "bases.md", "base-map"),
    ("Erazure-Magic-Items.html", "tools/magic_rare_map.py", "magic.md", "magic-map"),
    ("Erazure-Rare-Items.html", "tools/magic_rare_map.py", "rare.md", "rare-map"),
    ("Erazure-Filter-Levels.html", "tools/level_map.py", "filter-levels.md", "level-map"),
    ("Erazure-Minimal-Style.html", "tools/style_map.py", "minimal.md", "style-map"),
    ("Erazure-Skill-Shop-Highlights.html", "tools/shop_map.py", "shop.md", "shop-map"),
    ("Erazure-Grail-Planner.html", "tools/grail_map.py", "grail.md", "grail-map"),
    ("Erazure-Filter-Editor.html", "tools/editor_map.py", "editor.md", "edit-map"),
    ("website/resources/Infinity-Merc-Bases.html", "by hand", "resources/infinity-merc-bases.md", "merc-map"),
    ("website/resources/Map-Experience.html", "by hand", "resources/map-experience.md", "mapexp-map"),
    ("website/resources/Event-Boss-Runs.html", "by hand", "resources/event-boss-runs.md", "evrun-map"),
    ("website/resources/Ohm-vs-Jewel.html", "by hand", "resources/ohm-vs-jewel.md", "ohm-map"),
    ("website/resources/Damage-Calculator.html", "by hand", "resources/damage-calculator.md", "dmg-map"),
    ("website/resources/Run-Speed.html", "by hand", "resources/run-speed.md", "frw-map"),
    ("website/resources/IAS-Calculator.html", "by hand", "resources/ias-calculator.md", "ias-map"),
]
FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700'
         '&family=Source+Sans+3:wght@400;600;700&display=swap">')
# Files a page loads beside it (from the repo root to the site's root, where its own copy is; its site page's script
# finds them there): the Grail Planner's Compendium view pictures and letters (tools/grail_compendium.py), the Filter
# Editor's copy of the filter (tools/build.py)
BESIDE = ["Erazure-Grail-Planner-Compendium.png", "Erazure-Grail-Planner-Glyphs.png", "Erazure-Filter-Editor-Source.js"]
# Folders copied beside the pages the same way, file by file: the Filter Editor's game art (tools/editor_map.py
# --assets; until it's written the editor draws with a web font and no pictures)
BESIDE_FOLDERS = ["Erazure-Filter-Editor-Assets",
                  # the IAS Calculator's attack previews (tools/ias_sprites.py), beside its own copy in resources/
                  "website/resources/IAS-Calculator-Sprites",
                  # the Run Speed page's race (tools/run_sprites.py), the same way
                  "website/resources/Run-Speed-Sprites"]
# The Filter Editor's script names its source with the source's CRC, so a new filter is a new address for browsers
EDITOR_SOURCE, SOURCE_V = "Erazure-Filter-Editor-Source.js", "__SOURCE_V__"


def parts(page, tool, name):
    """(styles, markup, script) of a map, taken out of its generated page."""
    path = ROOT / page
    if not path.exists():
        if tool == "by hand":
            raise PluginError(f"{page} is missing: it is written by hand, restore it from git")
        raise PluginError(f"{page} is missing in the repo root: run python {tool} (build.bat does)")
    text = path.read_text(encoding="utf-8")

    def between(start, end, after):
        try:
            i = text.index(start, text.index(after)) + len(start)
            return text[i:text.index(end, i)]
        except ValueError:
            raise PluginError(f"{page}: no {start}...{end} after {after} (the {name} markers of its template)")
    return (between("<style>", "</style>", f"<!-- {name}:css -->"),
            between(f"<!-- {name}:start -->", f"<!-- {name}:end -->", f"<!-- {name}:start -->"),
            between("<script>", "</script>", f"<!-- {name}:end -->"))


def assets(name):
    return f"assets/{name}/{name}.css", f"assets/{name}/{name}.js"


def own_copy(page):
    """Where a page's own copy goes on the site: the repo-root pages at the site's root, Resources pages in resources/."""
    return page.removeprefix("website/")


def on_files(files, config):
    for page, tool, _, name in MAPS:
        css, _, script = parts(page, tool, name)
        css_path, js_path = assets(name)
        if SOURCE_V in script:
            source = ROOT / EDITOR_SOURCE
            if not source.exists():
                raise PluginError(f"{EDITOR_SOURCE} is missing in the repo root: run python tools/build.py")
            script = script.replace(SOURCE_V, f"{zlib.crc32(source.read_bytes()) & 0xffffffff:08x}")
        files.append(File.generated(config, own_copy(page), abs_src_path=str(ROOT / page)))
        files.append(File.generated(config, css_path, content=css))
        files.append(File.generated(config, js_path, content=script))
    for name in BESIDE:
        if not (ROOT / name).exists():
            raise PluginError(f"{name} is missing in the repo root: run the tool that writes it")
        files.append(File.generated(config, name, abs_src_path=str(ROOT / name)))
    for folder in BESIDE_FOLDERS:
        for path in sorted((ROOT / folder).rglob("*")) if (ROOT / folder).is_dir() else []:
            if path.is_file():
                rel = own_copy(path.relative_to(ROOT).as_posix())  # a Resources page's folder goes to resources/
                files.append(File.generated(config, rel, abs_src_path=str(path)))
    return files


def on_page_content(html, page, config, files):
    for source, tool, md, name in MAPS:
        if page.file.src_uri != md:
            continue
        placeholder = f'<div id="{name}-here"></div>'
        if placeholder not in html:
            raise PluginError(f"docs/{md} has no {placeholder} for its map")
        _, markup, _ = parts(source, tool, name)
        css_path, js_path = assets(name)
        css = files.get_file_from_path(css_path).url_relative_to(page.file)
        js = files.get_file_from_path(js_path).url_relative_to(page.file)
        html = html.replace(placeholder, f'{FONTS}<link rel="stylesheet" href="{css}">'
                                         f'<div class="{name}">{markup}</div><script src="{js}"></script>')
    return html
