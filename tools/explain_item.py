#!/usr/bin/env python3
"""
Explain how the filter treats one item: which rules match, in order, where the display stops (and
whether the item is shown or hidden), and which rule decides the drop notification and sound.

It follows the PD2 BH source, like tools/lint_filter.py: aliases are replaced as text in definition
order; AND and OR have equal precedence and are read left to right; a malformed condition never
matches; in the notification pass the first matching rule (TIER permitting) alone decides the sound
and text notification, while minimap icons stack until the first matching rule without %CONTINUE%.

Everything you don't specify (character level, class, map, stats, grail state...) is unknown. Rules
that depend on it are listed as "maybe" and evaluation continues past them, so read the first MATCH
that stops as the answer when every "maybe" before it is false.

Usage (from the repo root):
    python tools/explain_item.py CODE QUALITY [options]       QUALITY: NMAG MAG RARE UNI SET CRAFT
    python tools/explain_item.py 7ws UNI --level 12
    python tools/explain_item.py xmg SET --level 9 --set ALLDISCOVERED=1
    python tools/explain_item.py r30 NMAG --set QTY=1 --variant "Erazure - BIG GG"

Options:
    --level N        filter level (FILTLVL)
    --id, --eth      identified / ethereal (default: not ethereal; unidentified, except NMAG items,
                     which are always identified: use --unid for a gamble-screen item)
    --groups A,B     item groups that apply (e.g. ARMOR,HELM,ELT); every other group is then false
    --class NAME     AMAZON, ASSASSIN, BARBARIAN, DRUID, NECROMANCER, PALADIN or SORCERESS
    --where PLACE    GROUND (default), INVENTORY, STASH, CUBE, SHOP, EQUIPPED or MERC
    --set K=V        a value: CLVL=90, MAPID=1, SOCK=4, SK123=3, QTY=1, ALLDISCOVERED=1, SUP=1 ...
                     (repeatable; boolean codes take 1 or 0)
    --variant NAME   a display name from filter_definitions.json (default: Erazure - Main)
    --all            also list %CONTINUE% layers that only may apply (stat tags etc.)
"""
import argparse
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402
import lint_filter as L  # noqa: E402

QUALITIES = {"NMAG", "MAG", "RARE", "UNI", "SET", "CRAFT"}
CLASSES = {"AMAZON", "ASSASSIN", "BARBARIAN", "DRUID", "NECROMANCER", "PALADIN", "SORCERESS"}
PLACES = {"GROUND", "INVENTORY", "STASH", "CUBE", "SHOP", "EQUIPPED", "MERC"}
GROUPS = set("""ARMOR WEAPON HELM CHEST SHIELD GLOVES BOOTS BELT CIRC AXE MACE CLUB TMACE HAMMER SWORD
DAGGER THROWING JAV SPEAR POLEARM BOW XBOW STAFF WAND SCEPTER 1H 2H NORM EXC ELT CLASS DRU BAR DIN NEC
SIN SOR ZON MISC JEWELRY CHARM QUIVER EQ1 EQ2 EQ3 EQ4 EQ5 EQ6 EQ7 WP1 WP2 WP3 WP4 WP5 WP6 WP7 WP8 WP9
WP10 WP11 WP12 WP13 CL1 CL2 CL3 CL4 CL5 CL6 CL7""".split())
COMPARE_RE = re.compile(r"^(.+?)([<>=~])(-?\d+)(?:-(\d+))?$")
GEM_RE = re.compile(r"(g[a-z]{2}|sk[a-z])s?")
KIND_KEYS = {"RUNE": re.compile(r"r\d\ds?"), "GOLD": re.compile(r"gld"),
             "GEM": GEM_RE, "GEMLEVEL": GEM_RE, "GEMTYPE": GEM_RE}
MAYBE = 0.5


class Item:
    def __init__(self, args):
        self.code, self.quality = args.code, args.quality.upper()
        self.groups = None if args.groups is None else {g.strip().upper() for g in args.groups.split(",") if g.strip()}
        self.cls = args.cls.upper() if args.cls else None
        self.where = args.where.upper()
        # White items are always identified in D2 (NMAG !ID only matches gamble items)
        identified = args.id or (self.quality == "NMAG" and not args.unid)
        self.values = {"ID": int(identified), "ETH": int(args.eth)}
        if args.level is not None:
            self.values["FILTLVL"] = args.level
        for kv in args.set:
            k, _, v = kv.partition("=")
            self.values[k.strip().upper()] = int(v)
        rune = re.fullmatch(r"r(\d\d)s?", self.code)
        if rune:
            self.values.setdefault("RUNE", int(rune.group(1)))


def atom(word, item):
    """Value of one condition word: 1 true, 0 false, 0.5 unknown."""
    v = item.values
    if word in ("TRUE", "FALSE"):
        return int(word == "TRUE")
    if word == "$f":
        return MAYBE  # formula island
    if word in QUALITIES:
        return int(word == item.quality)
    if word in CLASSES:
        return MAYBE if item.cls is None else int(word == item.cls)
    if word in PLACES:
        return int(word == item.where)
    if word in GROUPS:
        return MAYBE if item.groups is None else int(word in item.groups)
    m = COMPARE_RE.match(word)
    if not m:
        if word in v:
            return int(bool(v[word]))
        if word in ("INF", "SUP", "RW", "GEMMED"):
            return 0
        if len(word) >= 3 and not any(c.isupper() for c in word[:3]):
            return int(word == item.code)  # BH: an item code
        return MAYBE
    key, op, a, b = m.group(1), m.group(2), int(m.group(3)), m.group(4)
    if key in KIND_KEYS and key not in v and not KIND_KEYS[key].fullmatch(item.code):
        return 0  # BH: RUNE/GEM/GOLD comparisons are false for other kinds of item
    total = 0
    for part in key.split("+"):
        x = value_of(part, item)
        if x is None:
            return MAYBE
        total += x
    hi = int(b) if b is not None else a
    return int({"=": total == a, "<": total < a, ">": total > a, "~": a <= total <= hi}[op])


def value_of(key, item):
    v = item.values
    if key in v:
        return v[key]
    if key == "MAPTIER" and not re.fullmatch(r"t\d[0-9a-z]", item.code):
        return -1  # BH: -1 for non-maps
    return None


def expand_condition(cond, aliases):
    """BH: each alias name is replaced wherever it occurs, in definition order."""
    for name, value in aliases.items():
        for _ in range(100):
            if name not in cond:
                break
            cond = cond.replace(name, value, 1)
    return cond


def evaluate(cond, item):
    """BH ProcessConditions (shunting-yard, equal precedence) and Convert/EvaluateTree, 3-valued."""
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
                return 0  # BH stops processing: malformed, never matches
            ops.pop()
        else:
            out.append(("op", t))
    while ops:
        t = ops.pop()
        if t == "(":
            return 0
        out.append(t)
    stack = []
    for t in out:
        if isinstance(t, tuple):
            stack.append(atom(t[1], item))
        elif t == "!":
            if not stack:
                return 0
            stack.append(1 - stack.pop())
        else:
            if len(stack) < 2:
                return 0
            b, a = stack.pop(), stack.pop()
            stack.append(min(a, b) if t == "AND" else max(a, b))
    return stack[0] if len(stack) == 1 else (1 if not out else 0)


def action(output, aliases):
    """(name, continues, notifies, sound, tier) of a rule's output, parsed in BH's order."""
    out = L.expand_output_aliases(output, aliases)
    notifies, tier = False, None
    for key in ("BORDER", "MAP", "DOT", "PX", "LINE", "NOTIFY", "TIER"):
        m = re.search(L.NOTIFY_PATTERNS[key], out, re.I)
        if m:
            if key == "TIER":
                tier = int(m.group(0)[6:-1])
            elif key != "NOTIFY":
                notifies = True
            out = out[:m.start()] + out[m.end():]
    l, r = out.find("{"), out.find("}")
    if 0 <= l < r:
        out = out[:l] + out[r + 1:]
    sound = re.search(r"%SOUNDID-([0-9]{1,4})%", out, re.I)
    sound = int(sound.group(1)) if sound else 0
    if "%MAP%" in out:
        notifies = True
    continues = "%CONTINUE%" in out
    name = out.replace("%CONTINUE%", "", 1)
    return name, continues, notifies or sound > 0, sound, tier


def shows_name(name):
    used, _, literal = L.replacements(name.strip(" ").strip("\t"))
    return bool(literal.strip()) or any(u not in L.BH_COLORS for u in used)


def load(variant):
    parts, _ = build.read_sections(check=True)
    where = build.line_locator(parts)
    _, season, date = build.load_version()
    joined = b"".join(d for _, d in parts).replace(build.PLACEHOLDER, build.version_text(season, date).encode())
    lines = joined.split(b"\r\n")
    blocks = build.find_toggle_blocks(lines)
    if variant not in blocks:
        sys.exit(f"unknown variant '{variant}'; choose one of: {', '.join(blocks)}")
    return [x.decode("utf-8") for x in build.render(lines, blocks, variant)], where


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Explain which filter rules match an item.")
    ap.add_argument("code")
    ap.add_argument("quality", choices=sorted(QUALITIES) + sorted(q.lower() for q in QUALITIES))
    ap.add_argument("--level", type=int)
    ap.add_argument("--id", action="store_true")
    ap.add_argument("--unid", action="store_true")
    ap.add_argument("--eth", action="store_true")
    ap.add_argument("--groups")
    ap.add_argument("--class", dest="cls", choices=sorted(CLASSES) + sorted(c.lower() for c in CLASSES))
    ap.add_argument("--where", default="GROUND", choices=sorted(PLACES) + sorted(p.lower() for p in PLACES))
    ap.add_argument("--set", action="append", default=[], metavar="K=V")
    ap.add_argument("--variant", default=build.MAIN)
    ap.add_argument("--all", action="store_true")
    args = ap.parse_args()
    item = Item(args)

    lines, where = load(args.variant)
    lt = L.Linter(lines, where, False)
    rules = []
    for r in lt.rules:
        name, continues, notifies, sound, tier = action(r.output, lt.aliases)
        rules.append((r, expand_condition(r.cond, lt.aliases), name, continues, notifies, sound, tier))

    tag = {1: "MATCH", MAYBE: "maybe"}
    print(f"Display ({args.variant}):")
    skipped = 0
    for r, cond, name, continues, *_ in rules:
        v = evaluate(cond, item)
        if not v:
            continue
        if v == MAYBE and continues and not args.all:
            skipped += 1
            continue
        kind = "continue" if continues else ("SHOWN" if shows_name(name) else "HIDDEN")
        print(f"  {tag[v]:5}  {where(r.idx):48} {kind:8}  {r.output.strip()[:70]}")
        if v == 1 and not continues:
            break
    else:
        print("  (no rule stops it: the game shows the item as is)")
    if skipped:
        print(f"  (+{skipped} %CONTINUE% layers that may apply, e.g. stat tags; --all lists them)")

    level = item.values.get("FILTLVL")
    print("Notification (first match decides sound and text):")
    icons_done = False
    for r, cond, name, continues, notifies, sound, tier in rules:
        if not notifies:
            continue
        if tier is not None and level not in (None, 0) and tier < level:
            continue
        v = evaluate(cond, item)
        if not v:
            continue
        what = f"sound {sound}" if sound else "no sound"
        tier_note = f", %TIER-{tier}%" if tier is not None else ""
        print(f"  {tag[v]:5}  {where(r.idx):48} {what}{tier_note}")
        if v == 1:
            icons_done = True
            break
    if not icons_done:
        print("  (no certain match: no drop notification unless a 'maybe' applies)")


if __name__ == "__main__":
    main()
