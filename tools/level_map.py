#!/usr/bin/env python3
"""
The players' page of the filter levels, Erazure-Filter-Levels.html: what each filter level shows, notifies and hides,
for every kind of item that drops (gold, potions, scrolls and keys; gems and runes; PD2's own items, maps and quest
items; unique, set, rare, magic and non-magical items), read from the filter's own rules. The hub of the players'
pages: its rows link to the Unique & Set Tiers, Non-magical Bases, Magic Items and Rare Items pages for the
item-by-item detail.

    python tools/level_map.py              writes the page (build.bat and the edit hook run it)
    python tools/level_map.py --check      exit 1 if the page is out of date (CI)
    python tools/level_map.py --findings   what the page could not model, and level names the rules disagree with
    python tools/level_map.py --row NAME   prints the rows whose name has NAME: their cells and details

How it reads the filter: BH's two passes, as tools/tier_map.py runs a unique (the first matching rule without
%CONTINUE% decides the display, an empty name hides; in the notification pass minimap icons stack up to the first
match without %CONTINUE%, and the first match its %TIER-n% allows gives the chat line), for every base as it drops on
the ground, in every case its rules test: filter level, character level, class, ethereal or not, place (town, maps,
the Diablo Clone, Rathma and Lucion areas...), difficulty, item level, stack size, gold amount and, for uniques and
sets, Discovery Progress. All of a drop's cases at once: each condition is a bitmask over them (one bit per case, a
Python integer), so a rule costs a few bit operations. Level 0 hides nothing (BH ItemDisplay.cpp GetItemName). A
condition no case sets (sockets, stats, skills, a formula...) is "maybe" (BH's 3-valued logic, as
tools/explain_item.py), and a drop such a rule could hide or show is "some hidden".

The page shows a drop on the ground outside town (uniques and sets: already discovered), in the Main version. Filter
levels whose rows all behave the same, potions aside (the launcher names' H5, M5 and 35%), share a column. "What
changes" compares each column with the one before it, or with the last one before that whose hiding it keeps (11 with
8-9: 10 and 11 each hide their own things).
"""
import argparse
import json
import re
import sys
from bisect import bisect_right
from collections import defaultdict
from itertools import permutations, product
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402
import tier_map as T  # noqa: E402

ROOT = T.ROOT
PAGE = ROOT / "Erazure-Filter-Levels.html"
TEMPLATE = ROOT / "tools" / "level_map_template.html"

# The cases of a drop, outermost first (FILTLVL outermost: a level's cases are one run of bits)
DIMS = ["FILTLVL", "LOC", "GRAIL", "ETH", "CLASS", "DIFF", "ILVL", "QTY", "GOLD", "CLVL"]
POS = {d: i for i, d in enumerate(DIMS)}
# Places (MAPID): anywhere else (an area no rule names), the town, maps (the areas after 137) and the areas rules
# name. Levels.txt Id, names from the string tables: 137 The Pandemonium Fortress; 161-163 Ruins of Necropolis,
# Decaying Swamplands, The Void; 183-184 The Fallen Gardens, The Diamond Gate; 188-189 Veiled Realm, Temple of the
# Triune.
PLACES = {"field": (T.FIELD_ID, "anywhere else"), "town": (1, "in town"), "map": (138, "in maps"),
          "dclone": (137, "in The Pandemonium Fortress (Diablo Clone)"), "rathma": (161, "in Rathma's areas"),
          "gardens": (183, "in The Fallen Gardens and The Diamond Gate"), "lucion": (188, "in Lucion's areas")}
PLACE_CUTS = {1, 2, 40, 41, 75, 76, 103, 104, 109, 110, 133, 137, 138, 161, 164, 183, 185, 188, 190, 202, 207}
DIFFS = {0: "Normal", 1: "Nightmare", 2: "Hell"}
GEAR = {"armo", "weap"}
QUIVERS = {"bowq", "xboq"}
NO_ETH = {"tpot"} | QUIVERS  # throwing potions and quivers: no durability, never ethereal
GEM_LEVELS = {"Chipped": 1, "Flawed": 2, "Flawless": 4, "Perfect": 5}  # BH GemLevels (a plain gem is 3)
GEM_TYPES = {"Amethyst": 1, "Diamond": 2, "Emerald": 3, "Ruby": 4, "Sapphire": 5, "Topaz": 6, "Skull": 7}
MAP_TIERS = {"t1m": 1, "t2m": 2, "t3m": 3, "t4m": 4, "t5m": 5}  # BH maptiers, by the base's own item type
POTIONS = {"hp1", "hp2", "hp3", "hp4", "hp5", "mp1", "mp2", "mp3", "mp4", "mp5", "rvs", "rvl"}
LEVEL_CLAIMS = {"H5": "hp5", "M5": "mp5", "35%": "rvs"}  # a launcher name's "Hides X": the potion it hides
POTION_WORDS = set(LEVEL_CLAIMS)
# What a condition no case sets depends on, in words (by its keyword)
MAYBE_WORDS = {"SOCK": "sockets", "ED": "enhanced damage or defense", "EDEF": "enhanced defense", "DEF": "defense",
               "EDAM": "enhanced damage", "SUP": "being superior", "INF": "being low quality",
               "SK": "skills", "OS": "skills", "CLSK": "skills", "TABSK": "skills", "CHSK": "skills",
               "STAT": "stats", "MULTI": "stats", "RES": "resistances", "CRAFTALVL": "crafted affix level",
               "ALVL": "affix level", "CHARSTAT": "your character's stats", "$f": "its stats",
               "SELLPRICE": "price", "PRICE": "price", "BUYPRICE": "price", "LVLREQ": "level requirement",
               "MAXSOCKETS": "sockets", "REQSTR": "requirements", "REQDEX": "requirements"}
LINKS = {"tiers": ("Erazure-Unique-Set-Tiers.html", "tiers/", "Unique & Set Tiers"),
         "bases": ("Erazure-Non-Magic-Bases.html", "bases/", "Non-magical Bases"),
         "magic": ("Erazure-Magic-Items.html", "magic/", "Magic Items"),
         "rare": ("Erazure-Rare-Items.html", "rare/", "Rare Items")}
# A section's note under its name on the page
SECTION_NOTES = {"Non-magical items": "Plain: no sockets, not superior, no skills. Best case: the most a base can "
                                      "show with any sockets, enhanced defense or damage, or skills. The "
                                      "Non-magical Bases page has every base.",
                 "Unique items": "Unidentified, the filter cannot tell items on one base apart: they share a row.",
                 "Set items": "Unidentified, the filter cannot tell items on one base apart: they share a row."}
# A section's color on the page (author, 2026-10-14: the items' colors in game; gems and runes: the runes' orange)
SECTION_COLORS = {"Gold, potions, scrolls and keys": "white", "Gems and runes": "rune",
                  "PD2 items, maps and quest items": "tan", "Unique items": "gold", "Set items": "set",
                  "Rare items": "rare", "Magic items": "magic", "Non-magical items": "white"}
# The author's line about each level group, by its launcher name (no thresholds or items: the rows say those)
INTROS = {
    "Show All Items": "Hides nothing and plays every notification.",
    "Lowest Strictness": "For the ladder start and characters up to level 80.",
    "Relaxed Filtering": "Hides more low-value magic, rare and non-magical items as your character levels.",
    "Stricter Filtering": "Hides many non-magical bases and low-value magic and rare items.",
    "Endgame Filtering": "Hides most low-value items for endgame characters.",
    "Extreme Filtering!": "Hides everything but the most valuable items.",
}


def clean(name):
    """A base name without its color codes ("ÿc8El Rune", read as Latin-1 in the table: "Ã¿c8El Rune")."""
    return re.sub(r"(?:Ã¿|ÿ)c.", "", name).strip()


# ---------------------------------------------------------------- drops

class Spec:
    """One kind of drop: a base as it drops on the ground with one quality (non-magical gear: low quality when `low`;
    with no sockets, not superior and no stats when `plain`)."""

    def __init__(self, code, quality, info, names=None, low=False, plain=False):
        self.code, self.quality, self.info, self.low, self.plain = code, quality, info, low, plain
        types = set(info["types"])
        self.name = clean(info["name"])
        self.names = names or [self.name]
        self.tier = info["tier"]
        self.groups = T.item_groups(types)
        if self.tier in T.TIER_GROUP:
            self.groups.add(T.TIER_GROUP[self.tier])
        self.gear = bool(types & GEAR)
        self.can_eth = self.gear and not types & NO_ETH
        self.cat = T.category(info)
        self.rune = int(code[1:3]) if "rune" in types and re.fullmatch(r"r\d\d", code) else None
        self.gem = None
        if "gem" in types:
            words = self.name.split()
            self.gem = (GEM_LEVELS.get(words[0], 3), GEM_TYPES.get(words[-1], 0))
        self.maptier = MAP_TIERS.get(info["types"][0] if info["types"] else "", -1)
        self.gold = code == "gld"
        self.drop = None  # its Drop (Rules.drop)

    def key(self, size=True):
        """What the rules can tell apart, besides the item code (`size` False: and its quality level and size)."""
        sized = (self.info["qlvl"], self.info["width"] * self.info["height"]) if size else ()
        return (self.quality, frozenset(self.groups), self.rune, self.gem, self.maptier, self.gold, self.can_eth,
                self.gear, self.low, self.plain) + sized


def quality_atom(quality, toggles):
    """1 / 0 for a word every drop of this quality has the same value for; None for one that depends on the base or
    the case, or that no case decides (left in, so a drop can say what it depends on)."""
    def atom(word):
        if word in toggles:
            return toggles[word]
        if word in ("TRUE", "FALSE"):
            return int(word == "TRUE")
        if word in T.QUALITIES:
            return int(word == quality)
        if word == "ID":
            return int(quality == "NMAG")  # non-magical items drop identified; magic, rare, unique and set ones do not
        if word == "GROUND":
            return 1
        if word in T.OTHER_PLACES or word in ("RW", "GEMMED"):
            return 0
        if word in ("SUP", "INF", "ETH") or word in T.CLASSES or word in ("ALLDISCOVERED", "ANYDISCOVERED"):
            return None
        if word in T.GROUP_WORDS or word in T.TIER_GROUP.values():
            return None
        m = T.COMPARE_RE.match(word)
        if m:
            key = m.group(1)
            if key == "STAT360":
                return T.compare(0, m)  # a drop is not corrupted
        return None
    return atom


# A plain non-magical item has none of these (stats its base can roll or be given: sockets, superior ED, staffmods)
PLAIN_ZERO = {"SOCK", "ED", "EDEF", "EDAM", "RES", "SK", "OS", "CLSK", "TABSK", "CHSK"}


def item_atom(spec, size=True):
    """Words this drop decides: its code, item groups, rune, gem, map tier, quality level and size (and for a plain
    non-magical item, its stats). `size` False: quality level and size left in (bases that share the rest fold
    alike)."""
    memo = {}

    def atom(word):
        if word not in memo:
            memo[word] = _atom(word)
        return memo[word]

    def _atom(word):
        if word in T.GROUP_WORDS or word in T.TIER_GROUP.values():
            return int(word in spec.groups)
        if word == "SUP":
            return 0 if spec.low or spec.plain or not spec.gear or spec.quality != "NMAG" else None
        if word == "INF":
            return int(spec.low)
        if word == "ETH" and not spec.can_eth:
            return 0
        m = T.COMPARE_RE.match(word)
        if m:
            key = m.group(1)
            if spec.plain and re.match(r"[A-Z]+", key) and re.match(r"[A-Z]+", key).group(0) in PLAIN_ZERO \
                    and "+" not in key:
                return T.compare(0, m)
            if key == "RUNE":
                return T.compare(spec.rune, m) if spec.rune else 0  # BH: false for anything but a rune
            if key in ("GEMLEVEL", "GEMTYPE"):
                return T.compare(spec.gem[0 if key == "GEMLEVEL" else 1], m) if spec.gem else 0
            if key == "GOLD" and not spec.gold:
                return 0
            if key == "MAPTIER":
                return T.compare(spec.maptier, m)
            if key == "QLVL":
                return T.compare(spec.info["qlvl"], m) if size else None
            if key == "AREA":
                return T.compare(spec.info["width"] * spec.info["height"], m) if size else None
            return None
        if T.is_code(word):
            return int(word == spec.code)
        return None
    return atom


def cuts(words, key, low, high):
    """The first value of each run of values the comparisons of `key` tell apart, from `low`."""
    out = set()
    for w in words:
        m = T.COMPARE_RE.match(w)
        if not m or m.group(1) != key:
            continue
        a, b, op = int(m.group(3)), m.group(4), m.group(2)
        out |= {a} if op == "<" else {a + 1} if op == ">" else {a, a + 1} if op == "=" else {a, int(b) + 1}
    return [low] + sorted(c for c in out if low < c <= high)


SPACES = {}  # dimension values -> Space


class Space:
    """A drop's cases: every combination of its dimensions' values, one bit each (FILTLVL outermost)."""

    def __init__(self, values):
        self.values = values
        self.key = tuple(tuple(values[d]) for d in DIMS)
        self.stride, n = {}, 1
        for d in reversed(DIMS):
            self.stride[d] = n
            n *= len(values[d])
        self.n, self.all = n, (1 << n) - 1
        self.per_level = self.stride["FILTLVL"]  # the cases of one filter level
        self.memo = {}

    def value_mask(self, d, i):
        key = (d, i)
        if key not in self.memo:
            s, k = self.stride[d], len(self.values[d])
            period = s * k
            reps = self.n // period
            block = ((1 << s) - 1) << (i * s)
            self.memo[key] = block * (((1 << (period * reps)) - 1) // ((1 << period) - 1))  # block, every period
        return self.memo[key]

    def mask(self, d, pred):
        out = 0
        for i, v in enumerate(self.values[d]):
            if pred(v):
                out |= self.value_mask(d, i)
        return out

    def index(self, d, v):
        """The index of the value whose run holds v (CLVL, ILVL, QTY and GOLD values start runs)."""
        vs = self.values[d]
        if d in ("CLVL", "ILVL", "QTY", "GOLD"):
            return max(bisect_right(vs, v) - 1, 0)
        return vs.index(v)


class Drop:
    """A drop's outcome in every case, as masks: H hidden, S shown, M either (a rule no case decides could hide or
    show it); chat, icon (notification pass); looks {look: mask} for uniques and sets."""

    def __init__(self, spec, kept, unknown):
        self.spec = spec
        words = set()
        for r, tree in kept:
            words |= T.tree_words(tree, set())
        values = self.dim_values(words, spec, unknown)
        key = tuple(tuple(values[d]) for d in DIMS)
        if key not in SPACES:  # drops with the same dimensions share one (and its masks)
            SPACES[key] = Space(values)
        self.space = sp = SPACES[key]
        full = sp.all
        word_masks = {}
        self.maybe_words = defaultdict(set)  # rule number -> the words no case decides

        def word(w, r):
            if w not in word_masks:
                word_masks[w] = self.word_mask(w)
            if word_masks[w] is None:
                self.maybe_words[r.n].add(w)
                return 0, full
            return word_masks[w], 0

        def cond(node, r):
            k = node[0]
            if k == "c":
                return (full, 0) if node[1] == 1 else (0, 0) if node[1] == 0 else (0, full)
            if k == "w":
                return word(node[1], r)
            if k == "not":
                t, m = cond(node[1], r)
                return full & ~(t | m), m
            (ta, ma), (tb, mb) = cond(node[1], r), cond(node[2], r)
            if k == "and":
                t = ta & tb
                return t, (ta | ma) & (tb | mb) & ~t
            t = ta | tb
            return t, (ma | mb) & ~t

        remaining, hid, shown, may_hide, may_show = full, 0, 0, 0, 0
        looks = defaultdict(int)
        self.maybe_rules = []  # (rule, cases it could decide)
        for r, tree in kept:
            if r.cont:
                continue
            t, m = cond(tree, r)
            t, m = t & remaining, m & remaining
            if r.look == "HIDDEN":
                hid, may_hide = hid | t, may_hide | m
            else:
                shown, may_show = shown | t, may_show | m
                looks[r.look] |= t
            if m:
                self.maybe_rules.append((r, m))
            remaining &= ~t
        shown |= remaining
        looks["NAME"] |= remaining
        zero = sp.mask("FILTLVL", lambda v: v == 0)  # level 0: BH shows the game's name instead of hiding
        looks["NAME"] |= hid & zero
        shown, hid, may_hide = shown | (hid & zero), hid & ~zero, may_hide & ~zero
        looks["HIDDEN"] = hid
        self.H = hid & ~may_show
        self.S = shown & ~may_hide
        self.M = full & ~(self.H | self.S)
        self.looks = {k: v for k, v in looks.items() if v}
        active, free, chat, icon, may = full, full, 0, 0, 0
        for r, tree in kept:
            if not r.notify:
                continue
            t, m = cond(tree, r)
            t &= active
            may |= m & active
            allowed = full if r.tier is None else sp.mask("FILTLVL", lambda v: v == 0 or r.tier >= v)
            c = t & allowed & free
            chat, free = chat | c, free & ~c
            if r.icons:
                icon |= t
            if not r.cont:
                active &= ~t
        self.chat, self.icon = chat, icon
        self.may_note = may & ~(chat | icon)  # a notification no case decides
        self.memo = {}

    def sig(self, levels, look):
        """What the drop does at these filter levels, as a key: drops that do the same share their words."""
        key = ("sig", tuple(levels), look)
        if key not in self.memo:
            sp = self.space
            m = sp.mask("FILTLVL", lambda v: v in levels)
            looks = tuple(sorted((k, x & m) for k, x in self.looks.items())) if look else ()
            self.memo[key] = (sp.key, tuple(levels), look, self.H & m, self.M & m, self.chat & m, self.icon & m, looks)
        return self.memo[key]

    def state(self, lv, clvl, best=False):
        """drop_state at one filter level and character level, anywhere else, already discovered."""
        key = ("state", lv, self.space.index("CLVL", clvl), best)  # one per run of character levels the drop has
        if key not in self.memo:
            self.memo[key] = drop_state(self, self.select([lv], clvl=clvl), best)
        return self.memo[key]

    @staticmethod
    def dim_values(words, spec, unknown):
        def has(key):
            return any((m := T.COMPARE_RE.match(w)) and m.group(1) == key for w in words)
        values = {"FILTLVL": list(range(13)),
                  "ETH": [0, 1] if "ETH" in words and spec.can_eth else [0],
                  "CLASS": list(T.CLASSES) if words & set(T.CLASSES) else [None],
                  "DIFF": [0, 1, 2] if has("DIFF") else [2],
                  "ILVL": cuts(words, "ILVL", 1, 99), "QTY": cuts(words, "QTY", 1, 9999),
                  "GOLD": cuts(words, "GOLD", 1, 10 ** 6), "CLVL": cuts(words, "CLVL", 1, 99),
                  "GRAIL": ["found", "new"] if words & {"ALLDISCOVERED", "ANYDISCOVERED"} else ["found"]}
        if has("MAPID"):
            values["LOC"] = list(PLACES)
            for w in words:
                m = T.COMPARE_RE.match(w)
                if m and m.group(1) == "MAPID":
                    for c in cuts([w], "MAPID", 0, 255)[1:]:
                        if c not in PLACE_CUTS:
                            unknown.add(f"MAPID cut at {c} ({w}): no place of its own on the page")
        else:
            values["LOC"] = ["field"]
        return values

    def word_mask(self, w):
        """The cases a word is true in; None for a word no case decides."""
        sp = self.space
        if w in T.CLASSES:
            return sp.mask("CLASS", lambda v: v == w)
        if w == "ETH":
            return sp.mask("ETH", lambda v: v == 1)
        if w in ("ALLDISCOVERED", "ANYDISCOVERED"):
            return sp.mask("GRAIL", lambda v: v == "found")
        m = T.COMPARE_RE.match(w)
        if m and m.group(1) == "MAPID":
            return sp.mask("LOC", lambda v: T.compare(PLACES[v][0], m))
        if m and m.group(1) in DIMS:
            return sp.mask(m.group(1), lambda v: T.compare(v, m))
        return None

    def select(self, levels, clvl=None, loc="field", diff=2):
        """The cases of these filter levels at one place (anywhere else) and difficulty (Hell: the rules never tell it
        from Nightmare), already discovered, at a character level (any when None)."""
        sp = self.space
        key = ("select", tuple(levels), clvl, loc, diff)
        if key not in sp.memo:
            out = sp.mask("FILTLVL", lambda v: v in levels) & sp.value_mask("LOC", sp.values["LOC"].index(loc)) \
                & sp.value_mask("GRAIL", 0) & sp.value_mask("DIFF", sp.values["DIFF"].index(diff))
            if clvl is not None:
                out &= sp.value_mask("CLVL", sp.index("CLVL", clvl))
            sp.memo[key] = out
        return sp.memo[key]


class Rules:
    """The filter's rules, folded per quality (Main version) and per drop, keeping the rules that can decide its
    display or notify it."""

    def __init__(self):
        self.rules, variants = T.load_filter()
        self.toggles = variants[build.MAIN]
        self.per_quality, self.generic_folds, self.code_folds, self.drops = {}, {}, {}, {}
        self.unknown = set()

    def quality(self, q):
        if q not in self.per_quality:
            atom = quality_atom(q, self.toggles)
            generic, by_code = [], defaultdict(list)
            no_code = lambda w: 0 if T.is_code(w) and not T.COMPARE_RE.match(w) else None  # noqa: E731
            for r in self.rules:
                if r.cont and not r.notify:
                    continue  # a layer: changes the name, decides nothing
                tree = T.fold(r.rpn, atom)
                if tree == ("c", 0):
                    continue
                if T.fold_tree(tree, no_code) == ("c", 0):
                    for w in r.codes:
                        by_code[w].append((r, tree))
                elif T.tree_words(tree, set()) & r.codes:
                    by_code[None].append((r, tree))  # names codes and more: folded per drop
                else:
                    generic.append((r, tree))
            self.per_quality[q] = (generic, by_code)
        return self.per_quality[q]

    def drop(self, spec):
        if spec.drop is None:
            spec.drop = self._drop(spec)
        return spec.drop

    def _drop(self, spec):
        generic, by_code = self.quality(spec.quality)
        atom = item_atom(spec)
        key, shared = spec.key(), spec.key(size=False)
        if shared not in self.generic_folds:  # once per kind of drop, then quality level and size where tested
            part = item_atom(spec, size=False)
            self.generic_folds[shared] = []
            for r, t in generic:
                t = T.fold_tree(t, part)
                if t != ("c", 0):
                    sized = any((m := T.COMPARE_RE.match(w)) and m.group(1) in ("QLVL", "AREA")
                                for w in T.tree_words(t, set()))
                    self.generic_folds[shared].append((r, t, sized))
        folded = []
        for r, t, sized in self.generic_folds[shared]:
            if sized:
                memo = (r.n, key)
                if memo not in self.code_folds:
                    self.code_folds[memo] = T.fold_tree(t, atom)
                t = self.code_folds[memo]
            if t != ("c", 0):
                folded.append((r, t))
        for r, t in by_code.get(spec.code, []) + by_code.get(None, []):
            memo = (r.n, key, spec.code if spec.code in r.codes else None)  # another code folds like no code
            if memo not in self.code_folds:
                self.code_folds[memo] = T.fold_tree(t, atom)
            t = self.code_folds[memo]
            if t != ("c", 0):
                folded.append((r, t))
        folded.sort(key=lambda x: x[0].n)
        sig = (key, tuple((r.n, t) for r, t in folded))
        if sig not in self.drops:
            self.drops[sig] = Drop(spec, folded, self.unknown)
        return self.drops[sig]


# ---------------------------------------------------------------- rows

def look_name(look):
    return "hidden" if look == "HIDDEN" else T.LOOKS[look][0] if look in T.LOOKS else "name only"


def cap(text):
    return text[0].upper() + text[1:] if text else text


class Row:
    """A row of the page: a kind of item, its drops as the page shows them, split into sub-rows where they behave
    differently. Non-magical items: a row of plain drops and a `best` one (the most a base can show with any sockets and
    stats); `tag` says which."""

    def __init__(self, name, specs, link=None, split=None, look=False, best=False, tag=""):
        self.name, self.specs, self.link, self.split, self.look = name, specs, link, split, look
        self.best, self.tag = best, tag


def bases_where(bases, pred):
    return [(c, i) for c, i in sorted(bases.items(), key=lambda x: (x[1]["tier"], clean(x[1]["name"]))) if pred(c, i)]


def codes_named(section):
    """The item codes the rules of a section name."""
    out = []
    for line in (ROOT / "sections" / section).read_text(encoding="utf-8").splitlines():
        m = re.match(r"^ItemDisplay\[(.*?)\]:", line)
        if m:
            out += [w for w in re.findall(r"[A-Za-z0-9_$]+", m.group(1)) if T.is_code(w)]
    return list(dict.fromkeys(out))


GEAR_ROWS = [  # (row, the categories it takes (tier_map.category), split by)
    ("Rings", {"Rings"}, None), ("Amulets", {"Amulets"}, None), ("Jewels", {"Jewels"}, None),
    ("Charms", {"Charms"}, "name"), ("Circlets", {"Circlets"}, "tier"), ("Helms", {"Helms"}, "tier"),
    ("Body armor", {"Armors"}, "tier"), ("Shields", {"Shields"}, "tier"), ("Gloves", {"Gloves"}, "tier"),
    ("Boots", {"Boots"}, "tier"), ("Belts", {"Belts"}, "tier"),
    ("Class items", {"Amazon Weapons", "Assassin Claws", "Barbarian Helms", "Sorceress Orbs", "Druid Pelts",
                     "Necromancer Shields", "Paladin Shields", "Paladin Weapons"}, "cat"),
    ("Weapons", {"Bows and Crossbows", "Daggers", "Axes", "Throwing Weapons", "Javelins", "Maces", "Polearms",
                 "Spears", "Scepters", "Staves", "Swords", "Wands"}, "tier"),
    ("Quivers", {"Quivers"}, None),
]


def make_sections(bases):
    """[(section, [Row])]: the page's rows, in order."""
    spawn = {c: i for c, i in bases.items() if i["spawnable"]}

    def specs(codes, q="NMAG", **kw):
        return [Spec(c, q, bases[c], **kw) for c in codes if c in bases]

    def of_type(t):
        return [c for c, i in bases_where(spawn, lambda c, i: t in i["types"])]

    quest = set(T.QUEST_CODES)

    def gear_codes(cats, kinds):
        codes = [c for c, i in bases_where(spawn, lambda c, i: T.category(i) in cats and set(i["types"]) & kinds)]
        return [c for c in codes if c not in quest and not set(bases[c]["types"]) & {"tpot"}]

    misc = [
        Row("Gold", specs(["gld"])),
        Row("Healing potions", specs(["hp1", "hp2", "hp3", "hp4", "hp5"]), split="name"),
        Row("Mana potions", specs(["mp1", "mp2", "mp3", "mp4", "mp5"]), split="name"),
        Row("Rejuvenation potions", specs(["rvs", "rvl"]), split="name"),
        Row("Antidote, thawing and stamina potions", specs(["yps", "wms", "vps"]), split="name"),
        Row("Throwing potions", specs(of_type("tpot"))),
        Row("Scrolls", specs(["tsc", "isc"]), split="name"),
        Row("Tomes", specs(["tbk", "ibk"]), split="name"),
        Row("Keys", specs(["key"])),
    ]
    gems = [Row(f"{label} gems", [s for s in specs(of_type("gem")) if s.gem and s.gem[0] == lvl and
                                  "(old)" not in s.name])
            for label, lvl in (("Chipped", 1), ("Flawed", 2), ("Normal", 3), ("Flawless", 4), ("Perfect", 5))]
    gems.append(Row("Runes", specs(sorted(c for c in of_type("rune") if re.fullmatch(r"r\d\d", c)))))
    pd2 = [c for c in codes_named("120-pd2-items.filter") if c in bases and c != "key"]
    maps = [c for c in codes_named("130-maps.filter") if c in bases and bases[c]["types"][0] in MAP_TIERS]
    other = [
        Row("PD2 items", specs(pd2)),
        Row("Maps", [s for q in ("NMAG", "MAG", "RARE") for s in specs([c for c in maps if not c.startswith("t5")], q)]
            + specs([c for c in maps if c.startswith("t5")], "UNI")),
        Row("Quest items", [Spec(c, "UNI" if c in quest else "NMAG", bases[c])
                            for c in codes_named("080-quest-items.filter") if c in bases]),
    ]
    out = [("Gold, potions, scrolls and keys", misc), ("Gems and runes", gems),
           ("PD2 items, maps and quest items", other)]
    # uniques and sets: one drop per base (unidentified, the filter cannot tell them apart), rows by tier
    by_base = defaultdict(list)
    for it in T.load_items(bases):
        by_base[(it["kind"], it["code"])].append(it["name"])
    for kind, title in (("UNI", "Unique items"), ("SET", "Set items")):
        rows = [Row(t, [], link="tiers", look=True) for t in T.TIER_GROUPS]
        for (k, code), names in by_base.items():
            if k == kind and code in bases:
                rows[0].specs.append(Spec(code, kind, bases[code], names=list(dict.fromkeys(names))))
        out.append((title, rows))  # sorted into tiers by assign_tiers once the drops are known
    for q, title, link in (("RARE", "Rare items", "rare"), ("MAG", "Magic items", "magic")):
        rows = []
        for name, cats, split in GEAR_ROWS:
            if name == "Charms" and q == "RARE":
                continue  # ItemTypes.txt gives charms no Rare flag
            codes = gear_codes(cats, GEAR | QUIVERS | {"ring", "amul", "jewl", "char"})
            rows.append(Row(name, specs(codes, q), link=link, split=split))
        out.append((title, rows))
    nonmagical = []
    for name, cats, split in GEAR_ROWS:
        if name in ("Rings", "Amulets", "Jewels", "Charms"):
            continue
        codes = gear_codes(cats, GEAR | QUIVERS)
        label = "Arrows and bolts" if name == "Quivers" else name
        nonmagical.append(Row(label, specs(codes, plain=True), link="bases", split=split, tag="plain"))
        nonmagical.append(Row(label, specs(codes), link="bases", split=split, best=True, tag="best case"))
    gear = gear_codes(set(T.CATEGORY_ORDER), GEAR)
    nonmagical.append(Row("Low quality items", specs([c for c in gear if bases[c]["types"] and
                                                 not set(bases[c]["types"]) & NO_ETH], low=True, plain=True),
                     link="bases", split="cat2"))
    out.append(("Non-magical items", nonmagical))
    return out


def assign_tiers(rows, rules):
    """Uniques and sets into rows by tier: the highest look each gets anywhere but in town (tier_map.tier_of)."""
    specs, rows[0].specs = rows[0].specs, []
    for spec in specs:
        d = rules.drop(spec)
        out_of_town = full_except_town(d.space)
        best = max((look for look, m in d.looks.items() if m & out_of_town), key=lambda lk: T.LOOKS[lk][1])
        next(r for r in rows if r.name == T.LOOKS[best][2]).specs.append(spec)
    rows[:] = [r for r in rows if r.specs]


def full_except_town(sp):
    return sp.all & ~sp.value_mask("LOC", sp.values["LOC"].index("town")) if "town" in sp.values["LOC"] else sp.all


# ---------------------------------------------------------------- states

STATE_TEXT = {"chat": "Notifies", "icon": "Icon only", "mixed": "Some notify", "shown": "Shown", "some": "Some hidden",
              "hidden": "Hidden"}
NOTE_RANK = {"chat": 3, "icon": 2, "mixed": 1, "shown": 0}
HIDING = ("some", "hidden")


def drop_state(d, sel, best=False):
    """(any hidden, all hidden, notify kind of the shown cases, its most common look) of one drop in `sel`. `best`:
    the most it can show (non-magical items with any sockets and stats): hidden only where nothing could show it."""
    if not sel:
        return None
    if best:
        any_h, shown = bool(sel & d.H), sel & (d.S | d.M)
        chat, icon = d.chat | d.may_note, d.icon | d.may_note
    else:
        any_h, shown = bool(sel & (d.H | d.M)), sel & d.S
        chat, icon = d.chat, d.icon
    all_h = not (sel & ~d.H)
    if not shown:
        note = None
    elif not (shown & ~chat):
        note = "chat"
    elif not (shown & ~icon) and not (shown & chat):
        note = "icon"
    elif not (shown & (chat | icon)):
        note = "shown"
    else:
        note = "mixed"
    counts = {look: (m & shown).bit_count() for look, m in d.looks.items() if look != "HIDDEN"}
    look = max(counts, key=lambda k: (counts[k], T.LOOKS.get(k, ("", 0))[1])) if shown and counts else None
    return any_h, all_h, note, look


def row_state(states, refs=None):
    """A group of drops at one filter level and character level: (kind, hidden, partly hidden, drops, look, steps
    down). kind: hidden / some / a notify kind; look (uniques and sets): the most common look, and how many show a
    lower look than on level 1 (`refs`: their states there)."""
    pairs = [(s, r) for s, r in zip(states, refs or [None] * len(states)) if s]
    states = [s for s, _ in pairs]
    n = len(states)
    full = sum(1 for s in states if s[1])
    part = sum(1 for s in states if s[0] and not s[1])
    if full == n:
        kind = "hidden"
    elif full or part:
        kind = "some"
    else:
        notes = {s[2] for s in states}
        kind = notes.pop() if len(notes) == 1 else "mixed"
    look, lower = None, 0
    if refs is not None:
        looks = [s[3] for s in states if s[3]]
        if looks:
            look = max(sorted(set(looks)), key=lambda k: (looks.count(k), T.LOOKS.get(k, ("", 0))[1]))
            rank = (lambda k: T.LOOKS.get(k, ("", 0))[1])  # noqa: E731
            lower = sum(1 for s, r in pairs if s[3] and r and r[3] and rank(s[3]) < rank(r[3]))
    return kind, full, part, n, look, lower


def state_text(st):
    kind, full, part, n, look, lower = st
    if kind == "hidden":
        return "Hidden"
    if kind == "some":
        return f"{full} of {n} hidden" if not part and n > 1 else "Some hidden"
    if look:
        return cap(look_name(look)) + (f", {lower} step down" if 0 < lower < n else "")
    return STATE_TEXT[kind]


def runs_text(runs):
    """(a cell's text, the state it names) from its runs [lo, hi, state] by character level: its state, or when that
    changes."""
    if len(runs) == 1:
        return state_text(runs[0][2]), runs[0][2][0]
    kinds = [r[2][0] for r in runs]
    hiding = [k in HIDING for k in kinds]
    if any(hiding):
        first = hiding.index(True)
        if all(hiding[first:]):
            if first == 0:
                more = "all" if kinds[-1] == "hidden" else "more"
                return f"{state_text(runs[0][2])}, {more} from {runs[-1][0]}", kinds[0]
            text = f"{'Hidden' if kinds[first] == 'hidden' else 'Some hidden'} from {runs[first][0]}"
            if kinds[first] == "some" and kinds[-1] == "hidden":
                text += f", all from {next(r[0] for r in runs[first:] if r[2][0] == 'hidden')}"
            return text, kinds[first]
        if not any(hiding[hiding.index(False):]):
            word = "Hidden" if kinds[0] == "hidden" else "Some hidden"
            return f"{word} below {runs[hiding.index(False)][0]}", kinds[0]
        return "Changes with character level", "some"
    a, b = runs[0][2], runs[-1][2]
    if a[4] or b[4]:  # uniques and sets
        lowers = [r[2][5] if r[2][5] < r[2][3] else 0 for r in runs]  # every item: its look says so
        top = max(lowers)
        text = cap(look_name(a[4] or b[4]))
        if top:
            at = runs[lowers.index(top)][0]
            text += f", {top} step down" + (f" from {at}" if at > runs[0][0] else "")
        return text, a[0]
    if NOTE_RANK[a[0]] > NOTE_RANK[b[0]]:
        return f"{state_text(a)} below {runs[1][0]}", a[0]
    return f"{state_text(b)} from {runs[-1][0]}", b[0]


# ---------------------------------------------------------------- plain words for the details

HIGH = {"CLVL": 99, "ILVL": 99, "QTY": 9999, "GOLD": 10 ** 6}
PHRASE_ORDER = ["CLVL", "FILTLVL", "ETH", "CLASS", "ILVL", "QTY", "GOLD", "DIFF", "LOC", "GRAIL"]
# What a cell's notes compare with its main view (Nightmare or Hell, anywhere else): (place, difficulty, words)
NOTES = [("field", 0, "in Normal"), ("map", 2, "in maps"), ("dclone", 2, "in The Pandemonium Fortress (Diablo Clone)"),
         ("rathma", 2, "in Rathma's areas"), ("gardens", 2, "in The Fallen Gardens and The Diamond Gate"),
         ("lucion", 2, "in Lucion's areas")]
MAP_AREAS = {"rathma", "gardens", "lucion"}  # areas after 137: maps too


def spans(d, values, sp):
    """[lo, hi] runs of a numeric dimension's values (hi None: no upper end)."""
    vs = sp.values[d]
    out = []
    for v in sorted(values):
        i = vs.index(v)
        lo, hi = v, (vs[i + 1] - 1 if i + 1 < len(vs) else None)
        if out and out[-1][1] is not None and out[-1][1] + 1 == lo:
            out[-1][1] = hi
        else:
            out.append([lo, hi])
    return out


def phrase(d, values, sp, compact=False):
    """A condition as it follows an outcome: 'from character level 50', 'on levels 4, 6–7', 'for Amazons'. `compact`:
    character levels as 'from 50' (a table cell)."""
    vs = sp.values[d]
    values = sorted(values, key=vs.index)
    if d == "FILTLVL":
        return "on " + T.level_runs(values)
    if d in HIGH:
        out = []
        for lo, hi in spans(d, values, sp):
            first = lo <= vs[0]
            if d == "CLVL":
                unit = "" if compact else "character level "
                out.append(f"below {unit}{hi + 1}" if first else f"from {unit}{lo}" if hi is None
                           else f"at {unit}{lo}–{hi}")
            elif d == "ILVL":
                out.append(f"below item level {hi + 1}" if first else f"from item level {lo}" if hi is None
                           else f"at item level {lo}–{hi}")
            elif d == "QTY":
                out.append("as a single one" if lo == hi == 1 else f"in stacks of {lo}+" if hi is None
                           else f"in stacks of {lo}–{hi}")
            else:
                out.append(f"under {hi + 1:,} gold" if first else f"of {lo:,}+ gold" if hi is None
                           else f"of {lo:,}–{hi:,} gold")
        return " or ".join(out)
    if d == "ETH":
        return "when ethereal" if values == [1] else "when not ethereal"
    if d == "CLASS":
        rest = [c for c in T.CLASSES if c not in values]
        if len(values) > len(T.CLASSES) / 2:
            return "for classes other than " + join_and(T.CLASS_NAMES[c] for c in rest)
        return "for " + join_and(T.CLASS_NAMES[c] for c in values)
    if d == "DIFF":
        return "in " + " and ".join(DIFFS[v] for v in values)
    if d == "LOC":
        return " and ".join(PLACES[v][1] for v in values)
    return "already discovered" if values == ["found"] else "before you've discovered it"


DESCRIBED = {}  # (the dimensions' values, the outcomes in case order) -> the words


def describe(table, sp, compact=False):
    """The shortest exact description of {case: outcome}, in words: the first case's outcome, then the others with
    their conditions ('minimap icon only; hidden from character level 50'; `compact`: 'hidden from 50')."""
    outcomes = set(table.values())
    if len(outcomes) == 1:
        return outcomes.pop()
    memo_key = (tuple(tuple(sp.values[d]) for d in DIMS), tuple(table.items()), compact)
    if memo_key not in DESCRIBED:
        DESCRIBED[memo_key] = gold_words(table, sp) or _describe(table, sp, compact)
    return DESCRIBED[memo_key]


def varying_dims(table):
    """The dimensions that change the outcome somewhere."""
    keys = list(table)
    out = []
    for j in range(len(DIMS)):
        if len({sc[j] for sc in keys}) < 2:
            continue
        rest = defaultdict(set)
        for sc, k in table.items():
            rest[sc[:j] + sc[j + 1:]].add(k)
        if any(len(ks) > 1 for ks in rest.values()):
            out.append(j)
    return out


def _describe(table, sp, compact=False):
    background = next(iter(table.values()))  # the first case's: below every character level the others start at
    varying = varying_dims(table)

    def split(tab, order):
        return split_cases(tab, order, DIMS, sp.values)

    def position(case):
        return [sp.values[d].index(v) for d, v in zip(DIMS, case)]

    def inside(sc, conds):
        return all(sc[POS[d]] in v for d, v in conds)

    def widen(conds, k):
        """Leave out each condition whose cases all have this outcome too ('hidden when ethereal, or from character
        level 80' rather than '..., or from character level 80 when not ethereal')."""
        for d in reversed(PHRASE_ORDER):
            rest = [c for c in conds if c[0] != d]
            if len(rest) < len(conds) and rest and all(o == k for sc, o in table.items() if inside(sc, rest)):
                conds = rest
        return conds

    best = None
    for order in (permutations(varying) if len(varying) <= 4 else [tuple(varying)]):
        clauses = [(widen(conds, k), k, at) for conds, k, at in split(table, list(order)) if k != background]
        cover = []  # a clause another one of its outcome takes in says nothing more (of two alike, the first stays)
        cases = [frozenset(sc for sc in table if inside(sc, conds)) for conds, _, _ in clauses]
        for n, (conds, k, at) in enumerate(clauses):
            if not any(k2 == k and m != n and cases[n] <= cases[m] and
                       (len(c2) < len(conds) or (len(c2) == len(conds) and m < n))
                       for m, (c2, k2, _) in enumerate(clauses)):
                cover.append((conds, k, at))
        texts = []
        for conds, k, at in sorted(cover, key=lambda c: (position(c[2]), len(c[0]))):
            conds = sorted(conds, key=lambda c: PHRASE_ORDER.index(c[0]))
            texts.append((k, len(conds), " ".join(phrase(d, v, sp, compact) for d, v in conds)))
        cost = (len(texts), sum(len(t) for _, _, t in texts))
        if best is None or cost < best[0]:
            best = (cost, texts)
    merged = {}
    for k, n, t in best[1]:  # one outcome's cases together, the plainest first: 'hidden when ethereal, or ...'
        merged.setdefault(k, []).append((n, t))
    return "; ".join([background] + [f"{k} {', or '.join(t for _, t in sorted(ts, key=lambda x: x[0]))}"
                                     for k, ts in merged.items()])


def gold_words(table, sp):
    """Gold: 'hidden: piles under 10 gold from character level 5, under 50 from 10, ...' when bigger piles hide
    later."""
    varying = {DIMS[j] for j in varying_dims(table)}
    if varying != {"GOLD", "CLVL"} or not set(table.values()) <= {"shown", "hidden"}:
        return None
    gi, ci = DIMS.index("GOLD"), DIMS.index("CLVL")
    golds, clvls = sp.values["GOLD"], sp.values["CLVL"]
    from_level = {}
    for g in golds:
        hidden = [c for c in clvls if any(k == "hidden" for sc, k in table.items() if sc[gi] == g and sc[ci] == c)]
        if hidden and hidden != clvls[clvls.index(hidden[0]):]:
            return None  # not hidden from one character level on
        from_level[g] = hidden[0] if hidden else None
    pairs, last = [], 0
    for i, g in enumerate(golds):
        c = from_level[g]
        if c is None:
            break
        if c < last:
            return None
        last = c
        top = golds[i + 1] if i + 1 < len(golds) else None
        if pairs and pairs[-1][1] == c:
            pairs[-1][0] = top
        else:
            pairs.append([top, c])
    if not pairs or pairs[-1][0] is None:
        return None
    words = [f"under {top:,} gold from character level {c}" if n == 0 else f"under {top:,} from {c}"
             for n, (top, c) in enumerate(pairs)]
    return f"hidden: piles {', '.join(words)}; bigger piles show"


def details(specs, levels, look):
    """What the drops of a cell do: a small table per kind of behavior (items that do the same share one, in the row's
    order; {"n": their names, "c": its columns (the column's levels where they differ: potions), "b": the table}),
    then lines ({"t": ...}): what a rule no case decides depends on, what Normal difficulty and the special areas
    change."""
    by_text, maybe, notes = {}, set(), {}
    for spec in specs:
        words = drop_words(spec.drop, tuple(levels), look)
        if words is None:
            continue
        text, depends, extra = words
        by_text.setdefault(text, []).append(spec)
        maybe |= depends
        for where, t in extra:
            notes.setdefault(where, {}).setdefault(t, []).append(spec)
    many = len(by_text) > 1
    lines = []
    for text, group in by_text.items():
        d = group[0].drop
        groups = level_groups(d, levels, look)
        cols = [group_head(g[0], False) for g in groups] if len(groups) > 1 else []
        lines.append({"n": names_of(group) if many else "", "c": cols, "b": block(d, groups, look), "w": text})
    if maybe:
        lines.append({"t": "Some hidden: depends on " + join_and(sorted(maybe)) + "."})
    # one line per place and words; the map areas only where they differ from maps
    by_words = {}
    for where, texts in notes.items():
        for text, group in texts.items():
            key = (text, tuple(s.code + s.quality for s in group))
            by_words.setdefault(key, []).append(where)
    for (text, _), wheres in by_words.items():
        if "in maps" in wheres:
            wheres = [w for w in wheres if not any(w == NOTES[i][2] for i in range(len(NOTES))
                                                   if NOTES[i][0] in MAP_AREAS)]
        group = notes[wheres[0]][text]
        who = f"{names_of(group)}: " if many or len(notes[wheres[0]]) > 1 else ""
        lines.append({"t": f"{cap(join_and(wheres))}: {who}{text}"})
    return lines


def drop_words(d, levels, look, compact=False):
    """(what one drop does at these levels, in words; what a rule no case decides depends on; [(context, words)] where
    Normal difficulty or a special area changes it), or None when no case applies. `compact`: the words alone, in a
    table cell's form ('hidden from 50')."""
    if compact:
        key = ("compact", d.sig(levels, look))
        if key not in WORDS:
            sel = d.select(levels)
            WORDS[key] = (describe(outcome_table(d, sel, look), d.space, compact=True),) if sel else None
        return WORDS[key]
    key = ("words", levels, look)
    if key not in d.memo:
        sp = d.space
        sel = d.select(levels)
        if not sel:
            d.memo[key] = None
            return None
        depends = set()
        for r, m in d.maybe_rules:
            if m & sel:
                for w in d.maybe_words.get(r.n, ()):
                    mm = T.COMPARE_RE.match(w)
                    k = re.match(r"[A-Z$]+", mm.group(1) if mm else w)
                    depends.add(MAYBE_WORDS.get(k.group(0) if k else w, "its stats"))
        content = ("words", d.sig(levels, look))
        if content in WORDS:
            d.memo[key] = (WORDS[content][0], depends, WORDS[content][1])
            return d.memo[key]
        main = outcome_table(d, sel, look)
        extra = []
        li, di = DIMS.index("LOC"), DIMS.index("DIFF")
        words = describe(main, sp)
        map_words = words
        masks = [d.H, d.M, d.chat, d.icon] + list(d.looks.values())
        for loc, diff, where in NOTES:
            if loc not in sp.values["LOC"] or diff not in sp.values["DIFF"]:
                continue
            shift = (sp.values["LOC"].index(loc) - sp.values["LOC"].index("field")) * sp.stride["LOC"] + \
                (sp.values["DIFF"].index(diff) - sp.values["DIFF"].index(2)) * sp.stride["DIFF"]
            if all(((x >> shift) if shift > 0 else (x << -shift)) & sel == x & sel for x in masks):
                continue  # the same as anywhere else in Hell
            other = {sc[:li] + ("field",) + sc[li + 1:di] + (2,) + sc[di + 1:]: k
                     for sc, k in outcome_table(d, d.select(levels, loc=loc, diff=diff), look).items()}
            text = describe(other, sp)
            if loc == "map":
                map_words = text
            if not (loc in MAP_AREAS and text == map_words):
                extra.append((where, text))
        WORDS[content] = (words, extra)
        d.memo[key] = (words, depends, extra)
    return d.memo[key]


CASES = {}  # a space's dimension values -> its cases, by bit index
WORDS = {}  # what a drop does at some levels (Drop.sig) -> its words


def outcome_table(d, sel, look):
    """{case: outcome in words} for the cases of `sel`, in case order, from the masks at once: hidden (its minimap
    icon still shows), some hidden, notifies, chat line only, minimap icon only, shown; uniques and sets: their look
    (name only, High value...)."""
    sp = d.space
    key = tuple(tuple(sp.values[dim]) for dim in DIMS)
    if key not in CASES:
        CASES[key] = list(product(*key))
    cases = CASES[key]
    words = {}
    if look:
        shown = sel & ~d.H
        for k, m in d.looks.items():
            plain = look_name(k)
            maybe = "some hidden" if k == "HIDDEN" else plain + " (some hidden)"
            for i in bit_indexes(m & shown & ~d.M):
                words[i] = plain
            for i in bit_indexes(m & shown & d.M):
                words[i] = maybe
        groups = [(sel & d.H & d.icon, "hidden (its minimap icon still shows)"), (sel & d.H & ~d.icon, "hidden")]
    else:
        groups = [(sel & d.H & d.icon, "hidden (its minimap icon still shows)"), (sel & d.H & ~d.icon, "hidden"),
                  (sel & d.M, "some hidden"), (sel & d.S & d.chat & d.icon, "notifies"),
                  (sel & d.S & d.chat & ~d.icon, "chat line only"), (sel & d.S & ~d.chat & d.icon, "minimap icon only"),
                  (sel & d.S & ~d.chat & ~d.icon, "shown")]
    for m, w in groups:
        for i in bit_indexes(m):
            words[i] = w
    return {cases[i]: w for i, w in sorted(words.items())}


def bit_indexes(mask):
    return [i for i, b in enumerate(bin(mask)[:1:-1]) if b == "1"] if mask else []


def join_and(words):
    words = list(words)
    return words[0] if len(words) == 1 else ", ".join(words[:-1]) + " and " + words[-1]


def names_of(specs, limit=4):
    names = list(dict.fromkeys(n for s in specs for n in s.names))
    if len(names) <= limit:
        return join_and(names)
    return f"{', '.join(names[:limit - 1])} and {len(names) - limit + 1} more"


def rune_label(specs):
    """'El–Io Runes' for runes in a row, else None."""
    if not all(s.rune for s in specs):
        return None
    runs = []
    for s in sorted(specs, key=lambda s: s.rune):
        word = s.name.split()[0]
        if runs and runs[-1][2] + 1 == s.rune:
            runs[-1][1], runs[-1][2] = word, s.rune
        else:
            runs.append([word, word, s.rune])
    return ", ".join(a if a == b else f"{a}–{b}" for a, b, _ in runs) + " Runes"


# ---------------------------------------------------------------- small tables (cell details and change lines)

RD = DIMS[1:]  # a case without its filter level (the tables' columns are filter levels)
ROW_HEAD = {"CLVL": "Character level", "GOLD": "Gold pile", "QTY": "Stack", "ILVL": "Item level", "ETH": "",
            "CLASS": "Class", "DIFF": "Difficulty", "LOC": "Place", "GRAIL": ""}


def reduced_table(d, lv, look):
    """{case without its filter level: outcome} at one filter level, anywhere else, already discovered, in Hell."""
    key = ("reduced", lv, look)
    if key not in d.memo:
        d.memo[key] = {sc[1:]: k for sc, k in outcome_table(d, d.select([lv]), look).items()}
    return d.memo[key]


def level_groups(d, levels, look):
    """A column's filter levels, the ones where the drop does the same together: [[levels, table]] (potions differ
    within 3-7)."""
    memo = ("groups", d.sig(levels, look))
    if memo in WORDS:
        return WORDS[memo]
    groups = WORDS[memo] = []
    for lv in levels:
        t = reduced_table(d, lv, look)
        for g in groups:
            if g[1] == t:
                g[0].append(lv)
                break
        else:
            groups.append([[lv], t])
    return groups


def group_head(levels, alone):
    """A table column's header: the column's levels ('Levels 3–7'), or its group's when it has several."""
    return cap(T.level_runs(levels)) if alone or len(levels) > 1 else f"Level {levels[0]}"


def changes_with(joint, j):
    """Whether dimension j (of a case without its filter level) changes the outcomes somewhere."""
    rest = defaultdict(set)
    for sc, k in joint.items():
        rest[sc[:j] + sc[j + 1:]].add(k)
    return any(len(ks) > 1 for ks in rest.values())


def split_cases(tab, order, names, values):
    """{case: outcome} cut by the dimensions in `order` (indexes into the case, `names` their names), each only where it
    changes the outcome, values with the same cases together: [(conditions [(name, values)], outcome, first case)]."""
    for n, j in enumerate(order):
        d = names[j]
        vals = sorted({sc[j] for sc in tab}, key=values[d].index)
        subs = {v: frozenset((sc[:j] + sc[j + 1:], k) for sc, k in tab.items() if sc[j] == v) for v in vals}
        if len(set(subs.values())) < 2:
            continue
        groups = []
        for v in vals:
            for g in groups:
                if subs[g[0]] == subs[v]:
                    g.append(v)
                    break
            else:
                groups.append([v])
        out = []
        for g in groups:
            sub = {sc: k for sc, k in tab.items() if sc[j] in g}
            for conds, k, at in split_cases(sub, order[n + 1:], names, values):
                out.append(([(d, tuple(g))] + conds, k, at))
        return out
    return [([], next(iter(tab.values())), next(iter(tab)))]


def cell_words(text):
    """An outcome as a table cell: 'Hidden from 85' for 'shown; hidden from 85' (shown below it, as the strip says)."""
    return cap(text[len("shown; "):] if text.startswith("shown; ") else text)


def span_label(lo, hi, top):
    return f"{lo:,}+" if hi is None or hi >= top else f"{lo:,}" if lo == hi else f"{lo:,}–{hi:,}"


def row_words(d, values, sp, alone):
    """A table row's case: '10–49' (gold pile, alone in the table), 'Ethereal', 'Sorceresses', 'Stacks of 2+'."""
    vs = sp.values[d]
    values = sorted(values, key=vs.index)
    if d in HIGH:
        out = []
        for lo, hi in spans(d, values, sp):
            if d == "QTY":
                out.append("single" if lo == hi == 1 else f"stacks of {span_label(lo, hi, HIGH[d])}")
            elif d == "GOLD":
                text = f"under {hi + 1:,}" if lo <= vs[0] else span_label(lo, hi, HIGH[d])
                out.append(text if alone else f"{text} gold")
            else:
                text = f"below {hi + 1}" if lo <= vs[0] else span_label(lo, hi, HIGH[d])
                out.append(text if alone else f"{'item' if d == 'ILVL' else 'character'} level {text}")
        return " or ".join(out)
    if d == "ETH":
        return "ethereal" if values == [1] else "not ethereal"
    if d == "CLASS":
        rest = [c for c in T.CLASSES if c not in values]
        if len(values) > len(T.CLASSES) / 2:
            return "classes other than " + join_and(T.CLASS_NAMES[c] for c in rest)
        return join_and(T.CLASS_NAMES[c] for c in values)
    return phrase(d, values, sp)


def block(d, groups, look):
    """A drop's outcomes in these groups of filter levels ([[levels, table]]) as a small table, one row per case that
    matters (character levels, gold piles, ethereal or not, classes...): {"head": the rows' header, "rows": [[case,
    [outcome per group]]]}; {"inline": [outcome per group]} when no case changes it. A row's outcomes say what character
    level changes ('Minimap icon only; hidden from 50') when it is not the rows' own."""
    memo = ("block", tuple(d.sig(g[0], look) for g in groups))
    if memo not in WORDS:
        WORDS[memo] = _block(d, groups, look)
    return json.loads(json.dumps(WORDS[memo]))  # a copy: change lines mark their rows


def _block(d, groups, look):
    sp = d.space
    tables = [t for _, t in groups]
    keys = list(tables[0])
    joint = {k: tuple(t[k] for t in tables) for k in keys}
    varying = [j for j in range(len(RD)) if len({k[j] for k in keys}) > 1 and changes_with(joint, j)]
    if not varying:
        return {"inline": [cap(x) for x in joint[keys[0]]]}
    ci = RD.index("CLVL")
    if varying == [ci]:
        by_clvl = {}
        for k, v in joint.items():
            by_clvl.setdefault(k[ci], v)
        vs = sp.values["CLVL"]
        runs = []
        for i, c in enumerate(vs):
            hi = vs[i + 1] - 1 if i + 1 < len(vs) else 99
            if runs and runs[-1][2] == by_clvl[c]:
                runs[-1][1] = hi
            else:
                runs.append([c, hi, by_clvl[c]])
        return {"head": ROW_HEAD["CLVL"],
                "rows": [[span_label(lo, hi, 99), [cap(x) for x in cells]] for lo, hi, cells in runs]}
    row_dims = [j for j in varying if j != ci]
    combos = {}
    for k in keys:
        combos.setdefault(tuple(k[j] for j in row_dims), []).append(k)
    first = [g[0][0] for g in groups]
    cell_table = {}
    for combo, ks in combos.items():
        cell_table[combo] = tuple(cell_words(describe({(first[n],) + k: t[k] for k in ks}, sp, compact=True))
                                  for n, t in enumerate(tables))
    names = [RD[j] for j in row_dims]
    best = None
    for order in permutations(range(len(names))):
        rows = split_cases(cell_table, list(order), names, sp.values)
        if best is None or len(rows) < len(best):
            best = rows
    rows = []
    for conds, cells, at in sorted(best, key=lambda r: [sp.values[n].index(v) for n, v in zip(names, r[2])]):
        conds = sorted(conds, key=lambda c: PHRASE_ORDER.index(c[0]))
        rows.append([cap(", ".join(row_words(n, v, sp, len(names) == 1) for n, v in conds)), list(cells)])
    return {"head": ROW_HEAD[names[0]] if len(names) == 1 else "", "rows": rows}


def block_text(b, cols=None):
    """A small table as one line of text (the command line's --row and --changes)."""
    def cells(cs):
        if cols and len(cols) == len(cs):
            return " | ".join(f"{h}: {c}" for h, c in zip(cols, cs))
        return " | ".join(cs)
    if "inline" in b:
        return cells(b["inline"])
    head = f"{b['head']} " if b["head"] else ""
    return "; ".join(f"{head}{label}: {cells(cs)}" for label, cs, *_ in b["rows"])


# ---------------------------------------------------------------- the page data

class Page:
    def __init__(self):
        self._data = None
        self.cell_memo = {}
        self.rules = Rules()
        self.bases = T.load_bases()
        self.levels = T.load_levels()
        self.sections = make_sections(self.bases)
        for _, row in self.all_rows():
            for spec in row.specs:
                self.rules.drop(spec)
        for title, rows in self.sections:
            if title in ("Unique items", "Set items"):
                assign_tiers(rows, self.rules)
        self.columns = self.find_columns()

    def all_rows(self):
        for title, rows in self.sections:
            for row in rows:
                yield title, row

    def find_columns(self):
        """Filter levels whose drops all behave the same, potions aside, share a column."""
        sigs = {lv: [] for lv in range(13)}
        for _, row in self.all_rows():
            for spec in row.specs:
                if spec.code in POTIONS:
                    continue
                d = spec.drop
                block = (1 << d.space.per_level) - 1
                for lv in range(13):
                    shift = lv * d.space.per_level
                    looks = tuple(sorted((k, (m >> shift) & block) for k, m in d.looks.items())) if row.look else ()
                    sigs[lv].append(tuple((x >> shift) & block for x in (d.H, d.S, d.chat, d.icon)) + looks)
        cols = []
        for lv in range(13):
            if cols and sigs[cols[-1][-1]] == sigs[lv]:
                cols[-1].append(lv)
            else:
                cols.append([lv])
        return cols

    def column_title(self, levels):
        """(the launcher name of these levels, what they hide besides potions: 'Crafting Bases'...)."""
        names = [self.levels[lv] for lv in levels]
        hides = [[h.strip() for h in n.split(" - Hides ")[1].split(",")] if " - Hides " in n else [] for n in names]
        return names[0].split(" - ")[0].strip(), [h for h in hides[0] if h not in POTION_WORDS and
                                                    all(h in other for other in hides)]

    def cell(self, specs, levels, row):
        """{g: [[levels, runs]], t: text}: the cell of these drops at these filter levels; runs [lo, hi, kind, text] by
        character level. Levels whose runs differ (potions) get a group each."""
        memo = (tuple(id(s) for s in specs), tuple(levels), row.look, row.best)
        if memo not in self.cell_memo:
            self.cell_memo[memo] = self._cell(specs, levels, row)
        return json.loads(json.dumps(self.cell_memo[memo]))  # a copy: the page adds its details

    def _cell(self, specs, levels, row):
        drops = [s.drop for s in specs]
        unique = list({id(d): d for d in drops}.values())  # items with the same rules share a drop: ask it once
        starts = sorted({v for d in unique for v in d.space.values["CLVL"]})
        per_level = {}
        for lv in levels:
            runs = []
            for i, lo in enumerate(starts):
                hi = starts[i + 1] - 1 if i + 1 < len(starts) else 99
                now = {id(d): d.state(lv, lo, row.best) for d in unique}
                ref = {id(d): d.state(1, lo) for d in unique} if row.look else None
                st = row_state([now[id(d)] for d in drops], [ref[id(d)] for d in drops] if ref else None)
                if runs and runs[-1][2] == st:
                    runs[-1][1] = hi
                else:
                    runs.append([lo, hi, st])
            per_level[lv] = runs
        groups = []
        for lv in levels:
            for g in groups:
                if g[1] == per_level[lv]:
                    g[0].append(lv)
                    break
            else:
                groups.append([[lv], per_level[lv]])
        texts = [runs_text(g[1]) for g in groups]
        if len({t for t, _ in texts}) == 1:
            text, kind = texts[0]
        else:
            text = cap("; ".join(f"{T.level_runs(g[0])}: {t[0].lower() + t[1:]}" for g, (t, _) in zip(groups, texts)))
            kinds = [k for _, k in texts]
            kind = "some" if any(k in HIDING for k in kinds) else kinds[0]
        out = {"g": [[g[0], [[lo, hi, st[0], state_text(st)] for lo, hi, st in g[1]]] for g in groups], "t": text,
               "k": kind}
        if len({t for t, _ in texts}) > 1:  # each group of levels on a line of its own: [levels, text, kind]
            out["gt"] = [[T.level_runs(g[0]).split(" ", 1)[1], t, k] for g, (t, k) in zip(groups, texts)]
        return out

    def cells(self, specs, row):
        out = []
        for levels in self.columns:
            c = self.cell(specs, levels, row)
            c["d"] = details(specs, levels, row.look)
            out.append(c)
        return out

    def row_data(self, row):
        out = {"name": row.name, "tag": row.tag, "link": row.link, "n": len(row.specs),
               "cells": self.cells(row.specs, row), "subs": []}
        for name, specs in self.sub_rows(row):
            out["subs"].append({"name": name, "n": len(specs), "cells": self.cells(specs, row)})
        return out

    def sub_rows(self, row):
        """[(name, drops, full drops)] of the row's sub-rows: its split (or each drop), joined where they behave the
        same in every column; none when that leaves one."""
        if row.look:
            return []  # uniques and sets: their details group the items
        groups = {}
        for spec in row.specs:
            groups.setdefault(self.split_key(row, spec) if row.split else (spec.code, spec.quality), []).append(spec)
        merged = []  # [names, drops, signature]
        for key, specs in groups.items():
            sig = json.dumps([self.cell(specs, levels, row)["g"] for levels in self.columns])
            for m in merged:
                if m[2] == sig:
                    m[0].append(key)
                    m[1].extend(specs)
                    break
            else:
                merged.append([[key], list(specs), sig])
        if len(merged) < 2:
            return []
        out = []
        for keys, specs, _ in merged:
            if row.split:
                name = join_and(keys)
            else:
                name = rune_label(specs) or names_of(specs)
            out.append((name, specs))
        return out

    @staticmethod
    def split_key(row, spec):
        if row.split == "tier":
            return T.TIER_NAMES.get(spec.tier, spec.tier.title())
        if row.split == "name":
            return spec.name
        if row.split == "cat":
            return spec.cat
        return "Class items" if "clas" in spec.info["types"] else "Weapons" if "weap" in spec.info["types"] \
            else "Armor"

    def parents(self, cols):
        """Each column's parent: the column before it, or the last one before that whose launcher name hides
        nothing this one does not (11, Flawless Gems and Large Charms, against 8-9: not 10, Crafting Bases)."""
        out = {}
        for c in range(1, len(cols)):
            p = c - 1
            while p > 0 and not set(cols[p]["hides"]) <= set(cols[c]["hides"]):
                p -= 1
            out[c] = p
        return out

    def changes(self, cols):
        """Each column's card: what changes from its parent, item by item (level 1's: what it hides; level 0 hides
        nothing)."""
        parents = self.parents(cols)
        cards = []
        for c in range(1, len(cols)):
            p = parents[c]
            lines = []
            for title, rows in self.sections:
                for row in rows:
                    lines += self.row_changes(title, row, c, p)
            cards.append({"col": c, "parent": p, "lines": lines})
        for card in cards:  # 'as on level 10': the same change on an earlier card that is not its parent's
            for ln in card["lines"]:
                for other in cards:
                    key = (ln["sec"], ln["name"], ln["key"])
                    if other["col"] < card["col"] and other["col"] != card["parent"] and \
                            any((o["sec"], o["name"], o["key"]) == key for o in other["lines"]):
                        ln["as"] = other["col"]
        return cards

    def row_changes(self, title, row, c, p):
        """A row's lines on column c's card: its drops whose words changed from column p, grouped by their words."""
        lc, lp = tuple(self.columns[c]), tuple(self.columns[p])
        groups = {}
        for spec in row.specs:
            now, was = drop_words(spec.drop, lc, row.look), drop_words(spec.drop, lp, row.look)
            now, was = now[0] if now else None, was[0] if was else None
            if p == 0:
                if not now or "hidden" not in now:
                    continue
                was = None
            elif now == was:
                continue
            groups.setdefault((now, was), []).append(spec)
        if not groups:
            return []
        head = f"{row.name} ({row.tag})" if row.tag else row.name

        def line(name, now, spec):
            """A change line: its drops' table, the parent's levels first ("was": how many columns), then this
            column's; a row whose outcomes differ is "changed"."""
            d = spec.drop
            before = level_groups(d, lp, row.look) if p else []
            after = level_groups(d, lc, row.look)
            cols = [group_head(g[0], len(before) == 1) for g in before] + \
                [group_head(g[0], len(after) == 1) for g in after]
            b = block(d, before + after, row.look)
            k = len(before)
            if "rows" in b and k:
                for r in b["rows"]:
                    r.append(set(r[1][:k]) != set(r[1][k:]))
            return {"sec": title, "name": name, "link": row.link, "cols": cols, "was": k, "b": b, "key": now}
        if len(groups) == 1 and len(next(iter(groups.values()))) == len(row.specs):
            ((now, _), specs), = groups.items()
            return [line(head, now, specs[0])]
        if len(groups) <= 6:
            return [line(f"{head}: {self.label(row, specs)}", now, specs[0]) for (now, _), specs in groups.items()]
        # many kinds of change: one table, a line per kind (its items, then what they did and do, in short)
        rows = []
        for (now, was), specs in groups.items():
            d = specs[0].drop
            cells = ([cell_words(drop_words(d, lp, row.look, compact=True)[0])] if p else []) + \
                [cell_words(drop_words(d, lc, row.look, compact=True)[0])]
            rows.append([cap(self.label(row, specs)), cells])  # every line changed: none marked
        cols = ([group_head(list(lp), True)] if p else []) + [group_head(list(lc), True)]
        return [{"sec": title, "name": head, "link": row.link, "cols": cols, "was": 1 if p else 0,
                 "b": {"head": "Items", "rows": rows, "items": True}, "key": json.dumps(sorted(g[0] for g in groups))}]

    def label(self, row, specs):
        """Some of a row's drops in words: its tier or kind when they are all of it, else their names."""
        codes = {(s.code, s.quality) for s in specs}
        if row.split and not row.look:
            keys = {}
            for s in row.specs:
                keys.setdefault(self.split_key(row, s), set()).add((s.code, s.quality))
            whole = [k for k, cs in keys.items() if cs <= codes]
            if whole and set().union(*(keys[k] for k in whole)) == codes:
                return join_and(whole)
        return rune_label(specs) or names_of(specs)

    def data(self):
        """Everything the page shows; with `ref`, its texts in one list (cells and lines give their index)."""
        if self._data is not None:
            return self._data
        cols = []
        for levels in self.columns:
            title, hides = self.column_title(levels)
            cols.append({"levels": levels, "title": title, "hides": hides, "intro": INTROS.get(title, "")})
        sections = []
        for title, rows in self.sections:
            links = {r.link for r in rows}
            sections.append({"name": title, "link": links.pop() if len(links) == 1 else None,
                             "note": SECTION_NOTES.get(title, ""), "color": SECTION_COLORS.get(title, ""),
                             "rows": [self.row_data(r) for r in rows]})
        _, season, date = build.load_version()
        version = build.version_text(season, date)
        foot = (f"Built from the filter's sections ({version}) by tools/level_map.py: every item that drops, run "
                "through the filter's own rules at every filter level and character level, on the ground outside "
                "town in Nightmare or Hell (the Main version).")
        self._data = {"version": version, "levels": self.levels, "cols": cols, "sections": sections,
                      "cards": self.changes(cols), "links": {k: list(v) for k, v in LINKS.items()}, "foot": foot}
        return self._data

    def payload(self):
        """The page's data with its texts in one list: cell details and change lines give their index."""
        data = json.loads(json.dumps(self.data()))
        texts, index = [], {}

        def ref(t):
            if t not in index:
                index[t] = len(texts)
                texts.append(t)
            return index[t]
        def pack(b):
            if "inline" in b:
                return {"i": [ref(t) for t in b["inline"]]}
            out = {"h": ref(b["head"]), "r": [[ref(r[0]), [ref(t) for t in r[1]]] + ([1] if r[2:] == [True] else [])
                                              for r in b["rows"]]}
            if b.get("items"):
                out["x"] = 1
            return out
        for sec in data["sections"]:
            for row in sec["rows"]:
                for x in [row] + row["subs"]:
                    for c in x["cells"]:
                        c["d"] = [{"t": ref(e["t"])} if "t" in e else
                                  {"n": ref(e["n"]), "c": [ref(t) for t in e["c"]], "b": pack(e["b"])}
                                  for e in c["d"]]
        secs = [sec["name"] for sec in data["sections"]]
        for card in data["cards"]:
            for ln in card["lines"]:
                ln["sec"] = secs.index(ln["sec"])
                ln["cols"] = [ref(t) for t in ln["cols"]]
                ln["b"] = pack(ln["b"])
                del ln["link"], ln["key"]
        data["texts"] = texts
        return data


def print_rows(page, needle):
    data = page.data()
    heads = [f"{c['levels'][0]}" + (f"-{c['levels'][-1]}" if len(c["levels"]) > 1 else "") for c in data["cols"]]
    for sec in data["sections"]:
        for row in sec["rows"]:
            if needle.lower() not in row["name"].lower():
                continue
            print(f"== {sec['name']} / {row['name']}")
            for h, c in zip(heads, row["cells"]):
                print(f"  {h:>5}  {c['t']}")
                for e in c["d"]:
                    print(f"         {e['t']}" if "t" in e else
                          f"         {e['n'] + ': ' if e['n'] else ''}{block_text(e['b'], e['c'])}")
            for sub in row["subs"]:
                print(f"  -- {sub['name']}")
                for h, c in zip(heads, sub["cells"]):
                    print(f"    {h:>5}  {c['t']}")


def print_changes(page):
    data = page.data()
    cols = data["cols"]

    def lv(c):
        return T.level_runs(cols[c]["levels"])
    for card in data["cards"]:
        col = cols[card["col"]]
        print(f"== {lv(card['col']).capitalize()} · {col['title']}" + (f" (hides {', '.join(col['hides'])})"
                                                                         if col["hides"] else "")
              + f" — on top of {lv(card['parent'])}")
        for ln in card["lines"]:
            extra = f" (as on {lv(ln['as'])})" if ln.get("as") is not None else ""
            print(f"  [{ln['sec']}] {ln['name']}: {block_text(ln['b'], ln['cols'])}{extra}")


def page_text(data):
    """The page: the template as a full HTML document with the data embedded."""
    text = T.DOC_HEAD + TEMPLATE.read_text(encoding="utf-8") + "\n</body>\n</html>\n"
    return text.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")))


def findings(page):
    """What the page could not model, and launcher names the rules disagree with."""
    out = sorted(page.rules.unknown)
    for c, levels in enumerate(page.columns):  # a launcher name's "Hides H5" without its potion hidden there
        for lv in levels:
            name = page.levels[lv]
            claims = [h.strip() for h in name.split(" - Hides ")[1].split(",")] if " - Hides " in name else []
            for claim in claims:
                code = LEVEL_CLAIMS.get(claim)
                if not code:
                    continue
                spec = next(s for _, row in page.all_rows() for s in row.specs if s.code == code)
                st = spec.drop.state(lv, 99)
                if not st or not st[1]:
                    out.append(f"level {lv} ({name}): says it hides {claim}, but {spec.name} is not hidden there at "
                               "character level 99")
    groups = defaultdict(list)  # levels of one launcher group (its name before " - ") in more than one column
    for c, levels in enumerate(page.columns):
        for lv in levels:
            groups[page.levels[lv].split(" - ")[0].strip()].append(c)
    for name, cs in groups.items():
        if len(set(cs)) > 1 and name not in ("Endgame Filtering",):
            out.append(f"{name}: its levels fall in {len(set(cs))} columns (they differ in more than potions)")
    return out


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="The filter levels, from the filter's own rules.")
    ap.add_argument("--check", action="store_true", help=f"exit 1 if {PAGE.name} is out of date")
    ap.add_argument("--findings", action="store_true", help="what the page could not model")
    ap.add_argument("--row", help="print the rows whose name has this text")
    ap.add_argument("--changes", action="store_true", help="print what changes from level to level")
    args = ap.parse_args()
    page = Page()
    if args.row:
        print_rows(page, args.row)
        return
    if args.changes:
        print_changes(page)
        return
    text = page_text(page.payload())
    current = PAGE.read_text(encoding="utf-8") if PAGE.exists() else ""
    if args.check:
        if current != text:
            print(f"{PAGE.name} is out of date: run python tools/level_map.py (build.bat does)")
            sys.exit(1)
        print("filter level map up to date")
        return
    if current != text:
        PAGE.write_text(text, encoding="utf-8", newline="\n")
        print(f"updated {PAGE.name} ({len(text) // 1024} KB)")
    checks = findings(page)
    if args.findings:
        for line in checks:
            print(line)
    print(f"filter level map: {len(checks)} finding(s)" + (": python tools/level_map.py --findings lists them"
                                                           if checks and not args.findings else ""))


if __name__ == "__main__":
    main()
