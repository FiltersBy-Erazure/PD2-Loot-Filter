#!/usr/bin/env python3
"""
Generate the unique/set variable-roll tags.

An identified unique or set item shows its most important variable rolls (2, sometimes 3, as space
allows) as tags under its name, next to a corruption tag, in the item's affix order. The tags are the
existing tag lines in sections/300-affix-tags.filter: each relevant line has `OR ROLL_<X>_TAG` in its
gate. This tool writes those aliases. ROLL_<X>_TAG lists the uniques/sets that show tag <X>, each by a
fingerprint: the base codes it can have (its own tier and the tiers it can be upgraded to) plus the fewest
stats that tell it apart from every other unique (or set item) that can have one of those codes.

    python tools/gen_unique_rolls.py             update the picks file, write the generated section
    python tools/gen_unique_rolls.py --check     change nothing; exit 1 if either is out of date
    python tools/gen_unique_rolls.py --report [NAME]   candidates, picks and fingerprint per item

Inputs: docs/items/*.wiki (python tools/item_data.py fetch) and tools/unique_roll_picks.txt.
In the picks file, a line ending in "# auto ..." is the generator's default and is rewritten each run;
remove "auto" from a line (or write your own) to keep it. Output: sections/045-unique-set-rolls.filter.
Unique charms and jewels are left out: their tags live in 240-charms and 250-jewels.
"""
import argparse
import datetime
import json
import os
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import item_data  # noqa: E402

ROOT = item_data.ROOT
PICKS = ROOT / "tools" / "unique_roll_picks.txt"
OUT = ROOT / "sections" / "045-unique-set-rolls.filter"
FILTER_WIKI = ROOT / "docs" / "pd2-item-filtering.wiki"
# Name budget (BH shows 56 characters): unique name + line break + base name, the line break that
# 300-affix-tags adds before the tags (%CL%), one corruption tag, and " N" for sockets (210-nonmagic-armor)
# on items that can have them. This is the usual case, by the author's choice (2026-10-04): "Eth " and
# corruptions that add two tags (e.g. "10fcr 5%dmg", "Ind 60ed") are rarer and may occasionally cut the
# end of a long name; reserving for them as well would leave most items a single tag.
# Amulets can be corrupted and desecrated (STAT206), so they keep room for two such tags.
NAME_MAX, LINE_BREAK, CORRUPTION_RESERVE, SOCKET_RESERVE, MAX_PICKS = 56, 1, 8, 2, 3
CORRUPTION_TAGS = {"amu": 2}  # how many corruption-type tags a slot can carry (default 1)
SOCKET_SLOTS = {"WEAPON", "HELM", "CIRC", "CHEST", "SHIELD"}  # gloves, belts, boots, jewelry: no sockets
PICKER = ROOT / "tools" / "roll_picker.html"
PICKER_TEMPLATE = ROOT / "tools" / "roll_picker_template.html"
WEAPON_PAGES = {"Axes", "Maces", "Swords", "Daggers", "Throwing", "Spears", "Polearms", "Bows",
                "Crossbows", "Scepters", "Staves", "Wands", "Class_Weapons"}
CASTER_PAGES = {"Scepters", "Staves", "Wands"}
SKIP_PAGES = {"Charms"}  # unique charms and jewels: done by hand in 240-charms / 250-jewels
CLASSES = ["Amazon", "Sorceress", "Necromancer", "Paladin", "Barbarian", "Druid", "Assassin"]

# ---------------------------------------------------------------- tags
# key: (alias, filter code, label as shown, where it applies: W weapons, A everything else, WA both)
TAGS = {
    "allsk": ("ROLL_ALLSK_TAG", "ALLSK", "allsk", "WA"),
    **{f"clsk{i}": (f"ROLL_CLSK{i}_TAG", f"CLSK{i}", "ama sor nec pal bar dru sin".split()[i], "WA")
       for i in range(7)},
    "tabsk": ("ROLL_TABSK_TAG", "TABSK", "tab", "WA"),  # one alias for all skill tabs
    "ed": ("ROLL_ED_TAG", "ED", "ed", "WA"),
    "ias": ("ROLL_IAS_TAG", "IAS", "ias", "WA"),
    "fcr": ("ROLL_FCR_TAG", "FCR", "fcr", "WA"),
    "fhr": ("ROLL_FHR_TAG", "FHR", "fhr", "A"),
    "frw": ("ROLL_FRW_TAG", "FRW", "frw", "A"),
    "fbr": ("ROLL_FBR_TAG", "FBR", "fbr", "A"),
    "min": ("ROLL_MINDMG_TAG", "MINDMG", "min", "WA"),
    "max": ("ROLL_MAXDMG_TAG", "MAXDMG", "max", "WA"),
    "ds": ("ROLL_DS_TAG", "STAT141", "ds", "WA"),
    "cb": ("ROLL_CB_TAG", "STAT136", "cb", "WA"),
    "-fres": ("ROLL_EFRES_TAG", "STAT333", "%res", "WA"),
    "-lres": ("ROLL_ELRES_TAG", "STAT334", "%res", "WA"),
    "-cres": ("ROLL_ECRES_TAG", "STAT335", "%res", "WA"),
    "-pres": ("ROLL_EPRES_TAG", "STAT336", "%res", "WA"),
    "ls": ("ROLL_LS_TAG", "STAT60", "ls", "WA"),
    "ms": ("ROLL_MS_TAG", "STAT62", "ms", "WA"),
    "lpk": ("ROLL_LPK_TAG", "STAT86", "lpk", "WA"),
    "mpk": ("ROLL_MPK_TAG", "STAT138", "mpk", "WA"),
    "mf": ("ROLL_MF_TAG", "MFIND", "mf", "WA"),
    "gf": ("ROLL_GF_TAG", "GFIND", "gf", "A"),
    "ar": ("ROLL_AR_TAG", "AR", "ar", "WA"),
    "ar%": ("ROLL_ARPER_TAG", "STAT119", "%ar", "WA"),
    "dem": ("ROLL_DEM_TAG", "STAT121", "dem", "W"),
    "und": ("ROLL_UND_TAG", "STAT122", "und", "W"),
    "fdmg": ("ROLL_FSKD_TAG", "STAT329", "dmg", "WA"),
    "ldmg": ("ROLL_LSKD_TAG", "STAT330", "dmg", "WA"),
    "cdmg": ("ROLL_CSKD_TAG", "STAT331", "dmg", "WA"),
    "pdmg": ("ROLL_PSKD_TAG", "STAT332", "dmg", "WA"),
    "res": ("ROLL_RES_TAG", "RES", "res", "A"),
    "fres": ("ROLL_FRES_TAG", "FRES", "res", "A"),
    "lres": ("ROLL_LRES_TAG", "LRES", "res", "A"),
    "cres": ("ROLL_CRES_TAG", "CRES", "res", "A"),
    "pres": ("ROLL_PRES_TAG", "PRES", "res", "A"),
    "maxfr": ("ROLL_MAXFR_TAG", "STAT40", "maxres", "A"),
    "maxlr": ("ROLL_MAXLR_TAG", "STAT42", "maxres", "A"),
    "maxcr": ("ROLL_MAXCR_TAG", "STAT44", "maxres", "A"),
    "maxpr": ("ROLL_MAXPR_TAG", "STAT46", "maxres", "A"),
    "life": ("ROLL_LIFE_TAG", "LIFE", "life", "A"),
    "mana": ("ROLL_MANA_TAG", "MANA", "mana", "A"),
    "str": ("ROLL_STR_TAG", "STR", "str", "A"),
    "dex": ("ROLL_DEX_TAG", "DEX", "dex", "A"),
    "vit": ("ROLL_VIT_TAG", "STAT3", "vit", "A"),
    "nrg": ("ROLL_NRG_TAG", "STAT1", "nrg", "A"),
    "mdr": ("ROLL_MDR_TAG", "STAT35", "mdr", "A"),
    "pdr%": ("ROLL_PDR_TAG", "STAT36", "pdr", "A"),   # Physical Damage Taken Reduced by N%
    "pdr": ("ROLL_PDRF_TAG", "STAT34", "pdr", "A"),   # Physical Damage Taken Reduced by N (flat)
    "replife": ("ROLL_REPLIFE_TAG", "STAT74", "replife", "A"),
    "regen": ("ROLL_REGEN_TAG", "STAT27", "regen", "A"),
    "cr": ("ROLL_CR_TAG", "STAT504", "cr", "A"),
    "dtm": ("ROLL_DTM_TAG", "DTM", "dtm", "A"),
}
CLSK_KEYS = [f"clsk{i}" for i in range(7)]
# Which item slots the 300-affix-tags lines that use each alias cover (keep in sync when wiring lines)
ALL = {"WEAPON", "HELM", "CIRC", "CHEST", "SHIELD", "GLOVES", "BOOTS", "BELT", "QUIVER", "amu", "rin"}
SKILL_SLOTS = {"WEAPON", "amu", "CIRC", "HELM", "CHEST", "SHIELD"}
RES_SLOTS = ALL - {"WEAPON"}
COVER = {
    "allsk": ALL, **{k: SKILL_SLOTS for k in CLSK_KEYS}, "tabsk": SKILL_SLOTS,
    "ed": {"WEAPON", "CHEST", "GLOVES", "HELM", "CIRC", "BOOTS"},
    "ias": {"WEAPON", "GLOVES", "BELT", "HELM", "QUIVER"},
    "fcr": {"WEAPON", "rin", "amu", "CIRC", "GLOVES", "BELT", "CHEST", "SHIELD"},
    "fhr": {"amu", "CIRC", "HELM", "CHEST", "SHIELD", "BELT", "BOOTS", "QUIVER"},
    "frw": {"BOOTS", "rin", "BELT", "CHEST", "amu", "QUIVER"},
    "fbr": {"GLOVES", "BOOTS", "BELT", "SHIELD"},
    "min": {"rin", "HELM", "QUIVER"}, "max": {"rin", "HELM", "QUIVER"},
    "ds": {"WEAPON", "GLOVES", "HELM"}, "cb": {"WEAPON", "GLOVES", "HELM"},
    "-fres": {"WEAPON", "QUIVER"}, "-cres": {"WEAPON", "QUIVER"}, "-lres": {"WEAPON"}, "-pres": {"WEAPON"},
    "ls": ALL - {"CHEST", "SHIELD"}, "ms": ALL - {"CHEST", "SHIELD", "WEAPON"},
    "lpk": {"WEAPON", "rin"}, "mpk": {"WEAPON", "rin"},
    "mf": ALL, "gf": {"rin", "amu", "CIRC", "HELM", "BELT", "BOOTS", "GLOVES", "QUIVER"},
    "ar": {"WEAPON", "GLOVES", "BELT", "rin", "QUIVER"},
    "ar%": {"GLOVES", "rin", "amu", "CIRC", "HELM", "CHEST"},
    "fdmg": {"WEAPON"}, "ldmg": {"WEAPON"}, "cdmg": {"WEAPON"}, "pdmg": {"WEAPON"},
    "res": RES_SLOTS, "fres": RES_SLOTS, "lres": RES_SLOTS, "cres": RES_SLOTS, "pres": RES_SLOTS,
    **{k: {"BOOTS", "CHEST", "SHIELD", "HELM", "CIRC"} for k in ("maxfr", "maxlr", "maxcr", "maxpr")},
    "life": {"rin", "SHIELD", "BOOTS", "GLOVES", "QUIVER"}, "mana": {"CHEST"},
    **{k: {"rin", "amu", "CIRC", "HELM", "BELT", "BOOTS", "GLOVES"} for k in ("str", "dex", "vit", "nrg")},
    "mdr": {"rin", "CHEST", "SHIELD"}, "pdr": {"rin", "CHEST", "SHIELD"},
    "pdr%": {"CHEST", "SHIELD", "rin", "BOOTS", "BELT", "HELM", "CIRC"},
    "replife": ALL, "regen": ALL,
    "cr": {"amu", "BOOTS", "BELT", "rin", "HELM", "CIRC", "CHEST", "SHIELD", "QUIVER"},
    "dtm": {"rin", "amu", "CIRC", "HELM", "CHEST", "SHIELD", "BELT", "BOOTS", "GLOVES"},
}
PAGE_SLOT = {"Helms": "HELM", "Chests": "CHEST", "Shields": "SHIELD", "Gloves": "GLOVES", "Boots": "BOOTS",
             "Belts": "BELT", "Quivers": "QUIVER", "Amulets": "amu", "Rings": "rin"}
PRIORITY = {  # default pick order; the author's lines in the picks file override it per item
    "W": ["allsk", *CLSK_KEYS, "tabsk", "ed", "ias", "fcr", "min", "max", "ds", "cb",
          "-fres", "-lres", "-cres", "-pres", "ls", "ms", "lpk", "mpk", "mf", "ar",
          "ar%", "dem", "und", "fdmg", "ldmg", "cdmg", "pdmg"],
    "A": ["allsk", *CLSK_KEYS, "tabsk", "fcr", "fhr", "frw", "fbr", "res", "maxfr", "maxlr", "maxcr",
          "maxpr", "fres", "lres", "cres", "pres", "life", "mana", "mf", "gf", "str", "dex", "vit", "nrg",
          "ls", "ms", "lpk", "mpk", "mdr", "pdr%", "pdr", "replife", "regen", "cr", "dtm", "ar", "ar%", "ias",
          "min", "max", "ds", "cb", "fdmg", "ldmg", "cdmg", "pdmg", "ed"],
}
CODE_TO_TAG = {}
for key, (_, code, _, _) in TAGS.items():
    CODE_TO_TAG.setdefault(code, key)

# ---------------------------------------------------------------- stat text -> codes
V = r"(?P<v>-?\[-?\d+(?:\.\d+)?--?\d+(?:\.\d+)?\]|-?\d+(?:\.\d+)?)"  # 5, [5-10], -[5-10]
SIMPLE = [  # (pattern with V for the value, codes that get the value)
    (r"\+V% Enhanced Damage", ["ED"]), (r"\+V% Enhanced Defense", ["ED"]),
    (r"\+V Defense", ["DEF"]),
    (r"All Resistances \+V%?", ["RES", "FRES", "CRES", "LRES", "PRES"]),
    (r"Fire Resist \+V%", ["FRES"]), (r"Cold Resist \+V%", ["CRES"]),
    (r"Lightning Resist \+V%", ["LRES"]), (r"Poison Resist \+V%", ["PRES"]),
    (r"\+V to Strength", ["STR"]), (r"\+V to Dexterity", ["DEX"]),
    (r"\+V to Vitality", ["STAT3"]), (r"\+V to Energy", ["STAT1"]),
    (r"\+V to All Attributes", ["ALLATTRIB", "STR", "DEX", "STAT3", "STAT1"]),
    (r"V% Life Stolen per Hit", ["STAT60"]), (r"V% Mana Stolen per Hit", ["STAT62"]),
    (r"\+V to Attack Rating", ["AR"]), (r"V% Bonus to Attack Rating", ["STAT119"]),
    (r"Magic Damage Taken Reduced by V", ["STAT35"]),
    (r"Physical Damage Taken Reduced by V%", ["STAT36"]),
    (r"Physical Damage Taken Reduced by V", ["STAT34"]),
    (r"Replenish Life \+V", ["STAT74"]), (r"Regenerate Mana V%", ["STAT27"]),
    (r"V% Better Chance of Getting Magic Items", ["MFIND"]), (r"V% Extra Gold from Monsters", ["GFIND"]),
    (r"\+V Life after each Kill", ["STAT86"]), (r"\+V to Mana after each Kill", ["STAT138"]),
    (r"Attacker Takes Damage of V", ["STAT78"]),
    (r"\+V to Life", ["LIFE"]), (r"\+V to Mana", ["MANA"]),
    (r"Increase Maximum Life V%", ["STAT76"]), (r"Increase Maximum Mana V%", ["STAT77"]),
    (r"\+V% Damage to Demons", ["STAT121"]), (r"\+V% Damage to Undead", ["STAT122"]),
    (r"\+V to Attack Rating against Demons", ["STAT123"]), (r"\+V to Attack Rating against Undead", ["STAT124"]),
    (r"-V% to Enemy Fire Resistance", ["STAT333"]), (r"-V% to Enemy Lightning Resistance", ["STAT334"]),
    (r"-V% to Enemy Cold Resistance", ["STAT335"]), (r"-V% to Enemy Poison Resistance", ["STAT336"]),
    (r"-V% to Enemy Physical Resistance", ["STAT425"]),
    (r"\+V% Deadly Strike", ["STAT141"]), (r"\+V% Chance of Crushing Blow", ["STAT136"]),
    (r"V% Chance of Open Wounds", ["STAT135"]), (r"\+V Open Wounds Damage per Second", ["STAT501"]),
    (r"\+V% to Maximum Fire Resist", ["STAT40"]), (r"\+V% to Maximum Lightning Resist", ["STAT42"]),
    (r"\+V% to Maximum Cold Resist", ["STAT44"]), (r"\+V% to Maximum Poison Resist", ["STAT46"]),
    (r"Curse Resistance \+V%", ["STAT504"]), (r"V% Reduced Curse Duration", ["STAT109"]),
    (r"\+V to Minimum Damage", ["MINDMG"]), (r"\+V to Maximum Damage", ["MAXDMG"]),
    (r"\+V% to Fire Skill Damage", ["STAT329"]), (r"\+V% to Lightning Skill Damage", ["STAT330"]),
    (r"\+V% to Cold Skill Damage", ["STAT331"]), (r"\+V% to Poison Skill Damage", ["STAT332"]),
    (r"\+V% to Magic Skill Damage", ["STAT357"]),
    (r"\+?V% Increased Attack Speed", ["IAS"]), (r"\+?V% Faster Cast Rate", ["FCR"]),
    (r"\+?V% Faster Hit Recovery", ["FHR"]), (r"\+?V% Faster Run/Walk", ["FRW"]),
    (r"\+?V% Faster Block Rate", ["FBR"]), (r"V% Increased Chance of Blocking", ["STAT20"]),
    (r"V% Damage Taken Gained as Mana when Hit", ["DTM"]),
    (r"\+V% Chance to Pierce", ["STAT156"]),
    (r"\+V to All Skills", ["ALLSK"]),
    (r"\+V to Light Radius", ["STAT89"]),
    (r"Requirements V%", ["STAT91"]),
]
FLAGS = {"Hit Blinds Target": "STAT113", "Cannot Be Frozen": "STAT153", "Prevent Monster Heal": "STAT117",
         "Ignore Target's Defense": "STAT115", "Knockback": "STAT81", "Indestructible": "STAT152",
         "Half Freeze Duration": "STAT118"}
CTC_EVENTS = {"on attack": 195, "when you kill an enemy": 196, "on kill": 196, "when you die": 197,
              "on death": 197, "on striking": 198,
              "on level-up": 199, "on casting": 200, "when struck": 201, "on block": 202}
# fingerprint preference: 1 = can neither be socketed nor come from a corruption (skills, procs, a few
# flags); 2 = possible from a corruption or sockets; 3 = common or tier-dependent. An item has at most one
# corruption, so a rival counts as ruled out once a weight-1 stat, or two other stats, exclude it.
WEIGHT1 = re.compile(r"^(SK|OS|CLSK|TABSK|MULTI)|^STAT(113|117|81)$")
WEIGHT3 = re.compile(r"^(ED|STAT89|STAT20)$")
UNRELIABLE = {"DEF"}  # total defense also depends on the base tier and ethereal: never a fingerprint


def wiki_skill_ids():
    """{skill name: id}, {tab name: TABSK id}, {(class, tab name): TABSK id} from the filtering wiki's skill
    tables (cells may start with a style="..." | prefix)."""
    skills, tabs, class_tabs = {}, {}, {}
    for line in FILTER_WIKI.read_text(encoding="utf-8").splitlines():
        cells = [re.sub(r"<[^>]+>|^\s*style=\"[^\"]*\"\s*\|", "", c).strip() for c in line.lstrip("|").split("||")]
        if len(cells) >= 2 and re.fullmatch(r"SK\d+", cells[0]):
            skills[cells[1].lower()] = int(cells[0][2:])
        if len(cells) >= 3 and re.fullmatch(r"TABSK\d+", cells[0]):
            tabs[cells[2].lower()] = cells[0]
            class_tabs[(cells[1].lower(), cells[2].lower())] = cells[0]
    return skills, tabs, class_tabs


SKILLS, TABS, CLASS_TABS = wiki_skill_ids()


def value_range(v):
    m = re.fullmatch(r"(-?)\[(-?[\d.]+)-(-?[\d.]+)\]", v)
    if m and m.group(1):  # -[5-10]: from -10 to -5
        return -int(float(m.group(3))), -int(float(m.group(2)))
    lo, hi = (float(m.group(2)), float(m.group(3))) if m else (float(v), float(v))
    return int(lo), int(hi)


def wiki_stat_patterns():
    """[(regex, code)] from the filtering wiki's numbered attribute table ("| STAT0 || +N to Strength"):
    the item text with N, X and Y as numbers. Used when no hand-written pattern matches."""
    out = []
    for line in FILTER_WIKI.read_text(encoding="utf-8").splitlines():
        cells = [re.sub(r"<[^>]+>|^\s*style=\"[^\"]*\"\s*\|", "", c).strip() for c in line.lstrip("|").split("||")]
        if len(cells) < 2 or not re.fullmatch(r"STAT\d+", cells[0]) or not cells[1] or cells[1].startswith("''"):
            continue
        text = re.sub(r"\s*\(.*?\)\s*$", "", cells[1])  # drop notes like "(Based on Character Level)"
        parts, first = [], True
        for tok in re.split(r"(\b[NXY]\b)", text):
            if re.fullmatch(r"[NXY]", tok):
                parts.append(V if first else r"(?:\[-?[\d.]+-?-?[\d.]+\]|-?[\d.]+)")
                first = False
            else:
                parts.append(re.escape(tok))
        if not first:
            out.append((re.compile("".join(parts), re.I), cells[0]))
    return out


WIKI_STATS = wiki_stat_patterns()
TAB_ALIASES = {"masteries": "combat masteries", "poison and bone spells": "poison & bone spells",
               "poison and bone skills": "poison & bone spells",
               "fire skills": "fire spells", "cold skills": "cold spells", "lightning skills": "lightning spells"}
TEXT_FIXES = [(r"Damaged Taken", "Damage Taken"), (r"Enhance Defense", "Enhanced Defense"),
              (r"Stolen Her Hit", "Stolen per Hit"), (r"^Regenerate Mana \+", "Regenerate Mana "),
              (r"% Enemy (\w+) Resistance$", r"% to Enemy \1 Resistance"), (r"Absorb \+", "Absorb "),
              (r"^\+(\S+)% (Fire|Cold|Lightning|Poison) Resist$", r"\2 Resist +\1%"),
              (r"(Fire|Cold|Lightning|Poison)Resist", r"\1 Resist"), (r" \(Cold Duration: [^)]*\)$", ""),
              (r"^\+([^%\s]+) Enhanced Damage$", r"+\1% Enhanced Damage")]
AUTHOR_CODES = [  # (stat text with # for each number, filter code): codes the wiki tables lack, looked up by the author
    ("+#% Leap and Leap Attack Movement Speed", "STAT423"),  # wiki: "+N% to Leap and Leap Attack Movement Speed"
]
# "Adds X to Y <element> Damage": (minimum code, maximum code), from the wiki's attribute table
ADDS_DAMAGE = {"": ("MINDMG", "MAXDMG"), "fire": ("STAT48", "STAT49"), "lightning": ("STAT50", "STAT51"),
               "magic": ("STAT52", "STAT53"), "cold": ("STAT54", "STAT55")}
AUTHOR_STATS = [(re.compile(V.join(re.escape(p) for p in text.split("#", 1)).replace(
                     re.escape("#"), r"(?:\[-?[\d.]+-?-?[\d.]+\]|-?[\d.]+)"), re.I), code)
                for text, code in AUTHOR_CODES]


def parse_stat(text):
    """[(code, lo, hi)] for one stat line, or [] when the line has no filter code."""
    if re.search(r"per Character Level|Based on Character Level|\(\d+ Items\)", text, re.I):
        return []
    for wrong, right in TEXT_FIXES:  # wording slips on the wiki
        text = re.sub(wrong, right, text)
    if text in FLAGS:
        return [(FLAGS[text], 1, 1)]
    for pat, codes in SIMPLE:
        rx = re.sub(r"(?<![A-Za-z])V(?![A-Za-z])", lambda _: V, pat).replace(r"\+", r"\+?")
        m = re.fullmatch(("" if pat.startswith(("\\+", "-")) else r"\+?") + rx, text, re.I)
        if m:
            lo, hi = value_range(m.group("v"))
            return [(c, lo, hi) for c in codes]
    m = re.fullmatch(r"Adds " + V + r"(?: to (?P<v2>\[-?[\d.]+-?-?[\d.]+\]|-?[\d.]+))? ?(Fire|Lightning|Magic|Cold)? Damage",
                     text, re.I)
    if m:  # flat damage: the maximum is the roll that matters, the minimum goes along for fingerprints
        lo1, hi1 = value_range(m.group("v"))
        lo2, hi2 = value_range(m.group("v2")) if m.group("v2") else (lo1, hi1)
        mn, mx = ADDS_DAMAGE[(m.group(3) or "").lower()]
        return [(mx, lo2, hi2), (mn, lo1, hi1)]
    m = re.fullmatch(r"\+" + V + r" to (Fire|Lightning|Magic|Cold|Poison) Skills", text)
    if m:  # elemental skills: MULTI126,<element> (1 fire, 2 lightning, 3 magic, 4 cold, 5 poison)
        lo, hi = value_range(m.group("v"))
        return [(f"MULTI126,{['Fire', 'Lightning', 'Magic', 'Cold', 'Poison'].index(m.group(2)) + 1}", lo, hi)]
    m = re.fullmatch(r"\+" + V + r" to (\w+) Skill(?:s| Levels)", text)
    if m and m.group(2) in CLASSES:
        lo, hi = value_range(m.group("v"))
        return [(f"CLSK{CLASSES.index(m.group(2))}", lo, hi)]
    m = re.fullmatch(r"\+" + V + r" to (.+?)(?: \((\w+) Only\))?", text)
    if m:  # a skill tab or a single skill, with or without "(Class Only)"
        lo, hi = value_range(m.group("v"))
        name, cls = m.group(2).lower(), (m.group(3) or "").lower()
        names = [name, TAB_ALIASES.get(name, ""), re.sub(r" skills$", "", name), re.sub(r" skills$", " spells", name),
                 name + " skills", name + " spells"]
        for cand in names:
            if cls and (cls, cand) in CLASS_TABS:
                return [(CLASS_TABS[(cls, cand)], lo, hi)]
            if not cls and cand in TABS:
                return [(TABS[cand], lo, hi)]
        if name in SKILLS:
            return [(f"SK{SKILLS[name]}", lo, hi)]
    m = re.fullmatch(V + r"% Chance to cast level (\d+) (.+?) (" + "|".join(CTC_EVENTS) + ")", text, re.I)
    if m and m.group(3).lower() in SKILLS:
        param = SKILLS[m.group(3).lower()] * 64 + int(m.group(2))
        return [(f"MULTI{CTC_EVENTS[m.group(4).lower()]},{param}", 1, 1)]
    m = re.fullmatch(r"Level (\d+) (.+?) \(\d+/\d+ Charges\)", text, re.I)
    if m and m.group(2).lower() in SKILLS:
        return [(f"MULTI204,{SKILLS[m.group(2).lower()] * 64 + int(m.group(1))}", 1, 1)]
    m = re.fullmatch(r"Level " + V + r" (.+?) Aura When Equipped", text, re.I)
    if m and m.group(2).lower() in SKILLS:
        lo, hi = value_range(m.group("v"))
        return [(f"MULTI151,{SKILLS[m.group(2).lower()]}", lo, hi)]
    m = re.fullmatch(r"Socketed \(?" + V + r"\)?", text, re.I)
    if m:
        lo, hi = value_range(m.group("v"))
        return [("SOCK", lo, hi)]
    for rx, code in AUTHOR_STATS + WIKI_STATS:
        m = rx.fullmatch(text)
        if m:
            lo, hi = value_range(m.group("v"))
            return [(code, lo, hi)]
    return []


# ---------------------------------------------------------------- items, fingerprints, picks

class Item:
    def __init__(self, raw, families):
        self.kind, self.name, self.page, self.base = raw["kind"], raw["name"], raw["page"], raw["base"]
        family = raw["codes"]
        tier_names = families["__names__"]
        own_code = next((c for c in family if item_data.norm(tier_names.get(c, "")) == item_data.norm(self.base)),
                        family[0] if family else None)
        self.codes = family[family.index(own_code):] if own_code in family else family
        self.base_names = [tier_names.get(c, self.base) for c in self.codes]
        self.weapon = self.page in WEAPON_PAGES
        self.slot = "W" if self.weapon else "A"
        self.where = "WEAPON" if self.weapon else PAGE_SLOT.get(self.page)
        if any(c.startswith("ci") for c in self.codes):
            self.where = "CIRC"
        if self.where is None:  # set items: the slot of the base family, learnt from the uniques
            self.where = CODE_SLOT.get(self.codes[0]) if self.codes else None
        self.caster = self.page in CASTER_PAGES or any(c.startswith("ob") for c in self.codes)
        self.stats = {}  # code -> (lo, hi), all current stat lines with a filter code
        for line in raw["stats"]:
            for code, lo, hi in parse_stat(line):
                old = self.stats.get(code)
                self.stats[code] = (lo + (old[0] if old else 0), hi + (old[1] if old else 0))
        self.raw_stats = raw["stats"]
        self.rolls = {}      # key -> (lo, hi): variable rolls the filter can show as a tag on this item
        self.all_rolls = []  # every variable roll: key (None = no filter code), lo, hi, line, tagged
        for line in raw["rolls"]:
            parsed = parse_stat(line)[:1]  # one roll, one tag: All Resistances is res, not five tags
            if not parsed:
                self.all_rolls.append({"key": None, "lo": 0, "hi": 0, "line": line, "tagged": False})
                continue
            code, lo, hi = parsed[0]
            key = roll_key(code)
            if any(r["key"] == key for r in self.all_rolls):
                continue
            tagged = key in TAGS and self.covers(key)
            self.all_rolls.append({"key": key, "lo": lo, "hi": hi, "line": line, "tagged": tagged})
            if tagged:
                self.rolls[key] = (lo, hi)
        self.unmapped = [r["line"] for r in self.all_rolls if not r["tagged"]]
        self.fingerprint, self.unresolved, self.weak = [], [], []

    def roll(self, key):
        return next((r for r in self.all_rolls if r["key"] == key), None)

    def covers(self, key):
        return TAGS[key][0] in USED and self.where in COVER.get(key, ())

    @property
    def key(self):
        return f"{self.kind} {self.name}"


def used_aliases():
    """ROLL_*_TAG names that some section (other than the generated one) uses in a condition."""
    used = set()
    for f in sorted((ROOT / "sections").glob("*.filter")):
        if f.name != OUT.name:
            used.update(re.findall(r"\bROLL_[A-Z0-9]+_TAG\b", f.read_text(encoding="utf-8")))
    return used


USED = used_aliases()
CODE_SLOT = {}


def roll_key(code):
    """The picks-file key of a roll: its tag key, or (no tag yet) its filter code, e.g. sk154, multi126_1."""
    return tag_key(code) or code.lower().replace(",", "_")


def tag_key(code):
    if code.startswith("TABSK"):
        return "tabsk"
    if code == "RES":
        return "res"
    return CODE_TO_TAG.get(code)


def weight(code):
    return 1 if WEIGHT1.search(code) else 3 if WEIGHT3.search(code) else 2


def build_fingerprints(items):
    by_code = {}
    for it in items:
        for c in it.codes:
            by_code.setdefault((it.kind, c), []).append(it)
    for it in items:
        rivals = {id(j): j for c in it.codes for j in by_code.get((it.kind, c), []) if j is not it}
        conds = []
        need = {k: 2 for k in rivals}  # a weight-1 exclusion counts 2, any other 1
        options = [(code, lo) for code, (lo, hi) in it.stats.items() if lo >= 1 and code not in UNRELIABLE]
        options += [(code, hi) for code, (lo, hi) in it.stats.items() if hi <= -1 and code not in UNRELIABLE]

        def excluded(code, lim):
            if lim < 0:  # "at most lim": rivals whose lowest value is above it are out
                return [k for k in need if need[k] > 0 and rivals[k].stats.get(code, (0, 0))[0] > lim]
            return [k for k in need if need[k] > 0 and rivals[k].stats.get(code, (0, 0))[1] < lim]

        while any(n > 0 for n in need.values()):
            best = None
            for code, lim in options:
                if (code, lim) in conds:
                    continue
                gone = excluded(code, lim)
                if gone:
                    w = weight(code)
                    gain = sum(min(need[k], 2 if w == 1 else 1) for k in gone)
                    score = (w, -gain, code)
                    if best is None or score < best[0]:
                        best = (score, code, lim, gone)
            if best is None:
                break
            conds.append((best[1], best[2]))
            for k in best[3]:
                need[k] -= 2 if weight(best[1]) == 1 else 1
        it.unresolved = sorted(rivals[k].name for k, n in need.items() if n == 2)
        it.weak = sorted(rivals[k].name for k, n in need.items() if n == 1)
        it.fingerprint = conds


def fingerprint_text(it):
    codes = it.codes[0] if len(it.codes) == 1 else "(" + " OR ".join(it.codes) + ")"
    conds = " ".join(f"{c}<{lo + 1}" if lo < 0 else f"{c}>{lo - 1}" for c, lo in it.fingerprint)
    return f"({codes}{' ' + conds if conds else ''})"


NEW_LABEL = 3  # assumed label length of a tag that has no line yet


def tag_width(key, hi):
    label = TAGS[key][2] if key in TAGS else "x" * NEW_LABEL
    return len(str(abs(hi))) + len(label) + (1 if key.startswith("-") else 0) + 1


def default_picks(it):
    """The generator's choice: the most important rolls with a tag line that fit (FCR only on caster weapons)."""
    budget = (NAME_MAX - len(it.name) - 1 - max((len(b) for b in it.base_names), default=0) - LINE_BREAK
              - CORRUPTION_RESERVE * CORRUPTION_TAGS.get(it.where, 1)
              - (SOCKET_RESERVE if it.where in SOCKET_SLOTS else 0))
    picks, used = [], 0
    for key in PRIORITY[it.slot]:
        if key == "fcr" and it.weapon and not it.caster:
            continue
        if key in it.rolls and len(picks) < MAX_PICKS:
            w = tag_width(key, it.rolls[key][1])
            if used + w <= budget or not picks:
                picks.append(key)
                used += w
    return picks, budget


# ---------------------------------------------------------------- picks file

def read_picks():
    return read_picks_text(PICKS.read_text(encoding="utf-8")) if PICKS.exists() else {}


def render_picks(items, old):
    out = ["# Unique/set variable-roll tags: the rolls each item shows (tools/gen_unique_rolls.py).",
           "# 'KIND Name: tag, tag' - the filter shows the tags in the item's affix order. Lines whose comment",
           "# starts with 'auto' are the generator's defaults and are rewritten on every run: delete 'auto' to",
           "# keep your change. Everything after '#' is rewritten on every run.",
           "# room = characters left for roll tags (56 minus name, base, line breaks, one corruption tag and",
           "# sockets); uses = what the picked tags take at their highest roll. Each candidate shows its",
           "# range and (width), e.g. 'ed 50-75 (5)' = '75ed '. A '*' marks a roll with no tag line yet:",
           "# picking it requests one (its width is an estimate). Tags: " + ", ".join(TAGS), ""]
    for it in sorted(items, key=lambda x: (x.kind, x.page, x.name)):
        keyed = [r for r in it.all_rolls if r["key"]]
        if not keyed:
            continue
        auto, budget = default_picks(it)
        mine = old.get(it.key)
        cands = " ".join(f"{r['key']}{'' if r['tagged'] else '*'} "
                         + (f"{r['lo']}-{r['hi']}" if r["lo"] != r["hi"] else f"{r['hi']}")
                         + f" ({tag_width(r['key'], r['hi'])})" for r in keyed)
        picks = mine[0] if mine and not mine[1] else auto
        used = sum(tag_width(k, it.rolls[k][1]) for k in picks if k in it.rolls)
        waiting = [k for k in picks if it.roll(k) and not it.roll(k)["tagged"]]
        wait_w = sum(tag_width(k, it.roll(k)["hi"]) for k in waiting)
        info = f"room {budget}, uses {used}"
        if waiting:
            info += f" + ~{wait_w} waiting for a tag line ({', '.join(waiting)})"
        if used + wait_w > budget:
            info += " - TOO LONG"
        unknown = [k for k in picks if not it.roll(k)]
        if unknown:
            info += f" - not a roll of this item: {', '.join(unknown)}"
        if mine and not mine[1]:
            out.append(f"{it.key}: {', '.join(picks)}    # {info} | {cands}")
        else:
            flag = " CHOOSE" if len(it.rolls) > len(auto) else ""
            out.append(f"{it.key}: {', '.join(picks)}    # auto{flag} | {info} | {cands}")
    return "\n".join(out) + "\n"


# ---------------------------------------------------------------- section

def render_section(items, picks):
    lines = ["// ==============================  Unique and Set Variable Roll Tags  ==============================",
             "// GENERATED by tools/gen_unique_rolls.py - do not edit. Change tools/unique_roll_picks.txt and run it.",
             "// Each alias: the identified uniques/sets that show this tag (300-affix-tags lines have",
             "// 'OR ROLL_<X>_TAG' in their gate), each as (its possible base codes + stats that tell it apart).",
             ""]
    for key, (alias, code, label, _) in TAGS.items():
        if alias not in USED:
            continue
        parts = {"UNI": [], "SET": []}
        for it in sorted(items, key=lambda x: x.name):
            chosen = picks.get(it.key, ([], True))[0]
            if key in chosen and key in it.rolls and not it.unresolved:
                parts[it.kind].append(fingerprint_text(it))
        clauses = [f"({kind} ID ({' OR '.join(fps)}))" for kind, fps in parts.items() if fps]
        value = "(" + " OR ".join(clauses) + ")" if clauses else "FALSE"
        lines.append(f"// {key}: {code}")
        lines.append(f"Alias[{alias}]:{value}")
        lines.append("")
    return "\r\n".join(lines)


def tag_order():
    """{(alias, slot): position}: where each tag's line sits in 300-affix-tags for that slot. Each tag line
    prepends its tag, so in game a tag from a later line appears further left."""
    order = {}
    lines = (ROOT / "sections" / "300-affix-tags.filter").read_text(encoding="utf-8").splitlines()
    for n, line in enumerate(lines):
        if not line.startswith("ItemDisplay["):
            continue
        cond = line[12:line.index("]:")]
        words = set(re.findall(r"\b(WEAPON|HELM|CIRC|CHEST|SHIELD|GLOVES|BOOTS|BELT|QUIVER|amu|rin)\b", cond))
        for alias in re.findall(r"\bROLL_[A-Z0-9]+_TAG\b", cond):
            for slot in (words or ALL):
                order.setdefault((alias, slot), n)
    return order


def tag_text(key, hi):
    label = TAGS[key][2]
    return f"-{abs(hi)}{label}" if key.startswith("-") else f"{hi}{label}"


def write_picker(items, old):
    """tools/roll_picker.html: the picks as a clickable page (data embedded in the template)."""
    order = tag_order()
    data = []
    for it in sorted(items, key=lambda x: (x.page, x.kind, x.name)):
        keyed = [r for r in it.all_rolls if r["key"]]
        if not keyed:
            continue
        auto, budget = default_picks(it)
        mine = old.get(it.key)
        reviewed = bool(mine and not mine[1])
        data.append({
            "key": it.key, "kind": it.kind, "name": it.name, "page": it.page, "slot": it.where,
            "bases": it.base_names, "codes": it.codes, "room": budget,
            "cands": [{"k": r["key"], "lo": r["lo"], "hi": r["hi"], "w": tag_width(r["key"], r["hi"]),
                       "tagged": r["tagged"], "line": r["line"],
                       "text": tag_text(r["key"], r["hi"]) if r["tagged"] else f"{abs(r['hi'])}?",
                       "order": order.get((TAGS[r["key"]][0], it.where), 0) if r["tagged"] else -1}
                      for r in keyed],
            "auto": auto, "picks": mine[0] if reviewed else auto, "reviewed": reviewed,
            "untaggable": [r["line"] for r in it.all_rolls if not r["key"]], "stats": it.raw_stats,
        })
    header = render_picks([], {}).rstrip("\n").split("\n")
    payload = {"generated": datetime.date.today().isoformat(), "header": header, "items": data}
    blob = json.dumps(payload, ensure_ascii=False).replace("</", "<\\/")
    html = PICKER_TEMPLATE.read_text(encoding="utf-8").replace("/*__DATA__*/null", blob)
    PICKER.write_text(html, encoding="utf-8", newline="\n")


def requests(items, picks):
    """{roll key: [(item, roll)]}: the author's picks of rolls that have no tag line yet."""
    out = {}
    for it in sorted(items, key=lambda x: x.key):
        chosen, auto = picks.get(it.key, ([], True))
        for k in chosen if not auto else []:
            r = it.roll(k)
            if r and not r["tagged"]:
                out.setdefault(k, []).append((it, r))
    return out


def print_requests(items, picks):
    asked = requests(items, picks)
    print(f"{len(asked)} roll(s) picked that have no tag line yet:" if asked else "no picks wait for a tag line")
    for key, hits in sorted(asked.items(), key=lambda kv: -len(kv[1])):
        slots = sorted({it.where or "?" for it, _ in hits})
        print(f"  {key} ({TAGS[key][1] if key in TAGS else key.upper().replace('_', ',')}) "
              f"on {', '.join(slots)}: e.g. '{hits[0][1]['line']}'")
        for it, r in hits:
            print(f"      {it.key} ({it.where}) {r['lo']}-{r['hi']}")
    nocode = {}
    for it in items:
        for r in it.all_rolls:
            if not r["key"]:
                nocode.setdefault(re.sub(r"-?\[-?[\d.]+-?-?[\d.]+\]|\d+(?:\.\d+)?", "#", r["line"]), []).append(it.key)
    print(f"\n{sum(map(len, nocode.values()))} roll(s) in {len(nocode)} text(s) have no filter code known "
          "(add the code to AUTHOR_CODES in tools/gen_unique_rolls.py):")
    for text, names in sorted(nocode.items(), key=lambda kv: -len(kv[1])):
        print(f"  {text}    <- {', '.join(names)}")


def load():
    families = item_data.base_codes()
    names = {}
    for line in item_data.CODES_WIKI.read_text(encoding="utf-8").splitlines():
        for code, name in re.findall(r"\|\s*([a-z0-9]{2,5})\s*\|\|\s*([A-Z][^|<]*?)\s*(?=\|\||$)", line):
            names.setdefault(code, name.replace("’", "'"))
    families["__names__"] = names
    raw = [r for r in item_data.items(families) if r["codes"] and r["page"] not in SKIP_PAGES]
    for r in raw:  # slot of each base code, from the typed unique pages
        slot = "WEAPON" if r["page"] in WEAPON_PAGES else PAGE_SLOT.get(r["page"])
        for c in r["codes"]:
            if slot:
                CODE_SLOT.setdefault(c, "CIRC" if c.startswith("ci") else slot)
    items = [Item(r, families) for r in raw]
    build_fingerprints(items)
    return items


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Generate the unique/set variable-roll tag aliases.")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--report", nargs="?", const="", metavar="NAME")
    ap.add_argument("--picker", action="store_true", help="write tools/roll_picker.html and open it")
    ap.add_argument("--requests", action="store_true",
                    help="list picked rolls that still need a tag line, and rolls with no filter code")
    args = ap.parse_args()
    items = load()
    if args.requests:
        print_requests(items, read_picks())
        return
    if args.picker:
        write_picker(items, read_picks())
        print(f"wrote {PICKER.relative_to(ROOT)}; opening it")
        os.startfile(PICKER) if hasattr(os, "startfile") else __import__("webbrowser").open(PICKER.as_uri())
        return
    if args.report is not None:
        for it in items:
            if args.report.lower() not in it.name.lower():
                continue
            picks, budget = default_picks(it)
            print(f"{it.key} [{' '.join(it.codes)}] room {budget}: rolls {it.rolls} -> default {picks}")
            print(f"    fingerprint {fingerprint_text(it)}" + (f"  UNRESOLVED vs {it.unresolved}" if it.unresolved else "")
                  + (f"  weak vs {it.weak}" if it.weak else ""))
            if it.unmapped:
                print(f"    rolls without a tag here: {it.unmapped}")
        return
    old = read_picks()
    picks_text = render_picks(items, old)
    new_picks = {k: v for k, v in read_picks_text(picks_text).items()}
    section = render_section(items, new_picks).encode("utf-8") + b"\r\n"
    stale = []
    if not PICKS.exists() or PICKS.read_text(encoding="utf-8") != picks_text:
        stale.append(str(PICKS.relative_to(ROOT)))
    if not OUT.exists() or OUT.read_bytes() != section:
        stale.append(str(OUT.relative_to(ROOT)))
    if args.check:
        if stale:
            sys.exit("out of date (run: python tools/gen_unique_rolls.py): " + ", ".join(stale))
        print("unique/set roll tags up to date")
        return
    PICKS.write_text(picks_text, encoding="utf-8", newline="\n")
    OUT.write_bytes(section)
    unresolved = [it for it in items if it.unresolved and it.rolls]
    missing = [k for k, t in TAGS.items() if t[0] not in USED]
    if missing:
        print(f"tags not used by any filter line yet (no candidates): {', '.join(missing)}")
    print(f"{len(items)} items, {sum(bool(it.rolls) for it in items)} with tag-able rolls; "
          f"{sum('CHOOSE' in l for l in picks_text.splitlines())} marked CHOOSE; "
          f"{len(unresolved)} without a unique fingerprint")
    for it in unresolved:
        print(f"  cannot tell {it.key} [{' '.join(it.codes)}] apart from: {', '.join(it.unresolved)}")
    weak = [it for it in items if it.weak and it.rolls]
    print(f"{len(weak)} fingerprints rule out some rival with only one corruptible stat (--report shows them)")
    asked = requests(items, new_picks)
    if asked:
        print(f"{len(asked)} picked roll(s) wait for a tag line: {', '.join(asked)} (--requests lists them)")
    print("updated: " + (", ".join(stale) if stale else "nothing"))


def read_picks_text(text):
    picks = {}
    for line in text.splitlines():
        if not line.strip() or line.startswith("#") or ":" not in line:
            continue
        body, _, comment = line.partition("#")
        name, _, keys = body.partition(":")
        picks[name.strip()] = ([k.strip() for k in keys.split(",") if k.strip()], comment.strip().startswith("auto"))
    return picks


if __name__ == "__main__":
    main()
