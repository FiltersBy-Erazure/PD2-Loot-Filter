#!/usr/bin/env python3
"""
The enhanced damage highlights of rare and crafted weapons (sections/320-highlights-ed-amp-lr.filter, and the purple
band of the ED tag in 300-affix-tags), for the author's review on a page (2026-11-10: which ED thresholds per weapon
type, rare vs crafted, now that Season 14's Visceral prefix lifts rares by 100):

    python tools/ed_highlights.py --page    write tools/ed_highlights.html (gitignored), published as a claude.ai page
                                            whose db holds the author's thresholds
    python tools/ed_highlights.py --dump    print today's tiers per weapon type and the page's tables

The page works out, in the browser and exactly (no sampling), how much enhanced damage a rare or crafted weapon of each
type rolls, for an item level, a map tier and a craft the author picks, uncorrupted and corrupted, and shows for each
threshold how many items reach it. The model:
- ED comes from prefixes only: MagicPrefix rows of docs/pd2-magic-affixes.tsv (version not 0, spawnable, frequency
  not 0; rare flag 1 or 3 on a rare, 1 on a crafted item), level <= affix level <= maxlevel, an item type of the base
  and none it excludes. Each prefix pick takes an affix by weight among those of groups not yet on the item, so the
  pure ED group (105: Savage ... Visceral) and the ED + attack rating group (111: Soldier's ... Master's, bows and
  crossbows Grandmaster's) can both roll, and their ED adds up.
- A rare's affix count by item level (6 from 85; 5-6 from 65; 4-6 from 45; else 3-6), each pick a prefix or a suffix
  at even odds, at most 3 a side. A crafted item: 1-4 random affixes by its item level (character level / 2 + the
  base's item level / 2, BH's CRAFTALVL), <31: 1, 31-50: 2, 51-70: 3, 71+: 4 (the base game's cut-offs).
- The affix level is tier_map.affix_level. In maps a tiered affix (version 100 + t) weighs
  +min(10(t + 1), 10(M + 1))%, M = area level - 86 (T1 1, T2 2, T3 3): the roller's map bonus.
- Crafts: docs/pd2-crafts.tsv's weapon rows (Hitpower, Blood, Safety +50-80; Brilliant +20-40; the rest none).
- Corruption of an unsocketed weapon: the outcomes of docs/pd2-corruptions.tsv that add ED, at CubeMain's odds
  (CORRUPTION_ODDS: 80 of 1000 rolls). The other 92% add none (a quarter of them turn the item into a new rare).
- Every base of a type that can drop at the item level counts the same.
"""
import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import tier_map as T  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "tools" / "ed_highlights_template.html"
PAGE = ROOT / "tools" / "ed_highlights.html"
PAGE_URL = "https://claude.ai/artifact/HhsuxifBTUNiynx46oUb4r"  # db: tiers/rare-<type>, tiers/craft-<type>, tiers/note
AFFIXES = ROOT / "docs" / "pd2-magic-affixes.tsv"
BASES = ROOT / "docs" / "pd2-bases.tsv"
CRAFTS = ROOT / "docs" / "pd2-crafts.tsv"
CORRUPTIONS = ROOT / "docs" / "pd2-corruptions.tsv"
HIGHLIGHTS = ROOT / "sections" / "320-highlights-ed-amp-lr.filter"
TAGS = ROOT / "sections" / "300-affix-tags.filter"
ALIASES = ROOT / "sections" / "040-aliases.filter"
VERSION = ROOT / "version.json"

# the page's weapon types: key, label, the first item type(s) of their bases (staves, wands and orbs left out: 320
# never highlights their ED)
TYPES = [("axe1", "Axes (1H)"), ("axe2", "Axes (2H)"), ("swor1", "Swords (1H)"), ("swor2", "Swords (2H)"),
         ("knif", "Daggers"), ("club", "Clubs"), ("mace", "Maces"), ("hamm", "Hammers"), ("scep", "Scepters"),
         ("spea", "Spears"), ("pole", "Polearms"), ("h2h", "Claws"), ("jave", "Javelins"),
         ("tkni", "Throwing knives"), ("taxe", "Throwing axes"), ("bow", "Bows"), ("xbow", "Crossbows"),
         ("abow", "Amazon bows"), ("aspe", "Amazon spears"), ("ajav", "Amazon javelins")]
TIER_NAMES = {"normal": 0, "exceptional": 1, "elite": 2}
# CubeMain's corruption of an unsocketed weapon ("weap,nos", the roll 1-1000 against op 16 thresholds, first row in
# file order): the outcomes that add ED and their share of the 1000 (live 2026-11-04 build; S13's rows are the same)
CORRUPTION_ODDS = {2: 25, 17: 15, 22: 10, 24: 10, 25: 10, 26: 10}
OTHER_WORDS = {"STAT60": "{v}% life stolen", "IAS": "{v}% IAS", "STAT115": "ignore target's defense",
               "STAT141": "{v}% deadly strike", "AR": "+{v} attack rating"}
COLOR_WORDS = {"WHITE", "RED", "GREEN", "BLUE", "GOLD", "GRAY", "BLACK", "TAN", "ORANGE", "YELLOW", "PURPLE",
               "DARK_GREEN", "CORAL", "SAGE", "TEAL", "LIGHT_GRAY"}
# the page's tiers, in order: key, name, what the rule asks of the character level
TIERS = [("lvl", "Orange stars", "below character level 80"), ("high", "Red stars", "below character level 80"),
         ("high80", "Orange stars", "from character level 80"), ("purple", "Purple stars", "every character level"),
         ("lr", "Blue stars", "every character level"), ("top", "Teal stars", "every character level"),
         ("gold", "Gold stars", "every character level")]


def tsv(path):
    lines = [ln for ln in path.read_text(encoding="utf-8").splitlines() if ln and not ln.startswith("#")]
    head = lines[0].split("\t")
    return [dict(zip(head, ln.split("\t"))) for ln in lines[1:]]


def num(x):
    try:
        return int(x)
    except (TypeError, ValueError):
        return 0


def type_key(types):
    first = types[0]
    if first in ("axe", "swor"):
        return first + ("2" if "2han" in types else "1")
    return {"h2h2": "h2h", "sc9": "pole"}.get(first, first)


def load_bases():
    keys = {k for k, _ in TYPES}
    out = []
    for b in tsv(BASES):
        types = b["types"].split(",")
        if "weap" not in types or b["spawnable"] != "1":
            continue
        k = type_key(types)
        if k in keys:
            out.append({"code": b["code"], "name": b["name"], "key": k, "tier": TIER_NAMES[b["tier"]],
                        "qlvl": num(b["qlvl"]), "types": set(types)})
    return out


def load_prefixes():
    out = []
    for a in tsv(AFFIXES):
        if a["kind"] != "prefix" or num(a["version"]) == 0 or a["spawnable"] != "1" or num(a["frequency"]) <= 0:
            continue
        if num(a["rare"]) == 0:
            continue
        mods = json.loads(a["mods"] or "[]")
        ed = next(((m[3], m[4]) for m in mods if m[0] == "dmg%"), (0, 0))
        out.append({"row": num(a["row"]), "name": a["name"], "g": num(a["group"]), "w": num(a["frequency"]),
                    "level": num(a["level"]), "max": num(a["maxlevel"]), "rare": num(a["rare"]),
                    "ver": num(a["version"]), "ed": ed,
                    "it": {t for t in a["itypes"].split(",") if t}, "et": {t for t in a["etypes"].split(",") if t}})
    return out


def crafts():
    """The weapon crafts by the ED they add: [{names, lo, hi}], largest first."""
    by = defaultdict(list)
    for r in tsv(CRAFTS):
        if r["type"] != "weap":
            continue
        ed = next(((lo, hi) for prop in json.loads(r["props"]) for code, lo, hi in prop if code == "EDAM"), (0, 0))
        by[ed].append(r["craft"])
    return [{"names": names, "lo": lo, "hi": hi} for (lo, hi), names in sorted(by.items(), reverse=True)]


def corruptions():
    out = []
    for r in tsv(CORRUPTIONS):
        if r["input"] != "weap,nos" or not r["props"]:
            continue
        props = [p for prop in json.loads(r["props"]) for p in prop]
        ed = next(((lo, hi) for code, lo, hi in props if code == "EDAM"), None)
        if not ed:
            continue
        n = num(r["outcome"])
        if n not in CORRUPTION_ODDS:
            raise SystemExit(f"corruption outcome {n} adds ED but has no odds in CORRUPTION_ODDS: read CubeMain")
        other = [OTHER_WORDS[c].format(v=lo if lo == hi else f"{lo}-{hi}") for c, lo, hi in props if c != "EDAM"]
        out.append({"n": n, "per1000": CORRUPTION_ODDS[n], "lo": ed[0], "hi": ed[1], "with": ", ".join(other)})
    if {c["n"] for c in out} != set(CORRUPTION_ODDS):
        raise SystemExit("CORRUPTION_ODDS names an outcome docs/pd2-corruptions.tsv has no ED for: update it")
    return out


# ---------------------------------------------------------------- today's tiers (320 and 300)

def aliases():
    out = {}
    for ln in ALIASES.read_text(encoding="utf-8").splitlines():
        m = re.match(r"Alias\[(\w+)\]:(.*)$", ln)
        if m:
            out[m.group(1)] = m.group(2)
    return out


def look_segments(text, al):
    """A rule's description line (the part before %CL%) as [[color, text], ...], aliases filled in, %ED% as 412."""
    for _ in range(4):
        text = re.sub(r"%(\w+)%", lambda m: al[m.group(1)] if m.group(1) in al and m.group(1) not in COLOR_WORDS
                      else m.group(0), text)
    text = text.replace("%ED%", "412").replace("%EDAM%", "412").replace("%%", "%")
    out, color, i = [], "WHITE", 0
    for m in re.finditer(r"%(\w+)%", text):
        if m.group(1) in COLOR_WORDS:
            if m.start() > i:
                out.append([color, text[i:m.start()]])
            color, i = m.group(1), m.end()
    if i < len(text):
        out.append([color, text[i:]])
    return [s for s in out if s[1]]


def highlight_rules():
    """320's ED highlight rules of rare and crafted weapons (the !EQUIPPED ones; each has an EQUIPPED twin)."""
    al = aliases()
    out = []
    for n, ln in enumerate(HIGHLIGHTS.read_text(encoding="utf-8").splitlines(), 1):
        m = re.match(r"ItemDisplay\[(.*?)\]:(.*)$", ln)
        if not m or "Enhanced Damage" not in m.group(2) or "!EQUIPPED" not in m.group(1):
            continue
        cond, out_text = m.group(1), m.group(2)
        if not re.search(r"\bRARE\b", cond):
            continue  # the magic-only rule
        band = re.search(r"\bED~(\d+)-(\d+)", cond) or re.search(r"\bED>(\d+)", cond)
        lo = int(band.group(1)) + (1 if band.re.pattern.startswith(r"\bED>") else 0)
        clvl = "below" if "CLVL<80" in cond else "from" if "CLVL>79" in cond else ""
        desc = re.search(r"\{(.*?)%CL%", out_text)
        out.append({"line": n, "cond": cond, "lo": lo, "clvl": clvl, "dagger": "!(DAGGER !THROWING)" in cond,
                    "look": look_segments(desc.group(1), al)})
    below = sorted((r for r in out if r["clvl"] == "below"), key=lambda r: r["lo"])
    from80 = [r for r in out if r["clvl"] == "from"]
    every = sorted((r for r in out if not r["clvl"]), key=lambda r: r["lo"])
    if len(below) != 2 or len(from80) != 1 or len(every) != 4:
        raise SystemExit(f"{HIGHLIGHTS.name} no longer has the 2 + 1 + 4 rare ED highlight rules this page reads: "
                         "update tools/ed_highlights.py")
    return dict(zip([k for k, _, _ in TIERS], below + from80 + every))


def tag_purple():
    """The ED a weapon's ED tag turns purple from (300's last weapon ED tag line)."""
    for ln in TAGS.read_text(encoding="utf-8").splitlines():
        m = re.match(r"ItemDisplay\[WEAPON \(MAG OR RARE OR CRAFT.*\bED>(\d+)\]:%WHITE%%EDAM%%PURPLE%ed", ln)
        if m:
            return int(m.group(1)) + 1
    raise SystemExit(f"{TAGS.name} has no purple weapon ED tag line any more: update tools/ed_highlights.py")


def today(bases, rules):
    """{type key: {tier: threshold or None, tag: n}}: 320's thresholds as they hold for the type's bases."""
    purple_tag = tag_purple()
    out = {}
    for k, _ in TYPES:
        groups = [T.item_groups(b["types"]) for b in bases if b["key"] == k]
        dagger = any("DAGGER" in g and "THROWING" not in g for g in groups)
        if dagger and not all("DAGGER" in g and "THROWING" not in g for g in groups):
            raise SystemExit(f"{k}: some bases are daggers in BH's sense and some aren't: split the type")
        t = {tier: (None if r["dagger"] and dagger else r["lo"]) for tier, r in rules.items()}
        t["tag"] = purple_tag
        out[k] = t
    return out


# ---------------------------------------------------------------- the page

def page_data():
    bases = load_bases()
    prefixes = load_prefixes()
    used, pools, pool_of, base_rows = {}, [], {}, []
    for b in bases:
        fit = tuple(i for i, a in enumerate(prefixes) if a["it"] & b["types"] and not a["et"] & b["types"])
        if fit not in pool_of:
            pool_of[fit] = len(pools)
            pools.append(fit)
        for i in fit:
            used.setdefault(i, len(used))
        base_rows.append([b["code"], b["name"], [k for k, _ in TYPES].index(b["key"]), b["tier"], b["qlvl"],
                          pool_of[fit]])
    order = sorted(used, key=lambda i: used[i])
    remap = {i: n for n, i in enumerate(order)}
    aff = [[prefixes[i]["name"], prefixes[i]["g"], prefixes[i]["w"], prefixes[i]["level"], prefixes[i]["max"],
            prefixes[i]["rare"], prefixes[i]["ver"], prefixes[i]["ed"][0], prefixes[i]["ed"][1]] for i in order]
    rules = highlight_rules()
    v = json.loads(VERSION.read_text(encoding="utf-8"))
    return {"types": [[k, lab] for k, lab in TYPES], "bases": base_rows, "affixes": aff,
            "pools": [[remap[i] for i in p] for p in pools], "crafts": crafts(), "corr": corruptions(),
            "tiers": [{"key": k, "name": name, "when": when, "line": rules[k]["line"], "look": rules[k]["look"],
                       "dagger": rules[k]["dagger"]} for k, name, when in TIERS],
            "today": today(bases, rules), "season": v.get("season", ""), "date": v.get("date", "")}


def write_page():
    data = page_data()
    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = TEMPLATE.read_text(encoding="utf-8")
    if "/*__DATA__*/null" not in html:
        raise SystemExit(f"{TEMPLATE.name} lost its /*__DATA__*/null marker")
    PAGE.write_text(html.replace("/*__DATA__*/null", blob), encoding="utf-8", newline="\n")
    print(f"wrote {PAGE.relative_to(ROOT)} ({PAGE.stat().st_size // 1024} KB)")


def dump():
    data = page_data()
    print("tiers (320, rare and crafted weapons):")
    for t in data["tiers"]:
        look = "".join(s[1] for s in t["look"])
        print(f"  {t['key']:7} {t['name']:18} {t['when']:26} line {t['line']:3}  {look}")
    print("today per type (lvl high high80 purple lr top gold tag):")
    for k, lab in data["types"]:
        t = data["today"][k]
        print(f"  {lab:16} " + " ".join(f"{t[x] if t[x] is not None else '-':>4}" for x in
                                        ("lvl", "high", "high80", "purple", "lr", "top", "gold", "tag")))
    print(f"{len(data['bases'])} bases, {len(data['pools'])} prefix pools, {len(data['affixes'])} prefixes")
    ed = [a for a in data["affixes"] if a[8]]
    for a in sorted(ed, key=lambda a: (a[1], a[7])):
        print(f"  group {a[1]:3} {a[0]:14} {a[7]:3}-{a[8]:3}  level {a[3]:2}{'-' + str(a[4]) if a[4] else '':4} "
              f"weight {a[2]:3} rare flag {a[5]} version {a[6]}")
    print("crafts:", data["crafts"])
    print("corruptions:", data["corr"])


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--page", action="store_true", help="write tools/ed_highlights.html")
    ap.add_argument("--dump", action="store_true", help="print today's tiers and the page's tables")
    args = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if args.page:
        write_page()
    else:
        dump()


if __name__ == "__main__":
    main()
