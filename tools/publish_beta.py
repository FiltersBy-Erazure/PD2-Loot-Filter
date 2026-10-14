#!/usr/bin/env python3
"""
Publish the Season 14 beta filter on `main`, the branch the PD2 launcher serves to players.

The launcher reads this repository's default branch (`main`) through the GitHub contents API. During
the S14 beta, `main` keeps its 8 Season 13 filters untouched and gets one extra launcher entry,
"Erazure - S14 Beta": Erazure-S14-Beta.filter, a byte copy of the `beta` branch's Erazure-Main.filter.
It also gets the website: the players' pages Erazure-Unique-Set-Tiers.html, Erazure-Non-Magic-Bases.html,
Erazure-Magic-Items.html and Erazure-Rare-Items.html, the site's pages in website/ and the workflow
.github/workflows/pages.yml that builds them into GitHub Pages (byte copies of `beta`'s; website files `beta` no
longer has are removed).

Usage (from the repo root, on the `beta` branch with no uncommitted changes):
    python tools/publish_beta.py              update a worktree of `main` and show what would change
    python tools/publish_beta.py --commit     ...and commit it there (only with the author's go-ahead)
    python tools/publish_beta.py --push       ...and push `main` (implies --commit; author's go-ahead)
    python tools/publish_beta.py --site-only  publish the website alone, not the beta filter (with --commit /
                                              --push)
    python tools/publish_beta.py --remove     take the beta entry and file off `main` again (launch day; the
                                              website stays: the launch merge brings the S14 one)

It runs the build check and the linter on `beta` first, then works in the worktree
../PD2-Loot-Filter-main (created on first use), and refuses to touch anything on `main` except
Erazure-S14-Beta.filter, its entry in filter_definitions.json and the website files above.
"""
import argparse
import datetime
import json
import re
import subprocess
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402

ROOT = build.ROOT
WORKTREE = ROOT.parent / (ROOT.name + "-main")
BETA_FILE = "Erazure-S14-Beta.filter"
ENTRY = {
    "display_name": "Erazure - S14 Beta",
    "description": "Season 14 closed and open beta only. Work in progress version of Erazure - Main "
                   "with the upcoming Season 14 changes. Not for Season 13.",
    "file_name": BETA_FILE,
}
DEFS = "filter_definitions.json"
PAGE_FILES = ["Erazure-Unique-Set-Tiers.html",  # the tier page (tools/tier_map.py), part of the website
              "Erazure-Non-Magic-Bases.html",  # the bases page (tools/base_map.py), part of the website
              "Erazure-Magic-Items.html",  # the magic and rare items pages (tools/magic_rare_map.py), part of the
              "Erazure-Rare-Items.html"]  # website
WEBSITE = "website"  # the website's pages and MkDocs config
WORKFLOW = ".github/workflows/pages.yml"  # builds the website into GitHub Pages on every push to main
ALLOWED = {BETA_FILE, DEFS, WORKFLOW, *PAGE_FILES}


def allowed(path):
    return path in ALLOWED or path.startswith(WEBSITE + "/")


def sync_website():
    """Copy beta's website/, the Pages workflow and the players' pages to the main worktree; drop website files
    that beta no longer has."""
    paths = git("ls-tree", "-r", "--name-only", "beta", "--", WEBSITE, WORKFLOW).decode().splitlines()
    wanted = set(paths)
    folder = WORKTREE / WEBSITE
    for old in (folder.rglob("*") if folder.exists() else []):
        if old.is_file() and old.relative_to(WORKTREE).as_posix() not in wanted:
            old.unlink()
    for rel in paths + PAGE_FILES:
        dest = WORKTREE / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(git("show", f"beta:{rel}"))


def git(*args, cwd=ROOT, check=True):
    r = subprocess.run(["git", *args], cwd=cwd, capture_output=True)
    if check and r.returncode:
        sys.exit(f"git {' '.join(args)} failed:\n{r.stderr.decode('utf-8', 'replace')}")
    return r.stdout


def run_checks():
    branch = git("rev-parse", "--abbrev-ref", "HEAD").decode().strip()
    if branch != "beta":
        sys.exit(f"run this on the beta branch (now on '{branch}')")
    if git("status", "--porcelain", "--untracked-files=no").strip():
        sys.exit("commit or discard the changes on beta first: the published file comes from the commit")
    for cmd in (["tools/build.py", "--check"], ["tools/lint_filter.py"]):
        r = subprocess.run([sys.executable, *cmd], cwd=ROOT)
        if r.returncode:
            sys.exit(f"{' '.join(cmd)} failed on beta: fix that before publishing")


def prepare_worktree():
    if not WORKTREE.exists():
        git("worktree", "add", str(WORKTREE), "main")
    if git("rev-parse", "--abbrev-ref", "HEAD", cwd=WORKTREE).decode().strip() != "main":
        sys.exit(f"{WORKTREE} is not on main")
    if git("status", "--porcelain", cwd=WORKTREE).strip():
        sys.exit(f"{WORKTREE} has uncommitted changes from an earlier run: commit or discard them first")
    git("fetch", "origin", "main")
    behind = int(git("rev-list", "--count", "main..origin/main", cwd=WORKTREE))
    if behind:
        git("merge", "--ff-only", "origin/main", cwd=WORKTREE)


def update_definitions(remove):
    path = WORKTREE / DEFS
    text = path.read_bytes().decode("utf-8")
    data = json.loads(text)
    info = data["filter_info"]
    present = [k for k, v in info.items() if v.get("display_name") == ENTRY["display_name"]]
    if remove:
        if not present:
            return
        key = present[0]
        new = re.sub(r',\n    "%s": \{.*?\n    \}' % re.escape(key), "", text, count=1, flags=re.S)
    else:
        if present:
            if info[present[0]] != ENTRY:
                sys.exit(f"{DEFS} on main has a different '{ENTRY['display_name']}' entry; fix it by hand")
            return
        key = str(max(int(k) for k in info) + 1)
        block = ",\n".join(f'      "{k}": {json.dumps(v, ensure_ascii=False)}' for k, v in ENTRY.items())
        tail = "\n    }\n  }\n}"
        if tail not in text:
            sys.exit(f"{DEFS} on main has an unexpected layout; add the entry by hand")
        i = text.rindex(tail)
        new = text[:i] + f'\n    }},\n    "{key}": {{\n{block}' + text[i:]
    expected = {k: v for k, v in info.items() if k != key} if remove else {**info, key: ENTRY}
    if json.loads(new)["filter_info"] != expected:
        sys.exit(f"editing {DEFS} went wrong; nothing written")
    path.write_bytes(new.encode("utf-8"))


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Publish the S14 beta filter on main.")
    ap.add_argument("--commit", action="store_true", help="commit on main (author's go-ahead)")
    ap.add_argument("--push", action="store_true", help="commit and push main (author's go-ahead)")
    ap.add_argument("--remove", action="store_true", help="remove the beta entry and file from main")
    ap.add_argument("--site-only", action="store_true", help="publish only the website, not the beta filter")
    ap.add_argument("--trailer", default="", help="extra line(s) for the commit message")
    args = ap.parse_args()
    if args.remove and args.site_only:
        sys.exit("--remove and --site-only do not go together")

    run_checks()
    prepare_worktree()
    sha = git("rev-parse", "--short", "beta").decode().strip()
    if args.remove:
        (WORKTREE / BETA_FILE).unlink(missing_ok=True)
    else:
        if not args.site_only:
            (WORKTREE / BETA_FILE).write_bytes(git("show", "beta:Erazure-Main.filter"))
        sync_website()
    if not args.site_only:
        update_definitions(args.remove)

    status = git("status", "--porcelain", "--untracked-files=all", cwd=WORKTREE).decode().splitlines()
    changed = {line[3:] for line in status}
    if not changed:
        print(f"main already matches beta {sha}: nothing to publish")
        return
    refused = sorted(p for p in changed if not allowed(p))
    if refused:
        sys.exit(f"refusing: these files on main would change: {', '.join(refused)}")
    print("\n".join(status) + "\n" + git("diff", "--stat", cwd=WORKTREE).decode())

    if not (args.commit or args.push):
        print(f"Prepared in {WORKTREE}. To publish (author's go-ahead): python tools/publish_beta.py --push")
        print(f"To discard: git -C \"{WORKTREE}\" checkout -- . && git -C \"{WORKTREE}\" clean -f")
        return
    v = json.loads(git("show", "beta:version.json"))
    version = build.version_text(v["season"], datetime.date.fromisoformat(v["date"]))
    site = sorted(p for p in changed if p not in (BETA_FILE, DEFS))
    site_line = (f"- The website (GitHub Pages), copy of beta's at {sha}: {', '.join(site)}\n" if len(site) <= 4 else
                 f"- The website (GitHub Pages), copy of beta's at {sha}: {len(site)} files in {WEBSITE}/, "
                 f"{', '.join(PAGE_FILES)} and {WORKFLOW}\n") if site else ""
    if args.remove:
        message = "Remove the S14 beta filter from the launcher list"
    elif args.site_only:
        message = (f"S14 beta: publish the website ({version})\n\n" + site_line +
                   f"- {BETA_FILE} and the 8 Season 13 filters are unchanged")
    else:
        message = (f"S14 beta: publish Erazure - S14 Beta ({version})\n\n"
                   f"- {BETA_FILE}: copy of beta:Erazure-Main.filter at {sha}\n" + site_line +
                   f"- The 8 Season 13 filters are unchanged")
    if args.trailer:
        message += "\n\n" + args.trailer
    git("add", "--all", "--", *sorted(changed), cwd=WORKTREE)
    git("commit", "-q", "-m", message, cwd=WORKTREE)
    print(git("log", "--oneline", "-1", cwd=WORKTREE).decode().strip())
    if args.push:
        git("push", "origin", "main", cwd=WORKTREE)
        print("pushed main: the launcher serves it on the next Play")


if __name__ == "__main__":
    main()
