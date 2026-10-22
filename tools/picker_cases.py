#!/usr/bin/env python3
"""
The roll picker's labels (tools/roll_picker.html, written by tools/gen_unique_rolls.py --picker): every label a unique
or set item can show, drawn by the filter's own rules, so the page can show the longest one the author's picks make.

A case is one of tools/label_cuts.py's: base (the item's own and those the cube upgrades it to), ethereal, sockets (none
or the most), corruption outcome (amulets also desecrated), at the item's highest rolls, on every filter level of the
Main variant. The rules run with 045 written as if every item picked every roll that has a tag line, but the item's own
roll aliases stay open: each tag a rule puts in front of the name keeps the condition on the picks it needs (a rule
with !ROLL_<X>_TAG too), and the page draws a case for any picks with the tags whose condition holds. The cut rules'
own tags (tabs: short skill tab labels, slash: two skill tags as one) are picks of their own, ~tabs and ~slash.

    python tools/picker_cases.py NAME     print the cases of the items whose name has NAME, and their tags
"""
import argparse
import json
import multiprocessing
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import label_cuts as LC  # noqa: E402

G, P, T, L = LC.G, LC.P, LC.T, LC.L
MAYBE = LC.MAYBE
MARK = "§"  # a color code on the page: MARK + a letter (BH's colors, COLORS) or the game's own code character
COLORS = sorted(L.BH_COLORS)  # label_cuts' color codes: "\xffc" + chr(0x41 + index)


# ---------------------------------------------------------------- one item

RS, ITEMS, RULES = None, [], {}


def init(section, items, rules):
    global RS, ITEMS, RULES
    RS, ITEMS, RULES = LC.RuleSet(section), items, rules


def symbols(it):
    """{roll alias: (the pick it stands for, the alias that says the item is in it here)}: the item's rolls with a
    tag line, and its cut rules' own tags (~tabs where it is in tabsk's alias, ~slash where in the first skill's)."""
    live = {}
    for r in it.all_rolls:
        key = it.version if r["key"] == "ver" else r["key"]
        if r["key"] and r["tagged"] and key in G.TAGS:
            live[G.TAGS[key][0]] = (r["key"], G.TAGS[key][0])
    for step in RULES.get(it.key, []):
        if step[0] == "tabs" and "tabsk" in G.TAGS:
            live[G.TABS_SHORT_ALIAS] = ("~tabs", G.TAGS["tabsk"][0])
        elif step[0] == "slash" and step[1] in G.TAGS:
            live[G.slash_alias(*step[1:])] = ("~slash", G.TAGS[step[1]][0])
    return live


def has_maybe(node):
    if not isinstance(node, tuple):
        return node == MAYBE
    if node[0] == "w":
        return False
    if node[0] == "!":
        return has_maybe(node[1])
    return any(has_maybe(c) for c in node[1])


def run(rules, m, word, name, base):
    """(the label without the tags that depend on picks, [(tag, condition)] in rule order, whether a rule may match
    (the filter level), the place of a rule whose effect can't be split into tags, or None). word(w): a word's value,
    None for an open roll alias (a pick)."""
    def atom(w):
        x = word(w)
        return MAYBE if x is None else x
    cur, tags, maybe = base + "\n" + name, None, False
    for t, r in rules:
        x = LC.ev(t, atom)
        if x == 0:
            continue
        f = 1 if x == 1 else LC.fold(t, word)
        if not isinstance(f, tuple):
            if f == 0:
                continue
            if f != 1:
                maybe = True
                continue
        elif has_maybe(f):
            maybe = True
        new = LC.apply(r["name"], cur, m.v, base)
        if tags is None and f == 1:
            # the tag line starts where a rule puts a conditional line break in front (300's %CL%): from there
            # on every tag is one of its own, so the rest of the label is shared by the item's cases
            starts = r["cont"] and new.endswith(cur) and "\r" in new[:len(new) - len(cur)]
            cur, tags = new, ([] if starts else None)
            if not r["cont"]:
                break
            continue
        tags = [] if tags is None else tags
        if r["cont"] and new.endswith(cur):
            if len(new) > len(cur):
                tags.append((new[:len(new) - len(cur)], f))
            continue
        if f == 1 and new == cur:  # a last rule that keeps the name
            break
        return cur, tags, maybe, r["where"]
    return cur, tags or [], maybe, None


def cond_json(node, live):
    """A condition on the picks for the page: 1, 0.5 (a rule that may match: never shown), a pick, ["!", c],
    ["&", c...] or ["|", c...]."""
    if not isinstance(node, tuple):
        return node
    if node[0] == "w":
        return live[node[1][1:-1]][0]
    if node[0] == "!":
        return ["!", cond_json(node[1], live)]
    return ["&" if node[0] == "AND" else "|"] + [cond_json(c, live) for c in node[1]]


def compact(text):
    return re.sub("\xffc(.)", lambda m: MARK + m.group(1), text)


def work(k):
    """{case: (sockets, [(label without the open tags, [(tag, condition)])])} of one item (one version): each
    filter level's label where they differ, hidden ones left out; and the rules it couldn't split."""
    it, rs = ITEMS[k], RS
    live = symbols(it)
    name = G.game_name(it)
    by_code = defaultdict(list)
    for case, (nsock, outs) in LC.item_cases(it):
        by_code[case[0]].append((case, nsock, LC.values_for(it, case[0], case[1], nsock, case[3], case[4], outs)))
    out, odd = {}, set()
    for code, cases in by_code.items():
        b = LC.BASES[code]
        groups = T.item_groups(set(b["types"])) | {T.TIER_GROUP[b["tier"]]}
        static = LC.folding(rs, it, code, groups, [(c, v) for c, _, v in cases])
        mine = [(t, r) for r in rs.rules if (t := LC.fold(r["tree"], static)) != 0]
        levels = LC.level_reps(mine, rs.formulas)
        trees = {}
        for case, nsock, v in cases:
            m = LC.Model(rs, it.kind, code, groups, v, trees=trees, static=static)

            def word(w, m=m):
                if w.startswith("@ROLL_"):
                    sym = live.get(w[1:-1])
                    if sym and m.atom("@" + sym[1] + "@") == 1:
                        return None
                return m.atom(w)
            v["FILTLVL"] = None
            runs = [run(mine, m, word, name, b["name"])]
            if runs[0][2]:
                runs = []
                for lvl in levels:
                    v["FILTLVL"] = lvl
                    runs.append(run(mine, m, word, name, b["name"]))
            variants = out.get(case, (nsock, []))[1]  # two cube rows can give one outcome: both labels
            for cur, tags, _, where in runs:
                if where:
                    odd.add(f"{it.key}: {where} changes the name around its tags")
                if not tags and not LC.visible(LC.trim(cur)).strip():
                    continue  # hidden on this level
                entry = (compact(cur), tuple((compact(t), json.dumps(cond_json(c, live))) for t, c in tags))
                if entry not in variants:
                    variants.append(entry)
            out[case] = (nsock, variants)
    return k, out, sorted(odd)


# ---------------------------------------------------------------- corruption words

STAT_TEXT = None
SUMMARY = {"EDAM": "+{v}% Enhanced Damage", "ED": "+{v}% Enhanced Defense", "RES": "All Resistances +{v}",
           "ALLATTRIB": "+{v} to all Attributes", "MAXRES": "+{v}% to all Maximum Resistances",
           "MINDMG": "+{v} to Minimum Damage", "MAXDMG": "+{v} to Maximum Damage"}
STAT_OF = {name: sid for sid, name in P.NAMED.items()}


def stat_words(code, lo, hi):
    """A corruption's stat as the game words it (docs/pd2-stat-text.tsv: descfunc, descval, descstrpos)."""
    global STAT_TEXT
    if STAT_TEXT is None:
        rows = [l.split("\t") for l in P.STAT_TEXT_FILE.read_text(encoding="utf-8").splitlines()
                if l and not l.startswith("#")]
        STAT_TEXT = {int(r[0]): dict(zip(rows[0], r)) for r in rows[1:]}
    lo, hi = sorted((lo, hi))
    v = P.value_text(lo, hi)
    if code in SUMMARY:
        return SUMMARY[code].format(v=v)
    sid = STAT_OF.get(code) or (int(code[4:]) if re.fullmatch(r"STAT\d+", code) else None)
    st = STAT_TEXT.get(sid, {})
    text = st.get("descstrpos" if lo >= 0 else "descstrneg") or st.get("descstrpos")
    if not text:
        return f"{code} {v}"
    if "%d" in text:
        return text.replace("%d", v, 1)
    func, where = P.to_int(st.get("descfunc")), P.to_int(st.get("descval"))
    plus, s2 = "+" if lo >= 0 else "", st.get("descstr2", "")
    forms = {1: (f"{plus}{v}", ""), 2: (f"{v}%", ""), 3: (v, ""), 4: (f"{plus}{v}%", ""), 5: (f"{v}%", ""),
             6: (f"{plus}{v}", s2), 7: (f"{v}%", s2), 8: (f"{plus}{v}%", s2), 9: (v, s2), 12: (f"{plus}{v}", ""),
             20: (f"-{v}%", "")}
    num, tail = forms.get(func, (v, ""))
    return f"{text if where == 0 else f'{text} {num}' if where == 2 else f'{num} {text}'} {tail}".strip()


def outcome_words(props):
    """An outcome's properties in words: a property with a summary code (All Resistances) as that alone."""
    out = []
    for group in props:
        parts = group[:1] if group and group[0][0] in LC.DERIVED else group
        out += [stat_words(*p) for p in parts]
    return "; ".join(dict.fromkeys(out))


def words_of(it):
    """{outcome: words} of the corruptions the item's slot can get (socket outcomes: the sockets they add)."""
    nos, sock, socket_ids = LC.outcomes_of(it)
    out = defaultdict(list)
    for o in nos + sock:  # two cube rows can give one outcome (+10% or +20% Faster Cast Rate)
        text = outcome_words(o["props"])
        if text not in out[o["outcome"]]:
            out[o["outcome"]].append(text)
    out = {n: " or ".join(texts) for n, texts in out.items()}
    kind = G.CORRUPT_TYPE.get(it.where)
    for sid in socket_ids:
        n = [o["sockets"] for o in LC.CORRUPTIONS if o["type"] == kind and o["outcome"] == sid and o["sockets"]]
        out[sid] = f"Sockets ({min(n)}-{max(n)})" if n and min(n) != max(n) else "Sockets"
    return out


# ---------------------------------------------------------------- every item

class Table:
    """Values the page shares between items: each stored once, referred to by its index."""

    def __init__(self, first=()):
        self.ids, self.rows = {}, []
        for x in first:
            self.id(x)

    def id(self, value):
        key = json.dumps(value, ensure_ascii=False)
        if key not in self.ids:
            self.ids[key] = len(self.rows)
            self.rows.append(value)
        return self.ids[key]


def build(workers=None):
    """The page's data: ({item key: {gname, bases, wk, cases}}, shared tables), and notes on rules the run
    couldn't split into tags."""
    items, _ = LC.load()
    rules = G.read_cut_rules()
    picks = {}
    for it in items:  # every roll with a tag line picked
        keys = picks.setdefault(it.key, ([], False))[0]
        keys += [r["key"] for r in it.all_rolls if r["key"] and r["tagged"] and r["key"] not in keys]
    section = LC.section_text(items, picks)
    jobs = [k for k, it in enumerate(items) if it.game]
    workers = workers or min(8, multiprocessing.cpu_count())
    results, odd = {}, set()
    if workers > 1:
        ctx = multiprocessing.get_context("spawn")
        with ctx.Pool(workers, initializer=init, initargs=(section, items, rules)) as pool:
            for k, out, o in pool.imap_unordered(work, jobs, chunksize=1):
                results[k] = out
                odd.update(o)
    else:
        init(section, items, rules)
        for job in jobs:
            k, out, o = work(job)
            results[k] = out
            odd.update(o)
    strings, conds, lists = Table(), Table([1]), Table()
    words, data = {}, {}
    for k in jobs:
        it = items[k]
        d = data.setdefault(it.key, {"gname": G.game_name(it), "bases": [], "wk": None, "cases": defaultdict(dict)})
        wk = f"{G.CORRUPT_TYPE.get(it.where)}|{it.kind}"
        words.setdefault(wk, {})
        for outcome, text in words_of(it).items():
            words[wk].setdefault(str(outcome), text)
        d["wk"] = wk
        codes = [b[0] for b in d["bases"]]
        for case, (nsock, vs) in results[k].items():
            code = case[0]
            if code not in codes:
                codes.append(code)
                b = LC.BASES[code]
                d["bases"].append([code, G.base_name(code, b["name"]), 0])
            bi = codes.index(code)
            d["bases"][bi][2] = max(d["bases"][bi][2], nsock)
            ids = d["cases"][(bi, case[1], case[2])].setdefault((case[3], case[4]), [])
            for rest, tags in vs:
                pair = [strings.id(rest), lists.id([[strings.id(t), conds.id(json.loads(c))] for t, c in tags])]
                if not any(ids[i:i + 2] == pair for i in range(0, len(ids), 2)):
                    ids += pair
    for d in data.values():  # [base, eth, sockets, [[corruption, desecration, (rest, tags)...]...]]
        d["cases"] = [[*state, [[*c, *ids] for c, ids in got.items() if ids]] for state, got in d["cases"].items()]
        d["cases"] = [c for c in d["cases"] if c[3]]
    tables = {"S": strings.rows, "C": conds.rows, "T": lists.rows, "W": words, "colors": COLORS}
    return data, tables, sorted(odd)


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="The roll picker's labels of unique and set items.")
    ap.add_argument("name")
    args = ap.parse_args()
    items, _ = LC.load()
    keep = {it.key for it in items if args.name.lower() in it.key.lower()}
    data, tables, odd = build()
    for msg in odd:
        print(f"note: {msg}")
    S, C, Tl = tables["S"], tables["C"], tables["T"]
    show = lambda s: re.sub(MARK + ".", "", s).encode("unicode_escape").decode()  # noqa: E731
    for key in sorted(keep):
        d = data.get(key)
        if not d:
            continue
        print(f"{key}: {sum(len(c[3]) for c in d['cases'])} cases; bases {d['bases']}")
        for bi, eth, sock, corr in d["cases"]:
            for c360, c206, *pairs in corr:
                print(f"  {d['bases'][bi][0]} eth={eth} sock={sock} corrupt={c360}/{c206} "
                      f"{tables['W'][d['wk']].get(str(c360), '') if c360 else ''}")
                for rest, tl in zip(pairs[::2], pairs[1::2]):
                    print(f"      rest {show(S[rest])!r}")
                    for si, ci in Tl[tl]:
                        print(f"      tag {show(S[si])!r} when {json.dumps(C[ci])}")


if __name__ == "__main__":
    main()
