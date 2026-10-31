#!/usr/bin/env python3
"""
Build the Erazure filters (every entry of filter_definitions.json) from the section files.

  sections/*.filter    joined in filename order, <<VERSION>> filled in    ->  Erazure-Main.filter
  Erazure-Main.filter  with one toggle block switched on per variant      ->  the 7 other toggle variants
  a variant's filter   with the aliases of a style file in styles/        ->  the style variants (Erazure-Minimal*.filter)

Usage (from the repo root; or double-click build.bat to stamp, build and check):
    python tools/build.py           build all the filters
    python tools/build.py --stamp   set version.json's date to today, then build
    python tools/build.py --check   change nothing; exit 1 if any filter or section file is out of date

Section and style files with LF line endings, a UTF-8 BOM or no final line break are fixed in place
(only those invisible characters change) and each fix is reported on a line starting "Fixed".

A style variant (STYLE_VARIANTS) has no toggle block of its own. Its style file holds one Alias[NAME]:... line per
alias that looks different there (and // comments); each replaces the line of the same alias in sections/, and
everything else is the filter of the variant it is built from. A style file ending in .edits holds style edits
instead (tools/style_edits.py: rule by rule, what a rule shows, rules switched off, lines added); the build applies
them, writes the entries back as they match today's lines, and reports the ones that need a look on a line starting
"Style". Several style variants may share a style file (the 4 Corrlorized versions: styles/corrlorized.edits on the
4 PoE toggle variants; the 8 Minimal versions: styles/minimal.filter on all 8); it is
fixed, written back and reported once. A style variant not in filter_definitions.json yet (no launcher entry) is
built all the same, to its display name's file name (Corrlorized - Main - PoE: Corrlorized-Main-PoE.filter).
A launcher entry names its variant by its display_name, or by LAUNCHER_NAMES where the launcher shows another name
(Erazure - BIG GG - Mystery is the Erazure - BIG GG variant).
"""
import argparse
import datetime
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SECTIONS = ROOT / "sections"
STYLES = ROOT / "styles"
VERSION_FILE = ROOT / "version.json"
DEFS = ROOT / "filter_definitions.json"

MAIN = "Erazure - Main"
# {style variant's display name: (the variant it is built from, its style file in styles/)}
STYLE_VARIANTS = {"Minimal": (MAIN, "minimal.filter"),
                  "Minimal - Revealed": ("Erazure - Revealed", "minimal.filter"),
                  "Minimal - BIG GG": ("Erazure - BIG GG", "minimal.filter"),
                  "Minimal - Revealed - BIG GG": ("Erazure - Revealed - BIG GG", "minimal.filter"),
                  "Minimal - PoE": ("Erazure - Main - PoE", "minimal.filter"),
                  "Minimal - Revealed - PoE": ("Erazure - Revealed - PoE", "minimal.filter"),
                  "Minimal - BIG GG - PoE": ("Erazure - BIG GG - PoE", "minimal.filter"),
                  "Minimal - Revealed - BIG GG - PoE": ("Erazure - Revealed - BIG GG - PoE", "minimal.filter"),
                  "Corrlorized - Main - PoE": ("Erazure - Main - PoE", "corrlorized.edits"),
                  "Corrlorized - Revealed - PoE": ("Erazure - Revealed - PoE", "corrlorized.edits"),
                  "Corrlorized - BIG GG - PoE": ("Erazure - BIG GG - PoE", "corrlorized.edits"),
                  "Corrlorized - Revealed - BIG GG - PoE": ("Erazure - Revealed - BIG GG - PoE", "corrlorized.edits")}
# {launcher name: the variant it is (a toggle header or STYLE_VARIANTS name)} for filter_definitions.json's entries
# whose display_name is not their variant's name (the author, 2026-10-30)
LAUNCHER_NAMES = {"Erazure - BIG GG - Mystery": "Erazure - BIG GG",
                  "Minimal - BIG GG - Mystery": "Minimal - BIG GG"}
# The written filters carry every alias but these written into the rules, as BH would when it loads them, and the
# definitions as comments (the author, 2026-10-30): today's BH tries every alias on every rule at every load, with
# heap calls the Windows XP SP3 mode PD2 sets makes slow (a reload took 11.8 s, 3.8 s without aliases). sections/ keep
# the aliases (the tools, the alias editor and the style files read them). The toggles stay aliases, so a player can
# still switch versions in their copy. False once a BH ships without the cost: the filters keep their aliases again.
WRITE_OUT_ALIASES = True
KEEP_ALIASES = {"BIG_GG", "POE_SOUNDS", "REVEALED"}
WRITTEN_OUT = "// written into the rules: "
PLACEHOLDER = b"<<VERSION>>"
CATCH_ALL = b"ItemDisplay[]:"
BOM = b"\xef\xbb\xbf"
MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]

SECTION_NAME_RE = re.compile(r"^(\d{3})-[A-Za-z0-9_-]+\.filter$")
HEADER_RE = re.compile(rb"^//\s+(Erazure - .+?)\s*$")
ALIAS_RE = re.compile(rb"^(//)?(Alias\[(BIG_GG|POE_SOUNDS|REVEALED)\]:(?:TRUE|FALSE))\s*$")
ALIAS_DEF_RE = re.compile(rb"^Alias\[([A-Za-z0-9_]+)\]:")
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
        base = STYLE_VARIANTS[name][0] if name in STYLE_VARIANTS else name
        if base not in blocks:
            fail(f"filter_definitions.json lists '{name}' but the Toggles section has no complete "
                 f"'//  {base}' block (one Alias line each for BIG_GG, POE_SOUNDS, REVEALED)")
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


def load_style(fname, check, problems):
    """{alias name: its line} from styles/<fname>; its format is fixed like a section file's."""
    path = STYLES / fname
    try:
        data, fixes = normalize(path.read_bytes())
    except OSError as e:
        fail(f"cannot read styles/{fname} ({e})")
    if fixes:
        if check:
            problems.append(f"styles/{fname}: {', '.join(fixes)}")
        else:
            path.write_bytes(data)
            print(f"Fixed styles/{fname}: {', '.join(fixes)}")
    style = {}
    for n, line in enumerate(data.split(b"\r\n")[:-1], 1):
        if not line.strip() or line.startswith(b"//"):
            continue
        m = ALIAS_DEF_RE.match(line)
        if not m:
            fail(f"styles/{fname}:{n}: a style file holds only Alias[NAME]:... lines and // comments")
        if b"//" in line:
            fail(f"styles/{fname}:{n}: '//' in Alias[{m.group(1).decode()}]: BH reads the rest of the line "
                 "as a comment (put a color code between the two slashes)")
        if m.group(1) in style:
            fail(f"styles/{fname}:{n}: Alias[{m.group(1).decode()}] is defined twice")
        style[m.group(1)] = line
    return style


def apply_style(lines, style, fname, where):
    """The lines with each of the style's aliases defined by the style's line."""
    out, found = list(lines), {}
    for i, line in enumerate(lines):
        m = ALIAS_DEF_RE.match(line)
        if m and m.group(1) in style:
            if m.group(1) in found:
                fail(f"styles/{fname}: Alias[{m.group(1).decode()}] is defined twice in sections/ "
                     f"({where(found[m.group(1)])}, {where(i)})")
            found[m.group(1)] = i
            out[i] = style[m.group(1)]
    missing = [name.decode() for name in style if name not in found]
    if missing:
        fail(f"styles/{fname}: no such alias in sections/: {', '.join(missing)}")
    return out


# ---------------------------------------------------------------- aliases written out

def bh_trim(s):
    """BH's Trim (Config.cpp): spaces off both ends, then tabs."""
    return s.strip(" ").strip("\t")


def bh_entries(lines):
    """[(line index, key, value)] of the lines BH's Config::Parse keeps: cut at the first //, key and value split at the
    first ':' and trimmed."""
    out = []
    for i, line in enumerate(lines):
        c = line.find("//")
        code = line if c < 0 else line[:c]
        if code:
            j = code.find(":")
            out.append((i, bh_trim(code), bh_trim(code)) if j < 0 else (i, bh_trim(code[:j]), bh_trim(code[j + 1:])))
    return out


def bh_aliases(entries):
    """[(line index, name, value)] as InitializeItemRules has them: ReadMapList("Alias"), the name cut at a space."""
    out = []
    for i, key, value in entries:
        if key.startswith("Alias["):
            name = bh_trim(key[key.find("[") + 1:len(key) - 1])
            out.append((i, name.split(" ")[0], value))
    return out


def bh_substitute(texts, aliases):
    """BH's alias loop over every rule at once: texts = [conditions, outputs], each one string with the rules
    separated by NUL. For each alias in order: in conditions the name, in outputs %NAME% (ASCII upper case), every
    occurrence replaced, searching again from the start until none is left. Replacing all at once gives the same text
    when no replacement makes a new occurrence; otherwise the alias goes rule by rule as BH does."""
    for name, value in aliases:
        if not name:
            continue
        for k, key in enumerate((name, "%" + "".join(chr(ord(c) - 32) if "a" <= c <= "z" else c for c in name) + "%")):
            text = texts[k]
            if key not in text:
                continue
            new = text.replace(key, value)
            if key in new:
                rules = text.split("\0")
                for r, rule in enumerate(rules):
                    for _ in range(10000):
                        p = rule.find(key)
                        if p < 0:
                            break
                        rule = rule[:p] + value + rule[p + len(key):]
                    else:
                        fail(f"Alias[{name}] keeps finding its name in what it writes (BH would hang)")
                    rules[r] = rule
                new = "\0".join(rules)
            texts[k] = new
    return texts


def bh_rules(lines):
    """(the rules as BH has them after its alias loop, the other entries but aliases) of a filter's lines."""
    entries = bh_entries(lines)
    rules = [(key[len("ItemDisplay["):len(key) - 1], value) for _, key, value in entries
             if key.startswith("ItemDisplay[")]
    texts = bh_substitute(["\0".join(c for c, _ in rules), "\0".join(o for _, o in rules)],
                          [(n, v) for _, n, v in bh_aliases(entries)])
    other = [(k, v) for _, k, v in entries if not k.startswith(("Alias[", "ItemDisplay["))]
    return texts, other


_WRITTEN = {}  # {(rule texts, written aliases): (conditions, outputs)}: the toggle versions share their rules
SWITCHED_OFF_RULE = re.compile(r"^([ \t]*//+[ \t]*)(ItemDisplay\[.*)$")


def switched_on(lines):
    """The lines with every switched-off rule (//ItemDisplay[...], the options of 050, Corr's x entries) switched on
    as a player would: its leading // taken off."""
    return [m.group(2) if (m := SWITCHED_OFF_RULE.match(line)) else line for line in lines]


def write_out_aliases(out, where, verify):
    """The written filter's lines with every alias but KEEP_ALIASES written into the rules, the switched-off ones too
    (a player who switches one on gets the rule as BH reads it in the filter with its aliases), and its definition
    turned into a comment. With verify (--check: build.bat and CI, ~0.5 s a filter), stops unless BH reads the result
    as exactly the same rules, formulas and other entries as the filter with its aliases, with every switched-off rule
    switched on (the kept aliases change places with the ones defined after them, which could matter in theory)."""
    lines = [x.decode("utf-8") for x in out]
    entries = bh_entries(lines)
    aliases = bh_aliases(entries)
    gone = [(i, n, v) for i, n, v in aliases if n not in KEEP_ALIASES]
    # (line index, the // a switched-off rule keeps, its text without them, condition, output)
    rules = [(i, "", lines[i], key[len("ItemDisplay["):len(key) - 1], value) for i, key, value in entries
             if key.startswith("ItemDisplay[")]
    for i, line in enumerate(lines):
        if m := SWITCHED_OFF_RULE.match(line):
            rules += [(i, m.group(1), m.group(2), key[len("ItemDisplay["):len(key) - 1], value)
                      for _, key, value in bh_entries([m.group(2)]) if key.startswith("ItemDisplay[")]
    rules.sort()
    key = (tuple((c, o) for *_, c, o in rules), tuple((n, v) for _, n, v in gone))
    if key not in _WRITTEN:
        _WRITTEN[key] = bh_substitute(["\0".join(c for *_, c, _ in rules), "\0".join(o for *_, o in rules)],
                                      [(n, v) for _, n, v in gone])
    conds, outs = _WRITTEN[key]
    for (i, prefix, text, cond, output), new_cond, new_out in zip(rules, conds.split("\0"), outs.split("\0")):
        if (new_cond, new_out) == (cond, output):
            continue
        if ":" in new_cond or "//" in new_cond or "//" in new_out:
            fail(f"an alias writes ':' or '//' into the rule at {where(i)}; BH would read the line differently")
        c = text.find("//")
        comment = "" if c < 0 else text[c:]
        code = text if c < 0 else text[:c]
        j = code.find(":")
        lead = code[:len(code) - len(code.lstrip(" \t"))]
        after = code[j + 1:]
        space = after[:len(after) - len(after.lstrip(" \t"))]
        tail = code[len(code.rstrip(" \t")):] if new_out else ""
        lines[i] = f"{prefix}{lead}ItemDisplay[{new_cond}]:{space}{new_out}{tail}{comment}"
    for i, _, _ in gone:
        lines[i] = WRITTEN_OUT + lines[i]
    if verify:
        new_lines, old_lines = switched_on(lines), switched_on([x.decode("utf-8") for x in out])
        (new_c, new_o), new_other = bh_rules(new_lines)
        (old_c, old_o), old_other = bh_rules(old_lines)
        if new_other != old_other:
            fail("writing the aliases into the rules would change an entry other than a rule")
        at = [i for i, key, _ in bh_entries(new_lines) if key.startswith("ItemDisplay[")]
        for i, a, b, c, d in zip(at, new_c.split("\0"), old_c.split("\0"), new_o.split("\0"), old_o.split("\0")):
            if (a, c) != (b, d):
                fail(f"writing the aliases into the rules would change the rule at {where(i)} as BH reads it"
                     f"{' once switched on' if SWITCHED_OFF_RULE.match(lines[i]) else ''}")
    return [x.encode("utf-8") for x in lines]


def file_name(name):
    """A display name's filter file: 'Corrlorized - BIG GG - PoE' -> 'Corrlorized-BIG-GG-PoE.filter'."""
    return name.replace(" - ", "-").replace(" ", "-") + ".filter"


def styled(name, lines, blocks, parts, where, check, problems):
    """A style variant as built: (its lines, where(i) for them, the indices of the lines its style wrote, a status
    line for a style edits file or None)."""
    base, style_file = STYLE_VARIANTS[name]
    rendered = render(lines, blocks, base)
    if not style_file.endswith(".edits"):
        out = apply_style(rendered, load_style(style_file, check, problems), style_file, where)
        return out, where, {i for i, line in enumerate(out) if line != rendered[i]}, None
    import style_edits  # it imports this module: only here
    origin = []
    out, entries = style_edits.build_lines(Path(style_file).stem, [x.decode("utf-8") for x in rendered],
                                           style_edits.section_starts(parts), check, problems, origin)
    out = [x.encode("utf-8") for x in out]
    own = {j for j, o in enumerate(origin) if not isinstance(o, int) or out[j] != rendered[o]}

    def where_styled(j):
        o = origin[j]
        return where(o) if isinstance(o, int) else f"{where(o[1])}+ (styles/{style_file})"
    names = [n for n, (_, f) in STYLE_VARIANTS.items() if f == style_file]
    status = f"Style styles/{style_file} ({', '.join(names)}): {style_edits.summary(entries)}"
    if any(e.status in style_edits.LOOK for e in entries):
        status += f" (python tools/style_edits.py {Path(style_file).stem} --report)"
    return out, where_styled, own, status


def variant_text(name):
    """A variant or style variant as built, written nowhere (tools/explain_item.py, tools/lint_filter.py --style):
    (its lines, where(i) -> 'sections/<file>:<line>', the indices of the lines a style variant's style wrote)."""
    name = LAUNCHER_NAMES.get(name, name)
    _, season, date = load_version()
    parts, _ = read_sections(check=True)
    where = line_locator(parts)
    lines = b"".join(d for _, d in parts).replace(PLACEHOLDER, version_text(season, date).encode()).split(b"\r\n")
    blocks = find_toggle_blocks(lines)
    if (STYLE_VARIANTS[name][0] if name in STYLE_VARIANTS else name) not in blocks:
        fail(f"unknown variant '{name}'; choose one of: {', '.join(list(blocks) + list(STYLE_VARIANTS))}")
    if name not in STYLE_VARIANTS:
        return [x.decode("utf-8") for x in render(lines, blocks, name)], where, set()
    out, where_out, own, _ = styled(name, lines, blocks, parts, where, True, [])
    return [x.decode("utf-8") for x in out], where_out, own


def load_defs():
    try:
        entries = list(json.loads(DEFS.read_text(encoding="utf-8-sig"))["filter_info"].values())
        pairs = [(LAUNCHER_NAMES.get(e["display_name"], e["display_name"]), e["file_name"]) for e in entries]
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
    # a style variant with no launcher entry yet is built all the same (to test it in game)
    extra = [(name, file_name(name)) for name in STYLE_VARIANTS if name not in dict(defs)]
    check_toggles(lines, blocks, [name for name, _ in defs + extra], where)

    stale, notes, done = [], [], set()
    for name, fname in defs + extra:
        if name in STYLE_VARIANTS:
            first = STYLE_VARIANTS[name][1] not in done  # a style file several variants share: fixed, written and
            done.add(STYLE_VARIANTS[name][1])            # reported once
            out, where_out, _, note = styled(name, lines, blocks, parts, where, args.check if first else True,
                                             problems if first else [])
            if note and first:
                notes.append(note)
        else:
            out, where_out = render(lines, blocks, name), where
        if WRITE_OUT_ALIASES:
            out = write_out_aliases(out, where_out, args.check)
        data = b"\r\n".join(out)
        target = ROOT / fname
        if target.exists() and target.read_bytes() == data:
            continue
        stale.append(fname)
        if not args.check:
            target.write_bytes(data)

    also = f", and {', '.join(f for _, f in extra)} (no launcher entry yet)" if extra else ""
    if args.check:
        if problems or stale:
            if problems:
                print("Section and style files need fixing (run: python tools/build.py):", *problems, sep="\n  ")
            if stale:
                print("Out of date with sections/ (run: python tools/build.py):", *stale, sep="\n  ")
            sys.exit(1)
        print(f"All {len(defs)} filters in sync ({version}){also}.")
    else:
        print(f"Built {len(defs)} filters ({version}){also}. "
              f"Updated: {', '.join(stale) if stale else 'none, already up to date'}")
    for note in notes:
        print(note)


if __name__ == "__main__":
    main()
