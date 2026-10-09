#!/usr/bin/env python3
"""
Lint the Erazure filter.

Reads sections/ exactly as build.py does (joined, that text IS Erazure-Main.filter) and reports
each problem as sections/<file>:<line>.

What counts as valid comes from the PD2 BH source (github.com/Project-Diablo-2/BH,
BH/Modules/Item/ItemDisplay.cpp, commit caa2b93 of 2026-10-02): its condition_map, ReplacementMap,
formulaVarDefs and the way it parses aliases, notification keywords and descriptions. The wiki is
not always up to date; BH is what the game runs. Item codes come from docs/pd2-item-codes.wiki,
docs/pd2-item-filtering.wiki and "Item Code: xxx" lines in docs/patch-notes/.
Re-check the BH tables below at each season start (HANDOFF.md, Phase 4).

Usage (from the repo root):
    python tools/lint_filter.py                   report; exit 1 on any error/warning not allow-listed
    python tools/lint_filter.py --all             also list allow-listed findings and info notes
    python tools/lint_filter.py --customization   also lint the commented-out rules in 050-customization
                                                  as if a player had uncommented them

Checks (the id in [brackets] is what tools/lint_allow.txt refers to):
    syntax          ItemDisplay line without "]:", unbalanced ( ), more than one { } pair (BH only
                    reads the first), a line that is neither blank, a // comment, nor a statement
    keyword         %KEYWORD% that BH does not know (it is shown as text, minus its first %)
    notify          the same notification keyword twice in one rule (BH reads only the first, the
                    second is shown as text), %TIER-n% other than 0-9 (BH reads one digit)
    condition       condition code BH does not know (uppercase), or formula variable it does not know
    precedence      AND after OR inside the same brackets: BH gives AND and OR equal precedence
                    and reads left to right, so 'A OR B C' is '(A OR B) AND C'
    item-code       lowercase item code not in docs/ (BH accepts it, but it matches nothing if wrong)
    continue-desc   %CONTINUE% inside { } (shown as text there; it only works outside the braces)
    name-length     a rule's own text already exceeds what BH shows: 56 visible name characters
                    (512 for SHOP rules), 511 in all with color codes
    desc-length     a rule's own text already exceeds about 500 description characters
    alias           alias whose value contains its own name (BH loops forever), alias name inside
                    another condition word (BH replaces substrings), alias defined twice, never used
    duplicate       exact duplicate rule
    unreachable     same conditions as an earlier rule without %CONTINUE%: its display part never
                    applies (its notification keywords still fire, they run in a separate pass)
    tier            (info) notification without %TIER-n% in a section that sets TIER elsewhere
    tag-order       300-affix-tags and 305-runeword-rolls: a tag line whose tag would show on the wrong side of
                    another stat's tag (the game lists stats by PD2's descpriority; python tools/tag_order.py
                    --fix re-sorts 300, python tools/gen_runeword_rolls.py regenerates 305)
    rw-tag          300-affix-tags: a tag line that can also match a runeword. 305-runeword-rolls tags runewords'
                    rolls in the game's order, so such a tag would come out of that order, or twice

Lengths are lower bounds: %NAME% and other value references count as 0 characters, because
their real length depends on the item and on earlier %CONTINUE% layers.

tools/lint_allow.txt holds accepted findings, one per line: "<check> <key>", where key is the
token (keyword / condition / item-code / alias checks) or the full rule line (other checks).
Text after " #" is a comment.
"""
import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.dont_write_bytecode = True  # no tools/__pycache__ from importing build
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402  (reuses its section reading and line locator)

ROOT = build.ROOT
DOCS = ROOT / "docs"
ALLOW_FILE = ROOT / "tools" / "lint_allow.txt"
CUSTOMIZATION = "050-customization.filter"

# ---------------------------------------------------------------- BH tables (ItemDisplay.cpp)

# condition_map keys. Also valid: SK/OS/CHSK/CLSK/TABSK/STAT/CHARSTAT + number, MULTI<n>,<n>,
# sums with +, and any word of 3+ characters whose first 3 are not uppercase (an item code).
BH_CONDITIONS = set("""
AND && OR || TRUE FALSE ETH SOCK SOCKETS SET MAG RARE UNI AMAZON SORCERESS NECROMANCER PALADIN
BARBARIAN DRUID ASSASSIN CRAFTALVL REROLLALVL PREFIX SUFFIX AUTOMOD MAPID MAPTIER CRAFT RW NMAG
SUP INF NORM EXC ELT CLASS ID ILVL QLVL ALVL CLVL FILTLVL DIFF RUNE GOLD GEMMED GEMTYPE GEM
GEMLEVEL ED EDEF EDAM DEF MAXDUR RES FRES CRES LRES PRES IAS FCR FHR FBR LIFE MANA QTY GOODSK
GOODTBSK FOOLS LVLREQ ARPER MFIND GFIND STR DEX FRW MINDMG MAXDMG AR DTM MAEK REPLIFE REPQUANT
REPAIR ARMOR BELT CHEST HELM SHIELD GLOVES BOOTS CIRC DRU BAR DIN NEC SIN SOR ZON MISC JEWELRY
CHARM QUIVER SHOP EQUIPPED MERC CUBE INVENTORY STASH GROUND 1H 2H AXE MACE CLUB TMACE HAMMER
SWORD DAGGER THROWING JAV SPEAR POLEARM BOW XBOW STAFF WAND SCEPTER EQ1 EQ2 EQ3 EQ4 EQ5 EQ6 EQ7
CL1 CL2 CL3 CL4 CL5 CL6 CL7 WEAPON WP1 WP2 WP3 WP4 WP5 WP6 WP7 WP8 WP9 WP10 WP11 WP12 WP13 ALLSK
BUYPRICE SELLPRICE PRICE REQSTR REQDEX REQLVL BASEMINONEH BASEMINTWOH BASEMINTHROW BASEMINKICK
BASEMINSMITE BASEMAXONEH BASEMAXTWOH BASEMAXTHROW BASEMAXKICK BASEMAXSMITE BASEBLOCK ALLATTRIB
MAXRES UPSTR UPDEX UPLVL MAXSOCKETS WIDTH HEIGHT AREA ANYDISCOVERED ALLDISCOVERED ANYOWNED ALLOWNED
""".split())
COND_PREFIX_RE = re.compile(r"^(SK|OS|CHSK|CLSK|TABSK|STAT|CHARSTAT)\d+$|^MULTI\d+,\d+$")

# ReplacementMap: output keywords with no number, and those that take 1 or 2 numbers.
BH_COLORS = set("""
WHITE RED GREEN BLUE GOLD GRAY BLACK TAN ORANGE YELLOW PURPLE DARK_GREEN CORAL SAGE TEAL LIGHT_GRAY
FULL_TRANS THREE_FOURTHS_TRANS HALF_TRANS QUARTER_TRANS
""".split())
BH_KEYWORDS = BH_COLORS | set("""
NAME BASENAME SOCKETS RUNENUM RUNENAME GEMLEVEL GEMTYPE ILVL ALVL CRAFTALVL REROLLALVL LVLREQ
WPNSPD RANGE CODE LBRACE RBRACE PERCENT BUYPRICE SELLPRICE PRICE QTY RES ED CS CL NL REQSTR REQDEX
REQLVL BASEMINONEH BASEMAXONEH BASEMINTWOH BASEMAXTWOH BASEMINTHROW BASEMAXTHROW BASEMINKICK
BASEMAXKICK BASEMINSMITE BASEMAXSMITE BASEBLOCK ALLATTRIB MAXRES UPSTR UPDEX UPLVL MAXSOCKETS
MINDMG MAXDMG EDEF EDAM DEF FRES CRES LRES PRES IAS FCR FHR FBR LIFE MANA ARPER MFIND GFIND STR
DEX FRW AR DTM MAEK REPLIFE REPQUANT REPAIR
""".split())
BH_KEYWORD_PARAMS = {"STAT": 1, "SK": 1, "OS": 1, "CLSK": 1, "TABSK": 1, "CHARSTAT": 1, "MULTI": 2}
ONE_CHAR_KEYWORDS = {"PERCENT", "LBRACE", "RBRACE"}  # display as % { }
# BuildReplacementActions' regex
REPLACEMENT_RE = re.compile(r"%([A-Z_]+)(?:(\d{1,9})(?:,(\d{1,9}))?)?%")

# Parsed out of the output before keyword replacement, first match only (case-insensitive).
NOTIFY_PATTERNS = {
    "BORDER": r"%BORDER-[a-f0-9]{1,4}%", "MAP": r"%MAP-[a-f0-9]{1,4}%",
    "DOT": r"%DOT-[a-f0-9]{1,4}%", "PX": r"%PX-[a-f0-9]{1,4}%", "LINE": r"%LINE-[a-f0-9]{1,4}%",
    "NOTIFY": r"%NOTIFY-[a-f0-9]{1,4}%", "TIER": r"%TIER-[0-9]%", "SOUNDID": r"%SOUNDID-[0-9]{1,4}%",
}
NOTIFY_ANY_RE = re.compile(r"%(BORDER|MAP|DOT|PX|LINE|NOTIFY|TIER|SOUNDID)-[^%]*%", re.I)
MAP_KEYWORDS = ("BORDER", "MAP", "DOT", "PX", "LINE")

# formulaVarDefs (case-insensitive) and the formula functions (docs/pd2-formula-info.wiki).
FORMULA_VARS = set("""
alvl amazon ar armor arper assassin automod axe bar barbarian belt boots bow buyprice charm chest
circ class club clvl craft craftalvl cres cube dagger def dex diff din dru druid dtm ed edam edef
elt equipped eth exc false fbr fcr fhr filtlvl fools fres frw gem gemlevel gemmed gemtype gfind
gloves gold ground hammer helm ias id ilvl inf inventory jav jewelry life lres lvlreq mace maek mag
mana mapid maptier maxdmg maxdur merc mfind mindmg misc nec necromancer nmag norm paladin polearm
pres price qlvl qty quiver rare repair replife repquant rerollalvl res rune rw scepter sellprice set
shield shop sin sock sockets sor sorceress spear staff stash str sup sword throwing tmace true uni
wand weapon xbow zon width height area maxsockets uplvl upstr updex maxres allattrib baseblock
baseminoneh basemintwoh baseminsmite baseminkick baseminthrow basemaxoneh basemaxtwoh basemaxsmite
basemaxkick basemaxthrow reqlvl reqstr reqdex onehand twohand allsk
""".split())
FORMULA_PREFIX_RE = re.compile(r"^(stat|charstat|chsk|clsk|os|sk|tabsk|eq|cl|wp)\d+$|^multi\d+,\d+$", re.I)
FUNCTIONS = {"if", "and", "or", "exp", "ln", "floor", "ceil", "round", "min", "max", "mod",
             "average", "sqrt", "pow", "count", "countif", "xor", "abs", "sign"}

# BH/Constants.h: MAX_ITEM_NAME_SIZE 56, MAX_ITEM_TEXT_SIZE 512 (shop names; hard cap 511).
# Descriptions are cut at 512 minus the item's own text, so DESC_MAX is an estimate (the wiki's 500).
NAME_DISPLAY_MAX, NAME_SHOP_MAX, TEXT_MAX, DESC_MAX = 56, 512, 511, 500
SHOP_RE = re.compile(r"(?<![!\w])SHOP\b")

STATEMENT_RE = re.compile(r"^(ItemDisplay|ItemDisplayFilterName|Alias|Formula)\[")
ALIAS_DEF_RE = re.compile(r"^Alias\[([^\]]+)\]:(.*)$")
WORD_RE = re.compile(r"MULTI\d+,\d+|[A-Za-z0-9_$&|]+")
FORMULA_RE = re.compile(r"\$f\(")


# ---------------------------------------------------------------- reference data

def wiki_cells(path):
    """Every table cell of a wiki file, HTML tags and <br> splits removed."""
    cells = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|") or line.startswith(("|-", "|}", "|+")):
            continue
        for cell in line.lstrip("|").split("||"):
            cell = re.sub(r'^\s*(\w+="[^"]*"\s*)+\|', "", cell)  # rowspan="2" | ci3
            for part in re.split(r"<br\s*/?>", cell):
                cells.append(re.sub(r"<[^>]+>", "", part).strip())
    return cells


def load_item_codes():
    cells = wiki_cells(DOCS / "pd2-item-codes.wiki") + wiki_cells(DOCS / "pd2-item-filtering.wiki")
    items = {c for c in cells if re.fullmatch(r"[a-z0-9]{2,5}", c) and re.search("[a-z]", c)}
    for notes in (DOCS / "patch-notes").glob("*.wiki"):  # newer than the wiki pages
        items |= set(re.findall(r"Item Code:\s*([a-z0-9]{2,5})\b", notes.read_text(encoding="utf-8")))
    return items


# ---------------------------------------------------------------- output parsing (as BH does it)

def strip_comment(output):
    i = output.find("//")
    return output if i < 0 else output[:i]


def expand_output_aliases(output, aliases):
    """BH replaces %NAME% of each alias (name uppercased), in definition order."""
    for name, value in aliases.items():
        output = output.replace(f"%{name.upper()}%", value)
    return output


def split_output(output):
    """(name, description, notification keywords found, extra copies shown as text), like BH."""
    found, extra = [], []
    for key, pattern in NOTIFY_PATTERNS.items():
        rx = re.compile(pattern, re.I)
        m = rx.search(output)
        if m:
            found.append(key)
            output = output[:m.start()] + output[m.end():]
            extra += [f"{x.group(0)}" for x in rx.finditer(output)]
    desc = ""
    l, r = output.find("{"), output.find("}")
    if l >= 0 and r >= 0 and l < r:
        desc = output[l + 1:r]
        output = output[:l] + output[r + 1:]
    if "%MAP%" in output:  # legacy keyword
        output = output.replace("%MAP%", "", 1)
        found.append("MAP")
    return output.replace("%CONTINUE%", "", 1), desc, found, extra


def replacements(text):
    """Walk text like BH's BuildReplacementActions: return (keywords used, unknown, literal text)."""
    used, unknown, literal, i = [], [], [], 0
    while i < len(text):
        m = REPLACEMENT_RE.search(text, i)
        if not m:
            break
        literal.append(text[i:m.start()])
        name, p1, p2 = m.groups()
        params = (p1 is not None) + (p2 is not None)
        if name in BH_KEYWORDS or name in BH_KEYWORD_PARAMS:
            if params == (0 if name in BH_KEYWORDS else BH_KEYWORD_PARAMS[name]):
                used.append(name)
                if name in ONE_CHAR_KEYWORDS:
                    literal.append("%")
            else:
                unknown.append(m.group(0))  # wrong number count: BH shows it as text
                literal.append(m.group(0))
            i = m.end()
        else:
            unknown.append(m.group(0))  # BH shows the first %, then retries from the second
            literal.append("%")
            i = m.end() - 1
    literal.append(text[i:])
    return used, unknown, "".join(literal)


# ---------------------------------------------------------------- the linter

class Rule:
    __slots__ = ("idx", "line", "cond", "output", "commented")

    def __init__(self, idx, line, cond, output, commented=False):
        self.idx, self.line, self.cond, self.output, self.commented = idx, line, cond, output, commented


class Linter:
    def __init__(self, lines, where, customization):
        self.lines, self.where, self.customization = lines, where, customization
        self.items = load_item_codes()
        self.findings = []
        self.rules, self.aliases, self.alias_lines = [], {}, defaultdict(list)
        self.parse()

    def report(self, idx, severity, check, message, key):
        self.findings.append((idx, severity, check, message, key))

    # -------------------------------- parse

    def parse(self):
        prefix = f"sections/{CUSTOMIZATION}:"
        for idx, line in enumerate(self.lines):
            text, commented = line.rstrip(), False
            if (self.customization and text.startswith("//ItemDisplay[")
                    and self.where(idx).startswith(prefix)):
                text, commented = text[2:], True
            if not text.strip() or text.startswith("//"):
                continue
            if not STATEMENT_RE.match(text):
                self.report(idx, "error", "syntax",
                            "neither a comment nor a filter statement (the game ignores this line)", text)
                continue
            a = ALIAS_DEF_RE.match(text)
            if a:
                name = a.group(1).strip().split(" ")[0]  # BH: aliases are single words
                self.alias_lines[name].append(idx)
                self.aliases[name] = a.group(2).strip()
                continue
            if not text.startswith("ItemDisplay["):
                continue
            close = text.find("]:")
            if close < 0:
                self.report(idx, "error", "syntax", 'ItemDisplay line without "]:"', text)
                continue
            self.rules.append(Rule(idx, text, text[len("ItemDisplay["):close],
                                   strip_comment(text[close + 2:]), commented))

    # -------------------------------- checks

    def run(self):
        self.check_aliases()
        for r in self.rules:
            self.check_condition(r)
            self.check_output(r)
        self.check_order()
        self.check_tiers()
        self.check_tag_order()
        self.check_runeword_tags()
        return self.findings

    def check_aliases(self):
        words = set()
        for r in self.rules:
            words.update(WORD_RE.findall(r.cond))
        used = set(words)
        for r in self.rules:
            used.update(n for n in self.aliases if f"%{n.upper()}%" in r.output)
        for name, idxs in self.alias_lines.items():
            for idx in idxs[1:]:
                self.report(idx, "warning", "alias",
                            f"Alias[{name}] is defined again (first at {self.where(idxs[0])})", name)
            if name in self.aliases[name]:
                self.report(idxs[0], "error", "alias",
                            f"Alias[{name}] contains its own name: BH replaces it forever (game hangs)", name)
            if "//" in self.aliases[name]:
                self.report(idxs[0], "warning", "alias",
                            f"Alias[{name}] contains // (may be cut off as a comment)", name)
            clash = sorted(w for w in words if name in w and w != name)
            if clash:
                self.report(idxs[0], "warning", "alias",
                            f"Alias[{name}] is part of the condition word(s) {', '.join(clash[:5])}: "
                            "BH replaces substrings, so those words get changed too", name)
            if name not in used:
                self.report(idxs[0], "info", "alias", f"Alias[{name}] is never used", name)

    def check_condition(self, r):
        if not balanced(r.cond, "(", ")"):
            self.report(r.idx, "error", "syntax", "unbalanced ( ) in conditions", r.line)
        elif and_after_or(bh_tokens(r.cond)):
            self.report(r.idx, "warning", "precedence",
                        "AND after OR in the same brackets: BH reads AND/OR left to right, so "
                        "'A OR B C' means '(A OR B) AND C'. Add brackets for the grouping you mean",
                        r.line)
        formula_spans = formula_ranges(r.cond)
        for m in WORD_RE.finditer(r.cond):
            word = m.group(0)
            if word.isdigit() or word == "$f" or word in self.aliases:
                continue
            if any(a <= m.start() < b for a, b in formula_spans):
                if not (word.lower() in FORMULA_VARS or word.lower() in FUNCTIONS
                        or FORMULA_PREFIX_RE.match(word) or word in self.aliases):
                    self.report(r.idx, "error", "condition",
                                f"unknown formula variable '{word}'", word)
                continue
            self.check_condition_word(r, word)

    def check_condition_word(self, r, word):
        if word in BH_CONDITIONS or COND_PREFIX_RE.match(word):
            return
        if len(word) >= 3 and not any(c.isupper() for c in word[:3]):
            if word not in self.items:
                self.report(r.idx, "warning", "item-code",
                            f"item code '{word}' is not in docs/ (matches nothing if it is wrong)", word)
            return
        self.report(r.idx, "error", "condition", f"unknown condition code '{word}'", word)

    def check_output(self, r):
        out = expand_output_aliases(r.output, self.aliases)
        if out.count("{") > 1 or out.count("}") > 1:
            self.report(r.idx, "error", "syntax",
                        "more than one { or }: BH only reads the first { } pair", r.line)
        name, desc, _, extra = split_output(out)
        for tok in dict.fromkeys(extra):
            self.report(r.idx, "error", "notify",
                        f"{tok}: second keyword of this kind in the rule, BH shows it as text", tok)
        for m in NOTIFY_ANY_RE.finditer(name + desc):
            if m.group(0) in extra:
                continue
            self.report(r.idx, "error", "notify", f"{m.group(0)}: invalid value, BH shows it as text",
                        m.group(0))
        if "%CONTINUE%" in desc:
            self.report(r.idx, "error", "continue-desc",
                        "%CONTINUE% inside { } is shown as text there", r.line)

        name = name.strip(" ").strip("\t")
        used, unknown, literal = replacements(name)
        d_used, d_unknown, d_literal = replacements(desc)
        for tok in dict.fromkeys(unknown + d_unknown):
            if tok != "%CONTINUE%":
                self.report(r.idx, "error", "keyword", f"unknown keyword {tok} (shown as text)", tok)
        for m in re.finditer(r"%([A-Za-z_]+)%", name + desc):  # BH only reads uppercase keywords
            word = m.group(1)
            if word != word.upper() and word.upper() in BH_KEYWORDS:
                self.report(r.idx, "error", "keyword",
                            f"{m.group(0)} is shown as text: keywords must be uppercase", m.group(0))

        # BH TrimItemText: visible name characters (%NL% is one) are cut at 56, or 512 in shops;
        # everything, color codes (3 each) included, at 511.
        shown = len(literal) + used.count("NL")
        total = shown + 3 * sum(u in BH_COLORS for u in used)
        limit = NAME_SHOP_MAX if SHOP_RE.search(r.cond) else NAME_DISPLAY_MAX
        if shown > limit or total > TEXT_MAX:
            self.report(r.idx, "warning", "name-length",
                        f"name is at least {shown} visible / {total} total characters "
                        f"(BH cuts at {limit} / {TEXT_MAX})", r.line)
        d_total = len(d_literal) + d_used.count("NL") + 3 * sum(u in BH_COLORS for u in d_used)
        if d_total > DESC_MAX:
            self.report(r.idx, "warning", "desc-length",
                        f"description is at least {d_total} characters (BH ends it with ... "
                        f"past about {DESC_MAX})", r.line)

    def check_order(self):
        seen_line, stopper = {}, {}
        for r in self.rules:
            if r.commented:
                continue
            cond = normalize_cond(r.cond)
            if r.line in seen_line:
                self.report(r.idx, "warning", "duplicate",
                            f"exact duplicate of {self.where(seen_line[r.line])}", r.line)
            elif cond in stopper:
                self.report(r.idx, "warning", "unreachable",
                            f"never displays: {self.where(stopper[cond])} has the same conditions "
                            "and no %CONTINUE%", r.line)
            seen_line.setdefault(r.line, r.idx)
            if "%CONTINUE%" not in r.output and cond not in stopper:
                stopper[cond] = r.idx

    def check_tiers(self):
        by_section = defaultdict(list)
        for r in self.rules:
            out = expand_output_aliases(r.output, self.aliases)
            if not r.commented and any(k in MAP_KEYWORDS for k in split_output(out)[2]):
                by_section[self.where(r.idx).rsplit(":", 1)[0]].append((r, "%TIER-" in out.upper()))
        for rules in by_section.values():
            if any(has_tier for _, has_tier in rules):
                for r, has_tier in rules:
                    if not has_tier:
                        self.report(r.idx, "info", "tier",
                                    "notification without %TIER-n% (notifies at every level)", r.line)

    def check_tag_order(self):
        import tag_order  # the affix and runeword tags must follow the game's stat order (tools/tag_order.py)
        for name in tag_order.FIX_HINTS:
            prefix = name + ":"
            idx_of = {}
            for idx in range(len(self.lines)):
                loc = self.where(idx)
                if loc.startswith(prefix):
                    idx_of[int(loc[len(prefix):])] = idx
            if not idx_of:
                continue
            lines = [self.lines[idx_of[n]] for n in sorted(idx_of)]
            for n, severity, message, key in tag_order.check(lines, tag_order.FIX_HINTS[name]):
                self.report(idx_of[n], severity, "tag-order", message, key)

    def check_runeword_tags(self):
        """A 300 tag line that can match a runeword (evaluated for 'some runeword': see runeword_atom)."""
        import explain_item
        import tag_order
        prefix = tag_order.SECTION_NAME + ":"
        for r in self.rules:
            if r.commented or not self.where(r.idx).startswith(prefix):
                continue
            if not tag_order.tag_text(split_output(expand_output_aliases(r.output, self.aliases))[0]):
                continue
            cond = explain_item.expand_condition(r.cond, self.aliases)
            if any(explain_item.evaluate(cond, None, lambda w, s=s: runeword_atom(w, s)) for s in (0, 32)):
                self.report(r.idx, "warning", "rw-tag",
                            "this tag line can also match a runeword (RW): 305-runeword-rolls tags runewords in the "
                            "game's order, so gate the line (e.g. !RW) or tag the stat there", r.line)


RW_COMPARE_RE = re.compile(r"^(STAT360|STAT206)([<>=~])(-?\d+)(?:-(\d+))?$")
NOT_RUNEWORD = {"MAG", "RARE", "UNI", "SET", "CRAFT", "FALSE", "GLOVES", "BOOTS", "BELT", "JEWELRY", "CHARM",
                "MISC", "amu", "rin", "ram", "jew", "cm1", "cm2", "cm3"}  # qualities and items no runeword can be


def runeword_atom(word, corruption):
    """A condition word's value for some runeword, 1 / 0 / 0.5 (may be): an identified white item (normal or
    superior) that is a runeword (a weapon, body armor, helm, shield or quiver); corrupted (STAT360) only for
    sockets (32) if at all, never desecrated (STAT206). Everything else may hold."""
    if word in ("RW", "ID", "NMAG", "TRUE"):
        return 1
    if word in NOT_RUNEWORD:
        return 0
    m = RW_COMPARE_RE.match(word)
    if m:
        value = corruption if m.group(1) == "STAT360" else 0
        a, b = int(m.group(3)), int(m.group(4) or m.group(3))
        return int({"=": value == a, "<": value < a, ">": value > a, "~": a <= value <= b}[m.group(2)])
    return 0.5


def balanced(text, open_, close):
    depth = 0
    for ch in text:
        depth += (ch == open_) - (ch == close)
        if depth < 0:
            return False
    return depth == 0


def bh_tokens(cond):
    """Condition tokens as BH's BuildConditions makes them: operands, AND / OR (with the implicit
    ANDs added), ! ( ). Formula islands become one operand."""
    for a, b in reversed(formula_ranges(cond)):
        cond = cond[:a] + " $f " + cond[b:]
    raw = []
    for tok in cond.split():
        core = tok.strip("!()")
        i = tok.find(core) if core else len(tok)
        raw += list(tok[:i])
        if core:
            raw.append("AND" if core in ("AND", "&&") else "OR" if core in ("OR", "||") else core)
        raw += list(tok[i + len(core):])
    tokens, last = [], None
    for t in raw:
        if t not in ("AND", "OR", ")") and last is not None and last not in ("AND", "OR", "!", "("):
            tokens.append("AND")
        tokens.append(t)
        last = t
    return tokens


def and_after_or(tokens):
    """True if an AND follows an OR inside the same brackets. BH gives AND and OR the same
    precedence (left to right), so 'A OR B C' is '(A OR B) AND C', not 'A OR (B AND C)'."""
    seen_or = [False]
    for t in tokens:
        if t == "(":
            seen_or.append(False)
        elif t == ")":
            if len(seen_or) > 1:
                seen_or.pop()
        elif t == "OR":
            seen_or[-1] = True
        elif t == "AND" and seen_or[-1]:
            return True
    return False


def formula_ranges(cond):
    """(start, end) of each $f( ... ) island in a condition."""
    spans = []
    for m in FORMULA_RE.finditer(cond):
        depth, i = 0, m.end() - 1
        while i < len(cond):
            depth += (cond[i] == "(") - (cond[i] == ")")
            if depth == 0:
                break
            i += 1
        spans.append((m.start(), i + 1))
    return spans


def normalize_cond(cond):
    return " ".join(re.sub(r"\s*([()!])\s*", r" \1 ", cond).split())


# ---------------------------------------------------------------- allow-list / main

def load_allow():
    allow = set()
    if ALLOW_FILE.exists():
        for raw in ALLOW_FILE.read_text(encoding="utf-8").splitlines():
            line = "" if raw.startswith("#") else raw.split(" #", 1)[0].rstrip()
            if line.strip():
                check, _, key = line.partition(" ")
                allow.add((check, key.strip()))
    return allow


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Lint the Erazure filter (sections/).")
    ap.add_argument("--all", action="store_true", help="also show allow-listed findings and info notes")
    ap.add_argument("--customization", action="store_true",
                    help=f"also lint the commented-out rules in sections/{CUSTOMIZATION}")
    args = ap.parse_args()

    parts, _ = build.read_sections(check=True)
    where = build.line_locator(parts)
    joined = b"".join(data for _, data in parts).replace(build.PLACEHOLDER, b"VERSION")
    lines = joined.decode("utf-8").split("\r\n")

    findings = Linter(lines, where, args.customization).run()
    allow = load_allow()
    used_allow, counts, shown = set(), defaultdict(int), []
    for idx, severity, check, message, key in sorted(findings, key=lambda f: f[0]):
        allowed = (check, key) in allow
        if allowed:
            used_allow.add((check, key))
        if severity != "info" and not allowed:
            counts[severity] += 1
        elif not args.all:
            continue
        tag = f"{severity}, allowed" if allowed else severity
        shown.append(f"{where(idx)}: {tag} [{check}] {message}")
    if shown:
        print(*shown, sep="\n")

    stale = sorted(allow - used_allow)
    for check, key in stale:
        print(f"tools/lint_allow.txt: unused entry '{check} {key}' (remove it)")
    infos = sum(1 for f in findings if f[1] == "info")
    print(f"Lint: {counts['error']} error(s), {counts['warning']} warning(s), "
          f"{len(used_allow)} allow-listed, {infos} info note(s)"
          + ("" if args.all else " (--all shows allow-listed and info)") + ".")
    sys.exit(1 if counts["error"] or counts["warning"] or stale else 0)


if __name__ == "__main__":
    main()
