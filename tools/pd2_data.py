#!/usr/bin/env python3
"""
PD2's own unique, set and runeword data, for the roll tags (tools/gen_unique_rolls.py, tools/gen_runeword_rolls.py).

The wiki (docs/items/) lags behind the game and does not always say how the game stores a stat: "+2 to
Skeleton Mastery" without "(Necromancer Only)" is an oskill (stat 97, OS69) not a class skill (stat 107,
SK69); PD2's chance-to-cast and charges use their own "Proc" skills (AmpDmg Proc is skill 442, not Amplify
Damage 66); "-50 to Monster Defense per Hit" is stored as -50. The game's tables are exact, so the stats,
roll ranges and fingerprints come from here; the wiki still names the items and gives the stat text the
roll picker shows.

    python tools/pd2_data.py --extract "C:\\Users\\<you>\\Diablo II"
        reads ProjectD2\\pd2data.mpq (UniqueItems, SetItems, Runes, Gems, Properties, ItemStatCost, Skills,
        item types and bases, AutoMagic, QualityItems, CubeMain, string tables) and the base game's string tables,
        and writes docs/pd2-unique-set-items.tsv, docs/pd2-runewords.tsv, docs/pd2-corruptions.tsv (what each
        corruption outcome adds) and tools/pd2_stat_priority.tsv. Run it
        each season and after a PD2 patch that changes items, then python tools/gen_unique_rolls.py,
        python tools/gen_runeword_rolls.py and python tools/tag_order.py --fix. Also does --tier-data.
    python tools/pd2_data.py --tier-data "C:\\Users\\<you>\\Diablo II"
        only writes what tools/tier_map.py and tools/base_map.py read: docs/pd2-bases.tsv (each base's name,
        tier, item types, sockets and size), docs/pd2-skills.tsv (skill names), docs/pd2-sounds.tsv (Sounds.txt:
        the sound each %SOUNDID-n% plays) and docs/pd2-palette.tsv (the colors of %BORDER-xx% %MAP-xx% %DOT-xx%
        %PX-xx%)
    python tools/pd2_data.py --report NAME
        the stats of the items and runewords whose name contains NAME (as the generators read them)

Each item is one line: kind, name (as the game shows it), the table's own name, base code, slot, caster
(1 for staves, wands, scepters, orbs), required level, then its properties as JSON: one list per property
line of the item, each [code, low, high] in the filter's terms (the first is what a tag of that line shows).
+% damage is EDAM and +% defense ED: BH's ED reads enhanced defense on armor, so on a helm or shield only
EDAM reads +% damage (Biggin's Bonnet, Alma Negra). A per-level stat is stored as the item holds it, N shifted
by its ValShift (as for runewords: perlevel). "+N to a random skill" is RANDSK<skill IDs> (Ormus' Robes, Spirit
Keeper) and "+N to a random class's skills" RANDCLSK<class numbers> (Spirit Ward), with N as low and high: the
item gets one of them, which the filter reads as SK<id> / CLSK<n>.

Each runeword is one line per kind of base it can be made in (weapon, armor or shield: the runes give each
their own stats, Gems.txt): name, Runes.txt row, that kind, sockets, runes, the filter's slot words, the item
types, the stats a white base of those types can bring itself (superior, automagic, staffmods: "SK*" = any
single skill), the properties (as above; +% damage is EDAM and +% defense EDEF, the codes BH reads with
runeword and rune bonuses), each property as the game words it, and the runes' stats and wording.
"""
import argparse
import datetime
import json
import re
import struct
import sys
from pathlib import Path

sys.dont_write_bytecode = True
TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
ITEMS_FILE = ROOT / "docs" / "pd2-unique-set-items.tsv"
RUNEWORDS_FILE = ROOT / "docs" / "pd2-runewords.tsv"
CORRUPTIONS_FILE = ROOT / "docs" / "pd2-corruptions.tsv"
PRIORITY_FILE = TOOLS / "pd2_stat_priority.tsv"
BASES_FILE = ROOT / "docs" / "pd2-bases.tsv"
SOUNDS_FILE = ROOT / "docs" / "pd2-sounds.tsv"
PALETTE_FILE = ROOT / "docs" / "pd2-palette.tsv"
SKILLS_FILE = ROOT / "docs" / "pd2-skills.tsv"
MAGIC_AFFIXES_FILE = ROOT / "docs" / "pd2-magic-affixes.tsv"
STAT_TEXT_FILE = ROOT / "docs" / "pd2-stat-text.tsv"
BASE_STATS_FILE = ROOT / "docs" / "pd2-base-stats.tsv"
VENDORS_FILE = ROOT / "docs" / "pd2-vendors.tsv"
TOOLTIP_STRINGS_FILE = ROOT / "docs" / "pd2-tooltip-strings.tsv"
BS = chr(92)

# Stats the filter has a name for (the generator's vocabulary); others are STAT<id>
NAMED = {0: "STR", 2: "DEX", 7: "LIFE", 9: "MANA", 16: "ED", 19: "AR", 21: "MINDMG", 22: "MAXDMG", 31: "DEF",
         39: "FRES", 41: "LRES", 43: "CRES", 45: "PRES", 79: "GFIND", 80: "MFIND", 93: "IAS", 96: "FRW", 99: "FHR",
         102: "FBR", 105: "FCR", 114: "DTM", 127: "ALLSK"}
SKIP_STATS = {72, 73}  # durability: base plus bonus, never a tag
SLOT_TYPES = [("circ", "CIRC"), ("helm", "HELM"), ("tors", "CHEST"), ("shld", "SHIELD"), ("glov", "GLOVES"),
              ("boot", "BOOTS"), ("belt", "BELT"), ("amul", "amu"), ("ring", "rin"), ("bowq", "QUIVER"),
              ("xboq", "QUIVER"), ("weap", "WEAPON"), ("char", None), ("jewl", None)]
CASTER_TYPES = {"staf", "wand", "scep", "orb"}
CLASS_NAMES = ["Amazon", "Sorceress", "Necromancer", "Paladin", "Barbarian", "Druid", "Assassin"]
CLASS_CODES = ["ama", "sor", "nec", "pal", "bar", "dru", "ass"]
# Elemental "Adds X-Y damage" properties: (element as shown)
ADDS_DAMAGE = {"dmg-fire": "Fire", "dmg-ltng": "Lightning", "dmg-cold": "Cold", "dmg-mag": "Magic", "dmg-norm": "",
               "dmg-elem": "Fire, Lightning and Cold"}
# PD2's own random-skill properties (function 25, its code, no stat): the class whose skills they pick from.
# Ormus' Robes: any direct-damage Sorceress skill (the wiki); all her skills are listed, the extra ones never roll.
RAND_SKILL_CLASS = {"sorc-skill-rand-ctc": "sor"}


# ---------------------------------------------------------------- reading the game files

def to_int(text):
    text = str(text or "").strip()
    return int(text) if text.lstrip("-").isdigit() else 0


def value_text(lo, hi):
    """A value as the picker shows it: 5, [5-10], -[5-10]."""
    if lo == hi:
        return str(lo)
    return f"-[{-hi}-{-lo}]" if hi < 0 else f"[{lo}-{hi}]"


def bh_number(x):
    """A number as BH shows a formula's result: two decimals, without trailing zeros (0.75, 0.5, 1)."""
    text = f"{x:.2f}"
    return text[:-3] if text.endswith("00") else text[:-1] if text.endswith("0") else text


def id_ranges(ids):
    """[36, 37, 38, 40] -> '36-38,40'."""
    out, start = [], None
    for i, x in enumerate(ids):
        start = x if start is None else start
        if i + 1 == len(ids) or ids[i + 1] != x + 1:
            out.append(f"{start}-{x}" if x != start else str(x))
            start = None
    return ",".join(out)


def id_list(text):
    """'36-38,40' -> [36, 37, 38, 40]."""
    out = []
    for part in text.split(","):
        a, _, b = part.partition("-")
        out += list(range(int(a), int(b or a) + 1))
    return out


def compact(value):
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)


def read_tbl(data):
    """A D2 .tbl string table: {key: text}."""
    _, n, hsize = struct.unpack_from("<HHI", data, 0)
    pos = 21 + 2 * n
    out = {}
    for i in range(hsize):
        used, _, _, koff, soff, slen = struct.unpack_from("<BHIIIH", data, pos + i * 17)
        if used:
            key = data[koff:data.index(b"\0", koff)].decode("latin-1")
            out[key] = data[soff:soff + slen].split(b"\0")[0].decode("latin-1")
    return out


def read_tbl_list(data):
    """A D2 .tbl string table in its own order: [(key, text)], the n-th the game's string n of that table."""
    _, n, _ = struct.unpack_from("<HHI", data, 0)
    slots = struct.unpack_from(f"<{n}H", data, 21)
    out = []
    for slot in slots:
        _, _, _, koff, soff, slen = struct.unpack_from("<BHIIIH", data, 21 + 2 * n + slot * 17)
        out.append((data[koff:data.index(b"\0", koff)].decode("latin-1"),
                    data[soff:soff + slen].split(b"\0")[0].decode("latin-1")))
    return out


def read_rows(text):
    """A table's rows, every one kept (read_table drops those with an empty first column: the affix tables'
    separator rows count in the game's numbering)."""
    rows = [r.split("\t") for r in text.replace("\r\n", "\n").split("\n")]
    head = rows[0]
    while rows and not any(c.strip() for c in rows[-1]):
        rows.pop()
    return [{h: (r[i] if i < len(r) else "") for i, h in enumerate(head)} for r in rows[1:]]


def read_table(text):
    rows = [r.split("\t") for r in text.replace("\r\n", "\n").split("\n")]
    head = rows[0]
    return [{h: (r[i] if i < len(r) else "") for i, h in enumerate(head)} for r in rows[1:] if r and r[0]]


class Game:
    def __init__(self, game_dir):
        import pd2_mpq
        game_dir = Path(game_dir)
        pd2 = pd2_mpq.MPQ(game_dir / "ProjectD2" / "pd2data.mpq")
        excel = lambda name: read_table(pd2.read(BS.join(["data", "global", "excel", name])).decode("latin-1"))
        self.uniques, self.sets = excel("UniqueItems.txt"), excel("SetItems.txt")
        self.properties = {r["code"].lower(): r for r in excel("Properties.txt")}
        self.statcost = excel("ItemStatCost.txt")
        self.stat_id = {r["Stat"]: int(r["*ID"] if "*ID" in r else r["ID"]) for r in self.statcost
                        if (r.get("*ID") or r.get("ID") or "").strip().isdigit()}
        self.valshift = {self.stat_id[r["Stat"]]: int(r["ValShift"] or 0) for r in self.statcost
                         if r["Stat"] in self.stat_id and "ValShift" in r}
        self.skill_id = {}
        skills = excel("Skills.txt")
        for r in skills:
            if r["Id"].strip().isdigit():
                self.skill_id.setdefault(r["skill"].lower(), int(r["Id"]))
        self.type_rows = {r["Code"]: r for r in excel("ItemTypes.txt") if r["Code"]}
        self.types = {code: (r["Equiv1"], r["Equiv2"]) for code, r in self.type_rows.items()}
        self.base_type, self.base_rows = {}, {}
        for name in ("Weapons.txt", "Armor.txt", "Misc.txt"):
            for r in excel(name):
                if r.get("code"):
                    self.base_type[r["code"]] = (r.get("type", ""), r.get("type2", ""))
                    self.base_rows.setdefault(r["code"], r)
        self.statcost_by_id = {self.stat_id[r["Stat"]]: r for r in self.statcost if r["Stat"] in self.stat_id}
        self.runewords, self.automagic, self.superior = excel("Runes.txt"), excel("AutoMagic.txt"), excel("QualityItems.txt")
        self.cube = excel("CubeMain.txt")
        self.gems = {r["code"]: r for r in excel("Gems.txt") if r.get("code")}
        self.charstats = {r["class"]: r for r in excel("CharStats.txt") if r.get("class")}
        skill_desc = {r["skilldesc"]: r.get("str name", "") for r in excel("SkillDesc.txt") if r.get("skilldesc")}
        strings, self.string_ids, self.keyed_strings = {}, {}, {}
        for mpq, tbl in ((game_dir / "d2data.mpq", "string.tbl"), (game_dir / "d2exp.mpq", "expansionstring.tbl"),
                         (game_dir / "ProjectD2" / "patch_d2.mpq", "patchstring.tbl"),
                         (game_dir / "ProjectD2" / "pd2data.mpq", "patchstring.tbl")):
            try:
                data = pd2_mpq.MPQ(mpq).read(BS.join(["data", "local", "LNG", "ENG", tbl]))
            except (OSError, KeyError, ValueError):
                continue  # an archive without that table
            strings.update(read_tbl(data))
            # the game's string numbers (the ones BH asks for by number): string.tbl from 0, patchstring.tbl from 10000,
            # expansionstring.tbl from 20000
            first = {"string.tbl": 0, "patchstring.tbl": 10000, "expansionstring.tbl": 20000}[tbl]
            listed, own = read_tbl_list(data), {}
            self.string_ids.update({first + i: text for i, (_, text) in enumerate(listed)})
            for key, text in listed:  # a key twice in a table (StrSklTabItem6: Combat Skills, Summoning Skills):
                own.setdefault(key, text)  # the game finds the first
            self.keyed_strings.update(own)
        self.strings = strings
        self.pd2 = pd2
        self.skill_names, self.skill_class, self.skill_rows = {}, {}, {}
        for r in skills:
            if r["Id"].strip().isdigit():
                sid = int(r["Id"])
                self.skill_rows.setdefault(sid, r)
                self.skill_names.setdefault(sid, strings.get(skill_desc.get(r.get("skilldesc", ""), ""), r["skill"]))
                self.skill_class.setdefault(sid, r.get("charclass", "").strip())

    def ancestors(self, code):
        seen, todo = [], list(self.base_type.get(code, ("", "")))
        while todo:
            t = todo.pop(0)
            if t and t not in seen:
                seen.append(t)
                todo += list(self.types.get(t, ("", "")))
        return seen

    def slot(self, code):
        anc = self.ancestors(code)
        for t, slot in SLOT_TYPES:
            if t in anc:
                return slot or ""
        return "?"

    def skill(self, par):
        par = par.strip()
        return int(par) if par.isdigit() else self.skill_id.get(par.lower())

    def stat_code(self, sid):
        if sid in SKIP_STATS:
            return None
        if sid in NAMED:
            return NAMED[sid]
        return None if self.valshift.get(sid) else f"STAT{sid}"

    def prop_stats(self, prop, par, lo, hi, split_ed=False):
        """[(code, low, high)] for one property line, the shown stat first; [] if none is usable.
        +% damage is always EDAM (BH's ED reads enhanced defense on armor).
        split_ed: +% defense is EDEF (what BH reads on runewords) instead of ED."""
        if prop.lower().startswith("map-") or prop.lower() == "splash":
            return []
        row = self.properties.get(prop.lower())
        if not row:
            return []
        lo, hi = (int(lo) if lo.strip().lstrip("-").isdigit() else 0), (int(hi) if hi.strip().lstrip("-").isdigit() else 0)
        out = []
        for i in range(1, 8):
            func, stat = row.get(f"func{i}", "").strip(), row.get(f"stat{i}", "").strip()
            if not func:
                continue
            f, sid = int(func), self.stat_id.get(stat)
            if f in (1, 2, 3, 8) and sid is not None:
                code = {16: "EDEF", 17: "EDAM"}.get(sid) if split_ed else None
                code = code or self.stat_code(sid)
                if code:
                    out.append((code, lo, hi))
            elif f == 7:  # +% enhanced damage (max and min damage %)
                out.append(("EDAM", lo, hi))
            elif f == 5:
                out.append(("MINDMG", lo, hi))
            elif f == 6:
                out.append(("MAXDMG", lo, hi))
            elif f in (15, 16) and sid is not None:  # flat damage: min / max field
                code = self.stat_code(sid)
                if code:
                    out.append((code, lo, lo) if f == 15 else (code, hi, hi))
            elif f == 10 and par.strip().isdigit():  # skill tab: the table counts 3 per class, BH's TABSK 8
                tab = int(par)
                out.append((f"TABSK{tab // 3 * 8 + tab % 3}", lo, hi))
            elif f == 11 and sid is not None:  # chance to cast: param = skill * 64 + level
                skill = self.skill(par)
                if skill is not None:
                    out.append((f"MULTI{sid},{skill * 64 + hi}", 1, 1))
            elif f == 19 and sid is not None:  # charges: param = skill * 64 + level
                skill = self.skill(par)
                if skill is not None:
                    out.append((f"MULTI{sid},{skill * 64 + hi}", 1, 1))
            elif f == 12 and sid is not None:  # +N to a random skill (skill-rand): param N, min-max the skill IDs
                out.append((f"RANDSK{lo}-{hi}", to_int(par), to_int(par)))
            elif f == 36 and sid == 83:  # +N to a random class's skills (randclassskill): val N, min-max the classes
                n = to_int(row.get(f"val{i}"))
                out.append((f"RANDCLSK{lo}-{hi}", n, n))
            elif f == 25 and prop.lower() in RAND_SKILL_CLASS:  # PD2's own: +N to a random skill of a class (param N)
                cls = RAND_SKILL_CLASS[prop.lower()]
                ids = sorted(s for s, c in self.skill_class.items() if c == cls)
                out.append((f"RANDSK{id_ranges(ids)}", to_int(par), to_int(par)))
            elif f == 20:
                out.append(("STAT152", 1, 1))
            elif f == 21 and sid is not None:
                val = int(row.get(f"val{i}") or 0)
                out.append((f"CLSK{val}" if sid == 83 else f"MULTI{sid},{val}", lo, hi))
            elif f == 22 and sid is not None:
                skill = self.skill(par)
                if skill is None:
                    continue
                code = {107: f"SK{skill}", 97: f"OS{skill}", 151: f"MULTI151,{skill}"}.get(sid)
                if code:
                    out.append((code, lo, hi))
            elif f == 14:
                out.append(("SOCK", lo, hi))
        if prop.lower() == "res-all" and len(out) == 4:
            out.insert(0, ("RES", lo, hi))
        if prop.lower() == "all-stats" and len(out) == 4:
            out.insert(0, ("ALLATTRIB", lo, hi))
        if prop.lower() == "res-all-max" and len(out) == 4:  # one roll for all four: the maxres tag
            out.insert(0, ("MAXRES", lo, hi))
        if prop.lower().startswith("dmg-") and len(out) == 2 and out[0][1] == lo:
            out.reverse()  # "Adds X-Y damage": the maximum is the tag, the minimum goes along
        return out

    def items(self):
        out = []
        for kind, rows, count in (("UNI", self.uniques, 12), ("SET", self.sets, 9)):
            for r in rows:
                code = r.get("code") if kind == "UNI" else r.get("item")
                if kind == "UNI" and r.get("enabled", "1").strip() != "1":
                    continue
                slot = self.slot(code)
                if not slot:
                    continue  # charms and jewels: done by hand in 240-charms / 250-jewels
                props, per_level, eth = [], {}, 0
                for i in range(1, count + 1):
                    p = r.get(f"prop{i}", "").strip()
                    if p and self.first_func(p) == 23:  # "ethereal": the item always drops ethereal (Ethereal Edge)
                        eth = 1
                    elif p:
                        par, lo, hi = r.get(f"par{i}", ""), r.get(f"min{i}", ""), r.get(f"max{i}", "")
                        level = self.per_level_prop(p, par, lo, hi)
                        if level:
                            props.append([level[0]])
                            per_level[level[0][0]] = level[1]
                            continue
                        stats = self.prop_stats(p, par, lo, hi)
                        if stats:
                            props.append([list(s) for s in stats])
                caster = int(bool(CASTER_TYPES & set(self.ancestors(code))))
                out.append([kind, self.strings.get(r["index"], r["index"]), r["index"], code, slot, str(caster),
                            r.get("lvl req", "").strip(), json.dumps(props, separators=(",", ":")),
                            compact(per_level), str(eth)])
        return out

    def per_level_prop(self, prop, par, lo, hi):
        """([code, low, high], [the stat it adds to, divisor]) of a per-level property, or None. The item holds N
        shifted by the stat's ValShift, which BH reads; shown per level as STAT/(8 << ValShift)."""
        level = self.per_level(prop)
        if not level:
            return None
        sid, base = level
        a, b = (to_int(lo), to_int(hi)) if (lo.strip() or hi.strip()) else (to_int(par), to_int(par))
        shift = 1 << to_int(self.statcost_by_id[sid].get("ValShift"))
        return [f"STAT{sid}", a * shift, b * shift], [self.stat_code(base) or f"STAT{base}", 8 * shift]

    # ---------------------------------------------------------------- corruptions

    def corruption_rows(self):
        """The cube's corruption outcomes (CubeMain.txt rows that set 'corrupt'): [input, outcome, sockets, props],
        props as [[code, low, high], ...] per property (as an item's); sockets: the most a socket outcome adds."""
        out = []
        for r in self.cube:
            if r.get("enabled", "").strip() != "1":
                continue
            outcome, sockets, props = None, "", []
            for k in range(1, 6):
                mod = r.get(f"mod {k}", "").strip()
                if not mod:
                    continue
                par, lo, hi = r.get(f"mod {k} param", ""), r.get(f"mod {k} min", ""), r.get(f"mod {k} max", "")
                if mod == "corrupt":
                    outcome = to_int(lo)
                elif mod == "sock":
                    sockets = str(max(to_int(lo), to_int(hi)))
                elif mod != "corruptnum":
                    stats = self.prop_stats(mod, par, lo, hi)
                    if stats:
                        props.append([list(s) for s in stats])
            if outcome is not None and (props or sockets):  # (map corruptions: no item stats)
                out.append([r.get("input 1", "").strip().strip('"'), str(outcome), sockets,
                            json.dumps(props, separators=(",", ":"))])
        return out

    # ---------------------------------------------------------------- runewords

    def first_func(self, prop):
        row = self.properties.get(prop.strip().lower(), {})
        return to_int(row.get("func1"))

    def per_level(self, prop):
        """(stat id, base stat id) of a per-level property ("str/lvl": +N/8 Strength per character level), or
        None. The item holds N (shifted by the stat's ValShift); its min/max (PD2's variable ones, e.g. Enigma's
        4-6 = 0.5-0.75) or else its param give N."""
        row = self.properties.get(prop.strip().lower(), {})
        if to_int(row.get("func1")) != 17 or any(row.get(f"func{i}", "").strip() for i in range(2, 8)):
            return None
        sid = self.stat_id.get(row.get("stat1", "").strip())
        stat = self.statcost_by_id.get(sid, {})
        base = self.stat_id.get(stat.get("op stat1", "").strip())
        if stat.get("op base", "").strip().lower() != "level" or base is None:
            return None
        return sid, base

    def describe(self, prop, par, lo, hi):
        """One property line as the item words it, e.g. '+[25-35]% Faster Cast Rate' (a roll's range in brackets)."""
        p = prop.strip().lower()
        row = self.properties.get(p)
        lo, hi = to_int(lo), to_int(hi)
        funcs = [(to_int(row[f"func{i}"]), row.get(f"stat{i}", "").strip(), row.get(f"val{i}", "").strip())
                 for i in range(1, 8) if row.get(f"func{i}", "").strip()] if row else []
        if not funcs:
            return prop
        v, plus = value_text(lo, hi), "+" if lo >= 0 else ""
        if p == "res-all":
            return f"All Resistances +{v}"
        if p == "all-stats":
            return f"+{v} to all Attributes"
        if p in ADDS_DAMAGE:
            element = ADDS_DAMAGE[p] + " " if ADDS_DAMAGE[p] else ""
            return f"+{lo} {element}Damage" if lo == hi else f"Adds {lo}-{hi} {element}Damage"
        if p == "dmg-pois":  # damage per frame over param frames
            frames = to_int(par) or 1
            return f"+{value_text(round(lo * frames / 256), round(hi * frames / 256))} Poison Damage over {round(frames / 25)} Seconds"
        f, stat, val = funcs[0]
        sid = self.stat_id.get(stat)
        if self.per_level(p):  # per character level, in eighths: "+[0.5-0.75] to Strength (Based on Character Level)"
            a, b = (lo, hi) if (lo or hi) else (to_int(par), to_int(par))
            each = bh_number(a / 8) if a == b else f"[{bh_number(a / 8)}-{bh_number(b / 8)}]"
            return self.stat_text(sid, a, b, each) or f"{prop} {each}"
        skill = self.skill(par) if f in (11, 19, 22) else None
        name = self.skill_names.get(skill, par.strip())
        if f == 7:
            return f"{plus}{v}% Enhanced Damage"
        if f in (5, 6):
            return f"{plus}{v} to {'Minimum' if f == 5 else 'Maximum'} Damage"
        if f == 10 and par.strip().isdigit():  # skill tab: 3 per class
            tab = int(par)
            cls = CLASS_NAMES[tab // 3] if tab // 3 < len(CLASS_NAMES) else "?"
            row = self.charstats.get(cls, {})
            text = self.strings.get(row.get(f"StrSkillTab{tab % 3 + 1}", ""), "")
            only = self.strings.get(row.get("StrClassOnly", ""), f"({cls} Only)")
            return (text.replace("%d", v, 1) if "%d" in text else f"+{v} to {cls} skill tab {tab % 3 + 1}") + " " + only
        if f == 19:
            return f"Level {hi} {name} ({lo}/{lo} Charges)"
        if f == 11:
            text = self.strings.get(self.statcost_by_id.get(sid, {}).get("descstrpos", ""), "") or "%d%% Chance to cast level %d %s"
            return text.replace("%d%%", f"{lo}%", 1).replace("%d", str(hi), 1).replace("%s", name, 1)
        if f == 20:
            return "Indestructible"
        if f == 14:
            return f"Socketed ({v})"
        if f == 21 and sid == 83 and val.isdigit():
            return f"{plus}{v} to {CLASS_NAMES[int(val)]} Skill Levels"
        if f == 22 and sid == 151:
            return f"Level {v} {name} Aura When Equipped"
        if f == 22 and sid == 97:
            return f"{plus}{v} to {name}"
        if f == 22 and sid == 107:
            cls = self.skill_class.get(skill, "")
            only = f" ({CLASS_NAMES[CLASS_CODES.index(cls)]} Only)" if cls in CLASS_CODES else ""
            return f"{plus}{v} to {name}{only}"
        return (self.stat_text(sid, lo, hi) if sid is not None else None) or f"{prop} {v}"

    def stat_text(self, sid, lo, hi, v=None):
        """A stat worded by ItemStatCost's descfunc / descval / description strings (None if it has none);
        v: the value as text, if not lo-hi."""
        r = self.statcost_by_id.get(sid)
        if not r:
            return None
        func, where = to_int(r.get("descfunc")), to_int(r.get("descval"))
        s = self.strings.get(r.get("descstrpos" if lo >= 0 else "descstrneg", ""), "")
        if not s:
            return None
        v, plus = v or value_text(lo, hi), "+" if lo >= 0 else ""
        if func == 20:  # -% to enemy resistance: stored positive
            return f"-{v}% {s}"
        s2 = self.strings.get(r.get("descstr2", ""), "")
        forms = {1: (f"{plus}{v}", ""), 2: (f"{v}%", ""), 3: (v, ""), 4: (f"{plus}{v}%", ""), 5: (f"{v}%", ""),
                 6: (f"{plus}{v}", s2), 7: (f"{v}%", s2), 8: (f"{plus}{v}%", s2), 9: (v, s2), 12: (f"{plus}{v}", "")}
        if func not in forms:
            return f"{s} {v}"
        num, tail = forms[func]
        text = s if where == 0 else f"{s} {num}" if where == 2 else f"{num} {s}"
        return f"{text} {tail}".strip()

    def type_name(self, code):
        return self.type_rows.get(code, {}).get("ItemType", code) or code

    def base_addable(self, codes, kind):
        """Stat codes a white base among codes can bring itself: superior quality, its automagic group
        (staff FCR, paladin shield resistances, Amazon skill tabs...), staffmods ("SK*")."""
        found = set()
        flag = {"weapon": "weapon", "armor": "armor", "shield": "shield"}[kind]

        def add(mods):
            for mc, mp, mlo, mhi in mods:
                if mc:
                    found.update(c for c, _, _ in self.prop_stats(mc, mp, mlo, mhi, split_ed=True))

        for q in self.superior:
            if q.get(flag, "").strip() == "1":
                add((q.get(f"mod{i}code", "").strip(), q.get(f"mod{i}param", ""), q.get(f"mod{i}min", ""),
                     q.get(f"mod{i}max", "")) for i in (1, 2))
        groups = {self.base_rows[c].get("auto prefix", "").strip() for c in codes} - {""}
        for a in self.automagic:
            if a.get("group", "").strip() in groups:
                add((a.get(f"mod{i}code", "").strip(), a.get(f"mod{i}param", ""), a.get(f"mod{i}min", ""),
                     a.get(f"mod{i}max", "")) for i in (1, 2, 3))
        if any(self.type_rows.get(t, {}).get("StaffMods", "").strip() for c in codes for t in self.ancestors(c)):
            found.add("SK*")
        return sorted(found)

    def runeword_rows(self):
        """One row per complete runeword (Runes.txt) and kind of base it fits: see the module docstring."""
        out = []
        for r in self.runewords:
            if r.get("complete", "").strip() != "1":
                continue
            itypes = [r[f"itype{i}"].strip() for i in range(1, 7) if r.get(f"itype{i}", "").strip()]
            etypes = [r[f"etype{i}"].strip() for i in range(1, 4) if r.get(f"etype{i}", "").strip()]
            runes = [r[f"Rune{i}"].strip() for i in range(1, 7) if r.get(f"Rune{i}", "").strip()]
            props, texts, per_level = [], [], {}
            for i in range(1, 8):
                code = r.get(f"T1Code{i}", "").strip()
                if not code:
                    continue
                par, lo, hi = r.get(f"T1Param{i}", ""), r.get(f"T1Min{i}", ""), r.get(f"T1Max{i}", "")
                if to_int(hi) < to_int(lo) and self.first_func(code) not in (11, 19):
                    lo, hi = hi, lo  # a range written high to low (Voice of Reason's damage to undead)
                texts.append(self.describe(code, par, lo, hi))
                level = self.per_level_prop(code, par, lo, hi)
                if level:
                    per_level[level[0][0]] = level[1]
                    props.append([level[0]])
                    continue
                props.append([list(s) for s in self.prop_stats(code, par, lo, hi, split_ed=True)])
            kinds = {}  # the bases it fits (enough sockets), by the rune stats they get
            for code, base in self.base_rows.items():
                anc = self.ancestors(code)
                if not set(itypes) & set(anc) or set(etypes) & set(anc):
                    continue
                if to_int(base.get("gemsockets")) < len(runes) or base.get("spawnable", "1").strip() == "0":
                    continue
                kinds.setdefault("weapon" if "weap" in anc else "shield" if "shld" in anc else "armor", []).append(code)
            for kind, codes in sorted(kinds.items()):
                types = [self.type_name(t) for t in itypes if any(t in self.ancestors(c) for c in codes)]
                if etypes:
                    types.append("not " + " or ".join(self.type_name(t) for t in etypes))
                slots = sorted({self.slot(c) for c in codes} - {"", "?"})
                rune_stats, rune_texts = [], []
                prefix = {"weapon": "weapon", "armor": "helm", "shield": "shield"}[kind]
                for rc in runes:
                    gem = self.gems.get(rc, {})
                    for i in (1, 2, 3):
                        mc = gem.get(f"{prefix}Mod{i}Code", "").strip()
                        if mc:
                            m = (gem.get(f"{prefix}Mod{i}Param", ""), gem.get(f"{prefix}Mod{i}Min", ""),
                                 gem.get(f"{prefix}Mod{i}Max", ""))
                            rune_stats.append([list(s) for s in self.prop_stats(mc, *m, split_ed=True)])
                            rune_texts.append(f"{gem.get('name', rc).replace(' Rune', '')}: {self.describe(mc, *m)}")
                rune_names = " ".join(self.gems.get(rc, {}).get("name", rc).replace(" Rune", "") for rc in runes)
                bases = [[c, self.base_name(c), self.tier(c)] for c in sorted(codes)]
                out.append(["RW", self.strings.get(r["Name"], r["Name"]), r["Name"], kind, str(len(runes)), rune_names,
                            ",".join(slots), ", ".join(types), compact(self.base_addable(codes, kind)), compact(props),
                            compact(texts), compact(rune_stats), compact(rune_texts), compact(per_level),
                            compact(bases)])
        return out

    def base_name(self, code):
        row = self.base_rows.get(code, {})
        return self.strings.get(row.get("namestr", ""), row.get("name", code))

    def tier(self, code):
        row = self.base_rows.get(code, {})
        return "elite" if code == row.get("ultracode") else "exceptional" if code == row.get("ubercode") else "normal"


def extract(game_dir):
    game = Game(game_dir)
    rows = game.items()
    stamp = datetime.date.today().isoformat()
    lines = [f"# PD2 unique and set items from pd2data.mpq, extracted {stamp} by tools/pd2_data.py --extract.",
             "# kind, name, table name, base code, slot, caster, required level, properties as [[code, low, high], ...];",
             "# +% damage is EDAM, +% defense ED; RANDSK<skill IDs> / RANDCLSK<classes> = +N to a random skill / class's",
             "# skills; perlevel = per-level stats as {code: [the stat it adds to, divisor]} (STAT216 8-12 << 8 / 2048 =",
             "# 1-1.5 Life per level); eth 1 = the item always drops ethereal (its 'ethereal' property)",
             "\t".join(["kind", "name", "index", "code", "slot", "caster", "lvlreq", "props", "perlevel", "eth"])]
    lines += ["\t".join(r) for r in rows]
    ITEMS_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {ITEMS_FILE.relative_to(ROOT)} ({len(rows)} items)")
    rows = game.runeword_rows()
    lines = [f"# PD2 runewords from pd2data.mpq, extracted {stamp} by tools/pd2_data.py --extract. One line per runeword",
             "# and kind of base (the runes give weapons, armor and shields their own stats). Properties and rune stats",
             "# as [[code, low, high], ...] per line; +% damage is EDAM, +% defense EDEF; addable = stats a white base",
             "# can bring itself (superior, automagic, staffmods: SK* = any single skill); perlevel = per-level stats as",
             "# {code: [the stat it adds to, divisor]} (STAT220 4-6 / 8 = 0.5-0.75 Strength per level); bases = [code,",
             "# name, tier] of the white bases it fits.",
             "\t".join(RUNEWORD_COLUMNS)]
    lines += ["\t".join(r) for r in rows]
    RUNEWORDS_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {RUNEWORDS_FILE.relative_to(ROOT)} ({len({r[1] for r in rows})} runewords, {len(rows)} lines)")
    write_corruptions(game)
    out = ["# PD2 ItemStatCost.txt: stat id, stat, descpriority (higher = listed higher on the item).",
           f"# Extracted {stamp} from pd2data.mpq by tools/pd2_data.py --extract."]
    for r in game.statcost:
        sid = (r.get("*ID") or r.get("ID") or "").strip()
        if sid.isdigit():
            out.append(f"{int(sid)}\t{r['Stat']}\t{r.get('descpriority', '').strip()}")
    PRIORITY_FILE.write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {PRIORITY_FILE.relative_to(ROOT)} ({len(out) - 2} stats)")
    extract_tier_data(game_dir, game)


def write_corruptions(game):
    """docs/pd2-corruptions.tsv: what a corruption can add to an item (tools/gen_unique_rolls.py keeps another item's
    corrupted stats from passing an item's fingerprint)."""
    rows = game.corruption_rows()
    lines = [f"# PD2 corruption outcomes (CubeMain.txt rows that set 'corrupt', stat 360) from pd2data.mpq, extracted "
             f"{datetime.date.today().isoformat()}",
             "# by tools/pd2_data.py --extract: the cube input (item type, then nos / sock and a quality: the items the",
             "# row takes), the outcome (STAT360=n), the most sockets a socket outcome adds, and the properties it adds",
             "# as [[code, low, high], ...] per property (as in pd2-unique-set-items.tsv).",
             "\t".join(["input", "outcome", "sockets", "props"])]
    lines += ["\t".join(r) for r in rows]
    CORRUPTIONS_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {CORRUPTIONS_FILE.relative_to(ROOT)} ({len(rows)} outcome rows)")


def extract_tier_data(game_dir, game=None):
    """For tools/tier_map.py and tools/base_map.py: docs/pd2-bases.tsv (code, name, tier as BH reads it, the base's
    item type and its ancestors, sockets, size), docs/pd2-skills.tsv (ID, name, class), docs/pd2-sounds.tsv (PD2's Sounds.txt: index, name, file) and docs/pd2-palette.tsv (the act 1
    palette BH draws minimap icons with: index as the filter writes it, hex color)."""
    import pd2_mpq
    game_dir = Path(game_dir)
    game = game or Game(game_dir)
    stamp = datetime.date.today().isoformat()
    out = [f"# PD2 item bases (Weapons, Armor, Misc) from pd2data.mpq, extracted {stamp} by tools/pd2_data.py: code,",
           "# name, tier (BH's NORM/EXC/ELT: the code against its ubercode/ultracode), item type and its ancestors,",
           "# most sockets (gemsockets), inventory width and height (BH's AREA is width x height), spawnable (0: no",
           "# white drop of this base: a base only some unique uses), quality level (level: BH's QLVL) and magic level",
           "# (magic lvl): the affix level is BH's ALVL, the game's formula again since the 2026-10-15 beta. eth: 1 if",
           "# the base has durability (it can drop ethereal), maxac and block: an armor's or shield's top base defense",
           "# and its base block (tools/label_cuts.py).",
           "code\tname\ttier\ttypes\tsockets\twidth\theight\tspawnable\tqlvl\tmlvl\teth\tmaxac\tblock"]
    # a quest item's name can hold a line break ("Right Click to learn skill...\nBook of Skill"): its last line
    for code in sorted(game.base_rows):
        r = game.base_rows[code]
        eth = int(r.get("nodurability", "").strip() in ("", "0") and to_int(r.get("durability")) > 0)
        out.append(f"{code}\t{game.base_name(code).splitlines()[-1]}\t{game.tier(code)}\t{','.join(game.ancestors(code))}"
                   f"\t{to_int(r.get('gemsockets'))}\t{to_int(r.get('invwidth'))}\t{to_int(r.get('invheight'))}"
                   f"\t{to_int(r.get('spawnable'))}\t{to_int(r.get('level'))}\t{to_int(r.get('magic lvl'))}"
                   f"\t{eth}\t{to_int(r.get('maxac'))}\t{to_int(r.get('block'))}")
    BASES_FILE.write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {BASES_FILE.relative_to(ROOT)} ({len(out) - 8} bases)")
    out = [f"# PD2 skills (Skills.txt, names from the string tables) from pd2data.mpq, extracted {stamp} by",
           "# tools/pd2_data.py: the skill ID the filter's SK<n> / OS<n> read, its name, class (charclass), price columns.",
           "id\tname\tclass\treqlevel\tcostmult\tcostadd\tmaxlvl"]
    out += [f"{sid}\t{name}\t{game.skill_class.get(sid, '')}\t" +
            "\t".join(game.skill_rows.get(sid, {}).get(c, "").strip()
                      for c in ("reqlevel", "cost mult", "cost add", "maxlvl"))
            for sid, name in sorted(game.skill_names.items())]
    SKILLS_FILE.write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {SKILLS_FILE.relative_to(ROOT)} ({len(out) - 3} skills)")
    pd2 = pd2_mpq.MPQ(game_dir / "ProjectD2" / "pd2data.mpq")
    rows = read_table(pd2.read(BS.join(["data", "global", "excel", "Sounds.txt"])).decode("latin-1"))
    out = [f"# PD2 Sounds.txt from pd2data.mpq, extracted {stamp} by tools/pd2_data.py: the sound %SOUNDID-n% plays.",
           "index\tsound\tfile"]
    out += [f"{int(r['Index'])}\t{r['Sound']}\t{r['FileName']}" for r in rows if r.get("Index", "").strip().isdigit()]
    SOUNDS_FILE.write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {SOUNDS_FILE.relative_to(ROOT)} ({len(out) - 2} sounds)")
    pal = pd2_mpq.MPQ(game_dir / "d2data.mpq").read(BS.join(["data", "global", "palette", "ACT1", "pal.dat"]))
    out = [f"# D2's act 1 palette (d2data.mpq pal.dat, stored blue-green-red), extracted {stamp} by tools/pd2_data.py:",
           "# the colors of %BORDER-xx% %MAP-xx% %DOT-xx% %PX-xx%.", "index\tcolor"]
    out += [f"{i:02X}\t#{pal[3 * i + 2]:02x}{pal[3 * i + 1]:02x}{pal[3 * i]:02x}" for i in range(256)]
    PALETTE_FILE.write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {PALETTE_FILE.relative_to(ROOT)} (256 colors)")
    extract_shop_data(game_dir, game)


# ---------------------------------------------------------------- the shop page's tables

# The game's own strings a hover box uses (by number, as BH's BHOnProperties reads them): Cost,
# Socketed, Durability ... of, requirements, defense, damage, Smite, Kick, weapon classes and speeds, class only,
# Chance to Block, rune quote, Claw Class, Ethereal
SHOP_STRING_IDS = ([3329, 3453] + list(range(3457, 3470)) + [3996] + list(range(4077, 4095)) + list(range(10917, 10924))
                   + [11018, 20506, 21258, 21782, 22745])
VENDORS = ["Charsi", "Akara", "Fara", "Lysander", "Drognan", "Elzix", "Hralti", "Alkor", "Ormus", "Asheara",
           "Halbu", "Jamella", "Larzuk", "Drehya", "Malah"]  # Weapons/Armor/Misc store columns (Hralti: the
#                                                              table's spelling), in act order; Gheed only gambles
VENDOR_NPC = {"Hralti": "hratli", "Drehya": "drehya"}


def mod_stats(game, prop, par, lo, hi):
    """[[stat id, param, low, high]] a property sets (the stat's param as the game stores it): a skill tab is 8 per
    class (BH's TABSK), charges and chance to cast are skill * 64 + level (their value: charges, chance), min / max
    damage are 21 / 22 (the game also sets the 2-handed and throw ones on a weapon), +% damage 17 and 18."""
    row = game.properties.get(prop.strip().lower())
    if not row:
        return []
    lo_i, hi_i, out = to_int(lo), to_int(hi), []
    for i in range(1, 8):
        func, stat = row.get(f"func{i}", "").strip(), row.get(f"stat{i}", "").strip()
        if not func:
            continue
        f, sid = int(func), game.stat_id.get(stat)
        if f in (1, 2, 3, 8) and sid is not None:
            out.append([sid, 0, lo_i, hi_i])
        elif f == 5:
            out.append([21, 0, lo_i, hi_i])
        elif f == 6:
            out.append([22, 0, lo_i, hi_i])
        elif f == 7:
            out += [[17, 0, lo_i, hi_i], [18, 0, lo_i, hi_i]]
        elif f == 10 and par.strip().isdigit():
            tab = int(par)
            out.append([188, tab // 3 * 8 + tab % 3, lo_i, hi_i])
        elif f == 11 and sid is not None:  # chance to cast: param skill * 64 + level, value the chance
            skill = game.skill(par)
            if skill is not None:
                out.append([sid, skill * 64 + hi_i, lo_i, lo_i])
        elif f == 19 and sid is not None:  # charges: the skill, min and max as the table has them (the level and
            skill = game.skill(par)       # charges follow from the item level: tools/shop_map.py)
            if skill is not None:
                out.append([sid, skill, lo_i, hi_i])
        elif f == 14:  # sockets: min-max, or else the param (Jeweler's: 4)
            out.append([194, 0, lo_i, hi_i] if (lo.strip() or hi.strip()) else [194, 0, to_int(par), to_int(par)])
        elif f == 15 and sid is not None:
            out.append([sid, 0, lo_i, lo_i])
        elif f == 16 and sid is not None:
            out.append([sid, 0, hi_i, hi_i])
        elif f == 17 and sid is not None:
            a, b = (lo_i, hi_i) if (lo.strip() or hi.strip()) else (to_int(par), to_int(par))
            out.append([sid, 0, a, b])
        elif f == 20:
            out.append([152, 0, 1, 1])
        elif f == 21 and sid is not None:
            out.append([sid, to_int(row.get(f"val{i}")), lo_i, hi_i])
        elif f == 22 and sid is not None:
            skill = game.skill(par)
            if skill is not None:
                out.append([sid, skill, lo_i, hi_i])
    return out


def extract_shop_data(game_dir, game=None):
    """For tools/shop_map.py (the Skill & Shop Highlights page's hover boxes and prices): docs/pd2-magic-affixes.tsv,
    docs/pd2-stat-text.tsv, docs/pd2-base-stats.tsv, docs/pd2-vendors.tsv, docs/pd2-tooltip-strings.tsv, and the
    skills' price columns in docs/pd2-skills.tsv."""
    game = game or Game(game_dir)
    stamp = datetime.date.today().isoformat()
    head = f"extracted {stamp} by tools/pd2_data.py --tier-data"
    excel = lambda name: read_rows(game.pd2.read(BS.join(["data", "global", "excel", name])).decode("latin-1"))
    prop_index = {r["code"].strip().lower(): i for i, r in enumerate(excel("Properties.txt")) if r["code"].strip()}

    out = [f"# PD2 magic affixes (MagicSuffix, MagicPrefix, AutoMagic) from pd2data.mpq, {head}. row: the table's",
           "# row from 0 (BH's SUFFIX / PREFIX numbers); name from the string tables; itypes / etypes: the item types it",
           "# rolls on / never on; multiply, add: its price columns; color: the color it gives the item's picture",
           "# (transformcolor, when transform is 1); mods: [property, its Properties.txt row, param, min, max,",
           "# [[stat id, stat param, low, high], ...]] (tools/pd2_data.py mod_stats).",
           "kind\trow\tname\tversion\tspawnable\trare\tlevel\tmaxlevel\tlevelreq\tclassspecific\tclass\tclasslevelreq"
           "\tfrequency\tgroup\titypes\tetypes\tmultiply\tadd\tcolor\tmods"]
    for kind, name in (("suffix", "MagicSuffix.txt"), ("prefix", "MagicPrefix.txt"), ("automagic", "AutoMagic.txt")):
        for n, r in enumerate(excel(name)):
            mods = []
            for k in (1, 2, 3):
                code = r.get(f"mod{k}code", "").strip()
                if code:
                    par, lo, hi = r.get(f"mod{k}param", ""), r.get(f"mod{k}min", ""), r.get(f"mod{k}max", "")
                    mods.append([code, prop_index.get(code.lower(), -1), par.strip(), to_int(lo), to_int(hi),
                                 mod_stats(game, code, par, lo, hi)])
            itypes = [r[f"itype{i}"].strip() for i in range(1, 8) if r.get(f"itype{i}", "").strip()]
            etypes = [r[f"etype{i}"].strip() for i in range(1, 6) if r.get(f"etype{i}", "").strip()]
            out.append("\t".join([kind, str(n), game.keyed_strings.get(r["Name"], r["Name"]).strip()] +
                                 [r.get(c, "").strip() for c in ("version", "spawnable", "rare", "level", "maxlevel",
                                                                 "levelreq", "classspecific", "class", "classlevelreq",
                                                                 "frequency", "group")] +
                                 [",".join(itypes), ",".join(etypes), r.get("multiply", "").strip(),
                                  r.get("add", "").strip(),
                                  r.get("transformcolor", "").strip() if r.get("transform", "").strip() == "1" else "",
                                  compact(mods)]))
    for kind, name in (("rareprefix", "RarePrefix.txt"), ("raresuffix", "RareSuffix.txt")):  # a rare's two names
        for n, r in enumerate(excel(name)):
            itypes = [r[f"itype{i}"].strip() for i in range(1, 8) if r.get(f"itype{i}", "").strip()]
            etypes = [r[f"etype{i}"].strip() for i in range(1, 5) if r.get(f"etype{i}", "").strip()]
            text = game.keyed_strings.get(r["name"], r["name"]).strip()
            out.append("\t".join([kind, str(n), text, r.get("version", "").strip()] + [""] * 10 +
                                 [",".join(itypes), ",".join(etypes), "", "", "", "[]"]))
    MAGIC_AFFIXES_FILE.write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {MAGIC_AFFIXES_FILE.relative_to(ROOT)} ({len(out) - 5} affixes)")

    cols = ["descpriority", "descfunc", "descval", "descstrpos", "descstrneg", "descstr2", "dgrp", "dgrpfunc",
            "dgrpval", "dgrpstrpos", "dgrpstrneg", "dgrpstr2", "Encode", "Add", "Multiply", "Divide", "ValShift",
            "op", "op param", "op base", "op stat1"]
    out = [f"# PD2 ItemStatCost.txt from pd2data.mpq, {head}: how the game words each stat on an item (the",
           "# desc* / dgrp* strings as text) and prices it (Encode, Add, Multiply, Divide), ValShift, its op columns.",
           "\t".join(["id", "stat"] + cols)]
    for r in game.statcost:
        sid = (r.get("*ID") or r.get("ID") or "").strip()
        if sid.isdigit():
            vals = [game.keyed_strings.get(r.get(c, "").strip(), "") if "str" in c else r.get(c, "").strip() for c in cols]
            out.append("\t".join([sid, r["Stat"]] + [v.replace("\t", " ").replace("\n", "\\n") for v in vals]))
    STAT_TEXT_FILE.write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {STAT_TEXT_FILE.relative_to(ROOT)} ({len(out) - 3} stats)")

    cols = ["type", "type2", "cost", "minac", "maxac", "block", "durability", "nodurability", "reqstr", "reqdex",
            "levelreq", "mindam", "maxdam", "1or2handed", "2handed", "2handmindam", "2handmaxdam", "minmisdam",
            "maxmisdam", "speed", "rangeadder", "stackable", "minstack", "maxstack", "invfile", "invwidth", "invheight",
            "level", "magic lvl", "auto prefix", "gemsockets", "normcode", "ubercode", "ultracode", "InvTrans"]
    out = [f"# PD2 item bases (Weapons, Armor, Misc) from pd2data.mpq, {head}: the columns a hover box and a price",
           "# read; class, staffmods, throwable: the base's item type's ItemTypes columns (class: 0-6 = Amazon..Assassin);",
           "# vendors: the stores that stock it (their columns in the table, act order).",
           "\t".join(["code", "name"] + cols + ["class", "staffmods", "throwable", "vendors"])]
    class_codes = {c: i for i, c in enumerate(CLASS_CODES)}
    firsts = {}  # Armor.txt has mindam / maxdam twice: the first pair is the base's (a shield's Smite, boots' Kick)
    for name in ("Weapons.txt", "Armor.txt", "Misc.txt"):
        rows = [x.split("\t") for x in game.pd2.read(BS.join(["data", "global", "excel", name])).decode(
            "latin-1").replace("\r\n", "\n").split("\n")]
        for x in rows[1:]:
            row = {}
            for h, cell in zip(rows[0], x):
                row.setdefault(h, cell)
            if row.get("code"):
                firsts.setdefault(row["code"], row)
    for code in sorted(game.base_rows):
        r = dict(game.base_rows[code], **{c: firsts.get(code, {}).get(c, "") for c in ("mindam", "maxdam")})
        trow = game.type_rows.get(r.get("type", "").strip(), {})
        vendors = [v for v in VENDORS if any(to_int(r.get(f"{v}{c}")) for c in ("Min", "Max", "MagicMin", "MagicMax"))]
        out.append("\t".join([code, game.base_name(code).splitlines()[-1]] + [r.get(c, "").strip() for c in cols] +
                             [str(class_codes.get(trow.get("Class", "").strip(), "")),
                              trow.get("StaffMods", "").strip(), trow.get("Throwable", "").strip(), ",".join(vendors)]))
    BASE_STATS_FILE.write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {BASE_STATS_FILE.relative_to(ROOT)} ({len(out) - 4} bases)")

    rows = excel("Npc.txt")
    cols = [c for c in rows[0] if c != "npc"] if rows else []
    out = [f"# PD2 Npc.txt from pd2data.mpq, {head}: each vendor's price multipliers (1024 = 1x), the quests that",
           "# lower them and the most it pays.", "\t".join(["npc"] + cols)]
    out += ["\t".join([r["npc"].strip()] + [r.get(c, "").strip() for c in cols]) for r in rows if r.get("npc", "").strip()]
    VENDORS_FILE.write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {VENDORS_FILE.relative_to(ROOT)} ({len(out) - 3} vendors)")

    out = [f"# The game's strings a hover box uses, {head}: id (the game's string number: string.tbl from 0,",
           "# patchstring.tbl from 10000, expansionstring.tbl from 20000) or class:<n>:<CharStats column>, and the text.",
           "id\ttext"]
    texts = [(str(i), game.string_ids.get(i, "")) for i in SHOP_STRING_IDS]
    for n, cls in enumerate(CLASS_NAMES):
        row = game.charstats.get(cls, {})
        texts += [(f"class:{n}:{c}", game.keyed_strings.get(row.get(c, "").strip(), ""))
                  for c in ("StrAllSkills", "StrSkillTab1", "StrSkillTab2", "StrSkillTab3", "StrClassOnly")]
        texts.append((f"class:{n}:BlockFactor", row.get("BlockFactor", "").strip()))  # (a number: its block)
    out += [f"{key}\t{text}".replace("\n", "\\n") for key, text in texts]
    TOOLTIP_STRINGS_FILE.write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {TOOLTIP_STRINGS_FILE.relative_to(ROOT)} ({len(out) - 3} strings)")


# ---------------------------------------------------------------- for the generator

def load_items():
    """[{kind, name, index, code, slot, caster, lvlreq, props, perlevel, eth}] from docs/pd2-unique-set-items.tsv
    (eth: the item always drops ethereal)."""
    out = []
    if not ITEMS_FILE.exists():
        return out
    for line in ITEMS_FILE.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#") or line.startswith("kind\t"):
            continue
        kind, name, index, code, slot, caster, lvlreq, props, *rest = line.split("\t")
        per_level, eth = (rest + ["{}", "0"])[:2]
        out.append({"kind": kind, "name": name, "index": index, "code": code, "slot": slot,
                    "caster": caster == "1", "lvlreq": int(lvlreq) if lvlreq.isdigit() else None,
                    "props": [[tuple(s) for s in p] for p in json.loads(props)],
                    "perlevel": {k: tuple(v) for k, v in json.loads(per_level or "{}").items()}, "eth": eth == "1"})
    return out


def load_corruptions():
    """[{type, words, outcome, sockets, props}] from docs/pd2-corruptions.tsv: type = the cube input's item type
    ("weap", "helm", "rin"...), words = the rest of the input ({"sock", "uni"}), props as an item's."""
    out = []
    if not CORRUPTIONS_FILE.exists():
        return out
    for line in CORRUPTIONS_FILE.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#") or line.startswith("input\t"):
            continue
        cube_input, outcome, sockets, props = line.split("\t")
        kind, *words = cube_input.split(",")
        out.append({"type": kind, "words": set(words), "outcome": int(outcome), "sockets": to_int(sockets),
                    "props": [[tuple(s) for s in p] for p in json.loads(props)]})
    return out


RUNEWORD_COLUMNS = ["kind", "name", "index", "base", "sockets", "runes", "slots", "types", "addable", "props", "texts",
                    "runestats", "runetexts", "perlevel", "bases"]


def load_runewords():
    """[{name, index, base, sockets, runes, slots, types, addable, props, texts, runestats, runetexts, perlevel,
    bases}] from docs/pd2-runewords.tsv (one per runeword and kind of base)."""
    out = []
    if not RUNEWORDS_FILE.exists():
        return out
    for line in RUNEWORDS_FILE.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#") or line.startswith("kind\t"):
            continue
        row = dict(zip(RUNEWORD_COLUMNS, line.split("\t")))
        for key in ("addable", "props", "texts", "runestats", "runetexts", "perlevel", "bases"):
            row[key] = json.loads(row[key])
        row["props"] = [[tuple(s) for s in p] for p in row["props"]]
        row["runestats"] = [[tuple(s) for s in p] for p in row["runestats"]]
        row["sockets"] = int(row["sockets"])
        row["slots"] = row["slots"].split(",") if row["slots"] else []
        out.append(row)
    return out


def norm_name(name):
    return re.sub(r"\s+", " ", name.replace("’", "'")).strip().lower()


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="PD2's unique and set item data.")
    ap.add_argument("--extract", metavar="DIABLO_II_FOLDER")
    ap.add_argument("--tier-data", metavar="DIABLO_II_FOLDER")
    ap.add_argument("--shop-data", metavar="DIABLO_II_FOLDER")
    ap.add_argument("--report", metavar="NAME")
    args = ap.parse_args()
    if args.extract:
        extract(args.extract)
    elif args.tier_data:
        extract_tier_data(args.tier_data)
    elif args.shop_data:
        extract_shop_data(args.shop_data)
    if args.report is not None:
        for it in load_items():
            if args.report.lower() in it["name"].lower():
                print(f"{it['kind']} {it['name']} [{it['index']}] {it['code']} {it['slot']} lvl {it['lvlreq']}")
                for p in it["props"]:
                    print("    " + "  ".join(f"{c} {lo}" + (f"-{hi}" if hi != lo else "") for c, lo, hi in p))
        for rw in load_runewords():
            if args.report.lower() in rw["name"].lower():
                print(f"RW {rw['name']} [{rw['index']}] {rw['base']} ({', '.join(rw['slots'])}: {rw['types']}) "
                      f"{rw['sockets']} sockets: {rw['runes']}")
                for text, p in zip(rw["texts"], rw["props"]):
                    print(f"    {text:48} " + "  ".join(f"{c} {lo}" + (f"-{hi}" if hi != lo else "") for c, lo, hi in p))
                for text, p in zip(rw["runetexts"], rw["runestats"]):
                    print(f"    {text:48} " + "  ".join(f"{c} {lo}" + (f"-{hi}" if hi != lo else "") for c, lo, hi in p))
                print(f"    a white base can bring: {', '.join(rw['addable']) or 'nothing'}")
    if not args.extract and not args.tier_data and not args.shop_data and args.report is None:
        ap.print_help()


if __name__ == "__main__":
    main()
