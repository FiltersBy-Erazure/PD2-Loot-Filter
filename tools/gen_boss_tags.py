#!/usr/bin/env python3
"""Generate sections/270-boss-gear-tags.filter from tools/boss_tag_rules.json (the boss gear tag rules).

One description line per identified item naming every boss it suits, Rathma / D.Clone / Lucion (names red, slashes
gray). Per item type ("slot") and boss the rules file holds: whether the boss's tag is on, its requirements (groups:
every group must hold, a group holds when `need` of its alternatives do, default 1), and its versions (caster /
physical, or one): each with requirements of its own, a pool of desirable stats and how many of them it needs (a stat's
`w` counts it more than once). The section has, per slot, one alias per boss (BOSSTAG_<RA/DC/LU>_<slot>) and one rule
per combination of the bosses that are on.

    python tools/gen_boss_tags.py              write the section (the hook and build.bat run this)
    python tools/gen_boss_tags.py --check      exit 1 if the section is not what the rules file makes (CI)
    python tools/gen_boss_tags.py --page       write tools/boss_tag_editor.html, the author's rules page (gitignored;
                                               published as a claude.ai page whose db holds the author's edits)
    python tools/gen_boss_tags.py --apply FILE take a JSON of edited slots {"SLOT": {"RA": {...}, ...}, ...} (the
                                               page's db documents) into the rules file, then write the section

A term (a requirement alternative or a desirable stat): {"s": CODE, "min": N} = the stat at N or more; {"s": CODE}
for a yes/no stat (half freeze, cannot be frozen); {"s": "FREEZE"} = in a pool cannot be frozen counts 2, half freeze 1
and nothing beside cannot be frozen (as a requirement: either); {"s": "CORR", "is": N} = corrupted to outcome N (0: not
corrupted); {"s": "TABS", "min": N, "tabs": [...]} = +N to one of these skill tabs (BH's TABSK numbers);
{"s": "CLSK", "min": N, "classes": [...]} = +N to a class's skills; {"s": "MAXEXTRA", "res": "STAT40", "min": N} = that
maximum resistance above the all max res corruption's (belts: the prefix's part); "skip": 43 on a stat = it doesn't
count when the item has that corruption (max life % beside the max life corruption, which counts on its own).
"""
import argparse
import json
import sys
from itertools import combinations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RULES = ROOT / "tools" / "boss_tag_rules.json"
SECTION = ROOT / "sections" / "270-boss-gear-tags.filter"
TEMPLATE = ROOT / "tools" / "boss_tag_editor_template.html"
PAGE = ROOT / "tools" / "boss_tag_editor.html"
AFFIXES = ROOT / "docs" / "pd2-magic-affixes.tsv"
BASES = ROOT / "docs" / "pd2-bases.tsv"
CORRUPTIONS = ROOT / "docs" / "pd2-corruptions.tsv"
CRAFTS = ROOT / "docs" / "pd2-crafts.tsv"

# code: (label, short label for comments, kind, group on the page)
CATALOG = {
    "LIFE": ("Life", "life", "num", "Attributes"),
    "STR": ("Strength", "Str", "num", "Attributes"),
    "DEX": ("Dexterity", "Dex", "num", "Attributes"),
    "STAT3": ("Vitality", "Vit", "num", "Attributes"),
    "ALLATTRIB": ("All attributes", "all attributes", "num", "Attributes"),
    "STAT216": ("Life per level (any)", "life per level", "num", "Attributes"),
    "STAT76": ("Maximum life %", "max life %", "num", "Attributes"),
    "ALLSK": ("+ All skills", "all skills", "num", "Skills"),
    "CLSK": ("+ Class skills", "class skills", "classes", "Skills"),
    "TABS": ("+ Skill tab", "skill tab", "tabs", "Skills"),
    "FCR": ("Faster cast rate %", "FCR", "num", "Speed"),
    "FHR": ("Faster hit recovery %", "FHR", "num", "Speed"),
    "FBR": ("Faster block rate %", "FBR", "num", "Speed"),
    "FRW": ("Faster run/walk %", "FRW", "num", "Speed"),
    "IAS": ("Increased attack speed %", "IAS", "num", "Speed"),
    "STAT36": ("Physical damage reduced %", "PDR", "num", "Defense"),
    "STAT110": ("Poison length reduced %", "PLR", "num", "Defense"),
    "STAT20": ("Chance to block %", "block chance", "num", "Defense"),
    "STAT118": ("Half freeze duration", "half freeze duration", "flag", "Defense"),
    "STAT153": ("Cannot be frozen", "cannot be frozen", "flag", "Defense"),
    "FREEZE": ("Cannot be frozen (counts 2) or half freeze duration (1)", "cannot be frozen or half freeze", "flag",
               "Defense"),
    "SOCK": ("Sockets", "sockets", "num", "Defense"),
    "RES": ("All resistances", "all res", "num", "Resistances"),
    "FRES": ("Fire resistance", "fire res", "num", "Resistances"),
    "LRES": ("Lightning resistance", "lightning res", "num", "Resistances"),
    "CRES": ("Cold resistance", "cold res", "num", "Resistances"),
    "PRES": ("Poison resistance", "poison res", "num", "Resistances"),
    "MAXRES": ("All maximum resistances", "all max res", "num", "Max resistances"),
    "STAT40": ("Maximum fire resistance", "max fire res", "num", "Max resistances"),
    "STAT42": ("Maximum lightning resistance", "max lightning res", "num", "Max resistances"),
    "STAT44": ("Maximum cold resistance", "max cold res", "num", "Max resistances"),
    "STAT46": ("Maximum poison resistance", "max poison res", "num", "Max resistances"),
    "MAXEXTRA": ("Max resistance above the all max res corruption", "max res prefix", "maxextra", "Max resistances"),
    "AR": ("Attack rating", "AR", "num", "Offense"),
    "EDAM": ("Enhanced damage %", "ED", "num", "Offense"),
    "MINDMG": ("Minimum damage", "min damage", "num", "Offense"),
    "MAXDMG": ("Maximum damage", "max damage", "num", "Offense"),
    "STAT141": ("Deadly strike %", "deadly strike", "num", "Offense"),
    "STAT136": ("Crushing blow %", "crushing blow", "num", "Offense"),
    "STAT60": ("Life stolen per hit %", "life leech", "num", "Offense"),
    "STAT116": ("-% Target defense", "-target defense", "num", "Offense"),
    "CORR": ("Corruption", "corruption", "corr", "Corruption"),
}
# who a stat is for (2026-10-22, from the author's caster / physical amulet pools): a stat not named here suits either.
# A caster / physical split on the page leaves the other kind's stats out of each version.
ROLE = {"FCR": "caster",
        "IAS": "physical", "AR": "physical", "EDAM": "physical", "MINDMG": "physical", "MAXDMG": "physical",
        "STAT141": "physical", "STAT136": "physical", "STAT60": "physical", "STAT116": "physical"}
MAX_RES ={"STAT40": "fire", "STAT42": "lightning", "STAT44": "cold", "STAT46": "poison"}
CLASSES = ["Amazon", "Sorceress", "Necromancer", "Paladin", "Barbarian", "Druid", "Assassin"]
TAB_NAMES = {0: "Bow and Crossbow", 1: "Passive and Magic", 2: "Javelin and Spear", 8: "Fire", 9: "Lightning",
             10: "Cold", 16: "Curses", 17: "Poison and Bone", 18: "Summoning (Necromancer)", 24: "Combat (Paladin)",
             25: "Offensive Auras", 26: "Defensive Auras", 32: "Combat (Barbarian)", 33: "Combat Masteries",
             34: "Warcries", 40: "Summoning (Druid)", 41: "Shape Shifting", 42: "Elemental", 48: "Traps",
             49: "Shadow Disciplines", 50: "Martial Arts"}
# game stat id -> filter code (docs/pd2-magic-affixes.tsv gives stat ids); 83 / 188 take their param
STAT_CODES = {7: "LIFE", 0: "STR", 2: "DEX", 3: "STAT3", 127: "ALLSK", 105: "FCR", 99: "FHR", 102: "FBR", 96: "FRW",
              93: "IAS", 20: "STAT20", 19: "AR", 17: "EDAM", 21: "MINDMG", 22: "MAXDMG", 39: "FRES", 41: "LRES",
              43: "CRES", 45: "PRES", 40: "STAT40", 42: "STAT42", 44: "STAT44", 46: "STAT46", 110: "STAT110",
              36: "STAT36", 76: "STAT76", 216: "STAT216", 194: "SOCK", 116: "STAT116", 136: "STAT136",
              141: "STAT141", 60: "STAT60", 118: "STAT118", 153: "STAT153", 1: "ENR"}
DERIVED = {"RES": ("FRES", "LRES", "CRES", "PRES"), "MAXRES": ("STAT40", "STAT42", "STAT44", "STAT46"),
           "ALLATTRIB": ("STR", "ENR", "DEX", "STAT3")}


def load_rules():
    return json.loads(RULES.read_text(encoding="utf-8"))


TERM_KEYS = ["s", "min", "is", "res", "tabs", "classes", "skip", "w"]


def normalized(rule):
    """A boss rule with its keys in the rules file's order (the page's store sorts them), so a diff shows only edits."""
    def order(d, keys):
        return {k: d[k] for k in keys if k in d} | {k: d[k] for k in d if k not in keys}

    def group(g):
        return order({**g, "any": [order(t, TERM_KEYS) for t in g["any"]]}, ["any", "need"])
    return order({**rule,
                  "require": [group(g) for g in rule.get("require", [])],
                  "versions": [order({**v, "require": [group(g) for g in v.get("require", [])],
                                      "pool": [order(t, TERM_KEYS) for t in v.get("pool", [])]},
                                     ["name", "require", "pool", "need"]) for v in rule.get("versions", [])]},
                 ["on", "require", "versions", "note"])


# ---- rendering
def gt(code, mn):
    return f"{code}>{mn - 1}"


def cond_alts(t):
    """A term in a rule's condition, as its alternatives (TABS / CLSK: one per tab / class)."""
    s = t["s"]
    if s == "CORR":
        return [f"STAT360={t['is']}"]
    if s == "FREEZE":
        return ["STAT118>0", "STAT153>0"]
    if s == "TABS":
        return [gt(f"TABSK{x}", t["min"]) for x in t["tabs"]]
    if s == "CLSK":
        return [gt(f"CLSK{x}", t["min"]) for x in t["classes"]]
    if s == "MAXEXTRA":
        return [f"$f({gt(t['res'] + '-MAXRES', t['min'])})"]
    if CATALOG[s][2] == "flag":  # >0, not =1: two sources add up (an amulet corrupted and desecrated to it: 2)
        return [f"{s}>0"]
    if "skip" in t:
        return [f"$f(IF(STAT360=={t['skip']},0,{gt(s, t['min'])}))"]
    return [gt(s, t["min"])]


def formula_entries(t):
    """A term inside $f(COUNT(...)), repeated by its weight."""
    s = t["s"]
    if s == "CORR":
        out = [f"STAT360=={t['is']}"]
    elif s == "FREEZE":  # cannot be frozen counts 2, half freeze 1 but nothing beside it (the author, 2026-10-22)
        w = int(t.get("w", 1))
        return ["STAT153>0"] * (2 * w) + ["IF(STAT153>0,0,STAT118>0)"] * w
    elif s == "TABS":
        out = [gt(f"TABSK{x}", t["min"]) for x in t["tabs"]]
    elif s == "CLSK":
        out = [gt(f"CLSK{x}", t["min"]) for x in t["classes"]]
    elif s == "MAXEXTRA":
        out = [gt(t["res"] + "-MAXRES", t["min"])]
    elif CATALOG[s][2] == "flag":
        out = [f"{s}>0"]
    elif "skip" in t:
        out = [f"IF(STAT360=={t['skip']},0,{gt(s, t['min'])})"]
    else:
        out = [gt(s, t["min"])]
    return out * int(t.get("w", 1))


def group_text(g):
    need = int(g.get("need", 1))
    if need <= 1:
        alts = [a for t in g["any"] for a in cond_alts(t)]
        return alts[0] if len(alts) == 1 else "(" + " OR ".join(alts) + ")"
    return f"$f(COUNT({','.join(e for t in g['any'] for e in formula_entries(t))})>={need})"


def version_text(v):
    parts = [group_text(g) for g in v.get("require", [])]
    if v.get("pool"):
        parts.append(f"$f(COUNT({','.join(e for t in v['pool'] for e in formula_entries(t))})>={int(v['need'])})")
    return " ".join(parts)


def alias_body(slot, rule):
    parts = [slot["match"]] + [group_text(g) for g in rule.get("require", [])]
    versions = [v for v in rule.get("versions", []) if v.get("pool") or v.get("require")]
    if len(versions) == 1:
        parts.append(version_text(versions[0]))
    elif versions:
        texts = [f"({version_text(v)})" if v.get("require") else version_text(v) for v in versions]
        parts.append("(" + " OR ".join(texts) + ")")
    return "(" + " ".join(p for p in parts if p) + ")"


# ---- comments
def corruption_rows():
    rows = {}
    for line in CORRUPTIONS.read_text(encoding="utf-8").splitlines():
        if line.startswith("#") or not line.strip():
            continue
        cols = line.split("\t")
        if len(cols) < 4 or not cols[1].isdigit():
            continue
        rows.setdefault(cols[0], []).append((int(cols[1]), cols[2], json.loads(cols[3] or "[]")))
    return rows


def craft_rows():
    """[(item type, craft name, props)] from docs/pd2-crafts.tsv."""
    rows = []
    for line in CRAFTS.read_text(encoding="utf-8").splitlines():
        cols = line.split("\t")
        if line.startswith("#") or len(cols) < 4 or cols[0] == "type":
            continue
        rows.append((cols[0], cols[1], json.loads(cols[3])))
    return rows


def corruption_label(props, sockets=""):
    if sockets:
        return f"+{sockets} sockets"
    parts = []
    has_all = {c[0] for g in props for c in g} & set(DERIVED)
    parts_of_all = {p for d in has_all for p in DERIVED[d]} | ({"STAT1"} if "ALLATTRIB" in has_all else set())
    for group in props:
        for code, lo, hi in group:
            if code in parts_of_all:
                continue  # all res / all max res / all attributes: said once
            label = CATALOG.get(code, (None, code))[1] if code in CATALOG else {
                "ED": "% defense", "MFIND": "magic find", "GFIND": "gold find", "MANA": "mana",
                "STAT74": "replenish life", "STAT34": "damage reduced", "STAT35": "magic damage reduced",
                "STAT27": "mana regeneration %", "STAT62": "mana leech", "STAT86": "life after each kill",
                "STAT138": "mana after each kill", "STAT156": "piercing", "STAT109": "curse duration reduced",
                "STAT504": "curse resistance", "STAT89": "light radius", "STAT1": "Energy", "STAT60": "life leech",
                "STAT19": "AR", "STAT32": "defense vs missile", "STAT33": "defense vs melee", "STAT77": "max mana %",
                "STAT135": "open wounds", "STAT119": "AR %", "STAT81": "knockback"}.get(code, code)
            if code.startswith("MULTI201,"):
                parts.append("a chance to cast when struck")
                continue
            if code in CATALOG and CATALOG[code][2] == "flag":
                parts.append(label)
                continue
            amount = f"{lo}" if lo == hi else f"{lo}-{hi}"
            parts.append(f"+{amount} {label}")
    return ", ".join(parts) or "nothing"


class Describer:
    def __init__(self):
        self.corr = corruption_rows()

    def outcome(self, slot, n):
        if n == 0:
            return "not corrupted"
        rows = [r for r in self.corr.get(slot["corr"], []) if r[0] == n]
        if not rows:
            return f"corrupted to outcome {n}"
        socks = max((r[1] for r in rows if r[1]), default="")
        return "corrupted to " + corruption_label(rows[0][2], f"1-{socks}" if socks else "")

    def term(self, slot, t):
        s = t["s"]
        if s == "CORR":
            return self.outcome(slot, t["is"])
        if s == "TABS":
            return f"+{t['min']} to a skill tab"
        if s == "CLSK":
            return f"+{t['min']} class skills"
        if s == "MAXEXTRA":
            return f"{t['min']}+ max {MAX_RES[t['res']]} res prefix"
        if CATALOG[s][2] == "flag":
            return CATALOG[s][1]
        if s == "ALLSK":
            return f"+{t['min']} all skills"
        if s == "STAT216" and t["min"] <= 1:
            return "life per level"
        return f"{t['min']}+ {CATALOG[s][1]}"

    def group(self, slot, g):
        alts = [self.term(slot, t) for t in g["any"]]
        need = int(g.get("need", 1))
        if need > 1:
            return f"{need} of ({', '.join(alts)})"
        if len(alts) > 2 and all(t["s"] == "CORR" for t in g["any"]):  # not corrupted, or corrupted to A, B or C
            outs = [a.removeprefix("corrupted to ") for a in alts]
            first = "not corrupted, or corrupted to " if outs[0] == "not corrupted" else "corrupted to "
            rest = outs[1:] if outs[0] == "not corrupted" else outs
            return first + (", ".join(rest[:-1]) + " or " + rest[-1] if len(rest) > 1 else rest[0])
        return " or ".join(alts)

    def version(self, slot, rule, v):
        reqs = [self.group(slot, g) for g in rule.get("require", []) + v.get("require", [])]
        text = "; ".join(reqs) + " mandatory" if reqs else ""
        if v.get("pool"):
            text += ("; " if text else "") + f"{v['need']}+ desirable stats"
        return text or "nothing required"


def live(rule):
    """A rule that requires something: one that is on but asks for nothing would tag every item of its type."""
    return bool(rule.get("require")) or any(v.get("pool") or v.get("require") for v in rule.get("versions", []))


def render(data):
    desc = Describer()
    names = dict(data["bosses"])
    out = [
        "// ------------------------------------------------------------------------------",
        "//    ===============  Boss Gear Tags Display (Rathma, Diablo Clone, Lucion)  ===============",
        "// ------------------------------------------------------------------------------",
        "",
        "// GENERATED by tools/gen_boss_tags.py from tools/boss_tag_rules.json (the author's boss tag rules page); never",
        "// edit by hand. One description line per item naming every boss it suits, in the order Rathma / D.Clone /",
        "// Lucion (names red, slashes gray). Each slot's conditions are aliases, BOSSTAG_RA_<slot> (Rathma),",
        "// BOSSTAG_DC_<slot> (D.Clone) and BOSSTAG_LU_<slot> (Lucion); the slot's rules are the combinations of them.",
    ]
    for slot in data["slots"]:
        key = slot["key"]
        rules = data["rules"][key]
        bosses = [b for b, _ in data["bosses"] if rules.get(b, {}).get("on") and live(rules[b])]
        if not bosses:
            continue
        out += ["", f"// {slot['name']}"]
        for b in bosses:
            rule = rules[b]
            versions = [v for v in rule.get("versions", []) if v.get("pool") or v.get("require")] or [{}]
            for v in versions:
                label = names[b] + (f" - {v['name']}" if len(versions) > 1 and v.get("name") else "")
                out.append(f"// {label}: {desc.version(slot, rule, v)}")
        never = [set(p) for p in slot.get("never", [])]
        if never and any(p <= set(bosses) for p in never):
            out.append(f"// No {' or '.join(' / '.join(names[x] for x in p) for p in slot['never'])} rule: "
                       f"{slot.get('never_note', 'they never meet on one item')}")
        for b in bosses:
            out.append(f"Alias[BOSSTAG_{b}_{key}]:{alias_body(slot, rules[b])}")
        for size in range(len(bosses), 0, -1):
            for combo in combinations(bosses, size):
                if any(p <= set(combo) for p in never):
                    continue
                cond = " ".join(f"BOSSTAG_{b}_{key}" if b in combo else f"!BOSSTAG_{b}_{key}" for b in bosses)
                tag = " %GRAY%/ ".join(f"%RED%{names[b]}" for b in combo)
                out.append(f"ItemDisplay[{cond}]:%NAME%{{{tag}%CL%%NAME%}}%CONTINUE%//")
    out.append("")
    return "\r\n".join(out).encode("utf-8")


# ---- the rules page's data
def page_data(data):
    bases = {}
    for line in BASES.read_text(encoding="utf-8").splitlines():
        if line.startswith("#") or not line.strip():
            continue
        cols = line.split("\t")
        if cols[0] == "code":
            continue
        bases[cols[0]] = {"types": cols[3].split(","), "sockets": int(cols[4] or 0)}
    affixes = []
    header = None
    for line in AFFIXES.read_text(encoding="utf-8").splitlines():
        if line.startswith("#"):
            continue
        cols = line.split("\t")
        if header is None:
            header = cols
            continue
        affixes.append(dict(zip(header, cols)))
    corr = corruption_rows()
    slots = []
    for slot in data["slots"]:
        variants = [(code, label, bases[code]) for code, label in slot["bases"]]
        most_sockets = max(v[2]["sockets"] for v in variants)
        magic = slot["quality"] == "magic"
        sources = []
        for a in affixes:
            if a["kind"] not in ("prefix", "suffix") or not a["version"] or a["version"] == "0" or a["spawnable"] != "1":
                continue
            rare = int(a["rare"] or 0)
            if magic and rare not in (0, 1):
                continue
            if not magic and rare == 0:
                continue
            itypes = [t for t in a["itypes"].split(",") if t]
            etypes = [t for t in a["etypes"].split(",") if t]
            fits = [i for i, (_, _, b) in enumerate(variants)
                    if any(t in b["types"] for t in itypes) and not any(t in b["types"] for t in etypes)]
            if not fits:
                continue
            st = {}
            for mod in json.loads(a["mods"] or "[]"):
                for sid, param, lo, hi in mod[5]:
                    if sid == 83:
                        code = f"CLSK{param}"
                    elif sid == 188:
                        code = f"TABSK{param}"
                    else:
                        code = STAT_CODES.get(sid)
                    if code:
                        if code == "SOCK":
                            lo, hi = min(lo, most_sockets), min(hi, most_sockets)
                        st[code] = [lo, hi]
            for d, parts in DERIVED.items():
                if all(p in st for p in parts):
                    st[d] = [min(st[p][0] for p in parts), min(st[p][1] for p in parts)]
            st.pop("ENR", None)
            if "STAT118" in st or "STAT153" in st:
                st["FREEZE"] = [1, 1]
            if not st:
                continue
            src = {"k": a["kind"][0].upper(), "n": a["name"], "g": int(a["group"] or 0), "a": int(a["level"] or 0),
                   "r": rare, "st": st}
            if a["maxlevel"]:
                src["x"] = int(a["maxlevel"])
            if len(fits) < len(variants):
                src["v"] = fits
            sources.append(src)
        outcomes = {}
        for n, socks, props in corr.get(slot["corr"], []):
            o = outcomes.setdefault(n, {"id": n, "st": {}, "socks": 0, "props": props})
            if socks:
                o["socks"] = max(o["socks"], int(socks))
            for group in props:
                for code, lo, hi in group:
                    o["st"][code] = [lo, hi]
        for o in outcomes.values():
            if "STAT118" in o["st"] or "STAT153" in o["st"]:
                o["st"]["FREEZE"] = [1, 1]
            if o["socks"]:
                o["st"]["SOCK"] = [1, min(o["socks"], most_sockets)]
            o["label"] = corruption_label(o.pop("props"), f"1-{o['socks']}" if o["socks"] else "")
            del o["socks"]
        # crafted items (the slot's rule takes CRAFT): each craft's fixed stats (docs/pd2-crafts.tsv) beside up to 4
        # random affixes (the author, 2026-10-22: blood crafted body armor's 5-7% max life + the max life corruption)
        crafts = []
        if "CRAFT" in slot["match"]:
            types = {t for _, _, b in variants for t in b["types"]}
            for kind, name, props in craft_rows():
                if kind not in types:
                    continue
                st = {code: [lo, hi] for group in props for code, lo, hi in group}
                for d, parts in DERIVED.items():
                    if d not in st and all(p in st for p in parts):
                        st[d] = [min(st[p][0] for p in parts), min(st[p][1] for p in parts)]
                if "STAT118" in st or "STAT153" in st:
                    st["FREEZE"] = [1, 1]
                crafts.append({"n": name, "st": st, "label": corruption_label(props)})
        # amulets are corrupted and then desecrated (STAT206), from the same outcomes (gen_unique_rolls'
        # CORRUPTION_TAGS); the author, 2026-10-21: 2% + 2% all max res makes 4%
        slots.append({**slot, "variants": [v[1] for v in variants], "sockets": most_sockets, "sources": sources,
                      "corruptions": sorted(outcomes.values(), key=lambda o: o["id"]),
                      "desecrate": slot["corr"] == "amul", "crafts": crafts})
    catalog = [{"code": c, "label": v[0], "short": v[1], "kind": v[2], "group": v[3], "role": ROLE.get(c, "")}
               for c, v in CATALOG.items()]
    return {"bosses": data["bosses"], "slots": slots, "rules": data["rules"], "catalog": catalog,
            "classes": CLASSES, "tabs": [[k, v, CLASSES[k // 8]] for k, v in TAB_NAMES.items()],
            "maxres": MAX_RES}


def write_page(data):
    pd = page_data(data)
    html = TEMPLATE.read_text(encoding="utf-8")
    blob = json.dumps(pd, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    PAGE.write_text(html.replace("/*__DATA__*/null", blob), encoding="utf-8", newline="\n")
    print(f"wrote {PAGE.relative_to(ROOT)} ({PAGE.stat().st_size // 1024} KB)")


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--check", action="store_true", help="exit 1 if the section is not what the rules make")
    ap.add_argument("--page", action="store_true", help="write tools/boss_tag_editor.html")
    ap.add_argument("--apply", metavar="FILE", help="take edited slots (JSON) into the rules file")
    args = ap.parse_args()
    data = load_rules()
    if args.apply:
        edits = json.loads(Path(args.apply).read_text(encoding="utf-8"))
        for key, slot_rules in edits.items():
            if key not in data["rules"]:
                sys.exit(f"--apply: unknown slot {key}")
            for b, rule in slot_rules.items():
                if b in dict(data["bosses"]):
                    data["rules"][key][b] = normalized(rule)
        RULES.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
        print(f"applied {', '.join(edits)} to {RULES.relative_to(ROOT)}")
    if args.page:
        write_page(data)
        return 0
    text = render(data)
    if args.check:
        if not SECTION.exists() or SECTION.read_bytes() != text:
            print(f"{SECTION.relative_to(ROOT)} is not what tools/boss_tag_rules.json makes: "
                  "run python tools/gen_boss_tags.py", file=sys.stderr)
            return 1
        print("boss gear tags up to date")
        return 0
    if SECTION.exists() and SECTION.read_bytes() == text:
        print("updated: nothing")
        return 0
    SECTION.write_bytes(text)
    print(f"updated: {SECTION.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
