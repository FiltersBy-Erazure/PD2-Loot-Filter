#!/usr/bin/env python3
"""
Corrupted items show their highlights without the stars (the author, 2026-10-30).

BH gives an item's description what is left of 1,023 characters after the item's own text (BH Item.cpp,
BHOnProperties: the label, the affix lines with BH's stat ranges and red corruption stars, the requirement lines,
Item / Affix Level). A corrupted item's text is longer, and on a corrupted, socketed rare claw with the stat ranges
shown 69 were left: its two skill highlights, 36 characters each besides their text, did not fit
("*******   +5 Lightning Sentry   *******" and a "****..." line above it). Without the stars they need 42.

BH can't change a rule's text by a condition, so every highlight rule with stars on either side (%HIGHLIGHT_1_LEFT%
... %HIGHLIGHT_1_RIGHT%, HIGHLIGHT_2, AMPLIFY, LOWER_RES) in SECTIONS is a pair:
    ItemDisplay[<condition> !STAT360>0]:%NAME%{%HIGHLIGHT_1_LEFT%   %GREEN%+6 Wake of Fire   %HIGHLIGHT_1_RIGHT%...
    ItemDisplay[<condition> STAT360>0]:%NAME%{%GREEN%+6 Wake of Fire...
the rule with the stars (its condition ends with !STAT360>0) and right under it its plain twin: the same condition
ending with STAT360>0, the same text without the stars and the spaces around it, in the color the text had (a text
with no color of its own takes the last color of the stars before it). The conditions end with the corruption test:
BH reads AND and OR left to right, so a test at the end holds for the whole condition (one with an OR outside
brackets is put in brackets first, as lint wants).

Edit only the star rule: this tool writes its twin (the hook and build.bat run it, CI runs --check). A rule in
SECTIONS whose condition ends with " STAT360>0" is a twin: one that no longer follows its star rule is removed.
A star rule for items that are never corrupted has no twin and no test: a shop item (SHOP), an uncorrupted one
(STAT360=0), each a term of the condition's top level (not inside brackets). A commented-out star rule
(//ItemDisplay[...) gets a commented-out twin.

Usage (from the repo root):
    python tools/plain_highlights.py            add the corruption tests and write the twins (only files that change)
    python tools/plain_highlights.py --check    list what is missing or stale; exit 1 if anything is
"""
import argparse
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
SECTIONS = ["280-skills-shop-highlights.filter", "320-highlights-ed-amp-lr.filter"]
ALIASES = ROOT / "sections" / "040-aliases.filter"
BLOCK_RE = re.compile(r"%(HIGHLIGHT_\d|AMPLIFY|LOWER_RES)_LEFT%( *)(.*?)( *)%\1_RIGHT%")
STAR_TEST, PLAIN_TEST = " !STAT360>0", " STAT360>0"
NEVER_CORRUPTED = {"SHOP", "STAT360=0"}
CORRUPTED_ONLY_RE = re.compile(r"STAT360(>0|=[1-9]\d*|>[1-9]\d*)")

sys.path.insert(0, str(TOOLS))
from lint_filter import BH_COLORS  # noqa: E402

COLOR_RE = re.compile(r"%(" + "|".join(sorted(BH_COLORS, key=len, reverse=True)) + r")%")


def last_colors():
    """{alias family: the last color of its _LEFT alias} (040-aliases): a text without a color of its own has it."""
    out = {}
    for line in ALIASES.read_text(encoding="utf-8").splitlines():
        m = re.match(r"Alias\[(\w+)_LEFT\]:(.*)", line)
        if m:
            colors = COLOR_RE.findall(m.group(2))
            if colors:
                out[m.group(1)] = colors[-1]
    return out


def split(line):
    """(comment prefix '' or '//', condition, output) of a rule line, or None."""
    prefix = "//" if line.startswith("//ItemDisplay[") else ""
    body = line[len(prefix):]
    if not body.startswith("ItemDisplay["):
        return None
    close = body.find("]:")
    if close < 0:
        return None
    return prefix, body[len("ItemDisplay["):close], body[close + 2:]


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


def star_block(output):
    """The stars block of a rule's description, or None."""
    brace = output.find("{")
    return BLOCK_RE.search(output, brace) if brace >= 0 else None


def is_twin(cond):
    return cond.endswith(PLAIN_TEST) and not cond.endswith(STAR_TEST)


def pair(line, colors):
    """(star line, twin line) a star rule should be, None for a line that is not a star rule or needs no twin."""
    parts = split(line)
    if not parts:
        return None
    prefix, cond, output = parts
    m = star_block(output)
    if not m:
        return None
    base = cond[:-len(STAR_TEST)] if cond.endswith(STAR_TEST) else cond
    terms = top_terms(base)
    if "OR" in terms:
        base = f"({base})"  # BH reads it the same; lint wants AND after an OR in brackets
    else:
        if NEVER_CORRUPTED & set(terms):
            return None
        if any(CORRUPTED_ONLY_RE.fullmatch(t) for t in terms):
            raise ValueError("a highlight with stars only for corrupted items: write it without the stars")
    text = m.group(3)
    if not COLOR_RE.match(text):
        text = f"%{colors[m.group(1)]}%" + text
    plain = output[:m.start()] + text + output[m.end():]
    return (f"{prefix}ItemDisplay[{base}{STAR_TEST}]:{output}",
            f"{prefix}ItemDisplay[{base}{PLAIN_TEST}]:{plain}")


def fixed(lines, colors, name):
    """The section's lines with every star rule followed by its twin, and what changed (messages)."""
    out, notes, i = [], [], 0
    while i < len(lines):
        line = lines[i]
        parts = split(line)
        if parts and is_twin(parts[1]) and not star_block(parts[2]):  # a twin that follows no star rule (each
            # pair's twin is taken below)
            notes.append(f"{name}:{i + 1}: twin with no star rule above it, removed")
            i += 1
            continue
        try:
            want = pair(line, colors)
        except ValueError as e:
            raise SystemExit(f"{name}:{i + 1}: {e}")
        if not want:
            out.append(line)
            i += 1
            continue
        star, twin = want
        if star != line:
            notes.append(f"{name}:{i + 1}: star rule without its corruption test")
        out += [star, twin]
        nxt = split(lines[i + 1]) if i + 1 < len(lines) else None
        if nxt and is_twin(nxt[1]):
            if lines[i + 1] != twin:
                notes.append(f"{name}:{i + 2}: twin out of date")
            i += 2
        else:
            notes.append(f"{name}:{i + 1}: star rule without its twin")
            i += 1
    return out, notes


def run(check):
    colors = last_colors()
    found = []
    for name in SECTIONS:
        path = ROOT / "sections" / name
        raw = path.read_bytes().decode("utf-8")
        lines = raw.split("\r\n")
        new, notes = fixed(lines, colors, f"sections/{name}")
        found += notes
        if notes and not check:
            path.write_bytes("\r\n".join(new).encode("utf-8"))
            print(f"plain_highlights: {len(notes)} change(s) in sections/{name}")
    return found


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Write the plain twins of the star highlights (corrupted items).")
    ap.add_argument("--check", action="store_true", help="change nothing; exit 1 if a twin is missing or stale")
    args = ap.parse_args()
    found = run(args.check)
    if args.check:
        for note in found:
            print(note)
        print(f"{len(found)} finding(s): run python tools/plain_highlights.py" if found
              else "every star highlight has its plain twin")
        sys.exit(1 if found else 0)


if __name__ == "__main__":
    main()
