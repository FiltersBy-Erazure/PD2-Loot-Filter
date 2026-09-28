#!/usr/bin/env python3
"""
Generate every filter variant from the single source file (Erazure-Main.filter).

The 8 published filters are identical except for which 3-line alias block in the
"Toggles" section is active (BIG_GG / POE_SOUNDS / REVEALED). This script:
  1. reads Erazure-Main.filter (the only file you edit by hand),
  2. for each entry in filter_definitions.json, comments out every toggle block
     except the one whose header matches that entry's display_name,
  3. writes the result byte-for-byte (UTF-8, CRLF line endings preserved).

Usage (from the repo root):
    python tools/build_variants.py          # regenerate all variant files
    python tools/build_variants.py --check  # exit 1 if any variant is out of sync (for CI)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "Erazure-Main.filter"
DEFS = ROOT / "filter_definitions.json"

HEADER_RE = re.compile(rb"^//\s+(Erazure - .+?)\s*$")
ALIAS_RE = re.compile(rb"^(//)?(Alias\[(?:BIG_GG|POE_SOUNDS|REVEALED)\]:(?:TRUE|FALSE))\s*$")


def find_toggle_blocks(lines):
    """Return {display_name: [line indexes of its Alias lines]} from the Toggles section."""
    blocks, current = {}, None
    for i, line in enumerate(lines):
        h = HEADER_RE.match(line)
        if h:
            current = h.group(1).decode("utf-8")
            blocks[current] = []
            continue
        if current is not None and ALIAS_RE.match(line):
            blocks[current].append(i)
        elif current is not None and line.strip() and not ALIAS_RE.match(line):
            if blocks[current]:
                current = None  # block ended
    return {k: v for k, v in blocks.items() if len(v) == 3}


def render(lines, blocks, active):
    out = list(lines)
    for name, idxs in blocks.items():
        for i in idxs:
            body = ALIAS_RE.match(lines[i]).group(2)
            out[i] = body if name == active else b"//" + body
    return out


def main():
    check = "--check" in sys.argv
    raw = SOURCE.read_bytes()
    lines = raw.split(b"\r\n")
    blocks = find_toggle_blocks(lines)
    defs = json.loads(DEFS.read_text(encoding="utf-8"))["filter_info"]

    # Sanity: the source must have exactly the Main block active.
    active_now = [n for n, idxs in blocks.items() if all(not lines[i].startswith(b"//") for i in idxs)]
    if active_now != ["Erazure - Main"]:
        sys.exit(f"Source should have only 'Erazure - Main' active in Toggles; found {active_now}")

    stale = []
    for entry in defs.values():
        name, fname = entry["display_name"], entry["file_name"]
        if name not in blocks:
            sys.exit(f"No toggle block titled '//  {name}' found in {SOURCE.name}")
        data = b"\r\n".join(render(lines, blocks, name))
        target = ROOT / fname
        if target.exists() and target.read_bytes() == data:
            continue
        stale.append(fname)
        if not check:
            target.write_bytes(data)

    if check:
        if stale:
            print("Out of sync with Erazure-Main.filter:", *stale, sep="\n  ")
            sys.exit(1)
        print(f"All {len(defs)} filters in sync.")
    else:
        print(f"Regenerated: {', '.join(stale) if stale else 'nothing (already in sync)'}")


if __name__ == "__main__":
    main()
