#!/usr/bin/env python3
"""
Count of the tags on an identified rare's label, for 315's sell value tag ($) (the author, 2026-10-28: a rare whose
label already shows 6 or more tags gets no ($)). BH has no word for how many tags a label shows, so this counts them
the way the filter adds them: every %CONTINUE% rule before 315 that puts tags before %NAME% (300's affix tags, 310's
staffmods, 250's jewels, 260's arrows, 145's maps), folded for an identified, uncorrupted rare of each base
(label_cuts' engine, the Main version), its words written as a BH formula (docs/pd2-formula-info.wiki): COUNT of the
rules' conditions, a rule that adds two tags (11r 20r) twice. Formulas read stats and item groups (as the conditions
do: the same item group flags) but no item codes and no affix ids, so the codes those rules name (rings, amulets,
jewels, quivers) get a formula each, every other base shares one with the item groups in it, and the rules that ask
an affix's id (the amp / lr tags, SUFFIX=n) stay conditions in the alias: every set of them that holds lowers the
count the formula needs. Magic and non-magical items keep their ($): 310's staffmods would make their formulas 30,000+
characters each.

Writes sections/312-tag-count.filter (GENERATED): the formulas and Alias[SELL_TAG_CROWDED], which 315's ($) lines
skip. Corrlorized's versions count Main's tags (a tag Corr switched off still counts).

Usage (from the repo root):
    python tools/gen_tag_count.py            write the section
    python tools/gen_tag_count.py --check    exit 1 if it is not what the rules make
    python tools/gen_tag_count.py --verify   sample rares: the formula's count = the tags the rules give
"""
import argparse
import json
import random
import re
import sys
from collections import Counter
from itertools import combinations
from pathlib import Path

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import explain_item as E  # noqa: E402
import label_cuts as LC  # noqa: E402
import lint_filter as L  # noqa: E402
import low_level_tags as LL  # noqa: E402
import tier_map as T  # noqa: E402

SECTION = ROOT / "sections" / "312-tag-count.filter"
SELL = 315  # the sell value tags' section: the tags before it are counted
LIMIT = 6  # a rare with this many tags or more gets no ($)
ALIAS = "SELL_TAG_CROWDED"
KEY = "RARE_TAGS"  # Formula[RARE_TAGS] for most bases, Formula[RARE_TAGS_A] ... for the codes rules name
TAG_RE = re.compile(r"^(.*?)%CS%%NAME%")
COLOR_RE = re.compile(r"%(?:" + "|".join(sorted(L.BH_COLORS)) + r")%")
ISLAND_RE = re.compile(r"\$f\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)")


def section_no(where):
    return int(re.search(r"sections/(\d+)-", where).group(1))


def tag_rules(rs):
    """[(rule, tags it adds)]: the %CONTINUE% rules before 315 whose output puts tags before %NAME%."""
    out = []
    for r in rs.rules:
        if section_no(r["where"]) >= SELL or not r["cont"]:
            continue
        m = TAG_RE.match(r["name"])
        if not m:
            continue
        text = ISLAND_RE.sub("X", COLOR_RE.sub("", m.group(1))).replace("%CS%", " ")
        n = len(text.split())
        if n:
            out.append((r, n))
    return out


def compare(x, op, a, b):
    return int({"=": x == a, "<": x < a, ">": x > a, "~": a <= x <= int(b if b is not None else a)}[op])


def map_tier(code):
    """BH's MAPTIER: the tier of a map (t1x.. t4x), -1 for anything else."""
    return int(code[1]) if re.fullmatch(r"t\d[0-9a-z]", code or "") else -1


def static_for(code, groups):
    """What is fixed for an identified, uncorrupted rare of this base that 315's ($) can tag (None: open). code None
    leaves item codes open, "" sets them all false; groups None leaves the item groups open, and with them the map
    tier."""
    def st(word):
        if word in E.QUALITIES:
            return int(word == "RARE")
        if word in E.GROUPS:
            return None if groups is None else int(word in groups)
        if word.startswith("@ROLL_"):
            return 0  # unique and set rolls
        if word == "ID":
            return 1
        if word in ("RW", "SHOP", "EQUIPPED", "STASH"):
            return 0
        m = E.COMPARE_RE.match(word)
        if m:
            if m.group(1) == "STAT360":
                return compare(0, m.group(2), int(m.group(3)), m.group(4))
            if m.group(1) == "MAPTIER" and groups is not None:
                return compare(map_tier(code), m.group(2), int(m.group(3)), m.group(4))
            return None
        if code is not None and len(word) >= 3 and not any(c.isupper() for c in word[:3]):
            return int(word == code)  # an item code
        return None
    return st


def is_code(word):
    return len(word) >= 3 and not any(c.isupper() for c in word[:3]) and not E.COMPARE_RE.match(word)


def formula_word(word, rs):
    """A condition word as BH formula text."""
    if word.startswith("FORMULA__"):
        body = rs.formulas[int(word[9:])].strip()
        return "(" + body[3:-1] + ")"
    m = E.COMPARE_RE.match(word)
    if m:
        key, op, a, b = m.group(1), m.group(2), m.group(3), m.group(4)
        if op == "~":
            return f"AND({key}>={a},{key}<={b})"
        return f"{key}{'==' if op == '=' else op}{a}"
    return word


def in_formula(word):
    """Whether BH's formulas know the word (PREFIX / SUFFIX, the affix ids, they don't)."""
    if word.startswith("FORMULA__") or word in ("TRUE", "FALSE"):
        return True
    m = E.COMPARE_RE.match(word)
    parts = m.group(1).split("+") if m else [word]
    return all(p.lower() in L.FORMULA_VARS or L.FORMULA_PREFIX_RE.match(p) for p in parts)


def ftext(node, rs):
    if not isinstance(node, tuple):
        return str(int(node))
    if node[0] == "w":
        return formula_word(node[1], rs)
    if node[0] == "!":
        return "!(" + ftext(node[1], rs) + ")"
    return node[0] + "(" + ",".join(ftext(c, rs) for c in node[1]) + ")"


def ctext(node, top=True):
    """A folded tree as BH condition text."""
    if not isinstance(node, tuple):
        return "TRUE" if node else "FALSE"
    if node[0] == "w":
        return node[1]
    if node[0] == "!":
        inner = ctext(node[1], False)
        return "!" + (inner if node[1][0] == "w" or inner.startswith("(") else f"({inner})")
    body = (" OR " if node[0] == "OR" else " ").join(ctext(c, False) for c in node[1])
    return f"({body})"


def look_key(rule):
    """The tag's word without its numbers and colors (amp, lr): rules of one look are one stat, one tag at most."""
    m = TAG_RE.match(rule["name"])
    return re.sub(r"[^A-Za-z%]", "", COLOR_RE.sub("", re.sub(r"%[A-Z0-9_,]+%", "", COLOR_RE.sub("", m.group(1)))))


def count_of(tags, static, rs):
    """(the formula of the tag rules formulas can read, {look: [folded trees]} of those they can't)."""
    parts, terms = [], {}
    for r, n in tags:
        t = LC.fold(r["tree"], static)
        if t == 0:
            continue
        if all(in_formula(w) for w in LC.words_of(t)):
            parts += [ftext(t, rs)] * n
        else:
            if n != 1:
                sys.exit(f"gen_tag_count: {r['where']} adds {n} tags and asks words formulas lack")
            terms.setdefault(look_key(r), []).append(t)
    return ("COUNT(" + ",".join(parts) + ")" if parts else "0"), terms


def load_rules():
    return LC.RuleSet((ROOT / "sections" / LC.SECTION).read_bytes())


def classes(rs, tags):
    """The item codes the rare tag rules name (each gets a formula of its own)."""
    codes = set()
    open_codes = static_for(None, set())
    for r, _ in tags:
        t = LC.fold(r["tree"], lambda w: None if is_code(w) else open_codes(w))
        codes |= {w for w in LC.words_of(t) if is_code(w)}
    return sorted(codes)


def terms_text(terms):
    """[(look, condition text)] of the tag rules formulas can't read."""
    return [(k, ctext(ts[0]) if len(ts) == 1 else "(" + " OR ".join(ctext(t) for t in ts) + ")")
            for k, ts in sorted(terms.items())]


def crowded(ref, terms):
    """Condition text: the formula plus the condition-side terms that hold reach LIMIT (every subset of terms)."""
    out = []
    for size in range(len(terms) + 1):
        for combo in combinations(terms, size):
            need = f"{ref}>{LIMIT - 1 - size}"
            out.append(" ".join([t for _, t in combo] + [need]) if combo else need)
    return out[0] if len(out) == 1 else "(" + " OR ".join(f"({o})" if " " in o else o for o in out) + ")"


def build_section():
    rs = load_rules()
    tags = tag_rules(rs)
    named = classes(rs, tags)
    bases = T.load_bases()
    own = {}  # (formula, terms) -> codes: the codes the rules name, each folded with its base's item groups
    for code in named:
        b = bases.get(code)
        groups = T.item_groups(set(b["types"])) | {T.TIER_GROUP[b["tier"]]} if b else set()
        leaf, terms = count_of(tags, static_for(code, groups), rs)
        own.setdefault((leaf, tuple(terms_text(terms))), []).append(code)
    rest, rest_terms = count_of(tags, static_for("", None), rs)  # every other base: item groups in the formula
    lines = ["// ------------------------------------------------------------------------------",
             "//    ====================  Tag Count of Rares (formulas)  ======================",
             "// ------------------------------------------------------------------------------",
             "",
             "// GENERATED by tools/gen_tag_count.py from the rules before 315; never edit by hand. How many tags an",
             "// identified, uncorrupted rare's label shows (every %CONTINUE% rule that puts tags before %NAME%, a rule",
             f"// with two tags counted twice), so 315's sell value tag ($) skips a rare with {LIMIT} or more (the author,",
             "// 2026-10-28). Formulas read no item codes: the codes the rules name get a formula each, every other base",
             "// one with the item groups in it. Corrlorized counts Main's tags.",
             ""]
    refs = []
    for i, ((leaf, terms), codes) in enumerate(sorted(own.items(), key=lambda kv: sorted(kv[1]))):
        key = f"{KEY}_{chr(65 + i)}"
        lines += [f"// {', '.join(sorted(codes))}", f"Formula[{key}]: {leaf}"]
        refs.append((sorted(codes), "FORMULA" + key, list(terms)))
    lines += ["// every other base", f"Formula[{KEY}]: {rest}", ""]
    named_cond = " OR ".join(c for cs, _, _ in refs for c in cs)
    parts = []
    for cs, ref, terms in refs:
        parts.append(f"({cs[0] if len(cs) == 1 else '(' + ' OR '.join(cs) + ')'} {crowded(ref, terms)})")
    rest_cond = crowded("FORMULA" + KEY, terms_text(rest_terms))
    parts.append(f"(!({named_cond}) {rest_cond})" if refs else rest_cond)
    lines += [f"// a rare whose label shows {LIMIT} or more tags: 315's ($) lines skip it (the tags the formulas",
              "// can't read, those that ask an affix's id, are counted here: every set of them that holds)",
              f"Alias[{ALIAS}]:(RARE ({' OR '.join(parts)}))"]
    return ("\r\n".join(lines) + "\r\n").encode("utf-8"), refs


def check_names(text):
    """BH replaces an alias name anywhere in a condition: none may sit inside this section's words or ours in its."""
    words = set(re.findall(r"FORMULA[A-Z_]+|" + ALIAS, text.decode("utf-8")))
    bad = []
    for f in (ROOT / "sections").glob("*.filter"):
        if f == SECTION:
            continue
        for name in re.findall(r"^Alias\[([^\]]+)\]", f.read_text(encoding="utf-8"), re.M):
            name = name.strip()
            bad += [f"{name} / {w}" for w in words if name != w and (name in w or w in name)]
    return bad


# ---------------------------------------------------------------- --verify


def load_affixes():
    rows = [l for l in LL.AFFIXES.read_text(encoding="utf-8").splitlines() if not l.startswith("#")]
    header = rows[0].split("\t")
    out = []
    for line in rows[1:]:
        a = dict(zip(header, line.split("\t")))
        if a["kind"] not in ("prefix", "suffix") or a["spawnable"] != "1" or a["rare"] in ("", "0") or \
                a["frequency"] in ("", "0"):
            continue
        a["mods"] = json.loads(a["mods"] or "[]")
        a["itypes"] = {t for t in a["itypes"].split(",") if t}
        a["etypes"] = {t for t in a["etypes"].split(",") if t}
        a["level"], a["maxlevel"] = int(a["level"] or 0), int(a["maxlevel"] or 0)
        out.append(a)
    return out


def fvalue(text, env):
    """A formula's value as BH computes it (AND / OR / IF / ! as BH's; names it lacks are 0)."""
    funcs = dict(LC.FUNCS, AND=lambda *a: int(all(a)), OR=lambda *a: int(any(a)),
                 IF=lambda c, a, b: a if c else b, COUNT=lambda *a: sum(1 for x in a if x))
    expr = re.sub(r"!(?!=)", " not ", text)
    expr = re.sub(r"\b([A-Z][A-Z_]*\d+),(\d+)", r"\1_\2", expr)
    scope = LC.Zero(env)
    scope.update(funcs)
    return eval(expr, {"__builtins__": {}}, scope)


def verify(samples):
    section, refs = build_section()
    text = section.decode("utf-8")
    formulas = dict(re.findall(r"^Formula\[([A-Z_]+)\]: (.*?)\r?$", text, re.M))
    alias = LC.tree(LC.rpn(re.search(rf"^Alias\[{ALIAS}\]:(.*?)\r?$", text, re.M).group(1)))
    rs = load_rules()
    tags = tag_rules(rs)
    before = [r for r in rs.rules if section_no(r["where"]) < SELL]
    bases, affixes = T.load_bases(), load_affixes()
    rng = random.Random(28)
    n = skipped = 0
    problems, seen = [], Counter()
    codes = sorted(c for c, b in bases.items() if b["spawnable"])
    for code in codes:
        b = bases[code]
        groups = T.item_groups(set(b["types"])) | {T.TIER_GROUP[b["tier"]]}
        mine = [a for a in affixes if LL.fits(a, b)]
        if not mine:
            continue  # nothing rolls on it as a rare
        weapon = "weap" in b["types"]
        static = static_for(code, groups)
        rules = [(LC.fold(r["tree"], static), r) for r in before]
        rules = [(t, r) for t, r in rules if t != 0]
        ref = next((rf for cs, rf, _ in refs if code in cs), "FORMULA" + KEY)
        ftxt = formulas[ref[len("FORMULA"):]]
        named = any(code in cs for cs, _, _ in refs)
        _, terms = count_of(tags, static_for(code if named else "", groups), rs)  # the alias's affix-id terms
        for _ in range(samples):
            alvl = rng.randint(1, 99)
            elig = [a for a in mine if a["level"] <= alvl and (not a["maxlevel"] or alvl <= a["maxlevel"])]
            chosen, used = [], set()
            for kind in ("prefix", "suffix"):
                pool = [a for a in elig if a["kind"] == kind]
                rng.shuffle(pool)
                for a in pool[:rng.randint(0, 3) * 3]:
                    g = a["group"] or a["row"]
                    if g not in used and sum(1 for x in chosen if x["kind"] == kind) < 3:
                        chosen.append(a)
                        used.add(g)
            v = LL.base_values(code, b, groups, alvl)
            v.update(CLVL=rng.randint(1, 99), FILTLVL=rng.randint(0, 4), DIFF=rng.randint(0, 2),
                     GEMMED=int(rng.random() < 0.1), ETH=int(rng.random() < 0.1), SOCK=rng.choice((0, 0, 1, 2)))
            for a in chosen:
                for mod in a["mods"]:
                    for sid, par, lo, hi in mod[5]:
                        x = rng.randint(min(lo, hi), max(lo, hi)) * (256 if sid in LL.PER_LEVEL else 1)
                        for w in LL.stat_words(sid, par, weapon):
                            v[w] = v.get(w, 0) + x
            v = LL.with_derived(v)
            if map_tier(code) > 0:
                v["MAPTIER"] = map_tier(code)
            m = LC.Model(rs, "RARE", code, groups, v)
            cur, stopped, maybe = b["name"] + "\n" + LL.RARE_NAME, False, False
            for t, r in rules:
                x = LC.ev(t, m.atom)
                if x != 1:
                    maybe = maybe or x == LC.MAYBE
                    continue
                cur = LC.apply(r["name"], cur, v, b["name"])
                if not r["cont"]:
                    stopped = True
                    break
            if stopped or maybe:
                skipped += 1
                continue  # 315 is not reached, or a rule asks the viewer's class
            lines = LC.trim(cur).split("\n")
            got = len(LC.visible(lines[0]).split()) if len(lines) >= 3 else 0
            env = LC.Zero({k.replace(",", "_"): x for k, x in v.items()})
            env.update({g: 1 for g in groups}, GROUND=1, MAPTIER=map_tier(code))
            values = {"FORMULA" + k: fvalue(f, env) for k, f in formulas.items()}
            want = values[ref] + sum(1 for ts in terms.values() if any(LC.ev(t, m.atom) == 1 for t in ts))
            crowded = LC.ev(alias, LC.Model(rs, "RARE", code, groups, dict(v, **values)).atom)
            n += 1
            seen[min(got, LIMIT)] += 1
            if got != want or crowded != (got >= LIMIT):
                problems.append(f"{b['name']} ({code}) affix level {alvl} {[a['name'] for a in chosen]}: label "
                                f"{got} tags ({LC.visible(lines[0])!r}), counted {want}, alias {crowded}")
    print(f"{n} sample rares checked ({skipped} stop before 315 or ask the class); labels with 0..{LIMIT}+ tags: "
          + ", ".join(f"{k}: {c}" for k, c in sorted(seen.items())))
    if problems:
        print(f"{len(problems)} problem(s):")
        for p in problems[:40]:
            print("  " + p[:300])
        return 1
    print("no problems")
    return 0


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--check", action="store_true", help="exit 1 if the section is not what the rules make")
    ap.add_argument("--verify", action="store_true", help="sample rares: the formula's count = the label's tags")
    ap.add_argument("--samples", type=int, default=4, help="sample rares per base for --verify")
    args = ap.parse_args()
    if args.verify:
        return verify(args.samples)
    data, _ = build_section()
    bad = check_names(data)
    if bad:
        print("gen_tag_count: alias names clash: " + "; ".join(bad))
        return 1
    old = SECTION.read_bytes() if SECTION.exists() else b""
    if args.check:
        if old != data:
            print(f"{SECTION.relative_to(ROOT)} is out of date: run python tools/gen_tag_count.py")
            return 1
        print("rare tag count up to date")
        return 0
    if old != data:
        SECTION.write_bytes(data)
        print(f"updated: {SECTION.relative_to(ROOT)}")
    else:
        print("updated: nothing")
    return 0


if __name__ == "__main__":
    sys.exit(main())
