#!/usr/bin/env python3
"""
Tags of low-level rares: below affix level 60 (BH's ALVL) a rare or crafted item tags every roll of the stats the
author picks per item type, in 300-affix-tags' looks; from 60 up nothing changes (the author, 2026-10-28). The author
picks on a page:

    python tools/low_level_tags.py            write sections/290-low-level-rare-tags.filter from the picks (the hook and
                                              build.bat run this)
    python tools/low_level_tags.py --check    exit 1 if the section is not what the picks make, or 300 asks an alias the
                                              section lacks (CI)
    python tools/low_level_tags.py --page     write tools/low_level_tags.html (gitignored): per item type, every stat a
                                              rare can roll below affix level 60, what the filter tags today and the
                                              author's choice; published as a claude.ai page whose db holds the choices
    python tools/low_level_tags.py --apply FILE   take the page's db documents ({"<item type>": {"stats": {...}}})
                                              into tools/low_level_tag_picks.json, then write the section
    python tools/low_level_tags.py --verify   check the built rules: a picked stat tags every roll below affix level
                                              60 once, nothing else changes, and measure the longest labels

The section holds one alias per stat 300 is wired to, LOWLVL_<X>_TAG = (RARE OR CRAFT) ALVL<60 and the picked item
types; 300's lines ask it (a line with a threshold also takes every roll; an item type no rare line of the stat covers
gets a type group or a line of its own, never one another rare line of the stat covers).

A row of the page is a stat, as BH tags a stat (several affixes can add up to it), with the affixes that give it: the
MagicPrefix / MagicSuffix rows of docs/pd2-magic-affixes.tsv a rare can get (spawnable, version and rare flag not 0,
frequency above 0, level 59 or lower, an item type of the base and none it excludes). What the filter tags today comes
from its own rules (tools/label_cuts.py's engine, the lines of 300-affix-tags): an identified rare of the kind's first
base on the ground, affix level 59, seen by a level 50 character, with one affix at its lowest and at its highest roll.
"""
import argparse
import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import label_cuts as LC  # noqa: E402

E, L, T = LC.E, LC.L, LC.T
ROOT = LC.ROOT
TEMPLATE = ROOT / "tools" / "low_level_tags_template.html"
PAGE = ROOT / "tools" / "low_level_tags.html"
AFFIXES = ROOT / "docs" / "pd2-magic-affixes.tsv"
TAGS_300 = ROOT / "sections" / "300-affix-tags.filter"
SECTION = ROOT / "sections" / "290-low-level-rare-tags.filter"
PICKS = ROOT / "tools" / "low_level_tag_picks.json"
PAGE_URL = "https://claude.ai/artifact/UR9CFPmG4j88WvLN1HtwNu"
CUT = 60  # below this affix level a picked stat tags every roll
BANDS = (19, 39, 59)  # the page's roll columns: the best roll up to these affix levels
VIEWER = 50  # the character level the page's "today" assumes (a few 300 lines ask CLVL<80)
RARE_NAME = "Rare Name"  # the top line of a sample label (only the tag line is measured)

# The page's item types: key, name, the BH condition of its bases, which bases (BH group words, base code)
NOT_MELEE = {"BOW", "XBOW", "THROWING", "JAV", "STAFF", "WAND", "SOR"}
CARDS = [
    ("helm", "Helms", "HELM", lambda g, c: "HELM" in g),
    ("circ", "Circlets", "CIRC", lambda g, c: "CIRC" in g),
    ("chest", "Body armor", "CHEST", lambda g, c: "CHEST" in g),
    ("shield", "Shields", "SHIELD", lambda g, c: "SHIELD" in g),
    ("gloves", "Gloves", "GLOVES", lambda g, c: "GLOVES" in g),
    ("boots", "Boots", "BOOTS", lambda g, c: "BOOTS" in g),
    ("belt", "Belts", "BELT", lambda g, c: "BELT" in g),
    ("ring", "Rings", "rin", lambda g, c: c == "rin"),
    ("amu", "Amulets", "amu", lambda g, c: c == "amu"),
    ("melee", "Melee weapons", "(WEAPON !BOW !XBOW !THROWING !JAV !STAFF !WAND !SOR)",
     lambda g, c: "WEAPON" in g and not g & NOT_MELEE),
    ("ranged", "Bows and crossbows", "(BOW OR XBOW)", lambda g, c: bool(g & {"BOW", "XBOW"})),
    ("throwing", "Throwing weapons", "(THROWING OR JAV)", lambda g, c: bool(g & {"THROWING", "JAV"})),
    ("caster", "Staves, wands and orbs", "(STAFF OR WAND OR SOR)", lambda g, c: bool(g & {"STAFF", "WAND", "SOR"})),
]
# a card's kinds: its bases by the group words 300's lines tell apart
KIND_WORDS = {"SWORD", "AXE", "CLUB", "TMACE", "HAMMER", "SCEPTER", "DAGGER", "SPEAR", "POLEARM", "JAV", "BOW", "XBOW",
              "STAFF", "WAND", "THROWING", "SIN", "SOR", "ZON", "BAR", "DRU", "DIN", "NEC"}
KIND_NAMES = {"SWORD": "Swords", "AXE": "Axes", "CLUB": "Clubs", "TMACE": "Maces", "HAMMER": "Hammers",
              "SCEPTER": "Scepters", "DAGGER": "Daggers", "SPEAR": "Spears", "POLEARM": "Polearms", "JAV": "Javelins",
              "BOW": "Bows", "XBOW": "Crossbows", "STAFF": "Staves", "WAND": "Wands", "SIN": "Claws", "SOR": "Orbs",
              "BAR": "Barbarian helms", "DRU": "Druid pelts", "DIN": "Paladin shields", "NEC": "Necromancer heads"}

# The page's rows: key, label, group, on by default (the author's answers of 2026-10-28). A row a kind already tags
# at every roll needs no choice there; a row without a look in 300 (LOOKS) is a request for one.
CATS = ["Life and mana", "Attributes", "Resistances", "Defense", "Speed", "Offense", "Elemental damage", "Skills",
        "Find and other"]
ROWS = [
    ("life", "Life", "Life and mana", True), ("life_lvl", "Life per level", "Life and mana", True),
    ("mana", "Mana", "Life and mana", True), ("mana_lvl", "Mana per level", "Life and mana", True),
    ("leech_life", "Life stolen per hit", "Life and mana", True),
    ("leech_mana", "Mana stolen per hit", "Life and mana", True),
    ("lpk", "Life after each kill", "Life and mana", True), ("mpk", "Mana after each kill", "Life and mana", True),
    ("regen", "Replenish life", "Life and mana", False), ("regen_mana", "Regenerate mana", "Life and mana", False),
    ("regen_stam", "Stamina regeneration", "Life and mana", False),
    ("dtm", "Damage taken goes to mana", "Life and mana", False),
    ("str", "Strength", "Attributes", True), ("dex", "Dexterity", "Attributes", True),
    ("enr", "Energy", "Attributes", True),
    ("res", "Single resistances", "Resistances", True), ("res_all", "All resistances", "Resistances", True),
    ("plr", "Poison length reduced", "Resistances", True),
    ("ed_def", "Enhanced defense", "Defense", False), ("def_lvl", "Defense per level", "Defense", False),
    ("pdr_flat", "Physical damage reduced by", "Defense", True), ("mdr", "Magic damage reduced by", "Defense", True),
    ("pdr", "Physical damage reduced %", "Defense", True), ("block", "Increased chance of blocking", "Defense", True),
    ("fbr", "Faster block rate", "Defense", True), ("thorns", "Attacker takes damage", "Defense", False),
    ("hfd", "Half freeze duration", "Defense", True), ("cbf", "Cannot be frozen", "Defense", True),
    ("fhr", "Faster hit recovery", "Speed", True), ("fcr", "Faster cast rate", "Speed", True),
    ("ias", "Increased attack speed", "Speed", True), ("frw", "Faster run/walk", "Speed", True),
    ("ed_dmg", "Enhanced damage", "Offense", True), ("min", "Minimum damage", "Offense", True),
    ("max", "Maximum damage", "Offense", True), ("ar", "Attack rating", "Offense", True),
    ("ar_pct", "Attack rating %", "Offense", True), ("ar_pct_lvl", "Attack rating % per level", "Offense", False),
    ("ds", "Deadly strike", "Offense", True), ("cb", "Crushing blow", "Offense", True),
    ("ow", "Open wounds (chance)", "Offense", True), ("owd", "Open wounds damage", "Offense", True),
    ("itd", "Ignore target's defense", "Offense", True), ("dmg_dem", "Damage to demons", "Offense", True),
    ("dmg_und", "Damage to undead", "Offense", True), ("ar_dem", "Attack rating against demons", "Offense", False),
    ("ar_und", "Attack rating against undead", "Offense", False),
    ("noheal", "Prevent monster heal", "Offense", False), ("knock", "Knockback", "Offense", False),
    ("fire_dmg", "Fire damage", "Elemental damage", False), ("cold_dmg", "Cold damage", "Elemental damage", False),
    ("ltng_dmg", "Lightning damage", "Elemental damage", False),
    ("pois_dmg", "Poison damage", "Elemental damage", False),
    ("skill_dmg", "Elemental skill damage %", "Skills", True), ("pierce", "Enemy resistance -%", "Skills", True),
    ("clsk", "Class skills", "Skills", True), ("tabsk", "Skill tabs", "Skills", True),
    ("ctc_hit", "Chance to cast on striking", "Skills", False),
    ("ctc_cast", "Chance to cast when casting", "Skills", False),
    ("ctc_struck", "Chance to cast when struck", "Skills", False), ("charges", "Charges", "Skills", False),
    ("ease", "Requirements -%", "Find and other", False), ("light", "Light radius", "Find and other", False),
    ("mf", "Magic find", "Find and other", False), ("gf", "Gold find", "Find and other", False),
    ("repair", "Repairs durability", "Find and other", True), ("sock", "Sockets", "Find and other", False),
]
ROW = {r[0]: r for r in ROWS}

# affix property (docs/pd2-magic-affixes.tsv, Properties.txt codes) -> (row, its label beside the roll, its look in
# 300-affix-tags: the output a new tag line would use; None: 300 has no look for it)
PROPS = {
    "hp": ("life", "", "%WHITE%%LIFE%%RED%l"),
    "hp/lvl": ("life_lvl", "", "%WHITE%$f(STAT7+FLOOR(STAT216*CLVL/2048))%RED%l"),
    "mana": ("mana", "", "%WHITE%%MANA%%BLUE%m"),
    "mana/lvl": ("mana_lvl", "", "%WHITE%$f(STAT9+FLOOR(STAT217*CLVL/2048))%BLUE%m"),
    "lifesteal": ("leech_life", "", "%WHITE%%STAT60%%RED%ls"),
    "manasteal": ("leech_mana", "", "%WHITE%%STAT62%%BLUE%ms"),
    "heal-kill": ("lpk", "", "%WHITE%%STAT86%%RED%lpk"),
    "mana-kill": ("mpk", "", "%WHITE%%STAT138%%BLUE%mpk"),
    "regen": ("regen", "", "%WHITE%%STAT74%%RED%rep"),
    "regen-mana": ("regen_mana", "", "%WHITE%%STAT27%%BLUE%rgn"),
    "regen-stam": ("regen_stam", "", None),
    "dmg-to-mana": ("dtm", "", "%WHITE%%DTM%%BLUE%dtm"),
    "str": ("str", "", "%WHITE%%STAT0%%GRAY%s"),
    "dex": ("dex", "", "%WHITE%%STAT2%%GRAY%d"),
    "enr": ("enr", "", "%WHITE%%STAT1%%BLUE%e"),
    "res-fire": ("res", "Fire", "%WHITE%%FRES%%RED%r"),
    "res-cold": ("res", "Cold", "%WHITE%%CRES%%BLUE%r"),
    "res-ltng": ("res", "Lightning", "%WHITE%%LRES%%YELLOW%r"),
    "res-pois": ("res", "Poison", "%WHITE%%PRES%%DARK_GREEN%r"),
    "res-all": ("res_all", "", "%WHITE%%RES%%PURPLE%res"),
    "res-pois-len": ("plr", "", "%WHITE%%STAT110%%DARK_GREEN%plr"),
    "ac%": ("ed_def", "", "%WHITE%%ED%%LIGHT_GRAY%ed"),
    "ac/lvl": ("def_lvl", "", None),
    "red-dmg": ("pdr_flat", "", "%WHITE%%STAT34%%GRAY%pdr"),
    "red-mag": ("mdr", "", "%WHITE%%STAT35%%GRAY%mdr"),
    "red-dmg%": ("pdr", "", "%WHITE%%STAT36%%GOLD%%PERCENT%pdr"),
    "block": ("block", "", "%WHITE%%STAT20%%LIGHT_GRAY%blk"),
    "block2": ("fbr", "", "%WHITE%%FBR%%TAN%fbr"),
    "thorns": ("thorns", "", "%WHITE%%STAT78%%GRAY%atd"),
    "half-freeze": ("hfd", "", "%BLUE%Hfd"),
    "nofreeze": ("cbf", "", "%BLUE%Cbf"),
    "balance1": ("fhr", "", "%WHITE%%FHR%%TAN%fhr"), "balance2": ("fhr", "", "%WHITE%%FHR%%TAN%fhr"),
    "balance3": ("fhr", "", "%WHITE%%FHR%%TAN%fhr"),
    "cast1": ("fcr", "", "%WHITE%%FCR%%TEAL%fcr"), "cast3": ("fcr", "", "%WHITE%%FCR%%TEAL%fcr"),
    "swing1": ("ias", "", "%WHITE%%IAS%%ORANGE%ias"), "swing2": ("ias", "", "%WHITE%%IAS%%ORANGE%ias"),
    "swing3": ("ias", "", "%WHITE%%IAS%%ORANGE%ias"),
    "move1": ("frw", "", "%WHITE%%FRW%%TAN%frw"), "move2": ("frw", "", "%WHITE%%FRW%%TAN%frw"),
    "move3": ("frw", "", "%WHITE%%FRW%%TAN%frw"),
    "dmg%": ("ed_dmg", "", "%WHITE%%EDAM%%TAN%ed"),
    "dmg-min": ("min", "", "%WHITE%%MINDMG%%TAN%min"),
    "dmg-max": ("max", "", "%WHITE%%MAXDMG%%TAN%max"),
    # per character level beside the flat roll: one tag, the total at your level (the author, 2026-10-28; as 300's
    # life and mana per level). 218 holds eighths (ItemStatCost op 4, param 3), 224 halves (op 2, param 1). MAXDMG, not
    # STAT22: a two-handed weapon's flat maximum damage is stat 24 (BH's MAXDMG takes the largest of 22, 24 and 160)
    "dmg/lvl": ("max", "per level", "%WHITE%$f(MAXDMG+FLOOR(STAT218*CLVL/8))%TAN%max"),
    "att": ("ar", "", "%WHITE%%AR%%DARK_GREEN%ar"),
    "att%": ("ar_pct", "", "%WHITE%%STAT119%%LIGHT_GRAY%%PERCENT%ar"),
    "att/lvl": ("ar", "per level", "%WHITE%$f(STAT19+FLOOR(STAT224*CLVL/2))%DARK_GREEN%ar"),
    "att%/lvl": ("ar_pct_lvl", "", None),
    "deadly": ("ds", "", "%WHITE%%STAT141%%RED%ds"),
    "crush": ("cb", "", "%WHITE%%STAT136%%CORAL%cb"),
    "openwounds": ("ow", "", "%WHITE%%STAT135%%CORAL%%PERCENT%ow"),  # new (2026-10-28): % beside 501's ow
    "deep-wounds": ("owd", "", "%WHITE%%STAT501%%CORAL%ow"),
    "ignore-ac": ("itd", "", "%LIGHT_GRAY%ITD"),
    "dmg-demon": ("dmg_dem", "", "%WHITE%%STAT121%%RED%dem"),
    "dmg-undead": ("dmg_und", "", "%WHITE%%STAT122%%RED%und"),
    "att-demon": ("ar_dem", "", "%WHITE%%STAT123%%DARK_GREEN%ar"),
    "att-undead": ("ar_und", "", "%WHITE%%STAT124%%DARK_GREEN%ar"),
    "noheal": ("noheal", "", None),
    "knock": ("knock", "", "%GRAY%Knb"),  # new (2026-10-28)
    "dmg-fire": ("fire_dmg", "", "%WHITE%%STAT48%-%STAT49%%RED%fire"),
    "fire-min": ("fire_dmg", "min", "%WHITE%%STAT48%-%STAT49%%RED%fire"),
    "fire-max": ("fire_dmg", "max", "%WHITE%%STAT48%-%STAT49%%RED%fire"),
    "dmg-cold": ("cold_dmg", "", "%WHITE%%STAT54%-%STAT55%%BLUE%cold"),
    "cold-min": ("cold_dmg", "min", "%WHITE%%STAT54%-%STAT55%%BLUE%cold"),
    "cold-max": ("cold_dmg", "max", "%WHITE%%STAT54%-%STAT55%%BLUE%cold"),
    "cold-len": ("cold_dmg", "length", "%WHITE%%STAT54%-%STAT55%%BLUE%cold"),
    "dmg-ltng": ("ltng_dmg", "", None), "ltng-min": ("ltng_dmg", "min", None),
    "ltng-max": ("ltng_dmg", "max", None),
    "dmg-pois": ("pois_dmg", "", None),
    "extra-fire": ("skill_dmg", "Fire", "%WHITE%%STAT329%%RED%%PERCENT%f"),
    "extra-ltng": ("skill_dmg", "Lightning", "%WHITE%%STAT330%%YELLOW%%PERCENT%l"),
    "extra-cold": ("skill_dmg", "Cold", "%WHITE%%STAT331%%BLUE%%PERCENT%c"),
    "extra-pois": ("skill_dmg", "Poison", "%WHITE%%STAT332%%DARK_GREEN%%PERCENT%p"),
    "extra-magi": ("skill_dmg", "Magic", "%WHITE%%STAT357%%ORANGE%%PERCENT%m"),
    "pierce-fire": ("pierce", "Fire", "%WHITE%-%STAT333%%RED%%PERCENT%f"),
    "pierce-ltng": ("pierce", "Lightning", "%WHITE%-%STAT334%%YELLOW%%PERCENT%l"),
    "pierce-cold": ("pierce", "Cold", "%WHITE%-%STAT335%%BLUE%%PERCENT%c"),
    "pierce-pois": ("pierce", "Poison", "%WHITE%-%STAT336%%DARK_GREEN%%PERCENT%p"),
    "ama": ("clsk", "Amazon", "%WHITE%%CLSK0%%TAN%ama"), "sor": ("clsk", "Sorceress", "%WHITE%%CLSK1%%TAN%sor"),
    "nec": ("clsk", "Necromancer", "%WHITE%%CLSK2%%TAN%nec"), "pal": ("clsk", "Paladin", "%WHITE%%CLSK3%%TAN%pal"),
    "bar": ("clsk", "Barbarian", "%WHITE%%CLSK4%%TAN%bar"), "dru": ("clsk", "Druid", "%WHITE%%CLSK5%%TAN%dru"),
    "ass": ("clsk", "Assassin", "%WHITE%%CLSK6%%TAN%sin"),
    "skilltab": ("tabsk", "", None),  # its look depends on the tab: TAB_LOOK
    "hit-skill": ("ctc_hit", "", None), "cast-skill": ("ctc_cast", "", None),
    "gethit-skill": ("ctc_struck", "", None), "charged": ("charges", "", None),
    "ease": ("ease", "", "%WHITE%%STAT91%%LIGHT_GRAY%%PERCENT%rq"),
    "light": ("light", "", "%WHITE%%STAT89%%YELLOW%lr"),
    "mag%": ("mf", "", "%WHITE%%MFIND%%YELLOW%mf"),
    "gold%": ("gf", "", "%WHITE%%GFIND%%GOLD%gf"),
    "rep-dur": ("repair", "", "%GRAY%Rep"),
    "sock": ("sock", "", None),
}
# +skill tab looks of 300 (the 1-2 look; 3+ is gold)
TAB_LOOK = {0: "bow", 1: "pas", 2: "jav", 8: "fire", 9: "lght", 10: "cold", 16: "curs", 17: "pnb", 18: "nsum",
            24: "pcom", 25: "off", 26: "def", 32: "bcom", 33: "mast", 34: "wcry", 40: "dsum", 41: "shap", 42: "ele",
            48: "trap", 49: "shad", 50: "mar"}
# game stat id -> BH's named words for it (beside STAT<id>)
STAT_WORDS = {0: ["STR"], 2: ["DEX"], 7: ["LIFE"], 9: ["MANA"], 19: ["AR"], 21: ["MINDMG"], 22: ["MAXDMG"],
              39: ["FRES"], 41: ["LRES"], 43: ["CRES"], 45: ["PRES"], 79: ["GFIND"], 80: ["MFIND"], 93: ["IAS"],
              96: ["FRW"], 99: ["FHR"], 102: ["FBR"], 105: ["FCR"], 114: ["DTM"], 252: ["REPAIR"]}
PER_LEVEL = {216, 217}  # held in 256ths (300's life / mana per level formulas divide by 2048)
EIGHTHS = {214, 216, 217, 218}  # per character level stats in eighths per level (224, 225: halves)
HALVES = {224, 225}
FLAG_ROWS = {"repair", "hfd", "cbf", "itd", "noheal", "knock"}  # the page shows "yes" for their rolls
STAT_PREFIXES = ("STAT", "TABSK", "CLSK", "MULTI", "SK", "OS")
DERIVED = {"RES": ("FRES", "LRES", "CRES", "PRES"), "ALLATTRIB": ("STR", "STAT1", "DEX", "STAT3"),
           "MAXRES": ("STAT40", "STAT42", "STAT44", "STAT46")}
NAME_OF = {v: k for k, v in LC.COLOR_CODE.items()}


# ---------------------------------------------------------------- game data

def load_affixes():
    rows = [line for line in AFFIXES.read_text(encoding="utf-8").splitlines() if not line.startswith("#")]
    header = rows[0].split("\t")
    out = []
    for line in rows[1:]:
        a = dict(zip(header, line.split("\t")))
        if a["kind"] not in ("prefix", "suffix") or a["spawnable"] != "1" or a["version"] in ("", "0") or \
                a["rare"] in ("", "0") or a["frequency"] in ("", "0") or int(a["level"] or 0) >= CUT:
            continue
        a["mods"] = [m for m in json.loads(a["mods"] or "[]") if m[0].lower() in PROPS]
        if not a["mods"]:
            continue
        a["itypes"] = {t for t in a["itypes"].split(",") if t}
        a["etypes"] = {t for t in a["etypes"].split(",") if t}
        a["level"], a["maxlevel"] = int(a["level"] or 0), int(a["maxlevel"] or 0)
        out.append(a)
    return out


def fits(a, base):
    types = set(base["types"])
    return bool(a["itypes"] & types) and not a["etypes"] & types


def reach(base):
    """The highest item level this base drops at with an affix level below the cut (None: never)."""
    ok = [i for i in range(max(base["qlvl"], 1), 100) if T.affix_level(i, base["qlvl"], base["mlvl"]) < CUT]
    return ok[-1] if ok else None


def kinds_of(card, bases, affixes):
    """{kind words: [base codes]} of a card's bases that drop below the cut, lowest quality level first."""
    _, _, _, match = card
    out = {}
    for code, b in sorted(bases.items(), key=lambda kv: (kv[1]["qlvl"], kv[0])):
        g = T.item_groups(set(b["types"]))
        if not b["spawnable"] or "tpot" in b["types"] or not match(g, code) or reach(b) is None:
            continue  # the throwing potions never come magic or rare
        if not any(fits(a, b) for a in affixes):
            continue
        out.setdefault(frozenset(g & KIND_WORDS), []).append(code)
    return out


def kind_name(words, card_name):
    w = set(words)
    if "SIN" in w:
        return "Claws"
    if "SOR" in w:
        return "Orbs"
    main = next((KIND_NAMES[x] for x in ("SWORD", "AXE", "CLUB", "TMACE", "HAMMER", "SCEPTER", "DAGGER", "SPEAR",
                                         "POLEARM", "JAV", "BOW", "XBOW", "STAFF", "WAND") if x in w), None)
    if main:
        if "THROWING" in w and "JAV" not in w:
            main = {"Axes": "Throwing axes", "Daggers": "Throwing knives"}.get(main, "Throwing " + main.lower())
        return ("Amazon " + main.lower()) if "ZON" in w else main
    for x in ("BAR", "DRU", "DIN", "NEC"):
        if x in w:
            return KIND_NAMES[x]
    return card_name


# ---------------------------------------------------------------- the filter's rules (300-affix-tags)

def block_lines():
    """{game stat id: the line of its block header in 300} (a new tag line goes into its stat's block)."""
    out = {}
    for i, line in enumerate(TAGS_300.read_text(encoding="utf-8").splitlines(), 1):
        m = re.match(r"^// ---- .*\(stat (\d+)", line)
        if m:
            out.setdefault(int(m.group(1)), i)
    return out


def constants(words):
    """The numbers 300's conditions compare these words with (the cut points to try)."""
    text = TAGS_300.read_text(encoding="utf-8")
    out = set()
    for w in words:
        for m in re.finditer(r"(?<![A-Z0-9_])" + re.escape(w) + r"([<>=~])(\d+)(?:-(\d+))?", text):
            for x in (m.group(2), m.group(3)):
                if x:
                    out |= {int(x) - 1, int(x), int(x) + 1}
    return out


class Rules:
    """The lines of 300 as BH reads them, with sections swapped ({file name: bytes}; by default the low-level aliases
    all FALSE: the filter as it tags without them)."""

    def __init__(self, replace=None):
        replace = {SECTION.name: render_section({}, {}, off=True)} if replace is None else replace
        orig = LC.filter_lines
        LC.filter_lines = lambda r: orig({**r, **replace})
        try:
            self.rs = LC.RuleSet((ROOT / "sections" / LC.SECTION).read_bytes())
        finally:
            LC.filter_lines = orig
        self.rules = [(r, int(r["where"].rsplit(":", 1)[1])) for r in self.rs.rules
                      if r["where"].startswith("sections/" + TAGS_300.name + ":")]
        self.sample_keys = set()

    def dynamic(self, word):
        if word.startswith("FORMULA__"):
            return True
        m = E.COMPARE_RE.match(word)
        parts = m.group(1).split("+") if m else [word]
        return any(p in self.sample_keys or p in DERIVED or p in ("PREFIX", "SUFFIX") or p.startswith(STAT_PREFIXES)
                   for p in parts)

    def folded(self, code, groups, static_values, kind="RARE"):
        """The rules with every word that no sample changes put in: [(tree, rule, line)], those that can match."""
        m = LC.Model(self.rs, kind, code, groups, dict(static_values))
        out = []
        for r, line in self.rules:
            t = LC.fold(r["tree"], lambda w: None if self.dynamic(w) else m.word(w))
            if t != 0:
                out.append((t, r, line))
        return out

    def tagline(self, folded, code, groups, values, base_name, kind="RARE"):
        """(the label's tag line, its color codes kept, "" if none; the line of the last rule that changed it)."""
        m = LC.Model(self.rs, kind, code, groups, values)
        cur, last = base_name + "\n" + RARE_NAME, 0
        for t, r, line in folded:
            if LC.ev(t, m.atom) != 1:
                continue
            new = LC.apply(r["name"], cur, values, base_name)
            if new != cur and line > 6:
                last = line
            cur = new
            if not r["cont"]:
                break
        lines = LC.trim(cur).split("\n")
        return (lines[0] if len(lines) >= 3 else ""), last


def segments(text):
    """A BH string with label_cuts' color codes as [[color, text], ...] (white until a code says otherwise)."""
    out, color, i = [], "WHITE", 0
    for m in re.finditer("\xffc.", text):
        if m.start() > i:
            out.append([color, text[i:m.start()]])
        color, i = NAME_OF.get(m.group(0), "WHITE"), m.end()
    if i < len(text):
        out.append([color, text[i:]])
    return [s for s in out if s[1]]


def stat_words(sid, par, weapon):
    if sid == 83:
        return [f"CLSK{par}"]
    if sid == 188:
        return [f"TABSK{par}"]
    if sid == 194:
        return ["SOCK"]
    if sid in (195, 196, 197, 198, 199, 200, 201, 204):
        return [f"MULTI{sid},{par}"]
    if sid == 16:
        return ["STAT16", "EDEF"] + ([] if weapon else ["ED"])
    if sid in (17, 18):
        return [f"STAT{sid}", "EDAM"] + (["ED"] if weapon else [])
    return [f"STAT{sid}"] + STAT_WORDS.get(sid, [])


def with_derived(v):
    for d, parts in DERIVED.items():
        if all(v.get(p, 0) > 0 for p in parts):
            v[d] = min(v[p] for p in parts)
    return v


# ---------------------------------------------------------------- the page's data

def roll_text(a, row):
    parts = []
    for mod in a["mods"]:
        prop = mod[0].lower()
        if PROPS[prop][0] != row:
            continue
        lo, hi = mod[3], mod[4]
        label = PROPS[prop][1]
        if prop == "skilltab" and str(mod[2]).isdigit():
            label = T_NAMES.get(int(mod[2]) // 3 * 8 + int(mod[2]) % 3, "tab")
        if prop in ("hit-skill", "cast-skill", "gethit-skill", "charged"):
            label = str(mod[2])
        if lo in ("", None) and hi in ("", None):
            val = str(mod[2]) if mod[2] not in ("", None) else ""
        else:
            val = f"{lo}" if str(lo) == str(hi) or hi in ("", None) else f"{lo}-{hi}"
        if prop in ("hp/lvl", "mana/lvl") and mod[2] not in ("", None):
            val = f"{int(mod[2]) / 8:g}/lvl"
        parts.append((label + " " + val).strip() if label else val)
    return ", ".join(p for p in parts if p)


T_NAMES = {0: "Bow", 1: "Passive", 2: "Javelin", 8: "Fire", 9: "Lightning", 10: "Cold", 16: "Curses",
           17: "Poison and Bone", 18: "Summoning", 24: "Combat", 25: "Offensive Auras", 26: "Defensive Auras",
           32: "Combat", 33: "Masteries", 34: "Warcries", 40: "Summoning", 41: "Shape Shifting", 42: "Elemental",
           48: "Traps", 49: "Shadow", 50: "Martial Arts"}


def affix_values(a, row, high, weapon, base_vals):
    v = dict(base_vals)
    for mod in a["mods"]:
        if PROPS[mod[0].lower()][0] != row:
            continue
        for sid, par, lo, hi in mod[5]:
            x = hi if high else lo
            if sid in PER_LEVEL:
                x *= 256
            for w in stat_words(sid, par, weapon):
                v[w] = base_vals.get(w, 0) + x  # on top of the base's own (a shield's block, a dagger's automod)
    v["SUFFIX" if a["kind"] == "suffix" else "PREFIX"] = int(a["row"])
    return with_derived(v)


AUTOMOD = None


def base_values(code, base, groups, alvl):
    """An identified rare of this base before its affixes: on the ground, seen by a level VIEWER character, with the
    base's own stats a tag may count (a shield's block, the automod of a base whose group has one: daggers' +20%
    deadly strike, PD2's 2026-09-27 patch)."""
    global AUTOMOD
    if AUTOMOD is None:
        rows = [l for l in (ROOT / "docs" / "pd2-base-stats.tsv").read_text(encoding="utf-8").splitlines()
                if not l.startswith("#")]
        head = rows[0].split("\t")
        group = {r[0]: r[head.index("auto prefix")] for r in (x.split("\t") for x in rows[1:])}
        arows = [l for l in AFFIXES.read_text(encoding="utf-8").splitlines() if not l.startswith("#")]
        ahead = arows[0].split("\t")
        auto = {}
        for line in arows[1:]:
            a = dict(zip(ahead, line.split("\t")))
            if a["kind"] == "automagic" and a["group"]:
                auto.setdefault(a["group"], []).append(json.loads(a["mods"] or "[]"))
        AUTOMOD = {c: auto[g][0] for c, g in group.items() if g in auto and len(auto[g]) == 1}
    shield = "SHIELD" in groups
    v = {"ID": 1, "ALVL": alvl, "ILVL": alvl, "CLVL": VIEWER, "FILTLVL": 1, "DIFF": 1,
         "BASEBLOCK": base["block"] if shield else 0, "STAT20": base["block"] if shield else 0}
    for mod in AUTOMOD.get(code, []):
        for sid, par, lo, hi in mod[5]:
            for w in stat_words(sid, par, "weap" in base["types"]):
                v[w] = v.get(w, 0) + hi
    return v


def look_of(a, row):
    looks = []
    for mod in a["mods"]:
        prop = mod[0].lower()
        if PROPS[prop][0] != row:
            continue
        look = PROPS[prop][2]
        if prop == "skilltab":
            tab = None
            for sid, par, lo, hi in mod[5]:
                tab = par
            look = f"%WHITE%%TABSK{tab}%%TAN%{TAB_LOOK[tab]}" if tab in TAB_LOOK else None
        if look is None:
            return None
        if look not in looks:
            looks.append(look)
    return " ".join(looks) if looks else None


def page_data():
    bases = T.load_bases()
    affixes = load_affixes()
    rules = Rules()
    for a in affixes:
        for mod in a["mods"]:
            for sid, par, lo, hi in mod[5]:
                rules.sample_keys.update(stat_words(sid, par, True) + stat_words(sid, par, False))
    rules.sample_keys.update({"STAT20", "BASEBLOCK"})
    blocks = block_lines()
    aff_index, aff_table = {}, []
    seg_index, seg_table = {}, []

    def seg(text):
        key = text
        if key not in seg_index:
            seg_index[key] = len(seg_table)
            seg_table.append(segments(text))
        return seg_index[key]

    def aid(a):
        k = (a["kind"], a["row"])
        if k not in aff_index:
            aff_index[k] = len(aff_table)
            aff_table.append([a["kind"][0].upper(), a["name"], a["level"], a["maxlevel"], int(a["group"] or 0)])
        return aff_index[k]

    cards = []
    for card in CARDS:
        key, name, cond, _ = card
        kinds = kinds_of(card, bases, affixes)
        kind_rows, kind_list = {}, []
        reach_max, reach_base = 0, ""
        longest = ("", 0)
        for ki, (words, codes) in enumerate(sorted(kinds.items(), key=lambda kv: kind_name(kv[0], name))):
            first = bases[codes[0]]
            weapon = "weap" in first["types"]
            groups = T.item_groups(set(first["types"])) | {T.TIER_GROUP[first["tier"]]}
            base_vals = base_values(codes[0], first, groups, CUT - 1)
            folded = rules.folded(codes[0], groups, base_vals)
            plain, _ = rules.tagline(folded, codes[0], groups, dict(base_vals), first["name"])
            for c in codes:
                r = reach(bases[c])
                if r > reach_max:
                    reach_max, reach_base = r, bases[c]["name"]
                if len(bases[c]["name"]) > longest[1]:
                    longest = (bases[c]["name"], len(bases[c]["name"]))
            kind_list.append({"name": kind_name(words, name), "base": first["name"], "n": len(codes)})
            mine = [a for a in affixes if any(fits(a, bases[c]) for c in codes)]
            by_row = {}
            for a in mine:
                for mod in a["mods"]:
                    by_row.setdefault(PROPS[mod[0].lower()][0], [])
                    if a not in by_row[PROPS[mod[0].lower()][0]]:
                        by_row[PROPS[mod[0].lower()][0]].append(a)
            for row, row_affixes in by_row.items():
                entries, low_ok, high_any = [], True, False
                for a in sorted(row_affixes, key=lambda x: (x["level"], x["kind"], x["name"])):
                    tags = []
                    for high in (False, True):
                        line, pos = rules.tagline(folded, codes[0], groups, affix_values(a, row, high, weapon,
                                                                                         base_vals), first["name"])
                        new = line[:len(line) - len(plain)] if plain and line.endswith(plain) else line
                        tags.append((new.strip(), pos))
                    low_ok = low_ok and bool(LC.visible(tags[0][0]).strip())
                    high_any = high_any or bool(LC.visible(tags[1][0]).strip())
                    look = look_of(a, row)
                    new_text = LC.apply(look, "", affix_values(a, row, True, weapon, base_vals), first["name"]) \
                        if look and roll_value(a, row, True) >= MIN_ROLL.get(row, 1) else ""
                    some = not all(fits(a, bases[c]) for c in codes)
                    entries.append([aid(a), roll_text(a, row), seg(tags[1][0]) if tags[1][0] else -1, tags[1][1],
                                    seg(new_text) if new_text else -1, int(some)])
                state = "any" if low_ok else "never" if not high_any else "some"
                start = None
                if state == "some":
                    start = first_tagged(rules, folded, codes[0], groups, base_vals, first["name"], plain,
                                         row_affixes, row, weapon)
                    if start is not None:
                        state = "from"
                bands = []
                for top in BANDS:
                    best = None
                    for a in row_affixes:
                        if a["level"] > top:
                            continue
                        for m in a["mods"]:
                            if PROPS[m[0].lower()][0] != row:
                                continue
                            for sid, par, lo, hi in m[5]:
                                val = hi / 8 if sid in EIGHTHS else hi / 2 if sid in HALVES else hi
                                if best is None or abs(val) > abs(best):
                                    best = val
                    bands.append("yes" if best is not None and row in FLAG_ROWS else best)
                primary = Counter(mod[5][0][0] for a in row_affixes for mod in a["mods"]
                                  if PROPS[mod[0].lower()][0] == row and mod[5]).most_common(1)
                pos = blocks.get(primary[0][0], 0) if primary else 0
                has_look = all(look_of(a, row) for a in row_affixes)
                kind_rows.setdefault(row, []).append({"k": ki, "st": state, "from": start, "bands": bands,
                                                      "pos": pos, "look": int(has_look), "aff": entries})
        rows = [{"key": r[0], "kinds": kind_rows[r[0]],
                 "lock": int(key in WEAPON_CARDS and r[0] in FRESH_ONLY_ON_WEAPONS)} for r in ROWS if r[0] in kind_rows]
        cards.append({"key": key, "name": name, "cond": cond, "kinds": kind_list, "rows": rows,
                      "reach": reach_max, "reachBase": reach_base, "longestBase": longest[0]})
    return {"cut": CUT, "nameMax": LC.NAME_MAX, "bands": list(BANDS), "viewer": VIEWER, "cats": CATS,
            "picks": load_picks(card_rows(bases, affixes)),
            "rows": [{"key": k, "label": lab, "cat": cat, "def": d, "sock": int(k in SOCKETED), "min": MIN_ROLL.get(k, 0),
                      "wpn": 2 if k in WEAPON_ANY_TIME else 1 if k in FRESH_WEAPON_ROWS else 0,
                      "wpnc": int(k in FRESH_CASTER_ROWS)}
                     for k, lab, cat, d in ROWS],
            "wpnCards": NONCASTER_CARDS,
            "affixes": aff_table, "segs": seg_table, "cards": cards}


def first_tagged(rules, folded, code, groups, base_vals, base_name, plain, row_affixes, row, weapon):
    """The lowest value of the row's main stat that gets a tag, alone (None: the row has more than one stat, or no
    value does)."""
    stats = {(sid, par) for a in row_affixes for m in a["mods"] if PROPS[m[0].lower()][0] == row
             for sid, par, lo, hi in m[5]}
    if len(stats) != 1:
        return None
    (sid, par), = stats
    words = stat_words(sid, par, weapon)
    lo = min(m[5][0][2] for a in row_affixes for m in a["mods"] if PROPS[m[0].lower()][0] == row and m[5])
    hi = max(m[5][0][3] for a in row_affixes for m in a["mods"] if PROPS[m[0].lower()][0] == row and m[5])
    tries = sorted(x for x in constants(words) | {lo, hi} if lo <= x <= hi)
    found = None
    for x in reversed(tries):
        v = dict(base_vals)
        for w in words:
            v[w] = base_vals.get(w, 0) + x * (256 if sid in PER_LEVEL else 1)
        line, _ = rules.tagline(folded, code, groups, with_derived(v), base_name)
        if line == plain or not LC.visible(line).strip():
            break
        found = x
    return found


# ---------------------------------------------------------------- the picks and the alias section

CARD_NAME = {c[0]: c[1] for c in CARDS}
CARD_COND = {c[0]: c[2] for c in CARDS}
WEAPON_CARDS = ["melee", "ranged", "throwing", "caster"]
# the rows 300's lines ask an alias for (a row picked anywhere else needs its lines first: --apply names it)
ALIASES = {"life": "LOWLVL_LIFE_TAG", "mana": "LOWLVL_MANA_TAG", "leech_life": "LOWLVL_LS_TAG",
           "leech_mana": "LOWLVL_MS_TAG", "lpk": "LOWLVL_LPK_TAG", "mpk": "LOWLVL_MPK_TAG", "str": "LOWLVL_STR_TAG",
           "dex": "LOWLVL_DEX_TAG", "enr": "LOWLVL_NRG_TAG", "res": "LOWLVL_SRES_TAG", "pdr_flat": "LOWLVL_PDRF_TAG",
           "mdr": "LOWLVL_MDR_TAG", "fhr": "LOWLVL_FHR_TAG", "frw": "LOWLVL_FRW_TAG", "min": "LOWLVL_MINDMG_TAG",
           "max": "LOWLVL_MAXDMG_TAG", "ar": "LOWLVL_AR_TAG", "ar_pct": "LOWLVL_ARPER_TAG", "ds": "LOWLVL_DS_TAG",
           "cb": "LOWLVL_CB_TAG", "ow": "LOWLVL_OW_TAG", "owd": "LOWLVL_OWD_TAG", "itd": "LOWLVL_ITD_TAG",
           "knock": "LOWLVL_KB_TAG", "dmg_dem": "LOWLVL_DEM_TAG", "dmg_und": "LOWLVL_UND_TAG", "mf": "LOWLVL_MF_TAG",
           "gf": "LOWLVL_GF_TAG"}
MERGED = {"max_lvl": "max", "ar_lvl": "ar"}  # page rows of 2026-10-28 now one tag (the author: one total)
# stats gems and low runes commonly add: their low-level tags skip an item with anything socketed (!GEMMED in the
# alias; the author, 2026-10-28). BH's stat words count the socket fillers; 300's older lines keep counting them, and
# its attribute, FHR and min / max damage lines have !GEMMED of their own
SOCKETED = {"mana", "res", "leech_life", "leech_mana", "ar", "mf", "gf", "lpk", "mpk", "pdr_flat", "mdr", "knock", "ow",
            "dmg_dem", "dmg_und"}
# the smallest roll a rare's tag of the stat shows, low-level or not: 300's rare line asks it of every item type (the
# author, 2026-10-28: a flat 1 damage reduction is noise)
MIN_ROLL = {"pdr_flat": 2, "mdr": 2}
# rare and crafted weapons but staves, wands and orbs tag these at every affix level, every roll, until the item is
# socketed or corrupted (the author, 2026-10-28: endgame weapons tagged none of them); damage to demons / undead above
# 100 at any time, socketed or corrupted too. The stat's alias carries this weapon part beside its low-level one
WEAPONS = "(WEAPON !STAFF !WAND !SOR)"
NONCASTER_CARDS = ["melee", "ranged", "throwing"]
FRESH_WEAPON_ROWS = {"leech_life", "leech_mana", "frw", "ar_pct", "owd", "itd", "dmg_dem", "dmg_und"}
# not life / mana after each kill, attributes, single resistances, attack rating, open wounds chance nor knockback
# (the author; attack rating only below affix level 60, from the cards' picks)
# on weapons only below affix level 60 (the author, 2026-10-29; attack rating % the same day)
WEAPON_LOW_ONLY = {"leech_life", "leech_mana", "owd", "ar_pct"}
# damage to demons / undead (the author, 2026-10-29): below affix level 60 every roll, from 60 only on a weapon with
# 100%+ enhanced damage; 100 and up (300 shows it red) socketed or corrupted too, below 100 (tan) until then
WEAPON_ANY_TIME = {"dmg_dem": "STAT121>99", "dmg_und": "STAT122>99"}
WEAPON_GATE = {"dmg_dem": f"(ALVL<{CUT} OR ED>99)", "dmg_und": f"(ALVL<{CUT} OR ED>99)"}
# on weapons these show only while nothing is socketed and the item isn't corrupted, below affix level 60 too (the
# author, 2026-10-28; demons / undead below 100): the weapon cards leave their low-level part, the weapon part
# above covers them
FRESH_ONLY_ON_WEAPONS = {"leech_life", "leech_mana", "owd", "ar_pct", "dmg_dem", "dmg_und"}
# clubs, orbs, wands and staves tag these the same way, until socketed or corrupted (the author, 2026-10-28; clubs take
# both sets; flat physical damage reduction only comes from the Safety craft). Replenish life, regenerate mana and
# damage taken goes to mana never show on them
CASTERS = "(CLUB OR STAFF OR WAND OR SOR)"
FRESH_CASTER_ROWS = {"lpk", "mpk", "mana", "life", "res", "enr", "str", "dex", "mdr", "pdr_flat"}
WEAPON_GROUPS = ((WEAPONS, FRESH_WEAPON_ROWS, "weapons but staves, wands and orbs"),
                 (CASTERS, FRESH_CASTER_ROWS, "clubs, orbs, wands and staves"))


def roll_value(a, row, high):
    """The largest value the affix gives the row's stats at its lowest / highest roll."""
    return max((hi if high else lo for m in a["mods"] if PROPS[m[0].lower()][0] == row for sid, par, lo, hi in m[5]),
               default=0)
# corruptions that give a wired stat to a rare too (their own 300 lines): --verify checks there is one tag with them
CORRUPTIONS = {"leech_life": [57], "leech_mana": [58], "lpk": [8], "mpk": [9], "ar": [3, 18, 26, 59], "itd": [24],
               "ds": [19, 25], "cb": [21, 23], "frw": [44], "mf": [7], "str": [68], "dex": [69], "enr": [71]}


def card_rows(bases, affixes):
    """{card: [the rows a rare of it can roll below the cut]} (ROWS' order)."""
    out = {}
    for card in CARDS:
        codes = [c for cs in kinds_of(card, bases, affixes).values() for c in cs]
        rows = {PROPS[m[0].lower()][0] for a in affixes if any(fits(a, bases[c]) for c in codes) for m in a["mods"]}
        out[card[0]] = [r[0] for r in ROWS if r[0] in rows]
    return out


def load_picks(eligible):
    """{card: {row: on}}: the picks file, the author's first answers where it says nothing."""
    data = json.loads(PICKS.read_text(encoding="utf-8")) if PICKS.exists() else {}
    return {c: {r: bool(data.get(c, {}).get(r, ROW[r][3])) for r in rows} for c, rows in eligible.items()}


def write_picks(picks):
    PICKS.write_text(json.dumps(picks, indent=1) + "\n", encoding="utf-8", newline="\n")


def card_condition(cards):
    every_weapon = all(w in cards for w in WEAPON_CARDS)
    conds = [CARD_COND[c] for c in cards if not (every_weapon and c in WEAPON_CARDS)]
    conds += ["WEAPON"] if every_weapon else []
    return conds[0] if len(conds) == 1 else "(" + " OR ".join(conds) + ")"


def render_section(picks, eligible, off=False):
    out = ["// ------------------------------------------------------------------------------",
           "//    =====================  Low-Level Rare Tags (aliases)  =====================",
           "// ------------------------------------------------------------------------------",
           "",
           "// GENERATED by tools/low_level_tags.py from tools/low_level_tag_picks.json (the author's choices on the",
           f"// page {PAGE_URL}); never edit by hand. Below affix level {CUT} a rare or crafted",
           "// item of a picked item type tags every roll of the stat, in 300-affix-tags' look: 300's lines ask these",
           f"// aliases. From affix level {CUT} up nothing changes, but rare and crafted weapons tag some of these stats",
           "// at every affix level while nothing is socketed and they aren't corrupted (the physical ones one set;",
           "// clubs, orbs, wands and staves another)."]
    for row, label, _, _ in ROWS:
        if row not in ALIASES:
            continue
        cards = [] if off else [c for c, *_ in CARDS if row in eligible.get(c, []) and picks.get(c, {}).get(row)
                                and not (row in FRESH_ONLY_ON_WEAPONS and c in WEAPON_CARDS)]
        gem = " !GEMMED" if row in SOCKETED else ""
        low = f"ALVL<{CUT}{gem} {card_condition(cards)}" if cards else ""
        wpn, groups = "", [(g, who) for g, rows, who in WEAPON_GROUPS if row in rows]
        if not off and groups:
            types, who = ("WEAPON", "all weapons") if len(groups) == 2 else groups[0]
            fresh = (f"ALVL<{CUT} " if row in WEAPON_LOW_ONLY else "") + "!GEMMED !STAT360>0"
            wpn = f"{types} {WEAPON_GATE[row]} ({WEAPON_ANY_TIME[row]} OR ({fresh}))" if row in WEAPON_ANY_TIME \
                else f"{types} {fresh}"
        body = "FALSE" if not (low or wpn) else f"((RARE OR CRAFT) {low or wpn})" if not (low and wpn) else \
            f"((RARE OR CRAFT) (({low}) OR ({wpn})))"
        out += ["", f"// {label}: " + (", ".join(CARD_NAME[c].lower() for c in cards) or "none") +
                (" (not with anything socketed: gems and runes add it)" if gem and cards else "") +
                (f"; {who} {'below affix level ' + str(CUT) if row in WEAPON_LOW_ONLY else 'at every affix level'} "
                 "until socketed or corrupted" if wpn else "")
                + (f" (from affix level {CUT} only with 100%+ enhanced damage; 100 and up at any time)"
                   if row in WEAPON_ANY_TIME and wpn else ""),
                f"Alias[{ALIASES[row]}]:" + body]
    return ("\r\n".join(out) + "\r\n").encode("utf-8")


def check_aliases():
    """Problems: an alias 300 asks that the section lacks, one it never asks, a name clash (BH replaces an alias
    name anywhere in a condition, inside a longer word too)."""
    text = TAGS_300.read_text(encoding="utf-8")
    used = set(re.findall(r"LOWLVL_[A-Z0-9_]+?_TAG", text))
    ours = set(ALIASES.values())
    out = [f"300 asks {a}, which the section lacks" for a in sorted(used - ours)]
    out += [f"300 never asks {a} (wire it, or take it out of ALIASES)" for a in sorted(ours - used)]
    others = set()
    for f in (ROOT / "sections").glob("*.filter"):
        if f != SECTION:
            others |= set(re.findall(r"^Alias\[([^\]]+)\]", f.read_text(encoding="utf-8"), re.M))
    for a in sorted(ours):
        for b in sorted(others | ours):
            if a != b and (a in b or b in a):
                out.append(f"alias names clash: {a} / {b}")
    return out


def sample_keys(affixes):
    keys = {"STAT20", "BASEBLOCK"}
    for a in affixes:
        for mod in a["mods"]:
            for sid, par, lo, hi in mod[5]:
                keys.update(stat_words(sid, par, True) + stat_words(sid, par, False))
    return keys


def apply(path):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    bases, affixes = T.load_bases(), load_affixes()
    eligible = card_rows(bases, affixes)
    picks = load_picks(eligible)
    for card, doc in data.items():
        if card not in picks:
            sys.exit(f"--apply: unknown item type {card}")
        stats = doc.get("stats", doc)
        for row, on in stats.items():
            target = MERGED.get(row, row)
            if row in MERGED and target in stats:
                continue  # the flat row's own switch decides the merged tag
            if target in picks[card]:
                picks[card][target] = bool(on)
    write_picks(picks)
    SECTION.write_bytes(render_section(picks, eligible))
    print(f"applied {', '.join(data)} to {PICKS.relative_to(ROOT)}; wrote {SECTION.relative_to(ROOT)}")
    states = {(c["key"], r["key"]): {k["st"] for k in r["kinds"]} for c in page_data()["cards"] for r in c["rows"]}
    todo = [f"{CARD_NAME[c]}: {ROW[r][1]}" for c in picks for r, on in picks[c].items()
            if on and r not in ALIASES and states.get((c, r), set()) - {"any"}]
    if todo:
        print("picked, but 300 has no line for them yet (wire them first):\n  " + "\n  ".join(todo))


def full_values(chosen, weapon, base_vals):
    """A rare with these affixes at their highest rolls (every row of each)."""
    v = dict(base_vals)
    for a in chosen:
        for mod in a["mods"]:
            for sid, par, lo, hi in mod[5]:
                x = hi * (256 if sid in PER_LEVEL else 1)
                for w in stat_words(sid, par, weapon):
                    v[w] = v.get(w, 0) + x
    return with_derived(v)


def verify():
    """Run sample rares through 300 with the low-level aliases as built ("now"), all FALSE ("off") and the 300 of
    the last commit without them ("head"): each item type's kinds, each affix a rare can get below the cut alone at
    its lowest and highest roll, at affix level 59 and 60 (magic samples too, "head" against "off"). Then the longest
    tag line per item type: per side the 3 affix groups whose tags are widest, together through the rules."""
    bases, affixes = T.load_bases(), load_affixes()
    eligible = card_rows(bases, affixes)
    picks = load_picks(eligible)
    head = subprocess.run(["git", "show", f"HEAD:sections/{TAGS_300.name}"], cwd=ROOT, capture_output=True,
                          check=True).stdout
    sets = {"head": Rules({TAGS_300.name: head, SECTION.name: b""}), "off": Rules(), "now": Rules({})}
    keys = sample_keys(affixes) | {"GEMMED", "CLVL"}
    for r in sets.values():
        r.sample_keys = keys
    vis = lambda t: LC.visible(t).strip()
    problems, measures, n = [], [], 0
    for card in CARDS:
        key, name = card[0], card[1]
        best = None
        for words, codes in sorted(kinds_of(card, bases, affixes).items(), key=lambda kv: sorted(kv[0])):
            first = bases[codes[0]]
            kname = kind_name(words, name)
            weapon = "weap" in first["types"]
            groups = T.item_groups(set(first["types"])) | {T.TIER_GROUP[first["tier"]]}
            mine = [a for a in affixes if any(fits(a, bases[c]) for c in codes)]
            for alvl in (CUT - 1, CUT):
                base_vals = base_values(codes[0], first, groups, alvl)
                folds = {s: r.folded(codes[0], groups, base_vals) for s, r in sets.items()}
                mags = {s: sets[s].folded(codes[0], groups, base_vals, "MAG") for s in ("head", "off")}

                def line(s, v, kind="RARE"):
                    f = mags[s] if kind == "MAG" else folds[s]
                    return vis(sets[s].tagline(f, codes[0], groups, v, first["name"], kind)[0])

                for a in mine:
                    rows = []
                    for mod in a["mods"]:
                        if PROPS[mod[0].lower()][0] not in rows:
                            rows.append(PROPS[mod[0].lower()][0])
                    for row in rows:
                        for high in (False, True):
                            v = affix_values(a, row, high, weapon, base_vals)
                            got = {s: line(s, v) for s in sets}
                            n += 1
                            where = (f"{name} / {kname} ({first['name']}), affix level {alvl}, {a['name']} at its "
                                     f"{'highest' if high else 'lowest'} roll ({ROW[row][1]})")
                            if got["head"] != got["off"]:
                                problems.append(f"{where}: aliases off {got['off']!r}, last commit {got['head']!r}")
                            if line("head", v, "MAG") != line("off", v, "MAG"):
                                problems.append(f"{where}, as a magic item: changed with the aliases off")
                            low = alvl < CUT and row in ALIASES and picks[key].get(row) and \
                                not (key in WEAPON_CARDS and row in FRESH_ONLY_ON_WEAPONS)
                            wrule = (key in NONCASTER_CARDS and row in FRESH_WEAPON_ROWS
                                     and not (row in WEAPON_LOW_ONLY and alvl >= CUT)
                                     and (row not in WEAPON_GATE or alvl < CUT or v.get("ED", 0) > 99)) or \
                                (row in FRESH_CASTER_ROWS and bool(groups & {"CLUB", "STAFF", "WAND", "SOR"}))
                            if not (low or wrule):
                                if got["now"] != got["off"]:
                                    problems.append(f"{where}: not picked, but {got['off']!r} -> {got['now']!r}")
                                continue
                            look = look_of(a, row)
                            shown = look and roll_value(a, row, high) >= MIN_ROLL.get(row, 1)
                            want = Counter(vis(LC.apply(look, "", v, first["name"])).split()) if shown else Counter()
                            before, after = Counter(got["off"].split()), Counter(got["now"].split())
                            had = all(before[t] >= c for t, c in want.items())
                            if after != (before if had else before + want):
                                problems.append(f"{where}: {got['off']!r} -> {got['now']!r}, wanted "
                                                f"{' '.join(want.elements())!r} once")
                            if high:
                                for c in CORRUPTIONS.get(row, []):
                                    now = Counter(line("now", dict(v, STAT360=c)).split())
                                    twice = [t for t in want if now[t] > 1]
                                    if twice:
                                        problems.append(f"{where}, corruption {c}: {' '.join(twice)} twice")
                                # socketed, and a weapon's fresh tags corrupted too (an outcome these lines don't
                                # count): as without the low-level tags, but a weapon's demons / undead from 100
                                any_time = wrule and row in WEAPON_ANY_TIME and roll_value(a, row, high) > 99
                                cases = [("socketed", dict(v, GEMMED=1))] if row in SOCKETED or (wrule and not low) \
                                    else []
                                cases += [("corrupted", dict(v, STAT360=6))] if wrule and not low else []
                                for what, g in cases:
                                    b, n_ = Counter(line("off", g).split()), Counter(line("now", g).split())
                                    keep = any_time and not all(b[t] >= c for t, c in want.items())
                                    if n_ != (b + want if keep else b):
                                        problems.append(f"{where}, {what}: {line('off', g)!r} -> "
                                                        f"{line('now', g)!r}")
                # min and max damage together: one N-Mdmg whenever both show (5-3dmg too, the author), never the two
                # tags apart; at character level 50 and 85 (rings and helms change at 80)
                pick = lambda r: [a for a in mine if any(PROPS[m[0].lower()][0] == r for m in a["mods"])]
                for a1 in pick("min"):
                    for a2 in pick("max"):
                        for h1, h2, clvl in ((True, True, VIEWER), (False, True, VIEWER), (True, False, VIEWER),
                                             (True, True, 85), (False, True, 85)):
                            v = dict(affix_values(a1, "min", h1, weapon, base_vals), CLVL=clvl)
                            for w, x in affix_values(a2, "max", h2, weapon, {}).items():
                                if w not in ("SUFFIX", "PREFIX"):
                                    v[w] = v.get(w, 0) + x
                            toks = line("now", with_derived(v)).split()
                            mn = [int(t[:-3]) for t in toks if re.fullmatch(r"\d+min", t)]
                            mx = [int(t[:-3]) for t in toks if re.fullmatch(r"\d+max", t)]
                            jn = [tuple(map(int, t[:-3].split("-"))) for t in toks if re.fullmatch(r"\d+-\d+dmg", t)]
                            if len(mn) > 1 or len(mx) > 1 or len(jn) > 1 or (jn and (mn or mx)) or (mn and mx):
                                problems.append(f"{name} / {kname}, affix level {alvl}, character level {clvl}, "
                                                f"{a1['name']} with {a2['name']}: {' '.join(toks)!r}")
                            n += 1
            base_vals = base_values(codes[0], first, groups, CUT - 1)
            lengths = {}
            for s in ("off", "now"):
                fold = sets[s].folded(codes[0], groups, base_vals)
                sides = {"prefix": {}, "suffix": {}}
                for a in mine:
                    t = vis(sets[s].tagline(fold, codes[0], groups, full_values([a], weapon, base_vals),
                                            first["name"])[0])
                    g = a["group"] or a["row"]
                    if t and len(t) > len(sides[a["kind"]].get(g, ("",))[0]):
                        sides[a["kind"]][g] = (t, a)
                chosen = [a for side in sides.values() for _, a in sorted(side.values(), key=lambda x: -len(x[0]))[:3]]
                lengths[s] = vis(sets[s].tagline(fold, codes[0], groups, full_values(chosen, weapon, base_vals),
                                                 first["name"])[0])
            longest = max((bases[c]["name"] for c in codes), key=len)
            if best is None or len(lengths["now"]) > len(best[1]):
                best = (kname, lengths["now"], lengths["off"], longest)
        if best:
            measures.append((name,) + best)
    print(f"{n} samples checked")
    for name, kname, now, off, longest in measures:
        room = LC.NAME_MAX - len(now) - 1 - len(longest) - 1
        print(f"  {name}: longest tag line {len(now)} characters ({kname}; {len(off)} without the low-level tags): "
              f"{now}")
        print(f"    beside its longest base name ({longest}) that leaves {room} for the rare's own name")
    if problems:
        print(f"{len(problems)} problem(s):")
        for p in problems[:80]:
            print("  " + p)
        return 1
    print("no problems")
    return 0


def write_page():
    data = page_data()
    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = TEMPLATE.read_text(encoding="utf-8")
    PAGE.write_text(html.replace("/*__DATA__*/null", blob), encoding="utf-8", newline="\n")
    print(f"wrote {PAGE.relative_to(ROOT)} ({PAGE.stat().st_size // 1024} KB)")


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--check", action="store_true", help="exit 1 if the section is not what the picks make")
    ap.add_argument("--page", action="store_true", help="write tools/low_level_tags.html")
    ap.add_argument("--apply", metavar="FILE", help="take the page's db documents (JSON) into the picks file")
    ap.add_argument("--verify", action="store_true", help="check the built rules and measure the longest labels")
    ap.add_argument("--dump", metavar="CARD", help="print a card's rows (what the page shows), for checking")
    args = ap.parse_args()
    if args.apply:
        apply(args.apply)
        return 0
    if args.verify:
        return verify()
    if args.dump:
        data = page_data()
        rows = {r["key"]: r for r in data["rows"]}
        card = next(c for c in data["cards"] if c["key"] == args.dump)
        print(f"{card['name']}: {', '.join(k['name'] for k in card['kinds'])}; below affix level {CUT} up to item "
              f"level {card['reach']} ({card['reachBase']})")
        for r in card["rows"]:
            for k in r["kinds"]:
                tags = sorted({"".join(s[1] for s in data["segs"][e[2]]) for e in k["aff"] if e[2] >= 0})
                print(f"  {rows[r['key']]['label']:<32} {card['kinds'][k['k']]['name']:<18} {k['st']:<5} "
                      f"{k['from'] if k['from'] is not None else '':<4} bands {k['bands']} look {k['look']} "
                      f"today {', '.join(tags[:4])}")
        return 0
    if args.page:
        write_page()
        return 0
    bases, affixes = T.load_bases(), load_affixes()
    eligible = card_rows(bases, affixes)
    text = render_section(load_picks(eligible), eligible)
    if args.check:
        problems = check_aliases()
        if not SECTION.exists() or SECTION.read_bytes() != text:
            problems.insert(0, f"{SECTION.relative_to(ROOT)} is not what {PICKS.relative_to(ROOT)} makes: "
                               "run python tools/low_level_tags.py")
        for x in problems:
            print(x, file=sys.stderr)
        if problems:
            return 1
        print("low-level rare tags up to date")
        return 0
    if SECTION.exists() and SECTION.read_bytes() == text:
        print("updated: nothing")
        return 0
    SECTION.write_bytes(text)
    print(f"updated: {SECTION.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
