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
import re
import sys
import zlib
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import pd2_data as P  # noqa: E402  (the unique and set items, their properties as filter codes)
import shop_map as S  # noqa: E402  (the base and stat tables, as the shop page reads them)
import style_map  # noqa: E402  (the look cards' sample names and name colors, the Minimal page's)
import tier_map as T  # noqa: E402  (DOC_HEAD, the players' pages' document head; sounds, palette, bases, groups)

ROOT = Path(__file__).resolve().parent.parent
EDITOR = ROOT / "tools" / "editor"
TEMPLATE = EDITOR / "template.html"
PAGE = ROOT / "Erazure-Filter-Editor.html"
ASSET_INFO = ROOT / "tools" / "editor_assets.json"
# the modules, in the order the page runs them (each adds itself to the EZ namespace)
MODULES = ["core.js", "ui.js", "store.js", "filter.js", "features.js", "edits.js", "rules.js", "ops.js",
           "overrides.js", "volume.js", "wishlists.js", "maps.js", "render.js", "glyphs.js", "scene.js", "sound.js",
           "engine.js", "lint.js", "words.js", "diff.js", "items.js", "share.js", "app.js", "area-start.js",
           "area-options.js", "area-features.js", "area-items.js", "area-wishlists.js", "area-maps.js", "area-looks.js", "area-alerts.js",
           "area-rules.js", "area-erazure.js", "area-changes.js", "area-help.js", "preview.js"]
ASSETS = ROOT / "Erazure-Filter-Editor-Assets"
# PD2's own drop sounds (pd2\dropsounds\tinkNN.wav), the PoE versions' picks
POE_SOUNDS = range(4714, 4730)

# ---------------------------------------------------------------- the item catalog (the preview's items)

# BH's gem words read the item types (Item.cpp: ancestor types): quality 1-5 (chipped .. perfect), type 1-7
GEM_LEVEL = {"gem0": 1, "gem1": 2, "gem2": 3, "ggm3": 4, "ggm4": 5}
GEM_TYPE = {"gema": 1, "ggma": 1, "gemd": 2, "ggmd": 2, "geme": 3, "ggme": 3, "gemr": 4, "ggmr": 4, "gems": 5,
            "ggms": 5, "gemt": 6, "ggmt": 6, "gemz": 7, "ggmz": 7}
MAP_TIERS = {"t1m": 1, "t2m": 2, "t3m": 3, "t4m": 4, "t5m": 5}  # BH maptiers: the base's own item type
# the base table's fields, in the order the page reads them (EZ.items)
BASE_FIELDS = ["code", "name", "groups", "cat", "qlvl", "mlvl", "w", "h", "maxsock", "sockets", "flags", "autoprefix",
               "gem", "rune", "maptier", "reqstr", "reqdex", "lvlreq", "minac", "maxac", "block", "dmg", "speed",
               "range", "up", "dur", "invfile", "invtrans", "cost", "types", "cls", "hand", "throw"]
FLAGS = {"eth": 1, "staffmod": 2, "quest": 4, "map": 8, "stack": 16, "spawnable": 32, "nodur": 64}
# a property's filter code -> the stats it sets (the unique / set table's ED is +% defense; a damage roll sets the
# one-handed, two-handed and throwing stat alike)
CODE_STATS = {"ED": [16], "EDAM": [17, 18], "MINDMG": [21, 23, 159], "MAXDMG": [22, 24, 160], "RES": [39, 41, 43, 45],
              "ALLATTRIB": [0, 1, 2, 3], "MAXRES": [40, 42, 44, 46], "SOCK": [194]}


def num(text, default=0):
    try:
        return int(text)
    except (TypeError, ValueError):
        return default


def game_text(s):
    """A name of the game's string tables as the game shows it: docs/ hold them read as Latin-1 though they are UTF-8
    ("Ã¿c8El Rune" for "ÿc8El Rune", the rune's own orange)."""
    try:
        return s.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return s


def code_stats(code, shift):
    """[(stat, param, factor)] of a property's filter code (named codes are as shown: life and mana x 256; STAT<n>
    and MULTI<n>,<p> hold the game's own value already)."""
    named = {c: s for s, c in P.NAMED.items() if c != "ED"}
    if code in CODE_STATS:
        return [(s, 0, 1 << shift.get(s, 0)) for s in CODE_STATS[code]]
    if code in named:
        return [(named[code], 0, 1 << shift.get(named[code], 0))]
    m = re.fullmatch(r"STAT(\d+)", code)
    if m:
        return [(int(m.group(1)), 0, 1)]
    m = re.fullmatch(r"MULTI(\d+),(\d+)", code)
    if m:
        return [(int(m.group(1)), int(m.group(2)), 1)]
    m = re.fullmatch(r"(SK|OS|CLSK|TABSK)(\d+)", code)
    if m:
        return [({"SK": 107, "OS": 97, "CLSK": 83, "TABSK": 188}[m.group(1)], int(m.group(2)), 1)]
    return []  # a random skill (RANDSK...): left out


def catalog():
    """The bases, unique and set items, stats and skills the preview builds items from."""
    bases = T.load_bases()
    rows = {r["code"]: r for r in S.tsv(P.BASE_STATS_FILE)}
    cats = list(T.CATEGORY_ORDER)
    out_bases = []
    for code, b in sorted(bases.items()):
        r = rows.get(code, {})
        types = set(b["types"])
        groups = set(T.item_groups(types)) | {T.TIER_GROUP.get(b["tier"], "NORM")}
        cat = T.category(b)
        if cat not in cats:
            cats.append(cat)
        gem_level = next((v for t, v in GEM_LEVEL.items() if t in types), 0)
        gem_type = next((v for t, v in GEM_TYPE.items() if t in types), 0)
        flags = 0
        flags |= FLAGS["eth"] if b["eth"] else 0
        flags |= FLAGS["staffmod"] if r.get("staffmods") else 0
        flags |= FLAGS["quest"] if "ques" in types or code in T.QUEST_CODES else 0
        flags |= FLAGS["map"] if "map" in types else 0
        flags |= FLAGS["stack"] if num(r.get("stackable")) else 0
        flags |= FLAGS["spawnable"] if b["spawnable"] else 0
        flags |= FLAGS["nodur"] if num(r.get("nodurability")) else 0
        up = ""
        if r.get("ubercode") and code == r.get("normcode") and r["ubercode"] != code:
            up = r["ubercode"]
        elif r.get("ultracode") and code == r.get("ubercode") and r["ultracode"] != code:
            up = r["ultracode"]
        dmg = [num(r.get(k)) for k in ("mindam", "maxdam", "2handmindam", "2handmaxdam", "minmisdam", "maxmisdam")]
        out_bases.append([
            code, game_text(b["name"]), " ".join(sorted(groups)), cats.index(cat), b["qlvl"], b["mlvl"], b["width"], b["height"],
            list(b["maxsock"]), b["sockets"], flags, num(r.get("auto prefix")),
            [gem_level, gem_type] if gem_level else 0,
            int(code[1:3]) if "rune" in types and re.fullmatch(r"r\d\d", code) else 0,
            MAP_TIERS.get(b["types"][0] if b["types"] else "", -1),
            num(r.get("reqstr")), num(r.get("reqdex")), num(r.get("levelreq")), num(r.get("minac")), b["maxac"],
            b["block"], dmg if any(dmg) else 0, num(r.get("speed")), num(r.get("rangeadder")), up,
            num(r.get("durability")), r.get("invfile", ""), num(r.get("InvTrans")), num(r.get("cost")),
            ",".join(b["types"]), num(r.get("class"), -1) if r.get("class", "") != "" else -1,
            (2 if num(r.get("2handed")) else 1) | (2 if num(r.get("1or2handed")) else 0), num(r.get("throwable"))])
    data = S.Data()
    shift = {i: s["ValShift"] for i, s in data.stats.items() if s["ValShift"]}
    sets = {}
    for it in T.load_items(bases):
        if it["kind"] == "SET":
            sets[it["name"]] = it["set"]
    uniques = []
    for it in P.load_items():
        if it["code"] not in bases:
            continue
        props = []
        for group in it["props"]:
            for code, lo, hi in group:
                for sid, param, factor in code_stats(code, shift):
                    props.append([sid, param, lo * factor, hi * factor])
        uniques.append([0 if it["kind"] == "UNI" else 1, game_text(it["name"]), it["code"], it["lvlreq"], int(bool(it["eth"])),
                        props, sets.get(it["name"], "") if it["kind"] == "SET" else ""])
    stats = [[i, s["stat"], s["ValShift"] or 0, s["descpriority"] or 0, game_text(s.get("descstrpos") or ""),
              game_text(s.get("descstrneg") or ""), game_text(s.get("descstr2") or ""), s["descfunc"] or 0,
              s["descval"] or 0, s["dgrp"] or 0, s["dgrpfunc"] or 0, s["dgrpval"] or 0,
              game_text(s.get("dgrpstrpos") or ""), num(s.get("op")), num(s.get("op param"))]
             for i, s in sorted(data.stats.items())]
    # a class skill's tab (TABSK number) from the assets' index (tools/editor_assets.py reads it from the game)
    tabs = json.loads(ASSET_INFO.read_text(encoding="utf-8")).get("skillTabs", {}) if ASSET_INFO.exists() else {}
    skills = [[i, s["name"], s["class"], tabs.get(str(i), -1)] for i, s in sorted(data.skills.items())]
    strings = {k: game_text(v) for k, v in data.strings.items() if k.isdigit() or k.startswith("class:")}
    return {"baseFields": BASE_FIELDS, "flags": FLAGS, "cats": cats, "bases": out_bases, "uniques": uniques,
            "stats": stats, "skills": skills, "statMax": max(data.stats) + 1, "skillMax": max(data.skills) + 1,
            "townIds": sorted(T.TOWN_IDS), "strings": strings}


def map_stats():
    """[[stat, property code, lowest, highest]] of every stat a map's affixes roll (docs/pd2-magic-affixes.tsv: the
    affixes whose item types are maps): the Maps area's mods."""
    path = ROOT / "docs" / "pd2-magic-affixes.tsv"
    rows = [line.split("	") for line in path.read_text(encoding="utf-8").splitlines() if line and not line.startswith("#")]
    head, out = rows[0], {}
    types, mods = head.index("itypes"), head.index("mods")
    for r in rows[1:]:
        if len(r) <= mods or not any(t in ("t1m", "t2m", "t3m", "t4m") for t in r[types].split(",")):
            continue
        for prop in json.loads(r[mods]):
            for sid, _p, lo, hi in prop[5]:
                cur = out.setdefault(sid, [sid, prop[0], lo, hi])
                cur[2], cur[3] = min(cur[2], lo), max(cur[3], hi)
    return [out[k] for k in sorted(out)]


def page_data():
    """The catalogs the page embeds (from docs/, the tools and the committed asset info; nothing from sections/)."""
    sounds = T.load_sounds()
    data = {
        "palette": [T.load_palette().get(f"{i:02X}", "#000000") for i in range(256)],
        "sounds": {str(i): s["name"] for i, s in sorted(sounds.items())},
        "soundCount": max(sounds) + 1,
        "poeSounds": [i for i in POE_SOUNDS if i in sounds],
        "looks": {"sample": style_map.SAMPLE, "nameColor": style_map.NAME_COLOR},
        "catalog": catalog(),
        "mapStats": map_stats(),
    }
    if ASSET_INFO.exists():
        assets = json.loads(ASSET_INFO.read_text(encoding="utf-8"))
        assets.pop("skillTabs", None)  # in the catalog's skills
        files =list(assets.get("atlases", {}).values()) + list(assets.get("floors", {}).values())
        files += [assets["ground"]] if "ground" in assets else []
        files += list(assets.get("sounds", {}).values())
        for a in files:  # each file's CRC: a changed file is fetched again
            f = ASSETS / a["file"]
            if f.exists():
                a["v"] = format(zlib.crc32(f.read_bytes()) & 0xffffffff, "x")
        data["assets"] = assets
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
