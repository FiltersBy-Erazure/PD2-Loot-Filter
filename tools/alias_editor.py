#!/usr/bin/env python3
"""The alias editor: the author's claude.ai page for every alias that draws something (040's symbol aliases and each
version's name on the Horadric Cube in 020). One card per alias (a _LEFT/_RIGHT pair is one card) with Erazure - Main's
text and Erazure - Minimal's (styles/minimal.filter, or Main's where Minimal has no line of its own), both editable,
their labels drawn as the game draws them, and whether Corrlorized follows Main there.

    python tools/alias_editor.py                write tools/alias_editor.html (gitignored) from
                                                tools/alias_editor_template.html with today's aliases embedded; it is
                                                published to the alias editor's URL (CLAUDE.md), whose db keeps the
                                                author's edits across republishes
    python tools/alias_editor.py --apply FILE   write the page's saved edits into the filter, then run what the hook
                                                runs after an edit of 040 (the generators and the build); FILE is
                                                {"main": {ALIAS: text}, "minimal": {ALIAS: text or null}}, the `edits`
                                                of the page's db documents aliases/main and styles/minimal
    python tools/alias_editor.py --apply FILE --dry-run    list what --apply would change and write nothing

--apply: Main's text replaces the alias's line in sections/040-aliases.filter or 020-horadric-cube.filter. Minimal's text
replaces or adds the alias's line in styles/minimal.filter (a new line goes next to its card's other line, else in a
block of its own titled as in 040, in 040's order); null, or text equal to Main's, removes the line (Minimal then
draws Main's look). Then rebuild the page (no argument), republish it to the same URL and clear the applied documents'
`edits` (ArtifactData, pinned to the versions read).
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
import gen_unique_rolls as U  # noqa: E402  (the game font, as the roll pickers embed it)
import style_map  # noqa: E402  (samples, name colors and card keys: the Minimal page's)

ROOT = build.ROOT
TEMPLATE = ROOT / "tools" / "alias_editor_template.html"
PAGE = ROOT / "tools" / "alias_editor.html"
HOOK = ROOT / ".claude" / "hooks" / "rebuild.py"
SYMBOLS_FILE, CUBE_FILE = "040-aliases.filter", "020-horadric-cube.filter"
STYLE_FILE = "minimal.filter"
CORR_BASE, CORR = "Erazure - Main - PoE", "Corrlorized - Main - PoE"  # Corrlorized's look, against what it restyles
ALIAS_RE = re.compile(r"^Alias\[([A-Z0-9_]+)\]:(.*)$")
NOTIFY_RE = re.compile(r"%(CONTINUE|(BORDER|MAP|DOT|PX)-[0-9A-Fa-f]+|SOUNDID-\d+|TIER-\d)%")
OFF_TOGGLES = ("BIG_GG", "POE_SOUNDS", "REVEALED")  # off in Main: rules only the other versions use
HIGHLIGHTS = ("HIGHLIGHT", "AMPLIFY", "LOWER_RES")
GROUPS = [  # (id, title, note, which cards: by their first alias's name), in the page's order
    ("uniques", "Unique items", "Unidentified uniques, by tier.", lambda n: n.startswith(("UNI_", "FACET"))),
    ("sets", "Set items", "Unidentified set items, by tier.", lambda n: n.startswith("SET")),
    ("rares", "Rare and magic items", "Unidentified rares, jewels, rings, charms and magic crafting bases.",
     lambda n: n.startswith(("RARE_", "MAGIC_"))),
    ("runes", "Runes", "Single runes and stacks.", lambda n: "RUNE" in n or n.endswith("BIG_GG")),
    ("pd2", "PD2 items and keys", "Shards, Puzzle items, the Cube, Vial and Mirror, keys, tokens, uber items and Craft "
     "Infusions.", lambda n: not n.endswith("VERSION_NAME") and not n.startswith(HIGHLIGHTS)),
    ("highlights", "Description highlights", "Lines in item descriptions.", lambda n: n.startswith(HIGHLIGHTS)),
    ("cube", "Horadric Cube", "Each version's name in the Horadric Cube's description.",
     lambda n: n.endswith("VERSION_NAME")),
]


def lines_of(data):
    """A section or style file's lines (its CRLF bytes); the last one is the empty string after the final break."""
    return data.decode("utf-8").split("\r\n")


def load_aliases(text):
    """[{name, main, title, file}] in BH's order of the cards: 040's symbol aliases (their text has a color code;
    titled by the first line of the comment above them, cut at a colon), then each version's name in 020."""
    out, title, in_comment = [], "", False
    for line in text[SYMBOLS_FILE]:
        if line.startswith("// ") and not in_comment:
            title = line[3:].split(":")[0].strip()
        in_comment = line.startswith("//")
        m = ALIAS_RE.match(line)
        if m and "%" in m[2] and not m[2].startswith("("):
            out.append({"name": m[1], "main": m[2], "title": title, "file": SYMBOLS_FILE})
    for line in text[CUBE_FILE]:
        m = ALIAS_RE.match(line)
        if m and m[1].endswith("VERSION_NAME"):
            out.append({"name": m[1], "main": m[2], "title": m[2], "file": CUBE_FILE})
    return out


def minimal_text():
    """{alias: Minimal's own text} from styles/minimal.filter (an alias without a line there draws Main's look)."""
    style = build.load_style(STYLE_FILE, True, [])
    return {k.decode(): ALIAS_RE.match(v.decode("utf-8"))[2] for k, v in style.items()}


def corrlorized(names):
    """{alias: 'own' (Corr's edits set its text), 'follows' (Corrlorized - Main - PoE draws it wherever Erazure - Main -
    PoE does), 'unused', or 'N of M' (rules)}."""
    base, corr = build.variant_text(CORR_BASE)[0], build.variant_text(CORR)[0]

    def defs(lines):
        return {m[1]: m[2] for line in lines if (m := ALIAS_RE.match(line))}

    def uses(lines, name):
        return sum(f"%{name}%" in line.split("//")[0] for line in lines if line.startswith("ItemDisplay["))
    bd, cd, out = defs(base), defs(corr), {}
    for name in names:
        if cd.get(name) != bd.get(name):
            out[name] = "own"
            continue
        b, c = uses(base, name), uses(corr, name)
        out[name] = "follows" if c >= b else "unused" if c == 0 else f"{c} of {b}"
    return out


def template(names, rule):
    """(the label a rule draws with this card's aliases, as a text with the aliases and %NAME% left in, 'sections/<file>:
    <line>'); a description line when the alias sits in the description; the usual look around a name when no rule
    uses the card's aliases."""
    if not rule:
        return "%" + names[0] + "%  %NAME%  " + "".join(f"%{a}%" for a in names[1:]), None
    f, n, line = rule
    out = line.split("]:", 1)[1].split("//")[0]
    body = re.search(r"\{(.*)\}", out)
    if body and f"%{names[0]}%" in body.group(1):
        out = next(p for p in re.split(r"%CL%|%NL%", body.group(1)) if f"%{names[0]}%" in p)
    else:
        out = re.sub(r"\{.*\}", "", out)
    out = NOTIFY_RE.sub("", out)
    out = out.replace("%QTY%", "12").replace("%ILVL%", "92").replace("%ED%", "512").replace("%EDAM%", "512")
    return out.rstrip(), f"sections/{f}:{n}"


def looks(names, rules, symbol_names, order, most=3):
    """[(template, where)]: the different labels of Main's rules that this card's aliases decide (a rule goes to the
    card of the last-defined alias in it: the jewels' rules to the jewels, not to Rare High Value), one item before a
    stack, at most `most`; else the first rule using them all."""
    found = []
    for f, n, line in rules:
        cond = line[len("ItemDisplay["):].split("]:", 1)[0]
        if any(t in cond.replace("(", " ").replace(")", " ").split() for t in OFF_TOGGLES):
            continue
        used = [a for a in symbol_names if f"%{a}%" in line]
        if not used or max(used, key=order.get) not in names:
            continue
        tpl, where = template(names, (f, n, line))
        same = lambda t: re.sub(r"(%[A-Z_]+%)+(?=%NAME%)", "", t)  # noqa: E731  (the name brings its own color)
        if same(tpl) not in [same(t) for t, _, _ in found]:
            found.append((tpl, where, "QTY>" in cond))
    found.sort(key=lambda look: look[2])
    if found:
        return [(t, w) for t, w, _ in found[:most]]
    others = [f"%{a}%" for a in symbol_names if a not in names]
    for want, alone in ((names, True), (names, False), (names[:1], False)):
        for f, n, line in rules:
            if all(f"%{a}%" in line for a in want) and not (alone and any(o in line for o in others)):
                return [template(names, (f, n, line))]
    return [template(names, None)]


def page_data():
    parts, _ = build.read_sections(check=True)
    text = {name: lines_of(data) for name, data in parts}
    aliases = load_aliases(text)
    names = [a["name"] for a in aliases]
    symbol_names, order = set(names), {n: i for i, n in enumerate(names)}
    rules = [(f, n + 1, line) for f in text for n, line in enumerate(text[f]) if line.startswith("ItemDisplay[")]
    minimal, corr = minimal_text(), corrlorized(names)
    missing = sorted(set(minimal) - symbol_names)
    if missing:
        sys.exit(f"styles/{STYLE_FILE} has aliases the editor doesn't: {', '.join(missing)}")
    cards, seen = [], set()
    for a in aliases:
        if a["name"] in seen:
            continue
        key = style_map.key_of(a["name"])
        group = [b for b in aliases if style_map.key_of(b["name"]) == key]
        seen.update(b["name"] for b in group)
        cards.append({
            "key": key, "title": a["title"], "group": next(g[0] for g in GROUPS if g[3](a["name"])),
            "tpls": [{"tpl": t, "rule": w} for t, w in looks([b["name"] for b in group], rules, symbol_names, order)],
            "sample": style_map.name_color(key) + style_map.SAMPLE.get(key, "Item"),
            "aliases": [{"name": b["name"], "main": b["main"], "min": minimal.get(b["name"]), "file": b["file"],
                         "uses": sum(line.count(f"%{b['name']}%") for _, _, line in rules), "corr": corr[b["name"]]}
                        for b in group],
        })
    return {"groups": [{"id": g[0], "title": g[1], "note": g[2]} for g in GROUPS], "cards": cards, "order": names,
            "generated": datetime.date.today().isoformat()}


def write_page():
    data = page_data()
    html = TEMPLATE.read_text(encoding="utf-8")
    html = html.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":"))
                        .replace("</", "<\\/"))
    font = U.picker_font()
    if font:
        html = html.replace('/*__FONT__*/local("AvQest")', f"url(data:font/ttf;base64,{font})")
    PAGE.write_text(html, encoding="utf-8", newline="\n")
    own = sum(b["min"] is not None for c in data["cards"] for b in c["aliases"])
    print(f"wrote {PAGE.relative_to(ROOT)} ({PAGE.stat().st_size // 1024} KB): {len(data['cards'])} cards, "
          f"{len(data['order'])} aliases, {own} with Minimal's own text")


# ---------------------------------------------------------------- --apply

def block_bounds(lines, i):
    """(first, one past the last) line of the block holding line i: lines between blank lines."""
    start, end = i, i
    while start > 0 and lines[start - 1].strip():
        start -= 1
    while end < len(lines) and lines[end].strip():
        end += 1
    return start, end


def apply_minimal(lines, edits, final_main, names, titles):
    """styles/minimal.filter's lines with Minimal's edits in place; [what changed]."""
    changes = []

    def find(name):
        return next((i for i, line in enumerate(lines) if (m := ALIAS_RE.match(line)) and m[1] == name), None)
    for name in names:  # in the cards' order, so a new block lands after the ones before it
        if name not in edits:
            continue
        own = edits[name] if edits[name] != final_main[name] else None
        i = find(name)
        if i is not None:
            if own is None:
                del lines[i]
                start, end = block_bounds(lines, min(i, len(lines) - 1))
                if start > 0 and not any(ALIAS_RE.match(line) for line in lines[start:end]):
                    del lines[start - 1:end]  # its block held only this alias: its title and the blank line go too
                changes.append(f"styles/{STYLE_FILE}: Alias[{name}] removed (Minimal draws Main's look)")
            elif ALIAS_RE.match(lines[i])[2] != own:
                changes.append(f"styles/{STYLE_FILE}: Alias[{name}]: {ALIAS_RE.match(lines[i])[2]!r} -> {own!r}")
                lines[i] = f"Alias[{name}]:{own}"
            continue
        if own is None:
            continue
        line, key, at = f"Alias[{name}]:{own}", style_map.key_of(name), names.index(name)
        before = [j for n in names[:at] if style_map.key_of(n) == key and (j := find(n)) is not None]
        after = [j for n in names[at + 1:] if style_map.key_of(n) == key and (j := find(n)) is not None]
        earlier = [j for n in names[:at] if (j := find(n)) is not None]
        if before:  # beside the card's other line
            lines[max(before) + 1:max(before) + 1] = [line]
        elif after:
            lines[min(after):min(after)] = [line]
        elif earlier:  # a block of its own after the block of the closest alias before it
            end = block_bounds(lines, max(earlier))[1]
            lines[end:end] = ["", f"// {titles[name]}", line]
        else:  # before the first block of aliases
            start = block_bounds(lines, min(j for j, x in enumerate(lines) if ALIAS_RE.match(x)))[0]
            lines[start:start] = [f"// {titles[name]}", line, ""]
        changes.append(f"styles/{STYLE_FILE}: Alias[{name}] added: {own!r}")
    return lines, changes


def apply(path, dry_run):
    doc = json.loads(Path(path).read_text(encoding="utf-8"))
    main_edits, min_edits = dict(doc.get("main") or {}), dict(doc.get("minimal") or {})
    parts, _ = build.read_sections(check=True)
    text = {name: lines_of(data) for name, data in parts}
    aliases = load_aliases(text)
    by_name = {a["name"]: a for a in aliases}
    unknown = sorted((set(main_edits) | set(min_edits)) - set(by_name))
    if unknown:
        sys.exit(f"--apply: the editor has no alias {', '.join(unknown)}")
    for kind, edits in (("main", main_edits), ("minimal", min_edits)):
        for name, value in edits.items():
            if not (isinstance(value, str) or (kind == "minimal" and value is None)):
                sys.exit(f"--apply: {kind} {name}: a text{' or null' if kind == 'minimal' else ''}, not {value!r}")
            if value is not None and "//" in value:
                sys.exit(f"--apply: {kind} {name} holds //: BH reads the rest of the line as a comment")
    changes, written = [], {}
    for fname in (SYMBOLS_FILE, CUBE_FILE):
        lines = list(text[fname])
        for i, line in enumerate(lines):
            m = ALIAS_RE.match(line)
            if m and m[1] in main_edits and main_edits[m[1]] != m[2]:
                changes.append(f"sections/{fname}: Alias[{m[1]}]: {m[2]!r} -> {main_edits[m[1]]!r}")
                lines[i] = f"Alias[{m[1]}]:{main_edits[m[1]]}"
        if lines != text[fname]:
            written[build.SECTIONS / fname] = lines
    style_path = build.STYLES / STYLE_FILE
    style_lines = lines_of(build.normalize(style_path.read_bytes())[0])
    final_main = {n: main_edits.get(n, a["main"]) for n, a in by_name.items()}
    new_style, style_changes = apply_minimal(list(style_lines), min_edits, final_main, [a["name"] for a in aliases],
                                             {a["name"]: a["title"] for a in aliases})
    changes += style_changes
    if new_style != style_lines:
        written[style_path] = new_style
    for line in changes or ["nothing to change: the files already hold these edits"]:
        print(line)
    if dry_run or not written:
        return 0
    for p, lines in written.items():
        p.write_bytes("\r\n".join(lines).encode("utf-8"))
    payload = json.dumps({"tool_input": {"file_path": str(build.SECTIONS / SYMBOLS_FILE)}})
    hook = subprocess.run([sys.executable, str(HOOK)], input=payload, cwd=ROOT, capture_output=True,
                          encoding="utf-8", errors="replace")
    if hook.returncode:
        print((hook.stderr or hook.stdout).strip(), file=sys.stderr)
        return 1
    print("the hook's generators and the build ran (as after an edit of 040): rebuild the page and republish it")
    return 0


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--apply", metavar="FILE", help="write the page's saved edits (JSON) into the filter")
    ap.add_argument("--dry-run", action="store_true", help="with --apply: list the changes, write nothing")
    args = ap.parse_args()
    if args.apply:
        return apply(args.apply, args.dry_run)
    write_page()
    return 0


if __name__ == "__main__":
    sys.exit(main())
