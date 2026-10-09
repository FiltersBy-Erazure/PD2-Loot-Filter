#!/usr/bin/env python3
"""
Generate the runeword variable-roll tags.

A runeword shows its variable rolls as tags on their own line under its name, left to right in the order the
game lists them top to bottom, in the look the filter gives the same stat on uniques and sets (the stat's line
in sections/300-affix-tags.filter; a skill or aura without one: the 300 single-skill / aura look with the
author's abbreviation from sections/310-staffmods.filter). A tag shows the item's total: the roll plus the same
stat from the runeword's fixed properties and its runes (Doom's ED includes Ohm's), as the item's own text does.
Runewords take no corruption affixes (their bases are white items, which corrupt only to sockets), so nothing
else shares the tag line.

BH only knows that an item is a runeword (RW), not which one. Each runeword is told apart by its sockets, its
slot and the fewest stats (its own and its runes') that no other runeword with as many sockets in that slot can
have. Stats a white base can bring itself (superior, automagic such as a staff's FCR or a paladin shield's
resistances, staffmods) are never used for that, and neither is total defense (DEF).

    python tools/gen_runeword_rolls.py             update the picks file, write the generated section
    python tools/gen_runeword_rolls.py --check     change nothing; exit 1 if either is out of date
    python tools/gen_runeword_rolls.py --report [NAME]   rolls, totals, picks and fingerprints per runeword
    python tools/gen_runeword_rolls.py --requests  picked rolls that have no look in the filter yet
    python tools/gen_runeword_rolls.py --picker    write tools/runeword_picker.html and open it

Inputs: docs/pd2-runewords.tsv (PD2's own tables, python tools/pd2_data.py --extract), the tag looks in
300-affix-tags, the skill abbreviations in 310-staffmods, and tools/runeword_roll_picks.txt: one line per
runeword (its versions for other bases share it); a line whose comment starts with "auto" is the generator's
default and is rewritten on every run, delete "auto" to keep your change.
Output: sections/305-runeword-rolls.filter.
"""
import argparse
import datetime
import json
import os
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import gen_unique_rolls as U  # noqa: E402  (tag keys, the 300 line reader, the picker template and font)
import pd2_data  # noqa: E402
import tag_order  # noqa: E402

ROOT = U.ROOT
PICKS = ROOT / "tools" / "runeword_roll_picks.txt"
OUT = ROOT / "sections" / "305-runeword-rolls.filter"
PICKER = ROOT / "tools" / "runeword_picker.html"
STAFFMODS = ROOT / "sections" / "310-staffmods.filter"
# Name budget: BH shows 56 characters of the whole name, every line together. A runeword's label is its name
# (gold), its base's name with 220-nonmagic-weapons' Eth tag ("Eth Ghost Spear"; the Sup, Inf and superior %ED tags
# skip runewords), and the tag line (the author's screenshots, 2026-10-08), so two line breaks. The room assumes each
# version's longest elite base, ethereal (the picker previews any base, ethereal or not).
NAME_MAX, LINE_BREAK = U.NAME_MAX, U.LINE_BREAK
BASE_TAG = "Eth "
NAME_COLOR = "GOLD"
# A runeword's own shorter labels (the author, 2026-10-08): its tags of these stats get their own alias and lines
SHORT_LABELS = {"RW Lionheart": {"str": "s", "dex": "d", "vit": "v"}}
SLOT_ORDER = ["WEAPON", "HELM", "CIRC", "CHEST", "SHIELD", "QUIVER"]
TIERS = {"elite": 0, "exceptional": 1, "normal": 2}
UNRELIABLE = {"DEF", "SOCK"}  # total defense depends on the base, ethereal and superior; sockets are the base part
GROUP_PARTS = {"RES": ("FRES", "LRES", "CRES", "PRES"), "ALLATTRIB": ("STR", "DEX", "STAT1", "STAT3")}
COMPANIONS = {"MINDMG", "STAT48", "STAT50", "STAT52", "STAT54"}  # the minimum of "Adds X-Y": goes with its maximum
# Default picks: every roll with a look that fits the room, the most important first when it does not
PRIORITY = [r"allsk", r"clsk\d", r"tabsk", r"multi151_\d+", r"os\d+", r"sk\d+", r"edam", r"edef", r"fcr", r"ias",
            r"fhr", r"frw", r"fbr", r"max", r"stat111", r"res", r"eres_\w+", r"-[flcp]res", r"[flcp]res", r"ar%", r"ar", r"dem",
            r"und", r"cb", r"ds", r"life", r"mana", r"stat76", r"stat77", r"allattrib", r"str", r"dex", r"vit",
            r"nrg", r"ls", r"ms", r"lpk", r"mpk", r"mf", r"gf", r"mdr", r"pdr%?", r"def"]


# ---------------------------------------------------------------- tag keys and looks

def staffmods_labels():
    """{skill id: the author's abbreviation} from 310-staffmods ('%SK<n>%%<color>%<label>%CS%')."""
    out = {}
    for m in re.finditer(r"%SK(\d+)%%[A-Z_]+%([A-Za-z]+)%CS%", STAFFMODS.read_text(encoding="utf-8")):
        out.setdefault(int(m.group(1)), m.group(2))
    return out


SKILL_LABELS = {**U.SKILL_TAG_LABELS, **staffmods_labels()}  # 310 first; the generator's own for Amazon skills
LINES = U.tag_lines()  # the 300 tag lines
AFFIX_TEXT = (ROOT / "sections" / "300-affix-tags.filter").read_text(encoding="utf-8").splitlines()
PER_LEVEL = {}  # per-level stat code -> (the stat it adds to, divisor), from docs/pd2-runewords.tsv (load())


def condition(line):
    text = AFFIX_TEXT[line["n"]]
    return text[len("ItemDisplay["):text.index("]:")]


def positive(cond, alias):
    """The condition needs alias (it appears outside every '!': '!ROLL_X_TAG' lines skip those items)."""
    for m in re.finditer(r"(?<![A-Za-z0-9_])%s(?![A-Za-z0-9_])" % re.escape(alias), cond):
        negated = []
        for i, ch in enumerate(cond[:m.start()]):
            if ch == "(":
                negated.append(i > 0 and cond[i - 1] == "!")
            elif ch == ")" and negated:
                negated.pop()
        if not any(negated) and not (m.start() and cond[m.start() - 1] == "!"):
            return True
    return False


def rw_key(code):
    """The picks-file key of a roll: the unique/set tag key where there is one (fcr, mana, sk62...), edam / edef
    for +% damage / defense, <the stat's key>/lvl for a per-level stat (str/lvl)."""
    if code in PER_LEVEL:
        return rw_key(PER_LEVEL[code][0]) + "/lvl"
    return {"EDAM": "edam", "EDEF": "edef"}.get(code) or U.roll_key(code)


def rw_alias(key, label=None):
    """RW_<X>_TAG; a runeword's own label gets RW_<X>_<LABEL>_TAG (RW_STR_S_TAG)."""
    core = U.TAGS[key][0][len("ROLL_"):-len("_TAG")] if key in U.TAGS else re.sub(r"[^A-Z0-9]+", "_", key.upper())
    return f"RW_{core}_{re.sub(r'[^A-Z0-9]+', '_', label.upper())}_TAG" if label else f"RW_{core}_TAG"


def template_line(pattern):
    """The first 300 roll tag line whose tag is one value of a code matching pattern and a label (the look a
    single skill or an aura gets)."""
    for line in LINES:
        if len(line["chunks"]) == 1 and re.fullmatch(pattern, line["chunks"][0]["kw"] or "") and line["aliases"]:
            return line
    return None


SKILL_LOOK, AURA_LOOK = template_line(r"(SK|OS)\d+"), template_line(r"MULTI151,\d+")


def other_skill(line, code):  # a +skill tab/class line for another tab/class than this roll's
    return any(re.fullmatch(r"(TABSK|CLSK)\d+", c["kw"] or "") and c["kw"] != code for c in line["chunks"])


def same_stat(a, b):
    """Two filter codes for one stat: equal, or a name and its number (STR and STAT0)."""
    if a == b:
        return True
    plain = re.compile(r"STAT\d+|" + "|".join(tag_order.NAMED))
    if not (a and b and plain.fullmatch(a) and plain.fullmatch(b)):
        return False
    sa, sb = tag_order.keyword_stats(a, ""), tag_order.keyword_stats(b, "")
    return bool(sa) and len(sa) == 1 and sa == sb


def variant(line, src, code, whole=False, cmp_src=None):
    """{n, parts, cmps} of one 300 line for a roll shown with code (the line shows src and compares cmp_src):
    its tag chunks of that stat (all of them for a grouped tag), the value comparisons that pick its color."""
    chunks = [c for c in line["chunks"] if whole or same_stat(c["kw"], src)]
    if not chunks and any(same_stat(c, cmp_src or src) and op == "=" for c, op, _ in line["cmps"]):
        chunks = line["chunks"]  # one line per value, the value written out ("ALLSK=2" shows "2all")
    if not chunks:
        return None
    parts = []
    for c in chunks:
        parts += ([[parts[-1][0], " "]] if parts else []) + [[col, t.replace("{v:%s}" % src, "{v:%s}" % code)]
                                                            for col, t in c["parts"]]
    cmps = []
    for c, op, num in line["cmps"]:  # comparisons in other OR branches ("CLSK4=1 OR (SHOP CLSK4>1)") are left out
        a, b = span(cmps + [[op, int(num)]])
        if same_stat(c, cmp_src or src) and a <= b:
            cmps.append([op, int(num)])
    return {"n": line["n"], "parts": parts, "cmps": cmps}


def relabel(line, code, label):
    """A skill or aura template line's look with another value code and label."""
    v = variant(line, line["chunks"][0]["kw"], code)
    v["parts"] = [[col, t if "{v:" in t else label] for col, t in v["parts"]]
    return v


def relabeled(look, label):
    """A look with another label: the text after its value becomes label (Lionheart's '25s')."""
    out = []
    for v in look:
        values = [i for i, (_, t) in enumerate(v["parts"]) if re.search(r"\{[vf]", t)]
        after = [i for i, (_, t) in enumerate(v["parts"]) if i > (values[-1] if values else -1) and t != " "]
        keep = after[-1] if after else None
        out.append({**v, "parts": [[col, label if i == keep else t] for i, (col, t) in enumerate(v["parts"])
                                   if i not in after or i == keep]})
    return out


def look(key, code, slot):
    """How the filter draws roll `key` (shown with code) on a runeword in `slot`: (variants, source). The first
    variant whose comparisons hold for the value applies. source says where the look comes from; None = the
    filter has no look for this stat yet (picking the roll requests one)."""
    if code in PER_LEVEL:  # the look of the stat it adds to, the value per level as BH computes it: 0.75str
        base, divisor = PER_LEVEL[code]
        found, source = look(rw_key(base), base, slot)
        if not found:
            return None, None
        parts = [[col, re.sub(r"\{v:([^}]+)\}", lambda m: "{f:%s/%d}" % (code, divisor) if same_stat(m.group(1), base)
                              else m.group(0), t)] for col, t in found[0]["parts"]]
        return [{"n": found[0]["n"], "parts": parts, "cmps": []}], f"{source}, per level ({code}/{divisor})"
    cmp_src = None
    if key in ("edam", "edef"):  # the +% damage look of weapons (shows EDAM), the +% defense look of armor (ED)
        alias, cmp_src = U.TAGS["ed"][0], "ED"  # both color by ED ranges: here EDAM / EDEF, what BH reads on runewords
        src = "EDAM" if key == "edam" else "ED"
        pool = [l for l in LINES if alias in l["aliases"] and ("WEAPON" in l["slots"]) == (key == "edam")
                and any(c["kw"] == src for c in l["chunks"]) and positive(condition(l), alias)]
    else:
        src, alias = code, U.TAGS[key][0] if key in U.TAGS else None
        pool = [l for l in LINES if alias and alias in l["aliases"] and positive(condition(l), alias)
                and not other_skill(l, code)]
    whole = key.startswith("eres_") or key == "maxres"
    chosen = [l for l in pool if not l["slots"] or slot in l["slots"]]
    if not chosen:  # no line for this slot: the lines of one other slot, a weapon's for a weapon, armor's for armor
        kind = [l for l in pool if ("WEAPON" in l["slots"]) == (slot == "WEAPON")] or pool
        chosen = [l for l in kind if l["slots"] == kind[0]["slots"]]
    found = [v for v in (variant(l, src, code, whole, cmp_src) for l in chosen) if v]
    if found:
        return exclusive(dedupe(found)), f"300-affix-tags line {found[0]['n'] + 1}"
    m = re.fullmatch(r"(SK|OS)(\d+)|MULTI151,(\d+)", code)
    skill = int(m.group(2) or m.group(3)) if m else None
    if skill in SKILL_LABELS and (AURA_LOOK if m.group(3) else SKILL_LOOK):
        template = AURA_LOOK if m.group(3) else SKILL_LOOK
        return [relabel(template, code, SKILL_LABELS[skill])], f"310-staffmods label '{SKILL_LABELS[skill]}'"
    # The stat's look on magic or rare items: its first line only, without that line's thresholds (they decide
    # which items show the tag there, not its color)
    same = [l for l in LINES if any(same_stat(c["kw"], code) for c in l["chunks"])]
    kind = [l for l in same if ("WEAPON" in l["slots"]) == (slot == "WEAPON")] or same
    if kind:
        v = variant(kind[0], code, code)
        return [{**v, "cmps": []}], f"300-affix-tags line {v['n'] + 1} (a magic/rare item's look)"
    return None, None


def dedupe(variants):
    seen, out = set(), []
    for v in variants:
        if signature([v]) not in seen:
            seen.add(signature([v]))
            out.append(v)
    return out


def signature(variants):
    """A look's identity: its parts and comparisons (not the 300 line it came from)."""
    return json.dumps([[v["parts"], v["cmps"]] for v in variants])


def span(cmps):
    lo, hi = float("-inf"), float("inf")
    for op, n in cmps:
        if op == ">":
            lo = max(lo, n + 1)
        elif op == "<":
            hi = min(hi, n - 1)
        else:
            lo, hi = max(lo, n), min(hi, n)
    return lo, hi


def exclusive(variants):
    """The variants whose value ranges do not overlap an earlier one's: one tag per stat (300 can have a second
    line for a stat in a slot, e.g. for corrupted items; on a runeword the first applies)."""
    out = []
    for v in variants:
        a, b = span(v["cmps"])
        if all(b < c or d < a for c, d in (span(o["cmps"]) for o in out)):
            out.append(v)
    return out


def raw(parts):
    """A look's parts as filter text ('%WHITE%%FCR%%TEAL%fcr'; a {f:...} value is a formula: $f(STAT220/8))."""
    out, color = [], None
    for col, text in parts:
        if text == " ":
            out.append(" ")
            continue
        if col != color:
            out.append(f"%{col}%")
            color = col
        text = re.sub(r"\{v:([^}]+)\}", r"%\1%", text.replace("%", "%PERCENT%"))
        out.append(re.sub(r"\{f:([^}]+)\}", r"$f(\1)", text))
    return "".join(out)


def shown(parts, value):
    return "".join(re.sub(r"\{[vf](?::[^}]+)?\}", str(value), t) for _, t in parts)


def code_rank(code):
    """Where the game lists a stat (higher = higher on the item)."""
    stats = tag_order.keyword_stats(code, "") or []
    return max((tag_order.rank(s) for s in stats), default=(-1, -1))


# ---------------------------------------------------------------- runewords

class Variant:
    """One line of docs/pd2-runewords.tsv: a runeword in one kind of base (weapon, armor or shield)."""

    def __init__(self, row):
        self.name, self.index, self.base, self.sockets = row["name"], row["index"], row["base"], row["sockets"]
        self.runes, self.types = row["runes"], row["types"]
        self.slots = sorted(row["slots"], key=lambda s: SLOT_ORDER.index(s) if s in SLOT_ORDER else 99)
        self.addable = set(row["addable"])
        self.props, self.texts = row["props"], row["texts"]
        self.rune_stats, self.rune_texts = row["runestats"], row["runetexts"]
        self.bases = row["bases"]  # [code, name, tier]
        PER_LEVEL.update({code: tuple(v) for code, v in row["perlevel"].items()})
        self.stats = {}  # code -> (lo, hi): the runeword's and its runes' total, as BH reads it
        for prop in self.props + self.rune_stats:
            for code, lo, hi in prop:
                old = self.stats.get(code, (0, 0))
                self.stats[code] = (old[0] + lo, old[1] + hi)
        for group, parts in GROUP_PARTS.items():  # BH: the lowest of the four, if none is 0
            if all(p in self.stats for p in parts):
                self.stats[group] = (min(self.stats[p][0] for p in parts), min(self.stats[p][1] for p in parts))
            else:
                self.stats.pop(group, None)
        self.rolls = {}  # key -> {code, lo, hi (the total), roll (lo, hi of the property), line}
        for prop, text in zip(self.props, self.texts):
            if not prop:
                continue
            code, lo, hi = prop[0]
            if lo == hi or code in COMPANIONS:
                continue
            total = self.stats.get(code, (lo, hi))
            line = text if total == (lo, hi) else f"{text} (shows {pd2_data.value_text(*total)} with the runes)"
            self.rolls.setdefault(rw_key(code), {"code": code, "lo": total[0], "hi": total[1], "roll": (lo, hi),
                                                 "line": line})
        eres = [self.rolls.get(k) for k in U.ERES_KEYS.values()]
        if all(eres):  # all three -% enemy resistances: one grouped tag, as on Kira's Guardian, in the item's order
            letters = {"STAT335": "c", "STAT333": "f", "STAT334": "l"}  # (its properties' order, Famine: cfl)
            order = "".join(dict.fromkeys(letters[p[0][0]] for p in self.props if p and p[0][0] in letters))
            key = f"eres_{order}"
            self.rolls[key] = {"code": U.TAGS[key][1], "lo": min(r["lo"] for r in eres),
                               "hi": max(r["hi"] for r in eres), "roll": None, "line": "All three -% Enemy Resistances"}
        self.fingerprint, self.unresolved = [], []

    def can_add(self, code):
        """A white base of this variant can bring this stat itself."""
        parts = GROUP_PARTS.get(code, (code,))
        return any(p in self.addable or (re.fullmatch(r"SK\d+", p) and "SK*" in self.addable) for p in parts + (code,))

    def slot_text(self):
        return self.slots[0] if len(self.slots) == 1 else "(" + " OR ".join(self.slots) + ")"


class Runeword:
    """A runeword with all its versions and kinds of base: one picks line."""

    def __init__(self, name, variants):
        self.name, self.variants = name, variants
        self.key = f"RW {name}"
        choices = {}  # base name -> (tier, kind of base, version): the bases it fits, the longest elite one first
        for v in variants:
            for _, base, tier in v.bases:
                choices.setdefault(base, (tier, v.base, v))
        self.base_choices = sorted(choices.items(), key=lambda kv: (TIERS[kv[1][0]], -len(kv[0]), kv[0]))
        self.room_base = NAME_MAX - len(name) - 2 * LINE_BREAK  # name, base line and tag line
        self.room = min((self.room_of(v) for v in variants), default=self.room_base)
        self.cands = {}  # key -> candidate (union over the variants: lowest low, highest high)
        for v in sorted(variants, key=lambda v: -len(v.rolls)):
            for key, r in v.rolls.items():
                c = self.cands.setdefault(key, {"key": key, "code": r["code"], "lo": r["lo"], "hi": r["hi"],
                                                "line": r["line"], "slots": []})
                c["lo"], c["hi"] = min(c["lo"], r["lo"]), max(c["hi"], r["hi"])
                c["slots"] += [s for s in v.slots if s not in c["slots"]]
        for c in self.cands.values():
            c["look"], c["source"] = look(c["key"], c["code"], c["slots"][0])
            c["tagged"] = c["look"] is not None
            c["label"] = SHORT_LABELS.get(self.key, {}).get(c["key"])
            if c["label"] and c["look"]:
                c["look"] = relabeled(c["look"], c["label"])
            c["w"] = tag_width(c)
            first = next(v for v in variants if c["key"] in v.rolls)  # versions with another range: say so
            others = {f"in {v.types}: {pd2_data.value_text(v.rolls[c['key']]['lo'], v.rolls[c['key']]['hi'])}": 1
                      for v in variants if c["key"] in v.rolls and (v.rolls[c["key"]]["lo"], v.rolls[c["key"]]["hi"])
                      != (first.rolls[c["key"]]["lo"], first.rolls[c["key"]]["hi"])}
            c["line"] = first.rolls[c["key"]]["line"] + (f" ({'; '.join(others)})" if others else "")
        order = sorted(self.cands.values(), key=lambda c: tuple(-x for x in code_rank(c["code"])))
        self.cands = {c["key"]: c for c in order}

    def room_of(self, v):
        """The room of one version: its longest elite base (or longest of any tier), ethereal."""
        names = sorted(((TIERS[tier], -len(base)) for _, base, tier in v.bases))
        return self.room_base - len(BASE_TAG) - (-names[0][1] if names else 0)

    def fit(self, picks):
        """(uses, room) of the version that fits worst: the picked tags it has against its own room (Loyalty's
        bow shows strafe, its spear power strike)."""
        worst = None
        for v in self.variants:
            uses = sum(self.cands[k]["w"] for k in picks if k in self.cands and k in v.rolls and self.cands[k]["tagged"])
            if worst is None or uses - self.room_of(v) > worst[0] - worst[1]:
                worst = (uses, self.room_of(v))
        return worst or (0, self.room)

    def stat_lines(self):
        """The runeword's text for the picker in the game's order: its properties (a roll once, with switch),
        then its runes' stats (several versions or kinds of base: each line once)."""
        entries = [(code_rank(c["code"]), c["line"]) for c in self.cands.values()]
        having = {}  # fixed property text -> the variants that have it
        for v in self.variants:
            for prop, text in zip(v.props, v.texts):
                if not (prop and prop[0][1] != prop[0][2] and prop[0][0] not in COMPANIONS):
                    having.setdefault((text, code_rank(prop[0][0]) if prop else (-1, -1)), []).append(v)
        for (text, rank), vs in having.items():  # a line only some versions have: say which
            types = " · ".join(dict.fromkeys(v.types for v in vs))
            entries.append((rank, text if len(vs) == len(self.variants) else f"{text} (in {types})"))
        lines = []
        for _, text in sorted(entries, key=lambda e: tuple(-x for x in e[0])):
            if text not in lines:
                lines.append(text)
        kinds = len({v.base for v in self.variants}) > 1
        for v in self.variants:
            for text in v.rune_texts:
                line = f"{text} (in {v.base})" if kinds else text
                if line not in lines:
                    lines.append(line)
        return lines


def top_value(c):
    """The highest roll as the tag shows it (a per-level stat: per level, 0.75)."""
    if c["code"] in PER_LEVEL:
        return pd2_data.bh_number(c["hi"] / PER_LEVEL[c["code"]][1])
    return abs(c["hi"]) if c["hi"] < 0 else c["hi"]


def range_text(c):
    lo, hi = c["lo"], c["hi"]
    if c["code"] in PER_LEVEL:
        lo, hi = (pd2_data.bh_number(x / PER_LEVEL[c["code"]][1]) for x in (lo, hi))
    return f"{lo}-{hi}" if lo != hi else f"{hi}"


def tag_width(c):
    """Characters the tag takes at its highest roll, with the space after it."""
    if c["look"]:
        return len(shown(c["look"][0]["parts"], top_value(c))) + 1
    return len(str(top_value(c))) + U.NEW_LABEL + 1


def load():
    variants = [Variant(row) for row in pd2_data.load_runewords()]
    by_name = {}
    for v in variants:
        by_name.setdefault(v.name, []).append(v)
    build_fingerprints(variants)
    return sorted((Runeword(name, vs) for name, vs in by_name.items()), key=lambda r: r.name)


def weight(code):
    return 1 if re.match(r"(SK|OS|CLSK|TABSK|MULTI)", code) else 2


def build_fingerprints(variants):
    """Each variant's fewest stats that rule out every other runeword with as many sockets in a shared slot.
    Versions of one runeword need not be told apart: they share their picks."""
    for v in variants:
        rivals = [r for r in variants if r.name != v.name and r.sockets == v.sockets and set(r.slots) & set(v.slots)]
        options = [(code, lo) for code, (lo, hi) in v.stats.items() if lo >= 1]
        options += [(code, hi) for code, (lo, hi) in v.stats.items() if hi <= -1]
        options = [(code, lim) for code, lim in options  # (per-level stats: how BH stores the shifted ones is unproven)
                   if code not in UNRELIABLE and code not in PER_LEVEL and not v.can_add(code)]

        def rules_out(code, lim, r):
            if r.can_add(code):
                return False
            lo, hi = r.stats.get(code, (0, 0))
            return hi < lim if lim > 0 else lo > lim

        need, conds = set(range(len(rivals))), []
        while need:
            best = None
            for code, lim in options:
                if (code, lim) in conds:
                    continue
                gone = {i for i in need if rules_out(code, lim, rivals[i])}
                if gone:
                    score = (weight(code), -len(gone), code)
                    if best is None or score < best[0]:
                        best = (score, code, lim, gone)
            if best is None:
                break
            conds.append((best[1], best[2]))
            need -= best[3]
        v.fingerprint = sorted(conds, key=lambda c: (weight(c[0]), c[0]))
        v.unresolved = sorted({rivals[i].name for i in need})


def fingerprint_text(v):
    conds = " ".join(f"{c}<{lim + 1}" if lim < 0 else f"{c}>{lim - 1}" for c, lim in v.fingerprint)
    return f"(SOCK={v.sockets} {v.slot_text()}{' ' + conds if conds else ''})"


def priority(key):
    return next((i for i, p in enumerate(PRIORITY) if re.fullmatch(p, key)), len(PRIORITY))


def default_picks(rw):
    """Every roll with a look, most important first while they fit the room. All three -% enemy resistances: their
    grouped tag instead of three (as on Kira's Guardian)."""
    group = next((k for k, c in rw.cands.items() if k.startswith("eres_") and c["tagged"]), None)
    skip = set(U.ERES_KEYS.values()) if group else {k for k in rw.cands if k.startswith("eres_")}
    picks, used = [], 0
    for c in sorted(rw.cands.values(), key=lambda c: priority(c["key"])):
        if c["tagged"] and c["key"] not in skip and (used + c["w"] <= rw.room or not picks):
            picks.append(c["key"])
            used += c["w"]
    return [k for k in rw.cands if k in picks]


# ---------------------------------------------------------------- picks file

def read_picks():
    return U.read_picks_text(PICKS.read_text(encoding="utf-8")) if PICKS.exists() else {}


def render_picks(rws, old):
    out = ["# Runeword variable-roll tags: the rolls each runeword shows (tools/gen_runeword_rolls.py).",
           "# 'RW Name: tag, tag' - the filter shows the tags on a line under the name, in the game's order. Lines",
           "# whose comment starts with 'auto' are the generator's defaults and are rewritten on every run: delete",
           "# 'auto' to keep your change. Everything after '#' is rewritten on every run.",
           "# room = characters left for roll tags: 56 minus the name, the base line (its longest elite base, as",
           "# 'Sup Eth <base>') and two line breaks; runewords have no corruption tags. uses = what the picked tags",
           "# take at their highest roll, runes included. Each candidate shows its range and (width), e.g.",
           "# 'edam 245-285 (7)' = '285ed '; a per-level roll shows per level ('str/lvl 0.5-0.75'). A '*' marks a roll",
           "# with no look in the filter yet: picking it requests one (its width is an estimate).", ""]
    for rw in rws:
        if not rw.cands:
            continue
        auto, mine = default_picks(rw), old.get(rw.key)
        picks = mine[0] if mine and not mine[1] else auto
        cands = " ".join(f"{c['key']}{'' if c['tagged'] else '*'} {range_text(c)} ({c['w']})"
                         for c in rw.cands.values())
        used, room = rw.fit(picks)
        waiting = [k for k in picks if k in rw.cands and not rw.cands[k]["tagged"]]
        wait_w = sum(rw.cands[k]["w"] for k in waiting)
        info = f"room {room}, uses {used}"
        if waiting:
            info += f" + ~{wait_w} waiting for a tag line ({', '.join(waiting)})"
        if used + wait_w > room:
            info += " - TOO LONG"
        unknown = [k for k in picks if k not in rw.cands]
        if unknown:
            info += f" - not a roll of this runeword: {', '.join(unknown)}"
        if mine and not mine[1]:
            out.append(f"{rw.key}: {', '.join(picks)}    # {info} | {cands}")
        else:
            flag = " CHOOSE" if sum(c["tagged"] for c in rw.cands.values()) > len(auto) else ""
            out.append(f"{rw.key}: {', '.join(picks)}    # auto{flag} | {info} | {cands}")
    return "\n".join(out) + "\n"


def chosen(rw, picks):
    got = picks.get(rw.key)
    return got[0] if got and not got[1] else default_picks(rw)


# ---------------------------------------------------------------- section

def blocks(rws, picks):
    """{(key, label): [variants of runewords that show it]} for every picked roll with a look, in the 305 line
    order (label: a runeword's own shorter label, None for the usual one)."""
    out = {}
    for rw in rws:
        for key in chosen(rw, picks):
            c = rw.cands.get(key)
            if c and c["tagged"]:
                found = [v for v in rw.variants if key in v.rolls and not v.unresolved]
                out.setdefault((key, c["label"]), []).extend(found)
    order = sorted(out, key=lambda kl: (line_order(rws, kl[0])[:2], kl[1] or ""))
    return {kl: out[kl] for kl in order if out[kl]}


def line_order(rws, key):
    """(block, place in it) of a tag's 305 lines: the 300 stat block its look belongs to (the stat shown lowest
    on the item first), then the skill or aura number."""
    c = next(rw.cands[key] for rw in rws if key in rw.cands)
    chunks = tag_order.tag_stats(raw(c["look"][0]["parts"]), "") if c["look"] else None
    return (tag_order.block_key(chunks) if chunks else code_rank(c["code"]) + (0,)), param(c["code"]), chunks


def param(code):
    """Same stat, other skill/aura: the higher skill further left (Call to Arms: BC, BO, BCry)."""
    m = re.search(r"(\d+)(?:,(\d+))?$", code)
    return int(m.group(2) or m.group(1)) if m else 0


def render_section(rws, picks):
    lines = ["// ==============================  Runeword Variable Roll Tags  ==============================",
             "// GENERATED by tools/gen_runeword_rolls.py - do not edit. Change tools/runeword_roll_picks.txt and run it",
             "// (or pick in the page pick_runewords.bat opens). Each alias: the runewords that show this tag, each as",
             "// (sockets, slot, and stats that only that runeword has among those that fit the same bases). The tags",
             "// look like the same stat's tag in 300-affix-tags and sit in the game's stat order, like its blocks.",
             ""]
    shown_keys = blocks(rws, picks)
    for (key, label), variants in shown_keys.items():
        names = sorted({v.name for v in variants})
        fingerprints = dict.fromkeys(fingerprint_text(v) for v in variants)  # versions can share one
        lines.append(f"// {key}{f' (label {label})' if label else ''}: {', '.join(names)}")
        lines.append(f"Alias[{rw_alias(key, label)}]:(RW ({' OR '.join(fingerprints)}))")
        lines.append("")
    lines += ["// Put the roll tags on their own line, under the runeword's name",
              "ItemDisplay[RW]:%CL%%NAME%{%NAME%}%CONTINUE%"]
    last_title = None
    for (key, label), variants in shown_keys.items():
        c = next(rw.cands[key] for rw in rws if key in rw.cands)
        block, _, chunks = line_order(rws, key)
        title = tag_order.block_title(block, chunks) if chunks else f"// ---- {key} ----"
        if title != last_title:
            lines += ["", title, ""]
            last_title = title
        looks = {}  # slot -> look
        for v in variants:
            for s in v.slots:
                found = look(key, c["code"], s)[0]
                looks.setdefault(s, relabeled(found, label) if label else found)
        groups = {}  # slots that get the same look share its lines
        for s in sorted(looks, key=SLOT_ORDER.index):
            groups.setdefault(signature(looks[s]), (looks[s], []))[1].append(s)
        lo = min(rw.cands[key]["lo"] for rw in rws if key in rw.cands)
        hi = max(rw.cands[key]["hi"] for rw in rws if key in rw.cands)
        for lk, slots in groups.values():
            where = "" if len(groups) == 1 else (slots[0] if len(slots) == 1 else "(" + " OR ".join(slots) + ")") + " "
            for var in lk:
                if any(op == "=" and not lo <= n <= hi for op, n in var["cmps"]):
                    continue  # a line for one value that no runeword has
                guard = [f"{c['code']}{op}{n}" for op, n in var["cmps"]]
                if not guard:  # the stat must be there (a version of the runeword may lack the roll)
                    code = ERES_STAT[key[5]] if key.startswith("eres_") else c["code"]
                    guard = [f"{code}<0" if c["hi"] < 0 else f"{code}>0"]
                line = (f"ItemDisplay[{where}{rw_alias(key, label)} {' '.join(guard)}]:{raw(var['parts'])}%CS%%NAME%"
                        "{%NAME%}%CONTINUE%")
                if line not in lines:
                    lines.append(line)
    return "\r\n".join(lines)


ERES_STAT = {"c": "STAT335", "f": "STAT333", "l": "STAT334"}  # the grouped -res tag's first stat (its guard)


# ---------------------------------------------------------------- picker, requests, report

def write_picker(rws, old):
    """tools/runeword_picker.html: the picks as a clickable page (the roll picker's template)."""
    tagged = {c["key"] for rw in rws for c in rw.cands.values() if c["tagged"]}
    rank = {key: i for i, key in enumerate(sorted(tagged, key=lambda k: line_order(rws, k)[:2]))}
    data = []
    for rw in rws:
        if not rw.cands:
            continue
        auto, mine = default_picks(rw), old.get(rw.key)
        reviewed = bool(mine and not mine[1])
        cands = []
        for idx, c in enumerate(rw.cands.values()):
            fmt = c["look"] or [{"parts": [["WHITE", "{v}"], ["GRAY", "?"]], "cmps": []}]
            fmt = [{**f, "parts": [[col, re.sub(r"\{f:[^}]+\}", "{v}", t)] for col, t in f["parts"]]} for f in fmt]
            n = rank.get(c["key"], -1) if c["tagged"] else -1
            cands.append({"k": c["key"], "lo": c["lo"], "hi": c["hi"], "w": c["w"], "vals": {},
                          "v": top_value(c), "tagged": c["tagged"], "line": c["line"],
                          "idx": idx, "fmt": [{**f, "n": n} for f in fmt], "approx": not c["tagged"]})
        first = rw.variants[0]
        data.append({
            "key": rw.key, "kind": "RW", "name": rw.name, "shown": rw.name, "page": f"{first.sockets} sockets",
            "slot": first.slots[0] if first.slots else "", "bases": [v.types for v in rw.variants],
            "codes": first.runes.split(), "sub": f"{' · '.join(v.types for v in rw.variants)} ({first.runes})",
            "room": rw.room, "roomBase": rw.room_base, "sockets": False, "nameColor": NAME_COLOR,
            "baseChoices": [[name, tier, kind, list(v.rolls)] for name, (tier, kind, v) in rw.base_choices],
            "cands": cands, "auto": auto, "picks": mine[0] if reviewed else auto, "reviewed": reviewed,
            "untaggable": [], "stats": rw.stat_lines()})
    header = render_picks([], {}).rstrip("\n").split("\n")
    payload = {"generated": datetime.date.today().isoformat(), "header": header, "items": data,
               "title": "Runeword roll picks", "kinds": [["", "Runewords"]], "picksFile": PICKS.name,
               "generator": Path(__file__).name, "store": "erazure-runeword-picker-edits",
               "roomHelp": "characters left for roll tags after the runeword's name, its base line (the base picked "
                           "in the card, with the Eth tag if Ethereal is ticked above) and two line breaks (runewords "
                           "get no corruption tags); the preview shows the tags the picked base's version has"}
    blob = json.dumps(payload, ensure_ascii=False).replace("</", "<\\/")
    html = U.PICKER_TEMPLATE.read_text(encoding="utf-8").replace("/*__DATA__*/null", blob)
    font = U.picker_font()
    if font:
        html = html.replace('/*__FONT__*/local("AvQest")', f"url(data:font/ttf;base64,{font})")
    PICKER.write_text(html, encoding="utf-8", newline="\n")


def requests(rws, picks):
    """{roll key: [(runeword, candidate)]}: the author's picks of rolls that have no look yet."""
    out = {}
    for rw in rws:
        got = picks.get(rw.key)
        for key in got[0] if got and not got[1] else []:
            c = rw.cands.get(key)
            if c and not c["tagged"]:
                out.setdefault(key, []).append((rw, c))
    return out


def print_requests(rws, picks):
    asked = requests(rws, picks)
    print(f"{len(asked)} roll(s) picked that have no look in the filter yet:" if asked else "no picks wait for a look")
    for key, hits in sorted(asked.items(), key=lambda kv: -len(kv[1])):
        print(f"  {key} ({hits[0][1]['code']}): e.g. '{hits[0][1]['line']}'")
        for rw, c in hits:
            print(f"      {rw.key} ({', '.join(c['slots'])}) {c['lo']}-{c['hi']}")
    waiting = sorted({c["key"] for rw in rws for c in rw.cands.values() if not c["tagged"]})
    print(f"\nrolls with no look yet (a '*' in the picks file): {', '.join(waiting) or 'none'}")


def report(rws, name):
    for rw in rws:
        if name.lower() not in rw.name.lower():
            continue
        print(f"{rw.key}: room {rw.room} (its tightest version's longest elite base, '{BASE_TAG}<base>'), "
              f"default {default_picks(rw)}")
        for c in rw.cands.values():
            how = c["source"] or "NO LOOK YET"
            print(f"    {c['key']:14} {c['code']:14} {range_text(c)} ({c['w']})  {how}  | {c['line']}")
        for v in rw.variants:
            print(f"    {v.base} {v.slot_text()} ({v.types}), {v.sockets} sockets: {fingerprint_text(v)}"
                  + (f"  UNRESOLVED vs {', '.join(v.unresolved)}" if v.unresolved else ""))


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Generate the runeword variable-roll tags.")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--report", nargs="?", const="", metavar="NAME")
    ap.add_argument("--picker", action="store_true", help=f"write {PICKER.relative_to(ROOT)} and open it")
    ap.add_argument("--requests", action="store_true", help="list picked rolls that still need a look")
    args = ap.parse_args()
    rws = load()
    if not rws:
        sys.exit("no runewords: run python tools/pd2_data.py --extract \"<Diablo II folder>\" first")
    if args.requests:
        print_requests(rws, read_picks())
        return
    if args.picker:
        write_picker(rws, read_picks())
        print(f"wrote {PICKER.relative_to(ROOT)}; opening it")
        os.startfile(PICKER) if hasattr(os, "startfile") else __import__("webbrowser").open(PICKER.as_uri())
        return
    if args.report is not None:
        report(rws, args.report)
        return
    old = read_picks()
    picks_text = render_picks(rws, old)
    section = render_section(rws, U.read_picks_text(picks_text)).encode("utf-8") + b"\r\n"
    stale = []
    if not PICKS.exists() or PICKS.read_text(encoding="utf-8") != picks_text:
        stale.append(str(PICKS.relative_to(ROOT)))
    if not OUT.exists() or OUT.read_bytes() != section:
        stale.append(str(OUT.relative_to(ROOT)))
    if args.check:
        if stale:
            sys.exit("out of date (run: python tools/gen_runeword_rolls.py): " + ", ".join(stale))
        print("runeword roll tags up to date")
        return
    PICKS.write_text(picks_text, encoding="utf-8", newline="\n")
    OUT.write_bytes(section)
    with_rolls = [rw for rw in rws if rw.cands]
    unresolved = [(rw, v) for rw in rws for v in rw.variants if v.unresolved]
    print(f"{len(rws)} runewords, {len(with_rolls)} with variable rolls; "
          f"{sum(not c['tagged'] for rw in rws for c in rw.cands.values())} roll(s) with no look yet")
    for rw, v in unresolved:
        print(f"  cannot tell {rw.key} ({v.base}) apart from: {', '.join(v.unresolved)}")
    asked = requests(rws, U.read_picks_text(picks_text))
    if asked:
        print(f"{len(asked)} picked roll(s) wait for a look: {', '.join(asked)} (--requests lists them)")
    print("updated: " + (", ".join(stale) if stale else "nothing"))


if __name__ == "__main__":
    main()
