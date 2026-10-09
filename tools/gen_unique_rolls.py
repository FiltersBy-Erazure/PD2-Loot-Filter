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

Inputs: docs/pd2-unique-set-items.tsv (PD2's own item tables, python tools/pd2_data.py --extract): each item's
base, slot, stats and roll ranges, so its fingerprint; docs/items/*.wiki (python tools/item_data.py fetch): the
item names and the stat text the picker shows, and the items the game tables lack (Kadala's Heirloom, made by
PD2's server: its versions are split into one item each); and tools/unique_roll_picks.txt. Rows of the game
data with the same name are versions of one item: they share its picks line.
In the picks file, a line ending in "# auto ..." is the generator's default and is rewritten each run;
remove "auto" from a line (or write your own) to keep it. Output: sections/045-unique-set-rolls.filter.
Unique charms and jewels are left out: their tags live in 240-charms and 250-jewels.
"""
import argparse
import base64
import datetime
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import item_data  # noqa: E402
import pd2_data  # noqa: E402
import tag_order  # noqa: E402

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
    "allsk": ("ROLL_ALLSK_TAG", "ALLSK", "all", "WA"),
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
    "fdmg": ("ROLL_FSKD_TAG", "STAT329", "%f", "WA"),
    "ldmg": ("ROLL_LSKD_TAG", "STAT330", "%l", "WA"),
    "cdmg": ("ROLL_CSKD_TAG", "STAT331", "%c", "WA"),
    "pdmg": ("ROLL_PSKD_TAG", "STAT332", "%p", "WA"),
    "res": ("ROLL_RES_TAG", "RES", "res", "A"),
    "fres": ("ROLL_FRES_TAG", "FRES", "res", "A"),
    "lres": ("ROLL_LRES_TAG", "LRES", "res", "A"),
    "cres": ("ROLL_CRES_TAG", "CRES", "res", "A"),
    "pres": ("ROLL_PRES_TAG", "PRES", "res", "A"),
    "maxfr": ("ROLL_MAXFR_TAG", "STAT40", "%max", "A"),
    "maxlr": ("ROLL_MAXLR_TAG", "STAT42", "%max", "A"),
    "maxcr": ("ROLL_MAXCR_TAG", "STAT44", "%max", "A"),
    "maxpr": ("ROLL_MAXPR_TAG", "STAT46", "%max", "A"),
    "maxres": ("ROLL_MAXRES_TAG", "MAXRES", "%max", "A"),  # items with all four: "6%/5%/4%/4%", "5%max" if equal (author, 2026-10-08)
    "life": ("ROLL_LIFE_TAG", "LIFE", "life", "A"),
    "mana": ("ROLL_MANA_TAG", "MANA", "mana", "A"),
    "str": ("ROLL_STR_TAG", "STR", "str", "A"),
    "dex": ("ROLL_DEX_TAG", "DEX", "dex", "A"),
    "vit": ("ROLL_VIT_TAG", "STAT3", "vit", "A"),
    "nrg": ("ROLL_NRG_TAG", "STAT1", "nrg", "A"),
    "mdr": ("ROLL_MDR_TAG", "STAT35", "mdr", "A"),
    "pdr%": ("ROLL_PDR_TAG", "STAT36", "%pdr", "A"),  # Physical Damage Taken Reduced by N%
    "pdr": ("ROLL_PDRF_TAG", "STAT34", "pdr", "A"),   # Physical Damage Taken Reduced by N (flat)
    "replife": ("ROLL_REPLIFE_TAG", "STAT74", "rep", "A"),
    "regen": ("ROLL_REGEN_TAG", "STAT27", "rgn", "A"),
    "cr": ("ROLL_CR_TAG", "STAT504", "cr", "A"),
    "dtm": ("ROLL_DTM_TAG", "DTM", "dtm", "A"),
    # tags that magic items or corruptions had: unique/set-only lines added for the author's picks
    "stat76": ("ROLL_MAXLIFE_TAG", "STAT76", "%l", "WA"),
    "stat77": ("ROLL_MAXMANA_TAG", "STAT77", "%m", "WA"),
    "allattrib": ("ROLL_ALLATT_TAG", "ALLATTRIB", "att", "WA"),
    "stat78": ("ROLL_ATD_TAG", "STAT78", "atd", "WA"),
    "stat20": ("ROLL_BLOCK_TAG", "STAT20", "blk", "WA"),
    "stat109": ("ROLL_RCD_TAG", "STAT109", "rcd", "WA"),
    "stat156": ("ROLL_PRC_TAG", "STAT156", "prc", "WA"),
    "stat123": ("ROLL_ARDEM_TAG", "STAT123", "ar", "WA"),
    "stat124": ("ROLL_ARUND_TAG", "STAT124", "ar", "WA"),
    "stat424": ("ROLL_LPH_TAG", "STAT424", "lph", "WA"),
}
# New roll tags for the author's picks (labels and colors chosen by the author, 2026-10-07)
NEW_ROLL_TAGS = {
    "def": ("ROLL_DEF_TAG", "DEF", "def"),
    "stat501": ("ROLL_OWD_TAG", "STAT501", "ow"),
    "multi126_1": ("ROLL_FSK_TAG", "MULTI126,1", "fsk"),
    "multi126_2": ("ROLL_LSK_TAG", "MULTI126,2", "lsk"),
    "multi126_3": ("ROLL_MSK_TAG", "MULTI126,3", "msk"),
    "multi126_4": ("ROLL_CSK_TAG", "MULTI126,4", "csk"),
    "multi126_5": ("ROLL_PSK_TAG", "MULTI126,5", "psk"),
    "stat425": ("ROLL_EPHYS_TAG", "STAT425", "%phys"),
    "stat49": ("ROLL_FIREDMG_TAG", "STAT49", "fire"),
    "stat55": ("ROLL_COLDDMG_TAG", "STAT55", "cold"),
    "stat142": ("ROLL_FABSP_TAG", "STAT142", "%abs"),
    "stat143": ("ROLL_FABS_TAG", "STAT143", "abs"),
    "stat144": ("ROLL_LABSP_TAG", "STAT144", "%abs"),
    "stat145": ("ROLL_LABS_TAG", "STAT145", "abs"),
    "stat148": ("ROLL_CABSP_TAG", "STAT148", "%abs"),
    "stat128": ("ROLL_LATD_TAG", "STAT128", "atd"),
    "multi151_119": ("ROLL_SANC_TAG", "MULTI151,119", "snct"),  # auras: the skill's staffmods label
    "multi151_102": ("ROLL_HFIRE_TAG", "MULTI151,102", "hfir"),
    "multi151_115": ("ROLL_VIGOR_TAG", "MULTI151,115", "vigr"),
    "multi151_98": ("ROLL_MIGHT_TAG", "MULTI151,98", "migh"),
    "stat111": ("ROLL_DMG_TAG", "STAT111", "dmg"),
    "stat139": ("ROLL_LPDK_TAG", "STAT139", "lpk"),
    "stat150": ("ROLL_SLOW_TAG", "STAT150", "%slow"),
    "stat423": ("ROLL_LEAP_TAG", "STAT423", "%leap"),
    "stat87": ("ROLL_VP_TAG", "STAT87", "vp"),
    # Runeword rolls first (Spirit, Insight, Lawbringer...), also on some uniques (author, 2026-10-08)
    "stat147": ("ROLL_MABS_TAG", "STAT147", "abs"),     # Magic Absorb
    "stat258": ("ROLL_CRIT_TAG", "STAT258", "%crit"),   # Chance of Critical Strike
    "stat32": ("ROLL_DVM_TAG", "STAT32", "dvm"),        # Defense vs. Missile
}
# +N to a single skill: the value, then a tan abbreviation. The author's staffmods abbreviations
# (310-staffmods, 2026-10-08); Amazon skills have no staffmods line, so theirs are the generator's own.
SKILL_TAG_LABELS = {
    6: "marw",    9: "crit",    10: "jab",    11: "carw",    12: "multi",    14: "power",    16: "expl",    19: "jmas",
    22: "guide",    24: "cs",    26: "straf",    28: "dcoy",    30: "fend",    32: "valk",    37: "wrmt",    51: "fwll",    58: "eshl",
    61: "fmst",    63: "lmst",    65: "cmas",    66: "ampd",    67: "teth",    68: "barm",    69: "skms",    70: "skwa",
    74: "cexp",    80: "skmg",    84: "bspe",    89: "skar",    95: "reve",    101: "hblt",    102: "hfir",    106: "zeal",
    110: "resl",    112: "bhmr",    115: "vigr",    121: "fhvn",    128: "onhm",    145: "iskn",    151: "wind",    154: "wcry",
    221: "ravn",    223: "wwlf",    224: "lycn",    225: "fstr",    232: "frag",    233: "maul",    238: "rabi",    240: "twst",
    245: "trnd",    247: "grzl",    248: "fury",    367: "bwrp",    369: "icbr",    381: "dpct",
}
TAGS.update({k: (a, c, l, "WA") for k, (a, c, l) in NEW_ROLL_TAGS.items()})
TAGS.update({f"sk{s}": (f"ROLL_SK{s}_TAG", f"SK{s}", lab, "WA") for s, lab in SKILL_TAG_LABELS.items()})
# +N to a skill without "(Class Only)" is an oskill: stat 97, read with OS<n> (same label as the class skill)
TAGS.update({f"os{s}": (f"ROLL_OS{s}_TAG", f"OS{s}", lab, "WA") for s, lab in SKILL_TAG_LABELS.items()})
# All three -% enemy resistances on one line, "-10%/-15%/-10%" with gray slashes (author, 2026-10-08), in the order
# the item lists them: c cold, f fire, l lightning. The game lists stats of equal priority in an order that differs between
# items, so the order comes from the item in game; an item not in ERES_ORDER uses ERES_DEFAULT. Each order
# has its own 300 line (ROLL_ERES<ORDER>_TAG), and the weapon -res corruption lines skip these items.
ERES_KEYS = {"c": "-cres", "f": "-fres", "l": "-lres"}
ERES_ORDER = {"UNI Kira's Guardian": "cfl",  # the author's screenshots, 2026-10-08
              "UNI Mang Song's Lesson": "cfl"}
ERES_DEFAULT = "cfl"
TAGS.update({f"eres_{o}": (f"ROLL_ERES{o.upper()}_TAG", f"ERES{o.upper()}", "%res", "WA")
             for o in ("cfl", "clf", "fcl", "flc", "lcf", "lfc")})
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
    "maxres": ALL, **{k: ALL for k in TAGS if k.startswith("eres_")},
    "life": {"rin", "SHIELD", "BOOTS", "GLOVES", "QUIVER"}, "mana": {"CHEST"},
    **{k: {"rin", "amu", "CIRC", "HELM", "BELT", "BOOTS", "GLOVES"} for k in ("str", "dex", "vit", "nrg")},
    "mdr": {"rin", "CHEST", "SHIELD"}, "pdr": {"rin", "CHEST", "SHIELD"},
    "pdr%": {"CHEST", "SHIELD", "rin", "BOOTS", "BELT", "HELM", "CIRC"},
    "replife": ALL, "regen": ALL,
    "cr": {"amu", "BOOTS", "BELT", "rin", "HELM", "CIRC", "CHEST", "SHIELD", "QUIVER"},
    "dtm": {"rin", "amu", "CIRC", "HELM", "CHEST", "SHIELD", "BELT", "BOOTS", "GLOVES"},
}
# Slots of the roll lines added for the author's picks: unique/set-only lines, and corruption lines that got
# the roll alias in the author's format (STAT360=n OR ROLL_<X>_TAG)
ROLL_ONLY_SLOTS = {
    "-cres": {'HELM', 'CIRC', 'SHIELD', 'GLOVES'},
    "-fres": {'HELM', 'CIRC', 'GLOVES', 'amu'},
    "-lres": {'CIRC', 'QUIVER'},
    "-pres": {'HELM', 'QUIVER'},
    "allattrib": {'WEAPON', 'SHIELD', 'GLOVES', 'BOOTS', 'BELT', 'QUIVER', 'amu', 'rin'},
    "ar": {'HELM', 'CHEST', 'SHIELD', 'BOOTS', 'amu'},
    "ar%": {'WEAPON', 'SHIELD'},
    "cb": {'BOOTS', 'QUIVER'},
    "cdmg": {'HELM', 'CHEST'},
    "cr": {'WEAPON'},
    "cres": {'WEAPON'},
    "dem": {'WEAPON', 'CHEST', 'GLOVES', 'QUIVER', 'amu'},
    "dex": {'WEAPON', 'CHEST', 'SHIELD', 'QUIVER'},
    "ds": {'CHEST', 'SHIELD', 'BOOTS', 'QUIVER'},
    "ed": {'SHIELD', 'BELT', 'QUIVER', 'amu', 'rin'},
    "fdmg": {'CHEST', 'SHIELD'},
    "fres": {'WEAPON'},
    "frw": {'SHIELD'},
    "gf": {'WEAPON', 'CHEST'},
    "ldmg": {'CIRC', 'CHEST', 'SHIELD'},
    "life": {'WEAPON', 'CHEST', 'BELT', 'amu'},
    "lpk": {'HELM', 'CIRC', 'CHEST', 'SHIELD', 'GLOVES', 'amu'},
    "lres": {'WEAPON'},
    "ls": {'CHEST'},
    "mana": {'WEAPON', 'HELM', 'CIRC', 'SHIELD', 'BELT', 'amu', 'rin'},
    "max": {'WEAPON', 'GLOVES', 'BELT'},
    "maxcr": {'BELT', 'QUIVER', 'rin'},
    "maxfr": {'WEAPON', 'GLOVES', 'QUIVER', 'amu', 'rin'},
    "maxlr": {'BELT', 'QUIVER', 'rin'},
    "maxpr": {'QUIVER', 'rin'},
    "mdr": {'WEAPON', 'BELT', 'amu'},
    "min": {'WEAPON'},
    "mpk": {'HELM', 'CIRC', 'CHEST', 'SHIELD', 'GLOVES', 'BOOTS', 'amu'},
    "ms": {'WEAPON', 'CHEST'},
    "nrg": {'CHEST'},
    "pdmg": {'GLOVES', 'BELT'},
    "pdr": {'HELM', 'BELT', 'amu'},
    "pdr%": {'WEAPON', 'QUIVER'},
    "pres": {'WEAPON'},
    "res": {'WEAPON'},
    "stat109": {'HELM', 'CIRC', 'CHEST', 'SHIELD', 'GLOVES', 'BOOTS', 'BELT', 'QUIVER', 'rin'},
    "stat123": {'WEAPON'},
    "stat124": {'GLOVES', 'QUIVER'},
    "stat156": {'WEAPON', 'HELM', 'QUIVER'},
    "stat20": {'WEAPON', 'CHEST', 'SHIELD', 'GLOVES', 'BOOTS', 'BELT'},
    "stat424": {'WEAPON'},
    "stat76": {'WEAPON', 'HELM', 'CIRC', 'CHEST', 'SHIELD', 'BELT'},
    "stat77": {'WEAPON', 'CHEST', 'SHIELD', 'GLOVES', 'BOOTS', 'BELT', 'rin'},
    "stat78": {'WEAPON', 'SHIELD', 'BELT', 'QUIVER', 'amu'},
    "str": {'WEAPON', 'CHEST', 'SHIELD', 'QUIVER'},
    "tabsk": {'BOOTS'},
    "und": {'WEAPON', 'CHEST', 'GLOVES', 'QUIVER', 'amu'},
    "vit": {'WEAPON', 'SHIELD'},
    "def": {'WEAPON', 'HELM', 'CIRC', 'CHEST', 'SHIELD', 'GLOVES', 'BOOTS', 'amu'},
    "multi126_1": {'WEAPON', 'CHEST', 'amu', 'rin'},
    "multi126_2": {'rin'},
    "multi126_3": {'WEAPON', 'rin'},
    "multi126_4": {'WEAPON', 'CHEST', 'BELT', 'rin'},
    "multi126_5": {'WEAPON', 'SHIELD', 'rin'},
    "multi151_102": {'WEAPON'},
    "multi151_115": {'SHIELD'},
    "multi151_119": {'WEAPON', 'CHEST'},
    "multi151_98": {'CHEST'},
    "sk101": {'WEAPON'},
    "sk102": {'WEAPON'},
    "sk110": {'WEAPON'},
    "sk112": {'WEAPON'},
    "sk115": {'BOOTS'},
    "sk121": {'WEAPON'},
    "sk128": {'WEAPON'},
    "sk14": {'WEAPON'},
    "sk151": {'WEAPON'},
    "sk154": {'WEAPON'},
    "sk19": {'WEAPON'},
    "sk22": {'WEAPON'},
    "sk221": {'WEAPON'},
    "sk224": {'WEAPON'},
    "sk225": {'WEAPON'},
    "sk232": {'HELM'},
    "sk233": {'WEAPON', 'HELM'},
    "sk238": {'WEAPON'},
    "sk24": {'WEAPON'},
    "sk240": {'WEAPON'},
    "sk245": {'WEAPON'},
    "sk247": {'HELM'},
    "sk248": {'WEAPON'},
    "sk32": {'WEAPON'},
    "sk367": {'WEAPON', 'CHEST'},
    "sk369": {'WEAPON'},
    "sk37": {'WEAPON'},
    "sk381": {'WEAPON'},
    "sk51": {'WEAPON'},
    "sk58": {'WEAPON'},
    "sk6": {'WEAPON'},
    "sk61": {'WEAPON'},
    "sk63": {'WEAPON'},
    "sk65": {'WEAPON'},
    "sk66": {'WEAPON'},
    "sk67": {'WEAPON'},
    "sk68": {'WEAPON'},
    "sk69": {'WEAPON'},
    "sk70": {'WEAPON'},
    "sk74": {'WEAPON'},
    "sk80": {'WEAPON'},
    "sk84": {'WEAPON'},
    "sk89": {'WEAPON'},
    "sk9": {'WEAPON'},
    "sk95": {'WEAPON'},
    "stat111": {'WEAPON'},
    "stat128": {'WEAPON', 'amu'},
    "stat139": {'WEAPON'},
    "stat142": {'rin'},
    "stat143": {'HELM'},
    "stat144": {'WEAPON', 'BELT', 'rin'},
    "stat145": {'WEAPON', 'HELM'},
    "stat148": {'WEAPON'},
    "stat150": {'WEAPON'},
    "stat423": {'BOOTS'},
    "stat425": {'WEAPON', 'HELM', 'GLOVES', 'QUIVER'},
    "stat49": {'WEAPON', 'CHEST'},
    "stat501": {'WEAPON', 'CHEST', 'BOOTS', 'amu'},
    "stat55": {'WEAPON', 'amu'},
    "stat87": {'rin'},
    "os10": {'WEAPON'},
    "os11": {'WEAPON'},
    "os12": {'WEAPON'},
    "os16": {'WEAPON'},
    "os19": {'WEAPON'},
    "os22": {'WEAPON'},
    "os26": {'WEAPON'},
    "os30": {'WEAPON'},
    "os69": {'HELM', 'BOOTS'},
    "os70": {'HELM'},
    "os74": {'CHEST'},
    "os106": {'WEAPON'},
    "os145": {'BELT'},
    "os221": {'CHEST'},
    "os223": {'HELM'},
    "os232": {'HELM'},
    "stat147": ALL, "stat258": ALL, "stat32": ALL,  # their 300 lines have no slot words
}
for _key, _slots in ROLL_ONLY_SLOTS.items():
    COVER[_key] = COVER.get(_key, set()) | _slots
PAGE_SLOT = {"Helms": "HELM", "Chests": "CHEST", "Shields": "SHIELD", "Gloves": "GLOVES", "Boots": "BOOTS",
             "Belts": "BELT", "Quivers": "QUIVER", "Amulets": "amu", "Rings": "rin"}
PRIORITY = {  # default pick order; the author's lines in the picks file override it per item
    "W": ["allsk", *CLSK_KEYS, "tabsk", "ed", "ias", "fcr", "min", "max", "ds", "cb",
          "-fres", "-lres", "-cres", "-pres", "ls", "ms", "lpk", "mpk", "mf", "ar",
          "ar%", "dem", "und", "fdmg", "ldmg", "cdmg", "pdmg"],
    "A": ["allsk", *CLSK_KEYS, "tabsk", "fcr", "fhr", "frw", "fbr", "res", "maxres", "maxfr", "maxlr", "maxcr",
          "maxpr", "fres", "lres", "cres", "pres", "life", "mana", "mf", "gf", "str", "dex", "vit", "nrg",
          "ls", "ms", "lpk", "mpk", "mdr", "pdr%", "pdr", "replife", "regen", "cr", "dtm", "ar", "ar%", "ias",
          "min", "max", "ds", "cb", "fdmg", "ldmg", "cdmg", "pdmg", "ed"],
}
MAXRES_KEYS = ["maxfr", "maxlr", "maxcr", "maxpr"]
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
UNRELIABLE = {"DEF", "SOCK"}  # total defense also depends on the base tier and ethereal; sockets can be added
COMPANIONS = {"stat48", "stat50", "stat52", "stat54"}  # the minimum of "Adds X-Y damage": shown with its maximum


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
        self.display = raw.get("display", self.name)  # the name in game (a version's name adds its label)
        family = raw["codes"]
        tier_names = families["__names__"]
        own_code = next((c for c in family if item_data.norm(tier_names.get(c, "")) == item_data.norm(self.base)),
                        family[0] if family else None)
        self.codes = family[family.index(own_code):] if own_code in family else family
        self.base_names = [tier_names.get(c, self.base) for c in self.codes]
        self.where = "WEAPON" if self.page in WEAPON_PAGES else PAGE_SLOT.get(self.page)
        if any(c.startswith("ci") for c in self.codes):
            self.where = "CIRC"
        if self.where is None and self.codes:  # set items: the slot of the base family, learnt from the uniques
            self.where = CODE_SLOT.get(self.codes[0]) or ("WEAPON" if self.codes[0] in WEAPON_CODES else None)
        self.weapon = self.where == "WEAPON"
        self.slot = "W" if self.weapon else "A"
        page = self.page if self.page in WEAPON_PAGES else CODE_PAGE.get(self.codes[0]) if self.codes else None
        self.caster = page in CASTER_PAGES or any(c.startswith("ob") for c in self.codes)
        self.stats = {}  # code -> (lo, hi), all current stat lines with a filter code
        self.raw_stats = raw["stats"]
        self.rolls = {}      # key -> (lo, hi): variable rolls the filter can show as a tag on this item
        self.all_rolls = []  # every variable roll: key (None = no filter code), lo, hi, line, tagged
        self.game = raw.get("game")
        if self.game:
            self.from_game(raw, tier_names)
        else:
            self.from_wiki(raw)
        four = [self.roll(k) for k in MAXRES_KEYS]
        if all(four):  # all four max resists: one more candidate, a single tag for the four
            lo, hi = min(r["lo"] for r in four), max(r["hi"] for r in four)
            tagged = self.covers("maxres")
            self.all_rolls.insert(min(self.all_rolls.index(r) for r in four),
                                  {"key": "maxres", "code": "MAXRES", "lo": lo, "hi": hi,
                                   "line": "All four Maximum Resistances", "tagged": tagged})
            if tagged:
                self.rolls["maxres"] = (lo, hi)
        three = [self.roll(k) for k in ERES_KEYS.values()]
        if all(three):  # all three -% enemy resistances: one more candidate, one tag in the item's order
            key = f"eres_{ERES_ORDER.get(self.key, ERES_DEFAULT)}"
            lo, hi = min(r["lo"] for r in three), max(r["hi"] for r in three)
            tagged = self.covers(key)
            self.all_rolls.insert(min(self.all_rolls.index(r) for r in three),
                                  {"key": key, "code": TAGS[key][1], "lo": lo, "hi": hi,
                                   "line": "All three -% Enemy Resistances", "tagged": tagged})
            if tagged:
                self.rolls[key] = (lo, hi)
        self.unmapped = [r["line"] for r in self.all_rolls if not r["tagged"]]
        self.fingerprint, self.unresolved, self.weak = [], [], []

    def add_roll(self, key, code, lo, hi, line):
        if any(r["key"] == key for r in self.all_rolls):
            return
        tagged = key in TAGS and self.covers(key)
        self.all_rolls.append({"key": key, "code": code, "lo": lo, "hi": hi, "line": line, "tagged": tagged})
        if tagged:
            self.rolls[key] = (lo, hi)

    def from_wiki(self, raw):
        """Stats and rolls from the wiki's text (an item the game data lacks, e.g. Kadala's Heirloom)."""
        for line in raw["stats"]:
            for code, lo, hi in parse_stat(line):
                old = self.stats.get(code)
                self.stats[code] = (lo + (old[0] if old else 0), hi + (old[1] if old else 0))
        for line in raw["rolls"]:
            parsed = parse_stat(line)[:1]  # one roll, one tag: All Resistances is res, not five tags
            if not parsed:
                self.all_rolls.append({"key": None, "lo": 0, "hi": 0, "line": line, "tagged": False})
                continue
            code, lo, hi = parsed[0]
            self.add_roll(roll_key(code), code, lo, hi, line)

    def from_game(self, raw, tier_names):
        """Base, slot, stats and rolls from PD2's own tables (docs/pd2-unique-set-items.tsv); the wiki only
        lends the text of a roll for the picker."""
        game = self.game
        family = CODE_FAMILY.get(game["code"], [game["code"]])
        self.codes = family[family.index(game["code"]):]
        self.base_names = [tier_names.get(c, self.base) for c in self.codes]
        self.where = game["slot"]
        self.weapon = self.where == "WEAPON"
        self.slot = "W" if self.weapon else "A"
        self.caster = game["caster"] or any(c.startswith("ob") for c in self.codes)
        for prop in game["props"]:
            for code, lo, hi in prop:
                old = self.stats.get(code)
                self.stats[code] = (lo + (old[0] if old else 0), hi + (old[1] if old else 0))
        wiki = {}
        for line in raw["rolls"]:
            parsed = parse_stat(line)[:1]
            if parsed:
                wiki.setdefault(roll_key(parsed[0][0]), line)
        for prop in game["props"]:
            code, lo, hi = prop[0]  # the stat a tag of this line shows
            key = roll_key(code)
            if lo != hi and key not in COMPANIONS:  # (the wiki writes an oskill like a class skill)
                text = wiki.get(key) or (wiki.get("sk" + key[2:]) if key.startswith("os") else None)
                self.add_roll(key, code, lo, hi, text or stat_text(code, lo, hi))
        for line in raw["rolls"]:  # wiki rolls with no filter code: listed in the picker as untaggable
            if not parse_stat(line):
                self.all_rolls.append({"key": None, "lo": 0, "hi": 0, "line": line, "tagged": False})
        if not self.raw_stats:
            self.raw_stats = [stat_text(*prop[0]) for prop in game["props"]]

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


def weapon_codes():
    """Item codes listed under the item-code wiki's Weapons heading (the slot of a set weapon whose base
    no unique uses)."""
    text = item_data.CODES_WIKI.read_text(encoding="utf-8")
    start = text.index("===== Weapons =====")
    end = text.index("\n=====", start + 1)
    return set(re.findall(r"\|\s*([a-z0-9]*[a-z][a-z0-9]*)\s*\|\|", text[start:end]))


USED = used_aliases()
WEAPON_CODES = weapon_codes()
CODE_SLOT = {}  # base code -> slot, and base code -> unique page: learnt from the unique pages in load()
CODE_PAGE = {}
CODE_FAMILY = {}  # base code -> the codes of its family, normal to elite (docs/pd2-item-codes.wiki)
GAME_PAGE = "Game data"  # picker group of the items the wiki lacks
GAME_NAMES = {"Spirit Shroud": "The Spirit Shroud",  # wiki name -> the game's, where they differ
              "Infernal Spire (Infernal Torch)": "Infernal Spire"}
NO_GAME_DATA, GAME_ONLY = [], []  # wiki items the game data lacks / game items the wiki lacks (load())
CODE_STAT = {code: sid for sid, code in pd2_data.NAMED.items()}


def stat_text(code, lo, hi):
    """Readable text of a stat the wiki does not list (for the picker)."""
    m = re.fullmatch(r"STAT(\d+)", code)
    sid = int(m.group(1)) if m else CODE_STAT.get(code)
    title = ("% Enhanced Damage/Defense" if code == "ED" else
             tag_order.TITLES.get(sid) or tag_order.STAT_NAMES.get(sid) if sid is not None else code)
    return f"{title} {f'[{lo}-{hi}]' if lo != hi else lo}"


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


def one_per_key(items):
    """Versions of one item (rows of the same name in the game data) share a picks line: list it once."""
    seen = set()
    return [it for it in items if not (it.key in seen or seen.add(it.key))]


def build_fingerprints(items):
    by_code = {}
    for it in items:
        for c in it.codes:
            by_code.setdefault((it.kind, c), []).append(it)
    for it in items:
        rivals = {id(j): j for c in it.codes for j in by_code.get((it.kind, c), []) if j.key != it.key}
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


RANGE_TAGS, MINUS_TAGS = {"stat49", "stat55"}, {"stat425"}  # shown as "+min-max<label>" / "-N<label>"


def tag_width(key, hi):
    label = TAGS[key][2] if key in TAGS else "x" * NEW_LABEL
    digits = len(str(abs(hi)))
    if key in RANGE_TAGS:  # the minimum has about as many digits as the maximum
        digits = 2 * digits + 2
    elif key == "maxres":  # "6%/5%/4%/4%"
        return 4 * (digits + 1) + 3 + 1
    elif key.startswith("eres_"):  # "-10%/-15%/-10%"
        return 3 * (digits + 3)
    return digits + len(label) + (1 if key.startswith("-") or key in MINUS_TAGS else 0) + 1


def default_picks(it):
    """The generator's choice: the most important rolls with a tag line that fit (FCR only on caster weapons)."""
    budget = (NAME_MAX - len(it.display) - 1 - max((len(b) for b in it.base_names), default=0) - LINE_BREAK
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
    for it in one_per_key(sorted(items, key=lambda x: (x.kind, x.page, x.name))):
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


SLOT_WORDS = re.compile(r"\b(WEAPON|HELM|CIRC|CHEST|SHIELD|GLOVES|BOOTS|BELT|QUIVER|amu|rin)\b")
COLOR_WORDS = {"WHITE", "RED", "GREEN", "BLUE", "GOLD", "GRAY", "BLACK", "TAN", "ORANGE", "YELLOW", "PURPLE",
               "DARK_GREEN", "CORAL", "SAGE", "TEAL", "LIGHT_GRAY"}


def tag_lines():
    """The lines of 300-affix-tags that put a tag before the item name: position n, aliases, slots, value
    comparisons [(code, op, number)] and the tag as chunks (split at its spaces), each with parts
    [[color, text]] ("{v:KEYWORD}" where a value goes) and the value keyword it shows."""
    out = []
    lines = (ROOT / "sections" / "300-affix-tags.filter").read_text(encoding="utf-8").splitlines()
    for n, line in enumerate(lines):
        if not line.startswith("ItemDisplay[") or "]:" not in line:
            continue
        cond, name_part = line[12:line.index("]:")], line[line.index("]:") + 2:].split("{")[0]
        if "%NAME%" not in name_part:
            continue
        chunks, chunk, color = [], {"parts": [], "kw": None}, "WHITE"
        for tok in re.split(r"(%[A-Z_]+[0-9]*(?:,[0-9]+)?%)", name_part.split("%NAME%")[0]):
            word = tok[1:-1] if re.fullmatch(r"%[A-Z_]+[0-9]*(?:,[0-9]+)?%", tok) else None
            if word in COLOR_WORDS:
                color = word
            elif word in ("CS", "CL", "NL"):
                continue
            elif word == "PERCENT":
                chunk["parts"].append([color, "%"])
            elif word:
                chunk["parts"].append([color, "{v:%s}" % word])
                chunk["kw"] = chunk["kw"] or word
            else:
                for i, piece in enumerate(tok.split(" ")):
                    if i:
                        chunks.append(chunk)
                        chunk = {"parts": [], "kw": None}
                    if piece:
                        chunk["parts"].append([color, piece])
        chunks.append(chunk)
        out.append({"n": n, "aliases": set(re.findall(r"\bROLL_[A-Z0-9]+_TAG\b", cond)),
                    "slots": set(SLOT_WORDS.findall(cond)), "chunks": [c for c in chunks if c["parts"]],
                    "cmps": re.findall(r"(?<![!A-Za-z0-9_])([A-Z]+[0-9]*(?:,[0-9]+)?)([<>=])(-?\d+)", cond)})
    return out


def tag_format(it, r, lines):
    """How the filter draws roll r of item it: variants [{n, cmps, parts}] (the first whose comparisons hold
    for the value applies; n = its line, which sets its place), and whether the look is borrowed. A roll with
    no tag line borrows the look of a line that shows the same stat (another slot's, or a magic item's)."""
    code, alias = r["code"], TAGS[r["key"]][0] if r["key"] in TAGS else None

    def variant(line, kw=None, n=None):
        chunks = [c for c in line["chunks"] if kw is None or c["kw"] == kw]
        parts = []
        for c in chunks:
            parts += ([[parts[-1][0], " "]] if parts else []) + c["parts"]
        return parts and {"n": line["n"] if n is None else n, "parts": parts,
                          "cmps": [[op, int(num)] for c, op, num in line["cmps"] if c == code]}

    def other_skill(line):  # a +skill tab/class line for another tab/class than this roll's
        return any(re.fullmatch(r"(TABSK|CLSK)\d+", c["kw"] or "") and c["kw"] != code for c in line["chunks"])

    if r["tagged"]:
        found = [variant(l) for l in lines if alias in l["aliases"] and not other_skill(l)
                 and (not l["slots"] or it.where in l["slots"])]
        if any(found):
            return [v for v in found if v], False
    same = [l for l in lines if alias and alias in l["aliases"] and not other_skill(l)]
    kw = None if same else code
    same = same or [l for l in lines if any(c["kw"] == code for c in l["chunks"])]
    kind = [l for l in same if ("WEAPON" in l["slots"]) == (it.where == "WEAPON")]  # weapon vs armor look
    found = [variant(l, kw, n=-1) for l in ([l for l in same if it.where in l["slots"]] or kind or same)]
    found = [v for v in found if v]
    return (found or [{"n": -1, "cmps": [], "parts": [["WHITE", "{v}"], ["GRAY", "?"]]}]), True


FONT_URL = "https://raw.githubusercontent.com/BetweenWalls/filterbird/master/data/AvQest.ttf"
FONT_CACHE = ROOT / "tools" / ".cache" / "AvQest.ttf"


def picker_font():
    """The D2-style font AvQest (GemFonts; the one filterbird uses) for the label preview, base64. Downloaded
    once into tools/.cache (gitignored: the font is not part of this repo). None if that fails: the page then
    uses a serif font."""
    if not FONT_CACHE.exists():
        try:
            font = urllib.request.urlopen(FONT_URL, timeout=15).read()
        except OSError as e:
            print(f"could not download the preview font ({e}); using a fallback font")
            return None
        if font[:4] != b"\x00\x01\x00\x00":
            return None
        FONT_CACHE.parent.mkdir(exist_ok=True)
        FONT_CACHE.write_bytes(font)
    return base64.b64encode(FONT_CACHE.read_bytes()).decode("ascii")


def write_picker(items, old):
    """tools/roll_picker.html: the picks as a clickable page (data embedded in the template)."""
    lines = tag_lines()
    data = []
    for it in one_per_key(sorted(items, key=lambda x: (x.page, x.kind, x.name))):
        keyed = [r for r in it.all_rolls if r["key"]]
        if not keyed:
            continue
        auto, budget = default_picks(it)
        mine = old.get(it.key)
        reviewed = bool(mine and not mine[1])
        cands = []
        for idx, r in enumerate(it.all_rolls):
            if r["key"]:
                fmt, approx = tag_format(it, r, lines)
                kws = {kw for f in fmt for _, t in f["parts"] for kw in re.findall(r"\{v:([^}]+)\}", t)}
                cands.append({"k": r["key"], "lo": r["lo"], "hi": r["hi"], "w": tag_width(r["key"], r["hi"]),
                              "vals": {kw: abs(it.stats[kw][1]) for kw in kws if kw in it.stats and kw != r["code"]},
                              "v": abs(r["hi"]) if r["key"].startswith("-") else r["hi"],
                              "tagged": r["tagged"], "line": r["line"], "idx": idx, "fmt": fmt, "approx": approx})
        data.append({
            "key": it.key, "kind": it.kind, "name": it.name, "shown": it.display, "page": it.page, "slot": it.where,
            "bases": it.base_names, "codes": it.codes, "room": budget, "sockets": it.where in SOCKET_SLOTS,
            "cands": cands, "auto": auto, "picks": mine[0] if reviewed else auto, "reviewed": reviewed,
            "untaggable": [r["line"] for r in it.all_rolls if not r["key"]], "stats": it.raw_stats,
        })
    header = render_picks([], {}).rstrip("\n").split("\n")
    payload = {"generated": datetime.date.today().isoformat(), "header": header, "items": data}
    blob = json.dumps(payload, ensure_ascii=False).replace("</", "<\\/")
    html = PICKER_TEMPLATE.read_text(encoding="utf-8").replace("/*__DATA__*/null", blob)
    font = picker_font()
    if font:
        html = html.replace('/*__FONT__*/local("AvQest")', f"url(data:font/ttf;base64,{font})")
    PICKER.write_text(html, encoding="utf-8", newline="\n")


def requests(items, picks):
    """{roll key: [(item, roll)]}: the author's picks of rolls that have no tag line yet."""
    out = {}
    for it in one_per_key(sorted(items, key=lambda x: x.key)):
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
    for codes in families.values():
        if isinstance(codes, list):
            for c in codes:
                CODE_FAMILY.setdefault(c, codes)
    raw = [r for r in item_data.items(families) if r["codes"] and r["page"] not in SKIP_PAGES]
    for r in raw:  # slot of each base code, from the typed unique pages
        slot = "WEAPON" if r["page"] in WEAPON_PAGES else PAGE_SLOT.get(r["page"])
        for c in r["codes"]:
            if slot:
                CODE_SLOT.setdefault(c, "CIRC" if c.startswith("ci") else slot)
                CODE_PAGE.setdefault(c, r["page"])
    match_game(raw, names)
    items = [Item(r, families) for r in raw]
    build_fingerprints(items)
    return items


def match_game(raw, names):
    """Give each wiki item its row of PD2's own data (same kind and name, as the game shows it), and add the
    game's items the wiki lacks: they get tags too, and their stats keep other items' fingerprints honest."""
    game = [g for g in pd2_data.load_items() if g["slot"] not in ("?", "") and g["code"] in CODE_FAMILY]
    by_name = {}  # (quest items have no code in the item-code tables: left out above)
    for g in game:
        by_name.setdefault((g["kind"], pd2_data.norm_name(g["name"])), []).append(g)
    used, versions = set(), []
    for r in raw:
        name = pd2_data.norm_name(GAME_NAMES.get(r["name"], r["name"]))
        cands = [g for g in by_name.get((r["kind"], name), []) if id(g) not in used]
        cands.sort(key=lambda g: g["code"] not in r["codes"])
        if not cands:
            NO_GAME_DATA.append(f"{r['kind']} {r['name']}")
        for i, g in enumerate(cands):  # a second row of the same name is another version of the item
            used.add(id(g))
            if i == 0:
                r["game"] = g
            else:
                versions.append({**r, "game": g})
    raw += versions
    for g in game:
        if id(g) not in used:
            raw.append({"kind": g["kind"], "name": g["name"], "page": GAME_PAGE, "base": names.get(g["code"], g["code"]),
                        "codes": CODE_FAMILY.get(g["code"], [g["code"]]), "stats": [], "rolls": [], "game": g})
            GAME_ONLY.append(f"{g['kind']} {g['name']}")


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
