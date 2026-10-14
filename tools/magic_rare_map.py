#!/usr/bin/env python3
"""
The players' pages of magic and rare items: Erazure-Magic-Items.html and Erazure-Rare-Items.html. For every armor,
weapon, quiver, circlet, ring, amulet, jewel and charm base (charms on the magic page only: PD2's ItemTypes.txt gives
charms no Rare flag), how the filter shows it when it drops unidentified, filter level by filter level: the look it
gets, its minimap icon, chat line and drop sound, and when it is hidden, read from the filter's own rules.

    python tools/magic_rare_map.py              writes both pages (build.bat and the hook run it)
    python tools/magic_rare_map.py --check      exit 1 if a page is out of date (CI)
    python tools/magic_rare_map.py --findings   what it could not put in words, and filter quirks it noticed (a 190/200
                                                rule that applies to no base; a minimap icon on an item a rule hides)
    python tools/magic_rare_map.py --base uar,jew [--quality RARE]   prints those bases' rows (to check the wording)

How it reads the filter: the engine of tools/base_map.py (its rules, folding, simplifying, plain words and rows), with
what every fresh magic or rare drop has instead of a white one's: its quality, unidentified, on the ground outside
town (in town nothing is hidden), never superior, low quality, a runeword, gemmed or corrupted; ethereal or not is a
column. Map tests other than the town's stay conditions (magic jewels in The Fallen Gardens and The Diamond Gate). A
base's quality level (QLVL, docs/pd2-bases.tsv) is folded in per base: S14's affix level is the higher of item level and
quality level, so 190's 85+ look is always on for a Sacred Armor (quality level 85).

The pages (the Non-magical Bases page's layout): one table per item type, a header per group of bases of one tier and
socket maximum with the same rows, then one row per case: Levels, Shows (Notify / Hidden pill, or the look as the game
draws it: the quality's color, "Eth" when the row is for ethereal items, a charm's item level), Icon, Chat, then the
conditions: Eth, Character level, Class, Item level, Crafted affix level, Other. Levels without a row show the plain
name. The Main version (the variants differ only in the rare jewel's PoE drop sound, 190:13-14).
"""
import argparse
import copy
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import base_map as B  # noqa: E402
import tier_map as T  # noqa: E402

ROOT = B.ROOT
TEMPLATE = ROOT / "tools" / "magic_rare_map_template.html"
# quality word -> (the page, its marker and scope class, its title, the name's color, the word for it)
PAGES = {"MAG": (ROOT / "Erazure-Magic-Items.html", "magic-map", "Erazure Magic Items", "BLUE", "magic"),
         "RARE": (ROOT / "Erazure-Rare-Items.html", "rare-map", "Erazure Rare Items", "YELLOW", "rare")}
NOTES = {  # the page's own lines in "how to read it"
    "MAG": "<li>Charms drop only as magic items (the game has no rare charms). The number after the dot in a charm's "
           "look is its item level; a row shows its lowest.</li>",
    "RARE": "<li>The PoE versions of the filter play their own drop sound for rare jewels.</li>",
}
DROP_TYPES = {"armo", "weap", "bowq", "xboq", "ring", "amul", "jewl", "char"}  # what drops magic or rare (no maps)
GEAR_TYPES = {"armo", "weap", "bowq", "xboq"}  # bases with a tier and sockets in the group header
MAGIC_ONLY = {"char"}  # ItemTypes.txt: charms (char, scha, mcha, lcha) have no Rare flag
# Item type -> category: the first match in the base's item types (jewelry, jewels and charms first, then the Bases
# page's). The order of the page.
CATEGORIES = [("jewl", "Jewels"), ("ring", "Rings"), ("amul", "Amulets"), ("char", "Charms")] + B.CATEGORIES
ORDER = ["Jewels", "Rings", "Amulets", "Charms"] + B.ORDER
# The areas a magic/rare rule names (Levels.txt Id, names from the string tables): the Fallen Gardens map (t53) starts
# in 183 (Misc.txt len).
AREA_NAMES = {183: "The Fallen Gardens", 184: "The Diamond Gate"}
COLS = ["eth", "clvl", "class", "ilvl", "craft", "skills", "other"]  # the pages' columns
NAME_MARK = "\x00"  # the base's name in a look while bases are grouped (a group draws its first base's name)


def category(info):
    types = set(info["types"])
    for t, cat in CATEGORIES:
        if t in types:
            return cat
    return None


def mapid_values(m):
    """The area ids a MAPID comparison takes."""
    op, a, b = m.group(2), int(m.group(3)), m.group(4)
    if op == "=":
        return {a}
    if op == "~":
        return set(range(a, int(b) + 1))
    return set(range(0, a)) if op == "<" else set(range(a + 1, 256))


def drop_atom(toggles, quality):
    """What every fresh unidentified drop of this quality has: 1 / 0, or None for a word that depends on the base or
    the case."""
    def atom(word):
        if word in toggles:
            return toggles[word]
        if word in ("TRUE", "FALSE"):
            return int(word == "TRUE")
        if word in T.QUALITIES:
            return int(word == quality)
        if word == "ID":
            return 0  # magic and rare items drop unidentified
        if word == "GROUND":
            return 1
        if word in T.OTHER_PLACES or word in ("RW", "GEMMED", "SUP", "INF"):
            return 0
        if word in ("ALLDISCOVERED", "ANYDISCOVERED"):
            return 1
        m = T.COMPARE_RE.match(word)
        if m:
            key = m.group(1)
            if key == "MAPID":  # outside town (hidden items always show in town); other areas stay a condition
                return T.compare(T.FIELD_ID, m) if mapid_values(m) & T.TOWN_IDS else None
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
        self.gear = bool(types & GEAR_TYPES)
        self.magic_only = bool(types & MAGIC_ONLY)
        self.groups = T.item_groups(types)
        if self.tier in T.TIER_GROUP:
            self.groups.add(T.TIER_GROUP[self.tier])
        self.sockets = info["sockets"]
        self.area = info["width"] * info["height"]
        self.qlvl = info["qlvl"]

    def atom(self):
        """Words this base decides."""
        def atom(word):
            if word in T.GROUP_WORDS or word in T.TIER_GROUP.values():
                return int(word in self.groups)
            m = T.COMPARE_RE.match(word)
            if m:
                key = m.group(1)
                if key == "QLVL":
                    return T.compare(self.qlvl, m)
                if key == "AREA":
                    return T.compare(self.area, m)
                return None
            if T.is_code(word):
                return int(word == self.code)
            return None
        return atom


class Simplifier(B.Simplifier):
    """base_map's, with "not" pushed into a choice of plain values (De Morgan), so each value gets its column:
    !(ILVL>84 OR CRAFTALVL>84) reads "item level below 85, crafted affix level below 85"."""

    def negate(self, x):
        if x[0] in ("and", "or") and all(self.literal(y) for y in x[1]):
            return ("or" if x[0] == "and" else "and", tuple(self.negate(y) for y in x[1]))
        return super().negate(x)

    def simplify(self, node, ctx=None):
        if node[0] == "not":
            x = self.simplify(node[1], ctx)
            if x[0] in ("and", "or") and all(self.literal(y) for y in x[1]):
                return self.simplify(self.negate(x), ctx)
            return self.negate(x) if x[0] in ("c", "set", "bool") else ("not", x)
        return super().simplify(node, ctx)

    def simplify_and(self, kids, ctx):
        """An AND inside an AND (what De Morgan makes of "not (A or B)") is one AND, so its values meet the others':
        "Assassin or Amazon" and "neither" come out as never."""
        flat = []
        for x in kids:
            if x[0] == "not":
                x = self.simplify(x, ctx)
            flat.extend(x[1] if x[0] == "and" else [x])
        return super().simplify_and(flat, ctx)


def classify(rules):
    """Each rule's kind: hide / show (stops with a look of its own) / layer (continues) / last (the catch-all)."""
    for r in rules:
        r.tag, r.display = None, None
        if not r.cont:
            r.kind = "hide" if T.look_of(r.raw, r.name) == "HIDDEN" else "show"
            r.display = r.name
        else:
            r.kind = "layer"
    rules[-1].kind = "last"


def draw(text, color):
    """A name output as the game draws it: lines (top first) of [color, text]; `color` until a code changes it."""
    lines = []
    for part in text.split("%NL%"):
        segs, pos = [], 0
        for m in T.COLOR_RE.finditer(part):
            if m.start() > pos:
                segs.append([color, part[pos:m.start()]])
            color, pos = m.group(1), m.end()
        if pos < len(part):
            segs.append([color, part[pos:]])
        segs = [[c, re.sub(r"%[A-Z_]+%", "", t.replace("%PERCENT%", "%"))] for c, t in segs]
        segs = [s for s in segs if s[1]]
        if segs:  # no spaces at the ends
            segs[0][1], segs[-1][1] = segs[0][1].lstrip(), segs[-1][1].rstrip()
            segs = [s for s in segs if s[1]]
        lines.append(segs)
    return [x for x in reversed(lines) if x]  # BH: the first line of the text is the bottom line on screen


def union(a, b, simp):
    """a or b as one condition when they differ in one value: a set (base_map's: item level 30–59 and 60–89) or a
    yes and a no (an Assassin and not an Assassin: either)."""
    m = B.Analysis.union(a, b, simp)
    if m is not None:
        return m
    ca = {B.canon(x): x for x in B.conj(a)}
    cb = {B.canon(x): x for x in B.conj(b)}
    da = [x for k, x in ca.items() if k not in cb]
    db = [x for k, x in cb.items() if k not in ca]
    if len(da) == len(db) == 1 and da[0][0] == db[0][0] == "bool" and da[0][1] == db[0][1]:
        return simp.simplify(B.Simplifier.make("and", [x for k, x in ca.items() if k in cb]))
    return None


def area_words(iv):
    """MAPID values in words: "in The Fallen Gardens or The Diamond Gate" / "outside ..."."""
    name = (lambda v: AREA_NAMES.get(v, f"area {v}"))
    vals = B.runs(iv)
    if vals is not None:
        return "in " + B.join_or(map(name, vals))
    out = B.runs(B.comp(iv, B.domain("MAPID", None)))
    if out is not None:
        return "outside " + B.join_or(map(name, out), "and")
    return "in areas " + " or ".join(f"{a}" if a == b else f"{a}–{b}" for a, b in iv)


class Words(B.Words):
    """The Non-magical Bases page's words, plus the crafted affix level (a column of its own) and areas."""
    RANK = dict(B.Words.RANK, CRAFTALVL=4, MAPID=8)

    def set_words(self, key, iv, base, where):
        if key == "CRAFTALVL":
            return self.span(iv, B.domain(key, base), "crafted affix level below {}", "crafted affix level {}+",
                             "crafted affix level {}–{}", "crafted affix level {}")
        if key == "MAPID":
            return area_words(iv)
        return super().set_words(key, iv, base, where)

    def column(self, x):
        if x[0] == "set" and x[1] == "CRAFTALVL":
            return "craft"
        col = super().column(x)
        return col if col in COLS else "other"

    def cell(self, col, parts, base, where):
        if col == "craft":
            return self.span(list(parts[0][2]), B.domain("CRAFTALVL", base), "below {}", "{}+", "{}–{}", "{}")
        return super().cell(col, parts, base, where)


class Analysis(B.Analysis):
    """base_map's analysis for unidentified magic and rare drops: the rules are folded per quality, and the "inf"
    argument of its methods is the quality word."""

    def __init__(self):
        self.rules, self.named_src, self.toggles, self.version = B.load_filter()
        classify(self.rules)
        self.bases = []
        for code, info in T.load_bases().items():
            if set(info["types"]) & DROP_TYPES and info["spawnable"] and code not in T.QUEST_CODES:
                base = Base(code, info)
                if base.cat:
                    self.bases.append(base)
        self.kept, self.layers, self.named_trees = {}, {}, {}
        for q in PAGES:
            atom = drop_atom(self.toggles, q)
            self.named_trees[q] = {k: T.fold(T.compile_rpn(v), atom) for k, v in self.named_src.items()}
            self.kept[q], self.layers[q] = [], []  # rows' rules; %CONTINUE% rules that change the name
            for r in self.rules:
                if r.kind == "last":
                    continue
                tree = T.fold(r.rpn, atom)
                if tree == ("c", 0):
                    continue
                if r.kind == "layer" and r.name.strip() != "%NAME%":
                    self.layers[q].append(self.folded(r, tree))
                if r.kind != "layer" or r.notify:
                    self.kept[q].append(self.folded(r, tree))
        self.cache = {}
        self.named_tags = {k: k[len(B.NAMED):].split("_")[0].title() for k in self.named_src}
        self.words = Words(B.load_skills(), B.load_tabs(), self.named_tags)
        self.used = defaultdict(set)  # rule number -> bases it applies to
        self.hidden_icons = defaultdict(lambda: defaultdict(set))  # (icon rule, hide rule) -> {base: levels}
        self.sounds = T.load_sounds()

    @staticmethod
    def folded(r, tree):
        """The rule with its condition folded for one quality (a copy: the other quality folds its own)."""
        c = copy.copy(r)
        c.tree = tree
        words = T.tree_words(tree, set())
        c.codes = {w for w in words if T.is_code(w) and not T.COMPARE_RE.match(w)}
        c.named = any(w.startswith(B.NAMED) for w in words)
        c.words = words
        c.keys = {m.group(1) for m in map(T.COMPARE_RE.match, words) if m}
        return c

    def fold_rule(self, r, base, q, atom, simp, named):
        """{level: condition} of one rule for this base; the same for every base with the same item groups (and
        sockets, quality level or size where the rule tests them) unless it names the base's code."""
        w = r.words
        key = None if r.named else (
            q, r.n, base.code if base.code in r.codes else None, frozenset(g for g in base.groups if g in w),
            base.sockets if "SOCK" in r.keys else None, base.qlvl if "QLVL" in r.keys else None,
            base.area if "AREA" in r.keys else None)
        if key is not None and key in self.cache:
            return self.cache[key]
        t = T.fold_tree(r.tree, atom)
        per = self.per_level(t, simp, named) if t != ("c", 0) else {}
        if key is not None:
            self.cache[key] = per
        return per

    def fold_base(self, base, q):
        """[(rule, {level: condition})] for the rules that can apply to this base (display and notification rules)."""
        atom = base.atom()
        simp = Simplifier(base)
        named = {}
        for name, tree in self.named_trees[q].items():
            t = T.fold_tree(tree, atom)
            named[name] = self.per_level(t, simp, {}) if t != ("c", 0) else None
        out = []
        for r in self.kept[q]:
            per = self.fold_rule(r, base, q, atom, simp, named)
            if per:
                out.append((r, per))
        return out, named, simp

    def lines(self, base, q):
        """The base's cases, level by level: [{kind, levels, cond, display, icons, chat, sound, rules}]. BH's two
        passes, then joined:
        - the display: the first rule without %CONTINUE% that matches hides the item or gives it its look (each rule
          loses the cases an earlier one with another display decides; one with the same display only overlaps);
          what no rule takes shows the plain name (the catch-all);
        - the notification (tier_map's model of BH): matching notification rules in order, hidden or not; icons stack
          up to the first one without %CONTINUE%; the first one its %TIER-n% allows gives the chat line and sound.
        Each display case gets the notifications of its cases (split where only some of them have one); a
        notification on the plain name is a Notify case."""
        folded, named, simp = self.fold_base(base, q)
        for r, _ in folded:
            self.used[r.n].add(base.code)
        out = []
        for lv in range(13):
            shown, earlier = [], []  # display cases [(rule, case)]; the stopping rules so far, with their conditions
            for r, per in folded:
                if r.kind not in ("hide", "show") or lv not in per:
                    continue
                c = per[lv]
                for e, ec in earlier:
                    if e.display == r.display or not simp.meet(c, ec):
                        continue
                    c = simp.subtract(c, ec)
                    if c == ("c", 0):
                        break
                earlier.append((r, per[lv]))
                if c != ("c", 0):
                    shown.append((r, c))
            # a case another case with the same display has says nothing new
            shown = [(r, c) for i, (r, c) in enumerate(shown) if not any(
                j != i and e.display == r.display and simp.implies(c, d) and (j < i or not simp.implies(d, c))
                for j, (e, d) in enumerate(shown))]
            plain = ("c", 1)
            for _, ec in earlier:
                if plain != ("c", 0) and simp.meet(plain, ec):
                    plain = simp.subtract(plain, ec)
            notes, stoppers, takers = [], [], []  # [(rule, icon case, chat case)]
            for r, per in folded:
                if not r.notify or lv not in per:
                    continue
                c = per[lv]
                for s in stoppers:
                    if c != ("c", 0) and simp.meet(c, s):
                        c = simp.subtract(c, s)
                allowed = r.tier is None or lv == 0 or r.tier >= lv
                chat = c if allowed else ("c", 0)
                for t in takers:
                    if chat != ("c", 0) and simp.meet(chat, t):
                        chat = simp.subtract(chat, t)
                if c != ("c", 0):
                    notes.append((r, c, chat, c if allowed else ("c", 0)))
                if allowed:
                    takers.append(per[lv])
                if not r.cont:
                    stoppers.append(per[lv])
            for display, case in shown + [(None, plain)]:
                if case == ("c", 0):
                    continue
                pieces = [(case, [])]
                for r, ic, cc, own in notes:
                    if B.has_skill(ic):  # a +skills notification (310): a Notify row of its own, the look stays whole
                        # (with its own chat line: where an earlier rule has it, the item gets one all the same)
                        for x, ns in self.with_note([(case, [])], r, ic, own, simp):
                            if ns:
                                pieces.append((x, ns, "side"))
                        continue
                    pieces = [p for p in pieces if len(p) == 3] + self.with_note(
                        [p for p in pieces if len(p) == 2], r, ic, cc, simp)
                for piece in pieces:
                    x, ns = piece[0], piece[1]
                    if len(piece) == 3:  # a side note: a Notify row of its own
                        talker = next((r for r, ch in ns if ch), None)
                        row = {"kind": "notify", "display": None, "icons": tuple(r.icons for r, _ in ns if r.icons),
                               "chat": talker is not None, "sound": talker.sound if talker else 0,
                               "rules": [r for r, _ in ns]}
                        for part in self.split(x, simp):
                            out.append(dict(row, levels={lv}, cond=part))
                        continue
                    if display is None and not ns:
                        continue  # the plain name, no notification: no row
                    talker = next((r for r, ch in ns if ch), None)
                    row = {"kind": display.kind if display else "notify", "display": display,
                           "icons": tuple(r.icons for r, _ in ns if r.icons), "chat": talker is not None,
                           "sound": talker.sound if talker else 0, "rules": ([display] if display else []) +
                           [r for r, _ in ns if r is not display]}
                    for part in self.split(x, simp):
                        out.append(dict(row, levels={lv}, cond=part))
        return out

    @staticmethod
    def with_note(pieces, r, icon_case, chat_case, simp):
        """pieces [(case, [(rule, chat)])] with rule r's notification added where it applies (split where it applies
        to only some of a piece's cases, and again where its chat line does)."""
        out = []
        for x, ns in pieces:
            if not simp.meet(x, icon_case):
                out.append((x, ns))
                continue
            inside = simp.simplify(Simplifier.make("and", B.conj(x) + B.conj(icon_case)))
            if inside != ("c", 0):
                talks = simp.simplify(Simplifier.make("and", B.conj(inside) + B.conj(chat_case))) \
                    if chat_case != ("c", 0) and simp.meet(inside, chat_case) else ("c", 0)
                quiet = simp.subtract(inside, chat_case) if talks != ("c", 0) else inside
                if talks != ("c", 0):
                    out.append((talks, ns + [(r, True)]))
                if quiet != ("c", 0):
                    out.append((quiet, ns + [(r, False)]))
            rest = simp.subtract(x, icon_case)
            if rest != ("c", 0):
                out.append((rest, ns))
        return out

    @staticmethod
    def merge_levels(lines, simp):
        """One row per case with all its filter levels ("Levels 10, 12"; lo, hi and, when they have a gap, list), and
        hiding said once: a hide row a narrower set of hide rows covers at a level leaves it to them (they take that
        level), so "not a Necromancer" and "a Necromancer" absorb an "always" at levels 10 and 12. Rows of one look
        and levels that differ in one value (item level 30–59 and 60–89) become one."""
        rows = []
        for x in lines:
            d = x["display"]
            look = (x["kind"], B.canon(x["cond"]), x["icons"], x["chat"], x["sound"],
                    d.name if d is not None and x["kind"] == "show" else "")
            same = next((y for y in rows if y["look"] == look), None)
            if same:
                same["levels"] |= x["levels"]
                same["rules"] += [rr for rr in x["rules"] if rr not in same["rules"]]
            else:
                rows.append(dict(x, look=look, levels=set(x["levels"]), rules=list(x["rules"])))
        merged = []  # one value apart: one row
        for x in rows:
            for y in merged:
                if y["look"][0] == x["look"][0] and y["look"][2:] == x["look"][2:] and y["levels"] == x["levels"]:
                    m = union(y["cond"], x["cond"], simp)
                    if m is not None:
                        y["cond"], y["rules"] = m, y["rules"] + [rr for rr in x["rules"] if rr not in y["rules"]]
                        y["look"] = (y["look"][0], B.canon(m)) + y["look"][2:]
                        break
            else:
                merged.append(x)
        rows = merged
        hides = [y for y in rows if y["kind"] == "hide" and not y["icons"] and not y["chat"]]
        width = (lambda y: 0 if y["cond"] == ("c", 1) else len(B.conj(y["cond"])))  # fewer parts: hides more
        for z in sorted(hides, key=width):
            for lv in sorted(z["levels"]):
                cand = [y for y in hides if y is not z and y["levels"] and
                        (lv in y["levels"] or simp.implies(y["cond"], z["cond"]))]
                cand = [y for y in cand if not any(o is not y and simp.implies(y["cond"], o["cond"]) for o in cand)]
                if cand and simp.implies(z["cond"], simp.simplify(("or", tuple(y["cond"] for y in cand)))):
                    for y in cand:
                        if lv not in y["levels"]:
                            y["levels"].add(lv)
                            y["rules"] += [rr for rr in z["rules"] if rr not in y["rules"]]
                    z["levels"].discard(lv)
        out = []
        for y in rows:
            if y["levels"]:
                lv = sorted(y["levels"])
                y.update(lo=lv[0], hi=lv[-1], list=None if lv == list(range(lv[0], lv[-1] + 1)) else lv)
                out.append(y)
        return out

    def rows(self, base, q):
        """The base's rows for a page, in order: [{kind, lo, hi, list, cond, display, icons, chat, sound, cells,
        image, title, rules, key}]."""
        out = []
        simp = Simplifier(base)
        for line in self.merge_levels(self.lines(base, q), simp):
            cond, r = line["cond"], line["rules"][0]
            if line["kind"] == "hide" and line["icons"]:  # (findings) BH draws the icon of a hidden item
                for n in line["rules"][1:]:
                    if n.icons:
                        self.hidden_icons[(n.n, line["display"].n)][base.code].update(line["levels"])
            parts = defaultdict(list)
            for x in ([] if cond == ("c", 1) else B.conj(cond)):
                parts[self.words.column(x)].append(x)
            cells = {}
            for col, xs in parts.items():
                if len(xs) > 1:  # one column's parts from two places: as one
                    xs = B.conj(simp.simplify(B.Simplifier.make("and", xs)))
                cells[col] = self.words.cell(col, xs, base, r.where)
            lit = {x[1]: (x[2] if x[0] == "bool" else list(x[2])) for x in B.conj(cond) if x[0] in ("bool", "set")}
            rank = (lambda v: 0 if v is None else 2 if v else 1)  # any, non-eth, eth
            line.update(cells=cells, cases=[], key=(
                B.KIND_ORDER[line["kind"]], line["lo"], line["hi"], rank(lit.get("ETH")), B.span_key(lit.get("CLVL")),
                cells.get("class", ""), B.span_key(lit.get("ILVL")), cells.get("craft", ""), cells.get("other", ""),
                r.n))
            line["image"], line["title"] = self.image_of(line, base, q, simp)
            out.append(line)
        return sorted(out, key=lambda x: x["key"])

    def image_of(self, line, base, q, simp):
        """(The look of a 'shows as' row as the game draws it; its description, if any): the name layers its case always
        meets (the quality's color, Eth, a charm's item level), then the rule's own display."""
        if line["kind"] != "show":
            return None, None
        r, cond, lv = line["display"], line["cond"], line["lo"]
        atom = base.atom()
        name = NAME_MARK  # the base's name: filled in per group (bases with the same looks share one)
        for layer in self.layers[q]:
            if layer.n >= r.n:
                break
            c = self.fold_rule(layer, base, q, atom, simp, {}).get(lv)
            if c is not None and simp.implies(cond, c):
                name = layer.name.replace("%NAME%", name)
        text = r.name.replace("%NAME%", name).replace("%BASENAME%", NAME_MARK)
        ilvl = {x[1]: x[2] for x in B.conj(cond) if x[0] == "set"}.get("ILVL")
        if ilvl:
            text = text.replace("%ILVL%", str(ilvl[0][0]))  # the row's lowest item level
        title = None
        desc = re.search(r"\{(.*?)\}", r.raw)
        if desc and desc.group(1).strip() != "%NAME%":
            title = re.sub(r"%[A-Z_]+%", "", desc.group(1).replace("%NAME%", "").replace("%CL%", " / ")
                           .replace("%NL%", " / ")).strip(" /") or None
        return draw(text, PAGES[q][3]), title


# ---------------------------------------------------------------- the page data

def row_data(x, ref):
    """[kind, lo, hi, [one text index + 1 per column, 0 = any], {image, icons, chat, sound, levels}] (no rule refs:
    those come per group)."""
    cells = [ref(x["cells"][c]) + 1 if x["cells"].get(c) else 0 for c in COLS]
    extra = {}
    if x["image"]:
        extra["b"] = x["image"]
    if x["title"]:
        extra["bt"] = ref(x["title"])
    if x["icons"]:
        extra["i"] = [list(layer) for layer in x["icons"]]  # stacked, as BH draws them
    if x["chat"]:
        extra["h"] = 1
    if x["sound"]:
        extra["o"] = x["sound"]
    if x.get("list"):
        extra["v"] = x["list"]  # its filter levels, when they have a gap
    return [x["kind"], x["lo"], x["hi"], cells, extra]


def build_data(an, q):
    texts, index = [], {}

    def ref(s):
        if s not in index:
            index[s] = len(texts)
            texts.append(s)
        return index[s]

    tiers = ["normal", "exceptional", "elite"]
    groups, by_key, cats = [], {}, []
    bases = [b for b in an.bases if q == "MAG" or not b.magic_only]
    for base in sorted(bases, key=lambda b: (ORDER.index(b.cat), tiers.index(b.tier) if b.tier in tiers else 3, b.name)):
        if base.cat not in cats:
            cats.append(base.cat)
        rows = an.rows(base, q)
        data = [row_data(x, ref) for x in rows]
        # bases of one type, tier and socket maximum with the same rows: one group (its header holds for each)
        key = (base.cat, base.tier if base.gear else None, base.sockets if base.gear else None, json.dumps(data))
        if key not in by_key:
            by_key[key] = {"names": [], "bases": [], "data": data, "wheres": [set() for _ in rows]}
            groups.append(by_key[key])
        g = by_key[key]
        g["names"].append([base.code, base.name])
        g["bases"].append(base)
        for j, x in enumerate(rows):
            g["wheres"][j].update(x["rules"])
    out = []
    for g in groups:
        b0 = g["bases"][0]
        rows = [row[:4] + [dict(row[4], w=ref(B.where_text(sorted(w, key=lambda r: r.n))))]
                for row, w in zip(g["data"], g["wheres"])]
        for row in rows:  # a look draws the group's first base
            if "b" in row[4]:
                row[4]["b"] = [[[c, t.replace(NAME_MARK, b0.name)] for c, t in line] for line in row[4]["b"]]
        out.append({"n": g["names"], "t": B.TIER_NAMES.get(b0.tier, "") if b0.gear else "", "k": b0.cat,
                    "s": b0.sockets if b0.gear else None, "l": rows})
    sounds = {}
    for g in out:
        for row in g["l"]:
            if "o" in row[4]:
                sounds[row[4]["o"]] = an.sounds.get(row[4]["o"], {}).get("name", str(row[4]["o"]))
    word = PAGES[q][4]
    kinds = "armor, weapon, quiver, ring, amulet, jewel" + (" and charm" if q == "MAG" else "")
    foot = (f"Built from the filter's sections ({an.version}) by tools/magic_rare_map.py: every {word} {kinds} base "
            "run through the filter's own rules at every filter level, unidentified on the ground (the Main version).")
    return {"version": an.version, "levels": T.load_levels(), "palette": T.load_palette(), "cats": cats, "cols": COLS,
            "texts": texts, "groups": out, "sounds": sounds, "foot": foot}


def findings(an):
    out = []
    for w, where in sorted(an.words.unknown.items()):
        out.append(f"words left as they are: {w} ({', '.join(sorted(where)[:3])})")
    for q in PAGES:
        for r in an.kept[q]:  # (a 190/200 rule for this quality; Jewel Fragments name none)
            if r.where.startswith(("sections/190-", "sections/200-")) and r.kind in ("hide", "show") \
                    and re.search(rf"\b{q}\b", r.cond) and not an.used.get(r.n):
                out.append(f"{r.where}: applies to no {PAGES[q][4]} base on the ground ({r.kind})")
    names = {b.code: b.name for b in an.bases}
    for (n, h), by_base in sorted(an.hidden_icons.items()):
        r, hide = an.rules[n], an.rules[h]
        levels = sorted(set().union(*by_base.values()))
        bases = ", ".join(sorted(names[c] for c in by_base))
        out.append(f"{r.where} (notification): its minimap icon shows on items {hide.where} hides "
                   f"({T.level_runs(levels)}): {bases}")
    return out


def page_text(data, q):
    page, name, title, color, word = PAGES[q]
    text = TEMPLATE.read_text(encoding="utf-8")
    for token, value in (("__MAP__", name), ("__TITLE__", title), ("__QUALITY__", word),
                         ("__COLOR__", color.lower()), ("__NOTES__", NOTES[q])):
        text = text.replace(token, value)
    page_html = T.DOC_HEAD + text + "\n</body>\n</html>\n"
    return page_html.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")))


def print_rows(an, codes, qualities):
    """--base: the rows of these bases, column by column (to check the wording)."""
    heads = {"eth": "Eth", "clvl": "Char level", "class": "Class", "ilvl": "Item level", "craft": "Crafted affix level",
             "skills": "Skills", "other": "Other"}
    for code in codes:
        base = next((b for b in an.bases if b.code == code), None)
        if base is None:
            print(f"== {code}: not a magic or rare drop")
            continue
        for q in qualities:
            if q == "RARE" and base.magic_only:
                continue
            print(f"== {base.name} ({base.code}, {base.cat}, {base.tier}, {base.sockets} sockets, quality level "
                  f"{base.qlvl}) as {PAGES[q][4]}")
            for x in an.rows(base, q):
                shows = "".join(t for line in (x["image"] or []) for _, t in line).replace(NAME_MARK, base.name) \
                    or x["kind"]
                icon = "icon" if x["icons"] else ""
                chat = "chat" if x["chat"] else ""
                cells = " | ".join(f"{heads[c]}: {x['cells'][c]}" for c in COLS if x["cells"].get(c))
                levels = T.level_runs(x["list"]).capitalize() if x.get("list") else B.level_text(x["lo"], x["hi"])
                print(f"  {levels:13} {shows[:28]:28} {icon:4} {chat:4}  {cells or 'always'}"
                      f"  [{B.where_text(x['rules'])}]")


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Magic and rare items, from the filter's own rules.")
    ap.add_argument("--check", action="store_true", help="exit 1 if a page is out of date")
    ap.add_argument("--findings", action="store_true", help="what the pages could not put in words, and quirks")
    ap.add_argument("--base", help="print these bases' rows (codes, comma-separated) instead of writing the pages")
    ap.add_argument("--quality", choices=sorted(PAGES), help="with --base: one quality only")
    args = ap.parse_args()
    an = Analysis()
    if args.base:
        print_rows(an, args.base.split(","), [args.quality] if args.quality else list(PAGES))
        return
    stale = []
    for q, (page, *_rest) in PAGES.items():
        text = page_text(build_data(an, q), q)
        current = page.read_text(encoding="utf-8") if page.exists() else ""
        if current == text:
            continue
        if args.check:
            stale.append(page.name)
        else:
            page.write_text(text, encoding="utf-8", newline="\n")
            print(f"updated {page.name} ({len(text) // 1024} KB)")
    if args.check:
        if stale:
            print(f"{', '.join(stale)} out of date: run python tools/magic_rare_map.py (build.bat does)")
            sys.exit(1)
        print("magic and rare pages up to date")
        return
    checks = findings(an)
    if args.findings:
        for line in checks:
            print(line)
    print(f"magic and rare pages: {len(checks)} finding(s)" + (
        ": python tools/magic_rare_map.py --findings lists them" if checks and not args.findings else ""))


if __name__ == "__main__":
    main()
