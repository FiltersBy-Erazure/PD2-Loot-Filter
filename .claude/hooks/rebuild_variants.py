#!/usr/bin/env python3
"""
Claude Code PostToolUse hook: after Claude edits Erazure-Main.filter or
filter_definitions.json, regenerate the 7 variant filters.

Silent on success. On failure, exits 2 so the error is fed back to Claude.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
WATCHED = {"erazure-main.filter", "filter_definitions.json"}


def main():
    try:
        payload = json.load(sys.stdin)
    except ValueError:
        return 0
    tool_input = payload.get("tool_input") or {}
    path = tool_input.get("file_path") or ""
    if os.path.basename(path.replace("\\", "/")).lower() not in WATCHED:
        return 0

    result = subprocess.run(
        [sys.executable, str(ROOT / "tools" / "build_variants.py")],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        msg = (result.stderr or result.stdout).strip()
        print(f"Variant rebuild FAILED after editing {os.path.basename(path)}:\n{msg}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
