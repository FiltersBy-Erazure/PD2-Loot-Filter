#!/usr/bin/env python3
"""
Build the 8 Erazure filters from the section files.

  sections/*.filter    joined in filename order, <<VERSION>> filled in    ->  Erazure-Main.filter
  Erazure-Main.filter  with one toggle block switched on per variant      ->  the 7 other filters

Usage (from the repo root; or double-click build.bat to stamp, build and check):
    python tools/build.py           build all 8 filters
    python tools/build.py --stamp   set version.json's date to today, then build
    python tools/build.py --check   change nothing; exit 1 if any filter or section file is out of date

Section files with LF line endings, a UTF-8 BOM or no final line break are fixed in place
(only those invisible characters change) and each fix is reported on a line starting "Fixed".
"""
import argparse
import datetime
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SECTIONS = ROOT / "sections"
VERSION_FILE = ROOT / "version.json"
DEFS = ROOT / "filter_definitions.json"

MAIN = "Erazure - Main"
PLACEHOLDER = b"<<VERSION>>"
CATCH_ALL = b"ItemDisplay[]:"
BOM = b"\xef\xbb\xbf"
MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]

SECTION_NAME_RE = re.compile(r"^(\d{3})-[A-Za-z0-9_-]+\.filter$")
HEADER_RE = re.compile(rb"^//\s+(Erazure - .+?)\s*$")
ALIAS_RE = re.compile(rb"^(//)?(Alias\[(BIG_GG|POE_SOUNDS|REVEALED)\]:(?:TRUE|FALSE))\s*$")
TOGGLES = sorted([b"BIG_GG", b"POE_SOUNDS", b"REVEALED"])


def fail(msg):
    sys.exit(f"BUILD ERROR: {msg}")


# ---------------------------------------------------------------- version

def load_version():
    try:
        v = json.loads(VERSION_FILE.read_text(encoding="utf-8"))
        return v, v["season"], datetime.date.fromisoformat(v["date"])
    except (OSError, ValueError, KeyError, TypeError) as e:
        fail(f'version.json must look like {{"season": "Season 13", "date": "2026-05-28"}} ({e})')


def version_text(season, date):
    day = date.day
    suffix = "th" if 11 <= day % 100 <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(day % 10, "th")
    return f"{season} - {MONTHS[date.month - 1]} {day}{suffix}"


def stamp():
    v, _, _ = load_version()
    v["date"] = datetime.date.today().isoformat()
    VERSION_FILE.write_text(json.dumps(v, indent=2) + "\n", encoding="utf-8", newline="\n")


# ---------------------------------------------------------------- sections

def normalize(data):
    """Return (data with CRLF line endings, no BOM and a final line break, list of fixes made)."""
    fixes = []
    if data.startswith(BOM):
        data = data[len(BOM):]
        fixes.append("removed BOM")
    bare_lf = data.count(b"\n") - data.count(b"\r\n")
    if bare_lf:
        data = data.replace(b"\r\n", b"\n").replace(b"\n", b"\r\n")
        fixes.append(f"{bare_lf} LF line ending(s) -> CRLF")
    if data and not data.endswith(b"\r\n"):
        data += b"\r\n"
        fixes.append("added final line break")
    return data, fixes


def read_sections(check):
    """Return [(file name, bytes)] in build order, plus problems found (check mode) instead of fixing."""
    if not SECTIONS.is_dir():
        fail("missing folder sections/")
    files = sorted(SECTIONS.glob("*.filter"), key=lambda p: p.name)
    if not files:
        fail("no .filter files in sections/")
    numbers = {}
    for f in files:
        m = SECTION_NAME_RE.match(f.name)
        if not m:
            fail(f"sections/{f.name}: section names must look like '115-topic.filter' "
                 "(3-digit number, then letters, digits or dashes; no spaces)")
        if m.group(1) in numbers:
            fail(f"sections/{f.name} and sections/{numbers[m.group(1)]} share the number {m.group(1)}")
        numbers[m.group(1)] = f.name

    parts, problems = [], []
    for f in files:
        data, fixes = normalize(f.read_bytes())
        if fixes:
            if check:
                problems.append(f"sections/{f.name}: {', '.join(fixes)}")
            else:
                f.write_bytes(data)
                print(f"Fixed sections/{f.name}: {', '.join(fixes)}")
        parts.append((f.name, data))
    return parts, problems


def line_locator(parts):
    """Map a 0-based line index in the joined filter to 'sections/<file>:<line>'."""
    starts, n = [], 0
    for name, data in parts:
        starts.append((n, name))
        n += data.count(b"\r\n")

    def where(i):
        first, name = next((s, nm) for s, nm in reversed(starts) if s <= i)
        return f"sections/{name}:{i - first + 1}"
    return where


# ---------------------------------------------------------------- toggles / variants

def find_toggle_blocks(lines):
    """Return {variant display name: [indexes of its 3 Alias lines]} from the Toggles section."""
    blocks, current = {}, None
    for i, line in enumerate(lines):
        h = HEADER_RE.match(line)
        if h:
            current = h.group(1).decode("utf-8")
            blocks[current] = []
            continue
        if current is not None and ALIAS_RE.match(line):
            blocks[current].append(i)
        elif current is not None and line.strip() and blocks[current]:
            current = None  # block ended
    return {name: idxs for name, idxs in blocks.items()
            if sorted(ALIAS_RE.match(lines[i]).group(3) for i in idxs) == TOGGLES}


def check_toggles(lines, blocks, names, where):
    if MAIN not in blocks:
        fail(f"no complete '//  {MAIN}' toggle block (one Alias line each for BIG_GG, POE_SOUNDS, REVEALED)")
    for name in names:
        if name not in blocks:
            fail(f"filter_definitions.json lists '{name}' but the Toggles section has no complete "
                 f"'//  {name}' block (one Alias line each for BIG_GG, POE_SOUNDS, REVEALED)")
    wrong = [f"{where(i)}: {lines[i].decode('utf-8', 'replace')}"
             for name, idxs in blocks.items() for i in idxs
             if lines[i].startswith(b"//") != (name != MAIN)]
    if wrong:
        fail(f"only the '{MAIN}' toggle block may be active (uncommented); every other block must be "
             "commented out. Wrong lines:\n  " + "\n  ".join(wrong))


def render(lines, blocks, active):
    """The filter's lines with only the `active` variant's toggle block switched on."""
    out = list(lines)
    for name, idxs in blocks.items():
        for i in idxs:
            body = ALIAS_RE.match(lines[i]).group(2)
            out[i] = body if name == active else b"//" + body
    return out


def load_defs():
    try:
        entries = list(json.loads(DEFS.read_text(encoding="utf-8-sig"))["filter_info"].values())
        pairs = [(e["display_name"], e["file_name"]) for e in entries]
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as e:
        fail(f"cannot read filter_definitions.json ({e})")
    for _, fname in pairs:
        if Path(fname).name != fname or not fname.endswith(".filter"):
            fail(f"filter_definitions.json: file_name '{fname}' must be a plain .filter file name")
    return pairs


# ---------------------------------------------------------------- main

def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Build the 8 Erazure filters from sections/.")
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--stamp", action="store_true", help="set version.json's date to today, then build")
    mode.add_argument("--check", action="store_true", help="change nothing; exit 1 if anything is out of date")
    args = ap.parse_args()

    if args.stamp:
        stamp()
    _, season, date = load_version()
    version = version_text(season, date)

    parts, problems = read_sections(args.check)
    where = line_locator(parts)
    joined = b"".join(data for _, data in parts)

    count = joined.count(PLACEHOLDER)
    if count != 1:
        fail(f"'<<VERSION>>' must appear exactly once in sections/ (found {count}); "
             "it belongs in the Horadric Cube section")
    lines = joined.replace(PLACEHOLDER, version.encode("utf-8")).split(b"\r\n")

    rules = [i for i, line in enumerate(lines) if line.startswith(b"ItemDisplay[")]
    if not rules or not lines[rules[-1]].startswith(CATCH_ALL):
        fail("the last rule must be the catch-all 'ItemDisplay[]:%NAME%{%NAME%}//' "
             f"(the last rule is at {where(rules[-1]) if rules else 'nowhere'})")

    defs = load_defs()
    blocks = find_toggle_blocks(lines)
    check_toggles(lines, blocks, [name for name, _ in defs], where)

    stale = []
    for name, fname in defs:
        data = b"\r\n".join(render(lines, blocks, name))
        target = ROOT / fname
        if target.exists() and target.read_bytes() == data:
            continue
        stale.append(fname)
        if not args.check:
            target.write_bytes(data)

    if args.check:
        if problems or stale:
            if problems:
                print("Section files need fixing (run: python tools/build.py):", *problems, sep="\n  ")
            if stale:
                print("Out of date with sections/ (run: python tools/build.py):", *stale, sep="\n  ")
            sys.exit(1)
        print(f"All {len(defs)} filters in sync ({version}).")
    else:
        print(f"Built {len(defs)} filters ({version}). "
              f"Updated: {', '.join(stale) if stale else 'none, already up to date'}")


if __name__ == "__main__":
    main()
