#!/usr/bin/env python3
"""
Claude Code PostToolUse hook: after Claude edits a file in sections/, version.json or
filter_definitions.json, rebuild the 8 filters with tools/build.py (never stamps the version).

Silent on success. If the build fixed a section file's format (line endings, BOM, final line
break), that note is passed back to Claude. On failure, exits 2 so the error goes back to Claude.
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ROOT_FILES = {"version.json", "filter_definitions.json"}


def watched(file_path):
    try:
        rel = Path(file_path).resolve().relative_to(ROOT)
    except (ValueError, OSError):
        return False
    parts = [p.lower() for p in rel.parts]
    if len(parts) == 2 and parts[0] == "sections" and parts[1].endswith(".filter"):
        return True
    return len(parts) == 1 and parts[0] in ROOT_FILES


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    try:
        payload = json.load(sys.stdin)
    except ValueError:
        return 0
    file_path = (payload.get("tool_input") or {}).get("file_path") or ""
    if not file_path or not watched(file_path):
        return 0

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
