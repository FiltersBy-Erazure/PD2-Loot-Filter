#!/usr/bin/env python3
"""
Experience formulas for maps, from docs/pd2-map-exp.tsv (written from the game files by map_exp.py, the model, kept out of the repo).

Two numbers per map code, as BH aliases (formula text for $f(...)):
    MXR_<code>  roll multiplier: experience of a full clear of this map with its rolls, divided by the same map
                without rolls. The same for every character (no level penalty).
    MXP_<code>  personal multiplier: the same ratio for the character looking at the map (CHARSTAT12): each kind
                of monster gets its level penalty, and the map's +XP % adds to the character's own (CHARSTAT85).

The model (map_exp.py notes where each part comes from), per area of the map:
    T  = spawn rolls = rolls x min((1 + density/100) x f, 10000 / MonDen), f = 0.5 when fortified (STAT493)
    Bn = floor(floor(MonUMin x (1 + rarity/100)) x f), Bx likewise from MonUMax
    P  = elite packs = min(Bx, 0.53 T, Bn + 0.06 T max(0, 1 - x1)), x1 = (sqrt(0.0036 + 1.88 Bn / T) - 0.06) / 0.94
         (the base game's spawn rule, forced toward MonUMin as rooms populate, integrated over the room order)
    normal exp = reach x exp per normal roll x (T - P), pack exp = reach x exp per pack roll x P + layout packs,
    plus the layout's own monsters (bosses). x2 when fortified (patch notes), x (1 + XP/100), and the monster level
    (area level + STAT374) through MonLvl's L-XP(H) = 1359 level - 64320 (exact for levels 84-96).
    A guest monster ("Map contains ...", STAT437-442/470/471/499, one at most) joins each area's monster list with
    weight 1 beside the natives' total rarity W: exp per roll (W e + guest's e) / (W + 1), normal and pack apart
    (docs/pd2-map-guests.tsv). In the formula each coefficient is then an IF chain over the guest stats.
Level penalty P(m) for a character of level c >= 25 (the base game's experience code): m > c: c/m; else 1 up to 5 levels below,
then 19% less per level, at least 5% (this line is within 0.7% of the game's 207/159/110/61/13 of 256). Normal
monsters and layout monsters at the monster level, champions +2, uniques and minions +3 (their base experience is
the area's). A character's own +XP % (stat 85) is added after the penalty, and the map's +XP % joins it there.

The filter shows the roll multiplier as a tag on a map's tag line (sections/146-map-experience.filter, written
here), truncated to one decimal (the colour always matches the digits), in bands per tier (BANDS): T1 from 1.4x
gold, 1.7x red, 2.0x purple; T2 1.5x / 1.8x / 2.2x; T3 1.6x / 2.0x / 2.5x; T4 2.3x / 2.6x / 3.0x; no tag below.
T1-T3 maps: leftmost on the tag line that 145's rule %CL% opens; T4 and unique maps: a tag line under their name.
Identified maps only (an unidentified map has no stats yet).

    python tools/gen_map_exp.py              write sections/146-map-experience.filter
    python tools/gen_map_exp.py --check      change nothing; exit 1 if the section is out of date
    python tools/gen_map_exp.py --selftest   evaluate every formula's BH text against the Python model (slow)
    python tools/gen_map_exp.py --print      every map's roll and personal multiplier for a few rolls
"""
import argparse
import collections
import csv
import math
import random
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TSV = ROOT / "docs" / "pd2-map-exp.tsv"
GUEST_TSV = ROOT / "docs" / "pd2-map-guests.tsv"
OUT = ROOT / "sections" / "146-map-experience.filter"
TIER_NAMES = {1: "T1", 2: "T2", 3: "T3", 4: "T4 dungeon", 5: "unique map"}
# Bands per tier on the tenths t (1.4x = 14): (tag from, red from, purple from); gold below red. The same
# percentiles of rolled rare maps in every tier (half of them corrupted; T4 dungeons: their rare maps, never
# corrupted, with the scarab recipe's +40-50% experience): the tag from the 10th, red from the 60th, purple from
# the 95th, so every tier splits about alike (~8% no tag, ~52% gold, ~35% red, ~5% purple; T4's 60th, 2.65x,
# falls between two tenths). Unique maps take the tier of their monster level (87 T1, 88 T2, 89 T3, as 130-maps
# groups them). A band test sits inside the formula, as in the filter's other formula conditions (the repo's
# tools read a $f(...) island as one unknown word); lo <= t <= hi is written ABS(2t - lo - hi) <= hi - lo, so the
# long multiplier appears once.
BANDS = {1: (14, 17, 20), 2: (15, 18, 22), 3: (16, 20, 25), 4: (23, 26, 30)}


def band_tier(mp):
    return mp.tier if mp.tier <= 4 else mp.level - 86


def band_tests(mp, t):
    """[(colour, BH test on the tenths t)] of the map's tier."""
    g, r, p = BANDS[band_tier(mp)]
    return [("%GOLD%", f"ABS(2*{t}-{g + r - 1})<={r - 1 - g}"), ("%RED%", f"ABS(2*{t}-{r + p - 1})<={p - 1 - r}"),
            ("%PURPLE%", f"{t}>={p}")]


# ------------------------------------------------------------------ data

class Area:
    def __init__(self, row):
        self.id = int(row["area"])
        self.name = row["area_name"]
        self.rolls = float(row["rolls"])
        self.reach = float(row["reach"])
        self.den = int(row["monden"])
        self.bmin, self.bmax = int(row["packs_min"]), int(row["packs_max"])
        self.e_normal, self.e_pack = float(row["exp_normal"]), float(row["exp_pack"])
        self.champ = float(row["champ"])
        self.layout_packs, self.layout_exp = float(row["layout_packs"]), float(row["layout_exp"])
        self.rarity = int(row.get("rarity") or 0)


class Map:
    def __init__(self, code, tier, name, level):
        self.code, self.tier, self.name, self.level = code, tier, name, level
        self.areas = []
        self.guests = []     # guest monster stats the map can carry, one at a time (docs/pd2-map-guests.tsv)
        self.guest_exp = {}  # {stat: (exp per normal roll, exp per pack roll, champions' share)} at self.level

    def area_exp(self, a, guest=None):
        """(exp per normal roll, exp per elite pack roll, the champions' part of the pack roll) of an area; a guest
        monster joins its monster list with weight 1 beside the natives' total rarity (PD2's area setup)."""
        if not guest:
            return a.e_normal, a.e_pack, a.e_pack * a.champ
        gn, gp, gc = self.guest_exp[guest]
        w = a.rarity
        return ((w * a.e_normal + gn) / (w + 1), (w * a.e_pack + gp) / (w + 1),
                (w * a.e_pack * a.champ + gp * gc) / (w + 1))

    def spawns(self, a):
        """The area spawns monsters: natives, or a guest (an area without natives then spawns only the guest)."""
        return a.rolls > 0 and (a.e_normal > 0 or a.e_pack > 0 or bool(self.guests))

    def parts3(self, d=0, r=0, fort=False, guest=None):
        """(normal + layout exp, champion packs' exp, unique packs' exp) of a full clear with these rolls (no
        penalty, no XP %): champions spawn 2 levels up, uniques and minions 3, so the penalty tells them apart."""
        f = 0.5 if fort else 1.0
        n = kc = ku = 0.0
        for a in self.areas:
            en, ep, cp = self.area_exp(a, guest)
            n += a.layout_exp
            kc += cp * a.layout_packs
            ku += (ep - cp) * a.layout_packs
            if a.rolls <= 0 or (en <= 0 and ep <= 0):
                continue
            t = a.rolls * min((1 + d / 100) * f, 10000 / a.den)
            bn = math.floor(math.floor(a.bmin * (1 + r / 100)) * f)
            bx = math.floor(math.floor(a.bmax * (1 + r / 100)) * f)
            p = packs(t, bn, bx)
            n += a.reach * en * (t - p)
            kc += a.reach * cp * p
            ku += a.reach * (ep - cp) * p
        return n, kc, ku

    def parts(self, d=0, r=0, fort=False, guest=None):
        """(normal + layout exp, pack exp) of a full clear with these rolls (no penalty, no XP %)."""
        n, kc, ku = self.parts3(d, r, fort, guest)
        return n, kc + ku

    @property
    def plain(self):
        return sum(self.parts())

    @property
    def champ(self):
        """The champions' share of the map's pack exp (plain map)."""
        k = sum(a.reach * a.e_pack * packs(a.rolls, a.bmin, a.bmax) + a.e_pack * a.layout_packs for a in self.areas)
        c = sum(a.champ * (a.reach * a.e_pack * packs(a.rolls, a.bmin, a.bmax) + a.e_pack * a.layout_packs)
                for a in self.areas)
        return c / k if k else 0.0


def packs(t, bn, bx):
    if t <= 0 or bx <= 0:
        return 0.0
    x1 = (math.sqrt(0.0036 + 1.88 * bn / t) - 0.06) / 0.94
    return min(bx, 0.53 * t, bn + 0.06 * t * max(0.0, 1 - x1))


def read_tsv(path):
    return [r for r in csv.DictReader((l for l in open(path, encoding="utf-8") if not l.startswith("#")),
                                      delimiter="\t")]


def guest_table(rows):
    """{(stat, level): (exp per normal roll, exp per pack roll, champions' share)} from guest TSV rows."""
    return {(int(r["stat"]), int(r["level"])): (float(r["exp_normal"]), float(r["exp_pack"]), float(r["champ"]))
            for r in rows}


def load(path=TSV, guest_path=GUEST_TSV):
    gexp = guest_table(read_tsv(guest_path)) if guest_path.exists() else {}
    maps = {}
    for r in read_tsv(path):
        if r["code"] not in maps:
            m = maps[r["code"]] = Map(r["code"], int(r["tier"]), r["map"], int(r["level"]))
            m.guests = [int(s) for s in (r.get("guests") or "").split()]
            m.guest_exp = {s: v for (s, lv), v in gexp.items() if lv == m.level}
        maps[r["code"]].areas.append(Area(r))
    return maps


# ------------------------------------------------------------------ the two multipliers (reference)

def xp_level(m):
    return 1359 * m - 64320  # MonLvl L-XP(H), levels 84-96


def penalty(c, m):
    dd = c - m
    if dd < 0:
        return c / m
    return max(0.0508, 1 - 0.1898 * max(dd - 5, 0))


def roll_multiplier(mp, d=0, r=0, x=0, alvl=0, fort=False, guest=None):
    n, k = mp.parts(d, r, fort, guest)
    return (1 + x / 100) * (2 if fort else 1) * (n + k) / mp.plain * xp_level(mp.level + alvl) / xp_level(mp.level)


def personal_multiplier(mp, clvl, own_xp=0, d=0, r=0, x=0, alvl=0, fort=False, guest=None):
    n, kc, ku = mp.parts3(d, r, fort, guest)
    n0, kc0, ku0 = mp.parts3()
    m, L = mp.level + alvl, mp.level
    num = n * penalty(clvl, m) + kc * penalty(clvl, m + 2) + ku * penalty(clvl, m + 3)
    den = n0 * penalty(clvl, L) + kc0 * penalty(clvl, L + 2) + ku0 * penalty(clvl, L + 3)
    return ((100 + own_xp + x) / (100 + own_xp) * (2 if fort else 1) * num / den
            * xp_level(m) / xp_level(L))


# ------------------------------------------------------------------ BH formula text

def num_txt(v):
    s = f"{v:.6g}"
    if "e" in s:
        s = f"{v:.10f}".rstrip("0").rstrip(".")
    return s


FORT = "IF(STAT493,STAT493/100,1)"  # PD2's area setup multiplies density and pack counts by the stat / 100


def area_terms(a):
    """BH text of one area's density factor g (T = rolls x g) and its pack count P (with T expanded)."""
    g = f"MIN((1+STAT372/100)*{FORT},{num_txt(10000 / a.den)})"
    if a.bmax == 0:
        return g, "0"
    bn = f"FLOOR(FLOOR({a.bmin}*(1+STAT375/100))*{FORT})"
    bx = f"FLOOR(FLOOR({a.bmax}*(1+STAT375/100))*{FORT})"
    # min(Bx, 0.53 T, Bn + 0.06 T max(0, 1 - x1)) with 1 - x1 = (1 - sqrt(0.0036 + 1.88 Bn / T)) / 0.94
    p = (f"MIN({bx},{num_txt(0.53 * a.rolls)}*{g},{bn}+{num_txt(0.06 / 0.94 * a.rolls)}*{g}"
         f"*MAX(0,1-SQRT(0.0036+{num_txt(1.88 / a.rolls)}*{bn}/{g})))")
    return g, p


def coef_txt(mp, a, scale, f):
    """BH text of an area's coefficient f(exp per normal roll, exp per pack roll, the champions' part) / scale: a
    number, or an IF chain over the guest monsters the map can carry (one at most; BH reads a stat's value, the
    monster's id, as true)."""
    base = f(*mp.area_exp(a)) / scale
    if not mp.guests:
        return num_txt(base)
    vals = [f(*mp.area_exp(a, s)) / scale for s in mp.guests]
    assert min(vals + [base]) >= 0, (mp.code, a.id)  # chains are written as positive terms
    return "".join(f"IF(STAT{s},{num_txt(v)}," for s, v in zip(mp.guests, vals)) + num_txt(base) + ")" * len(vals)


def total_txt(mp, scale):
    """BH text of N + K divided by scale, each area's P once: reach x (e_normal T + (e_pack - e_normal) P); with
    guest monsters each coefficient is an IF chain over them."""
    terms = []
    const = sum(a.layout_exp for a in mp.areas) / scale
    for a in mp.areas:
        if a.layout_packs:
            terms.append(coef_txt(mp, a, scale, lambda en, ep, cp: ep * a.layout_packs))
        if not mp.spawns(a):
            continue
        g, p = area_terms(a)
        term = f"{coef_txt(mp, a, scale, lambda en, ep, cp: a.reach * en * a.rolls)}*{g}"
        if p != "0":
            if mp.guests:
                term += f"+{coef_txt(mp, a, scale, lambda en, ep, cp: a.reach * (ep - en))}*{p}"
            else:
                cd = a.reach * (a.e_pack - a.e_normal) / scale
                term += f"{'+' if cd >= 0 else '-'}{num_txt(abs(cd))}*{p}"
        terms.append(term)
    if const:
        terms.append(num_txt(const))
    return "+".join(terms)


def level_txt(mp):
    return f"(1359*({mp.level}+STAT374)-64320)/{xp_level(mp.level)}"


def pen_txt(lv):
    d = f"(CHARSTAT12-({lv}))"
    return f"IF({d}<0,CHARSTAT12/({lv}),MAX(0.0508,1-0.1898*MAX({d}-5,0)))"


def roll_txt(mp):
    s = mp.plain
    return f"(1+STAT373/100)*IF(STAT493,2,1)*({total_txt(mp, s)})*{level_txt(mp)}"


def personal_num_txt(mp, scale, pens=None):
    """BH text of a full clear's exp with the level penalty, / scale: normal monsters at the monster level m,
    champion packs at m + 2, unique packs at m + 3; each area's P once; guest monsters as IF chains. pens: the
    three penalty texts to use instead (the experience line's shared aliases)."""
    m = f"{mp.level}+STAT374"
    p0, p2, p3 = pens or (pen_txt(m), pen_txt(m + "+2"), pen_txt(m + "+3"))
    terms = []
    for a in mp.areas:
        if a.layout_packs:
            terms.append(f"{coef_txt(mp, a, scale, lambda en, ep, cp: cp * a.layout_packs)}*{p2}"
                         f"+{coef_txt(mp, a, scale, lambda en, ep, cp: (ep - cp) * a.layout_packs)}*{p3}")
        if not mp.spawns(a):
            continue
        g, p = area_terms(a)
        term = f"{coef_txt(mp, a, scale, lambda en, ep, cp: a.reach * en * a.rolls)}*{g}*{p0}"
        if p != "0":
            term += (f"+{p}*({coef_txt(mp, a, scale, lambda en, ep, cp: a.reach * cp)}*{p2}"
                     f"+{coef_txt(mp, a, scale, lambda en, ep, cp: a.reach * (ep - cp))}*{p3}"
                     f"-{coef_txt(mp, a, scale, lambda en, ep, cp: a.reach * en)}*{p0})")
        terms.append(term)
    layout = sum(a.layout_exp for a in mp.areas) / scale
    if layout:
        terms.append(f"{num_txt(layout)}*{p0}")
    return "+".join(terms) or "0"


PEN_OFFSETS = (0, 2, 3)  # normal monsters, champions, uniques and minions (levels above the monster level)


def pen_alias(level, k):
    return f"MXPEN{level}_{k}"


def avg_plain(maps):
    """The average plain T1-T3 map's exp (no penalty): the 1x of the experience line before the penalty."""
    base = [m.plain for m in maps.values() if m.tier <= 3]
    return sum(base) / len(base)


# The experience line's 1x: the average plain map of these tiers for the viewer. Dungeons against T3 maps (the
# author, 2026-10-17: at level 97 nobody weighs a dungeon against T1 maps); every other map against T1-T3.
BASELINES = {"MXAVG": (1, 2, 3), "MXT3AVG": (3,)}


def baseline(mp):
    return "MXT3AVG" if mp.tier == 4 else "MXAVG"


def avg_txt(maps, avg0, tiers):
    """BH text of the average plain map of these tiers' exp at the viewer's level, / avg0."""
    coef = collections.Counter()
    base = [m for m in maps.values() if m.tier in tiers]
    for m in base:
        for k, v in zip(PEN_OFFSETS, m.parts3()):
            coef[m.level + k] += v
    return "+".join(f"{num_txt(coef[lv] / (len(base) * avg0))}*{pen_txt(str(lv))}" for lv in sorted(coef))


def exp_txt(mp, avg0):
    """BH text of the experience line (alias MXX_<code>): a full clear of this map with its rolls for the viewer
    (level penalty, their own +XP %), divided by the average plain map for the same viewer (baseline). Output only:
    the penalties (%MXPEN<level>_<k>%) and the averages (%MXAVG%, %MXT3AVG%) are aliases defined after it."""
    pens = tuple(f"%{pen_alias(mp.level, k)}%" for k in PEN_OFFSETS)
    return (f"(100+CHARSTAT85+STAT373)/(100+CHARSTAT85)*IF(STAT493,2,1)*({personal_num_txt(mp, avg0, pens)})"
            f"*{level_txt(mp)}/(%{baseline(mp)}%)")


def shared_aliases(maps, avg0):
    """[(name, body)] the experience lines share: the penalties per map level and offset, and the averages."""
    out = [(pen_alias(lv, k), pen_txt(f"{lv}+STAT374" + (f"+{k}" if k else "")))
           for lv in sorted({m.level for m in maps.values()}) for k in PEN_OFFSETS]
    return out + [(name, avg_txt(maps, avg0, tiers)) for name, tiers in BASELINES.items()]


def expand_output(text, shared):
    """BH's output alias pass for the shared aliases (each %NAME% replaced by its body)."""
    for name, body in shared:
        text = text.replace(f"%{name}%", body)
    return text


def vs_average(mp, maps, clvl, own_xp=0, d=0, r=0, x=0, alvl=0, fort=False, guest=None):
    """The experience line: this map with its rolls for a character of level clvl, over the average plain map of
    its baseline tiers (dungeons: T3; the rest: T1-T3) for the same character."""
    def pexp(m, parts, lvl):
        return sum(v * penalty(clvl, lvl + k) for k, v in zip(PEN_OFFSETS, parts))
    base = [m for m in maps.values() if m.tier in BASELINES[baseline(mp)]]
    avg = sum(pexp(m, m.parts3(), m.level) for m in base) / len(base)
    return ((100 + own_xp + x) / (100 + own_xp) * (2 if fort else 1) * pexp(mp, mp.parts3(d, r, fort, guest),
            mp.level + alvl) * xp_level(mp.level + alvl) / xp_level(mp.level) / avg)


def personal_txt(mp):
    s = mp.plain
    n0, kc0, ku0 = (v / s for v in mp.parts3())
    L = str(mp.level)
    den = (f"{num_txt(n0)}*{pen_txt(L)}+{num_txt(kc0)}*{pen_txt(L + '+2')}+{num_txt(ku0)}*{pen_txt(L + '+3')}")
    return (f"(100+CHARSTAT85+STAT373)/(100+CHARSTAT85)*IF(STAT493,2,1)*({personal_num_txt(mp, s)})/({den})"
            f"*{level_txt(mp)}")


# ------------------------------------------------------------------ check: evaluate the BH text like BH

def bh_eval(text, stats, charstats):
    py = re.sub(r"CHARSTAT(\d+)", r"C[\1]", text)
    py = re.sub(r"STAT(\d+)", r"S[\1]", py)
    py = py.replace("IF(", "iff(").replace("MIN(", "min(").replace("MAX(", "max(")
    py = py.replace("FLOOR(", "math.floor(").replace("SQRT(", "math.sqrt(")
    return eval(py, {"iff": lambda c, a, b: a if c else b, "math": math, "S": stats, "C": charstats})


def check(maps, n=400):
    rng = random.Random(1)
    worst = 0.0
    avg0 = avg_plain(maps)
    shared = shared_aliases(maps, avg0)
    for mp in maps.values():
        rt, pt = roll_txt(mp), personal_txt(mp)
        xt = expand_output(exp_txt(mp, avg0), shared)
        for _ in range(n):
            d, r, x, a = rng.choice([0, rng.randint(0, 400)]), rng.choice([0, rng.randint(0, 150)]), \
                rng.randint(0, 60), rng.choice([0, 0, 1, 2])
            fort = rng.random() < 0.2
            guest = rng.choice([None] * 3 + mp.guests) if mp.guests else None
            clvl, own = rng.randint(70, 98), rng.choice([0, 0, 5, 10])
            S = collections.defaultdict(int, {372: d, 375: r, 373: x, 374: a, 493: 50 if fort else 0})
            if guest:
                S[guest] = 1169  # the stat's value is the monster's hcIdx
            C = {12: clvl, 85: own}
            for got, want in ((bh_eval(rt, S, C), roll_multiplier(mp, d, r, x, a, fort, guest)),
                              (bh_eval(pt, S, C), personal_multiplier(mp, clvl, own, d, r, x, a, fort, guest)),
                              (bh_eval(xt, S, C), vs_average(mp, maps, clvl, own, d, r, x, a, fort, guest))):
                worst = max(worst, abs(got - want) / want)
    return worst


def render_section(maps):
    """sections/146-map-experience.filter: per map its MXR_<code> alias, one tag rule per band, its MXX_<code>
    alias and the experience line; then the aliases the experience lines share."""
    avg0 = avg_plain(maps)
    lines = [
        "// ===================================  Map Experience Tags  ===================================",
        "// GENERATED by tools/gen_map_exp.py - do not edit. It reads docs/pd2-map-exp.tsv (rewritten by the model,",
        "// map_exp.py, after a PD2 patch). The tag: the experience of a full clear of this map with its",
        "// rolls divided by the same map without them (density, monster rarity, +XP %, +area level, Fortification,",
        "// a guest monster: IF(STAT<n>,...) picks its numbers).",
        "// Bands per tier, gold / red / purple from: " + ", ".join(
            f"T{t} {' / '.join(f'{v / 10:.1f}x' for v in BANDS[t])}" for t in (1, 2)) + ",",
        "// " + ", ".join(f"T{t} {' / '.join(f'{v / 10:.1f}x' for v in BANDS[t])}" for t in (3, 4)) + "; no tag below.",
        "// The same percentiles of rare maps in every tier (10th / 60th / 95th); unique maps by their area level's",
        "// tier. Tenths cut off, so the colour matches the digits. T1-T3: leftmost on the tag line (145 opens it);",
        "// T4 and unique maps: a tag line under the name; 147 ends every map's display. MXR_<code>: the multiplier.",
        "// The experience line (description, under 145's density / rarity highlights; BH draws description lines",
        "// bottom up): a full clear of this map with its rolls for the viewer (level penalty, their own +XP %) over",
        "// the average white T1-T3 map for the same viewer (dungeons: the average white T3 map), characters of level",
        "// 80-98. MXX_<code>: that ratio, with the penalties and the averages as aliases at the end (output only, so",
        "// an alias may use a later one).",
    ]
    for mp in sorted(maps.values(), key=lambda m: (m.tier, m.code)):
        c = mp.code.upper()
        tenths = f"FLOOR(10*(%MXR_{c}%)+0.0001)"
        shown = f"$f(FLOOR({tenths}/10)).$f(MOD({tenths},10))x"
        join = "%CS%" if mp.tier <= 3 else "%CL%"  # T4 and unique maps: no tag line of their own yet
        tier = TIER_NAMES[mp.tier] + (f", T{band_tier(mp)} bands" if mp.tier == 5 else "")
        lines += ["", f"// {mp.name} ({tier})", f"Alias[MXR_{c}]:{roll_txt(mp)}"]
        for color, test in band_tests(mp, f"FLOOR(10*(MXR_{c})+0.0001)"):
            lines.append(f"ItemDisplay[{mp.code} ID $f({test})]:{color}{shown}{join}%NAME%{{%NAME%}}%CONTINUE%//")
        x_tenths = f"FLOOR(10*(%MXX_{c}%)+0.0001)"
        lines += [f"Alias[MXX_{c}]:{exp_txt(mp, avg0)}",
                  f"ItemDisplay[{mp.code} ID CLVL>79 CLVL<99]:%NAME%{{%GOLD%$f(FLOOR({x_tenths}/10)).$f(MOD({x_tenths},10))"
                  f"x Experience%CL%%NAME%}}%CONTINUE%//"]
    lines += ["", "// Shared by the experience lines: the level penalty of normal monsters, champions (+2) and uniques",
              "// (+3) per map level, and the average white T1-T3 map's (MXAVG) and T3 map's (MXT3AVG, dungeons')",
              "// experience at the viewer's level."]
    lines += [f"Alias[{name}]:{body}" for name, body in shared_aliases(maps, avg0)]
    return "\r\n".join(lines) + "\r\n"


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Map experience tags (roll multiplier) from docs/pd2-map-exp.tsv.")
    ap.add_argument("--check", action="store_true", help="exit 1 if the section is out of date")
    ap.add_argument("--selftest", action="store_true", help="evaluate the formulas' BH text against the model")
    ap.add_argument("--print", action="store_true", help="every map's multipliers for a few rolls")
    args = ap.parse_args()
    maps = load()
    if args.selftest:
        worst = check(maps)
        print(f"formula text vs model: worst relative difference {worst:.2e} (constants written to 6 digits)")
        if worst > 1e-4:
            sys.exit("the BH text and the Python model disagree")
        return
    if args.print:
        for mp in sorted(maps.values(), key=lambda m: (m.tier, m.code)):
            print(f"{mp.code} {mp.name:26s} plain {mp.plain / 1e6:6.1f}M  roll x{roll_multiplier(mp, 100, 30, 15):.2f}"
                  f" (100 den, 30 rar, 15 xp)  personal at 95: x{personal_multiplier(mp, 95, 0, 100, 30, 15):.2f}")
        return
    section = render_section(maps).encode("utf-8")
    stale = not OUT.exists() or OUT.read_bytes() != section
    if args.check:
        if stale:
            sys.exit(f"out of date (run: python tools/gen_map_exp.py): {OUT.relative_to(ROOT)}")
        print("map experience tags up to date")
        return
    if stale:
        OUT.write_bytes(section)
    print(f"{len(maps)} maps; updated: {OUT.relative_to(ROOT) if stale else 'nothing'}")


if __name__ == "__main__":
    main()
