#!/usr/bin/env python3
"""
The players' page of white (non-magic) armor and weapon bases: Erazure-Non-Magic-Bases.html. For every base, when
the filter tags it as a runeword base or notifies, shows it in its own way, and hides it, filter level by filter
level, read from the filter's own rules.

    python tools/base_map.py              writes Erazure-Non-Magic-Bases.html (build.bat and the hook run it)
    python tools/base_map.py --check      exit 1 if the page is out of date (CI)
    python tools/base_map.py --findings   what it could not put in words, and filter quirks it noticed (a rule
                                          that applies to no base; a minimap icon on an item a rule hides)
    python tools/base_map.py --base 7wn,uit   prints those bases' rows, with their rules (to check the wording)

How it reads the filter: every rule, with the aliases expanded as BH does, except the named runeword bases (RWB_*,
sections/205-white-runeword-bases.filter), which stay one word each, so a row can say "unless a Plague base".
Each rule is folded with what every fresh white drop has (normal quality, identified, on the ground outside town,
no runes, gems or corruption), then per base (its code, item groups, tier, size and most sockets) and per filter
level. A rule that stops the display (hides the item or shows it its own way) loses the cases an earlier rule with
another outcome already decided; tags and notifications are listed as they are (BH's notification pass does not
care whether the item is hidden). Low quality items (Cracked, Crude, Damaged) get rows of their own.

The page (the author's layout): one table per item type, one row per case. What is left of a rule's condition is
put in columns (Eth, Quality, ED, Sockets, Character level, then Class, Item level, All res, Skills, Other); an OR
that mixes columns becomes one row per case, and a tag's named base is put inline, its skill combinations in a
drop-down. Rows go Tag, Notify, Shows as, Hidden, each by levels, then eth, quality, ED, sockets and character level;
bases of one type, tier, socket maximum and size whose rows are the same share one group.
"""
import argparse
import json
import re
import sys
from collections import defaultdict
from functools import lru_cache
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402
import lint_filter as L  # noqa: E402
import tier_map as T  # noqa: E402

ROOT = build.ROOT
PAGE = ROOT / "Erazure-Non-Magic-Bases.html"  # the page for players (committed; the website shows it too)
TEMPLATE = ROOT / "tools" / "base_map_template.html"
SKILLS = ROOT / "docs" / "pd2-skills.tsv"
WIKI = ROOT / "docs" / "pd2-item-filtering.wiki"
NAMED = "RWB_"  # the named runeword bases (sections/205-white-runeword-bases.filter)
TAG_SECTIONS = ("sections/210-", "sections/220-")  # where the base tags are (other sections' layers are generic)
MAIN = "Erazure - Main"
KEEP_BASES = {"leg"}  # not spawnable, but drops white all the same (Wirt's Leg)
SKILL_MAX = 3  # white class items roll +1 to +3 to a skill or skill tab
CLASS_CODES = {"ama": "Amazon", "sor": "Sorceress", "nec": "Necromancer", "pal": "Paladin", "bar": "Barbarian",
               "dru": "Druid", "ass": "Assassin"}
CLASS_WORDS = {c.upper(): n for c, n in [("amazon", "Amazon"), ("assassin", "Assassin"), ("barbarian", "Barbarian"),
                                         ("druid", "Druid"), ("necromancer", "Necromancer"), ("paladin", "Paladin"),
                                         ("sorceress", "Sorceress")]}
DIFFS = ["Normal", "Nightmare", "Hell"]
# Item type -> category: the first match in the base's item types (class items first; throwing weapons before
# daggers and axes). The order of the page.
CATEGORIES = [("bowq", "Quivers"), ("xboq", "Quivers"), ("circ", "Circlets"), ("amaz", "Amazon Weapons"),
              ("assn", "Assassin Claws"), ("barb", "Barbarian Helms"), ("sorc", "Sorceress Orbs"),
              ("drui", "Druid Pelts"), ("necr", "Necromancer Heads"), ("ashd", "Paladin Shields"), ("tors", "Chests"),
              ("belt", "Belts"), ("boot", "Boots"), ("glov", "Gloves"), ("helm", "Helms"), ("shld", "Shields"),
              ("jave", "Javelins"), ("tkni", "Throwing Weapons"), ("taxe", "Throwing Weapons"), ("bow", "Bows"),
              ("xbow", "Crossbows"), ("knif", "Daggers"), ("axe", "Axes"), ("hamm", "Hammers"),
              ("club", "Maces and Clubs"), ("mace", "Maces and Clubs"), ("pole", "Polearms"), ("spea", "Spears"),
              ("scep", "Scepters"), ("staf", "Staves"), ("swor", "Swords"), ("wand", "Wands")]
ORDER = ["Chests", "Helms", "Circlets", "Shields", "Gloves", "Boots", "Belts", "Barbarian Helms", "Druid Pelts",
         "Necromancer Heads", "Paladin Shields", "Axes", "Bows", "Crossbows", "Daggers", "Javelins",
         "Throwing Weapons", "Maces and Clubs", "Hammers", "Polearms", "Spears", "Scepters", "Staves", "Swords",
         "Wands", "Assassin Claws", "Sorceress Orbs", "Amazon Weapons", "Quivers"]
TIER_NAMES = {"normal": "Normal", "exceptional": "Exceptional", "elite": "Elite"}
GENERIC_TAGS = {"Eth", "Sup", "Inf", "*", ""}  # 220's layers for every white item, not a base's own tag
WORD_RE = re.compile(r"[A-Za-z][A-Za-z' ]*[A-Za-z]|[A-Za-z]")


def category(base):
    types = set(base["types"])
    for t, cat in CATEGORIES:
        if t in types:
            return cat
    return None


# ---------------------------------------------------------------- the filter, named bases kept

class Rule:
    __slots__ = ("n", "where", "cond", "rpn", "raw", "name", "cont", "notify", "sound", "tier", "icons", "kind",
                 "tag", "display", "tree", "codes", "named", "words", "keys")


def load_filter():
    """(rules, {RWB name: its condition}, Main's toggle values): the rules with every alias but the named bases
    expanded, BH's way."""
    parts, _ = build.read_sections(check=True)
    where = build.line_locator(parts)
    _, season, date = build.load_version()
    joined = b"".join(d for _, d in parts).replace(build.PLACEHOLDER, build.version_text(season, date).encode())
    lines = joined.split(b"\r\n")
    blocks = build.find_toggle_blocks(lines)
    toggles = {}
    for i in blocks[MAIN]:
        m = build.ALIAS_RE.match(lines[i])
        toggles[m.group(3).decode()] = int(m.group(2).endswith(b"TRUE"))
    off = {i for idxs in blocks.values() for i in idxs}
    text = [("//" if i in off and not line.startswith(b"//") else "") + line.decode("utf-8")
            for i, line in enumerate(lines)]
    lt = L.Linter(text, where, False)
    named = {k: v for k, v in lt.aliases.items() if k.startswith(NAMED)}
    others = {k: v for k, v in lt.aliases.items() if not k.startswith(NAMED)}
    for k in others:  # an alias name inside a named base's name would be replaced in it
        assert not any(k in n for n in named), (k, "is part of a named base's name")
    rules = []
    for n, r in enumerate(lt.rules):
        rule = Rule()
        rule.n, rule.where = n, where(r.idx)
        rule.cond = islands(T.expand_condition(r.cond, others))
        rule.rpn = T.compile_rpn(rule.cond)
        rule.raw = r.output
        rule.name, rule.cont, rule.notify, rule.sound, rule.tier, rule.icons = T.parse_output(r.output, lt.aliases)
        rules.append(rule)
    return rules, {k: islands(T.expand_condition(v, others)) for k, v in named.items()}, toggles, f"{season} - {date}"


FORMULAS = []  # FX<n> -> the formula island's text


def islands(cond):
    """cond with each $f(...) island replaced by a word FX<n> (FORMULAS[n] is its text)."""
    for a, b in reversed(L.formula_ranges(cond)):
        text = cond[a:b]
        if text not in FORMULAS:
            FORMULAS.append(text)
        cond = cond[:a] + f" FX{FORMULAS.index(text)} " + cond[b:]
    return cond


def literal_text(name):
    """A rule's name output without %NAME%, keywords and color codes: the words it adds."""
    return re.sub(r"%[A-Z_]+%", "", name.replace("%NAME%", "")).strip()


def classify(rules):
    """Each rule's kind for white items: hide / show (stops with a display of its own) / tag (a base's own tag) /
    layer (anything else that continues) / last (the catch-all)."""
    for r in rules:
        r.tag, r.display = None, None
        if not r.cont:
            look = T.look_of(r.raw, r.name)
            r.kind = "hide" if look == "HIDDEN" else "show"
            r.display = r.name
        else:
            words = literal_text(r.name)
            if r.where.startswith(TAG_SECTIONS) and words not in GENERIC_TAGS and WORD_RE.search(words):
                r.kind, r.tag = "tag", words
            else:
                r.kind = "layer"
    rules[-1].kind = "last"


# ---------------------------------------------------------------- folding

def white_atom(toggles):
    """What every fresh white drop has: 1 / 0, or None for a word that depends on the base or the case."""
    def atom(word):
        if word in toggles:
            return toggles[word]
        if word in ("TRUE", "FALSE"):
            return int(word == "TRUE")
        if word in T.QUALITIES:
            return int(word == "NMAG")
        if word in ("ID", "GROUND"):
            return 1
        if word in T.OTHER_PLACES or word in ("RW", "GEMMED"):
            return 0
        if word in ("ALLDISCOVERED", "ANYDISCOVERED"):
            return 1
        m = T.COMPARE_RE.match(word)
        if m:
            key = m.group(1)
            if key == "MAPID":
                return T.compare(T.FIELD_ID, m)  # outside town (hidden items always show in town)
            if key == "MAPTIER":
                return T.compare(-1, m)
            if key in ("RUNE", "GEMLEVEL", "GEMTYPE", "GOLD"):
                return 0  # false for anything that is not a rune, gem or gold (as tier_map.kind_atom)
            if key == "STAT360":
                return T.compare(0, m)  # not corrupted
        return None
    return atom


class Base:
    def __init__(self, code, info):
        self.code, self.info = code, info
        self.name, self.tier = info["name"], info["tier"]
        self.cat = category(info)
        types = set(info["types"])
        self.groups = T.item_groups(types)
        if self.tier in T.TIER_GROUP:
            self.groups.add(T.TIER_GROUP[self.tier])
        self.sockets = info["sockets"]
        self.area = info["width"] * info["height"]

    def atom(self, inf):
        """Words this base (and low quality or not) decides."""
        def atom(word):
            if word == "INF":
                return inf
            if inf and word == "SUP":
                return 0
            if word in T.GROUP_WORDS or word in T.TIER_GROUP.values():
                return int(word in self.groups)
            m = T.COMPARE_RE.match(word)
            if m:
                key = m.group(1)
                if key == "AREA":
                    return T.compare(self.area, m)
                if inf and key == "ED":
                    return T.compare(0, m)
                if key == "RES" and "DIN" not in self.groups:
                    return T.compare(0, m)  # only paladin shields have resistances as white items
                return None
            if T.is_code(word):
                return int(word == self.code)
            return None
        return atom


def level_atom(level):
    def atom(word):
        m = T.COMPARE_RE.match(word)
        if m and m.group(1) == "FILTLVL":
            return T.compare(level, m)
        return None
    return atom


# ---------------------------------------------------------------- conditions: sets of values, simplified

BIG = 10 ** 9
DOMAINS = {"CLVL": (1, 99), "ILVL": (1, 120), "DIFF": (0, 2), "ED": (0, 1000), "SELLPRICE": (0, BIG),
           "RES": (-300, 300), "QTY": (0, 1000)}
SKILL_KEY = re.compile(r"^(SK|OS|TABSK|CLSK)(\d+)$")


def domain(key, base):
    if key == "SOCK":
        return (0, base.sockets)
    if key in DOMAINS:
        return DOMAINS[key]
    if SKILL_KEY.match(key) or key == "ALLSK":
        return (0, SKILL_MAX)
    return (-BIG, BIG)


def clip(iv, dom):
    out = []
    for a, b in iv:
        a, b = max(a, dom[0]), min(b, dom[1])
        if a <= b:
            out.append((a, b))
    return out


def norm(iv):
    out = []
    for a, b in sorted(iv):
        if out and a <= out[-1][1] + 1:
            out[-1] = (out[-1][0], max(out[-1][1], b))
        else:
            out.append((a, b))
    return out


def inter(x, y):
    out = []
    for a, b in x:
        for c, d in y:
            lo, hi = max(a, c), min(b, d)
            if lo <= hi:
                out.append((lo, hi))
    return norm(out)


def comp(x, dom):
    out, lo = [], dom[0]
    for a, b in norm(x):
        if a > lo:
            out.append((lo, a - 1))
        lo = b + 1
    if lo <= dom[1]:
        out.append((lo, dom[1]))
    return out


def word_set(m, dom):
    op, a, b = m.group(2), int(m.group(3)), m.group(4)
    iv = {"<": [(dom[0], a - 1)], ">": [(a + 1, dom[1])], "=": [(a, a)]}.get(op) or [(a, int(b))]
    return norm(clip(iv, dom))


class Simplifier:
    """Trees as ("c", v) / ("w", word) / ("not", x) / ("and", kids) / ("or", kids) / ("set", key, intervals) /
    ("bool", word, value). A comparison becomes the set of values it allows; ANDs and ORs merge those per key and
    drop what their context already decides."""

    def __init__(self, base):
        self.base = base

    def nary(self, node):
        k = node[0]
        if k == "c":
            return node
        if k == "w":
            m = T.COMPARE_RE.match(node[1])
            if m:
                key = m.group(1)
                return ("set", key, tuple(word_set(m, domain(key, self.base))))
            return ("bool", node[1], True)
        if k == "not":
            return self.negate(self.nary(node[1]))
        kids = []
        for x in node[1:]:
            x = self.nary(x)
            kids.extend(x[1] if x[0] == k else [x])
        return (k, tuple(kids))

    def negate(self, x):
        k = x[0]
        if k == "c":
            return ("c", 1 - x[1])
        if k == "set":
            return ("set", x[1], tuple(comp(x[2], domain(x[1], self.base))))
        if k == "bool":
            return ("bool", x[1], not x[2])
        if k == "not":
            return x[1]
        return ("not", x)

    @staticmethod
    def literal(x):
        return x[0] in ("set", "bool")

    def merge(self, ctx, x):
        """ctx with literal x added; None if they contradict."""
        ctx = dict(ctx)
        if x[0] == "bool":
            if ctx.get(("b", x[1]), x[2]) != x[2]:
                return None
            ctx[("b", x[1])] = x[2]
        else:
            key = ("s", x[1])
            cur = ctx.get(key, tuple([domain(x[1], self.base)]))
            new = tuple(inter(cur, x[2]))
            if not new:
                return None
            ctx[key] = new
        return ctx

    def implied(self, ctx, x):
        if x[0] == "bool":
            return ctx.get(("b", x[1])) == x[2]
        cur = ctx.get(("s", x[1]))
        if cur is None:
            return list(x[2]) == [domain(x[1], self.base)]
        return list(inter(cur, x[2])) == list(cur)

    def simplify(self, node, ctx=None):
        ctx = {} if ctx is None else ctx
        k = node[0]
        if k == "c":
            return node
        if self.literal(node):
            if k == "set" and not node[2]:
                return ("c", 0)
            if k == "set" and list(node[2]) == [domain(node[1], self.base)]:
                return ("c", 1)
            if self.implied(ctx, node):
                return ("c", 1)
            if self.merge(ctx, node) is None:
                return ("c", 0)
            return node
        if k == "not":
            x = self.simplify(node[1], ctx)
            return self.negate(x) if x[0] in ("c", "set", "bool") else ("not", x)
        if k == "and":
            return self.simplify_and(node[1], ctx)
        return self.simplify_or(node[1], ctx)

    def simplify_and(self, kids, ctx):
        todo, local = list(kids), dict(ctx)
        lits, others = {}, []
        for _ in range(4):  # a complex part may simplify into a literal: merge it and look again
            again = []
            for x in todo:
                if self.literal(x):
                    local2 = self.merge(local, x)
                    if local2 is None:
                        return ("c", 0)
                    local = local2
                    key = ("b", x[1]) if x[0] == "bool" else ("s", x[1])
                    lits[key] = True
                else:
                    again.append(x)
            others, changed = [], False
            for x in again:
                s = self.simplify(x, local)
                if s == ("c", 0):
                    return s
                if s == ("c", 1):
                    changed = True
                    continue
                if self.literal(s):
                    changed = True
                    local2 = self.merge(local, s)
                    if local2 is None:
                        return ("c", 0)
                    local = local2
                    lits[("b", s[1]) if s[0] == "bool" else ("s", s[1])] = True
                    continue
                others.append(s)
            todo = others
            if not changed:
                break
        out = []
        ors = [x for x in others if x[0] == "or"]
        for key in lits:
            if local.get(key) == ctx.get(key):
                continue  # the context says so already
            lit = ("bool", key[1], local[key]) if key[0] == "b" else ("set", key[1], tuple(local[key]))
            if lit[0] == "set" and list(lit[2]) == [domain(key[1], self.base)]:
                continue
            if any(all(self.implied(self.facts(b), lit) for b in o[1]) for o in ors):
                continue  # every case of an OR here says so too: CLVL<90 with "below 60 (80 for a Necromancer)"
            out.append(lit)
        out += others
        return self.make("and", out)

    def simplify_or(self, kids, ctx):
        out = []
        for x in kids:
            s = self.simplify(x, ctx)
            if s == ("c", 1):
                return s
            if s == ("c", 0):
                continue
            out.extend(s[1] if s[0] == "or" else [s])
        sets, bools, rest = {}, {}, []
        for x in out:
            if x[0] == "set":
                sets[x[1]] = tuple(norm(list(sets.get(x[1], ())) + list(x[2])))
            elif x[0] == "bool":
                if bools.get(x[1], x[2]) != x[2]:
                    return ("c", 1)
                bools[x[1]] = x[2]
            else:
                rest.append(x)
        merged = []
        for key, iv in sets.items():
            node = self.simplify(("set", key, iv), ctx)
            if node == ("c", 1):
                return node
            if node != ("c", 0):
                merged.append(node)
        merged += [("bool", w, v) for w, v in bools.items()]
        return self.make("or", merged + rest)

    @staticmethod
    def make(k, kids):
        kids = list({canon(x): x for x in kids}.values())
        if not kids:
            return ("c", 1 if k == "and" else 0)
        if len(kids) == 1:
            return kids[0]
        return (k, tuple(kids))  # the filter's own order (canon() sorts, for comparing)

    # ---- one rule's cases minus another's
    def facts(self, node):
        ctx = {}
        for x in (node[1] if node[0] == "and" else [node]):
            if self.literal(x):
                ctx = self.merge(ctx, x) or ctx
        return ctx

    def subtract(self, a, b):
        """a and not b, kept readable: b's parts a already has are left out."""
        if a == ("c", 0) or b == ("c", 0):
            return a
        if b == ("c", 1):
            return ("c", 0)
        if b[0] == "or":
            for x in b[1]:
                a = self.subtract(a, x)
            return a
        fa = self.facts(a)
        mine = {canon(y) for y in (a[1] if a[0] == "and" else [a])}
        rest = []
        for x in (b[1] if b[0] == "and" else [b]):
            if self.literal(x):
                if self.merge(fa, x) is None:
                    return a  # they never meet
                if self.implied(fa, x):
                    continue
            elif canon(x) in mine:
                continue  # a has the same part
            rest.append(x)
        if not rest:
            return ("c", 0)
        neg = self.negate(rest[0]) if len(rest) == 1 else ("not", self.make("and", rest))
        kids = list(a[1]) if a[0] == "and" else [a]
        return self.simplify(("and", tuple(kids + [neg])))

    def implies(self, a, b):
        """True when every case of a is a case of b (b's parts are a's, or follow from a's values)."""
        if a == ("c", 0) or b == ("c", 1):
            return True
        if b == ("c", 0):
            return False
        if b[0] == "or":
            return any(self.implies(a, x) for x in b[1])
        fa, mine = self.facts(a), {canon(y) for y in conj(a)}
        parts = conj(b)
        if not all(self.implied(fa, x) for x in parts if self.literal(x)):
            return False  # (the cheap test first)
        for x in parts:
            if not self.literal(x) and canon(x) not in mine and self.simplify(x, fa) != ("c", 1):
                return False  # (a part a does not have, and a's values do not make true)
        return True

    def meet(self, a, b):
        """False when a and b can never both be true (their literals say so)."""
        if a == ("c", 0) or b == ("c", 0):
            return False
        fa = self.facts(a)
        for x in (b[1] if b[0] == "and" else [b]):
            if self.literal(x) and self.merge(fa, x) is None:
                return False
        return True


@lru_cache(maxsize=None)
def canon(x):
    k = x[0]
    if k == "c":
        return f"#{x[1]}"
    if k == "bool":
        return ("" if x[2] else "!") + x[1]
    if k == "set":
        return f"{x[1]}{list(x[2])}"
    if k == "not":
        return "!(" + canon(x[1]) + ")"
    return f"{k}(" + ",".join(sorted(canon(y) for y in x[1])) + ")"


# ---------------------------------------------------------------- plain words

def load_skills():
    names, cls = {}, {}
    for line in SKILLS.read_text(encoding="utf-8").splitlines()[3:]:
        sid, name, c = (line.split("\t") + ["", ""])[:3]
        names[int(sid)], cls[int(sid)] = name, c
    return names, cls


def load_tabs():
    """{TABSK number: (class, tab name)} from the wiki's table."""
    out = {}
    for line in WIKI.read_text(encoding="utf-8").splitlines():
        m = re.match(r"\|\s*TABSK(\d+)\s*\|\|\s*([^|]+?)\s*\|\|\s*(.+?)\s*$", line)
        if m:
            out[int(m.group(1))] = (m.group(2), m.group(3).split("|")[-1].strip())
    return out


def join_or(items, word="or"):
    items = list(items)
    if len(items) <= 1:
        return "".join(items)
    return ", ".join(items[:-1]) + f" {word} " + items[-1]


def runs(iv):
    """[(0, 0), (3, 4)] -> [0, 3, 4] for small sets, else None."""
    total = sum(b - a + 1 for a, b in iv)
    return [v for a, b in iv for v in range(a, b + 1)] if total <= 8 else None


def money(n):
    return f"{n:,}"


def article(word):
    return ("an " if word[:1] in "AEIOU" else "a ") + word


def conj(x):
    return list(x[1]) if x[0] == "and" else [x]


def is_complex(text):
    return any(s in text for s in (", ", " with ", " and ", "(", "; "))


COLS = ["eth", "quality", "ed", "sockets", "clvl", "class", "ilvl", "res", "skills", "other"]  # the page's columns
SET_COLS = {"ED": "ed", "SOCK": "sockets", "CLVL": "clvl", "ILVL": "ilvl", "RES": "res"}
KIND_ORDER = {"tag": 0, "notify": 1, "show": 2, "hide": 3}


def has_skill(x):
    """A skill, named base or formula anywhere in x: the Skills column's."""
    k = x[0]
    if k == "set":
        return bool(SKILL_KEY.match(x[1]))
    if k == "bool":
        return x[1].startswith((NAMED, "FX"))
    if k == "not":
        return has_skill(x[1])
    if k in ("and", "or"):
        return any(has_skill(y) for y in x[1])
    return False


class Words:
    """Conditions in plain words. A clause list is what must all hold; an OR becomes "A or B", "either A; or B" at
    the top, "(A) or (B)" inside. On the page each column gets its part of a row (cell())."""

    RANK = {"ETH": 0, "SUP": 1, "ED": 2, "SOCK": 3, "ILVL": 4, "CLVL": 5, "CLASS": 6, "DIFF": 7, "SELLPRICE": 8,
            "RES": 9, "QTY": 9, "SKILL": 10, "NAMED": 11, "OTHER": 12, "UNLESS": 20}

    def __init__(self, skills, tabs, named_tags):
        self.skill_names, self.skill_class = skills
        self.tabs = tabs
        self.named = named_tags  # RWB name -> tag word
        self.refs = {}  # "@<rule>" -> the display that rule shows instead ("($)")
        self.class_skills = defaultdict(set)
        for sid, c in self.skill_class.items():
            if c in CLASS_CODES:
                self.class_skills[c].add(sid)
        self.unknown = defaultdict(set)  # word -> where it was left as it is

    # ---- a set of values of one key
    @staticmethod
    def span(iv, dom, below, plus, between, one):
        out = []
        for a, b in iv:
            if a == b:
                out.append(one.format(a))
            elif a == dom[0]:
                out.append(below.format(b + 1))
            elif b == dom[1]:
                out.append(plus.format(a))
            else:
                out.append(between.format(a, b))
        return join_or(out)

    def set_words(self, key, iv, base, where):
        dom = domain(key, base)
        if key == "SOCK":  # a list, or a range: never "1+"
            vals = runs(iv)
            if vals is not None and (len(vals) <= 3 or vals != list(range(vals[0], vals[-1] + 1))):
                return join_or(map(str, vals)) + (" socket" if vals == [1] else " sockets")
            return join_or(f"{a}–{b}" if a != b else str(a) for a, b in iv) + " sockets"
        if key == "CLVL":  # the author's words: above level 89 (the rule's CLVL>89) / below level 60 / levels 30–59
            return join_or(f"level {a}" if a == b else f"below level {b + 1}" if a == dom[0] else
                           f"above level {a - 1}" if b == dom[1] else f"levels {a}–{b}" for a, b in iv)
        if key == "ILVL":
            return self.span(iv, dom, "item level below {}", "item level {}+", "item level {}–{}", "item level {}")
        if key == "ED":
            return self.span(iv, dom, "under {}% ED", "{}%+ ED", "{}–{}% ED", "{}% ED")
        if key == "DIFF":
            return "in " + join_or(DIFFS[v] for v in runs(iv) or [])
        if key == "SELLPRICE":
            return "sells for " + join_or(
                f"under {money(b + 1)}" if a == dom[0] else f"{money(a)}+" if b == dom[1] else
                f"{money(a)}–{money(b)}" for a, b in iv) + " gold"
        if key == "RES":
            return self.span(iv, dom, "under {} all resistances", "{}+ all resistances", "{}–{} all resistances",
                             "{} all resistances")
        if key == "QTY":
            return self.span(iv, dom, "quantity under {}", "quantity {}+", "quantity {}–{}", "quantity {}")
        if SKILL_KEY.match(key):
            return self.skills([(key, iv)])
        self.unknown[key].add(where)
        return f"{key} " + " or ".join(f"{a}" if a == b else f"{a}–{b}" for a, b in iv)

    # ---- skills
    def skill_name(self, key):
        m = SKILL_KEY.match(key)
        kind, n = m.group(1), int(m.group(2))
        if kind in ("SK", "OS"):
            return self.skill_names.get(n, f"skill {n}") + (" (oskill)" if kind == "OS" else "")
        if kind == "TABSK":
            c, tab = self.tabs.get(n, ("", f"skill tab {n}"))
            return f"{tab} ({c})" if c else tab
        names = ["Amazon", "Sorceress", "Necromancer", "Paladin", "Barbarian", "Druid", "Assassin"]
        return f"{names[n]} skills" if n < len(names) else f"class {n} skills"

    @staticmethod
    def amount(iv):
        if iv == [(0, 0)]:
            return "no +"
        out = []
        for a, b in iv:
            out.append(f"+{a}" if a == b else f"+{a}–{b}" if a else f"under +{b + 1}")
        return " or ".join(out)

    def skills(self, items, word="and"):
        """[(key, iv)] -> "+3 Teeth and +1–3 Bone Armor"; one amount once: "+3 Teeth or Bone Spear"."""
        by = defaultdict(list)
        for key, iv in items:
            by[self.amount(list(iv))].append(self.skill_name(key))
        return f" {word} ".join(f"{amount} " + join_or(names, word) if amount != "no +" else
                                "no + to " + join_or(names, word) for amount, names in by.items())

    def any_class(self, items):
        """'+3 to any Necromancer skill' when the skills are (nearly) all of one class's, others named after."""
        ids = {}
        for key, iv in items:
            m = SKILL_KEY.match(key)
            if not m or m.group(1) != "SK":
                return None
            ids[int(m.group(2))] = tuple(iv)
        for c, skills in self.class_skills.items():
            if set(ids) <= skills and len(ids) >= max(10, 0.8 * len(skills)):
                common = max(set(ids.values()), key=lambda v: sum(1 for x in ids.values() if x == v))
                odd = [(f"SK{i}", v) for i, v in ids.items() if v != common]
                text = f"{self.amount(list(common))} to any {CLASS_CODES[c]} skill"
                odd_text = ", ".join(f"{self.skill_name(k)}: {self.amount(list(v))}" for k, v in odd)
                return text + (f" ({odd_text})" if odd else "")
        return None

    # ---- whole conditions
    def rank(self, x):
        if x[0] == "bool":
            w, v = x[1], x[2]
            if w in ("ETH", "SUP"):
                return self.RANK[w]
            if w in CLASS_WORDS:
                return self.RANK["CLASS"]
            if w.startswith(NAMED):
                return self.RANK["NAMED"] if v else self.RANK["UNLESS"]
            if w.startswith("@"):
                return self.RANK["UNLESS"] + 1
            return self.RANK["OTHER"]
        if x[0] == "set":
            return self.RANK["SKILL"] if SKILL_KEY.match(x[1]) else self.RANK.get(x[1], self.RANK["OTHER"])
        if x[0] == "not":
            return self.RANK["UNLESS"]
        if x[0] == "or" and all(self.skillish(y) for y in x[1]):
            return self.RANK["SKILL"]
        return self.RANK["OTHER"]

    def skillish(self, x):
        if x[0] == "set":
            return bool(SKILL_KEY.match(x[1]))
        if x[0] in ("and", "or"):
            return all(self.skillish(y) for y in x[1])
        return False

    @staticmethod
    def classes(names, yes):
        text = join_or(article(CLASS_WORDS[c]) for c in names)
        return ("playing " if yes else "not playing ") + text

    def named_words(self, names):
        tags = []
        for n in names:
            t = self.named.get(n, n)
            if t not in tags:
                tags.append(t)
        return article(join_or(tags)) + " base"

    def clauses(self, node, base, where, depth=0):
        """The parts of an AND (or one condition), each a short clause, in a fixed order."""
        if node[0] == "c":
            return [] if node[1] else ["never"]
        kids = sorted(conj(node), key=self.rank)
        out = []
        cin = [x[1] for x in kids if x[0] == "bool" and x[1] in CLASS_WORDS and x[2]]
        cout = [x[1] for x in kids if x[0] == "bool" and x[1] in CLASS_WORDS and not x[2]]
        skill_lits = [(x[1], x[2]) for x in kids if x[0] == "set" and SKILL_KEY.match(x[1])]
        named_out, refs, skill_parts = [], [], []
        if skill_lits:
            skill_parts.append(self.skills(skill_lits))
        for x in kids:
            if x[0] == "bool" and x[1] in CLASS_WORDS:
                if x[1] == (cin or cout)[0]:
                    if cin:
                        out.append(self.classes(cin, True))
                    if cout:
                        out.append(self.classes(cout, False))
                continue
            if x[0] == "set" and SKILL_KEY.match(x[1]):
                if skill_parts and skill_parts[0] not in out and not any(p in out for p in skill_parts):
                    out.append(skill_parts[0])
                continue
            if x[0] == "bool" and x[1].startswith(NAMED) and not x[2]:
                named_out.append(x[1])
                continue
            if x[0] == "not" and x[1][0] == "or" and all(y[0] == "bool" and y[1].startswith(NAMED) and y[2]
                                                         for y in x[1][1]):
                named_out += [y[1] for y in x[1][1]]
                continue
            if x[0] == "bool" and x[1].startswith("@"):
                refs.append(f"except when it shows as {self.refs.get(x[1], x[1])}")
                continue
            if x[0] == "or" and self.skillish(x):
                text = self.phrase(x, base, where, depth + 1)
                if out and out[-1] in skill_parts:
                    out[-1] = out[-1] + (", with " if is_complex(text) else " with ") + text
                else:
                    out.append(text)
                    skill_parts.append(text)
                continue
            out.append(self.phrase(x, base, where, depth + 1))
        if named_out:
            out.append("unless " + self.named_words(named_out))
        return [c for c in out if c] + refs

    def phrase(self, x, base, where, depth=0):
        k = x[0]
        if k == "c":
            return "always" if x[1] else "never"
        if k == "set":
            return self.set_words(x[1], list(x[2]), base, where)
        if k == "bool":
            w, v = x[1], x[2]
            if w == "ETH":
                return "ethereal" if v else "not ethereal"
            if w == "SUP":
                return "superior" if v else "not superior"
            if w == "INF":
                return "low quality" if v else "not low quality"
            if w in CLASS_WORDS:
                return self.classes([w], v)
            if w.startswith(NAMED):
                return self.named_words([w]) if v else "unless " + self.named_words([w])
            if w.startswith("@"):
                return ("shows as " if v else "except when it shows as ") + self.refs.get(w, w)
            f = self.formula(w, base, where)
            if f:
                return f if v else f"unless {f}"
            self.unknown[w].add(where)
            return w if v else f"not {w}"
        if k == "not":
            inner = x[1]
            if inner[0] == "or" and all(y[0] == "set" and SKILL_KEY.match(y[1]) for y in inner[1]):
                anyc = self.any_class([(y[1], list(y[2])) for y in inner[1]])
                if anyc:
                    return "without " + anyc
            if inner[0] == "and":  # "unless ethereal with 15%+ ED and 0 or 3 sockets", "... (levels 30–69)"
                lv = [y for y in inner[1] if y[0] == "set" and y[1] == "CLVL"]
                rest = Simplifier.make("and", [y for y in inner[1] if not (y[0] == "set" and y[1] == "CLVL")])
                parts = self.clauses(rest, base, where, depth + 1) if rest != ("c", 1) else []
                if not parts:
                    return "unless " + self.phrase(inner, base, where, depth + 1)
                text = "unless " + parts[0] + (" with " + " and ".join(parts[1:]) if parts[1:] else "")
                return text + (f" ({self.set_words('CLVL', list(lv[0][2]), base, where)})" if lv else "")
            return "unless " + self.phrase(inner, base, where, depth + 1)
        if k == "and":
            parts = self.clauses(x, base, where, depth)
            return ", ".join(parts)
        # an OR
        kids = list(x[1])
        split = self.class_split(kids, base, where)
        if split:
            return split
        items = []  # (text, whether it needs brackets among others)
        lits = [(y[1], list(y[2])) for y in kids if y[0] == "set" and SKILL_KEY.match(y[1])]
        if lits:
            text = self.any_class(lits) or self.skills(lits, "or")
            items.append((text, " and " in text or " with " in text))
        cls = [y[1] for y in kids if y[0] == "bool" and y[1] in CLASS_WORDS and y[2]]
        if cls:
            items.append((self.classes(cls, True), False))
        names = [y[1] for y in kids if y[0] == "bool" and y[1].startswith(NAMED) and y[2]]
        if names:
            items.append((self.named_words(names), False))
        for y in kids:
            if (y[0] == "set" and SKILL_KEY.match(y[1])) or (y[0] == "bool" and y[2] and (
                    y[1] in CLASS_WORDS or y[1].startswith(NAMED))):
                continue
            text = self.phrase(y, base, where, depth + 1)
            items.append((text, is_complex(text) and y[0] != "set"))
        if len(items) == 1:
            return items[0][0]
        if not any(c for _, c in items):
            texts = [t for t, _ in items]
            if any(", " in t for t in texts):  # lists inside: "A, B or C, or below level 95"
                return ", ".join(texts[:-1]) + ", or " + texts[-1]
            return join_or(texts)
        if depth == 0:
            return "either " + "; or ".join(t for t, _ in items)
        return " or ".join(f"({t})" if c else t for t, c in items)

    @staticmethod
    def split_parts(kids):
        """(!NECROMANCER CLVL<60) OR (NECROMANCER CLVL<80) -> (the others' value, the class word, its value)."""
        if len(kids) != 2 or any(k[0] != "and" or len(k[1]) != 2 for k in kids):
            return None
        parts = []
        for k in kids:
            c = [y for y in k[1] if y[0] == "bool" and y[1] in CLASS_WORDS]
            v = [y for y in k[1] if y[0] == "set"]
            if len(c) != 1 or len(v) != 1:
                return None
            parts.append((c[0], v[0]))
        (c1, v1), (c2, v2) = parts
        if c1[1] != c2[1] or c1[2] == c2[2] or v1[1] != v2[1]:
            return None
        (_, other), (cls, mine) = sorted(parts, key=lambda p: p[0][2])
        return other, cls[1], mine

    def class_split(self, kids, base, where):
        """(!NECROMANCER CLVL<60) OR (NECROMANCER CLVL<80) -> "below level 60 (80 for a Necromancer)"."""
        found = self.split_parts(kids)
        if not found:
            return None
        other, cls, mine = found
        nums = re.findall(r"\d[\d,]*", self.phrase(mine, base, where, 1))
        mine_text = nums[0] if len(nums) == 1 and mine[1] == "CLVL" else self.phrase(mine, base, where, 1)
        return f"{self.phrase(other, base, where, 1)} ({mine_text} for {article(CLASS_WORDS[cls])})"

    def formula(self, w, base, where):
        fx = re.match(r"^FX(\d+)$", w)
        w = FORMULAS[int(fx.group(1))] if fx else w
        m = re.match(r"^\$f\(COUNT\((.*)\)\s*>=\s*(\d+)\)$", w)
        if not m:
            return None
        words = []
        for p in (p.strip() for p in m.group(1).split(",")):
            mm = T.COMPARE_RE.match(p)
            if not mm:
                return None
            words.append(self.set_words(mm.group(1), word_set(mm, domain(mm.group(1), base)), base, where))
        return f"at least {m.group(2)} of: " + join_or(words)

    def choices(self, node, base, where):
        """A named base's condition: (the parts all its cases have, [each case in words]) when it is a choice of
        several, else (its parts, [])."""
        ors = [y for y in conj(node) if y[0] == "or"]
        several = (lambda o: any(y[0] in ("and", "or", "not") for y in o[1]))  # a case of more than one part
        if node[0] == "or" and several(node):
            branches, common = list(node[1]), []
        elif node[0] != "or" and len(ors) == 1 and several(ors[0]):
            branches, common = list(ors[0][1]), [y for y in conj(node) if y is not ors[0]]
        else:
            return conj(node), []
        shared = None  # what every case has: said once
        for b in branches:
            keys = {canon(y): y for y in conj(b)}
            shared = keys if shared is None else {k: v for k, v in shared.items() if k in keys}
        head = common + list((shared or {}).values())
        cases = []
        for b in branches:
            rest = [y for y in conj(b) if canon(y) not in (shared or {})]
            cases.append(", ".join(self.clauses(Simplifier.make("and", rest), base, where, 1)) or "nothing more")
        return head, cases

    # ---- the page's columns
    def column(self, x):
        """The column a part of a row's condition goes to."""
        if has_skill(x):
            return "skills"
        k = x[0]
        if k == "bool":
            return {"ETH": "eth", "SUP": "quality"}.get(x[1]) or ("class" if x[1] in CLASS_WORDS else "other")
        if k == "set":
            return SET_COLS.get(x[1], "other")
        if k == "or" and self.split_parts(list(x[1])):
            return "clvl"
        if k == "or" and all(y[0] == "bool" and y[1] in CLASS_WORDS and y[2] for y in x[1]):
            return "class"
        return "other"

    def splittable(self, x):
        """An OR whose branches go to different columns: one row per branch ((ED<19 OR SOCK=2): two rows)."""
        if x[0] != "or" or has_skill(x) or self.column(x) != "other":
            return False
        return not any(y[0] == "bool" and y[1].startswith("@") for y in x[1])

    def cell(self, col, parts, base, where):
        """One column's parts of a row in the column's own short words."""
        if col == "eth":
            return "eth" if parts[0][2] else "non-eth"
        if col == "quality":
            return "superior" if parts[0][2] else "nonsuperior"
        if col == "class":
            yes = [x[1] for x in parts if x[0] == "bool" and x[2]]
            no = [x[1] for x in parts if x[0] == "bool" and not x[2]]
            out = [join_or(CLASS_WORDS[c] for c in yes)] if yes else []
            out += [join_or(CLASS_WORDS[y[1]] for y in x[1]) for x in parts if x[0] == "or"]
            if no:
                out.append("not " + join_or(CLASS_WORDS[c] for c in no))
            return " · ".join(out)
        if col == "clvl":
            text = " · ".join(self.set_words("CLVL", list(x[2]), base, where) if x[0] == "set" else
                              self.class_split(list(x[1]), base, where) for x in parts)
            return text[:1].upper() + text[1:]
        if col == "ilvl":
            return self.span(list(parts[0][2]), domain("ILVL", base), "below {}", "{}+", "{}–{}", "{}")
        if col == "res":
            return self.span(list(parts[0][2]), domain("RES", base), "under {}", "{}+", "{}–{}", "{}")
        if col in ("ed", "sockets"):
            return self.set_words(parts[0][1], list(parts[0][2]), base, where)
        return " · ".join(self.clauses(Simplifier.make("and", parts), base, where))


# ---------------------------------------------------------------- per base: the rows

def level_text(lo, hi):
    return "All levels" if (lo, hi) == (0, 12) else f"Level {lo}" if lo == hi else f"Levels {lo}–{hi}"


def nots(x):
    if x[0] == "not":
        return 1 + nots(x[1])
    if x[0] in ("and", "or"):
        return sum(nots(y) for y in x[1])
    return 0


def span_key(iv):
    return (-1, -1) if iv is None else (iv[0][0], iv[-1][1])


class Analysis:
    def __init__(self):
        self.rules, self.named_src, self.toggles, self.version = load_filter()
        classify(self.rules)
        self.bases = self.load_bases()
        white = white_atom(self.toggles)
        self.named_trees = {k: T.fold(T.compile_rpn(v), white) for k, v in self.named_src.items()}
        self.kept = []
        for r in self.rules:
            if r.kind in ("layer", "last") and not r.notify:
                continue
            tree = T.fold(r.rpn, white)
            if tree == ("c", 0):
                continue
            r.tree = tree
            words = T.tree_words(tree, set())
            r.codes = {w for w in words if T.is_code(w) and not T.COMPARE_RE.match(w)}
            r.named = any(w.startswith(NAMED) for w in words)
            r.words = words
            r.keys = {m.group(1) for m in map(T.COMPARE_RE.match, words) if m}
            self.kept.append(r)
        self.cache = {}
        self.named_tags = {}
        for r in self.kept:
            if r.kind == "tag":
                for w in T.tree_words(r.tree, set()):
                    if w.startswith(NAMED):
                        self.named_tags.setdefault(w, r.tag)
        for k in self.named_src:
            self.named_tags.setdefault(k, k[len(NAMED):].split("_")[0].title())
        self.words = Words(load_skills(), load_tabs(), self.named_tags)
        self.used = defaultdict(set)  # rule number -> bases it applies to
        self.hidden_icons = defaultdict(lambda: defaultdict(set))  # (icon rule, hide rule) -> {base: levels}
        self.sounds = T.load_sounds()

    def load_bases(self):
        out = []
        for code, info in T.load_bases().items():
            types = set(info["types"])
            if not (types & {"armo", "weap", "bowq", "xboq"}):
                continue
            if code in T.QUEST_CODES or (not info["spawnable"] and code not in KEEP_BASES):
                continue
            base = Base(code, info)
            if base.cat:
                out.append(base)
        return out

    def fold_base(self, base, inf):
        """[(rule, {level: simplified condition})] for the rules that can apply to this base. A rule folds the same
        for every base with the same item groups, sockets and size (unless it names the base's code or a named
        base), and the same at every filter level where its FILTLVL tests come out the same."""
        atom = base.atom(inf)
        simp = Simplifier(base)
        named = {}
        for name, tree in self.named_trees.items():
            t = T.fold_tree(tree, atom)
            named[name] = self.per_level(t, simp, {}) if t != ("c", 0) else None
        out = []
        for r in self.kept:
            w = r.words  # the key: only what this rule tests of the base
            key = None if r.named else (
                r.n, base.code if base.code in r.codes else None, frozenset(g for g in base.groups if g in w),
                base.sockets if "SOCK" in r.keys else None, base.area if "AREA" in r.keys else None,
                inf if ("INF" in w or "SUP" in w or "ED" in r.keys) else None,
                ("DIN" in base.groups) if "RES" in r.keys else None)
            if key is not None and key in self.cache:
                per = self.cache[key]
            else:
                t = T.fold_tree(r.tree, atom)
                per = self.per_level(t, simp, named) if t != ("c", 0) else {}
                if key is not None:
                    self.cache[key] = per
            if per:
                out.append((r, per))
        return out, named, simp

    @staticmethod
    def per_level(t, simp, named):
        """{level: t folded for that level and simplified}, leaving out the levels where it is false."""
        words = T.tree_words(t, set())
        tests = [(w, T.COMPARE_RE.match(w)) for w in sorted(words) if w.startswith("FILTLVL")]
        names = [w for w in sorted(words) if w.startswith(NAMED)]
        runs_by = defaultdict(list)
        for lv in range(13):
            k = tuple(T.compare(lv, m) for _, m in tests) + tuple(
                canon(named[w].get(lv, ("c", 0))) if named.get(w) else None for w in names)
            runs_by[k].append(lv)
        out = []
        for lvs in runs_by.values():
            lv = lvs[0]

            def la(word, lv=lv):
                v = level_atom(lv)(word)
                if v is not None:
                    return v
                if word.startswith(NAMED):
                    n = named.get(word)
                    if n is None:
                        return 0
                    x = n.get(lv, ("c", 0))
                    return x[1] if x[0] == "c" else None
                return None
            s = simp.simplify(simp.nary(T.fold_tree(t, la)))
            if s != ("c", 0):
                out += [(x, s) for x in lvs]
        return dict(sorted(out))

    def lines(self, base, inf):
        """The base's lines: [{kind, lo, hi, cond, rules, chat}], one case each, conditions not yet in words."""
        folded, named, simp = self.fold_base(base, inf)
        entries = []  # [kind, rule, {level: condition}]
        earlier = {lv: [] for lv in range(13)}  # stopping rules so far, with their own conditions
        for r, per in folded:
            self.used[r.n].add(base.code)
            if r.kind in ("hide", "show"):
                eff = {}
                for lv, cond in per.items():
                    c = cond
                    for e, prev in earlier[lv]:
                        if e.display == r.display or not simp.meet(c, prev):
                            continue
                        real = simp.subtract(c, prev)
                        if real != ("c", 0) and e.kind == "show" and nots(real) > nots(c):
                            ref = f"@{e.n}"  # "except when it shows as ($)": shorter than e's whole condition
                            self.words.refs[ref] = literal_text(e.display) or "its name"
                            real = simp.make("and", conj(c) + [("bool", ref, False)])
                        c = real
                        if c == ("c", 0):
                            break
                    if c != ("c", 0):
                        eff[lv] = c
                    earlier[lv].append((r, cond))
                if eff:
                    entries.append([r.kind, r, eff])
            elif r.kind == "tag" or r.notify:
                entries.append(["tag" if r.kind == "tag" else "notify", r, per])
        # (findings) a notification whose every case a hide rule hides at that level: an icon on a hidden item
        if self.icon_findings(inf):
            for kind, r, per in entries:
                if kind not in ("tag", "notify") or not r.icons:
                    continue
                for lv, cond in per.items():
                    for k2, h, hper in entries:
                        if k2 == "hide" and lv in hper and simp.implies(cond, hper[lv]):
                            self.hidden_icons[(r.n, h.n)][base.code].add(lv)
                            break
        # one case per row: a tag's named base put inline, and each OR that mixes columns split into rows
        cases = []  # [kind, rule, {level: case}]
        for kind, r, per in entries:
            by = {}
            for lv, cond in per.items():
                if kind in ("tag", "notify"):
                    cond = self.inline(cond, lv, named, simp)
                for t in self.split(cond, simp):
                    by.setdefault(canon(t), {})[lv] = t
            cases += [[kind, r, p] for p in by.values()]
        # a hide case another hide case has at the same level says nothing new
        for lv in range(13):
            hides = [e for e in cases if e[0] == "hide" and lv in e[2]]
            for i, e in enumerate(hides):
                for j, f in enumerate(hides):
                    if i == j or lv not in f[2] or lv not in e[2]:
                        continue
                    a, b = e[2][lv], f[2][lv]
                    if simp.implies(a, b) and (j < i or not simp.implies(b, a)):
                        del e[2][lv]
                        break
        out = []
        for kind, r, per in cases:
            out += self.segments(kind, r, per)
        return self.merge(out, simp)

    @staticmethod
    def icon_findings(inf):
        """Whether lines() looks for minimap icons on hidden items (white bases: not for low quality rows)."""
        return not inf

    @staticmethod
    def inline(cond, lv, named, simp):
        """A tag's named base in place of its word (Plague claw: its sockets fill the Sockets column)."""
        pos = [y for y in conj(cond) if y[0] == "bool" and y[1].startswith(NAMED) and y[2]]
        if len(pos) != 1 or not named.get(pos[0][1]) or lv not in named[pos[0][1]]:
            return cond
        rest = [y for y in conj(cond) if y is not pos[0]]
        return simp.simplify(Simplifier.make("and", rest + conj(named[pos[0][1]][lv])))

    def split(self, cond, simp, cap=6):
        """cond as one or more cases with no OR that mixes columns: (ED<19 OR SOCK=2) -> two cases (at most cap)."""
        terms = [conj(cond)]
        if not any(self.words.splittable(x) for x in terms[0]):
            return [cond]  # (most conditions: nothing to split)
        for _ in range(4):
            new, changed = [], False
            for t in terms:
                i = next((i for i, x in enumerate(t) if self.words.splittable(x)), None)
                if i is None:
                    new.append(t)
                    continue
                changed = True
                new += [t[:i] + conj(b) + t[i + 1:] for b in t[i][1]]
            if not changed or len(new) > cap:
                break
            terms = new
        out, seen = [], set()
        for t in terms:
            s = simp.simplify(Simplifier.make("and", t))
            if s != ("c", 0) and canon(s) not in seen:
                seen.add(canon(s))
                out.append(s)
        return out or [cond]

    @staticmethod
    def segments(kind, r, per):
        """One line per run of filter levels with the same case (and, for a notification, chat or not)."""
        out = []
        for lv in sorted(per):
            chat = bool(r.notify) and (r.tier is None or lv == 0 or r.tier >= lv)
            key = (canon(per[lv]), chat)
            if out and out[-1]["hi"] == lv - 1 and out[-1]["key"] == key:
                out[-1]["hi"] = lv
            else:
                out.append({"kind": kind, "lo": lv, "hi": lv, "key": key, "cond": per[lv], "chat": chat,
                            "rules": [r]})
        return out

    def merge(self, lines, simp):
        """Two lines that look the same and differ in one value (0 or 4 sockets) become one."""
        out = []
        for x in lines:
            for y in out:
                if (y["kind"], y["lo"], y["hi"], y["chat"]) != (x["kind"], x["lo"], x["hi"], x["chat"]):
                    continue
                ry, rx = y["rules"][0], x["rules"][0]
                looks = (lambda r: (r.icons, r.sound, r.kind, r.name if x["kind"] in ("tag", "show") else ""))
                if looks(ry) != looks(rx):
                    continue
                m = self.union(y["cond"], x["cond"], simp)
                if m is not None:
                    y["cond"], y["rules"] = m, y["rules"] + x["rules"]
                    break
            else:
                out.append(x)
        return out

    @staticmethod
    def union(a, b, simp):
        ca = {canon(x): x for x in conj(a)}
        cb = {canon(x): x for x in conj(b)}
        da = [x for k, x in ca.items() if k not in cb]
        db = [x for k, x in cb.items() if k not in ca]
        if not da and not db:
            return a
        if len(da) == 1 and len(db) == 1 and da[0][0] == db[0][0] == "set" and da[0][1] == db[0][1]:
            joined = ("set", da[0][1], tuple(norm(list(da[0][2]) + list(db[0][2]))))
            return simp.simplify(simp.make("and", [x for k, x in ca.items() if k in cb] + [joined]))
        return None

    def rows(self, base, inf):
        """The base's rows for the page, in order: [{kind, lo, hi, cells, cases, image, title, rules, chat, key}]."""
        out = []
        simp = Simplifier(base)
        for line in self.lines(base, inf):
            cond, r = line["cond"], line["rules"][0]
            parts = defaultdict(list)
            for x in ([] if cond == ("c", 1) else conj(cond)):
                parts[self.words.column(x)].append(x)
            cases = []
            if parts.get("skills") and line["kind"] in ("tag", "notify"):  # a named base's choice of skills: the
                head, cases = self.words.choices(Simplifier.make("and", parts.pop("skills")), base, r.where)
                for x in head:  # parts all its cases have go to their columns (Plague claws: 0 or 3 sockets)
                    parts[self.words.column(x)].append(x)
            cells = {}
            for col, xs in parts.items():
                if len(xs) > 1 and col != "skills":  # one column's parts from two places: as one
                    xs = conj(simp.simplify(Simplifier.make("and", xs)))
                cells[col] = self.words.cell(col, xs, base, r.where)
            lit = {x[1]: (x[2] if x[0] == "bool" else list(x[2])) for x in conj(cond) if x[0] in ("bool", "set")}
            rank = (lambda v: 0 if v is None else 2 if v else 1)  # any, non-eth / nonsuperior, eth / superior
            line.update(cells=cells, cases=cases, key=(
                KIND_ORDER[line["kind"]], line["lo"], line["hi"], rank(lit.get("ETH")), rank(lit.get("SUP")),
                span_key(lit.get("ED")), span_key(lit.get("SOCK")), span_key(lit.get("CLVL")),
                *(cells.get(c, "") for c in ("class", "ilvl", "res", "skills", "other")), r.n))
            line["image"], line["title"] = self.image(r, base, line["kind"])
            out.append(line)
        return sorted(out, key=lambda x: x["key"])

    @staticmethod
    def image(r, base, kind):
        """(The label of a tag or a 'shows as' display, as the game draws it; its description, if any). A tag
        alone, without the base name ("Delirium")."""
        if kind not in ("tag", "show"):
            return None, None
        name = "" if kind == "tag" else base.name
        text = r.name.replace("%NAME%", name).replace("%BASENAME%", name)
        lines, color = [], "WHITE"
        for part in text.split("%NL%"):
            segs, pos = [], 0
            for m in T.COLOR_RE.finditer(part):
                if m.start() > pos:
                    segs.append([color, part[pos:m.start()]])
                color, pos = m.group(1), m.end()
            if pos < len(part):
                segs.append([color, part[pos:]])
            segs = [[c, re.sub(r"%[A-Z_]+%", "", t).replace("%PERCENT%", "%")] for c, t in segs]
            segs = [s for s in segs if s[1]]
            if segs:  # no spaces at the ends (the tag's space before the name)
                segs[0][1], segs[-1][1] = segs[0][1].lstrip(), segs[-1][1].rstrip()
                segs = [s for s in segs if s[1]]
            lines.append(segs)
        desc = re.search(r"\{(.*?)\}", r.raw)
        title = None
        if desc and kind == "show":
            title = re.sub(r"%[A-Z_]+%", "", desc.group(1).replace("%NAME%", base.name).replace("%CL%", " / ")
                           .replace("%NL%", " / ")).strip() or None
        return [x for x in reversed(lines) if x], title


# ---------------------------------------------------------------- the page data

def where_text(rules):
    out, prev = [], None
    for r in rules:
        f, n = r.where.rsplit(":", 1)
        out.append(n if f == prev else f"{f.replace('sections/', '')}:{n}")
        prev = f
    return ", ".join(out)


def row_data(x, ref):
    """[kind, lo, hi, [one text index + 1 per column, 0 = any], {image, icon, chat, sound, cases}] (no rule refs:
    those come per group)."""
    r = x["rules"][0]
    cells = [ref(x["cells"][c]) + 1 if x["cells"].get(c) else 0 for c in COLS]
    extra = {}
    if x["image"]:
        extra["b"] = x["image"]
    if x["title"]:
        extra["bt"] = ref(x["title"])
    if r.icons and r.notify:
        extra["i"] = [list(r.icons)]
    if x["chat"]:
        extra["h"] = 1
    if r.sound:
        extra["o"] = r.sound
    if x["cases"]:
        extra["d"] = [ref(c) for c in x["cases"]]
    return [x["kind"], x["lo"], x["hi"], cells, extra]


def build_data(an):
    texts, index = [], {}

    def ref(s):
        if s not in index:
            index[s] = len(texts)
            texts.append(s)
        return index[s]

    tiers = ["normal", "exceptional", "elite"]
    groups, by_key, cats = [], {}, []
    for base in sorted(an.bases, key=lambda b: (ORDER.index(b.cat), tiers.index(b.tier) if b.tier in tiers else 3,
                                                  b.name)):
        if base.cat not in cats:
            cats.append(base.cat)
        rows = [an.rows(base, inf) for inf in (0, 1)]
        data = [[row_data(x, ref) for x in rs] for rs in rows]
        # bases of one type, tier, socket maximum and size with the same rows: one group (its header holds for each)
        key = (base.cat, base.tier, base.sockets, base.info["width"], base.info["height"], json.dumps(data))
        if key not in by_key:
            by_key[key] = {"names": [], "bases": [], "data": data, "wheres": [[set() for _ in rs] for rs in rows]}
            groups.append(by_key[key])
        g = by_key[key]
        g["names"].append([base.code, base.name])
        g["bases"].append(base)
        for i, rs in enumerate(rows):
            for j, x in enumerate(rs):
                g["wheres"][i][j].update(x["rules"])
    out = []
    for g in groups:
        b0 = g["bases"][0]
        lists = []
        for data, wheres in zip(g["data"], g["wheres"]):  # each row's rules, for all the group's bases
            lists.append([row[:4] + [dict(row[4], w=ref(where_text(sorted(w, key=lambda r: r.n))))]
                          for row, w in zip(data, wheres)])
        out.append({"n": g["names"], "t": TIER_NAMES.get(b0.tier, ""), "k": b0.cat,
                    "s": b0.sockets, "z": f"{b0.info['width']}×{b0.info['height']}",
                    "l": lists[0], "q": None if g["data"][1] == g["data"][0] else lists[1]})
    sounds = {}
    for g in out:
        for row in g["l"] + (g["q"] or []):
            if "o" in row[4]:
                sounds[row[4]["o"]] = an.sounds.get(row[4]["o"], {}).get("name", str(row[4]["o"]))
    return {"version": an.version, "levels": T.load_levels(), "palette": T.load_palette(), "cats": cats,
            "cols": COLS, "texts": texts, "groups": out, "sounds": sounds}


def findings(an):
    out = []
    for w, where in sorted(an.words.unknown.items()):
        out.append(f"words left as they are: {w} ({', '.join(sorted(where)[:3])})")
    for r in an.kept:
        # A ($) is only for bases of 2 inventory squares or less (the author's choice): a class without one leaves its
        # ($) rule unused on purpose.
        if r.where.startswith(TAG_SECTIONS) and r.kind in ("tag", "hide", "show") and not an.used.get(r.n) \
                and "AREA" not in r.keys:
            out.append(f"{r.where}: applies to no white base on the ground ({r.kind})")
    names = {b.code: b.name for b in an.bases}
    for (n, h), by_base in sorted(an.hidden_icons.items()):
        r, hide = an.rules[n], an.rules[h]
        levels = sorted(set().union(*by_base.values()))
        bases = ", ".join(sorted(names[c] for c in by_base))
        out.append(f"{r.where} ({r.tag or 'notification'}): its minimap icon shows on items {hide.where} hides "
                   f"(levels {T.level_runs(levels).split(' ', 1)[1]}): {bases}")
    return out


def page_text(data):
    page = T.DOC_HEAD + TEMPLATE.read_text(encoding="utf-8") + "\n</body>\n</html>\n"
    return page.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")))


def print_rows(an, codes):
    """--base: the rows of these bases, column by column (to check the wording)."""
    heads = {"eth": "Eth", "quality": "Quality", "ed": "ED", "sockets": "Sockets", "clvl": "Char level",
             "class": "Class", "ilvl": "Item level", "res": "All res", "skills": "Skills", "other": "Other"}
    for code in codes:
        base = next(b for b in an.bases if b.code == code)
        for inf in (0, 1):
            print("  -- low quality" if inf else f"== {base.name} ({base.code}, {base.cat}, {base.tier}, "
                                                 f"{base.sockets} sockets, area {base.area})")
            for x in an.rows(base, inf):
                r = x["rules"][0]
                shows = "".join(t for line in (x["image"] or []) for _, t in line) or x["kind"]
                icon = "icon" if r.icons and r.notify else ""
                chat = "chat" if x["chat"] else ""
                cells = " | ".join(f"{heads[c]}: {x['cells'][c]}" for c in COLS if x["cells"].get(c))
                print(f"  {level_text(x['lo'], x['hi']):13} {shows[:16]:16} {icon:4} {chat:4}  {cells or 'always'}"
                      f"  [{where_text(x['rules'])}]")
                for c in x["cases"]:
                    print(f"{'':42}- {c}")


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="White armor and weapon bases, from the filter's own rules.")
    ap.add_argument("--check", action="store_true", help=f"exit 1 if {PAGE.name} is out of date")
    ap.add_argument("--findings", action="store_true", help="what the page could not put in words, and quirks")
    ap.add_argument("--base", help="print these bases' rows (codes, comma-separated) instead of writing the page")
    args = ap.parse_args()
    an = Analysis()
    if args.base:
        print_rows(an, args.base.split(","))
        return
    data = build_data(an)
    text = page_text(data)
    current = PAGE.read_text(encoding="utf-8") if PAGE.exists() else ""
    if args.check:
        if current != text:
            print(f"{PAGE.name} is out of date: run python tools/base_map.py (build.bat does)")
            sys.exit(1)
        print("non-magic bases page up to date")
        return
    if current != text:
        PAGE.write_text(text, encoding="utf-8", newline="\n")
        print(f"updated {PAGE.name} ({len(text) // 1024} KB)")
    checks = findings(an)
    if args.findings:
        for line in checks:
            print(line)
    print(f"bases page: {len(checks)} finding(s)" + (": python tools/base_map.py --findings lists them"
                                                     if checks and not args.findings else ""))


if __name__ == "__main__":
    main()
