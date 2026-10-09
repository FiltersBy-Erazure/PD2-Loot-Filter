#!/usr/bin/env python3
"""
Unique and set item data from the PD2 wiki, for generating the unique/set variable-roll tags.

    python tools/item_data.py fetch            download the wiki item pages into docs/items/ (refresh each season)
    python tools/item_data.py report           every unique/set item: base codes and variable rolls
    python tools/item_data.py report --many 4  only items with at least 4 variable rolls

The pages are read from docs/items/*.wiki (raw wikitext). Base names are mapped to item codes, and to
the codes of the base's other tiers (an upgraded unique keeps its identity), with docs/pd2-item-codes.wiki.
A stat line is a variable roll when its current text has a range like +[140-180]%; ranges that come
from character level, other conditions ("(Based on Missing Life)") and set bonuses ("(2 Items)") are not rolls.
"""
import argparse
import datetime
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ITEMS_DIR = ROOT / "docs" / "items"
CODES_WIKI = ROOT / "docs" / "pd2-item-codes.wiki"
WIKI = "https://wiki.projectdiablo2.com"
PAGES = [  # what All_Unique_Weapons, All_Unique_Non-Weapons and All_Set_Items transclude
    "Axes", "Maces", "Swords", "Daggers", "Throwing", "Spears", "Polearms", "Bows", "Crossbows",
    "Scepters", "Staves", "Wands", "Class_Weapons",
    "Helms", "Chests", "Shields", "Gloves", "Boots", "Belts", "Quivers", "Amulets", "Rings", "Charms",
    "Normal", "Exceptional", "Elite",
]

HEAD_RE = re.compile(r'^={3,5}\s*<span class="d2-(gold|green)">(.+?)</span>\s*={3,5}\s*$', re.M)
NEXT_HEAD_RE = re.compile(r"^={2,5}[^=]", re.M)  # Class_Weapons puts its items under ===== headings
BASE_RE = re.compile(r"<p><b>(.+?)</b>")  # the base is the first bold text that is not a "Label:"
RANGE_RE = re.compile(r"\[(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)\]")
NOT_A_ROLL = re.compile(r"per Character Level|Based on Character Level|\(Based on |\(\d+ Items\)|Full Set|\(with ",
                        re.I)


# ---------------------------------------------------------------- fetch

def fetch():
    ITEMS_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.date.today().isoformat()
    for page in PAGES:
        url = f"{WIKI}/w/index.php?title={page}&action=raw"
        raw = subprocess.run(["curl", "-s", "-f", url], capture_output=True, check=True).stdout
        header = (f"<!-- Source: {WIKI}/wiki/{page} (raw wikitext, action=raw). Saved {today} by "
                  f"tools/item_data.py fetch. Wiki content, typically CC BY-SA. Refresh each season. -->\n")
        (ITEMS_DIR / f"{page}.wiki").write_bytes(header.encode("utf-8") + raw.replace(b"\r\n", b"\n"))
        print(f"saved docs/items/{page}.wiki ({len(raw)} bytes)")


# ---------------------------------------------------------------- base codes

def base_codes():
    """{lowercase base name: [codes of the same base family, normal to elite]} from the item-code tables."""
    families, row = {}, []

    def flush():
        codes = [c for c, _ in row]
        for c, name in row:
            families.setdefault(norm(name), codes if len(codes) > 1 else [c])
        row.clear()

    for line in CODES_WIKI.read_text(encoding="utf-8").splitlines():
        if line.startswith(("|-", "|}", "{|")):
            flush()
            continue
        if not line.startswith("|"):
            continue
        cells = [re.sub(r"<[^>]+>|\w+=\"[^\"]*\"\s*\|", "", c).strip() for c in line.lstrip("|").split("||")]
        for i in range(len(cells) - 1):
            if re.fullmatch(r"[a-z0-9]{2,5}", cells[i]) and re.search("[a-z]", cells[i]) \
                    and re.match(r"[A-Z]", cells[i + 1] or ""):
                row.append((cells[i], cells[i + 1]))
    flush()
    return families


# ---------------------------------------------------------------- parse

def norm(name):
    return name.replace("’", "'").strip().lower()


def clean(cell):
    cell = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]*)\]\]", r"\1", cell)  # [[link|text]] -> text
    cell = re.sub(r"<[^>]+>", "", cell)
    cell = re.sub(r"'''?", "", cell)
    return re.sub(r"\s+", " ", cell).strip()


def parse_stats(block):
    """The current ('After'/last column) stat lines of the item's first stat table."""
    start = block.find("{|")
    end = block.find("|}", start)
    if start < 0 or end < 0:
        return []
    stats = []
    for row in block[start:end].split("\n|-"):
        lines = [l for l in row.split("\n") if l.startswith("|") and not l.startswith(("|-", "|}", "{|"))]
        for line in lines:
            cells = line.lstrip("|").split("||")
            for part in re.split(r"<br\s*/?>", cells[-1]):  # one cell can hold several stats
                text = clean(part)
                if text:
                    stats.append(text)
    return stats


def versions(block):
    """An item that comes in versions (Kadala's Heirloom: rows "or" between the versions, then "and" before
    what all have): [(label, its own stat lines, the shared stat lines)], or [] for an ordinary item."""
    start = block.find("{|")
    end = block.find("|}", start)
    if start < 0 or end < 0:
        return []
    groups, shared, current, in_shared, has_or = [], [], [], False, False
    for row in block[start:end].split("\n|-"):
        lines = [l for l in row.split("\n") if l.startswith("|") and not l.startswith(("|-", "|}", "{|"))]
        word = clean(" ".join(l.lstrip("|") for l in lines)).lower()
        if word == "or":
            groups.append(current)
            current, has_or = [], True
        elif word == "and":
            groups.append(current)
            current, in_shared = [], True
        else:
            for line in lines:
                for part in re.split(r"<br\s*/?>", line.lstrip("|").split("||")[-1]):
                    text = clean(part)
                    if text:
                        (shared if in_shared else current).append(text)
    if not in_shared:
        groups.append(current)
    if not has_or:
        return []
    out = []
    for i, own in enumerate(g for g in groups if g):
        m = re.search(r"to (Fire|Cold|Lightning|Poison|Magic) Skills", own[0])
        label = m.group(1) if m else "Physical" if re.search(r"Enhanced Damage", own[0]) else f"version {i + 1}"
        out.append((label, own, shared))
    return out


def items(families=None):
    families = families or base_codes()
    out = []
    for page in PAGES:
        path = ITEMS_DIR / f"{page}.wiki"
        if not path.exists():
            sys.exit(f"missing {path.relative_to(ROOT)}: run python tools/item_data.py fetch")
        text = path.read_text(encoding="utf-8")
        for m in HEAD_RE.finditer(text):
            nxt = NEXT_HEAD_RE.search(text, m.end())
            block = text[m.end():nxt.start() if nxt else len(text)]
            if "{{#lsth:" in block:
                continue  # a set item shown from its set page: parsed there
            bases = [clean(b) for b in BASE_RE.findall(block)]
            bases = [b for b in bases if ":" not in b and not re.fullmatch(r"\(.+ Only\)", b)]
            base = bases[0] if bases else "?"
            common = {"kind": "UNI" if m.group(1) == "gold" else "SET", "page": page, "base": base,
                      "codes": families.get(norm(base), [])}
            split = versions(block)
            if split:  # one item per version; its own lines (the version's identity) are pickable too
                for label, own, shared in split:
                    stats = own + shared
                    rolls = own + [s for s in shared if RANGE_RE.search(s) and not NOT_A_ROLL.search(s)]
                    out.append({**common, "name": f"{clean(m.group(2))} ({label})", "display": clean(m.group(2)),
                                "stats": stats, "rolls": rolls})
                continue
            stats = parse_stats(block)
            rolls = [s for s in stats if RANGE_RE.search(s) and not NOT_A_ROLL.search(s)]
            out.append({**common, "name": clean(m.group(2)), "stats": stats, "rolls": rolls})
    return out


# ---------------------------------------------------------------- main

def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="PD2 wiki unique/set item data.")
    ap.add_argument("command", choices=["fetch", "report", "json"])
    ap.add_argument("--many", type=int, default=0, help="report: only items with at least this many rolls")
    args = ap.parse_args()
    if args.command == "fetch":
        fetch()
        return
    data = items()
    if args.command == "json":
        print(json.dumps(data, ensure_ascii=False, indent=1))
        return
    shown = [it for it in data if len(it["rolls"]) >= args.many]
    for it in shown:
        codes = " ".join(it["codes"]) or "NO CODE FOR BASE"
        print(f"{it['kind']} {it['name']} [{it['base']}: {codes}] ({len(it['rolls'])} rolls, {it['page']})")
        for r in it["rolls"]:
            print(f"    {r}")
    uni = sum(it["kind"] == "UNI" for it in data)
    nocode = [f"{it['name']} ({it['base']})" for it in data if not it["codes"]]
    print(f"\n{len(data)} items ({uni} unique, {len(data) - uni} set); "
          f"{sum(len(it['rolls']) >= 4 for it in data)} with 4+ variable rolls; "
          f"{sum(not it['rolls'] for it in data)} with none")
    if nocode:
        print(f"{len(nocode)} items whose base has no item code in docs/pd2-item-codes.wiki: {', '.join(nocode)}")


if __name__ == "__main__":
    main()
