#!/usr/bin/env python3
"""
Small non-magical items that sell for gold show as their sell tag alone where a hide rule would hide them (the author,
2026-11-09: a Poignard with +1 Blade Shield and the ($) tag was hidden on filter level 1 at character level 48).

On filter levels 1-4 a non-magical item of 2 inventory squares or less (daggers, wands and most orbs; uncorrupted) that
315-sell-value-tags would tag (the same difficulty, character level and price cuts) shows, where a hide rule of 210 /
220 / 310 would hide it, as that tag alone in its tier's look: a gold ($), a gray ($) (10,000-19,999 gold below
character level 60), or in Normal below character level 30 its $Nk. 040's SMALL_SELL_GOLD / _GRAY / _NK are the tiers
(SMALL_SELL_BASE the three together), 315's SELL_ONLY_GOLD / _GRAY / _NK their looks (Corrlorized restyles them as
Corr's $$$).

BH can't change a rule's text by a condition, so every such hide rule takes its twins right above it, one per tier:
    ItemDisplay[<condition> SMALL_SELL_GOLD <rest>]:%SELL_ONLY_GOLD%//
    ItemDisplay[<condition> SMALL_SELL_GRAY <rest>]:%SELL_ONLY_GRAY%//
    ItemDisplay[<condition> SMALL_SELL_NK <rest>]:%SELL_ONLY_NK%//
    ItemDisplay[<condition> !SMALL_SELL_BASE <rest>]://
the hide rule's own condition with its !SMALL_SELL_BASE term (outside brackets) as the tier. A tier the hide rule's
character level rules out is left out (CLVL>39: no $Nk; CLVL>79: gold only), read from the condition's terms outside
brackets and inside brackets without an OR.

Edit only the hide rule: this tool writes its twins (the hook and build.bat run it, CI runs --check). A new hide rule
that could hide such an item on filter levels 1-4 needs !SMALL_SELL_BASE before its GROUND. A twin whose hide rule is
gone, or no longer right above it, is removed.

Usage (from the repo root):
    python tools/sell_label_twins.py            write the twins (only files that change)
    python tools/sell_label_twins.py --check    list what is missing or stale; exit 1 if anything is
"""
import argparse
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent.parent
SECTIONS = ROOT / "sections"
MARK = "!SMALL_SELL_BASE"
TIERS = [  # (tier alias, look alias, the highest character level it can hold at)
    ("SMALL_SELL_GOLD", "SELL_ONLY_GOLD", 99),
    ("SMALL_SELL_GRAY", "SELL_ONLY_GRAY", 59),
    ("SMALL_SELL_NK", "SELL_ONLY_NK", 29),
]
TIER_NAMES = {t for t, _, _ in TIERS}
CLVL_RE = re.compile(r"CLVL(>|<|=|~)(\d+)(?:-(\d+))?")


def split(line):
    """(condition, output) of a rule line (not a switched-off one), or None."""
    if not line.startswith("ItemDisplay["):
        return None
    close = line.find("]:")
    if close < 0:
        return None
    return line[len("ItemDisplay["):close], line[close + 2:]


def top_terms(cond):
    """The condition's terms outside brackets."""
    terms, depth, word = [], 0, ""
    for ch in cond:
        depth += (ch == "(") - (ch == ")")
        if ch == " " and depth == 0:
            if word:
                terms.append(word)
            word = ""
        else:
            word += ch
    if word:
        terms.append(word)
    return terms


def and_terms(cond):
    """The terms every case of the condition has: outside brackets, and inside brackets without an OR."""
    out = []
    for term in top_terms(cond):
        if term.startswith("(") and term.endswith(")"):
            inner = top_terms(term[1:-1])
            if "OR" not in inner:
                out += and_terms(term[1:-1])
                continue
        out.append(term)
    return out


def lowest_clvl(cond):
    low = 1
    for term in and_terms(cond):
        m = CLVL_RE.fullmatch(term)
        if not m:
            continue
        op, n = m.group(1), int(m.group(2))
        low = max(low, n + 1 if op == ">" else n if op in "=~" else 1)
    return low


def twins(cond, where):
    """The twin lines a hide rule with this condition takes, in order."""
    terms = top_terms(cond)
    if terms.count(MARK) != 1:
        raise SystemExit(f"{where}: {MARK} must be a term of the condition's top level (outside brackets), once")
    low = lowest_clvl(cond)
    pos = re.search(r"(?<![\w!])" + re.escape(MARK) + r"(?!\w)", cond)
    return [f"ItemDisplay[{cond[:pos.start()]}{tier}{cond[pos.end():]}]:%{look}%//"
            for tier, look, high in TIERS if low <= high]


def is_twin(cond):
    return any(t in TIER_NAMES for t in top_terms(cond))


def is_hide(output):
    return output.split("//", 1)[0].strip() == ""


def fixed(lines, name):
    """The section's lines with every marked hide rule's twins right above it, and what changed (messages)."""
    out, notes, pending = [], [], []  # pending: twin lines read since the last other line
    for i, line in enumerate(lines):
        parts = split(line)
        if parts and is_twin(parts[0]):
            pending.append((i, line))
            continue
        if parts and MARK in top_terms(parts[0]):
            if not is_hide(parts[1]):
                raise SystemExit(f"{name}:{i + 1}: {MARK} marks a hide rule (an empty output), not this one")
            want = twins(parts[0], f"{name}:{i + 1}")
            if [t for _, t in pending] != want:
                notes.append(f"{name}:{i + 1}: twins of the hide rule out of date")
            out += want
        elif pending:
            notes += [f"{name}:{j + 1}: twin with no hide rule under it, removed" for j, _ in pending]
        pending = []
        out.append(line)
    notes += [f"{name}:{j + 1}: twin with no hide rule under it, removed" for j, _ in pending]
    return out, notes


def run(check):
    found = []
    for path in sorted(SECTIONS.glob("*.filter")):
        raw = path.read_bytes().decode("utf-8")
        lines = raw.split("\r\n")
        new, notes = fixed(lines, f"sections/{path.name}")
        found += notes
        if notes and not check:
            path.write_bytes("\r\n".join(new).encode("utf-8"))
            print(f"sell_label_twins: {len(notes)} change(s) in sections/{path.name}")
    return found


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Write the sell tag twins of the hide rules marked !SMALL_SELL_BASE.")
    ap.add_argument("--check", action="store_true", help="change nothing; exit 1 if a twin is missing or stale")
    args = ap.parse_args()
    found = run(args.check)
    if args.check:
        for note in found:
            print(note)
        print(f"{len(found)} finding(s): run python tools/sell_label_twins.py" if found
              else "every hide rule marked !SMALL_SELL_BASE has its sell tag twins")
        sys.exit(1 if found else 0)


if __name__ == "__main__":
    main()
