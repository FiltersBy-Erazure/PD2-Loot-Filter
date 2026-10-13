"""MkDocs hook for the Erazure website: the players' unique/set tier map.

The tier map is the repo-root Erazure-Unique-Set-Tiers.html, written by tools/tier_map.py (which build.bat runs).
- It goes into the site as a file of its own, so its address (/Erazure-Unique-Set-Tiers.html) keeps working.
- The Unique & Set Tiers page (docs/tiers.md) shows the same tier map inside the site, with no frame, so its filter
  bar can stay under the site's header while scrolling: this hook takes the styles, the markup between the
  tier-map markers and the script out of that file, puts the markup where docs/tiers.md has the placeholder, and
  adds the styles and the script (with the data) as two files of their own.
"""
from pathlib import Path

from mkdocs.exceptions import PluginError
from mkdocs.structure.files import File

PAGE = Path(__file__).resolve().parent.parent / "Erazure-Unique-Set-Tiers.html"
TIERS = "tiers.md"
PLACEHOLDER = '<div id="tier-map-here"></div>'
CSS = "assets/tier-map/tier-map.css"
JS = "assets/tier-map/tier-map.js"
FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700'
         '&family=Source+Sans+3:wght@400;600;700&display=swap">')


def parts():
    """(styles, markup, script) of the tier map, taken out of the generated page."""
    if not PAGE.exists():
        raise PluginError(f"{PAGE.name} is missing in the repo root: run python tools/tier_map.py (build.bat does)")
    text = PAGE.read_text(encoding="utf-8")

    def between(start, end, after):
        try:
            i = text.index(start, text.index(after)) + len(start)
            return text[i:text.index(end, i)]
        except ValueError:
            raise PluginError(f"{PAGE.name}: no {start}...{end} after {after} (tools/tier_map_template.html markers)")
    return (between("<style>", "</style>", "<!-- tier-map:css -->"),
            between("<!-- tier-map:start -->", "<!-- tier-map:end -->", "<!-- tier-map:start -->"),
            between("<script>", "</script>", "<!-- tier-map:end -->"))


def on_files(files, config):
    css, _, script = parts()
    files.append(File.generated(config, PAGE.name, abs_src_path=str(PAGE)))
    files.append(File.generated(config, CSS, content=css))
    files.append(File.generated(config, JS, content=script))
    return files


def on_page_content(html, page, config, files):
    if page.file.src_uri != TIERS:
        return html
    if PLACEHOLDER not in html:
        raise PluginError(f"docs/{TIERS} has no {PLACEHOLDER} for the tier map")
    _, markup, _ = parts()
    css = files.get_file_from_path(CSS).url_relative_to(page.file)
    js = files.get_file_from_path(JS).url_relative_to(page.file)
    return html.replace(PLACEHOLDER, f'{FONTS}<link rel="stylesheet" href="{css}">'
                                     f'<div class="tier-map">{markup}</div><script src="{js}"></script>')
