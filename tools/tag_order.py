#!/usr/bin/env python3
"""
Keep the affix tags (sections/300-affix-tags.filter) in the order the game lists the item's stats.

Each tag line puts its tag in front of the name, so a later line's tag sits further left. The game lists an
item's stats by ItemStatCost.txt's descpriority, highest first (checked against in-game screenshots of
Guardian Angel, Ormus' Robes, Titan's Grip, Nature's Peace and Kira's Guardian). So the tag lines go from the
stat shown lowest on the item to the one shown highest: one block per stat, the lowest first. A block keeps
its lines in the order they had.

Stats with the same priority come in an order that differs between items (Ormus' Robes and Nature's Peace list
the higher stat ID first, Kira's Guardian lists -cold, -fire, -lightning). Here the higher stat ID goes further
left; where that matters, a grouped tag can follow each item's own order (the -res group, ERES_ORDER in
gen_unique_rolls.py).

Description notes stay in their own order: a tag line that also writes a description is split in two, and
the description lines sit together at the end of the section, in the order they had.

tools/pd2_stat_priority.tsv is PD2's ItemStatCost.txt (id, stat, descpriority), from pd2data.mpq
(python tools/pd2_data.py --extract, each season; then --fix).

sections/305-runeword-rolls.filter (the runeword roll tags) is generated in the same order by
tools/gen_runeword_rolls.py: it is checked here too, and fixed by regenerating it, never by --fix.

Usage (from the repo root):
    python tools/tag_order.py               list tag lines that are out of order (lint_filter.py runs this)
    python tools/tag_order.py --fix         re-sort sections/300-affix-tags.filter into stat blocks
"""
import argparse
import bisect
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
SECTION = ROOT / "sections" / "300-affix-tags.filter"
SECTION_NAME = "sections/300-affix-tags.filter"
RUNEWORD_SECTION = ROOT / "sections" / "305-runeword-rolls.filter"
RUNEWORD_SECTION_NAME = "sections/305-runeword-rolls.filter"
FIX_HINTS = {SECTION_NAME: "run python tools/tag_order.py --fix",
             RUNEWORD_SECTION_NAME: "regenerate it: python tools/gen_runeword_rolls.py"}
TABLE = TOOLS / "pd2_stat_priority.tsv"

# ---------------------------------------------------------------- which stats a tag shows

NAMED = {"ALLSK": [127], "FCR": [105], "FHR": [99], "FBR": [102], "FRW": [96], "IAS": [93], "EDAM": [17],
         "EDEF": [16], "DEF": [31], "AR": [19], "ARPER": [119], "MINDMG": [21], "MAXDMG": [22], "LIFE": [7],
         "MANA": [9], "STR": [0], "DEX": [2], "MFIND": [80], "GFIND": [79], "DTM": [114], "MAEK": [138],
         "REPLIFE": [74], "ITD": [115], "FRES": [39], "LRES": [41], "CRES": [43], "PRES": [45],
         "RES": [39, 41, 43, 45], "MAXRES": [40, 42, 44, 46], "ALLATTRIB": [0, 1, 2, 3]}
ELEM_SKILLS = {1: 363, 2: 364, 3: 366, 4: 362, 5: 365}  # MULTI126,<element>: the +N to <element> Skills line
# Tags without a value keyword: their label -> the stat they show
LABELS = {"Rep": [252], "Hfd": [118], "ATD": [78], "Cbf": [153], "Res": [39, 41, 43, 45], "drain": [74],
          "itd": [115], "ITD": [115], "blk": [20], "all": [127], "Ind": [152]}
CHANCE_TO_CAST = {"amp", "lr"}  # weapon suffixes: on striking (198), on casting for staves (200)
GROUPS = {frozenset([39, 41, 43, 45]): "All Resistances", frozenset([40, 42, 44, 46]): "All Maximum Resistances",
          frozenset([0, 1, 2, 3]): "All Attributes"}
TITLES = {
    0: "Strength", 1: "Energy", 2: "Dexterity", 3: "Vitality", 7: "Life", 9: "Mana", 16: "Enhanced Defense",
    17: "Enhanced Damage", 19: "Attack Rating", 20: "Increased Chance of Blocking", 21: "Minimum Damage",
    22: "Maximum Damage", 27: "Mana Regeneration", 31: "Defense", 34: "Flat Physical Damage Reduction",
    35: "Magic Damage Reduction", 36: "% Physical Damage Reduction", 39: "Fire Resist", 40: "Max Fire Resist",
    41: "Lightning Resist", 42: "Max Lightning Resist", 43: "Cold Resist", 44: "Max Cold Resist",
    45: "Poison Resist", 46: "Max Poison Resist", 48: "Fire Damage", 54: "Cold Damage", 60: "Life Steal",
    62: "Mana Steal", 74: "Replenish Life", 76: "% Maximum Life", 77: "% Maximum Mana", 78: "Attacker Takes Damage",
    79: "Gold Find", 80: "Magic Find", 83: "+ Class Skills", 86: "Life per Kill", 87: "Reduced Vendor Prices",
    89: "Light Radius", 91: "-% Requirements", 93: "Increased Attack Speed", 96: "Faster Run/Walk",
    99: "Faster Hit Recovery", 102: "Faster Block Rate", 105: "Faster Cast Rate", 107: "+ Single Skill",
    109: "Reduced Curse Duration", 110: "Poison Length Reduction", 111: "+ Damage", 114: "Damage Taken Goes to Mana",
    115: "Ignore Target's Defense", 116: "-% Target Defense", 118: "Half Freeze Duration",
    119: "% Bonus to Attack Rating", 120: "-Target Defense per Hit", 121: "% Damage to Demons",
    122: "% Damage to Undead", 123: "Attack Rating against Demons", 124: "Attack Rating against Undead",
    127: "+ All Skills", 128: "Attacker Takes Lightning Damage", 136: "Crushing Blow", 138: "Mana per Kill",
    139: "Life per Demon Kill", 141: "Deadly Strike", 142: "% Fire Absorb", 143: "Fire Absorb",
    144: "% Lightning Absorb", 145: "Lightning Absorb", 148: "% Cold Absorb", 150: "Slows Target",
    147: "Magic Absorb", 151: "Aura When Equipped", 152: "Indestructible", 153: "Cannot Be Frozen",
    156: "Piercing Attack", 32: "Defense vs. Missile", 258: "Chance of Critical Strike", 216: "Life per Level", 220: "Strength per Level", 238: "Attacker Takes Damage per Level",
    240: "Magic Find per Level",
    188: "+ Skill Tab", 198: "Chance to Cast on Striking", 200: "Chance to Cast when Casting",
    252: "Repair Durability", 329: "+% Fire Skill Damage", 330: "+% Lightning Skill Damage",
    331: "+% Cold Skill Damage", 332: "+% Poison Skill Damage", 333: "-% Enemy Fire Resist",
    334: "-% Enemy Lightning Resist", 335: "-% Enemy Cold Resist", 336: "-% Enemy Poison Resist",
    357: "+% Magic Skill Damage", 362: "+ Cold Skills", 363: "+ Fire Skills", 364: "+ Lightning Skills",
    365: "+ Poison Skills", 366: "+ Magic Skills", 423: "Leap Speed", 424: "Life per Hit",
    425: "-% Enemy Physical Resist", 501: "Open Wounds Damage", 504: "Curse Resistance",
}
COLORS = set("""WHITE RED GREEN BLUE GOLD GRAY BLACK TAN ORANGE YELLOW PURPLE DARK_GREEN CORAL SAGE TEAL
LIGHT_GRAY CS CL NL PERCENT""".split())
KEYWORD = re.compile(r"%([A-Z_]+[0-9]*(?:,[0-9]+)?)%")
WEAPON_WORD = re.compile(r"(?<![!\w])WEAPON\b")


def load_table():
    prio, names = {}, {}
    for line in TABLE.read_text(encoding="utf-8").splitlines():
        if line and not line.startswith("#"):
            sid, name, p = line.split("\t")
            prio[int(sid)], names[int(sid)] = int(p) if p else -1, name
    return prio, names


PRIO, STAT_NAMES = load_table() if TABLE.exists() else ({}, {})


def rank(stat):
    """Higher = shown higher on the item."""
    return PRIO.get(stat, -1), stat


def keyword_stats(kw, cond):
    if kw == "ED":
        return [17] if WEAPON_WORD.search(cond) else [16]
    if kw in NAMED:
        return NAMED[kw]
    m = re.fullmatch(r"(STAT|SK|OS|CLSK|TABSK|CHSK)(\d+)", kw)
    if m:
        return [int(m.group(2))] if m.group(1) == "STAT" else \
            [{"SK": 107, "OS": 97, "CLSK": 83, "TABSK": 188, "CHSK": 204}[m.group(1)]]
    m = re.fullmatch(r"MULTI(\d+),(\d+)", kw)
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        return [ELEM_SKILLS.get(b, a)] if a == 126 else [a]
    return None


def split_rule(line):
    """(condition, name part, description, rest after the description) of an ItemDisplay line."""
    close = line.index("]:")
    cond, out = line[len("ItemDisplay["):close], line[close + 2:]
    if "{" in out and "}" in out[out.index("{"):]:
        a = out.index("{")
        b = out.index("}", a)
        return cond, out[:a], out[a + 1:b], out[b + 1:]
    name, _, rest = out.partition("%CONTINUE%")
    return cond, name, None, "%CONTINUE%" + rest if "%CONTINUE%" in out else rest


def tag_text(name):
    """What the line puts before %NAME% (None if nothing)."""
    if "%NAME%" not in name:
        return None
    pre = name.split("%NAME%")[0]
    return pre if re.sub(r"%(CS|CL|NL)%", "", pre).strip() else None


FORMULA = re.compile(r"\$f\(((?:[^()]|\([^()]*\))*)\)")


def formula_stat(m):
    """A $f(...) value shows the first stat it reads: $f(ABS(STAT74)), $f(STAT220/8) (Strength per level)."""
    stat = re.search(r"\bSTAT\d+\b", m.group(1), re.I)
    return f"%{stat.group(0).upper()}%" if stat else m.group(0)


def tag_stats(pre, cond):
    """The tag's chunks (split at its spaces), each as the stats it shows; None if a chunk is unknown."""
    pre = FORMULA.sub(formula_stat, pre)
    chunks = []
    for chunk in re.sub(r"%(CS|CL|NL)%", " ", pre).split(" "):
        kws = [k for k in KEYWORD.findall(chunk) if k not in COLORS]
        text = KEYWORD.sub("", chunk)
        if not kws and not text.strip():
            continue
        stats = []
        for k in kws:
            s = keyword_stats(k, cond)
            if s is None:
                return None
            stats += s
        if not stats:
            label = re.sub(r"[\d\-/%+]", "", text)
            if label in CHANCE_TO_CAST:
                stats = [200] if re.search(r"(?<![!\w])STAFF\b", cond) else [198]
            elif label in LABELS:
                stats = LABELS[label]
            else:
                return None
        chunks.append(stats)
    return chunks


def block_key(chunks):
    """A tag's place: its leftmost chunk. A group shown as one line (all resistances...) sits just above its
    highest member's block."""
    first = chunks[0]
    top = max(first, key=rank)
    return rank(top) + (1 if frozenset(first) in GROUPS else 0,)


def block_title(key, chunks):
    first = chunks[0]
    group = GROUPS.get(frozenset(first)) if key[2] else None
    name = group or TITLES.get(key[1]) or STAT_NAMES.get(key[1], f"stat {key[1]}")
    return f"// ---- {name} (stat {key[1]}{'+' if group else ''}, priority {key[0]}) ----"


# ---------------------------------------------------------------- the section as units

HEADER_RE = re.compile(r"^// ---- .* \(stat \d+\+?, priority -?\d+\) ----$|^// ---- Description notes .*----$")
DECORATED_RE = re.compile(r"^//\s*[-=]{4,}|={4,}")


def read_section():
    return SECTION.read_bytes().decode("utf-8").split("\r\n")


def units(lines):
    """Preamble lines, then [{'comments', 'line', 'n', 'kind', ...}] for each rule in file order.
    Comments directly above a rule belong to it; decorated section headers and generated block headers
    are dropped (the blocks get new ones)."""
    preamble, out, pending, started = [], [], [], False
    units.dropped = []
    for n, line in enumerate(lines, 1):
        s = line.strip()
        if not s:
            if not started:
                preamble.extend(pending + [line])
            else:
                units.dropped += [p for p in pending if not DECORATED_RE.search(p.strip())]
            pending = []
            continue
        if s.startswith("//"):
            if HEADER_RE.match(s) or (started and DECORATED_RE.search(s)):
                pending = []
                continue
            pending.append(line)
            continue
        cond, name, desc, rest = split_rule(line)
        pre = tag_text(name)
        kind = "tag" if pre else ("desc" if desc is not None and desc.strip() != "%NAME%" else "plain")
        if kind == "plain" and not started:
            preamble.extend(pending + [line])
            pending = []
            continue
        started = True
        out.append({"comments": pending, "line": line, "n": n, "kind": kind, "cond": cond, "name": name,
                    "desc": desc, "rest": rest, "pre": pre})
        pending = []
    while preamble and (not preamble[-1].strip() or DECORATED_RE.search(preamble[-1].strip())):
        preamble.pop()  # blank lines and the old section header before the first block
    return preamble, out


def check(lines=None, hint=FIX_HINTS[SECTION_NAME]):
    """[(line number, severity, message, key)] for the section (300, or the lines given)."""
    lines = read_section() if lines is None else lines
    _, rules = units(lines)
    found, placed = [], []
    for u in rules:
        if u["kind"] != "tag":
            continue
        chunks = tag_stats(u["pre"], u["cond"])
        if chunks is None:
            found.append((u["n"], "error", "can't tell which stat this tag shows: add its keyword or label to "
                          "tools/tag_order.py", u["line"]))
            continue
        top = [PRIO.get(max(c, key=rank), -1) for c in chunks]  # equal priorities: the item decides the order
        if any(a < b for a, b in zip(top, top[1:])):
            found.append((u["n"], "warning", "the tag's own parts are not in the order the game lists them",
                          u["line"]))
        if u["desc"] is not None and u["desc"].strip() != "%NAME%":
            found.append((u["n"], "warning", "a tag line that also writes a description: --fix splits it so "
                          "the description keeps its order", u["line"]))
        placed.append((block_key(chunks), u, chunks))
    # The lines out of place: those outside the longest run that is already in order (fewest to move)
    tails, prev = [], [None] * len(placed)
    for i, (key, _, _) in enumerate(placed):
        j = bisect.bisect_right([placed[t][0] for t in tails], key)
        prev[i] = tails[j - 1] if j else None
        tails[j:j + 1] = [i]
    keep, k = set(), tails[-1] if tails else None
    while k is not None:
        keep.add(k)
        k = prev[k]
    for i, (key, u, chunks) in enumerate(placed):
        if i not in keep:
            found.append((u["n"], "error",
                          f"this {STAT_NAMES.get(key[1], key[1])} tag is out of the game's stat order (it belongs "
                          f"under '{block_title(key, chunks)[8:-5]}'): {hint}", u["line"]))
    return sorted(found, key=lambda f: f[0])


def fix():
    lines = read_section()
    preamble, rules = units(lines)
    blocks, notes = {}, []
    for u in rules:
        if u["kind"] != "tag":
            notes.append((u["comments"], u["line"]))
            continue
        chunks = tag_stats(u["pre"], u["cond"])
        if chunks is None:
            sys.exit(f"{SECTION_NAME}:{u['n']}: can't tell which stat this tag shows; add it to tools/tag_order.py")
        key = block_key(chunks)
        line = u["line"]
        if u["desc"] is not None and u["desc"].strip() != "%NAME%":  # split: the note keeps its place
            head = f"ItemDisplay[{u['cond']}]:"
            line = f"{head}{u['name']}{{%NAME%}}{u['rest']}"
            notes.append((u["comments"], f"{head}%NAME%{{{u['desc']}}}{u['rest']}"))
        blocks.setdefault(key, {"title": block_title(key, chunks), "units": []})["units"].append(
            (u["comments"], line))
    for c in units.dropped:
        print(f"note: comment not directly above a rule, left out: {c.strip()}")
    out = list(preamble)
    for key in sorted(blocks):
        out += ["", blocks[key]["title"], ""]
        for i, (comments, line) in enumerate(blocks[key]["units"]):
            if comments and i:
                out.append("")
            out += comments + [line]
    if notes:
        out += ["", "// ---- Description notes (in their original order; they do not move with the tags) ----", ""]
        for i, (comments, line) in enumerate(notes):
            if comments and i:
                out.append("")
            out += comments + [line]
    data = ("\r\n".join(out) + "\r\n").encode("utf-8")
    if data != SECTION.read_bytes():
        SECTION.write_bytes(data)
        print(f"re-sorted {SECTION_NAME}: {len(blocks)} stat blocks, {len(notes)} description notes")
    else:
        print(f"{SECTION_NAME} already in order")


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Keep the affix tags in the game's stat order.")
    ap.add_argument("--fix", action="store_true", help=f"re-sort {SECTION_NAME}")
    args = ap.parse_args()
    if args.fix:
        fix()
        return
    found = [(SECTION_NAME, f) for f in check()]
    if RUNEWORD_SECTION.exists():
        rw_lines = RUNEWORD_SECTION.read_bytes().decode("utf-8").split("\r\n")
        found += [(RUNEWORD_SECTION_NAME, f) for f in check(rw_lines, FIX_HINTS[RUNEWORD_SECTION_NAME])]
    for name, (n, severity, message, _) in found:
        print(f"{name}:{n}: {severity}: {message}")
    print(f"{len(found)} finding(s)" if found else "affix and runeword tags in the game's stat order")
    sys.exit(1 if any(f[1] == "error" for _, f in found) else 0)


if __name__ == "__main__":
    main()
