#!/usr/bin/env python3
"""
Where a unique's or set item's label would be cut, and which of the author's cut rules apply there.

BH shows 56 characters of an item's name (line breaks counted, color codes not) and cuts the rest from the end of the
text: the right end of the top line, the item's own name and its sockets. tools/unique_cut_rules.txt says what changes
on an item where that would happen: steps taken in order, each only where the label is still cut after the ones before
it (leave out a roll's tag, a short name, short skill tab labels, two skill tags as one). "Where" is a combination of
base (the item's own and those the cube upgrades it to), ethereal (if it can be), sockets (none, or the most it can
have) and corruption (each outcome the cube gives its slot; amulets also desecrated), judged at the item's highest
rolls, on every filter level of the Main variant (the author's choice, 2026-10-19).

This tool runs the filter's own rules for each such case, with 045 as tools/gen_unique_rolls.py writes it without cut
rules, and measures the label as BH builds it (TrimItemText). A step is simulated: a dropped roll's alias leaves the
item out, tabs / slash put it into their own alias instead, a short name replaces the name on the top line. For each
item and step it writes the BH condition of the cases where the step applies (base code, ETH, SOCK, STAT360 = the
corruption outcome, STAT206 = the desecration) to tools/unique_cut_cases.tsv, and gen_unique_rolls.py puts those into
045. Then it builds that 045 and measures every case again: each label must come out as simulated.

    python tools/label_cuts.py              write tools/unique_cut_cases.tsv, then check the labels with it
    python tools/label_cuts.py --check      change nothing; exit 1 if the cases file is out of date
    python tools/label_cuts.py --report [NAME] [--all]   per item: its longest label, where each step applies and what
                                            stays cut (--all: every unique and set item, not only those with rules)
"""
import argparse
import math
import multiprocessing
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402
import explain_item as E  # noqa: E402
import gen_unique_rolls as G  # noqa: E402
import lint_filter as L  # noqa: E402
import pd2_data as P  # noqa: E402
import tier_map as T  # noqa: E402

ROOT = G.ROOT
OUT = G.CUT_CASES
NAME_MAX = G.NAME_MAX
SECTION = G.OUT.name  # 045-unique-set-rolls.filter, swapped for the generator's text
MAYBE = E.MAYBE
DERIVED = {"RES", "ALLATTRIB", "MAXRES"}  # BH reads these from their parts
CUBE_QUALITIES = G.CUBE_QUALITIES
SOUND_RE = re.compile(r"%SOUNDID-[0-9]{1,4}%", re.I)


# ---------------------------------------------------------------- the filter's rules

def filter_lines(replace):
    """The Main variant's lines (as explain_item.load builds them), with sections swapped: {file name: bytes}."""
    parts, _ = build.read_sections(check=True)
    parts = [(name, replace.get(name, data)) for name, data in parts]
    where = build.line_locator(parts)
    _, season, date = build.load_version()
    joined = b"".join(d for _, d in parts).replace(build.PLACEHOLDER, build.version_text(season, date).encode())
    lines = joined.split(b"\r\n")
    blocks = build.find_toggle_blocks(lines)
    return [x.decode("utf-8") for x in build.render(lines, blocks, build.MAIN)], where


def rpn(cond):
    """BH's ProcessConditions (shunting-yard, AND and OR of equal precedence): the condition in postfix, None if
    malformed (BH never matches it)."""
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


def tree(prog):
    """The postfix condition as a tree: ("w", word), ("!", node), ("AND" / "OR", [nodes]); 0 if malformed (BH never
    matches it), 1 if empty."""
    if prog is None:
        return 0
    if not prog:
        return 1
    st = []
    for t in prog:
        if isinstance(t, tuple):
            st.append(t)
        elif t == "!":
            if not st:
                return 0
            st.append(("!", st.pop()))
        else:
            if len(st) < 2:
                return 0
            b, a = st.pop(), st.pop()
            st.append((t, (a[1] if a[0] == t else [a]) + (b[1] if b[0] == t else [b])))  # AND and OR chain
    return st[0] if len(st) == 1 else 0


def fold(node, static):
    """The tree with the words static(word) knows (0, 1 or MAYBE; None: a word that differs between cases) put in."""
    if not isinstance(node, tuple):
        return node
    if node[0] == "w":
        x = static(node[1])
        return node if x is None else x
    if node[0] == "!":
        a = fold(node[1], static)
        return ("!", a) if isinstance(a, tuple) else 1 - a
    absorb, neutral = (0, 1) if node[0] == "AND" else (1, 0)
    kids, maybe = [], False
    for c in node[1]:
        f = fold(c, static)
        if isinstance(f, tuple):
            kids.append(f)
        elif f == absorb:
            return absorb
        elif f != neutral:
            maybe = True
    kids += [MAYBE] if maybe else []
    return neutral if not kids else kids[0] if len(kids) == 1 else (node[0], kids)


def ev(node, atom):
    """A tree's value (three-valued: AND the lowest, OR the highest, ! the complement), like BH's."""
    if not isinstance(node, tuple):
        return node
    kind = node[0]
    if kind == "w":
        return atom(node[1])
    if kind == "!":
        return 1 - ev(node[1], atom)
    if kind == "AND":
        r = 1
        for c in node[1]:
            x = ev(c, atom)
            if x == 0:
                return 0
            r = min(r, x)
        return r
    r = 0
    for c in node[1]:
        x = ev(c, atom)
        if x == 1:
            return 1
        r = max(r, x)
    return r


def words_of(node):
    if not isinstance(node, tuple):
        return
    if node[0] == "w":
        yield node[1]
    elif node[0] == "!":
        yield from words_of(node[1])
    else:
        for c in node[1]:
            yield from words_of(c)


class RuleSet:
    """The rules with 045's roll aliases kept as words of their own (@ROLL_X_TAG@): taking an item out of a roll's
    alias, or putting it into one, is then that word's value."""

    def __init__(self, section):
        lines, where = filter_lines({SECTION: section})
        lt = L.Linter(lines, where, False)
        rolls = [n for n in lt.aliases if n.startswith("ROLL_") and n.endswith("_TAG")]
        others = {n: v for n, v in lt.aliases.items() if n not in rolls}
        clash = [o for o in others if any(o in n for n in rolls)]
        if clash:
            sys.exit(f"alias names inside roll alias names: {', '.join(clash)}")
        self.formulas = []
        self.named = {"FORMULA" + k.upper(): text for k, (_, text) in lt.formulas.items()}  # Formula[KEY]
        self.roll_tree = {n: tree(rpn(E.expand_condition(lt.aliases[n], others))) for n in rolls}
        word = re.compile(r"(?<![A-Z0-9_@])(" + "|".join(sorted(rolls, key=len, reverse=True)) + r")(?![A-Z0-9_@])")
        self.rules = []
        for r in lt.rules:
            name, cont, *_ = E.action(r.output, lt.aliases)
            cond = E.expand_condition(word.sub(r"@\1@", r.cond), others)
            for a, b in reversed(L.formula_ranges(cond)):
                self.formulas.append(cond[a:b])
                cond = cond[:a] + f" FORMULA__{len(self.formulas) - 1} " + cond[b:]
            self.rules.append({"where": where(r.idx), "tree": tree(rpn(cond)), "name": SOUND_RE.sub("", name, count=1),
                               "cont": cont})


class Zero(dict):
    def __missing__(self, key):
        return 0


FUNCS = {"MAX": max, "MIN": min, "ABS": abs, "COUNT": lambda *a: sum(1 for x in a if x), "FLOOR": math.floor,
         "CEIL": math.ceil, "ROUND": lambda x: math.floor(x + 0.5), "AND": lambda *a: int(all(a)),
         "OR": lambda *a: int(any(a)), "IF": lambda c, a, b: a if c else b}  # (docs/pd2-formula-info.wiki)


def eval_formula(text, v):
    """A BH formula (docs/pd2-formula-info.wiki) with the item's values; names it lacks are 0."""
    body = text.strip()
    if body.startswith("$f(") and body.endswith(")"):
        body = body[3:-1]
    env = Zero({k.replace(",", "_"): x for k, x in v.items()})
    env.update(FUNCS)
    expr = re.sub(r"(?<![=<>!])=(?!=)", "==", body)
    expr = re.sub(r"!(?!=)", " not ", expr)
    expr = re.sub(r"\b([A-Z][A-Z_]*\d+),(\d+)", r"\1_\2", expr)  # MULTI198,123 -> one name
    try:
        return eval(expr, {"__builtins__": {}}, env)
    except Exception:
        return 0


class Model:
    """One item in one case, as BH sees it: atom(word) -> 1 / 0 (MAYBE: the class, or the filter level while it is
    None). off / on: roll aliases the item is taken out of / put into; trees: the roll aliases folded for this item and
    base (shared by its cases), static: what folds them."""

    def __init__(self, rs, kind, code, groups, values, off=(), on=(), trees=None, static=None):
        self.rs, self.kind, self.code, self.groups, self.v = rs, kind, code, groups, values
        self.off, self.on = set(off), set(on)
        self.trees, self.static = ({} if trees is None else trees), static
        self.cache, self.rolls = {}, {}

    def named_formula(self, ref):
        """A Formula[KEY]'s value for this item: its values, item groups, quality, on the ground."""
        v = dict(self.v, **{g: 1 for g in self.groups}, **{self.kind: 1})
        v.setdefault("GROUND", 1)
        v.setdefault("MAPTIER", -1)
        return eval_formula(self.rs.named[ref], v)

    def atom(self, word):
        x = self.cache.get(word)
        if x is None:
            x = self.word(word)
            if "FILTLVL" not in word and not word.startswith("FORMULA__"):
                self.cache[word] = x
        return x

    def word(self, word):
        v = self.v
        if v.get("FILTLVL") is None and ("FILTLVL" in word or (word.startswith("FORMULA__") and
                                                                "FILTLVL" in self.rs.formulas[int(word[9:])].upper())):
            return MAYBE  # every filter level at once: a rule that asks is "maybe"
        if word.startswith("@ROLL_"):
            name = word[1:-1]
            if name in self.off or name in self.on:
                return int(name in self.on)
            if name not in self.rolls:
                if name not in self.trees:
                    t = self.rs.roll_tree.get(name, 0)
                    self.trees[name] = fold(t, self.static) if self.static else t
                self.rolls[name] = ev(self.trees[name], self.atom)
            return self.rolls[name]
        if word in ("TRUE", "FALSE"):
            return int(word == "TRUE")
        if word.startswith("FORMULA__"):
            return int(bool(eval_formula(self.rs.formulas[int(word[9:])], v)))
        if word == "$f":
            return MAYBE
        if word in E.QUALITIES:
            return int(word == self.kind)
        if word in E.CLASSES:
            return MAYBE  # identified uniques and sets: no rule asks for the class (160's class rules are !ID)
        if word in E.PLACES:
            return int(word == "GROUND")
        if word in E.GROUPS:
            return int(word in self.groups)
        m = E.COMPARE_RE.match(word)
        if not m:
            if word in v:
                return int(bool(v[word]))
            if word in ("INF", "SUP", "RW", "GEMMED", "SHOP"):
                return 0
            if len(word) >= 3 and not any(c.isupper() for c in word[:3]):
                return int(word == self.code)  # BH: an item code
            return 0
        key, op, a, b = m.group(1), m.group(2), int(m.group(3)), m.group(4)
        if key in E.KIND_KEYS and key not in v:
            return 0
        total = 0
        for part in key.split("+"):
            if part in v:
                total += v[part]
            elif part == "MAPTIER":
                total -= 1
            elif part in self.rs.named:
                total += self.named_formula(part)
        hi = int(b) if b is not None else a
        return int({"=": total == a, "<": total < a, ">": total > a, "~": a <= total <= hi}[op])


# ---------------------------------------------------------------- the name as BH builds it

COLOR_CODE = {c: "\xffc" + chr(0x41 + i) for i, c in enumerate(sorted(L.BH_COLORS))}
COLOR_RE = re.compile("\xffc.")
TOKEN_RE = re.compile(r"%([A-Z_]+)(?:(\d{1,9})(?:,(\d{1,9}))?)?%")
FORMULA_RE = re.compile(r"\$f\(([^()]*(?:\([^()]*\)[^()]*)*)\)")


def keyword(name, p1, p2, v, cur, base):
    if name in L.BH_COLORS:
        return COLOR_CODE[name]
    special = {"NAME": cur, "BASENAME": base, "NL": "\n", "CL": "\r", "CS": "\b", "PERCENT": "%",
               "SOCKETS": str(v.get("SOCK", 0))}
    if name in special:
        return special[name]
    key = name + (p1 or "") + ("," + p2 if p2 is not None else "")
    return str(v.get(key, 0))


def apply(template, cur, v, base):
    template = FORMULA_RE.sub(lambda m: (lambda x: P.bh_number(x) if isinstance(x, float) else str(int(x)))(
        eval_formula(m.group(1), v)), template)
    return TOKEN_RE.sub(lambda m: keyword(m.group(1), m.group(2), m.group(3), v, cur, base), template)


def trim(name):
    """BH's TrimItemText: a conditional line break (%CL%) or space (%CS%) shows only between text."""
    o = []
    for i, ch in enumerate(name):
        nxt = name[i + 1] if i + 1 < len(name) else None
        if ch == "\r":
            if o and o[-1] != "\n" and nxt is not None and nxt not in "\n\r":
                o.append("\n")
        elif ch == "\b":
            if o and not (o[-1].isspace() or o[-1] == "\b") and nxt is not None and not (nxt.isspace() or nxt == "\b"):
                o.append(" ")
        else:
            o.append(ch)
    return "".join(o)


def visible(text):
    return COLOR_RE.sub("", text)


def evaluate(rules, m, name, base):
    """(the item's name after the rules, as shown, None if hidden; whether a rule only may match). Lines bottom up:
    the base line first. A rule that only may match is left out (with every level at once: ask each level)."""
    cur, maybe = base + "\n" + name, False
    for t, r in rules:
        x = ev(t, m.atom)
        if x != 1:
            maybe = maybe or x == MAYBE
            continue
        cur = apply(r["name"], cur, m.v, base)
        if not r["cont"]:
            break
    text = trim(cur)
    return (text if visible(text).strip() else None), maybe


# ---------------------------------------------------------------- the cases

BASES = T.load_bases()
CORRUPTIONS = P.load_corruptions()
LEVEL_WORD = re.compile(r"^FILTLVL([<>=~])(\d+)(?:-(\d+))?$")


def big(lo, hi):
    return hi if abs(hi) >= abs(lo) else lo


def add_props(v, props):
    for group in props:
        for code, lo, hi in group:
            if code not in DERIVED:
                v["EDEF" if code == "ED" else code] += big(lo, hi)  # the table's ED is +% defense


def values_for(it, code, eth, nsock, c360, c206, outcomes):
    """BH's view of the item at its highest rolls in one case (filter level aside)."""
    b = BASES[code]
    armor = "armo" in b["types"]
    v = defaultdict(int)
    add_props(v, it.game["props"])
    for o in outcomes:
        add_props(v, o["props"])
    v["STAT20"] += b["block"]  # a shield's chance to block holds its base's (BH: STAT20 - BASEBLOCK is the affixes')
    for sid, name in P.NAMED.items():  # the filter's names and STAT<id> read the same stat
        if name != "ED":
            v[name] = v[f"STAT{sid}"] = v.get(name, 0) + v.get(f"STAT{sid}", 0)
    v["ED"] = v.get("EDEF", 0) if armor else v.get("EDAM", 0)  # BH's ED: +% defense on armor, +% damage elsewhere
    v["STAT16"] = v.get("EDEF", 0)
    for group, parts in (("RES", ("FRES", "LRES", "CRES", "PRES")), ("ALLATTRIB", ("STAT0", "STAT1", "STAT2", "STAT3")),
                         ("MAXRES", ("STAT40", "STAT42", "STAT44", "STAT46"))):
        vals = [v.get(p, 0) for p in parts]
        v[group] = min(vals) if all(vals) else 0
    v["PLUSDEF"] = v.get("DEF", 0)  # BH: the item's own +defense (affixes, sockets), no base, no ED%
    base_def = b["maxac"] + (1 if v.get("EDEF", 0) > 0 else 0)
    base_def = base_def * 3 // 2 if eth else base_def
    v["DEF"] = v["STAT31"] = base_def * (100 + v.get("EDEF", 0)) // 100 + v.get("DEF", 0) if b["maxac"] else v["DEF"]
    v.update({"SOCK": nsock, "STAT360": c360, "STAT206": c206, "ID": 1, "ETH": eth, "ILVL": 99, "QLVL": b["qlvl"],
              "CRAFTALVL": 0, "QTY": 0, "MAPID": T.FIELD_ID, "CLVL": 90, "DIFF": 2, "ALLDISCOVERED": 1,
              "ANYDISCOVERED": 1, "ALLOWNED": 1, "ANYOWNED": 1, "WIDTH": b["width"], "HEIGHT": b["height"],
              "AREA": b["width"] * b["height"], "MAXSOCKETS": T.max_sockets(b, 99), "BASEBLOCK": b["block"],
              "ALVL": T.affix_level(99, b["qlvl"], b["mlvl"])})
    return v


def outcomes_of(it):
    """(outcomes without sockets, outcomes of a socketed item, the socket outcomes' STAT360) its slot can get."""
    kind, quality = G.CORRUPT_TYPE.get(it.where), "uni" if it.kind == "UNI" else "set"
    nos, sock, socket_ids = [], [], set()
    for o in CORRUPTIONS:
        if o["type"] != kind or (o["words"] & CUBE_QUALITIES) - {quality}:
            continue
        if "sock" in o["words"]:
            if quality in o["words"]:
                sock.append(o)
        elif o["sockets"]:
            socket_ids.add(o["outcome"])
        else:
            nos.append(o)
    return nos, sock, sorted(socket_ids)


def eth_options(it, b):
    """An item that is always ethereal (its 'ethereal' property) is; an indestructible one never drops ethereal (the
    author, 2026-10-19); else as the base: ethereal or not if it has durability."""
    if it.game.get("eth"):
        return [1]
    if it.stats.get("STAT152") or not b["eth"]:
        return [0]
    return [0, 1]


def item_cases(it):
    """[(case, values without a filter level)]: case = (code, eth, sock, STAT360, STAT206); the label of a case is the
    longest of its values (two cube rows can give one outcome)."""
    out = []
    nos, sock, socket_ids = outcomes_of(it)
    own = it.stats.get("SOCK")  # sockets the item always has (Crown of Ages)
    for code in it.codes:
        b = BASES.get(code)
        if not b:
            continue
        most = min(own[1], b["sockets"]) if own and b["sockets"] else (own[1] if own else b["sockets"])
        scen = []
        if not own:
            scen.append((0, 0, 0, []))
            scen += [(0, o["outcome"], 0, [o]) for o in nos]
            if it.where in G.CORRUPTION_TAGS:  # amulets: corrupted and desecrated
                scen += [(0, a["outcome"], d["outcome"], [a, d]) for a in nos for d in nos]
        if most:
            scen.append((1, 0, 0, []))
            if not own:
                scen += [(1, s, 0, []) for s in socket_ids]
            scen += [(1, o["outcome"], 0, [o]) for o in sock]
        for eth in eth_options(it, b):
            for nsock, c360, c206, outs in scen:
                out.append(((code, eth, nsock, c360, c206), (most if nsock else 0, outs)))
    return out


def level_reps(rules, formulas):
    """One filter level per run of levels no rule tells apart (a formula that reads the level: every level)."""
    cuts = set()
    for t, _ in rules:
        for w in words_of(t):
            m = LEVEL_WORD.match(w)
            if m:
                a, op = int(m.group(2)), m.group(1)
                cuts |= {a} if op == "<" else {a + 1} if op == ">" else {a, a + 1} if op == "=" else \
                    {a, int(m.group(3)) + 1}
            elif w.startswith("FORMULA__") and "FILTLVL" in formulas[int(w[9:])].upper():
                cuts |= set(T.FILTER_LEVELS)
    levels = list(T.FILTER_LEVELS)
    return [lv for lv in levels if lv == levels[0] or lv in cuts]


def folding(rs, it, code, groups, cases):
    """static(word) for one item and base: the word's value where it is the same in every case (None where not)."""
    keys = set().union(*(v.keys() for _, v in cases))
    varying = {key for key in keys if len({v.get(key, 0) for _, v in cases}) > 1} | {"FILTLVL"}
    probe = Model(rs, it.kind, code, groups, dict(cases[0][1]))

    def static(word):
        if word.startswith(("@ROLL_", "FORMULA__")) or word == "$f":
            return None
        m = E.COMPARE_RE.match(word)
        if any(part in varying for part in (m.group(1).split("+") if m else [word])):
            return None
        return probe.word(word)
    return static


def step_aliases(it, step):
    """(roll aliases a step takes the item out of, those it puts it into)."""
    if step[0] == "drop":
        key = it.version if step[1] == "ver" else step[1]
        return ([G.TAGS[key][0]] if key in G.TAGS else []), []
    if step[0] == "tabs":
        return [G.TAGS["tabsk"][0]], [G.TABS_SHORT_ALIAS]
    if step[0] == "slash":
        return [G.TAGS[k][0] for k in step[1:] if k in G.TAGS], [G.slash_alias(*step[1:])]
    return [], []


def shorten(text, name, short):
    """The label with the short name on its top line (the end of the text)."""
    head, sep, top = text.rpartition("\n")
    return head + sep + top.replace(name, short, 1) if name in top else None


RS = {}  # the rule sets of this process: "plain" (045 without cut rules), "cut" (with them)


def init(sections):
    for key, text in sections.items():
        RS[key] = RuleSet(text)


def measure_item(job):
    """Each case of one item (one version): its label length with the steps applied as they would be, in order,
    while it is cut. job = (item index, rule set, simulate steps?)."""
    k, which, simulate = job
    it = ITEMS[k]
    rs = RS[which]
    steps = RULES.get(it.key, []) if simulate else []
    out, odd = {}, []
    by_code = defaultdict(list)
    for case, (nsock, outs) in item_cases(it):
        by_code[case[0]].append((case, values_for(it, case[0], case[1], nsock, case[3], case[4], outs)))
    name = G.game_name(it)
    for code, cases in by_code.items():
        b = BASES[code]
        groups = T.item_groups(set(b["types"])) | {T.TIER_GROUP[b["tier"]]}
        static = folding(rs, it, code, groups, cases)
        mine = [(t, r) for r in rs.rules if (t := fold(r["tree"], static)) != 0]
        levels = level_reps(mine, rs.formulas)
        trees = {}
        for case, v in cases:

            def length(applied):
                off, on = set(), set()
                for s in applied:
                    o, n = step_aliases(it, s)
                    off.update(o)
                    on.update(n)
                short = next((s[1] for s in applied if s[0] == "short"), None)
                m = Model(rs, it.kind, code, groups, v, off, on, trees, static)
                worst = None
                v["FILTLVL"] = None
                text, maybe = evaluate(mine, m, name, b["name"])
                for lvl in levels if maybe else [None]:
                    if maybe:
                        v["FILTLVL"] = lvl
                        text = evaluate(mine, m, name, b["name"])[0]
                    if text is None:
                        continue
                    if short:
                        text = shorten(text, name, short)
                        if text is None:
                            odd.append(f"{it.key}: the name '{name}' is not on the top line ({case})")
                            return NAME_MAX + 999, ""
                    n = len(visible(text))
                    if worst is None or n > worst[0]:
                        worst = (n, visible(text))
                return worst or (0, "")

            n, text = length(())
            first, applied = (n, text), []
            for step in steps:
                if n <= NAME_MAX:
                    break
                applied.append(step)
                n, text = length(applied)
            old = out.get(case)
            if old is None or (len(applied), n) > (old[0], old[1]):
                out[case] = (len(applied), n, text, first)
    return k, out, odd


ITEMS, RULES = [], {}


def init_worker(sections, items_rules):
    global ITEMS, RULES
    ITEMS, RULES = items_rules
    init(sections)


def run(jobs, sections, items, rules, workers):
    """{item index: {case: (steps applied, length, text, (length, text) before any step)}}, odd notes."""
    global ITEMS, RULES
    ITEMS, RULES = items, rules
    results, odd = {}, []
    if workers > 1 and len(jobs) > 8:
        ctx = multiprocessing.get_context("spawn")
        with ctx.Pool(workers, initializer=init_worker, initargs=(sections, (items, rules))) as pool:
            for k, out, o in pool.imap_unordered(measure_item, jobs, chunksize=1):
                results[k], odd = out, odd + o
    else:
        init(sections)
        for job in jobs:
            k, out, o = measure_item(job)
            results[k], odd = out, odd + o
    return results, odd


# ---------------------------------------------------------------- conditions

def cond_atom(word, case):
    code, eth, sock, c360, c206 = case
    if word in ("TRUE", "FALSE"):
        return int(word == "TRUE")
    if word == "ETH":
        return eth
    m = re.fullmatch(r"(SOCK|STAT360|STAT206)([<>=])(\d+)", word)
    if m:
        x, n = {"SOCK": sock, "STAT360": c360, "STAT206": c206}[m.group(1)], int(m.group(3))
        return int({"=": x == n, "<": x < n, ">": x > n}[m.group(2)])
    return int(word == code)


def holds(cond, case):
    return E.evaluate(cond, None, lambda w: cond_atom(w, case)) == 1


def condition(universe, target):
    """The shortest BH condition (greedy) true for the cases in target and false for the rest of universe: OR of
    terms, each a pattern of base code / ETH / SOCK / STAT206 and a set of STAT360 values. "TRUE" if all."""
    if target >= universe:
        return "TRUE"
    dims = [sorted({c[i] for c in universe}) for i in range(5)]
    choices = [[None] + (vals if len(vals) > 1 else []) for vals in dims]
    for i in (0, 1, 2, 4):
        if len(dims[i]) <= 1:
            choices[i] = [None]
    terms, left = [], set(target)
    patterns = [(c, e, s, d) for c in choices[0] for e in choices[1] for s in choices[2] for d in choices[4]]
    while left:
        best = None
        for c, e, s, d in patterns:
            cases = [x for x in universe if (c is None or x[0] == c) and (e is None or x[1] == e)
                     and (s is None or x[2] == s) and (d is None or x[4] == d)]
            bad = {x[3] for x in cases if x not in target}
            present = {x[3] for x in cases}
            good = {x for x in cases if x in left and x[3] not in bad}
            if not good:
                continue
            useful = {x[3] for x in good}
            # the STAT360 part: a list of the values it takes, or the values it leaves out (fewer words wins)
            if not bad:
                corr, cost = [], 0
            elif bad == {0} and present - {0}:
                corr, cost = ["STAT360>0"], 1
            elif len(useful) <= len(bad):
                corr = ["(" + " OR ".join(cond_value(x) for x in sorted(useful)) + ")" if len(useful) > 1
                        else cond_value(next(iter(useful)))]
                cost = len(useful)
            else:
                corr = (["STAT360>0"] if 0 in bad else []) + [f"!STAT360={x}" for x in sorted(bad - {0})]
                cost = len(corr)
            words = ([c] if c else []) + (["ETH" if e else "!ETH"] if e is not None else []) + \
                ([("SOCK>0" if s else "SOCK<1")] if s is not None else []) + \
                ([f"STAT206={d}" if d else "STAT206<1"] if d is not None else []) + corr
            atoms = len(words) - len(corr) + cost
            score = (len(good) / (atoms + 1), -atoms)
            if best is None or score > best[0]:
                best = (score, words, good)
        if best is None:
            return None
        terms.append(best[1])
        left -= best[2]
    # drop a term the others cover
    for t in list(terms):
        rest = [x for x in terms if x is not t]
        if rest and all(any(holds(" ".join(r), x) for r in rest) for x in target):
            terms = rest
    text = " OR ".join(" ".join(t) if len(t) == 1 else "(" + " ".join(t) + ")" for t in terms)
    if len(terms) == 1 and G.one_group(text):
        text = text[1:-1]
    return text


def cond_value(x):
    return "STAT360<1" if x == 0 else f"STAT360={x}"


# ---------------------------------------------------------------- main

def load():
    """Every item (045 as the generator writes it needs them all) and the picks as it reads them."""
    items = G.load()
    picks = G.read_picks_text(G.render_picks(items, G.read_picks(), G.read_cut_rules()))
    return items, picks


def section_text(items, picks, cuts=None):
    return G.render_section(items, picks, cuts).encode("utf-8") + b"\r\n"


def cases_text(items, rules, results):
    """The cases file, and per item key [(step, condition)] for the report."""
    lines = ["# Where the steps of tools/unique_cut_rules.txt apply: GENERATED by tools/label_cuts.py - do not edit (run it",
             "# after changing the picks, the cut rules or sections/). Per item and step (its number on the rule line), the",
             "# BH condition of the cases where the label is still cut before that step: base code, ETH, SOCK, STAT360 (the",
             "# corruption outcome; STAT360<1 uncorrupted), STAT206 (an amulet's desecration). A step not listed never",
             "# applies. tools/gen_unique_rolls.py puts these into 045.",
             "item\tstep\tcondition"]
    by_key, problems = defaultdict(dict), []
    for k, cases in results.items():
        for case, (applied, *_rest) in cases.items():
            old = by_key[items[k].key].get(case)
            if old is not None and old != applied:
                problems.append(f"{items[k].key}: its versions need different steps at {case}; taking the most")
            by_key[items[k].key][case] = max(applied, old or 0)
    found = {}
    for key in sorted(by_key):
        universe = set(by_key[key])
        for n in range(1, len(rules.get(key, [])) + 1):
            target = {c for c, applied in by_key[key].items() if applied >= n}
            if not target:
                break
            cond = condition(universe, target)
            if cond is None or any(holds(cond, c) != (c in target) for c in universe):
                sys.exit(f"{key}: no condition found for step {n} (a bug in tools/label_cuts.py)")
            lines.append(f"{key}\t{n}\t{cond}")
            found.setdefault(key, []).append((rules[key][n - 1], cond))
    return "\n".join(lines) + "\n", found, problems


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Where unique/set labels would be cut, and where each cut rule applies.")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--report", nargs="?", const="", metavar="NAME")
    ap.add_argument("--all", action="store_true", help="--report: every unique and set item")
    ap.add_argument("--workers", type=int, default=min(8, multiprocessing.cpu_count()))
    args = ap.parse_args()
    items, picks = load()
    rules = G.read_cut_rules()
    plain = section_text(items, picks)
    wanted = [k for k, it in enumerate(items) if it.game and (it.key in rules or (args.report is not None and args.all))]
    if args.report:
        wanted = [k for k in wanted if args.report.lower() in items[k].key.lower()]
    results, odd = run([(k, "plain", True) for k in wanted], {"plain": plain}, items, rules, args.workers)
    text, found, problems = cases_text(items, rules, {k: r for k, r in results.items() if items[k].key in rules})
    for msg in sorted(set(odd)) + problems:
        print(f"note: {msg}")
    still = defaultdict(list)
    for k, cases in results.items():
        for case, (applied, n, label, _) in cases.items():
            if n > NAME_MAX:
                still[items[k].key].append((n, case, label))
    if args.report is not None:
        report(items, rules, results, found, still, wanted)
        return
    if args.check:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != text:
            sys.exit(f"out of date (run: python tools/label_cuts.py): {OUT.relative_to(ROOT)}")
        print("unique/set label cut cases up to date")
        return
    changed = not OUT.exists() or OUT.read_text(encoding="utf-8") != text
    if changed:
        OUT.write_text(text, encoding="utf-8", newline="\n")
    # check: the section with these cases, every case measured again without simulating
    cut = section_text(items, picks, (rules, G.read_cut_cases()))
    again, odd = run([(k, "cut", False) for k in wanted], {"cut": cut}, items, rules, args.workers)
    wrong = []
    for k, cases in results.items():
        for case, (applied, n, label, _) in cases.items():
            n2, label2 = again[k][case][1], again[k][case][2]
            if n2 != n and (n2 > NAME_MAX or n <= NAME_MAX):
                wrong.append(f"{items[k].key} {case}: simulated {n} '{label}', with the cut rules {n2} '{label2}'")
    for msg in wrong:
        print(f"MISMATCH {msg}")
    for key, cases in sorted(still.items()):
        n, case, label = max(cases)
        print(f"still cut: {key} in {len(cases)} case(s), up to {n} ({case_text(case)}): {label!r}")
    print(f"{len(wanted)} item rows measured; {sum(len(v) for v in found.values())} step conditions; "
          f"{'wrote ' + str(OUT.relative_to(ROOT)) if changed else 'cases unchanged'}")
    if wrong:
        sys.exit(f"{len(wrong)} label(s) differ from the simulation (a bug in tools/label_cuts.py or in 045)")


def case_text(case):
    code, eth, sock, c360, c206 = case
    return " ".join([code] + (["eth"] if eth else []) + (["socketed"] if sock else []) +
                    ([f"STAT360={c360}"] if c360 else []) + ([f"STAT206={c206}"] if c206 else []))


def report(items, rules, results, found, still, wanted):
    for k in sorted(wanted, key=lambda k: items[k].key):
        it, cases = items[k], results.get(k, {})
        if not cases:
            continue
        before = max(c[3] for c in cases.values())
        after = max((c[1], c[2]) for c in cases.values())
        print(f"{it.key} [{' '.join(it.codes)}]: {len(cases)} cases; longest {before[0]}: {before[1]!r}")
        for step, cond in found.get(it.key, []):
            print(f"    {G.step_text(step)}: where {cond}")
        if after[0] > NAME_MAX:
            print(f"    STILL CUT in {sum(c[1] > NAME_MAX for c in cases.values())} case(s), up to {after[0]}: {after[1]!r}")
        elif it.key in rules:
            print(f"    after its steps: at most {after[0]}")


if __name__ == "__main__":
    main()
