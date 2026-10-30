#!/usr/bin/env python3
"""
The Skill & Shop Highlights page: Erazure-Skill-Shop-Highlights.html (repo root, committed), from
tools/shop_map_template.html. Every highlight of sections/280-skills-shop-highlights.filter (the starred lines of an
item's hover box, and the green or teal Cost line a shop item gets) with what an item needs to get it, read from the
rules, and per family of highlights a sample item drawn as its hover box looks in a shop. The website's Skill & Shop
Highlights page shows it (website/hooks.py). build.bat, the hook and CI run it as the other players' pages.

The sample items are real ones: a base and the game's own affixes (docs/pd2-magic-affixes.tsv), checked to fit the
base and the item level. Their hover box is every rule of Erazure - Main run for the item in a shop (its name, tags
and description lines, BH's ItemDescLookupCache: a rule's {...} replaces the description, %NAME% in it is the
description so far), with the lines the game and BH add around them: Cost, defense or damage, durability,
requirements, BH's Item Level / Affix Level (they show when it differs), the affix lines in the game's order
(descpriority) worded as the game words them (docs/pd2-stat-text.tsv) with BH's [min - max] range of the affixes
that can roll on the item. The text is one string drawn bottom up: a color code carries over to the line above,
which is how the Cost line takes the color the name ends with. The Cost is the game's buy price at full price
(docs/pd2-vendors.tsv: most vendors; checked against two prices seen in a shop, --selftest).

Each 280 rule that writes a highlight or a shop color belongs to exactly one family of FAMILIES (a rule left over,
or in two, stops the run), and each family's sample must get one of its family's highlights.

    python tools/shop_map.py                      write the page
    python tools/shop_map.py --check              exit 1 if the page is out of date (CI)
    python tools/shop_map.py --selftest           the hover boxes of two screenshots, line by line, and their prices
    python tools/shop_map.py --family NAME        a family's rules, words and sample (its hover box as text)
    python tools/shop_map.py --findings           rules that never match, words left as codes, missing pictures
    python tools/shop_map.py --affixes CODE STAT  the affixes that give STAT (a filter code) on base CODE
    python tools/shop_map.py --pictures "<Diablo II folder>"   the samples' inventory pictures (tools/inv/*.png)
"""
import argparse
import base64
import json
import re
import struct
import sys
import zlib
from collections import defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402
import explain_item as E  # noqa: E402
import label_cuts as LC  # noqa: E402
import lint_filter as L  # noqa: E402
import pd2_data as P  # noqa: E402
import plain_highlights as PH  # noqa: E402
import tier_map as T  # noqa: E402

ROOT = build.ROOT
PAGE = ROOT / "Erazure-Skill-Shop-Highlights.html"
TEMPLATE = ROOT / "tools" / "shop_map_template.html"
INV = ROOT / "tools" / "inv"
SECTION = "280-skills-shop-highlights.filter"
FILTER_LEVEL = 1  # the renders' filter level (no 280 rule but one asks; the page says where one does)
DIFF = 2  # Hell: where a character of the samples' levels shops
SELL_MULT_FULL = 1024  # Npc.txt: a vendor that asks the full price

# BH's color words as D2GL draws them (RRGGBB; tools/example_shots.py has the same table)
COLORS = {"WHITE": "FEFEFE", "RED": "FE6950", "GREEN": "25FE00", "BLUE": "7B7BFE", "GOLD": "DFB679",
          "GRAY": "7B7B7B", "BLACK": "000000", "TAN": "D9CD8E", "ORANGE": "FFB200", "YELLOW": "EBEB75",
          "PURPLE": "B700FF", "DARK_GREEN": "008C00", "CORAL": "E09595", "SAGE": "B6E12E", "TEAL": "5CA6A4",
          "LIGHT_GRAY": "A9A9B0"}
GAME_CODES = {"0": "WHITE", "1": "RED", "2": "GREEN", "3": "BLUE", "4": "GOLD", "5": "GRAY", "6": "BLACK",
              "7": "TAN", "8": "ORANGE", "9": "YELLOW", ";": "PURPLE", ":": "DARK_GREEN"}  # ÿc in the game's strings
QUALITY_COLOR = {"MAG": "BLUE", "RARE": "YELLOW", "CRAFT": "ORANGE", "NMAG": "WHITE"}
CLASS_WORDS = ["AMAZON", "SORCERESS", "NECROMANCER", "PALADIN", "BARBARIAN", "DRUID", "ASSASSIN"]
TOWNS = {"Charsi": 1, "Akara": 1, "Fara": 40, "Lysander": 40, "Drognan": 40, "Elzix": 40, "Hralti": 75,
         "Alkor": 75, "Ormus": 75, "Asheara": 75, "Halbu": 103, "Jamella": 103, "Larzuk": 109, "Drehya": 109,
         "Malah": 109}  # the town (MAPID) of each store


# ---------------------------------------------------------------- the game's tables (docs/, pd2_data.py --tier-data)

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


class Data:
    def __init__(self):
        self.affixes = []
        for r in tsv(P.MAGIC_AFFIXES_FILE):
            r["row"] = int(r["row"])
            r["itypes"] = r["itypes"].split(",") if r["itypes"] else []
            r["etypes"] = r["etypes"].split(",") if r["etypes"] else []
            r["mods"] = json.loads(r["mods"])
            for c in ("version", "spawnable", "rare", "level", "maxlevel", "levelreq", "classlevelreq", "frequency",
                      "group", "multiply", "add"):
                r[c] = num(r[c])
            self.affixes.append(r)
        self.stats = {int(r["id"]): r for r in tsv(P.STAT_TEXT_FILE)}
        for r in self.stats.values():
            for c in ("descpriority", "descfunc", "descval", "dgrp", "dgrpfunc", "dgrpval", "Encode", "Add",
                      "Multiply", "ValShift"):
                r[c] = num(r[c])
        self.bases = {r["code"]: r for r in tsv(P.BASE_STATS_FILE)}
        for code, b in T.load_bases().items():
            if code in self.bases:
                self.bases[code].update({"types": b["types"], "tier": b["tier"], "qlvl": b["qlvl"],
                                         "mlvl": b["mlvl"], "maxsock": b["maxsock"], "width": b["width"],
                                         "height": b["height"]})
        self.vendors = {r["npc"]: r for r in tsv(P.VENDORS_FILE)}
        self.strings = {r["id"]: r["text"].replace("\\n", "\n") for r in tsv(P.TOOLTIP_STRINGS_FILE)}
        self.skills = {}
        for r in tsv(P.SKILLS_FILE):
            self.skills[int(r["id"])] = {"name": r["name"], "class": r["class"], "reqlevel": num(r.get("reqlevel")),
                                         "costmult": num(r.get("costmult")), "costadd": num(r.get("costadd")),
                                         "maxlvl": num(r.get("maxlvl"))}
        self.skill_id = {}
        for sid, s in sorted(self.skills.items()):
            self.skill_id.setdefault(s["name"].lower(), sid)

    def text(self, key):
        return self.strings.get(str(key), "")


# ---------------------------------------------------------------- a sample item

def fits(affix, types):
    """The affix rolls on a base of these item types (itypes match, no etype does)."""
    return bool(set(affix["itypes"]) & set(types)) and not set(affix["etypes"]) & set(types)


class Item:
    """One sample item: its base, quality, affixes (the base's own automagic too) and their values, a corruption,
    the character looking at it, and where (in a shop when a store can sell it, else in the inventory)."""

    # the affix table's rare column per quality (a magic shop item can have a rare-3 affix: Witch-hunter's Light Plate
    # of Protecting, the 280 page's second screenshot)
    RARE_OK = {"MAG": (0, 1, 2, 3), "RARE": (1, 2, 3), "CRAFT": (1, 2, 3), "NMAG": ()}

    def __init__(self, data, spec):
        self.data, self.spec = data, spec
        self.code = spec["base"]
        if self.code not in data.bases:
            raise SystemExit(f"sample {spec.get('id')}: no base {self.code}")
        self.base = data.bases[self.code]
        self.types = self.base["types"]
        self.quality = spec.get("quality", "MAG")
        self.clvl = spec.get("clvl", 90)
        self.ilvl = spec.get("ilvl", min(99, self.clvl + 5))  # a store's item level (two shop screenshots agree)
        self.cls = spec.get("class", "AMAZON")
        self.alvl = T.affix_level(self.ilvl, self.base["qlvl"], self.base["mlvl"])
        self.craftalvl = T.affix_level(self.clvl // 2 + self.ilvl // 2, self.base["qlvl"], self.base["mlvl"])
        self.affixes, self.problems, self.corrupted = [], [], set()
        for entry in spec.get("affixes", []):
            name, value = (entry, None) if isinstance(entry, str) else entry
            self.affixes.append((self.find_affix(name), value))
        auto = self.base["auto prefix"]
        if auto and self.quality != "NMAG":
            rows = [a for a in data.affixes if a["kind"] == "automagic" and str(a["group"]) == auto
                    and fits(a, self.types) and a["level"] <= self.alvl]
            want = spec.get("automagic")
            pick = [a for a in rows if a["name"] == want] if want else rows[-1:]
            if not pick:
                self.problems.append(f"{self.code} has automagic group {auto}: name one of "
                                     f"{sorted({a['name'] for a in rows})}")
            else:
                self.affixes.append((pick[0], spec.get("automagic value")))
        self.stats = defaultdict(int)  # (stat id, param) -> value (life and mana as shown, not shifted)
        for affix, value in self.affixes:
            if affix:
                for mod in affix["mods"]:
                    for sid, param, lo, hi in mod[5]:
                        if sid == 204:
                            level, charges = self.charges(param, lo, hi)
                            self.stats[(204, param * 64 + level)] += charges
                            continue
                        if sid in CHANCE_STATS:
                            v = lo  # chance to cast: the table's chance (the level is in the param)
                        else:
                            v = hi if value is None else max(min(value, max(lo, hi)), min(lo, hi))
                        self.stats[(sid, param)] += v
        for skill, n in spec.get("staffmods", {}).items():
            self.stats[(107, self.skill(skill))] += n
        if spec.get("sockets"):
            self.stats[(194, 0)] = spec["sockets"]
        if spec.get("corrupt") is not None:
            self.corrupt(spec["corrupt"], spec.get("corrupt value"))
        self.defense = spec.get("def", num(self.base["maxac"]))
        self.place = spec.get("place") or ("SHOP" if self.sold() else "INVENTORY")
        self.check()

    def charges(self, skill, lo, hi):
        """(level, charges) of a charged skill (the game's charges property: a negative max scales the level with the
        item level, a negative min the charges with the level); a store's item has them all."""
        s = self.data.skills.get(skill, {})
        req = s.get("reqlevel", 0)
        if hi == 0:
            level = min(max((self.ilvl - req) // 4 + 1, 1), s.get("maxlvl") or 20)
        elif hi < 0:
            step = max(1, -int((max(99 - req, 1)) / hi))
            level = max(1, int((self.ilvl - req) / step))
        else:
            level = hi
        if lo == 0:
            n = 5
        else:
            n = level * -lo // 8 - lo if lo < 0 else lo
            n = 1 if n <= 1 else min(n, 255)
        return level, n

    def skill(self, name):
        sid = name if isinstance(name, int) else self.data.skill_id.get(str(name).lower())
        if sid is None:
            raise SystemExit(f"{self.code}: no skill named {name!r}")
        return sid

    def find_affix(self, name):
        kind = "suffix" if name.startswith("of ") else "prefix"
        rows = [a for a in self.data.affixes if a["kind"] == kind and a["name"] == name and a["version"]
                and fits(a, self.types)]
        old = self.spec.get("old_affixes", {}).get(name)  # a screenshot of an earlier build: the row's values then
        if old:
            rows = [dict(a, **old) for a in rows]
        ok = [a for a in rows if a["spawnable"] and a["level"] <= self.alvl
              and (not a["maxlevel"] or a["maxlevel"] >= self.alvl) and a["rare"] in self.RARE_OK[self.quality]]
        if not ok:
            self.problems.append(f"no {name!r} rolls on {self.code} ({self.quality}) at affix level {self.alvl}: "
                                 f"rows {[a['row'] for a in rows] or 'none fit the base'}")
            return None
        return ok[-1]  # (the highest-level row that fits)

    def corrupt(self, outcome, value):
        """The cube's corruption outcome: STAT360 and what it adds (docs/pd2-corruptions.tsv: a row whose input
        type the base has)."""
        rows = [c for c in P.load_corruptions() if c["outcome"] == outcome and c["type"] in self.types]
        if not rows:
            self.problems.append(f"no corruption {outcome} for {self.code}")
            return
        self.stats[(360, 0)] = outcome
        for prop in rows[0]["props"]:
            for code, lo, hi in prop:
                key = code_stat(code, self)
                if key:
                    v = hi if value is None else value
                    self.stats[key] += v
                    self.corrupted.add(key[0])
                    if key == (17, 0):  # +% damage: maximum and minimum
                        self.stats[(18, 0)] += v
                    if key[0] in (39, 41, 43, 45) and code == "RES":
                        for s in (39, 41, 43, 45):
                            if s != key[0]:
                                self.stats[(s, 0)] += v
                                self.corrupted.add(s)

    def sold(self):
        """A store can sell it: magic or non-magical, not corrupted, a base (or its normal version) a store stocks."""
        if self.quality not in ("MAG", "NMAG") or self.stats.get((360, 0)):
            return False
        for code in (self.code, self.base["normcode"]):
            if self.data.bases.get(code, {}).get("vendors"):
                return True
        return False

    def check(self):
        prefixes = sum(1 for a, _ in self.affixes if a and a["kind"] == "prefix")
        suffixes = sum(1 for a, _ in self.affixes if a and a["kind"] == "suffix")
        most = {"MAG": 1, "RARE": 3, "CRAFT": 3, "NMAG": 0}[self.quality]
        if prefixes > most or suffixes > most:
            self.problems.append(f"{prefixes} prefixes and {suffixes} suffixes on a {self.quality} item")
        groups = [a["group"] for a, _ in self.affixes if a and a["kind"] != "automagic"]
        if len(groups) != len(set(groups)):
            self.problems.append("two affixes of one group")
        if self.spec.get("staffmods") and not self.base["staffmods"]:
            self.problems.append(f"{self.code} gets no class skills of its own (staffmods)")
        if self.quality in ("RARE", "CRAFT"):
            pre, suf = (self.spec.get("name") or ["", ""])[:2]
            for kind, word in (("rareprefix", pre), ("raresuffix", suf)):
                if not any(a["kind"] == kind and a["name"] == word and fits(a, self.types) for a in self.data.affixes):
                    self.problems.append(f"no {kind} {word!r} for {self.code}")
        if self.problems:
            raise SystemExit(f"sample {self.spec.get('id') or self.code}: " + "; ".join(self.problems))

    # ---- the game's name
    def name(self):
        base = self.base["name"]
        if self.quality == "MAG":
            pre = next((a["name"] for a, _ in self.affixes if a and a["kind"] == "prefix"), "")
            suf = next((a["name"] for a, _ in self.affixes if a and a["kind"] == "suffix"), "")
            return " ".join(x for x in (pre, base, suf) if x)
        if self.quality in ("RARE", "CRAFT"):
            return " ".join(self.spec["name"])  # its two words of RarePrefix / RareSuffix
        return base

    def value(self, sid, param=0):
        return self.stats.get((sid, param), 0)

    def req_level(self):
        """The game's required level: the highest of its affixes' (class level requirement for the class), the
        base's and the skills it gives (single skills, oskills)."""
        cls = CLASS_WORDS.index(self.cls)
        req = 0
        for a, _ in self.affixes:
            if a:
                own = P.CLASS_CODES.index(a["class"]) if a["class"] in P.CLASS_CODES else None
                req = max(req, a["classlevelreq"] if own == cls and a["classlevelreq"] else a["levelreq"])
        if self.quality == "CRAFT":
            req = min(98, req + 10 + 3 * sum(1 for a, _ in self.affixes if a and a["kind"] != "automagic"))
        req = max(req, num(self.base["levelreq"]))
        for (sid, param), v in self.stats.items():
            if sid in (97, 107) and v:
                req = max(req, self.data.skills.get(param, {}).get("reqlevel", 0))
        return req

    def total_defense(self):
        ed, flat = self.value(16), self.value(31)
        return self.defense * (100 + ed) // 100 + flat


CHANCE_STATS = {195, 196, 197, 198, 199, 201}  # chance to cast: the value is the chance, the level in the param


def code_stat(code, item):
    """(stat id, param) of a filter code (a corruption's: pd2-corruptions.tsv)."""
    named = {c: s for s, c in P.NAMED.items()}
    if code in named:
        return named[code], 0
    if code == "ED":
        return (16 if "armo" in item.types else 17), 0
    if code == "EDAM":
        return 17, 0
    if code == "RES":
        return 39, 0
    m = re.fullmatch(r"(STAT|SK|OS|CLSK|TABSK)(\d+)", code)
    if m:
        return {"STAT": int(m.group(2)), "SK": 107, "OS": 97, "CLSK": 83, "TABSK": 188}[m.group(1)], \
            (0 if m.group(1) == "STAT" else int(m.group(2)))
    m = re.fullmatch(r"MULTI(\d+),(\d+)", code)
    if m:
        return int(m.group(1)), int(m.group(2))
    if code == "SOCK":
        return 194, 0
    return None


# ---------------------------------------------------------------- the filter's values for the item

def filter_values(item):
    """What BH reads for each condition word and output keyword (named codes as shown; STAT<n> as the game holds
    the stat: life and mana shifted)."""
    v, d = {}, item.data
    for (sid, param), x in item.stats.items():
        raw = x << d.stats[sid]["ValShift"] if sid in d.stats and d.stats[sid]["ValShift"] else x
        v[f"MULTI{sid},{param}"] = v[f"STAT{sid},{param}"] = raw
        if param == 0:
            v[f"STAT{sid}"] = raw
        if sid == 107:
            v[f"SK{param}"] = x
        elif sid == 97:
            v[f"OS{param}"] = x
        elif sid == 83:
            v[f"CLSK{param}"] = x
        elif sid == 188:
            v[f"TABSK{param}"] = x
        elif sid == 204:
            v[f"CHSK{param >> 6}"] = max(v.get(f"CHSK{param >> 6}", 0), param & 63)
    for sid, code in P.NAMED.items():
        v[code] = item.value(sid)
    v["ED"] = item.value(16) if "armo" in item.types else item.value(17)
    v["EDEF"], v["EDAM"] = item.value(16), item.value(17)
    v["DEF"] = item.total_defense() if "armo" in item.types else 0
    v["PLUSDEF"] = v["DEF"] - item.defense if "armo" in item.types else 0
    v["STAT31"] = v["DEF"]
    v["MINDMG"], v["MAXDMG"] = item.value(21), item.value(22)
    v["SOCK"] = v["SOCKETS"] = item.value(194)
    v["MAXSOCKETS"] = T.max_sockets(item.base, item.ilvl) if "maxsock" in item.base else 0
    attrs = [item.value(s) for s in (0, 1, 2, 3)]
    v["ALLATTRIB"] = min(attrs) if all(attrs) else 0
    maxres = [item.value(s) for s in (40, 42, 44, 46)]
    v["MAXRES"] = min(maxres) if all(maxres) else 0
    v.update({"ID": 1, "ETH": 0, "ILVL": item.ilvl, "QLVL": item.base["qlvl"], "ALVL": item.alvl,
              "CRAFTALVL": item.craftalvl, "CLVL": item.clvl, "DIFF": DIFF, "FILTLVL": FILTER_LEVEL,
              "LVLREQ": item.req_level(), "QTY": 0, "MAPTIER": -1, "MAPID": TOWNS.get(vendor_of(item), 1),
              "WIDTH": num(item.base["invwidth"]), "HEIGHT": num(item.base["invheight"]),
              "AREA": num(item.base["invwidth"]) * num(item.base["invheight"]), "CHARSTAT12": item.clvl,
              "REQSTR": num(item.base["reqstr"]), "REQDEX": num(item.base["reqdex"]),
              "BUYPRICE": price(item), "SELLPRICE": sell_price(item), "PRICE": sell_price(item),
              "WPNSPD": num(item.base["speed"]), "RANGE": num(item.base["rangeadder"])})
    v["RES"] = min(item.value(s) for s in (39, 41, 43, 45))
    for a, _ in item.affixes:
        if a and a["kind"] == "suffix":
            v.setdefault("@SUFFIX", []).append(a["row"])
        elif a and a["kind"] == "prefix":
            v.setdefault("@PREFIX", []).append(a["row"])
    return v


def vendor_of(item):
    vendors = [x for x in item.base["vendors"].split(",") if x]
    return vendors[0] if vendors else "Akara"


# ---------------------------------------------------------------- the rules

class Rule:
    __slots__ = ("idx", "where", "cond", "tree", "name", "desc", "cont", "section", "line", "star", "twin",
                 "pagecond")


class Formulas(list):
    """The rules' $f(...) islands (FORMULA__n), and .named: Formula[KEY] as its condition word FORMULAKEY."""
    named = {}


def load_rules():
    """Every rule of Erazure - Main: its condition (aliases expanded; formulas as words of their own), name and
    description templates (BH's ParseDescription: the first {...}; none = an empty description) and %CONTINUE%."""
    lines, where = E.load(build.MAIN)
    lt = L.Linter(lines, where, False)
    rules, formulas = [], Formulas()
    formulas.named = {"FORMULA" + k.upper(): text for k, (_, text) in lt.formulas.items()}
    for r in lt.rules:
        cond = E.expand_condition(r.cond, lt.aliases)
        words = cond
        for a, b in reversed(L.formula_ranges(words)):
            formulas.append(words[a:b])
            words = words[:a] + f" FORMULA__{len(formulas) - 1} " + words[b:]
        name, cont, *_ = E.action(r.output, lt.aliases)
        x = Rule()
        x.idx, x.where, x.cond = r.idx, where(r.idx), cond
        x.tree = LC.tree(LC.rpn(words))
        x.cont = cont
        x.name = LC.SOUND_RE.sub("", name, count=1)
        x.desc = L.split_output(L.expand_output_aliases(r.output, lt.aliases))[1]
        x.section = x.where.startswith(f"sections/{SECTION}:")
        x.line = r.output
        # a highlight with stars and its plain twin for corrupted items (tools/plain_highlights.py): the page shows
        # the pair as one rule, the star rule without its corruption test
        x.star = bool(PH.star_block(r.output)) and r.cond.endswith(PH.STAR_TEST)
        x.twin = rules[-1] if rules and rules[-1].star and PH.is_twin(r.cond) else None
        x.pagecond = re.sub(r"\s*!STAT360>0\s*$", "", cond) if x.star else cond
        rules.append(x)
    return rules, formulas


class Model:
    """BH's condition words for the item in a shop. A word the item cannot answer (a value no sample gives) is
    MAYBE, and a rule that only may match stops the run."""

    def __init__(self, item, formulas):
        self.item, self.v, self.formulas = item, filter_values(item), formulas
        self.groups = T.item_groups(set(item.types)) | {T.TIER_GROUP[item.base["tier"]]}
        self.unknown = set()

    def atom(self, word):
        v, item = self.v, self.item
        if word in ("TRUE", "FALSE"):
            return int(word == "TRUE")
        if word.startswith("FORMULA__"):
            return int(bool(LC.eval_formula(self.formulas[int(word[9:])], v)))
        if word in E.QUALITIES:
            return int(word == item.quality)
        if word in E.CLASSES:
            return int(word == item.cls)
        if word in E.PLACES:
            return int(word == item.place)
        if word in T.GROUP_WORDS or word in ("NORM", "EXC", "ELT"):
            return int(word in self.groups)
        m = E.COMPARE_RE.match(word)
        if not m:
            if word in ("INF", "SUP", "RW", "GEMMED", "ID", "ETH"):
                return int(bool(v.get(word, 0)))
            if word in v:
                return int(bool(v[word]))
            if len(word) >= 3 and not any(c.isupper() for c in word[:3]):
                return int(word == item.code)
            self.unknown.add(word)
            return E.MAYBE
        key, op, a, b = m.group(1), m.group(2), int(m.group(3)), m.group(4)
        hi = int(b) if b is not None else a
        test = {"=": lambda t: t == a, "<": lambda t: t < a, ">": lambda t: t > a, "~": lambda t: a <= t <= hi}[op]
        if key == "RES":  # BH: each of the four resistances passes
            return int(all(test(item.value(s)) for s in (39, 41, 43, 45)))
        if key in ("SUFFIX", "PREFIX"):  # BH: one of the item's own (no < or >)
            return int(op in "=~" and any(test(x) for x in v.get("@" + key, [])))
        if key in E.KIND_KEYS and key not in v:
            return 0
        total = 0
        for part in key.split("+"):
            if part in v:
                total += v[part]
            elif part in self.formulas.named:  # a Formula[KEY]: the item's values, groups, quality and place
                total += LC.eval_formula(self.formulas.named[part], dict(
                    v, **{g: 1 for g in self.groups}, **{item.quality: 1, item.place: 1}))
            elif STAT_WORD_RE.fullmatch(part) or part in STAT_WORDS:
                pass  # a stat the item does not have
            else:
                self.unknown.add(part)  # a value of the character or the game the sample does not give
                return E.MAYBE
        return int(test(total))


STAT_WORD_RE = re.compile(r"(STAT|SK|OS|CLSK|TABSK|CHSK)\d+|MULTI\d+,\d+")
STAT_WORDS = set(P.NAMED.values()) | set("""ED EDEF EDAM DEF PLUSDEF MINDMG MAXDMG SOCK ALLATTRIB MAXRES RES ALLSK
DTM GFIND MFIND AR MAXDUR REPLIFE REPQUANT REPAIR MAEK ARPER LIFE MANA FOOLS GOODSK GOODTBSK QTY""".split())


def run_rules(rules, model):
    """(name, description, the 280 rules that matched, the rule that stopped) as BH builds them for the item."""
    item = model.item
    color = "%" + QUALITY_COLOR[item.quality] + "%"
    if item.quality == "NMAG" and item.value(194):
        color = "%GRAY%"
    base = item.base["name"]
    game = item.name()
    if item.quality in ("RARE", "CRAFT"):
        name = color + base + "\n" + color + game  # the base line first (BH reads the lines bottom up)
    else:
        name = color + game
    name = LC.apply(name, "", {}, base)
    desc, hits, stop = "", [], None
    for r in rules:
        x = LC.ev(r.tree, model.atom)
        if x == E.MAYBE:
            raise SystemExit(f"{item.spec.get('id', item.code)}: {r.where} may match: the sample gives no value for "
                             f"{', '.join(sorted(model.unknown))}")
        if x != 1:
            continue
        name = LC.apply(r.name, name, model.v, base)
        desc = LC.apply(r.desc, desc, model.v, base)
        if r.section:
            hits.append(r)
        if not r.cont:
            stop = r
            break
    return LC.trim(name), LC.trim(desc), hits, stop


# ---------------------------------------------------------------- the hover box

COLOR_OF = {code: name for name, code in LC.COLOR_CODE.items()}
GAME_CODE_RE = re.compile("\xffc(.)")


def segments(text, color):
    """[(color, text)] of one line, starting in `color`; and the color it ends in."""
    out, pos = [], 0
    for m in GAME_CODE_RE.finditer(text):
        if m.start() > pos:
            out.append((color, text[pos:m.start()]))
        code = m.group(0)
        color = COLOR_OF.get(code) or GAME_CODES.get(m.group(1), color)
        pos = m.end()
    if pos < len(text):
        out.append((color, text[pos:]))
    return [s for s in out if s[1]], color


def code(color):
    return LC.COLOR_CODE[color]


def stat_lines(item):
    """The affix lines as the game words and orders them (highest descpriority first), each with BH's range."""
    d, lines, done = item.data, [], set()
    groups = defaultdict(list)
    for (sid, param), v in item.stats.items():
        if v and sid in d.stats and d.stats[sid]["dgrp"]:
            groups[d.stats[sid]["dgrp"]].append((sid, v))
    for (sid, param), v in sorted(item.stats.items(), key=lambda kv: (-d.stats.get(kv[0][0], {}).get(
            "descpriority", 0), kv[0][0], kv[0][1])):
        if not v or sid not in d.stats or (sid, param) in done or sid in (194, 18):
            continue
        st = d.stats[sid]
        if not st["descfunc"]:
            continue
        g = st["dgrp"]
        members = [s for s, r in d.stats.items() if r["dgrp"] == g] if g else []
        if g and len(groups[g]) == len(members) and len({x for _, x in groups[g]}) == 1:
            # every stat of the group with one value: the group's line (All Resistances +20, +5 to all Attributes)
            for s in members:
                done.add((s, 0))
            text = describe(d, st["dgrpfunc"], st["dgrpval"], st["dgrpstrpos"], st["dgrpstr2"], v)
            lines.append((text, stat_range(item, sid, param, v, group=True), sid in item.corrupted))
            continue
        if sid == 17 and item.value(18) == v:
            done.add((18, 0))
        lines.append((stat_text(item, sid, param, v), stat_range(item, sid, param, v), sid in item.corrupted))
    return lines


def describe(d, func, val, pos, s2, v):
    """ItemStatCost's descfunc forms (pd2_data.stat_text): the value before (descval 1) or after (2) the string."""
    plus = "+" if v >= 0 else ""
    if "%d" in pos:
        return pos.replace("%d", str(v), 1)
    forms = {1: f"{plus}{v}", 2: f"{v}%", 3: str(v), 4: f"{plus}{v}%", 5: f"{v}%", 6: f"{plus}{v}", 7: f"{v}%",
             8: f"{plus}{v}%", 9: str(v), 12: f"{plus}{v}", 19: str(v), 20: f"-{v}%"}
    n = forms.get(func, str(v))
    text = pos if val == 0 else f"{pos} {n}" if val == 2 else f"{n} {pos}"
    if func in (6, 7, 8, 9) and s2:
        text += " " + s2
    return text


def stat_text(item, sid, param, v):
    d = item.data
    st = d.stats[sid]
    func = st["descfunc"]
    plus = "+" if v >= 0 else ""
    if func == 13:  # +2 to Assassin Skill Levels
        return f"{plus}{v} {d.text(f'class:{param}:StrAllSkills')}"
    if func == 14:  # +3 to Javelin and Spear Skills (Amazon Only)
        cls, tab = param // 8, param % 8
        return (d.text(f"class:{cls}:StrSkillTab{tab + 1}").replace("%d", str(v), 1) + " " +
                d.text(f"class:{cls}:StrClassOnly"))
    if func == 27:  # +3 to Chain Lightning Sentry (Assassin Only)
        s = d.skills.get(param, {})
        cls = P.CLASS_CODES.index(s["class"]) if s.get("class") in P.CLASS_CODES else None
        only = f" {d.text(f'class:{cls}:StrClassOnly')}" if cls is not None else ""
        return f"{plus}{v} to {s.get('name', param)}{only}"
    if func == 28:
        return f"{plus}{v} to {d.skills.get(param, {}).get('name', param)}"
    if func == 24:  # Level 2 Teleport (37/37 Charges)
        skill, level = param >> 6, param & 63
        return f"Level {level} {d.skills.get(skill, {}).get('name', skill)} " + st["descstrpos"].replace(
            "%d", str(v), 1).replace("%d", str(v), 1)
    if func == 15:  # 10% Chance to cast level 3 Amplify Damage on striking
        skill, level = param >> 6, param & 63
        return st["descstrpos"].replace("%d%%", f"{v}%", 1).replace("%d", str(level), 1).replace(
            "%s", d.skills.get(skill, {}).get("name", str(skill)), 1)
    if sid == 17:
        return f"+{v}% Enhanced Damage"
    if sid == 7 or sid == 9:
        return describe(d, func, st["descval"], st["descstrpos"], st["descstr2"], v)
    return describe(d, func, st["descval"], st["descstrpos"] if v >= 0 else st["descstrneg"], st["descstr2"], v)


def stat_range(item, sid, param, v, group=False):
    """BH's [min - max] after a magic, rare or crafted item's stat (BHOnPropertyBuild): the lowest and highest the
    affixes that can roll on the item give that stat (expansion affixes up to the item level, spawnable, rare ones
    on rares; a skill tab or class skill any of its kind). Shown when min < max."""
    if item.quality not in ("MAG", "RARE", "CRAFT"):
        return None
    if sid in (204, 198, 195, 196, 197, 199, 201):
        return None  # charges and chance to cast: BH shows no range
    lo, hi = 0, 0
    for a in item.data.affixes:
        if a["kind"] == "automagic" and not item.spec.get("automagic"):
            continue
        if not a["version"] or a["level"] > 99 or a["level"] > item.ilvl:
            continue
        if item.quality != "CRAFT" and not a["spawnable"]:
            continue
        if item.quality in ("RARE", "CRAFT") and not a["rare"]:
            continue
        if not fits(a, item.types):
            continue
        for mod in a["mods"]:
            hit = None
            for s, p, mlo, mhi in mod[5]:
                if s == sid and (sid in (83, 188) or p == param):
                    hit = (mod[3], mod[4])
                    break
            if hit:
                lo = hit[0] if lo == 0 else min(lo, hit[0])
                hi = max(hi, hit[1])
                break
    return (lo, hi) if lo < hi else None


def base_lines(item, v):
    """The game's lines between the name and the affixes, top first: [(text with ÿc codes)]."""
    d, b, out = item.data, item.base, []
    w, blue, red = code("WHITE"), code("BLUE"), code("RED")
    cls = CLASS_WORDS.index(item.cls)
    if "armo" in item.types:
        changed = item.value(16) or item.value(31)
        out.append(f"{w}{d.text(3461)} {blue if changed else w}{item.total_defense()}")
    if "shld" in item.types:  # BH: the class's block factor + the shield's block, at most 75; Smite for a Paladin
        block = min(75, num(d.text(f"class:{cls}:BlockFactor")) + num(b["block"]) + item.value(20))
        if block:
            out.append(f"{w}{d.text(11018)}{blue if num(b['block']) < block else w}{block}%")
        if cls == 3 and b["class"] in ("", "3"):
            out.append(f"{w}{d.text(3468)} {num(b['mindam'])} {d.text(3464)} {num(b['maxdam'])}")
    if "boot" in item.types and cls == 6:
        out.append(f"{w}{d.text(21782)} {num(b['mindam'])} {d.text(3464)} {num(b['maxdam'])}")
    if "weap" in item.types:
        one, two = (num(b["mindam"]), num(b["maxdam"])), (num(b["2handmindam"]), num(b["2handmaxdam"]))
        ed = item.value(17)
        dmg = lambda lo_hi: ((lo_hi[0] * (100 + ed)) // 100 + item.value(21),
                             (lo_hi[1] * (100 + ed)) // 100 + item.value(22))
        col = blue if (ed or item.value(21) or item.value(22)) else w
        if any(two) and (num(b["2handed"]) or num(b["1or2handed"])):
            lo, hi = dmg(two)
            out.append(f"{w}{d.text(3466)} {col}{lo} {d.text(3464)} {hi}")
        if any(one) and not num(b["2handed"]):
            lo, hi = dmg(one)
            out.append(f"{w}{d.text(3465)} {col}{lo} {d.text(3464)} {hi}")
        if b["throwable"] == "1" and (num(b["minmisdam"]) or num(b["maxmisdam"])):
            out.append(f"{w}{d.text(3467)} {num(b['minmisdam'])} {d.text(3464)} {num(b['maxmisdam'])}")
    if num(b["durability"]) and not num(b["nodurability"]):
        dur = num(b["durability"]) + item.value(73)
        out.append(f"{w}{d.text(3457)} {dur} {d.text(3463)} {dur}")
    if b["class"] != "":
        cls = int(b["class"])
        out.append(f"{w if CLASS_WORDS[cls] == item.cls else red}{d.text(10917 + cls)}")
    reqs = [(3459, num(b["reqdex"])), (3458, num(b["reqstr"]))]
    for sid, x in reqs:
        if x:
            out.append(f"{w}{d.text(sid)} {x}")
    req = v["LVLREQ"]
    if req > 1:
        out.append(f"{w if item.clvl >= req else red}{d.text(3469)} {req}")
    return out


def tooltip(item, name, desc):
    """The hover box as the game draws it, top line first: [[(color, text)]]. Built as one string bottom up (the
    affix lines, the filter's description and BH's Item / Affix Level lines, the base lines, the name, the Cost),
    so a color code carries over to the line above as in game."""
    v = filter_values(item)
    blue, green = code("BLUE"), code("DARK_GREEN")
    bottom_up = []
    if item.value(194):
        bottom_up.append(f"{blue}{item.data.text(3453)} ({item.value(194)})")
    for text, rng, star in reversed(stat_lines(item)):
        star = f"{code('RED')}*{blue}" if star else ""
        bottom_up.append(blue + text + star + (f" {green}[{rng[0]} - {rng[1]}]{blue}" if rng else ""))
    bottom_up += desc.split("\n") if desc else []
    if item.quality in ("MAG", "RARE", "CRAFT") and item.alvl != item.ilvl:
        bottom_up.append(f"{code('WHITE')}Affix Level: {item.alvl}")
    bottom_up.append(f"{code('WHITE')}Item Level: {item.ilvl}")
    bottom_up += list(reversed(base_lines(item, v)))
    bottom_up += name.split("\n")
    if item.place == "SHOP":
        bottom_up.append(f"{item.data.text(3329)}{price(item)}")
    lines, color = [], "BLUE"
    for text in bottom_up:
        segs, color = segments(text, color)
        lines.append(segs)
    return list(reversed(lines))


# ---------------------------------------------------------------- the price

def i32(x):
    x &= 0xFFFFFFFF
    return x - (1 << 32) if x & 0x80000000 else x


def price(item, sell_mult=SELL_MULT_FULL, quest_mult=None, reduce_pct=0):
    """The game's buy price of a store item (its transaction cost): the base's cost (armor: scaled by its defense
    against the base's most), each affix's add and multiply, each stat's ItemStatCost add and multiply (a skill's
    Skills.txt cost), then the vendor's sell multiplier (above 65535: divided first), a quest's, and Reduces all
    Vendor Prices. Checked against two prices seen in a shop (--selftest)."""
    sell = item_cost(item, 1024)
    sell = sell * sell_mult // 1024 if sell <= 65535 else sell // 1024 * sell_mult
    if quest_mult:
        sell = quest_mult * sell // 1024 if sell > 65535 else sell * quest_mult // 1024
    sell -= sell * reduce_pct // 100
    return max(sell, 1)


def sell_price(item, npc="malah"):
    """What a vendor pays for the item (BH's SELLPRICE: Malah, the game's own sell path): the cost with a skill's
    price at a quarter, a fourth of it for a class item, the vendor's buy multiplier, at most its max buy for the
    difficulty."""
    buy = item_cost(item, 4096)
    if item.base["class"] != "":
        buy //= 4
    r = item.data.vendors[npc]
    mult = num(r["buy mult"])
    buy = buy * mult // 1024 if buy <= 65535 else buy // 1024 * mult
    cap = num(r[["max buy", "max buy (N)", "max buy (H)"][DIFF]])
    return max(1, min(buy, cap))


def item_cost(item, skill_div):
    """The item's cost before a vendor's multipliers (the game's transaction cost); skill_div: what a skill's price
    is divided by (1024 buying, 4096 selling)."""
    b = item.base
    cost = num(b["cost"])
    if "armo" in item.types and num(b["maxac"]) and num(b["maxac"]) - num(b["minac"]) != -1:
        cost = item.defense * cost // num(b["maxac"])
    divisor = max(1, min(511, num(b["maxstack"]))) if num(b["stackable"]) else 1
    magic = item.quality in ("MAG", "RARE", "CRAFT")
    if not magic:
        cost += skill_costs(item, cost, divisor, skill_div)
    add = sum(a["add"] + i32(cost * a["multiply"]) // 1024 for a, _ in item.affixes if a)
    if magic:
        add += bonus_costs(item, cost, skill_div)
    cost += add // divisor
    if magic:
        cost += skill_costs(item, cost, divisor, skill_div)
    return cost


def bonus_costs(item, cost, skill_div=1024):
    """ItemStatCost's add + value * cost * multiply / 1024 for each stat the item's affixes give (a single skill:
    its Skills.txt cost add and mult; charges and chance to cast: the skill's, by level)."""
    d, total = item.data, 0
    for (sid, param), v in item.stats.items():
        st = d.stats.get(sid)
        if not st or not v:
            continue
        if st["Encode"] == 1:
            s = d.skills.get(param, {})
            total += s.get("costadd", 0) + i32(v * cost * s.get("costmult", 0)) // skill_div
        elif st["Encode"] in (2, 3):
            s = d.skills.get(param >> 6, {})
            total += s.get("costadd", 0) + i32((param & 63) * cost * s.get("costmult", 0)) // skill_div
        elif st["Encode"] != 4:
            total += st["Add"] + i32(v * cost * st["Multiply"]) // 1024
    return total


def skill_costs(item, cost, divisor, skill_div=1024):
    """A class item's own skills (staffmods): (2 * level - 1) * (cost add + cost * cost mult / 1024) each."""
    if not item.base["staffmods"]:
        return 0
    total = 0
    for (sid, param), v in item.stats.items():
        if sid == 107 and v:
            s = item.data.skills.get(param, {})
            total += (2 * v - 1) * (s.get("costadd", 0) + i32(s.get("costmult", 0) * cost) // skill_div)
    return total // divisor


# ---------------------------------------------------------------- the criteria in plain words

import base_map as B  # noqa: E402  (the Simplifier: conditions as sets of values per word)

WORD_NAMES = {"FCR": "Faster Cast Rate", "FRW": "Faster Run/Walk", "IAS": "Increased Attack Speed",
              "FBR": "Faster Block Rate", "FHR": "Faster Hit Recovery", "LIFE": "Life", "MANA": "Mana",
              "STR": "Strength", "DEX": "Dexterity", "MFIND": "Magic Find", "GFIND": "Gold Find",
              "AR": "Attack Rating", "MINDMG": "Minimum Damage", "MAXDMG": "Maximum Damage",
              "EDAM": "Enhanced Damage", "ED": "Enhanced Damage", "EDEF": "Enhanced Defense",
              "RES": "All Resistances", "FRES": "Fire Resist", "CRES": "Cold Resist", "LRES": "Lightning Resist",
              "PRES": "Poison Resist", "ALLSK": "All Skills", "STAT36": "Physical Damage Reduction",
              "STAT34": "flat Physical Damage Reduction", "STAT35": "Magic Damage Reduction",
              "STAT60": "Life Stolen per Hit", "STAT62": "Mana Stolen per Hit", "STAT110": "Poison Length Reduction",
              "STAT118": "Half Freeze Duration", "STAT3": "Vitality", "STAT96": "Faster Run/Walk",
              "ALLATTRIB": "all Attributes", "STAT127": "All Skills", "STAT329": "Fire Skill Damage",
              "STAT330": "Lightning Skill Damage", "STAT331": "Cold Skill Damage", "DTM": "Damage Taken Goes to Mana"}
PERCENT = {"FCR", "FRW", "IAS", "FBR", "FHR", "MFIND", "GFIND", "EDAM", "ED", "EDEF", "RES", "FRES", "CRES", "LRES",
           "PRES", "STAT36", "STAT60", "STAT62", "STAT110", "STAT96", "STAT329", "STAT330", "STAT331", "DTM"}
QUALITY_WORDS = {"MAG": "magic", "RARE": "rare", "CRAFT": "crafted", "NMAG": "non-magical", "UNI": "unique",
                 "SET": "set"}
ITEM_WORDS = {"CIRC": "circlet", "HELM": "helm", "CHEST": "body armor", "SHIELD": "shield", "GLOVES": "gloves",
              "BOOTS": "boots", "BELT": "belt", "WEAPON": "weapon", "STAFF": "staff", "WAND": "wand",
              "SCEPTER": "scepter", "DAGGER": "dagger", "CLUB": "club", "SIN": "Assassin item",
              "NEC": "Necromancer item", "SOR": "Sorceress item", "ZON": "Amazon item", "DIN": "Paladin item",
              "BAR": "Barbarian item", "DRU": "Druid item", "amu": "amulet", "rin": "ring", "JAV": "javelin",
              "BOW": "bow"}
CLASS_NAME = {c: c.capitalize() for c in CLASS_WORDS}
SKILL_KEY = re.compile(r"^(SK|OS|TABSK|CLSK)(\d+)$")
SUM_PART = re.compile(r"^(?:MULTI188,(\d+)|MULTI83,(\d+)|MULTI107,(\d+)|MULTI97,(\d+)|STAT127|ALLSK|TABSK(\d+)|"
                      r"CLSK(\d+)|SK(\d+))$")
FORMULA_RE = re.compile(r"^\$f\((.*)\)$", re.S)
BIG = B.BIG


FLAGS = {"STAT118"}  # a stat an item has or not


def plus(iv, top=3):
    return " or ".join(f"+{a}" if a == b else f"at most +{b}" if a <= 0 else f"+{a} or +{b}" if b == a + 1
                       else f"+{a}+" if b >= top else f"+{a}–{b}" for a, b in iv)


def article(word):
    return ("an " if word[:1] in "AEIOU" else "a ") + word


class Words:
    """A 280 rule's condition in plain words: base_map's Simplifier first (comparisons as sets of values), then
    each part worded; +skill combinations that add up to one total are said as that total."""

    def __init__(self, data):
        self.data, self.unknown, self.fx, self.tops = data, defaultdict(set), {}, {}
        self.simp = B.Simplifier(type("AnyBase", (), {"sockets": 6})())

    # ---- names
    def tab(self, n):
        cls, tab = n // 8, n % 8
        text = self.data.text(f"class:{cls}:StrSkillTab{tab + 1}").replace("+%d to ", "")
        if text in ("Summoning Skills", "Combat Skills"):
            text += f" ({CLASS_NAME[CLASS_WORDS[cls]]})"
        return text or f"skill tab {n}"

    def class_skills(self, n):
        return f"{CLASS_NAME[CLASS_WORDS[n]]} skills" if n < 7 else f"class {n} skills"

    def skill_name(self, key):
        if key in ("ALLSK", "STAT127"):
            return "All Skills"
        m = SKILL_KEY.match(key)
        kind, n = m.group(1), int(m.group(2))
        if kind in ("SK", "OS"):
            return self.data.skills.get(n, {}).get("name", f"skill {n}") + (" (oskill)" if kind == "OS" else "")
        return self.tab(n) if kind == "TABSK" else self.class_skills(n)

    @staticmethod
    def amount(iv, percent=False, top=BIG):
        u = "%" if percent else ""
        return " or ".join(f"{a}{u}" if a == b else f"{a}{u}+" if b >= top else f"under {b + 1}{u}" if a <= 0
                           else f"{a}–{b}{u}" for a, b in iv)

    def stat_name(self, key):
        """(name, percent) of a stat word: WORD_NAMES, else the game's own text for STAT<n>."""
        if key in WORD_NAMES:
            return WORD_NAMES[key], key in PERCENT
        m = re.fullmatch(r"STAT(\d+)", key)
        st = self.data.stats.get(int(m.group(1))) if m else None
        if st and st["descstrpos"]:
            name = re.sub(r"^(\+%d )?[Tt]o ", "", st["descstrpos"]).strip()
            return name, st["descfunc"] in (2, 4, 5, 7, 8, 20)
        self.unknown[key].add("a word")
        return key, False

    # ---- one comparison
    def set_words(self, key, iv):
        iv = list(iv)
        if key == "CLVL":
            return "character level " + " or ".join(
                f"{a}" if a == b else f"below {b + 1}" if a <= 1 else f"above {a - 1}" if b >= 99 else f"{a}–{b}"
                for a, b in iv)
        if key == "FILTLVL":
            return "filter level " + " or ".join(f"{a}" if a == b else f"{a}–{b}" for a, b in iv)
        if key == "SOCK":
            return " or ".join(f"{a}" if a == b else f"{a}+" if b >= 6 else f"{a}–{b}" for a, b in iv) + \
                (" socket" if iv == [(1, 1)] else " sockets")
        if key == "STAT360":
            return "not corrupted" if iv == [(0, 0)] else "corrupted"
        if SKILL_KEY.match(key) or key in ("ALLSK", "STAT127"):
            name = self.skill_name(key)
            return f"no + to {name}" if iv == [(0, 0)] else f"{plus(iv)} to {name}"
        if "+" in key:
            return self.sum_words(key, iv)
        if key.startswith("CHSK"):
            name = self.data.skills.get(int(key[4:]), {}).get("name", key)
            return f"{name} charges" if iv == [(1, BIG)] else f"{name} charges of level {self.amount(iv)}"
        name, percent = self.stat_name(key)
        top = B.domain(key, None)[1] if key in B.DOMAINS else BIG
        if iv == [(0, 0)]:
            return f"no {name}"
        if iv == [(1, top)] or (key in FLAGS and iv[0][0] >= 1):
            return name if key in FLAGS else f"any {name}"
        return f"{name} {self.amount(iv, percent, top)}"

    def sum_words(self, key, iv):
        parts = key.split("+")
        if all(SUM_PART.match(p) for p in parts):
            own, counted = None, []
            for p in parts:
                g = SUM_PART.match(p).groups()
                if g[0] or g[4]:
                    counted.append(self.tab(int(g[0] or g[4])))
                elif g[1] or g[5]:
                    counted.append(self.class_skills(int(g[1] or g[5])))
                elif g[2] or g[6] or g[3]:
                    own = self.data.skills.get(int(g[2] or g[6] or g[3]), {}).get("name", p)
                else:
                    counted.append("All Skills")
            target = own or counted[0]
            what = (["the skill itself"] if own else []) + [f"+{c}" for c in counted]
            return f"{plus(iv, BIG)} to {target} in all (from {B.join_or(what, 'and')})"
        if set(parts) == {"MINDMG", "MAXDMG"}:
            return f"Minimum and Maximum Damage together {self.amount(iv)}"
        self.unknown[key].add("a sum")
        return f"{key} {self.amount(iv)}"

    def formula_words(self, text):
        m = FORMULA_RE.match(text.strip())
        body = m.group(1) if m else text
        c = re.fullmatch(r"\s*COUNT\((.*)\)\s*>=\s*(\d+)\s*", body, re.S)
        if not c:
            self.unknown[text].add("a formula")
            return text
        args, depth, cur = [], 0, ""
        for ch in c.group(1):
            depth += (ch == "(") - (ch == ")")
            if ch == "," and depth == 0:
                args.append(cur)
                cur = ""
            else:
                cur += ch
        args.append(cur)
        words = []
        for a in args:
            m2 = re.fullmatch(r"\s*([A-Z_]+\d*)\s*(==|>=|<=|>|<|=)\s*(-?\d+)\s*", a)
            if not m2:
                self.unknown[a.strip()].add("a formula part")
                words.append(a.strip())
                continue
            key, op, n = m2.group(1), m2.group(2), int(m2.group(3))
            iv = {">": [(n + 1, BIG)], ">=": [(n, BIG)], "<": [(0, n - 1)], "<=": [(0, n)], "==": [(n, n)],
                  "=": [(n, n)]}[op]
            words.append(self.set_words(key, iv))
        return f"at least {c.group(2)} of: " + B.join_or(words, "and")

    # ---- a whole condition
    def tree(self, rule):
        cond = rule.pagecond
        for a, b in reversed(L.formula_ranges(cond)):
            key = f"FX{len(self.fx)}"
            self.fx[key] = cond[a:b]
            cond = cond[:a] + f" {key} " + cond[b:]
        return self.simp.simplify(self.simp.nary(T.fold(T.compile_rpn(cond), lambda w: None)))

    def rule_words(self, rule):
        """{item, shop, when} of one rule: what kind of item, in a shop only, and the rest of what it needs."""
        node = self.tree(rule)
        if node == ("c", 0):
            return None
        self.tops = {}  # each skill word up to the most the rule names for it (an amulet's +2 All Skills)
        for k, iv in self.literals(node):
            self.tops[k] = max(self.tops.get(k, 0), min(3, max(b if b < BIG else a for a, b in iv)))
        kids = list(node[1]) if node[0] == "and" else [node]
        quality, items, shop, rest = [], [], False, []
        for x in kids:
            kind = self.kind(x)
            if kind == "quality":
                quality.append(x)
            elif kind == "item":
                items.append(x)
            elif kind == "shop":
                shop = True
            elif kind != "skip":
                rest.append(x)
        when = [p for p in (self.phrase(x, 1) for x in rest) if p]
        own = set()  # the skills the rule gives a + to (for rows that differ only in the skill: "the skill")
        for k, iv in self.literals(node):
            m = re.fullmatch(r"(?:SK|OS)(\d+)", k) or re.search(r"MULTI(?:107|97),(\d+)", k)
            if m and (min(a for a, _ in iv) >= 1 or k.startswith("MULTI")):
                own.add(self.data.skills.get(int(m.group(1)), {}).get("name", ""))
        generic = [w for w in when]
        for name in sorted(own - {""}, key=len, reverse=True):
            generic = [re.sub(r"(?<!\w)" + re.escape(name) + r"(?!\w)", "the skill", w) for w in generic]
        return {"item": self.item_words(quality, items), "shop": shop, "when": when, "generic": generic}

    def kind(self, x):
        if x[0] == "bool" and x[1] in QUALITY_WORDS and x[2]:
            return "quality"
        if x[0] == "or" and all(y[0] == "bool" and y[1] in QUALITY_WORDS and y[2] for y in x[1]):
            return "quality"
        if x == ("bool", "SHOP", True):
            return "shop"
        if x in (("bool", "ID", True), ("bool", "RW", False)):
            return "skip"  # (shop items are identified; runewords are left out by every rule they could meet)
        if x[0] == "bool" and self.item_word(x[1]) and x[2]:
            return "item"
        if x[0] == "or" and all(y[0] == "bool" and self.item_word(y[1]) and y[2] for y in x[1]):
            return "item"
        return "rest"

    def item_word(self, word):
        if word in ITEM_WORDS:
            return ITEM_WORDS[word]
        if len(word) >= 3 and not any(c.isupper() for c in word[:3]) and word in self.data.bases:
            return self.data.bases[word]["name"]
        return None

    def item_words(self, quality, items):
        q = []
        for x in quality:
            q += [QUALITY_WORDS[y[1]] for y in (x[1] if x[0] == "or" else [x])]
        names = [B.join_or(self.item_word(y[1]) for y in (x[1] if x[0] == "or" else [x])) for x in items]
        return " ".join(filter(None, [B.join_or(q), " and ".join(names) or "item"]))

    def phrase(self, x, depth=0):
        k = x[0]
        if k == "c":
            return "" if x[1] else "never"
        if k == "bool":
            w, yes = x[1], x[2]
            if w in self.fx:
                return ("" if yes else "not ") + self.formula_words(self.fx[w])
            if w in CLASS_WORDS:
                return ("" if yes else "not ") + article(f"{CLASS_NAME[w]} character")
            if w in QUALITY_WORDS:
                return ("" if yes else "not ") + QUALITY_WORDS[w]
            if self.item_word(w):
                return self.item_word(w) if yes else f"not a {self.item_word(w)}"
            if w == "SHOP":
                return "in a shop" if yes else "not in a shop"
            if w == "RW":
                return "a runeword" if yes else "not a runeword"
            self.unknown[w].add("a word")
            return w if yes else "not " + w
        if k == "set":
            return self.set_words(x[1], x[2])
        if k == "not":
            inner = x[1]
            if inner[0] == "or" and all(y[0] == "set" for y in inner[1]):
                return B.join_or((self.phrase(self.simp.negate(y), depth + 1) for y in inner[1]), "and")
            return "not (" + self.phrase(inner, depth + 1) + ")"
        kids = list(x[1])
        total = self.skill_total(x)
        if total:
            return total
        if k == "or":
            same = self.same_amount(kids)
            if same:
                return same
            parts, skills = [], defaultdict(list)  # the same + to several skills: one part
            for y in kids:
                if y[0] == "set" and (SKILL_KEY.match(y[1]) or y[1] == "ALLSK"):
                    skills[tuple(y[2])].append(y)
                else:
                    parts.append(self.phrase(y, depth + 1))
            parts = [self.same_amount(ys) for ys in skills.values()] + parts
            if depth <= 1 and any(" and " in p or ", " in p for p in parts):
                return "either " + "; or ".join(parts)
            return B.join_or(f"({p})" if " and " in p or ", " in p else p for p in parts)
        parts = [p for p in (self.phrase(y, depth + 1) for y in kids) if p]
        return B.join_or(parts, "and") if depth else ", ".join(parts)

    def same_amount(self, kids):
        """An OR of one + to several skills: '+2 to any class's skills, Passive and Magic Skills or Fire Skills'."""
        if not all(y[0] == "set" and (SKILL_KEY.match(y[1]) or y[1] == "ALLSK") for y in kids):
            return None
        amounts = {tuple(y[2]) for y in kids}
        if len(amounts) != 1:
            return None
        names = [self.skill_name(y[1]) for y in kids]
        if sum(1 for y in kids if y[1].startswith("CLSK")) == 7:
            names = ["any class's skills"] + [self.skill_name(y[1]) for y in kids if not y[1].startswith("CLSK")]
        iv = list(amounts.pop())
        if iv == [(0, 0)]:
            return B.join_or(f"no + to {n}" for n in names)
        return f"{plus(iv)} to " + B.join_or(names)

    def skill_total(self, x):
        """An OR of +skill combinations that adds up to one total: '+4 to Chain Lightning Sentry in all'. Checked by
        trying every combination (an item has one class or skill tab prefix)."""
        keys = sorted(set(self.literal_keys(x)))
        own = [k for k in keys if k.startswith(("SK", "OS"))]
        if len(own) != 1 or len(keys) > 5 or not all(SKILL_KEY.match(k) or k == "ALLSK" for k in keys):
            return None
        groups = [k for k in keys if k.startswith(("TABSK", "CLSK"))]
        tops = {k: self.tops.get(k, 2 if k == "ALLSK" else 3) for k in keys}
        sat, real = set(), []
        for combo in __import__("itertools").product(*(range(tops[k] + 1) for k in keys)):
            vals = dict(zip(keys, combo))
            if sum(1 for g in groups if vals[g]) > 1:
                continue
            real.append(combo)
            if self.ev(x, vals):
                sat.add(combo)
        totals = {sum(c) for c in sat}
        if len(totals) != 1:
            return None
        n, i = totals.pop(), keys.index(own[0])
        least = min(c[i] for c in sat)
        if {c for c in real if sum(c) == n and c[i] >= least} != sat:
            return None
        counted = [f"+{self.skill_name(g)}" for g in groups] + (["+All Skills"] if "ALLSK" in keys else [])
        itself = "the skill itself" + (f" (at least +{least})" if least > 1 else "")
        return f"+{n} to {self.skill_name(own[0])} in all (from {B.join_or([itself] + counted, 'and')})"

    def literals(self, x):
        """(word, values) of each comparison x needs to be true (not those under a "not")."""
        if x[0] == "set":
            yield x[1], x[2]
        elif x[0] in ("and", "or"):
            for y in x[1]:
                yield from self.literals(y)

    def literal_keys(self, x):
        if x[0] == "set":
            yield x[1]
        elif x[0] in ("and", "or"):
            for y in x[1]:
                yield from self.literal_keys(y)
        elif x[0] == "not":
            yield from self.literal_keys(x[1])

    def ev(self, x, vals):
        k = x[0]
        if k == "c":
            return bool(x[1])
        if k == "set":
            return any(a <= vals.get(x[1], 0) <= b for a, b in x[2])
        if k == "bool":
            return True
        if k == "not":
            return not self.ev(x[1], vals)
        if k == "and":
            return all(self.ev(y, vals) for y in x[1])
        return any(self.ev(y, vals) for y in x[1])


for _key in list(WORD_NAMES) + ["SOCK", "STAT360"]:
    B.DOMAINS.setdefault(_key, (0, BIG))  # stats never go below 0 ("no FCR" is FCR=0)
B.DOMAINS.setdefault("FILTLVL", (0, 12))


# ---------------------------------------------------------------- the families of highlights

HIGHLIGHT_RE = re.compile(r"%HIGHLIGHT_(\d)_LEFT%(.*?)%HIGHLIGHT_\d_RIGHT%")
SHOP_COLOR_RE = re.compile(r"^%NAME%(%[A-Z_]+%)\{")


def label(rule):
    """The highlight's own text ('3/%IAS% Gloves'), or ''."""
    m = HIGHLIGHT_RE.search(rule.line)
    return re.sub(r"%(?!(?:IAS|FCR|FRW|FBR|SK\d+)%)[A-Z_]+%", "", m.group(2)).strip() if m else ""


def kind(rule):
    """1 or 2: which highlight look (HIGHLIGHT_1 / HIGHLIGHT_2), 0 for a rule that only colors the Cost line."""
    m = HIGHLIGHT_RE.search(rule.line)
    return int(m.group(1)) if m else 0


def shop_color(rule):
    m = SHOP_COLOR_RE.match(rule.line)
    return m.group(1).strip("%") if m else None


def has(rule, *words):
    return all(re.search(r"(?<![\w,])" + re.escape(w) + r"(?![\w,])", rule.cond) for w in words)


SECTIONS = [  # (id, title, intro)
    ("jewelry", "Jewelry and circlets", ""),
    ("gloves", "Gloves", ""),
    ("armor", "Helms, body armor and shields", ""),
    ("skills", "Class items: +N to one skill", "The total to one skill counts the item's +All Skills, its class's "
     "skills, the skill's tab and the skill itself."),
    ("shop", "Leveling: what to buy in shops", "These look only at items in a shop, and some only up to a "
     "character level."),
    ("casters", "Leveling: caster weapons", "For leveling: a staff, wand or scepter with the class's best "
     "skills. The yellow ones also have Faster Cast Rate."),
    ("utility", "Charges and party skills", ""),
]

FAMILIES = [
    {"id": "physical-ring", "section": "jewelry", "title": "Physical rings", "match": lambda r: label(r) == "Physical",
     "sample": {"base": "rin", "quality": "RARE", "name": ["Raven", "Loop"], "clvl": 90, "ilvl": 99,
                "affixes": ["Platinum", "Garnet", "Fortuitous", "of Carnage", "of Performance", "of the Lamprey"]}},
    {"id": "circlet-fcr-frw", "section": "jewelry", "title": "Circlets with cast rate and run/walk",
     "match": lambda r: has(r, "CIRC") and "%FRW%/%FCR%" in label(r),
     "sample": {"base": "ci3", "quality": "RARE", "name": ["Doom", "Visage"], "class": "SORCERESS", "ilvl": 99,
                "affixes": ["Arch-Angel's", "of the Magus", "of Speed"]}},
    {"id": "circlet-fcr", "section": "jewelry", "title": "Circlets with cast rate",
     "match": lambda r: has(r, "CIRC") and label(r).endswith("%FCR%fcr"),
     "sample": {"base": "ci3", "affixes": ["Volcanic", "of the Magus"], "class": "SORCERESS", "ilvl": 90}},
    {"id": "circlet-frw", "section": "jewelry", "title": "Circlets with run/walk",
     "match": lambda r: has(r, "CIRC") and label(r).endswith("%FRW%frw"),
     "sample": {"base": "ci3", "affixes": ["Volcanic", "of Speed"], "class": "SORCERESS", "ilvl": 90}},
    {"id": "amulet-tab", "section": "jewelry", "title": "Magic amulets: +3 to a skill tab",
     "match": lambda r: has(r, "amu") and "TABSK0=3" in r.cond,
     "sample": {"base": "amu", "affixes": ["Volcanic", "of the Apprentice"], "class": "SORCERESS", "ilvl": 90}},
    {"id": "amulet-class", "section": "jewelry", "title": "Amulets: +2 to a class or skill tab",
     "match": lambda r: has(r, "amu") and "TABSK0=2" in r.cond,
     "sample": {"base": "amu", "quality": "RARE", "name": ["Beast", "Talisman"], "class": "ASSASSIN", "ilvl": 99,
                "affixes": ["Witch-hunter's", "Garnet", "of the Magus", "of the Tiger"]}},
    {"id": "gloves-3", "section": "gloves", "title": "Gloves: +3 to a skill tab",
     "match": lambda r: has(r, "GLOVES") and (label(r).lstrip("+").startswith("3/") or (has(r, "SHOP") and not label(r))),
     "sample": {"base": "hgl", "affixes": ["Lancer's", "of Alacrity"], "clvl": 96, "def": 13}},
    {"id": "gloves-2", "section": "gloves", "title": "Gloves: +2 to a skill tab",
     "match": lambda r: has(r, "GLOVES") and label(r).lstrip("+").startswith("2/"),
     "sample": {"base": "vgl", "affixes": ["Spearmaiden's", "of Alacrity"], "clvl": 90}},
    {"id": "caster-armor", "section": "armor",
     "title": "Rare body armor with +2 class skills and two of cast rate, damage reduction and all resistances",
     "match": lambda r: has(r, "CHEST", "RARE") and "CLSK1=2" in r.cond,
     "sample": {"base": "utp", "quality": "RARE", "name": ["Doom", "Shroud"], "class": "SORCERESS", "ilvl": 99,
                "affixes": ["Arch-Angel's", "Prismatic", "of the Archmage", "of the Whale", "of Guardianship"]}},
    {"id": "caster-shield", "section": "armor",
     "title": "Shields with +2 class skills or +3 Combat Skills and two of cast rate, damage reduction and all "
              "resistances",
     "match": lambda r: has(r, "SHIELD") and "!NEC" in r.cond,
     "sample": {"base": "uit", "quality": "RARE", "name": ["Bramble", "Ward"], "class": "PALADIN", "ilvl": 99,
                "affixes": ["Priest's", "Prismatic", "of the Magus", "of Guardianship"]}},
    {"id": "class-shield", "section": "armor",
     "title": "Paladin shields and Necromancer heads with +2 class skills or +3 to a skill tab, and two of cast "
              "rate, damage reduction and all resistances",
     "match": lambda r: has(r, "SHIELD") and "(DIN OR NEC)" in r.cond,
     "sample": {"base": "pac", "quality": "RARE", "name": ["Bramble", "Ward"], "class": "PALADIN", "ilvl": 95,
                "affixes": ["Rose Branded", "of the Magus", ["of Protecting", 20]], "automagic": "Chromatic",
                "automagic value": 28}},
    {"id": "warcries-weapon", "section": "armor", "title": "Weapons with +3 or +4 to Warcries",
     "match": lambda r: "Warcries Weapon" in label(r),
     "sample": {"base": "hax", "affixes": ["Echoing"], "class": "BARBARIAN", "clvl": 85}},
    {"id": "shadow-helm", "section": "armor", "title": "Helms with Shadow Disciplines",
     "match": lambda r: "Shadow Disciplines" in label(r),
     "sample": {"base": "crn", "affixes": ["Shadow", "of Fortune"], "class": "ASSASSIN", "clvl": 85}},
    {"id": "caster-gloves", "section": "shop", "title": "Caster gloves", "match": lambda r: label(r) == "Caster Gloves",
     "sample": {"base": "vgl", "affixes": ["Garnet", "of the Apprentice"], "class": "SORCERESS", "clvl": 50}},
    {"id": "caster-belt", "section": "shop", "title": "Caster belts", "match": lambda r: label(r) == "Caster Belt",
     "sample": {"base": "mbl", "affixes": ["Garnet", "of the Apprentice"], "class": "SORCERESS", "clvl": 50}},
    {"id": "resist-belt", "section": "shop", "title": "Resist belts", "match": lambda r: label(r) == "Resist Belt",
     "sample": {"base": "mbl", "affixes": ["Cobalt", "of the Tiger"], "class": "BARBARIAN", "clvl": 50}},
    {"id": "phys-gloves", "section": "shop", "title": "Physical gloves", "match": lambda r: label(r) == "Phys Gloves",
     "sample": {"base": "vgl", "affixes": ["Coral", "of Alacrity"], "class": "BARBARIAN", "clvl": 50}},
    {"id": "resist-boots", "section": "shop", "title": "Resist boots", "match": lambda r: label(r) == "Resist Boots",
     "sample": {"base": "lbt", "affixes": ["Ruby", "of Haste"], "class": "PALADIN", "clvl": 50}},
    {"id": "resist-gloves", "section": "shop", "title": "Resist gloves", "match": lambda r: label(r) == "Resist Gloves",
     "sample": {"base": "vgl", "affixes": ["Jade", "of Fortune"], "class": "SORCERESS", "clvl": 50}},
    {"id": "mf-helm", "section": "shop", "title": "Magic Find helms", "match": lambda r: label(r) == "Magic Find Helm",
     "sample": {"base": "crn", "affixes": ["Artisan's", "of Fortune"], "class": "SORCERESS", "clvl": 70}},
    {"id": "artisan-helm", "section": "shop", "title": "Three-socket helms",
     "match": lambda r: label(r) == "Artisan's Helm",
     "sample": {"base": "crn", "affixes": ["Artisan's", "of Maiming"], "class": "BARBARIAN", "clvl": 75}},
    {"id": "artisan-armor", "section": "shop", "title": "Three-socket body armor",
     "match": lambda r: label(r) == "Artisan's Armor",
     "sample": {"base": "ltp", "affixes": ["Artisan's", "of the Magus"], "class": "SORCERESS", "clvl": 79}},
    {"id": "artisan-shield", "section": "shop", "title": "Three-socket shields",
     "match": lambda r: label(r) == "Artisan's Shield" or (has(r, "SHOP", "SHIELD", "SOCK>2") and not label(r)),
     "sample": {"base": "tow", "affixes": ["Artisan's", "of Deflecting"], "class": "PALADIN", "clvl": 75}},
    {"id": "pdr-shield", "section": "shop", "title": "Physical Damage Reduction shields",
     "match": lambda r: label(r) == "PDR Shield",
     "sample": {"base": "tow", "affixes": ["Monk's", "of Guardianship"], "class": "PALADIN", "clvl": 90}},
    {"id": "pdr-chest", "section": "shop", "title": "Physical Damage Reduction body armor",
     "match": lambda r: label(r) == "PDR Chest",
     "sample": {"base": "ltp", "affixes": ["Magekiller's", "of Guardianship"], "class": "ASSASSIN", "clvl": 90}},
    {"id": "jeweler-armor", "section": "shop", "title": "Four-socket body armor",
     "match": lambda r: label(r) == "Jeweler's Armor",
     "sample": {"base": "aar", "affixes": ["Jeweler's", "of the Whale"], "class": "BARBARIAN", "clvl": 79}},
    {"id": "jeweler-shield", "section": "shop", "title": "Four-socket shields",
     "match": lambda r: label(r) == "Jeweler's Shield",
     "sample": {"base": "uit", "affixes": ["Jeweler's", "of the Magus"], "class": "PALADIN", "clvl": 90}},
    {"id": "assassin", "section": "skills", "title": "Assassin claws and daggers",
     "match": lambda r: has(r, "SIN", "DAGGER"),
     "sample": {"base": "ktr", "affixes": ["Cunning"], "staffmods": {"Chain Lightning Sentry": 3},
                "class": "ASSASSIN", "clvl": 90}},
    {"id": "necromancer", "section": "skills", "title": "Necromancer wands and heads",
     "match": lambda r: has(r, "WAND", "NEC") and not has(r, "RW"),
     "sample": {"base": "wnd", "affixes": ["Venomous", "of the Magus"], "staffmods": {"Bone Spear": 3},
                "class": "NECROMANCER", "clvl": 90}},
    {"id": "amazon", "section": "skills", "title": "Amazon javelins and bows", "match": lambda r: has(r, "ZON"),
     "sample": {"base": "am5", "affixes": ["Lancer's"], "automagic": "Lancer's", "class": "AMAZON", "clvl": 90}},
    {"id": "paladin", "section": "skills", "title": "Paladin scepters",
     "match": lambda r: has(r, "SCEPTER") and "MULTI" in r.cond,
     "sample": {"base": "scp", "affixes": ["Rose Branded"], "staffmods": {"Blessed Hammer": 3}, "class": "PALADIN",
                "clvl": 90}},
    {"id": "sorceress", "section": "skills", "title": "Sorceress orbs and staves",
     "match": lambda r: has(r, "SOR") and "MULTI" in r.cond and not has(r, "RW"),
     "sample": {"base": "ob1", "affixes": ["Powered"], "staffmods": {"Nova": 3}, "automagic": "Serpent's",
                "class": "SORCERESS", "clvl": 90}},
    {"id": "barbarian", "section": "skills", "title": "Barbarian helms", "match": lambda r: has(r, "BAR"),
     "sample": {"base": "ba1", "affixes": ["Echoing"], "staffmods": {"War Cry": 3}, "class": "BARBARIAN",
                "clvl": 90}},
    {"id": "druid", "section": "skills", "title": "Druid pelts and clubs", "match": lambda r: has(r, "CLUB", "DRU"),
     "sample": {"base": "dr1", "affixes": ["Gaean"], "staffmods": {"Tornado": 3}, "class": "DRUID", "clvl": 90}},
    {"id": "scepters-fcr", "section": "casters", "title": "Scepters with cast rate",
     "match": lambda r: has(r, "SCEPTER") and kind(r) == 2,
     "sample": {"base": "scp", "affixes": ["Lion Branded", "of the Magus"], "staffmods": {"Holy Bolt": 3},
                "class": "PALADIN", "clvl": 40}},
    {"id": "scepters", "section": "casters", "title": "Scepters",
     "match": lambda r: has(r, "SCEPTER", "RW") and kind(r) == 1 and "Useful" not in r.line,
     "sample": {"base": "scp", "quality": "NMAG", "staffmods": {"Holy Bolt": 3}, "class": "PALADIN", "clvl": 25}},
    {"id": "wands-fcr", "section": "casters", "title": "Wands with cast rate",
     "match": lambda r: has(r, "WAND", "RW") and kind(r) == 2,
     "sample": {"base": "wnd", "affixes": ["Summoner's", "of the Magus"], "staffmods": {"Teeth": 3},
                "class": "NECROMANCER", "clvl": 40}},
    {"id": "wands", "section": "casters", "title": "Wands",
     "match": lambda r: has(r, "WAND", "RW") and kind(r) == 1 and "Useful" not in r.line,
     "sample": {"base": "bwn", "quality": "NMAG", "staffmods": {"Teeth": 3}, "class": "NECROMANCER", "clvl": 25}},
    {"id": "staves", "section": "casters", "title": "Staves",
     "match": lambda r: has(r, "STAFF", "RW") and "Useful" not in r.line and "MULTI" not in r.cond,
     "sample": {"base": "sst", "quality": "NMAG", "staffmods": {"Fire Ball": 3}, "class": "SORCERESS",
                "clvl": 20}},
    {"id": "teleport", "section": "utility", "title": "Teleport charges",
     "match": lambda r: label(r) == "Teleport Charges",
     "sample": {"base": "sst", "affixes": ["of Teleportation"], "class": "NECROMANCER", "clvl": 50}},
    {"id": "lower-res", "section": "utility", "title": "Lower Resist charges",
     "match": lambda r: label(r) == "Lower Res Charges",
     "sample": {"base": "wnd", "affixes": ["of Lower Resistance"], "class": "SORCERESS", "clvl": 50}},
    {"id": "party-scepters", "section": "utility", "title": "Scepters for a party aura",
     "match": lambda r: has(r, "SCEPTER", "RW") and "Useful" in r.line or (has(r, "gsc") and "Prayer" in label(r)),
     "sample": {"base": "scp", "quality": "NMAG", "staffmods": {"Vigor": 2}, "class": "PALADIN", "clvl": 20}},
    {"id": "party-wands", "section": "utility", "title": "Wands that make corpses",
     "match": lambda r: has(r, "WAND", "RW") and "Useful" in r.line,
     "sample": {"base": "wnd", "quality": "NMAG", "staffmods": {"Desecrate": 1}, "class": "NECROMANCER",
                "clvl": 20}},
    {"id": "enchant-staves", "section": "utility", "title": "Staves for a party enchant",
     "match": lambda r: has(r, "STAFF", "RW") and ("Useful" in r.line or "MULTI" in r.cond),
     "sample": {"base": "sst", "quality": "NMAG", "staffmods": {"Cold Enchant": 3}, "class": "SORCERESS",
                "clvl": 20}},
]


def families(rules):
    """{family id: [its 280 rules]}; every 280 rule in exactly one family (or the run stops)."""
    out, stray, twice = {f["id"]: [] for f in FAMILIES}, [], []
    for r in rules:
        if not r.section or r.twin:
            continue
        hits = [f["id"] for f in FAMILIES if f["match"](r)]
        if len(hits) == 1:
            out[hits[0]].append(r)
        elif hits:
            twice.append(f"{r.where} ({', '.join(hits)})")
        else:
            stray.append(r.where)
    if stray or twice:
        raise SystemExit("280 rules without one family of FAMILIES (tools/shop_map.py):\n  " +
                         "\n  ".join([f"no family: {w}" for w in stray] + [f"two families: {w}" for w in twice]))
    return out


# ---------------------------------------------------------------- the page

INTRO = [
    "A highlight is a line of stars the filter adds to an item's hover box, in a shop, your inventory or your "
    "stash: <b>+3/20ias</b>, <b>+7 Chain Lightning</b>. In a shop some items also get a green or teal Cost line, "
    "so they stand out before you hover them.",
    "Each kind of highlight below has a sample item drawn as its hover box looks in game, then every highlight of "
    "that kind and what an item needs to get it. An item a store never sells (a rare, a circlet, most class items) "
    "is drawn in your inventory.",
    "A corrupted item shows the highlight without its stars: its own lines are longer, and the hover box has less "
    "room left for the filter's lines.",
]
SELFTEST = [  # two shop screenshots of the author's (2026-10-20): the hover box line by line, and the Cost seen
    # (the gloves' highlight line follows the rule's text: "3/20 Gloves" on the screenshot, "+3/20ias" since 2026-10-21)
    ({"id": "gloves", "base": "hgl", "affixes": ["Lancer's", "of Alacrity"], "clvl": 96, "def": 13},
     (960, 922, 15), 20272,
     ["Cost: 20272", "Lancer's Gauntlets of Alacrity", "3jav 20ias", "Defense: 13", "Durability: 24 of 24",
      "Required Strength: 60", "Required Level: 45", "Item Level: 99", "Crafted Affix Level: 95",
      "*******   +3/20ias   *******", "+3 to Javelin and Spear Skills (Amazon Only) [1 - 3]",
      "+20% Increased Attack Speed [10 - 20]"]),
    # (the plate's Witch-hunter's was level 50, required level 42 then; the 2026-10-23 build has 75 / 68, past the
    # plate's affix level 71: the author kept the screenshot, with that row as it was)
    ({"id": "plate", "base": "ltp", "affixes": ["Witch-hunter's", ("of Protecting", 20)], "clvl": 80, "def": 97,
      "class": "ASSASSIN", "old_affixes": {"Witch-hunter's": {"level": 50, "levelreq": 42}}},
     (960, None, 0), 199680,
     ["Cost: 199680", "Witch-hunter's Light Plate of Protecting", "2sin 20%pdr", "Defense: 97",
      "Durability: 60 of 60", "Required Strength: 41", "Required Level: 42", "Item Level: 85", "Affix Level: 71",
      "Crafted Affix Level: 65", "Max Sockets: L:2 P:2 C:3", "*****   20% Damage Reduction   *****",
      "+2 to Assassin Skill Levels [1 - 2]", "Physical Damage Taken Reduced by 20% [4 - 25]"]),
]


TRANSFORMS = ["grey", "grey2", "gold", "brown", "greybrown", "invgrey", "invgrey2", "invgreybrown"]  # InvTrans 1-8
TRANSFORM_COLORS = ["whit", "lgry", "dgry", "blac", "lblu", "dblu", "cblu", "lred", "dred", "cred", "lgrn", "dgrn",
                    "cgrn", "lyel", "dyel", "lgld", "dgld", "lpur", "dpur", "oran", "bwht"]  # Colors.txt


def picture_color(item):
    """The color an item's affixes give its picture (the game's: a suffix's before a prefix's), '' for none."""
    if item.quality not in ("MAG", "RARE") or not 1 <= num(item.base["InvTrans"]) <= len(TRANSFORMS):
        return ""
    for kind in ("suffix", "prefix"):
        for a, _ in item.affixes:
            if a and a["kind"] == kind and a["color"] in TRANSFORM_COLORS:
                return a["color"]
    return ""


def picture_name(item):
    color = picture_color(item)
    return item.base["invfile"] + (f"-{color}" if color else "")


def picture(item):
    """The base's inventory picture as a data URI (tools/inv/, --pictures), or None."""
    path = INV / f"{picture_name(item)}.png"
    if not path.exists():
        return None
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()


def drawn(text):
    """[[color, text]] of a filter text with BH's codes (one line)."""
    segs, _ = segments(text, "WHITE")
    return [[c, t] for c, t in segs]


def rule_label(rule, model):
    """The highlight line a rule adds, as drawn: its description's new line, filled with the sample's values (the
    rule's own where it fixes one: FCR=20; else the most an affix on the sample's base gives: 3/20/20 Gloves)."""
    v = dict(model.v)
    for word in re.findall(r"%(IAS|FCR|FRW|FBR|SK\d+)%", rule.line):
        m = re.search(r"(?<![\w,])" + word + r"([=>~])(\d+)", rule.cond)
        if m and m.group(1) in "=~":
            v[word] = int(m.group(2))
        elif m and not v.get(word):
            sid = STAT_IDS.get(word)
            best = max((s[3] for a in model.item.data.affixes if a["version"] and a["kind"] in ("prefix", "suffix")
                        and fits(a, model.item.types) for mod in a["mods"] for s in mod[5] if s[0] == sid),
                       default=0)
            v[word] = best if best > int(m.group(2)) else int(m.group(2)) + 1
    text = LC.trim(LC.apply(rule.desc, "", v, ""))
    lines = [x for x in text.split("\n") if x]
    return drawn(lines[0]) if lines else []


def family_data(fam, rules, all_rules, formulas, data, words):
    item = Item(data, dict(fam["sample"], id=fam["id"]))
    model = Model(item, formulas)
    name, desc, hits, _ = run_rules(all_rules, model)
    mine = [r for r in (h.twin or h for h in hits) if r in rules]
    if not mine:
        raise SystemExit(f"family {fam['id']}: its sample gets none of the family's highlights "
                         f"(it gets {', '.join(h.where for h in hits) or 'none of 280'})")
    rows = []
    for r in rules:
        w = words.rule_words(r)
        if w is None:
            continue  # never matches (--findings)
        lab = rule_label(r, model) if kind(r) else []
        key = (w["item"], w["shop"], tuple(w["generic"]), shop_color(r) or "")
        same = next((row for row in rows if row["key"] == key and lab and row["labels"]), None)
        if same:  # the same words but for the skill: one row, its labels side by side
            same["labels"].append(lab)
            same["when"] = w["generic"]
            same["lines"].append(r.where)
            continue
        rows.append({"key": key, "labels": [lab] if lab else [], "item": w["item"], "shop": w["shop"],
                     "when": w["when"], "cost": shop_color(r) or "", "lines": [r.where]})
    for row in rows:
        row.pop("key")
    return {"id": fam["id"], "title": fam["title"], "rows": rows,
            "scene": {"place": item.place, "w": num(item.base["invwidth"]), "h": num(item.base["invheight"]),
                      "img": picture(item), "box": [[[c, t] for c, t in line] for line in tooltip(item, name, desc)],
                      "who": f"{CLASS_NAME[item.cls]}, level {item.clvl}",
                      "hits": [h.where for h in mine]}}


def price_note(data):
    """What the Cost line's price is: the full price, as most vendors ask it (docs/pd2-vendors.tsv)."""
    full = [n for n, r in data.vendors.items() if num(r["sell mult"]) == SELL_MULT_FULL and not n.startswith("gheed")]
    other = {n: num(r["sell mult"]) for n, r in data.vendors.items()
             if num(r["sell mult"]) != SELL_MULT_FULL and not n.startswith("gheed")}
    less = [n.capitalize() for n, m in other.items() if m < SELL_MULT_FULL]
    more = [n.capitalize() for n, m in other.items() if m > SELL_MULT_FULL]
    parts = [f"The Cost is the full price, as {len(full)} of the {len(full) + len(other)} vendors ask it"]
    if less:
        parts.append(f"{B.join_or(less, 'and')} {'asks' if len(less) == 1 else 'ask'} "
                     f"{round(100 - 100 * min(other[n.lower()] for n in less) / SELL_MULT_FULL)}% less")
    if more:
        parts.append(f"{B.join_or(more, 'and')} ask {max(other[n.lower()] for n in more) // SELL_MULT_FULL} times "
                     "as much until a quest in their act lowers it")
    return "; ".join(parts) + ". A quest in each act takes 10% off, and Reduces all Vendor Prices more."


def page_data():
    data = Data()
    rules, formulas = load_rules()
    words = Words(data)
    fams = families(rules)
    sections = []
    for sid, title, intro in SECTIONS:
        cards = [family_data(f, fams[f["id"]], rules, formulas, data, words) for f in FAMILIES
                 if f["section"] == sid]
        sections.append({"id": sid, "title": title, "intro": intro, "cards": cards})
    _, season, date = build.load_version()
    foot = (f"Built from the filter's sections ({build.version_text(season, date)}) by tools/shop_map.py: every "
            f"highlight of the filter's own rules, the items drawn from the game's tables.")
    return {"intro": INTRO, "price": price_note(data), "sections": sections, "foot": foot,
            "colors": {k: "#" + v for k, v in COLORS.items()}}, words


def page_text(data):
    page = T.DOC_HEAD + TEMPLATE.read_text(encoding="utf-8") + "\n</body>\n</html>\n"
    return page.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")))


# ---------------------------------------------------------------- checks and reports

def selftest():
    data = Data()
    rules, formulas = load_rules()
    bad = 0
    for spec, (mult, quest, cut), cost, want in SELFTEST:
        item = Item(data, spec)
        name, desc, _, _ = run_rules(rules, Model(item, formulas))
        got = ["".join(t for _, t in line) for line in tooltip(item, name, desc)]
        got[0] = f"{data.text(3329)}{price(item, mult, quest, cut)}"
        for i, (a, b) in enumerate(zip(want + [""] * len(got), got + [""] * len(want))):
            if a != b and (a or b):
                print(f"{spec['id']} line {i + 1}: want {a!r}, got {b!r}")
                bad += 1
        print(f"{spec['id']}: {'OK' if not bad else 'differs'} (Cost {price(item, mult, quest, cut)}, seen {cost})")
    sys.exit(1 if bad else 0)


def findings():
    data = Data()
    rules, formulas = load_rules()
    words = Words(data)
    for r in rules:
        if r.section and not r.twin and words.rule_words(r) is None:
            print(f"{r.where}: never matches (its condition contradicts itself): {r.cond[:120]}")
    for f in FAMILIES:
        item = Item(data, dict(f["sample"], id=f["id"]))
        if not picture(item):
            print(f"{f['id']}: no picture tools/inv/{item.base['invfile']}.png (run --pictures)")
    for key, where in sorted(words.unknown.items()):
        print(f"word left as its code: {key} ({', '.join(sorted(where))})")


def show_family(name):
    data = Data()
    rules, formulas = load_rules()
    words = Words(data)
    fams = families(rules)
    for f in FAMILIES:
        if name.lower() not in f["id"]:
            continue
        print(f"== {f['id']}: {f['title']}")
        for r in fams[f["id"]]:
            w = words.rule_words(r)
            print(f"  {r.where:48} {label(r)!r}  {shop_color(r) or ''}")
            print(f"      {w and w['item']} {'(shop)' if w and w['shop'] else ''}: {w and ' · '.join(w['when'])}")
        item = Item(data, dict(f["sample"], id=f["id"]))
        name_, desc, hits, stop = run_rules(rules, Model(item, formulas))
        print(f"  sample in the {item.place.lower()}; 280 rules it meets: {', '.join(h.where for h in hits)}")
        for line in tooltip(item, name_, desc):
            print("     | " + "".join(t for _, t in line))


def list_affixes(code, stat):
    data = Data()
    b = data.bases[code]
    sid = STAT_IDS.get(stat)
    m = re.fullmatch(r"(STAT|SK|TABSK|CLSK)(\d+)", stat)
    if m:
        sid = {"STAT": int(m.group(2)), "SK": 107, "TABSK": 188, "CLSK": 83}[m.group(1)]
    for a in data.affixes:
        if a["kind"] in ("rareprefix", "raresuffix") or not a["version"] or not fits(a, b["types"]):
            continue
        st = [s for m_ in a["mods"] for s in m_[5]]
        if any(s[0] == sid for s in st):
            print(f"{a['kind']:9} {a['name']:26} level {a['level']}-{a['maxlevel'] or ''} rare {a['rare']} "
                  f"group {a['group']} " + " ".join(f"{s[0]},{s[1]}={s[2]}-{s[3]}" for s in st))


STAT_IDS = {code: sid for sid, code in P.NAMED.items()}
STAT_IDS.update({"EDAM": 17, "EDEF": 16, "MINDMG": 21, "MAXDMG": 22, "SOCK": 194})


# ---------------------------------------------------------------- the inventory pictures (game files)

def pictures(folder):
    """tools/inv/<invfile>.png for every sample's base: the game's inventory picture (its DC6, the act 1 palette),
    transparent where the picture is."""
    import pd2_mpq
    d = Path(folder)
    mpqs = [pd2_mpq.MPQ(str(d / "ProjectD2" / n)) for n in ("pd2assets.mpq", "pd2data.mpq", "patch_d2.mpq")]
    mpqs += [pd2_mpq.MPQ(str(d / n)) for n in ("d2exp.mpq", "d2data.mpq")]

    def read(name):
        for m in mpqs:
            try:
                return m.read(name)
            except KeyError:
                pass
        raise KeyError(name)
    pal = read("data\\global\\palette\\ACT1\\pal.dat")
    data = Data()
    INV.mkdir(exist_ok=True)
    written = set()
    for f in FAMILIES:
        item = Item(data, dict(f["sample"], id=f["id"]))
        w, h, pixels = dc6_frame(read(f"data\\global\\items\\{item.base['invfile']}.dc6"))
        color = picture_color(item)
        if color:  # the base's inventory color map (InvTrans) for that color
            maps = read(f"data\\global\\items\\Palette\\{TRANSFORMS[num(item.base['InvTrans']) - 1]}.dat")
            k = TRANSFORM_COLORS.index(color) * 256
            pixels = {xy: maps[k + c] for xy, c in pixels.items()}
        rgba = bytearray(w * h * 4)
        for (x, y), c in pixels.items():
            p = (y * w + x) * 4
            rgba[p:p + 4] = bytes((pal[c * 3 + 2], pal[c * 3 + 1], pal[c * 3], 255))
        name = picture_name(item)
        png_rgba(INV / f"{name}.png", w, h, rgba)
        written.add(f"{name}.png")
        print(f"wrote tools/inv/{name}.png ({w} x {h})")
    for path in INV.glob("*.png"):
        if path.name not in written:  # a picture no sample uses any more
            path.unlink()
            print(f"removed tools/inv/{path.name}")


def dc6_frame(data):
    """(width, height, {(x, y): palette index}) of a DC6's first frame (an item's inventory picture)."""
    ptr = struct.unpack_from("<I", data, 24)[0]
    flip, w, h, _, _, _, _, length = struct.unpack_from("<iiiiiiii", data, ptr)
    pixels, i, end, x, y = {}, ptr + 32, ptr + 32 + length, 0, (0 if flip else h - 1)
    while i < end:
        b = data[i]
        i += 1
        if b == 0x80:
            x, y = 0, y + (1 if flip else -1)
        elif b & 0x80:
            x += b & 0x7F
        else:
            for k in range(b):
                pixels[(x + k, y)] = data[i + k]
            i += b
            x += b
    return w, h, pixels


def png_rgba(path, w, h, rgba):
    raw = b"".join(b"\x00" + bytes(rgba[y * w * 4:(y + 1) * w * 4]) for y in range(h))

    def chunk(kind, body):
        return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body))
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
                     + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="The Skill & Shop Highlights page, from the filter's own rules.")
    ap.add_argument("--check", action="store_true", help=f"exit 1 if {PAGE.name} is out of date")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--findings", action="store_true")
    ap.add_argument("--family", metavar="NAME")
    ap.add_argument("--affixes", nargs=2, metavar=("CODE", "STAT"))
    ap.add_argument("--pictures", metavar="DIABLO_II_FOLDER")
    args = ap.parse_args()
    if args.selftest:
        return selftest()
    if args.findings:
        return findings()
    if args.family:
        return show_family(args.family)
    if args.affixes:
        return list_affixes(*args.affixes)
    if args.pictures:
        return pictures(args.pictures)
    data, _ = page_data()
    text = page_text(data)
    current = PAGE.read_text(encoding="utf-8") if PAGE.exists() else ""
    if args.check:
        if current != text:
            print(f"{PAGE.name} is out of date: run python tools/shop_map.py (build.bat does)")
            sys.exit(1)
        print("skill & shop highlights page up to date")
        return
    if current != text:
        PAGE.write_text(text, encoding="utf-8", newline="\n")
        print(f"updated {PAGE.name} ({len(text) // 1024} KB)")
    cards = sum(len(s["cards"]) for s in data["sections"])
    print(f"skill & shop highlights page: {cards} families of highlights")


if __name__ == "__main__":
    main()
