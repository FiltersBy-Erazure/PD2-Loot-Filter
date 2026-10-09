#!/usr/bin/env python3
"""
Claude Code PostToolUse hook: after Claude edits a file in sections/, version.json,
filter_definitions.json, tools/unique_roll_picks.txt or tools/runeword_roll_picks.txt, regenerate the
unique/set and runeword roll tags (for section and picks edits: tools/gen_unique_rolls.py and
tools/gen_runeword_rolls.py) and rebuild the 8 filters with tools/build.py (never stamps the version).

Silent on success. If the build fixed a section file's format (line endings, BOM, final line
break), that note is passed back to Claude. On failure, exits 2 so the error goes back to Claude.
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ROOT_FILES = {"version.json", "filter_definitions.json"}
PICKS = [["tools", "unique_roll_picks.txt"], ["tools", "runeword_roll_picks.txt"]]
GENERATORS = ["gen_unique_rolls.py", "gen_runeword_rolls.py"]  # in this order: both read sections/


def watched(file_path):
    try:
        rel = Path(file_path).resolve().relative_to(ROOT)
    except (ValueError, OSError):
        return False
    parts = [p.lower() for p in rel.parts]
    if len(parts) == 2 and parts[0] == "sections" and parts[1].endswith(".filter"):
        return "generate"
    if parts in PICKS:
        return "generate"
    return len(parts) == 1 and parts[0] in ROOT_FILES


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    try:
        payload = json.load(sys.stdin)
    except ValueError:
        return 0
    file_path = (payload.get("tool_input") or {}).get("file_path") or ""
    what = watched(file_path) if file_path else False
    if not what:
        return 0

    for name in GENERATORS if what == "generate" else []:
        generator = ROOT / "tools" / name
        if not generator.exists():
            continue
        gen = subprocess.run([sys.executable, str(generator)], cwd=ROOT,
                             capture_output=True, encoding="utf-8", errors="replace")
        if gen.returncode != 0:
            msg = (gen.stderr or gen.stdout).strip()
            print(f"Roll tag generation ({name}) FAILED after editing {Path(file_path).name}:\n{msg}",
                  file=sys.stderr)
            return 2

    result = subprocess.run([sys.executable, str(ROOT / "tools" / "build.py")], cwd=ROOT,
                            capture_output=True, encoding="utf-8", errors="replace")
    if result.returncode != 0:
        msg = (result.stderr or result.stdout).strip()
        print(f"Filter build FAILED after editing {Path(file_path).name}:\n{msg}", file=sys.stderr)
        return 2
    fixes = [line for line in result.stdout.splitlines() if line.startswith("Fixed ")]
    if fixes:
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": "tools/build.py fixed section file format:\n" + "\n".join(fixes),
        }}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
