#!/usr/bin/env python3
"""
The author's review page for the Select Weapons filter level, "Endgame Filtering - Hides 35%, Shows Select Weapons"
(level 9 when made on 2026-10-25, level 8 since the author swapped them on 2026-10-26). For 21 weapon families (normal,
exceptional and elite, ethereal too where the base can be) it shows what the filter does today with an unidentified rare
drop at every filter level (tools/magic_rare_map.py's engine), the base's stats, what a rare can roll on it at item
level 85-99 and how likely, and the PD2 wiki's note per weapon class. Each row has a choice for the Select Weapons level;
the published page (a private claude.ai artifact) saves them in its db: collection `level9` (its name from before the
swap), one document per family keyed by its elite base's code, {rows: {"<code>" or "<code>-eth": choice}, note,
savedAt}.

    python tools/rare_weapon_review.py              writes tools/.cache/rare_weapon_review.html (gitignored)
    python tools/rare_weapon_review.py --simulate   also checks the exact odds against a simulation (three bases)

The odds: from item level 85 a rare has 3 prefixes and 3 suffixes (PD2's rare affix count). Each pick takes an affix
of its side by weight (frequency) among those that can roll (prefix or suffix, version not 0, spawnable, rare flag not
0, level <= affix level <= maxlevel, an item type of the base and none it excludes; the affix level is
tier_map.affix_level) and rules out the rest of its group, so a side draws 3 groups without replacement by their
total weight. Prefixes and suffixes share no group on these bases (the generator checks). Left out: the extra weight
tiered affixes get in maps.
"""
import argparse
import json
import random
import re
import sys
from pathlib import Path
from types import SimpleNamespace

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import base_map as B  # noqa: E402
import magic_rare_map as M  # noqa: E402
import tier_map as T  # noqa: E402

ROOT = B.ROOT
TEMPLATE = ROOT / "tools" / "rare_weapon_review_template.html"
PAGE = ROOT / "tools" / ".cache" / "rare_weapon_review.html"
BASE_STATS = ROOT / "docs" / "pd2-base-stats.tsv"
AFFIXES = ROOT / "docs" / "pd2-magic-affixes.tsv"
STAT_TEXT = ROOT / "docs" / "pd2-stat-text.tsv"
SKILLS = ROOT / "docs" / "pd2-skills.tsv"
WIKI = ROOT / "docs" / "items"

# The author's families (2026-10-25), named by their elite base, in the author's order. Left out on the author's word:
# Caduceus (rare scepters stay Paladin-only on the endgame levels) and Matriarchal Javelin (as today).
FAMILIES = ["Diamond Bow", "Hydra Bow", "Gorgon Crossbow", "Colossus Crossbow", "War Pike", "Ghost Glaive",
            "Balrog Spear", "Flying Axe", "Champion Sword", "Balrog Blade", "Colossus Blade", "Colossus Sword",
            "Ogre Maul", "Legendary Mallet", "Scourge", "Devil Star", "Reinforced Mace", "Champion Axe", "Ettin Axe",
            "Highland Blade", "Crusader Bow"]
SELECT_LEVEL, PLAIN_LEVEL = 8, 9  # the Select Weapons level and the plain Endgame level it adds to
CODE_COLORS = {"0": "WHITE", "1": "RED", "2": "GREEN", "3": "BLUE", "4": "GOLD", "5": "GRAY", "7": "TAN",
               "8": "ORANGE", "9": "YELLOW", ";": "PURPLE", ":": "DARK_GREEN"}
# the level 9 choices; a look borrows an existing 190 rule's output and minimap icon (its line is checked below)
CHOICES = [("same", f"As level {PLAIN_LEVEL}"), ("hide", "Hide"), ("name", "Name only"),
           ("icon", "Name + minimap icon"), ("orange", "Orange look + icon + chat"),
           ("purple", "Purple look + icon + chat")]
# choice -> (the start of the borrowed 190 rule's output, words its condition has, what the page says it looks like)
LOOK_RULES = {"icon": ("%NAME%%MAP-0B%%DOT-6A%%PX-20%%TIER-0%", ["ETH", "7wh"], "as eth Legendary Mallets"),
              "orange": ("%RARE_ETH_CRAFT_LEFT%", ["ETH", "7m7"], "as eth Ogre Mauls"),
              "purple": ("%RARE_MEDIUM_VALUE_LEFT%", ["CHEST", "FILTLVL<8"], "as rare chests 75+ on levels 0-7")}
WIKI_FILES = {"Bows": "Bows", "Crossbows": "Crossbows", "Spears": "Spears", "Javelins": "Throwing",
              "Throwing Weapons": "Throwing", "Swords": "Swords", "Hammers": "Maces", "Maces and Clubs": "Maces",
              "Axes": "Axes"}
ILVLS = list(range(85, 100))  # item levels with 6 affixes (3 prefixes + 3 suffixes)
TIERS_SHOWN = 4  # per stat: the chance of at least each of the best few tiers
CLASSES = ["Amazon", "Sorceress", "Necromancer", "Paladin", "Barbarian", "Druid", "Assassin"]  # stat 83's param
TAB_NAMES = {0: "Bow and Crossbow", 1: "Passive and Magic", 2: "Javelin and Spear", 8: "Fire", 9: "Lightning",
             10: "Cold", 16: "Curses", 17: "Poison and Bone", 18: "Summoning (Necromancer)", 24: "Combat (Paladin)",
             25: "Offensive Auras", 26: "Defensive Auras", 32: "Combat (Barbarian)", 33: "Combat Masteries",
             34: "Warcries", 40: "Summoning (Druid)", 41: "Shape Shifting", 42: "Elemental", 48: "Traps",
             49: "Shadow Disciplines", 50: "Martial Arts"}
TAB_CLASS = {t: CLASSES[t // 8] for t in TAB_NAMES}  # stat 188's param: 8 per class, in stat 83's order
# stat signature (the stat ids an affix gives) -> key; the key's label, section and the stat that ranks its tiers
SIGNATURES = {(17, 18): "ed", (17, 18, 19): "edar", (22,): "max", (21,): "min", (218,): "maxlvl",
              (218, 224): "maxarlvl", (93,): "ias", (136,): "cb", (141,): "ds", (135, 501): "ow", (60,): "ll",
              (62,): "ml", (19,): "ar", (19, 89): "arlr", (89, 119): "arpct", (225,): "arpctlvl", (194,): "sock",
              (48, 49): "fire", (54, 55, 56): "cold", (50, 51): "ltng", (57, 58, 59): "pois", (333,): "pfire",
              (335,): "pcold", (334,): "pltng", (336,): "ppois", (121, 123): "demon", (122, 124): "undead",
              (198,): "ctc", (204,): "charged", (0,): "str", (2,): "dex", (7,): "life", (9,): "mana",
              (86,): "lifekill", (138,): "manakill", (74,): "regen", (39,): "fres", (41,): "lres", (43,): "cres",
              (45,): "pres", (91,): "req", (81,): "knock", (117,): "heal", (252,): "repair"}
CATALOG = [  # key, label, section, ranking stat
    ("ed", "Enhanced damage", "Damage", 17), ("edar", "Enhanced damage + attack rating", "Damage", 17),
    ("max", "+ Maximum damage", "Damage", 22), ("min", "+ Minimum damage", "Damage", 21),
    ("maxlvl", "+ Maximum damage per character level", "Damage", 218),
    ("maxarlvl", "+ Maximum damage and attack rating per level", "Damage", 218),
    ("ias", "Increased attack speed", "Speed and hit effects", 93),
    ("cb", "Crushing blow", "Speed and hit effects", 136), ("ds", "Deadly strike", "Speed and hit effects", 141),
    ("ow", "Open wounds", "Speed and hit effects", 501),
    ("ll", "Life stolen per hit", "Leech", 60), ("ml", "Mana stolen per hit", "Leech", 62),
    ("sock", "Sockets", "Sockets", 194),
    ("clsk", "+ Class skills", "Skills", 83), ("tab", "+ Skill tab", "Skills", 188),
    ("ar", "Attack rating", "Attack rating", 19), ("arlr", "Attack rating + light radius", "Attack rating", 19),
    ("arpct", "Attack rating % + light radius", "Attack rating", 119),
    ("arpctlvl", "Attack rating % per level", "Attack rating", 225),
    ("fire", "Fire damage", "Elemental", 49), ("cold", "Cold damage", "Elemental", 55),
    ("ltng", "Lightning damage", "Elemental", 51), ("pois", "Poison damage", "Elemental", 58),
    ("pfire", "Enemy fire resistance", "Elemental", 333), ("pcold", "Enemy cold resistance", "Elemental", 335),
    ("pltng", "Enemy lightning resistance", "Elemental", 334),
    ("ppois", "Enemy poison resistance", "Elemental", 336),
    ("demon", "Damage to demons", "Demons and undead", 121), ("undead", "Damage to undead", "Demons and undead", 122),
    ("ctc", "Chance to cast on striking", "Other", 198), ("charged", "Charged skill", "Other", 204),
    ("str", "Strength", "Other", 0), ("dex", "Dexterity", "Other", 2), ("life", "Life", "Other", 7),
    ("mana", "Mana", "Other", 9), ("lifekill", "Life after each kill", "Other", 86),
    ("manakill", "Mana after each kill", "Other", 138), ("regen", "Replenish life", "Other", 74),
    ("fres", "Fire resistance", "Other", 39), ("cres", "Cold resistance", "Other", 43),
    ("lres", "Lightning resistance", "Other", 41), ("pres", "Poison resistance", "Other", 45),
    ("req", "Requirements", "Other", 91), ("knock", "Knockback", "Other", 81),
    ("heal", "Prevent monster heal", "Other", 117), ("repair", "Repairs durability", "Other", 252)]
SECTIONS = ["Damage", "Speed and hit effects", "Leech", "Sockets", "Skills", "Attack rating", "Elemental",
            "Demons and undead", "Other"]
MAIN_SECTIONS = {"Damage", "Speed and hit effects", "Leech", "Sockets", "Skills"}  # open; the rest folded away


def tsv(path):
    """The rows of a docs/ TSV as dicts (its header is the first line that is not a # comment)."""
    head, out = None, []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("#") or not line:
            continue
        cols = line.split("\t")
        if head is None:
            head = cols
            continue
        out.append(dict(zip(head, cols + [""] * (len(head) - len(cols)))))
    return out


def num(text):
    text = str(text or "").strip()
    return int(text) if text.lstrip("-").isdigit() else 0


# ---------------------------------------------------------------- the families and their bases

def families(base_stats, bases):
    """[{code, name, cat, codes: [normal, exceptional, elite]}] in the author's order."""
    by_name = {r["name"]: code for code, r in bases.items() if r["spawnable"]}
    out = []
    for name in FAMILIES:
        elite = by_name.get(name)
        if not elite or base_stats[elite]["ultracode"] != elite:
            raise SystemExit(f"{name}: no elite base of that name in docs/pd2-bases.tsv")
        r = base_stats[elite]
        codes = [r["normcode"], r["ubercode"], r["ultracode"]]
        out.append({"code": elite, "name": name, "cat": M.category(bases[elite]), "codes": codes})
    return out


def damage(r, eth):
    """[[mode, min, max]] (one-hand, two-hand, throw); ethereal: x1.25, rounded down."""
    out = []
    for mode, lo, hi in (("One-hand", "mindam", "maxdam"), ("Two-hand", "2handmindam", "2handmaxdam"),
                         ("Throw", "minmisdam", "maxmisdam")):
        a, b = num(r[lo]), num(r[hi])
        if a or b:
            out.append([mode, a * 5 // 4 if eth else a, b * 5 // 4 if eth else b])
    return out


def stats_of(code, eth, base_stats, bases):
    r, b = base_stats[code], bases[code]
    return {"dmg": damage(r, eth), "speed": num(r["speed"]), "range": num(r["rangeadder"]) if r["rangeadder"] else None,
            "str": num(r["reqstr"]), "dex": num(r["reqdex"]), "lvl": num(r["levelreq"]), "qlvl": b["qlvl"],
            "sock": b["sockets"], "maxsock": list(b["maxsock"]), "size": f"{b['width']}×{b['height']}",
            "dur": num(r["durability"]) if r["nodurability"] != "1" else None,
            "hands": "2H" if r["2handed"] == "1" and r["1or2handed"] != "1" else "1H or 2H" if r["1or2handed"] == "1"
            else "1H"}


# ---------------------------------------------------------------- today: the filter's own rules

def holds(x, sc):
    """A folded condition (base_map's Simplifier trees) for one case; KeyError for a word the case doesn't decide."""
    k = x[0]
    if k == "c":
        return bool(x[1])
    if k == "bool":
        return sc[x[1]] == x[2]
    if k == "set":
        v = sc[x[1]]
        return any(a <= v <= b for a, b in x[2])
    if k == "not":
        return not holds(x[1], sc)
    if k == "and":
        return all(holds(y, sc) for y in x[1])
    if k == "or":
        return any(holds(y, sc) for y in x[1])
    raise ValueError(x)


def scenario(eth, cls):
    sc = {"ETH": eth, "CLVL": 90}
    for word in B.CLASS_WORDS:
        sc[word] = word == cls
    return sc


class Looks:
    """Distinct looks: {k: hide / name / look, b: lines of [color, text], i: icon layers, h: chat, o: sound}."""

    def __init__(self):
        self.items, self.index = [], {}

    def ref(self, look):
        key = json.dumps(look, sort_keys=True)
        if key not in self.index:
            self.index[key] = len(self.items)
            self.items.append(look)
        return self.index[key]


def fill(image, name):
    return [[[c, t.replace(M.NAME_MARK, name)] for c, t in line] for line in image] if image else None


def name_image(an, base, eth, at_rule):
    """The plain name as the game draws it on this drop (the name layers before at_rule: 190:13-14)."""
    fake = SimpleNamespace(n=at_rule.n, name="%NAME%", raw="%NAME%")
    line = {"kind": "show", "display": fake, "cond": ("bool", "ETH", eth), "lo": SELECT_LEVEL}
    image, _ = an.image_of(line, base, "RARE", M.Simplifier(base))
    return fill(image, base.name)


def today(an, base, eth, looks, plain, unknown):
    """{s: [look per level 0-12] for no named class at character level 90, x: [[classes, strip]] for classes that
    differ, r: the rows in words}."""
    rows = an.rows(base, "RARE")

    def state(lv, sc):
        st = {"k": "name", "b": plain, "i": [], "h": False, "o": 0}
        for x in rows:
            if lv not in x["levels"]:
                continue
            try:
                if not holds(x["cond"], sc):
                    continue
            except KeyError as e:
                unknown.add(f"{base.code}: {e.args[0]}")
                continue
            if x["kind"] == "hide":
                st["k"], st["b"] = "hide", None
            elif x["kind"] == "show":
                st["k"], st["b"] = "look", fill(x["image"], base.name)
            st["i"] += [list(layer) for layer in x["icons"]]
            st["h"] = st["h"] or bool(x["chat"])
            st["o"] = st["o"] or x["sound"]
        return looks.ref(st)

    strips = {}
    for cls in [None] + sorted(B.CLASS_WORDS):
        sc = scenario(eth, cls)
        strips[cls] = [state(lv, sc) for lv in T.FILTER_LEVELS]
    others = {}
    for cls, strip in strips.items():
        if cls and strip != strips[None]:
            others.setdefault(json.dumps(strip), [strip, []])[1].append(B.CLASS_WORDS[cls])
    words = []
    want = "eth" if eth else "non-eth"
    for x in rows:
        if x["cells"].get("eth") not in (None, "", want):
            continue
        cells = {c: v for c, v in x["cells"].items() if c != "eth" and v}
        words.append({"lv": T.level_runs(x["list"]).capitalize() if x.get("list") else B.level_text(x["lo"], x["hi"]),
                      "k": x["kind"], "b": fill(x["image"], base.name), "i": [list(layer) for layer in x["icons"]],
                      "h": bool(x["chat"]), "c": "; ".join(f"{c}: {v}" for c, v in cells.items()),
                      "w": B.where_text(x["rules"])})
    return {"s": strips[None], "x": [[names, strip] for strip, names in others.values()], "r": words}


def choice_looks(an, base, eth, rules, looks):
    """{choice: look} for the choices that draw something (name, icon, orange, purple)."""
    out = {}
    for choice in ("name", "icon", "orange", "purple"):
        r = rules["icon"] if choice == "name" else rules[choice]
        fake = SimpleNamespace(n=r.n, name="%NAME%" if choice == "name" else r.name, raw=r.raw)
        line = {"kind": "show", "display": fake, "cond": ("bool", "ETH", eth), "lo": SELECT_LEVEL}
        image, _ = an.image_of(line, base, "RARE", M.Simplifier(base))
        st = {"k": "name" if choice in ("name", "icon") else "look", "b": fill(image, base.name), "i": [], "h": False,
              "o": 0}
        if choice != "name":
            st["i"] = [list(r.icons)]
            st["h"] = r.tier is None or r.tier >= SELECT_LEVEL
            st["o"] = r.sound
        out[choice] = looks.ref(st)
    return out


def look_rules(an):
    """The 190 rules whose output and icons the choices borrow ({choice: rule}), found by their output and the words
    of their condition."""
    out = {}
    for choice, (start, words, _) in LOOK_RULES.items():
        found = [r for r in an.rules if r.where.startswith("sections/190-rares.filter:") and
                 r.raw.startswith(start) and r.icons and all(re.search(rf"(?<![\w!]){re.escape(w)}(?!\w)", r.cond)
                                                             for w in words)]
        if not found:
            raise SystemExit(f"no 190 rule shows '{start}' with {words} any more: update LOOK_RULES")
        out[choice] = found[0]
    return out


def look_notes(rules):
    return {c: f"{note} ({rules[c].where.replace('sections/', '').replace('-rares.filter', '')})"
            for c, (_, _, note) in LOOK_RULES.items()}


# ---------------------------------------------------------------- what a rare can roll

class Affixes:
    def __init__(self):
        self.rows = []
        for a in tsv(AFFIXES):
            if a["kind"] not in ("prefix", "suffix") or not num(a["version"]) or a["spawnable"] != "1":
                continue
            if num(a["rare"]) == 0 or num(a["frequency"]) <= 0:
                continue
            mods = json.loads(a["mods"] or "[]")
            st = [s for m in mods for s in m[5]]
            if not st:
                continue
            a.update(level=num(a["level"]), maxlevel=num(a["maxlevel"]), w=num(a["frequency"]), g=num(a["group"]),
                     it=set(t for t in a["itypes"].split(",") if t), et=set(t for t in a["etypes"].split(",") if t),
                     st=st, sig=tuple(sorted({s[0] for s in st})))
            self.rows.append(a)
        self.stat = {num(r["id"]): r for r in tsv(STAT_TEXT)}
        self.skills = {num(r["id"]): r["name"] for r in tsv(SKILLS)}

    def pool(self, types):
        """The affixes that can roll on a rare of these item types, at any affix level."""
        types = set(types)
        return [a for a in self.rows if a["it"] & types and not a["et"] & types]


def key_of(a):
    """(catalog key, param) of an affix: class skills and skill tabs per class / tab."""
    key = SIGNATURES.get(a["sig"])
    if key is None:
        return None, None
    if key == "clsk":
        return key, next(s[1] for s in a["st"] if s[0] == 83)
    if key == "tab":
        return key, next(s[1] for s in a["st"] if s[0] == 188)
    return key, None


def rank_value(a, stat, cap):
    """(the affix's best value of the stat that ranks its key, its worst): skill-on-hit by skill level."""
    s = next((s for s in a["st"] if s[0] == stat), a["st"][0])
    if stat in (198, 204):
        return (s[1] & 63, s[3])
    if stat == 194:
        return (min(s[3], cap), min(s[2], cap))
    return (s[3], s[2])


def p_none(groups, draws=3):
    """The chance that none of `draws` picks succeeds: groups [(weight, failing weight)], drawn without replacement by
    weight, each pick failing with its group's failing share. Exact (three picks: O(n^2))."""
    groups = [g for g in groups if g[0] > 0]
    if draws <= 0 or not groups:
        return 1.0
    if draws != 3 or len(groups) < 4:
        total = sum(w for w, _ in groups)
        return sum(f / total * p_none(groups[:i] + groups[i + 1:], draws - 1) for i, (w, f) in enumerate(groups))
    W = sum(w for w, _ in groups)
    F = sum(f for _, f in groups)
    out = 0.0
    for i, (wa, fa) in enumerate(groups):
        if not fa:
            continue
        for j, (wb, fb) in enumerate(groups):
            if j == i or not fb:
                continue
            out += fa * fb * (F - fa - fb) / (W * (W - wa) * (W - wa - wb))
    return out


VALUE_FORMATS = {  # stat id -> how a value reads on the page ({} = the range)
    17: "{}% ED", 19: "+{} AR", 21: "+{} min damage", 22: "+{} max damage", 93: "{}% IAS", 136: "{}% CB",
    141: "{}% DS", 135: "{}% OW", 501: "{} OW damage per second", 60: "{}% life leech", 62: "{}% mana leech",
    89: "+{} light radius", 119: "{}% AR", 121: "{}% damage to demons", 123: "+{} AR against demons",
    122: "{}% damage to undead", 124: "+{} AR against undead", 194: "{} sockets", 0: "+{} Str", 2: "+{} Dex",
    7: "+{} life", 9: "+{} mana", 86: "+{} life after each kill", 138: "+{} mana after each kill",
    74: "+{} replenish life", 39: "{}% fire res", 41: "{}% lightning res", 43: "{}% cold res", 45: "{}% poison res",
    91: "{}% requirements", 81: "knockback", 117: "prevent monster heal", 252: "self repair ({})",
    333: "-{}% enemy fire res", 334: "-{}% enemy lightning res", 335: "-{}% enemy cold res",
    336: "-{}% enemy poison res"}
ELEMENTS = {49: (48, 56, "fire"), 51: (50, None, "lightning"), 55: (54, 56, "cold")}  # max: (min, length, word)


def value_text(a, aff, cap):
    """The affix's values as the page shows them."""
    parts = []
    for sid, param, lo, hi in a["st"]:
        if sid in (18, 48, 50, 54, 56, 57, 59):
            continue  # min% goes with max%, element minimums and lengths with their maximum
        if sid == 194:
            lo, hi = min(lo, cap), min(hi, cap)
        rng = f"{lo}" if lo == hi else f"{lo}-{hi}"
        if sid in ELEMENTS:
            low_id, len_id, word = ELEMENTS[sid]
            m = next((s for s in a["st"] if s[0] == low_id), None)
            low = (f"{m[2]}" if m[2] == m[3] else f"{m[2]}-{m[3]}") if m else "?"
            secs = next((s[2] for s in a["st"] if s[0] == len_id), 0) if len_id else 0
            parts.append(f"{low} to {rng} {word} damage" + (f", {secs / 25:g}s chill" if secs else ""))
        elif sid == 58:  # the game's text: (damage x length) >> 8 over length / 25 seconds
            length = next((s[2] for s in a["st"] if s[0] == 59), 0)
            parts.append(f"{lo * length // 256} poison damage over {length / 25:g}s" if length else rng)
        elif sid in (218, 224, 225):
            shift = num(aff.stat[sid]["op param"])
            per = [v / (1 << shift) for v in (lo, hi)]
            what = {218: "max damage", 224: "AR", 225: "% AR"}[sid]
            parts.append("+" + ("{:g}".format(per[0]) if lo == hi else "{:g}-{:g}".format(*per)) +
                         f" {what} per character level")
        elif sid in (198, 204):
            skill = aff.skills.get(param >> 6, f"skill {param >> 6}")
            parts.append(f"{rng}% chance to cast level {param & 63} {skill}" if sid == 198
                         else f"level {param & 63} {skill} ({rng} charges)")
        elif sid == 83:
            parts.append(f"+{rng} to {CLASSES[param]} skills")
        elif sid == 188:
            parts.append(f"+{rng} to {TAB_NAMES.get(param, f'tab {param}')} skills ({TAB_CLASS.get(param, '?')} only)")
        else:
            parts.append(VALUE_FORMATS.get(sid, "{} " + aff.stat.get(sid, {}).get("stat", f"stat {sid}")).format(rng))
    return ", ".join(parts)


def rolls(aff, pool, alvl, cap, texts):
    """[[key, param, [[tier text index, affix level, chance of this tier or better]...], chance of any]] in catalog
    order, for one base's pool at one affix level (cap: the base's most sockets at item level 41+)."""
    live = [a for a in pool if a["level"] <= alvl and (not a["maxlevel"] or alvl <= a["maxlevel"])]
    sides = {k: [a for a in live if a["kind"] == k] for k in ("prefix", "suffix")}
    weights = {k: {} for k in sides}
    for k, rows in sides.items():
        for a in rows:
            weights[k][a["g"]] = weights[k].get(a["g"], 0) + a["w"]

    def chance(pred):
        p = 1.0
        for k, rows in sides.items():
            ok = {}
            for a in rows:
                if pred(a):
                    ok[a["g"]] = ok.get(a["g"], 0) + a["w"]
            if ok:
                p *= p_none([(w, w - ok.get(g, 0)) for g, w in weights[k].items()])
        return 1 - p

    keyed = {}
    for a in live:
        key, param = key_of(a)
        if key:
            keyed.setdefault((key, param), []).append(a)
    out = []
    order = {k: i for i, (k, *_r) in enumerate(CATALOG)}
    stat_of = {k: s for k, _, _, s in CATALOG}
    for (key, param), rows in sorted(keyed.items(), key=lambda x: (order[x[0][0]], x[0][1] or 0)):
        stat = stat_of[key]
        if key == "sock" and cap <= 0:
            continue
        rows = sorted(rows, key=lambda a: rank_value(a, stat, cap), reverse=True)
        ids = {id(a) for a in rows}
        tiers, seen = [], set()
        for a in rows:
            best = rank_value(a, stat, cap)
            if best in seen:
                continue
            seen.add(best)
            if len(tiers) == TIERS_SHOWN:
                break
            p = chance(lambda b, best=best: id(b) in ids and rank_value(b, stat, cap) >= best)
            text = f"{a['name']}: {value_text(a, aff, cap)}"
            if text not in texts:
                texts[text] = len(texts)
            tiers.append([texts[text], a["level"], round(p, 5)])
        out.append([key, param, tiers, round(chance(lambda b: id(b) in ids), 5)])
    return out


def simulate(aff, pool, alvl, cap, runs=200000, seed=7):
    """The same chances by drawing rares (to check rolls()): {(key, param): chance of any}."""
    rng = random.Random(seed)
    live = [a for a in pool if a["level"] <= alvl and (not a["maxlevel"] or alvl <= a["maxlevel"])]
    sides = [[a for a in live if a["kind"] == k] for k in ("prefix", "suffix")]
    counts = {}
    for _ in range(runs):
        got = set()
        for rows in sides:
            used = set()
            for _ in range(3):
                cand = [a for a in rows if a["g"] not in used]
                if not cand:
                    break
                a = rng.choices(cand, weights=[a["w"] for a in cand])[0]
                used.add(a["g"])
                key = key_of(a)
                if key[0] and not (key[0] == "sock" and cap <= 0):
                    got.add(key)
        for key in got:
            counts[key] = counts.get(key, 0) + 1
    return {k: v / runs for k, v in counts.items()}


# ---------------------------------------------------------------- the PD2 wiki's notes per weapon class

ETH_NOTE = "Ethereal weapons gain a x1.25 damage bonus instead of a x1.5 damage bonus."  # said once, in the header


def wiki_note(cat):
    path = WIKI / f"{WIKI_FILES[cat]}.wiki"
    text = path.read_text(encoding="utf-8")
    m = re.search(r"<noinclude>(.*?)</noinclude>", text, re.S)
    out = []
    for line in (m.group(1).splitlines() if m else []):
        line = re.sub(r"<[^>]+>", "", line)
        line = re.sub(r"\[\[([^\]|]*\|)?([^\]]*)\]\]", r"\2", line).strip()
        if line and line != ETH_NOTE and not re.match(r"^(Also )?[Ss]ee ", line):
            out.append(line)
    return out


# ---------------------------------------------------------------- the page

def level_name(raw):
    """[[color, text]] of a filter level name with its ÿc codes."""
    segs, color = [], "WHITE"
    for part in re.split(r"(ÿc.)", raw):
        if part.startswith("ÿc") and len(part) == 3:
            color = CODE_COLORS.get(part[2], color)
        elif part:
            segs.append([color, part])
    return segs


def build_data(check_odds=False):
    base_stats = {r["code"]: r for r in tsv(BASE_STATS)}
    bases = T.load_bases()
    fams = families(base_stats, bases)
    print("reading the filter's rules (magic_rare_map engine)...", flush=True)
    an = M.Analysis()
    engine = {b.code: b for b in an.bases}
    rules = look_rules(an)
    aff = Affixes()
    looks, texts, unknown = Looks(), {}, set()
    rolltab = Looks()  # distinct roll tables (bases of one item type share them)
    groups, out_fams, counts = [], [], {"families": 0, "bases": 0, "rows": 0}
    level_line = [line for line in (ROOT / "sections" / "010-filter-levels.filter").read_text(
        encoding="utf-8").splitlines() if line.startswith("ItemDisplayFilterName[]")][SELECT_LEVEL - 1]
    for fam in fams:
        counts["families"] += 1
        rows, roll_data, pool = [], {}, None
        for tier, code in zip(("Normal", "Exceptional", "Elite"), fam["codes"]):
            base = engine[code]
            counts["bases"] += 1
            info = bases[code]
            pool = aff.pool(info["types"])
            cap = info["maxsock"][2]
            alvls = [T.affix_level(i, info["qlvl"], info["mlvl"]) for i in ILVLS]
            for alvl in sorted(set(alvls)):
                key = f"{code}:{alvl}"
                if key not in roll_data:
                    roll_data[key] = rolltab.ref(rolls(aff, pool, alvl, cap, texts))
            for eth in ([False, True] if info["eth"] else [False]):
                counts["rows"] += 1
                plain = name_image(an, base, eth, rules["icon"])
                rows.append({"id": code + ("-eth" if eth else ""), "code": code, "name": base.name, "tier": tier,
                             "eth": eth, "stats": stats_of(code, eth, base_stats, bases), "alvl": alvls,
                             "today": today(an, base, eth, looks, plain, unknown),
                             "looks": choice_looks(an, base, eth, rules, looks)})
        if check_odds and fam["name"] in ("Colossus Blade", "Hydra Bow", "Flying Axe"):
            for code in fam["codes"][1:]:
                info = bases[code]
                for ilvl in (85, 99):
                    alvl = T.affix_level(ilvl, info["qlvl"], info["mlvl"])
                    exact = {(k, p): a for k, p, _, a in rolltab.items[roll_data[f"{code}:{alvl}"]]}
                    sim = simulate(aff, aff.pool(info["types"]), alvl, info["maxsock"][2])
                    worst = max(abs(exact.get(k, 0) - sim.get(k, 0)) for k in set(exact) | set(sim))
                    print(f"  odds check {code} item level {ilvl} (affix level {alvl}): largest difference "
                          f"{worst * 100:.2f} points over {len(exact)} stats")
        shared = {a["g"] for a in pool if a["kind"] == "prefix"} & {a["g"] for a in pool if a["kind"] == "suffix"}
        if shared:
            print(f"  note: {fam['name']}: prefix and suffix groups {sorted(shared)} overlap (odds treat sides apart)")
        out_fams.append({"code": fam["code"], "name": fam["name"], "cat": fam["cat"],
                         "chain": [bases[c]["name"] for c in fam["codes"]], "rows": rows, "rolls": roll_data})
    cats = []  # in the order the author's list first names them
    for fam in out_fams:
        if fam["cat"] not in cats:
            cats.append(fam["cat"])
    for cat in cats:
        groups.append({"cat": cat, "note": wiki_note(cat), "fams": [f["code"] for f in out_fams if f["cat"] == cat]})
    if unknown:
        print("  words the review could not decide (cases skipped): " + ", ".join(sorted(unknown)))
    sounds = {}
    for look in looks.items:
        if look["o"]:
            sounds[look["o"]] = an.sounds.get(look["o"], {}).get("name", str(look["o"]))
    catalog = [{"k": k, "l": label, "s": sec} for k, label, sec, _ in CATALOG]
    data = {"version": an.version, "levels": T.load_levels(), "palette": T.load_palette(), "ilvls": ILVLS,
            "name9": level_name(level_line.split(":", 1)[1].split("//")[0]), "sel": SELECT_LEVEL,
            "plain": PLAIN_LEVEL,
            "choices": [{"id": c, "l": label, "n": look_notes(rules).get(c, "")} for c, label in CHOICES],
            "looks": looks.items, "texts": [t for t, _ in sorted(texts.items(), key=lambda x: x[1])],
            "rolltab": rolltab.items, "ethNote": ETH_NOTE,
            "catalog": catalog, "sections": SECTIONS, "main": sorted(MAIN_SECTIONS), "classes": CLASSES,
            "tabs": {str(k): [v, TAB_CLASS[k]] for k, v in TAB_NAMES.items()}, "groups": groups,
            "fams": out_fams, "sounds": sounds}
    return data, counts


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="The level 9 rare weapon review page.")
    ap.add_argument("--simulate", action="store_true", help="check the exact odds against a simulation")
    args = ap.parse_args()
    data, counts = build_data(check_odds=args.simulate)
    page = TEMPLATE.read_text(encoding="utf-8").replace(
        "/*__DATA__*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    PAGE.parent.mkdir(parents=True, exist_ok=True)
    PAGE.write_text(page, encoding="utf-8", newline="\n")
    print(f"wrote {PAGE.relative_to(ROOT)} ({len(page) // 1024} KB): {counts['families']} families, "
          f"{counts['bases']} bases, {counts['rows']} rows")


if __name__ == "__main__":
    main()
