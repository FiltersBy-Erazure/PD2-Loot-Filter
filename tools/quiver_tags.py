#!/usr/bin/env python3
"""
Tags and hiding of identified magic, rare and crafted arrows and bolts (sections/260-arrow-bolt-affixes.filter), for
the author's review on a page (2026-10-29: tag more stats below an affix level, and retune which quivers 260 hides
for having too few useful stats):

    python tools/quiver_tags.py --page    write tools/quiver_tags.html (gitignored), published as a claude.ai page whose
                                          db holds the author's choices

The page's Tags tab is one row per stat a quiver can roll (MagicPrefix / MagicSuffix rows of docs/pd2-magic-affixes.tsv
on the quiver item types: spawnable, version and frequency not 0), with its affixes, the best roll by affix level and
what 260 tags today (tools/label_cuts.py's engine on 260's lines, an identified rare arrow / bolt quiver), and a switch:
tag every roll below an affix level the page sets. It also lists what the crafts (docs/pd2-crafts.tsv) and corruptions
(docs/pd2-corruptions.tsv) of quivers add, and whether 260 tags it.

The Hiding tab holds 260's hide rules as they are (read from the section): from which character level they hide, per
stat from which roll it counts as useful, and how many useful stats a magic / rare or crafted quiver needs; the author
edits them and the page rolls dropped quivers (PD2's affix roller: the affix level formula, frequency weights, one
affix per group, a rare's affix count by item level) to show what share each version hides, per item level.
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import label_cuts as LC  # noqa: E402
import low_level_tags as LL  # noqa: E402

T = LC.T
ROOT = LC.ROOT
SECTION = ROOT / "sections" / "260-arrow-bolt-affixes.filter"
TEMPLATE = ROOT / "tools" / "quiver_tags_template.html"
PAGE = ROOT / "tools" / "quiver_tags.html"
PAGE_URL = "https://claude.ai/artifact/MNJ48VqDN4fKksSgSGfPHy"  # db: quivers/tags, quivers/hiding
AFFIXES = ROOT / "docs" / "pd2-magic-affixes.tsv"
CRAFTS = ROOT / "docs" / "pd2-crafts.tsv"
CORRUPTIONS = ROOT / "docs" / "pd2-corruptions.tsv"
CUT = 60  # the page's first affix level cut (the author picks it there)
CUTS = (20, 30, 40, 50, 60, 70, 80)
BANDS = (19, 39, 59, 79, 99)  # the page's roll columns: the best roll up to these affix levels
ILVLS = (10, 20, 30, 40, 50, 60, 70, 80, 85, 90, 99)  # the hide rates' item levels
KINDS = [("arrows", "Arrows", ("aqv", "aqv2", "aqv3")), ("bolts", "Bolts", ("cqv", "cqv2", "cqv3"))]
QUIVER_TYPES = {"bowq", "xboq", "misl"}

# Pierce: a quiver stat 300's rare rows never needed (low_level_tags has no row for it)
LL.PROPS.setdefault("pierce", ("prc", "", "%WHITE%%STAT156%%ORANGE%prc"))
# the page's rows: key, label, group, on to start with (the author's low-level picks for bows and crossbows, else for
# amulets, else low_level_tags' first answers: a proposal, the page says so)
CATS = ["Life and mana", "Attributes", "Resistances", "Defense", "Speed", "Offense", "Elemental damage", "Skills",
        "Find and other"]
EXTRA_ROWS = [("prc", "Pierce", "Offense", True)]
# 260's look of a stat it has a line for (its lowest band), where it differs from 300's
LOOK_260 = {
    "knock": "%LIGHT_GRAY%Knb",
    "ow": "%WHITE%%STAT135%%CORAL%ow",
    "ed_dmg": "%WHITE%%ED%%RED%ed",
    "prc": "%WHITE%%STAT156%%ORANGE%prc",
}
# 300's open wounds damage look is 260's open wounds chance look on quivers: a new look is needed
NO_LOOK = {"owd"}

# The hide rules' words (a stat that counts toward keeping a quiver): key, label, the BH word 260 compares, the game
# stats it reads (stat id or (id, param)). A key the hide rules don't use today is a candidate the author may add.
COUNT_KEYS = [
    ("res_all", "All resistances", "RES", [39, 41, 43, 45]),
    ("knock", "Knockback", "STAT81", [81]),
    ("ow", "Open wounds (chance)", "STAT135", [135]),
    ("ds", "Deadly strike", "STAT141", [141]),
    ("cb", "Crushing blow", "STAT136", [136]),
    ("tdef", "-% target defense", "STAT116", [116]),
    ("min", "Minimum damage", "MINDMG", [21]),
    ("max", "Maximum damage", "MAXDMG", [22]),
    ("itd", "Ignore target's defense", "STAT115", [115]),
    ("ed_dmg", "Enhanced damage", "ED", [18]),
    ("prc", "Pierce", "STAT156", [156]),
    ("ias", "Increased attack speed", "IAS", [93]),
    ("frw", "Faster run/walk", "STAT96", [96]),
    ("tab0", "Bow and crossbow skills", "TABSK0", [(188, 0)]),
    ("tab1", "Passive and magic skills", "TABSK1", [(188, 1)]),
    ("life", "Life", "STAT7", [7]),
    ("mana", "Mana", "STAT9", [9]),
    ("leech_life", "Life stolen per hit", "STAT60", [60]),
    ("leech_mana", "Mana stolen per hit", "STAT62", [62]),
    ("lpk", "Life after each kill", "STAT86", [86]),
    ("mpk", "Mana after each kill", "STAT138", [138]),
    ("str", "Strength", "STAT0", [0]),
    ("dex", "Dexterity", "STAT2", [2]),
    ("enr", "Energy", "STAT1", [1]),
    ("plr", "Poison length reduced", "STAT110", [110]),
    ("pdr_flat", "Physical damage reduced by", "STAT34", [34]),
    ("mdr", "Magic damage reduced by", "STAT35", [35]),
    ("ar", "Attack rating", "STAT19", [19]),
    ("owd", "Open wounds damage", "STAT501", [501]),
    ("dmg_dem", "Damage to demons", "STAT121", [121]),
    ("dmg_und", "Damage to undead", "STAT122", [122]),
    ("mf", "Magic find", "STAT80", [80]),
    ("gf", "Gold find", "STAT79", [79]),
]
COUNT_OF_STAT = {}
for _key, _l, _w, _stats in COUNT_KEYS:
    for _s in _stats:
        COUNT_OF_STAT[_s] = _key
# BH words in 260's hide formulas -> the count key
COUNT_OF_WORD = {w: k for k, _, w, _ in COUNT_KEYS}
COUNT_OF_WORD.update({"STAT18": "ed_dmg", "STAT21": "min", "STAT22": "max", "STAT93": "ias", "LIFE": "life",
                      "MANA": "mana", "STR": "str", "DEX": "dex", "AR": "ar", "MFIND": "mf", "GFIND": "gf"})

# a craft's or corruption's property code -> the game stats it sets (the rest are BH words of their own)
WORD_STATS = {"LIFE": [7], "MANA": [9], "STR": [0], "DEX": [2], "AR": [19], "MINDMG": [21], "MAXDMG": [22],
              "FRES": [39], "LRES": [41], "CRES": [43], "PRES": [45], "GFIND": [79], "MFIND": [80], "IAS": [93],
              "FRW": [96], "FHR": [99], "FBR": [102], "FCR": [105], "EDAM": [17, 18], "ALLSK": [127]}
STAT_NAMES = {7: "life", 9: "mana", 0: "strength", 2: "dexterity", 3: "vitality", 19: "attack rating",
              21: "minimum damage", 22: "maximum damage", 39: "fire res", 41: "lightning res", 43: "cold res",
              45: "poison res", 79: "gold find", 80: "magic find", 93: "IAS", 96: "FRW", 99: "FHR", 102: "FBR",
              105: "FCR", 17: "enhanced damage", 18: "enhanced damage", 127: "all skills", 116: "-% target defense",
              156: "pierce", 333: "-% enemy fire res", 335: "-% enemy cold res", 60: "life stolen",
              62: "mana stolen", 115: "ignore target's defense", 504: "curse resistance", 81: "knockback",
              34: "damage reduced", 35: "magic damage reduced", 138: "mana after each kill", 110: "poison length",
              74: "replenish life", 32: "defense", 136: "crushing blow", 135: "open wounds"}


# ---------------------------------------------------------------- game data

def load_affixes():
    """Every magic prefix and suffix a quiver can get, at any affix level, with its rare flag (0: magic only)."""
    rows = [line for line in AFFIXES.read_text(encoding="utf-8").splitlines() if not line.startswith("#")]
    header = rows[0].split("\t")
    out = []
    for line in rows[1:]:
        a = dict(zip(header, line.split("\t")))
        if a["kind"] not in ("prefix", "suffix") or a["spawnable"] != "1" or a["version"] in ("", "0") or \
                a["frequency"] in ("", "0"):
            continue
        a["itypes"] = {t for t in a["itypes"].split(",") if t}
        a["etypes"] = {t for t in a["etypes"].split(",") if t}
        if not a["itypes"] & QUIVER_TYPES or a["etypes"] & QUIVER_TYPES:
            continue
        a["allmods"] = json.loads(a["mods"] or "[]")
        a["mods"] = [m for m in a["allmods"] if m[0].lower() in LL.PROPS]
        if not a["mods"]:
            continue
        a["level"], a["maxlevel"] = int(a["level"] or 0), int(a["maxlevel"] or 0)
        a["flag"] = int(a["rare"] or 0)
        out.append(a)
    return out


def load_props(path, first):
    """[(name, [[code, lo, hi], ...] per property)] of the quiver rows of a crafts / corruptions table."""
    out = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("#") or line.startswith(first + "\t"):
            continue
        cols = line.split("\t")
        if cols[0].split(",")[0] != "misl":
            continue
        out.append((cols, json.loads(cols[-1] or "[]")))
    return out


# ---------------------------------------------------------------- 260's rules

class Rules(LL.Rules):
    """260's lines as BH reads them (the low-level aliases off), for an identified quiver."""

    def __init__(self):
        super().__init__()
        self.rules = [(r, int(r["where"].rsplit(":", 1)[1])) for r in self.rs.rules
                      if r["where"].startswith("sections/" + SECTION.name + ":")]


def constants(words):
    """The numbers 260 compares these words with (the cut points to try)."""
    text = SECTION.read_text(encoding="utf-8")
    out = set()
    for w in words:
        for m in re.finditer(r"(?<![A-Z0-9_])" + re.escape(w) + r"([<>=~])=?(\d+)(?:-(\d+))?", text):
            for x in (m.group(2), m.group(3)):
                if x:
                    out |= {int(x) - 1, int(x), int(x) + 1}
    return out


def base_values(alvl, code=None):
    """An identified quiver on the ground before its affixes, seen by a character the hide rules leave alone, with the
    base's own stats (code): arrows' maximum damage (Blunt +2, Sharp +10, Razor +18), bolts' physical pierce."""
    v = {"ID": 1, "ALVL": alvl, "ILVL": alvl, "CLVL": 20, "FILTLVL": 1, "DIFF": 1, "GROUND": 1}
    if code:
        base = T.load_bases()[code]
        own = LL.base_values(code, base, set(), alvl)
        v.update({k: x for k, x in own.items() if k not in v and k not in ("BASEBLOCK", "STAT20")})
        v["QLVL"] = base["qlvl"]
    return v


# 260's arrows count the maximum damage they rolled (the base's own aside): the hide term's words
ARROW_MAX = "MAXDMG-IF(QLVL>40,18,IF(QLVL>20,10,2))"


def hide_rules():
    """260's hide rules as the page edits them: {start: [clvl, clvl], need: {MAG: [n, n], RARE: [n, n]},
    thr: {kind: {count key: [from, from]}}} (from: the smallest roll that counts; None: it doesn't)."""
    text = SECTION.read_text(encoding="utf-8")
    out = {"start": [None, None], "need": {"MAG": [None, None], "RARE": [None, None]},
           "thr": {k: {} for k, _, _ in KINDS}}
    pat = re.compile(r"^ItemDisplay\[(?P<q>\(RARE OR CRAFT\)|MAG) \((?P<codes>[a-z0-9 OR]+)\) ID "
                     r"CLVL(?P<cl>~\d+-\d+|>\d+) \$f\(COUNT\((?P<list>.*)\)<(?P<n>\d+)\) FILTLVL>0 GROUND !TOWN\]:")
    for line in text.splitlines():
        m = pat.match(line)
        if not m:
            continue
        kind = "arrows" if "aqv" in m.group("codes") else "bolts"
        band = 0 if m.group("cl").startswith("~") else 1
        start = int(m.group("cl")[1:].split("-")[0]) + (1 if m.group("cl").startswith(">") else 0)
        out["start"][band] = start
        out["need"]["MAG" if m.group("q") == "MAG" else "RARE"][band] = int(m.group("n"))
        for term in re.split(r",(?![^(]*\))", m.group("list").replace(ARROW_MAX, "ARROWMAX")):
            t = re.fullmatch(r"([A-Z0-9]+)(>|==)(\d+)", term.strip())
            if not t:
                raise SystemExit(f"260: a hide term the page can't read: {term!r}")
            key = "max" if t.group(1) == "ARROWMAX" else COUNT_OF_WORD.get(t.group(1))
            if key is None:
                raise SystemExit(f"260: a hide word the page has no row for: {t.group(1)}")
            low = int(t.group(3)) + (1 if t.group(2) == ">" else 0)
            out["thr"][kind].setdefault(key, [None, None])[band] = low
    if None in out["start"] or None in out["need"]["MAG"] + out["need"]["RARE"]:
        raise SystemExit("260: the hide rules aren't the 8 lines the page reads (two bands, magic and rare / crafted, "
                         "arrows and bolts)")
    return out


# ---------------------------------------------------------------- the page's data

def first_tagged(rules, folded, code, groups, base_vals, base_name, plain, row_affixes, row):
    """The lowest value of the row's only stat that 260 tags alone (None: more than one stat, or no value)."""
    stats = {(sid, par) for a in row_affixes for m in a["mods"] if LL.PROPS[m[0].lower()][0] == row
             for sid, par, lo, hi in m[5]}
    if len(stats) != 1:
        return None
    (sid, par), = stats
    words = LL.stat_words(sid, par, True)
    lo = min(m[5][0][2] for a in row_affixes for m in a["mods"] if LL.PROPS[m[0].lower()][0] == row and m[5])
    hi = max(m[5][0][3] for a in row_affixes for m in a["mods"] if LL.PROPS[m[0].lower()][0] == row and m[5])
    tries = sorted(x for x in constants(words) | {lo, hi} if lo <= x <= hi)
    found = None
    for x in reversed(tries):
        v = dict(base_vals)
        for w in words:
            v[w] = base_vals.get(w, 0) + x
        line, _ = rules.tagline(folded, code, groups, LL.with_derived(v), base_name)
        if line == plain or not LC.visible(line).strip():
            break
        found = x
    return found


def look_of(a, row):
    if row in NO_LOOK:
        return None
    return LOOK_260.get(row) or LL.look_of(a, row)


def default_on(row):
    picks = json.loads(LL.PICKS.read_text(encoding="utf-8")) if LL.PICKS.exists() else {}
    for card in ("ranged", "amu"):
        if row in picks.get(card, {}):
            return bool(picks[card][row])
    extra = {r[0]: r[3] for r in EXTRA_ROWS}
    return bool(extra[row] if row in extra else LL.ROW[row][3])


def values_of(props):
    """BH words of a craft's or corruption's properties at their highest roll."""
    v = {}
    for prop in props:
        for code, lo, hi in prop:
            if code == "RES":
                continue  # derived from the four
            sids = [int(code[4:])] if re.fullmatch(r"STAT\d+", code) else WORD_STATS.get(code)
            if sids is None:
                v[code] = v.get(code, 0) + hi
                continue
            for w in {w for sid in sids for w in LL.stat_words(sid, 0, True)}:  # EDAM's two stats are one ED
                v[w] = v.get(w, 0) + hi
            if code == "ALLSK":
                v["ALLSK"] = v.get("ALLSK", 0) + hi
    return LL.with_derived(v)


def props_text(props):
    parts = []
    for prop in props:
        code, lo, hi = prop[0]
        if code == "RES":
            name = "all res"
        elif code.startswith("MULTI201"):
            name = "chance to cast Frost Nova when struck"
        else:
            sids = [int(code[4:])] if re.fullmatch(r"STAT\d+", code) else WORD_STATS.get(code, [])
            name = STAT_NAMES.get(sids[-1], code) if sids else code
        if code.startswith("MULTI"):
            parts.append(name)
        else:
            parts.append(f"{lo}-{hi} {name}" if lo != hi else f"{hi} {name}")
    return ", ".join(parts)


def page_data():
    bases = T.load_bases()
    affixes = load_affixes()
    rules = Rules()
    for a in affixes:
        for mod in a["mods"]:
            for sid, par, lo, hi in mod[5]:
                rules.sample_keys.update(LL.stat_words(sid, par, True))
    rules.sample_keys.update({"STAT360", "ALLSK", "STAT127", "MULTI201,2820", "STAT504", "STAT32", "STAT3", "STAT74",
                              "STAT333", "STAT335", "STAT116", "STAT115", "FCR", "STAT105", "FHR", "STAT99"})
    rows_def = LL.ROWS + EXTRA_ROWS
    row_info = {r[0]: r for r in rows_def}
    aff_index, aff_table = {}, []
    seg_index, seg_table = {}, []

    def seg(text):
        if text not in seg_index:
            seg_index[text] = len(seg_table)
            seg_table.append(LL.segments(text))
        return seg_index[text]

    def aid(a):
        k = (a["kind"], a["row"])
        if k not in aff_index:
            aff_index[k] = len(aff_table)
            contrib = []
            for mod in a["allmods"]:
                seen = set()
                for sid, par, lo, hi in mod[5]:
                    key = COUNT_OF_STAT.get((sid, par)) or COUNT_OF_STAT.get(sid)
                    if mod[0].lower() == "res-all":
                        key = "res_all"
                    elif sid in (39, 41, 43, 45):
                        key = None  # a single resistance never makes RES
                    if key and key not in seen:
                        seen.add(key)
                        contrib.append([key, lo, hi])
            aff_table.append([a["kind"][0].upper(), a["name"], a["level"], a["maxlevel"], int(a["group"] or 0),
                              int(a["frequency"]), a["flag"], contrib])
        return aff_index[k]

    for a in affixes:
        aid(a)
    kinds, card_rows = [], {}
    longest = ("", 0)
    for ki, (kkey, kname, codes) in enumerate(KINDS):
        code = codes[-1]
        first = bases[code]
        groups = T.item_groups(set(first["types"])) | {T.TIER_GROUP[first["tier"]]}
        base_vals = base_values(CUT - 1, code)
        folded = rules.folded(code, groups, base_vals)
        plain, _ = rules.tagline(folded, code, groups, dict(base_vals), first["name"])
        for c in codes:
            if len(bases[c]["name"]) > longest[1]:
                longest = (bases[c]["name"], len(bases[c]["name"]))
        kinds.append({"key": kkey, "name": kname, "base": first["name"],
                      "bases": [{"code": c, "name": bases[c]["name"], "tier": bases[c]["tier"], "qlvl": bases[c]["qlvl"],
                                 "mlvl": bases[c]["mlvl"]} for c in codes],
                      "longest": max((bases[c]["name"] for c in codes), key=len)})
        by_row = {}
        for a in affixes:
            for mod in a["mods"]:
                row = LL.PROPS[mod[0].lower()][0]
                by_row.setdefault(row, [])
                if a not in by_row[row]:
                    by_row[row].append(a)
        for row, row_affixes in by_row.items():
            entries, low_ok, high_any = [], True, False
            for a in sorted(row_affixes, key=lambda x: (x["level"], x["kind"], x["name"])):
                tags = []
                for high in (False, True):
                    line, pos = rules.tagline(folded, code, groups,
                                              LL.affix_values(a, row, high, True, base_vals), first["name"])
                    new = line[:len(line) - len(plain)] if plain and line.endswith(plain) else line
                    tags.append((new.strip(), pos))
                low_ok = low_ok and bool(LC.visible(tags[0][0]).strip())
                high_any = high_any or bool(LC.visible(tags[1][0]).strip())
                look = look_of(a, row)
                new_text = LC.apply(look, "", LL.affix_values(a, row, True, True, base_vals), first["name"]) \
                    if look else ""
                entries.append([aid(a), LL.roll_text(a, row), seg(tags[1][0]) if tags[1][0] else -1, tags[1][1],
                                seg(new_text) if new_text else -1, 0])
            state = "any" if low_ok else "never" if not high_any else "some"
            start = None
            if state == "some":
                start = first_tagged(rules, folded, code, groups, base_vals, first["name"], plain, row_affixes, row)
                if start is not None:
                    state = "from"
            bands = []
            for top in BANDS:
                best = None
                for a in row_affixes:
                    if a["level"] > top:
                        continue
                    for m in a["mods"]:
                        if LL.PROPS[m[0].lower()][0] != row:
                            continue
                        for sid, par, lo, hi in m[5]:
                            val = hi / 8 if sid in LL.EIGHTHS else hi / 2 if sid in LL.HALVES else hi
                            if best is None or abs(val) > abs(best):
                                best = val
                bands.append("yes" if best is not None and row in LL.FLAG_ROWS else best)
            has_look = all(look_of(a, row) for a in row_affixes)
            # a new tag line sits at the end of 260's tag lines, so its tag stands leftmost
            card_rows.setdefault(row, []).append({"k": ki, "st": state, "from": start, "bands": bands, "pos": 83,
                                                  "look": int(has_look), "aff": entries})
    rows = [{"key": r[0], "kinds": card_rows[r[0]], "lock": 0} for r in rows_def if r[0] in card_rows]

    # what crafts and corruptions add (a dropped quiver has neither: a player makes them), and 260's tag for it
    extras = []
    code = KINDS[0][2][-1]
    first = bases[code]
    groups = T.item_groups(set(first["types"])) | {T.TIER_GROUP[first["tier"]]}
    for kind, path, first_col in (("CRAFT", CRAFTS, "type"), ("RARE", CORRUPTIONS, "input")):
        for cols, props in load_props(path, first_col):
            if kind == "RARE" and (not props or cols[0] != "misl,nos"):
                continue  # the socket outcomes, and the same outcome again for magic items with sockets
            v = dict(base_values(CUT - 1, code))
            for k, x in values_of(props).items():
                v[k] = v.get(k, 0) + x  # on top of the base's own
            if kind == "RARE":
                v["STAT360"] = int(cols[1])
            folded = rules.folded(code, groups, base_values(CUT - 1, code), kind)
            plain, _ = rules.tagline(folded, code, groups, dict(base_values(CUT - 1, code)), first["name"], kind)
            line, _ = rules.tagline(folded, code, groups, v, first["name"], kind)
            new = line[:len(line) - len(plain)] if plain and line.endswith(plain) else line
            extras.append({"src": "craft" if kind == "CRAFT" else "corruption",
                           "name": cols[1] if kind == "CRAFT" else f"outcome {cols[1]}",
                           "what": props_text(props), "tag": seg(new.strip()) if new.strip() else -1})
    return {"cut": CUT, "cuts": list(CUTS), "nameMax": LC.NAME_MAX, "bands": list(BANDS), "cats": CATS,
            "rows": [{"key": k, "label": lab, "cat": cat, "def": int(default_on(k)), "sock": 0, "min": 0, "wpn": 0,
                      "wpnc": 0} for k, lab, cat, _ in rows_def if k in card_rows],
            "kinds": kinds, "longestBase": longest[0], "card": {"key": "quivers", "name": "Arrows and bolts",
                                                                 "kinds": [{"name": k["name"]} for k in kinds],
                                                                 "rows": rows},
            "affixes": aff_table, "segs": seg_table, "extras": extras,
            "count": [[k, lab, w] for k, lab, w, _ in COUNT_KEYS], "hide": hide_rules(), "ilvls": list(ILVLS)}


def write_page():
    data = page_data()
    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = TEMPLATE.read_text(encoding="utf-8")
    PAGE.write_text(html.replace("/*__DATA__*/null", blob), encoding="utf-8", newline="\n")
    print(f"wrote {PAGE.relative_to(ROOT)} ({PAGE.stat().st_size // 1024} KB)")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--page", action="store_true", help="write tools/quiver_tags.html")
    ap.add_argument("--dump", action="store_true", help="print the page's rows and hide rules")
    args = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if args.page:
        write_page()
    elif args.dump:
        data = page_data()
        segs = data["segs"]
        txt = lambda i: "".join(t for _, t in segs[i]) if i >= 0 else "-"  # noqa: E731
        lab = {r["key"]: r["label"] for r in data["rows"]}
        for row in data["card"]["rows"]:
            st = ", ".join(f"{data['kinds'][k['k']]['name']}: {k['st']}{' ' + str(k['from']) if k['from'] else ''}"
                           for k in row["kinds"])
            print(f"{lab[row['key']]:32} {st:44} bands {row['kinds'][0]['bands']}")
            for ai, roll, t, _, n, _ in row["kinds"][0]["aff"]:
                a = data["affixes"][ai]
                print(f"    {a[0]} {a[1]:18} lvl {a[2]:2}-{a[3] or '':2} flag {a[6]}  {roll:22} today {txt(t):10} new {txt(n)}")
        print("crafts and corruptions:")
        for e in data["extras"]:
            print(f"  {e['src']:10} {e['name']:12} {e['what']:60} {txt(e['tag'])}")
        print(json.dumps(data["hide"], indent=1))
    else:
        ap.print_help()


if __name__ == "__main__":
    main()
