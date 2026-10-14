#!/usr/bin/env python3
"""
The value tiers of unique and set items: how the filter shows each one when it drops unidentified (High /
Medium / Minimal value, Low Level Duel, DClone/Rathma...), and when the others are shown quietly or hidden.

Nothing is read from comments. Every unique and set item (docs/pd2-unique-set-items.tsv, plus the unique charms
and jewel) runs through the filter's rules, evaluated as tools/explain_item.py does (BH's order and logic), at
every filter level, ethereal or not, and for each character level, class, place, Discovery Progress state and
variant toggle (BIG_GG, POE_SOUNDS, REVEALED) the rules test. Items on one base share a tier: unidentified, the
filter cannot tell them apart (Lightsabre / Azurewrath).

The output is one page for players, Erazure-Unique-Set-Tiers.html in the repo root (committed; GitHub Pages serves
it from main). build.bat writes it after the date stamp (its footer shows the version), and so does the Claude
Code hook after a section edit.

    python tools/tier_map.py             write Erazure-Unique-Set-Tiers.html (and count the filter checks)
    python tools/tier_map.py --check     exit 1 if Erazure-Unique-Set-Tiers.html is out of date (CI)
    python tools/tier_map.py --findings  list the filter checks: rules and game data that disagree (a tier rule on
                                         a base no such item drops as, a rule comment naming an item that is not
                                         on its base, a label BH cuts at 56 characters, ...)

Notifications: the first matching notification rule that its %TIER-n% allows decides the chat line and the
sound (BH); %TIER-n% leaves the minimap icons on (patch notes; the author: %TIER-0% = icon only). Icons stack,
each matching rule's BORDER/MAP/DOT/PX boxes, up to the first one without %CONTINUE% (BH MapNotify.cpp).
Game data: docs/pd2-bases.tsv, docs/pd2-sounds.tsv, docs/pd2-palette.tsv (python tools/pd2_data.py --tier-data).
"""
import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from itertools import permutations
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402
import item_data  # noqa: E402
import lint_filter as L  # noqa: E402
import pd2_data  # noqa: E402

ROOT = build.ROOT
PAGE = ROOT / "Erazure-Unique-Set-Tiers.html"  # the page for players (committed; GitHub Pages serves it)
TEMPLATE = ROOT / "tools" / "tier_map_template.html"
LEVELS_FILE = ROOT / "sections" / "010-filter-levels.filter"
BASES = ROOT / "docs" / "pd2-bases.tsv"
SOUNDS = ROOT / "docs" / "pd2-sounds.tsv"
PALETTE = ROOT / "docs" / "pd2-palette.tsv"
TIER_SECTIONS = ("sections/150-", "sections/160-", "sections/170-")  # the tier rules (findings check these)

# Unique items docs/pd2-unique-set-items.tsv leaves out (charms and jewels have no slot there)
EXTRA_ITEMS = [("UNI", "Annihilus", "cm1"), ("UNI", "Hellfire Torch", "cm2"), ("UNI", "Gheed's Fortune", "cm3"),
               ("UNI", "Rainbow Facet", "jew")]
# Quest items that are unique items (080-quest-items shows them)
QUEST_CODES = {"vip", "msf", "hst", "hfh", "qf1", "qf2"}
# Sound id -> the name shown (default: its Sounds.txt name, "object_gibbet_impact" -> "gibbet impact")
SOUND_NAMES = {}
SOUND_PREFIXES = ("object_", "drop_")
# Area names for the MAPID values the tier rules test (Levels.txt: 137 = UberDiabloLvl)
AREA_NAMES = {137: "the Uber Diablo level (Pandemonium Fortress)"}
TOWN_IDS = {1, 40, 75, 103, 109, 202, 203, 204, 205, 206}  # Alias[TOWN]
FIELD_ID = 2  # Blood Moor: an area no rule tests, for "anywhere else"

CLASSES = ["AMAZON", "ASSASSIN", "BARBARIAN", "DRUID", "NECROMANCER", "PALADIN", "SORCERESS"]
CLASS_NAMES = {"AMAZON": "Amazons", "ASSASSIN": "Assassins", "BARBARIAN": "Barbarians", "DRUID": "Druids",
               "NECROMANCER": "Necromancers", "PALADIN": "Paladins", "SORCERESS": "Sorceresses"}
TOGGLES = ["BIG_GG", "POE_SOUNDS", "REVEALED"]
TOGGLE_NAMES = {"BIG_GG": "BIG GG", "POE_SOUNDS": "PoE", "REVEALED": "Revealed"}
QUALITIES = {"NMAG", "MAG", "RARE", "UNI", "SET", "CRAFT"}
OTHER_PLACES = {"INVENTORY", "STASH", "CUBE", "SHOP", "EQUIPPED", "MERC"}
MAYBE = 0.5

# Item type -> category: the first match in the base's item types (class items first; javelins before throwing
# weapons before axes). CATEGORY_ORDER follows 160-uniques-value-tiers.
TYPE_CATEGORY = [("jewl", "Jewels"), ("ring", "Rings"), ("amul", "Amulets"), ("char", "Charms"),
                 ("circ", "Circlets"), ("amaz", "Amazon Weapons"), ("assn", "Assassin Claws"),
                 ("barb", "Barbarian Helms"), ("sorc", "Sorceress Orbs"), ("drui", "Druid Pelts"),
                 ("necr", "Necromancer Shields"), ("ashd", "Paladin Shields"), ("pala", "Paladin Weapons"),
                 ("tors", "Armors"), ("belt", "Belts"), ("boot", "Boots"), ("glov", "Gloves"), ("helm", "Helms"),
                 ("shld", "Shields"), ("jave", "Javelins"), ("tkni", "Throwing Weapons"),
                 ("taxe", "Throwing Weapons"), ("bow", "Bows and Crossbows"), ("xbow", "Bows and Crossbows"),
                 ("knif", "Daggers"), ("axe", "Axes"), ("mace", "Maces"), ("club", "Maces"), ("hamm", "Maces"),
                 ("pole", "Polearms"), ("spea", "Spears"), ("scep", "Scepters"), ("staf", "Staves"),
                 ("swor", "Swords"), ("wand", "Wands"), ("bowq", "Quivers"), ("xboq", "Quivers")]
CATEGORY_ORDER = ["Jewels", "Rings", "Amulets", "Charms", "Circlets", "Amazon Weapons", "Assassin Claws",
                  "Barbarian Helms", "Sorceress Orbs", "Druid Pelts", "Necromancer Shields", "Paladin Shields",
                  "Paladin Weapons", "Armors", "Belts", "Boots", "Gloves", "Helms", "Shields", "Bows and Crossbows",
                  "Daggers", "Axes", "Throwing Weapons", "Javelins", "Maces", "Polearms", "Spears", "Scepters",
                  "Staves", "Swords", "Wands", "Quivers", "Other"]
# BH's item group words (Item.cpp: from the base's item types and tier). A weapon is in one weapon group: the first
# of WEAPON_GROUPS its types include. PD2's javelins are spears too (jave's Equiv2 is spea), but BH makes them JAV,
# never SPEAR; MACE is all three kinds. A circlet is CIRC, never HELM.
GROUP_TYPES = {"HELM": {"helm"}, "CIRC": {"circ"}, "CHEST": {"tors"}, "SHIELD": {"shld"}, "GLOVES": {"glov"},
               "BOOTS": {"boot"}, "BELT": {"belt"}, "ARMOR": {"armo"}, "WEAPON": {"weap"}, "THROWING": {"thro"},
               "CLASS": {"clas"}, "DRU": {"drui"}, "BAR": {"barb"}, "DIN": {"pala"}, "NEC": {"necr"}, "SIN": {"assn"},
               "SOR": {"sorc"}, "ZON": {"amaz"}, "JEWELRY": {"ring", "amul"}, "CHARM": {"char"},
               "QUIVER": {"bowq", "xboq"}, "1H": {"1han"}, "2H": {"2han"}, "MISC": {"misc"}}
WEAPON_GROUPS = [("club", {"CLUB", "MACE"}), ("mace", {"TMACE", "MACE"}), ("hamm", {"HAMMER", "MACE"}),
                 ("wand", {"WAND"}), ("staf", {"STAFF"}), ("bow", {"BOW"}), ("axe", {"AXE"}), ("scep", {"SCEPTER"}),
                 ("swor", {"SWORD"}), ("knif", {"DAGGER"}), ("jave", {"JAV"}), ("spea", {"SPEAR"}),
                 ("pole", {"POLEARM"}), ("xbow", {"XBOW"})]
GROUP_WORDS = set(GROUP_TYPES).union(*(words for _, words in WEAPON_GROUPS))
TIER_GROUP = {"normal": "NORM", "exceptional": "EXC", "elite": "ELT"}
TIER_NAMES = {"normal": "Normal", "exceptional": "Exceptional", "elite": "Elite"}

# Looks: what a stopping rule shows (the alias its output uses, or what it is) -> (name, rank, tier group).
# The highest-ranked look an item gets anywhere puts it in that tier group.
LOOKS = {
    "BIG_GG": ("BIG GG", 100, "Diablo Clone & Rathma"),
    "UNI_DCLONE_RATHMA": ("Diablo Clone & Rathma look", 95, "Diablo Clone & Rathma"),
    "FACET": ("Rainbow Facet look", 90, "High value"),
    "UNI_HIGH_VALUE": ("High value", 80, "High value"), "SET_HIGH_VALUE": ("High value", 80, "High value"),
    "UNI_MEDIUM_VALUE": ("Medium value", 70, "Medium value"),
    "SET_MEDIUM_VALUE": ("Medium value", 70, "Medium value"),
    "UNI_MINIMAL_VALUE": ("Minimal value", 60, "Minimal value"),
    "UNI_LLD": ("Low Level Duel", 50, "Low Level Duel"), "SET_LLD": ("Low Level Duel", 50, "Low Level Duel"),
    "LLD_TAG": ("name with an [LLD] tag", 45, "Low Level Duel"),
    "UNI_NORMAL": ("standard unique look", 30, "Everything else"),
    "SET": ("standard set look", 30, "Everything else"),
    "DECORATED": ("dimmer set look", 30, "Everything else"),  # 170: normal sets at levels 0-2, character level 60+
    "NAME": ("name only", 20, "Everything else"),
    "HIDDEN": ("hidden", 0, "Everything else"),
}
TIER_GROUPS = ["Diablo Clone & Rathma", "High value", "Medium value", "Minimal value", "Low Level Duel",
               "Everything else"]
LOOK_ALIAS_RE = re.compile(r"%((?:UNI|SET)_[A-Z_]+?)_LEFT%")
COMPARE_RE = re.compile(r"^(.+?)([<>=~])(-?\d+)(?:-(\d+))?$")
COLOR_RE = re.compile(r"%(" + "|".join(sorted(L.BH_COLORS, key=len, reverse=True)) + r")%")
DIMS = ["BIG_GG", "POE_SOUNDS", "REVEALED", "ETH", "CLASS", "CLVL", "LOC", "GRAIL", "FILTLVL"]


# ---------------------------------------------------------------- game data

def read_tsv(path):
    if not path.exists():
        sys.exit(f"missing {path.relative_to(ROOT)}: run python tools/pd2_data.py --tier-data \"<Diablo II folder>\"")
    rows = [line.split("\t") for line in path.read_text(encoding="utf-8").splitlines()
            if line and not line.startswith("#")]
    return rows[1:]


def load_bases():
    """{code: {name, tier, types, sockets, width, height, spawnable, qlvl}} from docs/pd2-bases.tsv."""
    return {code: {"name": name, "tier": tier, "types": types.split(",") if types else [], "sockets": int(sockets),
                   "width": int(width), "height": int(height), "spawnable": spawnable == "1", "qlvl": int(qlvl)}
            for code, name, tier, types, sockets, width, height, spawnable, qlvl in read_tsv(BASES)}


def load_sounds():
    out = {}
    for index, sound, file in read_tsv(SOUNDS):
        name = sound
        for p in SOUND_PREFIXES:
            if name.startswith(p):
                name = name[len(p):]
        out[int(index)] = {"name": SOUND_NAMES.get(int(index), name.replace("_", " ")), "file": file}
    return out


def load_palette():
    return {index.upper(): color for index, color in read_tsv(PALETTE)}


def load_levels():
    """Filter level names, 0-12, as the launcher lists them (color codes removed)."""
    names = ["Show All Items"]
    for line in LEVELS_FILE.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^ItemDisplayFilterName\[\]:(.*?)(?://.*)?$", line)
        if m:
            names.append(re.sub(r"ÿc.", "", m.group(1)).strip())
    return names


def category(base):
    types = set(base["types"]) if base else set()
    for t, name in TYPE_CATEGORY:
        if t in types:
            return name
    return "Other"


def item_groups(types):
    """BH's item group words for a base of these item types (its tier aside)."""
    groups = {g for g, ts in GROUP_TYPES.items() if ts & types}
    groups.update(next((words for t, words in WEAPON_GROUPS if t in types), ()))
    if "circ" in types:
        groups.discard("HELM")
    return groups


def load_items(bases):
    """[{kind, name, code, set}] of every unique and set item."""
    set_of = {}
    for it in item_data.items():
        if it["kind"] == "SET":
            set_of[pd2_data.norm_name(it.get("display", it["name"]))] = it.get("set", "")
    out = []
    for it in pd2_data.load_items():
        if it["slot"] == "?" or it["code"] not in bases or it["code"] in QUEST_CODES:
            continue  # unique maps (t51...), the table's empty set row, quest items
        out.append({"kind": it["kind"], "name": it["name"], "code": it["code"],
                    "set": set_of.get(pd2_data.norm_name(it["name"]), "") if it["kind"] == "SET" else ""})
    out += [{"kind": k, "name": n, "code": c, "set": ""} for k, n, c in EXTRA_ITEMS]
    return out


# ---------------------------------------------------------------- the filter's rules

class Rule:
    __slots__ = ("n", "where", "cond", "rpn", "words", "codes", "raw", "name", "cont", "notify", "sound", "tier",
                 "icons", "look")


def compile_rpn(cond):
    """BH ProcessConditions (as explain_item.evaluate): the condition in postfix, or None if malformed."""
    out, ops = [], []
    for t in L.bh_tokens(cond):
        if t in ("AND", "OR"):
            while ops and ops[-1] in ("!", "AND", "OR"):
                out.append(ops.pop())
            ops.append(t)
        elif t in ("!", "("):
            ops.append(t)
        elif t == ")":
            while ops and ops[-1] != "(":
                out.append(ops.pop())
            if not ops:
                return None
            ops.pop()
        else:
            out.append(("w", t))
    while ops:
        t = ops.pop()
        if t == "(":
            return None
        out.append(t)
    return out


def fold(rpn, atom):
    """The condition with every word `atom` knows (1 / 0 / MAYBE) folded in: a tree of ("c", value), ("w", word),
    ("not", x), ("and", a, b), ("or", a, b). BH's 3-valued AND = min, OR = max (explain_item.evaluate)."""
    if rpn is None:
        return ("c", 0)
    if not rpn:
        return ("c", 1)
    stack = []
    for t in rpn:
        if isinstance(t, tuple):
            v = atom(t[1])
            stack.append(("c", v) if v is not None else ("w", t[1]))
        elif t == "!":
            if not stack:
                return ("c", 0)
            a = stack.pop()
            stack.append(("c", 1 - a[1]) if a[0] == "c" else a[1] if a[0] == "not" else ("not", a))
        else:
            if len(stack) < 2:
                return ("c", 0)
            b, a = stack.pop(), stack.pop()
            stack.append(combine(t, a, b))
    return stack[0] if len(stack) == 1 else ("c", 0)


def combine(op, a, b):
    ca, cb = a[0] == "c", b[0] == "c"
    absorb, neutral = (0, 1) if op == "AND" else (1, 0)
    if (ca and a[1] == absorb) or (cb and b[1] == absorb):
        return ("c", absorb)
    if ca and cb:
        return ("c", min(a[1], b[1]) if op == "AND" else max(a[1], b[1]))
    if ca and a[1] == neutral:
        return b
    if cb and b[1] == neutral:
        return a
    return ("and" if op == "AND" else "or", a, b)


def tree_words(node, out):
    if node[0] == "w":
        out.add(node[1])
    elif node[0] != "c":
        for x in node[1:]:
            tree_words(x, out)
    return out


def tree_source(node, slot):
    k = node[0]
    if k == "c":
        return repr(node[1])
    if k == "w":
        return f"V[{slot[node[1]]}]"
    if k == "not":
        return f"(1-{tree_source(node[1], slot)})"
    a, b = tree_source(node[1], slot), tree_source(node[2], slot)
    return f"min({a},{b})" if k == "and" else f"max({a},{b})"


def expand_condition(cond, aliases):
    """BH: each alias name is replaced wherever it occurs in a condition, in definition order."""
    for name, value in aliases.items():
        for _ in range(100):
            if name not in cond:
                break
            cond = cond.replace(name, value, 1)
    return cond


def parse_output(raw, aliases):
    """(name text, continues, notifies, sound, tier, icon layer) of a rule's output, parsed as BH does."""
    out = L.expand_output_aliases(raw, aliases)
    icon, tier, sound, notifies = {}, None, 0, False
    for key in ("BORDER", "MAP", "DOT", "PX", "LINE", "NOTIFY", "TIER", "SOUNDID"):
        m = re.search(L.NOTIFY_PATTERNS[key], out, re.I)
        if not m:
            continue
        value = m.group(0)[len(key) + 2:-1]
        if key == "TIER":
            tier = int(value)
        elif key == "SOUNDID":
            sound = int(value)
        elif key in ("BORDER", "MAP", "DOT", "PX"):
            icon[key] = value.upper().zfill(2)
            notifies = True
        elif key == "LINE":
            notifies = True
        out = out[:m.start()] + out[m.end():]
    l, r = out.find("{"), out.find("}")
    if 0 <= l < r:
        out = out[:l] + out[r + 1:]
    if "%MAP%" in out:
        out = out.replace("%MAP%", "", 1)
        icon.setdefault("MAP", "20")
        notifies = True
    continues = "%CONTINUE%" in out
    name = out.replace("%CONTINUE%", "", 1)
    layer = tuple(icon.get(k) for k in ("BORDER", "MAP", "DOT", "PX")) if icon else None
    return name, continues, notifies or sound > 0, sound, tier, layer


def look_of(raw, name):
    """The look a stopping rule gives: the alias its output uses, else what it shows."""
    m = LOOK_ALIAS_RE.search(raw)
    if m and m.group(1) in LOOKS:
        return m.group(1)
    if "%SET_LEFT%" in raw:
        return "SET"
    if "%FACET_LEFT%" in raw:
        return "FACET"
    if "%UNI_DCLONE_RATHMA%" in raw:
        return "UNI_DCLONE_RATHMA"
    if "%SUR_BER_JAH_CHAM_ZOD_BIG_GG%" in raw:
        return "BIG_GG"
    if "LLD" in raw:
        return "LLD_TAG"
    used, _, literal = L.replacements(name.strip())
    if not literal.strip() and all(u in L.BH_COLORS for u in used):
        return "HIDDEN"
    return "NAME" if not literal.replace("%", "").strip() else "DECORATED"


def load_filter():
    """(rules, {variant: {toggle: 0/1}}): the rules with the variant toggles left in as condition words."""
    parts, _ = build.read_sections(check=True)
    where = build.line_locator(parts)
    _, season, date = build.load_version()
    joined = b"".join(d for _, d in parts).replace(build.PLACEHOLDER, build.version_text(season, date).encode())
    lines = joined.split(b"\r\n")
    blocks = build.find_toggle_blocks(lines)
    variants = {}
    for name, idxs in blocks.items():
        variants[name] = {}
        for i in idxs:
            m = build.ALIAS_RE.match(lines[i])
            variants[name][m.group(3).decode()] = int(m.group(2).endswith(b"TRUE"))
    off = {i for idxs in blocks.values() for i in idxs}
    text = [("//" if i in off and not line.startswith(b"//") else "") + line.decode("utf-8")
            for i, line in enumerate(lines)]
    lt = L.Linter(text, where, False)
    rules = []
    for n, r in enumerate(lt.rules):
        rule = Rule()
        rule.n, rule.where = n, where(r.idx)
        rule.cond = expand_condition(r.cond, lt.aliases)
        rule.rpn = compile_rpn(rule.cond)
        rule.words = {t[1] for t in rule.rpn or [] if isinstance(t, tuple)}
        rule.codes = {w for w in rule.words if is_code(w) and not COMPARE_RE.match(w)}
        rule.raw = r.output
        rule.name, rule.cont, rule.notify, rule.sound, rule.tier, rule.icons = parse_output(r.output, lt.aliases)
        rule.look = None if rule.cont else look_of(r.output, rule.name)
        rules.append(rule)
    return rules, variants


def is_code(word):
    """BH reads a word as an item code when its first three characters have no capital (explain_item.atom)."""
    return len(word) >= 3 and word[0] != "$" and word[:3] == word[:3].lower()


def kind_atom(kind):
    """The words every unidentified item of this quality on the ground has the same value for (1 / 0 / MAYBE);
    None for those that depend on the base (item codes, item groups) or the scenario."""
    def atom(word):
        if word in QUALITIES:
            return int(word == kind)
        if word in ("TRUE", "FALSE"):
            return int(word == "TRUE")
        if word in ("ID", "INF", "SUP", "RW", "GEMMED"):
            return 0
        if word == "GROUND":
            return 1
        if word in OTHER_PLACES:
            return 0
        if word in TOGGLES or word in CLASSES or word in ("ETH", "ALLDISCOVERED", "ANYDISCOVERED"):
            return None
        if word in GROUP_WORDS or word in TIER_GROUP.values():
            return None
        m = COMPARE_RE.match(word)
        if m:
            key = m.group(1)
            if key in ("FILTLVL", "CLVL", "MAPID"):
                return None
            if key == "MAPTIER":
                return compare(-1, m)  # BH: -1 for anything but a map
            if key in ("RUNE", "GEMLEVEL", "GEMTYPE", "GOLD"):
                return 0
            return MAYBE
        if is_code(word):
            return None
        return MAYBE
    return atom


def fold_tree(node, atom):
    """fold() for a condition already folded once: fills in the words `atom` knows."""
    k = node[0]
    if k == "c":
        return node
    if k == "w":
        v = atom(node[1])
        return ("c", v) if v is not None else node
    if k == "not":
        a = fold_tree(node[1], atom)
        return ("c", 1 - a[1]) if a[0] == "c" else ("not", a)
    op = "AND" if k == "and" else "OR"
    a = fold_tree(node[1], atom)
    if a[0] == "c" and a[1] == (0 if op == "AND" else 1):
        return a
    return combine(op, a, fold_tree(node[2], atom))


def index_rules(rules):
    """{kind: (rules any item of that kind may match, {code: rules that need that code}, {rule number: its
    condition folded for that kind})}."""
    out = {}
    no_code = lambda w: 0 if is_code(w) and not COMPARE_RE.match(w) else None  # noqa: E731
    for kind in ("UNI", "SET"):
        generic, by_code, folded = [], defaultdict(list), {}
        for r in rules:
            tree = fold(r.rpn, kind_atom(kind))
            if tree == ("c", 0):
                continue
            folded[r.n] = tree
            if fold_tree(tree, no_code) == ("c", 0):
                for w in r.codes:
                    by_code[w].append(r)
            else:
                generic.append(r)
        out[kind] = (generic, by_code, folded)
    return out


# ---------------------------------------------------------------- one base: every scenario

def compare(x, m):
    a, b = int(m.group(3)), m.group(4)
    hi = int(b) if b is not None else a
    return int({"=": x == a, "<": x < a, ">": x > a, "~": a <= x <= hi}[m.group(2)])


GENERIC_FOLDS = {}  # (kind, item groups) -> {rule number: folded condition} for rules that name no item code


class Group:
    """All items of one quality on one base: the filter sees them as one item until they are identified."""

    def __init__(self, kind, code, items, base, index):
        self.kind, self.code, self.items, self.base = kind, code, items, base
        types = set(base["types"]) if base else set()
        self.groups = item_groups(types)
        if base and base["tier"] in TIER_GROUP:
            self.groups.add(TIER_GROUP[base["tier"]])
        self.category = category(base)
        self.maybe = []  # (rule, words) of stopping rules that depend on something no scenario sets
        generic, by_code, prefolded = index[kind]
        self.memo = {}
        # a rule that names no item code folds the same for every base of this kind with these item groups
        sig = (kind, frozenset(self.groups))
        if sig not in GENERIC_FOLDS:
            GENERIC_FOLDS[sig] = {r.n: fold_tree(prefolded[r.n], self.atom) for r in generic if not r.codes}
        folded = GENERIC_FOLDS[sig]
        cand = sorted({r.n: r for r in generic + by_code.get(code, [])}.items())
        self.rules, words = [], set()
        for n, r in cand:
            tree = folded[n] if n in folded else fold_tree(prefolded[n], self.atom)
            if tree == ("c", 0):
                continue
            self.rules.append([r, tree])
            words |= tree_words(tree, set())
        self.words = sorted(words)
        slot = {w: i for i, w in enumerate(self.words)}
        for entry in self.rules:
            entry.append(eval("lambda V: " + tree_source(entry[1], slot)))  # noqa: S307 (our own expression)
        # the scenario dimensions: only what the display's stopping rules and the notifications test
        outcome_words = set()
        for r, tree, _ in self.rules:
            if not r.cont or r.notify:
                outcome_words |= tree_words(tree, set())
        self.dims = Dims(outcome_words)
        self.label_dims = Dims(words)

    def atom(self, word):
        """1 / 0 / MAYBE for a word the scenario does not change, None for one it does."""
        if word not in self.memo:
            self.memo[word] = self._atom(word)
        return self.memo[word]

    def _atom(self, word):
        if word in TOGGLES or word in CLASSES or word in ("ETH", "ALLDISCOVERED", "ANYDISCOVERED"):
            return None
        if word in ("TRUE", "FALSE"):
            return int(word == "TRUE")
        if word in QUALITIES:
            return int(word == self.kind)
        if word == "GROUND":
            return 1
        if word in OTHER_PLACES:
            return 0
        if word in GROUP_WORDS or word in TIER_GROUP.values():
            return int(word in self.groups)
        if word in ("ID", "INF", "SUP", "RW", "GEMMED"):
            return 0
        m = COMPARE_RE.match(word)
        if m:
            key = m.group(1)
            if key in ("FILTLVL", "CLVL", "MAPID"):
                return None
            if key == "MAPTIER":
                return compare(-1, m)  # BH: -1 for anything but a map
            if key in ("RUNE", "GEMLEVEL", "GEMTYPE", "GOLD"):
                return 0
            return MAYBE
        if is_code(word):
            return int(word == self.code)
        return MAYBE

    def values(self, a):
        """V for a full assignment {dim: value}."""
        out = []
        for w in self.words:
            if w in TOGGLES:
                out.append(a[w])
            elif w == "ETH":
                out.append(a["ETH"])
            elif w in CLASSES:
                out.append(int(a["CLASS"] == w))
            elif w in ("ALLDISCOVERED", "ANYDISCOVERED"):
                out.append(int(a["GRAIL"] == "found"))
            else:
                m = COMPARE_RE.match(w)
                key = m.group(1)
                if key == "FILTLVL":
                    out.append(compare(a["FILTLVL"], m))
                elif key == "CLVL":
                    out.append(compare(a["CLVL"], m))
                else:
                    loc = a["LOC"]
                    out.append(compare(FIELD_ID if loc == "field" else 1 if loc == "town" else loc, m))
        return out

    def run(self, a):
        """(look, chat, sound, icon layers) and the display rules that matched, for one assignment."""
        V = self.values(a)
        look, chain = None, []
        for r, _, fn in self.rules:
            v = fn(V)
            if not v:
                continue
            if v == MAYBE:
                if not r.cont:
                    self.maybe.append(r)
                continue
            if r.notify and r.name.strip() == "%NAME%" and r.cont:
                continue  # a sound line: changes nothing in the name
            chain.append(r)
            if not r.cont:
                look = r.look
                break
        level = a["FILTLVL"]
        chat, sound, icons = False, 0, []
        for r, _, fn in self.rules:
            if not r.notify or fn(V) != 1:
                continue
            if not chat and (r.tier is None or level == 0 or r.tier >= level):
                chat, sound = True, r.sound
            if r.icons:
                icons.append(r.icons)
            if not r.cont:
                break
        return (look or "NAME", chat, sound, tuple(icons)), chain


class Dims:
    """The scenario dimensions some rules test, each with its values (the others get one fixed value)."""

    def __init__(self, words):
        self.values = {t: ([0, 1] if t in words else [0]) for t in TOGGLES}
        self.values["ETH"] = [0, 1] if "ETH" in words else [0]
        self.values["CLASS"] = CLASSES if words & set(CLASSES) else [None]
        cuts, ids, mapid = set(), set(), False
        for w in words:
            m = COMPARE_RE.match(w)
            if not m:
                continue
            a, b, op = int(m.group(3)), m.group(4), m.group(2)
            if m.group(1) == "CLVL":
                cuts |= {a} if op == "<" else {a + 1} if op == ">" else {a, a + 1} if op == "=" else {a, int(b) + 1}
            elif m.group(1) == "MAPID":
                mapid = True
                if op == "=" and a not in TOWN_IDS:
                    ids.add(a)
        cuts = sorted(c for c in cuts if 1 < c <= 99)
        self.values["CLVL"] = ([1] + cuts) if cuts else [99]
        self.values["LOC"] = (["field", "town"] + sorted(ids)) if mapid else ["field"]
        self.values["GRAIL"] = ["found", "new"] if words & {"ALLDISCOVERED", "ANYDISCOVERED"} else ["found"]
        self.values["FILTLVL"] = list(range(13))
        self.index = {d: i for i, d in enumerate(DIMS)}

    def clvl_range(self, v):
        vs = self.values["CLVL"]
        i = vs.index(v)
        return v, (vs[i + 1] - 1 if i + 1 < len(vs) else 99)

    def scenarios(self):
        out = [()]
        for d in DIMS:
            out = [s + (v,) for s in out for v in self.values[d]]
        return out


def analyse_group(g):
    """{scenario: outcome} over the group's dimensions (toggles at their values in the scenario)."""
    table = {}
    for sc in g.dims.scenarios():
        table[sc] = g.run(dict(zip(DIMS, sc)))[0]
    g.table = table
    return table


def label(g, sc, toggles):
    """The name as the game draws it in a scenario and variant: lines (top first) of [color, text]."""
    a = dict(zip(DIMS, sc))
    a.update(toggles)
    for d in DIMS:  # a dimension only the label's layers test: its first value (Not ethereal...)
        a.setdefault(d, g.label_dims.values[d][0])
    _, chain = g.run(a)
    base = g.base["name"] if g.base else g.code
    name = base
    for r in chain:
        name = r.name.replace("%NAME%", name)
    name = name.replace("%BASENAME%", base)
    color = "GOLD" if g.kind == "UNI" else "GREEN"
    lines = []
    for part in name.split("%NL%"):
        segs, pos = [], 0
        for m in COLOR_RE.finditer(part):
            if m.start() > pos:
                segs.append([color, part[pos:m.start()]])
            color, pos = m.group(1), m.end()
        if pos < len(part):
            segs.append([color, part[pos:]])
        lines.append([[c, t.replace("%PERCENT%", "%")] for c, t in segs if t])
    return list(reversed(lines))  # BH: the first line of the text is the bottom line on screen


# ---------------------------------------------------------------- plain words

BH_NAME_MAX = 56  # BH shows at most 56 characters of a name: color codes not counted, line breaks counted
USUAL = {}  # look -> (icon size, chat line): the notification the look usually has (usual_notifications)
USUAL_SOUND = {}  # look -> True when most items with that look have their own drop sound


def notify_class(key):
    """(icon size: large / small / none, chat line) of an outcome."""
    _, chat, _, icons = key
    return ("large" if any(layer[0] for layer in icons) else "small" if icons else "none"), chat


def alert_words(size, chat, long=False):
    if size == "none":
        return ("chat notification only" if long else "chat only") if chat else "no notification"
    icon = {"large": "large minimap icon" if long else "large icon", "small": "minimap icon" if long else "icon"}[size]
    if chat:
        return f"{icon}, chat notification" if long else f"{icon}, chat"
    return f"{icon} only"


def sound_text(sound, sounds):
    return f"sound: {sounds.get(sound, {}).get('name', sound)}, .playsound {sound}"


def look_phrase(key, sounds=None):
    """'High value' when the look has its usual notification, else the look and what differs ('standard set look
    (icon only)'). With `sounds` (the Markdown), the drop sound too."""
    look, _, sound, _ = key
    cls = notify_class(key)
    details = []
    if look == "HIDDEN":
        name = "hidden"
        if cls != ("none", False):
            details.append(alert_words(*cls))
    else:
        name = LOOKS[look][0]
        if USUAL.get(look) != cls:
            details.append(alert_words(*cls))
    if sounds is not None and sound:
        details.append(sound_text(sound, sounds))
    return f"{name} ({'; '.join(details)})" if details else name


def usual_notifications(groups, variants):
    """Each look's usual notification (when one clearly dominates) and sound, from every item's outcomes anywhere
    but town, in any variant (each item's outcome counted once)."""
    seen, sound = defaultdict(Counter), defaultdict(Counter)
    for g in groups:
        keys = set()
        for toggles in variants.values():
            keys |= set(restrict(variant_table(g, toggles), g.dims, {"LOC": "field", "GRAIL": "found"}).values())
        for key in keys:
            seen[key[0]][notify_class(key)] += 1
            sound[key[0]][bool(key[2])] += 1
    USUAL.clear()
    USUAL_SOUND.clear()
    for look, counts in seen.items():
        (top, n), *rest = counts.most_common()
        if not rest or n >= 2 * rest[0][1]:
            USUAL[look] = top
        USUAL_SOUND[look] = sound[look][True] > sound[look][False]


def look_info():
    """What each look means, for the page's legend and the Markdown's "How to read it"."""
    return {look: {"name": "hidden" if look == "HIDDEN" else name, "rank": rank, "tier": tier,
                   "usual": alert_words(*USUAL[look], long=True) if look in USUAL else None,
                   "sound": USUAL_SOUND.get(look, False)}
            for look, (name, rank, tier) in LOOKS.items() if look in USUAL_SOUND}  # the looks some item gets


def level_runs(levels):
    """[0, 1, 2, 5, 6] -> 'levels 0–2, 5–6'."""
    out, start = [], None
    for i, x in enumerate(levels):
        start = x if start is None else start
        if i + 1 == len(levels) or levels[i + 1] != x + 1:
            out.append(f"{start}–{x}" if x != start else str(x))
            start = None
    return f"{'level' if len(levels) == 1 else 'levels'} {', '.join(out)}"


def clvl_label(dims, values):
    merged = []
    for lo, hi in sorted(dims.clvl_range(v) for v in values):
        if merged and merged[-1][1] + 1 == lo:
            merged[-1][1] = hi
        else:
            merged.append([lo, hi])
    parts = [f"below {hi + 1}" if lo <= 1 else f"{lo}+" if hi >= 99 else f"{lo}–{hi}" for lo, hi in merged]
    return "character level " + " or ".join(parts)


def class_label(values):
    if len(values) > len(CLASSES) / 2:
        rest = [c for c in CLASSES if c not in values]
        return "other classes" if len(rest) == 1 else "classes other than " + " and ".join(CLASS_NAMES[c] for c in rest)
    return " and ".join(CLASS_NAMES[c] for c in values)


def level_clauses(by_level):
    """[(levels text or None, outcome)] for {level: outcome}: None when one outcome covers all 13 levels."""
    merged = {}
    for lvl in sorted(by_level):
        merged.setdefault(by_level[lvl], []).append(lvl)
    if len(merged) == 1 and len(by_level) == 13:
        return [(None, next(iter(merged)))]
    return [(level_runs(merged[k]), k) for k in sorted(merged, key=lambda k: merged[k][0])]


def dim_label(dims, d, values):
    if d == "ETH":
        return "Ethereal" if list(values) == [1] else "Not ethereal"
    if d == "CLASS":
        return class_label(sorted(values, key=CLASSES.index))
    return clvl_label(dims, values)


def split(table, dims, order):
    """Clauses for a table, split by the dimensions in `order` (each only where it changes the outcome)."""
    for n, d in enumerate(order):
        i = dims.index[d]
        values = sorted({sc[i] for sc in table}, key=dims.values[d].index)
        subs = {v: {sc[:i] + sc[i + 1:]: k for sc, k in table.items() if sc[i] == v} for v in values}
        if len(values) < 2 or all(subs[v] == subs[values[0]] for v in values):
            continue  # this dimension changes nothing here
        groups = []
        for v in values:
            for grp in groups:
                if subs[grp[0]] == subs[v]:
                    grp.append(v)
                    break
            else:
                groups.append([v])
        out = []
        for grp in groups:
            sub = {sc: k for sc, k in table.items() if sc[i] in grp}
            for conds, levels in split(sub, dims, order[n + 1:]):
                out.append(([dim_label(dims, d, grp)] + conds, levels))
        return out
    li = dims.index["FILTLVL"]
    by_level = {}
    for sc, k in table.items():
        by_level.setdefault(sc[li], k)
    return [([], level_clauses(by_level))]


def exceptions(table, dims, split_dims, rank):
    """'X: A; otherwise: B' clauses when the cases that differ from the most common one are each a plain
    combination of values (Barbarians below character level 60), else None."""
    li = dims.index["FILTLVL"]
    rows = defaultdict(dict)
    for sc, k in table.items():
        rows[tuple(sc[dims.index[d]] for d in split_dims)][sc[li]] = k
    row = {c: tuple(sorted(r.items())) for c, r in rows.items()}
    count = Counter(row.values())
    if len(count) < 2:
        return None
    background = max(count, key=lambda r: (count[r], -max(rank(k) for _, k in r)))
    groups = defaultdict(list)
    for c, r in row.items():
        if r != background:
            groups[r].append(c)
    out = []
    for r, coords in sorted(groups.items(), key=lambda x: -max(rank(k) for _, k in x[0])):
        sets = [sorted({c[j] for c in coords}, key=dims.values[d].index) for j, d in enumerate(split_dims)]
        size = 1
        for x in sets:
            size *= len(x)
        if size != len(coords):
            return None  # not a plain combination of values
        conds = [dim_label(dims, d, sets[j]) for j, d in enumerate(split_dims)
                 if len(sets[j]) < len({c[j] for c in row})]
        out.append((conds, level_clauses(dict(r))))
    out.append((["Otherwise"], level_clauses(dict(background))))
    return out


def describe(table, dims, rank=lambda k: 0, text=str):
    """The shortest exact description of a {scenario: outcome} table: [(conditions, [(levels, outcome)])].
    `text(outcome)` is how an outcome reads, to compare the options' lengths."""
    split_dims = [d for d in ("ETH", "CLASS", "CLVL") if len({sc[dims.index[d]] for sc in table}) > 1]
    options = [split(table, dims, list(order)) for order in permutations(split_dims)]
    exc = exceptions(table, dims, split_dims, rank) if split_dims else None
    if exc:
        options.append(exc)

    def cost(clauses):
        return len(clauses), sum(len(", ".join(c)) + sum(len(lv or "") + len(text(k)) for lv, k in runs)
                                 for c, runs in clauses)
    return min(options, key=cost)


def clause_text(clause, phrase=lambda k: k, lead=""):
    """'Barbarians, character level below 60: Minimal value'; one level run joins the lead."""
    conds, levels = clause
    levels = [(lv, phrase(k)) for lv, k in levels]
    head = ", ".join(([lead] if lead else []) + conds)
    if len(levels) == 1 and levels[0][0] and head:
        head, levels = f"{head}, {levels[0][0]}", [(None, levels[0][1])]
    body = "; ".join(f"{lv}: {ph}" if lv else ph for lv, ph in levels)
    return f"{head[0].upper() + head[1:]}: {body}" if head else body[0].upper() + body[1:]


def restrict(table, dims, fixed):
    idx = [(dims.index[d], v) for d, v in fixed.items()]
    return {sc: k for sc, k in table.items() if all(sc[i] == v for i, v in idx)}


def variant_table(g, toggles):
    fixed = {t: toggles[t] for t in TOGGLES if len(g.dims.values[t]) > 1}
    return restrict(g.table, g.dims, fixed)


def delta_phrase(main, alt, sounds):
    """What a place or grail state changes: just the sound, or the whole outcome."""
    if main[:2] == alt[:2] and main[3] == alt[3] and main[2] != alt[2]:
        return sound_text(alt[2], sounds) if alt[2] else "no sound"
    return look_phrase(alt)


def bh_cut(lines):
    """How many characters BH cuts from a label (lines top first): over 56, counted with the line breaks."""
    total = sum(len(t) for line in lines for _, t in line) + max(0, len(lines) - 1)
    return max(0, total - BH_NAME_MAX)


def item_view(g, toggles, sounds):
    """One item in one variant: its clauses (each run pointing at one of its outcomes), notes for what town, a
    special area or a new grail item change, its outcomes (phrase, label, BH cut, icons, sound) and its lines as
    text (to compare variants and group the items in no tier)."""
    dims = g.dims
    table = variant_table(g, toggles)
    main = restrict(table, dims, {"LOC": "field", "GRAIL": "found"})
    raw = describe(main, dims, lambda k: LOOKS[k[0]][1], look_phrase)
    keys = []
    for _, runs in raw:
        for _, k in runs:
            if k not in keys:
                keys.append(k)
    first = {}
    ei, fi = dims.index["ETH"], dims.index["FILTLVL"]
    for sc in sorted(main, key=lambda s: (s[ei], s[fi])):
        first.setdefault(main[sc], sc)  # the label of a run: not ethereal where it can be, its lowest level
    outcomes = []
    for k in keys:
        look, _, sound, icons = k
        lines = label(g, first[k], toggles)
        outcomes.append({"look": look, "phrase": look_phrase(k), "label": lines, "cut": bh_cut(lines),
                         "icons": [list(layer) for layer in icons],
                         "sound": [sound, sounds.get(sound, {}).get("name", ""), sounds.get(sound, {}).get("file", "")]
                         if sound else None})
    contexts = [({"LOC": loc, "GRAIL": "found"},
                 "in town" if loc == "town" else f"in {AREA_NAMES.get(loc, f'area {loc}')}")
                for loc in dims.values["LOC"] if loc != "field"]
    if "new" in dims.values["GRAIL"]:
        contexts.append(({"LOC": "field", "GRAIL": "new"}, "before you've discovered it"))
    li, gi = dims.index["LOC"], dims.index["GRAIL"]
    by_text = {}
    for fixed, where in contexts:
        diff, hidden = {}, True
        for sc, k in restrict(table, dims, fixed).items():
            m = main[sc[:li] + ("field",) + sc[li + 1:gi] + ("found",) + sc[gi + 1:]]
            if m != k:
                diff[sc] = delta_phrase(m, k, sounds)
                hidden &= m[0] == "HIDDEN" and not m[3]
        if not diff:
            continue
        if hidden and len(set(diff.values())) == 1:  # it only changes where the item would be hidden
            key = ("hidden", next(iter(diff.values())))
        else:
            key = ("cases", json.dumps(describe(diff, dims)))
        by_text.setdefault(key, []).append(where)
    notes = []
    for (kind, text), wheres in by_text.items():
        if kind == "hidden":  # "Not hidden in town, or before you've discovered it: shows its name instead"
            shows = "shows its name instead" if text == "name only" else f"shows as {text} instead"
            notes.append(f"Not hidden {', or '.join(wheres)}: {shows}")
        else:
            notes += [clause_text(c, lead=" or ".join(wheres)) for c in json.loads(text)]
    return {"clauses": [{"cond": ", ".join(conds), "runs": [[lv, keys.index(k)] for lv, k in runs]}
                        for conds, runs in raw],
            "notes": notes, "outcomes": outcomes,
            "lines": [clause_text(c, look_phrase) for c in raw]}


# ---------------------------------------------------------------- everything

def analyse():
    bases = load_bases()
    rules, variants = load_filter()
    index = index_rules(rules)
    by_base = defaultdict(list)
    for it in load_items(bases):
        by_base[(it["kind"], it["code"])].append(it)
    groups = []
    for (kind, code), its in by_base.items():
        g = Group(kind, code, its, bases.get(code), index)
        analyse_group(g)
        groups.append(g)
    return groups, rules, variants, bases


def tier_of(g, toggles):
    """(tier group, look) of the highest look the item gets anywhere but in town, in one variant."""
    table = restrict(variant_table(g, toggles), g.dims, {"LOC": "field"})
    best = max((k[0] for k in table.values()), key=lambda lk: LOOKS[lk][1])
    return LOOKS[best][2], best


def display_name(g):
    names = [it["name"] for it in g.items]
    return " / ".join(names) if len(names) <= 4 else f"{', '.join(names[:3])} and {len(names) - 3} more"


def findings(groups, rules, bases):
    """Rules and game data that disagree, as text lines."""
    out = []
    by_kind, names = defaultdict(set), defaultdict(list)
    for g in groups:
        by_kind[g.kind].add(g.code)
        names[(g.kind, g.code)] += [it["name"] for it in g.items]
    seen = set()
    for r in rules:  # a tier rule on a base that no item of its kind drops as
        if not r.where.startswith(TIER_SECTIONS) or "!ID" not in r.cond:
            continue
        kinds = [k for k in ("UNI", "SET") if k in r.words]
        if len(kinds) != 1:
            continue
        for c in sorted(w for w in r.words if w in bases and w not in by_kind[kinds[0]]):
            if (r.where, c) not in seen:
                seen.add((r.where, c))
                out.append(f"{r.where}: {c} ({bases[c]['name']}): no {'unique' if kinds[0] == 'UNI' else 'set'} "
                           "item drops as this base")
    norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower().replace("’", "'"))  # noqa: E731
    rule_re = re.compile(r"^ItemDisplay\[(UNI|SET) !ID (?:ETH )?([a-z0-9]{3,4})\b[^\]]*\]:[^/]*%CONTINUE%//\s*(.+)$")
    for path in sorted((ROOT / "sections").glob("*.filter")):
        if not f"sections/{path.name}".startswith(TIER_SECTIONS):
            continue
        for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            m = rule_re.match(line)
            if not m:
                continue
            kind, code, comment = m.groups()
            on_base = names.get((kind, code), [])
            if not any(norm(nm) in norm(comment) or norm(re.sub(r"^The ", "", nm)) in norm(comment)
                       for nm in on_base):
                have = ", ".join(on_base) or f"no {'unique' if kind == 'UNI' else 'set'} item"
                out.append(f"sections/{path.name}:{n}: the comment names \"{comment.strip()}\", but {code} "
                           f"({bases.get(code, {}).get('name', '?')}) drops as {have}")
    maybe = defaultdict(set)
    for g in groups:  # a stopping rule that depends on something the scenarios do not set
        for r in g.maybe:
            maybe[r.where].add(g.items[0]["name"])
    for where, its in sorted(maybe.items()):
        out.append(f"{where}: depends on a condition the tier map does not model, for "
                   f"{', '.join(sorted(its)[:5])}{'...' if len(its) > 5 else ''}")
    for g in groups:
        if g.category == "Other":
            out.append(f"{g.code} ({display_name(g)}): no item type category (TYPE_CATEGORY)")
    return out


def variant_label(names, variants):
    """'BIG GG versions', 'PoE versions (not BIG GG)'... for a set of variant names, else the names."""
    names = set(names)
    for size in (1, 2):
        for combo in permutations(TOGGLES, size):
            if list(combo) != sorted(combo):
                continue
            for vals in ([(1,), (0,)] if size == 1 else [(1, 1), (1, 0), (0, 1), (0, 0)]):
                match = {n for n, tg in variants.items() if all(tg[t] == v for t, v in zip(combo, vals))}
                if match != names:
                    continue
                on = [TOGGLE_NAMES[t] for t, v in zip(combo, vals) if v]
                off = [TOGGLE_NAMES[t] for t, v in zip(combo, vals) if not v]
                if not on:
                    return f"versions without {' or '.join(off)}"
                return " + ".join(on) + " versions" + (f" (not {' or '.join(off)})" if off else "")
    return ", ".join(sorted(names))


def build_data(groups, variants, sounds, palette):
    """(everything the page shows, the filter checks for labels BH cuts at 56 characters)."""
    vnames = list(variants)
    main = build.MAIN
    usual_notifications(groups, variants)
    views, view_ids = [], {}
    items = []
    too_long = defaultdict(list)  # (item, base, look, length) -> variants whose label BH cuts
    for g in sorted(groups, key=lambda g: (CATEGORY_ORDER.index(g.category), g.kind, display_name(g))):
        per_variant = []
        base = g.base or {}
        for vn in vnames:
            tg = variants[vn]
            tier, look = tier_of(g, tg)
            view = {"tier": tier, "look": look, **item_view(g, tg, sounds)}
            for o in view["outcomes"]:
                if o["cut"]:
                    too_long[(display_name(g), base.get("name", g.code), LOOKS[o["look"]][0],
                              BH_NAME_MAX + o["cut"])].append(vn)
            key = json.dumps(view, sort_keys=True, ensure_ascii=False)
            if key not in view_ids:
                view_ids[key] = len(views)
                views.append(view)
            per_variant.append(view_ids[key])
        items.append({"kind": g.kind, "code": g.code, "base": base.get("name", g.code),
                      "baseTier": TIER_NAMES.get(base.get("tier"), ""), "category": g.category,
                      "items": [{"name": n, "set": s} for n, s in dict.fromkeys((it["name"], it["set"]) for it in g.items)],
                      "v": per_variant})  # a name the game table lists twice (Cyclopean Roar) once
    checks = [f"{variant_label(vns, variants)}: {names} ({base_name}): the {look} label is {length} characters; BH "
              f"shows {BH_NAME_MAX} and cuts the last {length - BH_NAME_MAX}"
              for (names, base_name, look, length), vns in too_long.items()]
    _, season, date = build.load_version()
    return {"version": build.version_text(season, date), "levels": load_levels(), "variants": vnames, "main": main,
            "palette": palette, "views": views, "items": items, "tierGroups": TIER_GROUPS,
            "lookInfo": look_info(), "nameMax": BH_NAME_MAX,
            "categories": [c for c in CATEGORY_ORDER if any(it["category"] == c for it in items)]}, checks


# ---------------------------------------------------------------- the page

DOC_HEAD = ("<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
            "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
            "<style>html { color-scheme: dark; } body { margin: 0; background: #151412; }"  # the tier map's dark --bg
            " [hidden] { display: none !important; }</style>\n")
# (no </head><body>: the template's <title>, <link> and <style> join the head; its first element opens the body)


def page_text(data):
    """The page: the template as a full HTML document with the data embedded."""
    page = DOC_HEAD + TEMPLATE.read_text(encoding="utf-8") + "\n</body>\n</html>\n"
    return page.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")))


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Unique and set value tiers, from the filter's own rules.")
    ap.add_argument("--check", action="store_true", help=f"exit 1 if {PAGE.name} is out of date")
    ap.add_argument("--findings", action="store_true", help="list rules and game data that disagree")
    args = ap.parse_args()
    groups, rules, variants, bases = analyse()
    data, too_long = build_data(groups, variants, load_sounds(), load_palette())
    text = page_text(data)
    current = PAGE.read_text(encoding="utf-8") if PAGE.exists() else ""
    if args.check:
        if current != text:
            print(f"{PAGE.name} is out of date: run python tools/tier_map.py (build.bat does)")
            sys.exit(1)
        print("unique/set tier map up to date")
        return
    if current != text:
        PAGE.write_text(text, encoding="utf-8", newline="\n")
        print(f"updated {PAGE.name}")
    checks = findings(groups, rules, bases) + too_long
    if args.findings:
        for line in checks:
            print(line)
    print(f"tier map: {len(checks)} filter check(s)" + (": python tools/tier_map.py --findings lists them"
                                                         if checks and not args.findings else ""))


if __name__ == "__main__":
    main()
