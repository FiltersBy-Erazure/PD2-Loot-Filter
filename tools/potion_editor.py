#!/usr/bin/env python3
"""The potion editor: the author's claude.ai page for how potions show (sections/060-gold-potions-tomes.filter), per
filter level and character level, as the alias editor is for the aliases (the author, 2026-11-12).

    python tools/potion_editor.py               write tools/potion_editor.html (gitignored) from
                                                tools/potion_editor_template.html with today's displays embedded; it
                                                is published to PAGE_URL, whose db keeps the author's choices across
                                                republishes
    python tools/potion_editor.py --dump CODE   print a potion's grids today (every part and place), as text
    python tools/potion_editor.py --check FILE  compare the built filter with saved choices: FILE is {code: document}
                                                (the page's db collection `cards`); lists every cell that differs

One card per potion (healing, mana, rejuvenation, stamina, antidote, thawing and throwing potions). Today's displays
come from the filter's own rules (Erazure - Main), run the way BH runs them (tools/explain_item.py's evaluation: the
display pass to the first rule without %CONTINUE%, the notification pass for the minimap icon and chat line) for every
filter level and every run of character levels the rules tell apart, on the ground outside town in Hell. A display is
what the potion's label shows (or hidden), its minimap icon (BORDER / MAP / DOT / PX layers) and its chat line (the
%TIER% of the rule that notifies). Parts: the cases today's rules treat otherwise (Normal difficulty, Rathma's or
Lucion's areas, Sorceresses by energy...), one grid each, cases with the same grid joined; Normal difficulty and maps
can be split off on any card. Elsewhere: on the ground in town, in a shop and in the stash (read only).

The page's db: collection `cards`, one document per potion code changed from today: {parts: {<part id>: {apart: bool,
cuts: [character levels a column starts at, after 1], rows: {"<from level>": [13 display ids, filter levels 0-12]}}},
displays: {<id>: {label, icons: [[BORDER, MAP, DOT, PX] codes or null], tier: null (no notification) / "all" (a chat
line on every level) / n (on levels 0-n)}} (every display the card's rows use), town: <display id> (its look in town
where hidden on the ground), note, savedAt}; collection `meta`, document `note` ({text}). Part "main" is the ground
outside town in Hell; a part that isn't `apart` follows "main". Apply only when the author says: write 060's potion
rules by hand (keep every hide rule's GROUND !TOWN and its TOWN twin with the card's town look, the shop and stash
rules), run --check with the saved documents until it lists nothing, then delete the applied documents and republish.
"""
import argparse
import datetime
import itertools
import json
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402
import explain_item as E  # noqa: E402
import gen_unique_rolls as U  # noqa: E402  (the game font, as the alias editor embeds it)
import lint_filter as L  # noqa: E402
import tier_map as T  # noqa: E402

ROOT = build.ROOT
TEMPLATE = ROOT / "tools" / "potion_editor_template.html"
PAGE = ROOT / "tools" / "potion_editor.html"
PAGE_URL = "https://claude.ai/artifact/XMfaWSpMM3ghboKyyxXgQY"  # db: cards/<code>, meta/note
SECTION = "060-gold-potions-tomes.filter"
GROUPS = [  # (id, title, note, codes), in the page's order
    ("healing", "Healing potions", "The game's Hide Healing Potions option hides them all before the filter runs.",
     ["hp1", "hp2", "hp3", "hp4", "hp5"]),
    ("mana", "Mana potions", "The game's Hide Mana Potions option hides Minor to Super Mana Potions before the filter "
     "runs.", ["mp1", "mp2", "mp3", "mp4", "mp5", "pvpp"]),
    ("rejuv", "Rejuvenation potions", "", ["rvs", "rvl"]),
    ("utility", "Stamina, antidote and thawing potions", "", ["vps", "yps", "wms"]),
    ("throwing", "Throwing potions", "", ["tpgs", "tpgm", "tpgl", "tpfs", "tpfm", "tpfl", "tpcs", "tpcm", "tpcl",
                                         "tpls", "tplm", "tpll"]),
]
LAYERS = ("BORDER", "MAP", "DOT", "PX")
ICON_RE = re.compile(r"%(BORDER|MAP|DOT|PX)-([0-9A-Fa-f]{1,4})%")
CLASS_WORDS = set(E.CLASSES)
STAT_NAMES = {0: "strength", 1: "energy", 2: "dexterity", 3: "vitality"}
# The case every part changes one thing of: on the ground outside town, in Hell, an area no rule names
BASE = {"where": "GROUND", "TOWN": 0, "MAPID": T.FIELD_ID, "DIFF": 2}
DIFFS = {0: "Normal difficulty", 1: "Nightmare"}
# Areas the rules name (MAPID, Levels.txt Id): (id, a value inside, name)
AREAS = [("town", 1, "In town"), ("maps", 138, "In maps"), ("dclone", 137, "In The Pandemonium Fortress"),
         ("rathma", 161, "In Rathma's areas"), ("gardens", 183, "In The Fallen Gardens and The Diamond Gate"),
         ("lucion", 188, "In Lucion's areas")]
OPTIONAL = [("normal", {"DIFF": 0}, "Normal difficulty"), ("maps", {"MAPID": 138}, "In maps")]  # any card can split
ELSEWHERE = [  # read only: (id, name, case)
    ("town", "On the ground in town", {"where": "GROUND", "TOWN": 1, "MAPID": 1}),
    ("shop", "In a shop", {"where": "SHOP", "TOWN": 1, "MAPID": 1}),
    ("stash", "In the stash", {"where": "STASH", "TOWN": 1, "MAPID": 1}),
]
MAYBE = E.MAYBE


class Rule:
    """One rule as BH reads it: its condition as RPN, its label (the output without notifications and description),
    %CONTINUE%, its minimap icon layer and the %TIER% of its chat line."""
    __slots__ = ("n", "where", "rpn", "label", "cont", "notify", "icon", "tier", "words")

    def __init__(self, n, where, cond, output, aliases):
        self.n, self.where = n, where
        self.rpn = rpn(cond)
        self.words = {t[1] for t in self.rpn if isinstance(t, tuple)}
        label, self.cont, self.notify, _, tier = E.action(output, aliases)
        self.label = label
        full = L.expand_output_aliases(output, aliases)
        full = re.sub(r"\{.*?\}", "", full)
        codes = {k.upper(): v.upper() for k, v in ICON_RE.findall(full)}
        self.icon = [codes.get(k) for k in LAYERS] if codes else None
        self.tier = "all" if tier is None else tier


def rpn(cond):
    """BH's ProcessConditions (explain_item.evaluate's first half): the condition's tokens in postfix order; None for
    a malformed condition (it never matches)."""
    out, ops = [], []
    for t in L.bh_tokens(cond):
        if t in ("AND", "OR"):
            while ops and ops[-1] in ("!", "AND", "OR"):
                out.append(ops.pop())
            ops.append(t)
        elif t in ("!", "("):
            ops.append(t)
        elif t == ")":
            while ops and ops[-1] != "(":
                out.append(ops.pop())
            if not ops:
                return None
            ops.pop()
        else:
            out.append(("op", t))
    while ops:
        t = ops.pop()
        if t == "(":
            return None
        out.append(t)
    return out


def run(tokens, atom_of):
    """explain_item.evaluate's second half, on a rule's RPN."""
    if tokens is None:
        return 0
    stack = []
    for t in tokens:
        if isinstance(t, tuple):
            stack.append(atom_of(t[1]))
        elif t == "!":
            if not stack:
                return 0
            stack.append(1 - stack.pop())
        else:
            if len(stack) < 2:
                return 0
            b, a = stack.pop(), stack.pop()
            stack.append(min(a, b) if t == "AND" else max(a, b))
    return stack[0] if len(stack) == 1 else (1 if not tokens else 0)


class Item:
    """explain_item's item model: a potion as it drops (quality NMAG, identified), one case's values."""

    def __init__(self, code, groups, case=None):
        self.code, self.quality, self.groups = code, "NMAG", groups
        self.values = {"ID": 1, "ETH": 0}
        self.cls, self.where = None, None
        for k, v in (case or {}).items():
            if k == "class":
                self.cls = v
            elif k == "where":
                self.where = v
            else:
                self.values[k] = v


def atom(word, item, unknown=None):
    if word in E.PLACES and item.where is None:
        return MAYBE
    v = E.atom(word, item)
    if v == MAYBE and unknown is not None:
        unknown.add(word)
    return v


def load_rules():
    lines, where, _ = build.variant_text(build.MAIN)
    lt = L.Linter(lines, where, False)
    return [Rule(i, where(r.idx), E.expand_condition(r.cond, lt.aliases), r.output, lt.aliases)
            for i, r in enumerate(lt.rules)]


def compare_cuts(words, key, low, high):
    """The first value of each run of values the comparisons of `key` tell apart, from `low` (level_map.cuts)."""
    out = set()
    for w in words:
        m = E.COMPARE_RE.match(w)
        if not m or m.group(1) != key:
            continue
        a, b, op = int(m.group(3)), m.group(4), m.group(2)
        out |= {a} if op == "<" else {a + 1} if op == ">" else {a, a + 1} if op == "=" else {a, int(b) + 1}
    return [low] + sorted(c for c in out if low < c <= high)


class Potion:
    def __init__(self, code, base, rules):
        self.code, self.name = code, base["name"]
        groups = T.item_groups(set(base["types"]))
        if base["tier"] in T.TIER_GROUP:
            groups.add(T.TIER_GROUP[base["tier"]])
        self.groups = groups
        probe = Item(code, groups)
        self.rules = [r for r in rules if run(r.rpn, lambda w: atom(w, probe))]  # those that can match it
        self.words = set().union(*(r.words for r in self.rules))
        self.clvls = compare_cuts(self.words, "CLVL", 1, 99)
        self.keys, self.memo = {}, {}
        self.fired = set()  # the rules that decided an outcome (a label, a %CONTINUE% layer, a notification)

    def outcome(self, case, level, clvl):
        """(label or "" when hidden, icon layers, tier) in one case."""
        values = dict(case, FILTLVL=level, CLVL=clvl)
        key = tuple(sorted(values.items(), key=lambda kv: kv[0]))
        if key in self.memo:
            return self.memo[key]
        item = Item(self.code, self.groups, values)

        def matches(r):
            unknown = set()
            v = run(r.rpn, lambda w: atom(w, item, unknown))
            if v == MAYBE:
                sys.exit(f"potion_editor: {self.code} at {r.where}: no case decides {', '.join(sorted(unknown))}")
            return v
        name, label = f"%WHITE%{self.name}", None
        for r in self.rules:
            v = matches(r)
            if not v:
                continue
            self.fired.add(r.n)
            text = r.label.replace("%NAME%", name)
            if r.cont:
                name = text
                continue
            label = text
            break
        if label is None:
            label = name
        if not E.shows_name(label):
            label = "" if level else f"%WHITE%{self.name}"  # level 0 (Show All Items): BH shows the game's name
        icons, tier = [], None
        for r in self.rules:
            if not r.notify or not matches(r):
                continue
            self.fired.add(r.n)
            if r.icon:
                icons.append(r.icon)
            if tier is None:
                tier = r.tier
            if not r.cont:
                break
        out = (label, tuple(tuple(x) for x in icons), tier)
        self.memo[key] = out
        return out

    def display_id(self, key):
        if key not in self.keys:
            self.keys[key] = "hidden" if key == ("", (), None) else f"d{len(self.keys) + 1}"
        return self.keys[key]

    def grid(self, case):
        """{from character level: [display id per filter level]}: runs of character levels that differ."""
        runs, last = {}, None
        for clvl in self.clvls:
            row = [self.display_id(self.outcome(case, lv, clvl)) for lv in T.FILTER_LEVELS]
            if row != last:
                runs[clvl] = row
                last = row
        return runs

    def candidates(self, words):
        """(base case, [(id, name, case)]): who plays (the classes and character stats these words name) and where
        (difficulty, areas), each changing the base case: on the ground outside town in Hell, in an area no rule
        names, a class no rule names, every stat at 0."""
        classes = sorted(w for w in words if w in CLASS_WORDS)
        stats = sorted({int(m.group(1)[8:]) for w in words if (m := E.COMPARE_RE.match(w))
                        and re.fullmatch(r"CHARSTAT\d+", m.group(1))})
        other = next(c for c in E.CLASSES if c not in classes)
        base = dict(BASE, **{"class": other}, **{f"CHARSTAT{s}": 0 for s in stats})
        out = []
        cut_sets = [[(s, c, compare_cuts(words, f"CHARSTAT{s}", 0, 10 ** 6)) for c in
                     compare_cuts(words, f"CHARSTAT{s}", 0, 10 ** 6)] for s in stats]

        def stat_words(s, c, cuts):
            name, i = STAT_NAMES.get(s, f"stat {s}"), cuts.index(c)
            if i == 0:
                return f"{name} below {cuts[1]}"
            return f"{name} {c}+" if i == len(cuts) - 1 else f"{name} {c}-{cuts[i + 1] - 1}"
        for cls in [other] + classes:
            for combo in itertools.product(*cut_sets):
                if cls == other and all(c == 0 for _, c, _ in combo):
                    continue
                who = T.CLASS_NAMES.get(cls, cls) if cls != other else "Every class"
                bits = [stat_words(s, c, cuts) for s, c, cuts in combo]
                pid = "-".join([cls.lower()] + [f"s{s}_{c}" for s, c, _ in combo])
                out.append((pid, who + (" with " + " and ".join(bits) if bits else ""),
                            dict(base, **{"class": cls}, **{f"CHARSTAT{s}": c for s, c, _ in combo})))
        keys = {m.group(1) for w in words if (m := E.COMPARE_RE.match(w))}
        if "DIFF" in keys:
            out += [({0: "normal", 1: "nightmare"}[d], name, dict(base, DIFF=d)) for d, name in DIFFS.items()]
        if "MAPID" in keys:
            out += [(aid, name, dict(base, MAPID=mapid)) for aid, mapid, name in AREAS if aid != "town"]
        return base, out

    def dims(self, words):
        """What candidates() makes of these words."""
        return json.dumps(self.candidates(words), sort_keys=True)


def card(potion, group):
    """One potion's card. Its parts come from the words of 060's rules that can match it, and of every rule that
    decided an outcome (a later section's rule a case reaches), until those name nothing new."""
    words = set().union(*(r.words for r in potion.rules if r.where.startswith(f"sections/{SECTION}:")))
    while True:
        base, cands = potion.candidates(words)
        parts, optional, elsewhere = grids(potion, base, cands)
        more = words.union(*(r.words for r in potion.rules if r.n in potion.fired))
        if potion.dims(more) == potion.dims(words):
            break
        words = more
    town = town_look(potion, base)
    displays = {i: {"label": k[0], "icons": [list(x) for x in k[1]], "tier": k[2]} for k, i in potion.keys.items()}
    lines = sorted({int(r.where.rsplit(":", 1)[1]) for r in potion.rules if r.where.startswith(f"sections/{SECTION}")})
    return {"code": potion.code, "name": potion.name, "group": group, "parts": parts, "optional": optional,
            "elsewhere": elsewhere, "displays": displays, "town": town,
            "rules": f"sections/{SECTION}:{lines[0]}-{lines[-1]}" if lines else None}


def grids(potion, base, cands):
    """(parts: the ground outside town, then each candidate whose grid differs from it, candidates with the same grid
    joined; the optional parts a card can split off; the read-only places)."""
    main = potion.grid(base)
    parts, seen = [{"id": "main", "name": "On the ground outside town", "today": main}], {}
    for pid, name, case in cands:
        g = potion.grid(case)
        if g == main:
            continue
        sig = json.dumps(g, sort_keys=True)
        if sig in seen:
            p = seen[sig]
            p["id"] += "+" + pid
            p["names"].append(name)
            continue
        p = {"id": pid, "names": [name], "today": g}
        seen[sig] = p
        parts.append(p)
    for p in parts[1:]:
        p["name"] = join_names(p.pop("names"))
    taken = {x for p in parts for x in p["id"].split("+")}
    optional = [{"id": oid, "name": name, "today": potion.grid(dict(base, **over))}
                for oid, over, name in OPTIONAL if oid not in taken]
    elsewhere = [{"id": eid, "name": name, "today": potion.grid(dict(base, **over))} for eid, name, over in ELSEWHERE]
    return parts, optional, elsewhere


def join_names(names):
    names = [n[3:] if n.startswith("In ") and i else n for i, n in enumerate(names)]
    return names[0] if len(names) == 1 else ", ".join(names[:-1]) + " and " + names[-1]


def town_look(potion, base):
    """The display a potion hidden on the ground shows in town, today: the most common town label where the ground
    hides it, else its first label shown on the ground."""
    town = dict(base, TOWN=1, MAPID=1)
    count = {}
    for lv in T.FILTER_LEVELS:
        for clvl in potion.clvls:
            if potion.outcome(base, lv, clvl)[0] == "" and lv:
                label = potion.outcome(town, lv, clvl)[0]
                if label:
                    count[label] = count.get(label, 0) + 1
    label = max(count, key=count.get) if count else next(
        (potion.outcome(base, lv, c)[0] for lv in T.FILTER_LEVELS for c in potion.clvls
         if potion.outcome(base, lv, c)[0]), "")
    return potion.display_id((label, (), None))


def cards():
    rules, bases = load_rules(), T.load_bases()
    out = []
    for gid, _, _, codes in GROUPS:
        for code in codes:
            out.append(card(Potion(code, bases[code], rules), gid))
    return out


def write_page():
    data = {
        "generated": datetime.date.today().isoformat(), "levels": T.load_levels(), "palette": T.load_palette(),
        "groups": [{"id": g, "title": t, "note": n} for g, t, n, _ in GROUPS], "cards": cards(),
        "nameMax": T.BH_NAME_MAX, "section": SECTION,
    }
    html = TEMPLATE.read_text(encoding="utf-8")
    html = html.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":"))
                        .replace("</", "<\\/"))
    font = U.picker_font()
    if font:
        html = html.replace('/*__FONT__*/local("AvQest")', f"url(data:font/ttf;base64,{font})")
    PAGE.write_text(html, encoding="utf-8", newline="\n")
    n = len(data["cards"])
    parts = sum(len(c["parts"]) - 1 for c in data["cards"])
    print(f"wrote {PAGE.relative_to(ROOT)} ({PAGE.stat().st_size // 1024} KB): {n} potions, {parts} parts besides "
          f"the ground outside town")


# ---------------------------------------------------------------- --dump, --check

def plain(label):
    return re.sub(r"%[A-Z_]+%", "", label) if label else "(hidden)"


def describe(d):
    if not d["label"] and not d["icons"]:
        return "hidden"
    bits = [plain(d["label"])]
    if d["icons"]:
        bits.append("icon " + "+".join("/".join(f"{k}-{v}" for k, v in zip(LAYERS, x) if v) for x in d["icons"]))
    if d["tier"] is not None:
        bits.append("chat on every level" if d["tier"] == "all" else f"chat on levels 0-{d['tier']}")
    return ", ".join(bits)


def dump(code):
    c = next((c for c in cards() if c["code"] == code), None)
    if not c:
        sys.exit(f"--dump: no potion {code}; one of {', '.join(x for g in GROUPS for x in g[3])}")
    print(f"{c['name']} ({code}), {c['rules']}")
    for i, d in c["displays"].items():
        print(f"  {i:7} {describe(d)}")
    print(f"  town look where hidden on the ground: {c['town']}")
    for p in c["parts"] + [dict(o, name=o["name"] + " (optional)") for o in c["optional"]] + c["elsewhere"]:
        print(f"{p['name']}:")
        for lo, row in p["today"].items():
            print(f"  from {lo:>2}: " + " ".join(f"{x:>6}" for x in row))
    return 0


def expand(rows):
    """{from level: row} (keys numbers or, read from JSON, texts) -> [row per character level 1-99]."""
    rows = {int(k): v for k, v in rows.items()}
    return [rows[max(s for s in rows if s <= clvl)] for clvl in range(1, 100)]


def check(path):
    docs = json.loads(Path(path).read_text(encoding="utf-8"))
    by_code = {c["code"]: c for c in cards()}
    problems = 0
    for code, doc in docs.items():
        c = by_code.get(code)
        if not c:
            print(f"{code}: no such potion on the page")
            problems += 1
            continue
        want_d, have_d = doc.get("displays") or {}, c["displays"]
        key = lambda d: (d["label"], json.dumps(d["icons"]), d["tier"])  # noqa: E731
        today = {p["id"]: p for p in c["parts"] + c["optional"]}
        saved = doc.get("parts") or {}
        main_rows = expand(saved["main"]["rows"]) if "main" in saved else expand(today["main"]["today"])
        for pid, p in today.items():
            sp = saved.get(pid)
            own = sp and sp.get("apart", True)
            want = expand(sp["rows"]) if own else main_rows
            have = expand(p["today"])
            if pid != "main" and not own and have == expand(today["main"]["today"]):
                continue  # follows the ground outside town, as today: main's lines say it
            runs = []  # [first level, last level, first character level, last, filter's look, saved look]
            for lv in T.FILTER_LEVELS:
                for clvl in range(99):
                    w = want_d.get(want[clvl][lv]) or have_d.get(want[clvl][lv])
                    h = have_d[have[clvl][lv]]
                    if w is not None and key(w) == key(h):
                        continue
                    problems += 1
                    hs, ws = describe(h), describe(w) if w else want[clvl][lv] + " (unknown look)"
                    same = [r for r in runs if r[1] == lv and r[3] == clvl and r[4:] == [hs, ws]]
                    if same:
                        same[0][3] = clvl + 1
                    else:
                        runs.append([lv, lv, clvl + 1, clvl + 1, hs, ws])
            merged = []
            for r in runs:  # the same character levels on the next filter level: one line
                prev = next((m for m in merged if m[1] == r[0] - 1 and m[2:] == r[2:]), None)
                if prev:
                    prev[1] = r[0]
                else:
                    merged.append(r)
            for a, b, c1, c2, hs, ws in merged:
                levels = f"level {a}" if a == b else f"levels {a}-{b}"
                clvls = "every character level" if (c1, c2) == (1, 99) else f"character levels {c1}-{c2}"
                print(f"{code} {p.get('name', pid)}: {levels}, {clvls}: filter {hs}; saved {ws}")
        if doc.get("town"):
            w = want_d.get(doc["town"]) or have_d.get(doc["town"])
            h = have_d.get(c["town"])
            if w and h and w["label"] != h["label"]:
                problems += 1
                print(f"{code} in town: filter {plain(h['label'])}; saved {plain(w['label'])}")
    print(f"{problems} difference{'s' if problems != 1 else ''} (cells, one per filter and character level)" if problems
          else "the filter matches every saved card")
    return 1 if problems else 0


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--dump", metavar="CODE", help="print a potion's grids today")
    ap.add_argument("--check", metavar="FILE", help="compare the built filter with saved choices (JSON)")
    args = ap.parse_args()
    if args.dump:
        return dump(args.dump)
    if args.check:
        return check(args.check)
    write_page()
    return 0


if __name__ == "__main__":
    sys.exit(main())
