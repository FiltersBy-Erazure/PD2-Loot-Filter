"""MkDocs hook for the Erazure website: the players' pages made from the filter's own rules.

Each is a repo-root HTML file that a tool writes (build.bat runs them):
- Erazure-Unique-Set-Tiers.html (tools/tier_map.py), shown on the Unique & Set Tiers page (docs/tiers.md)
- Erazure-Non-Magic-Bases.html (tools/base_map.py), shown on the Bases page (docs/bases.md)
Each goes into the site as a file of its own, so its address keeps working. Its site page shows the same map with
no frame, so its filter bar can stay under the site's header while scrolling: this hook takes the styles, the
markup between the map's markers (<!-- tier-map:start --> ...) and the script out of the file, puts the markup where
the page has its placeholder (<div id="tier-map-here"></div> ...), and adds the styles and the script (with the
data) as two files of their own.
"""
from pathlib import Path

from mkdocs.exceptions import PluginError
from mkdocs.structure.files import File

ROOT = Path(__file__).resolve().parent.parent
MAPS = [  # (the generated page in the repo root, the tool that writes it, its site page, its marker and class name)
    ("Erazure-Unique-Set-Tiers.html", "tools/tier_map.py", "tiers.md", "tier-map"),
    ("Erazure-Non-Magic-Bases.html", "tools/base_map.py", "bases.md", "base-map"),
]
FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700'
         '&family=Source+Sans+3:wght@400;600;700&display=swap">')


def parts(page, tool, name):
    """(styles, markup, script) of a map, taken out of its generated page."""
    path = ROOT / page
    if not path.exists():
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


def on_files(files, config):
    for page, tool, _, name in MAPS:
        css, _, script = parts(page, tool, name)
        css_path, js_path = assets(name)
        files.append(File.generated(config, page, abs_src_path=str(ROOT / page)))
        files.append(File.generated(config, css_path, content=css))
        files.append(File.generated(config, js_path, content=script))
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
