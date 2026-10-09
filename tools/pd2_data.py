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
        item types and bases, AutoMagic, QualityItems, string tables) and the base game's string tables, and
        writes docs/pd2-unique-set-items.tsv, docs/pd2-runewords.tsv and tools/pd2_stat_priority.tsv. Run it
        each season and after a PD2 patch that changes items, then python tools/gen_unique_rolls.py,
        python tools/gen_runeword_rolls.py and python tools/tag_order.py --fix.
    python tools/pd2_data.py --report NAME
        the stats of the items and runewords whose name contains NAME (as the generators read them)

Each item is one line: kind, name (as the game shows it), the table's own name, base code, slot, caster
(1 for staves, wands, scepters, orbs), required level, then its properties as JSON: one list per property
line of the item, each [code, low, high] in the filter's terms (the first is what a tag of that line shows).

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
PRIORITY_FILE = TOOLS / "pd2_stat_priority.tsv"
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
        self.gems = {r["code"]: r for r in excel("Gems.txt") if r.get("code")}
        self.charstats = {r["class"]: r for r in excel("CharStats.txt") if r.get("class")}
        skill_desc = {r["skilldesc"]: r.get("str name", "") for r in excel("SkillDesc.txt") if r.get("skilldesc")}
        strings = {}
        for mpq, tbl in ((game_dir / "d2data.mpq", "string.tbl"), (game_dir / "d2exp.mpq", "expansionstring.tbl"),
                         (game_dir / "ProjectD2" / "patch_d2.mpq", "patchstring.tbl"),
                         (game_dir / "ProjectD2" / "pd2data.mpq", "patchstring.tbl")):
            try:
                strings.update(read_tbl(pd2_mpq.MPQ(mpq).read(BS.join(["data", "local", "LNG", "ENG", tbl]))))
            except (OSError, KeyError, ValueError):
                pass  # an archive without that table
        self.strings = strings
        self.skill_names, self.skill_class = {}, {}
        for r in skills:
            if r["Id"].strip().isdigit():
                sid = int(r["Id"])
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
        split_ed: +% damage is EDAM and +% defense EDEF (what BH reads on runewords) instead of ED."""
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
                out.append(("EDAM" if split_ed else "ED", lo, hi))
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
                props = []
                for i in range(1, count + 1):
                    p = r.get(f"prop{i}", "").strip()
                    if p:
                        stats = self.prop_stats(p, r.get(f"par{i}", ""), r.get(f"min{i}", ""), r.get(f"max{i}", ""))
                        if stats:
                            props.append([list(s) for s in stats])
                caster = int(bool(CASTER_TYPES & set(self.ancestors(code))))
                out.append([kind, self.strings.get(r["index"], r["index"]), r["index"], code, slot, str(caster),
                            r.get("lvl req", "").strip(), json.dumps(props, separators=(",", ":"))])
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
                level = self.per_level(code)
                if level:  # BH reads the stat as stored: N << ValShift, shown per level as STAT/(8 << ValShift)
                    sid, base = level
                    a, b = (to_int(lo), to_int(hi)) if (lo.strip() or hi.strip()) else (to_int(par), to_int(par))
                    shift = 1 << to_int(self.statcost_by_id[sid].get("ValShift"))
                    per_level[f"STAT{sid}"] = [self.stat_code(base) or f"STAT{base}", 8 * shift]
                    props.append([[f"STAT{sid}", a * shift, b * shift]])
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
             "# kind, name, table name, base code, slot, caster, required level, properties as [[code, low, high], ...]",
             "\t".join(["kind", "name", "index", "code", "slot", "caster", "lvlreq", "props"])]
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
    out = ["# PD2 ItemStatCost.txt: stat id, stat, descpriority (higher = listed higher on the item).",
           f"# Extracted {stamp} from pd2data.mpq by tools/pd2_data.py --extract."]
    for r in game.statcost:
        sid = (r.get("*ID") or r.get("ID") or "").strip()
        if sid.isdigit():
            out.append(f"{int(sid)}\t{r['Stat']}\t{r.get('descpriority', '').strip()}")
    PRIORITY_FILE.write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {PRIORITY_FILE.relative_to(ROOT)} ({len(out) - 2} stats)")


# ---------------------------------------------------------------- for the generator

def load_items():
    """[{kind, name, index, code, slot, caster, lvlreq, props}] from docs/pd2-unique-set-items.tsv."""
    out = []
    if not ITEMS_FILE.exists():
        return out
    for line in ITEMS_FILE.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#") or line.startswith("kind\t"):
            continue
        kind, name, index, code, slot, caster, lvlreq, props = line.split("\t")
        out.append({"kind": kind, "name": name, "index": index, "code": code, "slot": slot,
                    "caster": caster == "1", "lvlreq": int(lvlreq) if lvlreq.isdigit() else None,
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
    ap.add_argument("--report", metavar="NAME")
    args = ap.parse_args()
    if args.extract:
        extract(args.extract)
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
    if not args.extract and args.report is None:
        ap.print_help()


if __name__ == "__main__":
    main()
