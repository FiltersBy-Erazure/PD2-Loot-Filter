#!/usr/bin/env python3
"""
The Minimal version's page: Erazure-Minimal-Style.html (repo root, committed), from tools/style_map_template.html.
Every label whose symbols differ between Erazure - Main and Erazure - Minimal (a style variant: tools/build.py
STYLE_VARIANTS, styles/minimal.filter), drawn as the game draws it, Main beside Minimal. The website's Minimal
Version page shows it (website/hooks.py). build.bat, the hook and CI run it as the other players' pages.

Each label is a rule that uses the symbol aliases of sections/040-aliases.filter (those whose text has a color
code), with every alias filled in BH's way (file order, %NAME% in the output) once with Main's aliases and once with
the style's; the item name is a sample with the color an earlier layer gives it (150:429 %GOLD%%NAME% for uniques...).

    python tools/style_map.py           write the page
    python tools/style_map.py --check   exit 1 if the page is out of date (CI)
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402
import tier_map as T  # noqa: E402  (DOC_HEAD)

ROOT = build.ROOT
VARIANT = "Erazure - Minimal"
PAGE = ROOT / "Erazure-Minimal-Style.html"
TEMPLATE = ROOT / "tools" / "style_map_template.html"
SYMBOL_SECTION = "040-aliases.filter"
ALIAS_RE = re.compile(r"^Alias\[([A-Za-z0-9_]+)\]:(.*)$")
NOTIFY_RE = re.compile(r"%(CONTINUE|(BORDER|MAP|DOT|PX)-[0-9A-Fa-f]+|SOUNDID-\d+|TIER-\d)%")
MAX_LOOKS = 3  # labels shown per alias (or pair)

GROUPS = [  # (id, title, which symbol aliases: by their name; the first that matches), in the page's order
    ("uniques", "Unique items", lambda n: n.startswith(("UNI_", "FACET"))),
    ("sets", "Set items", lambda n: n.startswith("SET")),
    ("rares", "Rare and magic items", lambda n: n.startswith(("RARE_", "MAGIC_"))),
    ("runes", "Runes", lambda n: "RUNE" in n or n.endswith("BIG_GG")),
    ("pd2", "PD2 items", lambda n: not n.startswith(("HIGHLIGHT", "AMPLIFY", "LOWER_RES"))),
    ("descriptions", "Item descriptions", lambda n: True),
]
COLOR_RE = re.compile(r"%([A-Z_]+)%")
NAME_COLOR = [("UNI_", "GOLD"), ("FACET", "GOLD"), ("SET", "GREEN"), ("RARE_", "YELLOW"), ("MAGIC_", "BLUE")]
SAMPLE = {  # %NAME% of the sample rule: an unidentified unique, set or rare item shows its base's name
    "UNI_DCLONE_RATHMA": "Boneweave", "UNI_HIGH_VALUE": "Ring", "UNI_MEDIUM_VALUE": "Grand Charm",
    "UNI_MINIMAL_VALUE": "Ceremonial Javelin", "UNI_LLD": "War Hat", "UNI_NORMAL": "Light Plate",
    "UNI_EXCEPTIONAL": "Mage Plate", "UNI_ELITE": "Archon Plate", "SET_HIGH_VALUE": "Corona",
    "SET_MEDIUM_VALUE": "Hunter's Guise", "SET_LLD": "Heavy Gloves", "SET": "Ring", "RARE_HIGH_VALUE": "Diadem",
    "RARE_JEWEL_NAME": "Jewel", "RARE_MEDIUM_VALUE": "War Belt", "RARE_ETH_CRAFT": "Spiculum",
    "MAGIC_ETH_CRAFT": "Tower Shield", "LOWEST_RUNE_LOW_QTY": "El Rune", "LOWEST_RUNE_HIGH_QTY": "El Rune",
    "LOW_RUNE_LOW_QTY": "Ral Rune", "LOW_RUNE_HIGH_QTY": "Ral Rune", "MID_RUNE_LOW_QTY": "Lum Rune",
    "MID_RUNE_HIGH_QTY": "Lum Rune", "LEM_RUNE_LOW_QTY": "Lem Rune", "PUL_RUNE_LOW_QTY": "Pul Rune",
    "LEM_PUL_RUNE_HIGH_QTY": "Pul Rune", "UM_RUNE": "Um Rune", "MAL_RUNE": "Mal Rune", "IST_GUL_RUNE": "Ist Rune",
    "VEX_OHM_LO_RUNE": "Vex Rune", "SUR_BER_JAH_CHAM_ZOD_BIG_GG": "Ber Rune",
    "WORLDSTONE_LOW_QTY": "Worldstone Shard", "WORLDSTONE_HIGH_QTY": "Worldstone Shards x 12",
    "CATALYST_SHARD": "Catalyst Shard", "PUZZLEPIECE": "Puzzlepiece", "PUZZLEBOX": "Larzuk's Puzzlebox",
    "DEMONIC_CUBE": "Demonic Cube",
}
OFF_TOGGLES = ("BIG_GG", "POE_SOUNDS", "REVEALED")  # off in Erazure - Main, which the Minimal version is built from


def key_of(name):
    return re.sub(r"_(LEFT|RIGHT)$", "", name)


def name_color(key):
    return next((f"%{c}%" for prefix, c in NAME_COLOR if key.startswith(prefix)), "%WHITE%")


def aliases(lines):
    """[(name, text)] in file order, as BH reads them (the text trimmed)."""
    out = []
    for line in lines:
        m = ALIAS_RE.match(line.split("//")[0])
        if m:
            out.append((m[1], m[2].strip()))
    return out


def fill(text, alias_list):
    for name, value in alias_list:
        text = text.replace(f"%{name}%", value)
    return text


def drawn(text):
    """What the game draws: (color, character) pairs; a space has no color, a color code with nothing after it
    draws nothing."""
    out, color, pos = [], None, 0
    for m in list(COLOR_RE.finditer(text)) + [None]:
        out += [(None if ch == " " else color, ch) for ch in text[pos:m.start() if m else len(text)]]
        if m:
            color, pos = m[1], m.end()
    return out


def label(output, alias_list, key):
    """A rule's output as the label BH draws: aliases filled in, notifications and the description left out."""
    text = fill(output, alias_list)
    text = NOTIFY_RE.sub("", re.sub(r"\{.*\}", "", text)).strip()
    text = text.replace("%NAME%", name_color(key) + SAMPLE.get(key, "Item"))
    return text.replace("%QTY%", "12").replace("%ILVL%", "92")


def page_data():
    parts, _ = build.read_sections(check=True)
    _, season, date = build.load_version()
    version = build.version_text(season, date)
    joined = b"".join(d for _, d in parts).replace(build.PLACEHOLDER, version.encode())
    lines = joined.split(b"\r\n")
    blocks = build.find_toggle_blocks(lines)
    base, style_file = build.STYLE_VARIANTS[VARIANT]
    where = build.line_locator(parts)
    main = build.render(lines, blocks, base)
    minimal = build.apply_style(main, build.load_style(style_file, True, []), style_file, where)
    main = [x.decode("utf-8") for x in main]
    minimal = [x.decode("utf-8") for x in minimal]
    main_aliases, min_aliases = aliases(main), aliases(minimal)

    symbol_text = dict(sections_symbols(parts))
    titles = dict(symbol_titles(parts))
    order = {name: i for i, (name, _) in enumerate(main_aliases)}
    cards = {}
    for name in symbol_text:
        cards.setdefault(key_of(name), []).append(name)
    # a rule belongs to the card of the last-defined symbol alias in it (Rare Jewels' name sits inside the Rare High
    # Value look: those rules are the jewels' card)
    looks = {k: [] for k in cards}
    for i, line in enumerate(main):
        if not line.startswith("ItemDisplay["):
            continue
        cond, output = line[len("ItemDisplay["):].split("]:", 1)
        output = output.split("//")[0]
        words = cond.replace("(", " ").replace(")", " ").split()
        if any(t in words for t in OFF_TOGGLES):
            continue  # a rule only the other versions use
        used = [n for n in symbol_text if f"%{n}%" in output]
        if not used:
            continue
        key = key_of(max(used, key=order.get))
        a, b = label(output, main_aliases, key), label(minimal[i].split("]:", 1)[1].split("//")[0], min_aliases, key)
        if (drawn(a), drawn(b)) not in [(drawn(x["main"]), drawn(x["minimal"])) for x in looks[key]]:
            looks[key].append({"main": a, "minimal": b, "where": where(i)})

    groups = []
    for gid, title, _ in GROUPS:
        rows, same = [], []
        for key, names in cards.items():
            if next(g[0] for g in GROUPS if g[2](names[0])) != gid:
                continue
            shown = [x for x in looks[key] if drawn(x["main"]) != drawn(x["minimal"])][:MAX_LOOKS]
            name = titles[names[0]]
            if shown and rows and rows[-1]["title"] == name:  # aliases under one comment ("Um Mal"): one row
                rows[-1]["looks"] += shown
            elif shown:
                rows.append({"title": name, "looks": shown})
            elif looks[key] and name not in same:
                same.append(name)
        if rows or same:
            groups.append({"id": gid, "title": title, "rows": rows, "same": same})
    cube = next(v for n, v in min_aliases if n == "MAIN_VERSION_NAME")
    foot = (f"Built from the filter's sections and styles/{style_file} ({version}) by tools/style_map.py: every "
            f"label whose symbols differ, from the filter's own rules.")
    return {"groups": groups, "cube": cube, "foot": foot}


def sections_symbols(parts):
    """(name, text) of the symbol aliases: 040's aliases whose text has a color code."""
    data = dict(parts)[SYMBOL_SECTION].decode("utf-8")
    for line in data.split("\r\n"):
        m = ALIAS_RE.match(line)
        if m and "%" in m[2] and not m[2].startswith("("):
            yield m[1], m[2]


def symbol_titles(parts):
    """(alias name, the comment line above it: 'Unique High Value'), cut at a colon."""
    title = ""
    for line in dict(parts)[SYMBOL_SECTION].decode("utf-8").split("\r\n"):
        if line.startswith("// "):
            title = line[3:].split(":")[0].strip()
        m = ALIAS_RE.match(line)
        if m:
            yield m[1], title


def page_text(data):
    page = T.DOC_HEAD + TEMPLATE.read_text(encoding="utf-8") + "\n</body>\n</html>\n"
    return page.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")))


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="The Minimal version's page: Main's labels beside Minimal's.")
    ap.add_argument("--check", action="store_true", help=f"exit 1 if {PAGE.name} is out of date")
    args = ap.parse_args()
    data = page_data()
    text = page_text(data)
    current = PAGE.read_text(encoding="utf-8") if PAGE.exists() else ""
    if args.check:
        if current != text:
            print(f"{PAGE.name} is out of date: run python tools/style_map.py (build.bat does)")
            sys.exit(1)
        print("minimal style page up to date")
        return
    if current != text:
        PAGE.write_text(text, encoding="utf-8", newline="\n")
        print(f"updated {PAGE.name} ({len(text) // 1024} KB)")
    rows = sum(len(g["rows"]) for g in data["groups"])
    print(f"minimal style page: {rows} looks that differ")


if __name__ == "__main__":
    main()
