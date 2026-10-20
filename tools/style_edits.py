#!/usr/bin/env python3
"""
Style edits: a style variant's own lines on top of a variant's filter as built (tools/build.py).

styles/<name>.edits holds, for each line the style changes, the author's line and the style's version of it:

    @ 110-runes.filter:12  El Rune
    - ItemDisplay[(r01s OR r01)]:%WHITE%El Rune%CONTINUE%//
    + ItemDisplay[(r01s OR r01)]:%LIGHT_GRAY%El Rune%CONTINUE%//

    @ 040-aliases.filter:83  VIALX, VIALY
    = Alias[VIAL]:%PURPLE%xX%BLUE%xX%LIGHT_GRAY%x\\%WHITE%\\V/%LIGHT_GRAY%/x%BLUE%Xx%PURPLE%Xx
    + Alias[VIALX]:%GRAY%+++%LIGHT_GRAY%+++%WHITE%+++
    + Alias[VIALY]:%WHITE%+++%LIGHT_GRAY%+++%GRAY%+++

    @ 110-runes.filter:58  Notify for runes El-Tal
    x ItemDisplay[RUNE<8 FILTLVL<12]:%NAME%{%NAME%}%BORDER-71%%MAP-75%%DOT-1B%%PX-20%// Notify for runes El-Tal

    @ 140-map-resistances.filter  Highest Resistances
    * !STAT360>0

A "-" entry changes one line. On an ItemDisplay line it changes only what the rule shows (between "]:" and the
rule's // comment): the condition and the comment always stay the author's, so a style never changes when a rule
applies. On an Alias line it changes the value. A "=" entry inserts its "+" lines after the anchor line, which
stays as it is. An "x" entry switches one rule off (the build writes it as a // comment); a "*" entry switches off
every rule of its "@" section whose condition has each of its words (BH's words: "!STAT360>0" matches
"ItemDisplay[t34 !STAT360>0 !STAT276>0]", not "!(STAT360>0 ...)"), so the section's later rules of that kind go too.
Aliases are never switched off: rules everywhere use them. The "@" line says where the entry last matched (the
build keeps it up to date) and names it. Other lines are // comments or blank.

Every build applies the entries again to the filter as it is now, so the variant keeps every change made to
sections/. Each "-", "=" and "x" entry finds its line: the "-" / "=" / "x" text, nearest to its "@" place; else, in
that section, the rule with the same condition and comment (the comment names the item on unique and set rules);
else a line in that section at least 80% alike with the same comment. Then it merges word by word: the style's
change (from its "-" to its "+") and the author's changes since (from its "-" to the line as it is now) both apply;
where both changed the same words, the style's look wins ("kept the style's look"). After a merge the entry is
rewritten to the line as it is now, so the next build finds it exactly. An entry that finds no line is left out and
reported ("not placed"); so is a "*" entry whose section has no such rule.

Usage (from the repo root):
    python tools/style_edits.py corrlorized --report     each entry's status (--all: also the ones applied as is)
    python tools/style_edits.py corrlorized --diff       each line the style changes: the author's, then the style's
    python tools/style_edits.py corrlorized --out FILE   write the styled filter to FILE (the edits file is untouched)
    python tools/style_edits.py corrlorized --port --base REV:FILE --theirs FILE
                                                         write styles/corrlorized.edits from a restyled copy of an
                                                         older filter (one-time import; see port())
    python tools/style_edits.py --selftest               check the merge and the import
"""
import argparse
import bisect
import difflib
import json
import re
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402

ROOT = build.ROOT
STYLES = ROOT / "styles"
REVIEW_FILE = ROOT / "tools" / ".cache" / "style-review-{}.json"  # the port's review data (gitignored cache)

TOKEN_RE = re.compile(r"%[A-Z0-9_\-]+%|\s+|\w+|.", re.S)
RULE_RE = re.compile(r"^(ItemDisplay\[.*?\]:)(.*)$")
ALIAS_RE = re.compile(r"^(Alias\[([A-Za-z0-9_]+)\]:)(.*)$")
HINT_RE = re.compile(r"^@ (?:(\S+?\.filter)(?::(\d+))?(?=\s|$))?\s*(.*?)\s*$")
WORD_RE = re.compile(r"[^\s()]+")
SOUND_RE = re.compile(r"%SOUNDID-\d+%")
COLOR_RE = re.compile(r"%(WHITE|RED|LIGHT_GREEN|GREEN|DARK_GREEN|BLUE|LIGHT_BLUE|GOLD|GRAY|LIGHT_GRAY|BLACK|TAN|"
                      r"ORANGE|YELLOW|PURPLE|DARK_RED|TEAL|CORAL|SAGE|LIGHT_PURPLE|LIGHT_RED|CRYSTAL_BLUE|"
                      r"LIGHT_TEAL|BRIGHT_WHITE)%")
ICON_RE = re.compile(r"%(BORDER|MAP|DOT|PX)-[0-9A-Fa-f]+%")
TIER_RE = re.compile(r"%TIER-\d%")
ALIKE = 0.8  # a line this alike (difflib ratio) counts as the same line moved or rewritten
NEAR = 150  # how far (in lines) an alike line may be from the entry's place
SHOWS_ALIKE = 0.5  # what a rule shows, this alike, for a rule found by its condition or likeness: El Rune's name
#                    line is not its Cube recipe line, which has the same condition
KINDS = ("-", "=", "x", "*")
LOOK = ("followed your changes", "kept the style's look", "same as yours", "switched off", "not placed")


def fail(msg):
    sys.exit(f"STYLE ERROR: {msg}")


# ---------------------------------------------------------------- lines

def split(line):
    """(head, body, tail): head is 'ItemDisplay[...]:' or 'Alias[NAME]:' (None for other lines), body what a style
    may change, tail the rule's // comment."""
    m = RULE_RE.match(line)
    if m:
        out = m.group(2)
        c = out.find("//")
        return (m.group(1), out, "") if c < 0 else (m.group(1), out[:c], out[c:])
    m = ALIAS_RE.match(line)
    if m:
        return m.group(1), m.group(3), ""
    return None, line, ""


def note(line):
    """A rule's comment, which names the item on unique and set rules."""
    return split(line)[2][2:].strip()


def alias_name(line):
    m = ALIAS_RE.match(line)
    return m.group(2) if m else None


def condition_words(line):
    """The words of a rule's condition, as a '*' entry matches them."""
    head = split(line)[0]
    if head is None or not head.startswith("ItemDisplay["):
        return set()
    return set(WORD_RE.findall(head[len("ItemDisplay["):-2]))


def tokens(text):
    return TOKEN_RE.findall(text)


def shows_alike(a, b):
    """Whether two rules show much the same (their bodies at least SHOWS_ALIKE alike): one rule changed by the
    author, not another rule with the same condition."""
    a, b = split(a)[1], split(b)[1]
    m = difflib.SequenceMatcher(None, a, b, autojunk=False)
    return m.real_quick_ratio() >= SHOWS_ALIKE and m.quick_ratio() >= SHOWS_ALIKE and m.ratio() >= SHOWS_ALIKE


def kinds(before, after):
    """What a change of a rule's body changes: color, sound, icon, tier, text."""
    found = []
    for name, rx in (("color", COLOR_RE), ("sound", SOUND_RE), ("icon", ICON_RE), ("tier", TIER_RE)):
        if [m.group(0) for m in rx.finditer(before)] != [m.group(0) for m in rx.finditer(after)]:
            found.append(name)
    rest = lambda s: TIER_RE.sub("", ICON_RE.sub("", SOUND_RE.sub("", COLOR_RE.sub("", s))))
    if rest(before) != rest(after):
        found.append("text")
    return found


# ---------------------------------------------------------------- word-by-word merge

def _hunks(a, b):
    return [(i1, i2, b[j1:j2]) for tag, i1, i2, j1, j2 in
            difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes() if tag != "equal"]


def _clash(x, y):
    (a1, a2, _), (b1, b2, _) = x, y
    return ((a1 < b2 and b1 < a2) or a1 == a2 == b1 == b2
            or (a1 == a2 and b1 < a1 < b2) or (b1 == b2 and a1 < b1 < a2))


def _patch(base, lo, hi, hunks):
    out, pos = [], lo
    for i1, i2, rep in sorted(hunks, key=lambda h: (h[0], h[1])):
        out += base[pos:i1] + rep
        pos = i2
    return out + base[pos:hi]


def merge3(base, style, author):
    """(merged text, whether both changed the same words). Both sides' changes from base apply; where they
    overlap, the style's version wins."""
    if author == base or style == author:
        return style, False
    if style == base:
        return author, False
    b = tokens(base)
    marked = sorted([(h, "s") for h in _hunks(b, tokens(style))] + [(h, "a") for h in _hunks(b, tokens(author))],
                    key=lambda t: (t[0][0], t[0][1]))
    clusters = []
    for h, side in marked:
        if clusters and any(_clash(h, g) for g, _ in clusters[-1]):
            clusters[-1].append((h, side))
        else:
            clusters.append([(h, side)])
    out, pos, clashed = [], 0, False
    for cluster in clusters:
        lo = min(h[0] for h, _ in cluster)
        hi = max(h[1] for h, _ in cluster)
        mine = [h for h, side in cluster if side == "s"]
        theirs = [h for h, side in cluster if side == "a"]
        if mine and theirs:
            a, s = _patch(b, lo, hi, theirs), _patch(b, lo, hi, mine)
            clashed |= a != s
            rep = s
        else:
            rep = _patch(b, lo, hi, mine or theirs)
        out += b[pos:lo] + rep
        pos = hi
    return "".join(out + b[pos:]), clashed


def merge_line(old, new, cur):
    """The current line with the style's change (old -> new) merged into what it shows."""
    head, body, tail = split(cur)
    merged, clashed = merge3(split(old)[1], split(new)[1], body)
    return head + merged + tail, clashed


# ---------------------------------------------------------------- the edits file

class Entry:
    def __init__(self, kind, old, new, file=None, line=None, label=""):
        self.kind, self.old, self.new = kind, old, list(new)
        self.file, self.line, self.label = file, line, label
        self.status, self.how, self.target, self.result, self.lines = None, None, None, None, []

    def hint(self):
        place = f"{self.file}:{self.line}" if self.file and self.line else self.file or ""
        return f"@ {place}  {self.label}".rstrip() if place else f"@ {self.label}".rstrip()

    def text(self):
        return [self.hint(), f"{self.kind} {self.old}"] + [f"+ {n}" for n in self.new]


def parse(text, fname):
    """[free line (str) or Entry] from an edits file's text."""
    items, entry = [], None

    def where(n):
        return f"styles/{fname}:{n}"

    for n, line in enumerate(text.split("\r\n")[:-1], 1):
        if line.startswith("@"):
            m = HINT_RE.match(line)
            if not m:
                fail(f"{where(n)}: an entry starts with '@ <section file>:<line>  <name>'")
            entry = Entry(None, None, [], m.group(1), int(m.group(2)) if m.group(2) else None, m.group(3))
            items.append(entry)
        elif line[:2] in tuple(k + " " for k in KINDS if k != "+"):
            if entry is None or entry.kind is not None:
                fail(f"{where(n)}: a '{line[0]}' line comes right after its entry's '@' line")
            entry.kind, entry.old = line[0], line[2:]
        elif line.startswith("+ "):
            if entry is None or entry.kind is None:
                fail(f"{where(n)}: a '+' line belongs to an entry ('@', then '-' or '=')")
            entry.new.append(line[2:])
        elif not line.strip() or line.startswith("//"):
            if entry is not None:
                check_entry(entry, where(n))
            entry = None
            items.append(line)
        else:
            fail(f"{where(n)}: a line is '@ ...', '- ...', '= ...', 'x ...', '* ...', '+ ...', a // comment or blank")
    if entry is not None:
        check_entry(entry, f"styles/{fname} (end)")
    return items


def check_entry(e, where):
    if e.kind is None:
        fail(f"{where}: entry '{e.label}' needs a '-', '=', 'x' or '*' line")
    if e.kind in ("x", "*"):
        if e.new:
            fail(f"{where}: '{e.label}': an '{e.kind}' entry switches rules off and has no '+' lines")
        if e.kind == "x" and not e.old.startswith("ItemDisplay["):
            fail(f"{where}: '{e.label}': an 'x' entry switches off one ItemDisplay line (aliases stay: rules use them)")
        if e.kind == "*" and not (e.file and e.old.split()):
            fail(f"{where}: '{e.label}': a '*' entry names its section ('@ 140-map-resistances.filter  <name>') "
                 "and the words a rule's condition must have")
        return
    if not e.new:
        fail(f"{where}: entry '{e.label}' needs at least one '+' line")
    if e.kind == "-":
        if len(e.new) != 1:
            fail(f"{where}: a '-' entry ('{e.label}') has exactly one '+' line ('=' inserts lines)")
        old_head, new_head = split(e.old)[0], split(e.new[0])[0]
        if old_head is None:
            fail(f"{where}: '{e.label}': a '-' entry changes an ItemDisplay or Alias line")
        if old_head != new_head:
            fail(f"{where}: '{e.label}': the '+' line must keep the '-' line's "
                 f"{'condition' if old_head.startswith('ItemDisplay') else 'alias name'} (a style changes only "
                 "what a rule shows; 'x' switches a rule off)")
    for n in e.new:
        if n.startswith("//"):
            fail(f"{where}: '{e.label}': a style line is never a comment (an 'x' entry switches a rule off)")
        if alias_name(n) and "//" in n:
            fail(f"{where}: '{e.label}': '//' in an Alias line: BH reads the rest of the line as a comment")


def serialize(items):
    out = []
    for it in items:
        out += it.text() if isinstance(it, Entry) else [it]
    return "\r\n".join(out) + "\r\n"


def load_edits(name, check=True, problems=None):
    """(items, the file's bytes as normalized)."""
    path = STYLES / f"{name}.edits"
    try:
        data, fixes = build.normalize(path.read_bytes())
    except OSError as e:
        fail(f"cannot read styles/{name}.edits ({e})")
    if fixes:
        if check:
            if problems is not None:
                problems.append(f"styles/{name}.edits: {', '.join(fixes)}")
        else:
            path.write_bytes(data)
            print(f"Fixed styles/{name}.edits: {', '.join(fixes)}")
    return parse(data.decode("utf-8"), f"{name}.edits"), data


# ---------------------------------------------------------------- the filter

def load_variant(variant):
    """(lines of the variant as built, list of (section file, first line index))."""
    parts, _ = build.read_sections(check=True)
    _, season, date = build.load_version()
    joined = b"".join(d for _, d in parts).replace(build.PLACEHOLDER, build.version_text(season, date).encode())
    lines = joined.split(b"\r\n")
    blocks = build.find_toggle_blocks(lines)
    if variant not in blocks:
        fail(f"unknown variant '{variant}'; choose one of: {', '.join(blocks)}")
    return [x.decode("utf-8") for x in build.render(lines, blocks, variant)], section_starts(parts)


def section_starts(parts):
    starts, n = [], 0
    for name, data in parts:
        starts.append((name, n))
        n += data.count(b"\r\n")
    return starts


class Filter:
    """The lines of a filter with the lookups the entries need."""

    def __init__(self, lines, starts):
        self.lines, self.starts = lines, starts
        self.first = {name: i for name, i in starts}
        self._names = [name for name, _ in starts]
        self._at = [i for _, i in starts]
        self.exact, self.rules, self.aliases = defaultdict(list), defaultdict(list), defaultdict(list)
        for i, line in enumerate(lines):
            self.exact[line].append(i)
            head = split(line)[0]
            if head is None:
                continue
            if alias_name(line):
                self.aliases[alias_name(line)].append(i)
            else:
                self.rules[(head, note(line))].append(i)

    def file_of(self, i):
        k = bisect.bisect_right(self._at, i) - 1
        return self._names[k] if k >= 0 else None

    def place(self, i):
        name = self.file_of(i)
        return name, i - self.first[name] + 1

    def pos(self, file, line):
        if file in self.first and line:
            return self.first[file] + line - 1
        return None

    def section(self, file):
        """The indices of a section file's lines (none if there is no such section)."""
        if file not in self.first:
            return range(0)
        k = self._names.index(file)
        return range(self._at[k], self._at[k + 1] if k + 1 < len(self._at) else len(self.lines))

    def matching(self, file, words):
        """The rules of a section whose condition has each of the words (a '*' entry)."""
        want = set(words.split())
        return [i for i in self.section(file) if want <= condition_words(self.lines[i])]

    def find(self, old, file, pos, taken, stage):
        """The index of the line an entry's '-' / '=' / 'x' text means now, or None. Stages, tried in turn for all
        entries so that a closer match is never taken by a looser one: 'exact' (the same text), 'condition' (the
        same condition and comment in that section; an alias: the same name), 'alike' (a line in that section, near
        its place, at least 80% alike with the same comment), 'loose' (the import only: see loose())."""
        free = lambda idxs: [i for i in idxs if i not in taken]

        def nearest(idxs):
            if not idxs:
                return None
            return min(idxs, key=lambda i: (self.file_of(i) != file, abs(i - pos) if pos is not None else 0))

        if stage == "exact":
            return nearest(free(self.exact.get(old, [])))
        name = alias_name(old)
        if stage == "condition":
            if name:
                return nearest(free(self.aliases.get(name, [])))
            head = split(old)[0]
            if head is None:
                return None
            return nearest([i for i in free(self.rules.get((head, note(old)), []))
                            if (file is None or self.file_of(i) == file) and shows_alike(old, self.lines[i])])
        if stage == "loose":
            return self.loose(old, taken)
        if pos is None or name:
            return None
        best, found, want = ALIKE, None, note(old)
        matcher = difflib.SequenceMatcher(None, autojunk=False)
        matcher.set_seq2(old)
        for i in range(max(0, pos - NEAR), min(len(self.lines), pos + NEAR + 1)):
            line = self.lines[i]
            if i in taken or not line.strip() or (file and self.file_of(i) != file) or note(line) != want:
                continue
            if split(line)[0] is None and split(old)[0] is not None or alias_name(line):
                continue
            matcher.set_seq1(line)
            if matcher.real_quick_ratio() > best and matcher.quick_ratio() > best:
                r = matcher.ratio()
                if r > best and shows_alike(old, line):
                    best, found = r, i
        return found

    def loose(self, old, taken):
        """For the import: the best line in the whole filter by likeness (difflib ratio), plus 0.3 when it shows
        the same (its body is the same) and 0.2 when its comment is nearly the same; at least 0.9 in all."""
        head, body, _ = split(old)
        if head is None or alias_name(old):
            return None
        want = note(old)
        m = difflib.SequenceMatcher(None, autojunk=False)
        m.set_seq2(old)
        best, found = 0.9, None
        for i, line in enumerate(self.lines):
            if i in taken or not line.startswith("ItemDisplay["):
                continue
            h, b, _ = split(line)
            bonus = (0.3 if b == body else 0) + (0.2 if want and note(line) and
                                                  difflib.SequenceMatcher(None, want, note(line)).ratio() >= 0.9
                                                  else 0)
            m.set_seq1(line)
            if m.real_quick_ratio() + bonus <= best or m.quick_ratio() + bonus <= best:
                continue
            r = m.ratio() + bonus
            if r > best:
                best, found = r, i
        return found


STAGES = ("exact", "condition", "alike")


def place_entries(entries, flt, stages=STAGES, pos_of=None):
    """Set each entry's target (index) and how it was found; '-' and 'x' entries claim their line."""
    taken = set()
    for stage in stages:
        for e in entries:
            if e.target is not None or e.kind == "*":
                continue
            pos = pos_of(e) if pos_of else flt.pos(e.file, e.line)
            file = None if pos_of else e.file
            claims = e.kind in ("-", "x")
            i = flt.find(e.old, file, pos, taken if claims else set(), stage)
            if i is not None:
                e.target, e.how = i, stage
                if claims:
                    taken.add(i)


def apply(items, flt, origin=None):
    """The styled lines; sets each entry's status, target and result, and refreshes it (old, new, place). With a
    list as origin, appends for each styled line the index of its line in flt, or for an inserted line
    (its entry, the anchor's index)."""
    replace, insert, off = {}, defaultdict(list), set()
    entries = [e for e in items if isinstance(e, Entry)]
    for e in entries:
        e.target = e.how = e.result = None
        e.lines = []
    place_entries(entries, flt)
    for e in entries:
        if e.kind == "*":
            e.lines = flt.matching(e.file, e.old)
            e.status = "applied" if e.lines else "not placed"
            off.update(e.lines)
            continue
        i = e.target
        if i is None:
            e.status = "not placed"
            continue
        cur = flt.lines[i]
        if e.kind == "x":
            e.status = "applied" if cur == e.old else "followed your changes"
            e.result = "//" + cur
            off.add(i)
        elif e.kind == "=":
            e.status = "applied" if cur == e.old else "followed your changes"
            e.result = e.old
            insert[i] += [(e, n) for n in e.new]
        else:
            result, clashed = merge_line(e.old, e.new[0], cur)
            e.result = result
            if result == cur:
                e.status = "same as yours"
            elif clashed:
                e.status = "kept the style's look"
            elif cur == e.old:
                e.status = "applied"
            else:
                e.status = "followed your changes"
            replace[i] = result
    for e in entries:
        if e.kind == "-" and e.target in off:
            e.status = "switched off"  # a '*' entry switches its line off: its look never shows
    out = []
    for i, line in enumerate(flt.lines):
        line = replace.get(i, line)
        out.append("//" + line if i in off else line)
        if origin is not None:
            origin.append(i)
        for e, n in insert.get(i, []):
            out.append(n)
            if origin is not None:
                origin.append((e, i))
    for e in entries:  # refresh: the entry describes the line as it is now
        if e.target is None:
            continue
        cur = flt.lines[e.target]
        if e.kind == "-":
            e.old, e.new = cur, [e.result]
        else:
            e.old = cur
        e.file, e.line = flt.place(e.target)
    return out


def switched_off(entries):
    return {i for e in entries for i in (e.lines if e.kind == "*" else [e.target] if e.kind == "x" else [])
            if i is not None}


def summary(entries):
    c = Counter(e.status for e in entries)
    off = len(switched_off(entries))
    parts = [f"{len(entries)} edits" + (f" ({off} rules switched off)" if off else "")]
    parts += [f"{c[status]} {status}" for status in LOOK if c[status]]
    return ", ".join(parts)


def run(name, variant):
    """(items, styled lines, Filter) for a style on the given variant."""
    items, _ = load_edits(name)
    lines, starts = load_variant(variant)
    flt = Filter(lines, starts)
    return items, apply(items, flt), flt


def build_lines(name, lines, starts, check, problems, origin=None):
    """For tools/build.py: (the style's lines on a variant's lines as built, its entries). Writes the refreshed
    entries back to styles/<name>.edits; with check, a refresh to write is a problem instead."""
    items, data = load_edits(name, check, problems)
    out = apply(items, Filter(lines, starts), origin)
    text = serialize(items).encode("utf-8")
    if text != data:
        if check:
            problems.append(f"styles/{name}.edits: entries to refresh (its lines changed in sections/)")
        else:
            (STYLES / f"{name}.edits").write_bytes(text)
    return out, [e for e in items if isinstance(e, Entry)]


# ---------------------------------------------------------------- one-time import (port)

def git_file(spec):
    rev, _, path = spec.partition(":")
    if not path:
        fail(f"--base takes REV:FILE (e.g. 1a0ae41:Erazure-Main-PoE.filter), not '{spec}'")
    res = subprocess.run(["git", "show", f"{rev}:{path}"], cwd=ROOT, capture_output=True)
    if res.returncode:
        fail(f"git show {rev}:{path}: {res.stderr.decode('utf-8', 'replace').strip()}")
    return res.stdout.decode("utf-8").split("\r\n")


def sound_only(body):
    """Whether a rule's output does nothing but play a sound (its name and description unchanged)."""
    rest = [t for t in tokens(SOUND_RE.sub("", body)) if t.strip() and t not in ("%NAME%", "%CONTINUE%", "{", "}")]
    return bool(SOUND_RE.search(body)) and not rest


def pair_changes(base, theirs):
    """The restyled copy's changes to base: [(kind, base index, base line, their line, anchor index)].
    kind: 'change' (a base line and its new version), 'out' (commented out), 'delete', 'add'."""
    found = []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, base, theirs, autojunk=False).get_opcodes():
        if op == "equal":
            continue
        used, pairs = set(), []
        for f in theirs[j1:j2]:
            best, bi = 0.55, None
            for i in range(i1, i2):
                if i in used:
                    continue
                r = 2.0 if f == "//" + base[i] else difflib.SequenceMatcher(None, base[i], f).ratio()
                if r > best:
                    best, bi = r, i
            if bi is not None:
                used.add(bi)
            pairs.append((bi, f))
        # a commented-out original and a new line with its condition: the original changed
        outs = {bi: k for k, (bi, f) in enumerate(pairs) if bi is not None and f == "//" + base[bi]}
        for k, (bi, f) in enumerate(pairs):
            if bi is not None or not f.startswith(("ItemDisplay[", "Alias[")):
                continue
            for obi, ok in list(outs.items()):
                if split(base[obi])[0] == split(f)[0]:
                    pairs[k] = (obi, f)
                    pairs[ok] = (None, None)
                    del outs[obi]
                    break
        last = i1 - 1
        for bi, f in pairs:
            if f is None:
                continue
            if bi is None:
                found.append(("add", None, None, f, last))
            else:
                found.append(("out" if f == "//" + base[bi] else "change", bi, base[bi], f, None))
                last = bi
        for i in range(i1, i2):
            if i not in used:
                found.append(("delete", i, base[i], None, None))
    # a line deleted or commented out and a line with its condition added close by (in another hunk): a change
    adds = [k for k, c in enumerate(found) if c[0] == "add" and c[3].startswith(("ItemDisplay[", "Alias["))]
    for k, c in enumerate(found):
        if c is None or c[0] not in ("delete", "out"):
            continue
        _, bi, b, _, _ = c
        for a in adds:
            if split(found[a][3])[0] == split(b)[0] and abs(found[a][4] - bi) <= 10:
                found[k] = ("change", bi, b, found[a][3], None)
                found[a] = None
                adds.remove(a)
                break
    return [c for c in found if c is not None]


def sort_changes(changes):
    """(carried, dropped): carried = [(kind '-'|'='|'x', base index, base line, style line(s))], dropped = review
    rows."""
    carried, dropped, adds = [], [], defaultdict(list)
    for kind, bi, b, f, anchor in changes:
        if kind == "add":
            if f.startswith(("ItemDisplay[", "Alias[")):
                adds[anchor].append(f)
            continue
        if kind == "delete":
            dropped.append(("deleted line", bi, b, None))
            continue
        head = split(b)[0]
        if kind == "out":
            if alias_name(b):
                dropped.append(("alias switched off", bi, b, f))  # rules use it: it stays
            elif head and sound_only(split(b)[1]):
                h, body, tail = split(b)
                carried.append(("-", bi, b, h + SOUND_RE.sub("", body) + tail))  # a sound he switched off
            elif head:
                carried.append(("x", bi, b, None))
            continue
        fh, fbody, _ = split(f)
        if head is None or fh is None:
            if not (b.startswith("//") and f.startswith("//")):
                dropped.append(("other line", bi, b, f))
            continue
        if fh != head:
            dropped.append(("condition (filtering)", bi, b, f))
        if fbody != split(b)[1]:
            h, _, tail = split(b)
            carried.append(("-", bi, b, h + fbody + tail))
    for anchor, lines in adds.items():
        carried.append(("=", anchor, None, lines))
    return carried, dropped


def port(base, theirs, flt):
    """Entries for the restyled copy's look on today's filter, and the review data.

    base is the filter the copy started from, theirs the copy. Carried over: what rules show (colors, symbols,
    text, sounds, icon colors), rules switched off ('x'), new aliases and rules. Dropped (listed for review):
    conditions (a style never changes when a rule applies), aliases switched off, deleted lines."""
    carried, dropped = sort_changes(pair_changes(base, theirs))
    sm = difflib.SequenceMatcher(None, base, flt.lines, autojunk=False)
    anchors = [(a + k, b + k) for a, b, n in sm.get_matching_blocks() for k in range(n)]
    abase = [a for a, _ in anchors]

    def expected(i):
        k = bisect.bisect_left(abase, i)
        if k < len(anchors) and anchors[k][0] == i:
            return anchors[k][1]
        lo = anchors[k - 1][1] if k else 0
        hi = anchors[k][1] if k < len(anchors) else len(flt.lines)
        return (lo + hi) // 2

    pending = []
    for kind, bi, b, new in sorted(carried, key=lambda c: (c[1], c[0])):
        e = Entry(kind, base[bi] if kind == "=" else b, [] if kind == "x" else [new] if kind == "-" else new)
        e.s13, e.s13_lines, e.expected = bi + 1, (e.old, new), expected(bi)
        pending.append(e)
    # where the old filter's line is today: the same text, condition or a look-alike near where it would be
    place_entries(pending, flt, STAGES + ("loose",), pos_of=lambda e: e.expected)
    entries, unplaced, same = [], [], []
    for e in pending:
        if e.target is None:
            unplaced.append({"kind": e.kind, "s13_line": e.s13, "base": e.old, "theirs": e.new,
                             "candidates": candidates(e.old, flt)})
            continue
        cur = flt.lines[e.target]
        e.file, e.line = flt.place(e.target)
        if e.kind == "-":
            result, clashed = merge_line(e.old, e.new[0], cur)
            if result == cur:
                same.append({"s13_line": e.s13, "place": f"{e.file}:{e.line}", "line": cur})
                continue
            e.status = ("kept the style's look" if clashed else "applied" if cur == e.old else
                        "followed your changes")
            e.old, e.new, e.label = cur, [result], label_of(cur)
        elif e.kind == "x":
            e.status = "applied" if cur == e.old else "followed your changes"
            e.old, e.label = cur, label_of(cur)
        else:
            e.status, e.old, e.label = "applied", cur, ", ".join(label_of(n) for n in e.new)
        entries.append(e)
    entries.sort(key=lambda e: (e.target, e.kind == "="))
    review = {"dropped": [{"category": c, "s13_line": bi + 1, "base": b, "theirs": f} for c, bi, b, f in dropped],
              "unplaced": unplaced, "same": same}
    return entries, review


def label_of(line):
    name = alias_name(line)
    if name:
        return f"Alias {name}"
    head = split(line)[0]
    n = note(line)
    if n:
        return n[:60]
    return head[len("ItemDisplay["):-2][:60] if head else line[:60]


def candidates(old, flt, count=3):
    """Today's lines most like an old line that has no counterpart (the same body counts 0.3 more, the same comment
    0.2), as loose() scores them."""
    want, body, m = note(old), split(old)[1], difflib.SequenceMatcher(None, autojunk=False)
    m.set_seq2(old)
    scored = []
    for i, line in enumerate(flt.lines):
        if not line.startswith(("ItemDisplay[", "Alias[")):
            continue
        m.set_seq1(line)
        bonus = (0.3 if split(line)[1] == body else 0) + (0.2 if want and note(line) == want else 0)
        if m.real_quick_ratio() + bonus < 0.5 or m.quick_ratio() + bonus < 0.5:
            continue
        r = m.ratio() + bonus
        scored.append((r, i))
    scored.sort(reverse=True)
    return [{"place": "{}:{}".format(*flt.place(i)), "line": flt.lines[i], "score": round(r, 2)}
            for r, i in scored[:count]]


def coverage(entries, flt, base):
    """Today's rules the restyled copy never saw (not in base: no line with their text, or their condition and
    comment), in sections it restyled: the closest restyled rule's change, tried on them."""
    old = Filter(base, [("base", 0)])
    seen = lambda line: line in old.exact or (split(line)[0], note(line)) in old.rules
    edited = {e.target for e in entries if e.kind in ("-", "x")}
    by_file = defaultdict(list)
    for e in entries:
        if e.kind == "-":
            by_file[flt.file_of(e.target)].append(e)
    rows = []
    for file, group in by_file.items():
        start = flt.first[file]
        end = next((i for name, i in flt.starts if i > start), len(flt.lines))
        for i in range(start, end):
            line = flt.lines[i]
            if i in edited or not line.startswith("ItemDisplay[") or seen(line):
                continue
            body = split(line)[1]
            m = difflib.SequenceMatcher(None, autojunk=False)
            m.set_seq2(body)
            best, src = 0.6, None
            for e in group:
                m.set_seq1(split(e.old)[1])
                if m.real_quick_ratio() > best and m.quick_ratio() > best:
                    r = m.ratio()
                    if r > best:
                        best, src = r, e
            if src is None:
                continue
            result, clashed = merge_line(src.old, src.new[0], line)
            if result == line or clashed:  # a clash is a guess: the change meets words the line doesn't share
                continue
            place = "{}:{}".format(*flt.place(i))
            rows.append({"place": place, "line": line, "proposal": result,
                         "from": "{}:{}".format(src.file, src.line), "from_old": src.old, "from_new": src.new[0],
                         "score": round(best, 2)})
    return rows


def write_port(name, entries, review, flt, base, base_spec, theirs_name):
    groups, items = None, []
    items += [f"// =====================================  {name.capitalize()} style  "
              "==================================",
              "",
              f"// {name.capitalize()}: the look of {theirs_name} (a restyled copy of {base_spec}) on today's",
              "// filter. Written by: python tools/style_edits.py " + name + " --port, then reviewed.",
              "// Each entry: '@ <section file>:<line>  <name>' (where it last matched, kept up to date by the build),",
              "// then '- <the author's line>' and '+ <the style's line>' (only what the rule shows changes; its",
              "// condition and comment stay the author's), '= <anchor line>' and '+ <lines inserted after it>',",
              "// or 'x <a rule the style switches off>'. See tools/style_edits.py.",
              ""]
    for e in entries:
        if flt.file_of(e.target) != groups:
            groups = flt.file_of(e.target)
            if items[-1] != "":
                items.append("")
            items.append(f"// == {groups} ==")
        items.append(e)
    path = STYLES / f"{name}.edits"
    path.write_bytes(serialize(items).encode("utf-8"))
    review_path = Path(str(REVIEW_FILE).format(name))
    review_path.parent.mkdir(parents=True, exist_ok=True)
    review["entries"] = [{"place": f"{e.file}:{e.line}", "kind": e.kind, "label": e.label, "status": e.status,
                          "how": e.how, "s13_line": e.s13, "s13_base": e.s13_lines[0], "s13_theirs": e.s13_lines[1],
                          "old": e.old, "new": e.new,
                          "changes": (kinds(split(e.old)[1], split(e.new[0])[1]) if e.kind == "-" else
                                      ["switched off"] if e.kind == "x" else ["added"])}
                         for e in entries]
    review["coverage"] = coverage(entries, flt, base)
    review_path.write_text(json.dumps(review, indent=1, ensure_ascii=False), encoding="utf-8")
    return path, review_path


# ---------------------------------------------------------------- self-test

def selftest():
    ok = True

    def expect(what, got, want):
        nonlocal ok
        if got != want:
            ok = False
            print(f"FAIL {what}:\n  got  {got!r}\n  want {want!r}")

    rune = "ItemDisplay[(r01s OR r01)]:%WHITE%El Rune%CONTINUE%//"
    style = "ItemDisplay[(r01s OR r01)]:%LIGHT_GRAY%El Rune%CONTINUE%//"
    expect("unchanged line", merge_line(rune, style, rune), (style, False))
    expect("author's condition kept",
           merge_line(rune, style, rune.replace("(r01s OR r01)", "(r01s OR r01) FILTLVL<9")),
           (style.replace("(r01s OR r01)", "(r01s OR r01) FILTLVL<9"), False))
    expect("author's new icon kept",
           merge_line(rune, style, rune.replace("%CONTINUE%", "%MAP-20%%CONTINUE%")),
           (style.replace("%CONTINUE%", "%MAP-20%%CONTINUE%"), False))
    expect("same words changed: the style's look",
           merge_line(rune, style, rune.replace("%WHITE%", "%TAN%")), (style, True))
    expect("author's comment kept",
           merge_line(rune, style, rune + " El"), (style + " El", False))
    sound = "ItemDisplay[UNI !ID ci2]:%NAME%%SOUNDID-2585%%CONTINUE%// Kira's Guardian Tiara"
    quiet = "ItemDisplay[UNI !ID ci2]:%NAME%%CONTINUE%// Kira's Guardian Tiara"
    expect("a removed sound the author changed: removed",
           merge_line(sound, quiet, sound.replace("2585", "2594")), (quiet, True))
    expect("a removed sound and the author's new icon",
           merge_line(sound, quiet, sound.replace("%CONTINUE%", "%DOT-62%%CONTINUE%")),
           (quiet.replace("%CONTINUE%", "%DOT-62%%CONTINUE%"), False))
    expect("sound-only rule", sound_only(split("ItemDisplay[x]:%NAME%{%NAME%}%SOUNDID-31%%CONTINUE%//")[1]), True)
    expect("not sound-only", sound_only(split("ItemDisplay[x]:%NAME%%MAP-20%%SOUNDID-31%//")[1]), False)
    expect("condition words", condition_words("ItemDisplay[t34 !(STAT360>0 OR x) !STAT276>0]:%NAME%//"),
           {"t34", "!", "STAT360>0", "OR", "x", "!STAT276>0"})

    # entries against a small filter: exact, moved, condition changed, look-alike, gone, insert, switched off
    notify = "ItemDisplay[RUNE<8 FILTLVL<12]:%NAME%{%NAME%}%MAP-75%// Notify for runes El-Tal"
    lines = ["// head", rune, "ItemDisplay[(r02s OR r02)]:%WHITE%Eld Rune%CONTINUE%//", "Alias[VIAL]:x",
             "ItemDisplay[lsvl]:%VIAL%  %WHITE%Vial  %VIAL%%BORDER-21%//", sound,
             notify.replace("%MAP-75%", "%MAP-77%"),
             "ItemDisplay[t34 !STAT360>0]:%NAME%{%GOLD%50%%NAME%}%CONTINUE%// Phys",
             "ItemDisplay[t34]:%NAME%{%CL%Monster Immunities:%CL%%NAME%}%CONTINUE%//",
             "ItemDisplay[t22 !STAT360>0 !STAT276>0]:%NAME%{%GOLD%75%%NAME%}%CONTINUE%// Phys",
             "ItemDisplay[]:%NAME%//"]
    starts = [("010-a.filter", 0), ("020-b.filter", 3), ("140-c.filter", 7), ("370-d.filter", 10)]
    text = "\r\n".join([
        "// test",
        "@ 010-a.filter:2  El", f"- {rune}", f"+ {style}",
        "@ 010-a.filter:3  Eld", "- ItemDisplay[(r02s OR r02)]:%WHITE%Eld Rune%CONTINUE%//",
        "+ ItemDisplay[(r02s OR r02)]:%TAN%Eld Rune%CONTINUE%//",
        "@ 020-b.filter:1  VIALX", "= Alias[VIAL]:x", "+ Alias[VIALX]:y",
        "@ 020-b.filter:2  Vial", "- ItemDisplay[lsvl]:%VIAL%  %WHITE%Vial  %VIAL%%BORDER-00%//",
        "+ ItemDisplay[lsvl]:%VIALX%  %GREEN%Vial  %VIAL%%BORDER-00%//",
        "@ 020-b.filter:3  Kira's Guardian Tiara",
        "- ItemDisplay[UNI !ID ci2 FILTLVL<8]:%NAME%%SOUNDID-2585%%CONTINUE%// Kira's Guardian Tiara",
        "+ ItemDisplay[UNI !ID ci2 FILTLVL<8]:%NAME%%CONTINUE%// Kira's Guardian Tiara",
        "@ 020-b.filter:9  gone", "- ItemDisplay[zzz]:%WHITE%Gone%CONTINUE%// Gone",
        "+ ItemDisplay[zzz]:%RED%Gone%CONTINUE%// Gone",
        "@ 020-b.filter:4  Notify for runes El-Tal", f"x {notify}",
        "@ 140-c.filter  Highest Resistances", "* !STAT360>0",
        "@ 140-c.filter  nothing like it", "* !STAT999>0", ""])
    items = parse(text, "test.edits")
    moved = [lines[0], lines[2], lines[1]] + lines[3:]  # El and Eld swapped
    origin = []
    out = apply(items, Filter(moved, starts), origin)
    entries = [e for e in items if isinstance(e, Entry)]
    expect("statuses", [e.status for e in entries],
           ["applied", "applied", "applied", "followed your changes", "followed your changes", "not placed",
            "followed your changes", "applied", "not placed"])
    expect("styled lines", out, ["// head", "ItemDisplay[(r02s OR r02)]:%TAN%Eld Rune%CONTINUE%//", style,
                                 "Alias[VIAL]:x", "Alias[VIALX]:y",
                                 "ItemDisplay[lsvl]:%VIALX%  %GREEN%Vial  %VIAL%%BORDER-21%//", quiet,
                                 "//" + notify.replace("%MAP-75%", "%MAP-77%"), "//" + lines[7], lines[8],
                                 "//" + lines[9], "ItemDisplay[]:%NAME%//"])
    expect("origin", [o if isinstance(o, int) else ("insert", o[1]) for o in origin],
           [0, 1, 2, 3, ("insert", 3), 4, 5, 6, 7, 8, 9, 10])
    expect("rules switched off", sorted(switched_off(entries)), [6, 7, 9])
    expect("refreshed places", [e.hint() for e in entries][:5] + [e.hint() for e in entries][6:8],
           ["@ 010-a.filter:3  El", "@ 010-a.filter:2  Eld", "@ 020-b.filter:1  VIALX", "@ 020-b.filter:2  Vial",
            "@ 020-b.filter:3  Kira's Guardian Tiara", "@ 020-b.filter:4  Notify for runes El-Tal",
            "@ 140-c.filter  Highest Resistances"])
    again = parse(serialize(items), "test.edits")
    expect("applying the refreshed entries again", apply(again, Filter(moved, starts)), out)
    expect("nothing left to refresh", serialize(again), serialize(items))

    # a rule whose condition the author changed is never taken for another rule with its old condition
    recipe = "ItemDisplay[(r01)]:%NAME%{%TAN%Cube %WHITE%El Rune %TAN%x %WHITE%3 %TAN%= %WHITE%Eld Rune}%CONTINUE%//"
    el = ["ItemDisplay[(r01) !SHOP]:%WHITE%El Rune%CONTINUE%//", recipe]
    one = parse("\r\n".join(["@ 010-a.filter:1  El", "- ItemDisplay[(r01)]:%WHITE%El Rune%CONTINUE%//",
                             "+ ItemDisplay[(r01)]:%LIGHT_GRAY%El Rune%CONTINUE%//", ""]), "test.edits")
    expect("the rule, not the one with its old condition", apply(one, Filter(el, [("010-a.filter", 0)])),
           ["ItemDisplay[(r01) !SHOP]:%LIGHT_GRAY%El Rune%CONTINUE%//", recipe])

    # the import: a copy restyled from base, ported onto base itself, gives the copy's look back
    base = ["// head", "Alias[VIAL]:x", rune, "ItemDisplay[!POE_SOUNDS r20]:%NAME%{%NAME%}%SOUNDID-31%%CONTINUE%//",
            "ItemDisplay[RUNE<8]:%NAME%%MAP-75%//", "ItemDisplay[GEM FILTLVL<8]:%WHITE%Gem%CONTINUE%//",
            "ItemDisplay[lsvl]:%VIAL%  %WHITE%Vial  %VIAL%//", "ItemDisplay[]:%NAME%//"]
    theirs = ["// head", "//Alias[VIAL]:x", "Alias[VIALX]:y", style,
              "//ItemDisplay[!POE_SOUNDS r20]:%NAME%{%NAME%}%SOUNDID-31%%CONTINUE%//",
              "//ItemDisplay[RUNE<8]:%NAME%%MAP-75%//", "ItemDisplay[GEM FILTLVL<3]:%TAN%Gem%CONTINUE%//",
              "ItemDisplay[lsvl]:%VIALX%  %GREEN%Vial  %VIAL%//",
              "//ItemDisplay[lsvl]:%VIAL%  %WHITE%Vial  %VIAL%//", "ItemDisplay[]:%NAME%//"]
    entries, review = port(base, theirs, Filter(base, [("010-a.filter", 0)]))
    expect("ported entries", [(e.kind, e.new) for e in entries],
           [("=", ["Alias[VIALX]:y"]), ("-", [style]),
            ("-", ["ItemDisplay[!POE_SOUNDS r20]:%NAME%{%NAME%}%CONTINUE%//"]), ("x", []),
            ("-", ["ItemDisplay[GEM FILTLVL<8]:%TAN%Gem%CONTINUE%//"]),
            ("-", ["ItemDisplay[lsvl]:%VIALX%  %GREEN%Vial  %VIAL%//"])])
    expect("dropped", sorted(d["category"] for d in review["dropped"]),
           ["alias switched off", "condition (filtering)"])
    print("selftest passed" if ok else "selftest FAILED")
    return ok


# ---------------------------------------------------------------- main

def variant_for(name, given):
    if given:
        return given
    for base, style_file in build.STYLE_VARIANTS.values():
        if Path(style_file).suffix == ".edits" and Path(style_file).stem == name:
            return base
    fail(f"no style variant uses styles/{name}.edits (tools/build.py STYLE_VARIANTS): pass --variant NAME")


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="A style variant's own lines on top of a variant's filter.")
    ap.add_argument("style", nargs="?", help="the style's name: styles/<name>.edits")
    ap.add_argument("--variant", help="the variant the style starts from (a toggle block's name)")
    ap.add_argument("--report", action="store_true", help="each entry's status")
    ap.add_argument("--all", action="store_true", help="with --report: also the entries applied as they are")
    ap.add_argument("--diff", action="store_true", help="each line the style changes")
    ap.add_argument("--out", help="write the styled filter to this file")
    ap.add_argument("--port", action="store_true", help="write styles/<name>.edits from a restyled copy")
    ap.add_argument("--base", help="with --port: REV:FILE, the filter the copy started from")
    ap.add_argument("--theirs", help="with --port: the restyled copy")
    ap.add_argument("--selftest", action="store_true", help="check the merge and the import")
    args = ap.parse_args()

    if args.selftest:
        sys.exit(0 if selftest() else 1)
    if not args.style:
        ap.error("name a style (e.g. corrlorized), or --selftest")
    variant = variant_for(args.style, args.variant)

    if args.port:
        if not (args.base and args.theirs):
            ap.error("--port needs --base REV:FILE and --theirs FILE")
        lines, starts = load_variant(variant)
        flt = Filter(lines, starts)
        base = git_file(args.base)
        theirs = Path(args.theirs).read_bytes().decode("utf-8").split("\r\n")
        entries, review = port(base, theirs, flt)
        path, review_path = write_port(args.style, entries, review, flt, base, args.base, Path(args.theirs).name)
        c = Counter(e.status for e in entries)
        print(f"Wrote {path.relative_to(ROOT)}: {len(entries)} entries "
              f"({', '.join(f'{n} {s}' for s, n in c.most_common())}).")
        d = Counter(r["category"] for r in review["dropped"])
        print(f"Not carried over: {', '.join(f'{n} {s}' for s, n in d.most_common())}; "
              f"{len(review['unplaced'])} with no line today.")
        print(f"Coverage: {len(review['coverage'])} of today's rules next to restyled ones have no edit.")
        print(f"Review data: {review_path.relative_to(ROOT)}")
        return

    items, out, flt = run(args.style, variant)
    entries = [e for e in items if isinstance(e, Entry)]
    if args.out:
        Path(args.out).write_bytes("\r\n".join(out).encode("utf-8"))
        print(f"Wrote {args.out}")
    if args.report:
        for e in entries:
            if e.status == "applied" and not args.all:
                continue
            extra = f"{len(e.lines)} rules" if e.kind == "*" else e.how or "-"
            print(f"{e.status:22} {e.kind} {e.hint()[2:]}  ({extra})")
    if args.diff:
        for e in entries:
            if e.kind == "*":
                print(e.hint())
                for i in e.lines:
                    print(f"x {flt.lines[i]}")
                continue
            if e.target is None:
                continue
            print(e.hint())
            print(f"  {flt.lines[e.target]}")
            for n in ([e.result] if e.kind in ("-", "x") else e.new):
                print(f"+ {n}")
    print(f"{args.style}: {summary(entries)}")


if __name__ == "__main__":
    main()
