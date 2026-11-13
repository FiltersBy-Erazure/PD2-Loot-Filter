#!/usr/bin/env python3
"""
PD2's skill formulas (Skills.txt calc columns: calc1-4, aurastatcalc, passivecalc, ...), evaluated as the game reads
them, for tools/calc_data.py and its pages. The website's calculators carry a JavaScript copy of the same rules
(website/resources/Damage-Calculator.html, `Calc`); calc_data.py --selftest checks this one on known tooltip values.

How the game reads a formula:
- Integer arithmetic; a division rounds toward zero, by zero gives 0; a comparison gives 1 or 0.
- `?` binds tighter than every operator around it: `par5+(lvl<22)?lvl:(22+((lvl-22)/2))` is
  par5 + ((lvl<22) ? lvl : (22+...)), so a ternary's condition and branches are written as single operands.
- A leading `-` binds tighter than the operators after it.
- Keywords (SkillCalc.txt's codes): ln12 = par1 + (lvl-1) x par2 (ln34, ln56, ln78 the same with par3/4 ...);
  dm12 = par1 + (par2 - par1) x (110 x lvl / (lvl + 6)) / 100, at most par2; par1-par8; lvl; blvl (the skill's own
  points); ulvl (character level); edmn / edmx (the skill's elemental minimum / maximum: EMin plus EMinLev per level in
  the brackets 2-8, 9-16, 17-22, 23-28, 29+, shifted by HitShift, plus the EDmgSymPerCalc synergy percentage, then in
  whole points); edns / edxs (the same in 256ths); edln (ELen plus ELevLen in the brackets 2-8, 9-16, 17+, plus the
  ELenSymPerCalc percentage); toht (ToHit + (lvl-1) x LevToHit, or ToHitCalc); clc1-clc4, len, ast1-6, pst1-5 (the
  skill's own calc columns); skill('Name'.key) reads another skill (its blvl, lvl or one of its keywords at its
  level); stat('name'.accr) a stat of the character (0 unless given); min(a, b), max(a, b).
"""
import re

KEYWORDS = ["ln12", "dm12", "ln34", "dm34", "ln56", "dm56", "ln78", "dm78"]
TOKEN = re.compile(r"\s*(?:(\d+)|('[^']*'\s*\.\s*[A-Za-z_][A-Za-z0-9_]*)|([A-Za-z_][A-Za-z0-9_]*)|(<=|>=|==|!=|[-+*/^?:<>(),]))")
BINARY = {"<": 15, ">": 15, "<=": 15, ">=": 15, "==": 15, "!=": 15, "+": 17, "-": 17, "*": 19, "/": 19, "^": 20}


def num(text):
    text = (text or "").strip()
    try:
        return int(text)
    except ValueError:
        return 0


def tdiv(a, b):
    """C integer division (toward zero); by zero gives 0, as the game's formulas do"""
    if b == 0:
        return 0
    q = abs(a) // abs(b)
    return q if (a >= 0) == (b >= 0) else -q


def bracket(level, base, per):
    """EMin / EMax plus their per-level brackets (2-8, 9-16, 17-22, 23-28, 29+)"""
    if level <= 1:
        return base
    p = per + [0] * (5 - len(per))
    if level > 28:
        add = 7 * p[0] + 8 * p[1] + 6 * (p[2] + p[3]) + (level - 28) * p[4]
    elif level > 22:
        add = 7 * p[0] + 8 * p[1] + 6 * p[2] + (level - 22) * p[3]
    elif level > 16:
        add = 7 * p[0] + 8 * p[1] + (level - 16) * p[2]
    elif level > 8:
        add = 7 * p[0] + (level - 8) * p[1]
    else:
        add = (level - 1) * p[0]
    return base + add


def length(level, base, per):
    """ELen plus ELevLen per level (2-8, 9-16, 17+)"""
    p = per + [0] * (3 - len(per))
    if level <= 0:
        return 0
    if level <= 8:
        add = p[0] * (level - 1)
    elif level <= 16:
        add = 7 * p[0] + (level - 8) * p[1]
    else:
        add = 7 * p[0] + 8 * p[1] + (level - 16) * p[2]
    return base + add


class Parser:
    """A formula to a tree, with the game's precedence (see the module docstring)"""

    def __init__(self, text):
        self.toks = []
        text = text.replace('"', "")
        pos = 0
        while pos < len(text):
            if text[pos:].strip() == "":
                break
            m = TOKEN.match(text, pos)
            if not m:
                raise ValueError(f"bad formula {text!r} at {pos}")
            pos = m.end()
            if m.group(1):
                self.toks.append(("n", int(m.group(1))))
            elif m.group(2):
                name, key = re.match(r"'([^']*)'\s*\.\s*(\w+)", m.group(2)).groups()
                self.toks.append(("link", (name, key)))
            elif m.group(3):
                self.toks.append(("id", m.group(3)))
            else:
                self.toks.append(("op", m.group(4)))
        self.i = 0

    def peek(self):
        return self.toks[self.i] if self.i < len(self.toks) else (None, None)

    def take(self, op=None):
        t = self.peek()
        if op is not None and t != ("op", op):
            raise ValueError(f"expected {op}, got {t}")
        self.i += 1
        return t

    def parse(self):
        tree = self.expr(0)
        if self.i != len(self.toks):
            raise ValueError(f"trailing tokens {self.toks[self.i:]}")
        return tree

    def expr(self, minbp):
        left = self.unary()
        while True:
            kind, val = self.peek()
            if kind != "op" or val not in BINARY or BINARY[val] < minbp:
                return left
            self.take()
            right = self.expr(BINARY[val] + 1)
            left = ("bin", val, left, right)

    def unary(self):
        kind, val = self.peek()
        if kind == "op" and val == "-":
            self.take()
            return ("neg", self.unary())
        if kind == "op" and val == "+":
            self.take()
            return self.unary()
        return self.ternaries(self.primary())

    def ternaries(self, node):
        while self.peek() == ("op", "?"):
            self.take()
            a = self.primary()
            self.take(":")
            b = self.primary()
            node = ("tern", node, a, b)
        return node

    def primary(self):
        kind, val = self.take()
        if kind == "n":
            return ("n", val)
        if kind == "op" and val == "(":
            node = self.expr(0)
            self.take(")")
            return node
        if kind == "id":
            if self.peek() == ("op", "("):
                self.take("(")
                args = [self.expr(0)]
                while self.peek() == ("op", ","):
                    self.take()
                    args.append(self.expr(0))
                self.take(")")
                return ("call", val, args)
            return ("kw", val)
        if kind == "link":
            return ("link", val)
        raise ValueError(f"unexpected {kind} {val}")


_cache = {}


def parse(text):
    if text not in _cache:
        _cache[text] = Parser(text).parse() if text.strip() else ("n", 0)
    return _cache[text]


class Skills:
    """Skills.txt rows, by name (lowercase) and by Id, with the formula evaluator"""

    def __init__(self, rows):
        self.by_id, self.by_name = {}, {}
        for r in rows:
            if r.get("Id", "").strip().isdigit():
                self.by_id.setdefault(int(r["Id"]), r)
                self.by_name.setdefault(r["skill"].lower(), r)

    def row(self, ref):
        return self.by_id.get(ref) if isinstance(ref, int) else self.by_name.get(str(ref).lower())

    def value(self, ref, text, lvl, ctx=None):
        """the formula `text` of skill `ref` at level `lvl`. ctx: {"blvl": {name: base points}, "lvl": {name:
        level}, "stat": {name: value}, "ulvl": character level, "self_blvl": this skill's base points}"""
        row = self.row(ref)
        return self.eval(parse(text), row, lvl, ctx or {})

    def keyword(self, row, key, lvl, ctx):
        r = row
        par = lambda n: num(r.get(f"Param{n}"))
        if key in KEYWORDS:
            k = KEYWORDS.index(key)
            a, b = par(2 * (k // 2) + 1), par(2 * (k // 2) + 2)
            if k % 2 == 0:
                return a + (lvl - 1) * b if lvl > 0 else 0
            if lvl <= 0 and k != 7:
                return 0
            v = a + tdiv((b - a) * tdiv(110 * lvl, lvl + 6), 100)
            return min(v, b)
        if re.fullmatch(r"par[1-8]", key):
            return par(int(key[3:]))
        if key == "lvl":
            return lvl
        if key == "blvl":
            return ctx.get("self_blvl", lvl)
        if key == "ulvl":
            return ctx.get("ulvl", 90)
        if key in ("edmn", "edmx", "edns", "edxs"):
            side = "EMin" if key in ("edmn", "edns") else "EMax"
            base = bracket(lvl, num(r.get(side)), [num(r.get(f"{side}Lev{i}")) for i in range(1, 6)]) if lvl > 0 else 0
            d = base << num(r.get("HitShift"))
            syn = r.get("EDmgSymPerCalc", "").strip()
            if syn:
                bonus = self.eval(parse(syn), r, lvl, ctx)
                if bonus:
                    d += tdiv(d * bonus, 100)
            return d >> 8 if key in ("edmn", "edmx") else d
        if key == "edln":
            d = length(lvl, num(r.get("ELen")), [num(r.get(f"ELevLen{i}")) for i in range(1, 4)])
            syn = r.get("ELenSymPerCalc", "").strip()
            if syn:
                bonus = self.eval(parse(syn), r, lvl, ctx)
                if bonus:
                    d += tdiv(d * bonus, 100)
            return d
        if key == "toht":
            if r.get("ToHitCalc", "").strip():
                return self.eval(parse(r["ToHitCalc"]), r, lvl, ctx)
            return num(r.get("ToHit")) + (lvl - 1) * num(r.get("LevToHit")) if lvl > 0 else 0
        m = re.fullmatch(r"(clc|ast|pst)([1-6])|len", key)
        if m:
            col = {"clc": "calc{}", "ast": "aurastatcalc{}", "pst": "passivecalc{}"}[m.group(1)].format(m.group(2)) \
                if m.group(1) else "auralencalc"
            return self.eval(parse(r.get(col, "")), r, lvl, ctx)
        if key in ("usmc", "mana", "mps", "rng"):
            return 0
        raise ValueError(f"unknown keyword {key} in {r.get('skill')}")

    def eval(self, node, row, lvl, ctx):
        t = node[0]
        if t == "n":
            return node[1]
        if t == "kw":
            return self.keyword(row, node[1], lvl, ctx)
        if t == "neg":
            return -self.eval(node[1], row, lvl, ctx)
        if t == "tern":
            return self.eval(node[2], row, lvl, ctx) if self.eval(node[1], row, lvl, ctx) else \
                self.eval(node[3], row, lvl, ctx)
        if t == "bin":
            a, b = self.eval(node[2], row, lvl, ctx), self.eval(node[3], row, lvl, ctx)
            op = node[1]
            return {"+": lambda: a + b, "-": lambda: a - b, "*": lambda: a * b, "/": lambda: tdiv(a, b),
                    "<": lambda: int(a < b), ">": lambda: int(a > b), "<=": lambda: int(a <= b),
                    ">=": lambda: int(a >= b), "==": lambda: int(a == b), "!=": lambda: int(a != b),
                    "^": lambda: a ** b if b > 0 else 1}[op]()
        if t == "call":
            name, args = node[1].lower(), node[2]
            if name in ("min", "max"):
                vals = [self.eval(a, row, lvl, ctx) for a in args]
                return min(vals) if name == "min" else max(vals)
            if name in ("skill", "stat", "miss", "sklvl"):
                arg = args[0]
                if name == "skill" and arg[0] == "link":
                    return self.link(arg[1], ctx)
                if name == "stat" and arg[0] == "link":
                    return ctx.get("stat", {}).get(arg[1][0].lower(), 0)
                return 0
            raise ValueError(f"unknown function {name}")
        if t == "link":
            return self.link(node[1], ctx)
        raise ValueError(f"bad node {node}")

    def link(self, link, ctx):
        name, key = link
        other = self.row(name)
        blvl = ctx.get("blvl", {}).get(name.lower(), 0)
        if key == "blvl":
            return blvl
        olvl = ctx.get("lvl", {}).get(name.lower(), blvl)
        if key == "lvl":
            return olvl
        if other is None:
            return 0
        sub = dict(ctx, self_blvl=blvl)
        return self.keyword(other, key, olvl, sub)
