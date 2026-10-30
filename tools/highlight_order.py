#!/usr/bin/env python3
"""
The author's page for the order of the description lines (2026-10-29): every line the filter writes into the hover
box of gear, charms and jewels, grouped in kinds (the notes on top, the highlights under them), and sample items drawn
as their hover boxes look today and in the order of a priority list the author drags into shape. The published page
(a private claude.ai artifact) saves the list in its db: collection `order`, document `main`,
{order: [kind ids], note, savedAt}.

How BH builds the description (ItemDisplay.cpp, ItemDescLookupCache): every rule that matches replaces it with its
{...}, in which %NAME% is the description so far, and a rule without %CONTINUE% ends it. The hover text is one string
drawn bottom up, so {X%CL%%NAME%} puts X under the lines so far (the highlights: a later rule's line sits lower),
{%NAME%%CL%X} puts X over them (the notes: a later rule's note sits higher) and {%NAME% X} extends the top line. A
color code carries over to the line above: a line without its own color takes the one the line under it ends in.

The samples are real items on tools/shop_map.py's engine (a base, the game's own affixes, a corruption; every rule of
Erazure - Main run for them). Each rule's change to the description is diffed to tag every line with its kind, and
every rule of 230-360 that writes a description belongs to exactly one kind (or the run stops).

    python tools/highlight_order.py                 writes tools/.cache/highlight_order.html (gitignored)
    python tools/highlight_order.py --dump [ID]     each sample's hover box as text, its lines' kinds and rules
    python tools/highlight_order.py --check FILE    exit 1 unless every sample's lines come in the order of FILE (the
                                                    db document as JSON, {"order": [kind ids]})
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402
import explain_item as E  # noqa: E402
import label_cuts as LC  # noqa: E402
import pd2_data as P  # noqa: E402
import shop_map as S  # noqa: E402

ROOT = build.ROOT
TEMPLATE = ROOT / "tools" / "highlight_order_template.html"
PAGE = ROOT / "tools" / ".cache" / "highlight_order.html"
FIRST, LAST = 230, 360  # the sections whose description lines the page orders

COLOR_WORDS = "|".join(sorted(S.COLORS, key=len, reverse=True))
COLOR_TOKEN_RE = re.compile(r"%(?:" + COLOR_WORDS + r")%")


def plain(desc):
    """A description template without its color words, spaces collapsed (for matching kinds)."""
    return re.sub(r"\s+", " ", COLOR_TOKEN_RE.sub("", desc)).strip()


# ---------------------------------------------------------------- the kinds of lines, in today's order (top first)

# id, name, group, where it shows, match(section number, template without colors, raw template). The order is the
# filter's: the notes (their rules run latest first), then the highlights (earliest first); the author's order of
# 2026-10-29 (the page's db, order/main), every sample's lines in it (page_data checks).
KINDS = [
    ("crafted-alvl", "Crafted Affix Level", "note",
     "Uncorrupted magic and rare crafting bases (not equipped)",
     lambda n, t, raw: n == 340),
    ("speed", "Weapon speed and range", "note",
     "Weapons except wands and orbs (bows and crossbows: base speed)",
     lambda n, t, raw: n == 330 and "Speed:" in t),
    ("block-dex", "Max Block Dex", "note",
     "Equipped shields",
     lambda n, t, raw: n == 230 and "Max Block Dex" in t),
    ("max-sockets", "Max Sockets (L / P / C)", "note",
     "Identified magic and better body armor, helms, circlets, shields, weapons and quivers without sockets",
     lambda n, t, raw: n == 230 and (raw == "%NAME%%CL%" or "Max Sockets:" in t or re.search(r" [PC]:\$f\(", t))),
    ("corrupt-upgrade", "Corrupt After Upgrade", "note",
     "Bases that hold one more socket once upgraded (rare and better, uncorrupted, no sockets)",
     lambda n, t, raw: n == 230 and "After Upgrade" in t),
    ("nmag-sockets", "Maximum Sockets", "note",
     "Non-magical items without sockets (not boots, belts or gloves)",
     lambda n, t, raw: n == 230 and "Maximum Sockets:" in t),
    ("upgrade", "Upgrade requirements", "note",
     "Identified rare, crafted, unique and set gear of the normal and exceptional tiers",
     lambda n, t, raw: n == 230 and re.search(r"%NAME%%CL%Upgrade:|%(UPSTR|UPDEX|UPLVL|STAT91)%", t)),
    ("upgrade-recipe", "Cube upgrade recipe", "note",
     "The same items (the recipe that upgrades them)",
     lambda n, t, raw: n == 230 and raw.startswith("%NAME%%CL%") and " + " in t and "Perf" in t),
    ("socket-recipe", "Cube socketing recipe", "note",
     "Non-magical body armor, weapons, helms, circlets, shields and quivers without sockets (replaces the lines "
     "before it)",
     lambda n, t, raw: n == 230 and "Cube Socketing Recipe" in t),
    ("runewords", "Possible runewords", "note",
     "Non-magical items with sockets (replaces the lines before it)",
     lambda n, t, raw: n == 230 and "Possible Runewords" in t),
    ("charm-reroll", "Grand charm reroll note", "highlight",
     "Identified magic grand charms from item level 91 (replaces the lines before it)",
     lambda n, t, raw: n == 240 and "can be rerolled" in t),
    ("jewel", "Jewel notes", "highlight",
     "Magic jewels (fragments), rare jewels (reroll recipe, rerolled affix level)",
     lambda n, t, raw: n == 250 and ("Jewel Fragments" in t or "Rerolled Affix Level" in t)),
    ("lld", "Low Level Dueling", "highlight",
     "Magic charms, magic and rare jewels up to required level 30",
     lambda n, t, raw: n in (240, 250) and "Low Level Dueling" in t),
    ("charm", "Charm highlights", "highlight",
     "Magic charms: Physical, Attack Speed, Cast Rate, an element's damage, Vengeance",
     lambda n, t, raw: n == 240 and "Low Level Dueling" not in t and "can be rerolled" not in t),
    ("boss", "Boss gear tags", "highlight",
     "Identified rare and crafted amulets, rings, shields, belts, body armor, helms, circlets, gloves, boots; magic "
     "amulets",
     lambda n, t, raw: n == 270),
    ("skill", "Skill and shop highlights", "highlight",
     "Circlets, amulets, rings, gloves, helms, body armor, shields, class items, caster weapons, shop items",
     lambda n, t, raw: n == 280),
    ("resist", "Resistance tags", "highlight",
     "All, Triple or Dual Resist (the first that holds), else one line per resistance; most gear on levels 0-4 "
     "below character level 80, boots, belts and gloves on every level",
     lambda n, t, raw: n == 285 and "Resist" in t),
    ("lr", "Lower Resist", "highlight",
     "Weapons that cast it on striking, staves on casting (never with Amplify Damage: one affix group)",
     lambda n, t, raw: n == 320 and "Lower Resist" in t),
    ("amp", "Amplify Damage", "highlight",
     "Weapons that cast it on striking, staves on casting (never with Lower Resist: one affix group)",
     lambda n, t, raw: n == 320 and "Amplify Damage" in t),
    ("ed", "Enhanced Damage", "highlight",
     "Weapons from 250% (magic, rare, crafted); body armor from 100%, shields with 10% damage reduction",
     lambda n, t, raw: n in (320, 350) and "Enhanced Damage" in t),
    ("dr", "Damage Reduction", "highlight",
     "Belts, helms, circlets, rings, boots, body armor, shields",
     lambda n, t, raw: n in (300, 350) and "Damage Reduction" in t),
    ("maxres", "Max Resistances", "highlight",
     "Rare and crafted amulets and belts",
     lambda n, t, raw: n == 360 and "Max Resistances" in t),
    ("cbf", "Cannot Be Frozen", "highlight",
     "An equipped item with half freeze duration, when you wear two",
     lambda n, t, raw: n == 360 and "Cannot Be Frozen" in t),
]
KIND_IDS = [k[0] for k in KINDS]
PRESETS = {"today": KIND_IDS}


def section_number(rule):
    m = re.search(r"sections/(\d{3})-", rule.where)
    return int(m.group(1)) if m else None


def short(where):
    """sections/285-resist-tags.filter:43 -> 285:43"""
    m = re.search(r"sections/(\d{3})-[^:]*:(\d+)", where)
    return f"{m.group(1)}:{m.group(2)}" if m else where


def classify(rules):
    """{rule where: kind id} for every rule of 230-360 that writes a description (not just %NAME%); a rule in no
    kind or in two stops the run."""
    out, problems = {}, []
    for r in rules:
        n = section_number(r)
        if n is None or not FIRST <= n <= LAST or r.desc == "%NAME%":
            continue
        if r.desc == "":
            if r.cont:
                problems.append(f"{r.where}: %CONTINUE% without a description (it empties the lines before it)")
            continue  # a hide rule (it stops)
        t = plain(r.desc)
        hits = [k[0] for k in KINDS if k[4](n, t, r.desc)]
        if len(hits) != 1:
            problems.append(f"{r.where}: {'no kind' if not hits else 'kinds ' + ', '.join(hits)}: {t[:90]}")
        else:
            out[r.where] = hits[0]
    if problems:
        raise SystemExit("description rules without one kind of KINDS (tools/highlight_order.py):\n  " +
                         "\n  ".join(problems))
    return out


# ---------------------------------------------------------------- the samples

# shop_map's sample items (base, quality, affixes by the game's name with a value, corruption, character level and
# class, item level, place), and the filter level, and values a rule asks that the item doesn't give (the character's
# stats). Each must get the lines named in `expect`.
SAMPLES = [
    {"id": "belt", "title": "Rare belt (your screenshot)", "base": "hbl", "quality": "RARE",
     "name": ["Storm", "Harness"], "def": 12, "ilvl": 88, "clvl": 90, "class": "SORCERESS", "place": "CUBE",
     "filtlvl": 9,
     "affixes": [("Saintly", 67), ("Coral", 26), ("Garnet", 29), ("of Atlas", 29), ("of the Whale", 95),
                 ("of Defending", 9)], "corrupt": 72,
     "expect": ["upgrade", "upgrade-recipe", "boss", "dr", "maxres", "resist"]},
    {"id": "amulet", "title": "Rare amulet", "base": "amu", "quality": "RARE", "name": ["Raven", "Torc"],
     "ilvl": 95, "clvl": 75, "class": "SORCERESS", "place": "INVENTORY", "filtlvl": 3,
     "affixes": ["Arch-Angel's", ("Ruby", 35), ("Amber", 35), ("of Amelioration", 50), "of the Apprentice",
                 ("of Atlas", 25)], "corrupt": 72,
     "expect": ["boss", "maxres", "resist"]},
    {"id": "circlet", "title": "Rare circlet", "base": "ci3", "quality": "RARE", "name": ["Havoc", "Visage"],
     "ilvl": 99, "clvl": 75, "class": "SORCERESS", "place": "INVENTORY", "filtlvl": 3,
     "affixes": ["Arch-Angel's", ("Ruby", 35), ("Sapphire", 35), "of the Magus", "of Speed", ("of Defending", 8)],
     "expect": ["max-sockets", "skill", "dr", "resist"]},
    {"id": "armor", "title": "Rare body armor", "base": "xtp", "quality": "RARE", "name": ["Doom", "Shroud"],
     "ilvl": 99, "clvl": 75, "class": "PALADIN", "place": "INVENTORY", "filtlvl": 3,
     "affixes": [("Rampaging", 190), ("Ruby", 35), ("Sapphire", 35), ("of Guardianship", 22),
                 ("of the Whale", 90), "of Defiance"],
     "expect": ["crafted-alvl", "max-sockets", "upgrade", "upgrade-recipe", "ed", "dr", "resist"]},
    {"id": "shield", "title": "Rare shield, worn", "base": "xit", "quality": "RARE", "name": ["Bramble", "Ward"],
     "ilvl": 99, "clvl": 75, "class": "BARBARIAN", "place": "EQUIPPED", "filtlvl": 3,
     "values": {"CHARSTAT20": 50},
     "affixes": [("Embattled", 150), ("Ruby", 35), ("Sapphire", 35), ("of Guardianship", 22),
                 ("of the Whale", 90), "of Defiance"],
     "expect": ["block-dex", "max-sockets", "upgrade", "upgrade-recipe", "ed", "dr", "resist"]},
    {"id": "gloves", "title": "Rare gloves", "base": "xhg", "quality": "RARE", "name": ["Grim", "Grip"],
     "ilvl": 99, "clvl": 90, "class": "AMAZON", "place": "INVENTORY", "filtlvl": 9,
     "affixes": ["Spearmaiden's", ("Coral", 28), ("Jade", 28), "of Alacrity", ("of Might", 5)],
     "expect": ["upgrade", "skill", "resist"]},
    {"id": "boots", "title": "Rare boots, worn with a second half freeze item", "base": "uhb", "quality": "RARE",
     "name": ["Gale", "Track"], "ilvl": 99, "clvl": 90, "class": "SORCERESS", "place": "EQUIPPED", "filtlvl": 9,
     "values": {"CHARSTAT118": 2},
     "affixes": [("Amber", 35), ("Sapphire", 35), "of Thawing", ("of Precision", 12)], "corrupt": 52,
     "expect": ["dr", "cbf", "resist"]},
    {"id": "ring", "title": "Rare ring", "base": "rin", "quality": "RARE", "name": ["Viper", "Knot"],
     "ilvl": 99, "clvl": 75, "class": "BARBARIAN", "place": "INVENTORY", "filtlvl": 3,
     "affixes": [("Platinum", 110), ("Scintillating", 15), ("of Performance", 11), ("of Carnage", 12),
                 "of Remedy"], "corrupt": 52,
     "expect": ["skill", "dr", "resist"]},
    {"id": "axe", "title": "Rare two-handed axe", "base": "lax", "quality": "RARE", "name": ["Bone", "Cleaver"],
     "ilvl": 99, "clvl": 90, "class": "BARBARIAN", "place": "INVENTORY", "filtlvl": 9,
     "affixes": [("Visceral", 360), ("King's", 90), "of Amplify Damage", "of Quickness", ("of the Lamprey", 8)],
     "expect": ["crafted-alvl", "speed", "max-sockets", "corrupt-upgrade", "upgrade", "upgrade-recipe", "ed", "amp"]},
    {"id": "staff", "title": "Rare staff", "base": "6ws", "quality": "RARE", "name": ["Empyrian", "Spire"],
     "ilvl": 99, "clvl": 75, "class": "SORCERESS", "place": "INVENTORY", "filtlvl": 3,
     "staffmods": {"Blizzard": 3},
     "affixes": [("Arch-Angel's", 3), ("Ruby", 35), ("Sapphire", 35), "of Lower Resist"],
     "expect": ["crafted-alvl", "speed", "max-sockets", "lr", "resist"]},
    {"id": "charm", "title": "Magic grand charm", "base": "cm3", "quality": "MAG", "ilvl": 40, "clvl": 90,
     "class": "NECROMANCER", "place": "INVENTORY", "filtlvl": 9,
     "affixes": [("Sharp", 10), ("of Sustenance", 25)],
     "expect": ["lld", "charm"]},
    {"id": "jewel", "title": "Magic jewel", "base": "jew", "quality": "MAG", "ilvl": 40, "clvl": 90,
     "class": "NECROMANCER", "place": "INVENTORY", "filtlvl": 9,
     "affixes": [("Ruby", 30), ("of Virility", 6)],
     "expect": ["lld", "jewel"]},
    {"id": "rare-jewel", "title": "Rare jewel", "base": "jew", "quality": "RARE", "name": ["Rune", "Eye"],
     "ilvl": 99, "clvl": 90, "class": "NECROMANCER", "place": "INVENTORY", "filtlvl": 9,
     "values": {"REROLLALVL": 84, "STAT486": 0},
     "affixes": [("Ruby", 40), ("Vermilion", 15), ("of Virility", 9)],
     "expect": ["jewel"]},
    {"id": "monarch", "title": "Non-magical shield, no sockets", "base": "uit", "quality": "NMAG", "ilvl": 85,
     "clvl": 90, "class": "PALADIN", "place": "INVENTORY", "filtlvl": 9,
     "expect": ["nmag-sockets", "socket-recipe"]},
]


class Sample(S.Item):
    def __init__(self, data, spec):
        super().__init__(data, {k: v for k, v in spec.items() if k not in ("expect", "filtlvl", "values", "title")})
        self.filtlvl = spec.get("filtlvl", 9)
        self.extra = dict(spec.get("values", {}))

    def corrupt(self, outcome, value):
        """shop_map's, but a cube input may also name the base's own code (CubeMain's rings are "rin")."""
        types = self.types
        self.types = list(types) + [self.code]
        try:
            super().corrupt(outcome, value)
        finally:
            self.types = types


def upgrade_values(item):
    """BH's UPSTR / UPDEX / UPLVL (ItemDisplay.cpp UpStatCondition): the next tier's base requirements, eased by
    the item's -requirements % (an ethereal item 10 less), and the higher of that base's level and the item's own."""
    b = item.base
    up = b["ubercode"] if item.code == b["normcode"] else b["ultracode"] if item.code == b["ubercode"] else ""
    if not up or up == item.code or up not in item.data.bases:
        return {}
    u = item.data.bases[up]
    ease = item.value(91)
    out = {}
    for key, col in (("UPSTR", "reqstr"), ("UPDEX", "reqdex")):
        req = S.num(u[col])
        delta = int(req * ease / 100) - (10 if item.spec.get("eth") else 0)
        out[key] = max(0, req + delta)
    out["UPLVL"] = max(S.num(u["levelreq"]), item.req_level())
    return out


def model_of(item, formulas):
    m = S.Model(item, formulas)
    m.v.update(upgrade_values(item))
    m.v["FILTLVL"] = item.filtlvl
    m.v.update(item.extra)
    return m


def split(text):
    return text.split("\n") if text else []


def apply(template, cur, v, base):
    """LC.apply, with formulas nested any depth ($f(CEIL(CHARSTAT12*150/(CHARSTAT20+30)+15)), Max Block Dex): BH
    reads them whole, LC.FORMULA_RE one level of brackets deep."""
    out, i = [], 0
    while True:
        j = template.find("$f(", i)
        if j < 0:
            out.append(template[i:])
            break
        depth, k = 0, j + 2
        while k < len(template):
            depth += {"(": 1, ")": -1}.get(template[k], 0)
            if depth == 0:
                break
            k += 1
        x = LC.eval_formula(template[j + 3:k], v)
        out += [template[i:j], P.bh_number(x) if isinstance(x, float) else str(int(x))]
        i = k + 1
    return LC.apply("".join(out), cur, v, base)


def attribute(before, after, kind, where):
    """The lines after a rule changed the description, each (kind, rule, text), from the lines before it."""
    bt = [t for _, _, t in before]
    n, m = len(bt), len(after)
    if m > n and after[m - n:] == bt:  # new lines first in the string: under the lines so far
        return [(kind, where, t) for t in after[:m - n]] + before
    if m > n and after[:n] == bt:  # new lines last: over them
        return before + [(kind, where, t) for t in after[n:]]
    if m == n and n and after[:-1] == bt[:-1] and after[-1].startswith(bt[-1]):  # the top line extended
        k, w, _ = before[-1]
        return before[:-1] + [(k, w, after[-1])]
    return [(kind, where, t) for t in after]  # replaced


def run(rules, kinds, model):
    """(name, the description's lines bottom up as (kind, rule, text), the rule that stopped) as BH builds them."""
    item = model.item
    color = "%" + S.QUALITY_COLOR[item.quality] + "%"
    base = item.base["name"]
    if item.quality in ("RARE", "CRAFT"):
        name = color + base + "\n" + color + item.name()
    else:
        name = color + item.name()
    name = LC.apply(name, "", {}, base)
    desc, lines, stop = "", [], None
    for r in rules:
        x = LC.ev(r.tree, model.atom)
        if x == E.MAYBE:
            raise SystemExit(f"{item.spec['id']}: {r.where} may match: the sample gives no value for "
                             f"{', '.join(sorted(model.unknown))} (add it to the sample's values)")
        if x != 1:
            continue
        name = apply(r.name, name, model.v, base)
        new = apply(r.desc, desc, model.v, base)
        after = split(LC.trim(new))
        if after != [t for _, _, t in lines]:
            if r.where not in kinds:
                raise SystemExit(f"{item.spec['id']}: {r.where} changes the description, outside "
                                 f"{FIRST}-{LAST}: {r.desc[:80]}")
            lines = attribute(lines, after, kinds[r.where], short(r.where))
        desc = new
        if not r.cont:
            stop = r
            break
    if [t for _, _, t in lines] != split(LC.trim(desc)):
        raise SystemExit(f"{item.spec['id']}: the tagged lines differ from BH's description")
    return LC.trim(name), lines, stop


# ---------------------------------------------------------------- the hover box

def raw_segments(text):
    """[[color or None, text]] of one line: None until its first color code (it takes the color of the line under
    it); and the color it ends in (None: the one it started in)."""
    segs, end = S.segments(text, None)
    return [[c, t] for c, t in segs], end


def resolved(lines_bottom_up, color):
    """Lines bottom up -> [[[color, text]]] top first, each color carried to the line above as in game."""
    out = []
    for text in lines_bottom_up:
        segs, color = S.segments(text, color)
        out.append([[c, t] for c, t in segs])
    return list(reversed(out)), color


def box(item, name, lines, v):
    """The hover box as the game draws it: the lines under the description (sockets, affixes; their colors fixed),
    the description's lines (raw: the page carries their colors in its own order), the lines over it (BH's Item /
    Affix Level, the base lines, the name; each starts with its own color, so the description's order can't change
    them)."""
    blue, green = S.code("BLUE"), S.code("DARK_GREEN")
    under = []
    if item.value(194):
        under.append(f"{blue}{item.data.text(3453)} ({item.value(194)})")
    for text, rng, star in reversed(S.stat_lines(item)):
        text = text.replace("Ã¿c", "\xffc")  # pd2-stat-text.tsv holds the game's ÿ twice encoded
        star = f"{S.code('RED')}*{blue}" if star else ""
        under.append(blue + text + star + (f" {green}[{rng[0]} - {rng[1]}]{blue}" if rng else ""))
    over = []
    if item.quality in ("MAG", "RARE", "CRAFT") and item.alvl != item.ilvl:
        over.append(f"{S.code('WHITE')}Affix Level: {item.alvl}")
    over.append(f"{S.code('WHITE')}Item Level: {item.ilvl}")
    over += list(reversed(S.base_lines(item, v)))
    over += name.split("\n")
    if item.place == "SHOP":
        over.append(f"{item.data.text(3329)}{S.price(item)}")
    if not over[0].startswith("\xffc"):
        raise SystemExit(f"{item.spec['id']}: the line over the description has no color of its own")
    tail, carry = resolved(under, "BLUE")
    head, _ = resolved(over, "WHITE")
    desc = []
    for kind, where, text in reversed(lines):  # top first
        segs, _ = raw_segments(text)
        desc.append({"kind": kind, "rule": where, "segs": segs})
    # the same box drawn whole, bottom up, as S.tooltip draws it: the page's own carry must give the same colors
    whole, _ = resolved(under + [t for _, _, t in lines] + over, "BLUE")
    return {"head": head, "desc": desc, "tail": tail, "carry": carry}, whole


def carry_colors(desc, carry):
    """The description's lines (top first, raw) with their colors carried bottom up from `carry`."""
    out = []
    for line in reversed(desc):
        segs = []
        for c, t in line["segs"]:
            c = c or carry
            segs.append([c, t])
            carry = c
        out.append(segs)
    return list(reversed(out))


# ---------------------------------------------------------------- the data

def sample_data(spec, rules, kinds, formulas, data):
    item = Sample(data, spec)
    model = model_of(item, formulas)
    name, lines, stop = run(rules, kinds, model)
    got = {k for k, _, _ in lines}
    missing = [k for k in spec.get("expect", []) if k not in got]
    if missing:
        raise SystemExit(f"sample {spec['id']}: no {', '.join(missing)} line (it has {', '.join(sorted(got))})")
    b, whole = box(item, name, lines, model.v)
    drawn = b["head"] + carry_colors(b["desc"], b["carry"]) + b["tail"]
    if drawn != whole:
        raise SystemExit(f"sample {spec['id']}: the page's colors would differ from the game's")
    where = {"CUBE": "in the Horadric Cube", "INVENTORY": "in the inventory", "EQUIPPED": "worn",
             "STASH": "in the stash", "SHOP": "in a shop"}[item.place]
    who = f"{S.CLASS_NAME[item.cls]} level {item.clvl}"
    return dict(b, id=spec["id"], title=spec["title"],
                setting=f"Filter level {item.filtlvl} · {who} · {where}",
                stop=short(stop.where) if stop else "")


def order_of(desc):
    """The kinds of a description's lines, top first, each once."""
    out = []
    for line in desc:
        if line["kind"] not in out:
            out.append(line["kind"])
    return out


def out_of_order(desc, order):
    """[(a, b)]: kind a over kind b in the description, though the order puts b first."""
    rank = {k: i for i, k in enumerate(order)}
    kinds = order_of(desc)
    return [(a, b) for i, a in enumerate(kinds) for b in kinds[i + 1:] if rank.get(a, 99) > rank.get(b, 99)]


# example values for a rule's look in the reference: the condition's own where it bounds the word (STAT36>17 -> 18)
EXAMPLE = {"STAT36": 10, "ED": 300, "EDAM": 150, "REROLLALVL": 84, "CRAFTALVL": 87, "UPSTR": 110, "UPDEX": 55,
           "UPLVL": 63, "MAXSOCKETS": 4, "WPNSPD": 0, "RANGE": 1, "FRW": 20, "FCR": 20, "IAS": 20,
           "CHARSTAT12": 90, "CHARSTAT20": 50, "STAT91": -20}
COMPARE_RE = re.compile(r"(?<![\w,])([A-Z][A-Z0-9]*)([<>=~])(-?\d+)(?:-(\d+))?")
TOKEN_RE = re.compile(r"%([A-Z][A-Z0-9_]*)%")


def example_values(rule):
    v = dict(EXAMPLE)
    for key in set(TOKEN_RE.findall(rule.desc)):
        lo = hi = None
        for k, op, a, b in COMPARE_RE.findall(rule.cond):
            if k != key:
                continue
            a = int(a)
            if op == ">":
                lo = max(lo if lo is not None else a + 1, a + 1)
            elif op == "<":
                hi = min(hi if hi is not None else a - 1, a - 1)
            elif op == "=":
                lo = hi = a
            else:
                lo, hi = a, int(b)
        if lo is not None or hi is not None:
            v[key] = lo if lo is not None else hi
        elif key.startswith("SK") and key[2:].isdigit():
            v[key] = 3
    return v


def looks(rules, kinds, samples, limit=14):
    """{kind: (its looks as drawn [[[color, text]]], how many more)}: the samples' lines first, then each rule's
    own line(s) with example values (lines that only extend another line are left out)."""
    out = {k[0]: [] for k in KINDS}
    seen = {k[0]: set() for k in KINDS}
    total = {k[0]: 0 for k in KINDS}

    def add(kind, segs):
        key = re.sub(r"\d+", "N", json.dumps(segs))
        if key in seen[kind]:
            return
        seen[kind].add(key)
        total[kind] += 1
        if len(out[kind]) < limit:
            out[kind].append(segs)

    for s in samples:
        for line in s["desc"]:
            add(line["kind"], [[c or "WHITE", t] for c, t in line["segs"]])
    for r in rules:
        kind = kinds.get(r.where)
        if not kind:
            continue
        d = r.desc
        if kind in ("upgrade", "max-sockets"):
            continue  # a line several rules build (Upgrade's Str / Dex / Lvl, Max Sockets' L / P / C): the samples'

        text = LC.trim(apply(d, "", example_values(r), "Plated Belt"))
        for line in split(text):
            if line.strip():
                add(kind, [[c or "WHITE", t] for c, t in raw_segments(line)[0]])
    return {k: (out[k], total[k] - len(out[k])) for k in out}


def ranges(rules, kinds):
    """{kind: ['230:6-38', '280 (391 rules)']}: its rules' lines per section, runs of lines joined (a section with
    more than three runs as its count of rules)."""
    by = {k[0]: {} for k in KINDS}
    for r in rules:
        kind = kinds.get(r.where)
        if kind:
            sec, line = short(r.where).split(":")
            by[kind].setdefault(sec, []).append(int(line))
    out = {}
    for kind, secs in by.items():
        parts = []
        for sec, lines in secs.items():
            lines.sort()
            runs, start = [], lines[0]
            prev = start
            for n in lines[1:] + [None]:
                if n is not None and n - prev <= 5:  # comments or blank lines between rules of one run
                    prev = n
                    continue
                runs.append(f"{sec}:{start}" + (f"-{prev}" if prev != start else ""))
                if n is not None:
                    start = prev = n
            parts += runs if len(runs) <= 3 else [f"{sec} ({len(lines)} rules)"]
        out[kind] = parts
    return out


def page_data():
    data = S.Data()
    rules, formulas = S.load_rules()
    kinds = classify(rules)
    samples = [sample_data(s, rules, kinds, formulas, data) for s in SAMPLES]
    for s in samples:
        wrong = out_of_order(s["desc"], PRESETS["today"])
        if wrong:
            raise SystemExit(f"sample {s['id']}: today it shows {', '.join(f'{a} over {b}' for a, b in wrong)}, "
                             "not in KINDS' order (the Today list would misdescribe it)")
    look, where = looks(rules, kinds, samples), ranges(rules, kinds)
    used = {line["kind"] for s in samples for line in s["desc"]}
    _, season, date = build.load_version()
    return {"kinds": [{"id": k[0], "name": k[1], "group": k[2], "on": k[3], "rules": where[k[0]],
                       "looks": look[k[0]][0], "more": look[k[0]][1], "sampled": k[0] in used} for k in KINDS],
            "presets": PRESETS, "samples": samples, "colors": {k: "#" + v for k, v in S.COLORS.items()},
            "foot": f"Built from the filter's sections ({build.version_text(season, date)}) by "
                    "tools/highlight_order.py: the sample items are run through every rule of Erazure - Main."}


def page_text(data):
    return TEMPLATE.read_text(encoding="utf-8").replace(
        "/*__DATA__*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")))


# ---------------------------------------------------------------- reports

def text_of(segs):
    return "".join(t for _, t in segs)


def check(path):
    """Exit 1 unless every sample's description comes in the order of the saved list."""
    order = json.loads(Path(path).read_text(encoding="utf-8")).get("order") or []
    unknown = [k for k in order if k not in KIND_IDS]
    missing = [k for k in KIND_IDS if k not in order]
    if unknown or missing:
        raise SystemExit(f"{path}: unknown kinds {unknown}, missing {missing}")
    bad = 0
    for s in page_data()["samples"]:
        wrong = out_of_order(s["desc"], order)
        if wrong:
            bad += 1
            print(f"{s['id']}: {', '.join(f'{a} over {b}' for a, b in wrong)}")
    if bad:
        sys.exit(1)
    print(f"every sample's lines come in the order of {Path(path).name}")


def dump(only=None):
    data = page_data()
    for s in data["samples"]:
        if only and s["id"] != only:
            continue
        print(f"== {s['id']}: {s['title']} ({s['setting']}){' stops at ' + s['stop'] if s['stop'] else ''}")
        for segs in s["head"]:
            print(f"   {'':16} {text_of(segs)}")
        for line in s["desc"]:
            print(f"   {line['kind'] + ' ' + line['rule']:>16} {text_of(line['segs'])}")
        for segs in s["tail"]:
            print(f"   {'':16} {text_of(segs)}")


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="The description line order page, from the filter's own rules.")
    ap.add_argument("--dump", nargs="?", const="", metavar="ID")
    ap.add_argument("--check", metavar="FILE")
    args = ap.parse_args()
    if args.dump is not None:
        return dump(args.dump or None)
    if args.check:
        return check(args.check)
    data = page_data()
    PAGE.parent.mkdir(parents=True, exist_ok=True)
    text = page_text(data)
    PAGE.write_text(text, encoding="utf-8", newline="\n")
    lines = sum(len(s["desc"]) for s in data["samples"])
    print(f"wrote {PAGE.relative_to(ROOT)} ({len(text) // 1024} KB): {len(data['kinds'])} kinds of lines, "
          f"{len(data['samples'])} samples ({lines} description lines)")


if __name__ == "__main__":
    main()
